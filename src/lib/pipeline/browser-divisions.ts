"use client";

import type { VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  buildEditorialEpisode,
  renderEditorialFrame,
  renderEditorialThumbnail,
  startAmbientSynthBed,
} from "@/lib/pipeline/motion-renderer";
import type {
  EditingOutput,
  MotionOutput,
  PipelineScene,
  RealEpisode,
  SceneMotionFrame,
  SceneVoiceTrack,
  VoiceOutput,
} from "@/types/pipeline";

/**
 * DIVISI 4 — SUARA (TTS per adegan menggunakan Web Speech API browser gratis)
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
      Math.ceil((wordCount / 2.5) * 10) / 10
    );
    return {
      sceneNumber: scene.sceneNumber,
      text: scene.narration,
      estimatedSec,
      voiceName: chosenVoiceName,
      lang,
      rate: 1.02,
      pitch: 1.0,
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
    utter.rate = track.rate || 1.02;
    utter.pitch = track.pitch || 1.0;

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
 * DIVISI 5 — MOTION (Render keyframe motion-graphics modern per adegan di HTML5 Canvas)
 */
export async function runMotionDivisionBrowser(
  episode: RealEpisode,
  format: VideoFormat
): Promise<MotionOutput> {
  if (typeof document === "undefined") {
    throw new Error("Divisi Motion harus dijalankan di browser.");
  }

  const editorial = buildEditorialEpisode(episode);
  if (!editorial) {
    throw new Error("Naskah adegan belum tersedia untuk Divisi Motion.");
  }

  const width = format === "shorts" ? 720 : 1280;
  const height = format === "shorts" ? 1280 : 720;

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

  for (const scene of editorial.scenes) {
    const sampleTime = cursorSec + scene.durationSec * 0.45;
    renderEditorialFrame(ctx, previewW, previewH, editorial, sampleTime);
    const keyframeDataUrl = canvas.toDataURL("image/jpeg", 0.74);
    sceneFrames.push({
      sceneNumber: scene.sceneNumber,
      label: scene.label,
      durationSec: scene.durationSec,
      keyframeDataUrl,
    });
    cursorSec += scene.durationSec;
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
 * DIVISI 6 — EDITING (Gabung motion-graphics Canvas + audio ambient via MediaRecorder -> Video + HD Thumbnail 1280x720)
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

  const editorial = buildEditorialEpisode(episode);
  if (!editorial) {
    throw new Error("Naskah & Motion belum siap untuk Editing.");
  }

  // 1. Render crisp 1280x720 Modern Editorial HD Thumbnail PNG
  const thumbnailDataUrl = renderEditorialThumbnail(editorial);

  // 2. Render & mux real Canvas video + modern ambient audio via MediaRecorder
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
    editorial.scenes.reduce((acc, s) => acc + s.durationSec, 0)
  );
  const videoStream = canvas.captureStream(30);
  const synthBed = startAmbientSynthBed(false);

  const combinedStream = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
  if (synthBed.audioStream) {
    synthBed.audioStream
      .getAudioTracks()
      .forEach((t) => combinedStream.addTrack(t));
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
      synthBed.stop();
      resolve(new Blob(chunks, { type: preferredMime }));
    };
    recorder.onerror = () => {
      synthBed.stop();
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
      renderEditorialFrame(ctx, width, height, editorial, elapsedSec);
      onProgress?.(Math.min(99, Math.round((elapsedSec / totalSec) * 100)));
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });

  const videoBlob = await blobPromise;
  const safeSlug = editorial.title
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
