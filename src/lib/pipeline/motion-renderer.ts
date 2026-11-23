import type {
  PipelineScene,
  RealEpisode,
  VisualStyleId,
  WordTimingCue,
} from "@/types/pipeline";
import {
  computeSyncedSceneDuration,
  computeWordTimings,
  findActiveWordIndex,
  getTikTokSafeZone,
  SPEECH_START_OFFSET_SEC,
} from "./video-engine-v3.ts";
import { evaluateGsapSceneTimeline } from "./gsap-timeline-choreographer.ts";
import { autoSelectCinematicPresetForTopic } from "./cinematic-presets.ts";

/* ============================================================================
   FAJREZZZ AI OFFICE — V3 TIKTOK AI AGENT & CLAUDE CODE MOTION ENGINE
   - Resolution-Independent Native Vector Rendering (1080p / 2K / 4K 2160x3840)
   - 0ms-Drift Word-Level Audio-Subtitle Synchronization
   - Strict TikTok 9:16 Safe Zone (clears right buttons + top/bottom UI)
   - 7 Auto-Selected AI Visual Styles (A-G) + 8 Specialized AI/Coding Templates
   - 5 Dual-Scene Cross-Transitions with Motion Blur Streaks & 2.5D Camera Drift
   ============================================================================ */

export type SceneTemplateId =
  | "claude_terminal"
  | "ai_network_flow"
  | "github_pr_workflow"
  | "code_diff_editor"
  | "bezier_chart"
  | "cursor_cards"
  | "split_contrast"
  | "cta_finale";

export type TransitionTypeId =
  | "whip-up"
  | "iris-circle"
  | "zoom-through"
  | "whip-left"
  | "push-pull";

export interface EditorialScene {
  sceneNumber: number;
  label: string;
  durationSec: number;
  speechOffsetSec: number;
  speechDurationSec: number;
  narration: string;
  onScreenText: string;
  visualCue: string;
  visualPrompt: string;
  mood: PipelineScene["mood"];
  template: SceneTemplateId;
  transitionIn: TransitionTypeId;
  codeSnippet?: string;
  wordTimings: WordTimingCue[];
}

export interface EditorialEpisode {
  episodeNumber: number;
  title: string;
  themeLabel: string;
  niche: string;
  visualStyle: VisualStyleId;
  sourceLabel: string | null;
  scenes: EditorialScene[];
}

interface StylePalette {
  id: VisualStyleId;
  name: string;
  isLight: boolean;
  bg0: string;
  bg1: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  glow: string;
  gridColor: string;
}

const STYLE_PALETTES: Record<VisualStyleId, StylePalette> = {
  dark_ai_cinematic: {
    id: "dark_ai_cinematic",
    name: "Dark Futuristic AI Cinematic",
    isLight: false,
    bg0: "#06080f",
    bg1: "#0e1528",
    surface: "rgba(17, 24, 39, 0.90)",
    surfaceAlt: "rgba(30, 41, 59, 0.65)",
    border: "rgba(255, 255, 255, 0.13)",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#d97757", // Claude signature coral
    accent2: "#38bdf8",
    accent3: "#10b981",
    glow: "rgba(217, 119, 87, 0.35)",
    gridColor: "rgba(148, 163, 184, 0.075)",
  },
  tech_documentary: {
    id: "tech_documentary",
    name: "Premium Technology Documentary",
    isLight: true,
    bg0: "#f7f4ed",
    bg1: "#ebe6db",
    surface: "#ffffff",
    surfaceAlt: "#f1ede4",
    border: "rgba(15, 23, 42, 0.12)",
    text: "#111318",
    muted: "#57534e",
    accent: "#d95b38",
    accent2: "#0284c7",
    accent3: "#059669",
    glow: "rgba(217, 91, 56, 0.22)",
    gridColor: "rgba(15, 23, 42, 0.055)",
  },
  cyberpunk_dev: {
    id: "cyberpunk_dev",
    name: "Cyberpunk Developer Environment",
    isLight: false,
    bg0: "#070412",
    bg1: "#140b2d",
    surface: "rgba(18, 12, 38, 0.92)",
    surfaceAlt: "rgba(34, 21, 68, 0.72)",
    border: "rgba(0, 240, 255, 0.24)",
    text: "#f5f3ff",
    muted: "#a78bfa",
    accent: "#00f0ff",
    accent2: "#ff2e97",
    accent3: "#a3e635",
    glow: "rgba(0, 240, 255, 0.36)",
    gridColor: "rgba(0, 240, 255, 0.08)",
  },
  clean_tutorial: {
    id: "clean_tutorial",
    name: "Clean Professional Software Tutorial",
    isLight: false,
    bg0: "#0b1120",
    bg1: "#13203b",
    surface: "rgba(15, 23, 42, 0.94)",
    surfaceAlt: "rgba(30, 41, 59, 0.78)",
    border: "rgba(56, 189, 248, 0.22)",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#38bdf8",
    accent2: "#10b981",
    accent3: "#f59e0b",
    glow: "rgba(56, 189, 248, 0.34)",
    gridColor: "rgba(56, 189, 248, 0.07)",
  },
  agent_3d_network: {
    id: "agent_3d_network",
    name: "3D AI Agent Visualization",
    isLight: false,
    bg0: "#040814",
    bg1: "#0c1936",
    surface: "rgba(12, 22, 46, 0.90)",
    surfaceAlt: "rgba(23, 37, 84, 0.68)",
    border: "rgba(99, 102, 241, 0.28)",
    text: "#eef2ff",
    muted: "#94a3b8",
    accent: "#818cf8",
    accent2: "#2dd4bf",
    accent3: "#f472b6",
    glow: "rgba(129, 140, 248, 0.38)",
    gridColor: "rgba(129, 140, 248, 0.08)",
  },
  minimal_kinetic: {
    id: "minimal_kinetic",
    name: "Minimalist Kinetic Typography",
    isLight: true,
    bg0: "#fafaf8",
    bg1: "#efefef",
    surface: "#ffffff",
    surfaceAlt: "#f4f4f2",
    border: "rgba(10, 10, 14, 0.12)",
    text: "#0a0a0e",
    muted: "#52525b",
    accent: "#111827",
    accent2: "#ea580c",
    accent3: "#16a34a",
    glow: "rgba(234, 88, 12, 0.24)",
    gridColor: "rgba(10, 10, 14, 0.05)",
  },
  high_energy_news: {
    id: "high_energy_news",
    name: "High-Energy Tech News",
    isLight: false,
    bg0: "#0a0608",
    bg1: "#1c0d14",
    surface: "rgba(24, 14, 20, 0.92)",
    surfaceAlt: "rgba(42, 20, 30, 0.72)",
    border: "rgba(255, 59, 48, 0.28)",
    text: "#fff7f7",
    muted: "#fca5a5",
    accent: "#ff3b30",
    accent2: "#fbbf24",
    accent3: "#38bdf8",
    glow: "rgba(255, 59, 48, 0.38)",
    gridColor: "rgba(255, 59, 48, 0.075)",
  },
};

const VALID_STYLES = Object.keys(STYLE_PALETTES) as VisualStyleId[];

export function resolveVisualStyle(
  explicit: VisualStyleId | undefined,
  textHint: string
): VisualStyleId {
  if (explicit && VALID_STYLES.includes(explicit)) return explicit;
  const presetMatch = textHint.match(/Style:\s*([a-z0-9_]+)/i);
  if (presetMatch && VALID_STYLES.includes(presetMatch[1] as VisualStyleId)) {
    return presetMatch[1] as VisualStyleId;
  }
  return autoSelectCinematicPresetForTopic(textHint).mappedVisualStyle;
}

function chooseSceneTemplate(
  scene: PipelineScene,
  index: number,
  total: number
): SceneTemplateId {
  if (scene.visualTemplate) return scene.visualTemplate;
  if (index === 0) return "claude_terminal";
  if (index === total - 1) return "cta_finale";

  const cue = `${scene.label} ${scene.visualCue} ${scene.narration}`.toLowerCase();
  if (/github|commit|pull request|\bpr\b|repo|deploy/.test(cue)) return "github_pr_workflow";
  if (/multi-agent|agent|orkestrasi|jaringan|workflow|otomatis/.test(cue) && index % 2 === 1) {
    return "ai_network_flow";
  }
  if (/kode|code|script|function|diff|terminal|syntax/.test(cue)) return "code_diff_editor";
  if (/vs|manual|lama|baru|sebelum|sesudah|hemat|perbandingan/.test(cue)) return "split_contrast";
  if (/data|persen|%|grafik|cepat|angka|statistik|naik/.test(cue)) return "bezier_chart";

  const rotation: SceneTemplateId[] = [
    "ai_network_flow",
    "code_diff_editor",
    "cursor_cards",
    "split_contrast",
    "github_pr_workflow",
    "bezier_chart",
  ];
  return rotation[(index - 1) % rotation.length];
}

function chooseTransition(scene: PipelineScene, index: number): TransitionTypeId {
  if (scene.transitionIn) return scene.transitionIn;
  const order: TransitionTypeId[] = [
    "whip-up",
    "iris-circle",
    "zoom-through",
    "whip-left",
    "push-pull",
  ];
  return order[index % order.length];
}

/**
 * Builds a render-ready, audio-duration-locked EditorialEpisode from RealEpisode.
 * Uses actual measured voice durations from Divisi Suara (when available) so preview & export
 * are ALWAYS 100% locked to the spoken voiceover!
 */
export function buildEditorialEpisode(
  episode: RealEpisode,
  measuredAudioDurationsSec?: Array<number | null>
): EditorialEpisode | null {
  const script = episode.divisions.script.output;
  if (!script || script.scenes.length === 0) return null;

  const seo = episode.divisions.seo.output;
  const ideas = episode.divisions.research.output?.ideas ?? [];
  const selectedIdea = ideas.find((i) => i.id === episode.selectedIdeaId) ?? ideas[0];
  const voiceTracks = episode.divisions.voice.output?.sceneTracks ?? [];

  const title = seo?.title || selectedIdea?.title || episode.bossTheme;
  const style = resolveVisualStyle(
    script.visualStyle ?? selectedIdea?.visualStyle,
    `${title} ${episode.bossTheme} ${script.storyStructure}`
  );

  const sourceLabel =
    selectedIdea?.sourceVerified && selectedIdea.sourceName
      ? `${selectedIdea.sourceName}${
          selectedIdea.sourcePublishedAt
            ? ` · ${selectedIdea.sourcePublishedAt.slice(0, 10)}`
            : ""
        }`
      : null;

  const total = script.scenes.length;
  const usedMidTemplates = new Set<SceneTemplateId>();

  const scenes: EditorialScene[] = script.scenes.map((sc, idx) => {
    const voiceTrack = voiceTracks[idx];
    const measuredSec =
      measuredAudioDurationsSec?.[idx] ??
      voiceTrack?.actualAudioSec ??
      (voiceTrack?.status === "ready" ? voiceTrack.estimatedSec : null);

    const { sceneDurationSec, speechOffsetSec, speechDurationSec } =
      computeSyncedSceneDuration(measuredSec, sc.durationSec);

    let tpl = chooseSceneTemplate(sc, idx, total);
    // Guarantee visual variety: avoid back-to-back identical templates on middle scenes!
    if (idx > 0 && idx < total - 1 && usedMidTemplates.has(tpl)) {
      const pool: SceneTemplateId[] = [
        "ai_network_flow",
        "code_diff_editor",
        "github_pr_workflow",
        "bezier_chart",
        "cursor_cards",
        "split_contrast",
      ];
      tpl = pool.find((p) => !usedMidTemplates.has(p)) ?? tpl;
    }
    if (idx > 0 && idx < total - 1) usedMidTemplates.add(tpl);

    const wordTimings = computeWordTimings(
      sc.narration,
      speechOffsetSec,
      speechDurationSec
    );

    return {
      sceneNumber: sc.sceneNumber,
      label: sc.label,
      durationSec: sceneDurationSec,
      speechOffsetSec,
      speechDurationSec,
      narration: sc.narration,
      onScreenText: (sc.visualCue || sc.subtitle || sc.label).trim(),
      visualCue: sc.visualCue,
      visualPrompt: sc.visualCue,
      mood: sc.mood,
      template: tpl,
      transitionIn: chooseTransition(sc, idx),
      codeSnippet: sc.codeSnippet,
      wordTimings,
    };
  });

  return {
    episodeNumber: episode.episodeNumber,
    title,
    themeLabel: selectedIdea?.storyStructure || script.storyStructure || "AI Agent Studio",
    niche: selectedIdea?.storyStructure || "AI Agent",
    visualStyle: style,
    sourceLabel,
    scenes,
  };
}

/* ============================================================================
   1. PRECISION PHYSICS & EASING ENGINE
   ============================================================================ */

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function expoOut(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function expoInOut(t: number): number {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function spring(t: number, damping = 7.2, freq = 10.5): number {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return 1 - Math.exp(-damping * x) * Math.cos(freq * x);
}

function backOut(t: number, s = 1.6): number {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
}

function cubicBezierPt(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const u = 1 - clamp01(t);
  const tt = clamp01(t);
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * tt * tt;
  return [
    uuu * p0[0] + 3 * uu * tt * p1[0] + 3 * u * tt * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * tt * p1[1] + 3 * u * tt * tt * p2[1] + ttt * p3[1],
  ];
}

/* ============================================================================
   2. RESOLUTION-INDEPENDENT VECTOR PRIMITIVES (SCALES CLEANLY TO 4K 2160x3840)
   ============================================================================ */

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${cur} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next;
    } else if (lines.length < maxLines - 1) {
      lines.push(cur);
      cur = words[i];
    } else {
      // Keep remaining short words on final line instead of silently dropping them
      const candidate = `${cur} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth * 1.12) {
        cur = candidate;
      } else {
        break;
      }
    }
  }
  lines.push(cur);
  return lines;
}

function getContrastTextColor(hexColor: string): string {
  const clean = hexColor.replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.64 ? "#070b14" : "#ffffff";
}

function drawClaudeSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rot: number,
  color: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    ctx.save();
    ctx.rotate((i / rays) * Math.PI * 2);
    drawRoundedRect(ctx, -r * 0.095, -r, r * 0.19, r * 0.84, r * 0.095);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMacCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  clickPress: number
): void {
  const s = scale * (1 - clickPress * 0.16);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetY = 5 * scale;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 31);
  ctx.lineTo(7.8, 24.4);
  ctx.lineTo(13.2, 35.8);
  ctx.lineTo(17.8, 33.6);
  ctx.lineTo(12.4, 22.3);
  ctx.lineTo(22.2, 22.3);
  ctx.closePath();

  ctx.fillStyle = "#0a0c12";
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.stroke();

  if (clickPress > 0.05) {
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, clickPress * 30, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(217, 119, 87, ${(1 - clickPress) * 0.9})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawClickBurst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  s: number,
  color1: string,
  color2: string
): void {
  const p = clamp01(progress);
  if (p <= 0 || p >= 1) return;
  const eased = expoOut(p);
  const alpha = 1 - p;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + 0.2;
    const dist = (18 + (i % 3) * 14) * s + eased * 82 * s;
    const px = cx + Math.cos(ang) * dist;
    const py = cy + Math.sin(ang) * dist;
    const rad = Math.max(1.5 * s, (1 - p) * (i % 2 === 0 ? 7.5 : 5) * s);
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? color1 : color2;
    ctx.fill();
  }
  ctx.restore();
}

function drawLightSweep(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  progress: number
): void {
  const p = clamp01(progress);
  if (p <= 0 || p >= 1) return;
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  const sweepX = lerp(x - w * 0.6, x + w * 1.4, p);
  const grad = ctx.createLinearGradient(sweepX - w * 0.25, y, sweepX + w * 0.25, y + h);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.16)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawMaskedHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  maxLines: number,
  align: CanvasTextAlign,
  localSec: number,
  startDelay: number,
  staggerSec: number,
  color: string,
  accentPillBg?: string,
  accentPillText?: string
): number {
  void accentPillText;
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, "Inter", "Segoe UI", sans-serif`;
  const lines = wrapLines(ctx, text, maxWidth, maxLines);
  const lineH = fontSize * 1.18;

  lines.forEach((line, idx) => {
    const t = expoOut((localSec - (startDelay + idx * staggerSec)) / 0.42);
    if (t <= 0.005) return;
    const ly = y + idx * lineH;
    const offsetY = (1 - t) * (lineH * 1.05);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, ly - lineH * 0.56, ctx.canvas.width, lineH * 1.12);
    ctx.clip();

    ctx.globalAlpha = clamp01(t * 1.3);
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    if (accentPillBg && idx === lines.length - 1 && lines.length >= 2) {
      const tw = ctx.measureText(line).width;
      const padX = fontSize * 0.28;
      const pillW = tw + padX * 2;
      const pillH = fontSize * 1.1;
      const px = align === "center" ? x - pillW / 2 : x - padX;
      drawRoundedRect(ctx, px, ly + offsetY - pillH / 2, pillW, pillH, fontSize * 0.2);
      ctx.fillStyle = accentPillBg;
      ctx.fill();
      ctx.fillStyle = getContrastTextColor(accentPillBg);
      ctx.fillText(line, x, ly + offsetY + fontSize * 0.03);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(line, x, ly + offsetY);
    }
    ctx.restore();
  });

  return lines.length * lineH;
}

/* ============================================================================
   3. 2.5D DEPTH BACKDROP + ANIMATED GRADIENT ORBS + PARALLAX PARTICLES
   ============================================================================ */

function getScenePalette(
  baseStyle: VisualStyleId,
  sceneIndex: number,
  template: SceneTemplateId
): StylePalette {
  const primary = STYLE_PALETTES[baseStyle] ?? STYLE_PALETTES.dark_ai_cinematic;
  // Provide intentional editorial dark<->ivory visual contrast on bezier_chart when not cyberpunk
  if (
    template === "bezier_chart" &&
    baseStyle !== "cyberpunk_dev" &&
    baseStyle !== "high_energy_news"
  ) {
    return STYLE_PALETTES.tech_documentary;
  }
  if (sceneIndex % 3 === 2 && baseStyle === "minimal_kinetic") {
    return STYLE_PALETTES.dark_ai_cinematic;
  }
  return primary;
}

function drawCinematicBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
  palette: StylePalette,
  globalSec: number,
  sceneIndex: number
): void {
  // Base animated diagonal gradient
  const gx = Math.sin(globalSec * 0.45 + sceneIndex) * w * 0.12;
  const bg = ctx.createLinearGradient(gx, 0, w - gx, h);
  bg.addColorStop(0, palette.bg0);
  bg.addColorStop(1, palette.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Depth-layered animated ambient mesh orbs
  const orb1X = w * (0.24 + Math.sin(globalSec * 0.6 + sceneIndex) * 0.14);
  const orb1Y = h * (0.22 + Math.cos(globalSec * 0.48) * 0.08);
  const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, w * 0.65);
  g1.addColorStop(0, palette.glow);
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  const orb2X = w * (0.78 + Math.cos(globalSec * 0.52 + sceneIndex) * 0.12);
  const orb2Y = h * (0.68 + Math.sin(globalSec * 0.4) * 0.09);
  const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, w * 0.58);
  g2.addColorStop(
    0,
    palette.isLight ? "rgba(2, 132, 199, 0.10)" : "rgba(56, 189, 248, 0.14)"
  );
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // 2.5D Parallax Tech Dot Matrix Grid
  const step = Math.round(48 * s);
  const driftX = (globalSec * 16 * s) % step;
  const driftY = (globalSec * 11 * s) % step;
  ctx.fillStyle = palette.gridColor;
  for (let x = -step; x < w + step; x += step) {
    for (let y = -step; y < h + step; y += step) {
      ctx.fillRect(x + driftX, y + driftY, Math.max(1.5, 2.2 * s), Math.max(1.5, 2.2 * s));
    }
  }

  // Depth-parallax floating bokeh particles (3 depth layers)
  for (let i = 0; i < 18; i++) {
    const depth = (i % 3) + 1;
    const speed = depth * 18 * s;
    const seedX = ((i * 197.3 + sceneIndex * 71) % 100) / 100;
    const seedY = ((i * 313.7 + sceneIndex * 43) % 100) / 100;
    const px = ((seedX * w + globalSec * speed * 0.35) % (w + 60 * s)) - 30 * s;
    const py = ((seedY * h - globalSec * speed * 0.45) % (h + 60 * s) + h + 60 * s) % (h + 60 * s) - 30 * s;
    const pr = (1.6 + depth * 1.4) * s;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.accent2;
    ctx.globalAlpha = palette.isLight ? 0.12 : 0.14 + depth * 0.05;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ============================================================================
   4. EIGHT SPECIALIZED AI AGENT & CLAUDE CODE SCENE CHOREOGRAPHIES
   ============================================================================ */

function renderSingleScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  episode: EditorialEpisode,
  sceneIndex: number,
  localSec: number,
  globalSec: number
): void {
  const s = w / 1080;
  const scene = episode.scenes[sceneIndex] ?? episode.scenes[0];
  const palette = getScenePalette(episode.visualStyle, sceneIndex, scene.template);
  const safe = getTikTokSafeZone(w, h);
  const sceneDur = Math.max(2, scene.durationSec);

  drawCinematicBackdrop(ctx, w, h, s, palette, globalSec, sceneIndex);

  // REAL GSAP Timeline Choreography (`gsap.timeline({ paused: true })` scrubbed to localSec)
  const gsapMotion = evaluateGsapSceneTimeline(localSec, sceneDur);
  const camZoom = gsapMotion.cameraZoom;
  const camX = gsapMotion.parallaxX * 6.5 * s;
  const camY = gsapMotion.parallaxY * 5.5 * s;

  ctx.save();
  ctx.translate(safe.centerX + camX, h * 0.44 + camY);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-safe.centerX, -h * 0.44);

  // Subtle GSAP expo.inOut diagonal cinematic light sweep across the backdrop
  if (gsapMotion.lightSweep > 0.02 && gsapMotion.lightSweep < 0.98) {
    ctx.save();
    const sweepX = lerp(-w * 0.35, w * 1.35, gsapMotion.lightSweep);
    const sweepGrad = ctx.createLinearGradient(sweepX - 180 * s, 0, sweepX + 180 * s, h * 0.55);
    sweepGrad.addColorStop(0, "rgba(255,255,255,0)");
    sweepGrad.addColorStop(0.5, palette.isLight ? "rgba(255,255,255,0.14)" : "rgba(56,189,248,0.06)");
    sweepGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  const stageX = safe.left;
  const stageW = safe.width;
  const stageTop = safe.stageTop;
  const stageH = safe.stageHeight;
  const stageBottom = safe.stageBottom;
  const stageCX = safe.centerX;

  /* --------------------------------------------------------------------------
     TEMPLATE 1: CLAUDE CODE LIVE TERMINAL + IMMEDIATE 0-2s HOOK HEADLINE
     -------------------------------------------------------------------------- */
  if (scene.template === "claude_terminal") {
    // Immediate 0-2s HOOK headline at top of safe stage (synced to narrator at 0.08s!)
    const badgePop = spring((localSec - 0.04) / 0.35);
    ctx.save();
    ctx.globalAlpha = clamp01(badgePop);
    drawClaudeSparkle(ctx, stageX + 22 * s, stageTop + 26 * s, 18 * s, globalSec * 1.6, palette.accent);
    ctx.font = `800 ${Math.round(24 * s)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.fillStyle = palette.accent;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(scene.label.toUpperCase().slice(0, 26), stageX + 52 * s, stageTop + 27 * s);
    ctx.restore();

    const headFont = Math.round(62 * s);
    const usedH = drawMaskedHeadline(
      ctx,
      scene.onScreenText || episode.title,
      stageX,
      stageTop + 96 * s,
      stageW,
      headFont,
      3,
      "left",
      localSec,
      0.08, // Instant 0-2s scroll-stopper!
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    // Sleek Interactive Claude Code CLI Window right below hook
    const winEnter = spring((localSec - 0.16) / 0.48);
    const winY = stageTop + Math.max(290 * s, 108 * s + usedH + 26 * s);
    const winH = Math.max(360 * s, stageBottom - winY - 12 * s);
    const winW = stageW;

    ctx.save();
    ctx.translate(stageCX, winY + winH / 2);
    ctx.scale(lerp(0.92, 1, winEnter), lerp(0.92, 1, winEnter));
    ctx.globalAlpha = clamp01(winEnter * 1.3);
    ctx.translate(-stageCX, -(winY + winH / 2));

    ctx.shadowColor = "rgba(0,0,0,0.52)";
    ctx.shadowBlur = 42 * s;
    ctx.shadowOffsetY = 18 * s;
    drawRoundedRect(ctx, stageX, winY, winW, winH, 26 * s);
    ctx.fillStyle = "#0c101b";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Window traffic lights + title
    const headerH = 54 * s;
    ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((col, i) => {
      ctx.beginPath();
      ctx.arc(stageX + (28 + i * 24) * s, winY + headerH / 2, 7.5 * s, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
    ctx.font = `700 ${Math.round(21 * s)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("claude-code · agent-session", stageCX, winY + headerH / 2);

    ctx.beginPath();
    ctx.moveTo(stageX, winY + headerH);
    ctx.lineTo(stageX + winW, winY + headerH);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Live character-by-character multiline typing prompt (preserves \n & stays strictly inside terminal padding!)
    const cmdPrompt =
      scene.codeSnippet ||
      `claude "automate ${episode.title.split(" ").slice(0, 5).join(" ")}"`;
    const typeP = clamp01((localSec - 0.25) / Math.min(1.15, sceneDur * 0.38));
    const typedText = cmdPrompt.slice(0, Math.floor(cmdPrompt.length * typeP));

    ctx.font = `700 ${Math.round(24 * s)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = palette.accent;
    ctx.fillText("❯", stageX + 26 * s, winY + headerH + 24 * s);

    const maxTermTextW = winW - 98 * s;
    const rawTermLines = typedText.split("\n");
    const promptLines: string[] = [];
    for (const rawLine of rawTermLines) {
      if (promptLines.length >= 6) break;
      const wrapped = wrapLines(ctx, rawLine, maxTermTextW, 2);
      for (const wl of wrapped) {
        if (promptLines.length >= 6) break;
        promptLines.push(wl);
      }
    }

    promptLines.forEach((ln, li) => {
      const ly = winY + headerH + 24 * s + li * 36 * s;
      const trimmed = ln.trim();
      ctx.fillStyle = trimmed.startsWith("✓")
        ? "#34d399"
        : trimmed.startsWith("→")
        ? "#93c5fd"
        : "#f8fafc";
      ctx.fillText(ln, stageX + 56 * s, ly, maxTermTextW);
      if (li === promptLines.length - 1 && Math.floor(globalSec * 4) % 2 === 0) {
        const cw = Math.min(maxTermTextW, ctx.measureText(ln).width);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(stageX + 59 * s + cw, ly + 2 * s, 12 * s, 28 * s);
      }
    });

    // Live Agent Execution Log Steps appearing right after RUN click!
    const clickAt = Math.min(1.38, sceneDur * 0.42);
    const logs = [
      { icon: "⚡", text: "Scanning repo & git diff...", col: "#38bdf8", at: clickAt + 0.12 },
      { icon: "✓", text: "Generated 3 files (+142 -18 lines)", col: "#34d399", at: clickAt + 0.48 },
      { icon: "✓", text: "Tests passed · Ready to deploy", col: "#a3e635", at: clickAt + 0.85 },
    ];
    const logsBaseOffset = Math.max(114 * s, (42 + promptLines.length * 36) * s);
    logs.forEach((log, li) => {
      const lp = expoOut((localSec - log.at) / 0.32);
      if (lp <= 0.01) return;
      const ly = winY + headerH + logsBaseOffset + li * 40 * s + (1 - lp) * 14 * s;
      if (ly > winY + winH - 102 * s) return;
      ctx.save();
      ctx.globalAlpha = lp;
      ctx.font = `700 ${Math.round(22 * s)}px ui-monospace, SFMono-Regular, monospace`;
      ctx.fillStyle = log.col;
      ctx.fillText(`${log.icon} ${log.text}`, stageX + 30 * s, ly, winW - 60 * s);
      ctx.restore();
    });

    // RUN Button + MacOS Cursor gliding & clicking it!
    const btnW = 166 * s;
    const btnH = 54 * s;
    const btnX = stageX + winW - btnW - 24 * s;
    const btnY = winY + winH - btnH - 22 * s;
    const clickP = clamp01((localSec - clickAt) / 0.24);
    const pressScale = clickP > 0 && clickP < 1 ? 1 - Math.sin(clickP * Math.PI) * 0.1 : 1;

    ctx.save();
    ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
    ctx.scale(pressScale, pressScale);
    drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, 14 * s);
    ctx.fillStyle = localSec >= clickAt ? "#10b981" : palette.accent;
    ctx.fill();
    ctx.font = `900 ${Math.round(22 * s)}px system-ui, sans-serif`;
    ctx.fillStyle = getContrastTextColor(localSec >= clickAt ? "#10b981" : palette.accent);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(localSec >= clickAt ? "RUNNING ✓" : "RUN ↵", 0, 1 * s);
    ctx.restore();

    drawLightSweep(ctx, stageX, winY, winW, winH, 26 * s, (localSec - 0.5) / 1.4);

    if (localSec > 0.65 && localSec < clickAt + 1.1) {
      const moveT = expoOut((localSec - 0.65) / Math.max(0.25, clickAt - 0.65));
      const [cx, cy] = cubicBezierPt(
        [stageX + winW * 0.15, winY + winH + 40 * s],
        [stageX + winW * 0.45, winY + winH * 0.88],
        [btnX - 30 * s, btnY + 35 * s],
        [btnX + btnW * 0.58, btnY + btnH * 0.54],
        moveT
      );
      drawMacCursor(ctx, cx, cy, 1.35 * s, clickP > 0 && clickP < 1 ? Math.sin(clickP * Math.PI) : 0);
    }
    if (localSec >= clickAt) {
      drawClickBurst(ctx, btnX + btnW * 0.58, btnY + btnH * 0.5, (localSec - clickAt) / 0.6, s, "#34d399", palette.accent);
    }
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 2: 2.5D MULTI-AGENT AI NETWORK & ANIMATED DATA FLOW
     -------------------------------------------------------------------------- */
  } else if (scene.template === "ai_network_flow") {
    const headFont = Math.round(54 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || scene.label,
      stageX,
      stageTop + 56 * s,
      stageW,
      headFont,
      2,
      "left",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    const netTop = stageTop + 215 * s;
    const netH = stageBottom - netTop - 20 * s;
    const hubX = stageCX;
    const hubY = netTop + netH * 0.46;
    const rx = stageW * 0.34;
    const ry = netH * 0.34;

    const nodes = [
      { label: "TERMINAL", sub: "CLI Shell", ang: -Math.PI * 0.72, col: "#38bdf8" },
      { label: "GITHUB", sub: "Auto PR", ang: -Math.PI * 0.28, col: "#a78bfa" },
      { label: "CODEBASE", sub: "Diff Edit", ang: Math.PI * 0.24, col: "#10b981" },
      { label: "QA TEST", sub: "Verify", ang: Math.PI * 0.76, col: "#f59e0b" },
    ];

    // Orbital connection rings
    ctx.save();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([8 * s, 10 * s]);
    ctx.beginPath();
    ctx.ellipse(hubX, hubY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Animated Bezier edges + pulsing glowing data packets!
    nodes.forEach((node, ni) => {
      const nEnter = spring((localSec - (0.16 + ni * 0.14)) / 0.48);
      if (nEnter <= 0.01) return;
      const nx = hubX + Math.cos(node.ang + Math.sin(globalSec * 0.7 + ni) * 0.04) * rx;
      const ny = hubY + Math.sin(node.ang + Math.cos(globalSec * 0.6 + ni) * 0.04) * ry;
      const cpx = lerp(hubX, nx, 0.5) + (ni % 2 === 0 ? -38 * s : 38 * s);
      const cpy = lerp(hubY, ny, 0.5) - 24 * s;

      // Edge line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hubX, hubY);
      ctx.quadraticCurveTo(cpx, cpy, nx, ny);
      ctx.strokeStyle = node.col;
      ctx.globalAlpha = 0.42 * clamp01(nEnter);
      ctx.lineWidth = 3.2 * s;
      ctx.stroke();

      // Animated Data Packet traveling back & forth along edge!
      const pktT = (globalSec * 0.95 + ni * 0.27) % 1;
      const u = 1 - pktT;
      const px = u * u * hubX + 2 * u * pktT * cpx + pktT * pktT * nx;
      const py = u * u * hubY + 2 * u * pktT * cpy + pktT * pktT * ny;
      ctx.globalAlpha = 1;
      ctx.shadowColor = node.col;
      ctx.shadowBlur = 18 * s;
      ctx.beginPath();
      ctx.arc(px, py, 8 * s, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Floating 2.5D Agent Node Card
      const cardW = 215 * s;
      const cardH = 92 * s;
      ctx.translate(nx, ny);
      ctx.scale(clamp01(nEnter), clamp01(nEnter));
      drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 20 * s);
      ctx.fillStyle = palette.surface;
      ctx.fill();
      ctx.strokeStyle = node.col;
      ctx.lineWidth = 2.4 * s;
      ctx.stroke();

      ctx.font = `900 ${Math.round(22 * s)}px ui-monospace, monospace`;
      ctx.fillStyle = node.col;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, 0, -14 * s);

      ctx.font = `700 ${Math.round(19 * s)}px system-ui, sans-serif`;
      ctx.fillStyle = palette.text;
      ctx.fillText(node.sub, 0, 17 * s);
      ctx.restore();
    });

    // Central AI Orchestrator Core Hub
    const hubEnter = backOut((localSec - 0.08) / 0.45);
    const pulse = 1 + Math.sin(globalSec * 4.2) * 0.04;
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.scale(clamp01(hubEnter) * pulse, clamp01(hubEnter) * pulse);
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 40 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 76 * s, 0, Math.PI * 2);
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.shadowBlur = 0;

    drawClaudeSparkle(ctx, 0, -14 * s, 26 * s, globalSec * 1.1, "#ffffff");
    ctx.font = `900 ${Math.round(21 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI AGENT", 0, 28 * s);
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 3: GITHUB PULL REQUEST & CI PIPELINE WORKFLOW
     -------------------------------------------------------------------------- */
  } else if (scene.template === "github_pr_workflow") {
    const headFont = Math.round(54 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || scene.label,
      stageX,
      stageTop + 56 * s,
      stageW,
      headFont,
      2,
      "left",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent2,
      "#06101b"
    );

    const panelY = stageTop + 215 * s;
    const panelH = stageBottom - panelY - 12 * s;
    const enter = spring((localSec - 0.14) / 0.46);

    ctx.save();
    ctx.translate(0, (1 - enter) * 45 * s);
    ctx.globalAlpha = clamp01(enter * 1.25);

    drawRoundedRect(ctx, stageX, panelY, stageW, panelH, 26 * s);
    ctx.fillStyle = "#0d1117";
    ctx.fill();
    ctx.strokeStyle = "rgba(139, 148, 158, 0.35)";
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();

    // PR Header pill (OPEN -> MERGED transition!)
    const mergedAt = Math.min(sceneDur * 0.62, 2.1);
    const isMerged = localSec >= mergedAt;
    const pillW = 185 * s;
    const pillH = 48 * s;
    drawRoundedRect(ctx, stageX + 28 * s, panelY + 28 * s, pillW, pillH, 24 * s);
    ctx.fillStyle = isMerged ? "#8957e5" : "#238636";
    ctx.fill();
    ctx.font = `900 ${Math.round(21 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isMerged ? "● MERGED" : "● OPEN PR", stageX + 28 * s + pillW / 2, panelY + 52 * s);

    ctx.textAlign = "left";
    ctx.fillStyle = "#e6edf3";
    ctx.font = `800 ${Math.round(24 * s)}px ui-monospace, monospace`;
    ctx.fillText("feat/ai-agent-autopilot", stageX + 230 * s, panelY + 52 * s);

    // Animated Git Diff File Rows
    const files = [
      { name: "src/agent/orchestrator.ts", add: "+128", del: "-14", at: 0.32 },
      { name: "src/tools/github-cli.ts", add: "+86", del: "-6", at: 0.72 },
      { name: "tests/pipeline.spec.ts", add: "+64", del: "-0", at: 1.12 },
    ];
    files.forEach((f, fi) => {
      const fp = expoOut((localSec - f.at) / 0.36);
      if (fp <= 0.01) return;
      const ry = panelY + 108 * s + fi * 84 * s;
      ctx.save();
      ctx.globalAlpha = fp;
      ctx.translate((1 - fp) * 30 * s, 0);
      drawRoundedRect(ctx, stageX + 26 * s, ry, stageW - 52 * s, 68 * s, 16 * s);
      ctx.fillStyle = "rgba(33, 38, 45, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();

      ctx.font = `700 ${Math.round(22 * s)}px ui-monospace, monospace`;
      ctx.fillStyle = "#e6edf3";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(f.name, stageX + 46 * s, ry + 34 * s);

      ctx.textAlign = "right";
      ctx.fillStyle = "#3fb950";
      ctx.fillText(f.add, stageX + stageW - 115 * s, ry + 34 * s);
      ctx.fillStyle = "#f85149";
      ctx.fillText(f.del, stageX + stageW - 44 * s, ry + 34 * s);
      ctx.restore();
    });

    // CI Checks Bar at bottom of PR Card
    const ciY = panelY + panelH - 122 * s;
    const ciItems = [
      { label: "TypeCheck", at: 1.05 },
      { label: "Unit Tests", at: 1.45 },
      { label: "Prod Build", at: 1.85 },
    ];
    const ciW = (stageW - 52 * s - 24 * s) / 3;
    ciItems.forEach((ci, idx) => {
      const ok = localSec >= ci.at;
      const cx = stageX + 26 * s + idx * (ciW + 12 * s);
      drawRoundedRect(ctx, cx, ciY, ciW, 88 * s, 16 * s);
      ctx.fillStyle = ok ? "rgba(35, 134, 54, 0.25)" : "rgba(33, 38, 45, 0.85)";
      ctx.fill();
      ctx.strokeStyle = ok ? "#3fb950" : "rgba(139, 148, 158, 0.25)";
      ctx.lineWidth = 2 * s;
      ctx.stroke();

      ctx.font = `900 ${Math.round(24 * s)}px system-ui, sans-serif`;
      ctx.fillStyle = ok ? "#3fb950" : "#8b949e";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ok ? "✓ PASS" : "⋯ RUN", cx + ciW / 2, ciY + 30 * s);

      ctx.font = `700 ${Math.round(19 * s)}px ui-monospace, monospace`;
      ctx.fillStyle = "#e6edf3";
      ctx.fillText(ci.label, cx + ciW / 2, ciY + 62 * s);
    });

    drawLightSweep(ctx, stageX, panelY, stageW, panelH, 26 * s, (localSec - mergedAt) / 0.8);
    if (isMerged) {
      drawClickBurst(ctx, stageX + 120 * s, panelY + 52 * s, (localSec - mergedAt) / 0.65, s, "#a78bfa", "#3fb950");
    }
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 4: LIVE CODE DIFF EDITOR (SYNTAX TYPING + DIFF HIGHLIGHTS)
     -------------------------------------------------------------------------- */
  } else if (scene.template === "code_diff_editor") {
    const headFont = Math.round(54 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || scene.label,
      stageX,
      stageTop + 56 * s,
      stageW,
      headFont,
      2,
      "left",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    const edY = stageTop + 215 * s;
    const edH = stageBottom - edY - 12 * s;
    const enter = spring((localSec - 0.14) / 0.46);

    ctx.save();
    ctx.translate(0, (1 - enter) * 40 * s);
    drawRoundedRect(ctx, stageX, edY, stageW, edH, 24 * s);
    ctx.fillStyle = "#0b1020";
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();

    // Editor file tab header
    drawRoundedRect(ctx, stageX + 20 * s, edY + 16 * s, 270 * s, 44 * s, 12 * s);
    ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
    ctx.fill();
    ctx.font = `800 ${Math.round(21 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("agent-workflow.ts", stageX + 38 * s, edY + 38 * s);

    const codeLines = [
      { kind: "norm", text: "const agent = createClaudeAgent({" },
      { kind: "add", text: "+  tools: ['terminal', 'github', 'tests']," },
      { kind: "add", text: "+  mode: 'autonomous-verify'," },
      { kind: "norm", text: "});" },
      { kind: "del", text: "- // manual copy-paste debugging" },
      { kind: "add", text: "+ const pr = await agent.shipFeature();" },
      { kind: "add", text: "+ console.log('LIVE:', pr.url);" },
    ];

    const revealLines = Math.min(
      codeLines.length,
      Math.max(1, Math.ceil(expoOut(localSec / Math.min(sceneDur * 0.72, 2.4)) * codeLines.length))
    );

    codeLines.slice(0, revealLines).forEach((ln, li) => {
      const ly = edY + 86 * s + li * 62 * s;
      if (ly + 52 * s > edY + edH - 16 * s) return;

      if (ln.kind === "add") {
        ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
        ctx.fillRect(stageX + 8 * s, ly - 10 * s, stageW - 16 * s, 50 * s);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(stageX + 8 * s, ly - 10 * s, 6 * s, 50 * s);
      } else if (ln.kind === "del") {
        ctx.fillStyle = "rgba(244, 63, 94, 0.16)";
        ctx.fillRect(stageX + 8 * s, ly - 10 * s, stageW - 16 * s, 50 * s);
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(stageX + 8 * s, ly - 10 * s, 6 * s, 50 * s);
      }

      ctx.font = `700 ${Math.round(23 * s)}px ui-monospace, SFMono-Regular, monospace`;
      ctx.fillStyle = "rgba(148,163,184,0.45)";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(li + 1), stageX + 52 * s, ly + 15 * s);

      ctx.textAlign = "left";
      ctx.fillStyle =
        ln.kind === "add" ? "#6ee7b7" : ln.kind === "del" ? "#fda4af" : "#e2e8f0";
      ctx.fillText(ln.text.slice(0, 42), stageX + 68 * s, ly + 15 * s);
    });

    drawLightSweep(ctx, stageX, edY, stageW, edH, 24 * s, (localSec - 0.8) / 1.4);
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 5: EDITORIAL SMOOTH BEZIER CURVE CHART + GLIDING ODOMETER
     -------------------------------------------------------------------------- */
  } else if (scene.template === "bezier_chart") {
    const headFont = Math.round(54 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || scene.label,
      stageX,
      stageTop + 56 * s,
      stageW,
      headFont,
      2,
      "left",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    const cardY = stageTop + 218 * s;
    const cardH = stageBottom - cardY - 12 * s;
    const enter = spring((localSec - 0.12) / 0.45);

    ctx.save();
    ctx.translate(0, (1 - enter) * 40 * s);
    drawRoundedRect(ctx, stageX, cardY, stageW, cardH, 28 * s);
    ctx.fillStyle = palette.surface;
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();

    const plotL = stageX + 46 * s;
    const plotR = stageX + stageW - 46 * s;
    const plotT = cardY + 95 * s;
    const plotB = cardY + cardH - 72 * s;
    const plotW = plotR - plotL;
    const plotH = plotB - plotT;

    // Subtle horizontal gridlines
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.4 * s;
    for (let g = 0; g <= 3; g++) {
      const gy = lerp(plotT, plotB, g / 3);
      ctx.beginPath();
      ctx.moveTo(plotL, gy);
      ctx.lineTo(plotR, gy);
      ctx.stroke();
    }

    const drawP = expoOut((localSec - 0.25) / Math.min(sceneDur * 0.62, 1.8));
    const samples = 44;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * drawP;
      const x = plotL + t * plotW;
      const curveY = Math.pow(t, 1.55) * 0.84 + Math.sin(t * Math.PI * 2.1) * 0.055;
      const y = plotB - clamp01(curveY) * plotH;
      pts.push([x, y]);
    }

    if (pts.length > 1) {
      // Soft gradient area fill
      ctx.beginPath();
      ctx.moveTo(pts[0][0], plotB);
      pts.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(pts[pts.length - 1][0], plotB);
      ctx.closePath();
      const fillG = ctx.createLinearGradient(0, plotT, 0, plotB);
      fillG.addColorStop(0, palette.glow);
      fillG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fillG;
      ctx.fill();

      // Smooth stroke line
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 7 * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Gliding dot + live odometer pill!
      const tip = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 13 * s, 0, Math.PI * 2);
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.lineWidth = 4 * s;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      const liveMetric = Math.round(drawP * 94);
      const pillW = 148 * s;
      const pillH = 54 * s;
      const px = Math.min(plotR - pillW, Math.max(plotL, tip[0] - pillW / 2));
      const py = Math.max(cardY + 24 * s, tip[1] - 78 * s);
      drawRoundedRect(ctx, px, py, pillW, pillH, 16 * s);
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.font = `900 ${Math.round(28 * s)}px ui-monospace, monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`+${liveMetric}%`, px + pillW / 2, py + pillH / 2);
    }

    drawLightSweep(ctx, stageX, cardY, stageW, cardH, 28 * s, (localSec - 1.1) / 1.1);
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 6: FLOATING LINEAR WORKFLOW CARDS + MACOS CURSOR CLICKS
     -------------------------------------------------------------------------- */
  } else if (scene.template === "cursor_cards") {
    const headFont = Math.round(52 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || scene.label,
      stageX,
      stageTop + 52 * s,
      stageW,
      headFont,
      2,
      "left",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    const words = scene.narration.split(/[,.—!?]+/).map((p) => p.trim()).filter((p) => p.length > 6);
    const cardTexts = [
      words[0]?.slice(0, 44) || "1. AI Agent baca seluruh konteks repo",
      words[1]?.slice(0, 44) || "2. Eksekusi terminal & edit file otomatis",
      words[2]?.slice(0, 44) || "3. Jalankan test & verifikasi hasil",
    ];

    const listTop = stageTop + 215 * s;
    const gap = 22 * s;
    const cardH = Math.min(165 * s, (stageBottom - listTop - gap * 2 - 16 * s) / 3);
    const clickTimes = [
      Math.min(0.85, sceneDur * 0.24),
      Math.min(1.65, sceneDur * 0.50),
      Math.min(2.45, sceneDur * 0.74),
    ];
    const centers: Array<[number, number]> = [];

    cardTexts.forEach((pt, idx) => {
      const cy = listTop + idx * (cardH + gap);
      centers.push([stageX + stageW * 0.82, cy + cardH * 0.52]);
      const enter = spring((localSec - (0.12 + idx * 0.14)) / 0.45);
      const clickAt = clickTimes[idx];
      const clickP = clamp01((localSec - clickAt) / 0.22);
      const isChecked = localSec >= clickAt;
      const press = clickP > 0 && clickP < 1 ? 1 - Math.sin(clickP * Math.PI) * 0.045 : 1;

      ctx.save();
      ctx.translate(stageCX, cy + cardH / 2);
      ctx.scale(lerp(0.92, 1, enter) * press, lerp(0.92, 1, enter) * press);
      ctx.globalAlpha = clamp01(enter * 1.25);
      ctx.translate(-stageCX, -(cy + cardH / 2));

      drawRoundedRect(ctx, stageX, cy, stageW, cardH, 24 * s);
      ctx.fillStyle = isChecked ? "rgba(16, 185, 129, 0.16)" : palette.surface;
      ctx.fill();
      ctx.strokeStyle = isChecked ? "#10b981" : palette.border;
      ctx.lineWidth = (isChecked ? 2.8 : 1.8) * s;
      ctx.stroke();

      // Checkbox circle
      const chkR = 24 * s;
      const chkX = stageX + 46 * s;
      const chkY = cy + cardH / 2;
      ctx.beginPath();
      ctx.arc(chkX, chkY, chkR, 0, Math.PI * 2);
      if (isChecked) {
        ctx.fillStyle = "#10b981";
        ctx.fill();
        ctx.strokeStyle = "#04120d";
        ctx.lineWidth = 4.2 * s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(chkX - chkR * 0.36, chkY);
        ctx.lineTo(chkX - chkR * 0.08, chkY + chkR * 0.3);
        ctx.lineTo(chkX + chkR * 0.4, chkY - chkR * 0.3);
        ctx.stroke();
      } else {
        ctx.strokeStyle = palette.muted;
        ctx.lineWidth = 2.6 * s;
        ctx.stroke();
      }

      ctx.font = `800 ${Math.round(28 * s)}px system-ui, sans-serif`;
      ctx.fillStyle = palette.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const lines = wrapLines(ctx, pt, stageW - 118 * s, 2);
      const lh = 35 * s;
      lines.forEach((ln, li) => {
        ctx.fillText(ln, stageX + 92 * s, chkY + (li - (lines.length - 1) / 2) * lh);
      });
      ctx.restore();

      if (isChecked) {
        drawClickBurst(ctx, centers[idx][0], centers[idx][1], (localSec - clickAt) / 0.5, s, "#10b981", palette.accent);
      }
    });

    if (localSec > 0.35 && centers.length === 3) {
      let cx = stageX + stageW;
      let cy = stageBottom;
      let press = 0;
      if (localSec < clickTimes[0] + 0.22) {
        const t = expoOut((localSec - 0.35) / Math.max(0.2, clickTimes[0] - 0.35));
        [cx, cy] = cubicBezierPt([stageX + stageW, stageBottom], [stageX + stageW, centers[0][1] + 90 * s], [centers[0][0] + 45 * s, centers[0][1] + 20 * s], centers[0], t);
        const cp = clamp01((localSec - clickTimes[0]) / 0.2);
        press = cp > 0 && cp < 1 ? Math.sin(cp * Math.PI) : 0;
      } else if (localSec < clickTimes[1] + 0.22) {
        const t = expoInOut((localSec - (clickTimes[0] + 0.22)) / Math.max(0.2, clickTimes[1] - clickTimes[0] - 0.22));
        [cx, cy] = cubicBezierPt(centers[0], [centers[0][0] + 48 * s, centers[0][1] + 45 * s], [centers[1][0] + 48 * s, centers[1][1] - 35 * s], centers[1], t);
        const cp = clamp01((localSec - clickTimes[1]) / 0.2);
        press = cp > 0 && cp < 1 ? Math.sin(cp * Math.PI) : 0;
      } else {
        const t = expoInOut((localSec - (clickTimes[1] + 0.22)) / Math.max(0.2, clickTimes[2] - clickTimes[1] - 0.22));
        [cx, cy] = cubicBezierPt(centers[1], [centers[1][0] + 48 * s, centers[1][1] + 45 * s], [centers[2][0] + 48 * s, centers[2][1] - 35 * s], centers[2], t);
        const cp = clamp01((localSec - clickTimes[2]) / 0.2);
        press = cp > 0 && cp < 1 ? Math.sin(cp * Math.PI) : 0;
      }
      drawMacCursor(ctx, cx, cy, 1.35 * s, press);
    }

  /* --------------------------------------------------------------------------
     TEMPLATE 7: BEFORE vs AFTER SPLIT CONTRAST (MANUAL vs AI AUTOMATION)
     -------------------------------------------------------------------------- */
  } else if (scene.template === "split_contrast") {
    const enter = expoOut((localSec - 0.08) / 0.5);
    const expandNew = expoInOut((localSec - 1.2) / 0.65);
    const gap = 22 * s;
    const oldH = lerp(stageH * 0.44, stageH * 0.35, expandNew);
    const newH = stageH - oldH - gap;
    const oldY = stageTop;
    const newY = oldY + oldH + gap;

    // TOP: BEFORE (Manual Slow + Animated Red Slash)
    ctx.save();
    ctx.globalAlpha = enter;
    drawRoundedRect(ctx, stageX, oldY, stageW, oldH, 28 * s);
    ctx.fillStyle = "rgba(32, 18, 26, 0.90)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
    ctx.lineWidth = 2.2 * s;
    ctx.stroke();

    ctx.font = `900 ${Math.round(24 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#fb7185";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("✕ MANUAL WORKFLOW · LAMBAT", stageX + 32 * s, oldY + 28 * s);

    const oldVal = Math.round(24 * expoOut((localSec - 0.15) / 0.6));
    ctx.font = `900 ${Math.round(126 * s)}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(226, 232, 240, 0.52)";
    ctx.textBaseline = "middle";
    ctx.fillText(`${oldVal}%`, stageX + 32 * s, oldY + oldH * 0.62);

    const slashP = expoOut((localSec - 0.78) / 0.35);
    if (slashP > 0.01) {
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 10 * s;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(stageX + 24 * s, oldY + oldH * 0.80);
      ctx.lineTo(
        lerp(stageX + 24 * s, stageX + 310 * s, slashP),
        lerp(oldY + oldH * 0.80, oldY + oldH * 0.42, slashP)
      );
      ctx.stroke();
    }
    ctx.restore();

    // BOTTOM: AFTER (AI Agent Automation Expanding + Count-Up!)
    const newEnter = spring((localSec - 0.32) / 0.55);
    ctx.save();
    ctx.translate(0, (1 - newEnter) * 52 * s);
    drawRoundedRect(ctx, stageX, newY, stageW, newH, 28 * s);
    const ng = ctx.createLinearGradient(stageX, newY, stageX + stageW, newY + newH);
    ng.addColorStop(0, "rgba(16, 185, 129, 0.26)");
    ng.addColorStop(1, "rgba(56, 189, 248, 0.20)");
    ctx.fillStyle = ng;
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3 * s;
    ctx.stroke();

    ctx.font = `900 ${Math.round(25 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#34d399";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("✓ AI AGENT AUTOMATION · 10X", stageX + 32 * s, newY + 30 * s);

    const newVal = Math.round(96 * expoOut((localSec - 0.65) / 1.05));
    ctx.font = `900 ${Math.round(156 * s)}px system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(`${newVal}%`, stageX + 32 * s, newY + newH * 0.48);

    ctx.font = `800 ${Math.round(34 * s)}px system-ui, sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    const lines = wrapLines(ctx, scene.onScreenText || scene.label, stageW - 64 * s, 2);
    lines.forEach((ln, li) => {
      ctx.fillText(ln, stageX + 32 * s, newY + newH - 86 * s + li * 42 * s);
    });
    drawLightSweep(ctx, stageX, newY, stageW, newH, 28 * s, (localSec - 1.1) / 1.0);
    ctx.restore();

  /* --------------------------------------------------------------------------
     TEMPLATE 8: HIGH-RETENTION PAYOFF & NATURAL TIKTOK CTA FINALE
     -------------------------------------------------------------------------- */
  } else {
    const headFont = Math.round(62 * s);
    drawMaskedHeadline(
      ctx,
      scene.onScreenText || "Mau part 2 eksperimen AI Agent?",
      stageCX,
      stageTop + stageH * 0.24,
      stageW,
      headFont,
      3,
      "center",
      localSec,
      0.08,
      0.09,
      palette.text,
      palette.accent,
      "#ffffff"
    );

    const btnW = Math.min(stageW - 24 * s, 680 * s);
    const btnH = 104 * s;
    const btnX = stageCX - btnW / 2;
    const btnY = stageBottom - btnH - 42 * s;
    const btnEnter = backOut((localSec - 0.35) / 0.45);
    const clickAt = Math.min(sceneDur * 0.52, 1.45);
    const clickP = clamp01((localSec - clickAt) / 0.24);
    const pressScale = clickP > 0 && clickP < 1 ? 1 - Math.sin(clickP * Math.PI) * 0.08 : 1;

    ctx.save();
    ctx.translate(stageCX, btnY + btnH / 2);
    ctx.scale(clamp01(btnEnter) * pressScale, clamp01(btnEnter) * pressScale);
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 36 * s;
    drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    const btng = ctx.createLinearGradient(-btnW / 2, 0, btnW / 2, 0);
    btng.addColorStop(0, palette.accent);
    btng.addColorStop(1, palette.accent2);
    ctx.fillStyle = btng;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `900 ${Math.round(32 * s)}px system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      localSec >= clickAt ? "✓ FOLLOW & KOMEN TOPIK AI!" : "FOLLOW + KOMEN PART 2 →",
      0,
      2 * s
    );
    ctx.restore();

    if (localSec > 0.55) {
      const moveT = expoOut((localSec - 0.55) / Math.max(0.25, clickAt - 0.55));
      const [cx, cy] = cubicBezierPt(
        [stageX + stageW, stageBottom + 40 * s],
        [stageX + stageW * 0.92, btnY + 95 * s],
        [btnX + btnW * 0.84, btnY + 56 * s],
        [btnX + btnW * 0.72, btnY + btnH * 0.55],
        moveT
      );
      drawMacCursor(ctx, cx, cy, 1.45 * s, clickP > 0 && clickP < 1 ? Math.sin(clickP * Math.PI) : 0);
    }
    if (localSec >= clickAt) {
      drawClickBurst(ctx, btnX + btnW * 0.72, btnY + btnH * 0.52, (localSec - clickAt) / 0.65, s, palette.accent, palette.accent2);
    }
  }

  ctx.restore();
}

/* ============================================================================
   5. MASTER COMPOSITOR — 5 DUAL-SCENE TRANSITIONS + SYNCED TIKTOK SUBTITLES
   ============================================================================ */

const TRANSITION_SEC = 0.42;

export function renderEditorialFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: EditorialEpisode,
  elapsedSec: number,
  _brollImages?: Array<HTMLImageElement | null>
): void {
  void _brollImages;
  const s = width / 1080;
  const safe = getTikTokSafeZone(width, height);

  // Locate active scene & exact local clock
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

  const activeScene = episode.scenes[activeIndex] ?? episode.scenes[0];
  const palette = getScenePalette(episode.visualStyle, activeIndex, activeScene.template);
  const sceneDur = Math.max(1, activeScene.durationSec);
  const sceneProg = clamp01(localSec / sceneDur);

  // TRUE DUAL-SCENE CROSS-TRANSITIONS (5 cinema styles + directional motion-blur streaks!)
  const inTransition = activeIndex > 0 && localSec < TRANSITION_SEC;
  if (inTransition) {
    const prevIndex = activeIndex - 1;
    const prevScene = episode.scenes[prevIndex];
    const p = expoInOut(localSec / TRANSITION_SEC);
    const trans = activeScene.transitionIn;

    if (trans === "iris-circle") {
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      const maxR = Math.hypot(width, height) * 0.66;
      const curR = Math.max(2, maxR * p);
      ctx.save();
      ctx.beginPath();
      ctx.arc(safe.centerX, height * 0.44, curR, 0, Math.PI * 2);
      ctx.clip();
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(safe.centerX, height * 0.44, curR, 0, Math.PI * 2);
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = (1 - p) * 0.78;
      ctx.lineWidth = 7 * s;
      ctx.stroke();
      ctx.restore();
    } else if (trans === "zoom-through") {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(1 + p * 0.34, 1 + p * 0.34);
      ctx.globalAlpha = 1 - p;
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      const inS = lerp(0.82, 1.0, p);
      ctx.scale(inS, inS);
      ctx.globalAlpha = clamp01(p * 1.25);
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();
    } else if (trans === "whip-left") {
      ctx.save();
      ctx.translate(-width * p, 0);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(width * (1 - p), 0);
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();

      // Directional horizontal whip motion-blur streaks at peak velocity!
      const streakAlpha = Math.sin(p * Math.PI) * 0.22;
      if (streakAlpha > 0.02) {
        ctx.save();
        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = streakAlpha;
        for (let k = 0; k < 6; k++) {
          ctx.fillRect(0, height * (0.14 + k * 0.13), width, (6 + (k % 3) * 5) * s);
        }
        ctx.restore();
      }
    } else if (trans === "push-pull") {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      const outS = lerp(1, 0.84, p);
      ctx.scale(outS, outS);
      ctx.globalAlpha = 1 - p;
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, prevIndex, prevScene.durationSec, elapsedSec);
      ctx.restore();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      const inS = lerp(1.18, 1.0, p);
      ctx.scale(inS, inS);
      ctx.globalAlpha = clamp01(p * 1.25);
      ctx.translate(-width / 2, -height / 2);
      renderSingleScene(ctx, width, height, episode, activeIndex, localSec, elapsedSec);
      ctx.restore();
    } else {
      // whip-up
      ctx.save();
      ctx.translate(width / 2, height / 2 - height * p * 0.24);
      const outS = lerp(1, 0.9, p);
      ctx.scale(outS, outS);
      ctx.globalAlpha = 1 - p * 0.58;
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
     TOP MINIMALIST CHAPTER BAR INSIDE SAFE ZONE (ZERO WATERMARK!)
     -------------------------------------------------------------------------- */
  const segCount = episode.scenes.length;
  const segGap = 10 * s;
  const segH = 6.5 * s;
  const segW = (safe.width - segGap * (segCount - 1)) / Math.max(1, segCount);

  for (let i = 0; i < segCount; i++) {
    const sx = safe.left + i * (segW + segGap);
    drawRoundedRect(ctx, sx, safe.headerY, segW, segH, segH / 2);
    ctx.fillStyle = palette.isLight ? "rgba(17,19,24,0.12)" : "rgba(255,255,255,0.16)";
    ctx.fill();

    const fill = i < activeIndex ? 1 : i === activeIndex ? sceneProg : 0;
    if (fill > 0) {
      drawRoundedRect(ctx, sx, safe.headerY, Math.max(segH, segW * fill), segH, segH / 2);
      ctx.fillStyle = palette.accent;
      ctx.fill();
    }
  }

  // Optional factual source attribution tag (only when verified — full date never truncated!)
  if (episode.sourceLabel) {
    ctx.font = `700 ${Math.round(18 * s)}px ui-monospace, SFMono-Regular, monospace`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`SOURCE: ${episode.sourceLabel.slice(0, 62)}`, safe.left, safe.headerY + 14 * s);
  }

  /* --------------------------------------------------------------------------
     0ms-DRIFT WORD-SYNCED TIKTOK KINETIC SUBTITLES (STRICTLY INSIDE SAFE ZONE)
     -------------------------------------------------------------------------- */
  const timings =
    activeScene.wordTimings.length > 0
      ? activeScene.wordTimings
      : computeWordTimings(
          activeScene.narration,
          activeScene.speechOffsetSec ?? SPEECH_START_OFFSET_SEC,
          activeScene.speechDurationSec ?? Math.max(2, activeScene.durationSec - 0.36)
        );

  if (timings.length > 0) {
    const activeWordGlobal = findActiveWordIndex(timings, localSec);
    const activeCue = timings[activeWordGlobal];
    const wordDur = Math.max(0.06, activeCue.endSec - activeCue.startSec);
    const wordLocalT = clamp01((localSec - activeCue.startSec) / wordDur);
    const activePop = 1 + Math.sin(clamp01(wordLocalT / 0.28) * Math.PI) * 0.13;

    const wordsPerChunk = 4;
    const chunkIdx = Math.floor(activeWordGlobal / wordsPerChunk);
    const chunkStart = chunkIdx * wordsPerChunk;
    const chunkCues = timings.slice(chunkStart, chunkStart + wordsPerChunk);
    const activeLocal = activeWordGlobal - chunkStart;

    const capFont = Math.round(52 * s);
    ctx.font = `900 ${capFont}px system-ui, -apple-system, "Inter", sans-serif`;

    const maxCapW = safe.width - 20 * s;
    const wordGap = Math.round(capFont * 0.52);
    const capLines: Array<Array<{ cue: WordTimingCue; idx: number; w: number }>> = [[]];
    let curLineW = 0;

    chunkCues.forEach((cue, wi) => {
      const mw = ctx.measureText(cue.word).width;
      if (curLineW > 0 && curLineW + wordGap + mw > maxCapW) {
        capLines.push([{ cue, idx: wi, w: mw }]);
        curLineW = mw;
      } else {
        capLines[capLines.length - 1].push({ cue, idx: wi, w: mw });
        curLineW += (curLineW > 0 ? wordGap : 0) + mw;
      }
    });

    const capLineH = capFont * 1.38;
    const capStartY = safe.subtitleY - ((capLines.length - 1) * capLineH) / 2;

    capLines.forEach((row, ri) => {
      const rowW =
        row.reduce((sum, item) => sum + item.w, 0) + wordGap * Math.max(0, row.length - 1);
      let rx = safe.centerX - rowW / 2;
      const ry = capStartY + ri * capLineH;

      row.forEach((item) => {
        const isActive = item.idx === activeLocal;
        const isKeyword = item.cue.highlight;

        if (isActive) {
          ctx.save();
          const cx = rx + item.w / 2;
          const tilt = (activeWordGlobal % 2 === 0 ? -1 : 1) * 0.028;
          ctx.translate(cx, ry);
          ctx.rotate(tilt);
          ctx.scale(activePop, activePop);

          drawRoundedRect(
            ctx,
            -item.w / 2 - 16 * s,
            -capFont * 0.64,
            item.w + 32 * s,
            capFont * 1.28,
            16 * s
          );
          const pillFill = isKeyword ? palette.accent : palette.accent2;
          ctx.shadowColor = palette.glow;
          ctx.shadowBlur = 22 * s;
          ctx.fillStyle = pillFill;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = getContrastTextColor(pillFill);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.cue.word, 0, 1 * s);
          ctx.restore();
        } else {
          ctx.save();
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          if (!palette.isLight) {
            ctx.lineJoin = "round";
            ctx.lineWidth = Math.max(5 * s, Math.round(capFont * 0.16));
            ctx.strokeStyle = "rgba(4, 6, 14, 0.92)";
            ctx.strokeText(item.cue.word, rx, ry);
          }
          ctx.fillStyle = palette.isLight
            ? item.idx < activeLocal
              ? "#111318"
              : "rgba(17, 19, 24, 0.48)"
            : isKeyword && item.idx < activeLocal
            ? palette.accent2
            : item.idx < activeLocal
            ? "#ffffff"
            : "rgba(226, 232, 240, 0.62)";
          ctx.fillText(item.cue.word, rx, ry);
          ctx.restore();
        }
        rx += item.w + wordGap;
      });
    });
  }
}

/* ============================================================================
   6. TIKTOK 9:16 VERTICAL COVER THUMBNAIL RENDERER (1080x1920)
   ============================================================================ */

export function renderEditorialThumbnail(episode: EditorialEpisode): string {
  const w = 1080;
  const h = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  renderEditorialFrame(ctx, w, h, episode, 1.45);
  return canvas.toDataURL("image/png");
}

/* ============================================================================
   7. LIVE PREVIEW AUDIO HELPERS (KEPT COMPATIBLE + MASTER-CLOCK SYNCED!)
   ============================================================================ */

export function startAmbientSynthBed(
  connectToSpeakers = true,
  bedVolume = 0.045
): {
  audioStream: MediaStream | null;
  audioCtx: AudioContext | null;
  voiceBus: GainNode | null;
  bgmGain: GainNode | null;
  stop: () => void;
} {
  if (typeof window === "undefined") {
    return { audioStream: null, audioCtx: null, voiceBus: null, bgmGain: null, stop: () => {} };
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return { audioStream: null, audioCtx: null, voiceBus: null, bgmGain: null, stop: () => {} };
  }

  const ctx = new AudioCtx();
  const dest = ctx.createMediaStreamDestination();
  const bgmGain = ctx.createGain();
  bgmGain.gain.value = bedVolume;
  bgmGain.connect(dest);
  if (connectToSpeakers) bgmGain.connect(ctx.destination);

  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1.1;
  voiceBus.connect(dest);
  if (connectToSpeakers) voiceBus.connect(ctx.destination);

  const chords = [
    [130.81, 196.0, 246.94, 329.63],
    [110.0, 164.81, 220.0, 261.63],
    [87.31, 130.81, 174.61, 220.0],
    [98.0, 146.83, 196.0, 246.94],
  ];
  let step = 0;

  const playChord = () => {
    if (ctx.state === "closed") return;
    const now = ctx.currentTime;
    const notes = chords[step % chords.length];
    step += 1;

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.18, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc.connect(g);
      g.connect(bgmGain);
      osc.start(now);
      osc.stop(now + 2.25);
    });
  };

  playChord();
  const intervalId = window.setInterval(playChord, 2200);

  return {
    audioStream: dest.stream,
    audioCtx: ctx,
    voiceBus,
    bgmGain,
    stop: () => {
      window.clearInterval(intervalId);
      ctx.close().catch(() => {});
    },
  };
}

export function scheduleSceneTransitionsSfx(
  audioCtx: AudioContext,
  targetBus: AudioNode,
  baseAudioTime: number,
  sceneDurations: number[]
): void {
  const noiseDur = 0.4;
  const noiseBuf = audioCtx.createBuffer(
    1,
    Math.floor(audioCtx.sampleRate * noiseDur),
    audioCtx.sampleRate
  );
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.65;

  const playClick = (t: number, freq = 1040, vol = 0.11) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.03);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain);
    gain.connect(targetBus);
    osc.start(t);
    osc.stop(t + 0.04);
  };

  let offsetSec = 0;
  sceneDurations.forEach((dur, idx) => {
    const t = baseAudioTime + offsetSec;
    if (idx === 0) {
      const bass = audioCtx.createOscillator();
      const bg = audioCtx.createGain();
      bass.type = "sine";
      bass.frequency.setValueAtTime(92, t + 0.06);
      bass.frequency.exponentialRampToValueAtTime(30, t + 0.48);
      bg.gain.setValueAtTime(0.001, t + 0.06);
      bg.gain.linearRampToValueAtTime(0.28, t + 0.085);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
      bass.connect(bg);
      bg.connect(targetBus);
      bass.start(t + 0.06);
      bass.stop(t + 0.55);
      playClick(t + Math.min(1.38, dur * 0.42), 1260, 0.13);
    } else {
      const src = audioCtx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 2.3;
      filter.frequency.setValueAtTime(280, t);
      filter.frequency.exponentialRampToValueAtTime(2600, t + 0.16);
      filter.frequency.exponentialRampToValueAtTime(360, t + 0.38);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(targetBus);
      src.start(t);
      src.stop(t + 0.4);
    }
    offsetSec += dur;
  });
}
