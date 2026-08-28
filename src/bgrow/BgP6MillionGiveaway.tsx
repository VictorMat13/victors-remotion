import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import {
  FACTS,
  FONT_UI,
  MRD,
  MRD_GRADIENT,
  MRD_GRID,
  SPRINGS,
  safePadX,
} from "./theme";

// ===========================================================================
// BgP6MillionGiveaway — 1080x1920 @ 30fps (9:16) — 330 frames / 11.0s
// 0:40 GIVEAWAY  [9:16]
//
// VO: "And here's the crazy part. They're giving away a million dollars: a
// hundred dollars of free ad spend each for the first ten thousand users. So
// you can do this for free."
//
// THE ARITHMETIC IS THE GRAPHIC. This is the one part of the series where the
// numbers ARE the data, so they are allowed on screen — nothing else is.
// Only three figures ever render, all of them from GIVEAWAY below:
//   total  -> the hero counter, then the product line
//   each   -> the left operand card
//   spots  -> the right operand card, always equal to the number of lit cells
// Plus the operators "=" and "×" and the "$" currency unit. No captions, no
// narration echo, no invented product UI, no eligibility copy.
//
// DIRECTION — the million DECOMPOSES (VO order: million -> hundred -> ten
// thousand), one continuous world, one keyframed camera, hold -> move -> hold:
//   000-054  hold  frame-filling money counter already climbing at frame 0;
//                  lands exactly on GIVEAWAY.total, digits lock left to right
//                  in a staggered pop and the figure flips to Merydian green.
//   054-084  hold  the total breathes inside its green bloom.
//   084-106  MOVE  22f pull-back. The numeral is only lightly scale-locked
//                  against the camera, so the million stays the anchor while
//                  the world opens underneath it.
//   106-138  hold  a green seed detaches from the total and arcs down; the
//                  GIVEAWAY.each card lands centred under it.
//   138-160  MOVE  22f travel down/out onto the full arithmetic.
//   160-236  hold  the each-card slides into operand position, the second
//                  operand joins, and the 10,000-cell field lights in
//                  staggered waves while that operand ticks — the counter
//                  always equals the number of lit cells, so the proportion
//                  on screen is honest.
//   236-258  MOVE  22f settle out to the final framing.
//   258-330  hold  STATE CHANGE for "so you can do this for free": the
//                  GIVEAWAY.each card fills with MRD_GRADIENT.cta and its
//                  figure flips to black ink — Merydian's primary-CTA state —
//                  while the field blooms to full green. 72f clean end hold.
//
// The root AbsoluteFill paints MRD.bg + MRD_GRADIENT.ground on frame 0 and
// never stops; the Merydian top light streak is screen-fixed so a meaningful
// band of the frame is always well above the black-detect floor, including
// between fill waves.
// ===========================================================================

// ---------------------------------------------------------------------------
// THE THREE GIVEAWAY FIGURES — the single place to edit.
// Still flagged UNVERIFIED with the brand (see theme.ts FACTS). Every numeral
// in this composition is derived from these three strings: change one here and
// the counter range, the cell count, the lattice shape and the payoff all
// follow. Nothing below writes a digit by hand.
// ---------------------------------------------------------------------------
const GIVEAWAY = {
  total: FACTS.giveawayTotal, // "$1,000,000"
  each: FACTS.giveawayEach, // "$100"
  spots: FACTS.giveawaySpots, // "10,000"
} as const;

const sans = loadSans("normal", {
  weights: ["400", "500", "600", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const SANS = `${sans.fontFamily}, ${FONT_UI}`;

export const DURATION_IN_FRAMES = 330;

// ---------------------------------------------------------------------------
// Canvas + safe areas
// ---------------------------------------------------------------------------
const VIEW_W = 1080;
const VIEW_H = 1920;
const PAD = safePadX(VIEW_W); // 54 — hard 5% side margin

const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASED = { easing: EASE, ...CLAMP } as const;

const TABULAR: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums lining-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

// ---------------------------------------------------------------------------
// Figures parsed out of GIVEAWAY. group() rebuilds the exact source strings.
// ---------------------------------------------------------------------------
const digitsOf = (s: string) => Number(s.replace(/[^0-9]/g, ""));
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const TOTAL_N = digitsOf(GIVEAWAY.total); // 1000000
const SPOTS_N = digitsOf(GIVEAWAY.spots); // 10000
const money = (n: number) => `$${group(n)}`;

// The field is literally GIVEAWAY.spots cells — one per spot, each worth
// GIVEAWAY.each. Square-ish lattice, capped at 100 columns.
const COLS = Math.min(100, Math.max(1, Math.ceil(Math.sqrt(SPOTS_N))));
const ROWS = Math.ceil(SPOTS_N / COLS);
const cellsInRow = (r: number) => Math.min(COLS, SPOTS_N - r * COLS);

// ---------------------------------------------------------------------------
// World layout (world coordinates; the camera below frames them)
// ---------------------------------------------------------------------------
const TOTAL_CY = 340; // hero numeral centre
const EQ_CY = 520; // the "=" glyph
const CARD_Y = 590;
const CARD_H = 190;
const CARD_A_W = 320; // GIVEAWAY.each
const CARD_B_W = 400; // GIVEAWAY.spots (ticking)
const OPGAP = 30;
const OPW = 44; // the "×" column
const ROW_W = CARD_A_W + OPGAP + OPW + OPGAP + CARD_B_W; // 824
const ROW_X = Math.max(PAD, Math.round((VIEW_W - ROW_W) / 2)); // 128
const A_X = ROW_X; // 128 — operand position
const A_X_OPEN = Math.round((VIEW_W - CARD_A_W) / 2); // 380 — centred at arrival
const OP_CX = ROW_X + CARD_A_W + OPGAP + OPW / 2; // 500
const B_X = ROW_X + CARD_A_W + OPGAP + OPW + OPGAP; // 552
const GLYPH_CY = CARD_Y + 60; // 650 — coin / mini-lattice centre
const NUM_CY = CARD_Y + 134; // 724 — operand numeral centre
const NUM_FONT = 74;
const CNT_BOX_W = 286; // fixed slot so the ticking count never jitters

const PITCH = 7;
const DOT = 4.6;
const FIELD_W = COLS * PITCH; // 700
const FIELD_H = ROWS * PITCH; // 700
const FIELD_X = Math.max(PAD, Math.round((VIEW_W - FIELD_W) / 2)); // 190
const FIELD_Y = 880; // -> 1580, clear of the bottom safe line at every camera key

// Hero numeral. Per-glyph boxes give exact, measurement-free tabular widths, so
// the 5% side margin can be proven arithmetically at every camera key.
const HERO_FONT = 165;
const CH_EM: Record<string, number> = { $: 0.62, ",": 0.3 };
const chEm = (c: string) => CH_EM[c] ?? 0.64;
const emOf = (s: string) => [...s].reduce((a, c) => a + chEm(c), 0);
const HERO_EM = emOf(GIVEAWAY.total); // 5.70 for "$1,000,000"
const HERO_BASE_W = HERO_EM * HERO_FONT; // natural world width at scale 1

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
const COUNT_FROM = -14; // already climbing on frame 0
const COUNT_LAND = 54;
const LOCK_STAGGER = 1.6;
const LOCK_DUR = 14;
const SEED_T = 104;
const SEED_DUR = 22;
const CARD_A_IN = 116;
const SLIDE_A = [160, 182] as const; // centre -> operand position
const LATTICE_IN = 156;
const EQ_IN = 180;
const OP_IN = 184;
const CARD_B_IN = 186;
const FILL_START = 188;
const ROW_DUR = 12;
const STAGGER = 0.34;
const jitter = (r: number) => 4 * Math.sin(r * 1.73); // deterministic ripple
const FILL_END = 235;
const FREE_T = 258; // the "so you can do this for free" state change
const FREE_DUR = 22;

// ---------------------------------------------------------------------------
// Camera — hold -> 22f move -> hold, ending on near-identical keys.
// ---------------------------------------------------------------------------
const KEY_T = [0, 54, 84, 106, 138, 160, 236, 258, 300, 330];
const KEY_FX = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [340, 340, 340, 560, 560, 873, 873, 878, 879, 879];
const KEY_Z = [2.18, 2.22, 2.26, 1.0, 1.0, 0.985, 0.985, 0.93, 0.928, 0.9275];
// On-screen width the hero numeral holds through the pull-back. 930 < 972, so
// the numeral can never touch the 5% margin at any camera key.
const KEY_HERO_W = [900, 900, 900, 880, 880, 856, 856, 836, 834, 834];

// ---------------------------------------------------------------------------
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const popAt = (frame: number, fps: number, start: number, dur = 18) =>
  frame < start
    ? 0
    : spring({
        frame: frame - start,
        fps,
        config: SPRINGS.snappy,
        durationInFrames: dur,
      });

const ramp = (frame: number, a: number, b: number, easing = EASE) =>
  interpolate(frame, [a, b], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ---------------------------------------------------------------------------
// One row of the cell field. A tiled radial gradient renders up to COLS cells
// per element, so the full GIVEAWAY.spots lattice costs ~2 x ROWS nodes.
// ---------------------------------------------------------------------------
const cellTile = (c: string) =>
  `radial-gradient(circle at 50% 50%, ${c} 0 ${(DOT / PITCH) * 45}%, rgba(0,0,0,0) ${
    (DOT / PITCH) * 58
  }%)`;

const CellRow: React.FC<{
  row: number;
  count: number;
  color: string;
  opacity: number;
}> = ({ row, count, color, opacity }) => {
  if (count <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: FIELD_X,
        top: FIELD_Y + row * PITCH,
        width: count * PITCH,
        height: PITCH,
        backgroundImage: cellTile(color),
        backgroundSize: `${PITCH}px ${PITCH}px`,
        backgroundRepeat: "repeat-x",
        opacity,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Card shell — raised Merydian surface on the dark ground.
// ---------------------------------------------------------------------------
const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 26,
      background: `linear-gradient(180deg, ${MRD.card} 0%, ${MRD.cardSoft} 100%)`,
      border: `1px solid ${MRD.hairline}`,
      boxShadow: MRD.panelShadow,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

const NUM_STYLE: React.CSSProperties = {
  ...TABULAR,
  fontFamily: SANS,
  fontWeight: 800,
  letterSpacing: "-0.02em",
};

// ---------------------------------------------------------------------------
// Seeds — the total copying itself out into the field.
// ---------------------------------------------------------------------------
const SEED_OX = A_X + CARD_A_W / 2; // 288
const SEED_OY = GLYPH_CY; // 650
const SEEDS = [
  { t: 190, tx: FIELD_X + 96, ty: FIELD_Y + 58, bow: -96 },
  { t: 196, tx: FIELD_X + 292, ty: FIELD_Y + 136, bow: -76 },
  { t: 202, tx: FIELD_X + 456, ty: FIELD_Y + 44, bow: -118 },
  { t: 208, tx: FIELD_X + 612, ty: FIELD_Y + 168, bow: -70 },
  { t: 214, tx: FIELD_X + 212, ty: FIELD_Y + 248, bow: -62 },
];

// ---------------------------------------------------------------------------
export const BgP6MillionGiveaway: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const fx = interpolate(frame, KEY_T, KEY_FX, EASED);
  const fy = interpolate(frame, KEY_T, KEY_FY, EASED);
  const z = interpolate(frame, KEY_T, KEY_Z, EASED);
  const heroScreenW = interpolate(frame, KEY_T, KEY_HERO_W, EASED);
  // Scale-lock: the hero holds its on-screen width through the pull-back.
  const heroK = heroScreenW / (HERO_BASE_W * z);

  // ---- the money counter ----
  const counted = Math.round(
    interpolate(frame, [COUNT_FROM, COUNT_LAND], [0, TOTAL_N], {
      easing: OUT,
      ...CLAMP,
    }),
  );
  const heroStr = frame >= COUNT_LAND ? GIVEAWAY.total : money(counted);
  const heroChars = [...heroStr];
  const landed = ramp(frame, COUNT_LAND, COUNT_LAND + 20);
  const heroColor = interpolateColors(
    landed,
    [0, 1],
    [MRD.text, MRD.green],
  );
  const heroBreath = 1 + 0.006 * Math.sin((frame - COUNT_LAND) / 11);
  const heroGlow = 0.16 + 0.5 * landed;
  const landFlash = ramp(frame, COUNT_LAND, COUNT_LAND + 34, OUT);
  // The world-space ambients are damped while the camera sits tight, so the
  // open reads as Merydian near-black with a green pool — not a green wash.
  const openDamp = interpolate(frame, [0, 84, 106], [0.28, 0.28, 1], CLAMP);

  // ---- the seed that becomes the first operand ----
  const seedP = ramp(frame, SEED_T, SEED_T + SEED_DUR, OUT);
  const aIn = Math.min(1, popAt(frame, fps, CARD_A_IN, 20));
  const slide = ramp(frame, SLIDE_A[0], SLIDE_A[1]);
  const aX = A_X_OPEN + (A_X - A_X_OPEN) * slide;
  const aOp = ramp(frame, CARD_A_IN, CARD_A_IN + 10);
  const coinDrop = Math.min(1, popAt(frame, fps, CARD_A_IN + 4, 20));
  const coinBreath = 1 + 0.02 * Math.sin((frame - CARD_A_IN) / 9);
  const ringA = ramp(frame, CARD_A_IN + 14, CARD_A_IN + 48, OUT);
  const ringB = ramp(frame, CARD_A_IN + 30, CARD_A_IN + 64, OUT);

  // ---- the field ----
  const latticeIn = ramp(frame, LATTICE_IN, LATTICE_IN + 22);
  let lit = 0;
  const rowLit: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    const start = FILL_START + r * STAGGER + jitter(r);
    const p = interpolate(frame, [start, start + ROW_DUR], [0, 1], {
      easing: OUT,
      ...CLAMP,
    });
    const n = Math.round(p * cellsInRow(r));
    rowLit.push(n);
    lit += n;
  }
  const fillP = lit / SPOTS_N;

  // ---- the second operand: always exactly the number of lit cells ----
  const countStr = frame >= FILL_END ? GIVEAWAY.spots : group(lit);
  const eqIn = ramp(frame, EQ_IN, EQ_IN + 14);
  const opIn = ramp(frame, OP_IN, OP_IN + 14);
  const bIn = Math.min(1, popAt(frame, fps, CARD_B_IN, 22));
  const bOp = ramp(frame, CARD_B_IN, CARD_B_IN + 10);

  const sweepP = ramp(frame, FILL_END - 6, FILL_END + 16);
  const sweepOp = interpolate(
    frame,
    [FILL_END - 6, FILL_END, FILL_END + 10, FILL_END + 16],
    [0, 1, 1, 0],
    CLAMP,
  );

  // ---- "so you can do this for free": the CTA state change ----
  const free = ramp(frame, FREE_T, FREE_T + FREE_DUR); // bloom / field level
  // The CTA state is a hard left-to-right fill, not a crossfade — a crossfade
  // muddies the card through the middle of the transition.
  const freeFill = ramp(frame, FREE_T, FREE_T + 16, OUT);
  const freePunch =
    1 + 0.045 * Math.sin(Math.PI * ramp(frame, FREE_T + 6, FREE_T + 30, OUT));

  const litColor = alpha(MRD.green, 0.72 + 0.28 * free);
  const idleColor = "rgba(255,255,255,0.115)";

  return (
    <AbsoluteFill
      style={{ backgroundColor: MRD.bg, backgroundImage: MRD_GRADIENT.ground }}
    >
      {/* ---- screen-fixed Merydian light: present frame 0 -> last frame ---- */}
      <AbsoluteFill
        style={{
          backgroundImage: MRD_GRADIENT.streak,
          height: 700,
          opacity: 0.85,
        }}
      />
      {[
        { x: 168, w: 210, o: 0.5 },
        { x: 486, w: 300, o: 0.75 },
        { x: 812, w: 190, o: 0.42 },
      ].map((s) => (
        <div
          key={s.x}
          style={{
            position: "absolute",
            left: s.x,
            top: -90,
            width: s.w,
            height: 1180,
            background: `linear-gradient(180deg, ${alpha(
              MRD.green,
              0.11,
            )} 0%, rgba(0,0,0,0) 74%)`,
            filter: "blur(46px)",
            opacity: s.o,
          }}
        />
      ))}

      {/* ------------------------------- the world ------------------------ */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: VIEW_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${
            VIEW_H / 2 - fy
          }px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* faint vertical rule grid, like merydian.ai — oversized so it never
            reveals an edge at any camera key */}
        <div
          style={{
            position: "absolute",
            left: -520,
            top: -760,
            width: VIEW_W + 1040,
            height: VIEW_H + 1520,
            backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0 1px, rgba(0,0,0,0) 1px ${MRD_GRID.spacing}px)`,
            opacity: 0.9,
          }}
        />

        {/* green ambient behind the total */}
        <div
          style={{
            position: "absolute",
            left: 540 - 560,
            top: TOTAL_CY - 360,
            width: 1120,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${alpha(
              MRD.green,
              (0.06 + 0.1 * landed) * openDamp,
            )} 0%, rgba(0,0,0,0) 100%)`,
          }}
        />

        {/* landing flash — the million arriving */}
        {landFlash > 0 && landFlash < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 520,
              top: TOTAL_CY - 300,
              width: 1040,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, ${alpha(
                MRD.green,
                0.3 * (1 - landFlash),
              )} 0%, rgba(0,0,0,0) 100%)`,
              transform: `scale(${0.55 + 0.6 * landFlash})`,
              transformOrigin: "center center",
            }}
          />
        ) : null}

        {/* green ambient behind the field, blooming as it fills */}
        <div
          style={{
            position: "absolute",
            left: 540 - 620,
            top: FIELD_Y + FIELD_H / 2 - 480,
            width: 1240,
            height: 960,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${alpha(
              MRD.green,
              0.045 + 0.09 * fillP + 0.055 * free,
            )} 0%, rgba(0,0,0,0) 100%)`,
            opacity: latticeIn,
          }}
        />

        {/* ---------------- the field of spots ---------------- */}
        {latticeIn > 0 ? (
          <>
            {rowLit.map((_, r) => (
              <CellRow
                key={`e${r}`}
                row={r}
                count={cellsInRow(r)}
                color={idleColor}
                opacity={latticeIn}
              />
            ))}
            {rowLit.map((n, r) => (
              <CellRow
                key={`f${r}`}
                row={r}
                count={n}
                color={litColor}
                opacity={latticeIn}
              />
            ))}
            {/* completion sweep, clipped to the field so it can never reach a
                safe margin */}
            {sweepOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: FIELD_X,
                  top: FIELD_Y,
                  width: FIELD_W,
                  height: FIELD_H,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    top: -180 + sweepP * (FIELD_H + 200),
                    width: FIELD_W - 16,
                    height: 180,
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${alpha(
                      MRD.green,
                      0.5,
                    )} 50%, rgba(0,0,0,0) 100%)`,
                    filter: "blur(12px)",
                    opacity: sweepOp * 0.85,
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {/* seeds: the total copying itself into the field */}
        {SEEDS.map((s) => {
          const p = ramp(frame, s.t, s.t + 26, OUT);
          if (p <= 0 || p >= 1) return null;
          const ox = SEED_OX;
          const oy = SEED_OY;
          const sx = ox + (s.tx - ox) * p;
          const sy = oy + (s.ty - oy) * p + s.bow * Math.sin(Math.PI * p);
          const size = 20 - 15 * p;
          return (
            <div
              key={s.t}
              style={{
                position: "absolute",
                left: sx - size / 2,
                top: sy - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: MRD.green,
                opacity: interpolate(p, [0, 0.12, 0.8, 1], [0, 1, 1, 0]),
                boxShadow: `0 0 ${16 * (1 - p)}px ${alpha(MRD.green, 0.6)}`,
              }}
            />
          );
        })}

        {/* ---------------- the hero total ---------------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: TOTAL_CY - HERO_FONT / 2,
            width: VIEW_W,
            height: HERO_FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${heroK * heroBreath})`,
            transformOrigin: "center center",
          }}
        >
          {heroChars.map((c, i) => {
            const s = COUNT_LAND + i * LOCK_STAGGER;
            const p = ramp(frame, s, s + LOCK_DUR, OUT);
            const bump = 1 + 0.11 * Math.sin(Math.PI * p);
            return (
              <span
                key={`${i}-${c}`}
                style={{
                  ...NUM_STYLE,
                  display: "inline-block",
                  width: chEm(c) * HERO_FONT,
                  textAlign: "center",
                  fontSize: HERO_FONT,
                  lineHeight: `${HERO_FONT}px`,
                  color: heroColor,
                  transform: `scale(${bump})`,
                  textShadow: `0 0 ${22 + 26 * landed}px ${alpha(
                    MRD.green,
                    heroGlow * 0.7,
                  )}, 0 0 ${64 + 60 * landed}px ${alpha(MRD.green, heroGlow * 0.3)}`,
                }}
              >
                {c}
              </span>
            );
          })}
        </div>

        {/* ---------------- "=" ---------------- */}
        <div
          style={{
            ...NUM_STYLE,
            position: "absolute",
            left: 0,
            top: EQ_CY - 44,
            width: VIEW_W,
            height: 88,
            lineHeight: "88px",
            fontSize: 84,
            fontWeight: 400,
            color: MRD.muted,
            textAlign: "center",
            opacity: eqIn,
          }}
        >
          =
        </div>

        {/* ---------------- the seed in flight -> operand A ---------------- */}
        {seedP > 0 && seedP < 1 ? (
          <div
            style={{
              position: "absolute",
              left:
                540 +
                (A_X_OPEN + CARD_A_W / 2 - 540) * seedP -
                (18 - 8 * seedP) / 2,
              top:
                TOTAL_CY +
                80 +
                (GLYPH_CY - TOTAL_CY - 80) * seedP -
                (18 - 8 * seedP) / 2,
              width: 18 - 8 * seedP,
              height: 18 - 8 * seedP,
              borderRadius: "50%",
              background: MRD.green,
              boxShadow: `0 0 22px ${alpha(MRD.green, 0.7)}`,
              opacity: interpolate(seedP, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
            }}
          />
        ) : null}

        {/* ---------------- operand A: GIVEAWAY.each ---------------- */}
        {aOp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: aX,
              top: CARD_Y,
              width: CARD_A_W,
              height: CARD_H,
              opacity: aOp,
              transform: `translateY(${(1 - aIn) * 26}px) scale(${
                (0.92 + 0.08 * aIn) * freePunch
              })`,
              transformOrigin: "center center",
            }}
          >
            {/* free-state bloom */}
            <div
              style={{
                position: "absolute",
                left: CARD_A_W / 2 - 380,
                top: CARD_H / 2 - 300,
                width: 760,
                height: 600,
                borderRadius: "50%",
                background: `radial-gradient(closest-side, ${alpha(
                  MRD.green,
                  0.22,
                )} 0%, rgba(0,0,0,0) 100%)`,
                opacity: free,
              }}
            />

            {/* dark surface (fades out on the state change) */}
            <Card x={0} y={0} w={CARD_A_W} h={CARD_H}>
              {[ringA, ringB].map((k, i) =>
                k > 0 && k < 1 ? (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: CARD_A_W / 2 - 26,
                      top: GLYPH_CY - CARD_Y - 26,
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      border: `3px solid ${alpha(MRD.green, 0.45 * (1 - k))}`,
                      transform: `scale(${1 + 2.1 * k})`,
                    }}
                  />
                ) : null,
              )}
              <div
                style={{
                  position: "absolute",
                  left: CARD_A_W / 2 - 26,
                  top: GLYPH_CY - CARD_Y - 26,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: `4px solid ${MRD.green}`,
                  background: MRD.greenSoft,
                  boxSizing: "border-box",
                  boxShadow: MRD.glowSoft,
                  transform: `translateY(${(1 - coinDrop) * -46}px) scale(${
                    coinDrop * coinBreath
                  })`,
                  opacity: Math.min(1, coinDrop * 1.6),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 13,
                    top: 13,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: MRD.green,
                  }}
                />
              </div>
              <div
                style={{
                  ...NUM_STYLE,
                  position: "absolute",
                  left: 0,
                  top: NUM_CY - CARD_Y - NUM_FONT / 2,
                  width: CARD_A_W,
                  height: NUM_FONT,
                  lineHeight: `${NUM_FONT}px`,
                  fontSize: NUM_FONT,
                  color: MRD.text,
                  textAlign: "center",
                }}
              >
                {GIVEAWAY.each}
              </div>
            </Card>

            {/* Merydian primary-CTA state — the "free" landing */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: CARD_A_W,
                height: CARD_H,
                borderRadius: 26,
                background: MRD_GRADIENT.cta,
                boxShadow: `${MRD.glow}, 0 18px 48px ${alpha(MRD.green, 0.2)}`,
                clipPath: `inset(0 ${(1 - freeFill) * 100}% 0 0 round 26px)`,
                opacity: freeFill > 0 ? 1 : 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: CARD_A_W / 2 - 26,
                  top: GLYPH_CY - CARD_Y - 26,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: `4px solid ${alpha(MRD.greenInk, 0.85)}`,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 13,
                    top: 13,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: alpha(MRD.greenInk, 0.85),
                  }}
                />
              </div>
              <div
                style={{
                  ...NUM_STYLE,
                  position: "absolute",
                  left: 0,
                  top: NUM_CY - CARD_Y - NUM_FONT / 2,
                  width: CARD_A_W,
                  height: NUM_FONT,
                  lineHeight: `${NUM_FONT}px`,
                  fontSize: NUM_FONT,
                  color: MRD.greenInk,
                  textAlign: "center",
                }}
              >
                {GIVEAWAY.each}
              </div>
            </div>
          </div>
        ) : null}

        {/* ---------------- "×" ---------------- */}
        <div
          style={{
            ...NUM_STYLE,
            position: "absolute",
            left: OP_CX - OPW / 2,
            top: NUM_CY - 34,
            width: OPW,
            height: 68,
            lineHeight: "68px",
            fontSize: 66,
            fontWeight: 400,
            color: MRD.muted,
            textAlign: "center",
            opacity: opIn,
          }}
        >
          ×
        </div>

        {/* ---------------- operand B: GIVEAWAY.spots ---------------- */}
        {bOp > 0 ? (
          <Card
            x={B_X}
            y={CARD_Y}
            w={CARD_B_W}
            h={CARD_H}
            style={{
              opacity: bOp,
              transform: `translateY(${(1 - bIn) * 24}px) scale(${
                0.94 + 0.06 * bIn
              })`,
            }}
          >
            {/* a small rhyme of the field */}
            <div
              style={{
                position: "absolute",
                left: CARD_B_W / 2 - 26,
                top: GLYPH_CY - CARD_Y - 26,
                width: 52,
                height: 52,
                backgroundImage: cellTile(alpha(MRD.green, 0.5 + 0.45 * fillP)),
                backgroundSize: "13px 13px",
                backgroundRepeat: "repeat",
              }}
            />
            <div
              style={{
                ...NUM_STYLE,
                position: "absolute",
                left: (CARD_B_W - CNT_BOX_W) / 2,
                top: NUM_CY - CARD_Y - NUM_FONT / 2,
                width: CNT_BOX_W,
                height: NUM_FONT,
                lineHeight: `${NUM_FONT}px`,
                fontSize: NUM_FONT,
                color: MRD.text,
                textAlign: "right",
              }}
            >
              {countStr}
            </div>
          </Card>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
