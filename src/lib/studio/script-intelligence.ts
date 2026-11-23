/**
 * FAJREZZZ AI OFFICE — SCRIPT INTELLIGENCE (v10)
 *
 * Dua bagian:
 *  1. `buildScriptSkeleton` — kerangka naskah deterministik dari fakta kandidat
 *     (dipakai saat LLM tidak tersedia; SELALU dilabeli, tidak mengaku hasil AI).
 *  2. `auditScript` — pemeriksa naskah: kalimat panjang, istilah asing tanpa
 *     penjelasan, pengulangan, klaim angka tanpa sumber, dan satu-ide-utama.
 *
 * Semua fungsi murni → bisa diuji tanpa jaringan.
 */

import type { CreativeBlueprint, ScriptBeatId } from "./creative-blueprint.ts";
import type { TopicCandidate } from "./topic-intelligence.ts";

/* ============================================================================
 * 1. KERANGKA NASKAH
 * ========================================================================== */

export interface ScriptLine {
  beat: ScriptBeatId;
  text: string;
  /** true kalau baris ini memuat klaim yang harus bisa ditelusuri. */
  claimBearing: boolean;
  sourceIndexes: number[];
}

export interface ScriptDraft {
  episodeId: string;
  topic: string;
  generator: "llm" | "deterministic-fact-skeleton";
  lines: ScriptLine[];
  narration: string;
  estimatedDurationSec: number;
  sources: string[];
  disclaimer?: string;
}

const JARGON_GLOSSARY: Record<string, string> = {
  algoritma: "aturan hitungan yang dipakai aplikasi untuk memilih apa yang kamu lihat",
  phishing: "situs atau pesan palsu yang menyamar jadi lembaga resmi",
  inflasi: "kenaikan harga barang secara umum",
  vaksin: "cairan yang melatih daya tahan tubuh",
  "kecerdasan buatan": "program komputer yang bisa mengambil keputusan sendiri",
  ai: "program komputer yang bisa mengambil keputusan sendiri",
  mikroba: "makhluk sangat kecil yang tidak terlihat mata",
  emisi: "gas buangan yang menahan panas di udara",
  "data pribadi": "informasi tentang diri kita, seperti nama, nomor HP, dan foto KTP",
  server: "komputer besar tempat data aplikasi disimpan",
};

export function explainJargon(term: string): string | null {
  return JARGON_GLOSSARY[term.toLowerCase()] ?? null;
}

/** Pecah naskah jadi kalimat pendek yang enak diucapkan. */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** ±2,6 kata per detik untuk bahasa Indonesia yang santai (dipakai estimasi durasi). */
export const WORDS_PER_SECOND = 2.6;

/** Pecah satu kalimat faktual panjang jadi kalimat-kalimat pendek tanpa mengubah fakta. */
export function shortenClaim(claim: string, maxWords = 16): string[] {
  const clean = claim.replace(/\s+/g, " ").trim();
  const base = splitSentences(clean);
  const out: string[] = [];
  for (const sentence of base) {
    if (wordCount(sentence) <= maxWords) {
      out.push(sentence);
      continue;
    }
    // potong di konektor pertama yang menghasilkan dua bagian seimbang
    const connectors = [
      ", karena ",
      " karena ",
      ", bukan karena ",
      ", bukan ",
      ", yang ",
      " yang ",
      ", sehingga ",
      " sehingga ",
      ", tetapi ",
      ", sedangkan ",
      ", dan ",
    ];
    let handled = false;
    for (const conn of connectors) {
      const idx = sentence.indexOf(conn);
      if (idx <= 0) continue;
      const head = sentence.slice(0, idx).trim();
      const tail = sentence.slice(idx + conn.length).trim();
      if (wordCount(head) >= 4 && wordCount(tail) >= 4) {
        out.push(`${head}.`);
        out.push(`${tail.charAt(0).toUpperCase()}${tail.slice(1)}`);
        handled = true;
        break;
      }
    }
    if (!handled) out.push(sentence);
  }
  return out.map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
}

/**
 * Pecah baris panjang di batas klausa (koma), BUKAN di tengah frasa.
 * Kalau tidak ada koma yang layak, baris dibiarkan utuh — audit naskah yang
 * akan menandainya, lebih baik daripada kalimat pincang.
 */
export function splitLongLine(sentence: string, maxWords = 18): string[] {
  if (wordCount(sentence) <= maxWords) return [sentence];
  // Pisah hanya pada koma yang bukan pemisah desimal ("74,68" tetap utuh).
  const parts = sentence.split(/,(?!\d)\s+/);
  if (parts.length < 2) return [sentence];
  // Frasa pembuka pendek ("Yang sering luput") menempel ke klausa berikutnya.
  let lead = "";
  if (wordCount(parts[0]) <= 4) lead = parts.shift() as string;

  const out: string[] = [];
  let buffer = "";
  for (const clause of parts) {
    const candidate = buffer ? `${buffer}, ${clause}` : lead ? `${lead}, ${clause}` : clause;
    if (wordCount(candidate) > maxWords && buffer) {
      out.push(`${buffer.replace(/[.;]$/, "")}.`);
      buffer = clause;
    } else {
      buffer = candidate;
    }
  }
  if (buffer) out.push(`${buffer.replace(/[.;]$/, "")}.`);
  return out.map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s));
}

const lowerFirst = (s: string) => {
  if (!s) return s;
  const firstWord = s.split(/\s+/)[0] ?? "";
  const isAcronym = firstWord.length > 1 && firstWord === firstWord.toUpperCase();
  const isProperNoun = /^[A-Z][a-z]+/.test(firstWord) && /^(BPS|BMKG|WHO|OJK|Kominfo|Indonesia)$/.test(firstWord);
  return isAcronym || isProperNoun ? s : s.charAt(0).toLowerCase() + s.slice(1);
};

/**
 * Rakit naskah dari fakta kandidat. Urutan beat MENGIKUTI blueprint (bisa
 * mitos→bukti→kesimpulan, kronologis, dua sisi, dst) — bukan template kaku.
 */
export function buildScriptSkeleton(
  candidate: TopicCandidate,
  blueprint: CreativeBlueprint
): ScriptDraft {
  const factSentences = candidate.keyFacts.flatMap((fact, factIdx) =>
    shortenClaim(fact.claim).map((text) => ({ text, sourceIndex: fact.sourceIndex, factIdx }))
  );
  const thesisSentences = shortenClaim(candidate.thesis);

  // Kandidat isi per beat; dipilih yang belum terpakai (anti pengulangan).
  type PoolItem = { text: string; claimBearing: boolean; sourceIndexes: number[]; base?: string };
  const pools: Record<ScriptBeatId, PoolItem[]> = {
    hook: [{ text: candidate.hook, claimBearing: false, sourceIndexes: [] }],
    context: thesisSentences.map((t) => ({ text: t, claimBearing: false, sourceIndexes: [] })),
    explanation: factSentences.slice(0, 2).map((f) => ({ text: f.text, claimBearing: true, sourceIndexes: [f.sourceIndex], base: f.text })),
    example: factSentences.slice(1, 4).map((f) => ({ text: `Contohnya, ${lowerFirst(f.text)}`, claimBearing: true, sourceIndexes: [f.sourceIndex], base: f.text })),
    insight: factSentences.slice(2, 5).map((f) => ({ text: `Yang sering luput, ${lowerFirst(f.text)}`, claimBearing: true, sourceIndexes: [f.sourceIndex], base: f.text })),
    takeaway: [{ text: `Jadi intinya, ${lowerFirst(thesisSentences[0] ?? candidate.thesis)}`, claimBearing: false, sourceIndexes: [] }],
    ending: [{ text: "Sumber lengkapnya ada di deskripsi. Simpan video ini kalau menurutmu berguna.", claimBearing: false, sourceIndexes: [] }],
  };

  // Fakta yang hanya mengulang tesis tidak dipakai sebagai "contoh"/"insight".
  const freshFacts = factSentences.filter((f) => semanticSimilarityLite(f.text, candidate.thesis) <= 0.55);
  if (freshFacts.length > 0) {
    pools.example = freshFacts.slice(0, 3).map((f) => ({
      text: `Contohnya, ${lowerFirst(f.text)}`,
      claimBearing: true,
      sourceIndexes: [f.sourceIndex],
      base: f.text,
    }));
    pools.insight = freshFacts.slice(1, 4).map((f) => ({
      text: `Yang sering luput, ${lowerFirst(f.text)}`,
      claimBearing: true,
      sourceIndexes: [f.sourceIndex],
      base: f.text,
    }));
  }

  const thesisTail = (thesisSentences[thesisSentences.length - 1] ?? candidate.thesis).replace(/[,.;]+$/, "");
  const compactThesis = thesisTail
    .split(/\s+/)
    .slice(0, 14)
    .join(" ")
    .replace(/,(?!\d)[^,]*$/, "")   // jangan berhenti di tengah klausa
    .replace(/[,.;]+$/, "");
  const takeawayText = compactThesis.split(/\s+/).length >= 4 ? compactThesis : thesisTail;
  pools.takeaway = [
    {
      text: `Jadi intinya, ${lowerFirst(takeawayText)}.`,
      claimBearing: false,
      sourceIndexes: [],
    },
  ];

  const used: string[] = [];
  const usedBases = new Set<string>();
  const isDuplicate = (text: string) =>
    used.some((prev) => semanticSimilarityLite(prev, text) > 0.72);

  const pick = (beat: ScriptBeatId) => {
    const pool = pools[beat] ?? [];
    for (const option of pool) {
      if (option.base && usedBases.has(option.base)) continue;
      if (!isDuplicate(option.text)) {
        if (option.base) usedBases.add(option.base);
        return option;
      }
    }
    return pool.find((o) => !o.base || !usedBases.has(o.base)) ?? null;
  };

  const lines: ScriptLine[] = [];
  const beatsInOrder = blueprint.scenePlan.map((scene) => scene.beat);
  for (const beat of beatsInOrder) {
    const chosen = pick(beat);
    if (!chosen) continue;
    if (isDuplicate(chosen.text)) continue;
    used.push(chosen.text);
    for (const piece of splitLongLine(chosen.text)) {
      lines.push({
        beat,
        text: /[.!?]$/.test(piece) ? piece : `${piece}.`,
        claimBearing: chosen.claimBearing,
        sourceIndexes: chosen.sourceIndexes,
      });
    }
  }

  const narration = lines.map((l) => l.text).join(" ");
  const estimatedDurationSec = Math.round((wordCount(narration) / WORDS_PER_SECOND) * 10) / 10;

  return {
    episodeId: candidate.id,
    topic: candidate.title,
    generator: "deterministic-fact-skeleton",
    lines,
    narration,
    estimatedDurationSec,
    sources: candidate.sources.map((s) => s.url),
    disclaimer:
      "Naskah ini dirakit otomatis dari fakta + sumber kandidat (bukan hasil LLM). " +
      `Struktur cerita: ${blueprint.narrativeStructure}. Wajib ditinjau manusia sebelum publikasi.`,
  };
}

/** Kemiripan kata sederhana (Jaccard) — cukup untuk mencegah baris kembar. */
function semanticSimilarityLite(a: string, b: string): number {
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/* ============================================================================
 * 2. AUDIT NASKAH
 * ========================================================================== */

export type ScriptFindingSeverity = "blocker" | "warning" | "info";

export interface ScriptFinding {
  code:
    | "LONG_SENTENCE"
    | "JARGON_UNEXPLAINED"
    | "REPEATED_PHRASE"
    | "UNSOURCED_NUMBER"
    | "CLICHE"
    | "MULTIPLE_MAIN_IDEAS"
    | "HOOK_TOO_LONG"
    | "DUPLICATE_INFO";
  severity: ScriptFindingSeverity;
  message: string;
  excerpt: string;
}

export interface ScriptAuditReport {
  score: number;
  sentenceCount: number;
  avgSentenceWords: number;
  longestSentenceWords: number;
  jargon: string[];
  repeatedPhrases: string[];
  unsourcedNumbers: string[];
  mainIdeaCount: number;
  findings: ScriptFinding[];
  passes: boolean;
}

const CLICHES = [
  "di era digital saat ini",
  "di zaman yang serba modern ini",
  "tentunya kita semua tahu",
  "tak dapat dipungkiri",
  "seperti yang kita ketahui bersama",
  "inilah dia jawabannya",
];

/** Istilah yang dianggap teknis bila muncul tanpa penjelasan di dekatnya. */
export const TECHNICAL_TERMS = Object.keys(JARGON_GLOSSARY);

export interface AuditOptions {
  /** Sumber yang tersedia (URL). Kosong → klaim angka otomatis dianggap belum bersumber. */
  sources?: string[];
  /** Maksimum kata per kalimat (default 18 untuk bahasa Indonesia lisan). */
  maxSentenceWords?: number;
}

export function auditScript(narration: string, options: AuditOptions = {}): ScriptAuditReport {
  const maxSentenceWords = options.maxSentenceWords ?? 18;
  const sentences = splitSentences(narration);
  const findings: ScriptFinding[] = [];
  const lower = narration.toLowerCase();

  const lengths = sentences.map((s) => wordCount(s));
  const avgSentenceWords = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const longestSentenceWords = lengths.length ? Math.max(...lengths) : 0;

  sentences.forEach((sentence) => {
    const n = wordCount(sentence);
    if (n > maxSentenceWords) {
      findings.push({
        code: "LONG_SENTENCE",
        severity: n > maxSentenceWords * 1.6 ? "blocker" : "warning",
        message: `Kalimat ${n} kata (batas ${maxSentenceWords}). Pecah jadi dua kalimat pendek.`,
        excerpt: sentence.slice(0, 90),
      });
    }
  });

  // Istilah teknis yang tidak dijelaskan sesudahnya.
  const jargon: string[] = [];
  for (const term of TECHNICAL_TERMS) {
    const match = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).exec(lower);
    if (!match) continue;
    const idx = match.index;
    const after = lower.slice(idx + term.length, idx + term.length + 90);
    const explained =
      /itu|artinya|maksudnya|yakni|yaitu|adalah|sama dengan|disebut|maksud saya/.test(after) ||
      after.includes(term);
    jargon.push(term);
    if (!explained) {
      findings.push({
        code: "JARGON_UNEXPLAINED",
        severity: "warning",
        message: `Istilah "${term}" muncul tanpa penjelasan sederhana.`,
        excerpt: narration.slice(idx, idx + 80),
      });
    }
  }

  // Frasa berulang (3-gram muncul ≥2×).
  const words = narration.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const trigrams = new Map<string, number>();
  for (let i = 0; i < words.length - 2; i += 1) {
    const key = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigrams.set(key, (trigrams.get(key) ?? 0) + 1);
  }
  const repeatedPhrases = [...trigrams.entries()].filter(([, n]) => n >= 2).map(([k]) => k);
  if (repeatedPhrases.length > 0) {
    findings.push({
      code: "REPEATED_PHRASE",
      severity: "warning",
      message: `${repeatedPhrases.length} frasa 3 kata diulang. Ringkas supaya tidak membosankan.`,
      excerpt: repeatedPhrases.slice(0, 3).join(" | "),
    });
  }

  // Klaim angka tanpa sumber.
  const numberClaims = narration.match(/\b\d+([.,]\d+)?\s?(%|persen|juta|miliar|ribu|tahun|kali|orang|detik|menit)\b/gi) ?? [];
  const hasSources = (options.sources ?? []).length > 0;
  const unsourcedNumbers = hasSources ? [] : numberClaims;
  if (unsourcedNumbers.length > 0) {
    findings.push({
      code: "UNSOURCED_NUMBER",
      severity: "blocker",
      message: `${unsourcedNumbers.length} angka/fakta numerik tanpa sumber. Tempel URL sumber di metadata.`,
      excerpt: unsourcedNumbers.slice(0, 3).join(", "),
    });
  }

  for (const cliche of CLICHES) {
    if (lower.includes(cliche)) {
      findings.push({
        code: "CLICHE",
        severity: "warning",
        message: `Frasa klise: "${cliche}". Ganti dengan kalimat konkret.`,
        excerpt: cliche,
      });
    }
  }

  // Deteksi lebih dari satu ide utama: hitung klaim besar (kalimat berisi "adalah/merupakan").
  const mainIdeaCount = sentences.filter((s) => /\b(adalah|merupakan|intinya|sebab utama)\b/i.test(s)).length;

  const hookWords = lengths[0] ?? 0;
  if (hookWords > 14) {
    findings.push({
      code: "HOOK_TOO_LONG",
      severity: "warning",
      message: `Hook ${hookWords} kata — target ≤ 14 kata (1–3 detik pertama).`,
      excerpt: sentences[0]?.slice(0, 80) ?? "",
    });
  }

  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - blockers * 18 - warnings * 6));

  return {
    score,
    sentenceCount: sentences.length,
    avgSentenceWords: Math.round(avgSentenceWords * 10) / 10,
    longestSentenceWords,
    jargon: [...new Set(jargon)],
    repeatedPhrases,
    unsourcedNumbers,
    mainIdeaCount,
    findings,
    passes: blockers === 0 && score >= 70,
  };
}

/** Perbaikan mekanis yang aman (tanpa mengubah fakta). */
export function applyMechanicalFixes(narration: string): { text: string; changes: string[] } {
  const changes: string[] = [];
  let text = narration;

  for (const cliche of CLICHES) {
    const re = new RegExp(cliche, "gi");
    if (re.test(text)) {
      text = text.replace(re, "");
      changes.push(`hapus frasa klise "${cliche}"`);
    }
  }
  text = text.replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();

  // Pecah kalimat > 26 kata pada koma terdekat.
  const sentences = splitSentences(text);
  const rebuilt = sentences.map((sentence) => {
    if (wordCount(sentence) <= 26) return sentence;
    const parts = sentence.split(/,\s*/);
    const out: string[] = [];
    let buffer: string[] = [];
    for (const part of parts) {
      buffer.push(part);
      if (wordCount(buffer.join(", ")) >= 14) {
        out.push(buffer.join(", "));
        buffer = [];
      }
    }
    if (buffer.length) out.push(buffer.join(", "));
    changes.push(`pecah kalimat panjang (${wordCount(sentence)} kata)`);
    return `${out.join(". ")}.`;
  });

  return { text: rebuilt.join(" "), changes };
}
