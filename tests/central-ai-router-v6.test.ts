import assert from "node:assert/strict";
import test from "node:test";
import {
  callCentralAIRouter,
  classifyAiTask,
  getRouterTelemetrySnapshot,
  isOpenRouterFreeModel,
  OPENROUTER_FREE_MODELS,
  resetRouterRuntimeStateForTests,
  sanitizeErrorMessage,
} from "../src/lib/ai/llm-provider.ts";
import {
  isWorkspacePathAllowed,
  runAutonomousAgentWorkflow,
  safeReadWorkspaceFile,
} from "../src/lib/ai/autonomous-agent-engine.ts";
import {
  autoSelectCinematicPresetForTopic,
  FAJREZZZ_CINEMATIC_PRESETS,
  INTELLIGENT_EDITING_WORKFLOW,
  PHASE_6_TEST_VIDEO_TOPICS,
} from "../src/lib/pipeline/cinematic-presets.ts";

test("TEST 5: Central AI Router classifies complex reasoning -> Gemini and fast tasks -> Groq", () => {
  const reasoning = classifyAiTask({
    taskType: "reasoning",
    userPrompt: "Analyze multi-agent architecture and plan workflow",
  });
  assert.equal(reasoning.primaryProvider, "gemini");
  assert.equal(reasoning.fallbackChain[0], "gemini");
  assert.equal(reasoning.fallbackChain[1], "groq");
  assert.equal(reasoning.fallbackChain[2], "openrouter");

  const fast = classifyAiTask({
    taskType: "fast",
    userPrompt: "Classify this hashtag quickly",
  });
  assert.equal(fast.primaryProvider, "groq");
  assert.equal(fast.fallbackChain[0], "groq");
  assert.equal(fast.fallbackChain[1], "gemini");
  assert.equal(fast.fallbackChain[2], "openrouter");
});

test("TEST 3 & Security: OpenRouter enforces :free models by default and blocks paid models", async () => {
  for (const m of OPENROUTER_FREE_MODELS) {
    assert.equal(isOpenRouterFreeModel(m), true, `${m} must pass free check`);
  }
  assert.equal(isOpenRouterFreeModel("openai/gpt-4o"), false);
  assert.equal(isOpenRouterFreeModel("anthropic/claude-3.5-sonnet"), false);

  const blocked = await callCentralAIRouter({
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    systemPrompt: "test",
    userPrompt: "test",
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.code, "PAID_MODEL_BLOCKED");
  }
});

test("TEST 4: Fallback chain works automatically when primary provider fails (Gemini -> Groq -> OpenRouter)", async () => {
  resetRouterRuntimeStateForTests();
  const prevGemini = process.env.GEMINI_API_KEY;
  const prevGroq = process.env.GROQ_API_KEY;
  const prevOr = process.env.OPENROUTER_API_KEY;

  process.env.GEMINI_API_KEY = "test-gemini-placeholder";
  process.env.GROQ_API_KEY = "test-groq-placeholder";
  process.env.OPENROUTER_API_KEY = "test-openrouter-placeholder";

  try {
    const calledUrls: string[] = [];
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      calledUrls.push(url);

      // Fail Gemini & Groq to force fallback straight to OpenRouter (:free)
      if (url.includes("generativelanguage.googleapis.com")) {
        return new Response("Gemini unavailable", { status: 503 });
      }
      if (url.includes("api.groq.com")) {
        return new Response("Groq rate limited", { status: 429 });
      }
      if (url.includes("openrouter.ai")) {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"status":"ok","via":"openrouter-free"}' } }],
            usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Unexpected", { status: 500 });
    };

    const res = await callCentralAIRouter<{ status: string; via: string }>({
      taskType: "reasoning",
      systemPrompt: "Reply JSON",
      userPrompt: "Plan system architecture",
      expectJson: true,
      fetchImpl: mockFetch,
    });

    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.provider, "openrouter");
      assert.equal(isOpenRouterFreeModel(res.model), true);
      assert.equal(res.fallbackUsed, true);
      assert.equal(res.parsed.via, "openrouter-free");
    }

    assert.ok(calledUrls.some((u) => u.includes("generativelanguage.googleapis.com")));
    assert.ok(calledUrls.some((u) => u.includes("api.groq.com")));
    assert.ok(calledUrls.some((u) => u.includes("openrouter.ai")));

    const telemetry = getRouterTelemetrySnapshot();
    assert.ok(telemetry.totalFallbacks >= 1);
    assert.ok(telemetry.totalSuccesses >= 1);
  } finally {
    if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGemini;
    if (prevGroq === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = prevGroq;
    if (prevOr === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = prevOr;
    resetRouterRuntimeStateForTests();
  }
});

test("TEST 8: Secret sanitization strips Gemini, Groq, OpenRouter, and Bearer keys", () => {
  const sample =
    "Auth error Bearer superSecretToken123456789 key=AIzaSyDummyKeyValue12345678901234567 gsk_abcdefgh12345678901234 sk-or-v1-1234567890abcdef1234567890";
  const cleaned = sanitizeErrorMessage(sample);
  assert.ok(!cleaned.includes("superSecretToken"));
  assert.ok(!cleaned.includes("AIzaSy"));
  assert.ok(!cleaned.includes("gsk_"));
  assert.ok(!cleaned.includes("sk-or-v1-"));
});

test("TEST 6 & Security: Autonomous Agent Engine enforces sandbox and runs full PLAN -> READ -> PRODUCE -> VERIFY workflow", async () => {
  // Sandbox security checks
  assert.equal(isWorkspacePathAllowed(".env"), false);
  assert.equal(isWorkspacePathAllowed(".env.local"), false);
  assert.equal(isWorkspacePathAllowed(".git/config"), false);
  assert.equal(isWorkspacePathAllowed("../../etc/passwd"), false);
  assert.equal(isWorkspacePathAllowed("src/lib/pipeline/cinematic-presets.ts"), true);

  const denied = safeReadWorkspaceFile(".env");
  assert.equal(denied.ok, false);

  const prevGemini = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-gemini-placeholder";
  resetRouterRuntimeStateForTests();

  try {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  plan: [
                    "Audit preset visual Claude Code Tutorial",
                    "Susun hook terminal 1.8 detik",
                    "Verifikasi sinkronisasi subtitle Safe Zone",
                  ],
                  analysis:
                    "Preset Claude Code Tutorial cocok karena memakai transisi whip-left dan accent emerald.",
                  concreteOutput:
                    "Scene 1: Boot terminal Claude Code dengan hook 1.8 detik, diikuti demo live multi-file edit dan CTA interaktif.",
                  nextRecommendedAction:
                    "Teruskan storyboard ke Divisi Visual & Motion Design di Lantai 3.",
                }),
              },
            },
          ],
          usage: { prompt_tokens: 110, completion_tokens: 85, total_tokens: 195 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const report = await runAutonomousAgentWorkflow({
      agentId: "staff-03",
      taskPrompt: "Claude Code: How AI Coding Agents Work",
      fetchImpl: mockFetch,
    });

    assert.equal(report.ok, true);
    assert.equal(report.lifecycleState, "completed");
    assert.equal(report.providerUsed, "gemini");
    assert.ok(report.filesInspected.includes("src/lib/pipeline/cinematic-presets.ts"));
    assert.equal(report.selectedPreset?.id, "claude_code_tutorial");
    assert.ok(report.verificationChecks.every((c) => c.passed));
  } finally {
    if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGemini;
    resetRouterRuntimeStateForTests();
  }
});

test("Phase 2-6: 7 Fajrezzz Cinematic Presets (v9 menambah zine_glitch_editorial), 7-Agent Workflow & 3 Test Topics match cleanly", () => {
  assert.equal(FAJREZZZ_CINEMATIC_PRESETS.length, 7);
  assert.equal(INTELLIGENT_EDITING_WORKFLOW.length, 7);
  assert.equal(PHASE_6_TEST_VIDEO_TOPICS.length, 3);

  assert.equal(
    autoSelectCinematicPresetForTopic("The Future of AI Agents").id,
    "cinematic_ai_documentary"
  );
  assert.equal(
    autoSelectCinematicPresetForTopic("Claude Code: How AI Coding Agents Work").id,
    "claude_code_tutorial"
  );
  assert.equal(
    autoSelectCinematicPresetForTopic("Inside a Multi-Agent AI Office").id,
    "ai_agent_explainer"
  );
});
