/**
 * FAJREZZZ AI OFFICE — CREATIVE BLUEPRINT (v10)
 *
 * Setiap episode WAJIB punya blueprint kreatif sendiri, dihasilkan dari sifat
 * topiknya (kategori, emosi, kekuatan visual), bukan disalin dari episode lalu.
 *
 * Alur:
 *   kandidat topik → pilih gaya visual yang cocok → variasi terkendali
 *   (kamera, tipografi, transisi, musik, aset) → blueprint
 *   → uji kemiripan dengan 30 blueprint terakhir → kalau terlalu mirip, mutasi.
 *
 * Yang TIDAK boleh berubah (identitas brand): lihat BRAND_INVARIANTS.
 */

import {
  hashSeed,
  pickSeeded,
  seededRandom,
  type TopicCandidate,
  type TopicCategoryId,
} from "./topic-intelligence.ts";

/* ============================================================================
 * 1. IDENTITAS BRAND (tetap) vs GAYA EPISODE (boleh berubah)
 * ========================================================================== */

export interface BrandInvariants {
  wordmark: string;
  /** Warna aksen brand — selalu hadir, boleh berganti nuansa. */
  accentHex: string;
  fontFamily: string;
  safeZone: { top: number; bottom: number; left: number; right: number };
  rules: string[];
}

export const BRAND_INVARIANTS: BrandInvariants = {
  wordmark: "FAJREZZZ AI OFFICE",
  accentHex: "#ff5a1f",
  fontFamily: "Inter / system-ui (bold editorial)",
  safeZone: { top: 0.12, bottom: 0.18, left: 0.08, right: 0.08 },
  rules: [
    "Wordmark kecil selalu ada di 3 detik pertama & frame terakhir.",
    "Subtitle & headline tidak boleh keluar dari TikTok 9:16 safe zone.",
    "Warna aksen brand dipakai minimal 1 elemen per scene (bukan dominan).",
    "Tidak ada clickbait, panah merah, atau angka tanpa sumber.",
  ],
};

/* ============================================================================
 * 2. KATALOG GAYA (diperluas dari 6 preset AI-sentris menjadi lintas topik)
 * ========================================================================== */

export type VisualStyleId =
  | "cinematic_documentary"
  | "futuristic_technology"
  | "minimalist_editorial"
  | "news_explainer"
  | "science_visualization"
  | "infographic_3d"
  | "kinetic_typography"
  | "photo_documentary"
  | "motion_collage"
  | "split_screen_comparison"
  | "timeline_storytelling"
  | "map_based_story";

export interface VisualStyleSpec {
  id: VisualStyleId;
  label: string;
  /** Kategori yang paling cocok — tapi bukan pembatasan keras. */
  strongFor: TopicCategoryId[];
  paletteFamily: "warm_dark" | "cool_dark" | "paper_light" | "neon_accent" | "earthy" | "mono_contrast";
  assetMix: AssetMixId;
}

export type AssetMixId =
  | "ai_broll_diagram"
  | "illustration_timeline"
  | "photo_map"
  | "data_visualization"
  | "kinetic_type_only"
  | "diagram_infographic";

export interface AssetMixSpec {
  id: AssetMixId;
  label: string;
  parts: string[];
}

export const ASSET_MIXES: Record<AssetMixId, AssetMixSpec> = {
  ai_broll_diagram: {
    id: "ai_broll_diagram",
    label: "AI B-roll + diagram",
    parts: ["AI-generated B-roll", "diagram alur", "motion graphics"],
  },
  illustration_timeline: {
    id: "illustration_timeline",
    label: "Ilustrasi + timeline",
    parts: ["ilustrasi vektor", "timeline kronologis", "kartu teks editorial"],
  },
  photo_map: {
    id: "photo_map",
    label: "Foto dokumenter + peta",
    parts: ["foto berlisensi", "peta lokasi", "label lokasi animated"],
  },
  data_visualization: {
    id: "data_visualization",
    label: "Data visualization",
    parts: ["grafik batang/garis", "angka animasi", "sumber data di frame"],
  },
  kinetic_type_only: {
    id: "kinetic_type_only",
    label: "Kinetic typography",
    parts: ["tipografi kinetik", "kutipan pendek", "highlight angka"],
  },
  diagram_infographic: {
    id: "diagram_infographic",
    label: "Diagram + infografis 3D",
    parts: ["infografis isometrik", "ikon garis", "callout berlabel"],
  },
};

export const VISUAL_STYLES: VisualStyleSpec[] = [
  { id: "cinematic_documentary", label: "Cinematic documentary", strongFor: ["sejarah", "sosial", "alam"], paletteFamily: "warm_dark", assetMix: "photo_map" },
  { id: "futuristic_technology", label: "Futuristic technology", strongFor: ["inovasi", "teknologi_ai"], paletteFamily: "cool_dark", assetMix: "ai_broll_diagram" },
  { id: "minimalist_editorial", label: "Minimalist editorial", strongFor: ["mitos_fakta", "psikologi", "edukasi"], paletteFamily: "paper_light", assetMix: "kinetic_type_only" },
  { id: "news_explainer", label: "News explainer", strongFor: ["ekonomi", "sosial"], paletteFamily: "mono_contrast", assetMix: "data_visualization" },
  { id: "science_visualization", label: "Science visualization", strongFor: ["sains", "alam"], paletteFamily: "cool_dark", assetMix: "data_visualization" },
  { id: "infographic_3d", label: "3D infographic", strongFor: ["edukasi", "produktivitas", "ekonomi"], paletteFamily: "neon_accent", assetMix: "diagram_infographic" },
  { id: "kinetic_typography", label: "Kinetic typography", strongFor: ["mitos_fakta", "psikologi"], paletteFamily: "mono_contrast", assetMix: "kinetic_type_only" },
  { id: "photo_documentary", label: "Photo documentary", strongFor: ["sejarah", "sosial"], paletteFamily: "earthy", assetMix: "photo_map" },
  { id: "motion_collage", label: "Motion collage", strongFor: ["mitos_fakta", "produktivitas", "teknologi_ai"], paletteFamily: "warm_dark", assetMix: "illustration_timeline" },
  { id: "split_screen_comparison", label: "Split-screen comparison", strongFor: ["mitos_fakta", "edukasi", "ekonomi"], paletteFamily: "neon_accent", assetMix: "data_visualization" },
  { id: "timeline_storytelling", label: "Timeline storytelling", strongFor: ["sejarah", "sains"], paletteFamily: "warm_dark", assetMix: "illustration_timeline" },
  { id: "map_based_story", label: "Map-based storytelling", strongFor: ["alam", "sosial", "sejarah"], paletteFamily: "cool_dark", assetMix: "photo_map" },
];

export type CameraMoveId =
  | "slow_push_in"
  | "pull_out"
  | "lateral_pan"
  | "parallax_layer"
  | "tracking_subject"
  | "split_screen_drift"
  | "dynamic_crop"
  | "focus_rack";

export const CAMERA_MOVES: { id: CameraMoveId; label: string }[] = [
  { id: "slow_push_in", label: "Slow push-in" },
  { id: "pull_out", label: "Pull-out reveal" },
  { id: "lateral_pan", label: "Pan horizontal" },
  { id: "parallax_layer", label: "Parallax berlapis" },
  { id: "tracking_subject", label: "Tracking objek" },
  { id: "split_screen_drift", label: "Split-screen bergerak" },
  { id: "dynamic_crop", label: "Dynamic crop" },
  { id: "focus_rack", label: "Focus transition" },
];

export type TypographyModeId =
  | "big_headline_lower_third"
  | "centered_quote"
  | "side_stack_editorial"
  | "number_hero"
  | "word_by_word_reveal"
  | "split_label_compare";

export const TYPOGRAPHY_MODES: { id: TypographyModeId; label: string }[] = [
  { id: "big_headline_lower_third", label: "Headline besar lower-third" },
  { id: "centered_quote", label: "Kutipan tengah" },
  { id: "side_stack_editorial", label: "Tumpukan teks samping (editorial)" },
  { id: "number_hero", label: "Angka jadi bintang" },
  { id: "word_by_word_reveal", label: "Kata muncul satu-satu" },
  { id: "split_label_compare", label: "Label kiri/kanan (banding)" },
];

export type TransitionId =
  | "match_cut"
  | "whip_pan"
  | "mask_reveal"
  | "zoom_through"
  | "shape_wipe"
  | "timeline_slide"
  | "clean_cut"
  | "graphic_wipe";

export const TRANSITIONS: { id: TransitionId; label: string; intensity: 1 | 2 | 3 }[] = [
  { id: "match_cut", label: "Match cut", intensity: 1 },
  { id: "whip_pan", label: "Whip pan", intensity: 3 },
  { id: "mask_reveal", label: "Mask reveal", intensity: 2 },
  { id: "zoom_through", label: "Zoom through", intensity: 2 },
  { id: "shape_wipe", label: "Shape wipe", intensity: 2 },
  { id: "timeline_slide", label: "Timeline slide", intensity: 1 },
  { id: "clean_cut", label: "Clean cut", intensity: 1 },
  { id: "graphic_wipe", label: "Graphic wipe", intensity: 2 },
];

export type MusicMoodId =
  | "curious_ambient"
  | "documentary_warm"
  | "urgent_news"
  | "calm_explainer"
  | "tense_investigation"
  | "uplifting_progress";

export const MUSIC_MOODS: { id: MusicMoodId; label: string; bpmRange: [number, number] }[] = [
  { id: "curious_ambient", label: "Curious ambient", bpmRange: [70, 90] },
  { id: "documentary_warm", label: "Documentary warm", bpmRange: [80, 100] },
  { id: "urgent_news", label: "Urgent news", bpmRange: [110, 130] },
  { id: "calm_explainer", label: "Calm explainer", bpmRange: [75, 95] },
  { id: "tense_investigation", label: "Tense investigation", bpmRange: [90, 110] },
  { id: "uplifting_progress", label: "Uplifting progress", bpmRange: [100, 120] },
];

export type HookStyleId =
  | "pertanyaan_awam"
  | "angka_mengejutkan_bersumber"
  | "adegan_sehari_hari"
  | "pernyataan_berlawanan"
  | "mini_eksperimen"
  | "mitos_yang_dibongkar";

export const HOOK_STYLES: { id: HookStyleId; label: string }[] = [
  { id: "pertanyaan_awam", label: "Pertanyaan awam" },
  { id: "angka_mengejutkan_bersumber", label: "Angka mengejutkan (bersumber)" },
  { id: "adegan_sehari_hari", label: "Adegan sehari-hari" },
  { id: "pernyataan_berlawanan", label: "Pernyataan berlawanan" },
  { id: "mini_eksperimen", label: "Mini eksperimen" },
  { id: "mitos_yang_dibongkar", label: "Mitos yang dibongkar" },
];

export type NarrativeStructureId =
  | "hook_context_explain_example_insight_takeaway"
  | "myth_evidence_conclusion"
  | "chronological_turning_point_impact"
  | "before_after_comparison"
  | "case_problem_solution"
  | "question_answer_payoff"
  | "three_mistakes_fix"
  | "numbers_walkthrough"
  | "two_sides_recommendation";

export const NARRATIVE_STRUCTURES: { id: NarrativeStructureId; beats: ScriptBeatId[]; label: string }[] = [
  { id: "hook_context_explain_example_insight_takeaway", label: "Hook → Konteks → Penjelasan → Contoh → Insight → Takeaway", beats: ["hook", "context", "explanation", "example", "insight", "takeaway", "ending"] },
  { id: "myth_evidence_conclusion", label: "Mitos → Bukti → Kesimpulan", beats: ["hook", "context", "example", "insight", "takeaway", "ending"] },
  { id: "chronological_turning_point_impact", label: "Kronologis → Titik balik → Dampak", beats: ["hook", "context", "explanation", "insight", "example", "takeaway", "ending"] },
  { id: "before_after_comparison", label: "Sebelum vs sesudah", beats: ["hook", "context", "example", "insight", "explanation", "takeaway", "ending"] },
  { id: "case_problem_solution", label: "Kasus → Masalah → Solusi", beats: ["hook", "context", "explanation", "insight", "example", "takeaway", "ending"] },
  { id: "question_answer_payoff", label: "Pertanyaan → Jawaban → Payoff", beats: ["hook", "explanation", "example", "insight", "takeaway", "ending"] },
  { id: "three_mistakes_fix", label: "3 kesalahan → perbaikan", beats: ["hook", "context", "example", "insight", "takeaway", "ending"] },
  { id: "numbers_walkthrough", label: "Bedah angka", beats: ["hook", "context", "explanation", "example", "insight", "takeaway", "ending"] },
  { id: "two_sides_recommendation", label: "Dua sisi → rekomendasi", beats: ["hook", "context", "explanation", "insight", "example", "takeaway", "ending"] },
];

export type ScriptBeatId =
  | "hook"
  | "context"
  | "explanation"
  | "example"
  | "insight"
  | "takeaway"
  | "ending";

/* ============================================================================
 * 3. BLUEPRINT
 * ========================================================================== */

export interface ScenePlanItem {
  index: number;
  beat: ScriptBeatId;
  purpose: string;
  visual: string;
  motion: CameraMoveId;
  transitionOut: TransitionId;
  durationSec: number;
  emphasis: "none" | "keyword" | "number" | "compare";
}

export interface CreativeBlueprint {
  episodeId: string;
  topic: string;
  category: TopicCategoryId | string;
  audience: string;
  coreMessage: string;
  storyAngle: string;
  hookStyle: HookStyleId;
  narrativeStructure: NarrativeStructureId;
  visualStyle: VisualStyleId;
  paletteFamily: VisualStyleSpec["paletteFamily"];
  palette: { bg: string; fg: string; accent: string; support: string };
  typographyStyle: TypographyModeId;
  cameraLanguage: CameraMoveId[];
  transitionLanguage: TransitionId[];
  musicMood: MusicMoodId;
  soundDesign: string[];
  assetMix: AssetMixId;
  scenePlan: ScenePlanItem[];
  estimatedDurationSec: number;
  brand: BrandInvariants;
  /** sidik jari keputusan kreatif (untuk anti-template). */
  signature: string;
  generationNotes: string[];
}

const PALETTES: Record<VisualStyleSpec["paletteFamily"], CreativeBlueprint["palette"]> = {
  warm_dark: { bg: "#14100d", fg: "#f6efe7", accent: "#ff5a1f", support: "#c9895b" },
  cool_dark: { bg: "#080d16", fg: "#e8f1ff", accent: "#38bdf8", support: "#8b5cf6" },
  paper_light: { bg: "#f4f1ea", fg: "#141210", accent: "#d84315", support: "#7c6f64" },
  neon_accent: { bg: "#0a0a12", fg: "#f7f7ff", accent: "#a3ff12", support: "#7c3aed" },
  earthy: { bg: "#efe6d8", fg: "#22201c", accent: "#b45309", support: "#4d7c0f" },
  mono_contrast: { bg: "#0b0b0b", fg: "#ffffff", accent: "#ff5a1f", support: "#9ca3af" },
};

function signatureOf(bp: Omit<CreativeBlueprint, "signature" | "generationNotes" | "brand">): string {
  const parts = [
    bp.visualStyle,
    bp.typographyStyle,
    bp.hookStyle,
    bp.narrativeStructure,
    bp.musicMood,
    bp.assetMix,
    bp.paletteFamily,
    [...bp.cameraLanguage].sort().join("+"),
    [...bp.transitionLanguage].sort().join("+"),
    bp.scenePlan.map((s) => `${s.beat}:${s.motion}:${s.transitionOut}`).join("|"),
  ];
  return `bp_${hashSeed(parts.join("~")).toString(16)}`;
}

export interface BuildBlueprintOptions {
  /** Blueprint episode terakhir (untuk anti-template). */
  history?: CreativeBlueprint[];
  /** Nomor episode — memengaruhi variasi. */
  episodeIndex?: number;
  /** Maksimum percobaan mutasi sebelum menyerah (default 24). */
  maxVariationAttempts?: number;
  /** Ambang kemiripan yang dianggap "terlalu mirip". */
  similarityThreshold?: number;
}

export interface BlueprintVariationAttempt {
  attempt: number;
  signature: string;
  maxSimilarity: number;
  accepted: boolean;
}

export interface BuiltBlueprint {
  blueprint: CreativeBlueprint;
  attempts: BlueprintVariationAttempt[];
  rejectedCount: number;
}

function stylesForCategory(category: string): VisualStyleSpec[] {
  const strong = VISUAL_STYLES.filter((s) => s.strongFor.includes(category as TopicCategoryId));
  return strong.length >= 3 ? strong : VISUAL_STYLES;
}

function buildScenePlan(
  candidate: TopicCandidate,
  structure: (typeof NARRATIVE_STRUCTURES)[number],
  camera: CameraMoveId[],
  transitions: TransitionId[],
  totalSec: number,
  rand: () => number
): ScenePlanItem[] {
  const beats = structure.beats;
  // Hook & ending lebih pendek; penjelasan lebih panjang. Tidak semua episode
  // memakai pembagian yang sama → durasi per beat diberi jitter deterministik.
  const weights = beats.map((beat) => {
    const base =
      beat === "hook" ? 2 : beat === "ending" ? 2 : beat === "takeaway" ? 2 : beat === "explanation" ? 4 : 3;
    return base * (0.85 + rand() * 0.3);
  });
  const sum = weights.reduce((a, b) => a + b, 0);

  return beats.map((beat, i) => {
    const visualByBeat: Record<ScriptBeatId, string> = {
      hook: `${candidate.visualPotential >= 7 ? "b-roll pembuka nyata" : "tipografi hook penuh layar"} + wordmark`,
      context: "peta/timeline mini atau kartu konteks",
      explanation: `${ASSET_MIXES[VISUAL_STYLES[0].assetMix].label} — diagram utama`,
      example: "contoh konkret: potret/dokumentasi atau demo layar",
      insight: "callout kontras + highlight angka bersumber",
      takeaway: "ringkasan 1 baris + ikon",
      ending: "frame brand + pertanyaan diskusi",
    };
    return {
      index: i + 1,
      beat,
      purpose: `${beat}: ${structure.label.split(" → ")[i] ?? beat}`,
      visual: visualByBeat[beat],
      motion: camera[i % camera.length],
      transitionOut: transitions[i % transitions.length],
      durationSec: Math.max(1.4, Math.round((weights[i] / sum) * totalSec * 10) / 10),
      emphasis:
        beat === "insight" ? "number" : beat === "takeaway" ? "keyword" : beat === "example" ? "compare" : "none",
    };
  });
}

export function buildCreativeBlueprint(
  candidate: TopicCandidate,
  options: BuildBlueprintOptions = {}
): BuiltBlueprint {
  const history = options.history ?? [];
  const threshold = options.similarityThreshold ?? 0.55;
  const maxAttempts = Math.max(1, options.maxVariationAttempts ?? 24);
  const baseSeed = hashSeed(`${candidate.id}|${candidate.title}|${options.episodeIndex ?? 0}`);
  const styles = stylesForCategory(candidate.category);
  const attempts: BlueprintVariationAttempt[] = [];
  const notes: string[] = [];

  let accepted: CreativeBlueprint | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rand = seededRandom(baseSeed + attempt * 7919);
    const style = styles[Math.floor(rand() * styles.length) % styles.length];
    const structure = pickSeeded(NARRATIVE_STRUCTURES, rand);
    const typography = pickSeeded(TYPOGRAPHY_MODES, rand).id;
    const hookStyle = pickSeeded(HOOK_STYLES, rand).id;
    const music = pickSeeded(MUSIC_MOODS, rand).id;
    const cameraCount = 3 + (rand() > 0.5 ? 1 : 0);
    const camera: CameraMoveId[] = [];
    while (camera.length < cameraCount) {
      const move = pickSeeded(CAMERA_MOVES, rand).id;
      if (!camera.includes(move)) camera.push(move);
    }
    const transitionCount = 3 + (rand() > 0.4 ? 1 : 0);
    const transitions: TransitionId[] = [];
    while (transitions.length < transitionCount) {
      const t = pickSeeded(TRANSITIONS, rand).id;
      if (!transitions.includes(t)) transitions.push(t);
    }
    const durationSec = Math.max(22, Math.min(60, Math.round(candidate.durationFitSec / 2) * 2));
    const scenePlan = buildScenePlan(candidate, structure, camera, transitions, durationSec, rand);

    const draft: Omit<CreativeBlueprint, "signature" | "generationNotes" | "brand"> = {
      episodeId: candidate.id,
      topic: candidate.title,
      category: candidate.category,
      audience:
        candidate.category === "teknologi_ai"
          ? "Pengguna HP sehari-hari yang bukan teknisi"
          : "Masyarakat umum yang ingin paham tanpa istilah rumit",
      coreMessage: candidate.thesis,
      storyAngle: candidate.angle,
      hookStyle,
      narrativeStructure: structure.id,
      visualStyle: style.id,
      paletteFamily: style.paletteFamily,
      palette: PALETTES[style.paletteFamily],
      typographyStyle: typography,
      cameraLanguage: camera,
      transitionLanguage: transitions,
      musicMood: music,
      soundDesign:
        music === "urgent_news"
          ? ["tick transisi", "whoosh 120ms", "hit ringan di angka"]
          : ["whoosh halus per transisi", "click tipis saat kata kunci muncul", "ambience rendah"],
      assetMix: style.assetMix,
      scenePlan,
      estimatedDurationSec: Math.round(scenePlan.reduce((a, s) => a + s.durationSec, 0)),
    };

    const signature = signatureOf(draft);
    const maxSim = history.reduce((m, prev) => Math.max(m, blueprintSimilarity(draft, prev)), 0);
    const ok = maxSim < threshold;
    attempts.push({ attempt: attempt + 1, signature, maxSimilarity: Math.round(maxSim * 1000) / 1000, accepted: ok });
    if (ok) {
      accepted = { ...draft, signature, brand: BRAND_INVARIANTS, generationNotes: notes };
      break;
    }
    notes.push(`percobaan ${attempt + 1} ditolak (kemiripan ${maxSim.toFixed(2)} ≥ ${threshold})`);
  }

  if (!accepted) {
    // Jangan menggantung: pakai percobaan terakhir tapi tandai jujur bahwa
    // batas variasi tidak tercapai (dashboard akan menampilkannya).
    const rand = seededRandom(baseSeed + maxAttempts * 7919);
    const style = styles[Math.floor(rand() * styles.length) % styles.length];
    const structure = pickSeeded(NARRATIVE_STRUCTURES, rand);
    const draft: Omit<CreativeBlueprint, "signature" | "generationNotes" | "brand"> = {
      episodeId: candidate.id,
      topic: candidate.title,
      category: candidate.category,
      audience: "Masyarakat umum",
      coreMessage: candidate.thesis,
      storyAngle: candidate.angle,
      hookStyle: pickSeeded(HOOK_STYLES, rand).id,
      narrativeStructure: structure.id,
      visualStyle: style.id,
      paletteFamily: style.paletteFamily,
      palette: PALETTES[style.paletteFamily],
      typographyStyle: pickSeeded(TYPOGRAPHY_MODES, rand).id,
      cameraLanguage: CAMERA_MOVES.slice(0, 4).map((c) => c.id),
      transitionLanguage: TRANSITIONS.slice(2, 6).map((t) => t.id),
      musicMood: pickSeeded(MUSIC_MOODS, rand).id,
      soundDesign: ["whoosh halus", "ambience rendah"],
      assetMix: style.assetMix,
      scenePlan: buildScenePlan(candidate, structure, CAMERA_MOVES.slice(0, 4).map((c) => c.id), TRANSITIONS.slice(2, 6).map((t) => t.id), 30, rand),
      estimatedDurationSec: 30,
    };
    notes.push("PERINGATAN: batas percobaan variasi habis, blueprint dipakai apa adanya.");
    return {
      blueprint: { ...draft, signature: signatureOf(draft), brand: BRAND_INVARIANTS, generationNotes: notes },
      attempts,
      rejectedCount: attempts.filter((a) => !a.accepted).length,
    };
  }

  return {
    blueprint: accepted,
    attempts,
    rejectedCount: attempts.filter((a) => !a.accepted).length,
  };
}

/* ============================================================================
 * 4. KEMIRIPAN BLUEPRINT (anti-template)
 * ========================================================================== */

const FIELD_WEIGHTS = {
  visualStyle: 0.2,
  typographyStyle: 0.13,
  hookStyle: 0.12,
  narrativeStructure: 0.14,
  musicMood: 0.08,
  assetMix: 0.08,
  paletteFamily: 0.07,
  cameraLanguage: 0.09,
  transitionLanguage: 0.09,
} as const;

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size || 1;
  return inter / union;
}

export function blueprintSimilarity(
  a: Pick<
    CreativeBlueprint,
    | "visualStyle"
    | "typographyStyle"
    | "hookStyle"
    | "narrativeStructure"
    | "musicMood"
    | "assetMix"
    | "paletteFamily"
    | "cameraLanguage"
    | "transitionLanguage"
  >,
  b: typeof a
): number {
  let sim = 0;
  sim += (a.visualStyle === b.visualStyle ? 1 : 0) * FIELD_WEIGHTS.visualStyle;
  sim += (a.typographyStyle === b.typographyStyle ? 1 : 0) * FIELD_WEIGHTS.typographyStyle;
  sim += (a.hookStyle === b.hookStyle ? 1 : 0) * FIELD_WEIGHTS.hookStyle;
  sim += (a.narrativeStructure === b.narrativeStructure ? 1 : 0) * FIELD_WEIGHTS.narrativeStructure;
  sim += (a.musicMood === b.musicMood ? 1 : 0) * FIELD_WEIGHTS.musicMood;
  sim += (a.assetMix === b.assetMix ? 1 : 0) * FIELD_WEIGHTS.assetMix;
  sim += (a.paletteFamily === b.paletteFamily ? 1 : 0) * FIELD_WEIGHTS.paletteFamily;
  sim += jaccard(a.cameraLanguage, b.cameraLanguage) * FIELD_WEIGHTS.cameraLanguage;
  sim += jaccard(a.transitionLanguage, b.transitionLanguage) * FIELD_WEIGHTS.transitionLanguage;
  return Math.round(sim * 1000) / 1000;
}

export function editingSignatureOf(blueprint: CreativeBlueprint): string {
  return blueprint.signature;
}

/** Ringkasan 1 baris untuk dashboard/laporan. */
export function describeBlueprint(bp: CreativeBlueprint): string {
  const style = VISUAL_STYLES.find((s) => s.id === bp.visualStyle)?.label ?? bp.visualStyle;
  const typo = TYPOGRAPHY_MODES.find((t) => t.id === bp.typographyStyle)?.label ?? bp.typographyStyle;
  const music = MUSIC_MOODS.find((m) => m.id === bp.musicMood)?.label ?? bp.musicMood;
  const hook = HOOK_STYLES.find((h) => h.id === bp.hookStyle)?.label ?? bp.hookStyle;
  return `${style} · ${typo} · hook ${hook} · musik ${music} · ${bp.transitionLanguage.length} transisi · ${bp.estimatedDurationSec}s`;
}
