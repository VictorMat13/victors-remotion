import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_DISPLAY, LW, OFFER, RN, SPRINGS, safePadX } from "./theme";

// ============================================================================
// RgP7HundredFree — 1080x1920 @ 30fps  (9:16)
// VO [0:38-0:47]: "And here's the part that doesn't make sense. They're putting
// a hundred dollars of free ad spend in your account to do it. No catch.
// That's the million dollars. A hundred each, first ten thousand people."
//
// THE ARITHMETIC IS THE VISUAL.  perUser x spots = total.
//   0-26    one account card receives the amount (coin drops, figure pops)
//   26-64   HOLD tight while it registers (coin breathes, amber rings pulse)
//   64-86   MOVE (22f) pull back — the account turns out to sit above a field
//   86-112  HOLD — the amount replicates: seeds fly out, the field starts
//           lighting in staggered waves, the account slides into operand place
//   112-134 MOVE (22f) push gently into the filling field
//   134-186 HOLD — waves finish, the live count lands on OFFER.spots
//   186-208 MOVE (22f) pull back/down as the total resolves
//   208-270 end hold (near-identical camera keys)
//
// EVERY figure on screen comes from `OFFER`:
//   OFFER.perUser  -> the account card, verbatim
//   OFFER.spots    -> the dot field's exact dot count AND the counter (verbatim
//                     once the field is full; grouped digits while ticking)
//   OFFER.total    -> the payoff, verbatim
// No digit is written by hand. The field holds EXACTLY OFFER.spots dots and the
// counter always equals the number of lit dots, so the proportion is honest.
// No claim text, no invented product UI, no eligibility/terms of any kind.
// ============================================================================

export const DURATION_IN_FRAMES = 270;

const VIEW_W = 1080;
const VIEW_H = 1920;
const PAD = safePadX(VIEW_W); // 54 — hard 5% side margin
const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// Colour helper — everything is derived from the theme, nothing hardcoded.
// ---------------------------------------------------------------------------
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ---------------------------------------------------------------------------
// Figures. Parsed out of OFFER so one edit to theme.ts changes/removes them.
// ---------------------------------------------------------------------------
const SPOTS_N = Number(OFFER.spots.replace(/[^0-9]/g, ""));
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// The field is literally OFFER.spots dots — one per spot, each worth
// OFFER.perUser. Square-ish lattice, capped at 100 columns.
const COLS = Math.min(100, Math.max(1, Math.ceil(Math.sqrt(SPOTS_N))));
const ROWS = Math.ceil(SPOTS_N / COLS);
const dotsInRow = (r: number) => Math.min(COLS, SPOTS_N - r * COLS);

// ---------------------------------------------------------------------------
// Layout. The final camera sits at z ~= 1 focal (540, 950), so the numbers
// below are (near enough) where things land on the 1080x1920 canvas.
// ---------------------------------------------------------------------------
const CARD_H = 190;
const CARD_A_W = 300; // the account holding OFFER.perUser
const CARD_B_W = 400; // the live count of accounts
const OPGAP = 34;
const OPW = 46; // the "x" glyph column
const ROW_W = CARD_A_W + OPGAP + OPW + OPGAP + CARD_B_W; // 814
const ROW_X = Math.max(PAD, Math.round((VIEW_W - ROW_W) / 2)); // 133
const CARD_Y = 235; // clear of the top 10% (192)
const A_X_HOME = ROW_X; // 133 — operand position
const A_X_OPEN = Math.round((VIEW_W - CARD_A_W) / 2); // 390 — centred at the open
const B_X = ROW_X + CARD_A_W + OPGAP + OPW + OPGAP; // 547
const OP_CX = ROW_X + CARD_A_W + OPGAP + OPW / 2; // 490
const NUM_CY = CARD_Y + 137; // 372 — numeral centre inside a card
const GLYPH_CY = CARD_Y + 61; // 296 — coin / mini-lattice centre

const PITCH = 9;
const DOT = 6;
const FIELD_W = COLS * PITCH; // 900
const FIELD_H = ROWS * PITCH; // 900
const FIELD_X = Math.max(PAD, Math.round((VIEW_W - FIELD_W) / 2)); // 90
const FIELD_Y = 480;

const PAY_W = 880;
const PAY_H = 160;
const PAY_X = Math.max(PAD, Math.round((VIEW_W - PAY_W) / 2)); // 100
const PAY_Y = 1425; // bottom 1585, clear of the bottom 12% (1690)

const NUM_FONT = 74;
const PAY_FONT = 92;
const CNT_BOX_W = 268; // fixed slot so the ticking count never jitters

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
const LATTICE_IN = 70;
const SLIDE_A = [90, 112] as const;
const FILL_START = 94;
const ROW_DUR = 15;
const STAGGER = 0.55;
const jitter = (r: number) => 5 * Math.sin(r * 1.73); // deterministic ripple
const FILL_END = 172;
const OP_IN = 112;
const B_IN = 114;
const PAY_IN = 196;

// ---------------------------------------------------------------------------
// Camera — hold -> 22f move -> hold, ending on two near-identical keys.
// ---------------------------------------------------------------------------
const KEY_T = [0, 26, 64, 86, 112, 134, 186, 208, 244, 270];
const KEY_FX = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [330, 330, 330, 840, 840, 806, 810, 946, 950, 951];
const KEY_Z = [3.0, 3.06, 3.12, 0.985, 0.985, 1.045, 1.04, 0.985, 0.982, 0.981];

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
// A row of the dot field. One element renders up to COLS dots via a tiled
// radial gradient, so the full OFFER.spots lattice costs ~2 x ROWS nodes.
// ---------------------------------------------------------------------------
const dotTile = (c: string) =>
  `radial-gradient(circle at 50% 50%, ${c} 0 ${(DOT / PITCH) * 45}%, ${alpha(
    "#000000",
    0,
  )} ${(DOT / PITCH) * 56}%)`;

const DotRow: React.FC<{
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
        backgroundImage: dotTile(color),
        backgroundSize: `${PITCH}px ${PITCH}px`,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 0",
        opacity,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Card shell — white floating card in Liam's warm-white world.
// ---------------------------------------------------------------------------
const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  lift?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, lift, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 26,
      background: LW.card,
      border: `1px solid ${LW.hairline}`,
      boxShadow: lift ? LW.shadowLift : LW.shadow,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

const NUM_STYLE: React.CSSProperties = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 700,
  color: LW.ink,
  letterSpacing: "-0.02em",
  fontVariantNumeric: "tabular-nums lining-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

// ---------------------------------------------------------------------------
// Seeds — the amount copying itself out of the account into the field.
// ---------------------------------------------------------------------------
const SEEDS = [
  { t: 84, tx: FIELD_X + 96, ty: FIELD_Y + 52, bow: -150 },
  { t: 89, tx: FIELD_X + 300, ty: FIELD_Y + 128, bow: -110 },
  { t: 94, tx: FIELD_X + 470, ty: FIELD_Y + 34, bow: -180 },
  { t: 99, tx: FIELD_X + 648, ty: FIELD_Y + 150, bow: -100 },
  { t: 104, tx: FIELD_X + 812, ty: FIELD_Y + 62, bow: -160 },
  { t: 109, tx: FIELD_X + 214, ty: FIELD_Y + 236, bow: -80 },
];
const SEED_DUR = 24;

// ---------------------------------------------------------------------------
export const RgP7HundredFree: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: EASE,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fx = interpolate(frame, KEY_T, KEY_FX, camOpts);
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpts);
  const z = interpolate(frame, KEY_T, KEY_Z, camOpts);

  // ---- the account receives the amount ----
  // negative start => the coin is already in flight on frame 0
  const coinDrop = popAt(frame, fps, -7, 20);
  const figurePop = popAt(frame, fps, 4, 20);
  const breathe = 1 + 0.012 * Math.sin((frame - 26) / 9);
  const ringA = ramp(frame, 30, 66, OUT);
  const ringB = ramp(frame, 48, 84, OUT);

  // ---- the account slides into operand position ----
  const slide = ramp(frame, SLIDE_A[0], SLIDE_A[1]);
  const aX = A_X_OPEN + (A_X_HOME - A_X_OPEN) * slide;
  const coinCx = aX + CARD_A_W / 2;

  // ---- the field ----
  const latticeIn = ramp(frame, LATTICE_IN, LATTICE_IN + 24);
  let lit = 0;
  const rowLit: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    const start = FILL_START + r * STAGGER + jitter(r);
    const p = interpolate(frame, [start, start + ROW_DUR], [0, 1], {
      easing: OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const n = Math.round(p * dotsInRow(r));
    rowLit.push(n);
    lit += n;
  }

  // ---- the counter: always exactly the number of lit dots ----
  const countStr = frame >= FILL_END ? OFFER.spots : group(lit);
  const opIn = ramp(frame, OP_IN, OP_IN + 14);
  const bIn = Math.min(1, popAt(frame, fps, B_IN, 22));

  // ---- completion sweep + payoff ----
  const sweepP = ramp(frame, FILL_END - 2, FILL_END + 18);
  const sweepOp = interpolate(
    frame,
    [FILL_END - 2, FILL_END + 4, FILL_END + 12, FILL_END + 18],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const payIn = Math.min(1, popAt(frame, fps, PAY_IN, 24));
  const payOp = ramp(frame, PAY_IN, PAY_IN + 12);

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* subtle floor gradient — screen-fixed, never leaves the frame */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${alpha(
            LW.card,
            0.85,
          )} 0%, ${alpha(LW.paper, 0)} 34%, ${alpha(LW.paperDeep, 0.9)} 100%)`,
        }}
      />

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
        {/* warm money glow behind the account */}
        <div
          style={{
            position: "absolute",
            left: coinCx - 420,
            top: CARD_Y + CARD_H / 2 - 420,
            width: 840,
            height: 840,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(
              RN.amber,
              0.14,
            )} 0%, ${alpha(RN.amber, 0)} 66%)`,
            opacity: 0.9,
          }}
        />

        {/* ---------------- the field of accounts ---------------- */}
        {latticeIn > 0 ? (
          <>
            {rowLit.map((_, r) => (
              <DotRow
                key={`e${r}`}
                row={r}
                count={dotsInRow(r)}
                color={alpha(LW.muted, 0.34)}
                opacity={latticeIn}
              />
            ))}
            {rowLit.map((n, r) => (
              <DotRow
                key={`f${r}`}
                row={r}
                count={n}
                color={RN.amber}
                opacity={latticeIn}
              />
            ))}
            {/* completion sweep — clipped to the field so it can never reach
                the 5% side margins or the bottom safe zone */}
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
                    left: 12,
                    top: -220 + sweepP * (FIELD_H + 240),
                    width: FIELD_W - 24,
                    height: 220,
                    background: `linear-gradient(180deg, ${alpha(
                      RN.amber,
                      0,
                    )} 0%, ${alpha(RN.amber, 0.5)} 50%, ${alpha(
                      RN.amber,
                      0,
                    )} 100%)`,
                    filter: "blur(14px)",
                    opacity: sweepOp * 0.8,
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {/* ---------------- seeds: the amount copying itself ------------- */}
        {SEEDS.map((s, i) => {
          const p = ramp(frame, s.t, s.t + SEED_DUR, OUT);
          if (p <= 0 || p >= 1) return null;
          const sx = coinCx + (s.tx - coinCx) * p;
          const sy =
            GLYPH_CY + (s.ty - GLYPH_CY) * p + s.bow * Math.sin(Math.PI * p);
          const size = 26 - 19 * p;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: sx - size / 2,
                top: sy - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: RN.amber,
                opacity: interpolate(p, [0, 0.12, 0.82, 1], [0, 1, 1, 0]),
                boxShadow: `0 0 ${18 * (1 - p)}px ${alpha(RN.amber, 0.55)}`,
              }}
            />
          );
        })}

        {/* ---------------- operand A: the account ---------------- */}
        <Card x={aX} y={CARD_Y} w={CARD_A_W} h={CARD_H}>
          {/* amber rings — the amount registering */}
          {[ringA, ringB].map((k, i) =>
            k > 0 && k < 1 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: CARD_A_W / 2 - 27,
                  top: GLYPH_CY - CARD_Y - 27,
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  border: `3px solid ${alpha(RN.amber, 0.5 * (1 - k))}`,
                  transform: `scale(${1 + 2.1 * k})`,
                }}
              />
            ) : null,
          )}

          {/* the coin */}
          <div
            style={{
              position: "absolute",
              left: CARD_A_W / 2 - 27,
              top: GLYPH_CY - CARD_Y - 27,
              width: 54,
              height: 54,
              borderRadius: "50%",
              border: `4px solid ${RN.amber}`,
              background: RN.amberSoft,
              boxSizing: "border-box",
              transform: `translateY(${(1 - coinDrop) * -54}px) scale(${
                coinDrop * breathe
              })`,
              opacity: Math.min(1, coinDrop * 1.6),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 14,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: RN.amber,
              }}
            />
          </div>

          {/* OFFER.perUser — verbatim */}
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
              textAlign: "center",
              opacity: Math.min(1, figurePop * 1.4),
              transform: `scale(${0.86 + 0.14 * Math.min(1, figurePop)})`,
            }}
          >
            {OFFER.perUser}
          </div>
        </Card>

        {/* ---------------- the multiplier glyph ---------------- */}
        <div
          style={{
            ...NUM_STYLE,
            position: "absolute",
            left: OP_CX - OPW / 2,
            top: NUM_CY - 29,
            width: OPW,
            height: 58,
            lineHeight: "58px",
            fontSize: 58,
            fontWeight: 500,
            color: LW.muted,
            textAlign: "center",
            opacity: opIn,
          }}
        >
          ×
        </div>

        {/* ---------------- operand B: how many accounts ---------------- */}
        <Card
          x={B_X}
          y={CARD_Y}
          w={CARD_B_W}
          h={CARD_H}
          style={{
            opacity: bIn,
            transform: `translateY(${(1 - bIn) * 22}px) scale(${
              0.94 + 0.06 * bIn
            })`,
          }}
        >
          {/* a 4x4 rhyme of the field */}
          <div
            style={{
              position: "absolute",
              left: CARD_B_W / 2 - 24,
              top: GLYPH_CY - CARD_Y - 24,
              width: 48,
              height: 48,
              backgroundImage: dotTile(RN.amber),
              backgroundSize: "12px 12px",
              backgroundRepeat: "repeat",
            }}
          />
          {/* live count of lit dots -> OFFER.spots */}
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
              textAlign: "right",
            }}
          >
            {countStr}
          </div>
        </Card>

        {/* ---------------- the total ---------------- */}
        {payOp > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: PAY_X + PAY_W / 2 - 430,
                top: PAY_Y + PAY_H / 2 - 205,
                width: 860,
                height: 410,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(
                  RN.amber,
                  0.15,
                )} 0%, ${alpha(RN.amber, 0)} 68%)`,
                opacity: payOp,
              }}
            />
            <Card
              x={PAY_X}
              y={PAY_Y}
              w={PAY_W}
              h={PAY_H}
              lift
              style={{
                opacity: payOp,
                transform: `translateY(${(1 - payIn) * 26}px) scale(${
                  0.93 + 0.07 * payIn
                })`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 26,
              }}
            >
              <span
                style={{
                  ...NUM_STYLE,
                  fontSize: 58,
                  fontWeight: 500,
                  lineHeight: `${PAY_FONT}px`,
                  color: LW.muted,
                }}
              >
                =
              </span>
              <span
                style={{
                  ...NUM_STYLE,
                  fontSize: PAY_FONT,
                  lineHeight: `${PAY_FONT}px`,
                  color: RN.amber,
                }}
              >
                {OFFER.total}
              </span>
            </Card>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
