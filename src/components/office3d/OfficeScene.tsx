"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AdaptivePerformanceController } from "@/components/office3d/AdaptivePerformanceController";
import { BossPlayer } from "@/components/office3d/BossPlayer";
import { CyberOutdoorCampus } from "@/components/office3d/CyberOutdoorCampus";
import { DrivableVehicles } from "@/components/office3d/DrivableVehicles";
import { InteriorActivityRooms } from "@/components/office3d/InteriorActivityRooms";
import { OfficeArchitecture } from "@/components/office3d/OfficeArchitecture";
import { OfficeExtrasStaff } from "@/components/office3d/OfficeExtrasStaff";
import { RobotCharacter } from "@/components/office3d/RobotCharacter";
import { CrownSkyDeck } from "@/components/office3d/CrownSkyDeck";
import { WeatherEffects } from "@/components/office3d/WeatherEffects";
import { WorkstationCluster } from "@/components/office3d/WorkstationCluster";
import { useOffice } from "@/store/OfficeContext";
import { useSimulator } from "@/store/SimulatorContext";
import {
  shadowMapSizeFor,
  shadowUpdateStrideFor,
} from "@/lib/perf/render-telemetry";
import { applyTextureQuality } from "@/components/office3d/realisticTextures";
import type { CameraPreset, Vector3Tuple } from "@/types/office";

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: Vector3Tuple; target: Vector3Tuple }
> = {
  front: { pos: [17, 16.5, 34.5], target: [0, 8.6, 0.5] },
  isometric: { pos: [-30, 24.5, 31], target: [0, 8.8, 0.2] },
  interior: { pos: [0, 12.2, 14.5], target: [0, 4.4, -3.2] },
  executive: { pos: [11, 14.2, 14.8], target: [0, 8.6, -3.2] },
  rooftop: { pos: [24, 20.5, 22.5], target: [0, 11.8, -2.5] },
  pool: { pos: [12.5, 5.2, 22.0], target: [-1.5, 1.5, 10.5] },
  supercar: { pos: [14.8, 3.6, 17.6], target: [9.4, 0.9, 11.3] },
};

const FLOOR_CAMERA_VIEWS: Record<
  string,
  { pos: Vector3Tuple; target: Vector3Tuple }
> = {
  all: { pos: [17, 16.5, 34.5], target: [0, 8.6, 0.5] },
  l1: { pos: [11.5, 5.4, 18.2], target: [0, 1.6, -1.5] },
  l2: { pos: [0.5, 10.4, 14.8], target: [0, 4.4, -3.2] },
  l3: { pos: [0.5, 14.2, 14.8], target: [0, 8.4, -3.2] },
  roof: { pos: [24, 20.5, 22.5], target: [0, 11.8, -2.5] },
};

function FreeRoamCameraRig() {
  const {
    activeFloor,
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
  const {
    activeVehicleId,
    simCameraMode,
    viewPerspective,
    setCompassDeg,
    setZoomPct,
    setCurrentLocationName,
  } = useSimulator();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const hudReportAccumRef = useRef(0);

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

  // Preset & 5-floor cutaway smooth camera trigger
  useEffect(() => {
    const floorView = FLOOR_CAMERA_VIEWS[activeFloor];
    const preset =
      activeFloor !== "all" && floorView
        ? floorView
        : CAMERA_PRESETS[cameraPreset] ?? CAMERA_PRESETS.front;
    desiredPosRef.current.set(...preset.pos);
    desiredTargetRef.current.set(...preset.target);
    isTransitioningRef.current = true;
  }, [activeFloor, cameraPreset, cameraResetTick]);

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

  // React to Simulator Camera Mode changes (O: Orbit / Drone / Top-Down)
  useEffect(() => {
    if (simCameraMode === "drone") {
      desiredPosRef.current.set(-30, 26, 28);
      desiredTargetRef.current.set(0, 4.5, 2.5);
      isTransitioningRef.current = true;
    } else if (simCameraMode === "topdown") {
      desiredPosRef.current.set(0, 52, 6);
      desiredTargetRef.current.set(0, 1.5, 4);
      isTransitioningRef.current = true;
    }
  }, [simCameraMode]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const dt = Math.min(delta, 0.05);

    // Report live Compass + Zoom % + Zone Name smoothly to HUD
    hudReportAccumRef.current += dt;
    if (hudReportAccumRef.current > 0.25) {
      hudReportAccumRef.current = 0;
      camera.getWorldDirection(forwardVec);
      const deg = ((Math.atan2(forwardVec.x, -forwardVec.z) * 180) / Math.PI + 360) % 360;
      setCompassDeg(deg);
      const dist = camera.position.distanceTo(ctrl.target);
      setZoomPct(Math.round(THREE.MathUtils.clamp((32 / Math.max(4, dist)) * 100, 30, 260)));

      const [bx, by, bz] = bossPositionRef.current;
      if (activeVehicleId) {
        setCurrentLocationName("Mengemudi · Cyber Avenue");
      } else if (by > 10.4) {
        setCurrentLocationName("Atap · Sky Deck, Helipad & Bulu Tangkis");
      } else if (by > 6.5) {
        setCurrentLocationName("Lantai 3 · Visual, Motion & Editing");
      } else if (by > 2.8) {
        setCurrentLocationName("Lantai 2 · AI Production Floor");
      } else if (bz > 6.5 && bx > -12 && bx < 4) {
        setCurrentLocationName("Kolam Renang & Sun Deck");
      } else if (bz > 6.5) {
        setCurrentLocationName("Halaman Depan & Parkir VIP");
      } else if (bx > 11) {
        setCurrentLocationName("Lantai 1 · Arcade & Racing Sim");
      } else {
        setCurrentLocationName("Lantai 1 · Lobi Utama");
      }
    }

    // While driving any of the 9 vehicles, DrivableVehicles owns the camera
    if (activeVehicleId) return;

    // 1) First-person or Third-person Game Follow Camera when playing as BOS FAJREZ
    if (isBossMode && bossFollowCamera) {
      const [bx, by, bz] = bossPositionRef.current;
      bossTargetVec.set(bx, by + 1.35, bz);

      if (viewPerspective === "first") {
        camera.position.lerp(new THREE.Vector3(bx, by + 1.62, bz + 0.15), Math.min(1, dt * 12));
        ctrl.target.lerp(new THREE.Vector3(bx, by + 1.56, bz - 3.5), Math.min(1, dt * 12));
        ctrl.update();
        return;
      }

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

/** Golden Hour Sunset Sky Dome — Dramatic deep magenta-violet zenith to fiery coral-orange & gold horizon + low sun orb */
function SunsetGoldenHourSkyDome() {
  const sunsetTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, "#24113d"); // deep twilight violet zenith
    grad.addColorStop(0.24, "#5d1d5e"); // rich magenta-purple
    grad.addColorStop(0.4, "#b8336a"); // vivid rose-magenta
    grad.addColorStop(0.49, "#ee6838"); // fiery sunset coral-orange
    grad.addColorStop(0.55, "#fb9b3c"); // warm golden hour amber
    grad.addColorStop(0.64, "#f4b961"); // low golden horizon glow
    grad.addColorStop(1.0, "#3b1d38");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[280, 20, 14]} />
        <meshBasicMaterial map={sunsetTex} side={THREE.BackSide} fog={false} />
      </mesh>
      {/* Low Glowing Golden Hour Sun Disc */}
      <mesh position={[-88, 16, -98]}>
        <sphereGeometry args={[6.2, 20, 16]} />
        <meshBasicMaterial color="#ffe49e" fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function OfficeScene() {
  const {
    agents,
    workstations,
    selectedAgentId,
    setSelectedAgentId,
    setSelectedWorkstationId,
    activeFloor,
    lightingPreset,
    performanceMode,
    isSimulationRunning,
    showLabelsIn3D,
    notifyAgentArrived,
    focusCameraOn,
  } = useOffice();

  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";
  const isEco = performanceMode === "eco";
  const isHigh = performanceMode === "high";

  const bgColor = isNight ? "#071022" : isSunset ? "#5c2052" : "#4ea8ea";
  const fogColor = isNight ? "#0c1630" : isSunset ? "#a84461" : "#7cc0f0";
  const fogRange: [number, number] = isNight
    ? [74, 210]
    : isSunset
    ? [85, 225]
    : [185, 360];

  // Low, wide sun angle at Sunset casts dramatic long golden-hour shadows across the campus
  const sunPosition: [number, number, number] = isNight
    ? [-22, 18, -16]
    : isSunset
    ? [-52, 8.2, 22]
    : [32, 48, 28];

  const sunColor = isNight ? "#9ec5f8" : isSunset ? "#ff984c" : "#fff9ef";
  const sunIntensity = isNight ? 0.82 : isSunset ? 2.45 : 2.15;
  // Shadow budget per tier (Eco = tanpa shadow, Balanced = 1024, High = 2048).
  // Kualitas tekstur & resolusi render TIDAK ikut turun hanya karena tier/shadow.
  const shadowSize = shadowMapSizeFor(performanceMode) || 1024;
  const shadowStride = shadowUpdateStrideFor(performanceMode);
  // Shadow di-refresh bertahap (bukan tiap frame) agar GPU tidak panas,
  // tanpa menyentuh resolusi render / ketajaman gambar.
  const shadowAutoUpdate = shadowStride === 1;

  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const shadowFrameRef = useRef(0);

  // Texture sharpness: pakai anisotropic filtering maksimum GPU + mipmap trilinear.
  // Dijalankan sekali per renderer/tier, bukan per zoom.
  const { gl } = useThree();
  useEffect(() => {
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy() || 1);
    applyTextureQuality(maxAniso);
  }, [gl, performanceMode]);

  // Pastikan shadow map tetap di-render ulang saat tier / preset pencahayaan berubah
  useEffect(() => {
    const light = sunLightRef.current;
    if (light) light.shadow.needsUpdate = true;
  }, [performanceMode, lightingPreset]);

  useFrame(() => {
    if (shadowAutoUpdate || isEco) return;
    const light = sunLightRef.current;
    if (!light) return;
    shadowFrameRef.current = (shadowFrameRef.current + 1) % Math.max(1, shadowStride);
    if (shadowFrameRef.current === 0) {
      light.shadow.needsUpdate = true;
    }
  });

  // Per-floor visibility & frustum culling for mobile-first performance
  const visibleAgents = useMemo(() => {
    return agents.filter((a) => {
      if (activeFloor === "all" || activeFloor === "roof") return true;
      if (activeFloor === "l1") return a.floor === 1;
      if (activeFloor === "l2") return a.floor === 2;
      if (activeFloor === "l3") return a.floor === 3;
      return true;
    });
  }, [agents, activeFloor]);

  const visibleWorkstations = useMemo(() => {
    return workstations.filter((ws) => {
      if (activeFloor === "all" || activeFloor === "roof") return true;
      if (activeFloor === "l1") return ws.floor === 1;
      if (activeFloor === "l2") return ws.floor === 2;
      if (activeFloor === "l3") return ws.floor === 3;
      return true;
    });
  }, [workstations, activeFloor]);

  const showWorkstations = visibleWorkstations.length > 0;

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[fogColor, fogRange[0], fogRange[1]]} />

      {isSunset && <SunsetGoldenHourSkyDome />}
      {!isNight && !isSunset && <ClearDaySkyDome />}

      <Environment resolution={isHigh ? 256 : isEco ? 64 : 128} frames={1}>
        <Lightformer
          form="ring"
          intensity={isNight ? 0.28 : isSunset ? 1.1 : 1.35}
          color={isNight ? "#38bdf8" : isSunset ? "#ff8fb1" : "#ffffff"}
          scale={18}
          position={[0, 18, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={isNight ? 0.22 : isSunset ? 1.25 : 0.95}
          color={isNight ? "#e879f9" : isSunset ? "#ff8c42" : "#e0f2fe"}
          scale={[24, 10, 1]}
          position={[18, 8, 16]}
          target={[0, 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={isNight ? 0.18 : isSunset ? 0.75 : 0.6}
          color={isNight ? "#22d3ee" : isSunset ? "#c084fc" : "#cbd5e1"}
          scale={[24, 10, 1]}
          position={[-18, 7, -14]}
          target={[0, 4, 0]}
        />
      </Environment>

      <hemisphereLight
        args={[
          isNight ? "#2f4e82" : isSunset ? "#f472b6" : "#dceeff",
          isNight ? "#141d30" : isSunset ? "#5c3330" : "#5e6a54",
          isNight ? 0.85 : isSunset ? 1.05 : 1.08,
        ]}
      />
      <directionalLight
        ref={sunLightRef}
        position={sunPosition}
        intensity={sunIntensity}
        color={sunColor}
        castShadow={!isEco}
        shadow-autoUpdate={shadowAutoUpdate}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={30}
        shadow-camera-bottom={-26}
        shadow-camera-near={2}
        shadow-camera-far={125}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
      <directionalLight
        position={[24, 14, -18]}
        intensity={isNight ? 0.35 : isSunset ? 0.85 : 0.52}
        color={isNight ? "#38bdf8" : isSunset ? "#e879f9" : "#c5e1ff"}
      />

      {/* Grand Outdoor Luxury Campus with REAL Recessed Swimming Pool & Curved GT Supercar */}
      <CyberOutdoorCampus
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* 9 Drivable Vehicles Fleet + West/East Paved Parking Lots */}
      <DrivableVehicles isNight={isNight} />

      {/* Dynamic Weather System (Rain, Storm Lightning, Atmospheric Fog) */}
      <WeatherEffects isHigh={isHigh} />

      {/* Automatic Mobile-First Adaptive Performance Controller (Section C & D) */}
      <AdaptivePerformanceController />

      {/* Grand 28m Multi-Floor Architectural HQ (L1-L3 Base) */}
      <OfficeArchitecture
        activeFloor={activeFloor}
        performanceMode={performanceMode}
        lightingPreset={lightingPreset}
        isSimulationRunning={isSimulationRunning}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* Kantor 3 lantai: L4 & L5 dihapus. Atap Sky Deck (helipad + badminton) + portal L1. */}
      <CrownSkyDeck
        activeFloor={activeFloor}
        isNight={isNight}
        isSunset={isSunset}
        isSimulationRunning={isSimulationRunning}
        onFocusPoint={(pt) => focusCameraOn(pt)}
      />

      {/* Stage 2 Interior Activity Rooms */}
      {/* RGB edge strips facade (cyan/violet/magenta) WAJIB selalu tampil:
          sebelumnya showRoof={false} -> lampu RGB depan kantor hilang. */}
      <InteriorActivityRooms
        showL1={true}
        showL3={activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof"}
        showRoof={true}
        isNight={isNight}
      />

      {/* L1 Reception & Campus Staff */}
      <OfficeExtrasStaff
        activeFloor={activeFloor}
        showLabels={showLabelsIn3D}
        isSimulationRunning={isSimulationRunning}
      />

      {/* 15 Interactive Multi-Floor Workstations (Culled Per Floor!) */}
      {showWorkstations && (
        <WorkstationCluster
          workstations={visibleWorkstations}
          agents={agents}
          lightingPreset={lightingPreset}
          onSelectWorkstation={(ws) => {
            setSelectedWorkstationId(ws.id);
            if (ws.assignedAgentId) {
              setSelectedAgentId(ws.assignedAgentId);
            }
            focusCameraOn([ws.position[0], ws.position[1] + 1.1, ws.position[2]], [3.2, 2.2, 4.0]);
          }}
          onFocusPoint={(pt) => focusCameraOn(pt, [2.6, 2.2, 3.4])}
        />
      )}

      {/* 15 Active Task-Capable Staff Avatars (Culled Per Floor!) */}
      {visibleAgents.map((agent) => (
        <RobotCharacter
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedAgentId}
          isSimulationRunning={isSimulationRunning}
          showLabels={showLabelsIn3D}
          onSelect={(id) => {
            setSelectedWorkstationId(null);
            setSelectedAgentId(id);
          }}
          onFocusPoint={(pt) => focusCameraOn(pt, [3.2, 2.0, 4.2])}
          onArrive={notifyAgentArrived}
        />
      ))}

      {/* Playable Character #11: BOS FAJREZ */}
      <BossPlayer />

      {/* Free-Roam & Third-Person Game Follow Camera Rig */}
      <FreeRoamCameraRig />

      {/* Selective Anti-Glare Emissive Bloom — hanya tier High (desktop / GPU kuat).
          Tier Balanced/Eco sengaja tanpa composer tambahan: render path tetap
          full-resolution sehingga tepi objek & tekstur tetap tajam saat zoom. */}
      {isHigh && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={isHigh ? 1.42 : 1.48}
            luminanceSmoothing={0.38}
            levels={isHigh ? 5 : 4}
            intensity={
              isNight
                ? isHigh
                  ? 0.34
                  : 0.22
                : isSunset
                ? isHigh
                  ? 0.24
                  : 0.16
                : 0.08
            }
          />
        </EffectComposer>
      )}
    </>
  );
}
