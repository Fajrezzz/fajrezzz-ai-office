"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
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
  onFocusPoint?: (point: Vector3Tuple) => void;
}

/**
 * Multi-Floor Expansion Module (Section B & D):
 * - Adds Floor 4 (Video Editing & Rendering, Y=11.6) & Floor 5 (Voice, Subtitle & QC, Y=15.4)
 * - Extends the glowing cyan panoramic glass elevator shaft seamlessly from L1 -> L5 -> Roof
 * - Adds the Ground-Floor Cyan Hologram Arrival Portal (inspired by isometric cyber-office reference)
 * - Uses THREE.InstancedMesh for structural columns & ceiling LED strips (minimal draw calls!)
 * - Disposes shared geometries & materials cleanly on unmount (mobile memory safety)
 */
export function UpperProductionFloors({
  activeFloor,
  isNight,
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
          CROWN SKY-DECK ROOF SLAB ABOVE FLOOR 5 (Y = 19.2)
          ============================================================ */}
      {showRoofCap && (
        <group position={[0, ROOF_Y, 0]}>
          <mesh
            position={[0, -0.11, -3.0]}
            geometry={sharedGeos.slab}
            material={sharedMats.floorSlab}
          />
          <mesh
            position={[0, 0.04, 3.92]}
            geometry={sharedGeos.ledStrip}
            material={sharedMats.cyanGlow}
          />
          {/* Glowing Helipad Ring on Crown Sky Deck */}
          <mesh position={[0, 0.04, -3.0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.6, 2.95, 32]} />
            <meshStandardMaterial
              color="#67e8f9"
              emissive="#22d3ee"
              emissiveIntensity={emissiveBoost}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
