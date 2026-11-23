import assert from "node:assert/strict";
import test from "node:test";
import {
  FLOOR_1_Y,
  FLOOR_2_Y,
  FLOOR_3_Y,
  INITIAL_AGENTS,
  INITIAL_WORKSTATIONS,
  OFFICE_WAYPOINTS,
  ROOF_Y,
  findWaypointPath,
} from "../src/lib/data/initial-office-data.ts";
import { ACTIVE_EMPLOYEE_ROSTER, OFFICE_FLOORS } from "../src/lib/config/team-roster.ts";

/** Ukuran nyata meja di WorkstationCluster (boxGeometry desain). */
const DESK_WIDTH = 2.35;
const DESK_DEPTH = 1.02;
const ALLOWED_FLOORS = [1, 2, 3];

test("Kantor 3 lantai: tidak ada workstation, waypoint, atau blueprint di lantai 4–5", () => {
  assert.equal(OFFICE_FLOORS.length, 3);
  assert.deepEqual(OFFICE_FLOORS.map((f) => f.floor), [1, 2, 3]);

  for (const ws of INITIAL_WORKSTATIONS) {
    assert.ok(ALLOWED_FLOORS.includes(ws.floor), `${ws.id} masih di lantai ${ws.floor}`);
  }
  for (const wp of Object.values(OFFICE_WAYPOINTS)) {
    assert.ok(ALLOWED_FLOORS.includes(wp.floor), `${wp.id} masih di lantai ${wp.floor}`);
  }
  for (const agent of INITIAL_AGENTS) {
    assert.ok(ALLOWED_FLOORS.includes(agent.floor), `${agent.id} masih di lantai ${agent.floor}`);
  }
});

test("15 karyawan tetap utuh: tiap agen punya meja + kursi di lantai roster-nya sendiri", () => {
  assert.equal(ACTIVE_EMPLOYEE_ROSTER.length, 15);
  assert.equal(INITIAL_AGENTS.length, 15);
  assert.equal(INITIAL_WORKSTATIONS.length, 15);

  const workstationIds = new Set(INITIAL_WORKSTATIONS.map((w) => w.id));
  const assignedAgentIds = new Set(
    INITIAL_WORKSTATIONS.map((w) => w.assignedAgentId).filter((id): id is string => Boolean(id))
  );
  assert.equal(assignedAgentIds.size, 15, "setiap meja harus punya agen, tanpa agen yatim");

  for (const emp of ACTIVE_EMPLOYEE_ROSTER) {
    assert.ok(workstationIds.has(emp.workstationId), `${emp.id} kehilangan meja ${emp.workstationId}`);
    const deskWp = OFFICE_WAYPOINTS[emp.deskWaypointId];
    const loungeWp = OFFICE_WAYPOINTS[emp.loungeWaypointId];
    assert.ok(deskWp, `${emp.id} kehilangan waypoint meja`);
    assert.ok(loungeWp, `${emp.id} kehilangan waypoint lounge`);
    assert.equal(deskWp.floor, emp.floor, `${emp.id} meja tidak di lantainya`);
    assert.equal(loungeWp.floor, emp.floor, `${emp.id} lounge tidak di lantainya`);
    // Rute nyata dari hub lantai menuju kursi harus ketemu
    const hub = emp.floor === 2 ? "wp-l2-hub" : "wp-f3-hub";
    const path = findWaypointPath(hub, emp.deskWaypointId);
    assert.ok(path.length >= 2, `${emp.id} tidak bisa dijangkau dari hub L${emp.floor}`);
  }
});

test("Distribusi meja L2 & L3 tidak bertumpuk dan masih di dalam gedung", () => {
  // L1 = lobby/hologram (tanpa meja). Semua 15 meja ada di L2 (9) + L3 (6).
  const perFloor = new Map<number, number>();
  for (const floor of ALLOWED_FLOORS) {
    const desks = INITIAL_WORKSTATIONS.filter((w) => w.floor === floor);
    perFloor.set(floor, desks.length);
    if (desks.length === 0) continue;

    for (let i = 0; i < desks.length; i += 1) {
      const a = desks[i];
      assert.ok(Math.abs(a.position[0]) <= 19, `${a.id} keluar gedung (X)`);
      assert.ok(a.position[1] > 0 && a.position[1] < ROOF_Y, `${a.id} salah elevasi`);
      for (let j = i + 1; j < desks.length; j += 1) {
        const b = desks[j];
        const overlapX = Math.abs(a.position[0] - b.position[0]) < DESK_WIDTH + 0.2;
        const overlapZ = Math.abs(a.position[2] - b.position[2]) < DESK_DEPTH + 0.2;
        assert.ok(!(overlapX && overlapZ), `meja ${a.id} & ${b.id} bertumpuk di L${floor}`);
      }
    }
  }
  assert.deepEqual(
    [perFloor.get(1), perFloor.get(2), perFloor.get(3)],
    [0, 9, 6],
    "distribusi meja harus 0 / 9 / 6 (15 total)"
  );
});

test("Atap Sky Deck (helipad + badminton) tepat di atas L3, bukan di atas lantai hantu", () => {
  assert.ok(FLOOR_1_Y < FLOOR_2_Y && FLOOR_2_Y < FLOOR_3_Y);
  assert.ok(ROOF_Y > FLOOR_3_Y, "atap harus di atas L3");
  assert.ok(ROOF_Y - FLOOR_3_Y < 4.2, "atap tidak boleh melompati lantai yang sudah dihapus");
  assert.ok(ROOF_Y < 12.4, "tinggi total gedung harus turun kembali ke 3 lantai");
});
