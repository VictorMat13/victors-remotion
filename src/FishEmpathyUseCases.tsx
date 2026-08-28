import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

// "Use it for voiceovers, emotional ads, or a voice agent that needs empathy
// when a customer is upset." — 17 words ≈ 6.5s spoken.
export const DURATION_IN_FRAMES = 195;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8",
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
  red: "#e05555",
};

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

const cardShell: React.CSSProperties = {
  position: "absolute",
  left: 54,
  width: 972,
  borderRadius: 44,
  background: "rgba(255,255,255,0.72)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow:
    "0 40px 90px rgba(75,63,176,0.12), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
  padding: "40px 48px",
};

const CategoryChip: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 5,
      color: "#8B8594",
    }}
  >
    {label}
  </div>
);

const EmotionTag: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      marginLeft: "auto",
      opacity: pop,
      transform: `scale(${0.6 + 0.4 * pop})`,
      padding: "8px 20px",
      borderRadius: 999,
      border: "2.5px solid #6b5fd0",
      fontSize: 28,
      fontWeight: 700,
      color: "#4b3fb0",
      background: "#ffffff",
    }}
  >
    {text}
  </div>
);

export const FishEmpathyUseCases: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = (start: number, damping = 14) =>
    spring({
      frame: frame - start,
      fps,
      config: { damping, stiffness: 130 },
      durationInFrames: 24,
    });

  const headerIn = pop(0);
  const card1 = pop(8);
  const card2 = pop(45);
  const card3 = pop(78);

  // Card 3 story: angry message → calm voice reply → tension drains.
  const angryIn = spring({
    frame: frame - 86,
    fps,
    config: { damping: 11, stiffness: 240 },
    durationInFrames: 18,
  });
  const angryPulse = interpolate(frame, [86, 96, 116], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replyIn = pop(118, 12);
  const calm = interpolate(frame, [118, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const empathTag = pop(124, 11);

  const settle = interpolate(frame, [180, 195], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardStyle = (p: number): React.CSSProperties => ({
    opacity: p,
    transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + 0.04 * p})`,
  });

  // Voiceover card: playhead sweeping the script lines.
  const readX = interpolate(frame % 90, [0, 90], [0, 100]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily }}>
      <FishMark
        color={COLORS.purple}
        style={{
          position: "absolute",
          width: 1500,
          left: -220,
          top: 1210,
          opacity: 0.06,
        }}
      />

      {/* Brand chip */}
      <div
        style={{
          position: "absolute",
          top: 216,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: headerIn,
          transform: `translateY(${(1 - headerIn) * 30}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 40px",
            borderRadius: 999,
            background: "#ffffff",
            border: `1.5px solid ${COLORS.line}`,
            boxShadow: "0 14px 34px rgba(24,21,40,0.08)",
          }}
        >
          <FishMark
            color={COLORS.ink}
            style={{ width: 84, display: "block" }}
          />
          <span style={{ fontSize: 34, fontWeight: 700, color: COLORS.ink }}>
            fish.audio
          </span>
        </div>
      </div>

      {/* Card 1 — Voiceover */}
      <div
        style={{
          ...cardShell,
          top: 372,
          height: 260,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          ...cardStyle(card1),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CategoryChip label="VOICEOVER" />
          <EmotionTag
            text="[confident]"
            pop={interpolate(card1, [0.6, 1], [0, 1], {
              extrapolateLeft: "clamp",
            })}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[78, 92, 60].map((w, i) => (
            <div
              key={i}
              style={{
                height: 20,
                width: `${w}%`,
                borderRadius: 10,
                background: COLORS.line,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, Math.max(0, (readX - i * 22) * 1.8))}%`,
                  borderRadius: 10,
                  background: COLORS.purple,
                  opacity: 0.75,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 — Emotional ad */}
      <div
        style={{
          ...cardShell,
          top: 668,
          height: 280,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          ...cardStyle(card2),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CategoryChip label="AD" />
          <EmotionTag
            text="[warm]"
            pop={interpolate(card2, [0.6, 1], [0, 1], {
              extrapolateLeft: "clamp",
            })}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 200,
              height: 112,
              borderRadius: 18,
              background: COLORS.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width={34} height={34} viewBox="0 0 24 24" fill="#ffffff">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </div>
          <svg width={648} height={112} style={{ display: "block" }}>
            <polyline
              points={Array.from({ length: 41 }, (_, k) => {
                const x = (648 / 40) * k;
                const base = 96 - k * 1.5;
                const wob = 7 * Math.sin(k * 0.7 + frame * 0.09);
                return `${x},${Math.max(8, base + wob)}`;
              }).join(" ")}
              fill="none"
              stroke={COLORS.purpleDeep}
              strokeWidth={5}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Card 3 — Voice agent (hero) */}
      <div style={{ ...cardShell, top: 984, height: 440, ...cardStyle(card3) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CategoryChip label="SUPPORT AGENT" />
          <EmotionTag text="[empathetic]" pop={empathTag} />
        </div>

        {/* Customer bubble */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "flex-end",
            opacity: angryIn,
            transform: `translateX(${(1 - angryIn) * 60}px)`,
          }}
        >
          <div
            style={{
              maxWidth: 640,
              padding: "26px 34px",
              borderRadius: "28px 28px 6px 28px",
              background: "#ffffff",
              border: `3px solid ${interpolateColors(calm, [0, 1], [COLORS.red, COLORS.line])}`,
              boxShadow: `0 0 ${34 * angryPulse}px ${interpolateColors(angryPulse, [0, 1], ["rgba(224,85,85,0)", "rgba(224,85,85,0.45)"])}`,
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1.35,
              color: COLORS.ink,
            }}
          >
            This is the 3rd time it's broken!!
          </div>
        </div>

        {/* Agent voice reply */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: replyIn,
            transform: `translateY(${(1 - replyIn) * 36}px)`,
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: "50%",
              background: COLORS.purpleDeep,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FishMark color="#ffffff" style={{ width: 46, display: "block" }} />
          </div>
          <div
            style={{
              flexGrow: 1,
              padding: "24px 32px",
              borderRadius: "28px 28px 28px 6px",
              background: "rgba(155,144,232,0.14)",
              border: `1.5px solid ${COLORS.purple}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 108,
            }}
          >
            {Array.from({ length: 22 }).map((_, i) => {
              // Calm breathing wave — slow, smooth, low variance.
              const breathe =
                26 +
                18 * Math.abs(Math.sin(i * 1.1 + 0.5)) +
                8 * settle * Math.sin(frame * 0.14 + i * 0.55);
              return (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: replyIn * breathe,
                    borderRadius: 6,
                    background: COLORS.purpleDeep,
                    opacity: 0.85,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
