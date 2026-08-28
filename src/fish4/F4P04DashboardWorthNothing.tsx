// Fish Audio 4 — F4P04DashboardWorthNothing (1080x1080)
// VO: A dashboard you don't read is worth nothing. So here's what I did instead.
// Continuity: opens on the DIM silent map (end state of P03), sinks one notch
// on "worth nothing", then the turn: a glowing purple wire draws up from the
// bottom edge into the center brain — on arrival the map warms back up and the
// center flickers its first faint amber glint. No text, no orb bars yet.

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ALTARI, TREE } from "./theme";
import { AltariBackdrop, SkillTreeWorld, CX, CY } from "./tree";

export const DURATION_IN_FRAMES = 145;

const W = 1080;
const H = 1080;

// ---------------------------------------------------------------------------
// Connection wire: one gently curved cubic from below the bottom edge up into
// the lower face of the particle brain. Routed through the quiet corridor
// left of the Back Office label and right of the Sales label.
// ---------------------------------------------------------------------------
const P0 = { x: 400, y: 1195 };
const P1 = { x: 305, y: 920 };
const P2 = { x: 470, y: 726 };
const P3 = { x: 540, y: 592 };
const WIRE_D = `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`;

const cubicAt = (t: number) => {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * P0.x + b * P1.x + c * P2.x + d * P3.x,
    y: a * P0.y + b * P1.y + c * P2.y + d * P3.y,
  };
};

// Arc-length lookup table so the tip dot tracks the dash-drawn end exactly.
const SAMPLES = 240;
const buildWireLut = () => {
  const pts: { x: number; y: number }[] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= SAMPLES; i++) pts.push(cubicAt(i / SAMPLES));
  for (let i = 1; i <= SAMPLES; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return { pts, cum, total: cum[SAMPLES] };
};
const WIRE_LUT = buildWireLut();

const wirePointAt = (u: number) => {
  const { pts, cum, total } = WIRE_LUT;
  const target = Math.min(1, Math.max(0, u)) * total;
  let lo = 0;
  let hi = SAMPLES;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const seg = cum[i] - cum[i - 1] || 1;
  const f = (target - cum[i - 1]) / seg;
  return {
    x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
    y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
  };
};

const ease = Easing.inOut(Easing.cubic);

export const F4P04DashboardWorthNothing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // -------------------------------------------------------------------------
  // Camera — one world div, shared keyframe timeline. Wide + still through the
  // dim beats; a single 18-frame push toward center as the wire lands (f108–126),
  // then two identical keys for the clean end hold.
  // -------------------------------------------------------------------------
  const KEY_T = [0, 108, 126, DURATION_IN_FRAMES - 1];
  const fx = interpolate(frame, KEY_T, [CX, CX, CX, CX], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, [CY, CY, CY, CY], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, [1, 1, 1.12, 1.12], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // -------------------------------------------------------------------------
  // Beat drivers
  // -------------------------------------------------------------------------
  // f0–45 hold at 0.45 → f45–78 sink to 0.34 ("worth nothing"). Never darker.
  const dimOp = interpolate(frame, [45, 78], [0.45, 0.34], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Wire draws f78–110 (bottom edge → brain), tip dot leading.
  const drawT = interpolate(frame, [78, 110], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tip = wirePointAt(drawT);
  const tipOp = interpolate(frame, [78, 84, 112, 124], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arrival (~f110): particles warm up — tree opacity springs back toward 0.85.
  const warm = spring({
    frame: frame - 110,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.2 },
  });
  const treeOpacity = Math.min(1, dimOp + (0.85 - 0.34) * warm);
  const labelDim = 0.82 - 0.34 * warm;

  // First faint amber glint at center — small pulsing circle, up to ~0.5.
  const glintIn = spring({
    frame: frame - 112,
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const glintOsc = 0.34 + 0.16 * Math.sin((frame - 112) * 0.33);
  const glintOp = glintIn * glintOsc; // peaks ≈ 0.5
  const glintR = 11 + 2.5 * Math.sin((frame - 112) * 0.33);

  // Wire glow breathes a little once attached; faint charge dots ride it.
  const wireGlowOp = 0.32 + warm * (0.1 + 0.06 * Math.sin(frame * 0.2));
  const chargeIn = interpolate(frame, [120, 132], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Opaque Altari base + grid, full-frame frame 0 → last. Does not move. */}
      <AltariBackdrop width={W} height={H} />

      {/* Constant ambient glow — the dim-beat floor. Never dims, never moves. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          background:
            "radial-gradient(62% 58% at 50% 46%, rgba(91,94,194,0.16) 0%, rgba(91,94,194,0.05) 48%, rgba(26,26,46,0) 74%)",
        }}
      />

      {/* Camera world */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* The established map — dim and silent, no orb, star twinkle only. */}
        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          labelDim={labelDim}
          opacity={treeOpacity}
          orbIn={0}
          speaker={null}
        />

        {/* Connection wire + arrival glint (world coordinates, above the map) */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            overflow: "visible",
          }}
        >
          <defs>
            <filter id="f4p04-soft" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="f4p04-halo" x="-250%" y="-250%" width="600%" height="600%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>

          {drawT > 0 && (
            <>
              {/* soft glow pass */}
              <path
                d={WIRE_D}
                pathLength={1}
                fill="none"
                stroke={ALTARI.primaryLight}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1 - drawT}
                opacity={wireGlowOp}
                filter="url(#f4p04-soft)"
              />
              {/* core line */}
              <path
                d={WIRE_D}
                pathLength={1}
                fill="none"
                stroke={ALTARI.primaryLight}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1 - drawT}
                opacity={0.95}
              />
            </>
          )}

          {/* bright tip dot leading the draw, absorbed into the brain */}
          {tipOp > 0 && (
            <>
              <circle
                cx={tip.x}
                cy={tip.y}
                r={11}
                fill={ALTARI.primaryLight}
                opacity={tipOp * 0.75}
                filter="url(#f4p04-halo)"
              />
              <circle cx={tip.x} cy={tip.y} r={4.5} fill="#E4E5FA" opacity={tipOp} />
            </>
          )}

          {/* faint charge dots traveling up the attached wire (hold micro-motion) */}
          {chargeIn > 0 &&
            [0, 1, 2].map((k) => {
              const p = ((frame - 120) * (0.012 + k * 0.005) + k * 0.33) % 1;
              const pt = wirePointAt(p);
              const op = chargeIn * 0.4 * Math.sin(p * Math.PI);
              return (
                <circle
                  key={`ch${k}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={ALTARI.primaryLight}
                  opacity={op}
                />
              );
            })}

          {/* first faint amber glint at the brain center */}
          {glintIn > 0.01 && (
            <>
              <circle
                cx={CX}
                cy={CY}
                r={40}
                fill={TREE.orb}
                opacity={glintOp * 0.55}
                filter="url(#f4p04-halo)"
              />
              <circle cx={CX} cy={CY} r={glintR} fill={TREE.orb} opacity={glintOp} />
            </>
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
