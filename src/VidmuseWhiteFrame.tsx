import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
} from "remotion";

// Source clip is 10s, trimmed to start at 8s → exactly 2s remain (60 frames).
// Video and audio must end together: a shorter video stream makes players
// show black during the trailing audio-only moment.
const TRIM_BEFORE_FRAMES = 240; // 8s at 30fps
export const DURATION_IN_FRAMES = 60;

export const VidmuseWhiteFrame: React.FC = () => {
  const { width, height } = useVideoConfig();

  const SAFE_PAD_X = Math.round(width * 0.05);
  const videoW = width - SAFE_PAD_X * 2;
  const videoH = Math.round(videoW * (1280 / 720));
  const radius = Math.round(videoW * 0.045);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: videoW,
          height: Math.min(videoH, height - SAFE_PAD_X * 2),
          borderRadius: radius,
          overflow: "hidden",
          boxShadow:
            "0 48px 100px rgba(15, 23, 42, 0.30), 0 14px 36px rgba(15, 23, 42, 0.16)",
        }}
      >
        <OffthreadVideo
          src={staticFile("vidmuse/result-b0f11207.mp4")}
          trimBefore={TRIM_BEFORE_FRAMES}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};
