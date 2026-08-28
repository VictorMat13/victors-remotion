// Fish Audio 4 — F4P10OpsWhatMissed (1080x1080)
// VO: Ops, what did I miss?
// Fast router beat: question ripples in from bottom-center, the map already
// knows — routing pulse fires straight to the Operations hub, camera whips
// with it, teal ring flares, speaking bars just begin to bloom at the cut.
// Color story: amber question in -> purple routing pulse -> teal answer.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ALTARI, SPRINGS, TREE } from "./theme";
import {
  AltariBackdrop,
  DEPARTMENTS,
  DEPT,
  SkillTreeWorld,
  deg,
  hubPos,
  proceduralBars,
} from "./tree";

export const DURATION_IN_FRAMES = 90;

const W = 1080;
const H = 1080;

const OPS = hubPos(DEPT.Operations);
const OPS_COLOR = DEPARTMENTS[DEPT.Operations].color; // teal #4ECDC0
const OPS_ANGLE = DEPARTMENTS[DEPT.Operations].angle;

// Question path (world coords): emitted at bottom-center, curving through the
// Sales / Back Office gap so it never crosses the Back Office hub, landing on
// the lower-left edge of the particle brain. Quadratic bezier.
const Q0 = { x: 412, y: 902 };
const QC = { x: 452, y: 740 };
const Q1 = { x: 512, y: 582 };
const qPos = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * Q0.x + 2 * u * t * QC.x + t * t * Q1.x,
    y: u * u * Q0.y + 2 * u * t * QC.y + t * t * Q1.y,
  };
};

// Spine endpoints (match tree.tsx dotted spine geometry: center r150 -> hub r-46)
const SPINE_SX = 540 + Math.cos(deg(OPS_ANGLE)) * 150;
const SPINE_SY = 540 + Math.sin(deg(OPS_ANGLE)) * 150;
const SPINE_EX = OPS.x - Math.cos(deg(OPS_ANGLE)) * 46;
const SPINE_EY = OPS.y - Math.sin(deg(OPS_ANGLE)) * 46;

export const F4P10OpsWhatMissed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // ---- Camera: one shared keyframe timeline, two moves with holds ----------
  // f0-6 hold wide -> f6-22 push in to center -> f22-48 hold (question +
  // routing fire, tiny drift) -> f48-64 whip to Operations hub -> f64-90
  // settle drift, last two keys nearly identical for a clean editor hold.
  const KEY_T = [0, 6, 22, 48, 64, 88, DURATION_IN_FRAMES];
  const fx = interpolate(frame, KEY_T, [540, 540, 540, 540, 715, 715, 715], {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = interpolate(
    frame,
    KEY_T,
    [540, 540, 540, 540, OPS.y, OPS.y, OPS.y],
    { easing: ease, extrapolateRight: "clamp" },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [0.92, 0.92, 1.12, 1.14, 1.55, 1.575, 1.577],
    { easing: ease, extrapolateRight: "clamp" },
  );

  // ---- Question ripple + traveling dot (f22-38) ----------------------------
  const rippleT = interpolate(frame, [22, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotT = interpolate(frame, [24, 38], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotVisible = frame >= 24 && frame < 39;
  const dot = qPos(dotT);

  // ---- Amber center glint: faint from f0, flares when the question lands ---
  const glintBase = 0.1 + 0.045 * Math.sin(frame * 0.08);
  const glintFlare = interpolate(frame, [37, 43, 58], [0, 0.3, 0.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glint = glintBase + glintFlare;

  // ---- Routing to Operations (fires f40, arrives f62) ----------------------
  const routed = frame >= 40;
  const pulseT = interpolate(frame, [40, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spineTipX = SPINE_SX + (SPINE_EX - SPINE_SX) * pulseT;
  const spineTipY = SPINE_SY + (SPINE_EY - SPINE_SY) * pulseT;

  // ---- Ops hub glow: ramps as highlight lands, bumps on pulse arrival ------
  const glowRamp = interpolate(frame, [40, 58], [0, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowBump = interpolate(frame, [61, 66, 78], [0, 0.3, 0.13], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hubGlow = glowRamp + glowBump;

  // ---- Teal flare rings on pulse arrival (f62) -----------------------------
  const flare1T = interpolate(frame, [62, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flare2T = interpolate(frame, [67, 86], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Speaking bars just beginning to bloom (f76 -> cut) ------------------
  const orbIn = spring({
    frame: frame - 76,
    fps,
    config: SPRINGS.smooth,
  });
  const speaking = frame >= 76;
  const barValues = proceduralBars(frame, speaking, 3).map((v) => v * 0.5);

  // Brain settles down as attention moves to the hub (also hides the
  // orbIn particle-compression step in tree.tsx)
  const brainOpacity = interpolate(frame, [60, 76], [0.95, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={W} height={H} />

      {/* One continuous world, one camera */}
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
        {/* Amber glint behind the brain */}
        <svg
          viewBox="0 0 1080 1080"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1080,
            overflow: "visible",
          }}
        >
          <defs>
            <filter id="f4p10soft" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
          </defs>
          <circle
            cx={540}
            cy={540}
            r={112}
            fill={TREE.orb}
            opacity={glint}
            filter="url(#f4p10soft)"
          />
          <circle
            cx={540}
            cy={540}
            r={54}
            fill={TREE.orbLite}
            opacity={glint * 0.55}
            filter="url(#f4p10soft)"
          />
        </svg>

        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          highlightDept={routed ? DEPT.Operations : null}
          speaker={speaking ? DEPT.Operations : null}
          barValues={barValues}
          brainOpacity={brainOpacity}
          orbIn={orbIn}
          pulses={[{ dept: DEPT.Operations, start: 40 }]}
        />

        {/* Effects: question ripple, traveling dot, charged spine, hub flare */}
        <svg
          viewBox="0 0 1080 1080"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1080,
            overflow: "visible",
          }}
        >
          <defs>
            <filter id="f4p10glow" x="-140%" y="-140%" width="380%" height="380%">
              <feGaussianBlur stdDeviation="22" />
            </filter>
          </defs>

          {/* question ripple: one soft amber ring at bottom-center */}
          {rippleT > 0 && rippleT < 1 && (
            <circle
              cx={Q0.x}
              cy={Q0.y}
              r={10 + 44 * rippleT}
              fill="none"
              stroke={TREE.orb}
              strokeWidth={2.6 - rippleT * 1.4}
              opacity={(1 - rippleT) * 0.65}
            />
          )}

          {/* bright amber dot travels up into the brain, with fading trail */}
          {dotVisible && (
            <g>
              {[0.2, 0.13, 0.07].map((back, i) => {
                const t = Math.max(0, dotT - back);
                const p = qPos(t);
                return (
                  <circle
                    key={`tr${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3.2 + i * 0.9}
                    fill={TREE.orb}
                    opacity={0.12 + i * 0.09}
                  />
                );
              })}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={15}
                fill={TREE.orb}
                opacity={0.5}
                filter="url(#f4p10glow)"
              />
              <circle cx={dot.x} cy={dot.y} r={6.2} fill={TREE.orbLite} />
            </g>
          )}

          {/* charged spine: the route traces center -> Operations with pulse */}
          {pulseT > 0 && (
            <line
              x1={SPINE_SX}
              y1={SPINE_SY}
              x2={spineTipX}
              y2={spineTipY}
              stroke={OPS_COLOR}
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={0.32}
            />
          )}

          {/* teal hub glow */}
          {hubGlow > 0 && (
            <circle
              cx={OPS.x}
              cy={OPS.y}
              r={84}
              fill={OPS_COLOR}
              opacity={hubGlow}
              filter="url(#f4p10glow)"
            />
          )}

          {/* flare rings when the pulse arrives */}
          {flare1T > 0 && flare1T < 1 && (
            <circle
              cx={OPS.x}
              cy={OPS.y}
              r={46 + 70 * flare1T}
              fill="none"
              stroke={OPS_COLOR}
              strokeWidth={3.4 - flare1T * 2}
              opacity={(1 - flare1T) * 0.9}
            />
          )}
          {flare2T > 0 && flare2T < 1 && (
            <circle
              cx={OPS.x}
              cy={OPS.y}
              r={46 + 48 * flare2T}
              fill="none"
              stroke={OPS_COLOR}
              strokeWidth={2.4 - flare2T * 1.4}
              opacity={(1 - flare2T) * 0.5}
            />
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
