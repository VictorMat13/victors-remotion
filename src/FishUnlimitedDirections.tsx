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

const MONO =
  "'SF Mono', ui-monospace, Menlo, 'Cascadia Mono', 'Roboto Mono', monospace";

// "The directions are unlimited — you can just write how it should sound in
// plain English." — 15 words ≈ 6s spoken. Follows the real-UI tag-picker shot,
// so it opens on the preset chips, then the free-text field takes over.
export const DURATION_IN_FRAMES = 180;

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

// Preset chips — same set the viewer just saw in the real tag-picker shot.
const CHIPS = [
  "[excited]",
  "[whispering]",
  "[sad]",
  "[angry]",
  "[soft]",
  "[breathy]",
  "[laughing]",
];

const TYPE_RATE = 1.8; // chars per frame
const CLEAR_RATE = 9;

const DIRECTIONS = [
  { text: "whisper it like a secret", start: 30, holdUntil: 72 },
  { text: "a sports commentator losing his mind", start: 77, holdUntil: 124 },
  { text: "warm, tired, late-night radio host", start: 129, holdUntil: 180 },
];

const typeDoneFrame = (d: (typeof DIRECTIONS)[number]) =>
  d.start + Math.ceil(d.text.length / TYPE_RATE);

const visibleText = (frame: number): string => {
  for (let k = DIRECTIONS.length - 1; k >= 0; k--) {
    const d = DIRECTIONS[k];
    if (frame < d.start) continue;
    const typed = Math.min(
      d.text.length,
      Math.floor((frame - d.start) * TYPE_RATE),
    );
    const cleared =
      frame > d.holdUntil ? Math.floor((frame - d.holdUntil) * CLEAR_RATE) : 0;
    return d.text.slice(0, Math.max(0, typed - cleared));
  }
  return "";
};

const BAR_COUNT = 34;
const barBase = (i: number) => 0.35 + 0.65 * Math.abs(Math.sin(i * 2.9 + 0.8));

export const FishUnlimitedDirections: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.6 },
    durationInFrames: 24,
  });

  // Chips recede as the free-text field takes focus.
  const recede = interpolate(frame, [24, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const focus = interpolate(frame, [26, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const text = visibleText(frame);
  const isTyping = DIRECTIONS.some(
    (d) => frame >= d.start && frame < typeDoneFrame(d),
  );
  const cursorOn = isTyping || Math.floor(frame / 9) % 2 === 0;

  // Border pulse each time a direction finishes typing.
  const donePulse = DIRECTIONS.reduce((acc, d) => {
    const t = typeDoneFrame(d);
    return (
      acc +
      interpolate(frame, [t, t + 4, t + 18], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }, 0);

  // Per-direction wave morph springs (computed per bar with stagger below).
  const waveSpring = (k: number, i: number) =>
    spring({
      frame: frame - typeDoneFrame(DIRECTIONS[k]) - 2 - i * 0.7,
      fps,
      config: { damping: 12, stiffness: 130 },
      durationInFrames: 26,
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
          top: 148,
          height: 784,
          borderRadius: 44,
          background: "rgba(255,255,255,0.72)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow:
            "0 40px 90px rgba(75,63,176,0.15), 0 4px 18px rgba(24,21,40,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
          padding: "48px 56px",
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

        {/* Preset tag chips — the "starter list" */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            opacity: 1 - recede * 0.75,
            transform: `translateY(${-6 * recede}px) scale(${1 - 0.05 * recede})`,
            transformOrigin: "left top",
          }}
        >
          {CHIPS.map((c, i) => (
            <div
              key={c}
              style={{
                fontFamily: MONO,
                fontSize: 27,
                fontWeight: 500,
                color: interpolateColors(
                  recede,
                  [0, 1],
                  [COLORS.ink, COLORS.muted],
                ),
                background: "#ffffff",
                border: `1.5px solid ${COLORS.line}`,
                borderRadius: 12,
                padding: "9px 20px",
                opacity: interpolate(enter, [0, 1], [0, 1]),
                transform: `translateY(${(1 - spring({ frame: frame - 4 - i * 2, fps, config: { damping: 14, stiffness: 160 }, durationInFrames: 20 })) * 24}px)`,
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Free-text direction field */}
        <div
          style={{
            marginTop: 30,
            height: 176,
            borderRadius: 24,
            background: "#ffffff",
            border: `2.5px solid ${
              focus > 0.5 ? COLORS.purpleDeep : COLORS.line
            }`,
            boxShadow: `0 0 0 ${6 * focus}px rgba(155,144,232,${
              0.12 + 0.22 * donePulse
            }), 0 10px 30px rgba(107,95,208,${0.06 + 0.14 * donePulse})`,
            padding: "30px 34px",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 40,
              lineHeight: 1.4,
              fontWeight: 600,
              color: COLORS.ink,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {text}
            <span
              style={{
                display: "inline-block",
                width: 5,
                height: 42,
                marginLeft: 4,
                verticalAlign: "-6px",
                borderRadius: 2,
                background: COLORS.purpleDeep,
                opacity: focus * (cursorOn ? 1 : 0.15),
              }}
            />
          </div>
        </div>

        {/* Waveform — reshapes with every direction */}
        <div
          style={{
            marginTop: 30,
            height: 260,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const s1 = waveSpring(0, i);
            const s2 = waveSpring(1, i);
            const s3 = waveSpring(2, i);

            // Idle: small, waiting.
            const idleH =
              16 + 22 * barBase(i) + 3 * Math.sin(frame * 0.3 + i * 1.7);
            // Whisper: low, soft, slow sway.
            const whisperH =
              34 + 44 * barBase(i) + 6 * Math.sin(frame * 0.22 + i * 0.9);
            // Commentator: tall, jagged, fast jitter.
            const shoutH =
              (112 + 114 * barBase((i * 5 + 2) % BAR_COUNT)) *
              (1 + 0.1 * Math.sin(frame * 0.85 + i * 2.3));
            // Radio host: medium, rolling traveling wave.
            const radioH =
              (78 + 54 * Math.abs(Math.sin(i * 0.45 + 1.1))) *
              (1 + 0.12 * Math.sin(frame * 0.16 - i * 0.55));

            let h = idleH;
            h += (whisperH - h) * s1;
            h += (shoutH - h) * s2;
            h += (radioH - h) * s3;

            // Ink while idle/whispering, brand purple as the energy rises.
            let purpleAmount = 0;
            purpleAmount += (0.15 - purpleAmount) * s1;
            purpleAmount += (1 - purpleAmount) * s2;
            purpleAmount += (0.65 - purpleAmount) * s3;
            const color = interpolateColors(
              purpleAmount,
              [0, 1],
              [COLORS.ink, COLORS.purpleDeep],
            );
            return (
              <div
                key={i}
                style={{
                  width: 14,
                  height: Math.max(10, h),
                  borderRadius: 7,
                  background: color,
                  opacity: 0.4 + 0.5 * Math.max(s1, s2, s3, 0.2),
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
