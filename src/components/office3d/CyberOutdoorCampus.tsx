"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import { CyberpunkSkyline } from "@/components/office3d/CyberpunkSkyline";
import { useOffice } from "@/store/OfficeContext";
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

/** Relaxed Poolside Trading Bot Character reclining on a Sun Lounger with Live Animated Candlestick Chart Laptop */
function PoolsideTradingBot({
  position,
  rotationY = -Math.PI / 2,
  isNight,
  showLabel,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
  showLabel: boolean;
}) {
  const headRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const holoRef = useRef<THREE.Group>(null);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  const candleSpecs = useMemo(
    () => [
      { x: -0.2, baseH: 0.09, bullish: true, phase: 0.2 },
      { x: -0.12, baseH: 0.07, bullish: false, phase: 1.1 },
      { x: -0.04, baseH: 0.13, bullish: true, phase: 2.0 },
      { x: 0.04, baseH: 0.11, bullish: true, phase: 2.9 },
      { x: 0.12, baseH: 0.08, bullish: false, phase: 3.7 },
      { x: 0.2, baseH: 0.15, bullish: true, phase: 4.6 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.85) * 0.14;
      headRef.current.rotation.x = 0.22 + Math.sin(t * 1.4) * 0.04;
    }
    if (leftHandRef.current && rightHandRef.current) {
      leftHandRef.current.position.y = 0.61 + Math.sin(t * 8.5) * 0.012;
      rightHandRef.current.position.y = 0.61 + Math.cos(t * 9.2) * 0.012;
    }
    if (holoRef.current) {
      holoRef.current.position.y = 0.94 + Math.sin(t * 2.2) * 0.018;
    }
    for (let i = 0; i < candleSpecs.length; i++) {
      const mesh = barRefs.current[i];
      if (!mesh) continue;
      const spec = candleSpecs[i];
      const pulse = 0.72 + Math.sin(t * 2.4 + spec.phase) * 0.38;
      mesh.scale.y = Math.max(0.35, pulse);
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Reclined Legs Resting Flat on the Sun Lounger Mattress (Facing +Z toward Pool!) */}
      <mesh position={[-0.12, 0.44, 0.56]} rotation={[Math.PI / 2 - 0.04, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.56, 6, 10]} />
        <meshStandardMaterial color="#d8a986" roughness={0.68} />
      </mesh>
      <mesh position={[0.12, 0.44, 0.56]} rotation={[Math.PI / 2 - 0.04, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.56, 6, 10]} />
        <meshStandardMaterial color="#d8a986" roughness={0.68} />
      </mesh>
      {/* Relaxed Pool Slides / Sandals */}
      <mesh position={[-0.12, 0.45, 0.92]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.11, 0.05, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.45, 0.92]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.11, 0.05, 0.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Resort Khaki Swim Shorts */}
      <mesh position={[0, 0.46, 0.16]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.38, 0.34, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.78} />
      </mesh>

      {/* Reclined Torso Leaning Comfortably Against the Tilted Sun Lounger Backrest */}
      <group position={[0, 0.58, -0.22]} rotation={[0.62, 0, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.4, 0.48, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.62} />
        </mesh>
        {/* Emerald-Cyan Neon Bot Trading Chest Trim */}
        <mesh position={[0, 0.22, 0.105]}>
          <boxGeometry args={[0.24, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#10b981"
            emissiveIntensity={isNight ? 1.5 : 0.75}
          />
        </mesh>
      </group>

      {/* Head Propped Comfortably on the Blue Pillow with Glowing Cyber Trading Visor */}
      <group ref={headRef} position={[0, 0.88, -0.58]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 16, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.32} />
        </mesh>
        {/* Sleek Metallic Bot Antenna Ear Fins */}
        <mesh position={[-0.16, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.1, 0.08]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.1} />
        </mesh>
        <mesh position={[0.16, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.1, 0.08]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.1} />
        </mesh>
        {/* Glowing Emerald-Cyan Trading Visor Glasses */}
        <mesh position={[0, 0.02, 0.138]}>
          <boxGeometry args={[0.22, 0.072, 0.04]} />
          <meshStandardMaterial
            color="#34d399"
            emissive="#10b981"
            emissiveIntensity={isNight ? 2.0 : 1.1}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Bent Arms Typing on Trading Laptop */}
      <mesh position={[-0.22, 0.65, -0.06]} rotation={[0.95, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.048, 0.34, 6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.62} />
      </mesh>
      <mesh position={[0.22, 0.65, -0.06]} rotation={[0.95, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.048, 0.34, 6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.62} />
      </mesh>
      <mesh ref={leftHandRef} position={[-0.12, 0.61, 0.18]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.12, 0.61, 0.18]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Open Trading Laptop Resting on Lap */}
      <group position={[0, 0.58, 0.22]}>
        {/* Laptop Keyboard Base */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.46, 0.024, 0.3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Glowing Keyboard Accent */}
        <mesh position={[0, 0.015, 0.02]}>
          <boxGeometry args={[0.38, 0.006, 0.16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0ea5e9"
            emissiveIntensity={0.65}
          />
        </mesh>
        {/* Laptop Screen Angled Toward Bot */}
        <group position={[0, 0.14, 0.14]} rotation={[-0.35, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.46, 0.29, 0.018]} />
            <meshStandardMaterial color="#0f172a" metalness={0.78} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0, -0.011]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.42, 0.24]} />
            <meshStandardMaterial
              color="#042f2e"
              emissive="#10b981"
              emissiveIntensity={isNight ? 1.25 : 0.75}
            />
          </mesh>
        </group>
      </group>

      {/* Floating Holographic Live Candlestick Chart Above Laptop */}
      <group ref={holoRef} position={[0, 0.94, 0.16]}>
        {/* Semi-transparent Hologram Chart Panel */}
        <mesh>
          <boxGeometry args={[0.58, 0.3, 0.014]} />
          <meshPhysicalMaterial
            color="#064e3b"
            emissive="#059669"
            emissiveIntensity={0.4}
            transparent
            opacity={0.42}
            roughness={0.25}
          />
        </mesh>
        {/* Animated Bullish/Bearish Candlestick Bars */}
        {candleSpecs.map((c, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              barRefs.current[idx] = el;
            }}
            position={[c.x, -0.02, 0.018]}
          >
            <boxGeometry args={[0.045, c.baseH, 0.02]} />
            <meshStandardMaterial
              color={c.bullish ? "#22c55e" : "#ef4444"}
              emissive={c.bullish ? "#22c55e" : "#ef4444"}
              emissiveIntensity={isNight ? 1.8 : 1.0}
            />
          </mesh>
        ))}
      </group>

      {/* Clean Floating Pill Label */}
      {showLabel && (
        <Html position={[0, 1.48, -0.08]} center distanceFactor={14} zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-emerald-400/70 bg-slate-950/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300 shadow-lg">
            📈 BOT TRADING · AUTO
          </div>
        </Html>
      )}
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

/** Real sculpted 3D fluffy white cumulus clouds gently drifting across the clear blue sky */
function RealisticSkyClouds({ isSunset }: { isSunset: boolean }) {
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const cloudColor = isSunset ? "#ffe1c4" : "#ffffff";
  const underColor = isSunset ? "#f2b895" : "#e2eef8";

  const cloudDefs = useMemo(
    () => [
      { pos: [-48, 38, -58] as [number, number, number], scale: 1.55 },
      { pos: [-16, 44, -76] as [number, number, number], scale: 1.85 },
      { pos: [22, 41, -68] as [number, number, number], scale: 1.65 },
      { pos: [56, 37, -54] as [number, number, number], scale: 1.45 },
      { pos: [-34, 34, -36] as [number, number, number], scale: 1.15 },
      { pos: [38, 35, -38] as [number, number, number], scale: 1.25 },
      { pos: [2, 48, -94] as [number, number, number], scale: 2.1 },
    ],
    []
  );

  useFrame((state) => {
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.position.x =
        Math.sin(state.clock.elapsedTime * 0.045) * 6.5;
    }
  });

  return (
    <group ref={cloudsGroupRef}>
      {cloudDefs.map((c, idx) => (
        <group key={idx} position={c.pos} scale={c.scale}>
          {/* Flat soft underside cloud base */}
          <mesh position={[0, -0.45, 0]} scale={[3.4, 0.9, 1.8]}>
            <sphereGeometry args={[1.2, 12, 10]} />
            <meshStandardMaterial
              color={underColor}
              roughness={0.95}
              fog={false}
            />
          </mesh>
          {/* Sculpted puffy cumulus cloud domes */}
          <mesh position={[-1.9, 0.25, 0.2]} scale={[1.4, 1.1, 1.25]}>
            <sphereGeometry args={[1.35, 12, 10]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[-0.2, 0.85, -0.1]} scale={[1.65, 1.35, 1.35]}>
            <sphereGeometry args={[1.5, 14, 12]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[1.7, 0.4, 0.15]} scale={[1.45, 1.15, 1.25]}>
            <sphereGeometry args={[1.3, 12, 10]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[3.0, -0.05, -0.1]} scale={[1.05, 0.85, 1.0]}>
            <sphereGeometry args={[1.1, 10, 8]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Crisp starry night sky & glowing full moon */
function NightSkyStarsAndMoon() {
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }).map((_, i) => ({
        pos: [
          (((i * 97) % 160) - 80),
          28 + ((i * 37) % 42),
          -72 - ((i * 23) % 38),
        ] as [number, number, number],
        size: 0.12 + (i % 3) * 0.06,
      })),
    []
  );

  return (
    <group>
      {/* Glowing Full Moon */}
      <mesh position={[34, 44, -84]}>
        <sphereGeometry args={[3.1, 18, 16]} />
        <meshStandardMaterial
          color="#fffbeb"
          emissive="#fef3c7"
          emissiveIntensity={2.2}
          fog={false}
        />
      </mesh>
      {/* Twinkling Starfield */}
      {stars.map((s, idx) => (
        <mesh key={idx} position={s.pos}>
          <sphereGeometry args={[s.size, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={2.0}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

const POOL_WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 1.9 + uTime * 2.1) * 0.014 +
                 cos(pos.y * 2.3 - uTime * 1.7) * 0.012;
    pos.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const POOL_WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform float uSunset;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    // Lightweight procedural underwater caustic shimmer
    vec2 p = vUv * vec2(12.0, 6.0);
    float c1 = sin(p.x * 2.1 + uTime * 1.6 + sin(p.y * 2.4 - uTime * 1.2));
    float c2 = cos(p.y * 2.7 - uTime * 1.4 + cos(p.x * 1.8 + uTime * 1.5));
    float caustic = smoothstep(0.35, 1.0, (c1 * c2) * 0.5 + 0.5);

    // Edge underwater LED glow from pool perimeter walls
    float edgeX = min(vUv.x, 1.0 - vUv.x);
    float edgeY = min(vUv.y, 1.0 - vUv.y);
    float edgeGlow = smoothstep(0.18, 0.0, min(edgeX, edgeY));

    vec3 dayWater = mix(vec3(0.05, 0.58, 0.78), vec3(0.24, 0.84, 0.96), caustic);
    vec3 sunsetWater = mix(vec3(0.08, 0.44, 0.66), vec3(0.45, 0.72, 0.88), caustic) +
                       vec3(0.35, 0.16, 0.18) * 0.25;
    vec3 nightWater = mix(vec3(0.02, 0.36, 0.58), vec3(0.16, 0.88, 1.0), caustic) * 1.35 +
                      vec3(0.12, 0.86, 1.0) * edgeGlow * 0.95;

    vec3 col = mix(dayWater, sunsetWater, uSunset);
    col = mix(col, nightWater, uNight);

    // Crisp specular ripple glints
    float glint = smoothstep(0.015, 0.026, vWave);
    col += vec3(0.95, 0.99, 1.0) * glint * (uNight > 0.5 ? 0.55 : 0.35);

    float alpha = mix(0.76, 0.84, uNight);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Modern Architectural Street Lamp with Soft Volumetric Light Cone onto Sidewalk & Wet Asphalt */
function StreetLampWithCone({
  position,
  isNight,
  isSunset,
  isCyan = false,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
  isCyan?: boolean;
}) {
  const showBeam = isNight || isSunset;
  const lampColor = isCyan ? "#67e8f9" : "#ffe2a6";
  const coneOpacity = isNight ? 0.16 : 0.08;

  return (
    <group position={position}>
      {/* Pole Base & Sleek Curved Arm facing the Road (+Z) */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.28, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.095, 5.2, 10]} />
        <meshStandardMaterial color="#273140" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Cantilevered Head overhanging the Avenue */}
      <mesh position={[0, 5.28, 0.72]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.1, 1.55]} />
        <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Glowing LED Street Luminaire */}
      <mesh position={[0, 5.22, 1.32]}>
        <boxGeometry args={[0.42, 0.08, 0.28]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={lampColor}
          emissiveIntensity={isNight ? 3.2 : isSunset ? 1.8 : 0.25}
          toneMapped={!(isNight || isSunset)}
        />
      </mesh>
      {/* Soft Volumetric Light Cone */}
      {showBeam && (
        <mesh position={[0, 2.6, 1.38]}>
          <coneGeometry args={[2.55, 5.15, 16, 1, true]} />
          <meshBasicMaterial
            color={lampColor}
            transparent
            opacity={coneOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/** Manicured Architectural Sidewalk Tree in a Clean Stone Planter */
function OrnamentalSidewalkTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Square modern stone curb planter */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[1.15, 0.28, 1.15]} />
        <meshStandardMaterial color="#d6d2c9" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.95]} />
        <meshStandardMaterial color="#3f3124" roughness={0.95} />
      </mesh>
      {/* Clean straight trunk */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 2.0, 10]} />
        <meshStandardMaterial color="#684e38" roughness={0.88} />
      </mesh>
      {/* Sculpted layered lush emerald crown */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <sphereGeometry args={[0.92, 14, 12]} />
        <meshStandardMaterial color="#2f7d3a" roughness={0.78} />
      </mesh>
      <mesh position={[0.42, 2.38, 0.28]} castShadow>
        <sphereGeometry args={[0.58, 12, 10]} />
        <meshStandardMaterial color="#3c8f46" roughness={0.76} />
      </mesh>
      <mesh position={[-0.4, 2.45, -0.22]} castShadow>
        <sphereGeometry args={[0.56, 12, 10]} />
        <meshStandardMaterial color="#276b31" roughness={0.8} />
      </mesh>
      <mesh position={[0.05, 3.3, -0.05]} castShadow>
        <sphereGeometry args={[0.52, 12, 10]} />
        <meshStandardMaterial color="#469d50" roughness={0.74} />
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
  const waterMatRef = useRef<THREE.ShaderMaterial>(null);
  const { showLabelsIn3D } = useOffice();
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNight: { value: 0 },
      uSunset: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (waterMatRef.current) {
      waterMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      waterMatRef.current.uniforms.uNight.value = isNight ? 1.0 : 0.0;
      waterMatRef.current.uniforms.uSunset.value = isSunset ? 1.0 : 0.0;
    }
  });

  const handleGroundDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, Math.max(0.4, e.point.y), e.point.z]);
    }
  };

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

      {/* Raised Concrete Sidewalks (Trotoar Utara & Selatan) with Stone Curbs */}
      <mesh position={[0, 0.06, 19.65]} receiveShadow onDoubleClick={handleGroundDoubleClick}>
        <boxGeometry args={[120, 0.14, 1.9]} />
        <meshStandardMaterial color="#cfd5dc" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.08, 20.56]} receiveShadow>
        <boxGeometry args={[120, 0.16, 0.16]} />
        <meshStandardMaterial color="#9aa4b2" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.06, 29.45]} receiveShadow onDoubleClick={handleGroundDoubleClick}>
        <boxGeometry args={[120, 0.14, 1.8]} />
        <meshStandardMaterial color="#cfd5dc" roughness={0.78} />
      </mesh>

      {/* Architectural Asphalt Avenue — Wet Reflective Glossy Asphalt at Night! */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 24.5]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[140, 8.2]} />
        {isNight && performanceMode !== "eco" ? (
          <meshPhysicalMaterial
            map={textures.asphalt}
            color="#202a3b"
            roughness={0.14}
            metalness={0.55}
            clearcoat={0.92}
            clearcoatRoughness={0.1}
          />
        ) : (
          <meshStandardMaterial
            map={textures.asphalt}
            color={isNight ? "#263247" : "#ffffff"}
            roughness={isNight ? 0.2 : 0.86}
            metalness={isNight ? 0.45 : 0.05}
          />
        )}
      </mesh>

      {/* Wet Night Neon Reflection Sheen Puddles on the Asphalt Avenue */}
      {isNight && (
        <group position={[0, 0.008, 24.5]}>
          {[
            { x: -12, z: -1.4, w: 6.5, d: 2.2, col: "#22d3ee" },
            { x: 0, z: -0.6, w: 8.5, d: 2.6, col: "#38bdf8" },
            { x: 11, z: -1.2, w: 6.8, d: 2.2, col: "#e879f9" },
            { x: -24, z: -2.0, w: 4.5, d: 1.8, col: "#fbbf24" },
            { x: 24, z: -2.0, w: 4.5, d: 1.8, col: "#fbbf24" },
          ].map((p, idx) => (
            <mesh key={idx} position={[p.x, 0, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[p.w, p.d]} />
              <meshBasicMaterial
                color={p.col}
                transparent
                opacity={0.14}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Crisp Road Edge Lines + Dashed Center Line + Pedestrian Zebra Crosswalk */}
      <mesh position={[0, 0.004, 20.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.004, 28.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
      {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((x) => (
        <mesh key={x} position={[x, 0.005, 24.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 0.22]} />
          <meshStandardMaterial color="#facc15" roughness={0.68} />
        </mesh>
      ))}
      {/* Zebra Crosswalk near Main Entrance */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((cz, i) => (
        <mesh key={`zebra-${i}`} position={[-1.5, 0.006, 24.5 + cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 0.56]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.72} />
        </mesh>
      ))}

      {/* 5 Modern Street Lamps with Volumetric Light Cones along Front Sidewalk */}
      {[
        { x: -24, cyan: false },
        { x: -12, cyan: true },
        { x: 0, cyan: false },
        { x: 12, cyan: true },
        { x: 24, cyan: false },
      ].map((sl, i) => (
        <StreetLampWithCone
          key={`streetlamp-${i}`}
          position={[sl.x, 0.12, 19.65]}
          isNight={isNight}
          isSunset={isSunset}
          isCyan={sl.cyan}
        />
      ))}

      {/* Clean Manicured Sidewalk Trees flanking the Avenue */}
      {[-29, -19.5, 19.5, 29].map((tx, i) => (
        <OrnamentalSidewalkTree
          key={`ortree-${i}`}
          position={[tx, 0.12, 19.45]}
          scale={i % 2 === 0 ? 1.08 : 0.96}
        />
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

        {/* Custom GLSL Animated Caustic Water Shader + Underwater Pool Glow */}
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[13.16, 6.16, 20, 10]} />
          <shaderMaterial
            ref={waterMatRef}
            vertexShader={POOL_WATER_VERTEX}
            fragmentShader={POOL_WATER_FRAGMENT}
            uniforms={waterUniforms}
            transparent
            depthWrite={false}
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

      {/* 6 Plush Sun Loungers — Properly Oriented Facing the Swimming Pool! */}
      <SunLounger position={[-13.4, 0.18, 7.2]} rotationY={-Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 10.7]} rotationY={-Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 15.6]} rotationY={-Math.PI / 2} />
      <SunLounger position={[-9.2, 0.18, 16.3]} rotationY={Math.PI} />
      <SunLounger position={[-4.2, 0.18, 16.3]} rotationY={Math.PI} />
      <SunLounger position={[2.6, 0.18, 16.3]} rotationY={Math.PI} />

      {/* Poolside Trading Bot Reclining on the Center Pool Sun Lounger */}
      <PoolsideTradingBot
        position={[-13.4, 0.18, 10.7]}
        rotationY={-Math.PI / 2}
        isNight={isNight}
        showLabel={showLabelsIn3D}
      />

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

      {/* Soft Balanced Night Resort Pool Deck & Porsche Showcase Lighting (Center Balcony Glare Lamp Removed!) */}
      {(isNight || isSunset) && (
        <>
          <pointLight
            position={[-4.2, 4.4, 15.8]}
            color="#ffe4b5"
            intensity={isNight ? 16 : 8}
            distance={30}
          />
          <pointLight
            position={[9.4, 4.2, 12.6]}
            color="#fff6e0"
            intensity={isNight ? 16 : 8}
            distance={22}
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

      {/* Real Sculpted Fluffy White Clouds (Day & Sunset) OR Moon & Stars (Night) */}
      {isNight ? (
        <NightSkyStarsAndMoon />
      ) : (
        <RealisticSkyClouds isSunset={isSunset} />
      )}

      {/* Varied Instanced Cyberpunk Metropolis: Setbacks, GLSL Procedural Windows, Hologram Billboards & Flying Traffic */}
      <CyberpunkSkyline
        lightingPreset={lightingPreset}
        performanceMode={performanceMode}
      />
    </group>
  );
}
