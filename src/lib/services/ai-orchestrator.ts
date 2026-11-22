import { getServerIntegrationConfig } from "@/lib/config/env";

export interface AgentExecutionRequest {
  agentId: string;
  taskId: string;
  instruction: string;
}

export interface AgentExecutionResponse {
  executed: boolean;
  mode: "visual-placeholder" | "live-ai";
  message: string;
  provider: string;
}

/**
 * Server-Only AI Orchestrator Gateway (Phase 2 Boundary)
 *
 * SECURITY RULE:
 * - Runs strictly on the server (Next.js API Route Handlers / Server Actions).
 * - Never exposes AI API keys to browser bundles.
 * - In Phase 1, this always returns a transparent non-AI placeholder response.
 */
export async function dispatchAgentTaskServerOnly(
  request: AgentExecutionRequest
): Promise<AgentExecutionResponse> {
  const serverConfig = getServerIntegrationConfig();

  if (!serverConfig.aiApiKeyPresent || serverConfig.aiProviderName === "none") {
    return {
      executed: false,
      mode: "visual-placeholder",
      provider: "none",
      message: `Agent ${request.agentId} berada dalam mode Visual Placeholder (Tahap 1). Belum terhubung ke AI API eksternal.`,
    };
  }

  // Phase 2 hook: invoke configured AI provider over HTTPS from server only.
  return {
    executed: false,
    mode: "visual-placeholder",
    provider: serverConfig.aiProviderName,
    message:
      "AI Orchestrator stub terdeteksi. Implementasikan provider adapter pada Tahap 2.",
  };
}
