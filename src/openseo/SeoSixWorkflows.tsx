import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  A,
  C,
  Card,
  Chip,
  FONT,
  LogoImg,
  OpenSeoMark,
  PaperWorld,
  SPRINGS,
  fmt,
  safePadX,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 250;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical spine, seven cards hanging off it.
// ---------------------------------------------------------------------------

const SAFE = safePadX(1080); // 54
const CARD_X = SAFE + 46; // 100
const CARD_W = 1080 - CARD_X * 2; // 880
const CARD_H = 180;
const CARD_STEP = 226;
const CARD_Y0 = 496;

const SPINE_X = 540;
const SPINE_TOP = 448;
const SPINE_BOTTOM = 1876;

const TILE_SIZE = 150;
const TILE_CY = 360;

const GSC_Y = 1892;
const GSC_H = 216;

// Card internals
const DOT_X = 34;
const TITLE_X = 70;
const TITLE_W = 312;
const VIS_X = 406;
const VIS_W = 440;

// Beats
const PULSE_START = 60;
const PULSE_END = 166;
const GSC_IN = 180;

const cardTop = (i: number) => CARD_Y0 + i * CARD_STEP;
const cardMid = (i: number) => cardTop(i) + CARD_H / 2;

/** Frame at which the travelling pulse reaches card i. */
const activateAt = (i: number) =>
  PULSE_START +
  ((cardMid(i) - SPINE_TOP) / (SPINE_BOTTOM - SPINE_TOP)) *
    (PULSE_END - PULSE_START);
const enterAt = (i: number) => activateAt(i) - 30;

// ---------------------------------------------------------------------------
// Camera — sampled every 2 frames so useCam's per-segment cubic ease lands
// exactly on the intended curve at every integer frame (f(0.5) === 0.5).
// ---------------------------------------------------------------------------

const smooth = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const seg = (f: number, a: number, b: number) => smooth((f - a) / (b - a));

/** Near-constant-velocity travel with short smooth accel / decel ramps. */
const travelRamp = (t: number) => {
  const a = 0.13;
  const b = 0.13;
  const v = 1 / (1 - (a + b) / 2);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < a) {
    const x = t / a;
    return v * a * (x * x * x - (x * x * x * x) / 2);
  }
  if (t > 1 - b) {
    const x = (1 - t) / b;
    return 1 - v * b * (x * x * x - (x * x * x * x) / 2);
  }
  return (v * a) / 2 + v * (t - a);
};

const camAt = (f: number): { fy: number; z: number } => {
  // tight on the head tile, already alive
  if (f <= 24) {
    const t = seg(f, 0, 24);
    return { fy: 360 + 4 * t, z: 1.78 - 0.04 * t };
  }
  // reveal — pull back to the spine
  if (f <= 42) {
    const t = seg(f, 24, 42);
    return { fy: 364 + 16 * t, z: 1.74 - 0.72 * t };
  }
  if (f <= PULSE_START) return { fy: 380, z: 1.02 };
  // travel down the spine at near-constant velocity
  if (f <= PULSE_END) {
    const t = travelRamp((f - PULSE_START) / (PULSE_END - PULSE_START));
    return { fy: 380 + 1180 * t, z: 1.02 - 0.02 * t };
  }
  // settle back as the seventh card lands
  if (f <= 190) {
    const t = seg(f, PULSE_END, 190);
    return { fy: 1560 - 90 * t, z: 1.0 - 0.03 * t };
  }
  if (f <= 216) {
    const t = seg(f, 190, 216);
    return { fy: 1470 - 8 * t, z: 0.97 - 0.004 * t };
  }
  // pull out to frame the whole stack
  if (f <= 238) {
    const t = seg(f, 216, 238);
    return { fy: 1462 - 139 * t, z: 0.966 - 0.046 * t };
  }
  const t = seg(f, 238, 250);
  return { fy: 1323 - 2 * t, z: 0.92 - 0.0008 * t };
};

const CAM = (() => {
  const keys: number[] = [];
  for (let f = 0; f <= DURATION_IN_FRAMES; f += 2) keys.push(f);
  return {
    keys,
    fx: keys.map(() => SPINE_X),
    fy: keys.map((f) => camAt(f).fy),
    z: keys.map((f) => camAt(f).z),
  };
})();

// ---------------------------------------------------------------------------
// Mini-visuals — every one is frame-driven SVG / divs, no chart libraries.
// ---------------------------------------------------------------------------

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const bigNum: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 56,
  fontWeight: 800,
  color: C.ink,
  letterSpacing: -1.4,
  lineHeight: 1,
  ...tabular,
};

/** 1 — Keyword Research: a real keyword row, volume counting to 3,600. */
const KeywordVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vol = interpolate(frame, [act + 2, act + 26], [0, 3600], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const kd = spring({ frame: frame - (act + 14), fps, config: SPRINGS.pop });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 600,
          color: C.ink2,
          letterSpacing: -0.6,
          whiteSpace: "nowrap",
        }}
      >
        best seo tools
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={bigNum}>{fmt(vol)}</div>
        <Chip
          label="KD 42"
          tone="orange"
          size={30}
          style={{ opacity: kd, transform: `scale(${0.82 + 0.18 * kd})` }}
        />
      </div>
    </div>
  );
};

/** 2 — Rank Tracking: position sparkline drawing in, #14 → #6. */
const RANK_PTS = [14, 13, 15, 12, 11, 10, 8, 7, 6];
const RANK_W = 240;
const RANK_H = 84;
const rankXY = (i: number) => ({
  x: (i / (RANK_PTS.length - 1)) * RANK_W,
  y: ((RANK_PTS[i] - 5) / 11) * RANK_H,
});
const RANK_D = RANK_PTS.map((_, i) => {
  const p = rankXY(i);
  return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
}).join(" ");

const RankVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [act + 2, act + 26], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const rank = interpolate(frame, [act + 4, act + 26], [14, 6], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const chip = spring({ frame: frame - (act + 20), fps, config: SPRINGS.pop });
  const end = rankXY(RANK_PTS.length - 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <svg width={RANK_W + 12} height={RANK_H + 16} style={{ overflow: "visible" }}>
        <g transform="translate(4,8)">
          <path
            d={RANK_D}
            fill="none"
            stroke={C.line}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={RANK_D}
            fill="none"
            stroke={C.orange}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
          <circle
            cx={end.x}
            cy={end.y}
            r={9}
            fill={C.orange}
            opacity={interpolate(draw, [0.88, 1], [0, 1], clamp)}
          />
        </g>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={bigNum}>#{Math.round(rank)}</div>
        <Chip
          label="▲ 8"
          tone="green"
          size={28}
          style={{ opacity: chip, transform: `scale(${0.84 + 0.16 * chip})` }}
        />
      </div>
    </div>
  );
};

/** 3 — Competitor Insights: two domain bars racing, yours overtakes. */
const CompetitorVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const mine = interpolate(frame, [act + 2, act + 30], [0.3, 0.94], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const rival = interpolate(frame, [act + 2, act + 14], [0.14, 0.66], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const rows: { label: string; p: number; hi: boolean }[] = [
    { label: "yoursite.com", p: mine, hi: true },
    { label: "rival.com", p: rival, hi: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{ display: "flex", alignItems: "center", gap: 18 }}
        >
          <div
            style={{
              width: 190,
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 600,
              color: r.hi ? C.ink : C.muted,
              letterSpacing: -0.4,
              whiteSpace: "nowrap",
            }}
          >
            {r.label}
          </div>
          <div
            style={{
              width: 220,
              height: 18,
              borderRadius: 999,
              background: "#EFEAE2",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${r.p * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: r.hi ? C.orange : "#C9C2B6",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/** 4 — Backlinks: link nodes lighting up, referring domains → 1,284. */
const SAT = [
  { x: 18, y: 20 },
  { x: 148, y: 15 },
  { x: 14, y: 96 },
  { x: 145, y: 101 },
];
const HUB = { x: 81, y: 58 };

const BacklinkVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const count = interpolate(frame, [act + 2, act + 28], [0, 1284], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <svg width={164} height={118}>
        {SAT.map((s, i) => {
          const on = interpolate(
            frame,
            [act + 3 + i * 5, act + 10 + i * 5],
            [0, 1],
            clamp,
          );
          return (
            <g key={i}>
              <line
                x1={HUB.x}
                y1={HUB.y}
                x2={s.x + (HUB.x - s.x) * (1 - on)}
                y2={s.y + (HUB.y - s.y) * (1 - on)}
                stroke={C.orange}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.25 + 0.6 * on}
              />
              <circle
                cx={s.x}
                cy={s.y}
                r={11}
                fill={on > 0.9 ? C.orange : "#E3DCCD"}
              />
            </g>
          );
        })}
        <circle cx={HUB.x} cy={HUB.y} r={17} fill={C.ink} />
        <circle cx={HUB.x} cy={HUB.y} r={7} fill={C.paper} />
      </svg>
      <div>
        <div style={bigNum}>{fmt(count)}</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 600,
            color: C.muted,
            letterSpacing: -0.2,
          }}
        >
          domains
        </div>
      </div>
    </div>
  );
};

/** 5 — Site Audits: crawl bar filling, issues landing on 27. */
const AuditVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [act + 2, act + 28], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const issues = interpolate(frame, [act + 16, act + 30], [0, 27], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const chip = spring({ frame: frame - (act + 16), fps, config: SPRINGS.pop });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: VIS_W }}>
      <div
        style={{
          width: VIS_W,
          height: 18,
          borderRadius: 999,
          background: "#EFEAE2",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${p * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: C.orange,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 700,
            color: C.muted,
            ...tabular,
          }}
        >
          {Math.round(p * 100)}%
        </div>
        <Chip
          label={`${Math.round(issues)} issues`}
          tone="red"
          size={30}
          style={{
            minWidth: 176,
            justifyContent: "center",
            opacity: chip,
            transform: `scale(${0.84 + 0.16 * chip})`,
          }}
        />
      </div>
    </div>
  );
};

/** 6 — AI Visibility: citation dots lighting up, 4 / 10 mentions. */
const LIT_ORDER = [0, 3, 5, 8];
const AiVisual: React.FC<{ act: number }> = ({ act }) => {
  const frame = useCurrentFrame();
  const lit = interpolate(frame, [act + 4, act + 28], [0, 4], clamp);
  const n = Math.min(4, Math.floor(lit + 0.0001));
  const rank = (i: number) => {
    for (let k = 0; k < LIT_ORDER.length; k++) if (LIT_ORDER[k] === i) return k;
    return 99;
  };
  const dots: number[] = [];
  for (let i = 0; i < 10; i++) dots.push(i);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 26px)",
          gap: 18,
        }}
      >
        {dots.map((i) => {
          const on = rank(i) < n;
          return (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: on ? C.orange : "#E3DCCD",
                boxShadow: on ? "0 0 0 6px rgba(37,99,235,0.14)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={bigNum}>{n} / 10</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Workflow card — one component, six identical instances.
// ---------------------------------------------------------------------------

type Workflow = {
  title: string[];
  Visual: React.FC<{ act: number }>;
};

const WORKFLOWS: Workflow[] = [
  { title: ["Keyword", "Research"], Visual: KeywordVisual },
  { title: ["Rank", "Tracking"], Visual: RankVisual },
  { title: ["Competitor", "Insights"], Visual: CompetitorVisual },
  { title: ["Backlinks"], Visual: BacklinkVisual },
  { title: ["Site", "Audits"], Visual: AuditVisual },
  { title: ["AI", "Visibility"], Visual: AiVisual },
];

const WorkflowCard: React.FC<{ index: number; wf: Workflow }> = ({
  index,
  wf,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const act = activateAt(index);

  const enter = spring({
    frame: frame - enterAt(index),
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const live = spring({
    frame: frame - act,
    fps,
    config: { damping: 15, stiffness: 210 },
  });
  const pass = interpolate(frame, [act - 2, act + 3, act + 16], [0, 1, 0], clamp);
  const sweepX = interpolate(frame, [act - 1, act + 20], [-320, CARD_W + 80], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  const { Visual } = wf;

  return (
    <Card
      x={CARD_X}
      y={cardTop(index)}
      w={CARD_W}
      h={CARD_H}
      enter={enter}
      style={{
        overflow: "hidden",
        borderColor:
          live > 0.02
            ? `rgba(37,99,235,${0.16 + 0.34 * live})`
            : C.line,
        boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
        transform: `translateY(${(1 - enter) * 30 - pass * 5}px)`,
      }}
    >
      {/* activation sweep */}
      <div
        style={{
          position: "absolute",
          left: sweepX,
          top: 0,
          width: 320,
          height: CARD_H,
          background:
            "linear-gradient(90deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.16) 50%, rgba(37,99,235,0) 100%)",
          opacity: pass,
        }}
      />

      {/* status dot */}
      <div
        style={{
          position: "absolute",
          left: DOT_X,
          top: CARD_H / 2 - 11,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: live > 0.05 ? C.orange : "#DED7CC",
          boxShadow:
            live > 0.05
              ? `0 0 0 ${Math.round(8 * live)}px rgba(37,99,235,0.14)`
              : "none",
        }}
      />

      {/* product UI label */}
      <div
        style={{
          position: "absolute",
          left: TITLE_X,
          top: 0,
          width: TITLE_W,
          height: CARD_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {wf.title.map((line) => (
          <div
            key={line}
            style={{
              fontFamily: FONT,
              fontSize: 46,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -1.4,
              lineHeight: 1.08,
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* live mini-visual */}
      <div
        style={{
          position: "absolute",
          left: VIS_X,
          top: 0,
          width: VIS_W,
          height: CARD_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Visual act={act} />
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Seventh card — Google Search Console, lands heavier, costs $0.00
// ---------------------------------------------------------------------------

const GscCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - GSC_IN,
    fps,
    config: { damping: 13, stiffness: 120, mass: 1.3 },
  });
  const chip = spring({
    frame: frame - (GSC_IN + 5),
    fps,
    config: SPRINGS.pop,
  });
  const thud = interpolate(frame, [GSC_IN + 6, GSC_IN + 14, GSC_IN + 32], [0, 1, 0], clamp);

  return (
    <>
      {/* landing glow */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X - 640,
          top: GSC_Y + GSC_H / 2 - 640,
          width: 1280,
          height: 1280,
          background: "transparent",
          opacity: 0,
        }}
      />
      <Card
        x={CARD_X}
        y={GSC_Y}
        w={CARD_W}
        h={GSC_H}
        r={30}
        enter={enter}
        style={{
          borderWidth: 2,
          borderColor: `rgba(22,163,74,${0.2 + 0.28 * enter})`,
          boxShadow: "0 16px 34px rgba(25,23,20,0.09)",
          transform: `translateY(${(1 - enter) * 46}px) scale(${1 + 0.02 * thud})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: DOT_X,
            top: GSC_H / 2 - 11,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: C.green,
            boxShadow: `0 0 0 ${Math.round(8 * enter)}px rgba(22,163,74,0.14)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 74,
            top: GSC_H / 2 - 44,
            width: 88,
            height: 88,
            display: "grid",
            placeItems: "center",
          }}
        >
          <LogoImg src={A.logo.gsc} size={82} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 186,
            top: 0,
            width: 340,
            height: GSC_H,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {["Google Search", "Console"].map((line) => (
            <div
              key={line}
              style={{
                fontFamily: FONT,
                fontSize: 46,
                fontWeight: 700,
                color: C.ink,
                letterSpacing: -1.4,
                lineHeight: 1.08,
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 40,
            top: GSC_H / 2 - 40,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Chip
            label="$0.00"
            tone="green"
            size={42}
            style={{
              opacity: chip,
              transform: `scale(${0.8 + 0.2 * chip})`,
              letterSpacing: 0,
            }}
          />
        </div>
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const SeoSixWorkflows: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = useCam(CAM);

  const headIn = spring({ frame: frame - 2, fps, config: SPRINGS.pop });

  // Pulse travelling the spine, leading the camera down.
  const pulseY = interpolate(
    frame,
    [PULSE_START, PULSE_END],
    [SPINE_TOP, SPINE_BOTTOM],
    clamp,
  );
  const pulseOn = frame >= PULSE_START && frame <= PULSE_END + 2;
  const energised = interpolate(
    frame,
    [PULSE_START, PULSE_END],
    [0, 1],
    clamp,
  );

  // Head rings — the tile is already alive when we open on it.
  const ringFade = interpolate(frame, [0, 42, 66], [1, 1, 0.28], clamp);
  const rings: number[] = [0, 1, 2];

  // Terminal node fires as the pulse lands, right before GSC drops in.
  const terminal = spring({
    frame: frame - PULSE_END,
    fps,
    config: SPRINGS.pop,
  });

  return (
    <PaperWorld cam={cam}>
      {/* Spine (behind the cards — reads through the gaps) */}
      <svg
        width={220}
        height={SPINE_BOTTOM + 120}
        viewBox={`0 0 220 ${SPINE_BOTTOM + 120}`}
        style={{ position: "absolute", left: SPINE_X - 110, top: 0 }}
      >
        <line
          x1={110}
          y1={SPINE_TOP}
          x2={110}
          y2={SPINE_BOTTOM}
          stroke="#D9D3CA"
          strokeWidth={5}
        />
        {energised > 0 ? (
          <line
            x1={110}
            y1={SPINE_TOP}
            x2={110}
            y2={SPINE_TOP + energised * (SPINE_BOTTOM - SPINE_TOP)}
            stroke="rgba(37,99,235,0.8)"
            strokeWidth={5}
          />
        ) : null}
        <circle cx={110} cy={SPINE_TOP} r={8} fill="#C6BFB4" />
        <circle
          cx={110}
          cy={SPINE_BOTTOM}
          r={10 + 8 * terminal}
          fill={terminal > 0.05 ? C.green : "#C6BFB4"}
        />
        {pulseOn ? (
          <>
            <circle cx={110} cy={pulseY} r={26} fill="rgba(37,99,235,0.16)" />
            <circle cx={110} cy={pulseY} r={11} fill={C.orange} />
          </>
        ) : null}
      </svg>

      {/* Head — OpenSEO tile, already pulsing when we open on it */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X - 200,
          top: TILE_CY - 200,
          width: 400,
          height: 400,
          opacity: ringFade,
        }}
      >
        <svg width={400} height={400}>
          {rings.map((i) => {
            const phase = ((frame + i * 15) % 45) / 45;
            return (
              <circle
                key={i}
                cx={200}
                cy={200}
                r={88 + phase * 130}
                fill="none"
                stroke={C.orange}
                strokeWidth={3}
                opacity={(1 - phase) * 0.42}
              />
            );
          })}
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: SPINE_X - TILE_SIZE / 2,
          top: TILE_CY - TILE_SIZE / 2,
          opacity: headIn,
          transform: `scale(${0.86 + 0.14 * headIn})`,
        }}
      >
        <OpenSeoMark
          size={TILE_SIZE}
          style={{ boxShadow: "0 20px 44px rgba(25,23,20,0.18)" }}
        />
      </div>

      {/* Six workflows */}
      {WORKFLOWS.map((wf, i) => (
        <WorkflowCard key={wf.title.join(" ")} index={i} wf={wf} />
      ))}

      {/* Seventh — Google Search Console */}
      <GscCard />
    </PaperWorld>
  );
};
