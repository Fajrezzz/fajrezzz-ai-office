"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Check,
  CheckCircle2,
  Coffee,
  Copy,
  Download,
  Gamepad2,
  ImageDown,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import {
  renderCartoonFrame,
  renderKidsThumbnail,
  startKidsMelody,
} from "@/lib/kids-studio/cartoon-renderer";
import {
  renderEpisodeToVideoBlob,
} from "@/lib/kids-studio/youtube-upload";
import type {
  PublishPlatform,
  VideoFormat,
} from "@/lib/kids-studio/episode-brain";
import {
  AGENCY_DIVISIONS,
  useAgency,
} from "@/store/AgencyContext";
import { useOffice } from "@/store/OfficeContext";
import { YouTubeUploadModal } from "@/components/kids/YouTubeUploadModal";

const QUICK_PROMPTS: { label: string; brief: string; platform: PublishPlatform }[] = [
  {
    label: "🚒 Kartun Truk Pemadam",
    brief: "Bikinin video animasi anak tentang mobil pemadam dan polisi menolong kucing",
    platform: "youtube_shorts",
  },
  {
    label: "🦖 Kartun Dino Warna",
    brief: "Bikinin video kartun anak dinosaurus warna-warni belajar berhitung",
    platform: "youtube_shorts",
  },
  {
    label: "🚀 Kartun Roket Angkasa",
    brief: "Bikinin animasi anak roket terbang ke planet bulan",
    platform: "youtube_landscape",
  },
  {
    label: "🤖 Video TikTok Tools AI",
    brief: "Bikinin video TikTok soal tools AI gratis buat bikin konten otomatis",
    platform: "tiktok",
  },
];

export function KidsStudioPanel() {
  const { agents, setActiveSection } = useOffice();
  const {
    job,
    teamChat,
    episodes,
    selectedEpisodeId,
    setSelectedEpisodeId,
    autoApproveMode,
    setAutoApproveMode,
    submitBossBrief,
    selectIdeaOption,
    updateDraftFields,
    approveScriptAndProduce,
    markEpisodeUploaded,
    deleteEpisode,
  } = useAgency();

  const [briefInput, setBriefInput] = useState("");
  const [platform, setPlatform] = useState<PublishPlatform>("youtube_shorts");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const melodyStopRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeEpisode =
    episodes.find((ep) => ep.id === selectedEpisodeId) ?? episodes[0];

  const videoFormat: VideoFormat =
    platform === "youtube_landscape" ? "landscape" : "shorts";

  const totalDuration = activeEpisode
    ? activeEpisode.scenes.reduce((acc, s) => acc + s.durationSec, 0)
    : 22;

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (melodyStopRef.current) {
      melodyStopRef.current();
      melodyStopRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Draw static preview frame whenever episode or format changes
  useEffect(() => {
    stopPlayback();
    setPlayTime(0);
    const canvas = canvasRef.current;
    if (!canvas || !activeEpisode) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, 0.8);
  }, [activeEpisode, videoFormat, stopPlayback]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  // Live 60fps animation loop
  useEffect(() => {
    if (!isPlaying || !activeEpisode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isMuted) {
      const { stop } = startKidsMelody(true);
      melodyStopRef.current = stop;
    }

    const startMs = performance.now() - playTime * 1000;
    const tick = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      if (elapsed >= totalDuration) {
        renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, 0.2);
        setPlayTime(0);
        stopPlayback();
        return;
      }
      setPlayTime(elapsed);
      renderCartoonFrame(ctx, canvas.width, canvas.height, activeEpisode, elapsed);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      if (melodyStopRef.current) {
        melodyStopRef.current();
        melodyStopRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isMuted, activeEpisode?.id, videoFormat]);

  const handleSendBrief = (e: React.FormEvent) => {
    e.preventDefault();
    const text =
      briefInput.trim() ||
      "Bikinin video animasi anak truk pemadam penyelamat";
    submitBossBrief(text, platform);
    setBriefInput("");
  };

  const handleDownloadVideo = async () => {
    if (!activeEpisode || isExporting) return;
    stopPlayback();
    setIsExporting(true);
    setExportPct(0);
    try {
      const { blob, ext } = await renderEpisodeToVideoBlob(
        activeEpisode,
        videoFormat,
        (pct) => setExportPct(pct)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FAJREZZZ-EP${activeEpisode.episodeNumber}-${videoFormat}.${ext}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // Fallback ignored gracefully
    } finally {
      setIsExporting(false);
      setExportPct(0);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!activeEpisode) return;
    const dataUrl = renderKidsThumbnail(activeEpisode);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `THUMBNAIL-EP${activeEpisode.episodeNumber}.png`;
    a.click();
  };

  const handleCopySEO = async () => {
    if (!activeEpisode) return;
    const pack = `JUDUL:\n${activeEpisode.title}\n\nHOOK 3 DETIK:\n${activeEpisode.hook3s}\n\nDESKRIPSI:\n${activeEpisode.description}\n\nTAGS:\n${activeEpisode.tags}`;
    try {
      await navigator.clipboard.writeText(pack);
      setCopiedId(activeEpisode.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleQuickStudioUpload = async () => {
    if (!activeEpisode) return;
    await handleCopySEO();
    handleDownloadThumbnail();
    await handleDownloadVideo();
    const targetUrl =
      platform === "tiktok"
        ? "https://www.tiktok.com/upload"
        : "https://studio.youtube.com";
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // Live 3D office staff stats (Working vs Coffee vs Game Break)
  const workingCount = agents.filter((a) => a.status === "working").length;
  const coffeeCount = agents.filter(
    (a) =>
      a.targetWaypointId === "wp-l2-lounge" ||
      a.targetWaypointId === "wp-l3-lounge" ||
      a.currentActionLabel.includes("☕")
  ).length;
  const gameOrChillCount = Math.max(0, agents.length - workingCount - coffeeCount);

  const isJobRunning =
    job.stage !== "idle" && job.stage !== "ready";

  const canvasW = videoFormat === "shorts" ? 540 : 960;
  const canvasH = videoFormat === "shorts" ? 960 : 540;

  return (
    <div className="space-y-4">
      {/* 1. SUPER-SIMPLE BOSS COMMAND INPUT (Ketik dari HP -> Kirim!) */}
      <section className="rounded-3xl border border-amber-400/35 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-4 shadow-xl sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">
              📱 Perintah Bos ke Direktur Konten AI
            </h2>
            <p className="text-xs text-slate-300">
              Ketik 1 tugas singkat → Direktur bagi kerja ke 7 divisi → Bos pilih
              ide &amp; setujui naskah → Video siap posting!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAutoApproveMode(!autoApproveMode)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
              autoApproveMode
                ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25"
                : "border border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-400/50"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {autoApproveMode
              ? "Autopilot Penuh: ON"
              : "Mode Bos: Pilih Ide & ACC"}
          </button>
        </div>

        <form onSubmit={handleSendBrief} className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            placeholder="Ketik tugas... misal: Bikinin video TikTok soal tools AI / kartun truk pemadam"
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
          >
            <Send className="h-4 w-4" />
            <span>Kirim ke Direktur</span>
          </button>
        </form>

        {/* Quick 1-Tap Examples + Platform Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => {
                  setPlatform(qp.platform);
                  submitBossBrief(qp.brief, qp.platform);
                }}
                className="rounded-xl border border-slate-700/90 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200"
              >
                {qp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            {(
              [
                { id: "youtube_shorts", label: "YT Shorts 9:16" },
                { id: "tiktok", label: "TikTok 9:16" },
                { id: "youtube_landscape", label: "YouTube 16:9" },
              ] as { id: PublishPlatform; label: string }[]
            ).map((pf) => (
              <button
                key={pf.id}
                type="button"
                onClick={() => setPlatform(pf.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  platform === pf.id
                    ? "bg-amber-400 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7-Division Pipeline Status Strip */}
        {job.stage !== "idle" && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-amber-300">
                {job.activeStepLabel}
              </span>
              <span className="font-mono font-black text-emerald-300">
                {job.progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 transition-all duration-500"
                style={{ width: `${job.progressPercent}%` }}
              />
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {AGENCY_DIVISIONS.map((div) => {
                const st = job.divisionStatus[div.key];
                return (
                  <div
                    key={div.key}
                    className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold ${
                      st === "done"
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                        : st === "working"
                        ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/60"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {st === "done" ? (
                      <Check className="h-3 w-3 shrink-0" />
                    ) : st === "working" ? (
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    ) : null}
                    <span className="truncate">{div.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 2. MAIN CLEAN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN (7 cols): BOSS REPORT & APPROVAL -> VIDEO READY TO POST */}
        <div className="space-y-4 lg:col-span-7">
          {/* REPORT STEP A: BOS PILIH 1 DARI 3 IDE */}
          {job.stage === "waiting_idea" && (
            <section className="rounded-3xl border-2 border-amber-400/70 bg-slate-900/95 p-4 shadow-xl shadow-amber-500/10 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase">
                    <Sparkles className="h-3 w-3" />
                    Laporan Tim Riset Masuk
                  </span>
                  <h3 className="mt-1 text-base font-black text-white">
                    Pilih 1 Ide Terbaik (Klik Langsung Jalan!)
                  </h3>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                {job.ideas.map((idea, idx) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => selectIdeaOption(idea.id)}
                    className="group w-full rounded-2xl border border-slate-700 bg-slate-950/90 p-3.5 text-left transition hover:border-amber-400 hover:bg-slate-800/80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-[10px] font-black text-sky-300">
                        IDE #{idx + 1} · {idea.angle}
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                        Skor Viral {idea.viralScore}/100
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-black text-white group-hover:text-amber-300">
                      {idea.title}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      <strong className="text-amber-300">Hook 3 detik:</strong>{" "}
                      {idea.hook3s}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* REPORT STEP B: BOS SETUJUI NASKAH */}
          {job.stage === "waiting_script" && job.draftEpisode && (
            <section className="rounded-3xl border-2 border-emerald-400/70 bg-slate-900/95 p-4 shadow-xl shadow-emerald-500/10 sm:p-5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 uppercase">
                <CheckCircle2 className="h-3 w-3" />
                Laporan Penulis Naskah &amp; SEO Masuk
              </span>
              <h3 className="mt-1 text-base font-black text-white">
                Baca Singkat &amp; Setujui Naskah — Sisanya Tim yang Jalan!
              </h3>

              <div className="mt-3 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400">
                    Judul YouTube / TikTok (bisa edit cepat)
                  </label>
                  <input
                    type="text"
                    value={job.draftEpisode.title}
                    onChange={(e) =>
                      updateDraftFields({ title: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400">
                    Hook 3 Detik Pertama
                  </label>
                  <input
                    type="text"
                    value={job.draftEpisode.hook3s}
                    onChange={(e) =>
                      updateDraftFields({ hook3s: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-amber-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
                  <div className="text-[11px] font-black text-slate-300">
                    Naskah 5 Adegan:
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {job.draftEpisode.scenes.map((sc) => (
                      <div
                        key={sc.sceneNumber}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs"
                      >
                        <span className="font-black text-amber-300">
                          Adegan {sc.sceneNumber} ({sc.label}):
                        </span>{" "}
                        <span className="text-slate-200">{sc.narration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={approveScriptAndProduce}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-110"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Setujui Naskah — Tim Suara, Motion &amp; QC Jalan!</span>
                </button>
              </div>
            </section>
          )}

          {/* LIVE VIDEO PLAYER + DOWNLOAD / UPLOAD READY TO POST */}
          {activeEpisode && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                      SIAP POSTING · EP #{activeEpisode.episodeNumber}
                    </span>
                    {activeEpisode.uploaded && (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black text-sky-300">
                        ✓ Sudah Upload
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 truncate text-sm font-black text-white sm:text-base">
                    {activeEpisode.title}
                  </h3>
                </div>
              </div>

              {/* Cartoon / AI Motion Canvas Stage */}
              <div className="mt-3 flex justify-center rounded-2xl bg-slate-950 p-2.5">
                <canvas
                  ref={canvasRef}
                  width={canvasW}
                  height={canvasH}
                  className={`rounded-xl shadow-2xl ${
                    videoFormat === "shorts"
                      ? "max-h-[400px] w-auto aspect-[9/16]"
                      : "w-full max-w-[640px] aspect-video"
                  }`}
                />
              </div>

              {/* Simple Playback Bar */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" /> Jeda
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Putar Preview
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200 hover:text-white"
                  title={isMuted ? "Nyalakan musik" : "Matikan musik"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                  )}
                </button>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{
                      width: `${Math.min(100, (playTime / totalDuration) * 100)}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {Math.floor(playTime)}s / {Math.round(totalDuration)}s
                </span>
              </div>

              {/* 4 BIG CLEAR ACTION BUTTONS */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadVideo}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{exportPct}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Video</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadThumbnail}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-3 text-xs font-bold text-white transition hover:border-amber-400"
                >
                  <ImageDown className="h-4 w-4 text-amber-300" />
                  <span>Thumbnail HD</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySEO}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-3 text-xs font-bold text-white transition hover:border-sky-400"
                >
                  {copiedId === activeEpisode.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-300">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-sky-300" />
                      <span>Copy SEO</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-3 text-xs font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload YouTube</span>
                </button>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (5 cols): 3D OFFICE LIVE STATUS + TEAM CHAT + READY ARCHIVE */}
        <div className="space-y-4 lg:col-span-5">
          {/* LIVE 3D OFFICE STATUS (Work / Coffee / Game Break) */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white">
                  🏢 Status Kantor 3D Live (10 Staf AI)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tim kerja di meja saat tugas aktif, lalu istirahat ngopi &amp; main game!
                </p>
              </div>
              {isJobRunning && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-black text-amber-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Lagi Kerja
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-emerald-500/15 p-2.5 ring-1 ring-emerald-500/30">
                <div className="text-lg font-black text-emerald-300">
                  {workingCount}
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  💻 Sibuk Kerja
                </div>
              </div>
              <div className="rounded-2xl bg-amber-500/15 p-2.5 ring-1 ring-amber-500/30">
                <div className="flex items-center justify-center gap-1 text-lg font-black text-amber-300">
                  <Coffee className="h-4 w-4" />
                  <span>{coffeeCount}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  Ngopi Lounge
                </div>
              </div>
              <div className="rounded-2xl bg-sky-500/15 p-2.5 ring-1 ring-sky-500/30">
                <div className="flex items-center justify-center gap-1 text-lg font-black text-sky-300">
                  <Gamepad2 className="h-4 w-4" />
                  <span>{gameOrChillCount}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                  Main / Santai
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection("office")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/15 px-4 py-2.5 text-xs font-black text-sky-200 transition hover:bg-sky-500/25"
            >
              <Box className="h-4 w-4" />
              <span>Lihat Tim Sibuk &amp; Istirahat di Kantor 3D →</span>
            </button>
          </section>

          {/* LIVE TEAM CHAT (Obrolan Tim Antar Divisi) */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-300" />
                <h3 className="text-sm font-black text-white">
                  💬 Obrolan Tim Live
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">
                ● Online
              </span>
            </div>

            <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {teamChat.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-3 text-xs ${
                    msg.kind === "boss"
                      ? "border border-amber-400/40 bg-amber-400/15"
                      : msg.kind === "report"
                      ? "border border-emerald-500/35 bg-emerald-500/10"
                      : msg.kind === "break"
                      ? "border border-slate-800 bg-slate-950/70"
                      : "border border-slate-800 bg-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: msg.avatarColor }}
                      />
                      <span className="font-black text-white">
                        {msg.senderName}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                        {msg.division}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {msg.time}
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed text-slate-200">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* READY-TO-POST EPISODE ARCHIVE */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">
                🎬 Konten Siap Posting ({episodes.length})
              </h3>
              <span className="text-[10px] text-slate-400">
                Tersimpan otomatis
              </span>
            </div>

            <div className="mt-2.5 max-h-[210px] space-y-2 overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const selected = activeEpisode?.id === ep.id;
                return (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEpisodeId(ep.id)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border p-2.5 transition ${
                      selected
                        ? "border-amber-400/70 bg-amber-400/10"
                        : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <span className="text-amber-300">
                          EP #{ep.episodeNumber}
                        </span>
                        <span>·</span>
                        <span className="truncate">{ep.themeLabel}</span>
                      </div>
                      <div className="truncate text-xs font-bold text-white">
                        {ep.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markEpisodeUploaded(ep.id, !ep.uploaded);
                        }}
                        title="Tandai sudah upload"
                        className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                          ep.uploaded
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {ep.uploaded ? "✓ Upload" : "Belum"}
                      </button>
                      {episodes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEpisode(ep.id);
                          }}
                          title="Hapus"
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400"
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
      </div>

      {/* YOUTUBE UPLOAD MODAL (Cara 1 Cepat + Cara 2 Auto-Upload YouTube API v3 Rp 0) */}
      {activeEpisode && (
        <YouTubeUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          episode={activeEpisode}
          format={videoFormat}
          onQuickUpload={handleQuickStudioUpload}
          onUploadedSuccess={(epId) => markEpisodeUploaded(epId, true)}
        />
      )}
    </div>
  );
}
