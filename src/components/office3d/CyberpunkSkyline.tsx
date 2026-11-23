"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { LightingPreset, PerformanceMode } from "@/types/office";

interface CyberpunkSkylineProps {
  lightingPreset: LightingPreset;
  performanceMode: PerformanceMode;
}

interface TowerTier {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  style: number; // 0=slate glass, 1=obsidian cyber, 2=concrete+glass, 3=warm bronze
}

interface TowerCrown {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

interface SpireSpec {
  x: number;
  y: number;
  z: number;
  h: number;
}

const SKYLINE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vColor;

  void main() {
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(0.5, 0.65, 0.8);
    #endif

    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKYLINE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uNight;
  uniform float uSunset;
  uniform float uTime;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vColor;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // Roof faces (upward normal) stay dark architectural concrete/slate
    bool isRoof = abs(vWorldNormal.y) > 0.7;

    // Choose horizontal wall coordinate cleanly based on face orientation
    float uCoord = abs(vWorldNormal.x) > 0.5 ? vWorldPos.z : vWorldPos.x;
    float vCoord = vWorldPos.y;

    // Fine architectural window grid (1.15m wide bays, 2.35m floor-to-floor height)
    vec2 cell = vec2(floor(uCoord / 1.15), floor(vCoord / 2.35));
    vec2 local = vec2(fract(uCoord / 1.15), fract(vCoord / 2.35));

    // Crisp curtain-wall spandrel slab & vertical mullions
    float frameX = step(0.14, local.x) * step(local.x, 0.86);
    float frameY = step(0.24, local.y) * step(local.y, 0.84);
    float isWindow = (isRoof ? 0.0 : frameX * frameY);

    // Per-tower seed & organic clustered office floor occupancy
    float towerSeed = floor(vWorldPos.x * 0.12) * 13.7 + floor(vWorldPos.z * 0.12) * 7.3;
    float floorRand = hash21(vec2(cell.y, towerSeed));
    float roomRand = hash21(cell + vec2(towerSeed * 0.37, 1.9));
    float cluster = step(0.32, floorRand) * 0.28 + roomRand;

    // Gradual sunset light-up (32% lit) -> vibrant cyberpunk night (68% lit)
    float nightThreshold = mix(0.68, 0.34, uNight);
    float sunsetThreshold = 0.72;
    float litNight = smoothstep(nightThreshold - 0.04, nightThreshold + 0.04, cluster) * uNight;
    float litSunset = smoothstep(sunsetThreshold - 0.04, sunsetThreshold + 0.04, cluster) * uSunset;
    float litAmount = max(litNight, litSunset * 0.85);

    // Subtle interior horizontal blinds / ceiling gradient inside each lit window
    float windowGrad = mix(0.72, 1.15, local.y);

    // Base architectural facade colors per time of day
    vec3 dayFacade = mix(vColor * 0.52, vColor * 0.96, isWindow);
    // Subtle crisp sky gradient reflection on daytime glass
    float skyReflect = clamp((vWorldPos.y - 6.0) / 58.0, 0.0, 1.0);
    dayFacade += isWindow * vec3(0.08, 0.15, 0.24) * skyReflect;

    // Golden-hour sunset catches warm orange-magenta sheen on glass
    vec3 sunsetFacade = mix(vColor * 0.36, vColor * 0.62, isWindow) +
      isWindow * mix(vec3(0.42, 0.14, 0.28), vec3(0.62, 0.28, 0.1), skyReflect) * 0.65;

    // Sleek dark obsidian-navy night facade
    vec3 nightFacade = mix(vColor * 0.11, vColor * 0.19, isWindow);

    vec3 baseCol = mix(dayFacade, sunsetFacade, uSunset);
    baseCol = mix(baseCol, nightFacade, uNight);

    // Directional subtle face shading so stepped setbacks read crisply in 3D
    float faceShade = 0.82 + 0.24 * max(dot(vWorldNormal, normalize(vec3(0.5, 0.7, 0.5))), 0.0);
    baseCol *= faceShade;

    // Realistic real-world skyscraper window lights: ONLY warm yellow/gold & crisp office white
    float palettePick = hash21(cell + vec2(9.1, 4.7));
    vec3 winCol = vec3(1.0, 0.85, 0.48); // warm architectural yellow
    if (palettePick > 0.66) {
      winCol = vec3(0.96, 0.97, 1.0); // crisp clean white office
    } else if (palettePick > 0.36) {
      winCol = vec3(1.0, 0.93, 0.72); // soft warm cream-white
    }

    // Gentle living shimmer on a tiny fraction of windows
    float subtleBlink = 0.94 + 0.06 * sin(uTime * 1.4 + roomRand * 40.0);
    vec3 emissiveWin = winCol * isWindow * litAmount * windowGrad * subtleBlink * (uNight > 0.5 ? 1.55 : 1.05);

    vec3 finalCol = baseCol + emissiveWin;

    // Smooth atmospheric distance fog (preserves glowing windows softly in night haze)
    float dist = length(cameraPosition - vWorldPos);
    float fogFactor = smoothstep(uFogNear, uFogFar, dist);
    float nightFogScale = uNight > 0.5 ? 0.58 : (uSunset > 0.5 ? 0.48 : 0.22);
    finalCol = mix(finalCol, uFogColor, fogFactor * nightFogScale);

    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

export function CyberpunkSkyline({
  lightingPreset,
}: CyberpunkSkylineProps) {
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  // Build a varied 24-tower metropolis with stepped architectural setbacks, varied materials & heights
  const { tiers, crowns, spires } = useMemo(() => {
    const rawTowers: {
      x: number;
      z: number;
      w: number;
      h: number;
      d: number;
      style: number;
      setbacks: number;
      spire: boolean;
    }[] = [
      // Mid-background panoramic skyline arc (varied heights, widths, setbacks, materials)
      { x: -78, z: -56, w: 11, h: 38, d: 10, style: 0, setbacks: 1, spire: false },
      { x: -64, z: -66, w: 12, h: 56, d: 11, style: 1, setbacks: 2, spire: true },
      { x: -50, z: -54, w: 9.5, h: 32, d: 9, style: 2, setbacks: 1, spire: false },
      { x: -39, z: -72, w: 13, h: 66, d: 12, style: 0, setbacks: 2, spire: true },
      { x: -26, z: -60, w: 10, h: 42, d: 9.5, style: 3, setbacks: 1, spire: false },
      { x: -14, z: -78, w: 13.5, h: 74, d: 12, style: 1, setbacks: 2, spire: true },
      { x: -1, z: -64, w: 10.5, h: 48, d: 10, style: 2, setbacks: 1, spire: false },
      { x: 12, z: -74, w: 12.5, h: 68, d: 11.5, style: 0, setbacks: 2, spire: true },
      { x: 25, z: -58, w: 9.5, h: 36, d: 9, style: 3, setbacks: 1, spire: false },
      { x: 37, z: -70, w: 13, h: 62, d: 12, style: 1, setbacks: 2, spire: true },
      { x: 51, z: -56, w: 10.5, h: 44, d: 10, style: 2, setbacks: 1, spire: false },
      { x: 64, z: -64, w: 12, h: 54, d: 11, style: 0, setbacks: 2, spire: true },
      { x: 78, z: -54, w: 10, h: 34, d: 9.5, style: 3, setbacks: 1, spire: false },
      // Deep horizon secondary towers for dense layered city silhouette
      { x: -55, z: -86, w: 14, h: 52, d: 12, style: 2, setbacks: 1, spire: false },
      { x: -29, z: -90, w: 14, h: 58, d: 12, style: 1, setbacks: 1, spire: false },
      { x: 5, z: -92, w: 15, h: 64, d: 13, style: 0, setbacks: 2, spire: false },
      { x: 31, z: -88, w: 14, h: 56, d: 12, style: 3, setbacks: 1, spire: false },
      { x: 58, z: -84, w: 13, h: 48, d: 11, style: 1, setbacks: 1, spire: false },
      // Flank city towers (west & east sides)
      { x: -72, z: -30, w: 10, h: 34, d: 9.5, style: 2, setbacks: 1, spire: false },
      { x: -64, z: -12, w: 9, h: 26, d: 9, style: 0, setbacks: 0, spire: false },
      { x: 72, z: -30, w: 10, h: 36, d: 9.5, style: 1, setbacks: 1, spire: false },
      { x: 64, z: -12, w: 9, h: 28, d: 9, style: 3, setbacks: 0, spire: false },
    ];

    const tierList: TowerTier[] = [];
    const crownList: TowerCrown[] = [];
    const spireList: SpireSpec[] = [];

    const crownPalette = ["#fde68a", "#f8fafc", "#fef3c7", "#fffbeb"];

    rawTowers.forEach((t, idx) => {
      if (t.setbacks === 0) {
        tierList.push({
          x: t.x,
          y: t.h / 2,
          z: t.z,
          w: t.w,
          h: t.h,
          d: t.d,
          style: t.style,
        });
        crownList.push({
          x: t.x,
          y: t.h + 0.16,
          z: t.z,
          w: t.w + 0.18,
          d: t.d + 0.18,
          color: crownPalette[idx % crownPalette.length],
        });
      } else if (t.setbacks === 1) {
        const h1 = t.h * 0.64;
        const h2 = t.h * 0.36;
        tierList.push({
          x: t.x,
          y: h1 / 2,
          z: t.z,
          w: t.w,
          h: h1,
          d: t.d,
          style: t.style,
        });
        tierList.push({
          x: t.x,
          y: h1 + h2 / 2,
          z: t.z,
          w: t.w * 0.74,
          h: h2,
          d: t.d * 0.74,
          style: t.style,
        });
        crownList.push({
          x: t.x,
          y: t.h + 0.18,
          z: t.z,
          w: t.w * 0.76,
          d: t.d * 0.76,
          color: crownPalette[idx % crownPalette.length],
        });
      } else {
        // 3-tier architectural setback skyscraper (Podium + Mid Shaft + Crown Tower)
        const h1 = t.h * 0.38;
        const h2 = t.h * 0.36;
        const h3 = t.h * 0.26;
        tierList.push({
          x: t.x,
          y: h1 / 2,
          z: t.z,
          w: t.w,
          h: h1,
          d: t.d,
          style: t.style,
        });
        tierList.push({
          x: t.x,
          y: h1 + h2 / 2,
          z: t.z,
          w: t.w * 0.78,
          h: h2,
          d: t.d * 0.78,
          style: t.style,
        });
        tierList.push({
          x: t.x,
          y: h1 + h2 + h3 / 2,
          z: t.z,
          w: t.w * 0.56,
          h: h3,
          d: t.d * 0.56,
          style: t.style,
        });
        crownList.push({
          x: t.x,
          y: t.h + 0.18,
          z: t.z,
          w: t.w * 0.58,
          d: t.d * 0.58,
          color: crownPalette[idx % crownPalette.length],
        });
      }

      if (t.spire) {
        spireList.push({
          x: t.x,
          y: t.h + 4.5,
          z: t.z,
          h: 9.0,
        });
      }
    });

    return {
      tiers: tierList,
      crowns: crownList,
      spires: spireList,
    };
  }, []);

  const tierMeshRef = useRef<THREE.InstancedMesh>(null);
  const crownMeshRef = useRef<THREE.InstancedMesh>(null);
  const spireMeshRef = useRef<THREE.InstancedMesh>(null);
  const beaconMeshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const shaderUniforms = useMemo(
    () => ({
      uNight: { value: 0 },
      uSunset: { value: 0 },
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color("#0c1630") },
      uFogNear: { value: 75 },
      uFogFar: { value: 210 },
    }),
    []
  );

  // Populate InstancedMesh matrices & varied material tones once
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const styleColors = [
      new THREE.Color("#6b90b2"), // slate blue glass
      new THREE.Color("#496380"), // obsidian cyber steel-glass
      new THREE.Color("#8ea0b2"), // brushed architectural concrete
      new THREE.Color("#8f7e72"), // warm architectural bronze-glass
    ];

    if (tierMeshRef.current) {
      tiers.forEach((t, i) => {
        dummy.position.set(t.x, t.y, t.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(t.w, t.h, t.d);
        dummy.updateMatrix();
        tierMeshRef.current!.setMatrixAt(i, dummy.matrix);
        tierMeshRef.current!.setColorAt(i, styleColors[t.style % styleColors.length]);
      });
      tierMeshRef.current.instanceMatrix.needsUpdate = true;
      if (tierMeshRef.current.instanceColor) {
        tierMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (crownMeshRef.current) {
      const col = new THREE.Color();
      crowns.forEach((c, i) => {
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(c.w, 0.36, c.d);
        dummy.updateMatrix();
        crownMeshRef.current!.setMatrixAt(i, dummy.matrix);
        col.set(c.color);
        crownMeshRef.current!.setColorAt(i, col);
      });
      crownMeshRef.current.instanceMatrix.needsUpdate = true;
      if (crownMeshRef.current.instanceColor) {
        crownMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (spireMeshRef.current && beaconMeshRef.current) {
      spires.forEach((s, i) => {
        dummy.position.set(s.x, s.y, s.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, s.h, 1);
        dummy.updateMatrix();
        spireMeshRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(s.x, s.y + s.h / 2 + 0.25, s.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        beaconMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      spireMeshRef.current.instanceMatrix.needsUpdate = true;
      beaconMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [tiers, crowns, spires]);

  useFrame((state) => {
    if (!shaderRef.current) return;
    const u = shaderRef.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uNight.value = isNight ? 1.0 : 0.0;
    u.uSunset.value = isSunset ? 1.0 : 0.0;
    u.uFogColor.value.set(
      isNight ? "#0c1630" : isSunset ? "#a84461" : "#7cc0f0"
    );
    u.uFogNear.value = isNight ? 72 : isSunset ? 84 : 185;
    u.uFogFar.value = isNight ? 205 : isSunset ? 225 : 360;
  });

  return (
    <group>
      {/* 1 Single GPU InstancedMesh for ALL 24 Varied Setback Skyscrapers with Procedural GLSL Windows! */}
      <instancedMesh
        ref={tierMeshRef}
        args={[undefined, undefined, tiers.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={SKYLINE_VERTEX_SHADER}
          fragmentShader={SKYLINE_FRAGMENT_SHADER}
          uniforms={shaderUniforms}
        />
      </instancedMesh>

      {/* Instanced Glowing Neon Crown Bands (Gradual glow at Sunset, Vivid Cyan/Magenta at Night) */}
      {(isNight || isSunset) && (
        <instancedMesh
          ref={crownMeshRef}
          args={[undefined, undefined, crowns.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={isNight ? 0.95 : 0.55}
            toneMapped={false}
          />
        </instancedMesh>
      )}

      {/* Instanced Skyscraper Spires */}
      <instancedMesh
        ref={spireMeshRef}
        args={[undefined, undefined, spires.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.07, 0.24, 1, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.3} />
      </instancedMesh>

      {/* Instanced Red Aviation Warning Beacons at Spire Tips */}
      {(isNight || isSunset) && (
        <instancedMesh
          ref={beaconMeshRef}
          args={[undefined, undefined, spires.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ff3344" toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
