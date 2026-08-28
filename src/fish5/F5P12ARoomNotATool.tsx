// Fish Audio 5 — F5P12ARoomNotATool (1080x1920, 195f)
// VO: They're not taking turns. They're reading the same knowledge base and
//     pushing against each other. That's a room, not a tool.
// Pure visual argument — zero on-screen text (compliance + no narration echo).
//
// Beat map (continues the fish4 starfield-world system):
//   f0–34    tight on the knowledge-base core: layered primary rings rotating,
//            particle halo orbiting, amber heart pulsing. Slow drift (1.85→1.74).
//   f34–56   camera pulls back to the full room (zoom 1.0); three PortraitOrbs
//            spring in around the core in a staggered wave.
//   f54–80   hold: thin accent lines draw from EACH orb into the SAME core —
//            three converge pings on one node. Packets then flow core→orbs.
//   f84–152  the argument: accent force arcs push orb-to-orb along chords that
//            bow AROUND the core. Where two arcs meet: collision bloom (white
//            flash + twin accent ripples + sparks). Three staggered collisions,
//            camera nudging to each; the core steps brighter after every hit.
//   f152–195 settle: pull out; core + orbs + faint arcs breathe on one shared
//            phase — one organism. Two nearly identical final camera keys.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ADVISORS, AHMED_ORB, ALTARI, SPRINGS } from "./theme";
import { AdvisorKey, AltariBackdrop, PortraitOrb } from "./board";

export const DURATION_IN_FRAMES = 195;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random + geometry helpers
// ---------------------------------------------------------------------------
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pt = { x: number; y: number };
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const norm = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};
const add = (a: Pt, b: Pt, s = 1): Pt => ({ x: a.x + b.x * s, y: a.y + b.y * s });
const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
// Quadratic bezier point
const qp = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
const qPoly = (a: Pt, c: Pt, b: Pt, t1: number, n = 22): string => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const p = qp(a, c, b, (t1 * i) / n);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(" ");
};

// ---------------------------------------------------------------------------
// World layout (world coords = 1080x1920 plane, starfield bleeds past edges)
// ---------------------------------------------------------------------------
const CORE: Pt = { x: 540, y: 940 };
const CORE_EDGE = 54; // where converge lines land on the node
const ORB_SIZE = 230;
const ORB_EDGE = 127; // line attach distance from orb center

const ORB_POS: Record<AdvisorKey, Pt> = {
  operator: { x: 540, y: 560 },
  editor: { x: 250, y: 1220 },
  longgame: { x: 830, y: 1220 },
};
const ORB_KEYS = ["operator", "editor", "longgame"] as const;
const ORB_IN = { operator: 38, editor: 44, longgame: 50 } as const;

// Converge lines: orb edge → core edge (all three land on the same node)
const LINES = ORB_KEYS.map((k, i) => {
  const o = ORB_POS[k];
  const u = norm(sub(CORE, o));
  return {
    key: k,
    from: add(o, u, ORB_EDGE),
    to: add(CORE, u, -CORE_EDGE),
    start: 54 + i * 6, // draws 14 frames → ends 68 / 74 / 80
  };
});

// Argument pairs: chords that bow around the core; two halves meet mid-chord
const PAIRS = (
  [
    { a: "operator", b: "editor", start: 84, meet: 98 },
    { a: "operator", b: "longgame", start: 110, meet: 124 },
    { a: "editor", b: "longgame", start: 134, meet: 148 },
  ] as const
).map((p) => {
  const pa = ORB_POS[p.a];
  const pb = ORB_POS[p.b];
  const dir = norm(sub(pb, pa));
  const A = add(pa, dir, ORB_EDGE);
  const B = add(pb, dir, -ORB_EDGE);
  const M = lerp(A, B, 0.5);
  const C = add(M, norm(sub(M, CORE)), 175); // control pushed away from core
  return { ...p, A, B, C, mid: qp(A, C, B, 0.5), accA: ADVISORS[p.a].accent, accB: ADVISORS[p.b].accent };
});
const MEETS = PAIRS.map((p) => p.meet);

// ---------------------------------------------------------------------------
// Starfield (background texture — allowed to bleed past safe margins)
// ---------------------------------------------------------------------------
const starColor = (u: number) =>
  u < 0.6
    ? "#EDE6D2"
    : u < 0.82
      ? "#A5A7D9"
      : u < 0.9
        ? "#7B7DD6"
        : u < 0.94
          ? "#E8A25B"
          : u < 0.97
            ? "#E85D5D"
            : "#4ECD9B";

const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: -160 + rnd(i, 1) * 1400,
  y: -160 + rnd(i, 2) * 2240,
  r: 1.2 + rnd(i, 3) * 2.6,
  col: starColor(rnd(i, 4)),
  baseO: 0.25 + rnd(i, 5) * 0.55,
  spd: 0.04 + rnd(i, 6) * 0.08,
  ph: rnd(i, 7) * Math.PI * 2,
}));

const CLUSTERS = [
  { cx: 215, cy: 420, n: 5, salt: 11, accent: "#E85D5D" },
  { cx: 872, cy: 340, n: 4, salt: 23, accent: "#7B7DD6" },
  { cx: 195, cy: 1555, n: 5, salt: 37, accent: "#E8A25B" },
  { cx: 892, cy: 1645, n: 4, salt: 49, accent: "#4ECD9B" },
].map((c) => ({
  ...c,
  pts: Array.from({ length: c.n }, (_, i) => ({
    x: c.cx + (rnd(i, c.salt) - 0.5) * 190,
    y: c.cy + (rnd(i, c.salt + 1) - 0.5) * 190,
  })),
}));

// Core particle halo (multicolor speckle — fish4 center-orb language)
const partColor = (u: number) =>
  u < 0.35
    ? "#EDE6D2"
    : u < 0.6
      ? ALTARI.primaryLight
      : u < 0.75
        ? ALTARI.faint
        : u < 0.9
          ? AHMED_ORB.orbLite
          : u < 0.95
            ? ALTARI.red
            : ALTARI.green;

const PARTS = Array.from({ length: 26 }, (_, i) => ({
  r0: 44 + rnd(i, 15) * 46,
  a0: rnd(i, 16) * Math.PI * 2,
  spd: (0.004 + rnd(i, 17) * 0.009) * (rnd(i, 18) > 0.5 ? 1 : -1),
  sz: 1.8 + rnd(i, 19) * 2.6,
  col: partColor(rnd(i, 20)),
  o: 0.45 + rnd(i, 21) * 0.4,
}));

const EMIT_STARTS = [8, 48];

// ---------------------------------------------------------------------------
export const F5P12ARoomNotATool: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // -- Camera rig: hold → move → hold; two nearly identical final keys -------
  const KEY_T = [0, 34, 56, 80, 95, 106, 121, 132, 146, 152, 170, 192, 195];
  const fx = interpolate(
    frame,
    KEY_T,
    [540, 540, 540, 540, 514, 514, 566, 566, 540, 540, 540, 540, 540],
    { easing: ease, ...clamp },
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [940, 940, 948, 948, 880, 880, 880, 880, 1080, 1080, 952, 952, 952],
    { easing: ease, ...clamp },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.85, 1.74, 1.0, 1.0, 1.12, 1.12, 1.12, 1.12, 1.1, 1.1, 0.99, 0.99, 0.988],
    { easing: ease, ...clamp },
  );

  // -- Shared organism breath (settle phase) ---------------------------------
  const breath = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const settleIn = interpolate(frame, [150, 170], [0, 1], clamp);

  // -- Core brightness: steps up after each collision + flare spikes ---------
  const coreStep = interpolate(
    frame,
    [96, 100, 122, 126, 146, 150],
    [0.55, 0.7, 0.7, 0.85, 0.85, 1],
    clamp,
  );
  const flare = MEETS.reduce(
    (acc, m) => acc + interpolate(frame, [m, m + 3, m + 16], [0, 0.4, 0], clamp),
    0,
  );
  const coreG = Math.min(1.25, coreStep + flare + 0.05 * Math.sin(frame * 0.11));
  const heartR = 30 * (1 + 0.05 * Math.sin(frame * 0.13) + flare * 0.45);

  // -- Orb recoil on collision (pushed apart along the chord) ----------------
  const orbOffset: Record<AdvisorKey, Pt> = {
    operator: { x: 0, y: 0 },
    editor: { x: 0, y: 0 },
    longgame: { x: 0, y: 0 },
  };
  PAIRS.forEach((p) => {
    const r = interpolate(frame, [p.meet, p.meet + 4, p.meet + 22], [0, 1, 0], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });
    if (r <= 0.001) return;
    const dir = norm(sub(ORB_POS[p.a], ORB_POS[p.b]));
    orbOffset[p.a] = add(orbOffset[p.a], dir, 9 * r);
    orbOffset[p.b] = add(orbOffset[p.b], dir, -9 * r);
  });

  // -- Orb speaking glow: connect ping + argument activity + settle breath ---
  const lineEnd: Record<AdvisorKey, number> = { operator: 68, editor: 74, longgame: 80 };
  const speakFor = (k: AdvisorKey): number => {
    let s = interpolate(
      frame,
      [lineEnd[k], lineEnd[k] + 5, lineEnd[k] + 20],
      [0, 0.5, 0.12],
      clamp,
    );
    PAIRS.forEach((p) => {
      if (p.a === k || p.b === k) {
        s += interpolate(frame, [p.start, p.meet, p.meet + 18], [0, 0.85, 0.08], clamp);
      }
    });
    s += settleIn * (0.06 + 0.16 * breath);
    return Math.min(1, s);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={1080} height={1920} />

      {/* ------------------------- WORLD (camera) ------------------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Starfield + constellations (background, bleeds past edges) */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            overflow: "visible",
          }}
        >
          {STARS.map((s, i) => (
            <circle
              key={`s${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.col}
              opacity={s.baseO * (0.6 + 0.4 * Math.sin(frame * s.spd + s.ph))}
            />
          ))}
          {CLUSTERS.map((c, ci) => (
            <g key={`c${ci}`}>
              <polyline
                points={c.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                fill="none"
                stroke="rgba(237,230,210,0.15)"
                strokeWidth={1}
              />
              {c.pts.map((p, pi) => (
                <circle
                  key={`cp${pi}`}
                  cx={p.x}
                  cy={p.y}
                  r={pi === 1 ? 3.2 : 2.2}
                  fill={pi === 1 ? c.accent : "#EDE6D2"}
                  opacity={0.5 + 0.3 * Math.sin(frame * 0.06 + ci * 2.1 + pi)}
                />
              ))}
            </g>
          ))}
        </svg>

        {/* Lines, arcs, core, collisions */}
        <svg
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            overflow: "visible",
          }}
        >
          <defs>
            <radialGradient id="f5p12core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ALTARI.primaryLight} stopOpacity="0.34" />
              <stop offset="45%" stopColor={ALTARI.primary} stopOpacity="0.16" />
              <stop offset="100%" stopColor={ALTARI.primary} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="f5p12amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={AHMED_ORB.orb} stopOpacity="0.5" />
              <stop offset="100%" stopColor={AHMED_ORB.orb} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="f5p12heart" cx="42%" cy="38%" r="70%">
              <stop offset="0%" stopColor={AHMED_ORB.orbLite} />
              <stop offset="100%" stopColor={AHMED_ORB.orb} />
            </radialGradient>
          </defs>

          {/* soft core glow, under everything */}
          <circle
            cx={CORE.x}
            cy={CORE.y}
            r={150}
            fill="url(#f5p12core)"
            opacity={Math.min(1, 0.55 + coreG * 0.5)}
          />
          <circle cx={CORE.x} cy={CORE.y} r={82} fill="url(#f5p12amber)" opacity={0.35 + coreG * 0.4} />

          {/* converge lines: every orb reads the SAME node */}
          {LINES.map((l, i) => {
            const p = interpolate(frame, [l.start, l.start + 14], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...clamp,
            });
            if (p <= 0) return null;
            const tip = lerp(l.from, l.to, p);
            const acc = ADVISORS[l.key].accent;
            const lineO =
              interpolate(frame, [l.start, l.start + 6], [0, 0.62], clamp) -
              settleIn * 0.1 * (1 - breath);
            const ping = interpolate(
              frame,
              [l.start + 14, l.start + 26],
              [0, 1],
              { easing: Easing.out(Easing.quad), ...clamp },
            );
            return (
              <g key={`l${i}`}>
                <line
                  x1={l.from.x}
                  y1={l.from.y}
                  x2={tip.x}
                  y2={tip.y}
                  stroke={acc}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={lineO * 0.16}
                />
                <line
                  x1={l.from.x}
                  y1={l.from.y}
                  x2={tip.x}
                  y2={tip.y}
                  stroke={acc}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  opacity={lineO}
                />
                {p < 1 && (
                  <circle cx={tip.x} cy={tip.y} r={5} fill="#FFFFFF" opacity={0.9} />
                )}
                {frame >= l.start + 14 && ping < 1 && (
                  <circle
                    cx={l.to.x}
                    cy={l.to.y}
                    r={6 + ping * 20}
                    fill="none"
                    stroke={acc}
                    strokeWidth={1.8}
                    opacity={(1 - ping) * 0.7}
                  />
                )}
              </g>
            );
          })}

          {/* packets: knowledge flowing core → orbs (micro-motion in holds) */}
          {LINES.map((l, i) => {
            const t0 = 86 + i * 15;
            if (frame < t0) return null;
            const tt = ((frame - t0) / 46) % 1;
            const pos = lerp(l.to, l.from, tt);
            const o = Math.sin(Math.PI * tt) * 0.7;
            return (
              <g key={`pk${i}`} opacity={o}>
                <circle cx={pos.x} cy={pos.y} r={8} fill={ADVISORS[l.key].accent} opacity={0.25} />
                <circle cx={pos.x} cy={pos.y} r={3.6} fill="#FFFFFF" opacity={0.85} />
              </g>
            );
          })}

          {/* argument arcs: two halves push toward each other around the core */}
          {PAIRS.map((p, pi) => {
            const prog = interpolate(frame, [p.start, p.meet], [0, 1], {
              easing: ease,
              ...clamp,
            });
            if (prog <= 0) return null;
            const arcO =
              interpolate(
                frame,
                [p.start, p.start + 4, p.meet + 6, p.meet + 26],
                [0, 0.95, 0.95, 0.3],
                clamp,
              ) -
              settleIn * 0.08 * (1 - breath);
            const tipA = qp(p.A, p.C, p.B, 0.5 * prog);
            const tipB = qp(p.B, p.C, p.A, 0.5 * prog);
            return (
              <g key={`arc${pi}`}>
                <polyline
                  points={qPoly(p.A, p.C, p.B, 0.5 * prog)}
                  fill="none"
                  stroke={p.accA}
                  strokeWidth={9}
                  strokeLinecap="round"
                  opacity={arcO * 0.14}
                />
                <polyline
                  points={qPoly(p.A, p.C, p.B, 0.5 * prog)}
                  fill="none"
                  stroke={p.accA}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={arcO}
                />
                <polyline
                  points={qPoly(p.B, p.C, p.A, 0.5 * prog)}
                  fill="none"
                  stroke={p.accB}
                  strokeWidth={9}
                  strokeLinecap="round"
                  opacity={arcO * 0.14}
                />
                <polyline
                  points={qPoly(p.B, p.C, p.A, 0.5 * prog)}
                  fill="none"
                  stroke={p.accB}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={arcO}
                />
                {prog < 1 && (
                  <>
                    <circle cx={tipA.x} cy={tipA.y} r={6} fill="#FFFFFF" opacity={0.95} />
                    <circle cx={tipA.x} cy={tipA.y} r={11} fill={p.accA} opacity={0.3} />
                    <circle cx={tipB.x} cy={tipB.y} r={6} fill="#FFFFFF" opacity={0.95} />
                    <circle cx={tipB.x} cy={tipB.y} r={11} fill={p.accB} opacity={0.3} />
                  </>
                )}
              </g>
            );
          })}

          {/* the knowledge-base node itself: layered rings + halo + amber heart */}
          <circle
            cx={CORE.x}
            cy={CORE.y}
            r={46}
            fill="rgba(91,94,194,0.16)"
            stroke={ALTARI.primaryLight}
            strokeWidth={1.2}
            opacity={Math.min(1, 0.4 + coreG * 0.5)}
          />
          <g transform={`rotate(${frame * 0.5} ${CORE.x} ${CORE.y})`}>
            <circle
              cx={CORE.x}
              cy={CORE.y}
              r={62}
              fill="none"
              stroke={ALTARI.primaryLight}
              strokeWidth={1.6}
              strokeDasharray="4 9"
              opacity={0.5 * coreG}
            />
          </g>
          <circle
            cx={CORE.x}
            cy={CORE.y}
            r={84 + 1.5 * Math.sin(frame * 0.09)}
            fill="none"
            stroke={ALTARI.primary}
            strokeWidth={1.2}
            opacity={0.38 * coreG}
          />
          <g transform={`rotate(${-frame * 0.35} ${CORE.x} ${CORE.y})`}>
            <circle
              cx={CORE.x}
              cy={CORE.y}
              r={104}
              fill="none"
              stroke={ALTARI.primaryLight}
              strokeWidth={1.4}
              strokeDasharray="2 12"
              opacity={0.32 * coreG}
            />
          </g>
          {PARTS.map((pt, i) => {
            const ang = pt.a0 + frame * pt.spd;
            const rr = pt.r0 + 2 * Math.sin(frame * 0.07 + i);
            return (
              <circle
                key={`p${i}`}
                cx={CORE.x + Math.cos(ang) * rr}
                cy={CORE.y + Math.sin(ang) * rr}
                r={pt.sz}
                fill={pt.col}
                opacity={pt.o * Math.min(1, coreG + 0.2)}
              />
            );
          })}
          <circle cx={CORE.x} cy={CORE.y} r={heartR} fill="url(#f5p12heart)" />
          <circle
            cx={CORE.x}
            cy={CORE.y}
            r={heartR * 0.45}
            fill={AHMED_ORB.orbLite}
            opacity={0.5 + 0.3 * Math.sin(frame * 0.13)}
          />

          {/* gentle emit rings during the opening (core already alive) */}
          {EMIT_STARTS.map((s, i) => {
            const u = interpolate(frame, [s, s + 34], [0, 1], {
              easing: Easing.out(Easing.quad),
              ...clamp,
            });
            if (frame < s || u >= 1) return null;
            return (
              <circle
                key={`e${i}`}
                cx={CORE.x}
                cy={CORE.y}
                r={40 + u * 110}
                fill="none"
                stroke={ALTARI.primaryLight}
                strokeWidth={1.6}
                opacity={(1 - u) * 0.3}
              />
            );
          })}

          {/* core ripple after each collision — the node absorbs the argument */}
          {MEETS.map((m, i) => {
            const u = interpolate(frame, [m + 1, m + 20], [0, 1], {
              easing: Easing.out(Easing.quad),
              ...clamp,
            });
            if (frame < m + 1 || u >= 1) return null;
            return (
              <circle
                key={`cr${i}`}
                cx={CORE.x}
                cy={CORE.y}
                r={50 + u * 70}
                fill="none"
                stroke={AHMED_ORB.orbLite}
                strokeWidth={1.6}
                opacity={(1 - u) * 0.5}
              />
            );
          })}

          {/* collision blooms: flash + twin accent ripples + sparks */}
          {PAIRS.map((p, pi) => {
            if (frame < p.meet) return null;
            const cu = interpolate(frame, [p.meet, p.meet + 22], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...clamp,
            });
            const cu2 = interpolate(frame, [p.meet + 3, p.meet + 25], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...clamp,
            });
            const flashO = interpolate(frame, [p.meet, p.meet + 2, p.meet + 13], [0, 0.95, 0], clamp);
            const sparkU = interpolate(frame, [p.meet, p.meet + 16], [0, 1], {
              easing: Easing.out(Easing.cubic),
              ...clamp,
            });
            const sparkO = interpolate(frame, [p.meet, p.meet + 3, p.meet + 16], [0, 0.9, 0], clamp);
            if (cu >= 1 && flashO <= 0 && sparkO <= 0) return null;
            return (
              <g key={`col${pi}`}>
                {flashO > 0 && (
                  <>
                    <circle cx={p.mid.x} cy={p.mid.y} r={12 + 34 * cu} fill="#FFFFFF" opacity={flashO} />
                    <circle cx={p.mid.x} cy={p.mid.y} r={30 + 44 * cu} fill={p.accA} opacity={flashO * 0.28} />
                  </>
                )}
                {cu < 1 && (
                  <circle
                    cx={p.mid.x}
                    cy={p.mid.y}
                    r={16 + 84 * cu}
                    fill="none"
                    stroke={p.accA}
                    strokeWidth={2.4}
                    opacity={(1 - cu) * 0.75}
                  />
                )}
                {frame >= p.meet + 3 && cu2 < 1 && (
                  <circle
                    cx={p.mid.x}
                    cy={p.mid.y}
                    r={14 + 76 * cu2}
                    fill="none"
                    stroke={p.accB}
                    strokeWidth={2}
                    opacity={(1 - cu2) * 0.65}
                  />
                )}
                {sparkO > 0 &&
                  Array.from({ length: 7 }).map((_, si) => {
                    const ang = (si / 7) * Math.PI * 2 + pi * 0.9;
                    const d = (46 + rnd(si, pi * 7 + 3) * 34) * sparkU;
                    return (
                      <circle
                        key={`sp${si}`}
                        cx={p.mid.x + Math.cos(ang) * d}
                        cy={p.mid.y + Math.sin(ang) * d}
                        r={3.4 - 1.6 * sparkU}
                        fill={si % 2 ? p.accA : p.accB}
                        opacity={sparkO}
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* the three advisors — portraits only (compliance: no names) */}
        {ORB_KEYS.map((k) => (
          <PortraitOrb
            key={k}
            advisor={k}
            x={ORB_POS[k].x + orbOffset[k].x}
            y={ORB_POS[k].y + orbOffset[k].y}
            size={ORB_SIZE}
            enter={spring({ frame, fps, delay: ORB_IN[k], config: SPRINGS.snappy })}
            speak={speakFor(k)}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
