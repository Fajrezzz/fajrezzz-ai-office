/**
 * RATE LIMIT + ORIGIN GUARD (v11)
 *
 * Kenapa ada: seluruh /api/* bersifat publik (tanpa login). Tanpa pembatas, siapa pun yang tahu
 * URL Vercel bisa menghabiskan kuota gratis Gemini/Groq/OpenRouter atau menimpa data simpan.
 *
 * Catatan jujur: penghitung ini disimpan di memori per instance serverless/edge, jadi sifatnya
 * "best effort" (cukup untuk menahan spam/skrip sederhana, BUKAN pengganti autentikasi).
 * Modul ini sengaja murni (tanpa import alias "@/") supaya bisa dites langsung oleh node:test.
 */

export interface RateLimitRule {
  /** Jumlah request maksimum dalam satu jendela. */
  limit: number;
  /** Panjang jendela dalam milidetik. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Detik yang harus ditunggu sebelum boleh mencoba lagi (0 bila diizinkan). */
  retryAfterSec: number;
}

/** Endpoint yang memicu panggilan AI/TTS/render → batas lebih ketat. */
const COSTLY_PREFIXES = [
  "/api/ai/generate",
  "/api/ai/scene-image",
  "/api/ai/test-providers",
  "/api/agents/",
  "/api/tts",
  "/api/work-engine",
  "/api/studio/",
  "/api/pipeline/",
  "/api/kids-studio",
] as const;

export const COSTLY_RULE: RateLimitRule = { limit: 20, windowMs: 60_000 };
export const DEFAULT_RULE: RateLimitRule = { limit: 120, windowMs: 60_000 };

/** Batas penyimpanan agar Map tidak membengkak pada instance yang berumur panjang. */
const MAX_TRACKED_KEYS = 5_000;

export function isCostlyPath(pathname: string): boolean {
  return COSTLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export function ruleForPath(pathname: string): RateLimitRule {
  return isCostlyPath(pathname) ? COSTLY_RULE : DEFAULT_RULE;
}

/** Ambil IP klien dari header proxy (Vercel mengisi x-forwarded-for). */
export function clientKeyFromHeaders(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  check(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitResult {
    const windowStart = now - rule.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= rule.limit) {
      const oldest = recent[0] ?? now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000));
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.prune(windowStart);
    return { allowed: true, remaining: rule.limit - recent.length, retryAfterSec: 0 };
  }

  /** Buang kunci kedaluwarsa; bila masih terlalu banyak, buang yang tertua. */
  private prune(windowStart: number): void {
    if (this.hits.size <= MAX_TRACKED_KEYS) return;
    for (const [key, times] of this.hits) {
      if (times.length === 0 || times[times.length - 1] <= windowStart) this.hits.delete(key);
    }
    while (this.hits.size > MAX_TRACKED_KEYS) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey === undefined) break;
      this.hits.delete(oldestKey);
    }
  }

  get size(): number {
    return this.hits.size;
  }
}

/**
 * Tolak request tulis (POST/PUT/PATCH/DELETE) yang datang dari situs lain lewat browser.
 * Request tanpa header Origin (curl, server-ke-server) dibiarkan lewat → ditahan oleh rate limit.
 */
export function isCrossOriginWrite(method: string, origin: string | null, host: string | null): boolean {
  const upper = method.toUpperCase();
  if (upper === "GET" || upper === "HEAD" || upper === "OPTIONS") return false;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
