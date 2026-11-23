import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCENT_SETS,
  PAPER_TONES,
  buildVisualVariation,
  hashSeed,
  layoutForScene,
  transitionForScene,
  typographyForScene,
} from "../src/lib/pipeline/visual-variation.ts";

const TITLES = [
  "KANTOR AI INI KERJA SENDIRI TANPA MANUSIA",
  "AGEN AI BIKIN VIDEO TIAP HARI",
  "KENAPA AI BISA NGERTI BAHASA KITA",
  "3 HAL YANG HARUS KAMU TAHU SOAL AI",
  "AI INI BELAJAR DARI KESALAHANNYA",
  "KANTOR 3 LANTAI PENUH AGEN AI",
  "BAGAIMANA AI MEMBACA GAMBAR",
  "AI VS MANUSIA: SIAPA LEBIH CEPAT",
  "AGEN AI YANG BISA NGETIK SENDIRI",
  "MASA DEPAN KERJA PAKAI AI",
];

test("v9.2 variasi: hash seed stabil di setiap pemanggilan", () => {
  assert.equal(hashSeed("kantor ai"), hashSeed("kantor ai"));
  assert.notEqual(hashSeed("kantor ai"), hashSeed("kantor ai2"));
  // FNV-1a 32-bit selalu unsigned
  assert.ok(hashSeed("x") >= 0);
  assert.ok(hashSeed("x") <= 0xffffffff);
});

test("v9.2 variasi: episode sama selalu menghasilkan look identik", () => {
  const a = buildVisualVariation(TITLES[0], 31, "AI agents");
  const b = buildVisualVariation(TITLES[0], 31, "AI agents");
  assert.deepEqual(a, b);
  assert.equal(a.label, b.label);
});

test("v9.2 variasi: 10 judul berbeda → minimal 8 look berbeda", () => {
  const labels = TITLES.map((title, i) =>
    buildVisualVariation(title, 21 + i, "AI agents").label
  );
  const distinct = new Set(labels);
  assert.ok(
    distinct.size >= 8,
    `variasi visual terlalu monoton: ${distinct.size} dari ${labels.length} unik → ${labels.join(" | ")}`
  );
});

test("v9.2 variasi: judul beda bernomor sama tetap bisa beda look", () => {
  const a = buildVisualVariation("KANTOR AI INI KERJA SENDIRI", 12);
  const b = buildVisualVariation("BAGAIMANA AI MEMBACA GAMBAR", 12);
  assert.notEqual(a.label, b.label);
});

test("v9.2 variasi: tone kertas & aksen selalu nilai palet yang valid", () => {
  for (const title of TITLES) {
    const v = buildVisualVariation(title, 7);
    assert.ok(Object.values(PAPER_TONES).includes(v.paper));
    assert.ok(Object.values(ACCENT_SETS).includes(v.accent));
    assert.match(v.accent.primary, /^#[0-9A-F]{6}$/i);
    assert.match(v.accent.secondary, /^#[0-9A-F]{6}$/i);
    assert.match(v.accent.tertiary, /^#[0-9A-F]{6}$/i);
    assert.match(v.paper.base, /^#[0-9A-F]{6}$/i);
  }
});

test("v9.2 variasi: episode kelipatan 5 memakai kertas gelap (kontras channel)", () => {
  for (const title of TITLES) {
    const v = buildVisualVariation(title, 35);
    assert.equal(v.paper.id, "charcoal");
    assert.equal(v.paper.isDark, true);
  }
});

test("v9.2 variasi: layout berganti tiap scene dan kembali ke awal tiap 4 scene", () => {
  const v = buildVisualVariation(TITLES[1], 24);
  const modes = [0, 1, 2, 3].map((i) => layoutForScene(v, i));
  assert.equal(new Set(modes).size, 4, `layout tidak berotasi: ${modes.join(",")}`);
  assert.equal(layoutForScene(v, 0), layoutForScene(v, 4));
});

test("v9.2 variasi: tipografi berotasi 3 gaya dan transisi 4 gaya", () => {
  const v = buildVisualVariation(TITLES[2], 22);
  const typos = [0, 1, 2].map((i) => typographyForScene(v, i));
  assert.equal(new Set(typos).size, 3);
  assert.equal(typographyForScene(v, 0), typographyForScene(v, 3));

  const trans = [0, 1, 2, 3].map((i) => transitionForScene(v, i));
  assert.equal(new Set(trans).size, 4);
  assert.equal(transitionForScene(v, 0), transitionForScene(v, 4));
});

test("v9.2 variasi: rotasi kartu & panel offset tetap dalam batas aman", () => {
  for (const title of TITLES) {
    const v = buildVisualVariation(title, 41);
    assert.ok(Math.abs(v.cardRotation) <= 3.4, `rotasi kartu ${v.cardRotation} terlalu besar`);
    assert.ok(v.panelOffset >= 0 && v.panelOffset <= 3);
    assert.ok([0, 3].includes(v.darkSceneEvery));
  }
});
