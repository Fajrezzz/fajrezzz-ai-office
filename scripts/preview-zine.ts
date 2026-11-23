/**
 * DEV TOOL — render contoh frame gaya "zine glitch" tanpa browser.
 *
 *   npm run preview:zine            # 8 frame contoh ke .zine-preview/
 *   npm run preview:zine -- "KANTOR AI INI KERJA SENDIRI"
 *
 * Berguna untuk memeriksa komposisi tipografi/halftone sebelum render MP4 penuh.
 * Memakai @napi-rs/canvas sehingga hasilnya mendekati canvas browser.
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { renderZineFrame } from "../src/lib/pipeline/zine-style.ts";

const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
];

for (const fontPath of FONT_CANDIDATES) {
  if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, "Helvetica Neue");
    break;
  }
}

// Shim DOM minimal untuk cache tekstur (grain & halftone) di zine-style.ts
(globalThis as unknown as { document: unknown }).document = {
  createElement(tag: string) {
    if (tag !== "canvas") throw new Error(`unsupported element: ${tag}`);
    return createCanvas(2, 2);
  },
};

const topic =
  process.argv[2]?.trim() || "KANTOR AI INI KERJA SENDIRI TANPA MANUSIA";

const words = topic.split(/\s+/);
const chunk = Math.max(2, Math.ceil(words.length / 5));
const sceneTexts = Array.from({ length: Math.min(5, words.length) }, (_, i) =>
  words.slice(i * (chunk - 1), i * (chunk - 1) + chunk).join(" ")
);

const episodeNumber = Number(process.env.ZINE_EP ?? 27) || 27;

const episode = {
  episodeNumber,
  title: topic,
  themeLabel: "AI Office",
  niche: "AI agents",
  visualStyle: "zine_glitch",
  sourceLabel: null,
  scenes: sceneTexts.map((text, i) => ({
    sceneNumber: i + 1,
    label: ["HOOK", "BUKTI", "TURN", "HASIL", "CTA"][i % 5],
    durationSec: 2,
    onScreenText: text,
    // Narration asli lebih panjang dari onScreenText → caption penjelas ikut tampil
    narration:
      process.env.ZINE_NARRATION?.split("|")[i] ??
      `AI membaca ${text.toLowerCase()} langkah demi langkah, lalu menjelaskannya ke penonton dengan bahasa sehari-hari.`,
  })),
} as unknown as Parameters<typeof renderZineFrame>[3];

const W = 1080;
const H = 1920;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

// Artwork B-roll palsu untuk scene 2 (mensimulasikan hasil /api/ai/scene-image)
const art = createCanvas(800, 800);
const ag = art.getContext("2d");
const grad = ag.createLinearGradient(0, 0, 800, 800);
grad.addColorStop(0, "#1b2a4a");
grad.addColorStop(0.5, "#c2410c");
grad.addColorStop(1, "#0b1020");
ag.fillStyle = grad;
ag.fillRect(0, 0, 800, 800);
ag.fillStyle = "rgba(255,255,255,0.75)";
for (let i = 0; i < 36; i++) {
  ag.beginPath();
  ag.arc(Math.random() * 800, Math.random() * 800, Math.random() * 36, 0, Math.PI * 2);
  ag.fill();
}
ag.fillStyle = "#f8fafc";
ag.beginPath();
ag.ellipse(400, 320, 140, 180, 0, 0, Math.PI * 2);
ag.fill();
ag.fillRect(240, 480, 320, 300);

const outDir = path.resolve(
  process.cwd(),
  process.env.ZINE_OUT ?? ".zine-preview"
);
fs.mkdirSync(outDir, { recursive: true });

const times: Array<[string, number]> = [
  ["01-scene1-glitch", 0.06],
  ["02-scene1", 1.2],
  ["03-transition", 2.06],
  ["04-scene2-artwork", 3.0],
  ["05-scene3-black", 5.1],
  ["06-scene4", 7.4],
  ["07-scene5", 9.5],
];

const artwork = [null, art as unknown as HTMLImageElement, null, null, null];

for (const [name, t] of times) {
  renderZineFrame(ctx, W, H, episode, t, artwork);
  const small = createCanvas(432, 768);
  small.getContext("2d").drawImage(canvas as unknown as never, 0, 0, 432, 768);
  fs.writeFileSync(path.join(outDir, `${name}.png`), small.toBuffer("image/png"));
}

console.log(`✔ ${times.length} frame zine glitch → ${outDir}`);
