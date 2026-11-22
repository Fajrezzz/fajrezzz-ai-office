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
}

export interface ResearchInput {
  theme: string;
  platform: PublishPlatform;
  previousEpisodeTitles: string[];
  avoidStructures: string[];
  avoidSettings: string[];
  avoidCharacters: string[];
}

export interface ResearchOutput {
  ideas: ResearchIdeaItem[];
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
}

/* ==================== 4. SUARA (TTS) ==================== */
export interface SceneVoiceTrack {
  sceneNumber: number;
  text: string;
  estimatedSec: number;
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
  engine: "web-speech-api" | "web-audio-bed";
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
