import type {
  ActivityEvent,
  AvatarAppearance,
  OfficeAgent,
  OfficeTask,
  WaypointNode,
  Workstation,
} from "@/types/office";
import { ACTIVE_EMPLOYEE_ROSTER } from "../config/team-roster.ts";

export const FLOOR_1_Y = 0.18;
export const FLOOR_2_Y = 3.9;
export const FLOOR_3_Y = 7.8;
export const FLOOR_4_Y = 11.6;
export const FLOOR_5_Y = 15.4;
export const ROOF_Y = 19.2;

export const OFFICE_WAYPOINTS: Record<string, WaypointNode> = {
  // ================= FLOOR 1 — LOBBY, HOLOGRAM PORTAL & COORDINATION HUB =================
  "wp-l1-seat": {
    id: "wp-l1-seat",
    label: "L1 • Kursi Lounge Lobby",
    floor: 1,
    position: [3.0, FLOOR_1_Y, -1.6],
    facingYaw: 0,
    neighbors: ["wp-l1-reception", "wp-l1-entrance"],
    zone: "lobby",
  },
  "wp-l1-reception": {
    id: "wp-l1-reception",
    label: "L1 • Grand Reception & Portal",
    floor: 1,
    position: [0.0, FLOOR_1_Y, -3.2],
    facingYaw: 0,
    neighbors: ["wp-l1-entrance", "wp-l1-seat"],
    zone: "lobby",
  },
  "wp-l1-entrance": {
    id: "wp-l1-entrance",
    label: "L1 • Glass Lobby",
    floor: 1,
    position: [0.0, FLOOR_1_Y, 2.6],
    facingYaw: 0,
    neighbors: ["wp-l1-reception", "wp-l1-seat", "wp-pool-deck", "wp-supercar-bay"],
    zone: "lobby",
  },
  "wp-pool-deck": {
    id: "wp-pool-deck",
    label: "Outdoor • Pool Deck",
    floor: 1,
    position: [-3.8, FLOOR_1_Y, 6.2],
    facingYaw: 0,
    neighbors: ["wp-l1-entrance", "wp-supercar-bay"],
    zone: "outdoor",
  },
  "wp-supercar-bay": {
    id: "wp-supercar-bay",
    label: "Outdoor • Supercar Bay",
    floor: 1,
    position: [6.4, FLOOR_1_Y, 9.2],
    facingYaw: 0.6,
    neighbors: ["wp-l1-entrance", "wp-pool-deck"],
    zone: "outdoor",
  },

  // ================= FLOOR 2 — RESEARCH (3) & SCRIPT (2) (5 WORKSTATIONS) =================
  "wp-ws-01": {
    id: "wp-ws-01",
    label: "L2 • RES-01 Raka (Research)",
    floor: 2,
    position: [-9.0, FLOOR_2_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-l2-mid-1"],
    zone: "workstation",
  },
  "wp-ws-02": {
    id: "wp-ws-02",
    label: "L2 • RES-02 Nadia (SEO/Rank)",
    floor: 2,
    position: [-3.0, FLOOR_2_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-l2-mid-2"],
    zone: "workstation",
  },
  "wp-ws-03": {
    id: "wp-ws-03",
    label: "L2 • RES-03 Alya (Fact-Check)",
    floor: 2,
    position: [3.0, FLOOR_2_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-l2-mid-3"],
    zone: "workstation",
  },
  "wp-ws-04": {
    id: "wp-ws-04",
    label: "L2 • SCR-01 Dimas (Script Lead)",
    floor: 2,
    position: [-6.0, FLOOR_2_Y, 0.26],
    facingYaw: Math.PI,
    neighbors: ["wp-l2-front-2"],
    zone: "workstation",
  },
  "wp-ws-05": {
    id: "wp-ws-05",
    label: "L2 • SCR-02 Bagas (Demo Script)",
    floor: 2,
    position: [6.0, FLOOR_2_Y, 0.26],
    facingYaw: Math.PI,
    neighbors: ["wp-l2-front-3"],
    zone: "workstation",
  },

  // Floor 2 Corridor & Lounges
  "wp-l2-mid-1": {
    id: "wp-l2-mid-1",
    label: "L2 • Koridor Barat",
    floor: 2,
    position: [-9.0, FLOOR_2_Y, -3.2],
    facingYaw: 0,
    neighbors: ["wp-ws-01", "wp-l2-mid-2", "wp-f2-lounge-w", "wp-l2-front-1"],
    zone: "corridor",
  },
  "wp-l2-mid-2": {
    id: "wp-l2-mid-2",
    label: "L2 • Tengah Barat",
    floor: 2,
    position: [-3.0, FLOOR_2_Y, -3.2],
    facingYaw: 0,
    neighbors: ["wp-ws-02", "wp-l2-mid-1", "wp-l2-hub", "wp-l2-front-2"],
    zone: "corridor",
  },
  "wp-l2-hub": {
    id: "wp-l2-hub",
    label: "L2 • Research Hub",
    floor: 2,
    position: [0.0, FLOOR_2_Y, -3.2],
    facingYaw: 0,
    neighbors: ["wp-l2-mid-2", "wp-l2-mid-3", "wp-l2-promenade"],
    zone: "holohub",
  },
  "wp-l2-mid-3": {
    id: "wp-l2-mid-3",
    label: "L2 • Tengah Timur",
    floor: 2,
    position: [3.0, FLOOR_2_Y, -3.2],
    facingYaw: 0,
    neighbors: ["wp-ws-03", "wp-l2-hub", "wp-f2-lounge-e", "wp-l2-front-3"],
    zone: "corridor",
  },
  "wp-l2-front-1": {
    id: "wp-l2-front-1",
    label: "L2 • Glass View Barat",
    floor: 2,
    position: [-9.0, FLOOR_2_Y, 2.35],
    facingYaw: 0,
    neighbors: ["wp-l2-mid-1", "wp-l2-front-2"],
    zone: "corridor",
  },
  "wp-l2-front-2": {
    id: "wp-l2-front-2",
    label: "L2 • Promenade Barat",
    floor: 2,
    position: [-5.5, FLOOR_2_Y, 2.35],
    facingYaw: 0,
    neighbors: ["wp-ws-04", "wp-l2-front-1", "wp-l2-mid-2", "wp-l2-promenade"],
    zone: "corridor",
  },
  "wp-l2-promenade": {
    id: "wp-l2-promenade",
    label: "L2 • Panoramic Hall",
    floor: 2,
    position: [0.0, FLOOR_2_Y, 2.35],
    facingYaw: 0,
    neighbors: ["wp-l2-front-2", "wp-l2-front-3", "wp-l2-hub"],
    zone: "holohub",
  },
  "wp-l2-front-3": {
    id: "wp-l2-front-3",
    label: "L2 • Promenade Timur",
    floor: 2,
    position: [5.5, FLOOR_2_Y, 2.35],
    facingYaw: 0,
    neighbors: ["wp-ws-05", "wp-l2-promenade", "wp-l2-mid-3", "wp-f2-lounge-e"],
    zone: "corridor",
  },
  "wp-f2-lounge-w": {
    id: "wp-f2-lounge-w",
    label: "L2 • Coffee Lounge Barat",
    floor: 2,
    position: [-11.0, FLOOR_2_Y, -3.2],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-l2-mid-1", "wp-seat-01", "wp-seat-02", "wp-seat-03"],
    zone: "holohub",
  },
  "wp-f2-lounge-e": {
    id: "wp-f2-lounge-e",
    label: "L2 • Coffee Lounge Timur",
    floor: 2,
    position: [10.6, FLOOR_2_Y, -3.2],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-l2-mid-3", "wp-l2-front-3", "wp-seat-06", "wp-seat-07", "wp-seat-08"],
    zone: "holohub",
  },
  // Legacy seat aliases for backward compatibility
  "wp-l2-server": {
    id: "wp-l2-server",
    label: "L2 • Coffee Lounge Kiri",
    floor: 2,
    position: [-10.6, FLOOR_2_Y, -3.2],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-l2-mid-1", "wp-f2-lounge-w"],
    zone: "holohub",
  },
  "wp-l2-lounge": {
    id: "wp-l2-lounge",
    label: "L2 • Coffee Lounge Kanan",
    floor: 2,
    position: [10.6, FLOOR_2_Y, -3.2],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-l2-mid-3", "wp-f2-lounge-e"],
    zone: "holohub",
  },
  "wp-seat-01": {
    id: "wp-seat-01",
    label: "L2 • Coffee Bar Kiri 1",
    floor: 2,
    position: [-11.35, FLOOR_2_Y, -5.9],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f2-lounge-w"],
    zone: "holohub",
  },
  "wp-seat-02": {
    id: "wp-seat-02",
    label: "L2 • Coffee Bar Kiri 2",
    floor: 2,
    position: [-11.35, FLOOR_2_Y, -4.6],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f2-lounge-w"],
    zone: "holohub",
  },
  "wp-seat-03": {
    id: "wp-seat-03",
    label: "L2 • Coffee Bar Kiri 3",
    floor: 2,
    position: [-11.35, FLOOR_2_Y, -3.3],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f2-lounge-w"],
    zone: "holohub",
  },
  "wp-seat-04": {
    id: "wp-seat-04",
    label: "L2 • Balkon Kiri",
    floor: 2,
    position: [-5.5, FLOOR_2_Y, 4.4],
    facingYaw: 0,
    neighbors: ["wp-l2-front-2"],
    zone: "holohub",
  },
  "wp-seat-05": {
    id: "wp-seat-05",
    label: "L2 • Balkon Kanan",
    floor: 2,
    position: [5.5, FLOOR_2_Y, 4.4],
    facingYaw: 0,
    neighbors: ["wp-l2-front-3"],
    zone: "holohub",
  },
  "wp-seat-06": {
    id: "wp-seat-06",
    label: "L2 • Coffee Bar Kanan 1",
    floor: 2,
    position: [11.35, FLOOR_2_Y, -5.9],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-f2-lounge-e"],
    zone: "holohub",
  },
  "wp-seat-07": {
    id: "wp-seat-07",
    label: "L2 • Coffee Bar Kanan 2",
    floor: 2,
    position: [11.35, FLOOR_2_Y, -4.6],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-f2-lounge-e"],
    zone: "holohub",
  },
  "wp-seat-08": {
    id: "wp-seat-08",
    label: "L2 • Coffee Bar Kanan 3",
    floor: 2,
    position: [11.35, FLOOR_2_Y, -3.3],
    facingYaw: Math.PI / 2,
    neighbors: ["wp-f2-lounge-e"],
    zone: "holohub",
  },

  // ================= FLOOR 3 — VISUAL & MOTION DESIGN (3 WORKSTATIONS) =================
  "wp-ws-06": {
    id: "wp-ws-06",
    label: "L3 • MOT-01 Clara (Remotion)",
    floor: 3,
    position: [-7.5, FLOOR_3_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f3-hub"],
    zone: "workstation",
  },
  "wp-ws-07": {
    id: "wp-ws-07",
    label: "L3 • MOT-02 Siti (GSAP Motion)",
    floor: 3,
    position: [0.0, FLOOR_3_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f3-hub"],
    zone: "workstation",
  },
  "wp-ws-08": {
    id: "wp-ws-08",
    label: "L3 • MOT-03 Reza (UI/Diagram)",
    floor: 3,
    position: [7.5, FLOOR_3_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f3-hub"],
    zone: "workstation",
  },
  "wp-f3-hub": {
    id: "wp-f3-hub",
    label: "L3 • Motion Studio Hub",
    floor: 3,
    position: [0.0, FLOOR_3_Y, -1.8],
    facingYaw: 0,
    neighbors: ["wp-ws-06", "wp-ws-07", "wp-ws-08", "wp-f3-lounge", "wp-l3-balcony"],
    zone: "corridor",
  },
  "wp-f3-lounge": {
    id: "wp-f3-lounge",
    label: "L3 • Creative Review Lounge",
    floor: 3,
    position: [7.8, FLOOR_3_Y, 1.4],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f3-hub", "wp-l3-balcony"],
    zone: "holohub",
  },
  "wp-l3-boardroom": {
    id: "wp-l3-boardroom",
    label: "L3 • Design Review Desk",
    floor: 3,
    position: [-6.0, FLOOR_3_Y, 1.4],
    facingYaw: Math.PI,
    neighbors: ["wp-f3-hub", "wp-l3-balcony"],
    zone: "executive",
  },
  "wp-l3-lounge": {
    id: "wp-l3-lounge",
    label: "L3 • Sky Lounge",
    floor: 3,
    position: [6.5, FLOOR_3_Y, 1.6],
    facingYaw: Math.PI,
    neighbors: ["wp-f3-hub", "wp-l3-balcony"],
    zone: "executive",
  },
  "wp-l3-balcony": {
    id: "wp-l3-balcony",
    label: "L3 • Panoramic Deck",
    floor: 3,
    position: [0.0, FLOOR_3_Y, 2.4],
    facingYaw: 0,
    neighbors: ["wp-f3-hub", "wp-f3-lounge", "wp-l3-boardroom"],
    zone: "executive",
  },

  // ================= FLOOR 4 — VIDEO EDITING & RENDERING (3 WORKSTATIONS) =================
  "wp-ws-09": {
    id: "wp-ws-09",
    label: "L4 • EDT-01 Salsa (Video Editor)",
    floor: 4,
    position: [-7.5, FLOOR_4_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f4-hub"],
    zone: "workstation",
  },
  "wp-ws-10": {
    id: "wp-ws-10",
    label: "L4 • EDT-02 Kevin (Render Eng)",
    floor: 4,
    position: [0.0, FLOOR_4_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f4-hub"],
    zone: "workstation",
  },
  "wp-ws-11": {
    id: "wp-ws-11",
    label: "L4 • EDT-03 Putri (SFX & Polish)",
    floor: 4,
    position: [7.5, FLOOR_4_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f4-hub"],
    zone: "workstation",
  },
  "wp-f4-hub": {
    id: "wp-f4-hub",
    label: "L4 • Render Pipeline Corridor",
    floor: 4,
    position: [0.0, FLOOR_4_Y, -1.6],
    facingYaw: 0,
    neighbors: ["wp-ws-09", "wp-ws-10", "wp-ws-11", "wp-f4-lounge", "wp-f4-deck"],
    zone: "corridor",
  },
  "wp-f4-lounge": {
    id: "wp-f4-lounge",
    label: "L4 • Editing Lounge",
    floor: 4,
    position: [7.5, FLOOR_4_Y, 1.6],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f4-hub", "wp-f4-deck"],
    zone: "holohub",
  },
  "wp-f4-deck": {
    id: "wp-f4-deck",
    label: "L4 • Render Bay Deck",
    floor: 4,
    position: [-4.5, FLOOR_4_Y, 1.8],
    facingYaw: 0,
    neighbors: ["wp-f4-hub", "wp-f4-lounge"],
    zone: "corridor",
  },

  // ================= FLOOR 5 — VOICE, SUBTITLE (2) & QUALITY CONTROL (2) (4 WORKSTATIONS) =================
  "wp-ws-12": {
    id: "wp-ws-12",
    label: "L5 • VOX-01 Bima (Voice & Mix)",
    floor: 5,
    position: [-9.0, FLOOR_5_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f5-hub"],
    zone: "workstation",
  },
  "wp-ws-13": {
    id: "wp-ws-13",
    label: "L5 • VOX-02 Dewi (Subtitles 0ms)",
    floor: 5,
    position: [-3.0, FLOOR_5_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f5-hub"],
    zone: "workstation",
  },
  "wp-ws-14": {
    id: "wp-ws-14",
    label: "L5 • QAC-01 Fajar (QC Audit)",
    floor: 5,
    position: [3.0, FLOOR_5_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f5-hub"],
    zone: "workstation",
  },
  "wp-ws-15": {
    id: "wp-ws-15",
    label: "L5 • QAC-02 Hendra (Mobile QC)",
    floor: 5,
    position: [9.0, FLOOR_5_Y, -5.34],
    facingYaw: Math.PI,
    neighbors: ["wp-f5-hub"],
    zone: "workstation",
  },
  "wp-f5-hub": {
    id: "wp-f5-hub",
    label: "L5 • Voice & QC Hub",
    floor: 5,
    position: [0.0, FLOOR_5_Y, -1.6],
    facingYaw: 0,
    neighbors: ["wp-ws-12", "wp-ws-13", "wp-ws-14", "wp-ws-15", "wp-f5-lounge", "wp-f5-deck"],
    zone: "corridor",
  },
  "wp-f5-lounge": {
    id: "wp-f5-lounge",
    label: "L5 • Sound & QC Break Deck",
    floor: 5,
    position: [7.5, FLOOR_5_Y, 1.6],
    facingYaw: -Math.PI / 2,
    neighbors: ["wp-f5-hub", "wp-f5-deck"],
    zone: "holohub",
  },
  "wp-f5-deck": {
    id: "wp-f5-deck",
    label: "L5 • Executive Sky Deck",
    floor: 5,
    position: [-4.5, FLOOR_5_Y, 1.8],
    facingYaw: 0,
    neighbors: ["wp-f5-hub", "wp-f5-lounge"],
    zone: "executive",
  },
};

/**
 * Computes a collision-free corridor path between any two waypoints on the same floor via BFS.
 */
export function findWaypointPath(startId: string, endId: string): string[] {
  if (startId === endId) return [endId];
  const startNode = OFFICE_WAYPOINTS[startId];
  const endNode = OFFICE_WAYPOINTS[endId];
  if (!startNode || !endNode) return [endId];

  if (startNode.floor !== endNode.floor) {
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
  // Floor 2 — Research & Script (5 Workstations)
  {
    id: "ws-01",
    code: "RES-01",
    name: "AI Trend Intelligence Desk",
    floor: 2,
    divisionTeam: "research_trend",
    position: [-9.0, FLOOR_2_Y, -6.2],
    rotationY: 0,
    accentColor: "#0ea5e9",
    waypointId: "wp-ws-01",
    assignedAgentId: "staff-01",
    specs: "GitHub API Radar • 5-Factor Ranker",
  },
  {
    id: "ws-02",
    code: "RES-02",
    name: "SEO & Topic Ranking Station",
    floor: 2,
    divisionTeam: "research_trend",
    position: [-3.0, FLOOR_2_Y, -6.2],
    rotationY: 0,
    accentColor: "#38bdf8",
    waypointId: "wp-ws-02",
    assignedAgentId: "staff-02",
    specs: "TikTok Hook Matrix • CTR Analyzer",
  },
  {
    id: "ws-03",
    code: "RES-03",
    name: "Fact-Check & Source Audit Desk",
    floor: 2,
    divisionTeam: "research_trend",
    position: [3.0, FLOOR_2_Y, -6.2],
    rotationY: 0,
    accentColor: "#0284c7",
    waypointId: "wp-ws-03",
    assignedAgentId: "staff-08",
    specs: "Official Release Verifier • ECC Guard",
  },
  {
    id: "ws-04",
    code: "SCR-01",
    name: "Hook & Narrative Script Desk",
    floor: 2,
    divisionTeam: "script_story",
    position: [-6.0, FLOOR_2_Y, -0.6],
    rotationY: 0,
    accentColor: "#f59e0b",
    waypointId: "wp-ws-04",
    assignedAgentId: "staff-03",
    specs: "0–2s Hook Writer • Storyboard Suite",
  },
  {
    id: "ws-05",
    code: "SCR-02",
    name: "Technical Demo Script Pod",
    floor: 2,
    divisionTeam: "script_story",
    position: [6.0, FLOOR_2_Y, -0.6],
    rotationY: 0,
    accentColor: "#fbbf24",
    waypointId: "wp-ws-05",
    assignedAgentId: "staff-09",
    specs: "Claude Code CLI Demo • Diff Script",
  },

  // Floor 3 — Visual & Motion Design (3 Workstations)
  {
    id: "ws-06",
    code: "MOT-01",
    name: "Remotion 9:16 Composition Rig",
    floor: 3,
    divisionTeam: "visual_motion",
    position: [-7.5, FLOOR_3_Y, -6.2],
    rotationY: 0,
    accentColor: "#ec4899",
    waypointId: "wp-ws-06",
    assignedAgentId: "staff-04",
    specs: "Remotion 4.0 • React 9:16 Stage",
  },
  {
    id: "ws-07",
    code: "MOT-02",
    name: "GSAP Choreography Workstation",
    floor: 3,
    divisionTeam: "visual_motion",
    position: [0.0, FLOOR_3_Y, -6.2],
    rotationY: 0,
    accentColor: "#f472b6",
    waypointId: "wp-ws-07",
    assignedAgentId: "staff-10",
    specs: "GSAP 3.15 Timelines • Style Director",
  },
  {
    id: "ws-08",
    code: "MOT-03",
    name: "UI / Terminal & Diagram Rig",
    floor: 3,
    divisionTeam: "visual_motion",
    position: [7.5, FLOOR_3_Y, -6.2],
    rotationY: 0,
    accentColor: "#db2777",
    waypointId: "wp-ws-08",
    assignedAgentId: "staff-11",
    specs: "4K Vector Canvas • Multi-Agent Graph",
  },

  // Floor 4 — Video Editing & Rendering (3 Workstations)
  {
    id: "ws-09",
    code: "EDT-01",
    name: "TikTok 9:16 Master Edit Suite",
    floor: 4,
    divisionTeam: "video_editing",
    position: [-7.5, FLOOR_4_Y, -6.2],
    rotationY: 0,
    accentColor: "#a855f7",
    waypointId: "wp-ws-09",
    assignedAgentId: "staff-06",
    specs: "Dual-Scene Transitions • Style Presets",
  },
  {
    id: "ws-10",
    code: "EDT-02",
    name: "WebCodecs / FFmpeg Render Node",
    floor: 4,
    divisionTeam: "video_editing",
    position: [0.0, FLOOR_4_Y, -6.2],
    rotationY: 0,
    accentColor: "#9333ea",
    waypointId: "wp-ws-10",
    assignedAgentId: "staff-12",
    specs: "H.264/AAC MP4 • 4K/2K/1080p Ladder",
  },
  {
    id: "ws-11",
    code: "EDT-03",
    name: "SFX, Pacing & Polish Desk",
    floor: 4,
    divisionTeam: "video_editing",
    position: [7.5, FLOOR_4_Y, -6.2],
    rotationY: 0,
    accentColor: "#c084fc",
    waypointId: "wp-ws-11",
    assignedAgentId: "staff-13",
    specs: "Whoosh/Click SFX • Cover Thumbnail",
  },

  // Floor 5 — Voice, Subtitle & Quality Control (4 Workstations)
  {
    id: "ws-12",
    code: "VOX-01",
    name: "Neural TTS & Audio Mix Booth",
    floor: 5,
    divisionTeam: "voice_subtitle",
    position: [-9.0, FLOOR_5_Y, -6.2],
    rotationY: 0,
    accentColor: "#6366f1",
    waypointId: "wp-ws-12",
    assignedAgentId: "staff-05",
    specs: "Edge Neural TTS • Auto-Editor PCM Trim",
  },
  {
    id: "ws-13",
    code: "VOX-02",
    name: "0ms-Sync Subtitle Console",
    floor: 5,
    divisionTeam: "voice_subtitle",
    position: [-3.0, FLOOR_5_Y, -6.2],
    rotationY: 0,
    accentColor: "#818cf8",
    waypointId: "wp-ws-13",
    assignedAgentId: "staff-14",
    specs: "Word-Level Sync • whisper.cpp Adapter",
  },
  {
    id: "ws-14",
    code: "QAC-01",
    name: "Video Metadata & ffprobe Audit",
    floor: 5,
    divisionTeam: "quality_control",
    position: [3.0, FLOOR_5_Y, -6.2],
    rotationY: 0,
    accentColor: "#10b981",
    waypointId: "wp-ws-14",
    assignedAgentId: "staff-07",
    specs: "Actual Codec/FPS/Bitrate Inspector",
  },
  {
    id: "ws-15",
    code: "QAC-02",
    name: "Mobile Safe Zone & Anti-Duplicate",
    floor: 5,
    divisionTeam: "quality_control",
    position: [9.0, FLOOR_5_Y, -6.2],
    rotationY: 0,
    accentColor: "#34d399",
    waypointId: "wp-ws-15",
    assignedAgentId: "staff-15",
    specs: "9:16 Readability • Originality Guard",
  },
];

// Semi-realistic Asian/anime VRoid visual palette matching Fajrezzz Our Team reference
const STAFF_APPEARANCES: Record<string, { accent: string; secondary: string; appearance: AvatarAppearance }> = {
  "staff-01": {
    accent: "#0ea5e9",
    secondary: "#0369a1",
    appearance: { skinColor: "#e2b898", hairColor: "#141418", hairStyle: "short", suitColor: "#0f172a", shirtColor: "#e0f2fe", pantsColor: "#111827", outfitStyle: "hoodie", hasGlasses: true },
  },
  "staff-02": {
    accent: "#38bdf8",
    secondary: "#0284c7",
    appearance: { skinColor: "#ecc4a7", hairColor: "#241711", hairStyle: "bob", suitColor: "#a78bfa", shirtColor: "#ffffff", pantsColor: "#181a24", outfitStyle: "blouse", hasGlasses: true },
  },
  "staff-08": {
    accent: "#22d3ee",
    secondary: "#0891b2",
    appearance: { skinColor: "#f0c8ab", hairColor: "#261811", hairStyle: "ponytail", suitColor: "#0e7490", shirtColor: "#ecfeff", pantsColor: "#141720", outfitStyle: "blouse" },
  },
  "staff-03": {
    accent: "#f59e0b",
    secondary: "#b45309",
    appearance: { skinColor: "#ddb192", hairColor: "#161515", hairStyle: "short", suitColor: "#f1f5f9", shirtColor: "#ffffff", pantsColor: "#1e293b", outfitStyle: "hoodie" },
  },
  "staff-09": {
    accent: "#fbbf24",
    secondary: "#d97706",
    appearance: { skinColor: "#dfb292", hairColor: "#171514", hairStyle: "executive", suitColor: "#1e293b", shirtColor: "#fef3c7", pantsColor: "#0f172a", outfitStyle: "shirt" },
  },
  "staff-04": {
    accent: "#ec4899",
    secondary: "#be185d",
    appearance: { skinColor: "#f1cab0", hairColor: "#2e1b12", hairStyle: "ponytail", suitColor: "#181b26", shirtColor: "#fce7f3", pantsColor: "#11131c", outfitStyle: "hoodie" },
  },
  "staff-10": {
    accent: "#f472b6",
    secondary: "#db2777",
    appearance: { skinColor: "#ebc2a4", hairColor: "#221510", hairStyle: "bob", suitColor: "#be185d", shirtColor: "#fdf2f8", pantsColor: "#141720", outfitStyle: "blouse" },
  },
  "staff-11": {
    accent: "#e879f9",
    secondary: "#a21caf",
    appearance: { skinColor: "#d9ab8c", hairColor: "#141416", hairStyle: "short", suitColor: "#312e81", sleeveColor: "#ec4899", shirtColor: "#f5d0fe", pantsColor: "#0f172a", outfitStyle: "varsity" },
  },
  "staff-06": {
    accent: "#a855f7",
    secondary: "#7e22ce",
    appearance: { skinColor: "#ecc3a6", hairColor: "#231711", hairStyle: "bob", suitColor: "#f8fafc", shirtColor: "#ffffff", pantsColor: "#181a24", outfitStyle: "blouse", hasGlasses: true },
  },
  "staff-12": {
    accent: "#9333ea",
    secondary: "#6b21a8",
    appearance: { skinColor: "#d8aa8a", hairColor: "#121216", hairStyle: "short", suitColor: "#1e1b4b", shirtColor: "#e9d5ff", pantsColor: "#0f172a", outfitStyle: "hoodie", hasNeckHeadphones: true },
  },
  "staff-13": {
    accent: "#c084fc",
    secondary: "#7c3aed",
    appearance: { skinColor: "#f0c9ad", hairColor: "#2a1911", hairStyle: "ponytail", suitColor: "#4c1d95", shirtColor: "#f3e8ff", pantsColor: "#141720", outfitStyle: "blouse" },
  },
  "staff-05": {
    accent: "#6366f1",
    secondary: "#4338ca",
    appearance: { skinColor: "#d9ab8c", hairColor: "#141416", hairStyle: "short", suitColor: "#171824", sleeveColor: "#4c1d95", shirtColor: "#c4b5fd", pantsColor: "#0f172a", outfitStyle: "hoodie", hasNeckHeadphones: true },
  },
  "staff-14": {
    accent: "#818cf8",
    secondary: "#4f46e5",
    appearance: { skinColor: "#ecc4a7", hairColor: "#241711", hairStyle: "hijab", suitColor: "#312e81", shirtColor: "#e0e7ff", pantsColor: "#141720", outfitStyle: "blouse" },
  },
  "staff-07": {
    accent: "#10b981",
    secondary: "#047857",
    appearance: { skinColor: "#dfb292", hairColor: "#171514", hairStyle: "executive", suitColor: "#065f46", sleeveColor: "#f8fafc", shirtColor: "#ffffff", pantsColor: "#14161f", outfitStyle: "varsity" },
  },
  "staff-15": {
    accent: "#34d399",
    secondary: "#059669",
    appearance: { skinColor: "#d7a98a", hairColor: "#161515", hairStyle: "short", suitColor: "#0f172a", shirtColor: "#d1fae5", pantsColor: "#111827", outfitStyle: "formal", hasGlasses: true },
  },
};

const FLOOR_PATROL: Record<number, string[]> = {
  2: ["wp-l2-hub", "wp-l2-promenade", "wp-f2-lounge-w", "wp-f2-lounge-e"],
  3: ["wp-f3-hub", "wp-f3-lounge", "wp-l3-balcony"],
  4: ["wp-f4-hub", "wp-f4-lounge", "wp-f4-deck"],
  5: ["wp-f5-hub", "wp-f5-lounge", "wp-f5-deck"],
};

/**
 * 15 Active Real Employees derived directly from ACTIVE_EMPLOYEE_ROSTER.
 * Every employee starts honestly in `idle` (ZERO fake "working" status until a real task runs!).
 */
export const INITIAL_AGENTS: OfficeAgent[] = ACTIVE_EMPLOYEE_ROSTER.map((emp) => {
  const visual = STAFF_APPEARANCES[emp.id] ?? {
    accent: "#22d3ee",
    secondary: "#0891b2",
    appearance: {
      skinColor: "#e2b898",
      hairColor: "#161515",
      hairStyle: "short",
      suitColor: "#0f172a",
      shirtColor: "#e0f2fe",
      pantsColor: "#111827",
      outfitStyle: "hoodie",
    },
  };

  return {
    id: emp.id,
    code: emp.code,
    name: emp.name,
    role: emp.role,
    floor: emp.floor,
    divisionTeam: emp.divisionTeam,
    assignedPipelineDivision: emp.assignedPipelineDivision,
    skills: emp.skills,
    responsibility: emp.responsibility,
    maxConcurrentTasks: emp.maxConcurrentTasks,
    activeTaskTitle: null,
    accentColor: visual.accent,
    secondaryColor: visual.secondary,
    appearance: visual.appearance,
    isVisualPlaceholder: true,
    status: "idle",
    assignedWorkstationId: emp.workstationId,
    currentWaypointId: emp.deskWaypointId,
    targetWaypointId: emp.deskWaypointId,
    patrolWaypoints: [emp.deskWaypointId, ...(FLOOR_PATROL[emp.floor] ?? [])],
    simulatedLoad: 0,
    energyLevel: 96,
    currentActionLabel: `Standby di ${emp.code} (L${emp.floor}) — menunggu tugas nyata`,
    futureModelSlot: `L${emp.floor} • ${emp.role}`,
  };
});

export const INITIAL_TASKS: OfficeTask[] = [];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: "act-01",
    timestamp: "SYSTEM",
    actor: "SYSTEM",
    actorType: "system",
    message:
      "FAJREZZZ AI OFFICE 5-Lantai aktif — 15 karyawan (kapasitas s/d 20) standby menunggu tugas produksi TikTok 9:16 nyata.",
    severity: "system",
    zone: "L1–L5 HQ",
  },
];

export const DESTINATION_PRESETS = [
  { id: "wp-l1-reception", label: "L1 Lobby", floor: 1 },
  { id: "wp-ws-01", label: "L2 Research", floor: 2 },
  { id: "wp-ws-04", label: "L2 Script", floor: 2 },
  { id: "wp-ws-06", label: "L3 Motion", floor: 3 },
  { id: "wp-ws-09", label: "L4 Editing", floor: 4 },
  { id: "wp-ws-12", label: "L5 Voice", floor: 5 },
  { id: "wp-ws-14", label: "L5 QC", floor: 5 },
  { id: "wp-pool-deck", label: "Pool Deck", floor: 1 },
  { id: "wp-supercar-bay", label: "Supercar", floor: 1 },
] as const;
