/**
 * RESEARCH RIGOR GUARD (adopsi pola dari `K-Dense-Al/scientific-agent-skills`).
 *
 * Prinsip yang dipakai:
 *  - pisahkan FAKTA (ada sumber) vs INFERENSI (opini/analisis),
 *  - setiap angka wajib punya sumber; tanpa sumber → jangan pakai angka,
 *  - nyatakan ketidakpastian secara eksplisit, jangan menutupinya dengan bahasa yakin,
 *  - jangan mengklaim hasil eksperimen yang tidak benar-benar dijalankan.
 *
 * Dipakai di prompt Divisi Riset (dan bisa dipakai divisi lain).
 */

export interface ResearchClaimAudit {
  ok: boolean;
  /** Jumlah persen/angka tanpa sumber */
  unsourcedNumbers: string[];
  /** frasa yang mengklaim hasil tanpa dasar */
  overclaims: string[];
  problems: string[];
}

const NUMBER_PATTERN = /\b\d{1,3}(?:[.,]\d+)?\s?(?:%|persen|juta|ribu|k\b|m\b|views?|penonton)\b/gi;

const OVERCLAIM_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(pasti|dijamin|100%|selalu|tidak pernah gagal)\b/i, label: "klaim absolut" },
  { pattern: /\b(viral|jutaan views|pasti FYP)\b/i, label: "klaim viral tanpa bukti" },
  { pattern: /\b(terbukti secara ilmiah|penelitian menunjukkan)\b/i, label: "klaim ilmiah tanpa sitasi" },
];

/** Blok aturan yang ditempel ke system prompt riset. */
export function buildResearchRigorPrompt(): string {
  return [
    "DISIPLIN RISET (WAJIB):",
    "1. Bedakan FAKTA bersumber vs INFERENSI. Tulis sumber (nama + URL) untuk setiap fakta kunci.",
    "2. Jangan mencantumkan angka (%, views, jumlah bintang repo, tanggal rilis) tanpa sumber yang bisa dicek.",
    "3. Bila data belum ada, katakan 'belum terverifikasi' — jangan menebak.",
    "4. Jangan mengklaim eksperimen/benchmark yang tidak benar-benar dijalankan sistem.",
    "5. Sebutkan tingkat keyakinan (tinggi/sedang/rendah) untuk setiap kesimpulan.",
    "6. Hindari kata absolut: pasti, dijamin, 100%, selalu.",
  ].join("\n");
}

/**
 * Audit teks hasil AI terhadap aturan di atas (dipakai saat QC & unit test).
 * `sourcesProvided=true` berarti teks sudah menyebut URL sumber.
 */
export function auditResearchClaim(
  text: string,
  options?: { sourcesProvided?: boolean }
): ResearchClaimAudit {
  const sourcesProvided =
    options?.sourcesProvided ?? /https?:\/\/\S+/i.test(text);

  const numbers = text.match(NUMBER_PATTERN) ?? [];
  const unsourcedNumbers = sourcesProvided ? [] : [...new Set(numbers)];

  const overclaims = OVERCLAIM_PATTERNS.filter((p) => p.pattern.test(text)).map(
    (p) => p.label
  );

  const problems: string[] = [];
  if (unsourcedNumbers.length > 0) {
    problems.push(
      `Angka tanpa sumber: ${unsourcedNumbers.slice(0, 4).join(", ")}`
    );
  }
  if (overclaims.length > 0) {
    problems.push(`Klaim berlebihan: ${overclaims.join(", ")}`);
  }

  return {
    ok: problems.length === 0,
    unsourcedNumbers,
    overclaims,
    problems,
  };
}
