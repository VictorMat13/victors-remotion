import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import {
  useAudioData,
  visualizeAudio,
  getAudioDurationInSeconds,
} from "@remotion/media-utils";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

const VOICE_SRC = "fish-audio/adrian-campaign-through.mp3";
const LOGO_SRC = "fish-audio/logo-light.png"; // black wordmark for paper bg

const FPS = 30;
const PAD = 0.6; // settle hold after the voice ends
const HALF = 32; // freq samples (mirrored -> 64 bars)

const PLACEHOLDER_SECONDS = 5.07;

type CampaignOrbProps = { audioFrames: number };

export const FISHCAMPAIGN_DURATION = Math.round(
  (PLACEHOLDER_SECONDS + PAD) * FPS,
);

export const calculateFishCampaignMetadata = async ({
  props,
}: {
  props: CampaignOrbProps;
}) => {
  let seconds = PLACEHOLDER_SECONDS;
  try {
    seconds = await getAudioDurationInSeconds(staticFile(VOICE_SRC));
  } catch {
    // keep placeholder timing
  }
  const audioFrames = Math.round(seconds * FPS);
  return {
    durationInFrames: audioFrames + Math.round(PAD * FPS),
    fps: FPS,
    props: { ...props, audioFrames },
  };
};

// -------------------------------------------------------------------------
// White-Liam palette — green "alive voice" accent (series payoff color)
// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  green: "#16A34A",
  greenBright: "#22C55E",
  greenLite: "#5FD08A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  dull: "#6C8B74",
  dullLite: "#9FB8A6",
};

// "then the first sale came in" starts at 2.52s (whisper word timestamps)
const SALE_FRAME = Math.round(2.52 * FPS);

const mirror = (k: number) => (k < HALF ? k : HALF - 1 - (k - HALF));

// =========================================================================
// Background — paper + green radial glow + masked graph grid
// =========================================================================
const Background: React.FC<{ colorMix: number }> = ({ colorMix }) => {
  const glow = interpolateColors(
    colorMix,
    [0, 1],
    ["rgba(108,139,116,0.07)", "rgba(22,163,74,0.11)"],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(1100px 1100px at 50% 46%, ${glow}, rgba(0,0,0,0) 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(32,21,21,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.026) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          WebkitMaskImage:
            "radial-gradient(980px 1200px at 50% 46%, #000 40%, transparent 82%)",
          maskImage:
            "radial-gradient(980px 1200px at 50% 46%, #000 40%, transparent 82%)",
        }}
      />
    </AbsoluteFill>
  );
};

// =========================================================================
// Radial equalizer orb
// =========================================================================
const OrbView: React.FC<{
  values: number[]; // length HALF, each 0..1
  colorMix: number; // 0 dull .. 1 vibrant (first sale)
  frame: number;
  entrance: number;
}> = ({ values, colorMix, frame, entrance }) => {
  const cx = 540;
  const cy = 540;
  const R0 = 214;

  const main = interpolateColors(colorMix, [0, 1], [COLORS.dull, COLORS.green]);
  const lite = interpolateColors(
    colorMix,
    [0, 1],
    [COLORS.dullLite, COLORS.greenLite],
  );

  const amp = values.reduce((a, b) => a + b, 0) / values.length;
  const coreScale = 1 + amp * 0.14;
  const rot = frame * 0.15;

  return (
    <svg
      viewBox="0 0 1080 1080"
      style={{
        position: "absolute",
        top: 330,
        left: 0,
        width: 1080,
        height: 1080,
        transform: `scale(${entrance})`,
        transformOrigin: "540px 870px",
      }}
    >
      <defs>
        <radialGradient id="campaignCore" cx="50%" cy="46%" r="60%">
          <stop offset="0%" stopColor={lite} stopOpacity={0.95} />
          <stop offset="70%" stopColor={main} stopOpacity={0.9} />
          <stop offset="100%" stopColor={main} stopOpacity={0.72} />
        </radialGradient>
        <filter id="campaignSoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="34" />
        </filter>
      </defs>

      {/* soft outer glow that swells with loudness */}
      <circle
        cx={cx}
        cy={cy}
        r={R0 + 40 + amp * 60}
        fill={main}
        opacity={0.14 + colorMix * 0.06 + amp * 0.18}
        filter="url(#campaignSoft)"
      />

      {/* radial equalizer bars */}
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        {Array.from({ length: HALF * 2 }).map((_, k) => {
          const v = values[mirror(k)] ?? 0;
          const theta = (k / (HALF * 2)) * Math.PI * 2 - Math.PI / 2;
          const len = 24 + v * 172;
          const x1 = cx + Math.cos(theta) * R0;
          const y1 = cy + Math.sin(theta) * R0;
          const x2 = cx + Math.cos(theta) * (R0 + len);
          const y2 = cy + Math.sin(theta) * (R0 + len);
          const c = interpolateColors(v, [0, 1], [lite, main]);
          return (
            <line
              key={k}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={c}
              strokeWidth={7}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* thin structural ring */}
      <circle
        cx={cx}
        cy={cy}
        r={R0 - 8}
        fill="none"
        stroke={main}
        strokeOpacity={0.18}
        strokeWidth={2}
      />

      {/* core */}
      <circle
        cx={cx}
        cy={cy}
        r={R0 - 34}
        fill="url(#campaignCore)"
        transform={`scale(${coreScale})`}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
};

// =========================================================================
// Main
// =========================================================================
export const FishCampaignOrb: React.FC<CampaignOrbProps> = ({
  audioFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(VOICE_SRC));

  const logoIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipS = spring({
    frame: frame - 6,
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const orbS = spring({ frame, fps, config: { damping: 200, stiffness: 90 } });
  const pillS = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 110 },
  });

  if (!audioData) {
    // audio still decoding — paint the paper base (no-black-frames rule)
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }

  // audio-reactive bar values with a breathing idle floor for the tail hold
  const raw = visualizeAudio({
    fps,
    frame: Math.min(frame, audioFrames - 1),
    audioData,
    numberOfSamples: HALF,
  });
  const ended = frame >= audioFrames;
  const values = raw.map((v, i) => {
    const live = ended ? 0 : Math.min(1, Math.sqrt(v) * 2.4);
    const idle = 0.06 + 0.035 * Math.abs(Math.sin(frame * 0.22 + i * 0.5));
    return Math.max(live, idle);
  });

  const secs = Math.floor(Math.min(frame, audioFrames) / fps);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const livePulse = 0.5 + 0.5 * Math.sin(frame / 4);

  // dull -> vibrant handoff, igniting on "then the first sale came in"
  const colorMix = interpolate(frame, [SALE_FRAME, SALE_FRAME + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const excitedPop = spring({
    frame: frame - SALE_FRAME,
    fps,
    config: { damping: 12, stiffness: 160 },
  });
  const excitedScale =
    frame < SALE_FRAME
      ? 1
      : 1 + 0.08 * Math.sin(Math.PI * Math.min(1, excitedPop));

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Background colorMix={colorMix} />
      <Audio src={staticFile(VOICE_SRC)} />

      {/* Fish Audio wordmark */}
      <div
        style={{
          position: "absolute",
          top: 206,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: logoIn,
          transform: `translateY(${interpolate(logoIn, [0, 1], [-14, 0])}px)`,
        }}
      >
        <Img
          src={staticFile(LOGO_SRC)}
          style={{ width: 440, height: "auto", display: "block" }}
        />
      </div>

      {/* LIVE chip + session timer */}
      <div
        style={{
          position: "absolute",
          top: 318,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: chipS,
          transform: `scale(${interpolate(chipS, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 26px",
            borderRadius: 999,
            background: COLORS.greenBg,
            border: `1.5px solid ${COLORS.greenBorder}`,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: COLORS.greenBright,
              opacity: 0.55 + 0.45 * livePulse,
              boxShadow: `0 0 ${3 + 5 * livePulse}px ${COLORS.greenBright}`,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: 27,
              color: COLORS.green,
              letterSpacing: 2,
            }}
          >
            LIVE
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 27,
              color: COLORS.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mm}:{ss}
          </span>
        </div>
      </div>

      {/* the orb */}
      <OrbView
        values={values}
        colorMix={colorMix}
        frame={frame}
        entrance={orbS}
      />

      {/* emotion-tag pill — [sighing] hands off to [excited] on the sale */}
      <div
        style={{
          position: "absolute",
          top: 1372,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "20px 30px",
            borderRadius: 999,
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow:
              "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)",
            opacity: pillS,
            transform: `scale(${interpolate(pillS, [0, 1], [0.92, 1])})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: COLORS.greenBg,
                border: `1.5px solid ${COLORS.greenBorder}`,
                fontWeight: 700,
                fontSize: 30,
                color: COLORS.green,
                whiteSpace: "nowrap",
                opacity: 1 - colorMix * 0.55,
              }}
            >
              [sighing]
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 30,
                color: COLORS.muted,
                whiteSpace: "nowrap",
              }}
            >
              to
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: interpolateColors(
                  colorMix,
                  [0, 1],
                  ["#ffffff", COLORS.greenBg],
                ),
                border: `1.5px solid ${interpolateColors(colorMix, [0, 1], [COLORS.cardBorder, COLORS.greenBorder])}`,
                fontWeight: 700,
                fontSize: 30,
                color: interpolateColors(
                  colorMix,
                  [0, 1],
                  [COLORS.muted, COLORS.green],
                ),
                whiteSpace: "nowrap",
                opacity: 0.55 + colorMix * 0.45,
                transform: `scale(${excitedScale})`,
              }}
            >
              [excited]
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
