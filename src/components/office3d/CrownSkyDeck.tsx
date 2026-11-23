"use client";

import React, { useEffect } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_1_Y, ROOF_Y } from "@/lib/data/initial-office-data";
import { RooftopAttractions } from "@/components/office3d/RooftopAttractions";
import type { FloorView, Vector3Tuple } from "@/types/office";

interface CrownSkyDeckProps {
  activeFloor: FloorView;
  isNight: boolean;
  isSunset?: boolean;
  isSimulationRunning?: boolean;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

/**
 * CROWN SKY DECK — atap kantor 3 lantai (L4 & L5 sudah DIHAPUS).
 *
 * Isi:
 *  - Pelat dek beton penuh (39.6 × 16) tepat di atas atap L3 (ROOF_Y = 11.8)
 *  - Helipad "H" + helikopter executive + lapangan badminton + 2 pemain (RooftopAttractions)
 *  - Glass balustrade, handrail, 4 pylon RGB, planter, signage neon, sky lounge
 *  - Penthouse lift cyan (akses dari shaft lift L1–L3)
 *  - Hologram arrival portal L1 tetap dipertahankan
 */
export function CrownSkyDeck({
  activeFloor,
  isNight,
  isSunset = false,
  isSimulationRunning = true,
  onFocusPoint,
}: CrownSkyDeckProps) {
  const showRoofDeck = activeFloor === "all" || activeFloor === "roof";
  const emissiveBoost = isNight ? 1.6 : isSunset ? 1.25 : 0.75;
  const roofNeon = isNight ? 2.1 : isSunset ? 1.3 : 0.55;

  // Geometri bersama (dispose bersih saat unmount — aman untuk memori Android)
  const sharedGeos = React.useMemo(
    () => ({
      deckPlate: new THREE.BoxGeometry(39.4, 0.04, 16.0),
      railGlass: new THREE.BoxGeometry(39.2, 1.05, 0.05),
      railGlassSide: new THREE.BoxGeometry(0.05, 1.05, 15.9),
      handrail: new THREE.BoxGeometry(39.3, 0.09, 0.12),
      handrailSide: new THREE.BoxGeometry(0.12, 0.09, 16.0),
      liftHead: new THREE.BoxGeometry(2.6, 2.35, 2.3),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(sharedGeos).forEach((g) => g.dispose());
    };
  }, [sharedGeos]);

  return (
    <group>
      {/* ==================== L1 HOLOGRAM ARRIVAL PORTAL (dipertahankan) ==================== */}
      <group
        position={[0, FLOOR_1_Y + 0.04, 1.4]}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onFocusPoint?.([0, FLOOR_1_Y + 1.2, 1.4]);
        }}
      >
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[3.4, 0.08, 2.4]} />
          <meshStandardMaterial
            color="#0c4a6e"
            emissive="#22d3ee"
            emissiveIntensity={isNight ? 0.95 : 0.55}
            roughness={0.2}
          />
        </mesh>
        {[-0.45, 0.45].map((zOff, idx) => (
          <group key={idx} position={[0, 1.25, zOff]}>
            {[-1.15, 1.15].map((xOff, xi) => (
              <mesh key={xi} position={[xOff, 0, 0]}>
                <boxGeometry args={[0.07, 2.35, 0.07]} />
                <meshStandardMaterial
                  color="#a5f3fc"
                  emissive="#22d3ee"
                  emissiveIntensity={emissiveBoost}
                />
              </mesh>
            ))}
            <mesh position={[0, 1.18, 0]}>
              <boxGeometry args={[2.37, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#a5f3fc"
                emissive="#22d3ee"
                emissiveIntensity={emissiveBoost}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ==================== CROWN SKY DECK (di atas L3) ==================== */}
      {showRoofDeck && (
        <group position={[0, ROOF_Y, 0]}>
          {/* Pelat dek beton arsitektural (top surface, anti z-fighting dengan slab L3) */}
          <mesh
            position={[0, 0.02, -2.5]}
            geometry={sharedGeos.deckPlate}
            receiveShadow
            onDoubleClick={(e) => {
              e.stopPropagation();
              onFocusPoint?.([0, ROOF_Y + 1.0, -2.5]);
            }}
          >
            <meshStandardMaterial color="#c9c4b9" roughness={0.82} metalness={0.04} />
          </mesh>

          {/* Penthouse Lift Cyan (akses atap dari shaft L1–L3) */}
          <group position={[-11.8, 0, -8.4]}>
            <mesh position={[0, 1.175, 0]} geometry={sharedGeos.liftHead} castShadow>
              <meshStandardMaterial color="#12233a" roughness={0.45} metalness={0.35} />
            </mesh>
            <mesh position={[0, 2.38, 0]}>
              <boxGeometry args={[2.66, 0.08, 2.36]} />
              <meshStandardMaterial
                color="#67e8f9"
                emissive="#22d3ee"
                emissiveIntensity={emissiveBoost}
                toneMapped={!isNight}
              />
            </mesh>
            {/* pintu lift */}
            <mesh position={[0, 1.1, 1.16]}>
              <boxGeometry args={[1.5, 2.1, 0.06]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#0ea5e9"
                emissiveIntensity={emissiveBoost * 0.6}
                transparent
                opacity={0.75}
              />
            </mesh>
          </group>

          {/* Glass Safety Balustrade keliling dek (depan, belakang, 2 sisi) */}
          <mesh position={[0, 0.6, 5.45]} geometry={sharedGeos.railGlass}>
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={0.26}
              roughness={0.1}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0, 0.6, -10.45]} geometry={sharedGeos.railGlass}>
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={0.26}
              roughness={0.1}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[-19.6, 0.6, -2.5]} geometry={sharedGeos.railGlassSide}>
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={0.26}
              roughness={0.1}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[19.6, 0.6, -2.5]} geometry={sharedGeos.railGlassSide}>
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={0.26}
              roughness={0.1}
              metalness={0.12}
            />
          </mesh>

          {/* Handrail baja + neon strip tepi depan */}
          <mesh position={[0, 1.16, 5.45]} geometry={sharedGeos.handrail}>
            <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
          </mesh>
          <mesh position={[0, 1.16, -10.45]} geometry={sharedGeos.handrail}>
            <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
          </mesh>
          <mesh position={[-19.6, 1.16, -2.5]} geometry={sharedGeos.handrailSide}>
            <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
          </mesh>
          <mesh position={[19.6, 1.16, -2.5]} geometry={sharedGeos.handrailSide}>
            <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0.06, 5.62]}>
            <boxGeometry args={[39.2, 0.06, 0.06]} />
            <meshStandardMaterial
              color="#cffafe"
              emissive="#00f0ff"
              emissiveIntensity={roofNeon}
              toneMapped={!isNight}
            />
          </mesh>

          {/* 4 Pylon RGB sudut dek */}
          {[
            [-19.3, 5.2, "#22d3ee"],
            [19.3, 5.2, "#ec4899"],
            [-19.3, -10.2, "#a855f7"],
            [19.3, -10.2, "#22c55e"],
          ].map(([px, pz, glow], pi) => (
            <group key={`roof-pylon-${pi}`} position={[px as number, 0, pz as number]}>
              <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.075, 0.095, 1.4, 10]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 1.44, 0]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshStandardMaterial
                  color={glow as string}
                  emissive={glow as string}
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
            </group>
          ))}

          {/* Planter hijau sudut */}
          {[
            [-17.6, 4.6],
            [17.6, 4.6],
            [-17.8, -9.6],
            [17.8, -9.6],
          ].map(([gx, gz], gi) => (
            <group key={`roof-planter-${gi}`} position={[gx, 0, gz]}>
              <mesh position={[0, 0.22, 0]} castShadow>
                <boxGeometry args={[1.1, 0.44, 0.95]} />
                <meshStandardMaterial color="#2c3138" roughness={0.66} />
              </mesh>
              <mesh position={[0, 0.62, 0]} castShadow>
                <sphereGeometry args={[0.5, 10, 8]} />
                <meshStandardMaterial color="#4a6b3c" roughness={0.88} />
              </mesh>
            </group>
          ))}

          {/* Crown Signage menghadap depan (selatan) */}
          <group position={[0, 0, -9.7]}>
            {[-5.4, 5.4].map((lx, li) => (
              <mesh key={`sign-leg-${li}`} position={[lx, 1.14, 0]} castShadow>
                <boxGeometry args={[0.16, 2.28, 0.16]} />
                <meshStandardMaterial color="#1b1f26" metalness={0.72} roughness={0.32} />
              </mesh>
            ))}
            <group position={[0, 2.83, 0]}>
              <mesh castShadow>
                <boxGeometry args={[12.4, 1.1, 0.22]} />
                <meshStandardMaterial color="#111624" metalness={0.68} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0.57, 0.1]}>
                <boxGeometry args={[12.45, 0.06, 0.06]} />
                <meshStandardMaterial
                  color="#cffafe"
                  emissive="#00f0ff"
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
              <mesh position={[0, -0.57, 0.1]}>
                <boxGeometry args={[12.45, 0.06, 0.06]} />
                <meshStandardMaterial
                  color="#f3e8ff"
                  emissive="#a855f7"
                  emissiveIntensity={roofNeon}
                  toneMapped={!isNight}
                />
              </mesh>
              <Text
                position={[0, 0, 0.14]}
                fontSize={0.72}
                color="#e0f2fe"
                letterSpacing={0.13}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.014}
                outlineColor="#0f172a"
              >
                FAJREZZZ AI OFFICE
                <meshStandardMaterial
                  color="#e0f2fe"
                  emissive={isNight ? "#38bdf8" : "#0284c7"}
                  emissiveIntensity={isNight ? 2.0 : 0.5}
                  toneMapped={!isNight}
                />
              </Text>
            </group>
          </group>

          {/* Sky lounge sofa + meja (antara helipad & lapangan) */}
          <group position={[-1.3, 0, 3.4]}>
            <mesh position={[0, 0.24, 0]} castShadow>
              <boxGeometry args={[2.9, 0.38, 0.85]} />
              <meshStandardMaterial color="#f4efe6" roughness={0.86} />
            </mesh>
            <mesh position={[0, 0.55, -0.31]} castShadow>
              <boxGeometry args={[2.9, 0.44, 0.2]} />
              <meshStandardMaterial color="#e6dfd2" roughness={0.86} />
            </mesh>
            <group position={[0, 0, -1.05]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[1.5, 0.07, 0.72]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[1.24, 0.3, 0.5]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} />
              </mesh>
            </group>
          </group>

          {/* Penerangan atap saat malam */}
          {isNight && (
            <pointLight
              position={[0, 2.8, -2.6]}
              color="#cffafe"
              intensity={18}
              distance={26}
            />
          )}

          {/* Helipad "H" + Helikopter + Lapangan Badminton & 2 Pemain */}
          <RooftopAttractions
            isNight={isNight}
            isSunset={isSunset}
            isSimulationRunning={isSimulationRunning}
          />
        </group>
      )}
    </group>
  );
}
