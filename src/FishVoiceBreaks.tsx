import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  interpolateColors,
  spring,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 150;

// -------------------------------------------------------------------------
// White-Liam palette (pain-framed: red accents held in reserve for the wave)
// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  cardBorder: "#efefe9",
  slate: "#64748B", // healthy waveform
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FBCFCF",
};

// -------------------------------------------------------------------------
// Timing (frames @ 30fps)
// -------------------------------------------------------------------------
const BEAT1 = 18; //  sound robotic
const BEAT2 = 54; //  respond too slowly
const BEAT3 = 92; //  zero emotion
const RAMP = 30;

// -------------------------------------------------------------------------
// Waveform math
// -------------------------------------------------------------------------
const N = 41;
const AMP = 196;

const clamp01 = (v: number) => Math.min(1, Math.max(0.12, v));

const organic = (i: number, f: number) => {
  const t = f * 0.28;
  let v =
    0.3 +
    0.34 * Math.abs(Math.sin(i * 0.55 + t)) +
    0.22 * Math.abs(Math.sin(i * 1.7 - t * 0.8)) +
    0.14 * Math.abs(Math.sin(i * 0.23 + t * 1.4));
  const edge = Math.sin((i / (N - 1)) * Math.PI); // taper the ends like speech
  v *= 0.45 + 0.55 * edge;
  return clamp01(v);
};

// rigid, low-dynamic square wave in wide blocks = mechanical / monotone
const robotic = (i: number) => (Math.floor(i / 4) % 2 === 0 ? 0.62 : 0.3);

const flat = () => 0.02;

// =========================================================================
// Background — paper + soft red radial glow + masked graph grid
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(1180px 940px at 50% 46%, rgba(220,38,38,0.07), rgba(220,38,38,0) 62%)",
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
          "radial-gradient(1000px 900px at 50% 48%, #000 42%, transparent 86%)",
        maskImage:
          "radial-gradient(1000px 900px at 50% 48%, #000 42%, transparent 86%)",
      }}
    />
  </AbsoluteFill>
);

// =========================================================================
// Small line icons (drawn, not emoji — keeps it premium)
// =========================================================================
const Icon: React.FC<{ kind: "robot" | "clock" | "flat"; color: string }> = ({
  kind,
  color,
}) => {
  const s = { width: 40, height: 40 };
  const st = {
    stroke: color,
    strokeWidth: 3.2,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "robot")
    return (
      <svg viewBox="0 0 40 40" style={s}>
        <rect x="8" y="12" width="24" height="20" rx="6" {...st} />
        <line x1="20" y1="6" x2="20" y2="12" {...st} />
        <circle cx="20" cy="6" r="2" fill={color} />
        <circle cx="15" cy="21" r="2.3" fill={color} />
        <circle cx="25" cy="21" r="2.3" fill={color} />
        <line x1="15" y1="27" x2="25" y2="27" {...st} />
      </svg>
    );
  if (kind === "clock")
    return (
      <svg viewBox="0 0 40 40" style={s}>
        <circle cx="20" cy="21" r="13" {...st} />
        <line x1="20" y1="21" x2="20" y2="13" {...st} />
        <line x1="20" y1="21" x2="26" y2="24" {...st} />
        <line x1="14" y1="6" x2="26" y2="6" {...st} />
      </svg>
    );
  // flat / emotionless face
  return (
    <svg viewBox="0 0 40 40" style={s}>
      <circle cx="20" cy="20" r="14" {...st} />
      <circle cx="15" cy="17" r="2.2" fill={color} />
      <circle cx="25" cy="17" r="2.2" fill={color} />
      <line x1="13" y1="26" x2="27" y2="26" {...st} />
    </svg>
  );
};

// =========================================================================
// Red pain pill — stamps in on its beat
// =========================================================================
const PainTag: React.FC<{
  frame: number;
  fps: number;
  at: number;
  icon: "robot" | "clock" | "flat";
  label: string;
  metric?: string;
}> = ({ frame, fps, at, icon, label, metric }) => {
  const s = spring({
    frame: frame - at,
    fps,
    config: { damping: 13, stiffness: 170 },
  });
  const appear = interpolate(frame, [at, at + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(s, [0, 1], [0.86, 1]);
  const x = interpolate(s, [0, 1], [-26, 0]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        width: 760,
        height: 108,
        padding: "0 34px",
        borderRadius: 26,
        background: COLORS.redBg,
        border: `2px solid ${COLORS.redBorder}`,
        boxShadow:
          "0 18px 44px rgba(220,38,38,0.10), 0 2px 6px rgba(18,24,40,0.04)",
        opacity: appear,
        transform: `translateX(${x}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 66,
          height: 66,
          borderRadius: 18,
          background: "#fff",
          border: `1.5px solid ${COLORS.redBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon kind={icon} color={COLORS.red} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 44,
          color: COLORS.ink,
          letterSpacing: -0.5,
          flex: 1,
        }}
      >
        {label}
      </div>
      {metric ? (
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 40,
            color: COLORS.red,
            letterSpacing: -0.5,
          }}
        >
          {metric}
        </div>
      ) : null}
    </div>
  );
};

// =========================================================================
// Main
// =========================================================================
export const FishVoiceBreaks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // degradation mixes
  const robMix = interpolate(frame, [BEAT1, BEAT1 + RAMP], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flatMix = interpolate(frame, [BEAT3, BEAT3 + RAMP], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bad = Math.max(robMix, flatMix);
  const barColor = interpolateColors(bad, [0, 1], [COLORS.slate, COLORS.red]);

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

  // latency chip (beat 2)
  const latAppear = interpolate(frame, [BEAT2, BEAT2 + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const latSecs = interpolate(frame, [BEAT2 + 2, BEAT2 + 26], [0, 3.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spin = frame * 7;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Background />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          opacity: eyebrow,
          transform: `translateY(${interpolate(eyebrow, [0, 1], [-14, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: 9,
            background: COLORS.red,
          }}
        />
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 6,
            color: COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Most voice AI platforms
        </div>
      </div>

      {/* Hero wave card */}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 110,
          width: 860,
          height: 452,
          borderRadius: 36,
          background: "#ffffff",
          border: `1px solid ${COLORS.cardBorder}`,
          boxShadow:
            "0 34px 80px rgba(18,24,40,0.10), 0 3px 8px rgba(18,24,40,0.05)",
          opacity: cardS,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* card header */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            fontFamily,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Voice output
        </div>

        {/* latency chip (beat 2) */}
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 34,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            background: COLORS.redBg,
            border: `1.5px solid ${COLORS.redBorder}`,
            opacity: latAppear,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: 24, height: 24, transform: `rotate(${spin}deg)` }}
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke={COLORS.redBorder}
              strokeWidth="3"
            />
            <path
              d="M12 3 a9 9 0 0 1 9 9"
              fill="none"
              stroke={COLORS.red}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 30,
              color: COLORS.red,
            }}
          >
            {latSecs.toFixed(1)}s
          </span>
        </div>

        {/* waveform */}
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: N }).map((_, i) => {
            const h1 = organic(i, frame) * (1 - robMix) + robotic(i) * robMix;
            const h = h1 * (1 - flatMix) + flat() * flatMix;
            const px = Math.max(5, h * AMP);
            return (
              <div
                key={i}
                style={{
                  width: 9,
                  height: px,
                  borderRadius: 6,
                  background: barColor,
                }}
              />
            );
          })}
        </div>

        {/* flatline overlay (beat 3) */}
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            top: "50%",
            height: 4,
            borderRadius: 4,
            background: COLORS.red,
            opacity: flatMix,
            transform: "translateY(-2px)",
          }}
        />
      </div>

      {/* Pain tags */}
      <div
        style={{
          position: "absolute",
          top: 1000,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <PainTag
          frame={frame}
          fps={fps}
          at={BEAT1 + 4}
          icon="robot"
          label="Sounds robotic"
        />
        <PainTag
          frame={frame}
          fps={fps}
          at={BEAT2 + 4}
          icon="clock"
          label="Responds too slowly"
          metric="3.2s"
        />
        <PainTag
          frame={frame}
          fps={fps}
          at={BEAT3 + 4}
          icon="flat"
          label="Zero emotion"
          metric="0%"
        />
      </div>
    </AbsoluteFill>
  );
};
