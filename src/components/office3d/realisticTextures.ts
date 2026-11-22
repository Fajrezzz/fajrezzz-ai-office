"use client";

import * as THREE from "three";

const textureCache: Record<string, THREE.CanvasTexture> = {};

function makeCanvasTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  draw(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache[key] = tex;
  return tex;
}

/** Warm resort teak wood decking planks */
export function getWoodDeckTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "wood-deck",
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#8c5c3e";
      ctx.fillRect(0, 0, w, h);

      const plankH = 32;
      for (let row = 0; row < h / plankH; row++) {
        const y = row * plankH;
        const tone = (row * 17) % 18;
        ctx.fillStyle = `rgb(${136 + tone}, ${88 + Math.floor(tone * 0.65)}, ${58 + Math.floor(tone * 0.4)})`;
        ctx.fillRect(0, y, w, plankH - 2);

        // Subtle horizontal wood grain streaks
        for (let g = 0; g < 6; g++) {
          ctx.fillStyle =
            g % 2 === 0 ? "rgba(60,32,16,0.12)" : "rgba(255,220,185,0.08)";
          const gy = y + 3 + ((g * 7 + row * 3) % (plankH - 6));
          ctx.fillRect(0, gy, w, 1.5);
        }

        // Plank horizontal seam
        ctx.fillStyle = "rgba(42, 22, 12, 0.55)";
        ctx.fillRect(0, y + plankH - 2, w, 2);

        // Staggered vertical plank joint
        const jointX = ((row * 137 + 90) % (w - 40)) + 20;
        ctx.fillRect(jointX, y, 2, plankH);
      }
    },
    6,
    4
  );
}

/** Natural multi-tone lush green resort grass */
export function getGrassTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "grass-lawn",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#5d8c3c";
      ctx.fillRect(0, 0, w, h);

      // Subtle lawn mowing stripes
      ctx.fillStyle = "rgba(130, 180, 72, 0.22)";
      for (let i = 0; i < w; i += 64) {
        ctx.fillRect(i, 0, 32, h);
      }

      // Organic micro grass speckles
      for (let i = 0; i < 1600; i++) {
        const x = (i * 73) % w;
        const y = (i * 139 + Math.floor(i / 4) * 19) % h;
        ctx.fillStyle =
          i % 3 === 0
            ? "rgba(48, 86, 30, 0.35)"
            : i % 3 === 1
            ? "rgba(148, 198, 86, 0.32)"
            : "rgba(96, 146, 54, 0.25)";
        ctx.fillRect(x, y, 2, 3);
      }
    },
    14,
    14
  );
}

/** Smooth modern architectural warm-ivory concrete/plaster finish */
export function getConcretePlasterTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "concrete-plaster",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#ece9e2";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const x = (i * 97) % w;
        const y = (i * 53 + Math.floor(i / 5) * 11) % h;
        ctx.fillStyle =
          i % 2 === 0 ? "rgba(180,172,160,0.14)" : "rgba(255,255,255,0.2)";
        ctx.fillRect(x, y, 3, 2);
      }
      ctx.strokeStyle = "rgba(160,154,145,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, w, h);
    },
    4,
    2
  );
}

/** Modern architectural slate-grey office carpet/stone tile grid */
export function getOfficeFloorTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "office-floor",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#525864";
      ctx.fillRect(0, 0, w, h);

      const tile = 64;
      for (let r = 0; r < h / tile; r++) {
        for (let c = 0; c < w / tile; c++) {
          const shade = (r + c) % 2 === 0 ? 84 : 78;
          ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
          ctx.fillRect(c * tile + 1, r * tile + 1, tile - 2, tile - 2);
        }
      }
    },
    7,
    4
  );
}

/** Turquoise ceramic mosaic swimming pool tiles */
export function getPoolTilesTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "pool-tiles",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#22a7cf";
      ctx.fillRect(0, 0, w, h);

      const size = 16;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          const v = ((x * 7 + y * 13) % 26) - 10;
          ctx.fillStyle = `rgb(${26 + v}, ${166 + v}, ${210 + Math.floor(v * 0.7)})`;
          ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        }
      }
    },
    5,
    3
  );
}

/** Crisp modern analytics / candlestick monitor screen */
export function getChartScreenTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "chart-screen",
    512,
    256,
    (ctx, w, h) => {
      // Dark professional monitor UI background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0b1322");
      grad.addColorStop(1, "#070c16");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle chart grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      for (let x = 32; x < w; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 26);
        ctx.lineTo(x, h - 18);
        ctx.stroke();
      }
      for (let y = 36; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(16, y);
        ctx.lineTo(w - 16, y);
        ctx.stroke();
      }

      // Top status bar
      ctx.fillStyle = "#111c33";
      ctx.fillRect(0, 0, w, 24);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("FAJREZZZ ANALYTICS • SIM TELEMETRY", 12, 16);
      ctx.fillStyle = "#34d399";
      ctx.fillText("LIVE SIM", w - 68, 16);

      // Realistic candlesticks
      let priceY = 148;
      for (let i = 0; i < 28; i++) {
        const x = 24 + i * 16.5;
        const delta = Math.sin(i * 0.65) * 18 + Math.cos(i * 1.4) * 10;
        const nextY = Math.max(46, Math.min(h - 32, priceY - delta * 0.45));
        const bullish = nextY < priceY;

        ctx.strokeStyle = bullish ? "#22c55e" : "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 4, Math.min(priceY, nextY) - 10);
        ctx.lineTo(x + 4, Math.max(priceY, nextY) + 10);
        ctx.stroke();

        ctx.fillStyle = bullish ? "#22c55e" : "#ef4444";
        ctx.fillRect(
          x,
          Math.min(priceY, nextY),
          8,
          Math.max(5, Math.abs(nextY - priceY))
        );
        priceY = nextY;
      }

      // Moving average glowing curve
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const x = 28 + i * 16.5;
        const y = 135 - Math.sin(i * 0.25) * 32 - i * 1.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  );
}

/** Giant wall-mounted executive office telemetry & unit board (Lantai 2) */
export function getLeaderboardTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture("wall-leaderboard", 1024, 384, (ctx, w, h) => {
    ctx.fillStyle = "#0a101d";
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = "#111a2e";
    ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("FAJREZZZ AI OFFICE  —  OPERATIONS COMMAND BOARD", 26, 30);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("VISUAL PLACEHOLDER SIMULATION", w - 285, 29);

    // Left Unit Rows
    const rows = [
      { code: "UNIT-01  NOVA-X", role: "Lead Code Architect", metric: "ACTIVE 64%", color: "#38bdf8" },
      { code: "UNIT-02  VEXA-9", role: "Data & Ops Analyst", metric: "PATROL 48%", color: "#a78bfa" },
      { code: "UNIT-03  KAIRO-7", role: "Automation Specialist", metric: "IDLE 22%", color: "#34d399" },
      { code: "WS-04    SANDBOX", role: "Expansion Station", metric: "STANDBY", color: "#fbbf24" },
    ];

    rows.forEach((row, idx) => {
      const y = 70 + idx * 72;
      ctx.fillStyle = "#11192b";
      ctx.fillRect(26, y, 470, 58);
      ctx.fillStyle = row.color;
      ctx.fillRect(26, y, 6, 58);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(row.code, 46, y + 25);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px sans-serif";
      ctx.fillText(row.role, 46, y + 46);

      ctx.fillStyle = row.color;
      ctx.font = "bold 16px monospace";
      ctx.fillText(row.metric, 370, y + 36);
    });

    // Right Telemetry Chart Panel
    ctx.fillStyle = "#0e1628";
    ctx.fillRect(524, 70, 472, 274);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
    for (let y = 110; y < 330; y += 44) {
      ctx.beginPath();
      ctx.moveTo(540, y);
      ctx.lineTo(980, y);
      ctx.stroke();
    }

    const barHeights = [110, 155, 130, 195, 175, 220, 185, 235, 205, 165];
    barHeights.forEach((bh, i) => {
      const bx = 548 + i * 42;
      const by = 324 - bh;
      const barGrad = ctx.createLinearGradient(0, by, 0, 324);
      barGrad.addColorStop(0, i % 2 === 0 ? "#38bdf8" : "#34d399");
      barGrad.addColorStop(1, "rgba(14,165,233,0.18)");
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, by, 26, bh);
    });
  });
}

/** Realistic modern skyscraper window facade */
export function getSkyscraperFacadeTexture(): THREE.CanvasTexture | null {
  return makeCanvasTexture(
    "skyscraper-windows",
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, w, h);

      const cols = 6;
      const rows = 18;
      const cw = w / cols;
      const rh = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = (r * 13 + c * 7) % 5 === 0;
          const warm = (r * 5 + c * 11) % 3 === 0;
          ctx.fillStyle = lit
            ? warm
              ? "#fde68a"
              : "#bae6fd"
            : "#1e293b";
          ctx.fillRect(c * cw + 5, r * rh + 5, cw - 10, rh - 9);
        }
      }
    },
    1,
    1
  );
}
