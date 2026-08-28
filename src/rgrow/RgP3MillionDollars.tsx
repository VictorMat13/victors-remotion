import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";
import {
  FACTS,
  FONT_SANS,
  LEDGER,
  LW,
  OFFER,
  PRESS,
  RN,
  SPRINGS,
  safePadX,
} from "./theme";

// ============================================================================
// RgP3MillionDollars — 1080x1920 @ 30fps (9:16) — 330 frames / 11.0s
//
// VO [0:09-0:20]: "And the hundred bucks isn't the whole story. They're giving
// away a million dollars, and it reads like a joke. It's not. They just raised
// twenty-one million, and instead of sitting on it they're handing a million
// of it back to users."
//
// DIRECTION — "Press + Ledger blend". ONE continuous world, ONE keyframed
// camera, hold -> move -> hold:
//   000-018  hold  tight on the product credit chip (coin glyph + +$100.00)
//                  clipped to the top of an editorial card stack; the stack is
//                  defocused behind it (camera depth of field).
//   018-040  move  ease back — the real TechCrunch piece pulls into focus.
//   056-118  hold  a quiet white chip clips to the BOTTOM edge of the press
//                  card: "$1,000,000" in plain ink behind a hairline DASHED
//                  border. The dashes are the entire "unconfirmed" signal;
//                  the VO carries the joke over stillness.
//   118-136  hold  a rough amber highlighter drags itself across $21M in the
//                  real headline (article-highlights grammar: paper -> marker
//                  -> text; the stroke is an annotation, not a text effect).
//                  As it completes, the chip's dashed border resolves SOLID
//                  and a small amber dot lands — that state change is the
//                  whole "It's not."
//   140-162  move  travel down off the press stack into product space.
//   162-205  hold  Runable's cream UI: the ads-balance panel assembles over an
//                  empty ledger; one credit line item lands in the first slot;
//                  the balance ticks $0.00 -> $100.00.
//   205-228  move  pull back — the panel hands off to the ledger head and that
//                  one credit row turns out to be ONE ROW of a tall stream.
//   228-296  hold  dozens of identical credit rows scroll past; the head
//                  counter climbs to $1,000,000; a 21-segment allocation chip
//                  (20 neutral, 1 amber) docks at the side under $21M.
//   296-329  end   the stream settles to a slow drift; two near-identical
//                  camera keys for a clean editor cut.
//
// HARD RULE FOR THIS BUILD: **zero effects on words.** No motion-blur trails,
// no shine sweeps, no glow behind type, no wobble/snap on numerals, no
// per-character animation. Text only ever fades/slides as part of its card,
// ticks as a plain tabular counter, or is annotated by the marker stroke. All
// visual interest is carried by OBJECTS (cards, rows, strokes, slots) and by
// the CAMERA. Import audit: remotion core + google-fonts ONLY — no
// @remotion/motion-blur, no @remotion/effects, no @remotion/noise.
//
// On-screen text is limited to PRESS.* (verbatim), $ numerals,
// LEDGER.*, FACTS.raise and the "SERIES A" kicker. Nothing restates the VO.
// ============================================================================

const sans = loadSans("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const serif = loadSerif("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const SANS = `${sans.fontFamily}, ${FONT_SANS}`;
const SERIF = `${serif.fontFamily}, Georgia, "Times New Roman", serif`;

export const DURATION_IN_FRAMES = 330;

const VIEW_W = 1080;

const ease = Easing.inOut(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASED = { easing: ease, ...CLAMP } as const;

const TABULAR = {
  fontVariantNumeric: "tabular-nums lining-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
} as const;

// --------------------------------------------------------------- safe frame
// 5% side rule, derived from the token (54px on 1080). Every world x below was
// checked against this at the zoom it is actually framed at.
const SAFE_PAD_X = safePadX(VIEW_W); // 54

// ------------------------------------------------------------ world layout
const CX = VIEW_W / 2; // 540

// -- the press stack -------------------------------------------------------
const CARD_X = 140;
const CARD_W = VIEW_W - CARD_X * 2; // 800
const CARD_Y = 372;
const CARD_H = 780;
const CARD_PAD = 50;
const CARD_INNER = CARD_W - CARD_PAD * 2; // 700

const CHIP_W = 330;
const CHIP_H = 84;
const CHIP_CX = 690;
const CHIP_CY = CARD_Y; // straddles the card's top edge

// -- the unconfirmed-figure chip (clips to the press card's bottom edge) ---
const CHIP2_W = 560;
const CHIP2_H = 150;
const CHIP2_X = CX - CHIP2_W / 2;
const CHIP2_Y = CARD_Y + CARD_H - CHIP2_H / 2;

// -- product space ---------------------------------------------------------
const CREAM_TOP = 1235;

// one column drives the whole product surface; it reflows wider on the pull
const COL_X_NEAR = 216;
const COL_W_NEAR = 648;
const COL_X_WIDE = SAFE_PAD_X + 54; // 108
const COL_W_WIDE = VIEW_W - COL_X_WIDE * 2; // 864

const PANEL_Y = 1560;
const PANEL_H = 224;

const ALLOC_W = 272;
const ALLOC_H = 150;

const STREAM_TOP = 1800;
const STREAM_H = 1140;
const ROW_H = 100;
const ROW_PITCH = 120;
const ROW_N = 12;
const ROW_CYCLE = ROW_N * ROW_PITCH; // 1440

// --------------------------------------------------------------- beat times
const T_BACK0 = 18;
const T_BACK1 = 40;
const T_PROMO_IN = 56;
const T_HL0 = 118;
const T_HL1 = 136;
const T_DOWN0 = 140;
const T_DOWN1 = 162;
const T_PANEL_IN = 150;
const T_SLOT0 = 160;
const T_ROW_LAND = 176;
const T_TICK0 = 184;
const T_TICK1 = 197;
const T_PULL0 = 205;
const T_PULL1 = 228;
const T_FILL0 = 214;
const T_LATE0 = 226;
const T_ALLOC0 = 220;
const T_SCROLL0 = 244;
const T_END = 296;

// --------------------------------------------------------------- figures
const CREDIT_N = Number(LEDGER.credited.replace(/[^0-9.]/g, "")); // 100
const TOTAL_N = Number(LEDGER.total.replace(/[^0-9]/g, "")); // 1000000
const RAISE_UNITS = Math.max(
  2,
  Math.round(Number(FACTS.raise.replace(/[^0-9.]/g, "")) || 21),
); // 21
const GIVEN_UNITS = Math.max(
  1,
  Math.round(Number(OFFER.totalShort.replace(/[^0-9.]/g, "")) || 1),
); // 1

const money2 = (v: number) => `$${v.toFixed(2)}`;
const moneyRound = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

// the real headline, split around the phrase the marker annotates
const HEAD_PARTS = PRESS.headline.split(FACTS.raise);
const HEAD_BEFORE = HEAD_PARTS[0];
const HEAD_AFTER = HEAD_PARTS.length > 1 ? HEAD_PARTS[1] : "";

// ---------------------------------------------------------------------------
// A rough, hand-drawn marker band. Deterministic wobble, computed ONCE at
// module scope — never per frame. It sits behind the words, on the paper, and
// is revealed left-to-right by a clip inset, like dragging a highlighter.
// ---------------------------------------------------------------------------
const VB_W = 300;
const VB_H = 100;

const wobble = (i: number, s: number) =>
  Math.sin(i * 1.913 + s * 4.271) * 0.62 + Math.sin(i * 3.771 + s * 2.113) * 0.38;

const markerBand = (seed: number, top: number, bottom: number, amp: number) => {
  const N = 16;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (VB_W * i) / N;
    const y = VB_H * top + wobble(i, seed) * VB_H * amp;
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  for (let i = N; i >= 0; i--) {
    const x = (VB_W * i) / N;
    const y = VB_H * bottom + wobble(i + 37, seed + 1.7) * VB_H * amp;
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

const BAND_MAIN = markerBand(0, 0.18, 0.92, 0.075);
const BAND_PASS = markerBand(2.4, 0.33, 0.84, 0.055);

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

// Runable's credits coin glyph (a coin stack), as it reads on the live app.
const CoinGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse
      cx="12"
      cy="8.6"
      rx="8.3"
      ry="4.3"
      stroke={color}
      strokeWidth="1.75"
    />
    <path
      d="M3.7 8.6v6.2c0 2.38 3.72 4.3 8.3 4.3s8.3-1.92 8.3-4.3V8.6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

// One credit line item. Every row in the stream is this component, so the row
// the viewer watched land is literally identical to the dozens behind it.
const LedgerRow: React.FC<{ height: number }> = ({ height }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height,
      display: "flex",
      alignItems: "center",
      paddingLeft: 26,
      paddingRight: 26,
      boxSizing: "border-box",
      gap: 20,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "rgba(222,155,74,0.16)",
        border: "1px solid rgba(222,155,74,0.28)",
        flexShrink: 0,
      }}
    />
    <div
      style={{
        flex: 1,
        minWidth: 0,
        fontFamily: SANS,
        fontSize: 31,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: RN.textWarm,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {LEDGER.creditLine}
    </div>
    <div
      style={{
        fontFamily: SANS,
        fontSize: 33,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: RN.amber,
        ...TABULAR,
      }}
    >
      {LEDGER.creditAmount}
    </div>
  </div>
);

// Greeked body copy — the editorial card reads as an article without inventing
// a single word on top of a real-world artifact.
const TextBars: React.FC<{
  widths: number[];
  h: number;
  gap: number;
  color: string;
  width: number;
}> = ({ widths, h, gap, color, width }) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>
    {widths.map((w, i) => (
      <div
        key={i}
        style={{
          width: width * w,
          height: h,
          borderRadius: h / 2,
          backgroundColor: color,
        }}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const RgP3MillionDollars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- Camera: one keyframe timeline, hold -> move -> hold ----------------
  const KEY_T = [0, T_BACK0, T_BACK1, T_DOWN0, T_DOWN1, T_PULL0, T_PULL1, T_END, 314, 329];
  const FXS = [CHIP_CX, CHIP_CX, CX, CX, CX, CX, CX, CX, CX, CX];
  const FYS = [372, 372, 762, 762, 1910, 1910, 2270, 2270, 2278, 2279];
  const ZS = [2.5, 2.5, 1.16, 1.16, 1.48, 1.48, 1.0, 1.0, 0.998, 0.997];

  const fx = interpolate(frame, KEY_T, FXS, EASED);
  const fy = interpolate(frame, KEY_T, FYS, EASED);
  const z = interpolate(frame, KEY_T, ZS, EASED);

  // ---- Beat 1: the press stack resolving out of camera defocus ------------
  const cardBlur = interpolate(frame, [0, 22, 48], [9, 9, 0], {
    easing: easeOut,
    ...CLAMP,
  });
  const stackIn = (i: number) =>
    Math.min(
      1,
      spring({
        frame: Math.max(0, frame - (4 + i * 5)),
        fps,
        config: SPRINGS.smooth,
      }),
    );
  const chipFloat = Math.sin(frame / 14) * 1.6;

  // ---- Beat 2: the unconfirmed-figure chip -------------------------------
  const chip2In = Math.min(
    1,
    spring({
      frame: Math.max(0, frame - T_PROMO_IN),
      fps,
      config: SPRINGS.smooth,
    }),
  );
  // dashed -> solid as the marker stroke completes; the chip's only "event"
  const resolve = interpolate(frame, [T_HL1 - 8, T_HL1 + 6], [0, 1], EASED);
  const chip2Alive = frame >= T_PROMO_IN - 2;

  // ---- Beat 3: the marker stroke over $21M -------------------------------
  const hl = interpolate(frame, [T_HL0, T_HL1], [0, 1], {
    easing: easeOut,
    ...CLAMP,
  });

  // ---- product space ------------------------------------------------------
  const creamIn = interpolate(frame, [134, 156], [0, 1], EASED);

  // the column reflows wider as the camera pulls back
  const pull = interpolate(frame, [T_PULL0, T_PULL1], [0, 1], EASED);
  const colX = interpolate(pull, [0, 1], [COL_X_NEAR, COL_X_WIDE]);
  const colW = interpolate(pull, [0, 1], [COL_W_NEAR, COL_W_WIDE]);

  // ---- Beat 4: the ads-balance panel --------------------------------------
  const panelIn = Math.min(
    1,
    spring({
      frame: Math.max(0, frame - T_PANEL_IN),
      fps,
      config: SPRINGS.snappy,
    }),
  );
  const panelOut = interpolate(frame, [T_PULL0, T_PULL0 + 16], [1, 0], EASED);
  // plain tabular counter — the only thing that ever "happens" to a numeral
  const balValue = interpolate(frame, [T_TICK0, T_TICK1], [0, CREDIT_N], {
    easing: easeOut,
    ...CLAMP,
  });
  const deltaIn = interpolate(frame, [T_TICK0 - 2, T_TICK0 + 10], [0, 1], EASED);

  // ---- Beat 5: the ledger head, the stream, the allocation chip -----------
  const headIn = interpolate(frame, [T_PULL0 + 5, T_PULL0 + 27], [0, 1], EASED);
  const scroll = interpolate(
    frame,
    [T_SCROLL0, T_SCROLL0 + 18, 300, 314, 329],
    [0, 62, 1020, 1140, 1196],
    CLAMP,
  );
  const maskTop = interpolate(frame, [236, 252], [1, 90], CLAMP);
  const maskCss = `linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${maskTop.toFixed(
    1,
  )}px, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)`;
  const totalValue = interpolate(frame, [218, T_END + 2], [0, TOTAL_N], {
    easing: easeOut,
    ...CLAMP,
  });
  const totalStep = Math.round(totalValue / 1000) * 1000;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: LW.paper,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* screen-space paper light — background only, bleeds full frame */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(118% 58% at 50% 14%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(23,20,14,0.045) 100%)",
        }}
      />

      {/* ============================ the world ============================ */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: 3400,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------------------- editorial card stack ------------------- */}
        {[
          { x: 196, w: 688, y: 400, h: 790, o: 0.55, i: 1 },
          { x: 168, w: 744, y: 386, h: 784, o: 0.78, i: 0 },
        ].map((c) => (
          <div
            key={`stack${c.i}`}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              borderRadius: 18,
              backgroundColor: LW.cardSoft,
              border: `1px solid ${LW.hairline}`,
              boxShadow: LW.shadow,
              opacity: c.o * stackIn(c.i),
              filter: `blur(${1.2 + cardBlur * 0.5}px)`,
            }}
          />
        ))}

        {/* the real TechCrunch piece */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 20,
            backgroundColor: LW.card,
            border: `1px solid ${LW.hairline}`,
            boxShadow: LW.shadowLift,
            padding: CARD_PAD,
            boxSizing: "border-box",
            filter: `blur(${cardBlur}px)`,
          }}
        >
          {/* masthead — the outlet name simply SET, never fabricated logo art */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              height: 50,
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: LW.ink,
              }}
            >
              {PRESS.outlet}
            </div>
            <div
              style={{ width: 1, height: 30, backgroundColor: "rgba(0,0,0,0.14)" }}
            />
            <div
              style={{
                fontFamily: SANS,
                fontSize: 25,
                fontWeight: 500,
                color: LW.muted,
              }}
            >
              {PRESS.date}
            </div>
          </div>

          <div
            style={{
              marginTop: 32,
              width: CARD_INNER,
              height: 1,
              backgroundColor: "rgba(0,0,0,0.10)",
            }}
          />

          {/* headline — editorial serif, annotated on $21M by the marker */}
          <div
            style={{
              marginTop: 38,
              width: CARD_INNER,
              fontFamily: SERIF,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: "-0.012em",
              color: LW.ink,
            }}
          >
            <span>{HEAD_BEFORE}</span>
            <span style={{ position: "relative", display: "inline-block" }}>
              <span
                style={{
                  position: "absolute",
                  left: -15,
                  right: -17,
                  top: 4,
                  bottom: -7,
                  clipPath: `inset(0 ${((1 - hl) * 100).toFixed(2)}% 0 0)`,
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  preserveAspectRatio="none"
                  style={{ display: "block", mixBlendMode: "multiply" }}
                >
                  <path d={BAND_MAIN} fill="rgba(222,155,74,0.46)" />
                  <path d={BAND_PASS} fill="rgba(214,140,58,0.30)" />
                </svg>
              </span>
              <span style={{ position: "relative" }}>{FACTS.raise}</span>
            </span>
            <span>{HEAD_AFTER}</span>
          </div>

          <div style={{ position: "absolute", left: CARD_PAD, top: 512 }}>
            <TextBars
              widths={[1, 0.96, 0.99, 0.92, 0.97, 0.94, 0.58]}
              h={13}
              gap={22}
              color="rgba(0,0,0,0.055)"
              width={CARD_INNER}
            />
          </div>
        </div>

        {/* the product credit chip, clipped to the top of the stack */}
        <div
          style={{
            position: "absolute",
            left: CHIP_CX - CHIP_W / 2,
            top: CHIP_CY - CHIP_H / 2 + chipFloat,
            width: CHIP_W,
            height: CHIP_H,
            borderRadius: CHIP_H / 2,
            backgroundColor: "#FDF6EC",
            border: "1.5px solid rgba(222,155,74,0.38)",
            boxShadow: `0 ${12 + chipFloat}px ${26 - chipFloat * 2}px rgba(150,98,34,0.17), 0 2px 5px rgba(23,20,14,0.06)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 15,
          }}
        >
          <CoinGlyph size={38} color={RN.amber} />
          <div
            style={{
              fontFamily: SANS,
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "#B9762C",
              ...TABULAR,
            }}
          >
            {LEDGER.creditAmount}
          </div>
        </div>

        {/* -------------- the unconfirmed-figure chip -------------------- */}
        {chip2Alive ? (
          <div
            style={{
              position: "absolute",
              left: CHIP2_X,
              top: CHIP2_Y,
              width: CHIP2_W,
              height: CHIP2_H,
              borderRadius: 24,
              backgroundColor: LW.card,
              boxShadow:
                "0 16px 38px rgba(23,20,14,0.10), 0 2px 6px rgba(23,20,14,0.05)",
              translate: `0 ${(1 - chip2In) * 90}px`,
              opacity: interpolate(chip2In, [0, 0.35], [0, 1], CLAMP),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
            }}
          >
            {/* hairline border: dashed while unconfirmed, solid once backed */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                border: "1.5px dashed rgba(0,0,0,0.22)",
                opacity: 1 - resolve,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                border: "1.5px solid rgba(0,0,0,0.16)",
                opacity: resolve,
              }}
            />

            {/* lands together with the marker stroke */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: RN.amber,
                scale: String(0.4 + 0.6 * resolve),
                opacity: resolve,
              }}
            />
            <div
              style={{
                fontFamily: SANS,
                fontSize: 58,
                fontWeight: 650,
                letterSpacing: "-0.02em",
                color: LW.ink,
                ...TABULAR,
              }}
            >
              {OFFER.total}
            </div>
          </div>
        ) : null}

        {/* ======================= product space ========================= */}
        <div
          style={{
            position: "absolute",
            left: -100,
            top: CREAM_TOP,
            width: VIEW_W + 200,
            height: 3400 - CREAM_TOP,
            backgroundColor: RN.bg,
            borderTop: `1px solid ${RN.borderStrong}`,
            boxShadow: "0 -16px 40px rgba(23,20,14,0.06)",
            opacity: creamIn,
          }}
        />

        {/* --- the ledger head (beat 5) ---------------------------------- */}
        <div
          style={{
            position: "absolute",
            left: colX,
            top: PANEL_Y,
            width: colW - ALLOC_W - 40,
            opacity: headIn,
            translate: `0px ${interpolate(headIn, [0, 1], [18, 0])}px`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 28,
              fontWeight: 500,
              color: RN.muted,
            }}
          >
            {LEDGER.totalLabel}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: SANS,
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.028em",
              color: RN.text,
              ...TABULAR,
            }}
          >
            {moneyRound(totalStep)}
          </div>
        </div>

        {/* --- the allocation chip, docked at the side ------------------- */}
        <div
          style={{
            position: "absolute",
            left: colX + colW - ALLOC_W,
            top: PANEL_Y - 6,
            width: ALLOC_W,
            height: ALLOC_H,
            borderRadius: 18,
            backgroundColor: RN.card,
            border: `1px solid ${RN.borderStrong}`,
            boxShadow: "0 10px 26px rgba(23,20,14,0.055)",
            padding: 20,
            boxSizing: "border-box",
            opacity: headIn,
            translate: `0px ${interpolate(headIn, [0, 1], [18, 0])}px`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: RN.muted,
            }}
          >
            SERIES A
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: SANS,
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: RN.text,
              ...TABULAR,
            }}
          >
            {FACTS.raise}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 4,
              alignItems: "flex-end",
              height: 30,
            }}
          >
            {new Array(RAISE_UNITS).fill(0).map((_, i) => {
              const seg = Math.min(
                1,
                spring({
                  frame: Math.max(0, frame - (T_ALLOC0 + i)),
                  fps,
                  config: SPRINGS.snappy,
                }),
              );
              const isGiven = i >= RAISE_UNITS - GIVEN_UNITS;
              const lit = isGiven
                ? interpolate(
                    frame,
                    [T_ALLOC0 + 30, T_ALLOC0 + 44],
                    [0, 1],
                    CLAMP,
                  )
                : 0;
              return (
                <div
                  key={`seg${i}`}
                  style={{
                    flex: 1,
                    height: 30 * (0.5 + 0.5 * seg),
                    borderRadius: 2,
                    backgroundColor: lit > 0.02 ? RN.amber : "rgba(0,0,0,0.12)",
                    opacity: seg * (isGiven ? 0.3 + 0.7 * lit : 1),
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* --- the ads-balance panel (beat 4) ---------------------------- */}
        <div
          style={{
            position: "absolute",
            left: colX,
            top: PANEL_Y,
            width: colW,
            height: PANEL_H,
            borderRadius: 24,
            backgroundColor: RN.card,
            border: `1px solid ${RN.borderStrong}`,
            boxShadow:
              "0 18px 44px rgba(23,20,14,0.075), 0 2px 6px rgba(23,20,14,0.04)",
            padding: 36,
            boxSizing: "border-box",
            opacity: panelIn * panelOut,
            translate: `0px ${interpolate(panelIn, [0, 1], [26, 0])}px`,
            scale: interpolate(panelIn, [0, 1], [0.95, 1]),
            zIndex: 3,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CoinGlyph size={30} color={RN.amber} />
            <div
              style={{
                fontFamily: SANS,
                fontSize: 28,
                fontWeight: 500,
                color: RN.muted,
              }}
            >
              {LEDGER.balanceLabel}
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 80,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.028em",
                color: RN.text,
                ...TABULAR,
              }}
            >
              {money2(balValue)}
            </div>
            <div
              style={{
                marginBottom: 12,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 22,
                backgroundColor: RN.amberSoft,
                border: "1px solid rgba(222,155,74,0.3)",
                fontFamily: SANS,
                fontSize: 27,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#B9762C",
                ...TABULAR,
                opacity: deltaIn,
                translate: `0px ${interpolate(deltaIn, [0, 1], [10, 0])}px`,
              }}
            >
              {LEDGER.creditAmount}
            </div>
          </div>
        </div>

        {/* --- the ledger: empty slots that fill, then stream ------------ */}
        <div
          style={{
            position: "absolute",
            left: colX,
            top: STREAM_TOP,
            width: colW,
            height: STREAM_H,
            overflow: "hidden",
            WebkitMaskImage: maskCss,
            maskImage: maskCss,
          }}
        >
          {new Array(ROW_N).fill(0).map((_, i) => {
            const raw = i * ROW_PITCH - scroll;
            const y =
              (((raw + ROW_PITCH) % ROW_CYCLE) + ROW_CYCLE) % ROW_CYCLE -
              ROW_PITCH;
            // rows 0-3 exist as empty slots from beat 4 and fill in order;
            // rows 4+ arrive already filled, strictly after them, so the
            // stream never shows a hole in the middle of the list
            const early = i <= 3;
            const appear = Math.min(
              1,
              spring({
                frame: Math.max(
                  0,
                  frame - (early ? T_SLOT0 + i * 4 : T_LATE0 + (i - 4) * 2.2),
                ),
                fps,
                config: SPRINGS.smooth,
              }),
            );
            const fill =
              i === 0
                ? Math.min(
                    1,
                    spring({
                      frame: Math.max(0, frame - T_ROW_LAND),
                      fps,
                      config: SPRINGS.snappy,
                    }),
                  )
                : early
                  ? Math.min(
                      1,
                      spring({
                        frame: Math.max(0, frame - (T_FILL0 + (i - 1) * 4)),
                        fps,
                        config: SPRINGS.snappy,
                      }),
                    )
                  : appear;
            return (
              <div
                key={`row${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: y,
                  width: colW,
                  height: ROW_H,
                  borderRadius: 18,
                  backgroundColor: RN.panel,
                  opacity: appear,
                  translate: `0px ${interpolate(appear, [0, 1], [18, 0])}px`,
                }}
              >
                {/* the slot fills: panel -> white card + the line item */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 18,
                    backgroundColor: RN.card,
                    border: `1px solid ${RN.border}`,
                    boxShadow: "0 6px 18px rgba(23,20,14,0.05)",
                    opacity: fill,
                  }}
                />
                <div style={{ opacity: fill }}>
                  <LedgerRow height={ROW_H} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
