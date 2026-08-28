import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { MRD, MRD_GRADIENT, MRD_GRID, SPRINGS, safePadX } from "./theme";

const { fontFamily: INTER } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// ===========================================================================
// BgP2WholeTeam — 1080x1920 @ 30fps
// 0:04 PROBLEM  [9:16]
// VO: "Client ads used to mean a whole team. That's why agencies charge
//      thousands a month."
//
// THE OLD WAY. Merydian dark world, but ZERO green — the spring accent is
// reserved for the AI way in later parts. Everything here is desaturated
// graphite: raised cards, hairline borders, tangled crossing wires, heavy
// springs, and a bill that keeps climbing.
//
// One continuous world (~1080 x 2900) with a keyframed camera:
//   0-30    hold on two roles already wired
//   30-50   travel down + pull back as more roles spawn in staggered waves
//   50-95   hold, the tangle completes
//   95-118  travel to the cost figure
//   118-165 hold as it climbs and settles (repeat-bill stack behind it)
//
// The bill totals $30,000/mo. It must stay an order of magnitude away from
// part 5's $10,000/mo revenue figure, and no numeral here may echo the
// $2,000 per-client retainer used there.
// ===========================================================================

export const DURATION_IN_FRAMES = 165;

// ------------------------------------------------------------------ palette
// Desaturated graphite only. No MRD.green anywhere in this beat.
const SURFACE_TOP = "#2C2C2C";
const SURFACE_BOT = "#1E1E1E";
const WIRE = "rgba(255,255,255,0.16)";
const WIRE_DIM = "rgba(255,255,255,0.065)";
const PACKET = "rgba(230,230,230,0.66)";

// ------------------------------------------------------------------- layout
const NODE_W = 500;
const NODE_H = 150;
const MAX_Z = 1.14; // zoom budget the 5% side margins are derived from
const FX_DRIFT = 6; // max horizontal camera drift, also budgeted

type Role = {
  label: string;
  cost: number;
  cy: number;
  side: -1 | 1; // -1 left column, 1 right column
  spawn: number; // frame the card materialises
  arrive: number; // frame its feed line lands on the bill
};

const ROLES: Role[] = [
  { label: "Media buyer", cost: 7200, cy: 420, side: -1, spawn: -40, arrive: 0 },
  { label: "Designer", cost: 5400, cy: 710, side: 1, spawn: -40, arrive: 0 },
  { label: "Copywriter", cost: 4800, cy: 1000, side: -1, spawn: 30, arrive: 66 },
  { label: "Editor", cost: 2600, cy: 1290, side: 1, spawn: 42, arrive: 88 },
  { label: "Analyst", cost: 6400, cy: 1580, side: -1, spawn: 54, arrive: 112 },
  { label: "Strategist", cost: 3600, cy: 1870, side: 1, spawn: 66, arrive: 136 },
];

const GATHER_Y = 2050;
const BILL_CY = 2330;
const BILL_H = 440;

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

type Pt = { x: number; y: number };

const bez = (a: Pt, c1: Pt, c2: Pt, b: Pt) =>
  `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;

const ease = Easing.inOut(Easing.cubic);

// One seat — abstract head + shoulders, never a real avatar.
const SeatGlyph: React.FC<{ dim: number; alive: number }> = ({ dim, alive }) => (
  <svg width={dim} height={dim} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <rect
      x={0.75}
      y={0.75}
      width={46.5}
      height={46.5}
      rx={13}
      fill="rgba(255,255,255,0.06)"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth={1.5}
    />
    <circle cx={24} cy={19} r={6.6} fill={`rgba(236,236,236,${0.36 + alive * 0.2})`} />
    <path
      d="M 11.5 37 C 11.5 28.6 17.2 25.4 24 25.4 C 30.8 25.4 36.5 28.6 36.5 37 Z"
      fill={`rgba(236,236,236,${0.24 + alive * 0.16})`}
    />
  </svg>
);

export const BgP2WholeTeam: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ------------------------------------------------- safe-margin derived rig
  const pad = safePadX(width); // 54 on 1080
  const CENTER = width / 2; // world x of the content spine
  // Furthest a piece of content may sit from the spine, at the tightest zoom,
  // with the camera's horizontal drift already paid for. 1.2x pad = buffer.
  const worldSafe = (width / 2 - pad * 1.2) / MAX_Z - FX_DRIFT; // ~410 on 1080
  const colGap = Math.min(180, worldSafe - NODE_W / 2);
  const BILL_W = Math.min(820, Math.floor(worldSafe * 2));

  // --------------------------------------------------------------- geometry
  const geo = useMemo(() => {
    const cxOf = (side: -1 | 1) => CENTER + side * colGap;
    const nodes = ROLES.map((r) => {
      const cx = cxOf(r.side);
      return {
        ...r,
        cx,
        left: { x: cx - NODE_W / 2, y: r.cy },
        right: { x: cx + NODE_W / 2, y: r.cy },
        bottom: { x: cx, y: r.cy + NODE_H / 2 },
      };
    });

    const n = nodes;
    // Deliberately crossing links — short S-curves between neighbours plus
    // long bowed spans that cut across the whole stack. That is the tangle.
    const tangle = [
      { d: bez(n[0].right, { x: n[0].right.x + 190, y: n[0].cy }, { x: n[1].left.x - 190, y: n[1].cy }, n[1].left), start: -30, dur: 24 },
      { d: bez(n[1].left, { x: n[1].left.x - 190, y: n[1].cy }, { x: n[2].right.x + 190, y: n[2].cy }, n[2].right), start: 36, dur: 24 },
      { d: bez(n[0].right, { x: CENTER + 350, y: n[0].cy + 180 }, { x: CENTER + 350, y: n[3].cy - 180 }, n[3].left), start: 44, dur: 26 },
      { d: bez(n[2].right, { x: n[2].right.x + 190, y: n[2].cy }, { x: n[3].left.x - 190, y: n[3].cy }, n[3].left), start: 50, dur: 24 },
      { d: bez(n[1].left, { x: CENTER - 350, y: n[1].cy + 190 }, { x: CENTER - 350, y: n[4].cy - 190 }, n[4].right), start: 56, dur: 26 },
      { d: bez(n[3].left, { x: n[3].left.x - 190, y: n[3].cy }, { x: n[4].right.x + 190, y: n[4].cy }, n[4].right), start: 62, dur: 24 },
      { d: bez(n[2].right, { x: CENTER + 375, y: n[2].cy + 200 }, { x: CENTER + 375, y: n[5].cy - 200 }, n[5].left), start: 68, dur: 26 },
      { d: bez(n[4].right, { x: n[4].right.x + 190, y: n[4].cy }, { x: n[5].left.x - 190, y: n[5].cy }, n[5].left), start: 72, dur: 24 },
    ].map((w) => ({ ...w, len: getLength(w.d) }));

    const gather = { x: CENTER, y: GATHER_Y };
    // Every seat feeds the same bill. Routed wide so they bundle at the spine.
    const feeds = nodes.map((node) => {
      const outX = node.side === -1 ? CENTER - 300 : CENTER + 310;
      const d = bez(
        node.bottom,
        { x: outX, y: node.cy + 300 },
        { x: CENTER + node.side * 165, y: GATHER_Y - 150 },
        gather,
      );
      return { d, len: getLength(d), arrive: node.arrive };
    });

    return { nodes, tangle, feeds, gather };
  }, [CENTER, colGap]);

  // ----------------------------------------------------------------- camera
  const KEY_T = [0, 30, 50, 95, 118, 140, DURATION_IN_FRAMES];
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fx = interpolate(
    frame,
    KEY_T,
    [CENTER + FX_DRIFT, CENTER + 5, CENTER, CENTER, CENTER, CENTER - 3, CENTER - 3],
    camOpts,
  );
  const fy = interpolate(frame, KEY_T, [565, 565, 1145, 1145, 2170, 2176, 2176], camOpts);
  const z = interpolate(frame, KEY_T, [1.14, 1.14, 0.9, 0.9, 1.13, 1.135, 1.135], camOpts);

  // ------------------------------------------------------------- the bill
  const billValue = interpolate(
    frame,
    [0, 58, 66, 80, 88, 104, 112, 128, 136],
    [12600, 12600, 17400, 17400, 20000, 20000, 26400, 26400, 30000],
    camOpts,
  );
  const billShown = Math.round(billValue / 20) * 20;

  const arrivalPulse = Math.min(
    1,
    ROLES.reduce(
      (acc, r) => (frame >= r.arrive ? acc + Math.exp(-(frame - r.arrive) / 12) : acc),
      0,
    ),
  );

  const billIn = spring({ frame: frame - 52, fps, config: SPRINGS.heavy });
  const stackIn = spring({ frame: frame - 120, fps, config: SPRINGS.heavy });

  // The ambient key light tracks the camera so the frame is never unlit.
  const keyLightY = interpolate(frame, KEY_T, [42, 42, 50, 50, 56, 57, 57], camOpts);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        backgroundImage: MRD_GRADIENT.ground,
        fontFamily: INTER,
      }}
    >
      {/* ---------------------------------------------- fixed ambient layers */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.014) 34%, rgba(255,255,255,0) 62%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(62% 36% at 50% ${keyLightY}%, rgba(200,208,216,0.10) 0%, rgba(200,208,216,0.032) 46%, rgba(0,0,0,0) 74%)`,
        }}
      />

      {/* ------------------------------------------------------- the world */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          {/* faint rules, Merydian's backdrop, desaturated */}
          <div
            style={{
              position: "absolute",
              left: -700,
              top: -700,
              width: 2500,
              height: 4400,
              backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0px, ${MRD_GRID.color} 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) ${MRD_GRID.spacing}px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) ${MRD_GRID.spacing * 3}px)`,
            }}
          />

          {/* ---------------------------------------------------- the wiring */}
          <svg
            width={2200}
            height={3400}
            viewBox="0 0 2200 3400"
            style={{ position: "absolute", left: -560, top: -300, overflow: "visible" }}
          >
            <g transform="translate(560, 300)">
              {/* feeds first — they sit behind the tangle */}
              {geo.feeds.map((f, i) => {
                const start = f.arrive - 30;
                const p = interpolate(frame, [start, f.arrive], [0, 1], camOpts);
                if (p <= 0.001) return null;
                const done = p > 0.999;
                const t = (((frame * 0.0062 + i * 0.19) % 1) + 1) % 1;
                const pt = done ? getPointAtLength(f.d, t * f.len) : null;
                return (
                  <g key={`f${i}`}>
                    <path
                      d={f.d}
                      fill="none"
                      stroke={WIRE_DIM}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeDasharray={f.len}
                      strokeDashoffset={f.len * (1 - p)}
                    />
                    {pt ? <circle cx={pt.x} cy={pt.y} r={3.4} fill="rgba(230,230,230,0.4)" /> : null}
                  </g>
                );
              })}

              {/* the tangle */}
              {geo.tangle.map((w, i) => {
                const p = interpolate(frame, [w.start, w.start + w.dur], [0, 1], camOpts);
                if (p <= 0.001) return null;
                const done = p > 0.999;
                const t = (((frame * 0.0085 + i * 0.13) % 1) + 1) % 1;
                const pt = done ? getPointAtLength(w.d, t * w.len) : null;
                const head = !done ? getPointAtLength(w.d, p * w.len) : null;
                return (
                  <g key={`w${i}`}>
                    <path
                      d={w.d}
                      fill="none"
                      stroke={WIRE}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeDasharray={w.len}
                      strokeDashoffset={w.len * (1 - p)}
                    />
                    {head ? <circle cx={head.x} cy={head.y} r={4.8} fill="rgba(240,240,240,0.6)" /> : null}
                    {pt ? (
                      <>
                        <circle cx={pt.x} cy={pt.y} r={9} fill="rgba(230,230,230,0.11)" />
                        <circle cx={pt.x} cy={pt.y} r={4.2} fill={PACKET} />
                      </>
                    ) : null}
                  </g>
                );
              })}

              {/* the point every seat drains into */}
              <circle
                cx={geo.gather.x}
                cy={geo.gather.y}
                r={16 + arrivalPulse * 7}
                fill="none"
                stroke={`rgba(240,240,240,${0.16 + arrivalPulse * 0.3})`}
                strokeWidth={2}
              />
              <circle cx={geo.gather.x} cy={geo.gather.y} r={5.5} fill="rgba(240,240,240,0.55)" />
              <line
                x1={geo.gather.x}
                y1={geo.gather.y + 16}
                x2={geo.gather.x}
                y2={BILL_CY - BILL_H / 2}
                stroke={WIRE}
                strokeWidth={2.6}
              />
            </g>
          </svg>

          {/* --------------------------------------------------- empty seats */}
          {geo.nodes.map((n, i) => {
            const seat = spring({ frame: frame - n.spawn, fps, config: SPRINGS.heavy });
            if (seat > 0.985) return null;
            return (
              <div
                key={`slot${i}`}
                style={{
                  position: "absolute",
                  left: n.cx - NODE_W / 2,
                  top: n.cy - NODE_H / 2,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: 22,
                  border: "1.5px dashed rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.016)",
                  opacity: 1 - seat,
                }}
              />
            );
          })}

          {/* -------------------------------------------------- the headcount */}
          {geo.nodes.map((n, i) => {
            const s = spring({ frame: frame - n.spawn, fps, config: SPRINGS.heavy });
            if (s <= 0.002) return null;
            const alive = 0.5 + 0.5 * Math.sin((frame + i * 21) / 15);
            const ring = frame >= n.arrive ? Math.exp(-(frame - n.arrive) / 11) : 0;
            return (
              <div
                key={`n${i}`}
                style={{
                  position: "absolute",
                  left: n.cx - NODE_W / 2,
                  top: n.cy - NODE_H / 2,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: 22,
                  backgroundImage: `linear-gradient(180deg, ${SURFACE_TOP} 0%, ${SURFACE_BOT} 100%)`,
                  border: `1px solid rgba(255,255,255,${0.1 + ring * 0.24})`,
                  boxShadow: `${MRD.panelShadow}, inset 0 1px 0 rgba(255,255,255,0.07)`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 26px",
                  gap: 18,
                  opacity: Math.min(1, s * 1.25),
                  transform: `translateY(${(1 - s) * 22}px) scale(${0.955 + s * 0.045})`,
                }}
              >
                <SeatGlyph dim={52} alive={alive} />
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    color: MRD.text,
                    fontSize: 38,
                    fontWeight: 500,
                    letterSpacing: -0.4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.label}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    color: MRD.muted,
                    fontSize: 27,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: 0.2,
                  }}
                >
                  ${fmt(n.cost)}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    width: 9,
                    height: 9,
                    borderRadius: 9,
                    backgroundColor: `rgba(236,236,236,${0.18 + alive * 0.32})`,
                  }}
                />
              </div>
            );
          })}

          {/* ------------------- the same bill, again next month, and the next */}
          {[0, 1].map((i) => {
            const inset = 70 * (i + 1);
            return (
              <div
                key={`ghost${i}`}
                style={{
                  position: "absolute",
                  left: CENTER - BILL_W / 2 + inset / 2,
                  top: BILL_CY - BILL_H / 2 + 72 * (i + 1),
                  width: BILL_W - inset,
                  height: BILL_H,
                  borderRadius: 30,
                  backgroundImage: `linear-gradient(180deg, ${SURFACE_BOT} 0%, #171717 100%)`,
                  border: "1px solid rgba(255,255,255,0.075)",
                  boxShadow: MRD.panelShadow,
                  opacity: Math.min(1, billIn * stackIn) * (i === 0 ? 0.62 : 0.34),
                  transform: `translateY(${(1 - stackIn) * 18}px)`,
                }}
              />
            );
          })}

          {/* ------------------------------------------------------- the bill */}
          <div
            style={{
              position: "absolute",
              left: CENTER - BILL_W / 2,
              top: BILL_CY - BILL_H / 2,
              width: BILL_W,
              height: BILL_H,
              borderRadius: 30,
              backgroundImage: `linear-gradient(180deg, ${SURFACE_TOP} 0%, ${SURFACE_BOT} 100%)`,
              border: `1px solid rgba(255,255,255,${0.12 + arrivalPulse * 0.16})`,
              boxShadow: `${MRD.panelShadow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              opacity: Math.min(1, billIn * 1.3),
              transform: `translateY(${(1 - billIn) * 26}px) scale(${0.965 + billIn * 0.035})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 34,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div
                style={{
                  color: MRD.text,
                  fontSize: 148,
                  fontWeight: 600,
                  letterSpacing: -4,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  textShadow: `0 0 ${36 + arrivalPulse * 32}px rgba(255,255,255,${0.11 + arrivalPulse * 0.14})`,
                }}
              >
                ${fmt(billShown)}
              </div>
              <div
                style={{
                  color: MRD.muted,
                  fontSize: 44,
                  fontWeight: 500,
                  letterSpacing: -0.5,
                  paddingBottom: 16,
                }}
              >
                /mo
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {ROLES.map((r, i) => {
                const fill = interpolate(frame, [r.arrive, r.arrive + 16], [0, 1], camOpts);
                return (
                  <div
                    key={`seg${i}`}
                    style={{
                      width: 108,
                      height: 10,
                      borderRadius: 6,
                      backgroundColor: "rgba(255,255,255,0.09)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${fill * 100}%`,
                        height: "100%",
                        borderRadius: 6,
                        backgroundColor: "rgba(240,240,240,0.6)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* ------------------------------------------------------ soft vignette */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(80% 54% at 50% 50%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.30) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
