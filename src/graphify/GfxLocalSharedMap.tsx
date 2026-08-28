/**
 * §5 VALUE STAMP — "The code parsing runs fully local with no AI involved, so
 * nothing leaves your machine. It's free, open source, and the same map works
 * in Claude, Codex, and Gemini."
 *
 * Two beats inside ONE enclosure:
 *   f0-106   THE PARSE. Six source files queue into the boundary and are
 *            consumed. tree-sitter walks auth.ts one grammar node at a time —
 *            a scan band steps down the source, the AST grows node by node,
 *            a walk readout names each production and a nine-cell tape fills.
 *            The walk then dispenses the graph: a manifold under the parser
 *            fires token chips down onto the blueprint, and every graph node
 *            lands because a chip landed on it. One packet runs at a wall
 *            port, stops dead and comes back. Outside the wall, nothing.
 *   f106-190 THE SHARED MAP. Camera pulls back down the enclosure: the
 *            finished graph fans out to Claude / Codex / Gemini — three
 *            identical lockups — all still inside the same machine.
 *   f190-220 Two identical camera keys, clean hold.
 *
 * Camera: tight on the parse (z 1.20) -> down onto the production (z 1.08) ->
 * out to the whole machine (z 1.00). Three holds, two 18f moves, all action
 * inside the holds.
 *
 * World units are 1:1 with screen px at the closing camera key (z = 1, fx =
 * 540), so the tool row can be derived straight from safePadX(width).
 */
import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  EASE,
  FONT,
  G,
  GA,
  GCard,
  GChip,
  GLogo,
  GRAPH_EDGES,
  GRAPH_NODES,
  GTerminal,
  GraphWorld,
  KIND_COLOR,
  MONO,
  SPRINGS,
  accentA,
  amberA,
  nodeById,
  safePadX,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 220;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical machine.
//   [ source queue ] -> [ tree-sitter walk ] -> [ emit manifold ]
//   -> [ the graph ] -> [ 3 tools ]
// all of it enclosed by WALL. Nothing is drawn outside WALL, ever.
//
// Everything above y = 970 is beat-1 only: it sits above the frame at the
// closing camera key, so it cannot touch the approved beat-2 composition.
// Anything beat-1 that lives BELOW 970 (manifold, blueprint) fades out on
// T.fade, well before the tool cards land.
// ---------------------------------------------------------------------------

const WALL = { x: 100, y: 20, w: 880, h: 2560 }; // 100..980 , 20..2580

const SRC = { w: 232, h: 66, gapX: 26, gapY: 14, y0: 78 };
const SRC_X0 = 540 - (3 * SRC.w + 2 * SRC.gapX) / 2; // 166
const SRC_CX = [0, 1, 2].map((c) => SRC_X0 + c * (SRC.w + SRC.gapX) + SRC.w / 2);
const SRC_BOT = SRC.y0 + SRC.h + SRC.gapY + SRC.h; // 224
const RAIL_Y = 258;

const PARSE = { x: 140, y: 300, w: 800, h: 610 }; // 300..910
const PARSE_IN = { w: 740, codeW: 524 }; // inside GTerminal padding

const MAN = { y: 1020, x0: 250, x1: 830, h: 12 }; // emit manifold
const MAN_X = [250, 347, 443, 540, 637, 733, 830];
const MAN_OUT = MAN.y + 18;

const GRAPH = { cx: 540, cy: 1420, s: 1 };
const PORTS = [1360, 1520];
const ESCAPE_PORT = 1520;
const JUNCTION = { x: 540, y: 1960 };
const BUS_Y = 2030;
const CARD = { y: 2080, h: 310 };
const LIC_Y = 2450;

// Graph drawing surface (world box that comfortably contains every node).
const GSVG = { left: 140, top: 1150, w: 820, h: 660 };
// Chip-trail surface: manifold down through the whole graph.
const TSVG = { left: 140, top: 1000, w: 820, h: 820 };

const gx = (n: { x: number }) => GRAPH.cx + n.x * GRAPH.s;
const gy = (n: { y: number }) => GRAPH.cy + n.y * GRAPH.s;
const nr = (n: { r?: number }) => 20 * (n.r ?? 1);

const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(
    h.slice(2, 4),
    16,
  )}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
};

/** Tool row derived from the 5% safe margin, never hard-coded. */
const toolRow = (width: number) => {
  const pad = safePadX(width); // 54 on 1080
  const left = pad + 96; //  150 — sits well inside the machine wall
  const right = width - pad - 96; //  930
  const gap = 30;
  const w = (right - left - gap * 2) / 3; // 240
  return { w, xs: [left, left + w + gap, left + 2 * (w + gap)] };
};

// ---------------------------------------------------------------------------
// Content — all real: real file names, real TypeScript, real tree-sitter
// grammar node names, real product names, the repo's real dual licence.
// Nothing here restates the VO or the burned overlay.
// ---------------------------------------------------------------------------

const SRC_ROWS = [
  ["app.ts", "auth.ts", "session.ts"],
  ["router.ts", "db.ts", "schema.sql"],
];

const SRC_LINES = [
  'import { db } from "./db"',
  'import { check } from "./mw"',
  "",
  "export function auth(token) {",
  "  const s = check(token)",
  "  return db.user(s.uid)",
  "}",
];

/** Deterministic DFS walk — 9 productions, fixed order, no wobble. */
const WALK = [
  "program",
  "import_statement",
  "export_statement",
  "function_declaration",
  "formal_parameters",
  "statement_block",
  "lexical_declaration",
  "call_expression",
  "return_statement",
];

/** Which source line the head is on at each step. */
const STEP_LINE = [0, 1, 3, 3, 3, 3, 4, 4, 5];

/** The AST that walk produces — one node per step, fixed shape. */
const AST = [
  { x: 92, y: 26, p: -1 },
  { x: 24, y: 108, p: 0 },
  { x: 126, y: 108, p: 0 },
  { x: 126, y: 190, p: 2 },
  { x: 68, y: 272, p: 3 },
  { x: 152, y: 272, p: 3 },
  { x: 112, y: 354, p: 5 },
  { x: 112, y: 436, p: 6 },
  { x: 168, y: 354, p: 5 },
];

const TOOLS = [
  { name: "Claude", src: GA.logo.claude, white: false },
  { name: "Codex", src: GA.logo.codex, white: true },
  { name: "Gemini", src: GA.logo.gemini, white: false },
];

/**
 * The graph is dispensed, not faded in: seven waves off the manifold, in
 * dependency order out from `app`. Each wave fires one chip per node; the node
 * only exists once its chip lands.
 */
const WAVES: string[][] = [
  ["app"],
  ["auth", "session", "router"],
  ["mw", "queue"],
  ["db", "user", "worker"],
  ["api"],
  ["readme", "cfg"],
  ["schema", "spec"],
];

const T = {
  srcIn: [1, 4, 7, 10, 13, 16],
  hot: 12, // file k consumed at hot + k*3, for 10f
  feed: [10, 16, 22], // column c feed line, 10f
  rail: 8, // collector rail, 16f
  inlet: 14, // rail -> parser, 10f
  scan: 14, // 9 steps x 3f  -> last production at f38
  scanEvery: 3,
  trunk: 28, // parser -> graph trunk, 14f
  man: 60, // manifold energises, 10f
  waves: [62, 65, 68, 71, 74, 77, 80],
  chip: 8, // chip flight time
  edgeDur: 10,
  out: 84, // outbound attempt: 84 -> wall -> back by 104
  inner: [86, 89, 92],
  innerDur: 11,
  spine: 86,
  bus: 92,
  fade: [100, 118], // beat-1-only material clears before the cards land
  drops: 126,
  cards: [130, 136, 142],
  lic: 146,
  fan: [152, 158, 164],
  fanDur: 22,
};

const EMIT_AT: Record<string, number> = {};
const ARRIVE_AT: Record<string, number> = {};
WAVES.forEach((ids, w) =>
  ids.forEach((id) => {
    EMIT_AT[id] = T.waves[w];
    ARRIVE_AT[id] = T.waves[w] + T.chip;
  }),
);

/** An edge can only draw once both of its endpoints have landed. */
const EDGE_AT = GRAPH_EDGES.map(
  (e) => Math.max(ARRIVE_AT[e.a], ARRIVE_AT[e.b]) + 1,
);

/** Nearest manifold port for a target x. */
const portFor = (x: number) =>
  MAN_X.reduce((best, p) => (Math.abs(p - x) < Math.abs(best - x) ? p : best), MAN_X[0]);

// Packets that stay inside: three graph edges, by index into GRAPH_EDGES.
const INNER_PKT = [
  { edge: 0, at: T.inner[0] }, // app -> auth
  { edge: 5, at: T.inner[1] }, // session -> mw
  { edge: 7, at: T.inner[2] }, // db -> user
];

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Packet: React.FC<{
  x: number;
  y: number;
  on: boolean;
  size?: number;
  color?: string;
  squash?: number;
}> = ({ x, y, on, size = 15, color = G.accent, squash = 1 }) => {
  if (!on) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        transform: `scaleX(${squash})`,
        zIndex: 30,
      }}
    />
  );
};

/** Straight rule that draws itself. Divs, not SVG — no glow, flat stroke. */
const VLine: React.FC<{
  x: number;
  y0: number;
  y1: number;
  p: number;
  color?: string;
  w?: number;
  opacity?: number;
}> = ({ x, y0, y1, p, color = accentA(0.55), w = 3, opacity = 1 }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y0,
        width: w,
        height: (y1 - y0) * p,
        background: color,
        borderRadius: w,
        opacity,
      }}
    />
  );

// ---------------------------------------------------------------------------

export const GfxLocalSharedMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const row = toolRow(width);

  // --- Camera ---------------------------------------------------------------
  // hold on the parse -> travel down onto the production -> pull back to the
  // whole machine. Last three keys are identical: a dead-clean closing hold.
  const cam = useCam({
    keys: [0, 42, 60, 106, 124, 194, 220],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [706, 706, 1240, 1240, 1930, 1930, 1930],
    z: [1.2, 1.2, 1.08, 1.08, 1.0, 1.0, 1.0],
  });

  // --- Beat 1: the deterministic walk ---------------------------------------
  const step = Math.min(
    WALK.length - 1,
    Math.max(-1, Math.floor((frame - T.scan) / T.scanEvery)),
  );
  const headOn = step >= 0 && frame <= T.scan + WALK.length * T.scanEvery + 4;
  const litLine = step >= 0 ? STEP_LINE[step] : -1;
  const maxLine = step >= 0 ? Math.max(...STEP_LINE.slice(0, step + 1)) : -1;

  const railP = interpolate(frame, [T.rail, T.rail + 16], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });
  const inletP = interpolate(frame, [T.inlet, T.inlet + 10], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });
  const trunkP = interpolate(frame, [T.trunk, T.trunk + 14], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });
  const manP = interpolate(frame, [T.man, T.man + 10], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });

  /** Everything beat-1 that lives below the closing frame top must clear. */
  const b1 = interpolate(frame, T.fade, [1, 0], clampOpts);

  // --- Beat 1: the outbound attempt ----------------------------------------
  const outT = interpolate(
    frame,
    [T.out, T.out + 9, T.out + 15, T.out + 20],
    [0, 1, 1, 0],
    clampOpts,
  );
  const outOn = frame >= T.out && frame <= T.out + 20;
  const router = nodeById("router");
  const outFrom = { x: gx(router), y: gy(router) };
  const outTo = { x: WALL.x + WALL.w - 8, y: ESCAPE_PORT };
  const outX = outFrom.x + (outTo.x - outFrom.x) * outT;
  const outY = outFrom.y + (outTo.y - outFrom.y) * outT;
  const outSquash = interpolate(
    frame,
    [T.out + 7, T.out + 10, T.out + 15, T.out + 18],
    [1, 0.5, 0.5, 1],
    clampOpts,
  );
  const portFlash = interpolate(
    frame,
    [T.out + 8, T.out + 11, T.out + 15, T.out + 19],
    [0, 1, 1, 0],
    clampOpts,
  );

  // --- Beat 2: fan-out ------------------------------------------------------
  const spineP = interpolate(frame, [T.spine, T.spine + 14], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });
  const busP = interpolate(frame, [T.bus, T.bus + 14], [0, 1], {
    ...clampOpts,
    easing: EASE,
  });
  const dropP = row.xs.map((_, i) =>
    interpolate(frame, [T.drops + i * 3, T.drops + i * 3 + 12], [0, 1], {
      ...clampOpts,
      easing: EASE,
    }),
  );
  const cardIn = T.cards.map((at) =>
    spring({ frame: frame - at, fps, config: SPRINGS.pop }),
  );
  const licIn = spring({ frame: frame - T.lic, fps, config: SPRINGS.pop });

  const cardCx = row.xs.map((x) => x + row.w / 2);

  return (
    <GraphWorld cam={cam}>
      {/* ------------------------------------------------- the machine wall */}
      <div
        style={{
          position: "absolute",
          left: WALL.x,
          top: WALL.y,
          width: WALL.w,
          height: WALL.h,
          borderRadius: 46,
          // The value step between inside and outside. No glow, no halo —
          // just a lifted interior and a heavy stroke.
          background: "rgba(255,255,255,0.042)",
          border: "3.5px solid rgba(255,255,255,0.26)",
          boxSizing: "border-box",
        }}
      />
      {/* chassis hairline, inset — reads as a real enclosure, not a box */}
      <div
        style={{
          position: "absolute",
          left: WALL.x + 14,
          top: WALL.y + 14,
          width: WALL.w - 28,
          height: WALL.h - 28,
          borderRadius: 34,
          border: "1.5px solid rgba(255,255,255,0.055)",
          boxSizing: "border-box",
        }}
      />

      {/* ports on both walls; the right one at ESCAPE_PORT is where the
          outbound packet stops */}
      {PORTS.map((py) =>
        [WALL.x, WALL.x + WALL.w].map((px) => {
          const isEscape = px !== WALL.x && py === ESCAPE_PORT;
          return (
            <div
              key={`${px}-${py}`}
              style={{
                position: "absolute",
                left: px - 9,
                top: py - 44,
                width: 18,
                height: 88,
                borderRadius: 7,
                background: G.panel,
                border: `3px solid rgba(255,255,255,${
                  0.2 + (isEscape ? 0.42 * portFlash : 0)
                })`,
                boxSizing: "border-box",
              }}
            />
          );
        }),
      )}

      {/* ------------------------------------------- the blueprint (scaffold)
          The machine's internal wiring is etched from frame 0, so the lower
          half is never hollow — it is a plan waiting to be built. The walk
          fills it in; it is fully retired before the tool cards land. */}
      <svg
        width={GSVG.w}
        height={GSVG.h}
        viewBox={`0 0 ${GSVG.w} ${GSVG.h}`}
        style={{
          position: "absolute",
          left: GSVG.left,
          top: GSVG.top,
          zIndex: 8,
          opacity: b1,
        }}
      >
        {GRAPH_EDGES.map((e) => {
          const a = nodeById(e.a);
          const b = nodeById(e.b);
          return (
            <line
              key={`s-${e.a}-${e.b}`}
              x1={gx(a) - GSVG.left}
              y1={gy(a) - GSVG.top}
              x2={gx(b) - GSVG.left}
              y2={gy(b) - GSVG.top}
              stroke="rgba(255,255,255,0.13)"
              strokeWidth={1.8}
              strokeDasharray={e.rel === "INFERRED" ? "11 9" : undefined}
            />
          );
        })}
        {GRAPH_NODES.map((n) => (
          <circle
            key={`s-${n.id}`}
            cx={gx(n) - GSVG.left}
            cy={gy(n) - GSVG.top}
            r={nr(n) - 1.2}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={2.2}
          />
        ))}
      </svg>
      {/* blueprint of the fan-out plumbing, same treatment */}
      <div style={{ opacity: b1 }}>
        <VLine
          x={JUNCTION.x}
          y0={gy(nodeById("api")) + nr(nodeById("api"))}
          y1={JUNCTION.y - 14}
          p={1}
          color="rgba(255,255,255,0.15)"
          w={2.2}
        />
        <div
          style={{
            position: "absolute",
            left: JUNCTION.x - 15,
            top: JUNCTION.y - 15,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.14)",
            boxSizing: "border-box",
          }}
        />
        <VLine
          x={JUNCTION.x}
          y0={JUNCTION.y + 15}
          y1={BUS_Y}
          p={1}
          color="rgba(255,255,255,0.15)"
          w={2.2}
        />
        <div
          style={{
            position: "absolute",
            left: cardCx[0],
            top: BUS_Y - 1,
            width: cardCx[2] - cardCx[0],
            height: 2.2,
            background: "rgba(255,255,255,0.15)",
          }}
        />
      </div>

      {/* ------------------------------------------------ the source queue */}
      {SRC_ROWS.map((files, r) =>
        files.map((f, c) => {
          const k = r * 3 + c;
          const e = spring({
            frame: frame - T.srcIn[k],
            fps,
            config: SPRINGS.pop,
          });
          const hotAt = T.hot + k * 3;
          const hot = frame >= hotAt && frame <= hotAt + 10;
          const done = frame > hotAt + 10;
          return (
            <div
              key={f}
              style={{
                position: "absolute",
                left: SRC_X0 + c * (SRC.w + SRC.gapX),
                top: SRC.y0 + r * (SRC.h + SRC.gapY),
                width: SRC.w,
                height: SRC.h,
                borderRadius: 15,
                background: G.cardHi,
                border: `1.5px solid ${
                  hot ? G.accentLine : "rgba(255,255,255,0.13)"
                }`,
                borderLeft:
                  done || hot
                    ? `5px solid ${hot ? G.accent : accentA(0.55)}`
                    : "1.5px solid rgba(255,255,255,0.13)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: 30,
                color: hot ? G.text : done ? G.muted : G.faint,
                opacity: Math.min(1, e) * (done ? 0.72 : 1),
                transform: `translateY(${(1 - Math.min(1, e)) * 16}px)`,
                boxSizing: "border-box",
              }}
            >
              {f}
            </div>
          );
        }),
      )}

      {/* column feeds -> collector rail -> parser inlet */}
      {SRC_CX.map((cx, c) => (
        <VLine
          key={`f${c}`}
          x={cx}
          y0={SRC_BOT}
          y1={RAIL_Y}
          p={interpolate(frame, [T.feed[c], T.feed[c] + 10], [0, 1], {
            ...clampOpts,
            easing: EASE,
          })}
          color={accentA(0.38)}
          w={2.5}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 540 - ((SRC_CX[2] - SRC_CX[0]) / 2) * railP,
          top: RAIL_Y - 1.5,
          width: (SRC_CX[2] - SRC_CX[0]) * railP,
          height: 3,
          borderRadius: 3,
          background: accentA(0.42),
        }}
      />
      <VLine
        x={540}
        y0={RAIL_Y}
        y1={PARSE.y}
        p={inletP}
        color={accentA(0.5)}
        w={3}
      />

      {/* --------------------------------------------------------- the walk */}
      <GTerminal
        x={PARSE.x}
        y={PARSE.y}
        w={PARSE.w}
        h={PARSE.h}
        title="tree-sitter · auth.ts"
      >
        <div style={{ position: "relative", width: PARSE_IN.w, height: 470 }}>
          {/* stepping scan band — mechanical, one production every 3 frames */}
          {headOn && litLine >= 0 ? (
            <div
              style={{
                position: "absolute",
                left: -14,
                top: litLine * 44 - 3,
                width: PARSE_IN.codeW + 24,
                height: 42,
                borderRadius: 8,
                background: G.accentSoft,
                borderLeft: `4px solid ${G.accent}`,
                boxSizing: "border-box",
              }}
            />
          ) : null}

          {SRC_LINES.map((ln, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: i * 44,
                width: PARSE_IN.codeW,
                height: 44,
                lineHeight: "38px",
                fontFamily: MONO,
                fontSize: 30,
                whiteSpace: "pre",
                color: i <= maxLine ? G.text : G.faint,
              }}
            >
              {ln}
            </div>
          ))}

          {/* divider + the production the head is on right now */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 336,
              width: PARSE_IN.codeW,
              height: 1.5,
              background: "rgba(255,255,255,0.07)",
            }}
          />
          {step >= 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 358,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 32,
                  borderRadius: 3,
                  background: G.accent,
                }}
              />
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 27,
                  color: G.accent,
                  letterSpacing: 0.3,
                }}
              >
                {WALK[step]}
              </div>
            </div>
          ) : null}

          {/* nine-cell tape — one cell per production, fills left to right */}
          {WALK.map((w, i) => (
            <div
              key={w}
              style={{
                position: "absolute",
                left: i * 58,
                top: 424,
                width: 52,
                height: 10,
                borderRadius: 5,
                background: i <= step ? G.accent : "rgba(255,255,255,0.09)",
              }}
            />
          ))}

          {/* the AST it produces — fixed shape, one node per step */}
          <svg
            width={184}
            height={460}
            viewBox="0 0 184 460"
            style={{ position: "absolute", left: 542, top: 0 }}
          >
            {AST.map((n, i) => {
              if (n.p < 0) return null;
              const par = AST[n.p];
              const midY = (par.y + 9 + (n.y - 9)) / 2;
              const on = step >= i ? 1 : 0;
              return (
                <polyline
                  key={`l${i}`}
                  points={`${par.x},${par.y + 9} ${par.x},${midY} ${n.x},${midY} ${n.x},${n.y - 9}`}
                  fill="none"
                  stroke={accentA(0.42)}
                  strokeWidth={2}
                  opacity={on}
                />
              );
            })}
            {AST.map((n, i) => {
              if (step < i) return null;
              const s = interpolate(
                frame,
                [T.scan + i * T.scanEvery, T.scan + i * T.scanEvery + 2],
                [0.55, 1],
                clampOpts,
              );
              return (
                <rect
                  key={`n${i}`}
                  x={n.x - 9 * s}
                  y={n.y - 9 * s}
                  width={18 * s}
                  height={18 * s}
                  rx={4}
                  fill={accentA(0.2)}
                  stroke={G.accent}
                  strokeWidth={2.4}
                />
              );
            })}
          </svg>
        </div>
      </GTerminal>

      {/* parser -> graph trunk (persists: this is the feed the finished map
          hangs from in beat 2) */}
      <VLine
        x={540}
        y0={PARSE.y + PARSE.h}
        y1={gy(nodeById("app")) - nr(nodeById("app"))}
        p={trunkP}
        color={accentA(0.5)}
        w={3}
      />

      {/* ---------------------------------------------------- emit manifold */}
      <div style={{ opacity: b1 }}>
        {/* etched stem: parser -> manifold -> graph, there from frame 0 */}
        <VLine
          x={540}
          y0={PARSE.y + PARSE.h}
          y1={MAN.y}
          p={1}
          color="rgba(255,255,255,0.15)"
          w={2.2}
        />
        <VLine
          x={540}
          y0={MAN.y + MAN.h}
          y1={gy(nodeById("app")) - nr(nodeById("app"))}
          p={1}
          color="rgba(255,255,255,0.15)"
          w={2.2}
        />
        <div
          style={{
            position: "absolute",
            left: MAN.x0,
            top: MAN.y,
            width: MAN.x1 - MAN.x0,
            height: MAN.h,
            borderRadius: MAN.h / 2,
            background: "rgba(255,255,255,0.055)",
            border: "1.5px solid rgba(255,255,255,0.14)",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - ((MAN.x1 - MAN.x0) / 2) * manP,
            top: MAN.y + 2,
            width: (MAN.x1 - MAN.x0) * manP,
            height: MAN.h - 4,
            borderRadius: MAN.h / 2,
            background: accentA(0.5),
          }}
        />
        {MAN_X.map((px) => {
          const firing = GRAPH_NODES.some(
            (n) =>
              portFor(gx(n)) === px &&
              frame >= EMIT_AT[n.id] &&
              frame <= EMIT_AT[n.id] + 6,
          );
          return (
            <div
              key={px}
              style={{
                position: "absolute",
                left: px - 9,
                top: MAN.y + MAN.h,
                width: 18,
                height: 20,
                borderRadius: 5,
                background: firing ? G.accentSoft : G.panel,
                border: `2.5px solid ${
                  firing ? G.accent : "rgba(255,255,255,0.18)"
                }`,
                boxSizing: "border-box",
              }}
            />
          );
        })}
      </div>

      {/* chip trails — each graph node is delivered, never faded in */}
      <svg
        width={TSVG.w}
        height={TSVG.h}
        viewBox={`0 0 ${TSVG.w} ${TSVG.h}`}
        style={{
          position: "absolute",
          left: TSVG.left,
          top: TSVG.top,
          zIndex: 9,
          opacity: b1,
        }}
      >
        {GRAPH_NODES.map((n) => {
          const at = EMIT_AT[n.id];
          if (frame < at || frame > at + T.chip) return null;
          const p = interpolate(frame, [at, at + T.chip], [0, 1], {
            ...clampOpts,
            easing: Easing.inOut(Easing.quad),
          });
          const px = portFor(gx(n));
          return (
            <line
              key={`t-${n.id}`}
              x1={px - TSVG.left}
              y1={MAN_OUT - TSVG.top}
              x2={px + (gx(n) - px) * p - TSVG.left}
              y2={MAN_OUT + (gy(n) - MAN_OUT) * p - TSVG.top}
              stroke={accentA(0.22)}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {GRAPH_NODES.map((n) => {
        const at = EMIT_AT[n.id];
        if (frame < at || frame > at + T.chip) return null;
        const p = interpolate(frame, [at, at + T.chip], [0, 1], {
          ...clampOpts,
          easing: Easing.inOut(Easing.quad),
        });
        const px = portFor(gx(n));
        const c = KIND_COLOR[n.kind];
        const s = 24;
        return (
          <div
            key={`c-${n.id}`}
            style={{
              position: "absolute",
              left: px + (gx(n) - px) * p - s / 2,
              top: MAN_OUT + (gy(n) - MAN_OUT) * p - s / 2,
              width: s,
              height: s,
              borderRadius: 6,
              background: hexA(c, 0.22),
              border: `2.5px solid ${c}`,
              boxSizing: "border-box",
              opacity: b1,
              zIndex: 20,
            }}
          />
        );
      })}

      {/* --------------------------------------------------------- the graph */}
      <svg
        width={GSVG.w}
        height={GSVG.h}
        viewBox={`0 0 ${GSVG.w} ${GSVG.h}`}
        style={{ position: "absolute", left: GSVG.left, top: GSVG.top, zIndex: 10 }}
      >
        {GRAPH_EDGES.map((e, i) => {
          const p = interpolate(
            frame,
            [EDGE_AT[i], EDGE_AT[i] + T.edgeDur],
            [0, 1],
            { ...clampOpts, easing: EASE },
          );
          if (p <= 0.001) return null;
          const a = nodeById(e.a);
          const b = nodeById(e.b);
          const ax = gx(a) - GSVG.left;
          const ay = gy(a) - GSVG.top;
          const bx = gx(b) - GSVG.left;
          const by = gy(b) - GSVG.top;
          const inferred = e.rel === "INFERRED";
          return (
            <line
              key={`${e.a}-${e.b}`}
              x1={ax}
              y1={ay}
              x2={ax + (bx - ax) * p}
              y2={ay + (by - ay) * p}
              stroke={inferred ? amberA(0.6) : accentA(0.72)}
              strokeWidth={inferred ? 2.6 : 3}
              strokeLinecap="round"
              strokeDasharray={inferred ? "11 9" : undefined}
            />
          );
        })}
      </svg>

      {GRAPH_NODES.map((n) => {
        const e = spring({
          frame: frame - ARRIVE_AT[n.id],
          fps,
          config: SPRINGS.pop,
        });
        if (e <= 0.001) return null;
        const R = nr(n);
        const c = KIND_COLOR[n.kind];
        return (
          <div
            key={n.id}
            style={{
              position: "absolute",
              left: gx(n) - R,
              top: gy(n) - R,
              width: R * 2,
              height: R * 2,
              borderRadius: 999,
              background: G.bg,
              border: `3px solid ${c}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, e),
              transform: `scale(${0.45 + 0.55 * Math.min(1, e)})`,
              zIndex: 12,
            }}
          >
            <div
              style={{
                width: R * 0.78,
                height: R * 0.78,
                borderRadius: 999,
                background: hexA(c, 0.85),
              }}
            />
          </div>
        );
      })}

      {/* ------------------------------------------------ fan-out plumbing */}
      <VLine
        x={JUNCTION.x}
        y0={gy(nodeById("api")) + nr(nodeById("api"))}
        y1={JUNCTION.y - 14}
        p={spineP}
        color={accentA(0.6)}
        w={3.5}
      />
      <div
        style={{
          position: "absolute",
          left: JUNCTION.x - 15,
          top: JUNCTION.y - 15,
          width: 30,
          height: 30,
          borderRadius: 999,
          background: G.bg,
          border: `5px solid ${G.accent}`,
          boxSizing: "border-box",
          opacity: spineP,
          transform: `scale(${0.5 + 0.5 * spineP})`,
          zIndex: 14,
        }}
      />
      <VLine
        x={JUNCTION.x}
        y0={JUNCTION.y + 15}
        y1={BUS_Y}
        p={busP}
        color={accentA(0.6)}
        w={3.5}
      />
      {/* bus grows out from the centre in both directions */}
      <div
        style={{
          position: "absolute",
          left: JUNCTION.x - ((cardCx[2] - cardCx[0]) / 2) * busP,
          top: BUS_Y - 1.75,
          width: (cardCx[2] - cardCx[0]) * busP,
          height: 3.5,
          borderRadius: 4,
          background: accentA(0.6),
        }}
      />
      {cardCx.map((cx, i) => (
        <VLine
          key={cx}
          x={cx}
          y0={BUS_Y}
          y1={CARD.y}
          p={dropP[i]}
          color={accentA(0.6)}
          w={3.5}
        />
      ))}

      {/* etched bays — the machine's three slots exist before the tools land,
          so the pull-out never arrives on an empty shelf. Gone by f148, well
          clear of the closing hold. */}
      {row.xs.map((x, i) => (
        <div
          key={`bay${i}`}
          style={{
            position: "absolute",
            left: x,
            top: CARD.y,
            width: row.w,
            height: CARD.h,
            borderRadius: 26,
            border: "1.5px solid rgba(255,255,255,0.13)",
            boxSizing: "border-box",
            opacity: interpolate(frame, [128, 148], [1, 0], clampOpts),
          }}
        />
      ))}

      {/* ------------------------------------------------------ tool cards */}
      {TOOLS.map((t, i) => {
        const arrive = T.fan[i] + T.fanDur;
        const live = frame >= arrive;
        return (
          <GCard
            key={t.name}
            x={row.xs[i]}
            y={CARD.y}
            w={row.w}
            h={CARD.h}
            enter={Math.min(1, cardIn[i])}
            style={{
              // Cards must step clearly off the lifted machine interior, and
              // the border is the only signal when the map lands — no glow.
              background: G.cardHi,
              border: live
                ? `3px solid ${accentA(0.6)}`
                : "1.5px solid rgba(255,255,255,0.14)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 26,
              }}
            >
              <GLogo
                src={t.src}
                size={104}
                style={
                  t.white
                    ? { filter: "brightness(0) invert(1)" }
                    : undefined
                }
              />
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 40,
                  fontWeight: 700,
                  color: G.text,
                  letterSpacing: -0.4,
                }}
              >
                {t.name}
              </div>
            </div>
          </GCard>
        );
      })}

      {/* real dual licence — a fact, not a claim */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: LIC_Y,
          transform: `translateX(-50%) translateY(${(1 - Math.min(1, licIn)) * 16}px)`,
          opacity: Math.min(1, licIn),
        }}
      >
        <GChip label="Apache-2.0 · MIT" tone="accent" size={34} />
      </div>

      {/* ----------------------------------------------------- packets ---- */}
      {/* inside the machine: these complete */}
      {INNER_PKT.map(({ edge, at }) => {
        const e = GRAPH_EDGES[edge];
        const a = nodeById(e.a);
        const b = nodeById(e.b);
        const p = interpolate(frame, [at, at + T.innerDur], [0, 1], {
          ...clampOpts,
          easing: Easing.inOut(Easing.quad),
        });
        const on = frame >= at && frame <= at + T.innerDur + 1;
        return (
          <Packet
            key={edge}
            x={gx(a) + (gx(b) - gx(a)) * p}
            y={gy(a) + (gy(b) - gy(a)) * p}
            on={on}
            color={e.rel === "INFERRED" ? G.amber : G.accent}
          />
        );
      })}

      {/* the one that tries to leave: stops dead at the wall, comes back */}
      <Packet x={outX} y={outY} on={outOn} squash={outSquash} size={16} />

      {/* out to the tools */}
      {cardCx.map((cx, i) => {
        const start = T.fan[i];
        const p = interpolate(frame, [start, start + T.fanDur], [0, 1], {
          ...clampOpts,
          easing: Easing.inOut(Easing.quad),
        });
        const on = frame >= start && frame <= start + T.fanDur + 1;
        const l1 = BUS_Y - (JUNCTION.y + 15);
        const l2 = Math.abs(cx - JUNCTION.x);
        const l3 = CARD.y - BUS_Y;
        const total = l1 + l2 + l3;
        const d = p * total;
        let px = JUNCTION.x;
        let py = JUNCTION.y + 15;
        if (d <= l1) {
          py = JUNCTION.y + 15 + d;
        } else if (d <= l1 + l2) {
          py = BUS_Y;
          px = JUNCTION.x + Math.sign(cx - JUNCTION.x) * (d - l1);
        } else {
          px = cx;
          py = BUS_Y + (d - l1 - l2);
        }
        return <Packet key={cx} x={px} y={py} on={on} />;
      })}
    </GraphWorld>
  );
};
