"use client";

import React from "react";
import {
  Activity,
  Bot,
  Box,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
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
    label: "Dashboard Utama",
    shortLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    id: "office",
    label: "Virtual Office 3D",
    shortLabel: "3D Office",
    icon: Box,
  },
  {
    id: "studio",
    label: "Studio Kerja & Cuan",
    shortLabel: "Cuan Rp0",
    icon: Briefcase,
  },
  {
    id: "agents",
    label: "Agent Management",
    shortLabel: "Agents",
    icon: Bot,
  },
  {
    id: "tasks",
    label: "Task Manager",
    shortLabel: "Tasks",
    icon: ListTodo,
  },
  {
    id: "activity",
    label: "Live Activity",
    shortLabel: "Activity",
    icon: Activity,
  },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { activeSection, setActiveSection, agents, tasks, activities, workOrders } =
    useOffice();

  const getBadge = (id: NavSection): string | null => {
    if (id === "studio") return workOrders.length > 0 ? `${workOrders.length}` : "FREE";
    if (id === "agents") return `${agents.length}`;
    if (id === "tasks") {
      const open = tasks.filter((t) => t.status !== "done").length;
      return `${open}`;
    }
    if (id === "activity") return `${activities.length}`;
    return null;
  };

  const handleSelect = (id: NavSection) => {
    setActiveSection(id);
    onCloseMobile();
  };

  const renderSidebarBody = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between bg-[#060c1f]/95 text-slate-100 backdrop-blur-xl">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-cyan-500/20 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-gradient-to-br from-cyan-500/25 via-blue-600/20 to-purple-600/30 shadow-[0_0_18px_rgba(0,229,255,0.28)]">
              <Cpu className="h-5 w-5 text-cyan-300" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold tracking-wider text-white">
                  FAJREZZZ
                </div>
                <div className="truncate text-[10px] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                  AI OFFICE • 3D
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu navigasi"
              className="rounded-lg border border-slate-700/80 p-1.5 text-slate-300 hover:border-cyan-400/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              className="hidden rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-200 lg:flex"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 p-3">
          {(!collapsed || isMobile) && (
            <div className="px-2 pb-1 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              Command Center
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const badge = getBadge(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "border border-cyan-400/45 bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-purple-600/15 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.12)]"
                    : "border border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-100"
                }`}
              >
                <span className="flex items-center gap-3 overflow-hidden">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? "text-cyan-300"
                        : "text-slate-400 group-hover:text-cyan-300"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </span>
                {(!collapsed || isMobile) && badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "bg-cyan-400/20 text-cyan-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Phase 1 Integration Readiness Card */}
      <div className="border-t border-cyan-500/15 p-3">
        {!collapsed || isMobile ? (
          <div className="space-y-2 rounded-xl border border-purple-500/25 bg-gradient-to-br from-[#0b132b] to-[#130c29] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Arsitektur Tahap 1</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-cyan-400" />
                  Supabase Adapter
                </span>
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
                  READY
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-purple-400" />
                  AI API Gateway
                </span>
                <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
                  OFFLINE
                </span>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Robot 3D berjalan sebagai visual placeholder lokal tanpa API key
              di frontend.
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              title="Arsitektur Tahap 1: Mode Placeholder Lokal"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/35 bg-purple-500/15 text-purple-300"
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-cyan-500/20 transition-all duration-200 lg:block ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarBody(false)}</div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-72 max-w-[82vw] border-r border-cyan-500/25 shadow-2xl">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* Mobile / Android Sticky Bottom Navigation Bar */}
      <nav className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-cyan-500/20 bg-[#050b1d]/95 px-0.5 py-1.5 backdrop-blur-lg lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex min-w-[50px] flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[9px] font-semibold transition ${
                active
                  ? item.id === "studio"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-cyan-500/15 text-cyan-300"
                  : item.id === "studio"
                  ? "text-emerald-300/80 hover:text-emerald-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
