import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 165;

// Promptible white / paper style — Liam orange accent, hand-drawn icon pass
const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  iconBg: "#FFF1EA",
};

type Pt = { x: number; y: number };

const smoothPath = (pts: Pt[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
};

const polylineLength = (pts: Pt[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return l * 1.08;
};

const jitter = (seed: string, amt: number) => (random(seed) - 0.5) * 2 * amt;

const roughLinePts = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: string,
  amt = 2.4,
): Pt[] => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.round(len / 42));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const edge = i === 0 || i === n ? 0.45 : 1;
    pts.push({
      x: x1 + (x2 - x1) * t + jitter(`${seed}-x${i}`, amt * edge),
      y: y1 + (y2 - y1) * t + jitter(`${seed}-y${i}`, amt * edge),
    });
  }
  return pts;
};

const roughRectPts = (
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  amt = 2.4,
): Pt[] => {
  const corners: Pt[] = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ].map((c, i) => ({
    x: c.x + jitter(`${seed}-c${i}x`, amt),
    y: c.y + jitter(`${seed}-c${i}y`, amt),
  }));
  let pts: Pt[] = [];
  for (let s = 0; s < 4; s++) {
    const a = corners[s];
    const b = corners[(s + 1) % 4];
    const side = roughLinePts(a.x, a.y, b.x, b.y, `${seed}-s${s}`, amt);
    pts = pts.concat(s === 0 ? side : side.slice(1));
  }
  pts.push({ x: corners[0].x + 12, y: corners[0].y + jitter(`${seed}-ov`, 2) });
  return pts;
};

const roughEllipsePts = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string,
  amt = 2.4,
  startDeg = -90,
  sweepDeg = 392,
): Pt[] => {
  const n = 36;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((startDeg + (sweepDeg * i) / n) * Math.PI) / 180;
    const jr = jitter(`${seed}-r${i}`, amt);
    pts.push({
      x: cx + (rx + jr) * Math.cos(a),
      y: cy + (ry + jr) * Math.sin(a),
    });
  }
  return pts;
};

const roughCurvePts = (
  a: Pt,
  b: Pt,
  bend: number,
  seed: string,
  amt = 2.4,
): Pt[] => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const cx = mx + px * bend;
  const cy = my + py * bend;
  const n = Math.max(6, Math.round(len / 32));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const edge = i === 0 || i === n ? 0 : 1;
    pts.push({
      x:
        (1 - t) * (1 - t) * a.x +
        2 * (1 - t) * t * cx +
        t * t * b.x +
        jitter(`${seed}-x${i}`, amt * edge),
      y:
        (1 - t) * (1 - t) * a.y +
        2 * (1 - t) * t * cy +
        t * t * b.y +
        jitter(`${seed}-y${i}`, amt * edge),
    });
  }
  return pts;
};

const RoughStroke: React.FC<{
  pts: Pt[];
  progress: number;
  stroke: string;
  sw: number;
  opacity?: number;
  fill?: string;
}> = ({ pts, progress, stroke, sw, opacity = 1, fill = "none" }) => {
  if (progress <= 0) return null;
  const d = smoothPath(pts);
  const len = polylineLength(pts);
  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={sw}
      fill={fill}
      opacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={progress >= 1 ? undefined : len}
      strokeDashoffset={progress >= 1 ? undefined : len * (1 - progress)}
    />
  );
};

// ---- layout ----------------------------------------------------------------
const CARD = { x: 390, y: 380, w: 300, h: 380 };
const PLAY = { cx: 540, cy: 505, r: 46 };
const DIVIDER_Y = 640;

const CHIP_W = 310;
const CHIP_H = 96;

const CHIPS = [
  {
    key: "creative",
    label: "New creative",
    icon: "image" as const,
    cx: 260,
    cy: 225,
    pop: 36,
    arrowFrom: { x: 305, y: 285 },
    arrowTo: { x: 445, y: 412 },
    bend: 36,
    hit: 54,
    arrowStart: 40,
    arrowEnd: 56,
  },
  {
    key: "targeting",
    label: "New targeting",
    icon: "target" as const,
    cx: 820,
    cy: 225,
    pop: 66,
    arrowFrom: { x: 775, y: 285 },
    arrowTo: { x: 635, y: 412 },
    bend: -36,
    hit: 84,
    arrowStart: 70,
    arrowEnd: 86,
  },
  {
    key: "budget",
    label: "More budget",
    icon: "coin" as const,
    cx: 540,
    cy: 935,
    pop: 96,
    arrowFrom: { x: 620, y: 880 },
    arrowTo: { x: 596, y: 792 },
    bend: 42,
    hit: 114,
    arrowStart: 100,
    arrowEnd: 116,
  },
];

const ChipIcon: React.FC<{
  type: "image" | "target" | "coin";
  boil: string;
}> = ({ type, boil }) => {
  const s = COLORS.ink;
  const common = {
    fill: "none",
    stroke: s,
    strokeWidth: 2.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const j = (k: string) => jitter(`${boil}-icon-${type}-${k}`, 0.7);
  switch (type) {
    case "image":
      return (
        <g {...common}>
          <rect
            x={3.5 + j("a")}
            y={4.5 + j("b")}
            width={17}
            height={15}
            rx={2.5}
          />
          <circle
            cx={9 + j("c")}
            cy={9.5 + j("d")}
            r={1.6}
            fill={s}
            stroke="none"
          />
          <path d={`M4.5 16.5l4.5-4.5 3.5 3.5 3-3 4.5 4.5`} />
        </g>
      );
    case "target":
      return (
        <g {...common}>
          <circle cx={12 + j("a")} cy={12 + j("b")} r={9} />
          <circle cx={12 + j("c")} cy={12 + j("d")} r={4.5} />
          <circle cx={12} cy={12} r={1} fill={s} stroke="none" />
        </g>
      );
    case "coin":
      return (
        <g {...common}>
          <circle cx={12 + j("a")} cy={12 + j("b")} r={9} />
          <text
            x={12}
            y={13.2}
            fontFamily={inter}
            fontWeight={700}
            fontSize={12}
            fill={COLORS.orange}
            stroke="none"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            $
          </text>
        </g>
      );
    default:
      return null;
  }
};

export const ThreeWrongFixes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boil = `b${Math.floor(frame / 5) % 3}`;

  const ease = Easing.bezier(0.33, 1, 0.68, 1);
  const prog = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  // mini ad card draw
  const pBorder = prog(2, 24);
  const pDivider = prog(14, 24);
  const pPlayCircle = prog(18, 29);
  const pPlayTri = prog(23, 31);
  const pSquig = prog(26, 35);
  const pCta = prog(30, 41);

  // card wobble on each arrow hit
  let cardRot = 0;
  for (const chip of CHIPS) {
    const t = frame - chip.hit;
    if (t >= 0 && t < 22) {
      cardRot += Math.sin(t * 0.72) * 2.6 * Math.exp(-t / 6.5);
    }
  }

  const chipSpring = (pop: number) =>
    spring({
      frame: Math.max(0, frame - pop),
      fps,
      config: { damping: 13, stiffness: 175 },
    });

  // coins tossed on the budget beat
  const coins = [
    {
      start: 102,
      from: { x: 460, y: 900 },
      to: { x: 505, y: 745 },
      bend: -60,
      seed: "tc1",
    },
    {
      start: 106,
      from: { x: 540, y: 905 },
      to: { x: 545, y: 755 },
      bend: 40,
      seed: "tc2",
    },
    {
      start: 110,
      from: { x: 610, y: 900 },
      to: { x: 575, y: 748 },
      bend: 70,
      seed: "tc3",
    },
  ];

  const glow = 0.05 + Math.sin(frame * 0.05) * 0.012;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily: inter }}>
      {/* paper grid — full bleed */}
      <AbsoluteFill>
        <svg width={1080} height={1080} viewBox="0 0 1080 1080">
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 120}
              y1={0}
              x2={i * 120}
              y2={1080}
              stroke={COLORS.line}
              strokeWidth={1.4}
              opacity={0.6}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 120}
              x2={1080}
              y2={i * 120}
              stroke={COLORS.line}
              strokeWidth={1.4}
              opacity={0.6}
            />
          ))}
        </svg>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(560px 520px at 50% 52%, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
        }}
      />

      <svg
        width={1080}
        height={1080}
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* mini ad card (wobbles when things get thrown at it) */}
        <g
          transform={`translate(540 570) rotate(${cardRot}) translate(-540 -570)`}
        >
          <rect
            x={CARD.x + 5}
            y={CARD.y + 5}
            width={CARD.w - 10}
            height={CARD.h - 10}
            rx={14}
            fill={COLORS.card}
            opacity={interpolate(pBorder, [0, 1], [0, 0.92])}
          />
          <RoughStroke
            pts={roughRectPts(
              CARD.x,
              CARD.y,
              CARD.w,
              CARD.h,
              `card-${boil}`,
              2.6,
            )}
            progress={pBorder}
            stroke={COLORS.ink}
            sw={4}
          />
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 14,
              DIVIDER_Y,
              CARD.x + CARD.w - 14,
              DIVIDER_Y,
              `div-${boil}`,
              2,
            )}
            progress={pDivider}
            stroke={COLORS.ink}
            sw={2.6}
            opacity={0.55}
          />
          <RoughStroke
            pts={roughEllipsePts(
              PLAY.cx,
              PLAY.cy,
              PLAY.r,
              PLAY.r,
              `play-${boil}`,
              2,
            )}
            progress={pPlayCircle}
            stroke={COLORS.ink}
            sw={3.6}
          />
          <RoughStroke
            pts={[
              ...roughLinePts(
                PLAY.cx - 13,
                PLAY.cy - 20,
                PLAY.cx + 20,
                PLAY.cy,
                `tri1-${boil}`,
                1.2,
              ),
              ...roughLinePts(
                PLAY.cx + 20,
                PLAY.cy,
                PLAY.cx - 13,
                PLAY.cy + 20,
                `tri2-${boil}`,
                1.2,
              ).slice(1),
              ...roughLinePts(
                PLAY.cx - 13,
                PLAY.cy + 20,
                PLAY.cx - 13,
                PLAY.cy - 20,
                `tri3-${boil}`,
                1.2,
              ).slice(1),
            ]}
            progress={pPlayTri}
            stroke={COLORS.orange}
            sw={3.6}
          />
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 30,
              672,
              CARD.x + CARD.w - 30,
              672,
              `sq1-${boil}`,
              2.4,
            )}
            progress={pSquig}
            stroke={COLORS.muted}
            sw={5}
            opacity={0.5}
          />
          <RoughStroke
            pts={roughRectPts(465, 698, 150, 44, `cta-${boil}`, 1.8)}
            progress={pCta}
            stroke={COLORS.orange}
            sw={3}
          />
          <RoughStroke
            pts={roughLinePts(492, 720, 588, 720, `ctasq-${boil}`, 1.6)}
            progress={pCta}
            stroke={COLORS.orange}
            sw={4}
            opacity={0.7}
          />
        </g>

        {/* chips + arrows */}
        {CHIPS.map((chip) => {
          const s = chipSpring(chip.pop);
          if (s <= 0.001) return null;
          const x0 = chip.cx - CHIP_W / 2;
          const y0 = chip.cy - CHIP_H / 2;
          // gentle idle bob after landing
          const bob =
            frame > chip.pop + 20
              ? Math.sin((frame - chip.pop) * 0.09 + chip.cx) * 2.2
              : 0;
          const aProg = prog(chip.arrowStart, chip.arrowEnd);
          const arrowPts = roughCurvePts(
            chip.arrowFrom,
            chip.arrowTo,
            chip.bend,
            `arrow-${chip.key}-${boil}`,
          );
          // arrowhead direction from the last curve segment
          const pA = arrowPts[arrowPts.length - 2];
          const pB = arrowPts[arrowPts.length - 1];
          const ang = Math.atan2(pB.y - pA.y, pB.x - pA.x);
          const headLen = 20;
          const head = (rot: number): Pt => ({
            x: pB.x - headLen * Math.cos(ang + rot),
            y: pB.y - headLen * Math.sin(ang + rot),
          });
          return (
            <g key={chip.key}>
              <g
                opacity={Math.min(s, 1)}
                transform={`translate(${chip.cx} ${chip.cy + bob}) scale(${0.6 + s * 0.4}) translate(${-chip.cx} ${-chip.cy})`}
              >
                <rect
                  x={x0 + 4}
                  y={y0 + 4}
                  width={CHIP_W - 8}
                  height={CHIP_H - 8}
                  rx={16}
                  fill={COLORS.card}
                  opacity={0.94}
                />
                <RoughStroke
                  pts={roughRectPts(
                    x0,
                    y0,
                    CHIP_W,
                    CHIP_H,
                    `chip-${chip.key}-${boil}`,
                    2.2,
                  )}
                  progress={1}
                  stroke={COLORS.ink}
                  sw={3.2}
                />
                <g
                  transform={`translate(${x0 + 24} ${chip.cy - 21}) scale(1.75)`}
                >
                  <ChipIcon type={chip.icon} boil={boil} />
                </g>
                <text
                  x={x0 + 76}
                  y={chip.cy + 1}
                  fontFamily={inter}
                  fontWeight={600}
                  fontSize={32}
                  fill={COLORS.ink}
                  dominantBaseline="middle"
                >
                  {chip.label}
                </text>
              </g>
              {/* thrown-at-the-ad arrow */}
              <RoughStroke
                pts={arrowPts}
                progress={aProg}
                stroke={COLORS.orange}
                sw={5.5}
                opacity={0.95}
              />
              {aProg > 0.92 ? (
                <g>
                  <RoughStroke
                    pts={roughLinePts(
                      head(0.5).x,
                      head(0.5).y,
                      pB.x,
                      pB.y,
                      `ah1-${chip.key}-${boil}`,
                      1,
                    )}
                    progress={1}
                    stroke={COLORS.orange}
                    sw={5.5}
                  />
                  <RoughStroke
                    pts={roughLinePts(
                      head(-0.5).x,
                      head(-0.5).y,
                      pB.x,
                      pB.y,
                      `ah2-${chip.key}-${boil}`,
                      1,
                    )}
                    progress={1}
                    stroke={COLORS.orange}
                    sw={5.5}
                  />
                </g>
              ) : null}
            </g>
          );
        })}

        {/* coins tossed with the budget beat */}
        {coins.map((coin) => {
          const t = frame - coin.start;
          const dur = 14;
          if (t < 0 || t > dur + 4) return null;
          const p = Math.min(1, t / dur);
          const mx = (coin.from.x + coin.to.x) / 2;
          const my = (coin.from.y + coin.to.y) / 2;
          const dx = coin.to.x - coin.from.x;
          const dy = coin.to.y - coin.from.y;
          const len = Math.hypot(dx, dy) || 1;
          const cxp =
            (1 - p) * (1 - p) * coin.from.x +
            2 * (1 - p) * p * (mx + (-dy / len) * coin.bend) +
            p * p * coin.to.x;
          const cyp =
            (1 - p) * (1 - p) * coin.from.y +
            2 * (1 - p) * p * (my + (dx / len) * coin.bend) +
            p * p * coin.to.y;
          const op = interpolate(t, [0, 3, dur, dur + 4], [0, 1, 1, 0]);
          const rot = t * (8 + random(coin.seed) * 8);
          return (
            <g
              key={coin.seed}
              opacity={op}
              transform={`translate(${cxp} ${cyp}) rotate(${rot})`}
            >
              <circle
                r={17}
                fill={COLORS.iconBg}
                stroke={COLORS.ink}
                strokeWidth={2.6}
              />
              <text
                fontFamily={inter}
                fontWeight={700}
                fontSize={19}
                fill={COLORS.orange}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                $
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
