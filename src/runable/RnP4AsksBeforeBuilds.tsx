import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRADIENT,
  ALTARI_GRID,
  FONT_SANS,
  RN,
  SPRINGS,
  UI,
  safePadX,
} from "./theme";

// ============================================================================
// RnP4AsksBeforeBuilds — 1080x1080 @ 30fps  (1:1)
// VO [0:20]: "And that's the part most tools skip. It asks before it builds,
//             so the first draft comes out right."
//
// CONTRAST BEAT, carried purely by the picture — two lanes through one world:
//   LANE A (top, desaturated)  request -> straight dashed run -> a draft that
//                              lands misaligned and gets tilted / faded off.
//   LANE B (bottom, warm)      request -> a GATE it has to pass: the five
//                              question dots, the real style-reference picker,
//                              and the real "Ready to approve this plan?" bar
//                              with Approve Plan. Cursor clicks, the gate turns
//                              green, and the approved reference itself flies
//                              out and lands as the first draft.
//
// Camera: hold on the wrong draft -> travel down to the gate -> long hold while
// the gate resolves -> pull out so both lanes read side by side -> end hold.
//
// SKIN: Ahmed / Altari purple world (ALTARI tokens, 64px backdrop grid, 24px
// card grid, lavender body text, ambient primary glow instead of warm shadow).
// The two genuine Runable surfaces — the style-reference picker (Shuffle /
// Pick for me) and the approve bar (Ready to approve this plan? / Approve Plan
// / Close) — stay AUTHENTIC Runable cream/white + IDGrotesk and float as real
// light product panels on the purple ground.
// ============================================================================

export const DURATION_IN_FRAMES = 170;

/* --------------------------------------------------------------- helpers -- */

const ease = Easing.inOut(Easing.cubic);
const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easedOpt = { easing: ease, ...clampOpt };

type Pt = { x: number; y: number };

const qBezier = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

/** Altari grid overlay — 64px on backdrops, 24px on cards. Always present. */
const gridLayers = (size: number, line: string) =>
  `repeating-linear-gradient(0deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${size}px),` +
  `repeating-linear-gradient(90deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${size}px)`;

const BACKDROP_GRID = gridLayers(ALTARI_GRID.backdrop, "rgba(165,167,217,0.058)");
const CARD_GRID_LIGHT = gridLayers(ALTARI_GRID.card, "rgba(255,255,255,0.045)");
const CARD_GRID_DARK = gridLayers(ALTARI_GRID.card, "rgba(26,26,46,0.05)");

/* ----------------------------------------------------------------- world -- */

const WORLD_W = 1640;
const WORLD_H = 1300;

const LANE_A_Y = 300; // "guess" lane centre
const LANE_B_Y = 884; // Runable lane centre

const PROMPT = { x: 140, w: 180, h: 80 };
const PROMPT_A_Y = LANE_A_Y - PROMPT.h / 2; // 260
const PROMPT_B_Y = LANE_B_Y - PROMPT.h / 2; // 844

const SLIDE_W = 260;
const SLIDE_H = 340;

const OUT = { x: 1220, w: SLIDE_W, h: SLIDE_H };
const OUT_A_Y = LANE_A_Y - SLIDE_H / 2; // 130
const OUT_B_Y = LANE_B_Y - SLIDE_H / 2; // 714

// lane A run: straight through, nothing in the way
const RUN_A = { x0: PROMPT.x + PROMPT.w + 8, x1: OUT.x - 8, y: LANE_A_Y };
// lane B stub into the gate
const GATE_X = 420;
const RUN_B = { x0: PROMPT.x + PROMPT.w + 8, x1: 460, y: LANE_B_Y };

const DOTS = { cx: 800, y: 612, r: 7, gap: 22 };

const PICK = { x: 460, y: 660, w: 640, h: 360 };
const THUMB_W = 180;
const THUMB_H = 235;
const THUMB_GAP = 18;
const THUMB_X0 = 492;
const THUMB_Y = 688;
const THUMB_SCALE = THUMB_W / SLIDE_W; // 0.6923
const PICK_ROW_Y = 945;

const BAR = { x: GATE_X, y: 1050, w: 760, h: 112 };

const CONTENT_X0 = PROMPT.x; // 140
const CONTENT_X1 = OUT.x + OUT.w; // 1480
const CONTENT_Y0 = OUT_A_Y; // 130
const CONTENT_Y1 = BAR.y + BAR.h; // 1162

const SEL = 1; // the reference the plan settles on

const THUMB_CX = THUMB_X0 + SEL * (THUMB_W + THUMB_GAP) + THUMB_W / 2; // 780
const THUMB_CY = THUMB_Y + THUMB_H / 2; // 805.5
const OUT_B_CX = OUT.x + SLIDE_W / 2; // 1350
const OUT_B_CY = OUT_B_Y + SLIDE_H / 2; // 884
const FLY_CTRL: Pt = { x: 1060, y: 540 };

/* --------------------------------------------------------------- camera --- */

const KEY_T = [0, 32, 48, 128, 148, 162, 169];
const KEY_FX = [1170, 1170, 800, 800, 810, 810, 810];
const KEY_FY = [
  LANE_A_Y,
  LANE_A_Y,
  LANE_B_Y,
  LANE_B_Y,
  (CONTENT_Y0 + CONTENT_Y1) / 2,
  (CONTENT_Y0 + CONTENT_Y1) / 2,
  (CONTENT_Y0 + CONTENT_Y1) / 2,
];

/* ---------------------------------------------------------------- atoms --- */

// Dark ground: depth comes from a deep shadow plus an ambient primary bloom,
// never a warm drop shadow.
const CARD_SHADOW =
  "0 2px 6px rgba(0,0,0,0.34), 0 18px 46px rgba(0,0,0,0.42), 0 0 54px rgba(91,94,194,0.16)";
// Authentic Runable panels floating ON the purple world.
const PANEL_SHADOW =
  "0 3px 10px rgba(0,0,0,0.38), 0 26px 70px rgba(0,0,0,0.48), 0 0 70px rgba(91,94,194,0.20)";

type SlideStyle = {
  bg: string;
  ink: string;
  inkSoft: string;
  accent: string;
  grid: string;
};

// Three style references, all inside Ahmed's locked purple palette.
const SLIDE_STYLES: SlideStyle[] = [
  {
    bg: ALTARI.terminal,
    ink: ALTARI.heading,
    inkSoft: "rgba(165,167,217,0.30)",
    accent: ALTARI.primaryLight,
    grid: CARD_GRID_LIGHT,
  },
  {
    bg: ALTARI_GRADIENT.cta,
    ink: ALTARI.heading,
    inkSoft: "rgba(255,255,255,0.26)",
    accent: ALTARI.primaryLight,
    grid: gridLayers(ALTARI_GRID.card, "rgba(255,255,255,0.06)"),
  },
  {
    bg: "rgba(255,255,255,0.93)",
    ink: ALTARI.bg,
    inkSoft: "rgba(26,26,46,0.20)",
    accent: ALTARI.primary,
    grid: CARD_GRID_DARK,
  },
];

/** A carousel slide, always authored at SLIDE_W x SLIDE_H and scaled. */
const SlideCard: React.FC<{ v: number }> = ({ v }) => {
  const s = SLIDE_STYLES[v];
  return (
    <div
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        background: s.bg,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 24x24 card grid — always present */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: s.grid,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 30,
          width: 58,
          height: 9,
          borderRadius: 5,
          backgroundColor: s.accent,
        }}
      />
      {[
        { y: 66, w: 198 },
        { y: 106, w: 162 },
        { y: 146, w: 122 },
      ].map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 26,
            top: l.y,
            width: l.w,
            height: 26,
            borderRadius: 6,
            backgroundColor: s.ink,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 200,
          width: 90,
          height: 7,
          borderRadius: 4,
          backgroundColor: s.accent,
        }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 26,
            top: 240 + i * 18,
            width: i === 2 ? 110 : 168,
            height: 8,
            borderRadius: 4,
            backgroundColor: s.inkSoft,
          }}
        />
      ))}
      {/* page progress bar (the real plan ships one) */}
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 300,
          width: 208,
          height: 7,
          borderRadius: 4,
          backgroundColor: s.inkSoft,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 300,
          width: 74,
          height: 7,
          borderRadius: 4,
          backgroundColor: s.accent,
        }}
      />
    </div>
  );
};

/** The lane-A output: same footprint, content that never lined up. */
const WrongDraft: React.FC = () => (
  <div
    style={{
      width: SLIDE_W,
      height: SLIDE_H,
      backgroundColor: "rgba(44,44,74,0.72)",
      borderRadius: 18,
      border: "1.5px solid rgba(165,167,217,0.13)",
      overflow: "hidden",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: gridLayers(ALTARI_GRID.card, "rgba(255,255,255,0.028)"),
      }}
    />
    {/* headline that runs off the edge */}
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 42,
        width: 310,
        height: 30,
        borderRadius: 6,
        backgroundColor: "rgba(165,167,217,0.20)",
      }}
    />
    {/* block hanging off the left */}
    <div
      style={{
        position: "absolute",
        left: -40,
        top: 100,
        width: 238,
        height: 122,
        borderRadius: 10,
        backgroundColor: "rgba(165,167,217,0.15)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 244,
        width: 176,
        height: 20,
        borderRadius: 5,
        backgroundColor: "rgba(165,167,217,0.13)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 278,
        width: 98,
        height: 20,
        borderRadius: 5,
        backgroundColor: "rgba(165,167,217,0.11)",
      }}
    />
    {/* stray fragment clipped by the bottom edge */}
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 316,
        width: 130,
        height: 44,
        borderRadius: 8,
        backgroundColor: "rgba(165,167,217,0.12)",
      }}
    />
  </div>
);

const PromptCard: React.FC<{ x: number; y: number; dim: number }> = ({
  x,
  y,
  dim,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: PROMPT.w,
      height: PROMPT.h,
      backgroundColor: ALTARI.card,
      border: `1.5px solid ${
        dim > 0.5 ? "rgba(61,61,96,0.60)" : ALTARI.border
      }`,
      borderRadius: 20,
      backgroundImage: gridLayers(
        ALTARI_GRID.card,
        dim > 0.5 ? "rgba(255,255,255,0.022)" : "rgba(255,255,255,0.04)",
      ),
      boxShadow:
        dim > 0.5
          ? "0 2px 6px rgba(0,0,0,0.28)"
          : CARD_SHADOW,
      opacity: 1 - 0.42 * dim,
    }}
  >
    {[
      { y: 24, w: 116 },
      { y: 48, w: 74 },
    ].map((l, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 24,
          top: l.y,
          width: l.w,
          height: 11,
          borderRadius: 6,
          backgroundColor:
            dim > 0.5 ? "rgba(165,167,217,0.20)" : "rgba(165,167,217,0.40)",
        }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        right: 20,
        top: PROMPT.h / 2 - 9,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor:
          dim > 0.5 ? "rgba(165,167,217,0.18)" : ALTARI.primaryLight,
        boxShadow: dim > 0.5 ? "none" : "0 0 16px rgba(123,125,214,0.55)",
      }}
    />
  </div>
);

const BadgeCheck: React.FC<{ p: number; size?: number }> = ({
  p,
  size = 48,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: ALTARI.stampGreen,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 6px 22px rgba(16,185,129,0.45)",
      transform: `scale(${p})`,
    }}
  >
    <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 24 24">
      <path
        d="M4 12.5 L9.5 18 L20 6.5"
        stroke="#FFFFFF"
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/** Discard mark on the blind-generated draft — muted, never an alarm. */
const BadgeCross: React.FC<{ p: number; size?: number }> = ({
  p,
  size = 44,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: "rgba(255,107,138,0.16)",
      border: "1.5px solid rgba(255,107,138,0.42)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${p})`,
    }}
  >
    <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24">
      <path
        d="M5 5 L19 19 M19 5 L5 19"
        stroke={ALTARI.stampRed}
        strokeWidth={3.4}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  </div>
);

const Cursor: React.FC<{ x: number; y: number; opacity: number }> = ({
  x,
  y,
  opacity,
}) => (
  <svg
    width={38}
    height={48}
    viewBox="0 0 24 32"
    style={{ position: "absolute", left: x, top: y, opacity }}
  >
    <path
      d="M3 2 L3 25 L9.2 19.4 L13.2 28.6 L17.4 26.6 L13.4 17.8 L21 17 Z"
      fill="#FFFFFF"
      stroke={ALTARI.bg}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

/* ----------------------------------------------------------- composition -- */

export const RnP4AsksBeforeBuilds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const SAFE = safePadX(width); // 54 on 1080 — hard rule
  const usable = width - SAFE * 2;
  const zGate = (usable / BAR.w) * 0.97;
  const zEnd = (usable / (CONTENT_X1 - CONTENT_X0)) * 0.94;
  const KEY_Z = [1.42, 1.42, zGate, zGate, zEnd, zEnd, zEnd];

  const fx = interpolate(frame, KEY_T, KEY_FX, easedOpt);
  const fy = interpolate(frame, KEY_T, KEY_FY, easedOpt);
  const z = interpolate(frame, KEY_T, KEY_Z, easedOpt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 32,
  ) => (frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur }));

  /* ---- lane A: the guessed draft (frames 0–30) ---- */
  const packets = [0, 1, 2].map((i) => {
    const p = interpolate(frame, [0, 8 + i * 2], [0.56 - i * 0.22, 1.05], easedOpt);
    return {
      x: RUN_A.x0 + (RUN_A.x1 - RUN_A.x0) * Math.min(1, p),
      o: interpolate(p, [0.92, 1], [1, 0], clampOpt) * (p > 0 ? 1 : 0),
      s: 1 - i * 0.16,
    };
  });

  const slotAOp = interpolate(frame, [0, 9, 15], [1, 1, 0], clampOpt);

  const wrongIn = spr(9, SPRINGS.snappy, 26);
  const wrongOp = interpolate(frame, [9, 17], [0, 1], easedOpt);
  const wrongRot = interpolate(frame, [19, 30], [0, -7], easedOpt);
  const wrongDrop = interpolate(frame, [19, 31], [0, 36], easedOpt);
  const wrongFade = interpolate(frame, [20, 31], [1, 0.52], easedOpt);
  const crossP = spr(22, SPRINGS.bouncy, 26);

  /* ---- lane B: the gate (frames 34–128) ---- */
  const promptBIn = spr(34, SPRINGS.snappy, 28);
  const runBP = interpolate(frame, [38, 48], [0, 1], easedOpt);

  const dotP = [0, 1, 2, 3, 4].map((i) => spr(38 + i * 4, SPRINGS.bouncy, 22));
  const dotsOp = interpolate(frame, [32, 40], [0, 1], clampOpt);

  const pickIn = spr(40, SPRINGS.smooth, 30);
  const pickOp = interpolate(frame, [40, 52], [0, 1], easedOpt);
  const thumbIn = [spr(46), spr(52), spr(58)];
  const rowOp = interpolate(frame, [56, 66], [0, 1], easedOpt);
  const ringP = spr(72, SPRINGS.bouncy, 30);
  const ringBreathe = 1 + 0.018 * Math.sin((frame - 72) / 9);

  const barIn = spr(66, SPRINGS.smooth, 32);
  const barOp = interpolate(frame, [66, 78], [0, 1], easedOpt);

  /* ---- the click ---- */
  const btnW = 214;
  const btnH = 58;
  const btnX = BAR.x + BAR.w - 24 - btnW;
  const btnY = BAR.y + (BAR.h - btnH) / 2;
  const btnCx = btnX + btnW / 2;
  const btnCy = btnY + btnH / 2;

  const cursorOp =
    interpolate(frame, [78, 84], [0, 1], easedOpt) *
    interpolate(frame, [126, 138], [1, 0], easedOpt);
  const cursorP = interpolate(frame, [82, 98], [0, 1], easedOpt);
  const cursorFrom: Pt = { x: BAR.x + 180, y: BAR.y + 150 };
  const cursorIdle = frame > 98 ? 3 * Math.sin((frame - 98) / 10) : 0;
  const cursorX = cursorFrom.x + (btnCx - 6 - cursorFrom.x) * cursorP;
  const cursorY = cursorFrom.y + (btnCy - 2 - cursorFrom.y) * cursorP + cursorIdle;

  const pressP = interpolate(frame, [98, 102, 108], [0, 1, 0], clampOpt);
  const rippleP = interpolate(frame, [100, 122], [0, 1], easedOpt);
  const approved = interpolate(frame, [101, 114], [0, 1], easedOpt);
  const approvedGlow =
    approved * (0.72 + 0.28 * Math.sin((frame - 114) / 11));

  /* ---- the approved reference becomes the first draft ---- */
  const flyP = interpolate(frame, [134, 154], [0, 1], easedOpt);
  const flyLive = frame >= 134;
  const flyPos = qBezier(
    { x: THUMB_CX, y: THUMB_CY },
    FLY_CTRL,
    { x: OUT_B_CX, y: OUT_B_CY },
    flyP,
  );
  const landSettle = spr(154, SPRINGS.bouncy, 26);
  const flyScale =
    THUMB_SCALE +
    (1 - THUMB_SCALE) * flyP +
    0.035 * Math.sin(Math.min(1, landSettle) * Math.PI);
  const flyRot = -5 * Math.sin(flyP * Math.PI);
  const landBadge = spr(158, SPRINGS.bouncy, 24);
  const landGlow =
    interpolate(frame, [154, 164], [0, 1], easedOpt) *
    (0.7 + 0.3 * Math.sin((frame - 156) / 10));

  return (
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* opaque purple ground, full-bleed, frame 0 → last */}
      <AbsoluteFill style={{ backgroundColor: ALTARI.bg }} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(91,94,194,0.11) 0%, rgba(61,44,141,0.15) 100%)",
        }}
      />
      {/* 64x64 backdrop grid — always present, low contrast */}
      <AbsoluteFill style={{ backgroundImage: BACKDROP_GRID }} />
      {/* ambient primary bloom on the action */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 62%, rgba(123,125,214,0.20) 0%, rgba(91,94,194,0.07) 42%, rgba(91,94,194,0) 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ================= LANE A — no gate, wrong draft ================= */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <line
            x1={RUN_A.x0}
            y1={RUN_A.y}
            x2={RUN_A.x1}
            y2={RUN_A.y}
            stroke="rgba(165,167,217,0.18)"
            strokeWidth={3}
            strokeDasharray="9 13"
            strokeLinecap="round"
          />
          <line
            x1={RUN_B.x0}
            y1={RUN_B.y}
            x2={RUN_B.x0 + (RUN_B.x1 - RUN_B.x0) * runBP}
            y2={RUN_B.y}
            stroke="rgba(123,125,214,0.62)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </svg>

        <PromptCard x={PROMPT.x} y={PROMPT_A_Y} dim={1} />

        {/* the request is already in flight at frame 0 */}
        {packets.map((pk, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pk.x - 13 * pk.s,
              top: RUN_A.y - 13 * pk.s,
              width: 26 * pk.s,
              height: 26 * pk.s,
              borderRadius: 8 * pk.s,
              backgroundColor: "rgba(165,167,217,0.42)",
              opacity: pk.o * (0.5 + 0.5 * pk.s),
            }}
          />
        ))}

        {/* the slot the answer will drop into, mid-generation */}
        <div
          style={{
            position: "absolute",
            left: OUT.x,
            top: OUT_A_Y,
            width: SLIDE_W,
            height: SLIDE_H,
            borderRadius: 18,
            border: "2px dashed rgba(165,167,217,0.16)",
            backgroundColor: "rgba(255,255,255,0.02)",
            opacity: slotAOp,
            overflow: "hidden",
          }}
        >
          {[
            { y: 42, w: 200 },
            { y: 96, w: 152 },
            { y: 150, w: 176 },
            { y: 204, w: 118 },
          ].map((l, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 26,
                top: l.y,
                width: l.w,
                height: 22,
                borderRadius: 6,
                backgroundColor: "rgba(165,167,217,0.10)",
                opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.2 - i * 0.8)),
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: OUT.x,
            top: OUT_A_Y,
            width: SLIDE_W,
            height: SLIDE_H,
            opacity: wrongOp * wrongFade,
            transform: `translateY(${wrongDrop}px) rotate(${wrongRot}deg) scale(${
              0.9 + 0.1 * wrongIn
            })`,
            transformOrigin: "50% 78%",
            boxShadow: "0 2px 6px rgba(0,0,0,0.30), 0 16px 40px rgba(0,0,0,0.38)",
            borderRadius: 18,
          }}
        >
          <WrongDraft />
          <div style={{ position: "absolute", right: -16, top: -16 }}>
            <BadgeCross p={crossP} />
          </div>
        </div>

        {/* ================= LANE B — the gate ================= */}
        <div style={{ opacity: promptBIn }}>
          <PromptCard x={PROMPT.x} y={PROMPT_B_Y} dim={0} />
        </div>

        {/* the five questions, as the product's own step dots */}
        {[0, 1, 2, 3, 4].map((i) => {
          const total = 5 * (DOTS.r * 2) + 4 * DOTS.gap;
          const cx = DOTS.cx - total / 2 + DOTS.r + i * (DOTS.r * 2 + DOTS.gap);
          const p = dotP[i];
          const lit = p > 0.04;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx - DOTS.r,
                top: DOTS.y - DOTS.r,
                width: DOTS.r * 2,
                height: DOTS.r * 2,
                borderRadius: DOTS.r,
                backgroundColor: lit
                  ? ALTARI.primaryLight
                  : "rgba(165,167,217,0.16)",
                boxShadow: lit ? "0 0 14px rgba(123,125,214,0.60)" : "none",
                opacity: dotsOp,
                transform: `scale(${1 + 0.45 * Math.sin(Math.min(1, p) * Math.PI)})`,
              }}
            />
          );
        })}

        {/* ---------------------------------------------------------------
            style-reference picker — GENUINE RUNABLE UI.
            Stays authentic Runable cream/white + IDGrotesk, floating on the
            purple ground. Do not repaint it purple.
            --------------------------------------------------------------- */}
        <div
          style={{
            position: "absolute",
            left: PICK.x,
            top: PICK.y,
            width: PICK.w,
            height: PICK.h,
            backgroundColor: RN.panel,
            borderRadius: 26,
            border: `1.5px solid ${RN.border}`,
            boxShadow: PANEL_SHADOW,
            opacity: pickOp,
            transform: `scale(${0.94 + 0.06 * pickIn}) translateY(${18 * (1 - pickIn)}px)`,
            transformOrigin: "50% 30%",
          }}
        />

        {[0, 1, 2].map((i) => {
          const tx = THUMB_X0 + i * (THUMB_W + THUMB_GAP);
          const p = thumbIn[i];
          if (p <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: tx,
                top: THUMB_Y,
                width: THUMB_W,
                height: THUMB_H,
                opacity: Math.min(1, p * 1.6),
                transform: `scale(${0.88 + 0.12 * p})`,
                transformOrigin: "50% 50%",
              }}
            >
              <div
                style={{
                  width: SLIDE_W,
                  height: SLIDE_H,
                  transform: `scale(${THUMB_SCALE})`,
                  transformOrigin: "0 0",
                  borderRadius: 18,
                  boxShadow: "0 4px 14px rgba(26,26,46,0.22)",
                }}
              >
                <SlideCard v={i} />
              </div>
            </div>
          );
        })}

        {/* selection ring on the reference the plan settles on */}
        {ringP > 0 ? (
          <div
            style={{
              position: "absolute",
              left: THUMB_X0 + SEL * (THUMB_W + THUMB_GAP) - 8,
              top: THUMB_Y - 8,
              width: THUMB_W + 16,
              height: THUMB_H + 16,
              borderRadius: 22,
              border: `3.5px solid ${RN.amber}`,
              opacity: Math.min(1, ringP * 1.5),
              transform: `scale(${(0.94 + 0.06 * ringP) * ringBreathe})`,
              boxShadow: `0 0 ${16 + 10 * ringBreathe}px ${RN.amberSoft}`,
            }}
          />
        ) : null}

        {/* picker footer row — real controls, real strings */}
        <div
          style={{
            position: "absolute",
            left: PICK.x + 32,
            top: PICK_ROW_Y,
            width: PICK.w - 64,
            height: 50,
            display: "flex",
            alignItems: "center",
            fontFamily: FONT_SANS,
            opacity: rowOp,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24">
            <path
              d="M3 8 h10 a5 5 0 0 1 5 5 v3 M18 5 l3 3 -3 3"
              stroke={RN.muted}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              marginLeft: 12,
              fontSize: 24,
              color: RN.muted,
              whiteSpace: "nowrap",
            }}
          >
            Shuffle
          </span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              backgroundColor: RN.card,
              border: `1.5px solid ${RN.borderStrong}`,
              borderRadius: 14,
              padding: "9px 22px",
              fontSize: 23,
              color: RN.text,
              whiteSpace: "nowrap",
            }}
          >
            Pick for me
          </div>
        </div>

        {/* ---------------------------------------------------------------
            the approval gate — GENUINE RUNABLE UI.
            Authentic cream bar + real black Approve Plan button + verbatim
            strings, floating on the purple ground.
            --------------------------------------------------------------- */}
        <div
          style={{
            position: "absolute",
            left: BAR.x,
            top: BAR.y,
            width: BAR.w,
            height: BAR.h,
            backgroundColor: RN.panel,
            border: `1.5px solid ${
              approved > 0.05 ? "rgba(16,185,129,0.45)" : RN.border
            }`,
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            fontFamily: FONT_SANS,
            opacity: barOp,
            transform: `translateY(${20 * (1 - barIn)}px) scale(${0.96 + 0.04 * barIn})`,
            transformOrigin: "50% 50%",
            boxShadow: `${PANEL_SHADOW}, 0 0 ${
              40 * approvedGlow
            }px rgba(16,185,129,${0.34 * approvedGlow})`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `rgba(16,185,129,${0.14 * approved})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24">
              <path
                d="M4 12.5 L9.5 18 L20 6.5"
                stroke={RN.muted}
                strokeWidth={2.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={1 - approved}
              />
              <path
                d="M4 12.5 L9.5 18 L20 6.5"
                stroke={ALTARI.stampGreen}
                strokeWidth={2.8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - approved}
              />
            </svg>
          </div>
          <span
            style={{
              marginLeft: 14,
              fontSize: 25,
              color: RN.text,
              whiteSpace: "nowrap",
            }}
          >
            {UI.approvePrompt}
          </span>
          <div style={{ flex: 1, minWidth: 20 }} />
          <span
            style={{
              fontSize: 22,
              color: RN.muted,
              whiteSpace: "nowrap",
              marginRight: 22,
            }}
          >
            Close
          </span>
          {/* reserves the footprint of the Approve Plan button, drawn above */}
          <div style={{ width: btnW, flex: "none" }} />
        </div>

        {/* Approve Plan button (own layer so the press can scale it) */}
        <div
          style={{
            position: "absolute",
            left: btnX,
            top: btnY,
            width: btnW,
            height: btnH,
            borderRadius: 29,
            backgroundColor: RN.ink,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_SANS,
            fontSize: 25,
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: barOp,
            transform: `translateY(${20 * (1 - barIn)}px) scale(${
              (0.96 + 0.04 * barIn) * (1 - 0.05 * pressP)
            })`,
          }}
        >
          {UI.approve}
        </div>

        {/* click ripple */}
        {rippleP > 0 && rippleP < 1 ? (
          <div
            style={{
              position: "absolute",
              left: btnCx - (btnW / 2 + 130 * rippleP),
              top: btnCy - (btnH / 2 + 130 * rippleP),
              width: btnW + 260 * rippleP,
              height: btnH + 260 * rippleP,
              borderRadius: 999,
              border: `3px solid rgba(16,185,129,${0.55 * (1 - rippleP)})`,
            }}
          />
        ) : null}

        {/* cursor */}
        {cursorOp > 0 ? (
          <Cursor x={cursorX} y={cursorY} opacity={cursorOp} />
        ) : null}

        {/* ---- landing slot for the first draft ---- */}
        <div
          style={{
            position: "absolute",
            left: OUT.x,
            top: OUT_B_Y,
            width: SLIDE_W,
            height: SLIDE_H,
            borderRadius: 18,
            border: "2px dashed rgba(165,167,217,0.22)",
            opacity: interpolate(frame, [126, 136, 150, 158], [0, 1, 1, 0], clampOpt),
          }}
        />

        {/* ---- approved reference flying out as the first draft ---- */}
        {flyLive ? (
          <div
            style={{
              position: "absolute",
              left: flyPos.x,
              top: flyPos.y,
              width: 0,
              height: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -SLIDE_W / 2,
                top: -SLIDE_H / 2,
                width: SLIDE_W,
                height: SLIDE_H,
                transform: `scale(${flyScale}) rotate(${flyRot}deg)`,
                transformOrigin: "50% 50%",
                borderRadius: 18,
                boxShadow: `0 ${8 + 22 * Math.sin(flyP * Math.PI)}px ${
                  22 + 34 * Math.sin(flyP * Math.PI)
                }px rgba(0,0,0,0.42), 0 0 ${46 * landGlow}px rgba(16,185,129,${
                  0.36 * landGlow
                })`,
              }}
            >
              <SlideCard v={SEL} />
              <div style={{ position: "absolute", right: -18, top: -18 }}>
                <BadgeCheck p={landBadge} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
