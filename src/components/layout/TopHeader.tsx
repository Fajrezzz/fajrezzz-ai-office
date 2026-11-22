"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Cpu, Menu } from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { NavSection } from "@/types/office";

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: "📱 Komando Bos & Pipeline 7 Divisi",
  office: "🏢 Kantor 3D & Bos FAJREZ",
  studio: "📊 Hasil Nyata, YPP & KPI Tim",
  agents: "👥 Tim Divisi AI & Log Kerja",
  tasks: "👥 Tim Divisi AI & Log Kerja",
  activity: "👥 Tim Divisi AI & Log Kerja",
};

interface AiStatusSummary {
  anyConfigured: boolean;
  configuredCount: number;
  providers: { id: string; configured: boolean }[];
}

export function TopHeader({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu: () => void;
}) {
  const { activeSection } = useOffice();
  const [aiStatus, setAiStatus] = useState<AiStatusSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ai/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.ok) {
          setAiStatus({
            anyConfigured: Boolean(data.anyConfigured),
            configuredCount: Number(data.configuredCount ?? 0),
            providers: Array.isArray(data.providers) ? data.providers : [],
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const configuredNames =
    aiStatus?.providers
      .filter((p) => p.configured)
      .map((p) => p.id.toUpperCase())
      .join("+") ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-800/90 bg-[#050b1c]/90 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-black tracking-wide text-white sm:text-base">
          {SECTION_TITLES[activeSection]}
        </h1>
      </div>

      {aiStatus === null ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-300">
          <Cpu className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span>Cek AI Server...</span>
        </div>
      ) : aiStatus.anyConfigured ? (
        <div
          title={`Provider aktif: ${configuredNames}. Kuota free-tier berlaku sesuai batas provider.`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-[11px] font-bold text-cyan-200"
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-300" />
          <span>
            AI Free-Tier ({aiStatus.configuredCount} Provider)
          </span>
        </div>
      ) : (
        <div
          title="Tambahkan GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY di Vercel Environment Variables"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-200"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          <span>API Key AI Belum Diatur</span>
        </div>
      )}
    </header>
  );
}
