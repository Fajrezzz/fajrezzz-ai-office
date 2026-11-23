import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  ACTIVE_EMPLOYEE_ROSTER,
  INITIAL_ACTIVE_TEAM_COUNT,
  MAX_TEAM_CAPACITY,
  OFFICE_FLOORS,
  RESERVE_EXPANSION_SLOTS,
  TEAM_DIVISIONS,
  distributeDivisionTaskToTeam,
} from "../src/lib/config/team-roster.ts";
import {
  FLOOR_1_Y,
  FLOOR_2_Y,
  FLOOR_3_Y,
  INITIAL_AGENTS,
  INITIAL_TASKS,
  INITIAL_WORKSTATIONS,
  OFFICE_WAYPOINTS,
  ROOF_Y,
  findWaypointPath,
} from "../src/lib/data/initial-office-data.ts";
import { buildOriginalStylePresetFromReference } from "../src/lib/pipeline/reference-style-analyzer.ts";

test("Section A: 15 active employees + 5 reserve slots = 20 max capacity across 6 divisions", () => {
  assert.equal(INITIAL_ACTIVE_TEAM_COUNT, 15);
  assert.equal(MAX_TEAM_CAPACITY, 20);
  assert.equal(ACTIVE_EMPLOYEE_ROSTER.length, 15);
  assert.equal(RESERVE_EXPANSION_SLOTS.length, 5);
  assert.equal(TEAM_DIVISIONS.length, 6);

  const counts = Object.fromEntries(
    TEAM_DIVISIONS.map((d) => [
      d.id,
      ACTIVE_EMPLOYEE_ROSTER.filter((e) => e.divisionTeam === d.id).length,
    ])
  );
  assert.deepEqual(counts, {
    research_trend: 3,
    script_story: 2,
    visual_motion: 3,
    video_editing: 3,
    voice_subtitle: 2,
    quality_control: 2,
  });

  // Verify shared skills exist across multiple employees (not 1 repo = 1 employee)
  for (const emp of ACTIVE_EMPLOYEE_ROSTER) {
    assert.ok(emp.skills.length >= 2, `${emp.id} should have shared skills`);
    assert.ok(emp.responsibility.length > 10, `${emp.id} should have responsibility`);
  }
});

test("Section A/B: 3-floor office + rooftop deck, 15 workstations, honest idle start, valid waypoint paths", () => {
  assert.equal(OFFICE_FLOORS.length, 3);
  assert.ok(FLOOR_1_Y < FLOOR_2_Y && FLOOR_2_Y < FLOOR_3_Y && FLOOR_3_Y < ROOF_Y);
  assert.equal(INITIAL_WORKSTATIONS.length, 15);
  assert.equal(INITIAL_AGENTS.length, 15);
  assert.equal(INITIAL_TASKS.length, 0);

  for (const agent of INITIAL_AGENTS) {
    assert.equal(agent.status, "idle", `${agent.id} must start genuinely idle`);
    assert.ok(OFFICE_WAYPOINTS[agent.currentWaypointId], `${agent.id} waypoint must exist`);
  }

  // Test real pathfinding on Floor 2 dan Floor 3 (L4/L5 lama sudah digabung)
  const pathF2 = findWaypointPath("wp-f2-lounge-w", "wp-ws-04");
  assert.ok(pathF2.length >= 2, "Floor 2 waypoint path should connect lounge to desk");
  const pathF2qc = findWaypointPath("wp-l2-hub", "wp-ws-15");
  assert.ok(pathF2qc.length >= 2, "L2 hub must reach the QC desk (merged from old L5)");
  const pathF3edit = findWaypointPath("wp-f3-hub", "wp-ws-11");
  assert.ok(pathF3edit.length >= 2, "L3 hub must reach the editing desk (merged from old L4)");
});

test("Section A: distributeDivisionTaskToTeam dispatches real work across all specialists in a division", () => {
  const editingTeam = distributeDivisionTaskToTeam("editing", "Render MP4 9:16");
  assert.equal(editingTeam.length, 3);
  const researchTeam = distributeDivisionTaskToTeam("research", "Scan AI Agents");
  const seoTeam = distributeDivisionTaskToTeam("seo", "Rank TikTok Hook & SEO");
  assert.equal(researchTeam.length + seoTeam.length, 3);
  const qcTeam = distributeDivisionTaskToTeam("qc", "Audit MP4 & Audio Sync");
  assert.equal(qcTeam.length, 2);
});

test("Section E: Reference Video Style Analyzer creates original Fajrezzz presets with copyright guardrail", () => {
  const preset = buildOriginalStylePresetFromReference({
    referenceUrl: "https://www.tiktok.com/@techcreator/video/123456",
    styleCueNotes: "terminal claude code dark neon fast cuts",
  });
  assert.equal(preset.platformDetected, "tiktok");
  assert.equal(preset.recommendedVisualStyle, "cyberpunk_dev");
  assert.ok(preset.avgCutIntervalSec > 0 && preset.avgCutIntervalSec <= 4);
  assert.ok(preset.originalityGuardrail.toLowerCase().includes("original"));
});

test("Section C: Zero YPP UI labels and zero manual Eco/Bal/High quality selector buttons remain", () => {
  const root = process.cwd();
  const uiFilesToCheck = [
    "src/components/layout/Sidebar.tsx",
    "src/components/layout/TopHeader.tsx",
    "src/components/dashboard/RealResultsDashboard.tsx",
    "src/components/office3d/SceneControlsHUD.tsx",
  ];
  for (const rel of uiFilesToCheck) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(!/\bYPP\b/.test(content), `${rel} must not contain YPP UI text`);
    assert.ok(!/PERF_OPTIONS/.test(content), `${rel} must not contain manual PERF_OPTIONS`);
  }
});
