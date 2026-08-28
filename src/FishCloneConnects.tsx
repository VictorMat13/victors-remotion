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
// the brain." Part 1: Victor's real clone-creation screen recording in a
// card with dynamic zooms. Part 2: the card hands off — the second brain
// fades in below and the clone wires into it. 1080x1920, 300 frames.
// -------------------------------------------------------------------------
export const DURATION_IN_FRAMES = 300;

const VIDEO_SRC = "fish-audio/open-fish-audio.mp4";
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

// Source footage: 1438x1080; the app window sits at roughly x180-1260,
// y108-972. We crop to that window and fill the card with it.
const SRC_W = 1438;
const CROP_X = 180;
const CROP_Y = 108;
const CROP_W = 1080;
const CROP_H = 864;

const CARD_W = 940;
const CARD_H = Math.round((CARD_W / CROP_W) * CROP_H); // 752
const CARD_X = (1080 - CARD_W) / 2;
const CARD_Y = 250;

// Brain
const BX = 540;
const BY = 1500;

// Timeline
const HANDOFF = 172; // card scales away, brain fades in
const WIRE_START = 198;
const PULSES_START = 222;

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

export const FishCloneConnects: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(buildParticles, []);
  const stars = useMemo(buildStars, []);

  // Card entrance — present from frame 0 (no fade: an empty first frame
  // reads as a black frame), just a quick scale settle
  const cardIn =
    0.94 +
    0.06 *
      spring({
        frame,
        fps,
        config: { damping: 18, stiffness: 120 },
      });

  // Dynamic internal zoom over the recording: punch in on the drop zone,
  // ease out as the pages change, gentle push on the details page
  const innerZoom = interpolate(frame, [0, 60, 96, 150, HANDOFF], [1.14, 1.1, 1.0, 1.06, 1.0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Part 2: card scales away to the top, brain connects below
  const handoff = interpolate(frame, [HANDOFF, HANDOFF + 30], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(handoff, [0, 1], [1, 0.62]);
  const cardTop = interpolate(handoff, [0, 1], [CARD_Y, 170]);
  const cardBottomNow = cardTop + CARD_H * cardScale;

  // Brain entrance: particles converge as it fades in
  const brainIn = interpolate(frame, [HANDOFF + 6, HANDOFF + 40], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const converge = interpolate(brainIn, [0, 1], [1.7, 1]);

  // Wire draw
  const wire = interpolate(frame, [WIRE_START, WIRE_START + 20], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wireTopY = cardBottomNow + 26;
  const wireEndY = wireTopY + (BY - 84 - wireTopY) * wire;

  // Brain wakes as pulses land
  const brainWake = interpolate(frame, [PULSES_START + 16, PULSES_START + 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Video display mapping (crop the app window into the card)
  const fit = CARD_W / CROP_W;
  const vidW = SRC_W * fit;
  const vidLeft = -CROP_X * fit;
  const vidTop = -CROP_Y * fit;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* starfield + wire + brain */}
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
              y1={wireTopY}
              x2={540}
              y2={wireEndY}
              stroke={COLORS.amberLite}
              strokeWidth={2.2}
              strokeDasharray="3 12"
              strokeLinecap="round"
              opacity={0.8}
            />
            <circle cx={540} cy={wireEndY} r={4} fill={COLORS.amberLite} />
          </>
        )}

        {/* pulses down the wire */}
        {frame >= PULSES_START &&
          Array.from({ length: 6 }).map((_, i) => {
            const start = PULSES_START + i * 22;
            if (frame < start) return null;
            const t = (frame - start) / 16;
            if (t > 1) return null;
            const y = wireTopY + (BY - 84 - wireTopY) * t;
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
        {Array.from({ length: 6 }).map((_, i) => {
          const land = PULSES_START + i * 22 + 16;
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
        <g opacity={brainIn * (0.78 + brainWake * 0.22)}>
          {particles.map((p, i) => {
            const dx =
              Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
            const dy =
              Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
              p.driftAmp;
            return (
              <circle
                key={`p${i}`}
                cx={BX + (p.x + dx) * converge}
                cy={BY + (p.y + dy) * converge}
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
                x2={BX + (p.x + dx) * converge}
                y2={BY + (p.y + dy) * converge}
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
              (frame >= PULSES_START + 16
                ? 2 * Math.abs(Math.sin(frame * 0.16))
                : 0)
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
          top: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) * interpolate(handoff, [0, 1], [1, 0]),
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
          <Img src={staticFile(LOGO_SRC)} style={{ height: 34, display: "block" }} />
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

      {/* the recording card */}
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: cardTop,
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${cardIn * cardScale})`,
          transformOrigin: "50% 0%",
          borderRadius: 30,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* internal dynamic zoom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${innerZoom})`,
            transformOrigin: "60% 36%",
          }}
        >
          <OffthreadVideo
            src={staticFile(VIDEO_SRC)}
            muted
            style={{
              position: "absolute",
              left: vidLeft,
              top: vidTop,
              width: vidW,
              height: "auto",
            }}
          />
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
