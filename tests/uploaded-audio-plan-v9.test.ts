import assert from "node:assert/strict";
import test from "node:test";
import {
  describeUploadedPlan,
  detectSpeechSegments,
  nearestSilenceMidpoint,
  planUploadedTimeline,
  totalSpeechSec,
} from "../src/lib/pipeline/uploaded-audio-plan.ts";

const RATE = 8000;

/** Bangun PCM mono dari pola [bicara, hening, bicara, ...] dalam detik. */
function buildPcm(pattern: Array<[number, boolean]>): Float32Array {
  const total = pattern.reduce((acc, [sec]) => acc + Math.round(sec * RATE), 0);
  const out = new Float32Array(total);
  let cursor = 0;
  for (const [sec, voiced] of pattern) {
    const len = Math.round(sec * RATE);
    for (let i = 0; i < len; i += 1) {
      out[cursor + i] = voiced ? Math.sin((2 * Math.PI * 220 * i) / RATE) * 0.4 : 0;
    }
    cursor += len;
  }
  return out;
}

test("v9.2 audio upload: deteksi segmen bicara memisahkan hening", () => {
  const pcm = buildPcm([
    [0.4, false],
    [0.9, true],
    [0.6, false],
    [1.0, true],
    [0.3, false],
  ]);
  const segments = detectSpeechSegments(pcm, RATE);
  assert.equal(segments.length, 2);
  assert.ok(segments[0].startSec >= 0.35 && segments[0].startSec <= 0.45);
  assert.ok(segments[1].endSec >= 2.8 && segments[1].endSec <= 2.95);
  assert.ok(totalSpeechSec(segments) > 1.6);
});

test("v9.2 audio upload: audio kosong / senyap tidak menghasilkan segmen", () => {
  assert.deepEqual(detectSpeechSegments(new Float32Array(0), RATE), []);
  assert.deepEqual(detectSpeechSegments(new Float32Array(RATE * 2), RATE), []);
});

test("v9.2 audio upload: klik pendek & napas dibuang", () => {
  const pcm = buildPcm([
    [0.5, false],
    [0.05, true],
    [0.5, false],
    [0.8, true],
    [0.2, false],
  ]);
  const segments = detectSpeechSegments(pcm, RATE);
  assert.equal(segments.length, 1);
  assert.ok(segments[0].endSec - segments[0].startSec > 0.7);
});

test("v9.2 audio upload: titik tengah jeda hening terdekat dipilih", () => {
  const segments = [
    { startSec: 0, endSec: 1 },
    { startSec: 1.4, endSec: 2.4 },
    { startSec: 4.0, endSec: 5.0 },
  ];
  assert.equal(nearestSilenceMidpoint(1.2, segments, 1.0), 1.2);
  // target 3.6 terlalu jauh dari jeda terakhir (3.2) → tetap null kalau jendela 0.2
  assert.equal(nearestSilenceMidpoint(3.6, segments, 0.2), null);
  assert.equal(nearestSilenceMidpoint(1.2, [{ startSec: 0, endSec: 1 }], 2), null);
});

test("v9.2 audio upload: durasi adegan menjumlah tepat ke durasi rekaman", () => {
  const plan = planUploadedTimeline({
    durationSec: 24,
    sceneTexts: ["satu dua tiga", "empat lima enam tujuh", "delapan sembilan sepuluh"],
  });
  assert.equal(plan.durationsSec.length, 3);
  const sum = plan.durationsSec.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 24) < 0.06, `total ${sum} harus ≈ 24`);
  assert.equal(plan.cutsSec[plan.cutsSec.length - 1], 24);
});

test("v9.2 audio upload: adegan dengan teks lebih panjang dapat durasi lebih besar", () => {
  const plan = planUploadedTimeline({
    durationSec: 30,
    sceneTexts: ["pendek saja", "ini adegan yang narasinya jauh lebih panjang dari yang lain"],
  });
  assert.ok(plan.durationsSec[1] > plan.durationsSec[0]);
  assert.ok(plan.durationsSec[0] >= 1.6);
});

test("v9.2 audio upload: cut ditempel ke jeda hening, tidak memotong kata", () => {
  const segments = [
    { startSec: 0, endSec: 4.0 },
    { startSec: 4.5, endSec: 8.0 },
    { startSec: 8.4, endSec: 12.0 },
  ];
  const plan = planUploadedTimeline({
    durationSec: 12,
    sceneTexts: ["a b c", "a b c", "a b c"],
    segments,
  });
  assert.ok(plan.snappedCuts >= 1, "minimal satu cut harus menempel jeda hening");
  const cut = plan.cutsSec[0];
  assert.ok(
    Math.abs(cut - 4.25) < 0.35 || Math.abs(cut - 8.2) < 0.35,
    `cut ${cut} harus dekat jeda hening`
  );
});

test("v9.2 audio upload: cut monoton naik walau snap agresif", () => {
  const segments = [
    { startSec: 0, endSec: 1 },
    { startSec: 1.2, endSec: 2 },
    { startSec: 9.5, endSec: 10 },
  ];
  const plan = planUploadedTimeline({
    durationSec: 10,
    sceneTexts: ["a", "b", "c", "d"],
    segments,
    minSceneSec: 1.8,
  });
  for (let i = 1; i < plan.cutsSec.length; i += 1) {
    assert.ok(plan.cutsSec[i] > plan.cutsSec[i - 1], "cut harus naik");
  }
  plan.durationsSec.slice(0, -1).forEach((d) => assert.ok(d >= 1.7));
});

test("v9.2 audio upload: audio terlalu pendek / tanpa teks ditolak dengan aman", () => {
  const empty = planUploadedTimeline({ durationSec: 0, sceneTexts: ["a b c"] });
  assert.deepEqual(empty.durationsSec, []);
  assert.equal(empty.totalSec, 0);
  assert.equal(describeUploadedPlan(empty), "Belum ada audio.");
});

test("v9.2 audio upload: ringkasan UI menyebut durasi, adegan & rasio suara", () => {
  const plan = planUploadedTimeline({
    durationSec: 10,
    sceneTexts: ["a b", "c d"],
    segments: [{ startSec: 0, endSec: 7.5 }],
  });
  const label = describeUploadedPlan(plan);
  assert.match(label, /^10,0 dtk · 2 adegan · 75% bersuara$/);
});
