/**
 * VIDEO TIKTOK — "Fajrezzz AI Office" (gaya terminal Claude Code, bukan logo resmi)
 *
 * Renderer frame-per-frame 1440x2560 @120fps, 30 detik, lalu pipa ke ffmpeg.
 *
 * SUMBER GAMBAR WEB: tangkapan layar asli aplikasi fajrezzz-ai-office.vercel.app
 * (di-crop ke area aplikasi, tanpa address bar) yang disimpan di
 * `assets/shots/office/`. Tidak ada UI, angka, atau fitur yang digambar ulang.
 * Kamera (zoom/pan/punch-in) dibuat di post, bukan rekaman gerak asli — lihat
 * `docs/reports/office-tiktok/README.md` untuk batasan jujurnya.
 *
 * Pemakaian:
 *   node scripts/office-video/render.mjs            # master 2K 120fps (tanpa audio)
 *   FFMPEG_PATH=... node scripts/office-video/render.mjs
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import canvasPkg from "@napi-rs/canvas";

const { createCanvas, loadImage, GlobalFonts } = canvasPkg;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

const W = 1440;
const H = 2560;
const FPS = 120;
const DUR = 30;
const TEST_FRAMES = Number(process.env.RENDER_FRAMES ?? 0);
const TOTAL = TEST_FRAMES > 0 ? TEST_FRAMES : FPS * DUR;

const BG = "#05070a";
const GREEN = "#3ef07f";
const WHITE = "#eaf4ee";
const DIM = "#66786f";
const CYAN = "#35e0ff";
const PANEL = "#0a1110";

/* ---------------------------------- fonts --------------------------------- */

const FONT_MONO = "Mono";
const FONT_MONO_BOLD = "MonoBold";
const FONT_UI = "Inter";

GlobalFonts.registerFromPath(path.join(root, "assets/fonts/DejaVuSansMono.ttf"), FONT_MONO);
GlobalFonts.registerFromPath(path.join(root, "assets/fonts/DejaVuSansMono-Bold.ttf"), FONT_MONO_BOLD);
GlobalFonts.registerFromPath(path.join(root, "assets/fonts/InterDisplay-Bold.ttf"), FONT_UI);
GlobalFonts.registerFromPath(path.join(root, "assets/fonts/Inter-SemiBold.ttf"), "InterSemi");

/* --------------------------------- helpers -------------------------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
const easeInOut = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

/** Teks yang "diketik" mulai `start` detik dengan kecepatan `cps` karakter/detik. */
function typed(text, t, start, cps = 52) {
  const shown = Math.floor(clamp01((t - start) / (text.length / cps)) * text.length);
  return text.slice(0, Math.max(0, shown));
}

function font(size, family = FONT_MONO, weight = "") {
  return `${weight}${size}px '${family}'`;
}

function text(ctx, str, x, y, opts = {}) {
  const { size = 54, family = FONT_MONO, color = WHITE, align = "left", alpha = 1, glow = 0 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font(size, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function rounded(ctx, x, y, w, h, r, fill, stroke, strokeWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function check(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y);
  ctx.lineTo(x - size * 0.1, y + size * 0.42);
  ctx.lineTo(x + size * 0.6, y - size * 0.45);
  ctx.stroke();
  ctx.restore();
}

/** Kursor blok yang berkedip. */
function cursor(ctx, x, y, size, t, alpha = 1) {
  if (Math.floor(t * 2.6) % 2 === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = GREEN;
  ctx.fillRect(x, y - size * 0.78, size * 0.52, size * 0.9);
  ctx.restore();
}

/* ------------------------------ screenshot card --------------------------- */

const CARD_W = 812;
const SHOT_ASPECT = 2270 / 1280;

/**
 * Kartu HP berisi tangkapan layar asli.
 * zoom/pan hanya memotong area gambar (tidak menambah elemen apa pun).
 */
function drawShotCard(ctx, img, t, opt) {
  const { cx, cy, zoom = 1, panX = 0, panY = 0, tilt = 0, punch = 1, dim = 0, glowColor = GREEN } = opt;
  const scale = punch;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  const w = opt.width ?? CARD_W;
  const h = Math.round(w * SHOT_ASPECT);
  const x = -w / 2;
  const y = -h / 2;

  // bayangan + glow
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 90;
  ctx.globalAlpha = 0.5;
  rounded(ctx, x, y, w, h, 54, "#0a1412", null, 0);
  ctx.restore();

  // klip isi kartu
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + 46, y);
  ctx.arcTo(x + w, y, x + w, y + h, 46);
  ctx.arcTo(x + w, y + h, x, y + h, 46);
  ctx.arcTo(x, y + h, x, y, 46);
  ctx.arcTo(x, y, x + w, y, 46);
  ctx.closePath();
  ctx.clip();

  // Ken-Burns: ambil sub-area gambar lalu gambar penuh ke kartu
  const sw = img.width / zoom;
  const sh = img.height / zoom;
  const maxSx = img.width - sw;
  const maxSy = img.height - sh;
  const sx = Math.max(0, Math.min(maxSx, maxSx * panX));
  const sy = Math.max(0, Math.min(maxSy, maxSy * panY));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

  if (dim > 0) {
    ctx.fillStyle = `rgba(3, 8, 6, ${dim})`;
    ctx.fillRect(x, y, w, h);
  }
  // scanline halus di dalam kartu
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let yy = y; yy < y + h; yy += 6) ctx.fillRect(x, yy, w, 2);
  ctx.restore();

  // bingkai
  rounded(ctx, x, y, w, h, 46, null, "rgba(62, 240, 127, 0.35)", 3);
  ctx.restore();
}

/* -------------------------------- backgrounds ----------------------------- */

function background(ctx, t) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // glow hijau lembut di tengah atas
  const g = ctx.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.36, W * 0.95);
  g.addColorStop(0, "rgba(28, 120, 76, 0.22)");
  g.addColorStop(0.55, "rgba(10, 46, 34, 0.10)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // grid tipis
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // scanline global
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = "#000";
  for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 2);
  ctx.restore();

  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  // kedip halus pada noise supaya tidak terlihat "statis"
  ctx.save();
  ctx.globalAlpha = 0.03 + 0.012 * Math.sin(t * 9.0);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function chrome(ctx, t, frame) {
  // label atas
  text(ctx, "FAJREZZZ AI OFFICE", 96, 132, { size: 38, family: FONT_MONO_BOLD, color: DIM });
  text(ctx, "dibuat dengan AI", W - 96, 132, { size: 38, family: FONT_MONO, color: "rgba(120,140,130,0.85)", align: "right" });

  // garis progres bawah (progres video, bukan progres render)
  const p = frame / TOTAL;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#1b2a24";
  ctx.fillRect(96, H - 96, W - 192, 8);
  ctx.restore();
  ctx.fillStyle = GREEN;
  ctx.fillRect(96, H - 96, (W - 192) * p, 8);
  ctx.save();
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 24;
  ctx.fillRect(96 + (W - 192) * p - 8, H - 100, 16, 16);
  ctx.restore();
}

/* ---------------------------------- scenes -------------------------------- */

const SCENES = {
  hook: [0, 2],
  terminal: [2, 6],
  web: [6, 16],
  stack: [16, 21],
  reveal: [21, 27],
  cta: [27, 30],
};

function drawHook(ctx, t) {
  const line1 = "> aku bikin kantor AI 3D...";
  const line2 = "  100% GRATIS \u2014 tanpa biaya";
  const t1 = typed(line1, t, 0.12, 44);
  text(ctx, t1, 120, 1060, { size: 54, family: FONT_MONO_BOLD, color: GREEN, glow: 18 });
  if (t1.length < line1.length) {
    cursor(ctx, 120 + ctx.measureText(t1).width + 6, 1060, 54, t);
  } else if (t > 0.72) {
    const t2 = typed(line2, t, 0.72, 44);
    text(ctx, t2, 120, 1136, { size: 54, family: FONT_MONO_BOLD, color: WHITE });
    if (t2.length < line2.length) cursor(ctx, 120 + ctx.measureText(t2).width + 6, 1136, 54, t);
  }

  // judul besar muncul di 1,25 s dengan punch
  if (t > 1.22) {
    const k = clamp01((t - 1.22) / 0.22);
    const scale = 1.22 - 0.22 * easeOut(k);
    ctx.save();
    ctx.translate(W / 2, 1500);
    ctx.scale(scale, scale);
    ctx.globalAlpha = clamp01(k * 1.6);
    text(ctx, "VIDEO INI JUGA", 0, -40, { size: 112, family: FONT_UI, color: WHITE, align: "center" });
    text(ctx, "DIBUAT AI", 0, 96, { size: 128, family: FONT_UI, color: GREEN, align: "center", glow: 30 });
    ctx.restore();

    // garis bawah menyapu
    const sweep = easeOut(clamp01((t - 1.45) / 0.35));
    ctx.fillStyle = GREEN;
    ctx.fillRect(W / 2 - 260 * sweep, 1620, 520 * sweep, 6);
  }
}

function drawTerminal(ctx, t) {
  const x = 110;
  const size = 46;
  let y = 860;
  const lh = 84;

  // baris 1
  const open = "> membuka fajrezzz-ai-office.vercel.app";
  const t1 = typed(open, t, 2.1, 52);
  text(ctx, t1, x, y, { size, family: FONT_MONO, color: WHITE });
  if (t1.length < open.length) cursor(ctx, x + ctx.measureText(t1).width + 6, y, size, t);

  // baris 2: status loaded
  if (t > 3.15) {
    const k = easeOut(clamp01((t - 3.15) / 0.3));
    y += lh;
    check(ctx, x + 40, y - 14, 30, GREEN, k);
    text(ctx, "loaded", x + 76, y, { size, family: FONT_MONO_BOLD, color: GREEN, alpha: k, glow: 18 });
    text(ctx, "hlm. utama \u00b7 3 lantai \u00b7 15 agent", x + 310, y, { size: size - 6, family: FONT_MONO, color: DIM, alpha: k });
  }

  // baris 3
  if (t > 3.6) {
    const rec = "> mulai merekam web ...";
    const t2 = typed(rec, t, 3.6, 50);
    y += lh;
    text(ctx, t2, x, y, { size, family: FONT_MONO, color: WHITE });
    if (t2.length < rec.length) cursor(ctx, x + ctx.measureText(t2).width + 6, y, size, t);
  }

  y += 74;
  // progress bar
  if (t > 4.45) {
    const p = easeInOut(clamp01((t - 4.45) / 1.45));
    const bw = W - 220;
    rounded(ctx, x, y, bw, 34, 17, "#0d1a15", "rgba(62,240,127,0.28)", 2);
    const fillW = Math.max(0, bw * p);
    if (fillW > 8) {
      rounded(ctx, x, y, fillW, 34, 17, GREEN, null, 0);
      ctx.save();
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 40;
      ctx.fillStyle = "rgba(62,240,127,0.85)";
      ctx.fillRect(x + fillW - 12, y, 12, 34);
      ctx.restore();
    }
    text(ctx, `${Math.round(p * 100)}%`, x + bw + 24, y + 30, { size: 40, family: FONT_MONO_BOLD, color: GREEN });

    // checklist langkah
    const steps = [
      ["orbit 3 lantai", 4.75],
      ["robot bekerja", 5.15],
      ["crown sky deck", 5.55],
    ];
    steps.forEach(([label, at], i) => {
      if (t < at) return;
      const k = easeOut(clamp01((t - at) / 0.3));
      const sy = y + 110 + i * 74;
      check(ctx, x + 22, sy - 12, 30, GREEN, k);
      text(ctx, label, x + 62, sy, { size: 44, family: FONT_MONO, color: "rgba(214,232,222,0.92)", alpha: k });
    });
  }
}

const WEB_CUTS = [
  { file: "gedung-siang.jpg", caption: "3 LANTAI · 15 ROBOT AI", zoom: [1.06, 1.16], pan: [0.5, 0.35] },
  { file: "sky-deck.jpg", caption: "CROWN SKY DECK DI ATAP", zoom: [1.1, 1.02], pan: [0.35, 0.62] },
  { file: "lobby-agent.jpg", caption: "AGENT + 7 DIVISI", zoom: [1.04, 1.18], pan: [0.55, 0.4] },
  { file: "lantai-2-workspace.jpg", caption: "L1 · L2 · L3 — KERJA NYATA", zoom: [1.12, 1.03], pan: [0.42, 0.55] },
  { file: "gedung-malam.jpg", caption: "SEMUA JALAN DI WEB INI", zoom: [1.02, 1.14], pan: [0.5, 0.45] },
];

function drawWeb(ctx, t, shots) {
  const start = 6;
  const per = 2;
  const idx = Math.min(WEB_CUTS.length - 1, Math.floor((t - start) / per));
  const local = (t - start) - idx * per;
  const cut = WEB_CUTS[idx];
  const img = shots[cut.file];

  const k = clamp01(local / per);
  const zoom = cut.zoom[0] + (cut.zoom[1] - cut.zoom[0]) * easeInOut(k);
  const panX = cut.pan[0] + (cut.pan[1] - cut.pan[0]) * easeInOut(k);
  const panY = 0.5 + Math.sin(k * Math.PI) * 0.06;

  // punch-in di awal potongan (1,0 -> 1,06 -> 1,0 dalam 0,26 s)
  const punchT = clamp01(local / 0.26);
  const punch = 1.0 + 0.055 * (1 - easeOut(punchT));

  const tilt = (-1.1 + 2.2 * easeInOut(k)) * Math.PI / 180;

  drawShotCard(ctx, img, t, {
    cx: W / 2,
    cy: 1290,
    zoom,
    panX,
    panY,
    tilt,
    punch,
    glowColor: idx % 2 === 0 ? GREEN : CYAN,
  });

  // caption bawah
  const capIn = easeOut(clamp01((local - 0.18) / 0.32));
  const capY = 2060 + (1 - capIn) * 26;
  ctx.save();
  ctx.globalAlpha = 0.72 * capIn;
  rounded(ctx, 96, capY - 66, W - 192, 104, 18, "rgba(8, 18, 14, 0.72)", "rgba(62,240,127,0.22)", 2);
  ctx.restore();
  text(ctx, cut.caption, W / 2, capY + 6, { size: 50, family: FONT_MONO_BOLD, color: WHITE, align: "center", alpha: capIn });

  // indikator potongan (5 titik)
  for (let i = 0; i < WEB_CUTS.length; i += 1) {
    const dx = W / 2 - 88 + i * 44;
    ctx.save();
    ctx.globalAlpha = i === idx ? 0.95 : 0.28;
    ctx.fillStyle = i === idx ? GREEN : "#7f9188";
    ctx.beginPath();
    ctx.arc(dx, 2200, i === idx ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const STACK = [
  ["Gemini", "GRATIS"],
  ["Groq", "GRATIS"],
  ["OpenRouter", "GRATIS"],
  ["Vercel", "GRATIS"],
];

function drawStack(ctx, t) {
  const x = 110;
  const y0 = 820;
  text(ctx, typed("> cek biaya stack ...", t, 16.05, 50), x, y0, { size: 52, family: FONT_MONO, color: WHITE });

  STACK.forEach(([name, status], i) => {
    const at = 16.75 + i * 0.42;
    if (t < at) return;
    const k = easeOut(clamp01((t - at) / 0.28));
    const y = y0 + 130 + i * 96;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate((1 - k) * 26, 0);
    text(ctx, name, x, y, { size: 50, family: FONT_MONO_BOLD, color: WHITE });

    // titik-titik pemisah
    const dotsStart = x + 330;
    const dotsEnd = x + 760;
    for (let dx = dotsStart; dx < dotsEnd; dx += 22) {
      ctx.fillStyle = "rgba(120,140,130,0.5)";
      ctx.fillRect(dx, y - 12, 5, 5);
    }
    text(ctx, status, x + 790, y, { size: 50, family: FONT_MONO_BOLD, color: GREEN, glow: 14 });
    check(ctx, x + 1075, y - 16, 34, GREEN, k);
    ctx.restore();
  });

  // baris total
  if (t > 19.3) {
    const k = easeOut(clamp01((t - 19.3) / 0.35));
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.save();
    ctx.globalAlpha = k;
    rounded(ctx, 96, 1548, W - 192, 250, 26, "rgba(9, 30, 22, 0.95)", `rgba(62,240,127,${0.45 + 0.35 * pulse})`, 3);
    ctx.restore();
    text(ctx, "BIAYA BULANAN", W / 2, 1614, { size: 44, family: FONT_MONO, color: DIM, align: "center", alpha: k });
    text(ctx, "Rp0", W / 2, 1750, { size: 122, family: FONT_UI, color: GREEN, align: "center", alpha: k, glow: 40 });
  }
}

function drawReveal(ctx, t, shots) {
  const local = t - 21;
  // panel terminal atas
  const topH = 820;
  ctx.save();
  ctx.globalAlpha = 0.96;
  rounded(ctx, 72, 176, W - 144, topH, 30, PANEL, "rgba(62,240,127,0.3)", 3);
  ctx.restore();

  // tiga tombol jendela
  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(120 + i * 40, 226, 12, 0, Math.PI * 2);
    ctx.fill();
  });
  text(ctx, "agent@fajrezzz: ~/office", 260, 236, { size: 32, family: FONT_MONO, color: DIM });

  const lines = [
    ["> agen nulis naskah 30 detik ...", 21.2],
    ["> gambar 3600 frame 2K 120fps ...", 21.9],
    ["> susun teks + transisi + audio ...", 22.7],
    ["> export master + versi tiktok ...", 23.5],
    ["> selesai. 0 rupiah.", 24.3],
  ];
  lines.forEach(([line, at], i) => {
    if (t < at) return;
    const shown = typed(line, t, at, 78);
    const isLast = i === lines.length - 1;
    const ly = 326 + i * 82;
    text(ctx, shown, 128, ly, {
      size: 42,
      family: FONT_MONO,
      color: isLast ? GREEN : "rgba(220,238,228,0.92)",
      glow: isLast ? 16 : 0,
    });
    if (isLast) {
      const k = easeOut(clamp01((t - at - 0.5) / 0.3));
      check(ctx, 1180, ly - 14, 32, GREEN, k);
    }
  });

  // kartu web di bawah
  const punchT = clamp01(local / 0.3);
  const punch = 0.98 + 0.03 * easeOut(punchT);
  drawShotCard(ctx, shots["gedung-malam.jpg"], t, {
    cx: W / 2,
    cy: 1858,
    zoom: 1.04 + 0.1 * easeInOut(clamp01(local / 6)),
    panX: 0.5,
    panY: 0.45,
    tilt: 0,
    punch,
    width: 640,
    glowColor: CYAN,
  });

  // teks reveal
  const k1 = easeOut(clamp01((t - 23.2) / 0.35));
  const k2 = easeOut(clamp01((t - 23.9) / 0.35));
  text(ctx, "Naskah, visual, render \u2014", W / 2, 1104, { size: 58, family: "InterSemi", color: WHITE, align: "center", alpha: k1 });
  text(ctx, "semuanya dikerjakan agen.", W / 2, 1182, { size: 58, family: "InterSemi", color: GREEN, align: "center", alpha: k2, glow: 24 });
}

function drawCta(ctx, t) {
  const k1 = easeOut(clamp01((t - 27.15) / 0.3));
  text(ctx, "Mau tau cara bikinnya?", W / 2, 980, {
    size: 62,
    family: FONT_MONO,
    color: "rgba(214,232,222,0.92)",
    align: "center",
    alpha: k1,
  });

  if (t > 27.6) {
    const k = clamp01((t - 27.6) / 0.22);
    const scale = 1.18 - 0.18 * easeOut(k);
    const pulse = 0.5 + 0.5 * Math.sin((t - 27.6) * 7);
    ctx.save();
    ctx.translate(W / 2, 1240);
    ctx.scale(scale, scale);
    ctx.globalAlpha = clamp01(k * 1.5);
    text(ctx, "KOMEN", 0, -40, { size: 128, family: FONT_UI, color: WHITE, align: "center" });
    text(ctx, '"KANTOR"', 0, 130, { size: 168, family: FONT_UI, color: GREEN, align: "center", glow: 40 + 30 * pulse });
    ctx.restore();

    // kotak sorot
    const glow = ctx.createRadialGradient(W / 2, 1260, 60, W / 2, 1260, 420);
    glow.addColorStop(0, `rgba(62,240,127,${0.16 + 0.1 * pulse})`);
    glow.addColorStop(1, "rgba(62,240,127,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 900, W, 800);
  }

  const k3 = easeOut(clamp01((t - 28.4) / 0.4));
  text(ctx, "fajrezzz-ai-office.vercel.app", W / 2, 1700, {
    size: 44,
    family: FONT_MONO,
    color: CYAN,
    align: "center",
    alpha: k3,
  });
  text(ctx, "dibuat dengan AI · 100% gratis", W / 2, 1780, {
    size: 36,
    family: FONT_MONO,
    color: DIM,
    align: "center",
    alpha: k3,
  });
}

/* ---------------------------------- frame --------------------------------- */

function drawFrame(ctx, t, frame, shots) {
  background(ctx, t);

  if (t < SCENES.terminal[0]) drawHook(ctx, t);
  else if (t < SCENES.web[0]) drawTerminal(ctx, t);
  else if (t < SCENES.stack[0]) drawWeb(ctx, t, shots);
  else if (t < SCENES.reveal[0]) drawStack(ctx, t);
  else if (t < SCENES.cta[0]) drawReveal(ctx, t, shots);
  else drawCta(ctx, t);

  chrome(ctx, t, frame);

  // kedip putih tipis saat cut (transisi cepat)
  const cutTimes = [6, 8, 10, 12, 14, 16, 21, 27];
  for (const c of cutTimes) {
    const d = t - c;
    if (d >= 0 && d < 0.07) {
      ctx.save();
      ctx.globalAlpha = 0.16 * (1 - d / 0.07);
      ctx.fillStyle = "#d8ffe8";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}

/* ---------------------------------- main ---------------------------------- */

async function main() {
  const outDir = path.join(root, "docs/reports/office-tiktok");
  fs.mkdirSync(outDir, { recursive: true });
  const masterPath =
    TEST_FRAMES > 0
      ? path.join(root, ".video-work/office-tiktok-test.mp4")
      : path.join(outDir, "fajrezzz-office-tiktok-master-2k120.mp4");

  const shots = {};
  for (const cut of WEB_CUTS) {
    const p = path.join(root, "assets/shots/office", cut.file);
    shots[cut.file] = await loadImage(p);
  }

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // mode QA: render satu frame ke PNG
  if (process.env.RENDER_AT) {
    const at = Number(process.env.RENDER_AT);
    const stillsDir = path.join(root, ".video-work/office-stills");
    fs.mkdirSync(stillsDir, { recursive: true });
    drawFrame(ctx, at, Math.round(at * FPS), shots);
    const file = path.join(stillsDir, `t-${at.toFixed(2)}.png`);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
    console.log(`still → ${path.relative(root, file)}`);
    return;
  }

  const args = [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-f", "rawvideo",
    "-pix_fmt", "rgba",
    "-s", `${W}x${H}`,
    "-r", String(FPS),
    "-i", "-",
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-profile:v", "high",
    "-level", "6.0",
    "-pix_fmt", "yuv420p",
    // CBR 25 Mbps: bitrate master dijamin >= 25 Mbps tapi tetap ~95 MB (muat Drive 100 MB)
    "-b:v", "25M",
    "-minrate", "25M",
    "-maxrate", "25M",
    "-bufsize", "50M",
    "-x264-params", "nal-hrd=cbr:force-cfr=1",
    "-g", String(FPS * 2),
    "-movflags", "+faststart",
    masterPath,
  ];
  const ff = spawn(FFMPEG, args, { stdio: ["pipe", "inherit", "inherit"] });
  const done = once(ff, "close");

  const started = Date.now();
  for (let frame = 0; frame < TOTAL; frame += 1) {
    const t = frame / FPS;
    drawFrame(ctx, t, frame, shots);

    const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer, 0, W * H * 4);
    if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");

    if (frame % 240 === 0) {
      const pct = ((frame / TOTAL) * 100).toFixed(1);
      process.stdout.write(`frame ${frame}/${TOTAL} (${pct}%) · ${((Date.now() - started) / 1000).toFixed(0)}s\n`);
    }
  }

  ff.stdin.end();
  const [code] = await done;
  if (code !== 0) throw new Error(`ffmpeg keluar dengan kode ${code}`);

  const sizeMb = (fs.statSync(masterPath).size / 1048576).toFixed(1);
  console.log(`MASTER OK · ${W}x${H} · ${FPS}fps · ${DUR}s · ${sizeMb} MB → ${"docs/reports/office-tiktok/fajrezzz-office-tiktok-master-2k120.mp4"}`);
}

await main();
