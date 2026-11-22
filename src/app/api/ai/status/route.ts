import { NextResponse } from "next/server";
import { getConfiguredProvidersStatus } from "@/lib/ai/llm-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getConfiguredProvidersStatus();
  return NextResponse.json({
    ok: true,
    ...status,
    checkedAt: new Date().toISOString(),
  });
}
