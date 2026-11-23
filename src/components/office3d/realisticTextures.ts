"use client";

import * as THREE from "three";

export interface RealisticTextureSet {
  woodDeck: THREE.CanvasTexture;
  woodDeckBump: THREE.CanvasTexture;
  officeOak: THREE.CanvasTexture;
  officeOakBump: THREE.CanvasTexture;
  stuccoWall: THREE.CanvasTexture;
  stuccoBump: THREE.CanvasTexture;
  marbleTile: THREE.CanvasTexture;
  marbleBump: THREE.CanvasTexture;
  poolTiles: THREE.CanvasTexture;
  poolWaterBump: THREE.CanvasTexture;
  grassLawn: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  asphalt: THREE.CanvasTexture;
  skylineDay: THREE.CanvasTexture;
  skylineNight: THREE.CanvasTexture;
  skylineNightEmissive: THREE.CanvasTexture;
  monitorScreen: THREE.CanvasTexture;
  commandWallScreen: THREE.CanvasTexture;
}

let cachedSet: RealisticTextureSet | null = null;

function createCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function makeTex(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  srgb = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildWoodPair(
  baseHex: string,
  darkHex: string,
  lightHex: string,
  planks: number,
  repeatX: number,
  repeatY: number
): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const [bCanvas, bCtx] = createCanvas(size);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = "#909090";
  bCtx.fillRect(0, 0, size, size);

  const plankH = size / planks;
  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const toneMix = (i * 37) % 5;
    ctx.fillStyle =
      toneMix === 0
        ? lightHex
        : toneMix === 1 || toneMix === 3
        ? baseHex
        : darkHex;
    ctx.globalAlpha = 0.42;
    ctx.fillRect(0, y, size, plankH);

    // Subtle wood grain fibers
    ctx.globalAlpha = 0.24;
    for (let g = 0; g < 18; g++) {
      const gy = y + ((g * 29 + i * 7) % plankH);
      ctx.strokeStyle = g % 2 === 0 ? darkHex : lightHex;
      ctx.lineWidth = 1 + (g % 2);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(
        size * 0.33,
        gy + Math.sin(g + i) * 3,
        size * 0.66,
        gy - Math.cos(g + i) * 3,
        size,
        gy
      );
      ctx.stroke();

      // Bump grain
      bCtx.strokeStyle = g % 2 === 0 ? "#7a7a7a" : "#aaaaaa";
      bCtx.lineWidth = 1;
      bCtx.beginPath();
      bCtx.moveTo(0, gy);
      bCtx.lineTo(size, gy);
      bCtx.stroke();
    }

    // Crisp dark plank groove
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#24160d";
    ctx.fillRect(0, y, size, 2.5);

    bCtx.fillStyle = "#181818";
    bCtx.fillRect(0, y, size, 3);
    bCtx.fillStyle = "#b8b8b8";
    bCtx.fillRect(0, y + 3, size, 2);

    // Staggered cross-joint
    const jointX = ((i * 193 + 90) % (size - 80)) + 40;
    ctx.fillStyle = "#24160d";
    ctx.fillRect(jointX, y, 2, plankH);
    bCtx.fillStyle = "#202020";
    bCtx.fillRect(jointX, y, 2.5, plankH);
  }
  ctx.globalAlpha = 1;

  return [
    makeTex(canvas, repeatX, repeatY, true),
    makeTex(bCanvas, repeatX, repeatY, false),
  ];
}

function buildStuccoPair(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const [bCanvas, bCtx] = createCanvas(size);

  ctx.fillStyle = "#f2efe9";
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Subtle architectural troweled concrete panels + micro grain
  for (let i = 0; i < 4200; i++) {
    const x = (i * 131 + 17) % size;
    const y = (i * 277 + 43) % size;
    const r = 1 + (i % 3);
    const v = 232 + ((i * 13) % 18);
    ctx.fillStyle = `rgb(${v},${v - 2},${v - 5})`;
    ctx.fillRect(x, y, r, r);

    const bv = 112 + ((i * 19) % 34);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.fillRect(x, y, r, r);
  }

  // Faint modern architectural expansion joints
  ctx.strokeStyle = "rgba(180,174,165,0.35)";
  ctx.lineWidth = 1.5;
  bCtx.strokeStyle = "#484848";
  bCtx.lineWidth = 2;
  for (let p = 1; p < 4; p++) {
    const pos = p * 128;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, pos);
    bCtx.lineTo(size, pos);
    bCtx.stroke();
  }

  return [makeTex(canvas, 3, 2, true), makeTex(bCanvas, 3, 2, false)];
}

function buildMarblePair(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const [bCanvas, bCtx] = createCanvas(size);

  ctx.fillStyle = "#ebe7df";
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#a0a0a0";
  bCtx.fillRect(0, 0, size, size);

  // Elegant diagonal travertine veins
  for (let v = 0; v < 26; v++) {
    ctx.strokeStyle =
      v % 2 === 0 ? "rgba(176,166,152,0.28)" : "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5 + (v % 3);
    ctx.beginPath();
    const startY = (v * 43) % size;
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(
      size * 0.35,
      startY + Math.sin(v) * 48,
      size * 0.7,
      startY - Math.cos(v) * 42,
      size,
      (startY + 64) % size
    );
    ctx.stroke();
  }

  // Crisp large-format 2x2 architectural tile joints
  ctx.strokeStyle = "rgba(140,132,120,0.55)";
  ctx.lineWidth = 2.2;
  bCtx.strokeStyle = "#282828";
  bCtx.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    const pos = i * 256;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(pos, 0);
    bCtx.lineTo(pos, size);
    bCtx.moveTo(0, pos);
    bCtx.lineTo(size, pos);
    bCtx.stroke();
  }

  return [makeTex(canvas, 6, 4, true), makeTex(bCanvas, 6, 4, false)];
}

function buildPoolTilesAndWater(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const [wCanvas, wCtx] = createCanvas(size);

  ctx.fillStyle = "#1285a8";
  ctx.fillRect(0, 0, size, size);
  const cells = 16;
  const step = size / cells;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const shade = (r * 7 + c * 13) % 4;
      ctx.fillStyle =
        shade === 0
          ? "#1ea4c8"
          : shade === 1
          ? "#1592b5"
          : shade === 2
          ? "#26b3d4"
          : "#0e7c9e";
      ctx.fillRect(c * step + 1.5, r * step + 1.5, step - 3, step - 3);
    }
  }

  // Water surface ripple normal/bump pattern
  wCtx.fillStyle = "#808080";
  wCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 65; i++) {
    const cx = (i * 97 + 31) % size;
    const cy = (i * 149 + 53) % size;
    const rad = 24 + (i % 34);
    const grad = wCtx.createRadialGradient(cx, cy, 2, cx, cy, rad);
    grad.addColorStop(0, "rgba(235,235,235,0.45)");
    grad.addColorStop(0.55, "rgba(65,65,65,0.35)");
    grad.addColorStop(1, "rgba(128,128,128,0)");
    wCtx.fillStyle = grad;
    wCtx.beginPath();
    wCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    wCtx.fill();
  }

  return [makeTex(canvas, 6, 3, true), makeTex(wCanvas, 4, 2, false)];
}

function buildGrassPair(): [THREE.CanvasTexture, THREE.CanvasTexture] {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const [bCanvas, bCtx] = createCanvas(size);

  ctx.fillStyle = "#4b7c39";
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#707070";
  bCtx.fillRect(0, 0, size, size);

  // Subtle mowed stripe bands
  for (let s = 0; s < 4; s++) {
    ctx.fillStyle =
      s % 2 === 0 ? "rgba(95,142,66,0.22)" : "rgba(55,95,42,0.18)";
    ctx.fillRect(s * 128, 0, 128, size);
  }

  for (let i = 0; i < 7000; i++) {
    const x = (i * 79 + 11) % size;
    const y = (i * 191 + 29) % size;
    const pick = i % 4;
    ctx.fillStyle =
      pick === 0
        ? "#5f9345"
        : pick === 1
        ? "#3d6b2e"
        : pick === 2
        ? "#6fa14f"
        : "#487434";
    ctx.fillRect(x, y, 2, 4);

    bCtx.fillStyle = pick % 2 === 0 ? "#a5a5a5" : "#4a4a4a";
    bCtx.fillRect(x, y, 2, 3);
  }

  return [makeTex(canvas, 14, 14, true), makeTex(bCanvas, 14, 14, false)];
}

function buildAsphalt(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = "#343942";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5200; i++) {
    const x = (i * 103 + 7) % size;
    const y = (i * 211 + 19) % size;
    const v = 42 + (i % 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(x, y, 2, 2);
  }
  return makeTex(canvas, 8, 8, true);
}

function buildSkylineCurtainWall(
  mode: "day" | "night" | "nightEmissive"
): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  if (mode === "nightEmissive") {
    // Pure black background — ONLY lit skyscraper windows glow brightly at night!
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, size);
    if (mode === "night") {
      bg.addColorStop(0, "#131e33");
      bg.addColorStop(1, "#0b1222");
    } else {
      // Crisp architectural blue-steel glass skyscraper facade (never washed-out white!)
      bg.addColorStop(0, "#5c80a3");
      bg.addColorStop(0.55, "#46688a");
      bg.addColorStop(1, "#355372");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }

  const cols = 10;
  const rows = 22;
  const cw = size / cols;
  const rh = size / rows;

  for (let r = 0; r < rows; r++) {
    // Architectural floor slab spandrel band
    if (mode !== "nightEmissive") {
      ctx.fillStyle = mode === "night" ? "#090f1a" : "#2b4157";
      ctx.fillRect(0, r * rh, size, rh * 0.28);
    }

    // Some office floors are brightly lit in clusters (like real high-rise buildings at night!)
    const busyFloor = (r * 7 + 3) % 5 < 2;

    for (let c = 0; c < cols; c++) {
      const seed = (r * 31 + c * 17 + r * c * 5) % 19;
      const isLit = busyFloor ? seed < 11 : seed < 6;

      if (mode === "nightEmissive") {
        if (isLit) {
          ctx.fillStyle =
            seed % 4 === 0
              ? "#ffe6a3" // warm office gold
              : seed % 4 === 1
              ? "#fff7dc" // bright warm white
              : seed % 4 === 2
              ? "#bae6fd" // modern cool office cyan-white
              : "#fcd34d"; // cozy amber
          ctx.fillRect(c * cw + 4, r * rh + rh * 0.34, cw - 8, rh * 0.56);
        }
      } else if (mode === "night") {
        if (isLit) {
          ctx.fillStyle = seed % 2 === 0 ? "#fde68a" : "#dbeafe";
        } else {
          ctx.fillStyle = "#16233b";
        }
        ctx.fillRect(c * cw + 2, r * rh + rh * 0.3, cw - 4, rh * 0.65);
      } else {
        // Crisp reflective blue-glass daytime skyscraper panes
        ctx.fillStyle =
          seed % 4 === 0
            ? "#8eb2d1"
            : seed % 4 === 1
            ? "#7097ba"
            : seed % 4 === 2
            ? "#5a80a4"
            : "#7fa4c5";
        ctx.fillRect(c * cw + 2, r * rh + rh * 0.3, cw - 4, rh * 0.65);
      }
    }
  }

  if (mode !== "nightEmissive") {
    ctx.fillStyle = mode === "night" ? "#080d16" : "#273b4f";
    for (let c = 0; c <= cols; c++) {
      ctx.fillRect(c * cw - 1, 0, 2, size);
    }
  }

  return makeTex(canvas, 1, 2, true);
}

function buildMonitorScreen(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, size, size);

  // Top bar
  ctx.fillStyle = "#162238";
  ctx.fillRect(0, 0, size, 48);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(20, 16, 110, 14);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(size - 90, 16, 68, 14);

  // Cards
  ctx.fillStyle = "#111c30";
  ctx.fillRect(20, 68, 224, 150);
  ctx.fillRect(264, 68, 228, 150);
  ctx.fillRect(20, 238, 472, 250);

  // Sharp green/blue chart line
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(42, 430);
  ctx.lineTo(115, 385);
  ctx.lineTo(190, 405);
  ctx.lineTo(270, 325);
  ctx.lineTo(350, 340);
  ctx.lineTo(458, 275);
  ctx.stroke();

  // Bar graph inside top-left card
  for (let i = 0; i < 6; i++) {
    const h = 30 + ((i * 23) % 85);
    ctx.fillStyle = i % 2 === 0 ? "#0ea5e9" : "#34d399";
    ctx.fillRect(38 + i * 32, 198 - h, 20, h);
  }

  // Code lines inside top-right card
  for (let l = 0; l < 6; l++) {
    ctx.fillStyle = l % 3 === 0 ? "#60a5fa" : "#94a3b8";
    ctx.fillRect(282, 86 + l * 20, 90 + ((l * 47) % 100), 9);
  }

  const tex = makeTex(canvas, 1, 1, true);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function buildCommandWallScreen(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 384);
  grad.addColorStop(0, "#0a1324");
  grad.addColorStop(0.5, "#101e36");
  grad.addColorStop(1, "#0b1528");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 384);

  // Header strip
  ctx.fillStyle = "#182b49";
  ctx.fillRect(0, 0, 1024, 62);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("FAJREZZZ AI OFFICE  ·  GLOBAL OPERATIONS COMMAND", 32, 41);

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("10 STAFF ACTIVE · 8 WORKSTATIONS · SIM MODE", 585, 39);

  // Three crisp telemetry panels
  const panels = [
    { x: 28, w: 300, title: "OPERATIONS LOAD", accent: "#38bdf8" },
    { x: 352, w: 320, title: "WORLD NETWORK MAP", accent: "#34d399" },
    { x: 696, w: 300, title: "PROJECT PIPELINE", accent: "#fbbf24" },
  ];

  for (const p of panels) {
    ctx.fillStyle = "#111f38";
    ctx.fillRect(p.x, 84, p.w, 272);
    ctx.strokeStyle = "rgba(148,163,184,0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, 84, p.w, 272);

    ctx.fillStyle = p.accent;
    ctx.font = "bold 17px sans-serif";
    ctx.fillText(p.title, p.x + 18, 118);
  }

  // Panel 1 bars
  for (let i = 0; i < 8; i++) {
    const h = 55 + ((i * 31) % 130);
    ctx.fillStyle = i % 2 === 0 ? "#38bdf8" : "#0284c7";
    ctx.fillRect(50 + i * 33, 330 - h, 22, h);
  }

  // Panel 2 glowing arcs
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 3;
  for (let a = 0; a < 5; a++) {
    ctx.beginPath();
    ctx.arc(512, 240, 28 + a * 24, Math.PI * 0.1, Math.PI * 1.65);
    ctx.stroke();
  }

  // Panel 3 progress bars
  for (let r = 0; r < 5; r++) {
    const y = 148 + r * 38;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(718, y, 256, 18);
    ctx.fillStyle = r % 2 === 0 ? "#fbbf24" : "#38bdf8";
    ctx.fillRect(718, y, 110 + ((r * 37) % 135), 18);
  }

  const tex = makeTex(canvas, 1, 1, true);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function getRealisticTextures(): RealisticTextureSet {
  if (cachedSet) return cachedSet;

  const [woodDeck, woodDeckBump] = buildWoodPair(
    "#9d6d43",
    "#7e522d",
    "#b88557",
    10,
    7,
    4
  );
  const [officeOak, officeOakBump] = buildWoodPair(
    "#c9a476",
    "#b28b5d",
    "#dcba8e",
    12,
    6,
    4
  );
  const [stuccoWall, stuccoBump] = buildStuccoPair();
  const [marbleTile, marbleBump] = buildMarblePair();
  const [poolTiles, poolWaterBump] = buildPoolTilesAndWater();
  const [grassLawn, grassBump] = buildGrassPair();
  const asphalt = buildAsphalt();
  const skylineDay = buildSkylineCurtainWall("day");
  const skylineNight = buildSkylineCurtainWall("night");
  const skylineNightEmissive = buildSkylineCurtainWall("nightEmissive");
  const monitorScreen = buildMonitorScreen();
  const commandWallScreen = buildCommandWallScreen();

  cachedSet = {
    woodDeck,
    woodDeckBump,
    officeOak,
    officeOakBump,
    stuccoWall,
    stuccoBump,
    marbleTile,
    marbleBump,
    poolTiles,
    poolWaterBump,
    grassLawn,
    grassBump,
    asphalt,
    skylineDay,
    skylineNight,
    skylineNightEmissive,
    monitorScreen,
    commandWallScreen,
  };
  return cachedSet;
}

/**
 * KETEGASAN TEKSTUR — dipanggil setelah renderer WebGL siap.
 *
 * Semua tekstur sudah dibuat dengan mipmap + `LinearMipmapLinearFilter`
 * (trilinear). Di sini kita naikkan anisotropic filtering sesuai kemampuan GPU
 * supaya lantai/plafon/kaca tidak "burik" saat kamera dimiringkan atau di-zoom
 * jauh (masalah klasik mipmap tanpa anisotropy pada permukaan miring).
 *
 * Catatan: TIDAK ada penurunan resolusi tekstur berdasarkan zoom kamera —
 * tekstur selalu dipakai pada resolusi penuh + mipmap asli.
 */
export function applyTextureQuality(maxAnisotropy = 8): void {
  if (!cachedSet) return;
  const aniso = Math.max(1, Math.min(8, Math.floor(maxAnisotropy)));
  (Object.keys(cachedSet) as Array<keyof RealisticTextureSet>).forEach((key) => {
    const tex = cachedSet?.[key];
    if (!tex) return;
    tex.anisotropy = aniso;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  });
}
