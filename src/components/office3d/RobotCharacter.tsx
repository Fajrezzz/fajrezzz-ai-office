"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

/** Only these real chair / workstation waypoints allow an agent to sit down. */
const SEATED_WAYPOINT_IDS = new Set([
  "wp-ws-01",
  "wp-ws-02",
  "wp-ws-03",
  "wp-ws-04",
  "wp-ws-05",
  "wp-ws-06",
  "wp-ws-07",
  "wp-ws-08",
  "wp-seat-01",
  "wp-seat-02",
  "wp-seat-03",
  "wp-seat-04",
  "wp-seat-05",
  "wp-seat-06",
  "wp-seat-07",
  "wp-seat-08",
  "wp-l1-seat",
  "wp-l3-boardroom",
]);

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
  const rightElbowRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const coffeeMugRef = useRef<THREE.Group>(null);
  const steam1Ref = useRef<THREE.Mesh>(null);
  const steam2Ref = useRef<THREE.Mesh>(null);

  const initialPos = useMemo(() => {
    const wp = OFFICE_WAYPOINTS[agent.currentWaypointId];
    return wp ? [...wp.position] : [0, 3.9, 0];
  }, [agent.currentWaypointId]);

  const currentPosRef = useRef(
    new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2])
  );
  const pathQueueRef = useRef<string[]>([]);
  // IMPORTANT: initialize to currentWaypointId (NOT targetWaypointId) so if Bos
  // ordered work on the Komando tab before mounting Kantor 3D, the agent IMMEDIATELY
  // calculates the path and walks to their desk on mount!
  const lastTargetRef = useRef<string>(agent.currentWaypointId);
  const arrivedSentRef = useRef<boolean>(
    agent.currentWaypointId === agent.targetWaypointId
  );
  const phaseOffset = useMemo(
    () => (agent.id.charCodeAt(agent.id.length - 1) % 10) * 0.75,
    [agent.id]
  );

  // Distance-tiered label LOD (near = full name, mid = compact initial badge, far = hidden unless selected)
  const [labelTier, setLabelTier] = useState<"near" | "mid" | "far">("mid");
  const labelTierRef = useRef<"near" | "mid" | "far">("mid");
  const distCheckAccumRef = useRef(0);

  const initials = useMemo(() => {
    const parts = agent.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return agent.name.slice(0, 2).toUpperCase();
  }, [agent.name]);

  const roleOffsetY = useMemo(() => {
    let h = 0;
    for (let i = 0; i < agent.id.length; i += 1) {
      h = (h * 31 + agent.id.charCodeAt(i)) % 7;
    }
    return 1.98 + (h % 3) * 0.08;
  }, [agent.id]);

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

    // Throttled camera distance check for clean, non-overlapping billboard labels
    distCheckAccumRef.current += dt;
    if (distCheckAccumRef.current > 0.18) {
      distCheckAccumRef.current = 0;
      const camDist = state.camera.position.distanceTo(currentPosRef.current);
      const nextTier: "near" | "mid" | "far" =
        camDist < 17.5 ? "near" : camDist < 44 ? "mid" : "far";
      if (nextTier !== labelTierRef.current) {
        labelTierRef.current = nextTier;
        setLabelTier(nextTier);
      }
    }

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
        const speed = 3.5;

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
    } else if (agent.status === "working" || agent.status === "error") {
      const targetAngle = Math.PI;
      let diff = targetAngle - root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      root.rotation.y += diff * Math.min(1, dt * 8);
    } else if (agent.status === "idle") {
      // Face the lounge chair / coffee table direction cleanly
      const seatWp = OFFICE_WAYPOINTS[agent.currentWaypointId];
      const targetAngle = seatWp?.facingYaw ?? Math.PI;
      let diff = targetAngle - root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      root.rotation.y += diff * Math.min(1, dt * 6);
    }

    const hasRealChairHere = SEATED_WAYPOINT_IDS.has(agent.currentWaypointId);
    const isWorkingSeated =
      !isMoving &&
      hasRealChairHere &&
      (agent.status === "working" || agent.status === "error");
    const isIdleSeatedCoffee =
      !isMoving && hasRealChairHere && agent.status === "idle";
    const verticalOffset = isMoving
      ? Math.abs(Math.sin(t * 7.8)) * 0.04
      : isWorkingSeated
      ? -0.23
      : isIdleSeatedCoffee
      ? -0.24
      : 0;

    root.position.set(
      currentPosRef.current.x,
      currentPosRef.current.y + verticalOffset,
      currentPosRef.current.z
    );

    if (coffeeMugRef.current) {
      coffeeMugRef.current.visible = isIdleSeatedCoffee;
    }

    if (isMoving) {
      const stride = Math.sin(t * 7.8);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.56;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.56;
      if (leftKneeRef.current)
        leftKneeRef.current.rotation.x = Math.max(0, -stride * 0.45);
      if (rightKneeRef.current)
        rightKneeRef.current.rotation.x = Math.max(0, stride * 0.45);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -stride * 0.44;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = stride * 0.44;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.18;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.05;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
        headRef.current.rotation.x = 0;
      }
    } else if (isWorkingSeated) {
      // Natural 90-degree bent knees seated at workstation desk
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.48;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.48;
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = 1.48;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = 1.48;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.78 + Math.sin(t * 10.5) * 0.07;
        leftArmRef.current.rotation.z = -0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.35 + Math.cos(t * 10.5) * 0.05;
        rightArmRef.current.rotation.z = 0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.68 + Math.sin(t * 10.5) * 0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.1;
        torsoRef.current.position.y = 1.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.18;
        headRef.current.rotation.x = 0.08;
      }
    } else if (isIdleSeatedCoffee) {
      // REAL 90-DEGREE SEATED RELAXED POSE WITH BENT ELBOW & COFFEE MUG
      const breathe = Math.sin(t * 1.9);
      const sipCycle = (t * 0.22) % 1; // 1 sip every ~4.5 seconds
      const sipLift =
        sipCycle < 0.28 ? Math.sin((sipCycle / 0.28) * Math.PI) : 0;

      // Thighs flat on seat cushion, shins bent 90 degrees straight down
      if (leftLegRef.current) leftLegRef.current.rotation.x = -1.48;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -1.48;
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = 1.48;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = 1.48;

      // Left arm rests relaxed on armrest / lap
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.52 + breathe * 0.03;
        leftArmRef.current.rotation.z = 0.12;
      }

      // Right arm bends naturally at elbow to hold mug in front of torso, then lifts to sip
      const upperArmX = -0.26 - sipLift * 0.34 + breathe * 0.02;
      const elbowX = -1.16 - sipLift * 0.52;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = upperArmX;
        rightArmRef.current.rotation.z = 0.14 + sipLift * 0.12;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = elbowX;
      }

      // Keep coffee mug strictly upright so espresso never spills
      if (coffeeMugRef.current) {
        coffeeMugRef.current.rotation.x = -(upperArmX + elbowX);
      }

      // Animate rising warm coffee steam puffs
      if (steam1Ref.current) {
        const s1 = (t * 0.7) % 1;
        steam1Ref.current.position.y = 0.08 + s1 * 0.13;
        steam1Ref.current.position.x = Math.sin(t * 2.4) * 0.014;
        const sc1 = 0.6 + s1 * 0.8;
        steam1Ref.current.scale.set(sc1, sc1, sc1);
      }
      if (steam2Ref.current) {
        const s2 = (t * 0.7 + 0.5) % 1;
        steam2Ref.current.position.y = 0.08 + s2 * 0.13;
        steam2Ref.current.position.x = Math.cos(t * 2.1) * 0.014;
        const sc2 = 0.6 + s2 * 0.8;
        steam2Ref.current.scale.set(sc2, sc2, sc2);
      }

      if (torsoRef.current) {
        torsoRef.current.rotation.x = -0.05;
        torsoRef.current.position.y = 1.02 + breathe * 0.01;
      }
      if (headRef.current) {
        headRef.current.rotation.y =
          (1 - sipLift) * Math.sin(t * 0.55) * 0.24;
        headRef.current.rotation.x = -sipLift * 0.1;
      }
    } else {
      // Standing upright cleanly (never float-sit without a real chair!)
      const breathe = Math.sin(t * 2.0);
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = 0;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = 0;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.04 + breathe * 0.02;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.04 - breathe * 0.02;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.06;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0;
        torsoRef.current.position.y = 1.02 + breathe * 0.012;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.65) * 0.22;
        headRef.current.rotation.x = 0;
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
      : agent.status === "error"
      ? "#ef4444"
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
      {/* Subtle Role-Colored Ground Presence Ring (Red when division failed) */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[isSelected ? 0.42 : 0.34, isSelected ? 0.56 : 0.41, 24]} />
        <meshBasicMaterial
          color={agent.status === "error" ? "#ef4444" : agent.accentColor}
          transparent
          opacity={agent.status === "error" || isSelected ? 0.92 : 0.42}
        />
      </mesh>

      {/* ARTICULATED LEFT LEG (THIGH + HINGED 90° KNEE SHIN + DRESS SHOE) */}
      <group ref={leftLegRef} position={[-0.1, 0.79, 0]}>
        {/* Upper Thigh */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.24, 8, 12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        {/* Hinged Knee Joint -> Lower Shin + Dress Shoe */}
        <group ref={leftKneeRef} position={[0, -0.36, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.24, 8, 10]} />
            <meshStandardMaterial color={pantsColor} roughness={0.78} />
          </mesh>
          <mesh position={[0, -0.35, 0.045]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 6, 10]} />
            <meshStandardMaterial color="#18191d" roughness={0.28} metalness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ARTICULATED RIGHT LEG (THIGH + HINGED 90° KNEE SHIN + DRESS SHOE) */}
      <group ref={rightLegRef} position={[0.1, 0.79, 0]}>
        {/* Upper Thigh */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.072, 0.24, 8, 12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        {/* Hinged Knee Joint -> Lower Shin + Dress Shoe */}
        <group ref={rightKneeRef} position={[0, -0.36, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.24, 8, 10]} />
            <meshStandardMaterial color={pantsColor} roughness={0.78} />
          </mesh>
          <mesh position={[0, -0.35, 0.045]} castShadow>
            <capsuleGeometry args={[0.052, 0.12, 6, 10]} />
            <meshStandardMaterial color="#18191d" roughness={0.28} metalness={0.2} />
          </mesh>
        </group>
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
        {/* Role-Colored Accent Tie & Shoulder Trim for High Readability */}
        <mesh position={[0, 0.17, 0.132]}>
          <boxGeometry args={[0.044, 0.25, 0.016]} />
          <meshStandardMaterial
            color={agent.accentColor}
            emissive={agent.accentColor}
            emissiveIntensity={0.35}
            roughness={0.36}
          />
        </mesh>
        {/* Crisp Role-Colored Collar Piping on Shoulders */}
        <mesh position={[-0.17, 0.36, 0.02]} rotation={[0, 0, 0.16]}>
          <boxGeometry args={[0.08, 0.025, 0.08]} />
          <meshStandardMaterial
            color={agent.accentColor}
            emissive={agent.accentColor}
            emissiveIntensity={0.45}
            roughness={0.32}
          />
        </mesh>
        <mesh position={[0.17, 0.36, 0.02]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[0.08, 0.025, 0.08]} />
          <meshStandardMaterial
            color={agent.accentColor}
            emissive={agent.accentColor}
            emissiveIntensity={0.45}
            roughness={0.32}
          />
        </mesh>
        {/* Corporate ID Lanyard Badge with Role Accent */}
        <mesh position={[0.11, 0.21, 0.13]}>
          <boxGeometry args={[0.062, 0.088, 0.014]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive={agent.accentColor}
            emissiveIntensity={0.25}
            roughness={0.28}
          />
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

        {/* ARTICULATED RIGHT ARM (UPPER ARM + BENT ELBOW FOREARM + REAL 3D COFFEE MUG) */}
        <group ref={rightArmRef} position={[0.24, 0.33, 0]}>
          {/* Upper Arm */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.16, 8, 10]} />
            <meshStandardMaterial color={suitColor} roughness={0.66} />
          </mesh>
          {/* Hinged Elbow Forearm */}
          <group ref={rightElbowRef} position={[0, -0.24, 0]}>
            <mesh position={[0, -0.11, 0]} castShadow>
              <capsuleGeometry args={[0.048, 0.15, 8, 10]} />
              <meshStandardMaterial color={suitColor} roughness={0.66} />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.044, 0.044, 0.045, 10]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh position={[0, -0.26, 0]}>
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.72} />
            </mesh>

            {/* REAL 3D CERAMIC COFFEE MUG + DARK ESPRESSO + WARM STEAM (visible when seated IDLE) */}
            <group ref={coffeeMugRef} position={[0, -0.28, 0.05]} visible={false}>
              {/* Ceramic Mug Body */}
              <mesh castShadow>
                <cylinderGeometry args={[0.05, 0.043, 0.105, 14]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.22} metalness={0.05} />
              </mesh>
              {/* Accent Stripe Around Mug */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.051, 0.048, 0.022, 14]} />
                <meshStandardMaterial color="#c2410c" roughness={0.35} />
              </mesh>
              {/* Dark Hot Espresso Surface */}
              <mesh position={[0, 0.046, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.012, 12]} />
                <meshStandardMaterial color="#3b1f0e" roughness={0.18} />
              </mesh>
              {/* Mug Handle */}
              <mesh position={[0.052, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.026, 0.008, 8, 14, Math.PI]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.25} />
              </mesh>
              {/* Rising Warm Coffee Steam Puffs */}
              <mesh ref={steam1Ref} position={[0, 0.09, 0]}>
                <sphereGeometry args={[0.017, 8, 8]} />
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.42}
                  depthWrite={false}
                />
              </mesh>
              <mesh ref={steam2Ref} position={[0.01, 0.14, 0]}>
                <sphereGeometry args={[0.013, 8, 8]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  transparent
                  opacity={0.3}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
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

      {showLabels && (isSelected || labelTier !== "far") && (
        <Html
          position={[0, roleOffsetY, 0]}
          center
          distanceFactor={12}
          zIndexRange={isSelected ? [30, 20] : [12, 0]}
        >
          {isSelected || labelTier === "near" ? (
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
                  ? "border-cyan-300 bg-slate-950/92 text-white ring-2 ring-cyan-400/50"
                  : "border-white/25 bg-slate-950/80 text-slate-100 hover:bg-slate-900/95"
              }`}
              style={{
                borderColor: isSelected ? agent.accentColor : undefined,
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/40"
                style={{ backgroundColor: agent.accentColor }}
              />
              <span>{agent.name}</span>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: statusDotColor }}
              />
              {isSelected && (
                <span className="rounded bg-white/15 px-1 text-[8px] font-bold uppercase tracking-wider text-cyan-200">
                  {agent.role}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              title={`${agent.name} — ${agent.role}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(agent.id);
              }}
              className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full border bg-slate-950/82 text-[8px] font-bold text-white shadow-md backdrop-blur-sm transition hover:scale-110"
              style={{ borderColor: agent.accentColor }}
            >
              {initials}
            </button>
          )}
        </Html>
      )}
    </group>
  );
}
