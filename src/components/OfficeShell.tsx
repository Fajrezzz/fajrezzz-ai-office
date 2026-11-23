"use client";

import React, { useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { AgentManagementPanel } from "@/components/dashboard/AgentManagementPanel";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { RealResultsDashboard } from "@/components/dashboard/RealResultsDashboard";
import { KidsStudioPanel } from "@/components/kids/KidsStudioPanel";
import { DynamicVirtualOffice } from "@/components/office3d/DynamicVirtualOffice";
import { OfficeProvider, useOffice } from "@/store/OfficeContext";
import { SimulatorProvider } from "@/store/SimulatorContext";
import { AgencyProvider, useAgency } from "@/store/AgencyContext";
import { PIPELINE_DIVISIONS } from "@/types/pipeline";

function OfficeWorkspace() {
  const { activeSection, setActiveSection } = useOffice();
  const { activeEpisode, runningDivision } = useAgency();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeDivMeta = runningDivision
    ? PIPELINE_DIVISIONS.find((d) => d.key === runningDivision)
    : null;

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
          {activeSection === "dashboard" && <KidsStudioPanel />}

          {activeSection === "studio" && <RealResultsDashboard />}

          {activeSection === "office" && (
            <div className="space-y-3">
              {activeEpisode && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs ${
                    activeDivMeta
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                      : "border-slate-800 bg-slate-900/90 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {activeDivMeta ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    )}
                    <span>
                      {activeDivMeta
                        ? `${activeDivMeta.label} (${activeDivMeta.agentName}) sedang bekerja nyata...`
                        : `Episode #${activeEpisode.episodeNumber}: ${
                            activeEpisode.divisions.seo.output?.title ||
                            activeEpisode.bossTheme
                          }`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection("dashboard")}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950 hover:bg-amber-300"
                  >
                    <span>Buka Pipeline 7 Divisi</span>
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
      <SimulatorProvider>
        <AgencyProvider>
          <OfficeWorkspace />
        </AgencyProvider>
      </SimulatorProvider>
    </OfficeProvider>
  );
}
