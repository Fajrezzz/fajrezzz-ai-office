/**
 * Server-side ONLY Free-Tier LLM Router with automatic rate-limit & error fallback.
 *
 * Verified 2026 Free Providers (Rp 0 — NO credit card required):
 *  1. Groq (GROQ_API_KEY, optional speed upgrade): llama-3.3-70b-versatile & llama-3.1-8b-instant
 *  2. Google Gemini API (GEMINI_API_KEY, optional): gemini-2.5-flash & gemini-2.5-flash-lite
 *  3. OpenRouter Free (OPENROUTER_API_KEY, optional): openrouter/free & llama-3.3-70b-instruct:free
 *  4. Mistral Free Mode (MISTRAL_API_KEY, optional): mistral-small-latest
 *  5. Pollinations.AI Keyless Free Lane (ALWAYS ACTIVE — ZERO API KEY NEEDED, Rp 0):
 *     POST https://text.pollinations.ai/openai/chat/completions (models: openai-fast, gpt-oss-20b)
 *
 * API keys are ONLY read from server environment variables (`process.env`).
 * Never import this file in client components.
 */

export type LlmProviderId =
  | "groq"
  | "gemini"
  | "openrouter"
  | "mistral"
  | "pollinations";

export interface ProviderAttempt {
  provider: LlmProviderId;
  model: string;
  ok: boolean;
  status?: number;
  durationMs: number;
  error?: string;
  rateLimited?: boolean;
}

export interface LlmTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmCallResult<T = unknown> {
  ok: true;
  rawText: string;
  parsed: T;
  provider: LlmProviderId;
  model: string;
  durationMs: number;
  usage: LlmTokenUsage;
  /** $0 on verified free-tier & keyless public lane */
  estimatedCostUsd: number;
  tier: "free-tier";
  attempts: ProviderAttempt[];
}

export interface LlmCallError {
  ok: false;
  code:
    | "ALL_PROVIDERS_RATE_LIMITED"
    | "ALL_PROVIDERS_FAILED"
    | "INVALID_JSON_RESPONSE";
  error: string;
  hint: string;
  httpStatus: number;
  attempts: ProviderAttempt[];
}

export interface ProviderConfigStatus {
  id: LlmProviderId;
  label: string;
  envVar: string | null;
  configured: boolean;
  keyless: boolean;
  freeTierSummary: string;
  models: string[];
}

interface ProviderTarget {
  provider: LlmProviderId;
  label: string;
  envVar: string | null;
  keyless?: boolean;
  endpoint: string;
  models: string[];
  extraHeaders?: Record<string, string>;
}

const PROVIDER_TARGETS: ProviderTarget[] = [
  {
    provider: "groq",
    label: "Groq Cloud (Free Tier)",
    envVar: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  {
    provider: "gemini",
    label: "Google Gemini API (Free Tier)",
    envVar: "GEMINI_API_KEY",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
  },
  {
    provider: "openrouter",
    label: "OpenRouter (:free Models)",
    envVar: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: ["openrouter/free", "meta-llama/llama-3.3-70b-instruct:free"],
    extraHeaders: {
      "HTTP-Referer": "https://fajrezzz-ai-office.vercel.app",
      "X-Title": "FAJREZZZ AI Office",
    },
  },
  {
    provider: "mistral",
    label: "Mistral AI (Free Mode)",
    envVar: "MISTRAL_API_KEY",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    models: ["mistral-small-latest"],
  },
  {
    provider: "pollinations",
    label: "Pollinations AI (Gratis Tanpa API Key)",
    envVar: null,
    keyless: true,
    endpoint: "https://text.pollinations.ai/openai/chat/completions",
    models: ["openai-fast", "openai", "mistral"],
  },
];

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FREE_TIER_SUMMARIES: Record<LlmProviderId, string> = {
  groq: "Gratis tanpa kartu kredit: 30 req/menit, hingga 1.000–14.400 req/hari (opsional untuk lebih cepat)",
  gemini: "Gratis tanpa kartu kredit pada seri Gemini Flash & Flash-Lite",
  openrouter: "Gratis pada model :free (20 req/menit, 50 req/hari)",
  mistral: "Free Experiment mode tanpa kartu kredit",
  pollinations:
    "100% Gratis Rp 0 tanpa daftar & tanpa API key (jalur publik ~1 req/15 detik, langsung aktif!)",
};

export function getConfiguredProvidersStatus(): {
  anyConfigured: boolean;
  configuredCount: number;
  hasPrivateFreeKey: boolean;
  activeLabel: string;
  providers: ProviderConfigStatus[];
  pricingNotice: string;
} {
  const providers: ProviderConfigStatus[] = PROVIDER_TARGETS.map((t) => ({
    id: t.provider,
    label: t.label,
    envVar: t.envVar,
    configured: Boolean(t.keyless || (t.envVar && process.env[t.envVar]?.trim())),
    keyless: Boolean(t.keyless),
    freeTierSummary: FREE_TIER_SUMMARIES[t.provider],
    models: t.models,
  }));

  const configuredCount = providers.filter((p) => p.configured).length;
  const privateKeys = providers.filter((p) => !p.keyless && p.configured);
  const activeLabel =
    privateKeys.length > 0
      ? `${privateKeys.map((p) => p.id.toUpperCase()).join("+")} + Pollinations`
      : "Pollinations Free (Rp 0)";

  return {
    anyConfigured: true,
    configuredCount,
    hasPrivateFreeKey: privateKeys.length > 0,
    activeLabel,
    providers,
    pricingNotice:
      "Gratis Rp 0 langsung jalan tanpa kartu kredit memakai Pollinations AI (jalur publik gratis), dengan fallback otomatis ke Groq / Gemini / OpenRouter gratis jika API key dipasang di Vercel.",
  };
}

function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }
  return trimmed;
}

export interface CallFreeTierLlmOptions {
  systemPrompt: string;
  userPrompt: string;
  expectJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export async function callFreeTierLLM<T = unknown>(
  options: CallFreeTierLlmOptions
): Promise<LlmCallResult<T> | LlmCallError> {
  const {
    systemPrompt,
    userPrompt,
    expectJson = true,
    temperature = 0.7,
    maxTokens = 2200,
    timeoutMs = 32000,
  } = options;

  const activeTargets = PROVIDER_TARGETS.filter(
    (t) => t.keyless || (t.envVar && Boolean(process.env[t.envVar]?.trim()))
  );

  const attempts: ProviderAttempt[] = [];
  let sawRateLimit = false;
  let lastParseError: string | null = null;

  for (const target of activeTargets) {
    const apiKey = target.envVar ? process.env[target.envVar]?.trim() ?? "" : "";

    for (let mIdx = 0; mIdx < target.models.length; mIdx += 1) {
      const model = target.models[mIdx];
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const bodyPayload: Record<string, unknown> = {
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        };

        if (target.provider === "pollinations") {
          bodyPayload.seed = Math.floor(Math.random() * 900000) + 100000;
        }

        if (
          expectJson &&
          (target.provider === "groq" ||
            target.provider === "gemini" ||
            target.provider === "mistral" ||
            target.provider === "pollinations")
        ) {
          bodyPayload.response_format = { type: "json_object" };
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(target.extraHeaders ?? {}),
        };
        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
        }

        const res = await fetch(target.endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        const durationMs = Date.now() - start;

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const shortErr = errText.slice(0, 220) || res.statusText;
          const isRateLimit = res.status === 429;
          if (isRateLimit) sawRateLimit = true;

          attempts.push({
            provider: target.provider,
            model,
            ok: false,
            status: res.status,
            durationMs,
            rateLimited: isRateLimit,
            error: `HTTP ${res.status}: ${shortErr}`,
          });

          // For keyless public endpoints, wait briefly before trying next model so 429/502 clears
          if (target.keyless && (res.status === 429 || res.status >= 500) && mIdx < target.models.length - 1) {
            await sleepMs(4500);
          }
          continue;
        }

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        };

        const rawText = json.choices?.[0]?.message?.content?.trim() ?? "";
        if (!rawText) {
          attempts.push({
            provider: target.provider,
            model,
            ok: false,
            status: res.status,
            durationMs,
            error: "Respons AI kosong.",
          });
          continue;
        }

        let parsed: T;
        if (expectJson) {
          try {
            parsed = JSON.parse(extractJsonString(rawText)) as T;
          } catch (parseErr) {
            lastParseError =
              parseErr instanceof Error
                ? parseErr.message
                : "Gagal mem-parse JSON dari AI";
            attempts.push({
              provider: target.provider,
              model,
              ok: false,
              status: res.status,
              durationMs,
              error: `JSON tidak valid: ${lastParseError}`,
            });
            continue;
          }
        } else {
          parsed = rawText as unknown as T;
        }

        const usage: LlmTokenUsage = {
          promptTokens: json.usage?.prompt_tokens ?? 0,
          completionTokens: json.usage?.completion_tokens ?? 0,
          totalTokens: json.usage?.total_tokens ?? 0,
        };

        attempts.push({
          provider: target.provider,
          model,
          ok: true,
          status: res.status,
          durationMs,
        });

        return {
          ok: true,
          rawText,
          parsed,
          provider: target.provider,
          model,
          durationMs,
          usage,
          estimatedCostUsd: 0,
          tier: "free-tier",
          attempts,
        };
      } catch (err) {
        const durationMs = Date.now() - start;
        const message =
          err instanceof Error && err.name === "AbortError"
            ? `Timeout melebihi ${Math.round(timeoutMs / 1000)} detik`
            : err instanceof Error
            ? err.message
            : "Kesalahan jaringan saat menghubungi provider AI";

        attempts.push({
          provider: target.provider,
          model,
          ok: false,
          durationMs,
          error: message,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // Final keyless plain-text POST lane fallback on text.pollinations.ai (separate route)
  try {
    await sleepMs(3000);
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          jsonMode: expectJson,
          seed: Math.floor(Math.random() * 900000) + 100000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });
      const durationMs = Date.now() - start;
      if (res.ok) {
        const rawText = (await res.text()).trim();
        if (rawText) {
          const parsed = expectJson
            ? (JSON.parse(extractJsonString(rawText)) as T)
            : (rawText as unknown as T);
          attempts.push({
            provider: "pollinations",
            model: "text-post-openai",
            ok: true,
            status: res.status,
            durationMs,
          });
          return {
            ok: true,
            rawText,
            parsed,
            provider: "pollinations",
            model: "text-post-openai",
            durationMs,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            estimatedCostUsd: 0,
            tier: "free-tier",
            attempts,
          };
        }
      } else {
        attempts.push({
          provider: "pollinations",
          model: "text-post-openai",
          ok: false,
          status: res.status,
          durationMs,
          rateLimited: res.status === 429,
          error: `HTTP ${res.status}`,
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // fall through to structured error
  }

  if (sawRateLimit) {
    return {
      ok: false,
      code: "ALL_PROVIDERS_RATE_LIMITED",
      error:
        "Server AI gratis sedang padat / terkena rate limit sementara (HTTP 429).",
      hint: "Tunggu 15 detik lalu klik tombol Retry pada divisi ini. (Opsional: pasang GROQ_API_KEY gratis di Vercel agar jauh lebih cepat hingga 30 req/menit.)",
      httpStatus: 429,
      attempts,
    };
  }

  if (lastParseError) {
    return {
      ok: false,
      code: "INVALID_JSON_RESPONSE",
      error: `Model AI mengembalikan format tidak sesuai JSON: ${lastParseError}`,
      hint: "Klik tombol Retry pada divisi ini untuk mencoba ulang.",
      httpStatus: 502,
      attempts,
    };
  }

  return {
    ok: false,
    code: "ALL_PROVIDERS_FAILED",
    error: "Server AI gratis gagal merespons permintaan saat ini.",
    hint: "Tunggu beberapa detik lalu klik Retry pada divisi ini.",
    httpStatus: 502,
    attempts,
  };
}
