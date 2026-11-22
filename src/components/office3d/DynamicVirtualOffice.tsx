"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";

export const DynamicVirtualOffice = dynamic(
  () =>
    import("@/components/office3d/VirtualOfficeCanvas").then(
      (mod) => mod.VirtualOfficeCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-cyan-500/25 bg-[#040814] sm:h-[520px]">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10">
          <Box className="h-6 w-6 animate-pulse text-cyan-300" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-cyan-200 uppercase">
            Initializing 3D Cyber Office
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Low-poly WebGL engine • Android optimized
          </p>
        </div>
      </div>
    ),
  }
);
