/**
 * §4 CAPABILITY RUNDOWN — [0:21-0:31]
 * "And it is not just code. It maps your docs, your configs, even PDFs. Then it
 *  labels every connection as read or guessed..."
 *
 * ONE world, ONE camera. The canonical graph from the kit — literally the same
 * object §1/§3 showed, same GRAPH_NODES coordinates — first grows past code,
 * then every edge shows its receipts.
 *
 *   f0-36     hold, mid-distance on the code cluster only. A slow traverse
 *             pulse runs the edges so the graph reads as live, not a diagram.
 *   f36-58    the camera pulls back — motivated: the graph is about to outgrow
 *             the frame. README.md is already inbound from the upper left.
 *   f44-144   THE GROWTH. Four non-code nodes join 26f apart, each from its own
 *             direction, each met by an edge drawn out of the cluster, each
 *             landing with its own real filename chip in KIND_COLOR.
 *   f158-235  THE RECEIPTS. Every edge resolves outward from the core.
 *             EXTRACTED snaps solid accent green (stroke overshoots then sets);
 *             INFERRED goes dashed amber, 9f later and twice as slow.
 *   f238-268  four edges take an inline EXTRACTED / INFERRED label, and a
 *             two-chip legend lands under the graph.
 *   f276-310  two near-identical camera keys — clean hold for the editor's cut.
 *
 * NO GLOW anywhere: contrast is stroke weight, dash pattern, flat fills and
 * borders, and the G.bg -> G.card value steps.
 *
 * Nothing on screen restates the VO or Victor's "Code / docs / SQL / PDFs"
 * overlay. Every string is real data: filenames from GRAPH_NODES and
 * Graphify's own two edge-provenance values.
 */
import React from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  G,
  GRAPH_EDGES,
  GRAPH_NODES,
  GraphWorld,
  KIND_COLOR,
  MONO,
  nodeById,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 310;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const T = {
  /** the pulse runs the whole first half, then hands over to the receipts */
  pulseOut: [140, 158] as const,
  /** resolve wave: start + radial spread; INFERRED is offset and slower */
  resStart: 158,
  resSpread: 52,
  resInfDelay: 9,
  extDur: 7,
  infDur: 16,
  legend: 232,
} as const;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };

// ---------------------------------------------------------------------------
// World geometry — GRAPH_NODES verbatim, anchored where §3 leaves them
// ---------------------------------------------------------------------------

const GX = 540;
const GY = 40;
/** Node radius scale. Positions are never touched. */
const RBASE = 22;

const NW = (id: string) => {
  const n = nodeById(id);
  return {
    x: GX + n.x,
    y: GY + n.y,
    r: RBASE * (n.r ?? 1),
    kind: n.kind,
    label: n.label ?? id,
  };
};

const CODE = GRAPH_NODES.filter((n) => n.kind === "code");

/** SVG canvas for the edges. overflow:visible, so this is only a coord frame. */
const SB = { x: 0, y: -400, w: 1100, h: 1100 };
const sx = (x: number) => x - SB.x;
const sy = (y: number) => y - SB.y;

// --- the growth ------------------------------------------------------------
// Each non-code node enters from its own quadrant, 26 frames apart, and is met
// by an edge drawn outward from its real anchor in GRAPH_EDGES.
// Chips are offset INBOARD (cdx) as well as outboard (cdy): that keeps the
// widest camera position clear of the 54px margins without shrinking the graph,
// and each chip still sits directly over/under its own node.
const GROWTH = [
  { id: "readme", anchor: "app", start: 44, fx: -300, fy: -210, cdx: 80, cdy: -74 },
  { id: "schema", anchor: "db", start: 70, fx: -300, fy: 210, cdx: 90, cdy: 74 },
  { id: "cfg", anchor: "router", start: 96, fx: 300, fy: -210, cdx: -80, cdy: -74 },
  { id: "spec", anchor: "api", start: 122, fx: 300, fy: 210, cdx: -85, cdy: 74 },
] as const;

type Growth = (typeof GROWTH)[number];

const growthOf = (a: string, b: string): Growth | undefined =>
  GROWTH.find((g) => g.id === a || g.id === b);

// --- the resolve wave ------------------------------------------------------
// Ordered by how far the edge's midpoint sits from the core, so provenance
// resolves outward — the same direction the graph just grew.
const CORE = { x: GX, y: GY + 65 };
const EDGE_DIST = GRAPH_EDGES.map((e) => {
  const a = NW(e.a);
  const b = NW(e.b);
  return Math.hypot((a.x + b.x) / 2 - CORE.x, (a.y + b.y) / 2 - CORE.y);
});
const D_MIN = Math.min(...EDGE_DIST);
const D_MAX = Math.max(...EDGE_DIST);

// --- inline edge labels ----------------------------------------------------
// All four `rel` values are read from GRAPH_EDGES, never assigned here.
// Positions sit ON their own edge, in the four clear corridors of the layout.
// Two only. The graph's interior has no corridor wide enough to annotate
// without burying an edge, and the legend already carries both words — a
// third pill turns the payoff into a wall of chips.
const EDGE_LABELS = [
  { a: "cfg", b: "router", x: 818, y: -96, at: 242 },
  { a: "spec", b: "api", x: 700, y: 336, at: 250 },
] as const;

const relOf = (a: string, b: string) =>
  GRAPH_EDGES.find(
    (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
  )!.rel;

const LEGEND = { x: 552, y: 520 };

// --- colours ---------------------------------------------------------------

const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/** Unlabelled edge: present, but making no claim about provenance yet. */
const PRE_STROKE = "#93A099";

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const NodeDot: React.FC<{
  x: number;
  y: number;
  r: number;
  color: string;
  scale?: number;
  opacity?: number;
}> = ({ x, y, r, color, scale = 1, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      transform: `translate(-50%, -50%) scale(${scale})`,
    }}
  >
    {/* flat base-colour collar so edges terminate cleanly. Not a glow. */}
    <div
      style={{
        position: "absolute",
        left: -(r + 5),
        top: -(r + 5),
        width: (r + 5) * 2,
        height: (r + 5) * 2,
        borderRadius: 999,
        background: G.bg,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -r,
        top: -r,
        width: r * 2,
        height: r * 2,
        borderRadius: 999,
        background: color,
      }}
    />
  </div>
);

const FileChip: React.FC<{
  x: number;
  y: number;
  label: string;
  color: string;
  enter: number;
  dir: number;
}> = ({ x, y, label, color, enter, dir }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity: enter,
      transform: `translate(-50%, -50%) translateY(${(1 - enter) * -18 * dir}px)`,
      padding: "8px 14px",
      borderRadius: 12,
      background: hexA(color, 0.14),
      border: `1.5px solid ${hexA(color, 0.46)}`,
      fontFamily: MONO,
      fontSize: 40,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: -0.2,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

const RelLabel: React.FC<{
  x: number;
  y: number;
  rel: "EXTRACTED" | "INFERRED";
  enter: number;
}> = ({ x, y, rel, enter }) => {
  const c = rel === "EXTRACTED" ? G.accent : G.amber;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: enter,
        transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * enter})`,
        padding: "7px 12px",
        borderRadius: 10,
        background: G.bg,
        border: `1.5px solid ${hexA(c, 0.42)}`,
        fontFamily: MONO,
        fontSize: 34,
        fontWeight: 700,
        letterSpacing: 1.2,
        lineHeight: 1.1,
        color: c,
        whiteSpace: "nowrap",
      }}
    >
      {rel}
    </div>
  );
};

const LegendChip: React.FC<{
  rel: "EXTRACTED" | "INFERRED";
}> = ({ rel }) => {
  const ext = rel === "EXTRACTED";
  const c = ext ? G.accent : G.amber;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        borderRadius: 14,
        background: hexA(c, 0.1),
        border: `1.5px solid ${hexA(c, 0.4)}`,
      }}
    >
      <svg width={62} height={12} style={{ display: "block", overflow: "visible" }}>
        <line
          x1={0}
          y1={6}
          x2={62}
          y2={6}
          stroke={c}
          strokeWidth={ext ? 8 : 6.2}
          strokeLinecap="round"
          {...(ext ? {} : { strokeDasharray: "16 14" })}
        />
      </svg>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 1.4,
          lineHeight: 1.1,
          color: c,
          whiteSpace: "nowrap",
        }}
      >
        {rel}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const GfxEveryFileType: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- one world, one camera ------------------------------------------------
  // hold (0-36) -> motivated pull-back (36-58, 22f) -> long hold while the
  // graph fills out and resolves (58-276, a 0.03 creep that reads as a hold)
  // -> two near-identical keys (276, 310).
  // Widest key is z = 1.18: content spans world x 164.5..937.5 around fx 551,
  // i.e. screen 84..996 — inside the 54px margins — and world y -260.5..553.5
  // around fy 146, i.e. screen 480..1440, clear of the top 10% / bottom 12%.
  const cam = useCam({
    keys: [0, 36, 58, 150, 276, 310],
    fx: [568, 568, 555, 551, 551, 551],
    fy: [101, 101, 138, 146, 146, 146],
    z: [1.58, 1.58, 1.22, 1.18, 1.18, 1.178],
  });

  // --- growth progress ------------------------------------------------------
  const gP = GROWTH.map((g) =>
    spring({
      frame: frame - g.start,
      fps,
      config: { damping: 15, stiffness: 105, mass: 1 },
    }),
  );
  const chipP = GROWTH.map((g) =>
    spring({
      frame: frame - (g.start + 13),
      fps,
      config: { damping: 14, stiffness: 170 },
    }),
  );
  const gIndex = Object.fromEntries(GROWTH.map((g, i) => [g.id, i])) as Record<
    string,
    number
  >;

  /** Live world position of a node — new nodes fly in, code nodes never move. */
  const liveNode = (id: string) => {
    const n = NW(id);
    const i = gIndex[id];
    if (i === undefined) return { ...n, p: 1 };
    const g = GROWTH[i];
    const p = gP[i];
    return {
      ...n,
      x: n.x + g.fx * (1 - p),
      y: n.y + g.fy * (1 - p),
      p,
    };
  };

  // --- edge geometry --------------------------------------------------------
  // A growth edge is drawn OUT of the cluster toward the node's LIVE position
  // and closes the gap at 60% of the node's travel, so the line is never a stub
  // hanging in empty space and the node never lands unconnected.
  const edgeGeom = (e: (typeof GRAPH_EDGES)[number]) => {
    const g = growthOf(e.a, e.b);
    if (!g) return { from: NW(e.a), to: NW(e.b), dp: 1 };
    const i = gIndex[g.id];
    const p = gP[i];
    const t = NW(g.id);
    return {
      from: NW(g.anchor),
      to: { ...t, x: t.x + g.fx * (1 - p), y: t.y + g.fy * (1 - p) },
      dp: interpolate(Math.min(p, 1), [0, 0.6], [0, 1], clamp),
    };
  };

  // --- the receipts wave ----------------------------------------------------
  const resOf = (i: number, rel: "EXTRACTED" | "INFERRED") => {
    const norm = (EDGE_DIST[i] - D_MIN) / (D_MAX - D_MIN);
    const at =
      T.resStart + norm * T.resSpread + (rel === "INFERRED" ? T.resInfDelay : 0);
    const dur = rel === "INFERRED" ? T.infDur : T.extDur;
    return interpolate(frame, [at, at + dur], [0, 1], ease);
  };

  const pulseOp = interpolate(frame, [T.pulseOut[0], T.pulseOut[1]], [1, 0], ease);
  const legendE = spring({
    frame: frame - T.legend,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  return (
    <GraphWorld cam={cam}>
      {/* ------------------------------------------------------------- edges */}
      <svg
        width={SB.w}
        height={SB.h}
        viewBox={`0 0 ${SB.w} ${SB.h}`}
        style={{ position: "absolute", left: SB.x, top: SB.y, overflow: "visible" }}
      >
        {GRAPH_EDGES.map((e, i) => {
          const { from, to, dp } = edgeGeom(e);
          if (dp <= 0.0001) return null;

          const res = resOf(i, e.rel);
          const ext = e.rel === "EXTRACTED";
          // ramp the colour fast so it never sits in a muddy mid-blend
          const cRes = interpolate(res, [0, ext ? 0.45 : 0.34], [0, 1], clamp);
          const stroke = interpolateColors(cRes, [0, 1], [
            PRE_STROKE,
            ext ? G.accent : G.amber,
          ]);
          // EXTRACTED overshoots its weight then sets: the confident snap.
          const w = ext
            ? interpolate(res, [0, 0.5, 1], [5.5, 10.5, 8], clamp)
            : interpolate(res, [0, 1], [5.5, 6.2], clamp);
          const op = interpolate(res, [0, 1], [0.8, 1], clamp);
          const drawn = dp >= 0.999;

          return (
            <path
              key={`e${i}`}
              d={`M ${sx(from.x)} ${sy(from.y)} L ${sx(to.x)} ${sy(to.y)}`}
              stroke={stroke}
              strokeOpacity={op}
              strokeWidth={w}
              strokeLinecap="round"
              fill="none"
              {...(drawn
                ? ext
                  ? {}
                  : { strokeDasharray: `16 ${14 * res}` }
                : {
                    pathLength: 1,
                    strokeDasharray: 1,
                    strokeDashoffset: 1 - dp,
                  })}
            />
          );
        })}

        {/* the graph is quietly alive — one slow traverse pulse per edge */}
        {pulseOp > 0.01
          ? GRAPH_EDGES.map((e, i) => {
              const { from, to, dp } = edgeGeom(e);
              if (dp < 0.999) return null;
              const ph = (((frame * 0.0085 + i * 0.147) % 1) + 1) % 1;
              return (
                <path
                  key={`p${i}`}
                  d={`M ${sx(from.x)} ${sy(from.y)} L ${sx(to.x)} ${sy(to.y)}`}
                  stroke="#C6FBE0"
                  strokeOpacity={0.4 * pulseOp}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray="0.1 0.9"
                  strokeDashoffset={-ph}
                />
              );
            })
          : null}
      </svg>

      {/* ------------------------------------------------------------- nodes */}
      {CODE.map((n) => {
        const p = NW(n.id);
        return (
          <NodeDot
            key={n.id}
            x={p.x}
            y={p.y}
            r={p.r}
            color={KIND_COLOR[n.kind]}
          />
        );
      })}

      {GROWTH.map((g, i) => {
        const n = liveNode(g.id);
        if (gP[i] <= 0.0001) return null;
        return (
          <NodeDot
            key={g.id}
            x={n.x}
            y={n.y}
            r={n.r}
            color={KIND_COLOR[n.kind]}
            scale={0.45 + 0.55 * Math.min(gP[i], 1.12)}
            opacity={interpolate(gP[i], [0, 0.16], [0, 1], clamp)}
          />
        );
      })}

      {/* --------------------------------------------- real file-type chips */}
      {GROWTH.map((g, i) => {
        if (chipP[i] <= 0.001) return null;
        const n = NW(g.id);
        return (
          <FileChip
            key={`c${g.id}`}
            x={n.x + g.cdx}
            y={n.y + g.cdy}
            label={n.label}
            color={KIND_COLOR[n.kind]}
            enter={Math.min(chipP[i], 1)}
            dir={g.cdy < 0 ? 1 : -1}
          />
        );
      })}

      {/* -------------------------------------------- inline edge provenance */}
      {EDGE_LABELS.map((l) => {
        const e = spring({
          frame: frame - l.at,
          fps,
          config: { damping: 15, stiffness: 175 },
        });
        if (e <= 0.001) return null;
        return (
          <RelLabel
            key={`l${l.a}${l.b}`}
            x={l.x}
            y={l.y}
            rel={relOf(l.a, l.b)}
            enter={Math.min(e, 1)}
          />
        );
      })}

      {/* ------------------------------------------------------------ legend */}
      {legendE > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: LEGEND.x,
            top: LEGEND.y,
            display: "flex",
            alignItems: "center",
            gap: 40,
            opacity: Math.min(legendE, 1),
            transform: `translate(-50%, -50%) translateY(${(1 - Math.min(legendE, 1)) * 20}px)`,
          }}
        >
          <LegendChip rel="EXTRACTED" />
          <LegendChip rel="INFERRED" />
        </div>
      ) : null}
    </GraphWorld>
  );
};
