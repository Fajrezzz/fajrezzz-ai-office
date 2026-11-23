import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  BUILDING_BOUNDS,
  FLOOR_THREE_FURNITURE,
  FLOOR_TWO_FURNITURE,
  INTERIOR_SEATS,
  RESERVED_ZONES,
  auditFurnitureLayout,
  findInteriorSeat,
  footprintRect,
} from "../src/lib/office3d/interior-layout.ts";
import {
  RALLY_CONTACT_X,
  RALLY_CONTACT_Y,
  computeRally,
  racketAngleAt,
  racketTipPosition,
  signedTimeToContact,
} from "../src/lib/office3d/badminton-rally.ts";

/* ============================ INTERIOR L2 & L3 ============================ */

test("v9 L2 & L3: furnitur tidak keluar gedung dan tidak menabrak zona terpakai", () => {
  for (const items of [FLOOR_TWO_FURNITURE, FLOOR_THREE_FURNITURE]) {
    const audit = auditFurnitureLayout(items);
    assert.equal(audit.ok, true, audit.problems.join(" | "));
  }
});

test("v9 L2: area promenade kiri & kanan benar-benar terisi furnitur", () => {
  const kinds = FLOOR_TWO_FURNITURE.map((f) => f.kind);
  assert.ok(kinds.filter((k) => k === "huddle_pod").length >= 2);
  assert.ok(kinds.includes("whiteboard"));
  assert.ok(kinds.includes("bookshelf"));
  const left = FLOOR_TWO_FURNITURE.filter((f) => f.position[0] < -3 && f.kind !== "rug");
  const right = FLOOR_TWO_FURNITURE.filter((f) => f.position[0] > 3 && f.kind !== "rug");
  assert.ok(left.length >= 3, "sisi kiri L2 harus terisi");
  assert.ok(right.length >= 3, "sisi kanan L2 harus terisi");
});

test("v9 L3: staf di kiri, meeting/CEO di kanan, area kosong terisi", () => {
  const staffSide = FLOOR_THREE_FURNITURE.filter(
    (f) => f.position[0] < -3 && f.kind !== "rug"
  );
  const execSide = FLOOR_THREE_FURNITURE.filter(
    (f) => f.position[0] > 3 && f.kind !== "rug"
  );
  assert.ok(staffSide.length >= 3);
  assert.ok(execSide.length >= 2);
  assert.ok(FLOOR_THREE_FURNITURE.some((f) => f.kind === "sofa_lounge"));
});

test("v9: setiap titik duduk interior punya kursi asli (tidak melayang)", () => {
  assert.ok(INTERIOR_SEATS.length >= 10);
  const chairIds = new Set(INTERIOR_SEATS.map((s) => s.chair));
  assert.equal(chairIds.size, INTERIOR_SEATS.length, "id kursi tidak boleh duplikat");
  for (const seat of INTERIOR_SEATS) {
    const found = findInteriorSeat(seat.floor, seat.position[0], seat.position[1], 0.01);
    assert.ok(found, `kursi untuk ${seat.id} tidak ditemukan`);
    assert.ok(
      Math.abs(found.facingYaw - seat.facingYaw) < 0.01,
      `arah duduk ${seat.id} tidak konsisten`
    );
  }
});

test("v9: avatar eksekutif yang duduk berada tepat di kursi boardroom/CEO", () => {
  const tsx = fs.readFileSync(
    path.join(process.cwd(), "src/components/office3d/OfficeExtrasStaff.tsx"),
    "utf8"
  );
  const blocks = [
    ...tsx.matchAll(
      /id: "([^"]+)",[\s\S]*?floor: (\d),[\s\S]*?position: \[([-\d.]+),[\s\S]*?, ([-\d.]+)\],[\s\S]*?rotationY: ([^,]+),\s*pose: "(seated|standing)"/g
    ),
  ];
  assert.ok(blocks.length >= 12, "entri staf tidak terbaca");
  // L1 memakai sofa lobby (di luar modul interior L2/L3), jadi fokus lantai 2-3
  const seated = blocks.filter((b) => b[6] === "seated" && Number(b[2]) >= 2);
  assert.ok(seated.length >= 4, `hanya ${seated.length} staf duduk L2/L3 terbaca`);
  for (const block of seated) {
    const [, id, floorRaw, xRaw, zRaw] = block;
    const floor = Number(floorRaw) as 2 | 3;
    const x = Number(xRaw);
    const z = Number(zRaw);
    const seat = findInteriorSeat(floor, x, z, 0.4);
    assert.ok(seat, `${id} duduk di (${x}, ${z}) tanpa kursi interior`);
  }
});

test("v9: lantai L3 fokus pada 3 lantai gedung (tanpa furnitur di atas atap)", () => {
  for (const item of [...FLOOR_TWO_FURNITURE, ...FLOOR_THREE_FURNITURE]) {
    assert.ok(item.floor === 2 || item.floor === 3);
    const rect = footprintRect(item);
    assert.ok(rect.x[0] >= BUILDING_BOUNDS.minX && rect.x[1] <= BUILDING_BOUNDS.maxX);
  }
  assert.ok(RESERVED_ZONES.length >= 12);
});

/* ============================= BADMINTON RALLY ============================= */

test("v9 badminton: raket tepat di titik kontak saat kok tiba", () => {
  const cycle = 2.4;
  for (let shot = 0; shot < 6; shot += 1) {
    const tRight = cycle + shot * cycle * 2;
    const frameRight = computeRally(tRight, cycle);
    assert.ok(Math.abs(frameRight.shuttle.x - RALLY_CONTACT_X) < 0.03);
    assert.ok(Math.abs(frameRight.shuttle.y - RALLY_CONTACT_Y) < 0.2);
    assert.ok(frameRight.impact > 0.8, "impact harus menyala saat kontak");

    const tLeft = shot * cycle * 2;
    const frameLeft = computeRally(tLeft, cycle);
    assert.ok(Math.abs(frameLeft.shuttle.x + RALLY_CONTACT_X) < 0.03);
    assert.ok(frameLeft.impact > 0.8);
  }
});

test("v9 badminton: titik kontak raket = posisi kok di sisi masing-masing", () => {
  assert.deepEqual(racketTipPosition(-1), { x: -RALLY_CONTACT_X, y: RALLY_CONTACT_Y });
  assert.deepEqual(racketTipPosition(1), { x: RALLY_CONTACT_X, y: RALLY_CONTACT_Y });
});

test("v9 badminton: ayunan raket kontinu & nyata (backswing → strike → follow-through)", () => {
  const backswing = racketAngleAt(0.3);
  const strike = racketAngleAt(0);
  const follow = racketAngleAt(-0.05);
  assert.ok(backswing < -1.0, "harus ada backswing jelas");
  assert.ok(strike > -1.2 && strike < 0.2);
  assert.ok(follow > strike, "setelah kontak raket lanjut ke depan");
  // kontinuitas: lompatan sudut antar 1ms tidak boleh besar
  let prev = racketAngleAt(0.6);
  for (let d = 0.6; d >= -0.6; d -= 0.001) {
    const cur = racketAngleAt(d);
    assert.ok(Math.abs(cur - prev) < 0.2, `lompatan sudut di d=${d.toFixed(3)}`);
    prev = cur;
  }
});

test("v9 badminton: kok selalu melewati net dan tidak keluar lapangan", () => {
  const cycle = 2.4;
  for (let t = 0; t < cycle * 2; t += 0.05) {
    const frame = computeRally(t, cycle);
    assert.ok(frame.shuttle.y > 1.55, "kok harus di atas net");
    assert.ok(Math.abs(frame.shuttle.x) <= RALLY_CONTACT_X + 0.001);
    assert.ok(Math.abs(frame.shuttle.z) < 1.4);
  }
});

test("v9 badminton: waktu kontak bertanda benar untuk kedua pemain", () => {
  const cycle = 2.4;
  // tepat di kontak kanan → jarak ke kontak kanan = 0
  assert.ok(Math.abs(signedTimeToContact(cycle, cycle, cycle)) < 1e-9);
  // setengah jalan (1.2s) → 1.2s sebelum kontak kanan
  assert.ok(Math.abs(signedTimeToContact(1.2, cycle, cycle) - 1.2) < 1e-9);
});
