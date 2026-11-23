"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Film,
  History,
  Layers,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import { useAgency } from "@/store/AgencyContext";
import { buildEditorialEpisode } from "@/lib/pipeline/motion-renderer";
import { ReferenceStyleAnalyzerCard } from "@/components/kids/ReferenceStyleAnalyzerCard";
import { RemotionTikTokPreview } from "@/components/kids/RemotionTikTokPreview";
import type { RankedTrendSourceRecord } from "@/lib/ai/trend-intelligence";
import type {
  ResolvedAgentSkill,
  RuntimeCapabilityProbe,
  SkillInstallStatus,
} from "@/lib/ai/advanced-skill-registry";
import { PIPELINE_DIVISIONS } from "@/types/pipeline";

interface CapabilitiesApiResponse {
  ok: boolean;
  probe: RuntimeCapabilityProbe;
  skills: ResolvedAgentSkill[];
  activeCount: number;
  totalCount: number;
}

interface TrendApiResponse {
  ok: boolean;
  fetchedAt: string;
  verifiedOnline: boolean;
  verificationNote: string;
  officialCount: number;
  communityCount: number;
  items: RankedTrendSourceRecord[];
}

const SKILL_STATUS_STYLE: Record<SkillInstallStatus, { label: string; cls: string }> = {
  installed: {
    label: "TERPASANG & AKTIF",
    cls: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300",
  },
  "adapter-active": {
    label: "ADAPTER AKTIF",
    cls: "border-cyan-400/50 bg-cyan-500/15 text-cyan-300",
  },
  "worker-required": {
    label: "WORKER / LOCAL",
    cls: "border-sky-400/50 bg-sky-500/15 text-sky-300",
  },
  "not-installed": {
    label: "TIDAK TERPASANG",
    cls: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  },
  "reference-only": {
    label: "REFERENSI SAJA",
    cls: "border-amber-400/50 bg-amber-500/15 text-amber-300",
  },
};

export function ProductionDashboardPanel() {
  const {
    episodes,
    activeEpisode,
    setActiveEpisodeId,
    renderProgress,
    exportQualityPreset,
    runningDivision,
    startNewEpisode,
  } = useAgency();

  const [capabilities, setCapabilities] = useState<CapabilitiesApiResponse | null>(null);
  const [capLoading, setCapLoading] = useState(false);
  const [trends, setTrends] = useState<TrendApiResponse | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [showRemotionPreview, setShowRemotionPreview] = useState(true);

  const loadCapabilities = useCallback(async () => {
    setCapLoading(true);
    try {
      const res = await fetch("/api/pipeline/capabilities", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as CapabilitiesApiResponse;
        if (data.ok) setCapabilities(data);
      }
    } catch {
      // Handled gracefully in UI
    } finally {
      setCapLoading(false);
    }
  }, []);

  const loadTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await fetch("/api/agents/trend-intelligence", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TrendApiResponse;
        if (data.ok) setTrends(data);
      }
    } catch {
      // Handled gracefully in UI
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCapabilities();
    void loadTrends();
  }, [loadCapabilities, loadTrends]);

  const editorialEpisode = useMemo(
    () => (activeEpisode ? buildEditorialEpisode(activeEpisode) : null),
    [activeEpisode]
  );

  // Real pipeline stage summary derived 100% from activeEpisode (ZERO fake numbers!)
  const stageCards = useMemo(() => {
    if (!activeEpisode) return [];
    const div = activeEpisode.divisions;
    const scriptScenes = div.script.output?.scenes ?? [];
    const voiceOut = div.voice.output;
    const editOut = div.editing.output;
    const qcOut = div.qc.output;
    const actualQc = editOut?.qcTelemetry;

    const totalWordCues =
      editorialEpisode?.scenes.reduce((sum, s) => sum + s.wordTimings.length, 0) ?? 0;

    return [
      {
        label: "Research",
        status: div.research.status,
        detail: div.research.output
          ? `${div.research.output.ideas.length} ide · ${
              (div.research.output.verifiedSourcesCount ?? 0) > 0
                ? `${div.research.output.verifiedSourcesCount} sumber terverifikasi`
                : "mode riset"
            }`
          : "Menunggu riset",
      },
      {
        label: "Script",
        status: div.script.status,
        detail: div.script.output
          ? `${scriptScenes.length} scene · ${div.script.output.totalDurationSec}s`
          : "Belum dibuat",
      },
      {
        label: "Scene Plan",
        status: editorialEpisode ? "done" : div.script.status,
        detail: editorialEpisode
          ? `Style: ${editorialEpisode.visualStyle} · 9:16`
          : "Menunggu script",
      },
      {
        label: "Voice",
        status: div.voice.status,
        detail: voiceOut
          ? `${voiceOut.engine} · ${voiceOut.sceneTracks.length} track`
          : "Belum direkam",
      },
      {
        label: "Subtitles",
        status: totalWordCues > 0 ? "done" : div.voice.status,
        detail:
          totalWordCues > 0
            ? `${totalWordCues} word cues · 0ms-lock`
            : "Menunggu audio",
      },
      {
        label: "Render",
        status: runningDivision === "editing" ? "running" : div.editing.status,
        detail:
          renderProgress && renderProgress.phase !== "done"
            ? `${renderProgress.phase} ${renderProgress.percent}% (${renderProgress.currentFrame}/${renderProgress.totalFrames}f)`
            : actualQc
            ? `${actualQc.actualWidth}×${actualQc.actualHeight} @ ${actualQc.actualFps}fps`
            : `Target: ${exportQualityPreset}`,
      },
      {
        label: "Export Quality",
        status: actualQc
          ? actualQc.fileIntegrityPass
            ? "done"
            : "failed"
          : qcOut
          ? qcOut.passed
            ? "done"
            : "failed"
          : "queued",
        detail: actualQc
          ? `${actualQc.actualWidth}×${actualQc.actualHeight} · ${actualQc.actualBitrateMbps} Mbps · ${actualQc.actualFps}fps`
          : "Belum ada file render",
      },
    ];
  }, [activeEpisode, editorialEpisode, exportQualityPreset, renderProgress, runningDivision]);

  // Real error & warning audit log collected across all division runs
  const auditLogs = useMemo(() => {
    const entries: Array<{
      id: string;
      episodeNumber: number;
      division: string;
      status: string;
      message: string;
      timeLabel: string;
    }> = [];

    episodes.slice(0, 6).forEach((ep) => {
      PIPELINE_DIVISIONS.forEach((meta) => {
        const rec = ep.divisions[meta.key];
        if (rec.error) {
          entries.push({
            id: `${ep.id}-${meta.key}-err`,
            episodeNumber: ep.episodeNumber,
            division: meta.shortLabel,
            status: "error",
            message: rec.error,
            timeLabel: rec.finishedAt
              ? new Date(rec.finishedAt).toLocaleTimeString()
              : new Date(ep.createdAt).toLocaleTimeString(),
          });
        } else if (rec.logs.length > 0) {
          const lastLog = rec.logs[rec.logs.length - 1];
          entries.push({
            id: `${ep.id}-${meta.key}-log`,
            episodeNumber: ep.episodeNumber,
            division: meta.shortLabel,
            status: lastLog.level === "error" ? "error" : rec.status,
            message: lastLog.message,
            timeLabel: lastLog.time,
          });
        }
      });
    });

    return entries.slice(0, 14);
  }, [episodes]);

  return (
    <div className="space-y-5">
      {/* 1. REAL-TIME PRODUCTION STAGE TRACKER */}
      <section className="rounded-3xl border border-cyan-500/30 bg-slate-900/85 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white sm:text-base">
              🎬 Production Control Center — Live Pipeline Telemetry
            </h3>
          </div>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
            Format: TikTok 9:16 · Profile: {exportQualityPreset.toUpperCase()}
          </span>
        </div>

        {activeEpisode ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {stageCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {card.label}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      card.status === "done"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : card.status === "running"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : card.status === "failed"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-200 leading-snug">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">
            Belum ada episode aktif. Pilih topik dari Research Queue di bawah atau nyalakan Auto-Pilot untuk memulai produksi nyata.
          </p>
        )}
      </section>

      {/* 2. RESEARCH QUEUE (5-FACTOR RANKED TRENDS) + REMOTION LIVE PREVIEW */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black text-white">
                <Search className="h-4 w-4 text-sky-400" />
                Research Queue — 5-Factor AI Trend Ranking
              </h3>
              <p className="text-[11px] text-slate-400">
                Sumber resmi GitHub &amp; komunitas segar — diperingkat berdasarkan Kebaruan, Relevansi, Perhatian, Kualitas Sumber, dan Kemudahan Demo (tanpa klaim views palsu).
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadTrends()}
              disabled={trendsLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {trendsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh Riset
            </button>
          </div>

          {trends && (
            <div className="mt-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
              <span className={trends.verifiedOnline ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>
                {trends.verifiedOnline ? "● VERIFIED ONLINE: " : "● OFFLINE / UNVERIFIED: "}
              </span>
              {trends.verificationNote}
            </div>
          )}

          <div className="mt-3 max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
            {trendsLoading && !trends && (
              <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Mengambil rilis resmi AI Agent &amp; Claude Code...
              </div>
            )}

            {trends?.items.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                          item.classification === "official_release"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}
                      >
                        {item.classification === "official_release" ? "RESMI" : "KOMUNITAS"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.sourceName} · {item.publishedAt.slice(0, 10)} ({item.freshnessDays}h lalu)
                      </span>
                    </div>
                    <h4 className="mt-1 text-xs font-bold text-white leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  <div className="shrink-0 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-center">
                    <div className="text-xs font-black text-cyan-300">
                      {item.ranking.totalScore}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">/100</div>
                  </div>
                </div>

                {/* 5-Factor Transparent Breakdown */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                  <span>Baru:{item.ranking.freshnessScore}/25</span>
                  <span>· Relevan:{item.ranking.relevanceScore}/25</span>
                  <span>· Hook:{item.ranking.attentionScore}/20</span>
                  <span>· Sumber:{item.ranking.sourceQualityScore}/15</span>
                  <span>· Demo:{item.ranking.demoEaseScore}/15</span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
                  >
                    <span>Verifikasi Sumber</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    disabled={Boolean(runningDivision)}
                    onClick={() =>
                      void startNewEpisode(
                        `${item.title} (${item.sourceName}, ${item.publishedAt.slice(0, 10)})`,
                        "tiktok"
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-2.5 py-1 text-[11px] font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Produksi 9:16
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REMOTION + GSAP INTERACTIVE 9:16 VIDEO PREVIEW */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black text-white">
                <Film className="h-4 w-4 text-violet-400" />
                Remotion + GSAP Live Composition
              </h3>
              <p className="text-[11px] text-slate-400">
                Preview real-time React 9:16 via @remotion/player
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRemotionPreview((v) => !v)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
            >
              {showRemotionPreview ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          {showRemotionPreview && editorialEpisode ? (
            <RemotionTikTokPreview episode={editorialEpisode} fps={60} />
          ) : (
            <div className="flex h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center">
              <Layers className="h-8 w-8 text-slate-600" />
              <p className="mt-2 text-xs text-slate-400">
                {editorialEpisode
                  ? "Preview disembunyikan. Klik Tampilkan untuk membuka Remotion Player."
                  : "Buat atau pilih episode untuk menampilkan Remotion 9:16 Live Composition."}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* 3. LIVE MODULAR SKILL REGISTRY (11 REPOS / 11 DOMAINS) */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Modular AI Agent Skill Registry (11 Audited Repositories)
            </h3>
            <p className="text-[11px] text-slate-400">
              Status diverifikasi langsung dari runtime server (tidak ada skill palsu — binary worker yang belum terpasang di Vercel ditandai jujur).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {capabilities && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-300">
                {capabilities.activeCount}/{capabilities.totalCount} Aktif di Runtime Ini
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadCapabilities()}
              disabled={capLoading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
            >
              {capLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
              Probe Runtime
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {capabilities?.skills.map((skill) => {
            const badge = SKILL_STATUS_STYLE[skill.installStatus];
            return (
              <div
                key={skill.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{skill.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {skill.sourceRepo} · {skill.version} · {skill.license}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300 leading-snug">
                  {skill.runtimeNote}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
                  <span>Domain: {skill.domain}</span>
                  <span>Test: {skill.testStatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PRODUCTION HISTORY + LIVE ERROR & AUDIT LOGS */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <History className="h-4 w-4 text-amber-400" />
            Production History ({episodes.length} Episode)
          </h3>
          <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
            {episodes.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada riwayat produksi di sesi ini.</p>
            ) : (
              episodes.map((ep) => {
                const isSelected = activeEpisode?.id === ep.id;
                const actualQc = ep.divisions.editing.output?.qcTelemetry;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setActiveEpisodeId(ep.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-cyan-400/70 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        #{ep.episodeNumber} · {ep.bossTheme}
                      </span>
                      {actualQc ? (
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            actualQc.fileIntegrityPass
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {actualQc.actualWidth}×{actualQc.actualHeight} @ {actualQc.actualFps}fps
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-mono text-slate-400">
                          {ep.format}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <Terminal className="h-4 w-4 text-rose-400" />
            Live Pipeline &amp; Error Logs
          </h3>
          <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 font-sans">
                Belum ada log error atau aktivitas divisi.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-xl border px-3 py-2 ${
                    log.status === "error"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : "border-slate-800 bg-slate-950/70 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-80">
                    <span className="inline-flex items-center gap-1 font-bold">
                      {log.status === "error" ? (
                        <AlertTriangle className="h-3 w-3 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                      EP#{log.episodeNumber} · {log.division}
                    </span>
                    <span>{log.timeLabel}</span>
                  </div>
                  <p className="mt-1 break-words">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* SECTION E: Reference Video Style Analyzer & Original Fajrezzz Style Presets */}
      <ReferenceStyleAnalyzerCard />
    </div>
  );
}
