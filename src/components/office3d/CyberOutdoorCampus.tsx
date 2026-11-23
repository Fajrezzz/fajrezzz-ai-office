"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { getRealisticTextures } from "@/components/office3d/realisticTextures";
import { CyberpunkSkyline } from "@/components/office3d/CyberpunkSkyline";
import { CYBERPUNK_THEME } from "@/lib/config/cyberpunk-theme";
import { useOffice } from "@/store/OfficeContext";
import type {
  LightingPreset,
  PerformanceMode,
  Vector3Tuple,
} from "@/types/office";

interface CyberOutdoorCampusProps {
  performanceMode: PerformanceMode;
  lightingPreset: LightingPreset;
  onFocusPoint?: (point: Vector3Tuple) => void;
}

/** Realistic arched tropical coconut palm tree with ringed curved trunk & organic feathered fronds */
function PalmTree({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}) {
  const crownRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => (position[0] * 0.37 + position[2] * 0.21) % (Math.PI * 2), [position]);

  // Sculpted tapered curved organic palm leaflet geometry (zero blocky rectangles!)
  const { frondGeo, trunkSegments, frondConfigs } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.45, 0.24, 1.15, 0.2);
    shape.quadraticCurveTo(1.85, 0.14, 2.55, 0.0);
    shape.quadraticCurveTo(1.85, -0.14, 1.15, -0.2);
    shape.quadraticCurveTo(0.45, -0.24, 0, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: false,
      curveSegments: 10,
    });
    geo.rotateX(-Math.PI / 2);

    // Bend vertices downward into a graceful natural arching palm frond curve!
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const t = Math.max(0, x / 2.55);
      // Natural parabolic upward launch then graceful downward droop + slight V-fold across leaflet width
      const archY = Math.sin(t * Math.PI * 0.85) * 0.48 - t * t * 0.92 - Math.abs(z) * 0.34;
      posAttr.setY(i, y + archY);
    }
    geo.computeVertexNormals();

    // 9 organic tapered bark rings forming a natural gentle curved trunk
    const rings = Array.from({ length: 9 }).map((_, i) => {
      const f = i / 8;
      return {
        y: 0.45 + i * 0.54,
        x: Math.pow(f, 1.6) * 0.34,
        z: Math.pow(f, 1.5) * 0.14,
        rTop: 0.21 - f * 0.105,
        rBot: 0.245 - f * 0.11,
        tiltZ: -0.04 - f * 0.06,
        color: i === 8 ? "#4d6b34" : i % 2 === 0 ? "#7a6149" : "#6c533c",
      };
    });

    // 14 lush overlapping fronds in 2 natural canopy tiers (lower cascading + upper arching)
    const fronds = Array.from({ length: 14 }).map((_, idx) => {
      const upper = idx >= 8;
      const countInTier = upper ? 6 : 8;
      const localIdx = upper ? idx - 8 : idx;
      const angle = (localIdx / countInTier) * Math.PI * 2 + (upper ? 0.35 : 0);
      return {
        angle,
        pitch: upper ? 0.42 : 0.06,
        scale: upper ? 0.84 : 1.06,
        color: upper
          ? localIdx % 2 === 0
            ? "#468934"
            : "#3b7b2b"
          : localIdx % 2 === 0
            ? "#2f6c25"
            : "#275e20",
      };
    });

    return { frondGeo: geo, trunkSegments: rings, frondConfigs: fronds };
  }, []);

  useFrame((state) => {
    if (!crownRef.current) return;
    const t = state.clock.elapsedTime;
    crownRef.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.032;
    crownRef.current.rotation.x = Math.cos(t * 0.72 + phase) * 0.022;
  });

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Decorative limestone planter ring + rich soil bed */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.48, 0.52, 0.2, 18]} />
        <meshStandardMaterial color="#dbd5ca" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
        <meshStandardMaterial color="#3f3124" roughness={0.96} />
      </mesh>

      {/* Ringed tapered fibrous palm trunk */}
      {trunkSegments.map((seg, i) => (
        <mesh
          key={i}
          position={[seg.x, seg.y, seg.z]}
          rotation={[0.03, 0, seg.tiltZ]}
          castShadow
        >
          <cylinderGeometry args={[seg.rTop, seg.rBot, 0.58, 12]} />
          <meshStandardMaterial color={seg.color} roughness={0.92} />
        </mesh>
      ))}

      {/* Gently swaying organic palm frond canopy + coconut cluster */}
      <group ref={crownRef} position={[0.35, 5.05, 0.14]}>
        {/* Green palm heart crownshaft */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color="#466b2e" roughness={0.84} />
        </mesh>

        {/* 14 Gracefully Arched Organic Feathery Fronds */}
        {frondConfigs.map((f, idx) => (
          <group key={idx} rotation={[0, f.angle, f.pitch]} scale={f.scale}>
            {/* Curved tapered frond blade */}
            <mesh geometry={frondGeo} castShadow receiveShadow>
              <meshStandardMaterial
                color={f.color}
                roughness={0.68}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Feathered secondary side leaflet ribs for botanical realism */}
            {[0.45, 0.85, 1.25, 1.65, 2.0].map((lx, li) => {
              const t = lx / 2.55;
              const archY = Math.sin(t * Math.PI * 0.85) * 0.48 - t * t * 0.92;
              const span = (1 - Math.abs(t - 0.42) * 1.15) * 0.42;
              return (
                <group key={li} position={[lx, archY, 0]}>
                  <mesh position={[0, -0.05, span * 0.58]} rotation={[0.42, -0.32, 0]} castShadow>
                    <coneGeometry args={[0.045, Math.max(0.24, span * 1.25), 4]} />
                    <meshStandardMaterial color={f.color} roughness={0.7} />
                  </mesh>
                  <mesh position={[0, -0.05, -span * 0.58]} rotation={[-0.42, 0.32, 0]} castShadow>
                    <coneGeometry args={[0.045, Math.max(0.24, span * 1.25), 4]} />
                    <meshStandardMaterial color={f.color} roughness={0.7} />
                  </mesh>
                </group>
              );
            })}
          </group>
        ))}

        {/* Cluster of Realistic Tropical Coconuts */}
        {[
          [0.12, -0.18, 0.1],
          [-0.11, -0.2, 0.08],
          [0.02, -0.22, -0.12],
          [-0.08, -0.24, -0.06],
        ].map((cp, ci) => (
          <mesh key={ci} position={cp as [number, number, number]} castShadow>
            <sphereGeometry args={[0.095, 10, 10]} />
            <meshStandardMaterial color={ci % 2 === 0 ? "#684420" : "#56381a"} roughness={0.84} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PoolUmbrella({
  position,
  accentColor = "#1d4e6f",
}: {
  position: [number, number, number];
  accentColor?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.14, 16]} />
        <meshStandardMaterial color="#424952" roughness={0.62} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.046, 2.58, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 2.58, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.64, 0.52, 8]} />
        <meshStandardMaterial color="#f6f1e7" roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[1.65, 0.46, 4]} />
        <meshStandardMaterial color={accentColor} roughness={0.84} />
      </mesh>
      <mesh position={[0, 2.86, 0]}>
        <sphereGeometry args={[0.068, 10, 10]} />
        <meshStandardMaterial color="#d4af37" metalness={0.86} roughness={0.18} />
      </mesh>
    </group>
  );
}

function SunLounger({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.09, 2.05]} />
        <meshStandardMaterial color="#875d38" roughness={0.72} />
      </mesh>
      {[
        [-0.34, 0.11, -0.82],
        [0.34, 0.11, -0.82],
        [-0.34, 0.11, 0.82],
        [0.34, 0.11, 0.82],
      ].map((leg, i) => (
        <mesh key={i} position={leg as [number, number, number]} castShadow>
          <boxGeometry args={[0.07, 0.22, 0.07]} />
          <meshStandardMaterial color="#6c4727" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, 0.34, 0.16]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.11, 1.38]} />
        <meshStandardMaterial color="#f8f5ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.56, -0.68]} rotation={[0.52, 0, 0]} castShadow>
        <boxGeometry args={[0.74, 0.11, 0.72]} />
        <meshStandardMaterial color="#f8f5ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.74, -0.79]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.46, 0.09, 0.22]} />
        <meshStandardMaterial color="#0284c7" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Live animated Trading Terminal canvas texture rendered INSIDE the Bot Trading laptop screen */
function createTradingChartTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const baseCandles = [
    { o: 0.36, c: 0.44, h: 0.48, l: 0.32 },
    { o: 0.44, c: 0.4, h: 0.47, l: 0.37 },
    { o: 0.4, c: 0.51, h: 0.55, l: 0.38 },
    { o: 0.51, c: 0.58, h: 0.62, l: 0.48 },
    { o: 0.58, c: 0.53, h: 0.61, l: 0.5 },
    { o: 0.53, c: 0.64, h: 0.69, l: 0.52 },
    { o: 0.64, c: 0.61, h: 0.68, l: 0.57 },
    { o: 0.61, c: 0.72, h: 0.76, l: 0.59 },
    { o: 0.72, c: 0.68, h: 0.75, l: 0.64 },
    { o: 0.68, c: 0.79, h: 0.83, l: 0.66 },
    { o: 0.79, c: 0.84, h: 0.89, l: 0.75 },
    { o: 0.84, c: 0.81, h: 0.87, l: 0.78 },
    { o: 0.81, c: 0.9, h: 0.94, l: 0.8 },
  ];

  const draw = (t: number) => {
    if (!ctx) return;
    // Deep TradingView Terminal Dark Background
    ctx.fillStyle = "#060d18";
    ctx.fillRect(0, 0, 512, 320);

    // Top Trading Header Bar
    ctx.fillStyle = "#0b1628";
    ctx.fillRect(0, 0, 512, 42);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 16px monospace";
    ctx.fillText("BTC/USDT", 16, 26);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 15px monospace";
    const livePct = (4.82 + Math.sin(t * 1.4) * 0.42).toFixed(2);
    ctx.fillText(`+${livePct}%  LIVE BOT`, 122, 26);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(422, 11, 76, 20);
    ctx.fillStyle = "#022c22";
    ctx.font = "bold 11px monospace";
    ctx.fillText("AUTO LONG", 429, 25);

    // Crisp Subtle Trading Grid Lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.11)";
    ctx.lineWidth = 1;
    for (let gy = 70; gy <= 260; gy += 38) {
      ctx.beginPath();
      ctx.moveTo(14, gy);
      ctx.lineTo(498, gy);
      ctx.stroke();
    }
    for (let gx = 48; gx <= 480; gx += 62) {
      ctx.beginPath();
      ctx.moveTo(gx, 48);
      ctx.lineTo(gx, 280);
      ctx.stroke();
    }

    // Candlesticks + Volume Bars
    const chartTop = 58;
    const chartBottom = 250;
    const chartH = chartBottom - chartTop;
    const emaPts: [number, number][] = [];

    baseCandles.forEach((raw, idx) => {
      const wave = idx === baseCandles.length - 1 ? Math.sin(t * 3.1) * 0.045 : Math.sin(t * 0.9 + idx) * 0.012;
      const o = raw.o;
      const c = Math.max(0.15, Math.min(0.95, raw.c + wave));
      const h = Math.max(o, c, raw.h + Math.max(0, wave));
      const l = Math.min(o, c, raw.l + Math.min(0, wave));
      const bullish = c >= o;

      const x = 28 + idx * 35;
      const yO = chartBottom - o * chartH;
      const yC = chartBottom - c * chartH;
      const yH = chartBottom - h * chartH;
      const yL = chartBottom - l * chartH;

      // Volume bar at bottom
      ctx.fillStyle = bullish ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)";
      const volH = 14 + ((idx * 17) % 24);
      ctx.fillRect(x - 8, 306 - volH, 16, volH);

      // Candlestick Wick
      ctx.strokeStyle = bullish ? "#4ade80" : "#f87171";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x, yH);
      ctx.lineTo(x, yL);
      ctx.stroke();

      // Candlestick Body
      ctx.fillStyle = bullish ? "#22c55e" : "#ef4444";
      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(6, Math.abs(yC - yO));
      ctx.fillRect(x - 9, bodyTop, 18, bodyH);

      emaPts.push([x, (yO + yC) * 0.5 + 8]);
    });

    // Golden Smooth EMA-20 Trend Curve
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    emaPts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Dashed Live Price Line
    const lastY = emaPts[emaPts.length - 1][1] - 10;
    ctx.strokeStyle = "rgba(34, 197, 94, 0.72)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(14, lastY);
    ctx.lineTo(498, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    tex.needsUpdate = true;
  };

  draw(0);
  return { tex, draw };
}

/** Relaxed Poolside Trading Bot Reclining Flush on the Sun Lounger with Live Candlestick Trading Chart Inside His Laptop */
function PoolsideTradingBot({
  position,
  rotationY = Math.PI / 2,
  isNight,
  showLabel,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
  showLabel: boolean;
}) {
  const headRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const lastDrawRef = useRef(0);

  const chart = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createTradingChartTexture();
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.75) * 0.12;
      headRef.current.rotation.x = 0.28 + Math.sin(t * 1.2) * 0.03;
    }
    if (leftHandRef.current && rightHandRef.current) {
      leftHandRef.current.position.y = 0.625 + Math.sin(t * 8.5) * 0.01;
      rightHandRef.current.position.y = 0.625 + Math.cos(t * 9.2) * 0.01;
    }
    // Smooth live tick update inside the laptop screen (~3 FPS, zero perf cost!)
    if (chart && t - lastDrawRef.current > 0.34) {
      lastDrawRef.current = t;
      chart.draw(t);
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Hips & Relaxed Swim Shorts Seated Flush on the White Mattress */}
      <mesh position={[0, 0.45, -0.02]} castShadow>
        <boxGeometry args={[0.36, 0.16, 0.32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.78} />
      </mesh>

      {/* Thighs Gently Raised to Cradle the Laptop Comfortably (Facing +Z toward Swimming Pool!) */}
      <mesh position={[-0.11, 0.5, 0.26]} rotation={[1.38, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.32, 6, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.76} />
      </mesh>
      <mesh position={[0.11, 0.5, 0.26]} rotation={[1.38, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.32, 6, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.76} />
      </mesh>

      {/* Lower Legs Stretched Smoothly Along the Sun Lounger Toward the Pool */}
      <mesh position={[-0.11, 0.46, 0.64]} rotation={[1.66, 0, 0]} castShadow>
        <capsuleGeometry args={[0.058, 0.38, 6, 10]} />
        <meshStandardMaterial color="#d8a986" roughness={0.68} />
      </mesh>
      <mesh position={[0.11, 0.46, 0.64]} rotation={[1.66, 0, 0]} castShadow>
        <capsuleGeometry args={[0.058, 0.38, 6, 10]} />
        <meshStandardMaterial color="#d8a986" roughness={0.68} />
      </mesh>

      {/* Relaxed Pool Slides */}
      <mesh position={[-0.11, 0.45, 0.9]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.1, 0.045, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0.11, 0.45, 0.9]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.1, 0.045, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Reclined Torso Lying Flush Along the Angled Backrest (Exact Match to Backrest Angle!) */}
      <group position={[0, 0.54, -0.34]} rotation={[-1.02, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.38, 0.46, 0.18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
        {/* Subtle Emerald-Cyan Bot Chest Trim */}
        <mesh position={[0, 0.26, 0.095]}>
          <boxGeometry args={[0.22, 0.042, 0.015]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#10b981"
            emissiveIntensity={isNight ? 1.3 : 0.65}
          />
        </mesh>
      </group>

      {/* Head Resting Comfortably on the Blue Pillow Looking Down at the Laptop Chart */}
      <group ref={headRef} position={[0, 0.83, -0.68]}>
        <mesh castShadow>
          <sphereGeometry args={[0.145, 16, 14]} />
          <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.32} />
        </mesh>
        {/* Sleek Metallic Bot Ear Fins */}
        <mesh position={[-0.15, 0.02, 0]}>
          <boxGeometry args={[0.036, 0.09, 0.07]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.95} />
        </mesh>
        <mesh position={[0.15, 0.02, 0]}>
          <boxGeometry args={[0.036, 0.09, 0.07]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.95} />
        </mesh>
        {/* Glowing Emerald-Cyan Trading Visor Glasses */}
        <mesh position={[0, 0.01, 0.128]}>
          <boxGeometry args={[0.21, 0.068, 0.036]} />
          <meshStandardMaterial
            color="#34d399"
            emissive="#10b981"
            emissiveIntensity={isNight ? 1.7 : 0.95}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Natural Bent Arms Reaching Smoothly from Shoulders to the Laptop Keyboard */}
      <mesh position={[-0.21, 0.65, -0.24]} rotation={[1.22, 0, -0.18]} castShadow>
        <capsuleGeometry args={[0.044, 0.3, 6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.62} />
      </mesh>
      <mesh position={[0.21, 0.65, -0.24]} rotation={[1.22, 0, 0.18]} castShadow>
        <capsuleGeometry args={[0.044, 0.3, 6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.62} />
      </mesh>
      <mesh position={[-0.16, 0.62, 0.02]} rotation={[1.5, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.038, 0.24, 6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh position={[0.16, 0.62, 0.02]} rotation={[1.5, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.038, 0.24, 6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Hands Typing Directly on the Laptop Keyboard */}
      <mesh ref={leftHandRef} position={[-0.1, 0.625, 0.16]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.1, 0.625, 0.16]}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Sleek Open Trading Laptop Resting Cleanly on His Lap — LIVE CANDLESTICK CHART INSIDE SCREEN! */}
      <group position={[0, 0.59, 0.24]}>
        {/* Aluminum Laptop Base Chassis */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.022, 0.32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.24} />
        </mesh>
        {/* Dark Recessed Keyboard Deck */}
        <mesh position={[0, 0.013, -0.01]}>
          <boxGeometry args={[0.42, 0.005, 0.19]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Subtle Trackpad */}
        <mesh position={[0, 0.013, -0.12]}>
          <boxGeometry args={[0.14, 0.004, 0.07]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Open Laptop Lid Angled Directly Toward Bot's Eyes (Live Chart Screen Inside!) */}
        <group position={[0, 0.155, 0.155]} rotation={[-0.24, 0, 0]}>
          {/* Machined Silver Rear Lid */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.32, 0.016]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
          </mesh>
          {/* Glowing Mini Brand Emblem on Rear Lid Facing Pool */}
          <mesh position={[0, 0.01, 0.01]}>
            <circleGeometry args={[0.032, 16]} />
            <meshStandardMaterial
              color="#34d399"
              emissive="#10b981"
              emissiveIntensity={0.85}
            />
          </mesh>
          {/* Matte Black Screen Bezel Facing Bot (-Z) */}
          <mesh position={[0, 0, -0.009]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.48, 0.3]} />
            <meshStandardMaterial color="#090d16" roughness={0.4} />
          </mesh>
          {/* HIGH-RES LIVE CANDLESTICK TRADING CHART DIRECTLY INSIDE THE LAPTOP DISPLAY! */}
          <mesh position={[0, 0, -0.011]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.455, 0.275]} />
            <meshStandardMaterial
              map={chart?.tex ?? undefined}
              emissiveMap={chart?.tex ?? undefined}
              emissive="#ffffff"
              emissiveIntensity={isNight ? 1.15 : 0.72}
              roughness={0.22}
            />
          </mesh>
        </group>
      </group>

      {/* Clean Floating Pill Label */}
      {showLabel && (
        <Html position={[0, 1.38, -0.15]} center distanceFactor={14} zIndexRange={[10, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-emerald-400/70 bg-slate-950/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300 shadow-lg">
            📈 BOT TRADING · AUTO
          </div>
        </Html>
      )}
    </group>
  );
}

/** Circular Architectural Courtyard Water Fountain with Slow Shifting RGB Neon Glow */
function CyberpunkRGBFountain({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const jetMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const jetGroupRef = useRef<THREE.Group>(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const hue = (t * 0.08) % 1;
    tmpColor.setHSL(hue, 0.92, 0.56);
    if (ringMatRef.current) {
      ringMatRef.current.color.copy(tmpColor);
      ringMatRef.current.emissive.copy(tmpColor);
    }
    if (jetMatRef.current) {
      jetMatRef.current.emissive.copy(tmpColor);
    }
    if (jetGroupRef.current) {
      jetGroupRef.current.scale.y = 0.88 + Math.sin(t * 4.2) * 0.14;
      jetGroupRef.current.rotation.y = t * 0.6;
    }
  });

  const emissiveBoost = isNight
    ? CYBERPUNK_THEME.intensity.fountainNight
    : CYBERPUNK_THEME.intensity.fountainDay;

  return (
    <group position={position}>
      {/* Circular Limestone Basin Wall */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.62, 1.72, 0.48, 28]} />
        <meshStandardMaterial color="#e2ddd4" roughness={0.58} />
      </mesh>
      {/* Inner Water Surface */}
      <mesh position={[0, 0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.44, 24]} />
        <meshPhysicalMaterial
          color="#0284c7"
          roughness={0.14}
          metalness={0.15}
          transparent
          opacity={0.86}
        />
      </mesh>
      {/* Animated RGB Neon Ring Around Inner Water Rim */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.045, 10, 32]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color={CYBERPUNK_THEME.neon.cyan}
          emissive={CYBERPUNK_THEME.neon.cyanEmissive}
          emissiveIntensity={emissiveBoost}
        />
      </mesh>
      {/* Center Sculpted Tiered Pedestal */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.48, 0.55, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.84, 0]} castShadow>
        <cylinderGeometry args={[0.68, 0.28, 0.18, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      {/* Animated Glowing RGB Water Jets */}
      <group ref={jetGroupRef} position={[0, 0.92, 0]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.045, 0.14, 0.84, 12]} />
          <meshStandardMaterial
            ref={jetMatRef}
            color="#e0f2fe"
            emissive={CYBERPUNK_THEME.neon.cyan}
            emissiveIntensity={emissiveBoost * 0.72}
            transparent
            opacity={0.78}
          />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((ji) => {
          const ang = (ji / 6) * Math.PI * 2;
          return (
            <mesh
              key={ji}
              position={[Math.cos(ang) * 0.46, 0.18, Math.sin(ang) * 0.46]}
              rotation={[Math.sin(ang) * 0.45, 0, -Math.cos(ang) * 0.45]}
            >
              <cylinderGeometry args={[0.022, 0.04, 0.52, 8]} />
              <meshStandardMaterial
                color="#e0f2fe"
                emissive={CYBERPUNK_THEME.neon.magenta}
                emissiveIntensity={isNight ? 0.95 : 0.3}
                transparent
                opacity={0.68}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Iconic Lugano Blue Porsche 911 Carrera 992.2 — Sculpted Fastback Coupe, Full-Width Rear Lightbar & 5-Spoke Bi-Color Wheels */
function Porsche22Car({
  position,
  rotationY = -0.34,
  isNight,
}: {
  position: [number, number, number];
  rotationY?: number;
  isNight: boolean;
}) {
  // Iconic Porsche 911 (992 / 2022) side silhouette: low sloping hood, rounded frog-eye fenders, smooth continuous fastback roofline!
  const { bodyGeo, cabinGeo } = useMemo(() => {
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-2.22, 0.24); // rear diffuser bottom
    bodyShape.lineTo(2.24, 0.22); // front GT3 splitter
    bodyShape.quadraticCurveTo(2.36, 0.44, 2.04, 0.62); // signature rounded Porsche front nose
    bodyShape.quadraticCurveTo(1.56, 0.72, 0.96, 0.78); // low sloping Porsche hood
    bodyShape.quadraticCurveTo(0.42, 1.24, -0.18, 1.24); // iconic arched Porsche 911 roof dome
    bodyShape.quadraticCurveTo(-1.18, 1.22, -2.02, 0.84); // unmistakable continuous 911 fastback sweep!
    bodyShape.quadraticCurveTo(-2.26, 0.74, -2.26, 0.56); // sculpted wide rear bumper
    bodyShape.lineTo(-2.22, 0.24);

    const extrudedBody = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 1.82,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.12,
      bevelSegments: 5,
      curveSegments: 20,
    });
    extrudedBody.center();
    extrudedBody.rotateY(-Math.PI / 2);

    // Sleek Porsche 911 greenhouse glass profile
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-1.52, 0.8);
    cabinShape.lineTo(0.86, 0.78);
    cabinShape.quadraticCurveTo(0.36, 1.21, -0.18, 1.21);
    cabinShape.quadraticCurveTo(-0.96, 1.18, -1.52, 0.8);

    const extrudedCabin = new THREE.ExtrudeGeometry(cabinShape, {
      depth: 1.38,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 16,
    });
    extrudedCabin.center();
    extrudedCabin.rotateY(-Math.PI / 2);

    return { bodyGeo: extrudedBody, cabinGeo: extrudedCabin };
  }, []);

  const wheelCoords: [number, number, number][] = [
    [-1.0, 0.36, 1.32],
    [1.0, 0.36, 1.32],
    [-1.0, 0.36, -1.3],
    [1.0, 0.36, -1.3],
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Sculpted Glossy Lugano Blue Metallic Porsche 911 Carrera 992.2 Body */}
      <mesh geometry={bodyGeo} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#0f62d6"
          metalness={0.56}
          roughness={0.13}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Glossy Tinted Glass Porsche 911 992.2 Greenhouse */}
      <mesh geometry={cabinGeo} position={[0, 0.96, -0.16]} castShadow>
        <meshPhysicalMaterial
          color="#07111f"
          metalness={0.26}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.03}
        />
      </mesh>

      {/* Gloss-Black Side Skirts & Undertray */}
      <mesh position={[0, 0.2, 0.02]} castShadow>
        <boxGeometry args={[2.1, 0.1, 4.42]} />
        <meshStandardMaterial color="#11161f" roughness={0.32} metalness={0.45} />
      </mesh>

      {/* 992.2 Active Aero Lower Front Bumper Intakes */}
      <mesh position={[0, 0.24, 2.21]} castShadow>
        <boxGeometry args={[1.94, 0.08, 0.34]} />
        <meshStandardMaterial color="#10151e" roughness={0.34} metalness={0.48} />
      </mesh>
      <mesh position={[0, 0.37, 2.27]}>
        <boxGeometry args={[1.56, 0.2, 0.08]} />
        <meshStandardMaterial color="#0a0e16" roughness={0.62} metalness={0.38} />
      </mesh>

      {/* Porsche 992.2 Iconic Oval HD Matrix LED Headlights + 4-Point DRL Rings */}
      {[-0.72, 0.72].map((hx, i) => (
        <group
          key={i}
          position={[hx, 0.65, 2.06]}
          rotation={[0.42, i === 0 ? -0.18 : 0.18, 0]}
        >
          <mesh scale={[1, 1.28, 0.55]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f0f9ff"
              emissiveIntensity={isNight ? 2.8 : 1.1}
            />
          </mesh>
          <mesh position={[0, 0, 0.09]} scale={[1, 1.25, 1]}>
            <torusGeometry args={[0.14, 0.022, 8, 18]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#bae6fd"
              emissiveIntensity={isNight ? 3.2 : 1.2}
            />
          </mesh>
        </group>
      ))}

      {/* Porsche Crest Emblem on Hood */}
      <mesh position={[0, 0.72, 2.06]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.02, 12]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Body-Color Lugano Blue Side Mirrors */}
      {[-1.14, 1.14].map((mx, idx) => (
        <mesh key={idx} position={[mx, 0.88, 0.58]}>
          <boxGeometry args={[0.24, 0.09, 0.16]} />
          <meshPhysicalMaterial
            color="#0f62d6"
            metalness={0.56}
            roughness={0.13}
            clearcoat={1}
          />
        </mesh>
      ))}

      {/* Clean 992.2 Carrera Rear Engine Cooling Louvers + Iconic Vertical Twin-Bar Red 3rd Brake Light */}
      <group position={[0, 0.99, -1.55]} rotation={[-0.36, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.18, 0.04, 0.72]} />
          <meshStandardMaterial color="#0b1019" roughness={0.32} metalness={0.62} />
        </mesh>
        {[-0.44, -0.32, -0.2, 0.2, 0.32, 0.44].map((sx, si) => (
          <mesh key={si} position={[sx, 0.026, 0]}>
            <boxGeometry args={[0.032, 0.02, 0.64]} />
            <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.28} />
          </mesh>
        ))}
        {/* Iconic Vertical Red Third Brake Light Centered in Engine Grille */}
        {[-0.035, 0.035].map((bx, bi) => (
          <mesh key={bi} position={[bx, 0.03, -0.05]}>
            <boxGeometry args={[0.022, 0.022, 0.26]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ff1e33"
              emissiveIntensity={isNight ? 2.4 : 1.1}
            />
          </mesh>
        ))}
      </group>

      {/* Signature 992.2 Full-Width Black Rear Lightbar Housing + Razor-Thin Continuous Glowing Ruby LED + P O R S C H E Lettering */}
      <mesh position={[0, 0.69, -2.29]}>
        <boxGeometry args={[1.92, 0.14, 0.06]} />
        <meshStandardMaterial color="#0b0f17" roughness={0.18} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.71, -2.325]}>
        <boxGeometry args={[1.88, 0.034, 0.02]} />
        <meshStandardMaterial
          color="#ff1f34"
          emissive="#ff1a30"
          emissiveIntensity={isNight ? 2.8 : 1.35}
        />
      </mesh>
      <Text
        position={[0, 0.655, -2.326]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.052}
        color="#e2e8f0"
        letterSpacing={0.22}
        anchorX="center"
        anchorY="middle"
      >
        PORSCHE
      </Text>

      {/* Gloss-Black Rear License Plate Recess with Crisp "911" */}
      <mesh position={[0, 0.45, -2.3]}>
        <boxGeometry args={[0.58, 0.17, 0.035]} />
        <meshStandardMaterial color="#0a0e15" roughness={0.25} />
      </mesh>
      <Text
        position={[0, 0.45, -2.322]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.09}
        color="#f8fafc"
        letterSpacing={0.12}
        anchorX="center"
        anchorY="middle"
      >
        911
      </Text>

      {/* 992.2 Matte-Black Carrera Rear Diffuser + Dual Wide Oval Chrome Exhaust Pipes (Left & Right, Matching Photo!) */}
      <mesh position={[0, 0.27, -2.26]}>
        <boxGeometry args={[1.86, 0.22, 0.16]} />
        <meshStandardMaterial color="#141923" roughness={0.52} metalness={0.32} />
      </mesh>
      {[-0.56, 0.56].map((ex, i) => (
        <group key={i} position={[ex, 0.27, -2.34]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.42, 1, 0.82]}>
            <cylinderGeometry args={[0.075, 0.075, 0.14, 18]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1.22, 1, 0.66]}>
            <cylinderGeometry args={[0.068, 0.068, 0.04, 16]} />
            <meshStandardMaterial color="#090b10" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* 4 Porsche 992.2 Carrera Exclusive 5-Spoke Bi-Color Machined Silver / Gloss Black Wheels */}
      {wheelCoords.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.41, 0.41, 0.25, 20]} />
            <meshStandardMaterial color="#0b0d12" roughness={0.94} />
          </mesh>
          {/* Gloss-Black Inner Barrel */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.365, 0.365, 0.31, 24]} />
            <meshStandardMaterial color="#0f131a" roughness={0.3} metalness={0.65} />
          </mesh>
          {/* Machined Silver Rim Outer Lip */}
          <mesh position={[idx % 2 === 0 ? -0.155 : 0.155, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.31, 0.022, 8, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.14} />
          </mesh>
          {/* Bold 5-Spoke Machined Silver Blades (Exact 992.2 Photo Look!) */}
          {[0, 1, 2, 3, 4].map((spoke) => (
            <mesh
              key={spoke}
              position={[idx % 2 === 0 ? -0.16 : 0.16, 0, 0]}
              rotation={[(spoke / 5) * Math.PI * 2, 0, 0]}
            >
              <boxGeometry args={[0.024, 0.56, 0.068]} />
              <meshStandardMaterial color="#e5ebf2" metalness={0.92} roughness={0.15} />
            </mesh>
          ))}
          {/* Center Cap with Porsche Crest */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.068, 0.068, 0.34, 14]} />
            <meshStandardMaterial color="#111827" metalness={0.82} roughness={0.22} />
          </mesh>
          {/* Signature Red Carrera Brake Caliper */}
          <mesh position={[idx % 2 === 0 ? -0.09 : 0.09, 0.06, 0.12]}>
            <boxGeometry args={[0.14, 0.16, 0.1]} />
            <meshStandardMaterial color="#dc2626" metalness={0.45} roughness={0.26} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tall Luxury Resort Garden Lamp Post illuminating the front swimming pool & Porsche bay at night */
function PoolsideGardenLamp({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const glow = isNight ? 3.8 : isSunset ? 1.8 : 0.35;
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.2, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 2.9, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Modern Architectural Glowing Lantern Head */}
      <mesh position={[0, 3.05, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 0.34, 14]} />
        <meshStandardMaterial
          color="#fff7db"
          emissive="#ffd584"
          emissiveIntensity={glow}
        />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.07, 14]} />
        <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.28} />
      </mesh>
    </group>
  );
}

function BollardLight({
  position,
  isNight,
  isSunset,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
}) {
  const lampIntensity = isNight ? 2.8 : isSunset ? 1.5 : 0.35;
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.08, 0.68, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.16, 12]} />
        <meshStandardMaterial
          color="#fff4d6"
          emissive="#ffcf7d"
          emissiveIntensity={lampIntensity}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 12]} />
        <meshStandardMaterial color="#27303d" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Real sculpted 3D fluffy white cumulus clouds gently drifting across the clear blue sky */
function RealisticSkyClouds({ isSunset }: { isSunset: boolean }) {
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const cloudColor = isSunset ? "#ffe1c4" : "#ffffff";
  const underColor = isSunset ? "#f2b895" : "#e2eef8";

  const cloudDefs = useMemo(
    () => [
      { pos: [-48, 38, -58] as [number, number, number], scale: 1.55 },
      { pos: [-16, 44, -76] as [number, number, number], scale: 1.85 },
      { pos: [22, 41, -68] as [number, number, number], scale: 1.65 },
      { pos: [56, 37, -54] as [number, number, number], scale: 1.45 },
      { pos: [-34, 34, -36] as [number, number, number], scale: 1.15 },
      { pos: [38, 35, -38] as [number, number, number], scale: 1.25 },
      { pos: [2, 48, -94] as [number, number, number], scale: 2.1 },
    ],
    []
  );

  useFrame((state) => {
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.position.x =
        Math.sin(state.clock.elapsedTime * 0.045) * 6.5;
    }
  });

  return (
    <group ref={cloudsGroupRef}>
      {cloudDefs.map((c, idx) => (
        <group key={idx} position={c.pos} scale={c.scale}>
          {/* Flat soft underside cloud base */}
          <mesh position={[0, -0.45, 0]} scale={[3.4, 0.9, 1.8]}>
            <sphereGeometry args={[1.2, 12, 10]} />
            <meshStandardMaterial
              color={underColor}
              roughness={0.95}
              fog={false}
            />
          </mesh>
          {/* Sculpted puffy cumulus cloud domes */}
          <mesh position={[-1.9, 0.25, 0.2]} scale={[1.4, 1.1, 1.25]}>
            <sphereGeometry args={[1.35, 12, 10]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[-0.2, 0.85, -0.1]} scale={[1.65, 1.35, 1.35]}>
            <sphereGeometry args={[1.5, 14, 12]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[1.7, 0.4, 0.15]} scale={[1.45, 1.15, 1.25]}>
            <sphereGeometry args={[1.3, 12, 10]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
          <mesh position={[3.0, -0.05, -0.1]} scale={[1.05, 0.85, 1.0]}>
            <sphereGeometry args={[1.1, 10, 8]} />
            <meshStandardMaterial color={cloudColor} roughness={0.92} fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Crisp starry night sky & glowing full moon */
function NightSkyStarsAndMoon() {
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }).map((_, i) => ({
        pos: [
          (((i * 97) % 160) - 80),
          28 + ((i * 37) % 42),
          -72 - ((i * 23) % 38),
        ] as [number, number, number],
        size: 0.12 + (i % 3) * 0.06,
      })),
    []
  );

  return (
    <group>
      {/* Glowing Full Moon */}
      <mesh position={[34, 44, -84]}>
        <sphereGeometry args={[3.1, 18, 16]} />
        <meshStandardMaterial
          color="#fffbeb"
          emissive="#fef3c7"
          emissiveIntensity={2.2}
          fog={false}
        />
      </mesh>
      {/* Twinkling Starfield */}
      {stars.map((s, idx) => (
        <mesh key={idx} position={s.pos}>
          <sphereGeometry args={[s.size, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#e0f2fe"
            emissiveIntensity={2.0}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

const POOL_WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 1.9 + uTime * 2.1) * 0.014 +
                 cos(pos.y * 2.3 - uTime * 1.7) * 0.012;
    pos.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const POOL_WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform float uSunset;
  varying vec2 vUv;
  varying float vWave;

  // Dual-layer organic water caustic web (realistic refracted sunlight ribbons!)
  float causticPattern(vec2 uv, float t) {
    vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;
    vec2 i = p;
    float c = 1.0;
    float inten = 0.0055;
    for (int n = 0; n < 3; n++) {
      float time = t * (1.0 - (2.2 / float(n + 1)));
      i = p + vec2(cos(time - i.x) + sin(time + i.y), sin(time - i.y) + cos(time + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + time) / inten), p.y / (cos(i.y + time) / inten)));
    }
    c /= 3.0;
    c = 1.15 - pow(c, 1.35);
    return clamp(pow(abs(c), 7.5), 0.0, 1.0);
  }

  void main() {
    // Layered fine ripples + crisp refracted underwater sunlight caustics
    vec2 uvScaled = vUv * vec2(2.6, 1.35);
    float cA = causticPattern(uvScaled + vec2(uTime * 0.025, -uTime * 0.018), uTime * 0.62);
    float cB = causticPattern(uvScaled * 1.45 - vec2(uTime * 0.02, uTime * 0.022), uTime * 0.55 + 1.7);
    float caustic = clamp(cA * 0.72 + cB * 0.48, 0.0, 1.0);

    // Subtle mosaic shimmer depth variation + shallow rim absorption
    float edgeX = min(vUv.x, 1.0 - vUv.x);
    float edgeY = min(vUv.y, 1.0 - vUv.y);
    float minEdge = min(edgeX, edgeY);
    float shallowEdge = smoothstep(0.16, 0.0, minEdge);
    float meniscus = smoothstep(0.024, 0.0, minEdge);

    // Micro surface ripple specular glints
    float r1 = sin(vUv.x * 58.0 + uTime * 2.4 + sin(vUv.y * 34.0 - uTime * 1.7));
    float r2 = cos(vUv.y * 46.0 - uTime * 2.1 + cos(vUv.x * 42.0 + uTime * 1.9));
    float sparkle = pow(max(0.0, (r1 * r2) * 0.5 + 0.5), 9.0);

    // Natural photorealistic Mediterranean crystal turquoise water palette
    vec3 deepDay = vec3(0.02, 0.44, 0.66);
    vec3 shallowDay = vec3(0.16, 0.76, 0.88);
    vec3 dayWater = mix(deepDay, shallowDay, shallowEdge * 0.55 + caustic * 0.45);
    dayWater += vec3(0.72, 0.96, 1.0) * caustic * 0.48;
    dayWater += vec3(0.96, 0.99, 1.0) * sparkle * 0.42;

    vec3 sunsetWater = mix(vec3(0.05, 0.34, 0.56), vec3(0.28, 0.64, 0.78), caustic * 0.6 + shallowEdge * 0.35);
    sunsetWater += vec3(1.0, 0.72, 0.46) * (sparkle * 0.48 + caustic * 0.25);

    vec3 nightWater = mix(vec3(0.01, 0.26, 0.48), vec3(0.08, 0.72, 0.92), caustic * 0.65 + shallowEdge * 0.6);
    nightWater += vec3(0.32, 0.92, 1.0) * (caustic * 0.55 + shallowEdge * 0.38);
    nightWater += vec3(0.88, 0.98, 1.0) * sparkle * 0.45;

    vec3 col = mix(dayWater, sunsetWater, uSunset);
    col = mix(col, nightWater, uNight);

    // Gentle crest glint & crisp watery pool-wall meniscus highlight
    float glint = smoothstep(0.012, 0.024, vWave);
    col += vec3(0.95, 0.99, 1.0) * (glint * 0.28 + meniscus * 0.24);

    // Crystal-clear translucent depth so pool tiles beneath shine right through!
    float alpha = mix(0.62, 0.72, uNight) + caustic * 0.1 + sparkle * 0.12;
    gl_FragColor = vec4(col, clamp(alpha, 0.56, 0.86));
  }
`;

/** Modern Architectural Street Lamp with Soft Volumetric Light Cone onto Sidewalk & Wet Asphalt */
function StreetLampWithCone({
  position,
  isNight,
  isSunset,
  isCyan = false,
}: {
  position: [number, number, number];
  isNight: boolean;
  isSunset: boolean;
  isCyan?: boolean;
}) {
  const showBeam = isNight || isSunset;
  const lampColor = isCyan ? "#67e8f9" : "#ffe2a6";
  const coneOpacity = isNight ? 0.16 : 0.08;

  return (
    <group position={position}>
      {/* Pole Base & Sleek Curved Arm facing the Road (+Z) */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.28, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.095, 5.2, 10]} />
        <meshStandardMaterial color="#273140" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Cantilevered Head overhanging the Avenue */}
      <mesh position={[0, 5.28, 0.72]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.1, 1.55]} />
        <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Glowing LED Street Luminaire */}
      <mesh position={[0, 5.22, 1.32]}>
        <boxGeometry args={[0.42, 0.08, 0.28]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={lampColor}
          emissiveIntensity={isNight ? 3.2 : isSunset ? 1.8 : 0.25}
          toneMapped={!(isNight || isSunset)}
        />
      </mesh>
      {/* Soft Volumetric Light Cone */}
      {showBeam && (
        <mesh position={[0, 2.6, 1.38]}>
          <coneGeometry args={[2.55, 5.15, 16, 1, true]} />
          <meshBasicMaterial
            color={lampColor}
            transparent
            opacity={coneOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/** Realistic Organic Branching Sidewalk Shade Tree in a Modern Stone Planter */
function OrnamentalSidewalkTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const canopyRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => (position[0] * 0.29 + position[2] * 0.17) % (Math.PI * 2), [position]);

  useFrame((state) => {
    if (!canopyRef.current) return;
    const t = state.clock.elapsedTime;
    canopyRef.current.rotation.z = Math.sin(t * 0.8 + phase) * 0.025;
  });

  const foliageClusters = [
    { pos: [0, 2.75, 0] as [number, number, number], r: 0.78, col: "#2b6f33" },
    { pos: [0.56, 2.52, 0.36] as [number, number, number], r: 0.54, col: "#37853f" },
    { pos: [-0.54, 2.58, 0.24] as [number, number, number], r: 0.56, col: "#25642d" },
    { pos: [0.34, 2.54, -0.48] as [number, number, number], r: 0.52, col: "#317b39" },
    { pos: [-0.38, 2.48, -0.44] as [number, number, number], r: 0.5, col: "#215a28" },
    { pos: [0.1, 3.36, 0.08] as [number, number, number], r: 0.56, col: "#44964c" },
    { pos: [-0.26, 3.16, -0.18] as [number, number, number], r: 0.44, col: "#3c8c44" },
    { pos: [0.32, 3.12, 0.14] as [number, number, number], r: 0.42, col: "#4ba053" },
  ];

  return (
    <group position={position} scale={scale}>
      {/* Square modern stone curb planter + dark mulch */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[1.18, 0.28, 1.18]} />
        <meshStandardMaterial color="#d6d2c9" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.98, 0.06, 0.98]} />
        <meshStandardMaterial color="#3c2e21" roughness={0.96} />
      </mesh>
      {/* Tapered Organic Bark Trunk + 3 Natural Forked Branches */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.145, 1.85, 10]} />
        <meshStandardMaterial color="#5c4430" roughness={0.92} />
      </mesh>
      <mesh position={[0.24, 2.02, 0.16]} rotation={[0.28, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.9, 8]} />
        <meshStandardMaterial color="#543e2c" roughness={0.92} />
      </mesh>
      <mesh position={[-0.24, 2.05, 0.1]} rotation={[0.16, 0, 0.44]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.9, 8]} />
        <meshStandardMaterial color="#543e2c" roughness={0.92} />
      </mesh>
      <mesh position={[0.04, 2.06, -0.24]} rotation={[-0.44, 0, -0.08]} castShadow>
        <cylinderGeometry args={[0.045, 0.07, 0.85, 8]} />
        <meshStandardMaterial color="#543e2c" roughness={0.92} />
      </mesh>
      {/* Multi-Clustered Textured Leaf Canopy (Organic Dodecahedron Tufts) */}
      <group ref={canopyRef}>
        {foliageClusters.map((c, idx) => (
          <mesh
            key={idx}
            position={c.pos}
            rotation={[idx * 0.7, idx * 1.1, idx * 0.4]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[c.r, 1]} />
            <meshStandardMaterial color={c.col} roughness={0.82} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CyberOutdoorCampus({
  performanceMode,
  lightingPreset,
  onFocusPoint,
}: CyberOutdoorCampusProps) {
  const textures = useMemo(() => getRealisticTextures(), []);
  const waterMatRef = useRef<THREE.ShaderMaterial>(null);
  const { showLabelsIn3D } = useOffice();
  const isNight = lightingPreset === "night";
  const isSunset = lightingPreset === "sunset";

  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNight: { value: 0 },
      uSunset: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (waterMatRef.current) {
      waterMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      waterMatRef.current.uniforms.uNight.value = isNight ? 1.0 : 0.0;
      waterMatRef.current.uniforms.uSunset.value = isSunset ? 1.0 : 0.0;
    }
  });

  const handleGroundDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onFocusPoint) {
      onFocusPoint([e.point.x, Math.max(0.4, e.point.y), e.point.z]);
    }
  };

  // All 10 Palm Trees placed cleanly OUTSIDE the widened 38m HQ (X ∈ [-19, +19]) so ZERO fronds enter the office!
  const palmPositions: { pos: [number, number, number]; scale: number; rot: number }[] = [
    { pos: [-21.6, 0, 5.8], scale: 1.12, rot: 0.4 },
    { pos: [-20.8, 0, 12.2], scale: 1.05, rot: 1.3 },
    { pos: [-18.2, 0, 18.0], scale: 1.15, rot: 2.1 },
    { pos: [-8.5, 0, 18.8], scale: 1.0, rot: 0.8 },
    { pos: [2.8, 0, 18.8], scale: 1.06, rot: 2.9 },
    { pos: [17.8, 0, 17.8], scale: 1.14, rot: 1.7 },
    { pos: [20.8, 0, 11.4], scale: 1.08, rot: 3.5 },
    { pos: [21.6, 0, 5.2], scale: 1.16, rot: 0.2 },
    { pos: [-21.8, 0, -5.8], scale: 1.1, rot: 2.4 },
    { pos: [21.8, 0, -5.4], scale: 1.12, rot: 1.1 },
  ];

  const bollards: [number, number, number][] = [
    [-13.5, 0.18, 4.8],
    [-6.5, 0.18, 4.8],
    [0.0, 0.18, 4.8],
    [6.5, 0.18, 4.8],
    [13.5, 0.18, 4.8],
    [-12.5, 0.18, 16.5],
    [-4.0, 0.18, 16.5],
    [4.2, 0.18, 16.5],
    [13.0, 0.18, 16.5],
  ];

  return (
    <group>
      {/* Expansive manicured tropical lawn (slightly below Y=0 so recessed pool bottom never clips!) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, 4]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial
          map={textures.grassLawn}
          bumpMap={textures.grassBump}
          bumpScale={0.04}
          roughness={0.94}
        />
      </mesh>

      {/* Raised Concrete Sidewalks (Trotoar Utara & Selatan) with Stone Curbs */}
      <mesh position={[0, 0.06, 19.65]} receiveShadow onDoubleClick={handleGroundDoubleClick}>
        <boxGeometry args={[120, 0.14, 1.9]} />
        <meshStandardMaterial color="#cfd5dc" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.08, 20.56]} receiveShadow>
        <boxGeometry args={[120, 0.16, 0.16]} />
        <meshStandardMaterial color="#9aa4b2" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.06, 29.45]} receiveShadow onDoubleClick={handleGroundDoubleClick}>
        <boxGeometry args={[120, 0.14, 1.8]} />
        <meshStandardMaterial color="#cfd5dc" roughness={0.78} />
      </mesh>

      {/* Architectural Asphalt Avenue — Wet Reflective Glossy Asphalt at Night! */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 24.5]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <planeGeometry args={[140, 8.2]} />
        {isNight && performanceMode !== "eco" ? (
          <meshPhysicalMaterial
            map={textures.asphalt}
            color="#202a3b"
            roughness={0.14}
            metalness={0.55}
            clearcoat={0.92}
            clearcoatRoughness={0.1}
          />
        ) : (
          <meshStandardMaterial
            map={textures.asphalt}
            color={isNight ? "#263247" : "#ffffff"}
            roughness={isNight ? 0.2 : 0.86}
            metalness={isNight ? 0.45 : 0.05}
          />
        )}
      </mesh>

      {/* Wet Night Neon Reflection Sheen Puddles on the Asphalt Avenue */}
      {isNight && (
        <group position={[0, 0.008, 24.5]}>
          {[
            { x: -12, z: -1.4, w: 6.5, d: 2.2, col: "#22d3ee" },
            { x: 0, z: -0.6, w: 8.5, d: 2.6, col: "#38bdf8" },
            { x: 11, z: -1.2, w: 6.8, d: 2.2, col: "#e879f9" },
            { x: -24, z: -2.0, w: 4.5, d: 1.8, col: "#fbbf24" },
            { x: 24, z: -2.0, w: 4.5, d: 1.8, col: "#fbbf24" },
          ].map((p, idx) => (
            <mesh key={idx} position={[p.x, 0, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[p.w, p.d]} />
              <meshBasicMaterial
                color={p.col}
                transparent
                opacity={0.14}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Crisp Road Edge Lines + Dashed Center Line + Pedestrian Zebra Crosswalk */}
      <mesh position={[0, 0.004, 20.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.004, 28.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 0.14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
      {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((x) => (
        <mesh key={x} position={[x, 0.005, 24.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 0.22]} />
          <meshStandardMaterial color="#facc15" roughness={0.68} />
        </mesh>
      ))}
      {/* Zebra Crosswalk near Main Entrance */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((cz, i) => (
        <mesh key={`zebra-${i}`} position={[-1.5, 0.006, 24.5 + cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 0.56]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.72} />
        </mesh>
      ))}

      {/* 5 Modern Street Lamps with Volumetric Light Cones along Front Sidewalk */}
      {[
        { x: -24, cyan: false },
        { x: -12, cyan: true },
        { x: 0, cyan: false },
        { x: 12, cyan: true },
        { x: 24, cyan: false },
      ].map((sl, i) => (
        <StreetLampWithCone
          key={`streetlamp-${i}`}
          position={[sl.x, 0.12, 19.65]}
          isNight={isNight}
          isSunset={isSunset}
          isCyan={sl.cyan}
        />
      ))}

      {/* Clean Manicured Sidewalk Trees flanking the Avenue */}
      {[-29, -19.5, 19.5, 29].map((tx, i) => (
        <OrnamentalSidewalkTree
          key={`ortree-${i}`}
          position={[tx, 0.12, 19.45]}
          scale={i % 2 === 0 ? 1.08 : 0.96}
        />
      ))}

      {/* Grand travertine arrival motor court leading to supercar */}
      <mesh
        position={[9.2, 0.06, 17.8]}
        receiveShadow
        onDoubleClick={handleGroundDoubleClick}
      >
        <boxGeometry args={[7.4, 0.12, 8.2]} />
        <meshStandardMaterial
          map={textures.marbleTile}
          bumpMap={textures.marbleBump}
          bumpScale={0.025}
          roughness={0.5}
        />
      </mesh>

      {/* =========================================================================
          GRAND 32m × 14.6m TEAK RESORT DECK — BUILT IN 4 FRAMING SLABS AROUND THE
          REAL OPEN SWIMMING POOL CUTOUT (X ∈ [-10.8, 2.4], Z ∈ [8.3, 14.5])
          ========================================================================= */}
      <group onDoubleClick={handleGroundDoubleClick}>
        {/* North teak deck (between HQ entrance Z=4.0 and pool north edge Z=8.3) */}
        <mesh position={[0, 0.09, 6.15]} receiveShadow>
          <boxGeometry args={[32.0, 0.18, 4.3]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* South teak deck (between pool south edge Z=14.5 and front deck rim Z=18.6) */}
        <mesh position={[0, 0.09, 16.55]} receiveShadow>
          <boxGeometry args={[32.0, 0.18, 4.1]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* West teak deck (west of pool X ∈ [-16.0, -10.8], Z ∈ [8.3, 14.5]) */}
        <mesh position={[-13.4, 0.09, 11.4]} receiveShadow>
          <boxGeometry args={[5.2, 0.18, 6.2]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        {/* East teak deck (east of pool X ∈ [2.4, 16.0], Z ∈ [8.3, 14.5] — supercar bay!) */}
        <mesh position={[9.2, 0.09, 11.4]} receiveShadow>
          <boxGeometry args={[13.6, 0.18, 6.2]} />
          <meshStandardMaterial
            map={textures.woodDeck}
            bumpMap={textures.woodDeckBump}
            bumpScale={0.045}
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Crisp white limestone perimeter deck border */}
      <mesh position={[0, 0.1, 18.68]} receiveShadow>
        <boxGeometry args={[32.4, 0.22, 0.34]} />
        <meshStandardMaterial color="#e8e3da" roughness={0.62} />
      </mesh>

      {/* =========================================================================
          GRAND 13.2m × 6.2m RECESSED LUXURY INFINITY SWIMMING POOL (100% VISIBLE!)
          ========================================================================= */}
      <group position={[-4.2, 0, 11.4]} onDoubleClick={handleGroundDoubleClick}>
        {/* White limestone pool coping surround */}
        <mesh position={[0, 0.21, -3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.1, 0.42]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[0, 0.21, 3.28]} receiveShadow castShadow>
          <boxGeometry args={[14.0, 0.1, 0.42]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[-6.8, 0.21, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.1, 6.98]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>
        <mesh position={[6.8, 0.21, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.1, 6.98]} />
          <meshStandardMaterial color="#f1ece3" roughness={0.52} />
        </mesh>

        {/* Deep Turquoise Ceramic Mosaic Pool Floor (Y = 0.01, clear of grass & deck!) */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13.2, 6.2]} />
          <meshStandardMaterial
            map={textures.poolTiles}
            roughness={0.22}
            emissive={isNight ? "#0ea5e9" : "#0284c7"}
            emissiveIntensity={isNight ? 0.65 : 0.22}
          />
        </mesh>

        {/* 4 Ceramic Mosaic Pool Interior Walls */}
        <mesh position={[0, 0.1, -3.09]}>
          <boxGeometry args={[13.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 3.09]}>
          <boxGeometry args={[13.2, 0.2, 0.04]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[-6.59, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.2, 6.2]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>
        <mesh position={[6.59, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.2, 6.2]} />
          <meshStandardMaterial color="#0e86ab" roughness={0.3} />
        </mesh>

        {/* Terraced Underwater Entry Steps on East side */}
        <mesh position={[5.95, 0.04, 0]}>
          <boxGeometry args={[1.25, 0.06, 4.6]} />
          <meshStandardMaterial color="#58c7e8" roughness={0.28} />
        </mesh>
        <mesh position={[6.25, 0.09, 0]}>
          <boxGeometry args={[0.65, 0.06, 4.6]} />
          <meshStandardMaterial color="#7dd3fc" roughness={0.26} />
        </mesh>

        {/* Chrome Stainless Pool Ladder Handrails */}
        <mesh position={[6.42, 0.52, 1.35]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.86, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[6.42, 0.52, 0.55]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.86, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[6.42, 0.94, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.84, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Floating Pool Inflatable Ring for Resort Realism */}
        <mesh position={[-3.4, 0.19, -0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.52, 0.16, 14, 24]} />
          <meshStandardMaterial color="#fb7185" roughness={0.24} />
        </mesh>

        {/* Custom GLSL Animated Caustic Water Shader + Underwater Pool Glow */}
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[13.16, 6.16, 20, 10]} />
          <shaderMaterial
            ref={waterMatRef}
            vertexShader={POOL_WATER_VERTEX}
            fragmentShader={POOL_WATER_FRAGMENT}
            uniforms={waterUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Glowing Underwater LED Pool Perimeter Strip (Vivid at Night!) */}
        {isNight && (
          <group>
            <mesh position={[0, 0.14, -3.05]}>
              <boxGeometry args={[13.0, 0.06, 0.04]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[0, 0.14, 3.05]}>
              <boxGeometry args={[13.0, 0.06, 0.04]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[-6.55, 0.14, 0]}>
              <boxGeometry args={[0.04, 0.06, 6.0]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
            <mesh position={[6.55, 0.14, 0]}>
              <boxGeometry args={[0.04, 0.06, 6.0]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#38bdf8"
                emissiveIntensity={3.2}
              />
            </mesh>
          </group>
        )}

        {/* Dual Underwater & Poolside Night Illumination (Bright even in Eco mode!) */}
        {(isNight || isSunset) && (
          <>
            <pointLight
              position={[-3.2, 1.4, 0]}
              color="#7dd3fc"
              intensity={isNight ? 24 : 8}
              distance={22}
            />
            <pointLight
              position={[3.4, 1.4, 0]}
              color="#38bdf8"
              intensity={isNight ? 24 : 8}
              distance={22}
            />
          </>
        )}
      </group>

      {/* 4 Resort Umbrellas around pool deck (Positioned Cleanly Between Loungers — Unobstructed View of Bot!) */}
      <PoolUmbrella position={[-12.9, 0.18, 8.7]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-12.9, 0.18, 13.8]} accentColor="#1c4e6f" />
      <PoolUmbrella position={[-6.8, 0.18, 16.4]} accentColor="#2b5f78" />
      <PoolUmbrella position={[0.4, 0.18, 16.4]} accentColor="#2b5f78" />

      {/* 6 Plush Sun Loungers — ALL Properly Oriented Facing Directly Toward the Swimming Pool! */}
      {/* West Deck (Pool is at +X): rotationY = +Math.PI / 2 puts pillow at -X (hedge) and feet at +X (pool)! */}
      <SunLounger position={[-13.4, 0.18, 7.2]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 10.7]} rotationY={Math.PI / 2} />
      <SunLounger position={[-13.4, 0.18, 15.6]} rotationY={Math.PI / 2} />
      {/* South Deck (Pool is at -Z): rotationY = Math.PI puts pillow at +Z (back) and feet at -Z (pool)! */}
      <SunLounger position={[-9.2, 0.18, 16.3]} rotationY={Math.PI} />
      <SunLounger position={[-4.2, 0.18, 16.3]} rotationY={Math.PI} />
      <SunLounger position={[2.6, 0.18, 16.3]} rotationY={Math.PI} />

      {/* Poolside Trading Bot Reclining Perfectly on the Center West Pool Sun Lounger (Facing Pool!) */}
      <PoolsideTradingBot
        position={[-13.4, 0.18, 10.7]}
        rotationY={Math.PI / 2}
        isNight={isNight}
        showLabel={showLabelsIn3D}
      />

      {/* Luxury Outdoor Lounge Seating beside Pool */}
      <group position={[4.2, 0.18, 7.0]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.42, 0.95]} />
          <meshStandardMaterial color="#f5f1e9" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.62, -0.38]} castShadow>
          <boxGeometry args={[2.8, 0.45, 0.22]} />
          <meshStandardMaterial color="#e8e2d6" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.22, 1.15]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.34, 0.78]} />
          <meshStandardMaterial color="#7d5837" roughness={0.62} />
        </mesh>
      </group>

      {/* Iconic Lugano Blue Porsche 911 Carrera 992.2 in Arrival Bay */}
      <Porsche22Car
        position={[9.4, 0.18, 11.3]}
        rotationY={-0.36}
        isNight={isNight}
      />

      {/* Circular Animated RGB Courtyard Water Fountain */}
      <CyberpunkRGBFountain position={[12.8, 0.18, 16.0]} isNight={isNight} />

      {/* 4 Tall Poolside & Front Yard Luxury Garden Lamp Posts */}
      <PoolsideGardenLamp position={[-14.6, 0.18, 17.2]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[-4.2, 0.18, 17.8]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[5.4, 0.18, 17.6]} isNight={isNight} isSunset={isSunset} />
      <PoolsideGardenLamp position={[14.8, 0.18, 13.6]} isNight={isNight} isSunset={isSunset} />

      {/* Soft Balanced Night Resort Pool Deck & Porsche Showcase Lighting (Center Balcony Glare Lamp Removed!) */}
      {(isNight || isSunset) && (
        <>
          <pointLight
            position={[-4.2, 4.4, 15.8]}
            color="#ffe4b5"
            intensity={isNight ? 16 : 8}
            distance={30}
          />
          <pointLight
            position={[9.4, 4.2, 12.6]}
            color="#fff6e0"
            intensity={isNight ? 16 : 8}
            distance={22}
          />
        </>
      )}

      {/* Landscaped Tropical Perimeter Hedges (Clear Outside Widened 38m Building) */}
      {[-20.2, 20.2].map((hx, idx) => (
        <mesh key={idx} position={[hx, 0.42, 11.3]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.84, 14.4]} />
          <meshStandardMaterial color="#2f5f29" roughness={0.92} />
        </mesh>
      ))}

      {/* Pathway Bollard Lamps */}
      {bollards.map((pos, i) => (
        <BollardLight
          key={i}
          position={pos}
          isNight={isNight}
          isSunset={isSunset}
        />
      ))}

      {/* 10 Lush Arched Palm Trees */}
      {palmPositions.map((p, i) => (
        <PalmTree
          key={i}
          position={p.pos}
          scale={p.scale}
          rotation={p.rot}
        />
      ))}

      {/* Real Sculpted Fluffy White Clouds (Day & Sunset) OR Moon & Stars (Night) */}
      {isNight ? (
        <NightSkyStarsAndMoon />
      ) : (
        <RealisticSkyClouds isSunset={isSunset} />
      )}

      {/* Varied Instanced Cyberpunk Metropolis: Setbacks, GLSL Procedural Windows, Hologram Billboards & Flying Traffic */}
      <CyberpunkSkyline
        lightingPreset={lightingPreset}
        performanceMode={performanceMode}
      />
    </group>
  );
}
