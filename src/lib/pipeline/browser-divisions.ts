"use client";

import type { KidsEpisode, KidsThemeId, VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  renderCartoonFrame,
  renderKidsThumbnail,
  startKidsMelody,
} from "@/lib/kids-studio/cartoon-renderer";
import type {
  EditingOutput,
  MotionOutput,
  PipelineScene,
  RealEpisode,
  SceneMotionFrame,
  SceneVoiceTrack,
  VoiceOutput,
} from "@/types/pipeline";

/** Convert a RealEpisode (from real 7-division outputs) into the Canvas renderer shape */
export function buildRenderableEpisode(episode: RealEpisode): KidsEpisode | null {
  const research = episode.divisions.research.output;
  const seo = episode.divisions.seo.output;
  const script = episode.divisions.script.output;
  if (!script || script.scenes.length === 0) return null;

  const selectedIdea =
    research?.ideas.find((i) => i.id === episode.selectedIdeaId) ??
    research?.ideas[0];

  const themeId: KidsThemeId = selectedIdea?.themeId ?? "rescue_trucks";

  return {
    id: episode.id,
    episodeNumber: episode.episodeNumber,
    createdAt: episode.createdAt,
    themeId,
    themeLabel: selectedIdea?.storyStructure ?? "Episode Orisinal",
    hook3s: selectedIdea?.hook3s ?? script.scenes[0]?.subtitle ?? "",
    title: seo?.title ?? selectedIdea?.title ?? `Episode #${episode.episodeNumber}`,
    thumbnailHeadline:
      seo?.thumbnailHeadline ??
      (seo?.title ?? "EPISODE BARU").split(" ").slice(0, 3).join(" ").toUpperCase(),
    description: seo?.description ?? script.summary,
    tags: (seo?.tags ?? []).join(", "),
    accentColor: "#38bdf8",
    scenes: script.scenes.map((s) => {
      const moodMap = {
        intro: "bright",
        problem: "exciting",
        action: "rainbow",
        solve: "space",
        celebrate: "celebrate",
      } as const;
      const actionMap = {
        intro: "intro_hook",
        problem: "problem",
        action: "move_in",
        solve: "solve",
        celebrate: "celebrate",
      } as const;
      return {
        sceneNumber: s.sceneNumber,
        label: s.label,
        durationSec: s.durationSec,
        narration: s.narration,
        subtitle: s.subtitle,
        mood: moodMap[s.mood],
        action: actionMap[s.mood],
      };
    }),
    createdByAuto: false,
    uploaded: Boolean(episode.metrics.uploadedAt),
  };
}

/**
 * DIVISI 4 — SUARA (TTS per adegan menggunakan Web Speech API browser gratis)
 * Memverifikasi ketersediaan suara Bahasa Indonesia di browser & menyusun track per adegan.
 */
export async function runVoiceDivisionBrowser(
  scenes: PipelineScene[]
): Promise<VoiceOutput> {
  if (typeof window === "undefined") {
    throw new Error("Divisi Suara harus dijalankan di browser.");
  }

  const hasSpeech = "speechSynthesis" in window;
  let chosenVoiceName = "Web Audio Synth Fallback";
  let lang = "id-ID";
  let engine: VoiceOutput["engine"] = "web-audio-bed";

  if (hasSpeech) {
    // Allow browser voices list to initialize
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 450);
        window.speechSynthesis.onvoiceschanged = () => {
          window.clearTimeout(timer);
          resolve();
        };
      });
      voices = window.speechSynthesis.getVoices();
    }

    const idVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith("id")) ??
      voices.find((v) => v.lang.toLowerCase().includes("ms")) ??
      voices[0];

    if (idVoice) {
      chosenVoiceName = idVoice.name;
      lang = idVoice.lang || "id-ID";
      engine = "web-speech-api";
    }
  }

  const sceneTracks: SceneVoiceTrack[] = scenes.map((scene) => {
    const wordCount = scene.narration.trim().split(/\s+/).filter(Boolean).length;
    const estimatedSec = Math.max(
      scene.durationSec,
      Math.ceil((wordCount / 2.4) * 10) / 10
    );
    return {
      sceneNumber: scene.sceneNumber,
      text: scene.narration,
      estimatedSec,
      voiceName: chosenVoiceName,
      lang,
      rate: 1.0,
      pitch: 1.12,
      status: engine === "web-speech-api" ? "ready" : "fallback-web-audio",
    };
  });

  const totalEstimatedSec = sceneTracks.reduce((acc, s) => acc + s.estimatedSec, 0);

  return {
    engine,
    voiceName: chosenVoiceName,
    lang,
    totalEstimatedSec: Math.round(totalEstimatedSec * 10) / 10,
    sceneTracks,
  };
}

/** Play real Web Speech API Indonesian narration for one scene or all scenes */
export function speakSceneTracks(
  tracks: SceneVoiceTrack[],
  onSceneStart?: (sceneNumber: number) => void,
  onDone?: () => void
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onDone?.();
    return () => {};
  }

  window.speechSynthesis.cancel();
  let cancelled = false;
  const voices = window.speechSynthesis.getVoices();

  const speakIndex = (idx: number) => {
    if (cancelled || idx >= tracks.length) {
      if (!cancelled) onDone?.();
      return;
    }
    const track = tracks[idx];
    const utter = new SpeechSynthesisUtterance(track.text);
    utter.lang = track.lang || "id-ID";
    utter.rate = track.rate || 1.0;
    utter.pitch = track.pitch || 1.1;

    const match =
      voices.find((v) => v.name === track.voiceName) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("id"));
    if (match) utter.voice = match;

    utter.onstart = () => {
      if (!cancelled) onSceneStart?.(track.sceneNumber);
    };
    utter.onend = () => speakIndex(idx + 1);
    utter.onerror = () => speakIndex(idx + 1);
    window.speechSynthesis.speak(utter);
  };

  speakIndex(0);

  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
  };
}

/**
 * DIVISI 5 — MOTION (Render keyframe animasi per adegan secara nyata di HTML5 Canvas browser)
 */
export async function runMotionDivisionBrowser(
  episode: RealEpisode,
  format: VideoFormat
): Promise<MotionOutput> {
  if (typeof document === "undefined") {
    throw new Error("Divisi Motion harus dijalankan di browser.");
  }

  const renderable = buildRenderableEpisode(episode);
  if (!renderable) {
    throw new Error("Naskah adegan belum tersedia untuk Divisi Motion.");
  }

  const width = format === "shorts" ? 720 : 1280;
  const height = format === "shorts" ? 1280 : 720;

  // Render real storyboard keyframes per scene on an offscreen canvas
  const previewW = format === "shorts" ? 270 : 426;
  const previewH = format === "shorts" ? 480 : 240;
  const canvas = document.createElement("canvas");
  canvas.width = previewW;
  canvas.height = previewH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia di browser.");
  }

  const sceneFrames: SceneMotionFrame[] = [];
  let cursorSec = 0;

  for (const scene of renderable.scenes) {
    const sampleTime = cursorSec + scene.durationSec * 0.45;
    renderCartoonFrame(ctx, previewW, previewH, renderable, sampleTime);
    const keyframeDataUrl = canvas.toDataURL("image/jpeg", 0.72);
    sceneFrames.push({
      sceneNumber: scene.sceneNumber,
      label: scene.label,
      durationSec: scene.durationSec,
      keyframeDataUrl,
    });
    cursorSec += scene.durationSec;
    // Yield to browser paint loop so UI stays responsive
    await new Promise((r) => window.setTimeout(r, 16));
  }

  return {
    format,
    width,
    height,
    fps: 30,
    totalDurationSec: cursorSec,
    sceneFrames,
  };
}

/**
 * DIVISI 6 — EDITING (Gabung animasi Canvas + audio via MediaRecorder -> Blob video & HD 1280x720 Thumbnail PNG)
 */
export async function runEditingDivisionBrowser(
  episode: RealEpisode,
  format: VideoFormat,
  onProgress?: (pct: number) => void
): Promise<{ output: EditingOutput; videoBlob: Blob }> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Divisi Editing hanya bisa berjalan di browser.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error(
      "Browser ini belum mendukung MediaRecorder. Gunakan Chrome/Edge/Firefox terbaru untuk ekspor video."
    );
  }

  const renderable = buildRenderableEpisode(episode);
  if (!renderable) {
    throw new Error("Naskah & Motion belum siap untuk Editing.");
  }

  // 1. Render crisp 1280x720 HD Thumbnail PNG
  const thumbnailDataUrl = renderKidsThumbnail(renderable);

  // 2. Render & mux real Canvas video + Web Audio bed via MediaRecorder
  const width = format === "shorts" ? 720 : 1280;
  const height = format === "shorts" ? 1280 : 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Gagal membuat Canvas 2D untuk ekspor video.");
  }

  const totalSec = Math.max(
    6,
    renderable.scenes.reduce((acc, s) => acc + s.durationSec, 0)
  );
  const videoStream = canvas.captureStream(30);
  const melody = startKidsMelody(false);

  const combinedStream = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
  if (melody.audioStream) {
    melody.audioStream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  }

  const preferredMime = MediaRecorder.isTypeSupported(
    "video/webm;codecs=vp9,opus"
  )
    ? "video/webm;codecs=vp9,opus"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
    ? "video/webm;codecs=vp8,opus"
    : "video/webm";

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: preferredMime,
    videoBitsPerSecond: 3_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  const blobPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      melody.stop();
      resolve(new Blob(chunks, { type: preferredMime }));
    };
    recorder.onerror = () => {
      melody.stop();
      reject(new Error("MediaRecorder gagal saat merekam video."));
    };
  });

  recorder.start(250);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      if (elapsedSec >= totalSec) {
        onProgress?.(100);
        if (recorder.state !== "inactive") recorder.stop();
        resolve();
        return;
      }
      renderCartoonFrame(ctx, width, height, renderable, elapsedSec);
      onProgress?.(Math.min(99, Math.round((elapsedSec / totalSec) * 100)));
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });

  const videoBlob = await blobPromise;
  const safeSlug = renderable.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);

  const output: EditingOutput = {
    videoMimeType: videoBlob.type || preferredMime,
    videoSizeBytes: videoBlob.size,
    videoDurationSec: totalSec,
    thumbnailWidth: 1280,
    thumbnailHeight: 720,
    thumbnailDataUrl,
    exportedAt: new Date().toISOString(),
    fileName: `ep-${episode.episodeNumber}-${safeSlug || "video"}.webm`,
  };

  return { output, videoBlob };
}
