import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, staticFile } from "remotion";

// galaxy 7 watch 1.mp4 (1080x1920, 7.97s) on white, 10% padding, rounded
// corners, with the Fish Audio launch VO over it.
export const DURATION_IN_FRAMES = 239;

const W = 1080;
const H = 1920;
const PAD_X = W * 0.1;
const PAD_Y = H * 0.1;

export const FishFramedAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <Audio src={staticFile("fish-audio/watch7-launch-vo.mp3")} />
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          top: PAD_Y,
          width: W - PAD_X * 2,
          height: H - PAD_Y * 2,
          borderRadius: 48,
          overflow: "hidden",
        }}
      >
        <OffthreadVideo
          muted
          src={staticFile("fish-audio/ads/gw7-1.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};
