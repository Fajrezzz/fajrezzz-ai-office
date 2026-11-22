"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  Camera,
  Car,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Crown,
  Eye,
  Gamepad2,
  Layers,
  Monitor,
  Moon,
  Move,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Sunrise,
  Tag,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  FLOOR_1_Y,
  FLOOR_3_Y,
} from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
import { useAgency } from "@/store/AgencyContext";
import type {
  BossFloor,
  CameraPreset,
  FloorView,
  LightingPreset,
  PerformanceMode,
} from "@/types/office";

const FLOOR_OPTIONS: { id: FloorView; label: string }[] = [
  { id: "all", label: "Full" },
  { id: "l1", label: "L1" },
  { id: "l2", label: "L2 Ops" },
  { id: "l3", label: "L3 Exec" },
  { id: "roof", label: "Atap" },
];

const CAMERA_OPTIONS: { id: CameraPreset; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "interior", label: "Ops L2" },
  { id: "executive", label: "Exec L3" },
  { id: "pool", label: "Kolam" },
  { id: "supercar", label: "Porsche 22" },
  { id: "rooftop", label: "Atap" },
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

/** Smooth 360-degree Touch & Mouse Game Analog Joystick for BOS FAJREZ */
function VirtualAnalogJoystick({
  onChange,
}: {
  onChange: (x: number, y: number) => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const maxRadius = 38;

  const updateStick = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;

    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    // +x = right, +y = forward (up on screen = negative dy)
    onChange(dx / maxRadius, -dy / maxRadius);
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = "translate3d(0px, 0px, 0)";
    }
    onChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
        updateStick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateStick(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      onPointerCancel={() => resetStick()}
      className="relative flex h-28 w-28 touch-none select-none items-center justify-center rounded-full border-2 border-amber-400/60 bg-slate-950/75 shadow-[0_0_28px_rgba(245,158,11,0.3)] backdrop-blur-md"
    >
      {/* Directional ring marks */}
      <span className="pointer-events-none absolute top-2 text-[10px] font-bold text-amber-300/75">
        ▲
      </span>
      <span className="pointer-events-none absolute bottom-2 text-[10px] font-bold text-amber-300/75">
        ▼
      </span>
      <span className="pointer-events-none absolute left-2.5 text-[10px] font-bold text-amber-300/75">
        ◀
      </span>
      <span className="pointer-events-none absolute right-2.5 text-[10px] font-bold text-amber-300/75">
        ▶
      </span>

      {/* Inner tactile guide ring */}
      <div className="pointer-events-none h-14 w-14 rounded-full border border-white/15 bg-white/5" />

      {/* Movable Analog Thumb Knob */}
      <div
        ref={knobRef}
        className="pointer-events-none absolute flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl"
      >
        <Crown className="h-5 w-5 text-slate-950" />
      </div>
    </div>
  );
}

export function SceneControlsHUD({ compact = false }: { compact?: boolean }) {
  const {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    cameraPreset,
    setCameraPreset,
    focusCameraOn,
    focusOnAgent,
    cameraNudgeRef,
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
    isBossMode,
    setIsBossMode,
    bossFollowCamera,
    setBossFollowCamera,
    bossFloor,
    bossActionState,
    bossJoystickRef,
    teleportBoss,
    moveBossToFloor,
  } = useOffice();

  const { getAgentSnapshot, runDivision, runningDivision } = useAgency();

  const [clockText, setClockText] = useState("11:45");
  const [showMovePad, setShowMovePad] = useState(false);
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"logs" | "input" | "output">("logs");
  const prevSelectedRef = useRef<string | null>(selectedAgentId);

  // Auto-open real task/log inspector when user clicks an agent in the 3D scene
  useEffect(() => {
    if (selectedAgentId && selectedAgentId !== prevSelectedRef.current) {
      setInspectorOpen(true);
    }
    prevSelectedRef.current = selectedAgentId;
  }, [selectedAgentId]);

  const selectedSnapshot = selectedAgentId
    ? getAgentSnapshot(selectedAgentId)
    : null;

  const cycleLighting = () => {
    const order: LightingPreset[] = ["day", "sunset", "night"];
    const next = order[(order.indexOf(lightingPreset) + 1) % order.length];
    setLightingPreset(next);
  };

  const cycleFloor = () => {
    const order: FloorView[] = ["all", "l1", "l2", "l3", "roof"];
    const next = order[(order.indexOf(activeFloor) + 1) % order.length];
    setActiveFloor(next);
  };

  const cycleCamera = () => {
    const order: CameraPreset[] = [
      "front",
      "interior",
      "executive",
      "pool",
      "supercar",
      "rooftop",
    ];
    const next = order[(order.indexOf(cameraPreset) + 1) % order.length];
    setCameraPreset(next);
  };

  const cyclePerformance = () => {
    const order: PerformanceMode[] = ["eco", "balanced", "high"];
    const next = order[(order.indexOf(performanceMode) + 1) % order.length];
    setPerformanceMode(next);
  };

  const ActiveLightingIcon =
    LIGHTING_OPTIONS.find((o) => o.id === lightingPreset)?.icon ?? Sun;
  const activeLightingShort =
    LIGHTING_OPTIONS.find((o) => o.id === lightingPreset)?.label ?? "Siang";
  const activeFloorShort =
    FLOOR_OPTIONS.find((o) => o.id === activeFloor)?.label ?? "Full";
  const activeCameraShort =
    CAMERA_OPTIONS.find((o) => o.id === cameraPreset)?.label ?? "Depan";
  const activePerfShort =
    PERF_OPTIONS.find((o) => o.id === performanceMode)?.label ?? "Eco";

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

  const bossActionText =
    bossActionState === "swimming"
      ? "BERENANG"
      : bossActionState === "running"
      ? "BERLARI"
      : bossActionState === "walking"
      ? "BERJALAN"
      : "STANDBY";

  const bindNudge = (axis: "forward" | "right" | "up", val: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      cameraNudgeRef.current[axis] = val;
    },
    onPointerUp: () => {
      cameraNudgeRef.current[axis] = 0;
    },
    onPointerLeave: () => {
      cameraNudgeRef.current[axis] = 0;
    },
    onPointerCancel: () => {
      cameraNudgeRef.current[axis] = 0;
    },
  });

  const BOSS_FLOORS: { id: BossFloor; label: string }[] = [
    { id: 1, label: "L1" },
    { id: 2, label: "L2" },
    { id: 3, label: "L3" },
    { id: 4, label: "Atap" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
      {/* ================= SINGLE COMPACT COLLAPSIBLE GLASSMORPHISM NEON ICON BAR ================= */}
      <div className="pointer-events-auto flex w-full flex-col items-start gap-2">
        <div className="flex w-full items-center justify-between gap-1.5 rounded-2xl border border-cyan-400/35 bg-slate-950/68 px-1.5 py-1 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-xl sm:w-auto sm:gap-2 sm:px-2">
          {/* Desktop Compact Brand + Clock Pill (inline, zero extra rows!) */}
          <div className="hidden items-center gap-2 border-r border-cyan-400/20 pr-2.5 pl-1.5 md:flex">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="font-mono text-xs font-black tracking-wider text-white">
              {clockText}
            </span>
            <span className="text-[10px] font-bold tracking-wide text-cyan-300">
              FAJREZZZ HQ
            </span>
            <span className="text-[10px] text-slate-400">· {lightingLabel}</span>
          </div>

          {/* Primary Single-Row Icon Controls — Every Touch Target >= 44x44px */}
          <div className="flex flex-1 items-center justify-between gap-1 overflow-x-auto sm:flex-none sm:justify-start sm:gap-1.5">
            {/* 1. Playable BOS FAJREZ Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsBossMode(!isBossMode)}
              title={isBossMode ? "BOS FAJREZ Aktif" : "Main Bos FAJREZ"}
              aria-label="Toggle Mode Bos FAJREZ"
              className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-black tracking-wide transition ${
                isBossMode
                  ? "border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.55)]"
                  : "border-amber-400/45 bg-slate-900/75 text-amber-300 hover:border-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <Gamepad2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">
                {isBossMode ? "BOS AKTIF" : "BOS"}
              </span>
            </button>

            {/* 2. Lighting Quick Cycle (Siang / Sore / Malam) */}
            <button
              type="button"
              onClick={cycleLighting}
              title={`Waktu: ${activeLightingShort} (Ketuk untuk ganti)`}
              aria-label={`Waktu pencahayaan ${activeLightingShort}`}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-slate-900/70 px-2.5 text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
            >
              <ActiveLightingIcon className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="hidden xs:inline sm:inline">
                {activeLightingShort}
              </span>
            </button>

            {/* 3. Floor Quick Cycle (Full / L1 / L2 / L3 / Atap) */}
            <button
              type="button"
              onClick={cycleFloor}
              title={`Lantai: ${activeFloorShort} (Ketuk untuk ganti)`}
              aria-label={`Lantai ${activeFloorShort}`}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-fuchsia-400/30 bg-slate-900/70 px-2.5 text-[11px] font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/70 hover:bg-fuchsia-500/15"
            >
              <Layers className="h-4 w-4 shrink-0 text-fuchsia-300" />
              <span className="hidden sm:inline">{activeFloorShort}</span>
            </button>

            {/* 4. Camera Quick Cycle (Hidden in Boss Mode) */}
            {!isBossMode && (
              <button
                type="button"
                onClick={cycleCamera}
                title={`Kamera: ${activeCameraShort} (Ketuk untuk ganti)`}
                aria-label={`Kamera ${activeCameraShort}`}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-400/30 bg-slate-900/70 px-2.5 text-[11px] font-semibold text-sky-100 transition hover:border-sky-300/70 hover:bg-sky-500/15"
              >
                <Camera className="h-4 w-4 shrink-0 text-sky-300" />
                <span className="hidden sm:inline">{activeCameraShort}</span>
              </button>
            )}

            {/* 5. Graphics Quality Quick Cycle (Eco / Bal / High) */}
            <button
              type="button"
              onClick={cyclePerformance}
              title={`Grafis: ${activePerfShort} (Ketuk untuk ganti)`}
              aria-label={`Kualitas grafis ${activePerfShort}`}
              className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border px-2.5 text-[11px] font-bold transition ${
                performanceMode === "high"
                  ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100"
                  : performanceMode === "balanced"
                  ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                  : "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
              }`}
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span>{activePerfShort}</span>
            </button>

            {/* 6. Collapse / Expand Full Control Drawer Button */}
            <button
              type="button"
              onClick={() => setIsBarExpanded((v) => !v)}
              aria-expanded={isBarExpanded}
              aria-label={
                isBarExpanded ? "Tutup panel kontrol" : "Buka semua kontrol"
              }
              className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border transition ${
                isBarExpanded
                  ? "border-cyan-300 bg-cyan-400/25 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.4)]"
                  : "border-white/15 bg-slate-900/75 text-slate-200 hover:border-cyan-300/60 hover:text-cyan-200"
              }`}
            >
              {isBarExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Glassmorphism Neon Control Drawer (All Direct Pickers, >=44px Touch Targets) */}
        {isBarExpanded && (
          <div className="w-full max-w-xl space-y-2.5 rounded-2xl border border-cyan-400/35 bg-slate-950/82 p-3 shadow-[0_8px_36px_rgba(14,165,233,0.22)] backdrop-blur-xl">
            {/* Waktu / Lighting */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
                Waktu & Suasana
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {LIGHTING_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = lightingPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLightingPreset(opt.id)}
                      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                        active
                          ? "border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                          : "border-white/10 bg-slate-900/75 text-slate-200 hover:border-cyan-400/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lantai / Floor */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-fuchsia-300 uppercase">
                Lantai Gedung
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FLOOR_OPTIONS.map((fl) => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setActiveFloor(fl.id)}
                    className={`min-h-[44px] min-w-[44px] flex-1 rounded-xl border px-2.5 text-xs font-bold transition ${
                      activeFloor === fl.id
                        ? "border-fuchsia-300 bg-fuchsia-500/30 text-white shadow-[0_0_12px_rgba(232,121,249,0.4)]"
                        : "border-white/10 bg-slate-900/75 text-slate-300 hover:border-fuchsia-400/50"
                    }`}
                  >
                    {fl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kamera / Camera Presets */}
            {!isBossMode && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-sky-300 uppercase">
                  Sudut Kamera
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {CAMERA_OPTIONS.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => setCameraPreset(cam.id)}
                      className={`min-h-[44px] rounded-xl border px-2 text-xs font-semibold transition ${
                        cameraPreset === cam.id
                          ? "border-cyan-300 bg-cyan-500/30 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                          : "border-white/10 bg-slate-900/75 text-slate-300 hover:border-cyan-400/50"
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kualitas Grafis / Performance Mode */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                Performa Grafis (Android Friendly)
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PERF_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPerformanceMode(p.id)}
                    className={`min-h-[44px] rounded-xl border px-3 text-xs font-bold transition ${
                      performanceMode === p.id
                        ? "border-emerald-300 bg-emerald-500/30 text-white shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                        : "border-white/10 bg-slate-900/75 text-slate-300 hover:border-emerald-400/50"
                    }`}
                  >
                    {p.label}
                    <span className="ml-1 text-[10px] font-normal opacity-80">
                      {p.id === "eco"
                        ? "≥30fps"
                        : p.id === "balanced"
                        ? "Bloom"
                        : "Full"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= FREE-ROAM TOUCH MOVE PAD (when not in Boss Mode) ================= */}
      {!isBossMode && showMovePad && (
        <div className="pointer-events-auto my-auto ml-auto flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-950/85 p-2 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              type="button"
              {...bindNudge("forward", 1)}
              aria-label="Maju"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-sky-500"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div />
            <button
              type="button"
              {...bindNudge("right", -1)}
              aria-label="Geser Kiri"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-sky-500"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              {...bindNudge("forward", -1)}
              aria-label="Mundur"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-sky-500"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              {...bindNudge("right", 1)}
              aria-label="Geser Kanan"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white active:bg-sky-500"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              {...bindNudge("up", 1)}
              aria-label="Kamera Naik"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-amber-300 active:bg-amber-400 active:text-slate-950"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              {...bindNudge("up", -1)}
              aria-label="Kamera Turun"
              className="flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-amber-300 active:bg-amber-400 active:text-slate-950"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= BOTTOM HUD: GAME ANALOG MODE (BOS FAJREZ) OR OFFICE OVERVIEW ================= */}
      {isBossMode ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            {/* LEFT: VIRTUAL GAME ANALOG JOYSTICK */}
            <div className="pointer-events-auto flex flex-col items-center gap-1">
              <VirtualAnalogJoystick
                onChange={(x, y) => {
                  bossJoystickRef.current.x = x;
                  bossJoystickRef.current.y = y;
                }}
              />
              <span className="rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-300 backdrop-blur">
                ANALOG BOS FAJREZ
              </span>
            </div>

            {/* RIGHT: FLOOR ELEVATOR + QUICK WARP (KOLAM / MOBIL / LOBI / CEO) */}
            <div className="pointer-events-auto flex max-w-[230px] flex-col items-end gap-1.5 sm:max-w-xs">
              {/* Boss Live Status Pill */}
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-slate-950/88 px-2.5 py-1 text-[10px] font-bold text-amber-200 backdrop-blur-md">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  L{bossFloor === 4 ? " ATAP" : bossFloor} · {bossActionText}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBossMode(false)}
                  title="Keluar Mode Bos"
                  className="ml-1 rounded-md bg-slate-800 p-0.5 text-slate-300 hover:bg-rose-500/30 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Floor Lift Selector (L1 -> L2 -> L3 -> Atap) */}
              <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-950/86 p-1 backdrop-blur-md">
                <span className="px-1 text-[9px] font-bold uppercase text-slate-400">
                  Lantai:
                </span>
                {BOSS_FLOORS.map((fl) => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => moveBossToFloor(fl.id)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${
                      bossFloor === fl.id
                        ? "bg-amber-400 text-slate-950 shadow"
                        : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {fl.label}
                  </button>
                ))}
              </div>

              {/* Quick Game Actions: Swim Pool, Supercar, Lobby, CEO Office, Follow Cam */}
              <div className="flex flex-wrap justify-end gap-1">
                <button
                  type="button"
                  onClick={() =>
                    teleportBoss(
                      [-4.2, FLOOR_1_Y, 11.4],
                      1,
                      "Kolam Renang (Berenang)",
                      0
                    )
                  }
                  className="flex items-center gap-1 rounded-xl border border-sky-400/60 bg-sky-500/25 px-2.5 py-1.5 text-[10px] font-bold text-sky-100 backdrop-blur-md transition active:scale-95"
                >
                  <Waves className="h-3.5 w-3.5 text-sky-300" />
                  <span>Masuk Kolam</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    teleportBoss([6.6, FLOOR_1_Y, 11.2], 1, "Porsche 22 Bay", Math.PI / 2)
                  }
                  className="flex items-center gap-1 rounded-xl border border-rose-400/50 bg-rose-500/20 px-2.5 py-1.5 text-[10px] font-bold text-rose-100 backdrop-blur-md transition active:scale-95"
                >
                  <Car className="h-3.5 w-3.5 text-rose-300" />
                  <span>Porsche 22</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    teleportBoss([0, FLOOR_1_Y, -1.5], 1, "Grand Lobby L1", Math.PI)
                  }
                  className="flex items-center gap-1 rounded-xl border border-white/20 bg-slate-900/85 px-2.5 py-1.5 text-[10px] font-bold text-slate-100 backdrop-blur-md transition active:scale-95"
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-300" />
                  <span>Lobi</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    teleportBoss([7.4, FLOOR_3_Y, -2.4], 3, "Ruang CEO L3", Math.PI)
                  }
                  className="flex items-center gap-1 rounded-xl border border-amber-400/50 bg-amber-500/20 px-2.5 py-1.5 text-[10px] font-bold text-amber-100 backdrop-blur-md transition active:scale-95"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  <span>CEO L3</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBossFollowCamera(!bossFollowCamera)}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold backdrop-blur-md transition ${
                    bossFollowCamera
                      ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-100"
                      : "border-slate-600 bg-slate-900/85 text-slate-300"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{bossFollowCamera ? "Ikuti Bos" : "Kamera Bebas"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none flex items-center justify-between text-[9px] text-white/90 drop-shadow lg:justify-end">
            <span className="lg:hidden">
              Gerakkan Analog untuk jalan / masuk kolam • Seret layar untuk putar
              kamera
            </span>
            <span className="hidden lg:inline">
              Analog atau WASD/Panah (+ Shift lari) = Gerakkan BOS FAJREZ •
              Masuk kolam otomatis berenang • Pilih L1/L2/L3/Atap
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/86 px-2.5 py-1.5 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsBossMode(true)}
                title="Mainkan BOS FAJREZ dengan Analog"
                className="flex h-8 items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 text-[10px] font-black text-slate-950 shadow transition hover:brightness-110"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                <span>Bos</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMovePad((v) => !v)}
                title="Pad Gerak Bebas (Free-Roam HP/PC)"
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  showMovePad
                    ? "border-sky-300 bg-sky-400 text-slate-950"
                    : "border-slate-700 bg-slate-900/90 text-sky-200 hover:border-sky-300/60"
                }`}
              >
                <Move className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCameraPreset("interior")}
                title="Lantai 2 Operations Hall (8 Workstation)"
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
                title="Infinity Pool Deck"
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
                onClick={() => focusCameraOn([9.4, 0.9, 11.3], [5.4, 2.8, 6.2])}
                title="Zoom ke Porsche 22"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-rose-300 transition hover:border-rose-300/60"
              >
                <Car className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset("rooftop")}
                title="Atap Helikopter & Bulu Tangkis"
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
                title="Tampilkan / Sembunyikan Label Nama 3D"
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

          {/* Real Agent Inspector Drawer — Tugas, Input, Output & Log Terakhir */}
          {!compact && selectedAgent && inspectorOpen && (
            <div className="pointer-events-auto ml-auto w-full max-w-md rounded-2xl border border-cyan-400/40 bg-slate-950/92 p-3 text-xs shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-white">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selectedAgent.accentColor }}
                    />
                    <span>{selectedAgent.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        selectedAgent.status === "working"
                          ? "bg-emerald-500/25 text-emerald-200"
                          : selectedAgent.status === "walking"
                          ? "bg-sky-500/25 text-sky-200"
                          : selectedAgent.status === "error"
                          ? "bg-rose-500/25 text-rose-200"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {selectedAgent.status === "working"
                        ? "WORK"
                        : selectedAgent.status === "walking"
                        ? "WALK"
                        : selectedAgent.status === "error"
                        ? "ERROR"
                        : "IDLE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedSnapshot?.divisionLabel ?? selectedAgent.role} ·{" "}
                    {selectedAgent.currentActionLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedSnapshot?.episodeId && (
                    <button
                      type="button"
                      disabled={Boolean(runningDivision)}
                      onClick={() =>
                        runDivision(
                          selectedSnapshot.episodeId!,
                          selectedSnapshot.division
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-40"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setInspectorOpen(false)}
                    aria-label="Tutup inspektor"
                    className="rounded-lg border border-slate-700 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {selectedSnapshot ? (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="truncate">
                      Episode: <strong>{selectedSnapshot.episodeTitle ?? "Belum ada"}</strong>
                    </span>
                    <span className="font-mono text-cyan-300">
                      {selectedSnapshot.durationMs > 0
                        ? `${(selectedSnapshot.durationMs / 1000).toFixed(1)}d`
                        : "—"}
                    </span>
                  </div>

                  {selectedSnapshot.error && (
                    <div className="rounded-xl border border-rose-500/50 bg-rose-950/60 p-2 text-[10px] text-rose-200">
                      <strong>Error:</strong> {selectedSnapshot.error}
                    </div>
                  )}

                  <div className="flex gap-1">
                    {(["logs", "input", "output"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setInspectorTab(tab)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                          inspectorTab === tab
                            ? "bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/60"
                            : "bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab === "logs"
                          ? `Log (${selectedSnapshot.logs.length})`
                          : tab === "input"
                          ? "Input JSON"
                          : "Output JSON"}
                      </button>
                    ))}
                  </div>

                  {inspectorTab === "logs" && (
                    <div className="max-h-28 overflow-y-auto rounded-xl bg-slate-900/90 p-2 font-mono text-[10px] text-slate-300">
                      {selectedSnapshot.logs.length === 0 ? (
                        <span className="text-slate-500">
                          Belum ada tugas dijalankan untuk divisi ini.
                        </span>
                      ) : (
                        selectedSnapshot.logs.slice(-8).map((l, i) => (
                          <div
                            key={i}
                            className={
                              l.level === "error"
                                ? "text-rose-300"
                                : l.level === "success"
                                ? "text-emerald-300"
                                : "text-slate-300"
                            }
                          >
                            [{l.time}] {l.message}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {inspectorTab === "input" && (
                    <pre className="max-h-28 overflow-auto rounded-xl bg-slate-900/90 p-2 text-[9px] text-amber-200">
                      {selectedSnapshot.input
                        ? JSON.stringify(selectedSnapshot.input, null, 2)
                        : "Belum ada input tugas."}
                    </pre>
                  )}

                  {inspectorTab === "output" && (
                    <pre className="max-h-28 overflow-auto rounded-xl bg-slate-900/90 p-2 text-[9px] text-cyan-200">
                      {selectedSnapshot.output
                        ? JSON.stringify(selectedSnapshot.output, null, 2)
                        : "Belum ada output tugas."}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="mt-2 rounded-xl bg-slate-900/80 p-2 text-[10px] text-slate-400">
                  Staf pendukung kantor — antrean divisi terhubung ke 7 divisi
                  produksi utama (Riset, SEO, Naskah, Suara, Motion, Editing, QC).
                </div>
              )}
            </div>
          )}

          {/* Staff Selector + Real Status & Focus */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
              {agents.map((agent) => {
                const active = agent.id === selectedAgent?.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setInspectorOpen(true);
                    }}
                    onDoubleClick={() => focusOnAgent(agent.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2 py-1 text-left backdrop-blur-md transition ${
                      agent.status === "error"
                        ? "border-rose-500/80 bg-rose-950/85 text-rose-100"
                        : active
                        ? "border-amber-400/80 bg-slate-950/92 text-white shadow-lg"
                        : "border-white/15 bg-slate-950/75 text-slate-200 hover:border-slate-400/60"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          agent.status === "error"
                            ? "#ef4444"
                            : agent.status === "working"
                            ? "#10b981"
                            : agent.accentColor,
                      }}
                    />
                    <div className="leading-tight">
                      <div className="text-[10px] font-bold tracking-wide">
                        {agent.name.split(" ")[0]}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">
                        L{agent.floor} ·{" "}
                        {agent.status === "working"
                          ? "WORK"
                          : agent.status === "walking"
                          ? "WALK"
                          : agent.status === "error"
                          ? "ERROR"
                          : "IDLE"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!compact && selectedAgent && (
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/84 px-2 py-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => focusOnAgent(selectedAgent.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-sky-400/60 bg-sky-500/25 px-2 py-1 text-[10px] font-bold text-sky-100 transition hover:bg-sky-500/40"
                >
                  <Crosshair className="h-3 w-3" />
                  <span>Fokus {selectedAgent.name.split(" ")[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-cyan-400/50 bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-500/30"
                >
                  <span>{inspectorOpen ? "Tutup Log" : "Lihat Tugas & Log"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="pointer-events-none flex items-center justify-between text-[9px] text-white/85 drop-shadow lg:justify-end">
            <span className="flex items-center gap-1 lg:hidden">
              <Compass className="h-3 w-3 text-amber-300" />
              Klik agen untuk lihat tugas, input, output &amp; log nyata
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <Compass className="h-3 w-3 text-amber-300" />
              Agen bekerja di meja HANYA saat divisi aktif • Antrean kosong = IDLE •
              Gagal = Indikator Merah di Meja • Klik agen untuk inspeksi log
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
