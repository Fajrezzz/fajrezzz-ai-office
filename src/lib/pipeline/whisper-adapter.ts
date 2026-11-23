import type { WordTimingCue } from "@/types/pipeline";

/**
 * Modular whisper.cpp Adapter (ggml-org/whisper.cpp v1.9.5, MIT).
 *
 * Parses full JSON token timestamps produced by `whisper-cli -ojf` into our
 * native `WordTimingCue[]` format for 0ms-drift subtitle synchronization.
 * When `whisper-cli` binary is not installed (e.g., Vercel Serverless), our
 * pipeline transparently falls back to syllable-weighted audio-locked timing.
 */

export interface WhisperJsonToken {
  text: string;
  offsets?: { from: number; to: number };
  t_dtw?: number;
  p?: number;
}

export interface WhisperJsonSegment {
  text?: string;
  offsets?: { from: number; to: number };
  tokens?: WhisperJsonToken[];
}

export interface WhisperFullJsonOutput {
  transcription?: WhisperJsonSegment[];
}

const AI_TECH_HIGHLIGHTS = new Set([
  "claude",
  "code",
  "agent",
  "agents",
  "ai",
  "github",
  "terminal",
  "otomatis",
  "multi-agent",
  "workflow",
  "ffmpeg",
  "remotion",
  "gsap",
  "4k",
  "60fps",
  "120fps",
]);

/**
 * Converts `whisper-cli -ojf` token output (millisecond offsets) into clean
 * word-level `WordTimingCue[]` with scene-offset adjustment.
 */
export function parseWhisperJsonToWordTimings(
  json: WhisperFullJsonOutput,
  sceneSpeechOffsetSec = 0
): WordTimingCue[] {
  const segments = Array.isArray(json.transcription) ? json.transcription : [];
  const cues: WordTimingCue[] = [];

  for (const seg of segments) {
    const tokens = Array.isArray(seg.tokens) ? seg.tokens : [];
    let currentWord = "";
    let wordStartMs = -1;
    let wordEndMs = -1;

    const flushWord = () => {
      const cleaned = currentWord.trim();
      if (!cleaned || wordStartMs < 0) return;
      const startSec = Math.round((sceneSpeechOffsetSec + wordStartMs / 1000) * 1000) / 1000;
      const endSec = Math.max(
        startSec + 0.05,
        Math.round((sceneSpeechOffsetSec + Math.max(wordEndMs, wordStartMs + 50) / 1000) * 1000) / 1000
      );
      const norm = cleaned.toLowerCase().replace(/[^a-z0-9-]/g, "");
      cues.push({
        word: cleaned,
        startSec,
        endSec,
        highlight: AI_TECH_HIGHLIGHTS.has(norm) || /^\d+([.,]\d+)?(%|x)?$/.test(norm),
      });
      currentWord = "";
      wordStartMs = -1;
      wordEndMs = -1;
    };

    for (const tok of tokens) {
      const text = tok.text ?? "";
      // Skip special whisper control tokens like [_BEG_], [_TT_120]
      if (/^\[_.*\]$/.test(text.trim())) continue;

      const fromMs = tok.offsets?.from ?? -1;
      const toMs = tok.offsets?.to ?? fromMs + 60;

      if (text.startsWith(" ") && currentWord.length > 0) {
        flushWord();
      }
      if (wordStartMs < 0 && fromMs >= 0) wordStartMs = fromMs;
      if (toMs >= 0) wordEndMs = toMs;
      currentWord += text;
    }
    flushWord();
  }

  return cues;
}
