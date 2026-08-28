import React from "react";
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  EASE,
  LogoImg,
  MONO,
  PaperWorld,
  S2C,
  S2cMark,
  SPRINGS,
  useCam,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 120;

// ---------------------------------------------------------------------------
// World geometry — 1080×1920 viewport, world ≈ screen at the final framing.
// Content is laid out inside x = 90 … 990 so that even at the strongest
// camera zoom (1.07 on the opening hold) nothing renders outside x = 54…1026.
// ---------------------------------------------------------------------------

const ROW = { y: 244, w: 280, h: 316, gap: 30 };
const CARD_X = [90, 400, 710] as const;
const CARD_CX = CARD_X.map((x) => x + ROW.w / 2); // 230, 540, 850

const DOT_Y = 578; // node dots under each input card (row bottom = 560)
const JUNCTION = { x: 540, y: 828 };
const MARK = { size: 176, cx: 540, cy: 940 }; // top 852, bottom 1028
const MARK_TOP = MARK.cy - MARK.size / 2;
const MARK_BOTTOM = MARK.cy + MARK.size / 2;

const OUT = { x: 305, y: 1104, w: 470, h: 576 }; // bottom 1680 (< 1690 safe)
const OUT_BAR = 70;

// Media frames inside input cards 1 and 3 (symmetric)
const FRAME = { w: 216, h: 252, x: 32, y: 32, r: 14 };

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  // Card 1 pre-rolls so frame 0 already opens mid-drop (never an empty frame).
  card: [-6, 4, 12],
  mark: 16,
  dot: [20, 23, 26],
  line: [24, 27, 30], // each draws over 14f → all done by f44
  packet: [36, 39, 42], // each travels 14f → arrivals f50/53/56
  pulse: 56,
  outLine: 56,
  outCard: 60,
  scrollFrom: 86,
  scrollTo: 118,
} as const;

const LINE_DUR = 14;
const PACKET_DUR = 14;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ---------------------------------------------------------------------------
// Connector paths (world coords). Side lines are S-curves that leave the
// cards vertically and arrive at the junction vertically; the centre line is
// straight. `pathLength=1` lets us dash-reveal without measuring.
// ---------------------------------------------------------------------------

type Cubic = {
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p3: [number, number];
};

const CURVES: Cubic[] = [
  {
    p0: [CARD_CX[0], DOT_Y + 14],
    c1: [CARD_CX[0], 700],
    c2: [JUNCTION.x, 692],
    p3: [JUNCTION.x, JUNCTION.y - 8],
  },
  {
    p0: [CARD_CX[1], DOT_Y + 14],
    c1: [CARD_CX[1], 700],
    c2: [JUNCTION.x, 700],
    p3: [JUNCTION.x, JUNCTION.y - 8],
  },
  {
    p0: [CARD_CX[2], DOT_Y + 14],
    c1: [CARD_CX[2], 700],
    c2: [JUNCTION.x, 692],
    p3: [JUNCTION.x, JUNCTION.y - 8],
  },
];

const cubicD = ({ p0, c1, c2, p3 }: Cubic) =>
  `M ${p0[0]} ${p0[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p3[0]} ${p3[1]}`;

const cubicPoint = ({ p0, c1, c2, p3 }: Cubic, t: number) => {
  const u = 1 - t;
  const x =
    u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
  const y =
    u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
  return { x, y };
};

// ---------------------------------------------------------------------------
// Input card contents
// ---------------------------------------------------------------------------

/** Card 1 — the real Yope reference screenshot in a light thumb + capture brackets. */
const ScreenshotContent: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const bracket = interpolate(frame, [at + 6, at + 14], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const L = 30; // bracket arm length
  const inset = -8;
  const corners: Array<[number, number, string]> = [
    [FRAME.x + inset, FRAME.y + inset, `M 0 ${L} L 0 0 L ${L} 0`],
    [FRAME.x + FRAME.w - inset - L, FRAME.y + inset, `M 0 0 L ${L} 0 L ${L} ${L}`],
    [FRAME.x + inset, FRAME.y + FRAME.h - inset - L, `M 0 0 L 0 ${L} L ${L} ${L}`],
    [
      FRAME.x + FRAME.w - inset - L,
      FRAME.y + FRAME.h - inset - L,
      `M ${L} 0 L ${L} ${L} L 0 ${L}`,
    ],
  ];
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: FRAME.x,
          top: FRAME.y,
          width: FRAME.w,
          height: FRAME.h,
          borderRadius: FRAME.r,
          overflow: "hidden",
          border: `1.5px solid ${C.line}`,
          background: "#F3F0EA",
        }}
      >
        <Img
          src={staticFile(S2C.shots.yopeBefore)}
          style={{ width: "100%", display: "block" }}
        />
      </div>
      {corners.map(([cx, cy, d], i) => (
        <svg
          key={i}
          width={L}
          height={L}
          viewBox={`0 0 ${L} ${L}`}
          style={{ position: "absolute", left: cx, top: cy, opacity: bracket }}
        >
          <path
            d={d}
            pathLength={1}
            fill="none"
            stroke={C.orange}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1 - bracket}
          />
        </svg>
      ))}
    </>
  );
};

/** Card 2 — the real multicolour Figma mark, nothing else. */
const FigmaContent: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
    }}
  >
    <LogoImg src={S2C.logos.figma} size={172} />
  </div>
);

/** Card 3 — dark mini video frame: sprocket holes, play button, progress. */
const RecordingContent: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const playPop = spring({ frame: frame - at - 6, fps, config: SPRINGS.pop });
  // Slow "playing" progress — micro-motion for the holds.
  const progress = interpolate(frame, [at + 10, 116], [0.24, 0.62], CLAMP);
  const sprockets = [0, 1, 2, 3, 4];
  const trackW = FRAME.w - 64;
  return (
    <div
      style={{
        position: "absolute",
        left: FRAME.x,
        top: FRAME.y,
        width: FRAME.w,
        height: FRAME.h,
        borderRadius: FRAME.r,
        background: C.term,
        overflow: "hidden",
      }}
    >
      {sprockets.map((i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute",
              left: 9,
              top: 18 + i * 46,
              width: 11,
              height: 15,
              borderRadius: 3.5,
              background: "rgba(255,255,255,0.16)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 9,
              top: 18 + i * 46,
              width: 11,
              height: 15,
              borderRadius: 3.5,
              background: "rgba(255,255,255,0.16)",
            }}
          />
        </React.Fragment>
      ))}
      <div
        style={{
          position: "absolute",
          left: FRAME.w / 2 - 33,
          top: FRAME.h / 2 - 46,
          width: 66,
          height: 66,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          border: "1.5px solid rgba(255,255,255,0.34)",
          display: "grid",
          placeItems: "center",
          transform: `scale(${0.6 + 0.4 * playPop})`,
          opacity: playPop,
        }}
      >
        <svg width="24" height="28" viewBox="0 0 24 28" style={{ marginLeft: 5 }}>
          <path d="M2 2 L22 14 L2 26 Z" fill="#FFFFFF" />
        </svg>
      </div>
      {/* progress track */}
      <div
        style={{
          position: "absolute",
          left: 32,
          bottom: 26,
          width: trackW,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 32,
          bottom: 26,
          width: trackW * progress,
          height: 5,
          borderRadius: 3,
          background: C.orange,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 32 + trackW * progress - 5,
          bottom: 23.5,
          width: 10,
          height: 10,
          borderRadius: 999,
          background: "#FFFFFF",
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Connector layer — node dots, drawing lines, travelling packets, junction
// ---------------------------------------------------------------------------

const Connectors: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const junctionIn = spring({
    frame: frame - (T.line[0] + LINE_DUR),
    fps,
    config: SPRINGS.pop,
  });
  const outLineT = interpolate(frame, [T.outLine, T.outLine + 10], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const outDotIn = spring({
    frame: frame - (T.outLine + 9),
    fps,
    config: SPRINGS.pop,
  });

  // Junction flashes as each packet lands
  const arrivals = T.packet.map((p) => p + PACKET_DUR);
  const flash = arrivals.reduce(
    (acc, a) =>
      Math.max(acc, interpolate(frame, [a - 1, a + 2, a + 9], [0, 1, 0], CLAMP)),
    0,
  );

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* input lines */}
      {CURVES.map((c, i) => {
        const t = interpolate(frame, [T.line[i], T.line[i] + LINE_DUR], [0, 1], {
          ...CLAMP,
          easing: EASE,
        });
        if (t <= 0) return null;
        return (
          <path
            key={i}
            d={cubicD(c)}
            pathLength={1}
            fill="none"
            stroke={C.orangeLine}
            strokeWidth={3}
            strokeDasharray={1}
            strokeDashoffset={1 - t}
            strokeLinecap="round"
          />
        );
      })}

      {/* stub junction → mark */}
      {junctionIn > 0.01 ? (
        <line
          x1={JUNCTION.x}
          y1={JUNCTION.y}
          x2={JUNCTION.x}
          y2={JUNCTION.y + (MARK_TOP - 4 - JUNCTION.y) * Math.min(1, junctionIn)}
          stroke={C.orangeLine}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}

      {/* node dots under each card */}
      {CARD_CX.map((cx, i) => {
        const s = spring({ frame: frame - T.dot[i], fps, config: SPRINGS.pop });
        if (s <= 0.01) return null;
        return (
          <circle
            key={i}
            cx={cx}
            cy={DOT_Y}
            r={7 * Math.min(1, s)}
            fill="#FFFFFF"
            stroke={C.orange}
            strokeWidth={2.5}
          />
        );
      })}

      {/* junction node */}
      {junctionIn > 0.01 ? (
        <circle
          cx={JUNCTION.x}
          cy={JUNCTION.y}
          r={(7 + flash * 4) * Math.min(1, junctionIn)}
          fill="#FFFFFF"
          stroke={C.orange}
          strokeWidth={2.5 + flash * 1.5}
        />
      ) : null}

      {/* packets */}
      {CURVES.map((c, i) => {
        const t = interpolate(frame, [T.packet[i], T.packet[i] + PACKET_DUR], [0, 1], {
          ...CLAMP,
          easing: Easing.inOut(Easing.quad),
        });
        if (t <= 0 || t >= 1) return null;
        const o =
          interpolate(t, [0, 0.12], [0, 1], CLAMP) *
          interpolate(t, [0.86, 1], [1, 0], CLAMP);
        const { x, y } = cubicPoint(c, t);
        return <circle key={`p${i}`} cx={x} cy={y} r={7.5} fill={C.orange} opacity={o} />;
      })}

      {/* mark → output line + node */}
      {outLineT > 0 ? (
        <line
          x1={540}
          y1={MARK_BOTTOM + 6}
          x2={540}
          y2={MARK_BOTTOM + 6 + (OUT.y - 10 - (MARK_BOTTOM + 6)) * outLineT}
          stroke={C.orangeLine}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
      {outDotIn > 0.01 ? (
        <circle
          cx={540}
          cy={OUT.y - 8}
          r={7 * Math.min(1, outDotIn)}
          fill="#FFFFFF"
          stroke={C.orange}
          strokeWidth={2.5}
        />
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The // mark — pops in, pulses once when the packets land. No glow.
// ---------------------------------------------------------------------------

const CenterMark: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(T.mark, SPRINGS.pop);
  const pulse = interpolate(frame, [T.pulse, T.pulse + 7, T.pulse + 20], [1, 1.085, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: MARK.cx - MARK.size / 2,
        top: MARK.cy - MARK.size / 2,
        opacity: Math.min(1, enter),
        transform: `translateY(${(1 - enter) * 24}px) scale(${pulse})`,
      }}
    >
      <S2cMark
        size={MARK.size}
        style={{ boxShadow: "0 16px 38px rgba(25,23,20,0.10)" }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Output — mobile browser chrome holding the real generated result
// ---------------------------------------------------------------------------

const OutputBrowser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.outCard,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  if (enter <= 0.001) return null;

  // The official demo asset carries a baked-in backdrop + rounded phone frame;
  // zoom ~9% and start slightly scrolled so the generated page fills the
  // viewport edge-to-edge, then drift down slowly during the hold.
  const scroll = interpolate(frame, [T.scrollFrom, T.scrollTo], [-30, -244], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const imgW = Math.round(OUT.w * 1.09); // 512

  return (
    <div
      style={{
        position: "absolute",
        left: OUT.x,
        top: OUT.y,
        width: OUT.w,
        height: OUT.h,
        opacity: Math.min(1, enter * 1.3),
        transform: `translateY(${(1 - enter) * 150}px)`,
      }}
    >
      <Card x={0} y={0} w={OUT.w} h={OUT.h} r={24} style={{ overflow: "hidden" }}>
        {/* browser bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: OUT_BAR,
            borderBottom: `1.5px solid ${C.lineSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "0 20px",
            background: "#FCFBF9",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                background: "#DDD6CA",
              }}
            />
          ))}
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              height: 40,
              borderRadius: 999,
              background: "#F3F0EA",
              border: `1.5px solid ${C.lineSoft}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontSize: 22,
              color: C.muted,
              letterSpacing: 0.2,
            }}
          >
            localhost:5173
          </div>
        </div>
        {/* rendered page — the official generated-result demo, slow scroll */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: OUT_BAR,
            width: "100%",
            height: OUT.h - OUT_BAR,
            overflow: "hidden",
            background: "#101010",
          }}
        >
          <Img
            src={staticFile(S2C.shots.yopeAfter)}
            style={{
              width: imgW,
              display: "block",
              marginLeft: Math.round((OUT.w - imgW) / 2),
              transform: `translateY(${scroll}px)`,
            }}
          />
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const S2cHookThreeInputs: React.FC = () => {
  // Hold on the input row while the cards drop → 18f descend as the lines
  // draw down toward the mark → settle on the full input→mark→output system
  // with an imperceptible push. Last two keys are near-identical (clean hold).
  const cam = useCam({
    keys: [0, 26, 44, 111, 120],
    fx: [540, 540, 540, 540, 540],
    fy: [640, 640, 956, 964, 965],
    z: [1.07, 1.07, 0.997, 1.005, 1.0055],
  });

  const cardEnters = [useEnter(T.card[0]), useEnter(T.card[1]), useEnter(T.card[2])];

  return (
    <PaperWorld cam={cam}>
      <Connectors />

      {/* three input cards */}
      <Card x={CARD_X[0]} y={ROW.y} w={ROW.w} h={ROW.h} r={24} enter={cardEnters[0]}>
        <ScreenshotContent at={T.card[0]} />
      </Card>
      <Card x={CARD_X[1]} y={ROW.y} w={ROW.w} h={ROW.h} r={24} enter={cardEnters[1]}>
        <FigmaContent />
      </Card>
      <Card x={CARD_X[2]} y={ROW.y} w={ROW.w} h={ROW.h} r={24} enter={cardEnters[2]}>
        <RecordingContent at={T.card[2]} />
      </Card>

      <CenterMark />
      <OutputBrowser />
    </PaperWorld>
  );
};
