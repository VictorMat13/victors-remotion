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

export const DURATION_IN_FRAMES = 180;

// Promptible "white / paper" style — recolored to the Fish Audio brand accent
const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8",
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
  green: "#2fae63",
};

// Fish Audio mark — the whale, built from stacked audio bars.
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

// Timeline (30fps / 180f):
//   0-18   card springs in, waveform already playing
//  22-88   scan sweep + confidence ticks to 99.2%
//  92-116  ✓ HUMAN verdict stamp
// 118-146  3D flip → Fish Audio back face
// 150-180  chip pops, settle hold
const FLIP_START = 118;
const FLIP_END = 146;

const BAR_COUNT = 30;

export const FishDetectorFooled: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.6 },
    durationInFrames: 26,
  });

  const rot = interpolate(frame, [FLIP_START, FLIP_END], [0, 180], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flipped = rot >= 90;

  // Confidence readout: 0 → 99.2, eased so the last digits crawl in.
  const confidence = interpolate(frame, [26, 88], [0, 99.2], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scan line: two passes over the waveform while analyzing.
  const scanX = interpolate(frame, [22, 54, 86], [0, 100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanOpacity = interpolate(frame, [20, 26, 82, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stamp = spring({
    frame: frame - 92,
    fps,
    config: { damping: 12, stiffness: 200 },
    durationInFrames: 22,
  });

  const chip = spring({
    frame: frame - 150,
    fps,
    config: { damping: 13, stiffness: 180 },
    durationInFrames: 20,
  });

  // Gentle breathe on the settled back face for a living end hold.
  const settle = interpolate(frame, [FLIP_END, DURATION_IN_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = 1 + 0.008 * Math.sin(settle * Math.PI * 2);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily }}>
      {/* Soft brand backdrop — background layers may bleed edge to edge */}
      <FishMark
        color={COLORS.purple}
        style={{
          position: "absolute",
          width: 1500,
          left: -210,
          top: 210,
          opacity: 0.07,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -300,
          top: 1150,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(155,144,232,0.16) 0%, rgba(155,144,232,0) 70%)",
        }}
      />

      {/* Perspective stage */}
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 560,
          height: 820,
          perspective: 1500,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px)`,
        }}
      >
        {/* Rotator */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `rotateY(${rot}deg) scale(${flipped ? breathe : 1})`,
          }}
        >
          {/* ------------------------------------------------ FRONT: scanner */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: 44,
              background: "rgba(255,255,255,0.72)",
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow:
                "0 40px 90px rgba(75,63,176,0.15), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
              padding: "58px 56px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: COLORS.purpleDeep,
                  boxShadow: `0 0 0 ${5 + 3 * Math.sin(frame * 0.28)}px rgba(155,144,232,0.20)`,
                }}
              />
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: 6,
                  color: COLORS.muted,
                }}
              >
                VOICE AUTHENTICITY
              </div>
            </div>

            {/* Waveform */}
            <div
              style={{
                position: "relative",
                marginTop: 62,
                height: 190,
                display: "flex",
                alignItems: "center",
                gap: 9,
                overflow: "hidden",
              }}
            >
              {Array.from({ length: BAR_COUNT }).map((_, i) => {
                const base = 34 + 130 * Math.abs(Math.sin(i * 3.7 + 1.2));
                const wiggle = flipped
                  ? 1
                  : 0.72 + 0.28 * Math.sin(frame * 0.34 + i * 1.31);
                return (
                  <div
                    key={i}
                    style={{
                      width: 15,
                      height: Math.max(14, base * wiggle),
                      borderRadius: 8,
                      background: COLORS.ink,
                      opacity: 0.88,
                    }}
                  />
                );
              })}
              {/* Scan sweep */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${scanX}%`,
                  width: 5,
                  borderRadius: 3,
                  background: COLORS.purpleDeep,
                  boxShadow: "0 0 26px 7px rgba(107,95,208,0.45)",
                  opacity: scanOpacity,
                }}
              />
            </div>

            {/* Confidence readout */}
            <div style={{ marginTop: 58 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    letterSpacing: 5,
                    color: COLORS.muted,
                  }}
                >
                  HUMAN
                </div>
                <div
                  style={{
                    fontSize: 118,
                    fontWeight: 800,
                    color: COLORS.ink,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {confidence.toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  marginTop: 30,
                  height: 16,
                  borderRadius: 999,
                  background: "rgba(24,21,40,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${confidence}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleDeep})`,
                  }}
                />
              </div>
            </div>

            {/* Verdict stamp */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 74,
                display: "flex",
                justifyContent: "center",
                opacity: stamp,
                transform: `scale(${0.4 + 0.6 * stamp}) rotate(${-7 * stamp}deg)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 44px",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: `4px solid ${COLORS.green}`,
                  boxShadow: "0 14px 34px rgba(24,21,40,0.10)",
                }}
              >
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 12.5l5 5 10-11"
                    stroke={COLORS.green}
                    strokeWidth={3.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: COLORS.ink,
                  }}
                >
                  HUMAN
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------ BACK: the reveal */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 44,
              background: `linear-gradient(160deg, ${COLORS.purple} 0%, ${COLORS.purpleDeep} 68%, ${COLORS.purpleInk} 100%)`,
              boxShadow:
                "0 40px 90px rgba(75,63,176,0.28), 0 4px 18px rgba(24,21,40,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 34,
            }}
          >
            <FishMark
              color="#ffffff"
              style={{ width: 340, height: "auto", display: "block" }}
            />
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: 1,
              }}
            >
              fish.audio
            </div>
            <div
              style={{
                opacity: chip,
                transform: `translateY(${(1 - chip) * 26}px) scale(${0.7 + 0.3 * chip})`,
                padding: "14px 34px",
                borderRadius: 999,
                border: "2.5px solid rgba(255,255,255,0.75)",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 5,
                color: "#ffffff",
              }}
            >
              AI-GENERATED
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
