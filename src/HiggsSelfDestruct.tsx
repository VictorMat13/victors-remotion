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

export const DURATION_IN_FRAMES = 180; // 6s @ 30fps

// Paper Liam palette + Higgsfield lime live-state
const COLORS = {
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  lime: "#84CC16",
  limeDeep: "#65A30D",
  red: "#EF4444",
  redDeep: "#C0262C",
  cable: "#D9D3CA",
  metal: "#E5E0D8",
  deadLine: "#DAD5CE",
  deadText: "#9AA0A6",
  deadDot: "#C4BEB4",
};

const FONT = fontFamily;

// Beat timeline — one camera arc: card → button → press → back to card
const T = {
  press: 54, // button depresses
  det: 74, // pulse reaches the card — power-down cascade begins
};

const CARD_CY = 368;
const CARD_W = 520;
const CARD_BOTTOM = 549;
const BTN_CY = 830;
const PLATE_TOP = 740;

// ---------------------------------------------------------------------------
// Status chip — lime LIVE; on power-down it flickers out and dies in place
// (no re-pop, no red: dead hardware is gray and quiet)
// ---------------------------------------------------------------------------

const StatusChip: React.FC<{ pop: number; detAt: number }> = ({
  pop,
  detAt,
}) => {
  const frame = useCurrentFrame();
  const dead = frame >= detAt;
  const pulse = 0.55 + 0.45 * Math.sin(frame / 7);
  // brief LED flicker as power is lost
  const flicker = !dead
    ? 1
    : frame < detAt + 2
      ? 0.3
      : frame < detAt + 4
        ? 1
        : frame < detAt + 6
          ? 0.45
          : 1;
  const borderColor = dead ? COLORS.deadLine : COLORS.limeDeep;
  const bg = dead ? "rgba(25,23,20,0.03)" : "rgba(132,204,22,0.14)";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 26px",
        borderRadius: 999,
        background: bg,
        border: `1.5px solid ${borderColor}`,
        transform: `scale(${0.7 + 0.3 * pop})`,
        opacity: pop,
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, opacity: flicker }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: dead ? "transparent" : COLORS.lime,
            border: dead ? `2px solid ${COLORS.deadDot}` : "none",
            boxShadow: dead
              ? "none"
              : `0 0 ${9 + 7 * pulse}px rgba(132,204,22,0.55)`,
          }}
        />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: 3,
            color: dead ? COLORS.deadText : COLORS.limeDeep,
          }}
        >
          {dead ? "OFFLINE" : "LIVE"}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const HiggsSelfDestruct: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera rig: focal point (540, cy) mapped to canvas center, zoom z ----
  const camEase = Easing.inOut(Easing.cubic);
  const camCy = interpolate(
    frame,
    [0, 14, 42, 56, 84, 180],
    [400, 400, 830, 830, 390, 390],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: camEase,
    },
  );
  const camZBase = interpolate(
    frame,
    [0, 14, 42, 56, 84, 180],
    [1.35, 1.37, 2.08, 2.14, 1.25, 1.21],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: camEase,
    },
  );
  // tiny punch on the press
  const punch = interpolate(frame, [53, 56, 64], [0, 0.05, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camZ = camZBase + punch;

  // --- Power-down cascade ------------------------------------------------------
  // pill dies at det, logo drains at det+6, wordmark dims at det+10,
  // glow is gone by det+16, shadow tightens with the sink
  const dark = interpolate(frame, [T.det, T.det + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const logoDrain = interpolate(frame, [T.det + 6, T.det + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inkDim = interpolate(frame, [T.det + 10, T.det + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Card --------------------------------------------------------------------
  const cardIn = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const shakeT = frame - T.det;
  const shake =
    shakeT >= 0 && shakeT < 12
      ? Math.sin(shakeT * 2.1) * 4 * (1 - shakeT / 12)
      : 0;
  const sink =
    spring({
      frame: frame - T.det - 4,
      fps,
      config: { damping: 18, stiffness: 60 },
    }) * 8;
  const cardShadow = `0 ${26 - 14 * dark}px ${60 - 32 * dark}px rgba(25,23,20,${0.1 - 0.04 * dark})`;

  // --- Status chip ----------------------------------------------------------------
  const liveIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // --- Button -----------------------------------------------------------------------
  const pressDown = spring({
    frame: frame - T.press,
    fps,
    config: { damping: 14, stiffness: 400 },
  });
  const rippleT = frame - T.press;
  const rippleR = 62 + Math.max(0, rippleT) * 7;
  const rippleO = rippleT >= 0 && rippleT < 9 ? 0.32 * (1 - rippleT / 9) : 0;

  // --- Cable pulse ---------------------------------------------------------------------
  const pulseY = interpolate(
    frame,
    [T.press + 1, T.det - 2],
    [PLATE_TOP, CARD_BOTTOM + 3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.quad),
    },
  );
  const pulseVisible = frame > T.press && frame <= T.det - 2;
  const cableHot = frame > T.press && frame < T.det + 2;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* Camera world */}
      <AbsoluteFill
        style={{
          transform: `translate(540px, 540px) scale(${camZ}) translate(-540px, ${-camCy}px)`,
          transformOrigin: "0 0",
        }}
      >
        {/* Grid — generous bleed so the camera never sees its edge */}
        <div
          style={{
            position: "absolute",
            left: -400,
            top: -500,
            width: 1880,
            height: 2100,
            backgroundImage:
              "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 1 - dark * 0.5,
          }}
        />

        {/* Lime glow anchored to the card — simply dies with the power */}
        <div
          style={{
            position: "absolute",
            left: 540 - 620,
            top: CARD_CY - 620,
            width: 1240,
            height: 1240,
            background:
              "radial-gradient(circle at 50% 50%, rgba(132,204,22,0.13), rgba(0,0,0,0) 62%)",
            opacity: 1 - dark,
          }}
        />

        {/* Cable */}
        <svg
          width="1080"
          height="1080"
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={540}
            y1={CARD_BOTTOM}
            x2={540}
            y2={PLATE_TOP}
            stroke={cableHot ? "rgba(239,68,68,0.75)" : COLORS.cable}
            strokeWidth={4}
          />
          <circle cx={540} cy={CARD_BOTTOM + 4} r={6} fill="#C6BFB4" />
          <circle cx={540} cy={PLATE_TOP - 2} r={6} fill="#C6BFB4" />
          {pulseVisible && (
            <circle cx={540} cy={pulseY} r={7} fill={COLORS.red} />
          )}
        </svg>

        {/* Product card */}
        <div
          style={{
            position: "absolute",
            left: 540,
            top: CARD_CY,
            width: CARD_W,
            transform: `translate(-50%, -50%) translate(${shake}px, ${(1 - cardIn) * 30 + sink}px) scale(${(0.96 + 0.04 * cardIn) - 0.012 * dark})`,
            opacity: cardIn,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 40,
            boxShadow: cardShadow,
            padding: "48px 40px 42px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
          }}
        >
          <Img
            src={staticFile("fable5/higgsfield-icon.png")}
            style={{
              width: 112,
              height: 112,
              borderRadius: 26,
              filter: `grayscale(${logoDrain * 0.9}) brightness(${1 - logoDrain * 0.08}) opacity(${1 - logoDrain * 0.4})`,
            }}
          />
          <div
            style={{
              fontFamily: FONT,
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: inkDim > 0.5 ? COLORS.muted : COLORS.ink,
              lineHeight: 1,
            }}
          >
            Higgsfield
          </div>
          <StatusChip pop={liveIn} detAt={T.det} />
        </div>

        {/* Button assembly — machined plate, recessed well, flat red button */}
        <div
          style={{
            position: "absolute",
            left: 540,
            top: BTN_CY,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Plate */}
          <div
            style={{
              position: "absolute",
              left: -115,
              top: -80,
              width: 230,
              height: 160,
              borderRadius: 26,
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              boxShadow: "0 22px 50px rgba(25,23,20,0.12)",
            }}
          >
            {[
              { l: 12, t: 12 },
              { l: 208, t: 12 },
              { l: 12, t: 138 },
              { l: 208, t: 138 },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: s.l,
                  top: s.t,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: COLORS.metal,
                  border: "1px solid #D3CCC2",
                }}
              />
            ))}
          </div>

          {/* Recessed well */}
          <div
            style={{
              position: "absolute",
              left: -64,
              top: -64,
              width: 128,
              height: 128,
              borderRadius: 999,
              background: "#F1EEE9",
              border: `1px solid ${COLORS.line}`,
              boxShadow: "inset 0 3px 7px rgba(25,23,20,0.10)",
            }}
          />

          {/* Press ripple — thin and quick */}
          {rippleO > 0 && (
            <div
              style={{
                position: "absolute",
                left: -rippleR,
                top: -rippleR,
                width: rippleR * 2,
                height: rippleR * 2,
                borderRadius: 999,
                border: `2px solid ${COLORS.red}`,
                opacity: rippleO,
              }}
            />
          )}

          {/* Flat red button with crisp mechanical travel */}
          <div
            style={{
              position: "absolute",
              left: -50,
              top: -52 + pressDown * 6,
              width: 100,
              height: 100,
              borderRadius: 999,
              background: COLORS.red,
              boxShadow: `0 ${6 - pressDown * 5}px 0 ${COLORS.redDeep}, inset 0 2px 0 rgba(255,255,255,0.28), 0 ${12 - pressDown * 6}px 20px rgba(185,28,28,0.22)`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
