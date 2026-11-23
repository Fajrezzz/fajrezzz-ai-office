import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const reportPath = path.join(process.cwd(), "docs/reports/studio-v10-mp4/render-report.json");

interface RenderReport {
  toolchain: { ffmpeg: string; ffprobe: string };
  validation: { allValid: boolean; expected: Record<string, unknown> };
  honesty: Record<string, string>;
  episodes: {
    episode: number;
    file: string;
    bytes: number;
    probe: {
      width: number;
      height: number;
      fps: number;
      videoCodec: string;
      pixFmt: string;
      audioCodec: string | null;
      durationSec: number;
      bitrateKbps: number;
      faststart: boolean;
    };
    decodeCheck: { ok: boolean; detail: string };
    audioSilenceDb: number | null;
    frames: string[];
    metadata: {
      streams: { codec_type: string; codec_name: string; width?: number; height?: number }[];
      format: { format_name: string; duration: string };
    };
  }[];
}

const hasReport = fs.existsSync(reportPath);
const report: RenderReport | null = hasReport
  ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as RenderReport)
  : null;

test("3 video ter-render dengan metadata yang bisa diverifikasi", { skip: !report && "belum ada render-report.json (jalankan npm run studio:render)" }, () => {
  assert.ok(report);
  assert.equal(report.episodes.length, 3);
  for (const episode of report.episodes) {
    const p = episode.probe;
    assert.equal(p.width, 1080, `ep ${episode.episode}: lebar`);
    assert.equal(p.height, 1920, `ep ${episode.episode}: tinggi`);
    assert.equal(p.fps, 30);
    assert.equal(p.videoCodec, "h264");
    assert.equal(p.pixFmt, "yuv420p");
    assert.equal(p.audioCodec, "aac");
    assert.ok(p.durationSec > 10 && p.durationSec < 70, `durasi ${p.durationSec}`);
    assert.ok(p.bitrateKbps > 300 && p.bitrateKbps < 8000, `bitrate ${p.bitrateKbps}`);
    assert.equal(p.faststart, true);
    assert.equal(episode.decodeCheck.ok, true, episode.decodeCheck.detail);
    assert.ok(fs.existsSync(path.join(process.cwd(), episode.file)), `file ${episode.file} tidak ada`);
    assert.ok(episode.bytes > 100_000, "file terlalu kecil untuk video nyata");
    assert.ok(episode.audioSilenceDb !== null && episode.audioSilenceDb <= -90, `audio harus senyap, dapat ${episode.audioSilenceDb} dB`);
  }
});

test("ffprobe benar-benar dipanggil dan formatnya MP4", { skip: !report && "belum ada render-report.json" }, () => {
  assert.ok(report);
  assert.match(report.toolchain.ffmpeg, /ffmpeg version/i);
  assert.match(report.toolchain.ffprobe, /ffprobe version/i);
  for (const episode of report.episodes) {
    const video = episode.metadata.streams.find((s) => s.codec_type === "video");
    const audio = episode.metadata.streams.find((s) => s.codec_type === "audio");
    assert.ok(video && audio, "stream video & audio harus ada");
    assert.match(episode.metadata.format.format_name, /mp4/);
    assert.equal(Math.round(Number(episode.metadata.format.duration)), Math.round(episode.probe.durationSec));
  }
});

test("laporan render menyatakan keterbatasan audio/subtitle secara eksplisit", { skip: !report && "belum ada render-report.json" }, () => {
  assert.ok(report);
  assert.equal(report.validation.allValid, true);
  assert.match(report.honesty.audio, /senyap/i);
  assert.match(report.honesty.subtitles, /timeline naskah/i);
  assert.match(report.honesty.publication, /menunggu persetujuan/i);
  for (const episode of report.episodes) {
    assert.ok(episode.frames.length >= 2);
    for (const frame of episode.frames) {
      assert.ok(fs.existsSync(path.join(process.cwd(), frame)), `frame ${frame} tidak ada`);
    }
  }
});

test("tidak ada klaim resolusi/fps di luar metadata", { skip: !report && "belum ada render-report.json" }, () => {
  assert.ok(report);
  const distinctFps = new Set(report.episodes.map((e) => e.probe.fps));
  const distinctRes = new Set(report.episodes.map((e) => `${e.probe.width}x${e.probe.height}`));
  assert.deepEqual([...distinctFps], [30]);
  assert.deepEqual([...distinctRes], ["1080x1920"]);
});
