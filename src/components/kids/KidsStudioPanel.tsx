"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  ImageDown,
  Loader2,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import type { PublishPlatform } from "@/lib/kids-studio/episode-brain";
import {
  buildEditorialEpisode,
  renderEditorialFrame,
  startAmbientSynthBed,
} from "@/lib/pipeline/motion-renderer";
import { speakSceneTracks } from "@/lib/pipeline/browser-divisions";
import {
  buildScriptSummaryArchive,
  pickFreshVariationBlueprint,
} from "@/lib/pipeline/variation-engine";
import {
  hasBossOriginalElement,
  PIPELINE_DIVISIONS,
  type PipelineDivisionKey,
  type RealDivisionStatus,
} from "@/types/pipeline";
import { useAgency } from "@/store/AgencyContext";
import { useOffice } from "@/store/OfficeContext";
import { YouTubeUploadModal } from "@/components/kids/YouTubeUploadModal";

const STATUS_BADGE: Record<
  RealDivisionStatus,
  { label: string; cls: string }
> = {
  queued: {
    label: "QUEUED",
    cls: "border-slate-700 bg-slate-800/80 text-slate-300",
  },
  running: {
    label: "RUNNING",
    cls: "border-cyan-400/70 bg-cyan-500/20 text-cyan-200",
  },
  done: {
    label: "DONE",
    cls: "border-emerald-400/70 bg-emerald-500/20 text-emerald-200",
  },
  failed: {
    label: "FAILED",
    cls: "border-rose-400/80 bg-rose-500/20 text-rose-200",
  },
};

const QUICK_THEMES: { label: string; theme: string; platform: PublishPlatform }[] = [
  {
    label: "🤖 Tools AI Gratis",
    theme: "3 tools AI gratis yang menghemat 5 jam kerja konten kreator tiap minggu",
    platform: "youtube_shorts",
  },
  {
    label: "💰 Bisnis & Keuangan",
    theme: "Kesalahan umum anak muda mengatur gaji pertama dan cara memperbaikinya",
    platform: "youtube_shorts",
  },
  {
    label: "🧠 Produktivitas & Fokus",
    theme: "Eksperimen 7 hari kerja tanpa distraksi HP dan dampaknya ke hasil kerja",
    platform: "youtube_landscape",
  },
  {
    label: "🌍 Fakta Teknologi Unik",
    theme: "Bagaimana cara kerja algoritma rekomendasi video dan cara bikin konten yang bertahan lama",
    platform: "youtube_shorts",
  },
];

interface AiServerStatus {
  anyConfigured: boolean;
  activeLabel: string;
  pricingNotice: string;
}

export function KidsStudioPanel() {
  const { setActiveSection, setActiveFloor, setCameraPreset } = useOffice();
  const {
    episodes,
    activeEpisode,
    setActiveEpisodeId,
    videoBlobUrls,
    editingProgressPct,
    runningDivision,
    startNewEpisode,
    selectIdeaAndContinue,
    runDivision,
    runProductionAndExport,
    updateBossOriginality,
    updateEpisodeMetrics,
    deleteEpisode,
  } = useAgency();

  const [themeInput, setThemeInput] = useState("");
  const [platform, setPlatform] = useState<PublishPlatform>("youtube_shorts");
  const [autoWatch3D, setAutoWatch3D] = useState(true);
  const [aiStatus, setAiStatus] = useState<AiServerStatus | null>(null);
  const [expandedDiv, setExpandedDiv] = useState<PipelineDivisionKey | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Playback & TTS preview refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const melodyStopRef = useRef<(() => void) | null>(null);
  const speechStopRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [speakingScene, setSpeakingScene] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setAiStatus(d);
      })
      .catch(() => {});
  }, []);

  const renderableEpisode = useMemo(
    () => (activeEpisode ? buildEditorialEpisode(activeEpisode) : null),
    [activeEpisode]
  );

  const totalDuration = useMemo(
    () =>
      renderableEpisode
        ? renderableEpisode.scenes.reduce((s, x) => s + x.durationSec, 0)
        : 0,
    [renderableEpisode]
  );

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (melodyStopRef.current) {
      melodyStopRef.current();
      melodyStopRef.current = null;
    }
    if (speechStopRef.current) {
      speechStopRef.current();
      speechStopRef.current = null;
    }
    setSpeakingScene(null);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    stopPlayback();
    setPlayTime(0);
    const canvas = canvasRef.current;
    if (!canvas || !renderableEpisode) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderEditorialFrame(ctx, canvas.width, canvas.height, renderableEpisode, 0.8);
  }, [renderableEpisode, stopPlayback]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const togglePlayPreview = () => {
    if (!renderableEpisode || !canvasRef.current) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isMuted) {
      melodyStopRef.current = startAmbientSynthBed(true).stop;
      const tracks = activeEpisode?.divisions.voice.output?.sceneTracks;
      if (tracks && tracks.length > 0) {
        speechStopRef.current = speakSceneTracks(tracks, (sn) =>
          setSpeakingScene(sn)
        );
      }
    }

    setIsPlaying(true);
    const startMs = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      if (elapsed >= totalDuration) {
        setPlayTime(totalDuration);
        stopPlayback();
        return;
      }
      setPlayTime(elapsed);
      renderEditorialFrame(ctx, canvas.width, canvas.height, renderableEpisode, elapsed);
      rafRef.current = window.requestAnimationFrame(loop);
    };
    rafRef.current = window.requestAnimationFrame(loop);
  };

  const handleSpeakScene = (sceneNumber: number) => {
    const tracks = activeEpisode?.divisions.voice.output?.sceneTracks ?? [];
    const target = tracks.find((t) => t.sceneNumber === sceneNumber);
    if (!target) return;
    if (speechStopRef.current) speechStopRef.current();
    speechStopRef.current = speakSceneTracks(
      [target],
      (sn) => setSpeakingScene(sn),
      () => setSpeakingScene(null)
    );
  };

  const handleSubmitTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeInput.trim() || runningDivision) return;
    const theme = themeInput.trim();
    setThemeInput("");
    // Start full 7-division automatic pipeline (Riset -> SEO -> Naskah -> Suara -> Motion -> Editing Video -> QC)
    void startNewEpisode(theme, platform);
    if (autoWatch3D) {
      setActiveFloor("l2");
      setCameraPreset("interior");
      setActiveSection("office");
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const researchOut = activeEpisode?.divisions.research.output ?? null;
  const seoOut = activeEpisode?.divisions.seo.output ?? null;
  const scriptOut = activeEpisode?.divisions.script.output ?? null;
  const voiceOut = activeEpisode?.divisions.voice.output ?? null;
  const motionOut = activeEpisode?.divisions.motion.output ?? null;
  const editingOut = activeEpisode?.divisions.editing.output ?? null;
  const qcOut = activeEpisode?.divisions.qc.output ?? null;
  const activeVideoUrl = activeEpisode ? videoBlobUrls[activeEpisode.id] : undefined;

  const summaryArchive = useMemo(
    () => buildScriptSummaryArchive(episodes),
    [episodes]
  );
  const variationBlueprint = useMemo(
    () =>
      pickFreshVariationBlueprint(
        episodes.filter((e) => e.id !== activeEpisode?.id)
      ),
    [episodes, activeEpisode?.id]
  );

  const bossHasOriginal = activeEpisode
    ? hasBossOriginalElement(activeEpisode.bossOriginality)
    : false;
  const canOpenManualPublish = Boolean(
    activeEpisode &&
      qcOut?.passed &&
      bossHasOriginal &&
      activeEpisode.bossOriginality.confirmedByBoss
  );

  return (
    <div className="space-y-5">
      {/* ================= SERVER AI GRATIS RP 0 STATUS STRIP ================= */}
      {aiStatus && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>
              <strong>AI Gratis Rp 0 Langsung Aktif</strong> ({aiStatus.activeLabel})
              — tanpa kartu kredit &amp; tanpa wajib daftar API key.
            </span>
          </div>
        </div>
      )}

      {/* ================= 1. KOMANDO BOS (MULAI EPISODE NYATA) ================= */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">
              📱 Komando Bos — Mulai Produksi Episode Nyata
            </h2>
            <p className="text-xs text-slate-400">
              Ketik tema episode → Divisi Riset memanggil AI nyata untuk 5 ide unik,
              lalu tiap divisi menjalankan tugasnya dengan log &amp; hasil JSON tersimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection("office")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
          >
            <Box className="h-4 w-4" />
            <span>Pantau di Kantor 3D</span>
          </button>
        </div>

        <form onSubmit={handleSubmitTheme} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "youtube_shorts", label: "📱 YouTube Shorts (9:16)" },
                { id: "youtube_landscape", label: "📺 YouTube Video (16:9)" },
                { id: "tiktok", label: "🎵 TikTok / Reels (9:16)" },
              ] as { id: PublishPlatform; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  platform === p.id
                    ? "border-amber-300 bg-amber-400 text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder="Contoh: 3 cara mengatur keuangan gaji pertama biar tidak habis di tengah bulan..."
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!themeInput.trim() || Boolean(runningDivision)}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningDivision ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{runningDivision ? "Sedang Produksi..." : "Produksi Otomatis → Video"}</span>
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-cyan-200/95">
            <input
              type="checkbox"
              checked={autoWatch3D}
              onChange={(e) => setAutoWatch3D(e.target.checked)}
              className="h-4 w-4 rounded border-cyan-400/50 bg-slate-950 text-cyan-400"
            />
            <span>
              <strong>Otomatis buka Kantor 3D</strong> — cukup 1 klik, tonton 7 karakter bekerja otomatis sampai video jadi!
            </span>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_THEMES.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  setThemeInput(q.theme);
                  setPlatform(q.platform);
                }}
                className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200"
              >
                {q.label}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* ================= EPISODE SELECTOR BAR ================= */}
      {episodes.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {episodes.map((ep) => {
            const active = ep.id === activeEpisode?.id;
            const qc = ep.divisions.qc.output;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => setActiveEpisodeId(ep.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-left text-xs transition ${
                  active
                    ? "border-cyan-400 bg-cyan-500/15 text-white"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Film className="h-3.5 w-3.5 text-amber-300" />
                <div>
                  <div className="max-w-[190px] truncate font-bold">
                    Ep #{ep.episodeNumber} ·{" "}
                    {ep.divisions.seo.output?.title || ep.bossTheme}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {qc
                      ? qc.passed
                        ? `QC Lolos (${qc.score})`
                        : "QC Diblokir"
                      : "Dalam Produksi"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!activeEpisode && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
          <Film className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-bold text-slate-200">
            Belum Ada Episode Produksi
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            Tidak ada data atau angka simulasi palsu. Ketik tema episode pertama di
            atas untuk mulai menjalankan Pipeline 7 Divisi secara nyata.
          </p>
        </div>
      )}

      {/* ================= ACTIVE EPISODE — PIPELINE 7 DIVISI NYATA ================= */}
      {activeEpisode && (
        <div className="space-y-5">
          {/* 7-Division Real Status Grid + Retry per Division */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white sm:text-base">
                  ⚙️ Pipeline 7 Divisi — Episode #{activeEpisode.episodeNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Status real-time (queued / running / done / failed), durasi kerja,
                  log &amp; tombol Retry per divisi.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {scriptOut && (
                  <button
                    type="button"
                    disabled={Boolean(runningDivision)}
                    onClick={() => runProductionAndExport(activeEpisode.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {runningDivision === "editing" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Film className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {runningDivision === "editing"
                        ? `Rendering ${editingProgressPct}%`
                        : "Render Video & Thumbnail HD"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteEpisode(activeEpisode.id)}
                  title="Hapus Episode"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {PIPELINE_DIVISIONS.map((meta) => {
                const rec = activeEpisode.divisions[meta.key];
                const badge = STATUS_BADGE[rec.status];
                const isOpen = expandedDiv === meta.key;

                return (
                  <div
                    key={meta.key}
                    className={`flex flex-col justify-between rounded-2xl border p-3 transition ${
                      rec.status === "failed"
                        ? "border-rose-500/60 bg-rose-950/20"
                        : rec.status === "running"
                        ? "border-cyan-400/70 bg-cyan-950/25"
                        : rec.status === "done"
                        ? "border-emerald-500/35 bg-slate-950/75"
                        : "border-slate-800 bg-slate-950/55"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-white">
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {meta.agentName} ·{" "}
                            {meta.executionSide === "server-llm"
                              ? "Server AI"
                              : meta.executionSide === "browser"
                              ? "Browser"
                              : "Hybrid QC"}
                          </div>
                        </div>
                        <span
                          className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {rec.durationMs > 0
                            ? `${(rec.durationMs / 1000).toFixed(1)}d`
                            : "—"}
                        </span>
                        {rec.provider && (
                          <span className="truncate rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
                            {rec.provider}
                          </span>
                        )}
                      </div>

                      {rec.error && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-2 text-[10px] leading-relaxed text-rose-200">
                          <div className="font-bold">Error: {rec.error}</div>
                          {rec.hint && (
                            <div className="mt-1 text-rose-100/80">{rec.hint}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-800/80 pt-2">
                      <button
                        type="button"
                        disabled={Boolean(runningDivision)}
                        onClick={() => runDivision(activeEpisode.id, meta.key)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-40"
                      >
                        {rec.status === "running" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        <span>
                          {rec.status === "queued" ? "Jalankan" : "Retry"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDiv(isOpen ? null : meta.key)
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-white"
                      >
                        <span>Log &amp; JSON</span>
                        {isOpen ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-2 space-y-2 border-t border-slate-800 pt-2 text-[10px]">
                        <div className="max-h-28 overflow-y-auto rounded-lg bg-slate-950 p-2 font-mono text-[9px] text-slate-300">
                          {rec.logs.length === 0 ? (
                            <span className="text-slate-500">Belum ada log.</span>
                          ) : (
                            rec.logs.map((l, idx) => (
                              <div
                                key={idx}
                                className={
                                  l.level === "error"
                                    ? "text-rose-300"
                                    : l.level === "success"
                                    ? "text-emerald-300"
                                    : "text-slate-300"
                                }
                              >
                                [{l.time}] {l.message}
                              </div>
                            ))
                          )}
                        </div>
                        {rec.output !== null && (
                          <pre className="max-h-32 overflow-auto rounded-lg bg-slate-950 p-2 text-[9px] text-cyan-200">
                            {JSON.stringify(rec.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= HASIL DIVISI 1: PILIH 1 DARI 5 IDE RISET ================= */}
          {researchOut && researchOut.ideas.length > 0 && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
              <h3 className="text-sm font-black text-white">
                1️⃣ Hasil Divisi Riset — Pilih 1 dari {researchOut.ideas.length} Ide
                Episode Unik
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Tiap ide memakai struktur cerita, latar, karakter pendukung, dan sudut
                pandang berbeda. Klik salah satu untuk menjalankan SEO → Naskah → Suara →
                Motion → QC secara nyata.
              </p>

              <div className="mt-3 grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                {researchOut.ideas.map((idea) => {
                  const selected = activeEpisode.selectedIdeaId === idea.id;
                  return (
                    <button
                      key={idea.id}
                      type="button"
                      disabled={Boolean(runningDivision)}
                      onClick={() =>
                        selectIdeaAndContinue(activeEpisode.id, idea.id)
                      }
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                        selected
                          ? "border-amber-400 bg-amber-400/15 ring-1 ring-amber-400/50"
                          : "border-slate-800 bg-slate-950/75 hover:border-cyan-400/60"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                            {idea.storyStructure}
                          </span>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Dipilih
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-black text-white">
                          {idea.title}
                        </div>
                        <p className="text-[11px] text-slate-300">{idea.angle}</p>
                        <div className="space-y-0.5 pt-1 text-[10px] text-slate-400">
                          <div>📍 Latar: {idea.setting}</div>
                          <div>🧸 Karakter: {idea.supportingCharacter}</div>
                          <div>💡 Pesan: {idea.moralLesson}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= HASIL DIVISI 2-6: SEO, NASKAH, SUARA, MOTION, EDITING ================= */}
          {(seoOut || scriptOut) && (
            <div className="grid gap-5 lg:grid-cols-12">
              {/* LEFT: LIVE MOTION CANVAS PLAYER + VIDEO & THUMBNAIL HD EXPORT */}
              <div className="space-y-4 lg:col-span-5">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black tracking-wide text-white uppercase">
                      🎬 Preview Motion &amp; Editing
                    </h3>
                    <span className="font-mono text-[11px] text-cyan-300">
                      {playTime.toFixed(1)}s / {totalDuration}s
                    </span>
                  </div>

                  {renderableEpisode ? (
                    <>
                      <div className="flex justify-center overflow-hidden rounded-2xl border border-slate-800 bg-black">
                        <canvas
                          ref={canvasRef}
                          width={activeEpisode.format === "shorts" ? 360 : 640}
                          height={activeEpisode.format === "shorts" ? 640 : 360}
                          className="max-h-[420px] w-auto object-contain"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={togglePlayPreview}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-4 w-4" /> Jeda Preview
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" /> Putar Animasi + TTS
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMuted((m) => !m)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200"
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4 text-rose-400" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-emerald-400" />
                          )}
                          <span>{isMuted ? "Mute" : "Suara Aktif"}</span>
                        </button>
                      </div>

                      {/* Real Editing Outputs: Video Blob + HD Thumbnail */}
                      {editingOut && (
                        <div className="mt-4 space-y-2.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3">
                          <div className="text-xs font-black text-emerald-200">
                            ✅ File Ekspor Divisi Editing Siap
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Video {(editingOut.videoSizeBytes / (1024 * 1024)).toFixed(2)}{" "}
                            MB ({editingOut.videoDurationSec}d) · Thumbnail HD{" "}
                            {editingOut.thumbnailWidth}×{editingOut.thumbnailHeight}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeVideoUrl && (
                              <a
                                href={activeVideoUrl}
                                download={editingOut.fileName}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download Video</span>
                              </a>
                            )}
                            {editingOut.thumbnailDataUrl && (
                              <a
                                href={editingOut.thumbnailDataUrl}
                                download={`thumbnail-ep-${activeEpisode.episodeNumber}.png`}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                              >
                                <ImageDown className="h-4 w-4" />
                                <span>Download Thumbnail HD</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Motion Keyframes Strip */}
                      {motionOut && motionOut.sceneFrames.some((f) => f.keyframeDataUrl) && (
                        <div className="mt-3">
                          <div className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Keyframe Motion per Adegan
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {motionOut.sceneFrames.map((f) =>
                              f.keyframeDataUrl ? (
                                <div
                                  key={f.sceneNumber}
                                  className="shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={f.keyframeDataUrl}
                                    alt={`Adegan ${f.sceneNumber}`}
                                    className="h-20 w-auto object-cover"
                                  />
                                  <div className="px-1.5 py-0.5 text-[9px] text-slate-300">
                                    #{f.sceneNumber} ({f.durationSec}d)
                                  </div>
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Menunggu naskah adegan selesai...
                    </div>
                  )}
                </section>
              </div>

              {/* RIGHT: SEO, NASKAH + TTS PER ADEGAN, QC REPORT */}
              <div className="space-y-4 lg:col-span-7">
                {/* SEO METADATA */}
                {seoOut && (
                  <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-black tracking-wide text-emerald-300 uppercase">
                        2️⃣ Hasil Divisi SEO
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "seo",
                            `${seoOut.title}\n\n${seoOut.description}\n\n${seoOut.hashtags.join(
                              " "
                            )}\nTags: ${seoOut.tags.join(", ")}`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-400"
                      >
                        {copiedKey === "seo" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedKey === "seo" ? "Disalin!" : "Salin SEO"}</span>
                      </button>
                    </div>
                    <div className="mt-2 space-y-2 text-xs">
                      <div className="font-black text-white">{seoOut.title}</div>
                      <p className="whitespace-pre-line text-slate-300">
                        {seoOut.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {seoOut.hashtags.map((h) => (
                          <span
                            key={h}
                            className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Tags:</strong> {seoOut.tags.join(", ")}
                      </div>
                    </div>
                  </section>
                )}

                {/* NASKAH + TTS PER ADEGAN */}
                {scriptOut && (
                  <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black tracking-wide text-amber-300 uppercase">
                          3️⃣ &amp; 4️⃣ Naskah &amp; Suara TTS per Adegan (
                          {scriptOut.scenes.length} Adegan · {scriptOut.totalDurationSec}d)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Struktur: {scriptOut.storyStructure} · Latar: {scriptOut.setting}{" "}
                          · Karakter: {scriptOut.supportingCharacter}
                        </p>
                      </div>
                      {voiceOut && (
                        <span className="rounded-lg bg-indigo-500/20 px-2 py-1 text-[10px] font-bold text-indigo-200">
                          🎙️ {voiceOut.voiceName}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {scriptOut.scenes.map((scene) => (
                        <div
                          key={scene.sceneNumber}
                          className={`rounded-2xl border p-3 text-xs ${
                            speakingScene === scene.sceneNumber
                              ? "border-indigo-400 bg-indigo-500/15"
                              : "border-slate-800 bg-slate-950/75"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-amber-300">
                              Adegan {scene.sceneNumber}: {scene.label} ({scene.durationSec}
                              d)
                            </span>
                            {voiceOut && (
                              <button
                                type="button"
                                onClick={() => handleSpeakScene(scene.sceneNumber)}
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-2 py-1 text-[10px] font-bold text-indigo-200 hover:bg-indigo-500/30"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>Dengar TTS</span>
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-slate-100">{scene.narration}</p>
                          <div className="mt-1 text-[10px] text-slate-400">
                            Visual: {scene.visualCue}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* QC REPORT */}
                {qcOut && (
                  <section
                    className={`rounded-3xl border p-4 ${
                      qcOut.passed
                        ? "border-emerald-500/45 bg-emerald-950/20"
                        : "border-rose-500/60 bg-rose-950/25"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {qcOut.passed ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-rose-400" />
                        )}
                        <div>
                          <h3 className="text-xs font-black tracking-wide text-white uppercase">
                            7️⃣ Laporan Divisi QC —{" "}
                            {qcOut.passed ? "LOLOS QC" : "DIBLOKIR QC"} ({qcOut.score}
                            /100)
                          </h3>
                          <p className="text-[11px] text-slate-300">
                            Kemiripan dengan episode lama: {qcOut.similarityScore}%
                            {qcOut.mostSimilarEpisodeTitle
                              ? ` (terdekat: "${qcOut.mostSimilarEpisodeTitle}")`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canOpenManualPublish}
                        onClick={() => setPublishModalOpen(true)}
                        title={
                          canOpenManualPublish
                            ? "Buka paket upload manual ke YouTube Studio"
                            : "Publish terkunci: butuh QC Lolos + minimal 1 elemen orisinal Bos + centang ACC"
                        }
                        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                          canOpenManualPublish
                            ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                            : "cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {canOpenManualPublish ? (
                          <Upload className="h-3.5 w-3.5" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                        <span>Publish Manual</span>
                      </button>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {qcOut.checks.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 rounded-xl bg-slate-950/70 px-3 py-2 text-[11px]"
                        >
                          {c.passed ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                          )}
                          <div>
                            <div className="font-bold text-white">{c.label}</div>
                            <div className="text-slate-300">{c.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* WAJIB: KONTRIBUSI ORISINAL BOS SEBELUM ACC & PUBLISH MANUAL */}
                <section className="rounded-3xl border border-amber-400/40 bg-amber-950/15 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-xs font-black tracking-wide text-amber-300 uppercase">
                        <Sparkles className="h-4 w-4" />
                        <span>Kontribusi Orisinal Bos (Wajib Anti-Konten Massal)</span>
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-300">
                        YouTube menolak monetisasi konten massal berbasis template.
                        Isi minimal <strong>1 elemen orisinal</strong> di bawah &amp;
                        centang ACC agar tombol <strong>Publish Manual</strong> aktif.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                        bossHasOriginal
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-rose-500/20 text-rose-200"
                      }`}
                    >
                      {bossHasOriginal ? "✓ Elemen Orisinal Terisi" : "Wajib Isi Min. 1"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-300">
                        1. Ide Orisinal / Pengalaman Bos
                      </label>
                      <input
                        type="text"
                        value={activeEpisode.bossOriginality.customIdea}
                        onChange={(e) =>
                          updateBossOriginality(activeEpisode.id, {
                            customIdea: e.target.value,
                          })
                        }
                        placeholder="Misal: Pengalaman pribadi saat mencoba metode ini selama 1 bulan..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-300">
                        2. Twist / Insight Unik
                      </label>
                      <input
                        type="text"
                        value={activeEpisode.bossOriginality.customTwist}
                        onChange={(e) =>
                          updateBossOriginality(activeEpisode.id, {
                            customTwist: e.target.value,
                          })
                        }
                        placeholder="Misal: Ternyata hasil terbaik bukan dari cara populer, melainkan..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-300">
                        3. Kalimat / Opini Khas Bos
                      </label>
                      <input
                        type="text"
                        value={activeEpisode.bossOriginality.customVoiceLine}
                        onChange={(e) =>
                          updateBossOriginality(activeEpisode.id, {
                            customVoiceLine: e.target.value,
                          })
                        }
                        placeholder="Misal: Menurut pengalamanku di lapangan, trik paling ngaruh itu..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-300">
                        4. Studi Kasus / Tokoh Tambahan dari Bos
                      </label>
                      <input
                        type="text"
                        value={activeEpisode.bossOriginality.customCharacter}
                        onChange={(e) =>
                          updateBossOriginality(activeEpisode.id, {
                            customCharacter: e.target.value,
                          })
                        }
                        placeholder="Misal: Contoh kasus UMKM kopi lokal di kota sendiri"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/20 pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={activeEpisode.bossOriginality.confirmedByBoss}
                        disabled={!bossHasOriginal}
                        onChange={(e) =>
                          updateBossOriginality(activeEpisode.id, {
                            confirmedByBoss: e.target.checked,
                            confirmedAt: e.target.checked
                              ? new Date().toISOString()
                              : null,
                          })
                        }
                        className="h-4 w-4 accent-amber-400"
                      />
                      <span>
                        Saya (Bos) ACC naskah &amp; menjamin episode ini memuat elemen
                        orisinal manusia.
                      </span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {bossHasOriginal && scriptOut && (
                        <button
                          type="button"
                          disabled={Boolean(runningDivision)}
                          onClick={async () => {
                            const updated = await runDivision(
                              activeEpisode.id,
                              "script"
                            );
                            if (updated?.divisions.script.status === "done") {
                              await runDivision(activeEpisode.id, "qc", updated);
                            }
                          }}
                          className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-[11px] font-bold text-amber-200 hover:bg-amber-500/25 disabled:opacity-40"
                        >
                          Terapkan ke Naskah + Cek QC Ulang
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!canOpenManualPublish}
                        onClick={() => setPublishModalOpen(true)}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition ${
                          canOpenManualPublish
                            ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:brightness-110"
                            : "cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {canOpenManualPublish ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        <span>
                          {canOpenManualPublish
                            ? "Publish Manual ke YouTube"
                            : "Publish Nonaktif (Belum ACC / QC)"}
                        </span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* VARIATION ENGINE & ARSIP RINGKASAN NASKAH */}
                <section className="rounded-3xl border border-slate-800 bg-slate-900/75 p-4 text-xs">
                  <div className="font-black text-cyan-300">
                    🧬 Variation Engine &amp; Arsip Ringkasan Naskah (
                    {summaryArchive.length} Episode Tersimpan)
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Rekomendasi variasi segar untuk episode berikutnya agar tidak
                    terdeteksi sebagai konten massal seragam:
                  </p>
                  <div className="mt-2 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-950/75 p-2.5">
                      <span className="font-bold text-white">Struktur Baru:</span>{" "}
                      {variationBlueprint.recommendedStructures[0]}
                    </div>
                    <div className="rounded-xl bg-slate-950/75 p-2.5">
                      <span className="font-bold text-white">Latar Baru:</span>{" "}
                      {variationBlueprint.recommendedSettings[0]}
                    </div>
                    <div className="rounded-xl bg-slate-950/75 p-2.5">
                      <span className="font-bold text-white">Karakter Baru:</span>{" "}
                      {variationBlueprint.recommendedCharacters[0]}
                    </div>
                    <div className="rounded-xl bg-slate-950/75 p-2.5">
                      <span className="font-bold text-white">Pesan Baru:</span>{" "}
                      {variationBlueprint.recommendedMorals[0]}
                    </div>
                  </div>
                  {summaryArchive.length > 0 && (
                    <div className="mt-2.5 max-h-32 space-y-1.5 overflow-y-auto">
                      {summaryArchive.slice(0, 6).map((rec) => (
                        <div
                          key={rec.episodeId}
                          className="rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[10px] text-slate-300"
                        >
                          <span className="font-bold text-amber-300">
                            Ep #{rec.episodeNumber}: {rec.title}
                          </span>{" "}
                          — {rec.summary}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* Strictly Manual Publish Handoff Modal */}
          <YouTubeUploadModal
            open={publishModalOpen}
            onClose={() => setPublishModalOpen(false)}
            episode={activeEpisode}
            videoBlobUrl={activeVideoUrl}
            onConfirmManualUpload={(youtubeUrl) => {
              updateEpisodeMetrics(activeEpisode.id, {
                youtubeUrl,
                uploadedAt: new Date().toISOString(),
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
