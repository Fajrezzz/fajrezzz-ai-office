import type { RealEpisode } from "@/types/pipeline";

export const STORY_STRUCTURES = [
  "Misteri Petunjuk (Mencari benda hilang lewat 3 petunjuk)",
  "Estafet Kerja Sama (Tiap teman punya peran unik berantai)",
  "Tukar Peran Lucu (Dua karakter saling bertukar tugas)",
  "Eksperimen Gagal-Lalu-Berhasil (Mencoba 2 cara sebelum berhasil)",
  "Peta Harta Edukatif (Mengikuti simbol warna & angka)",
  "Misi Penyelamatan Berantai (Menolong teman dengan alat kreatif)",
  "Tantangan Kreatif Waktu (Menyiapkan kejutan sebelum matahari terbenam)",
  "Perjalanan Menemukan Teman Baru (Bertemu karakter pemalu di lokasi baru)",
] as const;

export const SETTING_CATALOG = [
  "Pelabuhan Kapal Kertas",
  "Taman Jamur Bercahaya",
  "Stasiun Kereta Awan",
  "Perpustakaan Pohon Raksasa",
  "Bengkel Robot Mini",
  "Pantai Bintang Laut",
  "Kebun Musik Pelangi",
  "Desa Kincir Angin",
] as const;

export const SUPPORTING_CHARACTER_CATALOG = [
  "Tiko si Tupai Mekanik",
  "Milo si Bebek Detektif",
  "Pipo si Robot Pelukis",
  "Lala si Kura-Kura Penjelajah",
  "Kiko si Burung Hantu Musik",
  "Bobo si Beruang Tukang Roti",
  "Nini si Kelinci Astronom",
  "Dodo si Gajah Pelaut",
] as const;

export const MORAL_LESSON_CATALOG = [
  "Sabar mencoba lagi ketika percobaan pertama belum berhasil",
  "Mendengarkan ide teman sebelum bertindak",
  "Berbagi tugas sesuai keahlian masing-masing",
  "Merapikan mainan dan alat setelah selesai bermain",
  "Berani bertanya dengan sopan saat bingung",
  "Menjaga kebersihan lingkungan bersama-sama",
  "Jujur mengakui kesalahan kecil dan memperbaikinya",
  "Menghargai perbedaan warna, bentuk, dan bakat teman",
] as const;

export interface EpisodeSummaryRecord {
  episodeId: string;
  episodeNumber: number;
  title: string;
  summary: string;
  storyStructure: string;
  setting: string;
  supportingCharacter: string;
  moralLesson: string;
  createdAt: string;
}

export interface FreshVariationSuggestion {
  recommendedStructures: string[];
  recommendedSettings: string[];
  recommendedCharacters: string[];
  recommendedMorals: string[];
  usedStructures: string[];
  usedSettings: string[];
  usedCharacters: string[];
  usedMorals: string[];
}

export function buildScriptSummaryArchive(
  episodes: RealEpisode[]
): EpisodeSummaryRecord[] {
  return episodes
    .filter((ep) => Boolean(ep.divisions.script.output?.summary))
    .map((ep) => {
      const s = ep.divisions.script.output!;
      return {
        episodeId: ep.id,
        episodeNumber: ep.episodeNumber,
        title: ep.divisions.seo.output?.title || ep.bossTheme,
        summary: s.summary,
        storyStructure: s.storyStructure,
        setting: s.setting,
        supportingCharacter: s.supportingCharacter,
        moralLesson: s.moralLesson,
        createdAt: ep.createdAt,
      };
    });
}

function pickUnused(catalog: readonly string[], used: string[], count: number): string[] {
  const usedLower = new Set(used.map((u) => u.toLowerCase().trim()));
  const fresh = catalog.filter((item) => !usedLower.has(item.toLowerCase().trim()));
  const pool = fresh.length >= count ? fresh : [...fresh, ...catalog];
  return pool.slice(0, count);
}

/**
 * Variation Engine: computes unused story structures, settings, supporting characters,
 * and moral lessons based on recent saved episodes so no two episodes feel like a template.
 */
export function pickFreshVariationBlueprint(
  previousEpisodes: RealEpisode[]
): FreshVariationSuggestion {
  const recent = buildScriptSummaryArchive(previousEpisodes).slice(0, 8);
  const usedStructures = recent.map((r) => r.storyStructure).filter(Boolean);
  const usedSettings = recent.map((r) => r.setting).filter(Boolean);
  const usedCharacters = recent.map((r) => r.supportingCharacter).filter(Boolean);
  const usedMorals = recent.map((r) => r.moralLesson).filter(Boolean);

  return {
    recommendedStructures: pickUnused(STORY_STRUCTURES, usedStructures, 5),
    recommendedSettings: pickUnused(SETTING_CATALOG, usedSettings, 5),
    recommendedCharacters: pickUnused(
      SUPPORTING_CHARACTER_CATALOG,
      usedCharacters,
      5
    ),
    recommendedMorals: pickUnused(MORAL_LESSON_CATALOG, usedMorals, 5),
    usedStructures,
    usedSettings,
    usedCharacters,
    usedMorals,
  };
}
