import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";

// Galaxy Watch 7 ad #2 (6.5s = 195 frames) with the calm S2.1 Pro narrator
// line over it. Ad music stays, ducked under the voiceover.
export const DURATION_IN_FRAMES = 195;
const VO_AT = 12;

export const FishWatchAdWhiteFrame: React.FC = () => {
  const { width, height } = useVideoConfig();

  const PAD_X = Math.round(width * 0.1);
  const PAD_Y = Math.round(height * 0.1);
  const videoW = width - PAD_X * 2;
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
          height: Math.min(videoH, height - PAD_Y * 2),
          borderRadius: radius,
          overflow: "hidden",
          boxShadow:
            "0 48px 100px rgba(15, 23, 42, 0.30), 0 14px 36px rgba(15, 23, 42, 0.16)",
        }}
      >
        <OffthreadVideo
          src={staticFile("fish-audio/watch-ad-2.mp4")}
          volume={0.22}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <Sequence from={VO_AT}>
        <Audio src={staticFile("fish-audio/hook-11-announcer-loud.mp3")} />
      </Sequence>
    </AbsoluteFill>
  );
};
