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
  const leftElbowRef = useRef<THREE.Group>(null);
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
        leftArmRef.current.rotation.y = 0;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.18;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = stride * 0.44;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.18;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.05;
        torsoRef.current.position.y = 1.02;
        torsoRef.current.position.z = 0;
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

      // REALISTIC OFFICE WORK: Torso tucked snugly to desk so left hand ACTUALLY types on keyboard & right hand glides on 3D mouse!
      const typeTap = Math.sin(t * 16.5) * 0.09 + Math.sin(t * 24.0) * 0.04;
      const mouseGlide = Math.sin(t * 2.2) * 0.15;
      const mouseClick = Math.sin(t * 7.8) > 0.85 ? 0.07 : 0;

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.82 + Math.sin(t * 4.0) * 0.03;
        leftArmRef.current.rotation.y = 0.16 + Math.sin(t * 2.8) * 0.06;
        leftArmRef.current.rotation.z = -0.04;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.66 + typeTap;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.78 + Math.cos(t * 2.4) * 0.03;
        rightArmRef.current.rotation.y = -0.14 + mouseGlide;
        rightArmRef.current.rotation.z = 0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.68 + mouseClick;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0.16;
        torsoRef.current.position.y = 1.02;
        torsoRef.current.position.z = 0.12;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.85) * 0.22;
        headRef.current.rotation.x = 0.12;
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
        leftArmRef.current.rotation.x = -0.34 + breathe * 0.02;
        leftArmRef.current.rotation.y = 0;
        leftArmRef.current.rotation.z = 0.12;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.72;
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
        torsoRef.current.position.z = 0;
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
        leftArmRef.current.rotation.y = 0;
        leftArmRef.current.rotation.z = 0.08;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.06;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.04 - breathe * 0.02;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = -0.08;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.06;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0;
        torsoRef.current.position.y = 1.02 + breathe * 0.012;
        torsoRef.current.position.z = 0;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.65) * 0.22;
        headRef.current.rotation.x = 0;
      }
    }
  });

  const {
    skinColor,
    hairColor,
    hairStyle,
    suitColor,
    shirtColor,
    pantsColor,
    sleeveColor,
    outfitStyle,
    hasGlasses,
    hasNeckHeadphones,
    tieColor,
  } = agent.appearance;
  const activeSleeveColor = sleeveColor ?? suitColor;
  const isFemale =
    hairStyle === "bob" || hairStyle === "ponytail" || hairStyle === "hijab";

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

      {/* SCULPTED ANATOMICAL TORSO & GENDER-TAILORED BLAZER */}
      <group ref={torsoRef} position={[0, 1.02, 0]}>
        {/* Sculpted waist / tailored skirt for female, straight trousers waist for male */}
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry
            args={isFemale ? [0.14, 0.185, 0.25, 14] : [0.158, 0.168, 0.22, 14]}
          />
          <meshStandardMaterial color={pantsColor} roughness={0.76} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[isFemale ? 0.146 : 0.164, isFemale ? 0.146 : 0.164, 0.04, 14]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} />
        </mesh>

        {/* Blazer Chest & Shoulders (Slim feminine with sculpted bust contour vs Broad masculine) */}
        <mesh
          position={[0, 0.14, 0]}
          scale={isFemale ? [1.0, 1, 0.7] : [1.24, 1, 0.76]}
          castShadow
        >
          <cylinderGeometry args={[0.18, isFemale ? 0.125 : 0.14, 0.5, 16]} />
          <meshStandardMaterial color={suitColor} roughness={0.66} />
        </mesh>
        {/* Sculpted Natural Feminine Bust Contour */}
        {isFemale && (
          <group>
            <mesh position={[-0.072, 0.21, 0.118]} scale={[0.95, 0.9, 0.96]} castShadow>
              <sphereGeometry args={[0.074, 14, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.64} />
            </mesh>
            <mesh position={[0.072, 0.21, 0.118]} scale={[0.95, 0.9, 0.96]} castShadow>
              <sphereGeometry args={[0.074, 14, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.64} />
            </mesh>
          </group>
        )}
        {/* Shoulder Cap */}
        <mesh
          position={[0, 0.35, 0]}
          scale={isFemale ? [1.04, 0.44, 0.68] : [1.3, 0.48, 0.76]}
          castShadow
        >
          <sphereGeometry args={[0.185, 16, 12]} />
          <meshStandardMaterial color={suitColor} roughness={0.66} />
        </mesh>

        {/* Crisp Collar / Hoodie / Shirt Front Detail (Fajrezzz Modern Startup Look) */}
        {outfitStyle === "hoodie" ? (
          <group>
            {/* Hood Collar Roll Around Back of Neck */}
            <mesh position={[0, 0.38, -0.05]} rotation={[0.32, 0, 0]} castShadow>
              <torusGeometry args={[0.105, 0.036, 10, 16]} />
              <meshStandardMaterial color={suitColor} roughness={0.78} />
            </mesh>
            {/* Hoodie Drawstrings */}
            <mesh position={[-0.036, 0.25, 0.125]}>
              <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
              <meshStandardMaterial color={shirtColor} roughness={0.6} />
            </mesh>
            <mesh position={[0.036, 0.25, 0.125]}>
              <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
              <meshStandardMaterial color={shirtColor} roughness={0.6} />
            </mesh>
          </group>
        ) : outfitStyle === "varsity" ? (
          <group>
            {/* Varsity Striped Collar & White Center Button Placket */}
            <mesh position={[0, 0.37, 0.02]}>
              <cylinderGeometry args={[0.088, 0.095, 0.045, 14]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.18, 0.124]}>
              <boxGeometry args={[0.024, 0.34, 0.014]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.55} />
            </mesh>
          </group>
        ) : (
          <group>
            {/* Crisp Collared Shirt / Blouse Placket */}
            <mesh position={[0, 0.24, 0.112]}>
              <boxGeometry args={[isFemale ? 0.095 : 0.105, 0.28, 0.03]} />
              <meshStandardMaterial color={shirtColor} roughness={0.52} />
            </mesh>
            {/* Clean Pointed Collar Flaps */}
            <mesh position={[-0.045, 0.37, 0.095]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.065, 0.036, 0.024]} />
              <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>
            <mesh position={[0.045, 0.37, 0.095]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.065, 0.036, 0.024]} />
              <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>
            {/* Optional Sleek Formal Tie */}
            {tieColor && (
              <mesh position={[0, 0.19, 0.132]}>
                <boxGeometry args={[0.04, 0.25, 0.015]} />
                <meshStandardMaterial color={tieColor} roughness={0.38} />
              </mesh>
            )}
          </group>
        )}

        {/* FAJREZZZ SIGNATURE PURPLE-BLUE "F" CHEST EMBLEM */}
        <group position={[0.085, 0.255, 0.13]}>
          <mesh>
            <boxGeometry args={[0.052, 0.056, 0.008]} />
            <meshStandardMaterial
              color="#3b267d"
              emissive="#7c3aed"
              emissiveIntensity={0.42}
              roughness={0.3}
            />
          </mesh>
          {/* Stylized Geometric "F" Bars */}
          <mesh position={[-0.009, 0, 0.006]}>
            <boxGeometry args={[0.008, 0.036, 0.004]} />
            <meshStandardMaterial color="#e0e7ff" emissive="#c4b5fd" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[0.004, 0.014, 0.006]}>
            <boxGeometry args={[0.024, 0.008, 0.004]} />
            <meshStandardMaterial color="#e0e7ff" emissive="#c4b5fd" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[0.001, 0.001, 0.006]}>
            <boxGeometry args={[0.018, 0.007, 0.004]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* OPTIONAL STUDIO HEADPHONES RESTING AROUND NECK (Signature Tech Creator Look!) */}
        {hasNeckHeadphones && (
          <group position={[0, 0.39, 0.03]}>
            {/* Neckband Arc */}
            <mesh rotation={[Math.PI / 2 - 0.18, 0, 0]}>
              <torusGeometry args={[0.095, 0.014, 8, 18, Math.PI * 1.28]} />
              <meshStandardMaterial color="#18181b" roughness={0.32} metalness={0.45} />
            </mesh>
            {/* Left & Right Earcups with Purple Accent Ring */}
            {[-0.088, 0.088].map((hx, hi) => (
              <group key={hi} position={[hx, -0.02, 0.075]} rotation={[0.25, hi === 0 ? 0.3 : -0.3, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.038, 0.038, 0.032, 14]} />
                  <meshStandardMaterial color="#1f2433" roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh position={[0, 0, 0.016]}>
                  <torusGeometry args={[0.026, 0.005, 6, 14]} />
                  <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.65} />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* ARTICULATED LEFT ARM (UPPER ARM + BENT ELBOW FOREARM FOR REAL KEYBOARD TYPING!) */}
        <group ref={leftArmRef} position={[-0.24, 0.33, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.16, 8, 10]} />
            <meshStandardMaterial color={activeSleeveColor} roughness={0.66} />
          </mesh>
          <group ref={leftElbowRef} position={[0, -0.24, 0]}>
            <mesh position={[0, -0.11, 0]} castShadow>
              <capsuleGeometry args={[0.048, 0.15, 8, 10]} />
              <meshStandardMaterial color={activeSleeveColor} roughness={0.66} />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <cylinderGeometry args={[0.044, 0.044, 0.045, 10]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh position={[0, -0.26, 0]}>
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.72} />
            </mesh>
          </group>
        </group>

        {/* ARTICULATED RIGHT ARM (UPPER ARM + BENT ELBOW FOREARM + REAL 3D COFFEE MUG) */}
        <group ref={rightArmRef} position={[0.24, 0.33, 0]}>
          {/* Upper Arm */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.16, 8, 10]} />
            <meshStandardMaterial color={activeSleeveColor} roughness={0.66} />
          </mesh>
          {/* Hinged Elbow Forearm */}
          <group ref={rightElbowRef} position={[0, -0.24, 0]}>
            <mesh position={[0, -0.11, 0]} castShadow>
              <capsuleGeometry args={[0.048, 0.15, 8, 10]} />
              <meshStandardMaterial color={activeSleeveColor} roughness={0.66} />
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
          {/* Expressive Eyes, Brows & Warm Smile */}
          <mesh position={[-0.044, 0.2, 0.123]}>
            <sphereGeometry args={[0.015, 10, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.14} />
          </mesh>
          <mesh position={[0.044, 0.2, 0.123]}>
            <sphereGeometry args={[0.015, 10, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.14} />
          </mesh>
          {/* Subtle Eyebrows */}
          <mesh position={[-0.044, 0.228, 0.122]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.036, 0.008, 0.008]} />
            <meshStandardMaterial color={hairStyle === "hijab" ? "#1e1612" : hairColor} roughness={0.85} />
          </mesh>
          <mesh position={[0.044, 0.228, 0.122]} rotation={[0, 0, -0.06]}>
            <boxGeometry args={[0.036, 0.008, 0.008]} />
            <meshStandardMaterial color={hairStyle === "hijab" ? "#1e1612" : hairColor} roughness={0.85} />
          </mesh>
          {/* Warm Friendly Smile */}
          <mesh position={[0, 0.138, 0.124]} rotation={[0.12, 0, Math.PI]}>
            <torusGeometry args={[0.024, 0.0045, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#b96d5e" roughness={0.55} />
          </mesh>

          {/* Optional Sleek Modern Glasses */}
          {hasGlasses && (
            <group position={[0, 0.2, 0.138]}>
              {[-0.044, 0.044].map((gx, gi) => (
                <mesh key={gi} position={[gx, 0, 0]}>
                  <torusGeometry args={[0.028, 0.0042, 8, 16]} />
                  <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.6} />
                </mesh>
              ))}
              {/* Nose Bridge */}
              <mesh position={[0, 0.003, 0]}>
                <boxGeometry args={[0.034, 0.0045, 0.005]} />
                <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.6} />
              </mesh>
              {/* Side Temples */}
              {[-0.078, 0.078].map((tx, ti) => (
                <mesh key={ti} position={[tx, 0.002, -0.055]}>
                  <boxGeometry args={[0.004, 0.0045, 0.11]} />
                  <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.6} />
                </mesh>
              ))}
            </group>
          )}

          {/* Sculpted Modern Hairstyles & Elegant Black Hijab */}
          {hairStyle === "short" && (
            <group>
              {/* Textured Modern Layered Crown */}
              <mesh position={[0, 0.255, -0.01]} scale={[0.98, 1.04, 1.02]} castShadow>
                <sphereGeometry
                  args={[0.148, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              {/* Soft Curved Back Hair (No Blocky Box!) */}
              <mesh position={[0, 0.195, -0.068]} scale={[0.96, 1.0, 0.72]} castShadow>
                <sphereGeometry args={[0.132, 14, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.78} />
              </mesh>
              {/* Natural Side-Part Curtain Bangs */}
              <mesh position={[-0.052, 0.285, 0.088]} rotation={[0.28, -0.25, 0.18]} castShadow>
                <capsuleGeometry args={[0.026, 0.085, 6, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
              <mesh position={[0.058, 0.288, 0.086]} rotation={[0.25, 0.28, -0.22]} castShadow>
                <capsuleGeometry args={[0.026, 0.08, 6, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.76} />
              </mesh>
            </group>
          )}

          {hairStyle === "bob" && (
            <group>
              {/* Full Glossy Hair Crown */}
              <mesh position={[0, 0.245, -0.018]} scale={[1.0, 1.06, 1.02]} castShadow>
                <sphereGeometry args={[0.154, 18, 14]} />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
              {/* Long Flowing Wavy Back Hair Drape */}
              <mesh position={[0, -0.02, -0.102]} scale={[1.06, 1.0, 0.54]} castShadow>
                <capsuleGeometry args={[0.138, 0.34, 10, 14]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
              {/* Soft Layered Face-Framing Strands */}
              <mesh position={[-0.122, 0.04, 0.02]} rotation={[0, 0, -0.05]} castShadow>
                <capsuleGeometry args={[0.04, 0.32, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
              <mesh position={[0.122, 0.04, 0.02]} rotation={[0, 0, 0.05]} castShadow>
                <capsuleGeometry args={[0.04, 0.32, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
            </group>
          )}

          {hairStyle === "ponytail" && (
            <group>
              {/* Sleek Glossy Crown */}
              <mesh position={[0, 0.25, -0.02]} castShadow>
                <sphereGeometry
                  args={[0.15, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
              {/* Soft Front Side-Framing Wisps */}
              <mesh position={[-0.12, 0.1, 0.02]} castShadow>
                <capsuleGeometry args={[0.032, 0.22, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
              <mesh position={[0.12, 0.1, 0.02]} castShadow>
                <capsuleGeometry args={[0.032, 0.22, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
              {/* Hair Tie Accent */}
              <mesh position={[0, 0.24, -0.145]}>
                <torusGeometry args={[0.042, 0.012, 8, 12]} />
                <meshStandardMaterial color="#a78bfa" roughness={0.38} />
              </mesh>
              {/* Long Flowing High Ponytail Reaching Mid-Back */}
              <mesh position={[0, 0.02, -0.175]} rotation={[0.18, 0, 0]} castShadow>
                <capsuleGeometry args={[0.06, 0.44, 8, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
            </group>
          )}

          {hairStyle === "executive" && (
            <group>
              {/* Modern Korean/Tech Curtain-Styled Male Hair */}
              <mesh position={[0, 0.26, -0.01]} scale={[0.98, 1.05, 1.02]} castShadow>
                <sphereGeometry
                  args={[0.15, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]}
                />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
              <mesh position={[0, 0.2, -0.068]} scale={[0.95, 1.0, 0.7]} castShadow>
                <sphereGeometry args={[0.132, 14, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.7} />
              </mesh>
              {/* Swept Textured Top Fringe */}
              <mesh position={[0.018, 0.305, 0.062]} rotation={[0.2, 0.15, -0.14]} castShadow>
                <capsuleGeometry args={[0.036, 0.12, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
              <mesh position={[-0.065, 0.285, 0.075]} rotation={[0.25, -0.25, 0.24]} castShadow>
                <capsuleGeometry args={[0.028, 0.085, 6, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
            </group>
          )}

          {hairStyle === "hijab" && (
            <group>
              {/* Smooth Sculpted Black Silk Hijab Head Wrap */}
              <mesh position={[0, 0.215, -0.022]} scale={[1.02, 1.12, 1.06]} castShadow>
                <sphereGeometry args={[0.152, 18, 16]} />
                <meshStandardMaterial color="#11131a" roughness={0.62} />
              </mesh>
              {/* Soft Face-Framing Hijab Edge Halo */}
              <mesh position={[0, 0.195, 0.048]} scale={[0.96, 1.08, 0.9]}>
                <torusGeometry args={[0.125, 0.026, 10, 22]} />
                <meshStandardMaterial color="#161923" roughness={0.64} />
              </mesh>
              {/* Flowing Neck & Chest Hijab Drape Shawl */}
              <mesh position={[0, 0.045, 0.005]} scale={[1.15, 0.9, 0.95]} castShadow>
                <cylinderGeometry args={[0.128, 0.195, 0.22, 18]} />
                <meshStandardMaterial color="#13161f" roughness={0.64} />
              </mesh>
              {/* Back Flowing Hijab Layer */}
              <mesh position={[0, -0.04, -0.08]} scale={[1.05, 1.0, 0.56]} castShadow>
                <capsuleGeometry args={[0.142, 0.26, 10, 14]} />
                <meshStandardMaterial color="#11131a" roughness={0.64} />
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
