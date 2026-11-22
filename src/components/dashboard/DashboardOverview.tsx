"use client";

import React, { useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  Maximize2,
  Monitor,
  ShieldAlert,
} from "lucide-react";
import { DynamicVirtualOffice } from "@/components/office3d/DynamicVirtualOffice";
import { AgentManagementPanel } from "@/components/dashboard/AgentManagementPanel";
import { TaskManagerPanel } from "@/components/dashboard/TaskManagerPanel";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { useOffice } from "@/store/OfficeContext";

type InspectorTab = "agents" | "tasks" | "activity";

export function DashboardOverview() {
  const { agents, workstations, tasks, setActiveSection } = useOffice();
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("agents");

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const activeRobots = agents.filter((a) => a.status !== "standby").length;
  const occupiedWorkstations = workstations.filter(
    (w) => w.assignedAgentId !== null
  ).length;

  return (
    <div className="space-y-5">
      {/* KPI Stat Strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#081229] to-[#050b1a] p-4 shadow-[0_0_24px_rgba(0,229,255,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Karyawan Placeholder
            </span>
            <Bot className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {activeRobots}/{agents.length}
            </span>
            <span className="text-[10px] font-semibold uppercase text-cyan-300">
              Visual Sim
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            10 staff di L1, L2 Ops & L3 Exec
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#100d29] to-[#050b1a] p-4 shadow-[0_0_24px_rgba(168,85,247,0.06)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Task Progress
            </span>
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {doneTasks}/{tasks.length}
            </span>
            <span className="text-[10px] font-semibold uppercase text-purple-300">
              Selesai
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
              style={{
                width: `${
                  tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#081229] to-[#050b1a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Workstation Pods
            </span>
            <Monitor className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {occupiedWorkstations}/{workstations.length}
            </span>
            <span className="text-[10px] font-semibold uppercase text-sky-300">
              Terisi
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            + Server Room, Espresso Bar & Boardroom L3
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#0d1029] to-[#050b1a] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Status Integrasi
            </span>
            <Cpu className="h-4 w-4 text-fuchsia-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">Phase 1</span>
            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-purple-200">
              NO AI KEY
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Siap integrasi Supabase & AI API
          </p>
        </div>
      </section>

      {/* Main Split Command Center: 3D Virtual Office + Side Inspector */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left/Main 3D Virtual Office */}
        <div className="space-y-2.5 xl:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white">
                Virtual Office 3D — Grand 28m 3-Floor Architectural HQ
              </h2>
              <p className="text-xs text-slate-400">
                10 staff 3D, Free-Roam zoom bebas (HP & PC), 8 workstation L2,
                boardroom L3, infinity pool, supercar & helipad
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("office")}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </button>
          </div>

          <DynamicVirtualOffice className="h-[490px] sm:h-[580px] xl:h-[640px]" />

          {/* Clear Non-AI Disclaimer Footer */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-[#060c1d]/80 px-3 py-2 text-[11px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span>
              <strong className="text-slate-200">Transparansi Tahap 1:</strong>{" "}
              Seluruh 10 karyawan 3D (Raka, Nadia, Dimas, Clara, Bima, Salsa,
              Fajar, Alya, Reza, Tania) adalah placeholder visual interaktif
              berbasis simulasi lokal tanpa eksekusi AI nyata.
            </span>
          </div>
        </div>

        {/* Right Docked Command Inspector */}
        <div className="flex flex-col rounded-2xl border border-cyan-500/20 bg-[#060d1f]/90 p-4 xl:col-span-4">
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-[#040814] p-1">
            {(
              [
                { id: "agents", label: "Agents", icon: Bot },
                { id: "tasks", label: "Tasks", icon: CheckCircle2 },
                { id: "activity", label: "Activity", icon: Activity },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = inspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectorTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/25 to-purple-500/25 text-cyan-100 ring-1 ring-cyan-400/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5 xl:max-h-[500px]">
            {inspectorTab === "agents" && <AgentManagementPanel compact />}
            {inspectorTab === "tasks" && <TaskManagerPanel compact />}
            {inspectorTab === "activity" && <LiveActivityPanel compact />}
          </div>
        </div>
      </section>
    </div>
  );
}
