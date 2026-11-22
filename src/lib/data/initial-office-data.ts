import type {
  ActivityEvent,
  OfficeAgent,
  OfficeTask,
  WaypointNode,
  Workstation,
} from "@/types/office";

export const OFFICE_WAYPOINTS: Record<string, WaypointNode> = {
  "wp-ws-alpha": {
    id: "wp-ws-alpha",
    label: "Workstation Alpha",
    position: [-3.8, 0, -1.85],
    facingYaw: Math.PI,
    neighbors: ["wp-corridor-nw"],
    zone: "workstation",
  },
  "wp-ws-beta": {
    id: "wp-ws-beta",
    label: "Workstation Beta",
    position: [1.2, 0, -1.85],
    facingYaw: Math.PI,
    neighbors: ["wp-corridor-nw", "wp-hub-north", "wp-corridor-ne"],
    zone: "workstation",
  },
  "wp-ws-gamma": {
    id: "wp-ws-gamma",
    label: "Workstation Gamma",
    position: [-2.25, 0, 2.0],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-hub-west", "wp-corridor-sw"],
    zone: "workstation",
  },
  "wp-ws-delta": {
    id: "wp-ws-delta",
    label: "Workstation Delta",
    position: [3.6, 0, 3.35],
    facingYaw: Math.PI,
    neighbors: ["wp-corridor-se", "wp-hub-east"],
    zone: "workstation",
  },
  "wp-hub-north": {
    id: "wp-hub-north",
    label: "Holo Hub (North)",
    position: [0.4, 0, -1.0],
    facingYaw: 0,
    neighbors: ["wp-corridor-nw", "wp-ws-beta", "wp-corridor-ne"],
    zone: "holohub",
  },
  "wp-hub-west": {
    id: "wp-hub-west",
    label: "Holo Hub (West)",
    position: [-1.55, 0, 0.8],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-corridor-nw", "wp-ws-gamma", "wp-corridor-sw"],
    zone: "holohub",
  },
  "wp-hub-east": {
    id: "wp-hub-east",
    label: "Holo Hub (East)",
    position: [2.35, 0, 0.8],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-corridor-ne", "wp-corridor-se", "wp-ws-delta"],
    zone: "holohub",
  },
  "wp-hub-south": {
    id: "wp-hub-south",
    label: "Holo Hub (South)",
    position: [0.4, 0, 2.85],
    facingYaw: Math.PI,
    neighbors: ["wp-corridor-sw", "wp-corridor-se"],
    zone: "holohub",
  },
  "wp-server-bay": {
    id: "wp-server-bay",
    label: "Quantum Server Bay",
    position: [4.8, 0, -3.1],
    facingYaw: Math.PI,
    neighbors: ["wp-corridor-ne"],
    zone: "server",
  },
  "wp-corridor-nw": {
    id: "wp-corridor-nw",
    label: "Corridor NW",
    position: [-1.85, 0, -1.35],
    facingYaw: 0,
    neighbors: ["wp-ws-alpha", "wp-ws-beta", "wp-hub-north", "wp-hub-west"],
    zone: "corridor",
  },
  "wp-corridor-ne": {
    id: "wp-corridor-ne",
    label: "Corridor NE",
    position: [2.85, 0, -1.35],
    facingYaw: 0,
    neighbors: ["wp-ws-beta", "wp-hub-north", "wp-hub-east", "wp-server-bay"],
    zone: "corridor",
  },
  "wp-corridor-sw": {
    id: "wp-corridor-sw",
    label: "Corridor SW",
    position: [-1.45, 0, 3.35],
    facingYaw: 0,
    neighbors: ["wp-ws-gamma", "wp-hub-west", "wp-hub-south"],
    zone: "corridor",
  },
  "wp-corridor-se": {
    id: "wp-corridor-se",
    label: "Corridor SE",
    position: [2.45, 0, 3.35],
    facingYaw: 0,
    neighbors: ["wp-hub-south", "wp-hub-east", "wp-ws-delta"],
    zone: "corridor",
  },
};

/**
 * Computes a collision-free corridor path between any two waypoints via BFS.
 */
export function findWaypointPath(startId: string, endId: string): string[] {
  if (startId === endId) return [endId];
  if (!OFFICE_WAYPOINTS[startId] || !OFFICE_WAYPOINTS[endId]) {
    return [endId];
  }

  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const node = OFFICE_WAYPOINTS[current];
    if (!node) continue;

    for (const neighbor of node.neighbors) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [endId];
}

export const INITIAL_WORKSTATIONS: Workstation[] = [
  {
    id: "ws-alpha",
    code: "WS-01",
    name: "Alpha Dev Rig",
    position: [-3.8, 0, -3.2],
    rotationY: 0,
    accentColor: "#00e5ff",
    waypointId: "wp-ws-alpha",
    assignedAgentId: "unit-01",
    specs: "Dual Holo-Display • Code Terminal",
  },
  {
    id: "ws-beta",
    code: "WS-02",
    name: "Beta Analytics Pod",
    position: [1.2, 0, -3.2],
    rotationY: 0,
    accentColor: "#a855f7",
    waypointId: "wp-ws-beta",
    assignedAgentId: "unit-02",
    specs: "Ultrawide Telemetry • Data Core",
  },
  {
    id: "ws-gamma",
    code: "WS-03",
    name: "Gamma Automation Desk",
    position: [-3.6, 0, 2.0],
    rotationY: Math.PI / 2,
    accentColor: "#38bdf8",
    waypointId: "wp-ws-gamma",
    assignedAgentId: "unit-03",
    specs: "Workflow Console • Bot Dock",
  },
  {
    id: "ws-delta",
    code: "WS-04",
    name: "Delta Sandbox Rig",
    position: [3.6, 0, 2.0],
    rotationY: 0,
    accentColor: "#c084fc",
    waypointId: "wp-ws-delta",
    assignedAgentId: null,
    specs: "Reserved Expansion Station",
  },
];

export const INITIAL_AGENTS: OfficeAgent[] = [
  {
    id: "unit-01",
    code: "UNIT-01",
    name: "NOVA-X",
    role: "Lead Code Architect (Placeholder)",
    accentColor: "#00e5ff",
    secondaryColor: "#0284c7",
    isVisualPlaceholder: true,
    status: "working",
    assignedWorkstationId: "ws-alpha",
    currentWaypointId: "wp-ws-alpha",
    targetWaypointId: "wp-ws-alpha",
    patrolWaypoints: ["wp-ws-alpha", "wp-hub-north", "wp-server-bay"],
    simulatedLoad: 64,
    energyLevel: 96,
    currentActionLabel: "Simulasi mengetik di Alpha Dev Rig",
    futureModelSlot: "Future LLM Slot (Unbound)",
  },
  {
    id: "unit-02",
    code: "UNIT-02",
    name: "VEXA-9",
    role: "Data & Ops Analyst (Placeholder)",
    accentColor: "#a855f7",
    secondaryColor: "#7e22ce",
    isVisualPlaceholder: true,
    status: "walking",
    assignedWorkstationId: "ws-beta",
    currentWaypointId: "wp-ws-beta",
    targetWaypointId: "wp-hub-east",
    patrolWaypoints: ["wp-ws-beta", "wp-hub-east", "wp-server-bay", "wp-hub-south"],
    simulatedLoad: 48,
    energyLevel: 91,
    currentActionLabel: "Patroli visual menuju Holo Hub",
    futureModelSlot: "Future Analytics Agent Slot (Unbound)",
  },
  {
    id: "unit-03",
    code: "UNIT-03",
    name: "KAIRO-7",
    role: "Automation Specialist (Placeholder)",
    accentColor: "#38bdf8",
    secondaryColor: "#4f46e5",
    isVisualPlaceholder: true,
    status: "idle",
    assignedWorkstationId: "ws-gamma",
    currentWaypointId: "wp-ws-gamma",
    targetWaypointId: "wp-ws-gamma",
    patrolWaypoints: ["wp-ws-gamma", "wp-hub-west", "wp-ws-delta"],
    simulatedLoad: 22,
    energyLevel: 99,
    currentActionLabel: "Idle standby di Gamma Automation Desk",
    futureModelSlot: "Future Workflow Runner Slot (Unbound)",
  },
];

export const INITIAL_TASKS: OfficeTask[] = [
  {
    id: "task-01",
    title: "Validasi layout 3D Virtual Office & jalur navigasi robot",
    description:
      "Pastikan karakter placeholder bergerak mulus antar workstation tanpa tabrakan dengan meja atau Holo Hub.",
    status: "in_progress",
    priority: "high",
    assignedAgentId: "unit-01",
    category: "architecture",
    createdAt: "2026-11-22T01:30:00.000Z",
    updatedAt: "2026-11-22T02:10:00.000Z",
    isSimulatedPlaceholder: true,
  },
  {
    id: "task-02",
    title: "Siapkan skema tabel Supabase untuk Agents & Tasks",
    description:
      "Rancang struktur tabel PostgreSQL dan Row Level Security sebelum fase integrasi backend Supabase.",
    status: "review",
    priority: "medium",
    assignedAgentId: "unit-02",
    category: "ops",
    createdAt: "2026-11-22T01:15:00.000Z",
    updatedAt: "2026-11-22T02:00:00.000Z",
    isSimulatedPlaceholder: true,
  },
  {
    id: "task-03",
    title: "Optimasi DPR & mode performa Android Eco",
    description:
      "Pastikan render WebGL tetap ringan di perangkat Android dengan geometri low-poly dan penghematan shadow.",
    status: "done",
    priority: "critical",
    assignedAgentId: "unit-03",
    category: "ui-ux",
    createdAt: "2026-11-22T00:45:00.000Z",
    updatedAt: "2026-11-22T01:50:00.000Z",
    isSimulatedPlaceholder: true,
  },
  {
    id: "task-04",
    title: "Integrasi Server-Side AI Gateway (Fase 2)",
    description:
      "Hubungkan Next.js Route Handlers ke penyedia AI API secara aman tanpa menaruh API key di frontend.",
    status: "backlog",
    priority: "medium",
    assignedAgentId: null,
    category: "automation",
    createdAt: "2026-11-22T00:30:00.000Z",
    updatedAt: "2026-11-22T00:30:00.000Z",
    isSimulatedPlaceholder: true,
  },
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: "act-01",
    timestamp: "02:35:10",
    actor: "SYSTEM",
    actorType: "system",
    message:
      "FAJREZZZ AI OFFICE aktif dalam mode Visual Placeholder (tanpa koneksi AI API).",
    severity: "system",
    zone: "Core OS",
  },
  {
    id: "act-02",
    timestamp: "02:35:14",
    actor: "NOVA-X",
    actorType: "robot-placeholder",
    message: "Memulai animasi kerja simulasi di Workstation Alpha (WS-01).",
    severity: "info",
    zone: "WS-01",
  },
  {
    id: "act-03",
    timestamp: "02:35:19",
    actor: "VEXA-9",
    actorType: "robot-placeholder",
    message: "Berjalan mengikuti jalur koridor menuju Holo Hub (East).",
    severity: "info",
    zone: "Holo Hub",
  },
  {
    id: "act-04",
    timestamp: "02:35:22",
    actor: "KAIRO-7",
    actorType: "robot-placeholder",
    message: "Mode idle aktif di Workstation Gamma (WS-03).",
    severity: "success",
    zone: "WS-03",
  },
];

export const DESTINATION_PRESETS = [
  { id: "wp-ws-alpha", label: "WS-01 Alpha" },
  { id: "wp-ws-beta", label: "WS-02 Beta" },
  { id: "wp-ws-gamma", label: "WS-03 Gamma" },
  { id: "wp-ws-delta", label: "WS-04 Delta" },
  { id: "wp-hub-north", label: "Holo Hub (N)" },
  { id: "wp-hub-east", label: "Holo Hub (E)" },
  { id: "wp-server-bay", label: "Server Bay" },
] as const;
