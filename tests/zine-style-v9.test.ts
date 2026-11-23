import assert from "node:assert/strict";
import test from "node:test";
import {
  ZINE_STYLE_ID,
  isZineStyle,
  zineCardRotation,
  zineGlitchOffset,
  zineHeadlineFontPx,
  zinePunchScale,
  zineSplitHeadline,
} from "../src/lib/pipeline/zine-style.ts";
import { resolveVisualStyle } from "../src/lib/pipeline/motion-renderer.ts";
import {
  FAJREZZZ_CINEMATIC_PRESETS,
  autoSelectCinematicPresetForTopic,
  getCinematicPresetById,
} from "../src/lib/pipeline/cinematic-presets.ts";

test("v9 zine split headline: jumlah baris dibatasi & kata tidak hilang", () => {
  const text = "KANTOR AI INI KERJA SENDIRI TANPA MANUSIA";
  const lines = zineSplitHeadline(text, 3);
  assert.ok(lines.length >= 1 && lines.length <= 3);
  assert.equal(lines.join(" ").replace(/\s+/g, " "), text);
});

test("v9 zine split headline: tidak menyisakan kata sambung sendirian di baris akhir", () => {
  const lines = zineSplitHeadline("AGEN BARU DAN", 3);
  assert.notEqual(lines[lines.length - 1].toLowerCase(), "dan");
});

test("v9 zine font raksasa: selalu berada dalam batas frame", () => {
  const px = zineHeadlineFontPx("KANTOR", 1080, 0.98);
  assert.ok(px >= 28);
  assert.ok(px <= 1080 * 0.34);
});

test("v9 zine punch-in: mulai 1.1 lalu settle ke 1.0", () => {
  assert.ok(Math.abs(zinePunchScale(0) - 1.1) < 1e-6);
  assert.ok(Math.abs(zinePunchScale(2) - 1) < 1e-6);
  assert.ok(zinePunchScale(0.1) > zinePunchScale(0.3));
});

test("v9 zine glitch: RGB split hanya di awal/akhir scene", () => {
  const intro = zineGlitchOffset(0.02, 2.0, 1080);
  const middle = zineGlitchOffset(1.0, 2.0, 1080);
  assert.ok(intro.split > 0);
  assert.equal(middle.split, 0);
  assert.equal(middle.dx, 0);
});

test("v9 zine rotasi kartu deterministik dan halus", () => {
  assert.equal(zineCardRotation(3), zineCardRotation(3));
  for (let i = 0; i < 12; i++) {
    assert.ok(Math.abs(zineCardRotation(i)) <= 4);
  }
});

test("v9 zine style id dikenali renderer", () => {
  assert.equal(ZINE_STYLE_ID, "zine_glitch");
  assert.ok(isZineStyle("zine_glitch"));
  assert.ok(!isZineStyle("dark_ai_cinematic"));
});

test("v9 look signature channel jadi default, preset lain tetap bisa dipilih eksplisit", () => {
  assert.equal(resolveVisualStyle(undefined, "Topik AI hari ini"), "zine_glitch");
  assert.equal(resolveVisualStyle("cyberpunk_dev", "apa pun"), "cyberpunk_dev");
  assert.equal(
    resolveVisualStyle(undefined, "Preset: X | Style: minimal_kinetic | Cut: 2s"),
    "minimal_kinetic"
  );
});

test("v9 preset cinematic zine terdaftar & terpilih untuk brief kolase", () => {
  const preset = getCinematicPresetById("zine_glitch_editorial");
  assert.equal(preset.mappedVisualStyle, "zine_glitch");
  assert.equal(preset.motionSettings.avgSceneDurationSec < 2.2, true);
  assert.equal(
    autoSelectCinematicPresetForTopic("Zine collage glitch kinetic").id,
    "zine_glitch_editorial"
  );
  assert.equal(
    FAJREZZZ_CINEMATIC_PRESETS.filter((p) => p.mappedVisualStyle === "zine_glitch").length,
    1
  );
});
