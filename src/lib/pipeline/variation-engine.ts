import type { RealEpisode } from "@/types/pipeline";

export const STORY_STRUCTURES = [
  "Studi Kasus Nyata (Masalah -> Analisis -> Solusi Terukur)",
  "Bongkar Mitos vs Fakta (Klaim Populer -> Bukti Nyata -> Kesimpulan)",
  "Breakdown Kronologis (Awal -> Titik Balik -> Dampak Hari Ini)",
  "Perbandingan Sebelum & Sesudah (Metode Lama vs Metode Baru)",
  "Eksperimen Praktis (Uji Coba Langsung -> Hasil -> Pelajaran)",
  "3 Kesalahan Umum + Cara Perbaikan Cepat",
  "Simulasi Angka & Data Nyata (Hitung Transparan Langkah demi Langkah)",
  "Perspektif Dua Sisi (Pro, Kontra & Rekomendasi Objektif)",
] as const;

export const SETTING_CATALOG = [
  "Studio Analisis Digital Gelap",
  "Meja Kerja Produktivitas Modern",
  "Ruang Papan Strategi & Data",
  "Simulasi Layar Aplikasi & Workflow",
  "Latar Kota Cyberpunk & Ekonomi Digital",
  "Visual Infografis Minimalis Kontras Tinggi",
  "Timeline Sejarah & Peta Visual",
  "Laboratorium Eksperimen Teknologi",
] as const;

export const SUPPORTING_CHARACTER_CATALOG = [
  "Analis Data & Fakta Lapangan",
  "Sudut Pandang Pemula yang Baru Mulai",
  "Praktisi Bisnis & Efisiensi Biaya",
  "Penguji Tools & Workflow Harian",
  "Narator Kritis Penguji Mitos",
  "Mentor Strategi Langkah Praktis",
  "Pengamat Tren Teknologi Global",
  "Studi Kasus Kreator Independen",
] as const;

export const MORAL_LESSON_CATALOG = [
  "Keputusan berbasis data mengalahkan asumsi semata",
  "Konsistensi kecil setiap hari menghasilkan efek majemuk besar",
  "Fokus pada nilai nyata untuk penonton jauh lebih awet dari sekadar viral sesaat",
  "Menguji langsung lebih berharga daripada sekadar ikut tren",
  "Efisiensi sistem kerja membebaskan waktu untuk kreativitas orisinal",
  "Transparansi dan kejujuran membangun kepercayaan audiens jangka panjang",
  "Memulai dari skala kecil mengurangi risiko sambil mempercepat belajar",
  "Kualitas sudut pandang unik membedakan kreator dari konten massal",
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

function pickUnused(
  catalog: readonly string[],
  used: string[],
  count: number
): string[] {
  const usedLower = new Set(used.map((u) => u.toLowerCase().trim()));
  const fresh = catalog.filter(
    (item) => !usedLower.has(item.toLowerCase().trim())
  );
  const pool = fresh.length >= count ? fresh : [...fresh, ...catalog];
  return pool.slice(0, count);
}

/**
 * Variation Engine: computes unused story structures, visual settings, perspectives,
 * and key takeaways based on recent saved episodes so no two videos feel templated.
 */
export function pickFreshVariationBlueprint(
  previousEpisodes: RealEpisode[]
): FreshVariationSuggestion {
  const recent = buildScriptSummaryArchive(previousEpisodes).slice(0, 8);
  const usedStructures = recent.map((r) => r.storyStructure).filter(Boolean);
  const usedSettings = recent.map((r) => r.setting).filter(Boolean);
  const usedCharacters = recent
    .map((r) => r.supportingCharacter)
    .filter(Boolean);
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
