import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 270;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  chip: "#3f3833",
  orange: "#ff4f01",
  orangeLite: "#ff7a3c",
  greenInk: "#16A34A",
  green: "#22C55E",
};

const CX = 540;

// -------- timing --------
const CARD_APPEAR = 10;
const HERO_A = 72; // card starts shrinking to hero
const DASH_A = 100; // dashboard begins
const COUNT_A = 150;
const COUNT_B = 252;
const CHART_A = 162;
const CHART_B = 256;

// -------- platforms --------
const PLATFORMS = [
  { key: "meta", name: "Meta", x: 300 },
  { key: "tiktok", name: "TikTok", x: 540 },
  { key: "google", name: "Google", x: 780 },
];

// -------- metrics --------
type Metric = {
  label: string;
  target: number;
  fmt: (v: number) => string;
  x: number;
};
const METRICS: Metric[] = [
  {
    label: "Impressions",
    target: 1_240_000,
    fmt: (v) => `${(v / 1e6).toFixed(2)}M`,
    x: 240,
  },
  { label: "CTR", target: 3.8, fmt: (v) => `${v.toFixed(1)}%`, x: 540 },
  { label: "ROAS", target: 4.2, fmt: (v) => `${v.toFixed(1)}x`, x: 840 },
];

// -------- chart data (climbing) --------
const CHART_V = [0.06, 0.16, 0.12, 0.3, 0.4, 0.36, 0.58, 0.74, 0.95];

// =========================================================================
// Background
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 1000px at 50% 40%, rgba(255,79,1,0.08), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(760px 940px at 50% 46%, #000 45%, transparent 86%)",
        maskImage:
          "radial-gradient(760px 940px at 50% 46%, #000 45%, transparent 86%)",
      }}
    />
  </AbsoluteFill>
);

// =========================================================================
// Highlight-swept keyword
// =========================================================================
const Mark: React.FC<{ children: React.ReactNode; sweep: number }> = ({
  children,
  sweep,
}) => (
  <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: -8,
        right: -8,
        top: "14%",
        bottom: "8%",
        background: COLORS.orange,
        opacity: 0.24,
        zIndex: -1,
        transform: `scaleX(${sweep}) rotate(-1.5deg)`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 92%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

// =========================================================================
// Climbing performance chart
// =========================================================================
const Chart: React.FC<{ prog: number }> = ({ prog }) => {
  const CW = 820;
  const CH = 208;
  const n = CHART_V.length;
  const xs = CHART_V.map((_, i) => (i / (n - 1)) * CW);
  const ys = CHART_V.map((v) => CH * 0.92 - v * (CH * 0.82));
  const line = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${CW} ${CH} L 0 ${CH} Z`;

  // tip position along the polyline
  const t = prog * (n - 1);
  const i = Math.min(n - 2, Math.floor(t));
  const f = t - i;
  const tipX = xs[i] + (xs[i + 1] - xs[i]) * f;
  const tipY = ys[i] + (ys[i + 1] - ys[i]) * f;

  return (
    <svg
      width={CW}
      height={CH}
      viewBox={`0 0 ${CW} ${CH}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.orange} stopOpacity="0.22" />
          <stop offset="1" stopColor={COLORS.orange} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line
        x1="0"
        y1={CH - 1}
        x2={CW}
        y2={CH - 1}
        stroke={COLORS.line}
        strokeWidth="2"
      />
      {/* area */}
      <path
        d={area}
        fill="url(#chartArea)"
        opacity={interpolate(prog, [0.15, 0.6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - prog}
      />
      {/* line */}
      <path
        d={line}
        fill="none"
        stroke={COLORS.orange}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - prog}
      />
      {/* tip dot */}
      {prog > 0.02 && (
        <>
          <circle
            cx={tipX}
            cy={tipY}
            r={14}
            fill={COLORS.orange}
            opacity={0.16}
          />
          <circle cx={tipX} cy={tipY} r={7} fill={COLORS.orange} />
        </>
      )}
    </svg>
  );
};

export const RunTheCampaign: React.FC<{ showHeader?: boolean }> = ({
  showHeader = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  // headlines
  const hl1Op = interpolate(frame, [8, 22, 66, 82], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hl1Rise = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl1Sweep = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const hl2Op = interpolate(frame, [82, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hl2Rise = spring({
    frame: frame - 82,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl2Sweep = interpolate(frame, [104, 124], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ad card: appear + shrink to hero
  const appear = spring({
    frame: frame - CARD_APPEAR,
    fps,
    config: { damping: 14, stiffness: 140 },
  });
  const heroT = spring({
    frame: frame - HERO_A,
    fps,
    config: { damping: 20, stiffness: 90 },
  });
  const cardW = interpolate(heroT, [0, 1], [540, 290]);
  const cardH = cardW * (16 / 9);
  const cardCY = interpolate(heroT, [0, 1], [978, 662]);
  const liveOp = interpolate(heroT, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOp = interpolate(heroT, [0, 0.35], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const livePulse = 0.5 + 0.5 * Math.sin(frame / 5);

  // dashboard master
  const dash = spring({
    frame: frame - DASH_A,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  const countP = interpolate(frame, [COUNT_A, COUNT_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const chartP = interpolate(frame, [CHART_A, CHART_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {showHeader && (
          <>
            {/* ============ KICKER ============ */}
            <div
              style={{
                position: "absolute",
                top: 128,
                left: 0,
                right: 0,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: COLORS.orange,
                  padding: "10px 18px",
                  border: "1.5px solid rgba(255,79,1,0.28)",
                  borderRadius: 999,
                  background: "rgba(255,79,1,0.06)",
                  transform: `translateY(${(1 - kicker) * 16}px) scale(${0.92 + 0.08 * kicker})`,
                  opacity: kicker,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: COLORS.orange,
                    boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
                  }}
                />
                Made with Creatify
              </div>
            </div>

            {/* ============ HEADLINES ============ */}
            <div
              style={{
                position: "absolute",
                top: 208,
                left: 70,
                right: 70,
                textAlign: "center",
                height: 300,
              }}
            >
              <h1
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  margin: 0,
                  fontSize: 76,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -2,
                  color: COLORS.ink,
                  opacity: hl1Op,
                  transform: `translateY(${(1 - hl1Rise) * 18}px)`,
                }}
              >
                You watched AI make <Mark sweep={hl1Sweep}>the ad</Mark>.
              </h1>
              <h1
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  margin: 0,
                  fontSize: 76,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -2,
                  color: COLORS.ink,
                  opacity: hl2Op,
                  transform: `translateY(${(1 - hl2Rise) * 18}px)`,
                }}
              >
                Now watch it run the{" "}
                <Mark sweep={hl2Sweep}>whole campaign</Mark>.
              </h1>
            </div>
          </>
        )}

        {/* ============ AD CARD (hero) ============ */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: cardCY,
            width: cardW,
            height: cardH,
            transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * appear})`,
            opacity: appear,
            borderRadius: 30,
            overflow: "hidden",
            background: "#000",
            border: `1px solid ${COLORS.line}`,
            boxShadow: "0 30px 70px rgba(32,21,21,0.22)",
          }}
        >
          <OffthreadVideo
            src={staticFile("watch-ad.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* LIVE badge */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 13px",
              borderRadius: 999,
              background: "rgba(10,10,12,0.62)",
              backdropFilter: "blur(6px)",
              opacity: liveOp,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff3b30",
                opacity: 0.5 + 0.5 * livePulse,
                boxShadow: `0 0 ${6 + 6 * livePulse}px #ff3b30`,
              }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1,
                color: "#fff",
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* ============ BEAT-1 TAG (fades during shrink) ============ */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1512,
            textAlign: "center",
            opacity: tagOp * appear,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 26,
              fontWeight: 800,
              color: COLORS.ink,
            }}
          >
            <Img
              src={staticFile("creatify-fav.png")}
              style={{ width: 28, height: 28, borderRadius: 7 }}
            />
            Generated with Creatify
          </span>
        </div>

        {/* ============ DASHBOARD ============ */}
        {/* LIVE CAMPAIGN label */}
        <div
          style={{
            position: "absolute",
            top: 960,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: dash,
            transform: `translateY(${(1 - dash) * 14}px)`,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.greenInk,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(34,197,94,0.10)",
              border: "1.5px solid rgba(34,197,94,0.3)",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.green,
              }}
            />
            Live campaign
          </span>
        </div>

        {/* platform icons */}
        {PLATFORMS.map((p, i) => {
          const s = spring({
            frame: frame - (DASH_A + 8 + i * 12),
            fps,
            config: { damping: 13, stiffness: 160 },
          });
          const lit = frame >= DASH_A + 8 + i * 12 + 16;
          return (
            <div
              key={p.key}
              style={{
                position: "absolute",
                left: p.x,
                top: 1096,
                transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * s})`,
                opacity: s,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 104,
                  height: 104,
                  borderRadius: 26,
                  background: "#fff",
                  border: `1px solid ${lit ? "rgba(255,79,1,0.4)" : COLORS.line}`,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 16px 34px rgba(32,21,21,0.12)",
                }}
              >
                <Img
                  src={staticFile(`logos/${p.key}.svg`)}
                  style={{
                    width: p.key === "tiktok" ? 50 : 58,
                    height: p.key === "tiktok" ? 50 : 58,
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -9,
                    right: -9,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: lit ? COLORS.green : "#e7e2dc",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 900,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {lit ? "✓" : ""}
                </div>
              </div>
            </div>
          );
        })}

        {/* metric cards */}
        {METRICS.map((m, i) => {
          const s = spring({
            frame: frame - (DASH_A + 26 + i * 12),
            fps,
            config: { damping: 14, stiffness: 150 },
          });
          return (
            <div
              key={m.label}
              style={{
                position: "absolute",
                left: m.x,
                top: 1310,
                width: 280,
                transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * s})`,
                opacity: s,
                background: "#fff",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 22,
                padding: "24px 20px",
                boxShadow: "0 18px 38px rgba(32,21,21,0.10)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  color: COLORS.ink,
                }}
              >
                {m.fmt(m.target * countP)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{ fontSize: 24, fontWeight: 700, color: COLORS.muted }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: COLORS.greenInk,
                  }}
                >
                  ▲
                </span>
              </div>
            </div>
          );
        })}

        {/* chart card */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 1470,
            height: 320,
            background: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 26,
            padding: "24px 30px",
            boxShadow: "0 18px 40px rgba(32,21,21,0.10)",
            opacity: dash,
            transform: `translateY(${(1 - dash) * 16}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: COLORS.ink,
                letterSpacing: -0.4,
              }}
            >
              Reach · last 7 days
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: COLORS.greenInk,
                padding: "4px 12px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.12)",
              }}
            >
              ▲ {Math.round(chartP * 312)}%
            </span>
          </div>
          <Chart prog={chartP} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
