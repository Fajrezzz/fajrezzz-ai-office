import { NextResponse } from "next/server";
import { runAutonomousAgentWorkflow } from "@/lib/ai/autonomous-agent-engine";
import { ACTIVE_EMPLOYEE_ROSTER } from "@/lib/config/team-roster";

export const dynamic = "force-dynamic";

// Lightweight server-side rate limiter (max 10 runs / minute per process window)
const recentRunTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_RUNS = 10;

export async function POST(request: Request) {
  try {
    const now = Date.now();
    while (
      recentRunTimestamps.length > 0 &&
      now - recentRunTimestamps[0] > RATE_LIMIT_WINDOW_MS
    ) {
      recentRunTimestamps.shift();
    }
    if (recentRunTimestamps.length >= RATE_LIMIT_MAX_RUNS) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rate limit tercapai (maksimal 10 eksekusi autonomous agent per menit). Tunggu sebentar.",
        },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      agentId?: string;
      taskPrompt?: string;
      targetFiles?: string[];
    };

    const taskPrompt = String(body.taskPrompt ?? "").trim();
    if (taskPrompt.length < 6 || taskPrompt.length > 600) {
      return NextResponse.json(
        {
          ok: false,
          error: "taskPrompt wajib diisi (6–600 karakter).",
        },
        { status: 400 }
      );
    }

    const validIds = new Set(ACTIVE_EMPLOYEE_ROSTER.map((e) => e.id));
    const agentId =
      body.agentId && validIds.has(body.agentId) ? body.agentId : "staff-01";

    recentRunTimestamps.push(now);

    const report = await runAutonomousAgentWorkflow({
      agentId,
      taskPrompt,
      targetFiles: Array.isArray(body.targetFiles)
        ? body.targetFiles.map(String).slice(0, 3)
        : undefined,
    });

    return NextResponse.json(report, { status: report.ok ? 200 : 502 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal menjalankan Autonomous Agent Engine.",
      },
      { status: 500 }
    );
  }
}
