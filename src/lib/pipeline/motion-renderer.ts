"use client";

import type { RealEpisode } from "@/types/pipeline";

export interface EditorialScene {
  sceneNumber: number;
  label: string;
  durationSec: number;
  narration: string;
  visualPrompt: string;
  onScreenText: string;
  mood: "bright" | "curious" | "dramatic" | "warm";
}

export interface EditorialEpisode {
  episodeNumber: number;
  title: string;
  niche: string;
  storyStructure: string;
  moralLesson: string;
  scenes: EditorialScene[];
}

function mapSceneMood(
  mood: "intro" | "problem" | "action" | "solve" | "celebrate"
): EditorialScene["mood"] {
  switch (mood) {
    case "problem":
      return "dramatic";
    case "action":
      return "curious";
    case "celebrate":
      return "warm";
    case "solve":
    case "intro":
    default:
      return "bright";
  }
}

export function buildEditorialEpisode(
  episode: RealEpisode
): EditorialEpisode | null {
  const script = episode.divisions.script.output;
  if (!script || script.scenes.length === 0) return null;

  const selectedIdea = episode.divisions.research.output?.ideas.find(
    (i) => i.id === episode.selectedIdeaId
  );
  const title =
    episode.divisions.seo.output?.title ||
    selectedIdea?.title ||
    episode.bossTheme;

  return {
    episodeNumber: episode.episodeNumber,
    title,
    niche: episode.bossTheme,
    storyStructure: script.storyStructure,
    moralLesson: script.moralLesson,
    scenes: script.scenes.map((sc) => ({
      sceneNumber: sc.sceneNumber,
      label: sc.label,
      durationSec: Math.max(3.5, sc.durationSec),
      narration: sc.narration,
      visualPrompt: sc.visualCue,
      onScreenText: sc.subtitle || sc.visualCue,
      mood: mapSceneMood(sc.mood),
    })),
  };
}

/* ============================================================================
   1. PRECISION REMOTION / AFTER EFFECTS MOTION PHYSICS LIBRARY
   ============================================================================ */

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Snappy After Effects cubic-bezier(0.16, 1, 0.3, 1) */
function expoOut(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/** Dramatic Whip-Pan cubic-bezier(0.87, 0, 0.13, 1) */
function expoInOut(t: number): number {
  const x = clamp01(t);
  if (x === 0) return 0;
  if (x === 1) return 1;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

/** Crisp Apple/Remotion under-damped spring */
function spring(t: number, damping = 7.4, freq = 11.2): number {
  const x = clamp01(t);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-damping * x) * Math.cos(freq * x);
}

/** Juicy pop-in overshoot for cards, icons & callouts */
function backOut(t: number, s = 1.55): number {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
}

/** Evaluate smooth cubic Bezier curve for animated MacOS cursor paths */
function cubicBezierPt(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const u = clamp01(t);
  const inv = 1 - u;
  const x =
    inv * inv * inv * p0[0] +
    3 * inv * inv * u * p1[0] +
    3 * inv * u * u * p2[0] +
    u * u * u * p3[0];
  const y =
    inv * inv * inv * p0[1] +
    3 * inv * inv * u * p1[1] +
    3 * inv * u * u * p2[1] +
    u * u * u * p3[1];
  return [x, y];
}

/* ============================================================================
   2. EDITORIAL THEME PALETTES (CLAUDE CODE OBSIDIAN <-> WARM IVORY CONTRAST)
   ============================================================================ */

interface SceneTheme {
  isLight: boolean;
  bg1: string;
  bg2: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  cardBg: string;
  cardBorder: string;
  glow: string;
  gridCol: string;
}

const DARK_CLAUDE_THEME: SceneTheme = {
  isLight: false,
  bg1: "#07080d",
  bg2: "#10131e",
  ink: "#f8fafc",
  muted: "#94a3b8",
  accent: "#d97757", // Signature Claude Coral
  accent2: "#38bdf8", // Crisp Cyan
  cardBg: "rgba(18, 22, 34, 0.92)",
  cardBorder: "rgba(255, 255, 255, 0.14)",
  glow: "rgba(217, 119, 87, 0.32)",
  gridCol: "rgba(148, 163, 184, 0.08)",
};

const IVORY_EDITORIAL_THEME: SceneTheme = {
  isLight: true,
  bg1: "#f7f5f0",
  bg2: "#ede9df",
  ink: "#111318",
  muted: "#525866",
  accent: "#d97757", // Claude Coral on Warm Ivory
  accent2: "#2563eb", // Crisp Editorial Cobalt
  cardBg: "rgba(255, 255, 255, 0.94)",
  cardBorder: "rgba(17, 19, 24, 0.11)",
  glow: "rgba(217, 119, 87, 0.22)",
  gridCol: "rgba(17, 19, 24, 0.06)",
};

const LINEAR_CYBER_THEME: SceneTheme = {
  isLight: false,
  bg1: "#060812",
  bg2: "#0f1428",
  ink: "#ffffff",
  muted: "#94a3b8",
  accent: "#38bdf8",
  accent2: "#a855f7",
  cardBg: "rgba(15, 20, 36, 0.92)",
  cardBorder: "rgba(56, 189, 248, 0.24)",
  glow: "rgba(56, 189, 248, 0.30)",
  gridCol: "rgba(56, 189, 248, 0.07)",
};

const EMERALD_FINALE_THEME: SceneTheme = {
  isLight: false,
  bg1: "#060c0e",
  bg2: "#0d1f1d",
  ink: "#f8fafc",
  muted: "#94a3b8",
  accent: "#10b981",
  accent2: "#d97757",
  cardBg: "rgba(12, 24, 24, 0.92)",
  cardBorder: "rgba(16, 185, 129, 0.26)",
  glow: "rgba(16, 185, 129, 0.30)",
  gridCol: "rgba(16, 185, 129, 0.07)",
};

type MotionTemplateKey =
  | "claude_terminal"
  | "bezier_chart"
  | "cursor_cards"
  | "split_contrast"
  | "orbit_typography"
  | "cta_finale";

function getSceneTemplate(index: number, total: number): {
  template: MotionTemplateKey;
  theme: SceneTheme;
} {
  if (index === 0) {
    return { template: "claude_terminal", theme: DARK_CLAUDE_THEME };
  }
  if (index === total - 1 && total > 1) {
    return { template: "cta_finale", theme: EMERALD_FINALE_THEME };
  }
  const cycle = (index - 1) % 4;
  if (cycle === 0) return { template: "bezier_chart", theme: IVORY_EDITORIAL_THEME };
  if (cycle === 1) return { template: "cursor_cards", theme: LINEAR_CYBER_THEME };
  if (cycle === 2) return { template: "split_contrast", theme: DARK_CLAUDE_THEME };
  return { template: "orbit_typography", theme: IVORY_EDITORIAL_THEME };
}

/* ============================================================================
   3. CRISP VECTOR DRAWING PRIMITIVES (CLAUDE SPARKLE, MAC CURSOR, MASKED TEXT)
   ============================================================================ */

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, Math.max(0, w / 2), Math.max(0, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 4
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines - 1) continue;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    const last = trimmed[maxLines - 1];
    trimmed[maxLines - 1] =
      last.length > 3 ? `${last.slice(0, Math.max(1, last.length - 3))}…` : `${last}…`;
    return trimmed;
  }
  return lines;
}

/** Iconic Claude 12-ray crisp geometric sunburst logo */
function drawClaudeSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i * Math.PI * 2) / rays;
    const len = i % 2 === 0 ? radius : radius * 0.72;
    ctx.lineWidth = Math.max(2.2, radius * (i % 2 === 0 ? 0.16 : 0.12));
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Crisp Apple/MacOS vector arrow cursor with subtle drop shadow & click press scale */
function drawMacCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  clickCompression = 0
) {
  ctx.save();
  ctx.translate(x, y);
  const s = scale * (1 - clickCompression * 0.16);
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 27);
  ctx.lineTo(7.2, 21.2);
  ctx.lineTo(12.2, 31.5);
  ctx.lineTo(16.2, 29.6);
  ctx.lineTo(11.4, 19.4);
  ctx.lineTo(19.6, 19.4);
  ctx.closePath();

  ctx.fillStyle = "#111318";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

/** Expanding click ripple + clean geometric spark burst */
function drawClickBurst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  accent: string,
  accent2: string
) {
  if (progress <= 0 || progress >= 1) return;
  const p = expoOut(progress);
  const alpha = 1 - progress;

  ctx.save();
  // Ripple ring
  ctx.beginPath();
  ctx.arc(cx, cy, 8 + p * 54, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = alpha * 0.85;
  ctx.lineWidth = Math.max(1, 3.5 * (1 - p));
  ctx.stroke();

  // 8 crisp spark dashes radiating outward
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    const r1 = 12 + p * 34;
    const r2 = 20 + p * 58;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = i % 2 === 0 ? accent : accent2;
    ctx.lineWidth = 3 * (1 - p * 0.6);
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * SIGNATURE REMOTION / APPLE KEYNOTE MASKED LINE-BY-LINE TEXT REVEAL
 * Each line slides cleanly UP from behind an invisible clip rectangle with stagger!
 */
function drawMaskedHeadline(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  align: CanvasTextAlign,
  localSec: number,
  delaySec: number,
  staggerSec: number,
  color: string,
  highlightLastLineColor?: string,
  highlightTextColor = "#ffffff"
) {
  lines.forEach((line, idx) => {
    const p = expoOut((localSec - delaySec - idx * staggerSec) / 0.52);
    if (p <= 0.001) return;

    const ly = startY + idx * lineHeight;
    const isHighlight = Boolean(highlightLastLineColor && idx === lines.length - 1);

    ctx.save();
    // Clip strictly to this line's bounding strip so text slides smoothly out of nowhere!
    ctx.beginPath();
    ctx.rect(0, ly - lineHeight * 0.65, ctx.canvas.width, lineHeight * 1.28);
    ctx.clip();

    const offsetY = (1 - p) * lineHeight * 1.15;

    if (isHighlight && highlightLastLineColor) {
      const tw = ctx.measureText(line).width;
      const padH = 18;
      const pillH = lineHeight * 0.94;
      const pillW = tw + padH * 2;
      const pillX =
        align === "center" ? x - pillW / 2 : align === "right" ? x - pillW : x - padH;
      const pillY = ly - pillH * 0.5 + offsetY;
      const sweep = expoOut((localSec - delaySec - idx * staggerSec - 0.14) / 0.44);

      if (sweep > 0.01) {
        drawRoundedRect(ctx, pillX, pillY, pillW * sweep, pillH, 14);
        ctx.fillStyle = highlightLastLineColor;
        ctx.fill();
      }
      ctx.fillStyle = sweep > 0.45 ? highlightTextColor : color;
    } else {
      ctx.fillStyle = color;
    }

    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(line, x, ly + offsetY);
    ctx.restore();
  });
}

function extractMetrics(scene: EditorialScene): number[] {
  const combined = `${scene.onScreenText} ${scene.narration} ${scene.visualPrompt}`;
  const matches = Array.from(combined.matchAll(/(\d{1,3})\s*%/g))
    .map((m) => Math.max(12, Math.min(98, Number(m[1]))))
    .filter((n) => !Number.isNaN(n));
  if (matches.length >= 2) {
    return [24, Math.min(55, matches[0]), Math.max(62, matches[1]), Math.min(96, Math.max(matches[0], matches[1]) + 8)];
  }
  if (matches.length === 1) {
    const v = matches[0];
    return [18, Math.round(v * 0.52), Math.round(v * 0.84), Math.max(v, 76)];
  }
  return [22, 41, 67, 94];
}

function extractKeyPoints(scene: EditorialScene): string[] {
  const clean = scene.narration
    .replace(/[.!?]+/g, "|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 6);

  if (clean.length >= 3) {
    return clean.slice(0, 3).map((s) => s.slice(0, 44));
  }
  const words = scene.narration.trim().split(/\s+/).filter(Boolean);
  const third = Math.max(3, Math.ceil(words.length / 3));
  return [
    words.slice(0, third).join(" ").slice(0, 44) || scene.label,
    words.slice(third, third * 2).join(" ").slice(0, 44) || scene.onScreenText.slice(0, 44),
    words.slice(third * 2).join(" ").slice(0, 44) || "Eksekusi langsung terbukti",
  ];
}

/* ============================================================================
   4. INDIVIDUAL CHOREOGRAPHED CLAUDE CODE / REMOTION SCENE RENDERERS
   ============================================================================ */

function drawSceneBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: SceneTheme,
  elapsedSec: number,
  sceneIndex: number
) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(1, theme.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Smooth drifting soft ambient glow orb (creates silky depth without visual noise)
  const ox = w * (0.28 + Math.sin(elapsedSec * 0.7 + sceneIndex) * 0.18);
  const oy = h * (0.26 + Math.cos(elapsedSec * 0.55 + sceneIndex) * 0.12);
  const g1 = ctx.createRadialGradient(ox, oy, 10, ox, oy, Math.max(w, h) * 0.65);
  g1.addColorStop(0, theme.glow);
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Clean subtle architectural blueprint grid drifting softly
  const step = w < h ? 44 : 52;
  const dx = (elapsedSec * 14) % step;
  const dy = (elapsedSec * 9) % step;
  ctx.strokeStyle = theme.gridCol;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -step + dx; x < w + step; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = -step + dy; y < h + step; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function renderSingleScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EditorialEpisode,
  sceneIndex: number,
  localSec: number,
  elapsedSec: number
) {
  const scene = episode.scenes[sceneIndex] ?? episode.scenes[0];
  const { template, theme } = getSceneTemplate(sceneIndex, episode.scenes.length);
  const isVertical = h > w;
  const padX = isVertical ? Math.round(w * 0.08) : Math.round(w * 0.08);
  const safeW = w - padX * 2;
  const sceneDur = Math.max(3, scene.durationSec);
  const sceneProg = clamp01(localSec / sceneDur);

  // Subtle living camera breathe/zoom so ZERO frames ever feel frozen
  const camZoom = 1 + sceneProg * 0.032;
  const camFloatY = Math.sin(elapsedSec * 1.4 + sceneIndex) * 3.5;

  drawSceneBackdrop(ctx, w, h, theme, elapsedSec, sceneIndex);

  ctx.save();
  ctx.translate(w / 2, h / 2 + camFloatY);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-w / 2, -h / 2);

  // Stage vertical bounds (leaves room for top chapter bar & clean floating captions below)
  const stageTop = isVertical ? Math.round(h * 0.125) : Math.round(h * 0.14);
  const stageBottom = isVertical ? Math.round(h * 0.74) : Math.round(h * 0.73);
  const stageH = stageBottom - stageTop;
  const stageCY = stageTop + stageH * 0.5;

  /* --------------------------------------------------------------------------
     TEMPLATE 1: CLAUDE CODE LIVE TERMINAL -> CURSOR CLICK -> KINETIC HOOK SLAM
     -------------------------------------------------------------------------- */
  if (template === "claude_terminal") {
    const morphT = expoInOut((localSec - 1.95) / 0.62); // Terminal morphs up into sleek badge!
    const termEnter = backOut(localSec / 0.55);

    const termW = Math.min(safeW, isVertical ? w * 0.86 : w * 0.68);
    const termHFull = isVertical ? 196 : 168;
    const termHCompact = isVertical ? 58 : 50;
    const termH = lerp(termHFull, termHCompact, morphT);
    const termX = (w - termW) / 2;
    const termY = lerp(stageCY - termHFull / 2, stageTop + 6, morphT);

    // Terminal Window Shadow & Crisp Frame
    ctx.save();
    ctx.translate(termX + termW / 2, termY + termH / 2);
    const sEnter = lerp(0.86, 1.0, clamp01(termEnter));
    ctx.scale(sEnter, sEnter);
    ctx.translate(-(termX + termW / 2), -(termY + termH / 2));

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 14;
    drawRoundedRect(ctx, termX, termY, termW, termH, lerp(24, 16, morphT));
    ctx.fillStyle = "#111521";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = morphT > 0.5 ? `${theme.accent}99` : "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Traffic light dots + Claude Sparkle header
    const dotY = termY + (morphT > 0.5 ? termH / 2 : 26);
    if (morphT < 0.7) {
      ctx.globalAlpha = 1 - morphT * 1.4;
      ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((col, di) => {
        ctx.beginPath();
        ctx.arc(termX + 24 + di * 18, dotY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      });
      ctx.font = `700 ${isVertical ? 14 : 13}px ui-monospace, SFMono-Regular, monospace`;
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("claude-code · v2.6", termX + termW - 22, dotY);
      ctx.globalAlpha = 1;
    }

    // Claude Sparkle + Live Typed Prompt Text
    const sparkX = termX + 34;
    const sparkY = morphT > 0.5 ? termY + termH / 2 : termY + 86;
    drawClaudeSparkle(ctx, sparkX, sparkY, lerp(16, 11, morphT), elapsedSec * 1.8, theme.accent);

    const promptFull = `> ${(scene.onScreenText || episode.title).slice(0, 44)}`;
    const charsTyped = Math.floor(clamp01((localSec - 0.2) / 1.15) * promptFull.length);
    const visiblePrompt = promptFull.slice(0, Math.max(2, charsTyped));
    const blinkOn = Math.floor(elapsedSec * 5) % 2 === 0;

    ctx.font = `700 ${isVertical ? (morphT > 0.5 ? 16 : 21) : (morphT > 0.5 ? 15 : 20)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const promptDrawX = sparkX + 26;
    ctx.fillText(
      visiblePrompt + (morphT < 0.4 && blinkOn ? "▌" : ""),
      promptDrawX,
      sparkY + 1
    );

    // Glowing "Run ↵" Pill inside Terminal before morph
    const runBtnW = 104;
    const runBtnH = 38;
    const runBtnX = termX + termW - runBtnW - 20;
    const runBtnY = termY + termH - runBtnH - 18;
    const clickT = clamp01((localSec - 1.65) / 0.25);
    const clickPress = clickT > 0 && clickT < 1 ? Math.sin(clickT * Math.PI) : 0;

    if (morphT < 0.35) {
      ctx.save();
      ctx.globalAlpha = 1 - morphT * 3;
      ctx.translate(runBtnX + runBtnW / 2, runBtnY + runBtnH / 2);
      ctx.scale(1 - clickPress * 0.1, 1 - clickPress * 0.1);
      drawRoundedRect(ctx, -runBtnW / 2, -runBtnH / 2, runBtnW, runBtnH, 12);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.font = "800 15px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RUN ↵", 0, 1);
      ctx.restore();
    }
    ctx.restore();

    // Animated MacOS Cursor swooping to click RUN ↵ (1.05s -> 1.85s)
    if (localSec > 0.95 && localSec < 2.25) {
      const moveT = expoOut((localSec - 0.95) / 0.68);
      const fadeOut = localSec > 1.9 ? clamp01(1 - (localSec - 1.9) / 0.32) : 1;
      const [cx, cy] = cubicBezierPt(
        [w * 0.88, h * 0.72],
        [w * 0.82, termY + termH + 40],
        [runBtnX + 80, runBtnY + 48],
        [runBtnX + runBtnW * 0.52, runBtnY + runBtnH * 0.55],
        moveT
      );
      ctx.save();
      ctx.globalAlpha = fadeOut;
      drawMacCursor(ctx, cx, cy, isVertical ? 1.25 : 1.15, clickPress);
      ctx.restore();
    }

    // Burst ripple right when RUN is clicked!
    if (localSec > 1.66) {
      drawClickBurst(
        ctx,
        runBtnX + runBtnW * 0.5,
        runBtnY + runBtnH * 0.5,
        (localSec - 1.66) / 0.55,
        theme.accent,
        theme.accent2
      );
    }

    // BEAT 3: GIANT MASKED KINETIC HEADLINE EXPLOSION (2.15s -> end)
    if (localSec > 2.05) {
      const headlineSize = isVertical ? Math.round(w * 0.088) : Math.round(w * 0.052);
      ctx.font = `900 ${headlineSize}px system-ui, -apple-system, "Inter", sans-serif`;
      const heroText = episode.title;
      const lines = wrapLines(ctx, heroText, safeW - 12, isVertical ? 4 : 3);
      const lineH = headlineSize * 1.22;
      const blockTop =
        stageTop + termHCompact + 42 + (stageH - termHCompact - 42 - lines.length * lineH) * 0.46 + lineH * 0.5;

      drawMaskedHeadline(
        ctx,
        lines,
        w / 2,
        blockTop,
        lineH,
        "center",
        localSec,
        2.12,
        0.11,
        "#ffffff",
        theme.accent,
        "#ffffff"
      );

      // Sleek animated accent underline sweeping beneath headline
      const lineSweep = expoOut((localSec - 2.65) / 0.45);
      if (lineSweep > 0.01) {
        const uw = Math.min(safeW * 0.48, 220) * lineSweep;
        const uy = blockTop + (lines.length - 0.3) * lineH + 14;
        drawRoundedRect(ctx, (w - uw) / 2, uy, uw, 5, 3);
        ctx.fillStyle = theme.accent2;
        ctx.fill();
      }
    }
  } else if (template === "bezier_chart") {
    /* ------------------------------------------------------------------------
       TEMPLATE 2: WARM IVORY EDITORIAL — LIVE SMOOTH BEZIER CURVE + ODOMETER
       ------------------------------------------------------------------------ */
    const titleSize = isVertical ? Math.round(w * 0.068) : Math.round(w * 0.039);
    ctx.font = `900 ${titleSize}px system-ui, -apple-system, "Inter", sans-serif`;
    const headText = scene.onScreenText || scene.label;
    const hLines = wrapLines(ctx, headText, safeW, 2);
    const hLineH = titleSize * 1.2;

    drawMaskedHeadline(
      ctx,
      hLines,
      padX,
      stageTop + hLineH * 0.5,
      hLineH,
      "left",
      localSec,
      0.08,
      0.1,
      theme.ink,
      theme.accent,
      "#ffffff"
    );

    // Chart Stage Geometry
    const chartTop = stageTop + hLines.length * hLineH + (isVertical ? 46 : 30);
    const chartBottom = stageBottom - (isVertical ? 44 : 28);
    const chartH = Math.max(150, chartBottom - chartTop);
    const chartL = padX + 8;
    const chartR = w - padX - 8;
    const chartW = chartR - chartL;

    // Animated Horizontal Guide Lines drawing left-to-right
    const gridDraw = expoOut((localSec - 0.22) / 0.55);
    for (let g = 0; g <= 3; g++) {
      const gy = chartTop + (chartH * g) / 3;
      ctx.strokeStyle = "rgba(17, 19, 24, 0.11)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(chartL, gy);
      ctx.lineTo(chartL + chartW * gridDraw, gy);
      ctx.stroke();
    }

    // Build smooth spline sample points from scene data
    const vals = extractMetrics(scene);
    const ctrlPts = vals.map((v, i) => ({
      x: chartL + (chartW * i) / (vals.length - 1),
      y: chartBottom - (chartH * clamp01(v / 100)) * 0.88 - 10,
      val: v,
    }));

    // Sample 60 ultra-smooth points along piecewise smooth Catmull/Cubic segments
    const samples: Array<{ x: number; y: number; val: number }> = [];
    const stepsPerSeg = 20;
    for (let s = 0; s < ctrlPts.length - 1; s++) {
      const a = ctrlPts[s];
      const b = ctrlPts[s + 1];
      const midX = (a.x + b.x) / 2;
      for (let k = 0; k <= stepsPerSeg; k++) {
        if (s > 0 && k === 0) continue;
        const u = k / stepsPerSeg;
        const [sx, sy] = cubicBezierPt(
          [a.x, a.y],
          [midX, a.y],
          [midX, b.y],
          [b.x, b.y],
          u
        );
        samples.push({ x: sx, y: sy, val: lerp(a.val, b.val, u) });
      }
    }

    const drawProg = expoOut((localSec - 0.45) / 1.85);
    const drawCount = Math.max(2, Math.floor(samples.length * drawProg));
    const visiblePts = samples.slice(0, drawCount);
    const tip = visiblePts[visiblePts.length - 1];

    // Translucent Gradient Area Fill beneath smooth curve
    if (visiblePts.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(visiblePts[0].x, chartBottom);
      visiblePts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(tip.x, chartBottom);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
      areaGrad.addColorStop(0, "rgba(217, 119, 87, 0.34)");
      areaGrad.addColorStop(1, "rgba(217, 119, 87, 0.0)");
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Bold Glowing Smooth Curve Stroke
      ctx.beginPath();
      ctx.moveTo(visiblePts[0].x, visiblePts[0].y);
      visiblePts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = isVertical ? 6.5 : 5.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();

      // Pulsing Radar Node at Live Curve Tip
      const pulse = 10 + Math.sin(elapsedSec * 7) * 3.5;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(217, 119, 87, 0.25)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Floating Dark Odometer Pill gliding directly above the curve tip!
      const pillW = isVertical ? 114 : 102;
      const pillH = isVertical ? 48 : 42;
      const pillX = Math.max(chartL, Math.min(chartR - pillW, tip.x - pillW / 2));
      const pillY = Math.max(chartTop - 16, tip.y - pillH - 18);

      ctx.save();
      ctx.shadowColor = "rgba(17, 19, 24, 0.22)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 14);
      ctx.fillStyle = "#111318";
      ctx.fill();
      ctx.restore();

      ctx.font = `900 ${isVertical ? 24 : 20}px ui-monospace, SFMono-Regular, monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(tip.val)}%`, pillX + pillW / 2, pillY + pillH / 2 + 1);
    }

    // Bottom X-axis stage labels
    const axisLabels = ["AWAL", "OPTIMASI", "SKALA", "PUNCAK"];
    ctx.font = `800 ${isVertical ? 15 : 13}px ui-monospace, monospace`;
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctrlPts.forEach((pt, idx) => {
      ctx.fillText(axisLabels[idx] || `0${idx + 1}`, pt.x, chartBottom + 12);
    });
  } else if (template === "cursor_cards") {
    /* ------------------------------------------------------------------------
       TEMPLATE 3: LINEAR / APPLE CARD STACK + ANIMATED MAC CURSOR CLICKING!
       ------------------------------------------------------------------------ */
    const hSize = isVertical ? Math.round(w * 0.064) : Math.round(w * 0.036);
    ctx.font = `900 ${hSize}px system-ui, -apple-system, "Inter", sans-serif`;
    const hLines = wrapLines(ctx, scene.onScreenText || scene.label, safeW, 2);
    const hLineH = hSize * 1.18;

    drawMaskedHeadline(
      ctx,
      hLines,
      padX,
      stageTop + hLineH * 0.5,
      hLineH,
      "left",
      localSec,
      0.06,
      0.09,
      "#ffffff"
    );

    const points = extractKeyPoints(scene);
    const listTop = stageTop + hLines.length * hLineH + (isVertical ? 32 : 22);
    const listH = stageBottom - listTop;
    const gap = isVertical ? 18 : 14;
    const cardH = Math.min(isVertical ? 116 : 82, (listH - gap * 2) / 3);
    const clickTimes = [1.05, 2.05, 3.05];

    const cardCenters: Array<[number, number]> = [];

    points.forEach((pt, idx) => {
      const enter = spring((localSec - 0.16 - idx * 0.14) / 0.55);
      const clickAt = clickTimes[idx];
      const isChecked = localSec >= clickAt;
      const pressPhase = clamp01((localSec - clickAt) / 0.22);
      const pressScale =
        pressPhase > 0 && pressPhase < 1 ? 1 - Math.sin(pressPhase * Math.PI) * 0.035 : 1;

      const cy = listTop + idx * (cardH + gap);
      cardCenters.push([padX + safeW * 0.78, cy + cardH * 0.52]);

      ctx.save();
      ctx.globalAlpha = clamp01(enter);
      ctx.translate(w / 2, cy + cardH / 2 + (1 - enter) * 44);
      ctx.scale(pressScale, pressScale);
      ctx.translate(-w / 2, -(cy + cardH / 2));

      drawRoundedRect(ctx, padX, cy, safeW, cardH, 20);
      ctx.fillStyle = isChecked ? "rgba(16, 185, 129, 0.14)" : theme.cardBg;
      ctx.fill();
      ctx.strokeStyle = isChecked ? "#10b981" : theme.cardBorder;
      ctx.lineWidth = isChecked ? 2.2 : 1.5;
      ctx.stroke();

      // Animated sweep bar inside checked card
      if (isChecked) {
        const sweepW = safeW * expoOut((localSec - clickAt) / 0.45);
        ctx.save();
        drawRoundedRect(ctx, padX, cy, safeW, cardH, 20);
        ctx.clip();
        ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
        ctx.fillRect(padX, cy, sweepW, cardH);
        ctx.restore();
      }

      // Checkbox circle morphing into crisp spring checkmark!
      const chkX = padX + 38;
      const chkY = cy + cardH / 2;
      const chkR = isVertical ? 20 : 17;
      ctx.beginPath();
      ctx.arc(chkX, chkY, chkR, 0, Math.PI * 2);
      if (isChecked) {
        const pop = backOut((localSec - clickAt) / 0.36);
        ctx.save();
        ctx.translate(chkX, chkY);
        ctx.scale(pop, pop);
        ctx.beginPath();
        ctx.arc(0, 0, chkR, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        ctx.strokeStyle = "#04130e";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(-chkR * 0.38, 0);
        ctx.lineTo(-chkR * 0.08, chkR * 0.32);
        ctx.lineTo(chkR * 0.42, -chkR * 0.32);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

      // Card text
      const tFont = isVertical ? Math.round(w * 0.036) : Math.round(w * 0.02);
      ctx.font = `800 ${tFont}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isChecked ? "#ffffff" : "#cbd5e1";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const cLines = wrapLines(ctx, pt, safeW - 110, 2);
      const cLH = tFont * 1.24;
      cLines.forEach((ln, li) => {
        ctx.fillText(ln, padX + 74, chkY + (li - (cLines.length - 1) / 2) * cLH);
      });
      ctx.restore();

      // Click particle burst!
      if (isChecked) {
        drawClickBurst(
          ctx,
          padX + safeW * 0.78,
          cy + cardH * 0.52,
          (localSec - clickAt) / 0.5,
          "#10b981",
          theme.accent
        );
      }
    });

    // Animated MacOS Cursor gliding smoothly from Card 1 -> Card 2 -> Card 3!
    if (localSec > 0.45 && cardCenters.length === 3) {
      let cx = w * 0.9;
      let cy = stageBottom + 40;
      let press = 0;

      if (localSec < clickTimes[0] + 0.25) {
        const t = expoOut((localSec - 0.45) / (clickTimes[0] - 0.45));
        [cx, cy] = cubicBezierPt(
          [w * 0.88, stageBottom + 30],
          [w * 0.9, cardCenters[0][1] + 80],
          [cardCenters[0][0] + 45, cardCenters[0][1] + 20],
          cardCenters[0],
          t
        );
        const ct = clamp01((localSec - clickTimes[0]) / 0.2);
        press = ct > 0 && ct < 1 ? Math.sin(ct * Math.PI) : 0;
      } else if (localSec < clickTimes[1] + 0.25) {
        const t = expoInOut((localSec - (clickTimes[0] + 0.25)) / (clickTimes[1] - clickTimes[0] - 0.25));
        [cx, cy] = cubicBezierPt(
          cardCenters[0],
          [cardCenters[0][0] + 50, cardCenters[0][1] + 45],
          [cardCenters[1][0] + 50, cardCenters[1][1] - 35],
          cardCenters[1],
          t
        );
        const ct = clamp01((localSec - clickTimes[1]) / 0.2);
        press = ct > 0 && ct < 1 ? Math.sin(ct * Math.PI) : 0;
      } else {
        const t = expoInOut((localSec - (clickTimes[1] + 0.25)) / (clickTimes[2] - clickTimes[1] - 0.25));
        [cx, cy] = cubicBezierPt(
          cardCenters[1],
          [cardCenters[1][0] + 50, cardCenters[1][1] + 45],
          [cardCenters[2][0] + 50, cardCenters[2][1] - 35],
          cardCenters[2],
          t
        );
        const ct = clamp01((localSec - clickTimes[2]) / 0.2);
        press = ct > 0 && ct < 1 ? Math.sin(ct * Math.PI) : 0;
      }

      drawMacCursor(ctx, cx, cy, isVertical ? 1.2 : 1.1, press);
    }
  } else if (template === "split_contrast") {
    /* ------------------------------------------------------------------------
       TEMPLATE 4: DRAMATIC SPLIT-SCREEN CONTRAST (OLD SLASHED vs NEW RISING)
       ------------------------------------------------------------------------ */
    const splitAnim = expoOut((localSec - 0.12) / 0.65);
    const expandNew = expoInOut((localSec - 1.55) / 0.72);
    const gap = 16;

    if (isVertical) {
      const oldH = lerp(stageH * 0.46, stageH * 0.36, expandNew);
      const newH = stageH - oldH - gap;
      const oldY = stageTop;
      const newY = oldY + oldH + gap;

      // TOP: OLD WAY (Muted + Animated Red Strike-Through Slash)
      ctx.save();
      ctx.globalAlpha = splitAnim;
      drawRoundedRect(ctx, padX, oldY, safeW, oldH, 24);
      ctx.fillStyle = "rgba(30, 20, 28, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.font = "800 15px ui-monospace, monospace";
      ctx.fillStyle = "#fb7185";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("✕ CARA LAMA · LAMBAT", padX + 24, oldY + 22);

      const oldVal = Math.round(28 * expoOut((localSec - 0.25) / 0.7));
      ctx.font = `900 ${Math.round(w * 0.13)}px system-ui, sans-serif`;
      ctx.fillStyle = "rgba(226, 232, 240, 0.55)";
      ctx.textBaseline = "middle";
      ctx.fillText(`${oldVal}%`, padX + 24, oldY + oldH * 0.6);

      // Animated Red Diagonal Strike-Through Slash across old number!
      const slashP = expoOut((localSec - 0.95) / 0.38);
      if (slashP > 0.01) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(padX + 18, oldY + oldH * 0.78);
        ctx.lineTo(
          lerp(padX + 18, padX + 215, slashP),
          lerp(oldY + oldH * 0.78, oldY + oldH * 0.4, slashP)
        );
        ctx.stroke();
      }
      ctx.restore();

      // BOTTOM: NEW WAY (Glowing Vibrant Expansion + Count-Up + Rising Arrow!)
      const newEnter = spring((localSec - 0.42) / 0.62);
      ctx.save();
      ctx.translate(0, (1 - newEnter) * 50);
      drawRoundedRect(ctx, padX, newY, safeW, newH, 24);
      const ng = ctx.createLinearGradient(padX, newY, padX + safeW, newY + newH);
      ng.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      ng.addColorStop(1, "rgba(56, 189, 248, 0.16)");
      ctx.fillStyle = ng;
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.font = "900 16px ui-monospace, monospace";
      ctx.fillStyle = "#34d399";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("✓ METODE BARU · OTOMATIS", padX + 24, newY + 24);

      const newVal = Math.round(94 * expoOut((localSec - 0.85) / 1.15));
      ctx.font = `900 ${Math.round(w * 0.165)}px system-ui, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(`${newVal}%`, padX + 24, newY + newH * 0.52);

      // Headline caption inside New card
      const subFont = Math.round(w * 0.04);
      ctx.font = `800 ${subFont}px system-ui, sans-serif`;
      ctx.fillStyle = "#e2e8f0";
      const nLines = wrapLines(ctx, scene.onScreenText || scene.label, safeW - 48, 2);
      nLines.forEach((ln, li) => {
        ctx.fillText(ln, padX + 24, newY + newH - 48 + li * (subFont * 1.22));
      });
      ctx.restore();
    } else {
      // Landscape Left vs Right Split
      const oldW = lerp(safeW * 0.46, safeW * 0.36, expandNew);
      const newW = safeW - oldW - gap;
      const oldX = padX;
      const newX = oldX + oldW + gap;

      drawRoundedRect(ctx, oldX, stageTop, oldW, stageH, 24);
      ctx.fillStyle = "rgba(30, 20, 28, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.38)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.font = "800 14px ui-monospace, monospace";
      ctx.fillStyle = "#fb7185";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("✕ CARA LAMA", oldX + 24, stageTop + 26);

      ctx.font = "900 72px system-ui, sans-serif";
      ctx.fillStyle = "rgba(226, 232, 240, 0.55)";
      ctx.textBaseline = "middle";
      ctx.fillText("28%", oldX + 24, stageCY);

      const slashP = expoOut((localSec - 0.9) / 0.38);
      if (slashP > 0.01) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(oldX + 18, stageCY + 34);
        ctx.lineTo(lerp(oldX + 18, oldX + 190, slashP), lerp(stageCY + 34, stageCY - 38, slashP));
        ctx.stroke();
      }

      drawRoundedRect(ctx, newX, stageTop, newW, stageH, 24);
      const ng = ctx.createLinearGradient(newX, stageTop, newX + newW, stageBottom);
      ng.addColorStop(0, "rgba(16, 185, 129, 0.24)");
      ng.addColorStop(1, "rgba(56, 189, 248, 0.16)");
      ctx.fillStyle = ng;
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.font = "900 15px ui-monospace, monospace";
      ctx.fillStyle = "#34d399";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("✓ METODE BARU · OPTIMAL", newX + 28, stageTop + 26);

      const newVal = Math.round(94 * expoOut((localSec - 0.8) / 1.15));
      ctx.font = "900 84px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(`${newVal}%`, newX + 28, stageCY - 10);

      ctx.font = "800 22px system-ui, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      const nLines = wrapLines(ctx, scene.onScreenText || scene.label, newW - 56, 2);
      nLines.forEach((ln, li) => {
        ctx.fillText(ln, newX + 28, stageBottom - 62 + li * 28);
      });
    }
  } else if (template === "orbit_typography") {
    /* ------------------------------------------------------------------------
       TEMPLATE 5: WARM IVORY ORBITAL RADIAL GAUGE + FLOATING KINETIC CHIPS
       ------------------------------------------------------------------------ */
    const ringCX = w / 2;
    const ringCY = isVertical ? stageTop + stageH * 0.34 : stageCY;
    const ringR = isVertical ? Math.min(w * 0.25, 138) : Math.min(stageH * 0.38, 128);

    // Expanding thin concentric orbital tracks
    const orbitGrow = expoOut(localSec / 0.6);
    [ringR * 1.32, ringR * 1.62].forEach((r, ri) => {
      ctx.beginPath();
      ctx.arc(ringCX, ringCY, r * orbitGrow, 0, Math.PI * 2);
      ctx.strokeStyle = ri === 0 ? "rgba(217, 119, 87, 0.24)" : "rgba(37, 99, 235, 0.16)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting bright satellite dot
      const ang = elapsedSec * (ri === 0 ? 1.1 : -0.75) + ri * 2.1;
      ctx.beginPath();
      ctx.arc(
        ringCX + Math.cos(ang) * r * orbitGrow,
        ringCY + Math.sin(ang) * r * orbitGrow,
        6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = ri === 0 ? theme.accent : theme.accent2;
      ctx.fill();
    });

    // Main Sweeping Radial Progress Ring (0 -> 96%)
    const sweep = expoOut((localSec - 0.25) / 1.35);
    const pct = Math.round(96 * sweep);
    ctx.beginPath();
    ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(17, 19, 24, 0.09)";
    ctx.lineWidth = isVertical ? 18 : 16;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ringCX, ringCY, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.96 * sweep);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = isVertical ? 18 : 16;
    ctx.lineCap = "round";
    ctx.stroke();

    // Rolling center number + sparkle
    drawClaudeSparkle(ctx, ringCX, ringCY - ringR * 0.42, 13, elapsedSec * 1.4, theme.accent);
    ctx.font = `900 ${isVertical ? Math.round(w * 0.11) : 58}px system-ui, sans-serif`;
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, ringCX, ringCY + 10);

    // Big Masked Kinetic Takeaway below (vertical) or right
    const hSize = isVertical ? Math.round(w * 0.068) : Math.round(w * 0.036);
    ctx.font = `900 ${hSize}px system-ui, -apple-system, sans-serif`;
    const tLines = wrapLines(ctx, scene.onScreenText || scene.label, safeW, 3);
    const tLH = hSize * 1.22;
    const textY = isVertical
      ? ringCY + ringR * 1.38 + 26
      : stageBottom - tLines.length * tLH + 16;

    drawMaskedHeadline(
      ctx,
      tLines,
      w / 2,
      textY,
      tLH,
      "center",
      localSec,
      0.55,
      0.11,
      theme.ink,
      theme.ink,
      "#ffffff"
    );
  } else {
    /* ------------------------------------------------------------------------
       TEMPLATE 6: CLAUDE CODE CTA FINALE + CURSOR SWOOP CLICK + SPARK BURST!
       ------------------------------------------------------------------------ */
    const sparkY = stageTop + (isVertical ? 54 : 36);
    drawClaudeSparkle(
      ctx,
      w / 2,
      sparkY,
      (isVertical ? 28 : 22) * backOut(localSec / 0.55),
      elapsedSec * 1.3,
      theme.accent2
    );

    const hSize = isVertical ? Math.round(w * 0.076) : Math.round(w * 0.044);
    ctx.font = `900 ${hSize}px system-ui, -apple-system, sans-serif`;
    const ctaText = scene.onScreenText || episode.moralLesson || episode.title;
    const lines = wrapLines(ctx, ctaText, safeW - 12, 3);
    const lineH = hSize * 1.22;

    drawMaskedHeadline(
      ctx,
      lines,
      w / 2,
      sparkY + (isVertical ? 94 : 68),
      lineH,
      "center",
      localSec,
      0.14,
      0.11,
      "#ffffff",
      theme.accent,
      "#04120d"
    );

    // Glowing CTA Pill Button + Animated MacOS Cursor Click + Confetti Burst
    const btnW = Math.min(safeW - 36, isVertical ? 410 : 370);
    const btnH = isVertical ? 68 : 58;
    const btnX = (w - btnW) / 2;
    const btnY = stageBottom - btnH - (isVertical ? 26 : 14);
    const btnEnter = backOut((localSec - 0.55) / 0.5);
    const clickAt = 1.45;
    const clickP = clamp01((localSec - clickAt) / 0.25);
    const pressScale = clickP > 0 && clickP < 1 ? 1 - Math.sin(clickP * Math.PI) * 0.09 : 1;

    ctx.save();
    ctx.translate(w / 2, btnY + btnH / 2);
    ctx.scale(clamp01(btnEnter) * pressScale, clamp01(btnEnter) * pressScale);
    ctx.shadowColor = "rgba(16, 185, 129, 0.45)";
    ctx.shadowBlur = 28;
    drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    const btng = ctx.createLinearGradient(-btnW / 2, 0, btnW / 2, 0);
    btng.addColorStop(0, theme.accent);
    btng.addColorStop(1, "#38bdf8");
    ctx.fillStyle = btng;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `900 ${isVertical ? 22 : 19}px system-ui, sans-serif`;
    ctx.fillStyle = "#04120d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      localSec >= clickAt ? "✓ TERSIMPAN · FOLLOW PART 2" : "SIMPAN & FOLLOW PART 2 →",
      0,
      1
    );
    ctx.restore();

    if (localSec > 0.75) {
      const moveT = expoOut((localSec - 0.75) / (clickAt - 0.75));
      const [cx, cy] = cubicBezierPt(
        [w * 0.88, h * 0.88],
        [w * 0.85, btnY + 85],
        [btnX + btnW * 0.85, btnY + 48],
        [btnX + btnW * 0.72, btnY + btnH * 0.56],
        moveT
      );
      drawMacCursor(ctx, cx, cy, isVertical ? 1.3 : 1.15, clickP > 0 && clickP < 1 ? Math.sin(clickP * Math.PI) : 0);
    }

    if (localSec >= clickAt) {
      drawClickBurst(
        ctx,
        btnX + btnW * 0.72,
        btnY + btnH * 0.52,
        (localSec - clickAt) / 0.7,
        "#34d399",
        "#d97757"
      );
    }
  }

  ctx.restore();
}

/* ============================================================================
   5. MASTER COMPOSITOR WITH TRUE DUAL-SCENE CROSS-TRANSITIONS & FLOATING CAPTIONS
   ============================================================================ */

const TRANSITION_SEC = 0.48;

export function renderEditorialFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: EditorialEpisode,
  elapsedSec: number,
  // Kept optional for call-site compatibility
  _brollImages?: Array<HTMLImageElement | null>
): void {
  void _brollImages;
  const isVertical = height > width;
  const padX = isVertical ? Math.round(width * 0.08) : Math.round(width * 0.08);
  const safeW = width - padX * 2;

  // Locate active scene, start time & local clock
  let cursor = 0;
  let activeIndex = 0;
  let localSec = 0;
  for (let i = 0; i < episode.scenes.length; i++) {
    const sc = episode.scenes[i];
    if (elapsedSec <= cursor + sc.durationSec || i === episode.scenes.length - 1) {
      activeIndex = i;
      localSec = Math.max(0, elapsedSec - cursor);
      break;
    }
    cursor += sc.durationSec;
  }

  const activeScene = episode.scenes[activeIndex] ?? episode.scenes[0];
  const { theme } = getSceneTemplate(activeIndex, episode.scenes.length);
  const sceneDur = Math.max(1, activeScene.durationSec);
  const sceneProg = clamp01(localSec / sceneDur);

  // TRUE DUAL-SCENE CROSS-TRANSITION (Scene N-1 animates OUT while Scene N animates IN!)
  const inTransition = activeIndex > 0 && localSec < TRANSITION_SEC;
  if (inTransition) {
    const prevIndex = activeIndex - 1;
    const prevScene = episode.scenes[prevIndex];
    const p = expoInOut(localSec / TRANSITION_SEC);
    const transType = activeIndex % 4; // 0: whip-up, 1: iris-circle, 2: zoom-through, 3: whip-left

    if (transType === 1) {
      // IRIS CIRCLE WIPE: Outgoing stays live beneath while incoming expands from a glowing circle!
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);

      const maxR = Math.hypot(width, height) * 0.65;
      const curR = Math.max(1, maxR * p);
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.45, curR, 0, Math.PI * 2);
      ctx.clip();
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();

      // Subtle glowing iris rim ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.45, curR, 0, Math.PI * 2);
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = (1 - p) * 0.7;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    } else if (transType === 2) {
      // 3D ZOOM-THROUGH: Outgoing flies past camera while incoming zooms cleanly into focus!
      ctx.save();
      ctx.translate(width / 2, height / 2);
      const outS = 1 + p * 0.36;
      ctx.scale(outS, outS);
      ctx.globalAlpha = 1 - p;
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      const inS = lerp(0.8, 1.0, p);
      ctx.scale(inS, inS);
      ctx.globalAlpha = clamp01(p * 1.25);
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();
    } else if (transType === 3) {
      // WHIP-PAN LEFT: Outgoing whips left while incoming springs in from right!
      ctx.save();
      ctx.translate(-width * p, 0);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(width * (1 - p), 0);
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();
    } else {
      // WHIP-PAN UP: Outgoing scales & lifts away while incoming slides smoothly up from bottom!
      ctx.save();
      ctx.translate(width / 2, height / 2 - height * p * 0.25);
      const outS = lerp(1, 0.9, p);
      ctx.scale(outS, outS);
      ctx.globalAlpha = 1 - p * 0.6;
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(0, height * (1 - p));
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();
    }
  } else {
    renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
  }

  /* --------------------------------------------------------------------------
     TOP MINIMALIST SEGMENTED CHAPTER PROGRESS BAR & HEADER
     -------------------------------------------------------------------------- */
  const segCount = episode.scenes.length;
  const segGap = 8;
  const segY = isVertical ? Math.round(height * 0.036) : Math.round(height * 0.044);
  const segH = isVertical ? 5 : 4.5;
  const segW = (safeW - segGap * (segCount - 1)) / Math.max(1, segCount);

  for (let i = 0; i < segCount; i++) {
    const sx = padX + i * (segW + segGap);
    drawRoundedRect(ctx, sx, segY, segW, segH, segH / 2);
    ctx.fillStyle = theme.isLight ? "rgba(17,19,24,0.12)" : "rgba(255,255,255,0.15)";
    ctx.fill();

    const fill = i < activeIndex ? 1 : i === activeIndex ? sceneProg : 0;
    if (fill > 0) {
      drawRoundedRect(ctx, sx, segY, Math.max(segH, segW * fill), segH, segH / 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
    }
  }

  const badgeY = segY + (isVertical ? 18 : 14);
  ctx.font = `800 ${isVertical ? 16 : 14}px ui-monospace, SFMono-Regular, monospace`;
  ctx.fillStyle = theme.muted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `0${activeIndex + 1} / ${activeScene.label.toUpperCase().slice(0, 22)}`,
    padX,
    badgeY
  );
  ctx.textAlign = "right";
  ctx.fillText(`FAJREZZZ · EP #${episode.episodeNumber}`, width - padX, badgeY);

  /* --------------------------------------------------------------------------
     FLOATING BORDERLESS CLAUDE-CODE / CAPCUT KINETIC CAPTIONS (ZERO CLUNKY BOX!)
     -------------------------------------------------------------------------- */
  const allWords = activeScene.narration.trim().split(/\s+/).filter(Boolean);
  const wordsPerChunk = isVertical ? 4 : 7;
  const totalWords = Math.max(1, allWords.length);
  const wordFloat = sceneProg * totalWords;
  const activeWordGlobal = Math.min(totalWords - 1, Math.floor(wordFloat));
  const wordLocalT = wordFloat - Math.floor(wordFloat);
  const activePop = 1 + Math.sin(clamp01(wordLocalT / 0.3) * Math.PI) * 0.12;
  const chunkIdx = Math.floor(activeWordGlobal / wordsPerChunk);
  const chunkStart = chunkIdx * wordsPerChunk;
  const chunkWords = allWords.slice(chunkStart, chunkStart + wordsPerChunk);
  const activeLocal = activeWordGlobal - chunkStart;

  const capFont = isVertical ? Math.round(width * 0.056) : Math.round(width * 0.03);
  ctx.font = `900 ${capFont}px system-ui, -apple-system, "Inter", sans-serif`;

  const maxCapW = safeW;
  const wordGap = Math.round(capFont * 0.34);
  const capLines: Array<Array<{ word: string; idx: number; w: number }>> = [[]];
  let curLineW = 0;

  chunkWords.forEach((w, wi) => {
    const mw = ctx.measureText(w).width;
    if (curLineW > 0 && curLineW + wordGap + mw > maxCapW) {
      capLines.push([{ word: w, idx: wi, w: mw }]);
      curLineW = mw;
    } else {
      capLines[capLines.length - 1].push({ word: w, idx: wi, w: mw });
      curLineW += (curLineW > 0 ? wordGap : 0) + mw;
    }
  });

  const capLineH = capFont * 1.44;
  const capCenterY = isVertical ? height * 0.855 : height * 0.85;
  const capStartY = capCenterY - ((capLines.length - 1) * capLineH) / 2;

  // Minimal live voice equalizer strip right above captions
  const waveBars = 9;
  const waveW = 76;
  const waveX = (width - waveW) / 2;
  const waveY = capStartY - capFont * 1.1;
  for (let b = 0; b < waveBars; b++) {
    const amp = 4 + Math.abs(Math.sin(elapsedSec * 9.5 + b * 0.8)) * 12;
    drawRoundedRect(ctx, waveX + b * (waveW / waveBars), waveY - amp / 2, 4.5, amp, 2.5);
    ctx.fillStyle = b % 2 === 0 ? theme.accent : theme.accent2;
    ctx.fill();
  }

  capLines.forEach((row, ri) => {
    const rowW =
      row.reduce((sum, item) => sum + item.w, 0) + wordGap * Math.max(0, row.length - 1);
    let rx = (width - rowW) / 2;
    const ry = capStartY + ri * capLineH;

    row.forEach((item) => {
      const isActive = item.idx === activeLocal;
      if (isActive) {
        ctx.save();
        const cx = rx + item.w / 2;
        const tilt = (activeWordGlobal % 2 === 0 ? -1 : 1) * 0.032;
        ctx.translate(cx, ry);
        ctx.rotate(tilt);
        ctx.scale(activePop, activePop);

        drawRoundedRect(
          ctx,
          -item.w / 2 - 14,
          -capFont * 0.64,
          item.w + 28,
          capFont * 1.28,
          14
        );
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = theme.accent;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.word, 0, 1);
        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if (!theme.isLight) {
          ctx.lineJoin = "round";
          ctx.lineWidth = Math.max(4, Math.round(capFont * 0.14));
          ctx.strokeStyle = "rgba(4, 6, 14, 0.85)";
          ctx.strokeText(item.word, rx, ry);
        }
        ctx.fillStyle = theme.isLight
          ? item.idx < activeLocal
            ? "#111318"
            : "rgba(17, 19, 24, 0.46)"
          : item.idx < activeLocal
          ? "#ffffff"
          : "rgba(226, 232, 240, 0.58)";
        ctx.fillText(item.word, rx, ry);
        ctx.restore();
      }
      rx += item.w + wordGap;
    });
  });
}

/* ============================================================================
   6. CRISP 1280x720 CLAUDE-CODE EDITORIAL HD THUMBNAIL RENDERER
   ============================================================================ */

export function renderEditorialThumbnail(episode: EditorialEpisode): string {
  const w = 1280;
  const h = 720;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  drawSceneBackdrop(ctx, w, h, DARK_CLAUDE_THEME, 1.5, 0);

  // Left Editorial Badge + Giant Headline
  drawClaudeSparkle(ctx, 94, 96, 26, 0.3, DARK_CLAUDE_THEME.accent);
  ctx.font = "800 22px ui-monospace, monospace";
  ctx.fillStyle = DARK_CLAUDE_THEME.accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`FAJREZZZ AI · EP #${episode.episodeNumber}`, 138, 97);

  ctx.font = '900 72px system-ui, -apple-system, "Inter", sans-serif';
  const lines = wrapLines(ctx, episode.title, 730, 4);
  lines.forEach((ln, idx) => {
    const y = 210 + idx * 88;
    if (idx === lines.length - 1) {
      const tw = ctx.measureText(ln).width;
      drawRoundedRect(ctx, 56, y - 42, tw + 36, 84, 16);
      ctx.fillStyle = DARK_CLAUDE_THEME.accent;
      ctx.fill();
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillText(ln, 74, y);
  });

  // Right Sleek Floating Terminal Preview Card
  drawRoundedRect(ctx, 842, 118, 376, 484, 28);
  ctx.fillStyle = "#111521";
  ctx.fill();
  ctx.strokeStyle = "rgba(217, 119, 87, 0.55)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((col, di) => {
    ctx.beginPath();
    ctx.arc(878 + di * 22, 154, 7, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  // Rising Smooth Curve Graphic inside right preview card
  ctx.beginPath();
  ctx.moveTo(880, 510);
  ctx.bezierCurveTo(960, 495, 1020, 320, 1175, 225);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(1175, 225, 11, 0, Math.PI * 2);
  ctx.fillStyle = DARK_CLAUDE_THEME.accent;
  ctx.fill();

  drawMacCursor(ctx, 1120, 380, 1.8, 0);

  return canvas.toDataURL("image/png");
}

/* ============================================================================
   7. PROCEDURAL CLAUDE-CODE AUDIO BED + TYPING / CLICK / WHOOSH SFX ENGINE
   ============================================================================ */

export function startAmbientSynthBed(
  connectToSpeakers = true,
  bedVolume = 0.05
): {
  audioStream: MediaStream | null;
  audioCtx: AudioContext | null;
  voiceBus: GainNode | null;
  stop: () => void;
} {
  if (typeof window === "undefined") {
    return { audioStream: null, audioCtx: null, voiceBus: null, stop: () => {} };
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    return { audioStream: null, audioCtx: null, voiceBus: null, stop: () => {} };
  }

  const ctx = new AudioCtx();
  const dest = ctx.createMediaStreamDestination();
  const master = ctx.createGain();
  master.gain.value = bedVolume;
  master.connect(dest);
  if (connectToSpeakers) master.connect(ctx.destination);

  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1.05;
  voiceBus.connect(dest);
  if (connectToSpeakers) voiceBus.connect(ctx.destination);

  const chords = [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [130.81, 196.0, 246.94, 329.63],
    [196.0, 246.94, 293.66, 329.63],
  ];
  let step = 0;

  const playChord = () => {
    if (ctx.state === "closed") return;
    const now = ctx.currentTime;
    const notes = chords[step % chords.length];
    step += 1;

    [0, 0.9].forEach((offset) => {
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "triangle";
      sub.frequency.setValueAtTime(notes[0] * 0.5, now + offset);
      subGain.gain.setValueAtTime(0.001, now + offset);
      subGain.gain.linearRampToValueAtTime(0.24, now + offset + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.5);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start(now + offset);
      sub.stop(now + offset + 0.52);
    });

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1.85);
    });
  };

  playChord();
  const intervalId = window.setInterval(playChord, 1800);

  return {
    audioStream: dest.stream,
    audioCtx: ctx,
    voiceBus,
    stop: () => {
      window.clearInterval(intervalId);
      ctx.close().catch(() => {});
    },
  };
}

/**
 * Schedule precision Claude Code / Remotion SFX synchronized to animations:
 * - Mechanical keyboard taps during Scene 1 live prompt typing
 * - Crisp Mouse Clicks timed to cursor clicks (Run button, Cards 1-3, CTA button)
 * - Deep Sub-Bass Drop on Hook reveal
 * - Silky Filtered Whoosh at every 0.48s dual-scene cross-transition
 */
export function scheduleSceneTransitionsSfx(
  audioCtx: AudioContext,
  targetBus: AudioNode,
  baseAudioTime: number,
  sceneDurations: number[]
): void {
  const noiseDur = 0.44;
  const noiseBuf = audioCtx.createBuffer(
    1,
    Math.floor(audioCtx.sampleRate * noiseDur),
    audioCtx.sampleRate
  );
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.7;
  }

  const playClick = (t: number, freq = 960, vol = 0.11) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.032);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
    osc.connect(gain);
    gain.connect(targetBus);
    osc.start(t);
    osc.stop(t + 0.042);
  };

  let offsetSec = 0;
  sceneDurations.forEach((dur, idx) => {
    const t = baseAudioTime + offsetSec;

    if (idx === 0) {
      // Soft crisp mechanical keyboard clicks during live prompt typing (0.2s - 1.3s)
      for (let k = 0; k < 10; k++) {
        playClick(t + 0.22 + k * 0.105, 760 + (k % 3) * 140, 0.045);
      }
      // Mouse click on RUN button (1.66s) + Sub-Bass Hook Impact (2.05s)
      playClick(t + 1.66, 1250, 0.14);

      const bassT = t + 2.02;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(84, bassT);
      osc.frequency.exponentialRampToValueAtTime(28, bassT + 0.5);
      gain.gain.setValueAtTime(0.001, bassT);
      gain.gain.linearRampToValueAtTime(0.28, bassT + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, bassT + 0.55);
      osc.connect(gain);
      gain.connect(targetBus);
      osc.start(bassT);
      osc.stop(bassT + 0.58);
    } else {
      // Silky Filtered Air Whoosh at every cross-scene transition
      const src = audioCtx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 2.4;
      filter.frequency.setValueAtTime(260, t);
      filter.frequency.exponentialRampToValueAtTime(2600, t + 0.18);
      filter.frequency.exponentialRampToValueAtTime(380, t + 0.42);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(targetBus);
      src.start(t);
      src.stop(t + 0.44);

      // Cursor click SFX synced to Card Stack (idx=2) & CTA Finale (last scene)
      const { template } = getSceneTemplate(idx, sceneDurations.length);
      if (template === "cursor_cards") {
        playClick(t + 1.05, 1180, 0.12);
        playClick(t + 2.05, 1280, 0.12);
        playClick(t + 3.05, 1420, 0.13);
      } else if (template === "cta_finale") {
        playClick(t + 1.45, 1340, 0.15);
      }
    }

    offsetSec += dur;
  });
}
