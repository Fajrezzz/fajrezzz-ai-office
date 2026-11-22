import { NextRequest, NextResponse } from "next/server";
import { localOfficeAdapter } from "@/lib/services/local-office-adapter";

export async function GET() {
  const tasks = await localOfficeAdapter.getTasks();
  return NextResponse.json({
    mode: "visual-placeholder",
    data: tasks,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "critical";
      category?: "architecture" | "automation" | "analytics" | "ui-ux" | "ops";
      assignedAgentId?: string | null;
    };

    if (!body.title || body.title.trim().length < 2) {
      return NextResponse.json(
        { error: "Judul task minimal 2 karakter." },
        { status: 400 }
      );
    }

    const created = await localOfficeAdapter.createTask({
      title: body.title.trim(),
      description: (body.description ?? "").trim(),
      priority: body.priority ?? "medium",
      category: body.category ?? "ops",
      assignedAgentId: body.assignedAgentId ?? null,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Payload tidak valid." },
      { status: 400 }
    );
  }
}
