/**
 * FAJREZZZ AI OFFICE — EPISODE FACTORY (v10)
 *
 * Satu fungsi untuk merangkai satu episode lengkap dari kandidat topik:
 *   skor → blueprint → naskah → audit naskah → rencana editing → subtitle → QC
 *
 * Semua bukti disimpan di satu objek `EpisodeArtifact` supaya bisa dibandingkan
 * antar episode (anti-repetisi) dan ditampilkan di dashboard tanpa mengarang.
 */

import { semanticSimilarity, type TopicCandidate, type TopicScoreBreakdown, type TopicHistoryRecord } from "./topic-intelligence.ts";
import {
  buildCreativeBlueprint,
  blueprintSimilarity,
  describeBlueprint,
  type BlueprintVariationAttempt,
  type CreativeBlueprint,
} from "./creative-blueprint.ts";
import { buildEditingPlan, describeEditingPlan, validateEditingPlan, type EditingPlan } from "./dynamic-editing.ts";
import { auditScript, buildScriptSkeleton, type ScriptAuditReport, type ScriptDraft } from "./script-intelligence.ts";
import { computeWordTimings } from "../pipeline/video-engine-v3.ts";

export interface SubtitleCueSummary {
  index: number;
  word: string;
  startSec: number;
  endSec: number;
  highlight: boolean;
}

export interface EpisodeQcReport {
  ok: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
}

export interface EpisodeArtifact {
  episodeId: string;
  episodeNumber: number;
  producedAt: string;
  candidate: TopicCandidate;
  score: TopicScoreBreakdown | null;
  blueprint: CreativeBlueprint;
  blueprintAttempts: BlueprintVariationAttempt[];
  script: ScriptDraft;
  scriptAudit: ScriptAuditReport;
  editingPlan: EditingPlan;
  subtitleCues: SubtitleCueSummary[];
  historyRecord: TopicHistoryRecord;
  qc: EpisodeQcReport;
  summary: {
    blueprintLine: string;
    editingLine: string;
    scriptScore: number;
    estimatedDurationSec: number;
  };
}

export interface BuildEpisodeOptions {
  episodeNumber?: number;
  history?: TopicHistoryRecord[];
  previousBlueprints?: CreativeBlueprint[];
  previousEditingSignatures?: string[];
  now?: Date;
  score?: TopicScoreBreakdown | null;
}

function estimateSpeechSec(wordTotal: number): number {
  return Math.max(6, Math.round((wordTotal / 2.6) * 10) / 10);
}

export function buildEpisodeArtifact(
  candidate: TopicCandidate,
  options: BuildEpisodeOptions = {}
): EpisodeArtifact {
  const now = options.now ?? new Date();
  const episodeNumber = options.episodeNumber ?? 1;

  const built = buildCreativeBlueprint(candidate, {
    history: options.previousBlueprints ?? [],
    episodeIndex: episodeNumber,
  });
  const blueprint = built.blueprint;

  const script = buildScriptSkeleton(candidate, blueprint);
  const scriptAudit = auditScript(script.narration, {
    sources: candidate.sources.map((s) => s.url),
  });

  const editingPlan = buildEditingPlan(blueprint, candidate, options.previousEditingSignatures ?? []);
  const editingValidation = validateEditingPlan(editingPlan);

  // Subtitle: memakai timing nyata dari engine (bukan perkiraan kasar).
  const speechDurationSec = estimateSpeechSec(script.narration.split(/\s+/).filter(Boolean).length);
  const cues = computeWordTimings(script.narration, 0.08, speechDurationSec);
  const subtitleCues: SubtitleCueSummary[] = cues.map((c, i) => ({
    index: i + 1,
    word: c.word,
    startSec: c.startSec,
    endSec: c.endSec,
    highlight: c.highlight,
  }));

  const checks: { name: string; ok: boolean; detail: string }[] = [
    {
      name: "sumber",
      ok: candidate.sources.length > 0,
      detail: `${candidate.sources.length} sumber terdaftar`,
    },
    {
      name: "audit naskah",
      ok: scriptAudit.passes,
      detail: `skor ${scriptAudit.score}, ${scriptAudit.findings.length} temuan`,
    },
    {
      name: "rencana editing",
      ok: editingValidation.ok,
      detail: editingValidation.ok ? "tidak ada pelanggaran ritme/transisi" : editingValidation.issues.join("; "),
    },
    {
      name: "variasi blueprint",
      ok: built.rejectedCount >= 0 && !blueprint.generationNotes.some((n) => n.startsWith("PERINGATAN")),
      detail: `${built.attempts.length} percobaan, ${built.rejectedCount} ditolak karena mirip`,
    },
    {
      name: "variasi editing",
      ok: editingPlan.novelAgainstHistory,
      detail: editingPlan.novelAgainstHistory ? "pola editing baru" : "pola editing sama dengan riwayat",
    },
    {
      name: "subtitle sinkron",
      ok: subtitleCues.length > 0 && subtitleCues.every((c, i) => (i === 0 ? true : c.startSec >= subtitleCues[i - 1].startSec)),
      detail: `${subtitleCues.length} cue kata, urutan naik`,
    },
  ];

  const historyRecord: TopicHistoryRecord = {
    episodeId: candidate.id,
    episodeNumber,
    producedAt: now.toISOString(),
    title: candidate.title,
    mainTopic: candidate.thesis,
    category: candidate.category,
    angle: candidate.angle,
    hook: candidate.hook,
    summary: `${candidate.thesis} (${candidate.angle})`,
    sources: candidate.sources.map((s) => s.url),
    storyFormat: blueprint.narrativeStructure,
    visualStyle: blueprint.visualStyle,
    status: "draft",
    editingSignature: editingPlan.signature,
    blueprintSignature: blueprint.signature,
    scoreTotal: options.score?.total,
  };

  return {
    episodeId: candidate.id,
    episodeNumber,
    producedAt: now.toISOString(),
    candidate,
    score: options.score ?? null,
    blueprint,
    blueprintAttempts: built.attempts,
    script,
    scriptAudit,
    editingPlan,
    subtitleCues,
    historyRecord,
    qc: { ok: checks.every((c) => c.ok), checks },
    summary: {
      blueprintLine: describeBlueprint(blueprint),
      editingLine: describeEditingPlan(editingPlan),
      scriptScore: scriptAudit.score,
      estimatedDurationSec: Math.round((blueprint.estimatedDurationSec + speechDurationSec) / 2),
    },
  };
}

/* ============================================================================
 * PERBANDINGAN ANTAR EPISODE (bukti anti-repetisi)
 * ========================================================================== */

export interface EpisodeDifferenceReport {
  a: string;
  b: string;
  topicSimilarity: number;
  blueprintSimilarity: number;
  sameEditingSignature: boolean;
  scriptSimilarity: number;
  sameVisualStyle: boolean;
  sameHookStyle: boolean;
  sameNarrativeStructure: boolean;
  sameTransitionLanguage: boolean;
  sameTypography: boolean;
  verdict: "berbeda" | "terlalu mirip";
  notes: string[];
}

export function compareEpisodes(a: EpisodeArtifact, b: EpisodeArtifact): EpisodeDifferenceReport {
  const topicSimilarity = semanticSimilarity(
    `${a.candidate.title} ${a.candidate.angle} ${a.candidate.thesis}`,
    `${b.candidate.title} ${b.candidate.angle} ${b.candidate.thesis}`
  );
  const bpSim = blueprintSimilarity(a.blueprint, b.blueprint);
  const scriptSimilarity = semanticSimilarity(a.script.narration, b.script.narration);
  const notes: string[] = [];

  const sameVisualStyle = a.blueprint.visualStyle === b.blueprint.visualStyle;
  const sameHookStyle = a.blueprint.hookStyle === b.blueprint.hookStyle;
  const sameNarrativeStructure = a.blueprint.narrativeStructure === b.blueprint.narrativeStructure;
  const sameTypography = a.blueprint.typographyStyle === b.blueprint.typographyStyle;
  const sameTransitionLanguage =
    [...a.blueprint.transitionLanguage].sort().join("+") === [...b.blueprint.transitionLanguage].sort().join("+");
  const sameEditingSignature = a.editingPlan.signature === b.editingPlan.signature;

  if (sameVisualStyle) notes.push("gaya visual sama persis");
  if (sameHookStyle) notes.push("gaya hook sama");
  if (sameNarrativeStructure) notes.push("struktur cerita sama");
  if (sameTypography) notes.push("gaya tipografi sama");
  if (sameTransitionLanguage) notes.push("bahasa transisi sama");
  if (scriptSimilarity > 0.4) notes.push(`naskah mirip (${scriptSimilarity.toFixed(2)})`);

  const tooSimilar =
    sameEditingSignature || bpSim >= 0.55 || topicSimilarity >= 0.62 || scriptSimilarity >= 0.62;

  return {
    a: a.candidate.title,
    b: b.candidate.title,
    topicSimilarity: Math.round(topicSimilarity * 1000) / 1000,
    blueprintSimilarity: bpSim,
    sameEditingSignature,
    scriptSimilarity: Math.round(scriptSimilarity * 1000) / 1000,
    sameVisualStyle,
    sameHookStyle,
    sameNarrativeStructure,
    sameTransitionLanguage,
    sameTypography,
    verdict: tooSimilar ? "terlalu mirip" : "berbeda",
    notes,
  };
}
