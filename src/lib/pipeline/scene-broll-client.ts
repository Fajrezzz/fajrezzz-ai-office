"use client";

import type { VideoFormat } from "@/lib/kids-studio/episode-brain";
import type { EditorialEpisode, EditorialScene } from "@/lib/pipeline/motion-renderer";

/**
 * Client-side cache & parallel fetcher for FREE Rp 0 AI Cinematic B-Roll Scene Images
 * (MoneyPrinterTurbo + ComfyUI visual node workflow).
 */

const imageElementCache = new Map<string, HTMLImageElement>();
const inflightMap = new Map<string, Promise<HTMLImageElement | null>>();

function makeSceneCacheKey(
  episodeNumber: number,
  scene: EditorialScene,
  format: VideoFormat
): string {
  return `${episodeNumber}|${scene.sceneNumber}|${format}|${scene.visualPrompt.slice(0, 60)}`;
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function getCachedSceneBRoll(
  episode: EditorialEpisode,
  format: VideoFormat
): Array<HTMLImageElement | null> {
  return episode.scenes.map(
    (sc) => imageElementCache.get(makeSceneCacheKey(episode.episodeNumber, sc, format)) ?? null
  );
}

async function fetchOneSceneBRoll(
  episodeNumber: number,
  scene: EditorialScene,
  niche: string,
  format: VideoFormat
): Promise<HTMLImageElement | null> {
  const key = makeSceneCacheKey(episodeNumber, scene, format);
  const cached = imageElementCache.get(key);
  if (cached) return cached;

  const existing = inflightMap.get(key);
  if (existing) return existing;

  const job = (async () => {
    try {
      const prompt = `${niche}: ${scene.visualPrompt}. ${scene.label} cinematic visual scene`;
      const res = await fetch("/api/ai/scene-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mood: scene.mood,
          format,
          seed: episodeNumber * 100 + scene.sceneNumber * 17,
        }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { ok?: boolean; dataUrl?: string };
      if (!json?.ok || !json.dataUrl) return null;

      const img = await loadImageFromDataUrl(json.dataUrl);
      if (img) {
        imageElementCache.set(key, img);
      }
      return img;
    } catch {
      return null;
    } finally {
      inflightMap.delete(key);
    }
  })();

  inflightMap.set(key, job);
  return job;
}

/**
 * Fetch cinematic AI B-Roll images for all scenes in crisp batches of 2 so rendering stays fast.
 */
export async function fetchEpisodeBRollImages(
  episode: EditorialEpisode,
  format: VideoFormat
): Promise<Array<HTMLImageElement | null>> {
  if (typeof window === "undefined") {
    return episode.scenes.map(() => null);
  }

  const results: Array<HTMLImageElement | null> = [];
  for (let i = 0; i < episode.scenes.length; i += 2) {
    const batch = episode.scenes.slice(i, i + 2);
    const loaded = await Promise.all(
      batch.map((sc) =>
        fetchOneSceneBRoll(episode.episodeNumber, sc, episode.niche, format)
      )
    );
    results.push(...loaded);
  }
  return results;
}
