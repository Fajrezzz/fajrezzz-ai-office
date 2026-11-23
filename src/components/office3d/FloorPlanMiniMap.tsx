"use client";

import React from "react";
import { Building2, Layers, Monitor, UserCheck, X } from "lucide-react";
import { OFFICE_FLOORS } from "@/lib/config/team-roster";
import { useOffice } from "@/store/OfficeContext";
import type { FloorNumber, FloorView } from "@/types/office";

interface FloorPlanMiniMapProps {
  onClose: () => void;
}

const FLOOR_VIEW_MAP: Record<FloorNumber, FloorView> = {
  1: "l1",
  2: "l2",
  3: "l3",
  4: "l4",
  5: "l5",
};

/**
 * Interactive 2D Multi-Floor Blueprint / Floor-Plan View (Section B).
 * Lets the user switch among all 5 floors, inspect active vs idle status on each floor,
 * and click any employee or workstation to jump the 3D camera directly to it.
 */
export function FloorPlanMiniMap({ onClose }: FloorPlanMiniMapProps) {
  const {
    agents,
    workstations,
    activeFloor,
    setActiveFloor,
    selectedAgentId,
    selectedWorkstationId,
    focusOnAgent,
    focusOnWorkstation,
  } = useOffice();

  const currentFloorNum: FloorNumber =
    activeFloor === "l1"
      ? 1
      : activeFloor === "l2"
      ? 2
      : activeFloor === "l3"
      ? 3
      : activeFloor === "l4"
      ? 4
      : activeFloor === "l5"
      ? 5
      : 2;

  const floorBlueprint =
    OFFICE_FLOORS.find((f) => f.floor === currentFloorNum) ?? OFFICE_FLOORS[1];
  const floorAgents = agents.filter((a) => a.floor === currentFloorNum);
  const floorWorkstations = workstations.filter(
    (w) => w.floor === currentFloorNum
  );

  // Normalize 3D building coordinates X [-13.5..13.5], Z [-9.8..4.0] -> percentage [8%..92%]
  const mapX = (x: number) => `${Math.max(8, Math.min(92, ((x + 13.5) / 27) * 84 + 8))}%`;
  const mapZ = (z: number) => `${Math.max(12, Math.min(88, ((z + 9.8) / 14) * 76 + 12))}%`;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-400/40 bg-slate-950/95 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-black tracking-wide text-white">
                DENAH LANTAI 2D — FAJREZZZ HQ (5 LANTAI)
              </h3>
              <p className="text-[11px] text-cyan-300/80">
                Lantai {floorBlueprint.floor}: {floorBlueprint.name} ·{" "}
                {floorAgents.length} Karyawan · {floorWorkstations.length} Workstation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Denah Lantai"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 5-Floor Selector Strip */}
        <div className="grid grid-cols-5 gap-1.5 border-b border-white/10 bg-slate-900/70 p-2.5">
          {OFFICE_FLOORS.map((fl) => {
            const flAgents = agents.filter((a) => a.floor === fl.floor);
            const activeCount = flAgents.filter(
              (a) => a.status === "working" || a.status === "walking"
            ).length;
            const selected = currentFloorNum === fl.floor;
            return (
              <button
                key={fl.floor}
                type="button"
                onClick={() => setActiveFloor(FLOOR_VIEW_MAP[fl.floor])}
                className={`rounded-xl border px-2 py-2 text-left transition ${
                  selected
                    ? "border-cyan-300 bg-cyan-500/25 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                    : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-400/50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span>{fl.code}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      activeCount > 0
                        ? "bg-emerald-500/25 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {activeCount}/{flAgents.length}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[10px] opacity-80">
                  {fl.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive 2D Floor Blueprint Grid */}
        <div className="p-4">
          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-cyan-500/30 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.14),rgba(2,6,23,0.96))] sm:h-72">
            {/* Blueprint grid lines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Panoramic Elevator Core Indicator */}
            <div
              className="absolute flex items-center justify-center rounded-lg border border-cyan-300/70 bg-cyan-500/20 px-2 py-1 text-[9px] font-bold text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
              style={{ left: "8%", top: "12%" }}
            >
              🛗 LIFT
            </div>

            {/* Floor Zone Label */}
            <div className="pointer-events-none absolute right-3 top-2.5 rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-cyan-200">
              {floorBlueprint.description}
            </div>

            {/* Ground floor special zones */}
            {currentFloorNum === 1 && (
              <>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-center text-xs font-bold text-cyan-200">
                  🌐 HOLOGRAM ARRIVAL PORTAL & COORDINATION HUB
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">
                  Lobi Utama · Resepsionis · Akses Lift ke Lantai 2–5
                </div>
              </>
            )}

            {/* Interactive Workstations */}
            {floorWorkstations.map((ws) => {
              const assignedAgent = agents.find((a) => a.id === ws.assignedAgentId);
              const isWorking =
                assignedAgent?.status === "working" ||
                assignedAgent?.status === "walking";
              const isSelected =
                selectedWorkstationId === ws.id ||
                selectedAgentId === ws.assignedAgentId;

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    focusOnWorkstation(ws.id);
                    onClose();
                  }}
                  style={{
                    left: mapX(ws.position[0]),
                    top: mapZ(ws.position[2]),
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2.5 py-1.5 text-left transition hover:scale-105 ${
                    isSelected
                      ? "border-amber-300 bg-amber-500/25 text-white shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                      : isWorking
                      ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                      : "border-cyan-400/40 bg-slate-900/90 text-slate-200 hover:border-cyan-300"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-black">
                    <Monitor className="h-3 w-3 shrink-0 text-cyan-300" />
                    <span>{ws.code}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] opacity-90">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isWorking ? "animate-pulse bg-emerald-400" : "bg-slate-400"
                      }`}
                    />
                    <span className="max-w-[96px] truncate">
                      {assignedAgent ? assignedAgent.name : "Kosong"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floor Staff Quick Jump Pills */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {floorAgents.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    focusOnAgent(ag.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400 hover:text-white"
                >
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{ag.name}</span>
                  <span className="text-[9px] text-slate-400">({ag.status})</span>
                </button>
              ))}
              {floorAgents.length === 0 && (
                <span className="text-[11px] text-slate-400">
                  Lantai 1 adalah Lobby & Coordination Hub (staf operasional bekerja di Lantai 2–5).
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveFloor("all");
                onClose();
              }}
              className="flex items-center gap-1 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Lihat Full 5 Lantai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
