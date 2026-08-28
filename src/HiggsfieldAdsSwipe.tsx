import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 114; // 3.8s @ 30fps

const W = 1080;
const H = 1920;

const COLORS = {
  bg: "#060812",
  text: "#F8FAFC",
  lime: "#CDF24E",
};

// Cut points — hard swipes centered on these frames
const CUT1 = 38;
const CUT2 = 76;
const SWIPE = 9; // swipe duration in frames
const LOGO_T = 84; // finale: logo scales up center

const CLIPS = [
  "fable5/ads/AlessandroLavis_2058124824719843328.mp4",
  "fable5/ads/AlessandroLavis_2053776428995424256.mp4",
  "fable5/ads/FynCas_2069057920063438848.mp4",
];

const swipeProgress = (frame: number, cut: number) =>
  interpolate(frame, [cut - 5, cut - 5 + SWIPE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.18, 1),
  });

// ---------------------------------------------------------------------------
// Full-frame video panel sitting on the horizontal track
// ---------------------------------------------------------------------------

const Panel: React.FC<{ src: string; index: number; radius: number }> = ({
  src,
  index,
  radius,
}) => {
  const frame = useCurrentFrame(); // local to wrapping <Sequence>
  const zoom = interpolate(frame, [0, 50], [1.03, 1.1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: index * W,
        top: 0,
        width: W,
        height: H,
        overflow: "hidden",
        borderRadius: radius,
        boxShadow: radius > 2 ? "0 30px 90px rgba(0,0,0,0.55)" : "none",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Higgsfield chip — glass pill, icon + wordmark
// ---------------------------------------------------------------------------

const HiggsfieldChip: React.FC<{
  icon: number;
  text: number;
  ring?: boolean;
}> = ({ icon, text, ring = false }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: icon * 0.28,
      padding: `${icon * 0.22}px ${icon * 0.5}px ${icon * 0.22}px ${icon * 0.26}px`,
      borderRadius: 999,
      background: "rgba(8,10,20,0.62)",
      border: `1.5px solid ${ring ? "rgba(205,242,78,0.55)" : "rgba(255,255,255,0.22)"}`,
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      boxShadow: ring
        ? "0 24px 70px rgba(0,0,0,0.5), 0 0 60px rgba(205,242,78,0.22)"
        : "0 14px 40px rgba(0,0,0,0.4)",
    }}
  >
    <Img
      src={staticFile("fable5/higgsfield-icon.png")}
      style={{ width: icon, height: icon, borderRadius: icon * 0.24 }}
    />
    <span
      style={{
        fontFamily,
        fontSize: text,
        fontWeight: 700,
        letterSpacing: -0.5,
        color: COLORS.text,
        whiteSpace: "nowrap",
      }}
    >
      Higgsfield
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const HiggsfieldAdsSwipe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Swipe motion — track slides one screen-width per cut
  const sA = swipeProgress(frame, CUT1);
  const sB = swipeProgress(frame, CUT2);
  const trackX = -(sA + sB) * W;

  // Panels "breathe" during swipes: scale down + corner radius, dark bg peeks
  const breathe = Math.sin(Math.PI * sA) + Math.sin(Math.PI * sB);
  const trackScale = 1 - 0.055 * breathe;
  const radius = 44 * breathe;

  // Small chip top-left: in at 6, out at finale
  const chipIn = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, stiffness: 170 },
  });
  const chipOut = interpolate(frame, [LOGO_T, LOGO_T + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipSmall = chipIn * chipOut;

  // Finale: scrim + big chip springs up center
  const scrim = interpolate(frame, [LOGO_T, LOGO_T + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const logoPop = spring({
    frame: frame - LOGO_T,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const glowPulse = 0.75 + 0.25 * Math.sin(frame / 6);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Lime glow behind panels — only visible while they breathe apart */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(700px 900px at 50% 50%, rgba(205,242,78,0.10), rgba(0,0,0,0) 70%)`,
          opacity: breathe,
        }}
      />

      {/* Video track */}
      <AbsoluteFill style={{ transform: `scale(${trackScale})` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${trackX}px)`,
          }}
        >
          <Sequence durationInFrames={CUT1 + 6}>
            <Panel src={CLIPS[0]} index={0} radius={radius} />
          </Sequence>
          <Sequence from={CUT1 - 6} durationInFrames={CUT2 - CUT1 + 12}>
            <Panel src={CLIPS[1]} index={1} radius={radius} />
          </Sequence>
          <Sequence
            from={CUT2 - 6}
            durationInFrames={DURATION_IN_FRAMES - (CUT2 - 6)}
          >
            <Panel src={CLIPS[2]} index={2} radius={radius} />
          </Sequence>
        </div>
      </AbsoluteFill>

      {/* Small persistent chip — top-left */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 96,
          opacity: chipSmall,
          transform: `scale(${0.8 + 0.2 * chipIn}) translateY(${(1 - chipIn) * -16}px)`,
          transformOrigin: "left top",
        }}
      >
        <HiggsfieldChip icon={64} text={42} />
      </div>

      {/* Finale — scrim dims clip 3, logo scales up center */}
      <AbsoluteFill
        style={{
          background: "rgba(5,7,14,0.55)",
          opacity: scrim,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(520px 520px at 50% 50%, rgba(205,242,78,0.16), rgba(0,0,0,0) 68%)`,
          opacity: scrim * logoPop * glowPulse,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: Math.min(1, logoPop * 1.4) * scrim,
            transform: `scale(${0.6 + 0.4 * logoPop})`,
          }}
        >
          <HiggsfieldChip icon={110} text={72} ring />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
