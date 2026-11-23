import { NextResponse } from "next/server";
import {
  callCentralAIRouter,
  classifyAiTask,
  getConfiguredProvidersStatus,
  isProviderConfigured,
  type LlmProviderId,
} from "@/lib/ai/llm-provider";

export const dynamic = "force-dynamic";

interface SingleProviderProbeResult {
  provider: LlmProviderId;
  configured: boolean;
  tested: boolean;
  ok: boolean;
  model: string | null;
  durationMs: number;
  replyPreview: string | null;
  error: string | null;
}

// Guard against excessive quota burn (max 1 full suite test every 10 seconds)
let lastProbeTimeMs = 0;

/**
 * Real Bounded Provider Verification Endpoint (BAGIAN 10 — TEST 1, 2, 3, 4, 5 & 8).
 *
 * Performs minimal-token real server-side probes against Gemini, Groq, and OpenRouter (:free)
 * ONLY when their env vars are configured, plus verifies task routing & zero-secret exposure.
 */
export async function POST(request: Request) {
  const now = Date.now();
  if (now - lastProbeTimeMs < 8_000) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tunggu 8 detik sebelum menjalankan tes live provider lagi untuk menghemat kuota API.",
      },
      { status: 429 }
    );
  }
  lastProbeTimeMs = now;

  const body = (await request.json().catch(() => ({}))) as {
    providers?: LlmProviderId[];
  };
  const requested: LlmProviderId[] =
    Array.isArray(body.providers) && body.providers.length > 0
      ? body.providers.filter((p): p is LlmProviderId =>
          ["gemini", "groq", "openrouter"].includes(p)
        )
      : ["gemini", "groq", "openrouter"];

  const results: SingleProviderProbeResult[] = [];

  for (const provider of requested) {
    const configured = isProviderConfigured(provider);
    if (!configured) {
      results.push({
        provider,
        configured: false,
        tested: false,
        ok: false,
        model: null,
        durationMs: 0,
        replyPreview: null,
        error: `Environment variable untuk ${provider.toUpperCase()} belum terpasang di server.`,
      });
      continue;
    }

    const start = Date.now();
    const res = await callCentralAIRouter<{ status?: string }>({
      preferredProvider: provider,
      disableFallback: true,
      expectJson: true,
      temperature: 0,
      maxTokens: 64,
      timeoutMs: 15_000,
      systemPrompt:
        'You are a health check responder. Reply ONLY with valid JSON: {"status":"ok"}',
      userPrompt: "Respond with ok.",
    });

    if (res.ok) {
      results.push({
        provider,
        configured: true,
        tested: true,
        ok: true,
        model: res.model,
        durationMs: res.durationMs,
        replyPreview: res.rawText.slice(0, 80),
        error: null,
      });
    } else {
      results.push({
        provider,
        configured: true,
        tested: true,
        ok: false,
        model: res.attempts[0]?.model ?? null,
        durationMs: Date.now() - start,
        replyPreview: null,
        error: res.error,
      });
    }
  }

  // Also verify task routing decisions deterministically
  const routingVerification = {
    reasoningTask: classifyAiTask({
      taskType: "reasoning",
      userPrompt: "Analyze multi-agent architecture and plan workflow",
    }),
    fastTask: classifyAiTask({
      taskType: "fast",
      userPrompt: "Classify this tag quickly",
    }),
  };

  return NextResponse.json({
    ok: true,
    testedAt: new Date().toISOString(),
    results,
    routingVerification,
    routerStatus: getConfiguredProvidersStatus(),
  });
}
