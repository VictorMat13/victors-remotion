import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";

const { fontFamily: serifFamily } = loadSerif("normal", {
  weights: ["500", "600"],
});
const { fontFamily: sansFamily } = loadSans("normal", {
  weights: ["400", "600"],
});

export const DURATION_IN_FRAMES = 260;

// -------------------------------------------------------------------------
// Recreation of the SkillTree map (skilltree.altari.ai): a central particle
// "second brain" with seven department constellations around it, then a
// voice orb igniting in the middle of the tree. 1080x1080.
// -------------------------------------------------------------------------
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

// Deterministic RNG so every frame/thread generates the same world.
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
    // Bias density toward the middle, like the map's knowledge cloud
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
        // Keep every node inside the frame with breathing room
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

// -------------------------------------------------------------------------
// Camera — one keyframed move through the whole clip
// -------------------------------------------------------------------------
const KEY_T = [0, 52, 84, 150, 174, 236, 260];
const KEY_Z = [2.4, 2.28, 1.0, 1.0, 1.55, 1.55, 1.52];

// -------------------------------------------------------------------------
// Hub icons — minimal line marks like the map's department rings
// -------------------------------------------------------------------------
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
    default: // Deals — two stacked cards
      return (
        <>
          <rect x="4" y="7" width="12" height="14" rx="2.5" {...s} transform="rotate(-8 10 14)" />
          <rect x="9" y="5" width="12" height="14" rx="2.5" {...s} transform="rotate(7 15 12)" />
        </>
      );
  }
};

// -------------------------------------------------------------------------
export const FishSecondBrainTree: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = useMemo(buildParticles, []);
  const branches = useMemo(buildBranches, []);
  const stars = useMemo(buildStars, []);

  const zoom = interpolate(frame, KEY_T, KEY_Z, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- beat envelopes -----------------------------------------------------
  // Constellations reveal during the pull-out
  const treeReveal = (i: number) =>
    spring({
      frame: frame - (56 + i * 4),
      fps,
      config: { damping: 200, stiffness: 90 },
    });

  // Voice orb ignition
  const orbIn = spring({
    frame: frame - 176,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const condense = interpolate(frame, [166, 200], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const particleFade = interpolate(frame, [176, 210], [0.95, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Procedural voice envelope for the equalizer
  const HALF = 28;
  const env =
    0.4 +
    0.42 * Math.abs(Math.sin(frame * 0.34)) +
    0.18 * Math.abs(Math.sin(frame * 0.9));
  const barValues = Array.from({ length: HALF }).map((_, i) => {
    const v =
      0.25 +
      0.55 * Math.abs(Math.sin(i * 0.5 + frame * 0.28)) +
      0.3 * Math.abs(Math.sin(i * 1.4 - frame * 0.19));
    return Math.min(1, (v / 1.1) * env);
  });
  const amp = barValues.reduce((a, b) => a + b, 0) / HALF;

  const worldTransform = `translate(${540 - CX * zoom}px, ${
    540 - CY * zoom
  }px) scale(${zoom})`;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* ------- world ------- */}
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
          {/* starfield */}
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

          {/* dotted spines: brain -> each hub */}
          {DEPARTMENTS.map((dept, i) => {
            const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
            const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
            const rev = treeReveal(i);
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
                opacity={0.5 * rev}
              />
            );
          })}

          {/* constellations */}
          {branches.map((branch, i) => {
            const dept = DEPARTMENTS[i];
            const rev = treeReveal(i);
            const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
            const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
            // voice pulse arrival glow (beat 3)
            const pulseAge = frame - (188 + i * 5);
            const cyc = pulseAge > 0 ? (pulseAge % 44) / 22 : -1;
            const arrived =
              cyc >= 0.85 && cyc <= 1.3 ? 1 - Math.abs(cyc - 1) * 2.5 : 0;
            return (
              <g key={`br${i}`} opacity={rev}>
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
                  const pop = spring({
                    frame: frame - (58 + i * 4 + k * 2),
                    fps,
                    config: { damping: 14, stiffness: 160 },
                  });
                  return n.hollow ? (
                    <circle
                      key={`n${k}`}
                      cx={n.x}
                      cy={n.y}
                      r={n.r * pop}
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
                      r={n.r * pop}
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
                {/* hub ring */}
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

          {/* voice pulses traveling brain -> hubs (beat 3) */}
          {frame > 188 &&
            DEPARTMENTS.map((dept, i) => {
              const start = 188 + i * 5;
              if (frame < start) return null;
              const t = ((frame - start) % 44) / 22;
              if (t > 1) return null;
              const dist = 150 + (HUB_R - 196) * t;
              return (
                <circle
                  key={`pl${i}`}
                  cx={CX + Math.cos(deg(dept.angle)) * dist}
                  cy={CY + Math.sin(deg(dept.angle)) * dist}
                  r={4.5}
                  fill={COLORS.amberLite}
                  opacity={(1 - t * 0.5) * orbIn}
                />
              );
            })}

          {/* particle brain */}
          <g opacity={particleFade}>
            {particles.map((p, i) => {
              const dx =
                Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
              const dy =
                Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
                p.driftAmp;
              const px = CX + (p.x + dx) * condense;
              const py = CY + (p.y + dy) * condense;
              return (
                <circle
                  key={`p${i}`}
                  cx={px}
                  cy={py}
                  r={p.r}
                  fill={p.color}
                  opacity={0.55 + 0.45 * Math.sin(frame * 0.05 + p.phase)}
                />
              );
            })}
            {/* core spokes */}
            {particles.slice(0, 16).map((p, i) => {
              const dx =
                Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
              const dy =
                Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) *
                p.driftAmp;
              return (
                <line
                  key={`sk${i}`}
                  x1={CX + 8}
                  y1={CY - 4}
                  x2={CX + (p.x + dx) * condense}
                  y2={CY + (p.y + dy) * condense}
                  stroke={COLORS.node}
                  strokeWidth={0.7}
                  opacity={0.22}
                />
              );
            })}
            {/* amber core + white secondary core */}
            <circle
              cx={CX + 8}
              cy={CY - 4}
              r={9 + Math.sin(frame * 0.09) * 1.4}
              fill={COLORS.amber}
            />
            <circle cx={CX - 46} cy={CY - 42} r={5.5} fill={COLORS.cream} opacity={0.9} />
          </g>

          {/* ------- voice orb (beat 3) ------- */}
          {frame > 170 && (
            <g opacity={Math.min(1, orbIn * 1.2)}>
              <defs>
                <radialGradient id="orbCore" cx="50%" cy="45%" r="60%">
                  <stop offset="0%" stopColor={COLORS.amberLite} stopOpacity="0.98" />
                  <stop offset="65%" stopColor={COLORS.amber} stopOpacity="0.92" />
                  <stop offset="100%" stopColor={COLORS.amber} stopOpacity="0.7" />
                </radialGradient>
                <filter id="orbGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="26" />
                </filter>
              </defs>
              {/* glow */}
              <circle
                cx={CX}
                cy={CY}
                r={(96 + amp * 34) * orbIn}
                fill={COLORS.amber}
                opacity={0.22 + amp * 0.16}
                filter="url(#orbGlow)"
              />
              {/* ripple rings */}
              {[190, 214, 238].map((start, i) => {
                if (frame < start) return null;
                const t = Math.min(1, (frame - start) / 34);
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
              {/* radial equalizer */}
              <g transform={`rotate(${frame * 0.2} ${CX} ${CY})`}>
                {Array.from({ length: HALF * 2 }).map((_, k) => {
                  const v =
                    barValues[k < HALF ? k : HALF - 1 - (k - HALF)] ?? 0;
                  const theta = (k / (HALF * 2)) * Math.PI * 2 - Math.PI / 2;
                  const R0 = 62 * orbIn;
                  const len = (8 + v * 42) * orbIn;
                  return (
                    <line
                      key={`b${k}`}
                      x1={CX + Math.cos(theta) * R0}
                      y1={CY + Math.sin(theta) * R0}
                      x2={CX + Math.cos(theta) * (R0 + len)}
                      y2={CY + Math.sin(theta) * (R0 + len)}
                      stroke={v > 0.72 ? COLORS.cream : COLORS.amberLite}
                      strokeWidth={4.4}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
              {/* core */}
              <circle
                cx={CX}
                cy={CY}
                r={(44 + amp * 7) * orbIn}
                fill="url(#orbCore)"
              />
            </g>
          )}
        </svg>

        {/* department labels (HTML for clean type) */}
        {DEPARTMENTS.map((dept, i) => {
          const rev = treeReveal(i);
          // Labels are the hero at fit zoom; dim them while the camera
          // pushes in on the orb so no half-cropped words sit at the edges
          const dim = interpolate(frame, [150, 174], [1, 0.15], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const hx = CX + Math.cos(deg(dept.angle)) * HUB_R;
          const hy = CY + Math.sin(deg(dept.angle)) * HUB_R;
          const outX = Math.cos(deg(dept.angle));
          const outY = Math.sin(deg(dept.angle));
          // Push the label outward from the hub, then clamp into the frame
          // using whichever line is wider (serif name or sans sub-label)
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
                opacity: rev * dim,
                transform: `translateY(${(1 - rev) * 14}px)`,
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

        {/* message chips drifting out of the brain (beat 2) */}
        {[96, 114, 132].map((start, i) => {
          if (frame < start) return null;
          const t = (frame - start) / 48;
          if (t > 1) return null;
          const fadeIn = Math.min(1, (frame - start) / 8);
          const fadeOut = t > 0.72 ? Math.max(0, 1 - (t - 0.72) / 0.28) : 1;
          const chipX = CX - 150 + i * 40 + Math.sin(t * Math.PI) * (i - 1) * 30;
          const chipY = CY + 46 + t * 250;
          const pop = spring({
            frame: frame - start,
            fps,
            config: { damping: 15, stiffness: 170 },
          });
          return (
            <div
              key={`ch${i}`}
              style={{
                position: "absolute",
                left: chipX,
                top: chipY,
                width: 296,
                padding: "20px 24px",
                borderRadius: 20,
                background: "rgba(23,29,44,0.94)",
                border: `1px solid #2A3348`,
                boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                opacity: fadeIn * fadeOut,
                transform: `scale(${0.82 + 0.18 * pop}) rotate(${(i - 1) * 2.4}deg)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#2A3348",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: COLORS.amber,
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                <div
                  style={{
                    height: 9,
                    width: "88%",
                    borderRadius: 6,
                    background: "#4A5468",
                  }}
                />
                <div
                  style={{
                    height: 9,
                    width: "58%",
                    borderRadius: 6,
                    background: "#39425A",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ------- screen-space vignette ------- */}
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
