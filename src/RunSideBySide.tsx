import React from "react";
import {
  AbsoluteFill,
  Loop,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 150; // 5s max

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  orange: "#ff4f01",
  orangeBg: "rgba(255,79,1,0.07)",
  orangeBorder: "rgba(255,79,1,0.28)",
};

const CARD_W = 580;
const CARD_H = 1031; // 9:16
const CY = 930;
const STRIDE = CARD_W + 44;

// 3 clips (Angle 03 / clip.mp4 cut). `frames` = length at 30fps → loop to avoid freeze.
const CARDS = [
  { src: "ads/projector-ad-1.mp4", label: "Angle 01", frames: 421 },
  { src: "vidmuse/result-b0f11207.mp4", label: "Angle 02", frames: 300 },
  { src: "ads/ad-comp.mp4", label: "Angle 03", frames: 81 },
];

const T_KICKER = 4;
const T_HEAD = 12;
const T_HEAD_SWEEP_A = 28;
const T_HEAD_SWEEP_B = 46;

// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(940px 1080px at 50% 52%, rgba(255,79,1,0.07), rgba(255,79,1,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.022) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(820px 1040px at 50% 54%, #000 46%, transparent 86%)",
        maskImage:
          "radial-gradient(820px 1040px at 50% 54%, #000 46%, transparent 86%)",
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

// =========================================================================
// Carousel card — all cards always mounted; position/scale driven by `active`.
// =========================================================================
const CarouselCard: React.FC<{
  src: string;
  label: string;
  frames: number;
  i: number;
  active: number;
  dotPulse: number;
}> = ({ src, label, frames, i, active, dotPulse }) => {
  const rel = i - active;
  const dist = Math.min(Math.abs(rel), 1);
  const offsetX = rel * STRIDE;
  const scale = 1 - 0.09 * dist;
  const opacity = 1 - 0.4 * dist;
  const zIndex = 10 - Math.round(Math.abs(rel) * 10);

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: CY,
        width: CARD_W,
        height: CARD_H,
        transform: `translate(-50%,-50%) translateX(${offsetX}px) scale(${scale})`,
        opacity,
        zIndex,
        borderRadius: 30,
        overflow: "hidden",
        background: "#000",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 26px 60px rgba(32,21,21,0.18)",
      }}
    >
      <Loop durationInFrames={frames}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Loop>
      {/* angle chip */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(10,10,12,0.55)",
          backdropFilter: "blur(6px)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: COLORS.orange,
            opacity: 0.5 + 0.5 * dotPulse,
            boxShadow: `0 0 ${4 + 5 * dotPulse}px ${COLORS.orange}`,
          }}
        />
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

// =========================================================================
export const RunSideBySide: React.FC = () => {
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

  // carousel: hold card0 → swipe to 1 → hold → swipe to 2 → hold
  const swipe1 = interpolate(frame, [46, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const swipe2 = interpolate(frame, [96, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const active = swipe1 + swipe2;

  const dotPulse = 0.5 + 0.5 * Math.sin(frame / 5);

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Background />

      {/* ============ HEADER ============ */}
      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        <div
          style={{
            position: "absolute",
            top: 150,
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
            Change the prompt
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 222,
            left: 80,
            right: 80,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.8,
              color: COLORS.ink,
              opacity: headOp,
              transform: `translateY(${(1 - headRise) * 16}px)`,
            }}
          >
            New angle, <Mark sweep={headSweep}>new video</Mark>
          </h1>
        </div>
      </AbsoluteFill>

      {/* ============ CAROUSEL ============ */}
      <AbsoluteFill style={{ opacity: introOp }}>
        {CARDS.map((c, i) => (
          <CarouselCard
            key={c.src}
            src={c.src}
            label={c.label}
            frames={c.frames}
            i={i}
            active={active}
            dotPulse={dotPulse}
          />
        ))}

        {/* dots indicator */}
        <div
          style={{
            position: "absolute",
            top: 1520,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
          }}
        >
          {CARDS.map((c, i) => {
            const on = 1 - Math.min(Math.abs(i - active), 1);
            return (
              <div
                key={c.src}
                style={{
                  width: 14 + 26 * on,
                  height: 14,
                  borderRadius: 999,
                  background: on > 0.5 ? COLORS.orange : "#d8d2cb",
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
