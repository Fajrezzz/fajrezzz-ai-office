import { NextResponse } from "next/server";

import { CANDIDATE_BANK, CANDIDATE_BANK_VERIFIED_AT } from "@/lib/studio/candidate-bank";
import { runAutopilotPipeline, detectCapabilities } from "@/lib/studio/autopilot-pipeline";
import { runSkillAudit } from "@/lib/studio/skill-audit";
import { recentWindow, summarizeHistory } from "@/lib/studio/topic-history";
import type { TopicCandidate, TopicHistoryRecord } from "@/lib/studio/topic-intelligence";

/**
 * STUDIO v10 — endpoint keputusan produksi.
 *
 * Tidak merender video. Endpoint ini menghitung: pemilihan topik berskor,
 * anti-repetisi terhadap riwayat, blueprint kreatif, rencana editing, naskah
 * deterministik + auditnya, subtitle, QC, dan audit skill berbasis bukti.
 *
 * Semua tahap yang butuh biner/jaringan TIDAK diklaim selesai; statusnya
 * `blocked` dengan alasan yang ikut dikirim ke dashboard.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CANDIDATES = 40;
const MAX_HISTORY = 200;

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https:\/\//.test(value);
}

function sanitizeCandidates(input: unknown): TopicCandidate[] {
  if (!Array.isArray(input)) return CANDIDATE_BANK;
  const cleaned = input
    .slice(0, MAX_CANDIDATES)
    .map((raw) => raw as TopicCandidate)
    .filter(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.title === "string" &&
        Array.isArray(c.sources) &&
        c.sources.every((s) => isHttpUrl(s.url))
    );
  return cleaned.length > 0 ? cleaned : CANDIDATE_BANK;
}

function sanitizeHistory(input: unknown): TopicHistoryRecord[] {
  if (!Array.isArray(input)) return [];
  return (input as TopicHistoryRecord[])
    .slice(-MAX_HISTORY)
    .filter((r) => r && typeof r.title === "string" && typeof r.producedAt === "string");
}

export async function GET() {
  const audit = runSkillAudit({ rootDir: process.cwd() });
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    capabilities: detectCapabilities(process.env),
    candidateBank: {
      verifiedAt: CANDIDATE_BANK_VERIFIED_AT,
      count: CANDIDATE_BANK.length,
      categories: [...new Set(CANDIDATE_BANK.map((c) => c.category))],
    },
    skillAudit: {
      totalRegistered: audit.totalRegistered,
      counts: audit.counts,
      verifiedActiveCount: audit.verifiedActiveCount,
      honestSummary: audit.honestSummary,
      entries: audit.entries,
    },
    historyDurabilityNote:
      "Riwayat tersimpan di browser (localStorage). Belum ada database cloud: " +
      "riwayat hilang bila data situs dibersihkan atau dibuka dari perangkat lain.",
  });
}

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const payload = (body ?? {}) as {
    candidates?: unknown;
    history?: unknown;
    episodes?: unknown;
  };

  const candidates = sanitizeCandidates(payload.candidates);
  const history = sanitizeHistory(payload.history);
  const episodesToBuild = Math.min(3, Math.max(1, Number(payload.episodes) || 3));

  const audit = runSkillAudit({ rootDir: process.cwd() });
  const run = runAutopilotPipeline({
    candidates,
    history,
    capabilities: detectCapabilities(process.env),
    skillAudit: audit,
    episodesToBuild,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    requestedCandidates: Array.isArray(payload.candidates) ? (payload.candidates as unknown[]).length : 0,
    usedCandidates: candidates.length,
    historyWindow: recentWindow(history).length,
    historySummary: summarizeHistory(history),
    finalStatus: run.finalStatus,
    honestSummary: run.honestSummary,
    capabilities: run.capabilities,
    stages: run.stages,
    selection: run.selection,
    episodes: run.episodes.map((episode) => ({
      episodeId: episode.episodeId,
      episodeNumber: episode.episodeNumber,
      candidate: episode.candidate,
      score: episode.score,
      blueprint: episode.blueprint,
      blueprintAttempts: episode.blueprintAttempts,
      script: episode.script,
      scriptAudit: episode.scriptAudit,
      editingPlan: episode.editingPlan,
      subtitleCueCount: episode.subtitleCues.length,
      subtitleSample: episode.subtitleCues.slice(0, 12),
      historyRecord: episode.historyRecord,
      qc: episode.qc,
      summary: episode.summary,
    })),
    skillAuditSummary: {
      totalRegistered: audit.totalRegistered,
      counts: audit.counts,
      verifiedActiveCount: audit.verifiedActiveCount,
      honestSummary: audit.honestSummary,
    },
  });
}
