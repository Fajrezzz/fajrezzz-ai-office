import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  discoverLiveModels,
  resetLiveModelCache,
  summarizeProviderFailures,
  type ProviderAttempt,
} from "../src/lib/ai/llm-provider.ts";
import {
  SECRET_PATTERNS,
  formatSecretReport,
  scanTextForSecrets,
} from "../src/lib/security/secret-scan.ts";
import {
  auditResearchClaim,
  buildResearchRigorPrompt,
} from "../src/lib/ai/research-rigor.ts";
import { buildMemoryRecallForState } from "../src/lib/ai/memory-recall.ts";
import { MODULAR_AGENT_SKILLS } from "../src/lib/ai/advanced-skill-registry.ts";

/* ======================= PESAN ERROR PROVIDER ======================= */

test("v9 error AI menyebut penyebab nyata per provider (bukan 'semua gagal' doang)", () => {
  const attempts: ProviderAttempt[] = [
    {
      provider: "gemini",
      model: "gemini-2.5-flash",
      ok: false,
      status: 404,
      durationMs: 320,
      error: "HTTP 404: models/gemini-2.5-flash is not found",
    },
    {
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
      ok: false,
      status: 404,
      durationMs: 280,
      error: "HTTP 404: models/gemini-2.5-flash-lite is not found",
    },
    {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      ok: false,
      status: 401,
      durationMs: 210,
      error: "HTTP 401: Invalid API Key",
    },
  ];

  const summary = summarizeProviderFailures(attempts);
  assert.match(summary, /gemini\[gemini-2\.5-flash\]/);
  assert.match(summary, /404/);
  assert.match(summary, /groq\[llama-3\.3-70b-versatile\]/);
  assert.match(summary, /401/);
  // satu provider hanya muncul sekali (error pertama yang paling relevan)
  assert.equal(summary.split("gemini[").length - 1, 1);
});

test("v9 error AI membatasi panjang pesan & menangani daftar kosong", () => {
  assert.match(summarizeProviderFailures([]), /Tidak ada provider/);
  const many: ProviderAttempt[] = Array.from({ length: 40 }, (_, i) => ({
    provider: i % 2 === 0 ? "groq" : "openrouter",
    model: `model-${i}-xxxxxxxxxxxxxxxxxxxxxxxx`,
    ok: false,
    durationMs: 10,
    error: `HTTP 500: kegagalan server nomor ${i} dengan pesan panjang`,
  }));
  const summary = summarizeProviderFailures(many, 200);
  assert.ok(summary.length <= 200);
});

/* =================== DISCOVERY MODEL LIVE (anti 404) =================== */

const mockModelsFetch = (payload: unknown, status = 200): typeof fetch =>
  (async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;

test("v9 discovery OpenRouter hanya mengambil model :free dan mengurutkan prioritas", async () => {
  resetLiveModelCache();
  const fetchMock = mockModelsFetch({
    data: [
      { id: "some/paid-model" },
      { id: "google/gemma-3-27b-it:free" },
      { id: "meta-llama/llama-3.3-70b-instruct:free" },
      { id: "openrouter/free" },
    ],
  });
  const models = await discoverLiveModels("openrouter", "sk-or-v1-placeholder", fetchMock);
  assert.ok(models.length >= 1);
  assert.ok(models.every((m) => m === "openrouter/free" || m.endsWith(":free")));
  assert.equal(models[0], "meta-llama/llama-3.3-70b-instruct:free");
  assert.ok(!models.includes("some/paid-model"));
});

test("v9 discovery Gemini memakai /models?key= dan menyaring nama model", async () => {
  resetLiveModelCache();
  let calledUrl = "";
  const fetchMock = (async (input: RequestInfo | URL) => {
    calledUrl = String(input);
    return new Response(
      JSON.stringify({
        models: [
          { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as unknown as typeof fetch;

  const models = await discoverLiveModels("gemini", "AIza-placeholder", fetchMock);
  assert.match(calledUrl, /generativelanguage\.googleapis\.com\/v1beta\/models\?key=/);
  assert.deepEqual(models, ["gemini-2.5-flash"]);
});

test("v9 discovery soft-fail: provider error → daftar kosong, bukan crash", async () => {
  resetLiveModelCache();
  const fetchMock = (async () =>
    new Response("nope", { status: 503 })) as unknown as typeof fetch;
  const models = await discoverLiveModels("groq", "gsk_placeholder", fetchMock);
  assert.deepEqual(models, []);
});

/* ===================== KEAMANAN: SECRET SCAN GATE ===================== */

test("v9 secret scan mendeteksi key nyata dan mengabaikan placeholder", () => {
  const risky = [
    'const key = "AIza' + "B".repeat(35) + '";',
    'GROQ="gsk_' + "c".repeat(40) + '"',
    'OPENROUTER="sk-or-v1-' + "d".repeat(40) + '"',
  ].join("\n");
  const matches = scanTextForSecrets("src/contoh.ts", risky);
  assert.equal(matches.length, 3);
  assert.match(formatSecretReport(matches), /3 potensi secret/);
  // preview tidak boleh membocorkan nilai lengkap
  assert.ok(matches.every((m) => !m.preview.includes("BBBBBBBB")));

  const safe = [
    'const example = "YOUR_API_KEY";',
    "process.env.GEMINI_API_KEY",
    "Bearer [REDACTED_GEMINI_KEY]",
  ].join("\n");
  assert.deepEqual(scanTextForSecrets("src/aman.ts", safe), []);
});

test("v9 tidak ada API key hardcoded di seluruh folder src", () => {
  const root = path.join(process.cwd(), "src");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        for (const match of scanTextForSecrets(full.replace(process.cwd() + "/", ""), content)) {
          found.push(`${match.file}:${match.line}`);
        }
      }
    }
  };
  walk(root);
  assert.deepEqual(found, [], `secret hardcoded ditemukan: ${found.join(", ")}`);
  assert.ok(SECRET_PATTERNS.length >= 5);
});

/* ================== RISET: DISIPLIN ILMIAH (ANTI HOAX) ================== */

test("v9 prompt riset memuat aturan rigor & larangan klaim absolut", () => {
  const prompt = buildResearchRigorPrompt();
  assert.match(prompt, /FAKTA bersumber/);
  assert.match(prompt, /Jangan mencantumkan angka/);
  assert.match(prompt, /tingkat keyakinan/i);
});

test("v9 audit klaim menandai angka tanpa sumber dan klaim berlebihan", () => {
  const bad = auditResearchClaim(
    "Model ini dipakai 87% developer dan pasti viral dengan 2 juta views."
  );
  assert.equal(bad.ok, false);
  assert.ok(bad.unsourcedNumbers.length >= 1);
  assert.ok(bad.overclaims.length >= 1);

  const good = auditResearchClaim(
    "Menurut rilis resmi https://github.com/anthropics/claude-code , ada 12 commit bulan ini (keyakinan: tinggi).",
    { sourcesProvided: true }
  );
  assert.equal(good.ok, true, good.problems.join(" | "));
});

/* ===================== MEMORI: RECALL BERBOBOT ===================== */

test("v9 recall memori memprioritaskan yang relevan & baru", () => {
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 40 * 86_400_000).toISOString();
  const state = {
    entries: [
      { id: "1", timestamp: now, kind: "episode" as const, actor: "Riset", summary: "Episode tentang claude code agents", skillsUsed: [] },
      { id: "2", timestamp: now, kind: "qc_learning" as const, actor: "QC", summary: "Judul clickbait menurunkan retensi", skillsUsed: [] },
      { id: "3", timestamp: old, kind: "episode" as const, actor: "Riset", summary: "Episode claude code lama", skillsUsed: [] },
    ],
    completedTopics: [],
    skillHitCounts: {},
    lastUpdatedAt: now,
  };

  const recall = buildMemoryRecallForState("claude code agent", state, 2);
  assert.equal(recall.length, 2);
  assert.ok(recall[0].summary.includes("claude code"));
  // yang lama tetap relevan tapi skornya di bawah yang baru
  const allClaude = buildMemoryRecallForState("claude code", state, 3);
  assert.equal(allClaude[0].id, "1");

  const unrelated = buildMemoryRecallForState("topik yang sama sekali lain", state, 3);
  assert.equal(unrelated.length, 0);
});

/* ==================== SKILL PACKS (7 REPO DARI BOS) ==================== */

test("v9 tujuh skill pack baru terdaftar dengan status jujur", () => {
  const ids = MODULAR_AGENT_SKILLS.map((s) => s.id);
  for (const id of [
    "agentmemory-recall",
    "openviking-context-db",
    "browser-use-agent",
    "awesome-harness-engineering",
    "anthropic-cybersecurity-skills",
    "diagram-design-editorial",
    "scientific-agent-skills",
  ]) {
    assert.ok(ids.includes(id), `${id} belum terdaftar`);
  }

  const NEW_SKILL_IDS = new Set([
    "agentmemory-recall",
    "openviking-context-db",
    "browser-use-agent",
    "awesome-harness-engineering",
    "anthropic-cybersecurity-skills",
    "diagram-design-editorial",
    "scientific-agent-skills",
  ]);

  for (const skill of MODULAR_AGENT_SKILLS.filter((s) => NEW_SKILL_IDS.has(s.id))) {
    if (skill.defaultInstallStatus === "worker-required") {
      // Klaim worker-required tidak boleh mengaku punya kemampuan aktif
      assert.equal(skill.activeCapabilities.length, 0, `${skill.id} mengklaim aktif padahal worker-required`);
    }
    if (skill.defaultInstallStatus === "adapter-active") {
      assert.ok(skill.activeCapabilities.length > 0, `${skill.id} tidak menjelaskan kemampuannya`);
    }
  }
});
