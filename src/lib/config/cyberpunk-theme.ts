/**
 * Central Cyberpunk Neon / RGB Theme Configuration
 * Single source of truth for all emissive neon strips, RGB accents,
 * and graphics-tier postprocessing budgets (High / Medium / Eco 30+ FPS mobile).
 */

import type { PerformanceMode } from "@/types/office";

export const CYBERPUNK_THEME = {
  neon: {
    cyan: "#22d3ee",
    cyanEmissive: "#06b6d4",
    magenta: "#e879f9",
    magentaEmissive: "#d946ef",
    purple: "#a855f7",
    purpleEmissive: "#9333ea",
    gold: "#fbbf24",
    emerald: "#34d399",
    warmWoodBacklight: "#f59e0b",
  },
  intensity: {
    nightEdgeStrip: 1.25,
    nightAccent: 1.55,
    sunsetAccent: 0.9,
    daySubtleAccent: 0.28,
    fountainNight: 1.8,
    fountainDay: 0.65,
  },
  graphicsTiers: {
    high: {
      enableBloom: true,
      enableReflections: true,
      enableFog: true,
      maxRealtimePointLights: 8,
    },
    balanced: {
      enableBloom: true,
      enableReflections: false,
      enableFog: false,
      maxRealtimePointLights: 6,
    },
    eco: {
      enableBloom: false,
      enableReflections: false,
      enableFog: false,
      maxRealtimePointLights: 4,
    },
  } satisfies Record<
    PerformanceMode,
    {
      enableBloom: boolean;
      enableReflections: boolean;
      enableFog: boolean;
      maxRealtimePointLights: number;
    }
  >,
} as const;
