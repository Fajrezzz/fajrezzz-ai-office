"use client";

export interface CachedNeuralClip {
  blob: Blob;
  objectUrl: string;
  provider: "edge-neural-tts" | "google-neural-tts";
  voiceName: string;
  durationSec: number;
}

const clipCache = new Map<string, CachedNeuralClip>();

function cacheKey(text: string, voice: "ardi" | "gadis"): string {
  return `${voice}::${text.trim().toLowerCase()}`;
}

async function measureAudioDuration(blob: Blob): Promise<number> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return 0;
    const ctx = new AudioCtx();
    try {
      const arr = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr.slice(0));
      return Math.round(decoded.duration * 10) / 10;
    } finally {
      await ctx.close().catch(() => {});
    }
  } catch {
    return 0;
  }
}

/**
 * Fetch & cache a crisp real Indonesian Neural Human MP3 clip from `/api/tts`
 * (Microsoft Edge id-ID-ArdiNeural / GadisNeural -> Google Neural fallback).
 */
export async function fetchNeuralSpeechClip(
  text: string,
  voice: "ardi" | "gadis" = "ardi"
): Promise<CachedNeuralClip | null> {
  if (typeof window === "undefined") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const key = cacheKey(trimmed, voice);
  const existing = clipCache.get(key);
  if (existing) return existing;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, voice, rate: "+5%" }),
    });
    if (!res.ok) return null;

    const blob = await res.blob();
    if (blob.size < 300) return null;

    const providerHeader = res.headers.get("X-TTS-Provider");
    const provider: CachedNeuralClip["provider"] =
      providerHeader === "google-neural-tts"
        ? "google-neural-tts"
        : "edge-neural-tts";
    const voiceName =
      res.headers.get("X-TTS-Voice") ||
      (voice === "gadis" ? "id-ID-GadisNeural" : "id-ID-ArdiNeural");

    const measured = await measureAudioDuration(blob);
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const durationSec = measured > 0.4 ? measured : Math.max(2.5, Math.round((words / 2.6) * 10) / 10);

    const clip: CachedNeuralClip = {
      blob,
      objectUrl: URL.createObjectURL(blob),
      provider,
      voiceName,
      durationSec,
    };
    clipCache.set(key, clip);
    return clip;
  } catch {
    return null;
  }
}

export function getCachedNeuralClip(
  text: string,
  voice: "ardi" | "gadis" = "ardi"
): CachedNeuralClip | null {
  return clipCache.get(cacheKey(text, voice)) ?? null;
}
