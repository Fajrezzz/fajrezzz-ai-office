"use client";

import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { CyberOutdoorCampus } from "@/components/office3d/CyberOutdoorCampus";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { useOffice } from "@/store/OfficeContext";
import type { CameraPreset, LightingPreset } from "@/types/office";

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

const LIGHTING_CONFIGS: Record<
  LightingPreset,
  {
    bg: string;
    fogColor: string;
    sunPos: [number, number, number];
    sunIntensity: number;
    sunColor: string;
    hemiSky: string;
    hemiGround: string;
    hemiIntensity: number;
    interiorLightIntensity: number;
    poolLampIntensity: number;
    envTop: string;
    envHorizon: string;
    skyTurbidity: number;
    skyRayleigh: number;
  }
> = {
  day: {
    bg: "#c7e2f8",
    fogColor: "#d5e8f8",
    sunPos: [22, 32, 24],
    sunIntensity: 2.3,
    sunColor: "#fffaf0",
    hemiSky: "#bae6fd",
    hemiGround: "#8a7f6d",
    hemiIntensity: 1.05,
    interiorLightIntensity: 12,
    poolLampIntensity: 4,
    envTop: "#bae6fd",
    envHorizon: "#ffffff",
    skyTurbidity: 4,
    skyRayleigh: 0.9,
  },
  sunset: {
    bg: "#e9b994",
    fogColor: "#e6c3a5",
    sunPos: [32, 11, 18],
    sunIntensity: 2.1,
    sunColor: "#ffd29d",
    hemiSky: "#fed7aa",
    hemiGround: "#59483b",
    hemiIntensity: 0.95,
    interiorLightIntensity: 20,
    poolLampIntensity: 14,
    envTop: "#93c5fd",
    envHorizon: "#fdba74",
    skyTurbidity: 8,
    skyRayleigh: 2.2,
  },
  night: {
    bg: "#0f172a",
    fogColor: "#142038",
    sunPos: [-18, 24, 16],
    sunIntensity: 0.55,
    sunColor: "#93c5fd",
    hemiSky: "#334155",
    hemiGround: "#1e293b",
    hemiIntensity: 0.55,
    interiorLightIntensity: 26,
    poolLampIntensity: 22,
    envTop: "#1e3a8a",
    envHorizon: "#f59e0b",
    skyTurbidity: 10,
    skyRayleigh: 0.2,
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
      autoRotateSpeed={0.8}
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
    lightingPreset,
    autoRotate,
    performanceMode,
    isSimulationRunning,
    showLabelsIn3D,
    notifyAgentArrived,
    sendAgentToWaypoint,
  } = useOffice();

  const lightCfg = LIGHTING_CONFIGS[lightingPreset];
  const shadowMapSize =
    performanceMode === "high"
      ? 2048
      : performanceMode === "balanced"
      ? 1024
      : 512;
  const showOperationsFloorContent = activeFloor !== "l1";

  return (
    <>
      <color attach="background" args={[lightCfg.bg]} />
      <fog attach="fog" args={[lightCfg.fogColor, 42, 95]} />

      {/* Realistic Physical Sky Atmosphere (Day & Golden Hour Sunset) */}
      {lightingPreset !== "night" && (
        <Sky
          distance={450000}
          sunPosition={lightCfg.sunPos}
          inclination={0.48}
          azimuth={0.25}
          turbidity={lightCfg.skyTurbidity}
          rayleigh={lightCfg.skyRayleigh}
        />
      )}

      {/* Procedural Offline IBL Environment for True PBR Glass, Car Clearcoat & Water Reflections */}
      <Environment resolution={128} frames={1} key={lightingPreset}>
        <Lightformer
          form="rect"
          intensity={lightingPreset === "night" ? 0.6 : 1.8}
          color={lightCfg.envTop}
          scale={[30, 30, 1]}
          position={[0, 15, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={lightingPreset === "night" ? 1.0 : 3.2}
          color={lightCfg.sunColor}
          scale={8}
          position={lightCfg.sunPos}
        />
        <Lightformer
          form="ring"
          intensity={lightingPreset === "night" ? 0.8 : 1.4}
          color={lightCfg.envHorizon}
          scale={24}
          position={[0, 4, 18]}
          rotation={[0, Math.PI, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#d6c5b3"
          scale={[30, 30, 1]}
          position={[0, -10, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </Environment>

      {/* Primary Real-World Natural Sky + Sun Shadows */}
      <hemisphereLight
        args={[lightCfg.hemiSky, lightCfg.hemiGround, lightCfg.hemiIntensity]}
      />
      <directionalLight
        position={lightCfg.sunPos}
        intensity={lightCfg.sunIntensity}
        color={lightCfg.sunColor}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-camera-near={2}
        shadow-camera-far={75}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      {/* Warm Architectural Interior Illumination (Floor 2 Operations & Floor 1 Lobby) */}
      <pointLight
        position={[0, 5.9, -2.8]}
        intensity={lightCfg.interiorLightIntensity}
        distance={24}
        decay={1.6}
        color="#fff1d6"
      />
      <pointLight
        position={[0, 2.6, -2.5]}
        intensity={lightCfg.interiorLightIntensity * 0.75}
        distance={18}
        decay={1.6}
        color="#ffebc7"
      />

      {/* Warm Poolside Architectural Lantern & Pool Glow */}
      <pointLight
        position={[1.5, 3.8, 9.2]}
        intensity={lightCfg.poolLampIntensity}
        distance={24}
        decay={1.6}
        color={lightingPreset === "day" ? "#fff7ed" : "#ffd28a"}
      />

      {/* Extra Floor 3 & Facade Fill Light on Balanced/High */}
      {performanceMode !== "eco" && (
        <pointLight
          position={[-4, 8.8, -2.5]}
          intensity={lightCfg.interiorLightIntensity * 0.7}
          distance={20}
          decay={1.6}
          color="#fff1d6"
        />
      )}

      <CameraRig
        preset={cameraPreset}
        resetTick={cameraResetTick}
        autoRotate={autoRotate}
      />

      <CyberOutdoorCampus
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
      />

      <OfficeArchitecture
        performanceMode={performanceMode}
        activeFloor={activeFloor}
        lightingPreset={lightingPreset}
        showLabels={showLabelsIn3D}
      />

      {showOperationsFloorContent && (
        <>
          <WorkstationCluster
            workstations={workstations}
            agents={agents}
            lightingPreset={lightingPreset}
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
