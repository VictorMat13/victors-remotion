/**
 * ScrUseCases — beat 6 of the Scrapy series (PAPER + TEAL, 1080×1080).
 *
 * The ScrapyMark feeds four mini data-product cards in a 2×2 grid —
 * structure continues the approved OpenSEO four-card diagram (seo-hook-03),
 * teal connectors instead of blue. Every use case is identified purely by a
 * micro-UI vignette: bars+magnifier / name-email table / price line /
 * watched page thumbs. VO carries the words; the ONLY words on the cards
 * are the genuine field names `name` / `email` (MONO).
 *
 *   f0–25    lockup pill settles top-center (camera tight)
 *   f25–55   teal connector tree draws down/out; cards pop 7f apart
 *   f55–160  each card's micro-content animates in sequence, one at a time
 *   f160–200 packets pulse down both connector columns; clean wide hold
 */
import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  EASE,
  MONO,
  PaperWorld,
  SPRINGS,
  ScrapyLockup,
  TEAL,
  TEAL_SOFT,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 200;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** 0→1→0 triangle pulse. */
const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], clamp);

const useSpringAt = (
  at: number,
  config: { damping: number; stiffness: number; mass?: number },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

// ---------------------------------------------------------------------------
// World geometry — everything sized so content stays inside the 5% side
// margins even at the z=1.05 framings: at z 1.05 the safe world span is
// x = 77 … 1003, so the grid uses 446px cards at x 77 / 555.
// ---------------------------------------------------------------------------

const CARD_W = 446;
const CARD_H = 300;
const COL_X = [77, 555]; // card lefts
const COL_C = [300, 778]; // column centers
const ROW_Y = [350, 690];

const PILL = { cx: 540, top: 64, h: 98 };
const JUNCTION = { x: 540, y: 262 };

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const T = {
  lockup: 4,
  trunk: 26, // 8f draw
  node: 33,
  arms: 34, // 12f draw
  stubs: 44, // 8f draw
  cards: [40, 47, 54, 61],
  // card beats, one at a time
  bars: [62, 67, 72, 77],
  scan: 62,
  rows: [88, 96, 104],
  line: 124, // 22f draw
  dots: [124, 130, 136, 146],
  arc: 146, // → 160
  arcDone: 160,
  // payoff packets
  packetL: 162,
  packetR: 166,
};

// packet leg arrival → card ticks
const TICKS = [
  T.packetL + 13, // top-left
  T.packetR + 13, // top-right
  T.packetL + 18, // bottom-left
  T.packetR + 18, // bottom-right
];

// ---------------------------------------------------------------------------
// Lockup pill — ScrapyMark + teal wordmark, top-center
// ---------------------------------------------------------------------------

const LockupPill: React.FC = () => {
  const e = useSpringAt(T.lockup, { damping: 14, stiffness: 160 });
  return (
    <div
      style={{
        position: "absolute",
        left: PILL.cx,
        top: PILL.top,
        borderRadius: 999,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 16px 38px rgba(25,23,20,0.08)",
        padding: "20px 36px",
        opacity: e,
        transform: `translateX(-50%) translateY(${(1 - e) * 30}px) scale(${
          0.9 + 0.1 * e
        })`,
      }}
    >
      <ScrapyLockup size={58} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Connector tree — trunk → junction node → elbowed arms → gap stubs
// ---------------------------------------------------------------------------

const ARM_D = [
  `M 540 262 L 316 262 Q 300 262 300 278 L 300 346`,
  `M 540 262 L 762 262 Q 778 262 778 278 L 778 346`,
];

const Connectors: React.FC = () => {
  const frame = useCurrentFrame();
  const trunk = interpolate(frame, [T.trunk, T.trunk + 8], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const node = useSpringAt(T.node, SPRINGS.pop);
  const stubs = interpolate(frame, [T.stubs, T.stubs + 8], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  return (
    <svg
      width={1080}
      height={1080}
      viewBox="0 0 1080 1080"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {/* trunk from pill bottom to junction */}
      {trunk > 0 ? (
        <line
          x1={540}
          y1={166}
          x2={540}
          y2={166 + trunk * (250 - 166)}
          stroke={TEAL}
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      ) : null}
      {/* elbowed arms into the two columns */}
      {ARM_D.map((d, i) => {
        const draw = interpolate(frame, [T.arms, T.arms + 12], [0, 1], {
          easing: EASE,
          ...clamp,
        });
        return draw > 0 ? (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={TEAL}
            strokeWidth={4.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        ) : null;
      })}
      {/* pass-through stubs between the rows */}
      {stubs > 0
        ? COL_C.map((x) => (
            <line
              key={x}
              x1={x}
              y1={654}
              x2={x}
              y2={654 + stubs * (686 - 654)}
              stroke={TEAL}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          ))
        : null}
      {/* junction node */}
      {node > 0.01 ? (
        <circle
          cx={JUNCTION.x}
          cy={JUNCTION.y}
          r={10 * (0.5 + 0.5 * node)}
          fill={C.card}
          stroke={TEAL}
          strokeWidth={4}
          opacity={node}
        />
      ) : null}
    </svg>
  );
};

/** Payoff packet: travels pill → junction → arm → into the top card, then a
 *  short echo runs the gap stub into the bottom card. */
const Packet: React.FC<{ colX: number; start: number }> = ({ colX, start }) => {
  const frame = useCurrentFrame();
  const keys = [start, start + 3, start + 10, start + 13];
  const x = interpolate(frame, keys, [540, 540, colX, colX], clamp);
  const y = interpolate(frame, keys, [172, 262, 262, 344], clamp);
  const o =
    interpolate(frame, [start, start + 2], [0, 1], clamp) *
    interpolate(frame, [start + 12, start + 14], [1, 0], clamp);
  const stubY = interpolate(
    frame,
    [start + 15, start + 18],
    [654, 684],
    clamp,
  );
  const so =
    interpolate(frame, [start + 15, start + 16], [0, 1], clamp) *
    interpolate(frame, [start + 17, start + 19], [1, 0], clamp);
  if (frame < start) return null;
  return (
    <svg
      width={1080}
      height={1080}
      viewBox="0 0 1080 1080"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {o > 0 ? (
        <>
          <circle cx={x} cy={y} r={18} fill={TEAL_SOFT} opacity={o} />
          <circle cx={x} cy={y} r={8.5} fill={TEAL} opacity={o} />
        </>
      ) : null}
      {so > 0 ? (
        <>
          <circle cx={colX} cy={stubY} r={15} fill={TEAL_SOFT} opacity={so} />
          <circle cx={colX} cy={stubY} r={7.5} fill={TEAL} opacity={so} />
        </>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Card shell — kit Card + packet-arrival tick (teal border flash + tiny thud)
// ---------------------------------------------------------------------------

const UseCard: React.FC<{
  col: number;
  row: number;
  popAt: number;
  tickAt: number;
  children: React.ReactNode;
}> = ({ col, row, popAt, tickAt, children }) => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(popAt, SPRINGS.pop);
  const tick = tri(frame, tickAt, 3, 8);
  return (
    <Card
      x={COL_X[col]}
      y={ROW_Y[row]}
      w={CARD_W}
      h={CARD_H}
      enter={enter}
      style={{
        transform: `translateY(${(1 - enter) * 26}px) scale(${
          1 + tick * 0.008
        })`,
      }}
    >
      {children}
      {/* tick overlay — accent through the border only, no glow */}
      {tick > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: -1.5,
            borderRadius: 26,
            border: `1.5px solid ${TEAL}`,
            opacity: tick * 0.85,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Vignette 1 — mini bar chart + magnifier glyph (bars grow in)
// ---------------------------------------------------------------------------

const BAR_H = [86, 140, 112, 168];
const BAR_X = [64, 152, 240, 328];

const ResearchVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scan = interpolate(
    frame,
    [T.scan, T.scan + 10, T.scan + 20, T.scan + 28],
    [0, -9, 4, 0],
    { easing: EASE, ...clamp },
  );
  return (
    <>
      {/* faint gridlines + baseline — scaffold, present from pop */}
      {[120, 175].map((y) => (
        <div
          key={y}
          style={{
            position: "absolute",
            left: 44,
            top: y,
            width: 358,
            height: 1.5,
            background: C.lineSoft,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 246,
          width: 358,
          height: 1.5,
          background: C.line,
        }}
      />
      {/* bars grow staggered */}
      {BAR_H.map((h, i) => {
        const s = spring({
          frame: frame - T.bars[i],
          fps,
          config: SPRINGS.pop,
        });
        const hh = Math.max(0, h * s);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: BAR_X[i],
              top: 246 - hh,
              width: 54,
              height: hh,
              borderRadius: "12px 12px 4px 4px",
              background: i === 3 ? TEAL : "rgba(21,184,166,0.32)",
            }}
          />
        );
      })}
      {/* magnifier glyph — identity from pop, small scan tilt during the beat */}
      <svg
        width={110}
        height={110}
        viewBox="0 0 110 110"
        style={{
          position: "absolute",
          left: 44,
          top: 34,
          transform: `rotate(${scan}deg)`,
          transformOrigin: "48px 48px",
        }}
      >
        <circle
          cx={48}
          cy={48}
          r={27}
          fill={TEAL_SOFT}
          stroke={C.ink}
          strokeWidth={5}
        />
        <line
          x1={68}
          y1={68}
          x2={92}
          y2={92}
          stroke={C.ink}
          strokeWidth={7}
          strokeLinecap="round"
        />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Vignette 2 — mini table, `name` / `email` headers, rows appending
// ---------------------------------------------------------------------------

const ROW_TOPS = [108, 156, 204];
const NAME_W = [104, 122, 96];
const EMAIL_W = [168, 148, 178];

const LeadsVignette: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {/* header — the ONLY words allowed on the cards */}
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 40,
          fontFamily: MONO,
          fontSize: 27,
          fontWeight: 500,
          color: C.muted,
          letterSpacing: 0.5,
        }}
      >
        name
      </div>
      <div
        style={{
          position: "absolute",
          left: 214,
          top: 40,
          fontFamily: MONO,
          fontSize: 27,
          fontWeight: 500,
          color: C.muted,
          letterSpacing: 0.5,
        }}
      >
        email
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 86,
          width: 366,
          height: 1.5,
          background: C.line,
        }}
      />
      {/* faint row guides — the table structure exists before rows land */}
      {[133, 181, 229].map((y) => (
        <div
          key={y}
          style={{
            position: "absolute",
            left: 40,
            top: y,
            width: 366,
            height: 1.5,
            background: C.lineSoft,
          }}
        />
      ))}
      {/* skeleton rows append one at a time */}
      {ROW_TOPS.map((top, i) => {
        const p = interpolate(frame, [T.rows[i], T.rows[i] + 8], [0, 1], {
          easing: EASE,
          ...clamp,
        });
        if (p <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 44,
              top,
              width: 362,
              height: 24,
              opacity: p,
              transform: `translateX(${(1 - p) * -12}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 8,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: TEAL,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 3,
                width: NAME_W[i],
                height: 18,
                borderRadius: 9,
                background: "#EDE8E1",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 170,
                top: 3,
                width: EMAIL_W[i],
                height: 18,
                borderRadius: 9,
                background: "#E7E1D8",
              }}
            />
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Vignette 3 — line chart drawing left→right, dip-then-recover, 4 dots
// ---------------------------------------------------------------------------

const PRICE_D =
  "M 48 158 C 84 138, 114 118, 150 120 C 196 123, 214 196, 248 206 C 292 219, 352 132, 400 86";
const PRICE_PTS = [
  { x: 48, y: 158 },
  { x: 150, y: 120 },
  { x: 248, y: 206 },
  { x: 400, y: 86 },
];

const PriceVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [T.line, T.line + 22], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const waiting = frame < T.line;
  const pulse = 14 + 4 * Math.sin(frame / 5);
  return (
    <>
      {/* gridlines — scaffold from pop */}
      {[96, 152, 208].map((y) => (
        <div
          key={y}
          style={{
            position: "absolute",
            left: 40,
            top: y,
            width: 366,
            height: 1.5,
            background: C.lineSoft,
          }}
        />
      ))}
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* muted flat reference line at the start level (as in the approved
            rank-tracking card) — the teal trend draws over it */}
        <line
          x1={48}
          y1={158}
          x2={400}
          y2={158}
          stroke="#D9D3CA"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* armed start point pulses until the beat */}
        {waiting ? (
          <circle
            cx={PRICE_PTS[0].x}
            cy={PRICE_PTS[0].y}
            r={pulse}
            fill={TEAL_SOFT}
          />
        ) : null}
        {waiting ? (
          <circle
            cx={PRICE_PTS[0].x}
            cy={PRICE_PTS[0].y}
            r={7}
            fill={TEAL}
          />
        ) : null}
        {draw > 0 ? (
          <path
            d={PRICE_D}
            fill="none"
            stroke={TEAL}
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        ) : null}
        {PRICE_PTS.map((p, i) => {
          const pop = spring({
            frame: frame - T.dots[i],
            fps,
            config: SPRINGS.pop,
          });
          if (pop <= 0.01) return null;
          const last = i === PRICE_PTS.length - 1;
          return (
            <g key={i} opacity={pop}>
              {last ? (
                <circle cx={p.x} cy={p.y} r={20 * pop} fill={TEAL_SOFT} />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={(last ? 10 : 9) * (0.5 + 0.5 * pop)}
                fill={last ? TEAL : C.card}
                stroke={TEAL}
                strokeWidth={4}
              />
            </g>
          );
        })}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Vignette 4 — two overlapping page thumbs + eye badge + refresh arc
// ---------------------------------------------------------------------------

const PageThumb: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  bob?: number;
}> = ({ x, y, w, h, rot, bob = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 12,
      background: C.card,
      border: `1.5px solid ${C.line}`,
      boxShadow: "0 10px 26px rgba(25,23,20,0.10)",
      transform: `rotate(${rot}deg) translateY(${bob}px)`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: w * 0.09,
        top: h * 0.06,
        width: w * 0.46,
        height: 10,
        borderRadius: 5,
        background: "#E5DED3",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: w * 0.09,
        top: h * 0.16,
        width: w * 0.82,
        height: h * 0.34,
        borderRadius: 8,
        background: "#F3F0EA",
        border: `1.5px solid ${C.lineSoft}`,
      }}
    />
    {[0.58, 0.68, 0.78].map((f, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: w * 0.09,
          top: h * f,
          width: w * (0.82 - i * 0.14),
          height: 8,
          borderRadius: 4,
          background: "#EDE8E1",
        }}
      />
    ))}
  </div>
);

const EYE = { cx: 346, cy: 150 };
const ARC_R = 47;
// arc sweeps 300° clockwise from the top; end point + tangent at θ = 210°
const ARC_END = {
  x: EYE.cx + ARC_R * Math.cos((210 * Math.PI) / 180),
  y: EYE.cy + ARC_R * Math.sin((210 * Math.PI) / 180),
};

const WatchVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 11) * 2;
  const p = interpolate(frame, [T.arc, T.arcDone], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const arrow = interpolate(frame, [T.arcDone - 3, T.arcDone + 2], [0, 1], clamp);
  const donePulse = tri(frame, T.arcDone, 4, 10);
  return (
    <>
      <PageThumb x={46} y={44} w={158} h={196} rot={-5} />
      <PageThumb x={128} y={60} w={170} h={206} rot={3} bob={bob} />
      {/* eye badge */}
      <div
        style={{
          position: "absolute",
          left: EYE.cx - 34,
          top: EYE.cy - 34,
          width: 68,
          height: 68,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 10px 26px rgba(25,23,20,0.12)",
          transform: `scale(${1 + donePulse * 0.06})`,
        }}
      />
      <svg
        width={CARD_W}
        height={CARD_H}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <path
          d={`M ${EYE.cx - 20} ${EYE.cy} Q ${EYE.cx} ${EYE.cy - 16} ${
            EYE.cx + 20
          } ${EYE.cy} Q ${EYE.cx} ${EYE.cy + 16} ${EYE.cx - 20} ${EYE.cy}`}
          fill="none"
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <circle cx={EYE.cx} cy={EYE.cy} r={7.5} fill={TEAL} />
        {/* refresh arc completing around the badge */}
        {p > 0 ? (
          <circle
            cx={EYE.cx}
            cy={EYE.cy}
            r={ARC_R}
            fill="none"
            stroke={TEAL}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${0.833 * p} 1`}
            transform={`rotate(-90 ${EYE.cx} ${EYE.cy})`}
          />
        ) : null}
        {arrow > 0 ? (
          <path
            d="M 0 -8 L 13 0 L 0 8 Z"
            fill={TEAL}
            transform={`translate(${ARC_END.x} ${ARC_END.y}) rotate(-60) scale(${
              0.5 + 0.5 * arrow
            })`}
            opacity={arrow}
          />
        ) : null}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const ScrUseCases: React.FC = () => {
  // Tight on the lockup → pull wide as the tree grows → gentle drift to the
  // bottom row for beats 3–4 → settle full-wide; two near-identical end keys.
  const cam = useCam({
    keys: [0, 22, 40, 108, 122, 160, 174, 190, 200],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [150, 150, 486, 486, 568, 568, 527, 527, 527],
    z: [1.38, 1.38, 1.05, 1.05, 1.05, 1.05, 1.0, 1.0, 1.001],
  });

  return (
    <PaperWorld cam={cam}>
      <Connectors />
      <Packet colX={COL_C[0]} start={T.packetL} />
      <Packet colX={COL_C[1]} start={T.packetR} />

      <UseCard col={0} row={0} popAt={T.cards[0]} tickAt={TICKS[0]}>
        <ResearchVignette />
      </UseCard>
      <UseCard col={1} row={0} popAt={T.cards[1]} tickAt={TICKS[1]}>
        <LeadsVignette />
      </UseCard>
      <UseCard col={0} row={1} popAt={T.cards[2]} tickAt={TICKS[2]}>
        <PriceVignette />
      </UseCard>
      <UseCard col={1} row={1} popAt={T.cards[3]} tickAt={TICKS[3]}>
        <WatchVignette />
      </UseCard>

      <LockupPill />
    </PaperWorld>
  );
};
