import { NextResponse } from "next/server";
import { fetchLiveAiTrends } from "@/lib/ai/trend-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET() {
  try {
    const report = await fetchLiveAiTrends(90);
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        verifiedOnline: false,
        verificationNote:
          "Gagal menghubungi sumber tren online. Tren aktual belum dapat diverifikasi.",
        officialCount: 0,
        communityCount: 0,
        items: [],
        error: err instanceof Error ? err.message : "Trend Intelligence error",
      },
      { status: 500 }
    );
  }
}
