"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import { RooftopAttractions } from "@/components/office3d/RooftopAttractions";
import { useOffice } from "@/store/OfficeContext";
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

/** Automatic Proximity Frameless Sliding Double Glass Door Portal (Auto-Opens When Boss Approaches!) */
function SlidingGlassDoorPortal({
  position,
  width = 3.2,
  height = 2.85,
  isNight = false,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  isNight?: boolean;
}) {
  const { bossPositionRef } = useOffice();
  const leftLeafRef = useRef<THREE.Group>(null);
  const rightLeafRef = useRef<THREE.Group>(null);
  const sensorLedRef = useRef<THREE.MeshStandardMaterial>(null);
  const openProgressRef = useRef(0);

  const halfW = width / 2;
  const leafW = width * 0.485;
  const closedOffset = leafW / 2 + 0.015;
  const openSlideDist = leafW * 0.92;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const [bx, by, bz] = bossPositionRef.current;
    const dx = bx - position[0];
    const dy = by - position[1];
    const dz = bz - position[2];
    const distXZ = Math.hypot(dx, dz);
    const shouldOpen = Math.abs(dy) < 2.25 && distXZ < 3.85;

    const target = shouldOpen ? 1 : 0;
    openProgressRef.current += (target - openProgressRef.current) * Math.min(1, dt * 5.2);
    const p = openProgressRef.current;

    if (leftLeafRef.current) {
      leftLeafRef.current.position.x = -(closedOffset + p * openSlideDist);
    }
    if (rightLeafRef.current) {
      rightLeafRef.current.position.x = closedOffset + p * openSlideDist;
    }
    if (sensorLedRef.current) {
      if (p > 0.08) {
        sensorLedRef.current.color.set("#4ade80");
        sensorLedRef.current.emissive.set("#22c55e");
        sensorLedRef.current.emissiveIntensity = isNight ? 1.5 : 1.0;
      } else {
        sensorLedRef.current.color.set("#38bdf8");
        sensorLedRef.current.emissive.set("#0ea5e9");
        sensorLedRef.current.emissiveIntensity = isNight ? 0.85 : 0.45;
      }
    }
  });

  return (
    <group position={position}>
      {/* Matte-Black Architectural Steel Portal Frame */}
      <mesh position={[-halfW, height / 2, 0]} castShadow>
        <boxGeometry args={[0.09, height, 0.14]} />
        <meshStandardMaterial color="#1f2530" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[halfW, height / 2, 0]} castShadow>
        <boxGeometry args={[0.09, height, 0.14]} />
        <meshStandardMaterial color="#1f2530" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Top Sliding Rail Track + Overhead Automatic Motion Sensor Unit */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[width + 0.16, 0.11, 0.16]} />
        <meshStandardMaterial color="#1f2530" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[0, height - 0.01, 0.09]}>
        <boxGeometry args={[0.38, 0.075, 0.05]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, height - 0.01, 0.118]}>
        <boxGeometry args={[0.14, 0.022, 0.012]} />
        <meshStandardMaterial
          ref={sensorLedRef}
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={isNight ? 0.85 : 0.45}
        />
      </mesh>
      {/* Stainless Bottom Floor Threshold Track */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[width, 0.02, 0.12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.55} roughness={0.38} />
      </mesh>

      {/* Left & Right Automatic Sliding Tempered Glass Door Leaves */}
      {([-1, 1] as const).map((side) => {
        const handleLocalX = -side * (leafW / 2 - 0.12);
        return (
          <group
            key={side}
            ref={side === -1 ? leftLeafRef : rightLeafRef}
            position={[side * closedOffset, 0, 0.015]}
          >
            {/* Tempered Anti-Glare Glass Door Leaf */}
            <mesh position={[0, (height - 0.08) / 2, 0]}>
              <boxGeometry args={[leafW, height - 0.12, 0.035]} />
              <meshPhysicalMaterial
                color="#dbeafe"
                transparent
                opacity={0.28}
                roughness={0.34}
                metalness={0.04}
              />
            </mesh>
            {/* Slim Black Aluminum Door Edge Frame */}
            <mesh position={[0, height - 0.1, 0]}>
              <boxGeometry args={[leafW + 0.02, 0.04, 0.05]} />
              <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[leafW + 0.02, 0.05, 0.05]} />
              <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
            </mesh>
            {/* Vertical Brushed Stainless-Steel Pull Handles (Front & Back) */}
            {[-0.045, 0.045].map((hz, hi) => (
              <mesh key={hi} position={[handleLocalX, 1.15, hz]}>
                <cylinderGeometry args={[0.014, 0.014, 0.62, 10]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.16} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** 3-Floor Animated Panoramic Glass Elevator Shaft with REAL Office Passengers Riding L1 <-> L2 <-> L3 */
function PanoramicGlassElevator({
  position,
  showL2,
  showL3,
  isNight,
  isSimulationRunning,
}: {
  position: [number, number, number];
  showL2: boolean;
  showL3: boolean;
  isNight: boolean;
  isSimulationRunning: boolean;
}) {
  const cabinRef = useRef<THREE.Group>(null);
  const cabinDoorLeftRef = useRef<THREE.Mesh>(null);
  const cabinDoorRightRef = useRef<THREE.Mesh>(null);
  const rider1HeadRef = useRef<THREE.Group>(null);
  const rider2HeadRef = useRef<THREE.Group>(null);
  const topY = showL3 ? FLOOR_3_Y + 3.65 : showL2 ? FLOOR_2_Y + 3.7 : 3.75;

  useFrame((state) => {
    if (!cabinRef.current) return;
    if (!isSimulationRunning) return;
    const t = state.clock.elapsedTime;
    const yL1 = FLOOR_1_Y + 0.04;
    const yL2 = showL2 ? FLOOR_2_Y + 0.04 : yL1;
    const yL3 = showL3 ? FLOOR_3_Y + 0.04 : yL2;

    // 20-second realistic elevator cycle with smooth easing & 2.2s floor stops at L1, L2, L3, L2!
    const cycle = t % 20;
    const smooth = (u: number) => {
      const c = Math.max(0, Math.min(1, u));
      return c * c * (3 - 2 * c);
    };

    let targetY = yL1;
    let doorOpen = 0;

    if (cycle < 2.2) {
      // Stopped at L1 (doors open smoothly)
      targetY = yL1;
      doorOpen = Math.sin((cycle / 2.2) * Math.PI);
    } else if (cycle < 5.0) {
      // Riding UP: L1 -> L2
      targetY = yL1 + (yL2 - yL1) * smooth((cycle - 2.2) / 2.8);
    } else if (cycle < 7.2) {
      // Stopped at L2
      targetY = yL2;
      doorOpen = Math.sin(((cycle - 5.0) / 2.2) * Math.PI);
    } else if (cycle < 10.0) {
      // Riding UP: L2 -> L3
      targetY = yL2 + (yL3 - yL2) * smooth((cycle - 7.2) / 2.8);
    } else if (cycle < 12.2) {
      // Stopped at L3
      targetY = yL3;
      doorOpen = Math.sin(((cycle - 10.0) / 2.2) * Math.PI);
    } else if (cycle < 15.0) {
      // Riding DOWN: L3 -> L2
      targetY = yL3 + (yL2 - yL3) * smooth((cycle - 12.2) / 2.8);
    } else if (cycle < 17.2) {
      // Stopped at L2
      targetY = yL2;
      doorOpen = Math.sin(((cycle - 15.0) / 2.2) * Math.PI);
    } else {
      // Riding DOWN: L2 -> L1
      targetY = yL2 + (yL1 - yL2) * smooth((cycle - 17.2) / 2.8);
    }

    cabinRef.current.position.y = targetY;

    // Slide cabin front glass doors open smoothly at every floor stop
    const slideOffset = doorOpen * 0.34;
    if (cabinDoorLeftRef.current) {
      cabinDoorLeftRef.current.position.x = -0.39 - slideOffset;
    }
    if (cabinDoorRightRef.current) {
      cabinDoorRightRef.current.position.x = 0.39 + slideOffset;
    }

    // Subtle natural passenger head/look movement inside the lift
    if (rider1HeadRef.current) {
      rider1HeadRef.current.rotation.y = Math.sin(t * 0.7) * 0.22;
    }
    if (rider2HeadRef.current) {
      rider2HeadRef.current.rotation.y = Math.cos(t * 0.65) * 0.2;
      rider2HeadRef.current.rotation.x = 0.08 + Math.sin(t * 1.1) * 0.04;
    }
  });

  const floorLandings = [
    { label: "L1", y: FLOOR_1_Y, visible: true },
    { label: "L2", y: FLOOR_2_Y, visible: showL2 },
    { label: "L3", y: FLOOR_3_Y, visible: showL3 },
  ];

  return (
    <group position={position}>
      {/* 4 Matte-Black Steel Corner Shaft Columns + Subtle Vertical LED Strip Lights */}
      {[
        [-0.95, -0.95],
        [0.95, -0.95],
        [-0.95, 0.95],
        [0.95, 0.95],
      ].map(([cx, cz], i) => (
        <group key={i}>
          <mesh position={[cx, topY / 2, cz]} castShadow>
            <boxGeometry args={[0.1, topY, 0.1]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.38} />
          </mesh>
          {/* Balanced Warm-White / Cyan Architectural Vertical Shaft LED Light Strip */}
          <mesh position={[cx * 0.9, topY / 2, cz * 0.9]}>
            <boxGeometry args={[0.028, topY - 0.16, 0.028]} />
            <meshStandardMaterial
              color="#fff8e7"
              emissive={i >= 2 ? "#38bdf8" : "#ffd89b"}
              emissiveIntensity={isNight ? 0.95 : 0.45}
            />
          </mesh>
        </group>
      ))}
      {/* Crystal-Clear Anti-Glare Glass Shaft Enclosure Panels (Sides & Back) */}
      <mesh position={[-0.95, topY / 2, 0]}>
        <boxGeometry args={[0.04, topY, 1.85]} />
        <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.2} roughness={0.34} metalness={0.04} />
      </mesh>
      <mesh position={[0.95, topY / 2, 0]}>
        <boxGeometry args={[0.04, topY, 1.85]} />
        <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.2} roughness={0.34} metalness={0.04} />
      </mesh>
      <mesh position={[0, topY / 2, -0.95]}>
        <boxGeometry args={[1.85, topY, 0.04]} />
        <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.18} roughness={0.34} metalness={0.04} />
      </mesh>

      {/* Landing Glass Doors + Illuminated Floor Call Panels & Warm Overhead Lobby Lights on L1, L2, L3 */}
      {floorLandings
        .filter((fl) => fl.visible)
        .map((fl) => (
          <group key={fl.label} position={[0, fl.y, 0.95]}>
            {/* Door Frame Header */}
            <mesh position={[0, 2.38, 0]}>
              <boxGeometry args={[1.95, 0.14, 0.12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.38} />
            </mesh>
            {/* Soft Warm Cove Light Strip Above Elevator Doors */}
            <mesh position={[0, 2.49, 0.06]}>
              <boxGeometry args={[1.82, 0.04, 0.06]} />
              <meshStandardMaterial
                color="#fff9eb"
                emissive="#ffe0a3"
                emissiveIntensity={isNight ? 0.9 : 0.42}
              />
            </mesh>
            {/* Glowing Cyan Floor Indicator Display */}
            <mesh position={[0, 2.38, 0.07]}>
              <boxGeometry args={[0.62, 0.13, 0.02]} />
              <meshStandardMaterial
                color="#0f172a"
                emissive="#22d3ee"
                emissiveIntensity={isNight ? 0.95 : 0.55}
              />
            </mesh>
            <Text
              position={[0, 2.38, 0.09]}
              fontSize={0.095}
              color="#e0f2fe"
              anchorX="center"
              anchorY="middle"
            >
              {`LIFT · ${fl.label}`}
            </Text>
            {/* Double Glass Elevator Landing Doors (Low-Opacity Anti-Glare so Riders Inside Are Clearly Visible!) */}
            {[-0.44, 0.44].map((dx, di) => (
              <mesh key={di} position={[dx, 1.15, 0]}>
                <boxGeometry args={[0.84, 2.28, 0.04]} />
                <meshPhysicalMaterial
                  color="#bae6fd"
                  transparent
                  opacity={0.18}
                  roughness={0.34}
                  metalness={0.04}
                />
              </mesh>
            ))}
            {/* Illuminated Call Button Panel on Right Jamb */}
            <mesh position={[0.98, 1.18, 0.07]}>
              <boxGeometry args={[0.1, 0.24, 0.03]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0.98, 1.22, 0.09]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={1.1}
              />
            </mesh>
          </group>
        ))}

      {/* Animated Illuminated Glass Elevator Cabin with 2 REAL Office Passengers Riding Up & Down! */}
      <group ref={cabinRef} position={[0, FLOOR_1_Y + 0.04, 0]}>
        {/* Cabin Oak Floor Platform */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[1.68, 0.08, 1.68]} />
          <meshStandardMaterial color="#8b5e3c" roughness={0.5} />
        </mesh>
        {/* Warm Cabin Floor Perimeter LED Strip */}
        <mesh position={[0, 0.09, 0.8]}>
          <boxGeometry args={[1.56, 0.03, 0.03]} />
          <meshStandardMaterial
            color="#fff7e6"
            emissive="#facc15"
            emissiveIntensity={isNight ? 0.95 : 0.45}
          />
        </mesh>
        {/* Cabin Ceiling Roof with Soft Warm Recessed LED Light Panel */}
        <mesh position={[0, 2.24, 0]}>
          <boxGeometry args={[1.7, 0.08, 1.7]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.38} />
        </mesh>
        <mesh position={[0, 2.18, 0]}>
          <boxGeometry args={[1.38, 0.03, 1.38]} />
          <meshStandardMaterial
            color="#fff9eb"
            emissive="#ffe4b5"
            emissiveIntensity={isNight ? 1.15 : 0.65}
          />
        </mesh>
        {/* Soft Warm Cabin Interior PointLight Gliding Across All 3 Floors */}
        <pointLight
          position={[0, 1.85, 0.25]}
          color="#ffe8c2"
          intensity={isNight ? 3.2 : 1.6}
          distance={6}
        />
        {/* Brushed Stainless Interior Handrail */}
        <mesh position={[0, 0.96, -0.76]}>
          <boxGeometry args={[1.4, 0.035, 0.035]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Animated Cabin Front Sliding Glass Doors */}
        <mesh ref={cabinDoorLeftRef} position={[-0.39, 1.12, 0.82]}>
          <boxGeometry args={[0.76, 2.08, 0.03]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.16} roughness={0.34} metalness={0.04} />
        </mesh>
        <mesh ref={cabinDoorRightRef} position={[0.39, 1.12, 0.82]}>
          <boxGeometry args={[0.76, 2.08, 0.03]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.16} roughness={0.34} metalness={0.04} />
        </mesh>
        {/* Subtle Glass Cabin Back Panel */}
        <mesh position={[0, 1.14, -0.8]}>
          <boxGeometry args={[1.64, 2.12, 0.03]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.2} roughness={0.34} metalness={0.04} />
        </mesh>

        {/* REAL PASSENGER #1 INSIDE LIFT: Male Executive Riding Up & Down with Leather Briefcase */}
        <group position={[-0.36, 0.08, -0.08]} rotation={[0, 0.14, 0]}>
          {/* Legs & Shoes */}
          {[-0.085, 0.085].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              <mesh position={[0, 0.42, 0]} castShadow>
                <capsuleGeometry args={[0.062, 0.56, 6, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.05, 0.03]}>
                <boxGeometry args={[0.095, 0.08, 0.17]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
              </mesh>
            </group>
          ))}
          {/* Male Blazer Torso + Shirt + Cyan Tie */}
          <mesh position={[0, 1.08, 0]} castShadow>
            <boxGeometry args={[0.39, 0.52, 0.22]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.18, 0.115]}>
            <boxGeometry args={[0.1, 0.24, 0.015]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.55} />
          </mesh>
          <mesh position={[0, 1.12, 0.125]}>
            <boxGeometry args={[0.036, 0.22, 0.012]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.4} />
          </mesh>
          {/* Arms + Leather Briefcase in Right Hand */}
          <mesh position={[-0.24, 1.02, 0.02]} rotation={[0.05, 0, 0.08]} castShadow>
            <capsuleGeometry args={[0.05, 0.38, 6, 8]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.72} />
          </mesh>
          <mesh position={[0.24, 1.02, 0.02]} rotation={[0.08, 0, -0.08]} castShadow>
            <capsuleGeometry args={[0.05, 0.38, 6, 8]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.72} />
          </mesh>
          <mesh position={[0.28, 0.65, 0.05]} castShadow>
            <boxGeometry args={[0.07, 0.24, 0.32]} />
            <meshStandardMaterial color="#451a03" roughness={0.55} />
          </mesh>
          {/* Head & Short Male Hair */}
          <group ref={rider1HeadRef} position={[0, 1.5, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.135, 14, 12]} />
              <meshStandardMaterial color="#d8a682" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.05, -0.015]}>
              <sphereGeometry args={[0.142, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color="#18181b" roughness={0.82} />
            </mesh>
            <mesh position={[-0.042, 0.015, 0.122]}>
              <sphereGeometry args={[0.013, 8, 8]} />
              <meshStandardMaterial color="#18181b" roughness={0.2} />
            </mesh>
            <mesh position={[0.042, 0.015, 0.122]}>
              <sphereGeometry args={[0.013, 8, 8]} />
              <meshStandardMaterial color="#18181b" roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* REAL PASSENGER #2 INSIDE LIFT: Female Staff (Long Hair + Feminine Silhouette + Tablet) */}
        <group position={[0.36, 0.08, 0.04]} rotation={[0, -0.18, 0]}>
          {/* Slim Legs & Office Heels */}
          {[-0.072, 0.072].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              <mesh position={[0, 0.36, 0]} castShadow>
                <capsuleGeometry args={[0.05, 0.48, 6, 8]} />
                <meshStandardMaterial color="#e6b99a" roughness={0.72} />
              </mesh>
              <mesh position={[0, 0.045, 0.03]}>
                <boxGeometry args={[0.08, 0.07, 0.15]} />
                <meshStandardMaterial color="#1e293b" roughness={0.45} />
              </mesh>
            </group>
          ))}
          {/* A-Line Office Skirt */}
          <mesh position={[0, 0.68, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.185, 0.36, 14]} />
            <meshStandardMaterial color="#1f2937" roughness={0.74} />
          </mesh>
          {/* Tapered Female Blazer Torso + Natural Feminine Bust Contour */}
          <mesh position={[0, 1.06, 0]} castShadow>
            <cylinderGeometry args={[0.155, 0.12, 0.46, 14]} />
            <meshStandardMaterial color="#0f766e" roughness={0.68} />
          </mesh>
          {[-0.068, 0.068].map((bx, bi) => (
            <mesh key={bi} position={[bx, 1.12, 0.115]} scale={[0.92, 0.9, 0.95]} castShadow>
              <sphereGeometry args={[0.066, 12, 10]} />
              <meshStandardMaterial color="#0f766e" roughness={0.66} />
            </mesh>
          ))}
          <mesh position={[0, 1.17, 0.105]}>
            <boxGeometry args={[0.09, 0.2, 0.02]} />
            <meshStandardMaterial color="#fdf2f8" roughness={0.55} />
          </mesh>
          {/* Arms Holding Glowing Work Tablet */}
          <mesh position={[-0.2, 1.04, 0.09]} rotation={[-0.65, 0, 0.14]} castShadow>
            <capsuleGeometry args={[0.044, 0.34, 6, 8]} />
            <meshStandardMaterial color="#0f766e" roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 1.04, 0.09]} rotation={[-0.65, 0, -0.14]} castShadow>
            <capsuleGeometry args={[0.044, 0.34, 6, 8]} />
            <meshStandardMaterial color="#0f766e" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.96, 0.24]} rotation={[-0.45, 0, 0]}>
            <boxGeometry args={[0.22, 0.16, 0.016]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.5} />
          </mesh>
          {/* Head & Long Flowing Dark-Brown Feminine Hair Past Shoulders */}
          <group ref={rider2HeadRef} position={[0, 1.44, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.128, 14, 12]} />
              <meshStandardMaterial color="#ecc0a2" roughness={0.68} />
            </mesh>
            {/* Hair Crown */}
            <mesh position={[0, 0.04, -0.015]} castShadow>
              <sphereGeometry args={[0.136, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#2a1911" roughness={0.76} />
            </mesh>
            {/* Long Flowing Back Hair Drape Past Shoulders */}
            <mesh position={[0, -0.17, -0.1]} castShadow>
              <boxGeometry args={[0.24, 0.42, 0.1]} />
              <meshStandardMaterial color="#2a1911" roughness={0.76} />
            </mesh>
            {/* Long Side-Framing Hair Strands */}
            {[-0.11, 0.11].map((hx, hi) => (
              <mesh key={hi} position={[hx, -0.12, 0.01]} castShadow>
                <capsuleGeometry args={[0.036, 0.3, 6, 8]} />
                <meshStandardMaterial color="#2a1911" roughness={0.76} />
              </mesh>
            ))}
            <mesh position={[-0.04, 0.012, 0.116]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#18181b" roughness={0.2} />
            </mesh>
            <mesh position={[0.04, 0.012, 0.116]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#18181b" roughness={0.2} />
            </mesh>
          </group>
        </group>
      </group>
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
  const interiorLightEmissive = isNight ? 1.05 : isSunset ? 0.85 : 0.6;

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

  const frontColumnsX = [-18.7, -12.6, -6.5, 0, 6.5, 12.6, 18.7];
  const timberFins = [-18.2, -17.6, -17.0, -16.4, 16.4, 17.0, 17.6, 18.2];

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
        {/* Polished Travertine Marble Floor Slab (38.4m x 14.4m) */}
        <mesh
          position={[0, FLOOR_1_Y - 0.09, -3]}
          receiveShadow
          castShadow
          onDoubleClick={handleSurfaceDoubleClick}
        >
          <boxGeometry args={[38.4, 0.18, 14.4]} />
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
          <boxGeometry args={[38.2, 3.7, 0.34]} />
          <meshStandardMaterial
            map={textures.stuccoWall}
            bumpMap={textures.stuccoBump}
            bumpScale={0.03}
            roughness={0.72}
          />
        </mesh>

        {/* Side Architectural Walls + Full-Height Framed Glass Curtain Panels (L1 — ZERO Gaps!) */}
        {[-19, 19].map((x, idx) => (
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
              <boxGeometry args={[0.08, 3.68, 4.44]} />
              <meshPhysicalMaterial
                color="#d8ecf8"
                transparent
                opacity={0.22}
                roughness={0.34}
                metalness={0.04}
              />
            </mesh>
            {/* Slim Black Aluminum Vertical Mullions */}
            {[-0.4, 1.8, 4.0].map((mz, mi) => (
              <mesh key={mi} position={[x, 2.02, mz]}>
                <boxGeometry args={[0.12, 3.7, 0.1]} />
                <meshStandardMaterial color="#252c36" metalness={0.76} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Front Grand Glass Curtain Wall + REAL FRAMELESS DOUBLE GLASS SLIDING ENTRANCE DOOR */}
        {[-12.3, 12.3].map((x, idx) => (
          <mesh key={idx} position={[x, 2.02, 4.0]}>
            <boxGeometry args={[13.4, 3.55, 0.08]} />
            <meshPhysicalMaterial
              color="#d8edf8"
              transparent
              opacity={0.18}
              roughness={0.34}
              metalness={0.04}
            />
          </mesh>
        ))}
        {/* Side glass sidelights flanking the 3.8m main sliding glass doorway */}
        {[-3.75, 3.75].map((sx, si) => (
          <mesh key={`l1-sidelight-${si}`} position={[sx, 2.02, 4.0]}>
            <boxGeometry args={[3.7, 3.55, 0.07]} />
            <meshPhysicalMaterial
              color="#d8edf8"
              transparent
              opacity={0.18}
              roughness={0.34}
              metalness={0.04}
            />
          </mesh>
        ))}
        {/* Main Frameless Glass Sliding Double Entrance Doors (L1) */}
        <SlidingGlassDoorPortal
          position={[0, FLOOR_1_Y, 4.02]}
          width={3.8}
          height={2.88}
          isNight={isNight}
        />
        {/* Luxury Slate Entrance Welcome Mat */}
        <mesh position={[0, FLOOR_1_Y + 0.015, 4.05]} receiveShadow>
          <boxGeometry args={[3.4, 0.02, 1.35]} />
          <meshStandardMaterial color="#1f2937" roughness={0.94} />
        </mesh>

        {/* 3-STORY ANIMATED PANORAMIC GLASS ELEVATOR (L1 -> L2 -> L3) */}
        <PanoramicGlassElevator
          position={[-11.6, 0, -8.3]}
          showL2={showL2}
          showL3={showL3}
          isNight={isNight}
          isSimulationRunning={isSimulationRunning}
        />

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

        {/* Detailed Ribbed Warm-Oak Vertical Slat Feature Wall behind Reception + Brand Signage */}
        <mesh position={[0, 2.08, -9.76]} castShadow>
          <boxGeometry args={[10.2, 3.3, 0.14]} />
          <meshStandardMaterial color="#3b2b1d" roughness={0.74} />
        </mesh>
        {Array.from({ length: 25 }).map((_, si) => (
          <mesh
            key={`l1-slat-${si}`}
            position={[-4.8 + si * 0.4, 2.08, -9.66]}
            castShadow
          >
            <boxGeometry args={[0.14, 3.28, 0.08]} />
            <meshStandardMaterial color="#a6794d" roughness={0.54} />
          </mesh>
        ))}
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
        {[-18.76, 18.76].map((wx, i) => (
          <mesh key={`l1-wood-${i}`} position={[wx, 2.0, -5.2]}>
            <boxGeometry args={[0.1, 3.2, 6.4]} />
            <meshStandardMaterial color="#7a5130" roughness={0.6} />
          </mesh>
        ))}

        {/* L1 Warm-Gold Linear Ceiling Light Strips */}
        {[-12.4, -4.4, 4.4, 12.4].map((lx, i) => (
          <mesh key={`l1-ceil-${i}`} position={[lx, 3.6, -2.0]}>
            <boxGeometry args={[5.2, 0.05, 0.16]} />
            <meshStandardMaterial
              color="#fff6e0"
              emissive="#ffcf82"
              emissiveIntensity={interiorLightEmissive}
              toneMapped={!isNight}
            />
          </mesh>
        ))}

        {/* L1 Curtain Wall Horizontal Transom Bar */}
        {[-12.3, 12.3].map((tx, i) => (
          <mesh key={`l1-transom-${i}`} position={[tx, 2.38, 4.04]}>
            <boxGeometry args={[13.4, 0.06, 0.08]} />
            <meshStandardMaterial color="#252c36" metalness={0.75} roughness={0.3} />
          </mesh>
        ))}

        {/* Warm Lobby Pendant Lamps */}
        <PendantLight position={[-6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[0, 3.22, -4.5]} isNight={isNight} isSunset={isSunset} />
        <PendantLight position={[6, 3.22, -1.5]} isNight={isNight} isSunset={isSunset} />

        {/* Balanced Anti-Glare L1 Interior Light */}
        <pointLight
          position={[0, 3.2, -3.4]}
          color="#fff0d6"
          intensity={isNight ? 9.5 : isSunset ? 8.5 : 6.5}
          distance={22}
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
            <boxGeometry args={[38.8, 0.28, 16.6]} />
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
            <boxGeometry args={[37.8, 0.04, 13.8]} />
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
            <boxGeometry args={[38.2, 0.036, 2.04]} />
            <meshStandardMaterial
              map={textures.woodDeck}
              bumpMap={textures.woodDeckBump}
              bumpScale={0.04}
              roughness={0.58}
            />
          </mesh>

          {/* Warm Architectural Gold Edge Light along L2 Balcony */}
          <mesh position={[0, FLOOR_2_Y - 0.25, 6.2]}>
            <boxGeometry args={[38.6, 0.06, 0.08]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde68a"
              emissiveIntensity={isNight ? 1.25 : isSunset ? 0.6 : 0.12}
            />
          </mesh>

          <mesh position={[0, FLOOR_2_Y + 1.9, -10]} castShadow receiveShadow>
            <boxGeometry args={[38.2, 3.82, 0.34]} />
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
            <boxGeometry args={[37.2, 0.06, 0.08]} />
            <meshStandardMaterial color="#252c36" metalness={0.75} roughness={0.3} />
          </mesh>
          <IndoorPlanter position={[-6.4, FLOOR_2_Y, 2.5]} />
          <IndoorPlanter position={[6.4, FLOOR_2_Y, 2.5]} />

          {/* Compact High-Tech Server Cabinet tucked cleanly behind West Coffee Bar */}
          <group position={[-13.2, FLOOR_2_Y + 1.15, -6.9]}>
            <mesh castShadow>
              <boxGeometry args={[0.72, 2.2, 0.92]} />
              <meshStandardMaterial
                color="#1a2230"
                metalness={0.68}
                roughness={0.32}
              />
            </mesh>
            {[-0.6, -0.1, 0.4, 0.8].map((ly, li) => (
              <mesh key={li} position={[0.37, ly, 0]}>
                <boxGeometry args={[0.02, 0.05, 0.68]} />
                <meshStandardMaterial
                  color={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                  emissive={li % 2 === 0 ? "#38bdf8" : "#34d399"}
                  emissiveIntensity={1.6}
                />
              </mesh>
            ))}
          </group>

          {/* Warm Vertical Oak Slat Acoustic Side Accent Panels (L2 — GenRoom / Paintit.ai Style) */}
          {[-18.76, 18.76].map((wx, wi) => (
            <group key={`l2-wood-slats-${wi}`}>
              {Array.from({ length: 10 }).map((_, si) => (
                <mesh
                  key={si}
                  position={[wx, FLOOR_2_Y + 1.9, -9.2 + si * 0.65]}
                  castShadow
                >
                  <boxGeometry args={[0.08, 3.55, 0.16]} />
                  <meshStandardMaterial color="#a6794d" roughness={0.54} />
                </mesh>
              ))}
            </group>
          ))}

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

          {/* Side Walls + Full-Height Framed Panoramic Glass Side Walls (L2 — Closes Z=-2.4..+4.0 completely, ZERO bolong!) */}
          {[-19, 19].map((x, idx) => (
            <group key={idx}>
              <mesh position={[x, FLOOR_2_Y + 1.9, -6.2]} castShadow receiveShadow>
                <boxGeometry args={[0.34, 3.82, 7.6]} />
                <meshStandardMaterial
                  map={textures.stuccoWall}
                  bumpMap={textures.stuccoBump}
                  bumpScale={0.03}
                  roughness={0.72}
                />
              </mesh>
              {/* Full-height Side Glass Curtain Panel from Z=-2.4 to Z=+4.0 */}
              <mesh position={[x, FLOOR_2_Y + 1.9, 0.8]}>
                <boxGeometry args={[0.08, 3.78, 6.44]} />
                <meshPhysicalMaterial
                  color="#d8ecf8"
                  transparent
                  opacity={0.22}
                  roughness={0.34}
                  metalness={0.04}
                />
              </mesh>
              {/* Side Glass Mullion Posts + Horizontal Transom */}
              {[-2.4, -0.25, 1.9, 4.0].map((mz, mi) => (
                <mesh key={mi} position={[x, FLOOR_2_Y + 1.9, mz]}>
                  <boxGeometry args={[0.12, 3.82, 0.1]} />
                  <meshStandardMaterial color="#252c36" metalness={0.76} roughness={0.3} />
                </mesh>
              ))}
              <mesh position={[x, FLOOR_2_Y + 2.25, 0.8]}>
                <boxGeometry args={[0.12, 0.06, 6.44]} />
                <meshStandardMaterial color="#252c36" metalness={0.76} roughness={0.3} />
              </mesh>
            </group>
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

          {/* Segmented L2 Front Glass Curtain Wall leaving 2 REAL SLIDING GLASS BALCONY DOORS at X=-5.5 and X=+5.5 */}
          {activeFloor !== "l2" && (
            <group>
              {/* Far-left glass curtain (-18.7 to -6.9) */}
              <mesh position={[-12.8, FLOOR_2_Y + 1.9, 4.0]}>
                <boxGeometry args={[11.8, 3.62, 0.07]} />
                <meshPhysicalMaterial color="#d8eef8" transparent opacity={0.16} roughness={0.34} metalness={0.04} />
              </mesh>
              {/* Center panoramic glass curtain (-4.1 to +4.1) */}
              <mesh position={[0, FLOOR_2_Y + 1.9, 4.0]}>
                <boxGeometry args={[8.2, 3.62, 0.07]} />
                <meshPhysicalMaterial color="#d8eef8" transparent opacity={0.16} roughness={0.34} metalness={0.04} />
              </mesh>
              {/* Far-right glass curtain (+6.9 to +18.7) */}
              <mesh position={[12.8, FLOOR_2_Y + 1.9, 4.0]}>
                <boxGeometry args={[11.8, 3.62, 0.07]} />
                <meshPhysicalMaterial color="#d8eef8" transparent opacity={0.16} roughness={0.34} metalness={0.04} />
              </mesh>
            </group>
          )}
          {/* 2 Real Frameless Sliding Glass Balcony Entrance Doors (L2) */}
          <SlidingGlassDoorPortal
            position={[-5.5, FLOOR_2_Y, 4.02]}
            width={2.8}
            height={2.85}
            isNight={isNight}
          />
          <SlidingGlassDoorPortal
            position={[5.5, FLOOR_2_Y, 4.02]}
            width={2.8}
            height={2.85}
            isNight={isNight}
          />

          {/* Cantilevered Front Glass Balcony Railing (at outer balcony edge Z = 6.12) */}
          <mesh position={[0, FLOOR_2_Y + 0.56, 6.12]}>
            <boxGeometry args={[38.4, 1.06, 0.06]} />
            <meshPhysicalMaterial
              color="#d6eaf8"
              transparent
              opacity={0.26}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, FLOOR_2_Y + 1.1, 6.12]}>
            <boxGeometry args={[38.5, 0.06, 0.1]} />
            <meshStandardMaterial color="#2b313a" metalness={0.75} roughness={0.28} />
          </mesh>

          <IndoorPlanter position={[-12.6, FLOOR_2_Y, 2.4]} />
          <IndoorPlanter position={[12.6, FLOOR_2_Y, 2.4]} />

          {/* Warm Oak Acoustic Ceiling Beams + Recessed Architectural Cove Light Trays (L2) */}
          {[-9, -3, 3, 9].map((lx, i) => (
            <group key={i} position={[lx, FLOOR_3_Y - 0.18, -3.2]}>
              <mesh>
                <boxGeometry args={[4.4, 0.06, 0.18]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#fff3d6"
                  emissiveIntensity={interiorLightEmissive}
                />
              </mesh>
              <mesh position={[0, 0.02, -3.0]}>
                <boxGeometry args={[4.8, 0.1, 0.22]} />
                <meshStandardMaterial color="#9a6c43" roughness={0.52} />
              </mesh>
              <mesh position={[0, 0.02, 3.0]}>
                <boxGeometry args={[4.8, 0.1, 0.22]} />
                <meshStandardMaterial color="#9a6c43" roughness={0.52} />
              </mesh>
            </group>
          ))}

          {/* L2 Balanced Anti-Glare Interior Illumination */}
          <pointLight
            position={[-6, FLOOR_2_Y + 3.2, -3.2]}
            color="#fff2dc"
            intensity={isNight ? 9.5 : isSunset ? 8.5 : 6}
            distance={22}
          />
          {performanceMode !== "eco" && (
            <pointLight
              position={[6, FLOOR_2_Y + 3.2, -3.2]}
              color="#fff2dc"
              intensity={isNight ? 9.5 : isSunset ? 8.5 : 6}
              distance={22}
            />
          )}
        </group>
      )}

      {/* ============================================================
          FLOOR 3 — EXECUTIVE SUITE, BOARDROOM & BOS FAJREZ OFFICE (Y=7.8)
          (Full Panoramic Glass Enclosure — NO Balcony & NO Balcony Door on L3)
          ============================================================ */}
      {showL3 && (
        <group>
          <mesh
            position={[0, FLOOR_3_Y - 0.14, -3.0]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[38.4, 0.28, 14.3]} />
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
            <boxGeometry args={[37.8, 0.04, 13.8]} />
            <meshStandardMaterial
              map={textures.marbleTile}
              bumpMap={textures.marbleBump}
              bumpScale={0.025}
              roughness={0.26}
            />
          </mesh>

          {/* Clean Warm-White Architectural Edge Light along L3 Facade */}
          <mesh position={[0, FLOOR_3_Y - 0.25, 4.18]}>
            <boxGeometry args={[38.4, 0.06, 0.08]} />
            <meshStandardMaterial
              color="#fffbeb"
              emissive="#fef3c7"
              emissiveIntensity={isNight ? 1.15 : isSunset ? 0.55 : 0.12}
            />
          </mesh>

          <mesh position={[0, FLOOR_3_Y + 1.85, -10]} castShadow receiveShadow>
            <boxGeometry args={[38.2, 3.72, 0.34]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.03}
              roughness={0.72}
            />
          </mesh>
          {/* Side Walls + Full-Height Framed Panoramic Glass Side Walls (L3 — Closes Z=-3.0..+4.0 completely, ZERO bolong!) */}
          {[-19, 19].map((x, idx) => (
            <group key={idx}>
              <mesh position={[x, FLOOR_3_Y + 1.85, -6.5]} castShadow receiveShadow>
                <boxGeometry args={[0.34, 3.72, 7.0]} />
                <meshStandardMaterial
                  map={textures.stuccoWall}
                  bumpMap={textures.stuccoBump}
                  bumpScale={0.03}
                  roughness={0.72}
                />
              </mesh>
              <mesh position={[x, FLOOR_3_Y + 1.85, 0.5]}>
                <boxGeometry args={[0.08, 3.68, 7.04]} />
                <meshPhysicalMaterial
                  color="#d8ecf8"
                  transparent
                  opacity={0.22}
                  roughness={0.34}
                  metalness={0.04}
                />
              </mesh>
              {[-3.0, -0.65, 1.7, 4.0].map((mz, mi) => (
                <mesh key={mi} position={[x, FLOOR_3_Y + 1.85, mz]}>
                  <boxGeometry args={[0.12, 3.72, 0.1]} />
                  <meshStandardMaterial color="#252c36" metalness={0.76} roughness={0.3} />
                </mesh>
              ))}
              <mesh position={[x, FLOOR_3_Y + 2.2, 0.5]}>
                <boxGeometry args={[0.12, 0.06, 7.04]} />
                <meshStandardMaterial color="#252c36" metalness={0.76} roughness={0.3} />
              </mesh>
            </group>
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
            {/* Sleek Realistic Executive CEO Monitor (Proper Desk Proportions, Facing CEO at -Z) */}
            <mesh position={[0, 1.07, -0.25]}>
              <boxGeometry args={[0.86, 0.36, 0.036]} />
              <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.45} />
            </mesh>
            {/* Slim Monitor Stand Neck & Base */}
            <mesh position={[0, 0.86, -0.25]}>
              <boxGeometry args={[0.07, 0.14, 0.04]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.835, -0.25]}>
              <boxGeometry args={[0.24, 0.014, 0.14]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.6} />
            </mesh>
            {/* Active Dashboard Display Plane Facing CEO at -Z */}
            <mesh position={[0, 1.07, -0.27]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.80, 0.31]} />
              <meshStandardMaterial
                map={textures.monitorScreen}
                emissiveMap={textures.monitorScreen}
                emissive="#ffffff"
                emissiveIntensity={0.52}
              />
            </mesh>
            {/* Subtle Gold Executive Emblem on Visitor-Facing Rear Shell (+Z) */}
            <mesh position={[0, 1.07, -0.23]}>
              <boxGeometry args={[0.14, 0.022, 0.006]} />
              <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.35} />
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

          {/* L3 GenRoom / Planner 5D Detail: Ribbed Oak Slat Wall + Built-in White/Oak Credenza + Glass Partition + Globe Pendants */}
          {/* Warm Vertical Oak Slat Feature Wall along L3 Boardroom Rear */}
          {Array.from({ length: 18 }).map((_, si) => (
            <mesh
              key={`l3-slat-${si}`}
              position={[-9.2 + si * 0.52, FLOOR_3_Y + 1.85, -9.8]}
              castShadow
            >
              <boxGeometry args={[0.14, 3.45, 0.08]} />
              <meshStandardMaterial color="#9d7047" roughness={0.54} />
            </mesh>
          ))}

          {/* Modern White & Light-Oak Credenza Sideboard Cabinet under Boardroom Screen */}
          <group position={[-4.5, FLOOR_3_Y, -9.2]}>
            <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
              <boxGeometry args={[5.4, 0.68, 0.62]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.42} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow>
              <boxGeometry args={[5.48, 0.05, 0.66]} />
              <meshStandardMaterial color="#b08256" roughness={0.44} />
            </mesh>
            {[-1.8, -0.6, 0.6, 1.8].map((dx, di) => (
              <mesh key={di} position={[dx, 0.36, 0.32]}>
                <boxGeometry args={[0.02, 0.58, 0.015]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
              </mesh>
            ))}
          </group>

          {/* Frameless Black-Mullion Glass Partition Wall separating Boardroom & CEO Suite (X = 0.8) */}
          <group position={[0.8, FLOOR_3_Y, -5.2]}>
            <mesh position={[0, 1.82, 0]}>
              <boxGeometry args={[0.06, 3.6, 7.6]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.22}
                roughness={0.05}
                metalness={0.14}
              />
            </mesh>
            {[-3.8, -1.9, 0, 1.9, 3.8].map((mz, mi) => (
              <mesh key={mi} position={[0, 1.82, mz]}>
                <boxGeometry args={[0.09, 3.62, 0.08]} />
                <meshStandardMaterial color="#1f2530" metalness={0.76} roughness={0.3} />
              </mesh>
            ))}
            <mesh position={[0, 3.62, 0]}>
              <boxGeometry args={[0.1, 0.08, 7.7]} />
              <meshStandardMaterial color="#1f2530" metalness={0.76} roughness={0.3} />
            </mesh>
          </group>

          {/* 3 Architectural Warm Globe Pendant Lamps over L3 Conference Table */}
          {[-6.3, -4.5, -2.7].map((px, pi) => (
            <PendantLight
              key={`l3-pend-${pi}`}
              position={[px, FLOOR_3_Y + 3.0, -3.5]}
              isNight={isNight}
              isSunset={isSunset}
            />
          ))}

          {/* Continuous Full-Width Panoramic Glass Curtain Wall on L3 (NO Balcony & NO Door on L3!) */}
          {frontColumnsX.map((cx, i) => (
            <mesh key={i} position={[cx, FLOOR_3_Y + 1.85, 4.02]} castShadow>
              <boxGeometry args={[0.28, 3.74, 0.28]} />
              <meshStandardMaterial color="#282d35" metalness={0.72} roughness={0.32} />
            </mesh>
          ))}
          {activeFloor !== "l3" && (
            <mesh position={[0, FLOOR_3_Y + 1.85, 4.0]}>
              <boxGeometry args={[37.8, 3.68, 0.07]} />
              <meshPhysicalMaterial
                color="#d8eef8"
                transparent
                opacity={0.18}
                roughness={0.34}
                metalness={0.04}
              />
            </mesh>
          )}

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
            <boxGeometry args={[37.2, 0.06, 0.08]} />
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
          {/* Vertical Corner Warm Architectural Edge Bars spanning Full Building Height */}
          <mesh position={[-19.12, 6.0, 4.2]}>
            <boxGeometry args={[0.075, 11.4, 0.075]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde68a"
              emissiveIntensity={isNight ? 1.2 : isSunset ? 0.5 : 0.1}
            />
          </mesh>
          <mesh position={[19.12, 6.0, 4.2]}>
            <boxGeometry args={[0.075, 11.4, 0.075]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde68a"
              emissiveIntensity={isNight ? 1.2 : isSunset ? 0.5 : 0.1}
            />
          </mesh>

          <mesh
            position={[0, 11.58, -2.5]}
            castShadow
            receiveShadow
            onDoubleClick={handleSurfaceDoubleClick}
          >
            <boxGeometry args={[39.4, 0.42, 16.0]} />
            <meshStandardMaterial
              map={textures.stuccoWall}
              bumpMap={textures.stuccoBump}
              bumpScale={0.025}
              roughness={0.68}
            />
          </mesh>

          <mesh position={[0, 11.78, 5.56]} castShadow>
            <boxGeometry args={[39.5, 0.56, 0.18]} />
            <meshStandardMaterial color="#161c28" metalness={0.72} roughness={0.3} />
          </mesh>

          {/* Rooftop Full-Width Warm Gold & White Architectural Perimeter Trim */}
          <mesh position={[0, 11.52, 5.64]}>
            <boxGeometry args={[39.6, 0.065, 0.07]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fde68a"
              emissiveIntensity={isNight ? 1.25 : isSunset ? 0.55 : 0.12}
            />
          </mesh>
          <mesh position={[0, 12.06, 5.64]}>
            <boxGeometry args={[39.6, 0.05, 0.07]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fffbeb"
              emissiveIntensity={isNight ? 1.05 : isSunset ? 0.45 : 0.1}
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
            <boxGeometry args={[38.8, 1.05, 0.06]} />
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
