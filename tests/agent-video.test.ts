import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * Tes video "kenapa gua harus capek buat AI agent".
 * Sama seperti seri phone cooler: angka di tes dibaca dari laporan hasil render
 * (`agent-report.json`), bukan diketik manual.
 */

const reportPath = path.join(process.cwd(), "docs/reports/agent-office/agent-report.json");
const assPath = path.join(process.cwd(), "docs/reports/agent-office/kenapa-gua-capek-untuk-ai-agent.ass");

interface AgentReport {
  video: string;
  probe: {
    width: number;
    height: number;
    fps: number;
    videoCodec: string;
    pixFmt: string;
    audioCodec: string | null;
    durationSec: number;
    bitrateKbps: number;
    sizeMB: number;
  };
  audioLevel: { meanDb: number | null; maxDb: number | null };
  decodeCheck: { ok: boolean; detail: string };
  timeline: { index: number; id: string; startSec: number; durationSec: number; narrationSec: number }[];
  subtitleCues: number;
  honesty: Record<string, string>;
}

const report: AgentReport | null = fs.existsSync(reportPath)
  ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as AgentReport)
  : null;

test(
  "video AI agent ter-render minimal 1080x1920 (default 2K)",
  { skip: !report && "belum ada agent-report.json (jalankan npm run video:agent)" },
  () => {
    assert.ok(report);
    assert.ok(report.probe.width >= 1080, `lebar ${report.probe.width}`);
    assert.ok(report.probe.height >= 1920, `tinggi ${report.probe.height}`);
    assert.equal(report.probe.height, Math.round((report.probe.width * 16) / 9), "rasio harus 9:16");
    assert.equal(report.probe.fps, 30);
    assert.equal(report.probe.videoCodec, "h264");
    assert.equal(report.probe.pixFmt, "yuv420p");
    assert.equal(report.probe.audioCodec, "aac");
    assert.ok(report.probe.durationSec > 60 && report.probe.durationSec < 150, `durasi ${report.probe.durationSec}`);
    assert.ok(report.probe.bitrateKbps > 400 && report.probe.bitrateKbps < 16000);
    assert.equal(report.decodeCheck.ok, true, report.decodeCheck.detail);
    assert.ok(fs.existsSync(path.join(process.cwd(), report.video)), "file video tidak ada");
  }
);

test("audio video AI agent bersuara dan tidak clipping", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  const { meanDb, maxDb } = report.audioLevel;
  assert.ok(meanDb !== null && meanDb > -30 && meanDb < -12, `mean ${meanDb} dB`);
  assert.ok(maxDb !== null && maxDb < -0.3, `puncak ${maxDb} dB`);
});

test("8 scene AI agent, timeline mengikuti durasi narasi", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  assert.equal(report.timeline.length, 8);
  let expected = 0;
  for (const [i, scene] of report.timeline.entries()) {
    assert.equal(scene.index, i + 1);
    assert.ok(Math.abs(scene.startSec - expected) <= 0.05, `scene ${i + 1} mulai ${scene.startSec}`);
    const pad = scene.durationSec - scene.narrationSec;
    assert.ok(Math.abs(pad - 0.55) <= 0.05, `padding scene ${i + 1}: ${pad.toFixed(2)} s`);
    expected += scene.durationSec;
  }
  assert.ok(Math.abs(expected - report.probe.durationSec) < 1.2);
});

test("subtitle ter-burn ada dan laporan jujur soal sumber", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  assert.ok(report.subtitleCues > 10, `cue ${report.subtitleCues}`);
  assert.ok(fs.existsSync(assPath), "file .ass tidak ada");
  assert.match(fs.readFileSync(assPath, "utf8"), /^Dialogue: 0,0:00:0/m);
  // Sumber harus merujuk ke kode repo ini, bukan karangan.
  assert.match(report.honesty.sources, /middleware|rate-limit|secret-scan/i);
  assert.match(report.honesty.visuals, /prosedural/i);
  assert.match(report.honesty.narration, /TTS/i);
  // Video ini tanpa musik latar (konsisten dengan seri panjang).
  assert.match(report.honesty.music, /Tanpa musik/i);
});
