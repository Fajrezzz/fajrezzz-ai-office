import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * Tes video TikTok "Fajrezzz AI Office" (2K 120fps + versi 1080p60).
 * Semua angka dibaca dari docs/reports/office-tiktok/report.json hasil `ffprobe`
 * (scripts/office-video/verify.mjs), bukan diketik manual.
 */

const dir = path.join(process.cwd(), "docs/reports/office-tiktok");
const reportPath = path.join(dir, "report.json");
const captionPath = path.join(dir, "caption.md");

interface Probe {
  file: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  videoCodec: string;
  pixFmt: string;
  bitrateKbps: number;
  audioCodec: string | null;
  audioSampleRate: number | null;
  audioChannels: number | null;
  sizeMB: number;
}

interface TikTokReport {
  master: Probe;
  tiktok: Probe;
  honesty: Record<string, string>;
}

const report: TikTokReport | null = fs.existsSync(reportPath)
  ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as TikTokReport)
  : null;
const skip = !report && "belum ada report.json (jalankan npm run video:office-tiktok)";

test("master 2K 120fps: resolusi, fps, codec, durasi", { skip }, () => {
  assert.ok(report);
  const m = report.master;
  assert.equal(m.width, 1440);
  assert.equal(m.height, 2560);
  assert.equal(m.fps, 120, `fps master ${m.fps}`);
  assert.equal(m.videoCodec, "h264");
  assert.equal(m.pixFmt, "yuv420p");
  assert.ok(m.durationSec >= 25 && m.durationSec <= 30.5, `durasi ${m.durationSec}`);
  assert.ok(m.bitrateKbps >= 25000, `bitrate ${m.bitrateKbps} kbps < 25 Mbps`);
});

test("master punya audio AAC 48 kHz stereo yang benar-benar ter-mux", { skip }, () => {
  assert.ok(report);
  const m = report.master;
  assert.equal(m.audioCodec, "aac");
  assert.equal(m.audioSampleRate, 48000);
  assert.equal(m.audioChannels, 2);
  assert.ok(m.sizeMB > 40, `ukuran ${m.sizeMB} MB`);
});

test("versi TikTok 1080x1920 60fps siap unggah", { skip }, () => {
  assert.ok(report);
  const t = report.tiktok;
  assert.equal(t.width, 1080);
  assert.equal(t.height, 1920);
  assert.equal(t.height, Math.round((t.width * 16) / 9), "rasio harus 9:16");
  assert.equal(t.fps, 60);
  assert.equal(t.videoCodec, "h264");
  assert.ok(t.durationSec >= 25 && t.durationSec <= 30.5, `durasi ${t.durationSec}`);
  assert.ok(t.bitrateKbps >= 6000 && t.bitrateKbps <= 20000, `bitrate ${t.bitrateKbps} kbps`);
  assert.equal(t.audioCodec, "aac");
});

test("file video yang dilaporkan benar-benar ada di repo", { skip }, () => {
  assert.ok(report);
  assert.ok(fs.existsSync(path.join(dir, report.tiktok.file)), "versi TikTok harus di-commit");
  assert.ok(fs.existsSync(path.join(dir, "README.md")), "README batasan jujur harus ada");
});

test("caption + 5 hashtag + label AI ada", () => {
  assert.ok(fs.existsSync(captionPath), "caption.md tidak ada");
  const caption = fs.readFileSync(captionPath, "utf8");
  const tags = caption.match(/#[A-Za-z0-9_]+/g) ?? [];
  assert.equal(new Set(tags).size, 5, `hashtag unik: ${[...new Set(tags)].join(" ")}`);
  assert.match(caption.toLowerCase(), /dibuat dengan ai/);
  assert.match(caption, /KANTOR/);
});

test("laporan menyebut batasan secara terbuka (tanpa klaim rekaman live)", { skip }, () => {
  assert.ok(report);
  const honest = Object.values(report.honesty).join(" ").toLowerCase();
  assert.match(honest, /tangkapan layar/);
  assert.match(honest, /tidak ada rekaman gerak/);
  assert.match(honest, /tts/);
  assert.ok(!/screen.?record(ing)? asli/i.test(honest.replace(/tidak ada rekaman gerak/g, "")));
});
