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
 * Model image Gemini (bisa dioverride lewat env GEMINI_IMAGE_MODEL, pisahkan koma).
 * v9.4: kalau Google mempensiunkan satu model (HTTP 404 "model ... is not found"),
 * endpoint ini mencoba model berikutnya, bukan langsung gagal.
 */
function resolveImageModels(): string[] {
  const fromEnv = (process.env.GEMINI_IMAGE_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [
    ...new Set([
      ...fromEnv,
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview",
    ]),
  ];
}

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

    let res: Response | null = null;
    let lastStatus = 0;
    let lastDetail = "";
    let usedImageModel = "";

    for (const imageModel of resolveImageModels()) {
      const attempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent`,
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
      if (attempt.ok) {
        res = attempt;
        usedImageModel = imageModel;
        break;
      }
      lastStatus = attempt.status;
      lastDetail = (await attempt.text().catch(() => "")).slice(0, 200);
      const modelMissing =
        attempt.status === 404 ||
        /not found|is not supported|does not exist|unsupported/i.test(lastDetail);
      // Model pensiun → coba kandidat berikutnya. Error lain (429/5xx) → berhenti.
      if (!modelMissing) break;
    }

    if (!res) {
      return NextResponse.json(
        {
          ok: false,
          code: lastStatus === 429 ? "ALL_PROVIDERS_RATE_LIMITED" : "IMAGE_PROVIDER_FAILED",
          error: `Gemini image gagal (HTTP ${lastStatus}).`,
          hint:
            lastStatus === 429
              ? "Kuota gambar Gemini habis sementara. Renderer memakai fallback prosedural; coba lagi beberapa menit."
              : "Cek GEMINI_API_KEY / kuota (set GEMINI_IMAGE_MODEL bila nama model berubah). Renderer tetap jalan dengan fallback sinematik prosedural.",
          detail: lastDetail,
        },
        { status: lastStatus >= 500 ? 503 : lastStatus || 503 }
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
      model: usedImageModel,
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
