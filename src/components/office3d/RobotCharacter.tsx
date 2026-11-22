"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  OFFICE_WAYPOINTS,
  findWaypointPath,
} from "@/lib/data/initial-office-data";
import type { OfficeAgent, Vector3Tuple } from "@/types/office";

interface RobotCharacterProps {
  agent: OfficeAgent;
  isSelected: boolean;
  isSimulationRunning: boolean;
  showLabels: boolean;
  onSelect: (agentId: string) => void;
  onFocusPoint?: (point: Vector3Tuple) => void;
  onArrive: (agentId: string, waypointId: string) => void;
}

export function RobotCharacter({
  agent,
  isSelected,
  isSimulationRunning,
  showLabels,
  onSelect,
  onFocusPoint,
  onArrive,
}: RobotCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const initialPos = useMemo(() => {
    const wp = OFFICE_WAYPOINTS[agent.currentWaypointId];
    return wp ? [...wp.position] : [0, 3.9, 0];
  }, [agent.currentWaypointId]);

  const currentPosRef = useRef(
    new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2])
  );
  const pathQueueRef = useRef<string[]>([]);
  const lastTargetRef = useRef<string>(agent.targetWaypointId);
  const arrivedSentRef = useRef<boolean>(true);
  const phaseOffset = useMemo(
    () => (agent.id.charCodeAt(agent.id.length - 1) % 10) * 0.75,
    [agent.id]
  );

  useEffect(() => {
    if (agent.targetWaypointId === lastTargetRef.current) return;
    lastTargetRef.current = agent.targetWaypointId;

    const targetWp = OFFICE_WAYPOINTS[agent.targetWaypointId];
    if (!targetWp) return;

    const currentWp = OFFICE_WAYPOINTS[agent.currentWaypointId];
    if (currentWp && currentWp.floor !== targetWp.floor) {
      currentPosRef.current.set(
        targetWp.position[0],
        targetWp.position[1],
        targetWp.position[2]
      );
      pathQueueRef.current = [];
      arrivedSentRef.current = false;
      onArrive(agent.id, agent.targetWaypointId);
      return;
    }

    const path = findWaypointPath(
      agent.currentWaypointId,
      agent.targetWaypointId
    );
    pathQueueRef.current = path.slice(1);
    arrivedSentRef.current = false;
  }, [agent.currentWaypointId, agent.id, agent.targetWaypointId, onArrive]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + phaseOffset;

    let isMoving = false;
    if (isSimulationRunning && pathQueueRef.current.length > 0) {
      const nextWpId = pathQueueRef.current[0];
      const nextWp = OFFICE_WAYPOINTS[nextWpId];
      if (nextWp) {
        const dest = new THREE.Vector3(
          nextWp.position[0],
          nextWp.position[1],
          nextWp.position[2]
        );
        const dir = dest.clone().sub(currentPosRef.current);
        const dist = dir.length();
        const speed = 2.15;

        if (dist <= 0.14) {
          currentPosRef.current.copy(dest);
          pathQueueRef.current.shift();
          if (pathQueueRef.current.length === 0 && !arrivedSentRef.current) {
            arrivedSentRef.current = true;
            onArrive(agent.id, nextWpId);
          }
        } else {
          isMoving = true;
          dir.normalize();
          currentPosRef.current.addScaledVector(dir, speed * dt);
          const targetAngle = Math.atan2(dir.x, dir.z);
          let diff = targetAngle - root.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          root.rotation.y += diff * Math.min(1, dt * 10);
        }
      }
    } else if (agent.status === "working") {
      const targetAngle = Math.PI;
      let diff = targetAngle - root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      root.rotation.y += diff * Math.min(1, dt * 8);
    }

    const isWorkingSeated = !isMoving && agent.status === "working";
    const verticalOffset = isMoving
      ? Math.abs(Math.sin(t * 7.2)) * 0.04
      : isWorkingSeated
      ? -0.22
      : 0;

    root.position.set(
      currentPosRef.current.x,
      currentPosRef.current.y + verticalOffset,
      currentPosRef.current.z
    );

    if (isMoving) {
      const stride = Math.sin(t * 7.2);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.56;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.56;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -stride * 0.44;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = stride * 0.44;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.05;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
      }
    } else if (isWorkingSeated) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.25;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.25;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 9.5) * 0.07;
        leftArmRef.current.rotation.z = -0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.82 + Math.cos(t * 9.5) * 0.07;
        rightArmRef.current.rotation.z = 0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.12;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.18;
      }
    } else {
      const breathe = Math.sin(t * 2.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.04 + breathe * 0.02;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.04 - breathe * 0.02;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0;
        torsoRef.current.position.y = 1.02 + breathe * 0.012;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.7) * 0.24;
      }
    }
  });

  const { skinColor, hairColor, hairStyle, suitColor, shirtColor, pantsColor } =
    agent.appearance;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(agent.id);
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(agent.id);
    onFocusPoint?.([
      currentPosRef.current.x,
      currentPosRef.current.y + 1.15,
      currentPosRef.current.z,
    ]);
  };

  const statusDotColor =
    agent.status === "working"
      ? "#10b981"
      : agent.status === "walking"
      ? "#38bdf8"
      : agent.status === "idle"
      ? "#f59e0b"
      : "#94a3b8";

  return (
    <group
      ref={rootRef}
      position={[initialPos[0], initialPos[1], initialPos[2]]}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.56, 28]} />
          <meshBasicMaterial color={agent.accentColor} transparent opacity={0.9} />
        </mesh>
      )}

      {/* SCULPTED LEFT LEG + DRESS SHOE */}
      <group ref={leftLegRef} position={[-0.1, 0.79, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.52, 8, 12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        <mesh position={[0, -0.71, 0.045]} castShadow>
          <capsuleGeometry args={[0.055, 0.12, 6, 10]} />
          <meshStandardMaterial color="#18191d" roughness={0.28} metalness={0.2} />
        </mesh>
      </group>

      {/* SCULPTED RIGHT LEG + DRESS SHOE */}
      <group ref={rightLegRef} position={[0.1, 0.79, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.52, 8, 12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        <mesh position={[0, -0.71, 0.045]} castShadow>
          <capsuleGeometry args={[0.055, 0.12, 6, 10]} />
          <meshStandardMaterial color="#18191d" roughness={0.28} metalness={0.2} />
        </mesh>
      </group>

      {/* SCULPTED ANATOMICAL TORSO & TAILORED BLAZER */}
      <group ref={torsoRef} position={[0, 1.02, 0]}>
        {/* Sculpted waist / belt */}
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry args={[0.155, 0.165, 0.22, 14]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.162, 0.162, 0.04, 14]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} />
        </mesh>

        {/* Rounded Tapered Sculpted Blazer Chest & Shoulders */}
        <mesh position={[0, 0.14, 0]} scale={[1.22, 1, 0.74]} castShadow>
          <cylinderGeometry args={[0.185, 0.145, 0.5, 16]} />
          <meshStandardMaterial color={suitColor} roughness={0.66} />
        </mesh>
        {/* Rounded Shoulder Cap */}
        <mesh position={[0, 0.35, 0]} scale={[1.28, 0.48, 0.74]} castShadow>
          <sphereGeometry args={[0.185, 16, 12]} />
          <meshStandardMaterial color={suitColor} roughness={0.66} />
        </mesh>

        {/* Crisp Shirt V-Front & Collar */}
        <mesh position={[0, 0.22, 0.112]}>
          <boxGeometry args={[0.11, 0.3, 0.035]} />
          <meshStandardMaterial color={shirtColor} roughness={0.55} />
        </mesh>
        {/* Tie / Accent */}
        <mesh position={[0, 0.17, 0.132]}>
          <boxGeometry args={[0.04, 0.24, 0.014]} />
          <meshStandardMaterial color={agent.accentColor} roughness={0.42} />
        </mesh>
        {/* Corporate ID Lanyard Badge */}
        <mesh position={[0.11, 0.21, 0.13]}>
          <boxGeometry args={[0.06, 0.085, 0.012]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>

        {/* LEFT ARM (Smooth Capsule + Shirt Cuff + Hand) */}
        <group ref={leftArmRef} position={[-0.24, 0.33, 0]}>
          <mesh position={[0, -0.23, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.38, 8, 12]} />
            <meshStandardMaterial color={suitColor} roughness={0.66} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.05, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.72} />
          </mesh>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightArmRef} position={[0.24, 0.33, 0]}>
          <mesh position={[0, -0.23, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.38, 8, 12]} />
            <meshStandardMaterial color={suitColor} roughness={0.66} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.05, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.72} />
          </mesh>
        </group>

        {/* NECK & SCULPTED REALISTIC HEAD */}
        <group ref={headRef} position={[0, 0.43, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.054, 0.064, 0.12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
          {/* Oval Human Head */}
          <mesh position={[0, 0.19, 0]} scale={[0.92, 1.06, 0.96]} castShadow>
            <sphereGeometry args={[0.14, 18, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.66} />
          </mesh>
          {/* Ears */}
          {[-0.128, 0.128].map((ex, i) => (
            <mesh key={i} position={[ex, 0.18, -0.01]}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
          ))}
          {/* Subtle Nose Bridge */}
          <mesh position={[0, 0.175, 0.132]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>
          {/* Eyes & Brows */}
          <mesh position={[-0.044, 0.2, 0.122]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>
          <mesh position={[0.044, 0.2, 0.122]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>

          {/* Sculpted Hairstyles */}
          {hairStyle === "short" && (
            <group>
              <mesh position={[0, 0.255, -0.012]} scale={[0.96, 1.0, 1.0]} castShadow>
                <sphereGeometry
                  args={[0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.82} />
              </mesh>
              <mesh position={[0, 0.2, -0.095]}>
                <boxGeometry args={[0.22, 0.14, 0.1]} />
                <meshStandardMaterial color={hairColor} roughness={0.82} />
              </mesh>
            </group>
          )}

          {hairStyle === "bob" && (
            <group>
              <mesh position={[0, 0.24, -0.02]} scale={[0.98, 1.05, 1.0]} castShadow>
                <sphereGeometry args={[0.15, 16, 14]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[-0.115, 0.14, -0.02]} castShadow>
                <capsuleGeometry args={[0.04, 0.14, 6, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0.115, 0.14, -0.02]} castShadow>
                <capsuleGeometry args={[0.04, 0.14, 6, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
            </group>
          )}

          {hairStyle === "ponytail" && (
            <group>
              <mesh position={[0, 0.25, -0.02]} castShadow>
                <sphereGeometry
                  args={[0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.21, -0.15]} rotation={[0.38, 0, 0]} castShadow>
                <capsuleGeometry args={[0.05, 0.16, 6, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
            </group>
          )}

          {hairStyle === "executive" && (
            <group>
              <mesh position={[0, 0.26, -0.01]} castShadow>
                <sphereGeometry
                  args={[0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
              <mesh position={[0, 0.3, 0.04]} castShadow>
                <boxGeometry args={[0.18, 0.05, 0.15]} />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {showLabels && (
        <Html
          position={[0, 1.98, 0]}
          center
          distanceFactor={16}
          zIndexRange={[10, 0]}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(agent.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onFocusPoint?.([
                currentPosRef.current.x,
                currentPosRef.current.y + 1.15,
                currentPosRef.current.z,
              ]);
            }}
            className={`pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-lg backdrop-blur-md transition ${
              isSelected
                ? "border-sky-300 bg-slate-900/92 text-white ring-2 ring-sky-400/50"
                : "border-white/25 bg-slate-900/72 text-slate-100 hover:bg-slate-900/90"
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusDotColor }}
            />
            <span>{agent.name}</span>
            {isSelected && (
              <span className="rounded bg-white/15 px-1 text-[8px] font-bold uppercase tracking-wider text-sky-200">
                SIM
              </span>
            )}
          </button>
        </Html>
      )}
    </group>
  );
}
