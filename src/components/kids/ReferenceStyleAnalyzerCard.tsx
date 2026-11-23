"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Link2,
  Palette,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  buildOriginalStylePresetFromReference,
  loadSavedStylePresets,
  saveStylePresets,
  type ReferenceStylePreset,
} from "@/lib/pipeline/reference-style-analyzer";
import { useAgency } from "@/store/AgencyContext";

/**
 * Reference Video Style Analyzer & Original Fajrezzz Style Preset Card (Section E).
 *
 * Accepts reference links (TikTok / YouTube / Reels) + editing notes from Bos Fajrez,
 * extracts structural editing principles (hook, pacing, typography, motion rhythm),
 * and generates a reusable ORIGINAL Fajrezzz visual identity preset (never copies creators raw).
 */
export function ReferenceStyleAnalyzerCard() {
  const { startNewEpisode, runningDivision } = useAgency();
  const isRunningPipeline = Boolean(runningDivision);

  const [sourceUrl, setSourceUrl] = useState("");
  const [presetName, setPresetName] = useState("");
  const [notes, setNotes] = useState("");
  const [presets, setPresets] = useState<ReferenceStylePreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSavedStylePresets();
    setPresets(loaded);
    if (loaded[0]) setActivePresetId(loaded[0].id);
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() && !notes.trim()) {
      setNotice("Masukkan link video referensi atau catatan gaya editing terlebih dahulu.");
      return;
    }

    const created = buildOriginalStylePresetFromReference({
      referenceUrl: sourceUrl.trim() || "https://tiktok.com/@reference",
      presetName: presetName.trim() || undefined,
      styleCueNotes: notes.trim() || undefined,
    });

    const next = [created, ...presets].slice(0, 12);
    setPresets(next);
    setActivePresetId(created.id);
    saveStylePresets(next);
    setSourceUrl("");
    setPresetName("");
    setNotes("");
    setNotice(`Preset gaya original "${created.name}" berhasil dibuat & disimpan.`);
  };

  const handleDelete = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    saveStylePresets(next);
    if (activePresetId === id) {
      setActivePresetId(next[0]?.id ?? null);
    }
  };

  const selectedPreset =
    presets.find((p) => p.id === activePresetId) ?? presets[0] ?? null;

  const handleProduceWithPreset = (preset: ReferenceStylePreset) => {
    const topicPrompt = `AI Agent & Claude Code Breakdown — Gaya Visual Original: ${preset.name} (Hook ${preset.hookWindowSec}s; pacing ${preset.avgCutIntervalSec}s/cut; ${preset.typographyDirective})`;
    void startNewEpisode(topicPrompt, "tiktok");
  };

  return (
    <section className="rounded-2xl border border-fuchsia-400/30 bg-slate-900/80 p-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-fuchsia-400" />
          <div>
            <h3 className="text-sm font-black tracking-wide text-white uppercase">
              Reference Video Analyzer &amp; Original Style Preset (TikTok 9:16)
            </h3>
            <p className="text-[11px] text-slate-400">
              Tempel link referensi video → ekstrak prinsip editing, ritme pacing &amp; preset visual original Fajrezzz (anti-plagiasi).
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Original Identity Guardrail ON</span>
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleAnalyze} className="mt-3 grid gap-2 sm:grid-cols-12">
        <div className="relative sm:col-span-5">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://tiktok.com/... atau link YouTube Shorts"
            className="w-full rounded-xl border border-white/15 bg-slate-950/80 py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
          />
        </div>
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Nama preset (opsional)"
          className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none sm:col-span-3"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan gaya: dark neon, fast cut, terminal demo..."
          className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none sm:col-span-2"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110 sm:col-span-2"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ekstrak Preset</span>
        </button>
      </form>

      {notice && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Saved Presets & Editing Guide */}
      {presets.length > 0 && (
        <div className="mt-3 grid gap-3 lg:grid-cols-12">
          {/* Preset selector chips */}
          <div className="space-y-1.5 lg:col-span-5">
            {presets.map((p) => {
              const isSelected = selectedPreset?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                    isSelected
                      ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white"
                      : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/25"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActivePresetId(p.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="truncate text-[10px] text-slate-400">
                      {p.platformDetected.toUpperCase()} · {p.recommendedVisualStyle} ·{" "}
                      {p.avgCutIntervalSec}s/cut
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    aria-label="Hapus preset"
                    className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Preset Blueprint Details */}
          {selectedPreset && (
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3 text-xs lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-black text-white">{selectedPreset.name}</div>
                  <div className="text-[10px] text-cyan-300">
                    Style Engine: {selectedPreset.recommendedVisualStyle} · Hook{" "}
                    {selectedPreset.hookWindowSec}s · Transitions:{" "}
                    {selectedPreset.preferredTransitions.join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isRunningPipeline}
                  onClick={() => handleProduceWithPreset(selectedPreset)}
                  className="rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-45"
                >
                  Pakai untuk Episode Baru
                </button>
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-[11px]">
                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
                  <div className="text-[10px] font-bold text-fuchsia-300">
                    VISUAL DEMO &amp; ENDING
                  </div>
                  <p className="mt-0.5 text-slate-300">
                    {selectedPreset.visualDemoDirective} · {selectedPreset.endingDirective}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
                  <div className="text-[10px] font-bold text-cyan-300">
                    SUBTITLE &amp; AUDIO MIX
                  </div>
                  <p className="mt-0.5 text-slate-300">
                    {selectedPreset.typographyDirective} · {selectedPreset.audioMixDirective}
                  </p>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-950/25 px-2.5 py-1.5 text-[10px] text-emerald-200">
                🛡️ {selectedPreset.originalityGuardrail}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
