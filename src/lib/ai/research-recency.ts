/**
 * RESEARCH RECENCY — riset 30 hari terakhir (v9.3)
 *
 * Diadopsi dari pola `mvanhorn/last30days-skill`: riset konten AI cepat basi,
 * jadi setiap sumber diberi umur, dan kesimpulan harus menyebut seberapa segar
 * buktinya. Kita tidak memanggil API pihak ketiga — kita menegakkan aturannya
 * pada sumber yang sudah dikumpulkan pipeline sendiri.
 */

export const RECENCY_WINDOW_DAYS = 30;
export const FRESH_WINDOW_DAYS = 7;

export type RecencyBucket = "fresh" | "current" | "stale" | "unknown";

export interface RecencySource {
  name: string;
  publishedAt?: string | null;
  url?: string | null;
}

export interface RecencySummary {
  total: number;
  fresh: number;
  current: number;
  stale: number;
  unknown: number;
  /** 0–1: proporsi sumber yang berumur ≤ 30 hari dari yang punya tanggal */
  freshnessRatio: number;
  /** umur sumber tertua yang diketahui (hari), null kalau tidak ada tanggal */
  oldestDays: number | null;
  /** ringkasan siap tempel di narasi/QC */
  verdict: string;
}

/** Selisih hari (bisa negatif kalau tanggal di masa depan). */
export function daysBetween(fromISO: string, nowISO: string): number | null {
  const from = Date.parse(fromISO);
  const now = Date.parse(nowISO);
  if (Number.isNaN(from) || Number.isNaN(now)) return null;
  return Math.round(((now - from) / 86_400_000) * 10) / 10;
}

export function classifyRecency(
  publishedAt: string | null | undefined,
  nowISO: string = new Date().toISOString()
): RecencyBucket {
  if (!publishedAt) return "unknown";
  const days = daysBetween(publishedAt, nowISO);
  if (days === null || days < -2) return "unknown";
  if (days <= FRESH_WINDOW_DAYS) return "fresh";
  if (days <= RECENCY_WINDOW_DAYS) return "current";
  return "stale";
}

/** Ringkas kesegaran seluruh sumber untuk QC & narasi. */
export function summarizeRecency(
  sources: RecencySource[],
  nowISO: string = new Date().toISOString()
): RecencySummary {
  const buckets = sources.map((s) => classifyRecency(s.publishedAt, nowISO));
  const count = (b: RecencyBucket) => buckets.filter((x) => x === b).length;
  const dated = buckets.filter((b) => b !== "unknown").length;
  const fresh = count("fresh");
  const current = count("current");
  const stale = count("stale");
  const unknown = count("unknown");

  const ages = sources
    .map((s) => (s.publishedAt ? daysBetween(s.publishedAt, nowISO) : null))
    .filter((d): d is number => d !== null && d >= 0);
  const oldestDays = ages.length > 0 ? Math.max(...ages) : null;

  const freshnessRatio = dated === 0 ? 0 : Math.round(((fresh + current) / dated) * 100) / 100;

  let verdict: string;
  if (sources.length === 0) {
    verdict = "Belum ada sumber.";
  } else if (dated === 0) {
    verdict = "Tanggal sumber belum tersedia — klaim harus ditulis hati-hati.";
  } else if (stale === 0) {
    verdict = `Semua sumber ≤ ${RECENCY_WINDOW_DAYS} hari (segar).`;
  } else if (fresh + current === 0) {
    verdict = `⚠ Semua sumber lebih tua dari ${RECENCY_WINDOW_DAYS} hari — topik bisa sudah bergeser.`;
  } else {
    verdict = `Campuran: ${fresh + current} sumber segar, ${stale} sumber lebih dari ${RECENCY_WINDOW_DAYS} hari.`;
  }

  return {
    total: sources.length,
    fresh,
    current,
    stale,
    unknown,
    freshnessRatio,
    oldestDays,
    verdict,
  };
}

/** Urutkan sumber: yang terbaru dulu, tanggal tidak diketahui paling belakang. */
export function sortByRecency<T extends RecencySource>(sources: T[]): T[] {
  return [...sources].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : Number.NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

/**
 * Ambil maksimal `limit` sumber dengan prioritas segar, tapi tetap sisakan
 * minimal 1 sumber lama kalau memang satu-satunya bukti (jangan mengarang).
 */
export function pickFreshSources<T extends RecencySource>(
  sources: T[],
  limit = 4,
  nowISO: string = new Date().toISOString()
): { picked: T[]; droppedStale: number; summary: RecencySummary } {
  const summary = summarizeRecency(sources, nowISO);
  if (sources.length <= limit) {
    return { picked: sortByRecency(sources), droppedStale: 0, summary };
  }
  const sorted = sortByRecency(sources);
  const freshOnes = sorted.filter((s) => classifyRecency(s.publishedAt, nowISO) !== "stale");
  const staleOnes = sorted.filter((s) => classifyRecency(s.publishedAt, nowISO) === "stale");
  const picked = [...freshOnes, ...staleOnes].slice(0, limit);
  return { picked, droppedStale: Math.max(0, sources.length - picked.length), summary };
}

/** Blok prompt Divisi Riset & Autopilot. */
export function buildRecencyPromptBlock(
  nowISO: string = new Date().toISOString()
): string {
  const nowLabel = nowISO.slice(0, 10);
  return [
    `[last30days] Fokus riset 30 hari terakhir (hari ini ${nowLabel}):`,
    `- Prioritaskan bukti terbit ≤ ${RECENCY_WINDOW_DAYS} hari; sebut tanggal terbit di reasoning.`,
    "- Kalau satu-satunya bukti lebih tua dari 30 hari, TULIS umurnya, jangan disembunyikan.",
    "- Bedakan sinyal (banyak dibicarakan minggu ini) vs kebisingan (viral lama tanpa bukti baru).",
    "- Dilarang mengarang tanggal, angka views, atau nama sumber.",
  ].join("\n");
}
