import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  EASE,
  LogoImg,
  PaperWorld,
  SCRAPY,
  SPRINGS,
  ScrapyMark,
  TEAL,
  TEAL_LINE,
  useCam,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 170;

// ---------------------------------------------------------------------------
// World geometry — 1080×1920 viewport, world ≈ viewport at the final framing.
// Content lives inside x = 90 … 990 so that even at the strongest zoom
// (1.07 on the opening hold) nothing renders outside x = 54 … 1026.
//
// Concept: three platforms locked behind an API paywall (dashed barrier) →
// a gap opens → Scrapy routes the data through it into a clean table anyway.
// ---------------------------------------------------------------------------

const CARD_ROW = { y: 230, w: 280, h: 260 };
const CARD_X = [90, 400, 710] as const;
const CARD_CX = [230, 540, 850] as const;
const DOT_Y = 510; // node dots just under each platform card (bottom = 490)

const BARRIER = { y: 600, x1: 90, x2: 990, gapL: 448, gapR: 632 };

const MARK = { size: 190, cx: 540, cy: 900 }; // top 805, bottom 995

const OUT = { x: 260, y: 1080, w: 560, header: 62, rowH: 66, padB: 10 };
const OUT_H0 = OUT.header + OUT.padB; // 72 header-only → grows to 402 (5 rows)

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  // Card 1 pre-rolls so frame 0 already opens mid-drop (never an empty frame).
  card: [-6, 2, 10],
  lock: [6, 13, 20],
  barrier: [18, 34], // draws from both edges toward the centre
  mark: 36,
  gap: [60, 72], // the paywall parts around the centre
  dot: [60, 66, 72],
  line: [64, 70, 76], // each draws over 20f → all done by f96
  outLine: 78,
  outDot: 85,
  outCard: 84,
  // The card enters header-only and GROWS one row slot at a time — never a
  // hollow box waiting for content. Row 5 appends during the end hold.
  rows: [92, 106, 118, 130, 148],
} as const;

const LINE_DUR = 20;
const PACKET_DUR = 20;

/** path index + departure frame. Arrivals: 108 / 114 / 120 / 146 / 158. */
const PACKETS: { path: number; at: number }[] = [
  { path: 0, at: 88 },
  { path: 1, at: 94 },
  { path: 2, at: 100 },
  { path: 1, at: 126 },
  { path: 2, at: 138 }, // the "one more packet" arriving during the end hold
];
const ARRIVALS = PACKETS.map((p) => p.at + PACKET_DUR);

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const AMBER = "#B45309";

// ---------------------------------------------------------------------------
// Connector paths (world coords). Two cubic segments each: card → a waypoint
// INSIDE the barrier gap (x 448…632 at y 600) → vertically into the mark.
// Ends at y 816, tucked under the mark so lines/packets vanish into it.
// ---------------------------------------------------------------------------

type Cubic = {
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p3: [number, number];
};

const seg = (
  p0: [number, number],
  c1: [number, number],
  c2: [number, number],
  p3: [number, number],
): Cubic => ({ p0, c1, c2, p3 });

const ROUTES: Cubic[][] = [
  [
    seg([230, 522], [230, 572], [480, 556], [480, 600]),
    seg([480, 600], [480, 664], [540, 708], [540, 816]),
  ],
  [seg([540, 522], [540, 620], [540, 716], [540, 816])],
  [
    seg([850, 522], [850, 572], [600, 556], [600, 600]),
    seg([600, 600], [600, 664], [540, 708], [540, 816]),
  ],
];

const cubicPoint = ({ p0, c1, c2, p3 }: Cubic, t: number) => {
  const u = 1 - t;
  const x =
    u * u * u * p0[0] +
    3 * u * u * t * c1[0] +
    3 * u * t * t * c2[0] +
    t * t * t * p3[0];
  const y =
    u * u * u * p0[1] +
    3 * u * u * t * c1[1] +
    3 * u * t * t * c2[1] +
    t * t * t * p3[1];
  return { x, y };
};

const cubicLength = (c: Cubic) => {
  let len = 0;
  let prev = cubicPoint(c, 0);
  for (let i = 1; i <= 24; i++) {
    const p = cubicPoint(c, i / 24);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
};

const ROUTE_SEG_LEN = ROUTES.map((r) => r.map(cubicLength));
const ROUTE_LEN = ROUTE_SEG_LEN.map((ls) => ls.reduce((a, b) => a + b, 0));

/** Point at normalized arc-length t along a whole (multi-segment) route. */
const routePoint = (route: number, t: number) => {
  const segs = ROUTES[route];
  const lens = ROUTE_SEG_LEN[route];
  let dist = t * ROUTE_LEN[route];
  for (let i = 0; i < segs.length; i++) {
    if (dist <= lens[i] || i === segs.length - 1) {
      return cubicPoint(segs[i], Math.min(1, Math.max(0, dist / lens[i])));
    }
    dist -= lens[i];
  }
  return cubicPoint(segs[segs.length - 1], 1);
};

const routeD = (route: Cubic[]) =>
  `M ${route[0].p0[0]} ${route[0].p0[1]} ` +
  route
    .map(
      ({ c1, c2, p3 }) =>
        `C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p3[0]} ${p3[1]}`,
    )
    .join(" ");

// ---------------------------------------------------------------------------
// Padlock chip — drawn glyph, amber on ink-warm chip. No words.
// ---------------------------------------------------------------------------

const PadlockChip: React.FC<{ at: number }> = ({ at }) => {
  const s = useEnter(at, SPRINGS.pop);
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        width: 54,
        height: 54,
        borderRadius: 999,
        background: "rgba(180,83,9,0.08)",
        border: "1.5px solid rgba(180,83,9,0.36)",
        display: "grid",
        placeItems: "center",
        opacity: Math.min(1, s),
        transform: `scale(${0.5 + 0.5 * s})`,
      }}
    >
      <svg width="24" height="28" viewBox="0 0 24 28">
        <path
          d="M 5.5 12 V 8.5 a 6.5 6.5 0 0 1 13 0 V 12"
          fill="none"
          stroke={AMBER}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <rect x="2.5" y="12" width="19" height="13.5" rx="3.5" fill={AMBER} />
        <circle cx="12" cy="18.5" r="2.4" fill="#FFF7ED" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 3 content — generic site: mini page skeleton (no words, no real brand)
// ---------------------------------------------------------------------------

const MiniSite: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 52,
      top: 76,
      width: 176,
      height: 148,
      borderRadius: 12,
      border: `1.5px solid ${C.line}`,
      background: "#FCFBF9",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: 30,
        borderBottom: `1.5px solid ${C.lineSoft}`,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 10px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{ width: 6, height: 6, borderRadius: 999, background: "#DDD6CA" }}
        />
      ))}
    </div>
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <div style={{ width: 104, height: 10, borderRadius: 5, background: C.line }} />
      <div style={{ width: 76, height: 10, borderRadius: 5, background: C.lineSoft }} />
      <div style={{ width: 148, height: 42, borderRadius: 8, background: C.lineSoft }} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Wires layer — barrier, gap, node dots, drawing routes, travelling packets
// ---------------------------------------------------------------------------

const Wires: React.FC = () => {
  const frame = useCurrentFrame();

  // Barrier: two dashed halves, dashes anchored at the OUTER ends so they
  // stay put while the inner endpoints draw in (f18–34) and part (f60–72).
  const opts = { ...CLAMP, easing: EASE };
  const innerL = interpolate(
    frame,
    [T.barrier[0], T.barrier[1], T.gap[0], T.gap[1]],
    [BARRIER.x1 + 2, 540, 540, BARRIER.gapL],
    opts,
  );
  const innerR = interpolate(
    frame,
    [T.barrier[0], T.barrier[1], T.gap[0], T.gap[1]],
    [BARRIER.x2 - 2, 540, 540, BARRIER.gapR],
    opts,
  );
  const barrierO = interpolate(frame, [17, 21], [0, 1], CLAMP);
  const capO = interpolate(frame, [T.gap[0] + 2, T.gap[0] + 9], [0, 1], CLAMP);

  const outLineT = interpolate(frame, [T.outLine, T.outLine + 10], [0, 1], opts);
  const outDotIn = useEnter(T.outDot, SPRINGS.pop);
  const dotIns = [
    useEnter(T.dot[0], SPRINGS.pop),
    useEnter(T.dot[1], SPRINGS.pop),
    useEnter(T.dot[2], SPRINGS.pop),
  ];

  const barrierStroke = "rgba(25,23,20,0.5)";

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* paywall barrier */}
      <path
        d={`M ${BARRIER.x1} ${BARRIER.y} L ${innerL} ${BARRIER.y}`}
        stroke={barrierStroke}
        strokeWidth={3}
        strokeDasharray="15 13"
        strokeLinecap="round"
        opacity={barrierO}
      />
      <path
        d={`M ${BARRIER.x2} ${BARRIER.y} L ${innerR} ${BARRIER.y}`}
        stroke={barrierStroke}
        strokeWidth={3}
        strokeDasharray="15 13"
        strokeLinecap="round"
        opacity={barrierO}
      />
      {/* gap edge caps */}
      <circle cx={innerL} cy={BARRIER.y} r={4.5} fill={barrierStroke} opacity={capO} />
      <circle cx={innerR} cy={BARRIER.y} r={4.5} fill={barrierStroke} opacity={capO} />

      {/* routes drawing through the gap into the mark */}
      {ROUTES.map((route, i) => {
        const t = interpolate(frame, [T.line[i], T.line[i] + LINE_DUR], [0, 1], opts);
        if (t <= 0) return null;
        return (
          <path
            key={i}
            d={routeD(route)}
            pathLength={1}
            fill="none"
            stroke={TEAL_LINE}
            strokeWidth={3.5}
            strokeDasharray={1}
            strokeDashoffset={1 - t}
            strokeLinecap="round"
          />
        );
      })}

      {/* node dots under each platform card */}
      {CARD_CX.map((cx, i) => {
        const s = dotIns[i];
        if (s <= 0.01) return null;
        return (
          <circle
            key={i}
            cx={cx}
            cy={DOT_Y}
            r={7 * Math.min(1, s)}
            fill="#FFFFFF"
            stroke={TEAL}
            strokeWidth={2.5}
          />
        );
      })}

      {/* packets travelling the routes */}
      {PACKETS.map(({ path, at }, i) => {
        const t = interpolate(frame, [at, at + PACKET_DUR], [0, 1], {
          ...CLAMP,
          easing: Easing.inOut(Easing.quad),
        });
        if (t <= 0 || t >= 1) return null;
        const o = interpolate(t, [0, 0.12], [0, 1], CLAMP);
        const { x, y } = routePoint(path, t);
        return <circle key={`p${i}`} cx={x} cy={y} r={7.5} fill={TEAL} opacity={o} />;
      })}

      {/* mark → table stub + node */}
      {outLineT > 0 ? (
        <line
          x1={540}
          y1={1003}
          x2={540}
          y2={1003 + 59 * outLineT}
          stroke={TEAL_LINE}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      ) : null}
      {outDotIn > 0.01 ? (
        <circle
          cx={540}
          cy={1068}
          r={7 * Math.min(1, outDotIn)}
          fill="#FFFFFF"
          stroke={TEAL}
          strokeWidth={2.5}
        />
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The real Scrapy mark — springs in below the barrier, pulses on arrivals
// ---------------------------------------------------------------------------

const MarkBlock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.mark, fps, config: SPRINGS.bouncy });
  if (enter <= 0.001) return null;
  const pulse = ARRIVALS.reduce(
    (acc, a) =>
      Math.max(acc, interpolate(frame, [a - 1, a + 3, a + 13], [0, 1, 0], CLAMP)),
    0,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: MARK.cx - MARK.size / 2,
        top: MARK.cy - MARK.size / 2,
        width: MARK.size,
        height: MARK.size,
        borderRadius: 999,
        opacity: Math.min(1, enter),
        transform: `translateY(${(1 - enter) * 30}px) scale(${1 + 0.035 * pulse})`,
        boxShadow: "0 18px 42px rgba(25,23,20,0.14)",
      }}
    >
      <ScrapyMark size={MARK.size} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Output — clean data table skeleton, rows appearing one at a time. No words.
// ---------------------------------------------------------------------------

/** [col2 width, col3 width] per row — col1 is a fixed teal key bar. */
const ROW_BARS: Array<[number, number]> = [
  [218, 120],
  [176, 156],
  [238, 96],
  [198, 132],
  [226, 110],
];

const TableRow: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const e = useEnter(at, SPRINGS.pop);
  if (e <= 0.001) return null;
  const [w2, w3] = ROW_BARS[i];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: OUT.header + i * OUT.rowH,
        width: "100%",
        height: OUT.rowH,
        opacity: Math.min(1, e),
        transform: `translateY(${(1 - e) * 12}px)`,
      }}
    >
      {i > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            top: 0,
            height: 1.5,
            background: C.lineSoft,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 24,
          width: 96,
          height: 18,
          borderRadius: 9,
          background: "rgba(21,184,166,0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 24,
          width: w2,
          height: 18,
          borderRadius: 9,
          background: C.line,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 150 + w2 + 26,
          top: 24,
          width: w3,
          height: 18,
          borderRadius: 9,
          background: C.lineSoft,
        }}
      />
    </div>
  );
};

const OutTable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.outCard,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  if (enter <= 0.001) return null;
  // Height grows one row slot ahead of each row sliding in.
  const grown = T.rows.reduce(
    (acc, at) =>
      acc +
      interpolate(frame, [at - 6, at + 4], [0, 1], { ...CLAMP, easing: EASE }),
    0,
  );
  const h = OUT_H0 + OUT.rowH * grown;
  return (
    <Card
      x={OUT.x}
      y={OUT.y}
      w={OUT.w}
      h={h}
      r={24}
      enter={Math.min(1, enter)}
      style={{ overflow: "hidden" }}
    >
      {/* header — column skeleton bars + small teal accent dot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: OUT.header,
          borderBottom: `1.5px solid ${C.line}`,
          background: "#FCFBF9",
        }}
      >
        {[
          { x: 26, w: 70 },
          { x: 150, w: 120 },
          { x: 396, w: 90 },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: 24,
              width: b.w,
              height: 13,
              borderRadius: 7,
              background: "#DAD3C6",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 25,
            width: 11,
            height: 11,
            borderRadius: 999,
            background: TEAL,
          }}
        />
      </div>
      {T.rows.map((at, i) => (
        <TableRow key={i} i={i} at={at} />
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const ScrHookNoApi: React.FC = () => {
  // Hold on the locked platform row while cards drop and the paywall draws →
  // 18f drift down as the mark lands → hold while the gap opens and the routes
  // draw through it → 18f settle out to the full system while rows fill →
  // long hold, ending on two near-identical keys (imperceptible push).
  const cam = useCam({
    keys: [0, 40, 58, 96, 114, 145, 170],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [560, 560, 832, 832, 870, 870, 872],
    z: [1.07, 1.07, 1.02, 1.02, 0.99, 0.99, 0.992],
  });

  const enters = [
    useEnter(T.card[0]),
    useEnter(T.card[1]),
    useEnter(T.card[2]),
  ];

  return (
    <PaperWorld cam={cam}>
      <Wires />

      {/* three locked platform cards */}
      <Card x={CARD_X[0]} y={CARD_ROW.y} w={CARD_ROW.w} h={CARD_ROW.h} r={24} enter={enters[0]}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <LogoImg src={SCRAPY.logos.x} size={104} />
        </div>
        <PadlockChip at={T.lock[0]} />
      </Card>
      <Card x={CARD_X[1]} y={CARD_ROW.y} w={CARD_ROW.w} h={CARD_ROW.h} r={24} enter={enters[1]}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <LogoImg src={SCRAPY.logos.reddit} size={118} />
        </div>
        <PadlockChip at={T.lock[1]} />
      </Card>
      <Card x={CARD_X[2]} y={CARD_ROW.y} w={CARD_ROW.w} h={CARD_ROW.h} r={24} enter={enters[2]}>
        <MiniSite />
        <PadlockChip at={T.lock[2]} />
      </Card>

      <MarkBlock />
      <OutTable />
    </PaperWorld>
  );
};
