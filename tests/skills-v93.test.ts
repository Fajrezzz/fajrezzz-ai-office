import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHumanizerPromptBlock,
  detectAiTells,
  humanizeSceneNarrations,
  humanizeText,
  humanizerScore,
} from "../src/lib/ai/writing-humanizer.ts";
import {
  DESIGN_PLAYBOOKS,
  auditDesign,
  buildDesignPromptBlock,
  contrastRatio,
  relativeLuminance,
  wcagLevel,
} from "../src/lib/ai/design-intelligence.ts";
import {
  RECENCY_WINDOW_DAYS,
  buildRecencyPromptBlock,
  classifyRecency,
  daysBetween,
  pickFreshSources,
  sortByRecency,
  summarizeRecency,
} from "../src/lib/ai/research-recency.ts";

const NOW = "2026-11-23T10:00:00.000Z";

/* ------------------------------ HUMANIZER ------------------------------ */

test("v9.3 humanizer: mendeteksi frasa template AI", () => {
  const text =
    "Sebagai AI, saya bisa bilang: di era digital ini, bukan hanya cepat tetapi juga murah. Penting untuk diingat!!";
  const tells = detectAiTells(text);
  const ids = tells.map((t) => t.id);
  assert.ok(ids.includes("pembuka-asisten"));
  assert.ok(ids.includes("era-digital"));
  assert.ok(ids.includes("bukan-hanya-tetapi"));
  assert.ok(ids.includes("tanda-seru-berlebih"));
  assert.ok(tells.length >= 4);
});

test("v9.3 humanizer: teks manusia yang wajar tidak ditandai", () => {
  const text = "Gua coba tools ini semalem. Hasilnya beda jauh, cepat tapi masih salah kalau prompt-nya kabur.";
  assert.deepEqual(detectAiTells(text), []);
  assert.equal(humanizerScore(text), 100);
});

test("v9.3 humanizer: perbaikan mekanis menghapus frasa & menaikkan skor", () => {
  const before = "Di era digital ini, mari kita lihat. Penting untuk diingat bahwa AI itu cepat!!";
  const result = humanizeText(before);
  assert.ok(result.score > humanizerScore(before), "skor harus naik setelah dibersihkan");
  assert.doesNotMatch(result.text, /di era digital/i);
  assert.doesNotMatch(result.text, /mari kita/i);
  assert.doesNotMatch(result.text, /penting untuk diingat/i);
  assert.doesNotMatch(result.text, /!!/);
  assert.ok(result.text.length > 0);
});

test("v9.3 humanizer: 'bukan hanya X tetapi juga Y' disederhanakan tanpa membuang makna", () => {
  const result = humanizeText("Fitur ini bukan hanya cepat tetapi juga hemat biaya.");
  assert.match(result.text.toLowerCase(), /cepat dan hemat biaya/);
});

test("v9.3 humanizer: em dash berlebih dikurangi, sekali masih boleh", () => {
  const long =
    "Aku buka laptop — cek task — agent jalan — hasil muncul — beres. Semua otomatis dan cepat sekali tanpa drama.";
  const result = humanizeText(long);
  const dashes = (result.text.match(/—/g) ?? []).length;
  assert.ok(dashes <= 1, `em dash sisa ${dashes}`);
});

test("v9.3 humanizer: narasi scene dibersihkan sekaligus + skor rata-rata", () => {
  const scenes = [
    { narration: "Sebagai AI, saya sarankan ini." },
    { narration: "Gua coba tadi pagi, hasilnya rapi." },
  ];
  const out = humanizeSceneNarrations(scenes);
  assert.equal(out.scenes.length, 2);
  assert.equal(out.cleaned, 1);
  assert.ok(out.averageScore > 0 && out.averageScore <= 100);
  assert.doesNotMatch(out.scenes[0].narration, /sebagai ai/i);
});

test("v9.3 humanizer: prompt block menyebut larangan konkret", () => {
  const block = buildHumanizerPromptBlock();
  assert.match(block, /Sebagai AI/);
  assert.match(block, /em dash/);
});

/* -------------------------- DESIGN INTELLIGENCE ------------------------ */

test("v9.3 design: kontras WCAG dihitung benar", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#FFF", "#000"), 21);
  const lum = relativeLuminance("#FFFFFF");
  assert.ok(lum !== null && Math.abs(lum - 1) < 1e-6);
  assert.equal(relativeLuminance("bukan-hex"), null);
  assert.equal(contrastRatio("#12345", "#FFFFFF"), null);
});

test("v9.3 design: level WCAG sesuai ambang 4.5 dan 7", () => {
  assert.equal(wcagLevel(21), "AAA");
  assert.equal(wcagLevel(4.6), "AA");
  assert.equal(wcagLevel(3.2), "AA-large");
  assert.equal(wcagLevel(2.1), "gagal");
});

test("v9.3 design: palet studio konten kita sendiri lulus audit", () => {
  const result = auditDesign({ playbook: "content-studio" });
  assert.equal(result.playbook, "content-studio");
  assert.equal(result.checkedPairs, 3);
  assert.ok(
    result.issues.every((i) => i.severity !== "error"),
    `masih ada error: ${JSON.stringify(result.issues)}`
  );
});

test("v9.3 design: kontras rendah & target sentuh kecil ditandai", () => {
  const result = auditDesign({
    pairs: [{ label: "Teks gelap di gelap", fg: "#111111", bg: "#0B1220" }],
    minTapPx: 28,
    minTextPx: 9,
  });
  assert.equal(result.passed, false);
  const ids = result.issues.map((i) => i.id);
  assert.ok(ids.some((id) => id.startsWith("kontras:")));
  assert.ok(ids.includes("tap-target"));
  assert.ok(ids.includes("ukuran-teks"));
});

test("v9.3 design: warna panel Kids Studio yang dipakai sekarang lulus audit", () => {
  // Warna nyata dari kartu-kartu panel (slate-950 + cyan + teks slate-300).
  const result = auditDesign({
    playbook: "content-studio",
    pairs: [
      { label: "Teks utama panel", fg: "#F8FAFC", bg: "#020617" },
      { label: "Teks sekunder panel", fg: "#94A3B8", bg: "#020617" },
      { label: "Label cyan", fg: "#67E8F9", bg: "#0B1220" },
      { label: "Teks emas preset aktif", fg: "#0A0A0B", bg: "#FBBF24" },
    ],
    minTapPx: 44,
    minTextPx: 10,
  });
  assert.ok(
    result.issues.every((i) => i.id !== "tap-target"),
    "tombol HUD harus ≥44px"
  );
  assert.equal(result.passed, true, JSON.stringify(result.issues));
});

test("v9.3 design: prompt block memuat palet & aturan 44px", () => {
  const block = buildDesignPromptBlock("video-editor");
  assert.match(block, /44px/);
  assert.match(block, new RegExp(DESIGN_PLAYBOOKS["video-editor"].palette.accent));
  assert.match(block, /4\.5:1/);
});

/* --------------------------- RESEARCH RECENCY -------------------------- */

test("v9.3 recency: klasifikasi fresh / current / stale / unknown", () => {
  assert.equal(classifyRecency("2026-11-20", NOW), "fresh");
  assert.equal(classifyRecency("2026-11-01", NOW), "current");
  assert.equal(classifyRecency("2026-09-01", NOW), "stale");
  assert.equal(classifyRecency(null, NOW), "unknown");
  assert.equal(classifyRecency("bukan-tanggal", NOW), "unknown");
});

test("v9.3 recency: selisih hari dihitung tanpa NaN", () => {
  assert.equal(daysBetween("2026-11-13T10:00:00.000Z", NOW), 10);
  assert.equal(daysBetween("2026-11-23T10:00:00.000Z", NOW), 0);
  assert.equal(daysBetween("nope", NOW), null);
});

test("v9.3 recency: ringkasan menghitung rasio kesegaran & verdict jujur", () => {
  const summary = summarizeRecency(
    [
      { name: "A", publishedAt: "2026-11-21" },
      { name: "B", publishedAt: "2026-11-10" },
      { name: "C", publishedAt: "2026-08-01" },
      { name: "D" },
    ],
    NOW
  );
  assert.equal(summary.total, 4);
  assert.equal(summary.fresh, 1);
  assert.equal(summary.current, 1);
  assert.equal(summary.stale, 1);
  assert.equal(summary.unknown, 1);
  assert.equal(summary.freshnessRatio, 0.67);
  assert.match(summary.verdict, /Campuran/);
  assert.ok(summary.oldestDays !== null && summary.oldestDays > RECENCY_WINDOW_DAYS);
});

test("v9.3 recency: semua sumber basi → verdict memperingatkan", () => {
  const summary = summarizeRecency([{ name: "lama", publishedAt: "2026-01-01" }], NOW);
  assert.equal(summary.stale, 1);
  assert.match(summary.verdict, /lebih tua dari/);
});

test("v9.3 recency: tanpa tanggal tidak diklaim segar", () => {
  const summary = summarizeRecency([{ name: "x" }, { name: "y" }], NOW);
  assert.equal(summary.freshnessRatio, 0);
  assert.match(summary.verdict, /Tanggal sumber belum tersedia/);
});

test("v9.3 recency: sort & pick mendahulukan sumber segar", () => {
  const sources = [
    { name: "lama", publishedAt: "2026-06-01" },
    { name: "baru", publishedAt: "2026-11-22" },
    { name: "tengah", publishedAt: "2026-11-05" },
    { name: "tanpa" },
  ];
  const sorted = sortByRecency(sources);
  assert.equal(sorted[0].name, "baru");
  assert.equal(sorted[sorted.length - 1].name, "tanpa");

  const picked = pickFreshSources(sources, 2, NOW);
  assert.equal(picked.picked.length, 2);
  assert.equal(picked.picked[0].name, "baru");
  assert.ok(picked.droppedStale >= 1);
});

test("v9.3 recency: prompt block menyebut jendela 30 hari & larangan mengarang tanggal", () => {
  const block = buildRecencyPromptBlock(NOW);
  assert.match(block, /30 hari/);
  assert.match(block, /2026-11-23/);
  assert.match(block, /Dilarang mengarang tanggal/);
});
