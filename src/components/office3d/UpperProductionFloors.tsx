"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { RooftopAttractions } from "@/components/office3d/RooftopAttractions";
import {
  FLOOR_1_Y,
  FLOOR_4_Y,
  FLOOR_5_Y,
  ROOF_Y,
} from "@/lib/data/initial-office-data";
import type { FloorView, Vector3Tuple } from "@/types/office";

interface UpperProductionFloorsProps {
  activeFloor: FloorView;
  isNight: boolean;
  isSunset?: boolean;
  isSimulationRunning?: boolean;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

/**
 * Multi-Floor Expansion Module (Section B & D):
 * - Adds Floor 4 (Video Editing & Rendering, Y=11.6) & Floor 5 (Voice, Subtitle & QC, Y=15.4)
 * - Extends the glowing cyan panoramic glass elevator shaft seamlessly from L1 -> L5 -> Roof
 * - Adds the Ground-Floor Cyan Hologram Arrival Portal (inspired by isometric cyber-office reference)
 * - Crowns the tower with the real usable Sky Deck (ROOF_Y = 19.2): "H" helipad + executive
 *   helicopter, BWF badminton court with 2 animated players, glass balustrade, RGB signage
 *   and sky lounge. (RooftopAttractions is mounted here in deck-local coordinates.)
 * - Uses THREE.InstancedMesh for structural columns & ceiling LED strips (minimal draw calls!)
 * - Disposes shared geometries & materials cleanly on unmount (mobile memory safety)
 */
export function UpperProductionFloors({
  activeFloor,
  isNight,
  isSunset = false,
  isSimulationRunning = true,
  onFocusPoint,
}: UpperProductionFloorsProps) {
  const showL4 =
    activeFloor === "all" ||
    activeFloor === "l4" ||
    activeFloor === "l5" ||
    activeFloor === "roof";
  const showL5 =
    activeFloor === "all" || activeFloor === "l5" || activeFloor === "roof";
  const showRoofCap = activeFloor === "all" || activeFloor === "roof";

  // Shared disposable geometries for low memory footprint on Android
  const sharedGeos = useMemo(() => {
    return {
      slab: new THREE.BoxGeometry(27.2, 0.22, 13.8),
      rearWall: new THREE.BoxGeometry(27.2, 3.62, 0.28),
      sideWall: new THREE.BoxGeometry(0.28, 3.62, 13.6),
      glassRailFront: new THREE.BoxGeometry(26.8, 1.05, 0.08),
      handrailFront: new THREE.BoxGeometry(27.0, 0.07, 0.12),
      column: new THREE.BoxGeometry(0.28, 3.6, 0.28),
      ledStrip: new THREE.BoxGeometry(22.0, 0.06, 0.14),
      wallScreen: new THREE.BoxGeometry(4.4, 2.0, 0.08),
    };
  }, []);

  const sharedMats = useMemo(() => {
    return {
      floorSlab: new THREE.MeshStandardMaterial({
        color: "#15233b",
        roughness: 0.42,
        metalness: 0.22,
      }),
      wallDark: new THREE.MeshStandardMaterial({
        color: "#101b30",
        roughness: 0.58,
        metalness: 0.15,
      }),
      glassRail: new THREE.MeshPhysicalMaterial({
        color: "#7dd3fc",
        transparent: true,
        opacity: 0.26,
        roughness: 0.12,
        metalness: 0.1,
      }),
      railMetal: new THREE.MeshStandardMaterial({
        color: "#334155",
        metalness: 0.8,
        roughness: 0.25,
      }),
      columnMat: new THREE.MeshStandardMaterial({
        color: "#1e293b",
        metalness: 0.65,
        roughness: 0.3,
      }),
      cyanGlow: new THREE.MeshStandardMaterial({
        color: "#38bdf8",
        emissive: "#22d3ee",
        emissiveIntensity: 1.35,
        roughness: 0.2,
      }),
      purpleGlow: new THREE.MeshStandardMaterial({
        color: "#c084fc",
        emissive: "#a855f7",
        emissiveIntensity: 1.35,
        roughness: 0.2,
      }),
      emeraldGlow: new THREE.MeshStandardMaterial({
        color: "#34d399",
        emissive: "#10b981",
        emissiveIntensity: 1.35,
        roughness: 0.2,
      }),
      screenDark: new THREE.MeshStandardMaterial({
        color: "#0b172a",
        emissive: "#1d4ed8",
        emissiveIntensity: 0.45,
        roughness: 0.18,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(sharedGeos).forEach((g) => g.dispose());
      Object.values(sharedMats).forEach((m) => m.dispose());
    };
  }, [sharedGeos, sharedMats]);

  // Instanced structural columns across Floor 4 & Floor 5 (1 draw call!)
  const columnsRef = useRef<THREE.InstancedMesh | null>(null);
  const columnPositions = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    const xs = [-13.2, -6.6, 0, 6.6, 13.2];
    const zs = [-9.4, 3.4];
    if (showL4) {
      xs.forEach((x) => zs.forEach((z) => pts.push([x, FLOOR_4_Y + 1.8, z])));
    }
    if (showL5) {
      xs.forEach((x) => zs.forEach((z) => pts.push([x, FLOOR_5_Y + 1.8, z])));
    }
    return pts;
  }, [showL4, showL5]);

  useEffect(() => {
    const mesh = columnsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    columnPositions.forEach(([x, y, z], idx) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.count = columnPositions.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [columnPositions]);

  // Elevator shaft height dynamically matches visible top floor
  const elevatorHeight = showRoofCap
    ? ROOF_Y + 0.4
    : showL5
    ? FLOOR_5_Y + 3.6
    : showL4
    ? FLOOR_4_Y + 3.6
    : 11.4;

  const emissiveBoost = isNight ? 1.6 : 1.05;
  const roofNeon = isNight ? 2.1 : isSunset ? 1.3 : 0.55;

  return (
    <group>
      {/* GLOWING CYAN PANORAMIC ELEVATOR TOWER (Inspired by Isometric Reference Image 1) */}
      <group position={[-11.8, 0, -8.4]}>
        <mesh position={[0, elevatorHeight / 2, 0]}>
          <boxGeometry args={[2.25, elevatorHeight, 2.15]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={isNight ? 0.48 : 0.22}
            transparent
            opacity={0.28}
            roughness={0.08}
            metalness={0.2}
          />
        </mesh>
        {/* 4 Neon Cyan Corner Energy Rails */}
        {[
          [-1.08, -1.04],
          [1.08, -1.04],
          [-1.08, 1.04],
          [1.08, 1.04],
        ].map(([rx, rz], i) => (
          <mesh key={i} position={[rx, elevatorHeight / 2, rz]}>
            <boxGeometry args={[0.09, elevatorHeight, 0.09]} />
            <meshStandardMaterial
              color="#67e8f9"
              emissive="#22d3ee"
              emissiveIntensity={emissiveBoost}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* GROUND-FLOOR CYAN HOLOGRAM ARRIVAL PORTAL (Floor 1 Front Lobby, Inspired by Image 1) */}
      <group
        position={[0, FLOOR_1_Y + 0.04, 1.4]}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onFocusPoint?.([0, FLOOR_1_Y + 1.2, 1.4]);
        }}
      >
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[3.4, 0.08, 2.4]} />
          <meshStandardMaterial
            color="#0c4a6e"
            emissive="#22d3ee"
            emissiveIntensity={isNight ? 0.95 : 0.55}
            roughness={0.2}
          />
        </mesh>
        {/* Twin Glowing Hologram Portal Frames */}
        {[-0.45, 0.45].map((zOff, idx) => (
          <group key={idx} position={[0, 1.25, zOff]}>
            <mesh position={[-1.15, 0, 0]}>
              <boxGeometry args={[0.07, 2.35, 0.07]} />
              <meshStandardMaterial
                color="#a5f3fc"
                emissive="#22d3ee"
                emissiveIntensity={emissiveBoost}
              />
            </mesh>
            <mesh position={[1.15, 0, 0]}>
              <boxGeometry args={[0.07, 2.35, 0.07]} />
              <meshStandardMaterial
                color="#a5f3fc"
                emissive="#22d3ee"
                emissiveIntensity={emissiveBoost}
              />
            </mesh>
            <mesh position={[0, 1.18, 0]}>
              <boxGeometry args={[2.37, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#a5f3fc"
                emissive="#22d3ee"
                emissiveIntensity={emissiveBoost}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* INSTANCED COLUMNS FOR FLOORS 4 & 5 */}
      {columnPositions.length > 0 && (
        <instancedMesh
          ref={columnsRef}
          args={[sharedGeos.column, sharedMats.columnMat, 20]}
          frustumCulled
        />
      )}

      {/* ============================================================
          FLOOR 4 — VIDEO EDITING & RENDERING DECK (Y = 11.6)
          ============================================================ */}
      {showL4 && (
        <group
          position={[0, FLOOR_4_Y, 0]}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onFocusPoint?.([0, FLOOR_4_Y + 1.2, -3.2]);
          }}
        >
          <mesh
            position={[0, -0.11, -3.0]}
            geometry={sharedGeos.slab}
            material={sharedMats.floorSlab}
            receiveShadow
          />
          <mesh
            position={[0, 1.81, -9.8]}
            geometry={sharedGeos.rearWall}
            material={sharedMats.wallDark}
          />
          <mesh
            position={[-13.5, 1.81, -3.0]}
            geometry={sharedGeos.sideWall}
            material={sharedMats.wallDark}
          />
          <mesh
            position={[13.5, 1.81, -3.0]}
            geometry={sharedGeos.sideWall}
            material={sharedMats.wallDark}
          />

          {/* Glass Front Safety Rail + Purple Neon Floor Accent */}
          <mesh
            position={[0, 0.55, 3.8]}
            geometry={sharedGeos.glassRailFront}
            material={sharedMats.glassRail}
          />
          <mesh
            position={[0, 1.1, 3.8]}
            geometry={sharedGeos.handrailFront}
            material={sharedMats.railMetal}
          />
          <mesh
            position={[0, -0.04, 3.92]}
            geometry={sharedGeos.ledStrip}
            material={sharedMats.purpleGlow}
          />

          {/* 3 Rear Telemetry Wall Screens (Editing Timeline / Render Queue / Export QC) */}
          {[-7.5, 0, 7.5].map((sx, i) => (
            <group key={i} position={[sx, 2.25, -9.58]}>
              <mesh geometry={sharedGeos.wallScreen} material={sharedMats.screenDark} />
              <mesh position={[0, 0.96, 0.05]}>
                <boxGeometry args={[4.2, 0.06, 0.04]} />
                <meshStandardMaterial
                  color="#d8b4fe"
                  emissive="#a855f7"
                  emissiveIntensity={emissiveBoost}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ============================================================
          FLOOR 5 — VOICE, SUBTITLE & QUALITY CONTROL SUITE (Y = 15.4)
          ============================================================ */}
      {showL5 && (
        <group
          position={[0, FLOOR_5_Y, 0]}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onFocusPoint?.([0, FLOOR_5_Y + 1.2, -3.2]);
          }}
        >
          <mesh
            position={[0, -0.11, -3.0]}
            geometry={sharedGeos.slab}
            material={sharedMats.floorSlab}
            receiveShadow
          />
          <mesh
            position={[0, 1.81, -9.8]}
            geometry={sharedGeos.rearWall}
            material={sharedMats.wallDark}
          />
          <mesh
            position={[-13.5, 1.81, -3.0]}
            geometry={sharedGeos.sideWall}
            material={sharedMats.wallDark}
          />
          <mesh
            position={[13.5, 1.81, -3.0]}
            geometry={sharedGeos.sideWall}
            material={sharedMats.wallDark}
          />

          {/* Glass Front Safety Rail + Emerald/Cyan Neon Floor Accent */}
          <mesh
            position={[0, 0.55, 3.8]}
            geometry={sharedGeos.glassRailFront}
            material={sharedMats.glassRail}
          />
          <mesh
            position={[0, 1.1, 3.8]}
            geometry={sharedGeos.handrailFront}
            material={sharedMats.railMetal}
          />
          <mesh
            position={[0, -0.04, 3.92]}
            geometry={sharedGeos.ledStrip}
            material={sharedMats.emeraldGlow}
          />

          {/* 3 Rear Wall Screens (Audio Waveform / 0ms Subtitle Lock / ffprobe QC Audit) */}
          {[-7.5, 0, 7.5].map((sx, i) => (
            <group key={i} position={[sx, 2.25, -9.58]}>
              <mesh geometry={sharedGeos.wallScreen} material={sharedMats.screenDark} />
              <mesh position={[0, 0.96, 0.05]}>
                <boxGeometry args={[4.2, 0.06, 0.04]} />
                <meshStandardMaterial
                  color="#6ee7b7"
                  emissive="#10b981"
                  emissiveIntensity={emissiveBoost}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ============================================================
          CROWN SKY-DECK ROOF — HELIPAD + HELICOPTER + BADMINTON COURT
          (Y = ROOF_Y = 19.2, the real top of the tower)
          ============================================================ */}
      {showRoofCap && (
        <group position={[0, ROOF_Y, 0]}>
          {/* Structural Roof Slab */}
          <mesh
            position={[0, -0.11, -3.0]}
            geometry={sharedGeos.slab}
            material={sharedMats.floorSlab}
            receiveShadow
          />

          {/* Front Fascia + Neon Under-Glow */}
          <mesh position={[0, 0.05, 3.86]} castShadow>
            <boxGeometry args={[27.25, 0.22, 0.18]} />
            <meshStandardMaterial
              color="#1b1f26"
              metalness={0.58}
              roughness={0.38}
            />
          </mesh>
          <mesh
            position={[0, 0.04, 3.92]}
            geometry={sharedGeos.ledStrip}
            material={sharedMats.cyanGlow}
          />

          {/* Panoramic Glass Safety Balustrade (front, rear & both sides) */}
          {(
            [
              [0, 0.6, 3.72, 27.1, 1.05, 0.05],
              [0, 0.6, -9.68, 27.1, 1.05, 0.05],
              [-13.56, 0.6, -3.0, 0.05, 1.05, 13.4],
              [13.56, 0.6, -3.0, 0.05, 1.05, 13.4],
            ] as [number, number, number, number, number, number][]
          ).map(([bx, by, bz, bw, bh, bd], bi) => (
            <mesh key={`roof-glass-${bi}`} position={[bx, by, bz]}>
              <boxGeometry args={[bw, bh, bd]} />
              <meshPhysicalMaterial
                color="#7dd3fc"
                transparent
                opacity={0.24}
                roughness={0.1}
                metalness={0.12}
              />
            </mesh>
          ))}

          {/* Slim Steel Handrails + Neon Accent Lines */}
          {(
            [
              [0, 1.16, 3.72, 27.2, 0.09, 0.14],
              [0, 1.16, -9.68, 27.2, 0.09, 0.14],
              [-13.56, 1.16, -3.0, 0.14, 0.09, 13.5],
              [13.56, 1.16, -3.0, 0.14, 0.09, 13.5],
            ] as [number, number, number, number, number, number][]
          ).map(([hx, hy, hz, hw, hh, hd], hi) => (
            <mesh key={`roof-rail-${hi}`} position={[hx, hy, hz]}>
              <boxGeometry args={[hw, hh, hd]} />
              <meshStandardMaterial
                color="#334155"
                metalness={0.82}
                roughness={0.26}
              />
            </mesh>
          ))}
          {[-13.5, 13.5].map((nx, ni) => (
            <mesh key={`roof-neon-side-${ni}`} position={[nx, 0.12, -3.0]}>
              <boxGeometry args={[0.06, 0.06, 13.3]} />
              <meshStandardMaterial
                color="#cffafe"
                emissive={ni === 0 ? "#00f0ff" : "#ec4899"}
                emissiveIntensity={roofNeon}
                toneMapped={!isNight}
              />
            </mesh>
          ))}

          {/* 4 Corner RGB Light Pylons */}
          {[
            [-13.3, 3.5, "#22d3ee"],
            [13.3, 3.5, "#ec4899"],
            [-13.3, -9.5, "#a855f7"],
            [13.3, -9.5, "#22c55e"],
          ].map(([px, pz, glow], pi) => (
            <group key={`roof-pylon-${pi}`} position={[px as number, 0, pz as number]}>
              <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.075, 0.095, 1.4, 10]} />
                <meshStandardMaterial
                  color="#1e293b"
                  metalness={0.8}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 1.44, 0]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial
                  color={glow as string}
                  emissive={glow as string}
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
            </group>
          ))}

          {/* Corner Planters with Greenery */}
          {[
            [-12.4, 3.0],
            [12.4, 3.0],
            [-12.5, -9.1],
            [12.5, -9.1],
          ].map(([gx, gz], gi) => (
            <group key={`roof-planter-${gi}`} position={[gx, 0, gz]}>
              <mesh position={[0, 0.22, 0]} castShadow>
                <boxGeometry args={[1.1, 0.44, 0.95]} />
                <meshStandardMaterial color="#2c3138" roughness={0.66} />
              </mesh>
              <mesh position={[0, 0.62, 0]} castShadow>
                <sphereGeometry args={[0.5, 10, 8]} />
                <meshStandardMaterial color="#4a6b3c" roughness={0.88} />
              </mesh>
            </group>
          ))}

          {/* Cyberpunk RGB Crown Signage standing on the rear edge */}
          <group position={[0, 0, -9.45]}>
            {[-5.4, 5.4].map((lx, li) => (
              <mesh key={`sign-leg-${li}`} position={[lx, 1.14, 0]} castShadow>
                <boxGeometry args={[0.16, 2.28, 0.16]} />
                <meshStandardMaterial
                  color="#1b1f26"
                  metalness={0.72}
                  roughness={0.32}
                />
              </mesh>
            ))}
            <group position={[0, 2.83, 0]}>
              <mesh castShadow>
                <boxGeometry args={[12.4, 1.1, 0.22]} />
                <meshStandardMaterial
                  color="#111624"
                  metalness={0.68}
                  roughness={0.28}
                />
              </mesh>
              <mesh position={[0, 0.57, 0.1]}>
                <boxGeometry args={[12.45, 0.06, 0.06]} />
                <meshStandardMaterial
                  color="#cffafe"
                  emissive="#00f0ff"
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
              <mesh position={[0, -0.57, 0.1]}>
                <boxGeometry args={[12.45, 0.06, 0.06]} />
                <meshStandardMaterial
                  color="#f3e8ff"
                  emissive="#a855f7"
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
              <Text
                position={[0, 0, 0.14]}
                fontSize={0.72}
                color="#e0f2fe"
                letterSpacing={0.13}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.014}
                outlineColor="#0f172a"
              >
                FAJREZZZ AI OFFICE
                <meshStandardMaterial
                  color="#e0f2fe"
                  emissive={isNight ? "#38bdf8" : "#0284c7"}
                  emissiveIntensity={isNight ? 2.0 : 0.5}
                  toneMapped={!isNight}
                />
              </Text>
            </group>
          </group>

          {/* Sky Lounge Sofa + Coffee Table (between helipad and court) */}
          <group position={[-1.3, 0, 2.8]}>
            <mesh position={[0, 0.24, 0]} castShadow>
              <boxGeometry args={[2.9, 0.38, 0.85]} />
              <meshStandardMaterial color="#f4efe6" roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.55, -0.31]} castShadow>
              <boxGeometry args={[2.9, 0.44, 0.2]} />
              <meshStandardMaterial color="#e6dfd2" roughness={0.86} />
            </mesh>
            <group position={[0, 0, -1.05]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[1.5, 0.07, 0.72]} />
                <meshStandardMaterial
                  color="#cbd5e1"
                  metalness={0.35}
                  roughness={0.35}
                />
              </mesh>
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[1.24, 0.3, 0.5]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} />
              </mesh>
            </group>
          </group>

          {/* Rooftop Flood Lighting for night visibility */}
          {isNight && (
            <pointLight
              position={[0, 2.8, -2.6]}
              color="#cffafe"
              intensity={18}
              distance={26}
            />
          )}

          {/* Helipad "H" Deck + Executive Helicopter + Badminton Court & Players */}
          <RooftopAttractions
            isNight={isNight}
            isSunset={isSunset}
            isSimulationRunning={isSimulationRunning}
          />
        </group>
      )}
    </group>
  );
}
