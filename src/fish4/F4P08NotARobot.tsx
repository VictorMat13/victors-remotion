// Fish Audio 4 — F4P08NotARobot (1080x1080 @ 30fps)
// VO: "That's not a robot reading a report. It's answering out of the map
// itself. Live."
// The proof is pure motion: a bright pulse retraces the answer's path through
// the REAL map geometry — deep Deals node → branch links → Deals hub → spine →
// center — lighting each traversed segment red-to-amber. Camera follows the
// pulse (hold → move → hold → move → hold), then one pull-back reveals the
// single lit route on the calm map. No text, no bars, no chip.
// Note: the "low-strength Deals highlight" is a soft red aura in the overlay
// (SkillTreeWorld's highlightDept prop is full-strength only and would make
// the whole branch un-calm).
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ALTARI, TREE } from "./theme";
import {
  AltariBackdrop,
  SkillTreeWorld,
  buildBranches,
  hubPos,
  DEPT,
  DEPARTMENTS,
  CX,
  CY,
  deg,
} from "./tree";

export const DURATION_IN_FRAMES = 172;

// ---------------------------------------------------------------------------
// The retrace route, computed deterministically from the real tree builder:
// deepest Deals node → (real link segments) → first node → hub → dotted spine
// endpoints → center. All world coordinates (1080x1080 tree world).
// ---------------------------------------------------------------------------
type Pt = { x: number; y: number };
const mix = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const DEALS_COLOR = DEPARTMENTS[DEPT.Deals].color; // #E85D5D
const AMBER = TREE.orb; // #E8A25B

const buildRoute = () => {
  const branch = buildBranches()[DEPT.Deals];
  const hub = hubPos(DEPT.Deals);
  const dHub = (i: number) =>
    Math.hypot(branch.nodes[i].x - hub.x, branch.nodes[i].y - hub.y);
  // adjacency from the branch's real links
  const adj = new Map<number, number[]>();
  branch.links.forEach(([a, b]) => {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  });
  // deepest node in the branch, then walk hub-ward along real links
  let far = 0;
  branch.nodes.forEach((_, i) => {
    if (dHub(i) > dHub(far)) far = i;
  });
  const chain: number[] = [far];
  const seen = new Set<number>([far]);
  let cur = far;
  for (;;) {
    const next = (adj.get(cur) ?? [])
      .filter((n) => !seen.has(n))
      .sort((a, b) => dHub(a) - dHub(b))[0];
    if (next === undefined || dHub(next) >= dHub(cur)) break;
    chain.push(next);
    seen.add(next);
    cur = next;
  }
  // spine endpoints exactly as drawn by SkillTreeWorld's dotted spine
  const a = deg(DEPARTMENTS[DEPT.Deals].angle);
  const spineHubEnd = {
    x: hub.x - Math.cos(a) * 46,
    y: hub.y - Math.sin(a) * 46,
  };
  const spineCenterEnd = {
    x: CX + Math.cos(a) * 150,
    y: CY + Math.sin(a) * 150,
  };
  const pts: Pt[] = [
    ...chain.map((i) => ({ x: branch.nodes[i].x, y: branch.nodes[i].y })),
    hub,
    spineHubEnd,
    spineCenterEnd,
    { x: CX, y: CY },
  ];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
    );
  }
  return {
    pts,
    cum,
    total: cum[cum.length - 1],
    hub,
    hubIdx: chain.length, // pts index of the hub waypoint
    nodeRadii: chain.map((i) => branch.nodes[i].r),
  };
};
const ROUTE = buildRoute();

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const hexRgb = (h: string) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const RGB_RED = hexRgb(DEALS_COLOR);
const RGB_AMBER = hexRgb(AMBER);
// red at the deep node → amber at the center (t = distance / total)
const routeColor = (t: number) => {
  const k = clamp01(t);
  const c = RGB_RED.map((v, i) => Math.round(v + (RGB_AMBER[i] - v) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};
const pointAt = (d: number): Pt => {
  const dd = Math.min(ROUTE.total, Math.max(0, d));
  for (let i = 1; i < ROUTE.cum.length; i++) {
    if (dd <= ROUTE.cum[i]) {
      const t =
        (dd - ROUTE.cum[i - 1]) /
        Math.max(1e-6, ROUTE.cum[i] - ROUTE.cum[i - 1]);
      return mix(ROUTE.pts[i - 1], ROUTE.pts[i], t);
    }
  }
  return ROUTE.pts[ROUTE.pts.length - 1];
};

// pulse schedules (constant speed along the route)
const PULSE1_START = 35;
const PULSE1_END = 95;
const PULSE2_START = 126;
const PULSE2_END = 146;
const arrivalFrame = (i: number) =>
  PULSE1_START + (PULSE1_END - PULSE1_START) * (ROUTE.cum[i] / ROUTE.total);

export const F4P08NotARobot: React.FC = () => {
  const frame = useCurrentFrame();
  const EASE = Easing.inOut(Easing.cubic);

  // ---- camera (one shared keyframe timeline) --------------------------------
  const P_OPEN = ROUTE.pts[1]; // frames the deep node with its chain
  const P_HUB = { x: ROUTE.hub.x + 4, y: ROUTE.hub.y };
  const P_PRE = mix(ROUTE.pts[ROUTE.pts.length - 2], ROUTE.pts[ROUTE.pts.length - 1], 0.6);
  const KEY_T = [0, 36, 58, 72, 92, 104, 126, DURATION_IN_FRAMES - 1];
  const fx = interpolate(
    frame,
    KEY_T,
    [P_OPEN.x, P_OPEN.x, P_HUB.x, P_HUB.x, P_PRE.x, P_PRE.x, CX, CX],
    { easing: EASE, extrapolateRight: "clamp" },
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [P_OPEN.y, P_OPEN.y, P_HUB.y, P_HUB.y, P_PRE.y, P_PRE.y, CY, CY],
    { easing: EASE, extrapolateRight: "clamp" },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [2.3, 2.3, 1.85, 1.85, 1.5, 1.5, 0.88, 0.868],
    { easing: EASE, extrapolateRight: "clamp" },
  );

  // labels hidden during the close beats, back for the wide reveal
  const labelDim = interpolate(frame, [104, 130], [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- pulse state ----------------------------------------------------------
  const dist1 = interpolate(frame, [PULSE1_START, PULSE1_END], [0, ROUTE.total], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse1Live = frame >= PULSE1_START && frame <= PULSE1_END + 3;
  const dist2 = interpolate(frame, [PULSE2_START, PULSE2_END], [0, ROUTE.total], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse2Live = frame >= PULSE2_START && frame <= PULSE2_END + 2;
  const p1 = pointAt(dist1);
  const p2 = pointAt(dist2);

  const centerArrive = arrivalFrame(ROUTE.pts.length - 1); // ~f95
  const hubArrive = arrivalFrame(ROUTE.hubIdx); // ~f59

  // route glow breathing in the wide hold; slight lift while pulse 2 runs
  const glowBase =
    0.34 +
    0.05 * Math.sin(frame * 0.08) +
    (pulse2Live ? 0.12 : 0);

  // far-node charge-up just before the pulse departs
  const charge = interpolate(frame, [26, 35], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // expanding flare ring helper (returns null when not visible)
  const flare = (
    af: number,
    x: number,
    y: number,
    r0: number,
    r1: number,
    color: string,
    key: string,
  ) => {
    if (frame < af || frame > af + 16) return null;
    const t = clamp01((frame - af) / 16);
    return (
      <circle
        key={key}
        cx={x}
        cy={y}
        r={r0 + (r1 - r0) * Easing.out(Easing.quad)(t)}
        fill="none"
        stroke={color}
        strokeWidth={2.4 * (1 - t) + 0.6}
        opacity={0.85 * (1 - t)}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* opaque backdrop, full-frame, frame 0 → last (no black frames) */}
      <AltariBackdrop width={1080} height={1080} />

      {/* one world, one camera */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          labelDim={labelDim}
          highlightDept={null}
          speaker={null}
          brainOpacity={0.95}
          orbIn={0}
        />

        {/* retrace overlay — same world coordinates, drawn on top */}
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
            <filter id="f4p08soft" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id="f4p08wide" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
            {ROUTE.pts.slice(0, -1).map((a, i) => {
              const b = ROUTE.pts[i + 1];
              return (
                <linearGradient
                  key={`g${i}`}
                  id={`f4p08seg${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                >
                  <stop offset="0%" stopColor={routeColor(ROUTE.cum[i] / ROUTE.total)} />
                  <stop
                    offset="100%"
                    stopColor={routeColor(ROUTE.cum[i + 1] / ROUTE.total)}
                  />
                </linearGradient>
              );
            })}
          </defs>

          {/* low-strength Deals-branch aura (the "highlight at low strength") */}
          <ellipse
            cx={148}
            cy={462}
            rx={165}
            ry={120}
            fill={DEALS_COLOR}
            opacity={0.06}
            filter="url(#f4p08wide)"
          />

          {/* deep node: warm glow from frame 0, charging before departure */}
          <circle
            cx={ROUTE.pts[0].x}
            cy={ROUTE.pts[0].y}
            r={16 + charge * 7}
            fill={TREE.orbLite}
            opacity={0.32 + 0.1 * Math.sin(frame * 0.16) + charge * 0.25}
            filter="url(#f4p08soft)"
          />
          <circle
            cx={ROUTE.pts[0].x}
            cy={ROUTE.pts[0].y}
            r={ROUTE.nodeRadii[0] + 1.2 + charge * 1.2}
            fill={TREE.orbLite}
            opacity={0.95}
          />

          {/* traversed segments light as the pulse passes and stay lit.
              Lines are trimmed at the hub face and the center core so the
              route wraps the map's own shapes instead of crossing them. */}
          {ROUTE.pts.slice(0, -1).map((a0, i) => {
            const b0 = ROUTE.pts[i + 1];
            const len = ROUTE.cum[i + 1] - ROUTE.cum[i];
            const p = clamp01((dist1 - ROUTE.cum[i]) / Math.max(1e-6, len));
            const startT = i === ROUTE.hubIdx ? Math.min(0.9, 32 / len) : 0;
            const endCap =
              i === ROUTE.hubIdx - 1
                ? (len - 32) / len
                : i === ROUTE.pts.length - 2
                  ? (len - 34) / len
                  : 1;
            const drawP = Math.min(p, endCap);
            if (drawP <= startT + 0.001) return null;
            const a = mix(a0, b0, startT);
            const e = mix(a0, b0, drawP);
            return (
              <g key={`seg${i}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={e.x}
                  y2={e.y}
                  stroke={`url(#f4p08seg${i})`}
                  strokeWidth={9}
                  strokeLinecap="round"
                  opacity={glowBase}
                  filter="url(#f4p08soft)"
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={e.x}
                  y2={e.y}
                  stroke={`url(#f4p08seg${i})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.95}
                />
              </g>
            );
          })}

          {/* waypoint nodes stay lit after the pulse passes */}
          {ROUTE.nodeRadii.map((r, i) => {
            const af = arrivalFrame(i);
            if (frame < af) return null;
            const on = clamp01((frame - af) / 6);
            return (
              <circle
                key={`lit${i}`}
                cx={ROUTE.pts[i].x}
                cy={ROUTE.pts[i].y}
                r={r + 1.6}
                fill={routeColor(ROUTE.cum[i] / ROUTE.total)}
                opacity={on * (0.85 + 0.15 * Math.sin(frame * 0.1 + i))}
              />
            );
          })}

          {/* hub stays ringed in dept red after arrival */}
          {frame >= hubArrive && (
            <circle
              cx={ROUTE.hub.x}
              cy={ROUTE.hub.y}
              r={44}
              fill="none"
              stroke={DEALS_COLOR}
              strokeWidth={2}
              opacity={
                clamp01((frame - hubArrive) / 8) *
                (0.5 + 0.14 * Math.sin(frame * 0.11))
              }
            />
          )}

          {/* center soft amber glow after arrival */}
          {frame >= centerArrive - 2 && (
            <circle
              cx={CX}
              cy={CY}
              r={135}
              fill={AMBER}
              opacity={
                clamp01((frame - (centerArrive - 2)) / 18) *
                (0.11 + 0.03 * Math.sin(frame * 0.09))
              }
              filter="url(#f4p08wide)"
            />
          )}

          {/* arrival flares: passed nodes, hub, center */}
          {ROUTE.nodeRadii.map((r, i) =>
            i === 0
              ? null
              : flare(
                  arrivalFrame(i),
                  ROUTE.pts[i].x,
                  ROUTE.pts[i].y,
                  r + 3,
                  r + 26,
                  routeColor(ROUTE.cum[i] / ROUTE.total),
                  `fl${i}`,
                ),
          )}
          {flare(hubArrive, ROUTE.hub.x, ROUTE.hub.y, 36, 76, DEALS_COLOR, "flh")}
          {flare(centerArrive, CX, CY, 48, 150, AMBER, "flc")}

          {/* pulse 1: bright dot + fading trail */}
          {pulse1Live && (
            <g>
              {[6, 5, 4, 3, 2, 1].map((k) => {
                const td = dist1 - k * 8;
                if (td <= 0) return null;
                const tp = pointAt(td);
                return (
                  <circle
                    key={`t${k}`}
                    cx={tp.x}
                    cy={tp.y}
                    r={4.2 - k * 0.55}
                    fill={TREE.orbLite}
                    opacity={0.55 - k * 0.08}
                  />
                );
              })}
              <circle
                cx={p1.x}
                cy={p1.y}
                r={15}
                fill={TREE.orbLite}
                opacity={0.55}
                filter="url(#f4p08soft)"
              />
              <circle cx={p1.x} cy={p1.y} r={5.2} fill="#FFF3E0" />
            </g>
          )}

          {/* pulse 2: the faint second run during the wide hold */}
          {pulse2Live && (
            <g>
              {[3, 2, 1].map((k) => {
                const td = dist2 - k * 9;
                if (td <= 0) return null;
                const tp = pointAt(td);
                return (
                  <circle
                    key={`u${k}`}
                    cx={tp.x}
                    cy={tp.y}
                    r={3 - k * 0.6}
                    fill={TREE.orbLite}
                    opacity={0.4 - k * 0.1}
                  />
                );
              })}
              <circle
                cx={p2.x}
                cy={p2.y}
                r={10}
                fill={TREE.orbLite}
                opacity={0.4}
                filter="url(#f4p08soft)"
              />
              <circle cx={p2.x} cy={p2.y} r={3.6} fill="#FFF3E0" opacity={0.85} />
            </g>
          )}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
