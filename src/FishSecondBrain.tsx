import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 288;

// fake insight the brain "says" during the finale
const INSIGHT_L1 = "Two warm leads from last week's reel just hit Deals.";
const INSIGHT_L2 = "Follow-ups drafted.";
const TYPE_START = 210;
const TYPE_SPEED = 1.35; // chars per frame

// "I've been building a second brain inside Claude Code. It reads my projects,
//  clients, and decisions every session, so it knows my business better than I do."
// Second-brain radial map (SKILLTREE-style, rebuilt native), original dark-navy map colors.

const W = 1080;
const CX = 540;
const CY = 540;

const C = {
  bgEdge: "#0D1017",
  bgMid: "#1A1F2E",
  cream: "#EFE6D6",
  coreAmber: "#E8A15C",
};

type Section = {
  key: string;
  label: string;
  sub: string;
  angle: number; // degrees from 12 o'clock, clockwise
  color: string;
  labelR: number;
  fs: number;
  icon: "tri" | "cube" | "lens" | "person" | "dollar" | "arrow" | "cards";
  labelPos?: [number, number]; // absolute world coords override
};

const SECTIONS: Section[] = [
  { key: "marketing", label: "MARKETING", sub: "content · brand · distribution", angle: -39, color: "#A78BFA", labelR: 430, fs: 30, icon: "tri" },
  { key: "operations", label: "OPERATIONS", sub: "onboarding · builds · client ops", angle: 39, color: "#2DD4BF", labelR: 430, fs: 30, icon: "cube" },
  { key: "intelligence", label: "INTELLIGENCE", sub: "companies · people · markets", angle: 90, color: "#60A5FA", labelR: 340, fs: 24, icon: "lens", labelPos: [822, 438] },
  { key: "customer", label: "CUSTOMER", sub: "support · success · community", angle: 141, color: "#F472B6", labelR: 425, fs: 28, icon: "person" },
  { key: "backoffice", label: "BACK OFFICE", sub: "money in · books · office · people", angle: 180, color: "#FBBF24", labelR: 428, fs: 28, icon: "dollar" },
  { key: "sales", label: "SALES", sub: "targeting · outreach · sequencing", angle: -141, color: "#FB923C", labelR: 425, fs: 28, icon: "arrow" },
  { key: "deals", label: "DEALS", sub: "replies · calls · closing · pipeline", angle: -90, color: "#F87171", labelR: 355, fs: 26, icon: "cards", labelPos: [248, 438] },
];

const HUB_R = 245;
const HUB_SIZE = 66;

const rad = (deg: number) => (deg * Math.PI) / 180;
const pos = (angle: number, r: number): [number, number] => [
  CX + r * Math.sin(rad(angle)),
  CY - r * Math.cos(rad(angle)),
];

const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type BranchNode = { x: number; y: number; r: number; size: number; ring: boolean; near: boolean };
type Branch = { nodes: BranchNode[] };

const buildBranches = (si: number, angle: number): Branch[] => {
  const branches: Branch[] = [];
  for (let b = 0; b < 3; b++) {
    const seed = si * 100 + b * 10;
    let a = angle + (b - 1) * 17 + (rnd(seed) - 0.5) * 9;
    let r = 292;
    const count = 4 + Math.floor(rnd(seed + 1) * 3);
    const nodes: BranchNode[] = [];
    for (let n = 0; n < count; n++) {
      const [x, y] = pos(a, r);
      nodes.push({
        x,
        y,
        r,
        size: 3.5 + rnd(seed + n * 3 + 2) * 3.2,
        ring: rnd(seed + n * 7 + 3) > 0.8,
        near: n < 2,
      });
      r += 22 + rnd(seed + n * 5 + 4) * 15;
      a += (rnd(seed + n * 11 + 5) - 0.5) * 15;
      if (r > 402) break;
    }
    branches.push({ nodes });
  }
  return branches;
};

type Particle = { ang: number; r: number; size: number; color: string; speed: number; ph: number };

const PALETTE = [
  C.cream, C.cream, C.cream, C.cream,
  "#A78BFA", "#2DD4BF", "#60A5FA", "#F472B6", "#FBBF24", "#FB923C", "#F87171",
];

const buildParticles = (): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < 130; i++) {
    out.push({
      ang: rnd(i * 3 + 900) * 360,
      r: 8 + 112 * Math.pow(rnd(i * 5 + 901), 1.6),
      size: 1.8 + rnd(i * 7 + 902) * 3.6,
      color: PALETTE[Math.floor(rnd(i * 11 + 903) * PALETTE.length)],
      speed: 0.3 + rnd(i * 13 + 904) * 0.7,
      ph: rnd(i * 17 + 905) * Math.PI * 2,
    });
  }
  return out;
};

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: rnd(i * 3 + 500) * W,
  y: rnd(i * 5 + 501) * W,
  size: 1 + rnd(i * 7 + 502) * 1.6,
  ph: rnd(i * 11 + 503) * Math.PI * 2,
}));

// focus windows: [tIn, tOut]
const FOCUS: Record<string, [number, number]> = {
  marketing: [70, 104],
  sales: [112, 146],
  operations: [154, 188],
};
const FINALE = 202;

const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

const Icon: React.FC<{ kind: Section["icon"]; color: string }> = ({ kind, color }) => {
  const s = { fill: "none", stroke: color, strokeWidth: 2.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "tri":
      return <path d="M5 7 L21 7 L13 20 Z" {...s} />;
    case "cube":
      return (
        <g {...s}>
          <path d="M13 3.5 L21 8 v8 L13 20.5 L5 16 V8 Z" />
          <path d="M5 8 L13 12.5 L21 8 M13 12.5 V20.5" strokeWidth={1.6} />
        </g>
      );
    case "lens":
      return (
        <g {...s}>
          <circle cx={11} cy={11} r={5.5} />
          <path d="M15.5 15.5 L21 21" />
        </g>
      );
    case "person":
      return (
        <g {...s}>
          <circle cx={13} cy={9} r={4} />
          <path d="M5.5 21 a7.5 7.5 0 0 1 15 0" />
        </g>
      );
    case "dollar":
      return (
        <g {...s}>
          <path d="M17.5 7.5 a4.5 3.4 0 0 0 -4.5 -2 c-2.6 0 -4.4 1.2 -4.4 3.1 c0 4.4 9.2 2 9.2 6.4 c0 2 -2 3.3 -4.8 3.3 a5 3.6 0 0 1 -4.7 -2.3 M13 3 v20" strokeWidth={2} />
        </g>
      );
    case "arrow":
      return (
        <g {...s}>
          <path d="M20 5 v6 a4 4 0 0 1 -4 4 H8" />
          <path d="M11.5 11 L7.5 15 L11.5 19" />
        </g>
      );
    case "cards":
      return (
        <g {...s}>
          <rect x={8.5} y={4.5} width={11} height={14} rx={2} transform="rotate(8 14 11.5)" />
          <rect x={5.5} y={7.5} width={11} height={14} rx={2} transform="rotate(-6 11 14.5)" />
        </g>
      );
  }
};

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const FishSecondBrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const branches = useMemo(() => SECTIONS.map((s, i) => buildBranches(i, s.angle)), []);
  const particles = useMemo(buildParticles, []);
  const coreLinks = useMemo(
    () => particles.filter((pt, i) => pt.r > 32 && i % 4 === 0).slice(0, 30),
    [particles],
  );

  // ---- camera: single-segment moves separated by holds, smootherstep easing ----
  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const camOpts = { easing: smoother, extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  //       open   reveal    hold  →mkt   hold  →sales hold  →ops  hold  pull-out  settle
  const T = [0, 22, 50, 62, 80, 104, 122, 146, 164, 184, 206, 287];
  let z = interpolate(frame, T, [2.35, 2.35, 1.0, 1.0, 1.95, 1.95, 1.95, 1.95, 1.92, 1.92, 0.98, 0.98], camOpts);
  const fx = interpolate(frame, T, [540, 540, 540, 540, 358, 358, 358, 358, 722, 722, 540, 540], camOpts);
  const fy = interpolate(frame, T, [540, 540, 540, 540, 305, 305, 778, 778, 305, 305, 540, 540], camOpts);
  // gentle zoom-dip arc during the two travels (eased progress → zero velocity at ends)
  for (const [t0, t1, amt] of [
    [104, 122, 0.16],
    [146, 164, 0.18],
  ] as const) {
    const prog = p(frame, t0, t1, smoother);
    z -= Math.sin(Math.PI * prog) * amt;
  }

  // ---- per-section light amount ----
  const light = (key: string) => {
    let amt = 0;
    const win = FOCUS[key];
    if (win) {
      amt = p(frame, win[0] + 4, win[0] + 14) * (1 - 0.65 * p(frame, win[1], win[1] + 14));
    }
    return Math.max(amt, 0.8 * p(frame, FINALE, FINALE + 22));
  };

  const coreGlow = 0.4 + 0.45 * p(frame, FINALE + 2, FINALE + 38);
  const corePulse = 1 + 0.035 * Math.sin(frame * 0.17) * p(frame, FINALE, FINALE + 30);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgEdge, fontFamily: inter }}>
      {/* dark navy map base (original SKILLTREE coloring) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(760px 760px at 50% 47%, ${C.bgMid} 0%, ${C.bgEdge} 78%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(620px 620px at 50% 47%, rgba(96,125,200,0.10), rgba(96,125,200,0) 70%)`,
        }}
      />

      {/* camera world */}
      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${CX - fx}px, ${CY - fy}px) scale(${z})`,
        }}
      >
        {/* stars */}
        {STARS.map((st, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: st.x,
              top: st.y,
              width: st.size,
              height: st.size,
              borderRadius: "50%",
              backgroundColor: C.cream,
              opacity: 0.1 + 0.16 * (0.5 + 0.5 * Math.sin(frame * 0.06 + st.ph)),
            }}
          />
        ))}

        <svg width={W} height={W} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* spokes: hub → core, marching dots */}
          {SECTIONS.map((s, i) => {
            const [hx, hy] = pos(s.angle, HUB_R - HUB_SIZE / 2 - 6);
            const [cx2, cy2] = pos(s.angle, 128);
            const amt = light(s.key);
            const reveal = p(frame, 24 + i * 2, 44 + i * 2);
            return (
              <line
                key={s.key}
                x1={hx}
                y1={hy}
                x2={cx2}
                y2={cy2}
                stroke={amt > 0.05 ? s.color : C.cream}
                strokeWidth={amt > 0.05 ? 1.8 : 1.3}
                strokeDasharray="2 9"
                strokeDashoffset={-frame * (0.35 + amt * 1.1)}
                opacity={reveal * (0.22 + 0.55 * amt)}
              />
            );
          })}

          {/* branch lines + nodes */}
          {SECTIONS.map((s, si) => {
            const amt = light(s.key);
            const [hx, hy] = pos(s.angle, HUB_R);
            return (
              <g key={s.key}>
                {branches[si].map((br, bi) => {
                  const pts = [{ x: hx, y: hy }, ...br.nodes];
                  return (
                    <g key={bi}>
                      {pts.slice(1).map((n, ni) => {
                        const prev = pts[ni];
                        const at = 18 + ((br.nodes[ni].r - 279) / 130) * 26 + bi * 2;
                        const seg = p(frame, at, at + 6);
                        if (seg <= 0.001) return null;
                        return (
                          <line
                            key={ni}
                            x1={prev.x}
                            y1={prev.y}
                            x2={prev.x + (n.x - prev.x) * seg}
                            y2={prev.y + (n.y - prev.y) * seg}
                            stroke={amt > 0.05 ? hexA(s.color, 0.28 + 0.3 * amt) : hexA("#EFE6D6", 0.26)}
                            strokeWidth={1.4}
                          />
                        );
                      })}
                      {br.nodes.map((n, ni) => {
                        const at = 20 + ((n.r - 279) / 130) * 26 + bi * 2;
                        const sp = spring({
                          frame: Math.max(0, frame - at),
                          fps,
                          config: { damping: 13, stiffness: 180 },
                        });
                        if (frame < at) return null;
                        const wave = 0.5 + 0.5 * Math.sin(frame * 0.24 - ni * 0.9);
                        const twinkle = 0.72 + 0.28 * Math.sin(frame * 0.11 + ni * 1.7 + bi);
                        const bright = amt * (0.55 + 0.45 * wave) + (1 - amt) * twinkle;
                        const col = n.near || amt > 0.35 ? s.color : C.cream;
                        return n.ring ? (
                          <circle
                            key={ni}
                            cx={n.x}
                            cy={n.y}
                            r={n.size * sp}
                            fill="none"
                            stroke={hexA(col, 0.6 * bright)}
                            strokeWidth={1.4}
                          />
                        ) : (
                          <circle
                            key={ni}
                            cx={n.x}
                            cy={n.y}
                            r={n.size * sp}
                            fill={hexA(col, Math.min(1, 0.9 * bright))}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* core spray lines */}
          {coreLinks.map((pt, i) => {
            const a = pt.ang + frame * 0.06 * pt.speed;
            const x = CX + pt.r * Math.sin(rad(a));
            const y = CY - pt.r * Math.cos(rad(a));
            return (
              <line
                key={i}
                x1={CX + 4 * Math.sin(i)}
                y1={CY + 4 * Math.cos(i)}
                x2={x}
                y2={y}
                stroke={hexA("#EFE6D6", 0.13)}
                strokeWidth={1}
              />
            );
          })}

          {/* core particles */}
          {particles.map((pt, i) => {
            const a = pt.ang + frame * 0.06 * pt.speed;
            const x = CX + pt.r * Math.sin(rad(a));
            const y = CY - pt.r * Math.cos(rad(a));
            const tw = 0.55 + 0.45 * Math.sin(frame * 0.13 + pt.ph);
            return (
              <circle key={i} cx={x} cy={y} r={pt.size} fill={hexA(pt.color, 0.85 * tw)} />
            );
          })}
          <circle cx={CX} cy={CY} r={7 * corePulse} fill={C.coreAmber} />

          {/* packets: section focus + finale, hub → core */}
          {SECTIONS.map((s) => {
            const win = FOCUS[s.key];
            const packets: React.ReactNode[] = [];
            const emit = (start: number, end: number, period: number, n: number, keyBase: string) => {
              for (let k = 0; k < n; k++) {
                const t0 = start + k * (period / n);
                if (frame < t0 || frame > end + period) continue;
                const tt = ((frame - t0) % period) / period;
                if (frame - t0 > (end - start)) continue;
                const r = 215 - tt * 175;
                const [x, y] = pos(s.angle, r);
                const fade = Math.min(1, tt * 6, (1 - tt) * 4);
                packets.push(
                  <g key={`${keyBase}-${k}`} opacity={fade}>
                    <circle cx={x} cy={y} r={9} fill={hexA(s.color, 0.25)} />
                    <circle cx={x} cy={y} r={3.8} fill={s.color} />
                  </g>,
                );
              }
            };
            if (win) emit(win[0] + 8, win[1] + 6, 26, 3, `f-${s.key}`);
            emit(FINALE + 2 + (SECTIONS.indexOf(s) % 4) * 3, DURATION_IN_FRAMES, 24, 2, `e-${s.key}`);
            return <g key={s.key}>{packets}</g>;
          })}
        </svg>

        {/* core glow */}
        <div
          style={{
            position: "absolute",
            left: CX - 150,
            top: CY - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexA(C.coreAmber, 0.16)} 0%, rgba(96,125,200,0.08) 40%, rgba(0,0,0,0) 70%)`,
            opacity: coreGlow,
            transform: `scale(${corePulse})`,
          }}
        />

        {/* hubs */}
        {SECTIONS.map((s, i) => {
          const [hx, hy] = pos(s.angle, HUB_R);
          const amt = light(s.key);
          const sp = spring({
            frame: Math.max(0, frame - 22 - i * 2),
            fps,
            config: { damping: 13, stiffness: 150 },
          });
          if (frame < 22 + i * 2) return null;
          const scale = 0.7 + 0.3 * sp;
          return (
            <div
              key={s.key}
              style={{
                position: "absolute",
                left: hx - HUB_SIZE / 2,
                top: hy - HUB_SIZE / 2,
                width: HUB_SIZE,
                height: HUB_SIZE,
                borderRadius: "50%",
                border: `2px solid ${hexA(s.color, 0.55 + 0.45 * amt)}`,
                backgroundColor: "rgba(13,16,23,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${scale * (1 + 0.06 * amt)})`,
                opacity: Math.min(1, sp * 1.4),
                boxShadow: `0 0 ${10 + 34 * amt}px ${hexA(s.color, 0.18 + 0.4 * amt)}`,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 26 26" style={{ opacity: 0.75 + 0.25 * amt }}>
                <Icon kind={s.icon} color={s.color} />
              </svg>
            </div>
          );
        })}

        {/* labels */}
        {SECTIONS.map((s, i) => {
          const [lx, ly] = s.labelPos ?? pos(s.angle, s.labelR);
          const amt = light(s.key);
          const o = p(frame, 40 + i * 2, 56 + i * 2);
          return (
            <div
              key={s.key}
              style={{
                position: "absolute",
                left: lx - 250,
                top: ly - 26,
                width: 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                opacity: o * (0.78 + 0.22 * amt),
                transform: `translateY(${(1 - o) * 10}px) scale(${1 + 0.04 * amt})`,
              }}
            >
              <span
                style={{
                  fontFamily: serif,
                  fontWeight: 600,
                  fontSize: s.fs,
                  letterSpacing: "0.32em",
                  marginRight: "-0.32em",
                  color: amt > 0.4 ? "#FBF7EE" : C.cream,
                  textShadow: amt > 0.05 ? `0 0 ${18 * amt}px ${hexA(s.color, 0.55)}` : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: inter,
                  fontWeight: 500,
                  fontSize: 13,
                  letterSpacing: "0.16em",
                  marginRight: "-0.16em",
                  color: hexA("#EFE6D6", 0.5 + 0.25 * amt),
                  whiteSpace: "nowrap",
                }}
              >
                {s.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(720px 720px at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,6,10,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* finale: the brain speaks (screen space) */}
      {(() => {
        const enter = spring({
          frame: Math.max(0, frame - 202),
          fps,
          config: { damping: 17, stiffness: 120 },
        });
        if (frame < 202) return null;
        const full = INSIGHT_L1 + INSIGHT_L2;
        const n = Math.min(full.length, Math.floor(Math.max(0, frame - TYPE_START) * TYPE_SPEED));
        const l1 = INSIGHT_L1.slice(0, n);
        const l2 = INSIGHT_L2.slice(0, Math.max(0, n - INSIGHT_L1.length));
        const done = n >= full.length;
        const cursorOn = done ? Math.floor(frame / 16) % 2 === 0 : true;
        return (
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 48,
              width: 800,
              borderRadius: 18,
              backgroundColor: "rgba(13,17,26,0.85)",
              border: "1px solid rgba(239,230,214,0.14)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
              padding: "24px 30px",
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              opacity: Math.min(1, enter * 1.3),
              transform: `translateY(${(1 - enter) * -26}px)`,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: C.coreAmber,
                marginTop: 10,
                boxShadow: `0 0 ${10 + 6 * Math.sin(frame * 0.2)}px ${hexA(C.coreAmber, 0.7)}`,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: inter,
                fontWeight: 500,
                fontSize: 27,
                lineHeight: 1.45,
                color: C.cream,
              }}
            >
              {l1}
              {l2 ? <br /> : null}
              {l2}
              <span style={{ opacity: cursorOn ? 0.9 : 0, color: C.coreAmber }}>▍</span>
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
