"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * COZY BALCONY — sudut santai bergaya rumah estetik di atas atap (balkon kantor).
 * Referensi: "9 Ide Sudut Santai di Balkon" (Liputan6).
 *
 * Elemen:
 *  - Lantai kayu/bambu hangat + karpet jute bulat
 *  - Beanbag krem (2) + sofa rendah rotan/bambu dengan bantal
 *  - Meja kopi kayu + mug & buku
 *  - Kursi rotan gantung (egg chair) pada pergola bambu
 *  - Tanaman pot: monstera, lidah mertua, lavender, palem mini
 *  - Fairy lights + lampu string hangat, dinding bata putih + macrame
 *  - Pemandangan hijau (tanaman rambat di tepi pagar kaca)
 *
 * Semua koordinat relatif terhadap grup (0, 0, 0) = permukaan balkon.
 */
export function CozyBalcony({
  position = [0, 0, 0],
  isNight = false,
  rotationY = 0,
}: {
  position?: [number, number, number];
  isNight?: boolean;
  rotationY?: number;
}) {
  const fairyRef = useRef<THREE.Group>(null);
  const swingRef = useRef<THREE.Group>(null);
  const glowIntensity = isNight ? 2.9 : 1.15;

  // Titik lampu string yang berkedip lembut
  const fairyLights = useMemo(() => {
    const pts: { pos: [number, number, number]; phase: number }[] = [];
    // string di sepanjang balok pergola depan (Z = -1.35, Y = 2.42)
    for (let i = 0; i < 9; i += 1) {
      const x = -2.05 + i * 0.51;
      const sag = Math.sin((i / 8) * Math.PI) * 0.11;
      pts.push({ pos: [x, 2.4 - sag, -1.38], phase: i * 0.7 });
    }
    // string di sepanjang dinding bata (Z = 1.62, Y = 1.95)
    for (let i = 0; i < 8; i += 1) {
      const x = -1.95 + i * 0.56;
      pts.push({ pos: [x, 1.98, 1.6], phase: i * 1.1 + 2 });
    }
    return pts;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (fairyRef.current) {
      fairyRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (mat) {
          mat.emissiveIntensity = glowIntensity * (0.78 + 0.32 * Math.sin(t * 1.6 + i * 0.9));
        }
      });
    }
    if (swingRef.current) {
      swingRef.current.rotation.z = Math.sin(t * 0.55) * 0.045;
      swingRef.current.rotation.x = Math.cos(t * 0.42) * 0.03;
    }
  });

  const deckSlats = useMemo(() => {
    const slats: { x: number; tone: string }[] = [];
    const tones = ["#b98a5b", "#c0946a", "#ab7d50", "#c69a70"];
    for (let i = 0; i < 16; i += 1) {
      slats.push({ x: -2.22 + i * 0.296, tone: tones[i % tones.length] });
    }
    return slats;
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ================= LANTAI KAYU / BAMBU ================= */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[4.7, 0.05, 3.5]} />
        <meshStandardMaterial color="#b98a5b" roughness={0.82} />
      </mesh>
      {deckSlats.map((s, i) => (
        <mesh key={`slat-${i}`} position={[s.x, 0.045, 0]} receiveShadow>
          <boxGeometry args={[0.27, 0.022, 3.44]} />
          <meshStandardMaterial color={s.tone} roughness={0.86} />
        </mesh>
      ))}

      {/* Karpet jute bulat */}
      <mesh position={[0.15, 0.062, -0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.15, 32]} />
        <meshStandardMaterial color="#d7c4a3" roughness={0.95} />
      </mesh>
      <mesh position={[0.15, 0.063, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1.02, 32]} />
        <meshStandardMaterial color="#c2ac88" roughness={0.95} />
      </mesh>

      {/* ================= DINDING BATA PUTIH + MACRAME ================= */}
      <mesh position={[0, 0.95, 1.68]} castShadow receiveShadow>
        <boxGeometry args={[4.66, 1.9, 0.1]} />
        <meshStandardMaterial color="#f4ece0" roughness={0.92} />
      </mesh>
      {/* garis nat bata */}
      {[0.42, 0.78, 1.14, 1.5].map((y, i) => (
        <mesh key={`brick-${i}`} position={[0, y, 1.623]}>
          <boxGeometry args={[4.62, 0.018, 0.012]} />
          <meshStandardMaterial color="#ddd0be" roughness={0.95} />
        </mesh>
      ))}
      {[-1.9, -0.95, 0, 0.95, 1.9].map((x, i) => (
        <mesh key={`brickv-${i}`} position={[x, 0.96, 1.623]}>
          <boxGeometry args={[0.014, 1.86, 0.012]} />
          <meshStandardMaterial color="#e5d9c8" roughness={0.95} />
        </mesh>
      ))}
      {/* Macrame dinding krem */}
      <mesh position={[-1.35, 1.34, 1.6]}>
        <boxGeometry args={[0.86, 0.72, 0.016]} />
        <meshStandardMaterial color="#efe3cf" roughness={0.96} />
      </mesh>
      {[-0.32, -0.16, 0, 0.16, 0.32].map((dx, i) => (
        <mesh key={`macrame-${i}`} position={[-1.35 + dx, 1.16, 1.588]}>
          <boxGeometry args={[0.035, 0.4, 0.01]} />
          <meshStandardMaterial color="#dccdb4" roughness={0.96} />
        </mesh>
      ))}

      {/* ================= SOFA RENDAH ROTAN ================= */}
      <group position={[-1.15, 0, 1.02]}>
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.18, 0.8]} />
          <meshStandardMaterial color="#b58a5c" roughness={0.8} />
        </mesh>
        {/* rangka rotan */}
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={`sofa-leg-${i}`} position={[x, 0.09, 0]} castShadow>
            <boxGeometry args={[0.08, 0.18, 0.74]} />
            <meshStandardMaterial color="#8f6a41" roughness={0.84} />
          </mesh>
        ))}
        {/* bantal duduk */}
        <mesh position={[-0.48, 0.38, 0.02]} castShadow>
          <boxGeometry args={[0.9, 0.16, 0.7]} />
          <meshStandardMaterial color="#f6efe3" roughness={0.95} />
        </mesh>
        <mesh position={[0.48, 0.38, 0.02]} castShadow>
          <boxGeometry args={[0.9, 0.16, 0.7]} />
          <meshStandardMaterial color="#f1e7d8" roughness={0.95} />
        </mesh>
        {/* sandaran */}
        <mesh position={[0, 0.68, 0.34]} rotation={[-0.12, 0, 0]} castShadow>
          <boxGeometry args={[1.95, 0.5, 0.16]} />
          <meshStandardMaterial color="#e9dcc7" roughness={0.95} />
        </mesh>
        {/* bantal hias */}
        <mesh position={[-0.62, 0.6, 0.2]} rotation={[0.2, 0.3, 0.12]} castShadow>
          <boxGeometry args={[0.34, 0.34, 0.12]} />
          <meshStandardMaterial color="#c98f6f" roughness={0.94} />
        </mesh>
        <mesh position={[0.58, 0.58, 0.2]} rotation={[0.15, -0.25, -0.1]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.12]} />
          <meshStandardMaterial color="#8fae9b" roughness={0.94} />
        </mesh>
      </group>

      {/* ================= 2 BEANBAG KREM ================= */}
      <group position={[0.95, 0, 0.86]}>
        <mesh position={[0, 0.28, 0]} scale={[1, 0.72, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.44, 18, 14]} />
          <meshStandardMaterial color="#efe4d2" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.5, 0.16]} scale={[0.7, 0.5, 0.5]} castShadow>
          <sphereGeometry args={[0.34, 16, 12]} />
          <meshStandardMaterial color="#e6d8c3" roughness={0.96} />
        </mesh>
      </group>
      <group position={[1.42, 0, -0.12]}>
        <mesh position={[0, 0.26, 0]} scale={[1, 0.7, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.4, 18, 14]} />
          <meshStandardMaterial color="#e2d6c4" roughness={0.96} />
        </mesh>
      </group>

      {/* ================= MEJA KOPI KAYU ================= */}
      <group position={[0.1, 0, -0.02]}>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.44, 0.44, 0.06, 24]} />
          <meshStandardMaterial color="#8f6a41" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.32, 12]} />
          <meshStandardMaterial color="#7a5937" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.03, 20]} />
          <meshStandardMaterial color="#6c4c2e" roughness={0.8} />
        </mesh>
        {/* mug + buku */}
        <mesh position={[-0.16, 0.41, 0.08]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.1, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0.12, 0.395, -0.1]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.26, 0.035, 0.19]} />
          <meshStandardMaterial color="#b08a5f" roughness={0.8} />
        </mesh>
      </group>

      {/* ================= PERGOLA BAMBU + KURSI ROTAN GANTUNG ================= */}
      <group position={[0, 0, -1.4]}>
        {[-2.1, 2.1].map((x, i) => (
          <mesh key={`post-${i}`} position={[x, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 2.4, 10]} />
            <meshStandardMaterial color="#a9805a" roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, 2.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 4.3, 10]} />
          <meshStandardMaterial color="#a9805a" roughness={0.85} />
        </mesh>
      </group>

      <group ref={swingRef} position={[1.15, 0, -1.4]}>
        {/* tali gantung */}
        <mesh position={[0, 1.72, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.1, 6]} />
          <meshStandardMaterial color="#8a7052" roughness={0.9} />
        </mesh>
        {/* cangkang kursi rotan */}
        <mesh position={[0, 0.86, 0]} rotation={[0, 0, 0.06]} castShadow>
          <sphereGeometry args={[0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
          <meshStandardMaterial color="#c9a877" roughness={0.88} side={THREE.DoubleSide} />
        </mesh>
        {/* bantal kursi */}
        <mesh position={[0, 0.72, -0.02]} castShadow>
          <sphereGeometry args={[0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color="#f3e8d6" roughness={0.95} />
        </mesh>
        {/* bantal sandar kecil */}
        <mesh position={[0, 0.9, 0.16]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#c98f6f" roughness={0.94} />
        </mesh>
      </group>

      {/* ================= TANAMAN POT ================= */}
      {/* Monstera tinggi */}
      <group position={[-2.05, 0, -1.05]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.15, 0.36, 14]} />
          <meshStandardMaterial color="#d8c9b2" roughness={0.9} />
        </mesh>
        {[
          [0, 0.62, 0, 0.3],
          [-0.16, 0.82, 0.06, -0.5],
          [0.14, 0.95, -0.05, 0.6],
          [0, 1.1, 0.02, 0.1],
        ].map(([x, y, z, rot], i) => (
          <mesh
            key={`monstera-${i}`}
            position={[x, y, z]}
            rotation={[0.2, rot, 0.3 * (i % 2 === 0 ? 1 : -1)]}
            castShadow
          >
            <sphereGeometry args={[0.24, 10, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#2f6b3c" : "#3f8a4c"} roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* Lidah mertua */}
      <group position={[-2.0, 0, 1.28]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.32, 12]} />
          <meshStandardMaterial color="#e7dccb" roughness={0.9} />
        </mesh>
        {[-0.07, 0, 0.07].map((dx, i) => (
          <mesh
            key={`snake-${i}`}
            position={[dx, 0.55 + i * 0.04, 0]}
            rotation={[0, 0, dx * 3]}
            castShadow
          >
            <coneGeometry args={[0.05, 0.62, 6]} />
            <meshStandardMaterial color="#3d6b45" roughness={0.86} />
          </mesh>
        ))}
      </group>

      {/* Lavender */}
      <group position={[-1.62, 0, -0.28]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.24, 12]} />
          <meshStandardMaterial color="#cbb9a1" roughness={0.9} />
        </mesh>
        {[
          [-0.06, 0.36, 0],
          [0.02, 0.42, 0.05],
          [0.07, 0.34, -0.04],
        ].map(([x, y, z], i) => (
          <group key={`lav-${i}`} position={[x, y, z]}>
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.24, 6]} />
              <meshStandardMaterial color="#6f8f6a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.038, 8, 8]} />
              <meshStandardMaterial color="#9a7fc4" roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Palem mini pojok */}
      <group position={[2.05, 0, 0.95]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.16, 0.4, 14]} />
          <meshStandardMaterial color="#d5c6ae" roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={`palm-${i}`}
              position={[Math.cos(a) * 0.14, 0.72, Math.sin(a) * 0.14]}
              rotation={[Math.cos(a) * 0.5, a, Math.sin(a) * 0.5]}
              castShadow
            >
              <coneGeometry args={[0.08, 0.7, 6]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#3d8a52" : "#4c9a5e"} roughness={0.85} />
            </mesh>
          );
        })}
      </group>

      {/* ================= FAIRY LIGHTS + LAMPU STRING ================= */}
      <group ref={fairyRef}>
        {fairyLights.map((l, i) => (
          <mesh key={`fairy-${i}`} position={l.pos}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial
              color="#ffd9a0"
              emissive="#ffb35c"
              emissiveIntensity={glowIntensity}
              toneMapped={!isNight}
            />
          </mesh>
        ))}
      </group>

      {/* Lampu hangat kecil untuk suasana cozy */}
      <pointLight
        position={[0, 2.15, 0.3]}
        intensity={isNight ? 2.4 : 0.9}
        distance={7}
        decay={2}
        color="#ffc98a"
      />

      {/* ================= PAGAR KACA + TANAMAN RAMBAT ================= */}
      <mesh position={[0, 0.55, -1.78]}>
        <boxGeometry args={[4.66, 1.05, 0.04]} />
        <meshStandardMaterial
          color="#cfeaf2"
          transparent
          opacity={0.24}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 1.1, -1.78]}>
        <boxGeometry args={[4.7, 0.06, 0.08]} />
        <meshStandardMaterial color="#9aa7ad" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-2.0, -1.15, -0.3, 0.55, 1.4, 2.1].map((x, i) => (
        <group key={`vine-${i}`} position={[x, 0.16, -1.62]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.36, 0.28, 0.26]} />
            <meshStandardMaterial color="#8a7259" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <sphereGeometry args={[0.22, 9, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#417a4b" : "#4f8f55"} roughness={0.88} />
          </mesh>
          <mesh position={[0.08, 0.62, 0]} castShadow>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#5a9c61" roughness={0.88} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
