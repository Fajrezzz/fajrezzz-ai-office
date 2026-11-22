import { NextResponse } from "next/server";
import { localOfficeAdapter } from "@/lib/services/local-office-adapter";

export async function GET() {
  const agents = await localOfficeAdapter.getAgents();
  return NextResponse.json({
    mode: "visual-placeholder",
    disclaimer:
      "Unit robot adalah placeholder visual Tahap 1 dan belum terhubung ke model AI.",
    data: agents,
  });
}
