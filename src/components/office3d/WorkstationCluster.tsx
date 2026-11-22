"use client";

import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import { getChartScreenTexture } from "@/components/office3d/realisticTextures";
import type { LightingPreset, OfficeAgent, Workstation } from "@/types/office";

interface WorkstationClusterProps {
  workstations: Workstation[];
  agents: OfficeAgent[];
  lightingPreset: LightingPreset;
  showLabels: boolean;
  onSelectWorkstation?: (ws: Workstation) => void;
}

function WorkstationUnit({
  ws,
  assignedAgent,
  chartTex,
  lampGlow,
  showLabels,
  onSelect,
}: {
  ws: Workstation;
  assignedAgent?: OfficeAgent;
  chartTex: ReturnType<typeof getChartScreenTexture>;
  lampGlow: number;
  showLabels: boolean;
  onSelect?: (ws: Workstation) => void;
}) {
  const occupied = Boolean(assignedAgent);

  return (
    <group
      position={ws.position}
      rotation={[0, ws.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(ws);
      }}
    >
      {/* Subtle modern accent floor ring (like Screenshots 4 & 5) */}
      <mesh position={[0, 0.018, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.28, 32]} />
        <meshBasicMaterial
          color={occupied ? ws.accentColor : "#94a3b8"}
          transparent
          opacity={occupied ? 0.55 : 0.2}
          depthWrite={false}
        />
      </mesh>

      {/* ================= MODERN WHITE ARCHITECTURAL OFFICE DESK ================= */}
      {/* Crisp matte-white tabletop */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 0.075, 1.05]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Brushed aluminum legs */}
      <mesh position={[-1.02, 0.39, 0]} castShadow>
        <boxGeometry args={[0.08, 0.78, 0.86]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[1.02, 0.39, 0]} castShadow>
        <boxGeometry args={[0.08, 0.78, 0.86]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
      </mesh>

      {/* ================= REALISTIC DUAL CHART MONITORS ================= */}
      <mesh position={[-0.1, 0.92, -0.26]}>
        <boxGeometry args={[0.12, 0.24, 0.08]} />
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[-0.1, 1.18, -0.22]} castShadow>
        <boxGeometry args={[1.28, 0.54, 0.045]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[-0.1, 1.18, -0.194]}>
        <planeGeometry args={[1.21, 0.47]} />
        <meshStandardMaterial
          map={chartTex ?? undefined}
          emissive="#ffffff"
          emissiveMap={chartTex ?? undefined}
          emissiveIntensity={occupied ? 0.85 : 0.25}
          roughness={0.2}
        />
      </mesh>

      {/* Secondary Angled Monitor */}
      <group position={[0.72, 1.16, -0.1]} rotation={[0, -0.36, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.52, 0.04]} />
          <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[0.41, 0.46]} />
          <meshStandardMaterial
            map={chartTex ?? undefined}
            emissive="#ffffff"
            emissiveMap={chartTex ?? undefined}
            emissiveIntensity={occupied ? 0.75 : 0.2}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Matte Aluminum Desktop Workstation Tower */}
      <mesh position={[-0.92, 1.02, -0.12]} castShadow>
        <boxGeometry args={[0.24, 0.42, 0.46]} />
        <meshStandardMaterial color="#27272a" metalness={0.65} roughness={0.32} />
      </mesh>

      {/* Modern Articulated Designer Desk Lamp with Warm Light */}
      <group position={[0.96, 0.82, -0.3]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.09, 0.1, 0.04, 14]} />
          <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.24, 0]} rotation={[0, 0, 0.12]}>
          <cylinderGeometry args={[0.016, 0.018, 0.44, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[-0.08, 0.44, 0.06]} rotation={[0.2, 0, 0.35]}>
          <coneGeometry args={[0.1, 0.14, 14]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.1, 0.4, 0.08]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#ffd68a"
            emissiveIntensity={lampGlow}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Keyboard, Mouse & Ceramic Coffee Mug */}
      <mesh position={[-0.12, 0.83, 0.18]}>
        <boxGeometry args={[0.52, 0.02, 0.17]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0.26, 0.83, 0.2]}>
        <boxGeometry args={[0.08, 0.02, 0.13]} />
        <meshStandardMaterial color="#1e293b" roughness={0.45} />
      </mesh>
      <mesh position={[-0.56, 0.86, 0.26]}>
        <cylinderGeometry args={[0.042, 0.038, 0.09, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </mesh>

      {/* ================= REALISTIC BLACK ERGONOMIC OFFICE CHAIR ================= */}
      <group position={[0.72, 0, 0.88]} rotation={[0, -0.42, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.25, 0.29, 0.05, 5]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 0.36, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.48, 0.08, 0.46]} />
          <meshStandardMaterial color="#18181b" roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.82, 0.2]} rotation={[0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.44, 0.68, 0.08]} />
          <meshStandardMaterial color="#18181b" roughness={0.68} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-0.26, 0.62, 0.02]}>
          <boxGeometry args={[0.05, 0.04, 0.32]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh position={[0.26, 0.62, 0.02]}>
          <boxGeometry args={[0.05, 0.04, 0.32]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
      </group>

      {/* ================= CLEAN FLOATING GLASS STATUS CARD ================= */}
      {showLabels && (
        <Html
          position={[0, 2.15, -0.15]}
          center
          distanceFactor={15}
          zIndexRange={[14, 0]}
          style={{ pointerEvents: "none" }}
        >
          {assignedAgent ? (
            <div
              className="w-36 overflow-hidden rounded-xl border bg-slate-950/82 shadow-xl backdrop-blur-md"
              style={{ borderColor: `${ws.accentColor}99` }}
            >
              <div
                className="flex items-center justify-between px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-950 uppercase"
                style={{ backgroundColor: ws.accentColor }}
              >
                <span>{assignedAgent.code}</span>
                <span className="rounded bg-slate-950/85 px-1 text-[8px] text-white">
                  SIM LIVE
                </span>
              </div>
              <div className="space-y-1 p-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">
                    {assignedAgent.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-300">
                    {assignedAgent.simulatedLoad}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${assignedAgent.simulatedLoad}%`,
                      backgroundColor: ws.accentColor,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] uppercase text-slate-300">
                  <span>{ws.code}</span>
                  <span className="text-amber-300">Placeholder</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-500/50 bg-slate-950/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-200 shadow-lg whitespace-nowrap">
              {ws.code} • OPEN
            </div>
          )}
        </Html>
      )}
    </group>
  );
}

export function WorkstationCluster({
  workstations,
  agents,
  lightingPreset,
  showLabels,
  onSelectWorkstation,
}: WorkstationClusterProps) {
  const chartTex = useMemo(() => getChartScreenTexture(), []);
  const lampGlow =
    lightingPreset === "night" ? 2.4 : lightingPreset === "sunset" ? 1.8 : 0.6;

  return (
    <group>
      {workstations.map((ws) => {
        const assignedAgent = agents.find(
          (a) => a.assignedWorkstationId === ws.id
        );
        return (
          <WorkstationUnit
            key={ws.id}
            ws={ws}
            assignedAgent={assignedAgent}
            chartTex={chartTex}
            lampGlow={lampGlow}
            showLabels={showLabels}
            onSelect={onSelectWorkstation}
          />
        );
      })}
    </group>
  );
}
