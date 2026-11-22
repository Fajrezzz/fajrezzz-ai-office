"use client";

import React, { useMemo, useState } from "react";
import { Activity, Pause, Play, Trash2 } from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { ActivityEvent } from "@/types/office";

type ActorFilter = "all" | ActivityEvent["actorType"];

const SEVERITY_DOT: Record<ActivityEvent["severity"], string> = {
  info: "bg-cyan-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  system: "bg-purple-400",
};

export function LiveActivityPanel({ compact = false }: { compact?: boolean }) {
  const {
    activities,
    clearActivities,
    isSimulationRunning,
    setIsSimulationRunning,
  } = useOffice();
  const [filter, setFilter] = useState<ActorFilter>("all");

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? activities
        : activities.filter((a) => a.actorType === filter);
    return compact ? list.slice(0, 12) : list;
  }, [activities, compact, filter]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: "all", label: "Semua" },
              { id: "robot-placeholder", label: "Robot Sim" },
              { id: "user", label: "Operator" },
              { id: "system", label: "System" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                filter === item.id
                  ? "bg-purple-500/25 text-purple-200 ring-1 ring-purple-400/50"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            {isSimulationRunning ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            <span>{isSimulationRunning ? "Jeda" : "Mulai"}</span>
          </button>

          <button
            type="button"
            onClick={clearActivities}
            title="Bersihkan log aktivitas"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Activity Stream */}
      <div
        className={`space-y-2 overflow-y-auto pr-1 ${
          compact ? "max-h-[380px]" : "max-h-[620px]"
        }`}
      >
        {filtered.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2.5 rounded-xl border border-slate-800/90 bg-[#060d20]/90 p-3 text-xs transition hover:border-cyan-500/30"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                SEVERITY_DOT[event.severity]
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-wide text-cyan-200">
                    {event.actor}
                  </span>
                  {event.zone && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-300">
                      {event.zone}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {event.timestamp}
                </span>
              </div>
              <p className="mt-1 leading-relaxed text-slate-300">
                {event.message}
              </p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-800 py-10 text-xs text-slate-400">
            <Activity className="h-5 w-5 text-slate-500" />
            <span>Tidak ada aktivitas untuk filter ini.</span>
          </div>
        )}
      </div>
    </div>
  );
}
