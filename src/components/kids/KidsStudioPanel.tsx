"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Pause,
  Play,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  renderCartoonFrame,
  renderKidsThumbnail,
  startKidsMelody,
} from "@/lib/kids-studio/cartoon-renderer";
import {
  ALL_KIDS_THEMES,
  generateAutonomousKidsEpisode,
  type KidsEpisode,
  type KidsThemeId,
  type VideoFormat,
} from "@/lib/kids-studio/episode-brain";
import { useOffice } from "@/store/OfficeContext";

const STORAGE_KEY = "fajrezzz_kids_episodes_v1";
const AUTOPILOT_INTERVAL_SEC = 45;

export function KidsStudioPanel() {
  const { addActivity, setActiveSection } = useOffice();

  const [episodes, setEpisodes] = useState<KidsEpisode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<VideoFormat>("shorts");
  const [chosenTheme, setChosenTheme] = useState<KidsThemeId | "auto">("auto");
  const [autopilotOn, setAutopilotOn] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(AUTOPILOT_INTERVAL_SEC);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Playback & Video Export state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showScriptDetail, setShowScriptDetail] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const melodyStopRef = useRef<(() => void) | null>(null);
  const playStartRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const nextEpNumberRef = useRef<number>(1);

  // Load saved episodes or auto-create Episode #1 immediately on first visit
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as KidsEpisode[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEpisodes(parsed);
          setSelectedId(parsed[0].id);
          nextEpNumberRef.current =
            Math.max(...parsed.map((e) => e.episodeNumber)) + 1;
          return;
        }
      }
    } catch {
      // ignore storage read error
    }

    const first = generateAutonomousKidsEpisode(1, "rescue_trucks", true);
    nextEpNumberRef.current = 2;
    setEpisodes([first]);
    setSelectedId(first.id);
  }, []);

  // Persist queue to localStorage
  useEffect(() => {
    if (episodes.length === 0) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(episodes.slice(0, 20))
      );
    } catch {
      // ignore quota error
    }
  }, [episodes]);

  const activeEpisode = useMemo(() => {
    if (episodes.length === 0) return null;
    return episodes.find((e) => e.id === selectedId) ?? episodes[0];
  }, [episodes, selectedId]);

  const totalDurationSec = useMemo(() => {
    if (!activeEpisode) return 22;
    return activeEpisode.scenes.reduce((acc, s) => acc + s.durationSec, 0);
  }, [activeEpisode]);

  const createNewEpisode = useCallback(
    async (createdByAuto = false) => {
      setIsCreating(true);
      const epNum = nextEpNumberRef.current;
      nextEpNumberRef.current += 1;

      const themeParam =
        !createdByAuto && chosenTheme !== "auto" ? chosenTheme : undefined;

      try {
        const res = await fetch("/api/kids-studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            episodeNumber: epNum,
            themeId: themeParam,
            createdByAuto,
          }),
        });
        let created: KidsEpisode;
        if (res.ok) {
          const data = (await res.json()) as { episode: KidsEpisode };
          created = data.episode;
        } else {
          created = generateAutonomousKidsEpisode(
            epNum,
            themeParam,
            createdByAuto
          );
        }

        setEpisodes((prev) => [created, ...prev].slice(0, 20));
        if (!createdByAuto) {
          setSelectedId(created.id);
          currentTimeRef.current = 0;
        }

        addActivity(
          createdByAuto ? "AUTOPILOT YT" : "BOS FAJREZ",
          createdByAuto ? "robot-placeholder" : "user",
          `Episode #${created.episodeNumber} siap upload: "${created.thumbnailHeadline}" (${created.themeLabel}).`,
          "success",
          "Studio YT Anak"
        );
      } catch {
        const fallback = generateAutonomousKidsEpisode(
          epNum,
          themeParam,
          createdByAuto
        );
        setEpisodes((prev) => [fallback, ...prev].slice(0, 20));
      } finally {
        setIsCreating(false);
      }
    },
    [addActivity, chosenTheme]
  );

  // True Autonomous Autopilot Timer: thinks & creates fresh episodes on its own (up to 12 in queue)
  useEffect(() => {
    if (!autopilotOn) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (episodes.length < 12 && !isRecording) {
            void createNewEpisode(true);
          }
          return AUTOPILOT_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autopilotOn, createNewEpisode, episodes.length, isRecording]);

  // Stop playback helper
  const stopPlayback = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (melodyStopRef.current) {
      melodyStopRef.current();
      melodyStopRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // Draw static preview frame whenever episode or format changes
  useEffect(() => {
    if (!activeEpisode || !canvasRef.current || isPlaying || isRecording) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, 1.2);
  }, [activeEpisode, format, isPlaying, isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const handleTogglePlay = () => {
    if (!activeEpisode || !canvasRef.current || isRecording) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsPlaying(true);
    playStartRef.current = performance.now();

    if (soundEnabled) {
      const melody = startKidsMelody(true);
      melodyStopRef.current = melody.stop;

      // Optional friendly Indonesian voice preview in browser
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const fullNarration = activeEpisode.scenes
          .map((s) => s.narration)
          .join(" ");
        const utter = new SpeechSynthesisUtterance(fullNarration);
        utter.lang = "id-ID";
        utter.rate = 1.05;
        utter.pitch = 1.15;
        window.speechSynthesis.speak(utter);
      }
    }

    const tick = (now: number) => {
      const elapsed = (now - playStartRef.current) / 1000;
      if (elapsed >= totalDurationSec) {
        renderCartoonFrame(
          ctx,
          canvas.width,
          canvas.height,
          activeEpisode,
          totalDurationSec - 0.1
        );
        stopPlayback();
        return;
      }
      currentTimeRef.current = elapsed;
      renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // REAL VIDEO EXPORTER (records animated cartoon + copyright-free kids melody -> downloadable video file!)
  const handleDownloadVideo = () => {
    if (!activeEpisode || !canvasRef.current || isRecording) return;
    stopPlayback();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (
      typeof MediaRecorder === "undefined" ||
      typeof canvas.captureStream !== "function"
    ) {
      setStatusNotice(
        "Browser ini belum mendukung rekam video otomatis. Coba buka di Chrome Android / Chrome PC terbaru."
      );
      return;
    }

    setStatusNotice("Sedang merekam animasi + musik bebas hak cipta...");
    setIsRecording(true);
    setRecordProgress(0);

    const videoStream = canvas.captureStream(30);
    const melody = startKidsMelody(false);
    melodyStopRef.current = melody.stop;

    const combinedStream = new MediaStream();
    videoStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
    if (melody.audioStream) {
      melody.audioStream
        .getAudioTracks()
        .forEach((t) => combinedStream.addTrack(t));
    }

    const mimeCandidates = [
      "video/mp4;codecs=avc1",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const supportedMime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

    const recorder = supportedMime
      ? new MediaRecorder(combinedStream, {
          mimeType: supportedMime,
          videoBitsPerSecond: 3_000_000,
        })
      : new MediaRecorder(combinedStream);

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    recorder.onstop = () => {
      if (melodyStopRef.current) {
        melodyStopRef.current();
        melodyStopRef.current = null;
      }
      const isMp4 = supportedMime.includes("mp4");
      const ext = isMp4 ? "mp4" : "webm";
      const blob = new Blob(chunks, {
        type: supportedMime || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yt-anak-ep${activeEpisode.episodeNumber}-${format}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsRecording(false);
      setRecordProgress(100);
      setStatusNotice(
        `Video Episode #${activeEpisode.episodeNumber} (.${ext}) berhasil di-download! Siap upload ke YouTube.`
      );
    };

    recorder.start(250);
    const startMs = performance.now();

    const recordFrame = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      const pct = Math.min(100, Math.round((elapsed / totalDurationSec) * 100));
      setRecordProgress(pct);

      if (elapsed >= totalDurationSec) {
        renderCartoonFrame(
          ctx,
          canvas.width,
          canvas.height,
          activeEpisode,
          totalDurationSec - 0.05
        );
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        return;
      }

      renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, elapsed);
      rafRef.current = requestAnimationFrame(recordFrame);
    };

    rafRef.current = requestAnimationFrame(recordFrame);
  };

  const handleDownloadThumbnail = () => {
    if (!activeEpisode) return;
    const pngUrl = renderKidsThumbnail(activeEpisode);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `thumbnail-yt-anak-ep${activeEpisode.episodeNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusNotice(
      `Thumbnail HD Episode #${activeEpisode.episodeNumber} (.png) berhasil di-download!`
    );
  };

  const handleCopyYouTubePack = async () => {
    if (!activeEpisode) return;
    const text = `JUDUL YOUTUBE:\n${activeEpisode.title}\n\nHOOK 3 DETIK:\n${activeEpisode.hook3s}\n\nDESKRIPSI & TAG:\n${activeEpisode.description}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(activeEpisode.id);
      window.setTimeout(() => setCopiedId(null), 2000);
      setStatusNotice("Judul, Hook & Deskripsi YouTube sudah disalin!");
    } catch {
      // ignore clipboard error
    }
  };

  const toggleUploaded = (id: string) => {
    setEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === id ? { ...ep, uploaded: !ep.uploaded } : ep
      )
    );
  };

  const deleteEpisode = (id: string) => {
    setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
  };

  const uploadedCount = episodes.filter((e) => e.uploaded).length;
  const canvasW = format === "shorts" ? 720 : 1280;
  const canvasH = format === "shorts" ? 1280 : 720;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ================= 1. SIMPLE AUTOPILOT HEADER ================= */}
      <section className="rounded-3xl border border-amber-400/35 bg-gradient-to-br from-[#0b152c] via-[#0d1936] to-[#171230] p-4 shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              100% GRATIS (Rp 0) · Bebas Hak Cipta YouTube
            </div>
            <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Autopilot Konten YouTube Animasi Anak
            </h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Web berpikir sendiri bikin ide, hook 3 detik, video animasi kartun
              + musik ceria, dan thumbnail HD. Kamu tinggal download lalu upload
              ke akun YouTube-mu.
            </p>
          </div>

          {/* Big Simple Autopilot Switch */}
          <button
            type="button"
            onClick={() => {
              setAutopilotOn((v) => !v);
              setCountdown(AUTOPILOT_INTERVAL_SEC);
            }}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition sm:text-sm ${
              autopilotOn
                ? "border-emerald-300 bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>
              {autopilotOn
                ? `Autopilot AKTIF (${countdown}d)`
                : "Autopilot MATI"}
            </span>
          </button>
        </div>

        {/* Simple Theme Picker + 1 Giant Create Button */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setChosenTheme("auto")}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                chosenTheme === "auto"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-900/90 text-slate-300 hover:text-white"
              }`}
            >
              🎲 Otomatis
            </button>
            {ALL_KIDS_THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setChosenTheme(th.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  chosenTheme === th.id
                    ? "bg-sky-400 text-slate-950"
                    : "bg-slate-900/90 text-slate-300 hover:text-white"
                }`}
              >
                {th.emoji} {th.label.split(" ")[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isCreating}
            onClick={() => void createNewEpisode(false)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 px-5 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-60 sm:text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isCreating ? "Sedang Berpikir..." : "Buat Episode Baru Sekarang"}
            </span>
          </button>
        </div>
      </section>

      {/* ================= 2. MAIN CARTOON PLAYER & DOWNLOAD STUDIO ================= */}
      {activeEpisode && (
        <section className="rounded-3xl border border-cyan-500/25 bg-[#070f22] p-4 shadow-xl sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT: LIVE ANIMATED CARTOON CANVAS */}
            <div className="flex flex-col items-center gap-3 lg:col-span-6">
              {/* Format Toggle (Shorts 9:16 vs YouTube 16:9) */}
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() => {
                      stopPlayback();
                      setFormat("shorts");
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      format === "shorts"
                        ? "bg-rose-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📱 YT Shorts (9:16)
                  </button>
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() => {
                      stopPlayback();
                      setFormat("landscape");
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      format === "landscape"
                        ? "bg-sky-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📺 YT Biasa (16:9)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((s) => !s)}
                  className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-500" />
                  )}
                  <span>{soundEnabled ? "Suara ON" : "Mute"}</span>
                </button>
              </div>

              {/* Cartoon Canvas Display */}
              <div className="relative flex w-full justify-center overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950 p-2">
                <canvas
                  ref={canvasRef}
                  width={canvasW}
                  height={canvasH}
                  className={
                    format === "shorts"
                      ? "h-[430px] w-auto max-w-full rounded-xl shadow-2xl sm:h-[470px]"
                      : "aspect-video w-full rounded-xl shadow-2xl"
                  }
                />

                {isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 p-4 text-center backdrop-blur-xs">
                    <Film className="h-10 w-10 animate-bounce text-amber-400" />
                    <div className="mt-2 text-sm font-black text-white">
                      Merekam Video Animasi... {recordProgress}%
                    </div>
                    <div className="mt-2 h-2.5 w-48 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                        style={{ width: `${recordProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">
                      Tunggu sebentar (~{Math.round(totalDurationSec)} detik),
                      video otomatis ter-download!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: CLEAN INFO & 4 BIG DOWNLOAD/COPY BUTTONS */}
            <div className="flex flex-col justify-between gap-4 lg:col-span-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black text-amber-300">
                    EPISODE #{activeEpisode.episodeNumber}
                  </span>
                  <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                    {activeEpisode.themeLabel}
                  </span>
                  {activeEpisode.createdByAuto && (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      Dibuat Autopilot
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black leading-snug text-white sm:text-lg">
                  {activeEpisode.title}
                </h3>

                {/* Highlighted 3-Second Hook Box */}
                <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3.5">
                  <div className="text-[11px] font-black tracking-wide text-rose-300 uppercase">
                    🔥 Hook 3 Detik (Biar Anak Langsung Nonton)
                  </div>
                  <p className="mt-1 text-sm font-bold text-white">
                    {activeEpisode.hook3s}
                  </p>
                </div>

                {statusNotice && (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">
                    {statusNotice}
                  </div>
                )}

                {/* 4 BIG CLEAR BUTTONS */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={handleTogglePlay}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/60 bg-sky-500/20 px-4 py-3.5 text-sm font-black text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" /> Jeda Animasi
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Putar Animasi
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={handleDownloadVideo}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadThumbnail}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/15 px-4 py-3 text-xs font-bold text-amber-200 transition hover:bg-amber-400/25"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Download Thumbnail HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyYouTubePack}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-100 transition hover:border-cyan-400"
                  >
                    {copiedId === activeEpisode.id ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Salin Judul &amp; Tag YT</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsible 5-Scene Story Details (keeps page super clean!) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
                  <button
                    type="button"
                    onClick={() => setShowScriptDetail((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    <span>Lihat Cerita 5 Adegan &amp; Hashtag YouTube</span>
                    {showScriptDetail ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showScriptDetail && (
                    <div className="space-y-2 border-t border-slate-800 px-4 py-3 text-xs">
                      {activeEpisode.scenes.map((sc) => (
                        <div key={sc.sceneNumber} className="text-slate-300">
                          <strong className="text-amber-300">
                            Adegan {sc.sceneNumber} ({sc.label}):
                          </strong>{" "}
                          {sc.narration}
                        </div>
                      ))}
                      <div className="pt-1 font-mono text-[11px] text-sky-400">
                        {activeEpisode.tags}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Simple link to watch 3D Office */}
              <button
                type="button"
                onClick={() => setActiveSection("office")}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 text-center text-xs font-semibold text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-200"
              >
                🏢 Mau lihat 10 karyawan &amp; main Bos FAJREZ? Buka Kantor 3D →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================= 3. SIMPLE READY-TO-UPLOAD QUEUE ================= */}
      <section className="rounded-3xl border border-slate-800 bg-[#070f22] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white sm:text-base">
              Daftar Episode Siap Upload ({episodes.length})
            </h3>
            <p className="text-xs text-slate-400">
              Sudah di-upload ke YouTube: {uploadedCount} dari {episodes.length}{" "}
              episode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {episodes.map((ep) => {
            const selected = ep.id === activeEpisode?.id;
            return (
              <div
                key={ep.id}
                onClick={() => {
                  stopPlayback();
                  setSelectedId(ep.id);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                  selected
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-slate-800 bg-slate-950/75 hover:border-slate-600"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-amber-300">
                      EP #{ep.episodeNumber}
                    </span>
                    <span className="truncate text-[10px] text-slate-400">
                      • {ep.themeLabel}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs font-bold text-white">
                    {ep.thumbnailHeadline}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUploaded(ep.id);
                    }}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                      ep.uploaded
                        ? "bg-emerald-500/25 text-emerald-300"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{ep.uploaded ? "Uploaded" : "Tandai YT"}</span>
                  </button>
                  {episodes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEpisode(ep.id);
                      }}
                      aria-label="Hapus episode"
                      className="rounded-xl p-1.5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
