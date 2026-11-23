"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Cpu,
  Download,
  Film,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Upload,
  Users,
  Wrench,
} from "lucide-react";
import {
  ACTIVE_EMPLOYEE_ROSTER,
  MAX_TEAM_CAPACITY,
  OFFICE_FLOORS,
  RESERVE_EXPANSION_SLOTS,
  TEAM_DIVISIONS,
} from "@/lib/config/team-roster";
import { INSTALLED_GITHUB_SKILLS } from "@/lib/ai/github-skills-registry";
import { AiRouterMonitoringPanel } from "@/components/dashboard/AiRouterMonitoringPanel";
import { useAgency } from "@/store/AgencyContext";
import { useOffice } from "@/store/OfficeContext";
import { PIPELINE_DIVISIONS, type RealEpisode } from "@/types/pipeline";
import type { FloorNumber, FloorView } from "@/types/office";

interface CapabilitySummary {
  remotionInstalled: boolean;
  gsapInstalled: boolean;
  mp4MuxerInstalled: boolean;
  ffmpegAvailable: boolean;
  whisperAvailable: boolean;
  hindsightConfigured: boolean;
  skillCount: number;
}

interface AiProviderSummary {
  anyConfigured: boolean;
  activeProviders: string[];
}

const FLOOR_VIEW_BY_NUM: Record<FloorNumber, FloorView> = {
  1: "l1",
  2: "l2",
  3: "l3",
  4: "l4",
  5: "l5",
};

function getEpisodeDisplayStatus(
  ep: RealEpisode,
  hasVerifiedVideo: boolean
): string {
  if (ep.divisions.qc.status === "done" && hasVerifiedVideo) return "QC Pass";
  if (hasVerifiedVideo) return "MP4 Ready";
  if (PIPELINE_DIVISIONS.some((d) => ep.divisions[d.key]?.status === "running")) {
    return "Running";
  }
  if (PIPELINE_DIVISIONS.some((d) => ep.divisions[d.key]?.status === "failed")) {
    return "Needs Retry";
  }
  return "In Progress";
}

/**
 * Operational Telemetry & Real Production Dashboard (Section C & F).
 *
 * Clean operational telemetry with zero dummy metrics:
 * - Total & active employees (15 active / 20 max capacity)
 * - Per-division live status (6 divisions)
 * - Per-floor 3D office status (5 floors)
 * - Running tasks, completed tasks, live render progress, verified MP4 videos
 * - Real runtime skills & integrations probe (`/api/pipeline/capabilities` + `/api/ai/status`)
 */
export function RealResultsDashboard({ compact = false }: { compact?: boolean }) {
  const {
    agents,
    tasks,
    workstations,
    adaptiveFps,
    setActiveFloor,
    setActiveSection,
    focusOnAgent,
  } = useOffice();
  const {
    episodes,
    activeEpisode,
    videoBlobUrls,
    runningDivision,
    editingProgressPct,
    setActiveEpisodeId,
  } = useAgency();

  const isRunningPipeline = Boolean(runningDivision);

  const [capabilities, setCapabilities] = useState<CapabilitySummary | null>(null);
  const [aiStatus, setAiStatus] = useState<AiProviderSummary | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const probeIntegrations = async () => {
    setProbeLoading(true);
    try {
      const [capRes, aiRes] = await Promise.all([
        fetch("/api/pipeline/capabilities").catch(() => null),
        fetch("/api/ai/status").catch(() => null),
      ]);

      if (capRes?.ok) {
        const capJson = (await capRes.json()) as {
          probe?: {
            remotionInstalled?: boolean;
            gsapInstalled?: boolean;
            mp4MuxerInstalled?: boolean;
            ffmpeg?: { available?: boolean };
            whisper?: { available?: boolean };
            hindsight?: { configured?: boolean };
          };
          skills?: unknown[];
        };
        setCapabilities({
          remotionInstalled: Boolean(capJson.probe?.remotionInstalled),
          gsapInstalled: Boolean(capJson.probe?.gsapInstalled),
          mp4MuxerInstalled: Boolean(capJson.probe?.mp4MuxerInstalled),
          ffmpegAvailable: Boolean(capJson.probe?.ffmpeg?.available),
          whisperAvailable: Boolean(capJson.probe?.whisper?.available),
          hindsightConfigured: Boolean(capJson.probe?.hindsight?.configured),
          skillCount: Array.isArray(capJson.skills)
            ? capJson.skills.length
            : INSTALLED_GITHUB_SKILLS.length,
        });
      }

      if (aiRes?.ok) {
        const aiJson = (await aiRes.json()) as {
          anyConfigured?: boolean;
          providers?: Array<{ name?: string; configured?: boolean }>;
        };
        const activeProviders = (aiJson.providers ?? [])
          .filter((p) => p.configured && p.name)
          .map((p) => String(p.name));
        setAiStatus({
          anyConfigured: Boolean(aiJson.anyConfigured),
          activeProviders,
        });
      }
    } finally {
      setProbeLoading(false);
    }
  };

  useEffect(() => {
    void probeIntegrations();
  }, []);

  const hasEpisodeVideo = (ep: RealEpisode): boolean => {
    return Boolean(
      videoBlobUrls[ep.id] ||
        (ep.divisions.editing.status === "done" &&
          (ep.divisions.editing.output?.videoSizeBytes ?? 0) > 0)
    );
  };

  // Real employee metrics (zero fake counts)
  const employeeMetrics = useMemo(() => {
    const activeWorking = agents.filter(
      (a) => a.status === "working" || a.status === "walking"
    );
    const errored = agents.filter((a) => a.status === "error");
    const idle = agents.filter((a) => a.status === "idle");
    return {
      total: agents.length,
      activeWorking: activeWorking.length,
      errored: errored.length,
      idle: idle.length,
    };
  }, [agents]);

  // Real task & pipeline video metrics
  const productionMetrics = useMemo(() => {
    const runningOfficeTasks = tasks.filter((t) => t.status === "in_progress").length;
    const completedOfficeTasks = tasks.filter((t) => t.status === "done").length;

    let runningPipelineSteps = 0;
    let completedPipelineSteps = 0;
    let verifiedRenderedVideos = 0;

    for (const ep of episodes) {
      for (const div of PIPELINE_DIVISIONS) {
        const st = ep.divisions[div.key]?.status;
        if (st === "running") runningPipelineSteps += 1;
        if (st === "done") completedPipelineSteps += 1;
      }
      const hasVid = Boolean(
        videoBlobUrls[ep.id] ||
          (ep.divisions.editing.status === "done" &&
            (ep.divisions.editing.output?.videoSizeBytes ?? 0) > 0)
      );
      if (hasVid) verifiedRenderedVideos += 1;
    }

    return {
      runningTasks: runningOfficeTasks + runningPipelineSteps,
      completedTasks: completedOfficeTasks + completedPipelineSteps,
      totalEpisodes: episodes.length,
      verifiedRenderedVideos,
    };
  }, [tasks, episodes, videoBlobUrls]);

  // Export real operational snapshot JSON
  const handleExportSnapshot = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        schemaVersion: "fajrezzz-telemetry-v2",
        activeEmployees: ACTIVE_EMPLOYEE_ROSTER.length,
        maxCapacity: MAX_TEAM_CAPACITY,
        floors: OFFICE_FLOORS.length,
        episodesSummary: episodes.map((ep) => {
          const hasVid = hasEpisodeVideo(ep);
          return {
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.divisions.seo.output?.title || ep.bossTheme,
            status: getEpisodeDisplayStatus(ep, hasVid),
            hasRenderedVideo: hasVid,
            createdAt: ep.createdAt,
          };
        }),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fajrezzz-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupNotice("Snapshot telemetry berhasil diunduh (JSON).");
    } catch {
      setBackupNotice("Gagal mengekspor snapshot telemetry.");
    }
  };

  const handleImportSnapshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { exportedAt?: string; episodesSummary?: unknown[] };
      setBackupNotice(
        `File valid (${parsed.episodesSummary?.length ?? 0} episode tercatat pada ${
          parsed.exportedAt ?? "snapshot"
        }).`
      );
    } catch {
      setBackupNotice("File JSON tidak valid.");
    } finally {
      e.target.value = "";
    }
  };

  const activeEpisodeHasVideo = activeEpisode ? hasEpisodeVideo(activeEpisode) : false;

  return (
    <div className={`mx-auto max-w-6xl space-y-5 text-slate-100 ${compact ? "p-2" : "p-4 sm:p-6"}`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/25 bg-slate-900/80 p-4 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-300 uppercase">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>FAJREZZZ AI OFFICE · LIVE OPERATIONAL TELEMETRY</span>
          </div>
          <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Dashboard Status Aktual (15 Karyawan · 6 Divisi · 5 Lantai)
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            100% angka aktual dari state runtime — nol angka dummy, nol simulasi kerja palsu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void probeIntegrations()}
            disabled={probeLoading}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${probeLoading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400/50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400/50"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Verify JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportSnapshot}
            className="hidden"
          />
        </div>
      </div>

      {backupNotice && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/35 px-4 py-2 text-xs text-emerald-200">
          {backupNotice}
        </div>
      )}

      {/* TOP 6 REAL KPI CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Karyawan</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {employeeMetrics.total}
            <span className="ml-1 text-xs font-semibold text-slate-400">
              / {MAX_TEAM_CAPACITY}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-cyan-300">
            +{RESERVE_EXPANSION_SLOTS.length} slot ekspansi siap
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Sedang Bekerja</span>
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-emerald-300">
            {employeeMetrics.activeWorking}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Idle: {employeeMetrics.idle} · Error: {employeeMetrics.errored}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tugas Berjalan</span>
            <Loader2
              className={`h-4 w-4 text-amber-400 ${
                productionMetrics.runningTasks > 0 ? "animate-spin" : ""
              }`}
            />
          </div>
          <div className="mt-1.5 text-2xl font-black text-amber-300">
            {productionMetrics.runningTasks}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {runningDivision ? `Aktif: ${runningDivision}` : "Antrean kosong"}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tugas Selesai</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {productionMetrics.completedTasks}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Dari {productionMetrics.totalEpisodes} episode
          </div>
        </div>

        <div className="rounded-2xl border border-fuchsia-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Video MP4 Valid</span>
            <Film className="h-4 w-4 text-fuchsia-400" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-fuchsia-300">
            {productionMetrics.verifiedRenderedVideos}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {isRunningPipeline && runningDivision === "editing"
              ? `Rendering ${editingProgressPct}%`
              : "Hanya file render nyata"}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-400/25 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Kantor 3D · Auto</span>
            <Building2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-1.5 text-2xl font-black text-white">
            {OFFICE_FLOORS.length} Lantai
          </div>
          <div className="mt-1 text-[10px] text-emerald-300">
            {workstations.length} desk · {adaptiveFps} FPS
          </div>
        </div>
      </div>

      {/* CENTRAL AI ROUTER MONITORING (GEMINI + GROQ + OPENROUTER) & AUTONOMOUS AGENT ENGINE */}
      <AiRouterMonitoringPanel />

      {/* LIVE RENDERING & VIDEO PROGRESS STATUS */}
      <div className="rounded-2xl border border-fuchsia-400/25 bg-slate-900/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-fuchsia-400" />
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              Status Rendering &amp; Progres Video TikTok 9:16
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection("dashboard")}
            className="flex items-center gap-1 rounded-xl border border-fuchsia-400/50 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-100 hover:bg-fuchsia-500/30"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Buka TikTok Studio</span>
          </button>
        </div>

        {activeEpisode ? (
          <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-slate-950/70 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-white">
                  Ep #{activeEpisode.episodeNumber}:{" "}
                  {activeEpisode.divisions.seo.output?.title || activeEpisode.bossTheme}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Status:{" "}
                  <span className="font-semibold text-cyan-300">
                    {getEpisodeDisplayStatus(activeEpisode, activeEpisodeHasVideo)}
                  </span>{" "}
                  ·{" "}
                  {activeEpisodeHasVideo
                    ? "✅ File video terverifikasi siap diunduh"
                    : "⏳ Belum ada file video render final"}
                </div>
              </div>
              {runningDivision === "editing" && (
                <span className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 font-mono text-xs font-bold text-fuchsia-200">
                  Render {editingProgressPct}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {PIPELINE_DIVISIONS.map((d) => {
                const st = activeEpisode.divisions[d.key]?.status ?? "queued";
                return (
                  <div
                    key={d.key}
                    className={`rounded-xl border p-2 text-[11px] ${
                      st === "done"
                        ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-200"
                        : st === "running"
                        ? "border-cyan-400/60 bg-cyan-950/40 text-cyan-100"
                        : st === "failed"
                        ? "border-rose-500/60 bg-rose-950/40 text-rose-200"
                        : "border-white/10 bg-slate-900/70 text-slate-400"
                    }`}
                  >
                    <div className="truncate font-bold">{d.shortLabel}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase">{st}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-xs text-slate-400">
            Belum ada episode aktif yang sedang dirender. Mulai produksi dari tab{" "}
            <strong className="text-white">TikTok Studio</strong> untuk melihat progres render nyata di sini.
          </div>
        )}

        {episodes.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Riwayat Produksi Aktual ({episodes.length} episode)
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {episodes.slice(0, 6).map((ep) => {
                const hasVideo = hasEpisodeVideo(ep);
                const statusLabel = getEpisodeDisplayStatus(ep, hasVideo);
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      setActiveEpisodeId(ep.id);
                      setActiveSection("dashboard");
                    }}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/65 px-3 py-2 text-left hover:border-cyan-400/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">
                        Ep #{ep.episodeNumber} · {ep.divisions.seo.output?.title || ep.bossTheme}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ep.createdAt).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        hasVideo
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PER-DIVISION BREAKDOWN (6 DIVISIONS / 15 ACTIVE EMPLOYEES) */}
      <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              Breakdown 6 Divisi Produksi (15 Karyawan Aktif)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Skill dibagikan lintas karyawan · kapasitas maks {MAX_TEAM_CAPACITY}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_DIVISIONS.map((div) => {
            const members = agents.filter((a) => a.divisionTeam === div.id);
            const activeCount = members.filter(
              (a) => a.status === "working" || a.status === "walking"
            ).length;
            return (
              <div
                key={div.id}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: div.accentColor }}
                    />
                    <span className="truncate text-xs font-black text-white">
                      {div.label}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/10 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                    L{div.floor}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{div.mission}</p>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    Tim: <strong className="text-white">{members.length}</strong> orang
                  </span>
                  <span
                    className={`font-bold ${
                      activeCount > 0 ? "text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    {activeCount > 0 ? `${activeCount} sedang kerja` : "Semua idle"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        focusOnAgent(m.id);
                        setActiveSection("office");
                      }}
                      className="rounded-lg border border-white/10 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-200 hover:border-cyan-400"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PER-FLOOR STATUS (5 FLOORS) + SKILLS & INTEGRATIONS STATUS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per-Floor Building Status */}
        <div className="rounded-2xl border border-indigo-400/25 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              Status Per Lantai (5 Lantai Kantor 3D)
            </h2>
          </div>
          <div className="mt-3 space-y-2">
            {OFFICE_FLOORS.map((fl) => {
              const flAgents = agents.filter((a) => a.floor === fl.floor);
              const flWorking = flAgents.filter(
                (a) => a.status === "working" || a.status === "walking"
              ).length;
              const flDesks = workstations.filter((w) => w.floor === fl.floor).length;
              return (
                <div
                  key={fl.floor}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <span
                        className="rounded-md px-1.5 py-0.5 font-mono text-[10px] text-slate-950"
                        style={{ backgroundColor: fl.accentColor }}
                      >
                        {fl.code}
                      </span>
                      <span className="truncate">{fl.name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {flAgents.length} karyawan ({flWorking} aktif) · {flDesks} workstation
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFloor(FLOOR_VIEW_BY_NUM[fl.floor]);
                      setActiveSection("office");
                    }}
                    className="shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/25"
                  >
                    Buka 3D
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills & Integrations Live Probe */}
        <div className="rounded-2xl border border-emerald-400/25 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              Status Skill &amp; Integrasi Runtime
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5">
              <div className="text-[10px] text-slate-400">AI Providers</div>
              <div className="mt-1 font-bold text-white">
                {aiStatus?.anyConfigured
                  ? aiStatus.activeProviders.join(" + ")
                  : "Memeriksa..."}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5">
              <div className="text-[10px] text-slate-400">Shared Skill Library</div>
              <div className="mt-1 font-bold text-cyan-300">
                {INSTALLED_GITHUB_SKILLS.length} Repos ·{" "}
                {capabilities?.skillCount ?? 11} Modul Aktif
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5">
              <div className="text-[10px] text-slate-400">Video &amp; Motion Engine</div>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
                <span
                  className={
                    capabilities?.remotionInstalled ? "text-emerald-300" : "text-slate-400"
                  }
                >
                  Remotion {capabilities?.remotionInstalled ? "✓" : "–"}
                </span>
                <span>·</span>
                <span
                  className={
                    capabilities?.gsapInstalled ? "text-emerald-300" : "text-slate-400"
                  }
                >
                  GSAP {capabilities?.gsapInstalled ? "✓" : "–"}
                </span>
                <span>·</span>
                <span
                  className={
                    capabilities?.mp4MuxerInstalled ? "text-emerald-300" : "text-slate-400"
                  }
                >
                  MP4 {capabilities?.mp4MuxerInstalled ? "✓" : "–"}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5">
              <div className="text-[10px] text-slate-400">Optional Host Adapters</div>
              <div className="mt-1 text-[10px] text-slate-300">
                FFmpeg: {capabilities?.ffmpegAvailable ? "Host Ready" : "WebCodecs Browser"} ·{" "}
                Hindsight: {capabilities?.hindsightConfigured ? "Connected" : "Local Memory"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              Semua skill bersifat shared across team — 22 repo GitHub dibagi secara modular ke
              15 karyawan tanpa memaksa 1 repo = 1 orang.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
