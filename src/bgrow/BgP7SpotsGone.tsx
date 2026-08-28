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
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import {
  BRAND,
  FACTS,
  FONT_UI,
  MRD,
  MRD_GRADIENT,
  MRD_GRID,
  SPRINGS,
  safePadX,
} from "./theme";

loadInter();

// ===========================================================================
// BgP7SpotsGone — 1080x1920 @ 30fps — 216 frames (7.2s)
// 0:51 CTA  [9:16]  ·  LAST part of the Bennett x Runable GROW reel.
// VO: "Once those ten thousand spots are gone, they're gone.
//      comment RUN and ill send you the link to try it."
//
// ONE WORLD, ONE CAMERA. A single vertical Merydian-dark column:
//
//   station 1 (world y 500..1584)   the scarcity ledger
//                                   odometer numeral + "SPOTS" unit label +
//                                   a 16x16 field of 256 spring-green units,
//                                   one unit = 39 of the 10,000 spots.
//   station 2 (world y 2340..2710)  the payoff
//                                   Runable's real light lockup + Merydian's
//                                   own green pill CTA (black label, dark
//                                   circular arrow badge) — the shape lifted
//                                   straight off merydian.ai's hero.
//
// Colour story: green IS the opportunity. It drains cell by cell out of the
// field until the frame holds no green at all, then the camera travels down
// and the pill is the only green left on screen.
//
// Beat map (hold -> move -> hold, moves 18-24f, Easing.inOut(cubic)):
//   f0-16    HOLD  tight on the odometer, units already going out below
//   f16-38   MOVE  pull back (z 1.48 -> 1.18) — the full 10,000 is revealed
//   f38-86   HOLD  the field drains hard; the odometer races
//   f86-104  MOVE  push back in on the numeral (z 1.18 -> 1.40)
//   f104-124 HOLD  lands on 0 at f110 — pop + green flash on the rule
//   f124-148 MOVE  travel down to the payoff (24f)
//   f148-186 HOLD  pill settles, lockup lifts in, glow blooms
//   f186-216 DEAD STILL — 30 frames, nothing moves, clean cut-out for the editor
//
// HARD RULES honoured: opaque root bg f0..f215 (the drained field keeps 13%
// white slots so the depleting beat never empties toward black); every content
// element inside x = 54..1026 at EVERY camera key; no on-screen text restating
// the VO — only the permitted spots numeral, its unit label, and the literal
// ManyChat trigger word RUN.
// ===========================================================================

export const DURATION_IN_FRAMES = 216;

const EASE = Easing.inOut(Easing.cubic);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// FACTS.giveawaySpots is the display string "10,000" — the count comes from it.
const SPOTS_TOTAL = Number(FACTS.giveawaySpots.replace(/[^0-9]/g, ""));

// ------------------------------------------------------------------ timeline
const T = {
  countStart: 6,
  countEnd: 110,
  pillSettle: 142,
  glowStart: 144,
  lockupIn: 146,
  badgeIn: 150,
  /** Everything is resolved by f174; frozen here so 186..215 are identical. */
  freeze: 186,
} as const;

// -------------------------------------------------------------------- camera
const CAM_T = [0, 16, 38, 86, 104, 124, 148, 186, 216];
const CAM_FY = [660, 660, 1040, 1040, 660, 660, 2600, 2600, 2600];
const CAM_Z = [1.48, 1.48, 1.18, 1.18, 1.4, 1.4, 1.24, 1.24, 1.24];
/**
 * Merydian's spring-green light wash. Stops are placed in world y and then
 * expressed as percentages of the -900..3400 backdrop, so the shafts pool
 * over the ledger (world ~-300) and over the payoff (world ~2200) with no
 * hard edge anywhere the camera can travel.
 */
const WORLD_WASH =
  "linear-gradient(180deg," +
  " rgba(0,255,171,0.10) 0%," +
  " rgba(0,255,171,0.10) 13%," +
  " rgba(0,255,171,0.00) 38%," +
  " rgba(0,255,171,0.00) 57%," +
  " rgba(0,255,171,0.12) 72%," +
  " rgba(0,255,171,0.00) 100%)";

const Z_PEAK = 1.48; // tightest key — sizes the safe world width
const Z_END = 1.24; // the payoff key — sizes the pill

// --------------------------------------------------------- world (y, in px)
const NUM_CY = 600; // odometer centre
const NUM_SIZE = 176;
const LABEL_CY = 766;
const RULE_Y = 856;
const FIELD_Y = 940;
const LOCKUP_CY = 2400;
const PILL_CY = 2620;
const PILL_H = 176;

const FIELD_COLS = 16;
const FIELD_ROWS = 16;
const FIELD_GAP = 12;
const FIELD_N = FIELD_COLS * FIELD_ROWS; // 256 units
const FADE_UNITS = 10; // soft edge: units mid-extinguish at any instant

/** Deterministic extinguish order — spots get taken all over the field. */
const EXTINGUISH_ORDER: number[] = (() => {
  const idx = Array.from({ length: FIELD_N }, (_, i) => i);
  let s = 20260827 % 2147483647;
  const rnd = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
  for (let i = FIELD_N - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }
  const order = new Array<number>(FIELD_N);
  idx.forEach((cellIdx, r) => {
    order[cellIdx] = r;
  });
  return order;
})();

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- CTA glyphs

const CommentGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 3.2h12A3.8 3.8 0 0 1 21.8 7v6.6A3.8 3.8 0 0 1 18 17.4h-6.1l-4.35 3.34a.85.85 0 0 1-1.37-.67V17.4H6A3.8 3.8 0 0 1 2.2 13.6V7A3.8 3.8 0 0 1 6 3.2Z"
      fill={MRD.greenInk}
    />
  </svg>
);

const ArrowBadge: React.FC<{ size: number; nudge: number }> = ({
  size,
  nudge,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill={MRD.bg} />
    <g transform={`translate(${nudge} 0)`}>
      <path
        d="M17 24h13.4M25.4 18.8 30.8 24l-5.4 5.2"
        stroke={MRD.green}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// ===========================================================================

export const BgP7SpotsGone: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Every element animation reads `t`, so the last 30 frames are dead still.
  const t = Math.min(frame, T.freeze);

  // --- 5% side safe margin -> the widest anything may be in world units ----
  const padX = safePadX(width); // 54 on 1080
  const contentW = width - padX * 2; // 972
  const worldSafeW = contentW / Z_PEAK; // 656 — safe at the TIGHTEST key
  const cell = Math.floor(
    (worldSafeW - FIELD_GAP * (FIELD_COLS - 1)) / FIELD_COLS,
  ); // 29
  const fieldW = FIELD_COLS * cell + FIELD_GAP * (FIELD_COLS - 1); // 644
  // field height is fieldW (square, 644) — world y 940..1584
  const fieldX = Math.round(width / 2 - fieldW / 2); // 218
  const pillW = Math.min(560, Math.floor(contentW / Z_END)); // 560

  const digitW = NUM_SIZE * 0.615;
  const commaW = NUM_SIZE * 0.3;

  // --- camera --------------------------------------------------------------
  const fx = width / 2;
  const fy = interpolate(frame, CAM_T, CAM_FY, { easing: EASE, ...CLAMP });
  const z = interpolate(frame, CAM_T, CAM_Z, { easing: EASE, ...CLAMP });

  // --- the depleting count -------------------------------------------------
  const spots = interpolate(t, [T.countStart, T.countEnd], [SPOTS_TOTAL, 0], {
    easing: EASE,
    ...CLAMP,
  });
  const shown = Math.round(spots);
  const deadFront =
    (FIELD_N + FADE_UNITS) * (1 - spots / SPOTS_TOTAL) - FADE_UNITS;

  // Odometer slots — fixed width, so nothing reflows as digits fall away.
  const s = String(shown).padStart(5, "0");
  const sig = s.search(/[1-9]/);
  const firstSig = sig === -1 ? 4 : sig;

  // --- landing on zero -----------------------------------------------------
  const landP = spring({
    frame: t - T.countEnd,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 30,
  });
  const landPulse = t >= T.countEnd ? Math.sin(landP * Math.PI) : 0;

  // --- payoff --------------------------------------------------------------
  const pillP = spring({
    frame: t - T.pillSettle,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 26,
  });
  const pillScale = interpolate(pillP, [0, 1], [0.965, 1]);
  const runTrack = interpolate(pillP, [0, 1], [18, 4]);
  const bloom = interpolate(
    t,
    [T.glowStart, T.glowStart + 30],
    [0.3, 1],
    CLAMP,
  );
  const lockP = spring({
    frame: t - T.lockupIn,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 24,
  });
  const badgeP = spring({
    frame: t - T.badgeIn,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 22,
  });

  const badgeD = 112;
  const lockupW = 268;
  const lockupH = Math.round((lockupW * 818) / 3534);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        backgroundImage: MRD_GRADIENT.ground,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------- backdrop: Merydian's faint vertical rules ---------- */}
        <div
          style={{
            position: "absolute",
            left: -520,
            top: -900,
            width: 2120,
            height: 4400,
            backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0px, ${MRD_GRID.color} 1px, transparent 1px, transparent ${MRD_GRID.spacing}px)`,
          }}
        />
        {/* ---------- backdrop: Merydian's light bleeding from above -------
            ONE continuous wash across the whole world (world y -900..3400),
            so no camera position can ever land on a hard gradient edge. It
            pools twice: over the ledger, then again over the payoff.        */}
        <div
          style={{
            position: "absolute",
            left: -520,
            top: -900,
            width: 2120,
            height: 4300,
            backgroundImage: WORLD_WASH,
          }}
        />

        {/* ================= STATION 1 — the scarcity ledger ============== */}

        {/* odometer */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - (digitW * 5 + commaW) / 2,
            top: NUM_CY - NUM_SIZE * 0.72,
            width: digitW * 5 + commaW,
            height: NUM_SIZE * 1.44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + 0.05 * landPulse})`,
            transformOrigin: "50% 50%",
          }}
        >
          {[s[0], s[1], ",", s[2], s[3], s[4]].map((ch, i) => {
            // i: 0,1 = digits 0,1 · 2 = comma · 3,4,5 = digits 2,3,4
            const isComma = i === 2;
            const digitIndex = i < 2 ? i : i - 1;
            const dim = isComma ? firstSig >= 2 : digitIndex < firstSig;
            return (
              <div
                key={i}
                style={{
                  width: isComma ? commaW : digitW,
                  textAlign: "center",
                  fontFamily: FONT_UI,
                  fontSize: NUM_SIZE,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -2,
                  fontVariantNumeric: "tabular-nums",
                  fontFeatureSettings: '"tnum" 1',
                  color: dim ? MRD.muted : MRD.text,
                  opacity: dim ? 0.18 : 1,
                  textShadow:
                    landPulse > 0.02 && !dim
                      ? `0 0 ${34 * landPulse}px rgba(0,255,171,${0.55 * landPulse})`
                      : "none",
                }}
              >
                {ch}
              </div>
            );
          })}
        </div>

        {/* unit label for the counter */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: LABEL_CY - 22,
            width,
            textAlign: "center",
            fontFamily: FONT_UI,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: 11,
            color: MRD.muted,
          }}
        >
          SPOTS
        </div>

        {/* rule — flashes green on the landing */}
        <div
          style={{
            position: "absolute",
            left: fieldX,
            top: RULE_Y,
            width: fieldW,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: fieldX,
            top: RULE_Y,
            width: fieldW,
            height: 2,
            backgroundColor: MRD.green,
            opacity: 0.85 * landPulse,
            transform: `scaleX(${interpolate(landPulse, [0, 1], [0.25, 1])})`,
            transformOrigin: "50% 50%",
            boxShadow: MRD.glowSoft,
          }}
        />

        {/* the field of spots */}
        {Array.from({ length: FIELD_N }, (_, i) => {
          const col = i % FIELD_COLS;
          const row = Math.floor(i / FIELD_COLS);
          const order = EXTINGUISH_ORDER[i];
          // deadFront sweeps -FADE_UNITS (all lit) -> FIELD_N (all spent), so
          // the boundary clears the very last unit exactly when spots hit 0.
          const life = clamp01((order - deadFront) / FADE_UNITS);
          const flash = life * (1 - life) * 4;
          const shimmer = 0.87 + 0.13 * Math.sin((t + order * 0.9) * 0.22);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: fieldX + col * (cell + FIELD_GAP),
                top: FIELD_Y + row * (cell + FIELD_GAP),
                width: cell,
                height: cell,
                borderRadius: 6,
                backgroundColor: `rgba(255,255,255,${0.13 + 0.07 * landPulse})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 6,
                  backgroundColor: MRD.green,
                  opacity: life * shimmer,
                  boxShadow:
                    flash > 0.08
                      ? `0 0 ${8 + 16 * flash}px rgba(0,255,171,${0.55 * flash})`
                      : "none",
                }}
              />
            </div>
          );
        })}

        {/* ================= STATION 2 — the payoff ======================= */}

        {/* ground glow under the pill */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - 500,
            top: PILL_CY - 260,
            width: 1000,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(0,255,171,0.26) 0%, rgba(0,255,171,0.10) 42%, rgba(0,255,171,0) 78%)",
            opacity: bloom,
          }}
        />

        {/* Runable's own light lockup */}
        <Img
          src={staticFile(BRAND.runableLight)}
          style={{
            position: "absolute",
            left: width / 2 - lockupW / 2,
            top: LOCKUP_CY - lockupH / 2 + interpolate(lockP, [0, 1], [14, 0]),
            width: lockupW,
            height: lockupH,
            opacity: interpolate(lockP, [0, 1], [0.55, 1]),
          }}
        />

        {/* the Merydian green pill — the comment keyword lands here */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - pillW / 2,
            top: PILL_CY - PILL_H / 2,
            width: pillW,
            height: PILL_H,
            borderRadius: PILL_H / 2,
            backgroundImage: MRD_GRADIENT.cta,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 58,
            paddingRight: 24,
            transform: `scale(${pillScale})`,
            transformOrigin: "50% 50%",
            boxShadow: `0 0 ${34 + 46 * bloom}px rgba(0,255,171,${0.16 + 0.22 * bloom})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <CommentGlyph size={64} />
            <div
              style={{
                fontFamily: FONT_UI,
                fontSize: 92,
                fontWeight: 800,
                letterSpacing: runTrack,
                color: MRD.greenInk,
                lineHeight: 1,
                paddingLeft: 2,
              }}
            >
              {FACTS.commentKeyword}
            </div>
          </div>
          <ArrowBadge
            size={badgeD}
            nudge={interpolate(badgeP, [0, 1], [-6, 0])}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
