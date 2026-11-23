import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface SceneImageRequest {
  prompt: string;
  mood?: "bright" | "curious" | "dramatic" | "warm";
  format?: "shorts" | "landscape";
  seed?: number;
}

const MOOD_STYLE: Record<string, string> = {
  bright:
    "modern futuristic minimal tech aesthetic, crisp cyan and emerald rim lighting, dark obsidian depth, ultra clean 3D editorial render, volumetric light rays",
  curious:
    "cyberpunk editorial studio aesthetic, electric violet and sapphire blue volumetric lighting, sleek glassmorphic 3D depth, dramatic bokeh",
  dramatic:
    "high-contrast cinematic thriller documentary visual, warm amber and crimson rim light against deep charcoal shadows, moody anamorphic lens flare",
  warm:
    "luxury modern golden-hour editorial cinema, warm gold and emerald accents, smooth shallow depth of field, sleek high-end commercial production",
};

/**
 * FREE Rp 0 Cinematic AI B-Roll Scene Generator (MoneyPrinterTurbo + ComfyUI visual pipeline)
 * Generates tailored high-contrast editorial visuals per scene via Pollinations Flux/Turbo AI
 * with zero watermarks and zero garbled embedded text (so our kinetic typography overlays stay crisp).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SceneImageRequest>;
    const rawPrompt = (body.prompt || "").trim();
    if (!rawPrompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt visual adegan kosong." },
        { status: 400 }
      );
    }

    const format = body.format === "landscape" ? "landscape" : "shorts";
    const width = format === "shorts" ? 576 : 960;
    const height = format === "shorts" ? 1024 : 540;
    const moodStyle = MOOD_STYLE[body.mood || "bright"] ?? MOOD_STYLE.bright;
    const seed = Number.isFinite(body.seed)
      ? Math.abs(Math.floor(Number(body.seed)))
      : Math.floor(Math.random() * 99999);

    const engineeredPrompt = [
      rawPrompt.slice(0, 180),
      moodStyle,
      "cinematic commercial B-roll, 8k octane 3D motion design aesthetic, shallow depth of field, NO text, NO letters, NO watermark, NO logos",
    ].join(", ");

    const encoded = encodeURIComponent(engineeredPrompt);
    const urls = [
      `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`,
      `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(13000),
          headers: {
            Accept: "image/*",
            "User-Agent": "FajrezzzAIOffice/2.0",
          },
        });
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) continue;

        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength < 2500) continue;

        const base64 = Buffer.from(arrayBuf).toString("base64");
        return NextResponse.json({
          ok: true,
          provider: "pollinations-flux",
          mimeType: contentType,
          dataUrl: `data:${contentType};base64,${base64}`,
        });
      } catch {
        // try next endpoint
      }
    }

    return NextResponse.json(
      { ok: false, error: "B-Roll AI sedang sibuk, memakai fallback sinematik prosedural." },
      { status: 503 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Scene image failed" },
      { status: 500 }
    );
  }
}
