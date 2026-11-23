"use client";

import type { VideoFormat } from "@/lib/kids-studio/episode-brain";
import {
  buildEditorialEpisode,
  renderEditorialFrame,
  renderEditorialThumbnail,
  scheduleSceneTransitionsSfx,
  startAmbientSynthBed,
  type EditorialEpisode,
} from "@/lib/pipeline/motion-renderer";
import {
  fetchNeuralSpeechClip,
  getCachedNeuralClip,
  type CachedNeuralClip,
} from "@/lib/pipeline/neural-tts-client";
import {
  computeSyncedSceneDuration,
  computeWordTimings,
  renderTikTokVideoV3,
  type SceneAudioScheduleItem,
} from "@/lib/pipeline/video-engine-v3";
import { trimAudioBufferDeadAir } from "@/lib/pipeline/auto-editor-pacing";
import {
  fetchEpisodeBRollImages,
  getCachedSceneBRoll,
} from "@/lib/pipeline/scene-broll-client";
import type {
  EditingOutput,
  ExportQualityPreset,
  MotionOutput,
  PipelineScene,
  RealEpisode,
  RenderProgressSnapshot,
  SceneMotionFrame,
  SceneVoiceTrack,
  VoiceOutput,
} from "@/types/pipeline";

/**
 * DIVISI 4 — SUARA (Modern Natural Indonesian Neural Human Voice via `/api/tts`
 * Measures EXACT MP3 duration & computes syllable-weighted word timings for 0ms A/V sync!)
 */
export async function runVoiceDivisionBrowser(
  scenes: PipelineScene[]
): Promise<VoiceOutput> {
  if (typeof window === "undefined") {
    throw new Error("Divisi Suara harus dijalankan di browser.");
  }

  const neuralResults: Array<CachedNeuralClip | null> = [];
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
      const measuredSec =
        clip?.durationSec && clip.durationSec > 0.45 ? clip.durationSec : null;
      const synced = computeSyncedSceneDuration(measuredSec, scene.durationSec);
      const wordTimings = computeWordTimings(
        scene.narration,
        synced.speechOffsetSec,
        synced.speechDurationSec
      );

      return {
        sceneNumber: scene.sceneNumber,
        text: scene.narration,
        estimatedSec: synced.sceneDurationSec,
        actualAudioSec: measuredSec ?? synced.speechDurationSec,
        speechOffsetSec: synced.speechOffsetSec,
        wordTimings,
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
    const estSpeech = Math.max(2.6, Math.ceil((wordCount / 2.65) * 10) / 10);
    const synced = computeSyncedSceneDuration(estSpeech, scene.durationSec);
    return {
      sceneNumber: scene.sceneNumber,
      text: scene.narration,
      estimatedSec: synced.sceneDurationSec,
      actualAudioSec: synced.speechDurationSec,
      speechOffsetSec: synced.speechOffsetSec,
      wordTimings: computeWordTimings(
        scene.narration,
        synced.speechOffsetSec,
        synced.speechDurationSec
      ),
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
 * Play a single scene track cleanly (used by "Dengar TTS" button per scene).
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
        // fallback below
      }
    }

    if ("speechSynthesis" in window && !cancelled) {
      const voices = window.speechSynthesis.getVoices();
      const utter = new SpeechSynthesisUtterance(track.text);
      utter.lang = track.lang || "id-ID";
      utter.rate = track.rate || 1.04;
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
 * SAMPLE-ACCURATE MASTER-CLOCK LIVE PREVIEW PLAYBACK!
 * Fixes audio-text desync completely: decodes every scene's real neural MP3 first,
 * locks every scene's duration & word timings to the exact decoded buffer length,
 * schedules audio + auto-ducking + SFX on ONE Web Audio AudioContext clock,
 * and drives the canvas at `elapsed = audioCtx.currentTime - baseAudioTime`!
 */
export async function startSyncedLivePreview(options: {
  episode: RealEpisode;
  canvas: HTMLCanvasElement;
  muted: boolean;
  onTick?: (elapsedSec: number, totalSec: number, activeSceneNum: number) => void;
  onEnd?: () => void;
}): Promise<() => void> {
  const { episode, canvas, muted, onTick, onEnd } = options;
  const ctx = canvas.getContext("2d");
  const baseEditorial = buildEditorialEpisode(episode);
  if (!ctx || !baseEditorial) {
    onEnd?.();
    return () => {};
  }

  let stopped = false;
  let rafId: number | null = null;

  // Fetch / retrieve cached neural MP3 clips for every scene first so timing is exact!
  const clips = await Promise.all(
    baseEditorial.scenes.map(
      (sc) =>
        getCachedNeuralClip(sc.narration, "ardi") ??
        fetchNeuralSpeechClip(sc.narration, "ardi")
    )
  );
  if (stopped) return () => {};

  const synth = !muted ? startAmbientSynthBed(true, 0.065) : null;
  const audioCtx = synth?.audioCtx ?? null;

  let decodedBuffers: Array<AudioBuffer | null> = clips.map(() => null);
  if (audioCtx && synth?.voiceBus) {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume().catch(() => {});
    }
    decodedBuffers = await Promise.all(
      clips.map(async (clip) => {
        if (!clip) return null;
        try {
          const arr = await clip.blob.arrayBuffer();
          const rawBuf = await audioCtx.decodeAudioData(arr.slice(0));
          // Auto-Editor inspired PCM silence trimmer: removes leading/trailing dead air for punchy TikTok pacing!
          return trimAudioBufferDeadAir(audioCtx, rawBuf, {
            thresholdDb: -40,
            marginSec: 0.06,
          }).buffer;
        } catch {
          return null;
        }
      })
    );
  }
  if (stopped) {
    synth?.stop();
    return () => {};
  }

  // Rebuild editorial timeline using the EXACT decoded AudioBuffer durations!
  const exactDurations = decodedBuffers.map((buf, idx) =>
    buf ? buf.duration : clips[idx]?.durationSec ?? null
  );
  const syncedEditorial: EditorialEpisode =
    buildEditorialEpisode(episode, exactDurations) ?? baseEditorial;
  const totalSec = syncedEditorial.scenes.reduce((sum, sc) => sum + sc.durationSec, 0);

  let baseAudioTime = 0;
  const wallStartMs = performance.now();

  if (audioCtx && synth?.voiceBus) {
    baseAudioTime = audioCtx.currentTime + 0.08;
    let cursorSec = 0;
    syncedEditorial.scenes.forEach((sc, idx) => {
      const buf = decodedBuffers[idx];
      if (buf) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(synth.voiceBus!);
        const startAt = baseAudioTime + cursorSec + sc.speechOffsetSec;
        src.start(startAt);

        // Real-time auto-ducking in live preview too!
        if (synth.bgmGain) {
          synth.bgmGain.gain.setTargetAtTime(0.024, Math.max(0, startAt - 0.04), 0.04);
          synth.bgmGain.gain.setTargetAtTime(0.068, startAt + buf.duration, 0.09);
        }
      }
      cursorSec += sc.durationSec;
    });

    scheduleSceneTransitionsSfx(
      audioCtx,
      synth.voiceBus,
      baseAudioTime,
      syncedEditorial.scenes.map((s) => s.durationSec)
    );
  }

  const cleanup = () => {
    stopped = true;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    synth?.stop();
  };

  const loop = (now: number) => {
    if (stopped) return;
    const elapsed = audioCtx
      ? Math.max(0, audioCtx.currentTime - baseAudioTime)
      : (now - wallStartMs) / 1000;

    if (elapsed >= totalSec) {
      renderEditorialFrame(ctx, canvas.width, canvas.height, syncedEditorial, totalSec - 0.01);
      onTick?.(totalSec, totalSec, syncedEditorial.scenes.length);
      cleanup();
      onEnd?.();
      return;
    }

    renderEditorialFrame(ctx, canvas.width, canvas.height, syncedEditorial, elapsed);

    let acc = 0;
    let activeNum = 1;
    for (const sc of syncedEditorial.scenes) {
      if (elapsed < acc + sc.durationSec) {
        activeNum = sc.sceneNumber;
        break;
      }
      acc += sc.durationSec;
    }
    onTick?.(elapsed, totalSec, activeNum);
    rafId = window.requestAnimationFrame(loop);
  };

  rafId = window.requestAnimationFrame(loop);
  return cleanup;
}

/**
 * DIVISI 5 — MOTION (Render TikTok 9:16 keyframe previews per scene)
 */
export async function runMotionDivisionBrowser(
  episode: RealEpisode,
  _format: VideoFormat
): Promise<MotionOutput> {
  void _format;
  if (typeof document === "undefined") {
    throw new Error("Divisi Motion harus dijalankan di browser.");
  }

  const editorial = buildEditorialEpisode(episode);
  if (!editorial) {
    throw new Error("Naskah adegan belum tersedia untuk Divisi Motion.");
  }

  // TikTok Vertical 9:16 is ALWAYS primary
  const width = 1080;
  const height = 1920;
  const previewW = 270;
  const previewH = 480;
  const canvas = document.createElement("canvas");
  canvas.width = previewW;
  canvas.height = previewH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia di browser.");
  }

  const sceneFrames: SceneMotionFrame[] = [];
  let cursorSec = 0;
  // Artwork kolase yang sudah ter-cache dari render sebelumnya (tanpa request baru)
  const previewArtwork = getCachedSceneBRoll(editorial, "shorts");

  for (const scene of editorial.scenes) {
    const sampleTime = cursorSec + Math.min(scene.durationSec * 0.55, scene.durationSec - 0.35);
    renderEditorialFrame(ctx, previewW, previewH, editorial, sampleTime, previewArtwork);
    const keyframeDataUrl = canvas.toDataURL("image/jpeg", 0.86);
    sceneFrames.push({
      sceneNumber: scene.sceneNumber,
      label: scene.label,
      durationSec: scene.durationSec,
      keyframeDataUrl,
    });
    cursorSec += scene.durationSec;
    await new Promise((r) => window.setTimeout(r, 10));
  }

  return {
    format: "shorts",
    width,
    height,
    fps: 60,
    totalDurationSec: Math.round(cursorSec * 10) / 10,
    sceneFrames,
  };
}

/**
 * DIVISI 6 — EDITING V3 EXTREME QUALITY
 * Uses WebCodecs H.264/H.265 MP4 + AAC 48kHz + OfflineAudioContext Auto-Ducking
 * with automatic device capability probe, safe cancel, live ETA, and ACTUAL QC telemetry!
 */
export async function runEditingDivisionBrowser(
  episode: RealEpisode,
  _format: VideoFormat,
  onProgress?: (pct: number, detail?: RenderProgressSnapshot) => void,
  options?: {
    qualityPreset?: ExportQualityPreset;
    signal?: AbortSignal;
  }
): Promise<{ output: EditingOutput; videoBlob: Blob }> {
  void _format;
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Divisi Editing hanya bisa berjalan di browser.");
  }

  const baseEditorial = buildEditorialEpisode(episode);
  if (!baseEditorial) {
    throw new Error("Naskah & Motion belum siap untuk Editing.");
  }

  const preset: ExportQualityPreset = options?.qualityPreset ?? "ultra";

  // 1. Fetch & decode every scene's real Indonesian neural MP3 for 0ms-drift sample-accurate timing!
  const sceneClips = await Promise.all(
    baseEditorial.scenes.map(
      (sc) =>
        getCachedNeuralClip(sc.narration, "ardi") ??
        fetchNeuralSpeechClip(sc.narration, "ardi")
    )
  );

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const decodedBuffers: Array<AudioBuffer | null> = [];
  if (AudioCtx) {
    const decodeCtx = new AudioCtx();
    try {
      for (const clip of sceneClips) {
        if (!clip) {
          decodedBuffers.push(null);
          continue;
        }
        try {
          const arr = await clip.blob.arrayBuffer();
          const rawBuf = await decodeCtx.decodeAudioData(arr.slice(0));
          // Smart PCM dead-air silence trimming before timeline lock (auto-editor pacing!)
          decodedBuffers.push(
            trimAudioBufferDeadAir(decodeCtx, rawBuf, {
              thresholdDb: -40,
              marginSec: 0.06,
            }).buffer
          );
        } catch {
          decodedBuffers.push(null);
        }
      }
    } finally {
      await decodeCtx.close().catch(() => {});
    }
  } else {
    sceneClips.forEach(() => decodedBuffers.push(null));
  }

  // Build exact audio-locked editorial timeline (every scene & word synced to decoded MP3!)
  const exactDurations = decodedBuffers.map((buf, idx) =>
    buf ? buf.duration : sceneClips[idx]?.durationSec ?? null
  );
  const syncedEditorial =
    buildEditorialEpisode(episode, exactDurations) ?? baseEditorial;

  // v9 — artwork kolase per scene (soft-fail: tanpa API key panel ink digambar sendiri)
  const sceneArtwork = await fetchEpisodeBRollImages(
    syncedEditorial,
    _format ?? "shorts"
  ).catch(() => syncedEditorial.scenes.map(() => null));

  const totalSec = Math.max(
    8,
    syncedEditorial.scenes.reduce((acc, s) => acc + s.durationSec, 0)
  );

  // Build sample-accurate audio schedule
  let sceneCursor = 0;
  const schedule: SceneAudioScheduleItem[] = syncedEditorial.scenes.map((sc, idx) => {
    const item: SceneAudioScheduleItem = {
      sceneStartSec: sceneCursor,
      sceneDurationSec: sc.durationSec,
      speechOffsetSec: sc.speechOffsetSec,
      speechDurationSec: sc.speechDurationSec,
      audioBuffer: decodedBuffers[idx] ?? null,
      templateName: sc.template,
    };
    sceneCursor += sc.durationSec;
    return item;
  });

  // 2. Render crisp TikTok 9:16 vertical cover PNG (1080x1920)
  const thumbnailDataUrl = renderEditorialThumbnail(syncedEditorial, sceneArtwork);

  // 3. Render video via V3 Extreme Quality Engine (WebCodecs MP4 primary -> MediaRecorder fallback)
  const result = await renderTikTokVideoV3({
    preset,
    totalDurationSec: totalSec,
    schedule,
    signal: options?.signal,
    renderFrame: (ctx, w, h, elapsedSec) => {
      renderEditorialFrame(ctx, w, h, syncedEditorial, elapsedSec, sceneArtwork);
    },
    onProgress: (snap) => {
      onProgress?.(snap.percent, snap);
    },
  });

  const safeSlug = syncedEditorial.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);

  const output: EditingOutput = {
    videoMimeType: result.mimeType,
    videoSizeBytes: result.blob.size,
    videoDurationSec: result.telemetry.actualDurationSec,
    thumbnailWidth: 1080,
    thumbnailHeight: 1920,
    thumbnailDataUrl,
    exportedAt: new Date().toISOString(),
    fileName: `tiktok-ep-${episode.episodeNumber}-${safeSlug || "ai-agent"}.${result.extension}`,
    qcTelemetry: result.telemetry,
  };

  return { output, videoBlob: result.blob };
}
