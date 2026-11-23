"use client";

import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  RealisticHumanAvatar,
  type HumanAvatarVariant,
} from "@/components/office3d/RealisticHumanAvatar";
import { FLOOR_1_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";
import type { FloorView } from "@/types/office";

interface SeatedOrStandingPerson {
  id: string;
  name: string;
  title: string;
  gender: "male" | "female";
  variant: HumanAvatarVariant;
  keepOriginalOutfit?: boolean;
  showHeadwear?: boolean;
  hasGlasses?: boolean;
  hasHijab?: boolean;
  hasNeckHeadphones?: boolean;
  tieColor?: string;
  fajrezzzBadgeColor?: string;
  hairColor: string;
  floor: 1 | 3;
  position: [number, number, number];
  rotationY: number;
  pose: "seated" | "standing";
  suitColor: string;
  pantsColor?: string;
  badgeColor: string;
  hasLaptop?: boolean;
}

/**
 * 12 Executive, Security, Reception & Lobby Staff — styled individually after the
 * Fajrezzz "Our Team · 22 Amazing People (13 Men · 9 Women)" team portrait.
 */
const EXTRA_STAFF: SeatedOrStandingPerson[] = [
  // ================= LANTAI 3 — EKSEKUTIF FAJREZZZ (VRoid Anime Style) =================
  {
    id: "vip-ceo",
    name: "Hendra Wijaya",
    title: "CEO Eksekutif",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#12141c",
    floor: 3,
    position: [7.4, FLOOR_3_Y, -5.22],
    rotationY: 0,
    pose: "seated",
    suitColor: "#141824",
    pantsColor: "#0e121b",
    tieColor: "#1e3a8a",
    hasGlasses: true,
    fajrezzzBadgeColor: "#a855f7",
    badgeColor: "#8b5cf6",
  },
  {
    id: "vip-manager",
    name: "Bagas Prakoso",
    title: "Manajer Senior",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#171822",
    floor: 3,
    // Duduk di kursi boardroom asli (bukan mengambang di lantai kosong)
    position: [11.2, FLOOR_3_Y, -5.02],
    rotationY: 0,
    pose: "seated",
    suitColor: "#1e3a5f",
    pantsColor: "#111827",
    tieColor: "#38bdf8",
    hasGlasses: true,
    badgeColor: "#38bdf8",
  },
  {
    id: "vip-secretary",
    name: "Putri Larasati",
    title: "Sekretaris Eksekutif",
    gender: "female",
    variant: "vroid_female",
    hairColor: "#241916",
    floor: 3,
    // Kursi boardroom sisi timur, menghadap meja (+Z)
    position: [14.8, FLOOR_3_Y, -5.02],
    rotationY: 0,
    pose: "seated",
    suitColor: "#f8fafc",
    pantsColor: "#181a24",
    fajrezzzBadgeColor: "#8b5cf6",
    badgeColor: "#a78bfa",
  },
  {
    id: "vip-cfo",
    name: "Arman Santika",
    title: "Direktur Keuangan",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#1b1920",
    floor: 3,
    // Kursi boardroom sisi selatan, menghadap meja (-Z)
    position: [13.0, FLOOR_3_Y, -1.98],
    rotationY: Math.PI,
    pose: "seated",
    suitColor: "#1f2436",
    pantsColor: "#14161f",
    hasGlasses: true,
    fajrezzzBadgeColor: "#6366f1",
    badgeColor: "#8b5cf6",
  },

  // ================= LANTAI 1 — SECURITY, RESEPSIONIS & TIM FAJREZZZ LOBBY =================
  {
    id: "l1-security-1",
    name: "Bambang Suryo",
    title: "Security Pintu Utama",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#121318",
    floor: 1,
    position: [-3.8, FLOOR_1_Y, 4.5],
    rotationY: 0,
    pose: "standing",
    suitColor: "#0f2442",
    pantsColor: "#0c1526",
    tieColor: "#0f172a",
    badgeColor: "#00f0ff",
  },
  {
    id: "l1-security-2",
    name: "Hendro Wibowo",
    title: "Security Lobby",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#18171c",
    floor: 1,
    position: [3.8, FLOOR_1_Y, 4.5],
    rotationY: 0,
    pose: "standing",
    suitColor: "#132a4f",
    pantsColor: "#0c1526",
    tieColor: "#0f172a",
    badgeColor: "#00f0ff",
  },
  {
    id: "l1-recep-1",
    name: "Nabila Sari",
    title: "Resepsionis L1",
    gender: "female",
    variant: "vroid_female",
    hairColor: "#261813",
    floor: 1,
    position: [-1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#f8fafc",
    pantsColor: "#161924",
    hasGlasses: true,
    fajrezzzBadgeColor: "#8b5cf6",
    badgeColor: "#a855f7",
  },
  {
    id: "l1-recep-2",
    name: "Arif Hidayat",
    title: "Admin Lobby L1",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#14151c",
    floor: 1,
    position: [1.1, FLOOR_1_Y, -6.22],
    rotationY: 0,
    pose: "standing",
    suitColor: "#eef2f6",
    pantsColor: "#141824",
    tieColor: "#1e3a8a",
    fajrezzzBadgeColor: "#6366f1",
    badgeColor: "#38bdf8",
  },
  {
    id: "l1-sofa-w1",
    name: "Dina Oktavia",
    title: "Staf CS L1",
    gender: "female",
    variant: "vroid_female",
    hairColor: "#543222",
    floor: 1,
    position: [-9.2, FLOOR_1_Y, -2.7],
    rotationY: 0.14,
    pose: "seated",
    suitColor: "#181a24",
    pantsColor: "#334155",
    fajrezzzBadgeColor: "#8b5cf6",
    badgeColor: "#8b5cf6",
    hasLaptop: true,
  },
  {
    id: "l1-sofa-w2",
    name: "Gilang Ramadhan",
    title: "Staf Admin L1",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#15151d",
    floor: 1,
    position: [-7.55, FLOOR_1_Y, -2.7],
    rotationY: -0.18,
    pose: "seated",
    suitColor: "#2e1065",
    pantsColor: "#111827",
    hasNeckHeadphones: true,
    fajrezzzBadgeColor: "#a855f7",
    badgeColor: "#a855f7",
  },
  {
    id: "l1-sofa-e1",
    name: "Maya Kusuma",
    title: "Staf Kreatif L1",
    gender: "female",
    variant: "vroid_female",
    hairColor: "#2c1b14",
    floor: 1,
    position: [7.55, FLOOR_1_Y, -2.7],
    rotationY: 0.18,
    pose: "seated",
    suitColor: "#8b5cf6",
    pantsColor: "#181a24",
    hasGlasses: true,
    fajrezzzBadgeColor: "#c4b5fd",
    badgeColor: "#c084fc",
    hasLaptop: true,
  },
  {
    id: "l1-sofa-e2",
    name: "Hendra Saputra",
    title: "Staf Media L1",
    gender: "male",
    variant: "vroid_male",
    hairColor: "#16161e",
    floor: 1,
    position: [9.2, FLOOR_1_Y, -2.7],
    rotationY: -0.14,
    pose: "seated",
    suitColor: "#2563eb",
    pantsColor: "#0f172a",
    fajrezzzBadgeColor: "#38bdf8",
    badgeColor: "#38bdf8",
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
  const [labelTier, setLabelTier] = useState<"near" | "mid" | "far">("mid");
  const tierRef = useRef<"near" | "mid" | "far">("mid");
  const accumRef = useRef(0);
  const worldPos = useMemo(
    () => new THREE.Vector3(...person.position),
    [person.position]
  );

  useFrame((state, delta) => {
    accumRef.current += Math.min(delta, 0.05);
    if (accumRef.current > 0.22) {
      accumRef.current = 0;
      const dist = state.camera.position.distanceTo(worldPos);
      const next: "near" | "mid" | "far" =
        dist < 17 ? "near" : dist < 42 ? "mid" : "far";
      if (next !== tierRef.current) {
        tierRef.current = next;
        setLabelTier(next);
      }
    }
  });

  const isSeated = person.pose === "seated";
  const labelY = isSeated ? 1.62 : 1.96;

  return (
    <group position={person.position} rotation={[0, person.rotationY, 0]}>
      <RealisticHumanAvatar
        variant={person.variant}
        pose={isSeated ? (person.hasLaptop ? "typing" : "seated") : "idle"}
        topColor={person.suitColor}
        pantsColor={person.pantsColor ?? "#111827"}
        hairColor={person.hairColor}
        keepOriginalOutfit={person.keepOriginalOutfit}
        showHeadwear={person.showHeadwear}
        hasGlasses={person.hasGlasses}
        hasHijab={person.hasHijab}
        hasNeckHeadphones={person.hasNeckHeadphones}
        tieColor={person.tieColor}
        fajrezzzBadgeColor={person.fajrezzzBadgeColor}
        targetHeight={
          person.id === "vip-ceo"
            ? 1.78
            : person.gender === "female"
            ? 1.65
            : 1.74
        }
        phaseOffset={index * 1.13}
        isSimulationRunning={isSimulationRunning}
      />

      {isSeated && person.hasLaptop && (
        <group position={[0, 0.64, 0.34]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.016, 0.22]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.1, -0.095]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.31, 0.2, 0.012]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, -0.087]} rotation={[-0.25, 0, 0]}>
            <planeGeometry args={[0.28, 0.17]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#00f0ff"
              emissiveIntensity={0.85}
            />
          </mesh>
        </group>
      )}

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 20]} />
        <meshBasicMaterial color={person.badgeColor} transparent opacity={0.36} />
      </mesh>

      {showLabels && labelTier !== "far" && (
        <Html
          position={[0, labelY + (index % 2) * 0.08, 0]}
          center
          distanceFactor={13}
        >
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

  const visible = EXTRA_STAFF.filter((p) => (p.floor === 1 ? true : showL3));

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
