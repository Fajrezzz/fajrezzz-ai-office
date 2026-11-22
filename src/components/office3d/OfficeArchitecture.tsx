"use client";

import React, { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import { RooftopAttractions } from "@/components/office3d/RooftopAttractions";
import {
  FLOOR_1_Y,
  FLOOR_2_Y,
  FLOOR_3_Y,
} from "@/lib/data/initial-office-data";
import type {
  FloorView,
  LightingPreset,
  PerformanceMode,
  Vector3Tuple,
} from "@/types/office";

interface OfficeArchitectureProps {
  activeFloor: FloorView;
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
  isSimulationRunning?: boolean;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

function PendantLight({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const glow = isNight ? 2.6 : isSunset ? 1.5 : 0.85;
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.72, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.32, 0.14, 16]} />
        <meshStandardMaterial color="#27303d" metalness={0.65} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.05, 16]} />
        <meshStandardMaterial
          color="#fff6e0"
          emissive="#ffdca0"
          emissiveIntensity={glow}
        />
      </mesh>
    </group>
  );
}

function IndoorPlanter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.28, 0.64, 14]} />
        <meshStandardMaterial color="#e8e3da" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.55, 8]} />
        <meshStandardMaterial color="#5c432c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.24, 0]} castShadow>
        <sphereGeometry args={[0.42, 12, 10]} />
        <meshStandardMaterial color="#3c7a38" roughness={0.82} />
      </mesh>
      <mesh position={[0.18, 1.44, 0.1]} castShadow>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#4b8d43" roughness={0.8} />
      </mesh>
      <mesh position={[-0.16, 1.38, -0.1]} castShadow>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshStandardMaterial color="#2f6b2c" roughness={0.84} />
      </mesh>
    </group>
  );
}

/** Realistic Ergonomic Executive Leather Swivel Chair (replaces solid box placeholders) */
function ExecutiveLeatherChair({
  position,
  rotationY = 0,
  isCeo = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  isCeo?: boolean;
}) {
  const leatherColor = isCeo ? "#1e1b18" : "#272d38";
  const accentTrim = isCeo ? "#d4af37" : "#94a3b8";
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 5-Star Chrome Swivel Base */}
      {[0, 1, 2, 3, 4].map((i) => {
        const ang = (i * Math.PI * 2) / 5;
        return (
          <group key={i} rotation={[0, ang, 0]}>
            <mesh position={[0, 0.06, 0.14]} rotation={[0.16, 0, 0]}>
              <boxGeometry args={[0.04, 0.03, 0.28]} />
              <meshStandardMaterial color={accentTrim} metalness={0.82} roughness={0.22} />
            </mesh>
            {/* Caster Wheel */}
            <mesh position={[0, 0.025, 0.26]}>
              <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
              <meshStandardMaterial color="#111827" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* Pneumatic Center Lift Cylinder */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 0.38, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Contoured Leather Seat Cushion (top at y = 0.48) */}
      <mesh position={[0, 0.44, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.08, 0.48]} />
        <meshStandardMaterial color={leatherColor} roughness={0.62} />
      </mesh>
      {/* Ergonomic Reclined Leather Backrest (behind seated hips at z = -0.22) */}
      <mesh position={[0, 0.8, -0.22]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.48, 0.64, 0.08]} />
        <meshStandardMaterial color={leatherColor} roughness={0.6} />
      </mesh>
      {/* Headrest Pillow */}
      <mesh position={[0, 1.15, -0.26]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.32, 0.14, 0.09]} />
        <meshStandardMaterial color={leatherColor} roughness={0.56} />
      </mesh>
      {/* Lumbar Spine Bracket */}
      <mesh position={[0, 0.62, -0.26]}>
        <boxGeometry args={[0.1, 0.36, 0.04]} />
        <meshStandardMaterial color={accentTrim} metalness={0.75} roughness={0.26} />
      </mesh>
      {/* Left & Right Curved Armrests */}
      {[-0.27, 0.27].map((ax, ai) => (
        <group key={ai}>
          <mesh position={[ax, 0.54, -0.02]}>
            <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
            <meshStandardMaterial color={accentTrim} metalness={0.78} roughness={0.25} />
          </mesh>
          <mesh position={[ax, 0.66, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.045, 0.34]} />
            <meshStandardMaterial color={leatherColor} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function OfficeArchitecture({
  activeFloor,
  performanceMode,
  lightingPreset,
  isSimulationRunning = true,
  onFocusPoint,
}: OfficeArchitectureProps) {
  const textures = useMemo(() => getRealisticTextures(), []);

  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";
  const interiorLightEmissive = isNight ? 2.6 : isSunset ? 1.65 : 0.95;
  const cyanNeonIntensity = isNight ? 2.4 : isSunset ? 1.15 : 0.12;
  const magentaNeonIntensity = isNight ? 2.25 : isSunset ? 1.1 : 0.1;

  const showL2 = activeFloor !== "l1";
  const showL3 =
    activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof";
  const showRoof = activeFloor === "all" || activeFloor === "roof";

  const handleSurfaceDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, e.point.y + 0.55, e.point.z]);
    }
  };

  const frontColumnsX = [-13.7, -6.9, 0, 6.9, 13.7];
  const timberFins = [-13.2, -12.6, -12.0, -11.4, 11.4, 12.0, 12.6, 13.2];

  return (
    <group>
      {/* ============================================================
          GLASS PANORAMIC ELEVATOR SHAFT (West Rear Corner X=-11.6, Z=-8.4)
          Visibly connects L1 -> L2 -> L3 -> Rooftop!
          ============================================================ */}
      <group position={[-11.8, 0, -8.4]}>
        <mesh
          position={[0, showRoof ? 5.8 : showL3 ? 5.6 : showL2 ? 3.8 : 1.9, 0]}
        >
          <boxGeometry
            args={[
              2.1,
              showRoof ? 11.4 : showL3 ? 11.0 : showL2 ? 7.4 : 3.6,
              2.0,
            ]}
          />
          <meshPhysicalMaterial
            color="#cde7f8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.18}
          />
        </mesh>
        {/* Brushed bronze vertical guide rails */}
        {[-0.98, 0.98].map((rx, i) => (
          <mesh
            key={i}
            position={[rx, showRoof ? 5.8 : showL3 ? 5.6 : showL2 ? 3.8 : 1.9, 0.96]}
          >
            <boxGeometry
              args={[
                0.08,
                showRoof ? 11.4 : showL3 ? 11.0 : showL2 ? 7.4 : 3.6,
                0.08,
              ]}
            />
            <meshStandardMaterial color="#b48a46" metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* ============================================================
          FLOOR 1 — GRAND LOBBY, RECEPTION & ARRIVAL PAVILION (Y=0.18)
          ============================================================ */}
      <group>
        {/* Polished Travertine Marble Floor Slab (28.4m x 14.4m) */}
        <mesh
          position={[0, FLOOR_1_Y - 0.09, -3]}
          receiveShadow
          castShadow
          onDoubleClick={handleSurfaceDoubleClick}
        >
          <boxGeometry args={[28.4, 0.18, 14.4]} />
          <meshStandardMaterial
            map={textures.marbleTile}
            bumpMap={textures.marbleBump}
            bumpScale={0.025}
            roughness={0.26}
            metalness={0.08}
          />
        </mesh>

        {/* Rear Architectural White Stucco Wall (Z = -10) */}
        <mesh position={[0, 2.02, -10]} castShadow receiveShadow>
          <boxGeometry args={[28.2, 3.7, 0.34]} />
          <meshStandardMaterial
            map={textures.stuccoWall}
            bumpMap={textures.stuccoBump}
            bumpScale={0.03}
            roughness={0.72}
          />
        </mesh>

        {/* Side Architectural Walls + Side Panoramic Windows */}
        {[-14, 14].map((x, idx) => (
          <group key={idx}>
            <mesh position={[x, 2.02, -5.2]} castShadow receiveShadow>
              <boxGeometry args={[0.34, 3.7, 9.6]} />
              <meshStandardMaterial
                map={textures.stuccoWall}
                bumpMap={textures.stuccoBump}
                bumpScale={0.03}
                roughness={0.72}
              />
            </mesh>
            <mesh position={[x, 2.02, 1.8]}>
              <boxGeometry args={[0.08, 3.55, 4.4]} />
              <meshPhysicalMaterial
                color="#d8ecf8"
                transparent
                opacity={0.25}
                roughness={0.06}
                metalness={0.1}
              />
            </mesh>
          </group>
        ))}

        {/* Front Grand Glass Curtain Wall + Open Center Double Entrance */}
        {[-9.8, 9.8].map((x, idx) => (
          <mesh key={idx} position={[x, 2.02, 4.0]}>
            <boxGeometry args={[8.4, 3.55, 0.08]} />
            <meshPhysicalMaterial
              color="#d8edf8"
              transparent
              opacity={0.2}
              roughness={0.06}
              metalness={0.12}
            />
          </mesh>
        ))}

        {/* Dark Bronze Structural Columns (L1) */}
        {frontColumnsX.map((cx, i) => (
          <mesh key={i} position={[cx, 2.02, 4.02]} castShadow>
            <boxGeometry args={[0.32, 3.72, 0.32]} />
            <meshStandardMaterial
              color="#282d35"
              metalness={0.72}
              roughness={0.32}
            />
          </mesh>
        ))}

        {/* Grand Entrance Canopy Overhang */}
        <mesh position={[0, 3.56, 4.95]} castShadow receiveShadow>
          <boxGeometry args={[9.2, 0.16, 1.9]} />
          <meshStandardMaterial color="#2a303a" metalness={0.62} roughness={0.35} />
        </mesh>

        {/* Luxury Marble Reception Desk with Dual Monitors & Floral Accent */}
        <group position={[0, FLOOR_1_Y, -5.2]}>
          <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.6, 1.12, 1.2]} />
            <meshStandardMaterial
              map={textures.marbleTile}
              roughness={0.2}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[0, 1.14, 0.04]} castShadow>
            <boxGeometry args={[5.75, 0.08, 1.28]} />
            <meshStandardMaterial color="#8f633b" roughness={0.46} />
          </mesh>
          <mesh position={[0, 0.58, 0.62]}>
            <boxGeometry args={[5.4, 0.06, 0.03]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.85}
              roughness={0.2}
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 1.3 : 0.35}
            />
          </mesh>
          {/* Receptionist Monitors */}
          {[-1.1, 1.1].map((mx, i) => (
            <mesh key={i} position={[mx, 1.44, -0.15]}>
              <boxGeometry args={[0.72, 0.44, 0.04]} />
              <meshStandardMaterial color="#111827" roughness={0.3} />
            </mesh>
          ))}
          {/* Reception Floral Vase */}
          <mesh position={[0, 1.34, 0.22]}>
            <cylinderGeometry args={[0.1, 0.08, 0.28, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.56, 0.22]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#ec4899" roughness={0.75} />
          </mesh>
        </group>

        {/* Wood-slat feature wall behind Reception + Brand Signage */}
        <mesh position={[0, 2.08, -9.72]} castShadow>
          <boxGeometry args={[9.8, 3.2, 0.18]} />
          <meshStandardMaterial color="#6e4b2e" roughness={0.62} />
        </mesh>
        <Text
          position={[0, 2.45, -9.58]}
          fontSize={0.56}
          color="#f8fafc"
          letterSpacing={0.14}
          anchorX="center"
          anchorY="middle"
        >
          FAJREZZZ AI OFFICE
        </Text>
        <Text
          position={[0, 1.92, -9.58]}
          fontSize={0.2}
          color="#fde68a"
          letterSpacing={0.2}
          anchorX="center"
          anchorY="middle"
        >
          EXECUTIVE HEADQUARTERS · 10 STAFF + BOS FAJREZ
        </Text>

        {/* West & East Luxury Lobby Lounge Sets (Sofas + Armrests + Pillows + Marble Tables) */}
        {[-8.4, 8.4].map((lx, idx) => (
          <group key={idx} position={[lx, FLOOR_1_Y, -1.6]}>
            <mesh position={[0, 0.02, -0.2]} receiveShadow>
              <boxGeometry args={[4.6, 0.03, 3.6]} />
              <meshStandardMaterial color="#dfd8cc" roughness={0.92} />
            </mesh>
            {/* Plush 3-seater sofa */}
            <mesh position={[0, 0.28, -1.25]} castShadow receiveShadow>
              <boxGeometry args={[3.5, 0.44, 0.98]} />
              <meshStandardMaterial color="#3c4654" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.64, -1.62]} castShadow>
              <boxGeometry args={[3.5, 0.48, 0.24]} />
              <meshStandardMaterial color="#333c49" roughness={0.82} />
            </mesh>
            {/* Sofa Armrests */}
            {[-1.68, 1.68].map((ax, ai) => (
              <mesh key={ai} position={[ax, 0.46, -1.25]} castShadow>
                <boxGeometry args={[0.18, 0.42, 0.98]} />
                <meshStandardMaterial color="#2f3744" roughness={0.8} />
              </mesh>
            ))}
            {/* Accent throw pillows */}
            <mesh position={[-1.2, 0.62, -1.35]} rotation={[0.2, 0.2, 0]}>
              <boxGeometry args={[0.38, 0.34, 0.14]} />
              <meshStandardMaterial color="#d97706" roughness={0.86} />
            </mesh>
            <mesh position={[1.2, 0.62, -1.35]} rotation={[0.2, -0.2, 0]}>
              <boxGeometry args={[0.38, 0.34, 0.14]} />
              <meshStandardMaterial color="#0284c7" roughness={0.86} />
            </mesh>
            {/* Oak & Marble Coffee Table */}
            <mesh position={[0, 0.26, 0.35]} castShadow receiveShadow>
              <boxGeometry args={[1.95, 0.36, 0.95]} />
              <meshStandardMaterial color="#8b623c" roughness={0.44} />
            </mesh>
            <mesh position={[0, 0.45, 0.35]}>
              <boxGeometry args={[1.85, 0.04, 0.85]} />
              <meshStandardMaterial map={textures.marbleTile} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Architectural Floating Oak & Glass Staircase (East Rear Corner) */}
        <group position={[11.2, FLOOR_1_Y, -8.2]}>
          {Array.from({ length: 12 }).map((_, step) => (
            <mesh
              key={step}
              position={[0, step * 0.3 + 0.16, step * 0.4]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[2.1, 0.1, 0.42]} />
              <meshStandardMaterial color="#9a6e45" roughness={0.55} />
            </mesh>
          ))}
          {/* Glass side balustrade */}
          <mesh position={[-1.06, 2.0, 2.2]} rotation={[0.64, 0, 0]}>
            <boxGeometry args={[0.05, 0.95, 5.8]} />
            <meshPhysicalMaterial
              color="#d8eef8"
              transparent
              opacity={0.32}
              roughness={0.08}
            />
          </mesh>
        </group>

        {/* Indoor Olive Planters (Lobby Entrance + Reception Flanks) */}
        <IndoorPlanter position={[-5.4, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[5.4, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[-12.6, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[12.6, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[-3.45, FLOOR_1_Y, -5.2]} />
        <IndoorPlanter position={[3.45, FLOOR_1_Y, -5.2]} />

        {/* Floor 1 Dedicated Channel Manager Lounge Armchair & Marble Coffee Table (for TL / staff-10) */}
        <group position={[3.0, FLOOR_1_Y, -1.6]}>
          {/* Plush Slate Lounge Armchair facing South (+Z) */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.64, 0.1, 0.56]} />
            <meshStandardMaterial color="#334155" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.76, -0.24]} castShadow>
            <boxGeometry args={[0.64, 0.58, 0.09]} />
            <meshStandardMaterial color="#1e293b" roughness={0.74} />
          </mesh>
          {[-0.29, 0.29].map((ax, ai) => (
            <mesh key={ai} position={[ax, 0.62, -0.02]} castShadow>
              <boxGeometry args={[0.07, 0.24, 0.52]} />
              <meshStandardMaterial color="#1e293b" roughness={0.72} />
            </mesh>
          ))}
          {[
            [-0.24, -0.22],
            [0.24, -0.22],
            [-0.24, 0.22],
            [0.24, 0.22],
          ].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.21, lz]}>
              <cylinderGeometry args={[0.026, 0.02, 0.42, 8]} />
              <meshStandardMaterial color="#8b5e3c" roughness={0.52} />
            </mesh>
          ))}
          {/* Round Marble Coffee Side Table */}
          <group position={[0.62, 0, 0.36]}>
            <mesh position={[0, 0.27, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.54, 10]} />
              <meshStandardMaterial color="#d4af37" metalness={0.82} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.03, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.036, 18]} />
              <meshStandardMaterial map={textures.marbleTile} roughness={0.2} />
            </mesh>
            <mesh position={[-0.06, 0.58, -0.02]}>
              <cylinderGeometry args={[0.07, 0.055, 0.014, 12]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* L1 Warm Wood Architectural Slat Accent Panels on West & East Walls */}
        {[-13.76, 13.76].map((wx, i) => (
          <mesh key={`l1-wood-${i}`} position={[wx, 2.0, -5.2]}>
            <boxGeometry args={[0.1, 3.2, 6.4]} />
            <meshStandardMaterial color="#7a5130" roughness={0.6} />
          </mesh>
        ))}

        {/* L1 Warm-Gold Linear Ceiling Light Strips */}
        {[-8.4, 0, 8.4].map((lx, i) => (
          <mesh key={`l1-ceil-${i}`} position={[lx, 3.6, -2.0]}>
            <boxGeometry args={[4.8, 0.05, 0.16]} />
            <meshStandardMaterial
              color="#fff6e0"
              emissive="#ffcf82"
              emissiveIntensity={interiorLightEmissive}
              toneMapped={!isNight}
            />
          </mesh>
        ))}

        {/* L1 Curtain Wall Horizontal Transom Bar */}
        {[-9.8, 9.8].map((tx, i) => (
          <mesh key={`l1-transom-${i}`} position={[tx, 2.38, 4.04]}>
            <boxGeometry args={[8.4, 0.06, 0.08]} />
            <meshStandardMaterial color="#252c36" metalness={0.75} roughness={0.3} />
          </mesh>
        ))}

        {/* Warm Lobby Pendant Lamps */}
        <PendantLight position={[-6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[0, 3.22, -4.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />

        {/* Warm L1 Interior Light (always active so lobby never looks dark/shadowed!) */}
        <pointLight
          position={[0, 3.2, -2.2]}
          color="#fff0d6"
          intensity={isNight ? 20 : isSunset ? 13 : 9}
          distance={26}
        />
      </group>

      {/* ============================================================
          FLOOR 2 — GRAND 8-WORKSTATION OPERATIONS HALL + LEFT/RIGHT COFFEE BARS + PANORAMIC BALCONY (Y=3.9)
          ============================================================ */}
      {showL2 && (
        <group>
          {/* Expanded Slab (Z = -10.4 to +6.2) supporting the 2.15m Panoramic View Balcony */}
          <mesh
            position={[0, FLOOR_2_Y - 0.14, -2.1]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[28.8, 0.28, 16.6]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.025}
              roughness={0.68}
            />
          </mesh>

          <mesh
            position={[0, FLOOR_2_Y + 0.01, -3.0]}
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[27.8, 0.04, 13.8]} />
            <meshStandardMaterial
              map={textures.officeOak}
              bumpMap={textures.officeOakBump}
              bumpScale={0.04}
              roughness={0.5}
            />
          </mesh>

          {/* Outdoor Panoramic View Balcony Teak Deck (Z = 4.08 to 6.12) */}
          <mesh
            position={[0, FLOOR_2_Y + 0.012, 5.1]}
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[28.2, 0.036, 2.04]} />
            <meshStandardMaterial
              map={textures.woodDeck}
              bumpMap={textures.woodDeckBump}
              bumpScale={0.04}
              roughness={0.58}
            />
          </mesh>

          {/* Cyberpunk Cyan Neon Trim Line along L2 Balcony Edge */}
          <mesh position={[0, FLOOR_2_Y - 0.25, 6.2]}>
            <boxGeometry args={[28.6, 0.075, 0.09]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={cyanNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>

          <mesh position={[0, FLOOR_2_Y + 1.9, -10]} castShadow receiveShadow>
            <boxGeometry args={[28.2, 3.82, 0.34]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.03}
              roughness={0.72}
            />
          </mesh>

          {/* GIANT 19m High-Res Global Operations Command Wall + Cyber Neon Frame */}
          <group position={[0, FLOOR_2_Y + 1.95, -9.76]}>
            <mesh castShadow>
              <boxGeometry args={[18.8, 2.75, 0.16]} />
              <meshStandardMaterial color="#0d1320" metalness={0.65} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[18.3, 2.48]} />
              <meshStandardMaterial
                map={textures.commandWallScreen}
                emissiveMap={textures.commandWallScreen}
                emissive="#ffffff"
                emissiveIntensity={isNight ? 1.15 : isSunset ? 0.85 : 0.55}
                roughness={0.2}
              />
            </mesh>
            {/* Cyan Top & Magenta Bottom Cyber Glow Frame on Control Wall */}
            <mesh position={[0, 1.4, 0.1]}>
              <boxGeometry args={[18.8, 0.05, 0.05]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#22d3ee"
                emissiveIntensity={isNight ? 2.2 : isSunset ? 1.1 : 0.35}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, -1.4, 0.1]}>
              <boxGeometry args={[18.8, 0.05, 0.05]} />
              <meshStandardMaterial
                color="#e879f9"
                emissive="#e879f9"
                emissiveIntensity={isNight ? 2.0 : isSunset ? 0.95 : 0.25}
                toneMapped={false}
              />
            </mesh>
          </group>

          {/* L2 Curtain Wall Fine Horizontal Transom + Extra Planters */}
          <mesh position={[0, FLOOR_2_Y + 2.25, 4.04]}>
            <boxGeometry args={[27.2, 0.06, 0.08]} />
            <meshStandardMaterial color="#252c36" metalness={0.75} roughness={0.3} />
          </mesh>
          <IndoorPlanter position={[-6.4, FLOOR_2_Y, 2.5]} />
          <IndoorPlanter position={[6.4, FLOOR_2_Y, 2.5]} />

          {/* Compact High-Tech Server Cabinet tucked cleanly in Rear-Left Corner */}
          <group position={[-13.0, FLOOR_2_Y + 1.15, -9.1]}>
            <mesh castShadow>
              <boxGeometry args={[0.92, 2.25, 1.1]} />
              <meshStandardMaterial
                color="#1a2230"
                metalness={0.68}
                roughness={0.32}
              />
            </mesh>
            {[-0.6, -0.1, 0.4, 0.8].map((ly, li) => (
              <mesh key={li} position={[0.47, ly, 0]}>
                <boxGeometry args={[0.02, 0.05, 0.82]} />
                <meshStandardMaterial
                  color={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                  emissive={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                  emissiveIntensity={1.6}
                />
              </mesh>
            ))}
          </group>

          {/* WEST WING (BELAKANG KIRI) ARTISAN COFFEE & LOUNGE BAR (X = -12.2) */}
          <group position={[-12.2, FLOOR_2_Y, -4.6]}>
            <mesh position={[-0.2, 0.54, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.06, 4.8]} />
              <meshStandardMaterial color="#875d39" roughness={0.48} />
            </mesh>
            <mesh position={[-0.2, 1.09, 0]}>
              <boxGeometry args={[1.18, 0.06, 4.9]} />
              <meshStandardMaterial map={textures.marbleTile} roughness={0.2} />
            </mesh>
            {/* Artisan Espresso Machine */}
            <mesh position={[-0.25, 1.38, -0.8]} castShadow>
              <boxGeometry args={[0.52, 0.52, 0.68]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.2} />
            </mesh>
            {/* Pastry Display Dome */}
            <mesh position={[-0.22, 1.24, 0.9]}>
              <sphereGeometry args={[0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.45}
                roughness={0.08}
              />
            </mesh>
            {/* Counter Coffee Cups */}
            {[-1.3, 0, 1.3].map((cz, ci) => (
              <group key={`wbar-cup-${ci}`} position={[0.28, 1.17, cz]}>
                <mesh>
                  <cylinderGeometry args={[0.05, 0.042, 0.09, 10]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} />
                </mesh>
                <mesh position={[0, 0.04, 0]}>
                  <cylinderGeometry args={[0.043, 0.043, 0.015, 10]} />
                  <meshStandardMaterial color="#3b1f0e" roughness={0.2} />
                </mesh>
              </group>
            ))}
            {/* 3 Comfortable West Coffee Bar Lounge Chairs (World X = -11.35, Facing West -X) */}
            {[-1.3, 0, 1.3].map((sz, i) => (
              <group key={i} position={[0.85, 0, sz]}>
                <mesh position={[0, 0.24, 0]}>
                  <cylinderGeometry args={[0.04, 0.06, 0.48, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
                </mesh>
                <mesh position={[0, 0.02, 0]}>
                  <cylinderGeometry args={[0.24, 0.24, 0.03, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.49, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.48, 0.08, 0.48]} />
                  <meshStandardMaterial color="#5c4033" roughness={0.76} />
                </mesh>
                {/* Backrest on Right (+X) so Seated Agent Faces West (-X) Coffee Bar */}
                <mesh position={[0.22, 0.72, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.44, 0.46]} />
                  <meshStandardMaterial color="#4a3328" roughness={0.78} />
                </mesh>
              </group>
            ))}
          </group>

          {/* East Wing Espresso & Collaboration Bar (X = 12.2) */}
          <group position={[12.2, FLOOR_2_Y, -4.6]}>
            <mesh position={[0.2, 0.54, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.06, 4.8]} />
              <meshStandardMaterial color="#875d39" roughness={0.48} />
            </mesh>
            <mesh position={[0.2, 1.09, 0]}>
              <boxGeometry args={[1.18, 0.06, 4.9]} />
              <meshStandardMaterial map={textures.marbleTile} roughness={0.2} />
            </mesh>
            {/* Espresso Machine */}
            <mesh position={[0.25, 1.38, -0.8]} castShadow>
              <boxGeometry args={[0.52, 0.52, 0.68]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.2} />
            </mesh>
            {/* Coffee Cups & Pastry Display Dome */}
            <mesh position={[0.22, 1.24, 0.9]}>
              <sphereGeometry args={[0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.45}
                roughness={0.08}
              />
            </mesh>
            {/* Espresso Counter Coffee Cups */}
            {[-1.3, 0, 1.3].map((cz, ci) => (
              <group key={`bar-cup-${ci}`} position={[-0.28, 1.17, cz]}>
                <mesh>
                  <cylinderGeometry args={[0.05, 0.042, 0.09, 10]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} />
                </mesh>
                <mesh position={[0, 0.04, 0]}>
                  <cylinderGeometry args={[0.043, 0.043, 0.015, 10]} />
                  <meshStandardMaterial color="#3b1f0e" roughness={0.2} />
                </mesh>
              </group>
            ))}
            {/* 3 Comfortable Espresso Bar Lounge Chairs (Seated Height for Idle Staff) */}
            {[-1.3, 0, 1.3].map((sz, i) => (
              <group key={i} position={[-0.85, 0, sz]}>
                <mesh position={[0, 0.24, 0]}>
                  <cylinderGeometry args={[0.04, 0.06, 0.48, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
                </mesh>
                <mesh position={[0, 0.02, 0]}>
                  <cylinderGeometry args={[0.24, 0.24, 0.03, 12]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
                </mesh>
                {/* Seat Cushion at Y=0.49 */}
                <mesh position={[0, 0.49, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.48, 0.08, 0.48]} />
                  <meshStandardMaterial color="#5c4033" roughness={0.76} />
                </mesh>
                {/* Low Curved Backrest on Left (-X) so Agent Sits Facing +X Counter */}
                <mesh position={[-0.22, 0.72, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.44, 0.46]} />
                  <meshStandardMaterial color="#4a3328" roughness={0.78} />
                </mesh>
              </group>
            ))}
          </group>

          {/* OUTDOOR PANORAMIC VIEW BALCONY LOUNGE CHAIRS (Z = 4.95, Facing South toward Pool & Skyline!) */}
          {[-5.5, -1.8, 1.8, 5.5].map((bx, idx) => (
            <group key={`l2-balcony-seat-${idx}`} position={[bx, FLOOR_2_Y, 4.95]}>
              {/* Outdoor Resort Teak & Cushioned Lounge Armchair */}
              <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.62, 0.1, 0.56]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.82} />
              </mesh>
              {/* Backrest on North Side (-Z) so Seated Agent Faces South (+Z) View */}
              <mesh position={[0, 0.76, -0.24]} castShadow>
                <boxGeometry args={[0.62, 0.56, 0.09]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
              </mesh>
              {/* Teak Armrests */}
              {[-0.28, 0.28].map((ax, ai) => (
                <mesh key={ai} position={[ax, 0.62, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.22, 0.52]} />
                  <meshStandardMaterial color="#8b5e3c" roughness={0.58} />
                </mesh>
              ))}
              {/* 4 Tapered Teak Legs */}
              {[
                [-0.24, -0.22],
                [0.24, -0.22],
                [-0.24, 0.22],
                [0.24, 0.22],
              ].map(([lx, lz], li) => (
                <mesh key={li} position={[lx, 0.22, lz]}>
                  <cylinderGeometry args={[0.026, 0.02, 0.44, 8]} />
                  <meshStandardMaterial color="#7a5130" roughness={0.55} />
                </mesh>
              ))}
            </group>
          ))}
          {/* 2 Round Balcony Coffee Tables between Scenic Chairs */}
          {[-3.65, 3.65].map((tx, ti) => (
            <group key={`l2-balcony-table-${ti}`} position={[tx, FLOOR_2_Y, 5.1]}>
              <mesh position={[0, 0.28, 0]}>
                <cylinderGeometry args={[0.032, 0.04, 0.56, 10]} />
                <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.015, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.03, 12]} />
                <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.57, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.36, 0.36, 0.04, 18]} />
                <meshStandardMaterial color="#9a6c43" roughness={0.44} />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.08, 0.065, 0.014, 12]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.25} />
              </mesh>
            </group>
          ))}

          {/* Side Walls & Timber Louver Fins */}
          {[-14, 14].map((x, idx) => (
            <mesh key={idx} position={[x, FLOOR_2_Y + 1.9, -6.2]} castShadow receiveShadow>
              <boxGeometry args={[0.34, 3.82, 7.6]} />
              <meshStandardMaterial
                map={textures.stuccoWall}
                bumpMap={textures.stuccoBump}
                bumpScale={0.03}
                roughness={0.72}
              />
            </mesh>
          ))}

          {timberFins.map((fx, i) => (
            <mesh key={i} position={[fx, FLOOR_2_Y + 1.9, 4.18]} castShadow>
              <boxGeometry args={[0.12, 3.74, 0.42]} />
              <meshStandardMaterial color="#8f5d34" roughness={0.62} />
            </mesh>
          ))}

          {frontColumnsX.map((cx, i) => (
            <mesh key={i} position={[cx, FLOOR_2_Y + 1.9, 4.02]} castShadow>
              <boxGeometry args={[0.28, 3.82, 0.28]} />
              <meshStandardMaterial color="#282d35" metalness={0.72} roughness={0.32} />
            </mesh>
          ))}

          {activeFloor !== "l2" && (
            <mesh position={[0, FLOOR_2_Y + 1.9, 4.0]}>
              <boxGeometry args={[27.2, 3.62, 0.07]} />
              <meshPhysicalMaterial
                color="#d8eef8"
                transparent
                opacity={0.18}
                roughness={0.05}
                metalness={0.14}
              />
            </mesh>
          )}

          {/* Cantilevered Front Glass Balcony Railing (at outer balcony edge Z = 6.12) */}
          <mesh position={[0, FLOOR_2_Y + 0.56, 6.12]}>
            <boxGeometry args={[28.4, 1.06, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.26}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, FLOOR_2_Y + 1.1, 6.12]}>
            <boxGeometry args={[28.5, 0.06, 0.1]} />
            <meshStandardMaterial color="#2b313a" metalness={0.75} roughness={0.28} />
          </mesh>

          <IndoorPlanter position={[-12.6, FLOOR_2_Y, 2.4]} />
          <IndoorPlanter position={[12.6, FLOOR_2_Y, 2.4]} />

          {/* Linear Architectural Ceiling Light Bars for L2 */}
          {[-9, -3, 3, 9].map((lx, i) => (
            <mesh key={i} position={[lx, FLOOR_3_Y - 0.18, -3.2]}>
              <boxGeometry args={[4.4, 0.06, 0.18]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#fff3d6"
                emissiveIntensity={interiorLightEmissive}
              />
            </mesh>
          ))}

          {/* L2 Bright Interior Illumination */}
          <pointLight
            position={[-6, FLOOR_2_Y + 3.2, -3.2]}
            color="#fff2dc"
            intensity={isNight ? 18 : isSunset ? 12 : 8}
            distance={24}
          />
          {performanceMode !== "eco" && (
            <pointLight
              position={[6, FLOOR_2_Y + 3.2, -3.2]}
              color="#fff2dc"
              intensity={isNight ? 18 : isSunset ? 12 : 8}
              distance={24}
            />
          )}
        </group>
      )}

      {/* ============================================================
          FLOOR 3 — EXECUTIVE SUITE, BOARDROOM & BOS FAJREZ OFFICE (Y=7.8)
          ============================================================ */}
      {showL3 && (
        <group>
          <mesh
            position={[0, FLOOR_3_Y - 0.14, -2.6]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[28.8, 0.28, 15.6]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.025}
              roughness={0.68}
            />
          </mesh>

          <mesh
            position={[0, FLOOR_3_Y + 0.01, -3.0]}
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[27.8, 0.04, 13.8]} />
            <meshStandardMaterial
              map={textures.marbleTile}
              bumpMap={textures.marbleBump}
              bumpScale={0.025}
              roughness={0.26}
            />
          </mesh>

          {/* Cyberpunk Magenta Neon Trim Line along L3 Cantilever Edge */}
          <mesh position={[0, FLOOR_3_Y - 0.25, 5.26]}>
            <boxGeometry args={[28.6, 0.075, 0.09]} />
            <meshStandardMaterial
              color="#e879f9"
              emissive="#e879f9"
              emissiveIntensity={magentaNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>

          <mesh position={[0, FLOOR_3_Y + 1.85, -10]} castShadow receiveShadow>
            <boxGeometry args={[28.2, 3.72, 0.34]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.03}
              roughness={0.72}
            />
          </mesh>
          {[-14, 14].map((x, idx) => (
            <mesh key={idx} position={[x, FLOOR_3_Y + 1.85, -6.5]} castShadow receiveShadow>
              <boxGeometry args={[0.34, 3.72, 7.0]} />
              <meshStandardMaterial
                map={textures.stuccoWall}
                bumpMap={textures.stuccoBump}
                bumpScale={0.03}
                roughness={0.72}
              />
            </mesh>
          ))}

          {/* Executive Boardroom Wall Presentation Display */}
          <group position={[-4.5, FLOOR_3_Y + 1.9, -9.76]}>
            <mesh>
              <boxGeometry args={[6.2, 2.2, 0.14]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <planeGeometry args={[5.9, 1.96]} />
              <meshStandardMaterial
                map={textures.commandWallScreen}
                emissiveMap={textures.commandWallScreen}
                emissive="#ffffff"
                emissiveIntensity={isNight ? 0.85 : 0.45}
              />
            </mesh>
          </group>

          {timberFins.map((fx, i) => (
            <mesh key={i} position={[fx, FLOOR_3_Y + 1.85, 4.18]} castShadow>
              <boxGeometry args={[0.12, 3.68, 0.42]} />
              <meshStandardMaterial color="#8f5d34" roughness={0.62} />
            </mesh>
          ))}

          {/* Executive Boardroom Table with Open Laptops & 6 Leather Chairs */}
          <group position={[-4.5, FLOOR_3_Y, -3.5]}>
            <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
              <boxGeometry args={[6.4, 0.1, 2.2]} />
              <meshStandardMaterial color="#5e3e24" roughness={0.32} metalness={0.08} />
            </mesh>
            {[-2.2, 2.2].map((px, i) => (
              <mesh key={i} position={[px, 0.38, 0]} castShadow>
                <boxGeometry args={[0.32, 0.74, 1.3]} />
                <meshStandardMaterial color="#252c38" metalness={0.65} roughness={0.35} />
              </mesh>
            ))}
            {/* Open Laptops on Conference Table + 6 Real Ergonomic Leather Executive Chairs */}
            {[-1.8, 0, 1.8].map((cx, i) => (
              <React.Fragment key={i}>
                <mesh position={[cx, 0.85, -0.68]}>
                  <boxGeometry args={[0.38, 0.02, 0.26]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.25} />
                </mesh>
                <mesh position={[cx, 0.85, 0.68]}>
                  <boxGeometry args={[0.38, 0.02, 0.26]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.25} />
                </mesh>
                {/* North-side chair facing South (0) toward table */}
                <ExecutiveLeatherChair position={[cx, 0, -1.52]} rotationY={0} />
                {/* South-side chair facing North (Math.PI) toward table */}
                <ExecutiveLeatherChair position={[cx, 0, 1.52]} rotationY={Math.PI} />
              </React.Fragment>
            ))}
          </group>

          {/* BOS FAJREZ PRIVATE CEO DESK + SKY LOUNGE (East Wing) */}
          <group position={[7.4, FLOOR_3_Y, -4.2]}>
            {/* Executive Walnut & Gold CEO Desk */}
            <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.4, 0.1, 1.35]} />
              <meshStandardMaterial color="#5a391f" roughness={0.34} />
            </mesh>
            <mesh position={[0, 0.39, 0.64]}>
              <boxGeometry args={[3.3, 0.72, 0.08]} />
              <meshStandardMaterial color="#202632" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.4, 0.69]}>
              <boxGeometry args={[3.1, 0.06, 0.02]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Ultrawide CEO Display */}
            <mesh position={[0, 1.18, -0.25]}>
              <boxGeometry args={[1.45, 0.54, 0.05]} />
              <meshStandardMaterial color="#0f172a" roughness={0.25} />
            </mesh>
            <mesh position={[0, 1.18, -0.22]}>
              <planeGeometry args={[1.38, 0.48]} />
              <meshStandardMaterial
                map={textures.monitorScreen}
                emissiveMap={textures.monitorScreen}
                emissive="#ffffff"
                emissiveIntensity={0.65}
              />
            </mesh>
            {/* Real Ergonomic Gold-Trimmed CEO Executive Leather Chair */}
            <ExecutiveLeatherChair position={[0, 0, -1.05]} rotationY={0} isCeo />
            {/* Realistic Cushioned Sky Lounge Sofa facing balcony */}
            <group position={[0, 0, 3.2]}>
              <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.2, 0.28, 0.96]} />
                <meshStandardMaterial color="#cfc6b8" roughness={0.86} />
              </mesh>
              {/* 3 Seat Cushions */}
              {[-1.3, 0, 1.3].map((sx, si) => (
                <mesh key={si} position={[sx, 0.42, 0.04]} castShadow receiveShadow>
                  <boxGeometry args={[1.24, 0.12, 0.84]} />
                  <meshStandardMaterial color="#e7e1d7" roughness={0.84} />
                </mesh>
              ))}
              {/* Sofa Backrest */}
              <mesh position={[0, 0.68, -0.4]} castShadow>
                <boxGeometry args={[4.2, 0.56, 0.18]} />
                <meshStandardMaterial color="#d6cec0" roughness={0.85} />
              </mesh>
              {/* Side Armrests */}
              {[-2.02, 2.02].map((ax, ai) => (
                <mesh key={ai} position={[ax, 0.52, 0]} castShadow>
                  <boxGeometry args={[0.18, 0.44, 0.96]} />
                  <meshStandardMaterial color="#cfc6b8" roughness={0.85} />
                </mesh>
              ))}
            </group>
            <IndoorPlanter position={[4.2, 0, -2.0]} />
          </group>

          {frontColumnsX.map((cx, i) => (
            <mesh key={i} position={[cx, FLOOR_3_Y + 1.85, 4.02]} castShadow>
              <boxGeometry args={[0.28, 3.74, 0.28]} />
              <meshStandardMaterial color="#282d35" metalness={0.72} roughness={0.32} />
            </mesh>
          ))}
          {activeFloor !== "l3" && (
            <mesh position={[0, FLOOR_3_Y + 1.85, 4.0]}>
              <boxGeometry args={[27.2, 3.55, 0.07]} />
              <meshPhysicalMaterial
                color="#d8eef8"
                transparent
                opacity={0.18}
                roughness={0.05}
                metalness={0.14}
              />
            </mesh>
          )}

          {/* Sky Balcony Glass Balustrade */}
          <mesh position={[0, FLOOR_3_Y + 0.56, 5.18]}>
            <boxGeometry args={[28.4, 1.06, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.26}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, FLOOR_3_Y + 1.1, 5.18]}>
            <boxGeometry args={[28.5, 0.06, 0.1]} />
            <meshStandardMaterial color="#2b313a" metalness={0.75} roughness={0.28} />
          </mesh>

          {/* L3 Luxury Champagne-Gold Ceiling Cove Light Strips + Curtain Wall Transom + Planters */}
          {[-4.5, 7.4].map((lx, i) => (
            <mesh key={`l3-ceil-${i}`} position={[lx, FLOOR_3_Y + 3.45, -3.6]}>
              <boxGeometry args={[6.4, 0.06, 0.22]} />
              <meshStandardMaterial
                color="#fff6db"
                emissive="#facc15"
                emissiveIntensity={isNight ? 2.2 : isSunset ? 1.3 : 0.7}
                toneMapped={!isNight}
              />
            </mesh>
          ))}
          <mesh position={[0, FLOOR_3_Y + 2.2, 4.04]}>
            <boxGeometry args={[27.2, 0.06, 0.08]} />
            <meshStandardMaterial color="#252c36" metalness={0.75} roughness={0.3} />
          </mesh>
          <IndoorPlanter position={[-12.4, FLOOR_3_Y, 2.2]} />
          <IndoorPlanter position={[0.4, FLOOR_3_Y, 2.2]} />

          {/* Luxury Walnut & Gold Feature Backdrop behind CEO Suite */}
          <mesh position={[7.4, FLOOR_3_Y + 1.85, -9.76]}>
            <boxGeometry args={[6.8, 3.2, 0.14]} />
            <meshStandardMaterial color="#4a301a" roughness={0.5} />
          </mesh>
          <mesh position={[7.4, FLOOR_3_Y + 1.85, -9.67]}>
            <boxGeometry args={[6.4, 0.06, 0.04]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 1.8 : 0.6}
            />
          </mesh>

          <pointLight
            position={[0, FLOOR_3_Y + 3.0, -3.2]}
            color="#fff0d8"
            intensity={isNight ? 18 : isSunset ? 11 : 7}
            distance={24}
          />
        </group>
      )}

      {/* ============================================================
          ROOFTOP — HELIPAD, BADMINTON COURT, NEON TRIM & LARGE GLOWING SIGNAGE (Y=11.6)
          ============================================================ */}
      {showRoof && (
        <group>
          {/* Vertical Corner Neon Edge Bars spanning Full Building Height (West Cyan, East Magenta) */}
          <mesh position={[-14.12, 6.0, 4.2]}>
            <boxGeometry args={[0.09, 11.4, 0.09]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={cyanNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>
          <mesh position={[14.12, 6.0, 4.2]}>
            <boxGeometry args={[0.09, 11.4, 0.09]} />
            <meshStandardMaterial
              color="#e879f9"
              emissive="#e879f9"
              emissiveIntensity={magentaNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>

          <mesh
            position={[0, 11.58, -2.5]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[29.4, 0.42, 16.0]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.025}
              roughness={0.68}
            />
          </mesh>

          <mesh position={[0, 11.78, 5.56]} castShadow>
            <boxGeometry args={[29.5, 0.56, 0.18]} />
            <meshStandardMaterial color="#161c28" metalness={0.72} roughness={0.3} />
          </mesh>

          {/* Rooftop Full-Width Cyberpunk Cyan/Magenta Neon Perimeter Trim */}
          <mesh position={[0, 11.52, 5.64]}>
            <boxGeometry args={[29.6, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#22d3ee"
              emissiveIntensity={cyanNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>
          <mesh position={[0, 12.06, 5.64]}>
            <boxGeometry args={[29.6, 0.06, 0.08]} />
            <meshStandardMaterial
              color="#e879f9"
              emissive="#e879f9"
              emissiveIntensity={magentaNeonIntensity}
              toneMapped={!(isNight || isSunset)}
            />
          </mesh>

          {/* LARGE GLOWING "FAJREZZZ AI OFFICE" ILLUMINATED CROWN SIGNAGE */}
          <group position={[0, 12.62, 5.56]}>
            <mesh castShadow>
              <boxGeometry args={[13.4, 1.18, 0.24]} />
              <meshStandardMaterial color="#0b101c" metalness={0.78} roughness={0.22} />
            </mesh>
            {/* Cyan top neon bar & Magenta bottom neon bar framing the big sign */}
            <mesh position={[0, 0.61, 0.1]}>
              <boxGeometry args={[13.45, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#22d3ee"
                emissiveIntensity={isNight ? 2.6 : isSunset ? 1.4 : 0.45}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, -0.61, 0.1]}>
              <boxGeometry args={[13.45, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#e879f9"
                emissive="#e879f9"
                emissiveIntensity={isNight ? 2.4 : isSunset ? 1.3 : 0.4}
                toneMapped={false}
              />
            </mesh>
            <Text
              position={[0, 0, 0.15]}
              fontSize={0.78}
              color={isNight ? "#e0f9ff" : "#ffffff"}
              letterSpacing={0.14}
              anchorX="center"
              anchorY="middle"
              outlineWidth={isNight ? 0.035 : 0.015}
              outlineColor={isNight ? "#22d3ee" : "#0f172a"}
            >
              FAJREZZZ AI OFFICE
              <meshStandardMaterial
                color="#ffffff"
                emissive={isNight ? "#67e8f9" : isSunset ? "#fde68a" : "#ffffff"}
                emissiveIntensity={isNight ? 2.2 : isSunset ? 1.15 : 0.25}
                toneMapped={!(isNight || isSunset)}
              />
            </Text>
          </group>

          <mesh position={[0, 12.34, 5.38]}>
            <boxGeometry args={[28.8, 1.05, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.26}
              roughness={0.08}
            />
          </mesh>

          {/* WEST ROOF: Architectural Helipad + Corner Beacon Lights */}
          <group position={[-7.5, 11.81, -2.6]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[4.4, 32]} />
              <meshStandardMaterial color="#374151" roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[3.65, 4.0, 32]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#facc15"
                emissiveIntensity={isNight ? 1.6 : 0.25}
              />
            </mesh>
            <mesh position={[-0.95, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.45, 2.6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            <mesh position={[0.95, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.45, 2.6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.9, 0.45]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            {/* 4 Helipad Beacon Lights */}
            {[
              [-4.2, 0.12, -4.2],
              [4.2, 0.12, -4.2],
              [-4.2, 0.12, 4.2],
              [4.2, 0.12, 4.2],
            ].map((bp, bi) => (
              <mesh key={bi} position={bp as [number, number, number]}>
                <cylinderGeometry args={[0.14, 0.16, 0.22, 10]} />
                <meshStandardMaterial
                  color="#34d399"
                  emissive="#10b981"
                  emissiveIntensity={isNight ? 2.8 : 0.9}
                />
              </mesh>
            ))}
          </group>

          {/* LUXURY HELICOPTER ON HELIPAD + REAL BADMINTON COURT, FLOODLIGHTS & PLAYERS */}
          <RooftopAttractions
            isNight={isNight}
            isSunset={isSunset}
            isSimulationRunning={isSimulationRunning}
          />

          {/* Rooftop Sky Lounge Sofa Terrace (Front Center) */}
          <group position={[0, 11.8, 3.4]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[3.6, 0.44, 0.95]} />
              <meshStandardMaterial color="#f4efe6" roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.62, -0.38]} castShadow>
              <boxGeometry args={[3.6, 0.44, 0.22]} />
              <meshStandardMaterial color="#e6dfd2" roughness={0.86} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
