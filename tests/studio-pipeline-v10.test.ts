import assert from "node:assert/strict";
import test from "node:test";

import { CANDIDATE_BANK } from "../src/lib/studio/candidate-bank.ts";
import { runSkillAudit, type SkillAuditStatus } from "../src/lib/studio/skill-audit.ts";
import {
  appendTopicHistory,
  createMemoryBackend,
  loadTopicHistory,
  recentWindow,
  summarizeHistory,
} from "../src/lib/studio/topic-history.ts";
import {
  detectCapabilities,
  runAutopilotPipeline,
} from "../src/lib/studio/autopilot-pipeline.ts";
import type { TopicHistoryRecord } from "../src/lib/studio/topic-intelligence.ts";

const root = process.cwd();
const now = new Date("2026-11-23T00:00:00.000Z");

test("audit skill: total mengikuti registry, bukan angka hardcode", () => {
  const audit = runSkillAudit({ rootDir: root });
  assert.equal(audit.totalRegistered, 26);
  const sum = Object.values(audit.counts).reduce((a, b) => a + b, 0);
  assert.equal(sum, audit.totalRegistered, "setiap skill harus punya tepat satu status");
  assert.equal(audit.verifiedActiveCount, audit.counts.VERIFIED_ACTIVE);
  assert.ok(audit.counts.VERIFIED_ACTIVE < 26, "tidak boleh mengklaim 26/26 aktif");
  assert.ok(audit.honestSummary.includes("BLOCKED"));
});

test("VERIFIED_ACTIVE wajib punya probe yang benar-benar jalan dan lulus", () => {
  const audit = runSkillAudit({ rootDir: root });
  const active = audit.entries.filter((e) => e.status === "VERIFIED_ACTIVE");
  assert.ok(active.length >= 3, `hanya ${active.length} skill terverifikasi`);
  for (const entry of active) {
    assert.ok(entry.probes.length > 0, `${entry.id} tanpa probe`);
    assert.ok(
      entry.probes.every((p) => p.ran && p.passed),
      `${entry.id}: ${JSON.stringify(entry.probes)}`
    );
    assert.ok(entry.filesFound.length > 0);
  }
});

test("BLOCKED wajib menyebut alasan, REGISTERED_ONLY tidak boleh punya probe lulus", () => {
  const audit = runSkillAudit({ rootDir: root });
  for (const entry of audit.entries.filter((e) => e.status === "BLOCKED")) {
    assert.ok(entry.blockedReason && entry.blockedReason.length > 10, `${entry.id} tanpa alasan`);
  }
  for (const entry of audit.entries.filter((e) => e.status === "REGISTERED_ONLY")) {
    // ALASAN harus eksplisit: entah file tidak ada, rujukan 0, atau direktif
    // tidak masuk prompt. Yang penting: tidak ada bukti eksekusi yang lulus.
    const hasReason =
      entry.filesMissing.length > 0 ||
      entry.filesFound.length === 0 ||
      entry.evidence.some((e) => /Rujukan kode: 0\//.test(e)) ||
      entry.evidence.some((e) => /TIDAK muncul/.test(e));
    assert.ok(hasReason, `${entry.id}: ${entry.evidence.join(" | ")}`);
    assert.equal(entry.probes.some((p) => p.ran && p.passed), false, `${entry.id} tidak boleh punya probe lulus`);
  }
  const rea = audit.entries.find((e) => e.id === "rea-reverse-engineering");
  assert.equal(rea?.status, "INCOMPATIBLE");
});

test("status audit stabil antar pemanggilan (tidak acak)", () => {
  const a = runSkillAudit({ rootDir: root });
  const b = runSkillAudit({ rootDir: root });
  assert.deepEqual(
    a.entries.map((e) => [e.id, e.status]),
    b.entries.map((e) => [e.id, e.status])
  );
  const statuses: SkillAuditStatus[] = a.entries.map((e) => e.status);
  assert.ok(statuses.every((s) => typeof s === "string" && s === s.toUpperCase()));
});

test("riwayat topik: append idempoten per episode & jendela 30", async () => {
  const backend = createMemoryBackend();
  const base: TopicHistoryRecord = {
    episodeId: "ep-1",
    episodeNumber: 1,
    producedAt: "2026-11-01T00:00:00.000Z",
    title: "A",
    mainTopic: "A",
    category: "sains",
    angle: "a",
    hook: "a",
    summary: "a",
    sources: ["https://x.id"],
    storyFormat: "hook",
    visualStyle: "kinetic",
    status: "draft",
  };
  await appendTopicHistory(backend, base);
  await appendTopicHistory(backend, base);
  let loaded = await loadTopicHistory(backend);
  assert.equal(loaded.records.length, 1, "episode yang sama tidak boleh dobel");
  assert.equal(loaded.durability, "ephemeral");
  assert.ok(loaded.note.includes("hilang"));

  for (let i = 2; i <= 45; i += 1) {
    await appendTopicHistory(backend, {
      ...base,
      episodeId: `ep-${i}`,
      episodeNumber: i,
      producedAt: `2026-11-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    });
  }
  loaded = await loadTopicHistory(backend);
  assert.equal(loaded.records.length, 45);
  assert.equal(recentWindow(loaded.records).length, 30);
  const summary = summarizeHistory(loaded.records);
  assert.equal(summary.total, 45);
  assert.equal(summary.byCategory[0].category, "sains");
});

test("keterbatasan environment dilaporkan apa adanya", () => {
  const caps = detectCapabilities({});
  assert.equal(caps.llm.any, false);
  assert.equal(caps.ffmpeg, false);
  assert.equal(caps.network, false);
  assert.ok(caps.notes.length >= 3);
  const withKey = detectCapabilities({ GEMINI_API_KEY: "dummy" });
  assert.equal(withKey.llm.gemini, true);
  assert.equal(withKey.llm.any, true);
});

test("pipeline Auto-Pilot mencatat 14 tahap dan TIDAK mengklaim MP4 jadi", () => {
  const audit = runSkillAudit({ rootDir: root });
  const run = runAutopilotPipeline({
    candidates: CANDIDATE_BANK,
    history: [],
    capabilities: detectCapabilities({ GEMINI_API_KEY: "dummy" }),
    skillAudit: audit,
    episodesToBuild: 3,
    now,
  });

  const stages = new Set(run.stages.map((s) => s.stage));
  for (const required of [
    "trend_discovery",
    "topic_selection",
    "source_verification",
    "script_generation",
    "script_review",
    "creative_blueprint",
    "storyboard",
    "visual_asset_generation",
    "voice_generation",
    "subtitle",
    "remotion_composition",
    "ffmpeg_export",
    "quality_control",
    "final_mp4",
  ]) {
    assert.ok(stages.has(required), `tahap ${required} tidak tercatat`);
  }

  assert.equal(run.episodes.length, 3);
  const final = run.stages.filter((s) => s.stage === "final_mp4");
  assert.ok(final.every((s) => s.status === "blocked"), "MP4 tidak boleh diklaim selesai");
  assert.ok(final.every((s) => s.output.produced === false));
  assert.equal(run.finalStatus, "blocked");
  assert.ok(run.honestSummary.includes("BLOCKED"));

  const blocked = run.stages.filter((s) => s.status === "blocked");
  assert.ok(blocked.every((s) => s.error && s.error.length > 10));

  // Tidak ada tahap yang mengaku ok padahal output kosong.
  for (const stage of run.stages.filter((s) => s.status === "ok")) {
    assert.ok(Object.keys(stage.output).length > 0, `${stage.stage} ok tanpa output`);
  }
});

test("tiga episode pipeline berbeda kategori, blueprint, dan editing", () => {
  const run = runAutopilotPipeline({
    candidates: CANDIDATE_BANK,
    capabilities: detectCapabilities({}),
    episodesToBuild: 3,
    now,
  });
  const categories = new Set(run.episodes.map((e) => e.candidate.category));
  assert.equal(categories.size, 3);
  const signatures = new Set(run.episodes.map((e) => e.blueprint.signature));
  assert.equal(signatures.size, 3);
  const editing = new Set(run.episodes.map((e) => e.editingPlan.signature));
  assert.equal(editing.size, 3);
  for (const episode of run.episodes) {
    assert.ok(episode.qc.ok, JSON.stringify(episode.qc.checks.filter((c) => !c.ok)));
  }
});

test("pipeline menolak duplikat dan menandai butuh riset ulang", () => {
  const duplicate = CANDIDATE_BANK.find((c) => c.id === "cand-supermoon-duplikat");
  assert.ok(duplicate);
  const history: TopicHistoryRecord[] = [
    {
      episodeId: "old",
      episodeNumber: 1,
      producedAt: "2026-11-20T00:00:00.000Z",
      title: CANDIDATE_BANK[0].title,
      mainTopic: CANDIDATE_BANK[0].thesis,
      category: "sains",
      angle: CANDIDATE_BANK[0].angle,
      hook: CANDIDATE_BANK[0].hook,
      summary: CANDIDATE_BANK[0].thesis,
      sources: CANDIDATE_BANK[0].sources.map((s) => s.url),
      storyFormat: "hook",
      visualStyle: "kinetic",
      status: "published",
    },
  ];
  const run = runAutopilotPipeline({
    candidates: [duplicate],
    history,
    capabilities: detectCapabilities({}),
    episodesToBuild: 1,
    now,
  });
  assert.equal(run.episodes.length, 0);
  const selection = run.stages.find((s) => s.stage === "topic_selection");
  assert.equal(selection?.status, "failed");
  assert.match(String(selection?.error), /riset/i);
});
