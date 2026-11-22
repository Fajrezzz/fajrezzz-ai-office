/**
 * Server-side ONLY Free-Tier LLM Router with automatic rate-limit & error fallback.
 *
 * Verified 2026 Free-Tier Providers (no credit card required inside free quota):
 *  1. Groq (GROQ_API_KEY): llama-3.3-70b-versatile (1,000 req/day, 30 RPM) & llama-3.1-8b-instant (14,400 req/day)
 *  2. Google Gemini API (GEMINI_API_KEY): gemini-2.5-flash & gemini-2.5-flash-lite (free tier)
 *  3. OpenRouter Free (OPENROUTER_API_KEY): openrouter/free & meta-llama/llama-3.3-70b-instruct:free (50 req/day, 20 RPM)
 *  4. Mistral Free Mode (MISTRAL_API_KEY): mistral-small-latest (free experiment quota)
 *
 * API keys are ONLY read from server environment variables (`process.env`).
 * Never import this file in client components.
 */

export type LlmProviderId = "groq" | "gemini" | "openrouter" | "mistral";

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
  /** $0 inside verified free-tier quota; tracked transparently per call */
  estimatedCostUsd: number;
  tier: "free-tier";
  attempts: ProviderAttempt[];
}

export interface LlmCallError {
  ok: false;
  code:
    | "NO_API_KEY_CONFIGURED"
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
  envVar: string;
  configured: boolean;
  freeTierSummary: string;
  models: string[];
}

interface ProviderTarget {
  provider: LlmProviderId;
  label: string;
  envVar: string;
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
    models: [
      "openrouter/free",
      "meta-llama/llama-3.3-70b-instruct:free",
    ],
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
];

const FREE_TIER_SUMMARIES: Record<LlmProviderId, string> = {
  groq: "Gratis tanpa kartu kredit: 30 req/menit, hingga 1.000–14.400 req/hari",
  gemini: "Gratis tanpa kartu kredit pada seri Gemini Flash & Flash-Lite (kuota AI Studio)",
  openrouter: "Gratis pada model :free (20 req/menit, 50 req/hari)",
  mistral: "Free Experiment mode tanpa kartu kredit (terbatas kuota bulanan)",
};

export function getConfiguredProvidersStatus(): {
  anyConfigured: boolean;
  configuredCount: number;
  providers: ProviderConfigStatus[];
  pricingNotice: string;
} {
  const providers: ProviderConfigStatus[] = PROVIDER_TARGETS.map((t) => ({
    id: t.provider,
    label: t.label,
    envVar: t.envVar,
    configured: Boolean(process.env[t.envVar]?.trim()),
    freeTierSummary: FREE_TIER_SUMMARIES[t.provider],
    models: t.models,
  }));

  const configuredCount = providers.filter((p) => p.configured).length;

  return {
    anyConfigured: configuredCount > 0,
    configuredCount,
    providers,
    pricingNotice:
      "Menggunakan Free-Tier API (Rp 0 di dalam batas kuota harian/menit provider). Jika kuota gratis habis atau di-upgrade ke paket berbayar, biaya API dapat berlaku sesuai tarif provider.",
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
    timeoutMs = 28000,
  } = options;

  const activeTargets = PROVIDER_TARGETS.filter((t) =>
    Boolean(process.env[t.envVar]?.trim())
  );

  if (activeTargets.length === 0) {
    return {
      ok: false,
      code: "NO_API_KEY_CONFIGURED",
      error:
        "Belum ada API key LLM yang terpasang di Environment Variables Vercel.",
      hint: "Tambahkan minimal satu API key gratis (GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, atau MISTRAL_API_KEY) di Vercel Project Settings -> Environment Variables lalu Redeploy.",
      httpStatus: 503,
      attempts: [],
    };
  }

  const attempts: ProviderAttempt[] = [];
  let sawRateLimit = false;
  let lastParseError: string | null = null;

  for (const target of activeTargets) {
    const apiKey = process.env[target.envVar]!.trim();

    for (const model of target.models) {
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

        // Request structured JSON mode for providers that reliably support it
        if (expectJson && (target.provider === "groq" || target.provider === "gemini" || target.provider === "mistral")) {
          bodyPayload.response_format = { type: "json_object" };
        }

        const res = await fetch(target.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...(target.extraHeaders ?? {}),
          },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        const durationMs = Date.now() - start;

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const shortErr = errText.slice(0, 260) || res.statusText;
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
          // Fallback to next model / provider
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

  if (sawRateLimit) {
    return {
      ok: false,
      code: "ALL_PROVIDERS_RATE_LIMITED",
      error:
        "Semua provider AI yang aktif sedang terkena batas kuota / rate limit (HTTP 429).",
      hint: "Tunggu 1 menit lalu klik Retry pada divisi ini, atau tambahkan API key cadangan (GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY) di Vercel agar fallback otomatis berjalan.",
      httpStatus: 429,
      attempts,
    };
  }

  if (lastParseError) {
    return {
      ok: false,
      code: "INVALID_JSON_RESPONSE",
      error: `Model AI mengembalikan format yang tidak sesuai skema JSON: ${lastParseError}`,
      hint: "Klik tombol Retry pada divisi ini untuk mencoba ulang permintaan.",
      httpStatus: 502,
      attempts,
    };
  }

  return {
    ok: false,
    code: "ALL_PROVIDERS_FAILED",
    error: "Semua provider AI gagal merespons permintaan saat ini.",
    hint: "Periksa validitas API key di Vercel Environment Variables atau coba Retry beberapa saat lagi.",
    httpStatus: 502,
    attempts,
  };
}
