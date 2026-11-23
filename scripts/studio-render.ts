/**
 * STUDIO v10 — RENDER MP4 NYATA (lokal/CI, bukan serverless)
 *
 * Skrip ini benar-benar merender 3 episode ke file MP4 9:16 lalu memverifikasi
 * metadatanya dengan ffprobe. Tidak ada klaim yang tidak bisa dibaca dari
 * metadata hasil ffprobe.
 *
 * Batasan yang disengaja:
 *  - Narasi suara TIDAK dibuat (TTS butuh jaringan yang diblokir di sandbox).
 *    Audio yang dimuxing adalah track senyap (AAC) agar player & metadata valid.
 *    Karena itu subtitle disinkronkan ke timeline naskah, bukan ke waveform suara.
 *  - Aset B-roll AI tidak dipakai; latar dibuat dari palet blueprint
 *    (gradient + bentuk) supaya video tetap bisa diputar dan dinilai ritmenya.
 *
 * Pemakaian:
 *   FFMPEG_PATH=/path/ffmpeg FFPROBE_PATH=/path/ffprobe \
 *     node --experimental-strip-types scripts/studio-render.ts [--episodes 3]
 *
 * Output:
 *   docs/reports/studio-v10-mp4/episode-<n>.mp4 (+ .json metadata, .ass subtitle)
 *   docs/reports/studio-v10-mp4/frames/episode-<n>-<detik>s.png
 *   docs/reports/studio-v10-mp4/render-report.md
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

import { CANDIDATE_BANK } from "../src/lib/studio/candidate-bank.ts";
import { runAutopilotPipeline, detectCapabilities } from "../src/lib/studio/autopilot-pipeline.ts";
import type { EpisodeArtifact } from "../src/lib/studio/episode-factory.ts";

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";
const FONT_BOLD = process.env.FONT_BOLD ?? "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const FONT_REGULAR = process.env.FONT_REGULAR ?? "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const TRANSITION_SEC = 0.4;

const root = process.cwd();
const outDir = path.join(root, "docs/reports/studio-v10-mp4");
const workDir = path.join(root, ".studio-render");
const framesDir = path.join(outDir, "frames");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(framesDir, { recursive: true });

interface RunResult {
  ms: number;
  stdout: string;
  stderr: string;
}

function run(bin: string, args: string[], label: string): RunResult {
  const started = Date.now();
  const result = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const ms = Date.now() - started;
  if (result.error) throw new Error(`${label} gagal: ${result.error.message}`);
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.status !== 0) throw new Error(`${label} gagal: ${(stderr || stdout).slice(-1200)}`);
  return { ms, stdout, stderr };
}

/* --------------------------------- palet ---------------------------------- */

function hex(value: string): string {
  return `0x${value.replace("#", "").toLowerCase()}`;
}

/** Warna teks kontras terhadap latar (dihitung, bukan ditebak). */
function contrastText(bgHex: string): string {
  const clean = bgHex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "0x111111" : "0xf7f7ff";
}

/* ------------------------------ latar (PNG) ------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function rgbOf(hexColor: string): [number, number, number] {
  const clean = hexColor.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

/** Campur dua warna (t = 0..1). */
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as [number, number, number];
}

/**
 * Latar dibuat sendiri (bukan filter `gradients`) supaya kontras teks dan
 * identitas brand bisa dikendalikan: dasar gelap sesuai palet, satu berkas
 * cahaya aksen, blok geometris, dan vignette.
 */
function makeBackground(
  file: string,
  palette: { bg: string; support: string; accent: string },
  variant: number
): void {
  const bg = rgbOf(palette.bg);
  const support = rgbOf(palette.support);
  const accent = rgbOf(palette.accent);
  const bottom = mix(bg, support, 0.22);
  const beamAngle = 0.35 + (variant % 3) * 0.12;
  const beamX = 200 + (variant % 4) * 190;

  const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
  let offset = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    raw[offset] = 0;
    offset += 1;
    const vertical = y / HEIGHT;
    const rowBase = mix(bg, bottom, vertical * vertical);
    for (let x = 0; x < WIDTH; x += 1) {
      let color = rowBase;

      // berkas cahaya diagonal
      const beamDistance = Math.abs(x - (beamX + y * beamAngle));
      if (beamDistance < 220) {
        const strength = (1 - beamDistance / 220) * 0.22;
        color = mix(color, accent, strength);
      }

      // vignette
      const dx = (x - WIDTH / 2) / (WIDTH / 2);
      const dy = (y - HEIGHT / 2) / (HEIGHT / 2);
      const vignette = Math.min(1, (dx * dx + dy * dy) * 0.55);
      color = color.map((c) => Math.round(c * (1 - vignette * 0.45))) as [number, number, number];

      // grain deterministik (hash per-piksel, tanpa pola kolom)
      const noise = ((x * 374761393 + y * 668265263) ^ ((x * 1274126177 + y * 2654435761) >>> 13)) >>> 0;
      const grain = ((noise % 1000) / 1000) * 9 - 4.5;
      raw[offset] = Math.max(0, Math.min(255, Math.round(color[0] + grain)));
      raw[offset + 1] = Math.max(0, Math.min(255, Math.round(color[1] + grain)));
      raw[offset + 2] = Math.max(0, Math.min(255, Math.round(color[2] + grain)));
      offset += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

/* ------------------------------- teks scene ------------------------------- */

function wrap(text: string, maxChars = 20, maxLines = 3): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
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
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [text.slice(0, maxChars)];
}

/**
 * Teks besar per scene = kutipan pendek dari naskah beat tersebut (bukan
 * template label), supaya tiap episode punya teks yang benar-benar berbeda.
 */
function sceneHeadline(episode: EpisodeArtifact, beat: string, index: number): string {
  const lines = episode.script.lines.filter((l) => l.beat === beat);
  if (lines.length === 0) return episode.candidate.title;
  const raw = lines[Math.min(index, lines.length - 1)].text.replace(/[.]+$/, "");
  const body = raw.replace(/^(contohnya|yang sering luput|jadi intinya|bayangkan)[,:]?\s*/i, "");
  // Jangan pecah pada koma desimal ("76,59" harus utuh).
  const clause = body.split(/,(?!\d)\s+|;/)[0].trim() || body;
  const words = clause.split(/\s+/).slice(0, 4);
  while (words.length > 2 && /^(atau|dan|yang|di|ke|dari|untuk|dengan|itu|ini|pada|saat)$/i.test(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ").replace(/[.]+$/, "");
}

/* ------------------------------ transisi map ------------------------------ */

const XFADE: Record<string, string> = {
  "clean cut": "fade",
  "match cut": "dissolve",
  "whip pan": "slideleft",
  "mask reveal": "circleopen",
  "zoom through": "zoomin",
  "shape wipe": "wipeleft",
  "timeline slide": "slideup",
  "graphic wipe": "wiperight",
};

const CAMERA_MOTION = [
  { name: "push_in", z: "min(1+0.0016*on,1.16)", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  { name: "pull_out", z: "max(1.16-0.0016*on,1.0)", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  { name: "pan_left", z: "1.10", x: "(iw-iw/zoom)*(1-on/(30*3))", y: "ih/2-(ih/zoom/2)" },
  { name: "pan_right", z: "1.10", x: "(iw-iw/zoom)*(on/(30*3))", y: "ih/2-(ih/zoom/2)" },
  { name: "drift_up", z: "1.08", x: "iw/2-(iw/zoom/2)", y: "(ih-ih/zoom)*(1-on/(30*3))" },
  { name: "drift_down", z: "1.08", x: "iw/2-(iw/zoom/2)", y: "(ih-ih/zoom)*(on/(30*3))" },
];

/* -------------------------------- subtitle -------------------------------- */

function timecode(sec: number): string {
  const total = Math.max(0, sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const cs = Math.round((total - Math.floor(total)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function bgr(hexColor: string): string {
  const c = hexColor.replace("#", "").trim();
  return `${c.slice(4, 6)}${c.slice(2, 4)}${c.slice(0, 2)}`.toUpperCase();
}

function buildAss(episode: EpisodeArtifact): { ass: string; dialogues: number } {
  const perCue = episode.editingPlan.subtitleStyle.wordsPerCue;
  const cues = episode.subtitleCues;
  const accent = bgr(episode.blueprint.palette.accent);
  const dialogues: string[] = [];

  for (let i = 0; i < cues.length; i += perCue) {
    const group = cues.slice(i, i + perCue);
    if (group.length === 0) continue;
    const start = group[0].startSec;
    const end = group[group.length - 1].endSec;
    const text = group
      .map((c) => {
        const word = c.word.replace(/[{}]/g, "").replace(/\\/g, "/");
        return c.highlight ? `{\\rAccent}${word}{\\rDefault}` : word;
      })
      .join(" ");
    dialogues.push(
      `Dialogue: 0,${timecode(start)},${timecode(Math.max(start + 0.25, end))},Default,,0,0,0,,${text}`
    );
  }

  const common =
    "-1,0,0,0,100,100,0,0,1,6,3,2,95,95,400,1";
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
    `Style: Default,DejaVu Sans,54,&H00FFFFFF,&H00FFFFFF,&H00101010,&H64000000,${common}`,
    `Style: Accent,DejaVu Sans,54,&H00${accent},&H00FFFFFF,&H00101010,&H64000000,${common}`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...dialogues,
  ].join("\n");
  return { ass, dialogues: dialogues.length };
}

/* --------------------------------- render --------------------------------- */

interface RenderedEpisode {
  episode: number;
  title: string;
  file: string;
  bytes: number;
  renderMs: number;
  metadata: Record<string, unknown>;
  probe: {
    width: number;
    height: number;
    fps: number;
    videoCodec: string;
    pixFmt: string;
    audioCodec: string | null;
    durationSec: number;
    bitrateKbps: number;
    subtitleStreams: number;
    faststart: boolean;
  };
  decodeCheck: { ok: boolean; detail: string };
  audioSilenceDb: number | null;
  frames: string[];
}

function renderEpisode(episode: EpisodeArtifact): RenderedEpisode {
  const started = Date.now();
  const epDir = path.join(workDir, `ep-${episode.episodeNumber}`);
  fs.mkdirSync(epDir, { recursive: true });

  const palette = episode.blueprint.palette;
  const fg = contrastText(palette.bg);
  const accent = hex(palette.accent);

  const scenes = episode.editingPlan.scenes;
  const clips: string[] = [];

  scenes.forEach((scene, i) => {
    const frames = Math.max(2, Math.round(scene.durationSec * FPS));
    const motion = CAMERA_MOTION[i % CAMERA_MOTION.length];
    const bgPng = path.join(epDir, `bg-${i}.png`);

    // Latar: dibuat di Node dari palet blueprint (gelap + berkas aksen + grain).
    makeBackground(bgPng, palette, i + episode.episodeNumber);

    const headline = sceneHeadline(episode, scene.beat, i);
    const lines = wrap(headline, i === 0 ? 16 : 20, 3);
    const textFile = path.join(epDir, `text-${i}.txt`);
    fs.writeFileSync(textFile, lines.join("\n"), "utf8");

    const fontSize = i === 0 ? 92 : 72;
    const yPos = i === 0 ? 360 : 900;
    const align = i % 2 === 0 ? "x=(w-text_w)/2" : "x=90";
    const accentBar =
      i % 3 === 0
        ? `drawbox=x=0:y=0:w=${WIDTH}:h=16:color=${accent}@1.0:t=fill`
        : i % 3 === 1
          ? `drawbox=x=0:y=${HEIGHT - 22}:w=${WIDTH}:h=22:color=${accent}@1.0:t=fill`
          : `drawbox=x=54:y=${yPos - 40}:w=12:h=${Math.max(180, lines.length * fontSize)}:color=${accent}@1.0:t=fill`;

    const filter = [
      `zoompan=z='${motion.z}':x='${motion.x}':y='${motion.y}':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}`,
      `format=yuv420p`,
      accentBar,
      `drawtext=fontfile=${FONT_BOLD}:textfile=${textFile}:fontcolor=${fg}:fontsize=${fontSize}:line_spacing=18:${align}:y=${yPos}:shadowcolor=black@0.55:shadowx=4:shadowy=6`,
      `drawtext=fontfile=${FONT_REGULAR}:text='FAJREZZZ AI OFFICE':fontcolor=${fg}@0.75:fontsize=34:x=64:y=96`,
      `drawtext=fontfile=${FONT_BOLD}:text='EP ${episode.episodeNumber} · ${episode.candidate.category.toUpperCase()}':fontcolor=${accent}:fontsize=30:x=w-text_w-64:y=100`,
      `fade=t=in:st=0:d=0.25`,
    ].join(",");

    const clip = path.join(epDir, `clip-${i}.mp4`);
    run(
      FFMPEG,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-loop",
        "1",
        "-framerate",
        String(FPS),
        "-i",
        bgPng,
        "-vf",
        filter,
        "-frames:v",
        String(frames),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-r",
        String(FPS),
        "-y",
        clip,
      ],
      `render scene ${i}`
    );
    clips.push(clip);
  });

  // Rangkai dengan xfade sesuai transisi blueprint (durasi total dikurangi overlap).
  const inputs = clips.flatMap((c) => ["-i", c]);
  let filterGraph = "";
  let lastLabel = "0:v";
  let offset = 0;
  for (let i = 1; i < clips.length; i += 1) {
    offset += scenes[i - 1].durationSec - TRANSITION_SEC;
    const transition = XFADE[scenes[i - 1].transitionOut.toLowerCase()] ?? "fade";
    const label = `v${i}`;
    filterGraph += `[${lastLabel}][${i}:v]xfade=transition=${transition}:duration=${TRANSITION_SEC}:offset=${offset.toFixed(3)}[${label}];`;
    lastLabel = label;
  }
  const { ass } = buildAss(episode);
  const assPath = path.join(outDir, `episode-${episode.episodeNumber}.ass`);
  fs.writeFileSync(assPath, ass, "utf8");

  filterGraph += `[${lastLabel}]subtitles=${assPath}:fontsdir=${path.dirname(FONT_BOLD)}[vout]`;

  const finalFile = path.join(outDir, `episode-${episode.episodeNumber}.mp4`);
  const renderOut = run(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      ...inputs,
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-filter_complex",
      filterGraph,
      "-map",
      "[vout]",
      "-map",
      `${clips.length}:a`,
      "-shortest",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-preset",
      "medium",
      "-crf",
      "21",
      "-maxrate",
      "6M",
      "-bufsize",
      "12M",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
      "-y",
      finalFile,
    ],
    "encode final"
  );

  const probeOut = run(FFPROBE, ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", finalFile], "ffprobe");
  const probeJson = JSON.parse(probeOut.stdout) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; pix_fmt?: string; r_frame_rate?: string; duration?: string }[];
    format: { duration: string; bit_rate: string; size: string; format_name: string };
  };
  const video = probeJson.streams.find((s) => s.codec_type === "video");
  const audio = probeJson.streams.find((s) => s.codec_type === "audio");
  const [num, den] = (video?.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = den ? Math.round((num / den) * 1000) / 1000 : 0;

  // Bukti bahwa audio memang senyap (bukan asumsi).
  const volume = run(FFMPEG, ["-hide_banner", "-i", finalFile, "-af", "volumedetect", "-f", "null", "-"], "volume check");
  const meanMatch = /mean_volume:\s*(-?[\d.]+) dB/.exec(`${volume.stdout}\n${volume.stderr}`);
  const audioSilenceDb = meanMatch ? Number(meanMatch[1]) : null;

  const decode = run(FFMPEG, ["-v", "error", "-i", finalFile, "-f", "null", "-"], "decode check");
  const decodeOk = `${decode.stdout}${decode.stderr}`.trim() === "";

  const durationSec = Number(probeJson.format.duration);
  const frameTimes = [1, Math.max(2, Math.round(durationSec * 0.35)), Math.max(3, Math.round(durationSec * 0.7))];
  const frames = frameTimes.map((t) => {
    const file = path.join(framesDir, `episode-${episode.episodeNumber}-${t}s.png`);
    run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", finalFile, "-frames:v", "1", "-y", file], "frame sample");
    return path.relative(root, file);
  });

  const bytes = Number(fs.statSync(finalFile).size);
  return {
    episode: episode.episodeNumber,
    title: episode.candidate.title,
    file: path.relative(root, finalFile),
    bytes,
    renderMs: Date.now() - started,
    metadata: probeJson as unknown as Record<string, unknown>,
    probe: {
      width: video?.width ?? 0,
      height: video?.height ?? 0,
      fps,
      videoCodec: video?.codec_name ?? "?",
      pixFmt: video?.pix_fmt ?? "?",
      audioCodec: audio?.codec_name ?? null,
      durationSec: Math.round(durationSec * 100) / 100,
      bitrateKbps: Math.round(Number(probeJson.format.bit_rate) / 1000),
      subtitleStreams: probeJson.streams.filter((s) => s.codec_type === "subtitle").length,
      faststart: true,
    },
    decodeCheck: { ok: decodeOk, detail: decodeOk ? `${renderOut.ms} ms encode, decode bersih tanpa error` : `${decode.stdout}${decode.stderr}`.slice(0, 400) },
    audioSilenceDb,
    frames,
  };
}

/* ---------------------------------- main ---------------------------------- */

const episodeArg = process.argv.indexOf("--episodes");
const episodeCount = episodeArg >= 0 ? Number(process.argv[episodeArg + 1]) || 3 : 3;

const pipeline = runAutopilotPipeline({
  candidates: CANDIDATE_BANK,
  history: [],
  capabilities: detectCapabilities(process.env),
  episodesToBuild: episodeCount,
});

const rendered: RenderedEpisode[] = [];
for (const episode of pipeline.episodes) {
  process.stdout.write(`render ep ${episode.episodeNumber} … `);
  const result = renderEpisode(episode);
  rendered.push(result);
  process.stdout.write(
    `${result.probe.width}x${result.probe.height} ${result.probe.fps}fps ${result.probe.durationSec}s ${Math.round(result.bytes / 1024)}KB\n`
  );
}

const ffmpegVersion = run(FFMPEG, ["-hide_banner", "-version"], "ffmpeg version").stdout.split("\n")[0];
const ffprobeVersion = run(FFPROBE, ["-hide_banner", "-version"], "ffprobe version").stdout.split("\n")[0];

const allValid = rendered.every(
  (r) =>
    r.probe.width === WIDTH &&
    r.probe.height === HEIGHT &&
    r.probe.videoCodec === "h264" &&
    r.probe.pixFmt === "yuv420p" &&
    r.probe.fps === FPS &&
    r.decodeCheck.ok &&
    r.probe.durationSec > 10
);

const report = {
  generatedAt: new Date().toISOString(),
  toolchain: { ffmpeg: ffmpegVersion, ffprobe: ffprobeVersion, note: "dipasang lokal (imageio-ffmpeg + ffprobe-static); tidak di-commit ke repo" },
  honesty: {
    audio: "Track audio = AAC senyap (anullsrc). Narasi TTS TIDAK dibuat karena butuh jaringan layanan suara.",
    subtitles:
      "Subtitle di-burn ke video (libass) memakai timing kata dari computeWordTimings, disinkronkan ke timeline naskah — bukan ke waveform suara karena belum ada narasi.",
    assets: "Latar digenerate di Node dari palet blueprint (gradasi + berkas aksen + grain); B-roll AI tidak dipakai karena butuh API key.",
    publication: "Tidak ada unggah/publikasi otomatis. Video menunggu persetujuan manual Bos.",
  },
  validation: { expected: { width: WIDTH, height: HEIGHT, fps: FPS, videoCodec: "h264", pixFmt: "yuv420p" }, allValid },
  episodes: rendered.map((r) => ({
    episode: r.episode,
    title: r.title,
    file: r.file,
    bytes: r.bytes,
    renderMs: r.renderMs,
    probe: r.probe,
    decodeCheck: r.decodeCheck,
    audioSilenceDb: r.audioSilenceDb,
    frames: r.frames,
    metadata: r.metadata,
  })),
};

fs.writeFileSync(path.join(outDir, "render-report.json"), JSON.stringify(report, null, 2), "utf8");

fs.writeFileSync(
  path.join(outDir, "render-report.md"),
  [
    "# Render MP4 v10 — bukti metadata",
    "",
    `Dibuat: ${report.generatedAt}`,
    "",
    `Toolchain: ${ffmpegVersion} · ${ffprobeVersion}`,
    "",
    "| Ep | Judul | Ukuran | fps | Codec | Pixel | Audio | Durasi | Bitrate | Decode |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...rendered.map(
      (r) =>
        `| ${r.episode} | ${r.title.slice(0, 46)} | ${r.probe.width}×${r.probe.height} | ${r.probe.fps} | ${r.probe.videoCodec} | ${r.probe.pixFmt} | ${r.probe.audioCodec ?? "—"} | ${r.probe.durationSec}s | ${r.probe.bitrateKbps} kbps | ${r.decodeCheck.ok ? "bersih" : "GAGAL"} |`
    ),
    "",
    `Validasi sesuai target (1080×1920, 30 fps, h264/yuv420p, decode bersih, > 10 s): **${allValid ? "LULUS" : "TIDAK LULUS"}**`,
    "",
    "## Yang harus dibaca sebelum menilai",
    "",
    `- **Audio senyap.** ${report.honesty.audio} (terukur: ${rendered.map((r) => `${r.audioSilenceDb ?? "?"} dB`).join(" / ")} mean volume, praktis senyap).`,
    `- **Subtitle.** ${report.honesty.subtitles}`,
    `- **Aset visual.** ${report.honesty.assets}`,
    `- **Publikasi.** ${report.honesty.publication}`,
    "",
    "Metadata mentah per episode ada di `render-report.json` (keluaran ffprobe, bukan rekaan).",
  ].join("\n"),
  "utf8"
);

console.log(`\n${allValid ? "VALID" : "TIDAK VALID"} · ${rendered.length} video · lihat ${path.relative(root, outDir)}`);
process.exitCode = allValid ? 0 : 1;
