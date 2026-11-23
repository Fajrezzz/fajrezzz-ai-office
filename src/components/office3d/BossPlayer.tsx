"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  RealisticHumanAvatar,
  type HumanAvatarPose,
} from "@/components/office3d/RealisticHumanAvatar";
import {
  BOSS_FLOOR_ELEVATIONS,
  useOffice,
} from "@/store/OfficeContext";
import { useSimulator } from "@/store/SimulatorContext";
import type { BossActionState, Vector3Tuple } from "@/types/office";

// Exact pool cavity bounds (matches CyberOutdoorCampus pool opening!)
const POOL_MIN_X = -10.55;
const POOL_MAX_X = 2.15;
const POOL_MIN_Z = 8.55;
const POOL_MAX_Z = 14.25;

export function BossPlayer() {
  const {
    isBossMode,
    setIsBossMode,
    bossFloor,
    setBossActionState,
    bossPositionRef,
    bossJoystickRef,
    bossTeleportCommand,
    showLabelsIn3D,
    focusCameraOn,
  } = useOffice();

  const { camera } = useThree();
  const { activeVehicleId, walkToTargetRef } = useSimulator();

  const rootRef = useRef<THREE.Group>(null);
  const jumpOffsetRef = useRef(0);
  const jumpVelRef = useRef(0);
  const rippleRef = useRef<THREE.Mesh>(null);
  const [bossLabelNear, setBossLabelNear] = useState(true);
  const bossLabelNearRef = useRef(true);
  const bossDistAccumRef = useRef(0);

  const [avatarPose, setAvatarPose] = useState<HumanAvatarPose>("idle");
  const avatarPoseRef = useRef<HumanAvatarPose>("idle");

  const posRef = useRef(
    new THREE.Vector3(
      bossPositionRef.current[0],
      bossPositionRef.current[1],
      bossPositionRef.current[2]
    )
  );
  const yawRef = useRef<number>(Math.PI);
  const swimDepthRef = useRef<number>(0);
  const lastActionRef = useRef<BossActionState>("idle");
  const keysRef = useRef<Set<string>>(new Set());

  const camForward = useMemo(() => new THREE.Vector3(), []);
  const camRight = useMemo(() => new THREE.Vector3(), []);
  const moveDir = useMemo(() => new THREE.Vector3(), []);

  // Apply teleport commands (floor change / quick warp to Pool, Lobby, L2, L3, Rooftop)
  useEffect(() => {
    if (!bossTeleportCommand) return;
    const [tx, ty, tz] = bossTeleportCommand.position;
    posRef.current.set(tx, ty, tz);
    bossPositionRef.current = [tx, ty, tz];
    if (typeof bossTeleportCommand.yaw === "number") {
      yawRef.current = bossTeleportCommand.yaw;
    }
  }, [bossTeleportCommand, bossPositionRef]);

  // PC Keyboard WASD / Arrow Keys + Shift sprint when Boss Mode is active
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    const onBlur = () => {
      keysRef.current.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Hide Boss standing body cleanly while seated inside a driven vehicle
    root.visible = !activeVehicleId;
    if (activeVehicleId) return;

    // Spacebar Jump Physics (when not swimming)
    if (
      isBossMode &&
      keysRef.current.has(" ") &&
      jumpOffsetRef.current <= 0.01 &&
      swimDepthRef.current < 0.1
    ) {
      jumpVelRef.current = 5.4;
    }
    if (jumpOffsetRef.current > 0 || jumpVelRef.current > 0) {
      jumpOffsetRef.current += jumpVelRef.current * dt;
      jumpVelRef.current -= 14.5 * dt;
      if (jumpOffsetRef.current <= 0) {
        jumpOffsetRef.current = 0;
        jumpVelRef.current = 0;
      }
    }

    bossDistAccumRef.current += dt;
    if (bossDistAccumRef.current > 0.2) {
      bossDistAccumRef.current = 0;
      const isNear = camera.position.distanceTo(posRef.current) < 22;
      if (isNear !== bossLabelNearRef.current) {
        bossLabelNearRef.current = isNear;
        setBossLabelNear(isNear);
      }
    }

    // 1. Gather Analog Joystick + PC Keyboard inputs (active in Boss Mode)
    let inputX = 0;
    let inputY = 0;
    let isSprinting = false;

    if (isBossMode) {
      inputX += bossJoystickRef.current.x;
      inputY += bossJoystickRef.current.y;

      const keys = keysRef.current;
      if (keys.has("w") || keys.has("arrowup")) inputY += 1;
      if (keys.has("s") || keys.has("arrowdown")) inputY -= 1;
      if (keys.has("d") || keys.has("arrowright")) inputX += 1;
      if (keys.has("a") || keys.has("arrowleft")) inputX -= 1;
      isSprinting = keys.has("shift");
    }

    const inputMag = Math.min(1, Math.hypot(inputX, inputY));

    // 2. Check whether BOS FAJREZ is inside the swimming pool (Floor 1)
    const inPool =
      bossFloor === 1 &&
      posRef.current.x >= POOL_MIN_X &&
      posRef.current.x <= POOL_MAX_X &&
      posRef.current.z >= POOL_MIN_Z &&
      posRef.current.z <= POOL_MAX_Z;

    let isAutoWalking = false;

    // 3. Move camera-relative on horizontal ground plane
    if (inputMag > 0.08) {
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      if (camForward.lengthSq() < 0.0001) {
        camForward.set(0, 0, -1);
      } else {
        camForward.normalize();
      }
      camRight.crossVectors(camForward, camera.up).normalize();

      moveDir
        .set(0, 0, 0)
        .addScaledVector(camForward, inputY)
        .addScaledVector(camRight, inputX);

      if (moveDir.lengthSq() > 0.0001) {
        moveDir.normalize();
        const baseSpeed = inPool
          ? 2.8
          : isSprinting || inputMag > 0.88
          ? 5.6
          : 3.6;
        const speed = baseSpeed * inputMag;

        posRef.current.x += moveDir.x * speed * dt;
        posRef.current.z += moveDir.z * speed * dt;

        // Smoothly clamp walkable world boundaries per floor
        if (bossFloor === 1) {
          posRef.current.x = Math.max(-34.0, Math.min(34.0, posRef.current.x));
          posRef.current.z = Math.max(-9.3, Math.min(24.0, posRef.current.z));
        } else if (bossFloor === 2 || bossFloor === 3) {
          posRef.current.x = Math.max(-18.2, Math.min(18.2, posRef.current.x));
          posRef.current.z = Math.max(-9.3, Math.min(4.8, posRef.current.z));
        } else {
          posRef.current.x = Math.max(-18.4, Math.min(18.4, posRef.current.x));
          posRef.current.z = Math.max(-9.5, Math.min(4.8, posRef.current.z));
        }

        const targetYaw = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetYaw - yawRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        yawRef.current += diff * Math.min(1, dt * 12);
        walkToTargetRef.current = null;
      }
    } else if (walkToTargetRef.current) {
      const [wx, , wz] = walkToTargetRef.current;
      const dx = wx - posRef.current.x;
      const dz = wz - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        isAutoWalking = true;
        const step = Math.min(dist, 3.6 * dt);
        posRef.current.x += (dx / dist) * step;
        posRef.current.z += (dz / dist) * step;
        yawRef.current = Math.atan2(dx, dz);
      } else {
        walkToTargetRef.current = null;
      }
    }

    // 4. Smooth floor elevation + swimming immersion depth + jump height
    const baseFloorY = BOSS_FLOOR_ELEVATIONS[bossFloor];
    const targetSwimDepth = inPool ? 0.92 : 0;
    swimDepthRef.current +=
      (targetSwimDepth - swimDepthRef.current) * Math.min(1, dt * 8);

    const nextAction: BossActionState = inPool
      ? "swimming"
      : inputMag > 0.86 || (isSprinting && inputMag > 0.1)
      ? "running"
      : inputMag > 0.08 || isAutoWalking
      ? "walking"
      : "idle";

    if (nextAction !== lastActionRef.current) {
      lastActionRef.current = nextAction;
      setBossActionState(nextAction);
    }

    const nextPose: HumanAvatarPose = nextAction;
    if (nextPose !== avatarPoseRef.current) {
      avatarPoseRef.current = nextPose;
      setAvatarPose(nextPose);
    }

    const swimBob = inPool ? Math.sin(t * 3.8) * 0.045 : 0;
    const finalY =
      baseFloorY - swimDepthRef.current + swimBob + jumpOffsetRef.current;
    posRef.current.y = baseFloorY;
    bossPositionRef.current = [posRef.current.x, baseFloorY, posRef.current.z];

    root.position.set(posRef.current.x, finalY, posRef.current.z);
    root.rotation.y = yawRef.current;

    // Animated water ripple ring while swimming
    if (rippleRef.current) {
      rippleRef.current.visible = inPool;
      if (inPool) {
        const s = 0.95 + Math.sin(t * 4.5) * 0.22;
        rippleRef.current.scale.set(s, s, 1);
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setIsBossMode(true);
    const [bx, by, bz] = bossPositionRef.current;
    focusCameraOn([bx, by + 1.35, bz] as Vector3Tuple, [4.6, 4.2, 7.2]);
  };

  return (
    <group
      ref={rootRef}
      position={[
        bossPositionRef.current[0],
        bossPositionRef.current[1],
        bossPositionRef.current[2],
      ]}
      onClick={handleClick}
    >
      {/* Golden Executive Presence Halo on Ground */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.54, 32]} />
        <meshBasicMaterial
          color={isBossMode ? "#facc15" : "#fbbf24"}
          transparent
          opacity={isBossMode ? 0.85 : 0.42}
        />
      </mesh>

      {/* Swimming Pool Water Ripple Ring */}
      <mesh
        ref={rippleRef}
        visible={false}
        position={[0, 0.94, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.42, 0.72, 28]} />
        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.62}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Photorealistic 1.78m Center-Lead Fajrezzz Jacket Avatar for BOS FAJREZ (from Team Photo) */}
      <RealisticHumanAvatar
        variant="rb_male_b"
        pose={avatarPose}
        topColor="#131628"
        pantsColor="#0b0e18"
        hairColor="#121318"
        fajrezzzBadgeColor="#a855f7"
        targetHeight={1.78}
        phaseOffset={0.2}
        animSpeed={avatarPose === "running" ? 1.25 : 1.05}
      />

      {/* Distance-Scaled Gold Crown Nameplate above BOS FAJREZ */}
      {showLabelsIn3D && (
        <Html
          position={[0, 2.12, 0]}
          center
          distanceFactor={13}
          zIndexRange={[25, 10]}
        >
          {isBossMode || bossLabelNear ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBossMode(true);
              }}
              className={`pointer-events-auto flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wide shadow-xl backdrop-blur-md transition ${
                isBossMode
                  ? "border-amber-300 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-300/60"
                  : "border-amber-400/70 bg-slate-950/90 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <span>★ BOS FAJREZ</span>
            </button>
          ) : (
            <button
              type="button"
              title="BOS FAJREZ"
              onClick={(e) => {
                e.stopPropagation();
                setIsBossMode(true);
              }}
              className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full border border-amber-300 bg-slate-950/90 text-[9px] font-black text-amber-300 shadow-lg"
            >
              ★
            </button>
          )}
        </Html>
      )}
    </group>
  );
}
