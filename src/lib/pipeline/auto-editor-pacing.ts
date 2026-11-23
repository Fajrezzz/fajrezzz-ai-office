/**
 * Auto-Editor Inspired Audio Silence Detection & Smart Pacing Engine
 * Reference: https://github.com/wyattblue/auto-editor (Unlicense)
 *
 * Performs genuine RMS decibel silence detection on PCM audio samples to trim
 * dead leading/trailing air with configurable margin so TikTok speech pacing
 * stays tight, energetic, and 0ms-synchronized with subtitles.
 */

export interface AudioTrimBounds {
  startSample: number;
  endSample: number;
  originalDurationSec: number;
  trimmedDurationSec: number;
  trimmedLeadingSec: number;
  trimmedTrailingSec: number;
  silenceThresholdDb: number;
  activeSpeechRatio: number;
}

/**
 * Pure PCM analyzer (works in both Browser AudioBuffer & Node.js unit tests).
 * Detects leading/trailing silence below `thresholdDb` (default -40 dB) and
 * preserves `marginSec` (default 0.06s) breath around active speech.
 */
export function analyzePcmSilenceBounds(
  samples: Float32Array,
  sampleRate: number,
  options?: {
    thresholdDb?: number;
    marginSec?: number;
    windowMs?: number;
  }
): AudioTrimBounds {
  const thresholdDb = options?.thresholdDb ?? -40;
  const marginSec = options?.marginSec ?? 0.06;
  const windowMs = options?.windowMs ?? 20;

  const totalSamples = samples.length;
  const originalDurationSec =
    sampleRate > 0 ? Math.round((totalSamples / sampleRate) * 1000) / 1000 : 0;

  if (totalSamples === 0 || sampleRate <= 0) {
    return {
      startSample: 0,
      endSample: 0,
      originalDurationSec: 0,
      trimmedDurationSec: 0,
      trimmedLeadingSec: 0,
      trimmedTrailingSec: 0,
      silenceThresholdDb: thresholdDb,
      activeSpeechRatio: 0,
    };
  }

  const thresholdLinear = Math.pow(10, thresholdDb / 20);
  const windowSize = Math.max(64, Math.floor((sampleRate * windowMs) / 1000));
  const marginSamples = Math.floor(sampleRate * marginSec);

  let firstLoud = -1;
  let lastLoud = -1;
  let loudWindows = 0;
  let totalWindows = 0;

  for (let i = 0; i < totalSamples; i += windowSize) {
    const end = Math.min(totalSamples, i + windowSize);
    let sumSq = 0;
    for (let j = i; j < end; j++) {
      const s = samples[j];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - i));
    totalWindows++;
    if (rms >= thresholdLinear) {
      loudWindows++;
      if (firstLoud === -1) firstLoud = i;
      lastLoud = end;
    }
  }

  // If entire clip is quieter than threshold, keep original safely without deleting audio
  if (firstLoud === -1 || lastLoud === -1) {
    return {
      startSample: 0,
      endSample: totalSamples,
      originalDurationSec,
      trimmedDurationSec: originalDurationSec,
      trimmedLeadingSec: 0,
      trimmedTrailingSec: 0,
      silenceThresholdDb: thresholdDb,
      activeSpeechRatio: 0,
    };
  }

  const startSample = Math.max(0, firstLoud - marginSamples);
  const endSample = Math.min(totalSamples, lastLoud + marginSamples);
  const trimmedDurationSec =
    Math.round(((endSample - startSample) / sampleRate) * 1000) / 1000;

  return {
    startSample,
    endSample,
    originalDurationSec,
    trimmedDurationSec,
    trimmedLeadingSec: Math.round((startSample / sampleRate) * 1000) / 1000,
    trimmedTrailingSec:
      Math.round(((totalSamples - endSample) / sampleRate) * 1000) / 1000,
    silenceThresholdDb: thresholdDb,
    activeSpeechRatio:
      totalWindows > 0 ? Math.round((loudWindows / totalWindows) * 100) / 100 : 0,
  };
}

/**
 * Trims dead leading/trailing silence from a browser AudioBuffer using our PCM RMS detector.
 */
export function trimAudioBufferDeadAir(
  audioCtx: BaseAudioContext,
  buffer: AudioBuffer,
  options?: { thresholdDb?: number; marginSec?: number }
): { buffer: AudioBuffer; report: AudioTrimBounds } {
  const ch0 = buffer.getChannelData(0);
  const report = analyzePcmSilenceBounds(ch0, buffer.sampleRate, options);
  const trimmedLen = report.endSample - report.startSample;

  // Skip copy if negligible trim (< 0.08s) or invalid length
  if (
    trimmedLen <= 0 ||
    report.trimmedLeadingSec + report.trimmedTrailingSec < 0.08 ||
    trimmedLen < buffer.sampleRate * 0.35
  ) {
    return { buffer, report };
  }

  const out = audioCtx.createBuffer(
    buffer.numberOfChannels,
    trimmedLen,
    buffer.sampleRate
  );
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    out.copyToChannel(src.subarray(report.startSample, report.endSample), ch);
  }
  return { buffer: out, report };
}
