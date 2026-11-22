"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import {
  getCountdownToYppDeadline,
  YPP_AD_REVENUE_THRESHOLDS,
  YPP_FAN_FUNDING_THRESHOLDS,
  YPP_TARGET_DEADLINE_LABEL,
} from "@/lib/config/ypp-thresholds";
import { PIPELINE_DIVISIONS } from "@/types/pipeline";
import { useAgency } from "@/store/AgencyContext";

const CHANNEL_STATS_KEY = "fajrezzz_ypp_channel_stats_v1";

interface ChannelYppStats {
  subscribers: number;
  watchHours365d: number;
  shortsViews90d: number;
  updatedAt: string | null;
}

const DEFAULT_CHANNEL_STATS: ChannelYppStats = {
  subscribers: 0,
  watchHours365d: 0,
  shortsViews90d: 0,
  updatedAt: null,
};

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function pctOf(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, current) / target) * 1000) / 10);
}

export function RealResultsDashboard() {
  const {
    episodes,
    divisionHistory,
    updateEpisodeMetrics,
    importBackupJson,
  } = useAgency();

  const [yppTier, setYppTier] = useState<"ad_revenue" | "fan_funding">(
    "ad_revenue"
  );
  const [channelStats, setChannelStats] = useState<ChannelYppStats>(
    DEFAULT_CHANNEL_STATS
  );
  const [hydrated, setHydrated] = useState(false);
  const [countdown, setCountdown] = useState(() => getCountdownToYppDeadline());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHANNEL_STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ChannelYppStats>;
        setChannelStats({
          subscribers: Number(parsed.subscribers) || 0,
          watchHours365d: Number(parsed.watchHours365d) || 0,
          shortsViews90d: Number(parsed.shortsViews90d) || 0,
          updatedAt: parsed.updatedAt ?? null,
        });
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        CHANNEL_STATS_KEY,
        JSON.stringify(channelStats)
      );
    } catch {
      // ignore
    }
  }, [channelStats, hydrated]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(getCountdownToYppDeadline());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeThreshold =
    yppTier === "ad_revenue"
      ? YPP_AD_REVENUE_THRESHOLDS
      : YPP_FAN_FUNDING_THRESHOLDS;

  // Real aggregate metrics across all persisted episodes (ZERO fabricated numbers!)
  const totals = useMemo(() => {
    const totalEpisodes = episodes.length;
    const totalApiCostUsd = episodes.reduce(
      (s, ep) => s + (ep.metrics.apiCostUsd || 0),
      0
    );
    const totalViews = episodes.reduce(
      (s, ep) => s + (ep.metrics.views || 0),
      0
    );
    const totalRevenueIdr = episodes.reduce(
      (s, ep) => s + (ep.metrics.revenueIdr || 0),
      0
    );
    const qcPassedCount = episodes.filter(
      (ep) => ep.divisions.qc.output?.passed
    ).length;
    return {
      totalEpisodes,
      totalApiCostUsd,
      totalViews,
      totalRevenueIdr,
      qcPassedCount,
    };
  }, [episodes]);

  // Real KPI per Agent (computed strictly from divisionHistory!)
  const agentKpis = useMemo(() => {
    return PIPELINE_DIVISIONS.map((meta) => {
      const runs = divisionHistory.filter((h) => h.division === meta.key);
      const doneRuns = runs.filter((h) => h.status === "done");
      const totalRuns = runs.length;

      let qcPassRatePct: number | null = null;
      if (meta.key === "qc") {
        const qcRuns = doneRuns.filter((h) => typeof h.qcPassed === "boolean");
        if (qcRuns.length > 0) {
          const passed = qcRuns.filter((h) => h.qcPassed).length;
          qcPassRatePct = Math.round((passed / qcRuns.length) * 100);
        }
      } else {
        // Check how many episodes this agent completed that also passed QC
        const epsTouched = episodes.filter(
          (ep) =>
            ep.divisions[meta.key].status === "done" &&
            ep.divisions.qc.status === "done"
        );
        if (epsTouched.length > 0) {
          const passed = epsTouched.filter(
            (ep) => ep.divisions.qc.output?.passed
          ).length;
          qcPassRatePct = Math.round((passed / epsTouched.length) * 100);
        } else if (totalRuns > 0) {
          qcPassRatePct = Math.round((doneRuns.length / totalRuns) * 100);
        }
      }

      const avgDurationMs =
        doneRuns.length > 0
          ? Math.round(
              doneRuns.reduce((s, r) => s + r.durationMs, 0) / doneRuns.length
            )
          : 0;

      return {
        meta,
        completedTasks: doneRuns.length,
        totalRuns,
        qcPassRatePct,
        avgDurationMs,
      };
    });
  }, [divisionHistory, episodes]);

  const handleExportJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 2,
      yppChannelStats: channelStats,
      episodes,
      divisionHistory,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fajrezzz-ai-office-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        episodes?: unknown[];
        divisionHistory?: unknown[];
        yppChannelStats?: Partial<ChannelYppStats>;
      };
      importBackupJson({
        episodes: Array.isArray(parsed.episodes)
          ? (parsed.episodes as typeof episodes)
          : undefined,
        divisionHistory: Array.isArray(parsed.divisionHistory)
          ? (parsed.divisionHistory as typeof divisionHistory)
          : undefined,
      });
      if (parsed.yppChannelStats) {
        setChannelStats({
          subscribers: Number(parsed.yppChannelStats.subscribers) || 0,
          watchHours365d: Number(parsed.yppChannelStats.watchHours365d) || 0,
          shortsViews90d: Number(parsed.yppChannelStats.shortsViews90d) || 0,
          updatedAt: new Date().toISOString(),
        });
      }
      setImportStatus("✅ Backup JSON berhasil dimuat.");
    } catch {
      setImportStatus("❌ File JSON tidak valid.");
    } finally {
      e.target.value = "";
      window.setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const subsPct = pctOf(channelStats.subscribers, activeThreshold.subscribers);
  const watchPct = pctOf(
    channelStats.watchHours365d,
    activeThreshold.watchHours365d
  );
  const shortsPct = pctOf(
    channelStats.shortsViews90d,
    activeThreshold.shortsViews90d
  );

  return (
    <div className="space-y-5">
      {/* ================= TOP SUMMARY + BACKUP JSON ================= */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-white sm:text-lg">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <span>Dashboard Hasil Nyata (Tanpa Angka Palsu)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Seluruh angka berasal dari eksekusi nyata pipeline &amp; catatan
              YouTube Studio Bos. Disimpan di localStorage + bisa diekspor ke JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400"
            >
              <Upload className="h-4 w-4" />
              <span>Impor JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>

        {importStatus && (
          <div className="mt-2 text-xs font-bold text-cyan-200">
            {importStatus}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-[11px] text-slate-400">Episode Diproduksi</div>
            <div className="mt-1 font-mono text-2xl font-black text-white">
              {totals.totalEpisodes}
            </div>
            <div className="text-[10px] text-emerald-300">
              {totals.qcPassedCount} lolos QC
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-[11px] text-slate-400">Total Biaya API Nyata</div>
            <div className="mt-1 font-mono text-2xl font-black text-cyan-300">
              ${totals.totalApiCostUsd.toFixed(4)}
            </div>
            <div className="text-[10px] text-slate-400">
              Free-tier quota provider
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-[11px] text-slate-400">Total Views Nyata</div>
            <div className="mt-1 font-mono text-2xl font-black text-amber-300">
              {totals.totalViews.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-slate-400">
              Akumulasi catatan per episode
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-[11px] text-slate-400">Total Pendapatan Nyata</div>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-300">
              {formatIdr(totals.totalRevenueIdr)}
            </div>
            <div className="text-[10px] text-slate-400">
              Input nyata dari YouTube Studio
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROGRES SYARAT YPP + COUNTDOWN 1 FEB 2027 ================= */}
      <section className="rounded-3xl border border-amber-400/35 bg-slate-900/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-white sm:text-base">
              <CalendarClock className="h-5 w-5 text-amber-300" />
              <span>
                Target Monetisasi YPP — Hitung Mundur ke {YPP_TARGET_DEADLINE_LABEL}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {activeThreshold.description} (Ambang batas disimpan di{" "}
              <code className="rounded bg-slate-950 px-1 text-cyan-300">
                src/lib/config/ypp-thresholds.ts
              </code>
              )
            </p>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setYppTier("ad_revenue")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold ${
                yppTier === "ad_revenue"
                  ? "bg-amber-400 text-slate-950"
                  : "border border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              Iklan Penuh (1K / 4K / 10M)
            </button>
            <button
              type="button"
              onClick={() => setYppTier("fan_funding")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold ${
                yppTier === "fan_funding"
                  ? "bg-amber-400 text-slate-950"
                  : "border border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              Akses Awal (500 / 3K / 3M)
            </button>
          </div>
        </div>

        {/* Live Countdown Boxes */}
        <div className="mt-4 grid grid-cols-4 gap-2 sm:max-w-md">
          {[
            { label: "Hari", val: countdown.days },
            { label: "Jam", val: countdown.hours },
            { label: "Menit", val: countdown.minutes },
            { label: "Detik", val: countdown.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-amber-400/30 bg-slate-950/90 p-2.5 text-center"
            >
              <div className="font-mono text-xl font-black text-amber-300 sm:text-2xl">
                {String(item.val).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Editable Real Channel Numbers + Progress Bars */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {/* Subscribers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Subscriber Nyata</span>
              <span className="font-mono text-cyan-300">{subsPct}%</span>
            </div>
            <input
              type="number"
              min={0}
              value={channelStats.subscribers}
              onChange={(e) =>
                setChannelStats((prev) => ({
                  ...prev,
                  subscribers: Math.max(0, Number(e.target.value) || 0),
                  updatedAt: new Date().toISOString(),
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
            />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${subsPct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Target: {activeThreshold.subscribers.toLocaleString("id-ID")} subscriber
            </div>
          </div>

          {/* Watch Hours */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Jam Tayang (365 Hari)</span>
              <span className="font-mono text-amber-300">{watchPct}%</span>
            </div>
            <input
              type="number"
              min={0}
              value={channelStats.watchHours365d}
              onChange={(e) =>
                setChannelStats((prev) => ({
                  ...prev,
                  watchHours365d: Math.max(0, Number(e.target.value) || 0),
                  updatedAt: new Date().toISOString(),
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
            />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${watchPct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Target: {activeThreshold.watchHours365d.toLocaleString("id-ID")} jam
              tayang
            </div>
          </div>

          {/* Shorts Views */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Shorts Views (90 Hari)</span>
              <span className="font-mono text-emerald-300">{shortsPct}%</span>
            </div>
            <input
              type="number"
              min={0}
              value={channelStats.shortsViews90d}
              onChange={(e) =>
                setChannelStats((prev) => ({
                  ...prev,
                  shortsViews90d: Math.max(0, Number(e.target.value) || 0),
                  updatedAt: new Date().toISOString(),
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white focus:border-emerald-400 focus:outline-none"
            />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-400 transition-all"
                style={{ width: `${shortsPct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Target: {activeThreshold.shortsViews90d.toLocaleString("id-ID")} views
            </div>
          </div>
        </div>
      </section>

      {/* ================= TABEL HASIL PER EPISODE (DATA NYATA) ================= */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <h3 className="text-sm font-black text-white sm:text-base">
          🎬 Catatan Hasil Nyata per Episode ({episodes.length} Episode)
        </h3>
        <p className="text-xs text-slate-400">
          Masukkan link YouTube, jumlah views, dan pendapatan aktual langsung dari
          YouTube Studio setelah Bos upload manual.
        </p>

        {episodes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
            Belum ada episode. Buat episode pertama di tab <strong>Komando Bos</strong>.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] tracking-wider text-slate-400 uppercase">
                  <th className="pb-2 pr-3">Episode</th>
                  <th className="pb-2 pr-3">Biaya API</th>
                  <th className="pb-2 pr-3">Waktu Produksi</th>
                  <th className="pb-2 pr-3">Status QC</th>
                  <th className="pb-2 pr-3">Link YouTube</th>
                  <th className="pb-2 pr-3">Views Nyata</th>
                  <th className="pb-2">Pendapatan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {episodes.map((ep) => {
                  const qc = ep.divisions.qc.output;
                  const prodSec = (ep.metrics.totalProductionMs / 1000).toFixed(1);
                  return (
                    <tr key={ep.id} className="align-middle">
                      <td className="py-2.5 pr-3">
                        <div className="font-bold text-white">
                          #{ep.episodeNumber} ·{" "}
                          {ep.divisions.seo.output?.title || ep.bossTheme}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ep.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-cyan-300">
                        ${(ep.metrics.apiCostUsd || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-slate-200">
                        {prodSec}d
                      </td>
                      <td className="py-2.5 pr-3">
                        {qc ? (
                          qc.passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                              <ShieldCheck className="h-3 w-3" /> Lolos ({qc.score})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                              <ShieldAlert className="h-3 w-3" /> Diblokir
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500">Belum QC</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="url"
                            value={ep.metrics.youtubeUrl}
                            onChange={(e) =>
                              updateEpisodeMetrics(ep.id, {
                                youtubeUrl: e.target.value,
                              })
                            }
                            placeholder="https://youtu.be/..."
                            className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                          />
                          {ep.metrics.youtubeUrl && (
                            <a
                              href={ep.metrics.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-700 p-1 text-cyan-300 hover:border-cyan-400"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={ep.metrics.views}
                          onChange={(e) =>
                            updateEpisodeMetrics(ep.id, {
                              views: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-white focus:border-amber-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="number"
                          min={0}
                          value={ep.metrics.revenueIdr}
                          onChange={(e) =>
                            updateEpisodeMetrics(ep.id, {
                              revenueIdr: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-emerald-200 focus:border-emerald-400 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================= KPI NYATA PER AGEN (7 DIVISI) ================= */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-sm font-black text-white sm:text-base">
          <Users className="h-5 w-5 text-cyan-400" />
          <span>KPI Nyata per Agen (7 Divisi)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Dihitung langsung dari riwayat eksekusi nyata setiap divisi (bukan angka
          simulasi).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agentKpis.map(({ meta, completedTasks, totalRuns, qcPassRatePct, avgDurationMs }) => (
            <div
              key={meta.key}
              className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <div>
                  <div className="text-xs font-black text-white">
                    {meta.agentName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {meta.label}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-800 pt-2.5 text-center">
                <div>
                  <div className="font-mono text-sm font-black text-white">
                    {completedTasks}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Selesai ({totalRuns})
                  </div>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-emerald-300">
                    {qcPassRatePct !== null ? `${qcPassRatePct}%` : "—"}
                  </div>
                  <div className="text-[9px] text-slate-400">Lolos QC</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-cyan-300">
                    {avgDurationMs > 0
                      ? `${(avgDurationMs / 1000).toFixed(1)}d`
                      : "—"}
                  </div>
                  <div className="text-[9px] text-slate-400">Rata2 Waktu</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Semua data KPI, episode, dan progres YPP disimpan lokal di browser dan
            dapat di-backup kapan saja lewat tombol Ekspor JSON di atas.
          </span>
        </div>
      </section>
    </div>
  );
}
