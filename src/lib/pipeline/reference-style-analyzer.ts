import type { VisualStyleId } from "@/types/pipeline";

/**
 * Reference Video Style & Editing Guide Analyzer (Section E).
 *
 * Converts a user-supplied reference video link + optional notes into an
 * ORIGINAL Fajrezzz editing blueprint & style preset.
 *
 * Originality & Copyright Rule:
 * - Never downloads, reuses, or copies raw footage/scripts from other creators.
 * - Extracts abstract editing principles (hook cadence, cut rhythm, typography
 *   contrast, transition vocabulary, audio pacing) and applies Fajrezzz's own
 *   original visual identity.
 */

export interface ReferenceStylePreset {
  id: string;
  name: string;
  referenceUrl: string;
  platformDetected: "tiktok" | "youtube_shorts" | "instagram_reels" | "web";
  createdAt: string;
  recommendedVisualStyle: VisualStyleId;
  hookWindowSec: number;
  avgCutIntervalSec: number;
  preferredTransitions: Array<"whip-up" | "iris-circle" | "zoom-through" | "whip-left" | "push-pull">;
  typographyDirective: string;
  audioMixDirective: string;
  visualDemoDirective: string;
  endingDirective: string;
  originalityGuardrail: string;
  notes: string;
}

const STORAGE_KEY = "fajrezzz_tiktok_style_presets_v1";

function detectPlatform(url: string): ReferenceStylePreset["platformDetected"] {
  const low = url.toLowerCase();
  if (low.includes("tiktok.com")) return "tiktok";
  if (low.includes("youtube.com") || low.includes("youtu.be")) return "youtube_shorts";
  if (low.includes("instagram.com")) return "instagram_reels";
  return "web";
}

/**
 * Pure deterministic analyzer translating reference URL + creator/editing cues into
 * an original Fajrezzz 9:16 TikTok editing guide & style preset.
 */
export function buildOriginalStylePresetFromReference(input: {
  referenceUrl: string;
  presetName?: string;
  styleCueNotes?: string;
}): ReferenceStylePreset {
  const cleanUrl = input.referenceUrl.trim();
  const notes = (input.styleCueNotes || "").trim();
  const combined = `${cleanUrl} ${notes}`.toLowerCase();
  const platformDetected = detectPlatform(cleanUrl);

  let recommendedVisualStyle: VisualStyleId = "dark_ai_cinematic";
  let avgCutIntervalSec = 3.2;
  let preferredTransitions: ReferenceStylePreset["preferredTransitions"] = [
    "whip-up",
    "zoom-through",
    "whip-left",
  ];

  if (/clean|white|apple|minimal|keynote|tutorial|light/.test(combined)) {
    recommendedVisualStyle = "clean_tutorial";
    avgCutIntervalSec = 3.6;
    preferredTransitions = ["push-pull", "iris-circle", "whip-up"];
  } else if (/terminal|claude|code|cli|hacker|cyber|matrix|dev/.test(combined)) {
    recommendedVisualStyle = "cyberpunk_dev";
    avgCutIntervalSec = 2.8;
    preferredTransitions = ["whip-left", "zoom-through", "push-pull"];
  } else if (/network|3d|agent|multi-agent|graph|diagram|node/.test(combined)) {
    recommendedVisualStyle = "agent_3d_network";
    avgCutIntervalSec = 3.1;
    preferredTransitions = ["iris-circle", "zoom-through", "whip-up"];
  } else if (/news|breaking|fast|energi|viral|cepat/.test(combined)) {
    recommendedVisualStyle = "high_energy_news";
    avgCutIntervalSec = 2.5;
    preferredTransitions = ["whip-up", "whip-left", "zoom-through"];
  } else if (/doc|dokumenter|explain|edukasi|deep/.test(combined)) {
    recommendedVisualStyle = "tech_documentary";
    avgCutIntervalSec = 3.8;
    preferredTransitions = ["push-pull", "whip-up", "iris-circle"];
  }

  const presetName =
    (input.presetName || "").trim() ||
    `Fajrezzz Original · ${recommendedVisualStyle.replace(/_/g, " ").toUpperCase()}`;

  return {
    id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: presetName,
    referenceUrl: cleanUrl,
    platformDetected,
    createdAt: new Date().toISOString(),
    recommendedVisualStyle,
    hookWindowSec: 1.8,
    avgCutIntervalSec,
    preferredTransitions,
    typographyDirective:
      "Headline 0–2 detik kontras tinggi dengan pill aksen original Fajrezzz + subtitle kata-per-kata 0ms di dalam TikTok 9:16 Safe Zone.",
    audioMixDirective:
      "Voiceover neural jernih + pemotongan jeda mati PCM RMS (-40 dB) + BGM ambient ducking halus + SFX click/whoosh di tiap transisi.",
    visualDemoDirective:
      "Demonstrasi teknis nyata (Claude Code terminal, multi-file diff, diagram multi-agent, atau grafik objektif) dengan GSAP easing & micro-dolly.",
    endingDirective:
      "Penutup tajam 3 detik berisi kesimpulan konkret & ajakan diskusi topik AI berikutnya.",
    originalityGuardrail:
      "Hanya mengadaptasi prinsip ritme, komposisi, dan transisi — seluruh naskah, visual vector, warna, dan identitas tetap 100% original FAJREZZZ AI OFFICE.",
    notes:
      notes ||
      "Referensi gaya dianalisis sebagai panduan ritme & struktur editing original tanpa menyalin materi kreator lain.",
  };
}

export function loadSavedStylePresets(): ReferenceStylePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReferenceStylePreset[]) : [];
  } catch {
    return [];
  }
}

export function saveStylePresets(presets: ReferenceStylePreset[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, 12)));
  } catch {
    // ignore storage quota
  }
}
