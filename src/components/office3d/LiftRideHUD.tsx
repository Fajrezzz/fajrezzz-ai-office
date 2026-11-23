"use client";

/**
 * HUD LIFT — tombol lantai yang benar-benar menggerakkan lift 3D.
 *
 * Status dibaca dari `liftStatusRef` (diisi komponen lift tiap ~10 Hz) lewat
 * polling 200 ms, jadi HUD tidak memicu re-render seluruh scene 3D.
 * Target sentuh ≥44 px supaya nyaman di layar HP 722×1600.
 */

import { useEffect, useMemo, useState } from "react";
import { useOffice } from "@/store/OfficeContext";
import {
  createLiftState,
  liftStatusSnapshot,
  type LiftFloor,
  type LiftStatusSnapshot,
} from "@/lib/office3d/elevator-controller";

const FLOOR_LABEL: Record<LiftFloor, string> = {
  1: "L1 · Lobby",
  2: "L2 · Staff",
  3: "L3 · Executive",
};

export function LiftRideHUD({ compact = false }: { compact?: boolean }) {
  const { requestLiftFloor, liftStatusRef } = useOffice();
  const [status, setStatus] = useState<LiftStatusSnapshot>(() =>
    liftStatusSnapshot(createLiftState(1))
  );
  const [open, setOpen] = useState(!compact);
  const [pressed, setPressed] = useState<LiftFloor | null>(null);

  useEffect(() => {
    const tick = () => setStatus({ ...liftStatusRef.current });
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [liftStatusRef]);

  useEffect(() => {
    if (pressed === null) return;
    const timer = window.setTimeout(() => setPressed(null), 900);
    return () => window.clearTimeout(timer);
  }, [pressed]);

  const floors = useMemo<LiftFloor[]>(() => [1, 2, 3], []);
  const moving = status.phase === "moving";
  const arrow = status.direction === 1 ? "▲" : status.direction === -1 ? "▼" : "●";

  return (
    <div className="pointer-events-auto absolute left-3 top-1/2 z-20 -translate-y-1/2 select-none">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-cyan-400/40 bg-slate-950/85 px-3 text-[11px] font-black text-cyan-100 shadow-lg backdrop-blur"
        >
          🛗 Lift
          <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">
            L{status.floor}
          </span>
        </button>
      ) : (
        <div className="w-[212px] rounded-2xl border border-cyan-400/35 bg-slate-950/88 p-2.5 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-cyan-100">🛗 Lift Panoramik</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded-md border border-slate-700 text-[11px] font-bold text-slate-300 hover:border-cyan-400/60"
              aria-label="Perkecil panel lift"
            >
              –
            </button>
          </div>

          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
            <span
              className={`rounded px-1.5 py-0.5 font-bold ${
                moving ? "bg-cyan-500/20 text-cyan-200" : "bg-slate-800 text-slate-300"
              }`}
            >
              {arrow} L{status.floor}
            </span>
            <span className="truncate">{status.label}</span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {floors.map((floor) => {
              const available = status.availableFloors.includes(floor);
              const here = status.floor === floor && !moving;
              const isTarget = moving && status.targetFloor === floor;
              return (
                <button
                  key={floor}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    setPressed(floor);
                    requestLiftFloor(floor);
                  }}
                  className={`h-11 rounded-xl border text-[11px] font-black transition ${
                    isTarget
                      ? "border-cyan-300 bg-cyan-400/30 text-white"
                      : pressed === floor
                        ? "border-amber-300 bg-amber-400 text-slate-950"
                        : here
                          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/60"
                  } disabled:opacity-35`}
                  aria-label={`Panggil lift ke ${FLOOR_LABEL[floor]}`}
                >
                  L{floor}
                </button>
              );
            })}
          </div>

          <p className="mt-1.5 text-[9px] leading-snug text-slate-400">
            Tekan lantai → lift jalan, pintu terbuka, kamera ikut naik. Bisa juga ketuk
            tombol lift di dinding 3D.
          </p>
        </div>
      )}
    </div>
  );
}
