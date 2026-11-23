import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  FLOOR_THREE_FURNITURE,
  FLOOR_TWO_FURNITURE,
  INTERIOR_SEATS,
  RESERVED_ZONES,
  auditFurnitureLayout,
} from "../src/lib/office3d/interior-layout.ts";

/**
 * v9.4 — koreksi tata letak kantor 3D berdasarkan 10 screenshot HP Bos.
 *
 * Permintaan yang diuji di sini:
 *  1. L1: area gym (treadmill/barbell/bench) dihapus.
 *  2. L2: meja ngopi/idle (coffee bar + pod) menempel ke dinding, bukan di tengah.
 *  3. L2: jumlah pot dikurangi.
 *  4. L3: kursi yang tampak melayang/mau jatuh diganti pouf yang menapak lantai.
 *  5. L3: lounge memakai sofa modular + meja bulat (referensi Bos).
 *  6. Atap: kursi/sofa sky lounge dihapus.
 *  7. L3: pot di jalur dek dihapus.
 */

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const activityRooms = read("src/components/office3d/InteriorActivityRooms.tsx");
const architecture = read("src/components/office3d/OfficeArchitecture.tsx");
const skyDeck = read("src/components/office3d/CrownSkyDeck.tsx");
const furnishing = read("src/components/office3d/InteriorFurnishing.tsx");
const simContext = read("src/store/SimulatorContext.tsx");

test("v9.4 L1: peralatan gym benar-benar hilang, simulator balap tetap ada", () => {
  assert.doesNotMatch(activityRooms, /Treadmill/i);
  assert.doesNotMatch(activityRooms, /barbell/i);
  assert.doesNotMatch(activityRooms, /Weight Bench/i);
  assert.doesNotMatch(activityRooms, /EXECUTIVE GYM/i);
  assert.match(activityRooms, /Racing Simulator/i);
  // rig simulator menapak platform, bukan kotak melayang
  assert.match(activityRooms, /Platform rig/);
  // label lokasi tidak lagi menyebut gym
  assert.doesNotMatch(simContext, /Gym & Arcade/);
  assert.match(simContext, /Arcade & Racing Sim/);
});

test("v9.4 L2: coffee bar & pod digeser menempel dinding samping", () => {
  assert.match(architecture, /ARTISAN COFFEE & LOUNGE BAR \(X = -17\.6\)/i);
  assert.match(architecture, /group position=\{\[-17\.6, FLOOR_2_Y, -4\.6\]\}/);
  assert.match(architecture, /group position=\{\[17\.6, FLOOR_2_Y, -4\.6\]\}/);

  const pods = FLOOR_TWO_FURNITURE.filter((f) => f.kind === "huddle_pod");
  assert.equal(pods.length, 2);
  for (const pod of pods) {
    assert.ok(
      Math.abs(Math.abs(pod.position[0]) - 13.8) < 0.01,
      `pod harus di sisi (x = ±13.8), dapat ${pod.position[0]}`
    );
  }

  const westZone = RESERVED_ZONES.find((z) => z.label === "coffee-bar-west");
  const eastZone = RESERVED_ZONES.find((z) => z.label === "coffee-bar-east");
  assert.ok(westZone && eastZone);
  assert.ok(westZone.x[0] <= -18.5 && westZone.x[1] >= -16.6, "zona coffee bar barat ikut pindah");
  assert.ok(eastZone.x[0] <= 16.6 && eastZone.x[1] >= 18.5, "zona coffee bar timur ikut pindah");
});

test("v9.4 L2: pot lantai dikurangi dan tidak ada pot yang berdiri di area pod", () => {
  const l2Planters = [...architecture.matchAll(/IndoorPlanter position=\{\[(-?[\d.]+), FLOOR_2_Y/g)];
  assert.equal(l2Planters.length, 1, `L2 harus sisa 1 pot IndoorPlanter, dapat ${l2Planters.length}`);
  const l2x = Number(l2Planters[0][1]);
  for (const pod of FLOOR_TWO_FURNITURE.filter((f) => f.kind === "huddle_pod")) {
    assert.ok(
      Math.abs(l2x - pod.position[0]) > 1.5,
      "pot tidak boleh menempel di pod"
    );
  }
});

test("v9.4 L3: pot di jalur dek hilang, tidak ada IndoorPlanter di lantai 3", () => {
  assert.doesNotMatch(architecture, /IndoorPlanter position=\{\[[-\d.]+, FLOOR_3_Y/);
  assert.doesNotMatch(architecture, /IndoorPlanter position=\{\[0\.4, FLOOR_3_Y/);
  const l3Planters = FLOOR_THREE_FURNITURE.filter((f) => f.kind === "planter");
  assert.equal(l3Planters.length, 1, "L3 hanya menyisakan 1 pot di sudut mati");
  const [px, pz] = l3Planters[0].position;
  assert.ok(px < -16 && pz < -7.5, "pot L3 dipindah ke sudut belakang, bukan jalur dek");
});

test("v9.4 L3: kursi dek diganti pouf menapak lantai (tanpa celah penyangga)", () => {
  // kursi lama: base 0.04 + dudukan di 0.44 tanpa penyangga → ada celah 0.3 m
  assert.doesNotMatch(architecture, /position=\{\[0, 0\.44, 0\]\} castShadow>\s*<boxGeometry args=\{\[0\.52, 0\.1, 0\.5\]\}/);
  // armchair balkon L2 juga disambung penyangga (tidak lagi melayang)
  assert.match(architecture, /disambung tiang penyangga penuh/);
  assert.doesNotMatch(architecture, /l3-staff-seat-\$\{si\}`\} position=\{\[sx, FLOOR_3_Y, 3\.2\]\}>\s*\{?\/\* base \*\//);
  assert.match(architecture, /pouf modular kuning–abu/i);
  // meja kopi dek sekarang bulat (bukan meja panjang 1.9 x 0.8)
  assert.doesNotMatch(architecture, /args=\{\[1\.9, 0\.07, 0\.8\]\}/);
  assert.match(architecture, /meja kopi bulat putih/i);
});

test("v9.4 L3: lounge memakai sectional modular + meja bulat, armchair melayang dihapus", () => {
  const lounge = furnishing.slice(
    furnishing.indexOf("export function LoungeSofaSet"),
    furnishing.indexOf("/** Papan tulis kaca")
  );
  assert.ok(lounge.length > 500, "LoungeSofaSet harus ada");
  assert.doesNotMatch(lounge, /ARMCHAIR/);
  assert.match(lounge, /Baris punggung/);
  assert.match(lounge, /Sayap L/);
  assert.match(lounge, /RoundTable/);
  assert.match(lounge, /Pouf/);
  // semua modul punya alas yang menyentuh lantai (y kecil), bukan dudukan di 0.34 tanpa kaki
  assert.doesNotMatch(lounge, /position=\{\[0, 0\.34, 0\]\} castShadow receiveShadow>\s*<boxGeometry args=\{\[0\.82, 0\.26, 0\.8\]\}/);

  const sofa = FLOOR_THREE_FURNITURE.find((f) => f.kind === "sofa_lounge");
  assert.ok(sofa);
  assert.deepEqual(sofa.footprint, { w: 5.6, d: 3.4 });
});

test("v9.4 atap: sofa/meja sky lounge dihapus, dek hanya helipad + badminton", () => {
  assert.doesNotMatch(skyDeck, /Sky lounge sofa/);
  assert.doesNotMatch(skyDeck, /color="#f4efe6"/);
  assert.match(skyDeck, /RooftopAttractions/);
});

test("v9.4: audit tata letak L2 & L3 tetap bersih setelah semua pergeseran", () => {
  for (const items of [FLOOR_TWO_FURNITURE, FLOOR_THREE_FURNITURE]) {
    const audit = auditFurnitureLayout(items);
    assert.equal(audit.ok, true, audit.problems.join(" | "));
  }
  // titik duduk pod L2 ikut bergeser bersama podnya
  for (const seat of INTERIOR_SEATS.filter((s) => s.id.startsWith("l2-pod"))) {
    assert.ok(Math.abs(Math.abs(seat.position[0]) - 13.8) < 0.01, `${seat.id} belum ikut geser`);
  }
});
