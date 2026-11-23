/**
 * Cek visual cepat: render satu frame per scene (tanpa audio) ke PNG
 * supaya komposisi & keterbacaan bisa dinilai sebelum encode penuh.
 *
 * Pemakaian: FFMPEG_PATH=... node --experimental-strip-types scripts/phone-cooler/stills.ts [--at 0.5] [--tiktok]
 *
 * Resolusi keluaran ikut OUTPUT_WIDTH (default 1440 = 2K vertikal).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { SCENES as LONG_SCENES, FPS } from "./scenes.ts";
import { Frame, RW, RH, drawScene } from "./visuals.ts";

const MODE = process.argv.includes("--tiktok") ? "tiktok" : "long";
const SCENES = MODE === "tiktok" ? (await import("./scenes-tiktok.ts")).SCENES : LONG_SCENES;
const OUT_W = Number(process.env.OUTPUT_WIDTH ?? 1440);
const OUT_H = Math.round((OUT_W * 16) / 9);

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const root = process.cwd();
const outDir = path.join(root, `.video-work/stills-${MODE}`);
fs.mkdirSync(outDir, { recursive: true });

const atArg = process.argv.indexOf("--at");
const at = atArg >= 0 ? Number(process.argv[atArg + 1]) : 0.55;

const frame = new Frame();
const buffer = new Uint8Array(RW * RH * 3);

SCENES.forEach((scene, index) => {
  const duration = 8;
  const t = duration * at;
  drawScene(frame, scene.visual, t, duration);
  frame.toRgb(buffer, index + 1);
  const file = path.join(outDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.png`);
  const result = spawnSync(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-s",
      `${RW}x${RH}`,
      "-i",
      "-",
      "-vf",
      `scale=${OUT_W}:${OUT_H}:flags=lanczos,format=rgb24`,
      "-frames:v",
      "1",
      "-y",
      file,
    ],
    { input: Buffer.from(buffer), maxBuffer: 32 * 1024 * 1024 }
  );
  if (result.status !== 0) throw new Error(`${scene.id}: ${result.stderr}`);
  console.log(`${scene.id} → ${path.relative(root, file)} (t=${t.toFixed(2)}s, ${FPS} fps)`);
});
