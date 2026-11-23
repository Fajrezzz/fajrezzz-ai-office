import type { VisualStyleId } from "@/types/pipeline";

/**
 * FAJREZZZ ORIGINAL CINEMATIC EDITING IDENTITY & REUSABLE PRESET SYSTEM
 * (Phases 2, 3, 4 & 5 of TikTok Video Studio Directive)
 *
 * Original Fajrezzz Visual Identity:
 *  - Premium AI Documentary + Modern Technology Storytelling
 *  - Consistent midnight-navy + cyan/violet/amber neon color grammar
 *  - Remotion 4.0 React Composition + GSAP 3.15 Motion Choreography
 *  - Audio-locked word-level subtitles in TikTok 9:16 Safe Zone
 *  - Never copies any external creator raw; purely original visual parameters.
 */

export type CinematicPresetId =
  | "cinematic_ai_documentary"
  | "fast_paced_ai_news"
  | "claude_code_tutorial"
  | "ai_agent_explainer"
  | "futuristic_tech_showcase"
  | "pro_short_form_storytelling"
  | "zine_glitch_editorial";

export interface FajrezzzCinematicPreset {
  id: CinematicPresetId;
  name: string;
  tagline: string;
  mappedVisualStyle: VisualStyleId;
  recommendedTopics: string[];
  introAnimation: {
    hookWindowSec: number;
    entryEffect: "camera_push_glow" | "glitch_snap_reveal" | "terminal_boot_type" | "node_network_expand" | "prism_light_sweep" | "editorial_title_card";
    hookTextScale: number;
    accentBadge: string;
  };
  sceneTransition: {
    primary: "whip-up" | "iris-circle" | "zoom-through" | "whip-left" | "push-pull";
    secondary: "whip-up" | "iris-circle" | "zoom-through" | "whip-left" | "push-pull";
    durationSec: number;
    gsapEase: string;
  };
  typography: {
    headlineFont: string;
    bodyFont: string;
    monoFont: string;
    headlineWeight: number;
    uppercaseHook: boolean;
    maxWordsPerLine: number;
  };
  subtitle: {
    animationStyle: "word_pop_karaoke" | "rapid_punch_highlight" | "clean_code_caption" | "step_badge_sync";
    activeWordColor: string;
    baseTextColor: string;
    pillBackground: string;
    safeBottomPct: number;
  };
  colorPalette: {
    bgPrimary: string;
    bgSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    highlightHex: string;
  };
  motionSettings: {
    targetFps: 30 | 60;
    avgSceneDurationSec: number;
    zoomInRange: [number, number];
    parallaxDepth: number;
    enableGridOverlay: boolean;
    enableHudTelemetry: boolean;
  };
  soundDesign: {
    bgmMood: string;
    bgmDuckDb: number;
    transitionSfx: "cinematic_whoosh" | "digital_glitch_tick" | "mechanical_key_click" | "synth_pulse" | "deep_sub_hit";
    voicePacingWpm: number;
    autoTrimSilenceDb: number;
  };
  outro: {
    durationSec: number;
    ctaHeadline: string;
    closingAnimation: "brand_lockup_pulse" | "fast_loop_bridge" | "terminal_done_stamp";
  };
}

export const FAJREZZZ_CINEMATIC_PRESETS: FajrezzzCinematicPreset[] = [
  {
    id: "cinematic_ai_documentary",
    name: "Cinematic AI Documentary",
    tagline: "Gaya dokumenter AI premium dengan depth-of-field, slow push-in, dan narasi berwibawa.",
    mappedVisualStyle: "dark_ai_cinematic",
    recommendedTopics: ["The Future of AI Agents", "Inside a Multi-Agent AI Office", "AI Breakthroughs"],
    introAnimation: {
      hookWindowSec: 2.0,
      entryEffect: "camera_push_glow",
      hookTextScale: 1.12,
      accentBadge: "AI DOCUMENTARY",
    },
    sceneTransition: {
      primary: "push-pull",
      secondary: "zoom-through",
      durationSec: 0.48,
      gsapEase: "power4.out",
    },
    typography: {
      headlineFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 900,
      uppercaseHook: true,
      maxWordsPerLine: 4,
    },
    subtitle: {
      animationStyle: "word_pop_karaoke",
      activeWordColor: "#38bdf8",
      baseTextColor: "#f8fafc",
      pillBackground: "rgba(2, 6, 23, 0.78)",
      safeBottomPct: 24,
    },
    colorPalette: {
      bgPrimary: "#040914",
      bgSecondary: "#0c1b33",
      accentPrimary: "#38bdf8",
      accentSecondary: "#a855f7",
      highlightHex: "#facc15",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 3.6,
      zoomInRange: [1.0, 1.09],
      parallaxDepth: 1.0,
      enableGridOverlay: true,
      enableHudTelemetry: true,
    },
    soundDesign: {
      bgmMood: "Ambient Cinematic Synth + Deep Sub Pulse",
      bgmDuckDb: -16,
      transitionSfx: "cinematic_whoosh",
      voicePacingWpm: 155,
      autoTrimSilenceDb: -40,
    },
    outro: {
      durationSec: 2.4,
      ctaHeadline: "Follow @FajrezzzAI — Masa Depan AI Dimulai Hari Ini",
      closingAnimation: "brand_lockup_pulse",
    },
  },
  {
    id: "fast_paced_ai_news",
    name: "Fast-Paced AI News",
    tagline: "Berita rilis AI terbaru bertempo cepat (2.3s/cut), punchy highlight, dan whip transitions.",
    mappedVisualStyle: "high_energy_news",
    recommendedTopics: ["Latest AI News", "New Model Release", "Breaking AI Tools"],
    introAnimation: {
      hookWindowSec: 1.5,
      entryEffect: "glitch_snap_reveal",
      hookTextScale: 1.2,
      accentBadge: "AI BREAKING",
    },
    sceneTransition: {
      primary: "whip-up",
      secondary: "whip-left",
      durationSec: 0.28,
      gsapEase: "expo.inOut",
    },
    typography: {
      headlineFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 900,
      uppercaseHook: true,
      maxWordsPerLine: 3,
    },
    subtitle: {
      animationStyle: "rapid_punch_highlight",
      activeWordColor: "#facc15",
      baseTextColor: "#ffffff",
      pillBackground: "rgba(15, 23, 42, 0.88)",
      safeBottomPct: 25,
    },
    colorPalette: {
      bgPrimary: "#090915",
      bgSecondary: "#1e1b4b",
      accentPrimary: "#f43f5e",
      accentSecondary: "#22d3ee",
      highlightHex: "#fde047",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 2.3,
      zoomInRange: [1.03, 1.14],
      parallaxDepth: 1.15,
      enableGridOverlay: true,
      enableHudTelemetry: true,
    },
    soundDesign: {
      bgmMood: "High-Energy Tech Beat (124 BPM)",
      bgmDuckDb: -15,
      transitionSfx: "digital_glitch_tick",
      voicePacingWpm: 175,
      autoTrimSilenceDb: -38,
    },
    outro: {
      durationSec: 1.8,
      ctaHeadline: "Simpan & Share biar nggak ketinggalan update AI!",
      closingAnimation: "fast_loop_bridge",
    },
  },
  {
    id: "claude_code_tutorial",
    name: "Claude Code Tutorial",
    tagline: "Tutorial coding & terminal CLI tajam dengan syntax highlight, step badge, dan demo langsung.",
    mappedVisualStyle: "cyberpunk_dev",
    recommendedTopics: ["Claude Code: How AI Coding Agents Work", "AI Coding Tools", "CLI Automation"],
    introAnimation: {
      hookWindowSec: 1.8,
      entryEffect: "terminal_boot_type",
      hookTextScale: 1.08,
      accentBadge: "CLAUDE CODE LAB",
    },
    sceneTransition: {
      primary: "whip-left",
      secondary: "push-pull",
      durationSec: 0.34,
      gsapEase: "power3.out",
    },
    typography: {
      headlineFont: "JetBrains Mono, monospace",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 800,
      uppercaseHook: false,
      maxWordsPerLine: 4,
    },
    subtitle: {
      animationStyle: "clean_code_caption",
      activeWordColor: "#34d399",
      baseTextColor: "#e2e8f0",
      pillBackground: "rgba(2, 12, 27, 0.86)",
      safeBottomPct: 24,
    },
    colorPalette: {
      bgPrimary: "#030712",
      bgSecondary: "#0f172a",
      accentPrimary: "#10b981",
      accentSecondary: "#38bdf8",
      highlightHex: "#a7f3d0",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 3.0,
      zoomInRange: [1.0, 1.07],
      parallaxDepth: 0.85,
      enableGridOverlay: true,
      enableHudTelemetry: true,
    },
    soundDesign: {
      bgmMood: "Minimal Lo-Fi Cyber Coding Groove",
      bgmDuckDb: -18,
      transitionSfx: "mechanical_key_click",
      voicePacingWpm: 162,
      autoTrimSilenceDb: -40,
    },
    outro: {
      durationSec: 2.1,
      ctaHeadline: "Mau workflow Claude Code lengkap? Komen 'AGENT'!",
      closingAnimation: "terminal_done_stamp",
    },
  },
  {
    id: "ai_agent_explainer",
    name: "AI Agent Explainer",
    tagline: "Diagram arsitektur multi-agent bergerak, aliran node-ke-node, dan penjelasan terstruktur.",
    mappedVisualStyle: "agent_3d_network",
    recommendedTopics: ["Inside a Multi-Agent AI Office", "Multi-Agent Systems", "AI Automation"],
    introAnimation: {
      hookWindowSec: 1.9,
      entryEffect: "node_network_expand",
      hookTextScale: 1.1,
      accentBadge: "MULTI-AGENT MAP",
    },
    sceneTransition: {
      primary: "iris-circle",
      secondary: "zoom-through",
      durationSec: 0.42,
      gsapEase: "back.out(1.4)",
    },
    typography: {
      headlineFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 800,
      uppercaseHook: true,
      maxWordsPerLine: 4,
    },
    subtitle: {
      animationStyle: "step_badge_sync",
      activeWordColor: "#22d3ee",
      baseTextColor: "#f1f5f9",
      pillBackground: "rgba(8, 20, 42, 0.84)",
      safeBottomPct: 24,
    },
    colorPalette: {
      bgPrimary: "#040d1e",
      bgSecondary: "#0e2240",
      accentPrimary: "#22d3ee",
      accentSecondary: "#c084fc",
      highlightHex: "#34d399",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 3.2,
      zoomInRange: [1.0, 1.08],
      parallaxDepth: 1.05,
      enableGridOverlay: true,
      enableHudTelemetry: true,
    },
    soundDesign: {
      bgmMood: "Clean Futuristic Pluck & Neural Pulse",
      bgmDuckDb: -17,
      transitionSfx: "synth_pulse",
      voicePacingWpm: 160,
      autoTrimSilenceDb: -40,
    },
    outro: {
      durationSec: 2.2,
      ctaHeadline: "Lihat cara 15 AI Agent kerja bareng di Fajrezzz AI Office!",
      closingAnimation: "brand_lockup_pulse",
    },
  },
  {
    id: "futuristic_tech_showcase",
    name: "Futuristic Technology Showcase",
    tagline: "Pamer inovasi teknologi & eksperimen AI dengan prisma cahaya neon, kinetic cards & bass drop.",
    mappedVisualStyle: "tech_documentary",
    recommendedTopics: ["Tech Experiments", "3D Virtual AI Office", "AI Hardware & Demos"],
    introAnimation: {
      hookWindowSec: 1.7,
      entryEffect: "prism_light_sweep",
      hookTextScale: 1.15,
      accentBadge: "TECH SHOWCASE",
    },
    sceneTransition: {
      primary: "zoom-through",
      secondary: "whip-up",
      durationSec: 0.38,
      gsapEase: "power4.inOut",
    },
    typography: {
      headlineFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 900,
      uppercaseHook: true,
      maxWordsPerLine: 3,
    },
    subtitle: {
      animationStyle: "word_pop_karaoke",
      activeWordColor: "#e879f9",
      baseTextColor: "#ffffff",
      pillBackground: "rgba(12, 10, 32, 0.82)",
      safeBottomPct: 24,
    },
    colorPalette: {
      bgPrimary: "#06061a",
      bgSecondary: "#1b1042",
      accentPrimary: "#e879f9",
      accentSecondary: "#38bdf8",
      highlightHex: "#67e8f9",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 2.8,
      zoomInRange: [1.02, 1.12],
      parallaxDepth: 1.2,
      enableGridOverlay: true,
      enableHudTelemetry: true,
    },
    soundDesign: {
      bgmMood: "Cyberpunk Synthwave Showcase",
      bgmDuckDb: -15,
      transitionSfx: "deep_sub_hit",
      voicePacingWpm: 165,
      autoTrimSilenceDb: -39,
    },
    outro: {
      durationSec: 2.0,
      ctaHeadline: "Eksperimen AI apa lagi yang mau kita bangun berikutnya?",
      closingAnimation: "brand_lockup_pulse",
    },
  },
  {
    id: "pro_short_form_storytelling",
    name: "Professional Short-Form Storytelling",
    tagline: "Alur cerita 3-babak (Hook → Konflik/Demo → Payoff) bersih & elegan dengan retensi tinggi.",
    mappedVisualStyle: "clean_tutorial",
    recommendedTopics: ["Creator Story", "AI Productivity Case Study", "Lessons Learned"],
    introAnimation: {
      hookWindowSec: 2.0,
      entryEffect: "editorial_title_card",
      hookTextScale: 1.06,
      accentBadge: "STORYTELLING",
    },
    sceneTransition: {
      primary: "push-pull",
      secondary: "iris-circle",
      durationSec: 0.4,
      gsapEase: "power2.inOut",
    },
    typography: {
      headlineFont: "Inter, system-ui, sans-serif",
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 800,
      uppercaseHook: false,
      maxWordsPerLine: 4,
    },
    subtitle: {
      animationStyle: "word_pop_karaoke",
      activeWordColor: "#fbbf24",
      baseTextColor: "#f8fafc",
      pillBackground: "rgba(15, 23, 42, 0.80)",
      safeBottomPct: 24,
    },
    colorPalette: {
      bgPrimary: "#0b1120",
      bgSecondary: "#1e293b",
      accentPrimary: "#fbbf24",
      accentSecondary: "#38bdf8",
      highlightHex: "#fde68a",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 3.4,
      zoomInRange: [1.0, 1.07],
      parallaxDepth: 0.9,
      enableGridOverlay: false,
      enableHudTelemetry: false,
    },
    soundDesign: {
      bgmMood: "Modern Editorial Piano + Subtle Electronic Pulse",
      bgmDuckDb: -18,
      transitionSfx: "cinematic_whoosh",
      voicePacingWpm: 158,
      autoTrimSilenceDb: -40,
    },
    outro: {
      durationSec: 2.2,
      ctaHeadline: "Follow untuk cerita & studi kasus AI nyata setiap hari.",
      closingAnimation: "fast_loop_bridge",
    },
  },
  {
    id: "zine_glitch_editorial",
    name: "Zine Glitch Editorial",
    tagline:
      "Kolase kertas + tipografi kinetik raksasa yang terpotong frame, halftone duotone, glitch RGB, dan hard cut super cepat.",
    mappedVisualStyle: "zine_glitch",
    recommendedTopics: [
      "Kinetic Typography Hook",
      "AI Opinion / Hot Take",
      "Collage Explainer",
    ],
    introAnimation: {
      hookWindowSec: 1.2,
      entryEffect: "glitch_snap_reveal",
      hookTextScale: 1.28,
      accentBadge: "FAJREZZZ",
    },
    sceneTransition: {
      primary: "whip-up",
      secondary: "zoom-through",
      durationSec: 0.22,
      gsapEase: "expo.inOut",
    },
    typography: {
      headlineFont: '"Helvetica Neue", "Arial Black", Inter, sans-serif',
      bodyFont: "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, monospace",
      headlineWeight: 900,
      uppercaseHook: true,
      maxWordsPerLine: 2,
    },
    subtitle: {
      animationStyle: "rapid_punch_highlight",
      activeWordColor: "#E23A2E",
      baseTextColor: "#0A0A0B",
      pillBackground: "rgba(241, 235, 224, 0.94)",
      safeBottomPct: 22,
    },
    colorPalette: {
      bgPrimary: "#F1EBE0",
      bgSecondary: "#E3D9C8",
      accentPrimary: "#E23A2E",
      accentSecondary: "#0A0A0B",
      highlightHex: "#F5A623",
    },
    motionSettings: {
      targetFps: 60,
      avgSceneDurationSec: 1.9,
      zoomInRange: [1.08, 1.22],
      parallaxDepth: 0.6,
      enableGridOverlay: false,
      enableHudTelemetry: false,
    },
    soundDesign: {
      bgmMood: "Distorted Paper Drum Loop (128 BPM)",
      bgmDuckDb: -14,
      transitionSfx: "digital_glitch_tick",
      voicePacingWpm: 182,
      autoTrimSilenceDb: -36,
    },
    outro: {
      durationSec: 1.6,
      ctaHeadline: "Simpan biar nggak ketinggalan.",
      closingAnimation: "brand_lockup_pulse",
    },
  },
];

export function getCinematicPresetById(
  id: CinematicPresetId
): FajrezzzCinematicPreset {
  return (
    FAJREZZZ_CINEMATIC_PRESETS.find((p) => p.id === id) ??
    FAJREZZZ_CINEMATIC_PRESETS[0]
  );
}

/**
 * Intelligent Topic-to-Preset Selector (Phase 3 & 5).
 * Automatically matches any video topic to the optimal Fajrezzz Cinematic Preset.
 */
export function autoSelectCinematicPresetForTopic(
  topic: string
): FajrezzzCinematicPreset {
  const low = topic.toLowerCase();
  if (/zine|collage|kolase|glitch|kinetic|manga|komik|typograph/.test(low)) {
    return getCinematicPresetById("zine_glitch_editorial");
  }
  if (/claude\s*code|coding\s*agent|cli|terminal|tutorial|cara|how\s+ai\s+coding/.test(low)) {
    return getCinematicPresetById("claude_code_tutorial");
  }
  if (/multi-agent|office|kantor|explainer|arsitektur|workflow|system|otomasi/.test(low)) {
    return getCinematicPresetById("ai_agent_explainer");
  }
  if (/news|berita|breaking|rilis|release|baru|update|hari ini/.test(low)) {
    return getCinematicPresetById("fast_paced_ai_news");
  }
  if (/showcase|experiment|eksperimen|demo|3d|futurist|robot|hardware/.test(low)) {
    return getCinematicPresetById("futuristic_tech_showcase");
  }
  if (/story|cerita|case study|studi kasus|pengalaman|kenapa/.test(low)) {
    return getCinematicPresetById("pro_short_form_storytelling");
  }
  // Default: "The Future of AI Agents" & deep tech analysis -> Cinematic AI Documentary
  return getCinematicPresetById("cinematic_ai_documentary");
}

/**
 * Phase 5: 7-Agent Collaborative Intelligent Editing Workflow
 * Mapped directly onto Fajrezzz AI Office's 15 real employees & shared task pipeline.
 */
export interface IntelligentEditingWorkflowStage {
  step: number;
  agentTitle: string;
  mappedEmployeeIds: string[];
  floor: number;
  responsibility: string;
  deliverableKey: string;
}

export const INTELLIGENT_EDITING_WORKFLOW: IntelligentEditingWorkflowStage[] = [
  {
    step: 1,
    agentTitle: "Reference Analysis Agent",
    mappedEmployeeIds: ["staff-01", "staff-08"],
    floor: 2,
    responsibility: "Menganalisis referensi editing & tren AI terverifikasi untuk mengekstrak struktur hook, ritme cut, dan prinsip visual.",
    deliverableKey: "referenceStyleBlueprint",
  },
  {
    step: 2,
    agentTitle: "Creative Director Agent",
    mappedEmployeeIds: ["staff-02", "staff-03", "staff-09"],
    floor: 2,
    responsibility: "Memilih Fajrezzz Cinematic Preset terbaik untuk topik dan menyusun naskah 9:16 berstruktur hook → demo → payoff.",
    deliverableKey: "selectedPresetAndScript",
  },
  {
    step: 3,
    agentTitle: "Motion Designer Agent",
    mappedEmployeeIds: ["staff-04", "staff-10", "staff-11"],
    floor: 3,
    responsibility: "Membangun komposisi Remotion 4.0 + GSAP 3.15 motion graphics, diagram multi-agent, terminal animasi & kinetic typography.",
    deliverableKey: "remotionMotionTimeline",
  },
  {
    step: 4,
    agentTitle: "Video Editor Agent",
    mappedEmployeeIds: ["staff-06", "staff-12", "staff-13"],
    floor: 3,
    responsibility: "Menyusun seluruh scene, transisi tanpa patah, auto-editor pacing, dan merender file MP4/AAC 9:16 1080×1920+.",
    deliverableKey: "renderedMp4Package",
  },
  {
    step: 5,
    agentTitle: "Sound Designer Agent",
    mappedEmployeeIds: ["staff-05"],
    floor: 2,
    responsibility: "Menghasilkan voice-over neural bersih, auto-ducking BGM, silence trimming, dan sound effects transisi.",
    deliverableKey: "masteredAudioMix",
  },
  {
    step: 6,
    agentTitle: "Subtitle Agent",
    mappedEmployeeIds: ["staff-14"],
    floor: 2,
    responsibility: "Menyinkronkan subtitle word-level (whisper.cpp adapter / audio-locked aligner) di TikTok 9:16 Safe Zone.",
    deliverableKey: "syncedWordSubtitles",
  },
  {
    step: 7,
    agentTitle: "Quality Control Agent",
    mappedEmployeeIds: ["staff-07", "staff-15"],
    floor: 2,
    responsibility: "Memverifikasi resolusi ≥1080×1920, FPS aktual, integritas header MP4, tanpa black frame / scene kosong sebelum final.",
    deliverableKey: "verifiedQcReport",
  },
];

/** The 3 mandatory Phase 6 test video topics pre-wired with optimal Fajrezzz presets */
export const PHASE_6_TEST_VIDEO_TOPICS = [
  {
    id: "test-1",
    topic: "The Future of AI Agents",
    presetId: "cinematic_ai_documentary" as CinematicPresetId,
  },
  {
    id: "test-2",
    topic: "Claude Code: How AI Coding Agents Work",
    presetId: "claude_code_tutorial" as CinematicPresetId,
  },
  {
    id: "test-3",
    topic: "Inside a Multi-Agent AI Office",
    presetId: "ai_agent_explainer" as CinematicPresetId,
  },
] as const;
