"use client";

import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  findWaypointPath,
  OFFICE_WAYPOINTS,
} from "@/lib/data/initial-office-data";
import type { OfficeAgent } from "@/types/office";

interface RobotCharacterProps {
  agent: OfficeAgent;
  isSelected: boolean;
  isSimulationRunning: boolean;
  showLabel: boolean;
  onSelect: (agentId: string) => void;
  onArrived: (agentId: string, waypointId: string) => void;
}

function lerpAngle(current: number, target: number, alpha: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

export function RobotCharacter({
  agent,
  isSelected,
  isSimulationRunning,
  showLabel,
  onSelect,
  onArrived,
}: RobotCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Navigation state kept in refs for allocation-free 60fps useFrame updates
  const initialPos =
    OFFICE_WAYPOINTS[agent.currentWaypointId]?.position ?? [0, 0, 0];
  const initialYaw = OFFICE_WAYPOINTS[agent.currentWaypointId]?.facingYaw ?? 0;

  const posRef = useRef(new THREE.Vector3(...initialPos));
  const yawRef = useRef<number>(initialYaw);
  const pathQueueRef = useRef<string[]>([]);
  const activeTargetIdRef = useRef<string>(agent.targetWaypointId);
  const walkPhaseRef = useRef<number>(0);

  // Set initial transform once on mount (subsequent transforms are driven by useFrame so React re-renders never snap walking robots back)
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.position.copy(posRef.current);
      rootRef.current.rotation.y = yawRef.current;
    }
  }, []);

  // Recalculate corridor path whenever targetWaypointId changes
  useEffect(() => {
    if (agent.targetWaypointId === activeTargetIdRef.current && pathQueueRef.current.length > 0) {
      return;
    }

    activeTargetIdRef.current = agent.targetWaypointId;

    if (agent.targetWaypointId === agent.currentWaypointId) {
      pathQueueRef.current = [];
      return;
    }

    // Find nearest waypoint to current actual world position as path start
    let nearestId = agent.currentWaypointId;
    let minDist = Infinity;
    for (const wp of Object.values(OFFICE_WAYPOINTS)) {
      const dx = wp.position[0] - posRef.current.x;
      const dz = wp.position[2] - posRef.current.z;
      const d = dx * dx + dz * dz;
      if (d < minDist) {
        minDist = d;
        nearestId = wp.id;
      }
    }

    const fullPath = findWaypointPath(nearestId, agent.targetWaypointId);
    pathQueueRef.current = fullPath.length > 1 ? fullPath.slice(1) : fullPath;
  }, [agent.currentWaypointId, agent.targetWaypointId]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.getElapsedTime();
    const isStandby = agent.status === "standby";

    let moving = false;

    // 1) Waypoint Corridor Navigation
    if (isSimulationRunning && !isStandby && pathQueueRef.current.length > 0) {
      const nextId = pathQueueRef.current[0];
      const nextNode = OFFICE_WAYPOINTS[nextId];
      if (nextNode) {
        const targetVec = new THREE.Vector3(...nextNode.position);
        const dx = targetVec.x - posRef.current.x;
        const dz = targetVec.z - posRef.current.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.08) {
          posRef.current.copy(targetVec);
          pathQueueRef.current.shift();
          if (pathQueueRef.current.length === 0) {
            onArrived(agent.id, nextId);
          }
        } else {
          moving = true;
          const speed = 2.15;
          const step = Math.min(dist, speed * dt);
          posRef.current.x += (dx / dist) * step;
          posRef.current.z += (dz / dist) * step;

          const desiredYaw = Math.atan2(dx, dz);
          yawRef.current = lerpAngle(yawRef.current, desiredYaw, Math.min(1, dt * 10));
        }
      }
    } else if (!moving) {
      // Align smoothly with current waypoint facing direction (e.g., toward desk monitor)
      const restingNode = OFFICE_WAYPOINTS[agent.currentWaypointId];
      if (restingNode) {
        yawRef.current = lerpAngle(
          yawRef.current,
          restingNode.facingYaw,
          Math.min(1, dt * 6)
        );
      }
    }

    if (rootRef.current) {
      rootRef.current.position.copy(posRef.current);
      rootRef.current.rotation.y = yawRef.current;
    }

    // 2) Procedural Articulated Animations (Walking / Working / Idle / Standby)
    if (moving) {
      walkPhaseRef.current += dt * 9.5;
      const swing = Math.sin(walkPhaseRef.current);
      const bob = Math.abs(Math.cos(walkPhaseRef.current)) * 0.055;

      if (bodyRef.current) {
        bodyRef.current.position.y = bob;
        bodyRef.current.rotation.x = 0.08;
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = swing * 0.55;
        rightLegRef.current.rotation.x = -swing * 0.55;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -swing * 0.48;
        rightArmRef.current.rotation.x = swing * 0.48;
      }
      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          Math.sin(walkPhaseRef.current * 0.5) * 0.1,
          dt * 8
        );
        headRef.current.rotation.x = THREE.MathUtils.lerp(
          headRef.current.rotation.x,
          0,
          dt * 8
        );
      }
    } else if (agent.status === "working" && isSimulationRunning) {
      // Active simulated typing & dual-monitor scan animation
      const breathe = Math.sin(t * 2.6) * 0.02;
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0.12,
          dt * 6
        );
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          dt * 8
        );
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          dt * 8
        );
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -0.75 + Math.sin(t * 11) * 0.12;
        rightArmRef.current.rotation.x = -0.75 + Math.cos(t * 11.5) * 0.12;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.4) * 0.24;
        headRef.current.rotation.x = 0.08;
      }
    } else if (isStandby) {
      // Low-power standby pose
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(
          bodyRef.current.position.y,
          -0.03,
          dt * 4
        );
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0.06,
          dt * 4
        );
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          0.08,
          dt * 5
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.08,
          dt * 5
        );
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          dt * 5
        );
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          dt * 5
        );
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(
          headRef.current.rotation.x,
          0.28,
          dt * 4
        );
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          dt * 4
        );
      }
    } else {
      // Calm Idle animation: smooth breathing + head scan
      const breathe = Math.sin(t * 2.1 + posRef.current.x) * 0.028;
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0,
          dt * 6
        );
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          dt * 8
        );
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          dt * 8
        );
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 1.6) * 0.08;
        rightArmRef.current.rotation.x = -Math.sin(t * 1.6) * 0.08;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.85) * 0.32;
        headRef.current.rotation.x = Math.sin(t * 1.2) * 0.05;
      }
    }

    // Pulse overhead halo & reactor core
    if (haloRef.current) {
      haloRef.current.rotation.z = t * (moving ? 2.2 : 0.9);
      const pulse = 1 + Math.sin(t * 3.5) * 0.07;
      haloRef.current.scale.set(pulse, pulse, 1);
    }
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = isStandby
        ? 0.25
        : 1.3 + Math.sin(t * 4) * 0.45;
    }
  });

  const visorIntensity = agent.status === "standby" ? 0.25 : 1.7;

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
    >
      {/* Floor selection & presence ring */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[isSelected ? 0.44 : 0.32, isSelected ? 0.56 : 0.39, 20]}
        />
        <meshBasicMaterial
          color={agent.accentColor}
          transparent
          opacity={isSelected ? 0.92 : 0.45}
          depthWrite={false}
        />
      </mesh>

      {/* Articulated Robot Body Group */}
      <group ref={bodyRef}>
        {/* ================= LEGS ================= */}
        <group ref={leftLegRef} position={[-0.13, 0.52, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.44, 0.15]} />
            <meshStandardMaterial
              color="#111c36"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.45, 0.03]}>
            <boxGeometry args={[0.16, 0.08, 0.22]} />
            <meshStandardMaterial
              color="#070d1f"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, -0.38, 0.08]}>
            <boxGeometry args={[0.12, 0.03, 0.02]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity * 0.8}
              toneMapped={false}
            />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[0.13, 0.52, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.44, 0.15]} />
            <meshStandardMaterial
              color="#111c36"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.45, 0.03]}>
            <boxGeometry args={[0.16, 0.08, 0.22]} />
            <meshStandardMaterial
              color="#070d1f"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, -0.38, 0.08]}>
            <boxGeometry args={[0.12, 0.03, 0.02]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity * 0.8}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* ================= TORSO ================= */}
        {/* Pelvis */}
        <mesh position={[0, 0.58, 0]}>
          <boxGeometry args={[0.38, 0.14, 0.22]} />
          <meshStandardMaterial
            color="#0b1429"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        {/* Main chest chassis */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.48, 0.5, 0.28]} />
          <meshStandardMaterial
            color="#152242"
            metalness={0.72}
            roughness={0.26}
          />
        </mesh>
        {/* Shoulder armor pauldrons */}
        <mesh position={[-0.31, 1.07, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.24]} />
          <meshStandardMaterial
            color={agent.secondaryColor}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.31, 1.07, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.24]} />
          <meshStandardMaterial
            color={agent.secondaryColor}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* Glowing chest reactor core */}
        <mesh position={[0, 0.92, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 6]} />
          <meshStandardMaterial
            ref={coreMatRef}
            color={agent.accentColor}
            emissive={agent.accentColor}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {/* Back power pack */}
        <mesh position={[0, 0.92, -0.17]}>
          <boxGeometry args={[0.3, 0.36, 0.1]} />
          <meshStandardMaterial
            color="#091022"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* ================= ARMS ================= */}
        <group ref={leftArmRef} position={[-0.32, 1.02, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.42, 0.13]} />
            <meshStandardMaterial
              color="#111c36"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.36, 0.04]}>
            <boxGeometry args={[0.13, 0.05, 0.06]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity}
              toneMapped={false}
            />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.32, 1.02, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.12, 0.42, 0.13]} />
            <meshStandardMaterial
              color="#111c36"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.36, 0.04]}>
            <boxGeometry args={[0.13, 0.05, 0.06]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* ================= CYBER HEAD ================= */}
        <group ref={headRef} position={[0, 1.24, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.1, 6]} />
            <meshStandardMaterial color="#0b1224" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Head casing */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.36, 0.3, 0.32]} />
            <meshStandardMaterial
              color="#162447"
              metalness={0.72}
              roughness={0.24}
            />
          </mesh>
          {/* Dark cyber visor plate */}
          <mesh position={[0, 0.14, 0.165]}>
            <boxGeometry args={[0.3, 0.14, 0.02]} />
            <meshStandardMaterial
              color="#030712"
              metalness={0.95}
              roughness={0.08}
            />
          </mesh>
          {/* Glowing dual cyber eyes */}
          <mesh position={[-0.075, 0.14, 0.18]}>
            <boxGeometry args={[0.08, 0.045, 0.015]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0.075, 0.14, 0.18]}>
            <boxGeometry args={[0.08, 0.045, 0.015]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity}
              toneMapped={false}
            />
          </mesh>
          {/* Twin antenna fins */}
          <mesh position={[-0.19, 0.24, -0.02]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.03, 0.18, 0.05]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity * 0.9}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0.19, 0.24, -0.02]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.03, 0.18, 0.05]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorIntensity * 0.9}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Overhead Holographic Status Halo */}
        <mesh
          ref={haloRef}
          position={[0, 1.72, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.14, 0.19, 6]} />
          <meshBasicMaterial
            color={agent.status === "standby" ? "#64748b" : agent.accentColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating Compact Robot Nameplate */}
      {showLabel && (
        <Html
          position={[0, 2.08, 0]}
          center
          distanceFactor={13}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-lg backdrop-blur-sm whitespace-nowrap transition-all ${
              isSelected
                ? "border-cyan-300 bg-[#07142e]/95 text-white scale-105"
                : "border-slate-600/60 bg-[#050b1c]/85 text-slate-200"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: agent.accentColor }}
            />
            <span>{agent.name}</span>
            <span className="rounded bg-purple-500/25 px-1 text-[8px] uppercase text-purple-200">
              SIM
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
