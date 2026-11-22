/**
 * Safe Environment Configuration Loader
 *
 * SECURITY RULE:
 * - Frontend ONLY ever accesses `publicConfig` (NEXT_PUBLIC_* values).
 * - Server-only secrets (AI API keys, Supabase Service Role Key) live exclusively
 *   in `getServerIntegrationConfig()` and throw if accidentally invoked in a browser.
 */

export const publicConfig = {
  appName: "FAJREZZZ AI OFFICE",
  phaseLabel: "Phase 1 — Visual Placeholder Foundation",
  dataMode: (process.env.NEXT_PUBLIC_OFFICE_DATA_MODE === "supabase"
    ? "supabase"
    : "simulation") as "simulation" | "supabase",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

export function isSupabaseClientConfigured(): boolean {
  return Boolean(publicConfig.supabaseUrl && publicConfig.supabaseAnonKey);
}

export interface ServerIntegrationConfig {
  aiProviderName: string;
  aiProviderBaseUrl: string;
  aiApiKeyPresent: boolean;
  aiDefaultModel: string;
  supabaseServiceRolePresent: boolean;
}

/**
 * Server-only configuration reader.
 * Never returns raw secret values to callers unless explicitly needed inside server providers.
 */
export function getServerIntegrationConfig(): ServerIntegrationConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: getServerIntegrationConfig() cannot be executed on the client."
    );
  }

  return {
    aiProviderName: process.env.AI_PROVIDER_NAME ?? "none",
    aiProviderBaseUrl: process.env.AI_PROVIDER_BASE_URL ?? "",
    aiApiKeyPresent: Boolean(process.env.AI_PROVIDER_API_KEY),
    aiDefaultModel: process.env.AI_DEFAULT_MODEL ?? "unassigned",
    supabaseServiceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}
