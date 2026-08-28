import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 170;

// Promptible "white / paper" style — Fish Audio brand accent (purple)
const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8",
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
  dead: "#C7C2D6",
  deadLine: "#d7d2e0",
  red: "#EF4444",
  green: "#22C55E",
};

// ---- fish mark (whale = stacked audio bars), tight viewBox, single fill ----
const FISH_BARS = [
  "m277.1 198c4.42 0 8 3.58 8 8v3.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-3.4c0-4.42 3.58-8 8-8z",
  "m310 200.7c4.42 0 8 3.58 8 8v14.7c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-14.7c0-4.42 3.58-8 8-8z",
  "m342.9 196.4c4.42 0 8 3.58 8 8v61.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-61.4c0-4.42 3.58-8 8-8z",
  "m375.9 190c4.42 0 8 3.58 8 8v4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-4c0-4.42 3.58-8 8-8z",
  "m375.9 243.4c4.42 0 8 3.58 8 8v42.3c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-42.3c0-4.42 3.58-8 8-8z",
  "m663.7 183.2c4.42 0 8 3.58 8 8v44.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-44.2c0-4.42 3.58-8 8-8z",
  "m631.9 176.1c4.42 0 8 3.58 8 8v59.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-59.4c0-4.42 3.58-8 8-8z",
  "m599.9 173c4.42 0 8 3.58 8 8v70.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-70.6c0-4.42 3.58-8 8-8z",
  "m567.9 175c4.42 0 8 3.58 8 8v71.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-71.8c0-4.42 3.58-8 8-8z",
  "m536.1 179.9c4.42 0 8 3.58 8 8v91.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-91.1c0-4.42 3.58-8 8-8z",
  "m503.5 188.2c4.42 0 8 3.58 8 8v104.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-104.1c0-4.42 3.58-8 8-8z",
  "m471.6 202.1c4.42 0 8 3.58 8 8v99.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-99.8c0-4.42 3.58-8 8-8z",
  "m439.6 220.4c4.42 0 8 3.58 8 8v86.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-86.2c0-4.42 3.58-8 8-8z",
  "m695.7 202.1c4.42 0 8 3.58 8 8v22c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-22c0-4.42 3.58-8 8-8z",
  "m407.6 233.1c4.42 0 8 3.58 8 8v84.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-84.8c0-4.42 3.58-8 8-8z",
  "m695.7 247.9c4.42 0 8 3.58 8 8v11.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-11.1c0-4.42 3.58-8 8-8z",
  "m663.7 254.6c4.42 0 8 3.58 8 8v31.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-31.4c0-4.42 3.58-8 8-8z",
  "m631.9 262.3c4.42 0 8 3.58 8 8v36.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-36.1c0-4.42 3.58-8 8-8z",
  "m599.9 268.7c4.42 0 8 3.58 8 8v35.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-35.6c0-4.42 3.58-8 8-8z",
  "m567.9 274.4c4.42 0 8 3.58 8 8v30c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-30c0-4.42 3.58-8 8-8z",
  "m536.1 297.3c4.42 0 8 3.58 8 8v5.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-5.4c0-4.42 3.58-8 8-8z",
];

const FishMark: React.FC<{ color: string; style?: React.CSSProperties }> = ({
  color,
  style,
}) => (
  <svg
    viewBox="269.1 173 434.6 160.9"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <g fill={color}>
      {FISH_BARS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </svg>
);

// hex lerp helper
const hx = (h: string) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const lerpColor = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(740px 700px at 50% 50%, rgba(155,144,232,0.14), rgba(155,144,232,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(24,21,40,0.030) 1px, transparent 1px), linear-gradient(90deg, rgba(24,21,40,0.030) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        WebkitMaskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// ---- waveform geometry ----
const NUM = 45;
const WAVE_W = 720;
const WAVE_LEFT = (1080 - WAVE_W) / 2;
const BASE_Y = 546;
const MAX_AMP = 128; // half-height ceiling

const ampBase = (i: number) => {
  const t = i / (NUM - 1);
  const env = 0.42 + 0.58 * Math.sin(t * Math.PI); // hump: quieter at the edges
  const detail =
    0.38 + 0.62 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37 + 1));
  return env * detail; // ~0..1
};

export const FishAudioRevived: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 14], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chip = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const panel = spring({
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  // Fish "jolt" — chip pulses as it fires the revival
  const jolt = interpolate(frame, [46, 54, 64], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // revival sweep left -> right
  const sweepFront = interpolate(frame, [52, 96], [0, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const rev = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }); // 0 dead -> 1 alive (drives status dot)

  const revived = spring({
    frame: frame - 96,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  const dotColor = lerpColor(COLORS.red, COLORS.green, rev);

  const bars = Array.from({ length: NUM }).map((_, i) => {
    const pos = i / (NUM - 1);
    const active = interpolate(sweepFront - pos, [0, 0.07], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const bounce = 0.5 + 0.5 * Math.sin(frame * 0.23 + i * 0.55);
    const liveHalf = Math.max(9, ampBase(i) * MAX_AMP * (0.45 + 0.55 * bounce));
    const half = 3 + active * (liveHalf - 3);
    const color = lerpColor(COLORS.dead, COLORS.purpleDeep, active);
    const x = WAVE_LEFT + pos * WAVE_W;
    return { x, half, color, active };
  });

  const barW = 9;
  const avgActive = bars.reduce((s, b) => s + b.active, 0) / NUM;
  const pulseX = WAVE_LEFT + Math.min(sweepFront, 1) * WAVE_W;
  const pulseVisible = sweepFront > 0.001 && sweepFront < 1.04;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- FISH AUDIO CHIP (source) ---------- */}
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 30px 16px 24px",
              borderRadius: 999,
              background: "#ffffff",
              border: `1.5px solid ${COLORS.line}`,
              boxShadow: `0 16px 38px rgba(75,63,176,${0.08 + jolt * 0.22})`,
              transform: `translateY(${(1 - chip) * 14}px) scale(${
                (0.9 + 0.1 * chip) * (1 + jolt * 0.05)
              })`,
              opacity: chip,
            }}
          >
            <FishMark
              color={COLORS.ink}
              style={{ width: 82, height: "auto", display: "block" }}
            />
            <span
              style={{
                fontSize: 33,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: COLORS.ink,
              }}
            >
              Fish Audio
            </span>
          </div>
        </div>

        {/* ---------- MONITOR PANEL ---------- */}
        <div
          style={{
            position: "absolute",
            left: 110,
            right: 110,
            top: 346,
            height: 400,
            borderRadius: 40,
            background: "rgba(255,255,255,0.72)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 40px 90px rgba(75,63,176,0.12), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            transform: `translateY(${(1 - panel) * 26}px) scale(${0.96 + 0.04 * panel})`,
            opacity: panel,
          }}
        >
          {/* panel header: VOICE AGENT + status dot */}
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 40,
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: dotColor,
                boxShadow: `0 0 0 5px ${dotColor}22, 0 0 ${8 + rev * 12}px ${dotColor}`,
              }}
            />
            <span
              style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: 3.5,
                textTransform: "uppercase",
                color: COLORS.muted,
              }}
            >
              Voice agent
            </span>
          </div>
        </div>

        {/* ---------- WAVEFORM (on top of panel) ---------- */}
        <div style={{ position: "absolute", inset: 0, opacity: panel }}>
          {/* zero-axis baseline — solid & flat while dead, fades as it revives */}
          <div
            style={{
              position: "absolute",
              left: WAVE_LEFT,
              width: WAVE_W,
              top: BASE_Y - 3,
              height: 6,
              borderRadius: 3,
              background: COLORS.deadLine,
              opacity: 0.5 + 0.5 * (1 - avgActive),
            }}
          />
          {/* bars */}
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x - barW / 2,
                top: BASE_Y - b.half,
                width: barW,
                height: b.half * 2,
                borderRadius: barW / 2,
                background: b.color,
              }}
            />
          ))}
          {/* traveling revival pulse */}
          {pulseVisible && (
            <div
              style={{
                position: "absolute",
                left: pulseX - 45,
                top: BASE_Y - MAX_AMP - 24,
                width: 90,
                height: (MAX_AMP + 24) * 2,
                background:
                  "radial-gradient(closest-side, rgba(155,144,232,0.55), rgba(155,144,232,0) 72%)",
                filter: "blur(2px)",
              }}
            />
          )}
        </div>

        {/* ---------- REVIVED payoff ---------- */}
        <div
          style={{
            position: "absolute",
            top: 800,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 34px",
              borderRadius: 999,
              background: "rgba(155,144,232,0.12)",
              border: "1.5px solid rgba(107,95,208,0.34)",
              transform: `translateY(${(1 - revived) * 16}px) scale(${0.8 + 0.2 * revived})`,
              opacity: revived,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: COLORS.purpleDeep,
                color: "#fff",
                fontSize: 18,
                fontWeight: 900,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 14px rgba(107,95,208,0.4)",
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: COLORS.purpleInk,
              }}
            >
              Revived
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
