import assert from "node:assert/strict";
import {
  MODULAR_AGENT_SKILLS,
  invokeAgentSkill,
  resolveSkillsWithRuntime,
  type RuntimeCapabilityProbe,
} from "../src/lib/ai/advanced-skill-registry.ts";
import { getHindsightStatus } from "../src/lib/ai/hindsight-memory.ts";
import {
  rankTrendTopics,
  scoreTrendTopic,
} from "../src/lib/ai/trend-intelligence.ts";
import { evaluateGsapSceneTimeline } from "../src/lib/pipeline/gsap-timeline-choreographer.ts";
import { analyzePcmSilenceBounds } from "../src/lib/pipeline/auto-editor-pacing.ts";
import {
  buildFfmpegExportArgs,
  parseFfprobeJson,
} from "../src/lib/pipeline/ffmpeg-adapter.ts";
import { parseWhisperJsonToWordTimings } from "../src/lib/pipeline/whisper-adapter.ts";
import type { TrendSourceRecord } from "../src/types/pipeline.ts";

function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`  ✓ ${name}`))
    .catch((err) => {
      console.error(`  ✗ ${name}`);
      throw err;
    });
}

async function main() {
  console.log("Running Advanced AI Skills & Cinematic Video Engine V4 Tests...");

  const serverlessProbe: RuntimeCapabilityProbe = {
    checkedAt: new Date().toISOString(),
    nodeVersion: process.version,
    remotionInstalled: true,
    remotionVersion: "4.0.546",
    gsapInstalled: true,
    gsapVersion: "3.15.1",
    mp4MuxerInstalled: true,
    ffmpegBinaryAvailable: false,
    ffprobeBinaryAvailable: false,
    whisperCliAvailable: false,
    autoEditorCliAvailable: false,
    ytDlpCliAvailable: false,
    hindsightConfigured: false,
  };

  await runTest("Phase 1/2: 11 audited repos + 7 skill pack v9 tetap terdaftar", () => {
    // v9 menambah 7 skill pack (agentmemory, OpenViking, browser-use, harness,
    // cybersecurity, diagram-design, scientific) → total 18.
    assert.equal(MODULAR_AGENT_SKILLS.length, 18);
    const allRepoText = MODULAR_AGENT_SKILLS.map((s) => s.sourceRepo).join(" | ");
    for (const repo of [
      "remotion-dev/remotion",
      "greensock/gsap-skills",
      "FFmpeg/FFmpeg",
      "ggml-org/whisper.cpp",
      "wyattblue/auto-editor",
      "yt-dlp/yt-dlp",
      "vectorize-io/hindsight",
      "obra/superpowers",
      "dietrichgebert/ponytail",
      "affaan-m/ecc",
    ]) {
      assert.ok(allRepoText.includes(repo), `Missing audited repo: ${repo}`);
    }
  });

  await runTest("Phase 2: Uninstalled binaries are honestly marked worker-required / yt-dlp stays inactive", () => {
    const resolved = resolveSkillsWithRuntime(serverlessProbe);
    const remotion = resolved.find((s) => s.id === "remotion-video-composition");
    const gsapSkill = resolved.find((s) => s.id === "gsap-timeline-motion");
    const ffmpeg = resolved.find((s) => s.id === "ffmpeg-encoding-validation");
    const whisper = resolved.find((s) => s.id === "whisper-cpp-transcription");
    const ytDlp = resolved.find((s) => s.id === "yt-dlp-authorized-analysis");
    const hindsight = resolved.find((s) => s.id === "hindsight-agent-memory");

    assert.equal(remotion?.installStatus, "installed");
    assert.equal(remotion?.isActiveNow, true);
    assert.equal(gsapSkill?.installStatus, "installed");
    assert.equal(gsapSkill?.isActiveNow, true);
    assert.equal(ffmpeg?.installStatus, "worker-required");
    assert.equal(ffmpeg?.isActiveNow, false);
    assert.equal(whisper?.installStatus, "worker-required");
    assert.equal(whisper?.isActiveNow, false);
    assert.equal(ytDlp?.isActiveNow, false);
    assert.equal(hindsight?.installStatus, "worker-required");
    assert.equal(hindsight?.isActiveNow, false);
  });

  await runTest("Phase 2: Callable invokeAgentSkill returns real domain directives", () => {
    const motionResult = invokeAgentSkill("motion-graphics", serverlessProbe);
    assert.equal(motionResult.domain, "motion-graphics");
    assert.ok(motionResult.skills.length >= 1);
    assert.ok(motionResult.promptDirectives.includes("GSAP"));
  });

  await runTest("Phase 2: Hindsight adapter defaults to graceful local fallback when unset", () => {
    const prev = process.env.HINDSIGHT_API_URL;
    delete process.env.HINDSIGHT_API_URL;
    try {
      const st = getHindsightStatus();
      assert.equal(st.configured, false);
      assert.equal(st.endpointHost, null);
      assert.ok(st.note.toLowerCase().includes("standby"));
    } finally {
      if (prev) process.env.HINDSIGHT_API_URL = prev;
    }
  });

  await runTest("Phase 3: GSAP timeline choreographer scrubs deterministically across time", () => {
    const t0 = evaluateGsapSceneTimeline(0, 6);
    const tMid = evaluateGsapSceneTimeline(1.5, 6);
    const tEnd = evaluateGsapSceneTimeline(5.8, 6);

    assert.ok(t0.headlineProgress < 0.05);
    assert.ok(tMid.headlineProgress > 0.95);
    assert.ok(tMid.panelAlpha > 0.95);
    assert.ok(tMid.staggerItems[0] >= tMid.staggerItems[3] - 0.01);
    assert.ok(tEnd.parallaxX > t0.parallaxX);
    assert.ok(tMid.cameraZoom > 1.0);
  });

  await runTest("Phase 3: Auto-Editor PCM RMS detector trims leading and trailing dead silence", () => {
    const sr = 16000;
    const total = sr * 3;
    const pcm = new Float32Array(total);
    const speechStart = Math.floor(sr * 0.8);
    const speechEnd = Math.floor(sr * 2.2);
    for (let i = speechStart; i < speechEnd; i++) {
      pcm[i] = Math.sin((2 * Math.PI * 440 * i) / sr) * 0.35;
    }
    const report = analyzePcmSilenceBounds(pcm, sr, { thresholdDb: -40, marginSec: 0.06 });
    assert.ok(report.trimmedLeadingSec >= 0.7 && report.trimmedLeadingSec <= 0.82);
    assert.ok(report.trimmedTrailingSec >= 0.7 && report.trimmedTrailingSec <= 0.82);
    assert.ok(report.trimmedDurationSec < 1.65 && report.trimmedDurationSec > 1.35);
    assert.ok(report.activeSpeechRatio > 0.35);
  });

  await runTest("Phase 3/5: FFmpeg ffprobe parser extracts real video/audio metadata accurately", () => {
    const meta = parseFfprobeJson({
      format: {
        filename: "exports/test.mp4",
        format_name: "mov,mp4,m4a,3gp,3g2,mj2",
        duration: "24.50",
        size: "45937500",
        bit_rate: "15000000",
      },
      streams: [
        {
          codec_type: "video",
          codec_name: "h264",
          profile: "High",
          width: 1080,
          height: 1920,
          avg_frame_rate: "60/1",
          r_frame_rate: "60/1",
          nb_frames: "1470",
        },
        {
          codec_type: "audio",
          codec_name: "aac",
          sample_rate: "48000",
          channels: 2,
          bit_rate: "192000",
        },
      ],
    });

    assert.equal(meta.valid, true);
    assert.equal(meta.width, 1080);
    assert.equal(meta.height, 1920);
    assert.equal(meta.avgFps, 60);
    assert.equal(meta.actualBitrateMbps, 15);
    assert.equal(meta.videoCodec, "h264");
    assert.equal(meta.audioCodec, "aac");
    assert.equal(meta.hasAudio, true);

    const args = buildFfmpegExportArgs({
      width: 1080,
      height: 1920,
      fps: 60,
      audioInputPath: "/tmp/a.wav",
      outputPath: "/tmp/out.mp4",
      codec: "h264",
      targetBitrateMbps: 24,
    });
    assert.ok(args.includes("libx264"));
    assert.ok(args.includes("+faststart"));
    assert.ok(args.includes("24M"));
  });

  await runTest("Phase 3: whisper.cpp JSON token parser maps millisecond offsets to WordTimingCue[]", () => {
    const cues = parseWhisperJsonToWordTimings(
      {
        transcription: [
          {
            tokens: [
              { text: "[_BEG_]", offsets: { from: 0, to: 0 } },
              { text: "Claude", offsets: { from: 100, to: 420 } },
              { text: " Code", offsets: { from: 430, to: 760 } },
              { text: " jalan", offsets: { from: 770, to: 1120 } },
              { text: " di", offsets: { from: 1130, to: 1300 } },
              { text: " terminal", offsets: { from: 1310, to: 1850 } },
            ],
          },
        ],
      },
      0.14
    );

    assert.equal(cues.length, 5);
    assert.equal(cues[0].word, "Claude");
    assert.equal(cues[0].highlight, true);
    assert.equal(cues[0].startSec, 0.24);
    assert.equal(cues[4].word, "terminal");
    assert.equal(cues[4].highlight, true);
    assert.equal(cues[4].endSec, 1.99);
  });

  await runTest("Phase 6: 5-Factor Trend Topic Ranking ranks fresh official Claude Code release above stale item", () => {
    const officialFresh: TrendSourceRecord = {
      id: "official-1",
      title: "Claude Code CLI v2.5.0 Rilis Resmi dengan Multi-Agent Terminal Workflow",
      summary: "Rilis resmi menambahkan perintah bash dan GitHub PR otomatis.",
      sourceName: "GitHub Releases (anthropics/claude-code)",
      sourceUrl: "https://github.com/anthropics/claude-code/releases",
      publishedAt: new Date().toISOString(),
      freshnessDays: 1,
      classification: "official_release",
      verified: true,
      tags: ["claude-code", "ai-agent", "terminal"],
    };

    const olderCommunity: TrendSourceRecord = {
      id: "comm-1",
      title: "General software thoughts",
      summary: "Opinion essay without CLI demo.",
      sourceName: "Hacker News",
      sourceUrl: "https://news.ycombinator.com",
      publishedAt: new Date(Date.now() - 45 * 86400_000).toISOString(),
      freshnessDays: 45,
      classification: "community_discussion",
      verified: true,
      tags: ["opinion"],
    };

    const scoreFresh = scoreTrendTopic(officialFresh);
    const scoreOld = scoreTrendTopic(olderCommunity);
    assert.ok(scoreFresh.totalScore >= 85);
    assert.ok(scoreFresh.totalScore > scoreOld.totalScore + 40);

    const ranked = rankTrendTopics([olderCommunity, officialFresh]);
    assert.equal(ranked[0].id, "official-1");
  });

  console.log("All Advanced AI Skills V4 tests passed!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
