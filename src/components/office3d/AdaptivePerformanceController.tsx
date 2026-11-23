"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useOffice } from "@/store/OfficeContext";
import { useSimulator } from "@/store/SimulatorContext";
import {
  TARGET_FPS,
  classifyRenderPerformance,
  detectDeviceCapability,
  estimateRefreshHz,
  resolvePixelRatio,
  resolveZoomSharpenedPixelRatio,
  type DeviceCapability,
} from "@/lib/perf/render-telemetry";

/**
 * ADAPTIVE PERFORMANCE & REAL FPS TELEMETRY CONTROLLER
 *
 * Prinsip:
 *  - FPS diukur dari timestamp frame aktual (`performance.now()`), BUKAN dari target.
 *  - Target 120 FPS hanya ditampilkan sebagai target, tidak pernah sebagai hasil.
 *  - Kualitas visual (pixel ratio, anti-aliasing, tekstur) TIDAK diturunkan karena zoom.
 *  - Saat FPS rendah: turunkan tier efek (bloom/shadow) lebih dulu, baru pixel ratio,
 *    dengan lantai mutlak 1.0x supaya gambar tidak pernah di-upscale (tidak burik).
 *  - Perubahan pixel ratio dibatasi (step 0.1x + cooldown) agar tidak ada lompatan
 *    resolusi mendadak saat kamera bergerak / zoom.
 */
export function AdaptivePerformanceController() {
  const { gl } = useThree();
  const {
    performanceMode,
    setPerformanceMode,
    setAdaptiveFps,
    setRenderTelemetry,
  } = useOffice();

  const { zoomPct } = useSimulator();
  const zoomRef = useRef(zoomPct);
  const modeRef = useRef(performanceMode);
  const capRef = useRef<DeviceCapability | null>(null);

  // Rolling measurement window (frame timestamps, bukan jumlah frame per detik target)
  const windowDeltasRef = useRef<number[]>([]);
  const lastFrameTsRef = useRef<number | null>(null);
  const lastPublishTsRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);

  // Smoothing supaya angka tidak melonjak
  const emaFpsRef = useRef(0);
  const emaFrameMsRef = useRef(0);
  const observedMaxFpsRef = useRef(0);
  const detectedHzRef = useRef<number | null>(null);

  // Governance
  const lowStreakRef = useRef(0);
  const highStreakRef = useRef(0);
  const lastTierChangeRef = useRef(0);
  const lastDprChangeRef = useRef(0);
  const appliedDprRef = useRef(1);
  const hasRealFrameRef = useRef(false);

  const vectorTmp = useRef(new THREE.Vector2());

  useEffect(() => {
    modeRef.current = performanceMode;
  }, [performanceMode]);

  useEffect(() => {
    zoomRef.current = zoomPct;
  }, [zoomPct]);

  // Inisialisasi DPR & profil perangkat sekali (bukan per zoom)
  useEffect(() => {
    const cap = detectDeviceCapability();
    capRef.current = cap;
    const ratio = resolvePixelRatio(modeRef.current, cap.devicePixelRatio);
    appliedDprRef.current = ratio;
    gl.setPixelRatio(ratio);
    startedAtRef.current = performance.now();
  }, [gl]);

  // Perubahan tier: sesuaikan pixel ratio ke batas tier baru (tanpa turun di bawah 1.0)
  useEffect(() => {
    const cap = capRef.current;
    if (!cap) return;
    const target = resolvePixelRatio(performanceMode, cap.devicePixelRatio);
    if (Math.abs(target - appliedDprRef.current) > 0.001) {
      appliedDprRef.current = target;
      gl.setPixelRatio(target);
      lastDprChangeRef.current = performance.now();
    }
    lowStreakRef.current = 0;
    highStreakRef.current = 0;
  }, [performanceMode, gl]);

  /**
   * ZOOM-AWARE SHARPNESS: makin di-zoom in, resolusi render ikut naik (maks. cap
   * tier & DPR perangkat). Dibatasi agar tidak menurunkan FPS di bawah ambang sehat:
   * hanya diterapkan bila FPS terukur masih >= 50 (mobile) / 80 (desktop).
   */
  useEffect(() => {
    const cap = capRef.current;
    if (!cap) return;
    const healthyFps = cap.isMobileViewport || cap.isMobileUa ? 50 : 80;
    if (emaFpsRef.current > 0 && emaFpsRef.current < healthyFps) return;

    const target = resolveZoomSharpenedPixelRatio(
      performanceMode,
      cap.devicePixelRatio,
      zoomPct
    );
    if (Math.abs(target - appliedDprRef.current) > 0.001) {
      appliedDprRef.current = target;
      gl.setPixelRatio(target);
      lastDprChangeRef.current = performance.now();
    }
  }, [zoomPct, performanceMode, gl]);

  useFrame(() => {
    const now = performance.now();
    const last = lastFrameTsRef.current;
    lastFrameTsRef.current = now;

    if (typeof document !== "undefined" && document.hidden) {
      windowDeltasRef.current.length = 0;
      return;
    }

    if (last === null) return;
    const deltaMs = now - last;

    // Frame hitch besar (tab switch, restore context, GC) tidak boleh merusak rata-rata
    if (deltaMs <= 0 || deltaMs > 250) {
      windowDeltasRef.current.length = 0;
      return;
    }

    windowDeltasRef.current.push(deltaMs);
    if (!hasRealFrameRef.current) hasRealFrameRef.current = true;

    // Publikasi ~1x/detik (rolling window ~1 detik)
    const windowElapsed = now - lastPublishTsRef.current;
    if (windowElapsed < 950) return;

    const deltas = windowDeltasRef.current;
    if (deltas.length < 4) return;

    const sum = deltas.reduce((acc, d) => acc + d, 0);
    const measuredFps = (deltas.length * 1000) / sum;
    const meanFrameMs = sum / deltas.length;
    const variance =
      deltas.reduce((acc, d) => acc + (d - meanFrameMs) ** 2, 0) / deltas.length;
    const jitterMs = Math.sqrt(variance);

    // EMA: stabil namun tetap responsif
    emaFpsRef.current =
      emaFpsRef.current === 0
        ? measuredFps
        : emaFpsRef.current * 0.62 + measuredFps * 0.38;
    emaFrameMsRef.current =
      emaFrameMsRef.current === 0
        ? meanFrameMs
        : emaFrameMsRef.current * 0.62 + meanFrameMs * 0.38;

    const smoothFps = emaFpsRef.current;
    const smoothFrameMs = emaFrameMsRef.current;

    observedMaxFpsRef.current = Math.max(observedMaxFpsRef.current, measuredFps);
    detectedHzRef.current = estimateRefreshHz(
      observedMaxFpsRef.current,
      detectedHzRef.current
    );

    const { status, statusLabel, refreshCapNote } = classifyRenderPerformance(
      smoothFps,
      jitterMs
    );

    const size = vectorTmp.current;
    gl.getDrawingBufferSize(size);
    const canvasEl = gl.domElement;

    setAdaptiveFps(Math.round(smoothFps));
    setRenderTelemetry({
      actualFps: Math.round(smoothFps),
      frameTimeMs: Number(smoothFrameMs.toFixed(1)),
      targetFps: TARGET_FPS,
      pixelRatio: Number(gl.getPixelRatio().toFixed(2)),
      drawingBufferWidth: Math.round(size.x),
      drawingBufferHeight: Math.round(size.y),
      cssWidth: canvasEl.clientWidth,
      cssHeight: canvasEl.clientHeight,
      status,
      statusLabel,
      refreshCapNote,
      sampledFrames: deltas.length,
      detectedRefreshHz: detectedHzRef.current,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    });

    deltas.length = 0;
    lastPublishTsRef.current = now;

    // Jangan bereaksi pada 1.5 detik pertama (masih kompilasi shader / warm-up)
    if (now - startedAtRef.current < 1500) return;

    // ---------------- Governance: jaga FPS tanpa mengorbankan ketajaman ----------
    const mode = modeRef.current;
    const isMobile =
      capRef.current?.isMobileViewport || capRef.current?.isMobileUa || false;

    if (smoothFps < 45) {
      lowStreakRef.current += 1;
      highStreakRef.current = 0;
    } else if (smoothFps >= (isMobile ? 75 : 100)) {
      highStreakRef.current += 1;
      lowStreakRef.current = 0;
    } else {
      lowStreakRef.current = 0;
      highStreakRef.current = 0;
    }

    // 1) Turunkan biaya efek lebih dulu (bloom/shadow/fog) — ketajaman tetap
    if (lowStreakRef.current >= 2 && now - lastTierChangeRef.current > 5000) {
      if (mode === "high") {
        setPerformanceMode("balanced");
        lastTierChangeRef.current = now;
      } else if (mode === "balanced") {
        setPerformanceMode("eco");
        lastTierChangeRef.current = now;
      } else {
        // 2) Tier terendah: baru turunkan pixel ratio, step 0.1x, lantai 1.0x
        const floor = 1;
        if (
          appliedDprRef.current > floor + 0.001 &&
          now - lastDprChangeRef.current > 5000
        ) {
          const next = Math.max(floor, appliedDprRef.current - 0.1);
          appliedDprRef.current = next;
          gl.setPixelRatio(next);
          lastDprChangeRef.current = now;
        }
      }
      lowStreakRef.current = 0;
    }

    // 3) Naikkan kembali kualitas bila sudah stabil (tangga perlahan, tanpa lompatan)
    if (highStreakRef.current >= 3 && now - lastTierChangeRef.current > 9000) {
      if (mode === "eco") {
        setPerformanceMode("balanced");
        lastTierChangeRef.current = now;
      } else if (mode === "balanced" && !isMobile) {
        setPerformanceMode("high");
        lastTierChangeRef.current = now;
      } else {
        const capRatio = resolvePixelRatio(
          mode,
          capRef.current?.devicePixelRatio ?? 1
        );
        if (
          appliedDprRef.current < capRatio - 0.001 &&
          now - lastDprChangeRef.current > 7000
        ) {
          const next = Math.min(capRatio, appliedDprRef.current + 0.1);
          appliedDprRef.current = next;
          gl.setPixelRatio(next);
          lastDprChangeRef.current = now;
        }
      }
      highStreakRef.current = 0;
    }
  });

  return null;
}
