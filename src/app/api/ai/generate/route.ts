import { NextResponse } from "next/server";
import { callFreeTierLLM, type AiTaskType, type LlmProviderId } from "@/lib/ai/llm-provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      systemPrompt?: string;
      userPrompt?: string;
      expectJson?: boolean;
      temperature?: number;
      maxTokens?: number;
      taskType?: AiTaskType;
      preferredProvider?: LlmProviderId;
    };

    const systemPrompt = body.systemPrompt?.trim() ?? "";
    const userPrompt = body.userPrompt?.trim() ?? "";

    if (!userPrompt) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_REQUEST",
          error: "Field userPrompt wajib diisi.",
        },
        { status: 400 }
      );
    }

    const result = await callFreeTierLLM({
      taskType: body.taskType ?? "auto",
      preferredProvider: body.preferredProvider,
      systemPrompt:
        systemPrompt ||
        "Anda adalah asisten produksi konten profesional berbahasa Indonesia. Balas hanya dalam JSON valid.",
      userPrompt,
      expectJson: body.expectJson ?? true,
      temperature:
        typeof body.temperature === "number" ? body.temperature : 0.7,
      maxTokens:
        typeof body.maxTokens === "number"
          ? Math.min(4000, Math.max(200, body.maxTokens))
          : 2000,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.httpStatus });
    }

    return NextResponse.json({
      ok: true,
      data: result.parsed,
      meta: {
        provider: result.provider,
        model: result.model,
        durationMs: result.durationMs,
        usage: result.usage,
        estimatedCostUsd: result.estimatedCostUsd,
        tier: result.tier,
        attempts: result.attempts,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan pada proxy AI server.",
      },
      { status: 500 }
    );
  }
}
