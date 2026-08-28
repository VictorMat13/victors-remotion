import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["500", "700"],
});

// -------------------------------------------------------------------------
// "I just built a voice agent in five minutes, for free."
// The wireframe blob ASSEMBLES ring by ring while a stopwatch races to 5:00
// and a $0.00 pill locks in. Then the finished agent wakes and pulses.
// 1080x1080, paper style. Counters are data — no narration text on screen.
// -------------------------------------------------------------------------
export const DURATION_IN_FRAMES = 240;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  blue: "#2563EB",
  meshCyan: "#22D3EE",
  meshViolet: "#8B5CF6",
  meshPink: "#EC4899",
};

const RINGS = 16;
const RING_SAMPLES = 84;
const MERIDIAN_SAMPLES = 48;
const R_MIN = 55;
const R_MAX = 185;
const MERIDIAN_LONGITUDES = [-1.25, -0.9, -0.58, -0.28, 0.28, 0.58, 0.9, 1.25];
const BLOB_X = 540;
const BLOB_Y = 588;
const BLOB_SCALE = 1.18;

// timeline
const ASSEMBLY_START = 6;
const RING_STAGGER = 5; // one ring every 5 frames
const MERIDIAN_START = ASSEMBLY_START + RINGS * RING_STAGGER - 14; // ~72
const TIMER_START = 8;
const TIMER_END = 104; // 0:00 -> 5:00 locks here
const PRICE_IN = 116;
const WAKE = 124; // finished agent pulses alive

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type RingSpec = {
  baseR: number;
  yOff: number;
  wobble: number;
  opacity: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};
type MeridianSpec = {
  phi: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};

const buildMesh = (): { rings: RingSpec[]; meridians: MeridianSpec[] } => {
  const rnd = mulberry32(52814);
  const rings: RingSpec[] = Array.from({ length: RINGS }).map((_, i) => {
    const t = i / (RINGS - 1);
    return {
      baseR: R_MIN + (R_MAX - R_MIN) * t,
      yOff: 14 * t,
      wobble: 0.6 + 0.7 * t,
      opacity: 0.4 + 0.45 * t,
      a1: 0.02 + rnd() * 0.07,
      a2: 0.02 + rnd() * 0.07,
      a3: 0.02 + rnd() * 0.07,
      p1: rnd() * Math.PI * 2,
      p2: rnd() * Math.PI * 2,
      p3: rnd() * Math.PI * 2,
    };
  });
  const meridians: MeridianSpec[] = MERIDIAN_LONGITUDES.map((phi) => ({
    phi,
    a1: 0.02 + rnd() * 0.05,
    a2: 0.02 + rnd() * 0.05,
    a3: 0.02 + rnd() * 0.05,
    p1: rnd() * Math.PI * 2,
    p2: rnd() * Math.PI * 2,
    p3: rnd() * Math.PI * 2,
  }));
  return { rings, meridians };
};

export const FishAgentInFive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mesh = useMemo(buildMesh, []);

  // ---- stopwatch: 0:00 -> 5:00, easing out so it sprints then lands ----
  const timerT = interpolate(frame, [TIMER_START, TIMER_END], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const totalSec = Math.round(timerT * 300);
  const mm = Math.floor(totalSec / 60);
  const ss = String(totalSec % 60).padStart(2, "0");
  const timerLock = spring({
    frame: frame - TIMER_END,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  const timerScale =
    frame < TIMER_END ? 1 : 1 + 0.1 * Math.sin(Math.PI * Math.min(1, timerLock));
  const timerIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  // ---- price pill ----
  const priceIn =
    frame < PRICE_IN
      ? 0
      : spring({
          frame: frame - PRICE_IN,
          fps,
          config: { damping: 12, stiffness: 170 },
        });

  // ---- blob assembly + wake ----
  const wakeRamp = interpolate(frame, [WAKE, WAKE + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const env =
    (0.35 +
      0.38 * Math.abs(Math.sin(frame * 0.3)) +
      0.16 * Math.abs(Math.sin(frame * 0.85))) *
    wakeRamp;
  const amp = Math.min(1, env);
  const ampScale = 0.35 + 0.9 * amp;
  const blobScale = BLOB_SCALE * (1 + 0.07 * amp);
  const squashY = 0.94 + 0.02 * Math.sin(frame * 0.05);
  const rotRad = (frame * 0.25 * Math.PI) / 180;

  const meshNoise = (
    s: { a1: number; a2: number; a3: number; p1: number; p2: number; p3: number },
    th: number,
  ) =>
    s.a1 * Math.sin(3 * th + s.p1 + frame * 0.03) +
    s.a2 * Math.sin(5 * th - s.p2 + frame * 0.021) +
    s.a3 * Math.sin(8 * th + s.p3 + frame * 0.045);

  const ringPath = (rg: RingSpec) => {
    let d = "";
    for (let k = 0; k < RING_SAMPLES; k++) {
      const th = (k / RING_SAMPLES) * Math.PI * 2;
      const r =
        rg.baseR * (1 + rg.wobble * ampScale * meshNoise(rg, th + rotRad));
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r + rg.yOff;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
  };

  const meridianPath = (m: MeridianSpec) => {
    const sinPhi = Math.sin(m.phi + rotRad);
    let d = "";
    for (let k = 0; k <= MERIDIAN_SAMPLES; k++) {
      const u = -Math.PI / 2 + (k / MERIDIAN_SAMPLES) * Math.PI;
      const R = (R_MAX - 3) * (1 + ampScale * meshNoise(m, u));
      const x = Math.cos(u) * R * sinPhi;
      const y = Math.sin(u) * R;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* paper glow + masked grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1100px 1100px at 50% 55%, rgba(37,99,235,0.10), transparent 60%)",
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
            "radial-gradient(980px 980px at 50% 50%, #000 40%, transparent 82%)",
          maskImage:
            "radial-gradient(980px 980px at 50% 50%, #000 40%, transparent 82%)",
        }}
      />

      {/* blob assembling ring by ring */}
      <svg
        viewBox="0 0 1080 1080"
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1080,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient
            id="faifMesh"
            gradientUnits="userSpaceOnUse"
            x1={-R_MAX}
            y1={-R_MAX}
            x2={R_MAX}
            y2={R_MAX}
          >
            <stop offset="0%" stopColor={COLORS.meshCyan} />
            <stop offset="34%" stopColor={COLORS.blue} />
            <stop offset="67%" stopColor={COLORS.meshViolet} />
            <stop offset="100%" stopColor={COLORS.meshPink} />
          </linearGradient>
          <radialGradient id="faifGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.10" />
            <stop offset="60%" stopColor={COLORS.meshPink} stopOpacity="0.06" />
            <stop offset="100%" stopColor={COLORS.meshPink} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${BLOB_X} ${BLOB_Y}) scale(${blobScale})`}>
          <circle
            cx={0}
            cy={0}
            r={230}
            fill="url(#faifGlow)"
            opacity={interpolate(frame, [ASSEMBLY_START, 90], [0.3, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
          <g transform={`scale(1 ${squashY})`} fill="none">
            {mesh.meridians.map((m, i) => {
              const inAt = MERIDIAN_START + i * 3;
              const o = interpolate(frame, [inAt, inAt + 12], [0, 0.3], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              if (o <= 0) return null;
              return (
                <path
                  key={`md${i}`}
                  d={meridianPath(m)}
                  stroke="url(#faifMesh)"
                  strokeWidth={1.4}
                  strokeOpacity={o}
                  strokeLinecap="round"
                />
              );
            })}
            {mesh.rings.map((rg, i) => {
              // rings assemble inside-out, each popping with a small spring
              const inAt = ASSEMBLY_START + i * RING_STAGGER;
              if (frame < inAt) return null;
              const pop = spring({
                frame: frame - inAt,
                fps,
                config: { damping: 13, stiffness: 160 },
              });
              return (
                <g key={`rg${i}`} transform={`scale(${0.6 + 0.4 * pop})`}>
                  <path
                    d={ringPath(rg)}
                    stroke="url(#faifMesh)"
                    strokeWidth={1.4}
                    strokeOpacity={rg.opacity * pop}
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* stopwatch pill — the five minutes */}
      <div
        style={{
          position: "absolute",
          top: 108,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: timerIn,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 34px",
            borderRadius: 999,
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow:
              "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)",
            transform: `scale(${timerScale})`,
          }}
        >
          {/* stopwatch icon */}
          <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
            <circle
              cx="12"
              cy="13.5"
              r="8"
              fill="none"
              stroke={COLORS.blue}
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="13.5"
              x2="12"
              y2="8.5"
              stroke={COLORS.blue}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${timerT * 720} 12 13.5)`}
            />
            <line
              x1="9.5"
              y1="2.5"
              x2="14.5"
              y2="2.5"
              stroke={COLORS.blue}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="2.5"
              x2="12"
              y2="5"
              stroke={COLORS.blue}
              strokeWidth="2"
            />
          </svg>
          <div
            style={{
              fontFamily: monoFamily,
              fontWeight: 700,
              fontSize: 54,
              color: COLORS.ink,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 1,
            }}
          >
            {mm}:{ss}
          </div>
        </div>
      </div>

      {/* $0.00 pill — the "for free" as data */}
      {priceIn > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: Math.min(1, priceIn * 1.2),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 32px",
              borderRadius: 999,
              background: "#ffffff",
              border: `1px solid ${COLORS.cardBorder}`,
              boxShadow:
                "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)",
              transform: `scale(${0.8 + 0.2 * priceIn})`,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: COLORS.meshPink,
              }}
            />
            <div
              style={{
                fontFamily: monoFamily,
                fontWeight: 700,
                fontSize: 44,
                color: COLORS.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              $0.00
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
