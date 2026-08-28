import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";

const { fontFamily: sansFamily } = loadSans("normal", {
  weights: ["400", "600", "700"],
});

// -------------------------------------------------------------------------
// "Drop a 10-second clip into Fish Audio's S2.1 Pro… wired it straight into
// the brain." The real clip drops into an upload zone, clones on the spot,
// then a wire draws down and pulses it into the second brain. 1080x1920.
// -------------------------------------------------------------------------
export const DURATION_IN_FRAMES = 300;

const VIDEO_SRC = "fish-audio/clone-recording.mp4";
const LOGO_SRC = "fish-audio/logo-dark.png";

const COLORS = {
  bg: "#10141F",
  panel: "rgba(23,29,44,0.94)",
  border: "#2A3348",
  node: "#EDE6D2",
  amber: "#E8A25B",
  amberLite: "#F2C88F",
  cream: "#F4EDDC",
  muted: "#8E96A8",
};

const PARTICLE_PALETTE = [
  "#E8B36B",
  "#7FD1C3",
  "#8FB6F2",
  "#E89AB1",
  "#B9A6F0",
  "#EDE3CE",
  "#A8D8A0",
];

// Card geometry (9:16 clip card, safe-margin compliant)
const CARD_W = 620;
const CARD_H = 1102;
const CARD_X = (1080 - CARD_W) / 2;
const CARD_Y = 178;
const CARD_BOTTOM = CARD_Y + CARD_H;

// Brain
const BX = 540;
const BY = 1580;

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

type Particle = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  driftAmp: number;
  driftSpeed: number;
};

const buildParticles = (): Particle[] => {
  const rnd = mulberry32(20260729);
  const particles: Particle[] = [];
  for (let i = 0; i < 150; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = Math.pow(rnd(), 0.62) * 118;
    particles.push({
      x: Math.cos(ang) * rad * 1.12,
      y: Math.sin(ang) * rad * 0.82,
      r: 1.5 + rnd() * 3.2,
      color: PARTICLE_PALETTE[Math.floor(rnd() * PARTICLE_PALETTE.length)],
      phase: rnd() * Math.PI * 2,
      driftAmp: 4 + rnd() * 8,
      driftSpeed: 0.008 + rnd() * 0.016,
    });
  }
  return particles;
};

const buildStars = () => {
  const rnd = mulberry32(31337);
  return Array.from({ length: 130 }).map(() => ({
    x: rnd() * 1080,
    y: rnd() * 1920,
    r: 0.8 + rnd() * 1.6,
    opacity: 0.08 + rnd() * 0.22,
    phase: rnd() * Math.PI * 2,
  }));
};

export const FishCloneWiredIn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(buildParticles, []);
  const stars = useMemo(buildStars, []);

  // The clip drops in like a file
  const drop = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 110, mass: 1.1 },
  });
  const cardY = interpolate(drop, [0, 1], [-CARD_H - 80, CARD_Y]);
  const cardTilt = interpolate(drop, [0, 1], [-4, 0]);

  // Cloning progress, then the cloned-voice waveform
  const progress = interpolate(frame, [26, 54], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waveIn = spring({
    frame: frame - 58,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // Wire draws down into the brain
  const wire = interpolate(frame, [64, 84], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wireY = CARD_BOTTOM + 44 + (BY - 90 - (CARD_BOTTOM + 44)) * wire;

  // Brain wakes up once the first pulse lands
  const brainWake = interpolate(frame, [104, 126], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const worldScale = 1 + frame * 0.00006;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${worldScale})`,
          transformOrigin: "540px 960px",
        }}
      >
        {/* starfield */}
        <svg
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
        >
          {stars.map((st, i) => (
            <circle
              key={`st${i}`}
              cx={st.x}
              cy={st.y}
              r={st.r}
              fill={COLORS.node}
              opacity={st.opacity * (0.7 + 0.3 * Math.sin(frame * 0.03 + st.phase))}
            />
          ))}

          {/* wire from card to brain */}
          {wire > 0 && (
            <>
              <line
                x1={540}
                y1={CARD_BOTTOM + 44}
                x2={540}
                y2={wireY}
                stroke={COLORS.amberLite}
                strokeWidth={2.2}
                strokeDasharray="3 12"
                strokeLinecap="round"
                opacity={0.8}
              />
              <circle cx={540} cy={wireY} r={4} fill={COLORS.amberLite} />
            </>
          )}

          {/* pulses traveling down the wire */}
          {frame >= 88 &&
            Array.from({ length: 9 }).map((_, i) => {
              const start = 88 + i * 24;
              if (frame < start) return null;
              const t = (frame - start) / 18;
              if (t > 1) return null;
              const y = CARD_BOTTOM + 44 + (BY - 90 - (CARD_BOTTOM + 44)) * t;
              return (
                <circle
                  key={`pl${i}`}
                  cx={540}
                  cy={y}
                  r={6}
                  fill={COLORS.amberLite}
                  opacity={0.95}
                />
              );
            })}

          {/* ripple rings when pulses land */}
          {Array.from({ length: 9 }).map((_, i) => {
            const land = 88 + i * 24 + 18;
            if (frame < land) return null;
            const t = (frame - land) / 30;
            if (t > 1) return null;
            return (
              <circle
                key={`rp${i}`}
                cx={BX}
                cy={BY}
                r={40 + t * 180}
                fill="none"
                stroke={COLORS.amberLite}
                strokeWidth={1.6 * (1 - t)}
                opacity={0.45 * (1 - t)}
              />
            );
          })}

          {/* the second brain */}
          <g opacity={0.75 + brainWake * 0.25}>
            {particles.map((p, i) => {
              const dx =
                Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
              const dy =
                Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
                p.driftAmp;
              return (
                <circle
                  key={`p${i}`}
                  cx={BX + p.x + dx}
                  cy={BY + p.y + dy}
                  r={p.r}
                  fill={p.color}
                  opacity={0.55 + 0.45 * Math.sin(frame * 0.05 + p.phase)}
                />
              );
            })}
            {particles.slice(0, 14).map((p, i) => {
              const dx =
                Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
              const dy =
                Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
                p.driftAmp;
              return (
                <line
                  key={`sk${i}`}
                  x1={BX + 6}
                  y1={BY - 3}
                  x2={BX + p.x + dx}
                  y2={BY + p.y + dy}
                  stroke={COLORS.node}
                  strokeWidth={0.7}
                  opacity={0.22}
                />
              );
            })}
            <circle
              cx={BX + 6}
              cy={BY - 3}
              r={
                9 +
                Math.sin(frame * 0.09) * 1.4 +
                brainWake * 3 +
                (frame >= 106 ? 2 * Math.abs(Math.sin(frame * 0.16)) : 0)
              }
              fill={COLORS.amber}
            />
            <circle cx={BX - 40} cy={BY - 34} r={5} fill={COLORS.cream} opacity={0.9} />
          </g>
        </svg>

        {/* Fish Audio header chip */}
        <div
          style={{
            position: "absolute",
            top: 92,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 22px",
              borderRadius: 999,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Img
              src={staticFile(LOGO_SRC)}
              style={{ height: 34, display: "block" }}
            />
            <div
              style={{
                fontFamily: sansFamily,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 3,
                color: COLORS.amberLite,
                textTransform: "uppercase",
              }}
            >
              S2.1 Pro
            </div>
          </div>
        </div>

        {/* dashed drop zone */}
        <div
          style={{
            position: "absolute",
            left: CARD_X - 16,
            top: CARD_Y - 16,
            width: CARD_W + 32,
            height: CARD_H + 32,
            borderRadius: 40,
            border: `2px dashed ${COLORS.muted}`,
            opacity: interpolate(drop, [0, 1], [0.55, 0.22]),
          }}
        />

        {/* the 10-second clip card */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: cardY,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            transform: `rotate(${cardTilt}deg)`,
          }}
        >
          <OffthreadVideo
            src={staticFile(VIDEO_SRC)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* clip duration chip — the "10-second clip" */}
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(10,13,22,0.72)",
              border: "1px solid rgba(255,255,255,0.14)",
              fontFamily: sansFamily,
              fontWeight: 600,
              fontSize: 24,
              color: COLORS.cream,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            0:10
          </div>
        </div>

        {/* cloning progress -> cloned-voice waveform */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CARD_BOTTOM - 10,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [20, 28], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              position: "relative",
              width: 420,
              height: 64,
              borderRadius: 999,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* progress track */}
            <div
              style={{
                position: "absolute",
                left: 26,
                right: 26,
                height: 10,
                borderRadius: 6,
                background: "#232B40",
                opacity: 1 - waveIn,
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.amberLite})`,
                }}
              />
            </div>
            {/* cloned voice waveform */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                opacity: waveIn,
                transform: `scale(${0.8 + 0.2 * waveIn})`,
              }}
            >
              {Array.from({ length: 16 }).map((_, i) => {
                const h =
                  10 +
                  26 *
                    Math.abs(Math.sin(i * 0.9 + frame * 0.22)) *
                    (0.5 + 0.5 * Math.abs(Math.sin(frame * 0.09 + i)));
                return (
                  <div
                    key={`w${i}`}
                    style={{
                      width: 7,
                      height: h,
                      borderRadius: 4,
                      background: i % 4 === 0 ? COLORS.cream : COLORS.amberLite,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(150% 120% at 50% 44%, rgba(0,0,0,0) 55%, rgba(6,8,14,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
