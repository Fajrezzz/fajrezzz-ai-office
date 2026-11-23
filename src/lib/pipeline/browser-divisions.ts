"use client";

import type { VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  buildEditorialEpisode,
  renderEditorialFrame,
  renderEditorialThumbnail,
  startAmbientSynthBed,
} from "@/lib/pipeline/motion-renderer";
import {
  fetchNeuralSpeechClip,
  getCachedNeuralClip,
  type CachedNeuralClip,
} from "@/lib/pipeline/neural-tts-client";
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
 * DIVISI 4 — SUARA (Modern Natural Indonesian Neural Human Voice via `/api/tts`
 * Microsoft Edge Neural `id-ID-ArdiNeural` -> Google Neural fallback -> Web Speech last resort)
 */
export async function runVoiceDivisionBrowser(
  scenes: PipelineScene[]
): Promise<VoiceOutput> {
  if (typeof window === "undefined") {
    throw new Error("Divisi Suara harus dijalankan di browser.");
  }

  const neuralResults: Array<CachedNeuralClip | null> = [];
  // Fetch in crisp batches of 2 so all scenes synthesize fast & reliably
  for (let i = 0; i < scenes.length; i += 2) {
    const batch = scenes.slice(i, i + 2);
    const clips = await Promise.all(
      batch.map((sc) => fetchNeuralSpeechClip(sc.narration, "ardi"))
    );
    neuralResults.push(...clips);
  }

  const firstNeural = neuralResults.find((c) => c !== null) ?? null;

  if (firstNeural) {
    const sceneTracks: SceneVoiceTrack[] = scenes.map((scene, idx) => {
      const clip = neuralResults[idx];
      const wordCount = scene.narration.trim().split(/\s+/).filter(Boolean).length;
      const estimatedSec =
        clip?.durationSec && clip.durationSec > 0.5
          ? Math.max(scene.durationSec, clip.durationSec)
          : Math.max(scene.durationSec, Math.ceil((wordCount / 2.6) * 10) / 10);

      return {
        sceneNumber: scene.sceneNumber,
        text: scene.narration,
        estimatedSec: Math.round(estimatedSec * 10) / 10,
        voiceName: clip?.voiceName ?? firstNeural.voiceName,
        lang: "id-ID",
        rate: 1.05,
        pitch: 1.0,
        status: "ready",
      };
    });

    const totalEstimatedSec = sceneTracks.reduce((acc, s) => acc + s.estimatedSec, 0);
    return {
      engine: firstNeural.provider,
      voiceName: firstNeural.voiceName,
      lang: "id-ID",
      totalEstimatedSec: Math.round(totalEstimatedSec * 10) / 10,
      sceneTracks,
    };
  }

  // Offline / last-resort fallback to browser Web Speech API
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
      rate: 1.04,
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

/**
 * Play REAL Modern Natural Indonesian Neural Human Voice MP3 clips scene-by-scene
 * (automatically fetches from `/api/tts` if not yet cached, graceful fallback to Web Speech only if offline).
 */
export function speakSceneTracks(
  tracks: SceneVoiceTrack[],
  onSceneStart?: (sceneNumber: number) => void,
  onDone?: () => void
): () => void {
  if (typeof window === "undefined") {
    onDone?.();
    return () => {};
  }

  let cancelled = false;
  let activeAudio: HTMLAudioElement | null = null;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  const playIndex = async (idx: number) => {
    if (cancelled || idx >= tracks.length) {
      if (!cancelled) onDone?.();
      return;
    }

    const track = tracks[idx];
    // 1. Prefer cached or freshly synthesized Neural Human Voice MP3!
    const clip =
      getCachedNeuralClip(track.text, "ardi") ??
      (await fetchNeuralSpeechClip(track.text, "ardi"));

    if (cancelled) return;

    if (clip) {
      onSceneStart?.(track.sceneNumber);
      const audio = new Audio(clip.objectUrl);
      activeAudio = audio;
      audio.volume = 1.0;

      const finish = () => {
        if (activeAudio === audio) activeAudio = null;
        if (!cancelled) void playIndex(idx + 1);
      };

      audio.onended = finish;
      audio.onerror = finish;

      try {
        await audio.play();
        return;
      } catch {
        // Autoplay or audio decode error -> proceed cleanly to fallback
      }
    }

    // 2. Fallback only if Neural MP3 unavailable
    if ("speechSynthesis" in window && !cancelled) {
      const voices = window.speechSynthesis.getVoices();
      const utter = new SpeechSynthesisUtterance(track.text);
      utter.lang = track.lang || "id-ID";
      utter.rate = track.rate || 1.04;
      utter.pitch = track.pitch || 1.0;
      const match =
        voices.find((v) => v.lang.toLowerCase().startsWith("id")) ?? voices[0];
      if (match) utter.voice = match;
      utter.onstart = () => {
        if (!cancelled) onSceneStart?.(track.sceneNumber);
      };
      utter.onend = () => void playIndex(idx + 1);
      utter.onerror = () => void playIndex(idx + 1);
      window.speechSynthesis.speak(utter);
    } else if (!cancelled) {
      void playIndex(idx + 1);
    }
  };

  void playIndex(0);

  return () => {
    cancelled = true;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };
}

/**
 * DIVISI 5 — MOTION (Render keyframe motion-graphics viral style per adegan di HTML5 Canvas)
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
    const sampleTime = cursorSec + scene.durationSec * 0.48;
    renderEditorialFrame(ctx, previewW, previewH, editorial, sampleTime);
    const keyframeDataUrl = canvas.toDataURL("image/jpeg", 0.78);
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
 * DIVISI 6 — EDITING (Gabung viral motion-graphics Canvas + REAL Neural Human Voice MP3 + ducked ambient bed -> Video `.webm` + HD Thumbnail 1280x720)
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

  // Ensure Neural Human Voice MP3 clips are ready for muxing into the exported video!
  const sceneClips = await Promise.all(
    editorial.scenes.map(
      (sc) =>
        getCachedNeuralClip(sc.narration, "ardi") ??
        fetchNeuralSpeechClip(sc.narration, "ardi")
    )
  );

  // Sync each scene duration so the neural narrator finishes naturally without getting cut off
  const syncedScenes = editorial.scenes.map((sc, idx) => {
    const clip = sceneClips[idx];
    const naturalDur = clip?.durationSec ? Math.max(sc.durationSec, clip.durationSec + 0.35) : sc.durationSec;
    return {
      ...sc,
      durationSec: Math.round(naturalDur * 10) / 10,
    };
  });
  const syncedEditorial = { ...editorial, scenes: syncedScenes };

  // 1. Render crisp 1280x720 Modern Editorial HD Thumbnail PNG
  const thumbnailDataUrl = renderEditorialThumbnail(syncedEditorial);

  // 2. Render & mux real Canvas video + REAL Neural Human Voice MP3s + ducked synth bed via MediaRecorder
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
    syncedEditorial.scenes.reduce((acc, s) => acc + s.durationSec, 0)
  );
  const videoStream = canvas.captureStream(30);
  // Subtle ducked background synth bed (0.045) so real human narrator shines crystal-clear!
  const synthBed = startAmbientSynthBed(false, 0.045);

  // Decode & schedule every scene's real Neural Human MP3 directly into the MediaRecorder audio track!
  if (synthBed.audioCtx && synthBed.voiceBus) {
    const audioCtx = synthBed.audioCtx;
    const voiceBus = synthBed.voiceBus;
    // Gently attempt AudioContext resume (non-blocking in zero-click Auto-Pilot mode)
    if (audioCtx.state === "suspended") {
      await Promise.race([
        audioCtx.resume().catch(() => {}),
        new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
      ]);
    }
    const decodedBuffers = await Promise.all(
      sceneClips.map(async (clip) => {
        if (!clip) return null;
        try {
          const arr = await clip.blob.arrayBuffer();
          return await audioCtx.decodeAudioData(arr.slice(0));
        } catch {
          return null;
        }
      })
    );

    const baseAudioTime = audioCtx.currentTime + 0.12;
    let sceneOffsetSec = 0;
    syncedEditorial.scenes.forEach((sc, idx) => {
      const buf = decodedBuffers[idx];
      if (buf) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(voiceBus);
        src.start(baseAudioTime + sceneOffsetSec);
      }
      sceneOffsetSec += sc.durationSec;
    });
  }

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
    videoBitsPerSecond: 3_600_000,
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
      renderEditorialFrame(ctx, width, height, syncedEditorial, elapsedSec);
      onProgress?.(Math.min(99, Math.round((elapsedSec / totalSec) * 100)));
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });

  const videoBlob = await blobPromise;
  const safeSlug = syncedEditorial.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);

  const output: EditingOutput = {
    videoMimeType: videoBlob.type || preferredMime,
    videoSizeBytes: videoBlob.size,
    videoDurationSec: Math.round(totalSec * 10) / 10,
    thumbnailWidth: 1280,
    thumbnailHeight: 720,
    thumbnailDataUrl,
    exportedAt: new Date().toISOString(),
    fileName: `ep-${episode.episodeNumber}-${safeSlug || "video"}.webm`,
  };

  return { output, videoBlob };
}
