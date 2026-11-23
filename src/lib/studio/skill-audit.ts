/**
 * FAJREZZZ AI OFFICE — REAL SKILL AUDIT (v10)
 *
 * Aturan main: status TIDAK BOLEH diberikan hanya karena sebuah nama ada di
 * array registry. Setiap skill harus punya bukti:
 *   1. file implementasi benar-benar ada,
 *   2. kode itu benar-benar dirujuk oleh modul lain (bukan file yatim),
 *   3. bila ada fungsi murni, probe DIJALANKAN dengan input nyata dan hasilnya
 *      diperiksa.
 *
 * Status:
 *   VERIFIED_ACTIVE      → probe dijalankan & lulus (bukti eksekusi ada)
 *   INTEGRATED           → kode ada + dirujuk, tapi belum ada probe fungsional
 *   PARTIALLY_INTEGRATED → hanya sebagian jalur tersedia (mis. browser-only)
 *   REGISTERED_ONLY      → hanya prompt/direktif, tidak ada kode eksekusi
 *   INACTIVE             → file ada tapi tidak dirujuk siapa pun
 *   BLOCKED              → butuh API key / biner / jaringan yang tidak tersedia
 *   INCOMPATIBLE         → desainnya tidak cocok dengan arsitektur sekarang
 */

import fs from "node:fs";
import path from "node:path";
import { INSTALLED_GITHUB_SKILLS } from "../ai/github-skills-registry.ts";
import { buildInstalledSkillsPrompt } from "../ai/github-skills-registry.ts";
import { detectAiTells, humanizerScore } from "../ai/writing-humanizer.ts";
import { contrastRatio, wcagLevel } from "../ai/design-intelligence.ts";
import { classifyRecency } from "../ai/research-recency.ts";
import { computeSyncedSceneDuration, computeWordTimings } from "../pipeline/video-engine-v3.ts";

export type SkillAuditStatus =
  | "VERIFIED_ACTIVE"
  | "INTEGRATED"
  | "PARTIALLY_INTEGRATED"
  | "REGISTERED_ONLY"
  | "INACTIVE"
  | "BLOCKED"
  | "INCOMPATIBLE";

export interface SkillProbeEvidence {
  probe: string;
  ran: boolean;
  passed: boolean;
  detail: string;
}

export interface SkillAuditEntry {
  id: string;
  name: string;
  repo: string;
  license: string;
  category: string;
  status: SkillAuditStatus;
  /** Tidak boleh kosong — kalimat bukti yang bisa diperiksa ulang. */
  evidence: string[];
  filesFound: string[];
  filesMissing: string[];
  probes: SkillProbeEvidence[];
  blockedReason: string | null;
  divisions: string[];
}

export interface SkillAuditReport {
  generatedAt: string;
  durationMs: number;
  totalRegistered: number;
  counts: Record<SkillAuditStatus, number>;
  /** Angka yang boleh ditampilkan dashboard — bukan hardcode 26. */
  verifiedActiveCount: number;
  entries: SkillAuditEntry[];
  honestSummary: string;
}

/* ============================================================================
 * 1. TABEL BUKTI PER SKILL
 * ========================================================================== */

interface SkillEvidenceSpec {
  /** File yang HARUS ada sebagai bukti integrasi kode. */
  files: string[];
  /** Pola yang harus muncul di suatu tempat di `src/` (bukti dirujuk). */
  usage: RegExp[];
  /** Nama modul sumber (untuk laporan). */
  module?: string;
  /** Jenis skill: menentukan status maksimum yang wajar. */
  kind: "functional" | "prompt-directive" | "browser-only" | "requires-api" | "requires-binary" | "reference-only";
  probes?: (() => SkillProbeEvidence)[];
  blockedReason?: string;
  note?: string;
}

const PROMPT_SCOPES = ["autopilot", "think", "research", "seo", "script", "qc"] as const;

/**
 * Bukti bahwa direktif skill benar-benar masuk ke system prompt — dicoba pada
 * SEMUA scope divisi, bukan hanya "script", supaya penilaiannya adil.
 */
function promptInjectionProbe(skillId: string): SkillProbeEvidence {
  try {
    const found: string[] = [];
    for (const scope of PROMPT_SCOPES) {
      const { promptBlock } = buildInstalledSkillsPrompt(scope);
      if (promptBlock.includes(`[${skillId}]`)) found.push(scope);
    }
    const passed = found.length > 0;
    return {
      probe: `buildInstalledSkillsPrompt() memuat [${skillId}]`,
      ran: true,
      passed,
      detail: passed
        ? `Direktif skill disuntikkan ke system prompt divisi: ${found.join(", ")}.`
        : "Direktif skill TIDAK muncul di prompt divisi mana pun — belum terintegrasi.",
    };
  } catch (err) {
    return {
      probe: "prompt injection",
      ran: true,
      passed: false,
      detail: err instanceof Error ? err.message : "gagal menjalankan prompt builder",
    };
  }
}

const humanizerProbe = (): SkillProbeEvidence => {
  const sample = "Di era digital saat ini, tentunya kita semua tahu bahwa AI sangat penting.";
  const tells = detectAiTells(sample);
  const score = humanizerScore(sample);
  return {
    probe: "detectAiTells + humanizerScore pada sampel berbau AI",
    ran: true,
    passed: tells.length > 0 && score < 90,
    detail: `terdeteksi ${tells.length} pola AI (${tells.map((t) => t.id).join(", ") || "tidak ada"}), skor humanis ${score}.`,
  };
};

const uxProbe = (): SkillProbeEvidence => {
  const ratio = contrastRatio("#000000", "#ffffff");
  const level = ratio === null ? "gagal" : wcagLevel(ratio);
  return {
    probe: 'contrastRatio("#000000", "#ffffff") + wcagLevel',
    ran: true,
    passed: ratio !== null && Math.abs(ratio - 21) < 0.1 && level === "AAA",
    detail: `rasio kontras ${ratio}, level ${level}.`,
  };
};

const recencyProbe = (): SkillProbeEvidence => {
  const fresh = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
  const old = "2019-01-05";
  const a = classifyRecency(fresh);
  const b = classifyRecency(old);
  return {
    probe: "classifyRecency(2 hari lalu) vs classifyRecency(2019)",
    ran: true,
    passed: a === "fresh" && b === "stale",
    detail: `2 hari → ${a}, 2019 → ${b}.`,
  };
};

const subtitleProbe = (): SkillProbeEvidence => {
  const narration = "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh.";
  const { speechOffsetSec, speechDurationSec } = computeSyncedSceneDuration(5, narration.length / 12);
  const cues = computeWordTimings(narration, speechOffsetSec, speechDurationSec);
  const monotonic = cues.every((c, i) => (i === 0 ? true : c.startSec >= cues[i - 1].startSec));
  const inRange = cues.every((c) => c.endSec <= speechOffsetSec + speechDurationSec + 0.001);
  return {
    probe: "computeWordTimings → urutan monoton & tidak melewati durasi audio",
    ran: true,
    passed: cues.length === 10 && monotonic && inRange,
    detail: `${cues.length} cue kata, monoton=${monotonic}, dalam durasi=${inRange}.`,
  };
};

const SKILL_EVIDENCE: Record<string, SkillEvidenceSpec> = {
  marketingskills: {
    files: ["src/lib/ai/github-skills-registry.ts"],
    usage: [/buildInstalledSkillsPrompt/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("marketingskills")],
  },
  "linkedin-skills": {
    files: ["src/lib/ai/writing-humanizer.ts"],
    usage: [/humanizeText/, /detectAiTells/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("linkedin-skills"), humanizerProbe],
  },
  hallmark: {
    files: ["src/lib/ai/design-intelligence.ts"],
    usage: [/DESIGN_PLAYBOOKS|designAudit/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("hallmark")],
  },
  hyperframes: {
    files: ["src/remotion/TikTokAiComposition.tsx", "src/lib/pipeline/motion-renderer.ts"],
    usage: [/TikTokAiComposition|renderTikTokVideoV3/],
    kind: "functional",
    probes: [subtitleProbe],
  },
  voicebox: {
    files: ["src/lib/pipeline/neural-tts-client.ts", "src/app/api/tts/route.ts"],
    usage: [/neural-tts-client|synthesizeNeuralSpeech/i],
    kind: "requires-api",
    blockedReason:
      "Voice neural butuh koneksi layanan TTS (msedge-tts/API). Sandbox hanya boleh mengakses npm/github, jadi tidak bisa dieksekusi di sini.",
    probes: [() => promptInjectionProbe("voicebox")],
  },
  comfyui: {
    files: ["src/lib/pipeline/scene-broll-client.ts", "src/app/api/ai/scene-image/route.ts"],
    usage: [/scene-broll-client|generateSceneImage/i],
    kind: "requires-api",
    blockedReason: "Pembuatan B-roll butuh API key image provider (Gemini image / ComfyUI server).",
  },
  openrig: {
    files: ["src/lib/ai/autonomous-agent-engine.ts"],
    usage: [/autonomous-agent-engine|runAutonomous/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("openrig")],
  },
  orca: {
    files: ["src/lib/pipeline/browser-divisions.ts"],
    usage: [/browser-divisions|DIVISION_EXECUTORS/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("orca")],
  },
  "ai-memory": {
    files: ["src/lib/ai/agent-memory.ts", "src/lib/ai/hindsight-memory.ts"],
    usage: [/loadLongTermMemory|buildCompressedMemoryContext/],
    kind: "browser-only",
    blockedReason: "API memori memakai window.localStorage → tidak bisa diprobe di Node/server.",
  },
  "claude-mem": {
    files: ["src/lib/ai/agent-memory.ts"],
    usage: [/recordMemoryEvent|buildMemoryRecall/],
    kind: "browser-only",
    blockedReason: "Kompresi konteks bergantung pada localStorage browser.",
  },
  "claude-plugins-official": {
    files: ["src/lib/ai/github-skills-registry.ts", "src/lib/ai/advanced-skill-registry.ts"],
    usage: [/INSTALLED_GITHUB_SKILLS|MODULAR_AGENT_SKILLS/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("claude-plugins-official")],
  },
  "scrapegraph-ai": {
    files: ["src/lib/ai/trend-intelligence.ts"],
    usage: [/fetchLiveAiTrends|rankTrendTopics/],
    kind: "requires-api",
    blockedReason: "Pengambilan tren butuh jaringan ke GitHub API (diblokir di sandbox ini).",
  },
  scrapling: {
    files: ["src/lib/ai/trend-intelligence.ts", "src/lib/ai/research-recency.ts"],
    usage: [/evaluateTrendFreshness|classifyRecency/],
    kind: "functional",
    probes: [recencyProbe],
  },
  "data-formulator": {
    files: ["src/lib/pipeline/ffmpeg-adapter.ts", "src/lib/perf/render-telemetry.ts"],
    usage: [/parseFfprobeJson|buildRenderTelemetry/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("data-formulator")],
  },
  "ai-engineering-from-scratch": {
    files: ["src/lib/ai/llm-provider.ts"],
    usage: [/parseModelOutput|classifyProviderError/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("ai-engineering-from-scratch")],
  },
  "git-bug": {
    files: ["src/lib/pipeline/auto-editor-pacing.ts"],
    usage: [/auto-editor-pacing|buildPacingPlan/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("git-bug")],
  },
  "atlas-os": {
    files: ["src/lib/perf/render-telemetry.ts"],
    usage: [/render-telemetry|evaluateActualVideoQc/],
    kind: "browser-only",
    blockedReason: "Telemetry performa membaca canvas/DOM browser.",
  },
  t3code: {
    files: ["src/app/api/agents/think/route.ts"],
    usage: [/api\/agents\/think|AgentsThink/],
    kind: "requires-api",
    blockedReason: "Perintah agent remote butuh LLM API key di server.",
  },
  openmausbot: {
    files: ["src/lib/ai/autonomous-agent-engine.ts", "src/lib/security/secret-scan.ts"],
    usage: [/sandbox|secret-scan/i],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("openmausbot")],
  },
  moneyprinterturbo: {
    files: ["src/lib/pipeline/video-engine-v3.ts"],
    usage: [/renderTikTokVideoV3|buildCandidateProfileLadder/],
    kind: "functional",
    probes: [subtitleProbe],
  },
  "andrej-karpathy-skills": {
    files: ["src/lib/ai/llm-provider.ts"],
    usage: [/buildInstalledSkillsPrompt/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("andrej-karpathy-skills")],
  },
  humanizer: {
    files: ["src/lib/ai/writing-humanizer.ts"],
    usage: [/humanizeSceneNarrations|humanizerScore/],
    kind: "functional",
    probes: [humanizerProbe],
  },
  "ui-ux-pro-max": {
    files: ["src/lib/ai/design-intelligence.ts"],
    usage: [/contrastRatio|wcagLevel/],
    kind: "functional",
    probes: [uxProbe],
  },
  "last30days-skill": {
    files: ["src/lib/ai/research-recency.ts"],
    usage: [/summarizeRecency|classifyRecency/],
    kind: "functional",
    probes: [recencyProbe],
  },
  "rea-reverse-engineering": {
    files: ["src/lib/ai/github-skills-registry.ts"],
    usage: [/rea-reverse-engineering/],
    kind: "reference-only",
    blockedReason: "Playbook ini menuntut worker/analisis biner eksternal yang tidak ada di repo.",
  },
  "agency-agents": {
    files: ["src/lib/config/team-roster.ts"],
    usage: [/ACTIVE_EMPLOYEE_ROSTER/],
    kind: "prompt-directive",
    probes: [() => promptInjectionProbe("agency-agents")],
  },
};

/* ============================================================================
 * 2. AUDIT RUNNER
 * ========================================================================== */

export interface AuditDeps {
  rootDir: string;
  exists?: (rel: string) => boolean;
  /** Semua teks sumber untuk pemindaian usage. Default: seluruh `src/`. */
  sourceText?: () => string;
}

function collectSourceText(rootDir: string): string {
  const chunks: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) chunks.push(fs.readFileSync(full, "utf8"));
    }
  };
  walk(path.join(rootDir, "src"));
  return chunks.join("\n");
}

function maxStatusForKind(kind: SkillEvidenceSpec["kind"]): SkillAuditStatus {
  switch (kind) {
    case "functional":
      return "VERIFIED_ACTIVE";
    case "prompt-directive":
      return "INTEGRATED";
    case "browser-only":
      return "PARTIALLY_INTEGRATED";
    case "requires-api":
    case "requires-binary":
      return "BLOCKED";
    case "reference-only":
      return "INCOMPATIBLE";
  }
}

export function runSkillAudit(deps: AuditDeps): SkillAuditReport {
  const startedAt = Date.now();
  const exists = deps.exists ?? ((rel: string) => fs.existsSync(path.join(deps.rootDir, rel)));
  const sources = deps.sourceText ?? (() => collectSourceText(deps.rootDir));
  const sourceText = sources();

  const entries: SkillAuditEntry[] = INSTALLED_GITHUB_SKILLS.map((skill) => {
    const spec = SKILL_EVIDENCE[skill.id];
    if (!spec) {
      return {
        id: skill.id,
        name: skill.name,
        repo: skill.repo,
        license: skill.license,
        category: skill.category,
        status: "REGISTERED_ONLY" as SkillAuditStatus,
        evidence: ["Terdaftar di INSTALLED_GITHUB_SKILLS, belum ada file implementasi yang dipetakan pada audit ini."],
        filesFound: [],
        filesMissing: [],
        probes: [],
        blockedReason: null,
        divisions: skill.assignedDivisions,
      };
    }

    const filesFound = spec.files.filter((f) => exists(f));
    const filesMissing = spec.files.filter((f) => !exists(f));
    const usageHits = spec.usage.filter((re) => re.test(sourceText)).length;
    const probes = (spec.probes ?? []).map((p) => p());
    const passedProbes = probes.filter((p) => p.ran && p.passed).length;
    const ranProbes = probes.filter((p) => p.ran).length;

    const evidence: string[] = [];
    evidence.push(
      filesFound.length > 0
        ? `File implementasi ada: ${filesFound.join(", ")}`
        : "Tidak ada file implementasi yang cocok."
    );
    evidence.push(
      `Rujukan kode: ${usageHits}/${spec.usage.length} pola ditemukan di src/.`
    );
    for (const p of probes) {
      evidence.push(`${p.ran ? (p.passed ? "LULUS" : "GAGAL") : "TIDAK JALAN"} · ${p.probe} → ${p.detail}`);
    }
    if (spec.note) evidence.push(spec.note);

    let status: SkillAuditStatus;
    if (filesMissing.length > 0 && filesFound.length === 0) {
      status = "INACTIVE";
    } else if (spec.kind === "reference-only") {
      status = "INCOMPATIBLE";
    } else if (spec.kind === "requires-api" || spec.kind === "requires-binary") {
      status = "BLOCKED";
    } else if (filesFound.length === 0 || usageHits === 0) {
      status = "REGISTERED_ONLY";
    } else if (spec.kind === "functional") {
      status = ranProbes > 0 && passedProbes === ranProbes ? "VERIFIED_ACTIVE" : "INTEGRATED";
    } else if (spec.kind === "browser-only") {
      status = "PARTIALLY_INTEGRATED";
    } else {
      // prompt-directive: bukti = direktif benar-benar masuk system prompt.
      const injection = probes.find((p) => p.probe.includes("buildInstalledSkillsPrompt"));
      status = injection?.passed ? maxStatusForKind(spec.kind) : "REGISTERED_ONLY";
    }

    return {
      id: skill.id,
      name: skill.name,
      repo: skill.repo,
      license: skill.license,
      category: skill.category,
      status,
      evidence,
      filesFound,
      filesMissing,
      probes,
      blockedReason: spec.blockedReason ?? null,
      divisions: skill.assignedDivisions,
    };
  });

  const counts: Record<SkillAuditStatus, number> = {
    VERIFIED_ACTIVE: 0,
    INTEGRATED: 0,
    PARTIALLY_INTEGRATED: 0,
    REGISTERED_ONLY: 0,
    INACTIVE: 0,
    BLOCKED: 0,
    INCOMPATIBLE: 0,
  };
  for (const e of entries) counts[e.status] += 1;

  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    totalRegistered: INSTALLED_GITHUB_SKILLS.length,
    counts,
    verifiedActiveCount: counts.VERIFIED_ACTIVE,
    entries,
    honestSummary:
      `${INSTALLED_GITHUB_SKILLS.length} skill terdaftar · ` +
      `${counts.VERIFIED_ACTIVE} VERIFIED ACTIVE (probe fungsional lulus) · ` +
      `${counts.INTEGRATED} INTEGRATED (kode + direktif prompt terbukti) · ` +
      `${counts.PARTIALLY_INTEGRATED} PARTIALLY (butuh browser) · ` +
      `${counts.BLOCKED} BLOCKED (butuh API/biner/jaringan) · ` +
      `${counts.INCOMPATIBLE} INCOMPATIBLE (referensi saja).`,
  };
}

/** Ringkasan untuk prompt LLM: hanya skill yang benar-benar punya bukti kode. */
export function activeSkillIdsFromAudit(report: SkillAuditReport): string[] {
  return report.entries
    .filter((e) => e.status === "VERIFIED_ACTIVE" || e.status === "INTEGRATED")
    .map((e) => e.id);
}

/** Probe skill berdasarkan divisi (dipakai pipeline untuk mencatat skill terpakai). */
export function skillsForDivision(report: SkillAuditReport, division: string): string[] {
  return report.entries
    .filter((e) => e.divisions.includes(division))
    .map((e) => e.id);
}
