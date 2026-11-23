/**
 * VARIASI VISUAL PER EPISODE (v9.2)
 *
 * Keluhan Bos: "hasil video selalu itu-itu aja, gua mau tiap video hasilnya beda".
 * Dulu semua episode memakai urutan yang sama: kertas krem → panel 0..3 → slab hitam.
 *
 * Sekarang setiap episode punya "sidik jari" visual yang deterministik:
 * judul + nomor episode → hash → kombinasi tone kertas, aksen warna, mode layout,
 * gaya tipografi, dan gaya transisi. Episode berbeda = look berbeda,
 * tapi episode yang sama selalu identik saat di-render ulang (bisa di-QC).
 */

export type PaperToneId = "cream" | "newsprint" | "bone" | "charcoal";
export type AccentSetId = "vermilion" | "electric" | "acid" | "sunset";
export type LayoutModeId =
  | "band_swap"
  | "full_bleed_art"
  | "stacked_cards"
  | "text_only";
export type TypographyModeId = "slab" | "outline" | "highlight";
export type TransitionModeId = "speedlines" | "flash" | "slice" | "page_wipe";

export interface PaperTone {
  id: PaperToneId;
  base: string;
  deep: string;
  ink: string;
  muted: string;
  /** true = latar gelap, teks jadi putih */
  isDark: boolean;
}

export const PAPER_TONES: Record<PaperToneId, PaperTone> = {
  cream: {
    id: "cream",
    base: "#F1EBE0",
    deep: "#E3D9C8",
    ink: "#0A0A0B",
    muted: "#7A6F5F",
    isDark: false,
  },
  newsprint: {
    id: "newsprint",
    base: "#EDEDE6",
    deep: "#DCDCD2",
    ink: "#12130F",
    muted: "#6B6C63",
    isDark: false,
  },
  bone: {
    id: "bone",
    base: "#F6F1E7",
    deep: "#EFE6D6",
    ink: "#141210",
    muted: "#8A7F6E",
    isDark: false,
  },
  charcoal: {
    id: "charcoal",
    base: "#141416",
    deep: "#0A0A0B",
    ink: "#F6F1E7",
    muted: "#9A958C",
    isDark: true,
  },
};

export interface AccentSet {
  id: AccentSetId;
  primary: string;
  secondary: string;
  tertiary: string;
  inkOnAccent: string;
}

export const ACCENT_SETS: Record<AccentSetId, AccentSet> = {
  vermilion: {
    id: "vermilion",
    primary: "#E23A2E",
    secondary: "#F5A623",
    tertiary: "#2D6BFF",
    inkOnAccent: "#0A0A0B",
  },
  electric: {
    id: "electric",
    primary: "#2D6BFF",
    secondary: "#E23A2E",
    tertiary: "#22C55E",
    inkOnAccent: "#F7F7F5",
  },
  acid: {
    id: "acid",
    primary: "#C8F031",
    secondary: "#0A0A0B",
    tertiary: "#22C55E",
    inkOnAccent: "#0A0A0B",
  },
  sunset: {
    id: "sunset",
    primary: "#F5A623",
    secondary: "#E23A2E",
    tertiary: "#7C3AED",
    inkOnAccent: "#0A0A0B",
  },
};

export interface VisualVariation {
  seed: number;
  paper: PaperTone;
  accent: AccentSet;
  layoutMode: LayoutModeId;
  typography: TypographyModeId;
  transition: TransitionModeId;
  /** rotasi dasar kartu (derajat) */
  cardRotation: number;
  /** offset urutan panel kolase supaya tidak selalu mulai dari panel 0 */
  panelOffset: number;
  /** scene mana yang tampil dominan (0 = tidak ada scene hitam) */
  darkSceneEvery: number;
  /** label gaya untuk telemetry/QC */
  label: string;
}

const LAYOUTS: LayoutModeId[] = ["band_swap", "full_bleed_art", "stacked_cards", "text_only"];
const TYPOGRAPHY: TypographyModeId[] = ["slab", "outline", "highlight"];
const TRANSITIONS: TransitionModeId[] = ["speedlines", "flash", "slice", "page_wipe"];
const PAPERS: PaperToneId[] = [
  "cream",
  "newsprint",
  "bone",
  "cream",
  "newsprint",
  "bone",
  "cream",
  "newsprint",
  "charcoal", // kertas gelap = look langka (±1 dari 9 episode), bukan default
];
const ACCENTS: AccentSetId[] = ["vermilion", "electric", "acid", "sunset", "vermilion"];

/** Hash 32-bit stabil (FNV-1a) — sama di browser & Node. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pick<T>(list: T[], seed: number, salt: number): T {
  return list[(seed >>> (salt % 16)) % list.length];
}

/** Bangun variasi visual dari identitas episode. Deterministik & stabil. */
export function buildVisualVariation(
  title: string,
  episodeNumber = 1,
  niche = ""
): VisualVariation {
  const seed = hashSeed(`${title.trim().toLowerCase()}|${episodeNumber}|${niche}`);

  const paper = PAPER_TONES[pick(PAPERS, seed, 3)];
  const accent = ACCENT_SETS[pick(ACCENTS, seed, 7)];
  const layoutMode = pick(LAYOUTS, seed, 11);
  const typography = pick(TYPOGRAPHY, seed, 5);
  const transition = pick(TRANSITIONS, seed, 13);

  // Episode bernomor kelipatan 3 memakai kertas gelap penuh (kontras channel)
  const effectivePaper = episodeNumber % 5 === 0 && !paper.isDark ? PAPER_TONES.charcoal : paper;

  return {
    seed,
    paper: effectivePaper,
    accent,
    layoutMode,
    typography,
    transition,
    cardRotation: ((seed % 7) - 3) * 1.1,
    panelOffset: seed % 4,
    darkSceneEvery: seed % 3 === 0 ? 0 : 3,
    label: `${effectivePaper.id}/${accent.id}/${layoutMode}/${typography}/${transition}`,
  };
}

/**
 * Gaya per scene: urutan layout dirotasi supaya satu episode pun tidak monoton,
 * tapi tetap berangkat dari layoutMode milik episode.
 */
export function layoutForScene(
  variation: VisualVariation,
  sceneIndex: number
): LayoutModeId {
  const startIdx = LAYOUTS.indexOf(variation.layoutMode);
  return LAYOUTS[(startIdx + sceneIndex) % LAYOUTS.length];
}

export function typographyForScene(
  variation: VisualVariation,
  sceneIndex: number
): TypographyModeId {
  const startIdx = TYPOGRAPHY.indexOf(variation.typography);
  return TYPOGRAPHY[(startIdx + sceneIndex) % TYPOGRAPHY.length];
}

/** Transisi berganti tiap scene supaya tempo tidak repetitif. */
export function transitionForScene(
  variation: VisualVariation,
  sceneIndex: number
): TransitionModeId {
  const startIdx = TRANSITIONS.indexOf(variation.transition);
  return TRANSITIONS[(startIdx + sceneIndex) % TRANSITIONS.length];
}
