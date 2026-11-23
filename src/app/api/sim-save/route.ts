import { NextResponse } from "next/server";

let latestServerSave: Record<string, unknown> | null = null;

export async function GET() {
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supaUrl && supaKey) {
    try {
      const res = await fetch(
        `${supaUrl.replace(/\/$/, "")}/rest/v1/office_saves?id=eq.default&select=payload&limit=1`,
        {
          headers: {
            apikey: supaKey,
            Authorization: `Bearer ${supaKey}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ payload?: Record<string, unknown> }>;
        if (rows[0]?.payload) {
          return NextResponse.json({
            ok: true,
            storage: "supabase",
            data: rows[0].payload,
          });
        }
      }
    } catch {
      // Fallback gracefully
    }
  }

  return NextResponse.json({
    ok: true,
    storage: "memory",
    data: latestServerSave,
  });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    latestServerSave = payload;

    const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supaUrl && supaKey) {
      try {
        const res = await fetch(
          `${supaUrl.replace(/\/$/, "")}/rest/v1/office_saves`,
          {
            method: "POST",
            headers: {
              apikey: supaKey,
              Authorization: `Bearer ${supaKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify({
              id: "default",
              payload,
              updated_at: new Date().toISOString(),
            }),
          }
        );
        if (res.ok) {
          return NextResponse.json({ ok: true, storage: "supabase" });
        }
      } catch {
        // Fallback gracefully to memory/local
      }
    }

    return NextResponse.json({ ok: true, storage: "memory" });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
}
