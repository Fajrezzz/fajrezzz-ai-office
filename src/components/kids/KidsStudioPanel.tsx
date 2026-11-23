"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Box,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
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
  Zap,
} from "lucide-react";
import { INSTALLED_GITHUB_SKILLS } from "@/lib/ai/github-skills-registry";
import {
  loadLongTermMemory,
  type AgentLongTermMemoryState,
} from "@/lib/ai/agent-memory";
import type { PublishPlatform } from "@/lib/kids-studio/episode-brain";
import {
  buildEditorialEpisode,
  renderEditorialFrame,
} from "@/lib/pipeline/motion-renderer";
import {
  speakSceneTracks,
  startSyncedLivePreview,
} from "@/lib/pipeline/browser-divisions";
import { PRESET_META } from "@/lib/pipeline/video-engine-v3";
import {
  buildScriptSummaryArchive,
  pickFreshVariationBlueprint,
} from "@/lib/pipeline/variation-engine";
import {
  hasBossOriginalElement,
  PIPELINE_DIVISIONS,
  type ExportQualityPreset,
  type PipelineDivisionKey,
  type RealDivisionStatus,
} from "@/types/pipeline";
import { useAgency } from "@/store/AgencyContext";
import { useOffice } from "@/store/OfficeContext";
import { YouTubeUploadModal } from "@/components/kids/YouTubeUploadModal";
import { ProductionDashboardPanel } from "@/components/kids/ProductionDashboardPanel";

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
    label: "🔥 Breaking AI Agent News",
    theme: "Update terbaru Claude Code & AI coding agents yang bekerja langsung di terminal dan GitHub",
    platform: "tiktok",
  },
  {
    label: "⚡ Claude Code Tutorial",
    theme: "Tutorial alur kerja Claude Code di terminal: membaca repo, edit multi-file, dan cek build otomatis",
    platform: "tiktok",
  },
  {
    label: "🤖 Eksperimen AI Automation",
    theme: "Eksperimen AI Agent vs workflow manual membangun fitur nyata sampai Pull Request GitHub",
    platform: "tiktok",
  },
  {
    label: "🧠 Multi-Agent Virtual Office",
    theme: "Cara kerja arsitektur multi-agent AI yang membagi tugas riset, coding, dan QA secara otonom",
    platform: "tiktok",
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
    renderProgress,
    exportQualityPreset,
    setExportQualityPreset,
    cancelActiveRender,
    runningDivision,
    autoPilotEnabled,
    setAutoPilotEnabled,
    autoPilotStatus,
    autoPilotMessage,
    autoPilotCountdownSec,
    lastAutoPilotTopic,
    triggerAutonomousEpisode,
    startNewEpisode,
    selectIdeaAndContinue,
    runDivision,
    runProductionAndExport,
    continueEpisodeAuto,
    updateBossOriginality,
    updateEpisodeMetrics,
    deleteEpisode,
  } = useAgency();

  const [themeInput, setThemeInput] = useState("");
  const [platform, setPlatform] = useState<PublishPlatform>("tiktok");
  const [autoWatch3D, setAutoWatch3D] = useState(true);
  const [aiStatus, setAiStatus] = useState<AiServerStatus | null>(null);
  const [expandedDiv, setExpandedDiv] = useState<PipelineDivisionKey | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [skillsDrawerOpen, setSkillsDrawerOpen] = useState(false);
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<"pipeline" | "dashboard">("pipeline");
  const [longTermMem, setLongTermMem] = useState<AgentLongTermMemoryState | null>(null);

  useEffect(() => {
    setLongTermMem(loadLongTermMemory());
    const id = window.setInterval(() => {
      setLongTermMem(loadLongTermMemory());
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Master-clock synced live preview refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewStopRef = useRef<(() => void) | null>(null);
  const speechStopRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [syncedTotalDuration, setSyncedTotalDuration] = useState(0);
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
      syncedTotalDuration > 0
        ? syncedTotalDuration
        : renderableEpisode
        ? Math.round(
            renderableEpisode.scenes.reduce((s, x) => s + x.durationSec, 0) * 10
          ) / 10
        : 0,
    [renderableEpisode, syncedTotalDuration]
  );

  const stopPlayback = useCallback(() => {
    if (previewStopRef.current) {
      previewStopRef.current();
      previewStopRef.current = null;
    }
    if (speechStopRef.current) {
      speechStopRef.current();
      speechStopRef.current = null;
    }
    setSpeakingScene(null);
    setIsLoadingPreview(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    stopPlayback();
    setPlayTime(0);
    setSyncedTotalDuration(0);
    const canvas = canvasRef.current;
    if (!canvas || !renderableEpisode || !activeEpisode) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderEditorialFrame(ctx, canvas.width, canvas.height, renderableEpisode, 1.45);
  }, [renderableEpisode, activeEpisode, stopPlayback]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const togglePlayPreview = async () => {
    if (!renderableEpisode || !activeEpisode || !canvasRef.current) return;
    if (isPlaying || isLoadingPreview) {
      stopPlayback();
      return;
    }

    setIsLoadingPreview(true);
    try {
      const stopFn = await startSyncedLivePreview({
        episode: activeEpisode,
        canvas: canvasRef.current,
        muted: isMuted,
        onTick: (elapsed, total, activeSceneNum) => {
          setPlayTime(elapsed);
          setSyncedTotalDuration(Math.round(total * 10) / 10);
          setSpeakingScene(activeSceneNum);
        },
        onEnd: () => {
          previewStopRef.current = null;
          setSpeakingScene(null);
          setIsPlaying(false);
        },
      });
      previewStopRef.current = stopFn;
      setIsLoadingPreview(false);
      setIsPlaying(true);
    } catch {
      setIsLoadingPreview(false);
      setIsPlaying(false);
    }
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

      {/* ================= 1. ZERO-CLICK AUTO-PILOT VIDEO STUDIO (AI KERJA SENDIRI) ================= */}
      <section className="rounded-3xl border border-cyan-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/70 p-4 shadow-[0_0_32px_rgba(34,211,238,0.08)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                <Bot className="h-3.5 w-3.5" />
                {autoPilotEnabled ? "AUTO-PILOT PENUH AKTIF" : "AUTO-PILOT DIJEDA"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/45 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold text-violet-200">
                <Cpu className="h-3 w-3" />
                {INSTALLED_GITHUB_SKILLS.length} GitHub AI Skills Terpasang
              </span>
            </div>
            <h2 className="text-base font-black text-white sm:text-lg">
              🎬 TikTok 9:16 AI Agent &amp; Claude Code Cinematic Studio V3
            </h2>
            <p className="text-xs leading-relaxed text-slate-300">
              Prioritas mutlak <strong className="text-amber-300">TikTok Vertical 9:16</strong>{" "}
              — Trend Intelligence riset sumber resmi, <strong className="text-cyan-200">suara neural 0ms sinkron subtitle</strong>,{" "}
              <strong className="text-violet-200">motion graphics 4K/2K/FHD</strong>, dan ekspor{" "}
              <strong className="text-emerald-200">H.264 MP4 + AAC</strong> dengan QC metrik aktual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition ${
                autoPilotEnabled
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoPilotEnabled ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                }`}
              />
              <span>{autoPilotEnabled ? "Auto-Pilot ON" : "Auto-Pilot OFF"}</span>
            </button>

            <button
              type="button"
              disabled={
                Boolean(runningDivision) || autoPilotStatus === "choosing_topic"
              }
              onClick={() => void triggerAutonomousEpisode()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {runningDivision || autoPilotStatus === "choosing_topic" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              <span>
                {runningDivision || autoPilotStatus === "choosing_topic"
                  ? "AI Sedang Bekerja..."
                  : "Bikin Video Baru Sekarang"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("office")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Box className="h-4 w-4" />
              <span>Pantau 3D</span>
            </button>
          </div>
        </div>

        {/* Live Autonomous Status Strip */}
        <div className="mt-3 rounded-2xl border border-slate-800/90 bg-slate-950/75 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-100">
              {runningDivision || autoPilotStatus === "choosing_topic" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-400" />
              ) : (
                <Brain className="h-4 w-4 shrink-0 text-violet-400" />
              )}
              <span className="font-semibold">{autoPilotMessage}</span>
            </div>
            {autoPilotStatus === "cooldown" && autoPilotCountdownSec > 0 && (
              <span className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-200">
                Next: {autoPilotCountdownSec}s
              </span>
            )}
          </div>

          {lastAutoPilotTopic && (
            <div className="mt-2.5 rounded-xl border border-violet-500/25 bg-violet-950/20 px-3 py-2 text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-1 text-violet-200">
                <span className="font-bold">
                  🎯 AI Creative Director ({lastAutoPilotTopic.provider}) · {lastAutoPilotTopic.niche}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    lastAutoPilotTopic.sourceVerified
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {lastAutoPilotTopic.sourceVerified
                    ? "✓ Sumber Online Terverifikasi"
                    : "⚠ Tren Online Belum Terverifikasi (Faktual)"}
                </span>
              </div>
              <p className="mt-1 font-semibold text-white">
                &ldquo;{lastAutoPilotTopic.theme}&rdquo;
              </p>
              <p className="mt-0.5 text-slate-300">{lastAutoPilotTopic.reasoning}</p>
              {lastAutoPilotTopic.sourceName && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-cyan-200/90">
                  <span>Sumber: {lastAutoPilotTopic.sourceName}</span>
                  {lastAutoPilotTopic.sourcePublishedAt && (
                    <span className="font-mono text-slate-400">
                      ({lastAutoPilotTopic.sourcePublishedAt.slice(0, 10)})
                    </span>
                  )}
                  {lastAutoPilotTopic.sourceUrl && (
                    <a
                      href={lastAutoPilotTopic.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-white"
                    >
                      Buka Sumber ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* V3 Export Quality Selector (ULTRA QUALITY Default / HIGH / BALANCED) */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
            <div className="text-[11px] font-bold text-slate-300">
              🎞️ Profil Kualitas Ekspor TikTok 9:16:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ultra", "high", "balanced"] as ExportQualityPreset[]).map((presetKey) => {
                const meta = PRESET_META[presetKey];
                const selected = exportQualityPreset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    disabled={runningDivision === "editing"}
                    onClick={() => setExportQualityPreset(presetKey)}
                    title={meta.targetDesc}
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-black transition ${
                      selected
                        ? "border-amber-300 bg-amber-400 text-slate-950"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/50"
                    } disabled:opacity-50`}
                  >
                    {meta.shortLabel}
                    {presetKey === "ultra" ? " (Default)" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Android-Safe Render Progress Bar + ETA + Safe Cancel */}
          {runningDivision === "editing" && renderProgress && (
            <div className="mt-2.5 rounded-xl border border-cyan-400/40 bg-cyan-950/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-cyan-200">
                  {renderProgress.activeProfileLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-white">
                    {renderProgress.percent}%
                    {renderProgress.totalFrames > 0
                      ? ` · Frame ${renderProgress.currentFrame}/${renderProgress.totalFrames}`
                      : ""}
                    {renderProgress.etaSec !== null ? ` · ETA ~${renderProgress.etaSec}d` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={cancelActiveRender}
                    className="rounded-lg border border-rose-400/60 bg-rose-500/20 px-2.5 py-1 text-[10px] font-black text-rose-200 hover:bg-rose-500/35"
                  >
                    Batalkan Render
                  </button>
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-200"
                  style={{ width: `${Math.max(2, renderProgress.percent)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Collapsible 19 Installed GitHub AI Skills & Long-Term Memory Panel */}
        <div className="mt-3 rounded-2xl border border-violet-500/30 bg-slate-950/70">
          <button
            type="button"
            onClick={() => setSkillsDrawerOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Brain className="h-4 w-4 text-violet-300" />
              <span className="text-xs font-black text-white">
                🧠 {INSTALLED_GITHUB_SKILLS.length} Modul GitHub AI Skills &amp; Memori Jangka Panjang Terpasang
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                {INSTALLED_GITHUB_SKILLS.length}/{INSTALLED_GITHUB_SKILLS.length} AKTIF
              </span>
              {longTermMem && longTermMem.entries.length > 0 && (
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                  {longTermMem.entries.length} Memori Tersimpan
                </span>
              )}
            </div>
            {skillsDrawerOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>

          {skillsDrawerOpen && (
            <div className="space-y-3 border-t border-slate-800/80 p-3.5">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INSTALLED_GITHUB_SKILLS.map((skill) => {
                  const hits = longTermMem?.skillHitCounts?.[skill.repo] ?? 0;
                  return (
                    <a
                      key={skill.id}
                      href={skill.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/75 p-2.5 transition hover:border-cyan-400/50"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate font-mono text-[10px] font-bold text-cyan-300 group-hover:text-cyan-200">
                            {skill.repo}
                          </span>
                          <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
                            AKTIF{hits > 0 ? ` · ${hits}×` : ""}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-white">
                          {skill.name}
                        </div>
                        <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                          {skill.summaryId}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-1.5 text-[9px] text-slate-400">
                        <span className="truncate">
                          Dipakai: {skill.assignedAgents.join(", ")}
                        </span>
                        <span className="ml-1 shrink-0 font-mono text-violet-300">
                          {skill.license}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>

              {longTermMem && longTermMem.entries.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                    Memori Jangka Panjang Terbaru (ai-memory + claude-mem)
                  </div>
                  <div className="max-h-28 space-y-1 overflow-y-auto font-mono text-[10px] text-slate-300">
                    {longTermMem.entries.slice(0, 6).map((m) => (
                      <div key={m.id} className="truncate">
                        <span className="text-cyan-400">[{m.actor}]</span>{" "}
                        {m.summary}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional Manual Override Accordion (Bos doesn't have to touch it!) */}
        <div className="mt-3 rounded-2xl border border-slate-800/90 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setManualOverrideOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[11px] font-bold text-slate-300 hover:text-white"
          >
            <span>✍️ Opsional: Override Topik Manual oleh Bos (Biarkan tertutup untuk Auto-Pilot Penuh)</span>
            {manualOverrideOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {manualOverrideOpen && (
            <form onSubmit={handleSubmitTheme} className="space-y-3 border-t border-slate-800 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-amber-300 bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950">
                  🎵 TikTok Vertical 9:16 (Mode Utama Terkunci)
                </span>
                <span className="text-[11px] text-slate-400">
                  Mode YouTube 16:9 landscape dinonaktifkan sesuai fokus TikTok V3.
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  placeholder="Opsional: ketik topik khusus jika Bos ingin meminta tema tertentu..."
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
                  <span>{runningDivision ? "Sedang Produksi..." : "Override → Produksi"}</span>
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
                  <strong>Otomatis buka Kantor 3D</strong> saat override manual dikirim
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
          )}
        </div>
      </section>

      {/* ================= STUDIO VIEW SWITCHER (PIPELINE vs PRODUCTION DASHBOARD) ================= */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStudioTab("pipeline")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition ${
            studioTab === "pipeline"
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
              : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
          }`}
        >
          <Film className="h-3.5 w-3.5" />
          Studio Pipeline 7 Divisi
        </button>
        <button
          type="button"
          onClick={() => setStudioTab("dashboard")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition ${
            studioTab === "dashboard"
              ? "border-violet-400 bg-violet-500/20 text-violet-200"
              : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          Production Control Center (Remotion + 11 Skills + Trend Queue)
        </button>
      </div>

      {studioTab === "dashboard" && <ProductionDashboardPanel />}

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

      {/* ================= EMPTY / AUTO-STARTING STATE ================= */}
      {!activeEpisode && (
        <div className="rounded-3xl border border-dashed border-cyan-500/35 bg-slate-900/50 p-8 text-center">
          {autoPilotEnabled ? (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-400" />
              <h3 className="mt-3 text-sm font-black text-white">
                AI Auto-Pilot Sedang Menyiapkan Episode Pertama Secara Mandiri...
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-300">
                Bos tidak perlu mengetik atau memencet apa pun — {INSTALLED_GITHUB_SKILLS.length} GitHub AI Skills
                sedang bekerja memilih topik viral, menulis naskah, merekam suara
                neural, membuat AI B-Roll + motion teks sinematik, dan merender video otomatis.
              </p>
            </>
          ) : (
            <>
              <Film className="mx-auto h-10 w-10 text-slate-600" />
              <h3 className="mt-3 text-sm font-bold text-slate-200">
                Auto-Pilot Dijeda — Belum Ada Episode Produksi
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                Aktifkan tombol Auto-Pilot ON di atas agar AI langsung bekerja sendiri,
                atau buka menu Override Topik Manual.
              </p>
            </>
          )}
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
              <div className="flex flex-wrap items-center gap-2">
                {PIPELINE_DIVISIONS.some(
                  (d) => activeEpisode.divisions[d.key].status !== "done"
                ) && (
                  <button
                    type="button"
                    disabled={Boolean(runningDivision)}
                    onClick={() => {
                      void continueEpisodeAuto(activeEpisode.id);
                      if (autoWatch3D) {
                        setActiveFloor("l2");
                        setCameraPreset("interior");
                        setActiveSection("office");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50"
                  >
                    {runningDivision ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {runningDivision
                        ? "Auto-Produksi Berjalan..."
                        : "Jalankan Otomatis Sisa Divisi → Video"}
                    </span>
                  </button>
                )}
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
                          width={720}
                          height={1280}
                          className="max-h-[460px] w-auto object-contain"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => void togglePlayPreview()}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"
                        >
                          {isLoadingPreview ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Sinkronisasi Audio...
                            </>
                          ) : isPlaying ? (
                            <>
                              <Pause className="h-4 w-4" /> Jeda Preview
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" /> Putar 0ms-Sync + Suara
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

                      {/* Real Editing Outputs: Video Blob + Vertical Cover + Actual Telemetry */}
                      {editingOut && (
                        <div className="mt-4 space-y-2.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <div className="text-xs font-black text-emerald-200">
                              ✅ File Ekspor TikTok 9:16 Siap
                            </div>
                            {editingOut.qcTelemetry && (
                              <span className="rounded-md bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                                {editingOut.qcTelemetry.actualContainer.toUpperCase()} ·{" "}
                                {editingOut.qcTelemetry.actualWidth}×{editingOut.qcTelemetry.actualHeight} @{" "}
                                {editingOut.qcTelemetry.actualFps}fps
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Ukuran {(editingOut.videoSizeBytes / (1024 * 1024)).toFixed(2)} MB ·{" "}
                            Durasi {editingOut.videoDurationSec}d
                            {editingOut.qcTelemetry
                              ? ` · Bitrate Aktual ${editingOut.qcTelemetry.actualBitrateMbps} Mbps · Drift A/V ${editingOut.qcTelemetry.avSyncDeltaMs}ms`
                              : ""}
                          </div>
                          {editingOut.qcTelemetry?.recommendedPresetIfBelowTarget && (
                            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-2 text-[10px] text-amber-200">
                              ⚠ Kualitas aktual di bawah target preset. Disarankan render ulang dengan preset{" "}
                              <strong>
                                {editingOut.qcTelemetry.recommendedPresetIfBelowTarget.toUpperCase()}
                              </strong>{" "}
                              untuk stabilitas optimal perangkat ini.
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {activeVideoUrl && (
                              <a
                                href={activeVideoUrl}
                                download={editingOut.fileName}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download Video ({editingOut.qcTelemetry?.actualContainer.toUpperCase() || "MP4"})</span>
                              </a>
                            )}
                            {editingOut.thumbnailDataUrl && (
                              <a
                                href={editingOut.thumbnailDataUrl}
                                download={`cover-tiktok-ep-${activeEpisode.episodeNumber}.png`}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                              >
                                <ImageDown className="h-4 w-4" />
                                <span>Cover 9:16</span>
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

                {/* AI CREATIVE DIRECTOR EDITORIAL BRIEF (SECTION 7) */}
                {scriptOut?.creativeBrief && (
                  <section className="rounded-3xl border border-violet-500/35 bg-violet-950/15 p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-black tracking-wide text-violet-300 uppercase">
                        🎬 Creative Director Brief (TikTok 9:16)
                      </h3>
                      <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-violet-200">
                        {scriptOut.creativeBrief.contentFormat} · {scriptOut.creativeBrief.visualStyle}
                      </span>
                    </div>
                    <div className="mt-2.5 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-950/70 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400">Hook 0–2 Detik</div>
                        <div className="mt-0.5 font-semibold text-white">
                          &ldquo;{scriptOut.creativeBrief.hook0to2s}&rdquo;
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/70 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400">Alasan Topik Dipilih &amp; Audiens</div>
                        <div className="mt-0.5 text-slate-200">
                          {scriptOut.creativeBrief.whyChosen} ({scriptOut.creativeBrief.targetAudience})
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/70 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400">Sumber &amp; Verifikasi</div>
                        <div className="mt-0.5 text-cyan-200">
                          {scriptOut.creativeBrief.sourceVerified ? "✓ Terverifikasi: " : "⚠ "}
                          {scriptOut.creativeBrief.sourceName} ({scriptOut.creativeBrief.sourcePublishedAt.slice(0, 10)})
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/70 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400">Transisi Antar-Adegan</div>
                        <div className="mt-0.5 font-mono text-amber-200">
                          {scriptOut.creativeBrief.transitions.join(" → ")}
                        </div>
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

                    {/* V3 ACTUAL MEASURED VIDEO TELEMETRY TABLE (NEVER FAKE TARGETS) */}
                    {(qcOut.videoTelemetry ?? editingOut?.qcTelemetry) && (() => {
                      const vt = (qcOut.videoTelemetry ?? editingOut?.qcTelemetry)!;
                      return (
                        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/85 p-3 text-[11px]">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-black text-cyan-300">
                              📊 Laporan QC Video Aktual ({vt.encoderPath})
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              Header: {vt.fileHeaderMagic}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">Resolusi Aktual</div>
                              <div className="font-mono font-bold text-white">
                                {vt.actualWidth}×{vt.actualHeight}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">FPS Aktual</div>
                              <div className="font-mono font-bold text-white">
                                {vt.actualFps} fps
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">Bitrate Aktual</div>
                              <div className="font-mono font-bold text-white">
                                {vt.actualBitrateMbps} Mbps
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">Codec &amp; Audio</div>
                              <div className="truncate font-mono font-bold text-emerald-300">
                                {vt.actualCodec}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">Drift A/V Sync</div>
                              <div className="font-mono font-bold text-cyan-300">
                                {vt.avSyncDeltaMs} ms
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 p-2">
                              <div className="text-[9px] text-slate-400">Drop / Black Frame</div>
                              <div className="font-mono font-bold text-white">
                                {vt.droppedFrames} drop · {vt.blackFrameCount} black
                              </div>
                            </div>
                          </div>
                          {vt.warnings.length > 0 && (
                            <div className="mt-2 space-y-1 text-[10px] text-amber-300">
                              {vt.warnings.map((w, i) => (
                                <div key={i}>⚠ {w}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
