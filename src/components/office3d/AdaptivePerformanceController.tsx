"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useOffice } from "@/store/OfficeContext";

/**
 * Automatic Mobile-First Adaptive 3D Performance Controller (Section C & D).
 *
 * Replaces manual Eco/Balanced/High buttons with continuous real-time FPS telemetry:
 * - Detects mobile/touch vs desktop hardware capabilities once.
 * - Samples frame delta over a 2-second rolling window (zero per-frame React state churn).
 * - Dynamically tunes WebGL pixel ratio (`gl.setPixelRatio`) and internal performance tier
 *   so Android stays smooth (>= 30 FPS) and desktop stays sharp (>= 55 FPS).
 */
export function AdaptivePerformanceController() {
  const { gl } = useThree();
  const { performanceMode, setPerformanceMode, setAdaptiveFps } = useOffice();

  const frameCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const lowStreakRef = useRef(0);
  const highStreakRef = useRef(0);
  const modeRef = useRef(performanceMode);
  const isMobileRef = useRef(false);

  useEffect(() => {
    modeRef.current = performanceMode;
  }, [performanceMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile =
      window.innerWidth < 768 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    isMobileRef.current = isMobile;
    const cores = navigator.hardwareConcurrency || 4;
    const initialMode = isMobile || cores <= 4 ? "eco" : cores >= 8 ? "high" : "balanced";
    setPerformanceMode(initialMode);

    const maxDpr = isMobile ? 1.25 : Math.min(window.devicePixelRatio || 1, 1.85);
    gl.setPixelRatio(maxDpr);
  }, [gl, setPerformanceMode]);

  useFrame((_state, delta) => {
    const clampedDelta = Math.min(delta, 0.25);
    frameCountRef.current += 1;
    elapsedRef.current += clampedDelta;

    if (elapsedRef.current < 2.0) return;

    const avgFps = Math.round(frameCountRef.current / Math.max(0.01, elapsedRef.current));
    frameCountRef.current = 0;
    elapsedRef.current = 0;

    setAdaptiveFps(avgFps);

    const current = modeRef.current;
    const isMobile = isMobileRef.current;

    if (avgFps < 28) {
      lowStreakRef.current += 1;
      highStreakRef.current = 0;
      if (lowStreakRef.current >= 2) {
        if (current === "high") {
          setPerformanceMode("balanced");
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
        } else if (current === "balanced") {
          setPerformanceMode("eco");
          gl.setPixelRatio(isMobile ? 0.9 : 1.05);
        } else {
          gl.setPixelRatio(0.82);
        }
        lowStreakRef.current = 0;
      }
    } else if (avgFps >= 52 && !isMobile) {
      highStreakRef.current += 1;
      lowStreakRef.current = 0;
      if (highStreakRef.current >= 3) {
        if (current === "eco") {
          setPerformanceMode("balanced");
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        } else if (current === "balanced") {
          setPerformanceMode("high");
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
        }
        highStreakRef.current = 0;
      }
    } else {
      lowStreakRef.current = 0;
      highStreakRef.current = 0;
    }
  });

  return null;
}
