import React from "react";
import {
  AbsoluteFill,
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

export const DURATION_IN_FRAMES = 230;

// Promptible "white / paper" style — blue accent, green = verified
const COLORS = {
  paper: "#fbfbf9",
  ink: "#1B1720",
  muted: "#8B8594",
  line: "#ece8e3",
  blue: "#3B82F6",
  blueDeep: "#2563EB",
  green: "#16A34A",
  greenLite: "#22C55E",
};

const CX = 540;
const HUB = { x: CX, y: 800, size: 270 };

const SOURCES = [
  { name: "Yahoo Finance", file: "yahoo-finance.png", x: 165, y: 1150 },
  { name: "IMF", file: "imf.svg", x: 330, y: 1340 },
  { name: "World Bank", file: "worldbank.png", x: 540, y: 1410 },
  { name: "Google Scholar", file: "scholar.svg", x: 750, y: 1340 },
  { name: "arXiv", file: "arxiv.png", x: 915, y: 1150 },
];
const CHIP = 132;
const POP_START = 96;
const POP_STEP = 15;

// -------------------------------------------------------------------------
// Paper background — soft blue glow + masked grid (Promptible signature)
// -------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 1200px at 50% 42%, rgba(59,130,246,0.09), rgba(59,130,246,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        WebkitMaskImage:
          "radial-gradient(820px 1240px at 50% 48%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(820px 1240px at 50% 48%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// -------------------------------------------------------------------------
// Highlighter sweep behind a key word
// -------------------------------------------------------------------------
const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  color?: string;
  rot?: number;
}> = ({ children, progress, color = COLORS.blue, rot = -1.4 }) => (
  <span
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      display: "inline-block",
      zIndex: 1,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: color,
        opacity: 0.24,
        zIndex: -1,
        transform: `rotate(${rot}deg) scaleX(${progress})`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

export const KimiTraceableSources: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // intro
  const introBlur = interpolate(frame, [0, 14], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker + headline
  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const line1 = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const line2 = spring({
    frame: frame - 14,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const hlSweep = interpolate(frame, [28, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // hub: pops in blurred (continuity with the tease insert), then reveals
  const hubIn = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const qBadge = spring({
    frame: frame - 52,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const reveal = interpolate(frame, [64, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const logoBlur = 14 * (1 - reveal);
  const checkBadge = spring({
    frame: frame - 74,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const nameIn = spring({
    frame: frame - 76,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // gentle float on the hub
  const float = Math.sin(frame / 17) * 6;
  const qWiggle = Math.sin(frame / 9) * 6;

  // all-sources-in glow on hub
  const hubGlow = interpolate(
    frame,
    [POP_START + 4 * POP_STEP + 10, POP_START + 4 * POP_STEP + 28],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // payoff
  const pay = spring({
    frame: frame - 176,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const paySweep = interpolate(frame, [190, 208], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const hubY = HUB.y + float;
  // lines originate behind the card so packets appear to flow into it
  const hubBottom = { x: HUB.x, y: hubY + HUB.size / 4 };

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 268,
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
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3.5,
              textTransform: "uppercase",
              color: COLORS.blueDeep,
              padding: "10px 22px",
              border: "1.5px solid rgba(59,130,246,0.28)",
              borderRadius: 999,
              background: "rgba(59,130,246,0.05)",
              transform: `translateY(${(1 - kicker) * 14}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.blue,
                boxShadow: "0 0 0 4px rgba(59,130,246,0.15)",
              }}
            />
            The best part
          </div>
        </div>

        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 352,
            left: 60,
            right: 60,
            textAlign: "center",
            fontSize: 66,
            lineHeight: 1.12,
            fontWeight: 800,
            letterSpacing: -1.6,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - line1) * 18}px)`,
              opacity: line1,
            }}
          >
            All the info is correct
          </div>
          <div
            style={{
              transform: `translateY(${(1 - line2) * 18}px)`,
              opacity: line2,
            }}
          >
            and{" "}
            <Hl progress={hlSweep} color={COLORS.greenLite}>
              fully traceable
            </Hl>
          </div>
        </div>

        {/* ---------- CONNECTORS + PACKETS ---------- */}
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {SOURCES.map((s, i) => {
            const popStart = POP_START + i * POP_STEP;
            const pop = spring({
              frame: frame - popStart,
              fps,
              config: { damping: 15, stiffness: 140 },
            });
            const draw = interpolate(pop, [0.15, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const chipTop = { x: s.x, y: s.y - CHIP / 2 - 8 };
            const ex = hubBottom.x + (chipTop.x - hubBottom.x) * draw;
            const ey = hubBottom.y + (chipTop.y - hubBottom.y) * draw;

            // data packet flowing source -> hub, looping
            const packetStart = popStart + 26;
            const period = 52;
            const active = frame >= packetStart;
            const t = active ? ((frame - packetStart) % period) / period : 0;
            const px = chipTop.x + (hubBottom.x - chipTop.x) * t;
            const py = chipTop.y + (hubBottom.y - chipTop.y) * t;
            const packetOp = active
              ? interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            return (
              <g key={s.name}>
                <line
                  x1={hubBottom.x}
                  y1={hubBottom.y}
                  x2={ex}
                  y2={ey}
                  stroke="rgba(139,133,148,0.35)"
                  strokeWidth={3}
                  strokeDasharray="8 9"
                  strokeLinecap="round"
                />
                <circle
                  cx={px}
                  cy={py}
                  r={8}
                  fill={COLORS.blue}
                  opacity={packetOp * 0.9}
                />
                <circle
                  cx={px + (chipTop.x - hubBottom.x) * 0.04}
                  cy={py + (chipTop.y - hubBottom.y) * 0.04}
                  r={5}
                  fill={COLORS.blue}
                  opacity={packetOp * 0.35}
                />
              </g>
            );
          })}
        </svg>

        {/* ---------- HUB (Kimi) ---------- */}
        <div
          style={{
            position: "absolute",
            left: HUB.x - HUB.size / 2,
            top: hubY - HUB.size / 2,
          }}
        >
          <div
            style={{
              width: HUB.size,
              height: HUB.size,
              transform: `scale(${0.6 + 0.4 * hubIn})`,
              opacity: hubIn,
              borderRadius: HUB.size * 0.24,
              background: "#ffffff",
              border: `1.5px solid ${hubGlow > 0.01 ? COLORS.greenLite : COLORS.line}`,
              boxShadow:
                hubGlow > 0.01
                  ? `0 0 0 ${2 + hubGlow * 5}px rgba(34,197,94,${0.1 + hubGlow * 0.14}), 0 22px 46px rgba(22,163,74,0.20)`
                  : "0 18px 40px rgba(27,23,32,0.10)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile("kimi-slides/kimi-512.png")}
              style={{
                width: HUB.size * 0.56,
                height: HUB.size * 0.56,
                borderRadius: HUB.size * 0.13,
                filter: `blur(${logoBlur}px)`,
                transform: `scale(${1.08 - reveal * 0.08})`,
              }}
            />
          </div>
          {/* ? badge — fades out on reveal */}
          <div
            style={{
              position: "absolute",
              top: -16,
              right: -16,
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: COLORS.blue,
              color: "#fff",
              fontSize: 35,
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 10px 24px rgba(37,99,235,0.35)",
              opacity: qBadge * (1 - reveal),
              transform: `scale(${0.5 + 0.5 * qBadge}) rotate(${qWiggle}deg)`,
            }}
          >
            ?
          </div>
          {/* ✓ badge — pops on reveal */}
          <div
            style={{
              position: "absolute",
              top: -16,
              right: -16,
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: COLORS.greenLite,
              color: "#fff",
              fontSize: 34,
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 10px 24px rgba(22,163,74,0.35)",
              opacity: checkBadge,
              transform: `scale(${0.4 + 0.6 * checkBadge})`,
            }}
          >
            ✓
          </div>
          {/* name */}
          <div
            style={{
              position: "absolute",
              left: -60,
              right: -60,
              top: HUB.size + 18,
              textAlign: "center",
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -1,
              color: COLORS.ink,
              opacity: nameIn,
              transform: `translateY(${(1 - nameIn) * 12}px)`,
            }}
          >
            Kimi
          </div>
        </div>

        {/* ---------- SOURCE CHIPS ---------- */}
        {SOURCES.map((s, i) => {
          const popStart = POP_START + i * POP_STEP;
          const pop = spring({
            frame: frame - popStart,
            fps,
            config: { damping: 13, stiffness: 160 },
          });
          const check = spring({
            frame: frame - (popStart + 14),
            fps,
            config: { damping: 10, stiffness: 180 },
          });
          return (
            <div
              key={s.name}
              style={{
                position: "absolute",
                left: s.x - CHIP / 2,
                top: s.y - CHIP / 2,
              }}
            >
              <div
                style={{
                  width: CHIP,
                  height: CHIP,
                  transform: `scale(${0.5 + 0.5 * pop})`,
                  opacity: pop,
                  borderRadius: CHIP * 0.24,
                  background: "#ffffff",
                  border: `1.5px solid ${COLORS.line}`,
                  boxShadow: "0 14px 30px rgba(27,23,32,0.09)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Img
                  src={staticFile(`kimi-slides/${s.file}`)}
                  style={{
                    width: CHIP * 0.6,
                    height: CHIP * 0.6,
                    objectFit: "contain",
                  }}
                />
              </div>
              {/* verified check */}
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: -10,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: COLORS.greenLite,
                  color: "#fff",
                  fontSize: 21,
                  fontWeight: 900,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 14px rgba(22,163,74,0.35)",
                  opacity: check,
                  transform: `scale(${0.4 + 0.6 * check})`,
                }}
              >
                ✓
              </div>
              {/* label */}
              <div
                style={{
                  position: "absolute",
                  left: -70,
                  right: -70,
                  top: CHIP + 12,
                  textAlign: "center",
                  fontSize: 30,
                  fontWeight: 700,
                  color: COLORS.muted,
                  opacity: pop,
                }}
              >
                {s.name}
              </div>
            </div>
          );
        })}

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 1596,
            textAlign: "center",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1.12,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 14}px)`,
            opacity: pay,
          }}
        >
          Every number has a{" "}
          <Hl progress={paySweep} color={COLORS.greenLite} rot={-1.1}>
            source
          </Hl>
          .
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
