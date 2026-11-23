/**
 * RENDER VIDEO CONTOH — "Kenapa cooler HP bisa mengeluarkan air atau es?"
 *
 * Alur:
 *  1. Ukur durasi tiap klip narasi (ffprobe) → panjang scene = audio + jeda.
 *  2. Gambar visual prosedural per frame di Node (360x640) → pipe rawvideo ke
 *     ffmpeg → upscale 1080x1920 + encode per scene.
 *  3. Sambung scene (hard cut), lalu satu pass akhir: judul/label beranimasi,
 *     subtitle .ass (waktu mengikuti audio asli), progress bar, mix narasi +
 *     whoosh di setiap potongan.
 *  4. Verifikasi metadata hasil dengan ffprobe, ambil frame sampel, tulis laporan.
 *
 * Pemakaian:
 *   FFMPEG_PATH=... FFPROBE_PATH=... node --experimental-strip-types scripts/phone-cooler/render.ts
 */

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

import { FPS, WIDTH, HEIGHT, SCENE_TAIL_SEC } from "./scenes.ts";
import type { SceneSpec } from "./scenes.ts";
import { Frame, VW, VH, drawScene } from "./visuals.ts";

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";

const root = process.cwd();
const MODE = process.argv.includes("--tiktok") ? "tiktok" : "long";
const SLUG = MODE === "tiktok" ? "kenapa-cooler-hp-tiktok" : "kenapa-cooler-hp-keluarkan-air";
const REPORT_SLUG = MODE === "tiktok" ? "tiktok-report" : "render-report";
const SUB_MARGIN_V = MODE === "tiktok" ? 370 : 300;
const PROGRESS_Y = MODE === "tiktok" ? 1738 : 1836;
const MUSIC_PATH = MODE === "tiktok" ? path.join(root, "assets/music/tiktok-bed.mp3") : null;

const outDir = path.join(root, "docs/reports/phone-cooler");
const workDir = path.join(root, ".video-work", MODE === "tiktok" ? "phone-cooler-tiktok" : "phone-cooler");
const framesDir = path.join(outDir, "frames");
const txtDir = path.join(workDir, "txt");

for (const dir of [outDir, workDir, framesDir, txtDir]) fs.mkdirSync(dir, { recursive: true });

const FONT_BOLD = path.join(root, "assets/fonts/InterDisplay-Bold.ttf");
const FONT_SEMIBOLD = path.join(root, "assets/fonts/InterDisplay-SemiBold.ttf");
const FONT_BODY = path.join(root, "assets/fonts/Inter-Regular.ttf");
const FONT_BODY_SEMIBOLD = path.join(root, "assets/fonts/Inter-SemiBold.ttf");
const FONT_DIR = path.join(root, "assets/fonts");

for (const font of [FONT_BOLD, FONT_SEMIBOLD, FONT_BODY, FONT_BODY_SEMIBOLD]) {
  if (!fs.existsSync(font)) throw new Error(`Font hilang: ${font}`);
}

interface RunResult {
  ms: number;
  stdout: string;
  stderr: string;
}

function run(bin: string, args: string[], label: string): RunResult {
  const started = Date.now();
  const result = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw new Error(`${label} gagal: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`${label} gagal (exit ${result.status}):\n${(result.stderr || result.stdout).slice(0, 4000)}`);
  }
  return { ms: Date.now() - started, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function probeDurationSec(file: string): number {
  const out = run(
    FFPROBE,
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    `probe ${path.basename(file)}`
  );
  const value = Number(out.stdout.trim());
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Durasi tidak terbaca: ${file}`);
  return value;
}

/* ------------------------------- 1. timeline ------------------------------ */

interface SceneTiming {
  scene: SceneSpec;
  index: number;
  audioSec: number;
  startSec: number;
  durationSec: number;
  frames: number;
}

function buildTimeline(scenes: SceneSpec[]): { timings: SceneTiming[]; totalSec: number } {
  const timings: SceneTiming[] = [];
  let cursor = 0;
  scenes.forEach((scene, index) => {
    const audioPath = path.join(root, scene.audio);
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Narasi belum ada: ${scene.audio} (jalankan generate_speech dulu)`);
    }
    const audioSec = probeDurationSec(audioPath);
    const frames = Math.max(45, Math.round(((audioSec + SCENE_TAIL_SEC) * FPS)));
    const durationSec = frames / FPS;
    timings.push({ scene, index, audioSec, startSec: cursor, durationSec, frames });
    cursor += durationSec;
  });
  return { timings, totalSec: cursor };
}

/* ------------------------------ 2. render scene --------------------------- */

async function renderScene(timing: SceneTiming): Promise<{ file: string; ms: number }> {
  const started = Date.now();
  const file = path.join(workDir, `scene-${String(timing.index + 1).padStart(2, "0")}.mp4`);

  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "-s",
    `${VW}x${VH}`,
    "-r",
    String(FPS),
    "-i",
    "-",
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-g",
    String(FPS * 2),
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-frames:v",
    String(timing.frames),
    "-y",
    file,
  ];

  const child = spawn(FFMPEG, args, { stdio: ["pipe", "inherit", "inherit"] });
  const exit = new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`encode scene ${timing.index + 1} exit ${code}`))));
  });

  const frame = new Frame();
  const buffer = new Uint8Array(VW * VH * 3);
  const stdin = child.stdin;
  if (!stdin) throw new Error("stdin ffmpeg tidak tersedia");

  for (let i = 0; i < timing.frames; i += 1) {
    const t = i / FPS;
    drawScene(frame, timing.scene.visual, t, timing.durationSec);
    frame.toRgb(buffer, timing.index + 1);
    if (!stdin.write(buffer)) {
      await new Promise<void>((resolve) => stdin.once("drain", () => resolve()));
    }
  }
  stdin.end();
  await exit;
  return { file, ms: Date.now() - started };
}

/* --------------------------------- 3. teks -------------------------------- */

interface GeneratedText {
  filters: string[];
}

function writeTextFile(name: string, text: string): string {
  const file = path.join(txtDir, `${name}.txt`);
  fs.writeFileSync(file, text, "utf8");
  return file;
}

function drawText(options: {
  textFile: string;
  font: string;
  size: number;
  color: string;
  alpha?: string | number;
  x: string;
  y: string;
  enable: string;
  box?: boolean;
  shadow?: boolean;
  lineSpacing?: number;
}): string {
  const parts = [
    `fontfile=${options.font}`,
    `textfile=${options.textFile}`,
    `fontsize=${options.size}`,
    `fontcolor=${options.color}`,
  ];
  if (options.alpha !== undefined) parts.push(`alpha='${options.alpha}'`);
  parts.push(`x='${options.x}'`, `y='${options.y}'`, "expansion=none");
  if (options.lineSpacing) parts.push(`line_spacing=${options.lineSpacing}`);
  if (options.shadow) parts.push("shadowcolor=black@0.55", "shadowx=0", "shadowy=6");
  if (options.box) parts.push("box=1", "boxcolor=black@0.2", "boxborderw=18");
  parts.push(`enable='${options.enable}'`);
  return `drawtext=${parts.join(":")}`;
}

/** Pecah label panjang jadi beberapa baris agar tidak melewati batas kanan frame. */
function wrapLabel(text: string, size: number): string {
  const maxChars = Math.max(18, Math.floor((WIDTH - 176) / (size * 0.5)));
  if (text.length <= maxChars) return text;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.join("\n");
}

function buildTextLayer(timings: SceneTiming[]): GeneratedText {
  const filters: string[] = [];

  // Brand statis di setiap frame.
  const brandFile = writeTextFile("brand", "FAJREZZZ AI OFFICE");
  filters.push(
    drawText({
      textFile: brandFile,
      font: FONT_BODY_SEMIBOLD,
      size: 28,
      color: "0x9aa6b6@0.85",
      x: "72",
      y: "84",
      enable: "1",
    })
  );

  for (const timing of timings) {
    const { scene, startSec, durationSec } = timing;
    const endSec = startSec + durationSec - 0.02;
    const key = `s${String(timing.index + 1).padStart(2, "0")}`;

    // Kicker kanan atas.
    const kickerFile = writeTextFile(`${key}-kicker`, scene.kicker);
    filters.push(
      drawText({
        textFile: kickerFile,
        font: FONT_BODY_SEMIBOLD,
        size: 26,
        color: scene.accent.replace("#", "0x"),
        x: "w-text_w-72",
        y: "88",
        enable: `between(t,${startSec.toFixed(3)},${endSec.toFixed(3)})`,
      })
    );

    // Headline: tiap baris satu drawtext supaya bisa beda warna/ukuran.
    let y = scene.headlineY;
    scene.headline.forEach((line, lineIndex) => {
      const size = Math.round(scene.headlineSize * (line.scale ?? 1));
      const revealAt = startSec + 0.06 * lineIndex;
      const file = writeTextFile(`${key}-h${lineIndex}`, line.text);
      const color =
        line.tone === "accent" ? scene.accent.replace("#", "0x") : line.tone === "muted" ? "0xc3ccd9" : "0xf4f7ff";
      filters.push(
        drawText({
          textFile: file,
          font: line.tone === "muted" ? FONT_SEMIBOLD : FONT_BOLD,
          size,
          color,
          alpha: `min(1,max(0,(t-${revealAt.toFixed(3)})/0.32))`,
          x: "72",
          y: `${Math.round(y)}+26-26*min(1,max(0,(t-${revealAt.toFixed(3)})/0.45))`,
          enable: `between(t,${startSec.toFixed(3)},${endSec.toFixed(3)})`,
          shadow: true,
          lineSpacing: Math.round(size * 0.12),
        })
      );
      y += size * 1.14;
    });

    // Label pendukung.
    scene.labels.forEach((label, labelIndex) => {
      const at = startSec + (label.at ?? 0.6);
      const file = writeTextFile(`${key}-l${labelIndex}`, wrapLabel(label.text, label.size));
      const align = label.align ?? "left";
      const x =
        align === "center" ? `(w-text_w)/2` : align === "right" ? `w-text_w-${WIDTH - label.x}` : String(label.x);
      filters.push(
        drawText({
          textFile: file,
          font: FONT_BODY,
          size: label.size,
          color: (label.color ?? "#aab3c2").replace("#", "0x"),
          alpha: `min(1,max(0,(t-${at.toFixed(3)})/0.4))`,
          x,
          y: `${label.y}+18-18*min(1,max(0,(t-${at.toFixed(3)})/0.4))`,
          enable: `between(t,${at.toFixed(3)},${endSec.toFixed(3)})`,
          shadow: true,
          box: true,
          lineSpacing: Math.round(label.size * 0.35),
        })
      );
    });

    // Bar aksen kecil di kiri headline sebagai penanda scene.
    filters.push(
      `drawbox=x=40:y=${Math.round(scene.headlineY + 6)}:w=6:h=${Math.round(scene.headlineSize * 0.9)}:color=${scene.accent.replace("#", "0x")}@0.9:t=fill:enable='between(t,${startSec.toFixed(
        3
      )},${endSec.toFixed(3)})'`
    );

    // Daftar tips: garis aksen muncul bersamaan dengan tiap poin.
    if (scene.id === "tips") {
      const rows = [760, 900, 1040];
      rows.forEach((rowY, i) => {
        const at = startSec + [0.3, 1.2, 2.1][i];
        filters.push(
          `drawbox=x=96:y=${rowY - 26}:w=4:h=44:color=${scene.accent.replace("#", "0x")}@0.9:t=fill:enable='between(t,${at.toFixed(
            3
          )},${endSec.toFixed(3)})'`
        );
      });
    }
  }

  return { filters };
}

/* ------------------------------- 4. subtitle ------------------------------ */

function assTime(sec: number): string {
  const total = Math.max(0, sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const cs = Math.round((total - Math.floor(total)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(Math.min(99, cs)).padStart(2, "0")}`;
}

function bgr(hex: string): string {
  const c = hex.replace("#", "").trim();
  return `${c.slice(4, 6)}${c.slice(2, 4)}${c.slice(0, 2)}`.toUpperCase();
}

const HIGHLIGHT_WORDS = /(17|25|60|30|0|nol|es|air|embun|Peltier|watt|titik embun)/i;

function chunkNarration(text: string, maxWords = 7): string[] {
  const clauses = text
    .trim()
    .split(/(?<=[.,?!])\s+/)
    .filter(Boolean);
  const chunks: string[] = [];
  for (const clause of clauses) {
    const words = clause.split(/\s+/);
    for (let i = 0; i < words.length; i += maxWords) {
      const piece = words.slice(i, i + maxWords).join(" ");
      if (piece) chunks.push(piece);
    }
  }
  // gabungkan potongan yang terlalu pendek (1-2 kata) ke potongan sebelumnya
  const merged: string[] = [];
  for (const chunk of chunks) {
    if (merged.length && chunk.split(/\s+/).length <= 2) merged[merged.length - 1] += ` ${chunk}`;
    else merged.push(chunk);
  }
  return merged.length ? merged : [text];
}

function buildAss(timings: SceneTiming[]): { ass: string; cues: number } {
  const dialogues: string[] = [];
  for (const timing of timings) {
    const { scene, startSec, audioSec } = timing;
    const chunks = chunkNarration(scene.narration);
    const weights = chunks.map((c) => c.length);
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
    let cursor = startSec + 0.06;
    chunks.forEach((chunk, i) => {
      const span = (weights[i] / totalWeight) * Math.max(0.8, audioSec - 0.1);
      const from = cursor;
      const to = cursor + span;
      cursor = to;
      const text = chunk
        .replace(/[{}]/g, "")
        .replace(/\\/g, "/")
        .split(" ")
        .map((word) => (HIGHLIGHT_WORDS.test(word) ? `{\\rAccent}${word}{\\rDefault}` : word))
        .join(" ");
      dialogues.push(`Dialogue: 0,${assTime(from)},${assTime(to)},Default,,0,0,0,,${text}`);
    });
  }

  const style = `-1,0,0,0,100,100,0,0,1,6,3,2,95,95,${SUB_MARGIN_V},1`;
  const ass = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Inter,52,&H00F2F6FF,&H00F2F6FF,&HAA05070C,&H7A000000,${style}`,
    `Style: Accent,Inter,52,&H00${bgr("#35e0ff")},&H00F2F6FF,&HAA05070C,&H7A000000,${style}`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...dialogues,
  ].join("\n");
  return { ass, cues: dialogues.length };
}

/* --------------------------------- 5. audio ------------------------------- */

function makeWhoosh(file: string): void {
  run(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=d=0.6:c=pink:r=48000:a=0.7",
      "-af",
      "highpass=f=320,lowpass=f=5200,afade=t=in:st=0:d=0.12,afade=t=out:st=0.18:d=0.42,volume=0.9",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-y",
      file,
    ],
    "buat whoosh"
  );
}

function buildAudioFilter(
  timings: SceneTiming[],
  offset: number,
  whooshIndex: number,
  musicIndex: number | null,
  totalSec: number
): { graph: string; label: string } {
  const parts: string[] = [];
  const labels: string[] = [];

  timings.forEach((timing, i) => {
    const inputIndex = offset + i;
    const delayMs = Math.round(timing.startSec * 1000);
    parts.push(`[${inputIndex}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${delayMs}|${delayMs}[n${i}]`);
    labels.push(`[n${i}]`);
  });

  // whoosh tipis di setiap potongan (bukan di awal video)
  const cuts = timings.slice(1);
  parts.push(`[${whooshIndex}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=${cuts.length}${cuts
    .map((_, i) => `[w${i}]`)
    .join("")}`);
  cuts.forEach((timing, i) => {
    const delayMs = Math.round((timing.startSec - 0.18) * 1000);
    parts.push(`[w${i}]adelay=${delayMs}|${delayMs},volume=0.35[q${i}]`);
    labels.push(`[q${i}]`);
  });

  if (musicIndex !== null) {
    const fadeOutStart = Math.max(0, totalSec - 2.6);
    parts.push(
      `[${musicIndex}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.35,` +
        `afade=t=in:st=0:d=1.4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=2.4[mus]`
    );
    labels.push("[mus]");
  }

  parts.push(
    `${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]`
  );
  return { graph: parts.join(";"), label: "[aout]" };
}

/* ---------------------------------- main ---------------------------------- */

async function main(): Promise<void> {
  const { SCENES: sceneList } = (await import(MODE === "tiktok" ? "./scenes-tiktok.ts" : "./scenes.ts")) as {
    SCENES: SceneSpec[];
  };
  const { timings, totalSec } = buildTimeline(sceneList);
  const totalFrames = timings.reduce((sum, t) => sum + t.frames, 0);
  console.log(
    `Timeline: ${timings.length} scene, ${totalSec.toFixed(2)} s (${totalFrames} frame). ` +
      `Narasi terukur: ${timings.map((t) => t.audioSec.toFixed(1)).join(" / ")} s`
  );

  const reuse = process.argv.includes("--reuse-base");
  const basePath = path.join(workDir, "base.mp4");
  const sceneFiles: string[] = [];
  for (const timing of timings) {
    process.stdout.write(`render scene ${timing.index + 1}/${timings.length} (${timing.scene.id}) … `);
    if (reuse && fs.existsSync(basePath)) {
      sceneFiles.push(path.join(workDir, `scene-${String(timing.index + 1).padStart(2, "0")}.mp4`));
      process.stdout.write("dilewati (--reuse-base)\n");
      continue;
    }
    const { file, ms } = await renderScene(timing);
    sceneFiles.push(file);
    process.stdout.write(`${timing.frames} frame, ${(ms / 1000).toFixed(1)} s\n`);
  }

  // sambung
  const listFile = path.join(workDir, "scenes.txt");
  fs.writeFileSync(listFile, sceneFiles.map((f) => `file '${f}'`).join("\n"), "utf8");
  const baseFile = basePath;
  if (!(reuse && fs.existsSync(baseFile))) {
    run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-y", baseFile], "gabung scene");
  } else {
    console.log("pakai base.mp4 yang sudah ada");
  }

  // subtitle + teks
  const { ass, cues } = buildAss(timings);
  const assPath = path.join(outDir, `${SLUG}.ass`);
  fs.writeFileSync(assPath, ass, "utf8");
  const { filters } = buildTextLayer(timings);

  const whoosh = path.join(workDir, "whoosh.wav");
  makeWhoosh(whoosh);

  const audioInputs = timings.flatMap((t) => ["-i", path.join(root, t.scene.audio)]);
  const whooshIndex = 2 + timings.length; // 0 = base, 1 = bar, lalu narasi
  const musicIndex = MUSIC_PATH ? whooshIndex + 1 : null;
  if (MUSIC_PATH && !fs.existsSync(MUSIC_PATH)) {
    throw new Error(`Musik latar tidak ada: ${path.relative(root, MUSIC_PATH)} (jalankan scripts/phone-cooler/music.ts lalu encode ke mp3)`);
  }
  const { graph, label } = buildAudioFilter(timings, 2, whooshIndex, musicIndex, totalSec);

  const videoChain = [
    `[0:v][1:v]overlay=x='${WIDTH}*(t/${totalSec.toFixed(3)})-${WIDTH}':y=${PROGRESS_Y}:shortest=1[bar]`,
    `[bar]${filters.map((f) => f).join(",")},ass=${assPath}:fontsdir=${FONT_DIR},format=yuv420p[vout]`,
  ].join(";");

  const graphText = `${videoChain};${graph}`;
  fs.writeFileSync(path.join(workDir, "graph.txt"), graphText, "utf8");
  const finalFile = path.join(outDir, `${SLUG}.mp4`);
  const encodeStarted = Date.now();
  run(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      baseFile,
      "-f",
      "lavfi",
      "-i",
      `color=c=0x35e0ff:s=${WIDTH}x6:r=${FPS}`,
      ...audioInputs,
      "-i",
      whoosh,
      ...(MUSIC_PATH ? ["-stream_loop", "-1", "-i", MUSIC_PATH] : []),
      "-filter_complex",
      graphText,
      "-map",
      "[vout]",
      "-map",
      label,
      "-t",
      totalSec.toFixed(3),
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-maxrate",
      "8M",
      "-bufsize",
      "16M",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
      "-y",
      finalFile,
    ],
    "encode final"
  );
  const encodeMs = Date.now() - encodeStarted;

  // verifikasi
  const probe = JSON.parse(
    run(
      FFPROBE,
      ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", finalFile],
      "ffprobe"
    ).stdout
  ) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; pix_fmt?: string; r_frame_rate?: string; channels?: number; sample_rate?: string }[];
    format: { duration: string; bit_rate: string; size: string; format_name: string };
  };
  const video = probe.streams.find((s) => s.codec_type === "video");
  const audio = probe.streams.find((s) => s.codec_type === "audio");
  const [num, den] = (video?.r_frame_rate ?? "0/1").split("/").map(Number);

  const volume = run(
    FFMPEG,
    ["-hide_banner", "-i", finalFile, "-af", "volumedetect", "-f", "null", "-"],
    "volume check"
  );
  const meanMatch = /mean_volume:\s*(-?[\d.]+) dB/.exec(`${volume.stdout}\n${volume.stderr}`);
  const maxMatch = /max_volume:\s*(-?[\d.]+) dB/.exec(`${volume.stdout}\n${volume.stderr}`);

  const decode = run(FFMPEG, ["-v", "error", "-i", finalFile, "-f", "null", "-"], "decode check");
  const decodeOk = `${decode.stdout}${decode.stderr}`.trim() === "";

  const durationSec = Number(probe.format.duration);
  const frameTimes = [2, Math.round(durationSec * 0.18), Math.round(durationSec * 0.38), Math.round(durationSec * 0.55), Math.round(durationSec * 0.75), Math.round(durationSec * 0.94)];
  const frames = frameTimes.map((t) => {
    const file = path.join(framesDir, `frame-${t}s.png`);
    run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", finalFile, "-frames:v", "1", "-y", file], "frame sample");
    return path.relative(root, file);
  });

  const report = {
    video: path.relative(root, finalFile),
    generatedAt: new Date().toISOString(),
    subtitleFile: path.relative(root, assPath),
    probe: {
      width: video?.width ?? 0,
      height: video?.height ?? 0,
      fps: den ? Math.round((num / den) * 1000) / 1000 : 0,
      videoCodec: video?.codec_name ?? "?",
      pixFmt: video?.pix_fmt ?? "?",
      audioCodec: audio?.codec_name ?? null,
      audioChannels: audio?.channels ?? 0,
      audioSampleRate: Number(audio?.sample_rate ?? 0),
      durationSec: Math.round(durationSec * 100) / 100,
      bitrateKbps: Math.round(Number(probe.format.bit_rate) / 1000),
      sizeMB: Math.round((Number(probe.format.size) / 1024 / 1024) * 10) / 10,
      formatName: probe.format.format_name,
    },
    audioLevel: { meanDb: meanMatch ? Number(meanMatch[1]) : null, maxDb: maxMatch ? Number(maxMatch[1]) : null },
    decodeCheck: { ok: decodeOk, detail: decodeOk ? "decode bersih tanpa error" : `${decode.stdout}${decode.stderr}`.slice(0, 400) },
    renderMs: { total: encodeMs, perScene: timings.map((t) => ({ id: t.scene.id, frames: t.frames, durationSec: Math.round(t.durationSec * 100) / 100 })) },
    timeline: timings.map((t) => ({
      index: t.index + 1,
      id: t.scene.id,
      startSec: Math.round(t.startSec * 100) / 100,
      durationSec: Math.round(t.durationSec * 100) / 100,
      narrationSec: Math.round(t.audioSec * 100) / 100,
    })),
    subtitleCues: cues,
    frames,
    honesty: {
      narration:
        "Narasi = suara TTS yang dihasilkan di sesi ini (Arena voice), satu klip per scene; durasi scene diukur dari file audio, bukan diperkirakan.",
      visuals:
        "Visual digambar prosedural di Node (gradien, embun, kristal, partikel) lalu di-upscale ffmpeg; tidak memakai stok footage atau B-roll AI.",
      music:
        MODE === "tiktok"
          ? "Musik latar disintesis sendiri di Node (scripts/phone-cooler/music.ts, 84 BPM, progresi Am-F-C-G) lalu di-encode ke mp3 — bebas klaim lisensi pihak ketiga. Volume musik ±0,35 relatif suara, di-fade in/out."
          : "Tanpa musik latar. Hanya narasi + whoosh tipis yang disintesis ffmpeg di setiap potongan.",
      sources:
        "Titik embun: rumus Magnus/Tetens (25°C/60% ≈ 16,7°C). Tetesan air: FAQ resmi ASUS AeroActive Cooler 6. Daya & sisi panas: datasheet TEC1-12706.",
    },
  };

  fs.writeFileSync(path.join(outDir, `${REPORT_SLUG}.json`), JSON.stringify(report, null, 2), "utf8");
  const md = [
    "# Video contoh — kenapa cooler HP bisa mengeluarkan air atau es",
    "",
    `File: \`${report.video}\``,
    `Dibuat: ${report.generatedAt}`,
    "",
    "| Item | Nilai |",
    "|---|---|",
    `| Resolusi / fps | ${report.probe.width}×${report.probe.height} · ${report.probe.fps} fps |`,
    `| Codec | ${report.probe.videoCodec} (${report.probe.pixFmt}) + ${report.probe.audioCodec} |`,
    `| Durasi | ${report.probe.durationSec} s |`,
    `| Bitrate / ukuran | ${report.probe.bitrateKbps} kbps · ${report.probe.sizeMB} MB |`,
    `| Level audio | rata-rata ${report.audioLevel.meanDb} dB, puncak ${report.audioLevel.maxDb} dB |`,
    `| Decode | ${report.decodeCheck.ok ? "bersih" : "GAGAL"} |`,
    `| Cue subtitle | ${cues} |`,
    "",
    "## Timeline",
    "",
    "| # | Scene | Mulai | Durasi | Narasi |",
    "|---|---|---|---|---|",
    ...report.timeline.map((t) => `| ${t.index} | ${t.id} | ${t.startSec}s | ${t.durationSec}s | ${t.narrationSec}s |`),
    "",
    "## Yang harus dibaca sebelum menilai",
    "",
    `- **Narasi.** ${report.honesty.narration}`,
    `- **Visual.** ${report.honesty.visuals}`,
    `- **Audio.** ${report.honesty.music}`,
    `- **Sumber.** ${report.honesty.sources}`,
  ].join("\n");
  fs.writeFileSync(path.join(outDir, `${REPORT_SLUG}.md`), md, "utf8");

  const valid =
    report.probe.width === WIDTH &&
    report.probe.height === HEIGHT &&
    report.probe.fps === FPS &&
    report.probe.videoCodec === "h264" &&
    report.probe.pixFmt === "yuv420p" &&
    report.probe.audioCodec === "aac" &&
    report.decodeCheck.ok &&
    (report.audioLevel.meanDb ?? -100) > -45;

  console.log(
    `\n${valid ? "VALID" : "TIDAK VALID"} · ${report.probe.width}x${report.probe.height} ${report.probe.fps}fps ` +
      `${report.probe.durationSec}s · ${report.probe.sizeMB} MB · audio ${report.audioLevel.meanDb}/${report.audioLevel.maxDb} dB`
  );
  if (!valid) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
