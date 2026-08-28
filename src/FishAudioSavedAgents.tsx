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

export const DURATION_IN_FRAMES = 150;

// Promptible "white / paper" style — recolored to the Fish Audio brand accent
const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8", // Fish Audio brand accent
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
};

// -------------------------------------------------------------------------
// Fish Audio mark — the whale, built from stacked audio bars.
// Extracted from the official brand SVG; tight viewBox on the fish group.
// Single-fill so it reads clean as a soft backdrop or a crisp chip.
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// Paper background — soft purple glow + masked grid (Promptible signature)
// -------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(760px 720px at 50% 42%, rgba(155,144,232,0.16), rgba(155,144,232,0) 62%)",
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
          "radial-gradient(700px 700px at 50% 48%, #000 40%, transparent 82%)",
        maskImage:
          "radial-gradient(700px 700px at 50% 48%, #000 40%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

// -------------------------------------------------------------------------
// Highlighter sweep behind the key phrase
// -------------------------------------------------------------------------
const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  rot?: number;
}> = ({ children, progress, rot = -1.2 }) => (
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
        left: -14,
        right: -14,
        top: "10%",
        bottom: "8%",
        background: COLORS.purple,
        opacity: 0.32,
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

export const FishAudioSavedAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // scene intro
  const introBlur = interpolate(frame, [0, 14], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // blurred whale hero — ambient, stays soft, gently breathing
  const heroIn = interpolate(frame, [4, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const breathe = 1 + 0.022 * Math.sin(frame / 30);
  const driftX = Math.sin(frame / 42) * 9;
  const driftY = Math.cos(frame / 36) * 7;

  // kicker + brand chip
  const kicker = spring({
    frame: frame - 6,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const chip = spring({
    frame: frame - 30,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  // frosted glass card
  const card = spring({
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  // caption lines
  const l1 = spring({
    frame: frame - 24,
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const l2 = spring({
    frame: frame - 33,
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const l3 = spring({
    frame: frame - 42,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  // highlighter sweep on the payoff phrase
  const hlSweep = interpolate(frame, [58, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // subtle emphasis pop on the payoff line as it highlights
  const payPop = interpolate(frame, [58, 70, 82], [1, 1.035, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{
          opacity: introOp,
          filter: `blur(${introBlur}px)`,
        }}
      >
        {/* ---------- BLURRED WHALE HERO (soft, recognizable, upper) ---------- */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 372,
            width: 800,
            transform: `translate(-50%, -50%) translate(${driftX}px, ${driftY}px) scale(${
              (0.92 + 0.08 * heroIn) * breathe
            })`,
            opacity: heroIn * 0.62,
            filter: "blur(17px)",
          }}
        >
          {/* soft glow puddle behind the mark */}
          <div
            style={{
              position: "absolute",
              inset: "-26% -8%",
              background:
                "radial-gradient(closest-side, rgba(155,144,232,0.5), rgba(155,144,232,0) 72%)",
            }}
          />
          <FishMark
            color={COLORS.purpleDeep}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* ---------- KICKER PILL ---------- */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 11,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.purpleInk,
              padding: "11px 22px",
              border: "1.5px solid rgba(107,95,208,0.30)",
              borderRadius: 999,
              background: "rgba(155,144,232,0.08)",
              transform: `translateY(${(1 - kicker) * 14}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.purple,
                boxShadow: "0 0 0 5px rgba(155,144,232,0.18)",
              }}
            />
            The verdict
          </div>
        </div>

        {/* ---------- FROSTED GLASS CAPTION CARD ---------- */}
        <div
          style={{
            position: "absolute",
            left: 110,
            right: 110,
            top: 486,
            padding: "64px 62px 68px",
            borderRadius: 44,
            background: "rgba(255,255,255,0.60)",
            border: "1.5px solid rgba(255,255,255,0.85)",
            boxShadow:
              "0 40px 90px rgba(75,63,176,0.15), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
            backdropFilter: "blur(9px)",
            WebkitBackdropFilter: "blur(9px)",
            transform: `translateY(${(1 - card) * 30}px) scale(${0.95 + 0.05 * card})`,
            opacity: card,
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 66,
              lineHeight: 1.14,
              fontWeight: 800,
              letterSpacing: -1.6,
              color: COLORS.ink,
            }}
          >
            <div
              style={{
                transform: `translateY(${(1 - l1) * 16}px)`,
                opacity: l1,
              }}
            >
              This voice AI platform
            </div>
            <div
              style={{
                transform: `translateY(${(1 - l2) * 16}px)`,
                opacity: l2,
              }}
            >
              may have actually
            </div>
            <div
              style={{
                transform: `translateY(${(1 - l3) * 16}px) scale(${payPop})`,
                opacity: l3,
                marginTop: 4,
              }}
            >
              <Hl progress={hlSweep}>saved voice agents</Hl>.
            </div>
          </div>
        </div>

        {/* ---------- BRAND CHIP (crisp signature) ---------- */}
        <div
          style={{
            position: "absolute",
            bottom: 88,
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
              padding: "15px 26px 15px 22px",
              borderRadius: 999,
              background: "#ffffff",
              border: `1.5px solid ${COLORS.line}`,
              boxShadow: "0 14px 34px rgba(24,21,40,0.08)",
              transform: `translateY(${(1 - chip) * 14}px) scale(${0.9 + 0.1 * chip})`,
              opacity: chip,
            }}
          >
            <FishMark
              color={COLORS.ink}
              style={{ width: 74, height: "auto", display: "block" }}
            />
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: COLORS.ink,
              }}
            >
              Fish Audio
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
