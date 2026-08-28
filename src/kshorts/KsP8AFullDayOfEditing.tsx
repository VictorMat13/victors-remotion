import React from "react";
import {
  AbsoluteFill,
  Easing,
  Solid,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise } from "@remotion/effects/noise";
import { vignette } from "@remotion/effects/vignette";
import { FONT_DISPLAY, FONT_SANS, LW, RN, SPRINGS, safePadX } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP8AFullDayOfEditing — 1080x1080 @ 30fps  (1:1)
// VO.p8: "That would normally take me a full day of editing, every single
// video."  (spoken only — never on screen)
//
// THE ROI BEAT. One continuous white world holds two floating cards, each a
// single elapsed-time readout for the SAME job (one video, edited). The
// contrast is carried entirely by how long each one takes to finish and by the
// figure it lands on — no captions, no labels, no narration echoed.
//
//   LEFT  — by hand. Muted, heavy. Its track is divided into eight hour ticks
//           and it grinds across all of them, hour by hour, for two full
//           seconds. The length IS the point.
//   RIGHT — the agent. Amber, Runable's own mark, one snap, done in minutes.
//
// BEATS
//   0-20    tight on the manual card. Track empty, counter at 0.0. Idle
//           shimmer sweeps the empty track; camera creeps in.
//   20-80   HOLD — the track grinds through eight hour ticks, each one
//           flaring as the fill edge crosses it. Counter climbs to 8.0.
//   80-98   MOVE (18f) — pull back and travel right; the manual card recedes
//           and the agent card comes into the world.
//   98-108  settle out of the overshoot (10f), agent mark arms.
//   103-116 HOLD — the agent track fills in one snap; counter lands at 9.
//   113-132 amber emphasis pulse, decaying to nothing.
//   132-139 dead-still end hold, both figures readable side by side.
//
// TYPE: every numeral is `tabular-nums` so the digits never jitter while the
// counters run. The only strings on screen are the two figures and their unit
// suffixes — allowed as the data/units the graphic IS about.
// ============================================================================

export const DURATION_IN_FRAMES = 140;

// ------------------------------------------------------------------- geometry
const VIEW = 1080;
const PAD = safePadX(VIEW); // 54 — hard 5% side margin
const WORLD_W = 1890;
const WORLD_H = 1080;

const CARD_W = 640;
const CARD_H = 780;
const CARD_Y = Math.round((WORLD_H - CARD_H) / 2); // 150
const A_X = 195;
const B_X = 1055; // gap 220 — wide enough that B is off-frame on the open

const A_CX = A_X + CARD_W / 2; // 515
const B_CX = B_X + CARD_W / 2; // 1375
const CARD_CY = CARD_Y + CARD_H / 2; // 540

const CONTENT_SPAN = B_X + CARD_W - A_X; // 1500
const CONTENT_CX = A_X + CONTENT_SPAN / 2; // 945
// widest framing still clears the 5% margins with 12px of air on each side
const Z_WIDE = (VIEW - PAD * 2 - 24) / CONTENT_SPAN; // 0.632

// card interior
const PAD_IN = 48;
const INNER_W = CARD_W - PAD_IN * 2; // 544
const ICON_BOX = 68;
const TRACK_H = 16;
const TRACK_Y = CARD_H - PAD_IN - TRACK_H; // 716
// the figure sits centred in the air between the icon tile and the track
const NUM_BLOCK_H = 250;
const NUM_BLOCK_Y = Math.round(
  (PAD_IN + ICON_BOX + TRACK_Y) / 2 - NUM_BLOCK_H / 2,
); // 291
const NUM_SIZE = 210;
const UNIT_SIZE = 64;

// ---------------------------------------------------------------------- time
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);
const GRIND_EASE = Easing.inOut(Easing.sin);

// the figures. Hours by hand, minutes with the agent.
const MANUAL_HOURS = 8; // a full working day
const AGENT_MINUTES = 9;
const HOUR_TICKS = MANUAL_HOURS; // eight divisions = the track's axis

// the grind: one keyframe per hour, unevenly spaced so it chugs rather than
// ticks like a metronome. 60 frames to cross eight hours.
const MAN_T = [20, 29, 36, 45, 51, 60, 67, 74, 80];
const MAN_V = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => h / MANUAL_HOURS);
const MAN_EASE = [
  GRIND_EASE,
  GRIND_EASE,
  GRIND_EASE,
  GRIND_EASE,
  GRIND_EASE,
  GRIND_EASE,
  GRIND_EASE,
  Easing.out(Easing.quad),
];

const AGENT_START = 103;
const AGENT_END = 116;
const PULSE_T = [113, 120, 132];
const MOVE_START = 80;
const MOVE_END = 98;
const SETTLE_END = 108;

// ------------------------------------------------------------------- helpers
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const GRIND_INK = "#8E8177"; // the heavy, unpaid colour of doing it yourself
const GRIND_INK_LIGHT = "#ACA298";

// elevation, interpolated rather than swapped, so nothing pops mid-pan.
// `glow` adds the amber emphasis halo on the agent card's completion.
const elevation = (lift: number, glow: number) => {
  const base =
    `0 ${18 + 16 * lift}px ${44 + 36 * lift}px rgba(23,20,14,${(
      0.1 +
      0.04 * lift
    ).toFixed(3)}), 0 ${2 + 2 * lift}px ${6 + 4 * lift}px rgba(23,20,14,${(
      0.05 +
      0.01 * lift
    ).toFixed(3)})`;
  return glow > 0.005
    ? `${base}, 0 0 ${70 + 60 * glow}px ${alpha(RN.amber, 0.42 * glow)}`
    : base;
};

// ------------------------------------------------------------------- glyphs
// By hand: a scissors. Nothing on the manual card is Runable's.
const Scissors: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.7}
    strokeLinecap="round"
  >
    <circle cx="6" cy="17.4" r="3" />
    <circle cx="18" cy="17.4" r="3" />
    <line x1="8.2" y1="15.3" x2="19.6" y2="3.9" />
    <line x1="15.8" y1="15.3" x2="4.4" y2="3.9" />
  </svg>
);

// The real Runable mark (public/kshorts/runable-mark.svg), inlined so it can
// take the amber accent directly.
const RunableMark: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={Math.round((size * 665) / 737)}
    viewBox="0 0 737 665"
    fill="none"
  >
    <path
      d="M499.606 664.888C558.427 664.888 606.111 617.204 606.111 558.383C606.111 499.562 558.427 451.878 499.606 451.878C460.545 451.879 426.395 472.907 407.859 504.26L405.405 507.185C385.812 530.537 349.863 530.472 330.355 507.048L327.193 503.253C308.526 472.458 274.692 451.878 236.051 451.878C177.23 451.878 129.546 499.562 129.546 558.383C129.546 617.204 177.23 664.888 236.051 664.888C274.174 664.888 307.619 644.857 326.435 614.746L330.694 609.744C350.176 586.858 385.497 586.794 405.062 609.608L408.589 613.72C427.282 644.401 461.051 664.888 499.606 664.888Z"
      fill={color}
    />
    <path
      d="M331.503 160.669C360.913 109.728 343.46 44.5908 292.519 15.1804C241.579 -14.23 176.441 3.22348 147.031 54.1639C127.499 87.9947 128.636 128.088 146.526 159.818L147.83 163.398C158.257 192.042 140.225 223.142 110.185 228.324L105.305 229.167C69.3056 229.939 34.5711 248.95 15.2522 282.411C-14.1583 333.352 3.29535 398.489 54.2357 427.9C105.176 457.31 170.314 439.857 199.724 388.916C218.782 355.907 218.161 316.936 201.502 285.588L199.292 279.378C189.213 251.064 206.818 220.443 236.358 214.906L241.682 213.909C277.599 213.06 312.225 194.058 331.503 160.669Z"
      fill={color}
    />
    <path
      d="M537.284 388.915C566.695 439.855 631.832 457.309 682.773 427.898C733.713 398.488 751.166 333.35 721.756 282.41C702.224 248.58 666.935 229.52 630.512 229.146L626.759 228.484C596.739 223.193 578.821 192.027 589.353 163.421L591.065 158.769C608.394 127.207 609.295 87.6227 589.978 54.1632C560.567 3.22282 495.43 -14.2307 444.489 15.1797C393.549 44.5902 376.095 109.728 405.506 160.668C424.565 193.679 458.628 212.627 494.107 213.872L500.586 215.062C530.146 220.491 547.862 251.047 537.887 279.398L536.092 284.498C518.864 316.029 518.005 355.522 537.284 388.915Z"
      fill={color}
    />
  </svg>
);

// ---------------------------------------------------------------- the readout
type CardProps = {
  x: number;
  figure: string;
  unit: string;
  progress: number;
  accent: string; // fill + unit colour
  fillGradient: string;
  fillGlow: string;
  ticks: number; // interior axis divisions (0 = none)
  tickFlare: number[]; // 0..1 per interior tick
  iconTint: string;
  iconBg: string;
  icon: React.ReactNode;
  shimmer: number; // 0..1 idle sweep on the empty track
  shimmerPhase: number;
  sheen: number; // 0..1 completion sheen riding over a finished fill
  sheenPos: number;
  lift: number; // 0 = resting, 1 = raised
  dim: number; // 0 = full attention, 1 = receded
  edgeGlow: number;
  halo: number; // amber emphasis on completion
  scale: number;
  borderAccent: number;
};

const TimeCard: React.FC<CardProps> = ({
  x,
  figure,
  unit,
  progress,
  accent,
  fillGradient,
  fillGlow,
  ticks,
  tickFlare,
  iconTint,
  iconBg,
  icon,
  shimmer,
  shimmerPhase,
  sheen,
  sheenPos,
  lift,
  dim,
  edgeGlow,
  halo,
  scale,
  borderAccent,
}) => {
  const fillW = Math.max(0, Math.min(1, progress)) * INNER_W;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: CARD_Y,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 36,
        backgroundColor: LW.card,
        border: `1px solid ${
          borderAccent > 0.01
            ? alpha(RN.amber, 0.08 + 0.3 * borderAccent)
            : LW.hairline
        }`,
        boxSizing: "border-box",
        boxShadow: elevation(lift, halo),
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* icon tile */}
      <div
        style={{
          position: "absolute",
          left: PAD_IN,
          top: PAD_IN,
          width: ICON_BOX,
          height: ICON_BOX,
          borderRadius: 22,
          backgroundColor: iconBg,
          border: `1px solid ${LW.hairlineSoft}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconTint,
          opacity: 1 - 0.34 * dim,
        }}
      >
        {icon}
      </div>

      {/* the figure */}
      <div
        style={{
          position: "absolute",
          left: PAD_IN,
          top: NUM_BLOCK_Y,
          width: INNER_W,
          height: NUM_BLOCK_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - 0.3 * dim,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: FONT_DISPLAY,
            fontVariantNumeric: "tabular-nums lining-nums",
            fontFeatureSettings: '"tnum" 1, "lnum" 1',
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: NUM_SIZE,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: LW.ink,
              fontVariantNumeric: "tabular-nums lining-nums",
            }}
          >
            {figure}
          </span>
          <span
            style={{
              marginLeft: 18,
              fontFamily: FONT_SANS,
              fontSize: UNIT_SIZE,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.005em",
              color: accent,
            }}
          >
            {unit}
          </span>
        </div>
      </div>

      {/* the track */}
      <div
        style={{
          position: "absolute",
          left: PAD_IN,
          top: TRACK_Y,
          width: INNER_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          backgroundColor: "rgba(0,0,0,0.055)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.035)",
          overflow: "hidden",
        }}
      >
        {/* idle shimmer while the track is still empty */}
        {shimmer > 0.01 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: INNER_W * 0.38,
              left: interpolate(
                shimmerPhase,
                [0, 1],
                [-INNER_W * 0.4, INNER_W],
              ),
              opacity: shimmer * 0.9,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0) 100%)",
            }}
          />
        ) : null}

        {/* the fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: fillW,
            borderRadius: TRACK_H / 2,
            background: fillGradient,
            opacity: 1 - 0.28 * dim,
            boxShadow:
              edgeGlow > 0.01
                ? `0 0 ${18 * edgeGlow}px ${alpha(fillGlow, 0.55 * edgeGlow)}`
                : undefined,
          }}
        />

        {/* completion sheen — keeps the settled hold alive without moving
            anything an editor would have to cut around */}
        {sheen > 0.01 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: INNER_W * 0.3,
              left: sheenPos * INNER_W * 1.3 - INNER_W * 0.3,
              opacity: sheen,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ) : null}

        {/* interior axis ticks — one per hour on the manual side */}
        {new Array(Math.max(0, ticks - 1)).fill(0).map((_unused, i) => {
          const t = (i + 1) / ticks;
          const flare = tickFlare[i] ?? 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: Math.round(t * INNER_W) - 1,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: `rgba(255,255,255,${
                  t <= progress ? 0.5 + 0.35 * flare : 0
                })`,
                borderLeft:
                  t > progress
                    ? `2px solid rgba(0,0,0,${0.075 + 0.1 * flare})`
                    : undefined,
                boxSizing: "border-box",
              }}
            />
          );
        })}

        {/* playhead at the fill edge */}
        {progress > 0.004 && progress < 0.999 ? (
          <div
            style={{
              position: "absolute",
              left: fillW - 2,
              top: 0,
              bottom: 0,
              width: 3,
              borderRadius: 2,
              backgroundColor: alpha(accent, 0.9),
              opacity: 1 - 0.4 * dim,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ============================================================================
export const KsP8AFullDayOfEditing: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------------------------------------------------------------- camera
  // hold (tight on the manual card) → move → settle → dead-still hold
  const camT = [0, 18, MOVE_START, MOVE_END, SETTLE_END, DURATION_IN_FRAMES - 1];
  const fx = interpolate(
    frame,
    camT,
    [A_CX, A_CX, A_CX, CONTENT_CX + 8, CONTENT_CX, CONTENT_CX],
    { easing: EASE, ...CLAMP },
  );
  const fy = interpolate(
    frame,
    camT,
    [CARD_CY, CARD_CY, CARD_CY, CARD_CY, CARD_CY, CARD_CY],
    { easing: EASE, ...CLAMP },
  );
  const z = interpolate(
    frame,
    camT,
    [1.035, 1.02, 1.005, Z_WIDE * 0.988, Z_WIDE, Z_WIDE],
    { easing: EASE, ...CLAMP },
  );

  // ------------------------------------------------------------- the grind
  const manP = interpolate(frame, MAN_T, MAN_V, {
    easing: MAN_EASE,
    ...CLAMP,
  });
  const manualFigure = (manP * MANUAL_HOURS).toFixed(1);

  // each hour tick flares as the fill edge crosses it
  const manTickFlare = new Array(HOUR_TICKS - 1).fill(0).map((_u, i) => {
    const t = (i + 1) / HOUR_TICKS;
    return interpolate(manP, [t - 0.014, t, t + 0.055], [0, 1, 0], CLAMP);
  });

  // ------------------------------------------------------------- the snap
  const agP = interpolate(frame, [AGENT_START, AGENT_END], [0, 1], {
    easing: OUT,
    ...CLAMP,
  });
  const agentFigure = String(Math.round(agP * AGENT_MINUTES));

  const pulse = interpolate(frame, PULSE_T, [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
    ...CLAMP,
  });

  // the agent mark arms just before the run
  const armPop = spring({
    frame: frame - 97,
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 16,
  });
  const armScale = 1 + 0.1 * interpolate(armPop, [0, 0.5, 1], [0, 1, 0], CLAMP);

  // ---------------------------------------------------- attention handover
  const recede = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });

  // idle shimmers
  const manShimmer = interpolate(frame, [0, 6, 15, 20], [0, 1, 1, 0], CLAMP);
  const agShimmer = interpolate(
    frame,
    [82, 90, 99, AGENT_START],
    [0, 1, 1, 0],
    CLAMP,
  );
  const shimmerPhase = (frame % 30) / 30;

  // one sheen across the finished amber fill, then the frame goes still
  const sheen = interpolate(frame, [118, 122, 132, 135], [0, 1, 1, 0], CLAMP);
  const sheenPos = interpolate(frame, [119, 135], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    ...CLAMP,
  });

  // a whisper of settle on the open so frame 0-20 is never inert
  const openSettle = spring({
    frame,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 20,
  });
  const cardAScale = interpolate(openSettle, [0, 1], [0.992, 1]);
  const breathe = 1 + 0.0016 * Math.sin((frame / 30) * Math.PI * 0.9);

  // the amber the payoff is lit with
  const bloom =
    interpolate(frame, [AGENT_START, AGENT_END, 132], [0, 1, 0.62], {
      easing: EASE,
      ...CLAMP,
    }) *
    (1 + 0.16 * pulse);

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* GROUND — opaque warm paper with fine grain and a whisper of warm
          falloff. Screen space, full-bleed, present frame 0 → last frame. */}
      <Solid
        width={VIEW}
        height={VIEW}
        color={LW.paper}
        effects={[
          noise({ amount: 0.05, seed: 88 }),
          vignette({
            amount: 0.085,
            radius: 0.78,
            feather: 0.62,
            roundness: 0.86,
            color: "#4A3A26",
          }),
        ]}
        style={{ position: "absolute", left: 0, top: 0 }}
      />

      {/* the world the camera travels through */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* the payoff bloom, anchored under the agent card */}
        {bloom > 0.005 ? (
          <div
            style={{
              position: "absolute",
              left: B_CX - 620,
              top: CARD_CY - 620,
              width: 1240,
              height: 1240,
              borderRadius: 1240,
              mixBlendMode: "multiply",
              background: `radial-gradient(closest-side, ${alpha(
                RN.amber,
                0.44,
              )} 0%, ${alpha(RN.amber, 0.19)} 42%, ${alpha(RN.amber, 0)} 100%)`,
              opacity: Math.min(1, bloom),
            }}
          />
        ) : null}

        {/* LEFT — by hand */}
        <TimeCard
          x={A_X}
          figure={manualFigure}
          unit="hrs"
          progress={manP}
          accent={GRIND_INK}
          fillGradient={`linear-gradient(90deg, ${GRIND_INK_LIGHT} 0%, ${GRIND_INK} 78%, #7C6F65 100%)`}
          fillGlow={GRIND_INK}
          ticks={HOUR_TICKS}
          tickFlare={manTickFlare}
          iconTint={LW.muted}
          iconBg={LW.paperDeep}
          icon={<Scissors size={34} color={LW.muted} />}
          shimmer={manShimmer}
          shimmerPhase={shimmerPhase}
          sheen={0}
          sheenPos={0}
          lift={1 - recede}
          dim={recede}
          edgeGlow={0}
          halo={0}
          scale={cardAScale * breathe}
          borderAccent={0}
        />

        {/* RIGHT — the agent */}
        <TimeCard
          x={B_X}
          figure={agentFigure}
          unit="min"
          progress={agP}
          accent={RN.amber}
          fillGradient={`linear-gradient(90deg, #EDBB76 0%, ${RN.amber} 58%, #C9873A 100%)`}
          fillGlow={RN.amber}
          ticks={0}
          tickFlare={[]}
          iconTint={RN.amber}
          iconBg={RN.amberSoft}
          icon={
            <div style={{ transform: `scale(${armScale})`, display: "flex" }}>
              <RunableMark size={36} color={RN.amber} />
            </div>
          }
          shimmer={agShimmer}
          shimmerPhase={shimmerPhase}
          sheen={sheen}
          sheenPos={sheenPos}
          lift={recede}
          dim={0}
          edgeGlow={agP * (0.5 + 0.5 * pulse)}
          halo={pulse}
          scale={breathe * (1 + 0.012 * pulse)}
          borderAccent={Math.max(agP * 0.35, pulse)}
        />
      </div>
    </AbsoluteFill>
  );
};
