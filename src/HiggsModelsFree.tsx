import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 200; // 6.7s @ 30fps

// Paper Liam palette + Higgsfield lime
const COLORS = {
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  lime: "#84CC16",
  limeDeep: "#65A30D",
  limeBrand: "#D1FE17",
  cable: "#D9D3CA",
};

const FONT = fontFamily;

// Beat timeline
const PULSE_START = 58;
const PULSE_END = 104;
const SPINE_TOP = 360;
const SPINE_BOTTOM = 1600;

const ROW_Y0 = 470;
const ROW_STEP = 152;

// Real Higgsfield catalog flagships (verified 2026-07-30; Sora 2 no longer offered)
const MODELS: { name: string; logo: string }[] = [
  { name: "Veo 3.1", logo: "higgs3/logos/gemini.svg" },
  { name: "Kling 3.0", logo: "higgs3/logos/kling-color.svg" },
  { name: "Seedance 2.0", logo: "higgs3/logos/bytedance-color.svg" },
  { name: "Nano Banana Pro", logo: "higgs3/logos/gemini.svg" },
  { name: "GPT Image 2", logo: "higgs3/logos/openai.svg" },
  { name: "Grok Video", logo: "higgs3/logos/grok.svg" },
  { name: "Minimax Hailuo", logo: "higgs3/logos/hailuo-color.svg" },
  { name: "FLUX.2", logo: "higgs3/logos/flux.svg" },
];

const rowY = (i: number) => ROW_Y0 + i * ROW_STEP;
const flipFrame = (i: number) =>
  PULSE_START +
  (PULSE_END - PULSE_START) * ((rowY(i) - SPINE_TOP) / (SPINE_BOTTOM - SPINE_TOP));

// ---------------------------------------------------------------------------
// Model row — logo + name + PAID chip that flips to FREE as the pulse passes
// ---------------------------------------------------------------------------

const ModelRow: React.FC<{ index: number; name: string; logo: string }> = ({
  index,
  name,
  logo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - (8 + index * 4),
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const fAt = flipFrame(index);
  const flip = spring({
    frame: frame - fAt,
    fps,
    config: { damping: 15, stiffness: 220 },
  });
  const passPulse = interpolate(frame, [fAt, fAt + 4, fAt + 12], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const borderColor =
    passPulse > 0.02
      ? `rgba(101,163,13,${0.3 + 0.45 * passPulse})`
      : COLORS.line;

  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: rowY(index) - 66,
        width: 840,
        height: 132,
        borderRadius: 26,
        background: COLORS.card,
        border: `1.5px solid ${borderColor}`,
        boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "0 36px 0 30px",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26 - passPulse * 4}px)`,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Img
          src={staticFile(logo)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: COLORS.ink,
          flex: 1,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
      {/* two-layer chip crossfade: PAID → FREE */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "10px 24px",
            borderRadius: 999,
            background: "rgba(25,23,20,0.04)",
            border: `1.5px solid ${COLORS.line}`,
            opacity: 1 - flip,
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 2.5,
            color: COLORS.muted,
          }}
        >
          PAID
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            display: "inline-flex",
            padding: "10px 24px",
            borderRadius: 999,
            background: "rgba(132,204,22,0.14)",
            border: `1.5px solid ${COLORS.limeDeep}`,
            opacity: flip,
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 2.5,
            color: COLORS.limeDeep,
          }}
        >
          FREE
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition — 1080x1920
// ---------------------------------------------------------------------------

export const HiggsModelsFree: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera — slow drift down following the pulse, then settle
  const camEase = Easing.inOut(Easing.cubic);
  const camCy = interpolate(frame, [0, 55, 115, 200], [925, 925, 1000, 965], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  });
  const camZ = interpolate(frame, [0, 55, 115, 200], [1.06, 1.05, 1.04, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  });

  const headerIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  // Pulse traveling down the spine
  const pulseY = interpolate(
    frame,
    [PULSE_START, PULSE_END],
    [SPINE_TOP, SPINE_BOTTOM],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );
  const pulseVisible = frame >= PULSE_START && frame <= PULSE_END;
  const energized = Math.min(
    1,
    Math.max(0, (pulseY - SPINE_TOP) / (SPINE_BOTTOM - SPINE_TOP)),
  );

  // Glow warms up once everything is free
  const glowBoost = interpolate(frame, [PULSE_END, PULSE_END + 20], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ∞ badge — unlimited, no words needed
  const badgePop = spring({
    frame: frame - (PULSE_END + 12),
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* Camera world */}
      <AbsoluteFill
        style={{
          transform: `translate(540px, 960px) scale(${camZ}) translate(-540px, ${-camCy}px)`,
          transformOrigin: "0 0",
        }}
      >
        {/* Grid with generous bleed */}
        <div
          style={{
            position: "absolute",
            left: -400,
            top: -500,
            width: 1880,
            height: 2920,
            backgroundImage:
              "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Lime glow — brightens when the catalog goes free */}
        <div
          style={{
            position: "absolute",
            left: 540 - 760,
            top: 900 - 760,
            width: 1520,
            height: 1520,
            background:
              "radial-gradient(circle at 50% 50%, rgba(132,204,22,0.10), rgba(0,0,0,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 760,
            top: 900 - 760,
            width: 1520,
            height: 1520,
            background:
              "radial-gradient(circle at 50% 50%, rgba(132,204,22,0.10), rgba(0,0,0,0) 62%)",
            opacity: glowBoost,
          }}
        />

        {/* Spine cable — energizes lime behind the pulse */}
        <svg
          width="1080"
          height="1920"
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={540}
            y1={SPINE_TOP}
            x2={540}
            y2={SPINE_BOTTOM}
            stroke={COLORS.cable}
            strokeWidth={4}
          />
          {energized > 0 && (
            <line
              x1={540}
              y1={SPINE_TOP}
              x2={540}
              y2={SPINE_TOP + energized * (SPINE_BOTTOM - SPINE_TOP)}
              stroke="rgba(132,204,22,0.75)"
              strokeWidth={4}
            />
          )}
          <circle cx={540} cy={SPINE_TOP - 2} r={6} fill="#C6BFB4" />
          <circle cx={540} cy={SPINE_BOTTOM + 2} r={6} fill="#C6BFB4" />
          {pulseVisible && (
            <circle cx={540} cy={pulseY} r={8} fill={COLORS.limeDeep} />
          )}
        </svg>

        {/* Model rows (behind header visually irrelevant — no overlap) */}
        {MODELS.map((m, i) => (
          <ModelRow key={m.name} index={i} name={m.name} logo={m.logo} />
        ))}

        {/* Header — Higgsfield mark + wordmark */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 300,
            width: 1080,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 26,
            transform: `translateY(${(1 - headerIn) * -24}px)`,
            opacity: headerIn,
          }}
        >
          <div style={{ position: "relative" }}>
            <Img
              src={staticFile("higgs3/logos/higgsfield-icon.png")}
              style={{ width: 96, height: 96, borderRadius: 22, display: "block" }}
            />
            {/* ∞ badge pops once everything is free */}
            <div
              style={{
                position: "absolute",
                right: -22,
                top: -22,
                width: 56,
                height: 56,
                borderRadius: 999,
                background: COLORS.limeBrand,
                border: "1px solid rgba(25,23,20,0.14)",
                boxShadow: "0 10px 24px rgba(25,23,20,0.14)",
                display: "grid",
                placeItems: "center",
                transform: `scale(${badgePop}) rotate(${(1 - badgePop) * -30}deg)`,
                opacity: badgePop > 0.02 ? 1 : 0,
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 34,
                  fontWeight: 800,
                  color: COLORS.ink,
                  lineHeight: 1,
                }}
              >
                ∞
              </span>
            </div>
          </div>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -1.8,
              color: COLORS.ink,
            }}
          >
            Higgsfield
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
