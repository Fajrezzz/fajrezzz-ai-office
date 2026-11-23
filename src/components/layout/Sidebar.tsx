"use client";

import React from "react";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Film,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useOffice } from "@/store/OfficeContext";
import type { NavSection } from "@/types/office";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "dashboard",
    label: "Komando Bos",
    shortLabel: "Komando",
    icon: Film,
  },
  {
    id: "office",
    label: "Kantor 3D + Bos",
    shortLabel: "Kantor 3D",
    icon: Box,
  },
  {
    id: "agents",
    label: "Tim & Divisi",
    shortLabel: "Tim 10",
    icon: Users,
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { activeSection, setActiveSection } = useOffice();

  const handleSelect = (id: NavSection) => {
    setActiveSection(id);
    onCloseMobile();
  };

  const renderSidebarBody = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between bg-[#060c1f]/95 text-slate-100 backdrop-blur-xl">
      <div>
        {/* Simple Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 shadow-lg">
              <Film className="h-5 w-5" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <div className="truncate text-sm font-black tracking-wide text-white">
                  FAJREZZZ
                </div>
                <div className="truncate text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  YT ANAK AUTOPILOT
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu"
              className="rounded-lg border border-slate-700 p-1.5 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              className="hidden rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white lg:flex"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* 3 Super-Simple Navigation Items */}
        <nav className="space-y-2 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-amber-400/20 to-emerald-400/15 text-amber-200 ring-1 ring-amber-400/50"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    active ? "text-amber-300" : "text-slate-400"
                  }`}
                />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simple Free Note */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed || isMobile ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>100% Gratis (Rp 0)</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
              Animasi &amp; musik dibuat langsung di browser tanpa bayar API.
              Tinggal download &amp; upload ke YouTube.
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden shrink-0 border-r border-slate-800 transition-all duration-200 lg:block ${
          collapsed ? "w-[76px]" : "w-60"
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarBody(false)}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-68 max-w-[80vw] border-r border-slate-800 shadow-2xl">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* Ultra-Clean 3-Button Android Bottom Navigation Bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-40 grid grid-cols-3 border-t border-slate-800 bg-[#050b1d]/95 px-2 py-2 backdrop-blur-lg lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition ${
                active
                  ? "bg-amber-400/20 text-amber-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
