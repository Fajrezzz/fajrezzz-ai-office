"use client";

import React, { Component, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AlertTriangle, Box } from "lucide-react";
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
          <AlertTriangle className="h-9 w-9 text-purple-400" />
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
  const { performanceMode } = useOffice();
  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setWebglReady(detectWebGLSupport());
  }, []);

  const dpr: [number, number] =
    performanceMode === "eco"
      ? [1, 1.25]
      : performanceMode === "balanced"
      ? [1, 1.5]
      : [1, 2];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#040814] shadow-[0_0_40px_rgba(0,212,255,0.08)] ${className}`}
    >
      {!mounted ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-cyan-300">
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
      ) : (
        <CanvasErrorBoundary>
          <Canvas
            className="h-full w-full touch-none"
            shadows={performanceMode !== "eco"}
            dpr={dpr}
            camera={{ position: [13.5, 11.2, 13.5], fov: 32, near: 0.5, far: 80 }}
            gl={{
              antialias: performanceMode !== "eco",
              powerPreference:
                performanceMode === "eco" ? "low-power" : "high-performance",
              alpha: false,
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
