"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_2_Y } from "@/lib/data/initial-office-data";
import type { FloorView, PerformanceMode } from "@/types/office";

interface OfficeArchitectureProps {
  performanceMode: PerformanceMode;
  activeFloor: FloorView;
  showLabels: boolean;
}

function ServerRack({
  position,
  rotationY = 0,
  phaseOffset = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  phaseOffset?: number;
}) {
  const ledStripRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledStrip2Ref = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;
    if (ledStripRef.current) {
      ledStripRef.current.emissiveIntensity = 1.2 + Math.sin(t * 4.5) * 0.7;
    }
    if (ledStrip2Ref.current) {
      ledStrip2Ref.current.emissiveIntensity = 1.2 + Math.cos(t * 3.2) * 0.7;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.9, 2.2, 0.72]} />
        <meshStandardMaterial color="#091124" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.1, 0.37]}>
        <boxGeometry args={[0.78, 1.98, 0.03]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[-0.32, 1.12, 0.39]}>
        <boxGeometry args={[0.045, 1.82, 0.02]} />
        <meshStandardMaterial
          ref={ledStripRef}
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.32, 1.12, 0.39]}>
        <boxGeometry args={[0.045, 1.82, 0.02]} />
        <meshStandardMaterial
          ref={ledStrip2Ref}
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HoloCommandHub({ position }: { position: [number, number, number] }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);
  const ringInnerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.7;
      coreRef.current.rotation.x += dt * 0.35;
    }
    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.z += dt * 0.55;
    }
    if (ringInnerRef.current) {
      ringInnerRef.current.rotation.z -= dt * 0.9;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.2, 24]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.56, 0.78, 0.68, 8]} />
        <meshStandardMaterial color="#0b142a" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.96, 0.88, 0.08, 8]} />
        <meshStandardMaterial color="#0f1d3a" metalness={0.8} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.025, 6, 24]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.66, 0.32, 0.9, 12, 1, true]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef} position={[0, 1.44, 0]}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00e5ff"
          emissiveIntensity={1.9}
          wireframe
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={ringOuterRef}
        position={[0, 1.44, 0]}
        rotation={[Math.PI / 2.2, 0.25, 0]}
      >
        <torusGeometry args={[0.58, 0.016, 6, 24]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} />
      </mesh>
      <mesh
        ref={ringInnerRef}
        position={[0, 1.44, 0]}
        rotation={[Math.PI / 1.8, -0.35, 0]}
      >
        <torusGeometry args={[0.42, 0.016, 6, 20]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/** Bright glowing LED ceiling light panels inspired by modern high-tech trading/AI floors */
function CeilingLightPanels({ y }: { y: number }) {
  const positions: [number, number][] = [
    [-5.5, -5.2],
    [0, -5.2],
    [5.5, -5.2],
    [-5.5, -1.2],
    [0, -1.2],
    [5.5, -1.2],
  ];

  return (
    <group>
      {positions.map(([x, z], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <boxGeometry args={[2.8, 0.06, 0.42]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive={idx % 2 === 0 ? "#bae6fd" : "#e9d5ff"}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Giant Wall-Mounted Cyberpunk Telemetry & Unit Leaderboard Screen on Lantai 2 */
function GiantWallTelemetryBoard() {
  const barColors = [
    "#00e5ff",
    "#22c55e",
    "#a855f7",
    "#38bdf8",
    "#ec4899",
    "#22d3ee",
    "#f59e0b",
    "#10b981",
  ];

  return (
    <group position={[0, FLOOR_2_Y + 1.65, -7.75]}>
      {/* Main dark glass LED screen chassis */}
      <mesh>
        <boxGeometry args={[13.6, 2.35, 0.1]} />
        <meshStandardMaterial color="#040916" metalness={0.85} roughness={0.18} />
      </mesh>
      {/* Glowing neon top & bottom bezel */}
      <mesh position={[0, 1.19, 0.05]}>
        <boxGeometry args={[13.7, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.1}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -1.19, 0.05]}>
        <boxGeometry args={[13.7, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.1}
          toneMapped={false}
        />
      </mesh>

      {/* Left Leaderboard Glowing Rows */}
      {[0.72, 0.36, 0, -0.36, -0.72].map((ry, idx) => (
        <group key={ry} position={[-3.8, ry, 0.06]}>
          <mesh position={[-1.4, 0, 0]}>
            <planeGeometry args={[2.1, 0.14]} />
            <meshBasicMaterial color={idx === 0 ? "#00e5ff" : "#cbd5e1"} />
          </mesh>
          <mesh position={[0.6, 0, 0]}>
            <planeGeometry args={[1.2, 0.14]} />
            <meshBasicMaterial color={idx % 2 === 0 ? "#34d399" : "#c084fc"} />
          </mesh>
        </group>
      ))}

      {/* Right Live Telemetry Bar Chart */}
      {barColors.map((col, idx) => {
        const h = 0.42 + ((idx * 5 + 3) % 6) * 0.24;
        return (
          <mesh
            key={idx}
            position={[0.6 + idx * 0.76, -0.92 + h / 2, 0.06]}
          >
            <planeGeometry args={[0.42, h]} />
            <meshStandardMaterial
              color={col}
              emissive={col}
              emissiveIntensity={1.65}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Rooftop Cyber Helipad + Neon Padel/Sports Court + Glowing Building Sign */
function RooftopDeck({
  performanceMode,
  showLabels,
}: {
  performanceMode: PerformanceMode;
  showLabels: boolean;
}) {
  const roofY = 9.88;

  return (
    <group>
      {/* Roof slab */}
      <mesh position={[0, 9.76, -3.0]}>
        <boxGeometry args={[18.5, 0.24, 10.5]} />
        <meshStandardMaterial color="#0c1326" metalness={0.55} roughness={0.4} />
      </mesh>

      {/* Glowing perimeter roof neon bands */}
      <mesh position={[0, 9.92, 2.22]}>
        <boxGeometry args={[18.5, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 9.92, -8.22]}>
        <boxGeometry args={[18.5, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-9.22, 9.92, -3.0]}>
        <boxGeometry args={[0.08, 0.08, 10.5]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[9.22, 9.92, -3.0]}>
        <boxGeometry args={[0.08, 0.08, 10.5]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* ================= GLOWING CYBER HELIPAD (Left Roof) ================= */}
      <group position={[-4.5, roofY, -3.0]}>
        {/* Helipad deck surface */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.2, 24]} />
          <meshStandardMaterial color="#101a34" roughness={0.5} />
        </mesh>
        {/* Glowing gold-cyan outer ring */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.85, 3.18, 28]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={1.9}
            toneMapped={false}
          />
        </mesh>
        {/* Inner cyan neon circle */}
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.25, 2.38, 24]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        {/* Glowing "H" symbol */}
        <mesh position={[-0.75, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.38, 2.2]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.75, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.38, 2.2]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 0.36]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* ================= NEON PADEL / CYBER SPORTS COURT (Right Roof) ================= */}
      <group position={[4.1, roofY, -3.0]}>
        {/* Bright electric-blue court surface */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.2, 4.6]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.65}
            roughness={0.35}
          />
        </mesh>
        {/* Glowing court boundary lines */}
        <mesh position={[0, 0.045, 2.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 0.08]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[0, 0.045, -2.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 0.08]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[-2.9, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 4.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[2.9, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 4.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        {/* Center net */}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.04, 0.68, 4.3]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.45}
          />
        </mesh>
        {/* Translucent glass court walls */}
        <mesh position={[0, 0.85, -2.35]}>
          <boxGeometry args={[6.3, 1.65, 0.06]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            metalness={0.85}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.85, 2.35]}>
          <boxGeometry args={[6.3, 1.65, 0.06]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.16}
            metalness={0.85}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[-3.15, 0.85, 0]}>
          <boxGeometry args={[0.06, 1.65, 4.7]} />
          <meshStandardMaterial
            color="#a855f7"
            transparent
            opacity={0.22}
            metalness={0.85}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[3.15, 0.85, 0]}>
          <boxGeometry args={[0.06, 1.65, 4.7]} />
          <meshStandardMaterial
            color="#a855f7"
            transparent
            opacity={0.22}
            metalness={0.85}
            roughness={0.1}
          />
        </mesh>
        {/* Glowing neon top rail around court */}
        <mesh position={[0, 1.7, -2.35]}>
          <boxGeometry args={[6.35, 0.06, 0.06]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
        {performanceMode !== "eco" && (
          <>
            <mesh position={[-3.1, 1.35, -2.3]}>
              <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[3.1, 1.35, -2.3]}>
              <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </>
        )}
      </group>

      {/* ================= GLOWING ROOFTOP FAJREZZZ SIGNAGE ================= */}
      <group position={[0, 10.42, 2.15]}>
        <mesh>
          <boxGeometry args={[5.8, 0.72, 0.14]} />
          <meshStandardMaterial color="#050b1c" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0.06]}>
          <boxGeometry args={[5.9, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.38, 0.06]}>
          <boxGeometry args={[5.9, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={2.3}
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
            <div className="rounded-md border border-cyan-300/60 bg-[#040a1a]/90 px-3 py-0.5 text-xs font-black tracking-[0.26em] text-cyan-200 shadow-[0_0_24px_rgba(0,229,255,0.6)] whitespace-nowrap">
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
  showLabels,
}: OfficeArchitectureProps) {
  const showFloor2 = activeFloor !== "l1";
  const showFloor3 =
    activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof";
  const showRoof = activeFloor === "all" || activeFloor === "roof";
  const showFrontGlassL2 = activeFloor !== "l2";

  const mullionXs = [-9.0, -5.4, -1.8, 1.8, 5.4, 9.0];

  return (
    <group>
      {/* ==================================================================== */}
      {/* FLOOR 1 (LANTAI 1 — CYBER LOBBY & LOUNGE: Y = 0 .. 3.2)             */}
      {/* ==================================================================== */}
      <group>
        {/* Floor 1 slab */}
        <mesh position={[0, 0.08, -3.0]} receiveShadow>
          <boxGeometry args={[18.2, 0.16, 10.2]} />
          <meshStandardMaterial color="#0b1328" metalness={0.5} roughness={0.45} />
        </mesh>

        {/* Back & Side solid cyber walls (Floor 1) */}
        <mesh position={[0, 1.65, -8.0]}>
          <boxGeometry args={[18.2, 3.15, 0.2]} />
          <meshStandardMaterial color="#091124" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[-9.0, 1.65, -3.0]}>
          <boxGeometry args={[0.2, 3.15, 10.2]} />
          <meshStandardMaterial color="#091124" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[9.0, 1.65, -3.0]}>
          <boxGeometry args={[0.2, 3.15, 10.2]} />
          <meshStandardMaterial color="#091124" metalness={0.65} roughness={0.35} />
        </mesh>

        {/* Lobby Glowing Reception Desk */}
        <group position={[0, 0.16, -5.2]}>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[4.4, 1.04, 1.0]} />
            <meshStandardMaterial color="#0f1b36" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.56, 0.52]}>
            <boxGeometry args={[4.2, 0.08, 0.04]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* 4 Glowing Cyber Lounge Pods on Floor 1 (inspired by Screenshot 3 lower floor) */}
        {[-6.2, -3.6, 3.6, 6.2].map((lx, idx) => (
          <group key={lx} position={[lx, 0.16, -1.6]}>
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[1.35, 0.9, 1.2]} />
              <meshStandardMaterial color="#141e38" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.92, 0]}>
              <boxGeometry args={[1.3, 0.08, 1.15]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? "#ec4899" : "#00e5ff"}
                emissive={idx % 2 === 0 ? "#ec4899" : "#00e5ff"}
                emissiveIntensity={1.6}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Floor 1 Front Glass Curtain Wall & Entrance Frame */}
        <mesh position={[-5.2, 1.65, 2.05]}>
          <boxGeometry args={[7.4, 3.05, 0.08]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.18}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
        <mesh position={[5.2, 1.65, 2.05]}>
          <boxGeometry args={[7.4, 3.05, 0.08]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.18}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
        {/* Glowing Lobby Entrance Arch */}
        <mesh position={[0, 2.85, 2.1]}>
          <boxGeometry args={[3.2, 0.1, 0.16]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>

        {/* Vertical Mullions Floor 1 */}
        {mullionXs.map((mx) => (
          <mesh key={`m1-${mx}`} position={[mx, 1.65, 2.08]}>
            <boxGeometry args={[0.16, 3.2, 0.18]} />
            <meshStandardMaterial color="#070d1c" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}

        <CeilingLightPanels y={3.12} />
      </group>

      {/* ==================================================================== */}
      {/* FLOOR 2 (LANTAI 2 — MAIN AI OPERATIONS FLOOR: Y = 3.28 .. 6.6)      */}
      {/* ==================================================================== */}
      {showFloor2 && (
        <group>
          {/* Floor 2 structural slab */}
          <mesh position={[0, 3.2, -3.0]} receiveShadow>
            <boxGeometry args={[18.4, 0.16, 10.4]} />
            <meshStandardMaterial
              color="#131d36"
              metalness={0.45}
              roughness={0.42}
            />
          </mesh>
          {/* Bright glowing horizontal neon edge strip (Floor 2 facade divider) */}
          <mesh position={[0, 3.22, 2.22]}>
            <boxGeometry args={[18.5, 0.09, 0.08]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>

          {/* Glowing corridor walkway strips on Floor 2 */}
          <mesh position={[0, FLOOR_2_Y + 0.015, -1.65]}>
            <boxGeometry args={[12.8, 0.015, 0.08]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, FLOOR_2_Y + 0.015, 1.35]}>
            <boxGeometry args={[11.6, 0.015, 0.08]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.75} />
          </mesh>

          {/* Back & side walls (Floor 2) */}
          <mesh position={[0, 4.95, -8.0]}>
            <boxGeometry args={[18.2, 3.35, 0.2]} />
            <meshStandardMaterial color="#0c152c" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[-9.0, 4.95, -3.0]}>
            <boxGeometry args={[0.2, 3.35, 10.2]} />
            <meshStandardMaterial color="#0b1328" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[9.0, 4.95, -3.0]}>
            <boxGeometry args={[0.2, 3.35, 10.2]} />
            <meshStandardMaterial color="#0b1328" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* Giant Glowing Wall Leaderboard & Telemetry Screen */}
          <GiantWallTelemetryBoard />

          {/* Central Holographic Command Hub on Floor 2 */}
          <HoloCommandHub position={[0, FLOOR_2_Y, 0.0]} />

          {/* Quantum Server Rack Bay on Floor 2 Left Wall */}
          <ServerRack
            position={[-8.1, FLOOR_2_Y, -0.9]}
            rotationY={Math.PI / 2}
            phaseOffset={0}
          />
          <ServerRack
            position={[-8.1, FLOOR_2_Y, 0.45]}
            rotationY={Math.PI / 2}
            phaseOffset={1.4}
          />

          {/* Front Glass Curtain Wall (auto-opens when inspecting Floor 2) */}
          {showFrontGlassL2 && (
            <>
              <mesh position={[0, 4.95, 2.05]}>
                <boxGeometry args={[17.8, 3.2, 0.07]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  transparent
                  opacity={0.14}
                  metalness={0.9}
                  roughness={0.08}
                />
              </mesh>
              {mullionXs.map((mx) => (
                <mesh key={`m2-${mx}`} position={[mx, 4.95, 2.08]}>
                  <boxGeometry args={[0.16, 3.35, 0.18]} />
                  <meshStandardMaterial
                    color="#070d1c"
                    metalness={0.85}
                    roughness={0.2}
                  />
                </mesh>
              ))}
            </>
          )}

          {/* Bright Ceiling LED Light Panels inside Floor 2 */}
          <CeilingLightPanels y={6.52} />
        </group>
      )}

      {/* ==================================================================== */}
      {/* FLOOR 3 (LANTAI 3 — EXECUTIVE COMMAND DECK: Y = 6.68 .. 9.8)        */}
      {/* ==================================================================== */}
      {showFloor3 && (
        <group>
          {/* Floor 3 structural slab */}
          <mesh position={[0, 6.6, -3.0]}>
            <boxGeometry args={[18.4, 0.16, 10.4]} />
            <meshStandardMaterial color="#111b33" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Glowing purple horizontal facade neon strip */}
          <mesh position={[0, 6.62, 2.22]}>
            <boxGeometry args={[18.5, 0.09, 0.08]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>

          {/* Walls Floor 3 */}
          <mesh position={[0, 8.2, -8.0]}>
            <boxGeometry args={[18.2, 3.1, 0.2]} />
            <meshStandardMaterial color="#0b1328" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-9.0, 8.2, -3.0]}>
            <boxGeometry args={[0.2, 3.1, 10.2]} />
            <meshStandardMaterial color="#0b1328" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[9.0, 8.2, -3.0]}>
            <boxGeometry args={[0.2, 3.1, 10.2]} />
            <meshStandardMaterial color="#0b1328" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* Executive Glass Conference Table */}
          <group position={[-1.2, 6.68, -3.2]}>
            <mesh position={[0, 0.42, 0]}>
              <boxGeometry args={[5.8, 0.12, 2.0]} />
              <meshStandardMaterial
                color="#0f1d3a"
                metalness={0.8}
                roughness={0.18}
              />
            </mesh>
            <mesh position={[0, 0.49, 0]}>
              <boxGeometry args={[5.2, 0.03, 0.14]} />
              <meshStandardMaterial
                color="#00e5ff"
                emissive="#00e5ff"
                emissiveIntensity={1.9}
                toneMapped={false}
              />
            </mesh>
          </group>

          {/* Executive Lounge Sofa */}
          <group position={[5.6, 6.68, -4.5]}>
            <mesh position={[0, 0.32, 0]}>
              <boxGeometry args={[3.0, 0.64, 1.1]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.05, 0.56]}>
              <boxGeometry args={[2.9, 0.06, 0.04]} />
              <meshStandardMaterial
                color="#c084fc"
                emissive="#c084fc"
                emissiveIntensity={1.8}
                toneMapped={false}
              />
            </mesh>
          </group>

          {/* Floor 3 Front Glass Curtain Wall */}
          <mesh position={[0, 8.2, 2.05]}>
            <boxGeometry args={[17.8, 3.0, 0.07]} />
            <meshStandardMaterial
              color="#a855f7"
              transparent
              opacity={0.15}
              metalness={0.9}
              roughness={0.08}
            />
          </mesh>
          {mullionXs.map((mx) => (
            <mesh key={`m3-${mx}`} position={[mx, 8.2, 2.08]}>
              <boxGeometry args={[0.16, 3.15, 0.18]} />
              <meshStandardMaterial color="#070d1c" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}

          <CeilingLightPanels y={9.64} />
        </group>
      )}

      {/* Central Dark Vertical Elevator Core Shaft Pillar (Right-Center Facade like Screenshot 2) */}
      <mesh
        position={[3.6, showRoof ? 5.0 : showFloor3 ? 4.9 : showFloor2 ? 3.3 : 1.65, 2.08]}
      >
        <boxGeometry
          args={[
            1.45,
            showRoof ? 9.8 : showFloor3 ? 9.6 : showFloor2 ? 6.5 : 3.2,
            0.35,
          ]}
        />
        <meshStandardMaterial color="#050914" metalness={0.85} roughness={0.18} />
      </mesh>
      <mesh
        position={[3.6, showRoof ? 5.0 : showFloor3 ? 4.9 : showFloor2 ? 3.3 : 1.65, 2.28]}
      >
        <boxGeometry
          args={[
            0.08,
            showRoof ? 9.5 : showFloor3 ? 9.3 : showFloor2 ? 6.2 : 2.9,
            0.04,
          ]}
        />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>

      {/* ==================================================================== */}
      {/* ROOFTOP DECK (ATAP — HELIPAD + NEON PADEL COURT + FAJREZZZ SIGN)    */}
      {/* ==================================================================== */}
      {showRoof && (
        <RooftopDeck
          performanceMode={performanceMode}
          showLabels={showLabels}
        />
      )}
    </group>
  );
}
