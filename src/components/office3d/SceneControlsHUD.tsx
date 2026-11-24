"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Camera,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  RotateCcw,
  Sun,
  Sunrise,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset, FloorView, LightingPreset } from "@/types/office";

/**
 * HUD minimalis Kantor 3D.
 *
 * Sengaja CUMA berisi kontrol kamera & suasana: cahaya, lantai, sudut kamera,
 * reset, dan layar penuh. Tidak ada banner produksi, panel tugas/log, daftar
 * staf, indikator lift, atau angka telemetri — biar scene-nya yang jadi fokus.
 */

const FLOOR_ORDER: FloorView[] = ["all", "l1", "l2", "l3", "roof"];
const FLOOR_LABEL: Record<FloorView, string> = {
  all: "Semua lantai",
  l1: "Lantai 1 · Lobi & kolam",
  l2: "Lantai 2 · Workspace",
  l3: "Lantai 3 · Visual",
  roof: "Atap · Crown Sky Deck",
};

const LIGHT_ORDER: LightingPreset[] = ["day", "sunset", "night"];
const LIGHT_LABEL: Record<LightingPreset, string> = {
  day: "Siang",
  sunset: "Sore",
  night: "Malam",
};

const CAM_ORDER: CameraPreset[] = [
  "isometric",
  "front",
  "pool",
  "rooftop",
  "interior",
  "executive",
];
const CAM_LABEL: Record<CameraPreset, string> = {
  isometric: "Isometrik",
  front: "Depan",
  interior: "Interior",
  executive: "Eksekutif",
  pool: "Kolam",
  supercar: "Supercar",
  rooftop: "Atap",
};

const STAGE_ID = "office-3d-stage";

function next<T>(order: T[], current: T): T {
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

export function SceneControlsHUD({ compact = false }: { compact?: boolean }) {
  const {
    cameraPreset,
    setCameraPreset,
    activeFloor,
    setActiveFloor,
    lightingPreset,
    setLightingPreset,
  } = useOffice();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stage = document.getElementById(STAGE_ID);
      setIsFullscreen(Boolean(stage && document.fullscreenElement === stage));
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const stage = document.getElementById(STAGE_ID) ?? document.documentElement;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stage.requestFullscreen();
        // HP: kunci orientasi kalau browser mengizinkan (abaikan kalau tidak)
        try {
          await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })
            ?.lock?.("portrait");
        } catch {
          /* tidak didukung — biarkan */
        }
      }
    } catch {
      /* fullscreen ditolak browser — abaikan */
    }
  }, []);

  const LightIcon =
    lightingPreset === "night" ? Moon : lightingPreset === "sunset" ? Sunrise : Sun;

  const buttonClass =
    "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/55 text-slate-200 backdrop-blur-md transition-colors hover:border-cyan-300/40 hover:bg-cyan-500/15 hover:text-cyan-100 active:scale-95";

  return (
    <div
      className={`pointer-events-none absolute right-2 z-30 flex items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/35 p-1 shadow-lg backdrop-blur-md ${
        compact ? "top-2" : "top-3"
      }`}
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={() => setLightingPreset(next(LIGHT_ORDER, lightingPreset))}
        className={buttonClass}
        aria-label={`Cahaya: ${LIGHT_LABEL[lightingPreset] ?? lightingPreset}`}
        title={`Cahaya: ${LIGHT_LABEL[lightingPreset] ?? lightingPreset}`}
      >
        <LightIcon className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={() => setActiveFloor(next(FLOOR_ORDER, activeFloor))}
        className={buttonClass}
        aria-label={`Lantai: ${FLOOR_LABEL[activeFloor] ?? activeFloor}`}
        title={`Lantai: ${FLOOR_LABEL[activeFloor] ?? activeFloor}`}
      >
        <Layers className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={() => setCameraPreset(next(CAM_ORDER, cameraPreset))}
        className={buttonClass}
        aria-label={`Sudut kamera: ${CAM_LABEL[cameraPreset] ?? cameraPreset}`}
        title={`Sudut kamera: ${CAM_LABEL[cameraPreset] ?? cameraPreset}`}
      >
        <Camera className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={() => setCameraPreset("isometric")}
        className={buttonClass}
        aria-label="Reset kamera ke isometrik"
        title="Reset kamera ke isometrik"
      >
        <RotateCcw className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={buttonClass}
        aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
        title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4.5 w-4.5" />
        ) : (
          <Maximize2 className="h-4.5 w-4.5" />
        )}
      </button>
    </div>
  );
}
