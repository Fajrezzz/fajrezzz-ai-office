"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
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
  const bodyPivotRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const [bossLabelNear, setBossLabelNear] = useState(true);
  const bossLabelNearRef = useRef(true);
  const bossDistAccumRef = useRef(0);
  const rightLegRef = useRef<THREE.Group>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  const posRef = useRef(
    new THREE.Vector3(
      bossPositionRef.current[0],
      bossPositionRef.current[1],
      bossPositionRef.current[2]
    )
  );
  const yawRef = useRef<number>(Math.PI); // facing toward pool initially
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
    if (isBossMode && keysRef.current.has(" ") && jumpOffsetRef.current <= 0.01 && swimDepthRef.current < 0.1) {
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
          // Full L1 lobby + outdoor pool deck + supercar bay + west/east parking lots
          posRef.current.x = Math.max(-34.0, Math.min(34.0, posRef.current.x));
          posRef.current.z = Math.max(-9.3, Math.min(24.0, posRef.current.z));
        } else if (bossFloor === 2 || bossFloor === 3) {
          // Full L2 / L3 interior (widened 38m HQ) + cantilevered front glass balcony!
          posRef.current.x = Math.max(-18.2, Math.min(18.2, posRef.current.x));
          posRef.current.z = Math.max(-9.3, Math.min(4.8, posRef.current.z));
        } else {
          // Rooftop Helipad + Padel Court + Sky Terrace
          posRef.current.x = Math.max(-18.4, Math.min(18.4, posRef.current.x));
          posRef.current.z = Math.max(-9.5, Math.min(4.8, posRef.current.z));
        }

        // Smoothly rotate character toward movement heading
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
      : inputMag > 0.08
      ? "walking"
      : "idle";

    if (nextAction !== lastActionRef.current) {
      lastActionRef.current = nextAction;
      setBossActionState(nextAction);
    }

    const walkBob =
      nextAction === "walking" || nextAction === "running"
        ? Math.abs(Math.sin(t * (nextAction === "running" ? 11.5 : 8.0))) * 0.055
        : inPool
        ? Math.sin(t * 2.8) * 0.035
        : 0;

    posRef.current.y = baseFloorY + jumpOffsetRef.current;
    bossPositionRef.current = [
      posRef.current.x,
      baseFloorY + jumpOffsetRef.current - swimDepthRef.current * 0.65,
      posRef.current.z,
    ];

    root.position.set(
      posRef.current.x,
      baseFloorY + jumpOffsetRef.current - swimDepthRef.current + walkBob,
      posRef.current.z
    );
    root.rotation.y = yawRef.current;

    // 5. Realistic Swimming / Walking / Running / Idle Kinematics
    if (bodyPivotRef.current) {
      const targetPitch = inPool ? (inputMag > 0.1 ? 1.05 : 0.22) : 0;
      bodyPivotRef.current.rotation.x +=
        (targetPitch - bodyPivotRef.current.rotation.x) * Math.min(1, dt * 8);
    }

    if (rippleRef.current) {
      rippleRef.current.visible = inPool;
      if (inPool) {
        const pulse = 1 + Math.sin(t * 4.2) * 0.14;
        rippleRef.current.scale.set(pulse, pulse, 1);
      }
    }

    if (inPool) {
      const stroke = Math.sin(t * (inputMag > 0.1 ? 6.5 : 2.6));
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.6 + stroke * 0.95;
        leftArmRef.current.rotation.z = 0.45 + Math.cos(t * 4) * 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.6 - stroke * 0.95;
        rightArmRef.current.rotation.z = -0.45 - Math.cos(t * 4) * 0.2;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = stroke * 0.48;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stroke * 0.48;
      if (headRef.current) {
        headRef.current.rotation.x = inputMag > 0.1 ? -0.75 : -0.15;
        headRef.current.rotation.y = Math.sin(t * 1.4) * 0.14;
      }
    } else if (nextAction === "walking" || nextAction === "running") {
      const freq = nextAction === "running" ? 11.5 : 8.0;
      const amp = nextAction === "running" ? 0.78 : 0.56;
      const stride = Math.sin(t * freq);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * amp;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * amp;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -stride * (amp * 0.85);
        leftArmRef.current.rotation.z = 0.08;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = stride * (amp * 0.85);
        rightArmRef.current.rotation.z = -0.08;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = nextAction === "running" ? 0.14 : 0.05;
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = 0;
      }
    } else {
      const breathe = Math.sin(t * 2.2);
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.04 + breathe * 0.025;
        leftArmRef.current.rotation.z = 0.09;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.04 - breathe * 0.025;
        rightArmRef.current.rotation.z = -0.09;
      }
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0;
        torsoRef.current.position.y = 1.06 + breathe * 0.012;
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = Math.sin(t * 0.65) * 0.22;
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setIsBossMode(true);
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const [x, y, z] = bossPositionRef.current;
    focusCameraOn([x, y + 1.2, z], [3.5, 2.4, 4.5] as Vector3Tuple);
  };

  const skinColor = "#d9a986";
  const suitColor = "#131c2e"; // Bespoke luxury midnight navy-charcoal executive suit
  const hairColor = "#14161a";

  return (
    <group
      ref={rootRef}
      position={[
        bossPositionRef.current[0],
        bossPositionRef.current[1],
        bossPositionRef.current[2],
      ]}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Active Gold Player Ring on Ground */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.64, 32]} />
        <meshBasicMaterial
          color={isBossMode ? "#facc15" : "#fbbf24"}
          transparent
          opacity={isBossMode ? 0.95 : 0.45}
        />
      </mesh>

      {/* Water Swim Ripple Ring (visible automatically when swimming in pool!) */}
      <mesh
        ref={rippleRef}
        visible={false}
        position={[0, 1.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.42, 0.66, 28]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.78} />
      </mesh>

      {/* Pivot for realistic upright vs horizontal swimming tilt */}
      <group ref={bodyPivotRef} position={[0, 0, 0]}>
        {/* LEFT LEG */}
        <group ref={leftLegRef} position={[-0.11, 0.82, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow>
            <capsuleGeometry args={[0.076, 0.55, 8, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.72} />
          </mesh>
          <mesh position={[0, -0.74, 0.05]} castShadow>
            <capsuleGeometry args={[0.058, 0.13, 6, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.22} metalness={0.25} />
          </mesh>
        </group>

        {/* RIGHT LEG */}
        <group ref={rightLegRef} position={[0.11, 0.82, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow>
            <capsuleGeometry args={[0.076, 0.55, 8, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.72} />
          </mesh>
          <mesh position={[0, -0.74, 0.05]} castShadow>
            <capsuleGeometry args={[0.058, 0.13, 6, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.22} metalness={0.25} />
          </mesh>
        </group>

        {/* SCULPTED EXECUTIVE TORSO */}
        <group ref={torsoRef} position={[0, 1.06, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.165, 0.175, 0.24, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.72} />
          </mesh>
          {/* Gold Belt Buckle */}
          <mesh position={[0, -0.07, 0.165]}>
            <boxGeometry args={[0.08, 0.045, 0.025]} />
            <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.18} />
          </mesh>

          {/* Tapered Bespoke Suit Jacket */}
          <mesh position={[0, 0.15, 0]} scale={[1.26, 1, 0.76]} castShadow>
            <cylinderGeometry args={[0.195, 0.155, 0.52, 16]} />
            <meshStandardMaterial color={suitColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.37, 0]} scale={[1.32, 0.5, 0.76]} castShadow>
            <sphereGeometry args={[0.195, 16, 12]} />
            <meshStandardMaterial color={suitColor} roughness={0.6} />
          </mesh>

          {/* Crisp White Dress Shirt & Gold Silk Tie */}
          <mesh position={[0, 0.23, 0.118]}>
            <boxGeometry args={[0.12, 0.32, 0.036]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.18, 0.14]}>
            <boxGeometry args={[0.044, 0.25, 0.015]} />
            <meshStandardMaterial color="#d97706" roughness={0.35} metalness={0.25} />
          </mesh>
          {/* Gold Pocket Square & CEO Lapel Pin */}
          <mesh position={[0.12, 0.25, 0.136]}>
            <boxGeometry args={[0.06, 0.022, 0.014]} />
            <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* LEFT ARM + LUXURY GOLD WATCH */}
          <group ref={leftArmRef} position={[-0.255, 0.35, 0]}>
            <mesh position={[0, -0.24, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.4, 8, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.052, 0.052, 0.045, 12]} />
              <meshStandardMaterial color="#facc15" metalness={0.92} roughness={0.15} />
            </mesh>
            <mesh position={[0, -0.52, 0]}>
              <sphereGeometry args={[0.054, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
          </group>

          {/* RIGHT ARM */}
          <group ref={rightArmRef} position={[0.255, 0.35, 0]}>
            <mesh position={[0, -0.24, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.4, 8, 12]} />
              <meshStandardMaterial color={suitColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.05, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.52, 0]}>
              <sphereGeometry args={[0.054, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
          </group>

          {/* NECK & SCULPTED HEAD */}
          <group ref={headRef} position={[0, 0.45, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.058, 0.068, 0.12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.2, 0]} scale={[0.94, 1.08, 0.96]} castShadow>
              <sphereGeometry args={[0.146, 18, 16]} />
              <meshStandardMaterial color={skinColor} roughness={0.64} />
            </mesh>
            {[-0.134, 0.134].map((ex, i) => (
              <mesh key={i} position={[ex, 0.19, -0.01]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color={skinColor} roughness={0.68} />
              </mesh>
            ))}
            <mesh position={[0, 0.185, 0.138]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.66} />
            </mesh>
            {/* Stylish Dark Sunglasses / Eyes */}
            <mesh position={[-0.046, 0.21, 0.13]}>
              <boxGeometry args={[0.054, 0.032, 0.02]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.12} />
            </mesh>
            <mesh position={[0.046, 0.21, 0.13]}>
              <boxGeometry args={[0.054, 0.032, 0.02]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.12} />
            </mesh>
            <mesh position={[0, 0.212, 0.132]}>
              <boxGeometry args={[0.04, 0.01, 0.016]} />
              <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Groomed Executive Pompadour Hair */}
            <mesh position={[0, 0.27, -0.01]} castShadow>
              <sphereGeometry
                args={[0.152, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]}
              />
              <meshStandardMaterial color={hairColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.31, 0.05]} castShadow>
              <boxGeometry args={[0.19, 0.06, 0.16]} />
              <meshStandardMaterial color={hairColor} roughness={0.68} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Distance-Scaled Gold Crown Nameplate above BOS FAJREZ */}
      {showLabelsIn3D && (
        <Html
          position={[0, 2.15, 0]}
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
