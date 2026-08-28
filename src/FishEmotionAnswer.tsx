import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  getAudioDurationInSeconds,
  useAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: serifFamily } = loadSerif("normal", {
  weights: ["500", "600"],
});
const { fontFamily: sansFamily } = loadSans("normal", {
  weights: ["400", "600"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["500", "700"],
});

// -------------------------------------------------------------------------
// Expressions beat: Ahmed asks the clone what it thought of the proposal
// (purple listening state, ~5s of space), then the clone answers with real
// audio — and its emotion tag pops up next to the orb as it chuckles.
// -------------------------------------------------------------------------
const AUDIO_SRC = "fish-audio/proposal-feedback.mp3";
const FPS = 30;
const AUDIO_START = 152; // ~5s of listening space first
const TAIL_PAD = 26;
const PLACEHOLDER_AUDIO_SEC = 3.2;

type Props = { hasAudio: boolean; audioFrames: number };

export const DURATION_IN_FRAMES =
  AUDIO_START + Math.round(PLACEHOLDER_AUDIO_SEC * FPS) + TAIL_PAD;

export const calculateEmotionAnswerMetadata = async ({
  props,
}: {
  props: Props;
}) => {
  let audioSec = PLACEHOLDER_AUDIO_SEC;
  let hasAudio = false;
  try {
    audioSec = await getAudioDurationInSeconds(staticFile(AUDIO_SRC));
    hasAudio = true;
  } catch {
    // audio not dropped yet — keep placeholder timing
  }
  const audioFrames = Math.round(audioSec * FPS);
  return {
    durationInFrames: AUDIO_START + audioFrames + TAIL_PAD,
    fps: FPS,
    props: { ...props, hasAudio, audioFrames },
  };
};

const COLORS = {
  bg: "#10141F",
  node: "#EDE6D2",
  nodeDim: "#6A7284",
  line: "#3A4152",
  dotted: "#4A5266",
  amber: "#E8A25B",
  amberLite: "#F2C88F",
  cream: "#F4EDDC",
  muted: "#8E96A8",
  // Altari purple — the input / thinking state
  purple: "#8B7BE8",
  purpleLite: "#B9A6F0",
  purpleGlow: "#9B8CF0",
};

const DEPARTMENTS = [
  { name: "Marketing", sub: "content · brand · distribution", color: "#9B8CF0", angle: -122 },
  { name: "Operations", sub: "onboarding · builds · client ops", color: "#4ECDC0", angle: -58 },
  { name: "Intelligence", sub: "companies · people · markets", color: "#5B9CF5", angle: -8 },
  { name: "Customer", sub: "support · success · community", color: "#E9739B", angle: 42 },
  { name: "Back Office", sub: "money in · books · office · people", color: "#E5C04B", angle: 90 },
  { name: "Sales", sub: "targeting · outreach · sequencing", color: "#E8965B", angle: 138 },
  { name: "Deals", sub: "replies · calls · closing · pipeline", color: "#E85D5D", angle: 188 },
];

const PARTICLE_PALETTE = [
  "#E8B36B",
  "#7FD1C3",
  "#8FB6F2",
  "#E89AB1",
  "#B9A6F0",
  "#EDE3CE",
  "#A8D8A0",
];

const CX = 540;
const CY = 540;
const HUB_R = 285;

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

const deg = (d: number) => (d * Math.PI) / 180;

type Particle = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  driftAmp: number;
  driftSpeed: number;
};

type BranchNode = { x: number; y: number; r: number; hollow: boolean };
type Branch = {
  nodes: BranchNode[];
  links: [number, number][];
  chargeDots: { x: number; y: number }[];
};

const buildParticles = (): Particle[] => {
  const rnd = mulberry32(20260729);
  const particles: Particle[] = [];
  for (let i = 0; i < 195; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = Math.pow(rnd(), 0.62) * 132;
    particles.push({
      x: Math.cos(ang) * rad * 1.08,
      y: Math.sin(ang) * rad * 0.88,
      r: 1.6 + rnd() * 3.4,
      color: PARTICLE_PALETTE[Math.floor(rnd() * PARTICLE_PALETTE.length)],
      phase: rnd() * Math.PI * 2,
      driftAmp: 5 + rnd() * 9,
      driftSpeed: 0.008 + rnd() * 0.016,
    });
  }
  return particles;
};

const buildBranches = (): Branch[] => {
  const rnd = mulberry32(99120711);
  return DEPARTMENTS.map((dept) => {
    const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
    const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
    const nodes: BranchNode[] = [];
    const links: [number, number][] = [];
    const chargeDots: { x: number; y: number }[] = [];
    const chainCount = 2 + Math.floor(rnd() * 2);
    for (let c = 0; c < chainCount; c++) {
      const spread = (c - (chainCount - 1) / 2) * (30 + rnd() * 14);
      let dir = dept.angle + spread + (rnd() - 0.5) * 14;
      let px = hx + Math.cos(deg(dir)) * 40;
      let py = hy + Math.sin(deg(dir)) * 40;
      let prevIndex = -1;
      const steps = 3 + Math.floor(rnd() * 3);
      for (let s = 0; s < steps; s++) {
        const step = 38 + rnd() * 22;
        dir += (rnd() - 0.5) * 42;
        px += Math.cos(deg(dir)) * step;
        py += Math.sin(deg(dir)) * step;
        px = Math.min(1010, Math.max(70, px));
        py = Math.min(1010, Math.max(70, py));
        nodes.push({
          x: px,
          y: py,
          r: 3.5 + rnd() * 5.5,
          hollow: rnd() < 0.25,
        });
        const idx = nodes.length - 1;
        if (prevIndex >= 0) links.push([prevIndex, idx]);
        prevIndex = idx;
      }
      chargeDots.push({
        x: hx + Math.cos(deg(dir + (rnd() - 0.5) * 30)) * (54 + rnd() * 10),
        y: hy + Math.sin(deg(dir + (rnd() - 0.5) * 30)) * (54 + rnd() * 10),
      });
    }
    return { nodes, links, chargeDots };
  });
};

const buildStars = () => {
  const rnd = mulberry32(31337);
  return Array.from({ length: 110 }).map(() => ({
    x: -400 + rnd() * 1880,
    y: -400 + rnd() * 1880,
    r: 0.8 + rnd() * 1.6,
    opacity: 0.08 + rnd() * 0.22,
    phase: rnd() * Math.PI * 2,
  }));
};

const HubIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  const s = { stroke: color, strokeWidth: 2.4, fill: "none" } as const;
  switch (name) {
    case "Marketing":
      return <polygon points="12,7 21,22 3,22" {...s} strokeLinejoin="round" transform="rotate(180 12 14.5)" />;
    case "Operations":
      return <polygon points="12,4 20,8.5 20,17.5 12,22 4,17.5 4,8.5" {...s} strokeLinejoin="round" />;
    case "Intelligence":
      return (
        <>
          <circle cx="11" cy="11" r="6.5" {...s} />
          <line x1="16" y1="16" x2="21.5" y2="21.5" {...s} strokeLinecap="round" />
        </>
      );
    case "Customer":
      return (
        <>
          <circle cx="12" cy="9" r="4.5" {...s} />
          <path d="M4 22 c0 -6 4.5 -8.5 8 -8.5 s8 2.5 8 8.5" {...s} strokeLinecap="round" />
        </>
      );
    case "Back Office":
      return (
        <text
          x="12"
          y="19"
          textAnchor="middle"
          style={{ fontFamily: serifFamily, fontSize: 20, fontWeight: 600 }}
          fill={color}
          stroke="none"
        >
          $
        </text>
      );
    case "Sales":
      return (
        <>
          <line x1="19" y1="19" x2="6" y2="6" {...s} strokeLinecap="round" />
          <polyline points="6,14 6,6 14,6" {...s} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    default:
      return (
        <>
          <rect x="4" y="7" width="12" height="14" rx="2.5" {...s} transform="rotate(-8 10 14)" />
          <rect x="9" y="5" width="12" height="14" rx="2.5" {...s} transform="rotate(7 15 12)" />
        </>
      );
  }
};

// visualizeAudio requires a power-of-two sample count
const HALF = 32;

const wrapAngle = (a: number) => {
  const TWO_PI = Math.PI * 2;
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
};

const Scene: React.FC<{ barValues: number[]; audioFrames: number }> = ({
  barValues,
  audioFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const particles = useMemo(buildParticles, []);
  const branches = useMemo(buildBranches, []);
  const stars = useMemo(buildStars, []);

  // Camera: already pushed in on the orb; subtle drift, small settle on answer
  const KEY_T = [0, 140, 156, durationInFrames - 24, durationInFrames];
  const KEY_Z = [1.6, 1.56, 1.5, 1.5, 1.49];
  const zoom = interpolate(frame, KEY_T, KEY_Z, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 0 = listening (purple input), 1 = answering (amber voice)
  const mix = interpolate(frame, [142, 156], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const listening = mix < 0.5;
  const audioEnd = AUDIO_START + audioFrames;

  const main = interpolateColors(mix, [0, 1], [COLORS.purple, COLORS.amber]);
  const lite = interpolateColors(
    mix,
    [0, 1],
    [COLORS.purpleLite, COLORS.amberLite],
  );
  const hot = interpolateColors(mix, [0, 1], ["#D9CFFA", COLORS.cream]);

  const amp = barValues.reduce((a, b) => a + b, 0) / HALF;

  // Loading sweep — a comet of raised bars rotating around the ring
  const sweepPos = frame * 0.11;

  const worldTransform = `translate(${540 - CX * zoom}px, ${
    540 - CY * zoom
  }px) scale(${zoom})`;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          transform: worldTransform,
          transformOrigin: "0 0",
        }}
      >
        <svg
          viewBox="-400 -400 1880 1880"
          style={{
            position: "absolute",
            left: -400,
            top: -400,
            width: 1880,
            height: 1880,
            overflow: "visible",
          }}
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

          {/* dotted spines */}
          {DEPARTMENTS.map((dept, i) => {
            const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
            const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
            return (
              <line
                key={`sp${i}`}
                x1={CX + Math.cos(deg(dept.angle)) * 150}
                y1={CY + Math.sin(deg(dept.angle)) * 150}
                x2={hx - Math.cos(deg(dept.angle)) * 46}
                y2={hy - Math.sin(deg(dept.angle)) * 46}
                stroke={COLORS.dotted}
                strokeWidth={1.6}
                strokeDasharray="2 11"
                strokeLinecap="round"
                opacity={0.5}
              />
            );
          })}

          {/* constellations (fully revealed, twinkling) */}
          {branches.map((branch, i) => {
            const dept = DEPARTMENTS[i];
            const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
            const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
            const pulseAge = frame - (AUDIO_START + 6 + i * 5);
            const speaking = frame < audioEnd;
            const cyc = pulseAge > 0 && speaking ? (pulseAge % 44) / 22 : -1;
            const arrived =
              cyc >= 0.85 && cyc <= 1.3 ? 1 - Math.abs(cyc - 1) * 2.5 : 0;
            return (
              <g key={`br${i}`}>
                {branch.links.map(([a, b], k) => (
                  <line
                    key={`l${k}`}
                    x1={branch.nodes[a].x}
                    y1={branch.nodes[a].y}
                    x2={branch.nodes[b].x}
                    y2={branch.nodes[b].y}
                    stroke={COLORS.line}
                    strokeWidth={1.4}
                    opacity={0.85}
                  />
                ))}
                {branch.nodes.map((n, k) => {
                  const twinkle =
                    0.75 + 0.25 * Math.sin(frame * 0.06 + k * 1.7 + i * 2.3);
                  return n.hollow ? (
                    <circle
                      key={`n${k}`}
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={COLORS.bg}
                      stroke={COLORS.nodeDim}
                      strokeWidth={1.6}
                      opacity={0.9}
                    />
                  ) : (
                    <circle
                      key={`n${k}`}
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={COLORS.node}
                      opacity={Math.min(1, twinkle + arrived * 0.25)}
                    />
                  );
                })}
                {branch.chargeDots.map((d, k) => (
                  <circle
                    key={`c${k}`}
                    cx={d.x}
                    cy={d.y}
                    r={3}
                    fill={dept.color}
                    opacity={0.9}
                  />
                ))}
                <circle
                  cx={hx}
                  cy={hy}
                  r={44}
                  fill="none"
                  stroke={dept.color}
                  strokeWidth={1}
                  opacity={0.16 + Math.max(0, arrived) * 0.4}
                />
                <circle
                  cx={hx}
                  cy={hy}
                  r={34}
                  fill="rgba(16,20,31,0.92)"
                  stroke={dept.color}
                  strokeWidth={1.8}
                  opacity={0.95}
                />
                <g transform={`translate(${hx - 12}, ${hy - 13})`}>
                  <HubIcon name={dept.name} color={dept.color} />
                </g>
              </g>
            );
          })}

          {/* input pulses: purple dots flowing INWARD while listening */}
          {listening &&
            DEPARTMENTS.map((dept, i) => {
              const start = 10 + i * 6;
              if (frame < start) return null;
              const t = ((frame - start) % 40) / 20;
              if (t > 1) return null;
              const dist = 150 + (HUB_R - 196) * (1 - t);
              return (
                <circle
                  key={`in${i}`}
                  cx={CX + Math.cos(deg(dept.angle)) * dist}
                  cy={CY + Math.sin(deg(dept.angle)) * dist}
                  r={4.5}
                  fill={COLORS.purpleLite}
                  opacity={0.35 + t * 0.5}
                />
              );
            })}

          {/* answer pulses: amber dots flowing OUTWARD while speaking */}
          {!listening &&
            frame < audioEnd &&
            DEPARTMENTS.map((dept, i) => {
              const start = AUDIO_START + 6 + i * 5;
              if (frame < start) return null;
              const t = ((frame - start) % 44) / 22;
              if (t > 1) return null;
              const dist = 150 + (HUB_R - 196) * t;
              return (
                <circle
                  key={`out${i}`}
                  cx={CX + Math.cos(deg(dept.angle)) * dist}
                  cy={CY + Math.sin(deg(dept.angle)) * dist}
                  r={4.5}
                  fill={COLORS.amberLite}
                  opacity={1 - t * 0.5}
                />
              );
            })}

          {/* condensed particle halo around the orb */}
          <g opacity={0.45}>
            {particles.map((p, i) => {
              const dx =
                Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
              const dy =
                Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
                p.driftAmp;
              return (
                <circle
                  key={`p${i}`}
                  cx={CX + (p.x + dx) * 0.5}
                  cy={CY + (p.y + dy) * 0.5}
                  r={p.r}
                  fill={p.color}
                  opacity={0.55 + 0.45 * Math.sin(frame * 0.05 + p.phase)}
                />
              );
            })}
          </g>

          {/* ------- the orb ------- */}
          <defs>
            <radialGradient id="coreAmber" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor={COLORS.amberLite} stopOpacity="0.98" />
              <stop offset="65%" stopColor={COLORS.amber} stopOpacity="0.92" />
              <stop offset="100%" stopColor={COLORS.amber} stopOpacity="0.7" />
            </radialGradient>
            <radialGradient id="corePurple" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor={COLORS.purpleLite} stopOpacity="0.98" />
              <stop offset="65%" stopColor={COLORS.purple} stopOpacity="0.92" />
              <stop offset="100%" stopColor={COLORS.purple} stopOpacity="0.7" />
            </radialGradient>
            <filter id="orbGlow3" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
          </defs>

          {/* glow */}
          <circle
            cx={CX}
            cy={CY}
            r={96 + amp * 34 + (listening ? 6 * Math.sin(frame * 0.12) : 0)}
            fill={main}
            opacity={0.22 + amp * 0.16}
            filter="url(#orbGlow3)"
          />

          {/* answer-resolve ring burst */}
          {frame >= 146 && frame < 182 && (
            <circle
              cx={CX}
              cy={CY}
              r={70 + ((frame - 146) / 36) * 300}
              fill="none"
              stroke={hot}
              strokeWidth={2 * (1 - (frame - 146) / 36)}
              opacity={0.6 * (1 - (frame - 146) / 36)}
            />
          )}

          {/* ripple rings while the answer plays */}
          {Array.from({ length: 8 }).map((_, i) => {
            const start = AUDIO_START + 8 + i * 26;
            if (frame < start || start > audioEnd) return null;
            const t = Math.min(1, (frame - start) / 34);
            if (t >= 1) return null;
            return (
              <circle
                key={`rp${i}`}
                cx={CX}
                cy={CY}
                r={70 + t * 260}
                fill="none"
                stroke={COLORS.amberLite}
                strokeWidth={1.6 * (1 - t)}
                opacity={0.5 * (1 - t)}
              />
            );
          })}

          {/* radial equalizer — idle+sweep while listening, audio-driven after */}
          <g transform={`rotate(${frame * 0.2} ${CX} ${CY})`}>
            {Array.from({ length: HALF * 2 }).map((_, k) => {
              const v = barValues[k < HALF ? k : HALF - 1 - (k - HALF)] ?? 0;
              const theta = (k / (HALF * 2)) * Math.PI * 2 - Math.PI / 2;
              // rotating comet boost (the "thinking" spinner), fades out on mix
              const diff = Math.min(
                wrapAngle(theta - sweepPos),
                Math.PI * 2 - wrapAngle(theta - sweepPos),
              );
              const boost = Math.max(0, 1 - diff / 0.85) * (1 - mix);
              const idle =
                0.08 + 0.05 * Math.sin(frame * 0.18 + k * 0.9);
              const value = Math.min(1, v * mix + idle * (1 - mix) + boost * 0.75);
              const R0 = 62;
              const len = 8 + value * 42;
              return (
                <line
                  key={`b${k}`}
                  x1={CX + Math.cos(theta) * R0}
                  y1={CY + Math.sin(theta) * R0}
                  x2={CX + Math.cos(theta) * (R0 + len)}
                  y2={CY + Math.sin(theta) * (R0 + len)}
                  stroke={value > 0.72 ? hot : lite}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* orbiting "thinking" dots while listening */}
          {mix < 1 &&
            Array.from({ length: 3 }).map((_, i) => {
              const a = frame * 0.055 + i * ((Math.PI * 2) / 3);
              const rr = 128 + 6 * Math.sin(frame * 0.1 + i * 2);
              return (
                <circle
                  key={`od${i}`}
                  cx={CX + Math.cos(a) * rr}
                  cy={CY + Math.sin(a) * rr * 0.98}
                  r={5}
                  fill={COLORS.purpleLite}
                  opacity={0.85 * (1 - mix)}
                />
              );
            })}

          {/* core — purple crossfades to amber on the answer */}
          <circle
            cx={CX}
            cy={CY}
            r={44 + amp * 7 + (listening ? 2.5 * Math.sin(frame * 0.12) : 0)}
            fill="url(#corePurple)"
            opacity={1 - mix}
          />
          <circle
            cx={CX}
            cy={CY}
            r={44 + amp * 7}
            fill="url(#coreAmber)"
            opacity={mix}
          />
        </svg>

        {/* department labels — dimmed, camera is on the orb */}
        {DEPARTMENTS.map((dept, i) => {
          const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
          const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
          const outX = Math.cos(deg(dept.angle));
          const outY = Math.sin(deg(dept.angle));
          const estW = Math.max(
            dept.name.length * 24 + 40,
            dept.sub.length * 9.2 + 40,
          );
          let lx = hx + outX * 128;
          let ly = hy + outY * 118 + (Math.abs(outY) < 0.4 ? -80 : 0);
          lx = Math.min(1020 - estW / 2, Math.max(60 + estW / 2, lx));
          ly = Math.min(985, Math.max(95, ly));
          return (
            <div
              key={`lb${i}`}
              style={{
                position: "absolute",
                left: lx - 300,
                top: ly - 30,
                width: 600,
                textAlign: "center",
                opacity: 0.15,
              }}
            >
              <div
                style={{
                  fontFamily: serifFamily,
                  fontWeight: 500,
                  fontSize: 34,
                  letterSpacing: 8,
                  color: COLORS.cream,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {dept.name}
              </div>
              <div
                style={{
                  fontFamily: sansFamily,
                  fontWeight: 400,
                  fontSize: 14,
                  letterSpacing: 2,
                  color: COLORS.muted,
                  marginTop: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {dept.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* emotion tag — the expression the clone was given */}
      {frame >= AUDIO_START + 2 &&
        (() => {
          const tagStart = AUDIO_START + 2;
          const pop = spring({
            frame: frame - tagStart,
            fps,
            config: { damping: 13, stiffness: 170 },
          });
          const fade = interpolate(
            frame,
            [tagStart + 74, tagStart + 94],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const drift = interpolate(frame - tagStart, [0, 94], [0, -24], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 246 + drift,
                display: "flex",
                justifyContent: "center",
                opacity: pop * fade,
              }}
            >
              <div
                style={{
                  marginLeft: 430,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "rgba(23,29,44,0.94)",
                  border: "1px solid #2A3348",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
                  fontFamily: monoFamily,
                  fontWeight: 500,
                  fontSize: 32,
                  color: COLORS.amberLite,
                  transform: `scale(${0.85 + 0.15 * pop})`,
                }}
              >
                [laughing]
              </div>
            </div>
          );
        })()}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(140% 130% at 50% 48%, rgba(0,0,0,0) 55%, rgba(6,8,14,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const WithAudio: React.FC<{ audioFrames: number }> = ({ audioFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(AUDIO_SRC));

  let values = new Array(HALF).fill(0);
  if (audioData && frame >= AUDIO_START) {
    const raw = visualizeAudio({
      fps,
      frame: frame - AUDIO_START,
      audioData,
      numberOfSamples: HALF,
    });
    values = raw.map((v) => Math.min(1, Math.sqrt(v) * 2.4));
  }

  return (
    <>
      <Sequence from={AUDIO_START}>
        <Audio src={staticFile(AUDIO_SRC)} />
      </Sequence>
      <Scene barValues={values} audioFrames={audioFrames} />
    </>
  );
};

const Procedural: React.FC<{ audioFrames: number }> = ({ audioFrames }) => {
  const frame = useCurrentFrame();
  const active = frame >= AUDIO_START && frame < AUDIO_START + audioFrames;
  const env = active
    ? 0.4 +
      0.42 * Math.abs(Math.sin(frame * 0.34)) +
      0.18 * Math.abs(Math.sin(frame * 0.9))
    : 0;
  const values = Array.from({ length: HALF }).map((_, i) => {
    const v =
      0.25 +
      0.55 * Math.abs(Math.sin(i * 0.5 + frame * 0.28)) +
      0.3 * Math.abs(Math.sin(i * 1.4 - frame * 0.19));
    return Math.min(1, (v / 1.1) * env);
  });
  return <Scene barValues={values} audioFrames={audioFrames} />;
};

export const FishEmotionAnswer: React.FC<Props> = ({ hasAudio, audioFrames }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {hasAudio ? (
        <WithAudio audioFrames={audioFrames} />
      ) : (
        <Procedural audioFrames={audioFrames} />
      )}
    </AbsoluteFill>
  );
};
