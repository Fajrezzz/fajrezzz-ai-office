"use client";

import React from "react";
import { Menu, Sparkles } from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { NavSection } from "@/types/office";

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: "🎬 Studio YouTube Animasi Anak",
  office: "🏢 Kantor 3D & Bos FAJREZ",
  studio: "🎬 Studio YouTube Animasi Anak",
  agents: "👥 Tim 10 Karyawan & Aktivitas",
  tasks: "👥 Tim 10 Karyawan & Aktivitas",
  activity: "👥 Tim 10 Karyawan & Aktivitas",
};

export function TopHeader({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu: () => void;
}) {
  const { activeSection } = useOffice();

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

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
        <Sparkles className="h-3.5 w-3.5" />
        <span>100% Gratis Rp 0</span>
      </div>
    </header>
  );
}
