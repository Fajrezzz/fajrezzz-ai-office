import type {
  CartoonScene,
  KidsEpisode,
  KidsThemeId,
} from "@/lib/kids-studio/episode-brain";

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

function drawCuteEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spread: number,
  size: number,
  t: number
) {
  const blink = Math.sin(t * 2.7) > 0.96 ? 0.15 : 1;
  [-spread, spread].forEach((ox) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x + ox, y, size, size * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = Math.max(2, size * 0.22);
    ctx.stroke();

    if (blink > 0.4) {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(x + ox + size * 0.16, y, size * 0.52, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x + ox + size * 0.3, y - size * 0.22, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Happy smile
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = Math.max(2.5, size * 0.28);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + size * 0.7, size * 0.75, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.beginPath();
  ctx.moveTo(-r * 0.48, 0);
  ctx.lineTo(r * 0.48, 0);
  ctx.moveTo(0, -r * 0.48);
  ctx.lineTo(0, r * 0.48);
  ctx.stroke();
  ctx.restore();
}

function drawRainbow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha = 0.85
) {
  const colors = [
    "#ef4444",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#38bdf8",
    "#a855f7",
  ];
  ctx.save();
  ctx.globalAlpha = alpha;
  colors.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = radius * 0.065;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - i * radius * 0.062, Math.PI, 0, false);
    ctx.stroke();
  });
  ctx.restore();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number
) {
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.beginPath();
  ctx.arc(x, y, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 10 * s, 32 * s, 0, Math.PI * 2);
  ctx.arc(x + 56 * s, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 28 * s, y + 10 * s, 26 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeroByTheme(
  ctx: CanvasRenderingContext2D,
  themeId: KidsThemeId,
  cx: number,
  cy: number,
  scale: number,
  t: number,
  sceneProgress: number,
  action: CartoonScene["action"]
) {
  ctx.save();
  const bounce = Math.sin(t * 7.5) * 8 * scale;
  const slideIn =
    action === "move_in"
      ? (Math.min(1, sceneProgress * 1.4) - 1) * 280 * scale
      : 0;
  ctx.translate(cx + slideIn, cy + bounce);
  ctx.scale(scale, scale);

  if (themeId === "rescue_trucks") {
    // Cute Red Fire Truck
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, -155, -80, 290, 120, 26);
    ctx.fill();
    ctx.stroke();

    // Cab front window
    ctx.fillStyle = "#bae6fd";
    drawRoundedRect(ctx, 45, -62, 72, 52, 14);
    ctx.fill();
    ctx.stroke();

    // White stripe
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-150, -6, 280, 18);

    // Extending Yellow Ladder
    ctx.save();
    const ladderLift =
      action === "problem" || action === "solve" ? -0.45 : -0.1;
    ctx.translate(-110, -82);
    ctx.rotate(ladderLift);
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, 0, -22, 180, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Blinking Siren Light
    const sirenOn = Math.floor(t * 8) % 2 === 0;
    ctx.fillStyle = sirenOn ? "#38bdf8" : "#facc15";
    ctx.beginPath();
    ctx.arc(82, -92, 18, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Cute Cartoon Eyes on Windshield
    drawCuteEyes(ctx, 80, -40, 14, 11, t);

    // Rotating Wheels
    drawWheel(ctx, -90, 44, 34, t * 7);
    drawWheel(ctx, 82, 44, 34, t * 7);
  } else if (themeId === "dino_colors") {
    // Adorable Happy Green Baby Dinosaur
    ctx.fillStyle = "#22c55e";
    ctx.strokeStyle = "#14532d";
    ctx.lineWidth = 6;

    // Tail
    ctx.beginPath();
    ctx.moveTo(-60, 20);
    ctx.quadraticCurveTo(-165, 10, -145, -45);
    ctx.quadraticCurveTo(-110, -10, -50, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Round body
    ctx.beginPath();
    ctx.ellipse(-10, 12, 82, 72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Yellow belly
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.ellipse(22, 22, 46, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Dino Head
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.ellipse(46, -82, 74, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Colorful Back Spikes
    ["#facc15", "#f97316", "#ec4899"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(-55 - i * 16, -65 + i * 28, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    drawCuteEyes(ctx, 64, -90, 18, 13, t);

    // Colorful Eggs beside Dino
    const eggColors = ["#ef4444", "#facc15", "#38bdf8", "#a855f7"];
    eggColors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(-150 + i * 38, 62, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (themeId === "rainbow_train") {
    // Colorful Steam Train
    // Puffing clouds from chimney
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.9 + i * 0.33) % 1;
      ctx.fillStyle = `rgba(255,255,255,${1 - p})`;
      ctx.beginPath();
      ctx.arc(82 - p * 90, -118 - p * 85, 16 + p * 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fruit wagon behind
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#713f12";
    ctx.lineWidth = 5;
    drawRoundedRect(ctx, -210, -40, 110, 75, 16);
    ctx.fill();
    ctx.stroke();
    // Red apple + purple grapes in wagon
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(-175, -52, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(-132, -52, 20, 0, Math.PI * 2);
    ctx.fill();

    // Main locomotive boiler (Blue + Red cabin)
    ctx.fillStyle = "#38bdf8";
    ctx.strokeStyle = "#0c4a6e";
    drawRoundedRect(ctx, -82, -52, 195, 88, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ef4444";
    drawRoundedRect(ctx, -82, -108, 92, 68, 16);
    ctx.fill();
    ctx.stroke();

    // Chimney
    ctx.fillStyle = "#f97316";
    drawRoundedRect(ctx, 64, -105, 36, 56, 8);
    ctx.fill();
    ctx.stroke();

    drawCuteEyes(ctx, 42, -20, 15, 11, t);

    drawWheel(ctx, -180, 44, 24, t * 8);
    drawWheel(ctx, -125, 44, 24, t * 8);
    drawWheel(ctx, -45, 46, 32, t * 8);
    drawWheel(ctx, 68, 46, 32, t * 8);
  } else if (themeId === "space_rocket") {
    // Cute Rocket blasting through space!
    ctx.save();
    ctx.rotate(-0.35 + Math.sin(t * 3) * 0.08);

    // Animated Rocket Flame
    const flameLen = 58 + Math.sin(t * 28) * 18;
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(-28, 72);
    ctx.lineTo(0, 72 + flameLen);
    ctx.lineTo(28, 72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.moveTo(-14, 72);
    ctx.lineTo(0, 72 + flameLen * 0.65);
    ctx.lineTo(14, 72);
    ctx.closePath();
    ctx.fill();

    // Fins
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-45, 25);
    ctx.lineTo(-92, 85);
    ctx.lineTo(-42, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(45, 25);
    ctx.lineTo(92, 85);
    ctx.lineTo(42, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rocket Fuselage
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(0, -10, 56, 108, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Red Nose Cone
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, -78, 42, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Window porthole + Cute Face
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(0, -18, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCuteEyes(ctx, 0, -22, 11, 8, t);

    ctx.restore();
  } else if (themeId === "excavator_park") {
    // Cute Yellow Construction Excavator
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#713f12";
    ctx.lineWidth = 6;

    // Caterpillar Tracks
    ctx.fillStyle = "#334155";
    drawRoundedRect(ctx, -125, 22, 220, 52, 26);
    ctx.fill();
    ctx.stroke();
    [-85, -15, 55].forEach((wx) => drawWheel(ctx, wx, 48, 19, t * 5));

    // Yellow Body + Cab
    ctx.fillStyle = "#facc15";
    drawRoundedRect(ctx, -110, -76, 185, 100, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#bae6fd";
    drawRoundedRect(ctx, -15, -62, 75, 52, 12);
    ctx.fill();
    ctx.stroke();
    drawCuteEyes(ctx, 22, -40, 14, 10, t);

    // Animated Digging Arm & Bucket
    ctx.save();
    ctx.translate(72, -32);
    ctx.rotate(-0.45 + Math.sin(t * 3.5) * 0.25);
    ctx.fillStyle = "#eab308";
    drawRoundedRect(ctx, 0, -14, 118, 28, 10);
    ctx.fill();
    ctx.stroke();
    ctx.translate(110, 0);
    ctx.rotate(1.1 + Math.sin(t * 3.5) * 0.3);
    drawRoundedRect(ctx, 0, -12, 85, 24, 10);
    ctx.fill();
    ctx.stroke();
    // Bucket scoop
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(88, 10, 26, 0, Math.PI * 1.3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else {
    // Cute Bunny & Teddy Bear Friends!
    // Left: Cute White/Pink Bunny
    ctx.save();
    ctx.translate(-75, Math.abs(Math.sin(t * 6)) * -22);
    ctx.fillStyle = "#fdf2f8";
    ctx.strokeStyle = "#831843";
    ctx.lineWidth = 5;
    // Long ears
    ctx.beginPath();
    ctx.ellipse(-20, -118, 16, 46, -0.12, 0, Math.PI * 2);
    ctx.ellipse(20, -118, 16, 46, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Body + Head
    ctx.beginPath();
    ctx.ellipse(0, 25, 48, 56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -45, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCuteEyes(ctx, 0, -52, 16, 11, t);
    ctx.restore();

    // Right: Friendly Brown Bear
    ctx.save();
    ctx.translate(82, Math.abs(Math.cos(t * 5.2)) * -14);
    ctx.fillStyle = "#b45309";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-40, -92, 22, 0, Math.PI * 2);
    ctx.arc(40, -92, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 28, 58, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -48, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.ellipse(0, -34, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCuteEyes(ctx, 0, -56, 18, 11, t + 1);
    ctx.restore();
  }

  ctx.restore();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Render a single live 60fps cartoon animation frame onto the canvas */
export function renderCartoonFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: KidsEpisode,
  elapsedSec: number
) {
  // Determine active scene from elapsedSec
  let acc = 0;
  let activeScene = episode.scenes[0];
  let sceneElapsed = elapsedSec;
  for (const sc of episode.scenes) {
    if (elapsedSec < acc + sc.durationSec) {
      activeScene = sc;
      sceneElapsed = elapsedSec - acc;
      break;
    }
    acc += sc.durationSec;
    activeScene = sc;
    sceneElapsed = sc.durationSec;
  }
  const sceneProgress = Math.min(1, sceneElapsed / activeScene.durationSec);
  const isVertical = height > width;
  const isSpace = activeScene.mood === "space";

  // 1. Vibrant Sky Background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isSpace) {
    skyGrad.addColorStop(0, "#0f172a");
    skyGrad.addColorStop(0.6, "#1e1b4b");
    skyGrad.addColorStop(1, "#312e81");
  } else if (activeScene.mood === "exciting") {
    skyGrad.addColorStop(0, "#38bdf8");
    skyGrad.addColorStop(0.65, "#bae6fd");
    skyGrad.addColorStop(1, "#fef08a");
  } else {
    skyGrad.addColorStop(0, "#0ea5e9");
    skyGrad.addColorStop(0.6, "#7dd3fc");
    skyGrad.addColorStop(1, "#e0f2fe");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Space Stars & Planets OR Smiling Sun, Clouds & Rolling Hills
  if (isSpace) {
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 197 + 41) % 1000) / 1000 * width;
      const sy = ((i * 313 + 73) % 1000) / 1000 * height;
      const twinkle = 0.5 + 0.5 * Math.sin(elapsedSec * 4 + i);
      ctx.fillStyle = `rgba(254, 240, 138, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5 + (i % 3) * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Smiling Moon
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, Math.min(width, height) * 0.085, 0, Math.PI * 2);
    ctx.fill();
    drawCuteEyes(ctx, width * 0.8, height * 0.2, 14, 9, elapsedSec);

    // Ringed Saturn Planet
    ctx.save();
    ctx.translate(width * 0.2, height * 0.26);
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(width, height) * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.min(width, height) * 0.11, Math.min(width, height) * 0.025, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else {
    // Rotating Golden Smiling Sun
    const sunX = width * 0.84;
    const sunY = height * 0.14;
    const sunR = Math.min(width, height) * 0.075;
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(elapsedSec * 0.4);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 7;
    for (let r = 0; r < 10; r++) {
      const a = (r / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (sunR + 8), Math.sin(a) * (sunR + 8));
      ctx.lineTo(Math.cos(a) * (sunR + 24), Math.sin(a) * (sunR + 24));
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    drawCuteEyes(ctx, sunX, sunY, sunR * 0.28, sunR * 0.18, elapsedSec);

    // Rainbow in Rainbow/Celebrate scenes
    if (activeScene.mood === "rainbow" || activeScene.mood === "celebrate") {
      drawRainbow(ctx, width * 0.5, height * 0.68, Math.min(width, height) * 0.44);
    }

    // Drifting Fluffy Clouds
    const c1 = ((elapsedSec * 28) % (width + 240)) - 120;
    const c2 = ((elapsedSec * 19 + width * 0.55) % (width + 240)) - 120;
    drawCloud(ctx, c1, height * 0.17, isVertical ? 0.9 : 1.15);
    drawCloud(ctx, c2, height * 0.26, isVertical ? 0.75 : 0.95);

    // Rolling Cartoon Green Hills & Road
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.ellipse(width * 0.24, height * 0.78, width * 0.46, height * 0.19, 0, 0, Math.PI * 2);
    ctx.ellipse(width * 0.78, height * 0.8, width * 0.48, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, height * 0.72, width, height * 0.28);

    // Asphalt Kids Cartoon Road Strip
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, height * 0.74, width, height * 0.1);
    ctx.fillStyle = "#fef08a";
    for (let dx = -((elapsedSec * 140) % 90); dx < width; dx += 90) {
      ctx.fillRect(dx, height * 0.785, 48, 8);
    }
  }

  // 3. Draw Animated Cartoon Hero Character(s)
  const heroScale = isVertical ? width / 560 : height / 520;
  const heroY = isSpace ? height * 0.48 : height * 0.64;
  drawHeroByTheme(
    ctx,
    episode.themeId,
    width * 0.5,
    heroY,
    heroScale,
    elapsedSec,
    sceneProgress,
    activeScene.action
  );

  // 4. Celebration Confetti on Final Scene
  if (activeScene.action === "celebrate") {
    const confColors = ["#ef4444", "#facc15", "#22c55e", "#38bdf8", "#ec4899"];
    for (let i = 0; i < 28; i++) {
      const cx = ((i * 137 + elapsedSec * 45) % width);
      const cy = ((i * 89 + elapsedSec * 160) % (height * 0.75));
      ctx.fillStyle = confColors[i % confColors.length];
      ctx.fillRect(cx, cy, 12, 12);
    }
  }

  // 5. Top Badge: Episode + 3-Second Hook Pill
  const pad = Math.round(width * 0.045);
  ctx.save();
  ctx.fillStyle =
    activeScene.sceneNumber === 1 ? "#ef4444" : "rgba(15, 23, 42, 0.78)";
  drawRoundedRect(ctx, pad, pad, isVertical ? width * 0.62 : 340, 46, 23);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${isVertical ? 22 : 20}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    activeScene.sceneNumber === 1
      ? `🔥 HOOK 3 DETIK · EP #${episode.episodeNumber}`
      : `🎬 EP #${episode.episodeNumber} · ${activeScene.label.toUpperCase()}`,
    pad + 18,
    pad + 23
  );
  ctx.restore();

  // 6. Big Colorful Bouncing Kids Subtitle Bubble at Bottom
  const boxW = width - pad * 2;
  const fontSize = isVertical ? Math.round(width * 0.056) : Math.round(height * 0.052);
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const lines = wrapTextLines(ctx, activeScene.subtitle, boxW - 44);
  const lineH = fontSize * 1.28;
  const boxH = lines.length * lineH + 34;
  const boxY = height - boxH - pad;

  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, pad, boxY, boxW, boxH, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, idx) => {
    const ly = boxY + 20 + lineH * idx + lineH / 2;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    ctx.strokeText(line, width / 2, ly);
    ctx.fillText(line, width / 2, ly);
  });
  ctx.restore();
}

/** Generate a crisp 1280x720 clickable high-CTR YouTube Kids Thumbnail PNG Data URL */
export function renderKidsThumbnail(episode: KidsEpisode): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // Sunburst high-CTR background
  const bg = ctx.createRadialGradient(640, 360, 60, 640, 360, 740);
  bg.addColorStop(0, "#fef08a");
  bg.addColorStop(0.55, "#38bdf8");
  bg.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // Comic starburst rays
  ctx.save();
  ctx.translate(640, 360);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 16; i++) {
    ctx.rotate((Math.PI * 2) / 16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-42, -780);
    ctx.lineTo(42, -780);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Rainbow + Hero Character on Right
  drawRainbow(ctx, 880, 560, 360, 0.9);
  drawHeroByTheme(ctx, episode.themeId, 920, 445, 1.55, 1.2, 0.6, "solve");

  // Giant High-CTR Outlined Headline on Left
  ctx.font = "900 84px system-ui, -apple-system, sans-serif";
  const lines = wrapTextLines(ctx, episode.thumbnailHeadline, 620);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const y = 210 + i * 96;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 18;
    ctx.lineJoin = "round";
    ctx.strokeText(line, 64, y);
    ctx.fillStyle = i === 0 ? "#fde047" : "#ffffff";
    ctx.fillText(line, 64, y);
  });

  // Bright Red Episode Pill
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, 64, 540, 390, 76, 38);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.fillText(`KARTUN ANAK · EP #${episode.episodeNumber}`, 96, 579);

  return canvas.toDataURL("image/png");
}

/** Synthesize cheerful 100% Copyright-Free Kids Xylophone Melody using Web Audio API */
export function startKidsMelody(connectToSpeakers = true): {
  audioStream: MediaStream | null;
  stop: () => void;
} {
  if (typeof window === "undefined") {
    return { audioStream: null, stop: () => {} };
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    return { audioStream: null, stop: () => {} };
  }

  const ctx = new AudioCtx();
  const dest = ctx.createMediaStreamDestination();
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(dest);
  if (connectToSpeakers) {
    master.connect(ctx.destination);
  }

  // Cheerful C-major pentatonic kids nursery melody (100% original / copyright-free)
  const notes = [
    523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
    523.25, 587.33, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25,
  ];
  let step = 0;

  const playNote = () => {
    if (ctx.state === "closed") return;
    const now = ctx.currentTime;
    const freq = notes[step % notes.length];
    step += 1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.36);
  };

  playNote();
  const intervalId = window.setInterval(playNote, 320);

  return {
    audioStream: dest.stream,
    stop: () => {
      window.clearInterval(intervalId);
      ctx.close().catch(() => {});
    },
  };
}
