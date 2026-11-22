export type NavSection =
  | "dashboard"
  | "office"
  | "studio"
  | "agents"
  | "tasks"
  | "activity";

export type RobotAnimationState =
  | "idle"
  | "working"
  | "walking"
  | "standby"
  | "error";

export type PerformanceMode = "eco" | "balanced" | "high";

export type LightingPreset = "day" | "sunset" | "night";

export type FloorView = "all" | "l1" | "l2" | "l3" | "roof";

export type BossFloor = 1 | 2 | 3 | 4;

export type BossActionState = "idle" | "walking" | "running" | "swimming";

export interface BossTeleportCommand {
  position: Vector3Tuple;
  floor: BossFloor;
  yaw?: number;
  tick: number;
}

export type CameraPreset =
  | "front"
  | "isometric"
  | "interior"
  | "pool"
  | "supercar"
  | "rooftop"
  | "executive";

export type TaskStatus = "backlog" | "in_progress" | "review" | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type ActivitySeverity = "info" | "success" | "warning" | "system";

export type Vector3Tuple = [number, number, number];

export interface WaypointNode {
  id: string;
  label: string;
  floor: 1 | 2 | 3;
  position: Vector3Tuple;
  facingYaw: number;
  neighbors: string[];
  zone: "workstation" | "holohub" | "server" | "corridor" | "executive" | "lobby" | "outdoor";
}

export interface Workstation {
  id: string;
  code: string;
  name: string;
  floor: 1 | 2 | 3;
  position: Vector3Tuple;
  rotationY: number;
  accentColor: string;
  waypointId: string;
  assignedAgentId: string | null;
  specs: string;
}

export interface AvatarAppearance {
  skinColor: string;
  hairColor: string;
  hairStyle: "short" | "bob" | "ponytail" | "executive";
  suitColor: string;
  shirtColor: string;
  pantsColor: string;
}

export interface OfficeAgent {
  id: string;
  code: string;
  name: string;
  role: string;
  floor: 1 | 2 | 3;
  accentColor: string;
  secondaryColor: string;
  appearance: AvatarAppearance;
  /** Explicit flag ensuring UI always communicates visual placeholder status in Phase 1 */
  isVisualPlaceholder: true;
  status: RobotAnimationState;
  /** Target real status applied once agent finishes walking to destination */
  pendingWorkState?: "idle" | "working" | "error";
  assignedWorkstationId: string;
  currentWaypointId: string;
  targetWaypointId: string;
  /** Optional custom patrol waypoints when walking autonomously */
  patrolWaypoints: string[];
  simulatedLoad: number;
  energyLevel: number;
  currentActionLabel: string;
  futureModelSlot: string;
}

export interface OfficeTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId: string | null;
  category: "architecture" | "automation" | "analytics" | "ui-ux" | "ops";
  createdAt: string;
  updatedAt: string;
  isSimulatedPlaceholder: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "robot-placeholder" | "user" | "system";
  message: string;
  severity: ActivitySeverity;
  zone?: string;
}

export interface IntegrationStatus {
  phase: string;
  dataMode: "simulation" | "supabase";
  supabaseConfigured: boolean;
  aiApiConfigured: boolean;
  aiDisclaimer: string;
}

export type WorkOrderMode =
  | "full_bundle"
  | "agency_umkm"
  | "content_affiliate";

export type WorkDealStatus = "draft" | "sent" | "paid";

export interface WorkOrderInput {
  mode: WorkOrderMode;
  businessName: string;
  niche: string;
  city: string;
  offerSummary: string;
  priceRange: string;
  whatsappNumber: string;
  targetAudience: string;
  brandColor: string;
}

export interface ContentScriptItem {
  day: number;
  format: string;
  title: string;
  hook3s: string;
  body: string;
  cta: string;
  hashtags: string;
}

export interface OutreachScriptItem {
  channel: "WhatsApp" | "Instagram DM" | "Follow-Up";
  label: string;
  message: string;
}

export interface AssignedStaffContribution {
  staffName: string;
  role: string;
  floor: 1 | 2 | 3;
  outputLabel: string;
}

export interface WorkOrderDeliverable {
  id: string;
  createdAt: string;
  engineMode: "builtin-free" | "gemini-free" | "groq-free";
  input: WorkOrderInput;
  dealStatus: WorkDealStatus;
  dealValueIdr: number;
  assignedStaff: AssignedStaffContribution[];
  landingPageHtml: string;
  contentScripts: ContentScriptItem[];
  outreachScripts: OutreachScriptItem[];
  invoiceHtml: string;
  monetizationPlaybook: string[];
}
