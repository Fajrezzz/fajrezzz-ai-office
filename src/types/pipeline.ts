import type { KidsThemeId, PublishPlatform, VideoFormat } from "@/lib/kids-studio/episode-brain";

export type PipelineDivisionKey =
  | "research"
  | "seo"
  | "script"
  | "voice"
  | "motion"
  | "editing"
  | "qc";

export type RealDivisionStatus = "queued" | "running" | "done" | "failed";

/** V3 TikTok Extreme Quality Export Presets (Default: ULTRA QUALITY) */
export type ExportQualityPreset = "ultra" | "high" | "balanced";

/** V3 AI Technology Auto-Selected Visual Styles (A-G) */
export type VisualStyleId =
  | "dark_ai_cinematic"
  | "tech_documentary"
  | "cyberpunk_dev"
  | "clean_tutorial"
  | "agent_3d_network"
  | "minimal_kinetic"
  | "high_energy_news"
  /** v9 — gaya zine/collage + glitch kinetic typography (video referensi Bos) */
  | "zine_glitch";

/** V3 TikTok Content Formats */
export type TikTokContentFormat =
  | "breaking_ai_news"
  | "ai_tools_must_know"
  | "claude_code_experiment"
  | "ai_agent_vs_human"
  | "before_after_automation"
  | "ai_coding_tutorial"
  | "ai_agent_builds_project"
  | "myth_vs_reality"
  | "surprising_experiment"
  | "feature_visual_demo";

/** Verified online trend source record (Trend Intelligence Division) */
export interface TrendSourceRecord {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  freshnessDays: number;
  classification: "official_release" | "community_discussion" | "opinion_rumor" | "unverified";
  verified: boolean;
  summary: string;
  tags: string[];
}

/** Word-level subtitle cue synchronized to actual measured neural speech duration */
export interface WordTimingCue {
  word: string;
  startSec: number;
  endSec: number;
  highlight: boolean;
}

/** AI Creative Director pre-render editorial brief (Section 7) */
export interface CreativeDirectorBrief {
  topic: string;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  sourceVerified: boolean;
  whyChosen: string;
  targetAudience: string;
  hook0to2s: string;
  contentFormat: TikTokContentFormat;
  visualStyle: VisualStyleId;
  transitions: string[];
  tiktokTitle: string;
  tiktokCaption: string;
  tiktokHashtags: string[];
}

/** Actual measured video export QC telemetry (Section 9 — ACTUAL values, never fake targets) */
export interface ActualVideoQcTelemetry {
  requestedPreset: ExportQualityPreset;
  targetWidth: number;
  targetHeight: number;
  targetFps: number;
  targetBitrateMbps: number;
  actualWidth: number;
  actualHeight: number;
  actualFps: number;
  actualCodec: string;
  actualContainer: "mp4" | "webm";
  actualBitrateMbps: number;
  actualDurationSec: number;
  actualFileSizeBytes: number;
  hasAudioTrack: boolean;
  audioCodec: string;
  avSyncDeltaMs: number;
  encodedFrames: number;
  droppedFrames: number;
  blackFrameCount: number;
  visualClippingWarnings: number;
  subtitleClippingWarnings: number;
  safeZoneTikTokPass: boolean;
  brollAvailability: "vector_procedural_hd" | "hybrid_verified" | "missing";
  renderErrorCount: number;
  fileIntegrityPass: boolean;
  fileHeaderMagic: string;
  encoderPath: "webcodecs-mp4" | "mediarecorder-mp4" | "mediarecorder-webm";
  fallbackReason: string | null;
  renderedAt: string;
  warnings: string[];
  recommendedPresetIfBelowTarget: ExportQualityPreset | null;
}

export interface RenderProgressSnapshot {
  phase: "probing" | "audio" | "rendering" | "muxing" | "qc" | "done" | "cancelled";
  percent: number;
  currentFrame: number;
  totalFrames: number;
  etaSec: number | null;
  activeProfileLabel: string;
  encoderPath: string;
}

export interface DivisionLogEntry {
  time: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface DivisionRunRecord<TInput = unknown, TOutput = unknown> {
  division: PipelineDivisionKey;
  status: RealDivisionStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number;
  provider: string | null;
  model: string | null;
  estimatedCostUsd: number;
  tokensUsed: number;
  input: TInput | null;
  output: TOutput | null;
  error: string | null;
  hint: string | null;
  logs: DivisionLogEntry[];
  runCount: number;
}

/* ==================== 1. RISET ==================== */
export interface ResearchIdeaItem {
  id: string;
  title: string;
  angle: string;
  themeId: KidsThemeId;
  storyStructure: string;
  setting: string;
  supportingCharacter: string;
  moralLesson: string;
  hook3s: string;
  targetAge: string;
  /** V3 Trend Intelligence & Creative Director metadata */
  contentFormat?: TikTokContentFormat;
  visualStyle?: VisualStyleId;
  whyChosen?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  sourceVerified?: boolean;
}

export interface ResearchInput {
  theme: string;
  platform: PublishPlatform;
  previousEpisodeTitles: string[];
  avoidStructures: string[];
  avoidSettings: string[];
  avoidCharacters: string[];
  verifiedTrends?: TrendSourceRecord[];
}

export interface ResearchOutput {
  ideas: ResearchIdeaItem[];
  trendIntelligenceNote?: string;
  verifiedSourcesCount?: number;
}

/* ==================== 2. SEO ==================== */
export interface SeoInput {
  idea: ResearchIdeaItem;
  platform: PublishPlatform;
}

export interface SeoOutput {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailHeadline: string;
}

/* ==================== 3. NASKAH ==================== */
export interface PipelineScene {
  sceneNumber: number;
  label: string;
  durationSec: number;
  narration: string;
  subtitle: string;
  visualCue: string;
  mood: "intro" | "problem" | "action" | "solve" | "celebrate";
  /** V3 Creative Director per-scene choreography */
  visualTemplate?:
    | "claude_terminal"
    | "ai_network_flow"
    | "github_pr_workflow"
    | "bezier_chart"
    | "cursor_cards"
    | "split_contrast"
    | "code_diff_editor"
    | "cta_finale";
  transitionIn?: "whip-up" | "iris-circle" | "zoom-through" | "whip-left" | "push-pull";
  codeSnippet?: string;
}

export interface ScriptInput {
  idea: ResearchIdeaItem;
  seo: SeoOutput;
  platform: PublishPlatform;
  previousSummaries: string[];
  bossOriginalElements?: BossOriginalityInput;
}

export interface ScriptOutput {
  summary: string;
  storyStructure: string;
  setting: string;
  supportingCharacter: string;
  moralLesson: string;
  totalDurationSec: number;
  scenes: PipelineScene[];
  visualStyle?: VisualStyleId;
  contentFormat?: TikTokContentFormat;
  creativeBrief?: CreativeDirectorBrief;
}

/* ==================== 4. SUARA (TTS) ==================== */
export interface SceneVoiceTrack {
  sceneNumber: number;
  text: string;
  estimatedSec: number;
  /** Exact measured audio clip duration in seconds (for 0ms A/V sync) */
  actualAudioSec?: number;
  speechOffsetSec?: number;
  wordTimings?: WordTimingCue[];
  voiceName: string;
  lang: string;
  rate: number;
  pitch: number;
  status: "ready" | "fallback-web-audio";
}

export interface VoiceInput {
  scenes: PipelineScene[];
  preferredLang: "id-ID";
}

export interface VoiceOutput {
  engine:
    | "edge-neural-tts"
    | "google-neural-tts"
    | "web-speech-api"
    | "web-audio-bed";
  voiceName: string;
  lang: string;
  totalEstimatedSec: number;
  sceneTracks: SceneVoiceTrack[];
}

/* ==================== 5. MOTION ==================== */
export interface SceneMotionFrame {
  sceneNumber: number;
  label: string;
  durationSec: number;
  keyframeDataUrl: string;
}

export interface MotionInput {
  episodeNumber: number;
  themeId: KidsThemeId;
  format: VideoFormat;
  scenes: PipelineScene[];
}

export interface MotionOutput {
  format: VideoFormat;
  width: number;
  height: number;
  fps: number;
  totalDurationSec: number;
  sceneFrames: SceneMotionFrame[];
}

/* ==================== 6. EDITING ==================== */
export interface EditingInput {
  episodeId: string;
  format: VideoFormat;
  totalDurationSec: number;
  qualityPreset?: ExportQualityPreset;
}

export interface EditingOutput {
  videoMimeType: string;
  videoSizeBytes: number;
  videoDurationSec: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailDataUrl: string;
  exportedAt: string;
  fileName: string;
  /** V3 Real Measured Video QC Telemetry (actual resolution/fps/codec/bitrate/sync) */
  qcTelemetry?: ActualVideoQcTelemetry;
}

/* ==================== 7. QC ==================== */
export interface QcCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: "blocker" | "warning";
}

export interface QcInput {
  title: string;
  description: string;
  summary: string;
  storyStructure: string;
  setting: string;
  supportingCharacter: string;
  moralLesson: string;
  scenes: PipelineScene[];
  videoTelemetry?: ActualVideoQcTelemetry;
  previousEpisodes: {
    id: string;
    title: string;
    summary: string;
    storyStructure: string;
    setting: string;
    supportingCharacter: string;
  }[];
}

export interface QcOutput {
  passed: boolean;
  score: number;
  similarityScore: number;
  mostSimilarEpisodeTitle: string | null;
  blockedReasons: string[];
  checks: QcCheckItem[];
  aiReviewNote?: string;
  videoTelemetry?: ActualVideoQcTelemetry;
}

/* ==================== BOS ORISINALITAS & HASIL NYATA ==================== */
export interface BossOriginalityInput {
  customIdea: string;
  customTwist: string;
  customVoiceLine: string;
  customCharacter: string;
  confirmedByBoss: boolean;
  confirmedAt: string | null;
}

export interface EpisodeRealMetrics {
  youtubeUrl: string;
  uploadedAt: string | null;
  views: number;
  watchHours: number;
  revenueIdr: number;
  apiCostUsd: number;
  totalProductionMs: number;
  lastSyncedAt: string | null;
}

export interface RealEpisode {
  id: string;
  episodeNumber: number;
  createdAt: string;
  updatedAt: string;
  bossTheme: string;
  platform: PublishPlatform;
  format: VideoFormat;
  selectedIdeaId: string | null;
  bossOriginality: BossOriginalityInput;
  metrics: EpisodeRealMetrics;
  divisions: {
    research: DivisionRunRecord<ResearchInput, ResearchOutput>;
    seo: DivisionRunRecord<SeoInput, SeoOutput>;
    script: DivisionRunRecord<ScriptInput, ScriptOutput>;
    voice: DivisionRunRecord<VoiceInput, VoiceOutput>;
    motion: DivisionRunRecord<MotionInput, MotionOutput>;
    editing: DivisionRunRecord<EditingInput, EditingOutput>;
    qc: DivisionRunRecord<QcInput, QcOutput>;
  };
}

export interface DivisionMetaSpec {
  key: PipelineDivisionKey;
  order: number;
  label: string;
  shortLabel: string;
  agentId: string;
  agentName: string;
  deskWaypointId: string;
  loungeWaypointId: string;
  color: string;
  executionSide: "server-llm" | "browser" | "hybrid";
}

export const PIPELINE_DIVISIONS: DivisionMetaSpec[] = [
  {
    key: "research",
    order: 1,
    label: "1. Divisi Riset",
    shortLabel: "Riset",
    agentId: "staff-01",
    agentName: "Raka Pratama",
    deskWaypointId: "wp-ws-01",
    loungeWaypointId: "wp-seat-06",
    color: "#0ea5e9",
    executionSide: "server-llm",
  },
  {
    key: "seo",
    order: 2,
    label: "2. Divisi SEO",
    shortLabel: "SEO",
    agentId: "staff-02",
    agentName: "Nadia Putri",
    deskWaypointId: "wp-ws-02",
    loungeWaypointId: "wp-seat-03",
    color: "#10b981",
    executionSide: "server-llm",
  },
  {
    key: "script",
    order: 3,
    label: "3. Divisi Naskah",
    shortLabel: "Naskah",
    agentId: "staff-03",
    agentName: "Dimas Wijaya",
    deskWaypointId: "wp-ws-03",
    loungeWaypointId: "wp-seat-07",
    color: "#f59e0b",
    executionSide: "server-llm",
  },
  {
    key: "voice",
    order: 4,
    label: "4. Divisi Suara (TTS)",
    shortLabel: "Suara",
    agentId: "staff-05",
    agentName: "Bima Kusuma",
    deskWaypointId: "wp-ws-05",
    loungeWaypointId: "wp-seat-01",
    color: "#6366f1",
    executionSide: "browser",
  },
  {
    key: "motion",
    order: 5,
    label: "5. Divisi Motion",
    shortLabel: "Motion",
    agentId: "staff-04",
    agentName: "Clara Santoso",
    deskWaypointId: "wp-ws-04",
    loungeWaypointId: "wp-seat-05",
    color: "#ec4899",
    executionSide: "browser",
  },
  {
    key: "editing",
    order: 6,
    label: "6. Divisi Editing",
    shortLabel: "Editing",
    agentId: "staff-06",
    agentName: "Salsa Permata",
    deskWaypointId: "wp-ws-06",
    loungeWaypointId: "wp-seat-02",
    color: "#a855f7",
    executionSide: "browser",
  },
  {
    key: "qc",
    order: 7,
    label: "7. Divisi QC & Anti-Duplikat",
    shortLabel: "QC",
    agentId: "staff-07",
    agentName: "Fajar Nugroho",
    deskWaypointId: "wp-ws-07",
    loungeWaypointId: "wp-seat-04",
    color: "#f97316",
    executionSide: "hybrid",
  },
];

export interface DivisionRunHistoryPoint {
  id: string;
  episodeId: string;
  division: PipelineDivisionKey;
  agentId: string;
  status: "done" | "failed";
  qcPassed?: boolean;
  durationMs: number;
  apiCostUsd: number;
  timestamp: string;
}

export function createEmptyDivisionRecord<TIn = unknown, TOut = unknown>(
  division: PipelineDivisionKey
): DivisionRunRecord<TIn, TOut> {
  return {
    division,
    status: "queued",
    startedAt: null,
    finishedAt: null,
    durationMs: 0,
    provider: null,
    model: null,
    estimatedCostUsd: 0,
    tokensUsed: 0,
    input: null,
    output: null,
    error: null,
    hint: null,
    logs: [],
    runCount: 0,
  };
}

export function createEmptyBossOriginality(): BossOriginalityInput {
  return {
    customIdea: "",
    customTwist: "",
    customVoiceLine: "",
    customCharacter: "",
    confirmedByBoss: false,
    confirmedAt: null,
  };
}

export function hasBossOriginalElement(orig: BossOriginalityInput): boolean {
  return (
    orig.customIdea.trim().length >= 5 ||
    orig.customTwist.trim().length >= 5 ||
    orig.customVoiceLine.trim().length >= 5 ||
    orig.customCharacter.trim().length >= 3
  );
}
