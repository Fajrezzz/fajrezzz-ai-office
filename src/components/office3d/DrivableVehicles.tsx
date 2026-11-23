"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useOffice } from "@/store/OfficeContext";
import {
  DRIVABLE_VEHICLES,
  useSimulator,
  type DrivableVehicleDef,
} from "@/store/SimulatorContext";

/** Clean Low-Poly Stylized Drivable Vehicle Mesh (SUV, Sedan, Supercar, Van, Hypercar, Patrol) */
function StylizedVehicleBody({
  def,
  isNight,
  isDriven,
}: {
  def: DrivableVehicleDef;
  isNight: boolean;
  isDriven: boolean;
}) {
  const isTall = def.kind === "suv" || def.kind === "van" || def.kind === "patrol";
  const bodyLen = def.kind === "van" ? 4.8 : def.kind === "supercar" || def.kind === "hypercar" ? 4.4 : 4.3;
  const bodyH = isTall ? 0.72 : 0.48;
  const cabinH = def.kind === "van" ? 0.85 : isTall ? 0.68 : 0.44;
  const cabinLen = def.kind === "van" ? 3.5 : isTall ? 2.5 : 1.9;
  const wheelZ = bodyLen * 0.31;

  return (
    <group>
      {/* Lower Chassis Body */}
      <mesh position={[0, 0.44 + bodyH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.92, bodyH, bodyLen]} />
        <meshPhysicalMaterial
          color={def.color}
          metalness={0.55}
          roughness={0.22}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Tinted Cabin Greenhouse */}
      <mesh
        position={[0, 0.44 + bodyH + cabinH * 0.45, def.kind === "van" ? 0.1 : -0.22]}
        castShadow
      >
        <boxGeometry args={[1.64, cabinH, cabinLen]} />
        <meshPhysicalMaterial color="#0b1322" roughness={0.08} metalness={0.3} clearcoat={1} />
      </mesh>
      {/* Cyberpunk Underglow Accent Strip */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[1.82, 0.04, bodyLen - 0.3]} />
        <meshStandardMaterial
          color={def.accentColor}
          emissive={def.accentColor}
          emissiveIntensity={isNight || isDriven ? 1.5 : 0.25}
        />
      </mesh>
      {/* Front LED Headlights */}
      {[-0.64, 0.64].map((hx, i) => (
        <mesh key={`hl-${i}`} position={[hx, 0.62, bodyLen / 2 + 0.02]}>
          <boxGeometry args={[0.38, 0.12, 0.04]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={isNight || isDriven ? 2.4 : 0.6}
          />
        </mesh>
      ))}
      {/* Full-Width Rear Ruby LED Taillight Bar */}
      <mesh position={[0, 0.66, -bodyLen / 2 - 0.02]}>
        <boxGeometry args={[1.72, 0.1, 0.04]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ff1e33"
          emissiveIntensity={isNight || isDriven ? 2.4 : 0.7}
        />
      </mesh>
      {/* Patrol Lightbar on Security SUV */}
      {def.kind === "patrol" && (
        <group position={[0, 0.44 + bodyH + cabinH + 0.05, 0.05]}>
          <mesh position={[-0.28, 0, 0]}>
            <boxGeometry args={[0.45, 0.1, 0.18]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.2} />
          </mesh>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.45, 0.1, 0.18]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
          </mesh>
        </group>
      )}
      {/* 4 Wheels */}
      {[
        [-0.96, 0.34, wheelZ],
        [0.96, 0.34, wheelZ],
        [-0.96, 0.34, -wheelZ],
        [0.96, 0.34, -wheelZ],
      ].map(([wx, wy, wz], wi) => (
        <group key={`w-${wi}`} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.24, 16]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.92} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.26, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Fleet of 9 Drivable Vehicles (Includes Interactive Driving Physics + Parking Lots!) */
export function DrivableVehicles({ isNight }: { isNight: boolean }) {
  const { bossPositionRef, showLabelsIn3D } = useOffice();
  const {
    activeVehicleId,
    setActiveVehicleId,
    setVehicleSpeedKmh,
    driveCameraMode,
    vehiclePositionsRef,
    pushSimLog,
  } = useSimulator();
  const { camera } = useThree();

  const keysRef = useRef<Set<string>>(new Set());
  const speedRef = useRef<number>(0);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});
  const lastSpeedReportRef = useRef<number>(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const camDesired = useMemo(() => new THREE.Vector3(), []);
  const camLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!activeVehicleId) {
      speedRef.current = 0;
      return;
    }
    const def = DRIVABLE_VEHICLES.find((v) => v.id === activeVehicleId);
    const vState = vehiclePositionsRef.current[activeVehicleId];
    if (!def || !vState) return;

    const dt = Math.min(delta, 0.05);
    const keys = keysRef.current;
    const accel = (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const steer = (keys.has("a") || keys.has("arrowleft") ? 1 : 0) -
      (keys.has("d") || keys.has("arrowright") ? 1 : 0);
    const handbrake = keys.has(" ");

    if (handbrake) {
      speedRef.current *= Math.max(0, 1 - dt * 6.5);
    } else if (accel !== 0) {
      speedRef.current += accel * 14 * dt;
    } else {
      speedRef.current *= Math.max(0, 1 - dt * 2.2);
    }
    speedRef.current = Math.max(-9, Math.min(def.maxSpeed, speedRef.current));

    if (Math.abs(speedRef.current) > 0.25) {
      const dirSign = speedRef.current >= 0 ? 1 : -1;
      vState.yaw += steer * 1.9 * dt * dirSign * Math.min(1, Math.abs(speedRef.current) / 5);
    }

    const nx = THREE.MathUtils.clamp(
      vState.pos[0] + Math.sin(vState.yaw) * speedRef.current * dt,
      -54,
      54
    );
    const nz = THREE.MathUtils.clamp(
      vState.pos[2] + Math.cos(vState.yaw) * speedRef.current * dt,
      6.5,
      36
    );
    vState.pos = [nx, vState.pos[1], nz];

    // Sync Boss position inside the driven car
    bossPositionRef.current = [nx, vState.pos[1] + 0.6, nz];

    const meshGroup = groupRefs.current[activeVehicleId];
    if (meshGroup) {
      meshGroup.position.set(nx, vState.pos[1], nz);
      meshGroup.rotation.y = vState.yaw;
    }

    // Smooth Chase or Hood Camera while driving
    if (driveCameraMode === "hood") {
      camDesired.set(
        nx + Math.sin(vState.yaw) * 0.4,
        vState.pos[1] + 1.45,
        nz + Math.cos(vState.yaw) * 0.4
      );
      camLook.set(
        nx + Math.sin(vState.yaw) * 14,
        vState.pos[1] + 1.1,
        nz + Math.cos(vState.yaw) * 14
      );
    } else {
      camDesired.set(
        nx - Math.sin(vState.yaw) * 9.5,
        vState.pos[1] + 4.4,
        nz - Math.cos(vState.yaw) * 9.5
      );
      camLook.set(
        nx + Math.sin(vState.yaw) * 3.5,
        vState.pos[1] + 1.1,
        nz + Math.cos(vState.yaw) * 3.5
      );
    }
    camera.position.lerp(camDesired, Math.min(1, dt * 6));
    camera.lookAt(camLook);

    if (state.clock.elapsedTime - lastSpeedReportRef.current > 0.15) {
      lastSpeedReportRef.current = state.clock.elapsedTime;
      setVehicleSpeedKmh(Math.round(Math.abs(speedRef.current) * 5.2));
    }
  });

  return (
    <group>
      {/* West & East Paved Parking Lots with Crisp Parking Lines & Cyberpunk Curbs */}
      {[-24.2, 24.8].map((px, pi) => (
        <group key={`lot-${pi}`} position={[px, 0.04, 13.5]}>
          <mesh receiveShadow>
            <boxGeometry args={[12.8, 0.08, 7.6]} />
            <meshStandardMaterial color="#334155" roughness={0.86} />
          </mesh>
          {[-4.0, -0.3, 3.4].map((lx, li) => (
            <mesh key={li} position={[lx, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.1, 5.4]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
          ))}
          {/* Subtle Neon Parking Curb Strip at Night */}
          <mesh position={[0, 0.08, -3.75]}>
            <boxGeometry args={[12.4, 0.06, 0.08]} />
            <meshStandardMaterial
              color={pi === 0 ? "#22d3ee" : "#e879f9"}
              emissive={pi === 0 ? "#06b6d4" : "#d946ef"}
              emissiveIntensity={isNight ? 1.4 : 0.22}
            />
          </mesh>
        </group>
      ))}

      {/* Render All 9 Drivable Vehicles (Porsche 992.2 uses clickable trigger overlay; 8 fleet vehicles render full 3D models) */}
      {DRIVABLE_VEHICLES.map((def) => {
        const isDriven = activeVehicleId === def.id;
        const vState = vehiclePositionsRef.current[def.id];
        const pos = vState ? vState.pos : def.homePosition;
        const yaw = vState ? vState.yaw : def.homeYaw;

        return (
          <group
            key={def.id}
            ref={(el) => {
              groupRefs.current[def.id] = el;
            }}
            position={pos}
            rotation={[0, yaw, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setActiveVehicleId(def.id);
              pushSimLog("Bos Fajrez", `Masuk ke ${def.name} (WASD/Space/Q/C/F).`, "vehicle");
            }}
          >
            {def.kind === "porsche" ? (
              /* Interactive driving hitbox for the flagship Lugano Blue Porsche 911 992.2 */
              <mesh position={[0, 0.75, 0]} visible={false}>
                <boxGeometry args={[2.2, 1.4, 4.6]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            ) : (
              <StylizedVehicleBody def={def} isNight={isNight} isDriven={isDriven} />
            )}

            {isDriven && showLabelsIn3D && (
              <Html position={[0, 2.25, 0]} center distanceFactor={16}>
                <div className="pointer-events-none whitespace-nowrap rounded-full border border-cyan-400/70 bg-slate-950/90 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 shadow-lg">
                  🚗 {def.name} · Tekan F turun · Q klakson
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
