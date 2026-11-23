import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const reportPath = path.join(process.cwd(), "docs/reports/phone-cooler/render-report.json");
const assPath = path.join(process.cwd(), "docs/reports/phone-cooler/kenapa-cooler-hp-keluarkan-air.ass");

interface PhoneCoolerReport {
  video: string;
  subtitleFile: string;
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
    formatName: string;
  };
  audioLevel: { meanDb: number | null; maxDb: number | null };
  decodeCheck: { ok: boolean; detail: string };
  timeline: { index: number; id: string; startSec: number; durationSec: number; narrationSec: number }[];
  subtitleCues: number;
  honesty: Record<string, string>;
}

const hasReport = fs.existsSync(reportPath);
const report: PhoneCoolerReport | null = hasReport
  ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as PhoneCoolerReport)
  : null;

test(
  "video contoh phone cooler punya metadata yang bisa diverifikasi",
  { skip: !report && "belum ada render-report.json (jalankan npm run video:phone-cooler)" },
  () => {
    assert.ok(report);
    assert.equal(report.probe.width, 1080);
    assert.equal(report.probe.height, 1920);
    assert.equal(report.probe.fps, 30);
    assert.equal(report.probe.videoCodec, "h264");
    assert.equal(report.probe.pixFmt, "yuv420p");
    assert.equal(report.probe.audioCodec, "aac");
    assert.match(report.probe.formatName, /mp4/);
    assert.ok(report.probe.durationSec > 60 && report.probe.durationSec < 240, `durasi ${report.probe.durationSec}`);
    assert.ok(report.probe.bitrateKbps > 400 && report.probe.bitrateKbps < 8000);
    assert.equal(report.decodeCheck.ok, true, report.decodeCheck.detail);
    assert.ok(fs.existsSync(path.join(process.cwd(), report.video)), "file video tidak ada");
  }
);

test("audio video benar-benar bersuara (bukan track senyap seperti v10)", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  const mean = report.audioLevel.meanDb;
  const max = report.audioLevel.maxDb;
  assert.ok(mean !== null && mean > -30 && mean < -12, `mean volume ${mean} dB`);
  assert.ok(max !== null && max < -0.3, `puncak ${max} dB — jangan sampai clipping`);
});

test("timeline scene mengikuti durasi audio yang diukur, bukan perkiraan", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  assert.equal(report.timeline.length, 10);
  let expectedStart = 0;
  for (const [i, scene] of report.timeline.entries()) {
    assert.equal(scene.index, i + 1);
    assert.ok(Math.abs(scene.startSec - expectedStart) <= 0.05, `scene ${i + 1} mulai ${scene.startSec}, harusnya ${expectedStart}`);
    // durasi scene = narasi + jeda 0,55 s, dibulatkan ke frame terdekat (33,3 ms)
    const pad = scene.durationSec - scene.narrationSec;
    assert.ok(Math.abs(pad - 0.55) <= 0.05, `padding scene ${i + 1}: ${pad.toFixed(2)} s`);
    expectedStart += scene.durationSec;
  }
  assert.ok(Math.abs(expectedStart - report.probe.durationSec) < 1.2, "total timeline vs durasi file");
});

test("subtitle ter-burn memakai waktu narasi dan menyebut sumber", { skip: !report && "belum ada laporan" }, () => {
  assert.ok(report);
  assert.ok(report.subtitleCues > 20, `cue subtitle ${report.subtitleCues}`);
  assert.ok(fs.existsSync(assPath), "file .ass tidak ada");
  const ass = fs.readFileSync(assPath, "utf8");
  assert.match(ass, /^Dialogue: 0,0:00:0/m);
  assert.ok(!/Kimia|fiktif/i.test(report.honesty.sources));
  assert.match(report.honesty.sources, /Magnus|ASUS|TEC1-12706/);
  assert.match(report.honesty.visuals, /prosedural/i);
});
