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
      durationSec: Math.max(3, sc.durationSec),
      narration: sc.narration,
      visualPrompt: sc.visualCue,
      onScreenText: sc.subtitle || sc.visualCue,
      mood: mapSceneMood(sc.mood),
    })),
  };
}

interface Palette {
  bg1: string;
  bg2: string;
  accent: string;
  accent2: string;
  glow: string;
  pillBg: string;
}

const MOOD_PALETTES: Record<EditorialScene["mood"], Palette> = {
  bright: {
    bg1: "#060b18",
    bg2: "#0d1a33",
    accent: "#38bdf8",
    accent2: "#34d399",
    glow: "rgba(56, 189, 248, 0.28)",
    pillBg: "rgba(56, 189, 248, 0.16)",
  },
  curious: {
    bg1: "#080716",
    bg2: "#161134",
    accent: "#a855f7",
    accent2: "#38bdf8",
    glow: "rgba(168, 85, 247, 0.3)",
    pillBg: "rgba(168, 85, 247, 0.18)",
  },
  dramatic: {
    bg1: "#10080d",
    bg2: "#24111c",
    accent: "#fb923c",
    accent2: "#f43f5e",
    glow: "rgba(251, 146, 60, 0.3)",
    pillBg: "rgba(251, 146, 60, 0.18)",
  },
  warm: {
    bg1: "#071110",
    bg2: "#0e2420",
    accent: "#fbbf24",
    accent2: "#10b981",
    glow: "rgba(251, 191, 36, 0.26)",
    pillBg: "rgba(251, 191, 36, 0.16)",
  },
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/** Smooth spring curve with subtle Apple/Remotion-style overshoot */
function springOut(t: number): number {
  const x = clamp01(t);
  if (x === 0) return 0;
  if (x === 1) return 1;
  return 1 - Math.exp(-7.2 * x) * Math.cos(10.5 * x);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
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
      if (lines.length >= maxLines - 1) {
        continue;
      }
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

/** Extract meaningful percentage/number metrics from scene text for animated data visuals */
function extractSceneMetrics(scene: EditorialScene): Array<{ label: string; value: number }> {
  const combined = `${scene.onScreenText} ${scene.narration} ${scene.visualPrompt}`;
  const pctMatches = Array.from(combined.matchAll(/(\d{1,3})\s*%/g))
    .map((m) => Math.max(8, Math.min(98, Number(m[1]))))
    .filter((n) => !Number.isNaN(n));

  if (pctMatches.length >= 2) {
    return [
      { label: "UTAMA", value: pctMatches[0] },
      { label: "BANDING", value: pctMatches[1] },
      { label: "TARGET", value: Math.min(96, Math.round((pctMatches[0] + pctMatches[1]) * 0.65)) },
    ];
  }
  if (pctMatches.length === 1) {
    const primary = pctMatches[0];
    const rest = Math.max(12, Math.min(92, 100 - primary));
    return [
      { label: "FOKUS", value: primary },
      { label: "SISA", value: rest },
      { label: "OPTIMAL", value: Math.min(95, Math.max(primary + 24, 78)) },
    ];
  }
  return [
    { label: "AWAL", value: 34 },
    { label: "PROSES", value: 68 },
    { label: "HASIL", value: 92 },
  ];
}

/** Draw viral Claude 8-ray geometric sparkle icon */
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
  ctx.lineWidth = Math.max(2.2, radius * 0.14);
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? radius : radius * 0.68;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (radius * 0.22), Math.sin(angle) * (radius * 0.22));
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw sleek frosted glassmorphic card with specular top highlight */
function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  accent: string,
  fillAlpha = 0.72
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = `rgba(11, 17, 32, ${fillAlpha})`;
  ctx.fill();

  const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  borderGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  borderGrad.addColorStop(0.5, `${accent}55`);
  borderGrad.addColorStop(1, "rgba(255, 255, 255, 0.08)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

/**
 * VIRAL CLAUDE-STYLE TIKTOK MOTION GRAPHICS RENDERER
 * Renders spring-physics kinetic typography, 5 distinct modular visual scenes
 * (Keynote Hook, Live Animated Bar Chart, Node-Graph Flowchart with Neon Pulses,
 * Bento-Grid Radial Progress, and Interactive Cursor CTA Finale) + karaoke word highlight!
 */
export function renderEditorialFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: EditorialEpisode,
  elapsedSec: number
): void {
  const isVertical = height > width;
  const padX = isVertical ? Math.round(width * 0.075) : Math.round(width * 0.07);
  const safeW = width - padX * 2;

  // Locate active scene & local timeline
  let cursor = 0;
  let activeScene = episode.scenes[0];
  let activeIndex = 0;
  let localSec = 0;

  for (let i = 0; i < episode.scenes.length; i++) {
    const sc = episode.scenes[i];
    if (elapsedSec <= cursor + sc.durationSec || i === episode.scenes.length - 1) {
      activeScene = sc;
      activeIndex = i;
      localSec = Math.max(0, elapsedSec - cursor);
      break;
    }
    cursor += sc.durationSec;
  }

  const sceneDur = Math.max(1, activeScene.durationSec);
  const sceneProg = clamp01(localSec / sceneDur);
  const enterSpring = springOut(localSec / 0.55);
  const exitAlpha = sceneProg > 0.92 ? clamp01(1 - (sceneProg - 0.92) / 0.08) : 1;
  const pal = MOOD_PALETTES[activeScene.mood] ?? MOOD_PALETTES.bright;

  // 1. DEEP OBSIDIAN + DRIFTING AURORA MESH BACKGROUND
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, pal.bg1);
  bgGrad.addColorStop(1, pal.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const orb1X = width * (0.24 + Math.sin(elapsedSec * 0.42) * 0.14);
  const orb1Y = height * (0.22 + Math.cos(elapsedSec * 0.35) * 0.08);
  const g1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, width * 0.72);
  g1.addColorStop(0, pal.glow);
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  const orb2X = width * (0.78 + Math.cos(elapsedSec * 0.38) * 0.12);
  const orb2Y = height * (0.76 + Math.sin(elapsedSec * 0.48) * 0.09);
  const g2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, width * 0.65);
  g2.addColorStop(0, `${pal.accent2}30`);
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural dot-matrix grid with slow parallax drift
  const spacing = isVertical ? 32 : 36;
  const driftX = (elapsedSec * 12) % spacing;
  const driftY = (elapsedSec * 8) % spacing;
  ctx.fillStyle = "rgba(148, 163, 184, 0.14)";
  for (let x = -spacing + driftX; x < width + spacing; x += spacing) {
    for (let y = -spacing + driftY; y < height + spacing; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. TIKTOK / STORIES SEGMENTED CHAPTER PROGRESS BAR AT TOP
  const segCount = episode.scenes.length;
  const segGap = 8;
  const segY = isVertical ? Math.round(height * 0.036) : Math.round(height * 0.045);
  const segH = isVertical ? 6 : 5;
  const segW = (safeW - segGap * (segCount - 1)) / Math.max(1, segCount);

  for (let i = 0; i < segCount; i++) {
    const sx = padX + i * (segW + segGap);
    drawRoundedRect(ctx, sx, segY, segW, segH, segH / 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.fill();

    const fillRatio = i < activeIndex ? 1 : i === activeIndex ? sceneProg : 0;
    if (fillRatio > 0) {
      drawRoundedRect(ctx, sx, segY, Math.max(segH, segW * fillRatio), segH, segH / 2);
      const sg = ctx.createLinearGradient(sx, 0, sx + segW, 0);
      sg.addColorStop(0, pal.accent);
      sg.addColorStop(1, pal.accent2);
      ctx.fillStyle = sg;
      ctx.fill();
    }
  }

  // Top Header Row: Chapter Badge + Live Timestamp Pill
  const badgeY = segY + (isVertical ? 22 : 18);
  const badgeFont = isVertical ? 17 : 15;
  ctx.font = `800 ${badgeFont}px system-ui, -apple-system, sans-serif`;
  const chapterTag = `0${activeIndex + 1} // ${activeScene.label.toUpperCase().slice(0, 18)}`;
  const tagW = Math.min(safeW * 0.65, ctx.measureText(chapterTag).width + 30);
  const tagH = isVertical ? 34 : 30;

  drawRoundedRect(ctx, padX, badgeY, tagW, tagH, tagH / 2);
  ctx.fillStyle = pal.pillBg;
  ctx.fill();
  ctx.strokeStyle = `${pal.accent}88`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(chapterTag, padX + 15, badgeY + tagH / 2 + 0.5);

  // Subtle top-right Ep badge
  const epLabel = `EP #${episode.episodeNumber}`;
  ctx.font = `700 ${badgeFont - 1}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(203, 213, 225, 0.78)";
  ctx.textAlign = "right";
  ctx.fillText(epLabel, width - padX, badgeY + tagH / 2 + 0.5);

  // 3. MAIN MODULAR VIRAL CLAUDE MOTION STAGE (Center Canvas Area)
  const stageTop = badgeY + tagH + (isVertical ? 26 : 20);
  const captionZoneH = isVertical ? Math.round(height * 0.24) : Math.round(height * 0.27);
  const stageBottom = height - captionZoneH - (isVertical ? 24 : 18);
  const stageH = Math.max(180, stageBottom - stageTop);
  const stageCY = stageTop + stageH * 0.5;

  // Choose one of 6 signature viral TikTok motion-graphics modules based on scene role!
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === episode.scenes.length - 1 && episode.scenes.length > 1;
  const moduleType: "hook" | "chart" | "workflow" | "compare" | "bento" | "cta" = isFirst
    ? "hook"
    : isLast
    ? "cta"
    : activeIndex % 4 === 1
    ? "chart"
    : activeIndex % 4 === 2
    ? "workflow"
    : activeIndex % 4 === 3
    ? "compare"
    : "bento";

  // Subtle Floating Ambient Viral Spark Particles behind stage
  ctx.save();
  for (let sp = 0; sp < 14; sp++) {
    const px = ((sp * 197 + elapsedSec * (18 + (sp % 4) * 9)) % (width + 80)) - 40;
    const py = ((sp * 131 - elapsedSec * (22 + (sp % 3) * 11)) % (height + 80) + height + 80) % (height + 80) - 40;
    const pr = 1.6 + (sp % 3) * 1.1;
    const pa = (0.14 + Math.sin(elapsedSec * 2.4 + sp) * 0.1) * exitAlpha;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = sp % 2 === 0 ? pal.accent : pal.accent2;
    ctx.globalAlpha = Math.max(0.03, pa);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = clamp01(enterSpring) * exitAlpha;
  // Viral TikTok Beat-Sync Zoom Punch-In on every scene cut!
  const punchScale = 1 + (1 - clamp01(enterSpring)) * 0.055 + Math.sin(elapsedSec * 1.2) * 0.005;
  const slideOffsetY = (1 - enterSpring) * 28;
  ctx.translate(width / 2, stageCY + slideOffsetY);
  ctx.scale(punchScale, punchScale);
  ctx.translate(-width / 2, -stageCY);

  if (moduleType === "hook") {
    // === MODULE A: VIRAL CLAUDE KEYNOTE IMPACT HOOK ===
    const sparkleR = isVertical ? 30 : 26;
    drawClaudeSparkle(
      ctx,
      width / 2,
      stageTop + sparkleR + 12,
      sparkleR * (0.85 + 0.15 * enterSpring),
      elapsedSec * 0.9,
      pal.accent
    );

    // Animated Terminal Prompt Chip ("analyzing topic...")
    const chipText = `> ${episode.niche.slice(0, 34)}`;
    ctx.font = `600 ${isVertical ? 17 : 15}px ui-monospace, monospace`;
    const typedCount = Math.max(2, Math.floor(chipText.length * clamp01(localSec / 0.9)));
    const visibleChip = chipText.slice(0, typedCount) + (Math.floor(elapsedSec * 4) % 2 === 0 ? "▌" : "");
    const chipW = Math.min(safeW, ctx.measureText(chipText + "▌").width + 36);
    const chipH = 38;
    const chipY = stageTop + sparkleR * 2 + 34;
    drawGlassCard(ctx, (width - chipW) / 2, chipY, chipW, chipH, 12, pal.accent, 0.78);
    ctx.fillStyle = pal.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(visibleChip, width / 2, chipY + chipH / 2 + 1);

    // Giant Bold Kinetic Headline with Spring-Sweeping Highlighter Pill
    const headlineSize = isVertical ? Math.round(width * 0.072) : Math.round(width * 0.044);
    ctx.font = `900 ${headlineSize}px system-ui, -apple-system, sans-serif`;
    const headlineText = (activeScene.onScreenText || episode.title).trim();
    const lines = wrapLines(ctx, headlineText, safeW - 24, 4);
    const lineH = headlineSize * 1.24;
    const blockStartY = chipY + chipH + (stageBottom - (chipY + chipH) - lines.length * lineH) * 0.44;

    lines.forEach((ln, li) => {
      const lineAppear = springOut((localSec - 0.12 - li * 0.1) / 0.42);
      const ly = blockStartY + li * lineH + lineH * 0.5;
      ctx.save();
      ctx.globalAlpha = clamp01(lineAppear) * exitAlpha;
      ctx.translate(0, (1 - lineAppear) * 20);

      // Highlight sweep behind the final punchline line
      if (li === lines.length - 1) {
        const sweep = easeOutCubic((localSec - 0.32) / 0.45);
        const tw = ctx.measureText(ln).width + 28;
        drawRoundedRect(
          ctx,
          width / 2 - tw / 2,
          ly - headlineSize * 0.58,
          Math.max(12, tw * sweep),
          headlineSize * 1.16,
          14
        );
        const hg = ctx.createLinearGradient(width / 2 - tw / 2, 0, width / 2 + tw / 2, 0);
        hg.addColorStop(0, pal.accent);
        hg.addColorStop(1, pal.accent2);
        ctx.fillStyle = hg;
        ctx.fill();
        ctx.fillStyle = "#060b18";
      } else {
        ctx.fillStyle = "#ffffff";
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ln, width / 2, ly);
      ctx.restore();
    });
  } else if (moduleType === "chart") {
    // === MODULE B: VIRAL ANIMATED DATA BAR CHART & LIVE TICKING COUNTERS ===
    const cardW = safeW;
    const cardH = Math.min(stageH, isVertical ? stageH * 0.94 : stageH * 0.96);
    const cardX = padX;
    const cardY = stageCY - cardH / 2;
    drawGlassCard(ctx, cardX, cardY, cardW, cardH, 24, pal.accent, 0.78);

    // Card Title inside safe padding (NEVER overflows!)
    const titleSize = isVertical ? Math.round(width * 0.044) : Math.round(width * 0.026);
    ctx.font = `800 ${titleSize}px system-ui, -apple-system, sans-serif`;
    const titleLines = wrapLines(ctx, activeScene.onScreenText || activeScene.visualPrompt, cardW - 56, 2);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    titleLines.forEach((tl, ti) => {
      ctx.fillText(tl, cardX + 28, cardY + 24 + ti * (titleSize * 1.25));
    });

    // Animated Horizontal Reference Gridlines + Vertical Spring Bars
    const metrics = extractSceneMetrics(activeScene);
    const chartTop = cardY + 28 + titleLines.length * (titleSize * 1.25) + 28;
    const chartBottom = cardY + cardH - 54;
    const chartH = Math.max(80, chartBottom - chartTop);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const gy = chartTop + (chartH * g) / 3;
      ctx.beginPath();
      ctx.moveTo(cardX + 28, gy);
      ctx.lineTo(cardX + cardW - 28, gy);
      ctx.stroke();
    }

    const innerW = cardW - 76;
    const slotW = innerW / metrics.length;
    const barW = Math.min(isVertical ? 82 : 92, slotW * 0.56);

    metrics.forEach((m, mi) => {
      const grow = springOut((localSec - 0.15 - mi * 0.16) / 0.75);
      const liveVal = Math.round(m.value * clamp01(grow));
      const bh = Math.max(12, (chartH * 0.86 * m.value) / 100 * clamp01(grow));
      const bx = cardX + 38 + mi * slotW + (slotW - barW) / 2;
      const by = chartBottom - bh;

      // Glowing Gradient Bar
      drawRoundedRect(ctx, bx, by, barW, bh, 12);
      const bg = ctx.createLinearGradient(bx, by, bx, chartBottom);
      bg.addColorStop(0, mi === metrics.length - 1 ? pal.accent2 : pal.accent);
      bg.addColorStop(1, "rgba(15, 23, 42, 0.35)");
      ctx.fillStyle = bg;
      ctx.fill();

      // Top Luminous Cap
      drawRoundedRect(ctx, bx, by, barW, 5, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Live Ticking Percentage Counter above bar
      ctx.font = `900 ${isVertical ? 26 : 22}px ui-monospace, monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${liveVal}%`, bx + barW / 2, by - 10);

      // Bar Label below baseline
      ctx.font = `700 ${isVertical ? 16 : 14}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#94a3b8";
      ctx.textBaseline = "top";
      ctx.fillText(m.label, bx + barW / 2, chartBottom + 14);
    });

    // Live-Drawing Golden Bezier Growth Trendline Overlay + Pulsing Peak Dot!
    const curveProg = easeOutCubic((localSec - 0.35) / 0.85);
    if (curveProg > 0.05 && metrics.length >= 2) {
      const pts = metrics.map((m, mi) => {
        const bx = cardX + 38 + mi * slotW + slotW / 2;
        const bh = Math.max(12, ((chartH * 0.86 * m.value) / 100));
        return { x: bx, y: chartBottom - bh - 12 };
      });
      ctx.save();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "rgba(253, 224, 71, 0.65)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      const maxSeg = (pts.length - 1) * curveProg;
      for (let i = 0; i < pts.length - 1; i++) {
        const segT = clamp01(maxSeg - i);
        if (segT <= 0) break;
        const nx = pts[i].x + (pts[i + 1].x - pts[i].x) * segT;
        const ny = pts[i].y + (pts[i + 1].y - pts[i].y) * segT;
        ctx.lineTo(nx, ny);
        if (segT < 1 || i === pts.length - 2) {
          ctx.stroke();
          // Pulsing Peak Spark Dot
          ctx.beginPath();
          ctx.arc(nx, ny, 7 + Math.sin(elapsedSec * 7) * 2, 0, Math.PI * 2);
          ctx.fillStyle = "#fde047";
          ctx.fill();
        }
      }
      ctx.restore();
    }
  } else if (moduleType === "compare") {
    // === MODULE C2: VIRAL BEFORE-VS-AFTER SPLIT COMPARISON METER ===
    const cardH = Math.min(stageH * 0.94, isVertical ? 450 : 290);
    const cardY = stageCY - cardH / 2;
    drawGlassCard(ctx, padX, cardY, safeW, cardH, 24, pal.accent, 0.82);

    const hSize = isVertical ? Math.round(width * 0.044) : Math.round(width * 0.025);
    ctx.font = `800 ${hSize}px system-ui, -apple-system, sans-serif`;
    const tLines = wrapLines(ctx, activeScene.onScreenText || activeScene.visualPrompt, safeW - 56, 2);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    tLines.forEach((tl, ti) => {
      ctx.fillText(tl, padX + 28, cardY + 24 + ti * (hSize * 1.24));
    });

    const meterStartY = cardY + 34 + tLines.length * (hSize * 1.24) + 18;
    const rows = [
      { label: "CARA LAMA (MANUAL)", pct: 28, col: "#f43f5e", delay: 0.15 },
      { label: "SISTEM BARU (OPTIMAL)", pct: 94, col: pal.accent2, delay: 0.35 },
    ];
    const barMaxW = safeW - 56;
    const rowGap = isVertical ? 96 : 68;

    rows.forEach((r, ri) => {
      const ry = meterStartY + ri * rowGap;
      const grow = springOut((localSec - r.delay) / 0.72);
      const val = Math.round(r.pct * clamp01(grow));

      ctx.font = `800 ${isVertical ? 17 : 14}px ui-monospace, monospace`;
      ctx.fillStyle = ri === 1 ? "#ffffff" : "#cbd5e1";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(r.label, padX + 28, ry);

      ctx.textAlign = "right";
      ctx.fillStyle = r.col;
      ctx.fillText(`${val}%`, padX + safeW - 28, ry);

      // Track
      const trackY = ry + (isVertical ? 28 : 22);
      const trackH = isVertical ? 28 : 22;
      drawRoundedRect(ctx, padX + 28, trackY, barMaxW, trackH, trackH / 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();

      // Animated Glowing Fill
      const fillW = Math.max(trackH, (barMaxW * r.pct * clamp01(grow)) / 100);
      drawRoundedRect(ctx, padX + 28, trackY, fillW, trackH, trackH / 2);
      ctx.fillStyle = r.col;
      ctx.fill();
    });
  } else if (moduleType === "workflow") {
    // === MODULE C: VIRAL CLAUDE NODE-GRAPH FLOWCHART WITH LASER PULSES ===
    const nodeLabels = [
      { step: "01", title: "INPUT & POLA", sub: activeScene.label.toUpperCase() },
      { step: "02", title: "ANALISIS SISTEM", sub: activeScene.onScreenText.slice(0, 28) || "PROSES CEPAT" },
      { step: "03", title: "HASIL TERUKUR", sub: "EKSEKUSI NYATA" },
    ];

    if (isVertical) {
      const nodeH = Math.min(118, (stageH - 68) / 3);
      const gapY = (stageH - nodeH * 3) / 2;

      nodeLabels.forEach((nd, ni) => {
        const appear = springOut((localSec - ni * 0.22) / 0.48);
        const ny = stageTop + ni * (nodeH + gapY);

        // Animated Vertical Wire + Laser Light Pulse between nodes
        if (ni < nodeLabels.length - 1) {
          const wireX = width / 2;
          const wireY1 = ny + nodeH;
          const wireY2 = ny + nodeH + gapY;
          ctx.strokeStyle = `${pal.accent}55`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(wireX, wireY1);
          ctx.lineTo(wireX, wireY2);
          ctx.stroke();

          const pulseT = (elapsedSec * 1.4 + ni * 0.4) % 1;
          const py = wireY1 + (wireY2 - wireY1) * pulseT;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(wireX, py, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.globalAlpha = clamp01(appear) * exitAlpha;
        ctx.translate((1 - appear) * (ni % 2 === 0 ? -28 : 28), 0);
        drawGlassCard(ctx, padX, ny, safeW, nodeH, 20, ni === 2 ? pal.accent2 : pal.accent, 0.8);

        // Step Badge Circle
        const circX = padX + 42;
        const circY = ny + nodeH / 2;
        ctx.beginPath();
        ctx.arc(circX, circY, 22, 0, Math.PI * 2);
        ctx.fillStyle = ni === 2 ? pal.accent2 : pal.accent;
        ctx.fill();
        ctx.font = "900 18px ui-monospace, monospace";
        ctx.fillStyle = "#060b18";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nd.step, circX, circY + 1);

        // Node Title & Subtext
        ctx.textAlign = "left";
        ctx.font = "800 22px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(nd.title, padX + 80, circY - 12);

        ctx.font = "600 16px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(nd.sub, padX + 80, circY + 16);

        // Animated Checkmark Pop on Right
        const checkPop = springOut((localSec - 0.5 - ni * 0.26) / 0.35);
        if (checkPop > 0.05) {
          ctx.beginPath();
          ctx.arc(padX + safeW - 36, circY, 15 * checkPop, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
          ctx.fill();
          ctx.strokeStyle = "#34d399";
          ctx.lineWidth = 2.4;
          ctx.stroke();
          ctx.font = "900 16px system-ui, sans-serif";
          ctx.fillStyle = "#34d399";
          ctx.textAlign = "center";
          ctx.fillText("✓", padX + safeW - 36, circY + 1);
        }
        ctx.restore();
      });
    } else {
      // Landscape 3-column horizontal glowing node workflow
      const gapX = 36;
      const nodeW = (safeW - gapX * 2) / 3;
      const nodeH = Math.min(200, stageH * 0.78);
      const ny = stageCY - nodeH / 2;

      nodeLabels.forEach((nd, ni) => {
        const appear = springOut((localSec - ni * 0.22) / 0.45);
        const nx = padX + ni * (nodeW + gapX);

        if (ni < nodeLabels.length - 1) {
          const wx1 = nx + nodeW;
          const wx2 = nx + nodeW + gapX;
          ctx.strokeStyle = `${pal.accent}66`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(wx1, stageCY);
          ctx.lineTo(wx2, stageCY);
          ctx.stroke();

          const pulseT = (elapsedSec * 1.4 + ni * 0.4) % 1;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(wx1 + gapX * pulseT, stageCY, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.globalAlpha = clamp01(appear) * exitAlpha;
        ctx.translate(0, (1 - appear) * 24);
        drawGlassCard(ctx, nx, ny, nodeW, nodeH, 20, ni === 2 ? pal.accent2 : pal.accent, 0.8);

        ctx.font = "900 18px ui-monospace, monospace";
        ctx.fillStyle = ni === 2 ? pal.accent2 : pal.accent;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`STEP ${nd.step}`, nx + 22, ny + 22);

        ctx.font = "800 22px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(nd.title, nx + 22, ny + 56);

        ctx.font = "600 15px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#cbd5e1";
        wrapLines(ctx, nd.sub, nodeW - 44, 2).forEach((sl, si) => {
          ctx.fillText(sl, nx + 22, ny + 96 + si * 22);
        });
        ctx.restore();
      });
    }
  } else if (moduleType === "bento") {
    // === MODULE D: VIRAL APPLE / CLAUDE BENTO GRID + RADIAL PROGRESS RING ===
    const ringProgress = easeOutCubic((localSec - 0.1) / 1.1) * 0.94;
    const pct = Math.round(ringProgress * 100);

    if (isVertical) {
      const topCardH = stageH * 0.52;
      const botCardH = stageH * 0.43;
      const gap = stageH * 0.05;

      // Top Bento Card: Animated Radial Neon Ring
      drawGlassCard(ctx, padX, stageTop, safeW, topCardH, 24, pal.accent, 0.8);
      const rCX = width / 2;
      const rCY = stageTop + topCardH * 0.5;
      const rRad = Math.min(safeW * 0.24, topCardH * 0.34);

      ctx.beginPath();
      ctx.arc(rCX, rCY, rRad, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rCX, rCY, rRad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringProgress);
      ctx.strokeStyle = pal.accent2;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.font = "900 36px ui-monospace, monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}%`, rCX, rCY - 4);
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillStyle = pal.accent2;
      ctx.fillText("DAMPAK NYATA", rCX, rCY + 24);

      // Bottom Bento Card: Key Takeaway Highlight
      const botY = stageTop + topCardH + gap;
      drawGlassCard(ctx, padX, botY, safeW, botCardH, 24, pal.accent2, 0.8);
      drawRoundedRect(ctx, padX + 18, botY + 22, 6, botCardH - 44, 3);
      ctx.fillStyle = pal.accent;
      ctx.fill();

      const tSize = Math.round(width * 0.044);
      ctx.font = `800 ${tSize}px system-ui, -apple-system, sans-serif`;
      const lines = wrapLines(ctx, activeScene.onScreenText || activeScene.visualPrompt, safeW - 64, 3);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const totalH = lines.length * (tSize * 1.28);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, padX + 40, botY + (botCardH - totalH) / 2 + li * (tSize * 1.28) + tSize * 0.6);
      });
    } else {
      const leftW = safeW * 0.36;
      const rightW = safeW * 0.61;
      const cardH = stageH * 0.88;
      const cy = stageCY - cardH / 2;

      drawGlassCard(ctx, padX, cy, leftW, cardH, 22, pal.accent, 0.8);
      const rCX = padX + leftW / 2;
      const rCY = cy + cardH / 2;
      const rRad = Math.min(leftW * 0.32, cardH * 0.32);

      ctx.beginPath();
      ctx.arc(rCX, rCY, rRad, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rCX, rCY, rRad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringProgress);
      ctx.strokeStyle = pal.accent2;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.font = "900 34px ui-monospace, monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct}%`, rCX, rCY);

      const rx = padX + leftW + safeW * 0.03;
      drawGlassCard(ctx, rx, cy, rightW, cardH, 22, pal.accent2, 0.8);
      drawRoundedRect(ctx, rx + 20, cy + 24, 6, cardH - 48, 3);
      ctx.fillStyle = pal.accent;
      ctx.fill();

      const tSize = Math.round(width * 0.028);
      ctx.font = `800 ${tSize}px system-ui, -apple-system, sans-serif`;
      const lines = wrapLines(ctx, activeScene.onScreenText || activeScene.visualPrompt, rightW - 68, 4);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const totalH = lines.length * (tSize * 1.3);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, rx + 42, cy + (cardH - totalH) / 2 + li * (tSize * 1.3) + tSize * 0.6);
      });
    }
  } else {
    // === MODULE E: VIRAL CLAUDE CTA FINALE + ANIMATED CURSOR TAP RIPPLE ===
    const cardH = Math.min(stageH * 0.92, isVertical ? 430 : 280);
    const cardY = stageCY - cardH / 2;
    drawGlassCard(ctx, padX, cardY, safeW, cardH, 28, pal.accent2, 0.82);

    drawClaudeSparkle(ctx, width / 2, cardY + 46, 22, elapsedSec * 1.1, pal.accent2);

    const hSize = isVertical ? Math.round(width * 0.056) : Math.round(width * 0.032);
    ctx.font = `900 ${hSize}px system-ui, -apple-system, sans-serif`;
    const ctaHeadline = activeScene.onScreenText || episode.moralLesson || episode.title;
    const lines = wrapLines(ctx, ctaHeadline, safeW - 56, 3);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hStart = cardY + 94;
    lines.forEach((ln, li) => {
      ctx.fillText(ln, width / 2, hStart + li * (hSize * 1.24) + hSize * 0.5);
    });

    // Glowing CTA Pill Button + Animated Cursor Tap Ripple
    const btnW = Math.min(safeW - 72, isVertical ? 340 : 320);
    const btnH = 56;
    const btnX = (width - btnW) / 2;
    const btnY = cardY + cardH - btnH - 32;
    const clickPhase = clamp01((localSec - 0.9) / 0.5);
    const btnScale = clickPhase > 0 && clickPhase < 0.4 ? 0.95 : 1.0;

    ctx.save();
    ctx.translate(width / 2, btnY + btnH / 2);
    ctx.scale(btnScale, btnScale);
    drawRoundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    const btng = ctx.createLinearGradient(-btnW / 2, 0, btnW / 2, 0);
    btng.addColorStop(0, pal.accent);
    btng.addColorStop(1, pal.accent2);
    ctx.fillStyle = btng;
    ctx.fill();

    ctx.font = `900 ${isVertical ? 20 : 18}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#060b18";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIMPAN & FOLLOW UNTUK PART 2 →", 0, 1);
    ctx.restore();

    // Tap Ripple Ring on Button
    if (localSec > 0.85) {
      const ripple = clamp01((localSec - 0.85) / 0.75);
      ctx.beginPath();
      ctx.arc(btnX + btnW * 0.78, btnY + btnH * 0.5, 10 + ripple * 44, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ripple) * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
  ctx.restore();

  // 4. VIRAL KARAOKE WORD-HIGHLIGHT CAPTION BAR (Bottom Safe Zone — ZERO Clipping!)
  const capCardY = height - captionZoneH;
  const capCardH = captionZoneH - (isVertical ? 28 : 20);
  drawGlassCard(ctx, padX, capCardY, safeW, capCardH, 22, pal.accent, 0.86);

  // Sleek Mini Voice-Reactive Wave Bar centered along top of caption box
  const waveBars = 14;
  const waveW = 140;
  const waveStartX = (width - waveW) / 2;
  const waveY = capCardY + 18;
  for (let b = 0; b < waveBars; b++) {
    const amp = 4 + Math.abs(Math.sin(elapsedSec * 7.5 + b * 0.65)) * 11;
    const bx = waveStartX + b * (waveW / waveBars);
    drawRoundedRect(ctx, bx, waveY - amp / 2, 5, amp, 2.5);
    ctx.fillStyle = b % 2 === 0 ? pal.accent : pal.accent2;
    ctx.fill();
  }

  // Viral CapCut / Hormozi Pop-Scale Karaoke Captions (4 punchy words on vertical, 7 on landscape!)
  const allWords = activeScene.narration.trim().split(/\s+/).filter(Boolean);
  const wordsPerChunk = isVertical ? 4 : 7;
  const totalWordCount = Math.max(1, allWords.length);
  const wordFloat = sceneProg * totalWordCount;
  const activeWordGlobal = Math.min(totalWordCount - 1, Math.floor(wordFloat));
  const wordLocalT = wordFloat - Math.floor(wordFloat);
  const activePopScale = 1 + Math.sin(clamp01(wordLocalT / 0.35) * Math.PI) * 0.11;
  const chunkIdx = Math.floor(activeWordGlobal / wordsPerChunk);
  const chunkStart = chunkIdx * wordsPerChunk;
  const chunkWords = allWords.slice(chunkStart, chunkStart + wordsPerChunk);
  const activeWordLocal = activeWordGlobal - chunkStart;

  const capFont = isVertical ? Math.round(width * 0.048) : Math.round(width * 0.026);
  ctx.font = `900 ${capFont}px system-ui, -apple-system, sans-serif`;

  // Layout words cleanly into 1 or 2 centered lines strictly inside safeW - 44
  const maxCapW = safeW - 44;
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
  const capBlockStartY =
    capCardY + 34 + (capCardH - 42 - capLines.length * capLineH) / 2 + capLineH * 0.5;

  capLines.forEach((row, ri) => {
    const rowW =
      row.reduce((sum, item) => sum + item.w, 0) + wordGap * Math.max(0, row.length - 1);
    let rx = (width - rowW) / 2;
    const ry = capBlockStartY + ri * capLineH;

    row.forEach((item) => {
      const isActive = item.idx === activeWordLocal;
      if (isActive) {
        ctx.save();
        const cx = rx + item.w / 2;
        ctx.translate(cx, ry);
        ctx.scale(activePopScale, activePopScale);
        drawRoundedRect(
          ctx,
          -item.w / 2 - 10,
          -capFont * 0.64,
          item.w + 20,
          capFont * 1.28,
          12
        );
        const pillGrad = ctx.createLinearGradient(-item.w / 2, 0, item.w / 2, 0);
        pillGrad.addColorStop(0, pal.accent);
        pillGrad.addColorStop(1, pal.accent2);
        ctx.shadowColor = pal.glow;
        ctx.shadowBlur = 16;
        ctx.fillStyle = pillGrad;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#040812";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.word, 0, 1);
        ctx.restore();
      } else {
        ctx.fillStyle = item.idx < activeWordLocal ? "#ffffff" : "rgba(226, 232, 240, 0.72)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.word, rx, ry);
      }
      rx += item.w + wordGap;
    });
  });
}

/**
 * Render a sharp 1280x720 Viral Creator HD Thumbnail (PNG Data URL)
 * Modern dark aurora bento-graphic + kinetic highlighted headline + mini chart badge.
 */
export function renderEditorialThumbnail(episode: EditorialEpisode): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const pal = MOOD_PALETTES[episode.scenes[0]?.mood ?? "bright"];

  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, pal.bg1);
  bg.addColorStop(1, pal.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  const glow = ctx.createRadialGradient(960, 280, 30, 960, 280, 560);
  glow.addColorStop(0, pal.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);

  // Dot matrix texture
  ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
  for (let x = 24; x < 1280; x += 34) {
    for (let y = 24; y < 720; y += 34) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Left Headline Column
  drawRoundedRect(ctx, 64, 58, 300, 48, 24);
  ctx.fillStyle = pal.accent;
  ctx.fill();
  ctx.font = "900 21px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#060b18";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`EPISODE #${episode.episodeNumber} · VIRAL`, 214, 83);

  ctx.font = "900 68px system-ui, -apple-system, sans-serif";
  const lines = wrapLines(ctx, episode.title.toUpperCase(), 700, 4);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => {
    const ly = 148 + i * 86;
    if (i === lines.length - 1) {
      const tw = ctx.measureText(ln).width + 32;
      drawRoundedRect(ctx, 56, ly - 6, tw, 80, 16);
      ctx.fillStyle = pal.accent2;
      ctx.fill();
      ctx.fillStyle = "#060b18";
      ctx.fillText(ln, 72, ly);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillText(ln, 64, ly);
    }
  });

  // Right Bento Data Card Graphic
  drawGlassCard(ctx, 830, 110, 386, 495, 30, pal.accent, 0.84);
  drawClaudeSparkle(ctx, 1023, 196, 36, 0.35, pal.accent);

  const barHeights = [110, 185, 250];
  barHeights.forEach((bh, i) => {
    const bx = 890 + i * 102;
    const by = 528 - bh;
    drawRoundedRect(ctx, bx, by, 64, bh, 14);
    const g = ctx.createLinearGradient(bx, by, bx, 528);
    g.addColorStop(0, i === 2 ? pal.accent2 : pal.accent);
    g.addColorStop(1, "rgba(15, 23, 42, 0.35)");
    ctx.fillStyle = g;
    ctx.fill();
  });

  // Footer
  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(episode.niche.slice(0, 48), 64, 650);

  return canvas.toDataURL("image/png");
}

/** Synthesize subtle copyright-free modern ambient lo-fi synth bed + dedicated Neural Voice mix bus */
export function startAmbientSynthBed(
  connectToSpeakers = true,
  bedVolume = 0.055
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
  if (connectToSpeakers) {
    master.connect(ctx.destination);
  }

  // Dedicated high-clarity vocal narration bus mixed directly into video recording
  const voiceBus = ctx.createGain();
  voiceBus.gain.value = 1.05;
  voiceBus.connect(dest);
  if (connectToSpeakers) {
    voiceBus.connect(ctx.destination);
  }

  // Smooth modern chill ambient chord progression (Am7 -> Fmaj7 -> Cmaj7 -> G6)
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

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1.95);
    });
  };

  playChord();
  const intervalId = window.setInterval(playChord, 1900);

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
