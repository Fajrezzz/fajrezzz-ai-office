import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 30;

const VOICE_MAP = {
  ardi: "id-ID-ArdiNeural",
  gadis: "id-ID-GadisNeural",
} as const;

type VoicePreset = keyof typeof VOICE_MAP;

function sanitizeSpeechText(raw: string): string {
  return raw
    .replace(/[<>&"'`]/g, " ")
    .replace(/[#*_~|[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 950);
}

/** Primary Engine: Microsoft Edge Azure Neural Human Voice (id-ID-ArdiNeural / id-ID-GadisNeural) — Rp 0 Free */
async function synthesizeEdgeNeural(
  text: string,
  voiceShortName: string,
  rate: string
): Promise<Buffer> {
  const tts = new MsEdgeTTS({
    connectionTimeoutMs: 8000,
    synthesisTimeoutMs: 20000,
  });

  try {
    await tts.setMetadata(
      voiceShortName,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );

    const { audioStream } = tts.toStream(text, {
      rate,
      pitch: "+0Hz",
    });

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Edge Neural TTS timeout"));
      }, 18000);

      audioStream.on("data", (chunk: Buffer | Uint8Array) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      audioStream.on("end", () => {
        clearTimeout(timer);
        resolve();
      });
      audioStream.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const merged = Buffer.concat(chunks);
    if (merged.length < 400) {
      throw new Error("Edge Neural TTS mengembalikan audio kosong");
    }
    return merged;
  } finally {
    try {
      tts.close();
    } catch {
      // ignore close errors
    }
  }
}

/** Split Indonesian narration cleanly into <= 175-char chunks for Google Neural TTS fallback */
function splitChunksForGoogle(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: string[] = [];
  for (const s of sentences) {
    if (s.length <= 175) {
      result.push(s);
      continue;
    }
    const words = s.split(/\s+/);
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > 175) {
        if (cur) result.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    }
    if (cur) result.push(cur.trim());
  }
  return result.length > 0 ? result : [text.slice(0, 175)];
}

/** Secondary Fallback: Google Indonesian Neural TTS (chunked MP3) — Rp 0 Free */
async function synthesizeGoogleNeural(text: string): Promise<Buffer> {
  const chunks = splitChunksForGoogle(text);
  const buffers: Buffer[] = [];

  for (const part of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(
      part
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      throw new Error(`Google TTS HTTP ${res.status}`);
    }
    const arr = await res.arrayBuffer();
    if (arr.byteLength > 200) {
      buffers.push(Buffer.from(arr));
    }
  }

  const merged = Buffer.concat(buffers);
  if (merged.length < 300) {
    throw new Error("Google Neural TTS mengembalikan audio kosong");
  }
  return merged;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text?: string;
      voice?: VoicePreset;
      rate?: string;
    };

    const cleanText = sanitizeSpeechText(body?.text ?? "");
    if (!cleanText) {
      return NextResponse.json(
        { ok: false, error: "Teks narasi kosong." },
        { status: 400 }
      );
    }

    const preset: VoicePreset =
      body?.voice === "gadis" ? "gadis" : "ardi";
    const voiceShortName = VOICE_MAP[preset];
    const rate =
      typeof body?.rate === "string" && /^[+-]\d{1,2}%$/.test(body.rate)
        ? body.rate
        : "+5%";

    // 1. Primary: Microsoft Edge Neural Human Voice (id-ID-ArdiNeural / GadisNeural)
    try {
      const mp3 = await synthesizeEdgeNeural(cleanText, voiceShortName, rate);
      return new NextResponse(new Uint8Array(mp3), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
          "X-TTS-Provider": "edge-neural-tts",
          "X-TTS-Voice": voiceShortName,
        },
      });
    } catch {
      // Fall through cleanly to Google Indonesian Neural TTS
    }

    // 2. Fallback: Google Indonesian Neural TTS
    try {
      const mp3 = await synthesizeGoogleNeural(cleanText);
      return new NextResponse(new Uint8Array(mp3), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
          "X-TTS-Provider": "google-neural-tts",
          "X-TTS-Voice": "Google Neural Bahasa Indonesia",
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "Semua engine Neural TTS sedang sibuk.",
        },
        { status: 503 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Request TTS tidak valid.",
      },
      { status: 400 }
    );
  }
}
