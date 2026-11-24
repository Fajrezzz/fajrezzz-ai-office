import assert from "node:assert/strict";
import test from "node:test";
import {
  COSTLY_RULE,
  DEFAULT_RULE,
  SlidingWindowLimiter,
  clientKeyFromHeaders,
  isCostlyPath,
  isCrossOriginWrite,
  ruleForPath,
} from "../src/lib/security/rate-limit.ts";

const headers = (map: Record<string, string>) => ({
  get: (name: string) => map[name.toLowerCase()] ?? null,
});

test("v11 limiter mengizinkan sampai batas lalu menolak dengan retryAfter", () => {
  const limiter = new SlidingWindowLimiter();
  const rule = { limit: 3, windowMs: 10_000 };
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i += 1) {
    assert.equal(limiter.check("ip-a", rule, t0 + i).allowed, true);
  }
  const blocked = limiter.check("ip-a", rule, t0 + 5);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSec >= 1 && blocked.retryAfterSec <= 10);
});

test("v11 limiter pulih setelah jendela berlalu & tiap IP dihitung terpisah", () => {
  const limiter = new SlidingWindowLimiter();
  const rule = { limit: 1, windowMs: 1_000 };
  const t0 = 5_000_000;
  assert.equal(limiter.check("ip-a", rule, t0).allowed, true);
  assert.equal(limiter.check("ip-a", rule, t0 + 10).allowed, false);
  assert.equal(limiter.check("ip-b", rule, t0 + 10).allowed, true);
  assert.equal(limiter.check("ip-a", rule, t0 + 1_500).allowed, true);
});

test("v11 endpoint AI/TTS/render dikenali mahal, endpoint ringan tidak", () => {
  for (const p of ["/api/ai/generate", "/api/tts", "/api/agents/think", "/api/studio/autopilot", "/api/pipeline/video", "/api/work-engine"]) {
    assert.equal(isCostlyPath(p), true, p);
    assert.deepEqual(ruleForPath(p), COSTLY_RULE);
  }
  for (const p of ["/api/health", "/api/tasks", "/api/sim-save", "/api/ai/status"]) {
    assert.equal(isCostlyPath(p), false, p);
    assert.deepEqual(ruleForPath(p), DEFAULT_RULE);
  }
  assert.ok(COSTLY_RULE.limit < DEFAULT_RULE.limit);
});

test("v11 IP klien diambil dari x-forwarded-for pertama, fallback x-real-ip lalu unknown", () => {
  assert.equal(clientKeyFromHeaders(headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
  assert.equal(clientKeyFromHeaders(headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(clientKeyFromHeaders(headers({})), "unknown");
});

test("v11 tulis lintas-situs ditolak; GET, same-origin, dan tanpa Origin lolos", () => {
  assert.equal(isCrossOriginWrite("POST", "https://evil.example", "app.vercel.app"), true);
  assert.equal(isCrossOriginWrite("POST", "not a url", "app.vercel.app"), true);
  assert.equal(isCrossOriginWrite("POST", "https://app.vercel.app", "app.vercel.app"), false);
  assert.equal(isCrossOriginWrite("GET", "https://evil.example", "app.vercel.app"), false);
  assert.equal(isCrossOriginWrite("POST", null, "app.vercel.app"), false);
});

test("v11 memori limiter tidak membengkak tanpa batas", () => {
  const limiter = new SlidingWindowLimiter();
  const rule = { limit: 1, windowMs: 1_000 };
  for (let i = 0; i < 6_000; i += 1) limiter.check(`ip-${i}`, rule, 1_000 + i * 2_000);
  assert.ok(limiter.size <= 5_000);
});
