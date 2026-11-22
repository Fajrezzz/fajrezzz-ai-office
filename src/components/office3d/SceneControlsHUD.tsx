"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Car,
  Compass,
  Monitor,
  Moon,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Sun,
  Sunrise,
  Tag,
  Waves,
  Zap,
} from "lucide-react";
import { DESTINATION_PRESETS } from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
import type {
  CameraPreset,
  FloorView,
  LightingPreset,
  PerformanceMode,
} from "@/types/office";

const FLOOR_OPTIONS: { id: FloorView; label: string }[] = [
  { id: "l1", label: "L1" },
  { id: "l2", label: "L2" },
  { id: "l3", label: "L3" },
  { id: "roof", label: "Atap" },
  { id: "all", label: "Semua" },
];

const CAMERA_OPTIONS: { id: CameraPreset; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "interior", label: "Interior L2" },
  { id: "pool", label: "Kolam" },
  { id: "supercar", label: "Supercar" },
  { id: "rooftop", label: "Atap" },
  { id: "isometric", label: "Iso" },
];

const LIGHTING_OPTIONS: {
  id: LightingPreset;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "day", label: "Siang", icon: Sun },
  { id: "sunset", label: "Sore", icon: Sunrise },
  { id: "night", label: "Malam", icon: Moon },
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
    activeFloor,
    setActiveFloor,
    lightingPreset,
    setLightingPreset,
    autoRotate,
    setAutoRotate,
    performanceMode,
    setPerformanceMode,
    isSimulationRunning,
    setIsSimulationRunning,
    showLabelsIn3D,
    setShowLabelsIn3D,
    setAgentStatus,
    sendAgentToWaypoint,
  } = useOffice();

  const [clockText, setClockText] = useState("17:45");

  useEffect(() => {
    const update = () => {
      setClockText(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = window.setInterval(update, 15000);
    return () => window.clearInterval(id);
  }, []);

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  const lightingLabel =
    lightingPreset === "day"
      ? "Cerah Siang"
      : lightingPreset === "sunset"
      ? "Golden Hour"
      : "Malam & Lampu";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
      {/* ================= TOP HUD BAR ================= */}
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left Live HQ & Lighting Switcher */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="hidden rounded-xl border border-white/15 bg-slate-950/78 px-3 py-1.5 backdrop-blur-md sm:block">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-black tracking-wider text-white">
                {clockText}
              </span>
              <span className="text-[10px] font-semibold text-amber-300">
                FAJREZZZ HQ
              </span>
            </div>
            <div className="text-[10px] text-slate-300">
              {lightingLabel} • Visual Sim
            </div>
          </div>

          {/* Realistic Time-of-Day / Lighting Switcher (Siang / Sore / Malam) */}
          <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-950/80 p-1 backdrop-blur-md">
            {LIGHTING_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = lightingPreset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLightingPreset(opt.id)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition ${
                    active
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-Right Floor Switcher + Camera Angles Deck */}
        <div className="pointer-events-auto flex max-w-full flex-col items-end gap-1.5">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/82 p-1 backdrop-blur-md">
            {FLOOR_OPTIONS.map((fl) => (
              <button
                key={fl.id}
                type="button"
                onClick={() => setActiveFloor(fl.id)}
                className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                  activeFloor === fl.id
                    ? "bg-amber-400 text-slate-950 shadow-md"
                    : "bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {fl.label}
              </button>
            ))}

            <span className="mx-0.5 h-3.5 w-px shrink-0 bg-slate-700" />

            <Zap className="h-3 w-3 shrink-0 text-amber-300" />
            {PERF_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerformanceMode(p.id)}
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  performanceMode === p.id
                    ? "bg-sky-500/35 text-sky-100 ring-1 ring-sky-400/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/78 p-1 backdrop-blur-md">
            {CAMERA_OPTIONS.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setCameraPreset(cam.id)}
                className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition ${
                  cameraPreset === cam.id
                    ? "bg-sky-500/35 text-white ring-1 ring-sky-300/70"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM FLOATING ICON DOCK + ROBOT CONTROLS ================= */}
      <div className="space-y-1.5">
        <div className="flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/84 px-2.5 py-1.5 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setCameraPreset("interior")}
              title="Interior Lantai 2 (Workstations)"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                cameraPreset === "interior"
                  ? "border-amber-300 bg-amber-400 text-slate-950"
                  : "border-slate-700 bg-slate-900/90 text-slate-200 hover:border-amber-300/60"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset("pool")}
              title="Kolam Renang"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                cameraPreset === "pool"
                  ? "border-sky-300 bg-sky-400 text-slate-950"
                  : "border-slate-700 bg-slate-900/90 text-sky-300 hover:border-sky-300/60"
              }`}
            >
              <Waves className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset("supercar")}
              title="Supercar"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                cameraPreset === "supercar"
                  ? "border-amber-300 bg-amber-400 text-slate-950"
                  : "border-slate-700 bg-slate-900/90 text-amber-300 hover:border-amber-300/60"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset("rooftop")}
              title="Atap Helipad & Padel Court"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                cameraPreset === "rooftop"
                  ? "border-amber-300 bg-amber-400 text-slate-950"
                  : "border-slate-700 bg-slate-900/90 text-slate-200 hover:border-amber-300/60"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              title={
                autoRotate ? "Matikan Putar Otomatis" : "Putar Kamera Otomatis"
              }
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                autoRotate
                  ? "border-amber-300 bg-amber-400 text-slate-950"
                  : "border-slate-700 bg-slate-900/90 text-slate-300 hover:border-amber-300/60"
              }`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setIsSimulationRunning(!isSimulationRunning)}
              title={
                isSimulationRunning ? "Jeda Simulasi" : "Lanjutkan Simulasi"
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 transition hover:border-amber-300/60"
            >
              {isSimulationRunning ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 text-emerald-300" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLabelsIn3D(!showLabelsIn3D)}
              title="Tampilkan / Sembunyikan Kartu Status 3D"
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                showLabelsIn3D
                  ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
                  : "border-slate-700 bg-slate-900/90 text-slate-400"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Robot Selector + Quick Actions */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {agents.map((agent) => {
              const active = agent.id === selectedAgent?.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-left backdrop-blur-md transition ${
                    active
                      ? "border-amber-400/75 bg-slate-950/92 text-white shadow-lg"
                      : "border-white/15 bg-slate-950/75 text-slate-200 hover:border-slate-400/60"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: agent.accentColor }}
                  />
                  <div className="leading-tight">
                    <div className="text-[10px] font-bold tracking-wide sm:text-[11px]">
                      {agent.name}
                    </div>
                    <div className="text-[8px] uppercase tracking-wider text-slate-400">
                      {agent.status}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!compact && selectedAgent && (
            <div className="pointer-events-auto flex items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/82 px-2 py-1 backdrop-blur-md">
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-300">
                <Navigation className="h-3 w-3" />
                {selectedAgent.name}:
              </span>
              {(["idle", "working", "walking"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAgentStatus(selectedAgent.id, mode)}
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase transition ${
                    selectedAgent.status === mode
                      ? "border-amber-300/80 bg-amber-400 text-slate-950"
                      : "border-slate-700/80 bg-slate-900/80 text-slate-300"
                  }`}
                >
                  {mode === "working"
                    ? "Work"
                    : mode === "walking"
                    ? "Walk"
                    : "Idle"}
                </button>
              ))}
              <span className="h-3 w-px shrink-0 bg-slate-700" />
              {DESTINATION_PRESETS.slice(0, 5).map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => sendAgentToWaypoint(selectedAgent.id, dest.id)}
                  className="shrink-0 rounded-md border border-slate-700/80 bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-200 transition hover:border-sky-400/60 hover:bg-sky-500/20"
                >
                  {dest.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pointer-events-none flex items-center justify-between text-[9px] text-white/80 drop-shadow lg:justify-end">
          <span className="flex items-center gap-1 lg:hidden">
            <Compass className="h-3 w-3 text-amber-300" />1 jari: orbit • 2
            jari: zoom/pan • Pilih Siang/Sore/Malam
          </span>
          <span className="hidden items-center gap-1.5 lg:flex">
            <Compass className="h-3 w-3 text-amber-300" />
            Seret = putar • Scroll/Pinch = zoom • Pilih Siang / Sore / Malam &
            L1–L3 • Visual Placeholder (Non-AI)
          </span>
        </div>
      </div>
    </div>
  );
}
