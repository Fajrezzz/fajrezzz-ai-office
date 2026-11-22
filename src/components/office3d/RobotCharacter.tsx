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
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const initialPos =
    OFFICE_WAYPOINTS[agent.currentWaypointId]?.position ?? [0, 0, 0];
  const initialYaw = OFFICE_WAYPOINTS[agent.currentWaypointId]?.facingYaw ?? 0;

  const posRef = useRef(new THREE.Vector3(...initialPos));
  const yawRef = useRef<number>(initialYaw);
  const pathQueueRef = useRef<string[]>([]);
  const activeTargetIdRef = useRef<string>(agent.targetWaypointId);
  const walkPhaseRef = useRef<number>(0);

  // Set initial transform once on mount so React re-renders never snap walking robots back
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.position.copy(posRef.current);
      rootRef.current.rotation.y = yawRef.current;
    }
  }, []);

  // Recalculate corridor path whenever targetWaypointId changes
  useEffect(() => {
    if (
      agent.targetWaypointId === activeTargetIdRef.current &&
      pathQueueRef.current.length > 0
    ) {
      return;
    }

    activeTargetIdRef.current = agent.targetWaypointId;

    if (agent.targetWaypointId === agent.currentWaypointId) {
      pathQueueRef.current = [];
      return;
    }

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
          const speed = 2.1;
          const step = Math.min(dist, speed * dt);
          posRef.current.x += (dx / dist) * step;
          posRef.current.z += (dz / dist) * step;

          const desiredYaw = Math.atan2(dx, dz);
          yawRef.current = lerpAngle(
            yawRef.current,
            desiredYaw,
            Math.min(1, dt * 10)
          );
        }
      }
    } else if (!moving) {
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

    if (moving) {
      walkPhaseRef.current += dt * 9.2;
      const swing = Math.sin(walkPhaseRef.current);
      const bob = Math.abs(Math.cos(walkPhaseRef.current)) * 0.05;

      if (bodyRef.current) {
        bodyRef.current.position.y = bob;
        bodyRef.current.rotation.x = 0.07;
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = swing * 0.52;
        rightLegRef.current.rotation.x = -swing * 0.52;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -swing * 0.44;
        rightArmRef.current.rotation.x = swing * 0.44;
      }
      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          Math.sin(walkPhaseRef.current * 0.5) * 0.08,
          dt * 8
        );
        headRef.current.rotation.x = THREE.MathUtils.lerp(
          headRef.current.rotation.x,
          0,
          dt * 8
        );
      }
    } else if (agent.status === "working" && isSimulationRunning) {
      const breathe = Math.sin(t * 2.5) * 0.018;
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0.11,
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
        leftArmRef.current.rotation.x = -0.72 + Math.sin(t * 10.5) * 0.11;
        rightArmRef.current.rotation.x = -0.72 + Math.cos(t * 11) * 0.11;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.35) * 0.22;
        headRef.current.rotation.x = 0.08;
      }
    } else if (isStandby) {
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(
          bodyRef.current.position.y,
          -0.025,
          dt * 4
        );
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          0.05,
          dt * 4
        );
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          0.06,
          dt * 5
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.06,
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
          0.25,
          dt * 4
        );
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          0,
          dt * 4
        );
      }
    } else {
      const breathe = Math.sin(t * 2.0 + posRef.current.x) * 0.024;
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
        leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.07;
        rightArmRef.current.rotation.x = -Math.sin(t * 1.5) * 0.07;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.3;
        headRef.current.rotation.x = Math.sin(t * 1.15) * 0.05;
      }
    }

    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = isStandby
        ? 0.2
        : 1.15 + Math.sin(t * 3.5) * 0.35;
    }
  });

  const visorGlow = agent.status === "standby" ? 0.25 : 1.5;

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
    >
      {/* Subtle selection ring + contact shadow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 18]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.48, 24]} />
          <meshBasicMaterial
            color={agent.accentColor}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Sleek Rounded Real-World Ceramic-White & Titanium Humanoid Droid */}
      <group ref={bodyRef}>
        {/* ================= LEGS (Smooth Rounded Cylinders + Joints) ================= */}
        <group ref={leftLegRef} position={[-0.12, 0.56, 0]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.055, 0.44, 12]} />
            <meshPhysicalMaterial
              color="#f1f5f9"
              roughness={0.22}
              metalness={0.1}
              clearcoat={0.85}
            />
          </mesh>
          <mesh position={[0, -0.49, 0.03]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.22]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[0.12, 0.56, 0]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.055, 0.44, 12]} />
            <meshPhysicalMaterial
              color="#f1f5f9"
              roughness={0.22}
              metalness={0.1}
              clearcoat={0.85}
            />
          </mesh>
          <mesh position={[0, -0.49, 0.03]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.22]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>

        {/* ================= TORSO (Tapered Ceramic Shell + Brushed Titanium) ================= */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.14, 14]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.94, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.16, 0.52, 16]} />
          <meshPhysicalMaterial
            color="#f8fafc"
            roughness={0.18}
            metalness={0.08}
            clearcoat={0.95}
            clearcoatRoughness={0.08}
          />
        </mesh>
        {/* Subtle color-coded titanium chest badge */}
        <mesh position={[0, 0.96, 0.195]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 14]} />
          <meshStandardMaterial
            ref={coreMatRef}
            color={agent.accentColor}
            emissive={agent.accentColor}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* ================= ARMS ================= */}
        <group ref={leftArmRef} position={[-0.28, 1.1, 0]}>
          <mesh>
            <sphereGeometry args={[0.072, 12, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.056, 0.045, 0.4, 12]} />
            <meshPhysicalMaterial
              color="#f1f5f9"
              roughness={0.2}
              clearcoat={0.85}
            />
          </mesh>
          <mesh position={[0, -0.43, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.3} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.28, 1.1, 0]}>
          <mesh>
            <sphereGeometry args={[0.072, 12, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.056, 0.045, 0.4, 12]} />
            <meshPhysicalMaterial
              color="#f1f5f9"
              roughness={0.2}
              clearcoat={0.85}
            />
          </mesh>
          <mesh position={[0, -0.43, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.3} />
          </mesh>
        </group>

        {/* ================= SMOOTH ROUNDED HEAD & OBSIDIAN GLASS VISOR ================= */}
        <group ref={headRef} position={[0, 1.26, 0]}>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
          </mesh>
          {/* Smooth rounded helmet head */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <sphereGeometry args={[0.19, 18, 16]} />
            <meshPhysicalMaterial
              color="#f8fafc"
              roughness={0.14}
              metalness={0.08}
              clearcoat={1}
              clearcoatRoughness={0.06}
            />
          </mesh>
          {/* Glossy curved dark obsidian visor */}
          <mesh position={[0, 0.16, 0.07]} scale={[0.92, 0.56, 0.85]}>
            <sphereGeometry args={[0.175, 16, 12]} />
            <meshPhysicalMaterial
              color="#0b1120"
              metalness={0.9}
              roughness={0.06}
              clearcoat={1}
            />
          </mesh>
          {/* Expressive soft glowing eyes */}
          <mesh position={[-0.06, 0.165, 0.21]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorGlow}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0.06, 0.165, 0.21]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial
              color={agent.accentColor}
              emissive={agent.accentColor}
              emissiveIntensity={visorGlow}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* Compact Nameplate */}
      {showLabel && (
        <Html
          position={[0, 1.85, 0]}
          center
          distanceFactor={13}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-lg backdrop-blur-sm whitespace-nowrap transition-all ${
              isSelected
                ? "border-amber-300 bg-slate-950/92 text-white scale-105"
                : "border-slate-600/60 bg-slate-950/80 text-slate-200"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: agent.accentColor }}
            />
            <span>{agent.name}</span>
            <span className="rounded bg-amber-400/20 px-1 text-[8px] uppercase text-amber-200">
              SIM
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
