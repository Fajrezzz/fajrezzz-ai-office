"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Trophy, X } from "lucide-react";
import { useSimulator, type MiniGameType } from "@/store/SimulatorContext";

/* ============================================================================
 * 1. REAL-TIME 2D PHYSICS BILLIARDS MINI-GAME (Touch + Mouse Drag-to-Shoot)
 * ========================================================================== */
interface PoolBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isCue?: boolean;
  pocketed?: boolean;
}

const POOL_W = 540;
const POOL_H = 290;
const RAIL = 22;
const BALL_R = 9.5;
const POCKETS: [number, number][] = [
  [RAIL + 3, RAIL + 3],
  [POOL_W / 2, RAIL - 1],
  [POOL_W - RAIL - 3, RAIL + 3],
  [RAIL + 3, POOL_H - RAIL - 3],
  [POOL_W / 2, POOL_H - RAIL + 1],
  [POOL_W - RAIL - 3, POOL_H - RAIL - 3],
];

function createPoolRack(): PoolBall[] {
  const colors = [
    "#facc15",
    "#2563eb",
    "#dc2626",
    "#9333ea",
    "#f97316",
    "#16a34a",
    "#be123c",
    "#0f172a",
    "#06b6d4",
  ];
  const balls: PoolBall[] = [
    { id: 0, x: 145, y: POOL_H / 2, vx: 0, vy: 0, color: "#f8fafc", isCue: true },
  ];
  const startX = 365;
  const startY = POOL_H / 2;
  let idx = 0;
  for (let col = 0; col < 4 && idx < colors.length; col++) {
    const rows = col + 1;
    for (let r = 0; r < rows && idx < colors.length; r++) {
      balls.push({
        id: idx + 1,
        x: startX + col * (BALL_R * 1.85),
        y: startY + (r - (rows - 1) / 2) * (BALL_R * 2.08),
        vx: 0,
        vy: 0,
        color: colors[idx],
      });
      idx++;
    }
  }
  return balls;
}

function BilliardsMiniGame({ onLog }: { onLog: (msg: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<PoolBall[]>(createPoolRack());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurRef = useRef<{ x: number; y: number } | null>(null);
  const [pocketedCount, setPocketedCount] = useState(0);
  const [shots, setShots] = useState(0);

  const resetRack = useCallback(() => {
    ballsRef.current = createPoolRack();
    setPocketedCount(0);
    setShots(0);
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const balls = ballsRef.current;
          // Physics substeps
          for (let sub = 0; sub < 2; sub++) {
            for (const b of balls) {
              if (b.pocketed) continue;
              b.x += b.vx * 0.5;
              b.y += b.vy * 0.5;
              b.vx *= 0.991;
              b.vy *= 0.991;
              if (Math.hypot(b.vx, b.vy) < 0.04) {
                b.vx = 0;
                b.vy = 0;
              }
              // Cushion bounce
              if (b.x < RAIL + BALL_R) {
                b.x = RAIL + BALL_R;
                b.vx = Math.abs(b.vx) * 0.85;
              } else if (b.x > POOL_W - RAIL - BALL_R) {
                b.x = POOL_W - RAIL - BALL_R;
                b.vx = -Math.abs(b.vx) * 0.85;
              }
              if (b.y < RAIL + BALL_R) {
                b.y = RAIL + BALL_R;
                b.vy = Math.abs(b.vy) * 0.85;
              } else if (b.y > POOL_H - RAIL - BALL_R) {
                b.y = POOL_H - RAIL - BALL_R;
                b.vy = -Math.abs(b.vy) * 0.85;
              }
              // Pocket check
              for (const [px, py] of POCKETS) {
                if (Math.hypot(b.x - px, b.y - py) < 15.5) {
                  if (b.isCue) {
                    b.x = 145;
                    b.y = POOL_H / 2;
                    b.vx = 0;
                    b.vy = 0;
                  } else {
                    b.pocketed = true;
                    b.vx = 0;
                    b.vy = 0;
                    const count = balls.filter((x) => !x.isCue && x.pocketed).length;
                    setPocketedCount(count);
                    if (count === 9) {
                      onLog("Menyapu bersih meja Biliar L3 (9/9 bola masuk)!");
                    }
                  }
                  break;
                }
              }
            }
            // Elastic ball-to-ball collisions
            for (let i = 0; i < balls.length; i++) {
              const a = balls[i];
              if (a.pocketed) continue;
              for (let j = i + 1; j < balls.length; j++) {
                const b = balls[j];
                if (b.pocketed) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0.001 && dist < BALL_R * 2) {
                  const nx = dx / dist;
                  const ny = dy / dist;
                  const overlap = (BALL_R * 2 - dist) * 0.52;
                  a.x -= nx * overlap;
                  a.y -= ny * overlap;
                  b.x += nx * overlap;
                  b.y += ny * overlap;
                  const dvx = a.vx - b.vx;
                  const dvy = a.vy - b.vy;
                  const dot = dvx * nx + dvy * ny;
                  if (dot > 0) {
                    const imp = dot * 0.94;
                    a.vx -= imp * nx;
                    a.vy -= imp * ny;
                    b.vx += imp * nx;
                    b.vy += imp * ny;
                  }
                }
              }
            }
          }

          // Render Felt Table
          ctx.fillStyle = "#4a2e19";
          ctx.fillRect(0, 0, POOL_W, POOL_H);
          ctx.fillStyle = "#14532d";
          ctx.fillRect(RAIL, RAIL, POOL_W - RAIL * 2, POOL_H - RAIL * 2);
          ctx.strokeStyle = "#22d3ee55";
          ctx.lineWidth = 2;
          ctx.strokeRect(RAIL, RAIL, POOL_W - RAIL * 2, POOL_H - RAIL * 2);

          // Pockets
          for (const [px, py] of POCKETS) {
            ctx.beginPath();
            ctx.arc(px, py, 14, 0, Math.PI * 2);
            ctx.fillStyle = "#020617";
            ctx.fill();
          }

          // Aim Guide & Power Cue
          const cue = balls[0];
          const isMoving = balls.some((b) => !b.pocketed && Math.hypot(b.vx, b.vy) > 0.12);
          if (!isMoving && dragStartRef.current && dragCurRef.current) {
            const dx = dragStartRef.current.x - dragCurRef.current.x;
            const dy = dragStartRef.current.y - dragCurRef.current.y;
            const power = Math.min(130, Math.hypot(dx, dy));
            if (power > 6) {
              const ang = Math.atan2(dy, dx);
              ctx.save();
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = "#38bdf8cc";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(cue.x, cue.y);
              ctx.lineTo(cue.x + Math.cos(ang) * 160, cue.y + Math.sin(ang) * 160);
              ctx.stroke();
              ctx.setLineDash([]);
              // Cue stick behind ball
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(cue.x - Math.cos(ang) * (14 + power * 0.35), cue.y - Math.sin(ang) * (14 + power * 0.35));
              ctx.lineTo(cue.x - Math.cos(ang) * (110 + power * 0.35), cue.y - Math.sin(ang) * (110 + power * 0.35));
              ctx.stroke();
              ctx.restore();
            }
          }

          // Balls
          for (const b of balls) {
            if (b.pocketed) continue;
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
            ctx.fillStyle = b.color;
            ctx.fill();
            ctx.strokeStyle = "#ffffff55";
            ctx.lineWidth = 1;
            ctx.stroke();
            // Highlight specular
            ctx.beginPath();
            ctx.arc(b.x - 3, b.y - 3, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffffaa";
            ctx.fill();
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onLog]);

  const toCanvasPt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * POOL_W,
      y: ((e.clientY - rect.top) / rect.height) * POOL_H,
    };
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300">
            Bola Masuk: {pocketedCount} / 9
          </span>
          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300">
            Sodokan: {shots}
          </span>
        </div>
        <button
          type="button"
          onClick={resetRack}
          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-cyan-200 hover:bg-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Susun Ulang
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={POOL_W}
        height={POOL_H}
        onPointerDown={(e) => {
          const isMoving = ballsRef.current.some(
            (b) => !b.pocketed && Math.hypot(b.vx, b.vy) > 0.12
          );
          if (isMoving) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const pt = toCanvasPt(e);
          dragStartRef.current = pt;
          dragCurRef.current = pt;
        }}
        onPointerMove={(e) => {
          if (!dragStartRef.current) return;
          dragCurRef.current = toCanvasPt(e);
        }}
        onPointerUp={() => {
          if (!dragStartRef.current || !dragCurRef.current) return;
          const dx = dragStartRef.current.x - dragCurRef.current.x;
          const dy = dragStartRef.current.y - dragCurRef.current.y;
          const dist = Math.min(130, Math.hypot(dx, dy));
          if (dist > 6) {
            const ang = Math.atan2(dy, dx);
            const speed = (dist / 130) * 14.5;
            ballsRef.current[0].vx = Math.cos(ang) * speed;
            ballsRef.current[0].vy = Math.sin(ang) * speed;
            setShots((s) => s + 1);
          }
          dragStartRef.current = null;
          dragCurRef.current = null;
        }}
        className="w-full touch-none rounded-xl border border-emerald-500/40 shadow-inner cursor-crosshair"
      />
      <p className="text-center text-[11px] text-slate-400">
        Tarik mundur di layar (mouse / sentuh HP) untuk membidik & atur kekuatan, lalu lepas untuk menyodok bola putih!
      </p>
    </div>
  );
}

/* ============================================================================
 * 2. F1 CYBER RACING SIMULATOR (Keyboard + Mobile Touch Controls)
 * ========================================================================== */
function RacingMiniGame({ onLog }: { onLog: (msg: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const steerRef = useRef(0);
  const stateRef = useRef({
    px: 210,
    speed: 5.5,
    score: 0,
    nitro: 0,
    roadOffset: 0,
    over: false,
    rivals: [] as { x: number; y: number; color: string; isNitro?: boolean }[],
  });
  const [hud, setHud] = useState({ score: 0, speedKmh: 165, best: 0, over: false });

  const restart = useCallback(() => {
    stateRef.current = {
      px: 210,
      speed: 5.5,
      score: 0,
      nitro: 0,
      roadOffset: 0,
      over: false,
      rivals: [],
    };
    setHud((h) => ({ ...h, score: 0, speedKmh: 165, over: false }));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") steerRef.current = -1;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") steerRef.current = 1;
    };
    const up = (e: KeyboardEvent) => {
      if (["arrowleft", "a", "arrowright", "d"].includes(e.key.toLowerCase())) {
        steerRef.current = 0;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const W = 420;
    const H = 300;
    const lanes = [105, 210, 315];

    const loop = () => {
      const s = stateRef.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        if (!s.over) {
          tick++;
          s.px = Math.max(76, Math.min(W - 76, s.px + steerRef.current * 6.2));
          s.speed = Math.min(11.5, s.speed + 0.0028);
          const curSpeed = s.speed + (s.nitro > 0 ? 3.5 : 0);
          if (s.nitro > 0) s.nitro--;
          s.roadOffset = (s.roadOffset + curSpeed * 1.4) % 40;
          s.score += Math.round(curSpeed * 0.45);

          if (tick % 32 === 0) {
            const laneX = lanes[Math.floor(Math.random() * lanes.length)];
            const isNitro = Math.random() < 0.24;
            s.rivals.push({
              x: laneX,
              y: -36,
              color: isNitro ? "#22d3ee" : Math.random() > 0.5 ? "#f43f5e" : "#a855f7",
              isNitro,
            });
          }

          for (const r of s.rivals) {
            r.y += curSpeed * (r.isNitro ? 0.95 : 0.78);
            if (Math.abs(r.x - s.px) < 28 && Math.abs(r.y - (H - 54)) < 38) {
              if (r.isNitro) {
                s.nitro = 85;
                s.score += 150;
                r.y = H + 99;
              } else {
                s.over = true;
                setHud((h) => {
                  const best = Math.max(h.best, s.score);
                  if (s.score >= 300) {
                    onLog(`Selesai balap F1 Cyber Sim dengan skor ${s.score}!`);
                  }
                  return { score: s.score, speedKmh: 0, best, over: true };
                });
              }
            }
          }
          s.rivals = s.rivals.filter((r) => r.y < H + 50);

          if (tick % 6 === 0) {
            setHud((h) => ({
              ...h,
              score: s.score,
              speedKmh: Math.round(curSpeed * 32),
              best: Math.max(h.best, s.score),
              over: false,
            }));
          }
        }

        // Draw Cyberpunk Highway
        ctx.fillStyle = "#090d1a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(58, 0, W - 116, H);
        // Neon Road Borders
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(54, 0, 4, H);
        ctx.fillStyle = "#e879f9";
        ctx.fillRect(W - 58, 0, 4, H);
        // Dashed Lane Dividers
        ctx.fillStyle = "#cbd5e166";
        for (let y = -40 + s.roadOffset; y < H; y += 40) {
          ctx.fillRect(158, y, 4, 22);
          ctx.fillRect(258, y, 4, 22);
        }

        // Rivals & Nitro Orbs
        for (const r of s.rivals) {
          if (r.isNitro) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = "#22d3ee";
            ctx.fill();
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 10px monospace";
            ctx.fillText("N2O", r.x - 10, r.y + 3);
          } else {
            ctx.fillStyle = r.color;
            ctx.fillRect(r.x - 16, r.y - 24, 32, 48);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(r.x - 11, r.y - 12, 22, 18);
          }
        }

        // Player Porsche 911 Lugano Blue
        ctx.fillStyle = s.nitro > 0 ? "#38bdf8" : "#0f62d6";
        ctx.fillRect(s.px - 17, H - 78, 34, 52);
        ctx.fillStyle = "#0b1322";
        ctx.fillRect(s.px - 12, H - 64, 24, 20);
        // Headlight glow
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(s.px - 14, H - 80, 7, 4);
        ctx.fillRect(s.px + 7, H - 80, 7, 4);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onLog]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 font-mono font-bold text-cyan-200">
            {hud.speedKmh} km/h
          </span>
          <span className="rounded-lg bg-fuchsia-500/20 px-2.5 py-1 font-mono font-bold text-fuchsia-200">
            Skor: {hud.score}
          </span>
          <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-mono font-bold text-amber-200">
            <Trophy className="mr-1 inline h-3 w-3" />
            {hud.best}
          </span>
        </div>
        <button
          type="button"
          onClick={restart}
          className="rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-cyan-200 hover:bg-slate-700"
        >
          Mulai Ulang
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={420}
          height={300}
          className="mx-auto w-full max-w-[460px] rounded-xl border border-cyan-500/40"
        />
        {hud.over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-950/75 backdrop-blur-xs">
            <div className="text-lg font-black text-rose-400">CRASH!</div>
            <div className="mb-3 text-xs text-slate-200">Skor Akhir: {hud.score}</div>
            <button
              type="button"
              onClick={restart}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950"
            >
              Balap Lagi
            </button>
          </div>
        )}
      </div>
      {/* Mobile-friendly touch steering buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onPointerDown={() => (steerRef.current = -1)}
          onPointerUp={() => (steerRef.current = 0)}
          onPointerLeave={() => (steerRef.current = 0)}
          className="rounded-xl border border-cyan-400/40 bg-slate-900 py-2.5 text-xs font-black text-cyan-200 active:bg-cyan-500/30"
        >
          ◀ BELOK KIRI (A)
        </button>
        <button
          type="button"
          onPointerDown={() => (steerRef.current = 1)}
          onPointerUp={() => (steerRef.current = 0)}
          onPointerLeave={() => (steerRef.current = 0)}
          className="rounded-xl border border-fuchsia-400/40 bg-slate-900 py-2.5 text-xs font-black text-fuchsia-200 active:bg-fuchsia-500/30"
        >
          BELOK KANAN (D) ▶
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. CYBER NEON ARCADE — PLASMA BRICK BREAKER (Pointer/Touch + Keyboard)
 * ========================================================================== */
function ArcadeMiniGame({ onLog }: { onLog: (msg: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const W = 460;
  const H = 290;

  const makeBricks = () => {
    const colors = ["#22d3ee", "#e879f9", "#a855f7", "#f59e0b"];
    const arr: { x: number; y: number; w: number; h: number; color: string; alive: boolean }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        arr.push({
          x: 18 + c * 54,
          y: 26 + r * 24,
          w: 48,
          h: 16,
          color: colors[r],
          alive: true,
        });
      }
    }
    return arr;
  };

  const gameRef = useRef({
    paddleX: W / 2 - 42,
    bx: W / 2,
    by: H - 48,
    vx: 3.4,
    vy: -3.6,
    score: 0,
    lives: 3,
    status: "play" as "play" | "win" | "over",
    bricks: makeBricks(),
  });
  const [info, setInfo] = useState({ score: 0, lives: 3, status: "play" });

  const reset = useCallback(() => {
    gameRef.current = {
      paddleX: W / 2 - 42,
      bx: W / 2,
      by: H - 48,
      vx: 3.4,
      vy: -3.6,
      score: 0,
      lives: 3,
      status: "play",
      bricks: makeBricks(),
    };
    setInfo({ score: 0, lives: 3, status: "play" });
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const g = gameRef.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        if (g.status === "play") {
          g.bx += g.vx;
          g.by += g.vy;
          if (g.bx < 8 || g.bx > W - 8) g.vx *= -1;
          if (g.by < 8) g.vy *= -1;

          // Paddle bounce
          if (g.by > H - 30 && g.by < H - 16 && g.bx >= g.paddleX - 6 && g.bx <= g.paddleX + 90) {
            const rel = (g.bx - (g.paddleX + 42)) / 42;
            g.vx = rel * 5.4;
            g.vy = -Math.abs(g.vy);
          }

          // Bricks collision
          for (const br of g.bricks) {
            if (!br.alive) continue;
            if (g.bx > br.x && g.bx < br.x + br.w && g.by > br.y && g.by < br.y + br.h) {
              br.alive = false;
              g.vy *= -1;
              g.score += 50;
              const remaining = g.bricks.filter((b) => b.alive).length;
              if (remaining === 0) {
                g.status = "win";
                onLog(`Menang Cyber Neon Arcade dengan skor ${g.score}!`);
              }
              setInfo({ score: g.score, lives: g.lives, status: g.status });
              break;
            }
          }

          // Miss bottom
          if (g.by > H + 10) {
            g.lives -= 1;
            if (g.lives <= 0) {
              g.status = "over";
            } else {
              g.bx = W / 2;
              g.by = H - 48;
              g.vx = 3.2;
              g.vy = -3.6;
            }
            setInfo({ score: g.score, lives: g.lives, status: g.status });
          }
        }

        ctx.fillStyle = "#060b18";
        ctx.fillRect(0, 0, W, H);
        for (const br of g.bricks) {
          if (!br.alive) continue;
          ctx.fillStyle = br.color;
          ctx.fillRect(br.x, br.y, br.w, br.h);
        }
        // Paddle
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(g.paddleX, H - 24, 84, 10);
        // Plasma Ball
        ctx.beginPath();
        ctx.arc(g.bx, g.by, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onLog]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <span className="rounded-lg bg-fuchsia-500/20 px-2.5 py-1 font-mono font-bold text-fuchsia-200">
            Skor: {info.score}
          </span>
          <span className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-bold text-rose-200">
            Nyawa: {"❤️".repeat(Math.max(0, info.lives))}
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-cyan-200"
        >
          Ulangi
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W - 42;
            gameRef.current.paddleX = Math.max(4, Math.min(W - 88, px));
          }}
          className="w-full touch-none rounded-xl border border-fuchsia-500/40"
        />
        {info.status !== "play" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-950/75">
            <div className="text-lg font-black text-cyan-300">
              {info.status === "win" ? "STAGE CLEAR! 🏆" : "GAME OVER"}
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-2 rounded-xl bg-fuchsia-400 px-4 py-2 text-xs font-black text-slate-950"
            >
              Main Lagi
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Geser jari / kursor di atas arena untuk memantulkan bola plasma dan hancurkan seluruh blok neon!
      </p>
    </div>
  );
}

/* ============================================================================
 * 4. EXECUTIVE CHESS VS AI (Legal Moves + AI Opponent + Capture Tracker)
 * ========================================================================== */
type Piece = string | null;
const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};
const PIECE_VAL: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 99 };

function initialChessBoard(): Piece[][] {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
  ];
}

function getLegalMoves(board: Piece[][], r: number, c: number): [number, number][] {
  const p = board[r][c];
  if (!p) return [];
  const side = p[0];
  const type = p[1];
  const moves: [number, number][] = [];
  const inB = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8;

  const slide = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (inB(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target[0] !== side) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  };

  if (type === "P") {
    const dir = side === "w" ? -1 : 1;
    const startRow = side === "w" ? 6 : 1;
    if (inB(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + dir * 2][c]) moves.push([r + dir * 2, c]);
    }
    for (const dc of [-1, 1]) {
      if (inB(r + dir, c + dc) && board[r + dir][c + dc]?.[0] === (side === "w" ? "b" : "w")) {
        moves.push([r + dir, c + dc]);
      }
    }
  } else if (type === "R") {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  } else if (type === "B") {
    slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (type === "Q") {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (type === "N") {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (inB(nr, nc) && board[nr][nc]?.[0] !== side) moves.push([nr, nc]);
    }
  } else if (type === "K") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inB(nr, nc) && board[nr][nc]?.[0] !== side) moves.push([nr, nc]);
      }
    }
  }
  return moves;
}

function ChessMiniGame({ onLog }: { onLog: (msg: string) => void }) {
  const [board, setBoard] = useState<Piece[][]>(initialChessBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("Giliran Bos (Putih)");

  const legal = selected ? getLegalMoves(board, selected[0], selected[1]) : [];

  const handleCell = (r: number, c: number) => {
    if (status.includes("Menang")) return;
    if (selected && legal.some(([lr, lc]) => lr === r && lc === c)) {
      const next = board.map((row) => [...row]);
      const captured = next[r][c];
      let moved = next[selected[0]][selected[1]]!;
      if (moved === "wP" && r === 0) moved = "wQ";
      next[r][c] = moved;
      next[selected[0]][selected[1]] = null;
      setSelected(null);

      if (captured === "bK") {
        setBoard(next);
        setStatus("Bos Menang Skakmat! 🏆");
        onLog("Memenangkan pertandingan Catur Eksekutif L3 melawan AI!");
        return;
      }

      // AI black response (prefers best capture, else center advance)
      const allBlack: { fr: number; fc: number; tr: number; tc: number; score: number }[] = [];
      for (let br = 0; br < 8; br++) {
        for (let bc = 0; bc < 8; bc++) {
          if (next[br][bc]?.[0] === "b") {
            for (const [tr, tc] of getLegalMoves(next, br, bc)) {
              const tgt = next[tr][tc];
              const val = tgt ? PIECE_VAL[tgt[1]] * 10 : (tr >= 3 && tr <= 4 && tc >= 2 && tc <= 5 ? 2 : 0) + Math.random();
              allBlack.push({ fr: br, fc: bc, tr, tc, score: val });
            }
          }
        }
      }
      if (allBlack.length > 0) {
        allBlack.sort((a, b) => b.score - a.score);
        const pick = allBlack[0];
        const aiCap = next[pick.tr][pick.tc];
        let aiPiece = next[pick.fr][pick.fc]!;
        if (aiPiece === "bP" && pick.tr === 7) aiPiece = "bQ";
        next[pick.tr][pick.tc] = aiPiece;
        next[pick.fr][pick.fc] = null;
        if (aiCap === "wK") {
          setBoard(next);
          setStatus("AI Menang! Coba tanding ulang.");
          return;
        }
      }
      setBoard(next);
      setStatus("Giliran Bos (Putih)");
      return;
    }

    if (board[r][c]?.[0] === "w") {
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-lg bg-violet-500/20 px-2.5 py-1 font-bold text-violet-200">
          {status}
        </span>
        <button
          type="button"
          onClick={() => {
            setBoard(initialChessBoard());
            setSelected(null);
            setStatus("Giliran Bos (Putih)");
          }}
          className="rounded-lg bg-slate-800 px-2.5 py-1 font-bold text-cyan-200"
        >
          Reset Papan
        </button>
      </div>
      <div className="mx-auto grid aspect-square w-full max-w-[320px] grid-cols-8 overflow-hidden rounded-xl border border-violet-400/40">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isLeg = legal.some(([lr, lc]) => lr === r && lc === c);
            const dark = (r + c) % 2 === 1;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleCell(r, c)}
                className={`relative flex items-center justify-center text-2xl leading-none select-none ${
                  isSel
                    ? "bg-cyan-400/70"
                    : dark
                      ? "bg-slate-700"
                      : "bg-slate-200"
                }`}
              >
                {piece && (
                  <span className={piece[0] === "w" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" : "text-slate-950"}>
                    {PIECE_UNICODE[piece]}
                  </span>
                )}
                {isLeg && (
                  <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-emerald-400/90 ring-2 ring-slate-950/50" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN PLAYABLE MINI-GAME MODAL WRAPPER
 * ========================================================================== */
export function MiniGameModal() {
  const { activeMiniGame, setActiveMiniGame, pushSimLog } = useSimulator();
  if (!activeMiniGame) return null;

  const tabs: { id: MiniGameType; label: string }[] = [
    { id: "billiards", label: "🎱 Biliar L3" },
    { id: "racing", label: "🏎️ F1 Racing" },
    { id: "arcade", label: "🕹️ Cyber Arcade" },
    { id: "chess", label: "♟️ Catur L3" },
  ];

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-400/40 bg-slate-950/95 p-4 text-slate-100 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveMiniGame(t.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  activeMiniGame === t.id
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveMiniGame(null)}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {activeMiniGame === "billiards" && (
          <BilliardsMiniGame onLog={(m) => pushSimLog("Bos Fajrez", m, "system")} />
        )}
        {activeMiniGame === "racing" && (
          <RacingMiniGame onLog={(m) => pushSimLog("Bos Fajrez", m, "system")} />
        )}
        {activeMiniGame === "arcade" && (
          <ArcadeMiniGame onLog={(m) => pushSimLog("Bos Fajrez", m, "system")} />
        )}
        {activeMiniGame === "chess" && (
          <ChessMiniGame onLog={(m) => pushSimLog("Bos Fajrez", m, "system")} />
        )}
      </div>
    </div>
  );
}
