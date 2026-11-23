/**
 * DEV TOOL — bukti bahwa tiap episode punya look berbeda.
 *
 *   npm run preview:variety
 *
 * Merender 4 episode berbeda (judul + nomor episode) memakai renderer zine yang
 * sama, lalu menyusunnya jadi satu lembar perbandingan:
 *   .zine-preview/perbandingan-episode.png
 *
 * Baris atas = frame tenang di tengah adegan 1, baris bawah = adegan artwork.
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { renderZineFrame } from "../src/lib/pipeline/zine-style.ts";
import { buildVisualVariation } from "../src/lib/pipeline/visual-variation.ts";

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

(globalThis as unknown as { document: unknown }).document = {
  createElement(tag: string) {
    if (tag !== "canvas") throw new Error(`unsupported element: ${tag}`);
    return createCanvas(2, 2);
  },
};

const EPISODES = [
  { title: "KANTOR AI INI KERJA SENDIRI TANPA MANUSIA", ep: 31 },
  { title: "BAGAIMANA AI MEMBACA GAMBAR", ep: 32 },
  { title: "AI VS MANUSIA: SIAPA LEBIH CEPAT", ep: 35 },
  { title: "AGEN AI YANG BISA NGETIK SENDIRI", ep: 34 },
];

const W = 1080;
const H = 1920;
const THUMB_W = 360;
const THUMB_H = 640;

const art = createCanvas(800, 800);
const ag = art.getContext("2d");
const grad = ag.createLinearGradient(0, 0, 800, 800);
grad.addColorStop(0, "#1b2a4a");
grad.addColorStop(0.55, "#c2410c");
grad.addColorStop(1, "#0b1020");
ag.fillStyle = grad;
ag.fillRect(0, 0, 800, 800);
ag.fillStyle = "rgba(255,255,255,0.75)";
for (let i = 0; i < 26; i += 1) {
  ag.beginPath();
  ag.arc(((i * 137) % 760) + 20, ((i * 233) % 760) + 20, (i % 5) * 6 + 8, 0, Math.PI * 2);
  ag.fill();
}

const sheetCols = EPISODES.length;
const sheet = createCanvas(sheetCols * THUMB_W, THUMB_H * 2 + 34);
const sctx = sheet.getContext("2d");
sctx.fillStyle = "#0A0A0B";
sctx.fillRect(0, 0, sheet.width, sheet.height);
sctx.fillStyle = "#F6F1E7";
sctx.font = '700 18px "Helvetica Neue", sans-serif';
sctx.fillText("EPISODE BERBEDA → LOOK BERBEDA (zine engine v9.2)", 14, 23);

EPISODES.forEach((item, col) => {
  const episode = {
    episodeNumber: item.ep,
    title: item.title,
    themeLabel: "AI Office",
    niche: "AI agents",
    visualStyle: "zine_glitch",
    sourceLabel: null,
    scenes: ["HOOK", "BUKTI", "TURN", "HASIL", "CTA"].map((label, i) => ({
      sceneNumber: i + 1,
      label,
      durationSec: 2,
      onScreenText: item.title.split(" ").slice(i, i + 2).join(" "),
      narration: `Penjelasan awam untuk ${label.toLowerCase()}: AI itu alat bantu, bukan sihir.`,
    })),
  } as unknown as Parameters<typeof renderZineFrame>[3];

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
  const artwork = [null, art as unknown as HTMLImageElement, null, null, null];

  // 1.0 s = adegan 1 tenang, 3.0 s = adegan 2 dengan artwork
  [1.0, 3.0].forEach((t, row) => {
    renderZineFrame(ctx, W, H, episode, t, artwork);
    sctx.drawImage(
      canvas as unknown as never,
      col * THUMB_W,
      34 + row * THUMB_H,
      THUMB_W,
      THUMB_H
    );
    sctx.strokeStyle = "#1F2937";
    sctx.lineWidth = 2;
    sctx.strokeRect(col * THUMB_W, 34 + row * THUMB_H, THUMB_W, THUMB_H);
  });

  const v = buildVisualVariation(item.title, item.ep, "AI agents");
  sctx.fillStyle = "#9CA3AF";
  sctx.font = '600 12px "Helvetica Neue", sans-serif';
  sctx.fillText(`EP ${item.ep} · ${v.label}`.slice(0, 48), col * THUMB_W + 8, THUMB_H * 2 + 26);
});

const outDir = path.resolve(process.cwd(), ".zine-preview");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "perbandingan-episode.png");
fs.writeFileSync(outPath, sheet.toBuffer("image/png"));
console.log(`✔ ${EPISODES.length} episode → ${outPath}`);
