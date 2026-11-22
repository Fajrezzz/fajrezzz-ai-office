"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_2_Y } from "@/lib/data/initial-office-data";
import {
  getConcretePlasterTexture,
  getLeaderboardTexture,
  getOfficeFloorTexture,
  getWoodDeckTexture,
} from "@/components/office3d/realisticTextures";
import type {
  FloorView,
  LightingPreset,
  PerformanceMode,
} from "@/types/office";

interface OfficeArchitectureProps {
  performanceMode: PerformanceMode;
  activeFloor: FloorView;
  lightingPreset: LightingPreset;
  showLabels: boolean;
}

/** Realistic indoor potted tropical plant in ceramic/terracotta pot (like Screenshot 5) */
function IndoorPottedPlant({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Terracotta ceramic planter */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.2, 0.48, 14]} />
        <meshStandardMaterial color="#b86b43" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.03, 12]} />
        <meshStandardMaterial color="#423124" roughness={0.95} />
      </mesh>
      {/* Layered natural green foliage */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#3c7a2d" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.9, 0.1]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#4f9439" roughness={0.68} />
      </mesh>
      <mesh position={[-0.14, 0.86, -0.08]} castShadow>
        <sphereGeometry args={[0.21, 10, 10]} />
        <meshStandardMaterial color="#2f6623" roughness={0.72} />
      </mesh>
    </group>
  );
}

/** Realistic architectural exterior up/down wall sconce lamp */
function ExteriorWallSconce({
  position,
  glow,
}: {
  position: [number, number, number];
  glow: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.16, 0.34, 0.12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.09]} />
        <meshStandardMaterial
          color="#fff7ed"
          emissive="#ffd27d"
          emissiveIntensity={glow}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.09]} />
        <meshStandardMaterial
          color="#fff7ed"
          emissive="#ffd27d"
          emissiveIntensity={glow}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Realistic modern server rack cabinet with smoked glass door */
function ServerCabinet({
  position,
  rotationY = 0,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  phaseOffset?: number;
}) {
  const statusLedRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (statusLedRef.current) {
      statusLedRef.current.emissiveIntensity =
        0.9 + Math.sin(clock.getElapsedTime() * 3.5 + phaseOffset) * 0.4;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.88, 2.1, 0.75]} />
        <meshStandardMaterial color="#1f242d" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.05, 0.38]}>
        <boxGeometry args={[0.76, 1.9, 0.03]} />
        <meshPhysicalMaterial
          color="#0f172a"
          transparent
          opacity={0.45}
          metalness={0.5}
          roughness={0.12}
          clearcoat={0.8}
        />
      </mesh>
      {/* Subtle server status indicator bar */}
      <mesh position={[-0.28, 1.05, 0.4]}>
        <boxGeometry args={[0.03, 1.6, 0.015]} />
        <meshStandardMaterial
          ref={statusLedRef}
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Modern architectural glass-and-oak collaboration hub table with refined centerpiece */
function ModernCollabHub({
  position,
  glow,
}: {
  position: [number, number, number];
  glow: number;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (globeRef.current) globeRef.current.rotation.y += dt * 0.5;
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.4;
  });

  return (
    <group position={position}>
      {/* Warm wood pedestal base */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.68, 0.72, 20]} />
        <meshStandardMaterial color="#7a5438" roughness={0.5} />
      </mesh>
      {/* Frosted glass conference tabletop */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.02, 0.98, 0.07, 24]} />
        <meshPhysicalMaterial
          color="#e2e8f0"
          metalness={0.15}
          roughness={0.15}
          clearcoat={0.9}
        />
      </mesh>
      {/* Subtle warm recessed table ring */}
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.98, 0.018, 8, 28]} />
        <meshStandardMaterial
          color="#fff7ed"
          emissive="#ffcf75"
          emissiveIntensity={glow * 0.85}
          toneMapped={false}
        />
      </mesh>
      {/* Refined translucent floating glass globe centerpiece */}
      <mesh ref={globeRef} position={[0, 1.32, 0]}>
        <icosahedronGeometry args={[0.26, 1]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.65}
          wireframe
        />
      </mesh>
      <mesh
        ref={ringRef}
        position={[0, 1.32, 0]}
        rotation={[Math.PI / 2.2, 0.25, 0]}
      >
        <torusGeometry args={[0.42, 0.012, 8, 28]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Realistic recessed architectural warm-white ceiling linear light fixtures */
function ArchitecturalCeilingLights({
  y,
  intensity,
}: {
  y: number;
  intensity: number;
}) {
  const positions: [number, number][] = [
    [-5.6, -5.2],
    [0, -5.2],
    [5.6, -5.2],
    [-5.6, -1.2],
    [0, -1.2],
    [5.6, -1.2],
  ];

  return (
    <group>
      {positions.map(([x, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          {/* Recessed aluminum housing */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[3.05, 0.05, 0.48]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Warm-white frosted light diffuser panel */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.9, 0.04, 0.36]} />
            <meshStandardMaterial
              color="#fffdf7"
              emissive="#fff3d6"
              emissiveIntensity={intensity}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Realistic Giant Back-Wall Executive Telemetry & Unit Board on Lantai 2 */
function ExecutiveWallScreen() {
  const boardTex = useMemo(() => getLeaderboardTexture(), []);

  return (
    <group position={[0, FLOOR_2_Y + 1.65, -7.75]}>
      {/* Brushed dark aluminum display frame */}
      <mesh castShadow>
        <boxGeometry args={[13.6, 2.4, 0.12]} />
        <meshStandardMaterial color="#181c24" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Crisp illuminated LED display panel */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[13.3, 2.2]} />
        <meshStandardMaterial
          map={boardTex ?? undefined}
          emissive="#ffffff"
          emissiveMap={boardTex ?? undefined}
          emissiveIntensity={0.85}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/** Rooftop Architectural Deck: Concrete Helipad + Glass Padel Court + Floodlights */
function RooftopDeck({
  performanceMode,
  lightingPreset,
  showLabels,
}: {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
  showLabels: boolean;
}) {
  const roofY = 9.88;
  const woodTex = useMemo(() => getWoodDeckTexture(), []);
  const lampGlow =
    lightingPreset === "night" ? 2.4 : lightingPreset === "sunset" ? 1.7 : 0.45;

  return (
    <group>
      {/* Modern warm-wood & concrete rooftop terrace slab */}
      <mesh position={[0, 9.76, -3.0]} receiveShadow castShadow>
        <boxGeometry args={[18.5, 0.24, 10.5]} />
        <meshStandardMaterial
          map={woodTex ?? undefined}
          color="#c8b6a4"
          roughness={0.68}
        />
      </mesh>
      {/* White concrete roof fascia edge */}
      <mesh position={[0, 9.76, 2.26]}>
        <boxGeometry args={[18.6, 0.26, 0.12]} />
        <meshStandardMaterial color="#f1ede4" roughness={0.5} />
      </mesh>

      {/* Glass rooftop safety balustrade */}
      <mesh position={[0, 10.22, 2.2]}>
        <boxGeometry args={[18.4, 0.68, 0.05]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          transparent
          opacity={0.25}
          roughness={0.08}
          metalness={0.2}
          clearcoat={1}
        />
      </mesh>

      {/* ================= REALISTIC CONCRETE HELIPAD (Left Roof) ================= */}
      <group position={[-4.5, roofY, -3.0]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3.25, 32]} />
          <meshStandardMaterial color="#d6d0c4" roughness={0.78} />
        </mesh>
        {/* Painted yellow safety circle */}
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.86, 3.12, 32]} />
          <meshStandardMaterial
            color="#eab308"
            emissive="#f59e0b"
            emissiveIntensity={lightingPreset === "day" ? 0.1 : 0.75}
            roughness={0.55}
          />
        </mesh>
        {/* Crisp "H" marking */}
        <mesh position={[-0.75, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.38, 2.15]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.5} />
        </mesh>
        <mesh position={[0.75, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.38, 2.15]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 0.36]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.5} />
        </mesh>
        {/* 4 Warm Perimeter Aviation Helipad Lights */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 3.25, 0.08, Math.sin(a) * 3.25]}
            >
              <cylinderGeometry args={[0.08, 0.1, 0.12, 10]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#fbbf24"
                emissiveIntensity={lampGlow}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* ================= REALISTIC BLUE GLASS PADEL COURT (Right Roof) ================= */}
      <group position={[4.1, roofY, -3.0]}>
        {/* Matte blue sports court surface */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[6.2, 4.6]} />
          <meshStandardMaterial color="#1d6fd1" roughness={0.72} />
        </mesh>
        {/* Crisp white court lines */}
        <mesh position={[0, 0.042, 2.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 0.07]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.042, -2.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 0.07]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[-2.9, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 4.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[2.9, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 4.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Center padel net */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.04, 0.72, 4.35]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.5} />
        </mesh>
        {/* Clear glass court walls + charcoal frames */}
        <mesh position={[0, 0.9, -2.34]}>
          <boxGeometry args={[6.3, 1.75, 0.06]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.28}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, 0.9, 2.34]}>
          <boxGeometry args={[6.3, 1.75, 0.06]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.2}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[-3.14, 0.9, 0]}>
          <boxGeometry args={[0.06, 1.75, 4.7]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.26}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[3.14, 0.9, 0]}>
          <boxGeometry args={[0.06, 1.75, 4.7]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.26}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>

        {/* 4 Stadium Floodlight Masts on Court Corners */}
        {(
          [
            [-3.12, -2.32],
            [3.12, -2.32],
            [-3.12, 2.32],
            [3.12, 2.32],
          ] as [number, number][]
        )
          .slice(0, performanceMode === "eco" ? 2 : 4)
          .map(([fx, fz], idx) => (
            <group key={idx} position={[fx, 0, fz]}>
              <mesh position={[0, 1.6, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 3.2, 8]} />
                <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[0, 3.2, 0]}>
                <boxGeometry args={[0.42, 0.14, 0.22]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#fff4d6"
                  emissiveIntensity={lampGlow * 1.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
      </group>

      {/* ================= ARCHITECTURAL ROOFTOP SIGNAGE ================= */}
      <group position={[0, 10.42, 2.15]}>
        <mesh castShadow>
          <boxGeometry args={[5.8, 0.72, 0.14]} />
          <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.37, 0.05]}>
          <boxGeometry args={[5.6, 0.04, 0.04]} />
          <meshStandardMaterial
            color="#fff7ed"
            emissive="#ffd27d"
            emissiveIntensity={lampGlow}
            toneMapped={false}
          />
        </mesh>
        {showLabels && (
          <Html
            position={[0, 0, 0.12]}
            center
            distanceFactor={20}
            zIndexRange={[15, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="rounded-md border border-amber-300/60 bg-slate-950/88 px-3 py-0.5 text-xs font-black tracking-[0.26em] text-amber-200 shadow-xl whitespace-nowrap">
              FAJREZZZ AI OFFICE
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export function OfficeArchitecture({
  performanceMode,
  activeFloor,
  lightingPreset,
  showLabels,
}: OfficeArchitectureProps) {
  const plasterTex = useMemo(() => getConcretePlasterTexture(), []);
  const officeFloorTex = useMemo(() => getOfficeFloorTexture(), []);

  const showFloor2 = activeFloor !== "l1";
  const showFloor3 =
    activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof";
  const showRoof = activeFloor === "all" || activeFloor === "roof";
  const showFrontGlassL2 = activeFloor !== "l2";

  const ceilingLightIntensity =
    lightingPreset === "night" ? 2.1 : lightingPreset === "sunset" ? 1.55 : 1.15;
  const warmCoveGlow =
    lightingPreset === "night" ? 2.0 : lightingPreset === "sunset" ? 1.35 : 0.35;

  const mullionXs = [-9.0, -5.4, -1.8, 1.8, 5.4, 9.0];

  return (
    <group>
      {/* ==================================================================== */}
      {/* FLOOR 1 (LANTAI 1 — LUXURY MODERN LOBBY: Y = 0 .. 3.2)              */}
      {/* ==================================================================== */}
      <group>
        {/* Warm limestone lobby floor */}
        <mesh position={[0, 0.08, -3.0]} receiveShadow>
          <boxGeometry args={[18.2, 0.16, 10.2]} />
          <meshStandardMaterial color="#dcd7cc" roughness={0.45} />
        </mesh>

        {/* Crisp white architectural plaster back & side walls */}
        <mesh position={[0, 1.65, -8.0]} receiveShadow castShadow>
          <boxGeometry args={[18.2, 3.15, 0.24]} />
          <meshStandardMaterial
            map={plasterTex ?? undefined}
            color="#f3f0e8"
            roughness={0.68}
          />
        </mesh>
        <mesh position={[-9.0, 1.65, -3.0]} receiveShadow castShadow>
          <boxGeometry args={[0.24, 3.15, 10.2]} />
          <meshStandardMaterial
            map={plasterTex ?? undefined}
            color="#f0ede4"
            roughness={0.68}
          />
        </mesh>
        <mesh position={[9.0, 1.65, -3.0]} receiveShadow castShadow>
          <boxGeometry args={[0.24, 3.15, 10.2]} />
          <meshStandardMaterial
            map={plasterTex ?? undefined}
            color="#f0ede4"
            roughness={0.68}
          />
        </mesh>

        {/* Warm Wood & Marble Lobby Reception Desk */}
        <group position={[0, 0.16, -5.2]}>
          <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.6, 1.04, 1.05]} />
            <meshStandardMaterial color="#855a3c" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[4.7, 0.06, 1.12]} />
            <meshStandardMaterial color="#f5f3ee" roughness={0.28} />
          </mesh>
          {/* Warm architectural under-counter LED strip */}
          <mesh position={[0, 0.12, 0.54]}>
            <boxGeometry args={[4.4, 0.05, 0.04]} />
            <meshStandardMaterial
              color="#fff7ed"
              emissive="#ffd27d"
              emissiveIntensity={warmCoveGlow * 1.1}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Modern Lobby Lounge Armchairs */}
        {[-6.2, -3.6, 3.6, 6.2].map((lx) => (
          <group key={lx} position={[lx, 0.16, -1.6]}>
            <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.3, 0.55, 1.1]} />
              <meshStandardMaterial color="#e5dfd3" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.65, -0.42]} castShadow>
              <boxGeometry args={[1.3, 0.52, 0.24]} />
              <meshStandardMaterial color="#d8d1c3" roughness={0.82} />
            </mesh>
          </group>
        ))}

        {/* Potted Plants by Lobby Entrance */}
        <IndoorPottedPlant position={[-2.2, 0.16, 1.1]} />
        <IndoorPottedPlant position={[2.2, 0.16, 1.1]} />

        {/* Crystal-Clear Front Glass Curtain Wall (Floor 1) */}
        <mesh position={[-5.2, 1.65, 2.05]}>
          <boxGeometry args={[7.4, 3.05, 0.07]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.22}
            roughness={0.06}
            metalness={0.15}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[5.2, 1.65, 2.05]}>
          <boxGeometry args={[7.4, 3.05, 0.07]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.22}
            roughness={0.06}
            metalness={0.15}
            clearcoat={1}
          />
        </mesh>

        {/* Dark Bronze/Charcoal Aluminum Mullions + Exterior Wall Sconce Lamps */}
        {mullionXs.map((mx) => (
          <group key={`m1-${mx}`}>
            <mesh position={[mx, 1.65, 2.08]} castShadow>
              <boxGeometry args={[0.16, 3.2, 0.18]} />
              <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.28} />
            </mesh>
            <ExteriorWallSconce
              position={[mx, 2.35, 2.22]}
              glow={warmCoveGlow * 1.15}
            />
          </group>
        ))}

        <ArchitecturalCeilingLights y={3.08} intensity={ceilingLightIntensity} />
      </group>

      {/* ==================================================================== */}
      {/* FLOOR 2 (LANTAI 2 — MAIN MODERN AI OPERATIONS FLOOR: Y = 3.28..6.6) */}
      {/* ==================================================================== */}
      {showFloor2 && (
        <group>
          {/* Architectural concrete floor slab */}
          <mesh position={[0, 3.2, -3.0]} receiveShadow castShadow>
            <boxGeometry args={[18.5, 0.18, 10.5]} />
            <meshStandardMaterial
              map={officeFloorTex ?? undefined}
              color="#c8cdd6"
              roughness={0.62}
            />
          </mesh>
          {/* Crisp white exterior slab edge trim */}
          <mesh position={[0, 3.2, 2.26]}>
            <boxGeometry args={[18.6, 0.22, 0.12]} />
            <meshStandardMaterial color="#f3f0e8" roughness={0.5} />
          </mesh>
          {/* Warm architectural recessed cove LED lighting under Floor 2 overhang */}
          <mesh position={[0, 3.07, 2.18]}>
            <boxGeometry args={[18.1, 0.04, 0.06]} />
            <meshStandardMaterial
              color="#fff7ed"
              emissive="#ffd27d"
              emissiveIntensity={warmCoveGlow}
              toneMapped={false}
            />
          </mesh>

          {/* Warm-white modern interior walls */}
          <mesh position={[0, 4.95, -8.0]} receiveShadow>
            <boxGeometry args={[18.2, 3.35, 0.24]} />
            <meshStandardMaterial
              map={plasterTex ?? undefined}
              color="#f2efe8"
              roughness={0.7}
            />
          </mesh>
          <mesh position={[-9.0, 4.95, -3.0]} receiveShadow>
            <boxGeometry args={[0.24, 3.35, 10.2]} />
            <meshStandardMaterial
              map={plasterTex ?? undefined}
              color="#eeebe3"
              roughness={0.7}
            />
          </mesh>
          <mesh position={[9.0, 4.95, -3.0]} receiveShadow>
            <boxGeometry args={[0.24, 3.35, 10.2]} />
            <meshStandardMaterial
              map={plasterTex ?? undefined}
              color="#eeebe3"
              roughness={0.7}
            />
          </mesh>

          {/* Giant Executive Telemetry & Unit Board */}
          <ExecutiveWallScreen />

          {/* Modern Wood & Glass Central Collaboration Hub */}
          <ModernCollabHub position={[0, FLOOR_2_Y, 0.0]} glow={warmCoveGlow} />

          {/* Server Cabinets on Floor 2 Left Wall */}
          <ServerCabinet
            position={[-8.1, FLOOR_2_Y, -0.9]}
            rotationY={Math.PI / 2}
            phaseOffset={0}
          />
          <ServerCabinet
            position={[-8.1, FLOOR_2_Y, 0.45]}
            rotationY={Math.PI / 2}
            phaseOffset={1.5}
          />

          {/* Indoor Potted Plants (like Screenshot 5) */}
          <IndoorPottedPlant position={[-7.6, FLOOR_2_Y, -6.2]} />
          <IndoorPottedPlant position={[7.6, FLOOR_2_Y, -6.2]} />
          <IndoorPottedPlant position={[7.6, FLOOR_2_Y, 0.6]} />

          {/* Floor 2 Reflective Architectural Glass Curtain Wall */}
          {showFrontGlassL2 && (
            <>
              <mesh position={[0, 4.95, 2.05]}>
                <boxGeometry args={[17.8, 3.2, 0.07]} />
                <meshPhysicalMaterial
                  color="#e0f2fe"
                  transparent
                  opacity={0.18}
                  roughness={0.06}
                  metalness={0.15}
                  clearcoat={1}
                />
              </mesh>
              {mullionXs.map((mx) => (
                <mesh key={`m2-${mx}`} position={[mx, 4.95, 2.08]} castShadow>
                  <boxGeometry args={[0.16, 3.35, 0.18]} />
                  <meshStandardMaterial
                    color="#1f2937"
                    metalness={0.75}
                    roughness={0.28}
                  />
                </mesh>
              ))}
            </>
          )}

          {/* Bright Realistic Recessed Linear Ceiling Light Fixtures */}
          <ArchitecturalCeilingLights
            y={6.48}
            intensity={ceilingLightIntensity}
          />
        </group>
      )}

      {/* ==================================================================== */}
      {/* FLOOR 3 (LANTAI 3 — EXECUTIVE BOARDROOM & SKY LOUNGE: Y=6.68..9.8)  */}
      {/* ==================================================================== */}
      {showFloor3 && (
        <group>
          <mesh position={[0, 6.6, -3.0]} receiveShadow castShadow>
            <boxGeometry args={[18.5, 0.18, 10.5]} />
            <meshStandardMaterial color="#d8d4ca" roughness={0.55} />
          </mesh>
          <mesh position={[0, 6.6, 2.26]}>
            <boxGeometry args={[18.6, 0.22, 0.12]} />
            <meshStandardMaterial color="#f3f0e8" roughness={0.5} />
          </mesh>
          {/* Warm architectural cove light under Floor 3 overhang */}
          <mesh position={[0, 6.47, 2.18]}>
            <boxGeometry args={[18.1, 0.04, 0.06]} />
            <meshStandardMaterial
              color="#fff7ed"
              emissive="#ffd27d"
              emissiveIntensity={warmCoveGlow}
              toneMapped={false}
            />
          </mesh>

          {/* Floor 3 Architectural Walls */}
          <mesh position={[0, 8.2, -8.0]} receiveShadow>
            <boxGeometry args={[18.2, 3.1, 0.24]} />
            <meshStandardMaterial
              map={plasterTex ?? undefined}
              color="#f3f0e8"
              roughness={0.68}
            />
          </mesh>
          <mesh position={[-9.0, 8.2, -3.0]}>
            <boxGeometry args={[0.24, 3.1, 10.2]} />
            <meshStandardMaterial color="#f0ede4" roughness={0.68} />
          </mesh>
          <mesh position={[9.0, 8.2, -3.0]}>
            <boxGeometry args={[0.24, 3.1, 10.2]} />
            <meshStandardMaterial color="#f0ede4" roughness={0.68} />
          </mesh>

          {/* Warm Walnut Executive Conference Table + Pendant Lamp */}
          <group position={[-1.4, 6.68, -3.2]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[5.8, 0.1, 2.0]} />
              <meshStandardMaterial color="#6e472d" roughness={0.42} />
            </mesh>
            <mesh position={[-2.0, 0.21, 0]}>
              <boxGeometry args={[0.16, 0.42, 1.3]} />
              <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[2.0, 0.21, 0]}>
              <boxGeometry args={[0.16, 0.42, 1.3]} />
              <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Designer suspended warm linear chandelier lamp above conference table */}
            <mesh position={[0, 2.25, 0]}>
              <boxGeometry args={[4.4, 0.08, 0.18]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#ffe1a3"
                emissiveIntensity={ceilingLightIntensity * 1.15}
                toneMapped={false}
              />
            </mesh>
          </group>

          {/* Executive Cream Lounge Sofa */}
          <group position={[5.6, 6.68, -4.5]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[3.1, 0.56, 1.15]} />
              <meshStandardMaterial color="#e8e2d5" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.65, -0.44]} castShadow>
              <boxGeometry args={[3.1, 0.52, 0.24]} />
              <meshStandardMaterial color="#dcd5c6" roughness={0.82} />
            </mesh>
          </group>

          {/* Floor 3 Glass Facade */}
          <mesh position={[0, 8.2, 2.05]}>
            <boxGeometry args={[17.8, 3.0, 0.07]} />
            <meshPhysicalMaterial
              color="#e0f2fe"
              transparent
              opacity={0.2}
              roughness={0.06}
              metalness={0.15}
              clearcoat={1}
            />
          </mesh>
          {mullionXs.map((mx) => (
            <mesh key={`m3-${mx}`} position={[mx, 8.2, 2.08]} castShadow>
              <boxGeometry args={[0.16, 3.15, 0.18]} />
              <meshStandardMaterial color="#1f2937" metalness={0.75} roughness={0.28} />
            </mesh>
          ))}

          <ArchitecturalCeilingLights
            y={9.6}
            intensity={ceilingLightIntensity}
          />
        </group>
      )}

      {/* Dark Smoked Architectural Elevator Core Tower (like Screenshot 2) */}
      <mesh
        position={[
          3.6,
          showRoof ? 5.0 : showFloor3 ? 4.9 : showFloor2 ? 3.3 : 1.65,
          2.08,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            1.48,
            showRoof ? 9.8 : showFloor3 ? 9.6 : showFloor2 ? 6.5 : 3.2,
            0.36,
          ]}
        />
        <meshPhysicalMaterial
          color="#111827"
          metalness={0.75}
          roughness={0.18}
          clearcoat={0.85}
        />
      </mesh>

      {/* ==================================================================== */}
      {/* ROOFTOP DECK                                                         */}
      {/* ==================================================================== */}
      {showRoof && (
        <RooftopDeck
          performanceMode={performanceMode}
          lightingPreset={lightingPreset}
          showLabels={showLabels}
        />
      )}
    </group>
  );
}
