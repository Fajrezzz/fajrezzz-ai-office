"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Coffee,
  Cpu,
  Crosshair,
  Loader2,
  Monitor,
  Play,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  ACTIVE_EMPLOYEE_ROSTER,
  MAX_TEAM_CAPACITY,
  OFFICE_FLOORS,
  RESERVE_EXPANSION_SLOTS,
  TEAM_DIVISIONS,
} from "@/lib/config/team-roster";
import { useAgency } from "@/store/AgencyContext";
import { useOffice } from "@/store/OfficeContext";
import type { FloorNumber, TeamDivisionKey } from "@/types/office";

/**
 * Scalable Employee Directory & Task Dispatch Panel (Section A).
 *
 * Displays all 15 active task-capable employees across 6 divisions & 5 floors,
 * plus the 5 reserve expansion slots (up to 20 employees without re-architecting).
 */
export function AgentManagementPanel({ compact = false }: { compact?: boolean }) {
  const {
    agents,
    workstations,
    focusOnAgent,
    focusOnWorkstation,
    setActiveSection,
  } = useOffice();
  const { activeEpisode, getAgentSnapshot, runDivision, runningDivision } =
    useAgency();
  const isRunningPipeline = Boolean(runningDivision);

  const [selectedFloor, setSelectedFloor] = useState<FloorNumber | "all">("all");
  const [selectedDivision, setSelectedDivision] = useState<TeamDivisionKey | "all">(
    "all"
  );
  const [showExpansionSlots, setShowExpansionSlots] = useState(false);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (selectedFloor !== "all" && a.floor !== selectedFloor) return false;
      if (selectedDivision !== "all" && a.divisionTeam !== selectedDivision) {
        return false;
      }
      return true;
    });
  }, [agents, selectedFloor, selectedDivision]);

  const activeCount = agents.filter(
    (a) => a.status === "working" || a.status === "walking"
  ).length;

  return (
    <div className={`mx-auto max-w-6xl space-y-5 text-slate-100 ${compact ? "p-2" : "p-4 sm:p-6"}`}>
      {/* HEADER */}
      <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/80 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-300 uppercase">
              <Users className="h-4 w-4 text-cyan-400" />
              <span>
                SCALABLE EMPLOYEE ROSTER · {ACTIVE_EMPLOYEE_ROSTER.length}/{MAX_TEAM_CAPACITY} KAPASITAS
              </span>
            </div>
            <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">
              Tim Produksi 15 Karyawan Aktif (6 Divisi · 5 Lantai)
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Setiap karyawan punya identitas, workstation, shared skills, dan hanya bekerja saat ada tugas produksi nyata.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
              {activeCount} Bekerja · {agents.length - activeCount} Standby
            </span>
            <button
              type="button"
              onClick={() => setShowExpansionSlots((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Slot 16–20 ({RESERVE_EXPANSION_SLOTS.length})</span>
            </button>
          </div>
        </div>

        {/* FLOOR & DIVISION FILTERS */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 p-1">
            <button
              type="button"
              onClick={() => setSelectedFloor("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                selectedFloor === "all"
                  ? "bg-cyan-500/25 text-cyan-100"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua Lantai
            </button>
            {OFFICE_FLOORS.filter((f) => f.floor >= 2).map((fl) => (
              <button
                key={fl.floor}
                type="button"
                onClick={() => setSelectedFloor(fl.floor)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  selectedFloor === fl.floor
                    ? "bg-cyan-500/25 text-cyan-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {fl.code}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 p-1">
            <button
              type="button"
              onClick={() => setSelectedDivision("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                selectedDivision === "all"
                  ? "bg-fuchsia-500/25 text-fuchsia-100"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua Divisi (6)
            </button>
            {TEAM_DIVISIONS.map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => setSelectedDivision(div.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  selectedDivision === div.id
                    ? "bg-fuchsia-500/25 text-fuchsia-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {div.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* EXPANSION SLOTS 16-20 ARCHITECTURE DRAWER */}
      {showExpansionSlots && (
        <div className="rounded-2xl border border-indigo-400/35 bg-indigo-950/25 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-indigo-100">
                Arsitektur Ekspansi Fleksibel — Slot Cadangan 16 s/d 20
              </h2>
              <p className="mt-0.5 text-xs text-indigo-200/75">
                Dikonfigurasi di <code className="font-mono">src/lib/config/team-roster.ts</code> — aktifkan tanpa ubah struktur store atau pipeline.
              </p>
            </div>
            <span className="rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-indigo-200">
              15 Active + 5 Reserve = 20 Max
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {RESERVE_EXPANSION_SLOTS.map((slot) => (
              <div
                key={slot.slotNumber}
                className="rounded-xl border border-dashed border-indigo-400/35 bg-slate-950/60 p-2.5"
              >
                <div className="flex items-center justify-between text-[10px] text-indigo-300">
                  <span className="font-mono font-bold">SLOT #{slot.slotNumber}</span>
                  <span>L{slot.floor}</span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">{slot.suggestedCode}</div>
                <div className="text-[10px] text-slate-400">{slot.suggestedRole}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 15 ACTIVE EMPLOYEE CARDS */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredAgents.map((agent) => {
          const roster = ACTIVE_EMPLOYEE_ROSTER.find((r) => r.id === agent.id);
          const division = TEAM_DIVISIONS.find((d) => d.id === agent.divisionTeam);
          const ws = workstations.find((w) => w.id === agent.assignedWorkstationId);
          const snap = getAgentSnapshot(agent.id);

          const isWorking = agent.status === "working" || agent.status === "walking";
          const isError = agent.status === "error";

          return (
            <div
              key={agent.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                isError
                  ? "border-rose-500/50 bg-rose-950/20"
                  : isWorking
                  ? "border-emerald-400/50 bg-emerald-950/20"
                  : "border-white/10 bg-slate-900/80"
              }`}
            >
              <div>
                {/* Top row: identity & status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: agent.accentColor }}
                      />
                      <h3 className="truncate text-sm font-black text-white">
                        {agent.name}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400">
                        {agent.code}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-cyan-200">
                      {agent.role}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Building2 className="h-3 w-3" />
                      <span>
                        Lantai {agent.floor} · {division?.shortLabel ?? "Produksi"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      isError
                        ? "bg-rose-500/20 text-rose-200"
                        : isWorking
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isError ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : isWorking ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Coffee className="h-3 w-3" />
                    )}
                    <span>{agent.status}</span>
                  </span>
                </div>

                {/* Current actual task status */}
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/75 p-2.5 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Status Tugas Nyata</span>
                    {snap?.status === "done" && (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Selesai
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-medium text-slate-200">
                    {agent.currentActionLabel}
                  </div>
                </div>

                {/* Responsibilities */}
                {roster?.responsibility && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {roster.responsibility}
                  </p>
                )}

                {/* Shared Skills */}
                {agent.skills && agent.skills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {agent.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    focusOnAgent(agent.id);
                    setActiveSection("office");
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-sky-400/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-bold text-sky-100 hover:bg-sky-500/25"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  <span>Lihat 3D</span>
                </button>

                {ws && (
                  <button
                    type="button"
                    onClick={() => {
                      focusOnWorkstation(ws.id);
                      setActiveSection("office");
                    }}
                    className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-400/50"
                  >
                    <Monitor className="h-3.5 w-3.5 text-cyan-300" />
                    <span>{ws.code}</span>
                  </button>
                )}

                {activeEpisode && snap && (
                  <button
                    type="button"
                    disabled={isRunningPipeline}
                    onClick={() => void runDivision(activeEpisode.id, snap.division)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-45"
                  >
                    <Play className="h-3 w-3" />
                    <span>Run</span>
                  </button>
                )}

                {!activeEpisode && (
                  <button
                    type="button"
                    onClick={() => setActiveSection("dashboard")}
                    className="flex items-center justify-center gap-1 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-2.5 py-1.5 text-[11px] font-bold text-fuchsia-100 hover:bg-fuchsia-500/25"
                  >
                    <Cpu className="h-3 w-3" />
                    <span>Studio</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
