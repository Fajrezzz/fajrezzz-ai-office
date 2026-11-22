"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset } from "@/types/office";

const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  isometric: {
    position: [13.5, 11.2, 13.5],
    target: [0, 0.5, 0],
  },
  overview: {
    position: [0.5, 16.5, 12.5],
    target: [0, 0.2, 0],
  },
  workstations: {
    position: [4.8, 7.6, 8.6],
    target: [-2.0, 0.7, -1.6],
  },
  holohub: {
    position: [6.5, 5.2, 6.8],
    target: [0.4, 1.0, 0.8],
  },
};

function CameraRig({
  preset,
  resetTick,
}: {
  preset: CameraPreset;
  resetTick: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const animatingRef = useRef<boolean>(false);
  const goalPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.isometric.position));
  const goalTargetRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.isometric.target));

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
      rotateSpeed={0.85}
      zoomSpeed={0.9}
      panSpeed={0.75}
      minDistance={6.5}
      maxDistance={26}
      minPolarAngle={0.35}
      maxPolarAngle={Math.PI / 2.15}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={() => {
        // Yield immediately when user interacts via mouse or touch
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
    performanceMode,
    isSimulationRunning,
    showLabelsIn3D,
    notifyAgentArrived,
    sendAgentToWaypoint,
  } = useOffice();

  const enableShadows = performanceMode !== "eco";

  return (
    <>
      <color attach="background" args={["#040814"]} />
      <fog attach="fog" args={["#040814", 20, 40]} />

      {/* Cyberpunk Balanced Lighting (Android-friendly light count) */}
      <hemisphereLight args={["#38bdf8", "#0b1120", 0.65]} />
      <directionalLight
        position={[10, 16, 10]}
        intensity={1.15}
        color="#e0f2fe"
        castShadow={enableShadows}
        shadow-mapSize-width={performanceMode === "high" ? 1024 : 512}
        shadow-mapSize-height={performanceMode === "high" ? 1024 : 512}
        shadow-camera-near={1}
        shadow-camera-far={36}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Electric blue & purple neon accent fill lights (1 light in Eco mode for Android GPU savings) */}
      <pointLight
        position={[-4.5, 3.6, -4.2]}
        intensity={performanceMode === "eco" ? 7 : 6}
        distance={16}
        color="#00e5ff"
      />
      {performanceMode !== "eco" && (
        <pointLight
          position={[3.8, 3.4, 2.8]}
          intensity={6}
          distance={14}
          color="#a855f7"
        />
      )}

      <CameraRig preset={cameraPreset} resetTick={cameraResetTick} />

      <OfficeArchitecture performanceMode={performanceMode} />

      <WorkstationCluster
        workstations={workstations}
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
  );
}
