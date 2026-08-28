import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// clip.mp4 is 720x1280 (9:16), ~4.10s. At 30fps → 123 frames.
export const DURATION_IN_FRAMES = 123;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  orange: "#ff4f01",
};

// 10% padding all sides on a 1080x1920 canvas → card is 80% = 864x1536.
const PAD_X = 0.1; // 10% each side
const PAD_Y = 0.1;

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(1000px 1100px at 50% 48%, rgba(255,79,1,0.06), rgba(255,79,1,0) 62%)",
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
          "radial-gradient(820px 1020px at 50% 50%, #000 40%, transparent 84%)",
        maskImage:
          "radial-gradient(820px 1020px at 50% 50%, #000 40%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

export const ClipCard: React.FC<{ src?: string }> = ({
  src = "vidmuse-clip.mp4",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cardW = width * (1 - PAD_X * 2);
  const cardH = height * (1 - PAD_Y * 2);

  // swipe-up entrance: slide from below, settle with a slight overshoot,
  // scale in, fade in, and let the shadow "lift" as it lands.
  const entrance = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90, mass: 1 },
  });
  const translateY = interpolate(entrance, [0, 1], [520, 0]);
  const scale = interpolate(entrance, [0, 1], [0.94, 1]);
  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // shadow grows as the card settles
  const shY = interpolate(entrance, [0, 1], [10, 46]);
  const shBlur = interpolate(entrance, [0, 1], [26, 92]);
  const shA = interpolate(entrance, [0, 1], [0.05, 0.2]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Background />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: cardW,
          height: cardH,
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          borderRadius: 46,
          overflow: "hidden",
          background: "#000",
          border: "1px solid rgba(32,21,21,0.06)",
          boxShadow: `0 ${shY}px ${shBlur}px rgba(32,21,21,${shA}), 0 6px 16px rgba(32,21,21,0.06)`,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};
