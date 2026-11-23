"use client";

import React from "react";
import { FLOOR_1_Y } from "@/lib/data/initial-office-data";

/**
 * Clean Nanverse-Style Architectural Edge Lighting & L1 East Wellness Wing:
 * - Warm champagne-gold & architectural white building edge lighting (0 extra lights)
 * - L1 West/Center: Open Grand Main Lobby
 * - L1 East Wing (X=+14.2): Executive Gym + Racing Simulator
 * - L3 East Wing: Kept clean & spacious (Billiard table & blue cinema screen removed)
 * - Rooftop: Clean unobstructed deck (Pergola seating removed)
 */
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
      {/* ARCHITECTURAL WARM-WHITE / CHAMPAGNE-GOLD BUILDING EDGE LIGHTS (Nanverse Real-World Luxury Night Glow) */}
      {showRoof && (
        <group>
          {[
            { y: 3.88, color: "#fef3c7", emissive: "#fde68a" },
            { y: 7.78, color: "#f8fafc", emissive: "#fffbeb" },
            { y: 11.76, color: "#fef3c7", emissive: "#fde68a" },
          ].map((band, bi) => (
            <group key={`arch-band-${bi}`} position={[0, band.y, 0]}>
              {/* Front Facade Warm Cove Light (38.2m) */}
              <mesh position={[0, 0, 4.14]}>
                <boxGeometry args={[38.2, 0.04, 0.04]} />
                <meshStandardMaterial
                  color={band.color}
                  emissive={band.emissive}
                  emissiveIntensity={isNight ? 1.15 : 0.08}
                />
              </mesh>
              {/* Left & Right Side Edge Cove Lights (X = ±19.1) */}
              {[-19.1, 19.1].map((sx, si) => (
                <mesh key={si} position={[sx, 0, -3.0]}>
                  <boxGeometry args={[0.04, 0.04, 14.2]} />
                  <meshStandardMaterial
                    color={band.color}
                    emissive={band.emissive}
                    emissiveIntensity={isNight ? 1.0 : 0.06}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

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
                emissive="#fef3c7"
                emissiveIntensity={isNight ? 0.65 : 0.22}
              />
            </mesh>
          </group>
          {/* Warm Architectural Ceiling Light Bar */}
          <mesh position={[0.4, 3.25, 0]}>
            <boxGeometry args={[4.8, 0.05, 0.08]} />
            <meshStandardMaterial
              color="#fff6e0"
              emissive="#fde68a"
              emissiveIntensity={isNight ? 1.4 : 0.35}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
