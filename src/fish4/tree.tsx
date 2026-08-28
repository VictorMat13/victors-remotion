// Shared Skilltree scene library for the Fish Audio 4 series.
// Adapted from the approved fish 3 build (FishBrainTalksBack) and re-skinned
// to the Altari purple world. Geometry matches the REAL product screenshots
// in public/fish4/reference/ (7 departments, radial constellation branches,
// particle brain center, serif letterspaced labels).
// READ-ONLY for builder agents: import from here, compose in your own comp.

import React from "react";
import { spring, useVideoConfig } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { ALTARI, TREE, GRID_LINE, GRID_SIZE } from "./theme";

export const { fontFamily: serifFamily } = loadSerif("normal", {
  weights: ["500", "600"],
});
export const { fontFamily: manropeFamily } = loadManrope("normal", {
  weights: ["400", "500", "600", "700", "800"],
});

// World coordinates: the tree lives in a 1080x1080 world. Builders place it
// inside their own camera-transformed div (any canvas ratio).
export const CX = 540;
export const CY = 540;
export const HUB_R = 285;

export const DEPARTMENTS = [
  { name: "Marketing", sub: "content · brand · distribution", color: "#9B8CF0", angle: -122 },
  { name: "Operations", sub: "onboarding · builds · client ops", color: "#4ECDC0", angle: -58 },
  { name: "Intelligence", sub: "companies · people · markets", color: "#5B9CF5", angle: -8 },
  { name: "Customer", sub: "support · success · community", color: "#E9739B", angle: 42 },
  { name: "Back Office", sub: "money in · books · office · people", color: "#E5C04B", angle: 90 },
  { name: "Sales", sub: "targeting · outreach · sequencing", color: "#E8965B", angle: 138 },
  { name: "Deals", sub: "replies · calls · closing · pipeline", color: "#E85D5D", angle: 188 },
] as const;

// Handy indices (match DEPARTMENTS order)
export const DEPT = {
  Marketing: 0,
  Operations: 1,
  Intelligence: 2,
  Customer: 3,
  BackOffice: 4,
  Sales: 5,
  Deals: 6,
} as const;

const PARTICLE_PALETTE = [
  "#E8B36B",
  "#7FD1C3",
  "#8FB6F2",
  "#E89AB1",
  "#B9A6F0",
  "#EDE3CE",
  "#A8D8A0",
];

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const deg = (d: number) => (d * Math.PI) / 180;

export const hubPos = (i: number) => ({
  x: CX + Math.cos(deg(DEPARTMENTS[i].angle)) * HUB_R,
  y: CY + Math.sin(deg(DEPARTMENTS[i].angle)) * HUB_R,
});

type Particle = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  driftAmp: number;
  driftSpeed: number;
};

export type BranchNode = { x: number; y: number; r: number; hollow: boolean };
export type Branch = {
  nodes: BranchNode[];
  links: [number, number][];
  chargeDots: { x: number; y: number }[];
};

export const buildParticles = (): Particle[] => {
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

export const buildBranches = (): Branch[] => {
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

export const buildStars = () => {
  const rnd = mulberry32(31337);
  return Array.from({ length: 110 }).map(() => ({
    x: -400 + rnd() * 1880,
    y: -400 + rnd() * 1880,
    r: 0.8 + rnd() * 1.6,
    opacity: 0.08 + rnd() * 0.22,
    phase: rnd() * Math.PI * 2,
  }));
};

export const HubIcon: React.FC<{ name: string; color: string }> = ({
  name,
  color,
}) => {
  const s = { stroke: color, strokeWidth: 2.4, fill: "none" } as const;
  switch (name) {
    case "Marketing":
      return (
        <polygon
          points="12,7 21,22 3,22"
          {...s}
          strokeLinejoin="round"
          transform="rotate(180 12 14.5)"
        />
      );
    case "Operations":
      return (
        <polygon
          points="12,4 20,8.5 20,17.5 12,22 4,17.5 4,8.5"
          {...s}
          strokeLinejoin="round"
        />
      );
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
          <path
            d="M4 22 c0 -6 4.5 -8.5 8 -8.5 s8 2.5 8 8.5"
            {...s}
            strokeLinecap="round"
          />
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
          <polyline
            points="6,14 6,6 14,6"
            {...s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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

// visualizeAudio-compatible bar count (power of two)
export const HALF = 32;

// Procedural speaking bars (no audio file yet — audio lands in the edit).
// `active` gates the envelope; seedOffset varies the pattern per speaker.
export const proceduralBars = (
  frame: number,
  active: boolean,
  seedOffset = 0,
): number[] => {
  const env = active
    ? 0.4 +
      0.42 * Math.abs(Math.sin((frame + seedOffset * 7) * 0.34)) +
      0.18 * Math.abs(Math.sin((frame + seedOffset * 3) * 0.9))
    : 0.08;
  return Array.from({ length: HALF }).map((_, i) => {
    const v =
      0.25 +
      0.55 * Math.abs(Math.sin(i * 0.5 + (frame + seedOffset * 11) * 0.28)) +
      0.3 * Math.abs(Math.sin(i * 1.4 - (frame + seedOffset * 5) * 0.19));
    return Math.min(1, (v / 1.1) * env);
  });
};

// ---------------------------------------------------------------------------
// SkillTreeWorld — the assembled 1080x1080 tree. Place inside your camera div.
// All motion derives from the `frame` prop (pass useCurrentFrame()).
// ---------------------------------------------------------------------------
export type SkillTreeWorldProps = {
  frame: number;
  /** Frame at which branches start revealing. Use a negative number (e.g. -120)
   *  for "already built" — every part after P3 should show an established tree. */
  revealAt?: number;
  /** 0..1 extra dim on the department labels (camera-close beats) */
  labelDim?: number;
  /** Department index to highlight (ring glow + brighter nodes), or null */
  highlightDept?: number | null;
  /** Who is speaking: "center", a dept index, or null. Draws the radial bars. */
  speaker?: number | "center" | null;
  /** Bar values for the speaker (use proceduralBars) */
  barValues?: number[];
  /** 0..1 opacity of the particle brain at center (fades when orb takes over) */
  brainOpacity?: number;
  /** 0..1 scale-in of the center orb (spring it in your comp); 0 hides */
  orbIn?: number;
  /** Amber by default (Ahmed's clone); override for system moments */
  orbColor?: string;
  orbColorLite?: string;
  /** Frames at which a routing pulse leaves the center toward a dept:
   *  [{dept, start}] — draws a dot traveling center → hub over 22 frames. */
  pulses?: { dept: number; start: number }[];
  /** Overall opacity of the whole tree layer */
  opacity?: number;
};

export const SkillTreeWorld: React.FC<SkillTreeWorldProps> = ({
  frame,
  revealAt = -120,
  labelDim = 0,
  highlightDept = null,
  speaker = null,
  barValues,
  brainOpacity = 0.95,
  orbIn = 0,
  orbColor = TREE.orb,
  orbColorLite = TREE.orbLite,
  pulses = [],
  opacity = 1,
}) => {
  const { fps } = useVideoConfig();
  const particles = React.useMemo(buildParticles, []);
  const branches = React.useMemo(buildBranches, []);
  const stars = React.useMemo(buildStars, []);

  const treeReveal = (i: number) =>
    spring({
      frame: frame - (revealAt + i * 4),
      fps,
      config: { damping: 200, stiffness: 90 },
    });

  const bars = barValues ?? proceduralBars(frame, false);
  const amp = bars.reduce((a, b) => a + b, 0) / HALF;

  const speakerHub =
    typeof speaker === "number" ? hubPos(speaker) : { x: CX, y: CY };
  const speakerColor =
    typeof speaker === "number" ? DEPARTMENTS[speaker].color : orbColor;
  const speakerColorLite =
    typeof speaker === "number" ? DEPARTMENTS[speaker].color : orbColorLite;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, opacity }}>
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
            fill={TREE.node}
            opacity={st.opacity * (0.7 + 0.3 * Math.sin(frame * 0.03 + st.phase))}
          />
        ))}

        {/* dotted spines: center -> each hub */}
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
              stroke={TREE.dotted}
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
          const hi = highlightDept === i ? 1 : 0;
          const speakingHere = speaker === i;
          return (
            <g key={`br${i}`} opacity={rev}>
              {branch.links.map(([a, b], k) => (
                <line
                  key={`l${k}`}
                  x1={branch.nodes[a].x}
                  y1={branch.nodes[a].y}
                  x2={branch.nodes[b].x}
                  y2={branch.nodes[b].y}
                  stroke={hi ? dept.color : TREE.line}
                  strokeWidth={1.4}
                  opacity={hi ? 0.55 : 0.85}
                />
              ))}
              {branch.nodes.map((n, k) => {
                const twinkle =
                  0.75 + 0.25 * Math.sin(frame * 0.06 + k * 1.7 + i * 2.3);
                const pop = spring({
                  frame: frame - (revealAt + 2 + i * 4 + k * 2),
                  fps,
                  config: { damping: 14, stiffness: 160 },
                });
                return n.hollow ? (
                  <circle
                    key={`n${k}`}
                    cx={n.x}
                    cy={n.y}
                    r={n.r * pop}
                    fill={ALTARI.bg}
                    stroke={TREE.nodeDim}
                    strokeWidth={1.6}
                    opacity={0.9}
                  />
                ) : (
                  <circle
                    key={`n${k}`}
                    cx={n.x}
                    cy={n.y}
                    r={n.r * pop}
                    fill={hi ? dept.color : TREE.node}
                    opacity={Math.min(1, twinkle + hi * 0.2)}
                  />
                );
              })}
              {branch.chargeDots.map((d, k) => (
                <circle key={`c${k}`} cx={d.x} cy={d.y} r={3} fill={dept.color} opacity={0.9} />
              ))}
              <circle
                cx={hx}
                cy={hy}
                r={44}
                fill="none"
                stroke={dept.color}
                strokeWidth={1}
                opacity={0.16 + hi * 0.45 + (speakingHere ? 0.35 : 0)}
              />
              <circle
                cx={hx}
                cy={hy}
                r={34}
                fill="rgba(26,26,46,0.92)"
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

        {/* routing pulses center -> hub */}
        {pulses.map((p, k) => {
          if (frame < p.start) return null;
          const t = (frame - p.start) / 22;
          if (t > 1) return null;
          const d = DEPARTMENTS[p.dept];
          const dist = 150 + (HUB_R - 196) * t + 46 * t;
          return (
            <circle
              key={`pu${k}`}
              cx={CX + Math.cos(deg(d.angle)) * dist}
              cy={CY + Math.sin(deg(d.angle)) * dist}
              r={4.5}
              fill={ALTARI.primaryLight}
              opacity={1 - t * 0.4}
            />
          );
        })}

        {/* particle brain center */}
        <g opacity={brainOpacity}>
          {particles.map((p, i) => {
            const dx = Math.sin(frame * p.driftSpeed * 2.2 + p.phase) * p.driftAmp;
            const dy =
              Math.cos(frame * p.driftSpeed * 1.7 + p.phase * 1.3) * p.driftAmp;
            return (
              <circle
                key={`p${i}`}
                cx={CX + (p.x + dx) * (orbIn > 0 ? 0.5 : 1)}
                cy={CY + (p.y + dy) * (orbIn > 0 ? 0.5 : 1)}
                r={p.r}
                fill={p.color}
                opacity={0.55 + 0.45 * Math.sin(frame * 0.05 + p.phase)}
              />
            );
          })}
        </g>

        {/* voice orb / speaking bars */}
        {orbIn > 0 && (
          <g opacity={Math.min(1, orbIn * 1.2)}>
            <defs>
              <radialGradient id="f4orb" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor={speakerColorLite} stopOpacity="0.98" />
                <stop offset="65%" stopColor={speakerColor} stopOpacity="0.92" />
                <stop offset="100%" stopColor={speakerColor} stopOpacity="0.7" />
              </radialGradient>
              <filter id="f4glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="26" />
              </filter>
            </defs>
            <circle
              cx={speakerHub.x}
              cy={speakerHub.y}
              r={(speaker === "center" ? 96 : 58) * orbIn + amp * 30}
              fill={speakerColor}
              opacity={0.2 + amp * 0.16}
              filter="url(#f4glow)"
            />
            <g transform={`rotate(${frame * 0.2} ${speakerHub.x} ${speakerHub.y})`}>
              {Array.from({ length: HALF * 2 }).map((_, k) => {
                const v = bars[k < HALF ? k : HALF - 1 - (k - HALF)] ?? 0;
                const theta = (k / (HALF * 2)) * Math.PI * 2 - Math.PI / 2;
                const R0 = (speaker === "center" ? 62 : 42) * orbIn;
                const len = (6 + v * (speaker === "center" ? 42 : 30)) * orbIn;
                return (
                  <line
                    key={`b${k}`}
                    x1={speakerHub.x + Math.cos(theta) * R0}
                    y1={speakerHub.y + Math.sin(theta) * R0}
                    x2={speakerHub.x + Math.cos(theta) * (R0 + len)}
                    y2={speakerHub.y + Math.sin(theta) * (R0 + len)}
                    stroke={v > 0.72 ? TREE.cream : speakerColorLite}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
            {speaker === "center" && (
              <circle
                cx={CX}
                cy={CY}
                r={(44 + amp * 7) * orbIn}
                fill="url(#f4orb)"
              />
            )}
          </g>
        )}
      </svg>

      {/* department labels (HTML for crisp serif type) */}
      {DEPARTMENTS.map((dept, i) => {
        const rev = treeReveal(i);
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
              opacity: rev * (1 - labelDim),
              transform: `translateY(${(1 - rev) * 14}px)`,
            }}
          >
            <div
              style={{
                fontFamily: serifFamily,
                fontWeight: 500,
                fontSize: 34,
                letterSpacing: 8,
                color: TREE.cream,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {dept.name}
            </div>
            <div
              style={{
                fontFamily: manropeFamily,
                fontWeight: 400,
                fontSize: 14,
                letterSpacing: 2,
                color: TREE.muted,
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
  );
};

// ---------------------------------------------------------------------------
// AltariBackdrop — opaque Altari purple base + subtle 64px grid + vignette.
// MUST be the first child of every comp's root AbsoluteFill (no black frames).
// ---------------------------------------------------------------------------
export const AltariBackdrop: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height,
      backgroundColor: ALTARI.bg,
      backgroundImage: `
        linear-gradient(${GRID_LINE} 1px, transparent 1px),
        linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px),
        radial-gradient(120% 100% at 50% 42%, rgba(91,94,194,0.10) 0%, rgba(26,26,46,0) 62%)
      `,
      backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, 100% 100%`,
    }}
  />
);
