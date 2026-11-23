"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FLOOR_1_Y } from "@/lib/data/initial-office-data";

/**
 * Panel RGB fasad depan — versi terang.
 * Bos: "bagian depan kantor kurang terang untuk lampu RGB-nya".
 * Sekarang: strip lebih tebal, tersegmentasi (efek chase), emissive tinggi +
 * glow halo additive, dan tetap menyala siang hari.
 */
const FACADE_BANDS = [
  { y: 3.88, hue: 0.52 }, // cyan
  { y: 7.78, hue: 0.75 }, // violet
  { y: 11.98, hue: 0.9 }, // magenta
];
const FACADE_SEGMENTS = 18;
const FACADE_WIDTH = 38.2;

/**
 * Clean Nanverse-Style Architectural Edge Lighting & L1 East Wellness Wing:
 * - Warm champagne-gold & architectural white building edge lighting (0 extra lights)
 * - L1 West/Center: Open Grand Main Lobby
 * - L1 East Wing (X=+14.2): Racing Simulator saja (v9.4 — area kebugaran dihapus)
 * - L3 East Wing: Kept clean & spacious (Billiard table & blue cinema screen removed)
 * - Rooftop: Clean unobstructed deck (Pergola seating removed)
 */
function FacadeRgbLighting({ isNight }: { isNight: boolean }) {
  const segmentMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const haloMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const colorTmp = useMemo(() => new THREE.Color(), []);
  const segWidth = FACADE_WIDTH / FACADE_SEGMENTS;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const intensity = isNight ? 3.4 : 1.15;

    for (let bi = 0; bi < FACADE_BANDS.length; bi += 1) {
      for (let si = 0; si < FACADE_SEGMENTS; si += 1) {
        const idx = bi * FACADE_SEGMENTS + si;
        // chase halus: gelombang hue berjalan dari kiri ke kanan
        const hue =
          (FACADE_BANDS[bi].hue + si * 0.028 + t * 0.06) % 1;
        colorTmp.setHSL(hue, 0.98, 0.58);

        const mat = segmentMats.current[idx];
        if (mat) {
          mat.color.copy(colorTmp);
          mat.emissive.copy(colorTmp);
          mat.emissiveIntensity = intensity * (0.82 + 0.18 * Math.sin(t * 2.4 + si * 0.5));
        }
        const halo = haloMats.current[idx];
        if (halo) {
          halo.color.copy(colorTmp);
          halo.opacity = (isNight ? 0.34 : 0.16) * (0.75 + 0.25 * Math.sin(t * 2 + si * 0.4));
        }
      }
    }
  });

  return (
    <group>
      {FACADE_BANDS.map((band, bi) => (
        <group key={`facade-band-${bi}`} position={[0, band.y, 0]}>
          {/* Strip utama tersegmentasi di fasad depan (Z = +4.14) */}
          {Array.from({ length: FACADE_SEGMENTS }).map((_, si) => {
            const idx = bi * FACADE_SEGMENTS + si;
            return (
              <mesh
                key={`seg-${si}`}
                position={[-FACADE_WIDTH / 2 + segWidth * (si + 0.5), 0, 4.14]}
              >
                <boxGeometry args={[segWidth - 0.06, 0.17, 0.17]} />
                <meshStandardMaterial
                  ref={(m) => {
                    segmentMats.current[idx] = m;
                  }}
                  color="#cffafe"
                  emissive="#00f0ff"
                  emissiveIntensity={isNight ? 3.4 : 1.15}
                  toneMapped={false}
                />
              </mesh>
            );
          })}

          {/* Halo glow (additive) supaya fasad benar-benar "menyala" dari jauh */}
          {Array.from({ length: FACADE_SEGMENTS }).map((_, si) => {
            const idx = bi * FACADE_SEGMENTS + si;
            return (
              <mesh
                key={`halo-${si}`}
                position={[-FACADE_WIDTH / 2 + segWidth * (si + 0.5), 0, 4.24]}
              >
                <planeGeometry args={[segWidth + 0.5, 1.05]} />
                <meshBasicMaterial
                  ref={(m) => {
                    haloMats.current[idx] = m;
                  }}
                  color="#00f0ff"
                  transparent
                  opacity={isNight ? 0.34 : 0.16}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            );
          })}

          {/* Strip samping kiri/kanan gedung */}
          {[-19.1, 19.1].map((sx, si) => (
            <mesh key={`side-${si}`} position={[sx, 0, -3.0]}>
              <boxGeometry args={[0.12, 0.12, 14.2]} />
              <meshStandardMaterial
                color="#cffafe"
                emissive={bi === 0 ? "#00f0ff" : bi === 1 ? "#a855f7" : "#ec4899"}
                emissiveIntensity={isNight ? 2.6 : 0.95}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Wash lampu RGB ke dinding fasad (bukan cuma garis) */}
      {[-11, 0, 11].map((lx, i) => (
        <pointLight
          key={`wash-${i}`}
          position={[lx, 6.2, 5.4]}
          color={i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a855f7" : "#ec4899"}
          intensity={isNight ? 26 : 5}
          distance={14}
          decay={2}
        />
      ))}
    </group>
  );
}

export function InteriorActivityRooms({
  showL1,
  showRoof,
  isNight,
}: {
  showL1: boolean;
  showL3: boolean;
  showRoof: boolean;
  isNight: boolean;
}) {
  return (
    <group>
      {/* ===================== RGB FACADE DEPAN (TERANG) ===================== */}
      {showRoof && <FacadeRgbLighting isNight={isNight} />}

      {/*
       * L1 EAST WING (X=+14.2): ARCADE & RACING SIMULATOR
       * v9.4 — Bos minta seluruh alat latihan beban DIHAPUS TOTAL.
       * Yang tersisa hanya rig simulator balap, sekarang diletakkan di tengah
       * sayap supaya tidak terlihat seperti sisa furnitur yang menggantung.
       */}
      {showL1 && (
        <group position={[14.2, FLOOR_1_Y, -4.2]}>
          {/* Platform rig — semua komponen menapak di lantai, tidak melayang */}
          <mesh position={[0, 0.05, 0.9]} receiveShadow>
            <boxGeometry args={[1.9, 0.1, 2.6]} />
            <meshStandardMaterial color="#161b23" roughness={0.72} metalness={0.18} />
          </mesh>
          {/* F1 Racing Simulator Cockpit (menghadap -Z ke layar) */}
          <group position={[0, 0, 0.9]}>
            {/* Rangka dudukan */}
            <mesh position={[0, 0.26, 0.15]} castShadow>
              <boxGeometry args={[0.78, 0.24, 1.45]} />
              <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.3} />
            </mesh>
            {/* Bantalan duduk */}
            <mesh position={[0, 0.42, 0.3]} castShadow>
              <boxGeometry args={[0.6, 0.14, 0.66]} />
              <meshStandardMaterial color="#dc2626" roughness={0.62} />
            </mesh>
            {/* Sandaran + headrest (menempel ke rangka, tidak menggantung) */}
            <mesh position={[0, 0.72, 0.68]} rotation={[-0.22, 0, 0]} castShadow>
              <boxGeometry args={[0.6, 0.64, 0.14]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.02, 0.76]} rotation={[-0.22, 0, 0]} castShadow>
              <boxGeometry args={[0.38, 0.2, 0.12]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.66} />
            </mesh>
            {/* Kolom setir + roda setir */}
            <mesh position={[0, 0.5, -0.3]} rotation={[0.62, 0, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.045, 0.6, 10]} />
              <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.66, -0.52]} rotation={[-0.62, 0, 0]}>
              <torusGeometry args={[0.17, 0.028, 10, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
            {/* Pedal box */}
            <mesh position={[0, 0.16, -0.5]} castShadow>
              <boxGeometry args={[0.46, 0.12, 0.34]} />
              <meshStandardMaterial color="#1b2430" metalness={0.5} roughness={0.45} />
            </mesh>
            {[-0.11, 0.11].map((px2, pi) => (
              <mesh key={`pedal-${pi}`} position={[px2, 0.24, -0.55]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.12, 0.03, 0.2]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.25} />
              </mesh>
            ))}
            {/* Triple-monitor rig */}
            {[-0.62, 0, 0.62].map((mx, mi) => (
              <mesh
                key={`sim-screen-${mi}`}
                position={[mx, 0.95, -0.95 - Math.abs(mx) * 0.12]}
                rotation={[0, -mx * 0.32, 0]}
              >
                <boxGeometry args={[0.62, 1.02, 0.05]} />
                <meshStandardMaterial
                  color="#0b1220"
                  emissive="#38bdf8"
                  emissiveIntensity={isNight ? 1.15 : 0.42}
                  roughness={0.3}
                />
              </mesh>
            ))}
            {[-0.9, 0.9].map((px2, pi) => (
              <mesh key={`sim-post-${pi}`} position={[px2, 0.5, -0.95]} castShadow>
                <boxGeometry args={[0.06, 1.0, 0.06]} />
                <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.35} />
              </mesh>
            ))}
          </group>
          {/* Cyberpunk Cyan Ceiling Neon Bar */}
          <mesh position={[0.4, 3.25, 0]}>
            <boxGeometry args={[4.8, 0.055, 0.08]} />
            <meshStandardMaterial
              color="#cffafe"
              emissive="#00f0ff"
              emissiveIntensity={isNight ? 2.0 : 0.45}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
