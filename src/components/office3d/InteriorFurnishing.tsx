"use client";

import React, { useMemo } from "react";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import { FLOOR_2_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";
import {
  FLOOR_THREE_FURNITURE,
  FLOOR_TWO_FURNITURE,
  type FurniturePlacement,
} from "@/lib/office3d/interior-layout";

/**
 * INTERIOR FURNISHING — pengisi area kosong L2 & L3.
 *
 * Keluhan Bos: "lantai 2 masih ada yang kosong bagian kanan dan kiri, penuhin aja"
 * dan "lantai 3 banyak ruang kosong / ada yang duduk tanpa kursi".
 *
 * Semua furnitur di sini punya kursi ASLI di posisi yang sama dengan waypoint duduk,
 * jadi avatar tidak pernah lagi duduk melayang di lantai kosong.
 */

type Vec3 = [number, number, number];

const WOOD = "#8a6a4a";
const DARK_STEEL = "#1f2530";
const CUSHION = "#4a5b6b";
const CUSHION_ALT = "#5c4033";

function Rug({ position, size, color }: { position: Vec3; size: [number, number]; color: string }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[size[0], 0.014, size[1]]} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}

function PotPlant({ position, height = 1.05 }: { position: Vec3; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.21, 0.16, 0.4, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, height * 0.62, 0]} castShadow>
        <sphereGeometry args={[0.36, 16, 14]} />
        <meshStandardMaterial color="#166534" roughness={0.86} />
      </mesh>
      {[
        [0.22, height * 0.5, 0.1, 0.6],
        [-0.2, height * 0.46, -0.12, -0.5],
        [0.05, height * 0.82, -0.18, 0.3],
      ].map(([lx, ly, lz, rot], i) => (
        <mesh key={i} position={[lx, ly, lz]} rotation={[0.4, rot, 0.25]} castShadow>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#15803d" : "#22c55e"} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** Kursi kantor sederhana dengan sandaran di belakang (+Z lokal) → penghuni menghadap -Z. */
function SimpleChair({
  position,
  rotationY = 0,
  cushion = CUSHION,
}: {
  position: Vec3;
  rotationY?: number;
  cushion?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.05, 12]} />
        <meshStandardMaterial color={DARK_STEEL} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.2, 10]} />
        <meshStandardMaterial color={DARK_STEEL} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.5, 0.09, 0.48]} />
        <meshStandardMaterial color={cushion} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.73, 0.21]} castShadow>
        <boxGeometry args={[0.5, 0.46, 0.08]} />
        <meshStandardMaterial color={cushion} roughness={0.82} />
      </mesh>
      {[-0.27, 0.27].map((ax, i) => (
        <mesh key={i} position={[ax, 0.6, 0]}>
          <boxGeometry args={[0.06, 0.09, 0.42]} />
          <meshStandardMaterial color="#2b3542" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Pod kolaborasi 4 orang: meja bundar + 4 kursi asli + laptop + cangkir + tanaman.
 * `seats` bisa dipakai agent sebagai titik duduk (world space).
 */
export function HuddlePod({
  position,
  accent = "#0ea5e9",
  withLaptop = true,
}: {
  position: Vec3;
  accent?: string;
  withLaptop?: boolean;
}) {
  const textures = useMemo(() => getRealisticTextures(), []);
  return (
    <group position={position}>
      <Rug position={[0, 0.008, 0]} size={[3.4, 3.4]} color="#1b2733" />

      {/* Meja bundar */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.06, 26]} />
        <meshStandardMaterial map={textures.marbleTile} color="#f1f5f9" roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.72, 14]} />
        <meshStandardMaterial color={DARK_STEEL} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.04, 22]} />
        <meshStandardMaterial color={DARK_STEEL} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Accent ring neon di tepi meja */}
      <mesh position={[0, 0.745, 0]}>
        <torusGeometry args={[0.7, 0.012, 8, 40]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.25} toneMapped={false} />
      </mesh>

      {withLaptop && (
        <group position={[-0.2, 0.75, 0]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.008, 0]} castShadow>
            <boxGeometry args={[0.36, 0.012, 0.26]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, -0.13]} rotation={[-1.1, 0, 0]}>
            <boxGeometry args={[0.36, 0.24, 0.012]} />
            <meshStandardMaterial
              color="#0b1220"
              emissive="#22d3ee"
              emissiveIntensity={0.55}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}

      {/* Cangkir kopi & buku */}
      {[
        [0.34, 0.12],
        [0.18, -0.36],
      ].map(([cz, cx], i) => (
        <mesh key={i} position={[cx, 0.79, cz]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.1, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0.36, 0.765, -0.1]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.26, 0.03, 0.2]} />
        <meshStandardMaterial color="#e11d48" roughness={0.75} />
      </mesh>

      {/* Tanaman kecil di tengah meja */}
      <group position={[0.02, 0.75, 0.3]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#15803d" roughness={0.85} />
        </mesh>
      </group>

      {/* 4 kursi (sandaran di belakang → duduk menghadap meja) */}
      <SimpleChair position={[0, 0, -1.05]} rotationY={Math.PI} cushion={CUSHION} />
      <SimpleChair position={[0, 0, 1.05]} rotationY={0} cushion={CUSHION} />
      <SimpleChair position={[-1.05, 0, 0]} rotationY={Math.PI / 2} cushion={CUSHION_ALT} />
      <SimpleChair position={[1.05, 0, 0]} rotationY={-Math.PI / 2} cushion={CUSHION_ALT} />
    </group>
  );
}

/** Sofa lounge + meja kopi + lampu lantai + tanaman besar. */
export function LoungeSofaSet({
  position,
  rotationY = 0,
  accent = "#a855f7",
}: {
  position: Vec3;
  rotationY?: number;
  accent?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Rug position={[0, 0.008, 0.2]} size={[4.6, 3.6]} color="#221a2c" />

      {/* Sofa 3 dudukan (menghadap -Z) */}
      <group position={[0, 0, -0.6]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 0.22, 0.95]} />
          <meshStandardMaterial color="#3b4453" roughness={0.86} />
        </mesh>
        {[-0.9, 0, 0.9].map((sx, i) => (
          <mesh key={i} position={[sx, 0.58, 0]} castShadow>
            <boxGeometry args={[0.82, 0.16, 0.82]} />
            <meshStandardMaterial color="#4b5563" roughness={0.88} />
          </mesh>
        ))}
        <mesh position={[0, 0.78, 0.4]} castShadow>
          <boxGeometry args={[2.7, 0.62, 0.18]} />
          <meshStandardMaterial color="#374151" roughness={0.88} />
        </mesh>
        {[-1.42, 1.42].map((ax, i) => (
          <mesh key={i} position={[ax, 0.62, 0]} castShadow>
            <boxGeometry args={[0.18, 0.5, 0.95]} />
            <meshStandardMaterial color="#374151" roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* Meja kopi + majalah + cangkir */}
      <group position={[0, 0, 0.85]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.08, 0.8]} />
          <meshStandardMaterial color={WOOD} roughness={0.5} />
        </mesh>
        {[-0.6, 0.6].map((lx, i) => (
          <mesh key={i} position={[lx, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
            <meshStandardMaterial color={DARK_STEEL} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[-0.25, 0.455, 0.02]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.34, 0.026, 0.26]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0.34, 0.47, -0.04]} castShadow>
          <cylinderGeometry args={[0.05, 0.044, 0.1, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.28} />
        </mesh>
      </group>

      {/* Lampu lantai dengan bola emissive */}
      <group position={[2.05, 0, -0.35]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.04, 16]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 1.7, 10]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.17, 16, 14]} />
          <meshStandardMaterial
            color="#fff5db"
            emissive={accent}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      <PotPlant position={[-2.0, 0, 0.55]} />
    </group>
  );
}

/** Papan tulis kaca + sticky notes berwarna (area ide / standup). */
export function WhiteboardUnit({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.5, 0.07]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.22} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.05, 0.045]}>
        <boxGeometry args={[2.44, 1.34, 0.01]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.16} metalness={0.12} />
      </mesh>
      {[
        [-0.75, 1.32, "#fde047"],
        [0.35, 1.18, "#fca5a5"],
        [0.85, 0.78, "#93c5fd"],
      ].map(([sx, sy, color], i) => (
        <mesh key={i} position={[sx as number, sy as number, 0.06]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[0.2, 0.2, 0.006]} />
          <meshStandardMaterial color={color as string} roughness={0.85} />
        </mesh>
      ))}
      {[
        [-0.3, 1.42],
        [0.1, 1.36],
      ].map(([lx, ly], i) => (
        <mesh key={`ink-${i}`} position={[lx, ly, 0.055]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.5, 0.018, 0.004]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      ))}
      {[-1.15, 1.15].map((lx, i) => (
        <mesh key={`leg-${i}`} position={[lx, 0.25, 0]}>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Rak buku + storage box + tanaman kecil. */
export function BookshelfUnit({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  const bookColors = ["#e11d48", "#0ea5e9", "#f59e0b", "#22c55e", "#a855f7", "#f8fafc"];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 0.34]} />
        <meshStandardMaterial color="#3f2d1e" roughness={0.62} />
      </mesh>
      {[0.36, 0.82, 1.28, 1.66].map((sy, si) => (
        <group key={si} position={[0, sy, 0.02]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.08, 0.05, 0.3]} />
            <meshStandardMaterial color="#5a4028" roughness={0.6} />
          </mesh>
          {Array.from({ length: 9 }).map((_, bi) => (
            <mesh
              key={bi}
              position={[-0.92 + bi * 0.2, 0.14, 0]}
              castShadow
            >
              <boxGeometry args={[0.11, 0.24, 0.22]} />
              <meshStandardMaterial
                color={bookColors[(bi + si) % bookColors.length]}
                roughness={0.78}
              />
            </mesh>
          ))}
        </group>
      ))}
      <PotPlant position={[1.55, 0, 0.15]} height={0.8} />
    </group>
  );
}

/** Meja tinggi standup + 2 stool (area meeting cepat). */
export function StandupTable({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.06, 0.75]} />
        <meshStandardMaterial color={WOOD} roughness={0.45} />
      </mesh>
      {[-0.75, 0.75].map((lx, i) => (
        <mesh key={i} position={[lx, 0.52, 0]}>
          <boxGeometry args={[0.07, 1.04, 0.6]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.68} roughness={0.32} />
        </mesh>
      ))}
      {[
        [-0.55, 1.08, 0.02],
        [0.15, 1.08, -0.05],
      ].map(([sx, sy, sz], i) => (
        <mesh key={`lap-${i}`} position={[sx, sy, sz]} rotation={[0, 0.2 * (i + 1), 0]} castShadow>
          <boxGeometry args={[0.32, 0.018, 0.24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.55} roughness={0.3} />
        </mesh>
      ))}
      {[-1.35, 1.35].map((sx, i) => (
        <group key={`stool-${i}`} position={[sx, 0, 0]}>
          <mesh position={[0, 0.68, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.07, 16]} />
            <meshStandardMaterial color="#5c4033" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.68, 10]} />
            <meshStandardMaterial color={DARK_STEEL} metalness={0.72} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.04, 16]} />
            <meshStandardMaterial color={DARK_STEEL} metalness={0.72} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function renderFurniture(
  item: FurniturePlacement,
  index: number,
  y: number
): React.ReactElement | null {
  const [x, z] = item.position;
  const position: Vec3 = [x, y, z];
  const key = `${item.kind}-${item.floor}-${index}`;

  switch (item.kind) {
    case "huddle_pod":
      return (
        <HuddlePod
          key={key}
          position={position}
          accent={index % 2 === 0 ? "#22d3ee" : "#a855f7"}
        />
      );
    case "standup_table":
      return <StandupTable key={key} position={position} rotationY={item.rotationY ?? 0} />;
    case "sofa_lounge":
      return <LoungeSofaSet key={key} position={position} rotationY={item.rotationY ?? 0} />;
    case "whiteboard":
      return <WhiteboardUnit key={key} position={position} rotationY={item.rotationY ?? 0} />;
    case "bookshelf":
      return <BookshelfUnit key={key} position={position} rotationY={item.rotationY ?? 0} />;
    case "planter":
      return <PotPlant key={key} position={position} />;
    case "rug":
      return null; // karpet sudah dirender di dalam masing-masing unit
    default:
      return null;
  }
}

/**
 * Pengisi area kosong LANTAI 2 (kanan & kiri promenade).
 * Tata letak berasal dari `interior-layout.ts` (diuji anti-tabrakan di unit test).
 */
export function FloorTwoFill() {
  return (
    <group>
      {FLOOR_TWO_FURNITURE.map((item, i) =>
        renderFurniture(item, i, FLOOR_2_Y)
      )}
    </group>
  );
}

/**
 * Pengisi area kosong LANTAI 3.
 * Kiri (staff): pod kolaborasi + papan ide. Kanan (meeting + CEO): lounge meeting.
 */
export function FloorThreeFill() {
  return (
    <group>
      {FLOOR_THREE_FURNITURE.map((item, i) =>
        renderFurniture(item, i, FLOOR_3_Y)
      )}
    </group>
  );
}
