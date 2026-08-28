import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  SPRINGS,
  safePadX,
  CAROUSEL_SLIDES,
} from "./theme";

// Altari type stack — Instrument Serif italic for numerals, Manrope for body.
// Never monospace (locked brand rule).
loadSerif();
loadManrope();

// Alpha variants of the locked tokens. No hex is ever written outside theme.ts.
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ============================================================================
// RnP7StackedThirty — 1080x1080 @ 30fps  (1:1)
// VO [0:32]: "That's one carousel in minutes. I stacked thirty, and a whole
// month of content was done in a day."
//
// Idea: SCALE THROUGH REPETITION. One finished carousel (a real deck of
// Ahmed's slides) sits alone in frame; it multiplies outward in concentric
// staggered waves while the counter climbs 01 -> 30. The camera pulls
// back three times to keep up with the accumulation and lands on the whole
// month held in one frame.
//
// Skin: Ahmed's LOCKED Altari language — deep purple ground (#1A1A2E), an
// always-on grid overlay, purple-lit surfaces, Instrument Serif italic
// numerals. Palette/material only; every timing below is untouched.
//
// This is NOT a reveal (Part 1's move). Nothing is hidden and then shown —
// the grid does not exist yet at frame 0. It is built, card by card, out
// from a single origin, and the counter is the proof.
//
// Real assets only: every card is one of the 10 exported carousel slides
// (public/runable/carousel/01..10.png), rotated across the 30 decks.
// ============================================================================

export const DURATION_IN_FRAMES = 140;

const VIEW = 1080;

// --------------------------------------------------------------------------
// World grid — 6 x 5 = 30 carousels, each a 4:5 deck matching the real export
// --------------------------------------------------------------------------
const COLS = 6;
const ROWS = 5;
const CARD_W = 300;
const CARD_H = 375; // 4:5, same aspect as the 1080x1350 slide exports
const GAP_X = 40;
const GAP_Y = 44;
const STEP_X = CARD_W + GAP_X; // 340
const STEP_Y = CARD_H + GAP_Y; // 419
const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X; // 2000
const GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y; // 2051

const ORIGIN_C = 2;
const ORIGIN_R = 2; // true middle row -> symmetric radial growth
const ORIGIN_CX = ORIGIN_C * STEP_X + CARD_W / 2; // 830
const ORIGIN_CY = ORIGIN_R * STEP_Y + CARD_H / 2; // 1025.5

const TOTAL = COLS * ROWS; // 30

// --------------------------------------------------------------------------
// Wave schedule — concentric rings out from the origin deck.
// ring 0: 1 card (already on screen)  ring 1: 8   ring 2: 16   ring 3: 5
// --------------------------------------------------------------------------
const RING_BASE = [0, 26, 50, 98];
const RING_STEP = [0, 3, 3, 4];

type Cell = {
  key: string;
  c: number;
  r: number;
  ring: number;
  enter: number;
  slide: string;
};

const buildCells = (): Cell[] => {
  const raw: { c: number; r: number; ring: number; ang: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dc = c - ORIGIN_C;
      const dr = r - ORIGIN_R;
      const ring = Math.max(Math.abs(dc), Math.abs(dr));
      // angle measured from straight up, sweeping clockwise
      const ang = (Math.atan2(dc, -dr) + Math.PI * 2) % (Math.PI * 2);
      raw.push({ c, r, ring, ang });
    }
  }
  raw.sort((a, b) => a.ring - b.ring || a.ang - b.ang);

  const seen = [0, 0, 0, 0];
  return raw.map((x) => {
    const k = seen[x.ring]++;
    return {
      key: `${x.c}-${x.r}`,
      c: x.c,
      r: x.r,
      ring: x.ring,
      enter: RING_BASE[x.ring] + k * RING_STEP[x.ring],
      // Spread the 10 real slides so no cell ever repeats a direct or
      // diagonal neighbour (+3 across, +4 down -> never 0 mod 10).
      slide: CAROUSEL_SLIDES[(x.c * 3 + x.r * 4) % CAROUSEL_SLIDES.length],
    };
  });
};

const CELLS = buildCells();
const LAST_ENTER = CELLS.reduce((m, c) => Math.max(m, c.enter), 0); // 114

// --------------------------------------------------------------------------
// Camera — hold -> move -> hold -> move -> hold -> move -> settle.
// Moves are 20 / 22 / 22 frames; last two keys identical for a clean cut.
// Focal drifts from the origin deck to the grid centre as we widen.
// --------------------------------------------------------------------------
const ease = Easing.inOut(Easing.cubic);
const END_Z = 0.35;
// Wide framing: grid centred horizontally, nudged 35px down so the counter
// pill has clean air above it. Derived, not hardcoded to canvas edges.
const END_FX = GRID_W / 2; // 1000
const END_FY = GRID_H / 2 - 35 / END_Z; // 925.5
// Final extents: x 190 -> 890, y 216 -> 934. Clear of the 54px safe margin.

const KEY_T = [0, 20, 40, 60, 82, 96, 118, 132, 140];
const KEY_FX = [830, 830, 874, 874, 942, 942, END_FX, END_FX, END_FX];
const KEY_FY = [1009.5, 1009.5, 1000, 1000, 975, 975, END_FY, END_FY, END_FY];
const KEY_Z = [1.87, 1.87, 1.05, 1.05, 0.62, 0.62, END_Z, END_Z, END_Z];

// --------------------------------------------------------------------------
// Motion helpers
// --------------------------------------------------------------------------
const landAt = (frame: number, fps: number, enter: number, dur = 24) =>
  frame < enter
    ? 0
    : spring({
        frame: frame - enter,
        fps,
        config: SPRINGS.snappy,
        durationInFrames: dur,
      });

// --------------------------------------------------------------------------
// Altari grid overlay — always present. 64px on the backdrop, 24px on cards.
// --------------------------------------------------------------------------
const gridPaint = (size: number, a: number) => {
  const line = alpha(ALTARI.primaryLight, a);
  return {
    backgroundImage: `repeating-linear-gradient(0deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${size}px), repeating-linear-gradient(90deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${size}px)`,
    backgroundSize: `${size}px ${size}px`,
  } as const;
};

// --------------------------------------------------------------------------
// One carousel = a small deck of slides (front sheet is a real export)
// --------------------------------------------------------------------------
const Deck: React.FC<{
  slide: string;
  x: number;
  y: number;
  p: number; // landing progress
  fan: number; // deck fan-out (origin deck animates, the rest are pre-fanned)
  flash: number; // purple "just landed" glow ring
  dx: number; // entrance offset toward the origin deck
  dy: number;
}> = ({ slide, x, y, p, fan, flash, dx, dy }) => {
  if (p <= 0.001) return null;
  const s = 0.82 + 0.18 * p;
  // front-load the fade so a landing deck never lingers as a pale ghost
  const o = Math.min(1, Math.pow(p, 0.45) * 1.45);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        opacity: o,
        transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) scale(${s})`,
        transformOrigin: "center center",
      }}
    >
      {/* back sheets — the rest of the deck */}
      <div
        style={{
          position: "absolute",
          left: 20 * fan,
          top: 24 * fan,
          width: CARD_W,
          height: CARD_H,
          background: ALTARI.border,
          borderRadius: 16,
          border: `1px solid ${alpha(ALTARI.primaryLight, 0.22)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 10 * fan,
          top: 12 * fan,
          width: CARD_W,
          height: CARD_H,
          background: ALTARI.card,
          borderRadius: 16,
          border: `1px solid ${alpha(ALTARI.primaryLight, 0.16)}`,
        }}
      />
      {/* front sheet — real slide */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 16,
          overflow: "hidden",
          background: ALTARI.bg,
          border: `1px solid ${ALTARI.border}`,
          // soft ambient depth on a dark ground + a faint purple bloom
          boxShadow: `0 24px 50px rgba(0,0,0,0.50), 0 4px 14px rgba(0,0,0,0.34), 0 0 34px ${alpha(
            ALTARI.primary,
            0.16,
          )}`,
        }}
      >
        <Img
          src={staticFile(slide)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      {flash > 0.002 ? (
        <div
          style={{
            position: "absolute",
            left: -4,
            top: -4,
            width: CARD_W + 8,
            height: CARD_H + 8,
            borderRadius: 20,
            border: `3px solid ${ALTARI.primaryLight}`,
            boxShadow: `0 0 26px ${alpha(ALTARI.primary, 0.75)}, inset 0 0 18px ${alpha(
              ALTARI.primary,
              0.45,
            )}`,
            opacity: 0.72 * flash,
          }}
        />
      ) : null}
    </div>
  );
};

// --------------------------------------------------------------------------
// Composition
// --------------------------------------------------------------------------
export const RnP7StackedThirty: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const pad = safePadX(width); // 54 on 1080

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // the origin deck finishes fanning out in the opening hold
  const fan = spring({
    frame,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 20,
  });

  // counter — real data: how many decks exist right now
  let landed = 0;
  for (const cell of CELLS) if (cell.enter <= frame) landed++;
  const count = Math.max(1, landed);

  // payoff bump the moment the thirtieth lands
  const doneBump =
    frame >= LAST_ENTER && frame <= LAST_ENTER + 16
      ? Math.sin((Math.PI * (frame - LAST_ENTER)) / 16)
      : 0;
  const hudIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const railGlow =
    frame > 118 ? 0.9 + 0.1 * Math.sin((frame - 118) * 0.22) : 1;

  const railW = 236;

  return (
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* purple ground — opaque from frame 0 to the last frame */}
      <AbsoluteFill style={{ backgroundColor: ALTARI.bg }} />
      {/* Altari grid — always present, low contrast */}
      <AbsoluteFill style={gridPaint(ALTARI_GRID.backdrop, 0.055)} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, ${alpha(
            ALTARI.primary,
            0.3,
          )}, ${alpha(ALTARI.bg, 0)} 66%)`,
        }}
      />

      {/* camera */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {CELLS.map((cell) => {
          const x = cell.c * STEP_X;
          const y = cell.r * STEP_Y;
          const p = cell.ring === 0 ? 1 : landAt(frame, fps, cell.enter);
          if (p <= 0.001) return null;

          // entrance travels outward from the origin deck
          const vx = ORIGIN_CX - (x + CARD_W / 2);
          const vy = ORIGIN_CY - (y + CARD_H / 2);
          const len = Math.hypot(vx, vy) || 1;

          const flash =
            cell.ring === 0
              ? 0
              : Math.max(0, 1 - (frame - cell.enter) / 15);

          return (
            <Deck
              key={cell.key}
              slide={cell.slide}
              x={x}
              y={y}
              p={p}
              fan={cell.ring === 0 ? fan : 1}
              flash={flash}
              dx={(vx / len) * 56}
              dy={(vy / len) * 56}
            />
          );
        })}
      </div>

      {/* counter — the only on-screen copy, and it is data */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: 72,
          display: "flex",
          justifyContent: "center",
          opacity: hudIn,
          transform: `translateY(${(1 - hudIn) * -12}px)`,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            background: ALTARI.card,
            border: `1px solid ${ALTARI.border}`,
            borderRadius: 22,
            padding: "18px 40px 20px",
            overflow: "hidden",
            boxShadow: `0 18px 40px rgba(0,0,0,0.46), 0 0 40px ${alpha(
              ALTARI.primary,
              0.22,
            )}`,
            transform: `scale(${1 + 0.05 * doneBump})`,
            transformOrigin: "center center",
          }}
        >
          {/* 24px card grid — the Altari surface signature */}
          <AbsoluteFill style={gridPaint(ALTARI_GRID.card, 0.07)} />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              fontFamily: ALTARI_FONT.accent,
              fontStyle: "italic",
              fontVariantNumeric: "lining-nums tabular-nums",
              fontFeatureSettings: '"tnum" 1, "lnum" 1',
            }}
          >
            {/* fixed-width digit cells so the count never jitters as it climbs */}
            <span
              style={{
                display: "flex",
                fontSize: 66,
                lineHeight: 1,
                color: ALTARI.heading,
                textShadow: `0 0 26px ${alpha(ALTARI.primaryLight, 0.45)}`,
              }}
            >
              {String(count)
                .padStart(2, "0")
                .split("")
                .map((d, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      width: 36,
                      textAlign: "center",
                    }}
                  >
                    {d}
                  </span>
                ))}
            </span>
            <span
              style={{
                fontFamily: ALTARI_FONT.body,
                fontStyle: "normal",
                fontSize: 32,
                fontWeight: 500,
                lineHeight: 1,
                color: ALTARI.body,
                opacity: 0.55,
              }}
            >
              /
            </span>
            <span
              style={{
                fontSize: 40,
                lineHeight: 1,
                color: ALTARI.body,
              }}
            >
              {TOTAL}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              width: railW,
              height: 5,
              borderRadius: 3,
              background: alpha(ALTARI.primaryLight, 0.16),
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: (railW * count) / TOTAL,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${ALTARI.primary}, ${ALTARI.primaryLight})`,
                boxShadow: `0 0 16px ${alpha(ALTARI.primaryLight, 0.7)}`,
                opacity: railGlow,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
