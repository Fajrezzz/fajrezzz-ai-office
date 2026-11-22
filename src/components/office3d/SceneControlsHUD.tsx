"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  Car,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Crown,
  Eye,
  Gamepad2,
  Monitor,
  Moon,
  Move,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Sun,
  Sunrise,
  Tag,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  DESTINATION_PRESETS,
  FLOOR_1_Y,
  FLOOR_3_Y,
} from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
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
    setAgentStatus,
    sendAgentToWaypoint,
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

  const [clockText, setClockText] = useState("11:45");
  const [showMovePad, setShowMovePad] = useState(false);

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
      {/* ================= TOP HUD BAR ================= */}
      <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left Lighting + BOS FAJREZ Game Mode Button */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="hidden rounded-xl border border-white/15 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md sm:block">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-black tracking-wider text-white">
                {clockText}
              </span>
              <span className="text-[10px] font-semibold text-amber-300">
                FAJREZZZ HQ · 10 STAFF + BOS
              </span>
            </div>
            <div className="text-[10px] text-slate-300">
              {lightingLabel} • Simulasi 3D Interaktif
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Playable BOS FAJREZ Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsBossMode(!isBossMode)}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black tracking-wide shadow-lg backdrop-blur-md transition ${
                isBossMode
                  ? "border-amber-200 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 ring-2 ring-amber-300/60"
                  : "border-amber-400/70 bg-slate-950/88 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>{isBossMode ? "BOS FAJREZ AKTIF" : "Main Bos FAJREZ"}</span>
            </button>

            {/* Lighting Switcher (Siang / Sore / Malam) */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-950/82 p-1 backdrop-blur-md">
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
        </div>

        {/* Top-Right Floor Switcher + Quality + Camera Presets */}
        <div className="pointer-events-auto flex max-w-full flex-col items-end gap-1.5">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/84 p-1 backdrop-blur-md">
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

          {!isBossMode && (
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/80 p-1 backdrop-blur-md">
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
          )}
        </div>
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

          {/* 10 Staff Selector + Quick Focus & Commands */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto pb-0.5">
              {agents.map((agent) => {
                const active = agent.id === selectedAgent?.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    onDoubleClick={() => focusOnAgent(agent.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2 py-1 text-left backdrop-blur-md transition ${
                      active
                        ? "border-amber-400/80 bg-slate-950/92 text-white shadow-lg"
                        : "border-white/15 bg-slate-950/75 text-slate-200 hover:border-slate-400/60"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: agent.accentColor }}
                    />
                    <div className="leading-tight">
                      <div className="text-[10px] font-bold tracking-wide">
                        {agent.name.split(" ")[0]}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">
                        L{agent.floor} · {agent.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!compact && selectedAgent && (
              <div className="pointer-events-auto flex items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-slate-950/84 px-2 py-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => focusOnAgent(selectedAgent.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md border border-sky-400/60 bg-sky-500/25 px-2 py-0.5 text-[9px] font-bold text-sky-100 transition hover:bg-sky-500/40"
                >
                  <Crosshair className="h-3 w-3" />
                  Fokus {selectedAgent.name.split(" ")[0]}
                </button>
                <span className="h-3 w-px shrink-0 bg-slate-700" />
                <span className="hidden shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-300 md:flex">
                  <Navigation className="h-3 w-3" />
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
                {DESTINATION_PRESETS.slice(0, 6).map((dest) => (
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

          <div className="pointer-events-none flex items-center justify-between text-[9px] text-white/85 drop-shadow lg:justify-end">
            <span className="flex items-center gap-1 lg:hidden">
              <Compass className="h-3 w-3 text-amber-300" />
              Klik &ldquo;Main Bos FAJREZ&rdquo; untuk analog game • Tap 2x
              zoom bebas
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <Compass className="h-3 w-3 text-amber-300" />
              Klik &ldquo;Main Bos FAJREZ&rdquo; untuk analog/WASD • Klik 2x
              fokus zoom bebas • 10 Staff Simulasi + Bos FAJREZ (Non-AI)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
