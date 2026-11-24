import { NextResponse, type NextRequest } from "next/server";
import {
  SlidingWindowLimiter,
  clientKeyFromHeaders,
  isCrossOriginWrite,
  isCostlyPath,
  ruleForPath,
} from "@/lib/security/rate-limit";

/**
 * Penjaga /api/* (v11): blokir tulis lintas-situs + rate limit per IP.
 * Detail & keterbatasan: src/lib/security/rate-limit.ts
 */
const limiter = new SlidingWindowLimiter();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCrossOriginWrite(request.method, request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json(
      { ok: false, code: "CROSS_ORIGIN_BLOCKED", error: "Request tulis lintas-situs ditolak." },
      { status: 403 }
    );
  }

  // Bucket terpisah: endpoint mahal (AI/TTS/render) tidak berbagi jatah dengan endpoint ringan.
  const bucket = isCostlyPath(pathname) ? "costly" : "default";
  const key = `${bucket}:${clientKeyFromHeaders(request.headers)}`;
  const result = limiter.check(key, ruleForPath(pathname));

  if (!result.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMITED",
        error: `Terlalu banyak request. Coba lagi dalam ${result.retryAfterSec} detik.`,
      },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
