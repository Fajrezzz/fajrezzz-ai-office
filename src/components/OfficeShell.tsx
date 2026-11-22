"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AgentManagementPanel } from "@/components/dashboard/AgentManagementPanel";
import { TaskManagerPanel } from "@/components/dashboard/TaskManagerPanel";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { DynamicVirtualOffice } from "@/components/office3d/DynamicVirtualOffice";
import { OfficeProvider, useOffice } from "@/store/OfficeContext";

function OfficeWorkspace() {
  const { activeSection } = useOffice();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 sm:p-6 lg:pb-8">
          {activeSection === "dashboard" && <DashboardOverview />}

          {activeSection === "office" && (
            <div className="space-y-3">
              <DynamicVirtualOffice className="h-[calc(100vh-170px)] min-h-[440px] lg:h-[calc(100vh-120px)]" />
            </div>
          )}

          {activeSection === "agents" && (
            <div className="space-y-5">
              <AgentManagementPanel />
            </div>
          )}

          {activeSection === "tasks" && (
            <div className="mx-auto max-w-5xl">
              <TaskManagerPanel />
            </div>
          )}

          {activeSection === "activity" && (
            <div className="mx-auto max-w-4xl">
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
      <OfficeWorkspace />
    </OfficeProvider>
  );
}
