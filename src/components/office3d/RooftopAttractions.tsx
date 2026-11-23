"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RooftopAttractionsProps {
  isNight: boolean;
  isSunset: boolean;
  isSimulationRunning: boolean;
}

/** Executive Twin-Engine Luxury Helicopter parked on the West Rooftop Helipad */
function LuxuryHelicopter({
  position,
  isNight,
  isSimulationRunning,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSimulationRunning: boolean;
}) {
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const speed = isSimulationRunning ? 1 : 0.2;
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += delta * 5.2 * speed;
    }
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += delta * 14.0 * speed;
    }
    if (beaconRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 5.5);
      beaconRef.current.emissiveIntensity = (isNight ? 3.4 : 1.4) * (0.35 + pulse * 0.65);
    }
  });

  return (
    <group position={position} rotation={[0, 0.42, 0]}>
      {/* Twin Chrome Landing Skids */}
      {[-0.95, 0.95].map((sx, idx) => (
        <group key={idx} position={[sx, 0.07, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 4.2, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Upturned front ski tip */}
          <mesh position={[0, 0.14, 2.22]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.055, 0.52, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Skid Support Struts */}
      {[
        [-0.78, 0.45, 0.95, 0.28],
        [0.78, 0.45, 0.95, -0.28],
        [-0.78, 0.45, -0.95, 0.28],
        [0.78, 0.45, -0.95, -0.28],
      ].map(([x, y, z, rz], idx) => (
        <mesh key={idx} position={[x, y, z]} rotation={[0, 0, rz]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.88, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.28} />
        </mesh>
      ))}

      {/* Main Sculpted Executive Fuselage (Obsidian Black + Champagne Gold Trim) */}
      <mesh position={[0, 1.32, 0.15]} scale={[1.15, 0.88, 2.35]} castShadow receiveShadow>
        <sphereGeometry args={[1.0, 20, 16]} />
        <meshPhysicalMaterial
          color="#111827"
          metalness={0.72}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Champagne Gold Executive Stripe wrapping Fuselage */}
      <mesh position={[0, 1.24, 0.2]} scale={[1.17, 0.2, 2.32]}>
        <sphereGeometry args={[1.0, 18, 12]} />
        <meshStandardMaterial
          color="#eab308"
          metalness={0.88}
          roughness={0.2}
          emissive="#ca8a04"
          emissiveIntensity={isNight ? 0.35 : 0.05}
        />
      </mesh>

      {/* Panoramic Tinted Glass Cockpit Canopy */}
      <mesh position={[0, 1.48, 1.18]} scale={[0.98, 0.64, 1.28]}>
        <sphereGeometry args={[1.0, 18, 14]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          metalness={0.2}
          roughness={0.06}
          transparent
          opacity={0.72}
          clearcoat={1}
          emissive="#0284c7"
          emissiveIntensity={isNight ? 0.45 : 0.08}
        />
      </mesh>

      {/* Side VIP Cabin Windows */}
      {[-1.12, 1.12].map((wx, idx) => (
        <mesh key={idx} position={[wx, 1.48, -0.15]}>
          <boxGeometry args={[0.06, 0.48, 1.38]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            roughness={0.08}
            metalness={0.2}
            emissive="#fef08a"
            emissiveIntensity={isNight ? 0.55 : 0.1}
          />
        </mesh>
      ))}

      {/* Twin Top Turbine Engine Cowling */}
      <mesh position={[0, 2.12, -0.35]} castShadow>
        <boxGeometry args={[1.15, 0.52, 1.95]} />
        <meshStandardMaterial color="#1f2937" metalness={0.72} roughness={0.28} />
      </mesh>
      {/* Twin Chrome Exhaust Nozzles */}
      {[-0.36, 0.36].map((ex, idx) => (
        <mesh key={idx} position={[ex, 2.1, -1.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.34, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
        </mesh>
      ))}

      {/* Tapered Tail Boom */}
      <mesh position={[0, 1.54, -3.2]} rotation={[Math.PI / 2 - 0.04, 0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.36, 3.6, 12]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.22} />
      </mesh>
      {/* Gold stripe on tail boom */}
      <mesh position={[0, 1.54, -3.2]} rotation={[Math.PI / 2 - 0.04, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 1.2, 10]} />
        <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Horizontal Tail Stabilizers */}
      <mesh position={[0, 1.58, -4.3]} castShadow>
        <boxGeometry args={[1.7, 0.07, 0.42]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Vertical Tail Fin */}
      <mesh position={[0, 1.98, -4.92]} rotation={[-0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 1.22, 0.68]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.22} />
      </mesh>

      {/* Spinning Tail Rotor */}
      <group ref={tailRotorRef} position={[0.14, 2.26, -5.04]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.14, 10]} />
          <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.04, 1.18, 0.1]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.04, 0.1, 1.18]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>

      {/* Main Rotor Mast + 4-Blade Spinning Main Rotor */}
      <mesh position={[0, 2.52, 0.05]}>
        <cylinderGeometry args={[0.12, 0.15, 0.48, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
      </mesh>
      <group ref={mainRotorRef} position={[0, 2.74, 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.12, 14]} />
          <meshStandardMaterial color="#eab308" metalness={0.88} roughness={0.18} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, i) => (
          <group key={i} rotation={[0, ang, 0]}>
            <mesh position={[1.85, 0, 0]} castShadow>
              <boxGeometry args={[3.5, 0.035, 0.22]} />
              <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.3} />
            </mesh>
            {/* Yellow blade safety tip */}
            <mesh position={[3.45, 0.005, 0]}>
              <boxGeometry args={[0.32, 0.038, 0.225]} />
              <meshStandardMaterial color="#facc15" roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Nose LED Searchlight + Blinking Red Anti-Collision Beacon */}
      <mesh position={[0, 1.05, 2.48]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#e0f2fe"
          emissiveIntensity={isNight ? 3.5 : 1.0}
        />
      </mesh>
      <mesh position={[0, 2.66, -4.92]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          ref={beaconRef}
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={isNight ? 3.0 : 1.2}
        />
      </mesh>
    </group>
  );
}

/** Animated 3D Badminton Player holding a Racket */
function BadmintonPlayer({
  side,
  jerseyColor,
  shortsColor,
  skinColor,
  hairColor,
  isSimulationRunning,
}: {
  side: -1 | 1;
  jerseyColor: string;
  shortsColor: string;
  skinColor: string;
  hairColor: string;
  isSimulationRunning: boolean;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const racketArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!isSimulationRunning) return;
    const t = state.clock.elapsedTime;
    // Rally cycle: 2.2s per full back-and-forth
    const phase = (t * 2.6) % (Math.PI * 2);
    // Lateral court movement + energetic athletic bounce
    if (playerRef.current) {
      playerRef.current.position.z = Math.sin(t * 1.45 + side * 1.2) * 1.25;
      playerRef.current.position.x =
        side * (2.65 + Math.cos(t * 1.9 + side) * 0.45);
      playerRef.current.position.y = Math.abs(Math.sin(t * 5.2 + side)) * 0.08;
    }

    // Swing racket right as the shuttlecock reaches this player's side!
    if (racketArmRef.current) {
      const hitWave = side === -1 ? Math.sin(phase) : -Math.sin(phase);
      const swing = hitWave > 0.35 ? -1.45 * ((hitWave - 0.35) / 0.65) : 0.25;
      racketArmRef.current.rotation.x = -0.75 + swing * 0.85;
      racketArmRef.current.rotation.z = side * -0.25;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(t * 5.2 + side) * 0.28;
      rightLegRef.current.rotation.x = -Math.sin(t * 5.2 + side) * 0.28;
    }
  });

  // Facing the net (side -1 faces +X -> rotY = PI/2; side +1 faces -X -> rotY = -PI/2)
  return (
    <group
      ref={playerRef}
      position={[side * 2.65, 0, 0]}
      rotation={[0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}
    >
      {/* Legs + White Sneakers */}
      <mesh ref={leftLegRef} position={[-0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.52, 6, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.52, 6, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>
      {/* Sport Shorts */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.24]} />
        <meshStandardMaterial color={shortsColor} roughness={0.8} />
      </mesh>
      {/* Athletic Jersey Torso */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.24]} />
        <meshStandardMaterial color={jerseyColor} roughness={0.72} />
      </mesh>
      {/* Off-hand Arm (Balance) */}
      <mesh position={[-0.28, 1.12, 0.1]} rotation={[-0.4, 0, 0.35]} castShadow>
        <capsuleGeometry args={[0.055, 0.42, 6, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.75} />
      </mesh>
      {/* Head + Hair + Sport Headband */}
      <mesh position={[0, 1.56, 0]} castShadow>
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.64, -0.02]}>
        <sphereGeometry args={[0.165, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color={hairColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.61, 0]}>
        <cylinderGeometry args={[0.166, 0.166, 0.045, 14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>

      {/* Swinging Racket Arm + Authentic Badminton Racket */}
      <group ref={racketArmRef} position={[0.26, 1.32, 0]}>
        <mesh position={[0, -0.18, 0.14]} rotation={[-0.65, 0, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.42, 6, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.75} />
        </mesh>
        {/* Racket Handle + Shaft + Oval Head */}
        <group position={[0, -0.34, 0.36]} rotation={[0.45, 0, 0]}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.018, 0.022, 0.28, 8]} />
            <meshStandardMaterial color="#facc15" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.32, 6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Oval Racket Frame */}
          <mesh position={[0, 0.72, 0]} scale={[0.78, 1.12, 1]}>
            <torusGeometry args={[0.17, 0.016, 8, 20]} />
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.25} />
          </mesh>
          {/* Racket String Bed */}
          <mesh position={[0, 0.72, 0]} scale={[0.76, 1.1, 1]}>
            <circleGeometry args={[0.16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Authentic BWF-Style Rooftop Badminton Court + 4 Tall Stadium Floodlights + 2 Active Players + Shuttlecock */
function RooftopBadmintonCourt({
  position,
  isNight,
  isSunset,
  isSimulationRunning,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
  isSimulationRunning: boolean;
}) {
  const shuttleRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!shuttleRef.current || !isSimulationRunning) return;
    const t = state.clock.elapsedTime;
    const phase = (t * 2.6) % (Math.PI * 2);
    // Smooth rally flight between X = -2.5 and X = +2.5 clearing the net (y=1.55m)
    const x = Math.cos(phase) * 2.55;
    const arc = Math.sin(phase) ** 2;
    const y = 1.65 + (1 - (x / 2.65) ** 2) * 1.85 + arc * 0.25;
    const z = Math.sin(t * 1.45) * 0.85;
    shuttleRef.current.position.set(x, y, z);
    shuttleRef.current.rotation.z = Math.sin(phase) > 0 ? -0.9 : 0.9;
  });

  const floodlightEmissive = isNight ? 4.2 : isSunset ? 2.4 : 0.9;
  const lineY = 0.022;

  const poleCorners: [number, number, number][] = [
    [-5.35, 0, -3.1],
    [5.35, 0, -3.1],
    [-5.35, 0, 3.1],
    [5.35, 0, 3.1],
  ];

  return (
    <group position={position}>
      {/* Outer Dark-Slate Protective Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 6.8]} />
        <meshStandardMaterial color="#1e3a4c" roughness={0.82} />
      </mesh>

      {/* Official BWF Emerald-Green Badminton Court Mat (10.2m x 5.2m) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.2, 5.2]} />
        <meshStandardMaterial color="#15803d" roughness={0.76} />
      </mesh>

      {/* OFFICIAL CRISP WHITE BADMINTON COURT LINES */}
      {/* Outer Doubles Sidelines (Z = ±2.52) */}
      {[-2.52, 2.52].map((lz, i) => (
        <mesh key={`ds-${i}`} position={[0, lineY, lz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.08, 0.07]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Inner Singles Sidelines (Z = ±2.12) */}
      {[-2.12, 2.12].map((lz, i) => (
        <mesh key={`ss-${i}`} position={[0, lineY, lz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.08, 0.06]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Back Baselines (X = ±5.0) & Doubles Long Service Lines (X = ±4.32) */}
      {[-5.0, -4.32, 4.32, 5.0].map((lx, i) => (
        <mesh key={`bl-${i}`} position={[lx, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 5.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Short Service Lines (X = ±1.62) */}
      {[-1.62, 1.62].map((lx, i) => (
        <mesh key={`ssl-${i}`} position={[lx, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 5.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Center Service Lines (West & East service boxes) */}
      {[-3.31, 3.31].map((lx, i) => (
        <mesh key={`csl-${i}`} position={[lx, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.38, 0.06]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* REAL BADMINTON NET POSTS + TRANSLUCENT MESH NET + WHITE TOP TAPE */}
      {[-2.62, 2.62].map((pz, i) => (
        <group key={`post-${i}`} position={[0, 0, pz]}>
          <mesh position={[0, 0.78, 0]} castShadow>
            <cylinderGeometry args={[0.036, 0.04, 1.56, 10]} />
            <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.08, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Net Mesh */}
      <mesh position={[0, 1.14, 0]}>
        <boxGeometry args={[0.025, 0.74, 5.2]} />
        <meshStandardMaterial
          color="#e2e8f0"
          transparent
          opacity={0.42}
          roughness={0.9}
        />
      </mesh>
      {/* Crisp White Top Net Tape */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[0.045, 0.07, 5.24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* 4 TALL STADIUM FLOODLIGHT POLES (Lampu Lapangan Bulu Tangkis!) */}
      {poleCorners.map(([px, , pz], i) => {
        const aimX = px < 0 ? 0.55 : -0.55;
        const aimZ = pz < 0 ? 0.35 : -0.35;
        return (
          <group key={`lamp-${i}`} position={[px, 0, pz]}>
            {/* Pole Base */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.24, 10]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Tall Aluminum Floodlight Mast (4.3m) */}
            <mesh position={[0, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.085, 4.3, 10]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.28} />
            </mesh>
            {/* Angled LED Stadium Floodlight Housing */}
            <group position={[aimX * 0.45, 4.32, aimZ * 0.45]} rotation={[aimZ * 0.5, 0, -aimX * 0.65]}>
              <mesh>
                <boxGeometry args={[0.72, 0.16, 0.44]} />
                <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.09, 0]}>
                <boxGeometry args={[0.64, 0.04, 0.36]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#fef9c3"
                  emissiveIntensity={floodlightEmissive}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Overhead Court Illumination Light (Brightly illuminates players & green court at night!) */}
      {(isNight || isSunset) && (
        <pointLight
          position={[0, 4.6, 0]}
          color="#fffbeb"
          intensity={isNight ? 32 : 14}
          distance={20}
        />
      )}

      {/* 2 ACTIVE ANIMATED BADMINTON PLAYERS */}
      <BadmintonPlayer
        side={-1}
        jerseyColor="#0284c7"
        shortsColor="#0f172a"
        skinColor="#e2b494"
        hairColor="#1c1917"
        isSimulationRunning={isSimulationRunning}
      />
      <BadmintonPlayer
        side={1}
        jerseyColor="#dc2626"
        shortsColor="#1e293b"
        skinColor="#d4a07e"
        hairColor="#291d16"
        isSimulationRunning={isSimulationRunning}
      />

      {/* FLYING WHITE SHUTTLECOCK (KOK BULU TANGKIS) */}
      <group ref={shuttleRef} position={[0, 2.6, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <coneGeometry args={[0.075, 0.14, 10, 1, true]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={isNight ? 1.4 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#fde047" />
        </mesh>
      </group>
    </group>
  );
}

export function RooftopAttractions({
  isNight,
  isSunset,
  isSimulationRunning,
}: RooftopAttractionsProps) {
  return (
    <group>
      {/* Executive Helicopter parked directly on the West Helipad */}
      <LuxuryHelicopter
        position={[-7.5, 11.82, -2.6]}
        isNight={isNight}
        isSimulationRunning={isSimulationRunning}
      />

      {/* Authentic BWF Rooftop Badminton Court + Floodlights + 2 Players */}
      <RooftopBadmintonCourt
        position={[6.5, 11.81, -2.6]}
        isNight={isNight}
        isSunset={isSunset}
        isSimulationRunning={isSimulationRunning}
      />
    </group>
  );
}
