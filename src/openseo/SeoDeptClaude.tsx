/**
 * SeoDeptClaude — OpenSEO series opener (1080×1080, 30fps, 270f).
 *
 * One continuous paper world: a Claude node wired down a connector spine into
 * the OpenSEO node, which fans out into four real workflow lanes carrying real
 * data. Camera opens tight on the breathing Claude mark, travels down the
 * spine, pulls out to the whole department board, then settles on two
 * near-identical keys.
 */
import React from "react";
import {
  Img,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  A,
  C,
  Card,
  Chip,
  FONT,
  MONO,
  OpenSeoLockup,
  PaperWorld,
  fmt,
  tabular,
  useCam,
  useCountUp,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 270;

// --- Accent tints -----------------------------------------------------------
// Derived from the kit's accent so this clip follows a palette change instead
// of carrying a second, stale copy of the colour. (The Claude halo keeps
// Claude's own coral — that is brand, not series accent.)
const [AR, AG, AB] = (C.orange.match(/\w\w/g) ?? ["00", "00", "00"]).map((h) =>
  parseInt(h, 16),
);
/** Accent at a given alpha. */
const accentA = (a: number) => `rgba(${AR},${AG},${AB},${a})`;

// ---------------------------------------------------------------------------
// World geometry (world coords; camera maps these onto the 1080² canvas)
// ---------------------------------------------------------------------------

const SPINE_X = 540;

// Two peer lockups on the spine: identical card box, radius and type treatment.
const CLAUDE = { cx: SPINE_X, cy: 165, w: 420, h: 110 }; // 330..750 × 110..220
const OS = { cx: SPINE_X, cy: 325, w: 420, h: 110 }; // 330..750 × 270..380
const NODE_R = 30;
const LOCKUP = 78;

const LINK_Y1 = 220; // bottom of the Claude card
const LINK_Y2 = 270; // top of the OpenSEO card
const STEM_Y1 = 380; // bottom of the OpenSEO card
const BUS_Y = 430;

const COL_X = [280, 800];
const CARD_W = 480;
const CARD_H = 258;
const ROW_Y = [470, 758];
const RAIL_Y1 = ROW_Y[0] + CARD_H; // 728
const RAIL_Y2 = ROW_Y[1]; // 758

const CARD_PAD = 22;
const INNER_W = CARD_W - CARD_PAD * 2; // 436

// Board bounding box: x 40..1040, y 20..1016 → focal centre
const BOARD_FY = 518;

// ---------------------------------------------------------------------------
// Beat timeline
// ---------------------------------------------------------------------------

const T = {
  osIn: 42, // OpenSEO node springs into the world
  snap: 56, // link between Claude and OpenSEO locks
  pulse1: 56, // first accent pulse travels the cable
  pulse1Dur: 18,
  busIn: 88, // fan-out bus + drops draw in
  dropsIn: 94,
  railsIn: 122,
  lanes: [96, 106, 116, 126],
  pulse2: 214, // the "live" sweep down the whole spine
  pulse2Dur: 40,
};

// The open frames the whole Claude LOCKUP (mark + wordmark), not a crop of the
// mark. At z=2.15 the 420-wide card spans x 88.5..991.5 on the 1080 canvas —
// inside the 54px side margins.
const CAM = {
  keys: [0, 30, 52, 82, 100, 196, 214, 252, 270],
  fx: [SPINE_X, SPINE_X, SPINE_X, SPINE_X, SPINE_X, SPINE_X, SPINE_X, SPINE_X, SPINE_X],
  fy: [CLAUDE.cy, CLAUDE.cy, 248, 248, BOARD_FY, BOARD_FY, BOARD_FY, BOARD_FY, BOARD_FY],
  z: [2.15, 2.15, 1.88, 1.88, 0.94, 0.94, 0.96, 0.96, 0.96],
};

// ---------------------------------------------------------------------------
// Connectors
// ---------------------------------------------------------------------------

type Heads = number[];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Vertical wire with travelling accent pulses. */
const VWire: React.FC<{
  x: number;
  y1: number;
  y2: number;
  heads: Heads;
  draw?: number;
  flash?: number;
  w?: number;
}> = ({ x, y1, y2, heads, draw = 1, flash = 0, w = 4 }) => {
  const len = (y2 - y1) * clamp01(draw);
  if (len <= 0.5) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y1,
        width: w,
        height: len,
        borderRadius: w,
        background: C.orangeLine,
        overflow: "hidden",
      }}
    >
      {flash > 0.01 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.orange,
            opacity: clamp01(flash),
          }}
        />
      ) : null}
      {heads.map((h, i) => {
        const local = h - y1;
        if (local < -90 || local > len + 90) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: local - 78,
              width: w,
              height: 156,
              background: `linear-gradient(to bottom, ${accentA(0)}, ${C.orange} 50%, ${accentA(0)})`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Horizontal fan-out bus. Flashes when a pulse head crosses its row. */
const HBus: React.FC<{
  y: number;
  x1: number;
  x2: number;
  draw: number;
  flash: number;
  w?: number;
}> = ({ y, x1, x2, draw, flash, w = 4 }) => {
  const d = clamp01(draw);
  if (d <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x1,
        top: y - w / 2,
        width: x2 - x1,
        height: w,
        borderRadius: w,
        background: C.orangeLine,
        transform: `scaleX(${d})`,
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: w,
          background: C.orange,
          opacity: flash,
        }}
      />
    </div>
  );
};

/** Junction node that snaps in on the link close. */
const Node: React.FC<{ x: number; y: number; pop: number; size?: number }> = ({
  x,
  y,
  pop,
  size = 22,
}) => {
  if (pop < 0.02) return null;
  const s = 0.4 + 0.6 * pop;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        background: C.card,
        border: `4px solid ${C.orange}`,
        transform: `scale(${s})`,
        opacity: clamp01(pop),
        boxShadow: `0 4px 12px ${accentA(0.28)}`,
      }}
    />
  );
};

/**
 * Claude mark + wordmark, built to the same recipe as the kit's OpenSeoLockup
 * (same mark size, same 22px gap, same 0.72em weight-700 wordmark) so the two
 * nodes read as siblings.
 */
const ClaudeLockup: React.FC<{ size?: number; gap?: number }> = ({
  size = LOCKUP,
  gap = 22,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap }}>
    <Img
      src={staticFile(A.logo.claude)}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size * 0.72,
        color: C.ink,
        letterSpacing: -1.2,
      }}
    >
      Claude
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Lane card chrome
// ---------------------------------------------------------------------------

const LaneTitle: React.FC<{ label: string; dot: number }> = ({ label, dot }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: CARD_PAD,
        top: 20,
        fontFamily: FONT,
        fontSize: 44,
        fontWeight: 800,
        letterSpacing: -0.9,
        color: C.ink,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
    <div
      style={{
        position: "absolute",
        right: CARD_PAD,
        top: 40,
        width: 14,
        height: 14,
        borderRadius: 999,
        background: C.orange,
        opacity: 0.35 + 0.65 * dot,
      }}
    />
  </>
);

const Line2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: CARD_PAD,
      top: 92,
      width: INNER_W,
      height: 54,
      display: "flex",
      alignItems: "center",
    }}
  >
    {children}
  </div>
);

const Line3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: CARD_PAD,
      top: 154,
      width: INNER_W,
      height: 82,
      display: "flex",
      alignItems: "flex-end",
      gap: 20,
    }}
  >
    {children}
  </div>
);

const BigNum: React.FC<{ children: React.ReactNode; opacity?: number }> = ({
  children,
  opacity = 1,
}) => (
  <span
    style={{
      fontFamily: FONT,
      fontSize: 74,
      fontWeight: 800,
      letterSpacing: -2.4,
      lineHeight: 1,
      color: C.ink,
      opacity,
      ...tabular,
    }}
  >
    {children}
  </span>
);

// --- Rank sparkline ---------------------------------------------------------

const RANKS = [14, 13, 15, 12, 11, 9, 8, 6];
const SPARK_W = INNER_W;
const SPARK_H = 54;
const SPARK_PTS = RANKS.map((r, i) => ({
  x: 5 + (i / (RANKS.length - 1)) * (SPARK_W - 10),
  y: interpolate(r, [5, 16], [7, SPARK_H - 7]),
}));
const SPARK_LEN = SPARK_PTS.reduce((sum, p, i) => {
  if (i === 0) return 0;
  const q = SPARK_PTS[i - 1];
  return sum + Math.hypot(p.x - q.x, p.y - q.y);
}, 0);
const SPARK_D = SPARK_PTS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const Sparkline: React.FC<{ t: number }> = ({ t }) => {
  const end = SPARK_PTS[SPARK_PTS.length - 1];
  return (
    <svg width={SPARK_W} height={SPARK_H} style={{ display: "block", overflow: "visible" }}>
      <line
        x1={0}
        y1={SPARK_H - 3}
        x2={SPARK_W}
        y2={SPARK_H - 3}
        stroke={C.line}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={SPARK_D}
        fill="none"
        stroke={C.orange}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={SPARK_LEN}
        strokeDashoffset={SPARK_LEN * (1 - clamp01(t))}
      />
      {t > 0.97 ? (
        <circle cx={end.x} cy={end.y} r={9} fill={C.card} stroke={C.orange} strokeWidth={5} />
      ) : null}
    </svg>
  );
};

// --- Site Audit severity meter ---------------------------------------------

const SEV = [
  { w: 0.19, c: C.red },
  { w: 0.35, c: C.orange },
  { w: 0.46, c: "rgba(154,160,166,0.55)" },
];

const SeverityBar: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      width: INNER_W,
      height: 18,
      borderRadius: 999,
      background: C.line,
      overflow: "hidden",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: 18,
        width: INNER_W,
        display: "flex",
        clipPath: `inset(0 ${(1 - clamp01(t)) * 100}% 0 0)`,
      }}
    >
      {SEV.map((s, i) => (
        <div key={i} style={{ width: INNER_W * s.w, height: 18, background: s.c }} />
      ))}
    </div>
  </div>
);

// --- Backlinks mini bars ----------------------------------------------------

const BL_BARS = [0.32, 0.46, 0.4, 0.6, 0.53, 0.72, 0.66, 1];
const BL_W = 15;
const BL_GAP = 8;

const MiniBars: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: BL_GAP, height: 66 }}>
    {BL_BARS.map((h, i) => {
      const local = clamp01((clamp01(t) * (BL_BARS.length + 3) - i) / 3.4);
      return (
        <div
          key={i}
          style={{
            width: BL_W,
            height: Math.max(4, 66 * h * local),
            borderRadius: 5,
            background: i === BL_BARS.length - 1 ? C.orange : accentA(0.3),
          }}
        />
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const SeoDeptClaude: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cam = useCam(CAM);

  // --- pulses ---------------------------------------------------------------
  const heads: Heads = [];
  if (frame >= T.pulse1 && frame <= T.pulse1 + T.pulse1Dur + 4) {
    heads.push(
      interpolate(frame, [T.pulse1, T.pulse1 + T.pulse1Dur], [195, 400], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }
  if (frame >= T.pulse2 && frame <= T.pulse2 + T.pulse2Dur + 6) {
    heads.push(
      interpolate(frame, [T.pulse2, T.pulse2 + T.pulse2Dur], [195, 1050], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      }),
    );
  }
  const busFlash = heads.reduce(
    (m, h) => Math.max(m, Math.exp(-Math.pow((h - BUS_Y) / 55, 2))),
    0,
  );

  // --- Claude node ----------------------------------------------------------
  const breath = 1 + 0.02 * Math.sin(frame / 12);

  // --- link + OpenSEO node ---------------------------------------------------
  const osIn = spring({ frame: frame - T.osIn, fps, config: { damping: 14, stiffness: 150 } });
  // The wider opening frame now sees the paper below the Claude lockup, so the
  // cable draws down to meet the OpenSEO node instead of dangling from frame 0.
  const linkDraw = spring({
    frame: frame - (T.osIn - 10),
    fps,
    config: { damping: 20, stiffness: 140 },
  });
  const linkFlash = interpolate(frame, [T.snap - 1, T.snap + 2, T.snap + 15], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nodePop = spring({ frame: frame - T.snap - 2, fps, config: { damping: 11, stiffness: 210 } });
  const osGlow = interpolate(frame, [T.snap + 8, T.snap + 14, T.snap + 34], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- structure -------------------------------------------------------------
  const busDraw = spring({ frame: frame - T.busIn, fps, config: { damping: 17, stiffness: 130 } });
  const dropDraw = spring({ frame: frame - T.dropsIn, fps, config: { damping: 18, stiffness: 160 } });
  const railDraw = spring({ frame: frame - T.railsIn, fps, config: { damping: 18, stiffness: 160 } });

  // --- lanes -----------------------------------------------------------------
  const lane0 = spring({ frame: frame - T.lanes[0], fps, config: { damping: 13, stiffness: 150 } });
  const lane1 = spring({ frame: frame - T.lanes[1], fps, config: { damping: 13, stiffness: 150 } });
  const lane2 = spring({ frame: frame - T.lanes[2], fps, config: { damping: 13, stiffness: 150 } });
  const lane3 = spring({ frame: frame - T.lanes[3], fps, config: { damping: 13, stiffness: 150 } });
  const laneEnter = [lane0, lane1, lane2, lane3];

  const dot = 0.5 + 0.5 * Math.sin(frame / 7);

  const fadeIn = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Keyword Research — verified triple from the real openseo.so MCP output
  const kwText = useTypewriter("open source seo", 100, 1.7);
  const kwVol = useCountUp({ to: 1300, start: 104, duration: 38 });
  const kwFade = fadeIn(102, 110);
  const kdPop = spring({ frame: frame - 144, fps, config: { damping: 12, stiffness: 190 } });

  // Rank Tracking
  const sparkT = interpolate(frame, [110, 146], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const rankNow = useCountUp({ to: 6, start: 116, duration: 34, from: 14 });
  const rankFrom = fadeIn(122, 132);
  const rankChip = spring({ frame: frame - 152, fps, config: { damping: 12, stiffness: 190 } });

  // Site Audit
  const issues = useCountUp({ to: 27, start: 120, duration: 38 });
  const auditFade = fadeIn(118, 126);
  const sevT = interpolate(frame, [122, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Backlinks
  const refDomains = useCountUp({ to: 1284, start: 130, duration: 42 });
  const linkFade = fadeIn(128, 136);
  const blT = interpolate(frame, [132, 172], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const laneLive = [0, 1, 2, 3].map((i) => {
    const ry = ROW_Y[i < 2 ? 0 : 1];
    return heads.some((h) => h > ry - 40 && h < ry + CARD_H + 40);
  });

  return (
    <PaperWorld cam={cam}>
      {/* -------------------------------------------------- connectors (behind) */}
      <VWire
        x={SPINE_X}
        y1={LINK_Y1}
        y2={LINK_Y2}
        heads={heads}
        draw={linkDraw}
        flash={linkFlash}
      />
      <VWire x={SPINE_X} y1={STEM_Y1} y2={BUS_Y} heads={heads} draw={osIn} />
      <HBus y={BUS_Y} x1={COL_X[0]} x2={COL_X[1]} draw={busDraw} flash={busFlash} />
      {COL_X.map((cx) => (
        <VWire key={`d${cx}`} x={cx} y1={BUS_Y} y2={ROW_Y[0]} heads={heads} draw={dropDraw} />
      ))}
      {COL_X.map((cx) => (
        <VWire key={`r${cx}`} x={cx} y1={RAIL_Y1} y2={RAIL_Y2} heads={heads} draw={railDraw} />
      ))}

      {/* -------------------------------------------------- Claude node */}
      <div
        style={{
          position: "absolute",
          left: CLAUDE.cx - 330,
          top: CLAUDE.cy - 330,
          width: 660,
          height: 660,
          borderRadius: 999,
          background: "transparent",
          opacity: 0,
        }}
      />
      <Card
        x={CLAUDE.cx - CLAUDE.w / 2}
        y={CLAUDE.cy - CLAUDE.h / 2}
        w={CLAUDE.w}
        h={CLAUDE.h}
        r={NODE_R}
        style={{
          display: "grid",
          placeItems: "center",
          transform: `scale(${breath})`,
        }}
      >
        <ClaudeLockup />
      </Card>

      {/* -------------------------------------------------- OpenSEO node */}
      {osIn > 0.01 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: OS.cx - 400,
              top: OS.cy - 400,
              width: 800,
              height: 800,
              borderRadius: 999,
              background: "transparent",
              opacity: 0,
            }}
          />
          <Card
            x={OS.cx - OS.w / 2}
            y={OS.cy - OS.h / 2}
            w={OS.w}
            h={OS.h}
            r={NODE_R}
            accent={osGlow > 0.25}
            style={{
              display: "grid",
              placeItems: "center",
              opacity: osIn,
              transform: `translateY(${(1 - osIn) * 26}px) scale(${0.9 + 0.1 * osIn})`,
            }}
          >
            <OpenSeoLockup size={LOCKUP} />
          </Card>
        </>
      ) : null}

      <Node x={SPINE_X} y={LINK_Y1} pop={nodePop} />
      <Node x={SPINE_X} y={LINK_Y2} pop={nodePop} />
      <Node x={SPINE_X} y={BUS_Y} pop={busDraw} size={20} />

      {/* -------------------------------------------------- Lane 1 — Keyword Research */}
      <Card
        x={COL_X[0] - CARD_W / 2}
        y={ROW_Y[0]}
        w={CARD_W}
        h={CARD_H}
        enter={laneEnter[0]}
        accent={laneLive[0]}
      >
        <LaneTitle label="Keyword Research" dot={dot} />
        <Line2>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 42,
              fontWeight: 500,
              color: C.muted,
              letterSpacing: -0.6,
              whiteSpace: "nowrap",
            }}
          >
            {kwText}
          </span>
        </Line2>
        <Line3>
          <BigNum opacity={kwFade}>{fmt(kwVol)}</BigNum>
          <div
            style={{
              marginBottom: 8,
              transform: `scale(${0.6 + 0.4 * kdPop})`,
              opacity: clamp01(kdPop),
              transformOrigin: "0% 50%",
            }}
          >
            <Chip label="KD 12" tone="orange" size={38} />
          </div>
        </Line3>
      </Card>

      {/* -------------------------------------------------- Lane 2 — Rank Tracking */}
      <Card
        x={COL_X[1] - CARD_W / 2}
        y={ROW_Y[0]}
        w={CARD_W}
        h={CARD_H}
        enter={laneEnter[1]}
        accent={laneLive[1]}
      >
        <LaneTitle label="Rank Tracking" dot={dot} />
        <Line2>
          <Sparkline t={sparkT} />
        </Line2>
        <Line3>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 42,
              fontWeight: 700,
              color: C.mutedSoft,
              lineHeight: 1,
              marginBottom: 6,
              opacity: rankFrom,
              ...tabular,
            }}
          >
            #14
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 700,
              color: C.mutedSoft,
              lineHeight: 1,
              marginBottom: 6,
              opacity: rankFrom,
            }}
          >
            →
          </span>
          <BigNum>#{Math.round(rankNow)}</BigNum>
          <div
            style={{
              marginBottom: 8,
              transform: `scale(${0.6 + 0.4 * rankChip})`,
              opacity: clamp01(rankChip),
              transformOrigin: "0% 50%",
            }}
          >
            <Chip label="+8" tone="green" size={38} />
          </div>
        </Line3>
      </Card>

      {/* -------------------------------------------------- Lane 3 — Site Audit */}
      <Card
        x={COL_X[0] - CARD_W / 2}
        y={ROW_Y[1]}
        w={CARD_W}
        h={CARD_H}
        enter={laneEnter[2]}
        accent={laneLive[2]}
      >
        <LaneTitle label="Site Audit" dot={dot} />
        <Line2>
          <SeverityBar t={sevT} />
        </Line2>
        <Line3>
          <BigNum opacity={auditFade}>{fmt(issues)}</BigNum>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 700,
              color: C.muted,
              lineHeight: 1,
              marginBottom: 6,
              opacity: auditFade,
            }}
          >
            issues
          </span>
        </Line3>
      </Card>

      {/* -------------------------------------------------- Lane 4 — Backlinks */}
      <Card
        x={COL_X[1] - CARD_W / 2}
        y={ROW_Y[1]}
        w={CARD_W}
        h={CARD_H}
        enter={laneEnter[3]}
        accent={laneLive[3]}
      >
        <LaneTitle label="Backlinks" dot={dot} />
        <Line2>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 42,
              fontWeight: 500,
              color: C.muted,
              letterSpacing: -0.6,
              whiteSpace: "nowrap",
            }}
          >
            referring domains
          </span>
        </Line2>
        <Line3>
          <BigNum opacity={linkFade}>{fmt(refDomains)}</BigNum>
          <div style={{ marginLeft: "auto", marginRight: 4, marginBottom: 4 }}>
            <MiniBars t={blT} />
          </div>
        </Line3>
      </Card>
    </PaperWorld>
  );
};
