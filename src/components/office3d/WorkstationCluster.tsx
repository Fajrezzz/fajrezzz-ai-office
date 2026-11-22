"use client";

import React from "react";
import { Html } from "@react-three/drei";
import type { Workstation } from "@/types/office";

interface WorkstationClusterProps {
  workstations: Workstation[];
  showLabels: boolean;
  onSelectWorkstation?: (ws: Workstation) => void;
}

function WorkstationUnit({
  ws,
  showLabels,
  onSelect,
}: {
  ws: Workstation;
  showLabels: boolean;
  onSelect?: (ws: Workstation) => void;
}) {
  const occupied = Boolean(ws.assignedAgentId);

  return (
    <group
      position={ws.position}
      rotation={[0, ws.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(ws);
      }}
    >
      {/* Subtle floor zone pad */}
      <mesh position={[0, 0.016, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.55, 2.15]} />
        <meshBasicMaterial
          color={ws.accentColor}
          transparent
          opacity={occupied ? 0.1 : 0.04}
          depthWrite={false}
        />
      </mesh>

      {/* ================= CYBER DESK ================= */}
      {/* Tabletop */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.08, 1.05]} />
        <meshStandardMaterial color="#0e1830" metalness={0.65} roughness={0.28} />
      </mesh>
      {/* Glowing front & side neon underglow strip */}
      <mesh position={[0, 0.74, 0.52]}>
        <boxGeometry args={[2.16, 0.03, 0.03]} />
        <meshStandardMaterial
          color={ws.accentColor}
          emissive={ws.accentColor}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* Desk angled cyber legs */}
      <mesh position={[-0.98, 0.39, 0]} castShadow>
        <boxGeometry args={[0.1, 0.78, 0.92]} />
        <meshStandardMaterial color="#091022" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0.98, 0.39, 0]} castShadow>
        <boxGeometry args={[0.1, 0.78, 0.92]} />
        <meshStandardMaterial color="#091022" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* ================= COMPUTERS & MONITORS ================= */}
      {/* Primary ultrawide monitor stand */}
      <mesh position={[-0.12, 0.92, -0.26]}>
        <boxGeometry args={[0.12, 0.24, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Primary monitor chassis */}
      <mesh position={[-0.12, 1.18, -0.22]} castShadow>
        <boxGeometry args={[1.18, 0.52, 0.05]} />
        <meshStandardMaterial color="#070d1c" metalness={0.75} roughness={0.22} />
      </mesh>
      {/* Primary glowing screen */}
      <mesh position={[-0.12, 1.18, -0.19]}>
        <planeGeometry args={[1.1, 0.44]} />
        <meshStandardMaterial
          color="#0a2540"
          emissive={ws.accentColor}
          emissiveIntensity={occupied ? 0.9 : 0.35}
          toneMapped={false}
        />
      </mesh>
      {/* Stylized HUD code bars on primary monitor */}
      <mesh position={[-0.36, 1.28, -0.185]}>
        <planeGeometry args={[0.45, 0.035]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[-0.25, 1.2, -0.185]}>
        <planeGeometry args={[0.62, 0.03]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
      <mesh position={[-0.4, 1.12, -0.185]}>
        <planeGeometry args={[0.35, 0.03]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Secondary vertical side monitor (angled) */}
      <group position={[0.64, 1.16, -0.12]} rotation={[0, -0.35, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.56, 0.04]} />
          <meshStandardMaterial
            color="#070d1c"
            metalness={0.75}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.3, 0.48]} />
          <meshStandardMaterial
            color="#1e1b4b"
            emissive="#a855f7"
            emissiveIntensity={occupied ? 0.85 : 0.3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Cyber PC Tower on left corner */}
      <group position={[-0.86, 1.03, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.44, 0.48]} />
          <meshStandardMaterial
            color="#091124"
            metalness={0.78}
            roughness={0.28}
          />
        </mesh>
        {/* Glowing cooling vent strip */}
        <mesh position={[0, 0.02, 0.245]}>
          <boxGeometry args={[0.04, 0.34, 0.015]} />
          <meshStandardMaterial
            color={ws.accentColor}
            emissive={ws.accentColor}
            emissiveIntensity={1.7}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Glowing desk pad, keyboard, and mouse */}
      <mesh position={[-0.08, 0.825, 0.2]}>
        <boxGeometry args={[0.88, 0.01, 0.34]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.14, 0.84, 0.18]}>
        <boxGeometry args={[0.52, 0.025, 0.18]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={ws.accentColor}
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh position={[0.24, 0.84, 0.2]}>
        <boxGeometry args={[0.09, 0.025, 0.14]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#a855f7"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Desk neon lamp accent on right */}
      <mesh position={[0.92, 1.02, -0.32]}>
        <cylinderGeometry args={[0.025, 0.03, 0.42, 6]} />
        <meshStandardMaterial
          color={ws.accentColor}
          emissive={ws.accentColor}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* ================= ERGONOMIC CYBER CHAIR ================= */}
      {/* Slightly tucked beside/behind working spot so standing robot fits cleanly */}
      <group position={[0.68, 0, 0.92]} rotation={[0, -0.45, 0]}>
        {/* Chair base star */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 0.06, 5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.34, 6]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.48, 0.08, 0.46]} />
          <meshStandardMaterial color="#111c36" roughness={0.45} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.78, 0.2]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.44, 0.62, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} />
        </mesh>
        {/* Neon backrest trim */}
        <mesh position={[0, 0.92, 0.25]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.02]} />
          <meshStandardMaterial
            color={ws.accentColor}
            emissive={ws.accentColor}
            emissiveIntensity={1.3}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Subtle floating workstation code badge */}
      {showLabels && (
        <Html
          position={[0, 1.72, -0.2]}
          center
          distanceFactor={14}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded border border-cyan-400/35 bg-[#050b1a]/85 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-cyan-200 shadow-lg backdrop-blur-xs whitespace-nowrap">
            {ws.code}
          </div>
        </Html>
      )}
    </group>
  );
}

export function WorkstationCluster({
  workstations,
  showLabels,
  onSelectWorkstation,
}: WorkstationClusterProps) {
  return (
    <group>
      {workstations.map((ws) => (
        <WorkstationUnit
          key={ws.id}
          ws={ws}
          showLabels={showLabels}
          onSelect={onSelectWorkstation}
        />
      ))}
    </group>
  );
}
