"use client";

import React, { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
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
  const glow = isNight ? 2.6 : isSunset ? 1.5 : 0.7;
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
        <meshStandardMaterial color="#e6e1d8" roughness={0.65} />
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
    </group>
  );
}

export function OfficeArchitecture({
  activeFloor,
  performanceMode,
  lightingPreset,
  onFocusPoint,
}: OfficeArchitectureProps) {
  const textures = useMemo(() => getRealisticTextures(), []);

  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";
  const interiorLightEmissive = isNight ? 2.5 : isSunset ? 1.55 : 0.85;
  const facadeGlow = isNight ? 1.9 : isSunset ? 0.9 : 0.15;

  const showL2 = activeFloor !== "l1";
  const showL3 = activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof";
  const showRoof = activeFloor === "all" || activeFloor === "roof";

  const handleSurfaceDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, e.point.y + 0.55, e.point.z]);
    }
  };

  // Architectural column positions across the grand 28m span
  const frontColumnsX = [-13.7, -6.9, 0, 6.9, 13.7];
  const timberFins = [-13.2, -12.6, -12.0, -11.4, 11.4, 12.0, 12.6, 13.2];

  return (
    <group>
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
            roughness={0.28}
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
            roughness={0.74}
          />
        </mesh>

        {/* Side Architectural Structural Walls (West X=-14, East X=14) */}
        {[-14, 14].map((x, idx) => (
          <group key={idx}>
            <mesh position={[x, 2.02, -5.2]} castShadow receiveShadow>
              <boxGeometry args={[0.34, 3.7, 9.6]} />
              <meshStandardMaterial
                map={textures.stuccoWall}
                bumpMap={textures.stuccoBump}
                bumpScale={0.03}
                roughness={0.74}
              />
            </mesh>
            {/* Side glass windows */}
            <mesh position={[x, 2.02, 1.8]}>
              <boxGeometry args={[0.08, 3.55, 4.4]} />
              <meshPhysicalMaterial
                color="#d8ecf8"
                transparent
                opacity={0.28}
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
              opacity={0.24}
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

        {/* Warm Marble Reception Desk */}
        <group position={[0, FLOOR_1_Y, -5.2]}>
          <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 1.12, 1.15]} />
            <meshStandardMaterial
              map={textures.marbleTile}
              roughness={0.22}
              metalness={0.08}
            />
          </mesh>
          {/* Warm oak top counter & gold trim */}
          <mesh position={[0, 1.14, 0.05]} castShadow>
            <boxGeometry args={[5.55, 0.08, 1.24]} />
            <meshStandardMaterial color="#8f633b" roughness={0.48} />
          </mesh>
          <mesh position={[0, 0.58, 0.59]}>
            <boxGeometry args={[5.2, 0.06, 0.03]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.85}
              roughness={0.2}
              emissive="#f59e0b"
              emissiveIntensity={isNight ? 1.2 : 0.25}
            />
          </mesh>
        </group>

        {/* Wood-slat feature wall behind Reception + Brand Signage */}
        <mesh position={[0, 2.08, -9.72]} castShadow>
          <boxGeometry args={[9.4, 3.2, 0.18]} />
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
          color="#cbd5e1"
          letterSpacing={0.2}
          anchorX="center"
          anchorY="middle"
        >
          GLOBAL HEADQUARTERS · SIMULATION MODE
        </Text>

        {/* West & East Lobby Waiting Lounge Sets */}
        {[-8.4, 8.4].map((lx, idx) => (
          <group key={idx} position={[lx, FLOOR_1_Y, -1.6]}>
            <mesh position={[0, 0.26, -1.25]} castShadow receiveShadow>
              <boxGeometry args={[3.4, 0.48, 0.96]} />
              <meshStandardMaterial color="#3c4654" roughness={0.84} />
            </mesh>
            <mesh position={[0, 0.64, -1.62]} castShadow>
              <boxGeometry args={[3.4, 0.48, 0.24]} />
              <meshStandardMaterial color="#333c49" roughness={0.84} />
            </mesh>
            <mesh position={[0, 0.24, 0.35]} castShadow receiveShadow>
              <boxGeometry args={[1.9, 0.38, 0.95]} />
              <meshStandardMaterial color="#8b623c" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.02, -0.2]} receiveShadow>
              <boxGeometry args={[4.4, 0.03, 3.4]} />
              <meshStandardMaterial color="#dcd6cb" roughness={0.94} />
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
              <meshStandardMaterial color="#9a6e45" roughness={0.58} />
            </mesh>
          ))}
        </group>

        {/* Indoor Olive Planters */}
        <IndoorPlanter position={[-5.4, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[5.4, FLOOR_1_Y, 2.8]} />
        <IndoorPlanter position={[-12.2, FLOOR_1_Y, -8.2]} />

        {/* Warm Lobby Pendant Lamps */}
        <PendantLight position={[-6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[0, 3.22, -4.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />

        {/* Lobby Interior Point Light */}
        {(isNight || isSunset || performanceMode !== "eco") && (
          <pointLight
            position={[0, 3.2, -2.5]}
            color="#ffe6c2"
            intensity={isNight ? 18 : isSunset ? 10 : 5}
            distance={20}
          />
        )}
      </group>

      {/* ============================================================
          FLOOR 2 — GRAND 8-WORKSTATION OPERATIONS HALL (Y=3.9)
          ============================================================ */}
      {showL2 && (
        <group>
          {/* Main L2 Architectural Slab + Cantilevered Front Terrace */}
          <mesh
            position={[0, FLOOR_2_Y - 0.14, -2.5]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[28.8, 0.28, 15.8]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.025}
              roughness={0.68}
            />
          </mesh>

          {/* Warm Oak Plank Interior Floor Surface */}
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
              roughness={0.52}
            />
          </mesh>

          {/* Warm LED architectural under-slab glow strip */}
          <mesh position={[0, FLOOR_2_Y - 0.27, 5.28]}>
            <boxGeometry args={[28.4, 0.05, 0.08]} />
            <meshStandardMaterial
              color="#fff1d6"
              emissive="#ffd28a"
              emissiveIntensity={facadeGlow}
            />
          </mesh>

          {/* L2 Rear Wall (Z = -10) */}
          <mesh position={[0, FLOOR_2_Y + 1.9, -10]} castShadow receiveShadow>
            <boxGeometry args={[28.2, 3.82, 0.34]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.03}
              roughness={0.72}
            />
          </mesh>

          {/* GIANT 20m High-Res Global Operations Command Wall */}
          <group position={[0, FLOOR_2_Y + 1.95, -9.76]}>
            <mesh castShadow>
              <boxGeometry args={[18.8, 2.75, 0.16]} />
              <meshStandardMaterial color="#121824" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[18.3, 2.48]} />
              <meshStandardMaterial
                map={textures.commandWallScreen}
                emissiveMap={textures.commandWallScreen}
                emissive="#ffffff"
                emissiveIntensity={isNight ? 0.9 : 0.45}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* West Wing Glass Server Room (X = -12.1) */}
          <group position={[-12.2, FLOOR_2_Y, -6.4]}>
            {/* Glass partition */}
            <mesh position={[1.45, 1.85, 0]}>
              <boxGeometry args={[0.06, 3.65, 6.4]} />
              <meshPhysicalMaterial
                color="#bae6fd"
                transparent
                opacity={0.22}
                roughness={0.06}
              />
            </mesh>
            {/* 3 High-Tech Server Racks */}
            {[-2.0, 0, 2.0].map((rz, idx) => (
              <group key={idx} position={[0, 1.15, rz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.92, 2.25, 1.15]} />
                  <meshStandardMaterial
                    color="#1a2230"
                    metalness={0.68}
                    roughness={0.32}
                  />
                </mesh>
                {/* Status LED indicators */}
                {[-0.6, -0.1, 0.4, 0.8].map((ly, li) => (
                  <mesh key={li} position={[0.47, ly, 0]}>
                    <boxGeometry args={[0.02, 0.05, 0.85]} />
                    <meshStandardMaterial
                      color={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                      emissive={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                      emissiveIntensity={1.6}
                    />
                  </mesh>
                ))}
              </group>
            ))}
          </group>

          {/* East Wing Espresso & Collaboration Lounge (X = 12.1) */}
          <group position={[12.2, FLOOR_2_Y, -5.8]}>
            {/* Espresso counter */}
            <mesh position={[0.2, 0.54, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.06, 4.6]} />
              <meshStandardMaterial color="#875d39" roughness={0.5} />
            </mesh>
            <mesh position={[0.2, 1.09, 0]}>
              <boxGeometry args={[1.18, 0.06, 4.7]} />
              <meshStandardMaterial map={textures.marbleTile} roughness={0.22} />
            </mesh>
            {/* Espresso Machine */}
            <mesh position={[0.25, 1.38, -0.6]} castShadow>
              <boxGeometry args={[0.52, 0.52, 0.68]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.2} />
            </mesh>
            {/* High bar stools */}
            {[-1.3, 0, 1.3].map((sz, i) => (
              <group key={i} position={[-0.78, 0, sz]}>
                <mesh position={[0, 0.36, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.72, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.74, 0]} castShadow>
                  <cylinderGeometry args={[0.22, 0.22, 0.08, 12]} />
                  <meshStandardMaterial color="#4b5563" roughness={0.78} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Side Walls & Timber Architectural Louver Fins */}
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

          {/* Architectural Vertical Cedar Louver Fins (Exterior Front Corners) */}
          {timberFins.map((fx, i) => (
            <mesh key={i} position={[fx, FLOOR_2_Y + 1.9, 4.18]} castShadow>
              <boxGeometry args={[0.12, 3.74, 0.42]} />
              <meshStandardMaterial color="#8f5d34" roughness={0.62} />
            </mesh>
          ))}

          {/* Structural Bronze Mullions (L2 Front Glass) */}
          {frontColumnsX.map((cx, i) => (
            <mesh key={i} position={[cx, FLOOR_2_Y + 1.9, 4.02]} castShadow>
              <boxGeometry args={[0.28, 3.82, 0.28]} />
              <meshStandardMaterial color="#282d35" metalness={0.72} roughness={0.32} />
            </mesh>
          ))}

          {/* Front Panoramic Glass Curtain (only when viewing full building; hidden in L2 cutaway so desks are ultra clear!) */}
          {activeFloor !== "l2" && (
            <mesh position={[0, FLOOR_2_Y + 1.9, 4.0]}>
              <boxGeometry args={[27.2, 3.62, 0.07]} />
              <meshPhysicalMaterial
                color="#d8eef8"
                transparent
                opacity={0.2}
                roughness={0.05}
                metalness={0.14}
              />
            </mesh>
          )}

          {/* Cantilevered Front Glass Balcony Railing (Z = 5.25) */}
          <mesh position={[0, FLOOR_2_Y + 0.56, 5.28]}>
            <boxGeometry args={[28.4, 1.06, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.28}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, FLOOR_2_Y + 1.1, 5.28]}>
            <boxGeometry args={[28.5, 0.06, 0.1]} />
            <meshStandardMaterial color="#2b313a" metalness={0.75} roughness={0.28} />
          </mesh>

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

          {/* L2 Interior Lights */}
          {(isNight || isSunset || performanceMode !== "eco") && (
            <>
              <pointLight
                position={[-6, FLOOR_2_Y + 3.2, -3.2]}
                color="#fff1d8"
                intensity={isNight ? 18 : isSunset ? 11 : 6}
                distance={22}
              />
              <pointLight
                position={[6, FLOOR_2_Y + 3.2, -3.2]}
                color="#fff1d8"
                intensity={isNight ? 18 : isSunset ? 11 : 6}
                distance={22}
              />
            </>
          )}
        </group>
      )}

      {/* ============================================================
          FLOOR 3 — EXECUTIVE DIRECTOR SUITE & BOARDROOM (Y=7.8)
          ============================================================ */}
      {showL3 && (
        <group>
          {/* L3 Architectural Slab + Cantilevered Sky Terrace */}
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

          {/* Polished Light Oak & Marble Floor */}
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
              roughness={0.28}
            />
          </mesh>

          {/* Warm LED architectural under-slab accent */}
          <mesh position={[0, FLOOR_3_Y - 0.27, 5.18]}>
            <boxGeometry args={[28.4, 0.05, 0.08]} />
            <meshStandardMaterial
              color="#fff1d6"
              emissive="#ffd28a"
              emissiveIntensity={facadeGlow}
            />
          </mesh>

          {/* Rear & Side Architectural Walls */}
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

          {/* Vertical Timber Louvers L3 */}
          {timberFins.map((fx, i) => (
            <mesh key={i} position={[fx, FLOOR_3_Y + 1.85, 4.18]} castShadow>
              <boxGeometry args={[0.12, 3.68, 0.42]} />
              <meshStandardMaterial color="#8f5d34" roughness={0.62} />
            </mesh>
          ))}

          {/* Executive Boardroom Table & Chairs (West/Center) */}
          <group position={[-4.5, FLOOR_3_Y, -3.5]}>
            {/* Grand Walnut & Marble Conference Table */}
            <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
              <boxGeometry args={[6.4, 0.1, 2.2]} />
              <meshStandardMaterial color="#5e3e24" roughness={0.34} metalness={0.08} />
            </mesh>
            {[-2.2, 2.2].map((px, i) => (
              <mesh key={i} position={[px, 0.38, 0]} castShadow>
                <boxGeometry args={[0.32, 0.74, 1.3]} />
                <meshStandardMaterial color="#252c38" metalness={0.65} roughness={0.35} />
              </mesh>
            ))}
            {/* 6 Executive Leather Chairs */}
            {[-2.0, 0, 2.0].map((cx, i) => (
              <React.Fragment key={i}>
                <mesh position={[cx, 0.56, -1.52]} castShadow>
                  <boxGeometry args={[0.62, 0.96, 0.58]} />
                  <meshStandardMaterial color="#232934" roughness={0.7} />
                </mesh>
                <mesh position={[cx, 0.56, 1.52]} castShadow>
                  <boxGeometry args={[0.62, 0.96, 0.58]} />
                  <meshStandardMaterial color="#232934" roughness={0.7} />
                </mesh>
              </React.Fragment>
            ))}
          </group>

          {/* Executive Sky Lounge & CEO Desk (East Side) */}
          <group position={[7.2, FLOOR_3_Y, -3.5]}>
            <mesh position={[0, 0.3, -1.6]} castShadow receiveShadow>
              <boxGeometry args={[4.4, 0.52, 1.05]} />
              <meshStandardMaterial color="#dfd8cc" roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.68, -2.02]} castShadow>
              <boxGeometry args={[4.4, 0.5, 0.24]} />
              <meshStandardMaterial color="#d3cbbe" roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.26, 0.2]} castShadow receiveShadow>
              <boxGeometry args={[2.1, 0.38, 1.05]} />
              <meshStandardMaterial color="#7d5634" roughness={0.42} />
            </mesh>
            <IndoorPlanter position={[4.2, 0, -2.2]} />
          </group>

          {/* Columns & Panoramic Glass */}
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
                opacity={0.2}
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
              opacity={0.28}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, FLOOR_3_Y + 1.1, 5.18]}>
            <boxGeometry args={[28.5, 0.06, 0.1]} />
            <meshStandardMaterial color="#2b313a" metalness={0.75} roughness={0.28} />
          </mesh>

          {/* L3 Warm Lighting */}
          {(isNight || isSunset) && (
            <pointLight
              position={[0, FLOOR_3_Y + 3.0, -3.2]}
              color="#ffe9c8"
              intensity={isNight ? 16 : 9}
              distance={22}
            />
          )}
        </group>
      )}

      {/* ============================================================
          ROOFTOP — HELIPAD, PADEL COURT & ARCHITECTURAL CROWN (Y=11.6)
          ============================================================ */}
      {showRoof && (
        <group>
          {/* Grand Cantilevered Roof Deck */}
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

          {/* Architectural Dark Crown Fascia + Brand Nameplate */}
          <mesh position={[0, 11.78, 5.56]} castShadow>
            <boxGeometry args={[29.5, 0.56, 0.18]} />
            <meshStandardMaterial color="#1f2530" metalness={0.65} roughness={0.34} />
          </mesh>
          <Text
            position={[0, 11.8, 5.68]}
            fontSize={0.44}
            color="#f8fafc"
            letterSpacing={0.18}
            anchorX="center"
            anchorY="middle"
          >
            FAJREZZZ AI OFFICE
          </Text>

          {/* Rooftop Perimeter Glass Balustrade */}
          <mesh position={[0, 12.34, 5.38]}>
            <boxGeometry args={[28.8, 1.05, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.28}
              roughness={0.08}
            />
          </mesh>

          {/* WEST ROOF: Architectural Helipad */}
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
                emissiveIntensity={isNight ? 1.5 : 0.2}
              />
            </mesh>
            {/* H marking */}
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
          </group>

          {/* EAST ROOF: Executive Sky Padel Court & Solar Pergola */}
          <group position={[6.5, 11.81, -2.6]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[11.2, 7.2]} />
              <meshStandardMaterial color="#1d5f8f" roughness={0.78} />
            </mesh>
            {/* Court white boundary lines */}
            <mesh position={[0, 0.015, -3.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10.4, 0.12]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[0, 0.015, 3.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10.4, 0.12]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[-5.2, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 6.72]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[5.2, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, 6.72]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {/* Center court net */}
            <mesh position={[0, 0.48, 0]}>
              <boxGeometry args={[0.05, 0.92, 6.6]} />
              <meshStandardMaterial color="#e2e8f0" transparent opacity={0.62} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
