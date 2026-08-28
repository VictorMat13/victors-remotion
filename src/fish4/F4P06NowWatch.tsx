// Fish Audio 4 — F4P06NowWatch (1080x1080)
// VO: Now watch. Which proposal, and what's holding it up?
// The map listens, thinks, and routes the question to the Deals owner.
// Pure motion storytelling — no text added by this part.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ALTARI, TREE } from "./theme";
import {
  AltariBackdrop,
  CX,
  CY,
  DEPARTMENTS,
  DEPT,
  HUB_R,
  SkillTreeWorld,
  deg,
  hubPos,
} from "./tree";

export const DURATION_IN_FRAMES = 135;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// Timeline
//   f0–30    map at rest, slow push-in (1.05 → 1.12)
//   f30–52   listening indicator fades in at bottom-center, emits 3 rings
//   f52–72   one pulse detaches and travels up into the center brain
//   f72–84   amber receive flare — the question has landed
//   f74–108  spine scan: seven spines shimmer in sequence, Deals stays lit
//   f92–110  camera settles toward the Deals side (zoom 1.25)
//   f96–118  routing pulse center → Deals hub
//   f110–135 hold: red hub ring flares on arrival, then breathes
// ---------------------------------------------------------------------------

const IND_X = 540;
const IND_Y = 920;
const TRAVEL_START = 52;
const TRAVEL_END = 72;
const SCAN_START = 74;
const SCAN_STEP = 4;
const DEALS_ON = 99;
const PULSE_START = 96;
const PULSE_ARRIVE = PULSE_START + 22; // 118 (tree.tsx pulses travel 22 frames)

export const F4P06NowWatch: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);

  // -- Camera rig (one world, keyframed translate+scale) --------------------
  const KEY_T = [0, 30, 92, 110, 133, 135];
  const fx = interpolate(frame, KEY_T, [540, 540, 540, 445, 445, 445], {
    easing: ease,
    ...clamp,
  });
  const fy = interpolate(frame, KEY_T, [540, 540, 540, 526, 526, 526], {
    easing: ease,
    ...clamp,
  });
  const z = interpolate(
    frame,
    KEY_T,
    [1.05, 1.12, 1.12, 1.25, 1.253, 1.253],
    { easing: ease, ...clamp },
  );

  // World point -> screen point (matches the transform below)
  const toScreenX = (wx: number) => 540 + (wx - fx) * z;
  const toScreenY = (wy: number) => 540 + (wy - fy) * z;

  // -- Center amber glint (post-integration voice, resting) -----------------
  const receiveFlare = interpolate(frame, [70, 74, 88], [0, 0.34, 0.04], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const glintO = Math.min(
    0.6,
    0.1 + 0.05 * Math.sin(frame * 0.085) + receiveFlare,
  );
  const glintCoreO = Math.min(
    1,
    0.35 + 0.2 * Math.sin(frame * 0.13) + receiveFlare * 0.8,
  );

  // -- Deals hub state ------------------------------------------------------
  const dealsHub = hubPos(DEPT.Deals);
  const dealsColor = DEPARTMENTS[DEPT.Deals].color;
  const dealsGlowO =
    interpolate(
      frame,
      [98, 112, 116, 119, 126, 135],
      [0, 0.3, 0.3, 0.6, 0.36, 0.42],
      clamp,
    ) + (frame > PULSE_ARRIVE ? 0.04 * Math.sin((frame - PULSE_ARRIVE) * 0.32) : 0);
  const breathR = 47 + 2.5 * Math.sin(Math.max(0, frame - PULSE_ARRIVE) * 0.2);
  const breathO = interpolate(frame, [114, 121], [0, 0.55], clamp);
  const emitT = interpolate(frame, [PULSE_ARRIVE, 134], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });

  // -- Listening indicator (screen space, bottom-center) --------------------
  const indIn = interpolate(frame, [30, 40], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const indOut = interpolate(frame, [64, 78], [1, 0], clamp);
  const indO = indIn * indOut;
  const RING_STARTS = [34, 43, 52];

  // -- Question pulse: indicator -> brain (gentle quadratic arc) ------------
  const t = interpolate(frame, [TRAVEL_START, TRAVEL_END], [0, 1], {
    easing: ease,
    ...clamp,
  });
  const bx = toScreenX(CX);
  const by = toScreenY(CY);
  const qPoint = (tt: number) => {
    const mx = (IND_X + bx) / 2 + 60;
    const my = (IND_Y + by) / 2;
    return {
      x: (1 - tt) * (1 - tt) * IND_X + 2 * (1 - tt) * tt * mx + tt * tt * bx,
      y: (1 - tt) * (1 - tt) * IND_Y + 2 * (1 - tt) * tt * my + tt * tt * by,
    };
  };
  const dot = qPoint(t);
  const trail = qPoint(Math.max(0, t - 0.07));
  const dotO = interpolate(frame, [52, 55, 68, 73], [0, 1, 1, 0], clamp);
  const travelLive = frame >= TRAVEL_START && frame <= TRAVEL_END + 2;

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={1080} height={1080} />

      {/* ------------------------- WORLD (camera) ------------------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          highlightDept={frame >= DEALS_ON ? DEPT.Deals : null}
          pulses={[{ dept: DEPT.Deals, start: PULSE_START }]}
          brainOpacity={0.95}
          orbIn={0}
        />

        {/* World-space accents on top of the shared tree */}
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
            <radialGradient id="f4p6amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={TREE.orbLite} stopOpacity="0.55" />
              <stop offset="45%" stopColor={TREE.orb} stopOpacity="0.22" />
              <stop offset="100%" stopColor={TREE.orb} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="f4p6deals" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dealsColor} stopOpacity="0.5" />
              <stop offset="55%" stopColor={dealsColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={dealsColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* faint amber glint at the center — the integrated voice, resting */}
          <circle cx={CX} cy={CY} r={112} fill="url(#f4p6amber)" opacity={glintO} />
          <circle cx={CX} cy={CY} r={6.5} fill={TREE.orbLite} opacity={glintCoreO * 0.7} />

          {/* switchboard scan: each spine shimmers in sequence */}
          {DEPARTMENTS.map((dept, i) => {
            const s = SCAN_START + i * SCAN_STEP;
            const env = interpolate(frame, [s, s + 3, s + 10], [0, 1, 0], clamp);
            if (env <= 0.02) return null;
            const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
            const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
            return (
              <g key={`scan${i}`} opacity={env}>
                <line
                  x1={CX + Math.cos(deg(dept.angle)) * 150}
                  y1={CY + Math.sin(deg(dept.angle)) * 150}
                  x2={hx - Math.cos(deg(dept.angle)) * 46}
                  y2={hy - Math.sin(deg(dept.angle)) * 46}
                  stroke={dept.color}
                  strokeWidth={2.2}
                  strokeDasharray="2 11"
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <circle
                  cx={hx}
                  cy={hy}
                  r={44}
                  fill="none"
                  stroke={dept.color}
                  strokeWidth={1.6}
                  opacity={0.6}
                />
              </g>
            );
          })}

          {/* Deals hub: glow ramp, arrival flare, breathing ring */}
          <circle
            cx={dealsHub.x}
            cy={dealsHub.y}
            r={92}
            fill="url(#f4p6deals)"
            opacity={Math.max(0, Math.min(0.75, dealsGlowO))}
          />
          {frame >= 114 && (
            <circle
              cx={dealsHub.x}
              cy={dealsHub.y}
              r={breathR}
              fill="none"
              stroke={dealsColor}
              strokeWidth={1.8}
              opacity={breathO}
            />
          )}
          {frame >= PULSE_ARRIVE && emitT < 1 && (
            <circle
              cx={dealsHub.x}
              cy={dealsHub.y}
              r={40 + emitT * 38}
              fill="none"
              stroke={dealsColor}
              strokeWidth={1.4}
              opacity={(1 - emitT) * 0.5}
            />
          )}
        </svg>
      </div>

      {/* ---------------- SCREEN OVERLAY (listening + question) ----------- */}
      <svg
        viewBox="0 0 1080 1080"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
        }}
      >
        {/* listening indicator: soft mic-pulse circle over a focus scrim */}
        {indO > 0.01 && (
          <g opacity={indO}>
            <defs>
              <radialGradient id="f4p6scrim" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ALTARI.bg} stopOpacity="0.9" />
                <stop offset="60%" stopColor={ALTARI.bg} stopOpacity="0.6" />
                <stop offset="100%" stopColor={ALTARI.bg} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={IND_X} cy={IND_Y} r={72} fill="url(#f4p6scrim)" opacity={0.85} />
            <circle
              cx={IND_X}
              cy={IND_Y}
              r={6 + 1.5 * Math.sin(frame * 0.35)}
              fill={ALTARI.primaryLight}
            />
            <circle
              cx={IND_X}
              cy={IND_Y}
              r={15}
              fill="none"
              stroke={ALTARI.primaryLight}
              strokeWidth={1.6}
              opacity={0.45}
            />
            {RING_STARTS.map((s, i) => {
              const u = interpolate(frame, [s, s + 26], [0, 1], {
                easing: Easing.out(Easing.quad),
                ...clamp,
              });
              if (frame < s || u >= 1) return null;
              return (
                <circle
                  key={`ring${i}`}
                  cx={IND_X}
                  cy={IND_Y}
                  r={10 + u * 34}
                  fill="none"
                  stroke={ALTARI.primaryLight}
                  strokeWidth={2}
                  opacity={(1 - u) * 0.65}
                />
              );
            })}
          </g>
        )}

        {/* the question travels up into the brain */}
        {travelLive && dotO > 0.01 && (
          <g opacity={dotO}>
            <circle cx={dot.x} cy={dot.y} r={13} fill={ALTARI.primaryLight} opacity={0.22} />
            <circle cx={trail.x} cy={trail.y} r={3.5} fill={ALTARI.primaryLight} opacity={0.4} />
            <circle cx={dot.x} cy={dot.y} r={5.5} fill="#FFFFFF" opacity={0.9} />
            <circle cx={dot.x} cy={dot.y} r={5.5} fill={ALTARI.primaryLight} opacity={0.7} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
