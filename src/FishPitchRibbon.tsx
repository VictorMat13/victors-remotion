import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

const VOICE_SRC = "fish-audio/we-thought-the-campaign.mp3";
const AUDIO_FRAMES = 199; // 6.609s @ 30fps
export const DURATION_IN_FRAMES = 212; // audio + short settle hold

// -------------------------------------------------------------------------
// White-Liam palette — green "alive / payoff" accent (answers FishFlatDelivery)
// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  cardBorder: "#efefe9",
  slate: "#64748B",
  green: "#16A34A",
  greenBright: "#22C55E",
  greenLite: "#86EFAC",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

// ribbon geometry (inside the card)
const RIB_X0 = 162;
const RIB_X1 = 918;
const BASE_Y = 660; // dashed "flat delivery" reference line
const RISE = 350; // max contour lift above the baseline
const STEP = 2; // sample the contour every 2 frames

// =========================================================================
// Background — paper + soft green radial glow + masked graph grid
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(940px 760px at 50% 48%, rgba(22,163,74,0.07), rgba(22,163,74,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.028) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(860px 720px at 50% 50%, #000 42%, transparent 86%)",
        maskImage:
          "radial-gradient(860px 720px at 50% 50%, #000 42%, transparent 86%)",
      }}
    />
  </AbsoluteFill>
);

const PitchIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    viewBox="0 0 40 40"
    style={{ width: 40, height: 40 }}
    fill="none"
    stroke={color}
    strokeWidth={3.2}
    strokeLinecap="round"
  >
    <path d="M5 24 Q 10 8 15 22 T 25 20 Q 30 10 35 18" />
  </svg>
);

// =========================================================================
// Main
// =========================================================================
export const FishPitchRibbon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(VOICE_SRC));

  // entrances
  const eyebrow = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardS = spring({
    frame: frame - 4,
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const cardScale = interpolate(cardS, [0, 1], [0.96, 1]);

  if (!audioData) {
    // audio still decoding — paint the paper base (no-black-frames rule)
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }

  // ---- contour: loudness per sampled frame over the WHOLE clip, then
  // normalized to its own loudest moment so the peaks use the full rise ----
  const rawAll: number[] = [];
  for (let k = 0; k < AUDIO_FRAMES; k += STEP) {
    const fft = visualizeAudio({
      audioData,
      frame: k,
      fps,
      numberOfSamples: 32,
    });
    let s = 0;
    for (let b = 1; b <= 12; b++) s += fft[b];
    rawAll.push(s / 12);
  }
  const peakV = rawAll.reduce((m, v) => Math.max(m, v), 0.0001);
  const normAll = rawAll.map((v) => Math.pow(Math.min(1, v / peakV), 0.8));
  // neighbor smoothing so the ribbon flows instead of jittering
  const smoothAll = normAll.map((v, i) => {
    const a = normAll[i - 1] ?? v;
    const b = normAll[i + 1] ?? v;
    return (a + v * 2 + b) / 4;
  });
  // draw only what the playhead has passed
  const lastFrame = Math.min(frame, AUDIO_FRAMES - 1);
  const amp = smoothAll.slice(0, Math.floor(lastFrame / STEP) + 1);

  const xOf = (i: number) =>
    interpolate(i * STEP, [0, AUDIO_FRAMES - 1], [RIB_X0, RIB_X1]);
  const topOf = (a: number) => BASE_Y - a * RISE;

  // filled ribbon: swells with loudness
  let ribbon = "";
  let area = "";
  if (amp.length > 1) {
    const tops = amp.map(
      (a, i) => `${xOf(i).toFixed(1)} ${topOf(a).toFixed(1)}`,
    );
    const bots = amp
      .map((a, i) => {
        const th = 8 + 22 * a;
        return `${xOf(i).toFixed(1)} ${(topOf(a) + th).toFixed(1)}`;
      })
      .reverse();
    ribbon = `M ${tops.join(" L ")} L ${bots.join(" L ")} Z`;
    area = `M ${xOf(0).toFixed(1)} ${BASE_Y} L ${tops.join(" L ")} L ${xOf(
      amp.length - 1,
    ).toFixed(1)} ${BASE_Y} Z`;
  }

  // playhead
  const headI = amp.length - 1;
  const headA = amp[headI] ?? 0;
  const headX = xOf(headI);
  const headY = topOf(headA);

  // peaks the playhead has passed: local maxima, spaced, loud enough
  const peaks: { i: number; a: number }[] = [];
  for (let i = 2; i < amp.length - 2; i++) {
    if (
      amp[i] > 0.52 &&
      amp[i] >= amp[i - 1] &&
      amp[i] >= amp[i + 1] &&
      amp[i] > amp[i - 2] &&
      amp[i] > amp[i + 2] &&
      (peaks.length === 0 || i - peaks[peaks.length - 1].i > 12)
    ) {
      peaks.push({ i, a: amp[i] });
    }
  }

  // running pitch-range readout (the green answer to "±0 Hz")
  const maxA = amp.reduce((m, v) => Math.max(m, v), 0);
  const hz = Math.round(maxA * 185);

  const pillS = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const livePulse = 0.5 + 0.5 * Math.sin(frame / 4);

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Background />
      <Audio src={staticFile(VOICE_SRC)} />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          opacity: eyebrow,
          transform: `translateY(${interpolate(eyebrow, [0, 1], [-14, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            background: COLORS.green,
            transform: "rotate(45deg)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 6,
            color: COLORS.green,
            textTransform: "uppercase",
          }}
        >
          Fish Audio
        </div>
      </div>

      {/* Hero card — the ribbon canvas */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 110,
          width: 860,
          height: 610,
          borderRadius: 36,
          background: "#ffffff",
          border: `1px solid ${COLORS.cardBorder}`,
          boxShadow:
            "0 34px 80px rgba(18,24,40,0.10), 0 3px 8px rgba(18,24,40,0.05)",
          opacity: cardS,
          transform: `scale(${cardScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Voice
        </div>
        {/* LIVE chip */}
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 34,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 16px",
            borderRadius: 999,
            background: COLORS.greenBg,
            border: `1.5px solid ${COLORS.greenBorder}`,
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: COLORS.greenBright,
              opacity: 0.55 + 0.45 * livePulse,
              boxShadow: `0 0 ${3 + 5 * livePulse}px ${COLORS.greenBright}`,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: COLORS.green,
              letterSpacing: 1,
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Ribbon SVG — drawn in page coords so geometry constants read plainly */}
      <svg
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", inset: 0, opacity: cardS }}
      >
        <defs>
          <linearGradient id="ribbonFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.greenBright} />
            <stop offset="100%" stopColor={COLORS.green} />
          </linearGradient>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.20)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
          </linearGradient>
        </defs>

        {/* dashed flat-delivery reference line */}
        <line
          x1={RIB_X0}
          y1={BASE_Y}
          x2={RIB_X1}
          y2={BASE_Y}
          stroke={COLORS.slate}
          strokeOpacity={0.4}
          strokeWidth={3}
          strokeDasharray="3 14"
          strokeLinecap="round"
        />

        {/* glow area under the contour */}
        {area ? <path d={area} fill="url(#areaFill)" /> : null}

        {/* peak ripple rings */}
        {peaks.map((p) => {
          const born = p.i * STEP;
          const ringS = spring({
            frame: frame - born,
            fps,
            config: { damping: 16, stiffness: 120 },
          });
          return (
            <circle
              key={p.i}
              cx={xOf(p.i)}
              cy={topOf(p.a)}
              r={14 + 26 * ringS}
              fill="none"
              stroke={COLORS.greenLite}
              strokeWidth={3}
              opacity={0.85 * (1 - ringS * 0.75)}
            />
          );
        })}

        {/* the ribbon itself */}
        {ribbon ? (
          <path
            d={ribbon}
            fill="url(#ribbonFill)"
            style={{ filter: "drop-shadow(0 6px 18px rgba(34,197,94,0.45))" }}
          />
        ) : null}

        {/* playhead dot */}
        {frame >= 2 ? (
          <>
            <circle
              cx={headX}
              cy={headY}
              r={16 + 10 * headA}
              fill="rgba(34,197,94,0.22)"
            />
            <circle
              cx={headX}
              cy={headY}
              r={9}
              fill={COLORS.greenBright}
              style={{ filter: "drop-shadow(0 0 10px rgba(34,197,94,0.8))" }}
            />
          </>
        ) : null}
      </svg>

      {/* Pitch-range pill — the callback to ±0 Hz, now alive */}
      <div
        style={{
          position: "absolute",
          top: 852,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(pillS, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(pillS, [0, 1], [-26, 0])}px) scale(${interpolate(pillS, [0, 1], [0.86, 1])})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            width: 760,
            height: 108,
            padding: "0 34px",
            borderRadius: 26,
            background: COLORS.greenBg,
            border: `2px solid ${COLORS.greenBorder}`,
            boxShadow:
              "0 18px 44px rgba(22,163,74,0.10), 0 2px 6px rgba(18,24,40,0.04)",
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 18,
              background: "#fff",
              border: `1.5px solid ${COLORS.greenBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PitchIcon color={COLORS.green} />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 44,
              color: COLORS.ink,
              letterSpacing: -0.5,
              flex: 1,
            }}
          >
            Pitch range
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 40,
              color: COLORS.green,
              letterSpacing: -0.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ±{hz} Hz
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
