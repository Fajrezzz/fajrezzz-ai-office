"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * COZY BALCONY — sudut santai estetik di BALKON LANTAI 2 (balkon selatan gedung,
 * dek teak Z ≈ 4.1–6.1, Y = FLOOR_2_Y). Referensi: "9 Ide Sudut Santai di Balkon"
 * (Liputan6): lantai kayu, beanbag krem, sofa rendah, kursi rotan gantung,
 * meja kopi kayu, karpet jute bulat, tanaman pot, fairy lights, dinding bata
 * putih + macrame, pemandangan hijau.
 *
 * Catatan geometri: kedalaman balkon cuma ±2 m, jadi set ini dibuat memanjang
 * (6 m × 2 m) dan tidak membuat lantai sendiri — memakai dek teak balkon L2.
 * Titik (0,0,0) = permukaan dek balkon; -Z = dinding kaca gedung, +Z = pagar.
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
  const glowIntensity = isNight ? 2.8 : 1.05;

  const fairyLights = useMemo(() => {
    const pts: { pos: [number, number, number]; phase: number }[] = [];
    // string di sepanjang pagar kaca (Z = +0.92, Y = 0.98)
    for (let i = 0; i < 13; i += 1) {
      const x = -2.85 + i * 0.475;
      const sag = Math.sin((i / 12) * Math.PI) * 0.07;
      pts.push({ pos: [x, 0.98 - sag, 0.92], phase: i * 0.62 });
    }
    // string di atas panel dinding bata putih (Y = 1.9)
    for (let i = 0; i < 7; i += 1) {
      const x = -2.45 + i * 0.4;
      const sag = Math.sin((i / 6) * Math.PI) * 0.05;
      pts.push({ pos: [x, 1.9 - sag, -0.86], phase: i * 0.9 + 2.2 });
    }
    return pts;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (fairyRef.current) {
      fairyRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat) {
          mat.emissiveIntensity =
            glowIntensity * (0.78 + 0.32 * Math.sin(t * 1.5 + i * 0.85));
        }
      });
    }
    if (swingRef.current) {
      swingRef.current.rotation.z = Math.sin(t * 0.6) * 0.05;
      swingRef.current.rotation.x = Math.cos(t * 0.45) * 0.03;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ================= KARPET JUTE BULAT (elips mengikuti balkon) ================= */}
      <mesh position={[-0.55, 0.014, 0.12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.42, 32]} />
        <meshStandardMaterial color="#d7c4a3" roughness={0.96} />
      </mesh>
      <mesh position={[-0.55, 0.016, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.16, 1.28, 32]} />
        <meshStandardMaterial color="#c4ad89" roughness={0.96} />
      </mesh>

      {/* ================= PANEL DINDING BATA PUTIH + MACRAME ================= */}
      <group position={[-1.25, 0, -0.9]}>
        <mesh position={[0, 0.94, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.62, 1.88, 0.07]} />
          <meshStandardMaterial color="#f4ece0" roughness={0.92} />
        </mesh>
        {[0.42, 0.76, 1.1, 1.44, 1.78].map((y, i) => (
          <mesh key={`brick-${i}`} position={[0, y, 0.038]}>
            <boxGeometry args={[2.58, 0.016, 0.012]} />
            <meshStandardMaterial color="#ddd0be" roughness={0.95} />
          </mesh>
        ))}
        {[-1.1, -0.55, 0, 0.55, 1.1].map((x, i) => (
          <mesh key={`brickv-${i}`} position={[x, 0.94, 0.038]}>
            <boxGeometry args={[0.012, 1.84, 0.012]} />
            <meshStandardMaterial color="#e5d9c8" roughness={0.95} />
          </mesh>
        ))}
        {/* Macrame krem */}
        <mesh position={[0, 1.3, 0.05]}>
          <boxGeometry args={[0.8, 0.66, 0.015]} />
          <meshStandardMaterial color="#efe3cf" roughness={0.96} />
        </mesh>
        {[-0.28, -0.14, 0, 0.14, 0.28].map((dx, i) => (
          <mesh key={`mac-${i}`} position={[dx, 1.12, 0.044]}>
            <boxGeometry args={[0.032, 0.36, 0.01]} />
            <meshStandardMaterial color="#dccdb4" roughness={0.96} />
          </mesh>
        ))}
        {/* Lampu gantung kecil di depan panel */}
        {[-0.62, 0.62].map((x, i) => (
          <group key={`pendant-${i}`} position={[x, 1.72, 0.14]}>
            <mesh>
              <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
              <meshStandardMaterial color="#8a7052" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshStandardMaterial
                color="#ffd9a0"
                emissive="#ffb35c"
                emissiveIntensity={glowIntensity}
                toneMapped={!isNight}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================= SOFA RENDAH BAMBU/ROTAN ================= */}
      <group position={[-1.25, 0, -0.42]}>
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.24, 0.16, 0.66]} />
          <meshStandardMaterial color="#b58a5c" roughness={0.8} />
        </mesh>
        {[-1.06, 1.06].map((x, i) => (
          <mesh key={`sofa-leg-${i}`} position={[x, 0.09, 0]} castShadow>
            <boxGeometry args={[0.08, 0.18, 0.6]} />
            <meshStandardMaterial color="#8f6a41" roughness={0.84} />
          </mesh>
        ))}
        <mesh position={[-0.53, 0.37, 0.02]} castShadow>
          <boxGeometry args={[1.0, 0.14, 0.58]} />
          <meshStandardMaterial color="#f6efe3" roughness={0.95} />
        </mesh>
        <mesh position={[0.53, 0.37, 0.02]} castShadow>
          <boxGeometry args={[1.0, 0.14, 0.58]} />
          <meshStandardMaterial color="#f1e7d8" roughness={0.95} />
        </mesh>
        {/* Sandaran menghadap +Z (ke arah pemandangan/pagar) */}
        <mesh position={[0, 0.64, -0.27]} castShadow>
          <boxGeometry args={[2.2, 0.46, 0.14]} />
          <meshStandardMaterial color="#e9dcc7" roughness={0.95} />
        </mesh>
        <mesh position={[-0.66, 0.56, -0.16]} rotation={[0.25, 0.3, 0.1]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.11]} />
          <meshStandardMaterial color="#c98f6f" roughness={0.94} />
        </mesh>
        <mesh position={[0.62, 0.55, -0.16]} rotation={[0.2, -0.26, -0.1]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.11]} />
          <meshStandardMaterial color="#8fae9b" roughness={0.94} />
        </mesh>
      </group>

      {/* ================= 2 BEANBAG KREM ================= */}
      <group position={[0.05, 0, -0.3]}>
        <mesh position={[0, 0.26, 0]} scale={[1, 0.72, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.42, 18, 14]} />
          <meshStandardMaterial color="#efe4d2" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.47, 0.15]} scale={[0.7, 0.5, 0.5]} castShadow>
          <sphereGeometry args={[0.32, 16, 12]} />
          <meshStandardMaterial color="#e6d8c3" roughness={0.96} />
        </mesh>
      </group>
      <group position={[0.86, 0, 0.2]}>
        <mesh position={[0, 0.25, 0]} scale={[1, 0.7, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.38, 18, 14]} />
          <meshStandardMaterial color="#e2d6c4" roughness={0.96} />
        </mesh>
      </group>

      {/* ================= MEJA KOPI KAYU ================= */}
      <group position={[-0.55, 0, 0.42]}>
        <mesh position={[0, 0.33, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.06, 24]} />
          <meshStandardMaterial color="#8f6a41" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.3, 12]} />
          <meshStandardMaterial color="#7a5937" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.03, 20]} />
          <meshStandardMaterial color="#6c4c2e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.14, 0.4, 0.07]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.09, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0.11, 0.385, -0.09]} rotation={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.24, 0.035, 0.17]} />
          <meshStandardMaterial color="#b08a5f" roughness={0.8} />
        </mesh>
      </group>

      {/* ================= KURSI ROTAN GANTUNG (egg chair + stand) ================= */}
      <group position={[2.05, 0, -0.3]}>
        {/* stand lengkung */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.3, 0.34, 0.06, 18]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0.34, 0.95, 0]} rotation={[0, 0, -0.16]}>
          <cylinderGeometry args={[0.035, 0.045, 1.85, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.72} roughness={0.33} />
        </mesh>
        <mesh position={[0.06, 1.86, 0]} rotation={[0, 0, Math.PI / 2.35]}>
          <cylinderGeometry args={[0.032, 0.032, 0.66, 10]} />
          <meshStandardMaterial color="#475569" metalness={0.72} roughness={0.33} />
        </mesh>

        <group ref={swingRef} position={[-0.2, 0, 0]}>
          <mesh position={[0, 1.62, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
            <meshStandardMaterial color="#8a7052" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.94, 0]} castShadow>
            <sphereGeometry args={[0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.78]} />
            <meshStandardMaterial color="#c9a877" roughness={0.88} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.31, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color="#f3e8d6" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.98, 0.2]} rotation={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.28, 0.28, 0.1]} />
            <meshStandardMaterial color="#c98f6f" roughness={0.94} />
          </mesh>
        </group>
      </group>

      {/* ================= TANAMAN POT ================= */}
      {/* Monstera pojok barat */}
      <group position={[-2.78, 0, -0.5]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.14, 0.34, 14]} />
          <meshStandardMaterial color="#d8c9b2" roughness={0.9} />
        </mesh>
        {[
          [0, 0.58, 0, 0.3],
          [-0.15, 0.78, 0.05, -0.5],
          [0.13, 0.9, -0.05, 0.6],
          [0, 1.04, 0.02, 0.1],
        ].map(([x, y, z, rot], i) => (
          <mesh
            key={`monstera-${i}`}
            position={[x, y, z]}
            rotation={[0.2, rot, 0.3 * (i % 2 === 0 ? 1 : -1)]}
            castShadow
          >
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#2f6b3c" : "#3f8a4c"} roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* Lidah mertua di ujung barat */}
      <group position={[-2.78, 0, 0.55]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.11, 0.3, 12]} />
          <meshStandardMaterial color="#e7dccb" roughness={0.9} />
        </mesh>
        {[-0.06, 0, 0.06].map((dx, i) => (
          <mesh
            key={`snake-${i}`}
            position={[dx, 0.5 + i * 0.035, 0]}
            rotation={[0, 0, dx * 3]}
            castShadow
          >
            <coneGeometry args={[0.045, 0.56, 6]} />
            <meshStandardMaterial color="#3d6b45" roughness={0.86} />
          </mesh>
        ))}
      </group>

      {/* Lavender di dekat meja */}
      <group position={[-1.85, 0, 0.62]}>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.09, 0.22, 12]} />
          <meshStandardMaterial color="#cbb9a1" roughness={0.9} />
        </mesh>
        {[
          [-0.05, 0.33, 0],
          [0.02, 0.38, 0.04],
          [0.06, 0.31, -0.03],
        ].map(([x, y, z], i) => (
          <group key={`lav-${i}`} position={[x, y, z]}>
            <mesh>
              <cylinderGeometry args={[0.007, 0.007, 0.22, 6]} />
              <meshStandardMaterial color="#6f8f6a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial color="#9a7fc4" roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Palem mini di ujung timur menghadap pemandangan */}
      <group position={[2.8, 0, 0.6]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.14, 0.36, 14]} />
          <meshStandardMaterial color="#d5c6ae" roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={`palm-${i}`}
              position={[Math.cos(a) * 0.12, 0.62, Math.sin(a) * 0.12]}
              rotation={[Math.cos(a) * 0.5, a, Math.sin(a) * 0.5]}
              castShadow
            >
              <coneGeometry args={[0.07, 0.6, 6]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#3d8a52" : "#4c9a5e"}
                roughness={0.85}
              />
            </mesh>
          );
        })}
      </group>

      {/* ================= FAIRY LIGHTS ================= */}
      <group ref={fairyRef}>
        {fairyLights.map((l, i) => (
          <mesh key={`fairy-${i}`} position={l.pos}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshStandardMaterial
              color="#ffd9a0"
              emissive="#ffb35c"
              emissiveIntensity={glowIntensity}
              toneMapped={!isNight}
            />
          </mesh>
        ))}
      </group>

      {/* Cahaya hangat suasana balkon */}
      <pointLight
        position={[-0.6, 1.75, 0.2]}
        intensity={isNight ? 2.2 : 0.75}
        distance={6}
        decay={2}
        color="#ffc98a"
      />
    </group>
  );
}
