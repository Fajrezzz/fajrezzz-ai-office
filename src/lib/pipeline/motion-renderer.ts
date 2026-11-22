"use client";

import type { PipelineScene, RealEpisode } from "@/types/pipeline";

export interface EditorialRenderEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  thumbnailHeadline: string;
  storyStructure: string;
  setting: string;
  supportingCharacter: string;
  moralLesson: string;
  scenes: PipelineScene[];
}

export function buildEditorialEpisode(
  episode: RealEpisode
): EditorialRenderEpisode | null {
  const research = episode.divisions.research.output;
  const seo = episode.divisions.seo.output;
  const script = episode.divisions.script.output;
  if (!script || script.scenes.length === 0) return null;

  const selectedIdea =
    research?.ideas.find((i) => i.id === episode.selectedIdeaId) ??
    research?.ideas[0];

  const title =
    seo?.title ?? selectedIdea?.title ?? `Episode #${episode.episodeNumber}`;

  return {
    id: episode.id,
    episodeNumber: episode.episodeNumber,
    title,
    thumbnailHeadline:
      seo?.thumbnailHeadline ??
      title.split(/\s+/).slice(0, 4).join(" ").toUpperCase(),
    storyStructure:
      script.storyStructure || selectedIdea?.storyStructure || "Konten Orisinal",
    setting: script.setting || selectedIdea?.setting || "Studio Editorial",
    supportingCharacter:
      script.supportingCharacter ||
      selectedIdea?.supportingCharacter ||
      "Perspektif Kreator",
    moralLesson: script.moralLesson || selectedIdea?.moralLesson || "",
    scenes: script.scenes,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

const MOOD_PALETTES: Record<
  PipelineScene["mood"],
  { bgTop: string; bgBottom: string; accent: string; secondary: string }
> = {
  intro: {
    bgTop: "#050b1a",
    bgBottom: "#0c1d3d",
    accent: "#22d3ee",
    secondary: "#38bdf8",
  },
  problem: {
    bgTop: "#140718",
    bgBottom: "#2a0e29",
    accent: "#f43f5e",
    secondary: "#fb923c",
  },
  action: {
    bgTop: "#071525",
    bgBottom: "#102a45",
    accent: "#a855f7",
    secondary: "#22d3ee",
  },
  solve: {
    bgTop: "#041a18",
    bgBottom: "#0a332d",
    accent: "#10b981",
    secondary: "#38bdf8",
  },
  celebrate: {
    bgTop: "#0a1024",
    bgBottom: "#1d1a3a",
    accent: "#facc15",
    secondary: "#22d3ee",
  },
};

/**
 * Render modern sleek kinetic motion-graphics video frame (NO kids cartoons).
 */
export function renderEditorialFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: EditorialRenderEpisode,
  elapsedSec: number
) {
  const isVertical = height > width;
  const totalSec = Math.max(
    1,
    episode.scenes.reduce((acc, s) => acc + s.durationSec, 0)
  );

  // Locate active scene
  let cursor = 0;
  let activeScene = episode.scenes[episode.scenes.length - 1];
  let sceneLocalT = 0;
  for (const sc of episode.scenes) {
    if (elapsedSec <= cursor + sc.durationSec) {
      activeScene = sc;
      sceneLocalT = Math.max(0, elapsedSec - cursor);
      break;
    }
    cursor += sc.durationSec;
  }

  const palette = MOOD_PALETTES[activeScene.mood] ?? MOOD_PALETTES.intro;
  const progress = Math.min(1, Math.max(0, elapsedSec / totalSec));
  const sceneProg = Math.min(1, sceneLocalT / Math.max(1, activeScene.durationSec));
  const pad = Math.round(width * 0.06);

  // 1. Deep Modern Studio Gradient Backdrop
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, palette.bgTop);
  grad.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Architectural Grid Lines
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  const gridStep = Math.round(width / 10);
  for (let gx = 0; gx <= width; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy <= height; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Ambient Glowing Kinetic Orbs & Orbit Rings
  const cx = width * 0.5;
  const cy = isVertical ? height * 0.42 : height * 0.44;
  const baseRadius = Math.min(width, height) * 0.28;

  const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius * 1.45);
  orbGrad.addColorStop(0, `${palette.accent}44`);
  orbGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 1.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(elapsedSec * 0.35);
  ctx.strokeStyle = `${palette.accent}66`;
  ctx.lineWidth = Math.max(2, width * 0.004);
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(-elapsedSec * 0.6);
  ctx.strokeStyle = `${palette.secondary}55`;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4. Top Progress Bar + Episode / Scene Badge
  const barY = Math.round(height * 0.032);
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  drawRoundedRect(ctx, pad, barY, width - pad * 2, 6, 3);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  drawRoundedRect(ctx, pad, barY, (width - pad * 2) * progress, 6, 3);
  ctx.fill();

  // Top Pill Badge
  const pillY = barY + 18;
  const badgeFont = isVertical ? Math.round(width * 0.034) : Math.round(height * 0.03);
  ctx.font = `800 ${badgeFont}px system-ui, -apple-system, sans-serif`;
  const badgeText = `EP #${episode.episodeNumber} · ${activeScene.label.toUpperCase()}`;
  const badgeW = Math.min(width - pad * 2, ctx.measureText(badgeText).width + 32);
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = `${palette.accent}aa`;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pad, pillY, badgeW, badgeFont + 18, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, pad + 16, pillY + (badgeFont + 18) / 2);

  // 5. Center Editorial Motion Card (Visual Cue + Animated Audio Spectrum Bars)
  const slideOffset = (1 - Math.min(1, sceneProg * 3.5)) * 22;
  const cardW = width - pad * 2;
  const cardH = isVertical ? height * 0.29 : height * 0.36;
  const cardY = cy - cardH / 2 + slideOffset;

  ctx.save();
  ctx.fillStyle = "rgba(10, 18, 36, 0.78)";
  ctx.strokeStyle = `${palette.accent}80`;
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, pad, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Scene number tag inside card
  const tagSize = isVertical ? Math.round(width * 0.032) : Math.round(height * 0.028);
  ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
  ctx.fillStyle = palette.secondary;
  ctx.textAlign = "center";
  ctx.fillText(
    `${episode.storyStructure.toUpperCase()}`,
    cx,
    cardY + tagSize * 1.4
  );

  // Main Headline inside card (Visual Cue / Scene Focus)
  const headSize = isVertical ? Math.round(width * 0.062) : Math.round(height * 0.058);
  ctx.font = `900 ${headSize}px system-ui, -apple-system, sans-serif`;
  const cueLines = wrapText(ctx, activeScene.visualCue || activeScene.label, cardW - 44).slice(0, 3);
  ctx.fillStyle = "#ffffff";
  const lineStep = headSize * 1.24;
  const startTextY =
    cardY + cardH * 0.44 - ((cueLines.length - 1) * lineStep) / 2;
  cueLines.forEach((line, idx) => {
    ctx.fillText(line, cx, startTextY + idx * lineStep);
  });

  // Animated Modern Equalizer Bars at bottom of center card
  const barCount = 18;
  const eqW = Math.min(cardW * 0.65, 320);
  const barGap = eqW / barCount;
  const eqBaseY = cardY + cardH - 24;
  for (let i = 0; i < barCount; i += 1) {
    const wave =
      0.28 +
      0.72 *
        Math.abs(
          Math.sin(elapsedSec * 5.2 + i * 0.55) *
            Math.cos(elapsedSec * 2.1 + i * 0.25)
        );
    const bh = 8 + wave * 28;
    ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.secondary;
    drawRoundedRect(
      ctx,
      cx - eqW / 2 + i * barGap + 2,
      eqBaseY - bh,
      Math.max(4, barGap - 5),
      bh,
      3
    );
    ctx.fill();
  }
  ctx.restore();

  // 6. Crisp High-Contrast Kinetic Subtitle Card at Bottom
  const subFont = isVertical ? Math.round(width * 0.052) : Math.round(height * 0.048);
  ctx.font = `800 ${subFont}px system-ui, -apple-system, sans-serif`;
  const subLines = wrapText(ctx, activeScene.subtitle || activeScene.narration, cardW - 40).slice(0, 3);
  const subLineH = subFont * 1.28;
  const subBoxH = subLines.length * subLineH + 34;
  const subBoxY = height - subBoxH - Math.round(height * 0.055);

  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, pad, subBoxY, cardW, subBoxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  subLines.forEach((line, idx) => {
    const ly = subBoxY + 18 + idx * subLineH + subLineH / 2;
    ctx.fillText(line, cx, ly);
  });
  ctx.restore();
}

/** Generate a crisp 1280x720 Modern Editorial YouTube HD Thumbnail PNG (NO kids cartoons) */
export function renderEditorialThumbnail(
  episode: EditorialRenderEpisode
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // Deep Editorial Dark-Cyber Studio Gradient
  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, "#040918");
  bg.addColorStop(0.55, "#0d1f3c");
  bg.addColorStop(1, "#1e1036");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle glow accents
  const glowLeft = ctx.createRadialGradient(260, 220, 40, 260, 220, 520);
  glowLeft.addColorStop(0, "rgba(34, 211, 238, 0.28)");
  glowLeft.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowLeft;
  ctx.fillRect(0, 0, 1280, 720);

  const glowRight = ctx.createRadialGradient(1040, 520, 40, 1040, 520, 460);
  glowRight.addColorStop(0, "rgba(232, 121, 249, 0.28)");
  glowRight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowRight;
  ctx.fillRect(0, 0, 1280, 720);

  // Neon studio border frame
  ctx.strokeStyle = "rgba(34, 211, 238, 0.55)";
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 28, 28, 1224, 664, 28);
  ctx.stroke();

  // Top Episode & Structure Tag
  ctx.fillStyle = "#22d3ee";
  drawRoundedRect(ctx, 76, 78, 360, 58, 29);
  ctx.fill();
  ctx.fillStyle = "#040918";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`FAJREZZZ · EP #${episode.episodeNumber}`, 106, 108);

  // Giant High-CTR Modern Headline
  ctx.font = "900 92px system-ui, -apple-system, sans-serif";
  const lines = wrapText(ctx, episode.thumbnailHeadline, 1080).slice(0, 3);
  lines.forEach((line, i) => {
    const y = 265 + i * 110;
    ctx.fillStyle = i === 0 ? "#fde047" : "#ffffff";
    ctx.fillText(line, 76, y);
  });

  // Footer Bar with Format / Setting Info
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.strokeStyle = "rgba(232, 121, 249, 0.6)";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 76, 575, 1128, 72, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText(
    `${episode.storyStructure}  •  ${episode.setting}`.slice(0, 68),
    106,
    612
  );

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
