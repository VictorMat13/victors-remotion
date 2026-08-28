import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 180;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  card: "#ffffff",
  orange: "#ff4f01",
  orangeLite: "#ff7a3c",
  red: "#DC2626",
  redBg: "rgba(220,38,38,0.06)",
  redBorder: "rgba(220,38,38,0.4)",
  orangeBg: "rgba(255,79,1,0.07)",
  orangeBorder: "rgba(255,79,1,0.28)",
};

// 8% side padding on 1080 → content x[86, 994], width 908
const CONTENT_LEFT = 86;
const CONTENT_W = 908;

const PROMPT = "make me a product ad";

// -------- timing (30fps · 180 frames) --------
const T_KICKER = 4;
const T_HEAD = 12;
const T_HEAD_SWEEP_A = 28;
const T_HEAD_SWEEP_B = 46;
const T_BOX = 18;
const TYPE_A = 32;
const TYPE_B = 80;
const STRIKE_A = 92;
const STRIKE_B = 112;

// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 900px at 50% 46%, rgba(255,79,1,0.07), rgba(255,79,1,0) 62%)",
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
          "radial-gradient(760px 760px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(760px 760px at 50% 50%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

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
        opacity: 0.22,
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

const Sparkle: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <path
      d="M12 2 L13.6 8.6 L20.5 10.2 L13.6 11.8 L12 18.4 L10.4 11.8 L3.5 10.2 L10.4 8.6 Z"
      fill={color}
    />
    <path
      d="M19 3 L19.7 5.3 L22 6 L19.7 6.7 L19 9 L18.3 6.7 L16 6 L18.3 5.3 Z"
      fill={color}
      opacity="0.7"
    />
  </svg>
);

const ArrowUp: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <path
      d="M12 4 L12 20 M12 4 L6 10 M12 4 L18 10"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// =========================================================================
export const NeverPromptThis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = (delay: number, damping = 14, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness } });

  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = sp(T_KICKER, 15, 160);
  const headRise = sp(T_HEAD, 16, 140);
  const headOp = interpolate(frame, [T_HEAD, T_HEAD + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headSweep = interpolate(
    frame,
    [T_HEAD_SWEEP_A, T_HEAD_SWEEP_B],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  const box = sp(T_BOX, 15, 120);

  // typewriter
  const typedCount = Math.floor(
    interpolate(frame, [TYPE_A, TYPE_B], [0, PROMPT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = PROMPT.slice(0, typedCount);
  const typing = frame >= TYPE_A && frame < STRIKE_A;
  const cursorOn = typing && Math.floor(frame / 8) % 2 === 0;

  // rejection
  const strike = interpolate(frame, [STRIKE_A, STRIKE_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rejected = frame >= STRIKE_A;
  const boxBorder = interpolateColors(
    frame,
    [STRIKE_A, STRIKE_A + 12],
    [COLORS.line, COLORS.red],
  );
  const sendReject = interpolate(frame, [STRIKE_A, STRIKE_A + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // DON'T stamp slam
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Background />
      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {/* ============ KICKER ============ */}
        <div
          style={{
            position: "absolute",
            top: 298,
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
              border: `1.5px solid ${COLORS.orangeBorder}`,
              borderRadius: 999,
              background: COLORS.orangeBg,
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
            Rule #1
          </div>
        </div>

        {/* ============ HEADLINE ============ */}
        <div
          style={{
            position: "absolute",
            top: 364,
            left: CONTENT_LEFT,
            width: CONTENT_W,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.8,
              color: COLORS.ink,
              opacity: headOp,
              transform: `translateY(${(1 - headRise) * 16}px)`,
            }}
          >
            <Mark sweep={headSweep}>Never</Mark> prompt this
          </h1>
        </div>

        {/* ============ PROMPT BOX ============ */}
        <div
          style={{
            position: "absolute",
            left: CONTENT_LEFT,
            top: 526,
            width: CONTENT_W,
            height: 250,
            transform: `scale(${0.9 + 0.1 * box})`,
            transformOrigin: "center",
            opacity: box,
            background: COLORS.card,
            border: `2px solid ${boxBorder}`,
            borderRadius: 28,
            boxShadow: rejected
              ? "0 20px 46px rgba(220,38,38,0.14)"
              : "0 20px 46px rgba(32,21,21,0.10)",
            padding: "30px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkle size={26} color={COLORS.orange} />
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.muted,
                letterSpacing: 0.2,
              }}
            >
              Prompt to VidMuse
            </span>
          </div>

          {/* input row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div
              style={{
                position: "relative",
                fontSize: 48,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: -0.6,
              }}
            >
              <span style={{ position: "relative" }}>
                {typed || "​"}
                {/* strike-through */}
                <span
                  style={{
                    position: "absolute",
                    left: -4,
                    right: -6,
                    top: "54%",
                    height: 7,
                    background: COLORS.red,
                    borderRadius: 4,
                    transform: `scaleX(${strike})`,
                    transformOrigin: "left center",
                  }}
                />
              </span>
              {cursorOn && <span style={{ color: COLORS.orange }}>▊</span>}
            </div>

            {/* send button */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: rejected ? "#d8d2cb" : COLORS.orange,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: rejected
                    ? "none"
                    : "0 8px 18px rgba(255,79,1,0.3)",
                }}
              >
                <ArrowUp size={30} color="#fff" />
              </div>
              {/* reject cross */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  opacity: sendReject,
                  fontSize: 44,
                  fontWeight: 900,
                  color: COLORS.red,
                }}
              >
                ✕
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
