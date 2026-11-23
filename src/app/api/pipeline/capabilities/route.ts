import { NextResponse } from "next/server";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getHindsightStatus } from "@/lib/ai/hindsight-memory";
import {
  resolveSkillsWithRuntime,
  type RuntimeCapabilityProbe,
} from "@/lib/ai/advanced-skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasBinary(binName: string): boolean {
  try {
    const res = spawnSync("which", [binName], {
      encoding: "utf8",
      timeout: 1500,
    });
    return res.status === 0 && Boolean(res.stdout?.trim());
  } catch {
    return false;
  }
}

function readPackageVersion(pkgName: string): string | null {
  try {
    const pkgPath = path.join(process.cwd(), "node_modules", pkgName, "package.json");
    if (!fs.existsSync(pkgPath)) return null;
    const raw = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string };
    return raw.version ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const remotionVersion = readPackageVersion("remotion");
  const gsapVersion = readPackageVersion("gsap");
  const mp4MuxerVersion = readPackageVersion("mp4-muxer");
  const hindsight = getHindsightStatus();

  const probe: RuntimeCapabilityProbe = {
    checkedAt: new Date().toISOString(),
    nodeVersion: process.version,
    remotionInstalled: Boolean(remotionVersion),
    remotionVersion,
    gsapInstalled: Boolean(gsapVersion),
    gsapVersion,
    mp4MuxerInstalled: Boolean(mp4MuxerVersion),
    ffmpegBinaryAvailable: hasBinary("ffmpeg"),
    ffprobeBinaryAvailable: hasBinary("ffprobe"),
    whisperCliAvailable: hasBinary("whisper-cli") || hasBinary("whisper"),
    autoEditorCliAvailable: hasBinary("auto-editor"),
    ytDlpCliAvailable: hasBinary("yt-dlp"),
    hindsightConfigured: hindsight.configured,
  };

  const skills = resolveSkillsWithRuntime(probe);
  return NextResponse.json({
    ok: true,
    probe,
    hindsight,
    skills,
    activeCount: skills.filter((s) => s.isActiveNow).length,
    totalCount: skills.length,
  });
}
