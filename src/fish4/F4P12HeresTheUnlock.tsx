// Fish Audio 4 — F4P12HeresTheUnlock (1080x1920)
// VO: Here's the unlock. It's not one voice bolted onto a dashboard. It's one
// system where every department answers for itself. The map knows who owns the
// answer, and that's who speaks.
//
// The SWITCHBOARD payoff: two questions route to two different owners, each
// answers in its own voice, then the whole org breathes as one system.
// Pure motion storytelling — no headline text (compliance pill + logo chip only).
//
// Beat map (285f @ 30fps):
//  f0–40    full map centered, slow push-in (revealAt=-120, amber center alive)
//  f38–50   question #1 dot enters from bottom → center acknowledges
//  f50–74   purple radar sweep, one revolution, LOCKS onto Deals
//  f74–96   routing pulse center → Deals; lock ring; DEALS hub speaks
//  f75–135  Deals radial bars (seed 3); camera arrives f88, holds
//  f118–140 one drift keeping center + Deals framed; bars fade by f140
//  f148–160 question #2 dot enters from bottom
//  f160–180 short sweep locks Operations; camera travels toward Ops f168–188
//  f180–225 OPERATIONS speaks (teal bars, seed 5); routing pulse f180
//  f210–232 grand settle: one 22f pull-back to the whole map
//  f218–262 seven hubs glint (tiny ring + 3-bar mini waveform, staggered)
//  f240+    Fish Audio logo chip fades in; final frames clean breathing hold
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
import { ALTARI, AUDIO_LABEL, TREE } from "./theme";
import {
  AltariBackdrop,
  CX,
  CY,
  DEPARTMENTS,
  DEPT,
  SkillTreeWorld,
  deg,
  hubPos,
  manropeFamily,
  proceduralBars,
} from "./tree";

export const DURATION_IN_FRAMES = 285;

const VIEW_W = 1080;
const VIEW_H = 1920;

const ease = Easing.inOut(Easing.cubic);
const clamp = {
  easing: ease,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const lin = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// One shared camera timeline for the whole part (hold → move → hold).
const KEY_T = [0, 40, 70, 88, 118, 140, 168, 188, 210, 232, 283, 285];
const KEY_FX = [540, 540, 540, 430, 430, 470, 470, 600, 600, 540, 540, 540];
const KEY_FY = [540, 540, 540, 505, 505, 520, 520, 490, 490, 540, 540, 540];
const KEY_Z = [0.9, 0.98, 0.98, 1.28, 1.28, 1.16, 1.16, 1.3, 1.3, 0.97, 0.955, 0.955];

// Speaking windows (per beat map)
const W1 = { lock: 74, orbAt: 75, from: 75, to: 135, fadeA: 130, fadeB: 143 };
const W2 = { lock: 180, orbAt: 180, from: 180, to: 225, fadeA: 220, fadeB: 233 };

// quadratic bezier for the incoming question dots
const qbez = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
});

// wedge sector path around the center (angles in degrees, a0 < a1)
const wedge = (a0: number, a1: number, R: number) =>
  `M ${CX} ${CY} L ${CX + R * Math.cos(deg(a0))} ${CY + R * Math.sin(deg(a0))} A ${R} ${R} 0 0 1 ${
    CX + R * Math.cos(deg(a1))
  } ${CY + R * Math.sin(deg(a1))} Z`;

// -- overlay pieces (all drawn in world coordinates) -------------------------

const QuestionDot: React.FC<{
  frame: number;
  start: number;
  end: number;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}> = ({ frame, start, end, p0, p1, p2 }) => {
  if (frame < start || frame > end + 4) return null;
  const t = interpolate(frame, [start, end], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = interpolate(frame, [end - 2, end + 4], [1, 0], lin);
  const head = qbez(p0, p1, p2, t);
  const trail = [0.07, 0.15].map((d) => qbez(p0, p1, p2, Math.max(0, t - d)));
  return (
    <g>
      {trail.map((p, i) => (
        <circle
          key={`t${i}`}
          cx={p.x}
          cy={p.y}
          r={4.5 - i * 1.5}
          fill={ALTARI.primaryLight}
          opacity={(0.3 - i * 0.12) * fade}
        />
      ))}
      <circle cx={head.x} cy={head.y} r={12} fill={ALTARI.primaryLight} opacity={0.18 * fade} />
      <circle cx={head.x} cy={head.y} r={6.5} fill={ALTARI.primaryLight} opacity={0.95 * fade} />
    </g>
  );
};

const ArrivalRing: React.FC<{ frame: number; start: number }> = ({ frame, start }) => {
  if (frame < start || frame > start + 16) return null;
  const t = interpolate(frame, [start, start + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <circle
      cx={CX}
      cy={CY}
      r={52 + 46 * t}
      fill="none"
      stroke={ALTARI.primaryLight}
      strokeWidth={2.2}
      opacity={(1 - t) * 0.55}
    />
  );
};

const RadarSweep: React.FC<{
  frame: number;
  start: number;
  end: number;
  fromA: number;
  toA: number;
}> = ({ frame, start, end, fromA, toA }) => {
  if (frame < start || frame > end + 8) return null;
  const angle = interpolate(frame, [start, end], [fromA, toA], clamp);
  const op = interpolate(frame, [start, start + 5, end, end + 8], [0, 1, 1, 0], lin);
  const R = 368;
  return (
    <g transform={`rotate(${angle} ${CX} ${CY})`} opacity={op}>
      {/* faint trailing sector, brighter toward the leading edge */}
      <path d={wedge(-32, 0, R)} fill={ALTARI.primaryLight} opacity={0.05} />
      <path d={wedge(-16, 0, R)} fill={ALTARI.primaryLight} opacity={0.06} />
      <path d={wedge(-6, 0, R)} fill={ALTARI.primaryLight} opacity={0.08} />
      <line
        x1={CX + 58}
        y1={CY}
        x2={CX + R}
        y2={CY}
        stroke={ALTARI.primaryLight}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.5}
      />
      <circle cx={CX + R} cy={CY} r={4} fill={ALTARI.primaryLight} opacity={0.6} />
    </g>
  );
};

const LockRing: React.FC<{ frame: number; start: number; dept: number }> = ({
  frame,
  start,
  dept,
}) => {
  if (frame < start || frame > start + 20) return null;
  const p = hubPos(dept);
  const color = DEPARTMENTS[dept].color;
  const t = interpolate(frame, [start, start + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const t2 = interpolate(frame, [start + 4, start + 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <g>
      <circle
        cx={p.x}
        cy={p.y}
        r={38 + 28 * t}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        opacity={(1 - t) * 0.8}
      />
      {frame >= start + 4 && (
        <circle
          cx={p.x}
          cy={p.y}
          r={38 + 40 * t2}
          fill="none"
          stroke={color}
          strokeWidth={1.4}
          opacity={(1 - t2) * 0.45}
        />
      )}
    </g>
  );
};

// grand-settle voice glint: tiny expanding ring + 3-bar mini waveform per hub
const HubGlint: React.FC<{ frame: number; start: number; dept: number; fps: number }> = ({
  frame,
  start,
  dept,
  fps,
}) => {
  if (frame < start || frame > start + 30) return null;
  const p = hubPos(dept);
  const d = DEPARTMENTS[dept];
  const pop = spring({
    frame: frame - start,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const env = pop * interpolate(frame, [start + 14, start + 26], [1, 0], lin);
  const ringT = interpolate(frame, [start, start + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <g>
      <circle
        cx={p.x}
        cy={p.y}
        r={36 + 18 * ringT}
        fill="none"
        stroke={d.color}
        strokeWidth={1.8}
        opacity={(1 - ringT) * 0.55}
      />
      {[-16, 0, 16].map((off, k) => {
        const theta = deg(d.angle + off);
        const len = (5 + 9 * Math.abs(Math.sin(frame * 0.35 + dept * 1.3 + k * 0.9))) * env;
        const R0 = 40;
        return (
          <line
            key={`g${k}`}
            x1={p.x + Math.cos(theta) * R0}
            y1={p.y + Math.sin(theta) * R0}
            x2={p.x + Math.cos(theta) * (R0 + len)}
            y2={p.y + Math.sin(theta) * (R0 + len)}
            stroke={d.color}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.75 * env}
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------

export const F4P12HeresTheUnlock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // camera
  const fx = interpolate(frame, KEY_T, KEY_FX, clamp);
  const fy = interpolate(frame, KEY_T, KEY_FY, clamp);
  const z = interpolate(frame, KEY_T, KEY_Z, clamp);
  const worldTransform = `translate(${VIEW_W / 2 - fx * z}px, ${VIEW_H / 2 - fy * z}px) scale(${z})`;

  // speaker state (window 1 = Deals, window 2 = Operations)
  const orbA =
    spring({ frame: frame - W1.orbAt, fps, config: { damping: 16, stiffness: 120 } }) *
    interpolate(frame, [W1.fadeA, W1.fadeB], [1, 0], lin);
  const orbB =
    spring({ frame: frame - W2.orbAt, fps, config: { damping: 16, stiffness: 120 } }) *
    interpolate(frame, [W2.fadeA, W2.fadeB], [1, 0], lin);
  const inWindow1 = frame < 150;
  const speaker = inWindow1 ? DEPT.Deals : DEPT.Operations;
  // keep orbIn > 0 so the center particles stay condensed all part (no pop)
  const orbIn = Math.max(0.002, inWindow1 ? orbA : orbB);
  const barValues = inWindow1
    ? proceduralBars(frame, frame >= W1.from && frame <= W1.to, 3)
    : proceduralBars(frame, frame >= W2.from && frame <= W2.to, 5);
  const highlightDept =
    frame >= W1.lock && frame < 143
      ? DEPT.Deals
      : frame >= W2.lock && frame < 230
        ? DEPT.Operations
        : null;

  // amber center breathing (stronger in the grand settle)
  const breathe = 0.5 + 0.5 * Math.sin(frame * 0.055);
  const settleRamp = interpolate(frame, [228, 252], [0, 1], lin);
  const glowR = 118 + 12 * breathe + 20 * settleRamp * (0.5 + 0.5 * Math.sin(frame * 0.08));
  const glowOp = 0.15 + 0.06 * breathe + 0.09 * settleRamp;
  const coreR = 42 + 3 * Math.sin(frame * 0.07) + 3 * settleRamp;

  // screen-space chrome
  const pillIn = interpolate(frame, [70, 82], [0, 1], lin);
  const logoIn = interpolate(frame, [240, 258], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={VIEW_W} height={VIEW_H} />

      {/* camera world */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          transform: worldTransform,
          transformOrigin: "0 0",
        }}
      >
        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          highlightDept={highlightDept}
          speaker={speaker}
          barValues={barValues}
          orbIn={orbIn}
          brainOpacity={0.5}
          pulses={[
            { dept: DEPT.Deals, start: W1.lock },
            { dept: DEPT.Operations, start: W2.lock },
          ]}
        />

        {/* part-specific overlay in the same world coordinates */}
        <svg
          viewBox="-400 -400 1880 1880"
          style={{
            position: "absolute",
            left: -400,
            top: -400,
            width: 1880,
            height: 1880,
            overflow: "visible",
          }}
        >
          <defs>
            <radialGradient id="p12core" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor={TREE.orbLite} stopOpacity="0.98" />
              <stop offset="65%" stopColor={TREE.orb} stopOpacity="0.92" />
              <stop offset="100%" stopColor={TREE.orb} stopOpacity="0.7" />
            </radialGradient>
            <filter id="p12soft" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="30" />
            </filter>
          </defs>

          {/* amber center — established voice, breathing the whole part */}
          <circle cx={CX} cy={CY} r={glowR} fill={TREE.orb} opacity={glowOp} filter="url(#p12soft)" />
          <circle cx={CX} cy={CY} r={coreR} fill="url(#p12core)" />

          {/* question #1 → sweep → lock on Deals */}
          <QuestionDot
            frame={frame}
            start={38}
            end={50}
            p0={{ x: 450, y: 1560 }}
            p1={{ x: 505, y: 1010 }}
            p2={{ x: 540, y: 585 }}
          />
          <ArrivalRing frame={frame} start={50} />
          <RadarSweep frame={frame} start={50} end={74} fromA={188 - 360} toA={188} />
          <LockRing frame={frame} start={W1.lock} dept={DEPT.Deals} />

          {/* question #2 → short sweep → lock on Operations */}
          <QuestionDot
            frame={frame}
            start={148}
            end={160}
            p0={{ x: 610, y: 1400 }}
            p1={{ x: 560, y: 950 }}
            p2={{ x: 540, y: 585 }}
          />
          <ArrivalRing frame={frame} start={160} />
          <RadarSweep frame={frame} start={160} end={180} fromA={-58 - 240} toA={-58} />
          <LockRing frame={frame} start={W2.lock} dept={DEPT.Operations} />

          {/* grand settle — the whole org breathes: staggered hub voice glints */}
          {DEPARTMENTS.map((_, i) => (
            <HubGlint key={`hg${i}`} frame={frame} start={218 + i * 3} dept={i} fps={fps} />
          ))}
        </svg>
      </div>

      {/* Fish Audio logo chip — grand settle only, inside safe zones */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1518,
          display: "flex",
          justifyContent: "center",
          opacity: logoIn,
          transform: `translateY(${(1 - logoIn) * 10}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "11px 20px",
            borderRadius: 12,
            backgroundColor: "rgba(37,37,66,0.66)",
            border: `1px solid ${ALTARI.border}`,
          }}
        >
          {/* NOTE: filenames are inverted in public/fish-audio/ — logo-dark.png
              is the WHITE wordmark (correct for this dark Altari background). */}
          <Img
            src={staticFile("fish-audio/logo-dark.png")}
            style={{ height: 24, width: "auto", display: "block", opacity: 0.95 }}
          />
        </div>
      </div>

      {/* compliance pill — persistent bottom-center from the first speak */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1596,
          display: "flex",
          justifyContent: "center",
          opacity: pillIn,
        }}
      >
        <div
          style={{
            fontFamily: manropeFamily,
            fontWeight: 600,
            fontSize: 21,
            letterSpacing: 1.2,
            color: ALTARI.body,
            backgroundColor: "rgba(37,37,66,0.72)",
            border: `1px solid ${ALTARI.border}`,
            borderRadius: 999,
            padding: "11px 22px",
            whiteSpace: "nowrap",
          }}
        >
          {AUDIO_LABEL}
        </div>
      </div>
    </AbsoluteFill>
  );
};
