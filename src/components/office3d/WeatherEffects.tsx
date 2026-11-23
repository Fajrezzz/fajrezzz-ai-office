"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulator } from "@/store/SimulatorContext";

/** Dynamic 3D Rain, Storm Lightning & Volumetric Weather Fog (Mobile-Safe Instanced Mesh) */
export function WeatherEffects({ isHigh }: { isHigh: boolean }) {
  const { resolvedWeather } = useSimulator();
  const rainMeshRef = useRef<THREE.InstancedMesh>(null);
  const lightningRef = useRef<THREE.DirectionalLight>(null);

  const isRainy = resolvedWeather === "rain" || resolvedWeather === "storm";
  const count = isHigh ? 240 : 120;

  const drops = useMemo(
    () =>
      Array.from({ length: 240 }).map((_, i) => ({
        x: (((i * 73) % 86) - 43) + Math.sin(i) * 0.6,
        y: ((i * 29) % 28) + 2,
        z: (((i * 59) % 72) - 24) + Math.cos(i) * 0.6,
        speed: 18 + (i % 7) * 2.2,
      })),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (isRainy && rainMeshRef.current) {
      for (let i = 0; i < count; i++) {
        const d = drops[i];
        d.y -= d.speed * dt;
        if (d.y < 0.2) d.y = 28;
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, 0, resolvedWeather === "storm" ? 0.14 : 0.04);
        dummy.updateMatrix();
        rainMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      rainMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lightningRef.current) {
      if (resolvedWeather === "storm") {
        const t = state.clock.elapsedTime;
        const flash = Math.sin(t * 0.85) > 0.985 && Math.sin(t * 27) > 0.4;
        lightningRef.current.intensity = flash ? 3.8 : 0;
      } else {
        lightningRef.current.intensity = 0;
      }
    }
  });

  return (
    <group>
      {/* Dynamic Atmospheric Weather Fog */}
      {resolvedWeather === "fog" && (
        <fog attach="fog" args={["#94a3b8", 18, 72]} />
      )}
      {resolvedWeather === "storm" && (
        <fog attach="fog" args={["#1e293b", 22, 85]} />
      )}
      {resolvedWeather === "cloudy" && (
        <fog attach="fog" args={["#cbd5e1", 45, 130]} />
      )}

      {/* Instanced 3D Rain Streaks */}
      {isRainy && (
        <instancedMesh ref={rainMeshRef} args={[undefined, undefined, count]}>
          <cylinderGeometry args={[0.012, 0.012, 0.95, 4]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.48} />
        </instancedMesh>
      )}

      {/* Periodic Storm Lightning Flash */}
      <directionalLight
        ref={lightningRef}
        position={[18, 40, 12]}
        color="#e0f2fe"
        intensity={0}
      />
    </group>
  );
}
