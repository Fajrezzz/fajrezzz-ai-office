/**
 * EDIT DARI AUDIO SENDIRI (v9.2)
 *
 * Fallback yang Bos tawarkan: "kalau tidak mau bikin video sendiri, gua upload
 * audio/rekaman suara, lu edit sesuai gaya yang sudah diajarkan".
 *
 * Modul ini murni (tanpa DOM, tanpa AudioContext) supaya bisa diuji di Node:
 *  1. `detectSpeechSegments()` — cari bagian yang benar-benar ada suara bicara
 *     dari sample PCM (RMS per jendela 20 ms), jadi potongan di video tidak
 *     pernah jatuh di tengah kata.
 *  2. `planUploadedTimeline()` — bagi durasi rekaman ke sejumlah adegan
 *     proporsional panjang teks, lalu GESER tiap titik potong ke tengah
 *     jeda hening terdekat.
 *
 * Hasilnya dipakai `runEditingDivisionBrowser()`: rekaman Bos menjadi voice
 * track, dan frame zine tetap memakai gaya visual episode (variasi per episode).
 */

export interface SpeechSegment {
  startSec: number;
  endSec: number;
}

export interface SpeechDetectionOptions {
  /** Ambang RMS dalam dBFS. Default −38 dB (cukup toleran ke mikrofon HP). */
  thresholdDb?: number;
  /** Jendela analisis dalam ms. Default 20 ms. */
  windowMs?: number;
  /** Segmen suara lebih pendek dari ini dibuang (napas/klik). Default 0.18 s. */
  minSpeechSec?: number;
  /** Jeda lebih pendek dari ini dianggap satu ucapan. Default 0.16 s. */
  minGapSec?: number;
  /** Sample rate; kalau tidak diisi diambil dari argumen ketiga. */
  sampleRate?: number;
}

function rmsDb(window: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < window.length; i += 1) sum += window[i] * window[i];
  const rms = Math.sqrt(sum / Math.max(1, window.length));
  return rms <= 1e-7 ? -120 : 20 * Math.log10(rms);
}

/** Deteksi segmen bicara dari PCM mono. Deterministik & aman untuk audio kosong. */
export function detectSpeechSegments(
  samples: Float32Array,
  sampleRate: number,
  options: SpeechDetectionOptions = {}
): SpeechSegment[] {
  const thresholdDb = options.thresholdDb ?? -38;
  const windowMs = options.windowMs ?? 20;
  const minSpeechSec = options.minSpeechSec ?? 0.18;
  const minGapSec = options.minGapSec ?? 0.16;
  const rate = options.sampleRate ?? sampleRate;

  if (!samples || samples.length === 0 || !Number.isFinite(rate) || rate <= 0) return [];

  const winSamples = Math.max(1, Math.round((windowMs / 1000) * rate));
  const raw: SpeechSegment[] = [];

  for (let start = 0; start < samples.length; start += winSamples) {
    const end = Math.min(samples.length, start + winSamples);
    const slice = samples.subarray(start, end);
    if (rmsDb(slice) < thresholdDb) continue;

    const startSec = start / rate;
    const endSec = end / rate;
    const last = raw[raw.length - 1];
    if (last && startSec - last.endSec <= minGapSec) {
      last.endSec = endSec;
    } else {
      raw.push({ startSec, endSec });
    }
  }

  return raw
    .filter((seg) => seg.endSec - seg.startSec >= minSpeechSec)
    .map((seg) => ({
      startSec: Math.round(seg.startSec * 1000) / 1000,
      endSec: Math.round(seg.endSec * 1000) / 1000,
    }));
}

/** Total durasi bicara (detik) dari daftar segmen. */
export function totalSpeechSec(segments: SpeechSegment[]): number {
  return segments.reduce((acc, s) => acc + Math.max(0, s.endSec - s.startSec), 0);
}

/**
 * Titik tengah jeda hening terdekat dari `targetSec` (maks `maxShiftSec`).
 * Dipakai supaya cut video jatuh pas di jeda napas, bukan di tengah kata.
 */
export function nearestSilenceMidpoint(
  targetSec: number,
  segments: SpeechSegment[],
  maxShiftSec = 1.1
): number | null {
  if (segments.length < 2) return null;
  let best: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const gapStart = segments[i].endSec;
    const gapEnd = segments[i + 1].startSec;
    if (gapEnd - gapStart < 0.04) continue;
    const mid = (gapStart + gapEnd) / 2;
    const dist = Math.abs(mid - targetSec);
    if (dist < bestDist) {
      bestDist = dist;
      best = mid;
    }
  }

  return best !== null && bestDist <= maxShiftSec ? best : null;
}

export interface UploadedTimelinePlan {
  /** Durasi tiap adegan (detik, sudah dibulatkan 2 desimal). */
  durationsSec: number[];
  /** Titik potong kumulatif (detik) — panjang = jumlah adegan (cut terakhir = durasi). */
  cutsSec: number[];
  /** Berapa cut yang berhasil ditempel ke jeda hening. */
  snappedCuts: number;
  /** Proporsi rekaman yang benar-benar berisi suara (0–1). */
  speechRatio: number;
  totalSec: number;
}

/**
 * Bagi rekaman menjadi N adegan.
 * Bobot tiap adegan = jumlah kata narasinya (minimum 3), lalu tiap titik potong
 * digeser maksimal `snapWindowSec` ke tengah jeda hening terdekat.
 */
export function planUploadedTimeline(args: {
  durationSec: number;
  sceneTexts: string[];
  segments?: SpeechSegment[];
  minSceneSec?: number;
  snapWindowSec?: number;
}): UploadedTimelinePlan {
  const durationSec = Math.max(0, Number(args.durationSec) || 0);
  const sceneTexts = args.sceneTexts.filter((t) => typeof t === "string" && t.trim().length > 0);
  const segments = args.segments ?? [];
  const minSceneSec = args.minSceneSec ?? 1.6;
  const snapWindowSec = args.snapWindowSec ?? 1.1;

  if (durationSec <= 0 || sceneTexts.length === 0) {
    return { durationsSec: [], cutsSec: [], snappedCuts: 0, speechRatio: 0, totalSec: 0 };
  }

  const weights = sceneTexts.map((text) => Math.max(3, text.trim().split(/\s+/).length));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const cuts: number[] = [];
  let cumulativeWeight = 0;
  let prevCut = 0;
  for (let i = 0; i < weights.length - 1; i += 1) {
    cumulativeWeight += weights[i];
    const target = (durationSec * cumulativeWeight) / weightSum;
    const snapCandidate = nearestSilenceMidpoint(target, segments, snapWindowSec);
    let cut = snapCandidate ?? target;
    if (snapCandidate !== null) {
      // Jaga adegan tetap proporsional: geseran tidak boleh melewati tetangga.
      const maxShift = Math.min(snapWindowSec, durationSec * 0.12);
      cut = Math.min(target + maxShift, Math.max(target - maxShift, cut));
    }
    const remainingScenes = weights.length - i - 1;
    const upperBound = durationSec - remainingScenes * minSceneSec;
    cut = Math.max(prevCut + minSceneSec, Math.min(cut, upperBound));
    cut = Math.round(cut * 1000) / 1000;
    cuts.push(cut);
    prevCut = cut;
  }
  cuts.push(Math.round(durationSec * 1000) / 1000);

  const snappedCuts = cuts
    .slice(0, -1)
    .filter((cut) => nearestSilenceMidpoint(cut, segments, 0.001) !== null).length;

  const durationsSec = cuts.map((cut, idx) =>
    Math.round((cut - (idx === 0 ? 0 : cuts[idx - 1])) * 100) / 100
  );

  return {
    durationsSec,
    cutsSec: cuts,
    snappedCuts,
    speechRatio:
      segments.length > 0 ? Math.min(1, totalSpeechSec(segments) / durationSec) : 0,
    totalSec: Math.round(durationSec * 100) / 100,
  };
}

/** Ringkasan siap-tampil untuk UI ("12,4 dtk · 3 adegan · 78% bersuara"). */
export function describeUploadedPlan(plan: UploadedTimelinePlan): string {
  if (plan.durationsSec.length === 0) return "Belum ada audio.";
  const ratio = Math.round(plan.speechRatio * 100);
  return `${plan.totalSec.toFixed(1).replace(".", ",")} dtk · ${
    plan.durationsSec.length
  } adegan · ${ratio}% bersuara`;
}
