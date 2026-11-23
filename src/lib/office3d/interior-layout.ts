/**
 * TATA LETAK FURNITUR INTERIOR L2 & L3 — sumber kebenaran tunggal.
 *
 * Dipakai oleh komponen 3D (`InteriorFurnishing.tsx`) DAN unit test, supaya:
 *  - furnitur tidak menabrak meja kerja / coffee bar / boardroom,
 *  - semua furnitur tetap di dalam gedung (|X| ≤ 18.4, Z −9.4..+5.6),
 *  - area yang dulu kosong (promenade L2, sayap L2, area L3) benar-benar terisi.
 */

export type FurnitureKind =
  | "huddle_pod"
  | "standup_table"
  | "sofa_lounge"
  | "whiteboard"
  | "bookshelf"
  | "planter"
  | "rug";

export interface FurniturePlacement {
  kind: FurnitureKind;
  floor: 2 | 3;
  /** [x, z]; Y ditentukan oleh floor */
  position: [number, number];
  rotationY?: number;
  /** footprint kasar (meter) untuk cek tabrakan */
  footprint: { w: number; d: number };
}

export const BUILDING_BOUNDS = {
  minX: -18.4,
  maxX: 18.4,
  minZ: -9.4,
  maxZ: 5.6,
} as const;

/** Zona terlarang: meja kerja, coffee bar, boardroom, CEO desk, staff deck. */
export const RESERVED_ZONES: Array<{
  label: string;
  floor: 2 | 3;
  x: [number, number];
  z: [number, number];
}> = [
  // L2 — 5 meja kerja
  { label: "ws-01", floor: 2, x: [-10.2, -7.8], z: [-7.4, -5.0] },
  { label: "ws-02", floor: 2, x: [-4.2, -1.8], z: [-7.4, -5.0] },
  { label: "ws-03", floor: 2, x: [1.8, 4.2], z: [-7.4, -5.0] },
  { label: "ws-04", floor: 2, x: [-7.2, -4.8], z: [-1.8, 0.6] },
  { label: "ws-05", floor: 2, x: [4.8, 7.2], z: [-1.8, 0.6] },
  // L2 — coffee bar kiri & kanan + kursi
  // v9.4 — coffee bar dipindah menempel dinding samping (x = ±17.6)
  { label: "coffee-bar-west", floor: 2, x: [-18.5, -16.6], z: [-7.2, -2.0] },
  { label: "coffee-bar-east", floor: 2, x: [16.6, 18.5], z: [-7.2, -2.0] },
  // L2 — balkon (kursi & meja), tidak boleh terhalang
  { label: "balcony", floor: 2, x: [-18.0, 18.0], z: [4.2, 5.6] },
  // L3 — 4 meja kerja
  { label: "ws-06", floor: 3, x: [-14.7, -12.3], z: [-7.4, -5.0] },
  { label: "ws-07", floor: 3, x: [-8.7, -6.3], z: [-7.4, -5.0] },
  { label: "ws-08", floor: 3, x: [-2.7, -0.3], z: [-7.4, -5.0] },
  { label: "ws-09", floor: 3, x: [-14.7, -12.3], z: [-1.8, 0.6] },
  // L3 — boardroom & CEO desk
  { label: "boardroom", floor: 3, x: [9.4, 16.6], z: [-5.2, -1.8] },
  { label: "ceo-desk", floor: 3, x: [5.4, 9.4], z: [-5.4, -3.0] },
  // L3 — staff coffee deck (kursi + meja kopi)
  { label: "staff-deck", floor: 3, x: [-16.2, -1.6], z: [1.6, 3.8] },
];

export const FLOOR_TWO_FURNITURE: FurniturePlacement[] = [
  // v9.4 — pod ngopi/idle digeser ke sisi (dulu ±5.4 = menggantung di tengah promenade)
  { kind: "huddle_pod", floor: 2, position: [-13.8, 2.6], footprint: { w: 3.0, d: 3.0 } },
  { kind: "huddle_pod", floor: 2, position: [13.8, 2.6], footprint: { w: 3.0, d: 3.0 } },
  {
    kind: "standup_table",
    floor: 2,
    position: [0, 2.4],
    rotationY: Math.PI / 2,
    footprint: { w: 1.5, d: 3.0 },
  },
  {
    kind: "whiteboard",
    floor: 2,
    position: [-16.4, 1.4],
    rotationY: Math.PI / 2,
    footprint: { w: 0.6, d: 2.8 },
  },
  {
    kind: "bookshelf",
    floor: 2,
    position: [16.4, 1.2],
    rotationY: -Math.PI / 2,
    footprint: { w: 0.6, d: 2.4 },
  },
  // Planter menempel dinding samping (dulu di tengah promenade → terlihat "berserakan")
  { kind: "planter", floor: 2, position: [-17.2, 3.4], footprint: { w: 0.9, d: 0.9 } },
  { kind: "planter", floor: 2, position: [17.2, 3.4], footprint: { w: 0.9, d: 0.9 } },
  { kind: "rug", floor: 2, position: [0, 2.5], footprint: { w: 10.5, d: 2.9 } },
];

export const FLOOR_THREE_FURNITURE: FurniturePlacement[] = [
  { kind: "huddle_pod", floor: 3, position: [-5.6, -0.2], footprint: { w: 3.0, d: 3.0 } },
  {
    kind: "whiteboard",
    floor: 3,
    position: [-16.2, 0.2],
    rotationY: Math.PI / 2,
    footprint: { w: 0.6, d: 2.8 },
  },
  {
    kind: "standup_table",
    floor: 3,
    position: [-10.2, 0.0],
    rotationY: Math.PI / 2,
    footprint: { w: 1.5, d: 3.0 },
  },
  {
    kind: "sofa_lounge",
    floor: 3,
    // v9.4 — sectional modular (abu + kuning) menghadap ruang tengah (-Z),
    // punggung sofa menempel dinding kaca depan.
    position: [8.6, 2.7],
    rotationY: 0,
    footprint: { w: 5.6, d: 3.4 },
  },
  {
    kind: "bookshelf",
    floor: 3,
    position: [16.6, 1.0],
    rotationY: -Math.PI / 2,
    footprint: { w: 0.6, d: 2.4 },
  },
  // v9.4 — pot L3 yang berdiri di sudut jalur dek (keluhan Bos di screenshot)
  // dipindah ke sudut belakang yang benar-benar mati, dan pot kedua dihapus.
  { kind: "planter", floor: 3, position: [-17.4, -8.4], footprint: { w: 0.9, d: 0.9 } },
  { kind: "rug", floor: 3, position: [-5.6, -0.2], footprint: { w: 3.6, d: 3.6 } },
];

export function rectsOverlap(
  a: { x: [number, number]; z: [number, number] },
  b: { x: [number, number]; z: [number, number] },
  tolerance = 0.05
): boolean {
  return (
    a.x[0] < b.x[1] - tolerance &&
    a.x[1] > b.x[0] + tolerance &&
    a.z[0] < b.z[1] - tolerance &&
    a.z[1] > b.z[0] + tolerance
  );
}

export function footprintRect(item: FurniturePlacement) {
  const [x, z] = item.position;
  return {
    x: [x - item.footprint.w / 2, x + item.footprint.w / 2] as [number, number],
    z: [z - item.footprint.d / 2, z + item.footprint.d / 2] as [number, number],
  };
}

/** Validasi lengkap: dalam gedung & tidak menabrak zona terpakai. */
export function auditFurnitureLayout(
  items: FurniturePlacement[]
): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  for (const item of items) {
    const rect = footprintRect(item);
    if (
      rect.x[0] < BUILDING_BOUNDS.minX ||
      rect.x[1] > BUILDING_BOUNDS.maxX ||
      rect.z[0] < BUILDING_BOUNDS.minZ ||
      rect.z[1] > BUILDING_BOUNDS.maxZ
    ) {
      problems.push(
        `${item.kind}@${item.position.join(",")} keluar batas gedung`
      );
    }
    for (const zone of RESERVED_ZONES) {
      if (zone.floor !== item.floor) continue;
      if (item.kind === "rug") continue; // karpet boleh di bawah furniture lain
      if (rectsOverlap(rect, zone)) {
        problems.push(`${item.kind}@${item.position.join(",")} menabrak ${zone.label}`);
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

/** Titik duduk yang benar-benar punya kursi (untuk audit "duduk tanpa kursi"). */
export interface SeatWithChair {
  id: string;
  floor: 2 | 3;
  position: [number, number];
  facingYaw: number;
  chair: string;
}

export const INTERIOR_SEATS: SeatWithChair[] = [
  // Pod L2 (ikut bergeser ke sisi saat pod dipindah di v9.4)
  { id: "l2-pod-w-n", floor: 2, position: [-13.8, 1.55], facingYaw: Math.PI, chair: "huddle-w-south-chair" },
  { id: "l2-pod-w-s", floor: 2, position: [-13.8, 3.65], facingYaw: 0, chair: "huddle-w-north-chair" },
  { id: "l2-pod-e-n", floor: 2, position: [13.8, 1.55], facingYaw: Math.PI, chair: "huddle-e-south-chair" },
  { id: "l2-pod-e-s", floor: 2, position: [13.8, 3.65], facingYaw: 0, chair: "huddle-e-north-chair" },
  // Pod L3
  { id: "l3-pod-n", floor: 3, position: [-5.6, -1.25], facingYaw: Math.PI, chair: "huddle-l3-south-chair" },
  { id: "l3-pod-s", floor: 3, position: [-5.6, 0.85], facingYaw: 0, chair: "huddle-l3-north-chair" },
  // Boardroom (sama dengan mesh ExecutiveLeatherChair)
  { id: "l3-board-nw", floor: 3, position: [11.2, -5.02], facingYaw: 0, chair: "boardroom-chair-nw" },
  { id: "l3-board-n", floor: 3, position: [13.0, -5.02], facingYaw: 0, chair: "boardroom-chair-n" },
  { id: "l3-board-ne", floor: 3, position: [14.8, -5.02], facingYaw: 0, chair: "boardroom-chair-ne" },
  { id: "l3-board-s", floor: 3, position: [13.0, -1.98], facingYaw: Math.PI, chair: "boardroom-chair-s" },
  // CEO
  { id: "l3-ceo", floor: 3, position: [7.4, -5.22], facingYaw: 0, chair: "ceo-chair" },
  // Staff coffee deck L3
  { id: "l3-staff-1", floor: 3, position: [-15.0, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-1" },
  { id: "l3-staff-2", floor: 3, position: [-12.5, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-2" },
  { id: "l3-staff-3", floor: 3, position: [-10.0, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-3" },
  { id: "l3-staff-4", floor: 3, position: [-7.5, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-4" },
  { id: "l3-staff-5", floor: 3, position: [-5.0, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-5" },
  { id: "l3-staff-6", floor: 3, position: [-2.5, 3.2], facingYaw: Math.PI, chair: "staff-deck-chair-6" },
];

/** Cari kursi interior terdekat (dipakai audit "duduk tanpa kursi"). */
export function findInteriorSeat(
  floor: 2 | 3,
  x: number,
  z: number,
  tolerance = 0.4
): SeatWithChair | null {
  for (const seat of INTERIOR_SEATS) {
    if (seat.floor !== floor) continue;
    if (Math.abs(seat.position[0] - x) <= tolerance && Math.abs(seat.position[1] - z) <= tolerance) {
      return seat;
    }
  }
  return null;
}
