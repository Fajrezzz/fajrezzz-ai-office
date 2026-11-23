"use client";

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VisualStyleId } from "@/types/pipeline";
import type { EditorialEpisode, EditorialScene } from "@/lib/pipeline/motion-renderer";
import { evaluateGsapSceneTimeline } from "@/lib/pipeline/gsap-timeline-choreographer";
import { findActiveWordIndex } from "@/lib/pipeline/video-engine-v3";

export interface TikTokAiCompositionProps {
  episode: EditorialEpisode;
}

const ACCENT_MAP: Record<
  VisualStyleId,
  { isLight: boolean; bg: string; surface: string; accent: string; accent2: string }
> = {
  dark_ai_cinematic: {
    isLight: false,
    bg: "linear-gradient(165deg, #060913 0%, #0d1629 55%, #070b16 100%)",
    surface: "rgba(15, 23, 42, 0.88)",
    accent: "#38bdf8",
    accent2: "#a78bfa",
  },
  clean_tutorial: {
    isLight: true,
    bg: "linear-gradient(165deg, #f8fafc 0%, #eef2ff 55%, #f1f5f9 100%)",
    surface: "rgba(255, 255, 255, 0.92)",
    accent: "#2563eb",
    accent2: "#7c3aed",
  },
  cyberpunk_dev: {
    isLight: false,
    bg: "linear-gradient(165deg, #04080f 0%, #071b18 55%, #040910 100%)",
    surface: "rgba(9, 20, 26, 0.9)",
    accent: "#10b981",
    accent2: "#22d3ee",
  },
  agent_3d_network: {
    isLight: false,
    bg: "linear-gradient(165deg, #09061a 0%, #1c0f38 55%, #0b071c 100%)",
    surface: "rgba(23, 15, 45, 0.88)",
    accent: "#f472b6",
    accent2: "#38bdf8",
  },
  tech_documentary: {
    isLight: false,
    bg: "linear-gradient(165deg, #0b0d12 0%, #171c26 55%, #0d1016 100%)",
    surface: "rgba(24, 28, 38, 0.9)",
    accent: "#60a5fa",
    accent2: "#f59e0b",
  },
  minimal_kinetic: {
    isLight: false,
    bg: "linear-gradient(165deg, #050507 0%, #121218 55%, #060609 100%)",
    surface: "rgba(18, 18, 24, 0.92)",
    accent: "#facc15",
    accent2: "#22d3ee",
  },
  high_energy_news: {
    isLight: false,
    bg: "linear-gradient(165deg, #0a0f1d 0%, #111c36 55%, #091020 100%)",
    surface: "rgba(17, 25, 46, 0.9)",
    accent: "#22d3ee",
    accent2: "#818cf8",
  },
  zine_glitch: {
    isLight: true,
    bg: "linear-gradient(160deg, #F1EBE0 0%, #E3D9C8 100%)",
    surface: "rgba(10, 10, 11, 0.94)",
    accent: "#E23A2E",
    accent2: "#F5A623",
  },
};

const SceneSlide: React.FC<{
  scene: EditorialScene;
  sceneIndex: number;
  totalScenes: number;
  episode: EditorialEpisode;
}> = ({ scene, sceneIndex, totalScenes, episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / Math.max(1, fps);
  const gsapMotion = evaluateGsapSceneTimeline(localSec, scene.durationSec);

  const theme = ACCENT_MAP[episode.visualStyle] ?? ACCENT_MAP.dark_ai_cinematic;
  const isLight = theme.isLight;
  const textColor = isLight ? "#0f172a" : "#f8fafc";
  const mutedColor = isLight ? "#475569" : "#94a3b8";

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.9 },
  });

  const activeWordIdx =
    scene.wordTimings.length > 0 ? findActiveWordIndex(scene.wordTimings, localSec) : -1;
  const chunkStart = activeWordIdx >= 0 ? Math.floor(activeWordIdx / 4) * 4 : 0;
  const visibleWords = scene.wordTimings.slice(chunkStart, chunkStart + 4);

  const codeLines = (
    scene.codeSnippet ||
    `$ claude "audit architecture & build 9:16 pipeline"\n→ Planning ${scene.label.toLowerCase()}...\n✓ Verified modules & synced word cues`
  )
    .split("\n")
    .slice(0, 5);

  const agentNodes = ["Research", "Script", "Remotion+GSAP", "QC Guard"];

  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
        color: textColor,
        overflow: "hidden",
      }}
    >
      {/* Animated Ambient Radial Aura */}
      <div
        style={{
          position: "absolute",
          inset: -120,
          background: `radial-gradient(circle at ${50 + gsapMotion.parallaxX * 8}% ${
            28 + gsapMotion.parallaxY * 6
          }%, ${theme.accent}33, transparent 58%)`,
          pointerEvents: "none",
        }}
      />

      {/* TikTok 9:16 Safe Stage Container (leaves right UI buttons & top/bottom clear) */}
      <div
        style={{
          position: "absolute",
          top: 175,
          left: 64,
          right: 170,
          bottom: 350,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          transform: `scale(${gsapMotion.cameraZoom}) translate3d(${
            gsapMotion.parallaxX * 6
          }px, ${gsapMotion.parallaxY * 5}px, 0)`,
        }}
      >
        {/* Chapter Progress Bars */}
        <div style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: totalScenes }).map((_, i) => {
            const pct =
              i < sceneIndex
                ? 100
                : i === sceneIndex
                ? Math.min(100, Math.round((localSec / Math.max(1, scene.durationSec)) * 100))
                : 0;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 7,
                  borderRadius: 999,
                  background: isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.16)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: theme.accent,
                    borderRadius: 999,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Verified Source Label */}
        {episode.sourceLabel && (
          <div
            style={{
              fontSize: 20,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              color: mutedColor,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            SOURCE: {episode.sourceLabel}
          </div>
        )}

        {/* Scene Badge + Kinetic Headline */}
        <div
          style={{
            opacity: gsapMotion.headlineProgress,
            transform: `translateY(${gsapMotion.headlineOffsetY}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              background: `${theme.accent}22`,
              border: `1.5px solid ${theme.accent}66`,
              color: theme.accent,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <span>✦</span>
            <span>
              SCENE {scene.sceneNumber} · {scene.label}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 60,
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: "-0.025em",
            }}
          >
            {scene.onScreenText || episode.title}
          </h1>
        </div>

        {/* Main Interactive Tech Visual Surface (Terminal / Multi-Agent Graph) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 32,
            borderRadius: 28,
            background: theme.surface,
            border: `2px solid ${theme.accent}44`,
            boxShadow: `0 24px 60px rgba(0,0,0,0.45)`,
            opacity: gsapMotion.panelAlpha,
            transform: `scale(${interpolate(enterSpring, [0, 1], [0.92, 1])})`,
          }}
        >
          {/* Window Chrome */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ width: 14, height: 14, borderRadius: 99, background: "#ef4444" }} />
              <span style={{ width: 14, height: 14, borderRadius: 99, background: "#f59e0b" }} />
              <span style={{ width: 14, height: 14, borderRadius: 99, background: "#10b981" }} />
            </div>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 20,
                color: theme.accent,
                fontWeight: 700,
              }}
            >
              {scene.template.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          {/* Animated Terminal / Code Lines with Staggered Reveal */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 25,
              lineHeight: 1.45,
            }}
          >
            {codeLines.map((line, idx) => {
              const p = gsapMotion.staggerItems[Math.min(3, idx)];
              return (
                <div
                  key={idx}
                  style={{
                    opacity: p,
                    transform: `translateX(${(1 - p) * 26}px)`,
                    color: line.trim().startsWith("✓")
                      ? "#34d399"
                      : line.trim().startsWith("$")
                      ? theme.accent
                      : textColor,
                    fontWeight: line.trim().startsWith("$") ? 800 : 600,
                  }}
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Multi-Agent Node Flow Bar */}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            {agentNodes.map((node, i) => {
              const p = gsapMotion.staggerItems[i];
              const isHighlighted = i === sceneIndex % agentNodes.length;
              return (
                <div
                  key={node}
                  style={{
                    flex: 1,
                    padding: "14px 10px",
                    borderRadius: 16,
                    textAlign: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    opacity: p,
                    transform: `translateY(${(1 - p) * 18}px)`,
                    background: isHighlighted ? theme.accent : `${theme.accent}18`,
                    color: isHighlighted ? "#06101c" : textColor,
                    border: `1.5px solid ${theme.accent}55`,
                  }}
                >
                  {node}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 0ms-Sync Kinetic Subtitles Inside TikTok Safe Zone */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 170,
          bottom: 210,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {visibleWords.map((cue, idx) => {
          const globalIdx = chunkStart + idx;
          const isActive = globalIdx === activeWordIdx;
          const pillColor = cue.highlight ? theme.accent : theme.accent2;
          return (
            <span
              key={`${globalIdx}-${cue.word}`}
              style={{
                fontSize: 48,
                fontWeight: 900,
                padding: isActive ? "6px 18px" : "6px 6px",
                borderRadius: 16,
                background: isActive ? pillColor : "transparent",
                color: isActive ? "#06101c" : textColor,
                transform: isActive ? "scale(1.08)" : "scale(1)",
                textShadow: isActive ? "none" : "0 4px 16px rgba(0,0,0,0.8)",
                transition: "transform 80ms ease-out",
              }}
            >
              {cue.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const TikTokAiComposition: React.FC<TikTokAiCompositionProps> = ({ episode }) => {
  const { fps } = useVideoConfig();
  let offsetFrames = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060913" }}>
      {episode.scenes.map((scene, idx) => {
        const durationInFrames = Math.max(fps, Math.round(scene.durationSec * fps));
        const from = offsetFrames;
        offsetFrames += durationInFrames;
        return (
          <Sequence key={scene.sceneNumber} from={from} durationInFrames={durationInFrames}>
            <SceneSlide
              scene={scene}
              sceneIndex={idx}
              totalScenes={episode.scenes.length}
              episode={episode}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
