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
import {
  FONT_DISPLAY,
  FONT_SANS,
  GROW,
  LW,
  OFFER,
  PLATFORM,
  RN,
  SPRINGS,
  safePadX,
} from "./theme";

// ============================================================================
// RgP1HundredBucks — 1080x1080 @ 30fps  (1:1 insert over talking head)
// VO [0:00-0:03]: "You can run Meta ads on somebody else's hundred bucks
//                  starting Wednesday."
//
// THE READ (no narration on screen — the graphic carries it):
//   A real Runable "Run Ads" (Meta) sheet floats in Liam's warm white world.
//   The ad is built and waiting on an EMPTY funding slot. Money arrives from
//   OUTSIDE the frame — an amber Runable credit coin arcs in from off-canvas
//   and drops into that slot — the balance fills to OFFER.perUser, the black
//   Run Ads button wakes up, the real "Running Ads" status lands, and the
//   Wednesday pip on the schedule strip lights amber.
//   Funding comes from off-frame = it was never the user's money.
//
// AUTHENTICITY: every product string is transcribed from the live app
//   (public/rgrow/reference/ads-MetaAds.png + grow-04-meta-open.png):
//   "Run Ads", "Runable creates and manages Meta Ads for you.",
//   "… to ads · $0 platform fee", "… your ads balance …", GROW.sections.ads.
//   The Meta mark is a simple Meta-blue glyph (PLATFORM.meta) exactly as the
//   product renders it in its chip — no fabricated Meta/Facebook interface.
//   Every figure routes through OFFER.perUser.
//
// CAMERA: one world, one decisive move (f16→f36, 20 frames, inOut cubic),
//   then holds. Last two keys identical for a clean editor hold.
// ============================================================================

export const DURATION_IN_FRAMES = 90;

const VIEW = 1080;
const PAD = safePadX(VIEW); // 54 — 5% side safe margin

// ------------------------------------------------------------------ world
const CARD = { x: 350, y: 300, w: 820, h: 640 };
const P = 46; // card padding
const INNER_W = CARD.w - P * 2; // 728
const INNER_X = CARD.x + P; // 396

const WEEK = { w: 440, h: 104, y: 986 };
const WEEK_X = CARD.x + (CARD.w - WEEK.w) / 2; // 540

// Funding row (the "ads balance" slot the money drops into)
const ROW = { x: INNER_X, y: CARD.y + 336, w: INNER_W, h: 108 };
const SLOT = { x: ROW.x + 56, y: ROW.y + ROW.h / 2, r: 36 }; // coin lands here

// Content bounding box used for the safe-margin fit check
const CONTENT = {
  x0: CARD.x,
  x1: CARD.x + CARD.w,
  y0: CARD.y,
  y1: WEEK.y + WEEK.h,
};

// Largest zoom that still keeps every content edge inside the 5% side margin
// for a given focal x. Derived from safePadX — not hardcoded.
const fitZoom = (fx: number) => {
  const half = Math.max(CONTENT.x1 - fx, fx - CONTENT.x0);
  return (VIEW / 2 - PAD) / half;
};

// ----------------------------------------------------------------- timing
const T = {
  moveIn: 16,
  moveOut: 36,
  coinStart: 22,
  coinLand: 40,
  countEnd: 54,
  btnLive: 52,
  weekIn: 48,
  pillIn: 62,
  wedFill: 64,
} as const;

// ------------------------------------------------------------------ money
// Never hardcode the figure — everything derives from OFFER.perUser.
const AMOUNT = Number(OFFER.perUser.replace(/[^0-9.]/g, ""));
const CURRENCY = OFFER.perUser.replace(/[0-9.,\s]/g, "");
const money = (n: number) => `${CURRENCY}${Math.round(n)}`;

// Real product strings (transcribed from the live Run Ads sheet)
const SHEET = {
  title: "Run Ads",
  sub: "Runable creates and manages Meta Ads for you.",
  balance: "Ads balance",
  fee: `${OFFER.perUser} to ads · $0 platform fee`,
  cta: "Run Ads",
} as const;

const DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WED = 3;

// ------------------------------------------------------------------ camera
const ease = Easing.inOut(Easing.cubic);
const OPEN_FX = 745;
const END_FX = 760;
const OPEN_Z = Math.min(1.1, fitZoom(OPEN_FX));
const END_Z = Math.min(0.895, fitZoom(END_FX));

const KEY_T = [0, T.moveIn, T.moveOut, 74, DURATION_IN_FRAMES];
const KEY_FX = [OPEN_FX, OPEN_FX + 1, END_FX, END_FX, END_FX];
const KEY_FY = [545, 548, 695, 700, 700];
const KEY_Z = [OPEN_Z, OPEN_Z - 0.01, END_Z, END_Z - 0.004, END_Z - 0.004];

// ----------------------------------------------------------------- motion
const popAt = (frame: number, fps: number, start: number, dur = 22) =>
  frame < start
    ? 0
    : spring({
        frame: frame - start,
        fps,
        config: SPRINGS.snappy,
        durationInFrames: dur,
      });

const bez = (a: number, b: number, c: number, p: number) =>
  (1 - p) * (1 - p) * a + 2 * (1 - p) * p * b + p * p * c;

// Coin flight path (starts well outside the viewport, arcs down-left)
const FLY_FROM = { x: 1500, y: 392 };
const FLY_CTRL = { x: 1010, y: 452 };

// ------------------------------------------------------------- small parts
const MetaGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 48 28.8" fill="none">
    <path
      d="M24 13.4 C20.4 4.6 14.4 1.8 9.4 6.2 C4.2 10.8 4.6 21.4 10.4 22.8 C16.2 24.2 21 18.6 24 13.4"
      stroke={PLATFORM.meta}
      strokeWidth="4.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 13.4 C27.6 4.6 33.6 1.8 38.6 6.2 C43.8 10.8 43.4 21.4 37.6 22.8 C31.8 24.2 27 18.6 24 13.4"
      stroke={PLATFORM.meta}
      strokeWidth="4.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Runable's credit currency — the amber coin from the app's credit chip.
const Coin: React.FC<{ r: number }> = ({ r }) => (
  <svg width={r * 2} height={r * 2} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill={RN.amber} />
    <circle cx="36" cy="36" r="34" fill="url(#rgp1CoinShade)" />
    <ellipse
      cx="36"
      cy="36"
      rx="21"
      ry="25"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="3.4"
      fill="none"
    />
    <defs>
      <linearGradient id="rgp1CoinShade" x1="10" y1="6" x2="60" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
        <stop offset="1" stopColor="#A9682A" stopOpacity="0.22" />
      </linearGradient>
    </defs>
  </svg>
);

// ------------------------------------------------------------------- main
export const RgP1HundredBucks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // --- coin flight -------------------------------------------------------
  const cp = interpolate(frame, [T.coinStart, T.coinLand], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const coinX = bez(FLY_FROM.x, FLY_CTRL.x, SLOT.x, cp);
  const coinY = bez(FLY_FROM.y, FLY_CTRL.y, SLOT.y, cp);
  const coinOpacity = interpolate(frame, [T.coinStart, T.coinStart + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const settle =
    frame < T.coinLand
      ? 0
      : Math.exp(-(frame - T.coinLand) / 6) * Math.cos((frame - T.coinLand) * 0.55);
  const coinScale = 1 - 0.1 * settle;

  // trail behind the coin (money arriving from outside the frame)
  const trailPts: string[] = [];
  if (cp > 0.02) {
    for (let i = 0; i <= 20; i++) {
      const p = (cp * i) / 20;
      trailPts.push(
        `${bez(FLY_FROM.x, FLY_CTRL.x, SLOT.x, p).toFixed(1)},${bez(
          FLY_FROM.y,
          FLY_CTRL.y,
          SLOT.y,
          p
        ).toFixed(1)}`
      );
    }
  }
  const trailD = trailPts.length ? `M${trailPts.join(" L")}` : "";
  const trailOpacity =
    interpolate(frame, [T.coinStart + 2, T.coinStart + 9], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [T.coinLand, T.coinLand + 12], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // --- funding state -----------------------------------------------------
  const fundP = interpolate(frame, [T.coinLand, T.coinLand + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const counted = interpolate(frame, [T.coinLand, T.countEnd], [0, AMOUNT], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const balanceLabel = frame >= T.countEnd ? OFFER.perUser : money(counted);

  const liveP = interpolate(frame, [T.btnLive, T.btnLive + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnPop = popAt(frame, fps, T.btnLive, 20);
  const pillIn = popAt(frame, fps, T.pillIn, 20);
  const weekIn = popAt(frame, fps, T.weekIn, 24);
  const wedP = popAt(frame, fps, T.wedFill, 20);

  // card takes the weight of the coin
  const impact =
    frame < T.coinLand
      ? 0
      : Math.sin((frame - T.coinLand) * 0.72) * Math.exp(-(frame - T.coinLand) / 7) * 5;

  // micro-motion
  const glyphPulse = 1 + 0.018 * Math.sin(frame * 0.16);
  const waitShimmer = ((frame % 26) / 26) * 150 - 30; // % across the empty slot row
  const runShimmer = frame < T.pillIn ? -1 : (((frame - T.pillIn) % 36) / 36) * 150 - 30;
  const dotPulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((frame - T.pillIn) * 0.28));
  const halo = frame < T.wedFill + 8 ? 0 : 0.5 + 0.5 * Math.sin((frame - T.wedFill) * 0.22);

  const rowBg = interpolateColors(fundP, [0, 1], [RN.panel, "#FBF0E1"]);
  const rowBorder = interpolateColors(
    fundP,
    [0, 1],
    ["rgba(0,0,0,0.05)", "rgba(222,155,74,0.45)"]
  );
  const btnBg = interpolateColors(liveP, [0, 1], ["#E3DFD9", RN.ink]);
  const btnFg = interpolateColors(liveP, [0, 1], ["#A3A099", "#FFFFFF"]);

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* opaque warm-white world + subtle floor gradient — frame 0 → last */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, #FFFFFF 0%, ${LW.paper} 44%, ${LW.paperDeep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(115% 78% at 50% 30%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 62%)",
        }}
      />
      {/* amber floor glow once the money is in */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(58% 42% at 50% 62%, rgba(222,155,74,0.16) 0%, rgba(222,155,74,0) 70%)",
          opacity: fundP,
        }}
      />

      {/* ------------------------------------------------------------ camera */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* coin trail + impact ripple (world coordinates) */}
        <svg
          width={1700}
          height={1260}
          viewBox="0 0 1700 1260"
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          fill="none"
        >
          <defs>
            <linearGradient
              id="rgp1Trail"
              gradientUnits="userSpaceOnUse"
              x1={FLY_FROM.x}
              y1={FLY_FROM.y}
              x2={coinX}
              y2={coinY}
            >
              <stop offset="0" stopColor={RN.amber} stopOpacity="0" />
              <stop offset="1" stopColor={RN.amber} stopOpacity="0.55" />
            </linearGradient>
          </defs>
          {trailD && trailOpacity > 0.01 ? (
            <path
              d={trailD}
              stroke="url(#rgp1Trail)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity={trailOpacity}
            />
          ) : null}
          {frame >= T.coinLand && frame <= T.coinLand + 16 ? (
            <circle
              cx={SLOT.x}
              cy={SLOT.y}
              r={38 + (frame - T.coinLand) * 5}
              stroke={RN.amber}
              strokeWidth="3.5"
              opacity={0.5 * (1 - (frame - T.coinLand) / 16)}
            />
          ) : null}
        </svg>

        {/* ---------------------------------------------- the Run Ads sheet */}
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y + impact,
            width: CARD.w,
            height: CARD.h,
            background: LW.card,
            border: `1px solid ${LW.hairline}`,
            borderRadius: 34,
            boxShadow: LW.shadow,
            boxSizing: "border-box",
          }}
        >
          {/* Meta chip — the product's own mark treatment */}
          <div
            style={{
              position: "absolute",
              left: P,
              top: P,
              width: 88,
              height: 88,
              borderRadius: 24,
              background: RN.panel,
              border: `1px solid ${RN.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${glyphPulse})`,
            }}
          >
            <MetaGlyph size={60} />
          </div>

          {/* real status pill — the ad is running */}
          <div
            style={{
              position: "absolute",
              right: P,
              top: P + 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#F1F8F3",
              border: "1px solid rgba(29,162,90,0.28)",
              borderRadius: 999,
              padding: "11px 20px",
              opacity: pillIn,
              transform: `translateY(${(1 - pillIn) * -12}px) scale(${0.9 + 0.1 * pillIn})`,
              transformOrigin: "right center",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 8,
                background: RN.green,
                opacity: dotPulse,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 26, fontWeight: 600, color: "#177C46" }}>
              {GROW.sections.ads}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: P,
              top: 168,
              fontSize: 54,
              fontWeight: 600,
              color: LW.ink,
              letterSpacing: -0.6,
              whiteSpace: "nowrap",
            }}
          >
            {SHEET.title}
          </div>
          <div
            style={{
              position: "absolute",
              left: P,
              top: 238,
              fontSize: 27,
              color: RN.muted,
              whiteSpace: "nowrap",
            }}
          >
            {SHEET.sub}
          </div>

          <div
            style={{
              position: "absolute",
              left: P,
              top: 302,
              width: INNER_W,
              height: 1,
              background: LW.hairlineSoft,
            }}
          />

          {/* funding slot — empty, then filled from off-frame money */}
          <div
            style={{
              position: "absolute",
              left: P,
              top: ROW.y - CARD.y,
              width: ROW.w,
              height: ROW.h,
              borderRadius: 22,
              background: rowBg,
              border: `1.5px solid ${rowBorder}`,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* waiting shimmer (micro-motion from frame 0) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${waitShimmer}%`,
                width: "34%",
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(222,155,74,0) 0%, rgba(222,155,74,0.20) 50%, rgba(222,155,74,0) 100%)",
                opacity: 1 - fundP,
              }}
            />
            {/* empty coin socket */}
            <div
              style={{
                position: "absolute",
                left: SLOT.x - ROW.x - SLOT.r,
                top: SLOT.y - ROW.y - SLOT.r,
                width: SLOT.r * 2,
                height: SLOT.r * 2,
                borderRadius: SLOT.r,
                border: "2px dashed rgba(0,0,0,0.14)",
                opacity: interpolate(frame, [T.coinLand - 7, T.coinLand - 1], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: SLOT.x - ROW.x + SLOT.r + 24,
                top: ROW.h / 2 - 17,
                fontSize: 27,
                color: RN.muted,
                whiteSpace: "nowrap",
              }}
            >
              {SHEET.balance}
            </div>
            <div
              style={{
                position: "absolute",
                right: 28,
                top: ROW.h / 2 - 34,
                fontSize: 58,
                fontWeight: 600,
                fontFamily: FONT_DISPLAY,
                color: LW.ink,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -1,
                transform: `scale(${1 + 0.05 * Math.max(0, 1 - Math.abs(frame - T.countEnd) / 10) * fundP})`,
                transformOrigin: "right center",
              }}
            >
              {balanceLabel}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: P,
              top: 462,
              fontSize: 25,
              color: LW.muted,
              opacity: interpolate(frame, [T.countEnd - 8, T.countEnd + 2], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              whiteSpace: "nowrap",
            }}
          >
            {SHEET.fee}
          </div>

          {/* the black Run Ads button — inert until the money lands */}
          <div
            style={{
              position: "absolute",
              left: P,
              top: 506,
              width: INNER_W,
              height: 88,
              borderRadius: 20,
              background: btnBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transform: `scale(${1 + 0.02 * Math.sin(btnPop * Math.PI)})`,
              boxShadow: liveP > 0.5 ? "0 12px 28px rgba(17,17,17,0.18)" : "none",
            }}
          >
            {runShimmer >= 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${runShimmer}%`,
                  width: "26%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, rgba(222,155,74,0) 0%, rgba(222,155,74,0.20) 50%, rgba(222,155,74,0) 100%)",
                }}
              />
            ) : null}
            <span
              style={{
                fontSize: 34,
                fontWeight: 600,
                color: btnFg,
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              {SHEET.cta}
            </span>
          </div>
        </div>

        {/* ------------------------------------------- when it starts (Wed) */}
        <div
          style={{
            position: "absolute",
            left: WEEK_X,
            top: WEEK.y,
            width: WEEK.w,
            height: WEEK.h,
            borderRadius: 30,
            background: LW.card,
            border: `1px solid ${LW.hairline}`,
            boxShadow: LW.shadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
            boxSizing: "border-box",
            opacity: weekIn,
            transform: `translateY(${(1 - weekIn) * 20}px)`,
          }}
        >
          {DAYS.map((d, i) => {
            const on = i === WED ? wedP : 0;
            return (
              <div
                key={`${d}-${i}`}
                style={{
                  position: "relative",
                  width: 50,
                  height: 50,
                  borderRadius: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: interpolateColors(
                    on,
                    [0, 1],
                    ["rgba(222,155,74,0)", RN.amber]
                  ),
                  transform: `scale(${1 + 0.14 * Math.sin(on * Math.PI)})`,
                }}
              >
                {i === WED && halo > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: -9,
                      top: -9,
                      width: 68,
                      height: 68,
                      borderRadius: 34,
                      border: `2px solid ${RN.amber}`,
                      opacity: 0.16 + 0.16 * halo,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 600,
                    color: interpolateColors(on, [0, 1], [LW.muted, "#FFFFFF"]),
                  }}
                >
                  {d}
                </span>
              </div>
            );
          })}
        </div>

        {/* the money itself — arrives from outside the frame */}
        {frame >= T.coinStart ? (
          <div
            style={{
              position: "absolute",
              left: coinX - SLOT.r,
              top: coinY - SLOT.r,
              width: SLOT.r * 2,
              height: SLOT.r * 2,
              opacity: coinOpacity,
              transform: `scale(${coinScale})`,
              filter:
                frame < T.coinLand
                  ? "drop-shadow(0 10px 18px rgba(222,155,74,0.35))"
                  : "none",
            }}
          >
            <Coin r={SLOT.r} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
