"use client";

/**
 * FAJREZZZ — "ZINE GLITCH" EDITORIAL RENDERER (v9)
 *
 * Meniru gaya video referensi Bos (folder Drive "VIDEO AI", TikTok @agshpn_):
 *  - Kertas krem + grain + border putih tipis (kesan zine/collage, bukan UI gelap)
 *  - Tipografi raksasa hitam-putih (heavy grotesque), ada yang sengaja TERPOTONG
 *    keluar frame di kiri/kanan
 *  - Slab hitam miring sebagai caption box ("NOSE", "THESE GUYS", "RIGHT UNDER")
 *  - Artwork/B-roll diperlakukan seperti potongan kertas: kartu miring, border putih,
 *    halftone + duotone merah/amber
 *  - Aksen glitch RGB split (merah/biru) di awal & akhir tiap scene
 *  - Stiker bola prisma RGB + chip label kecil
 *  - Hard cut + punch-in scale (1.10 -> 1.0) — tempo cepat ala TikTok
 *
 * Semua fungsi gambar deterministik terhadap waktu supaya preview = hasil export.
 */

import type { EditorialEpisode, EditorialScene } from "./motion-renderer.ts";
import { getTikTokSafeZone } from "./video-engine-v3.ts";
import {
  buildVisualVariation,
  layoutForScene,
  transitionForScene,
  typographyForScene,
  type AccentSet,
  type PaperTone,
  type TransitionModeId,
  type VisualVariation,
} from "./visual-variation.ts";

export const ZINE_PALETTE = {
  paper: "#F1EBE0",
  paperDeep: "#E3D9C8",
  ink: "#0A0A0B",
  inkSoft: "#161617",
  red: "#E23A2E",
  amber: "#F5A623",
  blue: "#2D6BFF",
  white: "#FFFFFF",
  muted: "#7A6F5F",
} as const;

export const ZINE_STYLE_ID = "zine_glitch";

export function isZineStyle(style: string): boolean {
  return style === ZINE_STYLE_ID;
}

/* ============================================================================
 * PURE HELPERS (di-unit-test tanpa canvas)
 * ========================================================================== */

const STOP_SHORT = new Set(["a", "di", "ke", "the", "of", "to", "dan", "yang"]);

/**
 * Pecah headline jadi maksimal `maxLines` baris yang seimbang.
 * Baris pertama boleh lebih panjang (dipakai sebagai baris "hero").
 */
export function zineSplitHeadline(text: string, maxLines = 3): string[] {
  const words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return [""];
  if (words.length === 1 || maxLines <= 1) return [words.join(" ")];

  // 1 frasa pendek jangan dipecah jadi 2 baris cuma 1 kata (komposisi jadi kosong)
  const targetLines = Math.max(
    1,
    Math.min(maxLines, Math.round(words.length / 2.5) || 1)
  );
  if (targetLines === 1) return [words.join(" ")];

  const lines: string[] = [];
  const perLine = Math.ceil(words.length / targetLines);
  for (let i = 0; i < words.length; i += perLine) {
    lines.push(words.slice(i, i + perLine).join(" "));
  }
  // Hindari baris terakhir yang cuma 1 kata pendek ("dan", "di")
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    if (last.split(" ").length === 1 && STOP_SHORT.has(last.toLowerCase())) {
      lines[lines.length - 2] = `${lines[lines.length - 2]} ${last}`;
      lines.pop();
    }
  }
  return lines.slice(0, Math.max(1, maxLines));
}

/** Ukuran font supaya baris terpanjang mengisi `fill` lebar kanvas. */
export function zineHeadlineFontPx(
  longestLine: string,
  width: number,
  fill = 0.94
): number {
  const chars = Math.max(3, longestLine.trim().length);
  // Rasio empiris font grotesque 900: lebar rata-rata ≈ 0.58 × font-size per huruf kapital
  const px = (width * fill) / (chars * 0.58);
  return Math.max(28, Math.min(width * 0.34, px));
}

/** RGB split & jitter; besar tapi tetap terbatas (fraksi lebar kanvas). */
export function zineGlitchOffset(
  localSec: number,
  sceneDur: number,
  width: number
): { dx: number; dy: number; split: number } {
  const intro = Math.max(0, 1 - localSec / 0.34); // glitch paling kuat di awal scene
  const outro = Math.max(0, 1 - (sceneDur - localSec) / 0.26);
  const intensity = Math.min(1, Math.max(intro, outro));
  if (intensity <= 0.01) return { dx: 0, dy: 0, split: 0 };
  const t = localSec * 37;
  return {
    dx: Math.sin(t) * width * 0.010 * intensity,
    dy: Math.cos(t * 1.7) * width * 0.0035 * intensity,
    split: width * 0.0085 * intensity,
  };
}

/** Punch-in scale: scene baru masuk sedikit kebesaran lalu settle ke 1.0. */
export function zinePunchScale(localSec: number, settleSec = 0.38): number {
  const t = Math.max(0, Math.min(1, localSec / settleSec));
  const eased = 1 - Math.pow(1 - t, 3);
  return 1.1 - 0.1 * eased;
}

/** Rotasi kartu artwork yang stabil per scene (deterministik) */
export function zineCardRotation(sceneIndex: number): number {
  const seq = [-3.2, 2.4, -1.8, 3.6, -2.6, 1.6];
  return seq[sceneIndex % seq.length];
}

/* ============================================================================
 * CANVAS TEXTURE CACHE (grain + halftone) — dibuat sekali per ukuran
 * ========================================================================== */

let grainCanvas: HTMLCanvasElement | null = null;
let grainKey = "";

function getGrainCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = `${Math.round(w)}x${Math.round(h)}`;
  if (grainCanvas && grainKey === key) return grainCanvas;
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w / 2));
  c.height = Math.max(2, Math.round(h / 2));
  const g = c.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  g.putImageData(img, 0, 0);
  grainCanvas = c;
  grainKey = key;
  return c;
}

let halftoneCanvas: HTMLCanvasElement | null = null;

function getHalftoneCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (halftoneCanvas) return halftoneCanvas;
  const size = 8;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.beginPath();
  g.arc(size / 2, size / 2, size * 0.22, 0, Math.PI * 2);
  g.fill();
  halftoneCanvas = c;
  return c;
}

/* ============================================================================
 * DRAWING PRIMITIVES
 * ========================================================================== */

function drawPaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  globalSec: number,
  base: string = ZINE_PALETTE.paper,
  deep: string = ZINE_PALETTE.paperDeep
): void {
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, base);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Fiber kertas halus + grain bergerak tipis (bukan noise TV)
  const grain = getGrainCanvas(w, h);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const ox = (globalSec * 31) % 64;
    ctx.drawImage(grain, -ox, 0, w + 128, h);
    ctx.restore();
  }
}

function drawHalftoneRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): void {
  const pattern = getHalftoneCanvas();
  if (!pattern) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const pat = ctx.createPattern(pattern, "repeat");
  if (!pat) return;
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  void scale;
}

function drawInkBlot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  globalSec: number,
  seed = 0
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const pts = 16;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const wobble =
      1 +
      Math.sin(a * 3 + seed) * 0.08 +
      Math.sin(a * 5 + globalSec * 1.3 + seed) * 0.05;
    const px = cx + Math.cos(a) * r * wobble;
    const py = cy + Math.sin(a) * r * wobble * 1.08;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Teks dengan RGB split (merah & biru) + isi utama */
function drawGlitchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontPx: number,
  fill: string,
  align: CanvasTextAlign,
  split: number
): void {
  const family = `900 %SPX%px ${HEADLINE_FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  if (split > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#00A2FF";
    ctx.font = family.replace("%SPX%", String(fontPx));
    ctx.fillText(text, x - split, y);
    ctx.fillStyle = "#FF2D55";
    ctx.fillText(text, x + split, y);
    ctx.restore();
  }

  ctx.fillStyle = fill;
  ctx.font = family.replace("%SPX%", String(fontPx));
  ctx.fillText(text, x, y);
}

/** Slab hitam miring (caption box) dengan tepi kasar */
function drawSlab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rot: number,
  fill: string = ZINE_PALETTE.ink
): void {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  // Tepi "sobek kertas" tipis
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = ZINE_PALETTE.white;
  ctx.fillRect(-w / 2, -h / 2, w, Math.max(1.5, h * 0.012));
  ctx.restore();
}

function drawPrismSticker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  const cols = [ZINE_PALETTE.red, "#22C55E", ZINE_PALETTE.blue, ZINE_PALETTE.amber];
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < cols.length; i++) {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos((i / cols.length) * Math.PI * 2) * r * 0.42,
      cy + Math.sin((i / cols.length) * Math.PI * 2) * r * 0.42,
      r * 0.72,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fontPx: number,
  bg: string = ZINE_PALETTE.ink,
  fg: string = ZINE_PALETTE.white
): void {
  ctx.save();
  ctx.font = `800 ${fontPx}px "Helvetica Neue", Inter, system-ui, sans-serif`;
  const w = ctx.measureText(label).width + fontPx * 1.1;
  const h = fontPx * 1.9;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(label, x + fontPx * 0.55, y + h / 2 + fontPx * 0.04);
  ctx.restore();
}

/** Palet per scene: kertas terang, tinta gelap, aksen milik episode. */
interface SceneTones {
  light: string;
  dark: string;
  accent: string;
  accentAlt: string;
  onDark: boolean;
}

/** Artwork/B-roll sebagai potongan kertas: kartu miring + border putih + halftone */
function drawArtworkCard(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  rot: number,
  sceneIndex: number,
  globalSec: number,
  tones: SceneTones
): void {
  const panelBase = tones.onDark ? tones.light : tones.dark;
  const panelContrast = tones.onDark ? tones.dark : tones.light;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rot * Math.PI) / 180);

  // Drop shadow kertas
  ctx.save();
  ctx.shadowColor = "rgba(10,10,11,0.28)";
  ctx.shadowBlur = w * 0.05;
  ctx.shadowOffsetY = h * 0.02;
  ctx.fillStyle = tones.dark;
  ctx.fillRect(-w / 2 - w * 0.012, -h / 2 - h * 0.012, w * 1.024, h * 1.024);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();

  if (image) {
    const scale = Math.max(w / image.width, h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);

    // Duotone aksen episode (multiply) + lift (screen) → kesan sablon
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = sceneIndex % 2 === 0 ? tones.accent : tones.accentAlt;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    drawHalftoneRect(ctx, -w / 2, -h / 2, w, h, 1);
  } else {
    /* Tanpa B-roll: 4 varian panel kolase (biar tidak monoton "kotak hitam") */
    const variant = sceneIndex % 4;
    const short = Math.min(w, h);

    if (variant === 0) {
      ctx.fillStyle = panelBase;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      drawInkBlot(ctx, 0, 0, short * 0.34, tones.accent, globalSec, 2.1);
    } else if (variant === 1) {
      // Panel aksen + setengah lingkaran halftone raksasa
      ctx.fillStyle = tones.accent;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.save();
      ctx.fillStyle = panelContrast;
      ctx.beginPath();
      ctx.arc(0, h * 0.24, short * 0.62, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = Math.max(2, short * 0.012);
      ctx.beginPath();
      ctx.arc(0, h * 0.24, short * 0.45, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (variant === 2) {
      // Bola prisma gradien (merah-hijau-biru) di atas kertas
      ctx.fillStyle = panelContrast;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      const ballR = short * 0.4;
      drawPrismSticker(ctx, 0, 0, ballR);
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawHalftoneRect(ctx, -w / 2, -h / 2, w, h, 1);
      ctx.restore();
    } else {
      // Strip diagonal + nomor scene raksasa
      ctx.fillStyle = panelBase;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.save();
      ctx.fillStyle = panelContrast;
      for (let i = -3; i < 8; i++) {
        ctx.save();
        ctx.translate(-w / 2 + i * w * 0.2 + ((globalSec * w * 0.05) % (w * 0.2)), 0);
        ctx.rotate(-0.22);
        ctx.fillRect(0, -h, w * 0.09, h * 2);
        ctx.restore();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = tones.accent;
      ctx.font = `900 ${short * 0.5}px ${HEADLINE_FONT_STACK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(sceneIndex + 1), 0, 0);
      ctx.restore();
    }

    // Titik-titik sablon halus di semua varian
    ctx.save();
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 22; i++) {
      const sx = -w / 2 + ((i * 137.5 + globalSec * 6) % w);
      const sy = -h / 2 + ((i * 71.3 + globalSec * 4) % h);
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.6)" : "rgba(10,10,11,0.45)";
      ctx.fillRect(sx, sy, w * 0.005, w * 0.005);
    }
    ctx.restore();
  }
  ctx.restore();

  // Border putih tebal ala potongan kertas
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(3, w * 0.014);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Speed-lines ala manga: sisa gerakan keras di 0.14s pertama tiap cut.
 * (Di referensi efek ini muncul sebagai garis radial + sedikit blur.)
 */
function drawWhipSmear(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  accent: string
): void {
  const a = 1 - p;
  if (a <= 0.02) return;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const n = 18;
  const reach = Math.max(w, h) * (0.55 + a * 0.35);

  ctx.save();
  ctx.globalAlpha = Math.min(0.62, a * 0.66);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + 0.31;
    const inner = w * 0.16 * (0.8 + ((i * 37) % 11) / 20);
    const lw = Math.max(2, w * 0.0035 * (0.5 + a * 1.4));
    ctx.strokeStyle = i % 3 === 0 ? accent : ZINE_PALETTE.ink;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
    ctx.lineTo(cx + Math.cos(ang) * reach, cy + Math.sin(ang) * reach);
    ctx.stroke();
  }
  ctx.restore();
}

/** Semua varian transisi keras zine (0..1 progres transisi). */
function drawZineTransition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  mode: TransitionModeId,
  accent: AccentSet
): void {
  const a = 1 - p;
  if (a <= 0.02) return;

  switch (mode) {
    case "speedlines":
      drawWhipSmear(ctx, w, h, p, accent.primary);
      return;
    case "flash": {
      ctx.save();
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      return;
    }
    case "slice": {
      // Irisan tipis: hanya menyentuh tepi atas/bawah, teks tetap terbaca
      const bands = 4;
      const bandH = h * 0.055;
      ctx.save();
      for (let i = 0; i < bands; i += 1) {
        const shift = (i % 2 === 0 ? 1 : -1) * a * w * 0.18;
        ctx.globalAlpha = a * 0.38;
        ctx.fillStyle = i % 2 === 0 ? accent.primary : accent.tertiary;
        const y = i < bands / 2 ? i * bandH : h - (bands - i) * bandH;
        ctx.fillRect(shift, y, w, bandH * 0.7);
      }
      ctx.restore();
      return;
    }
    case "page_wipe": {
      const x = w * (1 - p);
      ctx.save();
      const grad = ctx.createLinearGradient(x - w * 0.35, 0, x, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(255,255,255,0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - w * 0.35, 0, w * 0.35, h);
      ctx.fillStyle = accent.primary;
      ctx.globalAlpha = a * 0.85;
      ctx.fillRect(x - w * 0.02, 0, w * 0.02, h);
      ctx.restore();
      return;
    }
    default:
      return;
  }
}

/* ============================================================================
 * SCENE FRAME
 * ========================================================================== */


const HEADLINE_FONT_STACK =
  '"Helvetica Neue", "Arial Black", Inter, "DejaVu Sans", system-ui, sans-serif';

/** Ukur lebar headline dengan font yang benar-benar dipakai canvas. */
function measureHeadline(
  ctx: CanvasRenderingContext2D,
  line: string,
  fontPx: number
): number {
  ctx.save();
  ctx.font = `900 ${fontPx}px ${HEADLINE_FONT_STACK}`;
  const w = ctx.measureText(line).width;
  ctx.restore();
  return w;
}

/**
 * Auto-fit: pilih ukuran font terbesar yang masih muat di lebar & tinggi band.
 * Tidak ada teks yang terpotong keluar frame (referensi tetap "bleeding" karena
 * slab-nya lebih lebar dari teks, bukan karena huruf hilang).
 */
function fitHeadline(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxW: number,
  maxH: number
): { fontPx: number; lineH: number } {
  const probe = 100;
  ctx.save();
  ctx.font = `900 ${probe}px ${HEADLINE_FONT_STACK}`;
  const widest = Math.max(1, ...lines.map((l) => ctx.measureText(l).width));
  ctx.restore();

  const byWidth = (maxW / widest) * probe;
  const byHeight = maxH / (Math.max(1, lines.length) * 1.16);
  const fontPx = Math.max(26, Math.min(byWidth, byHeight));
  return { fontPx, lineH: fontPx * 1.1 };
}

/** Bungkus caption jadi maksimal `maxLines` baris, tanpa memotong kata. */
function wrapCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontPx: number,
  maxW: number,
  maxLines: number
): string[] {
  ctx.save();
  ctx.font = `600 ${fontPx}px ${HEADLINE_FONT_STACK}`;
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxW && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  ctx.restore();
  return lines;
}

function drawZineScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EditorialEpisode,
  scene: EditorialScene,
  sceneIndex: number,
  localSec: number,
  globalSec: number,
  image: HTMLImageElement | null,
  variation: VisualVariation
): void {
  const s = w / 1080;
  const sceneDur = Math.max(1, scene.durationSec);
  const punch = zinePunchScale(localSec);
  const glitch = zineGlitchOffset(localSec, sceneDur, w);
  const paper: PaperTone = variation.paper;
  const accent: AccentSet = variation.accent;
  const mode = layoutForScene(variation, sceneIndex);
  const typo = typographyForScene(variation, sceneIndex);

  // Scene dominan gelap hanya kalau episode memang memakai pola itu
  const darkEvery = variation.darkSceneEvery;
  const isDarkScene =
    paper.isDark ||
    (darkEvery > 0 && sceneIndex % darkEvery === darkEvery - 1);

  drawPaper(ctx, w, h, globalSec, paper.base, paper.deep);
  if (isDarkScene && !paper.isDark) {
    ctx.save();
    ctx.fillStyle = paper.ink; // ink gelap di tone terang
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Token kontras: berlaku untuk kertas terang maupun kertas gelap (charcoal)
  const lightTone = paper.isDark ? paper.ink : paper.base;
  const darkTone = paper.isDark ? paper.base : paper.ink;
  const inkColor = isDarkScene ? lightTone : darkTone;
  const paperColor = isDarkScene ? darkTone : lightTone;
  const tones: SceneTones = {
    light: lightTone,
    dark: darkTone,
    accent: accent.primary,
    accentAlt: accent.secondary,
    onDark: isDarkScene,
  };

  const safe = getTikTokSafeZone(w, h);
  const bandTop = Math.max(h * 0.075, safe.top + h * 0.004);
  const bandBottom = Math.min(h * 0.925, safe.bottom - h * 0.008);
  const gap = h * 0.028;
  const span = bandBottom - bandTop;

  // ---- Band komposisi per mode layout (variasi antar episode & antar scene) --
  let headBand = { top: bandTop, bottom: bandTop + span / 2 };
  let artBand = { top: bandTop, bottom: bandBottom };
  const headlineFirst = (variation.seed + sceneIndex) % 2 === 0;

  if (mode === "band_swap") {
    const split = bandTop + span * 0.5;
    headBand = headlineFirst
      ? { top: bandTop, bottom: split - gap }
      : { top: split + gap, bottom: bandBottom };
    artBand = headlineFirst
      ? { top: split + gap, bottom: bandBottom }
      : { top: bandTop, bottom: split - gap };
  } else if (mode === "full_bleed_art") {
    artBand = { top: bandTop, bottom: bandBottom };
    headBand = {
      top: bandBottom - span * 0.36,
      bottom: bandBottom,
    };
  } else if (mode === "stacked_cards") {
    artBand = { top: bandTop, bottom: bandTop + span * 0.44 };
    headBand = { top: artBand.bottom + gap, bottom: bandBottom };
  } else {
    // text_only: tipografi penuh, tanpa artwork
    headBand = { top: bandTop, bottom: bandBottom };
    artBand = { top: bandTop, bottom: bandTop };
  }

  // ---- Artwork ----
  const artH = Math.max(1, artBand.bottom - artBand.top);
  const artCy = (artBand.top + artBand.bottom) / 2;
  const fullBleed = mode === "full_bleed_art";
  // full_bleed: kartu sengaja tidak menutupi band headline di bawah,
  // jadi tipografi + caption tetap terbaca di atas kertas bersih.
  const cardH = fullBleed
    ? Math.max(artH * 0.3, headBand.top - gap * 0.5 - artBand.top)
    : mode === "stacked_cards"
      ? artH * 0.94
      : artH * 0.94;
  const cardW = fullBleed
    ? w * 0.96
    : mode === "stacked_cards"
      ? Math.min(w * 0.72, cardH * 1.25)
      : Math.min(w * 0.74, cardH * 1.06);
  const cardCy = fullBleed ? artBand.top + cardH / 2 : artCy;
  const hasArt = mode !== "text_only";

  if (hasArt) {
    drawInkBlot(
      ctx,
      w * 0.5,
      artCy,
      Math.max(cardW, cardH) * 0.56,
      accent.primary,
      globalSec,
      sceneIndex * 1.7
    );
  } else {
    // text_only: satu bentuk besar sebagai jangkar visual.
    // Selalu pakai warna AKSEN (bukan warna tinta) supaya headline di atasnya
    // tetap kontras — dulu blok hitam + teks hitam = headline hilang.
    const shapeR = Math.min(w, h) * 0.3;
    if (variation.seed % 2 === 0) {
      drawInkBlot(ctx, w * 0.5, h * 0.5, shapeR, accent.primary, globalSec, sceneIndex);
    } else {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(((sceneIndex % 2 === 0 ? -1 : 1) * 7 * Math.PI) / 180);
      ctx.fillStyle = accent.primary;
      ctx.fillRect(-w * 0.58, -h * 0.1, w * 1.16, h * 0.2);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = accent.tertiary;
      ctx.fillRect(-w * 0.58, h * 0.11, w * 0.42, h * 0.014);
      ctx.restore();
    }
  }

  // Grain + vignette DI BAWAH teks supaya tipografi tetap tajam
  const grain = getGrainCanvas(w, h);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    const ox = (globalSec * 53) % 64;
    ctx.drawImage(grain, ox - 64, 0, w + 128, h);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(w / 2, h * 0.5, w * 0.22, w / 2, h * 0.5, w * 0.95);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, isDarkScene ? "rgba(0,0,0,0.34)" : "rgba(80,60,40,0.18)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // ---- Aksen tepi per episode (warna sekunder + posisi dari seed) ----
  ctx.save();
  const stripeY = h * (0.34 + ((variation.seed >>> 3) % 40) / 100);
  const stripeW = w * (0.16 + ((variation.seed >>> 7) % 22) / 100);
  ctx.translate(w * 0.5, stripeY);
  ctx.rotate((((variation.seed % 11) - 5) * 1.6 * Math.PI) / 180);
  ctx.globalAlpha = isDarkScene ? 0.9 : 0.82;
  ctx.fillStyle = accent.secondary;
  ctx.fillRect(-stripeW / 2, -h * 0.011, stripeW, h * 0.022);
  ctx.fillStyle = accent.tertiary;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(-stripeW * 0.34, h * 0.03, stripeW * 0.68, h * 0.008);
  ctx.restore();

  // ---- Grup zoom / tilt / punch ----
  const sceneProgress = Math.min(1, localSec / sceneDur);
  const zoomDrift = 1 + 0.055 * sceneProgress;
  const tiltDrift =
    ((sceneIndex % 2 === 0 ? -1 : 1) * 0.5 * Math.min(1, localSec / 0.6) * Math.PI) / 180;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(tiltDrift);
  ctx.scale(zoomDrift, zoomDrift);
  ctx.translate(-w / 2, -h / 2);

  if (hasArt) {
    ctx.save();
    ctx.translate(w / 2, artCy);
    ctx.scale(punch, punch);
    ctx.translate(-w / 2, -artCy);
    drawArtworkCard(
      ctx,
      image,
      w / 2 - cardW / 2,
      cardCy - cardH / 2,
      cardW,
      cardH,
      variation.cardRotation + zineCardRotation(sceneIndex) * 0.5,
      sceneIndex + variation.panelOffset,
      globalSec,
      tones
    );
    ctx.restore();
  }

  // ---- Headline dengan gaya tipografi per scene ----
  const headlineText = (scene.onScreenText || scene.label || episode.title).toUpperCase();
  const bandH = headBand.bottom - headBand.top;
  const maxLines = bandH > h * 0.34 ? 3 : 2;
  const lines = zineSplitHeadline(headlineText, maxLines);
  const { fontPx, lineH } = fitHeadline(ctx, lines, w * (fullBleed ? 0.86 : 0.92), bandH);
  const blockCenterY = (headBand.top + headBand.bottom) / 2;

  lines.forEach((line, li) => {
    const y = blockCenterY + (li - (lines.length - 1) / 2) * lineH;
    const textW = measureHeadline(ctx, line, fontPx);
    const pad = fontPx * 0.42;
    const slabH = fontPx * 1.16;
    const slabW = Math.min(w * 1.04, textW + pad * 2);
    const slabRot = (((li % 2 === 0 ? -1 : 1) * (1.0 + li * 0.4)) * Math.PI) / 180;
    const whipIn = 1 - Math.min(1, localSec / 0.24);
    const offsetX =
      (li % 2 === 0 ? -1 : 1) * w * 0.012 +
      whipIn * (sceneIndex % 2 === 0 ? 1 : -1) * w * 0.07;

    ctx.save();
    ctx.translate(0, glitch.dy);

    if (typo === "outline") {
      // Tipografi outline editorial: tanpa slab, stroke tebal
      ctx.save();
      ctx.font = `900 ${fontPx}px ${HEADLINE_FONT_STACK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(2, fontPx * 0.05);
      ctx.strokeStyle = inkColor;
      ctx.strokeText(line, w / 2 + glitch.dx + offsetX, y);
      ctx.restore();
    } else if (typo === "highlight") {
      const accentLine = li === Math.floor(lines.length / 2);
      drawSlab(
        ctx,
        w / 2 - slabW / 2 + offsetX,
        y - slabH / 2,
        slabW,
        slabH,
        slabRot,
        accentLine ? accent.primary : inkColor
      );
      drawGlitchText(
        ctx,
        line,
        w / 2 + glitch.dx + offsetX,
        y,
        fontPx,
        accentLine ? accent.inkOnAccent : paperColor,
        "center",
        glitch.split
      );
    } else {
      // slab klasik (default look channel)
      drawSlab(
        ctx,
        w / 2 - slabW / 2 + offsetX,
        y - slabH / 2,
        slabW,
        slabH,
        slabRot,
        isDarkScene && li === 0 ? accent.primary : inkColor
      );
      drawGlitchText(
        ctx,
        line,
        w / 2 + glitch.dx + offsetX,
        y,
        fontPx,
        paperColor,
        "center",
        glitch.split
      );
    }
    ctx.restore();
  });

  // ---- Caption penjelas (biar penonton awam paham konteksnya) ----
  const captionText = (scene.narration || scene.onScreenText || "")
    .replace(/[*_#>`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (captionText && captionText.length > 12 && captionText !== headlineText) {
    const capFont = Math.max(18, Math.min(46, w * 0.036));
    const capMaxW = w * 0.78;
    const capLines = wrapCaption(ctx, captionText, capFont, capMaxW, 3);
    if (capLines.length > 0) {
      const capLineH = capFont * 1.32;
      const capH = capLines.length * capLineH + capFont * 0.5;
      const lastHeadY = blockCenterY + ((lines.length - 1) / 2) * lineH;
      const belowY = lastHeadY + lineH * 0.62;
      const aboveY = blockCenterY - ((lines.length - 1) / 2) * lineH - lineH * 0.62 - capH;
      const fitsBelow = belowY + capH <= headBand.bottom + h * 0.02;
      const fitsAbove = aboveY >= headBand.top - h * 0.02;
      const capTop = fitsBelow ? belowY : fitsAbove ? aboveY : -1;

      if (capTop >= 0) {
        // Scrim kertas tipis di belakang caption supaya tetap terbaca walau
        // kebetulan jatuh di atas kartu artwork (bukan cuma berharap kontras).
        const scrimPad = capFont * 0.42;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = paperColor;
        ctx.fillRect(
          w * 0.075,
          capTop - scrimPad * 0.4,
          w * 0.85,
          capH + scrimPad * 0.8
        );
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent.primary;
        ctx.fillRect(w * 0.11, capTop + capFont * 0.2, w * 0.05, Math.max(2, capFont * 0.1));
        ctx.fillStyle = inkColor;
        ctx.font = `600 ${capFont}px ${HEADLINE_FONT_STACK}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        capLines.forEach((line, li) => {
          ctx.fillText(line, w * 0.11, capTop + capFont * 0.5 + li * capLineH);
        });
        ctx.restore();
      }
    }
  }

  // ---- Chip & sticker ----
  drawChip(
    ctx,
    w * 0.05,
    h * 0.028,
    `${episode.episodeNumber ? `EP ${String(episode.episodeNumber).padStart(2, "0")}` : "FAJREZZZ"} · ${String(sceneIndex + 1).padStart(2, "0")}/${String(episode.scenes.length).padStart(2, "0")}`,
    Math.max(9, 13 * s),
    inkColor,
    paperColor
  );

  if (hasArt) {
    drawPrismSticker(
      ctx,
      w / 2 + cardW / 2 - w * 0.03,
      cardCy - cardH / 2 + w * 0.03,
      Math.max(12, w * 0.045)
    );
  } else {
    drawPrismSticker(ctx, w * 0.85, h * 0.1, Math.max(12, w * 0.04));
  }

  ctx.restore(); // tutup grup zoom/tilt

  // Label vertikal
  ctx.save();
  ctx.translate(w * 0.945, h * 0.5);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = isDarkScene ? "rgba(255,255,255,0.55)" : "rgba(10,10,11,0.5)";
  ctx.font = `800 ${Math.max(9, 13 * s)}px "Helvetica Neue", Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((scene.label || "FAJREZZZ").toUpperCase().slice(0, 22), 0, 0);
  ctx.restore();

  // Border kertas
  const border = Math.max(2, 7 * s);
  ctx.strokeStyle = isDarkScene ? "rgba(246,241,231,0.85)" : ZINE_PALETTE.white;
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, w - border, h - border);
}

/* ============================================================================
 * PUBLIC ENTRY — dipanggil dari renderEditorialFrame()
 * ========================================================================== */

export function renderZineFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: EditorialEpisode,
  elapsedSec: number,
  brollImages?: Array<HTMLImageElement | null>
): void {
  if (episode.scenes.length === 0) return;

  let cursor = 0;
  let activeIndex = 0;
  let localSec = 0;
  for (let i = 0; i < episode.scenes.length; i++) {
    const sc = episode.scenes[i];
    if (elapsedSec < cursor + sc.durationSec || i === episode.scenes.length - 1) {
      activeIndex = i;
      localSec = Math.max(0, elapsedSec - cursor);
      break;
    }
    cursor += sc.durationSec;
  }

  const scene = episode.scenes[activeIndex] ?? episode.scenes[0];
  const image = brollImages?.[activeIndex] ?? null;

  // Setiap episode punya sidik jari visual sendiri (tone kertas, aksen, layout, tipografi)
  const variation = buildVisualVariation(
    episode.title,
    episode.episodeNumber,
    episode.niche
  );

  ctx.save();
  ctx.textAlign = "center";

  // Impact flash 2 frame di setiap cut (tempo ala referensi)
  const flash = localSec < 0.05 ? 1 - localSec / 0.05 : 0;

  drawZineScene(
    ctx,
    width,
    height,
    episode,
    scene,
    activeIndex,
    localSec,
    elapsedSec,
    image,
    variation
  );

  // Transisi keras berganti gaya tiap scene (speedlines / flash / slice / page-wipe)
  if (activeIndex > 0 && localSec < 0.2) {
    drawZineTransition(
      ctx,
      width,
      height,
      localSec / 0.2,
      transitionForScene(variation, activeIndex),
      variation.accent
    );
  }

  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash * 0.22;
    ctx.fillStyle = ZINE_PALETTE.white;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}
