"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getGrassTexture,
  getPoolTilesTexture,
  getSkyscraperFacadeTexture,
  getWoodDeckTexture,
} from "@/components/office3d/realisticTextures";
import type { LightingPreset, PerformanceMode } from "@/types/office";

interface CyberOutdoorCampusProps {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
}

/** Modern architectural warm garden bollard lamp */
function GardenBollardLamp({
  position,
  lampGlow,
}: {
  position: [number, number, number];
  lampGlow: number;
}) {
  return (
    <group position={position}>
      {/* Matte charcoal aluminum post */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.56, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Warm frosted glass diffuser lantern */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
        <meshStandardMaterial
          color="#fff7ed"
          emissive="#ffcf75"
          emissiveIntensity={lampGlow}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Lamp cap */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.04, 12]} />
        <meshStandardMaterial color="#111827" metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Realistic curved-trunk tropical palm tree with layered swaying fronds */
function RealisticPalmTree({
  position,
  scale = 1,
  phase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  phase?: number;
}) {
  const crownRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!crownRef.current) return;
    const t = clock.getElapsedTime() + phase;
    crownRef.current.rotation.z = Math.sin(t * 0.9) * 0.035;
    crownRef.current.rotation.x = Math.cos(t * 0.7) * 0.025;
  });

  return (
    <group position={position} scale={scale}>
      {/* Stone planter bed & dark soil */}
      <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.48, 0.52, 0.28, 16]} />
        <meshStandardMaterial color="#e5e0d5" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.03, 14]} />
        <meshStandardMaterial color="#4a3728" roughness={0.95} />
      </mesh>

      {/* Multi-segment gently curving palm trunk */}
      <mesh position={[0, 0.85, 0]} rotation={[0.06, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.2, 10]} />
        <meshStandardMaterial color="#6e503b" roughness={0.9} />
      </mesh>
      <mesh position={[0.05, 1.95, 0.06]} rotation={[0.04, 0, -0.02]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 1.15, 10]} />
        <meshStandardMaterial color="#7a5941" roughness={0.9} />
      </mesh>
      <mesh position={[0.04, 2.95, 0.08]} rotation={[-0.03, 0, -0.04]} castShadow>
        <cylinderGeometry args={[0.085, 0.11, 1.0, 10]} />
        <meshStandardMaterial color="#85634a" roughness={0.88} />
      </mesh>

      {/* Lush layered palm crown */}
      <group ref={crownRef} position={[0.02, 3.45, 0.07]}>
        {/* Coconuts cluster */}
        <mesh position={[0.1, -0.1, 0.08]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#5c3d28" roughness={0.8} />
        </mesh>
        <mesh position={[-0.09, -0.12, 0.06]}>
          <sphereGeometry args={[0.095, 8, 8]} />
          <meshStandardMaterial color="#4e3422" roughness={0.8} />
        </mesh>

        {/* Outer arched fronds */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * Math.PI * 2) / 8;
          return (
            <group key={`outer-${i}`} rotation={[0, angle, 0]}>
              <mesh
                position={[0.62, 0.08, 0]}
                rotation={[0, 0, 0.16]}
                castShadow
              >
                <boxGeometry args={[1.25, 0.04, 0.3]} />
                <meshStandardMaterial color="#3c7a2d" roughness={0.62} />
              </mesh>
              <mesh
                position={[1.45, -0.22, 0]}
                rotation={[0, 0, -0.58]}
                castShadow
              >
                <boxGeometry args={[0.92, 0.035, 0.24]} />
                <meshStandardMaterial color="#4b9138" roughness={0.62} />
              </mesh>
            </group>
          );
        })}

        {/* Upper young bright fronds */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5 + 0.35;
          return (
            <group key={`inner-${i}`} rotation={[0, angle, 0]}>
              <mesh position={[0.48, 0.34, 0]} rotation={[0, 0, 0.56]}>
                <boxGeometry args={[0.95, 0.035, 0.22]} />
                <meshStandardMaterial color="#5ca844" roughness={0.58} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/** Realistic resort beach umbrella with turquoise & crisp white panels (like Screenshot 1) */
function ResortUmbrella({
  position,
  lampGlow,
}: {
  position: [number, number, number];
  lampGlow: number;
}) {
  return (
    <group position={position}>
      {/* Heavy stone umbrella stand */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.12, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Brushed aluminum pole */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 2.4, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Subtle warm under-umbrella LED ring */}
      <mesh position={[0, 2.15, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 12]} />
        <meshStandardMaterial
          color="#fffbeb"
          emissive="#ffd68a"
          emissiveIntensity={lampGlow * 0.85}
          toneMapped={false}
        />
      </mesh>
      {/* Alternating crisp white & turquoise resort canopy wedges */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
        const angle = (idx * Math.PI * 2) / 8;
        const isTeal = idx % 2 === 0;
        return (
          <mesh
            key={idx}
            position={[0, 2.38, 0]}
            rotation={[0, angle, 0]}
            castShadow
          >
            <coneGeometry
              args={[1.45, 0.44, 1, 1, false, 0, Math.PI / 4 + 0.01]}
            />
            <meshStandardMaterial
              color={isTeal ? "#0ea5a8" : "#f8fafc"}
              roughness={0.72}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      {/* Top finial cap */}
      <mesh position={[0, 2.63, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Realistic luxury teak & cream-cushion pool lounger */
function ResortPoolLounger({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Dark aluminum/teak legs */}
      {(
        [
          [-0.32, 0.12, 0.72],
          [0.32, 0.12, 0.72],
          [-0.32, 0.12, -0.72],
          [0.32, 0.12, -0.72],
        ] as [number, number, number][]
      ).map(([lx, ly, lz], idx) => (
        <mesh key={idx} position={[lx, ly, lz]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.24, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* Frame */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.07, 1.82]} />
        <meshStandardMaterial color="#262626" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* Cream fabric mattress */}
      <mesh position={[0, 0.31, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.09, 1.32]} />
        <meshStandardMaterial color="#f5f1e8" roughness={0.85} />
      </mesh>
      {/* Reclined backrest */}
      <mesh position={[0, 0.5, -0.66]} rotation={[0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.72, 0.09, 0.58]} />
        <meshStandardMaterial color="#f5f1e8" roughness={0.85} />
      </mesh>
      {/* Headrest pillow */}
      <mesh position={[0, 0.64, -0.78]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.44, 0.08, 0.18]} />
        <meshStandardMaterial color="#e7e1d5" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Realistic Glossy Metallic Lamborghini-Style Gold Supercar (inspired by Screenshot 1!) */
function LuxurySupercar({
  position,
  rotationY = -0.38,
  headlightGlow,
}: {
  position: [number, number, number];
  rotationY?: number;
  headlightGlow: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Soft contact shadow plane directly beneath wheels */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.15, 4.55]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.38}
          depthWrite={false}
        />
      </mesh>

      {/* Main glossy clearcoat metallic yellow-gold body */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.42, 4.25]} />
        <meshPhysicalMaterial
          color="#f5a60a"
          metalness={0.62}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.06}
        />
      </mesh>

      {/* Sculpted aerodynamic sloped front hood */}
      <mesh position={[0, 0.41, 1.82]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[1.82, 0.28, 1.1]} />
        <meshPhysicalMaterial
          color="#fbbf24"
          metalness={0.6}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Front carbon-fiber splitter & intakes */}
      <mesh position={[0, 0.18, 2.26]} castShadow>
        <boxGeometry args={[1.94, 0.09, 0.34]} />
        <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.32} />
      </mesh>

      {/* Glossy black tinted cabin roof & side glass */}
      <mesh position={[0, 0.8, -0.18]} castShadow>
        <boxGeometry args={[1.44, 0.42, 1.78]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.85}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Roofline gold trim */}
      <mesh position={[0, 1.02, -0.22]}>
        <boxGeometry args={[1.28, 0.04, 1.38]} />
        <meshPhysicalMaterial
          color="#f5a60a"
          metalness={0.65}
          roughness={0.16}
          clearcoat={1}
        />
      </mesh>

      {/* Sloped front panoramic windshield */}
      <mesh position={[0, 0.72, 0.92]} rotation={[0.54, 0, 0]}>
        <boxGeometry args={[1.42, 0.44, 0.82]} />
        <meshPhysicalMaterial
          color="#0b1322"
          metalness={0.9}
          roughness={0.06}
          clearcoat={1}
        />
      </mesh>

      {/* Rear engine bay glass & louvers */}
      <mesh position={[0, 0.72, -1.36]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.5, 0.2, 1.15]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Side wing mirrors */}
      <mesh position={[-0.98, 0.7, 0.56]} castShadow>
        <boxGeometry args={[0.22, 0.09, 0.14]} />
        <meshPhysicalMaterial color="#f5a60a" metalness={0.65} roughness={0.18} clearcoat={1} />
      </mesh>
      <mesh position={[0.98, 0.7, 0.56]} castShadow>
        <boxGeometry args={[0.22, 0.09, 0.14]} />
        <meshPhysicalMaterial color="#f5a60a" metalness={0.65} roughness={0.18} clearcoat={1} />
      </mesh>

      {/* Side air intakes */}
      <mesh position={[-0.97, 0.45, -0.42]}>
        <boxGeometry args={[0.04, 0.25, 1.1]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>
      <mesh position={[0.97, 0.45, -0.42]}>
        <boxGeometry args={[0.04, 0.25, 1.1]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>

      {/* Carbon fiber rear GT spoiler */}
      <mesh position={[-0.66, 0.86, -1.95]}>
        <boxGeometry args={[0.06, 0.34, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0.66, 0.86, -1.95]}>
        <boxGeometry args={[0.06, 0.34, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.02, -1.98]} castShadow>
        <boxGeometry args={[1.98, 0.06, 0.34]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Realistic bright LED headlights */}
      <mesh position={[-0.66, 0.44, 2.34]}>
        <boxGeometry args={[0.42, 0.09, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff7db"
          emissiveIntensity={headlightGlow}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.66, 0.44, 2.34]}>
        <boxGeometry args={[0.42, 0.09, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff7db"
          emissiveIntensity={headlightGlow}
          toneMapped={false}
        />
      </mesh>

      {/* Realistic LED tail lights */}
      <mesh position={[-0.62, 0.52, -2.14]}>
        <boxGeometry args={[0.48, 0.09, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={Math.max(1.2, headlightGlow * 0.9)}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.62, 0.52, -2.14]}>
        <boxGeometry args={[0.48, 0.09, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={Math.max(1.2, headlightGlow * 0.9)}
          toneMapped={false}
        />
      </mesh>

      {/* 4 Detailed Sport Alloy Wheels with Brake Calipers */}
      {(
        [
          [-0.95, 0.35, 1.32],
          [0.95, 0.35, 1.32],
          [-0.95, 0.37, -1.28],
          [0.95, 0.37, -1.28],
        ] as [number, number, number][]
      ).map(([wx, wy, wz], idx) => (
        <group key={idx} position={[wx, wy, wz]}>
          {/* Rubber tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.27, 20]} />
            <meshStandardMaterial color="#171717" roughness={0.85} />
          </mesh>
          {/* Glossy charcoal alloy rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.285, 16]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>
          {/* Metallic center hub cap */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.3, 10]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Realistic Modern City Skyline with Glass/Concrete Towers */
function RealisticSkyline({
  performanceMode,
  lightingPreset,
}: {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
}) {
  const facadeTex = useMemo(() => getSkyscraperFacadeTexture(), []);

  const towers = useMemo(
    () => [
      { pos: [-28, 9.5, -26] as [number, number, number], size: [4.6, 19, 4.6] as [number, number, number], tint: "#64748b" },
      { pos: [-19, 13, -29] as [number, number, number], size: [5.4, 26, 5.0] as [number, number, number], tint: "#475569" },
      { pos: [-9, 9, -30] as [number, number, number], size: [4.2, 18, 4.2] as [number, number, number], tint: "#94a3b8" },
      { pos: [1, 14.5, -31] as [number, number, number], size: [5.8, 29, 5.2] as [number, number, number], tint: "#64748b" },
      { pos: [12, 11, -29] as [number, number, number], size: [4.8, 22, 4.6] as [number, number, number], tint: "#475569" },
      { pos: [22, 13, -27] as [number, number, number], size: [5.0, 26, 4.8] as [number, number, number], tint: "#7c8594" },
      { pos: [29, 8.5, -18] as [number, number, number], size: [4.4, 17, 4.4] as [number, number, number], tint: "#64748b" },
      { pos: [-30, 11, -15] as [number, number, number], size: [4.6, 22, 4.6] as [number, number, number], tint: "#475569" },
      { pos: [-31, 8, -3] as [number, number, number], size: [4.2, 16, 4.2] as [number, number, number], tint: "#64748b" },
      { pos: [31, 10, -5] as [number, number, number], size: [4.5, 20, 4.5] as [number, number, number], tint: "#475569" },
    ],
    []
  );

  const visibleTowers =
    performanceMode === "eco" ? towers.slice(0, 7) : towers;

  const windowGlow =
    lightingPreset === "night" ? 0.55 : lightingPreset === "sunset" ? 0.28 : 0.04;

  return (
    <group>
      {visibleTowers.map((tower, idx) => (
        <mesh key={idx} position={tower.pos}>
          <boxGeometry args={tower.size} />
          <meshStandardMaterial
            color={tower.tint}
            map={facadeTex ?? undefined}
            emissive="#fde68a"
            emissiveMap={facadeTex ?? undefined}
            emissiveIntensity={windowGlow}
            metalness={0.35}
            roughness={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}

export function CyberOutdoorCampus({
  performanceMode,
  lightingPreset,
}: CyberOutdoorCampusProps) {
  const woodTex = useMemo(() => getWoodDeckTexture(), []);
  const grassTex = useMemo(() => getGrassTexture(), []);
  const poolTilesTex = useMemo(() => getPoolTilesTexture(), []);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.position.y =
        0.195 + Math.sin(clock.getElapsedTime() * 1.6) * 0.012;
    }
  });

  const lampGlow =
    lightingPreset === "night" ? 2.4 : lightingPreset === "sunset" ? 1.8 : 0.45;
  const poolUnderwaterGlow =
    lightingPreset === "night" ? 0.95 : lightingPreset === "sunset" ? 0.55 : 0.15;
  const headlightGlow =
    lightingPreset === "night" ? 2.8 : lightingPreset === "sunset" ? 2.0 : 0.85;

  return (
    <group>
      {/* Realistic Lush Green Resort Campus Lawn */}
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[92, 0.16, 92]} />
        <meshStandardMaterial
          map={grassTex ?? undefined}
          color={lightingPreset === "night" ? "#3b5230" : "#ffffff"}
          roughness={0.92}
        />
      </mesh>

      {/* Architectural Stone Driveway & Front Walkway */}
      <mesh position={[0, 0.015, 16.5]} receiveShadow>
        <boxGeometry args={[28, 0.04, 6.2]} />
        <meshStandardMaterial color="#b8b5ad" roughness={0.85} />
      </mesh>

      {/* ================= LUXURY TEAK WOOD POOLSIDE DECK ================= */}
      <mesh position={[0, 0.08, 7.9]} receiveShadow>
        <boxGeometry args={[21.8, 0.16, 11.6]} />
        <meshStandardMaterial
          map={woodTex ?? undefined}
          color="#e8d5c4"
          roughness={0.62}
          metalness={0.05}
        />
      </mesh>
      {/* Crisp white travertine architectural deck curb */}
      <mesh position={[0, 0.085, 13.78]} receiveShadow>
        <boxGeometry args={[22.1, 0.17, 0.24]} />
        <meshStandardMaterial color="#ece9e2" roughness={0.6} />
      </mesh>

      {/* ================= REALISTIC RESORT SWIMMING POOL ================= */}
      <group position={[-2.6, 0, 8.2]}>
        {/* White travertine stone pool coping border */}
        <mesh position={[0, 0.165, 2.75]} receiveShadow>
          <boxGeometry args={[10.1, 0.06, 0.45]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.165, -2.75]} receiveShadow>
          <boxGeometry args={[10.1, 0.06, 0.45]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.5} />
        </mesh>
        <mesh position={[-4.82, 0.165, 0]} receiveShadow>
          <boxGeometry args={[0.45, 0.06, 5.05]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.5} />
        </mesh>
        <mesh position={[4.82, 0.165, 0]} receiveShadow>
          <boxGeometry args={[0.45, 0.06, 5.05]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.5} />
        </mesh>

        {/* Tiled turquoise underwater pool bottom */}
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9.2, 5.05]} />
          <meshStandardMaterial
            map={poolTilesTex ?? undefined}
            emissive="#38bdf8"
            emissiveIntensity={poolUnderwaterGlow}
            roughness={0.35}
          />
        </mesh>

        {/* Glossy reflective translucent water surface */}
        <mesh
          ref={waterRef}
          position={[0, 0.195, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[9.2, 5.05]} />
          <meshPhysicalMaterial
            color="#38c6e8"
            transparent
            opacity={0.62}
            roughness={0.08}
            metalness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* Warm underwater pool accent LEDs along side wall */}
        {[-3.0, 0, 3.0].map((lx) => (
          <mesh key={lx} position={[lx, 0.175, -2.5]}>
            <boxGeometry args={[0.55, 0.05, 0.04]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#7dd3fc"
              emissiveIntensity={lampGlow * 1.1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Striped Turquoise-White Umbrellas & Teak Loungers */}
      <ResortUmbrella position={[-5.2, 0.16, 4.1]} lampGlow={lampGlow} />
      <ResortUmbrella position={[-0.6, 0.16, 4.1]} lampGlow={lampGlow} />
      <ResortUmbrella position={[-8.8, 0.16, 8.2]} lampGlow={lampGlow} />

      <ResortPoolLounger position={[-6.1, 0.16, 4.35]} rotationY={0} />
      <ResortPoolLounger position={[-4.3, 0.16, 4.35]} rotationY={0} />
      <ResortPoolLounger position={[-1.5, 0.16, 4.35]} rotationY={0} />
      <ResortPoolLounger position={[0.3, 0.16, 4.35]} rotationY={0} />

      {/* Warm Garden Bollard Path Lamps Around Wooden Deck */}
      {(
        [
          [-10.4, 0.16, 3.2],
          [-10.4, 0.16, 8.2],
          [-10.4, 0.16, 13.1],
          [-4.2, 0.16, 13.1],
          [2.0, 0.16, 13.1],
          [10.4, 0.16, 13.1],
          [10.4, 0.16, 8.2],
          [10.4, 0.16, 3.2],
        ] as [number, number, number][]
      ).map((pos, idx) => (
        <GardenBollardLamp key={idx} position={pos} lampGlow={lampGlow} />
      ))}

      {/* Realistic Metallic Gold Supercar */}
      <LuxurySupercar
        position={[5.8, 0.16, 8.2]}
        rotationY={-0.38}
        headlightGlow={headlightGlow}
      />

      {/* Realistic Tropical Palm Trees */}
      <RealisticPalmTree position={[-9.5, 0.16, 3.6]} scale={1.08} phase={0} />
      <RealisticPalmTree position={[-9.5, 0.16, 12.2]} scale={0.98} phase={1.2} />
      <RealisticPalmTree position={[9.5, 0.16, 3.6]} scale={1.06} phase={2.1} />
      <RealisticPalmTree position={[9.5, 0.16, 12.2]} scale={0.96} phase={3.0} />
      <RealisticPalmTree position={[3.2, 0.16, 12.6]} scale={0.92} phase={4.1} />
      <RealisticPalmTree position={[-3.2, 0.16, 12.6]} scale={0.94} phase={5.0} />

      {/* Realistic Modern City Skyline */}
      <RealisticSkyline
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
      />
    </group>
  );
}
