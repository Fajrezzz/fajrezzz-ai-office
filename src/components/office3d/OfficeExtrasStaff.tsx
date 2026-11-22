"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_1_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";
import type { FloorView } from "@/types/office";

interface SeatedOrStandingPerson {
  id: string;
  name: string;
  title: string;
  floor: 1 | 3;
  position: [number, number, number];
  rotationY: number;
  pose: "seated" | "standing";
  suitColor: string;
  shirtColor: string;
  tieColor?: string;
  skinColor: string;
  hairColor: string;
  badgeColor: string;
  hasLaptop?: boolean;
}

const EXTRA_STAFF: SeatedOrStandingPerson[] = [
  // ================= LANTAI 3 — ORANG-ORANG PENTING (CEO, MANAJER, SEKRETARIS, CFO) =================
  {
    id: "vip-ceo",
    name: "Hendra Wijaya",
    title: "CEO Eksekutif",
    floor: 3,
    position: [7.4, FLOOR_3_Y, -5.05],
    rotationY: 0,
    pose: "seated",
    suitColor: "#0f172a",
    shirtColor: "#ffffff",
    tieColor: "#eab308",
    skinColor: "#d6a482",
    hairColor: "#1e293b",
    badgeColor: "#eab308",
  },
  {
    id: "vip-manager",
    name: "Bagas Prakoso",
    title: "Manajer Senior",
    floor: 3,
    position: [-4.5, FLOOR_3_Y, -4.92],
    rotationY: 0,
    pose: "seated",
    suitColor: "#1e3a5f",
    shirtColor: "#f8fafc",
    tieColor: "#38bdf8",
    skinColor: "#cfa07e",
    hairColor: "#18181b",
    badgeColor: "#38bdf8",
  },
  {
    id: "vip-secretary",
    name: "Putri Larasati",
    title: "Sekretaris Eksekutif",
    floor: 3,
    position: [-2.7, FLOOR_3_Y, -4.92],
    rotationY: 0,
    pose: "seated",
    suitColor: "#7f1d1d",
    shirtColor: "#fffbeb",
    skinColor: "#ebc2a4",
    hairColor: "#2a1b14",
    badgeColor: "#f472b6",
  },
  {
    id: "vip-cfo",
    name: "Arman Santika",
    title: "Direktur Keuangan",
    floor: 3,
    position: [-6.3, FLOOR_3_Y, -2.06],
    rotationY: Math.PI,
    pose: "seated",
    suitColor: "#27272a",
    shirtColor: "#f1f5f9",
    tieColor: "#10b981",
    skinColor: "#c89572",
    hairColor: "#1c1917",
    badgeColor: "#10b981",
  },

  // ================= LANTAI 1 — RESEPSIONIS & KARYAWAN DI KURSI LOUNGE KOSONG =================
  {
    id: "l1-recep-1",
    name: "Nabila Sari",
    title: "Resepsionis L1",
    floor: 1,
    position: [-1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#1e293b",
    shirtColor: "#fdf2f8",
    skinColor: "#ebc0a2",
    hairColor: "#271811",
    badgeColor: "#06b6d4",
  },
  {
    id: "l1-recep-2",
    name: "Arif Hidayat",
    title: "Admin Lobby L1",
    floor: 1,
    position: [1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#1f2937",
    shirtColor: "#e0f2fe",
    tieColor: "#0284c7",
    skinColor: "#d3a17e",
    hairColor: "#171717",
    badgeColor: "#0ea5e9",
  },
  {
    id: "l1-sofa-w1",
    name: "Dina Oktavia",
    title: "Staf CS L1",
    floor: 1,
    position: [-9.2, FLOOR_1_Y, -2.7],
    rotationY: 0.14,
    pose: "seated",
    suitColor: "#312e81",
    shirtColor: "#f8fafc",
    skinColor: "#e8bc9d",
    hairColor: "#3a2216",
    badgeColor: "#8b5cf6",
    hasLaptop: true,
  },
  {
    id: "l1-sofa-w2",
    name: "Gilang Ramadhan",
    title: "Staf Admin L1",
    floor: 1,
    position: [-7.55, FLOOR_1_Y, -2.7],
    rotationY: -0.18,
    pose: "seated",
    suitColor: "#1e3a5f",
    shirtColor: "#f0f9ff",
    skinColor: "#cd9c7a",
    hairColor: "#18181b",
    badgeColor: "#38bdf8",
  },
  {
    id: "l1-sofa-e1",
    name: "Maya Kusuma",
    title: "Staf Kreatif L1",
    floor: 1,
    position: [7.55, FLOOR_1_Y, -2.7],
    rotationY: 0.18,
    pose: "seated",
    suitColor: "#134e4a",
    shirtColor: "#f0fdfa",
    skinColor: "#e4b797",
    hairColor: "#24160f",
    badgeColor: "#14b8a6",
    hasLaptop: true,
  },
  {
    id: "l1-sofa-e2",
    name: "Hendra Saputra",
    title: "Staf Media L1",
    floor: 1,
    position: [9.2, FLOOR_1_Y, -2.7],
    rotationY: -0.14,
    pose: "seated",
    suitColor: "#374151",
    shirtColor: "#fef3c7",
    skinColor: "#d19e7a",
    hairColor: "#1c1917",
    badgeColor: "#f59e0b",
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

  useFrame((state) => {
    if (!isSimulationRunning) return;
    const t = state.clock.elapsedTime + index * 1.3;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.9) * 0.22;
      headRef.current.rotation.x = Math.sin(t * 0.6) * 0.06;
    }
    if (leftArmRef.current && rightArmRef.current) {
      const typing = Math.sin(t * 5.2) * 0.08;
      leftArmRef.current.rotation.x = -0.82 + typing;
      rightArmRef.current.rotation.x = -0.82 - typing;
    }
  });

  const isSeated = person.pose === "seated";
  const torsoY = isSeated ? 0.86 : 1.14;
  const headY = isSeated ? 1.28 : 1.56;

  return (
    <group position={person.position} rotation={[0, person.rotationY, 0]}>
      {/* Legs */}
      {isSeated ? (
        <group>
          {/* Seated thighs forward */}
          <mesh position={[-0.12, 0.52, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.32, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.12, 0.52, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.32, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Seated lower shins down to floor */}
          <mesh position={[-0.12, 0.26, 0.36]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.12, 0.26, 0.36]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[-0.11, 0.44, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.62, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0.44, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.62, 6, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Suit Torso + Crisp Shirt Collar + Optional Executive Tie */}
      <mesh position={[0, torsoY, 0]} castShadow>
        <boxGeometry args={[0.42, 0.52, 0.24]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.72} />
      </mesh>
      <mesh position={[0, torsoY + 0.12, 0.125]}>
        <boxGeometry args={[0.13, 0.24, 0.02]} />
        <meshStandardMaterial color={person.shirtColor} roughness={0.6} />
      </mesh>
      {person.tieColor && (
        <mesh position={[0, torsoY + 0.04, 0.138]}>
          <boxGeometry args={[0.045, 0.26, 0.015]} />
          <meshStandardMaterial color={person.tieColor} roughness={0.45} />
        </mesh>
      )}

      {/* Animated Arms (typing / presenting) */}
      <mesh
        ref={leftArmRef}
        position={[-0.27, torsoY + 0.06, 0.12]}
        rotation={[-0.82, 0, 0.12]}
        castShadow
      >
        <capsuleGeometry args={[0.058, 0.38, 6, 8]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.75} />
      </mesh>
      <mesh
        ref={rightArmRef}
        position={[0.27, torsoY + 0.06, 0.12]}
        rotation={[-0.82, 0, -0.12]}
        castShadow
      >
        <capsuleGeometry args={[0.058, 0.38, 6, 8]} />
        <meshStandardMaterial color={person.suitColor} roughness={0.75} />
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

      {/* Animated Head & Hair */}
      <group ref={headRef} position={[0, headY, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.155, 14, 12]} />
          <meshStandardMaterial color={person.skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, -0.02]}>
          <sphereGeometry args={[0.162, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color={person.hairColor} roughness={0.85} />
        </mesh>
      </group>

      {/* Clean Floating Name & Executive Title Pill */}
      {showLabels && (
        <Html position={[0, headY + 0.42, 0]} center distanceFactor={22}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-slate-700/80 bg-slate-950/85 px-2 py-0.5 text-[9px] font-bold text-slate-100 shadow-lg backdrop-blur-sm">
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ backgroundColor: person.badgeColor }}
            />
            {person.title}
          </div>
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
