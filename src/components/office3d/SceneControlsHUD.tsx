"use client";

import React from "react";
import {
  Camera,
  Cpu,
  Navigation,
  Pause,
  Play,
  Tag,
  Zap,
} from "lucide-react";
import { DESTINATION_PRESETS } from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset, PerformanceMode } from "@/types/office";

const CAMERA_OPTIONS: { id: CameraPreset; label: string }[] = [
  { id: "isometric", label: "Isometric" },
  { id: "overview", label: "Top View" },
  { id: "workstations", label: "Desks" },
  { id: "holohub", label: "Holo Hub" },
];

const PERF_OPTIONS: { id: PerformanceMode; label: string }[] = [
  { id: "eco", label: "Eco" },
  { id: "balanced", label: "Bal" },
  { id: "high", label: "High" },
];

export function SceneControlsHUD({ compact = false }: { compact?: boolean }) {
  const {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    cameraPreset,
    setCameraPreset,
    performanceMode,
    setPerformanceMode,
    isSimulationRunning,
    setIsSimulationRunning,
    showLabelsIn3D,
    setShowLabelsIn3D,
    setAgentStatus,
    sendAgentToWaypoint,
  } = useOffice();

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-3.5">
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
        {/* Camera Preset Pills */}
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-cyan-500/25 bg-[#050b1d]/80 p-1 backdrop-blur-md">
          <Camera className="ml-1.5 mr-0.5 hidden h-3.5 w-3.5 shrink-0 text-cyan-400 sm:block" />
          {CAMERA_OPTIONS.map((cam) => (
            <button
              key={cam.id}
              type="button"
              onClick={() => setCameraPreset(cam.id)}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium transition-all sm:text-[11px] ${
                cameraPreset === cam.id
                  ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>

        {/* Simulation & Performance Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            title={
              isSimulationRunning
                ? "Jeda animasi simulasi"
                : "Lanjutkan animasi simulasi"
            }
            className="flex items-center gap-1 rounded-xl border border-purple-500/30 bg-[#050b1d]/80 px-2.5 py-1.5 text-[11px] font-medium text-purple-200 backdrop-blur-md transition hover:border-purple-400/60 hover:bg-purple-500/20"
          >
            {isSimulationRunning ? (
              <Pause className="h-3.5 w-3.5 text-purple-300" />
            ) : (
              <Play className="h-3.5 w-3.5 text-cyan-300" />
            )}
            <span className="hidden sm:inline">
              {isSimulationRunning ? "Simulasi Aktif" : "Dijeda"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowLabelsIn3D(!showLabelsIn3D)}
            title="Tampilkan / Sembunyikan Label 3D"
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-md transition ${
              showLabelsIn3D
                ? "border-cyan-500/35 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700/60 bg-[#050b1d]/80 text-slate-400"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Label</span>
          </button>

          <div
            className="flex items-center gap-0.5 rounded-xl border border-slate-700/60 bg-[#050b1d]/80 p-1 backdrop-blur-md"
            title="Optimasi Performa WebGL (Eco direkomendasikan untuk Android)"
          >
            <Zap className="ml-1 mr-0.5 h-3 w-3 text-cyan-400" />
            {PERF_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerformanceMode(p.id)}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  performanceMode === p.id
                    ? "bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Robot Quick-Dispatch Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        {/* Robot Selector Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {agents.map((agent) => {
            const active = agent.id === selectedAgent?.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgentId(agent.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left backdrop-blur-md transition ${
                  active
                    ? "border-cyan-400/60 bg-[#071530]/90 text-white shadow-[0_0_16px_rgba(0,229,255,0.2)]"
                    : "border-slate-700/60 bg-[#050b1d]/75 text-slate-300 hover:border-slate-500/80"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: agent.accentColor }}
                />
                <div className="leading-tight">
                  <div className="text-[11px] font-semibold tracking-wide">
                    {agent.name}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">
                    {agent.status}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Status + Move Command Chips for Selected Robot */}
        {!compact && selectedAgent && (
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto rounded-xl border border-cyan-500/20 bg-[#050b1d]/82 px-2.5 py-1.5 backdrop-blur-md">
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-cyan-300">
              <Navigation className="h-3 w-3" />
              {selectedAgent.name}:
            </span>
            {(["idle", "working", "walking"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAgentStatus(selectedAgent.id, mode)}
                className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase transition ${
                  selectedAgent.status === mode
                    ? "border-purple-400/70 bg-purple-500/25 text-purple-100"
                    : "border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-purple-400/50"
                }`}
              >
                {mode === "working" ? "Work" : mode === "walking" ? "Walk" : "Idle"}
              </button>
            ))}
            <span className="h-3 w-px shrink-0 bg-slate-700/80" />
            {DESTINATION_PRESETS.slice(0, 5).map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => sendAgentToWaypoint(selectedAgent.id, dest.id)}
                className="shrink-0 rounded-lg border border-slate-700/70 bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-slate-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-cyan-100"
              >
                {dest.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subtle Controls Hint (Mobile + Desktop) */}
      <div className="pointer-events-none flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-400/85 lg:justify-end">
        <span className="lg:hidden">1 jari: orbit • 2 jari: zoom/pan</span>
        <span className="hidden items-center gap-1.5 lg:flex">
          <Cpu className="h-3 w-3 text-purple-400" />
          Drag untuk orbit • Scroll/Pinch untuk zoom • Klik robot atau meja
          untuk interaksi • Mode Visual Placeholder (Non-AI)
        </span>
      </div>
    </div>
  );
}
