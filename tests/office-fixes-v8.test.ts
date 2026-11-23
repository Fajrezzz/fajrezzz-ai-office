import assert from "node:assert/strict";
import test from "node:test";
import {
  ABSOLUTE_MIN_PIXEL_RATIO,
  PIXEL_RATIO_CAPS,
  resolvePixelRatio,
  resolveZoomSharpenedPixelRatio,
} from "../src/lib/perf/render-telemetry.ts";
import { callCentralAIRouter } from "../src/lib/ai/llm-provider.ts";
import {
  FLOOR_2_Y,
  FLOOR_3_Y,
  INITIAL_WORKSTATIONS,
  OFFICE_WAYPOINTS,
} from "../src/lib/data/initial-office-data.ts";
import { ACTIVE_EMPLOYEE_ROSTER } from "../src/lib/config/team-roster.ts";

test("Zoom in menaikkan resolusi render (makin HD), zoom out tidak menurunkannya", () => {
  const deviceDpr = 2.75;
  const base = resolvePixelRatio("balanced", deviceDpr);
  const atFit = resolveZoomSharpenedPixelRatio("balanced", deviceDpr, 100);
  const zoomedIn = resolveZoomSharpenedPixelRatio("balanced", deviceDpr, 160);
  const zoomedOut = resolveZoomSharpenedPixelRatio("balanced", deviceDpr, 45);

  assert.equal(atFit, base, "zoom normal harus sama dengan tier dasar");
  assert.ok(zoomedIn > base, "zoom in harus menaikkan pixel ratio (lebih tajam)");
  assert.ok(
    zoomedOut >= base,
    "zoom out TIDAK boleh menurunkan resolusi (anti blur)"
  );
  assert.ok(zoomedIn <= deviceDpr, "pixel ratio tidak boleh melebihi DPR perangkat");
  assert.ok(
    zoomedIn <= Math.min(deviceDpr, 3),
    "plafon absolut tier (maks 3.0 & tidak melebihi DPR perangkat) dihormati"
  );
  assert.ok(PIXEL_RATIO_CAPS.balanced > 0, "cap tier tetap terdefinisi");
  assert.ok(
    resolveZoomSharpenedPixelRatio("eco", 2.75, 200) >= ABSOLUTE_MIN_PIXEL_RATIO,
    "lantai mutlak pixel ratio 1.0"
  );
});

test("Tanpa API key: router fast-fail NO_PROVIDER_CONFIGURED, tanpa retry & tanpa fallback keyless", async () => {
  const saved = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  let fetchCalls = 0;
  const result = await callCentralAIRouter({
    systemPrompt: "test",
    userPrompt: "test",
    expectJson: false,
    fetchImpl: (async () => {
      fetchCalls += 1;
      throw new Error("tidak boleh dipanggil tanpa key");
    }) as unknown as typeof fetch,
  });

  if (saved.gemini) process.env.GEMINI_API_KEY = saved.gemini;
  if (saved.groq) process.env.GROQ_API_KEY = saved.groq;
  if (saved.openrouter) process.env.OPENROUTER_API_KEY = saved.openrouter;

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "NO_PROVIDER_CONFIGURED");
  assert.equal(result.httpStatus, 503);
  assert.equal(fetchCalls, 0, "tidak ada request jaringan saat key belum ada");
  assert.match(result.hint, /vercel\.com/i);
});

test("Kursi ngopi (wp-seat-*) benar-benar ada di lantai yang sama dengan stafnya", () => {
  const seatIds = Array.from({ length: 15 }, (_, i) => `wp-seat-${String(i + 1).padStart(2, "0")}`);
  for (const id of seatIds) {
    assert.ok(OFFICE_WAYPOINTS[id], `${id} harus ada`);
  }
  for (const emp of ACTIVE_EMPLOYEE_ROSTER) {
    const seat = OFFICE_WAYPOINTS[emp.loungeWaypointId];
    assert.ok(seat, `${emp.id} punya kursi lounge`);
    assert.equal(seat.floor, emp.floor, `${emp.id} kursi harus se-lantai`);
    assert.match(
      emp.loungeWaypointId,
      /^wp-seat-/,
      `${emp.id} idle harus di kursi (duduk), bukan berdiri di koridor`
    );
  }
});

test("Meja staf L3 hanya di sisi KIRI (sisi kanan untuk meeting room & CEO)", () => {
  const l3Desks = INITIAL_WORKSTATIONS.filter((w) => w.floor === 3);
  assert.equal(l3Desks.length, 6);
  for (const desk of l3Desks) {
    assert.ok(
      desk.position[0] < 0.5,
      `${desk.id} ada di sisi kanan L3 (harusnya area meeting/CEO)`
    );
    assert.equal(desk.position[1], FLOOR_3_Y);
  }
  const l2Desks = INITIAL_WORKSTATIONS.filter((w) => w.floor === 2);
  assert.equal(l2Desks.length, 9);
  for (const desk of l2Desks) {
    assert.equal(desk.position[1], FLOOR_2_Y);
  }
});
