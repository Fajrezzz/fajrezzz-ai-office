"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PerformanceMode } from "@/types/office";

interface CyberOutdoorCampusProps {
  performanceMode: PerformanceMode;
}

function CyberPalmTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Planter ring */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.38, 0.44, 0.28, 6]} />
        <meshStandardMaterial color="#0b1328" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.37, 6]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 1.55, 0]} rotation={[0.04, 0, 0.03]}>
        <cylinderGeometry args={[0.1, 0.18, 2.9, 6]} />
        <meshStandardMaterial color="#3b261d" roughness={0.85} />
      </mesh>
      {/* Glowing cyber palm fronds */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI * 2) / 6;
        return (
          <group key={i} position={[0, 2.95, 0]} rotation={[0, angle, 0]}>
            <mesh position={[0.68, -0.08, 0]} rotation={[0, 0, -0.38]}>
              <boxGeometry args={[1.45, 0.06, 0.32]} />
              <meshStandardMaterial
                color="#059669"
                emissive="#10b981"
                emissiveIntensity={0.45}
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CyberUmbrella({
  position,
  accent = "#00e5ff",
}: {
  position: [number, number, number];
  accent?: string;
}) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.3, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2.25, 0]}>
        <coneGeometry args={[1.25, 0.48, 8]} />
        <meshStandardMaterial
          color="#e2e8f0"
          emissive={accent}
          emissiveIntensity={0.22}
          roughness={0.4}
        />
      </mesh>
      {/* Glowing cyber rim around umbrella */}
      <mesh position={[0, 2.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.23, 0.025, 6, 16]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function PoolLounger({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base frame */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.78, 0.1, 1.75]} />
        <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Cushion */}
      <mesh position={[0, 0.3, 0.12]}>
        <boxGeometry args={[0.7, 0.08, 1.32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* Reclined backrest */}
      <mesh position={[0, 0.48, -0.64]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.56]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      {/* Subtle cyan underglow */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.72, 0.02, 1.6]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function CyberSupercar({
  position,
  rotationY = -0.35,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Electric-cyan neon underglow pad beneath car */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 4.35]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>

      {/* Main low-slung metallic gold supercar chassis */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.82, 0.44, 4.1]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#b45309"
          emissiveIntensity={0.28}
          metalness={0.85}
          roughness={0.18}
        />
      </mesh>

      {/* Angled aerodynamic front nose wedge */}
      <mesh position={[0, 0.36, 1.85]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1.76, 0.3, 0.95]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={0.25}
          metalness={0.85}
          roughness={0.18}
        />
      </mesh>

      {/* Front carbon splitter */}
      <mesh position={[0, 0.19, 2.25]}>
        <boxGeometry args={[1.84, 0.07, 0.28]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Sleek tinted cockpit cabin */}
      <mesh position={[0, 0.78, -0.15]}>
        <boxGeometry args={[1.44, 0.42, 1.9]} />
        <meshStandardMaterial
          color="#0b1120"
          metalness={0.95}
          roughness={0.08}
        />
      </mesh>

      {/* Sloped front windshield */}
      <mesh position={[0, 0.72, 0.92]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[1.4, 0.38, 0.72]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.95}
          roughness={0.08}
        />
      </mesh>

      {/* Rear engine louvre deck */}
      <mesh position={[0, 0.7, -1.35]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.52, 0.2, 1.15]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Aggressive black rear spoiler wing */}
      <mesh position={[-0.68, 0.85, -1.9]}>
        <boxGeometry args={[0.07, 0.32, 0.18]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.68, 0.85, -1.9]}>
        <boxGeometry args={[0.07, 0.32, 0.18]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.0, -1.94]}>
        <boxGeometry args={[1.92, 0.07, 0.34]} />
        <meshStandardMaterial color="#090d16" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Bright glowing LED headlights */}
      <mesh position={[-0.64, 0.44, 2.26]}>
        <boxGeometry args={[0.42, 0.1, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#e0f2fe"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.64, 0.44, 2.26]}>
        <boxGeometry args={[0.42, 0.1, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#e0f2fe"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>

      {/* Glowing cyber neon-red rear tail light bar */}
      <mesh position={[0, 0.52, -2.06]}>
        <boxGeometry args={[1.68, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#ff1e56"
          emissive="#ff1e56"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>

      {/* Side air intake accent strips */}
      <mesh position={[-0.92, 0.44, -0.3]}>
        <boxGeometry args={[0.04, 0.24, 1.2]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} />
      </mesh>
      <mesh position={[0.92, 0.44, -0.3]}>
        <boxGeometry args={[0.04, 0.24, 1.2]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} />
      </mesh>

      {/* 4 Dark Cyber Wheels with Glowing Rim Accents */}
      {(
        [
          [-0.92, 0.34, 1.28],
          [0.92, 0.34, 1.28],
          [-0.92, 0.36, -1.25],
          [0.92, 0.36, -1.25],
        ] as [number, number, number][]
      ).map(([wx, wy, wz], idx) => (
        <group key={idx} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.24, 12]} />
            <meshStandardMaterial
              color="#090d16"
              metalness={0.6}
              roughness={0.45}
            />
          </mesh>
          <mesh
            position={[wx > 0 ? 0.13 : -0.13, 0, 0]}
            rotation={[0, wx > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <ringGeometry args={[0.16, 0.22, 10]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CyberSkyline({ performanceMode }: { performanceMode: PerformanceMode }) {
  const towers = useMemo(
    () => [
      { pos: [-26, 9, -24] as [number, number, number], size: [4.2, 18, 4.2] as [number, number, number], color: "#00e5ff" },
      { pos: [-18, 12, -26] as [number, number, number], size: [4.8, 24, 4.5] as [number, number, number], color: "#a855f7" },
      { pos: [-9, 8.5, -27] as [number, number, number], size: [3.8, 17, 3.8] as [number, number, number], color: "#38bdf8" },
      { pos: [1, 13.5, -28] as [number, number, number], size: [5.2, 27, 4.6] as [number, number, number], color: "#00e5ff" },
      { pos: [11, 10, -26] as [number, number, number], size: [4.4, 20, 4.2] as [number, number, number], color: "#c084fc" },
      { pos: [20, 12.5, -25] as [number, number, number], size: [4.6, 25, 4.4] as [number, number, number], color: "#f59e0b" },
      { pos: [27, 8, -18] as [number, number, number], size: [4.0, 16, 4.0] as [number, number, number], color: "#00e5ff" },
      { pos: [-28, 10.5, -14] as [number, number, number], size: [4.2, 21, 4.2] as [number, number, number], color: "#a855f7" },
      { pos: [-29, 7.5, -3] as [number, number, number], size: [3.8, 15, 3.8] as [number, number, number], color: "#38bdf8" },
      { pos: [29, 9.5, -6] as [number, number, number], size: [4.2, 19, 4.2] as [number, number, number], color: "#ec4899" },
      { pos: [-26, 8, 10] as [number, number, number], size: [4.0, 16, 4.0] as [number, number, number], color: "#00e5ff" },
      { pos: [27, 11, 8] as [number, number, number], size: [4.4, 22, 4.4] as [number, number, number], color: "#a855f7" },
    ],
    []
  );

  const visibleTowers =
    performanceMode === "eco" ? towers.slice(0, 7) : towers;

  return (
    <group>
      {visibleTowers.map((tower, idx) => (
        <group key={idx} position={tower.pos}>
          <mesh>
            <boxGeometry args={tower.size} />
            <meshStandardMaterial
              color="#070d1e"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Glowing vertical neon edge */}
          <mesh position={[0, 0, tower.size[2] / 2 + 0.04]}>
            <boxGeometry args={[0.14, tower.size[1] * 0.92, 0.05]} />
            <meshStandardMaterial
              color={tower.color}
              emissive={tower.color}
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
          {/* Lit horizontal window floor bands */}
          {[-0.3, -0.1, 0.1, 0.3].map((ratio) => (
            <mesh
              key={ratio}
              position={[0, tower.size[1] * ratio, tower.size[2] / 2 + 0.03]}
            >
              <boxGeometry args={[tower.size[0] * 0.78, 0.22, 0.03]} />
              <meshBasicMaterial
                color={idx % 3 === 0 ? "#fef08a" : tower.color}
                transparent
                opacity={0.75}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function CyberOutdoorCampus({
  performanceMode,
}: CyberOutdoorCampusProps) {
  const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (waterMatRef.current) {
      waterMatRef.current.emissiveIntensity =
        0.75 + Math.sin(clock.getElapsedTime() * 1.8) * 0.15;
    }
  });

  return (
    <group>
      {/* Wide Cyberpunk Campus Ground */}
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[76, 0.16, 76]} />
        <meshStandardMaterial color="#050a18" roughness={0.75} metalness={0.25} />
      </mesh>

      {/* Subtle Neon Ground Grid */}
      <gridHelper
        args={[66, 33, "#1d4ed8", "#0c1a3a"]}
        position={[0, 0.01, 0]}
      />

      {/* ================= LUXURY CYBER POOL DECK (Z = 2.2 .. 13.6) ================= */}
      {/* Elevated dark cyber-wood patio deck */}
      <mesh position={[0, 0.08, 7.9]} receiveShadow>
        <boxGeometry args={[21.6, 0.16, 11.4]} />
        <meshStandardMaterial
          color="#1e1b2e"
          metalness={0.35}
          roughness={0.55}
        />
      </mesh>

      {/* Glowing electric-blue & purple perimeter neon deck border */}
      <mesh position={[0, 0.165, 13.58]}>
        <boxGeometry args={[21.6, 0.05, 0.08]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.9}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-10.78, 0.165, 7.9]}>
        <boxGeometry args={[0.08, 0.05, 11.4]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.9}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[10.78, 0.165, 7.9]}>
        <boxGeometry args={[0.08, 0.05, 11.4]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.9}
          toneMapped={false}
        />
      </mesh>

      {/* ================= GLOWING CYBER INFINITY POOL ================= */}
      <group position={[-2.6, 0, 8.2]}>
        {/* Pool marble/cyber coping frame */}
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[9.9, 0.06, 5.7]} />
          <meshStandardMaterial
            color="#0f1c36"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        {/* Glowing illuminated cyan water surface */}
        <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9.2, 5.0]} />
          <meshStandardMaterial
            ref={waterMatRef}
            color="#06b6d4"
            emissive="#00e5ff"
            emissiveIntensity={0.8}
            metalness={0.25}
            roughness={0.12}
            toneMapped={false}
          />
        </mesh>
        {/* Bright underwater neon rim strips */}
        <mesh position={[0, 0.22, 2.5]}>
          <boxGeometry args={[9.2, 0.04, 0.06]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[0, 0.22, -2.5]}>
          <boxGeometry args={[9.2, 0.04, 0.06]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[-4.6, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.04, 5.0]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[4.6, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.04, 5.0]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
      </group>

      {/* Poolside Umbrellas & Loungers */}
      <CyberUmbrella position={[-5.2, 0.16, 4.1]} accent="#00e5ff" />
      <CyberUmbrella position={[-0.6, 0.16, 4.1]} accent="#a855f7" />
      <CyberUmbrella position={[-8.8, 0.16, 8.2]} accent="#22d3ee" />

      <PoolLounger position={[-6.0, 0.16, 4.4]} rotationY={0} />
      <PoolLounger position={[-4.2, 0.16, 4.4]} rotationY={0} />
      <PoolLounger position={[-1.4, 0.16, 4.4]} rotationY={0} />
      <PoolLounger position={[0.4, 0.16, 4.4]} rotationY={0} />

      {/* ================= ELECTRIC-GOLD CYBER SUPERCAR ================= */}
      <CyberSupercar position={[5.8, 0.16, 8.2]} rotationY={-0.38} />

      {/* ================= GLOWING CYBER PALM TREES ================= */}
      <CyberPalmTree position={[-9.5, 0.16, 3.6]} scale={1.05} />
      <CyberPalmTree position={[-9.5, 0.16, 12.2]} scale={0.95} />
      <CyberPalmTree position={[9.5, 0.16, 3.6]} scale={1.05} />
      <CyberPalmTree position={[9.5, 0.16, 12.2]} scale={0.95} />
      <CyberPalmTree position={[3.2, 0.16, 12.6]} scale={0.9} />
      <CyberPalmTree position={[-3.2, 0.16, 12.6]} scale={0.9} />

      {/* ================= CYBERPUNK CITY SKYLINE ================= */}
      <CyberSkyline performanceMode={performanceMode} />
    </group>
  );
}
