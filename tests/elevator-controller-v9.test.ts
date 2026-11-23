import assert from "node:assert/strict";
import test from "node:test";
import {
  LIFT_TIMING,
  createLiftState,
  liftCabinY,
  liftDirection,
  liftEtaSec,
  liftStatusSnapshot,
  requestLiftFloor,
  stepLift,
  type LiftFloor,
  type LiftState,
} from "../src/lib/office3d/elevator-controller.ts";

const FLOOR_Y: Record<LiftFloor, number> = { 1: 0, 2: 3.9, 3: 7.8 };

/** Jalankan lift sampai kondisi terpenuhi (dengan batas aman). */
function runUntil(
  state: LiftState,
  predicate: (s: LiftState) => boolean,
  maxSec = 40
): LiftState {
  let s = state;
  let t = 0;
  const dt = 1 / 60;
  while (t < maxSec && !predicate(s)) {
    s = stepLift(s, dt);
    t += dt;
  }
  return s;
}

test("v9.3 lift: tombol lantai memindahkan kabin ke lantai tujuan", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 3);
  s = runUntil(s, (v) => v.floor === 3 && v.phase === "dwell");
  assert.equal(s.floor, 3);
  assert.equal(s.trips, 1);
  assert.equal(s.doorOpen, 1);
});

test("v9.3 lift: pintu buka-tutup tidak pernah melompat (0 → 1 → 0)", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 1); // sudah di lantai 1 → pintu buka
  s = stepLift(s, 0.1); // frame pertama: idle → doors_opening
  s = stepLift(s, 0.1);
  assert.ok(s.doorOpen > 0 && s.doorOpen < 1, "pintu harus membuka perlahan");
  s = runUntil(s, (v) => v.phase === "dwell");
  assert.equal(s.doorOpen, 1);
  s = runUntil(s, (v) => v.phase === "idle");
  assert.equal(s.doorOpen, 0);
});

test("v9.3 lift: durasi perjalanan 1 lantai sesuai LIFT_TIMING", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 2);
  let t = 0;
  const dt = 1 / 60;
  while (s.phase !== "moving" && t < 10) {
    s = stepLift(s, dt);
    t += dt;
  }
  assert.equal(s.phase, "moving");
  let travelSec = 0;
  while (s.phase === "moving" && travelSec < 10) {
    s = stepLift(s, dt);
    travelSec += dt;
  }
  assert.ok(
    Math.abs(travelSec - LIFT_TIMING.perFloorSec) < 0.1,
    `perjalanan 1 lantai ${travelSec.toFixed(2)} dtk harus ≈ ${LIFT_TIMING.perFloorSec}`
  );
  assert.equal(s.floor, 2);
});

test("v9.3 lift: antrean diproses berurutan tanpa duplikat", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 3);
  s = requestLiftFloor(s, 2);
  s = requestLiftFloor(s, 3); // duplikat → tidak dobel
  assert.deepEqual(s.queue, [3, 2]);
  s = runUntil(s, (v) => v.floor === 3 && v.phase === "dwell");
  assert.equal(s.floor, 3);
  s = runUntil(s, (v) => v.floor === 2 && v.phase === "dwell");
  assert.equal(s.floor, 2);
  assert.equal(s.trips, 2);
});

test("v9.3 lift: ETA masuk akal dan turun saat kabin bergerak", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 3);
  const etaAwal = liftEtaSec(s);
  s = runUntil(s, (v) => v.phase === "moving");
  const etaTengah = liftEtaSec(s);
  assert.ok(etaAwal > etaTengah, `ETA harus turun (${etaAwal} → ${etaTengah})`);
  assert.ok(etaTengah > 0);
  s = runUntil(s, (v) => v.phase === "dwell");
  assert.equal(liftEtaSec(s), 0);
});

test("v9.3 lift: posisi kabin interpolasi mulus, tidak melewati lantai", () => {
  let s = createLiftState(1);
  s = requestLiftFloor(s, 3);
  let prevY = liftCabinY(s, FLOOR_Y);
  let maxY = prevY;
  for (let i = 0; i < 600; i += 1) {
    s = stepLift(s, 1 / 60);
    const y = liftCabinY(s, FLOOR_Y);
    assert.ok(y >= -0.001, "kabin tidak boleh di bawah L1");
    assert.ok(y <= FLOOR_Y[3] + 0.001, "kabin tidak boleh di atas L3");
    if (s.phase === "moving") {
      assert.ok(y >= prevY - 0.001, "saat naik, y harus monoton");
    }
    prevY = y;
    maxY = Math.max(maxY, y);
  }
  assert.ok(Math.abs(maxY - FLOOR_Y[3]) < 0.05, "kabin harus sampai L3");
  assert.equal(s.floor, 3);
});

test("v9.3 lift: arah dilaporkan benar (naik / turun / diam)", () => {
  let s = createLiftState(2);
  assert.equal(liftDirection(s), 0);
  s = requestLiftFloor(s, 1);
  s = runUntil(s, (v) => v.phase === "moving");
  assert.equal(liftDirection(s), -1);
  s = runUntil(s, (v) => v.phase === "dwell");
  assert.equal(liftDirection(s), 0);
});

test("v9.3 lift: ambient auto-cycle hanya jalan kalau idle & autoCycle aktif", () => {
  let s = createLiftState(1);
  for (let i = 0; i < 60 * 8; i += 1) s = stepLift(s, 1 / 60, { autoCycle: false });
  assert.equal(s.phase, "idle");
  assert.equal(s.trips, 0);

  let auto = createLiftState(1);
  for (let i = 0; i < 60 * 8; i += 1) auto = stepLift(auto, 1 / 60, { autoCycle: true });
  assert.ok(auto.trips >= 1, "lift ambient harus bergerak sendiri");
});

test("v9.3 lift: lantai tersembunyi (cutaway) tidak dituju ambient", () => {
  let s = createLiftState(1);
  for (let i = 0; i < 60 * 20; i += 1) {
    s = stepLift(s, 1 / 60, { autoCycle: true, availableFloors: [1, 2] });
  }
  assert.ok(s.floor <= 2, `kabin tidak boleh ke L3 kalau disembunyikan (sekarang L${s.floor})`);
});

test("v9.3 lift: snapshot status siap tampil di HUD", () => {
  const s = requestLiftFloor(createLiftState(1), 2);
  const snap = liftStatusSnapshot(s);
  assert.equal(snap.floor, 1);
  assert.match(snap.label, /Siap · L1/);
  assert.ok(snap.etaSec > 0, "harus ada ETA walau belum jalan");

  // pintu masih tertutup → langsung jalan, tanpa jeda tutup palsu
  const started = stepLift(s, 0.1);
  assert.equal(started.targetFloor, 2);
  assert.equal(started.phase, "moving");
  assert.match(liftStatusSnapshot(started).label, /^Naik ke L2/);

  // kalau pintu sedang terbuka di lantai yang sama, tutup dulu baru jalan
  let openDoors = requestLiftFloor(createLiftState(1), 1);
  openDoors = runUntil(openDoors, (v) => v.phase === "dwell");
  const next = requestLiftFloor(openDoors, 3);
  // pintu masih terbuka → tunggu dwell selesai, lalu tutup dulu sebelum jalan
  const closing = runUntil(next, (v) => v.phase === "doors_closing");
  assert.equal(closing.targetFloor, 3);
  assert.match(liftStatusSnapshot(closing).label, /Pintu menutup/);
  const moving = runUntil(s, (v) => v.phase === "moving");
  const movingSnap = liftStatusSnapshot(moving);
  assert.equal(movingSnap.direction, 1);
  assert.match(movingSnap.label, /^Naik ke L2/);
});

test("v9.3 lift: dt besar tidak merusak state (frame drop di HP)", () => {
  let s = requestLiftFloor(createLiftState(1), 3);
  for (let i = 0; i < 400; i += 1) s = stepLift(s, 0.2); // 200 ms per frame
  assert.ok([1, 2, 3].includes(s.floor));
  assert.ok(s.doorOpen >= 0 && s.doorOpen <= 1);
  assert.equal(s.queue.length, 0);
  assert.ok(s.trips >= 1);
});
