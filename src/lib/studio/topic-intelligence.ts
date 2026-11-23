/**
 * FAJREZZZ AI OFFICE — TOPIC INTELLIGENCE (v10)
 *
 * Menggantikan pemilihan topik "acak dari daftar statis" dengan pipeline nyata:
 *   kandidat → skor 0–100 (9 dimensi) → uji kemiripan semantik dengan 30 episode
 *   terakhir → keputusan (pilih / tolak dengan alasan / minta riset ulang).
 *
 * Sengaja TANPA dependensi (tanpa `@/` alias, tanpa library) supaya bisa diuji
 * langsung dengan `node --experimental-strip-types` dan dipakai di server.
 *
 * Prinsip integritas:
 *  - Kategori BUKAN pembatasan permanen: kandidat kategori baru tetap dinilai.
 *  - Tidak ada topik yang lolos tanpa minimal satu sumber HTTPS bertanggal.
 *  - Tidak ada klaim "sedang viral" — hanya skor kepentingan & kebaruan yang
 *    bisa dipertanggungjawabkan dari data kandidat.
 *  - Kalau semua kandidat ditolak: `needsFreshResearch = true` (jangan mengarang).
 */

/* ============================================================================
 * 1. KATEGORI TOPIK
 * ========================================================================== */

export type TopicCategoryId =
  | "teknologi_ai"
  | "sains"
  | "sejarah"
  | "alam"
  | "edukasi"
  | "keamanan_digital"
  | "psikologi"
  | "inovasi"
  | "ekonomi"
  | "sosial"
  | "produktivitas"
  | "mitos_fakta";

export interface TopicCategory {
  id: TopicCategoryId;
  label: string;
  /** Kata kunci pemicu saat menyusun kandidat / mengklasifikasi topik bebas. */
  keywords: RegExp;
  defaultAudience: string;
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: "teknologi_ai",
    label: "Teknologi & AI dalam kehidupan sehari-hari",
    keywords: /\b(ai|kecerdasan buatan|aplikasi|hp|smartphone|internet|algoritma|robot|chip|komputer)\b/i,
    defaultAudience: "Pengguna HP sehari-hari yang bukan teknisi",
  },
  {
    id: "sains",
    label: "Fakta sains & penemuan baru",
    keywords: /\b(sains|penelitian|riset|fisika|biologi|kimia|luar angkasa|nasa|dna|vaksin)\b/i,
    defaultAudience: "Pelajar & orang tua yang penasaran",
  },
  {
    id: "sejarah",
    label: "Sejarah & peristiwa penting",
    keywords: /\b(sejarah|perang|kerajaan|zaman|abad|penemuan lama|arsip|merdeka|kolonial)\b/i,
    defaultAudience: "Peminat cerita & konteks masa lalu",
  },
  {
    id: "alam",
    label: "Fenomena alam & lingkungan",
    keywords: /\b(cuaca|iklim|gempa|gunung|banjir|hujan|sampah|polusi|laut|hutan|satwa)\b/i,
    defaultAudience: "Masyarakat umum yang terdampak langsung",
  },
  {
    id: "edukasi",
    label: "Edukasi & pengetahuan umum",
    keywords: /\b(cara|belajar|penjelasan|arti|mengapa|kenapa|definisi|panduan|matematika|bahasa)\b/i,
    defaultAudience: "Orang yang ingin paham tanpa istilah rumit",
  },
  {
    id: "keamanan_digital",
    label: "Keamanan digital & penipuan online",
    keywords: /\b(penipuan|scam|phishing|otp|pin|hack|akun|password|data pribadi|judi online|pinjol)\b/i,
    defaultAudience: "Pengguna WhatsApp & mobile banking",
  },
  {
    id: "psikologi",
    label: "Psikologi & kebiasaan manusia",
    keywords: /\b(psikologi|kebiasaan|kebiasaan|fokus|stres|tidur|motivasi|bias|emosi|burnout)\b/i,
    defaultAudience: "Pekerja & pelajar yang ingin berubah",
  },
  {
    id: "inovasi",
    label: "Inovasi & masa depan teknologi",
    keywords: /\b(inovasi|energi|baterai|listrik|kendaraan|panel surya|nuklir|riset baru|prototipe)\b/i,
    defaultAudience: "Pembaca berita teknologi",
  },
  {
    id: "ekonomi",
    label: "Ekonomi sehari-hari & literasi keuangan",
    keywords: /\b(harga|inflasi|uang|gaji|pajak|tabungan|investasi|utang|cicilan|rupiah|subsidi)\b/i,
    defaultAudience: "Rumah tangga dengan anggaran terbatas",
  },
  {
    id: "sosial",
    label: "Isu sosial & perkembangan dunia",
    keywords: /\b(sosial|pendidikan|kesehatan|tenaga kerja|migrasi|hukum|kebijakan|warga|desa|kota)\b/i,
    defaultAudience: "Warga yang mengikuti isu publik",
  },
  {
    id: "produktivitas",
    label: "Tips produktivitas & keterampilan",
    keywords: /\b(produktif|kerja|waktu|prioritas|catatan|skill|keterampilan|rapi|efisien|manajemen)\b/i,
    defaultAudience: "Pekerja kantor & freelancer",
  },
  {
    id: "mitos_fakta",
    label: "Mitos versus fakta",
    keywords: /\b(mitos|fakta|hoaks|hoax|benar atau salah|ternyata|katanya|buktinya)\b/i,
    defaultAudience: "Orang yang sering menerima pesan berantai",
  },
];

export function detectCategory(text: string): TopicCategoryId | null {
  let best: { id: TopicCategoryId; hits: number } | null = null;
  for (const cat of TOPIC_CATEGORIES) {
    const hits = (text.match(new RegExp(cat.keywords.source, "gi")) ?? []).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { id: cat.id, hits };
  }
  return best?.id ?? null;
}

export function categoryLabel(id: TopicCategoryId): string {
  return TOPIC_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/* ============================================================================
 * 2. MODEL KANDIDAT & RIWAYAT
 * ========================================================================== */

export type SourceKind = "official" | "journal" | "news" | "dataset" | "community";

export interface TopicSource {
  name: string;
  url: string;
  /** ISO date (YYYY-MM-DD). Wajib: sumber tanpa tanggal tidak dihitung. */
  publishedAt: string;
  kind: SourceKind;
}

export interface TopicCandidate {
  id: string;
  category: TopicCategoryId;
  title: string;
  /** Sudut pembahasan — bagian yang paling sering diulang tanpa sadar. */
  angle: string;
  hook: string;
  /** Satu ide utama episode. */
  thesis: string;
  /** Klaim faktual + indeks sumber pendukungnya. */
  keyFacts: { claim: string; sourceIndex: number }[];
  sources: TopicSource[];
  /** 0–10: seberapa penting bagi penonton umum. */
  audienceImportance: number;
  /** 0–10: seberapa mudah dipahami tanpa istilah teknis. */
  clarity: number;
  /** 0–10: rasa ingin tahu yang wajar (bukan clickbait). */
  curiosity: number;
  /** 0–10: nilai edukasi. */
  educationalValue: number;
  /** 0–10: potensi divisualisasikan (diagram, peta, timeline, demo). */
  visualPotential: number;
  /** 0–10: makin tinggi makin sulit dijelaskan dalam 30–60 detik. */
  difficulty: number;
  /** Perkiraan durasi yang pas untuk topik ini. */
  durationFitSec: number;
  /** Bagian yang benar-benar BARU dibanding episode lama (kalau terkait). */
  noveltyNotes: string;
  tags?: string[];
}

export interface TopicHistoryRecord {
  episodeId: string;
  episodeNumber: number;
  producedAt: string;
  title: string;
  mainTopic: string;
  category: TopicCategoryId | string;
  angle: string;
  hook: string;
  summary: string;
  sources: string[];
  storyFormat: string;
  visualStyle: string;
  status: "draft" | "scripted" | "rendered" | "published" | "failed";
  /** Tanda tangan keputusan editing (lihat creative-blueprint.ts). */
  editingSignature?: string;
  blueprintSignature?: string;
  scoreTotal?: number;
}

export const HISTORY_COMPARISON_WINDOW = 30;

/* ============================================================================
 * 3. KEMIRIPAN SEMANTIK (deterministik, tanpa API)
 * ========================================================================== */

const STOPWORDS = new Set(
  (
    "yang dan di ke dari untuk pada dengan ini itu adalah akan bisa tidak juga dalam " +
    "atau karena sudah masih saja para lebih saat tentang bagi oleh sebagai kita kamu " +
    "kami mereka saya anda nya lah kah pun sih dong the a an of to in on for with and or " +
    "is are was were be been how why what when who"
  ).split(/\s+/)
);

const SYNONYMS: Record<string, string> = {
  hp: "ponsel",
  ponsel: "ponsel",
  smartphone: "ponsel",
  telepon: "ponsel",
  ai: "kecerdasanbuatan",
  "kecerdasan-buatan": "kecerdasanbuatan",
  penipuan: "scam",
  tipu: "scam",
  scam: "scam",
  phishing: "scam",
  hoaks: "hoax",
  hoax: "hoax",
  uang: "duit",
  duit: "duit",
  gaji: "duit",
  iklim: "iklim",
  cuaca: "iklim",
  koding: "coding",
  kode: "coding",
  coding: "coding",
};

export function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function unigrams(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => SYNONYMS[w] ?? w);
}

/** Token = unigram + bigram (bigram dipakai terpisah agar tidak menggelembungkan panjang vektor). */
export function tokenize(text: string): string[] {
  const words = unigrams(text);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i += 1) bigrams.push(`${words[i]}_${words[i + 1]}`);
  return [...words, ...bigrams];
}

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return (2 * inter) / (a.size + b.size);
}

function bigramSet(text: string): Set<string> {
  const words = unigrams(text);
  const out = new Set<string>();
  for (let i = 0; i < words.length - 1; i += 1) out.add(`${words[i]}_${words[i + 1]}`);
  return out;
}

function charTrigrams(text: string): Set<string> {
  const clean = normalizeText(text).replace(/\s+/g, " ").replace(/ /g, "_");
  const out = new Set<string>();
  for (let i = 0; i < clean.length - 2; i += 1) out.add(clean.slice(i, i + 3));
  return out;
}

/**
 * Kemiripan semantik deterministik 0..1 tanpa API.
 *
 * Komposisi: Dice unigram (bobot utama, tahan parafrase) + Dice bigram
 * (menangkap frasa) + Jaccard trigram karakter (tahan salah ketik/imbuhan).
 * Versi sebelumnya memakai cosine TF-IDF dua dokumen sehingga kata bersama
 * justru berbobot rendah — parafrase judul bisa lolos. Ini memperbaikinya.
 */
export function semanticSimilarity(a: string, b: string): number {
  const uniA = new Set(unigrams(a));
  const uniB = new Set(unigrams(b));
  const uni = dice(uniA, uniB);
  if (uniA.size === 0 || uniB.size === 0) return 0;

  const bg = dice(bigramSet(a), bigramSet(b));
  const cg = dice(charTrigrams(a), charTrigrams(b));

  const score = 0.7 * uni + 0.15 * bg + 0.15 * cg;
  return Math.min(1, Math.round(score * 1000) / 1000);
}

/* ============================================================================
 * 4. SKOR 0–100
 * ========================================================================== */

export interface TopicScoreBreakdown {
  audienceImportance: number;
  relevanceFreshness: number;
  clarity: number;
  curiosity: number;
  educationalValue: number;
  sourceQuality: number;
  visualPotential: number;
  originality: number;
  formatFit: number;
  repetitionPenalty: number;
  total: number;
}

export const SCORE_WEIGHTS = {
  audienceImportance: 15,
  relevanceFreshness: 15,
  clarity: 10,
  curiosity: 12,
  educationalValue: 12,
  sourceQuality: 12,
  visualPotential: 8,
  originality: 10,
  formatFit: 6,
} as const;

export const MIN_TOPIC_SCORE = 58;
/** Ambang kemiripan yang dianggap "topik yang sama". */
export const DUPLICATE_THRESHOLD = 0.62;
/** Ambang kemiripan sudut pembahasan. */
export const SAME_ANGLE_THRESHOLD = 0.8;

export interface SimilarEpisodeHit {
  record: TopicHistoryRecord;
  similarity: number;
  angleSimilarity: number;
  sameCategory: boolean;
}

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}

function daysBetween(aIso: string, bMs: number): number {
  const t = Date.parse(aIso);
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((bMs - t) / 86_400_000));
}

export function isValidSource(source: TopicSource): boolean {
  if (!source || typeof source.url !== "string") return false;
  if (!/^https:\/\/[^\s]+\.[a-z]{2,}/i.test(source.url)) return false;
  return Number.isFinite(Date.parse(source.publishedAt));
}

export function sourceQualityScore(candidate: TopicCandidate, nowMs = Date.now()): number {
  const valid = candidate.sources.filter(isValidSource);
  if (valid.length === 0) return 0;
  const weights: Record<SourceKind, number> = {
    official: 1,
    journal: 1,
    dataset: 0.95,
    news: 0.8,
    community: 0.55,
  };
  let best = 0;
  for (const s of valid) {
    const ageDays = daysBetween(s.publishedAt, nowMs);
    const freshness = ageDays <= 30 ? 1 : ageDays <= 180 ? 0.85 : ageDays <= 365 ? 0.65 : 0.4;
    const reliability = weights[s.kind] ?? 0.5;
    best = Math.max(best, reliability * 0.7 + freshness * 0.3);
  }
  // dua sumber mandiri atau lebih sedikit menaikkan keyakinan
  const corroboration = Math.min(0.15, (valid.length - 1) * 0.075);
  return clamp((best + corroboration) * 10);
}

export function findSimilarEpisodes(
  candidate: TopicCandidate,
  history: TopicHistoryRecord[],
  window = HISTORY_COMPARISON_WINDOW
): SimilarEpisodeHit[] {
  const recent = [...history]
    .sort((a, b) => Date.parse(b.producedAt) - Date.parse(a.producedAt))
    .slice(0, window);

  const haystack = `${candidate.title} ${candidate.angle} ${candidate.thesis} ${candidate.keyFacts
    .map((f) => f.claim)
    .join(" ")}`;

  return recent
    .map((record) => {
      const recordText = `${record.title} ${record.mainTopic} ${record.summary}`;
      const topicSimilarity = semanticSimilarity(haystack, recordText);
      // Sudut & hook dinilai terpisah: sudut identik tidak boleh "diencerkan"
      // oleh hook yang kebetulan beda.
      const angleSimilarity = Math.max(
        semanticSimilarity(candidate.angle, record.angle),
        0.7 * semanticSimilarity(candidate.angle, record.angle) +
          0.3 * semanticSimilarity(candidate.hook, record.hook)
      );
      const similarity = Math.min(1, 0.75 * topicSimilarity + 0.25 * angleSimilarity);
      return {
        record,
        similarity: Math.round(similarity * 1000) / 1000,
        angleSimilarity: Math.round(angleSimilarity * 1000) / 1000,
        sameCategory: record.category === candidate.category,
      };
    })
    .filter((hit) => hit.similarity > 0.2 || hit.angleSimilarity > 0.25)
    .sort((a, b) => Math.max(b.similarity, b.angleSimilarity) - Math.max(a.similarity, a.angleSimilarity));
}

export function scoreTopicCandidate(
  candidate: TopicCandidate,
  history: TopicHistoryRecord[] = [],
  nowMs = Date.now()
): TopicScoreBreakdown {
  const hits = findSimilarEpisodes(candidate, history);
  const maxSimilarity = hits.length ? hits[0].similarity : 0;
  const maxAngleSimilarity = hits.reduce((m, h) => Math.max(m, h.angleSimilarity), 0);

  // Originality: turun drastis kalau mirip episode lama.
  const originality = clamp(10 * (1 - Math.max(maxSimilarity, maxAngleSimilarity * 0.9)));

  // Kebaruan informasi: sumber terbaru + catatan novelty eksplisit.
  const freshestAgeDays = candidate.sources
    .filter(isValidSource)
    .reduce((min, s) => Math.min(min, daysBetween(s.publishedAt, nowMs)), Number.POSITIVE_INFINITY);
  const freshnessBase = !Number.isFinite(freshestAgeDays)
    ? 0
    : freshestAgeDays <= 7
      ? 10
      : freshestAgeDays <= 30
        ? 9
        : freshestAgeDays <= 180
          ? 7
          : freshestAgeDays <= 365
            ? 5
            : 3;
  const noveltyBonus = candidate.noveltyNotes.trim().length >= 20 ? 0 : -2;
  const relevanceFreshness = clamp(freshnessBase + noveltyBonus);

  // Format fit: video pendek 20–60 detik, satu ide, tidak terlalu berat.
  const durationFit = candidate.durationFitSec >= 20 && candidate.durationFitSec <= 62 ? 10 : 5;
  const formatFit = clamp(
    durationFit * 0.5 +
      (10 - candidate.difficulty) * 0.3 +
      (candidate.keyFacts.length >= 2 && candidate.keyFacts.length <= 5 ? 10 : 6) * 0.2
  );

  // Penalti repetisi: sengaja besar, karena ini masalah utamanya.
  let repetitionPenalty = 0;
  if (maxSimilarity >= DUPLICATE_THRESHOLD) repetitionPenalty += 30;
  else if (maxSimilarity >= 0.5) repetitionPenalty += 14;
  else if (maxSimilarity >= 0.4) repetitionPenalty += 7;
  if (maxAngleSimilarity >= SAME_ANGLE_THRESHOLD) repetitionPenalty += 18;

  const dims = {
    audienceImportance: clamp(candidate.audienceImportance),
    relevanceFreshness,
    clarity: clamp(candidate.clarity),
    curiosity: clamp(candidate.curiosity),
    educationalValue: clamp(candidate.educationalValue),
    sourceQuality: sourceQualityScore(candidate, nowMs),
    visualPotential: clamp(candidate.visualPotential),
    originality,
    formatFit,
  };

  const weighted = (Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).reduce(
    (sum, key) => sum + (dims[key] / 10) * SCORE_WEIGHTS[key],
    0
  );

  const total = Math.max(0, Math.min(100, Math.round(weighted - repetitionPenalty)));
  return { ...dims, repetitionPenalty, total };
}

/* ============================================================================
 * 5. SELEKSI
 * ========================================================================== */

export interface RejectedCandidate {
  id: string;
  title: string;
  score: number;
  reasons: string[];
}

export interface TopicSelectionResult {
  chosen: TopicCandidate | null;
  score: TopicScoreBreakdown | null;
  ranked: { id: string; title: string; category: TopicCategoryId; score: number }[];
  rejected: RejectedCandidate[];
  /** true = tidak ada kandidat yang layak; agent WAJIB riset ulang (jangan mengarang). */
  needsFreshResearch: boolean;
  notes: string[];
  comparedEpisodes: number;
  categoryCoverage: TopicCategoryId[];
}

export interface TopicSelectionOptions {
  history?: TopicHistoryRecord[];
  minScore?: number;
  /** Waktu acuan skor (untuk tes deterministik). Default Date.now(). */
  nowMs?: number;
  /** Kategori yang sudah terlalu sering muncul — hanya untuk peringatan, bukan larangan. */
  categoryWarnThreshold?: number;
}

export function selectBestTopic(
  candidates: TopicCandidate[],
  options: TopicSelectionOptions = {}
): TopicSelectionResult {
  const history = options.history ?? [];
  const minScore = options.minScore ?? MIN_TOPIC_SCORE;
  const recent = [...history]
    .sort((a, b) => Date.parse(b.producedAt) - Date.parse(a.producedAt))
    .slice(0, HISTORY_COMPARISON_WINDOW);

  const categoryCounts = new Map<string, number>();
  for (const r of recent) categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  const warnThreshold = options.categoryWarnThreshold ?? Math.max(3, Math.ceil(recent.length / 3));

  const rejected: RejectedCandidate[] = [];
  const ranked: TopicSelectionResult["ranked"] = [];
  const notes: string[] = [];
  let best: { candidate: TopicCandidate; score: TopicScoreBreakdown } | null = null;

  for (const candidate of candidates) {
    const reasons: string[] = [];
    const validSources = candidate.sources.filter(isValidSource);
    if (validSources.length === 0) reasons.push("tidak ada sumber HTTPS bertanggal");
    if (!candidate.thesis.trim()) reasons.push("tidak punya satu ide utama (thesis)");
    if (candidate.keyFacts.some((f) => f.sourceIndex < 0 || f.sourceIndex >= candidate.sources.length)) {
      reasons.push("ada klaim tanpa sumber yang valid");
    }

    const hits = findSimilarEpisodes(candidate, history);
    const maxSim = hits[0]?.similarity ?? 0;
    const maxAngle = hits.reduce((m, h) => Math.max(m, h.angleSimilarity), 0);
    if (maxSim >= DUPLICATE_THRESHOLD) {
      reasons.push(
        `terlalu mirip episode #${hits[0].record.episodeNumber} "${hits[0].record.title}" (kemiripan ${maxSim.toFixed(2)})`
      );
    }
    if (maxAngle >= SAME_ANGLE_THRESHOLD) {
      reasons.push(`sudut pembahasan sama dengan episode lama (${maxAngle.toFixed(2)})`);
    }
    const catCount = categoryCounts.get(candidate.category) ?? 0;
    const diversityNote =
      catCount >= warnThreshold
        ? `kategori ${categoryLabel(candidate.category)} sudah ${catCount}× dalam ${recent.length} episode terakhir`
        : null;

    const score = scoreTopicCandidate(candidate, history, options.nowMs ?? Date.now());
    ranked.push({
      id: candidate.id,
      title: candidate.title,
      category: candidate.category,
      score: score.total,
    });

    if (score.total < minScore) reasons.push(`skor ${score.total} di bawah ambang ${minScore}`);

    if (reasons.length > 0) {
      rejected.push({ id: candidate.id, title: candidate.title, score: score.total, reasons });
      continue;
    }

    if (!best || score.total > best.score.total) best = { candidate, score };
    if (diversityNote) notes.push(diversityNote);
  }

  ranked.sort((a, b) => b.score - a.score);
  const categoryCoverage = [...new Set(recent.map((r) => r.category as TopicCategoryId))];

  return {
    chosen: best?.candidate ?? null,
    score: best?.score ?? null,
    ranked,
    rejected,
    needsFreshResearch: best === null,
    notes:
      best === null
        ? [
            `Tidak ada kandidat yang layak dari ${candidates.length} kandidat. Agent wajib melakukan riset topik baru — dilarang mengarang fakta.`,
            ...notes,
          ]
        : notes,
    comparedEpisodes: recent.length,
    categoryCoverage,
  };
}

/* ============================================================================
 * 6. UTIL
 * ========================================================================== */

/** Hash deterministik (FNV-1a 32-bit) untuk seed kreatif. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** RNG deterministik (mulberry32) — seed sama = urutan sama. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickSeeded<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length];
}
