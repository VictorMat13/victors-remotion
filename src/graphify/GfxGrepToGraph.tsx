import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  G,
  GRAPH_EDGES,
  GRAPH_NODES,
  GTerminal,
  GraphWorld,
  MONO,
  SPRINGS,
  accentA,
  amberA,
  nodeById,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 180;

// ---------------------------------------------------------------------------
// ONE world. The terminal lives at world (0,0)-ish so the graph can resolve
// on top of it without a second scene. Square canvas: 1080x1080, so the
// vertical budget is tiny — the terminal is designed to be read at z=1.62
// (tight, only ~8 lines visible) and at z=0.70 (whole panel in frame).
//
// World geometry
//   terminal panel   x -470..470, y -560..560   (940 x 1120)
//   graph nodes      centred on (0,0), spread roughly x -345..345, y -195..300
// ---------------------------------------------------------------------------

const TERM = { x: -470, y: -560, w: 940, h: 1120 };

/** Terminal body inner origin (GTerminal: 62px bar + 26px pad, 30px pad-x). */
const BAR_H = 62;
const PAD_Y = 26;
const PAD_X = 30;
const BODY = { x: TERM.x + PAD_X, y: TERM.y + BAR_H + PAD_Y };

const LINE_H = 34;
const FONT_PX = 24;

/** Usable body width in mono columns. JetBrains Mono advance is 0.6em. */
const BODY_W = TERM.w - PAD_X * 2; // 880
const MAX_COLS = Math.floor(BODY_W / (FONT_PX * 0.6)); // 61

/** The command line pinned at the top of the body. */
const CMD_H = 46;
/** Scrolling region starts under the command line. */
const SCROLL_TOP = BODY.y + CMD_H;
const SCROLL_H = TERM.y + TERM.h - PAD_Y - SCROLL_TOP;
const ROWS_VISIBLE = Math.floor(SCROLL_H / LINE_H);

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  /** flood runs from frame 0 */
  pullBack: 55, // 55 -> 77 camera dollies out
  collapse: 90, // wave peels rows off top-to-bottom, last lands ~140
  collapseStagger: 1.2,
  collapseSpan: 18,
  termOut: 100, // panel recedes once most rows have left
  nodes: 100, // node pops, staggered 3.0
  edges: 122, // last edge completes ~157
  labels: 148,
};

// ---------------------------------------------------------------------------
// The grep flood — deterministic pseudo-random corpus, generated once.
// Real-looking match lines: path:line:  source fragment, with "auth" matched.
// ---------------------------------------------------------------------------

const PATHS = [
  "src/auth/session.ts",
  "src/auth/token.ts",
  "src/auth/index.ts",
  "src/middleware/auth.ts",
  "src/server/router.ts",
  "src/db/user.ts",
  "src/db/schema.ts",
  "src/api/handlers.ts",
  "src/api/routes.ts",
  "src/lib/cookies.ts",
  "src/lib/crypto.ts",
  "src/queue/worker.ts",
  "src/queue/jobs.ts",
  "src/hooks/useUser.ts",
  "src/app.ts",
  "src/config.ts",
  "test/auth.spec.ts",
  "test/session.spec.ts",
  "src/auth/oauth.ts",
  "src/auth/verify.ts",
  "src/server/context.ts",
  "src/db/migrate.ts",
];

/** Each fragment has exactly one "auth" token, split into pre/post. */
const FRAGMENTS: [string, string][] = [
  ["const ", " = await getSession(req)"],
  ["import { verify } from './", "'"],
  ["if (!", ".user) return null"],
  ["export function require", "(req, res)"],
  ["  ", "Token = header.split(' ')[1]"],
  ["type ", "State = { userId: string }"],
  ["  return ", ".session?.expiresAt ?? 0"],
  ["app.use(", "Middleware())"],
  ["const { ", " } = require('../auth')"],
  ["  ctx.", " = { userId, scopes }"],
  ["describe('", "', () => {"],
  ["  logger.debug('", " ok', { userId })"],
  ["export const ", "Guard = createGuard()"],
  ["  await db.", "Tokens.deleteMany()"],
  ["  headers['x-", "'] = token"],
  ["function refresh", "(token: string) {"],
  ["  if (", ".expired) throw new Error()"],
  ["const ", "Config = loadConfig('auth')"],
  ["  res.locals.", " = session"],
  ["  // TODO: move ", " to middleware"],
];

type Line = {
  path: string;
  ln: number;
  pre: string;
  post: string;
  /** which graph node this line collapses into */
  node: number;
};

/** Deterministic LCG so every render is identical. */
const mkLines = (count: number): Line[] => {
  let s = 20260802;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: Line[] = [];
  for (let i = 0; i < count; i++) {
    const f = FRAGMENTS[Math.floor(rnd() * FRAGMENTS.length)];
    const path = PATHS[Math.floor(rnd() * PATHS.length)];
    const ln = 12 + Math.floor(rnd() * 620);
    // Keep every line inside the terminal body so nothing is clipped, and so
    // the flying copies never suddenly extend past the panel at the turn.
    const head = `${path}:${ln}:  `.length + f[0].length + 4;
    const post = f[1].slice(0, Math.max(0, MAX_COLS - head));
    out.push({ path, ln, pre: f[0], post, node: i });
  }
  return out;
};

const FLOOD = mkLines(200);

/** code nodes only — the doc/sql/config/pdf nodes join in §4. */
const CODE_NODES = GRAPH_NODES.filter((n) => n.kind === "code");
const CODE_IDS = new Set(CODE_NODES.map((n) => n.id));
const CODE_EDGES = GRAPH_EDGES.filter(
  (e) => CODE_IDS.has(e.a) && CODE_IDS.has(e.b),
);

/** Labels that stay legible on the settle. Real file names — allowed as data. */
const LABEL_SIDE: Record<string, "left" | "right"> = {
  app: "right",
  auth: "left",
  session: "right",
  mw: "right",
};

const NODE_R = (r: number) => 15 * r;

// Scroll speed: 1.6 lines per frame (~48 lines/sec) — a torrent, not a list.
const SCROLL_PX_PER_FRAME = LINE_H * 1.6;

export const GfxGrepToGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: tight inside the terminal -> pull back -> settle on graph ----
  const cam = useCam({
    keys: [0, T.pullBack, T.pullBack + 22, T.collapse, 112, 166, 173, 180],
    fx: [0, 0, 0, 0, 0, 25, 25, 25],
    fy: [-250, -250, 15, 15, 25, 60, 60, 60],
    z: [1.62, 1.62, 0.78, 0.78, 0.82, 1.34, 1.35, 1.35],
  });

  // --- Flood scroll (frame-driven offset, never CSS) ------------------------
  const scrollY = frame * SCROLL_PX_PER_FRAME;
  const firstRow = Math.floor(scrollY / LINE_H);
  const subPx = scrollY - firstRow * LINE_H;

  // Hard handoff: at T.collapse the scroll stops and the SAME rows peel off
  // and fly. No crossfade — the flying copies start at full opacity in the
  // exact positions the scrolling rows occupied.
  const flooding = frame < T.collapse;

  // Terminal chrome recedes once most rows have already left the panel.
  const termOut = interpolate(frame, [T.termOut, T.termOut + 26], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // --- Collapse: each visible line flies to a node --------------------------
  // Snapshot of the rows on screen at the moment the turn starts.
  const collapseRows = React.useMemo(() => {
    const startScroll = T.collapse * SCROLL_PX_PER_FRAME;
    const start = Math.floor(startScroll / LINE_H);
    const sub = startScroll - start * LINE_H;
    const rows: { line: Line; y0: number; node: number }[] = [];
    for (let i = 0; i < ROWS_VISIBLE; i++) {
      const li = (start + i) % FLOOD.length;
      rows.push({
        line: FLOOD[li],
        // exactly where the scrolling row sat on the last flood frame
        y0: SCROLL_TOP + i * LINE_H - sub,
        // ordered mapping so the wave reads top-to-bottom into the cluster
        node: Math.min(
          CODE_NODES.length - 1,
          Math.floor((i / ROWS_VISIBLE) * CODE_NODES.length),
        ),
      });
    }
    return rows;
  }, []);

  const collapseEnd =
    T.collapse + (ROWS_VISIBLE - 1) * T.collapseStagger + T.collapseSpan + 1;
  const collapsing = frame >= T.collapse && frame < collapseEnd;

  // Node arrival: staggered, each pops as its rows land on it.
  const nodeArrive = CODE_NODES.map((_, i) =>
    spring({ frame: frame - (T.nodes + i * 3.0), fps, config: SPRINGS.pop }),
  );

  // --- Edges ---------------------------------------------------------------
  const edgeP = CODE_EDGES.map((_, i) =>
    interpolate(frame, [T.edges + i * 1.9, T.edges + i * 1.9 + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }),
  );

  const labelIn = CODE_NODES.map((n, i) =>
    LABEL_SIDE[n.id]
      ? spring({ frame: frame - (T.labels + i * 2), fps, config: SPRINGS.pop })
      : 0,
  );

  const caretOn = frame % 22 < 13;

  return (
    <GraphWorld cam={cam} gridSize={64}>
      {/* ------------------------------------------------------- terminal */}
      <div style={{ opacity: termOut }}>
        <GTerminal
          x={TERM.x}
          y={TERM.y}
          w={TERM.w}
          h={TERM.h}
          title="zsh · ~/project"
        >
          {/* the command, pinned */}
          <div
            style={{
              position: "absolute",
              left: PAD_X,
              top: BAR_H + PAD_Y,
              fontFamily: MONO,
              fontSize: FONT_PX,
              lineHeight: `${LINE_H}px`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: G.accent, fontWeight: 700 }}>$ </span>
            <span style={{ color: G.text }}>grep -rn </span>
            <span style={{ color: G.accent }}>&quot;auth&quot;</span>
            <span style={{ color: G.text }}> ./src</span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 22,
                marginLeft: 6,
                verticalAlign: "-3px",
                background: G.muted,
                opacity: caretOn ? 0.75 : 0.12,
              }}
            />
          </div>
        </GTerminal>
      </div>

      {/* ------------------------------------------------ the grep flood */}
      {/* Clipped to the terminal body so lines never spill past the chrome. */}
      <div
        style={{
          position: "absolute",
          left: TERM.x + 1.5,
          top: SCROLL_TOP,
          width: TERM.w - 3,
          height: SCROLL_H,
          overflow: "hidden",
          opacity: flooding ? 1 : 0,
        }}
      >
        {Array.from({ length: ROWS_VISIBLE }).map((_, i) => {
          const li = (firstRow + i) % FLOOD.length;
          const l = FLOOD[li];
          const y = i * LINE_H - subPx;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: PAD_X - 1.5,
                top: y,
                fontFamily: MONO,
                fontSize: FONT_PX,
                lineHeight: `${LINE_H}px`,
                whiteSpace: "nowrap",
                color: G.faint,
              }}
            >
              <span style={{ color: G.muted }}>{l.path}</span>
              <span style={{ color: G.faint }}>{`:${l.ln}:  `}</span>
              <span>{l.pre}</span>
              <span
                style={{
                  color: G.accent,
                  background: G.accentSoft,
                  padding: "1px 3px",
                  borderRadius: 3,
                }}
              >
                auth
              </span>
              <span>{l.post}</span>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------- the turn: lines fly to nodes */}
      {collapsing
        ? collapseRows.map((r, i) => {
            const target = CODE_NODES[r.node];
            const at = T.collapse + i * T.collapseStagger;
            const p = interpolate(frame, [at, at + T.collapseSpan], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            if (p >= 1) return null;
            // Same rows, same places — they peel off and converge on a node.
            const x0 = BODY.x;
            const x = x0 + (target.x - x0) * p;
            const y = r.y0 + (target.y - r.y0) * p;
            const op = interpolate(p, [0, 0.5, 0.88], [1, 0.92, 0], {
              extrapolateRight: "clamp",
            });
            const sc = interpolate(p, [0, 1], [1, 0.06]);
            return (
              <div
                key={`c${i}`}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  fontFamily: MONO,
                  fontSize: FONT_PX,
                  lineHeight: `${LINE_H}px`,
                  whiteSpace: "nowrap",
                  color: G.faint,
                  opacity: op,
                  transform: `scale(${sc})`,
                  transformOrigin: "0 50%",
                }}
              >
                <span style={{ color: G.muted }}>{r.line.path}</span>
                <span>{`:${r.line.ln}:  `}</span>
                <span>{r.line.pre}</span>
                <span
                  style={{
                    color: G.accent,
                    background: G.accentSoft,
                    padding: "1px 3px",
                    borderRadius: 3,
                  }}
                >
                  auth
                </span>
                <span>{r.line.post}</span>
              </div>
            );
          })
        : null}

      {/* ------------------------------------------------------- the graph */}
      <svg
        width={1400}
        height={1200}
        viewBox="-700 -600 1400 1200"
        style={{ position: "absolute", left: -700, top: -600, overflow: "visible" }}
      >
        {CODE_EDGES.map((e, i) => {
          const a = nodeById(e.a);
          const b = nodeById(e.b);
          const p = edgeP[i];
          if (p <= 0) return null;
          const inferred = e.rel === "INFERRED";
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          return (
            <line
              key={`${e.a}-${e.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={inferred ? amberA(0.85) : accentA(0.92)}
              strokeWidth={inferred ? 2.2 : 3}
              strokeLinecap="round"
              strokeDasharray={inferred ? `10 9` : `${len} ${len}`}
              strokeDashoffset={inferred ? 0 : len * (1 - p)}
              opacity={inferred ? p : 1}
            />
          );
        })}
      </svg>

      {/* nodes */}
      {CODE_NODES.map((n, i) => {
        const a = nodeArrive[i];
        if (a <= 0.001) return null;
        const r = NODE_R(n.r ?? 1);
        return (
          <div key={n.id}>
            <div
              style={{
                position: "absolute",
                left: n.x - r,
                top: n.y - r,
                width: r * 2,
                height: r * 2,
                borderRadius: 999,
                background: G.accent,
                border: `3px solid ${G.bg}`,
                boxSizing: "content-box",
                opacity: Math.min(1, a),
                transform: `scale(${0.3 + 0.7 * Math.min(1, a)})`,
              }}
            />
            {/* flat ring — blur 0, no glow */}
            <div
              style={{
                position: "absolute",
                left: n.x - r - 9,
                top: n.y - r - 9,
                width: (r + 9) * 2,
                height: (r + 9) * 2,
                borderRadius: 999,
                border: `2px solid ${accentA(0.22)}`,
                boxSizing: "border-box",
                opacity: Math.min(1, a) * 0.9,
                transform: `scale(${0.5 + 0.5 * Math.min(1, a)})`,
              }}
            />
            {labelIn[i] > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: n.x + r + 16,
                  top: n.y - 17,
                  fontFamily: MONO,
                  fontSize: 28,
                  fontWeight: 600,
                  color: G.text,
                  whiteSpace: "nowrap",
                  opacity: Math.min(1, labelIn[i]),
                  transform: `translateX(${(1 - Math.min(1, labelIn[i])) * -10}px)`,
                }}
              >
                {n.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </GraphWorld>
  );
};
