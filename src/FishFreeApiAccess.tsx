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

const MONO =
  "'SF Mono', ui-monospace, Menlo, 'Cascadia Mono', 'Roboto Mono', monospace";

// "Developers get free access to S2.1 Pro through the API until July 31." —
// 12 words ≈ 5s spoken. API request fires → usage climbs while cost stays
// pinned at $0.00 → JUL 31 deadline chip.
export const DURATION_IN_FRAMES = 150;

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

const TYPE_RATE = 2;
const LINE1 = "POST api.fish.audio/v1/tts";
const LINE1_START = 12;
const LINE2 = 'model: "s2.1-pro"';
const LINE2_START = LINE1_START + Math.ceil(LINE1.length / TYPE_RATE) + 4;
const SEND_FRAME = LINE2_START + Math.ceil(LINE2.length / TYPE_RATE) + 6; // ≈ 57
const COUNT_START = SEND_FRAME + 10;
const COUNT_END = 138;
const CHIP_FRAME = 100;

const RESP_BARS = 18;
const respBase = (i: number) => 0.3 + 0.7 * Math.abs(Math.sin(i * 2.3 + 0.6));

export const FishFreeApiAccess: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 1.6 },
    durationInFrames: 24,
  });

  const typed = (text: string, start: number) =>
    text.slice(0, Math.max(0, Math.floor((frame - start) * TYPE_RATE)));
  const line1 = typed(LINE1, LINE1_START);
  const line2 = typed(LINE2, LINE2_START);
  const typingLine = frame < LINE2_START ? 1 : frame < SEND_FRAME - 6 ? 2 : 0;

  const statusIn = spring({
    frame: frame - SEND_FRAME,
    fps,
    config: { damping: 13, stiffness: 180 },
    durationInFrames: 20,
  });
  // Flash sweep across the code panel when the request fires.
  const sendFlash = interpolate(
    frame,
    [SEND_FRAME - 2, SEND_FRAME + 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Requests climb fast, easing out near the end; cost never moves.
  const requests = Math.floor(
    interpolate(frame, [COUNT_START, COUNT_END], [0, 2148], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const statsIn = spring({
    frame: frame - SEND_FRAME - 4,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 22,
  });
  // Gentle heartbeat on the $0.00 while requests are streaming in.
  const costPulse =
    frame > COUNT_START && frame < COUNT_END
      ? 1 + 0.025 * Math.sin((frame - COUNT_START) * 0.35)
      : 1;

  const chipIn = spring({
    frame: frame - CHIP_FRAME,
    fps,
    config: { damping: 11, stiffness: 200 },
    durationInFrames: 22,
  });

  const settle = interpolate(frame, [136, 150], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursor = (
    <span
      style={{
        display: "inline-block",
        width: 4,
        height: 36,
        marginLeft: 3,
        verticalAlign: "-5px",
        borderRadius: 2,
        background: COLORS.purpleDeep,
      }}
    />
  );

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
          top: 200,
          height: 680,
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

        {/* API request panel */}
        <div
          style={{
            marginTop: 32,
            height: 320,
            borderRadius: 24,
            background: "#ffffff",
            border: `2px solid ${COLORS.line}`,
            padding: "34px 38px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Send flash sweep */}
          {sendFlash > 0 && sendFlash < 1 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${-30 + 130 * sendFlash}%`,
                width: "30%",
                background:
                  "linear-gradient(90deg, rgba(155,144,232,0) 0%, rgba(155,144,232,0.16) 50%, rgba(155,144,232,0) 100%)",
              }}
            />
          )}

          <div
            style={{
              fontFamily: MONO,
              fontSize: 34,
              lineHeight: 1.75,
              fontWeight: 600,
            }}
          >
            <div>
              <span style={{ color: COLORS.purpleDeep, fontWeight: 700 }}>
                {line1.slice(0, 4)}
              </span>
              <span style={{ color: COLORS.ink }}>{line1.slice(4)}</span>
              {typingLine === 1 && cursor}
            </div>
            <div>
              <span style={{ color: COLORS.muted }}>{line2.slice(0, 6)}</span>
              <span style={{ color: COLORS.purpleInk }}>{line2.slice(6)}</span>
              {typingLine === 2 && cursor}
            </div>
          </div>

          {/* Response: status + waveform */}
          <div
            style={{
              marginTop: 26,
              display: "flex",
              alignItems: "center",
              gap: 26,
              opacity: statusIn,
              transform: `translateY(${(1 - statusIn) * 24}px)`,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 32,
                fontWeight: 700,
                color: COLORS.purpleDeep,
                whiteSpace: "nowrap",
              }}
            >
              ▸ 200 OK
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 96,
              }}
            >
              {Array.from({ length: RESP_BARS }).map((_, i) => {
                const pop = spring({
                  frame: frame - SEND_FRAME - 2 - i * 1.2,
                  fps,
                  config: { damping: 12, stiffness: 170 },
                  durationInFrames: 22,
                });
                const dance =
                  1 + 0.18 * settle * Math.sin(frame * 0.34 + i * 1.1);
                return (
                  <div
                    key={i}
                    style={{
                      width: 11,
                      height: Math.max(
                        8,
                        (26 + 62 * respBase(i)) * pop * dance,
                      ),
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

        {/* Usage + cost + deadline */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "center",
            gap: 44,
            opacity: statsIn,
            transform: `translateY(${(1 - statsIn) * 30}px)`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 5,
                color: COLORS.muted,
              }}
            >
              REQUESTS
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 62,
                fontWeight: 800,
                color: COLORS.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {requests.toLocaleString("en-US")}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 5,
                color: COLORS.muted,
              }}
            >
              COST
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 62,
                fontWeight: 800,
                color: COLORS.purpleInk,
                fontVariantNumeric: "tabular-nums",
                transform: `scale(${costPulse})`,
                transformOrigin: "left center",
              }}
            >
              $0.00
            </div>
          </div>

          <div
            style={{
              marginLeft: "auto",
              opacity: chipIn,
              transform: `scale(${0.5 + 0.5 * chipIn}) rotate(${-6 * (1 - chipIn)}deg)`,
              padding: "16px 30px",
              borderRadius: 999,
              border: `3px solid ${COLORS.purpleDeep}`,
              background: "#ffffff",
              boxShadow: "0 12px 34px rgba(107,95,208,0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                color: COLORS.muted,
              }}
            >
              ENDS
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: COLORS.purpleInk,
                whiteSpace: "nowrap",
              }}
            >
              JUL 31
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
