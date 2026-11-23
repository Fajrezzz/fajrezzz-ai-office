import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  callGeminiNative,
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

test("v9.4: router mencoba model live SETELAH model kurasi & melewati model mati", () => {
  const source = read("src/lib/ai/llm-provider.ts");
  assert.match(source, /const merged = \[\.\.\.modelsToTry, \.\.\.liveModels\];/);
  assert.match(source, /if \(modelMissing\) \{\s*markModelDeprecated\(target\.provider, model\);/);
  assert.match(source, /target\.provider === "gemini" && modelMissing && apiKey/);
  assert.match(source, /native \$\{native\.status\}/);
});

test("v9.4: panel telemetry menjelaskan cara memperbaiki model 404", () => {
  const panel = read("src/components/dashboard/AiRouterMonitoringPanel.tsx");
  assert.match(panel, /Model 404 \/ pensiun/);
  assert.match(panel, /p\.modelEnvVar/);
  assert.match(panel, /Model ini tidak dikenali provider/);
});
