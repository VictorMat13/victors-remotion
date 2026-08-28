// Fish Audio 5 — F5P11ElevenSeconds (1080x1920 @ 30fps, 165 frames)
// VO: "Three advisors, three different answers, eleven seconds. That's the
// part I couldn't get from a chatbot."
//
// The receipt beat. One continuous vertical world; the camera travels DOWN a
// time-spine while a stopwatch ticks fast at the top and three mini answer
// cards land staggered along the spine — portrait + accent edge + a static
// waveform silhouette (the waveform IS the answer; no text in cards). The
// stopwatch lands exactly on 11.0s (NUMBERS.answerSeconds), locks with a
// flare ring, then the camera pulls out to settle on all three answers +
// the locked timer. ONLY on-screen text = the timer numerals.
//
//   f0-14    hold: tight on the ticking stopwatch chip (0.0s ->, fast).
//   f14-30   move down/out; first card (operator, red) drops in at f24.
//   f30-46   hold: operator waveform draws in; timer keeps ticking.
//   f46-62   travel down to the editor zone.
//   f62-80   hold: editor card (cream, sparse silhouette) lands at f64.
//   f80-96   travel down to the longgame zone; card (purple) lands f90.
//   f96-118  hold: timer hits 11.0s at f106 — lock pop + amber flare rings.
//   f118-136 pull out to the full receipt: three distinct cards + timer.
//   f136-165 settle hold (final two camera keys identical).
//
// Compliance: portraits only, no advisor names, no narration-echo text.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ADVISORS, ALTARI, NUMBERS } from "./theme";
import { AltariBackdrop, PortraitOrb, type AdvisorKey } from "./board";

const { fontFamily: monoFamily } = loadMono("normal", { weights: ["500"] });

export const DURATION_IN_FRAMES = 165;

const VIEW_W = 1080;
const VIEW_H = 1920;

const ease = Easing.inOut(Easing.cubic);

// ---- World layout ----------------------------------------------------------
// Timer chip (world space, positioned by center)
const TIMER = { x: 540, y: 450, w: 310, h: 110 };
const LOCK_AT = 106; // frame the stopwatch lands exactly on 11.0s

// Time-spine the cards land on (drawn behind the cards)
const SPINE = { x: 540, y0: 512, y1: 1400 };

// Mini answer cards (world space, top-left). Kept inside 54px screen margins
// at every camera hold (checked against each hold's fy/z below).
const CARD_W = 440;
const CARD_H = 150;
type CardSpec = {
  advisor: AdvisorKey;
  left: number;
  top: number;
  land: number;
};
const CARDS: CardSpec[] = [
  { advisor: "operator", left: 230, top: 736, land: 24 },
  { advisor: "editor", left: 420, top: 1016, land: 64 },
  { advisor: "longgame", left: 240, top: 1272, land: 90 },
];

// ---- Waveform silhouettes (static — the shape IS the answer) ---------------
const WAVE_BARS = 26;
const WAVE_X0 = 150;
const WAVE_W = 264;
const WAVE_MAX_H = 64;

const waveAmp = (advisor: AdvisorKey, i: number): number => {
  if (advisor === "operator") {
    // Blunt numbers guy: two dense spiky bursts with a hard beat gap.
    const spike =
      (0.42 + 0.58 * Math.abs(Math.sin(i * 2.53 + 1.7))) *
      (0.55 + 0.45 * Math.abs(Math.sin(i * 7.13)));
    const gap = i >= 11 && i <= 14 ? 0.12 : 1;
    return Math.max(0.07, spike * gap);
  }
  if (advisor === "editor") {
    // Quiet cut-things-down guy: one short sparse cluster, the rest cut away.
    const g = Math.exp(-((i - 13) ** 2) / 14);
    return Math.max(
      0.055,
      0.62 * g * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.9 + 0.4))),
    );
  }
  // Long-game guy: smooth measured roll, lifting toward the end (a question).
  const roll = 0.5 + 0.5 * Math.sin(i * 0.48 - 1.3);
  return 0.16 + 0.55 * roll * (0.55 + 0.45 * (i / (WAVE_BARS - 1)));
};

// ---- Deco constellation specks (deterministic, background-only) ------------
type Speck = {
  x: number;
  y: number;
  r: number;
  o: number;
  ring: boolean;
  cream: boolean;
  ph: number;
};
const hash = (i: number, n: number) => {
  const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const SPECKS: Speck[] = Array.from({ length: 26 }, (_, i) => ({
  x: 96 + hash(i, 1) * 888,
  y: 200 + hash(i, 2) * 1360,
  r: 2 + hash(i, 3) * 3.4,
  o: 0.1 + hash(i, 4) * 0.26,
  ring: hash(i, 5) > 0.82,
  cream: hash(i, 7) > 0.5,
  ph: hash(i, 6) * Math.PI * 2,
}));

export const F5P11ElevenSeconds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Camera (one shared keyframe timeline; pure vertical descent) -------
  const KEY_T = [0, 14, 30, 46, 62, 80, 96, 118, 136, 150, DURATION_IN_FRAMES];
  const fx = 540;
  const fy = interpolate(
    frame,
    KEY_T,
    [470, 470, 640, 640, 800, 800, 908, 908, 900, 900, 900],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.9, 1.9, 1.5, 1.5, 1.32, 1.32, 1.16, 1.16, 1.02, 1.02, 1.02],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ---- Stopwatch -----------------------------------------------------------
  const secs = interpolate(frame, [0, LOCK_AT], [0, 11], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const locked = frame >= LOCK_AT;
  const readout = locked ? `${NUMBERS.answerSeconds}s` : `${secs.toFixed(1)}s`;
  const dotPulse = 0.5 + 0.5 * Math.sin(frame * 0.55);
  const lockPop = interpolate(
    frame,
    [LOCK_AT, LOCK_AT + 5, LOCK_AT + 18],
    [1, 1.09, 1],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const lockGlow = interpolate(frame, [LOCK_AT, LOCK_AT + 10], [0, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // One-shot flare rings at the lock (world space, behind the chip)
  const flare = (start: number, r0: number, r1: number, dur: number) => {
    const t = (frame - start) / dur;
    if (t <= 0 || t >= 1) return null;
    return {
      r: r0 + (r1 - r0) * Easing.out(Easing.cubic)(t),
      o: 0.85 * (1 - t),
    };
  };
  const flareA = flare(LOCK_AT, 72, 190, 26);
  const flareB = flare(LOCK_AT + 6, 60, 150, 24);

  // ---- Cards ---------------------------------------------------------------
  const cardIn = CARDS.map((c) =>
    spring({
      frame: frame - c.land,
      fps,
      config: { damping: 15, stiffness: 160 },
    }),
  );

  // One-shot ping ring as each card lands
  const ping = (start: number) => {
    const t = (frame - start) / 22;
    if (t <= 0 || t >= 1) return null;
    return { r: 34 + t * 62, o: 0.7 * (1 - t) };
  };

  // ---- Time-spine draw (leads slightly ahead of the descent) ---------------
  const spineLen = SPINE.y1 - SPINE.y0;
  const spineP = interpolate(frame, [16, 92], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Static full-frame backdrop — does NOT move with the camera */}
      <AltariBackdrop width={VIEW_W} height={VIEW_H} />

      {/* ---- Camera world ---- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: VIEW_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Specks + spine + pings + flares (under cards and chip) */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: VIEW_W,
            height: VIEW_H,
            overflow: "visible",
          }}
        >
          {SPECKS.map((s, i) => {
            const tw = 0.7 + 0.3 * Math.sin(frame * 0.06 + s.ph);
            const col = s.cream ? ALTARI.cream : ALTARI.primaryLight;
            return s.ring ? (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r + 4.5}
                fill="none"
                stroke={col}
                strokeWidth={1.2}
                opacity={s.o * tw * 0.8}
              />
            ) : (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill={col}
                opacity={s.o * tw}
              />
            );
          })}

          {/* time-spine */}
          <line
            x1={SPINE.x}
            y1={SPINE.y0}
            x2={SPINE.x}
            y2={SPINE.y1}
            stroke={ALTARI.primaryLight}
            strokeWidth={2}
            strokeDasharray={spineLen}
            strokeDashoffset={spineLen * (1 - spineP)}
            opacity={0.3}
          />

          {/* landing pings */}
          {CARDS.map((c, i) => {
            const p = ping(c.land + 2);
            if (!p) return null;
            return (
              <circle
                key={`ping-${i}`}
                cx={c.left + CARD_W / 2}
                cy={c.top + CARD_H / 2}
                r={p.r}
                fill="none"
                stroke={ADVISORS[c.advisor].accent}
                strokeWidth={2.4}
                opacity={p.o}
              />
            );
          })}

          {/* lock flare rings */}
          {flareA && (
            <circle
              cx={TIMER.x}
              cy={TIMER.y}
              r={flareA.r}
              fill="none"
              stroke={ALTARI.amber}
              strokeWidth={3}
              opacity={flareA.o}
            />
          )}
          {flareB && (
            <circle
              cx={TIMER.x}
              cy={TIMER.y}
              r={flareB.r}
              fill="none"
              stroke={ALTARI.amber}
              strokeWidth={2}
              opacity={flareB.o}
            />
          )}
        </svg>

        {/* Amber glow pooling behind the locked chip */}
        <div
          style={{
            position: "absolute",
            left: TIMER.x - 260,
            top: TIMER.y - 260,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(232,162,91,0.5) 0%, rgba(232,162,91,0) 62%)",
            opacity: lockGlow,
          }}
        />

        {/* ---- Mini answer cards ---- */}
        {CARDS.map((c, i) => {
          const s = cardIn[i];
          if (s < 0.01) return null;
          const a = ADVISORS[c.advisor];
          const edgeBreath = 0.85 + 0.15 * Math.sin(frame * 0.1 + i * 2.2);
          return (
            <div
              key={c.advisor}
              style={{
                position: "absolute",
                left: c.left,
                top: c.top,
                width: CARD_W,
                height: CARD_H,
                backgroundColor: ALTARI.card,
                border: `1px solid ${ALTARI.border}`,
                borderRadius: 18,
                boxShadow: `0 0 44px ${a.accentSoft}, 0 18px 44px rgba(10,10,24,0.5)`,
                opacity: Math.min(1, s * 1.6),
                transform: `translateY(${(1 - s) * -30}px) scale(${0.85 + 0.15 * s})`,
                transformOrigin: "50% 50%",
                overflow: "hidden",
              }}
            >
              {/* accent edge */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 6,
                  height: CARD_H,
                  backgroundColor: a.accent,
                  opacity: edgeBreath,
                }}
              />
              {/* portrait */}
              <PortraitOrb
                advisor={c.advisor}
                x={78}
                y={CARD_H / 2}
                size={92}
                enter={Math.min(1, s * 1.5)}
              />
              {/* static waveform silhouette — the answer itself */}
              {Array.from({ length: WAVE_BARS }, (_, bi) => {
                const amp = waveAmp(c.advisor, bi);
                const bh = Math.max(4, amp * WAVE_MAX_H);
                const barIn = interpolate(
                  frame,
                  [c.land + 6 + bi * 0.55, c.land + 11 + bi * 0.55],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                return (
                  <div
                    key={bi}
                    style={{
                      position: "absolute",
                      left: WAVE_X0 + (bi * WAVE_W) / WAVE_BARS,
                      top: CARD_H / 2 - bh / 2,
                      width: 5.6,
                      height: bh,
                      borderRadius: 3,
                      backgroundColor: a.accent,
                      opacity: barIn,
                      transform: `scaleY(${barIn})`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* ---- Stopwatch chip (the only on-screen text) ---- */}
        <div
          style={{
            position: "absolute",
            left: TIMER.x - TIMER.w / 2,
            top: TIMER.y - TIMER.h / 2,
            width: TIMER.w,
            height: TIMER.h,
            borderRadius: 999,
            backgroundColor: "rgba(20, 20, 42, 0.94)",
            border: `1px solid ${locked ? "rgba(232,162,91,0.7)" : ALTARI.border}`,
            boxShadow: locked
              ? "0 0 60px rgba(232,162,91,0.35), 0 18px 48px rgba(10,10,24,0.5)"
              : "0 18px 48px rgba(10,10,24,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            boxSizing: "border-box",
            transform: `scale(${lockPop})`,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              backgroundColor: locked ? ALTARI.green : ALTARI.amber,
              opacity: locked ? 1 : 0.5 + 0.5 * dotPulse,
              boxShadow: locked
                ? "0 0 14px rgba(78,205,155,0.8)"
                : `0 0 ${6 + dotPulse * 10}px rgba(232,162,91,0.7)`,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              width: 186,
              textAlign: "right",
              fontFamily: monoFamily,
              fontWeight: 500,
              fontSize: 56,
              letterSpacing: 1,
              color: locked ? ALTARI.cream : ALTARI.heading,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {readout}
          </div>
        </div>
      </div>

      {/* Vignette (screen space — matches the fish4 grade) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(140% 130% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,10,24,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
