import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useVideoConfig,
} from "remotion";

// Inner video is the full 10s result_b0f11207 ad — 300 frames at 30fps, video
// and audio ending together (audio gets trimmed under video length in post).
export const DURATION_IN_FRAMES = 300;

export const ProjectorV2WhiteFrame: React.FC = () => {
  const { width, height } = useVideoConfig();

  const SAFE_PAD_X = Math.round(width * 0.05);
  const videoW = width - SAFE_PAD_X * 2;
  const videoH = Math.round(videoW * (1920 / 1080));
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};
