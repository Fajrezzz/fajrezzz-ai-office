import type {
  ActivityEvent,
  OfficeAgent,
  OfficeTask,
  WaypointNode,
  Workstation,
} from "@/types/office";

export const FLOOR_2_Y = 3.28;

export const OFFICE_WAYPOINTS: Record<string, WaypointNode> = {
  "wp-ws-alpha": {
    id: "wp-ws-alpha",
    label: "L2 • WS-01 Alpha",
    position: [-5.4, FLOOR_2_Y, -2.65],
    facingYaw: Math.PI,
    neighbors: ["wp-aisle-w"],
    zone: "workstation",
  },
  "wp-ws-beta": {
    id: "wp-ws-beta",
    label: "L2 • WS-02 Beta",
    position: [-1.8, FLOOR_2_Y, -2.65],
    facingYaw: Math.PI,
    neighbors: ["wp-aisle-cw"],
    zone: "workstation",
  },
  "wp-ws-gamma": {
    id: "wp-ws-gamma",
    label: "L2 • WS-03 Gamma",
    position: [1.8, FLOOR_2_Y, -2.65],
    facingYaw: Math.PI,
    neighbors: ["wp-aisle-ce"],
    zone: "workstation",
  },
  "wp-ws-delta": {
    id: "wp-ws-delta",
    label: "L2 • WS-04 Delta",
    position: [5.4, FLOOR_2_Y, -2.65],
    facingYaw: Math.PI,
    neighbors: ["wp-aisle-e"],
    zone: "workstation",
  },
  "wp-aisle-w": {
    id: "wp-aisle-w",
    label: "L2 Corridor West",
    position: [-5.4, FLOOR_2_Y, -1.65],
    facingYaw: 0,
    neighbors: ["wp-ws-alpha", "wp-aisle-cw", "wp-server-bay"],
    zone: "corridor",
  },
  "wp-aisle-cw": {
    id: "wp-aisle-cw",
    label: "L2 Corridor Center-W",
    position: [-1.8, FLOOR_2_Y, -1.65],
    facingYaw: 0,
    neighbors: ["wp-ws-beta", "wp-aisle-w", "wp-hub-north", "wp-hub-west"],
    zone: "corridor",
  },
  "wp-hub-north": {
    id: "wp-hub-north",
    label: "L2 • Holo Hub",
    position: [0.0, FLOOR_2_Y, -1.65],
    facingYaw: 0,
    neighbors: ["wp-aisle-cw", "wp-aisle-ce"],
    zone: "holohub",
  },
  "wp-aisle-ce": {
    id: "wp-aisle-ce",
    label: "L2 Corridor Center-E",
    position: [1.8, FLOOR_2_Y, -1.65],
    facingYaw: 0,
    neighbors: ["wp-ws-gamma", "wp-hub-north", "wp-aisle-e", "wp-hub-east"],
    zone: "corridor",
  },
  "wp-aisle-e": {
    id: "wp-aisle-e",
    label: "L2 Corridor East",
    position: [5.4, FLOOR_2_Y, -1.65],
    facingYaw: 0,
    neighbors: ["wp-ws-delta", "wp-aisle-ce", "wp-hub-east"],
    zone: "corridor",
  },
  "wp-hub-west": {
    id: "wp-hub-west",
    label: "L2 • Holo Hub (W)",
    position: [-2.2, FLOOR_2_Y, 0.0],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-aisle-cw", "wp-server-bay", "wp-glass-view"],
    zone: "holohub",
  },
  "wp-hub-east": {
    id: "wp-hub-east",
    label: "L2 • Holo Hub (E)",
    position: [2.2, FLOOR_2_Y, 0.0],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-aisle-ce", "wp-aisle-e", "wp-glass-view"],
    zone: "holohub",
  },
  "wp-glass-view": {
    id: "wp-glass-view",
    label: "L2 • Glass Deck View",
    position: [0.0, FLOOR_2_Y, 1.35],
    facingYaw: 0,
    neighbors: ["wp-hub-west", "wp-hub-east"],
    zone: "holohub",
  },
  "wp-server-bay": {
    id: "wp-server-bay",
    label: "L2 • Quantum Server Bay",
    position: [-6.1, FLOOR_2_Y, -0.2],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-aisle-w", "wp-hub-west"],
    zone: "server",
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
    position: [-5.4, FLOOR_2_Y, -4.0],
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
    position: [-1.8, FLOOR_2_Y, -4.0],
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
    position: [1.8, FLOOR_2_Y, -4.0],
    rotationY: 0,
    accentColor: "#22d3ee",
    waypointId: "wp-ws-gamma",
    assignedAgentId: "unit-03",
    specs: "Workflow Console • Bot Dock",
  },
  {
    id: "ws-delta",
    code: "WS-04",
    name: "Delta Sandbox Rig",
    position: [5.4, FLOOR_2_Y, -4.0],
    rotationY: 0,
    accentColor: "#ec4899",
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
    currentActionLabel: "Simulasi mengetik di Alpha Dev Rig (L2)",
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
    targetWaypointId: "wp-glass-view",
    patrolWaypoints: ["wp-ws-beta", "wp-hub-east", "wp-glass-view", "wp-server-bay"],
    simulatedLoad: 48,
    energyLevel: 91,
    currentActionLabel: "Patroli visual menuju Glass Deck View (L2)",
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
    currentActionLabel: "Idle standby di Gamma Automation Desk (L2)",
    futureModelSlot: "Future Workflow Runner Slot (Unbound)",
  },
];

export const INITIAL_TASKS: OfficeTask[] = [
  {
    id: "task-01",
    title: "Validasi gedung HQ 3 lantai, kolam neon & jalur navigasi robot",
    description:
      "Pastikan karakter placeholder bergerak mulus di Lantai 2 antar workstation, Holo Hub, dan Server Bay.",
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
      "FAJREZZZ AI OFFICE HQ 3-Lantai aktif dalam mode Visual Placeholder (tanpa API AI).",
    severity: "system",
    zone: "Core OS",
  },
  {
    id: "act-02",
    timestamp: "02:35:14",
    actor: "NOVA-X",
    actorType: "robot-placeholder",
    message: "Memulai animasi kerja simulasi di Workstation Alpha (L2 • WS-01).",
    severity: "info",
    zone: "L2 • WS-01",
  },
  {
    id: "act-03",
    timestamp: "02:35:19",
    actor: "VEXA-9",
    actorType: "robot-placeholder",
    message: "Berjalan menuju Glass Deck View menghadap kolam neon.",
    severity: "info",
    zone: "L2 • Glass Deck",
  },
  {
    id: "act-04",
    timestamp: "02:35:22",
    actor: "KAIRO-7",
    actorType: "robot-placeholder",
    message: "Mode idle aktif di Workstation Gamma (L2 • WS-03).",
    severity: "success",
    zone: "L2 • WS-03",
  },
];

export const DESTINATION_PRESETS = [
  { id: "wp-ws-alpha", label: "WS-01 Alpha" },
  { id: "wp-ws-beta", label: "WS-02 Beta" },
  { id: "wp-ws-gamma", label: "WS-03 Gamma" },
  { id: "wp-ws-delta", label: "WS-04 Delta" },
  { id: "wp-hub-north", label: "Holo Hub" },
  { id: "wp-glass-view", label: "Glass Deck" },
  { id: "wp-server-bay", label: "Server Bay" },
] as const;
