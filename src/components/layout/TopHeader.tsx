"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Menu, Sparkles } from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { NavSection } from "@/types/office";

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: "📱 Komando Bos & Pipeline 7 Divisi",
  office: "🏢 Kantor 3D & Bos FAJREZ",
  studio: "📊 Hasil Nyata, YPP & KPI Tim",
  agents: "👥 Tim 7 Divisi AI & Log Kerja",
  tasks: "👥 Tim 7 Divisi AI & Log Kerja",
  activity: "👥 Tim 7 Divisi AI & Log Kerja",
};

interface AiStatusSummary {
  activeLabel: string;
  pricingNotice: string;
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
            activeLabel: String(data.activeLabel || "Pollinations Free (Rp 0)"),
            pricingNotice: String(data.pricingNotice || ""),
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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

      <div
        title={aiStatus?.pricingNotice || "AI Gratis Rp 0 langsung aktif tanpa API key"}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/45 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-200"
      >
        {aiStatus ? (
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <Cpu className="h-3.5 w-3.5 animate-pulse text-cyan-300" />
        )}
        <span>{aiStatus ? `AI Gratis Rp 0 · ${aiStatus.activeLabel}` : "AI Gratis Rp 0"}</span>
      </div>
    </header>
  );
}
