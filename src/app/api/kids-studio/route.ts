import { NextResponse } from "next/server";
import {
  generateAutonomousKidsEpisode,
  type KidsThemeId,
} from "@/lib/kids-studio/episode-brain";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      episodeNumber?: number;
      themeId?: KidsThemeId;
      createdByAuto?: boolean;
    };

    const epNum =
      typeof body.episodeNumber === "number" && body.episodeNumber > 0
        ? Math.floor(body.episodeNumber)
        : 1;

    const episode = generateAutonomousKidsEpisode(
      epNum,
      body.themeId,
      Boolean(body.createdByAuto)
    );

    return NextResponse.json({
      ok: true,
      episode,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat episode animasi anak." },
      { status: 400 }
    );
  }
}
