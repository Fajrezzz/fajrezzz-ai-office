import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  callGeminiNative,
  classifyProviderError,
  cooldownMsForFailure,
  describeErrorClass,
  describeProviderError,
  isDailyFreeQuotaError,
  isKnownBogusModel,
  OPENROUTER_FREE_MODELS,
  isTransientErrorClass,
  getRouterTelemetrySnapshot,
  isModelDeprecated,
  isModelNotFoundError,
  markModelDeprecated,
  parseModelOutput,
  resetDeprecatedModels,
  resolveProviderModels,
} from "../src/lib/ai/llm-provider.ts";

/**
 * v9.4 — Perbaikan error "HTTP 404 · This model ... is not found for API version v1beta"
 * yang muncul di panel Telemetry (Google Gemini 0/4) dan model Groq yang tidak valid.
 *
 * Yang diuji:
 *  1. Model alias stabil didahulukan supaya tidak cepat basi.
 *  2. Nama model bisa diganti lewat env tanpa deploy.
 *  3. Model 404 di-memo & di-skip (tidak menghabiskan kuota).
 *  4. Jalur native Gemini dipakai sebagai penyelamat kalau endpoint compat 404.
 */

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

test("v9.4 gemini: alias `gemini-flash-latest` didahulukan sebelum versi beku", () => {
  const models = resolveProviderModels("gemini");
  assert.equal(models[0], "gemini-flash-latest");
  assert.ok(models.includes("gemini-2.5-flash"));
  // tidak ada duplikat
  assert.equal(new Set(models).size, models.length);
});

test("v9.4 model bisa diganti tanpa deploy lewat env GEMINI_MODEL / GROQ_MODEL", () => {
  const prevGemini = process.env.GEMINI_MODEL;
  const prevGroq = process.env.GROQ_MODEL;
  try {
    process.env.GEMINI_MODEL = "gemini-3-flash, gemini-2.5-flash";
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    assert.deepEqual(resolveProviderModels("gemini"), [
      "gemini-3-flash",
      "gemini-2.5-flash",
    ]);
    assert.deepEqual(resolveProviderModels("groq"), ["llama-3.3-70b-versatile"]);
  } finally {
    if (prevGemini === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = prevGemini;
    if (prevGroq === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = prevGroq;
  }
});

test("v9.4 openrouter: env override tetap dijaga hanya model :free", () => {
  const prev = process.env.OPENROUTER_MODEL;
  try {
    process.env.OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free, some/paid-model";
    const models = resolveProviderModels("openrouter");
    assert.deepEqual(models, ["meta-llama/llama-3.3-70b-instruct:free"]);
  } finally {
    if (prev === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = prev;
  }
});

test("v9.4: deteksi error model-tidak-ada (404 & varian pesannya)", () => {
  assert.equal(
    isModelNotFoundError(404, "This model gemini-2.5-flash is not found for API version v1beta"),
    true
  );
  assert.equal(isModelNotFoundError(404, "Not Found"), true);
  assert.equal(
    isModelNotFoundError(400, "models/gemini-x does not exist"),
    true
  );
  assert.equal(isModelNotFoundError(429, "Rate limit exceeded"), false);
  assert.equal(isModelNotFoundError(500, "internal error"), false);
});

test("v9.4: model 404 di-memo 15 menit lalu dilepas otomatis", () => {
  resetDeprecatedModels();
  const t0 = 1_000_000;
  markModelDeprecated("gemini", "gemini-2.5-flash", t0);
  assert.equal(isModelDeprecated("gemini", "gemini-2.5-flash", t0 + 60_000), true);
  // case-insensitive
  assert.equal(isModelDeprecated("gemini", "Gemini-2.5-Flash", t0 + 60_000), true);
  // provider lain tidak terpengaruh
  assert.equal(isModelDeprecated("groq", "gemini-2.5-flash", t0 + 60_000), false);
  // kedaluwarsa
  assert.equal(isModelDeprecated("gemini", "gemini-2.5-flash", t0 + 16 * 60_000), false);
  resetDeprecatedModels();
});

test("v9.4: callGeminiNative memakai endpoint :generateContent dan mem-parse kandidat", async () => {
  let calledUrl = "";
  let sentBody: Record<string, unknown> = {};
  const fetchMock = (async (url: string, init: RequestInit) => {
    calledUrl = String(url);
    sentBody = JSON.parse(String(init.body));
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        usageMetadata: {
          promptTokenCount: 12,
          candidatesTokenCount: 5,
          totalTokenCount: 17,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as unknown as typeof fetch;

  const result = await callGeminiNative(
    {
      model: "gemini-flash-latest",
      systemPrompt: "SISTEM",
      userPrompt: "HALO",
      expectJson: true,
      apiKey: "AIza-placeholder",
    },
    fetchMock
  );

  assert.equal(result.ok, true);
  assert.equal(result.rawText, '{"ok":true}');
  assert.equal(result.usage.totalTokens, 17);
  assert.match(calledUrl, /\/v1beta\/models\/gemini-flash-latest:generateContent\?key=/);
  const sys = sentBody.systemInstruction as { parts: { text: string }[] };
  assert.equal(sys.parts[0].text, "SISTEM");
  const gen = sentBody.generationConfig as { responseMimeType?: string };
  assert.equal(gen.responseMimeType, "application/json");
});

test("v9.4: callGeminiNative melaporkan 404 dengan status & pesan (tanpa membocorkan key)", async () => {
  const fetchMock = (async () =>
    new Response(
      JSON.stringify({ error: { code: 404, message: "models/x is not found for API version v1beta" } }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    )) as unknown as typeof fetch;

  const result = await callGeminiNative(
    { model: "models/gemini-x", systemPrompt: "s", userPrompt: "u", apiKey: "AIza-secret-key-value" },
    fetchMock
  );
  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.match(result.error ?? "", /not found/);
  assert.doesNotMatch(result.error ?? "", /AIza-secret-key-value/);
});

test("v9.4: parseModelOutput menangani JSON berpagar ```json```", () => {
  const fenced = parseModelOutput<{ a: number }>('```json\n{"a":1}\n```', true);
  assert.equal(fenced.ok, true);
  if (fenced.ok) assert.deepEqual(fenced.parsed, { a: 1 });
  const broken = parseModelOutput("{bukan json", true);
  assert.equal(broken.ok, false);
  const text = parseModelOutput("teks biasa", false);
  assert.equal(text.ok, true);
  if (text.ok) assert.equal(text.parsed, "teks biasa");
});

test("v9.4: telemetry menyertakan model mati + env var pengganti model", () => {
  resetDeprecatedModels();
  markModelDeprecated("gemini", "gemini-2.5-flash");
  const snapshot = getRouterTelemetrySnapshot();
  const gemini = snapshot.providers.find((p) => p.provider === "gemini");
  assert.ok(gemini);
  assert.deepEqual(gemini.deprecatedModels, ["gemini-2.5-flash"]);
  assert.equal(gemini.modelEnvVar, "GEMINI_MODEL");
  assert.equal(gemini.preferredModels[0], "gemini-flash-latest");
  resetDeprecatedModels();
});

test("v9.4c: router memakai model live DULU & melewati model mati", () => {
  const source = read("src/lib/ai/llm-provider.ts");
  // v9.4c: discovery diambil sebelum kandidat disusun (dulu ditambahkan di belakang)
  assert.match(source, /resolveProviderModels\(target\.provider, liveModels\)/);
  assert.match(source, /if \(modelMissing\) \{\s*markModelDeprecated\(target\.provider, model\);/);
  assert.match(source, /target\.provider === "gemini" && modelMissing && apiKey/);
  assert.match(source, /native \$\{native\.status\}/);
});

test("v9.4: panel telemetry menjelaskan cara memperbaiki model 404", () => {
  const panel = read("src/components/dashboard/AiRouterMonitoringPanel.tsx");
  assert.match(panel, /Nama model sudah tidak tersedia \(404\)/);
  assert.match(panel, /p\.modelEnvVar/);
  assert.match(panel, /Model ini tidak dikenali provider/);
});

/* ============================================================================
 * BAGIAN 2 (screenshot 23:12) — "Serius ini jadi error semua api key nya?"
 * Semua provider tampak merah padahal key sehat: Gemini membalas
 * 503 "This model is currently experiencing high demand" dan Groq memakai
 * model live yang valid. Yang salah adalah cara router MENJELASKAN error.
 * ========================================================================== */

test("v9.4b: kelas error membedakan key rusak vs provider sibuk", () => {
  assert.equal(classifyProviderError(401, "invalid api key"), "KEY_INVALID");
  assert.equal(classifyProviderError(403, "permission denied"), "KEY_INVALID");
  assert.equal(classifyProviderError(429, "rate limit exceeded"), "RATE_LIMIT");
  assert.equal(
    classifyProviderError(
      503,
      'This model is currently experiencing high demand. Spikes in demand are usually temporary.'
    ),
    "OVERLOADED"
  );
  assert.equal(classifyProviderError(500, "internal error"), "OVERLOADED");
  assert.equal(classifyProviderError(404, "model not found"), "MODEL_GONE");
  assert.equal(classifyProviderError(400, "The model has been decommissioned"), "MODEL_GONE");
  assert.equal(classifyProviderError(408, "request timeout"), "TIMEOUT");
  assert.equal(classifyProviderError(200, "Respons AI kosong."), "UNKNOWN");
});

test("v9.4b: 503 & 429 dianggap transient, 401 & 404 tidak", () => {
  assert.equal(isTransientErrorClass("OVERLOADED"), true);
  assert.equal(isTransientErrorClass("RATE_LIMIT"), true);
  assert.equal(isTransientErrorClass("TIMEOUT"), true);
  assert.equal(isTransientErrorClass("KEY_INVALID"), false);
  assert.equal(isTransientErrorClass("MODEL_GONE"), false);
  assert.match(describeErrorClass("OVERLOADED"), /bukan kerusakan API key/i);
  assert.match(describeErrorClass("RATE_LIMIT"), /bukan kerusakan API key/i);
  assert.match(describeErrorClass("KEY_INVALID"), /401\/403/);
});

test("v9.4b: 503 high demand TIDAK dianggap model pensiun (jangan buang kuota)", () => {
  assert.equal(
    isModelNotFoundError(
      503,
      "This model is currently experiencing high demand. Spikes in demand are usually temporary."
    ),
    false
  );
  assert.equal(isModelNotFoundError(429, "rate limit"), false);
  assert.equal(isModelNotFoundError(500, "model overloaded"), false);
});

test("v9.4b: cooldown circuit pendek untuk provider sibuk, panjang untuk key ditolak", () => {
  const source = read("src/lib/ai/llm-provider.ts");
  assert.match(source, /CIRCUIT_COOLDOWN_TRANSIENT_MS = 8_000/);
  assert.match(source, /CIRCUIT_COOLDOWN_KEY_INVALID_MS = 5 \* 60_000/);
  assert.match(source, /isTransientErrorClass\(errorClass\)/);
  // 503 tidak di-retry di model yang sama
  assert.match(source, /res\.status === 429 \|\| res\.status === 500 \|\| res\.status === 502/);
});

test("v9.4b: panel menampilkan status key sehat + penjelasan error provider sibuk", () => {
  const panel = read("src/components/dashboard/AiRouterMonitoringPanel.tsx");
  assert.match(panel, /API KEY SEHAT/);
  assert.match(panel, /Cara baca panel ini/);
  assert.match(panel, /Provider sibuk:/);
  assert.match(panel, /bukan kerusakan API key|API key tetap sehat/i);
});

/* ============================================================================
 * v9.4c — screenshot 23:31: OpenRouter 0/9 (model :free sudah delist + 429
 * `free-models-per-day`), Gemini 404 "no longer available to new users".
 * Inti perbaikan: model LIVE dari /models didahulukan, ID palsu dibuang, dan
 * kuota gratis HARIAN tidak lagi disamakan dengan "key rusak".
 * ========================================================================== */

test("v9.4c: `openrouter/free` (ID palsu, selalu 404) tidak pernah dikirim ke provider", () => {
  assert.equal(isKnownBogusModel("openrouter/free"), true);
  assert.equal(isKnownBogusModel("meta-llama/llama-3.3-70b-instruct:free"), false);
  assert.ok(
    !(OPENROUTER_FREE_MODELS as readonly string[]).includes("openrouter/free"),
    "daftar statis masih memuat openrouter/free"
  );
  const models = resolveProviderModels("openrouter");
  assert.ok(!models.includes("openrouter/free"));
  assert.ok(models.every((m) => m.endsWith(":free")));
});

test("v9.4c: model hasil discovery didahulukan di atas daftar statis", () => {
  const live = ["qwen/qwen3-235b-a22b:free", "deepseek/deepseek-chat:free"];
  const models = resolveProviderModels("openrouter", live);
  assert.deepEqual(models.slice(0, 2), live);
  assert.ok(models.includes("meta-llama/llama-3.3-70b-instruct:free"));
  assert.equal(new Set(models).size, models.length);

  const gemini = resolveProviderModels("gemini", ["gemini-3-flash-preview"]);
  assert.equal(gemini[0], "gemini-3-flash-preview");
  assert.ok(gemini.includes("gemini-flash-latest"));
});

test("v9.4c: env override tetap menang di atas discovery & daftar statis", () => {
  const original = process.env.OPENROUTER_MODEL;
  process.env.OPENROUTER_MODEL = "some-vendor/model:free";
  try {
    const models = resolveProviderModels("openrouter", ["qwen/qwen3-8b:free"]);
    assert.equal(models[0], "some-vendor/model:free");
  } finally {
    if (original === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = original;
  }
});

test("v9.4c: 429 `free-models-per-day` dikenali sebagai kuota HARIAN", () => {
  const msg =
    'HTTP 429: {"error":{"message":"Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day"}}';
  assert.equal(isDailyFreeQuotaError(msg), true);
  assert.equal(isDailyFreeQuotaError("daily quota reached"), true);
  assert.equal(isDailyFreeQuotaError("This model is currently experiencing high demand"), false);
  assert.equal(isDailyFreeQuotaError("HTTP 429: too many requests"), false);
});

test("v9.4c: pesan kuota harian tidak lagi menyebut key bermasalah", () => {
  const { errorClass, hint } = describeProviderError(
    429,
    "Rate limit exceeded: free-models-per-day."
  );
  assert.equal(errorClass, "RATE_LIMIT");
  assert.match(hint, /kuota gratis HARIAN/i);
  assert.match(hint, /bukan API key rusak/i);
  assert.match(hint, /1\.000 request\/hari/i);
  assert.match(hint, /00:00 UTC/);

  // 503 tetap memakai penjelasan "provider sibuk"
  const overloaded = describeProviderError(503, "This model is experiencing high demand");
  assert.equal(overloaded.errorClass, "OVERLOADED");
  assert.match(overloaded.hint, /bukan kerusakan API key/i);
});

test("v9.4c: cooldown kuota harian 30 menit, transient tetap 8 detik", () => {
  assert.equal(cooldownMsForFailure("RATE_LIMIT", true), 30 * 60_000);
  assert.equal(cooldownMsForFailure("RATE_LIMIT", false), 8_000);
  assert.equal(cooldownMsForFailure("OVERLOADED", false), 8_000);
  assert.equal(cooldownMsForFailure("KEY_INVALID", false), 5 * 60_000);
  assert.equal(cooldownMsForFailure("MODEL_GONE", false), 12_000);
});

test("v9.4c: router berhenti mencoba model lain saat kuota akun habis", () => {
  const source = read("src/lib/ai/llm-provider.ts");
  // discovery diambil SEBELUM daftar model disusun (bukan ditambahkan di belakang)
  assert.match(source, /const liveModels = apiKey[\s\S]{0,120}discoverLiveModels/);
  assert.match(source, /resolveProviderModels\(target\.provider, liveModels\)/);
  // kuota harian menghentikan seluruh provider, bukan cuma satu model
  assert.match(source, /quotaExhaustedForProvider = true/);
  assert.match(source, /if \(quotaExhaustedForProvider\) break;/);
  assert.match(source, /CIRCUIT_COOLDOWN_DAILY_QUOTA_MS = 30 \* 60_000/);
});

test("v9.4c: panel punya badge kuota harian & contoh model per provider", () => {
  const panel = read("src/components/dashboard/AiRouterMonitoringPanel.tsx");
  assert.match(panel, /KUOTA HARIAN HABIS/);
  assert.match(panel, /Kuota gratis harian habis \(bukan key rusak\)/);
  assert.match(panel, /function modelEnvExample/);
  assert.match(panel, /function freeModelsPerDay/);
  assert.match(panel, /1\.000 req\/hari/);
});

/* ============================================================================
 * v9.4d — "Gemini masih sama aja".
 * Karena menebak nama model tidak menyelesaikan apa pun, jalur Gemini diubah:
 * endpoint NATIVE dipakai lebih dulu, dan sebab asli error ditampilkan ke Bos
 * (plus halaman Katalog Model untuk melihat model yang benar-benar terbuka).
 * ========================================================================== */

test("v9.4d: Gemini memakai endpoint native lebih dulu, compat jadi cadangan", () => {
  const source = read("src/lib/ai/llm-provider.ts");
  const nativeIdx = source.indexOf('if (target.provider === "gemini" && apiKey && retry === 0) {');
  const bodyIdx = source.indexOf("const bodyPayload: Record<string, unknown> = {");
  assert.ok(nativeIdx > 0, "blok native-first tidak ditemukan");
  assert.ok(nativeIdx < bodyIdx, "native harus dicoba sebelum request compat");
  // model yang 404 di jalur native tidak dibuang kuotanya di jalur compat
  assert.match(source, /if \(nativeClass === "MODEL_GONE"\)/);
});

test("v9.4d: hint khusus untuk model yang ditutup bagi project baru", () => {
  const retired = describeProviderError(
    404,
    '{"error":{"code":404,"message":"This model models/gemini-2.5-flash-lite is no longer available to new users."}}'
  );
  assert.equal(retired.errorClass, "MODEL_GONE");
  assert.match(retired.hint, /project\/akun BARU/i);
  assert.match(retired.hint, /GEMINI_MODEL/);
  assert.match(retired.hint, /model-catalog/);
});

test("v9.4d: halaman katalog model tersedia & tidak pernah membocorkan key", () => {
  const route = read("src/app/api/ai/model-catalog/route.ts");
  assert.match(route, /generativelanguage\.googleapis\.com\/v1beta\/models/);
  assert.match(route, /keyPresent/);
  assert.match(route, /sanitizeErrorMessage/);
  assert.match(route, /format === "json"/);
  // key hanya dibaca dari env untuk request keluar, tidak dimasukkan ke payload
  assert.ok(!/apiKey:\s*apiKey/.test(route), "payload tidak boleh memuat apiKey");
  assert.ok(!/key:\s*apiKey[,}]/.test(route), "payload tidak boleh memuat key");
});

test("v9.4d: Tes Live Provider menampilkan error mentah (disanitasi)", () => {
  const route = read("src/app/api/ai/test-providers/route.ts");
  assert.match(route, /rawError/);
  assert.match(route, /sanitizeErrorMessage\(/);
  const panel = read("src/components/dashboard/AiRouterMonitoringPanel.tsx");
  assert.match(panel, /r\.rawError/);
  assert.match(panel, /\/api\/ai\/model-catalog\?provider=/);
});

test("v9.4d: katalog menguji jalur native di v1beta DAN v1", () => {
  const route = read("src/app/api/ai/model-catalog/route.ts");
  assert.match(route, /probeNativeVersion/);
  assert.match(route, /"v1beta"/);
  assert.match(route, /"v1"/);
  assert.match(route, /probeNativeVersion\(model, apiKey, "v1"\)/);
});
