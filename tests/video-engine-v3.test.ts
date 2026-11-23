import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCandidateProfileLadder,
  computeAdaptiveBitrateBps,
  computeSyncedSceneDuration,
  computeWordTimings,
  evaluateActualVideoQc,
  findActiveWordIndex,
  getTikTokSafeZone,
  inspectVideoHeaderBytes,
  SPEECH_START_OFFSET_SEC,
  validateBoxInsideTikTokSafeZone,
} from "../src/lib/pipeline/video-engine-v3.ts";
import { evaluateTrendFreshness } from "../src/lib/ai/trend-intelligence.ts";

test("Audio-text sync locks scene duration to actual measured neural MP3 duration", () => {
  const synced = computeSyncedSceneDuration(3.42, 6.0);
  assert.equal(synced.speechOffsetSec, SPEECH_START_OFFSET_SEC);
  assert.equal(synced.speechDurationSec, 3.42);
  // 0.08 + 3.42 + 0.28 = 3.78s (NOT stretched to 6.0s!)
  assert.equal(synced.sceneDurationSec, 3.78);
});

test("Word-level subtitle timings span exact [speechOffset, speechOffset + speechDur] monotonically", () => {
  const narration = "Claude Code sekarang bisa baca repo, edit kode otomatis, dan cek build GitHub!";
  const speechStart = 0.08;
  const speechDur = 4.2;
  const cues = computeWordTimings(narration, speechStart, speechDur);

  assert.equal(cues.length, 13);
  assert.equal(cues[0].startSec, speechStart);
  assert.ok(Math.abs(cues[cues.length - 1].endSec - (speechStart + speechDur)) <= 0.02);

  for (let i = 0; i < cues.length; i++) {
    assert.ok(cues[i].endSec > cues[i].startSec, `word ${i} end > start`);
    if (i > 0) {
      assert.ok(cues[i].startSec >= cues[i - 1].endSec - 0.002, `monotonic boundary ${i}`);
    }
  }

  // Tech keywords should be auto-flagged for dynamic emphasis
  assert.equal(cues[0].highlight, true); // Claude
  assert.equal(cues[1].highlight, true); // Code
  assert.equal(cues[12].highlight, true); // GitHub!

  // Active word lookup tracks exact audio clock
  assert.equal(findActiveWordIndex(cues, 0.05), 0);
  assert.equal(findActiveWordIndex(cues, speechStart + speechDur - 0.01), cues.length - 1);
});

test("TikTok 9:16 Safe Zone clears top nav, right buttons rail, and bottom caption bar at 4K", () => {
  const w = 2160;
  const h = 3840;
  const safe = getTikTokSafeZone(w, h);

  assert.ok(safe.left >= w * 0.055);
  assert.ok(safe.right <= w * 0.87, "clears right TikTok icon buttons");
  assert.ok(safe.top >= h * 0.11, "clears top TikTok nav");
  assert.ok(safe.bottom <= h * 0.80, "clears bottom TikTok handle/caption");
  assert.ok(safe.subtitleY > safe.stageBottom && safe.subtitleY < safe.bottom);

  const goodBox = validateBoxInsideTikTokSafeZone(
    { x: safe.left + 10, y: safe.top + 10, w: safe.width - 20, h: safe.height - 20 },
    w,
    h
  );
  assert.equal(goodBox.pass, true);

  const badBox = validateBoxInsideTikTokSafeZone(
    { x: safe.left, y: safe.top, w: w * 0.92, h: 400 },
    w,
    h
  );
  assert.equal(badBox.pass, false);
  assert.ok(badBox.violations.some((v) => v.includes("tombol kanan TikTok")));
});

test("Extreme Quality profile ladder orders 4K -> 2K -> 1080p with realistic adaptive bitrates", () => {
  const ultraDesktop = buildCandidateProfileLadder("ultra", false);
  assert.equal(ultraDesktop[0].width, 2160);
  assert.equal(ultraDesktop[0].height, 3840);
  assert.equal(ultraDesktop[0].fps, 120);
  assert.equal(ultraDesktop[0].bitrateBps, 100_000_000);

  const has2K = ultraDesktop.some((p) => p.width === 1440 && p.height === 2560);
  const hasFhd = ultraDesktop.some((p) => p.width === 1080 && p.height === 1920);
  assert.equal(has2K, true);
  assert.equal(hasFhd, true);

  // Android mobile guard avoids unplayable 4K@120fps OOM while still targeting highest safe tier
  const ultraAndroid = buildCandidateProfileLadder("ultra", true);
  assert.ok(ultraAndroid.every((p) => p.fps <= 60));

  // Adaptive bitrate caps match spec (4K <= 100M, 2K <= 60M, FHD <= 30M)
  assert.ok(computeAdaptiveBitrateBps(2160, 3840, 120, "ultra") <= 100_000_000);
  assert.ok(computeAdaptiveBitrateBps(1440, 2560, 60, "high") <= 60_000_000);
  assert.ok(computeAdaptiveBitrateBps(1080, 1920, 60, "balanced") <= 30_000_000);
});

test("Container header inspector validates MP4 ftyp, WebM EBML, and rejects corrupt bytes", () => {
  const mp4Header = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 2, 0]);
  const resMp4 = inspectVideoHeaderBytes(mp4Header);
  assert.equal(resMp4.valid, true);
  assert.equal(resMp4.container, "mp4");

  const webmHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0, 0, 0, 0, 0, 0, 0]);
  const resWebm = inspectVideoHeaderBytes(webmHeader);
  assert.equal(resWebm.valid, true);
  assert.equal(resWebm.container, "webm");

  const garbage = new Uint8Array(16).fill(0x00);
  const resBad = inspectVideoHeaderBytes(garbage);
  assert.equal(resBad.valid, false);
  assert.equal(resBad.container, "unknown");
});

test("Actual QC telemetry flags below-target fallback honestly and recommends appropriate preset", () => {
  const qc = evaluateActualVideoQc({
    requestedPreset: "ultra",
    targetWidth: 2160,
    targetHeight: 3840,
    targetFps: 60,
    targetBitrateMbps: 100,
    actualWidth: 1080,
    actualHeight: 1920,
    actualFps: 60,
    actualCodec: "H.264 High@L4.2",
    actualContainer: "mp4",
    actualBitrateMbps: 22.4,
    actualDurationSec: 32.5,
    actualFileSizeBytes: 91_000_000,
    hasAudioTrack: true,
    audioCodec: "AAC-LC 48kHz Stereo",
    avSyncDeltaMs: 0,
    encodedFrames: 1950,
    droppedFrames: 0,
    blackFrameCount: 0,
    visualClippingWarnings: 0,
    subtitleClippingWarnings: 0,
    safeZoneTikTokPass: true,
    brollAvailability: "vector_procedural_hd",
    renderErrorCount: 0,
    fileIntegrityPass: true,
    fileHeaderMagic: "00 00 00 18 66 74 79 70",
    encoderPath: "webcodecs-mp4",
    fallbackReason: null,
    renderedAt: new Date().toISOString(),
  });

  assert.equal(qc.recommendedPresetIfBelowTarget, "balanced");
  assert.ok(qc.warnings.some((w) => w.includes("Resolusi aktual (1080×1920)")));
});

test("Trend Intelligence freshness check rejects stale news and unverified sources", () => {
  const now = Date.parse("2026-11-22T00:00:00Z");

  const fresh = evaluateTrendFreshness(
    { publishedAt: "2026-11-18T12:00:00Z", verified: true, classification: "official_release" },
    now
  );
  assert.equal(fresh.fresh, true);
  assert.equal(fresh.warning, null);

  const stale = evaluateTrendFreshness(
    { publishedAt: "2025-05-01T00:00:00Z", verified: true, classification: "official_release" },
    now
  );
  assert.equal(stale.fresh, false);
  assert.ok(stale.warning?.includes("melebihi batas"));

  const unverified = evaluateTrendFreshness(
    { publishedAt: "2026-11-21T00:00:00Z", verified: false, classification: "unverified" },
    now
  );
  assert.equal(unverified.fresh, false);
});
