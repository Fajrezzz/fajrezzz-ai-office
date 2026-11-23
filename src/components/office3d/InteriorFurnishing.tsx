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

function PotPlant({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Tatakan + pot keramik (dibuat lebih besar supaya terlihat dari atas) */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.03, 20]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.27, 0.21, 0.46, 20]} />
        <meshStandardMaterial color="#b45309" roughness={0.62} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.475, 0]}>
        <torusGeometry args={[0.265, 0.028, 10, 22]} />
        <meshStandardMaterial color="#92400e" roughness={0.55} />
      </mesh>
      {/* Media tanah */}
      <mesh position={[0, 0.472, 0]}>
        <cylinderGeometry args={[0.245, 0.245, 0.02, 20]} />
        <meshStandardMaterial color="#3b2417" roughness={0.95} />
      </mesh>
      {/* Batang utama */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.36, 8]} />
        <meshStandardMaterial color="#4b3a24" roughness={0.85} />
      </mesh>
      {/* Kanopi daun: banyak bola kecil supaya tidak jadi "bola hijau melayang" */}
      {[
        [0, 0.95, 0, 0.26],
        [0.2, 0.88, 0.08, 0.2],
        [-0.18, 0.9, -0.1, 0.21],
        [0.06, 1.08, -0.16, 0.19],
        [-0.09, 0.84, 0.18, 0.17],
      ].map(([lx, ly, lz, r], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <sphereGeometry args={[r as number, 14, 12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#166534" : "#15803d"}
            roughness={0.86}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Kursi makan/rapat: 4 kaki, dudukan empuk, sandaran miring (menghadap -Z lokal). */
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
      {/* 4 kaki kayu */}
      {[
        [-0.19, -0.17],
        [0.19, -0.17],
        [-0.19, 0.17],
        [0.19, 0.17],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.2, lz]} castShadow>
          <cylinderGeometry args={[0.022, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#4b3a29" roughness={0.6} />
        </mesh>
      ))}
      {/* Dudukan */}
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.09, 0.46]} />
        <meshStandardMaterial color={cushion} roughness={0.82} />
      </mesh>
      {/* Sandaran miring (di belakang +Z) */}
      <mesh position={[0, 0.68, 0.21]} rotation={[0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.46, 0.44, 0.06]} />
        <meshStandardMaterial color={cushion} roughness={0.84} />
      </mesh>
      {/* Penyangga sandaran */}
      {[-0.16, 0.16].map((lx, i) => (
        <mesh key={`post-${i}`} position={[lx, 0.58, 0.2]} castShadow>
          <boxGeometry args={[0.04, 0.3, 0.04]} />
          <meshStandardMaterial color="#4b3a29" roughness={0.62} />
        </mesh>
      ))}
      {/* Sandaran tangan */}
      {[-0.25, 0.25].map((ax, i) => (
        <mesh key={`arm-${i}`} position={[ax, 0.55, 0]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.36]} />
          <meshStandardMaterial color="#3f2f20" roughness={0.6} />
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
  const SEAT = "#3f4a5a";
  const SEAT_LIGHT = "#4b5768";
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Rug position={[0, 0.008, 0.15]} size={[5.0, 3.8]} color="#241d2f" />

      {/* ---------- SOFA 3 dudukan (menghadap -Z) ---------- */}
      <group position={[0, 0, -0.55]}>
        {/* Kaki pendek */}
        {[
          [-1.2, -0.35],
          [1.2, -0.35],
          [-1.2, 0.35],
          [1.2, 0.35],
        ].map(([lx, lz], i) => (
          <mesh key={`sofa-leg-${i}`} position={[lx, 0.12, lz]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.24, 8]} />
            <meshStandardMaterial color="#231a12" roughness={0.6} />
          </mesh>
        ))}
        {/* Rangka dudukan menerus (bukan 3 kotak terpisah) */}
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.75, 0.24, 0.98]} />
          <meshStandardMaterial color="#2b3442" roughness={0.85} />
        </mesh>
        {/* Bantal dudukan: 3 panel rapat dengan garis pemisah tipis */}
        {[-0.9, 0, 0.9].map((sx, i) => (
          <mesh key={`sofa-cushion-${i}`} position={[sx, 0.48, 0]} castShadow>
            <boxGeometry args={[0.87, 0.13, 0.9]} />
            <meshStandardMaterial color={SEAT} roughness={0.88} />
          </mesh>
        ))}
        {/* Sandaran miring dengan 3 bantal punggung */}
        <mesh position={[0, 0.72, 0.44]} rotation={[-0.14, 0, 0]} castShadow>
          <boxGeometry args={[2.78, 0.72, 0.16]} />
          <meshStandardMaterial color={SEAT_LIGHT} roughness={0.86} />
        </mesh>
        {[-0.9, 0, 0.9].map((sx, i) => (
          <mesh
            key={`sofa-back-${i}`}
            position={[sx, 0.74, 0.34]}
            rotation={[-0.14, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.82, 0.56, 0.12]} />
            <meshStandardMaterial color="#556277" roughness={0.9} />
          </mesh>
        ))}
        {/* Sandaran tangan */}
        {[-1.44, 1.44].map((ax, i) => (
          <mesh key={`sofa-arm-${i}`} position={[ax, 0.55, 0]} castShadow>
            <boxGeometry args={[0.16, 0.44, 1.0]} />
            <meshStandardMaterial color="#2b3442" roughness={0.86} />
          </mesh>
        ))}
        {/* Bantal aksen */}
        <mesh position={[-0.75, 0.66, 0.2]} rotation={[-0.2, 0.3, 0.1]} castShadow>
          <boxGeometry args={[0.34, 0.34, 0.12]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
      </group>

      {/* ---------- ARMCHAIR tunggal menghadap sofa ---------- */}
      <group position={[-1.95, 0, 1.15]} rotation={[0, 0.7, 0]}>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.26, 0.8]} />
          <meshStandardMaterial color="#2b3442" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.49, 0]} castShadow>
          <boxGeometry args={[0.74, 0.12, 0.74]} />
          <meshStandardMaterial color={SEAT} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.74, 0.36]} rotation={[-0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.78, 0.6, 0.14]} />
          <meshStandardMaterial color={SEAT_LIGHT} roughness={0.88} />
        </mesh>
        {[-0.42, 0.42].map((ax, i) => (
          <mesh key={`ac-arm-${i}`} position={[ax, 0.56, 0]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.78]} />
            <meshStandardMaterial color="#2b3442" roughness={0.86} />
          </mesh>
        ))}
      </group>

      {/* ---------- Meja kopi ---------- */}
      <group position={[0.15, 0, 0.95]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.45, 0.07, 0.78]} />
          <meshStandardMaterial color={WOOD} roughness={0.5} />
        </mesh>
        {[
          [-0.55, -0.28],
          [0.55, -0.28],
          [-0.55, 0.28],
          [0.55, 0.28],
        ].map(([lx, lz], i) => (
          <mesh key={`ct-leg-${i}`} position={[lx, 0.2, lz]}>
            <boxGeometry args={[0.06, 0.4, 0.06]} />
            <meshStandardMaterial color={DARK_STEEL} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[-0.28, 0.455, 0.02]} rotation={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.32, 0.025, 0.24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0.3, 0.47, -0.05]} castShadow>
          <cylinderGeometry args={[0.048, 0.042, 0.1, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.28} />
        </mesh>
      </group>

      {/* ---------- Lampu lantai ---------- */}
      <group position={[2.15, 0, 0.55]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.19, 0.21, 0.04, 16]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 1.7, 10]} />
          <meshStandardMaterial color={DARK_STEEL} metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.16, 16, 14]} />
          <meshStandardMaterial
            color="#fff5db"
            emissive={accent}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Tanaman di sudut (menempel dinding, bukan di tengah ruangan) */}
      <PotPlant position={[2.05, 0, -1.45]} scale={1.15} />
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
      <PotPlant position={[1.5, 0, 0.2]} scale={0.85} />
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
