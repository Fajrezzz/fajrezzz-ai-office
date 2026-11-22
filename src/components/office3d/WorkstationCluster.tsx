"use client";

import React from "react";
import { Html } from "@react-three/drei";
import type { OfficeAgent, Workstation } from "@/types/office";

interface WorkstationClusterProps {
  workstations: Workstation[];
  agents: OfficeAgent[];
  showLabels: boolean;
  onSelectWorkstation?: (ws: Workstation) => void;
}

function WorkstationUnit({
  ws,
  assignedAgent,
  showLabels,
  onSelect,
}: {
  ws: Workstation;
  assignedAgent?: OfficeAgent;
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
      {/* Glowing circular floor ring around workstation (inspired by reference interior) */}
      <mesh position={[0, 0.02, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.32, 24]} />
        <meshBasicMaterial
          color={ws.accentColor}
          transparent
          opacity={occupied ? 0.65 : 0.25}
          depthWrite={false}
        />
      </mesh>

      {/* ================= CYBER DESK ================= */}
      {/* Sleek bright cyber tabletop */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 0.08, 1.05]} />
        <meshStandardMaterial color="#182542" metalness={0.55} roughness={0.25} />
      </mesh>
      {/* Bright glowing front neon trim strip */}
      <mesh position={[0, 0.74, 0.53]}>
        <boxGeometry args={[2.32, 0.04, 0.03]} />
        <meshStandardMaterial
          color={ws.accentColor}
          emissive={ws.accentColor}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      {/* Desk metallic T-legs */}
      <mesh position={[-1.02, 0.39, 0]}>
        <boxGeometry args={[0.1, 0.78, 0.88]} />
        <meshStandardMaterial color="#0b1326" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[1.02, 0.39, 0]}>
        <boxGeometry args={[0.1, 0.78, 0.88]} />
        <meshStandardMaterial color="#0b1326" metalness={0.8} roughness={0.28} />
      </mesh>

      {/* ================= DUAL / TRIPLE GLOWING MONITORS ================= */}
      {/* Monitor stand */}
      <mesh position={[-0.08, 0.92, -0.26]}>
        <boxGeometry args={[0.14, 0.24, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Primary ultrawide monitor */}
      <mesh position={[-0.08, 1.18, -0.22]}>
        <boxGeometry args={[1.28, 0.54, 0.05]} />
        <meshStandardMaterial color="#070d1c" metalness={0.75} roughness={0.22} />
      </mesh>
      {/* Primary glowing dark chart screen */}
      <mesh position={[-0.08, 1.18, -0.19]}>
        <planeGeometry args={[1.2, 0.46]} />
        <meshStandardMaterial
          color="#061428"
          emissive={ws.accentColor}
          emissiveIntensity={occupied ? 0.55 : 0.25}
          toneMapped={false}
        />
      </mesh>
      {/* Candlestick / telemetry wave bars on screen */}
      {[-0.48, -0.32, -0.16, 0.0, 0.16, 0.32].map((bx, i) => (
        <mesh key={bx} position={[bx, 1.14 + (i % 3) * 0.04, -0.185]}>
          <planeGeometry args={[0.09, 0.12 + ((i * 3) % 4) * 0.05]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#34d399" : i === 3 ? "#f43f5e" : "#38bdf8"}
          />
        </mesh>
      ))}

      {/* Secondary angled monitor */}
      <group position={[0.72, 1.16, -0.1]} rotation={[0, -0.38, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.54, 0.04]} />
          <meshStandardMaterial color="#070d1c" metalness={0.75} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.36, 0.46]} />
          <meshStandardMaterial
            color="#1e1b4b"
            emissive="#a855f7"
            emissiveIntensity={occupied ? 0.95 : 0.3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Cyber PC Tower on left */}
      <group position={[-0.92, 1.03, -0.12]}>
        <mesh>
          <boxGeometry args={[0.26, 0.44, 0.48]} />
          <meshStandardMaterial color="#091124" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.02, 0.245]}>
          <boxGeometry args={[0.045, 0.34, 0.015]} />
          <meshStandardMaterial
            color={ws.accentColor}
            emissive={ws.accentColor}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Keyboard & Mouse */}
      <mesh position={[-0.12, 0.84, 0.18]}>
        <boxGeometry args={[0.56, 0.025, 0.18]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={ws.accentColor}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[0.28, 0.84, 0.2]}>
        <boxGeometry args={[0.09, 0.025, 0.14]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#a855f7"
          emissiveIntensity={0.65}
        />
      </mesh>

      {/* Ergonomic Cyber Swivel Chair */}
      <group position={[0.72, 0, 0.9]} rotation={[0, -0.45, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.25, 0.29, 0.06, 5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.34, 6]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.48, 0.08, 0.46]} />
          <meshStandardMaterial color="#111c36" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.78, 0.2]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.44, 0.62, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.92, 0.25]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.02]} />
          <meshStandardMaterial
            color={ws.accentColor}
            emissive={ws.accentColor}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ================= FLOATING HOLOGRAPHIC STATUS CARD (Reference Style!) ================= */}
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
              className="w-36 overflow-hidden rounded-xl border bg-[#050b1d]/88 shadow-xl backdrop-blur-sm"
              style={{
                borderColor: `${ws.accentColor}bb`,
                boxShadow: `0 0 18px ${ws.accentColor}44`,
              }}
            >
              {/* Bright colored top header bar (like Screenshots 3, 4, 5) */}
              <div
                className="flex items-center justify-between px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-950 uppercase"
                style={{ backgroundColor: ws.accentColor }}
              >
                <span>{assignedAgent.code}</span>
                <span className="rounded bg-slate-950/85 px-1 text-[8px] text-cyan-200">
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
                <div className="flex items-center justify-between text-[8px] uppercase text-slate-400">
                  <span>{ws.code}</span>
                  <span className="text-purple-300">Placeholder</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-fuchsia-400/50 bg-[#050b1d]/85 px-2 py-0.5 text-[9px] font-bold tracking-wider text-fuchsia-200 shadow-lg whitespace-nowrap">
              {ws.code} • OPEN SLOT
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
  showLabels,
  onSelectWorkstation,
}: WorkstationClusterProps) {
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
            showLabels={showLabels}
            onSelect={onSelectWorkstation}
          />
        );
      })}
    </group>
  );
}
