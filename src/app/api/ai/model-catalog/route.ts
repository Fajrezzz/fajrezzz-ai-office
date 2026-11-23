import { NextResponse } from "next/server";
import {
  classifyProviderError,
  describeProviderError,
  getRouterTelemetrySnapshot,
  resolveProviderModels,
  sanitizeErrorMessage,
  type LlmProviderId,
} from "@/lib/ai/llm-provider";

export const dynamic = "force-dynamic";

/**
 * v9.4d — DIAGNOSA MODEL (bukan sekadar tes key).
 *
 * Kenapa route ini ada: kasus Gemini "masih sama aja" tidak bisa diselesaikan
 * dengan menebak nama model. Yang dibutuhkan adalah daftar model yang
 * BENAR-BENAR dikembalikan `GET /v1beta/models` untuk key Bos, plus hasil uji
 * per model (native `:generateContent` vs lapisan kompatibilitas OpenAI).
 *
 * Aturan keras:
 *  - API key TIDAK PERNAH dikembalikan, tidak disinggung, tidak dicetak.
 *  - Semua pesan provider lewat `sanitizeErrorMessage`.
 *  - Buka lewat browser (sudah login Vercel) supaya Deployment Protection lolos.
 */

const VALID: LlmProviderId[] = ["gemini", "groq", "openrouter"];

const CATALOG_ENDPOINTS: Record<LlmProviderId, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  groq: "https://api.groq.com/openai/v1/models",
  openrouter: "https://openrouter.ai/api/v1/models",
};

const COMPAT_ENDPOINTS: Record<LlmProviderId, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

interface CatalogModel {
  id: string;
  methods?: string[];
  /** true kalau kandidat router saat ini (env/live/statis) memuat model ini. */
  candidate?: boolean;
}

interface ProbeRow {
  model: string;
  endpoint: string;
  status: number;
  ok: boolean;
  errorClass: string;
  message: string;
}

function keyFor(provider: LlmProviderId): string {
  const envVar =
    provider === "gemini"
      ? "GEMINI_API_KEY"
      : provider === "groq"
        ? "GROQ_API_KEY"
        : "OPENROUTER_API_KEY";
  return process.env[envVar]?.trim() ?? "";
}

async function fetchCatalog(
  provider: LlmProviderId,
  apiKey: string
): Promise<{ ok: boolean; endpoint: string; models: CatalogModel[]; error?: string }> {
  const endpoint = CATALOG_ENDPOINTS[provider];
  const url =
    provider === "gemini" && apiKey
      ? `${endpoint}?key=${encodeURIComponent(apiKey)}&pageSize=200`
      : endpoint;
  try {
    const res = await fetch(url, {
      headers: apiKey && provider !== "gemini" ? { Authorization: `Bearer ${apiKey}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        endpoint,
        models: [],
        error: `HTTP ${res.status}: ${sanitizeErrorMessage(text || res.statusText)}`,
      };
    }
    const json = JSON.parse(text) as {
      data?: { id?: string }[];
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    if (Array.isArray(json.models)) {
      return {
        ok: true,
        endpoint,
        models: json.models.map((m) => ({
          id: (m.name ?? "").replace(/^models\//, ""),
          methods: m.supportedGenerationMethods ?? [],
        })),
      };
    }
    return {
      ok: true,
      endpoint,
      models: (json.data ?? []).map((m) => ({ id: m.id ?? "" })),
    };
  } catch (err) {
    return {
      ok: false,
      endpoint,
      models: [],
      error: sanitizeErrorMessage(err instanceof Error ? err.message : "gagal menghubungi provider"),
    };
  }
}

/**
 * v9.4d — uji jalur native di DUA versi API.
 *
 * Google kadang membuka model baru hanya di salah satu versi (`v1beta` vs `v1`),
 * dan `callGeminiNative` di router selalu memakai `v1beta`. Dengan menguji
 * keduanya, pertanyaan "kenapa model yang katanya ada tetap 404" bisa dijawab
 * dari data, bukan dugaan.
 */
async function probeNativeVersion(
  model: string,
  apiKey: string,
  version: "v1beta" | "v1"
): Promise<ProbeRow> {
  const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(
    model.replace(/^models\//, "")
  )}:generateContent`;
  try {
    const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Balas hanya JSON: {"status":"ok"}' }] },
        contents: [{ role: "user", parts: [{ text: "ok" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8, responseMimeType: "application/json" },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(9_000),
    });
    const text = await res.text().catch(() => "");
    const message = res.ok ? "OK" : sanitizeErrorMessage(text || res.statusText);
    return {
      model,
      endpoint: version === "v1" ? "native-v1" : "native-v1beta",
      status: res.status,
      ok: res.ok,
      errorClass: classifyProviderError(res.status, message),
      message,
    };
  } catch (err) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "gagal menghubungi provider"
    );
    return {
      model,
      endpoint: version === "v1" ? "native-v1" : "native-v1beta",
      status: 0,
      ok: false,
      errorClass: classifyProviderError(undefined, message),
      message,
    };
  }
}

async function probeCompat(
  provider: LlmProviderId,
  model: string,
  apiKey: string
): Promise<ProbeRow> {
  try {
    const res = await fetch(COMPAT_ENDPOINTS[provider], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 8,
        messages: [
          { role: "system", content: 'Balas hanya JSON: {"status":"ok"}' },
          { role: "user", content: "ok" },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text().catch(() => "");
    const message = res.ok ? "OK" : sanitizeErrorMessage(text || res.statusText);
    return {
      model,
      endpoint: "compat",
      status: res.status,
      ok: res.ok,
      errorClass: classifyProviderError(res.status, message),
      message,
    };
  } catch (err) {
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : "gagal menghubungi provider"
    );
    return {
      model,
      endpoint: "compat",
      status: 0,
      ok: false,
      errorClass: classifyProviderError(undefined, message),
      message,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(payload: {
  provider: LlmProviderId;
  keyPresent: boolean;
  catalog: { ok: boolean; endpoint: string; models: CatalogModel[]; error?: string };
  candidates: string[];
  probes: ProbeRow[];
  telemetry: ReturnType<typeof getRouterTelemetrySnapshot>["providers"];
}): string {
  const rows = (items: ProbeRow[]) =>
    items
      .map(
        (p) =>
          `<tr><td class="m">${escapeHtml(p.model)}</td><td>${p.endpoint}</td>` +
          `<td class="${p.ok ? "ok" : "bad"}">${p.status || "err"}</td>` +
          `<td class="e">${escapeHtml(p.errorClass)}</td>` +
          `<td class="msg">${escapeHtml(p.message).slice(0, 260)}</td></tr>`
      )
      .join("");

  const catalogRows = payload.catalog.models
    .map(
      (m) =>
        `<tr><td class="m">${escapeHtml(m.id)}${m.candidate ? " ✅" : ""}</td>` +
        `<td class="msg">${escapeHtml((m.methods ?? []).join(", "))}</td></tr>`
    )
    .join("");

  const providerStatus = payload.telemetry
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.label)}</td><td>${p.configured ? "env ada" : "ENV BELUM ADA"}</td>` +
        `<td>${escapeHtml(p.circuitState)}</td><td>${escapeHtml(p.lastErrorClass ?? "–")}</td>` +
        `<td>${p.dailyQuotaExhausted ? "kuota harian habis" : "–"}</td></tr>`
    )
    .join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Katalog Model — ${payload.provider}</title>
<style>
body{background:#05070d;color:#e2e8f0;font:13px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;margin:0;padding:14px}
h1{font-size:15px;margin:0 0 2px}h2{font-size:13px;margin:18px 0 6px;color:#67e8f9}
p.sub{color:#94a3b8;margin:0 0 10px;font-size:11px}
table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}
th,td{border-bottom:1px solid #1e293b;padding:5px 4px;text-align:left;vertical-align:top;word-break:break-all}
th{color:#7dd3fc;font-weight:600}td.ok{color:#6ee7b7;font-weight:700}td.bad{color:#fda4af;font-weight:700}
td.m{font-family:ui-monospace,monospace;color:#fde68a}td.e{color:#f0abfc}td.msg{color:#cbd5e1}
.box{border:1px solid #334155;border-radius:10px;padding:8px 10px;margin:8px 0;background:#0b1220}
.warn{border-color:#f59e0b55;background:#2a1a05;color:#fcd34d}
</style></head><body>
<h1>Katalog model: ${payload.provider}</h1>
<p class="sub">${new Date().toISOString()} · key: ${payload.keyPresent ? "terpasang (nilai tidak ditampilkan)" : "TIDAK ADA"}</p>
${!payload.keyPresent ? `<div class="box warn">Env var provider ini belum terpasang di deployment yang sedang dibuka.</div>` : ""}
<div class="box">Endpoint katalog: <code>${escapeHtml(payload.catalog.endpoint)}</code> · hasil: ${
    payload.catalog.ok ? `${payload.catalog.models.length} model` : "GAGAL"
  }${payload.catalog.error ? ` · ${escapeHtml(payload.catalog.error).slice(0, 240)}` : ""}</div>
${payload.candidates.length ? `<div class="box">Kandidat router sekarang: <span class="m">${payload.candidates.map(escapeHtml).join(" → ")}</span></div>` : ""}

<h2>1. Model yang dilaporkan provider untuk key ini</h2>
<table><thead><tr><th style="width:62%">id model</th><th>method</th></tr></thead><tbody>${
    catalogRows || `<tr><td colspan="2">kosong / gagal</td></tr>`
  }</tbody></table>

<h2>2. Uji langsung per model</h2>
<table><thead><tr><th style="width:34%">model</th><th>jalur</th><th>status</th><th>kelas</th><th>pesan</th></tr></thead>
<tbody>${rows(payload.probes) || `<tr><td colspan="5">tidak ada probe</td></tr>`}</tbody></table>

<h2>3. Status router sesaat ini</h2>
<table><thead><tr><th>provider</th><th>env</th><th>circuit</th><th>error terakhir</th><th>kuota</th></tr></thead>
<tbody>${providerStatus}</tbody></table>
</body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerParam = (url.searchParams.get("provider") ?? "gemini").toLowerCase();
  const provider = (VALID.includes(providerParam as LlmProviderId)
    ? providerParam
    : "gemini") as LlmProviderId;
  const format = url.searchParams.get("format") ?? "html";
  const apiKey = keyFor(provider);
  const keyPresent = Boolean(apiKey);

  const catalog = await fetchCatalog(provider, apiKey);
  const candidatePool = resolveProviderModels(
    provider,
    catalog.models
      .filter((m) =>
        provider === "gemini"
          ? (m.methods ?? []).includes("generateContent")
          : true
      )
      .map((m) => m.id)
      .filter(Boolean)
      .slice(0, 8)
  );
  const candidates = candidatePool.slice(0, 8);
  const markedCatalog = catalog.models.map((m) => ({
    ...m,
    candidate: candidatePool.includes(m.id),
  }));

  const probes: ProbeRow[] = [];
  if (keyPresent) {
    // Uji sampaiar 5 kandidat teratas — cukup untuk tahu mana yang benar-benar hidup.
    for (const model of candidates.slice(0, 4)) {
      if (provider === "gemini") {
        probes.push(await probeNativeVersion(model, apiKey, "v1beta"));
        // Hanya uji v1 kalau v1beta gagal — supaya tidak membuang kuota.
        const beta = probes[probes.length - 1];
        if (!beta.ok) probes.push(await probeNativeVersion(model, apiKey, "v1"));
        probes.push(await probeCompat(provider, model, apiKey));
      } else {
        probes.push(await probeCompat(provider, model, apiKey));
      }
    }
  }

  const telemetry = getRouterTelemetrySnapshot().providers;
  const payload = {
    provider,
    keyPresent,
    catalog: { ...catalog, models: markedCatalog },
    candidates,
    probes,
    telemetry,
    hints: probes
      .filter((p) => !p.ok)
      .map((p) => ({ model: p.model, endpoint: p.endpoint, ...describeProviderError(p.status, p.message) })),
    note:
      "API key tidak pernah ditampilkan. Kalau semua baris 404, berarti nama model di kode masih basi " +
      "atau model itu ditutup untuk project baru — lihat tabel 1 untuk nama yang benar-benar tersedia.",
  };

  if (format === "json") {
    return NextResponse.json({ ok: true, ...payload });
  }
  return new Response(renderHtml(payload), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
