import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  interpolateColors,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 230;

const MONO =
  "'SF Mono', ui-monospace, Menlo, 'Cascadia Mono', 'Roboto Mono', monospace";

// -------------------------------------------------------------------------
// White-Liam palette (pain-framed, answers FishVoiceBreaks)
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
// Timing (frames @ 30fps) — beats follow the spoken clauses
// -------------------------------------------------------------------------
// "Most voice generators sound fine"            → calm typing + slate wave
// "until the script needs emotion"              → sweep on the emotional phrase
// "the flat delivery gives the whole thing away"→ wave goes uniform red, gauge 0%
const T_TYPE_START = 16;
const T_WAVE_START = 22;
const T_WAVE_END = 216;
const T_SWEEP_START = 92; // the emotional phrase lands
const T_SWEEP_END = 112;
const T_CLIFF = 132; // delivery goes flat
const T_PILL1 = 154;
const T_PILL2 = 166;

// script — line 2 is the emotional peak the voice has to carry
const LINE1 = "No way… you actually";
const LINE2 = "did this for me!";
const TYPE_END = 92; // both lines fully typed just before the cliff

// -------------------------------------------------------------------------
// Waveform math — organic slate while it "sounds fine", uniform red after
// -------------------------------------------------------------------------
const N = 41;
const AMP = 176;

const clamp01 = (v: number) => Math.min(1, Math.max(0.12, v));

// each bar keeps the shape it was stamped with — a recorded trace, not a dance
const organic = (i: number) => {
  let v =
    0.3 +
    0.34 * Math.abs(Math.sin(i * 0.55 + 1.3)) +
    0.22 * Math.abs(Math.sin(i * 1.7 - 0.8)) +
    0.14 * Math.abs(Math.sin(i * 0.23 + 2.1));
  const edge = Math.sin((i / (N - 1)) * Math.PI);
  v *= 0.45 + 0.55 * edge;
  return clamp01(v);
};

const FLAT_H = 0.16; // the giveaway: identical low blocks

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
// Small line icons (drawn, not emoji)
// =========================================================================
const Icon: React.FC<{ kind: "flat" | "pitch"; color: string }> = ({
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
  if (kind === "flat")
    return (
      <svg viewBox="0 0 40 40" style={s}>
        <circle cx="20" cy="20" r="14" {...st} />
        <circle cx="15" cy="17" r="2.2" fill={color} />
        <circle cx="25" cy="17" r="2.2" fill={color} />
        <line x1="13" y1="26" x2="27" y2="26" {...st} />
      </svg>
    );
  // pitch — a wave collapsing into a line
  return (
    <svg viewBox="0 0 40 40" style={s}>
      <path d="M5 20 Q 9 10 13 20 T 21 20" {...st} />
      <line x1="21" y1="20" x2="35" y2="20" {...st} />
    </svg>
  );
};

// =========================================================================
// Red pain pill — stamps in on its beat (series component)
// =========================================================================
const PainTag: React.FC<{
  frame: number;
  fps: number;
  at: number;
  icon: "flat" | "pitch";
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
// Emotion gauge — dial + % readout, pins to zero at the cliff
// =========================================================================
const Gauge: React.FC<{ frame: number }> = ({ frame }) => {
  // healthy wobble ~36%, then slide to 0 at the cliff
  const wobble = 36 + 4 * Math.sin(frame * 0.18);
  const drop = interpolate(frame, [T_CLIFF + 2, T_CLIFF + 16], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // small dead shudder right after it pins
  const shudder =
    frame > T_CLIFF + 16 && frame < T_CLIFF + 30
      ? 1.4 * Math.sin((frame - T_CLIFF - 16) * 1.9)
      : 0;
  const pct = wobble * drop;
  const bad = 1 - drop;
  const color = interpolateColors(bad, [0, 1], [COLORS.slate, COLORS.red]);
  const bg = interpolateColors(bad, [0, 1], ["#ffffff", COLORS.redBg]);
  const border = interpolateColors(
    bad,
    [0, 1],
    [COLORS.cardBorder, COLORS.redBorder],
  );

  // dial: 220° arc, needle from 0% (left) to 100% (right)
  const ang = -200 + (pct / 100) * 220 + shudder;
  const rad = (ang * Math.PI) / 180;
  const nx = 20 + Math.cos(rad) * 12;
  const ny = 22 + Math.sin(rad) * 12;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 18px",
        borderRadius: 999,
        background: bg,
        border: `1.5px solid ${border}`,
      }}
    >
      <svg viewBox="0 0 40 30" style={{ width: 40, height: 30 }}>
        <path
          d="M 8.7 30.2 A 14 14 0 1 1 31.3 30.2"
          fill="none"
          stroke={COLORS.line}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="22"
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="22" r="2.4" fill={color} />
      </svg>
      <span
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 30,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
};

// =========================================================================
// Main
// =========================================================================
export const FishFlatDelivery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // typewriter — line 1 calm, line 2 lands just before the cliff
  const chars1 = Math.round(
    interpolate(frame, [T_TYPE_START, 58], [0, LINE1.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const chars2 = Math.round(
    interpolate(frame, [60, TYPE_END], [0, LINE2.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const cursorOn = Math.floor(frame / 9) % 2 === 0;
  const cursorLine = chars2 > 0 || frame >= 60 ? 2 : 1;

  // highlight sweep across the emotional phrase (end of part 1)
  const sweep = interpolate(frame, [T_SWEEP_START, T_SWEEP_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // waveform playhead — stamps bars left to right across the full read
  const progress = interpolate(frame, [T_WAVE_START, T_WAVE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shown = progress * N;
  // bar index reached at the cliff — everything after is flat
  const cliffIdx = ((T_CLIFF - T_WAVE_START) / (T_WAVE_END - T_WAVE_START)) * N;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Background />

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
          Most voice generators
        </div>
      </div>

      {/* Hero card — script on top, voice trace below */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 110,
          width: 860,
          height: 560,
          borderRadius: 36,
          background: "#ffffff",
          border: `1px solid ${COLORS.cardBorder}`,
          boxShadow:
            "0 34px 80px rgba(18,24,40,0.10), 0 3px 8px rgba(18,24,40,0.05)",
          opacity: cardS,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* header */}
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
          Script
        </div>

        {/* emotion gauge */}
        <div style={{ position: "absolute", top: 22, right: 34 }}>
          <Gauge frame={frame} />
        </div>

        {/* script text */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 44,
            right: 44,
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 46,
            lineHeight: 1.42,
            color: COLORS.ink,
            letterSpacing: -0.5,
          }}
        >
          <div>
            {LINE1.slice(0, chars1)}
            {cursorLine === 1 && cursorOn ? (
              <span style={{ color: COLORS.slate }}>▍</span>
            ) : null}
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* highlight sweep behind the emotional phrase */}
            <span
              style={{
                position: "absolute",
                left: -8,
                right: -8,
                top: "10%",
                bottom: "6%",
                background: COLORS.red,
                opacity: 0.16,
                transform: `scaleX(${sweep}) rotate(-1.2deg)`,
                transformOrigin: "left center",
                clipPath: "polygon(0 8%,100% 0,99.5% 92%,1% 100%)",
                borderRadius: 6,
              }}
            />
            <span style={{ position: "relative" }}>
              {LINE2.slice(0, chars2)}
              {cursorLine === 2 && cursorOn ? (
                <span style={{ color: sweep > 0 ? COLORS.red : COLORS.slate }}>
                  ▍
                </span>
              ) : null}
            </span>
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            position: "absolute",
            top: 288,
            left: 40,
            right: 40,
            height: 1,
            background: COLORS.line,
          }}
        />

        {/* voice label */}
        <div
          style={{
            position: "absolute",
            top: 312,
            left: 40,
            fontFamily,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 3,
            color: COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Voice
        </div>

        {/* waveform trace */}
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            top: 348,
            bottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: N }).map((_, i) => {
            const stamped = shown > i;
            // pop each bar in as the playhead reaches it
            const pop = Math.min(1, Math.max(0, shown - i));
            const isFlat = i >= cliffIdx;
            const h = isFlat ? FLAT_H : organic(i);
            const px = Math.max(5, h * AMP * (0.4 + 0.6 * pop));
            // ahead of the playhead: neutral ghost ticks — no color spoiler
            const bg = stamped
              ? isFlat
                ? COLORS.red
                : COLORS.slate
              : COLORS.line;
            return (
              <div
                key={i}
                style={{
                  width: 9,
                  height: stamped ? px : 5,
                  borderRadius: 6,
                  background: bg,
                }}
              />
            );
          })}
          {/* flatline hairline under the dead section */}
          <div
            style={{
              position: "absolute",
              left: `${(cliffIdx / N) * 100}%`,
              right: 0,
              top: "50%",
              height: 4,
              borderRadius: 4,
              background: COLORS.red,
              opacity: interpolate(
                frame,
                [T_CLIFF + 8, T_CLIFF + 26],
                [0, 0.85],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              ),
              transform: "translateY(-2px)",
            }}
          />
        </div>
      </div>

      {/* Pain tags — the giveaway, in data */}
      <div
        style={{
          position: "absolute",
          top: 754,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <PainTag
          frame={frame}
          fps={fps}
          at={T_PILL1}
          icon="flat"
          label="Emotion"
          metric="0%"
        />
        <PainTag
          frame={frame}
          fps={fps}
          at={T_PILL2}
          icon="pitch"
          label="Pitch range"
          metric="±0 Hz"
        />
      </div>
    </AbsoluteFill>
  );
};
