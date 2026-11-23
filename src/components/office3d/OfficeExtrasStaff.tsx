"use client";

import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_1_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";
import type { FloorView } from "@/types/office";

interface SeatedOrStandingPerson {
  id: string;
  name: string;
  title: string;
  gender: "male" | "female";
  hairStyle: "short" | "bob" | "ponytail" | "security_cap";
  isSecurity?: boolean;
  floor: 1 | 3;
  position: [number, number, number];
  rotationY: number;
  pose: "seated" | "standing";
  suitColor: string;
  sleeveColor?: string;
  shirtColor: string;
  tieColor?: string;
  skinColor: string;
  hairColor: string;
  badgeColor: string;
  hasLaptop?: boolean;
  hasGlasses?: boolean;
  hasNeckHeadphones?: boolean;
}

const EXTRA_STAFF: SeatedOrStandingPerson[] = [
  // ================= LANTAI 3 — EKSEKUTIF FAJREZZZ (CEO, MANAJER, SEKRETARIS, CFO) =================
  {
    id: "vip-ceo",
    name: "Hendra Wijaya",
    title: "CEO Eksekutif",
    gender: "male",
    hairStyle: "short",
    floor: 3,
    position: [7.4, FLOOR_3_Y, -5.22],
    rotationY: 0,
    pose: "seated",
    suitColor: "#141824",
    shirtColor: "#ffffff",
    tieColor: "#1e3a8a",
    skinColor: "#e2b89a",
    hairColor: "#171618",
    badgeColor: "#7c3aed",
    hasGlasses: true,
  },
  {
    id: "vip-manager",
    name: "Bagas Prakoso",
    title: "Manajer Senior",
    gender: "male",
    hairStyle: "short",
    floor: 3,
    position: [-4.5, FLOOR_3_Y, -5.0],
    rotationY: 0,
    pose: "seated",
    suitColor: "#1e3a5f",
    shirtColor: "#f8fafc",
    tieColor: "#38bdf8",
    skinColor: "#ddb192",
    hairColor: "#18181b",
    badgeColor: "#6366f1",
    hasGlasses: true,
  },
  {
    id: "vip-secretary",
    name: "Putri Larasati",
    title: "Sekretaris Eksekutif",
    gender: "female",
    hairStyle: "ponytail",
    floor: 3,
    position: [-2.7, FLOOR_3_Y, -5.0],
    rotationY: 0,
    pose: "seated",
    suitColor: "#a78bfa",
    shirtColor: "#ffffff",
    skinColor: "#efc6a9",
    hairColor: "#261811",
    badgeColor: "#a78bfa",
  },
  {
    id: "vip-cfo",
    name: "Arman Santika",
    title: "Direktur Keuangan",
    gender: "male",
    hairStyle: "short",
    floor: 3,
    position: [-6.3, FLOOR_3_Y, -2.0],
    rotationY: Math.PI,
    pose: "seated",
    suitColor: "#27272e",
    shirtColor: "#f8fafc",
    skinColor: "#dab090",
    hairColor: "#1a1716",
    badgeColor: "#8b5cf6",
    hasGlasses: true,
  },

  // ================= LANTAI 1 — SECURITY COWOK (PINTU UTAMA), RESEPSIONIS & TIM FAJREZZZ LOBBY =================
  {
    id: "l1-security-1",
    name: "Bambang Suryo",
    title: "Security Pintu Utama",
    gender: "male",
    hairStyle: "security_cap",
    isSecurity: true,
    floor: 1,
    position: [-3.8, FLOOR_1_Y, 4.5],
    rotationY: 0,
    pose: "standing",
    suitColor: "#0f2442",
    shirtColor: "#dbeafe",
    tieColor: "#0f172a",
    skinColor: "#d6a482",
    hairColor: "#171717",
    badgeColor: "#f59e0b",
  },
  {
    id: "l1-security-2",
    name: "Hendro Wibowo",
    title: "Security Lobby",
    gender: "male",
    hairStyle: "security_cap",
    isSecurity: true,
    floor: 1,
    position: [3.8, FLOOR_1_Y, 4.5],
    rotationY: 0,
    pose: "standing",
    suitColor: "#0f2442",
    shirtColor: "#dbeafe",
    tieColor: "#0f172a",
    skinColor: "#d9a986",
    hairColor: "#18181b",
    badgeColor: "#f59e0b",
  },
  {
    id: "l1-recep-1",
    name: "Nabila Sari",
    title: "Resepsionis L1",
    gender: "female",
    hairStyle: "bob",
    floor: 1,
    position: [-1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#f8fafc",
    shirtColor: "#ffffff",
    skinColor: "#efc5a8",
    hairColor: "#24160f",
    badgeColor: "#7c3aed",
    hasGlasses: true,
  },
  {
    id: "l1-recep-2",
    name: "Arif Hidayat",
    title: "Admin Lobby L1",
    gender: "male",
    hairStyle: "short",
    floor: 1,
    position: [1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#f1f5f9",
    shirtColor: "#ffffff",
    tieColor: "#1e3a8a",
    skinColor: "#dfb293",
    hairColor: "#171717",
    badgeColor: "#6366f1",
  },
  {
    id: "l1-sofa-w1",
    name: "Dina Oktavia",
    title: "Staf CS L1",
    gender: "female",
    hairStyle: "ponytail",
    floor: 1,
    position: [-9.2, FLOOR_1_Y, -2.7],
    rotationY: 0.14,
    pose: "seated",
    suitColor: "#171a24",
    shirtColor: "#f8fafc",
    skinColor: "#ecc3a5",
    hairColor: "#2c1b12",
    badgeColor: "#8b5cf6",
    hasLaptop: true,
  },
  {
    id: "l1-sofa-w2",
    name: "Gilang Ramadhan",
    title: "Staf Admin L1",
    gender: "male",
    hairStyle: "short",
    floor: 1,
    position: [-7.55, FLOOR_1_Y, -2.7],
    rotationY: -0.18,
    pose: "seated",
    suitColor: "#181a26",
    sleeveColor: "#3b267d",
    shirtColor: "#ddd6fe",
    skinColor: "#d9ab8c",
    hairColor: "#161618",
    badgeColor: "#7c3aed",
    hasNeckHeadphones: true,
  },
  {
    id: "l1-sofa-e1",
    name: "Maya Kusuma",
    title: "Staf Kreatif L1",
    gender: "female",
    hairStyle: "bob",
    floor: 1,
    position: [7.55, FLOOR_1_Y, -2.7],
    rotationY: 0.18,
    pose: "seated",
    suitColor: "#a78bfa",
    shirtColor: "#ffffff",
    skinColor: "#edc4a7",
    hairColor: "#23160f",
    badgeColor: "#a78bfa",
    hasLaptop: true,
    hasGlasses: true,
  },
  {
    id: "l1-sofa-e2",
    name: "Hendra Saputra",
    title: "Staf Media L1",
    gender: "male",
    hairStyle: "short",
    floor: 1,
    position: [9.2, FLOOR_1_Y, -2.7],
    rotationY: -0.14,
    pose: "seated",
    suitColor: "#2563eb",
    sleeveColor: "#f8fafc",
    shirtColor: "#ffffff",
    skinColor: "#dfb291",
    hairColor: "#181615",
    badgeColor: "#3b82f6",
  },
];

function StaffFigure({
  person,
  index,
  showLabels,
  isSimulationRunning,
}: {
  person: SeatedOrStandingPerson;
  index: number;
  showLabels: boolean;
  isSimulationRunning: boolean;
}) {
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const [labelTier, setLabelTier] = useState<"near" | "mid" | "far">("far");
  const labelTierRef = useRef<"near" | "mid" | "far">("far");
  const distAccumRef = useRef(0);
  const worldPos = useMemo(
    () => new THREE.Vector3(person.position[0], person.position[1] + 1.2, person.position[2]),
    [person.position]
  );

  useFrame((state, delta) => {
    distAccumRef.current += Math.min(delta, 0.06);
    if (distAccumRef.current > 0.22) {
      distAccumRef.current = 0;
      const camDist = state.camera.position.distanceTo(worldPos);
      const nextTier: "near" | "mid" | "far" =
        camDist < 14.5 ? "near" : camDist < 28 ? "mid" : "far";
      if (nextTier !== labelTierRef.current) {
        labelTierRef.current = nextTier;
        setLabelTier(nextTier);
      }
    }
    if (!isSimulationRunning) return;
    const t = state.clock.elapsedTime + index * 1.3;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.9) * 0.22;
      headRef.current.rotation.x = Math.sin(t * 0.6) * 0.06;
    }
    if (leftArmRef.current && rightArmRef.current) {
      if (person.isSecurity) {
        // Alert guard stance with arms relaxed at sides
        const sway = Math.sin(t * 1.4) * 0.03;
        leftArmRef.current.rotation.x = 0.06 + sway;
        rightArmRef.current.rotation.x = 0.06 - sway;
      } else {
        const typing = Math.sin(t * 5.2) * 0.08;
        leftArmRef.current.rotation.x = -0.82 + typing;
        rightArmRef.current.rotation.x = -0.82 - typing;
      }
    }
  });

  const isSeated = person.pose === "seated";
  const isFemale = person.gender === "female";
  const torsoY = isSeated ? 0.86 : 1.11;
  const headY = isSeated ? 1.26 : 1.52;

  return (
    <group position={person.position} rotation={[0, person.rotationY, 0]}>
      {/* Pelvis / Hip Connector + Belt (Eliminates Any Gap Between Torso & Legs!) */}
      {isSeated ? (
        <group>
          <mesh position={[0, 0.54, 0.02]} castShadow>
            <boxGeometry args={[isFemale ? 0.34 : 0.4, 0.18, 0.24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Seated thighs forward */}
          <mesh position={[-0.11, 0.52, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.32, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0.52, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.32, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Seated lower shins down to floor + Shoes */}
          <mesh position={[-0.11, 0.26, 0.36]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0.26, 0.36]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {[-0.11, 0.11].map((sx, si) => (
            <mesh key={si} position={[sx, 0.055, 0.41]} castShadow>
              <boxGeometry args={[0.11, 0.08, 0.21]} />
              <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.2} />
            </mesh>
          ))}
        </group>
      ) : (
        <group>
          {/* Seamless Pelvis / Hip Block Connecting Legs Straight into Torso */}
          <mesh position={[0, 0.83, 0]} castShadow>
            <boxGeometry args={[isFemale ? 0.32 : 0.41, 0.18, isFemale ? 0.2 : 0.24]} />
            <meshStandardMaterial color={isFemale ? person.suitColor : "#0f172a"} roughness={0.78} />
          </mesh>
          {/* Tailored Leather Belt & Metallic Buckle */}
          <mesh position={[0, 0.88, 0]}>
            <boxGeometry args={[isFemale ? 0.335 : 0.425, 0.045, isFemale ? 0.215 : 0.255]} />
            <meshStandardMaterial color="#18181b" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.88, isFemale ? 0.11 : 0.132]}>
            <boxGeometry args={[0.055, 0.04, 0.014]} />
            <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.22} />
          </mesh>
          {/* Connected Standing Legs Reaching Seamlessly Up into Hip Block */}
          <mesh position={[-0.105, 0.46, 0]} castShadow>
            <capsuleGeometry args={[0.078, 0.66, 6, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.105, 0.46, 0]} castShadow>
            <capsuleGeometry args={[0.078, 0.66, 6, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Polished Formal Dress Shoes */}
          {[-0.105, 0.105].map((sx, si) => (
            <mesh key={si} position={[sx, 0.055, 0.045]} castShadow>
              <boxGeometry args={[0.11, 0.085, 0.22]} />
              <meshStandardMaterial color="#111827" roughness={0.38} metalness={0.22} />
            </mesh>
          ))}
          {/* Tailored Office A-Line Skirt for Standing Female Staff */}
          {isFemale && (
            <mesh position={[0, 0.71, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.215, 0.38, 14]} />
              <meshStandardMaterial color={person.suitColor} roughness={0.74} />
            </mesh>
          )}
        </group>
      )}

      {/* Seamless Neck Cylinder Connecting Torso to Head */}
      <mesh position={[0, torsoY + 0.3, 0]}>
        <cylinderGeometry args={[0.058, 0.068, 0.14, 12]} />
        <meshStandardMaterial color={person.skinColor} roughness={0.7} />
      </mesh>

      {/* Rounded Shoulder Caps so Arms Join Seamlessly with Zero Gap */}
      <mesh position={[isFemale ? -0.19 : -0.24, torsoY + 0.21, 0]} castShadow>
        <sphereGeometry args={[isFemale ? 0.068 : 0.08, 10, 10]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.72} />
      </mesh>
      <mesh position={[isFemale ? 0.19 : 0.24, torsoY + 0.21, 0]} castShadow>
        <sphereGeometry args={[isFemale ? 0.068 : 0.08, 10, 10]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.72} />
      </mesh>

      {/* Gender-Tailored Suit Torso (Broad Male vs Slim Tapered Female + Sculpted Bust Contour) */}
      <mesh position={[0, torsoY, 0]} castShadow>
        <boxGeometry args={[isFemale ? 0.34 : 0.44, 0.5, isFemale ? 0.2 : 0.25]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.72} />
      </mesh>
      {isFemale && (
        <group>
          <mesh position={[-0.072, torsoY + 0.08, 0.112]} scale={[0.95, 0.9, 0.96]} castShadow>
            <sphereGeometry args={[0.074, 14, 12]} />
            <meshStandardMaterial color={person.suitColor} roughness={0.68} />
          </mesh>
          <mesh position={[0.072, torsoY + 0.08, 0.112]} scale={[0.95, 0.9, 0.96]} castShadow>
            <sphereGeometry args={[0.074, 14, 12]} />
            <meshStandardMaterial color={person.suitColor} roughness={0.68} />
          </mesh>
        </group>
      )}
      <mesh position={[0, torsoY + 0.12, isFemale ? 0.11 : 0.13]}>
        <boxGeometry args={[0.12, 0.24, 0.02]} />
        <meshStandardMaterial color={person.shirtColor} roughness={0.6} />
      </mesh>
      {!isFemale && person.tieColor && (
        <mesh position={[0, torsoY + 0.04, 0.142]}>
          <boxGeometry args={[0.045, 0.26, 0.015]} />
          <meshStandardMaterial color={person.tieColor} roughness={0.45} />
        </mesh>
      )}
      {/* Fajrezzz Signature Purple-Blue "F" Chest Emblem (non-security staff) */}
      {!person.isSecurity && (
        <group position={[isFemale ? 0.085 : 0.115, torsoY + 0.1, isFemale ? 0.108 : 0.132]}>
          <mesh>
            <boxGeometry args={[0.052, 0.056, 0.008]} />
            <meshStandardMaterial
              color="#3b267d"
              emissive="#7c3aed"
              emissiveIntensity={0.42}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[-0.009, 0, 0.006]}>
            <boxGeometry args={[0.008, 0.036, 0.004]} />
            <meshStandardMaterial color="#e0e7ff" emissive="#c4b5fd" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[0.004, 0.014, 0.006]}>
            <boxGeometry args={[0.024, 0.008, 0.004]} />
            <meshStandardMaterial color="#e0e7ff" emissive="#c4b5fd" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[0.001, 0.001, 0.006]}>
            <boxGeometry args={[0.018, 0.007, 0.004]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* Optional Studio Headphones Resting Around Neck */}
      {person.hasNeckHeadphones && (
        <group position={[0, torsoY + 0.25, 0.03]}>
          <mesh rotation={[Math.PI / 2 - 0.18, 0, 0]}>
            <torusGeometry args={[0.095, 0.014, 8, 18, Math.PI * 1.28]} />
            <meshStandardMaterial color="#18181b" roughness={0.32} metalness={0.45} />
          </mesh>
          {[-0.088, 0.088].map((hx, hi) => (
            <group key={hi} position={[hx, -0.02, 0.075]} rotation={[0.25, hi === 0 ? 0.3 : -0.3, 0]}>
              <mesh>
                <cylinderGeometry args={[0.038, 0.038, 0.032, 14]} />
                <meshStandardMaterial color="#1f2433" roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[0, 0, 0.016]}>
                <torusGeometry args={[0.026, 0.005, 6, 14]} />
                <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.65} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Security Uniform Gold Chest Badge + White Shoulder Epaulettes */}
      {person.isSecurity && (
        <group>
          <mesh position={[0.12, torsoY + 0.12, 0.132]}>
            <boxGeometry args={[0.065, 0.075, 0.016]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
          </mesh>
          {[-0.17, 0.17].map((ex, ei) => (
            <mesh key={ei} position={[ex, torsoY + 0.26, 0]}>
              <boxGeometry args={[0.09, 0.025, 0.12]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Connected Animated Arms + Hands (alert guard stance vs reception typing/greeting) */}
      <mesh
        ref={leftArmRef}
        position={[isFemale ? -0.21 : -0.255, torsoY + (person.isSecurity ? -0.02 : 0.07), person.isSecurity ? 0.01 : 0.11]}
        rotation={[person.isSecurity ? 0.06 : -0.82, 0, 0.08]}
        castShadow
      >
        <capsuleGeometry args={[isFemale ? 0.052 : 0.062, 0.4, 6, 8]} />
        <meshStandardMaterial color={person.sleeveColor ?? person.suitColor} roughness={0.75} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[isFemale ? 0.21 : 0.255, torsoY + (person.isSecurity ? -0.02 : 0.07), person.isSecurity ? 0.01 : 0.11]}
        rotation={[person.isSecurity ? 0.06 : -0.82, 0, -0.08]}
        castShadow
      >
        <capsuleGeometry args={[isFemale ? 0.052 : 0.062, 0.4, 6, 8]} />
        <meshStandardMaterial color={person.sleeveColor ?? person.suitColor} roughness={0.75} />
      </mesh>

      {/* Optional Lap Laptop for Seated Lounge Staff */}
      {person.hasLaptop && (
        <group position={[0, 0.66, 0.32]}>
          <mesh>
            <boxGeometry args={[0.32, 0.02, 0.22]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.1, -0.1]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.32, 0.2, 0.018]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#38bdf8"
              emissiveIntensity={0.45}
            />
          </mesh>
        </group>
      )}

      {/* Animated Head & Gender-Appropriate Hair / Security Cap */}
      <group ref={headRef} position={[0, headY, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 14, 12]} />
          <meshStandardMaterial color={person.skinColor} roughness={0.7} />
        </mesh>
        {/* Eyes, Brows, Warm Smile & Optional Sleek Glasses */}
        <mesh position={[-0.048, 0.02, 0.138]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.14} />
        </mesh>
        <mesh position={[0.048, 0.02, 0.138]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.14} />
        </mesh>
        <mesh position={[-0.048, 0.05, 0.136]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.038, 0.008, 0.008]} />
          <meshStandardMaterial color={person.hairColor} roughness={0.85} />
        </mesh>
        <mesh position={[0.048, 0.05, 0.136]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.038, 0.008, 0.008]} />
          <meshStandardMaterial color={person.hairColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.042, 0.138]} rotation={[0.12, 0, Math.PI]}>
          <torusGeometry args={[0.025, 0.0045, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#b96d5e" roughness={0.55} />
        </mesh>
        {person.hasGlasses && (
          <group position={[0, 0.02, 0.153]}>
            {[-0.048, 0.048].map((gx, gi) => (
              <mesh key={gi} position={[gx, 0, 0]}>
                <torusGeometry args={[0.03, 0.0044, 8, 16]} />
                <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.6} />
              </mesh>
            ))}
            <mesh position={[0, 0.003, 0]}>
              <boxGeometry args={[0.036, 0.0045, 0.005]} />
              <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.6} />
            </mesh>
          </group>
        )}

        {person.hairStyle === "short" && (
          <group>
            <mesh position={[0, 0.06, -0.012]} scale={[1.0, 1.04, 1.02]}>
              <sphereGeometry args={[0.162, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            <mesh position={[-0.052, 0.095, 0.095]} rotation={[0.25, -0.22, 0.18]}>
              <capsuleGeometry args={[0.026, 0.085, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            <mesh position={[0.055, 0.095, 0.095]} rotation={[0.25, 0.25, -0.22]}>
              <capsuleGeometry args={[0.026, 0.085, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
          </group>
        )}

        {person.hairStyle === "bob" && (
          <group>
            {/* Full Rounded Hair Crown */}
            <mesh position={[0, 0.05, -0.02]} castShadow>
              <sphereGeometry args={[0.168, 14, 12]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            {/* Long Flowing Back Hair Drape Past Shoulders */}
            <mesh position={[0, -0.21, -0.11]} castShadow>
              <boxGeometry args={[0.27, 0.48, 0.11]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            {/* Long Face-Framing Side Hair Strands */}
            <mesh position={[-0.132, -0.14, 0.015]} castShadow>
              <capsuleGeometry args={[0.044, 0.34, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            <mesh position={[0.132, -0.14, 0.015]} castShadow>
              <capsuleGeometry args={[0.044, 0.34, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
          </group>
        )}

        {person.hairStyle === "ponytail" && (
          <group>
            <mesh position={[0, 0.06, -0.02]} castShadow>
              <sphereGeometry args={[0.166, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            {/* Soft Side Strands */}
            <mesh position={[-0.128, -0.09, 0.02]} castShadow>
              <capsuleGeometry args={[0.034, 0.22, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            <mesh position={[0.128, -0.09, 0.02]} castShadow>
              <capsuleGeometry args={[0.034, 0.22, 6, 8]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.76} />
            </mesh>
            {/* Long Flowing High Ponytail Tail Reaching Mid-Back */}
            <mesh position={[0, -0.16, -0.18]} rotation={[0.18, 0, 0]} castShadow>
              <capsuleGeometry args={[0.064, 0.44, 8, 12]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.74} />
            </mesh>
          </group>
        )}

        {person.hairStyle === "security_cap" && (
          <group>
            {/* Short male hair underneath */}
            <mesh position={[0, 0.04, -0.02]}>
              <sphereGeometry args={[0.158, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <meshStandardMaterial color={person.hairColor} roughness={0.85} />
            </mesh>
            {/* Navy Peaked Male Security Officer Cap */}
            <mesh position={[0, 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.175, 0.158, 0.09, 14]} />
              <meshStandardMaterial color="#0f2442" roughness={0.5} />
            </mesh>
            {/* Gold Cap Emblem */}
            <mesh position={[0, 0.135, 0.165]}>
              <boxGeometry args={[0.045, 0.035, 0.015]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Glossy Black Cap Visor Brim */}
            <mesh position={[0, 0.095, 0.15]} rotation={[0.18, 0, 0]}>
              <boxGeometry args={[0.2, 0.016, 0.12]} />
              <meshStandardMaterial color="#090d16" roughness={0.25} metalness={0.3} />
            </mesh>
          </group>
        )}
      </group>

      {/* Subtle Role-Colored Ground Presence Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 20]} />
        <meshBasicMaterial color={person.badgeColor} transparent opacity={0.36} />
      </mesh>

      {/* Clean Distance-Scaled Floating Name & Executive Title Pill (No Overlap!) */}
      {showLabels && labelTier !== "far" && (
        <Html position={[0, headY + 0.42 + (index % 2) * 0.08, 0]} center distanceFactor={13}>
          {labelTier === "near" ? (
            <div
              className="pointer-events-none select-none whitespace-nowrap rounded-full border bg-slate-950/86 px-2 py-0.5 text-[9px] font-bold text-slate-100 shadow-lg backdrop-blur-sm"
              style={{ borderColor: person.badgeColor }}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: person.badgeColor }}
              />
              {person.name} · <span className="text-slate-300">{person.title}</span>
            </div>
          ) : (
            <div
              className="pointer-events-none h-2.5 w-2.5 rounded-full border border-white/60 shadow-md"
              style={{ backgroundColor: person.badgeColor }}
            />
          )}
        </Html>
      )}
    </group>
  );
}

export function OfficeExtrasStaff({
  activeFloor,
  showLabels,
  isSimulationRunning,
}: {
  activeFloor: FloorView;
  showLabels: boolean;
  isSimulationRunning: boolean;
}) {
  const showL3 =
    activeFloor === "all" || activeFloor === "l3" || activeFloor === "roof";

  const visible = EXTRA_STAFF.filter((p) =>
    p.floor === 1 ? true : showL3
  );

  return (
    <group>
      {visible.map((person, idx) => (
        <StaffFigure
          key={person.id}
          person={person}
          index={idx}
          showLabels={showLabels}
          isSimulationRunning={isSimulationRunning}
        />
      ))}
    </group>
  );
}
