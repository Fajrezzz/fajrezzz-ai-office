"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import type {
  LightingPreset,
  PerformanceMode,
  Vector3Tuple,
} from "@/types/office";

interface CyberOutdoorCampusProps {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

/** Realistic arched palm tree with segmented curved trunk and 10 multi-segment cascading fronds */
function PalmTree({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {
  const fronds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Decorative stone planter ring */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.46, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="#d8d2c7" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.06, 14]} />
        <meshStandardMaterial color="#4a392a" roughness={0.95} />
      </mesh>

      {/* Curved tapered palm trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.24, 1.6, 12]} />
        <meshStandardMaterial color="#7d644c" roughness={0.92} />
      </mesh>
      <mesh position={[0.07, 2.35, 0.04]} rotation={[0.04, 0, -0.06]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 1.5, 12]} />
        <meshStandardMaterial color="#876d53" roughness={0.9} />
      </mesh>
      <mesh position={[0.17, 3.65, 0.08]} rotation={[0.06, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 1.35, 12]} />
        <meshStandardMaterial color="#745c44" roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 4.6, 0.11]} rotation={[0.04, 0, -0.05]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.85, 10]} />
        <meshStandardMaterial color="#5c6e3b" roughness={0.82} />
      </mesh>

      {/* Natural cascading palm crown */}
      <group position={[0.28, 4.95, 0.12]}>
        {fronds.map((idx) => {
          const angle = (idx / fronds.length) * Math.PI * 2 + (idx % 2) * 0.14;
          const elevation = idx % 2 === 0 ? 0.28 : 0.06;
          return (
            <group key={idx} rotation={[0, angle, 0]}>
              {/* Arching inner frond stem + leaflets */}
              <mesh
                position={[0.62, 0.2 + elevation, 0]}
                rotation={[0, 0, 0.22 - elevation * 0.4]}
                castShadow
              >
                <boxGeometry args={[1.25, 0.04, 0.34]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? "#387a2f" : "#2d6926"}
                  roughness={0.76}
                />
              </mesh>
              {/* Mid drooping frond arch */}
              <mesh
                position={[1.65, 0.06 + elevation * 0.4, 0]}
                rotation={[0, 0, -0.34]}
                castShadow
              >
                <boxGeometry args={[1.05, 0.035, 0.42]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? "#478f3a" : "#3a7c30"}
                  roughness={0.74}
                />
              </mesh>
              {/* Tapered frond tip */}
              <mesh
                position={[2.4, -0.42 + elevation * 0.2, 0]}
                rotation={[0, 0, -0.82]}
                castShadow
              >
                <boxGeometry args={[0.78, 0.025, 0.24]} />
                <meshStandardMaterial color="#549e44" roughness={0.72} />
              </mesh>
            </group>
          );
        })}

        {/* Coconut cluster */}
        <mesh position={[0.1, -0.18, 0.1]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color="#6e4a24" roughness={0.85} />
        </mesh>
        <mesh position={[-0.1, -0.2, 0.08]}>
          <sphereGeometry args={[0.095, 10, 10]} />
          <meshStandardMaterial color="#5f3e1d" roughness={0.85} />
        </mesh>
        <mesh position={[0.02, -0.22, -0.1]}>
          <sphereGeometry args={[0.095, 10, 10]} />
          <meshStandardMaterial color="#684522" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function PoolUmbrella({
  position,
  accentColor = "#1d4e6f",
}: {
  position: [number, number, number];
  accentColor?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.14, 16]} />
        <meshStandardMaterial color="#424952" roughness={0.62} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.046, 2.58, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 2.58, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.64, 0.52, 8]} />
        <meshStandardMaterial color="#f6f1e7" roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[1.65, 0.46, 4]} />
        <meshStandardMaterial color={accentColor} roughness={0.84} />
      </mesh>
      <mesh position={[0, 2.86, 0]}>
        <sphereGeometry args={[0.068, 10, 10]} />
        <meshStandardMaterial color="#d4af37" metalness={0.86} roughness={0.18} />
      </mesh>
    </group>
  );
}

function SunLounger({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.09, 2.05]} />
        <meshStandardMaterial color="#875d38" roughness={0.72} />
      </mesh>
      {[
        [-0.34, 0.11, -0.82],
        [0.34, 0.11, -0.82],
        [-0.34, 0.11, 0.82],
        [0.34, 0.11, 0.82],
      ].map((leg, i) => (
        <mesh key={i} position={leg as [number, number, number]} castShadow>
          <boxGeometry args={[0.07, 0.22, 0.07]} />
          <meshStandardMaterial color="#6c4727" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, 0.34, 0.16]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.11, 1.38]} />
        <meshStandardMaterial color="#f8f5ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.56, -0.68]} rotation={[0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.74, 0.11, 0.72]} />
        <meshStandardMaterial color="#f8f5ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.74, -0.79]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.46, 0.09, 0.22]} />
        <meshStandardMaterial color="#0284c7" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Iconic 2022 Porsche 911 GT3 ("Porsche 22") — Sculpted Fastback Coupe, Oval 4-Point LED Headlights, Swan-Neck Wing & Yellow PCCB Calipers */
function Porsche22Car({
  position,
  rotationY = -0.34,
  isNight,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
}) {
  // Iconic Porsche 911 (992 / 2022) side silhouette: low sloping hood, rounded frog-eye fenders, smooth continuous fastback roofline!
  const { bodyGeo, cabinGeo } = useMemo(() => {
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-2.22, 0.24); // rear diffuser bottom
    bodyShape.lineTo(2.24, 0.22); // front GT3 splitter
    bodyShape.quadraticCurveTo(2.36, 0.44, 2.04, 0.62); // signature rounded Porsche front nose
    bodyShape.quadraticCurveTo(1.56, 0.72, 0.96, 0.78); // low sloping Porsche hood
    bodyShape.quadraticCurveTo(0.42, 1.24, -0.18, 1.24); // iconic arched Porsche 911 roof dome
    bodyShape.quadraticCurveTo(-1.18, 1.22, -2.02, 0.84); // unmistakable continuous 911 fastback sweep!
    bodyShape.quadraticCurveTo(-2.26, 0.74, -2.26, 0.56); // sculpted wide rear bumper
    bodyShape.lineTo(-2.22, 0.24);

    const extrudedBody = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 1.82,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.12,
      bevelSegments: 5,
      curveSegments: 20,
    });
    extrudedBody.center();
    extrudedBody.rotateY(-Math.PI / 2);

    // Sleek Porsche 911 greenhouse glass profile
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-1.52, 0.8);
    cabinShape.lineTo(0.86, 0.78);
    cabinShape.quadraticCurveTo(0.36, 1.21, -0.18, 1.21);
    cabinShape.quadraticCurveTo(-0.96, 1.18, -1.52, 0.8);

    const extrudedCabin = new THREE.ExtrudeGeometry(cabinShape, {
      depth: 1.38,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 16,
    });
    extrudedCabin.center();
    extrudedCabin.rotateY(-Math.PI / 2);

    return { bodyGeo: extrudedBody, cabinGeo: extrudedCabin };
  }, []);

  const wheelCoords: [number, number, number][] = [
    [-1.0, 0.36, 1.32],
    [1.0, 0.36, 1.32],
    [-1.0, 0.36, -1.3],
    [1.0, 0.36, -1.3],
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Sculpted Glossy Porsche Chalk Silver-White (2022 911 GT3) Body */}
      <mesh geometry={bodyGeo} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e5ebf1"
          metalness={0.52}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* Subtle Black Motorsport Racing Stripe along Hood & Roof */}
      <mesh position={[0, 0.89, 1.38]} rotation={[0.14, 0, 0]}>
        <boxGeometry args={[0.38, 0.02, 1.1]} />
        <meshStandardMaterial color="#111827" roughness={0.35} />
      </mesh>

      {/* Glossy Tinted Glass Porsche 911 Greenhouse */}
      <mesh geometry={cabinGeo} position={[0, 0.96, -0.16]} castShadow>
        <meshPhysicalMaterial
          color="#0a1322"
          metalness={0.28}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>

      {/* Carbon-Fiber GT3 Side Skirts & Undertray */}
      <mesh position={[0, 0.2, 0.02]} castShadow>
        <boxGeometry args={[2.12, 0.1, 4.44]} />
        <meshStandardMaterial color="#13171f" roughness={0.34} metalness={0.5} />
      </mesh>

      {/* Front GT3 Aero Splitter & Wide Black Cooling Ducts */}
      <mesh position={[0, 0.22, 2.22]} castShadow>
        <boxGeometry args={[1.98, 0.08, 0.38]} />
        <meshStandardMaterial color="#11151d" roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.37, 2.28]}>
        <boxGeometry args={[1.56, 0.2, 0.08]} />
        <meshStandardMaterial color="#0b0e14" roughness={0.62} metalness={0.38} />
      </mesh>

      {/* Porsche Iconic Round/Oval Frog-Eye LED Headlights + 4-Point DRL Rings */}
      {[-0.72, 0.72].map((hx, i) => (
        <group
          key={i}
          position={[hx, 0.65, 2.06]}
          rotation={[0.42, i === 0 ? -0.18 : 0.18, 0]}
        >
          <mesh scale={[1, 1.28, 0.55]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f0f9ff"
              emissiveIntensity={isNight ? 3.8 : 1.4}
            />
          </mesh>
          <mesh position={[0, 0, 0.09]} scale={[1, 1.25, 1]}>
            <torusGeometry args={[0.14, 0.022, 8, 18]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#bae6fd"
              emissiveIntensity={isNight ? 4.2 : 1.6}
            />
          </mesh>
        </group>
      ))}

      {/* Porsche Crest Emblem on Hood */}
      <mesh position={[0, 0.72, 2.06]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.02, 12]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Sleek Aero Side Mirrors */}
      {[-1.14, 1.14].map((mx, idx) => (
        <mesh key={idx} position={[mx, 0.88, 0.58]}>
          <boxGeometry args={[0.24, 0.09, 0.16]} />
          <meshPhysicalMaterial
            color="#e5ebf1"
            metalness={0.55}
            roughness={0.14}
            clearcoat={1}
          />
        </mesh>
      ))}

      {/* Rear Vertical Cooling Slats on 911 Engine Deck */}
      <mesh position={[0, 0.99, -1.55]} rotation={[-0.36, 0, 0]}>
        <boxGeometry args={[1.18, 0.05, 0.74]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Iconic 992 GT3 Swan-Neck Carbon Rear Wing */}
      <mesh position={[0, 1.16, -2.06]} castShadow>
        <boxGeometry args={[1.98, 0.055, 0.36]} />
        <meshStandardMaterial color="#141922" roughness={0.26} metalness={0.68} />
      </mesh>
      {/* Wing Endplates */}
      {[-0.99, 0.99].map((ex, i) => (
        <mesh key={i} position={[ex, 1.14, -2.06]}>
          <boxGeometry args={[0.04, 0.24, 0.42]} />
          <meshStandardMaterial color="#141922" roughness={0.3} metalness={0.65} />
        </mesh>
      ))}
      {/* Swan-Neck Supports */}
      {[-0.56, 0.56].map((px, i) => (
        <mesh key={i} position={[px, 0.98, -1.96]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.055, 0.34, 0.16]} />
          <meshStandardMaterial color="#141922" roughness={0.3} metalness={0.65} />
        </mesh>
      ))}

      {/* Signature 992 Full-Width Glowing Ruby Porsche LED Rear Lightbar */}
      <mesh position={[0, 0.68, -2.3]}>
        <boxGeometry args={[1.82, 0.08, 0.06]} />
        <meshStandardMaterial
          color="#ff1f34"
          emissive="#ff1a30"
          emissiveIntensity={isNight ? 3.8 : 1.5}
        />
      </mesh>

      {/* Crisp Rear License Plate "PORSCHE 22" */}
      <mesh position={[0, 0.46, -2.31]}>
        <boxGeometry args={[0.66, 0.17, 0.03]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>
      <Text
        position={[0, 0.46, -2.33]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.085}
        color="#facc15"
        letterSpacing={0.08}
        anchorX="center"
        anchorY="middle"
      >
        PORSCHE 22
      </Text>

      {/* Rear GT3 Diffuser + Dual Center Chrome Exhausts */}
      <mesh position={[0, 0.28, -2.28]}>
        <boxGeometry args={[1.76, 0.2, 0.14]} />
        <meshStandardMaterial color="#11151d" roughness={0.4} metalness={0.52} />
      </mesh>
      {[-0.12, 0.12].map((ex, i) => (
        <mesh key={i} position={[ex, 0.28, -2.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.14, 14]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}

      {/* 4 Porsche Center-Lock Motorsport Wheels (Satin Bronze-Gold + Yellow PCCB Calipers) */}
      {wheelCoords.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.41, 0.41, 0.24, 18]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.95} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.365, 0.365, 0.31, 24]} />
            <meshStandardMaterial color="#16191f" roughness={0.84} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.325, 18]} />
            <meshStandardMaterial color="#c8a86b" metalness={0.88} roughness={0.22} />
          </mesh>
          {[0, 1, 2, 3, 4].map((spoke) => (
            <mesh
              key={spoke}
              position={[idx % 2 === 0 ? -0.16 : 0.16, 0, 0]}
              rotation={[(spoke / 5) * Math.PI * 2, 0, 0]}
            >
              <boxGeometry args={[0.025, 0.46, 0.042]} />
              <meshStandardMaterial color="#d4b87c" metalness={0.88} roughness={0.22} />
            </mesh>
          ))}
          {/* Black Center-Lock Nut */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.062, 0.062, 0.34, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Iconic Porsche Yellow PCCB Brake Caliper */}
          <mesh position={[idx % 2 === 0 ? -0.09 : 0.09, 0.06, 0.12]}>
            <boxGeometry args={[0.14, 0.16, 0.1]} />
            <meshStandardMaterial color="#facc15" metalness={0.45} roughness={0.26} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tall Luxury Resort Garden Lamp Post illuminating the front swimming pool & Porsche bay at night */
function PoolsideGardenLamp({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const glow = isNight ? 3.8 : isSunset ? 1.8 : 0.35;
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.2, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 2.9, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Modern Architectural Glowing Lantern Head */}
      <mesh position={[0, 3.05, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 0.34, 14]} />
        <meshStandardMaterial
          color="#fff7db"
          emissive="#ffd584"
          emissiveIntensity={glow}
        />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.07, 14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.28} />
      </mesh>
    </group>
  );
}

function BollardLight({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const lampIntensity = isNight ? 2.8 : isSunset ? 1.5 : 0.35;
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.08, 0.68, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.16, 12]} />
        <meshStandardMaterial
          color="#fff4d6"
          emissive="#ffcf7d"
          emissiveIntensity={lampIntensity}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function CyberOutdoorCampus({
  performanceMode,
  lightingPreset,
  onFocusPoint,
}: CyberOutdoorCampusProps) {
  const textures = useMemo(() => getRealisticTextures(), []);
  const waterRef = useRef<THREE.Mesh>(null);
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.position.y =
        0.165 + Math.sin(state.clock.elapsedTime * 1.6) * 0.012;
    }
    textures.poolWaterBump.offset.x =
      (textures.poolWaterBump.offset.x + delta * 0.05) % 1;
    textures.poolWaterBump.offset.y =
      (textures.poolWaterBump.offset.y + delta * 0.03) % 1;
  });

  const handleGroundDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, Math.max(0.4, e.point.y), e.point.z]);
    }
  };

  // Architectural distant skyline with varied heights & crown spires (far back in atmosphere)
  const skylineBuildings = useMemo(
    () => [
      { pos: [-58, 22, -56] as [number, number, number], size: [9, 44, 8.5] as [number, number, number], spire: true },
      { pos: [-40, 29, -64] as [number, number, number], size: [10.5, 58, 9.5] as [number, number, number], spire: false },
      { pos: [-21, 20, -66] as [number, number, number], size: [9, 40, 8.5] as [number, number, number], spire: false },
      { pos: [-2, 34, -72] as [number, number, number], size: [11, 68, 10] as [number, number, number], spire: true },
      { pos: [18, 25, -68] as [number, number, number], size: [9.5, 50, 9] as [number, number, number], spire: false },
      { pos: [38, 31, -62] as [number, number, number], size: [10, 62, 9.5] as [number, number, number], spire: true },
      { pos: [57, 21, -54] as [number, number, number], size: [8.5, 42, 8] as [number, number, number], spire: false },
      { pos: [-64, 17, -26] as [number, number, number], size: [8.5, 34, 8] as [number, number, number], spire: false },
      { pos: [64, 18, -24] as [number, number, number], size: [8.5, 36, 8] as [number, number, number], spire: false },
    ],
    []
  );

  const palmPositions: { pos: [number, number, number]; scale: number; rot: number }[] = [
    { pos: [-16.6, 0, 5.4], scale: 1.15, rot: 0.4 },
    { pos: [-17.4, 0, 11.8], scale: 1.05, rot: 1.3 },
    { pos: [-15.2, 0, 17.6], scale: 1.2, rot: 2.1 },
    { pos: [-7.5, 0, 19.1], scale: 1.0, rot: 0.8 },
    { pos: [2.2, 0, 19.1], scale: 1.08, rot: 2.9 },
    { pos: [15.4, 0, 17.4], scale: 1.18, rot: 1.7 },
    { pos: [17.4, 0, 10.6], scale: 1.1, rot: 3.5 },
    { pos: [16.5, 0, 4.6], scale: 1.22, rot: 0.2 },
    { pos: [-16.8, 0, -5.5], scale: 1.12, rot: 2.4 },
    { pos: [16.8, 0, -5.2], scale: 1.15, rot: 1.1 },
  ];

  const bollards: [number, number, number][] = [
    [-13.5, 0.18, 4.8],
    [-6.5, 0.18, 4.8],
    [0.0, 0.18, 4.8],
    [6.5, 0.18, 4.8],
    [13.5, 0.18, 4.8],
    [-12.5, 0.18, 16.5],
    [-4.0, 0.18, 16.5],
    [4.2, 0.18, 16.5],
    [13.0, 0.18, 16.5],
  ];

  return (
    <group>
      {/* Expansive manicured tropical lawn (slightly below Y=0 so recessed pool bottom never clips!) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, 4]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial
          map={textures.grassLawn}
          bumpMap={textures.grassBump}
          bumpScale={0.04}
          roughness={0.94}
        />
      </mesh>

      {/* Architectural dark asphalt avenue in front of campus */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 24.5]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[140, 8.2]} />
        <meshStandardMaterial map={textures.asphalt} roughness={0.86} />
      </mesh>
      {[-30, -20, -10, 0, 10, 20, 30].map((x) => (
        <mesh key={x} position={[x, 0.005, 24.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 0.22]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
        </mesh>
      ))}

      {/* Grand travertine arrival motor court leading to supercar */}
      <mesh
        position={[9.2, 0.06, 17.8]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <boxGeometry args={[7.4, 0.12, 8.2]} />
        <meshStandardMaterial
          map={textures.marbleTile}
          bumpMap={textures.marbleBump}
          bumpScale={0.025}
          roughness={0.5}
        />
      </mesh>

      {/* =========================================================================
          GRAND 32m × 14.6m TEAK RESORT DECK — BUILT IN 4 FRAMING SLABS AROUND THE
          REAL OPEN SWIMMING POOL CUTOUT (X ∈ [-10.8, 2.4], Z ∈ [8.3, 14.5])
          ========================================================================= */}
      <group onDoubleClick={handleGroundDoubleClick}>
        {/* North teak deck (between HQ entrance Z=4.0 and pool north edge Z=8.3) */}
        <mesh position={[0, 0.09, 6.15]} receiveShadow>
          <boxGeometry args={[32.0, 0.18, 4.3]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* South teak deck (between pool south edge Z=14.5 and front deck rim Z=18.6) */}
        <mesh position={[0, 0.09, 16.55]} receiveShadow>
          <boxGeometry args={[32.0, 0.18, 4.1]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* West teak deck (west of pool X ∈ [-16.0, -10.8], Z ∈ [8.3, 14.5]) */}
        <mesh position={[-13.4, 0.09, 11.4]} receiveShadow>
          <boxGeometry args={[5.2, 0.18, 6.2]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* East teak deck (east of pool X ∈ [2.4, 16.0], Z ∈ [8.3, 14.5] — supercar bay!) */}
        <mesh position={[9.2, 0.09, 11.4]} receiveShadow>
          <boxGeometry args={[13.6, 0.18, 6.2]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Crisp white limestone perimeter deck border */}
      <mesh position={[0, 0.1, 18.68]} receiveShadow>
        <boxGeometry args={[32.4, 0.22, 0.34]} />
        <meshStandardMaterial color="#e8e3da" roughness={0.62} />
      </mesh>

      {/* =========================================================================
          GRAND 13.2m × 6.2m RECESSED LUXURY INFINITY SWIMMING POOL (100% VISIBLE!)
          ========================================================================= */}
      <group position={[-4.2, 0, 11.4]} onDoubleClick={handleGroundDoubleClick}>
        {/* White limestone pool coping surround */}
        <mesh position={[0, 0.21, -3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.1, 0.42]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[0, 0.21, 3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.1, 0.42]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[-6.8, 0.21, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.1, 6.98]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[6.8, 0.21, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.1, 6.98]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>

        {/* Deep Turquoise Ceramic Mosaic Pool Floor (Y = 0.01, clear of grass & deck!) */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13.2, 6.2]} />
          <meshStandardMaterial
            map={textures.poolTiles}
            roughness={0.22}
            emissive={isNight ? "#0ea5e9" : "#0284c7"}
            emissiveIntensity={isNight ? 0.65 : 0.22}
          />
        </mesh>

        {/* 4 Ceramic Mosaic Pool Interior Walls */}
        <mesh position={[0, 0.1, -3.09]}>
          <boxGeometry args={[13.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 3.09]}>
          <boxGeometry args={[13.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[-6.59, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.2, 6.2]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[6.59, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.2, 6.2]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>

        {/* Terraced Underwater Entry Steps on East side */}
        <mesh position={[5.95, 0.04, 0]}>
          <boxGeometry args={[1.25, 0.06, 4.6]} />
          <meshStandardMaterial color="#58c7e8" roughness={0.28} />
        </mesh>
        <mesh position={[6.25, 0.09, 0]}>
          <boxGeometry args={[0.65, 0.06, 4.6]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.26} />
        </mesh>

        {/* Chrome Stainless Pool Ladder Handrails */}
        <mesh position={[6.42, 0.52, 1.35]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.86, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[6.42, 0.52, 0.55]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.86, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[6.42, 0.94, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.84, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Floating Pool Inflatable Ring for Resort Realism */}
        <mesh position={[-3.4, 0.19, -0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.52, 0.16, 14, 24]} />
          <meshStandardMaterial color="#fb7185" roughness={0.24} />
        </mesh>

        {/* Crystal Reflective Animated Swimming Pool Water Surface */}
        <mesh
          ref={waterRef}
          position={[0, 0.165, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[13.16, 6.16]} />
          <meshPhysicalMaterial
            color="#22c7eb"
            roughness={0.06}
            metalness={0.12}
            transparent
            opacity={performanceMode === "high" ? 0.72 : 0.78}
            bumpMap={textures.poolWaterBump}
            bumpScale={0.06}
            clearcoat={1}
            clearcoatRoughness={0.04}
            emissive="#0891b2"
            emissiveIntensity={isNight ? 0.48 : 0.16}
          />
        </mesh>

        {/* Glowing Underwater LED Pool Perimeter Strip (Vivid at Night!) */}
        {isNight && (
          <group>
            <mesh position={[0, 0.14, -3.05]}>
              <boxGeometry args={[13.0, 0.06, 0.04]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[0, 0.14, 3.05]}>
              <boxGeometry args={[13.0, 0.06, 0.04]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[-6.55, 0.14, 0]}>
              <boxGeometry args={[0.04, 0.06, 6.0]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[6.55, 0.14, 0]}>
              <boxGeometry args={[0.04, 0.06, 6.0]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
          </group>
        )}

        {/* Dual Underwater & Poolside Night Illumination (Bright even in Eco mode!) */}
        {(isNight || isSunset) && (
          <>
            <pointLight
              position={[-3.2, 1.4, 0]}
              color="#7dd3fc"
              intensity={isNight ? 24 : 8}
              distance={22}
            />
            <pointLight
              position={[3.4, 1.4, 0]}
              color="#38bdf8"
              intensity={isNight ? 24 : 8}
              distance={22}
            />
          </>
        )}
      </group>

      {/* 4 Resort Umbrellas around pool deck */}
      <PoolUmbrella position={[-12.6, 0.18, 9.0]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-12.6, 0.18, 14.2]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-6.8, 0.18, 16.4]} accentColor="#2b5f78" />
      <PoolUmbrella position={[0.4, 0.18, 16.4]} accentColor="#2b5f78" />

      {/* 6 Plush Sun Loungers */}
      <SunLounger position={[-13.4, 0.18, 7.2]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 10.7]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 15.6]} rotationY={Math.PI / 2} />
      <SunLounger position={[-9.2, 0.18, 16.3]} rotationY={0} />
      <SunLounger position={[-4.2, 0.18, 16.3]} rotationY={0} />
      <SunLounger position={[2.6, 0.18, 16.3]} rotationY={0} />

      {/* Luxury Outdoor Lounge Seating beside Pool */}
      <group position={[4.2, 0.18, 7.0]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.42, 0.95]} />
          <meshStandardMaterial color="#f5f1e9" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.62, -0.38]} castShadow>
          <boxGeometry args={[2.8, 0.45, 0.22]} />
          <meshStandardMaterial color="#e8e2d6" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.22, 1.15]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.34, 0.78]} />
          <meshStandardMaterial color="#7d5837" roughness={0.62} />
        </mesh>
      </group>

      {/* Iconic 2022 Porsche 911 GT3 ("Porsche 22") in Arrival Bay */}
      <Porsche22Car
        position={[9.4, 0.18, 11.3]}
        rotationY={-0.36}
        isNight={isNight}
      />

      {/* 4 Tall Poolside & Front Yard Luxury Garden Lamp Posts */}
      <PoolsideGardenLamp position={[-14.6, 0.18, 17.2]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[-4.2, 0.18, 17.8]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[5.4, 0.18, 17.6]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[14.8, 0.18, 13.6]} isNight={isNight} isSunset={isSunset} />

      {/* Warm Night Resort Front-Yard, Pool Deck & Porsche Showcase Lighting */}
      {(isNight || isSunset) && (
        <>
          <pointLight
            position={[-4.2, 4.4, 15.8]}
            color="#ffe4b5"
            intensity={isNight ? 34 : 12}
            distance={34}
          />
          <pointLight
            position={[9.4, 4.2, 12.6]}
            color="#fff6e0"
            intensity={isNight ? 30 : 12}
            distance={24}
          />
          <pointLight
            position={[0.0, 4.2, 6.6]}
            color="#ffdfad"
            intensity={isNight ? 26 : 10}
            distance={28}
          />
        </>
      )}

      {/* Landscaped Tropical Perimeter Hedges */}
      {[-15.8, 15.8].map((hx, idx) => (
        <mesh key={idx} position={[hx, 0.42, 11.3]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.84, 14.4]} />
          <meshStandardMaterial color="#2f5f29" roughness={0.92} />
        </mesh>
      ))}

      {/* Pathway Bollard Lamps */}
      {bollards.map((pos, i) => (
        <BollardLight
          key={i}
          position={pos}
          isNight={isNight}
          isSunset={isSunset}
        />
      ))}

      {/* 10 Lush Arched Palm Trees */}
      {palmPositions.map((p, i) => (
        <PalmTree
          key={i}
          position={p.pos}
          scale={p.scale}
          rotation={p.rot}
        />
      ))}

      {/* Distant Atmospheric Metropolitan Skyline with Crown Spires */}
      <group>
        {skylineBuildings.map((b, i) => (
          <group key={i} position={b.pos}>
            <mesh>
              <boxGeometry args={b.size} />
              <meshStandardMaterial
                map={isNight ? textures.skylineNight : textures.skylineDay}
                color={
                  isNight ? "#94a3b8" : isSunset ? "#d9c2b2" : "#cfdce8"
                }
                roughness={0.35}
                metalness={0.48}
                emissive={isNight ? "#1e293b" : "#000000"}
                emissiveIntensity={isNight ? 0.32 : 0}
              />
            </mesh>
            {/* Architectural crown ledge */}
            <mesh position={[0, b.size[1] / 2 + 0.6, 0]}>
              <boxGeometry args={[b.size[0] * 0.72, 1.2, b.size[2] * 0.72]} />
              <meshStandardMaterial
                color={isNight ? "#1e293b" : "#8aa3b8"}
                roughness={0.4}
                metalness={0.5}
              />
            </mesh>
            {b.spire && (
              <mesh position={[0, b.size[1] / 2 + 4.5, 0]}>
                <cylinderGeometry args={[0.08, 0.26, 7, 8]} />
                <meshStandardMaterial
                  color="#cbd5e1"
                  metalness={0.75}
                  roughness={0.3}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}
