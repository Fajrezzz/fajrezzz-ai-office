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

  // Recalculate waypoint path whenever target changes
  useEffect(() => {
    if (agent.targetWaypointId === lastTargetRef.current) return;
    lastTargetRef.current = agent.targetWaypointId;

    const targetWp = OFFICE_WAYPOINTS[agent.targetWaypointId];
    if (!targetWp) return;

    const currentWp = OFFICE_WAYPOINTS[agent.currentWaypointId];
    if (currentWp && currentWp.floor !== targetWp.floor) {
      // Cross-floor transition: move directly to destination floor waypoint
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
      // Face workstation monitors (toward -Z)
      const targetAngle = Math.PI;
      let diff = targetAngle - root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      root.rotation.y += diff * Math.min(1, dt * 8);
    }

    // Apply position + subtle walking bob or working seated crouch
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

    // Limb & torso kinematics
    if (isMoving) {
      const stride = Math.sin(t * 7.2);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.56;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.56;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -stride * 0.44;
        leftArmRef.current.rotation.z = 0.06;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = stride * 0.44;
        rightArmRef.current.rotation.z = -0.06;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.05;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
      }
    } else if (isWorkingSeated) {
      // Seated typing posture at desk
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.25;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.25;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 9.5) * 0.07;
        leftArmRef.current.rotation.z = -0.1;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.82 + Math.cos(t * 9.5) * 0.07;
        rightArmRef.current.rotation.z = 0.1;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.12;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.18;
      }
    } else {
      // Poised standing idle breathing
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
      {/* Subtle selection ring on floor */}
      {isSelected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.56, 28]} />
          <meshBasicMaterial color={agent.accentColor} transparent opacity={0.9} />
        </mesh>
      )}

      {/* LEFT LEG */}
      <group ref={leftLegRef} position={[-0.11, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.52, 6, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.78} />
        </mesh>
        {/* Leather dress shoe */}
        <mesh position={[0, -0.71, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.09, 0.24]} />
          <meshStandardMaterial color="#18191d" roughness={0.32} metalness={0.2} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightLegRef} position={[0.11, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.52, 6, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.78} />
        </mesh>
        <mesh position={[0, -0.71, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.09, 0.24]} />
          <meshStandardMaterial color="#18191d" roughness={0.32} metalness={0.2} />
        </mesh>
      </group>

      {/* TORSO & TAILORED BLAZER */}
      <group ref={torsoRef} position={[0, 1.02, 0]}>
        {/* Hips / waist */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.16, 0.22, 12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>

        {/* Tailored Jacket Torso */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.42, 0.5, 0.23]} />
          <meshStandardMaterial color={suitColor} roughness={0.68} />
        </mesh>

        {/* Crisp Shirt Front V-Collar */}
        <mesh position={[0, 0.2, 0.112]}>
          <boxGeometry args={[0.14, 0.34, 0.03]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>

        {/* Corporate Accent Tie / Lanyard ID Card */}
        <mesh position={[0, 0.15, 0.132]}>
          <boxGeometry args={[0.045, 0.24, 0.015]} />
          <meshStandardMaterial color={agent.accentColor} roughness={0.45} />
        </mesh>
        <mesh position={[0.11, 0.22, 0.128]}>
          <boxGeometry args={[0.065, 0.09, 0.012]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>

        {/* LEFT ARM */}
        <group ref={leftArmRef} position={[-0.27, 0.32, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.4, 6, 10]} />
            <meshStandardMaterial color={suitColor} roughness={0.68} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.056, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.72} />
          </mesh>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightArmRef} position={[0.27, 0.32, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.4, 6, 10]} />
            <meshStandardMaterial color={suitColor} roughness={0.68} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.056, 10, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.72} />
          </mesh>
        </group>

        {/* NECK & SCULPTED HEAD */}
        <group ref={headRef} position={[0, 0.44, 0]}>
          {/* Neck */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.058, 0.068, 0.12, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.72} />
          </mesh>

          {/* Sculpted Head */}
          <mesh position={[0, 0.19, 0]} castShadow>
            <sphereGeometry args={[0.145, 16, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>

          {/* Subtle Eyes */}
          <mesh position={[-0.048, 0.2, 0.128]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>
          <mesh position={[0.048, 0.2, 0.128]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>

          {/* Distinct Sculpted Hair Styles */}
          {hairStyle === "short" && (
            <group>
              <mesh position={[0, 0.255, -0.015]} castShadow>
                <sphereGeometry args={[0.148, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
                <meshStandardMaterial color={hairColor} roughness={0.82} />
              </mesh>
              <mesh position={[0, 0.2, -0.095]}>
                <boxGeometry args={[0.24, 0.14, 0.12]} />
                <meshStandardMaterial color={hairColor} roughness={0.82} />
              </mesh>
            </group>
          )}

          {hairStyle === "bob" && (
            <group>
              <mesh position={[0, 0.24, -0.02]} castShadow>
                <sphereGeometry args={[0.158, 14, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[-0.12, 0.14, -0.02]} castShadow>
                <boxGeometry args={[0.07, 0.2, 0.18]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0.12, 0.14, -0.02]} castShadow>
                <boxGeometry args={[0.07, 0.2, 0.18]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
            </group>
          )}

          {hairStyle === "ponytail" && (
            <group>
              <mesh position={[0, 0.25, -0.02]} castShadow>
                <sphereGeometry args={[0.15, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.22, -0.16]} rotation={[0.35, 0, 0]} castShadow>
                <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
            </group>
          )}

          {hairStyle === "executive" && (
            <group>
              <mesh position={[0, 0.26, -0.01]} castShadow>
                <sphereGeometry args={[0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
              <mesh position={[0, 0.29, 0.04]} castShadow>
                <boxGeometry args={[0.2, 0.06, 0.16]} />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* Crisp Floating Nameplate (visible when showLabels is on) */}
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
