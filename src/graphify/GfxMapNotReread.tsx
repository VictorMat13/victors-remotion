/**
 * §3 DIFFERENTIATOR — THE HERO CLIP.
 *
 * ONE continuous world, ONE camera, no cuts:
 *
 *   y ≈ 1650   a Claude Code terminal. `/graphify` runs, three real files drop.
 *      ↑       camera travels up and out
 *   y ≈   40   open world space holding a sprawling, unstructured file field
 *              → the files collapse and reorganise into the canonical graph
 *              → the graph inverts into the Graphify mark, then re-opens
 *      ↑       camera pulls back and pans right
 *   y ≈   60   Claude reading the map once vs re-reading the whole file list
 *
 * Node positions come from GRAPH_NODES verbatim (code nodes only in §3), so
 * this is literally the same object §1, §4 and §5 show.
 *
 * No glow anywhere: depth is stroke weight, solid fills, borders and the
 * G.bg → G.panel → G.card value steps.
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
  FONT,
  G,
  GA,
  GCard,
  GLogo,
  GRAPH_EDGES,
  GRAPH_NODES,
  GTerminal,
  GraphWorld,
  GraphifyMark,
  MONO,
  SPRINGS,
  accentA,
  fmt,
  nodeById,
  tabular,
  useCam,
  useCountUp,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 310;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const T = {
  // beat A — terminal
  type: 4,
  run: 19,
  count: 22,
  countEnd: 38,
  out: [40, 44, 48],

  // beat B — transformation (all inside camera holds)
  collapse: 94, // + k * 0.6, 11f each — nodes land by 110
  edgeExt: 108, // + i * 0.85, 7f each — structure snaps together by 122
  edgeInf: 142, // + i * 2.5, 8f each — resolved links, at the close framing
  invert: 158, // ground grows + strokes go black, 158 → 170
  register: 170, // real mark cross-registers, 170 → 178
  markHold: 178, // real mark holds, 178 → 190
  revert: 194, // graph re-opens green, 194 → 204

  // beat C — contrast
  claudeIn: 224,
  panelIn: 226,
  rowIn: 227,
  pathDraw: 234,
  cardIn: 242,
  travel: 248, // one pass down the map, 248 → 272
  sweep: 250, // three passes over the file list, 250 → 289
  tokens: 252,
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };

// ---------------------------------------------------------------------------
// World geometry
// ---------------------------------------------------------------------------

/** Graph anchor. GRAPH_NODES are centred on (0,0); this places them in world. */
const GX = 540;
const GY = 40;

const CODE = GRAPH_NODES.filter((n) => n.kind === "code");
const CODE_IDS = CODE.map((n) => n.id);
const CODE_EDGES = GRAPH_EDGES.filter(
  (e) => CODE_IDS.includes(e.a) && CODE_IDS.includes(e.b),
);
const EXT_EDGES = CODE_EDGES.filter((e) => e.rel === "EXTRACTED");
const INF_EDGES = CODE_EDGES.filter((e) => e.rel === "INFERRED");

/** World-space node: centre + radius. Diameter 38·r keeps the mark's ratio. */
const NW = (id: string) => {
  const n = nodeById(id);
  return { x: GX + n.x, y: GY + n.y, r: 19 * (n.r ?? 1) };
};

/** Square that frames the graph at the mark's 72% inset. */
const TILE = { cx: 568, cy: 102, s: 720 };
const TL = TILE.cx - TILE.s / 2;
const TT_ = TILE.cy - TILE.s / 2;

const TERM = { x: 54, y: 1400, w: 972, h: 760 };

// beat C furniture
const CL = { cx: 902, cy: -560, s: 180 };
const PANEL = { x: 1040, y: -110, w: 430, h: 690 };
const LCARD = { x: 348, y: 620, w: 440, h: 150 };
const RCARD = { x: 1035, y: 620, w: 440, h: 150 };
const BC = { left: 300, top: -700, w: 1240, h: 1400 };
const bx = (x: number) => x - BC.left;
const by = (y: number) => y - BC.top;

type P = [number, number];
const PATH_L: P[] = [
  [902, -470],
  [880, -320],
  [700, -280],
  [540, -154],
];
const PATH_R: P[] = [
  [902, -470],
  [930, -320],
  [1160, -250],
  [1255, -110],
];
const cubic = (p: P[], t: number) => {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
    y: a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
  };
};
const dOf = (p: P[]) =>
  `M ${bx(p[0][0])} ${by(p[0][1])} C ${bx(p[1][0])} ${by(p[1][1])}, ${bx(
    p[2][0],
  )} ${by(p[2][1])}, ${bx(p[3][0])} ${by(p[3][1])}`;

/** The handful of edges Claude walks. All four are real GRAPH_EDGES. */
const CHAIN = ["app", "session", "mw", "db", "user"];

// ---------------------------------------------------------------------------
// The unstructured file field — deterministic, no render-time randomness
// ---------------------------------------------------------------------------

const FIELD_N = 63;
const COLS = 7;
const CELL_W = 178;
const CELL_H = 124;
const FIELD_X0 = GX - 620;
const FIELD_Y0 = GY - 560;

const hash = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const FIELD = Array.from({ length: FIELD_N }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const s = 0.84 + hash(i, 3) * 0.34;
  return {
    x: FIELD_X0 + col * CELL_W + 89 + (hash(i, 1) - 0.5) * 76,
    y: FIELD_Y0 + row * CELL_H + 62 + (hash(i, 2) - 0.5) * 60,
    w: Math.round(112 * s),
    h: Math.round(78 * s),
    rot: (hash(i, 4) - 0.5) * 9,
  };
});

/** Which field slots survive as graph nodes — spread across the whole field. */
const KEEPER_SLOTS = [5, 9, 15, 23, 26, 34, 39, 46, 51, 59];
const KEEPER_SET = KEEPER_SLOTS.slice();

// ---------------------------------------------------------------------------
// Terminal metrics — mono is 32px at the terminal camera key (z = 1.0)
// ---------------------------------------------------------------------------

const GUT = 44;
const ROW = {
  prompt: 0,
  parse: 116,
  bar: 176,
  out: [244, 308, 372],
  input: 540,
};

const FILES = [
  "app.ts",
  "auth.ts",
  "session.ts",
  "router.ts",
  "middleware.ts",
  "db.ts",
  "user.ts",
  "api.ts",
  "queue.ts",
  "worker.ts",
];

// ---------------------------------------------------------------------------

const FileGlyph: React.FC<{
  w: number;
  keeper: boolean;
  detail: number;
}> = ({ w, keeper, detail }) => {
  const k = w / 112;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: detail }}>
      <div
        style={{
          position: "absolute",
          left: 13 * k,
          top: 13 * k,
          width: 26 * k,
          height: 26 * k,
          borderRadius: 7 * k,
          background: keeper ? accentA(0.55) : "rgba(255,255,255,0.28)",
        }}
      />
      {[
        { x: 50, y: 17, w: 48 },
        { x: 50, y: 33, w: 32 },
        { x: 13, y: 54, w: 84 },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x * k,
            top: b.y * k,
            width: b.w * k,
            height: 9 * k,
            borderRadius: 4 * k,
            background: "rgba(255,255,255,0.19)",
          }}
        />
      ))}
    </div>
  );
};

const TermRow: React.FC<{
  top: number;
  enter: number;
  children: React.ReactNode;
}> = ({ top, enter, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width: "100%",
      fontFamily: MONO,
      fontSize: 32,
      lineHeight: "44px",
      whiteSpace: "nowrap",
      opacity: enter,
      transform: `translateX(${(1 - enter) * -16}px)`,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------

export const GfxMapNotReread: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- one camera, one world -------------------------------------------
  const cam = useCam({
    keys: [0, 58, 78, 122, 140, 206, 226, 292, 310],
    fx: [540, 540, 540, 540, 568, 568, 902, 902, 902],
    fy: [1740, 1736, 40, 40, 102, 102, 60, 60, 57],
    z: [1.0, 1.005, 0.68, 0.68, 1.3, 1.3, 0.82, 0.82, 0.821],
  });

  // ---- beat A: terminal --------------------------------------------------
  const typed = useTypewriter("/graphify", T.type, 0.72);
  const typing = frame >= T.type && frame < T.run;
  const caret = frame % 20 < 12;
  const parsed = frame >= T.countEnd;
  const parseIn = spring({ frame: frame - T.run, fps, config: SPRINGS.pop });
  const files = useCountUp({ to: 1284, start: T.count, duration: 16 });
  const barP = interpolate(frame, [T.count, T.countEnd], [0, 1], ease);
  const outIn = T.out.map((at) =>
    spring({ frame: frame - at, fps, config: SPRINGS.pop }),
  );
  // the session's input bar is furniture — present from frame 0, never hollow

  // ---- beat B: collapse --------------------------------------------------
  const keeperP = (k: number) =>
    interpolate(frame, [T.collapse + k * 0.6, T.collapse + k * 0.6 + 11], [0, 1], ease);

  // ---- beat B: edges -----------------------------------------------------
  const extP = EXT_EDGES.map((_, i) =>
    interpolate(frame, [T.edgeExt + i * 0.85, T.edgeExt + i * 0.85 + 7], [0, 1], ease),
  );
  const infP = INF_EDGES.map((_, i) =>
    interpolate(frame, [T.edgeInf + i * 2.5, T.edgeInf + i * 2.5 + 8], [0, 1], ease),
  );

  // ---- beat B: the mark --------------------------------------------------
  const inv = interpolate(
    frame,
    [T.invert, T.invert + 12, T.revert, T.revert + 10],
    [0, 1, 1, 0],
    ease,
  );
  const builtOp = interpolate(
    frame,
    [T.register, T.register + 8, T.markHold + 10, T.markHold + 16],
    [1, 0, 0, 1],
    ease,
  );
  const realOp = interpolate(
    frame,
    [T.register, T.register + 8, T.markHold + 10, T.markHold + 16],
    [0, 1, 1, 0],
    ease,
  );
  const realScale = interpolate(frame, [T.register, T.register + 8], [1.05, 1], ease);

  const nodeFill = interpolateColors(inv, [0, 1], [G.accent, "#0D120F"]);
  const extColor = nodeFill;
  const infColor = interpolateColors(
    Math.min(1, inv * 1.55),
    [0, 1],
    [G.amber, "#0D120F"],
  );

  // ---- beat C ------------------------------------------------------------
  const claudeIn = spring({ frame: frame - T.claudeIn, fps, config: SPRINGS.pop });
  const panelIn = spring({ frame: frame - T.panelIn, fps, config: SPRINGS.pop });
  const cardInL = spring({ frame: frame - T.cardIn, fps, config: SPRINGS.pop });
  const cardInR = spring({ frame: frame - T.cardIn - 2, fps, config: SPRINGS.pop });
  const pathLP = interpolate(frame, [T.pathDraw, T.pathDraw + 12], [0, 1], ease);
  const pathRP = interpolate(frame, [T.pathDraw + 2, T.pathDraw + 14], [0, 1], ease);

  // one calm pass down the map: cable, then four real edges
  const travelAll = interpolate(frame, [T.travel, T.travel + 24], [0, 1], ease);
  const travelCable = Math.min(1, travelAll / 0.33);
  const travelChain = Math.max(0, (travelAll - 0.33) / 0.67) * (CHAIN.length - 1);
  const travelling = frame >= T.travel;
  const dotCable = cubic(PATH_L, travelCable);
  const segI = Math.min(CHAIN.length - 2, Math.floor(travelChain));
  const segT = Math.min(1, travelChain - segI);
  const nA = NW(CHAIN[segI]);
  const nB = NW(CHAIN[segI + 1]);
  const dotChain = {
    x: nA.x + (nB.x - nA.x) * segT,
    y: nA.y + (nB.y - nA.y) * segT,
  };
  const dot = travelAll < 0.33 ? dotCable : dotChain;

  // the re-read path: three hard passes over the whole list
  const sweepActive = frame >= T.sweep && frame <= T.sweep + 39;
  const st = (frame - T.sweep) / 13;
  const local = st - Math.floor(st);
  const head = local * (FILES.length + 3) - 1.5;
  const passStart = local * 13;
  const dotRP = interpolate(passStart, [0, 5], [0, 1], clamp);
  const dotR = cubic(PATH_R, dotRP);

  const mapTokens = useCountUp({ to: 1940, start: T.tokens, duration: 14 });
  const reTokens = useCountUp({ to: 118240, start: T.tokens, duration: 36 });

  return (
    <GraphWorld cam={cam}>
      {/* ================================================== beat A: terminal */}
      <GTerminal
        x={TERM.x}
        y={TERM.y}
        w={TERM.w}
        h={TERM.h}
        title="claude · graphify"
      >
        <div style={{ position: "relative", marginLeft: -8, height: 640 }}>
          {/* the command */}
          <TermRow top={ROW.prompt} enter={1}>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                color: G.accent,
                fontWeight: 700,
              }}
            >
              ›
            </span>
            <span
              style={{
                display: "inline-block",
                marginLeft: GUT,
                color: "#FFFFFF",
                fontWeight: 700,
              }}
            >
              {typed}
            </span>
            {typing ? (
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 30,
                  marginLeft: 3,
                  verticalAlign: "-4px",
                  background: G.text,
                  opacity: caret ? 0.9 : 0.15,
                }}
              />
            ) : null}
          </TermRow>

          {/* the honest progress pass */}
          <TermRow top={ROW.parse} enter={parseIn}>
            {parsed ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: G.accent,
                  fontWeight: 700,
                }}
              >
                ●
              </span>
            ) : (
              <span
                style={{
                  position: "absolute",
                  left: 2,
                  top: 10,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: `3.5px solid ${accentA(0.2)}`,
                  borderTopColor: G.accent,
                  transform: `rotate(${frame * 16}deg)`,
                  boxSizing: "border-box",
                }}
              />
            )}
            <span style={{ display: "inline-block", marginLeft: GUT, color: G.muted }}>
              parsing{"  "}
              <span style={{ color: "#FFFFFF", fontWeight: 700, ...tabular }}>
                {fmt(files)}
              </span>
              {"  "}files{"   ·   "}
              <span style={{ color: G.muted }}>tree-sitter</span>
            </span>
          </TermRow>

          <div
            style={{
              position: "absolute",
              left: GUT,
              top: ROW.bar,
              width: 660,
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.07)",
              opacity: parseIn,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 10,
                width: 660 * barP,
                borderRadius: 999,
                background: G.accent,
              }}
            />
          </div>

          {/* the three files graphify actually writes */}
          {["graph.html", "GRAPH_REPORT.md", "graph.json"].map((f, i) => (
            <TermRow key={f} top={ROW.out[i]} enter={outIn[i]}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: G.accent,
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              <span
                style={{
                  display: "inline-block",
                  marginLeft: GUT,
                  color: G.text,
                  fontWeight: 700,
                }}
              >
                {f}
              </span>
            </TermRow>
          ))}

          {/* input bar — matches the approved session chrome */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: ROW.input,
              width: "100%",
              height: 88,
              borderRadius: 16,
              border: `1.5px solid ${G.line}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 26,
              boxSizing: "border-box",
              opacity: 0.95,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 32, color: G.accent }}>›</span>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 30,
                background: G.muted,
                opacity: caret ? 0.85 : 0.18,
              }}
            />
          </div>
        </div>
      </GTerminal>

      {/* ========================================= beat B: the file field */}
      {FIELD.map((f, i) => {
        if (KEEPER_SET.includes(i)) return null;
        const start = 95 + (i % 11) * 0.7;
        const p = interpolate(frame, [start, start + 11], [0, 1], ease);
        if (p >= 1) return null;
        const drift = Math.sin((frame + i * 9) * 0.055) * 4 * (1 - p);
        const s = 1 - p * 0.82;
        const x = f.x + (TILE.cx - f.x) * p * 0.42;
        const y = f.y + (TILE.cy - f.y) * p * 0.42 + drift;
        return (
          <div
            key={`f${i}`}
            style={{
              position: "absolute",
              left: x - f.w / 2,
              top: y - f.h / 2,
              width: f.w,
              height: f.h,
              borderRadius: 12,
              background: "#2C352D",
              border: "1.5px solid rgba(255,255,255,0.14)",
              opacity: 1 - p,
              transform: `rotate(${f.rot}deg) scale(${s})`,
              boxSizing: "border-box",
            }}
          >
            <FileGlyph w={f.w} keeper={false} detail={1} />
          </div>
        );
      })}

      {/* ======================================== beat B: the graph layer */}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: builtOp }}>
        {/* the mark's tile ground — the graph's own square */}
        <div
          style={{
            position: "absolute",
            left: TL,
            top: TT_,
            width: TILE.s,
            height: TILE.s,
            borderRadius: TILE.s * 0.22,
            background:
              "linear-gradient(135deg, #4E9474 0%, #6DB495 52%, #8ACFB2 100%)",
            opacity: inv,
            transform: `scale(${0.9 + 0.1 * inv})`,
          }}
        />

        {/* edges */}
        <svg
          width={TILE.s}
          height={TILE.s}
          viewBox={`0 0 ${TILE.s} ${TILE.s}`}
          style={{ position: "absolute", left: TL, top: TT_, overflow: "visible" }}
        >
          {EXT_EDGES.map((e, i) => {
            const a = NW(e.a);
            const b = NW(e.b);
            return (
              <path
                key={`x${i}`}
                d={`M ${a.x - TL} ${a.y - TT_} L ${b.x - TL} ${b.y - TT_}`}
                stroke={extColor}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - extP[i]}
              />
            );
          })}
          {INF_EDGES.map((e, i) => {
            const a = NW(e.a);
            const b = NW(e.b);
            const mx = (a.x + b.x) / 2 - TL;
            const my = (a.y + b.y) / 2 - TT_;
            const p = infP[i];
            return (
              <g
                key={`i${i}`}
                transform={`translate(${mx} ${my}) scale(${p}) translate(${-mx} ${-my})`}
                opacity={p}
              >
                <path
                  d={`M ${a.x - TL} ${a.y - TT_} L ${b.x - TL} ${b.y - TT_}`}
                  stroke={infColor}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={`16 ${13 * (1 - inv)}`}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {/* the traversal — the handful of edges Claude actually walks */}
          {travelling
            ? CHAIN.slice(0, -1).map((id, i) => {
                const a = NW(id);
                const b = NW(CHAIN[i + 1]);
                const lit = interpolate(travelChain, [i, i + 1], [0, 1], clamp);
                const rel = CODE_EDGES.find(
                  (e) =>
                    (e.a === id && e.b === CHAIN[i + 1]) ||
                    (e.b === id && e.a === CHAIN[i + 1]),
                )?.rel;
                return (
                  <path
                    key={`t${i}`}
                    d={`M ${a.x - TL} ${a.y - TT_} L ${b.x - TL} ${b.y - TT_}`}
                    stroke={rel === "INFERRED" ? "#F7E3B6" : "#C6FBE0"}
                    strokeWidth={rel === "INFERRED" ? 7 : 8}
                    strokeLinecap="round"
                    strokeDasharray={rel === "INFERRED" ? "16 13" : 1}
                    {...(rel === "INFERRED"
                      ? { opacity: lit }
                      : { pathLength: 1, strokeDashoffset: 1 - lit })}
                    fill="none"
                  />
                );
              })
            : null}
        </svg>

        {/* nodes — each one is the file card it collapsed from */}
        {CODE.map((n, k) => {
          const slot = KEEPER_SLOTS[k];
          const f = FIELD[slot];
          const t = NW(n.id);
          const m = keeperP(k);
          // the card travels the whole way, shrinks steadily, and only rounds
          // into a solid node at the very end — no green blobs in flight
          const mSize = interpolate(m, [0.12, 1], [0, 1], clamp);
          const mRound = interpolate(m, [0.58, 0.96], [0, 1], clamp);
          const mColor = interpolate(m, [0.62, 1], [0, 1], clamp);
          const drift = Math.sin((frame + slot * 9) * 0.055) * 4 * (1 - m);
          const x = f.x + (t.x - f.x) * m;
          const y = f.y + (t.y - f.y) * m + drift;
          const w = f.w + (t.r * 2 - f.w) * mSize;
          const h = f.h + (t.r * 2 - f.h) * mSize;
          const detail = 1 - interpolate(m, [0.18, 0.5], [0, 1], clamp);
          return (
            <div
              key={n.id}
              style={{
                position: "absolute",
                left: x - w / 2,
                top: y - h / 2,
                width: w,
                height: h,
                borderRadius: 12 + mRound * 400,
                background: interpolateColors(
                  mColor,
                  [0, 1],
                  ["#2C352D", nodeFill],
                ),
                border: `1.5px solid rgba(255,255,255,${0.14 * (1 - mColor)})`,
                transform: `rotate(${f.rot * (1 - m)}deg)`,
                boxSizing: "border-box",
              }}
            >
              {detail > 0.01 ? (
                <FileGlyph w={f.w} keeper detail={detail} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* the real mark, cross-registered onto the graph's own square */}
      {realOp > 0.005 ? (
        <div
          style={{
            position: "absolute",
            left: TL,
            top: TT_,
            opacity: realOp,
            transform: `scale(${realScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <GraphifyMark size={TILE.s} />
        </div>
      ) : null}

      {/* =============================================== beat C: the contrast */}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        {/* the two routes out of Claude */}
        <svg
          width={BC.w}
          height={BC.h}
          viewBox={`0 0 ${BC.w} ${BC.h}`}
          style={{ position: "absolute", left: BC.left, top: BC.top, overflow: "visible" }}
        >
          <path
            d={dOf(PATH_L)}
            stroke={G.accentLine}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - pathLP}
          />
          <path
            d={dOf(PATH_R)}
            stroke="rgba(232,112,95,0.34)"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - pathRP}
          />
        </svg>

        {/* Claude */}
        <GCard
          x={CL.cx - CL.s / 2}
          y={CL.cy - CL.s / 2}
          w={CL.s}
          h={CL.s}
          r={38}
          enter={claudeIn}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GLogo src={GA.logo.claude} size={104} />
          </div>
        </GCard>

        {/* the whole file list */}
        <GCard
          x={PANEL.x}
          y={PANEL.y}
          w={PANEL.w}
          h={PANEL.h}
          r={26}
          enter={panelIn}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 26,
              fontFamily: MONO,
              fontSize: 44,
              color: G.faint,
            }}
          >
            src/
          </div>
          {FILES.map((f, i) => {
            const en = spring({
              frame: frame - (T.rowIn + i * 0.6),
              fps,
              config: SPRINGS.pop,
            });
            const hot = sweepActive
              ? interpolate(Math.abs(i - head), [0, 1.7], [1, 0], clamp)
              : 0;
            return (
              <div
                key={f}
                style={{
                  position: "absolute",
                  left: 14,
                  top: 108 + i * 54,
                  width: PANEL.w - 28,
                  height: 50,
                  borderRadius: 10,
                  background: `rgba(232,112,95,${0.16 * hot})`,
                  opacity: en,
                  transform: `translateX(${(1 - en) * -14}px)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 3,
                    fontFamily: MONO,
                    fontSize: 48,
                    lineHeight: "44px",
                    color: hot > 0.35 ? G.text : "rgba(242,245,243,0.62)",
                  }}
                >
                  {f}
                </div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 26,
              top: 108 + 10 * 54 + 6,
              fontFamily: MONO,
              fontSize: 44,
              color: G.faint,
              opacity: panelIn,
            }}
          >
            + 1,274 more
          </div>
        </GCard>

        {/* the two meters */}
        <GCard
          x={LCARD.x}
          y={LCARD.y}
          w={LCARD.w}
          h={LCARD.h}
          r={24}
          enter={cardInL}
          accent
        >
          <div style={{ position: "absolute", left: 28, top: 20 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 78,
                fontWeight: 700,
                color: G.accent,
                lineHeight: "84px",
                ...tabular,
              }}
            >
              {fmt(mapTokens)}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 600,
                color: G.muted,
                marginTop: 2,
              }}
            >
              tokens
            </div>
          </div>
        </GCard>

        <GCard
          x={RCARD.x}
          y={RCARD.y}
          w={RCARD.w}
          h={RCARD.h}
          r={24}
          enter={cardInR}
          style={{ borderColor: "rgba(232,112,95,0.34)" }}
        >
          <div style={{ position: "absolute", left: 28, top: 20 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 78,
                fontWeight: 700,
                color: G.red,
                lineHeight: "84px",
                ...tabular,
              }}
            >
              {fmt(reTokens)}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 40,
                fontWeight: 600,
                color: G.muted,
                marginTop: 2,
              }}
            >
              tokens
            </div>
          </div>
        </GCard>

        {/* travellers */}
        {travelling ? (
          <div
            style={{
              position: "absolute",
              left: dot.x - 14,
              top: dot.y - 14,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#D8FFEE",
            }}
          />
        ) : null}
        {sweepActive ? (
          <div
            style={{
              position: "absolute",
              left: dotR.x - 13,
              top: dotR.y - 13,
              width: 26,
              height: 26,
              borderRadius: 999,
              background: G.red,
              opacity: dotRP < 1 ? 1 : 0,
            }}
          />
        ) : null}
      </div>
    </GraphWorld>
  );
};
