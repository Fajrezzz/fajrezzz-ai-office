import gsap from "gsap";

/**
 * GSAP Timeline Choreography Engine (greensock/gsap-skills + gsap 3.15.1).
 *
 * Uses REAL `gsap.timeline({ paused: true })` scrubbed deterministically to `localSec`
 * so both React/Remotion previews and 60fps/120fps offline Canvas frame renders get
 * genuine GSAP easing curves (`power4.out`, `expo.inOut`, `back.out(1.6)`),
 * staggered item reveals, parallax offsets, and kinetic headline motion.
 */

export interface GsapSceneMotionState {
  /** 0..1 smooth headline reveal (power4.out) */
  headlineProgress: number;
  /** Y translation px (normalized to 1080px base width) */
  headlineOffsetY: number;
  /** 0..1 main panel / terminal / diagram entrance (back.out) */
  panelScale: number;
  panelAlpha: number;
  /** 4 staggered item progress values (0..1) */
  staggerItems: [number, number, number, number];
  /** Smooth parallax camera drift (-1..1) */
  parallaxX: number;
  parallaxY: number;
  /** 0..1 subtle dolly zoom */
  cameraZoom: number;
  /** 0..1 diagonal light sweep sheen across UI surfaces */
  lightSweep: number;
}

export function evaluateGsapSceneTimeline(
  localSec: number,
  sceneDurationSec: number
): GsapSceneMotionState {
  const dur = Math.max(2, sceneDurationSec);
  const t = Math.max(0, Math.min(dur, localSec));

  const state = {
    headlineProgress: 0,
    headlineOffsetY: 54,
    panelScale: 0.9,
    panelAlpha: 0,
    s0: 0,
    s1: 0,
    s2: 0,
    s3: 0,
    parallaxX: -1,
    parallaxY: 0.6,
    cameraZoom: 1,
    lightSweep: 0,
  };

  const tl = gsap.timeline({ paused: true });

  tl.to(
    state,
    {
      headlineProgress: 1,
      headlineOffsetY: 0,
      duration: 0.48,
      ease: "power4.out",
    },
    0.05
  )
    .to(
      state,
      {
        panelScale: 1,
        panelAlpha: 1,
        duration: 0.56,
        ease: "back.out(1.45)",
      },
      0.14
    )
    .to(state, { s0: 1, duration: 0.42, ease: "power3.out" }, 0.22)
    .to(state, { s1: 1, duration: 0.42, ease: "power3.out" }, 0.36)
    .to(state, { s2: 1, duration: 0.42, ease: "power3.out" }, 0.5)
    .to(state, { s3: 1, duration: 0.42, ease: "power3.out" }, 0.64)
    .to(
      state,
      {
        parallaxX: 1,
        parallaxY: -0.6,
        duration: dur,
        ease: "sine.inOut",
      },
      0
    )
    .to(
      state,
      {
        cameraZoom: 1.028,
        duration: dur * 0.55,
        ease: "power1.inOut",
      },
      0
    )
    .to(
      state,
      {
        cameraZoom: 1.006,
        duration: dur * 0.45,
        ease: "power1.inOut",
      },
      dur * 0.55
    )
    .to(
      state,
      {
        lightSweep: 1,
        duration: 1.25,
        ease: "expo.inOut",
      },
      Math.min(0.65, dur * 0.25)
    );

  // Deterministically scrub timeline to exact timestamp (zero wall-clock drift!)
  tl.time(t, true);
  tl.kill();

  return {
    headlineProgress: state.headlineProgress,
    headlineOffsetY: state.headlineOffsetY,
    panelScale: state.panelScale,
    panelAlpha: state.panelAlpha,
    staggerItems: [state.s0, state.s1, state.s2, state.s3],
    parallaxX: state.parallaxX,
    parallaxY: state.parallaxY,
    cameraZoom: state.cameraZoom,
    lightSweep: state.lightSweep,
  };
}
