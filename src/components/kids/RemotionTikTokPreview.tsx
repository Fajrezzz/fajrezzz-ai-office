"use client";

import React, { useMemo } from "react";
import { Player } from "@remotion/player";
import type { EditorialEpisode } from "@/lib/pipeline/motion-renderer";
import {
  TikTokAiComposition,
  type TikTokAiCompositionProps,
} from "@/remotion/TikTokAiComposition";

interface RemotionTikTokPreviewProps {
  episode: EditorialEpisode;
  fps?: number;
}

export function RemotionTikTokPreview({ episode, fps = 60 }: RemotionTikTokPreviewProps) {
  const durationInFrames = useMemo(() => {
    const totalSec = episode.scenes.reduce((sum, s) => sum + Math.max(1, s.durationSec), 0);
    return Math.max(fps * 2, Math.round(totalSec * fps));
  }, [episode, fps]);

  const inputProps = useMemo<TikTokAiCompositionProps>(() => ({ episode }), [episode]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[240px] sm:w-[270px] aspect-[9/16] rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.18)] bg-slate-950">
        <Player
          component={TikTokAiComposition}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={fps}
          controls
          loop
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="text-[11px] font-mono text-cyan-300/90 text-center">
        Remotion 4.0.546 + GSAP 3.15.1 · 9:16 Live React Composition ({fps} FPS · {durationInFrames} frames)
      </div>
    </div>
  );
}
