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

export const DURATION_IN_FRAMES = 172;

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
const CARD = { x: 390, y: 330, w: 300, h: 380 };
const PLAY = { cx: 540, cy: 455, r: 46 };
const DIVIDER_Y = 590;

const MINI_CHIPS = [
  { key: "creative", label: "new creative", cx: 250 },
  { key: "targeting", label: "new targeting", cx: 540 },
  { key: "budget", label: "more budget", cx: 830 },
];
const MINI_W = 252;
const MINI_H = 66;
const MINI_Y = 920;

export const FindProblemFirst: React.FC = () => {
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

  // ad card draw
  const pBorder = prog(2, 24);
  const pDivider = prog(14, 24);
  const pPlayCircle = prog(18, 29);
  const pPlayTri = prog(23, 31);
  const pSquig = prog(26, 35);
  const pCta = prog(30, 41);

  // ---- magnifying glass ----
  const glassIn = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const scanEase = Easing.bezier(0.45, 0, 0.55, 1);
  const gx = interpolate(frame, [26, 44, 60, 74], [452, 636, 482, PLAY.cx], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: scanEase,
  });
  const gy = interpolate(frame, [26, 44, 60, 74], [400, 424, 508, PLAY.cy], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: scanEase,
  });
  // wobble while scanning, settles on lock
  const wobble =
    frame < 74
      ? Math.sin(frame * 0.5) * 5
      : Math.sin(frame * 0.5) * 5 * Math.exp(-(frame - 74) / 5);
  // lock pop
  const lockPop = spring({
    frame: Math.max(0, frame - 74),
    fps,
    config: { damping: 11, stiffness: 220 },
  });
  const glassScale =
    (0.5 + glassIn * 0.5) *
    (frame >= 74 ? 1 + (1 - Math.abs(1 - lockPop)) * 0.1 : 1);
  // gentle bob after lock
  const glassBob = frame > 90 ? Math.sin((frame - 90) * 0.12) * 3 : 0;

  // problem circle + tag
  const foundProg = prog(76, 94);
  const tagS = spring({
    frame: Math.max(0, frame - 96),
    fps,
    config: { damping: 12, stiffness: 190 },
  });
  const circlePulse =
    foundProg >= 1 ? 1 + Math.sin((frame - 94) * 0.22) * 0.01 : 1;

  // ---- mini chips (random changes, dismissed) ----
  const miniSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - (108 + i * 5)),
      fps,
      config: { damping: 15, stiffness: 170 },
    });
  const strikeProg = prog(128, 146);
  const miniFade = interpolate(frame, [136, 150], [1, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          background: `radial-gradient(560px 520px at 50% 46%, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
        }}
      />

      <svg
        width={1080}
        height={1080}
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* ad card */}
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
            622,
            CARD.x + CARD.w - 30,
            622,
            `sq1-${boil}`,
            2.4,
          )}
          progress={pSquig}
          stroke={COLORS.muted}
          sw={5}
          opacity={0.5}
        />
        <RoughStroke
          pts={roughRectPts(465, 648, 150, 44, `cta-${boil}`, 1.8)}
          progress={pCta}
          stroke={COLORS.orange}
          sw={3}
        />
        <RoughStroke
          pts={roughLinePts(492, 670, 588, 670, `ctasq-${boil}`, 1.6)}
          progress={pCta}
          stroke={COLORS.orange}
          sw={4}
          opacity={0.7}
        />

        {/* problem found circle around the hook */}
        {foundProg > 0 ? (
          <g
            transform={`translate(${PLAY.cx} ${PLAY.cy}) scale(${circlePulse}) translate(${-PLAY.cx} ${-PLAY.cy})`}
          >
            <RoughStroke
              pts={roughEllipsePts(
                PLAY.cx,
                PLAY.cy,
                84,
                78,
                `found-${boil}`,
                3,
                -70,
                400,
              )}
              progress={foundProg}
              stroke={COLORS.orange}
              sw={6.5}
              opacity={0.95}
            />
          </g>
        ) : null}

        {/* magnifying glass */}
        {frame >= 22 ? (
          <g
            opacity={Math.min(1, glassIn * 1.3)}
            transform={`translate(${gx} ${gy + glassBob}) rotate(${wobble}) scale(${glassScale})`}
          >
            {/* lens */}
            <RoughStroke
              pts={roughEllipsePts(0, 0, 92, 92, `lens-${boil}`, 2.6)}
              progress={1}
              stroke={COLORS.ink}
              sw={7}
            />
            {/* subtle lens tint */}
            <circle r={86} fill={COLORS.iconBg} opacity={0.16} />
            {/* shine */}
            <RoughStroke
              pts={roughEllipsePts(
                -30,
                -32,
                34,
                34,
                `shine-${boil}`,
                1.6,
                150,
                80,
              )}
              progress={1}
              stroke={COLORS.muted}
              sw={4}
              opacity={0.6}
            />
            {/* handle */}
            <RoughStroke
              pts={roughLinePts(66, 66, 138, 138, `handle-${boil}`, 2)}
              progress={1}
              stroke={COLORS.ink}
              sw={16}
            />
          </g>
        ) : null}

        {/* mini "random changes" chips, struck through */}
        {MINI_CHIPS.map((chip, i) => {
          const s = miniSpring(i);
          if (s <= 0.001) return null;
          const x0 = chip.cx - MINI_W / 2;
          const y0 = MINI_Y - MINI_H / 2;
          return (
            <g
              key={chip.key}
              opacity={Math.min(s, 1) * miniFade}
              transform={`translate(0 ${(1 - s) * 34})`}
            >
              <rect
                x={x0 + 3}
                y={y0 + 3}
                width={MINI_W - 6}
                height={MINI_H - 6}
                rx={13}
                fill={COLORS.card}
                opacity={0.94}
              />
              <RoughStroke
                pts={roughRectPts(
                  x0,
                  y0,
                  MINI_W,
                  MINI_H,
                  `mini-${chip.key}-${boil}`,
                  2,
                )}
                progress={1}
                stroke={COLORS.ink}
                sw={2.8}
              />
              <text
                x={chip.cx}
                y={MINI_Y + 1}
                fontFamily={inter}
                fontWeight={600}
                fontSize={27}
                fill={COLORS.ink}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {chip.label}
              </text>
            </g>
          );
        })}
        {/* one long scribble strike-through across all three */}
        <RoughStroke
          pts={roughLinePts(
            118,
            MINI_Y - 4,
            962,
            MINI_Y + 6,
            `strike-${boil}`,
            5,
          )}
          progress={strikeProg}
          stroke={COLORS.orangeDeep}
          sw={7}
          opacity={0.9}
        />
      </svg>

      {/* problem found tag */}
      {frame >= 96 ? (
        <div
          style={{
            position: "absolute",
            left: 660,
            top: 330,
            transform: `rotate(4deg) scale(${tagS})`,
            transformOrigin: "center",
            backgroundColor: COLORS.orange,
            color: "#ffffff",
            fontFamily: inter,
            fontWeight: 700,
            fontSize: 34,
            padding: "12px 24px",
            borderRadius: 13,
            boxShadow: "0 8px 24px rgba(214,66,0,0.28)",
            whiteSpace: "nowrap",
          }}
        >
          problem found
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
