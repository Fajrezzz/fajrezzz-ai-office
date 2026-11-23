/**
 * LIFT / ELEVATOR KANTOR — CONTROLLER NYATA (v9.3)
 *
 * Keluhan Bos: "lift nya bisa dipakai ya" — lift sebelumnya cuma animasi 20 detik
 * yang berulang sendiri; tombol lantai tidak melakukan apa pun.
 *
 * Modul ini state machine murni (tanpa three.js, tanpa DOM):
 *   idle → doors_opening → dwell → doors_closing → moving → (arrive) → idle
 * Semua timing, arah, ETA, dan posisi kabin dihitung di sini, jadi bisa diuji
 * di Node dan hasilnya sama dengan yang tampil di browser.
 */

export type LiftFloor = 1 | 2 | 3;

export type LiftPhase =
  | "idle"
  | "doors_opening"
  | "dwell"
  | "doors_closing"
  | "moving";

export interface LiftTiming {
  doorOpenSec: number;
  dwellSec: number;
  doorCloseSec: number;
  perFloorSec: number;
  /** Jeda sebelum lift otomatis jalan lagi (mode ambient) */
  autoIdleSec: number;
}

export const LIFT_TIMING: LiftTiming = {
  doorOpenSec: 0.9,
  dwellSec: 1.8,
  doorCloseSec: 0.9,
  perFloorSec: 2.6,
  autoIdleSec: 3.2,
};

export interface LiftState {
  /** Lantai tempat kabin berada (saat moving = lantai asal) */
  floor: LiftFloor;
  targetFloor: LiftFloor;
  phase: LiftPhase;
  /** 0..1 pintu terbuka */
  doorOpen: number;
  /** waktu berjalan di fase sekarang (detik) */
  phaseSec: number;
  /** 0..1 progres perjalanan saat phase = moving */
  travel: number;
  /** antrean permintaan lantai (FIFO, duplikat dibuang) */
  queue: LiftFloor[];
  /** total perjalanan selesai — dipakai QC/telemetry */
  trips: number;
  /** nomor urut permintaan terakhir (dipakai UI untuk animasi tombol) */
  requestTicket: number;
  /** true kalau permintaan terakhir datang dari Bos (bukan ambient) */
  manualRequest: boolean;
  /** total detik berjalan (untuk animasi deterministik lampu/indikator) */
  elapsedSec: number;
}

export interface LiftStepOptions {
  /** true = lift jalan sendiri naik-turun seperti sebelumnya */
  autoCycle?: boolean;
  /** lantai yang tersedia (kalau L2/L3 disembunyikan cutaway) */
  availableFloors?: LiftFloor[];
  timing?: Partial<LiftTiming>;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function createLiftState(floor: LiftFloor = 1, timing: LiftTiming = LIFT_TIMING): LiftState {
  void timing;
  return {
    floor,
    targetFloor: floor,
    phase: "idle",
    doorOpen: 0,
    phaseSec: 0,
    travel: 0,
    queue: [],
    trips: 0,
    requestTicket: 0,
    manualRequest: false,
    elapsedSec: 0,
  };
}

/** Bos menekan tombol lantai. Permintaan duplikat/berulang diabaikan. */
export function requestLiftFloor(
  state: LiftState,
  floor: LiftFloor,
  options: { manual?: boolean } = {}
): LiftState {
  const manual = options.manual ?? true;
  const alreadyThere =
    state.phase !== "moving" && state.floor === floor && state.queue.length === 0;
  if (alreadyThere && state.phase === "dwell") {
    // pintu sedang terbuka di lantai itu — cukup tahan sebentar
    return {
      ...state,
      manualRequest: manual || state.manualRequest,
      requestTicket: state.requestTicket + 1,
      phaseSec: 0,
    };
  }
  const queue = state.queue.includes(floor) ? state.queue : [...state.queue, floor];
  return {
    ...state,
    queue,
    manualRequest: manual || state.manualRequest,
    requestTicket: state.requestTicket + 1,
  };
}

/** Lantai berikutnya yang dituju lift (null kalau tidak ada antrean). */
export function nextLiftTarget(state: LiftState): LiftFloor | null {
  return state.queue.length > 0 ? state.queue[0] : null;
}

/** Satu langkah simulasi. `dtSec` boleh kecil (1/60) maupun besar (test). */
export function stepLift(
  state: LiftState,
  dtSec: number,
  options: LiftStepOptions = {}
): LiftState {
  const timing: LiftTiming = { ...LIFT_TIMING, ...options.timing };
  const available = options.availableFloors ?? [1, 2, 3];
  const dt = Math.max(0, Math.min(0.25, dtSec));
  let next: LiftState = { ...state, elapsedSec: state.elapsedSec + dt, phaseSec: state.phaseSec + dt };

  // Ambient: kalau menganggur cukup lama, jalan sendiri naik-turun (1→3→1).
  if (
    options.autoCycle &&
    next.phase === "idle" &&
    next.queue.length === 0 &&
    next.phaseSec >= timing.autoIdleSec
  ) {
    const up = next.floor < (available[available.length - 1] ?? 3);
    const ambientFloor: LiftFloor = up ? ((next.floor + 1) as LiftFloor) : 1;
    next = requestLiftFloor(next, available.includes(ambientFloor) ? ambientFloor : 1, {
      manual: false,
    });
  }

  switch (next.phase) {
    case "idle": {
      const target = nextLiftTarget(next);
      if (target === null) break;
      if (target === next.floor) {
        // sudah di lantai tujuan → buka pintu
        next = { ...next, phase: "doors_opening", phaseSec: 0, targetFloor: target };
        next.queue = next.queue.slice(1);
      } else {
        next = { ...next, phase: "doors_closing", phaseSec: 0, doorOpen: 0, targetFloor: target };
      }
      break;
    }
    case "doors_opening": {
      next.doorOpen = clamp01(next.phaseSec / timing.doorOpenSec);
      if (next.doorOpen >= 1) {
        next = { ...next, phase: "dwell", phaseSec: 0, doorOpen: 1 };
      }
      break;
    }
    case "dwell": {
      next.doorOpen = 1;
      if (next.phaseSec >= timing.dwellSec) {
        const pending = nextLiftTarget(next);
        if (pending !== null && pending !== next.floor) {
          next = {
            ...next,
            phase: "doors_closing",
            phaseSec: 0,
            targetFloor: pending,
          };
        } else {
          // tidak ada tujuan lain → tutup pintu lalu idle
          next = { ...next, phase: "doors_closing", phaseSec: 0 };
        }
      }
      break;
    }
    case "doors_closing": {
      next.doorOpen = clamp01(1 - next.phaseSec / timing.doorCloseSec);
      if (next.doorOpen <= 0) {
        next.doorOpen = 0;
        if (next.targetFloor !== next.floor) {
          next = { ...next, phase: "moving", phaseSec: 0, travel: 0 };
        } else {
          next = { ...next, phase: "idle", phaseSec: 0 };
        }
      }
      break;
    }
    case "moving": {
      const floors = Math.abs(next.targetFloor - next.floor);
      const duration = timing.perFloorSec * Math.max(1, floors);
      next.travel = clamp01(next.phaseSec / duration);
      if (next.travel >= 1) {
        next = {
          ...next,
          phase: "doors_opening",
          phaseSec: 0,
          floor: next.targetFloor,
          travel: 0,
          doorOpen: 0,
          trips: next.trips + 1,
        };
      }
      break;
    }
    default:
      break;
  }

  return next;
}

/** Arah kabin: 1 naik, -1 turun, 0 diam. */
export function liftDirection(state: LiftState): 0 | 1 | -1 {
  if (state.phase !== "moving") return 0;
  return state.targetFloor > state.floor ? 1 : state.targetFloor < state.floor ? -1 : 0;
}

/** Posisi kabin (meter) di antara `floorY`. */
export function liftCabinY(
  state: LiftState,
  floorY: Record<LiftFloor, number>
): number {
  const fromY = floorY[state.floor];
  if (state.phase !== "moving") return fromY;
  const toY = floorY[state.targetFloor];
  const smooth = state.travel * state.travel * (3 - 2 * state.travel);
  return fromY + (toY - fromY) * smooth;
}

/** ETA sederhana untuk HUD (detik). */
export function liftEtaSec(
  state: LiftState,
  timing: LiftTiming = LIFT_TIMING
): number {
  const floorsLeft = Math.abs(state.targetFloor - state.floor);
  if (state.phase === "moving") {
    const duration = timing.perFloorSec * Math.max(1, floorsLeft);
    return Math.max(0, duration - state.phaseSec);
  }
  if (state.phase === "doors_closing") {
    return Math.max(0, timing.doorCloseSec - state.phaseSec) + timing.perFloorSec * Math.max(1, floorsLeft);
  }
  if (state.phase === "doors_opening" || state.phase === "dwell") return 0;
  const target = nextLiftTarget(state);
  if (target === null) return 0;
  return (
    timing.doorCloseSec +
    timing.perFloorSec * Math.max(1, Math.abs(target - state.floor))
  );
}

export interface LiftStatusSnapshot {
  floor: LiftFloor;
  targetFloor: LiftFloor;
  phase: LiftPhase;
  doorOpen: number;
  etaSec: number;
  direction: 0 | 1 | -1;
  queueLength: number;
  trips: number;
  manualRequest: boolean;
  /** lantai yang benar-benar bisa dituju (cutaway L2/L3 bisa menyembunyikan lantai) */
  availableFloors: LiftFloor[];
  /** label siap tampil untuk HUD */
  label: string;
}

export function liftStatusSnapshot(
  state: LiftState,
  timing: LiftTiming = LIFT_TIMING,
  availableFloors: LiftFloor[] = [1, 2, 3]
): LiftStatusSnapshot {
  const direction = liftDirection(state);
  const eta = Math.round(liftEtaSec(state, timing) * 10) / 10;
  const label =
    state.phase === "moving"
      ? `${direction === 1 ? "Naik" : "Turun"} ke L${state.targetFloor} · ${eta.toFixed(1)} dtk`
      : state.phase === "doors_opening" || state.phase === "dwell"
        ? `Pintu terbuka · L${state.floor}`
        : state.phase === "doors_closing"
          ? state.targetFloor !== state.floor
            ? `Pintu menutup · lanjut ke L${state.targetFloor}`
            : `Pintu menutup · L${state.floor}`
          : `Siap · L${state.floor}`;

  return {
    floor: state.floor,
    targetFloor: state.targetFloor,
    phase: state.phase,
    doorOpen: Math.round(state.doorOpen * 100) / 100,
    etaSec: eta,
    direction,
    queueLength: state.queue.length,
    trips: state.trips,
    manualRequest: state.manualRequest,
    availableFloors,
    label,
  };
}
