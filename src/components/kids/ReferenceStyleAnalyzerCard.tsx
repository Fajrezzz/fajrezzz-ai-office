"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Film,
  Link2,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  buildOriginalStylePresetFromReference,
  loadSavedStylePresets,
  saveStylePresets,
  type ReferenceStylePreset,
} from "@/lib/pipeline/reference-style-analyzer";
import {
  FAJREZZZ_CINEMATIC_PRESETS,
  INTELLIGENT_EDITING_WORKFLOW,
  PHASE_6_TEST_VIDEO_TOPICS,
  autoSelectCinematicPresetForTopic,
  type CinematicPresetId,
  type FajrezzzCinematicPreset,
} from "@/lib/pipeline/cinematic-presets";
import { useAgency } from "@/store/AgencyContext";

/**
 * Fajrezzz Cinematic Editing Preset System + Reference Video Style Analyzer (Phases 2–6).
 *
 * - Provides all 6 reusable Fajrezzz Original Cinematic Presets usable directly in video rendering
 * - Provides 1-click launch for the 3 Phase 6 test video topics
 * - Shows the 7-agent Intelligent Editing Workflow collaborating across the 15-employee office
 * - Accepts custom reference links + editing notes with strict original identity guardrail
 */
export function ReferenceStyleAnalyzerCard() {
  const { startNewEpisode, runningDivision } = useAgency();
  const isRunningPipeline = Boolean(runningDivision);

  const [selectedPresetId, setSelectedPresetId] = useState<CinematicPresetId>(
    "cinematic_ai_documentary"
  );
  const [sourceUrl, setSourceUrl] = useState("");
  const [presetName, setPresetName] = useState("");
  const [notes, setNotes] = useState("");
  const [presets, setPresets] = useState<ReferenceStylePreset[]>([]);
  const [activeRefPresetId, setActiveRefPresetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSavedStylePresets();
    setPresets(loaded);
    if (loaded[0]) setActiveRefPresetId(loaded[0].id);
  }, []);

  const activeCinematicPreset: FajrezzzCinematicPreset =
    FAJREZZZ_CINEMATIC_PRESETS.find((p) => p.id === selectedPresetId) ??
    FAJREZZZ_CINEMATIC_PRESETS[0];

  const handleProduceWithCinematicPreset = (
    topic: string,
    preset: FajrezzzCinematicPreset
  ) => {
    const richPrompt = `${topic} — [Fajrezzz Preset: ${preset.name} | Style: ${preset.mappedVisualStyle} | Transition: ${preset.sceneTransition.primary} | Cut: ${preset.motionSettings.avgSceneDurationSec}s | Subtitle: ${preset.subtitle.animationStyle} | SFX: ${preset.soundDesign.transitionSfx}]`;
    void startNewEpisode(richPrompt, "tiktok");
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() && !notes.trim()) {
      setNotice(
        "Masukkan link video referensi atau catatan gaya editing terlebih dahulu."
      );
      return;
    }

    const created = buildOriginalStylePresetFromReference({
      referenceUrl: sourceUrl.trim() || "https://youtube.com/shorts/reference",
      presetName: presetName.trim() || undefined,
      styleCueNotes: notes.trim() || undefined,
    });

    const autoMatched = autoSelectCinematicPresetForTopic(
      `${notes} ${presetName}`
    );
    setSelectedPresetId(autoMatched.id);

    const next = [created, ...presets].slice(0, 12);
    setPresets(next);
    setActiveRefPresetId(created.id);
    saveStylePresets(next);
    setSourceUrl("");
    setPresetName("");
    setNotes("");
    setNotice(
      `Preset gaya original "${created.name}" disimpan & disinkronkan ke "${autoMatched.name}".`
    );
  };

  const handleDelete = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    saveStylePresets(next);
    if (activeRefPresetId === id) {
      setActiveRefPresetId(next[0]?.id ?? null);
    }
  };

  const selectedRefPreset =
    presets.find((p) => p.id === activeRefPresetId) ?? presets[0] ?? null;

  return (
    <section className="space-y-4 rounded-2xl border border-fuchsia-400/30 bg-slate-900/80 p-4 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-fuchsia-400" />
          <div>
            <h3 className="text-sm font-black tracking-wide text-white uppercase">
              Fajrezzz Cinematic Preset System (6 Presets) &amp; Reference Analyzer
            </h3>
            <p className="text-[11px] text-slate-400">
              Identitas visual original Fajrezzz terhubung ke Remotion 4.0 + GSAP 3.15 + WebCodecs MP4 9:16.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Original Identity Guardrail ON</span>
        </span>
      </div>

      {/* 6 REUSABLE FAJREZZZ CINEMATIC PRESETS */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FAJREZZZ_CINEMATIC_PRESETS.map((preset) => {
          const active = preset.id === activeCinematicPreset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-cyan-300 bg-cyan-500/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                  : "border-white/10 bg-slate-950/65 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-white">{preset.name}</span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: preset.colorPalette.accentPrimary }}
                />
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] text-slate-400">
                {preset.tagline}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 font-mono text-[9px] text-cyan-200">
                <span className="rounded bg-slate-900 px-1.5 py-0.5">
                  {preset.sceneTransition.primary}
                </span>
                <span className="rounded bg-slate-900 px-1.5 py-0.5">
                  {preset.motionSettings.avgSceneDurationSec}s/cut
                </span>
                <span className="rounded bg-slate-900 px-1.5 py-0.5">
                  {preset.motionSettings.targetFps}fps
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* SELECTED PRESET FULL ENGINEERING SPEC */}
      <div className="rounded-xl border border-cyan-400/30 bg-slate-950/80 p-3.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-black text-white">
              {activeCinematicPreset.name}
            </div>
            <div className="font-mono text-[10px] text-cyan-300">
              Engine: {activeCinematicPreset.mappedVisualStyle} · GSAP{" "}
              {activeCinematicPreset.sceneTransition.gsapEase} · Intro{" "}
              {activeCinematicPreset.introAnimation.entryEffect}
            </div>
          </div>
          <button
            type="button"
            disabled={isRunningPipeline}
            onClick={() =>
              handleProduceWithCinematicPreset(
                activeCinematicPreset.recommendedTopics[0] ??
                  "The Future of AI Agents",
                activeCinematicPreset
              )
            }
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-45"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Render Video Dengan Preset Ini</span>
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[11px]">
          <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
            <div className="text-[10px] font-bold text-cyan-300">INTRO &amp; TRANSISI</div>
            <div className="mt-0.5 text-slate-300">
              Hook {activeCinematicPreset.introAnimation.hookWindowSec}s ·{" "}
              {activeCinematicPreset.sceneTransition.primary} /{" "}
              {activeCinematicPreset.sceneTransition.secondary}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
            <div className="text-[10px] font-bold text-fuchsia-300">SUBTITLE &amp; TYPO</div>
            <div className="mt-0.5 text-slate-300">
              {activeCinematicPreset.subtitle.animationStyle} · max{" "}
              {activeCinematicPreset.typography.maxWordsPerLine} kata/baris
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
            <div className="text-[10px] font-bold text-emerald-300">SOUND DESIGN</div>
            <div className="mt-0.5 text-slate-300">
              {activeCinematicPreset.soundDesign.transitionSfx} ·{" "}
              {activeCinematicPreset.soundDesign.voicePacingWpm} WPM · duck{" "}
              {activeCinematicPreset.soundDesign.bgmDuckDb}dB
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
            <div className="text-[10px] font-bold text-amber-300">OUTRO CTA</div>
            <div className="mt-0.5 text-slate-300">
              {activeCinematicPreset.outro.ctaHeadline}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 6: 3 MANDATORY TEST VIDEO QUICK-LAUNCH CARDS */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 uppercase">
          <Film className="h-3.5 w-3.5" />
          <span>Phase 6 — 3 Topik Uji Produksi Video TikTok 9:16 (1080×1920+)</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PHASE_6_TEST_VIDEO_TOPICS.map((item) => {
            const matched =
              FAJREZZZ_CINEMATIC_PRESETS.find((p) => p.id === item.presetId) ??
              FAJREZZZ_CINEMATIC_PRESETS[0];
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-slate-950/75 p-3"
              >
                <div>
                  <div className="text-xs font-black text-white">{item.topic}</div>
                  <div className="mt-0.5 text-[10px] text-cyan-300">
                    Auto-Preset: {matched.name}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isRunningPipeline}
                  onClick={() => handleProduceWithCinematicPreset(item.topic, matched)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-cyan-400/45 bg-cyan-500/15 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-45"
                >
                  <Play className="h-3 w-3" />
                  <span>Produksi &amp; Render MP4</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 5: 7-AGENT INTELLIGENT EDITING WORKFLOW */}
      <div className="rounded-xl border border-white/10 bg-slate-950/65 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-fuchsia-300 uppercase">
          <Users className="h-3.5 w-3.5" />
          <span>Phase 5 — Kolaborasi 7 Intelligent Editing Agents (Terhubung ke 15 Karyawan)</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
          {INTELLIGENT_EDITING_WORKFLOW.map((stage) => (
            <div
              key={stage.step}
              className="rounded-lg border border-white/10 bg-slate-900/75 p-2 text-[10px]"
            >
              <div className="font-mono text-[9px] text-cyan-300">
                STEP {stage.step} · L{stage.floor}
              </div>
              <div className="mt-0.5 font-bold text-white leading-tight">
                {stage.agentTitle}
              </div>
              <div className="mt-0.5 text-[9px] text-slate-400">
                {stage.mappedEmployeeIds.join(", ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOM REFERENCE LINK ANALYZER FORM */}
      <form onSubmit={handleAnalyze} className="grid gap-2 sm:grid-cols-12">
        <div className="relative sm:col-span-5">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/... atau link referensi"
            className="w-full rounded-xl border border-white/15 bg-slate-950/80 py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
          />
        </div>
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Nama preset custom (opsional)"
          className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none sm:col-span-3"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan gaya: dark neon, fast cut, terminal..."
          className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none sm:col-span-2"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110 sm:col-span-2"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ekstrak</span>
        </button>
      </form>

      {notice && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {presets.length > 0 && selectedRefPreset && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-white">{selectedRefPreset.name}</span>
            <span className="ml-2 text-[10px] text-cyan-300">
              {selectedRefPreset.recommendedVisualStyle} ·{" "}
              {selectedRefPreset.avgCutIntervalSec}s/cut
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleDelete(selectedRefPreset.id)}
              aria-label="Hapus preset"
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
