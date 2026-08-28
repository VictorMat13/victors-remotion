import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
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

export const DURATION_IN_FRAMES = 315;

// Promptible white / paper style — Liam orange accent, hand-drawn pass
const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  iconBg: "#FFF1EA",
  green: "#3a9d5d",
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
  pts.push({ x: corners[0].x + 14, y: corners[0].y + jitter(`${seed}-ov`, 2) });
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
const VIDEO = { x: 54, y: 221, w: 972, h: 547 }; // bottom edge 768 = 10% above middle
const CARD = { x: 165, y: 940, w: 750, h: 380 }; // account card, bottom 1320
const DIVIDER_Y = CARD.y + 78;
const ROW_YS = [1075, 1170, 1265];
const BAR_X0 = 420;
const BAR_X1 = CARD.x + CARD.w - 90; // 825
const ROWS = [
  { label: "Spend", fill: 0.78 },
  { label: "CPA", fill: 0.55 },
  { label: "ROAS", fill: 0.66 },
];

const DRAWER = { x: 205, w: 670, h: 175 };
const DRAWER_Y_HIDDEN = 1100; // fully behind the card
const DRAWER_Y_OUT = 1345;

const CHIPS = [
  { label: "Wasted spend", w: 300, slotX: 320, finalCx: 213 },
  { label: "Audience overlap", w: 365, slotX: 540, finalCx: 565 },
  { label: "Ad fatigue", w: 250, slotX: 760, finalCx: 893 },
];
const CHIP_H = 96;
const CHIP_FINAL_CY = 856; // chip row floats between video (768) and card (940)
const IN_DRAWER_SCALE = 0.6;
const FLY_STARTS = [158, 176, 194];

export const PullsOutProblems: React.FC = () => {
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

  // ---- video entrance ----
  const videoPop = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 160 },
  });
  const pVideoFrame = prog(6, 28);

  // ---- account card sketch ----
  const pCardBorder = prog(34, 56);
  const pDots = prog(46, 54);
  const titleOpacity = prog(50, 60);
  const pDividerLine = prog(54, 62);

  const rowProg = (i: number) => ({
    label: prog(58 + i * 10, 66 + i * 10),
    track: prog(60 + i * 10, 70 + i * 10),
    fill: prog(64 + i * 10, 76 + i * 10),
    check: prog(88 + i * 8, 96 + i * 8),
  });

  // ---- drawer ----
  const drawerS = spring({
    frame: Math.max(0, frame - 126),
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const drawerY =
    DRAWER_Y_HIDDEN +
    (DRAWER_Y_OUT - DRAWER_Y_HIDDEN) * Math.min(drawerS, 1.04);
  const drawerVisible = frame >= 126;

  // card jostle when the drawer breaks loose — damped oscillation
  let cardNudge = 0;
  if (frame >= 126 && frame <= 158) {
    const t = frame - 126;
    cardNudge = -10 * Math.exp(-t / 9) * Math.sin(t * 0.85);
  }

  // checks lose their confidence once the drawer is out
  const checkFade = interpolate(frame, [130, 146], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- chips ----
  const chipFly = (i: number) =>
    spring({
      frame: Math.max(0, frame - FLY_STARTS[i]),
      fps,
      config: { damping: 13, stiffness: 150 },
    });

  const slotCy = drawerY + 72;

  // ---- coins spilling from the open drawer ----
  type Coin = {
    start: number;
    x0: number;
    vx: number;
    vy: number;
    seed: string;
  };
  const coins: Coin[] = Array.from({ length: 8 }, (_, i) => ({
    start: 235 + i * 8,
    x0: 320 + ((i * 173) % 400),
    vx: -2.2 + random(`coinvx${i}`) * 5,
    vy: -6 - random(`coinvy${i}`) * 3.5,
    seed: `coin${i}`,
  }));

  // ---- payoff tag ----
  const tagS = spring({
    frame: Math.max(0, frame - 252),
    fps,
    config: { damping: 12, stiffness: 190 },
  });

  // background glow breathes gently
  const glow = 0.05 + Math.sin(frame * 0.05) * 0.012;

  // shared chip renderer (used in-drawer and in-flight)
  const renderChip = (
    i: number,
    cx: number,
    cy: number,
    scale: number,
    rot: number,
  ) => {
    const chip = CHIPS[i];
    const x = -chip.w / 2;
    const y = -CHIP_H / 2;
    return (
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale})`}>
        <rect
          x={x + 4}
          y={y + 4}
          width={chip.w - 8}
          height={CHIP_H - 8}
          rx={16}
          fill={COLORS.card}
          opacity={0.95}
        />
        <RoughStroke
          pts={roughRectPts(x, y, chip.w, CHIP_H, `chip${i}-${boil}`, 2.4)}
          progress={1}
          stroke={COLORS.orangeDeep}
          sw={3.4}
        />
        {/* warning triangle */}
        <g
          transform={`translate(${x + 46} 0)`}
          stroke={COLORS.orangeDeep}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path
            d={`M ${jitter(`tri${i}a-${boil}`, 0.8)} -17 L 16 12 L -16 12 Z`}
            transform="scale(1.15)"
          />
          <line x1={0} y1={-6} x2={0} y2={3} />
          <circle
            cx={0}
            cy={9}
            r={0.9}
            fill={COLORS.orangeDeep}
            stroke="none"
          />
        </g>
        <text
          x={x + 84}
          y={2}
          fontFamily={inter}
          fontWeight={600}
          fontSize={31}
          fill={COLORS.ink}
          dominantBaseline="middle"
        >
          {chip.label}
        </text>
      </g>
    );
  };

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
          background: `radial-gradient(720px 620px at 50% 54%, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
        }}
      />

      {/* footage — top half, bottom edge 10% above middle */}
      <div
        style={{
          position: "absolute",
          left: VIDEO.x,
          top: VIDEO.y,
          width: VIDEO.w,
          height: VIDEO.h,
          borderRadius: 24,
          overflow: "hidden",
          opacity: Math.min(1, videoPop * 1.3),
          transform: `scale(${0.96 + videoPop * 0.04})`,
          boxShadow: "0 18px 44px rgba(27,23,32,0.14)",
          backgroundColor: COLORS.card,
        }}
      >
        <OffthreadVideo
          src={staticFile("creatify-problems-hiding.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* drawn artwork */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* hand-drawn frame around the footage */}
        <RoughStroke
          pts={roughRectPts(
            VIDEO.x,
            VIDEO.y,
            VIDEO.w,
            VIDEO.h,
            `vframe-${boil}`,
            3,
          )}
          progress={pVideoFrame}
          stroke={COLORS.ink}
          sw={4.5}
        />

        {/* ---- UNDER-CARD LAYER: the hidden drawer ---- */}
        {drawerVisible ? (
          <g>
            <rect
              x={DRAWER.x + 5}
              y={drawerY + 5}
              width={DRAWER.w - 10}
              height={DRAWER.h - 10}
              rx={16}
              fill={COLORS.iconBg}
              opacity={0.94}
            />
            <RoughStroke
              pts={roughRectPts(
                DRAWER.x,
                drawerY,
                DRAWER.w,
                DRAWER.h,
                `drawer-${boil}`,
                2.8,
              )}
              progress={1}
              stroke={COLORS.ink}
              sw={4}
            />
            {/* handle */}
            <RoughStroke
              pts={roughRectPts(
                485,
                drawerY + DRAWER.h - 28,
                110,
                14,
                `handle-${boil}`,
                1.6,
              )}
              progress={1}
              stroke={COLORS.ink}
              sw={3.2}
              fill={COLORS.card}
            />
            {/* empty slots left behind after chips fly out */}
            {CHIPS.map((chip, i) => {
              if (frame < FLY_STARTS[i] + 4) return null;
              const w = chip.w * IN_DRAWER_SCALE;
              const h = CHIP_H * IN_DRAWER_SCALE;
              return (
                <rect
                  key={`slot${i}`}
                  x={chip.slotX - w / 2}
                  y={slotCy - h / 2}
                  width={w}
                  height={h}
                  rx={10}
                  fill="none"
                  stroke={COLORS.muted}
                  strokeWidth={2.4}
                  strokeDasharray="10 10"
                  opacity={interpolate(
                    frame,
                    [FLY_STARTS[i] + 4, FLY_STARTS[i] + 12],
                    [0, 0.55],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  )}
                />
              );
            })}
            {/* chips still sitting inside the drawer */}
            {CHIPS.map((_, i) =>
              frame < FLY_STARTS[i]
                ? renderChip(i, CHIPS[i].slotX, slotCy, IN_DRAWER_SCALE, 0)
                : null,
            )}
          </g>
        ) : null}

        {/* ---- ACCOUNT CARD (covers the drawer until it slides out) ---- */}
        <g transform={`translate(0 ${cardNudge})`}>
          <rect
            x={CARD.x + 5}
            y={CARD.y + 5}
            width={CARD.w - 10}
            height={CARD.h - 10}
            rx={18}
            fill={COLORS.card}
            opacity={interpolate(pCardBorder, [0, 1], [0, 1])}
          />
          <RoughStroke
            pts={roughRectPts(
              CARD.x,
              CARD.y,
              CARD.w,
              CARD.h,
              `card-${boil}`,
              3,
            )}
            progress={pCardBorder}
            stroke={COLORS.ink}
            sw={4.5}
          />
          {/* header dots */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`dot${i}`}
              cx={CARD.x + 44 + i * 34}
              cy={CARD.y + 40}
              r={8}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={3}
              opacity={pDots}
            />
          ))}
          <text
            x={CARD.x + 150}
            y={CARD.y + 42}
            fontFamily={inter}
            fontWeight={700}
            fontSize={34}
            fill={COLORS.ink}
            dominantBaseline="middle"
            opacity={titleOpacity}
          >
            Ad Account
          </text>
          <RoughStroke
            pts={roughLinePts(
              CARD.x + 18,
              DIVIDER_Y,
              CARD.x + CARD.w - 18,
              DIVIDER_Y,
              `hdiv-${boil}`,
              2.2,
            )}
            progress={pDividerLine}
            stroke={COLORS.ink}
            sw={3}
            opacity={0.5}
          />
          {/* metric rows — everything looks fine */}
          {ROWS.map((row, i) => {
            const p = rowProg(i);
            const y = ROW_YS[i];
            const fillEnd = BAR_X0 + (BAR_X1 - BAR_X0) * row.fill;
            return (
              <g key={row.label}>
                <text
                  x={CARD.x + 40}
                  y={y}
                  fontFamily={inter}
                  fontWeight={600}
                  fontSize={30}
                  fill={COLORS.muted}
                  dominantBaseline="middle"
                  opacity={p.label}
                >
                  {row.label}
                </text>
                <RoughStroke
                  pts={roughLinePts(
                    BAR_X0,
                    y,
                    BAR_X1,
                    y,
                    `track${i}-${boil}`,
                    2,
                  )}
                  progress={p.track}
                  stroke={COLORS.line}
                  sw={16}
                />
                <RoughStroke
                  pts={roughLinePts(
                    BAR_X0,
                    y,
                    fillEnd,
                    y,
                    `fill${i}-${boil}`,
                    2,
                  )}
                  progress={p.fill}
                  stroke={COLORS.ink}
                  sw={16}
                  opacity={0.72}
                />
                {/* green "all good" check */}
                <g opacity={checkFade}>
                  <RoughStroke
                    pts={[
                      ...roughLinePts(
                        BAR_X1 + 24,
                        y + 2,
                        BAR_X1 + 36,
                        y + 14,
                        `chk${i}a-${boil}`,
                        1.2,
                      ),
                      ...roughLinePts(
                        BAR_X1 + 36,
                        y + 14,
                        BAR_X1 + 58,
                        y - 14,
                        `chk${i}b-${boil}`,
                        1.2,
                      ).slice(1),
                    ]}
                    progress={p.check}
                    stroke={COLORS.green}
                    sw={5}
                  />
                </g>
              </g>
            );
          })}
        </g>

        {/* ---- ABOVE-CARD LAYER: flying chips, coins, tag ---- */}
        {CHIPS.map((chip, i) => {
          if (frame < FLY_STARTS[i]) return null;
          const s = chipFly(i);
          const cx = interpolate(s, [0, 1], [chip.slotX, chip.finalCx]);
          const cy = interpolate(s, [0, 1], [slotCy, CHIP_FINAL_CY]);
          const scale = IN_DRAWER_SCALE + (1 - IN_DRAWER_SCALE) * s;
          const rot = (1 - Math.min(s, 1)) * (-6 + i * 5);
          return <g key={`fly${i}`}>{renderChip(i, cx, cy, scale, rot)}</g>;
        })}

        {/* coins spilling out of the open drawer */}
        {coins.map((coin) => {
          const t = frame - coin.start;
          if (t < 0 || t > 34) return null;
          const cx = coin.x0 + coin.vx * t;
          const cy = DRAWER_Y_OUT + 82 + coin.vy * t + 0.5 * 0.52 * t * t;
          const op = interpolate(t, [0, 4, 24, 34], [0, 1, 1, 0]);
          const rot = t * (5 + random(coin.seed) * 6) * (coin.vx > 0 ? 1 : -1);
          return (
            <g
              key={coin.seed}
              opacity={op}
              transform={`translate(${cx} ${cy}) rotate(${rot})`}
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
      </svg>

      {/* payoff tag */}
      {frame >= 252 ? (
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 1560,
            transform: `rotate(-6deg) scale(${tagS})`,
            transformOrigin: "center",
            backgroundColor: COLORS.orange,
            color: "#ffffff",
            fontFamily: inter,
            fontWeight: 700,
            fontSize: 36,
            padding: "12px 26px",
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(214,66,0,0.28)",
            whiteSpace: "nowrap",
          }}
        >
          leaking here
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
