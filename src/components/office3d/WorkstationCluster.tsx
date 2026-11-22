"use client";

import React, { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import type {
  LightingPreset,
  OfficeAgent,
  Vector3Tuple,
  Workstation,
} from "@/types/office";

interface WorkstationClusterProps {
  workstations: Workstation[];
  agents: OfficeAgent[];
  lightingPreset: LightingPreset;
  onSelectWorkstation?: (workstation: Workstation) => void;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

export function WorkstationCluster({
  workstations,
  agents,
  lightingPreset,
  onSelectWorkstation,
  onFocusPoint,
}: WorkstationClusterProps) {
  const textures = useMemo(() => getRealisticTextures(), []);
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  return (
    <group>
      {workstations.map((ws) => {
        const assigned = agents.find((a) => a.id === ws.assignedAgentId);
        const isActive = assigned?.status === "working";
        const [x, y, z] = ws.position;

        const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onFocusPoint?.([x, y + 1.0, z]);
        };

        return (
          <group
            key={ws.id}
            position={[x, y, z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWorkstation?.(ws);
            }}
            onDoubleClick={handleDoubleClick}
          >
            {/* Warm Walnut & Matte-Black Steel Executive Desk */}
            <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.35, 0.065, 1.02]} />
              <meshStandardMaterial color="#875d39" roughness={0.44} metalness={0.06} />
            </mesh>

            {/* Steel frame legs */}
            {[-1.08, 1.08].map((lx, idx) => (
              <group key={idx} position={[lx, 0, 0]}>
                <mesh position={[0, 0.37, -0.4]} castShadow>
                  <boxGeometry args={[0.06, 0.74, 0.06]} />
                  <meshStandardMaterial color="#1f2530" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.37, 0.4]} castShadow>
                  <boxGeometry args={[0.06, 0.74, 0.06]} />
                  <meshStandardMaterial color="#1f2530" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.04, 0]}>
                  <boxGeometry args={[0.06, 0.05, 0.86]} />
                  <meshStandardMaterial color="#1f2530" metalness={0.75} roughness={0.3} />
                </mesh>
              </group>
            ))}

            {/* Modesty Privacy Panel */}
            <mesh position={[0, 0.56, -0.46]} castShadow>
              <boxGeometry args={[2.16, 0.34, 0.04]} />
              <meshStandardMaterial color="#2a313e" roughness={0.62} />
            </mesh>

            {/* Dual Ultra-Sharp Widescreen Monitors */}
            {[-0.48, 0.48].map((mx, idx) => (
              <group
                key={idx}
                position={[mx, 1.12, -0.26]}
                rotation={[0, idx === 0 ? 0.14 : -0.14, 0]}
              >
                {/* Monitor aluminum stand */}
                <mesh position={[0, -0.26, -0.05]}>
                  <boxGeometry args={[0.06, 0.32, 0.05]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.22} />
                </mesh>
                <mesh position={[0, -0.35, -0.02]}>
                  <boxGeometry args={[0.28, 0.02, 0.2]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.22} />
                </mesh>
                {/* Thin bezel housing */}
                <mesh castShadow>
                  <boxGeometry args={[0.88, 0.52, 0.035]} />
                  <meshStandardMaterial color="#111622" metalness={0.55} roughness={0.3} />
                </mesh>
                {/* High-res glowing screen */}
                <mesh position={[0, 0, 0.02]}>
                  <planeGeometry args={[0.83, 0.47]} />
                  <meshStandardMaterial
                    map={textures.monitorScreen}
                    emissiveMap={textures.monitorScreen}
                    emissive="#ffffff"
                    emissiveIntensity={
                      isActive ? (isNight ? 0.95 : 0.62) : 0.24
                    }
                    roughness={0.18}
                  />
                </mesh>
              </group>
            ))}

            {/* Desk Mat, Mechanical Keyboard & Mouse */}
            <mesh position={[0, 0.778, 0.16]} receiveShadow>
              <boxGeometry args={[1.08, 0.01, 0.42]} />
              <meshStandardMaterial color="#1f2937" roughness={0.88} />
            </mesh>
            <mesh position={[-0.08, 0.79, 0.18]}>
              <boxGeometry args={[0.48, 0.024, 0.17]} />
              <meshStandardMaterial color="#0f172a" roughness={0.45} />
            </mesh>
            <mesh position={[0.32, 0.79, 0.18]}>
              <boxGeometry args={[0.08, 0.024, 0.12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>

            {/* Ceramic Coffee Mug */}
            <mesh position={[-0.86, 0.83, 0.24]} castShadow>
              <cylinderGeometry args={[0.048, 0.042, 0.11, 12]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.25} />
            </mesh>

            {/* Articulated Architect Desk Lamp */}
            <group position={[0.92, 0.78, -0.22]}>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.1, 0.11, 0.04, 14]} />
                <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.28} />
              </mesh>
              <mesh position={[-0.04, 0.24, 0]} rotation={[0, 0, 0.18]} castShadow>
                <cylinderGeometry args={[0.014, 0.014, 0.46, 8]} />
                <meshStandardMaterial color="#27303d" metalness={0.75} roughness={0.25} />
              </mesh>
              <mesh position={[-0.14, 0.46, 0.06]} rotation={[0.2, 0, -0.5]}>
                <coneGeometry args={[0.1, 0.15, 14]} />
                <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.28} />
              </mesh>
              <mesh position={[-0.17, 0.42, 0.08]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshStandardMaterial
                  color="#fff5db"
                  emissive="#ffd27d"
                  emissiveIntensity={isNight ? 3.0 : isSunset ? 1.8 : 0.75}
                />
              </mesh>
            </group>

            {/* Status indicator pill on front corner of desk */}
            <mesh position={[-1.02, 0.78, 0.44]}>
              <boxGeometry args={[0.14, 0.025, 0.04]} />
              <meshStandardMaterial
                color={isActive ? "#10b981" : "#64748b"}
                emissive={isActive ? "#10b981" : "#475569"}
                emissiveIntensity={isActive ? 1.4 : 0.2}
              />
            </mesh>

            {/* Ergonomic Office Swivel Chair (positioned behind desk at Z = +0.86) */}
            <group position={[0, 0, 0.86]}>
              {/* Base star & hydraulic column */}
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.3, 0.34, 0.06, 5]} />
                <meshStandardMaterial color="#1f2530" metalness={0.72} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.24, 0]}>
                <cylinderGeometry args={[0.04, 0.045, 0.36, 10]} />
                <meshStandardMaterial color="#1f2530" metalness={0.75} roughness={0.3} />
              </mesh>
              {/* Cushioned seat */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[0.56, 0.09, 0.54]} />
                <meshStandardMaterial color="#262f3e" roughness={0.82} />
              </mesh>
              {/* Contoured backrest */}
              <mesh position={[0, 0.82, 0.24]} rotation={[0.08, 0, 0]} castShadow>
                <boxGeometry args={[0.52, 0.68, 0.08]} />
                <meshStandardMaterial color="#1f2735" roughness={0.8} />
              </mesh>
              {/* Headrest */}
              <mesh position={[0, 1.22, 0.27]} castShadow>
                <boxGeometry args={[0.3, 0.14, 0.07]} />
                <meshStandardMaterial color="#262f3e" roughness={0.8} />
              </mesh>
              {/* Armrests */}
              {[-0.29, 0.29].map((ax, i) => (
                <mesh key={i} position={[ax, 0.64, 0.02]}>
                  <boxGeometry args={[0.06, 0.05, 0.34]} />
                  <meshStandardMaterial color="#181e28" roughness={0.6} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
}
