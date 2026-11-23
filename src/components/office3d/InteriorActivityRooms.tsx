"use client";

import React from "react";
import { CYBERPUNK_THEME } from "@/lib/config/cyberpunk-theme";
import { FLOOR_1_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";

/**
 * Architectural Cyberpunk Accents & Interior Activity Wings (Sized for Widened 38m HQ):
 * - Cyberpunk neon edge strips spanning 38.2m (L1–L3 & Rooftop, 0 extra point lights)
 * - L1 West/Center: Kept completely open as Grand Main Lobby (MT5 Control Room removed)
 * - L1 East Wing (X=+14.2): Executive Gym + Retro-Cyber Arcade + F1 Racing Simulator
 * - L3 East Wing (X=+13.6): Executive Billiard/Pool Table + Mini Cinema Wall
 * - Rooftop: Pergola Wood-Slat Lounge + Glowing Neon Helipad "H"
 */
export function InteriorActivityRooms({
  showL1,
  showL3,
  showRoof,
  isNight,
}: {
  showL1: boolean;
  showL3: boolean;
  showRoof: boolean;
  isNight: boolean;
}) {
  const neonGlow = isNight
    ? CYBERPUNK_THEME.intensity.nightAccent
    : CYBERPUNK_THEME.intensity.daySubtleAccent;

  return (
    <group>
      {/* ARCHITECTURAL WARM-WHITE / CHAMPAGNE-GOLD BUILDING EDGE LIGHTS (Real-World Luxury Night Glow, 0 extra lights!) */}
      {showRoof && (
        <group>
          {[
            { y: 3.88, color: "#fef3c7", emissive: "#fde68a" },
            { y: 7.78, color: "#f8fafc", emissive: "#fffbeb" },
            { y: 11.76, color: "#fef3c7", emissive: "#fde68a" },
          ].map((band, bi) => (
            <group key={`neon-band-${bi}`} position={[0, band.y, 0]}>
              {/* Front Facade Edge Light (38.2m) */}
              <mesh position={[0, 0, 4.12]}>
                <boxGeometry args={[38.2, 0.05, 0.05]} />
                <meshStandardMaterial
                  color={band.color}
                  emissive={band.emissive}
                  emissiveIntensity={isNight ? 1.25 : 0.12}
                />
              </mesh>
              {/* Left & Right Side Edge Lights (X = ±19.1) */}
              {[-19.1, 19.1].map((sx, si) => (
                <mesh key={si} position={[sx, 0, -3.0]}>
                  <boxGeometry args={[0.05, 0.05, 14.2]} />
                  <meshStandardMaterial
                    color={band.color}
                    emissive={band.emissive}
                    emissiveIntensity={isNight ? 1.15 : 0.1}
                  />
                </mesh>
              ))}
            </group>
          ))}

          {/* Warm Architectural Vertical Backlit Wood-Fin Strips */}
          {[-17.8, -13.4, -9.0, 9.0, 13.4, 17.8].map((fx, fi) => (
            <mesh key={`vfin-${fi}`} position={[fx, 6.0, 4.08]}>
              <boxGeometry args={[0.045, 11.4, 0.045]} />
              <meshStandardMaterial
                color="#fef3c7"
                emissive="#fde68a"
                emissiveIntensity={isNight ? 1.1 : 0.1}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* L1 EAST WING (X=+14.2): EXECUTIVE GYM + ARCADE + RACING SIMULATOR (L1 Center & West = Grand Main Lobby!) */}
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
          {/* 2 Glowing Cyberpunk Arcade Cabinets */}
          {[1.4, 2.3].map((ax, ai) => (
            <group key={`arc-${ai}`} position={[ax, 0, -0.8]}>
              <mesh position={[0, 0.92, 0]} castShadow>
                <boxGeometry args={[0.72, 1.84, 0.68]} />
                <meshStandardMaterial color="#0f172a" roughness={0.35} />
              </mesh>
              <mesh position={[0, 1.24, 0.35]}>
                <planeGeometry args={[0.56, 0.44]} />
                <meshStandardMaterial
                  color="#1e1b4b"
                  emissive={ai === 0 ? CYBERPUNK_THEME.neon.magenta : CYBERPUNK_THEME.neon.cyan}
                  emissiveIntensity={isNight ? 1.5 : 0.7}
                />
              </mesh>
            </group>
          ))}
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
                emissive={CYBERPUNK_THEME.neon.purple}
                emissiveIntensity={isNight ? 1.2 : 0.45}
              />
            </mesh>
          </group>
          {/* Overhead Magenta RGB LED Strip */}
          <mesh position={[0.4, 3.25, 0]}>
            <boxGeometry args={[4.8, 0.05, 0.08]} />
            <meshStandardMaterial
              color={CYBERPUNK_THEME.neon.magenta}
              emissive={CYBERPUNK_THEME.neon.magentaEmissive}
              emissiveIntensity={neonGlow}
            />
          </mesh>
        </group>
      )}

      {/* L3 EAST WING (X=+13.6): BILLIARD TABLE + EXECUTIVE CINEMA WALL */}
      {showL3 && (
        <group position={[13.6, FLOOR_3_Y, -2.0]}>
          {/* Emerald-Felt Billiard / Pool Table */}
          <group position={[0, 0, 0.4]}>
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, 0.18, 1.4]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.56, 0.14, 1.46]} />
              <meshStandardMaterial color="#4a2e19" roughness={0.48} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[2.28, 0.02, 1.18]} />
              <meshStandardMaterial color="#15803d" roughness={0.85} />
            </mesh>
            {[
              [-0.45, "#f8fafc"],
              [0.32, "#facc15"],
              [0.44, "#dc2626"],
              [0.44, "#2563eb"],
              [0.56, "#111827"],
            ].map(([bx, col], bi) => (
              <mesh
                key={bi}
                position={[
                  bx as number,
                  0.945,
                  bi === 0 ? 0 : (bi - 2.5) * 0.08,
                ]}
              >
                <sphereGeometry args={[0.042, 10, 10]} />
                <meshStandardMaterial color={col as string} roughness={0.2} metalness={0.15} />
              </mesh>
            ))}
            {[
              [-1.08, -0.56],
              [1.08, -0.56],
              [-1.08, 0.56],
              [1.08, 0.56],
            ].map(([lx, lz], li) => (
              <mesh key={li} position={[lx, 0.42, lz]} castShadow>
                <boxGeometry args={[0.14, 0.84, 0.14]} />
                <meshStandardMaterial color="#3b2313" roughness={0.6} />
              </mesh>
            ))}
          </group>

          {/* Mini Cinema Screening Wall */}
          <group position={[0, 1.75, -2.55]}>
            <mesh castShadow>
              <boxGeometry args={[3.6, 1.85, 0.08]} />
              <meshStandardMaterial color="#090d16" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[3.35, 1.62]} />
              <meshStandardMaterial
                color="#0c1932"
                emissive="#38bdf8"
                emissiveIntensity={isNight ? 0.85 : 0.3}
              />
            </mesh>
          </group>

          <mesh position={[0, 3.3, 0]}>
            <boxGeometry args={[3.8, 0.05, 0.08]} />
            <meshStandardMaterial
              color={CYBERPUNK_THEME.neon.purple}
              emissive={CYBERPUNK_THEME.neon.purpleEmissive}
              emissiveIntensity={neonGlow}
            />
          </mesh>
        </group>
      )}

      {/* ROOFTOP PERGOLA LOUNGE + GLOWING NEON HELIPAD "H" */}
      {showRoof && (
        <group position={[0, 11.82, 0]}>
          {/* Glowing Neon Helipad "H" on West Helipad */}
          <group position={[-7.5, 0.03, -2.6]}>
            <mesh position={[-0.55, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.26, 2.1]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#facc15"
                emissiveIntensity={isNight ? 2.0 : 0.5}
              />
            </mesh>
            <mesh position={[0.55, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.26, 2.1]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#facc15"
                emissiveIntensity={isNight ? 2.0 : 0.5}
              />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.1, 0.26]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#facc15"
                emissiveIntensity={isNight ? 2.0 : 0.5}
              />
            </mesh>
          </group>

          {/* Architectural Wood-Slat Pergola Lounge (Center-South Rooftop) */}
          <group position={[-1.2, 0, 2.1]}>
            {[
              [-1.7, -1.1],
              [1.7, -1.1],
              [-1.7, 1.1],
              [1.7, 1.1],
            ].map(([px, pz], i) => (
              <mesh key={i} position={[px, 1.35, pz]} castShadow>
                <boxGeometry args={[0.14, 2.7, 0.14]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
            {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((sx, si) => (
              <mesh key={si} position={[sx, 2.72, 0]} castShadow>
                <boxGeometry args={[0.12, 0.08, 2.4]} />
                <meshStandardMaterial color="#8d5e37" roughness={0.62} />
              </mesh>
            ))}
            <mesh position={[0, 2.66, 1.16]}>
              <boxGeometry args={[3.5, 0.04, 0.05]} />
              <meshStandardMaterial
                color={CYBERPUNK_THEME.neon.cyan}
                emissive={CYBERPUNK_THEME.neon.cyanEmissive}
                emissiveIntensity={neonGlow}
              />
            </mesh>
            <mesh position={[0, 0.28, -0.5]} castShadow>
              <boxGeometry args={[2.4, 0.42, 0.8]} />
              <meshStandardMaterial color="#f1ece3" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.24, 0.45]} castShadow>
              <boxGeometry args={[1.2, 0.34, 0.65]} />
              <meshStandardMaterial color="#6e4728" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
