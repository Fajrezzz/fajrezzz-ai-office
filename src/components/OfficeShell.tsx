"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { AgentManagementPanel } from "@/components/dashboard/AgentManagementPanel";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { KidsStudioPanel } from "@/components/kids/KidsStudioPanel";
import { DynamicVirtualOffice } from "@/components/office3d/DynamicVirtualOffice";
import { OfficeProvider, useOffice } from "@/store/OfficeContext";
import { AgencyProvider, useAgency } from "@/store/AgencyContext";

function OfficeWorkspace() {
  const { activeSection, setActiveSection } = useOffice();
  const { job } = useAgency();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const needsBossAction =
    job.stage === "waiting_idea" || job.stage === "waiting_script";

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-3 pb-24 sm:p-6 lg:pb-8">
          {(activeSection === "dashboard" || activeSection === "studio") && (
            <KidsStudioPanel />
          )}

          {activeSection === "office" && (
            <div className="space-y-3">
              {job.stage !== "idle" && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs ${
                    needsBossAction
                      ? "border-amber-400/70 bg-amber-400/15 text-amber-100"
                      : "border-slate-800 bg-slate-900/90 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>{job.activeStepLabel}</span>
                    <span className="rounded-full bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                      {job.progressPercent}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection("dashboard")}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950 hover:bg-amber-300"
                  >
                    <span>
                      {needsBossAction ? "Buka Laporan & ACC" : "Kembali ke Komando"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <DynamicVirtualOffice className="h-[calc(100vh-145px)] min-h-[520px] lg:h-[calc(100vh-110px)]" />
            </div>
          )}

          {(activeSection === "agents" ||
            activeSection === "tasks" ||
            activeSection === "activity") && (
            <div className="mx-auto max-w-5xl space-y-6">
              <AgentManagementPanel />
              <LiveActivityPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function OfficeShell() {
  return (
    <OfficeProvider>
      <AgencyProvider>
        <OfficeWorkspace />
      </AgencyProvider>
    </OfficeProvider>
  );
}
