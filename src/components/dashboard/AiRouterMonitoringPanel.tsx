"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ACTIVE_EMPLOYEE_ROSTER } from "@/lib/config/team-roster";
import type {
  ProviderHealthMetrics,
  RouterTelemetrySnapshot,
} from "@/lib/ai/llm-provider";
import type { AutonomousTaskExecutionReport } from "@/lib/ai/autonomous-agent-engine";

interface AiStatusApiResponse {
  ok: boolean;
  activeLabel: string;
  primaryTriad?: {
    gemini: boolean;
    groq: boolean;
    openrouter: boolean;
  };
  pricingNotice?: string;
  routerTelemetry?: RouterTelemetrySnapshot;
  checkedAt?: string;
}

interface ProviderTestResponse {
  ok: boolean;
  error?: string;
  testedAt?: string;
  results?: Array<{
    provider: string;
    configured: boolean;
    tested: boolean;
    ok: boolean;
    model: string | null;
    durationMs: number;
    replyPreview: string | null;
    error: string | null;
  }>;
  routingVerification?: {
    reasoningTask: { primaryProvider: string; taskType: string; reason: string };
    fastTask: { primaryProvider: string; taskType: string; reason: string };
  };
  routerStatus?: AiStatusApiResponse;
}

const API_KEY_PROVIDERS = [
  {
    envVar: "GEMINI_API_KEY",
    label: "Google Gemini",
    url: "https://aistudio.google.com/apikey",
    note: "Reasoning & planning · gratis tanpa kartu kredit",
  },
  {
    envVar: "GROQ_API_KEY",
    label: "Groq Cloud",
    url: "https://console.groq.com/keys",
    note: "Fast task & klasifikasi · gratis tanpa kartu kredit",
  },
  {
    envVar: "OPENROUTER_API_KEY",
    label: "OpenRouter",
    url: "https://openrouter.ai/keys",
    note: "Fallback model :free · gratis tanpa kartu kredit",
  },
] as const;

/**
 * Panduan pasang API key DI DALAM aplikasi (tanpa perlu buka repo).
 * Catatan: tidak ada input key di UI — key sengaja server-side only.
 */
function ApiKeySetupGuide() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-950/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/10"
      >
        <span className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-cyan-300" />
          Cara Pasang API Key Router (tutorial 5 langkah)
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {open ? "tutup ▲" : "buka ▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-cyan-400/20 px-3 py-3 text-[11px] text-slate-300">
          <p className="rounded-lg border border-amber-400/25 bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-200">
            Key TIDAK dimasukkan lewat aplikasi ini. Key disimpan sebagai Environment
            Variable di Vercel supaya tidak pernah terkirim ke browser (aman).
          </p>

          <ol className="space-y-1.5">
            <li>
              <strong className="text-white">1.</strong> Ambil key gratis (cukup salah satu):
              <div className="mt-1 space-y-1">
                {API_KEY_PROVIDERS.map((p) => (
                  <a
                    key={p.envVar}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-900/80 px-2 py-1.5 hover:border-cyan-400/50"
                  >
                    <span>
                      <span className="font-mono text-[10px] text-cyan-300">{p.envVar}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400">{p.note}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-cyan-200">
                      {p.label} <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ))}
              </div>
            </li>
            <li>
              <strong className="text-white">2.</strong> Buka Vercel → Project →{" "}
              <span className="font-semibold text-cyan-200">Settings → Environment Variables</span>:
              <a
                href="https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables"
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 font-bold text-cyan-300 hover:underline"
              >
                buka <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <strong className="text-white">3.</strong> Tambahkan nama variabel{" "}
              <span className="font-mono text-[10px] text-cyan-300">PERSIS</span> seperti di atas, tempel key,
              centang <strong>Production + Preview + Development</strong>, lalu Save.
            </li>
            <li>
              <strong className="text-white">4.</strong> <strong>Redeploy</strong> (Deployments → ⋯ → Redeploy).
              Env baru hanya terbaca setelah deployment baru.
            </li>
            <li>
              <strong className="text-white">5.</strong> Verifikasi di panel ini: badge provider berubah dari{" "}
              <span className="font-mono text-[10px] text-amber-300">ENV BELUM ADA</span> menjadi{" "}
              <span className="font-mono text-[10px] text-emerald-300">CIRCUIT: CLOSED</span>, lalu tekan{" "}
              <strong>Tes Live Provider</strong>.
            </li>
          </ol>

          <p className="text-[10px] text-slate-400">
            Lokal: <code className="font-mono text-cyan-300">cp .env.example .env.local</code> lalu{" "}
            <code className="font-mono text-cyan-300">npm run dev</code>. Tanpa key pun aplikasi tetap jalan
            lewat fallback Pollinations keyless (Rp 0). Panduan lengkap + troubleshooting:{" "}
            <code className="font-mono text-cyan-300">docs/API-KEY-ROUTER.md</code>.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Live Central AI Router Monitoring & Autonomous Agent Execution Panel (BAGIAN 5 & 7).
 *
 * 100% actual telemetry from `/api/ai/status`, `/api/ai/test-providers`, and `/api/agents/autonomous-run`.
 * Zero fake numbers, zero API key leakage.
 */
export function AiRouterMonitoringPanel() {
  const [status, setStatus] = useState<AiStatusApiResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [testingProviders, setTestingProviders] = useState(false);
  const [testResult, setTestResult] = useState<ProviderTestResponse | null>(null);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("staff-01");
  const [taskPrompt, setTaskPrompt] = useState<string>(
    "Susun rencana produksi & analisis preset visual terbaik untuk video TikTok 9:16: Claude Code: How AI Coding Agents Work"
  );
  const [runningAutonomous, setRunningAutonomous] = useState(false);
  const [autonomousReport, setAutonomousReport] =
    useState<AutonomousTaskExecutionReport | null>(null);
  const [autonomousError, setAutonomousError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/ai/status", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as AiStatusApiResponse;
        setStatus(data);
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleRunProviderTests = async () => {
    setTestingProviders(true);
    try {
      const res = await fetch("/api/ai/test-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers: ["gemini", "groq", "openrouter"] }),
      });
      const data = (await res.json()) as ProviderTestResponse;
      setTestResult(data);
      if (data.routerStatus) {
        setStatus(data.routerStatus);
      } else {
        await refreshStatus();
      }
    } catch {
      setTestResult({
        ok: false,
        error: "Gagal menghubungi endpoint /api/ai/test-providers.",
      });
    } finally {
      setTestingProviders(false);
    }
  };

  const handleRunAutonomousAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskPrompt.trim().length < 6) return;
    setRunningAutonomous(true);
    setAutonomousError(null);
    try {
      const res = await fetch("/api/agents/autonomous-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          taskPrompt: taskPrompt.trim(),
        }),
      });
      const data = (await res.json()) as AutonomousTaskExecutionReport & {
        error?: string;
      };
      if (!res.ok && !data.runId) {
        setAutonomousError(data.error ?? `HTTP ${res.status}`);
      } else {
        setAutonomousReport(data);
      }
      await refreshStatus();
    } catch {
      setAutonomousError("Kesalahan jaringan saat menjalankan Autonomous Agent Engine.");
    } finally {
      setRunningAutonomous(false);
    }
  };

  const telemetry = status?.routerTelemetry;
  const triadProviders: ProviderHealthMetrics[] = (telemetry?.providers ?? []).filter(
    (p) => p.provider === "gemini" || p.provider === "groq" || p.provider === "openrouter"
  );

  return (
    <div className="space-y-4">
      {/* SECTION 1: CENTRAL AI ROUTER & MULTI-PROVIDER HEALTH MONITORING */}
      <section className="rounded-2xl border border-cyan-400/30 bg-slate-900/85 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-300 uppercase">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>CENTRAL AI ROUTER · GEMINI + GROQ + OPENROUTER (:FREE)</span>
            </div>
            <h2 className="mt-1 text-base font-black text-white">
              Monitoring Kesehatan Provider AI &amp; Fallback Aktual
            </h2>
            <p className="text-[11px] text-slate-400">
              Reasoning/Planning → Gemini · Fast/Low-Latency → Groq · Alternative/Fallback → OpenRouter (:free).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={loadingStatus}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400/50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingStatus ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => void handleRunProviderTests()}
              disabled={testingProviders}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50"
            >
              {testingProviders ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              <span>
                {testingProviders ? "Menguji Provider..." : "Tes Live Provider"}
              </span>
            </button>
          </div>
        </div>

        {/* Queue & Global Router Metrics */}
        {telemetry && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
              <div className="text-[10px] text-slate-400">Request Queue</div>
              <div className="mt-0.5 font-mono text-sm font-black text-cyan-300">
                {telemetry.activeRequests}/{telemetry.maxConcurrentRequests} aktif ·{" "}
                {telemetry.queuedRequests} antre
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
              <div className="text-[10px] text-slate-400">Sukses / Gagal</div>
              <div className="mt-0.5 font-mono text-sm font-black text-white">
                <span className="text-emerald-300">{telemetry.totalSuccesses}</span> /{" "}
                <span className="text-rose-300">{telemetry.totalFailures}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
              <div className="text-[10px] text-slate-400">Error Rate</div>
              <div className="mt-0.5 font-mono text-sm font-black text-amber-300">
                {telemetry.overallErrorRatePct}%
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
              <div className="text-[10px] text-slate-400">Fallback Count</div>
              <div className="mt-0.5 font-mono text-sm font-black text-fuchsia-300">
                {telemetry.totalFallbacks}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
              <div className="text-[10px] text-slate-400">Safe Cache Hits</div>
              <div className="mt-0.5 font-mono text-sm font-black text-sky-300">
                {telemetry.cacheHits} ({telemetry.cacheEntries} entri)
              </div>
            </div>
          </div>
        )}

        {/* 3 Primary Provider Cards: Gemini, Groq, OpenRouter */}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {triadProviders.map((p) => (
            <div
              key={p.provider}
              className={`rounded-xl border p-3.5 text-xs ${
                !p.configured
                  ? "border-amber-400/35 bg-amber-950/20"
                  : p.circuitState === "OPEN"
                  ? "border-rose-500/50 bg-rose-950/25"
                  : "border-emerald-400/30 bg-slate-950/75"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-white">{p.label}</div>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    !p.configured
                      ? "bg-amber-500/20 text-amber-200"
                      : p.circuitState === "CLOSED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : p.circuitState === "HALF_OPEN"
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-rose-500/20 text-rose-200"
                  }`}
                >
                  {!p.configured ? "ENV BELUM ADA" : `CIRCUIT: ${p.circuitState}`}
                </span>
              </div>

              <div className="mt-1.5 font-mono text-[10px] text-cyan-300 truncate">
                Model: {p.activeModel}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                <div>
                  Latency:{" "}
                  <strong className="text-white">
                    {p.lastLatencyMs !== null ? `${p.lastLatencyMs}ms` : "–"}
                  </strong>
                </div>
                <div>
                  Error Rate:{" "}
                  <strong className="text-white">{p.errorRatePct}%</strong>
                </div>
                <div>
                  OK/Fail:{" "}
                  <strong className="text-emerald-300">{p.successCount}</strong>/
                  <strong className="text-rose-300">{p.failureCount}</strong>
                </div>
                <div>
                  Tokens:{" "}
                  <strong className="text-white">{p.totalTokens}</strong>
                </div>
              </div>

              {p.rateLimitRemaining && (
                <div className="mt-1.5 text-[10px] text-sky-300">
                  Rate limit sisa: {p.rateLimitRemaining}
                </div>
              )}

              {!p.configured && p.envVar && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-400/30 bg-amber-950/40 p-2 text-[10px] text-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Pasang <code className="font-mono font-bold">{p.envVar}</code> di
                    Vercel Project Settings (Production &amp; Preview) untuk mengaktifkan.
                  </span>
                </div>
              )}

              {p.lastError && (
                <div className="mt-2 truncate rounded-lg border border-rose-500/30 bg-rose-950/30 px-2 py-1 text-[10px] text-rose-200">
                  Last error: {p.lastError}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Panduan pasang API key (in-app tutorial) */}
        <ApiKeySetupGuide />

        {/* Live Provider Test Results */}
        {testResult && (
          <div className="mt-3 rounded-xl border border-cyan-400/30 bg-slate-950/85 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-200">
                <Activity className="h-3.5 w-3.5" />
                <span>Hasil Tes Live Provider ({testResult.testedAt ?? "baru saja"})</span>
              </div>
              {testResult.routingVerification && (
                <span className="font-mono text-[10px] text-emerald-300">
                  Reasoning → {testResult.routingVerification.reasoningTask.primaryProvider.toUpperCase()} ·
                  Fast → {testResult.routingVerification.fastTask.primaryProvider.toUpperCase()}
                </span>
              )}
            </div>
            {testResult.error && (
              <div className="mt-1.5 text-rose-300">{testResult.error}</div>
            )}
            {testResult.results && (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {testResult.results.map((r) => (
                  <div
                    key={r.provider}
                    className={`rounded-lg border p-2 text-[11px] ${
                      r.ok
                        ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
                        : !r.configured
                        ? "border-amber-400/35 bg-amber-950/25 text-amber-100"
                        : "border-rose-500/40 bg-rose-950/30 text-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold uppercase">
                      <span>{r.provider}</span>
                      <span>
                        {r.ok
                          ? `OK · ${r.durationMs}ms`
                          : !r.configured
                          ? "NOT CONFIGURED"
                          : "FAILED"}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] opacity-85">
                      {r.model ?? r.error ?? "–"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: AUTONOMOUS AGENT ENGINE RUNNER */}
      <section className="rounded-2xl border border-indigo-400/30 bg-slate-900/85 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-300 uppercase">
              <Bot className="h-4 w-4 text-indigo-400" />
              <span>AUTONOMOUS AGENT ENGINE · SANDBOXED WORKFLOW</span>
            </div>
            <h2 className="mt-1 text-base font-black text-white">
              Eksekusi Tugas Otonom (PLAN → READ → ANALYZE → VERIFY → REPORT)
            </h2>
          </div>
          <span className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sandbox Policy Aktif (Secret/Env Diblokir)</span>
          </span>
        </div>

        <form
          onSubmit={handleRunAutonomousAgent}
          className="mt-3 grid gap-2 sm:grid-cols-12"
        >
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white focus:border-indigo-400 focus:outline-none sm:col-span-4"
          >
            {ACTIVE_EMPLOYEE_ROSTER.map((emp) => (
              <option key={emp.id} value={emp.id}>
                L{emp.floor} · {emp.name} — {emp.role}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="Masukkan tugas konkret untuk dijalankan agen secara otonom..."
            className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none sm:col-span-6"
          />

          <button
            type="submit"
            disabled={runningAutonomous}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50 sm:col-span-2"
          >
            {runningAutonomous ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>{runningAutonomous ? "Running..." : "Jalankan"}</span>
          </button>
        </form>

        {autonomousError && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{autonomousError}</span>
          </div>
        )}

        {autonomousReport && (
          <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-slate-950/80 p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {autonomousReport.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                )}
                <span className="font-black text-white">
                  {autonomousReport.agent.name} ({autonomousReport.agent.role})
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan-300">
                  {autonomousReport.lifecycleState}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                <Zap className="h-3 w-3 text-amber-300" />
                <span>
                  {autonomousReport.providerUsed?.toUpperCase() ?? "NONE"} ·{" "}
                  {autonomousReport.modelUsed ?? "–"} ·{" "}
                  {autonomousReport.totalDurationMs}ms
                </span>
              </div>
            </div>

            {/* Step trace */}
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {autonomousReport.steps.map((st, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-2 text-[10px] ${
                    st.ok
                      ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-100"
                      : "border-rose-500/40 bg-rose-950/25 text-rose-100"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{st.phase}</span>
                    <span className="font-mono">{st.durationMs}ms</span>
                  </div>
                  <p className="mt-0.5 text-slate-300">{st.summary}</p>
                </div>
              ))}
            </div>

            {/* Deliverable */}
            {autonomousReport.deliverable && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-slate-900/75 p-2.5">
                  <div className="text-[10px] font-bold text-cyan-300 uppercase">
                    Rencana &amp; Analisis
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-slate-200">
                    {autonomousReport.deliverable.plan.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {autonomousReport.deliverable.analysis}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/75 p-2.5">
                  <div className="text-[10px] font-bold text-fuchsia-300 uppercase">
                    Deliverable Terverifikasi
                  </div>
                  <p className="mt-1 text-[11px] text-slate-100 whitespace-pre-wrap">
                    {autonomousReport.deliverable.concreteOutput}
                  </p>
                  <div className="mt-2 text-[10px] text-emerald-300">
                    Next: {autonomousReport.deliverable.nextRecommendedAction}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
