/**
 * VERIFIKASI video TikTok "Fajrezzz AI Office".
 * Membaca hasil ffprobe (bukan angka yang diketik manual), lalu menulis
 * docs/reports/office-tiktok/report.json + report.md.
 *
 * Pemakaian: FFPROBE_PATH=... node scripts/office-video/verify.mjs
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";
const outDir = path.join(root, "docs/reports/office-tiktok");

const FILES = {
  master: "fajrezzz-office-tiktok-master-2k120.mp4",
  tiktok: "fajrezzz-office-tiktok-1080p60.mp4",
};

function probe(file) {
  const abs = path.join(outDir, file);
  if (!fs.existsSync(abs)) throw new Error(`file tidak ada: ${path.relative(root, abs)}`);
  const raw = execFileSync(
    FFPROBE,
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", abs],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  const data = JSON.parse(raw);
  const video = data.streams.find((s) => s.codec_type === "video");
  const audio = data.streams.find((s) => s.codec_type === "audio");
  const [num, den] = String(video.r_frame_rate).split("/").map(Number);
  return {
    file,
    sizeMB: Math.round(Number(data.format.size) / 104857.6) / 10,
    durationSec: Math.round(Number(data.format.duration) * 100) / 100,
    width: video.width,
    height: video.height,
    fps: Math.round((num / den) * 1000) / 1000,
    videoCodec: video.codec_name,
    profile: video.profile,
    pixFmt: video.pix_fmt,
    bitrateKbps: Math.round(Number(data.format.bit_rate) / 1000),
    audioCodec: audio?.codec_name ?? null,
    audioSampleRate: audio ? Number(audio.sample_rate) : null,
    audioChannels: audio?.channels ?? null,
  };
}

const master = probe(FILES.master);
const tiktok = probe(FILES.tiktok);

const report = {
  generatedAt: new Date().toISOString(),
  master,
  tiktok,
  honesty: {
    screenshots:
      "Bagian 'web' memakai tangkapan layar asli aplikasi fajrezzz-ai-office.vercel.app (di-crop ke area aplikasi, tanpa address bar). Tidak ada UI, angka, atau fitur yang digambar ulang.",
    motion:
      "Tidak ada rekaman gerak asli: sandbox ini tidak punya browser/GPU dan tidak bisa mengakses *.vercel.app, jadi gerakan kamera (zoom/pan/punch-in) dan animasi teks dibuat di post, frame-per-frame 120fps.",
    voice: "Narasi = suara TTS Arena (voice-00), satu klip per bagian di assets/voice/office-tiktok/.",
    music:
      "Musik lo-fi/cyber, klik keyboard, dan whoosh disintesis sendiri di scripts/office-video/audio.mjs — tanpa sampel/lagu pihak ketiga.",
    label: 'Label "dibuat dengan AI" tampil permanen di kanan atas dan di CTA (aturan TikTok).',
    publish: "Belum diunggah ke TikTok/IG; menunggu persetujuan manual.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2), "utf8");

const md = [
  "# Video TikTok — Fajrezzz AI Office (2K 120fps)",
  "",
  `Dibuat: ${report.generatedAt}`,
  "",
  "| Item | Master 2K/120 | Versi TikTok 1080/60 |",
  "|---|---|---|",
  `| File | \`${master.file}\` | \`${tiktok.file}\` |`,
  `| Resolusi | ${master.width}×${master.height} | ${tiktok.width}×${tiktok.height} |`,
  `| FPS | ${master.fps} | ${tiktok.fps} |`,
  `| Codec | ${master.videoCodec} (${master.profile}, ${master.pixFmt}) | ${tiktok.videoCodec} (${tiktok.profile}, ${tiktok.pixFmt}) |`,
  `| Durasi | ${master.durationSec} s | ${tiktok.durationSec} s |`,
  `| Bitrate | ${master.bitrateKbps} kbps | ${tiktok.bitrateKbps} kbps |`,
  `| Ukuran | ${master.sizeMB} MB | ${tiktok.sizeMB} MB |`,
  `| Audio | ${master.audioCodec} · ${master.audioSampleRate} Hz · ${master.audioChannels} ch | ${tiktok.audioCodec} · ${tiktok.audioSampleRate} Hz · ${tiktok.audioChannels} ch |`,
  "",
  "## Yang jujur harus disebut",
  "",
  ...Object.values(report.honesty).map((v) => `- ${v}`),
].join("\n");
fs.writeFileSync(path.join(outDir, "report.md"), md, "utf8");

console.log(
  `master ${master.width}x${master.height}@${master.fps} · ${master.durationSec}s · ${master.bitrateKbps} kbps\n` +
    `tiktok ${tiktok.width}x${tiktok.height}@${tiktok.fps} · ${tiktok.durationSec}s · ${tiktok.bitrateKbps} kbps`
);
