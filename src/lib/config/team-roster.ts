import type { FloorNumber, FloorView, TeamDivisionKey } from "@/types/office";
import type { PipelineDivisionKey } from "@/types/pipeline";

/**
 * FAJREZZZ AI OFFICE — SCALABLE TEAM & MULTI-FLOOR CONFIGURATION
 *
 * - Default active team: 15 real task-capable employees across 6 specialized divisions.
 * - Flexible capacity: up to 20 employees (`MAX_TEAM_CAPACITY = 20`) by toggling reserve
 *   slots without refactoring any pipeline, UI, or 3D office architecture.
 * - 22 GitHub skills & 11 V4 modular skills are shared cleanly across employees.
 */

export const INITIAL_ACTIVE_TEAM_COUNT = 15;
export const MAX_TEAM_CAPACITY = 20;

export interface TeamDivisionSpec {
  id: TeamDivisionKey;
  label: string;
  shortLabel: string;
  floor: FloorNumber;
  floorView: FloorView;
  accentColor: string;
  targetHeadcount: number;
  pipelineDivisions: PipelineDivisionKey[];
  sharedSkills: string[];
  mission: string;
}

export const TEAM_DIVISIONS: TeamDivisionSpec[] = [
  {
    id: "research_trend",
    label: "Research & Trend Intelligence",
    shortLabel: "Research",
    floor: 2,
    floorView: "l2",
    accentColor: "#0ea5e9",
    targetHeadcount: 3,
    pipelineDivisions: ["research", "seo"],
    sharedSkills: [
      "5-Factor AI Trend Ranking",
      "GitHub Release Verification",
      "TikTok Hook & SEO Research",
      "Fact-Checking (ECC Hygiene)",
    ],
    mission: "Memverifikasi rilis AI terbaru (Claude Code, AI Agent, multi-agent) dan merangking topik secara objektif.",
  },
  {
    id: "script_story",
    label: "Script & Storytelling",
    shortLabel: "Script",
    floor: 2,
    floorView: "l2",
    accentColor: "#f59e0b",
    targetHeadcount: 2,
    pipelineDivisions: ["script"],
    sharedSkills: [
      "0–2s TikTok Hook Writing",
      "Technical Storytelling",
      "Claude Code Live Demo Scripting",
      "Retention Pacing Architecture",
    ],
    mission: "Menyusun naskah 9:16 padat, edukatif, punya hook kuat, demo teknis nyata, dan ending berkesan.",
  },
  {
    id: "visual_motion",
    label: "Visual & Motion Design",
    shortLabel: "Visual & Motion",
    floor: 3,
    floorView: "l3",
    accentColor: "#ec4899",
    targetHeadcount: 3,
    pipelineDivisions: ["motion"],
    sharedSkills: [
      "Remotion 4.0 React Composition",
      "GSAP 3.15 Timeline Choreography",
      "Kinetic Typography & Safe Zone",
      "AI Architecture Diagrams & Terminal UI",
    ],
    mission: "Merancang motion graphics sinematik, animasi terminal/diagram, dan identitas visual original Fajrezzz.",
  },
  {
    id: "video_editing",
    label: "Video Editing & Rendering",
    shortLabel: "Editing & Render",
    floor: 3,
    floorView: "l3",
    accentColor: "#a855f7",
    targetHeadcount: 3,
    pipelineDivisions: ["editing"],
    sharedSkills: [
      "WebCodecs MP4 H.264/AAC Muxing",
      "FFmpeg Export & Validation Adapter",
      "Reference Style Preset Translation",
      "4K / 2K / 1080p Adaptive Export",
    ],
    mission: "Merakit timeline scene, transisi cepat, pacing, sound effects, dan merender MP4 valid siap upload.",
  },
  {
    id: "voice_subtitle",
    label: "Voice & Subtitle",
    shortLabel: "Voice & Sub",
    floor: 2,
    floorView: "l2",
    accentColor: "#6366f1",
    targetHeadcount: 2,
    pipelineDivisions: ["voice"],
    sharedSkills: [
      "Neural TTS Voiceover Synthesis",
      "Auto-Editor PCM RMS Silence Trim",
      "0ms-Lock Word Subtitle Sync",
      "whisper.cpp JSON Timestamp Adapter",
    ],
    mission: "Menghasilkan narasi jernih, memotong jeda mati audio, mixing BGM/SFX, dan mengunci subtitle 0ms drift.",
  },
  {
    id: "quality_control",
    label: "Quality Control",
    shortLabel: "Quality Control",
    floor: 2,
    floorView: "l2",
    accentColor: "#10b981",
    targetHeadcount: 2,
    pipelineDivisions: ["qc"],
    sharedSkills: [
      "Actual Video Metadata & ffprobe Audit",
      "Mobile Readability & Safe Zone Check",
      "Anti-Duplicate & Originality Guard",
      "Superpowers / Ponytail Engineering QA",
    ],
    mission: "Memvalidasi resolusi, FPS, bitrate, integritas file MP4, sinkronisasi audio-teks, dan anti-duplikat.",
  },
];

export interface FloorBlueprintSpec {
  floor: FloorNumber;
  viewId: FloorView;
  code: string;
  name: string;
  elevationY: number;
  accentColor: string;
  teams: TeamDivisionKey[];
  description: string;
}

export const OFFICE_FLOORS: FloorBlueprintSpec[] = [
  {
    floor: 1,
    viewId: "l1",
    code: "L1",
    name: "Lobby & Coordination Hub",
    elevationY: 0.18,
    accentColor: "#22d3ee",
    teams: [],
    description: "Grand reception, hologram coordination portal, arrival lounge & outdoor campus access.",
  },
  {
    floor: 2,
    viewId: "l2",
    code: "L2",
    name: "Research & Script Floor",
    elevationY: 3.9,
    accentColor: "#0ea5e9",
    teams: ["research_trend", "script_story"],
    description: "3 Research & Trend Intelligence desks + 2 Script & Storytelling desks + live trend wall.",
  },
  {
    floor: 3,
    viewId: "l3",
    code: "L3",
    name: "Visual & Motion Design",
    elevationY: 7.8,
    accentColor: "#ec4899",
    teams: ["visual_motion"],
    description: "3 Remotion + GSAP workstations + 3 Editing/Render pods + live 9:16 composition wall.",
  },
];

export interface EmployeeRosterEntry {
  id: string;
  code: string;
  name: string;
  role: string;
  floor: FloorNumber;
  divisionTeam: TeamDivisionKey;
  assignedPipelineDivision: PipelineDivisionKey;
  workstationId: string;
  deskWaypointId: string;
  loungeWaypointId: string;
  skills: string[];
  responsibility: string;
  maxConcurrentTasks: number;
  taskPromptFocus: string;
  isReserveSlot?: boolean;
}

/**
 * 15 Active Employees (Exact 3+2+3+3+2+2 Team Breakdown)
 * Every employee maps to a real pipeline division, floor, workstation, and concrete responsibility.
 */
export const ACTIVE_EMPLOYEE_ROSTER: EmployeeRosterEntry[] = [
  // === 1. RESEARCH & TREND INTELLIGENCE (3 karyawan — Floor 2) ===
  {
    id: "staff-01",
    code: "RES-01",
    name: "Raka Pratama",
    role: "Lead AI Trend Researcher",
    floor: 2,
    divisionTeam: "research_trend",
    assignedPipelineDivision: "research",
    workstationId: "ws-01",
    deskWaypointId: "wp-ws-01",
    loungeWaypointId: "wp-seat-01",
    skills: ["GitHub Release Verification", "5-Factor AI Trend Ranking", "Claude Code Ecosystem"],
    responsibility: "Memantau rilis resmi AI Agent, Claude Code & coding tools serta menyusun 5 ide topik terverifikasi.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Audit rilis GitHub terbaru & kurasi angle utama",
  },
  {
    id: "staff-02",
    code: "RES-02",
    name: "Nadia Putri",
    role: "SEO & 5-Factor Topic Ranker",
    floor: 2,
    divisionTeam: "research_trend",
    assignedPipelineDivision: "seo",
    workstationId: "ws-02",
    deskWaypointId: "wp-ws-02",
    loungeWaypointId: "wp-seat-02",
    skills: ["TikTok Hook & SEO Research", "5-Factor AI Trend Ranking", "Hashtag & Caption Strategy"],
    responsibility: "Menyusun judul tajam, caption, hashtag TikTok 9:16, dan peringkat 5-faktor objektif.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Optimasi judul hook, keyword & ranking 5-faktor",
  },
  {
    id: "staff-08",
    code: "RES-03",
    name: "Alya Ramadhani",
    role: "Source & Fact-Check Specialist",
    floor: 2,
    divisionTeam: "research_trend",
    assignedPipelineDivision: "research",
    workstationId: "ws-03",
    deskWaypointId: "wp-ws-03",
    loungeWaypointId: "wp-seat-03",
    skills: ["Fact-Checking (ECC Hygiene)", "Source Freshness Audit", "Anti-Hoax Verification"],
    responsibility: "Memverifikasi tanggal rilis, sumber resmi, dan memastikan tidak ada klaim fitur atau views palsu.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Verifikasi keaslian sumber & kesegaran data tren",
  },

  // === 2. SCRIPT & STORYTELLING (2 karyawan — Floor 2) ===
  {
    id: "staff-03",
    code: "SCR-01",
    name: "Dimas Wijaya",
    role: "Lead Hook & Script Architect",
    floor: 2,
    divisionTeam: "script_story",
    assignedPipelineDivision: "script",
    workstationId: "ws-04",
    deskWaypointId: "wp-ws-04",
    loungeWaypointId: "wp-seat-06",
    skills: ["0–2s TikTok Hook Writing", "Retention Pacing Architecture", "Technical Storytelling"],
    responsibility: "Menulis hook pembuka 0–2 detik, struktur narasi 4–6 adegan, dan ending call-to-action kuat.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Menyusun hook pembuka, struktur narasi & CTA ending",
  },
  {
    id: "staff-09",
    code: "SCR-02",
    name: "Bagas Mahendra",
    role: "Technical Demo Storyteller",
    floor: 2,
    divisionTeam: "script_story",
    assignedPipelineDivision: "script",
    workstationId: "ws-05",
    deskWaypointId: "wp-ws-05",
    loungeWaypointId: "wp-seat-07",
    skills: ["Claude Code Live Demo Scripting", "Multi-Agent Case Studies", "Code Snippet Storytelling"],
    responsibility: "Merancang skrip demonstrasi terminal, diff kode nyata, dan alur multi-agent yang mudah dipahami.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Menyiapkan demo terminal nyata & contoh kode akurat",
  },

  // === 3. VISUAL & MOTION DESIGN (3 karyawan — Floor 3) ===
  {
    id: "staff-04",
    code: "MOT-01",
    name: "Clara Santoso",
    role: "Lead Remotion & Kinetic Designer",
    floor: 3,
    divisionTeam: "visual_motion",
    assignedPipelineDivision: "motion",
    workstationId: "ws-06",
    deskWaypointId: "wp-ws-06",
    loungeWaypointId: "wp-seat-10",
    skills: ["Remotion 4.0 React Composition", "Kinetic Typography & Safe Zone", "Visual Style Direction"],
    responsibility: "Memimpin komposisi React 9:16 Remotion, hierarki tipografi, dan penempatan aman TikTok Safe Zone.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Menyusun komposisi 9:16 Remotion & tipografi kinetik",
  },
  {
    id: "staff-10",
    code: "MOT-02",
    name: "Siti Rahma",
    role: "GSAP Choreography & Style Artist",
    floor: 3,
    divisionTeam: "visual_motion",
    assignedPipelineDivision: "motion",
    workstationId: "ws-07",
    deskWaypointId: "wp-ws-07",
    loungeWaypointId: "wp-seat-11",
    skills: ["GSAP 3.15 Timeline Choreography", "Parallax & Light Sweep", "Original Fajrezzz Brand Palette"],
    responsibility: "Mengatur easing GSAP, stagger reveal, camera micro-dolly, dan konsistensi gaya visual original.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Koreografi easing GSAP, stagger & parallax tiap adegan",
  },
  {
    id: "staff-11",
    code: "MOT-03",
    name: "Reza Alfarizi",
    role: "UI/Terminal & Diagram Animator",
    floor: 3,
    divisionTeam: "visual_motion",
    assignedPipelineDivision: "motion",
    workstationId: "ws-08",
    deskWaypointId: "wp-ws-08",
    loungeWaypointId: "wp-seat-12",
    skills: ["AI Architecture Diagrams & Terminal UI", "GitHub PR Motion Graphics", "2K/4K Vector Scaling"],
    responsibility: "Menganimasikan jendela Claude Code CLI, node diagram multi-agent, dan grafik data resolusi tinggi.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Animasi terminal Claude Code, diff editor & node diagram",
  },

  // === 4. VIDEO EDITING & RENDERING (3 karyawan — Floor 3) ===
  {
    id: "staff-06",
    code: "EDT-01",
    name: "Salsa Maharani",
    role: "Lead TikTok 9:16 Video Editor",
    floor: 3,
    divisionTeam: "video_editing",
    assignedPipelineDivision: "editing",
    workstationId: "ws-09",
    deskWaypointId: "wp-ws-09",
    loungeWaypointId: "wp-seat-13",
    skills: ["Reference Style Preset Translation", "Scene Transitions & Rhythm", "TikTok Retention Editing"],
    responsibility: "Merangkai transisi lintas adegan, ritme visual cepat, dan menerapkan style preset referensi original.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Assembly timeline adegan, transisi & ritme TikTok 9:16",
  },
  {
    id: "staff-12",
    code: "EDT-02",
    name: "Kevin Halim",
    role: "WebCodecs / FFmpeg Render Engineer",
    floor: 3,
    divisionTeam: "video_editing",
    assignedPipelineDivision: "editing",
    workstationId: "ws-10",
    deskWaypointId: "wp-ws-10",
    loungeWaypointId: "wp-seat-14",
    skills: ["WebCodecs MP4 H.264/AAC Muxing", "FFmpeg Export & Validation Adapter", "4K / 2K / 1080p Adaptive Export"],
    responsibility: "Menjalankan encoding MP4 H.264/AAC presisi, adaptasi bitrate/FPS, dan menjaga kestabilan memori.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Encoding MP4 H.264/AAC & optimalisasi profil kualitas",
  },
  {
    id: "staff-13",
    code: "EDT-03",
    name: "Putri Lestari",
    role: "SFX, Pacing & Final Polish Editor",
    floor: 3,
    divisionTeam: "video_editing",
    assignedPipelineDivision: "editing",
    workstationId: "ws-11",
    deskWaypointId: "wp-ws-11",
    loungeWaypointId: "wp-seat-15",
    skills: ["SFX Whoosh & Click Mastering", "Thumbnail Frame Extraction", "Visual Polish QA"],
    responsibility: "Memadukan efek suara transisi, merapikan tempo potong, dan mengekspor thumbnail tajam 9:16.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Mastering SFX transisi & ekstraksi cover thumbnail HD",
  },

  // === 5. VOICE & SUBTITLE (2 karyawan — Floor 2) ===
  {
    id: "staff-05",
    code: "VOX-01",
    name: "Bima Kusuma",
    role: "Neural TTS & Audio Mixing Director",
    floor: 2,
    divisionTeam: "voice_subtitle",
    assignedPipelineDivision: "voice",
    workstationId: "ws-12",
    deskWaypointId: "wp-ws-12",
    loungeWaypointId: "wp-seat-08",
    skills: ["Neural TTS Voiceover Synthesis", "Auto-Editor PCM RMS Silence Trim", "BGM Ducking & Audio Mix"],
    responsibility: "Membangkitkan narasi neural TTS Bahasa Indonesia, memotong dead-air RMS, dan menyeimbangkan BGM.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Sintesis voiceover neural, trim jeda mati & mixing BGM",
  },
  {
    id: "staff-14",
    code: "VOX-02",
    name: "Dewi Anggraini",
    role: "0ms-Sync Subtitle & Whisper Specialist",
    floor: 2,
    divisionTeam: "voice_subtitle",
    assignedPipelineDivision: "voice",
    workstationId: "ws-13",
    deskWaypointId: "wp-ws-13",
    loungeWaypointId: "wp-seat-04",
    skills: ["0ms-Lock Word Subtitle Sync", "whisper.cpp JSON Timestamp Adapter", "Keyword Highlighting"],
    responsibility: "Menyelaraskan timestamp kata-per-kata tepat dengan durasi audio aktual tanpa drift 0ms.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Penguncian timestamp kata per kata & highlight keyword",
  },

  // === 6. QUALITY CONTROL (2 karyawan — Floor 2) ===
  {
    id: "staff-07",
    code: "QAC-01",
    name: "Fajar Nugroho",
    role: "Lead Video QC & Metadata Auditor",
    floor: 2,
    divisionTeam: "quality_control",
    assignedPipelineDivision: "qc",
    workstationId: "ws-14",
    deskWaypointId: "wp-ws-14",
    loungeWaypointId: "wp-seat-05",
    skills: ["Actual Video Metadata & ffprobe Audit", "Container Integrity Check", "Superpowers / Ponytail Engineering QA"],
    responsibility: "Memeriksa header MP4, resolusi aktual, FPS, bitrate, stream audio, dan black/dropped frame.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Audit metadata MP4 aktual, FPS, bitrate & integritas file",
  },
  {
    id: "staff-15",
    code: "QAC-02",
    name: "Hendra Saputra",
    role: "Mobile Readability & Anti-Duplicate Guard",
    floor: 2,
    divisionTeam: "quality_control",
    assignedPipelineDivision: "qc",
    workstationId: "ws-15",
    deskWaypointId: "wp-ws-15",
    loungeWaypointId: "wp-seat-09",
    skills: ["Mobile Readability & Safe Zone Check", "Anti-Duplicate & Originality Guard", "Audio-Subtitle Sync Audit"],
    responsibility: "Memastikan teks terbaca jelas di layar HP, bebas overlap, dan lolos pemeriksaan anti-duplikat.",
    maxConcurrentTasks: 2,
    taskPromptFocus: "Inspeksi safe zone layar HP, sinkronisasi & anti-duplikat",
  },
];

/**
 * 5 Reserve Expansion Slots (16–20) ready for zero-refactor scaling up to MAX_TEAM_CAPACITY = 20.
 */
export const RESERVE_EXPANSION_SLOTS: Array<{
  slotNumber: number;
  suggestedCode: string;
  suggestedRole: string;
  divisionTeam: TeamDivisionKey;
  floor: FloorNumber;
}> = [
  { slotNumber: 16, suggestedCode: "RES-04", suggestedRole: "AI Paper & Benchmark Analyst", divisionTeam: "research_trend", floor: 2 },
  { slotNumber: 17, suggestedCode: "SCR-03", suggestedRole: "Series & Retention Scriptwriter", divisionTeam: "script_story", floor: 2 },
  { slotNumber: 18, suggestedCode: "MOT-04", suggestedRole: "3D Motion & Shader Designer", divisionTeam: "visual_motion", floor: 3 },
  { slotNumber: 19, suggestedCode: "EDT-04", suggestedRole: "4K Batch Render Specialist", divisionTeam: "video_editing", floor: 3 },
  { slotNumber: 20, suggestedCode: "QAC-03", suggestedRole: "Compliance & Reference Audit Lead", divisionTeam: "quality_control", floor: 2 },
];

/**
 * Returns every active employee assigned to handle a given pipeline division.
 * Enables true multi-specialist task distribution based on skill and division!
 */
export function getEmployeesForPipelineDivision(
  division: PipelineDivisionKey
): EmployeeRosterEntry[] {
  return ACTIVE_EMPLOYEE_ROSTER.filter(
    (emp) => emp.assignedPipelineDivision === division
  );
}

export interface DistributedEmployeeTask {
  agentId: string;
  agentName: string;
  role: string;
  floor: FloorNumber;
  deskWaypointId: string;
  loungeWaypointId: string;
  taskLabel: string;
}

/**
 * Distributes a real division execution across ALL specialists belonging to that division
 * according to their role & skills (never fake work — called only when a real division runs!).
 */
export function distributeDivisionTaskToTeam(
  division: PipelineDivisionKey,
  episodeLabel: string
): DistributedEmployeeTask[] {
  const members = getEmployeesForPipelineDivision(division);
  return members.map((m) => ({
    agentId: m.id,
    agentName: m.name,
    role: m.role,
    floor: m.floor,
    deskWaypointId: m.deskWaypointId,
    loungeWaypointId: m.loungeWaypointId,
    taskLabel: `${m.taskPromptFocus} (${episodeLabel})`,
  }));
}
