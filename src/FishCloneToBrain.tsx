import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 300;

// "All I had to do was drop a 10-second clip into Fish Audio's S2.1 Pro.
//  It cloned me on the spot, and I wired it straight into the brain."
// Footage card → clip chip drops into Fish Audio panel → clones → wire → brain core.

const C = {
  bgEdge: "#0D1017",
  bgMid: "#1A1F2E",
  cream: "#EFE6D6",
  coral: "#D97757",
  green: "#22C55E",
  coreAmber: "#E8A15C",
};

const W = 1080;
const WORLD_H = 2800;

const FOOTAGE = { x: 140, y: 120, w: 800, h: 1000 };
const PANEL = { x: 130, y: 1290, w: 820, h: 460 };
const DROP = { x: 170, y: 1432, w: 740, h: 268 }; // inside panel, world coords
const CORE = { x: 540, y: 2420 };

// chip drop timing
const CHIP_POP = 38;
const CHIP_FALL_START = 46;
const CHIP_LAND = 70;
const CLONE_START = 78;
const CLONE_DONE = 108;
const RESULT_AT = 112;
const WIRE_START = 148;
const WIRE_DONE = 172;

const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const PALETTE = [
  C.cream, C.cream, C.cream, C.cream,
  "#A78BFA", "#2DD4BF", "#60A5FA", "#F472B6", "#FBBF24", "#FB923C", "#F87171",
];

type Particle = { ang: number; r: number; size: number; color: string; speed: number; ph: number };

const buildParticles = (): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < 120; i++) {
    out.push({
      ang: rnd(i * 3 + 700) * 360,
      r: 10 + 140 * Math.pow(rnd(i * 5 + 701), 1.6),
      size: 2 + rnd(i * 7 + 702) * 4,
      color: PALETTE[Math.floor(rnd(i * 11 + 703) * PALETTE.length)],
      speed: 0.3 + rnd(i * 13 + 704) * 0.7,
      ph: rnd(i * 17 + 705) * Math.PI * 2,
    });
  }
  return out;
};

const STARS = Array.from({ length: 130 }, (_, i) => ({
  x: rnd(i * 3 + 400) * W,
  y: rnd(i * 5 + 401) * WORLD_H,
  size: 1 + rnd(i * 7 + 402) * 1.6,
  ph: rnd(i * 11 + 403) * Math.PI * 2,
}));

const WAVE_BARS = Array.from({ length: 26 }, (_, i) => 14 + rnd(i * 9 + 60) * 46);

const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const FishCloneToBrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = useMemo(buildParticles, []);
  const coreLinks = useMemo(
    () => particles.filter((pt, i) => pt.r > 40 && i % 4 === 0).slice(0, 26),
    [particles],
  );

  // ---- camera: single-segment moves, smootherstep, holds between ----
  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const camOpts = { easing: smoother, extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const T = [0, 45, 68, 122, 150, 299];
  const fy = interpolate(frame, T, [620, 620, 1500, 1500, 1820, 1820], camOpts);
  let z = interpolate(frame, T, [1.2, 1.2, 1.18, 1.18, 1.02, 1.02], camOpts);
  z *= 1 + 0.035 * p(frame, 160, 292, Easing.inOut(Easing.sin)); // slow drift in the end hold
  const fx = 540;

  // ---- chip drop ----
  const chipPop = spring({
    frame: Math.max(0, frame - CHIP_POP),
    fps,
    config: { damping: 14, stiffness: 170 },
  });
  const fall = p(frame, CHIP_FALL_START, CHIP_LAND, Easing.in(Easing.quad));
  const chipY = interpolate(fall, [0, 1], [FOOTAGE.y + FOOTAGE.h - 40, DROP.y + DROP.h / 2]);
  const landSquash = spring({
    frame: Math.max(0, frame - CHIP_LAND),
    fps,
    config: { damping: 11, stiffness: 210 },
  });
  const chipVisible = frame >= CHIP_POP && frame < RESULT_AT;

  // ---- clone progress ----
  const cloneProg = p(frame, CLONE_START, CLONE_DONE, Easing.inOut(Easing.cubic));
  const resultIn = spring({
    frame: Math.max(0, frame - RESULT_AT),
    fps,
    config: { damping: 13, stiffness: 140 },
  });
  const checkIn = spring({
    frame: Math.max(0, frame - RESULT_AT - 10),
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  // ---- wire + brain ----
  const wireLen = CORE.y - 140 - (PANEL.y + PANEL.h); // 1750 → 2140
  const wireProg = p(frame, WIRE_START, WIRE_DONE, smoother);
  const connected = frame >= WIRE_DONE;
  const coreGlow = 0.35 + 0.5 * p(frame, WIRE_DONE, WIRE_DONE + 34);
  const corePulse = 1 + 0.04 * Math.sin(frame * 0.16) * p(frame, WIRE_DONE, WIRE_DONE + 20);
  const coreBright = 0.7 + 0.3 * p(frame, WIRE_DONE, WIRE_DONE + 30);

  const ripple = p(frame, CHIP_LAND, CHIP_LAND + 16);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgEdge, fontFamily: inter }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 1200px at 50% 45%, ${C.bgMid} 0%, ${C.bgEdge} 80%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 900px at 50% 45%, rgba(96,125,200,0.10), rgba(96,125,200,0) 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${z})`,
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

        {/* ============ beat 1: footage card ============ */}
        <div
          style={{
            position: "absolute",
            left: FOOTAGE.x,
            top: FOOTAGE.y,
            width: FOOTAGE.w,
            height: FOOTAGE.h,
            borderRadius: 30,
            overflow: "hidden",
            border: "1.5px solid rgba(239,230,214,0.16)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            backgroundColor: "#0A0D13",
          }}
        >
          <OffthreadVideo
            muted
            trimBefore={8}
            src={staticFile("fish-audio/img-4931.mov")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* falling clip chip (zIndex above the panel so it stays visible into the drop zone) */}
        {chipVisible ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 170,
              top: chipY - 37,
              width: 340,
              height: 74,
              zIndex: 5,
              borderRadius: 37,
              backgroundColor: "rgba(16,20,30,0.96)",
              border: `1.5px solid ${hexA(C.coral, 0.75)}`,
              boxShadow: `0 12px 34px rgba(0,0,0,0.5), 0 0 22px ${hexA(C.coral, 0.25)}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 22px",
              opacity: Math.min(1, chipPop * 1.4),
              transform: `scale(${0.7 + 0.3 * chipPop}) scaleY(${frame >= CHIP_LAND ? 0.82 + 0.18 * landSquash : 1})`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                backgroundColor: hexA(C.coral, 0.15),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2.5,
                flexShrink: 0,
              }}
            >
              {[12, 22, 30, 18, 24, 10].map((h, b) => (
                <div key={b} style={{ width: 3.5, height: h, borderRadius: 2, backgroundColor: C.coral }} />
              ))}
            </div>
            <span style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: C.cream }}>
              clip-4931.m4a
            </span>
            <span style={{ fontFamily: mono, fontSize: 19, color: hexA("#EFE6D6", 0.55), marginLeft: "auto" }}>
              0:10
            </span>
          </div>
        ) : null}

        {/* ============ beat 2: Fish Audio panel ============ */}
        <div
          style={{
            position: "absolute",
            left: PANEL.x,
            top: PANEL.y,
            width: PANEL.w,
            height: PANEL.h,
            borderRadius: 28,
            backgroundColor: "rgba(16,20,30,0.92)",
            border: "1.5px solid rgba(239,230,214,0.13)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            padding: "30px 40px",
          }}
        >
          {/* header: fish audio logo + model chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Img
              src={staticFile("fish-audio/logo-dark.png")}
              style={{ height: 44, width: "auto" }}
            />
            <div
              style={{
                marginLeft: "auto",
                borderRadius: 999,
                border: `1.5px solid ${hexA(C.coral, 0.65)}`,
                color: C.coral,
                fontFamily: mono,
                fontSize: 20,
                fontWeight: 700,
                padding: "8px 18px",
                letterSpacing: "0.06em",
              }}
            >
              S2.1 PRO
            </div>
          </div>

          {/* drop zone */}
          <div
            style={{
              position: "absolute",
              left: DROP.x - PANEL.x,
              top: DROP.y - PANEL.y,
              width: DROP.w,
              height: DROP.h,
              borderRadius: 22,
              border: `2px dashed ${
                frame >= CHIP_LAND ? hexA(C.coral, 0.8) : "rgba(239,230,214,0.28)"
              }`,
              backgroundColor: frame >= CHIP_LAND ? hexA(C.coral, 0.05) : "rgba(255,255,255,0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* idle hint */}
            {frame < CHIP_LAND ? (
              <svg width={64} height={64} viewBox="0 0 64 64" style={{ opacity: 0.35 + 0.12 * Math.sin(frame * 0.15) }}>
                <path
                  d="M32 12 v26 M20 28 l12 12 12-12 M14 50 h36"
                  fill="none"
                  stroke={C.cream}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}

            {/* clone progress waveform */}
            {frame >= CLONE_START && frame < RESULT_AT ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 80 }}>
                {WAVE_BARS.map((h, i) => {
                  const active = cloneProg * WAVE_BARS.length > i;
                  const wob = 1 + 0.25 * Math.sin(frame * 0.4 + i * 1.1);
                  return (
                    <div
                      key={i}
                      style={{
                        width: 8,
                        height: active ? h * wob : 10,
                        borderRadius: 4,
                        backgroundColor: active ? C.coral : "rgba(239,230,214,0.18)",
                      }}
                    />
                  );
                })}
              </div>
            ) : null}

            {/* cloned result chip */}
            {frame >= RESULT_AT ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 30px",
                  height: 108,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.045)",
                  border: `1.5px solid ${hexA(C.coral, 0.5)}`,
                  opacity: Math.min(1, resultIn * 1.4),
                  transform: `scale(${0.85 + 0.15 * resultIn})`,
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: "50%",
                    backgroundColor: hexA(C.coral, 0.16),
                    border: `1.5px solid ${hexA(C.coral, 0.6)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  {[14, 26, 36, 22, 30, 12].map((h, b) => (
                    <div
                      key={b}
                      style={{
                        width: 4,
                        height: h * (1 + 0.3 * Math.sin(frame * 0.3 + b)),
                        borderRadius: 2,
                        backgroundColor: C.coral,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: C.cream }}>Ahmed</span>
                  <span style={{ fontFamily: mono, fontSize: 19, color: hexA("#EFE6D6", 0.55) }}>
                    S2.1 Pro · 0:10
                  </span>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "rgba(34,197,94,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${Math.min(1, checkIn)})`,
                    marginLeft: 10,
                  }}
                >
                  <svg width={26} height={26} viewBox="0 0 26 26">
                    <path
                      d="M5 13.5 L11 19.5 L21 7.5"
                      fill="none"
                      stroke={C.green}
                      strokeWidth={3.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ) : null}
          </div>

          {/* landing ripple */}
          {ripple > 0 && ripple < 1 ? (
            <div
              style={{
                position: "absolute",
                left: DROP.x - PANEL.x + DROP.w / 2 - 90 * ripple,
                top: DROP.y - PANEL.y + DROP.h / 2 - 90 * ripple,
                width: 180 * ripple,
                height: 180 * ripple,
                borderRadius: "50%",
                border: `2.5px solid ${hexA(C.coral, 0.7 * (1 - ripple))}`,
              }}
            />
          ) : null}
        </div>

        {/* ============ beat 3: wire + brain core ============ */}
        <svg
          width={W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        >
          {/* wire */}
          {wireProg > 0.001 ? (
            <>
              <line
                x1={540}
                y1={PANEL.y + PANEL.h}
                x2={540}
                y2={PANEL.y + PANEL.h + wireLen * wireProg}
                stroke={hexA(C.coreAmber, 0.18)}
                strokeWidth={10}
                strokeLinecap="round"
              />
              <line
                x1={540}
                y1={PANEL.y + PANEL.h}
                x2={540}
                y2={PANEL.y + PANEL.h + wireLen * wireProg}
                stroke={hexA(C.coreAmber, 0.85)}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </>
          ) : null}

          {/* packets down the wire */}
          {connected
            ? [0, 1, 2].map((k) => {
                const period = 24;
                const t0 = WIRE_DONE + k * 8;
                if (frame < t0) return null;
                const tt = ((frame - t0) % period) / period;
                const y = PANEL.y + PANEL.h + tt * (wireLen + 60);
                const fade = Math.min(1, tt * 5, (1 - tt) * 3.5);
                return (
                  <g key={k} opacity={fade}>
                    <circle cx={540} cy={y} r={10} fill={hexA(C.coreAmber, 0.25)} />
                    <circle cx={540} cy={y} r={4.5} fill={C.coreAmber} />
                  </g>
                );
              })
            : null}

          {/* core spray lines */}
          {coreLinks.map((pt, i) => {
            const a = pt.ang + frame * 0.06 * pt.speed;
            const x = CORE.x + pt.r * Math.sin(rad(a));
            const y = CORE.y - pt.r * Math.cos(rad(a));
            return (
              <line
                key={i}
                x1={CORE.x + 4 * Math.sin(i)}
                y1={CORE.y + 4 * Math.cos(i)}
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
            const x = CORE.x + pt.r * Math.sin(rad(a));
            const y = CORE.y - pt.r * Math.cos(rad(a));
            const tw = 0.55 + 0.45 * Math.sin(frame * 0.13 + pt.ph);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={pt.size}
                fill={hexA(pt.color, 0.85 * tw * coreBright)}
              />
            );
          })}
          <circle cx={CORE.x} cy={CORE.y} r={8 * corePulse} fill={C.coreAmber} />
        </svg>

        {/* core glow */}
        <div
          style={{
            position: "absolute",
            left: CORE.x - 190,
            top: CORE.y - 190,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexA(C.coreAmber, 0.17)} 0%, rgba(96,125,200,0.08) 40%, rgba(0,0,0,0) 70%)`,
            opacity: coreGlow,
            transform: `scale(${corePulse})`,
          }}
        />
      </div>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(760px 1200px at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,6,10,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
