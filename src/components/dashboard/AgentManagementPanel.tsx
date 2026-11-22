"use client";

import React from "react";
import {
  Bot,
  Box,
  Cpu,
  Footprints,
  Info,
  MapPin,
  Monitor,
  Power,
  Sparkles,
} from "lucide-react";
import {
  DESTINATION_PRESETS,
  OFFICE_WAYPOINTS,
} from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
import type { RobotAnimationState } from "@/types/office";

const STATUS_ACTIONS: {
  id: RobotAnimationState;
  label: string;
}[] = [
  { id: "working", label: "Work" },
  { id: "idle", label: "Idle" },
  { id: "walking", label: "Walk" },
  { id: "standby", label: "Standby" },
];

export function AgentManagementPanel({ compact = false }: { compact?: boolean }) {
  const {
    agents,
    workstations,
    selectedAgentId,
    setSelectedAgentId,
    setAgentStatus,
    sendAgentToWaypoint,
    assignAgentWorkstation,
    setActiveSection,
    setCameraPreset,
  } = useOffice();

  return (
    <div className="space-y-4">
      {/* Transparent Non-AI Visual Placeholder Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-purple-500/35 bg-gradient-to-r from-purple-950/50 via-[#0b132b] to-cyan-950/40 p-3.5 text-xs text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
        <div className="space-y-1">
          <p className="font-semibold text-purple-200">
            Mode Visual Placeholder (Tahap 1 — Non-AI)
          </p>
          <p className="leading-relaxed text-slate-300/90">
            Tiga karakter robot di bawah ini adalah{" "}
            <span className="font-semibold text-cyan-300">
              placeholder visual 3D
            </span>{" "}
            dengan animasi idle, kerja simulasi, dan navigasi berjalan. Belum
            terhubung ke API AI nyata — slot model disiapkan untuk integrasi
            server-side di tahap berikutnya.
          </p>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div
        className={`grid gap-4 ${
          compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-3"
        }`}
      >
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          const currentLocation =
            OFFICE_WAYPOINTS[agent.currentWaypointId]?.label ??
            agent.currentWaypointId;

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                isSelected
                  ? "border-cyan-400/60 bg-[#09152f]/95 shadow-[0_0_28px_rgba(0,229,255,0.12)]"
                  : "border-cyan-500/20 bg-[#070f23]/90 hover:border-cyan-500/40"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${agent.accentColor}66`,
                      backgroundColor: `${agent.accentColor}18`,
                    }}
                  >
                    <Bot
                      className="h-5 w-5"
                      style={{ color: agent.accentColor }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold tracking-wide text-white">
                        {agent.name}
                      </h3>
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-purple-200">
                        Placeholder
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{agent.role}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    agent.status === "working"
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                      : agent.status === "walking"
                      ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40"
                      : agent.status === "idle"
                      ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/35"
                      : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              {/* Telemetry & Location */}
              <div className="mt-3.5 space-y-2 rounded-xl border border-slate-800/90 bg-[#040917]/80 p-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    Lokasi
                  </span>
                  <span className="font-medium text-cyan-100">
                    {currentLocation}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    Slot AI
                  </span>
                  <span className="text-[11px] text-purple-200">
                    {agent.futureModelSlot}
                  </span>
                </div>
                <p className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  {agent.currentActionLabel}
                </p>
              </div>

              {/* Simulated Load Bar */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Cpu className="h-3 w-3 text-cyan-400" />
                    Simulasi Aktivitas Visual
                  </span>
                  <span className="font-mono text-cyan-300">
                    {agent.simulatedLoad}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${agent.simulatedLoad}%`,
                      backgroundColor: agent.accentColor,
                    }}
                  />
                </div>
              </div>

              {/* Animation State Switcher */}
              <div className="mt-3.5">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  <span>Mode Animasi</span>
                  <Power className="h-3 w-3 text-slate-500" />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {STATUS_ACTIONS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgentStatus(agent.id, st.id);
                      }}
                      className={`rounded-lg py-1.5 text-[11px] font-semibold transition ${
                        agent.status === st.id
                          ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50"
                          : "bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workstation Assignment & Quick Move */}
              {!compact && (
                <div className="mt-3.5 space-y-2.5 border-t border-slate-800/80 pt-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      <Monitor className="h-3 w-3 text-cyan-400" />
                      Workstation Tugas
                    </label>
                    <select
                      value={agent.assignedWorkstationId}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        assignAgentWorkstation(agent.id, e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700/80 bg-[#050b1c] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400"
                    >
                      {workstations.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.code} — {ws.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      <Footprints className="h-3 w-3 text-purple-400" />
                      Arahkan Jalan ke Zona
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DESTINATION_PRESETS.slice(0, 4).map((dest) => (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendAgentToWaypoint(agent.id, dest.id);
                          }}
                          className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-2 py-1 text-[10px] font-medium text-slate-200 transition hover:border-purple-400/60 hover:bg-purple-500/20"
                        >
                          {dest.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendAgentToWaypoint(agent.id, "wp-hub-north");
                        }}
                        className="rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2 py-1 text-[10px] font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        Holo Hub
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendAgentToWaypoint(agent.id, "wp-server-bay");
                        }}
                        className="rounded-lg border border-purple-500/35 bg-purple-500/10 px-2 py-1 text-[10px] font-medium text-purple-200 transition hover:bg-purple-500/20"
                      >
                        Server Bay
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgentId(agent.id);
                      setCameraPreset("interior");
                      setActiveSection("office");
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    <Box className="h-3.5 w-3.5" />
                    Lihat di Virtual Office 3D
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
