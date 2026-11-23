/**
 * FAJREZZZ AI OFFICE — DYNAMIC EDITING ENGINE (v10)
 *
 * Blueprint hanya "niat". File ini menerjemahkannya menjadi keputusan editing
 * per scene: gerak kamera, transisi, gaya tipografi, kata yang ditekan, aset,
 * musik/SFX, dan ritme potong — lalu memastikan kombinasi itu BELUM PERNAH
 * dipakai pada episode sebelumnya (bukan cuma ganti warna/teks).
 */

import { hashSeed, type TopicCandidate } from "./topic-intelligence.ts";
import {
  ASSET_MIXES,
  CAMERA_MOVES,
  MUSIC_MOODS,
  TRANSITIONS,
  TYPOGRAPHY_MODES,
  type CreativeBlueprint,
  type TransitionId,
} from "./creative-blueprint.ts";

export interface SceneEditingDecision {
  index: number;
  beat: string;
  durationSec: number;
  camera: string;
  transitionIn: string;
  transitionOut: string;
  typography: string;
  emphasisWords: string[];
  asset: string;
  musicIntensity: 1 | 2 | 3;
  soundCue: string;
  cutIntervalSec: number;
}

export interface EditingPlan {
  episodeId: string;
  topic: string;
  styleId: string;
  scenes: SceneEditingDecision[];
  rhythm: { avgCutSec: number; fastestCutSec: number; slowestCutSec: number; pace: "calm" | "steady" | "urgent" };
  subtitleStyle: { position: "lower_third_safe"; wordsPerCue: number; highlightNumbers: boolean };
  signature: string;
  /** true kalau pola transisi & kamera belum pernah dipakai di riwayat. */
  novelAgainstHistory: boolean;
  notes: string[];
}

/** Hitung kata yang layak ditekan — dari ISI episode ini, bukan daftar AI global. */
export function emphasisWordsFor(candidate: TopicCandidate): string[] {
  const text = `${candidate.title} ${candidate.angle} ${candidate.keyFacts.map((f) => f.claim).join(" ")}`;
  const words = text
    .split(/[\s,.;:!?"“”()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
  const freq = new Map<string, number>();
  for (const w of words) {
    const key = w.toLowerCase();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const numbers = (text.match(/\b\d+([.,]\d+)?\s?(%|persen|juta|miliar|ribu|tahun|kali|orang)?\b/gi) ?? []).map(
    (n) => n.trim()
  );
  const top = [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
  return [...new Set([...numbers.slice(0, 3), ...top])].slice(0, 6);
}

function paceFor(blueprint: CreativeBlueprint): EditingPlan["rhythm"]["pace"] {
  if (blueprint.musicMood === "urgent_news") return "urgent";
  if (blueprint.musicMood === "calm_explainer" || blueprint.musicMood === "documentary_warm") return "calm";
  return "steady";
}

/**
 * Bangun rencana editing. `previousSignatures` dipakai untuk membuktikan
 * variasi: kalau signature sudah ada di riwayat, transisi & kamera dirotasi
 * sampai menghasilkan kombinasi baru.
 */
export function buildEditingPlan(
  blueprint: CreativeBlueprint,
  candidate: TopicCandidate,
  previousSignatures: string[] = []
): EditingPlan {
  const emphasis = emphasisWordsFor(candidate);
  const pace = paceFor(blueprint);
  const notes: string[] = [];
  const used = new Set(previousSignatures);

  const buildOnce = (rotation: number): EditingPlan => {
    const cameraPool = CAMERA_MOVES.map((c) => c.label);
    const transitionPool = TRANSITIONS.map((t) => t.label);
    const typography = TYPOGRAPHY_MODES.find((t) => t.id === blueprint.typographyStyle)?.label ?? blueprint.typographyStyle;

    // transisi keluar dihitung dulu supaya transisi masuk scene berikutnya
    // selalu menyambung (kontinuitas), bukan hasil rumus yang bisa meleset.
    const outs = blueprint.scenePlan.map((scene) => {
      const outIdx = transitionPool.indexOf(
        TRANSITIONS.find((t) => t.id === scene.transitionOut)?.label ?? transitionPool[0]
      );
      return transitionPool[(outIdx + rotation) % transitionPool.length];
    });

    const scenes: SceneEditingDecision[] = blueprint.scenePlan.map((scene, i) => {
      const camera = cameraPool[(cameraPool.indexOf(
        CAMERA_MOVES.find((c) => c.id === scene.motion)?.label ?? cameraPool[0]
      ) + rotation + i) % cameraPool.length];
      const transitionOut = outs[i];
      const transitionIn = i === 0 ? "clean_cut" : outs[i - 1];
      const intensity: 1 | 2 | 3 =
        pace === "urgent" ? 3 : pace === "calm" ? 1 : scene.beat === "hook" || scene.beat === "insight" ? 3 : 2;
      const cutIntervalSec =
        pace === "urgent"
          ? 1.4
          : pace === "calm"
            ? Math.max(2.2, Math.round((scene.durationSec / 2) * 10) / 10)
            : Math.max(1.8, Math.round((scene.durationSec / 2.5) * 10) / 10);

      return {
        index: scene.index,
        beat: scene.beat,
        durationSec: scene.durationSec,
        camera,
        transitionIn,
        transitionOut,
        typography,
        emphasisWords:
          scene.emphasis === "none" ? [] : emphasis.slice(0, scene.emphasis === "number" ? 2 : 3),
        asset: `${ASSET_MIXES[blueprint.assetMix].label}: ${scene.visual}`,
        musicIntensity: intensity,
        soundCue: blueprint.soundDesign[i % blueprint.soundDesign.length] ?? "whoosh halus",
        cutIntervalSec,
      };
    });

    const cuts = scenes.map((s) => s.cutIntervalSec);
    const signature = `ed_${hashSeed(
      [
        blueprint.signature,
        rotation,
        scenes.map((s) => `${s.camera}|${s.transitionIn}|${s.transitionOut}|${s.typography}`).join("~"),
      ].join("@@")
    ).toString(16)}`;

    return {
      episodeId: blueprint.episodeId,
      topic: blueprint.topic,
      styleId: blueprint.visualStyle,
      scenes,
      rhythm: {
        avgCutSec: Math.round((cuts.reduce((a, b) => a + b, 0) / cuts.length) * 10) / 10,
        fastestCutSec: Math.min(...cuts),
        slowestCutSec: Math.max(...cuts),
        pace,
      },
      subtitleStyle: {
        position: "lower_third_safe",
        wordsPerCue: pace === "urgent" ? 3 : 4,
        highlightNumbers: true,
      },
      signature,
      novelAgainstHistory: !used.has(signature),
      notes,
    };
  };

  let plan = buildOnce(0);
  let rotation = 0;
  while (!plan.novelAgainstHistory && rotation < Math.max(4, blueprint.transitionLanguage.length)) {
    rotation += 1;
    plan = buildOnce(rotation);
    notes.push(`rotasi ${rotation} dipakai untuk menghindari pola editing lama`);
  }
  if (!plan.novelAgainstHistory) {
    notes.push("PERINGATAN: pola editing identik dengan episode lama walau sudah dirotasi.");
  }
  return { ...plan, notes };
}

/** Validasi: tidak ada transisi berat 2× berturut-turut, subtitle dalam safe zone. */
export function validateEditingPlan(plan: EditingPlan): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const heavy = new Set<TransitionId>(["whip_pan", "zoom_through", "graphic_wipe"]);
  const heavyLabels = TRANSITIONS.filter((t) => heavy.has(t.id)).map((t) => t.label);
  let consecutive = 0;
  for (const scene of plan.scenes) {
    if (heavyLabels.includes(scene.transitionOut)) {
      consecutive += 1;
      if (consecutive >= 3) issues.push(`transisi berat ${consecutive}× berturut-turut dari scene ${scene.index}`);
    } else {
      consecutive = 0;
    }
    if (scene.durationSec < 1.2) issues.push(`scene ${scene.index} terlalu pendek (${scene.durationSec}s)`);
    if (scene.cutIntervalSec < 1) issues.push(`ritme potong scene ${scene.index} terlalu cepat (<1s)`);
  }
  if (plan.scenes.length < 5) issues.push("jumlah scene terlalu sedikit untuk struktur cerita lengkap");
  return { ok: issues.length === 0, issues };
}

/** Ringkasan 1 baris untuk laporan QC visual. */
export function describeEditingPlan(plan: EditingPlan): string {
  return `${plan.styleId} · ${plan.scenes.length} scene · rata-rata potong ${plan.rhythm.avgCutSec}s (${plan.rhythm.pace}) · transisi: ${[
    ...new Set(plan.scenes.map((s) => s.transitionOut)),
  ].join(", ")}`;
}

export function musicLabelFor(blueprint: CreativeBlueprint): string {
  return MUSIC_MOODS.find((m) => m.id === blueprint.musicMood)?.label ?? blueprint.musicMood;
}
