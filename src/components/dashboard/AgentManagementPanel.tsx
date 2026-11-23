"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Coffee,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import { useAgency } from "@/store/AgencyContext";
import { PIPELINE_DIVISIONS } from "@/types/pipeline";

export function AgentManagementPanel({ compact = false }: { compact?: boolean }) {
  const { agents, setSelectedAgentId, setActiveSection, focusOnAgent } =
    useOffice();
  const { getAgentSnapshot, runDivision, runningDivision } = useAgency();
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-slate-300">
        <div className="font-black text-cyan-200">
          Tim 7 Divisi Pekerja Nyata (Tersinkron ke Kantor 3D)
        </div>
        <p className="mt-1 leading-relaxed text-slate-300">
          Setiap agen hanya berstatus <strong className="text-emerald-300">WORK</strong>{" "}
          dan berjalan ke meja kerjanya saat divisinya benar-benar sedang mengeksekusi
          tugas. Saat antrean kosong agen otomatis{" "}
          <strong className="text-amber-300">IDLE / ngopi</strong>; jika gagal akan
          muncul <strong className="text-rose-300">indikator ERROR merah</strong> di
          mejanya.
        </p>
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-2"}`}>
        {PIPELINE_DIVISIONS.map((meta) => {
          const agent = agents.find((a) => a.id === meta.agentId);
          const snap = getAgentSnapshot(meta.agentId);
          const isOpen = expandedAgentId === meta.agentId;

          const statusLabel =
            snap?.status === "running"
              ? "WORK (AKTIF)"
              : snap?.status === "failed"
              ? "ERROR"
              : snap?.status === "done"
              ? "IDLE (SELESAI)"
              : "IDLE (ANTREAN KOSONG)";

          return (
            <div
              key={meta.key}
              className={`rounded-2xl border p-4 transition ${
                snap?.status === "failed"
                  ? "border-rose-500/60 bg-rose-950/20"
                  : snap?.status === "running"
                  ? "border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800 bg-slate-900/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div>
                    <div className="text-sm font-black text-white">
                      {meta.agentName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {meta.label}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    snap?.status === "running"
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                      : snap?.status === "failed"
                      ? "border-rose-400/70 bg-rose-500/20 text-rose-200"
                      : snap?.status === "done"
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 bg-slate-800 text-slate-300"
                  }`}
                >
                  {snap?.status === "running" && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {snap?.status === "failed" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {snap?.status === "done" && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {(!snap || snap.status === "queued") && (
                    <Coffee className="h-3 w-3" />
                  )}
                  <span>{statusLabel}</span>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {snap && snap.durationMs > 0
                    ? `${(snap.durationMs / 1000).toFixed(1)}d`
                    : "Belum berjalan"}
                </span>
                {snap?.provider && (
                  <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                    {snap.provider}
                  </span>
                )}
                {agent && (
                  <span className="truncate text-[10px] text-slate-400">
                    · {agent.currentActionLabel}
                  </span>
                )}
              </div>

              {snap?.error && (
                <div className="mt-2 rounded-xl border border-rose-500/40 bg-rose-950/50 p-2 text-[11px] text-rose-200">
                  {snap.error}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(meta.agentId);
                    setActiveSection("office");
                    window.setTimeout(() => focusOnAgent(meta.agentId), 150);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-sky-400/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-500/25"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>Lihat di 3D</span>
                </button>

                {snap?.episodeId && (
                  <button
                    type="button"
                    disabled={Boolean(runningDivision)}
                    onClick={() => runDivision(snap.episodeId!, meta.key)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-cyan-400 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Divisi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setExpandedAgentId(isOpen ? null : meta.agentId)
                  }
                  className="ml-auto text-[11px] font-semibold text-cyan-300 hover:underline"
                >
                  {isOpen ? "Tutup Detail" : "Input / Output / Log"}
                </button>
              </div>

              {isOpen && snap && (
                <div className="mt-3 space-y-2 border-t border-slate-800 pt-2.5 text-[10px]">
                  <div className="max-h-28 overflow-y-auto rounded-xl bg-slate-950 p-2 font-mono text-slate-300">
                    {snap.logs.length === 0 ? (
                      <span className="text-slate-500">Belum ada log.</span>
                    ) : (
                      snap.logs.map((l, idx) => (
                        <div key={idx}>
                          [{l.time}] {l.message}
                        </div>
                      ))
                    )}
                  </div>
                  {snap.output !== null && (
                    <pre className="max-h-36 overflow-auto rounded-xl bg-slate-950 p-2 text-cyan-200">
                      {JSON.stringify(snap.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
