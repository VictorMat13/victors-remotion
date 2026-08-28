import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 200;

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
  green: "#16A34A",
  greenSoft: "#E8F7EE",
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

// ---- layout — zigzag storyboard, 1080x1920, 5% side safe (x 54..1026) ------
const P1 = { x: 92, y: 268, w: 520, h: 350 };
const P2 = { x: 468, y: 792, w: 520, h: 350 };
const P3 = { x: 92, y: 1316, w: 520, h: 350 };

// one continuous stroke: P1 -> P2 -> P3, routed around panel edges
const ANGLE_PATH: Pt[] = [
  { x: P1.x + P1.w - 160, y: P1.y + P1.h + 8 },
  { x: P1.x + P1.w + 30, y: P1.y + P1.h + 100 },
  { x: P2.x + 26, y: P2.y - 56 },
  { x: P2.x + 60, y: P2.y - 8 }, // touch panel 2's top-left corner
  { x: P2.x - 30, y: P2.y + 120 },
  { x: P2.x - 14, y: P2.y + P2.h - 40 },
  { x: P2.x + 30, y: P2.y + P2.h + 66 },
  { x: P3.x + P3.w - 60, y: P3.y - 76 },
  { x: P3.x + P3.w - 110, y: P3.y - 8 }, // land on panel 3
];
const TOUCH_IDX = 3; // index of the panel-2 touch point
const fracAt = (idx: number) => {
  let total = 0;
  let at = 0;
  for (let i = 1; i < ANGLE_PATH.length; i++) {
    const seg = Math.hypot(
      ANGLE_PATH[i].x - ANGLE_PATH[i - 1].x,
      ANGLE_PATH[i].y - ANGLE_PATH[i - 1].y,
    );
    total += seg;
    if (i <= idx) at += seg;
  }
  return at / total;
};
const TOUCH_FRAC = fracAt(TOUCH_IDX);

export const OneClearAngle: React.FC = () => {
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

  // ---- beat 1: problem panel -----------------------------------------------
  const p1Border = prog(2, 22);
  const p1Warn = prog(12, 26);
  const p1Squig = prog(20, 30);
  const warnPulse = 1 + Math.sin(frame * 0.16) * 0.02;

  // ---- the one continuous angle stroke -------------------------------------
  // draws in two pushes with a plateau while the product pops
  const pathProg = interpolate(
    frame,
    [26, 48, 78, 100],
    [0, TOUCH_FRAC, TOUCH_FRAC, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
  );

  // ---- beat 2: product panel -----------------------------------------------
  const p2Border = prog(40, 60);
  const productS = spring({
    frame: Math.max(0, frame - 52),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const productRot = interpolate(productS, [0, 1], [-7, 0]);
  const p2Circle = prog(62, 80);
  const circlePulse =
    p2Circle >= 1 ? 1 + Math.sin((frame - 80) * 0.2) * 0.012 : 1;
  const sparkS = spring({
    frame: Math.max(0, frame - 72),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  // ---- beat 3: benefit panel -----------------------------------------------
  const p3Border = prog(96, 116);
  const p3Check = prog(110, 128);
  const arrowHeadS = spring({
    frame: Math.max(0, frame - 98),
    fps,
    config: { damping: 11, stiffness: 220 },
  });
  const heartS = (i: number) =>
    spring({
      frame: Math.max(0, frame - (112 + i * 6)),
      fps,
      config: { damping: 13, stiffness: 160 },
    });

  // ---- chips ---------------------------------------------------------------
  const CHIP_AT = [24, 54, 110];
  const chipS = (i: number) =>
    spring({
      frame: Math.max(0, frame - CHIP_AT[i]),
      fps,
      config: { damping: 12, stiffness: 190 },
    });

  const glow = 0.05 + Math.sin(frame * 0.05) * 0.012;

  const chips = [
    {
      label: "problem",
      color: COLORS.orange,
      bg: COLORS.iconBg,
      x: P1.x + 24,
      y: P1.y - 33,
    },
    {
      label: "product",
      color: COLORS.ink,
      bg: COLORS.card,
      x: P2.x + 24,
      y: P2.y - 33,
    },
    {
      label: "benefit",
      color: COLORS.green,
      bg: COLORS.greenSoft,
      x: P3.x + 24,
      y: P3.y - 33,
    },
  ];

  const hearts = [
    { dx: P3.x + 330, dy: P3.y + 200, s: 30, drift: -60 },
    { dx: P3.x + 402, dy: P3.y + 240, s: 24, drift: -46 },
    { dx: P3.x + 372, dy: P3.y + 150, s: 20, drift: -52 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily: inter }}>
      {/* paper grid — full bleed */}
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
          background: `radial-gradient(620px 760px at 50% 48%, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
        }}
      />

      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* ---- panel 1: problem ---- */}
        <rect
          x={P1.x + 5}
          y={P1.y + 5}
          width={P1.w - 10}
          height={P1.h - 10}
          rx={14}
          fill={COLORS.card}
          opacity={interpolate(p1Border, [0, 1], [0, 0.92])}
        />
        <RoughStroke
          pts={roughRectPts(P1.x, P1.y, P1.w, P1.h, `p1-${boil}`, 2.6)}
          progress={p1Border}
          stroke={COLORS.ink}
          sw={4}
        />
        {/* warning triangle */}
        <g
          transform={`translate(${P1.x + P1.w / 2} ${P1.y + 148}) scale(${warnPulse}) translate(${-(P1.x + P1.w / 2)} ${-(P1.y + 148)})`}
        >
          <RoughStroke
            pts={[
              ...roughLinePts(
                P1.x + P1.w / 2 - 62,
                P1.y + 186,
                P1.x + P1.w / 2,
                P1.y + 82,
                `w1-${boil}`,
                1.6,
              ),
              ...roughLinePts(
                P1.x + P1.w / 2,
                P1.y + 82,
                P1.x + P1.w / 2 + 62,
                P1.y + 186,
                `w2-${boil}`,
                1.6,
              ).slice(1),
              ...roughLinePts(
                P1.x + P1.w / 2 + 62,
                P1.y + 186,
                P1.x + P1.w / 2 - 62,
                P1.y + 186,
                `w3-${boil}`,
                1.6,
              ).slice(1),
            ]}
            progress={p1Warn}
            stroke={COLORS.orange}
            sw={5}
          />
          <RoughStroke
            pts={roughLinePts(
              P1.x + P1.w / 2,
              P1.y + 116,
              P1.x + P1.w / 2,
              P1.y + 152,
              `wm-${boil}`,
              1,
            )}
            progress={p1Warn}
            stroke={COLORS.orange}
            sw={5.5}
          />
          <RoughStroke
            pts={roughLinePts(
              P1.x + P1.w / 2 - 1,
              P1.y + 168,
              P1.x + P1.w / 2 + 1,
              P1.y + 170,
              `wd-${boil}`,
              0.8,
            )}
            progress={p1Warn}
            stroke={COLORS.orange}
            sw={6}
          />
        </g>
        {/* pain squiggles */}
        <RoughStroke
          pts={roughLinePts(
            P1.x + 92,
            P1.y + 244,
            P1.x + P1.w - 92,
            P1.y + 244,
            `sq1-${boil}`,
            2.6,
          )}
          progress={p1Squig}
          stroke={COLORS.muted}
          sw={5}
          opacity={0.5}
        />
        <RoughStroke
          pts={roughLinePts(
            P1.x + 132,
            P1.y + 286,
            P1.x + P1.w - 132,
            P1.y + 286,
            `sq2-${boil}`,
            2.6,
          )}
          progress={p1Squig}
          stroke={COLORS.muted}
          sw={5}
          opacity={0.38}
        />

        {/* ---- the one continuous angle stroke ---- */}
        <RoughStroke
          pts={ANGLE_PATH.flatMap((p, i, arr) =>
            i === 0
              ? [p]
              : roughLinePts(
                  arr[i - 1].x,
                  arr[i - 1].y,
                  p.x,
                  p.y,
                  `ang${i}-${boil}`,
                  3,
                ).slice(1),
          )}
          progress={pathProg}
          stroke={COLORS.orange}
          sw={6}
          opacity={0.92}
        />
        {/* arrowhead lands on panel 3 */}
        {arrowHeadS > 0.001 ? (
          <g
            opacity={Math.min(1, arrowHeadS * 1.3)}
            transform={`translate(${P3.x + P3.w - 110} ${P3.y - 8}) scale(${0.6 + 0.4 * arrowHeadS})`}
          >
            <RoughStroke
              pts={roughLinePts(-30, -34, 2, 2, `ah1-${boil}`, 1.4)}
              progress={1}
              stroke={COLORS.orange}
              sw={6}
            />
            <RoughStroke
              pts={roughLinePts(34, -26, 2, 2, `ah2-${boil}`, 1.4)}
              progress={1}
              stroke={COLORS.orange}
              sw={6}
            />
          </g>
        ) : null}

        {/* ---- panel 2: product ---- */}
        <rect
          x={P2.x + 5}
          y={P2.y + 5}
          width={P2.w - 10}
          height={P2.h - 10}
          rx={14}
          fill={COLORS.card}
          opacity={interpolate(p2Border, [0, 1], [0, 0.92])}
        />
        <RoughStroke
          pts={roughRectPts(P2.x, P2.y, P2.w, P2.h, `p2-${boil}`, 2.6)}
          progress={p2Border}
          stroke={COLORS.ink}
          sw={4}
        />
        {/* ---- panel 3: benefit ---- */}
        <rect
          x={P3.x + 5}
          y={P3.y + 5}
          width={P3.w - 10}
          height={P3.h - 10}
          rx={14}
          fill={COLORS.card}
          opacity={interpolate(p3Border, [0, 1], [0, 0.92])}
        />
        <RoughStroke
          pts={roughRectPts(P3.x, P3.y, P3.w, P3.h, `p3-${boil}`, 2.6)}
          progress={p3Border}
          stroke={COLORS.ink}
          sw={4}
        />
        {/* big green check */}
        <RoughStroke
          pts={[
            ...roughLinePts(
              P3.x + 168,
              P3.y + 178,
              P3.x + 224,
              P3.y + 236,
              `ck1-${boil}`,
              2,
            ),
            ...roughLinePts(
              P3.x + 224,
              P3.y + 236,
              P3.x + 342,
              P3.y + 104,
              `ck2-${boil}`,
              2,
            ).slice(1),
          ]}
          progress={p3Check}
          stroke={COLORS.green}
          sw={9}
        />
        {/* floating hearts */}
        {hearts.map((h, i) => {
          const s = heartS(i);
          if (s <= 0.001) return null;
          const rise = interpolate(s, [0, 1], [0, h.drift]);
          return (
            <g
              key={i}
              opacity={
                Math.min(1, s * 1.5) *
                interpolate(s, [0.75, 1], [1, 0.85], {
                  extrapolateLeft: "clamp",
                })
              }
              transform={`translate(${h.dx} ${h.dy + rise}) scale(${(0.5 + 0.5 * s) * (h.s / 26)})`}
            >
              <path
                d="M0 8 C -9 -2, -22 2, -12 14 L 0 26 L 12 14 C 22 2, 9 -2, 0 8 Z"
                fill="none"
                stroke={COLORS.orangeDeep}
                strokeWidth={4.4}
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>

      {/* product photo — above the card fill, below the highlight circle */}
      {productS > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: P2.x + P2.w / 2 - 130,
            top: P2.y + P2.h / 2 - 108,
            width: 260,
            transform: `scale(${productS}) rotate(${productRot}deg)`,
            transformOrigin: "center",
          }}
        >
          <Img
            src={staticFile("pollo/controller.jpg")}
            style={{
              width: "100%",
              display: "block",
              borderRadius: 10,
              filter: "drop-shadow(0 10px 22px rgba(27,23,32,0.14))",
            }}
          />
        </div>
      ) : null}

      {/* overlay pass — highlight circle + sparkle drawn over the photo */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        {p2Circle > 0 ? (
          <g
            transform={`translate(${P2.x + P2.w / 2} ${P2.y + P2.h / 2}) scale(${circlePulse}) translate(${-(P2.x + P2.w / 2)} ${-(P2.y + P2.h / 2)})`}
          >
            <RoughStroke
              pts={roughEllipsePts(
                P2.x + P2.w / 2,
                P2.y + P2.h / 2,
                172,
                128,
                `hilite-${boil}`,
                3.2,
                -70,
                400,
              )}
              progress={p2Circle}
              stroke={COLORS.orange}
              sw={6.5}
              opacity={0.95}
            />
          </g>
        ) : null}
        {sparkS > 0.001 ? (
          <g
            opacity={Math.min(1, sparkS * 1.4)}
            transform={`translate(${P2.x + P2.w - 64} ${P2.y + 58}) scale(${0.5 + 0.5 * sparkS}) rotate(${interpolate(sparkS, [0, 1], [-30, 0])})`}
          >
            {[0, 45, 90, 135].map((deg) => (
              <RoughStroke
                key={deg}
                pts={roughLinePts(
                  -Math.cos((deg * Math.PI) / 180) * 24,
                  -Math.sin((deg * Math.PI) / 180) * 24,
                  Math.cos((deg * Math.PI) / 180) * 24,
                  Math.sin((deg * Math.PI) / 180) * 24,
                  `sp${deg}-${boil}`,
                  1,
                )}
                progress={1}
                stroke={COLORS.orange}
                sw={5}
              />
            ))}
          </g>
        ) : null}
      </svg>

      {/* chips */}
      {chips.map((c, i) => {
        const s = chipS(i);
        if (s <= 0.001) return null;
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              transform: `rotate(-2deg) scale(${Math.min(1, s)}) translateY(${(1 - Math.min(1, s)) * 20}px)`,
              transformOrigin: "left center",
              backgroundColor: c.bg,
              color: c.color,
              border: `2.6px solid ${c.color}`,
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 30,
              padding: "8px 22px",
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(27,23,32,0.10)",
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
