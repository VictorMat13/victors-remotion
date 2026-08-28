import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont();
const { fontFamily: mono } = loadMono();

export const DURATION_IN_FRAMES = 150;

// -------------------------------------------------------------------------
// White-Liam palette — green "alive / payoff" accent (answers FishVoiceBreaks)
// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  gray: "#E5E7EB",
  green: "#16A34A",
  greenDeep: "#15803D",
  greenLite: "#86EFAC",
  greenBright: "#22C55E",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

// -------------------------------------------------------------------------
// Timing (frames @ 30fps) — beats follow the spoken clauses
// -------------------------------------------------------------------------
const WRITE_START = 8;
const WRITE_END = 112; // playhead + typing + waveform all complete here
const BEAT2 = 58; // "removing the dead air"
const BEAT3 = 96; // "the voice carries emotion"

const PHRASE = "Sure — here's what I found for you.";

// -------------------------------------------------------------------------
// Waveform math (always lively = emotional; fills in behind the playhead)
// -------------------------------------------------------------------------
const N = 52;
const AMP = 118;

const speech = (i: number, f: number) => {
  const t = f * 0.3;
  let v =
    0.34 +
    0.4 * Math.abs(Math.sin(i * 0.5 + t)) +
    0.24 * Math.abs(Math.sin(i * 1.6 - t * 0.7)) +
    0.14 * Math.abs(Math.sin(i * 0.27 + t * 1.5));
  const edge = Math.sin((i / (N - 1)) * Math.PI); // gentle taper
  v *= 0.6 + 0.4 * edge;
  return Math.min(1, Math.max(0.14, v));
};

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
          "radial-gradient(1080px 900px at 50% 46%, rgba(22,163,74,0.09), rgba(22,163,74,0) 62%)",
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
          "radial-gradient(900px 820px at 50% 48%, #000 42%, transparent 86%)",
        maskImage:
          "radial-gradient(900px 820px at 50% 48%, #000 42%, transparent 86%)",
      }}
    />
  </AbsoluteFill>
);

// =========================================================================
// Small line icons
// =========================================================================
const Icon: React.FC<{ kind: "check" | "heart"; color: string }> = ({
  kind,
  color,
}) => {
  const st = {
    stroke: color,
    strokeWidth: 3.4,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "check")
    return (
      <svg viewBox="0 0 40 40" style={{ width: 40, height: 40 }}>
        <path d="M11 21 l6 6 l12 -14" {...st} />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 40" style={{ width: 40, height: 40 }}>
      <path
        d="M20 30 C 8 22, 8 12, 15 12 c 3 0 5 2 5 4 c 0 -2 2 -4 5 -4 c 7 0 7 10 -5 18 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// =========================================================================
// Green payoff chip — stamps in on its beat
// =========================================================================
const GoodChip: React.FC<{
  frame: number;
  fps: number;
  at: number;
  icon: "check" | "heart";
  label: string;
  metric: string;
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
  const x = interpolate(s, [0, 1], [-24, 0]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        width: 760,
        height: 100,
        padding: "0 34px",
        borderRadius: 26,
        background: COLORS.greenBg,
        border: `2px solid ${COLORS.greenBorder}`,
        boxShadow:
          "0 18px 44px rgba(22,163,74,0.12), 0 2px 6px rgba(18,24,40,0.04)",
        opacity: appear,
        transform: `translateX(${x}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 18,
          background: "#fff",
          border: `1.5px solid ${COLORS.greenBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon kind={icon} color={COLORS.green} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 42,
          color: COLORS.ink,
          letterSpacing: -0.5,
          flex: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 40,
          color: COLORS.green,
        }}
      >
        {metric}
      </div>
    </div>
  );
};

// =========================================================================
// Main
// =========================================================================
export const FishSpeaksAsItWrites: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [WRITE_START, WRITE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // entrances
  const eyebrow = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardS = spring({
    frame: frame - 3,
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const cardScale = interpolate(cardS, [0, 1], [0.96, 1]);

  // typed text
  const charN = Math.floor(progress * PHRASE.length);
  const typed = PHRASE.slice(0, charN);
  const caretOn = progress < 1 ? 1 : frame % 20 < 10 ? 1 : 0.15;

  // emotion flourish (beat 3) — waveform gets a touch more alive
  const emo = interpolate(frame, [BEAT3, BEAT3 + 20], [1, 1.13], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // live dot pulse
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.3);

  // card geometry
  const CARD = { x: 90, y: 222, w: 900, h: 520 };
  const INNER_L = 44;
  const INNER_R = 44;
  const playheadX = CARD.x + INNER_L + progress * (CARD.w - INNER_L - INNER_R);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Background />

      {/* Eyebrow / brand */}
      <div
        style={{
          position: "absolute",
          top: 132,
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
            width: 14,
            height: 14,
            background: COLORS.green,
            transform: "rotate(45deg)",
            borderRadius: 3,
          }}
        />
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 6,
            color: COLORS.green,
            textTransform: "uppercase",
          }}
        >
          Fish Audio
        </div>
      </div>

      {/* Hero card — speaks while it writes */}
      <div
        style={{
          position: "absolute",
          top: CARD.y,
          left: CARD.x,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 36,
          background: "#ffffff",
          border: `1px solid ${COLORS.cardBorder}`,
          boxShadow:
            "0 34px 80px rgba(18,24,40,0.10), 0 3px 8px rgba(18,24,40,0.05)",
          opacity: cardS,
          transform: `scale(${cardScale})`,
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 44,
            right: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 3,
              color: COLORS.muted,
              textTransform: "uppercase",
            }}
          >
            Speaks as it writes
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 14,
                background: COLORS.green,
                opacity: 0.35 + 0.65 * pulse,
                boxShadow: `0 0 ${8 + 10 * pulse}px ${COLORS.greenBright}`,
              }}
            />
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: 3,
                color: COLORS.green,
              }}
            >
              LIVE
            </div>
          </div>
        </div>

        {/* Lane 1 — LLM writing */}
        <div style={{ position: "absolute", top: 128, left: 44, right: 44 }}>
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 2,
              color: COLORS.muted,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            LLM
          </div>
          <div
            style={{
              fontFamily: mono,
              fontWeight: 500,
              fontSize: 40,
              color: COLORS.ink,
              lineHeight: 1.2,
              minHeight: 52,
            }}
          >
            {typed}
            <span style={{ color: COLORS.green, opacity: caretOn }}>▌</span>
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            position: "absolute",
            top: 300,
            left: 44,
            right: 44,
            height: 1,
            background: COLORS.cardBorder,
          }}
        />

        {/* Lane 2 — Fish voice, fills in behind the playhead */}
        <div style={{ position: "absolute", top: 330, left: 44, right: 44 }}>
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 2,
              color: COLORS.green,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Voice
          </div>
          {/* green glow that follows the fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 44,
              width: `${progress * 100}%`,
              height: AMP,
              background:
                "radial-gradient(closest-side, rgba(34,197,94,0.16), rgba(34,197,94,0) 100%)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: AMP,
            }}
          >
            {Array.from({ length: N }).map((_, i) => {
              const p = i / (N - 1);
              const active = p <= progress;
              if (!active) {
                return (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 6,
                      borderRadius: 4,
                      background: COLORS.gray,
                    }}
                  />
                );
              }
              const base = speech(i, frame);
              const dist = Math.abs(p - progress);
              const lead = dist < 0.05 ? (1 - dist / 0.05) * 0.5 : 0;
              const h = Math.max(8, base * (1 + lead) * emo * AMP);
              const col = interpolateColors(
                base,
                [0.14, 1],
                [COLORS.greenLite, COLORS.greenDeep],
              );
              return (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: h,
                    borderRadius: 5,
                    background: col,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Playhead — sweeps both lanes together = simultaneous */}
        <div
          style={{
            position: "absolute",
            left: playheadX - CARD.x,
            top: 120,
            width: 3,
            height: 372,
            background: COLORS.green,
            opacity:
              progress > 0 && progress < 1 ? 0.9 : progress >= 1 ? 0.35 : 0,
            boxShadow: `0 0 12px ${COLORS.greenBright}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -7,
              left: -5,
              width: 13,
              height: 13,
              borderRadius: 13,
              background: COLORS.green,
              boxShadow: `0 0 10px ${COLORS.greenBright}`,
            }}
          />
        </div>
      </div>

      {/* Supporting chips */}
      <div
        style={{
          position: "absolute",
          top: 792,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <GoodChip
          frame={frame}
          fps={fps}
          at={BEAT2}
          icon="check"
          label="Dead air removed"
          metric="0.0s"
        />
        <GoodChip
          frame={frame}
          fps={fps}
          at={BEAT3}
          icon="heart"
          label="Voice carries emotion"
          metric="100%"
        />
      </div>
    </AbsoluteFill>
  );
};
