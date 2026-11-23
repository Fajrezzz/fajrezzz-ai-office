"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Cpu,
  Database,
  Film,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  createBrowserBackend,
  loadTopicHistory,
  summarizeHistory,
  type LoadedHistory,
} from "@/lib/studio/topic-history";
import { semanticSimilarity, type TopicHistoryRecord } from "@/lib/studio/topic-intelligence";
import { blueprintSimilarity, type CreativeBlueprint } from "@/lib/studio/creative-blueprint";

type SkillStatus =
  | "VERIFIED_ACTIVE"
  | "INTEGRATED"
  | "PARTIALLY_INTEGRATED"
  | "REGISTERED_ONLY"
  | "INACTIVE"
  | "BLOCKED"
  | "INCOMPATIBLE";

interface SkillEntry {
  id: string;
  name: string;
  repo: string;
  license: string;
  status: SkillStatus;
  evidence: string[];
  blockedReason: string | null;
  divisions: string[];
}

interface AuditSummary {
  totalRegistered: number;
  counts: Record<SkillStatus, number>;
  verifiedActiveCount: number;
  honestSummary: string;
}

interface StartupPayload {
  generatedAt: string;
  capabilities: {
    llm: { gemini: boolean; groq: boolean; openrouter: boolean; any: boolean };
    network: boolean;
    tts: boolean;
    ffmpeg: boolean;
    browserRenderer: boolean;
    notes: string[];
  };
  candidateBank: { verifiedAt: string; count: number; categories: string[] };
  skillAudit: AuditSummary & { entries: SkillEntry[] };
  historyDurabilityNote: string;
}

interface StageRecord {
  stage: string;
  step: number;
  agent: string;
  skills: string[];
  provider: string;
  status: "ok" | "degraded" | "blocked" | "failed";
  error: string | null;
  output: Record<string, unknown>;
}

interface EpisodePayload {
  episodeNumber: number;
  candidate: { title: string; category: string; angle: string; sources: { name: string; url: string }[] };
  score: { total: number } | null;
  blueprint: CreativeBlueprint;
  blueprintAttempts: { attempt: number; maxSimilarity: number; accepted: boolean }[];
  script: { generator: string; lines: { beat: string; text: string }[]; narration: string; disclaimer?: string };
  scriptAudit: {
    score: number;
    passes: boolean;
    avgSentenceWords: number;
    findings: { code: string; severity: string; message: string }[];
  };
  editingPlan: {
    signature: string;
    scenes: { index: number; beat: string; camera: string; transitionOut: string; durationSec: number }[];
    rhythm: { avgCutSec: number; pace: string };
    novelAgainstHistory: boolean;
  };
  subtitleCueCount: number;
  qc: { ok: boolean; checks: { name: string; ok: boolean; detail: string }[] };
  summary: { blueprintLine: string; editingLine: string };
}

interface RunPayload {
  generatedAt: string;
  finalStatus: "ok" | "degraded" | "blocked" | "failed";
  honestSummary: string;
  usedCandidates: number;
  capabilities: StartupPayload["capabilities"];
  stages: StageRecord[];
  episodes: EpisodePayload[];
}

const STATUS_STYLE: Record<SkillStatus, string> = {
  VERIFIED_ACTIVE: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  INTEGRATED: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
  PARTIALLY_INTEGRATED: "border-amber-400/40 bg-amber-500/15 text-amber-300",
  REGISTERED_ONLY: "border-slate-500/40 bg-slate-500/15 text-slate-300",
  INACTIVE: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  BLOCKED: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300",
  INCOMPATIBLE: "border-orange-400/40 bg-orange-500/15 text-orange-300",
};

const STAGE_STYLE: Record<StageRecord["status"], string> = {
  ok: "text-emerald-300",
  degraded: "text-amber-300",
  blocked: "text-fuchsia-300",
  failed: "text-rose-300",
};

export function StudioIntelligencePanel() {
  const [startup, setStartup] = useState<StartupPayload | null>(null);
  const [run, setRun] = useState<RunPayload | null>(null);
  const [history, setHistory] = useState<LoadedHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [openEpisode, setOpenEpisode] = useState<number | null>(1);

  const historyBackend = useMemo(() => createBrowserBackend(), []);

  const loadStartup = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/autopilot", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStartup((await res.json()) as StartupPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat audit skill");
    }
  }, []);

  useEffect(() => {
    void loadStartup();
    void loadTopicHistory(historyBackend).then(setHistory);
  }, [historyBackend, loadStartup]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await loadTopicHistory(historyBackend);
      setHistory(current);
      const res = await fetch("/api/studio/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: current.records, episodes: 3 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as RunPayload;
      setRun(payload);

      // Simpan riwayat di browser (bukan di server: belum ada DB cloud).
      const merged: TopicHistoryRecord[] = [...current.records];
      for (const episode of payload.episodes) {
        const record = (episode as unknown as { historyRecord: TopicHistoryRecord }).historyRecord;
        if (record && !merged.some((r) => r.episodeId === record.episodeId)) merged.push(record);
      }
      await historyBackend.save(merged.slice(-200));
      setHistory(await loadTopicHistory(historyBackend));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan analisis");
    } finally {
      setLoading(false);
    }
  };

  const comparisons = useMemo(() => {
    if (!run || run.episodes.length < 2) return [];
    const out: { label: string; topic: number; blueprint: number }[] = [];
    for (let i = 0; i < run.episodes.length; i += 1) {
      for (let j = i + 1; j < run.episodes.length; j += 1) {
        const a = run.episodes[i];
        const b = run.episodes[j];
        out.push({
          label: `${i + 1} vs ${j + 1}`,
          topic: semanticSimilarity(`${a.candidate.title} ${a.candidate.angle}`, `${b.candidate.title} ${b.candidate.angle}`),
          blueprint: blueprintSimilarity(a.blueprint, b.blueprint),
        });
      }
    }
    return out;
  }, [run]);

  const counts = startup?.skillAudit.counts;
  const historySummary = history ? summarizeHistory(history.records) : null;

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#061021] via-[#080d1c] to-[#0b0a1a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/15 text-cyan-300">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              Studio Intelligence v10 — Bukti, Bukan Klaim
            </h2>
            <p className="mt-0.5 max-w-2xl text-xs text-slate-400">
              Skor topik anti-repetisi, blueprint kreatif, rencana editing, audit naskah, dan status 26
              skill dihitung dari eksekusi nyata. Tahap yang butuh ffmpeg/API ditandai{" "}
              <span className="font-bold text-fuchsia-300">BLOCKED</span> — tidak pernah dilaporkan selesai.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadStartup()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Muat ulang audit
          </button>
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {loading ? "Menghitung…" : "Analisis 3 episode"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <XCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Angka dinamis dari audit */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ["TERDAFTAR", startup?.skillAudit.totalRegistered, "text-white"],
            ["VERIFIED ACTIVE", counts?.VERIFIED_ACTIVE, "text-emerald-300"],
            ["INTEGRATED", counts?.INTEGRATED, "text-cyan-300"],
            ["PARTIAL", counts?.PARTIALLY_INTEGRATED, "text-amber-300"],
            ["REGISTERED ONLY", counts?.REGISTERED_ONLY, "text-slate-300"],
            ["BLOCKED", counts?.BLOCKED, "text-fuchsia-300"],
            ["INCOMPATIBLE", counts?.INCOMPATIBLE, "text-orange-300"],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-2.5">
            <div className="text-[10px] font-semibold tracking-wide text-slate-400">{label}</div>
            <div className={`mt-0.5 text-xl font-black ${tone}`}>{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-slate-300">
          <Cpu className="h-3 w-3" /> LLM key:{" "}
          {startup
            ? startup.capabilities.llm.any
              ? [startup.capabilities.llm.gemini && "gemini", startup.capabilities.llm.groq && "groq", startup.capabilities.llm.openrouter && "openrouter"]
                  .filter(Boolean)
                  .join(" / ")
              : "tidak ada"
            : "…"}
        </span>
        <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-200">
          ffmpeg: {startup?.capabilities.ffmpeg ? "tersedia" : "TIDAK tersedia"} → ekspor MP4 tidak diklaim
        </span>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-amber-200">
          jaringan riset live: {startup?.capabilities.network ? "aktif" : "tidak tersedia"}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-slate-300">
          <Database className="h-3 w-3" /> riwayat: {history?.records.length ?? 0} · {history?.durability ?? "…"}
        </span>
      </div>

      {historySummary && historySummary.total > 0 && (
        <p className="text-[11px] text-slate-400">
          Kategori riwayat:{" "}
          {historySummary.byCategory.map((c) => `${c.category} (${c.count})`).join(", ")} · terakhir{" "}
          {historySummary.lastProducedAt ? new Date(historySummary.lastProducedAt).toLocaleDateString("id-ID") : "-"}
        </p>
      )}

      {/* Hasil run */}
      {run && (
        <div className="space-y-3 rounded-xl border border-cyan-400/25 bg-slate-950/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-cyan-200">{run.honestSummary}</div>
            <div className="text-[10px] text-slate-400">
              status akhir: <span className={STAGE_STYLE[run.finalStatus]}>{run.finalStatus.toUpperCase()}</span> ·{" "}
              {new Date(run.generatedAt).toLocaleTimeString("id-ID")}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">Tahap</th>
                  <th className="py-1 pr-2">Agent</th>
                  <th className="py-1 pr-2">Skill</th>
                  <th className="py-1 pr-2">Status</th>
                  <th className="py-1">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {run.stages.map((stage, i) => (
                  <tr key={`${stage.stage}-${i}`} className="border-t border-slate-800/80">
                    <td className="py-1 pr-2 text-slate-500">{stage.step}</td>
                    <td className="py-1 pr-2 font-mono text-[10px] text-slate-200">{stage.stage}</td>
                    <td className="py-1 pr-2 text-slate-400">{stage.agent}</td>
                    <td className="py-1 pr-2 text-slate-500">{stage.skills.slice(0, 2).join(", ") || "—"}</td>
                    <td className={`py-1 pr-2 font-bold uppercase ${STAGE_STYLE[stage.status]}`}>{stage.status}</td>
                    <td className="py-1 text-slate-400">{stage.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparisons.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-[11px] text-slate-300">
              <div className="font-bold text-slate-200">Uji anti-repetisi antar episode</div>
              {comparisons.map((c) => (
                <div key={c.label} className="mt-0.5">
                  {c.label}: kemiripan topik {(c.topic * 100).toFixed(0)}% · blueprint {(c.blueprint * 100).toFixed(0)}%{" "}
                  {c.blueprint < 0.55 && c.topic < 0.62 ? (
                    <span className="text-emerald-300">— berbeda</span>
                  ) : (
                    <span className="text-rose-300">— TERLALU MIRIP</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {run.episodes.map((episode) => {
              const open = openEpisode === episode.episodeNumber;
              return (
                <div key={episode.episodeNumber} className="rounded-xl border border-slate-800 bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setOpenEpisode(open ? null : episode.episodeNumber)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {open ? <ChevronDown className="h-3.5 w-3.5 text-cyan-300" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                      <span className="text-xs font-bold text-white">
                        Ep {episode.episodeNumber} · {episode.candidate.title}
                      </span>
                      <span className="rounded-full border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">
                        {episode.candidate.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-400">skor {episode.score?.total ?? "—"}</span>
                      <span className={episode.qc.ok ? "text-emerald-300" : "text-amber-300"}>
                        QC {episode.qc.ok ? "lulus" : "temuan"}
                      </span>
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-slate-800 px-3 py-2 text-[11px] text-slate-300">
                      <div className="text-slate-400">{episode.summary.blueprintLine}</div>
                      <div className="text-slate-400">{episode.summary.editingLine}</div>
                      <div>
                        <span className="font-bold text-slate-200">Naskah</span>{" "}
                        <span className="text-slate-500">({episode.script.generator})</span>
                        <ul className="mt-1 space-y-0.5">
                          {episode.script.lines.map((line, idx) => (
                            <li key={idx}>
                              <span className="font-mono text-[10px] text-cyan-300">[{line.beat}]</span> {line.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="font-bold text-slate-200">Audit naskah: {episode.scriptAudit.score}</div>
                          <div className="text-slate-500">
                            rata-rata {episode.scriptAudit.avgSentenceWords} kata/kalimat ·{" "}
                            {episode.subtitleCueCount} cue subtitle
                          </div>
                          {episode.scriptAudit.findings.length > 0 && (
                            <ul className="mt-1 list-disc pl-4 text-amber-300">
                              {episode.scriptAudit.findings.map((f, i) => (
                                <li key={i}>
                                  {f.severity} · {f.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">QC</div>
                          <ul className="mt-1 space-y-0.5">
                            {episode.qc.checks.map((check) => (
                              <li key={check.name} className={check.ok ? "text-emerald-300" : "text-amber-300"}>
                                {check.ok ? "✓" : "!"} {check.name}: {check.detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">Scene plan</div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {episode.editingPlan.scenes.map((scene) => (
                            <span
                              key={scene.index}
                              className="rounded border border-slate-700 bg-slate-800/70 px-1.5 py-0.5 font-mono text-[9px]"
                            >
                              {scene.index}.{scene.beat} · {scene.camera} · {scene.transitionOut} · {scene.durationSec}s
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">Sumber</div>
                        {episode.candidate.sources.map((s) => (
                          <a
                            key={s.url}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-[10px] text-cyan-300 hover:underline"
                          >
                            {s.name} — {s.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-2 text-[11px] text-fuchsia-100">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Video final belum ada. Ekspor MP4, TTS, dan aset visual berstatus BLOCKED di environment ini —
              dashboard tidak akan menampilkan &quot;selesai&quot; sampai renderer + ffmpeg benar-benar jalan.
              Publikasi otomatis tetap dinonaktifkan sampai Bos menyetujui.
            </span>
          </div>
        </div>
      )}

      {/* Tabel skill berbasis bukti */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <BadgeCheck className="h-4 w-4 text-emerald-300" /> Audit skill (klik untuk bukti)
          </div>
          <div className="text-[10px] text-slate-400">{startup?.skillAudit.honestSummary}</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto px-3 pb-3">
          {(startup?.skillAudit.entries ?? []).map((skill) => {
            const open = openSkill === skill.id;
            return (
              <div key={skill.id} className="border-t border-slate-800/80 py-1.5">
                <button
                  type="button"
                  onClick={() => setOpenSkill(open ? null : skill.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {open ? <ChevronDown className="h-3 w-3 text-cyan-300" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
                    <span className="truncate text-[11px] font-semibold text-slate-100">{skill.name}</span>
                    <span className="truncate font-mono text-[9px] text-slate-500">{skill.repo}</span>
                  </div>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${STATUS_STYLE[skill.status]}`}>
                    {skill.status.replace(/_/g, " ")}
                  </span>
                </button>
                {open && (
                  <div className="mt-1 space-y-1 rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-[10px] text-slate-300">
                    <div className="flex flex-wrap gap-2 text-slate-500">
                      <span>lisensi: {skill.license}</span>
                      <span>divisi: {skill.divisions.join(", ") || "—"}</span>
                    </div>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {skill.evidence.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    {skill.blockedReason && (
                      <div className="flex items-start gap-1 rounded border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-1 text-fuchsia-200">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {skill.blockedReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span>{startup?.historyDurabilityNote ?? "Memuat catatan daya tahan riwayat…"}</span>
      </div>

      {!startup && !error && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat audit skill…
        </div>
      )}

      {run && run.episodes.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Film className="h-3 w-3" /> Storyboard lengkap + trace JSON tersedia di{" "}
          <code className="rounded bg-slate-800 px-1">docs/reports/studio-v10/</code> (hasil dry-run lokal).
        </div>
      )}
    </section>
  );
}
