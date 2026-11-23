/**
 * TEST V7 — Visual Sharpness & Real FPS Telemetry Policy
 *
 * Memverifikasi aturan yang diminta klien:
 *  - FPS aktual TIDAK boleh dikarang dari target (target tetap 120).
 *  - Pixel ratio tidak pernah < 1.0 (tidak ada upscaling blur).
 *  - Klaim "dibatasi refresh" hanya muncul saat frame time stabil.
 *  - Tier perangkat flagship Android tidak dijatuhkan ke eco (blur).
 */

import assert from "node:assert/strict";
import {
  ABSOLUTE_MIN_PIXEL_RATIO,
  PIXEL_RATIO_CAPS,
  TARGET_FPS,
  classifyRenderPerformance,
  estimateRefreshHz,
  formatRenderResolution,
  recommendPerformanceMode,
  resolvePixelRatio,
  shadowMapSizeFor,
  shadowUpdateStrideFor,
  type DeviceCapability,
} from "../src/lib/perf/render-telemetry.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

test("Target FPS adalah 120 dan tidak dipakai sebagai hasil pengukuran", () => {
  assert.equal(TARGET_FPS, 120);
});

test("Pixel ratio tidak pernah turun di bawah 1.0 (anti upscaling blur)", () => {
  assert.equal(ABSOLUTE_MIN_PIXEL_RATIO, 1);
  assert.equal(resolvePixelRatio("eco", 0.75), 1);
  assert.equal(resolvePixelRatio("balanced", 0.5), 1);
  // POCO X8 Pro Max (DPR ~2.75) -> dibatasi per tier, bukan 1.25x seperti sebelumnya
  assert.equal(resolvePixelRatio("balanced", 2.75), 2);
  assert.equal(resolvePixelRatio("eco", 2.75), 1.5);
  assert.equal(resolvePixelRatio("high", 2.75), 2.5);
  for (const mode of ["eco", "balanced", "high"] as const) {
    assert.ok(resolvePixelRatio(mode, 3) <= PIXEL_RATIO_CAPS[mode]);
    assert.ok(resolvePixelRatio(mode, 3) >= 1);
  }
});

test("FPS 118 dianggap excellent tanpa klaim batas refresh", () => {
  const r = classifyRenderPerformance(118, 2.1);
  assert.equal(r.status, "excellent");
  assert.equal(r.refreshCapNote, null);
});

test("FPS ~60 dengan frame time stabil dilaporkan jujur sebagai batas refresh", () => {
  const r = classifyRenderPerformance(60, 1.4);
  assert.equal(r.status, "good");
  assert.match(r.refreshCapNote ?? "", /60 Hz/);
  assert.doesNotMatch(r.refreshCapNote ?? "", /~120 Hz/);
});

test("FPS rendah dengan frame time berjitter TIDAK diklaim sebagai batas refresh", () => {
  const r = classifyRenderPerformance(44, 9.5);
  assert.equal(r.status, "limited");
  assert.match(r.refreshCapNote ?? "", /bottleneck/i);
});

test("FPS 20 diklasifikasikan berat", () => {
  const r = classifyRenderPerformance(20, 14);
  assert.equal(r.status, "heavy");
});

test("Estimasi refresh layar hanya naik dari FPS tertinggi yang benar-benar terukur", () => {
  const first = estimateRefreshHz(58, null);
  assert.equal(first, 60);
  const second = estimateRefreshHz(118, first);
  assert.equal(second, 120);
  const keep = estimateRefreshHz(30, 120);
  assert.equal(keep, 120);
});

test("Tier perangkat: flagship Android tetap tajam (balanced), bukan eco", () => {
  const flagship: DeviceCapability = {
    isMobileViewport: true,
    isMobileUa: true,
    cores: 8,
    memoryGb: 12,
    devicePixelRatio: 2.75,
    coarsePointer: true,
    gpuRenderer: "Adreno (TM) 830",
  };
  assert.equal(recommendPerformanceMode(flagship), "balanced");

  const weak: DeviceCapability = {
    ...flagship,
    cores: 4,
    memoryGb: 3,
  };
  assert.equal(recommendPerformanceMode(weak), "eco");

  const desktop: DeviceCapability = {
    isMobileViewport: false,
    isMobileUa: false,
    cores: 12,
    memoryGb: 16,
    devicePixelRatio: 1,
    coarsePointer: false,
    gpuRenderer: "NVIDIA GeForce RTX 4070",
  };
  assert.equal(recommendPerformanceMode(desktop), "high");
});

test("Shadow budget per tier (eco tanpa shadow, balanced 1K, high 2K)", () => {
  assert.equal(shadowMapSizeFor("eco"), 0);
  assert.equal(shadowMapSizeFor("balanced"), 1024);
  assert.equal(shadowMapSizeFor("high"), 2048);
  assert.equal(shadowUpdateStrideFor("high"), 1);
  assert.ok(shadowUpdateStrideFor("balanced") > 1);
  assert.equal(shadowUpdateStrideFor("eco"), 0);
});

test("Label resolusi render menampilkan drawing buffer + CSS + DPR", () => {
  const label = formatRenderResolution({
    drawingBufferWidth: 786,
    drawingBufferHeight: 1746,
    cssWidth: 393,
    cssHeight: 873,
    pixelRatio: 2,
  });
  assert.match(label, /786×1746/);
  assert.match(label, /2\.00x/);
  assert.match(label, /CSS 393×873/);
});

console.log(`\n# tests ${passed}`);
console.log(`# pass ${passed}`);
console.log("# fail 0");
