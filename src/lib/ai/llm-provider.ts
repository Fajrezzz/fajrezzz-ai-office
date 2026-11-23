/**
 * FAJREZZZ AI OFFICE — CENTRAL AI ROUTER (Server-Side ONLY)
 *
 * Unified multi-provider router governing:
 *  1. Google Gemini (`GEMINI_API_KEY`) — Primary for complex reasoning, research, planning, strategy & agent decisions
 *  2. Groq (`GROQ_API_KEY`) — Primary for fast low-latency tasks, classification, summarization & text processing
 *  3. OpenRouter (`OPENROUTER_API_KEY`, https://openrouter.ai/api/v1) — Free-model (`:free`) alternative & fallback
 *  4. Pollinations.AI (Keyless fallback lane) — Optional final Rp 0 safety net
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

export type LlmProviderId =
  | "gemini"
  | "groq"
  | "openrouter"
  | "mistral"
  | "pollinations";

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
    | "PAID_MODEL_BLOCKED";
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

export const OPENROUTER_FREE_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "qwen/qwen3-coder:free",
] as const;

const PROVIDER_TARGETS: Record<LlmProviderId, ProviderTarget> = {
  gemini: {
    provider: "gemini",
    label: "Google Gemini",
    envVar: "GEMINI_API_KEY",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    role: "Primary: Reasoning, Research, Planning, Strategy & Agent Decisions",
  },
  groq: {
    provider: "groq",
    label: "Groq Cloud",
    envVar: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
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
  mistral: {
    provider: "mistral",
    label: "Mistral AI (Optional)",
    envVar: "MISTRAL_API_KEY",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    models: ["mistral-small-latest"],
    role: "Optional Free Experiment Secondary",
  },
  pollinations: {
    provider: "pollinations",
    label: "Pollinations AI (Keyless Fallback)",
    envVar: null,
    keyless: true,
    endpoint: "https://text.pollinations.ai/openai/chat/completions",
    models: ["openai-fast", "openai"],
    role: "Final Rp 0 Keyless Safety Net",
  },
};

const FREE_TIER_SUMMARIES: Record<LlmProviderId, string> = {
  gemini:
    "Primary reasoning/research/planning (Gemini 2.5 Flash & Flash-Lite Free Tier)",
  groq:
    "Primary ultra-fast latency/classification/summary (Llama 3.3 70B & 3.1 8B Free Tier)",
  openrouter:
    "Fallback & alternative via https://openrouter.ai/api/v1 (hanya model :free secara default)",
  mistral: "Opsional Free Experiment mode",
  pollinations: "Jalur cadangan terakhir tanpa API key (Rp 0)",
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

/** Enforces that OpenRouter only invokes free models unless explicitly overridden */
export function isOpenRouterFreeModel(model: string): boolean {
  const clean = model.trim().toLowerCase();
  return clean === "openrouter/free" || clean.endsWith(":free");
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
      fallbackChain: ["gemini", "groq", "openrouter", "mistral", "pollinations"],
      reason,
    };
  }

  return {
    taskType: resolvedType,
    complexity,
    primaryProvider: "groq",
    fallbackChain: ["groq", "gemini", "openrouter", "mistral", "pollinations"],
    reason,
  };
}

/* ============================================================================
 * INTERNAL STATE: Circuit Breaker, Concurrency Queue, Cache & Health Telemetry
 * ========================================================================== */

const MAX_CONCURRENT_REQUESTS = 3;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 45_000;
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
}

interface CacheRecord {
  expiresAt: number;
  result: LlmCallResult<unknown>;
}

const providerStates: Record<LlmProviderId, InternalProviderState> = {
  gemini: createInitialProviderState(PROVIDER_TARGETS.gemini.models[0]),
  groq: createInitialProviderState(PROVIDER_TARGETS.groq.models[0]),
  openrouter: createInitialProviderState(PROVIDER_TARGETS.openrouter.models[0]),
  mistral: createInitialProviderState(PROVIDER_TARGETS.mistral.models[0]),
  pollinations: createInitialProviderState(PROVIDER_TARGETS.pollinations.models[0]),
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
  isRateLimit: boolean
): void {
  const st = providerStates[provider];
  st.failureCount += 1;
  st.consecutiveFailures += 1;
  st.lastLatencyMs = durationMs;
  if (isRateLimit) st.rateLimitHits += 1;
  st.lastError = sanitizeErrorMessage(errorMsg);
  st.lastCheckedAt = new Date().toISOString();

  if (st.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    st.circuitState = "OPEN";
    st.circuitOpenedUntilMs = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

export function isProviderConfigured(provider: LlmProviderId): boolean {
  const t = PROVIDER_TARGETS[provider];
  if (!t) return false;
  return Boolean(t.keyless || (t.envVar && process.env[t.envVar]?.trim()));
}

export function getRouterTelemetrySnapshot(): RouterTelemetrySnapshot {
  const orderedIds: LlmProviderId[] = [
    "gemini",
    "groq",
    "openrouter",
    "pollinations",
  ];
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
  const orderedIds: LlmProviderId[] = [
    "gemini",
    "groq",
    "openrouter",
    "mistral",
    "pollinations",
  ];
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
      : "Pollinations Keyless Fallback";

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
      "Central AI Router aktif: Gemini (reasoning/planning), Groq (fast/low-latency), OpenRouter (:free models only secara default), dengan circuit breaker, queue concurrency, dan fallback otomatis.",
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

  const attempts: ProviderAttempt[] = [];
  let sawRateLimit = false;
  let lastParseError: string | null = null;
  let failedPrimary: LlmProviderId | null = null;

  totalRequests += 1;
  await acquireConcurrencySlot();

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

      // Resolve candidate models for this provider
      let modelsToTry =
        preferredProvider === target.provider && preferredModel
          ? [preferredModel]
          : [...target.models];

      if (target.provider === "openrouter" && !allowPaidOpenRouter) {
        modelsToTry = modelsToTry.filter((m) => isOpenRouterFreeModel(m));
      }

      for (let mIdx = 0; mIdx < modelsToTry.length; mIdx += 1) {
        const model = modelsToTry[mIdx];
        const maxRetries = 1; // Bounded retry (max 1 retry with exponential backoff)

        for (let retry = 0; retry <= maxRetries; retry += 1) {
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

              recordProviderFailure(
                target.provider,
                durationMs,
                `HTTP ${res.status}: ${shortErr}`,
                isRateLimit
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

              // Bounded exponential backoff retry only on transient 5xx or 429
              if ((res.status === 429 || res.status >= 500) && retry < maxRetries) {
                const retryAfterSec = Number(res.headers?.get?.("retry-after") || "0");
                const backoffMs =
                  retryAfterSec > 0
                    ? Math.min(retryAfterSec * 1000, 2500)
                    : Math.min(600 * Math.pow(2, retry), 2000);
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
                false
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

            let parsed: T;
            if (expectJson) {
              try {
                parsed = JSON.parse(extractJsonString(rawText)) as T;
              } catch (parseErr) {
                lastParseError =
                  parseErr instanceof Error
                    ? parseErr.message
                    : "Gagal mem-parse JSON dari AI";
                recordProviderFailure(
                  target.provider,
                  durationMs,
                  `JSON tidak valid: ${lastParseError}`,
                  false
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
            } else {
              parsed = rawText as unknown as T;
            }

            const usage: LlmTokenUsage = {
              promptTokens: json.usage?.prompt_tokens ?? 0,
              completionTokens: json.usage?.completion_tokens ?? 0,
              totalTokens: json.usage?.total_tokens ?? 0,
            };

            recordProviderSuccess(
              target.provider,
              model,
              durationMs,
              usage,
              res.headers
            );

            const fallbackUsed = Boolean(
              failedPrimary && failedPrimary !== target.provider
            );
            if (fallbackUsed && failedPrimary) {
              totalFallbacks += 1;
              providerStates[failedPrimary].fallbackFromCount += 1;
              providerStates[target.provider].fallbackToCount += 1;
              recentFallbacks.unshift({
                at: new Date().toISOString(),
                from: failedPrimary,
                to: target.provider,
                reason:
                  attempts.find((a) => a.provider === failedPrimary)?.error ??
                  "Primary provider error",
              });
              if (recentFallbacks.length > 20) recentFallbacks.pop();
            }

            attempts.push({
              provider: target.provider,
              model,
              ok: true,
              status: res.status,
              durationMs,
            });

            totalSuccesses += 1;

            const successResult: LlmCallResult<T> = {
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
              taskClassification: classification,
              fallbackUsed,
            };

            if (cacheKey) {
              setBoundedCache(cacheKey, successResult as LlmCallResult<unknown>);
            }

            return successResult;
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
              await sleepMs(600);
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
    }

    totalFailures += 1;

    if (sawRateLimit) {
      return {
        ok: false,
        code: "ALL_PROVIDERS_RATE_LIMITED",
        error:
          "Seluruh provider AI sedang terkena rate limit sementara (HTTP 429).",
        hint: "Tunggu 15–30 detik lalu coba lagi, atau pastikan GEMINI_API_KEY, GROQ_API_KEY, dan OPENROUTER_API_KEY aktif di Vercel.",
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

    return {
      ok: false,
      code: "ALL_PROVIDERS_FAILED",
      error: "Semua provider AI gagal merespons permintaan saat ini.",
      hint: "Periksa status provider pada Dashboard Monitoring dan pastikan API key di Vercel valid.",
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
