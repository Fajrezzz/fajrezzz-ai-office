"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BossPlayer } from "@/components/office3d/BossPlayer";
import { CyberOutdoorCampus } from "@/components/office3d/CyberOutdoorCampus";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { OfficeExtrasStaff } from "@/components/office3d/OfficeExtrasStaff";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset, Vector3Tuple } from "@/types/office";

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: Vector3Tuple; target: Vector3Tuple }
> = {
  front: { pos: [14, 12.2, 28.5], target: [0, 4.6, 1.8] },
  isometric: { pos: [-26, 20, 26], target: [0, 4.5, 1.5] },
  interior: { pos: [0, 12.8, 13.8], target: [0, 4.4, -3.2] },
  executive: { pos: [11, 13.5, 13.5], target: [0, 8.6, -3.2] },
  rooftop: { pos: [18, 22.5, 16.5], target: [0, 11.8, -2.5] },
  pool: { pos: [12.5, 5.2, 22.0], target: [-1.5, 1.5, 10.5] },
  supercar: { pos: [14.8, 3.6, 17.6], target: [9.4, 0.9, 11.3] },
};

function FreeRoamCameraRig() {
  const {
    cameraPreset,
    cameraResetTick,
    cameraFocusCommand,
    cameraNudgeRef,
    autoRotate,
    isBossMode,
    bossFollowCamera,
    bossPositionRef,
    bossTeleportCommand,
  } = useOffice();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.front.pos));
  const desiredTargetRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.front.target)
  );
  const isTransitioningRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const prevBossTargetRef = useRef(new THREE.Vector3(2.8, 1.5, 6.2));
  const bossInitializedRef = useRef(false);

  const forwardVec = useMemo(() => new THREE.Vector3(), []);
  const rightVec = useMemo(() => new THREE.Vector3(), []);
  const moveDelta = useMemo(() => new THREE.Vector3(), []);
  const bossTargetVec = useMemo(() => new THREE.Vector3(), []);

  // Preset trigger
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset] ?? CAMERA_PRESETS.front;
    desiredPosRef.current.set(...preset.pos);
    desiredTargetRef.current.set(...preset.target);
    isTransitioningRef.current = true;
  }, [cameraPreset, cameraResetTick]);

  // Snap smoothly behind BOS FAJREZ when Boss Mode is activated or Boss teleports
  useEffect(() => {
    if (!isBossMode || !bossFollowCamera) {
      bossInitializedRef.current = false;
      return;
    }
    const [bx, by, bz] = bossPositionRef.current;
    desiredTargetRef.current.set(bx, by + 1.35, bz);
    desiredPosRef.current.set(bx + 4.8, by + 4.6, bz + 7.8);
    prevBossTargetRef.current.set(bx, by + 1.35, bz);
    isTransitioningRef.current = true;
    bossInitializedRef.current = true;
  }, [isBossMode, bossFollowCamera, bossTeleportCommand, bossPositionRef]);

  // Free-roam point focus trigger
  useEffect(() => {
    if (!cameraFocusCommand) return;
    const [tx, ty, tz] = cameraFocusCommand.target;
    const ctrl = controlsRef.current;

    desiredTargetRef.current.set(tx, ty, tz);

    if (cameraFocusCommand.offset) {
      const [ox, oy, oz] = cameraFocusCommand.offset;
      desiredPosRef.current.set(tx + ox, ty + oy, tz + oz);
    } else if (ctrl) {
      const dir = camera.position.clone().sub(ctrl.target);
      const currentDist = dir.length();
      const targetDist = Math.min(Math.max(currentDist * 0.6, 5.2), 12.5);
      if (dir.lengthSq() < 0.001) {
        dir.set(4, 3.5, 6);
      }
      dir.normalize().multiplyScalar(targetDist);
      desiredPosRef.current.set(
        tx + dir.x,
        Math.max(ty + Math.max(dir.y, 1.8), 1.6),
        tz + dir.z
      );
    }
    isTransitioningRef.current = true;
  }, [cameraFocusCommand, camera]);

  // PC Keyboard WASD / Arrows / Q-E Free-Roam camera (disabled while Boss Mode owns WASD)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "q",
          "e",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        keysPressedRef.current.add(key);
        if (!isBossMode) {
          isTransitioningRef.current = false;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      keysPressedRef.current.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isBossMode]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const dt = Math.min(delta, 0.05);

    // 1) Third-person Game Follow Camera when playing as BOS FAJREZ
    if (isBossMode && bossFollowCamera) {
      const [bx, by, bz] = bossPositionRef.current;
      bossTargetVec.set(bx, by + 1.35, bz);

      if (isTransitioningRef.current) {
        const lerpFactor = Math.min(1, dt * 6.5);
        camera.position.lerp(desiredPosRef.current, lerpFactor);
        ctrl.target.lerp(bossTargetVec, lerpFactor);
        prevBossTargetRef.current.copy(bossTargetVec);

        if (
          camera.position.distanceTo(desiredPosRef.current) < 0.12 &&
          ctrl.target.distanceTo(bossTargetVec) < 0.12
        ) {
          isTransitioningRef.current = false;
        }
      } else {
        // Shift camera & target together by BOS FAJREZ's movement delta so user can freely orbit/zoom around him!
        moveDelta.copy(bossTargetVec).sub(prevBossTargetRef.current);
        camera.position.add(moveDelta);
        ctrl.target.lerp(bossTargetVec, Math.min(1, dt * 10));
        prevBossTargetRef.current.copy(bossTargetVec);
      }

      ctrl.update();
      return;
    }

    // 2) Free-Roam Camera movement (PC WASD/Arrows + Mobile Free-Roam Pad)
    const keys = keysPressedRef.current;
    let moveF = cameraNudgeRef.current.forward;
    let moveR = cameraNudgeRef.current.right;
    let moveU = cameraNudgeRef.current.up;

    if (!isBossMode) {
      if (keys.has("w") || keys.has("arrowup")) moveF += 1;
      if (keys.has("s") || keys.has("arrowdown")) moveF -= 1;
      if (keys.has("d") || keys.has("arrowright")) moveR += 1;
      if (keys.has("a") || keys.has("arrowleft")) moveR -= 1;
      if (keys.has("e")) moveU += 1;
      if (keys.has("q")) moveU -= 1;
    }

    if (moveF !== 0 || moveR !== 0 || moveU !== 0) {
      isTransitioningRef.current = false;

      camera.getWorldDirection(forwardVec);
      forwardVec.y = 0;
      if (forwardVec.lengthSq() < 0.0001) {
        forwardVec.set(0, 0, -1);
      } else {
        forwardVec.normalize();
      }
      rightVec.crossVectors(forwardVec, camera.up).normalize();

      const speed = 13.5 * dt;
      moveDelta.set(0, 0, 0);
      moveDelta.addScaledVector(forwardVec, moveF * speed);
      moveDelta.addScaledVector(rightVec, moveR * speed);
      moveDelta.y += moveU * (speed * 0.75);

      const nextTargetY = ctrl.target.y + moveDelta.y;
      if (nextTargetY < 0.35) {
        moveDelta.y = 0.35 - ctrl.target.y;
      }

      camera.position.add(moveDelta);
      ctrl.target.add(moveDelta);
    }

    // 3) Smooth one-shot preset or double-click focus transition
    if (isTransitioningRef.current) {
      const lerpFactor = Math.min(1, dt * 6.2);
      camera.position.lerp(desiredPosRef.current, lerpFactor);
      ctrl.target.lerp(desiredTargetRef.current, lerpFactor);

      if (
        camera.position.distanceTo(desiredPosRef.current) < 0.08 &&
        ctrl.target.distanceTo(desiredTargetRef.current) < 0.08
      ) {
        camera.position.copy(desiredPosRef.current);
        ctrl.target.copy(desiredTargetRef.current);
        isTransitioningRef.current = false;
      }
    }

    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.075}
      enablePan
      screenSpacePanning={false}
      panSpeed={1.25}
      zoomSpeed={1.15}
      rotateSpeed={0.85}
      minDistance={1.4}
      maxDistance={85}
      maxPolarAngle={Math.PI * 0.492}
      autoRotate={autoRotate && !isBossMode}
      autoRotateSpeed={0.55}
      onStart={() => {
        isTransitioningRef.current = false;
      }}
    />
  );
}

/** Crisp clear tropical blue sky dome for Daytime — zero milky white fog glare! */
function ClearDaySkyDome() {
  const skyTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, "#1d6ec4"); // deep clear zenith blue
    grad.addColorStop(0.38, "#3b96e6"); // crisp mid-sky azure
    grad.addColorStop(0.54, "#74bff2"); // clean bright horizon sky blue (never white fog!)
    grad.addColorStop(1.0, "#8fd0f8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[280, 20, 14]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

export function OfficeScene() {
  const {
    agents,
    workstations,
    selectedAgentId,
    setSelectedAgentId,
    activeFloor,
    lightingPreset,
    performanceMode,
    isSimulationRunning,
    showLabelsIn3D,
    notifyAgentArrived,
    sendAgentToWaypoint,
    focusCameraOn,
  } = useOffice();

  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  const bgColor = isNight ? "#071022" : isSunset ? "#d48b63" : "#4ea8ea";
  const fogColor = isNight ? "#091326" : isSunset ? "#d99d7a" : "#7cc0f0";
  const sunPosition: [number, number, number] = isNight
    ? [-22, 18, -16]
    : isSunset
    ? [-34, 9, 20]
    : [32, 48, 28];

  const sunColor = isNight ? "#9ec5f8" : isSunset ? "#ffb074" : "#fff9ef";
  const sunIntensity = isNight ? 0.88 : isSunset ? 2.05 : 2.15;
  const shadowSize = performanceMode === "eco" ? 1024 : 2048;

  const visibleAgents = useMemo(() => {
    return agents.filter((a) => {
      if (activeFloor === "l1") return a.floor === 1;
      if (activeFloor === "l2") return a.floor === 1 || a.floor === 2;
      return true;
    });
  }, [agents, activeFloor]);

  const showWorkstations = activeFloor !== "l1";

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[fogColor, 175, 360]} />

      {isSunset && (
        <Sky
          distance={4500}
          sunPosition={sunPosition}
          turbidity={6.5}
          rayleigh={2.2}
          mieCoefficient={0.003}
          mieDirectionalG={0.72}
        />
      )}
      {!isNight && !isSunset && <ClearDaySkyDome />}

      <Environment resolution={256} frames={1}>
        <Lightformer
          form="ring"
          intensity={isNight ? 0.65 : isSunset ? 1.8 : 2.4}
          color={isNight ? "#60a5fa" : isSunset ? "#ffc896" : "#ffffff"}
          scale={18}
          position={[0, 18, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={isNight ? 0.45 : isSunset ? 2.2 : 1.7}
          color={isSunset ? "#ff9e5e" : "#e0f2fe"}
          scale={[24, 10, 1]}
          position={[18, 8, 16]}
          target={[0, 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={isNight ? 0.35 : 0.9}
          color="#cbd5e1"
          scale={[24, 10, 1]}
          position={[-18, 7, -14]}
          target={[0, 4, 0]}
        />
      </Environment>

      <hemisphereLight
        args={[
          isNight ? "#335280" : isSunset ? "#ffd1a8" : "#dceeff",
          isNight ? "#1a2438" : "#5e6a54",
          isNight ? 0.92 : isSunset ? 0.98 : 1.08,
        ]}
      />
      <directionalLight
        position={sunPosition}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-24}
        shadow-camera-near={2}
        shadow-camera-far={95}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
      <directionalLight
        position={[-20, 14, -18]}
        intensity={isNight ? 0.32 : 0.55}
        color={isNight ? "#4f74a8" : "#c5e1ff"}
      />

      {/* Grand Outdoor Luxury Campus with REAL Recessed Swimming Pool & Curved GT Supercar */}
      <CyberOutdoorCampus
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* Grand 28m 3-Story Luxury Architectural HQ + Rooftop Helicopter & Badminton Court */}
      <OfficeArchitecture
        activeFloor={activeFloor}
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        isSimulationRunning={isSimulationRunning}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* L3 VIP Executives (CEO, Manajer Senior, Sekretaris, CFO) + L1 Reception & Lounge Staff */}
      <OfficeExtrasStaff
        activeFloor={activeFloor}
        showLabels={showLabelsIn3D}
        isSimulationRunning={isSimulationRunning}
      />

      {/* 8 Modern L2 Workstations */}
      {showWorkstations && (
        <WorkstationCluster
          workstations={workstations}
          agents={agents}
          lightingPreset={lightingPreset}
          onSelectWorkstation={(ws) => {
            if (selectedAgentId) {
              sendAgentToWaypoint(selectedAgentId, ws.waypointId);
            }
          }}
          onFocusPoint={(pt) => focusCameraOn(pt, [2.6, 2.2, 3.4])}
        />
      )}

      {/* 10 Realistic Humanoid Placeholder Staff Avatars */}
      {visibleAgents.map((agent) => (
        <RobotCharacter
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedAgentId}
          isSimulationRunning={isSimulationRunning}
          showLabels={showLabelsIn3D}
          onSelect={setSelectedAgentId}
          onFocusPoint={(pt) => focusCameraOn(pt, [3.2, 2.0, 4.2])}
          onArrive={notifyAgentArrived}
        />
      ))}

      {/* Playable Character #11: BOS FAJREZ */}
      <BossPlayer />

      {/* Free-Roam & Third-Person Game Follow Camera Rig */}
      <FreeRoamCameraRig />
    </>
  );
}
