/**
 * Optional Hindsight Long-Term Agent Memory Adapter (vectorize-io/hindsight, MIT).
 *
 * Security & Infrastructure rules:
 * - Zero hardcoded API keys: reads ONLY from server environment variables
 *   (`HINDSIGHT_API_URL`, optional `HINDSIGHT_API_KEY`, optional `HINDSIGHT_BANK_ID`).
 * - Never transmits private personal data; stores only technical episode/topic production notes.
 * - When `HINDSIGHT_API_URL` is not configured (default Rp 0 Vercel setup), cleanly reports
 *   `configured: false` and defers to local persistent `agent-memory.ts` without error.
 */

export interface HindsightStatus {
  configured: boolean;
  bankId: string;
  endpointHost: string | null;
  note: string;
}

export interface HindsightRecallItem {
  text: string;
  score?: number;
  createdAt?: string;
}

export function getHindsightStatus(): HindsightStatus {
  const rawUrl = process.env.HINDSIGHT_API_URL?.trim() || "";
  const bankId = process.env.HINDSIGHT_BANK_ID?.trim() || "fajrezzz-ai-office";
  if (!rawUrl) {
    return {
      configured: false,
      bankId,
      endpointHost: null,
      note: "Standby — membutuhkan server/cloud Hindsight (set env HINDSIGHT_API_URL). Menggunakan memori lokal persisten sebagai fallback aktif.",
    };
  }
  try {
    const parsed = new URL(rawUrl);
    return {
      configured: true,
      bankId,
      endpointHost: parsed.host,
      note: `Terhubung ke Hindsight API (${parsed.host}, bank: ${bankId}).`,
    };
  } catch {
    return {
      configured: false,
      bankId,
      endpointHost: null,
      note: "HINDSIGHT_API_URL tidak valid — fallback ke memori lokal.",
    };
  }
}

export async function retainHindsightMemory(
  content: string,
  metadata?: Record<string, string>
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const baseUrl = process.env.HINDSIGHT_API_URL?.trim();
  if (!baseUrl) return { ok: false, skipped: true };

  const bankId = encodeURIComponent(
    process.env.HINDSIGHT_BANK_ID?.trim() || "fajrezzz-ai-office"
  );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.HINDSIGHT_API_KEY?.trim()) {
    headers.Authorization = `Bearer ${process.env.HINDSIGHT_API_KEY.trim()}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/default/banks/${bankId}/memories`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: [
          {
            content: content.slice(0, 1200),
            metadata: metadata ?? {},
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

export async function recallHindsightMemories(
  query: string,
  limit = 5
): Promise<{ ok: boolean; items: HindsightRecallItem[]; skipped?: boolean }> {
  const baseUrl = process.env.HINDSIGHT_API_URL?.trim();
  if (!baseUrl) return { ok: false, items: [], skipped: true };

  const bankId = encodeURIComponent(
    process.env.HINDSIGHT_BANK_ID?.trim() || "fajrezzz-ai-office"
  );
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.HINDSIGHT_API_KEY?.trim()) {
    headers.Authorization = `Bearer ${process.env.HINDSIGHT_API_KEY.trim()}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${baseUrl.replace(/\/$/, "")}/v1/default/banks/${bankId}/memories/recall`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query: query.slice(0, 400), top_k: limit }),
        signal: controller.signal,
      }
    );
    if (!res.ok) return { ok: false, items: [] };
    const data = (await res.json()) as {
      results?: Array<{ text?: string; content?: string; score?: number; created_at?: string }>;
    };
    const items: HindsightRecallItem[] = (data.results ?? [])
      .map((r) => ({
        text: String(r.text || r.content || "").trim(),
        score: typeof r.score === "number" ? r.score : undefined,
        createdAt: r.created_at,
      }))
      .filter((r) => r.text.length > 0)
      .slice(0, limit);
    return { ok: true, items };
  } catch {
    return { ok: false, items: [] };
  } finally {
    clearTimeout(timer);
  }
}
