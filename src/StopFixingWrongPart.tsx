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

export const DURATION_IN_FRAMES = 236;

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

// smooth a jittered polyline into a hand-drawn looking quadratic path
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
  return l * 1.08; // slack so the dash fully clears the smoothed curve
};

const jitter = (seed: string, amt: number) => (random(seed) - 0.5) * 2 * amt;

const roughLinePts = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: string,
  amt = 2.6,
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
  amt = 2.6,
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
  // small hand-drawn overshoot past the starting corner
  pts.push({ x: corners[0].x + 14, y: corners[0].y + jitter(`${seed}-ov`, 2) });
  return pts;
};

const roughEllipsePts = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string,
  amt = 4,
  startDeg = -80,
  sweepDeg = 396,
): Pt[] => {
  const n = 48;
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

// ---- layout constants ----------------------------------------------------
const CARD = { x: 240, y: 540, w: 600, h: 750 };
const DIVIDER_Y = 1000;
const PLAY = { cx: 540, cy: 770, r: 84 };
const ELLIPSE = { cx: 540, cy: 770, rx: 350, ry: 262 };
const CHIP_Y = 1350;
const CHIP_H = 104;
const CHIP_W = 286;
const CHIP_GAP = 20;
const CHIPS_X0 = (1080 - (CHIP_W * 3 + CHIP_GAP * 2)) / 2;

const CHIPS = [
  { key: "budget", label: "Budget", icon: "coin" as const },
  { key: "targeting", label: "Targeting", icon: "target" as const },
  { key: "audience", label: "Audience", icon: "people" as const },
];

const chipX = (i: number) => CHIPS_X0 + i * (CHIP_W + CHIP_GAP);
const chipCx = (i: number) => chipX(i) + CHIP_W / 2;

// lucide-style wrench, 24x24 box
const WRENCH_D =
  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z";

const ChipIcon: React.FC<{
  type: "coin" | "target" | "people";
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
    case "target":
      return (
        <g {...common}>
          <circle cx={12 + j("a")} cy={12 + j("b")} r={9} />
          <circle cx={12 + j("c")} cy={12 + j("d")} r={4.5} />
          <circle cx={12} cy={12} r={1} fill={s} stroke="none" />
        </g>
      );
    case "people":
      return (
        <g {...common}>
          <circle cx={9 + j("a")} cy={8.5 + j("b")} r={3.2} />
          <path d={`M3.5 19c0-3 2.4-4.8 5.5-4.8s5.5 1.8 5.5 4.8`} />
          <circle cx={16.5 + j("c")} cy={9 + j("d")} r={2.6} />
          <path d={`M15.5 14.6c2.9.2 5 1.9 5 4.4`} />
        </g>
      );
    default:
      return null;
  }
};

const Word: React.FC<{
  text: string;
  start: number;
  style?: React.CSSProperties;
}> = ({ text, start, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: Math.max(0, frame - start),
    fps,
    config: { damping: 16, stiffness: 180 },
  });
  const visible = frame >= start;
  return (
    <span
      style={{
        display: "inline-block",
        opacity: visible ? s : 0,
        transform: `translateY(${(1 - s) * 26}px)`,
        marginRight: "0.28em",
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const StopFixingWrongPart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // flipbook "line boil": rough paths regenerate every 5 frames
  const boil = `b${Math.floor(frame / 5) % 3}`;

  const ease = Easing.bezier(0.33, 1, 0.68, 1);
  const prog = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  // ---- card sketch progress ----
  const pBorder = prog(30, 54);
  const pDivider = prog(46, 58);
  const pPlayCircle = prog(50, 63);
  const pPlayTri = prog(56, 65);
  const pSquig1 = prog(60, 71);
  const pSquig2 = prog(64, 75);
  const pCta = prog(68, 80);
  const ctaTextOpacity = prog(75, 84);
  const underlineProg = prog(26, 40);

  // ---- chips ----
  const chipSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - (82 + i * 6)),
      fps,
      config: { damping: 14, stiffness: 170 },
    });

  // gray-out after being "fixed"
  const chipFade = [
    interpolate(frame, [116, 126], [1, 0.42], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [144, 154], [1, 0.42], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    1,
  ];

  // X scribbles over chip 0 and 1
  const xProg = [prog(106, 118), prog(134, 146)];

  // ---- wrench choreography ----
  const wrenchIn = spring({
    frame: Math.max(0, frame - 92),
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const hop = prog(118, 128);
  const flyUp = prog(148, 158);
  const drawP = interpolate(frame, [156, 178], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  const ellipsePts = roughEllipsePts(
    ELLIPSE.cx,
    ELLIPSE.cy,
    ELLIPSE.rx,
    ELLIPSE.ry,
    `ellipse-${boil}`,
    4.2,
  );
  const ellipseStart = ellipsePts[0];

  // wrench anchor position over time
  const chip0Pos = { x: chipCx(0) + 88, y: CHIP_Y - 20 };
  const chip1Pos = { x: chipCx(1) + 88, y: CHIP_Y - 20 };
  let wx = chip0Pos.x;
  let wy = chip0Pos.y - (1 - wrenchIn) * 120;
  let wRot = -18;
  let wScale = 1;
  const wrenchVisible = frame >= 92;

  if (frame >= 118 && frame < 148) {
    wx = interpolate(hop, [0, 1], [chip0Pos.x, chip1Pos.x]);
    wy = chip1Pos.y - Math.sin(hop * Math.PI) * 96;
  } else if (frame >= 148) {
    const tip =
      ellipsePts[
        Math.min(
          ellipsePts.length - 1,
          Math.floor(drawP * (ellipsePts.length - 1)),
        )
      ];
    const target = drawP > 0 ? tip : ellipseStart;
    wx =
      interpolate(flyUp, [0, 1], [chip1Pos.x, target.x]) +
      (drawP > 0 ? target.x - target.x : 0);
    wy = interpolate(flyUp, [0, 1], [chip1Pos.y, target.y]);
    if (flyUp >= 1) {
      wx = target.x;
      wy = target.y;
    }
    wRot = -32;
    wScale = 0.88;
  }

  // torque wiggle while "fixing"
  const torque = (start: number) => {
    if (frame < start || frame > start + 26) return 0;
    const t = frame - start;
    const amp = interpolate(t, [0, 26], [15, 3]);
    return Math.sin(t * 0.62) * amp;
  };
  wRot += torque(96) + torque(126);

  // settle bob once the circle is drawn
  if (drawP >= 1) {
    wy += Math.sin((frame - 178) * 0.18) * 3;
  }

  // chip shake while wrench torques it
  const chipShake = (i: number) => {
    const start = i === 0 ? 96 : 126;
    if (frame < start || frame > start + 26) return 0;
    const t = frame - start;
    return Math.sin(t * 0.9) * interpolate(t, [0, 26], [2.4, 0]);
  };

  // ---- coins ----
  type Coin = {
    chip: number;
    start: number;
    vx: number;
    vy: number;
    seed: string;
  };
  const coins: Coin[] = [
    { chip: 0, start: 106, vx: -3.2, vy: -8.5, seed: "c0a" },
    { chip: 0, start: 109, vx: 0.8, vy: -10, seed: "c0b" },
    { chip: 0, start: 112, vx: 3.4, vy: -7.5, seed: "c0c" },
    { chip: 1, start: 134, vx: -3.4, vy: -9, seed: "c1a" },
    { chip: 1, start: 137, vx: 0.6, vy: -10.5, seed: "c1b" },
    { chip: 1, start: 140, vx: 3.2, vy: -8, seed: "c1c" },
  ];

  // ---- payoff tag ----
  const tagS = spring({
    frame: Math.max(0, frame - 180),
    fps,
    config: { damping: 12, stiffness: 190 },
  });

  // ellipse pulse on hold
  const ellipsePulse =
    drawP >= 1 ? 1 + Math.sin((frame - 178) * 0.22) * 0.006 : 1;

  // background glow breathes gently
  const glow = 0.05 + Math.sin(frame * 0.05) * 0.012;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily: inter }}>
      {/* paper grid — full bleed, background only */}
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 120}
              y1={0}
              x2={i * 120}
              y2={1920}
              stroke={COLORS.line}
              strokeWidth={1.4}
              opacity={0.6}
            />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
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
          background: `radial-gradient(720px 620px at 50% 46%, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
        }}
      />

      {/* content shifted down 10% of canvas height */}
      <AbsoluteFill style={{ transform: "translateY(192px)" }}>
        {/* headline */}
        <div
          style={{
            position: "absolute",
            top: 216,
            left: 54,
            width: 972,
            textAlign: "center",
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <Word text="Stop" start={4} />
            <Word text="wasting" start={8} />
            <Word text="money" start={12} />
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.15,
              marginTop: 16,
              color: COLORS.muted,
              letterSpacing: -0.5,
            }}
          >
            <Word text="fixing" start={18} />
            <Word text="the" start={21} />
            <span
              style={{
                position: "relative",
                display: "inline-block",
                marginRight: "0.28em",
              }}
            >
              <Word
                text="wrong part"
                start={24}
                style={{
                  color: COLORS.orange,
                  fontWeight: 700,
                  marginRight: 0,
                }}
              />
              <svg
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  left: -3,
                  bottom: -12,
                  width: "calc(100% + 6px)",
                  height: 14,
                  overflow: "visible",
                }}
              >
                <path
                  d={`M 2 ${6 + jitter(`${boil}-u1`, 1.6)} Q 26 ${2 + jitter(`${boil}-u2`, 2)} 52 ${6 + jitter(`${boil}-u3`, 1.6)} Q 78 ${9 + jitter(`${boil}-u4`, 2)} 98 ${4 + jitter(`${boil}-u5`, 1.6)}`}
                  pathLength={100}
                  stroke={COLORS.orange}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={100}
                  strokeDashoffset={100 * (1 - underlineProg)}
                />
              </svg>
            </span>
            <Word text="of" start={30} />
            <Word text="your" start={33} />
            <Word text="ads" start={36} />
          </div>
        </div>

        {/* drawn artwork */}
        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* soft white fill behind the ad sketch so grid doesn't show through */}
          <rect
            x={CARD.x + 6}
            y={CARD.y + 6}
            width={CARD.w - 12}
            height={CARD.h - 12}
            rx={18}
            fill={COLORS.card}
            opacity={interpolate(pBorder, [0, 1], [0, 0.92])}
          />

          {/* ad card outline */}
          <RoughStroke
            pts={roughRectPts(
              CARD.x,
              CARD.y,
              CARD.w,
              CARD.h,
              `card-${boil}`,
              3,
            )}
            progress={pBorder}
            stroke={COLORS.ink}
            sw={4.5}
          />
          {/* divider between video area and copy */}
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 18,
              DIVIDER_Y,
              CARD.x + CARD.w - 18,
              DIVIDER_Y,
              `div-${boil}`,
              2.4,
            )}
            progress={pDivider}
            stroke={COLORS.ink}
            sw={3}
            opacity={0.55}
          />
          {/* play button */}
          <RoughStroke
            pts={roughEllipsePts(
              PLAY.cx,
              PLAY.cy,
              PLAY.r,
              PLAY.r,
              `play-${boil}`,
              2.6,
              -90,
              392,
            )}
            progress={pPlayCircle}
            stroke={COLORS.ink}
            sw={4.5}
          />
          <RoughStroke
            pts={[
              ...roughLinePts(
                PLAY.cx - 24,
                PLAY.cy - 36,
                PLAY.cx + 36,
                PLAY.cy,
                `tri1-${boil}`,
                1.6,
              ),
              ...roughLinePts(
                PLAY.cx + 36,
                PLAY.cy,
                PLAY.cx - 24,
                PLAY.cy + 36,
                `tri2-${boil}`,
                1.6,
              ).slice(1),
              ...roughLinePts(
                PLAY.cx - 24,
                PLAY.cy + 36,
                PLAY.cx - 24,
                PLAY.cy - 36,
                `tri3-${boil}`,
                1.6,
              ).slice(1),
            ]}
            progress={pPlayTri}
            stroke={COLORS.orange}
            sw={4.5}
          />
          {/* copy squiggles */}
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 50,
              1052,
              CARD.x + CARD.w - 50,
              1052,
              `sq1-${boil}`,
              3.4,
            )}
            progress={pSquig1}
            stroke={COLORS.muted}
            sw={7}
            opacity={0.5}
          />
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 50,
              1104,
              CARD.x + CARD.w - 160,
              1104,
              `sq2-${boil}`,
              3.4,
            )}
            progress={pSquig2}
            stroke={COLORS.muted}
            sw={7}
            opacity={0.5}
          />
          {/* CTA pill */}
          <RoughStroke
            pts={roughRectPts(390, 1158, 300, 78, `cta-${boil}`, 2.6)}
            progress={pCta}
            stroke={COLORS.orange}
            sw={4}
          />
          <text
            x={540}
            y={1200}
            fontFamily={inter}
            fontWeight={700}
            fontSize={32}
            fill={COLORS.orange}
            textAnchor="middle"
            dominantBaseline="middle"
            opacity={ctaTextOpacity}
          >
            Shop Now
          </text>

          {/* chips */}
          {CHIPS.map((chip, i) => {
            const s = chipSpring(i);
            if (s <= 0.001) return null;
            const cx = chipCx(i);
            const cy = CHIP_Y + CHIP_H / 2;
            return (
              <g
                key={chip.key}
                opacity={Math.min(s, 1) * chipFade[i]}
                transform={`translate(${cx + chipShake(i)} ${cy}) scale(${0.6 + s * 0.4}) translate(${-cx} ${-cy})`}
              >
                <rect
                  x={chipX(i) + 4}
                  y={CHIP_Y + 4}
                  width={CHIP_W - 8}
                  height={CHIP_H - 8}
                  rx={16}
                  fill={COLORS.card}
                  opacity={0.92}
                />
                <RoughStroke
                  pts={roughRectPts(
                    chipX(i),
                    CHIP_Y,
                    CHIP_W,
                    CHIP_H,
                    `chip-${chip.key}-${boil}`,
                    2.4,
                  )}
                  progress={1}
                  stroke={COLORS.ink}
                  sw={3.4}
                />
                <g
                  transform={`translate(${chipX(i) + 26} ${CHIP_Y + CHIP_H / 2 - 22}) scale(1.85)`}
                >
                  <ChipIcon type={chip.icon} boil={boil} />
                </g>
                <text
                  x={chipX(i) + 82}
                  y={CHIP_Y + CHIP_H / 2 + 1}
                  fontFamily={inter}
                  fontWeight={600}
                  fontSize={33}
                  fill={COLORS.ink}
                  dominantBaseline="middle"
                >
                  {chip.label}
                </text>
              </g>
            );
          })}

          {/* X scribbles over the wrong fixes */}
          {[0, 1].map((i) =>
            xProg[i] > 0 ? (
              <g key={`x${i}`}>
                <RoughStroke
                  pts={roughLinePts(
                    chipX(i) + 30,
                    CHIP_Y + 14,
                    chipX(i) + CHIP_W - 30,
                    CHIP_Y + CHIP_H - 14,
                    `xa${i}-${boil}`,
                    3,
                  )}
                  progress={Math.min(1, xProg[i] * 2)}
                  stroke={COLORS.orangeDeep}
                  sw={7}
                  opacity={0.9}
                />
                <RoughStroke
                  pts={roughLinePts(
                    chipX(i) + CHIP_W - 30,
                    CHIP_Y + 14,
                    chipX(i) + 30,
                    CHIP_Y + CHIP_H - 14,
                    `xb${i}-${boil}`,
                    3,
                  )}
                  progress={Math.max(0, Math.min(1, xProg[i] * 2 - 1))}
                  stroke={COLORS.orangeDeep}
                  sw={7}
                  opacity={0.9}
                />
              </g>
            ) : null,
          )}

          {/* coins flying away */}
          {coins.map((coin) => {
            const t = frame - coin.start;
            if (t < 0 || t > 26) return null;
            const x0 = chipCx(coin.chip);
            const y0 = CHIP_Y - 6;
            const cxp = x0 + coin.vx * t;
            const cyp = y0 + coin.vy * t + 0.5 * 0.58 * t * t;
            const op = interpolate(t, [0, 4, 18, 26], [0, 1, 1, 0]);
            const rot =
              t * (6 + random(coin.seed) * 6) * (coin.vx > 0 ? 1 : -1);
            return (
              <g
                key={coin.seed}
                opacity={op}
                transform={`translate(${cxp} ${cyp}) rotate(${rot})`}
              >
                <circle
                  r={21}
                  fill={COLORS.iconBg}
                  stroke={COLORS.ink}
                  strokeWidth={3}
                />
                <text
                  fontFamily={inter}
                  fontWeight={700}
                  fontSize={24}
                  fill={COLORS.orange}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  $
                </text>
              </g>
            );
          })}

          {/* payoff circle around the creative */}
          {drawP > 0 ? (
            <g
              transform={`translate(${ELLIPSE.cx} ${ELLIPSE.cy}) scale(${ellipsePulse}) translate(${-ELLIPSE.cx} ${-ELLIPSE.cy})`}
            >
              <RoughStroke
                pts={ellipsePts}
                progress={drawP}
                stroke={COLORS.orange}
                sw={8}
                opacity={0.95}
              />
            </g>
          ) : null}

          {/* wrench */}
          {wrenchVisible ? (
            <g
              transform={`translate(${wx} ${wy}) rotate(${wRot}) scale(${wScale * 3.1}) translate(-12 -12)`}
              opacity={Math.min(1, wrenchIn * 1.4)}
            >
              <path
                d={WRENCH_D}
                fill={COLORS.iconBg}
                stroke={COLORS.orange}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : null}
        </svg>

        {/* payoff tag */}
        {frame >= 180 ? (
          <div
            style={{
              position: "absolute",
              left: 650,
              top: 468,
              transform: `rotate(-6deg) scale(${tagS})`,
              transformOrigin: "center",
              backgroundColor: COLORS.orange,
              color: "#ffffff",
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 38,
              padding: "14px 28px",
              borderRadius: 14,
              boxShadow: "0 8px 24px rgba(214,66,0,0.28)",
              whiteSpace: "nowrap",
            }}
          >
            fix this first
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
