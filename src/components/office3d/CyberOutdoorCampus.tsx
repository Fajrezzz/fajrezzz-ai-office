"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import type { LightingPreset, PerformanceMode, Vector3Tuple } from "@/types/office";

interface CyberOutdoorCampusProps {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

function PalmTree({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {
  const fronds = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Segmented gently curved palm trunk */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.27, 2.1, 10]} />
        <meshStandardMaterial color="#7d644c" roughness={0.92} />
      </mesh>
      <mesh position={[0.07, 2.85, 0.04]} rotation={[0.04, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 1.85, 10]} />
        <meshStandardMaterial color="#876d53" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 4.35, 0.08]} rotation={[0.06, 0, -0.06]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 1.45, 10]} />
        <meshStandardMaterial color="#6e5742" roughness={0.88} />
      </mesh>

      {/* Lush cascading fronds */}
      <group position={[0.19, 5.05, 0.1]}>
        {fronds.map((idx) => {
          const angle = (idx / fronds.length) * Math.PI * 2;
          const droop = idx % 2 === 0 ? 0.42 : 0.62;
          return (
            <group key={idx} rotation={[0, angle, 0]}>
              <mesh
                position={[0.85, 0.12, 0]}
                rotation={[0, 0, -droop * 0.45]}
                castShadow
              >
                <boxGeometry args={[1.65, 0.045, 0.46]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? "#3c7c32" : "#2f6b28"}
                  roughness={0.78}
                />
              </mesh>
              <mesh
                position={[1.9, -0.22, 0]}
                rotation={[0, 0, -droop * 1.15]}
                castShadow
              >
                <boxGeometry args={[1.05, 0.035, 0.32]} />
                <meshStandardMaterial color="#4a8d3c" roughness={0.76} />
              </mesh>
            </group>
          );
        })}
        {/* Coconuts cluster */}
        <mesh position={[0.1, -0.18, 0.1]}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshStandardMaterial color="#6b4a26" roughness={0.85} />
        </mesh>
        <mesh position={[-0.1, -0.2, 0.08]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#5d3f1f" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function PoolUmbrella({
  position,
  accentColor = "#1d4e6f",
}: {
  position: [number, number, number];
  accentColor?: string;
}) {
  return (
    <group position={position}>
      {/* Granite base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.14, 16]} />
        <meshStandardMaterial color="#424952" roughness={0.65} metalness={0.25} />
      </mesh>
      {/* Brushed aluminum pole */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 2.55, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.25} />
      </mesh>
      {/* Architectural sun canopy */}
      <mesh position={[0, 2.58, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.62, 0.52, 8]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[1.63, 0.46, 4]} />
        <meshStandardMaterial color={accentColor} roughness={0.84} />
      </mesh>
      {/* Finial cap */}
      <mesh position={[0, 2.86, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

function SunLounger({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Teak frame */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.09, 2.05]} />
        <meshStandardMaterial color="#875d38" roughness={0.72} />
      </mesh>
      {/* Legs */}
      {[
        [-0.34, 0.11, -0.82],
        [0.34, 0.11, -0.82],
        [-0.34, 0.11, 0.82],
        [0.34, 0.11, 0.82],
      ].map((leg, i) => (
        <mesh key={i} position={leg as [number, number, number]} castShadow>
          <boxGeometry args={[0.07, 0.22, 0.07]} />
          <meshStandardMaterial color="#6c4727" roughness={0.76} />
        </mesh>
      ))}
      {/* Plush ivory cushion */}
      <mesh position={[0, 0.34, 0.16]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.11, 1.38]} />
        <meshStandardMaterial color="#f6f2ea" roughness={0.9} />
      </mesh>
      {/* Reclined backrest */}
      <mesh position={[0, 0.56, -0.68]} rotation={[0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.74, 0.11, 0.72]} />
        <meshStandardMaterial color="#f6f2ea" roughness={0.9} />
      </mesh>
      {/* Accent pillow */}
      <mesh position={[0, 0.74, -0.79]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.46, 0.09, 0.22]} />
        <meshStandardMaterial color="#1d5f82" roughness={0.85} />
      </mesh>
    </group>
  );
}

function LuxurySupercar({
  position,
  rotationY = -0.32,
  isNight,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
}) {
  const wheelCoords: [number, number, number][] = [
    [-0.95, 0.36, 1.34],
    [0.95, 0.36, 1.34],
    [-0.95, 0.36, -1.3],
    [0.95, 0.36, -1.3],
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Carbon-fiber front splitter & lower skirt */}
      <mesh position={[0, 0.22, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[2.06, 0.12, 4.46]} />
        <meshStandardMaterial color="#141820" roughness={0.38} metalness={0.55} />
      </mesh>

      {/* Main sculpted metallic champagne-gold body */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.02, 0.5, 4.32]} />
        <meshPhysicalMaterial
          color="#d4a74a"
          metalness={0.86}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Aerodynamic front hood slope */}
      <mesh position={[0, 0.64, 1.35]} rotation={[0.16, 0, 0]} castShadow>
        <boxGeometry args={[1.88, 0.24, 1.48]} />
        <meshPhysicalMaterial
          color="#d4a74a"
          metalness={0.86}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Sculpted rear deck / engine cover */}
      <mesh position={[0, 0.78, -1.22]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.84, 0.28, 1.44]} />
        <meshPhysicalMaterial
          color="#c89a3d"
          metalness={0.86}
          roughness={0.15}
          clearcoat={1}
        />
      </mesh>

      {/* Smoked glass engine louvers */}
      <mesh position={[0, 0.93, -1.12]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[1.02, 0.06, 1.05]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.4}
          roughness={0.08}
          clearcoat={1}
        />
      </mesh>

      {/* Tinted aerodynamic cockpit cabin */}
      <mesh position={[0, 0.95, -0.04]} castShadow>
        <boxGeometry args={[1.56, 0.44, 1.92]} />
        <meshPhysicalMaterial
          color="#0c1524"
          metalness={0.25}
          roughness={0.06}
          clearcoat={1}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* Sloped front windshield */}
      <mesh position={[0, 0.92, 0.88]} rotation={[-0.58, 0, 0]}>
        <boxGeometry args={[1.48, 0.07, 0.92]} />
        <meshPhysicalMaterial
          color="#132338"
          metalness={0.3}
          roughness={0.05}
          clearcoat={1}
        />
      </mesh>

      {/* Side air intakes */}
      {[-1.02, 1.02].map((x, idx) => (
        <mesh key={idx} position={[x, 0.54, -0.58]}>
          <boxGeometry args={[0.06, 0.32, 0.92]} />
          <meshStandardMaterial color="#12161e" roughness={0.42} metalness={0.5} />
        </mesh>
      ))}

      {/* Wing mirrors */}
      {[-1.12, 1.12].map((x, idx) => (
        <mesh key={idx} position={[x, 0.88, 0.55]}>
          <boxGeometry args={[0.24, 0.09, 0.14]} />
          <meshPhysicalMaterial color="#d4a74a" metalness={0.86} roughness={0.16} clearcoat={1} />
        </mesh>
      ))}

      {/* Carbon fiber rear GT wing */}
      <mesh position={[0, 1.04, -2.02]} castShadow>
        <boxGeometry args={[1.92, 0.06, 0.36]} />
        <meshStandardMaterial color="#181d26" roughness={0.28} metalness={0.65} />
      </mesh>
      {[-0.62, 0.62].map((sx, idx) => (
        <mesh key={idx} position={[sx, 0.88, -1.94]}>
          <boxGeometry args={[0.07, 0.28, 0.16]} />
          <meshStandardMaterial color="#181d26" roughness={0.3} metalness={0.65} />
        </mesh>
      ))}

      {/* Sharp LED headlights */}
      {[-0.68, 0.68].map((hx, idx) => (
        <mesh key={idx} position={[hx, 0.56, 2.17]}>
          <boxGeometry args={[0.42, 0.09, 0.06]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#f0f9ff"
            emissiveIntensity={isNight ? 3.2 : 1.1}
          />
        </mesh>
      ))}

      {/* Full-width LED taillight bar */}
      <mesh position={[0, 0.64, -2.17]}>
        <boxGeometry args={[1.76, 0.075, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={isNight ? 2.8 : 0.9}
        />
      </mesh>

      {/* Alloy wheels + red brake calipers */}
      {wheelCoords.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.28, 20]} />
            <meshStandardMaterial color="#14171c" roughness={0.82} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 14]} />
            <meshStandardMaterial color="#d8dee8" metalness={0.9} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.05, 0.1]}>
            <boxGeometry args={[0.26, 0.12, 0.09]} />
            <meshStandardMaterial color="#dc2626" metalness={0.45} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BollardLight({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const lampIntensity = isNight ? 2.8 : isSunset ? 1.5 : 0.35;
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.08, 0.68, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.16, 12]} />
        <meshStandardMaterial
          color="#fff4d6"
          emissive="#ffcf7d"
          emissiveIntensity={lampIntensity}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function CyberOutdoorCampus({
  performanceMode,
  lightingPreset,
  onFocusPoint,
}: CyberOutdoorCampusProps) {
  const textures = useMemo(() => getRealisticTextures(), []);
  const waterRef = useRef<THREE.Mesh>(null);
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.position.y =
        0.13 + Math.sin(state.clock.elapsedTime * 1.4) * 0.012;
    }
    textures.poolWaterBump.offset.x =
      (textures.poolWaterBump.offset.x + delta * 0.045) % 1;
    textures.poolWaterBump.offset.y =
      (textures.poolWaterBump.offset.y + delta * 0.025) % 1;
  });

  const handleGroundDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, Math.max(0.4, e.point.y), e.point.z]);
    }
  };

  // Distant atmospheric metropolitan skyline pushed far back so it enhances realism
  // without ever photobombing or feeling blocky behind our 28m HQ!
  const skylineBuildings = useMemo(
    () => [
      { pos: [-56, 20, -48] as [number, number, number], size: [9, 40, 8] as [number, number, number] },
      { pos: [-40, 27, -56] as [number, number, number], size: [10, 54, 9] as [number, number, number] },
      { pos: [-22, 18, -58] as [number, number, number], size: [8.5, 36, 8] as [number, number, number] },
      { pos: [-4, 30, -64] as [number, number, number], size: [11, 60, 10] as [number, number, number] },
      { pos: [16, 23, -60] as [number, number, number], size: [9.5, 46, 9] as [number, number, number] },
      { pos: [35, 29, -54] as [number, number, number], size: [10, 58, 9.5] as [number, number, number] },
      { pos: [54, 19, -46] as [number, number, number], size: [8.5, 38, 8] as [number, number, number] },
      { pos: [-60, 16, -24] as [number, number, number], size: [8, 32, 8] as [number, number, number] },
      { pos: [60, 17, -22] as [number, number, number], size: [8, 34, 8] as [number, number, number] },
    ],
    []
  );

  const palmPositions: { pos: [number, number, number]; scale: number; rot: number }[] = [
    { pos: [-16.6, 0, 5.4], scale: 1.15, rot: 0.4 },
    { pos: [-17.4, 0, 11.8], scale: 1.05, rot: 1.3 },
    { pos: [-15.2, 0, 17.6], scale: 1.2, rot: 2.1 },
    { pos: [-7.5, 0, 18.8], scale: 1.0, rot: 0.8 },
    { pos: [2.2, 0, 18.9], scale: 1.08, rot: 2.9 },
    { pos: [15.4, 0, 17.4], scale: 1.18, rot: 1.7 },
    { pos: [17.4, 0, 10.6], scale: 1.1, rot: 3.5 },
    { pos: [16.5, 0, 4.6], scale: 1.22, rot: 0.2 },
    { pos: [-16.8, 0, -5.5], scale: 1.12, rot: 2.4 },
    { pos: [16.8, 0, -5.2], scale: 1.15, rot: 1.1 },
  ];

  const bollards: [number, number, number][] = [
    [-13.5, 0.18, 4.8],
    [-6.5, 0.18, 4.8],
    [0.0, 0.18, 4.8],
    [6.5, 0.18, 4.8],
    [13.5, 0.18, 4.8],
    [-12.5, 0.18, 16.5],
    [-4.0, 0.18, 16.5],
    [4.2, 0.18, 16.5],
    [13.0, 0.18, 16.5],
  ];

  return (
    <group>
      {/* Expansive manicured tropical lawn */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 4]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[170, 170]} />
        <meshStandardMaterial
          map={textures.grassLawn}
          bumpMap={textures.grassBump}
          bumpScale={0.04}
          roughness={0.94}
        />
      </mesh>

      {/* Architectural dark asphalt avenue in front of campus */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0, 24.5]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[130, 8.2]} />
        <meshStandardMaterial map={textures.asphalt} roughness={0.86} />
      </mesh>
      {/* Road lane dashes */}
      {[-30, -20, -10, 0, 10, 20, 30].map((x) => (
        <mesh key={x} position={[x, 0.015, 24.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 0.22]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
        </mesh>
      ))}

      {/* Grand travertine arrival driveway & motor court to supercar */}
      <mesh
        position={[8.8, 0.06, 17.8]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <boxGeometry args={[7.4, 0.12, 8.2]} />
        <meshStandardMaterial
          map={textures.marbleTile}
          bumpMap={textures.marbleBump}
          bumpScale={0.025}
          roughness={0.55}
        />
      </mesh>

      {/* GRAND 32m × 14.6m Architectural Teak Outdoor Resort Deck */}
      <mesh
        position={[0, 0.09, 11.3]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <boxGeometry args={[32.0, 0.18, 14.6]} />
        <meshStandardMaterial
          map={textures.woodDeck}
          bumpMap={textures.woodDeckBump}
          bumpScale={0.045}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>

      {/* Crisp white limestone perimeter deck trim */}
      <mesh position={[0, 0.1, 18.68]} receiveShadow>
        <boxGeometry args={[32.4, 0.22, 0.34]} />
        <meshStandardMaterial color="#e8e3da" roughness={0.65} />
      </mesh>

      {/* GRAND 13.2m × 6.2m Luxury Infinity Swimming Pool */}
      <group position={[-4.2, 0, 11.4]} onDoubleClick={handleGroundDoubleClick}>
        {/* Limestone pool coping surround */}
        <mesh position={[0, 0.2, -3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.12, 0.42]} />
          <meshStandardMaterial color="#ede8df" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.2, 3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.12, 0.42]} />
          <meshStandardMaterial color="#ede8df" roughness={0.58} />
        </mesh>
        <mesh position={[-6.8, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.12, 6.98]} />
          <meshStandardMaterial color="#ede8df" roughness={0.58} />
        </mesh>
        <mesh position={[6.8, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.12, 6.98]} />
          <meshStandardMaterial color="#ede8df" roughness={0.58} />
        </mesh>

        {/* Mosaic tile pool basin */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13.2, 6.2]} />
          <meshStandardMaterial
            map={textures.poolTiles}
            roughness={0.28}
            emissive={isNight ? "#0ea5e9" : "#0284c7"}
            emissiveIntensity={isNight ? 0.52 : 0.12}
          />
        </mesh>

        {/* Underwater lounge steps on right side */}
        <mesh position={[5.8, 0.07, 0]}>
          <boxGeometry args={[1.2, 0.08, 4.4]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.3} />
        </mesh>

        {/* Chrome stainless pool handrail */}
        <mesh position={[6.4, 0.56, 1.4]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.85, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[6.4, 0.56, 0.6]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.85, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[6.4, 0.96, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.82, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
        </mesh>

        {/* Animated crystal reflective water surface with ripple bump */}
        <mesh
          ref={waterRef}
          position={[0, 0.14, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[13.16, 6.16]} />
          <meshPhysicalMaterial
            color="#32c5e9"
            roughness={0.07}
            metalness={0.08}
            transmission={performanceMode === "high" ? 0.62 : 0}
            transparent
            opacity={performanceMode === "high" ? 0.82 : 0.72}
            bumpMap={textures.poolWaterBump}
            bumpScale={0.045}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* Warm underwater night glow */}
        {isNight && (
          <pointLight
            position={[0, 0.6, 0]}
            color="#38bdf8"
            intensity={8}
            distance={14}
          />
        )}
      </group>

      {/* 4 Resort Umbrellas around pool deck */}
      <PoolUmbrella position={[-12.6, 0.18, 9.0]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-12.6, 0.18, 14.2]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-6.8, 0.18, 16.4]} accentColor="#2b5f78" />
      <PoolUmbrella position={[0.4, 0.18, 16.4]} accentColor="#2b5f78" />

      {/* 6 Plush Sun Loungers */}
      <SunLounger position={[-13.4, 0.18, 7.2]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 10.7]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 15.6]} rotationY={Math.PI / 2} />
      <SunLounger position={[-9.2, 0.18, 16.3]} rotationY={0} />
      <SunLounger position={[-4.2, 0.18, 16.3]} rotationY={0} />
      <SunLounger position={[2.6, 0.18, 16.3]} rotationY={0} />

      {/* Luxury Outdoor Lounge Pergola Seating beside Pool */}
      <group position={[4.2, 0.18, 7.6]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.42, 0.95]} />
          <meshStandardMaterial color="#f1ede5" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.62, -0.38]} castShadow>
          <boxGeometry args={[2.8, 0.45, 0.22]} />
          <meshStandardMaterial color="#e5dfd3" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.22, 1.15]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.34, 0.78]} />
          <meshStandardMaterial color="#7d5837" roughness={0.68} />
        </mesh>
      </group>

      {/* Sculpted Metallic-Gold GT Supercar in Arrival Bay */}
      <LuxurySupercar
        position={[9.2, 0.18, 11.2]}
        rotationY={-0.36}
        isNight={isNight}
      />

      {/* Landscaped Low Tropical Hedges around Campus Perimeter */}
      {[-15.8, 15.8].map((hx, idx) => (
        <mesh key={idx} position={[hx, 0.42, 11.3]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.84, 14.4]} />
          <meshStandardMaterial color="#2f5f29" roughness={0.92} />
        </mesh>
      ))}

      {/* Pathway Bollard Lamps */}
      {bollards.map((pos, i) => (
        <BollardLight
          key={i}
          position={pos}
          isNight={isNight}
          isSunset={isSunset}
        />
      ))}

      {/* 10 Lush Palm Trees */}
      {palmPositions.map((p, i) => (
        <PalmTree
          key={i}
          position={p.pos}
          scale={p.scale}
          rotation={p.rot}
        />
      ))}

      {/* Refined Distant Atmospheric Metropolitan Skyline (far back, sleek glass) */}
      <group>
        {skylineBuildings.map((b, i) => (
          <mesh key={i} position={b.pos}>
            <boxGeometry args={b.size} />
            <meshStandardMaterial
              map={isNight ? textures.skylineNight : textures.skylineDay}
              color={
                isNight ? "#94a3b8" : isSunset ? "#d9c2b2" : "#cfdce8"
              }
              roughness={0.35}
              metalness={0.48}
              emissive={isNight ? "#1e293b" : "#000000"}
              emissiveIntensity={isNight ? 0.32 : 0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
