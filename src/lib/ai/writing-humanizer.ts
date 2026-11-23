/**
 * HUMANIZER — pembasmi "bau AI" pada naskah (v9.3)
 *
 * Diadopsi dari playbook `blader/humanizer` (agent skill yang menghapus tanda
 * tulisan hasil AI). Prinsip yang kami pakai:
 *  - Deteksi dulu, jangan asal tulis ulang — teks manusia yang santai dibiarkan.
 *  - Perbaikan mekanis (frasa template, tanda baca berlebih) dikerjakan otomatis.
 *  - Perbaikan yang butuh konteks (pilihan kata) dititipkan ke prompt, bukan
 *    ditambal buta oleh regex.
 *
 * Semua fungsi murni (tanpa DOM) supaya bisa diuji di Node dan dipakai di route
 * server maupun di browser.
 */

export type HumanizerTellId =
  | "pembuka-asisten"
  | "era-digital"
  | "bukan-hanya-tetapi"
  | "penting-diingat"
  | "kesimpulan-formulaik"
  | "kata-penguat-kosong"
  | "em-dash-berlebih"
  | "tanda-seru-berlebih"
  | "mari-kita"
  | "dunia-semakin"
  | "emoji-di-awal";

export interface HumanizerTell {
  id: HumanizerTellId;
  label: string;
  match: string;
  index: number;
  severity: "ringan" | "sedang" | "berat";
}

export interface HumanizerResult {
  text: string;
  score: number;
  tells: HumanizerTell[];
}

interface TellRule {
  id: HumanizerTellId;
  label: string;
  pattern: RegExp;
  severity: HumanizerTell["severity"];
}

const TELL_RULES: TellRule[] = [
  {
    id: "pembuka-asisten",
    label: "Mengaku sebagai AI / asisten",
    pattern: /sebagai (?:ai|model bahasa|asisten ai)[^.!?]{0,80}/gi,
    severity: "berat",
  },
  {
    id: "era-digital",
    label: "Frasa template 'di era digital'",
    pattern: /(?:di|dalam) era (?:digital|modern|ai|teknologi) (?:ini|sekarang)?/gi,
    severity: "sedang",
  },
  {
    id: "bukan-hanya-tetapi",
    label: "Konstruksi 'bukan hanya X, tetapi juga Y'",
    pattern: /bukan hanya [^.!?]{2,80}(?:,\s*)?(?:tetapi|tapi|melainkan) (?:juga )?/gi,
    severity: "berat",
  },
  {
    id: "penting-diingat",
    label: "'Penting untuk diingat'",
    pattern: /(?:penting untuk diingat|perlu diingat bahwa|perlu dicatat bahwa)[^.!?]{0,40}/gi,
    severity: "sedang",
  },
  {
    id: "kesimpulan-formulaik",
    label: "Pembuka kesimpulan formulaik",
    pattern: /(?:pada akhirnya,|secara keseluruhan,|dengan demikian,|sebagai kesimpulan,)/gi,
    severity: "ringan",
  },
  {
    id: "kata-penguat-kosong",
    label: "Kata penguat kosong ('sangat penting')",
    pattern:
      /(?:sangat|benar-benar|sebenarnya|nyatanya|teramat) (?:penting|krusial|kunci|vital|esensial)/gi,
    severity: "ringan",
  },
  {
    id: "mari-kita",
    label: "'Mari kita' (gaya tutorial robot)",
    pattern: /\bmari kita\b/gi,
    severity: "ringan",
  },
  {
    id: "dunia-semakin",
    label: "'Di dunia yang semakin berkembang'",
    pattern: /di dunia yang (?:semakin|terus) (?:berkembang|berubah|cepat)/gi,
    severity: "sedang",
  },
  {
    id: "tanda-seru-berlebih",
    label: "Tanda seru berlebih (!!)",
    pattern: /!{2,}/g,
    severity: "ringan",
  },
  {
    id: "emoji-di-awal",
    label: "Emoji di awal kalimat",
    pattern: /(^|\n)\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    severity: "ringan",
  },
];

const SEVERITY_WEIGHT: Record<HumanizerTell["severity"], number> = {
  ringan: 6,
  sedang: 12,
  berat: 20,
};

/** Semua tanda tulisan-AI yang terdeteksi (posisi asli di teks). */
export function detectAiTells(text: string): HumanizerTell[] {
  if (!text) return [];
  const tells: HumanizerTell[] = [];
  for (const rule of TELL_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      tells.push({
        id: rule.id,
        label: rule.label,
        match: match[0].trim(),
        index: match.index,
        severity: rule.severity,
      });
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }
  }
  // Em dash berlebih: lebih dari 1 per 120 karakter
  const dashes = (text.match(/—/g) ?? []).length;
  if (dashes > Math.max(1, Math.floor(text.length / 120))) {
    tells.push({
      id: "em-dash-berlebih",
      label: "Em dash dipakai berlebihan",
      match: `${dashes}× em dash`,
      index: text.indexOf("—"),
      severity: "ringan",
    });
  }
  return tells.sort((a, b) => a.index - b.index);
}

/** Skor kebersihan teks 0–100 (100 = tidak ada tanda AI). */
export function humanizerScore(text: string): number {
  const tells = detectAiTells(text);
  const penalty = tells.reduce((acc, t) => acc + SEVERITY_WEIGHT[t.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * Perbaikan mekanis: hanya menghapus/menyederhanakan frasa template.
 * Tidak menambah fakta, tidak mengubah makna.
 */
export function humanizeText(text: string): HumanizerResult {
  if (!text) return { text: "", score: 100, tells: [] };

  const before = detectAiTells(text);
  let out = text;

  out = out.replace(/sebagai (?:ai|model bahasa|asisten ai)[^.!?]{0,80}[.!?]?\s*/gi, "");
  out = out.replace(/(?:di|dalam) era (?:digital|modern|ai|teknologi) (?:ini|sekarang)[,\s]*/gi, "");
  out = out.replace(
    /bukan hanya ([^.!?]{2,80}?)(?:,\s*)?(?:tetapi|tapi|melainkan) (?:juga )?/gi,
    "$1 dan "
  );
  out = out.replace(/(?:penting untuk diingat|perlu diingat bahwa|perlu dicatat bahwa)[,\s]*/gi, "");
  out = out.replace(
    /(?:pada akhirnya,|secara keseluruhan,|dengan demikian,|sebagai kesimpulan,)\s*/gi,
    ""
  );
  out = out.replace(
    /(?:sangat|benar-benar|sebenarnya|nyatanya|teramat) (penting|krusial|kunci|vital|esensial)/gi,
    "$1"
  );
  out = out.replace(/\bmari kita\b/gi, "kita");
  out = out.replace(/di dunia yang (?:semakin|terus) (?:berkembang|berubah|cepat)[,\s]*/gi, "");
  out = out.replace(/!{2,}/g, "!");

  // Em dash berlebih → koma (sekali dua kali masih boleh, khas zine editorial)
  const dashCount = (out.match(/—/g) ?? []).length;
  if (dashCount > Math.max(1, Math.floor(out.length / 120))) {
    let seen = 0;
    out = out.replace(/\s*—\s*/g, () => {
      seen += 1;
      return seen <= 1 ? " — " : ", ";
    });
  }

  out = out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.!?])\1{1,}/g, "$1")
    .replace(/^[\s,.;:]+/, "")
    .trim();

  // Huruf pertama kapital lagi kalau pembersihan menghapus pembuka kalimat
  if (out && before.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }

  return { text: out, score: humanizerScore(out), tells: before };
}

/** Bersihkan narasi tiap scene sekaligus, dengan laporan untuk QC. */
export function humanizeSceneNarrations<T extends { narration: string }>(
  scenes: T[]
): { scenes: T[]; averageScore: number; cleaned: number } {
  let totalPenalty = 0;
  let cleaned = 0;
  const next = scenes.map((scene) => {
    const { text, score, tells } = humanizeText(scene.narration);
    if (tells.length > 0 && text !== scene.narration) cleaned += 1;
    totalPenalty += score;
    return { ...scene, narration: text };
  });
  return {
    scenes: next,
    averageScore: scenes.length === 0 ? 100 : Math.round(totalPenalty / scenes.length),
    cleaned,
  };
}

/** Blok prompt untuk Divisi Naskah. */
export function buildHumanizerPromptBlock(): string {
  return [
    "[humanizer] Tulis seperti manusia ngobrol, bukan seperti model bahasa:",
    "- DILARANG membuka dengan 'Sebagai AI', 'Di era digital ini', atau 'Di dunia yang semakin berkembang'.",
    "- DILARANG pola 'bukan hanya X, tetapi juga Y'; langsung sebut X dan Y.",
    "- Maksimal 1 em dash (—) per 120 karakter. Jangan pakai '!!'.",
    "- Jangan mengulang kesimpulan formulaik ('pada akhirnya', 'secara keseluruhan').",
    "- Kalimat 8–18 kata, satu ide per kalimat, kata kerja aktif.",
    "- Kalau kalimatnya sudah enak dibaca manusia, JANGAN diubah.",
  ].join("\n");
}
