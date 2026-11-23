import assert from "node:assert/strict";
import test from "node:test";

import { CANDIDATE_BANK } from "../src/lib/studio/candidate-bank.ts";
import {
  BRAND_INVARIANTS,
  VISUAL_STYLES,
  blueprintSimilarity,
  buildCreativeBlueprint,
  describeBlueprint,
} from "../src/lib/studio/creative-blueprint.ts";
import { buildEditingPlan, validateEditingPlan } from "../src/lib/studio/dynamic-editing.ts";
import {
  applyMechanicalFixes,
  auditScript,
  buildScriptSkeleton,
  shortenClaim,
  splitLongLine,
  splitSentences,
  wordCount,
} from "../src/lib/studio/script-intelligence.ts";
import { buildEpisodeArtifact, compareEpisodes } from "../src/lib/studio/episode-factory.ts";

const now = new Date("2026-11-23T00:00:00.000Z");

test("12 gaya visual tersedia dan branding tidak berubah", () => {
  assert.equal(VISUAL_STYLES.length, 12);
  assert.equal(BRAND_INVARIANTS.accentHex, "#ff5a1f");
  const bp = buildCreativeBlueprint(CANDIDATE_BANK[0], { episodeIndex: 1 }).blueprint;
  assert.equal(bp.brand.accentHex, BRAND_INVARIANTS.accentHex);
  assert.equal(bp.palette.accent, BRAND_INVARIANTS.accentHex, "aksen brand tidak boleh diganti gaya episode");
  assert.ok(bp.brand.safeZone.bottom >= bp.brand.safeZone.top);
});

test("tiga episode berbeda menghasilkan blueprint berbeda", () => {
  const built = CANDIDATE_BANK.slice(0, 3).map((c, i) =>
    buildCreativeBlueprint(c, { episodeIndex: i + 1 }).blueprint
  );
  for (let i = 0; i < built.length; i += 1) {
    for (let j = i + 1; j < built.length; j += 1) {
      const sim = blueprintSimilarity(built[i], built[j]);
      assert.ok(sim < 0.55, `blueprint ${i} vs ${j} terlalu mirip: ${sim}`);
      assert.notEqual(built[i].signature, built[j].signature);
    }
  }
});

test("anti-template: blueprint bermutasi ketika seed menghasilkan yang sama", () => {
  // Seed sama (episodeIndex sama) → percobaan pertama identik dengan riwayat,
  // jadi harus DITOLAK lalu dimutasi sampai berbeda.
  const history = buildCreativeBlueprint(CANDIDATE_BANK[0], { episodeIndex: 4 });
  const retry = buildCreativeBlueprint(CANDIDATE_BANK[0], {
    episodeIndex: 4,
    history: [history.blueprint],
  });
  const sim = blueprintSimilarity(history.blueprint, retry.blueprint);
  assert.ok(sim < 0.55, `blueprint kedua harus tersaring, dapat ${sim}`);
  assert.ok(retry.attempts.length >= 2, JSON.stringify(retry.attempts));
  assert.ok(retry.attempts.some((a) => !a.accepted), "harus ada percobaan yang ditolak karena mirip");
  assert.ok(retry.blueprint.generationNotes.length > 0);
});

test("storyboard/editing plan valid: tidak ada 3 transisi berat berurutan, scene ≥1.2s", () => {
  for (const candidate of CANDIDATE_BANK) {
    const bp = buildCreativeBlueprint(candidate, { episodeIndex: 1 }).blueprint;
    const plan = buildEditingPlan(bp, candidate, []);
    const validation = validateEditingPlan(plan);
    assert.ok(validation.ok, `${candidate.id}: ${validation.issues.join("; ")}`);
    for (const scene of plan.scenes) assert.ok(scene.durationSec >= 1.2);
    assert.ok(plan.scenes.length >= 4);
    assert.ok(plan.rhythm.avgCutSec >= 1.2, `${candidate.id} avgCut ${plan.rhythm.avgCutSec}`);
    assert.ok(["calm", "steady", "urgent"].includes(plan.rhythm.pace));
  }
});

test("editing plan berubah bila riwayat punya pola yang sama", () => {
  const candidate = CANDIDATE_BANK[1];
  const bp = buildCreativeBlueprint(candidate, { episodeIndex: 1 }).blueprint;
  const plan1 = buildEditingPlan(bp, candidate, []);
  const plan2 = buildEditingPlan(bp, candidate, [plan1.signature]);
  assert.equal(plan2.novelAgainstHistory, true);
  assert.notEqual(plan1.signature, plan2.signature);
});

test("naskah: satu ide utama, kalimat pendek, generator dilabeli jujur", () => {
  const bp = buildCreativeBlueprint(CANDIDATE_BANK[1], { episodeIndex: 1 }).blueprint;
  const script = buildScriptSkeleton(CANDIDATE_BANK[1], bp);
  assert.equal(script.generator, "deterministic-fact-skeleton");
  assert.ok(script.disclaimer?.includes("bukan hasil LLM"));
  assert.ok(script.lines.length >= 5);
  assert.equal(script.lines[0].beat, "hook", "baris pertama harus hook sesuai blueprint");
  for (const line of script.lines) {
    assert.ok(wordCount(line.text) <= 26, `baris terlalu panjang: ${line.text}`);
  }
  const audit = auditScript(script.narration, { sources: script.sources });
  assert.ok(audit.passes, JSON.stringify(audit.findings));
  assert.equal(audit.unsourcedNumbers.length, 0, "angka sudah punya sumber");
});

test("audit menangkap kalimat panjang, angka tanpa sumber, dan klise", () => {
  const bad =
    "Di era digital saat ini tentunya kita semua tahu bahwa kecerdasan buatan akan mengubah seluruh cara manusia bekerja dan belajar di masa depan yang penuh ketidakpastian ini. " +
    "Ada 87 persen orang yang setuju.";
  const audit = auditScript(bad, { sources: [] });
  const codes = audit.findings.map((f) => f.code);
  assert.ok(codes.includes("LONG_SENTENCE"), codes.join(","));
  assert.ok(codes.includes("UNSOURCED_NUMBER"), codes.join(","));
  assert.ok(codes.includes("CLICHE"), codes.join(","));
  assert.equal(audit.passes, false);
  assert.ok(audit.score < 70);
});

test("jargon asing tanpa penjelasan ditandai, bukan diloloskan", () => {
  const audit = auditScript("Phishing itu berbahaya.", { sources: ["https://contoh.id"] });
  assert.ok(audit.jargon.includes("phishing"));
  const explained = auditScript("Phishing adalah situs palsu yang menyamar jadi lembaga resmi.", {
    sources: ["https://contoh.id"],
  });
  assert.equal(explained.findings.some((f) => f.code === "JARGON_UNEXPLAINED"), false);
});

test("pemecah kalimat tidak merusak angka desimal", () => {
  assert.deepEqual(splitSentences("IPM 76,59 dan 0,69 poin."), ["IPM 76,59 dan 0,69 poin."]);
  const parts = splitLongLine(
    "Indeks ini naik 0,69 poin, dengan umur harapan hidup 74,68 tahun, harapan lama sekolah 13,34 tahun dan rata rata lama sekolah 9,16 tahun"
  );
  assert.ok(parts.every((p) => !/\d\.\s\d/.test(p)), parts.join(" | "));
  assert.ok(parts.join(" ").includes("74,68"));
  const short = shortenClaim("Penduduk bekerja naik, sedangkan pengangguran turun tipis");
  assert.ok(short.length >= 1);
});

test("perbaikan mekanis tidak mengubah fakta tapi membuang klise", () => {
  const { text, changes } = applyMechanicalFixes(
    "Di era digital saat ini, ada 3 hal penting. Tentunya kita semua tahu itu."
  );
  assert.ok(!/era digital/i.test(text));
  assert.ok(text.includes("3 hal"));
  assert.ok(changes.length >= 1);
});

test("3 episode utuh berbeda dan QC-nya jujur", () => {
  const episodes = CANDIDATE_BANK.slice(0, 3).map((c, i) =>
    buildEpisodeArtifact(c, { episodeNumber: i + 1, now })
  );
  for (const ep of episodes) {
    assert.ok(ep.subtitleCues.length > 30, "subtitle harus per kata");
    assert.ok(ep.subtitleCues.every((c, i) => i === 0 || c.startSec >= ep.subtitleCues[i - 1].startSec));
    assert.ok(ep.editingPlan.scenes.length >= 4);
    assert.equal(ep.historyRecord.status, "draft");
    assert.ok(ep.summary.blueprintLine.length > 0);
  }
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  for (const [i, j] of pairs) {
    const diff = compareEpisodes(episodes[i], episodes[j]);
    assert.equal(diff.verdict, "berbeda", `${i} vs ${j}: ${diff.notes.join("; ")}`);
    assert.equal(diff.sameEditingSignature, false);
    assert.ok(diff.blueprintSimilarity < 0.55);
  }
});

test("describeBlueprint menyebut komponen wajib sebelum render", () => {
  const bp = buildCreativeBlueprint(CANDIDATE_BANK[2], { episodeIndex: 3 }).blueprint;
  const line = describeBlueprint(bp);
  for (const keyword of ["hook", "musik", "transisi", "s"]) {
    assert.ok(line.toLowerCase().includes(keyword.toLowerCase()), line);
  }
  assert.ok(bp.scenePlan.length >= 4);
});
