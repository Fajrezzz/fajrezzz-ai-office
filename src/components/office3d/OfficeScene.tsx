"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CyberOutdoorCampus } from "@/components/office3d/CyberOutdoorCampus";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset, Vector3Tuple } from "@/types/office";

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: Vector3Tuple; target: Vector3Tuple }
> = {
  // Hero front-quarter framing: Grand 28m HQ + Pool + Supercar fills screen cleanly
  front: { pos: [14, 12.2, 28.5], target: [0, 4.6, 1.8] },
  isometric: { pos: [-26, 20, 26], target: [0, 4.5, 1.5] },
  interior: { pos: [0, 12.8, 13.8], target: [0, 4.4, -3.2] },
  executive: { pos: [11, 13.5, 13.5], target: [0, 8.6, -3.2] },
  rooftop: { pos: [18, 22.5, 16.5], target: [0, 11.8, -2.5] },
  pool: { pos: [12.5, 5.2, 22.0], target: [-1.5, 1.5, 10.5] },
  supercar: { pos: [14.8, 3.6, 17.6], target: [9.2, 0.9, 11.2] },
};

function FreeRoamCameraRig() {
  const {
    cameraPreset,
    cameraResetTick,
    cameraFocusCommand,
    cameraNudgeRef,
    autoRotate,
  } = useOffice();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.front.pos));
  const desiredTargetRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.front.target)
  );
  const isTransitioningRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());

  const forwardVec = useMemo(() => new THREE.Vector3(), []);
  const rightVec = useMemo(() => new THREE.Vector3(), []);
  const moveDelta = useMemo(() => new THREE.Vector3(), []);

  // Preset trigger
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset] ?? CAMERA_PRESETS.front;
    desiredPosRef.current.set(...preset.pos);
    desiredTargetRef.current.set(...preset.target);
    isTransitioningRef.current = true;
  }, [cameraPreset, cameraResetTick]);

  // Free-roam point focus trigger (double-click anywhere in 3D or tap Focus on staff)
  useEffect(() => {
    if (!cameraFocusCommand) return;
    const [tx, ty, tz] = cameraFocusCommand.target;
    const ctrl = controlsRef.current;

    desiredTargetRef.current.set(tx, ty, tz);

    if (cameraFocusCommand.offset) {
      const [ox, oy, oz] = cameraFocusCommand.offset;
      desiredPosRef.current.set(tx + ox, ty + oy, tz + oz);
    } else if (ctrl) {
      // Keep current viewing angle, glide comfortably close to the clicked 3D point
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

  // PC Keyboard WASD / Arrow Keys / Q-E Free-Roam navigation
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
        isTransitioningRef.current = false;
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
  }, []);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const dt = Math.min(delta, 0.05);

    // 1) Combine PC keyboard + Mobile on-screen Free-Roam D-Pad inputs
    const keys = keysPressedRef.current;
    let moveF = cameraNudgeRef.current.forward;
    let moveR = cameraNudgeRef.current.right;
    let moveU = cameraNudgeRef.current.up;

    if (keys.has("w") || keys.has("arrowup")) moveF += 1;
    if (keys.has("s") || keys.has("arrowdown")) moveF -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveR += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveR -= 1;
    if (keys.has("e")) moveU += 1;
    if (keys.has("q")) moveU -= 1;

    if (moveF !== 0 || moveR !== 0 || moveU !== 0) {
      isTransitioningRef.current = false;

      // Project camera look direction onto horizontal ground plane
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

      // Keep above ground cleanly
      const nextTargetY = ctrl.target.y + moveDelta.y;
      if (nextTargetY < 0.35) {
        moveDelta.y = 0.35 - ctrl.target.y;
      }

      camera.position.add(moveDelta);
      ctrl.target.add(moveDelta);
    }

    // 2) Smooth one-shot transition to preset or double-clicked 3D point
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
      autoRotate={autoRotate}
      autoRotateSpeed={0.55}
      onStart={() => {
        // User always wins control immediately
        isTransitioningRef.current = false;
      }}
    />
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

  const bgColor = isNight ? "#0b1426" : isSunset ? "#d89f78" : "#bdd9f0";
  const fogColor = isNight ? "#0d172b" : isSunset ? "#dfb08f" : "#c8dff2";
  const sunPosition: [number, number, number] = isNight
    ? [-22, 18, -16]
    : isSunset
    ? [-34, 9, 20]
    : [26, 36, 24];

  const sunColor = isNight ? "#8bb4e8" : isSunset ? "#ffb074" : "#fff7ea";
  const sunIntensity = isNight ? 0.52 : isSunset ? 2.15 : 2.75;
  const shadowSize = performanceMode === "eco" ? 1024 : 2048;

  // Filter agents by cutaway floor visibility so hidden floors don't leave floating people
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
      <fog attach="fog" args={[fogColor, 58, 155]} />

      {/* Realistic Daylight / Golden Hour Sky */}
      {!isNight && (
        <Sky
          distance={4500}
          sunPosition={sunPosition}
          turbidity={isSunset ? 8 : 3.2}
          rayleigh={isSunset ? 2.4 : 0.9}
          mieCoefficient={0.004}
          mieDirectionalG={0.82}
        />
      )}

      {/* Zero-network Studio/Architectural IBL Reflections for razor-sharp glass, metal & clearcoat */}
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

      {/* Architectural 3-Point Daylight & Hemisphere Fill */}
      <hemisphereLight
        args={[
          isNight ? "#243b5e" : isSunset ? "#ffd1a8" : "#dceeff",
          isNight ? "#121a29" : "#5e6a54",
          isNight ? 0.58 : isSunset ? 0.95 : 1.05,
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
      {/* Cool architectural sky bounce light from opposite angle */}
      <directionalLight
        position={[-20, 14, -18]}
        intensity={isNight ? 0.32 : 0.55}
        color={isNight ? "#4f74a8" : "#c5e1ff"}
      />

      {/* Grand Outdoor Luxury Campus */}
      <CyberOutdoorCampus
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* Grand 28m 3-Story Luxury Modern HQ */}
      <OfficeArchitecture
        activeFloor={activeFloor}
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        onFocusPoint={(pt) => focusCameraOn(pt)}
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

      {/* Unrestricted Free-Roam Camera Rig */}
      <FreeRoamCameraRig />
    </>
  );
}
