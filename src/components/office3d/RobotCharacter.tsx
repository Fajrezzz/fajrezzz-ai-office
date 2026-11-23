"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  RealisticHumanAvatar,
  type HumanAvatarPose,
  type HumanAvatarVariant,
} from "@/components/office3d/RealisticHumanAvatar";
import {
  OFFICE_WAYPOINTS,
  findWaypointPath,
} from "@/lib/data/initial-office-data";
import { useOffice } from "@/store/OfficeContext";
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

interface StaffVisualSpec {
  variant: HumanAvatarVariant;
  topColor: string;
  pantsColor: string;
  hairColor: string;
  keepOriginal?: boolean;
  hasGlasses?: boolean;
  hasHijab?: boolean;
  hasNeckHeadphones?: boolean;
  tieColor?: string;
  fajrezzzBadgeColor?: string;
}

/**
 * Unique visual identity for every core Fajrezzz AI staff member,
 * modeled directly after Bos's "Our Team · 22 Amazing People" portrait.
 */
const STAFF_AVATAR_MAP: Record<string, StaffVisualSpec> = {
  // Man #1 (Raka): Black Fajrezzz Hoodie + Glasses + Purple F Logo
  "staff-01": {
    variant: "vroid_male",
    topColor: "#141722",
    pantsColor: "#10121a",
    hairColor: "#14161e",
    hasGlasses: true,
    fajrezzzBadgeColor: "#8b5cf6",
  },
  // Woman #7 (Nadia): Signature Lavender Purple Collared Blouse + Glasses
  "staff-02": {
    variant: "vroid_female",
    topColor: "#8b5cf6",
    pantsColor: "#161822",
    hairColor: "#1e1614",
    hasGlasses: true,
    fajrezzzBadgeColor: "#c4b5fd",
  },
  // Man #2 (Dimas): Crisp White/Light-Grey Fajrezzz Hoodie + Glasses
  "staff-03": {
    variant: "vroid_male",
    topColor: "#eef2f6",
    pantsColor: "#1a1f2c",
    hairColor: "#15161e",
    hasGlasses: true,
    fajrezzzBadgeColor: "#6366f1",
  },
  // Woman #8 (Clara): Black Fajrezzz Hoodie + Glasses
  "staff-04": {
    variant: "vroid_female",
    topColor: "#161824",
    pantsColor: "#2c3242",
    hairColor: "#2b1c15",
    hasGlasses: true,
    fajrezzzBadgeColor: "#a855f7",
  },
  // Man #4 (Bima): Black-Purple Zip Jacket + Neck Headphones (Audio Studio)
  "staff-05": {
    variant: "vroid_male",
    topColor: "#1e1b4b",
    pantsColor: "#11141e",
    hairColor: "#12141c",
    hasNeckHeadphones: true,
    fajrezzzBadgeColor: "#a855f7",
  },
  // Woman #2/#5 (Salsa): Crisp White Collared Blouse + Glasses
  "staff-06": {
    variant: "vroid_female",
    topColor: "#f8fafc",
    pantsColor: "#1b1e29",
    hairColor: "#2e1c14",
    hasGlasses: true,
    fajrezzzBadgeColor: "#6366f1",
  },
  // Man #12 (Fajar): Royal Blue Fajrezzz Varsity Jacket
  "staff-07": {
    variant: "vroid_male",
    topColor: "#1d4ed8",
    pantsColor: "#141824",
    hairColor: "#161720",
    fajrezzzBadgeColor: "#38bdf8",
  },
  // Woman #4 (Alya): All-Black Modest Fajrezzz Outfit + Black Silk Hijab
  "staff-08": {
    variant: "vroid_female",
    topColor: "#14161f",
    pantsColor: "#0e1017",
    hairColor: "#111318",
    hasHijab: true,
    fajrezzzBadgeColor: "#8b5cf6",
  },
  // Man #6 (Reza): Crisp White Dress Shirt + Navy Executive Tie + Glasses (Director L3)
  "staff-09": {
    variant: "vroid_male",
    topColor: "#f8fafc",
    pantsColor: "#151822",
    hairColor: "#14161d",
    tieColor: "#1e3a8a",
    hasGlasses: true,
  },
  // Woman #6 (Tania): Sleek Jet-Black Executive Outfit + Warm Chestnut Hair
  "staff-10": {
    variant: "vroid_female",
    topColor: "#1a1d2a",
    pantsColor: "#11131b",
    hairColor: "#5a3524",
    fajrezzzBadgeColor: "#a855f7",
  },
};

export function RobotCharacter({
  agent,
  isSelected,
  isSimulationRunning,
  showLabels,
  onSelect,
  onFocusPoint,
  onArrive,
}: RobotCharacterProps) {
  const { thinkingAgentId, agentThoughts } = useOffice();
  const rootRef = useRef<THREE.Group>(null);

  const initialPos = useMemo(() => {
    const wp = OFFICE_WAYPOINTS[agent.currentWaypointId];
    return wp ? [...wp.position] : [0, 3.9, 0];
  }, [agent.currentWaypointId]);

  const currentPosRef = useRef(
    new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2])
  );
  const pathQueueRef = useRef<string[]>([]);
  const lastTargetRef = useRef<string>(agent.currentWaypointId);
  const arrivedSentRef = useRef<boolean>(
    agent.currentWaypointId === agent.targetWaypointId
  );
  const phaseOffset = useMemo(
    () => (agent.id.charCodeAt(agent.id.length - 1) % 10) * 0.75,
    [agent.id]
  );

  const [labelTier, setLabelTier] = useState<"near" | "mid" | "far">("mid");
  const labelTierRef = useRef<"near" | "mid" | "far">("mid");
  const distCheckAccumRef = useRef(0);

  const [avatarPose, setAvatarPose] = useState<HumanAvatarPose>(() => {
    const hasChair = SEATED_WAYPOINT_IDS.has(agent.currentWaypointId);
    if (hasChair && (agent.status === "working" || agent.status === "error")) {
      return "typing";
    }
    if (hasChair && agent.status === "idle") {
      return "seated";
    }
    return "idle";
  });
  const avatarPoseRef = useRef<HumanAvatarPose>(avatarPose);

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
        const speed = 3.2;

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
      const seatWp = OFFICE_WAYPOINTS[agent.currentWaypointId];
      const targetAngle = seatWp?.facingYaw ?? Math.PI;
      let diff = targetAngle - root.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      root.rotation.y += diff * Math.min(1, dt * 6);
    }

    root.position.set(
      currentPosRef.current.x,
      currentPosRef.current.y,
      currentPosRef.current.z
    );

    const hasRealChairHere = SEATED_WAYPOINT_IDS.has(agent.currentWaypointId);
    const nextPose: HumanAvatarPose = isMoving
      ? "walking"
      : hasRealChairHere && (agent.status === "working" || agent.status === "error")
      ? "typing"
      : hasRealChairHere && agent.status === "idle"
      ? "seated"
      : "idle";

    if (nextPose !== avatarPoseRef.current) {
      avatarPoseRef.current = nextPose;
      setAvatarPose(nextPose);
    }
  });

  const { hairStyle, suitColor, pantsColor, hairColor } = agent.appearance;
  const isFemale =
    hairStyle === "bob" || hairStyle === "ponytail" || hairStyle === "hijab";

  const avatarSpec = useMemo<StaffVisualSpec>(() => {
    const mapped = STAFF_AVATAR_MAP[agent.id];
    if (mapped) return mapped;
    return {
      variant: isFemale ? "rb_female" : "rb_male_a",
      topColor: suitColor,
      pantsColor,
      hairColor,
    };
  }, [agent.id, isFemale, suitColor, pantsColor, hairColor]);

  const isThinkingNow = thinkingAgentId === agent.id;
  const latestThought = agentThoughts[agent.id];

  const statusDotColor = isThinkingNow
    ? "#00f0ff"
    : agent.status === "working"
    ? "#10b981"
    : agent.status === "walking"
    ? "#38bdf8"
    : agent.status === "error"
    ? "#ef4444"
    : "#f59e0b";

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

  return (
    <group
      ref={rootRef}
      position={[initialPos[0], initialPos[1], initialPos[2]]}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Cyberpunk Neon Selection & Thinking Ring on Floor */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            isSelected || isThinkingNow ? 0.42 : 0.3,
            isSelected || isThinkingNow ? 0.54 : 0.36,
            28,
          ]}
        />
        <meshBasicMaterial
          color={isThinkingNow ? "#00f0ff" : isSelected ? "#38bdf8" : agent.accentColor}
          transparent
          opacity={isThinkingNow ? 0.9 : isSelected ? 0.85 : 0.34}
        />
      </mesh>

      {/* Photorealistic Rigged 3D Human Avatar matching Fajrezzz Team Portrait */}
      <RealisticHumanAvatar
        variant={avatarSpec.variant}
        pose={avatarPose}
        topColor={avatarSpec.topColor}
        pantsColor={avatarSpec.pantsColor}
        hairColor={avatarSpec.hairColor}
        keepOriginalOutfit={avatarSpec.keepOriginal}
        hasGlasses={avatarSpec.hasGlasses}
        hasHijab={avatarSpec.hasHijab}
        hasNeckHeadphones={avatarSpec.hasNeckHeadphones}
        tieColor={avatarSpec.tieColor}
        fajrezzzBadgeColor={avatarSpec.fajrezzzBadgeColor}
        targetHeight={isFemale ? 1.65 : 1.74}
        phaseOffset={phaseOffset}
        isSimulationRunning={isSimulationRunning}
      />

      {/* Live Autonomous AI Thought Bubble above Character Head */}
      {showLabels && (isThinkingNow || (latestThought && (isSelected || labelTier === "near"))) && (
        <Html
          position={[0, roleOffsetY + 0.34, 0]}
          center
          distanceFactor={12}
          zIndexRange={[35, 22]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(agent.id);
            }}
            className={`pointer-events-auto max-w-[210px] cursor-pointer rounded-xl border px-2.5 py-1 text-[9px] leading-snug shadow-xl backdrop-blur-md ${
              isThinkingNow
                ? "animate-pulse border-cyan-400/80 bg-cyan-950/90 text-cyan-100"
                : "border-fuchsia-400/60 bg-slate-950/90 text-slate-100"
            }`}
          >
            {isThinkingNow ? (
              <span className="font-bold">🧠 Sedang berpikir mandiri (AI)...</span>
            ) : (
              <div>
                <div className="mb-0.5 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                  <span>🧠 {latestThought.provider}</span>
                  <span className="text-slate-400">· {latestThought.timestamp}</span>
                </div>
                <div className="line-clamp-2 font-medium text-white">
                  {latestThought.chatBubble}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}

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
