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

// "The same voice builds tension, then switches into excitement like a real
// person reacting." — 14 words ≈ 5.5s spoken. Switch lands where "then
// switches…" starts in the read (~2.3s).
export const DURATION_IN_FRAMES = 165;
const SWITCH_FRAME = 70;

// Promptible "white / paper" style — recolored to the Fish Audio brand accent
const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8",
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
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

const BAR_COUNT = 34;
const MARKER_INDEX = Math.round(BAR_COUNT * 0.55);

// Deterministic per-bar base shape (0..1)
const barBase = (i: number) => 0.35 + 0.65 * Math.abs(Math.sin(i * 2.9 + 0.8));

export const FishTensionSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.6 },
    durationInFrames: 24,
  });

  // Playhead travels the wave; pinned to the marker exactly at the switch.
  const CARD_W = 896;
  const INNER_W = CARD_W - 112;
  const markerX = INNER_W * 0.55;
  const playheadX = interpolate(
    frame,
    [10, SWITCH_FRAME, 150],
    [0, markerX, INNER_W],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const settle = interpolate(frame, [148, 165], [1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Anticipation dip right before the burst.
  const dip = interpolate(
    frame,
    [SWITCH_FRAME - 5, SWITCH_FRAME, SWITCH_FRAME + 3],
    [1, 0.82, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Radial pulse from the marker at the switch.
  const pulse = interpolate(frame, [SWITCH_FRAME, SWITCH_FRAME + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Intensity curve: slow climb through tension, spike at the switch.
  const CURVE_H = 110;
  const intensityAt = (x: number) => {
    const f = interpolate(x, [0, INNER_W], [10, 150]);
    if (f <= SWITCH_FRAME) {
      return interpolate(f, [10, SWITCH_FRAME], [0.15, 0.38]);
    }
    return interpolate(
      f,
      [SWITCH_FRAME, SWITCH_FRAME + 8, 150],
      [0.38, 0.9, 0.82],
      {
        extrapolateRight: "clamp",
      },
    );
  };
  const revealFrac = playheadX / INNER_W;
  const curvePoints = Array.from({ length: 61 }, (_, k) => {
    const x = (INNER_W / 60) * k;
    return `${x},${CURVE_H - intensityAt(x) * CURVE_H}`;
  }).join(" ");

  const tenseTagOpacity = interpolate(
    frame,
    [SWITCH_FRAME, SWITCH_FRAME + 10],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const excitedTag = spring({
    frame: frame - SWITCH_FRAME - 4,
    fps,
    config: { damping: 11, stiffness: 200 },
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily }}>
      {/* Soft brand backdrop */}
      <FishMark
        color={COLORS.purple}
        style={{
          position: "absolute",
          width: 1250,
          left: -140,
          top: 330,
          opacity: 0.07,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 92,
          right: 92,
          top: 170,
          height: 740,
          borderRadius: 44,
          background: "rgba(255,255,255,0.72)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow:
            "0 40px 90px rgba(75,63,176,0.15), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
          padding: "52px 56px",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px)`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: COLORS.purpleDeep,
              boxShadow: `0 0 0 ${5 + 3 * Math.sin(frame * 0.28)}px rgba(155,144,232,0.20)`,
            }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 6,
              color: COLORS.muted,
            }}
          >
            S2.1 PRO
          </div>
          <div style={{ marginLeft: "auto" }}>
            <FishMark
              color={COLORS.purpleDeep}
              style={{ width: 96, display: "block" }}
            />
          </div>
        </div>

        {/* Emotion tags */}
        <div style={{ position: "relative", height: 64, marginTop: 40 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              opacity: tenseTagOpacity,
              padding: "10px 24px",
              borderRadius: 999,
              border: `2.5px solid ${COLORS.ink}`,
              fontSize: 34,
              fontWeight: 700,
              color: COLORS.ink,
              background: "#ffffff",
            }}
          >
            [tense]
          </div>
          <div
            style={{
              position: "absolute",
              left: markerX - 90,
              opacity: excitedTag,
              transform: `scale(${0.5 + 0.5 * excitedTag}) rotate(${-5 * (1 - excitedTag)}deg)`,
              padding: "10px 24px",
              borderRadius: 999,
              border: `2.5px solid ${COLORS.purpleDeep}`,
              fontSize: 34,
              fontWeight: 700,
              color: COLORS.purpleInk,
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(107,95,208,0.25)",
            }}
          >
            [excited]
          </div>
        </div>

        {/* Waveform */}
        <div
          style={{
            position: "relative",
            marginTop: 26,
            height: 290,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            // Tension: low, compressed, trembling — jitter ramps up over time.
            const jitterAmp = interpolate(frame, [10, SWITCH_FRAME], [3, 11], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const tenseH =
              (44 +
                62 * barBase(i) +
                jitterAmp * Math.sin(frame * 0.9 + i * 2.1)) *
              dip;

            // Excitement: tall, bouncy — radial sweep outward from the marker.
            const delay = Math.abs(i - MARKER_INDEX) * 1.1;
            const barSwitch = spring({
              frame: frame - SWITCH_FRAME - delay,
              fps,
              config: { damping: 10, stiffness: 150 },
              durationInFrames: 26,
            });
            const dance = 1 + 0.16 * settle * Math.sin(frame * 0.42 + i * 1.23);
            const excitedH =
              (150 + 120 * barBase((i * 7 + 3) % BAR_COUNT)) * dance;

            const h = tenseH + (excitedH - tenseH) * barSwitch;
            const color = interpolateColors(
              barSwitch,
              [0, 1],
              [COLORS.ink, COLORS.purpleDeep],
            );
            return (
              <div
                key={i}
                style={{
                  width: 14,
                  height: Math.max(12, h),
                  borderRadius: 7,
                  background: color,
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* Emotion marker tick */}
          <div
            style={{
              position: "absolute",
              left: markerX,
              top: 8,
              bottom: 8,
              width: 3,
              borderRadius: 2,
              background: COLORS.purple,
              opacity: 0.55,
            }}
          />

          {/* Playhead */}
          <div
            style={{
              position: "absolute",
              left: playheadX,
              top: 0,
              bottom: 0,
              width: 4,
              borderRadius: 2,
              background: COLORS.ink,
              boxShadow: "0 0 22px 5px rgba(24,21,40,0.18)",
              opacity: interpolate(frame, [8, 14], [0, 0.9], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />

          {/* Switch pulse */}
          {pulse > 0 && pulse < 1 && (
            <div
              style={{
                position: "absolute",
                left: markerX - 130 * pulse,
                top: 145 - 130 * pulse,
                width: 260 * pulse,
                height: 260 * pulse,
                borderRadius: "50%",
                border: `3px solid ${COLORS.purple}`,
                opacity: 1 - pulse,
              }}
            />
          )}
        </div>

        {/* Intensity curve */}
        <div style={{ marginTop: 36 }}>
          <svg
            width={INNER_W}
            height={CURVE_H}
            style={{ display: "block", overflow: "visible" }}
          >
            <polyline
              points={curvePoints}
              fill="none"
              stroke={COLORS.line}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <polyline
              points={curvePoints}
              fill="none"
              stroke={COLORS.purpleDeep}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - revealFrac}
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
