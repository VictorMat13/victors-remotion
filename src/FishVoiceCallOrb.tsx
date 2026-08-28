import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
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

// -------------------------------------------------------------------------
// Audio file locations (drop the two clips into public/fish-audio/)
// -------------------------------------------------------------------------
const PROSPECT_SRC = "fish-audio/prospect.mp3";
const AGENT_SRC = "fish-audio/agent.mp3";

const FPS = 30;
const GAP = 0.25; // tiny beat between turns
const PAD = 0.7; // tail hold
const HALF = 32; // freq samples (mirrored -> 64 bars)

// Placeholder timing used until the real audio is present.
const PLACEHOLDER_PROSPECT = 4;
const PLACEHOLDER_AGENT = 5;

type OrbProps = { hasAudio: boolean; handoffFrame: number };

export const DURATION_IN_FRAMES = Math.round(
  (PLACEHOLDER_PROSPECT + GAP + PLACEHOLDER_AGENT + PAD) * FPS,
);

// Auto-sizes the composition to the real audio when it exists; otherwise
// falls back to placeholder timing so the design still previews.
export const calculateFishOrbMetadata = async ({
  props,
}: {
  props: OrbProps;
}) => {
  let prospectSec = PLACEHOLDER_PROSPECT;
  let agentSec = PLACEHOLDER_AGENT;
  let hasAudio = false;
  try {
    prospectSec = await getAudioDurationInSeconds(staticFile(PROSPECT_SRC));
    agentSec = await getAudioDurationInSeconds(staticFile(AGENT_SRC));
    hasAudio = true;
  } catch {
    // files not dropped yet — keep placeholders
  }
  const handoffFrame = Math.round((prospectSec + GAP) * FPS);
  const durationInFrames = Math.max(
    60,
    Math.round((prospectSec + GAP + agentSec + PAD) * FPS),
  );
  return {
    durationInFrames,
    fps: FPS,
    props: { ...props, hasAudio, handoffFrame },
  };
};

// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  blue: "#2563EB",
  blueLite: "#7DA9FB",
  green: "#16A34A",
  greenLite: "#5FD08A",
  red: "#EF4444",
};

const mirror = (k: number) => (k < HALF ? k : HALF - 1 - (k - HALF));

// =========================================================================
// Background — paper + speaker-tinted radial glow + masked grid
// =========================================================================
const Background: React.FC<{ colorMix: number }> = ({ colorMix }) => {
  const glow = interpolateColors(
    colorMix,
    [0, 1],
    ["rgba(37,99,235,0.10)", "rgba(22,163,74,0.10)"],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(1100px 1100px at 50% 44%, ${glow}, rgba(0,0,0,0) 60%)`,
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
            "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
          maskImage:
            "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
        }}
      />
    </AbsoluteFill>
  );
};

// =========================================================================
// Presentational orb — radial equalizer that recolors blue -> green
// =========================================================================
const OrbView: React.FC<{
  values: number[]; // length HALF, each 0..1
  colorMix: number; // 0 prospect .. 1 agent
  frame: number;
  entrance: number;
}> = ({ values, colorMix, frame, entrance }) => {
  const cx = 540;
  const cy = 540;
  const R0 = 214;

  const main = interpolateColors(colorMix, [0, 1], [COLORS.blue, COLORS.green]);
  const lite = interpolateColors(
    colorMix,
    [0, 1],
    [COLORS.blueLite, COLORS.greenLite],
  );

  const amp = values.reduce((a, b) => a + b, 0) / values.length;
  const coreScale = 1 + amp * 0.14;
  const rot = frame * 0.15;

  return (
    <svg
      viewBox="0 0 1080 1080"
      style={{
        position: "absolute",
        top: 300,
        left: 0,
        width: 1080,
        height: 1080,
        transform: `scale(${entrance})`,
        transformOrigin: "540px 540px",
      }}
    >
      <defs>
        <radialGradient id="core" cx="50%" cy="46%" r="60%">
          <stop offset="0%" stopColor={lite} stopOpacity={0.95} />
          <stop offset="70%" stopColor={main} stopOpacity={0.9} />
          <stop offset="100%" stopColor={main} stopOpacity={0.72} />
        </radialGradient>
        <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="34" />
        </filter>
      </defs>

      {/* soft outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={R0 + 40 + amp * 60}
        fill={main}
        opacity={0.18 + amp * 0.18}
        filter="url(#soft)"
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
        fill="url(#core)"
        transform={`scale(${coreScale})`}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
};

// =========================================================================
// Shared chrome: call header, speaker label, orb
// =========================================================================
const Shell: React.FC<{
  values: number[];
  frame: number;
  fps: number;
  handoffFrame: number;
}> = ({ values, frame, fps, handoffFrame }) => {
  const colorMix = interpolate(
    frame,
    [handoffFrame - 6, handoffFrame + 6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const eyebrow = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const secs = Math.floor(frame / fps);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const dotPulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.25));

  const main = interpolateColors(colorMix, [0, 1], [COLORS.blue, COLORS.green]);

  return (
    <AbsoluteFill>
      <Background colorMix={colorMix} />

      {/* call header */}
      <div
        style={{
          position: "absolute",
          top: 236,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          opacity: eyebrow,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 14,
            background: COLORS.red,
            opacity: dotPulse,
            boxShadow: `0 0 ${8 + 8 * dotPulse}px ${COLORS.red}`,
          }}
        />
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 6,
            color: COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Live Call
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 2,
            color: COLORS.ink,
            marginLeft: 8,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      {/* the orb */}
      <OrbView
        values={values}
        colorMix={colorMix}
        frame={frame}
        entrance={entrance}
      />

      {/* speaker label (crossfades prospect -> agent) */}
      <div
        style={{
          position: "absolute",
          top: 1330,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "20px 40px 20px 22px",
            borderRadius: 999,
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow:
              "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)",
            transform: `scale(${entrance})`,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              background: main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {colorMix < 0.5 ? (
              <svg viewBox="0 0 40 40" style={{ width: 34, height: 34 }}>
                <circle cx="20" cy="15" r="7" fill="#fff" />
                <path d="M8 33 c0 -8 6 -12 12 -12 s12 4 12 12" fill="#fff" />
              </svg>
            ) : (
              <svg viewBox="0 0 40 40" style={{ width: 34, height: 34 }}>
                <path
                  d="M6 20 c6 -9 18 -9 24 0 c-6 9 -18 9 -24 0 Z"
                  fill="#fff"
                />
                <path d="M30 20 l6 -5 v10 Z" fill="#fff" />
                <circle cx="14" cy="18" r="1.8" fill={main} />
              </svg>
            )}
          </div>
          <div style={{ position: "relative", width: 420, height: 52 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                opacity: 1 - colorMix,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 38,
                  color: COLORS.ink,
                  whiteSpace: "nowrap",
                }}
              >
                Prospect
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                opacity: colorMix,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 38,
                  color: COLORS.ink,
                  whiteSpace: "nowrap",
                }}
              >
                Fish Audio Agent
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// Real audio-reactive variant
// =========================================================================
const OrbWithAudio: React.FC<{ handoffFrame: number }> = ({ handoffFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prospect = useAudioData(staticFile(PROSPECT_SRC));
  const agent = useAudioData(staticFile(AGENT_SRC));

  let values = new Array(HALF).fill(0.08);
  const isProspect = frame < handoffFrame;
  const data = isProspect ? prospect : agent;
  const localFrame = isProspect ? frame : frame - handoffFrame;
  if (data) {
    const raw = visualizeAudio({
      fps,
      frame: Math.max(0, localFrame),
      audioData: data,
      numberOfSamples: HALF,
    });
    values = raw.map((v) => Math.min(1, Math.sqrt(v) * 2.4));
  }

  return (
    <>
      <Audio src={staticFile(PROSPECT_SRC)} />
      <Sequence from={handoffFrame}>
        <Audio src={staticFile(AGENT_SRC)} />
      </Sequence>
      <Shell
        values={values}
        frame={frame}
        fps={fps}
        handoffFrame={handoffFrame}
      />
    </>
  );
};

// =========================================================================
// Procedural preview variant (no audio files yet)
// =========================================================================
const OrbProcedural: React.FC<{ handoffFrame: number }> = ({
  handoffFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const env =
    0.4 +
    0.42 * Math.abs(Math.sin(frame * 0.34)) +
    0.18 * Math.abs(Math.sin(frame * 0.9));
  const values = Array.from({ length: HALF }).map((_, i) => {
    const v =
      0.25 +
      0.55 * Math.abs(Math.sin(i * 0.5 + frame * 0.28)) +
      0.3 * Math.abs(Math.sin(i * 1.4 - frame * 0.19));
    return Math.min(1, (v / 1.1) * env);
  });

  return (
    <Shell
      values={values}
      frame={frame}
      fps={fps}
      handoffFrame={handoffFrame}
    />
  );
};

// =========================================================================
// Entry
// =========================================================================
export const FishVoiceCallOrb: React.FC<OrbProps> = ({
  hasAudio,
  handoffFrame,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {hasAudio ? (
        <OrbWithAudio handoffFrame={handoffFrame} />
      ) : (
        <OrbProcedural handoffFrame={handoffFrame} />
      )}
    </AbsoluteFill>
  );
};
