import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 298;

// "Now watch: every finished MP3 lands in the same folder. The same creative
//  can have an urgent version, a calm version, and a UGC version without
//  recording three separate takes."
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  cream: "#FDF9F5",
  border: "#F0E4DC",
  coral: "#D97757",
  green: "#16A34A",
};

const VO = "fish-audio/watch7-launch-vo.mp3";
const VO_START = 96;

const FILES = [
  { name: "launch-urgent.mp3", at: 14 },
  { name: "launch-calm.mp3", at: 32 },
  { name: "launch-ugc.mp3", at: 50 },
];

// world: 1080 x 2400, camera travels down
const FOLDER = { x: 170, y: 400, w: 740, h: 470 };
// rate: fit each clip's remaining runtime to the comp tail without looping
// (gw7-2 is 6.5s but must cover ~6.9s → 6% slow-down, imperceptible)
const VIDS = [
  { src: "fish-audio/ads/gw7-2.mp4", cx: 205, cy: 1650, w: 300, h: 533, rot: -4, at: 92, rate: 0.93 },
  { src: "fish-audio/ads/gw7-3.mp4", cx: 875, cy: 1650, w: 300, h: 533, rot: 4, at: 98, rate: 1 },
  { src: "fish-audio/ads/gw7-1.mp4", cx: 540, cy: 1620, w: 430, h: 764, rot: 0, at: 86, rate: 1 },
];
const VID_LABEL = ["launch-calm.mp3", "launch-ugc.mp3", "launch-urgent.mp3"];

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const FishSameFolder: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(VO));

  // ---- camera: folder beat → travel down → creatives hold ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 12, 60, 74, 102, 118, 297];
  let z = interpolate(frame, KEY, [1.42, 1.42, 1.3, 1.3, 0.98, 1.0, 1.0], camOpts);
  const fx = interpolate(frame, KEY, [540, 540, 540, 540, 540, 540, 540], camOpts);
  const fy = interpolate(
    frame,
    KEY,
    [560, 560, 620, 630, 1560, 1585, 1585],
    camOpts,
  );
  for (const at of [VO_START]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.012 * Math.exp(-d / 3);
  }

  // center visualizer amplitudes from the real VO
  const bars = 26;
  let amps: number[] = Array.from({ length: bars }, () => 0.06);
  if (audioData && frame >= VO_START) {
    const vis = visualizeAudio({
      audioData,
      frame: frame - VO_START,
      fps,
      numberOfSamples: 32,
    });
    amps = vis.slice(3, 3 + bars).map((v) => Math.min(1, v * 2.4));
  }

  const folderFade = 1 - p(frame, 74, 100);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FDF6F0", fontFamily: inter }}>
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(1000px 800px at 85% 8%, rgba(247,205,188,0.85), rgba(247,205,188,0) 60%),
            radial-gradient(900px 900px at 10% 92%, rgba(250,227,211,0.9), rgba(250,227,211,0) 55%),
            linear-gradient(160deg, #FDF6F0 0%, #FAE9DE 100%)`,
        }}
      />
      {frame >= VO_START ? <Audio src={staticFile(VO)} /> : null}

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${z})`,
        }}
      >
        {/* ================= beat 1: the folder ================= */}
        {folderFade > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: FOLDER.x,
              top: FOLDER.y,
              width: FOLDER.w,
              height: FOLDER.h,
              borderRadius: 26,
              backgroundColor: C.card,
              boxShadow: "0 26px 70px rgba(32,21,21,0.16)",
              opacity: folderFade,
              overflow: "hidden",
            }}
          >
            {/* header */}
            <div
              style={{
                height: 84,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 30px",
                borderBottom: `1.5px solid ${C.border}`,
              }}
            >
              <svg width={40} height={34} viewBox="0 0 40 34">
                <path
                  d="M2 6 a4 4 0 0 1 4-4 h9 l4 5 h15 a4 4 0 0 1 4 4 v17 a4 4 0 0 1-4 4 H6 a4 4 0 0 1-4-4 Z"
                  fill={C.coral}
                  opacity={0.9}
                />
              </svg>
              <span style={{ fontSize: 27, fontWeight: 700, color: C.ink }}>
                voice
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: mono,
                  fontSize: 19,
                  color: C.muted,
                }}
              >
                {(() => {
                  const n = FILES.filter((f) => frame >= f.at).length;
                  return `${n} item${n === 1 ? "" : "s"}`;
                })()}
              </span>
            </div>
            {/* rows */}
            {FILES.map((f, i) => {
              const s = spring({
                frame: Math.max(0, frame - f.at),
                fps,
                config: { damping: 14, stiffness: 150 },
              });
              if (frame < f.at) return null;
              const check = spring({
                frame: Math.max(0, frame - f.at - 8),
                fps,
                config: { damping: 12, stiffness: 190 },
              });
              return (
                <div
                  key={f.name}
                  style={{
                    position: "absolute",
                    left: 24,
                    right: 24,
                    top: 104 + i * 118,
                    height: 100,
                    borderRadius: 18,
                    backgroundColor: C.cream,
                    border: `1.5px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "0 24px",
                    opacity: Math.min(1, s * 1.4),
                    transform: `translateY(${(1 - s) * -70}px) scale(${0.92 + s * 0.08})`,
                  }}
                >
                  {/* waveform glyph chip */}
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 13,
                      backgroundColor: C.card,
                      border: `1.5px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    {[14, 24, 32, 20, 26, 12].map((h, b) => (
                      <div
                        key={b}
                        style={{
                          width: 4,
                          height: h,
                          borderRadius: 2,
                          backgroundColor: C.coral,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 23,
                        fontWeight: 700,
                        color: C.ink,
                      }}
                    >
                      {f.name}
                    </span>
                    <span style={{ fontSize: 18, color: C.muted }}>0:08 · S2.1 Pro</span>
                  </div>
                  {check > 0.001 ? (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "rgba(22,163,74,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${Math.min(1, check)})`,
                      }}
                    >
                      <svg width={22} height={22} viewBox="0 0 22 22">
                        <path
                          d="M4 11.5 L9 16.5 L18 6"
                          fill="none"
                          stroke={C.green}
                          strokeWidth={3.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* ================= beat 2: three takes, one creative ================= */}
        {VIDS.map((v, i) => {
          const s = spring({
            frame: Math.max(0, frame - v.at),
            fps,
            config: { damping: 15, stiffness: 110, mass: 1.05 },
          });
          if (frame < v.at) return null;
          const featured = i === 2;
          return (
            <div
              key={v.src}
              style={{
                position: "absolute",
                left: v.cx - v.w / 2,
                top: v.cy - v.h / 2 + (1 - s) * 160,
                width: v.w,
                height: v.h + 96,
                opacity: Math.min(1, s * 1.5),
                transform: `rotate(${v.rot}deg) scale(${0.86 + s * 0.14})`,
                zIndex: featured ? 3 : 1,
              }}
            >
              <div
                style={{
                  width: v.w,
                  height: v.h,
                  borderRadius: 22,
                  overflow: "hidden",
                  backgroundColor: C.ink,
                  boxShadow: featured
                    ? "0 34px 80px rgba(32,21,21,0.30)"
                    : "0 20px 50px rgba(32,21,21,0.20)",
                  border: `${featured ? 3 : 1.5}px solid ${featured ? C.coral : C.border}`,
                }}
              >
                <Sequence from={v.at} layout="none">
                  <OffthreadVideo
                    muted
                    playbackRate={v.rate}
                    src={staticFile(v.src)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Sequence>
              </div>
              {/* visualizer + label under the card */}
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: featured ? 5 : 4,
                    height: 46,
                  }}
                >
                  {(featured ? amps : amps.slice(0, 16)).map((a, b) => {
                    const idle =
                      0.1 + 0.06 * Math.sin(frame * 0.11 + b * 0.8 + i * 2.2);
                    const amp = featured ? Math.max(a, 0.05) : idle;
                    return (
                      <div
                        key={b}
                        style={{
                          width: featured ? 7 : 5,
                          height: 6 + amp * (featured ? 40 : 22),
                          borderRadius: 4,
                          backgroundColor: featured ? C.coral : C.muted,
                          opacity: featured ? 0.95 : 0.55,
                        }}
                      />
                    );
                  })}
                </div>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: featured ? 21 : 17,
                    fontWeight: 700,
                    color: featured ? C.ink : C.muted,
                  }}
                >
                  {VID_LABEL[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
