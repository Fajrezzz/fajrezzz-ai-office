import { NextResponse } from "next/server";
import {
  getServerIntegrationConfig,
  isSupabaseClientConfigured,
  publicConfig,
} from "@/lib/config/env";
import type { IntegrationStatus } from "@/types/office";

export async function GET() {
  const serverConfig = getServerIntegrationConfig();

  const status: IntegrationStatus = {
    phase: publicConfig.phaseLabel,
    dataMode: publicConfig.dataMode,
    supabaseConfigured:
      isSupabaseClientConfigured() && serverConfig.supabaseServiceRolePresent,
    aiApiConfigured: serverConfig.aiApiKeyPresent,
    aiDisclaimer:
      "Karakter robot 3D pada Tahap 1 adalah visual placeholder dengan animasi simulasi lokal dan belum menjalankan AI API nyata.",
  };

  return NextResponse.json({
    ok: true,
    service: "fajrezzz-ai-office",
    timestamp: new Date().toISOString(),
    integration: status,
  });
}
