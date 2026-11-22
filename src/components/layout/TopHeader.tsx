"use client";

import React from "react";
import { Menu, Radio, Sparkles, Zap } from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { NavSection } from "@/types/office";

const SECTION_META: Record<
  NavSection,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "Command Dashboard",
    subtitle: "Markas 3D 28m, 10 karyawan + Bos FAJREZ, Studio Cuan Rp 0 & telemetri",
  },
  office: {
    title: "Virtual Office 3D",
    subtitle: "Gedung HQ 3 lantai, Mode Analog Bos FAJREZ, kolam renang & supercar",
  },
  studio: {
    title: "Studio Kerja & Cuan (Rp 0)",
    subtitle: "10 karyawan produksi Website HTML, 7 Naskah Viral, Script WA & Invoice 100% Gratis",
  },
  agents: {
    title: "Agent Management",
    subtitle: "Kontrol 10 karyawan 3D placeholder & jadwal workstation",
  },
  tasks: {
    title: "Task Manager",
    subtitle: "Kelola daftar tugas proyek & penugasan tim",
  },
  activity: {
    title: "Live Activity",
    subtitle: "Aliran log event kantor & produksi paket kerja real-time",
  },
};

export function TopHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { activeSection, performanceMode, isSimulationRunning } = useOffice();
  const meta = SECTION_META[activeSection];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-cyan-500/20 bg-[#050b1c]/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition hover:bg-cyan-500/20 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-wide text-white sm:text-base">
            {meta.title}
          </h1>
          <p className="hidden truncate text-xs text-slate-400 sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Status Pills */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          title="Tahap 1 menggunakan robot visual placeholder tanpa API AI"
          className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-purple-200 sm:text-[11px]"
        >
          <Sparkles className="h-3 w-3 text-purple-300" />
          <span className="hidden sm:inline">Visual Placeholder Mode</span>
          <span className="sm:hidden">Placeholder</span>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 md:flex">
          <Zap className="h-3 w-3 text-cyan-300" />
          <span className="uppercase">{performanceMode}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-[10px] font-medium text-slate-200 sm:text-[11px]">
          <Radio
            className={`h-3 w-3 ${
              isSimulationRunning
                ? "animate-pulse text-emerald-400"
                : "text-amber-400"
            }`}
          />
          <span className="hidden sm:inline">
            {isSimulationRunning ? "Sim Live" : "Paused"}
          </span>
        </div>
      </div>
    </header>
  );
}
