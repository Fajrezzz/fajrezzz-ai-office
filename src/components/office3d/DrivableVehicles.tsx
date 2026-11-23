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

type CarSilhouette = "coupe" | "sedan" | "suv";

function resolveSilhouette(kind: DrivableVehicleDef["kind"]): CarSilhouette {
  if (kind === "supercar" || kind === "hypercar") return "coupe";
  if (kind === "suv" || kind === "van" || kind === "patrol") return "suv";
  return "sedan";
}

/** Build smooth real-world side-profile ExtrudeGeometry for Coupe, Luxury Sedan, or Sport SUV */
function buildCarGeometries(silhouette: CarSilhouette) {
  const body = new THREE.Shape();
  const cabin = new THREE.Shape();

  if (silhouette === "coupe") {
    // Sleek GT Supercar / AMG GT / McLaren profile (X = front +2.25 to rear -2.25, Y = height)
    body.moveTo(-2.16, 0.24);
    body.lineTo(2.14, 0.22);
    body.quadraticCurveTo(2.26, 0.28, 2.24, 0.44);
    body.quadraticCurveTo(2.18, 0.62, 1.85, 0.68);
    body.lineTo(0.92, 0.80);
    body.lineTo(-1.45, 0.84);
    body.quadraticCurveTo(-2.02, 0.82, -2.18, 0.66);
    body.quadraticCurveTo(-2.24, 0.46, -2.16, 0.24);

    // Swept aerodynamic teardrop greenhouse
    cabin.moveTo(-1.42, 0.78);
    cabin.lineTo(0.86, 0.76);
    cabin.quadraticCurveTo(0.32, 1.24, -0.22, 1.26);
    cabin.quadraticCurveTo(-0.88, 1.24, -1.42, 0.78);
  } else if (silhouette === "suv") {
    // Luxury Sport SUV (Range Rover Sport / Lamborghini Urus silhouette)
    body.moveTo(-2.22, 0.30);
    body.lineTo(2.20, 0.28);
    body.quadraticCurveTo(2.30, 0.36, 2.28, 0.62);
    body.quadraticCurveTo(2.22, 0.90, 1.94, 0.96);
    body.lineTo(0.95, 1.02);
    body.lineTo(-1.95, 1.04);
    body.quadraticCurveTo(-2.22, 0.98, -2.26, 0.74);
    body.lineTo(-2.22, 0.30);

    // Muscular SUV greenhouse with raked windshield & sport rear pillar
    cabin.moveTo(-1.86, 0.98);
    cabin.lineTo(0.92, 0.98);
    cabin.lineTo(0.36, 1.62);
    cabin.lineTo(-1.38, 1.62);
    cabin.lineTo(-1.86, 0.98);
  } else {
    // Executive Luxury Sedan (Mercedes S-Class / Porsche Taycan silhouette)
    body.moveTo(-2.26, 0.24);
    body.lineTo(2.24, 0.22);
    body.quadraticCurveTo(2.34, 0.30, 2.32, 0.50);
    body.quadraticCurveTo(2.24, 0.72, 1.92, 0.78);
    body.lineTo(0.98, 0.86);
    body.lineTo(-1.82, 0.88);
    body.quadraticCurveTo(-2.20, 0.84, -2.28, 0.64);
    body.lineTo(-2.26, 0.24);

    // Graceful 4-door fastback cabin greenhouse
    cabin.moveTo(-1.58, 0.84);
    cabin.lineTo(0.94, 0.82);
    cabin.quadraticCurveTo(0.42, 1.38, -0.14, 1.40);
    cabin.lineTo(-0.88, 1.38);
    cabin.quadraticCurveTo(-1.26, 1.30, -1.58, 0.84);
  }

  const bodyWidth = silhouette === "suv" ? 1.86 : 1.82;
  const cabinWidth = silhouette === "suv" ? 1.54 : 1.46;

  const bodyGeo = new THREE.ExtrudeGeometry(body, {
    depth: bodyWidth,
    bevelEnabled: true,
    bevelThickness: 0.11,
    bevelSize: 0.09,
    bevelSegments: 4,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0, -bodyWidth / 2);
  // Rotate so vehicle faces +Z (matching driving physics yaw)
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.computeVertexNormals();

  const cabinGeo = new THREE.ExtrudeGeometry(cabin, {
    depth: cabinWidth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 3,
    curveSegments: 14,
  });
  cabinGeo.translate(0, 0, -cabinWidth / 2);
  cabinGeo.rotateY(-Math.PI / 2);
  cabinGeo.computeVertexNormals();

  return { bodyGeo, cabinGeo };
}

/** Realistic Multi-Spoke Alloy Wheel with Brake Disc & Red/Gold Caliper */
function RealisticAlloyWheel({
  position,
  radius,
  caliperColor,
}: {
  position: [number, number, number];
  radius: number;
  caliperColor: string;
}) {
  const isLeft = position[0] < 0;
  const outward = isLeft ? -1 : 1;
  return (
    <group position={position}>
      {/* Wide Rubber Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.27, 22]} />
        <meshStandardMaterial color="#0b0d12" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Tire Sidewall Bevel */}
      <mesh position={[outward * 0.135, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius * 0.78, radius * 0.18, 8, 20]} />
        <meshStandardMaterial color="#11141a" roughness={0.88} />
      </mesh>
      {/* Deep Metallic Alloy Rim Dish */}
      <mesh position={[outward * 0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.68, radius * 0.68, 0.24, 20]} />
        <meshStandardMaterial color="#1e2430" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* 5-Spoke Machined Silver Alloy Star */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[outward * 0.142, 0, 0]}
          rotation={[(i * Math.PI * 2) / 5, 0, 0]}
        >
          <boxGeometry args={[0.022, radius * 1.24, 0.045]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
        </mesh>
      ))}
      {/* Center Hub Cap */}
      <mesh position={[outward * 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.17, radius * 0.17, 0.02, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Sport Brake Caliper visible inside Spokes */}
      <mesh position={[outward * 0.09, radius * 0.22, -radius * 0.22]}>
        <boxGeometry args={[0.06, radius * 0.34, radius * 0.22]} />
        <meshStandardMaterial color={caliperColor} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Realistic Sculpted Real-World Luxury Vehicle (Zero Boxy Shapes!) */
function RealisticVehicleMesh({
  def,
  isNight,
  isDriven,
  geometries,
}: {
  def: DrivableVehicleDef;
  isNight: boolean;
  isDriven: boolean;
  geometries: Record<CarSilhouette, { bodyGeo: THREE.BufferGeometry; cabinGeo: THREE.BufferGeometry }>;
}) {
  const silhouette = resolveSilhouette(def.kind);
  const { bodyGeo, cabinGeo } = geometries[silhouette];
  const isSuv = silhouette === "suv";
  const isCoupe = silhouette === "coupe";
  const wheelR = isSuv ? 0.40 : 0.35;
  const wheelZ = isSuv ? 1.44 : 1.42;
  const wheelX = isSuv ? 0.96 : 0.94;
  const frontZ = isCoupe ? 2.27 : isSuv ? 2.31 : 2.35;
  const rearZ = isCoupe ? -2.23 : isSuv ? -2.28 : -2.31;
  const lightY = isSuv ? 0.78 : 0.58;
  const caliper = isCoupe ? "#ef4444" : "#f59e0b";

  return (
    <group>
      {/* Sculpted Glossy Metallic Curved Body */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={def.color}
          metalness={0.62}
          roughness={0.18}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Glossy Tinted Panoramic Glass Cabin Greenhouse */}
      <mesh geometry={cabinGeo} castShadow>
        <meshPhysicalMaterial
          color="#0a1324"
          metalness={0.25}
          roughness={0.06}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Sculpted Lower Carbon Side Skirts */}
      {[-0.96, 0.96].map((sx, i) => (
        <mesh key={`sk-${i}`} position={[sx, isSuv ? 0.28 : 0.21, 0]}>
          <boxGeometry args={[0.06, 0.08, 2.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.5} />
        </mesh>
      ))}

      {/* Sculpted Aerodynamic Side Mirrors */}
      {[-0.98, 0.98].map((mx, i) => (
        <group key={`mir-${i}`} position={[mx, isSuv ? 1.06 : 0.88, 0.56]}>
          <mesh castShadow>
            <boxGeometry args={[0.20, 0.09, 0.14]} />
            <meshPhysicalMaterial color={def.color} metalness={0.6} roughness={0.2} clearcoat={0.9} />
          </mesh>
        </group>
      ))}

      {/* Front Honeycomb Grille & Lower Splitter Air Intake */}
      <mesh position={[0, isSuv ? 0.62 : 0.42, frontZ]}>
        <boxGeometry args={[1.18, isSuv ? 0.34 : 0.20, 0.06]} />
        <meshStandardMaterial color="#0b0f17" metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Chrome Grille Surround Trim */}
      <mesh position={[0, isSuv ? 0.79 : 0.52, frontZ + 0.02]}>
        <boxGeometry args={[1.22, 0.03, 0.03]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Dual Matrix LED Headlights with Daytime Running Strip */}
      {[-0.66, 0.66].map((hx, i) => (
        <group key={`hl-${i}`} position={[hx, lightY, frontZ - 0.04]} rotation={[0, hx > 0 ? 0.16 : -0.16, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.11, 0.08]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#e0f2fe"
              emissiveIntensity={isNight || isDriven ? 2.4 : 0.75}
            />
          </mesh>
        </group>
      ))}

      {/* Full-Width Sculpted Ruby LED Taillight Bar */}
      <mesh position={[0, lightY + 0.06, rearZ]}>
        <boxGeometry args={[1.68, 0.085, 0.05]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ff1e33"
          emissiveIntensity={isNight || isDriven ? 2.5 : 0.8}
        />
      </mesh>

      {/* Rear Carbon Diffuser + Quad Chrome Exhaust Tips */}
      <mesh position={[0, isSuv ? 0.32 : 0.25, rearZ - 0.01]}>
        <boxGeometry args={[1.48, 0.16, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.5} />
      </mesh>
      {[-0.56, -0.44, 0.44, 0.56].map((ex, ei) => (
        <mesh key={`ex-${ei}`} position={[ex, isSuv ? 0.30 : 0.24, rearZ - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.10, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      {/* Carbon GT Rear Wing on Coupe Supercars */}
      {isCoupe && (
        <group position={[0, 0.94, -1.94]}>
          <mesh castShadow>
            <boxGeometry args={[1.64, 0.045, 0.24]} />
            <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.25} />
          </mesh>
          {[-0.52, 0.52].map((px, pi) => (
            <mesh key={pi} position={[px, -0.09, 0]}>
              <boxGeometry args={[0.04, 0.16, 0.16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Sleek Patrol LED Lightbar on Security SUV */}
      {def.kind === "patrol" && (
        <group position={[0, 1.72, 0.05]}>
          <mesh position={[-0.28, 0, 0]}>
            <boxGeometry args={[0.42, 0.08, 0.16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.2} />
          </mesh>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.42, 0.08, 0.16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
          </mesh>
        </group>
      )}

      {/* 4 Realistic Wide Alloy Wheels with Brake Calipers */}
      {[
        [-wheelX, wheelR, wheelZ],
        [wheelX, wheelR, wheelZ],
        [-wheelX, wheelR, -wheelZ],
        [wheelX, wheelR, -wheelZ],
      ].map(([wx, wy, wz], wi) => (
        <RealisticAlloyWheel
          key={`w-${wi}`}
          position={[wx, wy, wz]}
          radius={wheelR}
          caliperColor={caliper}
        />
      ))}
    </group>
  );
}

/** Fleet of 9 Drivable Realistic Vehicles (Includes Interactive Driving Physics + Widened Parking Lots) */
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

  // Build shared sculpted real-world car geometries once (fast & mobile-friendly!)
  const geometries = useMemo<
    Record<CarSilhouette, { bodyGeo: THREE.BufferGeometry; cabinGeo: THREE.BufferGeometry }>
  >(
    () => ({
      coupe: buildCarGeometries("coupe"),
      sedan: buildCarGeometries("sedan"),
      suv: buildCarGeometries("suv"),
    }),
    []
  );

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
    const accel =
      (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const steer =
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0) -
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

    bossPositionRef.current = [nx, vState.pos[1] + 0.6, nz];

    const meshGroup = groupRefs.current[activeVehicleId];
    if (meshGroup) {
      meshGroup.position.set(nx, vState.pos[1], nz);
      meshGroup.rotation.y = vState.yaw;
    }

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
      {/* West & East Paved Executive Parking Lots (Clear of Widened 38m Building!) */}
      {[-27.2, 27.6].map((px, pi) => (
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

      {/* Render All 9 Drivable Realistic Vehicles */}
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
              <mesh position={[0, 0.75, 0]} visible={false}>
                <boxGeometry args={[2.2, 1.4, 4.6]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            ) : (
              <RealisticVehicleMesh
                def={def}
                isNight={isNight}
                isDriven={isDriven}
                geometries={geometries}
              />
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
