/**
 * FAJREZZZ AI OFFICE — CENTRAL AI ROUTER (Server-Side ONLY)
 *
 * Unified multi-provider router governing:
 *  1. Google Gemini (`GEMINI_API_KEY`) — Primary for complex reasoning, research, planning, strategy & agent decisions
 *  2. Groq (`GROQ_API_KEY`) — Primary for fast low-latency tasks, classification, summarization & text processing
 *  3. OpenRouter (`OPENROUTER_API_KEY`, https://openrouter.ai/api/v1) — Free-model (`:free`) alternative & fallback
 *  (Pollinations keyless DIHAPUS — fokus 3 API: Gemini, Groq, OpenRouter)
 *
 * Enterprise safeguards:
 *  - Task classification & complexity analysis -> deterministic provider/model selection
 *  - Strict OpenRouter `:free` guardrail (never uses paid models by default)
 *  - Concurrency limiter + FIFO request queue (prevents 15-agent API stampedes)
 *  - Per-provider Circuit Breaker (CLOSED / OPEN / HALF_OPEN)
 *  - Bounded retry with exponential backoff + HTTP 429 rate-limit handling
 *  - Token budget guard + safe TTL response cache
 *  - Real-time provider health telemetry (latency, success, failure, error rate, fallbacks, tokens)
 *  - Secret/API-key redaction on all logs and error strings
 *
 * NEVER import this module in client components.
 */

/**
 * 3 provider saja (permintaan Bos): Gemini + Groq + OpenRouter.
 * Pollinations (jalur keyless) DIHAPUS TOTAL — tidak ada fallback tanpa API key.
 */
export type LlmProviderId = "gemini" | "groq" | "openrouter";

export type AiTaskType =
  | "reasoning"
  | "research"
  | "planning"
  | "strategy"
  | "agent_decision"
  | "analysis"
  | "fast"
  | "classification"
  | "summary"
  | "text_processing"
  | "simple"
  | "creative_script"
  | "auto";

export type AiTaskComplexity = "low" | "medium" | "high";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface TaskClassificationResult {
  taskType: Exclude<AiTaskType, "auto">;
  complexity: AiTaskComplexity;
  primaryProvider: LlmProviderId;
  fallbackChain: LlmProviderId[];
  reason: string;
}

export interface ProviderAttempt {
  provider: LlmProviderId;
  model: string;
  ok: boolean;
  status?: number;
  durationMs: number;
  error?: string;
  rateLimited?: boolean;
  skippedReason?: string;
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
  estimatedCostUsd: number;
  tier: "free-tier";
  attempts: ProviderAttempt[];
  taskClassification: TaskClassificationResult;
  fromCache?: boolean;
  fallbackUsed?: boolean;
}

export interface LlmCallError {
  ok: false;
  code:
    | "ALL_PROVIDERS_RATE_LIMITED"
    | "ALL_PROVIDERS_FAILED"
    | "INVALID_JSON_RESPONSE"
    | "PAID_MODEL_BLOCKED"
    | "NO_PROVIDER_CONFIGURED";
  error: string;
  hint: string;
  httpStatus: number;
  attempts: ProviderAttempt[];
  taskClassification?: TaskClassificationResult;
}

export interface ProviderConfigStatus {
  id: LlmProviderId;
  label: string;
  envVar: string | null;
  configured: boolean;
  keyless: boolean;
  freeTierSummary: string;
  models: string[];
  role: string;
}

export interface ProviderHealthMetrics {
  provider: LlmProviderId;
  label: string;
  envVar: string | null;
  configured: boolean;
  circuitState: CircuitState;
  consecutiveFailures: number;
  circuitOpenedUntil: string | null;
  activeModel: string;
  successCount: number;
  failureCount: number;
  rateLimitHits: number;
  fallbackFromCount: number;
  fallbackToCount: number;
  errorRatePct: number;
  avgLatencyMs: number;
  lastLatencyMs: number | null;
  totalTokens: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastCheckedAt: string | null;
  rateLimitRemaining: string | null;
  rateLimitReset: string | null;
  /** Kelas error terakhir (KEY_INVALID / OVERLOADED / MODEL_GONE / ...). */
  lastErrorClass: ProviderErrorClass | null;
  /** Penjelasan awam untuk kelas error di atas. */
  lastErrorHuman: string | null;
  /** true kalau provider tidak pernah menolak key (401/403). */
  keyHealthy: boolean;
  /** true kalau error terakhir hanya transient (provider sibuk / rate limit). */
  transientOnly: boolean;
  /** v9.4c — kuota gratis HARIAN provider ini sudah habis (429 free-models-per-day). */
  dailyQuotaExhausted: boolean;
  /** Model yang dibalas 404 oleh provider (di-skip sementara, 15 menit). */
  deprecatedModels: string[];
  /** Env var untuk mengganti model tanpa deploy (GEMINI_MODEL / GROQ_MODEL / OPENROUTER_MODEL). */
  modelEnvVar: string;
  /** Model yang BENAR-BENAR dipakai sekarang (env override > alias stabil > statis). */
  preferredModels: string[];
}

export interface RouterTelemetrySnapshot {
  activeRequests: number;
  maxConcurrentRequests: number;
  queuedRequests: number;
  cacheEntries: number;
  cacheHits: number;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  totalFallbacks: number;
  overallErrorRatePct: number;
  providers: ProviderHealthMetrics[];
  recentFallbacks: Array<{
    at: string;
    from: LlmProviderId;
    to: LlmProviderId;
    reason: string;
  }>;
}

interface ProviderTarget {
  provider: LlmProviderId;
  label: string;
  envVar: string | null;
  keyless?: boolean;
  endpoint: string;
  models: string[];
  role: string;
  extraHeaders?: Record<string, string>;
}

/**
 * v9.4c — daftar ini hanya CADANGAN, bukan sumber kebenaran.
 *
 * Pelajaran dari telemetry Bos: ID model `:free` di OpenRouter cepat sekali
 * di-delist (llama-3.3-70b-instruct:free, gemma-3-27b-it:free, qwen3-coder:free
 * semuanya 404), dan `openrouter/free` memang BUKAN ID model yang ada — dia
 * selalu 404. Router sekarang mengutamakan hasil `discoverLiveModels()`
 * (GET https://openrouter.ai/api/v1/models) dan baru memakai daftar ini kalau
 * discovery gagal.
 */
export const OPENROUTER_FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-coder:free",
] as const;

/** ID yang dikenal buruk / bukan model nyata — jangan pernah dikirim ke provider. */
const KNOWN_BOGUS_MODELS = new Set(["openrouter/free"]);

export function isKnownBogusModel(model: string): boolean {
  return KNOWN_BOGUS_MODELS.has(model.trim().toLowerCase());
}

const PROVIDER_TARGETS: Record<LlmProviderId, ProviderTarget> = {
  gemini: {
    provider: "gemini",
    label: "Google Gemini",
    envVar: "GEMINI_API_KEY",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    // v9.4: alias stabil lebih dulu (auto menunjuk model flash terbaru), baru versi beku.
    models: ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
    role: "Primary: Reasoning, Research, Planning, Strategy & Agent Decisions",
  },
  groq: {
    provider: "groq",
    label: "Groq Cloud",
    envVar: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    // v9.4b: llama-3.3/3.1 sudah decommissioned di Groq (lihat telemetry Bos),
    // jadi model live yang terbukti jalan didahulukan. Bisa dioverride GROQ_MODEL.
    models: ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"],
    role: "Primary: Fast Low-Latency, Classification, Summarization & Text Processing",
  },
  openrouter: {
    provider: "openrouter",
    label: "OpenRouter (:free)",
    envVar: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    models: [...OPENROUTER_FREE_MODELS],
    role: "Alternative & Fallback (Strict :free Models Only by Default)",
    extraHeaders: {
      "HTTP-Referer": "https://fajrezzz-ai-office.vercel.app",
      "X-Title": "FAJREZZZ AI Office",
    },
  },
};

const FREE_TIER_SUMMARIES: Record<LlmProviderId, string> = {
  gemini:
    "Primary reasoning/research/planning (Gemini 2.5 Flash & Flash-Lite Free Tier)",
  groq:
    "Primary ultra-fast latency/classification/summary (model live Groq, mis. Qwen / GPT-OSS 120B free tier)",
  openrouter:
    "Fallback & alternative via https://openrouter.ai/api/v1 (hanya model :free secara default)",
};

/* ============================================================================
 * SECURITY: Secret Redaction & OpenRouter Free Guardrail
 * ========================================================================== */

/** Never allow API keys or Bearer secrets to leak into logs, telemetry, or responses */
export function sanitizeErrorMessage(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._\-+/=]{8,}/gi, "Bearer [REDACTED]")
    .replace(/\b(AIza[0-9A-Za-z\-_]{20,})\b/g, "[REDACTED_GEMINI_KEY]")
    .replace(/\b(gsk_[0-9A-Za-z]{16,})\b/g, "[REDACTED_GROQ_KEY]")
    .replace(/\b(sk-or-v1-[0-9A-Za-z]{16,})\b/g, "[REDACTED_OPENROUTER_KEY]")
    .replace(/\b(sk-[0-9A-Za-z]{20,})\b/g, "[REDACTED_API_KEY]")
    .slice(0, 260);
}

/**
 * Ringkasan kegagalan yang bisa ditindaklanjuti: satu baris per provider.
 * Tanpa ini UI hanya bilang "semua provider gagal" dan Bos tidak tahu sebabnya.
 */
export function summarizeProviderFailures(
  attempts: ProviderAttempt[],
  maxLength = 460
): string {
  if (attempts.length === 0) return "Tidak ada provider yang benar-benar dicoba.";
  const perProvider = new Map<LlmProviderId, string>();
  for (const attempt of attempts) {
    if (attempt.ok) continue;
    if (perProvider.has(attempt.provider)) continue;
    const reason =
      attempt.skippedReason === "CIRCUIT_OPEN"
        ? "circuit breaker terbuka (cooldown)"
        : attempt.error ?? "gagal tanpa pesan";
    perProvider.set(
      attempt.provider,
      `${attempt.provider}[${attempt.model}]: ${reason}`
    );
  }
  const joined = [...perProvider.values()].join(" · ");
  return joined.length > maxLength ? `${joined.slice(0, maxLength - 1)}…` : joined;
}

/** Enforces that OpenRouter only invokes free models unless explicitly overridden */
export function isOpenRouterFreeModel(model: string): boolean {
  const clean = model.trim().toLowerCase();
  return clean === "openrouter/free" || clean.endsWith(":free");
}

/* ============================================================================
 * v9.4 FIX — Model bisa di-override tanpa deploy + memo model mati (HTTP 404)
 *
 * Masalah nyata di preview: Google Gemini membalas
 *   404 "This model ... is not found for API version v1beta"
 * untuk model statis `gemini-2.5-flash`, jadi 4 percobaan habis sia-sia
 * (error rate 50%). Tiga lapis perbaikan:
 *   1. Model alias stabil (`gemini-flash-latest`) didahulukan, bukan versi beku.
 *   2. Nama model bisa diganti lewat env GEMINI_MODEL / GROQ_MODEL /
 *      OPENROUTER_MODEL (pisahkan dengan koma) tanpa ubah kode.
 *   3. Model yang sudah membalas 404 dicatat "mati" 15 menit supaya router
 *      tidak membuang waktu & kuota mencoba model yang sama berulang-ulang.
 * ========================================================================== */

const MODEL_ENV: Record<LlmProviderId, string> = {
  gemini: "GEMINI_MODEL",
  groq: "GROQ_MODEL",
  openrouter: "OPENROUTER_MODEL",
};

const DEPRECATED_MODEL_TTL_MS = 15 * 60 * 1000;
const DEPRECATED_MODELS = new Map<string, number>();

function deprecatedKey(provider: LlmProviderId, model: string): string {
  return `${provider}:${model.trim().toLowerCase()}`;
}

/** Catat model yang dibalas 404 oleh provider (di-skip selama 15 menit). */
export function markModelDeprecated(
  provider: LlmProviderId,
  model: string,
  nowMs: number = Date.now()
): void {
  if (!model.trim()) return;
  DEPRECATED_MODELS.set(deprecatedKey(provider, model), nowMs + DEPRECATED_MODEL_TTL_MS);
}

export function isModelDeprecated(
  provider: LlmProviderId,
  model: string,
  nowMs: number = Date.now()
): boolean {
  const key = deprecatedKey(provider, model);
  const until = DEPRECATED_MODELS.get(key);
  if (until === undefined) return false;
  if (nowMs >= until) {
    DEPRECATED_MODELS.delete(key);
    return false;
  }
  return true;
}

export function getDeprecatedModels(
  provider?: LlmProviderId,
  nowMs: number = Date.now()
): string[] {
  const out: string[] = [];
  for (const [key, until] of DEPRECATED_MODELS.entries()) {
    if (nowMs >= until) {
      DEPRECATED_MODELS.delete(key);
      continue;
    }
    const [prov, ...rest] = key.split(":");
    if (provider && prov !== provider) continue;
    out.push(`${prov}:${rest.join(":")}`);
  }
  return out;
}

export function resetDeprecatedModels(): void {
  DEPRECATED_MODELS.clear();
}

/**
 * Jenis kegagalan provider — dipakai untuk membedakan "key rusak" dari
 * "provider sedang sibuk". Tanpa ini panel telemetry terlihat seperti semua
 * API key mati padahal cuma Google yang membalas 503 high demand.
 */
export type ProviderErrorClass =
  | "MODEL_GONE"
  | "KEY_INVALID"
  | "RATE_LIMIT"
  | "OVERLOADED"
  | "TIMEOUT"
  | "UNKNOWN";

export function classifyProviderError(
  status: number | undefined,
  message: string
): ProviderErrorClass {
  const msg = message || "";
  if (status === 401 || status === 403) return "KEY_INVALID";
  if (status === 429) return "RATE_LIMIT";
  if (status === 404) return "MODEL_GONE";
  if (status === 408) return "TIMEOUT";
  if (typeof status === "number" && status >= 500) return "OVERLOADED";

  if (/\b(api[ _-]?key|unauthori[sz]ed|invalid key|permission denied)\b/i.test(msg)) {
    return "KEY_INVALID";
  }
  if (/\b(rate limit|too many requests|quota|resource_exhausted)\b/i.test(msg)) {
    return "RATE_LIMIT";
  }
  if (/\b(timeout|timed out|aborted|econnreset|socket hang up)\b/i.test(msg)) {
    return "TIMEOUT";
  }
  if (/(model)/i.test(msg) &&
      /(not found|does not exist|no longer|decommission|not supported|unsupported|deprecated)/i.test(msg)) {
    return "MODEL_GONE";
  }
  if (/\b(high demand|overloaded|over capacity|service unavailable|temporarily unavailable)\b/i.test(msg)) {
    return "OVERLOADED";
  }
  return "UNKNOWN";
}

/**
 * v9.4c — OpenRouter punya 429 khusus: `free-models-per-day`.
 * Itu BUKAN rate limit detik-an dan BUKAN key rusak; kuota gratis HARIAN
 * sudah habis dan baru pulih saat kuota reset (00:00 UTC) — atau langsung
 * naik ke 1.000 req/hari kalau akun pernah beli ≥10 kredit.
 */
export function isDailyFreeQuotaError(message: string): boolean {
  const msg = message || "";
  return (
    /free-models-per-day/i.test(msg) ||
    /free model requests per (day|24 ?h)/i.test(msg) ||
    /daily (free )?quota/i.test(msg)
  );
}

/** Error yang wajar terjadi sesaat (bukan tanda API key rusak). */
export function isTransientErrorClass(cls: ProviderErrorClass): boolean {
  return cls === "OVERLOADED" || cls === "RATE_LIMIT" || cls === "TIMEOUT";
}

/** Kalimat manusiawi untuk panel telemetry. */
export function describeErrorClass(cls: ProviderErrorClass): string {
  switch (cls) {
    case "KEY_INVALID":
      return "API key ditolak provider (401/403) — key salah, sudah dicabut, atau beda project.";
    case "MODEL_GONE":
      return "Nama model sudah tidak tersedia di provider — router pindah model / set env model.";
    case "RATE_LIMIT":
      return "Rate limit / kuota gratis habis sementara — bukan kerusakan API key.";
    case "OVERLOADED":
      return "Server provider kelebihan beban (5xx, mis. high demand) — bukan kerusakan API key.";
    case "TIMEOUT":
      return "Provider tidak merespons tepat waktu — jaringan/antrean, bukan kerusakan API key.";
    default:
      return "Error tak terduga dari provider.";
  }
}

/**
 * Keterangan lengkap (kelas + kalimat manusiawi) untuk satu kegagalan provider.
 * Dipakai panel telemetry & endpoint Tes Live Provider supaya pesan 429 kuota
 * harian tidak lagi dibaca sebagai "API key rusak".
 */
export function describeProviderError(
  status: number | undefined,
  message: string
): { errorClass: ProviderErrorClass; hint: string } {
  const errorClass = classifyProviderError(status, message);
  if (errorClass === "RATE_LIMIT" && isDailyFreeQuotaError(message)) {
    return {
      errorClass,
      hint:
        "Kuota gratis HARIAN provider ini sudah habis (bukan API key rusak, bukan limit per detik). " +
        "Pulih sendiri saat kuota reset (00:00 UTC) — atau langsung naik limitnya di OpenRouter " +
        "dengan membeli kredit ≥10 USD (kuota gratis jadi 1.000 request/hari).",
    };
  }
  return { errorClass, hint: describeErrorClass(errorClass) };
}

/** Pesan provider yang menandakan model tidak ada / sudah dipensiunkan. */
export function isModelNotFoundError(status: number | undefined, message: string): boolean {
  return classifyProviderError(status, message) === "MODEL_GONE";
}

/**
 * Daftar model yang dipakai router untuk satu provider.
 *
 * v9.4c — urutan berubah: env override → model LIVE dari discovery → model
 * statis. Dulu statis didahulukan, akibatnya router menghabiskan seluruh
 * jatah percobaan ke nama model yang sudah pensiun (404) sebelum menyentuh
 * model yang benar-benar hidup.
 */
export function resolveProviderModels(
  provider: LlmProviderId,
  discovered: string[] = []
): string[] {
  const envName = MODEL_ENV[provider];
  const fromEnv = (process.env[envName] ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const curated = [...PROVIDER_TARGETS[provider].models];
  // Env override = pengganti penuh (Bos yang menentukan), bukan tambahan.
  const ordered =
    fromEnv.length > 0 ? fromEnv : [...discovered.filter(Boolean), ...curated];
  const filtered = ordered
    .filter((m) => !isKnownBogusModel(m))
    .filter((m) => (provider === "openrouter" ? isOpenRouterFreeModel(m) : true));
  return [...new Set(filtered)];
}

export interface NativeGeminiResult {
  ok: boolean;
  status: number;
  rawText: string;
  usage: LlmTokenUsage;
  durationMs: number;
  error?: string;
}

/**
 * Panggil Gemini lewat endpoint NATIVE (`:generateContent`), bukan lapisan
 * kompatibilitas OpenAI. Dipakai sebagai penyelamat ketika endpoint
 * `/v1beta/openai/chat/completions` membalas 404 padahal `/v1beta/models`
 * (dipakai discovery) menyebut model itu hidup.
 */
export async function callGeminiNative(
  options: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    expectJson?: boolean;
    apiKey: string;
  },
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = 15_000
): Promise<NativeGeminiResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const model = options.model.replace(/^models\//, "");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
    `?key=${encodeURIComponent(options.apiKey)}`;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: options.userPrompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
          ...(options.expectJson ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        rawText: "",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs,
        error: sanitizeErrorMessage(errText || res.statusText || `HTTP ${res.status}`),
      };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
    const rawText =
      json.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";
    return {
      ok: Boolean(rawText),
      status: res.status,
      rawText,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: json.usageMetadata?.totalTokenCount ?? 0,
      },
      durationMs,
      error: rawText ? undefined : "Respons Gemini native kosong.",
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const rawMessage =
      err instanceof Error && err.name === "AbortError"
        ? `Timeout melebihi ${Math.round(timeoutMs / 1000)} detik`
        : err instanceof Error
          ? err.message
          : "Kesalahan jaringan saat menghubungi Gemini native";
    return {
      ok: false,
      status: 0,
      rawText: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      durationMs,
      error: sanitizeErrorMessage(rawMessage),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ============================================================================
 * LIVE MODEL DISCOVERY — anti "model sudah di-deprecate" (HTTP 404)
 * ========================================================================== */

interface LiveModelCacheEntry {
  fetchedAtMs: number;
  models: string[];
}

const LIVE_MODEL_CACHE = new Map<LlmProviderId, LiveModelCacheEntry>();
const LIVE_MODEL_TTL_MS = 10 * 60 * 1000;

const DISCOVERY_ENDPOINTS: Record<LlmProviderId, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  groq: "https://api.groq.com/openai/v1/models",
  openrouter: "https://openrouter.ai/api/v1/models",
};

/** Urutan prioritas model murah/cepat per provider saat discovery berhasil. */
const DISCOVERY_PRIORITY: Record<LlmProviderId, RegExp[]> = {
  // v9.4c — generasi terbaru lebih dulu. Gemini 2.5 sudah "no longer available
  // to new users" untuk project baru, jadi jangan taruh di depan lagi.
  gemini: [
    /gemini-3(\.\d+)?[^:]*flash(?!-lite)/i,
    /flash-latest/i,
    /flash(?!-lite)/i,
    /flash/i,
    /gemini-2\.5-flash/i,
    /gemini-2\.0-flash/i,
  ],
  groq: [/gpt-oss-120b/i, /qwen3?/i, /qwen/i, /llama-3\.3-70b/i, /llama-3\.1-8b/i, /llama/i],
  // v9.4c — jangan terpaku llama/gemma yang sudah di-delist; pilih :free yang
  // benar-benar muncul di /models, dengan model instruksi besar didahulukan.
  openrouter: [
    /gpt-oss-120b[^:]*:free/i,
    /qwen3[^:]*instruct[^:]*:free/i,
    /qwen3[^:]*:free/i,
    /deepseek[^:]*:free/i,
    /llama-3\.3-70b[^:]*:free/i,
    /gemma-3[^:]*:free/i,
    /instruct[^:]*:free/i,
    /:free/i,
  ],
};

function scoreDiscoveredModel(provider: LlmProviderId, model: string): number {
  const list = DISCOVERY_PRIORITY[provider];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].test(model)) return i;
  }
  return list.length + 1;
}

/**
 * Ambil daftar model yang BENAR-BENAR hidup dari endpoint /models provider.
 * Soft-fail: kalau gagal, kembalikan [] supaya daftar statis tetap dipakai.
 */
export async function discoverLiveModels(
  provider: LlmProviderId,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  nowMs: number = Date.now()
): Promise<string[]> {
  const cached = LIVE_MODEL_CACHE.get(provider);
  if (cached && nowMs - cached.fetchedAtMs < LIVE_MODEL_TTL_MS) {
    return cached.models;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const url =
      provider === "gemini" && apiKey
        ? `${DISCOVERY_ENDPOINTS.gemini}?key=${encodeURIComponent(apiKey)}&pageSize=100`
        : DISCOVERY_ENDPOINTS[provider];
    const res = await fetchImpl(url, {
      method: "GET",
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { id?: string }[];
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };

    let models: string[] = [];
    if (Array.isArray(json.data)) {
      models = json.data
        .map((m) => m.id ?? "")
        .filter(Boolean)
        .filter((id) => (provider === "openrouter" ? isOpenRouterFreeModel(id) : true));
    } else if (Array.isArray(json.models)) {
      models = json.models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent") !== false)
        .map((m) => (m.name ?? "").replace(/^models\//, ""))
        .filter((id) => /gemini/i.test(id));
    }

    models = [...new Set(models)]
      .sort((a, b) => scoreDiscoveredModel(provider, a) - scoreDiscoveredModel(provider, b))
      .slice(0, 8);

    LIVE_MODEL_CACHE.set(provider, { fetchedAtMs: nowMs, models });
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Dipakai unit test untuk mengosongkan cache discovery. */
export function resetLiveModelCache(): void {
  LIVE_MODEL_CACHE.clear();
}

/* ============================================================================
 * TASK CLASSIFICATION & COMPLEXITY ROUTING
 * ========================================================================== */

const COMPLEX_KEYWORDS =
  /\b(reason|research|riset|plan|rencana|strateg|architect|arsitek|analy|analisis|audit|debug|multi-agent|decision|keputusan|workflow|investig|compare|evaluat|script|story)\b/i;

const FAST_KEYWORDS =
  /\b(classif|klasifik|summar|ringkas|short|cepat|fast|tag|label|extract|ekstrak|format|translate|terjemah|ping|health|simple|sederhana|caption|hashtag)\b/i;

export function classifyAiTask(options: {
  taskType?: AiTaskType;
  systemPrompt?: string;
  userPrompt?: string;
  maxTokens?: number;
}): TaskClassificationResult {
  const explicit = options.taskType && options.taskType !== "auto" ? options.taskType : null;
  const combined = `${options.systemPrompt ?? ""} ${options.userPrompt ?? ""}`;
  const promptChars = combined.length;

  const geminiTypes: ReadonlySet<AiTaskType> = new Set([
    "reasoning",
    "research",
    "planning",
    "strategy",
    "agent_decision",
    "analysis",
    "creative_script",
  ]);
  const groqTypes: ReadonlySet<AiTaskType> = new Set([
    "fast",
    "classification",
    "summary",
    "text_processing",
    "simple",
  ]);

  let resolvedType: Exclude<AiTaskType, "auto">;
  let complexity: AiTaskComplexity;
  let reason: string;

  if (explicit && geminiTypes.has(explicit)) {
    resolvedType = explicit;
    complexity = "high";
    reason = `Explicit task "${explicit}" routed to Gemini for deep reasoning/planning.`;
  } else if (explicit && groqTypes.has(explicit)) {
    resolvedType = explicit;
    complexity = "low";
    reason = `Explicit task "${explicit}" routed to Groq for ultra-low latency.`;
  } else if (
    FAST_KEYWORDS.test(combined) &&
    !COMPLEX_KEYWORDS.test(combined) &&
    promptChars < 1800
  ) {
    resolvedType = "fast";
    complexity = "low";
    reason = "Detected fast/classification/summary workload -> Groq primary.";
  } else if (
    COMPLEX_KEYWORDS.test(combined) ||
    promptChars >= 1800 ||
    (options.maxTokens ?? 0) >= 1600
  ) {
    resolvedType = "reasoning";
    complexity = "high";
    reason = "Detected complex reasoning/research/planning workload -> Gemini primary.";
  } else {
    resolvedType = "text_processing";
    complexity = "medium";
    reason = "Standard low-latency text processing workload -> Groq primary.";
  }

  if (complexity === "high") {
    return {
      taskType: resolvedType,
      complexity,
      primaryProvider: "gemini",
      fallbackChain: ["gemini", "groq", "openrouter"],
      reason,
    };
  }

  return {
    taskType: resolvedType,
    complexity,
    primaryProvider: "groq",
    fallbackChain: ["groq", "gemini", "openrouter"],
    reason,
  };
}

/* ============================================================================
 * INTERNAL STATE: Circuit Breaker, Concurrency Queue, Cache & Health Telemetry
 * ========================================================================== */

const MAX_CONCURRENT_REQUESTS = 3;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 45_000;
/**
 * v9.4 FIX — cooldown dibedakan per JENIS error:
 *  - provider sibuk / rate limit / timeout = gangguan sesaat → 8 detik saja,
 *    supaya Gemini tidak "dikunci" 45 detik hanya karena 503 high demand.
 *  - key ditolak (401/403) = percuma diulang cepat → 5 menit.
 */
const CIRCUIT_COOLDOWN_TRANSIENT_MS = 8_000;
const CIRCUIT_COOLDOWN_KEY_INVALID_MS = 5 * 60_000;
const CIRCUIT_COOLDOWN_MODEL_GONE_MS = 12_000;
/**
 * v9.4c — kuota gratis HARIAN habis. Mengulang tiap 8 detik cuma membuang
 * waktu serverless (dan menutupi provider lain yang sebenarnya sehat), jadi
 * provider diistirahatkan 30 menit. Tetap < 1 hari supaya otomatis pulih
 * begitu kuota reset (00:00 UTC) tanpa perlu redeploy.
 */
const CIRCUIT_COOLDOWN_DAILY_QUOTA_MS = 30 * 60_000;

/** Lama cooldown untuk satu kelas kegagalan (dipisah supaya bisa diuji). */
export function cooldownMsForFailure(
  errorClass: ProviderErrorClass,
  dailyQuotaExhausted = false
): number {
  if (dailyQuotaExhausted) return CIRCUIT_COOLDOWN_DAILY_QUOTA_MS;
  if (errorClass === "KEY_INVALID") return CIRCUIT_COOLDOWN_KEY_INVALID_MS;
  if (errorClass === "MODEL_GONE") return CIRCUIT_COOLDOWN_MODEL_GONE_MS;
  if (isTransientErrorClass(errorClass)) return CIRCUIT_COOLDOWN_TRANSIENT_MS;
  return CIRCUIT_COOLDOWN_MS;
}
const CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 64;
const MAX_SAFE_TOKEN_BUDGET = 4096;

interface InternalProviderState {
  circuitState: CircuitState;
  consecutiveFailures: number;
  circuitOpenedUntilMs: number | null;
  activeModel: string;
  successCount: number;
  failureCount: number;
  rateLimitHits: number;
  fallbackFromCount: number;
  fallbackToCount: number;
  totalLatencyMs: number;
  lastLatencyMs: number | null;
  totalTokens: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastCheckedAt: string | null;
  rateLimitRemaining: string | null;
  rateLimitReset: string | null;
  lastErrorClass: ProviderErrorClass | null;
  everRejectedKey: boolean;
  dailyQuotaExhausted: boolean;
}

interface CacheRecord {
  expiresAt: number;
  result: LlmCallResult<unknown>;
}

const providerStates: Record<LlmProviderId, InternalProviderState> = {
  gemini: createInitialProviderState(PROVIDER_TARGETS.gemini.models[0]),
  groq: createInitialProviderState(PROVIDER_TARGETS.groq.models[0]),
  openrouter: createInitialProviderState(PROVIDER_TARGETS.openrouter.models[0]),
};

function createInitialProviderState(defaultModel: string): InternalProviderState {
  return {
    circuitState: "CLOSED",
    consecutiveFailures: 0,
    circuitOpenedUntilMs: null,
    activeModel: defaultModel,
    successCount: 0,
    failureCount: 0,
    rateLimitHits: 0,
    fallbackFromCount: 0,
    fallbackToCount: 0,
    totalLatencyMs: 0,
    lastLatencyMs: null,
    totalTokens: 0,
    lastError: null,
    lastSuccessAt: null,
    lastCheckedAt: null,
    rateLimitRemaining: null,
    rateLimitReset: null,
    lastErrorClass: null,
    everRejectedKey: false,
    dailyQuotaExhausted: false,
  };
}

let activeRequests = 0;
const waitQueue: Array<() => void> = [];
const responseCache = new Map<string, CacheRecord>();
let cacheHits = 0;
let totalRequests = 0;
let totalSuccesses = 0;
let totalFailures = 0;
let totalFallbacks = 0;
const recentFallbacks: Array<{
  at: string;
  from: LlmProviderId;
  to: LlmProviderId;
  reason: string;
}> = [];

/** Exposed for unit testing clean resets */
export function resetRouterRuntimeStateForTests(): void {
  (Object.keys(providerStates) as LlmProviderId[]).forEach((id) => {
    providerStates[id] = createInitialProviderState(PROVIDER_TARGETS[id].models[0]);
  });
  activeRequests = 0;
  waitQueue.length = 0;
  responseCache.clear();
  cacheHits = 0;
  totalRequests = 0;
  totalSuccesses = 0;
  totalFailures = 0;
  totalFallbacks = 0;
  recentFallbacks.length = 0;
}

async function acquireConcurrencySlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activeRequests += 1;
      resolve();
    });
  });
}

function releaseConcurrencySlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) next();
}

function isProviderCircuitOpen(provider: LlmProviderId): boolean {
  const st = providerStates[provider];
  if (st.circuitState !== "OPEN") return false;
  if (st.circuitOpenedUntilMs && Date.now() >= st.circuitOpenedUntilMs) {
    st.circuitState = "HALF_OPEN";
    return false;
  }
  return true;
}

function recordProviderSuccess(
  provider: LlmProviderId,
  model: string,
  durationMs: number,
  usage: LlmTokenUsage,
  headers?: Headers
): void {
  const st = providerStates[provider];
  st.circuitState = "CLOSED";
  st.consecutiveFailures = 0;
  st.circuitOpenedUntilMs = null;
  st.activeModel = model;
  st.successCount += 1;
  st.totalLatencyMs += durationMs;
  st.lastLatencyMs = durationMs;
  st.totalTokens += usage.totalTokens;
  st.lastError = null;
  st.dailyQuotaExhausted = false;
  const nowIso = new Date().toISOString();
  st.lastSuccessAt = nowIso;
  st.lastCheckedAt = nowIso;
  if (headers) {
    st.rateLimitRemaining =
      headers.get("x-ratelimit-remaining-requests") ??
      headers.get("x-ratelimit-remaining") ??
      st.rateLimitRemaining;
    st.rateLimitReset =
      headers.get("x-ratelimit-reset-requests") ??
      headers.get("x-ratelimit-reset") ??
      st.rateLimitReset;
  }
}

function recordProviderFailure(
  provider: LlmProviderId,
  durationMs: number,
  errorMsg: string,
  isRateLimit: boolean,
  status?: number,
  dailyQuotaExhausted = false
): void {
  const st = providerStates[provider];
  const safeMsg = sanitizeErrorMessage(errorMsg);
  const errorClass = classifyProviderError(status, safeMsg);
  const quotaGone = dailyQuotaExhausted || isDailyFreeQuotaError(safeMsg);

  st.failureCount += 1;
  st.consecutiveFailures += 1;
  st.lastLatencyMs = durationMs;
  st.lastErrorClass = errorClass;
  if (isRateLimit || errorClass === "RATE_LIMIT") st.rateLimitHits += 1;
  if (errorClass === "KEY_INVALID") st.everRejectedKey = true;
  if (quotaGone) st.dailyQuotaExhausted = true;
  st.lastError = safeMsg;
  st.lastCheckedAt = new Date().toISOString();

  if (st.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    st.circuitState = "OPEN";
    st.circuitOpenedUntilMs = Date.now() + cooldownMsForFailure(errorClass, quotaGone);
  }
}

export function isProviderConfigured(provider: LlmProviderId): boolean {
  const t = PROVIDER_TARGETS[provider];
  if (!t) return false;
  return Boolean(t.keyless || (t.envVar && process.env[t.envVar]?.trim()));
}

export function getRouterTelemetrySnapshot(): RouterTelemetrySnapshot {
  const orderedIds: LlmProviderId[] = ["gemini", "groq", "openrouter"];
  const providers: ProviderHealthMetrics[] = orderedIds.map((id) => {
    const target = PROVIDER_TARGETS[id];
    const st = providerStates[id];
    // Refresh half-open transition on read
    isProviderCircuitOpen(id);
    const total = st.successCount + st.failureCount;
    const errorRatePct = total > 0 ? Math.round((st.failureCount / total) * 100) : 0;
    const avgLatencyMs =
      st.successCount > 0 ? Math.round(st.totalLatencyMs / st.successCount) : 0;

    return {
      provider: id,
      label: target.label,
      envVar: target.envVar,
      configured: isProviderConfigured(id),
      circuitState: st.circuitState,
      consecutiveFailures: st.consecutiveFailures,
      circuitOpenedUntil: st.circuitOpenedUntilMs
        ? new Date(st.circuitOpenedUntilMs).toISOString()
        : null,
      activeModel: st.activeModel,
      successCount: st.successCount,
      failureCount: st.failureCount,
      rateLimitHits: st.rateLimitHits,
      fallbackFromCount: st.fallbackFromCount,
      fallbackToCount: st.fallbackToCount,
      errorRatePct,
      avgLatencyMs,
      lastLatencyMs: st.lastLatencyMs,
      totalTokens: st.totalTokens,
      lastError: st.lastError,
      lastSuccessAt: st.lastSuccessAt,
      lastCheckedAt: st.lastCheckedAt,
      rateLimitRemaining: st.rateLimitRemaining,
      rateLimitReset: st.rateLimitReset,
      lastErrorClass: st.lastErrorClass,
      lastErrorHuman: st.lastErrorClass
        ? st.dailyQuotaExhausted
          ? describeProviderError(429, "free-models-per-day").hint
          : describeErrorClass(st.lastErrorClass)
        : null,
      keyHealthy: !st.everRejectedKey,
      transientOnly:
        st.failureCount > 0 &&
        st.successCount === 0 &&
        (st.lastErrorClass === null || isTransientErrorClass(st.lastErrorClass)),
      dailyQuotaExhausted: st.dailyQuotaExhausted,
      deprecatedModels: getDeprecatedModels(id).map((entry) => entry.split(":").slice(1).join(":")),
      modelEnvVar: MODEL_ENV[id],
      preferredModels: resolveProviderModels(id, LIVE_MODEL_CACHE.get(id)?.models ?? []),
    };
  });

  const finished = totalSuccesses + totalFailures;
  return {
    activeRequests,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    queuedRequests: waitQueue.length,
    cacheEntries: responseCache.size,
    cacheHits,
    totalRequests,
    totalSuccesses,
    totalFailures,
    totalFallbacks,
    overallErrorRatePct:
      finished > 0 ? Math.round((totalFailures / finished) * 100) : 0,
    providers,
    recentFallbacks: [...recentFallbacks].slice(0, 12),
  };
}

export function getConfiguredProvidersStatus(): {
  anyConfigured: boolean;
  configuredCount: number;
  hasPrivateFreeKey: boolean;
  activeLabel: string;
  providers: ProviderConfigStatus[];
  primaryTriad: {
    gemini: boolean;
    groq: boolean;
    openrouter: boolean;
  };
  pricingNotice: string;
  routerTelemetry: RouterTelemetrySnapshot;
} {
  const orderedIds: LlmProviderId[] = ["gemini", "groq", "openrouter"];
  const providers: ProviderConfigStatus[] = orderedIds.map((id) => {
    const t = PROVIDER_TARGETS[id];
    return {
      id: t.provider,
      label: t.label,
      envVar: t.envVar,
      configured: isProviderConfigured(id),
      keyless: Boolean(t.keyless),
      freeTierSummary: FREE_TIER_SUMMARIES[t.provider],
      models: t.models,
      role: t.role,
    };
  });

  const configuredCount = providers.filter((p) => p.configured).length;
  const privateKeys = providers.filter((p) => !p.keyless && p.configured);
  const activeLabel =
    privateKeys.length > 0
      ? `${privateKeys.map((p) => p.id.toUpperCase()).join(" + ")}`
      : "Belum ada API key — pasang GEMINI/GROQ/OPENROUTER_API_KEY";

  return {
    anyConfigured: configuredCount > 0,
    configuredCount,
    hasPrivateFreeKey: privateKeys.length > 0,
    activeLabel,
    providers,
    primaryTriad: {
      gemini: isProviderConfigured("gemini"),
      groq: isProviderConfigured("groq"),
      openrouter: isProviderConfigured("openrouter"),
    },
    pricingNotice:
      "Central AI Router aktif dengan 3 API: Gemini (reasoning/planning), Groq (fast/low-latency), OpenRouter (:free models only). Tanpa API key tidak ada fallback keyless — pasang key di Vercel Environment Variables.",
    routerTelemetry: getRouterTelemetrySnapshot(),
  };
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Parse keluaran model. Dipakai jalur OpenAI-compat DAN jalur native Gemini
 * supaya perilaku JSON-mode-nya identik.
 */
export function parseModelOutput<T>(
  rawText: string,
  expectJson: boolean
): { ok: true; parsed: T } | { ok: false; error: string } {
  if (!expectJson) return { ok: true, parsed: rawText as unknown as T };
  try {
    return { ok: true, parsed: JSON.parse(extractJsonString(rawText)) as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal mem-parse JSON dari AI",
    };
  }
}

function makeCacheKey(
  taskType: string,
  systemPrompt: string,
  userPrompt: string,
  expectJson: boolean,
  preferredProvider?: string
): string {
  return `${preferredProvider ?? "auto"}|${taskType}|${expectJson ? "json" : "text"}|${systemPrompt.slice(0, 160)}|${userPrompt.slice(0, 320)}`;
}

function setBoundedCache(key: string, result: LlmCallResult<unknown>): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });
}

export interface CallFreeTierLlmOptions {
  systemPrompt: string;
  userPrompt: string;
  expectJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Semantic task hint for intelligent routing (Gemini vs Groq vs OpenRouter) */
  taskType?: AiTaskType;
  /** Optional explicit provider preference (e.g. live provider test or manual choice) */
  preferredProvider?: LlmProviderId;
  /** Optional explicit model override (OpenRouter still requires :free unless allowPaidOpenRouter=true) */
  preferredModel?: string;
  /** Strictly false by default so paid OpenRouter models are never invoked accidentally */
  allowPaidOpenRouter?: boolean;
  /** Disable fallback chain when testing a single provider directly */
  disableFallback?: boolean;
  /** Enable safe TTL response caching for idempotent low-temperature queries */
  enableCache?: boolean;
  /** Optional custom fetch implementation (used by automated tests for deterministic fallback simulation) */
  fetchImpl?: typeof fetch;
}

/**
 * Central AI Router entry point (fully backward-compatible alias `callFreeTierLLM`).
 */
export async function callCentralAIRouter<T = unknown>(
  options: CallFreeTierLlmOptions
): Promise<LlmCallResult<T> | LlmCallError> {
  const {
    systemPrompt,
    userPrompt,
    expectJson = true,
    temperature = 0.7,
    maxTokens = 2200,
    timeoutMs = 28000,
    taskType = "auto",
    preferredProvider,
    preferredModel,
    allowPaidOpenRouter = false,
    disableFallback = false,
    enableCache = false,
    fetchImpl = fetch,
  } = options;

  // Guard OpenRouter paid models strictly by default
  if (
    preferredProvider === "openrouter" &&
    preferredModel &&
    !allowPaidOpenRouter &&
    !isOpenRouterFreeModel(preferredModel)
  ) {
    return {
      ok: false,
      code: "PAID_MODEL_BLOCKED",
      error: `Model OpenRouter "${preferredModel}" diblokir karena bukan model gratis (:free).`,
      hint: "Gunakan model dengan akhiran :free (mis. openrouter/free atau meta-llama/llama-3.3-70b-instruct:free).",
      httpStatus: 400,
      attempts: [],
    };
  }

  const safeMaxTokens = Math.min(Math.max(64, maxTokens), MAX_SAFE_TOKEN_BUDGET);
  const classification = classifyAiTask({
    taskType,
    systemPrompt,
    userPrompt,
    maxTokens: safeMaxTokens,
  });

  // Safe TTL cache lookup
  const cacheKey = enableCache
    ? makeCacheKey(
        classification.taskType,
        systemPrompt,
        userPrompt,
        expectJson,
        preferredProvider
      )
    : null;
  if (cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      cacheHits += 1;
      return {
        ...(cached.result as LlmCallResult<T>),
        fromCache: true,
      };
    }
    if (cached) responseCache.delete(cacheKey);
  }

  // Build ordered provider chain
  let providerOrder: LlmProviderId[];
  if (preferredProvider) {
    providerOrder = disableFallback
      ? [preferredProvider]
      : [
          preferredProvider,
          ...classification.fallbackChain.filter((p) => p !== preferredProvider),
        ];
  } else {
    providerOrder = [...classification.fallbackChain];
  }

  const activeTargets = providerOrder
    .map((id) => PROVIDER_TARGETS[id])
    .filter((t) => Boolean(t && isProviderConfigured(t.provider)));

  // Fast-fail jelas: tanpa API key TIDAK ada jalur keyless lagi (Pollinations dihapus).
  // Ini mencegah UI menampilkan "502 / server antre" yang menyesatkan dan retry sia-sia.
  if (activeTargets.length === 0) {
    return {
      ok: false,
      code: "NO_PROVIDER_CONFIGURED",
      error:
        "Belum ada API key AI yang terpasang (GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY).",
      hint:
        "Buka Vercel → Settings → Environment Variables → tambahkan minimal satu key " +
        "(https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables), " +
        "lalu Redeploy. Tanpa key, fitur AI memang tidak bisa jalan.",
      httpStatus: 503,
      attempts: [],
      taskClassification: classification,
    };
  }

  const attempts: ProviderAttempt[] = [];
  let sawRateLimit = false;
  let lastParseError: string | null = null;
  let failedPrimary: LlmProviderId | null = null;

  totalRequests += 1;
  await acquireConcurrencySlot();

  // Vercel Serverless punya batas durasi. Tanpa deadline, rantai 3 provider ×
  // beberapa model × retry bisa melewati limit fungsi dan berakhir "gagal total"
  // tanpa pesan jelas. Dengan deadline, kita gagal cepat + pesan actionable.
  const callStartedAtMs = Date.now();
  const HARD_DEADLINE_MS = 24_000;
  let deadlineHit = false;

  /**
   * Satu pintu keluar untuk semua jalur sukses (OpenAI-compat & native Gemini):
   * mencatat telemetry, fallback counter, attempt, cache, lalu mengembalikan hasil.
   */
  const finalizeSuccess = (args: {
    provider: LlmProviderId;
    model: string;
    rawText: string;
    parsed: T;
    status: number;
    durationMs: number;
    usage: LlmTokenUsage;
    headers?: Headers;
  }): LlmCallResult<T> => {
    recordProviderSuccess(
      args.provider,
      args.model,
      args.durationMs,
      args.usage,
      args.headers
    );

    const fallbackUsed = Boolean(failedPrimary && failedPrimary !== args.provider);
    if (fallbackUsed && failedPrimary) {
      totalFallbacks += 1;
      providerStates[failedPrimary].fallbackFromCount += 1;
      providerStates[args.provider].fallbackToCount += 1;
      recentFallbacks.unshift({
        at: new Date().toISOString(),
        from: failedPrimary,
        to: args.provider,
        reason:
          attempts.find((a) => a.provider === failedPrimary)?.error ??
          "Primary provider error",
      });
      if (recentFallbacks.length > 20) recentFallbacks.pop();
    }

    attempts.push({
      provider: args.provider,
      model: args.model,
      ok: true,
      status: args.status,
      durationMs: args.durationMs,
    });

    totalSuccesses += 1;

    const successResult: LlmCallResult<T> = {
      ok: true,
      rawText: args.rawText,
      parsed: args.parsed,
      provider: args.provider,
      model: args.model,
      durationMs: args.durationMs,
      usage: args.usage,
      estimatedCostUsd: 0,
      tier: "free-tier",
      attempts,
      taskClassification: classification,
      fallbackUsed,
    };

    if (cacheKey) {
      setBoundedCache(cacheKey, successResult as LlmCallResult<unknown>);
    }

    return successResult;
  };

  try {
    for (const target of activeTargets) {
      // Check Circuit Breaker (unless this is the ONLY explicitly targeted provider)
      if (!disableFallback && isProviderCircuitOpen(target.provider)) {
        attempts.push({
          provider: target.provider,
          model: target.models[0],
          ok: false,
          durationMs: 0,
          skippedReason: "CIRCUIT_OPEN",
          error: `Circuit breaker OPEN untuk ${target.label} (menunggu cooldown 45 detik).`,
        });
        if (!failedPrimary) failedPrimary = target.provider;
        continue;
      }

      const apiKey = target.envVar ? process.env[target.envVar]?.trim() ?? "" : "";

      /*
       * v9.4c — urutan kandidat model dibalik: env override → model LIVE dari
       * `/models` provider → daftar statis sebagai cadangan.
       *
       * Kenapa: daftar statis cepat basi. Telemetry Bos menunjukkan OpenRouter
       * dibombardir 404 (llama-3.3:free, gemma-3:free, qwen3-coder:free) dan
       * Gemini 2.5-flash "no longer available to new users", sehingga router
       * menghabiskan seluruh jatah percobaan sebelum menyentuh model hidup.
       */
      const liveModels = apiKey
        ? await discoverLiveModels(target.provider, apiKey, fetchImpl)
        : [];
      let modelsToTry =
        preferredProvider === target.provider && preferredModel
          ? [preferredModel]
          : resolveProviderModels(target.provider, liveModels);

      if (target.provider === "openrouter" && !allowPaidOpenRouter) {
        modelsToTry = modelsToTry.filter((m) => isOpenRouterFreeModel(m));
      }

      // Model yang sudah dibalas 404 oleh provider tidak dicoba lagi (hemat kuota).
      const deprecatedHere = modelsToTry.filter((m) =>
        isModelDeprecated(target.provider, m)
      );
      modelsToTry = modelsToTry.filter((m) => !isModelDeprecated(target.provider, m));

      // Semua kandidat pernah 404 → tetap coba satu (mungkin 404-nya sementara),
      // dan catat ke telemetry supaya Bos tahu harus set env model.
      if (modelsToTry.length === 0) {
        modelsToTry = (
          deprecatedHere.length > 0
            ? deprecatedHere
            : resolveProviderModels(target.provider, liveModels)
        ).slice(0, 1);
      } else {
        modelsToTry = modelsToTry.slice(0, 6);
      }

      // v9.4c — kuota gratis harian sifatnya per AKUN, bukan per model.
      // Begitu kena, semua kandidat model lain akan kena hal yang sama.
      let quotaExhaustedForProvider = false;

      for (let mIdx = 0; mIdx < modelsToTry.length; mIdx += 1) {
        if (quotaExhaustedForProvider) break;
        const model = modelsToTry[mIdx];
        // 1 retry untuk 5xx/429 (server gratis kadang antre sesaat), 0 untuk error non-transien.
        // Dibatasi supaya total waktu tetap di bawah batas fungsi serverless.
        const maxRetries = 1;

        for (let retry = 0; retry <= maxRetries; retry += 1) {
          if (Date.now() - callStartedAtMs > HARD_DEADLINE_MS) {
            deadlineHit = true;
            attempts.push({
              provider: target.provider,
              model,
              ok: false,
              durationMs: Date.now() - callStartedAtMs,
              skippedReason: "DEADLINE",
              error: `Batas waktu ${Math.round(HARD_DEADLINE_MS / 1000)}s tercapai sebelum provider merespons.`,
            });
            break;
          }
          const start = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          try {
            const bodyPayload: Record<string, unknown> = {
              model,
              temperature,
              max_tokens: safeMaxTokens,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            };

            if (
              expectJson &&
              (target.provider === "groq" || target.provider === "gemini")
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

            const res = await fetchImpl(target.endpoint, {
              method: "POST",
              headers,
              body: JSON.stringify(bodyPayload),
              signal: controller.signal,
            });

            const durationMs = Date.now() - start;

            if (!res.ok) {
              const errText = await res.text().catch(() => "");
              const shortErr = sanitizeErrorMessage(errText || res.statusText);
              const isRateLimit = res.status === 429;
              if (isRateLimit) sawRateLimit = true;
              const modelMissing = isModelNotFoundError(res.status, shortErr);

              /*
               * v9.4 — Penyelamat 404 Gemini.
               * Endpoint kompatibilitas OpenAI kadang tidak mengenal model yang
               * justru hidup di endpoint native (`:generateContent`) — persis
               * kasus "This model ... is not found for API version v1beta" di
               * panel telemetry. Sebelum menyerah: coba jalur native.
               */
              if (target.provider === "gemini" && modelMissing && apiKey) {
                const native = await callGeminiNative(
                  {
                    model,
                    systemPrompt,
                    userPrompt,
                    temperature,
                    maxTokens: safeMaxTokens,
                    expectJson,
                    apiKey,
                  },
                  fetchImpl,
                  Math.min(timeoutMs, 12_000)
                );
                const totalDurationMs = Date.now() - start;
                const nativeParse = native.ok
                  ? parseModelOutput<T>(native.rawText, Boolean(expectJson))
                  : { ok: false as const, error: native.error ?? "Gemini native gagal" };

                if (native.ok && nativeParse.ok) {
                  return finalizeSuccess({
                    provider: target.provider,
                    model: `${model} (native)`,
                    rawText: native.rawText,
                    parsed: nativeParse.parsed,
                    status: native.status,
                    durationMs: totalDurationMs,
                    usage: native.usage,
                  });
                }

                if (isModelNotFoundError(native.status, native.error ?? "")) {
                  markModelDeprecated(target.provider, model);
                }

                const nativeErr = !native.ok
                  ? native.error ?? "Gemini native gagal"
                  : !nativeParse.ok
                    ? nativeParse.error
                    : "Gemini native gagal";
                recordProviderFailure(
                  target.provider,
                  totalDurationMs,
                  `HTTP ${res.status}: ${shortErr} · native ${native.status}: ${nativeErr}`,
                  false,
                  native.status || res.status
                );
                attempts.push({
                  provider: target.provider,
                  model,
                  ok: false,
                  status: res.status,
                  durationMs: totalDurationMs,
                  error: `HTTP ${res.status} (compat) + native ${native.status}: ${nativeErr}`,
                });
                break;
              }

              if (modelMissing) {
                markModelDeprecated(target.provider, model);
              }

              const dailyQuotaGone = isDailyFreeQuotaError(shortErr);
              recordProviderFailure(
                target.provider,
                durationMs,
                `HTTP ${res.status}: ${shortErr}`,
                isRateLimit,
                res.status,
                dailyQuotaGone
              );

              attempts.push({
                provider: target.provider,
                model,
                ok: false,
                status: res.status,
                durationMs,
                rateLimited: isRateLimit,
                error: `HTTP ${res.status}: ${shortErr}`,
              });

              /*
               * v9.4c — 429 kuota gratis HARIAN (OpenRouter `free-models-per-day`).
               * Model lain di akun yang sama pasti kena juga, jadi jangan
               * buang waktu: hentikan provider ini, biarkan router pindah.
               */
              if (dailyQuotaGone) {
                quotaExhaustedForProvider = true;
                break;
              }

              /*
               * Retry hanya untuk gangguan yang benar-benar sesaat.
               * 503 "high demand" TIDAK diulang di model yang sama — langsung
               * pindah model/provider supaya Bos tidak menunggu 2x timeout.
               */
              const retryable =
                res.status === 429 || res.status === 500 || res.status === 502;
              if (retryable && retry < maxRetries) {
                const retryAfterSec = Number(res.headers?.get?.("retry-after") || "0");
                const backoffMs =
                  retryAfterSec > 0
                    ? Math.min(retryAfterSec * 1000, 6000)
                    : Math.min(1200 * Math.pow(2, retry), 4800) +
                      Math.floor(Math.random() * 400);
                await sleepMs(backoffMs);
                continue;
              }
              break;
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
              recordProviderFailure(
                target.provider,
                durationMs,
                "Respons AI kosong.",
                false,
                res.status
              );
              attempts.push({
                provider: target.provider,
                model,
                ok: false,
                status: res.status,
                durationMs,
                error: "Respons AI kosong.",
              });
              break;
            }

            const parseResult = parseModelOutput<T>(rawText, Boolean(expectJson));
            if (!parseResult.ok) {
              lastParseError = parseResult.error;
              recordProviderFailure(
                target.provider,
                durationMs,
                `JSON tidak valid: ${lastParseError}`,
                false,
                res.status
              );
              attempts.push({
                provider: target.provider,
                model,
                ok: false,
                status: res.status,
                durationMs,
                error: `JSON tidak valid: ${lastParseError}`,
              });
              break;
            }

            return finalizeSuccess({
              provider: target.provider,
              model,
              rawText,
              parsed: parseResult.parsed,
              status: res.status,
              durationMs,
              usage: {
                promptTokens: json.usage?.prompt_tokens ?? 0,
                completionTokens: json.usage?.completion_tokens ?? 0,
                totalTokens: json.usage?.total_tokens ?? 0,
              },
              headers: res.headers,
            });
          } catch (err) {
            const durationMs = Date.now() - start;
            const rawMessage =
              err instanceof Error && err.name === "AbortError"
                ? `Timeout melebihi ${Math.round(timeoutMs / 1000)} detik`
                : err instanceof Error
                ? err.message
                : "Kesalahan jaringan saat menghubungi provider AI";
            const safeMsg = sanitizeErrorMessage(rawMessage);

            recordProviderFailure(target.provider, durationMs, safeMsg, false);

            attempts.push({
              provider: target.provider,
              model,
              ok: false,
              durationMs,
              error: safeMsg,
            });

            if (retry < maxRetries) {
              await sleepMs(900 * (retry + 1));
              continue;
            }
            break;
          } finally {
            clearTimeout(timeoutId);
          }
        }
      }

      if (!failedPrimary) {
        failedPrimary = target.provider;
      }

      if (deadlineHit) break;
    }

    totalFailures += 1;

    if (sawRateLimit) {
      const quotaProviders = (["gemini", "groq", "openrouter"] as LlmProviderId[])
        .filter((id) => providerStates[id].dailyQuotaExhausted)
        .map((id) => PROVIDER_TARGETS[id].label);
      return {
        ok: false,
        code: "ALL_PROVIDERS_RATE_LIMITED",
        error:
          quotaProviders.length > 0
            ? `Kuota gratis HARIAN habis: ${quotaProviders.join(", ")} (HTTP 429).`
            : "Seluruh provider AI sedang terkena rate limit sementara (HTTP 429).",
        hint:
          quotaProviders.length > 0
            ? "Ini bukan API key rusak. Kuota gratis harian pulih sendiri saat reset (00:00 UTC); " +
              "di OpenRouter limit naik ke 1.000 request/hari kalau akun pernah membeli kredit ≥10 USD."
            : "Tunggu 15–30 detik lalu coba lagi, atau pastikan GEMINI_API_KEY, GROQ_API_KEY, dan OPENROUTER_API_KEY aktif di Vercel.",
        httpStatus: 429,
        attempts,
        taskClassification: classification,
      };
    }

    if (lastParseError) {
      return {
        ok: false,
        code: "INVALID_JSON_RESPONSE",
        error: `Model AI mengembalikan format tidak sesuai JSON: ${sanitizeErrorMessage(
          lastParseError
        )}`,
        hint: "Klik Retry untuk mengulang permintaan.",
        httpStatus: 502,
        attempts,
        taskClassification: classification,
      };
    }

    const failureDetail = summarizeProviderFailures(attempts);
    if (deadlineHit) {
      return {
        ok: false,
        code: "ALL_PROVIDERS_FAILED",
        error: `Provider AI tidak merespons dalam ${Math.round(HARD_DEADLINE_MS / 1000)} detik. Rincian: ${failureDetail}`,
        hint:
          "Coba lagi (server gratis kadang antre), atau cek /api/ai/test-providers untuk melihat provider mana yang lambat.",
        httpStatus: 504,
        attempts,
        taskClassification: classification,
      };
    }
    return {
      ok: false,
      code: "ALL_PROVIDERS_FAILED",
      error: `Semua provider AI gagal. Penyebab: ${failureDetail}`,
      hint:
        "Buka /api/ai/test-providers (GET) untuk tes live per provider. " +
        "Penyebab umum: API key kedaluwarsa/kuota habis, atau nama model sudah di-deprecate — " +
        "router otomatis mencoba model lain yang tersedia dari /models provider.",
      httpStatus: 502,
      attempts,
      taskClassification: classification,
    };
  } finally {
    releaseConcurrencySlot();
  }
}

/** Backward-compatible export used across existing API routes */
export const callFreeTierLLM = callCentralAIRouter;
