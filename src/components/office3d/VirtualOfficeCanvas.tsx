"use client";

import React, { Component, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { AlertTriangle, Box, RotateCcw } from "lucide-react";
import { OfficeScene } from "@/components/office3d/OfficeScene";
import { SceneControlsHUD } from "@/components/office3d/SceneControlsHUD";
import { useOffice } from "@/store/OfficeContext";

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#050a18] p-6 text-center">
          <AlertTriangle className="h-9 w-9 text-amber-400" />
          <div className="text-sm font-semibold text-slate-100">
            3D WebGL Viewport mengalami kendala pada perangkat ini
          </div>
          <p className="max-w-sm text-xs text-slate-400">
            Coba aktifkan akselerasi hardware browser atau muat ulang halaman.
            Panel Agent Management, Task Manager, dan Live Activity tetap dapat
            digunakan normal.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function VirtualOfficeCanvas({
  className = "h-[420px] sm:h-[520px]",
  compactHud = false,
}: {
  className?: string;
  compactHud?: boolean;
}) {
  const { performanceMode, performanceReady } = useOffice();
  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [canvasKey, setCanvasKey] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setWebglReady(detectWebGLSupport());
  }, []);

  const isEco = performanceMode === "eco";
  // Keep crisp antialiasing & clean DPR even in Eco Mode so 3D looks realistic on Android
  const dpr: [number, number] = isEco
    ? [1, 1.5]
    : performanceMode === "balanced"
    ? [1, 1.75]
    : [1, 2];

  const readyToRender = mounted && performanceReady;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1324] shadow-2xl ${className}`}
    >
      {!readyToRender ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-amber-300">
          <Box className="h-8 w-8 animate-pulse" />
          <span className="text-xs font-medium tracking-wider uppercase">
            Memuat Virtual Office 3D...
          </span>
        </div>
      ) : !webglReady ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm font-semibold text-slate-200">
            WebGL tidak tersedia di browser ini
          </p>
          <p className="max-w-md text-xs text-slate-400">
            Virtual Office 3D membutuhkan WebGL. Gunakan browser modern (Chrome
            Android, Safari, Edge, Firefox) dengan WebGL aktif.
          </p>
        </div>
      ) : contextLost ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p className="text-sm font-semibold text-slate-100">
            Konteks GPU WebGL dijeda oleh browser
          </p>
          <p className="max-w-sm text-xs text-slate-400">
            Hal ini wajar pada HP Android saat memori sedang padat. Klik tombol
            di bawah untuk memulihkan tampilan 3D.
          </p>
          <button
            type="button"
            onClick={() => {
              setContextLost(false);
              setCanvasKey((k) => k + 1);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Muat Ulang 3D
          </button>
        </div>
      ) : (
        <CanvasErrorBoundary>
          <Canvas
            key={`${canvasKey}-${isEco ? "eco" : "std"}`}
            className="h-full w-full touch-none"
            shadows="percentage"
            dpr={dpr}
            camera={{ position: [2.5, 11.2, 26.5], fov: 38, near: 0.5, far: 140 }}
            gl={{
              antialias: true,
              powerPreference: isEco ? "default" : "high-performance",
              alpha: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08,
            }}
            onCreated={({ gl }) => {
              const dom = gl.domElement;
              const onLost = (e: Event) => {
                e.preventDefault();
                setContextLost(true);
              };
              const onRestored = () => {
                setContextLost(false);
              };
              dom.addEventListener("webglcontextlost", onLost, false);
              dom.addEventListener("webglcontextrestored", onRestored, false);
            }}
          >
            <OfficeScene />
          </Canvas>
          <SceneControlsHUD compact={compactHud} />
        </CanvasErrorBoundary>
      )}
    </div>
  );
}
