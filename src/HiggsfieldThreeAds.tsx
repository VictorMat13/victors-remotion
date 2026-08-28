import React from "react";
import {
  AbsoluteFill,
  Img,
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

export const DURATION_IN_FRAMES = 210; // 7s @ 30fps

const COLORS = {
  paper: "#FCFCFB",
  ink: "#191714",
  muted: "#6B7280",
  line: "#ECE8E2",
  card: "#FFFFFF",
  lime: "#CDF24E",
  limeDeep: "#B8DC3F",
};

const FONT = fontFamily;

// Timeline
const CARD_T = [10, 22, 34]; // staggered card drops — "three finished concepts"
const BUBBLE_T = 135; // "you send…"
const DELIVERED_T = 168;

const CLIPS = [
  "fable5/ads/AlessandroLavis_2058124824719843328.mp4",
  "fable5/ads/AlessandroLavis_2053776428995424256.mp4",
  "fable5/ads/FynCas_2069057920063438848.mp4",
];

// Fan layout: left / center / right
const FAN = [
  { x: -272, rot: -7, z: 1, w: 400 },
  { x: 0, rot: 0, z: 3, w: 440 },
  { x: 272, rot: 7, z: 2, w: 400 },
];

// ---------------------------------------------------------------------------
// Background — white paper + masked grid + soft lime glow behind the fan
// ---------------------------------------------------------------------------

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(760px 760px at 50% 42%, rgba(205,242,78,0.16), rgba(0,0,0,0) 66%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        WebkitMaskImage:
          "radial-gradient(780px 900px at 50% 46%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(780px 900px at 50% 46%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Higgsfield chip — light version for paper bg
// ---------------------------------------------------------------------------

const HiggsfieldChipLight: React.FC<{ pop: number }> = ({ pop }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 18,
      padding: "16px 34px 16px 18px",
      borderRadius: 999,
      background: COLORS.card,
      border: `1px solid ${COLORS.line}`,
      boxShadow: "0 14px 36px rgba(25,23,20,0.08)",
      opacity: pop,
      transform: `scale(${0.8 + 0.2 * pop}) translateY(${(1 - pop) * -18}px)`,
    }}
  >
    <Img
      src={staticFile("fable5/higgsfield-icon.png")}
      style={{ width: 62, height: 62, borderRadius: 16 }}
    />
    <span
      style={{
        fontFamily: FONT,
        fontSize: 42,
        fontWeight: 700,
        letterSpacing: -0.5,
        color: COLORS.ink,
      }}
    >
      Higgsfield
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Ad card — video in a white frame with a count badge
// ---------------------------------------------------------------------------

const AdCard: React.FC<{
  src: string;
  index: number;
  delay: number;
  lift: number;
}> = ({ src, index, delay, lift }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, rot, z, w } = FAN[index];

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const float = Math.sin((frame + index * 26) / 24) * 6;
  const videoH = Math.round((w * 16) / 9);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "44%",
        zIndex: z,
        transform: [
          `translate(-50%, -50%)`,
          `translate(${x}px, ${(1 - enter) * -110 + float - lift * 42}px)`,
          `rotate(${rot + (1 - enter) * -6}deg)`,
          `scale(${0.85 + 0.15 * enter})`,
        ].join(" "),
        opacity: Math.min(1, enter * 1.6),
      }}
    >
      <div
        style={{
          position: "relative",
          width: w,
          padding: 12,
          background: COLORS.card,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 34,
          boxShadow: "0 30px 70px rgba(25,23,20,0.16)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: videoH,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {/* Count badge — "AD 01/02/03"; right card gets it on its outer corner */}
        <div
          style={{
            position: "absolute",
            top: 28,
            ...(index === 2 ? { right: 28 } : { left: 28 }),
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            border: `1px solid ${COLORS.line}`,
            fontFamily: FONT,
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: 2.5,
            color: COLORS.ink,
          }}
        >
          AD 0{index + 1}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const HiggsfieldThreeAds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chipPop = spring({
    frame: frame - 3,
    fps,
    config: { damping: 16, stiffness: 170 },
  });

  // Cards nudge up when the bubble arrives
  const lift = spring({
    frame: frame - BUBBLE_T,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  // Sent bubble
  const bubbleIn = spring({
    frame: frame - BUBBLE_T,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const delivered = interpolate(frame, [DELIVERED_T, DELIVERED_T + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Background />

      {/* Higgsfield chip — top center */}
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
        <HiggsfieldChipLight pop={chipPop} />
      </div>

      {/* Three finished concepts */}
      {CLIPS.map((src, i) => (
        <AdCard key={src} src={src} index={i} delay={CARD_T[i]} lift={lift} />
      ))}

      {/* "You send…" — lime sender bubble, bottom right */}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 70,
          bottom: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          opacity: bubbleIn,
          transform: `translateY(${(1 - bubbleIn) * 160}px) scale(${0.9 + 0.1 * bubbleIn})`,
          transformOrigin: "right bottom",
        }}
      >
        <div
          style={{
            maxWidth: 780,
            padding: "30px 42px",
            background: COLORS.lime,
            border: `1px solid ${COLORS.limeDeep}`,
            borderRadius: 38,
            borderBottomRightRadius: 10,
            boxShadow: "0 22px 54px rgba(25,23,20,0.14)",
            fontFamily: FONT,
            fontSize: 46,
            lineHeight: 1.28,
            fontWeight: 650,
            letterSpacing: -0.4,
            color: COLORS.ink,
            textAlign: "left",
          }}
        >
          I already made you 3 ads you can test this week.
        </div>
        <div
          style={{
            marginTop: 16,
            marginRight: 8,
            fontFamily: FONT,
            fontSize: 29,
            fontWeight: 600,
            color: COLORS.muted,
            opacity: delivered,
            transform: `translateY(${(1 - delivered) * 8}px)`,
          }}
        >
          Delivered
        </div>
      </div>
    </AbsoluteFill>
  );
};
