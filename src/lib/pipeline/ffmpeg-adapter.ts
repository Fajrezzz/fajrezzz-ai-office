/**
 * Modular FFmpeg & ffprobe Service Adapter (FFmpeg/FFmpeg, LGPL/GPL).
 *
 * - Pure helpers (`parseFfprobeJson`, `buildFfmpegExportArgs`) work anywhere (Node / tests).
 * - Binary execution runs ONLY when native `ffmpeg` / `ffprobe` exists on a worker/local host
 *   using array args (`spawnSync`, never shell string interpolation).
 */

export interface FfprobeValidatedMetadata {
  valid: boolean;
  filePath: string;
  containerFormat: string;
  durationSec: number;
  fileSizeBytes: number;
  actualBitrateMbps: number;
  videoCodec: string;
  videoProfile: string;
  width: number;
  height: number;
  aspectRatio: string;
  avgFps: number;
  rFrameRate: number;
  totalFrames: number;
  hasAudio: boolean;
  audioCodec: string;
  audioSampleRateHz: number;
  audioChannels: number;
  audioBitrateKbps: number;
}

function parseFraction(frac: string | undefined): number {
  if (!frac) return 0;
  const parts = frac.split("/");
  if (parts.length === 2) {
    const num = Number(parts[0]);
    const den = Number(parts[1]);
    return den > 0 ? Math.round((num / den) * 100) / 100 : 0;
  }
  const v = Number(frac);
  return Number.isFinite(v) ? v : 0;
}

export interface RawFfprobeOutput {
  format?: {
    filename?: string;
    format_name?: string;
    duration?: string;
    size?: string;
    bit_rate?: string;
  };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    profile?: string;
    width?: number;
    height?: number;
    avg_frame_rate?: string;
    r_frame_rate?: string;
    nb_frames?: string;
    sample_rate?: string;
    channels?: number;
    bit_rate?: string;
  }>;
}

/**
 * Parses real `ffprobe -v quiet -print_format json -show_format -show_streams` JSON output
 * into strongly-typed ACTUAL video metadata (never fake targets!).
 */
export function parseFfprobeJson(
  raw: RawFfprobeOutput,
  fallbackFilePath = ""
): FfprobeValidatedMetadata {
  const fmt = raw.format ?? {};
  const streams = Array.isArray(raw.streams) ? raw.streams : [];
  const vStream = streams.find((s) => s.codec_type === "video");
  const aStream = streams.find((s) => s.codec_type === "audio");

  const durationSec = Math.round((Number(fmt.duration) || 0) * 100) / 100;
  const fileSizeBytes = Number(fmt.size) || 0;
  const bitRateBps = Number(fmt.bit_rate) || (durationSec > 0 ? (fileSizeBytes * 8) / durationSec : 0);
  const actualBitrateMbps = Math.round((bitRateBps / 1_000_000) * 100) / 100;

  const width = vStream?.width ?? 0;
  const height = vStream?.height ?? 0;
  const avgFps = parseFraction(vStream?.avg_frame_rate);
  const rFrameRate = parseFraction(vStream?.r_frame_rate);
  const totalFrames = Number(vStream?.nb_frames) || Math.round(avgFps * durationSec);

  return {
    valid: Boolean(vStream && width > 0 && height > 0 && durationSec > 0),
    filePath: fmt.filename || fallbackFilePath,
    containerFormat: fmt.format_name || "unknown",
    durationSec,
    fileSizeBytes,
    actualBitrateMbps,
    videoCodec: vStream?.codec_name || "none",
    videoProfile: vStream?.profile || "unknown",
    width,
    height,
    aspectRatio: width > 0 && height > 0 ? `${width}:${height}` : "0:0",
    avgFps,
    rFrameRate,
    totalFrames,
    hasAudio: Boolean(aStream),
    audioCodec: aStream?.codec_name || "none",
    audioSampleRateHz: Number(aStream?.sample_rate) || 0,
    audioChannels: aStream?.channels ?? 0,
    audioBitrateKbps: Math.round((Number(aStream?.bit_rate) || 0) / 1000),
  };
}

/**
 * Builds safe array-based FFmpeg export arguments (zero shell injection risk)
 * for H.264 / H.265 vertical 9:16 TikTok MP4 + AAC 48kHz audio with faststart.
 */
export function buildFfmpegExportArgs(options: {
  width: number;
  height: number;
  fps: number;
  audioInputPath: string;
  outputPath: string;
  codec?: "h264" | "h265";
  targetBitrateMbps?: number;
}): string[] {
  const codec = options.codec ?? "h264";
  const bitrateMbps = Math.min(100, Math.max(8, options.targetBitrateMbps ?? 20));
  const maxRateMbps = Math.min(110, Math.round(bitrateMbps * 1.25));

  const videoCodecArgs =
    codec === "h265"
      ? ["-c:v", "libx265", "-tag:v", "hvc1", "-preset", "fast"]
      : ["-c:v", "libx264", "-profile:v", "high", "-preset", "medium"];

  return [
    "-y",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "-s",
    `${options.width}x${options.height}`,
    "-r",
    String(options.fps),
    "-i",
    "pipe:0",
    "-i",
    options.audioInputPath,
    ...videoCodecArgs,
    "-pix_fmt",
    "yuv420p",
    "-b:v",
    `${bitrateMbps}M`,
    "-maxrate",
    `${maxRateMbps}M`,
    "-bufsize",
    `${maxRateMbps * 2}M`,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-shortest",
    options.outputPath,
  ];
}
