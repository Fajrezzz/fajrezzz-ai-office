"use client";

import React from "react";
import { CYBERPUNK_THEME } from "@/lib/config/cyberpunk-theme";
import { FLOOR_1_Y, FLOOR_3_Y } from "@/lib/data/initial-office-data";
import { useSimulator, type MiniGameType } from "@/store/SimulatorContext";

/**
 * Stage 2 Interior Activity Rooms & Cyberpunk Architectural Accents:
 * - Cyberpunk architectural neon edge strips & backlit vertical fin accents (0 extra lights!)
 * - L1 West: MT5 Control Room (18 Accounts Wall + Curved Trading Consoles)
 * - L1 East: Executive Gym + Clickable Retro-Cyber Arcade + Clickable F1 Racing Simulator
 * - L3 East: Clickable Emerald Billiard/Pool Table + Clickable 3D Chess Table + Mini Cinema Wall
 * - Rooftop: Wood-Slat Pergola Lounge + Glowing Neon Helipad "H"
 * (Note: Overlapping "FAJREZZZ HQ" facade board removed so "FAJREZZZ AI OFFICE" sign remains clean)
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
  const { setActiveMiniGame, pushSimLog } = useSimulator();

  const neonGlow = isNight
    ? CYBERPUNK_THEME.intensity.nightAccent
    : CYBERPUNK_THEME.intensity.daySubtleAccent;

  const launchGame = (game: MiniGameType, label: string) => {
    setActiveMiniGame(game);
    pushSimLog("Bos Fajrez", `Mulai bermain mini-game ${label}!`, "system");
  };

  return (
    <group>
      {/* CYBERPUNK ARCHITECTURAL NEON EDGE STRIPS (Building Floors L1–L3 & Rooftop Perimeter — 0 extra lights!) */}
      {showRoof && (
        <group>
          {[
            { y: 3.88, color: CYBERPUNK_THEME.neon.cyan, emissive: CYBERPUNK_THEME.neon.cyanEmissive },
            { y: 7.78, color: CYBERPUNK_THEME.neon.magenta, emissive: CYBERPUNK_THEME.neon.magentaEmissive },
            { y: 11.76, color: CYBERPUNK_THEME.neon.purple, emissive: CYBERPUNK_THEME.neon.purpleEmissive },
          ].map((band, bi) => (
            <group key={`neon-band-${bi}`} position={[0, band.y, 0]}>
              {/* Front Facade Neon Edge */}
              <mesh position={[0, 0, 4.12]}>
                <boxGeometry args={[28.2, 0.06, 0.06]} />
                <meshStandardMaterial
                  color={band.color}
                  emissive={band.emissive}
                  emissiveIntensity={neonGlow}
                />
              </mesh>
              {/* Left & Right Side Neon Edges */}
              {[-14.1, 14.1].map((sx, si) => (
                <mesh key={si} position={[sx, 0, -3.0]}>
                  <boxGeometry args={[0.06, 0.06, 14.2]} />
                  <meshStandardMaterial
                    color={band.color}
                    emissive={band.emissive}
                    emissiveIntensity={neonGlow}
                  />
                </mesh>
              ))}
            </group>
          ))}

          {/* Vertical Backlit Wood-Fin Cyber Strips (Alternating Cyan & Magenta at Night) */}
          {[-12.8, -9.2, -5.6, 5.6, 9.2, 12.8].map((fx, fi) => (
            <mesh key={`vfin-${fi}`} position={[fx, 6.0, 4.08]}>
              <boxGeometry args={[0.05, 11.4, 0.05]} />
              <meshStandardMaterial
                color={fi % 2 === 0 ? CYBERPUNK_THEME.neon.cyan : CYBERPUNK_THEME.neon.magenta}
                emissive={
                  fi % 2 === 0
                    ? CYBERPUNK_THEME.neon.cyanEmissive
                    : CYBERPUNK_THEME.neon.magentaEmissive
                }
                emissiveIntensity={isNight ? 1.35 : 0.14}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* L1 WEST WING: RUANG KONTROL MT5 (18 AKUN TRADING WALL) */}
      {showL1 && (
        <group position={[-9.2, FLOOR_1_Y, -4.6]}>
          {/* Curved Multi-Monitor MT5 Desk */}
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.84, 0.95]} />
            <meshStandardMaterial color="#111827" roughness={0.42} metalness={0.4} />
          </mesh>
          {/* 3 Glowing Live MT5 Monitors */}
          {[-1.35, 0, 1.35].map((mx, i) => (
            <group key={`mt5m-${i}`} position={[mx, 1.24, -0.22]} rotation={[0, mx * -0.1, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.18, 0.68, 0.05]} />
                <meshStandardMaterial color="#0b1019" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[1.1, 0.58]} />
                <meshStandardMaterial
                  color="#052e16"
                  emissive={i === 1 ? "#22d3ee" : "#10b981"}
                  emissiveIntensity={isNight ? 1.25 : 0.6}
                />
              </mesh>
            </group>
          ))}
          {/* Overhead RGB Neon Strip */}
          <mesh position={[0, 3.25, 0]}>
            <boxGeometry args={[4.6, 0.05, 0.08]} />
            <meshStandardMaterial
              color={CYBERPUNK_THEME.neon.cyan}
              emissive={CYBERPUNK_THEME.neon.cyanEmissive}
              emissiveIntensity={neonGlow}
            />
          </mesh>
        </group>
      )}

      {/* L1 EAST WING: EXECUTIVE GYM + CLICKABLE ARCADE + CLICKABLE F1 RACING SIMULATOR */}
      {showL1 && (
        <group position={[9.2, FLOOR_1_Y, -4.2]}>
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

          {/* 2 Clickable Glowing Cyberpunk Arcade Cabinets -> Launches Cyber Arcade Mini-Game! */}
          {[1.4, 2.3].map((ax, ai) => (
            <group
              key={`arc-${ai}`}
              position={[ax, 0, -0.8]}
              onClick={(e) => {
                e.stopPropagation();
                launchGame("arcade", "Cyber Neon Arcade");
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
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

          {/* Clickable F1 Racing Simulator Cockpit -> Launches Cyber Racing Mini-Game! */}
          <group
            position={[1.8, 0, 1.25]}
            onClick={(e) => {
              e.stopPropagation();
              launchGame("racing", "F1 Cyber Racing Sim");
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
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

      {/* L3 EAST WING: CLICKABLE BILLIARD TABLE + CLICKABLE 3D CHESS TABLE + EXECUTIVE CINEMA WALL */}
      {showL3 && (
        <group position={[8.6, FLOOR_3_Y, -2.0]}>
          {/* Clickable Pro Emerald-Felt Billiard / Pool Table -> Launches 2D Physics Billiards! */}
          <group
            position={[0, 0, 0.4]}
            onClick={(e) => {
              e.stopPropagation();
              launchGame("billiards", "Biliar Fisika 8-Ball");
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, 0.18, 1.4]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.56, 0.14, 1.46]} />
              <meshStandardMaterial color="#4a2e19" roughness={0.48} />
            </mesh>
            {/* Emerald Felt Surface */}
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[2.28, 0.02, 1.18]} />
              <meshStandardMaterial color="#15803d" roughness={0.85} />
            </mesh>
            {/* Colorful Billiard Balls */}
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
            {/* Table Legs */}
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

          {/* Clickable 3D Executive Chess Table -> Launches Chess vs AI Mini-Game! */}
          <group
            position={[2.55, 0, 0.45]}
            onClick={(e) => {
              e.stopPropagation();
              launchGame("chess", "Catur Eksekutif vs AI");
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.24, 0.76, 12]} />
              <meshStandardMaterial color="#3b2313" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.92, 0.07, 0.92]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.48} />
            </mesh>
            {/* Checkered Board Top + Sculpted White/Black Chess Pieces */}
            {[-0.27, -0.09, 0.09, 0.27].map((cx, xi) =>
              [-0.27, -0.09, 0.09, 0.27].map((cz, zi) => (
                <mesh key={`sq-${xi}-${zi}`} position={[cx, 0.842, cz]}>
                  <boxGeometry args={[0.175, 0.014, 0.175]} />
                  <meshStandardMaterial
                    color={(xi + zi) % 2 === 0 ? "#f8fafc" : "#1e293b"}
                    roughness={0.4}
                  />
                </mesh>
              ))
            )}
            {[-0.24, 0, 0.24].map((px, pi) => (
              <React.Fragment key={`cp-${pi}`}>
                <mesh position={[px, 0.9, -0.26]}>
                  <cylinderGeometry args={[0.024, 0.04, 0.11, 8]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
                <mesh position={[px, 0.9, 0.26]}>
                  <cylinderGeometry args={[0.024, 0.04, 0.11, 8]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.35} />
                </mesh>
              </React.Fragment>
            ))}
          </group>

          {/* Mini Cinema Screening Wall behind Lounge */}
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

          {/* Overhead Purple RGB Strip */}
          <mesh position={[0.4, 3.3, 0]}>
            <boxGeometry args={[4.6, 0.05, 0.08]} />
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
            {/* Pergola Neon Accent Trim */}
            <mesh position={[0, 2.66, 1.16]}>
              <boxGeometry args={[3.5, 0.04, 0.05]} />
              <meshStandardMaterial
                color={CYBERPUNK_THEME.neon.cyan}
                emissive={CYBERPUNK_THEME.neon.cyanEmissive}
                emissiveIntensity={neonGlow}
              />
            </mesh>
            {/* Lounge Sofa & Low Table under Pergola */}
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
