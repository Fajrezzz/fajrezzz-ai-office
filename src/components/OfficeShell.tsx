"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { AgentManagementPanel } from "@/components/dashboard/AgentManagementPanel";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { DynamicVirtualOffice } from "@/components/office3d/DynamicVirtualOffice";
import { OfficeProvider, useOffice } from "@/store/OfficeContext";
import { SimulatorProvider } from "@/store/SimulatorContext";
import { AgencyProvider } from "@/store/AgencyContext";

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

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-3 pb-24 sm:p-6 lg:pb-8">
          {activeSection === "office" && (
            <div className="space-y-3">
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
