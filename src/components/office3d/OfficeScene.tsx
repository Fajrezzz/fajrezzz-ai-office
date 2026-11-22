"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { CyberOutdoorCampus } from "@/components/office3d/CyberOutdoorCampus";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset } from "@/types/office";

const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  front: {
    position: [2.5, 11.2, 26.5],
    target: [0, 3.8, 0.5],
  },
  isometric: {
    position: [21.5, 15.8, 22.5],
    target: [0, 3.8, 0.0],
  },
  interior: {
    position: [0.6, 5.7, 4.4],
    target: [0, 4.5, -3.6],
  },
  pool: {
    position: [-10.5, 4.4, 17.0],
    target: [-1.5, 2.2, 5.2],
  },
  supercar: {
    position: [12.4, 3.0, 14.2],
    target: [5.2, 1.0, 7.8],
  },
  rooftop: {
    position: [12.5, 16.5, 10.5],
    target: [0, 9.8, -3.0],
  },
};

function CameraRig({
  preset,
  resetTick,
  autoRotate,
}: {
  preset: CameraPreset;
  resetTick: number;
  autoRotate: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const animatingRef = useRef<boolean>(false);
  const goalPosRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.front.position)
  );
  const goalTargetRef = useRef(
    new THREE.Vector3(...CAMERA_PRESETS.front.target)
  );

  useEffect(() => {
    const cfg = CAMERA_PRESETS[preset];
    goalPosRef.current.set(...cfg.position);
    goalTargetRef.current.set(...cfg.target);
    animatingRef.current = true;
  }, [preset, resetTick]);

  useFrame((_, rawDelta) => {
    if (!animatingRef.current || !controlsRef.current) return;
    const alpha = Math.min(1, Math.min(rawDelta, 0.05) * 4.5);

    camera.position.lerp(goalPosRef.current, alpha);
    controlsRef.current.target.lerp(goalTargetRef.current, alpha);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(goalPosRef.current) < 0.08 &&
      controlsRef.current.target.distanceTo(goalTargetRef.current) < 0.08
    ) {
      animatingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enableRotate
      enableZoom
      enablePan
      autoRotate={autoRotate}
      autoRotateSpeed={0.85}
      rotateSpeed={0.85}
      zoomSpeed={0.95}
      panSpeed={0.8}
      minDistance={5.5}
      maxDistance={46}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2.08}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={() => {
        animatingRef.current = false;
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
    cameraPreset,
    cameraResetTick,
    activeFloor,
    autoRotate,
    performanceMode,
    isSimulationRunning,
    showLabelsIn3D,
    notifyAgentArrived,
    sendAgentToWaypoint,
  } = useOffice();

  const enableShadows = performanceMode !== "eco";
  const showOperationsFloorContent = activeFloor !== "l1";

  return (
    <>
      {/* Deep Cyberpunk Night Sky Backdrop */}
      <color attach="background" args={["#050a1a"]} />
      <fog attach="fog" args={["#050a1a", 34, 72]} />

      {/* Bright Cyberpunk Futuristic Illumination (tuned so lights & glass shine vividly) */}
      <hemisphereLight args={["#7dd3fc", "#1e1b4b", 0.95]} />
      <directionalLight
        position={[16, 26, 20]}
        intensity={1.35}
        color="#e0f2fe"
        castShadow={enableShadows}
        shadow-mapSize-width={performanceMode === "high" ? 1024 : 512}
        shadow-mapSize-height={performanceMode === "high" ? 1024 : 512}
        shadow-camera-near={2}
        shadow-camera-far={65}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Bright Interior Floor 2 Neon Glow Light */}
      <pointLight
        position={[0, 5.8, -2.5]}
        intensity={18}
        distance={22}
        color="#bae6fd"
      />

      {/* Pool & Supercar Vibrant Cyber Accent Light */}
      <pointLight
        position={[2.0, 4.5, 9.0]}
        intensity={15}
        distance={22}
        color="#00e5ff"
      />

      {/* Extra Purple Rim Light on Balanced/High modes */}
      {performanceMode !== "eco" && (
        <pointLight
          position={[-7.5, 8.0, 2.0]}
          intensity={14}
          distance={24}
          color="#c084fc"
        />
      )}

      <CameraRig
        preset={cameraPreset}
        resetTick={cameraResetTick}
        autoRotate={autoRotate}
      />

      <CyberOutdoorCampus performanceMode={performanceMode} />

      <OfficeArchitecture
        performanceMode={performanceMode}
        activeFloor={activeFloor}
        showLabels={showLabelsIn3D}
      />

      {showOperationsFloorContent && (
        <>
          <WorkstationCluster
            workstations={workstations}
            agents={agents}
            showLabels={showLabelsIn3D}
            onSelectWorkstation={(ws) => {
              if (selectedAgentId) {
                sendAgentToWaypoint(selectedAgentId, ws.waypointId);
              }
            }}
          />

          {agents.map((agent) => (
            <RobotCharacter
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              isSimulationRunning={isSimulationRunning}
              showLabel={showLabelsIn3D}
              onSelect={setSelectedAgentId}
              onArrived={notifyAgentArrived}
            />
          ))}
        </>
      )}
    </>
  );
}
