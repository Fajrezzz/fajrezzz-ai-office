"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PerformanceMode } from "@/types/office";

interface OfficeArchitectureProps {
  performanceMode: PerformanceMode;
}

function CyberPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Planter base */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.32, 0.26, 0.44, 6]} />
        <meshStandardMaterial color="#0b1224" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Neon rim */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.04, 6]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {/* Low-poly bioluminescent foliage */}
      <mesh position={[0, 0.72, 0]} rotation={[0.1, 0.4, 0]}>
        <coneGeometry args={[0.28, 0.56, 5]} />
        <meshStandardMaterial
          color="#0f766e"
          emissive="#0ea5e9"
          emissiveIntensity={0.45}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0.12, 0.62, 0.08]} rotation={[0.2, 1.2, -0.25]}>
        <coneGeometry args={[0.18, 0.42, 5]} />
        <meshStandardMaterial
          color="#4c1d95"
          emissive="#a855f7"
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function ServerRack({
  position,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  phaseOffset?: number;
}) {
  const ledStripRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledStrip2Ref = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;
    if (ledStripRef.current) {
      ledStripRef.current.emissiveIntensity = 1.0 + Math.sin(t * 4.5) * 0.65;
    }
    if (ledStrip2Ref.current) {
      ledStrip2Ref.current.emissiveIntensity = 1.0 + Math.cos(t * 3.2) * 0.65;
    }
  });

  return (
    <group position={position}>
      {/* Main tower body */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 2.3, 0.76]} />
        <meshStandardMaterial color="#091124" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Glass front cover */}
      <mesh position={[0, 1.15, 0.39]}>
        <boxGeometry args={[0.8, 2.08, 0.03]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.18}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Server blades */}
      {[0.45, 0.85, 1.25, 1.65, 2.0].map((y) => (
        <mesh key={y} position={[0, y, 0.36]}>
          <boxGeometry args={[0.72, 0.16, 0.04]} />
          <meshStandardMaterial
            color="#111c36"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* Glowing vertical telemetry LED strips */}
      <mesh position={[-0.34, 1.18, 0.4]}>
        <boxGeometry args={[0.04, 1.9, 0.02]} />
        <meshStandardMaterial
          ref={ledStripRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.34, 1.18, 0.4]}>
        <boxGeometry args={[0.04, 1.9, 0.02]} />
        <meshStandardMaterial
          ref={ledStrip2Ref}
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Top status bar */}
      <mesh position={[0, 2.32, 0]}>
        <boxGeometry args={[0.88, 0.04, 0.72]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HoloCommandHub() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);
  const ringInnerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.65;
      coreRef.current.rotation.x += dt * 0.3;
    }
    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.z += dt * 0.5;
    }
    if (ringInnerRef.current) {
      ringInnerRef.current.rotation.z -= dt * 0.85;
    }
  });

  return (
    <group position={[0.4, 0, 0.8]}>
      {/* Floor glowing projection circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.32, 24]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      {/* Pedestal base */}
      <mesh position={[0, 0.36, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.88, 0.72, 8]} />
        <meshStandardMaterial color="#0b142a" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Table glass top */}
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[1.05, 0.96, 0.08, 8]} />
        <meshStandardMaterial
          color="#0f1d3a"
          metalness={0.8}
          roughness={0.18}
        />
      </mesh>
      {/* Neon edge ring */}
      <mesh position={[0, 0.76, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.03, 0.025, 6, 24]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      {/* Holographic projector beam */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.72, 0.35, 0.95, 12, 1, true]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Floating low-poly wireframe crystal core */}
      <mesh ref={coreRef} position={[0, 1.48, 0]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00e5ff"
          emissiveIntensity={1.6}
          wireframe
          toneMapped={false}
        />
      </mesh>
      {/* Rotating holo data rings */}
      <mesh
        ref={ringOuterRef}
        position={[0, 1.48, 0]}
        rotation={[Math.PI / 2.2, 0.25, 0]}
      >
        <torusGeometry args={[0.64, 0.015, 6, 28]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} />
      </mesh>
      <mesh
        ref={ringInnerRef}
        position={[0, 1.48, 0]}
        rotation={[Math.PI / 1.8, -0.35, 0]}
      >
        <torusGeometry args={[0.48, 0.015, 6, 24]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export function OfficeArchitecture({
  performanceMode,
}: OfficeArchitectureProps) {
  const showDetailTrim = performanceMode !== "eco";

  // Precomputed cyber walkway neon strips guiding visual flow
  const floorStrips = useMemo(
    () => [
      { pos: [-1.85, 0.018, -1.35] as [number, number, number], size: [5.4, 0.01, 0.06] as [number, number, number], color: "#00e5ff" },
      { pos: [0.4, 0.018, 3.35] as [number, number, number], size: [6.4, 0.01, 0.06] as [number, number, number], color: "#a855f7" },
      { pos: [-1.55, 0.018, 1.0] as [number, number, number], size: [0.06, 0.01, 4.7] as [number, number, number], color: "#00e5ff" },
      { pos: [2.45, 0.018, 1.0] as [number, number, number], size: [0.06, 0.01, 4.7] as [number, number, number], color: "#38bdf8" },
    ],
    []
  );

  return (
    <group>
      {/* Main dark navy office floor slab */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[14.4, 0.44, 12.4]} />
        <meshStandardMaterial
          color="#060c1f"
          metalness={0.55}
          roughness={0.45}
        />
      </mesh>

      {/* Subtle architectural sub-chassis platform */}
      <mesh position={[0, -0.52, 0]}>
        <boxGeometry args={[13.6, 0.22, 11.6]} />
        <meshStandardMaterial color="#030712" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Floor cyber grid (lightweight Three.js gridHelper) */}
      <gridHelper
        args={[14, 14, "#1e3a8a", "#0f224a"]}
        position={[0, 0.01, 0]}
        scale={[1, 1, 12 / 14]}
      />

      {/* Glowing perimeter neon trim around floor */}
      <mesh position={[0, 0.015, 6.18]}>
        <boxGeometry args={[14.4, 0.04, 0.06]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[7.18, 0.015, 0]}>
        <boxGeometry args={[0.06, 0.04, 12.4]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* Low translucent futuristic glass safety parapet on open edges */}
      <mesh position={[0, 0.22, 6.15]}>
        <boxGeometry args={[14.2, 0.36, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.14}
          metalness={0.85}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[7.15, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.36, 12.2]} />
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.14}
          metalness={0.85}
          roughness={0.1}
        />
      </mesh>

      {/* Illuminated floor pathway strips */}
      {floorStrips.map((strip, idx) => (
        <mesh key={idx} position={strip.pos}>
          <boxGeometry args={strip.size} />
          <meshBasicMaterial color={strip.color} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* ================= BACK WALL (Z = -6.1) — Futuristic Glass Architecture ================= */}
      <group position={[0, 0, -6.1]}>
        {/* Lower solid cyber base panel */}
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <boxGeometry args={[14.4, 0.9, 0.22]} />
          <meshStandardMaterial
            color="#0a1329"
            metalness={0.7}
            roughness={0.32}
          />
        </mesh>
        {/* Translucent glass upper curtain wall */}
        <mesh position={[0, 2.55, 0]}>
          <boxGeometry args={[14.0, 3.3, 0.08]} />
          <meshStandardMaterial
            color="#0c4a6e"
            emissive="#0369a1"
            emissiveIntensity={0.22}
            transparent
            opacity={0.26}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
        {/* Top structural beam */}
        <mesh position={[0, 4.28, 0]}>
          <boxGeometry args={[14.4, 0.22, 0.28]} />
          <meshStandardMaterial
            color="#091226"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        {/* Neon horizontal ceiling light strip */}
        <mesh position={[0, 4.14, 0.14]}>
          <boxGeometry args={[13.8, 0.05, 0.04]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
        {/* Vertical glass mullions / columns */}
        {[-7.1, -3.6, 0, 3.6, 7.1].map((x) => (
          <group key={x} position={[x, 2.15, 0]}>
            <mesh>
              <boxGeometry args={[0.24, 4.3, 0.26]} />
              <meshStandardMaterial
                color="#0d1833"
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
            {showDetailTrim && (
              <mesh position={[0, 0, 0.14]}>
                <boxGeometry args={[0.04, 3.9, 0.02]} />
                <meshStandardMaterial
                  color={x === 0 ? "#a855f7" : "#00e5ff"}
                  emissive={x === 0 ? "#a855f7" : "#00e5ff"}
                  emissiveIntensity={1.4}
                  toneMapped={false}
                />
              </mesh>
            )}
          </group>
        ))}

        {/* Futuristic Wall Core Emblem Display */}
        <group position={[-1.4, 2.65, 0.12]}>
          <mesh>
            <boxGeometry args={[3.4, 1.05, 0.06]} />
            <meshStandardMaterial
              color="#070d1f"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Glowing emblem frame */}
          <mesh position={[0, 0.54, 0.03]}>
            <boxGeometry args={[3.44, 0.04, 0.03]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.9}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, -0.54, 0.03]}>
            <boxGeometry args={[3.44, 0.04, 0.03]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={1.9}
              toneMapped={false}
            />
          </mesh>
          {/* Decorative waveform bars inside wall panel */}
          {[-1.1, -0.75, -0.4, -0.05, 0.3, 0.65, 1.0].map((bx, i) => (
            <mesh key={bx} position={[bx, 0, 0.04]}>
              <boxGeometry
                args={[0.16, 0.28 + ((i * 7) % 4) * 0.14, 0.02]}
              />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#00e5ff" : "#c084fc"}
                emissive={i % 2 === 0 ? "#00e5ff" : "#c084fc"}
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================= LEFT WALL (X = -7.1) — Futuristic Glass Architecture ================= */}
      <group position={[-7.1, 0, 0]}>
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <boxGeometry args={[0.22, 0.9, 12.4]} />
          <meshStandardMaterial
            color="#0a1329"
            metalness={0.7}
            roughness={0.32}
          />
        </mesh>
        <mesh position={[0, 2.55, 0]}>
          <boxGeometry args={[0.08, 3.3, 12.0]} />
          <meshStandardMaterial
            color="#3b0764"
            emissive="#7e22ce"
            emissiveIntensity={0.2}
            transparent
            opacity={0.24}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
        <mesh position={[0, 4.28, 0]}>
          <boxGeometry args={[0.28, 0.22, 12.4]} />
          <meshStandardMaterial
            color="#091226"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        {/* Purple neon top light strip */}
        <mesh position={[0.14, 4.14, 0]}>
          <boxGeometry args={[0.04, 0.05, 11.8]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
        {[-3.0, 0.5, 3.8, 6.1].map((z) => (
          <group key={z} position={[0, 2.15, z]}>
            <mesh>
              <boxGeometry args={[0.26, 4.3, 0.24]} />
              <meshStandardMaterial
                color="#0d1833"
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
            {showDetailTrim && (
              <mesh position={[0.14, 0, 0]}>
                <boxGeometry args={[0.02, 3.9, 0.04]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#a855f7"
                  emissiveIntensity={1.3}
                  toneMapped={false}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Central Holographic Command Hub */}
      <HoloCommandHub />

      {/* Quantum Server Rack Bay */}
      <ServerRack position={[4.5, 0, -5.0]} phaseOffset={0} />
      <ServerRack position={[5.75, 0, -5.0]} phaseOffset={1.6} />

      {/* Low-poly Bioluminescent Cyber Plants */}
      <CyberPlant position={[-6.2, 0, -5.1]} />
      <CyberPlant position={[-6.2, 0, 5.1]} />
      <CyberPlant position={[6.2, 0, 5.1]} />
      <CyberPlant position={[6.25, 0, -1.3]} />
    </group>
  );
}
