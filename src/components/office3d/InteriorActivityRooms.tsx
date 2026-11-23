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
 * - L1 East Wing (X=+14.2): Executive Gym + Racing Simulator
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

      {/* L1 EAST WING (X=+14.2): EXECUTIVE GYM & FITNESS AREA */}
      {showL1 && (
        <group position={[14.2, FLOOR_1_Y, -4.2]}>
          {/* Treadmill */}
          <group position={[-1.4, 0, 0.4]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.82, 0.14, 1.8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.72, -0.78]} rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.78, 1.15, 0.1]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
          {/* Weight Bench & Barbell */}
          <group position={[0.2, 0, 0.5]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[0.45, 0.12, 1.35]} />
              <meshStandardMaterial color="#1f2937" roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.92, -0.35]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 1.55, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
            </mesh>
            {[-0.68, 0.68].map((bx, bi) => (
              <mesh key={bi} position={[bx, 0.92, -0.35]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 12]} />
                <meshStandardMaterial color="#111827" roughness={0.5} />
              </mesh>
            ))}
          </group>
          {/* F1 Racing Simulator Cockpit */}
          <group position={[1.8, 0, 1.25]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.78, 0.28, 1.5]} />
              <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.65, 0.42]} rotation={[-0.25, 0, 0]} castShadow>
              <boxGeometry args={[0.55, 0.72, 0.14]} />
              <meshStandardMaterial color="#dc2626" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.95, -0.62]}>
              <boxGeometry args={[1.15, 0.56, 0.05]} />
              <meshStandardMaterial
                color="#0f172a"
                emissive="#38bdf8"
                emissiveIntensity={isNight ? 1.1 : 0.35}
              />
            </mesh>
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
