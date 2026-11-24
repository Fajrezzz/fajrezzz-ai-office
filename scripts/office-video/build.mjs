/**
 * BUILD video TikTok "Fajrezzz AI Office" — satu perintah, empat keluaran:
 *   1. master 2K 120fps (dengan audio)  → fajrezzz-office-tiktok-master-2k120.mp4
 *   2. versi TikTok 1080x1920 60fps     → fajrezzz-office-tiktok-1080p60.mp4
 *   3. report.json / report.md          (hasil ffprobe)
 *   4. caption.md                       (sudah ada di repo)
 *
 * Pemakaian:
 *   FFMPEG_PATH=... FFPROBE_PATH=... node scripts/office-video/build.mjs [--reuse]
 *
 * --reuse : pakai lagi frame master yang sudah ada (hanya mix audio + versi 1080p60)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const outDir = path.join(root, "docs/reports/office-tiktok");
const silentMaster = path.join(root, ".video-work/office-tiktok-silent.mp4");
const finalMaster = path.join(outDir, "fajrezzz-office-tiktok-master-2k120.mp4");
const tiktokFile = path.join(outDir, "fajrezzz-office-tiktok-1080p60.mp4");

const reuse = process.argv.includes("--reuse");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(silentMaster), { recursive: true });

function run(label, cmd, args) {
  const started = Date.now();
  process.stdout.write(`\n▶ ${label}\n`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root });
  if (r.status !== 0) throw new Error(`${label} gagal (exit ${r.status})`);
  console.log(`  ✓ ${label} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
}

// 1. frame master (tanpa audio) — render.mjs menulis ke nama final, jadi pindahkan
const hasSilent = reuse && fs.existsSync(silentMaster);
if (!hasSilent) {
  run("render 3600 frame 2K/120fps", process.execPath, ["scripts/office-video/render.mjs"]);
  fs.copyFileSync(finalMaster, silentMaster);
}

// 2. audio: musik + sfx
run("sintesis musik + sfx", process.execPath, ["scripts/office-video/audio.mjs"]);

// 3. mix: video master + 3 klip VO + musik + sfx
const vo = (n) => path.join(root, `assets/voice/office-tiktok/${n}.mp3`);
const mix = [
  "[1:a]aresample=48000,adelay=550|550[a1]",
  "[2:a]aresample=48000,adelay=21250|21250[a2]",
  "[3:a]aresample=48000,atempo=1.10,adelay=26900|26900[a3]",
  "[4:a]volume=0.30[mus]",
  "[5:a]volume=0.55[sfx]",
  "[a1][a2][a3][mus][sfx]amix=inputs=5:normalize=0:dropout_transition=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[aout]",
].join(";");

run("mix audio + master final", FFMPEG, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", silentMaster,
  "-i", vo("vo-01-intro"),
  "-i", vo("vo-02-reveal"),
  "-i", vo("vo-03-cta"),
  "-i", path.join(outDir, "music-bed.wav"),
  "-i", path.join(outDir, "sfx.wav"),
  "-filter_complex", mix,
  "-map", "0:v", "-map", "[aout]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
  "-t", "30", "-movflags", "+faststart",
  finalMaster,
]);

// 4. versi TikTok: 1080x1920 60fps
run("versi TikTok 1080x1920 60fps", FFMPEG, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", finalMaster,
  "-vf", "fps=60,scale=1080:1920:flags=lanczos",
  "-c:v", "libx264", "-preset", "medium", "-profile:v", "high", "-level", "4.2",
  "-pix_fmt", "yuv420p",
  "-b:v", "12M", "-minrate", "8M", "-maxrate", "16M", "-bufsize", "32M",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart",
  tiktokFile,
]);

// 5. verifikasi ffprobe → report
run("verifikasi ffprobe", process.execPath, ["scripts/office-video/verify.mjs"]);

for (const f of [finalMaster, tiktokFile]) {
  console.log(`· ${path.relative(root, f)} — ${(fs.statSync(f).size / 1048576).toFixed(1)} MB`);
}
