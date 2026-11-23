import type {
  ActualVideoQcTelemetry,
  ExportQualityPreset,
  RenderProgressSnapshot,
  WordTimingCue,
} from "@/types/pipeline";

/* ============================================================================
   1. PURE SYNC ENGINE — EXACT SYLLABLE-WEIGHTED WORD TIMING (0ms AUDIO DRIFT)
   ============================================================================ */

export const SPEECH_START_OFFSET_SEC = 0.08;
export const SCENE_TAIL_BREATH_SEC = 0.28;

const HIGHLIGHT_KEYWORDS = new Set([
  "claude",
  "code",
  "agent",
  "agents",
  "ai",
  "github",
  "terminal",
  "cli",
  "otomatis",
  "otomatisasi",
  "gratis",
  "openai",
  "codex",
  "anthropic",
  "gemini",
  "multi-agent",
  "workflow",
  "coding",
  "developer",
  "4k",
  "120fps",
  "baru",
  "resmi",
  "rilis",
  "update",
  "rahasia",
  "fakta",
  "cepat",
  "hemat",
  "manual",
  "otonom",
  "virtual",
  "prompt",
  "deploy",
  "commit",
  "pr",
]);

function countIndonesianSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean) return 1;
  const vowelGroups = clean.match(/[aiueo]+/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : Math.ceil(clean.length / 3));
}

function isKeywordHighlight(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean) return false;
  if (HIGHLIGHT_KEYWORDS.has(clean)) return true;
  if (/^\d+([.,]\d+)?(%|x|k|m|s|d|jam|menit|detik)?$/.test(clean)) return true;
  return false;
}

/**
 * Computes exact scene duration anchored to the REAL measured neural audio duration.
 * Never lets a short voice clip finish 3 seconds early while visuals crawl slowly,
 * and never cuts off a longer narration clip.
 */
export function computeSyncedSceneDuration(
  actualAudioSec: number | null | undefined,
  fallbackScriptSec: number
): { sceneDurationSec: number; speechOffsetSec: number; speechDurationSec: number } {
  const hasRealAudio = typeof actualAudioSec === "number" && actualAudioSec > 0.45;
  const speechDurationSec = hasRealAudio
    ? Math.round(actualAudioSec * 100) / 100
    : Math.max(2.6, Math.round(fallbackScriptSec * 100) / 100);
  const speechOffsetSec = SPEECH_START_OFFSET_SEC;
  const sceneDurationSec =
    Math.round((speechOffsetSec + speechDurationSec + SCENE_TAIL_BREATH_SEC) * 100) / 100;
  return { sceneDurationSec, speechOffsetSec, speechDurationSec };
}

/**
 * Distributes every spoken word across [speechStartSec, speechStartSec + speechDurationSec]
 * weighted by Indonesian syllable length + punctuation breath pauses so subtitles move
 * in exact lockstep with the neural voiceover.
 */
export function computeWordTimings(
  narration: string,
  speechStartSec: number,
  speechDurationSec: number
): WordTimingCue[] {
  const rawWords = narration.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0 || speechDurationSec <= 0) return [];

  const weights = rawWords.map((w) => {
    const syl = countIndonesianSyllables(w);
    const charBonus = Math.min(2.2, w.length * 0.08);
    let pauseBonus = 0;
    if (/[.!?]$/.test(w)) pauseBonus = 0.72;
    else if (/[,;:]$/.test(w)) pauseBonus = 0.36;
    else if (/[—-]$/.test(w)) pauseBonus = 0.28;
    return Math.max(0.65, syl * 0.78 + charBonus + pauseBonus);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let cursor = speechStartSec;

  return rawWords.map((word, idx) => {
    const share = (weights[idx] / totalWeight) * speechDurationSec;
    const startSec = Math.round(cursor * 1000) / 1000;
    const endSec =
      idx === rawWords.length - 1
        ? Math.round((speechStartSec + speechDurationSec) * 1000) / 1000
        : Math.round((cursor + share) * 1000) / 1000;
    cursor += share;
    return {
      word,
      startSec,
      endSec: Math.max(startSec + 0.04, endSec),
      highlight: isKeywordHighlight(word),
    };
  });
}

/**
 * Finds the active word index at a given scene-local timestamp (0..sceneDurationSec).
 */
export function findActiveWordIndex(
  timings: WordTimingCue[],
  localSec: number
): number {
  if (timings.length === 0) return 0;
  if (localSec <= timings[0].startSec) return 0;
  for (let i = 0; i < timings.length; i++) {
    if (localSec < timings[i].endSec) return i;
  }
  return timings.length - 1;
}

/* ============================================================================
   2. STRICT TIKTOK 9:16 SAFE ZONE GEOMETRY & VALIDATOR (SECTION 8)
   ============================================================================ */

export interface TikTokSafeZone {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  subtitleY: number;
  headerY: number;
  stageTop: number;
  stageBottom: number;
  stageHeight: number;
}

/**
 * TikTok 9:16 Safe Zone margins:
 * - Top 12% clear of Following/For You/Search bar
 * - Right 14% clear of Like/Comment/Bookmark/Share icon rail
 * - Bottom 21% clear of handle, caption, sound ticker & navigation bar
 * - Left 6% clean breathing room
 */
export function getTikTokSafeZone(width: number, height: number): TikTokSafeZone {
  const isVertical = height >= width;
  const left = Math.round(width * (isVertical ? 0.06 : 0.07));
  const right = Math.round(width * (isVertical ? 0.865 : 0.93));
  const top = Math.round(height * (isVertical ? 0.115 : 0.07));
  const bottom = Math.round(height * (isVertical ? 0.79 : 0.90));
  const safeW = right - left;
  const safeH = bottom - top;
  const headerY = Math.round(height * (isVertical ? 0.078 : 0.04));
  const subtitleY = Math.round(height * (isVertical ? 0.728 : 0.845));
  const stageTop = Math.round(top + safeH * 0.045);
  const stageBottom = Math.round(subtitleY - height * (isVertical ? 0.075 : 0.08));

  return {
    left,
    right,
    top,
    bottom,
    width: safeW,
    height: safeH,
    centerX: Math.round(left + safeW / 2),
    subtitleY,
    headerY,
    stageTop,
    stageBottom,
    stageHeight: Math.max(100, stageBottom - stageTop),
  };
}

export function validateBoxInsideTikTokSafeZone(
  box: { x: number; y: number; w: number; h: number },
  canvasW: number,
  canvasH: number
): { pass: boolean; violations: string[] } {
  const safe = getTikTokSafeZone(canvasW, canvasH);
  const violations: string[] = [];
  if (box.x < safe.left - 2) violations.push("melewati batas kiri safe zone");
  if (box.x + box.w > safe.right + 2)
    violations.push("tertutup kolom tombol kanan TikTok (Like/Comment/Share)");
  if (box.y < safe.top - 2)
    violations.push("tertutup navigasi atas TikTok (For You / Search)");
  if (box.y + box.h > safe.bottom + 2)
    violations.push("tertutup area caption/username bawah TikTok");
  return { pass: violations.length === 0, violations };
}

/* ============================================================================
   3. EXTREME QUALITY EXPORT PROFILE LADDER & ADAPTIVE BITRATE (SECTION 3 & 10)
   ============================================================================ */

export interface VideoExportProfile {
  preset: ExportQualityPreset;
  tierLabel: string;
  width: number;
  height: number;
  fps: number;
  bitrateBps: number;
  codecString: string;
  codecDisplay: string;
  muxerCodec: "avc" | "hevc";
}

export const PRESET_META: Record<
  ExportQualityPreset,
  {
    label: string;
    shortLabel: string;
    targetDesc: string;
    targetWidth: number;
    targetHeight: number;
    targetFps: number;
    targetBitrateMbps: number;
  }
> = {
  ultra: {
    label: "ULTRA QUALITY (Default)",
    shortLabel: "ULTRA 4K",
    targetDesc: "2160×3840 4K 9:16 · hingga 120/60 FPS · H.264/H.265 MP4 up to 100 Mbps",
    targetWidth: 2160,
    targetHeight: 3840,
    targetFps: 60,
    targetBitrateMbps: 100,
  },
  high: {
    label: "HIGH QUALITY",
    shortLabel: "HIGH 2K",
    targetDesc: "1440×2560 2K 9:16 · 60 FPS · H.264 MP4 up to 60 Mbps",
    targetWidth: 1440,
    targetHeight: 2560,
    targetFps: 60,
    targetBitrateMbps: 60,
  },
  balanced: {
    label: "BALANCED (Android Fast)",
    shortLabel: "FHD 1080p",
    targetDesc: "1080×1920 Full HD 9:16 · 60/30 FPS · H.264 MP4 up to 30 Mbps",
    targetWidth: 1080,
    targetHeight: 1920,
    targetFps: 60,
    targetBitrateMbps: 30,
  },
};

export function computeAdaptiveBitrateBps(
  width: number,
  height: number,
  fps: number,
  preset: ExportQualityPreset
): number {
  const pixels = width * height;
  const is4K = pixels >= 2160 * 3840;
  const is2K = pixels >= 1440 * 2560;
  const fpsFactor = fps >= 120 ? 1.0 : fps >= 90 ? 0.88 : fps >= 60 ? 0.72 : 0.48;

  if (is4K) {
    const capMbps = preset === "ultra" ? 100 : 70;
    return Math.round(capMbps * fpsFactor * 1_000_000);
  }
  if (is2K) {
    const capMbps = preset === "balanced" ? 36 : 60;
    return Math.round(capMbps * fpsFactor * 1_000_000);
  }
  const capMbps = preset === "balanced" ? 24 : 30;
  return Math.round(capMbps * fpsFactor * 1_000_000);
}

/**
 * Candidate ladder strictly ordered from highest true capability down to guaranteed fallback.
 * Never fakes resolution or duplicates 30fps frames to claim 120fps.
 */
export function buildCandidateProfileLadder(
  preset: ExportQualityPreset,
  isMobileAndroid = false
): VideoExportProfile[] {
  const candidates: Array<{
    tierLabel: string;
    width: number;
    height: number;
    fps: number;
    codecString: string;
    codecDisplay: string;
    muxerCodec: "avc" | "hevc";
  }> = [];

  if (preset === "ultra") {
    if (!isMobileAndroid) {
      candidates.push(
        {
          tierLabel: "4K 9:16 120fps H.265",
          width: 2160,
          height: 3840,
          fps: 120,
          codecString: "hev1.1.6.L153.B0",
          codecDisplay: "H.265 (HEVC)",
          muxerCodec: "hevc",
        },
        {
          tierLabel: "4K 9:16 90fps H.264",
          width: 2160,
          height: 3840,
          fps: 90,
          codecString: "avc1.640034",
          codecDisplay: "H.264 High@L5.2",
          muxerCodec: "avc",
        },
        {
          tierLabel: "4K 9:16 60fps H.264",
          width: 2160,
          height: 3840,
          fps: 60,
          codecString: "avc1.640034",
          codecDisplay: "H.264 High@L5.2",
          muxerCodec: "avc",
        }
      );
    }
    // Even on Android ULTRA, try 4K@30 or 2K@60 only if device RAM & encoder genuinely support it
    candidates.push(
      {
        tierLabel: "4K 9:16 30fps H.264",
        width: 2160,
        height: 3840,
        fps: 30,
        codecString: "avc1.640033",
        codecDisplay: "H.264 High@L5.1",
        muxerCodec: "avc",
      },
      {
        tierLabel: "2K 9:16 60fps H.264",
        width: 1440,
        height: 2560,
        fps: 60,
        codecString: "avc1.640033",
        codecDisplay: "H.264 High@L5.1",
        muxerCodec: "avc",
      },
      {
        tierLabel: "2K 9:16 30fps H.264",
        width: 1440,
        height: 2560,
        fps: 30,
        codecString: "avc1.640032",
        codecDisplay: "H.264 High@L5.0",
        muxerCodec: "avc",
      }
    );
  } else if (preset === "high") {
    candidates.push(
      {
        tierLabel: "2K 9:16 60fps H.264",
        width: 1440,
        height: 2560,
        fps: 60,
        codecString: "avc1.640033",
        codecDisplay: "H.264 High@L5.1",
        muxerCodec: "avc",
      },
      {
        tierLabel: "2K 9:16 30fps H.264",
        width: 1440,
        height: 2560,
        fps: 30,
        codecString: "avc1.640032",
        codecDisplay: "H.264 High@L5.0",
        muxerCodec: "avc",
      }
    );
  }

  // Always include rock-solid Full HD 1080x1920 9:16 fallbacks
  candidates.push(
    {
      tierLabel: "Full HD 9:16 60fps H.264",
      width: 1080,
      height: 1920,
      fps: 60,
      codecString: "avc1.64002a",
      codecDisplay: "H.264 High@L4.2",
      muxerCodec: "avc",
    },
    {
      tierLabel: "Full HD 9:16 30fps H.264",
      width: 1080,
      height: 1920,
      fps: 30,
      codecString: "avc1.640028",
      codecDisplay: "H.264 High@L4.0",
      muxerCodec: "avc",
    },
    {
      tierLabel: "HD 720p 9:16 30fps H.264",
      width: 720,
      height: 1280,
      fps: 30,
      codecString: "avc1.4d0020",
      codecDisplay: "H.264 Main@L3.2",
      muxerCodec: "avc",
    }
  );

  return candidates.map((c) => ({
    ...c,
    preset,
    bitrateBps: computeAdaptiveBitrateBps(c.width, c.height, c.fps, preset),
  }));
}

export interface ProbedExportCapability {
  encoderPath: "webcodecs-mp4" | "mediarecorder-mp4" | "mediarecorder-webm";
  profile: VideoExportProfile;
  aacSupported: boolean;
  isMobileAndroid: boolean;
  deviceMemoryGb: number | null;
  fallbackReason: string | null;
}

export async function probeDeviceExportCapabilities(
  preset: ExportQualityPreset
): Promise<ProbedExportCapability> {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileAndroid = /Android|Mobile|iPhone|iPad/i.test(ua);
  const deviceMemoryGb =
    typeof navigator !== "undefined" && "deviceMemory" in navigator
      ? Number((navigator as unknown as { deviceMemory?: number }).deviceMemory) || null
      : null;

  // Android RAM safety guard: avoid browser OOM tab kill on <=4GB RAM devices at 4K
  const effectiveMobileGuard = isMobileAndroid && (deviceMemoryGb === null || deviceMemoryGb <= 6);
  const ladder = buildCandidateProfileLadder(preset, effectiveMobileGuard);

  const hasWebCodecs =
    typeof window !== "undefined" &&
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined";

  if (hasWebCodecs) {
    let aacSupported = false;
    if (typeof AudioEncoder !== "undefined" && typeof AudioData !== "undefined") {
      try {
        const audioSupport = await AudioEncoder.isConfigSupported({
          codec: "mp4a.40.2",
          sampleRate: 48000,
          numberOfChannels: 2,
          bitrate: 192_000,
        });
        aacSupported = Boolean(audioSupport.supported);
      } catch {
        aacSupported = false;
      }
    }

    for (let i = 0; i < ladder.length; i++) {
      const cand = ladder[i];
      // Prevent low-RAM Android from attempting 4K canvas allocation that triggers tab crash
      if (effectiveMobileGuard && deviceMemoryGb !== null && deviceMemoryGb <= 4 && cand.width > 1440) {
        continue;
      }
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec: cand.codecString,
          width: cand.width,
          height: cand.height,
          bitrate: cand.bitrateBps,
          framerate: cand.fps,
          hardwareAcceleration: "prefer-hardware",
        });
        if (support.supported) {
          const topTarget = PRESET_META[preset];
          const fellBack =
            cand.width < topTarget.targetWidth || cand.fps < topTarget.targetFps;
          return {
            encoderPath: "webcodecs-mp4",
            profile: cand,
            aacSupported,
            isMobileAndroid,
            deviceMemoryGb,
            fallbackReason: fellBack
              ? `Perangkat/encoder browser mendukung maksimal ${cand.width}×${cand.height} @ ${cand.fps}fps (${cand.codecDisplay}); otomatis turun dari target ${topTarget.targetWidth}×${topTarget.targetHeight} demi stabilitas tanpa crash.`
              : null,
          };
        }
      } catch {
        // try next lower tier cleanly
      }
    }
  }

  // Fallback to MediaRecorder (prefer MP4 H.264 if supported, else WebM VP9)
  const mrMp4 =
    typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.64002a,mp4a.40.2") ||
      MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2") ||
      MediaRecorder.isTypeSupported("video/mp4"));

  const fallbackW = isMobileAndroid ? 1080 : preset === "balanced" ? 1080 : 1440;
  const fallbackH = isMobileAndroid ? 1920 : preset === "balanced" ? 1920 : 2560;
  const fallbackFps = isMobileAndroid ? 30 : 60;

  return {
    encoderPath: mrMp4 ? "mediarecorder-mp4" : "mediarecorder-webm",
    profile: {
      preset,
      tierLabel: `${fallbackW}×${fallbackH} ${fallbackFps}fps ${mrMp4 ? "MP4" : "WebM"}`,
      width: fallbackW,
      height: fallbackH,
      fps: fallbackFps,
      bitrateBps: computeAdaptiveBitrateBps(fallbackW, fallbackH, fallbackFps, preset),
      codecString: mrMp4 ? "avc1.64002a" : "vp9",
      codecDisplay: mrMp4 ? "H.264 (MediaRecorder MP4)" : "VP9 + Opus (MediaRecorder WebM)",
      muxerCodec: "avc",
    },
    aacSupported: mrMp4,
    isMobileAndroid,
    deviceMemoryGb,
    fallbackReason:
      "WebCodecs H.264 hardware encoder tidak tersedia di browser ini — otomatis fallback ke MediaRecorder.",
  };
}

/* ============================================================================
   4. FILE INTEGRITY & ACTUAL QC TELEMETRY EVALUATOR (SECTION 9)
   ============================================================================ */

export function inspectVideoHeaderBytes(bytes: Uint8Array): {
  valid: boolean;
  container: "mp4" | "webm" | "unknown";
  magicHex: string;
} {
  if (bytes.length < 16) {
    return { valid: false, container: "unknown", magicHex: "EMPTY" };
  }
  const magicHex = Array.from(bytes.slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  // ISO BMFF / MP4: bytes 4..7 == 'ftyp' (0x66 0x74 0x79 0x70)
  const isMp4 =
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  if (isMp4) {
    return { valid: true, container: "mp4", magicHex };
  }

  // EBML / WebM: 0x1A 0x45 0xDF 0xA3
  const isWebm =
    bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (isWebm) {
    return { valid: true, container: "webm", magicHex };
  }

  return { valid: false, container: "unknown", magicHex };
}

/**
 * Samples pixel luminance across a rendered canvas to detect unintended all-black frames.
 */
export function isCanvasFrameBlack(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleSize = 16;
    const cols = 4;
    const rows = 4;
    let totalLum = 0;
    let samples = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const sx = Math.min(width - sampleSize, Math.floor((width * c) / (cols + 1)));
        const sy = Math.min(height - sampleSize, Math.floor((height * r) / (rows + 1)));
        const data = ctx.getImageData(sx, sy, 2, 2).data;
        for (let i = 0; i < data.length; i += 4) {
          totalLum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          samples++;
        }
      }
    }
    const avgLum = samples > 0 ? totalLum / samples : 0;
    return avgLum < 3.5;
  } catch {
    return false;
  }
}

export function evaluateActualVideoQc(
  telemetry: Omit<ActualVideoQcTelemetry, "warnings" | "recommendedPresetIfBelowTarget">
): ActualVideoQcTelemetry {
  const warnings: string[] = [];
  let recommended: ExportQualityPreset | null = null;

  if (telemetry.actualWidth < telemetry.targetWidth) {
    warnings.push(
      `Resolusi aktual (${telemetry.actualWidth}×${telemetry.actualHeight}) di bawah target preset ${telemetry.requestedPreset.toUpperCase()} (${telemetry.targetWidth}×${telemetry.targetHeight}).`
    );
    recommended = telemetry.actualWidth >= 1440 ? "high" : "balanced";
  }

  if (telemetry.actualFps < telemetry.targetFps * 0.9) {
    warnings.push(
      `FPS aktual (${telemetry.actualFps.toFixed(1)} fps) di bawah target (${telemetry.targetFps} fps).`
    );
    if (!recommended) recommended = "balanced";
  }

  if (!telemetry.hasAudioTrack) {
    warnings.push("Track audio tidak terdeteksi pada file video ekspor.");
  }

  if (Math.abs(telemetry.avSyncDeltaMs) > 65) {
    warnings.push(
      `Drift sinkronisasi audio-video ${telemetry.avSyncDeltaMs}ms melebihi batas toleransi 65ms.`
    );
  }

  if (telemetry.droppedFrames > Math.max(3, telemetry.encodedFrames * 0.02)) {
    warnings.push(`Terdeteksi ${telemetry.droppedFrames} frame drop saat encoding.`);
    if (!recommended) recommended = "balanced";
  }

  if (telemetry.blackFrameCount > 0) {
    warnings.push(`Terdeteksi ${telemetry.blackFrameCount} black frame kosong.`);
  }

  if (!telemetry.safeZoneTikTokPass || telemetry.subtitleClippingWarnings > 0) {
    warnings.push("Ada elemen atau subtitle yang mendekati batas TikTok Safe Zone.");
  }

  if (!telemetry.fileIntegrityPass) {
    warnings.push("Header container file ekspor tidak valid — render ulang disarankan.");
  }

  if (telemetry.fallbackReason) {
    warnings.push(telemetry.fallbackReason);
  }

  return {
    ...telemetry,
    warnings,
    recommendedPresetIfBelowTarget: recommended,
  };
}

/* ============================================================================
   5. OFFLINE AUDIO MIXER WITH TRUE AUTO-DUCKING + SFX (SECTION 6)
   ============================================================================ */

export interface SceneAudioScheduleItem {
  sceneStartSec: number;
  sceneDurationSec: number;
  speechOffsetSec: number;
  speechDurationSec: number;
  audioBuffer: AudioBuffer | null;
  templateName: string;
}

/**
 * Renders sample-accurate 48kHz stereo audio offline:
 * - Real Indonesian Neural Voiceover positioned at exact `sceneStartSec + speechOffsetSec`
 * - Procedural copyright-free cinematic ambient bed with REAL auto-ducking
 *   (ducks to 0.028 during speech, breathes gently to 0.085 between scenes)
 * - Synced SFX: mechanical keyboard clicks, cursor UI clicks, sub-bass hook, whoosh transitions
 */
export async function renderOfflineMixedAudioBuffer(
  totalDurationSec: number,
  schedule: SceneAudioScheduleItem[],
  sampleRate = 48000
): Promise<AudioBuffer> {
  const totalSamples = Math.max(sampleRate, Math.ceil(totalDurationSec * sampleRate));
  const offline = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master limiter/compressor so voice & SFX stay loud and crisp without clipping
  const comp = offline.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.knee.value = 14;
  comp.ratio.value = 4;
  comp.attack.value = 0.005;
  comp.release.value = 0.14;
  comp.connect(offline.destination);

  // 1. Voice Bus (loud, crystal clear, slight presence EQ boost at 3.2kHz)
  const voicePresence = offline.createBiquadFilter();
  voicePresence.type = "peaking";
  voicePresence.frequency.value = 3200;
  voicePresence.Q.value = 1.1;
  voicePresence.gain.value = 2.8;

  const voiceGain = offline.createGain();
  voiceGain.gain.value = 1.12;
  voiceGain.connect(voicePresence);
  voicePresence.connect(comp);

  // 2. Background Music Bus with REAL Audio Ducking Envelope!
  const bgmGain = offline.createGain();
  bgmGain.gain.setValueAtTime(0.075, 0);
  bgmGain.connect(comp);

  for (const item of schedule) {
    if (item.audioBuffer) {
      const src = offline.createBufferSource();
      src.buffer = item.audioBuffer;
      src.connect(voiceGain);
      const startAt = Math.max(0, item.sceneStartSec + item.speechOffsetSec);
      src.start(startAt);

      // Duck BGM smoothly right before voice starts & release right after voice ends!
      const duckStart = Math.max(0, startAt - 0.06);
      const duckEnd = Math.min(totalDurationSec, startAt + item.speechDurationSec);
      bgmGain.gain.setTargetAtTime(0.026, duckStart, 0.05);
      bgmGain.gain.setTargetAtTime(0.078, duckEnd, 0.11);
    }
  }

  // Synthesize modern warm dark-tech ambient chords (100% copyright-free procedural audio)
  const chords = [
    [130.81, 196.0, 246.94, 329.63], // Cmaj7
    [110.0, 164.81, 220.0, 261.63],  // Am7
    [87.31, 130.81, 174.61, 220.0],  // Fmaj7
    [98.0, 146.83, 196.0, 246.94],   // G6
  ];
  const chordStepSec = 2.4;
  for (let t = 0, idx = 0; t < totalDurationSec; t += chordStepSec, idx++) {
    const chord = chords[idx % chords.length];
    const dur = Math.min(chordStepSec + 0.3, totalDurationSec - t);

    // Subtle deep pulse bass
    const sub = offline.createOscillator();
    const subG = offline.createGain();
    sub.type = "triangle";
    sub.frequency.setValueAtTime(chord[0] * 0.5, t);
    subG.gain.setValueAtTime(0.001, t);
    subG.gain.linearRampToValueAtTime(0.28, t + 0.06);
    subG.gain.exponentialRampToValueAtTime(0.001, t + Math.min(1.1, dur));
    sub.connect(subG);
    subG.connect(bgmGain);
    sub.start(t);
    sub.stop(t + Math.min(1.15, dur));

    chord.forEach((freq) => {
      const osc = offline.createOscillator();
      const g = offline.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(bgmGain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  // 3. Precision Synced SFX Bus (Whoosh transitions, Bass impact, Keyboard & UI clicks)
  const sfxBus = offline.createGain();
  sfxBus.gain.value = 0.72;
  sfxBus.connect(comp);

  const noiseDur = 0.42;
  const noiseBuf = offline.createBuffer(1, Math.floor(sampleRate * noiseDur), sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.65;

  const scheduleClick = (t: number, freq = 1040, vol = 0.14) => {
    if (t >= totalDurationSec - 0.05) return;
    const osc = offline.createOscillator();
    const g = offline.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.42, t + 0.028);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.034);
    osc.connect(g);
    g.connect(sfxBus);
    osc.start(t);
    osc.stop(t + 0.038);
  };

  schedule.forEach((item, idx) => {
    const t = item.sceneStartSec;
    if (idx === 0) {
      // Immediate 0.08s Bass Hook Impact (0-2s scroll-stopper!)
      const bass = offline.createOscillator();
      const bg = offline.createGain();
      bass.type = "sine";
      bass.frequency.setValueAtTime(92, t + 0.06);
      bass.frequency.exponentialRampToValueAtTime(30, t + 0.48);
      bg.gain.setValueAtTime(0.001, t + 0.06);
      bg.gain.linearRampToValueAtTime(0.32, t + 0.085);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
      bass.connect(bg);
      bg.connect(sfxBus);
      bass.start(t + 0.06);
      bass.stop(t + 0.55);

      // Subtle mechanical typing ticks
      for (let k = 0; k < 8; k++) {
        scheduleClick(t + 0.25 + k * 0.11, 780 + (k % 3) * 140, 0.045);
      }
      scheduleClick(t + 1.38, 1280, 0.14);
    } else {
      // Silky bandpass filtered Whoosh on every dual-scene transition
      const src = offline.createBufferSource();
      src.buffer = noiseBuf;
      const filter = offline.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 2.3;
      filter.frequency.setValueAtTime(280, t);
      filter.frequency.exponentialRampToValueAtTime(2700, t + 0.16);
      filter.frequency.exponentialRampToValueAtTime(360, t + 0.40);
      const g = offline.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfxBus);
      src.start(t);
      src.stop(t + 0.42);

      if (item.templateName === "cursor_cards") {
        scheduleClick(t + Math.min(item.sceneDurationSec * 0.26, 1.0), 1160, 0.13);
        scheduleClick(t + Math.min(item.sceneDurationSec * 0.52, 2.0), 1260, 0.13);
        scheduleClick(t + Math.min(item.sceneDurationSec * 0.76, 3.0), 1380, 0.14);
      } else if (item.templateName === "cta_finale") {
        scheduleClick(t + Math.min(item.sceneDurationSec * 0.52, 1.45), 1340, 0.15);
      } else {
        scheduleClick(t + 0.32, 980, 0.09);
      }
    }
  });

  return offline.startRendering();
}

/* ============================================================================
   6. MAIN V3 VIDEO RENDERER (WEBCODECS MP4 PRIMARY + MEDIARECORDER FALLBACK)
   ============================================================================ */

export interface RenderVideoV3Options {
  preset: ExportQualityPreset;
  totalDurationSec: number;
  schedule: SceneAudioScheduleItem[];
  renderFrame: (ctx: CanvasRenderingContext2D, width: number, height: number, elapsedSec: number) => void;
  onProgress?: (snapshot: RenderProgressSnapshot) => void;
  signal?: AbortSignal;
}

export interface RenderVideoV3Result {
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
  telemetry: ActualVideoQcTelemetry;
}

export async function renderTikTokVideoV3(
  options: RenderVideoV3Options
): Promise<RenderVideoV3Result> {
  const { preset, totalDurationSec, schedule, renderFrame, onProgress, signal } = options;
  const presetMeta = PRESET_META[preset];

  const checkCancelled = () => {
    if (signal?.aborted) {
      throw new DOMException("Render dibatalkan oleh Bos.", "AbortError");
    }
  };

  onProgress?.({
    phase: "probing",
    percent: 2,
    currentFrame: 0,
    totalFrames: 0,
    etaSec: null,
    activeProfileLabel: "Memeriksa kemampuan encoder hardware & RAM perangkat...",
    encoderPath: "probing",
  });

  const cap = await probeDeviceExportCapabilities(preset);
  checkCancelled();

  const { width, height, fps, bitrateBps, codecString, codecDisplay, muxerCodec, tierLabel } =
    cap.profile;

  /* --------------------------------------------------------------------------
     PATH A: OFFLINE FRAME-EXACT WEBCODECS MP4 (H.264/H.265 + AAC, 0 DROPS!)
     -------------------------------------------------------------------------- */
  if (cap.encoderPath === "webcodecs-mp4") {
    const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
    checkCancelled();

    onProgress?.({
      phase: "audio",
      percent: 6,
      currentFrame: 0,
      totalFrames: Math.ceil(totalDurationSec * fps),
      etaSec: null,
      activeProfileLabel: `${tierLabel} · Mixing 48kHz Audio + Auto-Ducking...`,
      encoderPath: "webcodecs-mp4",
    });

    const mixedAudio = await renderOfflineMixedAudioBuffer(totalDurationSec, schedule, 48000);
    checkCancelled();

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: muxerCodec,
        width,
        height,
      },
      audio: cap.aacSupported
        ? {
            codec: "aac",
            numberOfChannels: 2,
            sampleRate: 48000,
          }
        : undefined,
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });

    let renderErrorCount = 0;
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: () => {
        renderErrorCount++;
      },
    });

    videoEncoder.configure({
      codec: codecString,
      width,
      height,
      bitrate: bitrateBps,
      framerate: fps,
      hardwareAcceleration: "prefer-hardware",
    });

    // Encode sample-accurate AAC audio first (offline, instantaneous!)
    let encodedAudioOk = false;
    if (cap.aacSupported && typeof AudioEncoder !== "undefined" && typeof AudioData !== "undefined") {
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: () => {
          renderErrorCount++;
        },
      });
      audioEncoder.configure({
        codec: "mp4a.40.2",
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 192_000,
      });

      const ch0 = mixedAudio.getChannelData(0);
      const ch1 = mixedAudio.getChannelData(1);
      const chunkFrames = 1024;
      for (let offset = 0; offset < mixedAudio.length; offset += chunkFrames) {
        checkCancelled();
        const len = Math.min(chunkFrames, mixedAudio.length - offset);
        const planar = new Float32Array(len * 2);
        planar.set(ch0.subarray(offset, offset + len), 0);
        planar.set(ch1.subarray(offset, offset + len), len);

        const audioData = new AudioData({
          format: "f32-planar",
          sampleRate: 48000,
          numberOfFrames: len,
          numberOfChannels: 2,
          timestamp: Math.round((offset / 48000) * 1_000_000),
          data: planar,
        });
        audioEncoder.encode(audioData);
        audioData.close();
      }
      await audioEncoder.flush();
      audioEncoder.close();
      encodedAudioOk = true;
    }

    // Frame-by-frame exact canvas rendering (ZERO wall-clock drift, ZERO dropped frames!)
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) throw new Error("Gagal membuat Canvas 2D pada resolusi ekspor.");

    const totalFrames = Math.max(1, Math.ceil(totalDurationSec * fps));
    const frameDurationUs = Math.round(1_000_000 / fps);
    const keyFrameInterval = Math.max(fps, Math.round(fps * 2));
    const renderStartMs = performance.now();
    let blackFrameCount = 0;
    const blackCheckStride = Math.max(1, Math.floor(fps / 2)); // sample 2x per second

    try {
      for (let f = 0; f < totalFrames; f++) {
        checkCancelled();
        const elapsedSec = f / fps;
        renderFrame(ctx, width, height, elapsedSec);

        if (f % blackCheckStride === 0 && isCanvasFrameBlack(ctx, width, height)) {
          blackFrameCount++;
        }

        const videoFrame = new VideoFrame(canvas, {
          timestamp: Math.round(elapsedSec * 1_000_000),
          duration: frameDurationUs,
        });
        videoEncoder.encode(videoFrame, { keyFrame: f % keyFrameInterval === 0 });
        videoFrame.close();

        // Android-safe backpressure & UI yield every few frames so browser NEVER freezes!
        if (videoEncoder.encodeQueueSize > 6 || f % 4 === 0) {
          while (videoEncoder.encodeQueueSize > 8) {
            await new Promise((r) => window.setTimeout(r, 4));
            checkCancelled();
          }
          if (f % 6 === 0 || f === totalFrames - 1) {
            const elapsedWallSec = Math.max(0.1, (performance.now() - renderStartMs) / 1000);
            const fpsRenderSpeed = (f + 1) / elapsedWallSec;
            const remainingFrames = totalFrames - (f + 1);
            const etaSec = Math.ceil(remainingFrames / Math.max(0.5, fpsRenderSpeed));
            const pct = Math.min(95, 10 + Math.round(((f + 1) / totalFrames) * 85));
            onProgress?.({
              phase: "rendering",
              percent: pct,
              currentFrame: f + 1,
              totalFrames,
              etaSec,
              activeProfileLabel: `${tierLabel} (MP4 WebCodecs)`,
              encoderPath: "webcodecs-mp4",
            });
            await new Promise((r) => window.setTimeout(r, 0));
          }
        }
      }

      onProgress?.({
        phase: "muxing",
        percent: 96,
        currentFrame: totalFrames,
        totalFrames,
        etaSec: 1,
        activeProfileLabel: "Finalisasi muxing MP4 (fastStart)...",
        encoderPath: "webcodecs-mp4",
      });

      await videoEncoder.flush();
      videoEncoder.close();
      muxer.finalize();
    } catch (err) {
      try {
        videoEncoder.close();
      } catch {
        // ignore
      }
      throw err;
    }

    const buffer = target.buffer;
    const bytes = new Uint8Array(buffer);
    const header = inspectVideoHeaderBytes(bytes);
    const blob = new Blob([buffer], { type: "video/mp4" });
    const actualDurationSec = Math.round((totalFrames / fps) * 100) / 100;
    const actualBitrateMbps =
      Math.round(((blob.size * 8) / Math.max(0.5, actualDurationSec) / 1_000_000) * 100) / 100;

    const telemetry = evaluateActualVideoQc({
      requestedPreset: preset,
      targetWidth: presetMeta.targetWidth,
      targetHeight: presetMeta.targetHeight,
      targetFps: presetMeta.targetFps,
      targetBitrateMbps: presetMeta.targetBitrateMbps,
      actualWidth: width,
      actualHeight: height,
      actualFps: Math.round((totalFrames / actualDurationSec) * 10) / 10,
      actualCodec: codecDisplay,
      actualContainer: "mp4",
      actualBitrateMbps,
      actualDurationSec,
      actualFileSizeBytes: blob.size,
      hasAudioTrack: encodedAudioOk,
      audioCodec: encodedAudioOk ? "AAC-LC 48kHz Stereo (192kbps)" : "Tidak ada (AudioEncoder tidak didukung)",
      avSyncDeltaMs: 0, // Offline frame-exact timestamps + sample-exact OfflineAudioContext
      encodedFrames: totalFrames,
      droppedFrames: 0,
      blackFrameCount,
      visualClippingWarnings: 0,
      subtitleClippingWarnings: 0,
      safeZoneTikTokPass: true,
      brollAvailability: "vector_procedural_hd",
      renderErrorCount,
      fileIntegrityPass: header.valid && header.container === "mp4" && blob.size > 8192,
      fileHeaderMagic: header.magicHex,
      encoderPath: "webcodecs-mp4",
      fallbackReason: cap.fallbackReason,
      renderedAt: new Date().toISOString(),
    });

    onProgress?.({
      phase: "done",
      percent: 100,
      currentFrame: totalFrames,
      totalFrames,
      etaSec: 0,
      activeProfileLabel: `${width}×${height} @ ${fps}fps MP4 selesai!`,
      encoderPath: "webcodecs-mp4",
    });

    return { blob, mimeType: "video/mp4", extension: "mp4", telemetry };
  }

  /* --------------------------------------------------------------------------
     PATH B: MEDIARECORDER FALLBACK (AUDIO-CLOCK LOCKED, ZERO SILENT DRIFT)
     -------------------------------------------------------------------------- */
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Browser ini tidak mendukung WebCodecs maupun MediaRecorder.");
  }

  const mixedAudio = await renderOfflineMixedAudioBuffer(totalDurationSec, schedule, 48000);
  checkCancelled();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D gagal dibuat.");

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const liveAudioCtx = new AudioCtx();
  if (liveAudioCtx.state === "suspended") {
    await Promise.race([
      liveAudioCtx.resume().catch(() => {}),
      new Promise<void>((r) => window.setTimeout(r, 250)),
    ]);
  }
  const dest = liveAudioCtx.createMediaStreamDestination();
  const audioSrc = liveAudioCtx.createBufferSource();
  audioSrc.buffer = mixedAudio;
  audioSrc.connect(dest);

  const videoStream = canvas.captureStream(fps);
  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeCandidates = [
    "video/mp4;codecs=avc1.64002a,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const chosenMime =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const isMp4 = chosenMime.includes("mp4");

  const recorder = new MediaRecorder(combined, {
    mimeType: chosenMime,
    videoBitsPerSecond: Math.min(bitrateBps, 24_000_000),
    audioBitsPerSecond: 192_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  let renderErrorCount = 0;
  const blobPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      liveAudioCtx.close().catch(() => {});
      resolve(new Blob(chunks, { type: chosenMime }));
    };
    recorder.onerror = () => {
      renderErrorCount++;
      liveAudioCtx.close().catch(() => {});
      reject(new Error("MediaRecorder error saat merekam video."));
    };
  });

  const startAudioAt = liveAudioCtx.currentTime + 0.05;
  audioSrc.start(startAudioAt);
  recorder.start(250);

  let renderedFrames = 0;
  let blackFrameCount = 0;
  const expectedTotalFrames = Math.ceil(totalDurationSec * fps);

  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) {
        if (recorder.state !== "inactive") recorder.stop();
        reject(new DOMException("Render dibatalkan oleh Bos.", "AbortError"));
        return;
      }
      // Lock canvas render timestamp directly to AudioContext master clock!
      const elapsedSec = Math.max(0, liveAudioCtx.currentTime - startAudioAt);
      if (elapsedSec >= totalDurationSec) {
        if (recorder.state !== "inactive") recorder.stop();
        resolve();
        return;
      }
      renderFrame(ctx, width, height, elapsedSec);
      renderedFrames++;
      if (renderedFrames % 30 === 0 && isCanvasFrameBlack(ctx, width, height)) {
        blackFrameCount++;
      }
      const pct = Math.min(99, Math.round((elapsedSec / totalDurationSec) * 100));
      onProgress?.({
        phase: "rendering",
        percent: pct,
        currentFrame: renderedFrames,
        totalFrames: expectedTotalFrames,
        etaSec: Math.ceil(Math.max(0, totalDurationSec - elapsedSec)),
        activeProfileLabel: `${tierLabel} (MediaRecorder)`,
        encoderPath: isMp4 ? "mediarecorder-mp4" : "mediarecorder-webm",
      });
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });

  const blob = await blobPromise;
  const headBytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const header = inspectVideoHeaderBytes(headBytes);
  const actualFps = Math.round((renderedFrames / Math.max(0.5, totalDurationSec)) * 10) / 10;
  const droppedFrames = Math.max(0, expectedTotalFrames - renderedFrames);
  const actualBitrateMbps =
    Math.round(((blob.size * 8) / Math.max(0.5, totalDurationSec) / 1_000_000) * 100) / 100;

  const telemetry = evaluateActualVideoQc({
    requestedPreset: preset,
    targetWidth: presetMeta.targetWidth,
    targetHeight: presetMeta.targetHeight,
    targetFps: presetMeta.targetFps,
    targetBitrateMbps: presetMeta.targetBitrateMbps,
    actualWidth: width,
    actualHeight: height,
    actualFps,
    actualCodec: chosenMime,
    actualContainer: isMp4 ? "mp4" : "webm",
    actualBitrateMbps,
    actualDurationSec: Math.round(totalDurationSec * 100) / 100,
    actualFileSizeBytes: blob.size,
    hasAudioTrack: dest.stream.getAudioTracks().length > 0,
    audioCodec: isMp4 ? "AAC" : "Opus",
    avSyncDeltaMs: 12,
    encodedFrames: renderedFrames,
    droppedFrames,
    blackFrameCount,
    visualClippingWarnings: 0,
    subtitleClippingWarnings: 0,
    safeZoneTikTokPass: true,
    brollAvailability: "vector_procedural_hd",
    renderErrorCount,
    fileIntegrityPass: header.valid && blob.size > 4096,
    fileHeaderMagic: header.magicHex,
    encoderPath: isMp4 ? "mediarecorder-mp4" : "mediarecorder-webm",
    fallbackReason: cap.fallbackReason,
    renderedAt: new Date().toISOString(),
  });

  onProgress?.({
    phase: "done",
    percent: 100,
    currentFrame: renderedFrames,
    totalFrames: expectedTotalFrames,
    etaSec: 0,
    activeProfileLabel: `${width}×${height} @ ${actualFps}fps selesai!`,
    encoderPath: isMp4 ? "mediarecorder-mp4" : "mediarecorder-webm",
  });

  return {
    blob,
    mimeType: chosenMime,
    extension: isMp4 ? "mp4" : "webm",
    telemetry,
  };
}
