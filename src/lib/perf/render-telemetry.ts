/**
 * FAJREZZZ AI OFFICE — RENDER TELEMETRY & SHARPNESS POLICY (Single Source of Truth)
 *
 * Aturan emas (jangan diubah tanpa alasan teknis kuat):
 *  1. TARGET_FPS = 120 (layar POCO X8 Pro Max & flagship lain mendukung 120 Hz).
 *     Target TIDAK pernah dipakai sebagai "FPS hasil". Angka aktual selalu hasil
 *     pengukuran timestamp frame (`performance.now()`).
 *  2. pixelRatio TIDAK PERNAH turun di bawah 1.0 (1 CSS px = 1 device px).
 *     Di bawah 1.0 browser melakukan upscaling -> gambar burik/pixelated.
 *  3. Penurunan kualitas saat FPS rendah mengutamakan efek (shadow/bloom/fog)
 *     lebih dulu; resolusi render adalah pertahanan terakhir.
 *  4. Zoom kamera tidak boleh memicu perubahan resolusi render (tidak ada
 *     dynamic resolution per-zoom) supaya tidak ada blur mendadak saat zoom.
 */

import type { PerformanceMode } from "@/types/office";

/** Target refresh/rendering. POCO X8 Pro Max: panel 120 Hz. */
export const TARGET_FPS = 120;

/** Batas bawah mutlak pixel ratio. 1.0 = tanpa upscaling blur. */
export const ABSOLUTE_MIN_PIXEL_RATIO = 1;

/**
 * Batas atas pixel ratio per tier.
 * POCO X8 Pro Max: CSS ~393x873 dp dengan DPR ~2.75 (panel 1080x2400).
 *  - balanced 2.0x  -> buffer ~786x1746 (tajam, teks 3D & tepi objek bersih)
 *  - eco      1.5x  -> buffer ~590x1310 (masih di atas 1.0x, tidak upscaling blur)
 *  Di atas 2.0x biaya GPU naik kuadratik tanpa kenaikan ketajaman yang terlihat.
 */
export const PIXEL_RATIO_CAPS: Record<PerformanceMode, number> = {
  high: 2.5,
  balanced: 2,
  eco: 1.5,
};

export type RenderStatus = "excellent" | "good" | "limited" | "heavy";

export interface RenderTelemetry {
  /** FPS hasil pengukuran frame aktual (rolling window). */
  actualFps: number;
  /** Rata-rata frame time aktual dalam milidetik. */
  frameTimeMs: number;
  /** Target FPS perangkat/browser (bukan hasil pengukuran). */
  targetFps: number;
  /** gl.getPixelRatio() yang sedang aktif. */
  pixelRatio: number;
  /** Ukuran drawing buffer WebGL (buffer render aktual). */
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  /** Ukuran canvas CSS (layout). */
  cssWidth: number;
  cssHeight: number;
  status: RenderStatus;
  statusLabel: string;
  /** Penjelasan jujur saat perangkat/browser membatasi refresh rate. */
  refreshCapNote: string | null;
  /** Jumlah frame di window pengukuran terakhir (transparansi sampel). */
  sampledFrames: number;
  /** Estimasi refresh layar/browser yang terdeteksi (null jika belum pasti). */
  detectedRefreshHz: number | null;
  /** Draw call frame terakhir (diagnostik GPU). */
  drawCalls: number;
  /** Jumlah triangle frame terakhir (diagnostik GPU). */
  triangles: number;
}

export const INITIAL_RENDER_TELEMETRY: RenderTelemetry = {
  actualFps: 0,
  frameTimeMs: 0,
  targetFps: TARGET_FPS,
  pixelRatio: 1,
  drawingBufferWidth: 0,
  drawingBufferHeight: 0,
  cssWidth: 0,
  cssHeight: 0,
  status: "good",
  statusLabel: "Mengukur…",
  refreshCapNote: null,
  sampledFrames: 0,
  detectedRefreshHz: null,
  drawCalls: 0,
  triangles: 0,
};

export function resolvePixelRatio(
  mode: PerformanceMode,
  devicePixelRatio: number
): number {
  const dpr =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;
  return Math.max(
    ABSOLUTE_MIN_PIXEL_RATIO,
    Math.min(dpr, PIXEL_RATIO_CAPS[mode])
  );
}

/**
 * DPR yang "makin HD saat zoom in".
 *
 * Prinsip pengguna: makin di-zoom in, gambar harus makin tajam (bukan makin blur),
 * dan zoom out TIDAK menurunkan resolusi. Jadi resolusi render dinaikkan saat kamera
 * dekat (objek memenuhi layar -> tepi objek butuh piksel lebih banyak), dengan plafon
 * perangkat & tier supaya GPU tidak jebol:
 *  - zoom >= 145%  -> +45% pixel ratio (maks. deviceDPR, plafon tier)
 *  - zoom >= 115%  -> +22%
 *  - zoom <  115%  -> pixel ratio dasar tier (tidak pernah turun di bawah 1.0)
 * Nilai selalu dibulatkan ke 0.05 supaya tidak ada perubahan resolusi tiap frame.
 */
export function resolveZoomSharpenedPixelRatio(
  mode: PerformanceMode,
  devicePixelRatio: number,
  zoomPct: number
): number {
  const base = resolvePixelRatio(mode, devicePixelRatio);
  const dpr =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;
  const tierCeiling: Record<PerformanceMode, number> = {
    high: 3,
    balanced: 2.6,
    eco: 2,
  };
  const ceiling = Math.min(dpr, Math.max(base, tierCeiling[mode]));
  const boost = zoomPct >= 145 ? 1.45 : zoomPct >= 115 ? 1.22 : 1;
  const boosted = base * boost;
  const clamped = Math.max(ABSOLUTE_MIN_PIXEL_RATIO, Math.min(ceiling, boosted));
  return Math.round(clamped * 20) / 20;
}

const REFRESH_CANDIDATES = [120, 90, 60, 48];

/**
 * Klasifikasi FPS aktual + penjelasan batas refresh.
 * `jitterMs` = deviasi frame time; dipakai agar angka acak tidak dilaporkan
 * sebagai "dibatasi refresh layar".
 */
export function classifyRenderPerformance(
  fps: number,
  jitterMs: number
): { status: RenderStatus; statusLabel: string; refreshCapNote: string | null } {
  if (!Number.isFinite(fps) || fps <= 0) {
    return {
      status: "good",
      statusLabel: "Mengukur…",
      refreshCapNote: null,
    };
  }

  const status: RenderStatus =
    fps >= 105 ? "excellent" : fps >= 50 ? "good" : fps >= 28 ? "limited" : "heavy";

  const statusLabel =
    status === "excellent"
      ? "Smooth 120-class"
      : status === "good"
        ? fps >= 85
          ? "Smooth 90-class"
          : "Smooth 60-class"
        : status === "limited"
          ? "Terbatas"
          : "Berat";

  // Deteksi jujur: hanya sebut "dibatasi refresh" bila frame time stabil
  // (jitter kecil) dan FPS menempel di angka refresh umum.
  let refreshCapNote: string | null = null;
  if (jitterMs < 3.5) {
    for (const hz of REFRESH_CANDIDATES) {
      if (Math.abs(fps - hz) <= Math.max(2, hz * 0.04)) {
        refreshCapNote =
          hz >= 120
            ? null
            : `Kemungkinan dibatasi ~${hz} Hz oleh browser/refresh layar (bukan target 120).`;
        break;
      }
    }
  }

  if (!refreshCapNote && fps < 50) {
    refreshCapNote =
      "FPS aktual di bawah target: bottleneck GPU/CPU, bukan batas refresh layar.";
  }

  return { status, statusLabel, refreshCapNote };
}

/** Estimasi refresh layar dari FPS tertinggi yang pernah stabil terukur. */
export function estimateRefreshHz(
  observedMaxFps: number,
  previous: number | null
): number | null {
  if (!Number.isFinite(observedMaxFps) || observedMaxFps <= 0) return previous;
  const match = REFRESH_CANDIDATES.find(
    (hz) => observedMaxFps >= hz - Math.max(2, hz * 0.05)
  );
  if (!match) return previous;
  return previous === null ? match : Math.max(previous, match);
}

export interface DeviceCapability {
  isMobileViewport: boolean;
  isMobileUa: boolean;
  cores: number;
  memoryGb: number | null;
  devicePixelRatio: number;
  coarsePointer: boolean;
  gpuRenderer: string | null;
}

/** Deteksi kemampuan perangkat (client-side, aman di SSR). */
export function detectDeviceCapability(): DeviceCapability {
  if (typeof window === "undefined") {
    return {
      isMobileViewport: false,
      isMobileUa: false,
      cores: 8,
      memoryGb: null,
      devicePixelRatio: 1,
      coarsePointer: false,
      gpuRenderer: null,
    };
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  return {
    isMobileViewport: window.innerWidth < 768,
    isMobileUa: /Android|iPhone|iPad|Mobile/i.test(nav.userAgent),
    cores: nav.hardwareConcurrency ?? 4,
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    devicePixelRatio: window.devicePixelRatio || 1,
    coarsePointer:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
    gpuRenderer: null,
  };
}

/**
 * Pilih tier awal. Perangkat Android modern (POCO X8 Pro Max / Dimensity 9400,
 * 8+ core, RAM 8-12GB) dipetakan ke `balanced` (bukan `eco`) supaya tekstur,
 * anti-aliasing, dan shadow tetap tajam; `eco` hanya untuk perangkat lemah.
 */
export function recommendPerformanceMode(cap: DeviceCapability): PerformanceMode {
  const weakCores = cap.cores > 0 && cap.cores <= 4;
  const weakMemory = cap.memoryGb !== null && cap.memoryGb <= 3;
  if (weakCores || weakMemory) return "eco";

  const strongCores = cap.cores >= 8;
  const enoughMemory = cap.memoryGb === null || cap.memoryGb >= 6;
  const mobile = cap.isMobileViewport || cap.isMobileUa || cap.coarsePointer;

  if (strongCores && enoughMemory && !mobile) return "high";
  return "balanced";
}

/** Label resolusi mis. "2400×1080 @1.75x". */
export function formatRenderResolution(
  t: Pick<
    RenderTelemetry,
    "drawingBufferWidth" | "drawingBufferHeight" | "cssWidth" | "cssHeight" | "pixelRatio"
  >
): string {
  if (!t.drawingBufferWidth || !t.drawingBufferHeight) return "–";
  const css =
    t.cssWidth && t.cssHeight ? ` · CSS ${t.cssWidth}×${t.cssHeight}` : "";
  return `${t.drawingBufferWidth}×${t.drawingBufferHeight} @${t.pixelRatio.toFixed(2)}x${css}`;
}

/** Shadow map budget per tier (menjaga GPU tetap dingin). */
export function shadowMapSizeFor(mode: PerformanceMode): number {
  if (mode === "high") return 2048;
  if (mode === "balanced") return 1024;
  return 0;
}

/** Sampling shadow update: 0 = setiap frame (high), N = tiap N frame. */
export function shadowUpdateStrideFor(mode: PerformanceMode): number {
  if (mode === "high") return 1;
  if (mode === "balanced") return 3;
  return 0;
}
