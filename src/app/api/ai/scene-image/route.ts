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

/** Model image Gemini yang dipakai (bisa dioverride lewat env tanpa ubah kode). */
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

/**
 * AI B-Roll scene image generator.
 *
 * Pollinations DIHAPUS (permintaan Bos: fokus 3 API — Gemini, Groq, OpenRouter).
 * Satu-satunya penyedia yang bisa menghasilkan gambar dari 3 API tersebut adalah
 * Gemini (image generation). Tanpa GEMINI_API_KEY endpoint ini mengembalikan 503
 * yang jelas, dan renderer otomatis memakai fallback sinematik prosedural.
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

    const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_PROVIDER_CONFIGURED",
          error:
            "B-Roll AI butuh GEMINI_API_KEY (satu-satunya dari 3 API yang bisa generate gambar).",
          hint:
            "Pasang GEMINI_API_KEY di https://vercel.com/fajrezzz1/fajrezzz-ai-office/settings/environment-variables lalu Redeploy. Tanpa key, renderer memakai fallback sinematik prosedural.",
        },
        { status: 503 }
      );
    }

    const moodStyle = MOOD_STYLE[body.mood || "bright"] ?? MOOD_STYLE.bright;
    const engineeredPrompt = [
      rawPrompt.slice(0, 180),
      moodStyle,
      "cinematic commercial B-roll, 8k octane 3D motion design aesthetic, shallow depth of field, NO text, NO letters, NO watermark, NO logos",
    ].join(", ");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: engineeredPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
        signal: AbortSignal.timeout(26000),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          code: res.status === 429 ? "ALL_PROVIDERS_RATE_LIMITED" : "IMAGE_PROVIDER_FAILED",
          error: `Gemini image gagal (HTTP ${res.status}).`,
          hint:
            res.status === 429
              ? "Kuota gambar Gemini habis sementara. Renderer memakai fallback prosedural; coba lagi beberapa menit."
              : "Cek GEMINI_API_KEY / kuota. Renderer tetap jalan dengan fallback sinematik prosedural.",
          detail: errText.slice(0, 200),
        },
        { status: res.status >= 500 ? 503 : res.status }
      );
    }

    const json = (await res.json()) as {
      candidates?: {
        content?: {
          parts?: { inlineData?: { mimeType?: string; data?: string } }[];
        };
      }[];
    };

    const part = json.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    );
    const base64 = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || "image/png";

    if (!base64 || base64.length < 200) {
      return NextResponse.json(
        {
          ok: false,
          error: "Gemini tidak mengembalikan gambar; memakai fallback sinematik prosedural.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "gemini-image",
      mimeType,
      dataUrl: `data:${mimeType};base64,${base64}`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Scene image failed" },
      { status: 500 }
    );
  }
}
