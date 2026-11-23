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

function readRootPackageDependencies(): Record<string, string> {
  try {
    const rootPkg = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(rootPkg)) return {};
    const parsed = JSON.parse(fs.readFileSync(rootPkg, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    return parsed.dependencies ?? {};
  } catch {
    return {};
  }
}

function readPackageVersion(
  pkgName: string,
  rootDeps: Record<string, string>
): string | null {
  try {
    const pkgPath = path.join(process.cwd(), "node_modules", pkgName, "package.json");
    if (fs.existsSync(pkgPath)) {
      const raw = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string };
      if (raw.version) return raw.version;
    }
  } catch {
    // Fall through to root package.json check (Vercel Serverless tree-shakes client-only packages out of API Lambdas)
  }

  const declared = rootDeps[pkgName];
  if (declared) {
    return declared.replace(/^[\^~]/, "");
  }
  return null;
}

export async function GET() {
  const rootDeps = readRootPackageDependencies();
  const remotionVersion = readPackageVersion("remotion", rootDeps);
  const gsapVersion = readPackageVersion("gsap", rootDeps);
  const mp4MuxerVersion = readPackageVersion("mp4-muxer", rootDeps);
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
