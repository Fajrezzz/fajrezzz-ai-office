import assert from "node:assert/strict";
import test from "node:test";

import {
  CANDIDATE_BANK,
} from "../src/lib/studio/candidate-bank.ts";
import {
  DUPLICATE_THRESHOLD,
  HISTORY_COMPARISON_WINDOW,
  MIN_TOPIC_SCORE,
  TOPIC_CATEGORIES,
  categoryLabel,
  detectCategory,
  findSimilarEpisodes,
  scoreTopicCandidate,
  selectBestTopic,
  semanticSimilarity,
  type TopicHistoryRecord,
} from "../src/lib/studio/topic-intelligence.ts";

const nowMs = Date.parse("2026-11-23T00:00:00.000Z");

function historyFrom(overrides: Partial<TopicHistoryRecord>[]): TopicHistoryRecord[] {
  return overrides.map((o, i) => ({
    episodeId: o.episodeId ?? `hist-${i}`,
    episodeNumber: o.episodeNumber ?? i + 1,
    producedAt: o.producedAt ?? `2026-11-${String(10 + i).padStart(2, "0")}T00:00:00.000Z`,
    title: o.title ?? "Judul",
    mainTopic: o.mainTopic ?? "Topik",
    category: o.category ?? "sains",
    angle: o.angle ?? "Sudut",
    hook: o.hook ?? "Hook",
    summary: o.summary ?? "",
    sources: o.sources ?? [],
    storyFormat: o.storyFormat ?? "hook_context",
    visualStyle: o.visualStyle ?? "kinetic",
    status: o.status ?? "draft",
    editingSignature: o.editingSignature,
    blueprintSignature: o.blueprintSignature,
    scoreTotal: o.scoreTotal,
  }));
}

test("12 kategori acuan tersedia dan bisa diklasifikasi", () => {
  assert.equal(TOPIC_CATEGORIES.length, 12);
  assert.equal(detectCategory("Tips keamanan digital: waspadai phishing lewat WhatsApp"), "keamanan_digital");
  assert.equal(detectCategory("Inflasi dan harga beras di pasar"), "ekonomi");
  assert.equal(detectCategory("Mitos vs fakta soal MSG"), "mitos_fakta");
  assert.equal(categoryLabel("sains").length > 0, true);
});

test("semanticSimilarity deterministik dan menangkap parafrase judul", () => {
  const a = semanticSimilarity("Supermoon 24 November 2026 bulan tampak lebih besar", "Bulan besar 24 November supermoon 2026");
  const b = semanticSimilarity("Supermoon 24 November 2026 bulan tampak lebih besar", "Bulan besar 24 November supermoon 2026");
  const c = semanticSimilarity("Supermoon 24 November 2026", "Cara menghemat kuota internet");
  assert.equal(a, b);
  assert.ok(a > c, `parafrase harus lebih mirip (${a} vs ${c})`);
  assert.ok(a >= DUPLICATE_THRESHOLD, "judul yang cuma diganti harus terdeteksi mirip");
});

test("kandidat AI-only bukan lagi satu-satunya domain", () => {
  const categories = new Set(CANDIDATE_BANK.map((c) => c.category));
  assert.ok(categories.size >= 3, `kategori kandidat: ${[...categories].join(", ")}`);
  assert.ok(!CANDIDATE_BANK.every((c) => /ai|agent|claude/i.test(c.title)));
  for (const candidate of CANDIDATE_BANK) {
    assert.ok(candidate.sources.length > 0, `${candidate.id} wajib punya sumber`);
    for (const s of candidate.sources) {
      assert.match(s.url, /^https:\/\//);
      assert.ok(!Number.isNaN(Date.parse(s.publishedAt)), "tanggal sumber harus valid");
    }
  }
});

test("skor topik memakai bobot 0–100 dan penalti repetisi", () => {
  const candidate = CANDIDATE_BANK[1];
  const fresh = scoreTopicCandidate(candidate, [], nowMs);
  assert.ok(fresh.total > 0 && fresh.total <= 100);

  const history = historyFrom([
    {
      title: "Pengangguran turun tapi gaji tetap",
      mainTopic: candidate.thesis,
      angle: candidate.angle,
      hook: candidate.hook,
      category: "ekonomi",
    },
  ]);
  const repeated = scoreTopicCandidate(candidate, history, nowMs);
  assert.ok(repeated.repetitionPenalty > 0, "topik yang sudah pernah dibahas harus kena penalti");
  assert.ok(repeated.total < fresh.total, `${repeated.total} harus < ${fresh.total}`);
});

test("skor di bawah ambang ditolak, bukan dipaksa lolos", () => {
  const weak = {
    ...CANDIDATE_BANK[0],
    id: "weak",
    sources: [],
    keyFacts: [],
    audienceImportance: 1,
    clarity: 1,
    curiosity: 1,
    educationalValue: 1,
    visualPotential: 1,
    difficulty: 10,
    durationFitSec: 5,
    noveltyNotes: "",
  };
  const result = selectBestTopic([weak], { nowMs });
  assert.equal(result.chosen, null);
  assert.equal(result.needsFreshResearch, true);
  assert.ok(result.rejected[0].reasons.length > 0);
  assert.ok(result.notes[0].includes("riset"), result.notes.join(" | "));
});

test("selectBestTopic menolak judul yang hanya diganti (duplikat)", () => {
  const original = CANDIDATE_BANK[0];
  const duplicate = CANDIDATE_BANK.find((c) => c.id === "cand-supermoon-duplikat");
  assert.ok(duplicate);

  const history = historyFrom([
    {
      title: original.title,
      mainTopic: original.thesis,
      angle: original.angle,
      hook: original.hook,
      category: original.category,
    },
  ]);

  const result = selectBestTopic([duplicate], { history, nowMs });
  assert.equal(result.chosen, null, "duplikat tidak boleh dipilih");
  const rejection = result.rejected[0];
  assert.ok(rejection, "harus ada alasan penolakan");
  assert.ok(
    rejection.reasons.some((r) => r.includes("mirip") || r.includes("sudut")),
    rejection.reasons.join(" | ")
  );
});

test("menolak sudut yang sama walau judul dan kategori berbeda", () => {
  const candidate = CANDIDATE_BANK[2];
  const history = historyFrom([
    {
      title: "Judul yang sama sekali berbeda tentang indeks pembangunan",
      mainTopic: "Kesehatan, pendidikan, dan pengeluaran digabung jadi satu angka",
      angle: candidate.angle,
      hook: "Hook lain sama sekali",
      category: "sosial",
    },
  ]);
  const scored = scoreTopicCandidate(candidate, history, nowMs);
  assert.ok(scored.repetitionPenalty >= 18, `penalti sudut harus besar, dapat ${scored.repetitionPenalty}`);
});

test("perbandingan memakai jendela 30 episode terakhir", () => {
  assert.equal(HISTORY_COMPARISON_WINDOW, 30);
  const oldRecord = historyFrom([
    {
      episodeId: "lama",
      producedAt: "2020-01-01T00:00:00.000Z",
      title: CANDIDATE_BANK[0].title,
      mainTopic: CANDIDATE_BANK[0].thesis,
      angle: CANDIDATE_BANK[0].angle,
      hook: CANDIDATE_BANK[0].hook,
    },
  ]);
  const filler = historyFrom(
    Array.from({ length: 30 }, (_, i) => ({
      episodeId: `fill-${i}`,
      producedAt: `2026-10-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      title: `Episode lain ${i}`,
      mainTopic: `Pembahasan lain ${i}`,
      angle: `Sudut lain ${i}`,
    }))
  );
  const hits = findSimilarEpisodes(CANDIDATE_BANK[0], [...oldRecord, ...filler]);
  assert.ok(hits.every((h) => h.record.episodeId !== "lama"), "episode di luar 30 terakhir tidak dibandingkan");
});

test("selectBestTopic mengembalikan peringkat + cakupan kategori", () => {
  const result = selectBestTopic(CANDIDATE_BANK, { nowMs });
  assert.ok(result.chosen);
  assert.ok(result.ranked.length >= 3);
  assert.ok(result.score && result.score.total >= MIN_TOPIC_SCORE);
  assert.ok(Array.isArray(result.categoryCoverage));
  assert.ok(result.comparedEpisodes === 0);
});
