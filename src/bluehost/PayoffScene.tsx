import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { BH } from "./constants";

const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

// ---- geometry ---------------------------------------------------------------
// Local origin (0,0) = center of the server card. Integrator positions this
// component at WORLD.server and owns the camera.

const CARD_W = 460;
const CARD_H = 340;
const CARD_R = 24;
const RING_R = 470;
const CHIP_R = 46; // 92px circle
const LOGO_SIZE = 52;
const PACKET_R = 4.5; // 9px dot

type Chip = {
  angle: number; // degrees, 0 = up, clockwise
  logo: string;
  currentColor?: boolean; // logo uses currentColor -> wrap color #0A0A0A
};

const CHIPS: Chip[] = [
  { angle: -144, logo: "bluehost/n8n-logo.svg" },
  { angle: -72, logo: "bluehost/open-claw.svg" },
  { angle: 0, logo: "bluehost/openwebui-logo.svg", currentColor: true },
  { angle: 72, logo: "bluehost/claudecode-logo.svg" },
  { angle: 144, logo: "bluehost/ollama-logo.svg", currentColor: true },
];

// Per-chip reveal windows: chip i flies in over [0.3 + i*0.09, 0.55 + i*0.09].
const chipWindow = (i: number): [number, number] => [
  0.3 + i * 0.09,
  0.55 + i * 0.09,
];

// unit direction from origin toward a chip (0deg = up, clockwise positive)
const chipDir = (angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(a), y: -Math.cos(a) };
};

// distance from origin to the server-card rect edge along a direction
const rectExit = (dx: number, dy: number) => {
  const tx = dx === 0 ? Infinity : CARD_W / 2 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : CARD_H / 2 / Math.abs(dy);
  return Math.min(tx, ty);
};

const qPoint = (
  p0: { x: number; y: number },
  c: { x: number; y: number },
  p1: { x: number; y: number },
  u: number
) => {
  const v = 1 - u;
  return {
    x: v * v * p0.x + 2 * v * u * c.x + u * u * p1.x,
    y: v * v * p0.y + 2 * v * u * c.y + u * u * p1.y,
  };
};

const qLength = (
  p0: { x: number; y: number },
  c: { x: number; y: number },
  p1: { x: number; y: number }
) => {
  let len = 0;
  let prev = p0;
  const STEPS = 32;
  for (let s = 1; s <= STEPS; s++) {
    const pt = qPoint(p0, c, p1, s / STEPS);
    len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return len;
};

// Precompute static line geometry (final chip positions — paths never move,
// so packets loop on a stable track).
const LINES = CHIPS.map((chip, i) => {
  const dir = chipDir(chip.angle);
  const start = rectExit(dir.x, dir.y) + 8;
  const end = RING_R - CHIP_R - 6;
  const p0 = { x: dir.x * start, y: dir.y * start };
  const p1 = { x: dir.x * end, y: dir.y * end };
  // control point: midpoint pushed ~40px perpendicular (alternating side)
  const side = i % 2 === 0 ? 1 : -1;
  const c = {
    x: (p0.x + p1.x) / 2 + -dir.y * 40 * side,
    y: (p0.y + p1.y) / 2 + dir.x * 40 * side,
  };
  return { p0, c, p1, length: qLength(p0, c, p1) };
});

// distinct packet speeds/phases per chip so nothing pulses in sync
const PACKETS = CHIPS.map((_, i) => ({
  outSpeed: 0.0112 + i * 0.0006,
  inSpeed: 0.0101 + i * 0.0005,
  outPhase: (i * 0.618 + 0.13) % 1,
  inPhase: (i * 0.382 + 0.57) % 1,
}));

const backOut = Easing.out(Easing.back(1.70158));
const cubicOut = Easing.out(Easing.cubic);

// ---- component ----------------------------------------------------------------

export const PayoffScene: React.FC<{ reveal: number; t: number }> = ({
  reveal,
  t,
}) => {
  // -- server card entrance
  const cardIn = interpolate(reveal, [0, 0.35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = 0.6 + 0.4 * cardIn;

  // -- LED pulse (loops via sin)
  const ledScale = 1.125 + 0.125 * Math.sin(t * 0.16);

  // -- uptime: ticks once per second at 30fps
  const totalSeconds = Math.floor(t / 30) + 12;
  const mm = Math.floor(totalSeconds / 60) % 10;
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const uptime = `UPTIME 00:0${mm}:${ss}`;

  // -- ambient ring
  const ringOpacity = interpolate(reveal, [0.3, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        fontFamily: interFamily,
      }}
    >
      {/* ---- connection lines + packets + ambient ring (SVG layer) ---- */}
      <svg
        width={1200}
        height={1200}
        viewBox="-600 -600 1200 1200"
        style={{ position: "absolute", left: -600, top: -600 }}
      >
        {/* ambient rotating dashed ring */}
        <circle
          r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
          strokeDasharray="4 18"
          opacity={ringOpacity}
          transform={`rotate(${t * 0.05})`}
        />

        {CHIPS.map((_, i) => {
          const [ws] = chipWindow(i);
          const line = LINES[i];
          const pkt = PACKETS[i];
          const d = `M ${line.p0.x} ${line.p0.y} Q ${line.c.x} ${line.c.y} ${line.p1.x} ${line.p1.y}`;

          // line draws over [ws, ws+0.16] — completes just before the chip
          // lands at ws+0.25
          const drawP = cubicOut(
            interpolate(reveal, [ws, ws + 0.16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          );

          // packets fade in right after the chip's window [ws, ws+0.25]
          // completes (~8 frames at typical reveal pacing)
          const pktOpacity = interpolate(
            reveal,
            [ws + 0.25, ws + 0.31],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const uOut = (t * pkt.outSpeed + pkt.outPhase) % 1; // server -> chip
          const uIn = 1 - ((t * pkt.inSpeed + pkt.inPhase) % 1); // chip -> server
          const pOut = qPoint(line.p0, line.c, line.p1, uOut);
          const pIn = qPoint(line.p0, line.c, line.p1, uIn);

          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={line.length}
                strokeDashoffset={line.length * (1 - drawP)}
              />
              {pktOpacity > 0.001 ? (
                <g opacity={pktOpacity}>
                  {/* outbound: white */}
                  <circle
                    cx={pOut.x}
                    cy={pOut.y}
                    r={PACKET_R * 2}
                    fill="rgba(255,255,255,0.25)"
                  />
                  <circle
                    cx={pOut.x}
                    cy={pOut.y}
                    r={PACKET_R}
                    fill="rgba(255,255,255,0.9)"
                  />
                  {/* inbound: soft green */}
                  <circle
                    cx={pIn.x}
                    cy={pIn.y}
                    r={PACKET_R * 2}
                    fill="#9EE6B8"
                    opacity={0.25}
                  />
                  <circle cx={pIn.x} cy={pIn.y} r={PACKET_R} fill="#9EE6B8" />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* ---- orbit chips ---- */}
      {CHIPS.map((chip, i) => {
        const [ws, we] = chipWindow(i);
        const p = interpolate(reveal, [ws, we], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (p <= 0) return null;

        // 60% -> overshoot ~104% -> settle 100% (back-out peaks at ~1.10)
        const radiusFrac = 0.6 + 0.4 * backOut(p);
        const opacity = interpolate(p, [0, 0.55], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dir = chipDir(chip.angle);
        const cx = dir.x * RING_R * radiusFrac;
        const cy = dir.y * RING_R * radiusFrac;

        return (
          <div
            key={chip.logo}
            style={{
              position: "absolute",
              left: cx - CHIP_R,
              top: cy - CHIP_R,
              width: CHIP_R * 2,
              height: CHIP_R * 2,
              borderRadius: "50%",
              backgroundColor: BH.card,
              boxShadow: "0 14px 34px rgba(4,29,51,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity,
              // currentColor logos resolve near-black inside the chip
              color: chip.currentColor ? "#0A0A0A" : undefined,
            }}
          >
            <Img
              src={staticFile(chip.logo)}
              style={{
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                objectFit: "contain",
              }}
            />
          </div>
        );
      })}

      {/* ---- server card (hero) ---- */}
      <div
        style={{
          position: "absolute",
          left: -CARD_W / 2,
          top: -CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${cardScale})`,
          opacity: cardIn,
        }}
      >
        {/* outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: CARD_R + 14,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: CARD_R,
            backgroundColor: BH.card,
            border: "1.5px solid rgba(255,255,255,0.5)",
            boxShadow: "0 30px 80px rgba(4,29,51,0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Hermes Agent logo (currentColor) */}
          <div
            style={{
              color: "#0A0A0A",
              marginTop: 40,
              width: 110,
              height: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("bluehost/hermesagent-logo.svg")}
              style={{ width: 110, height: 110 }}
            />
          </div>

          {/* Bluehost grid-mark + plan name */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 7px)",
                gridTemplateRows: "repeat(3, 7px)",
                gap: 3,
              }}
            >
              {Array.from({ length: 9 }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    backgroundColor: BH.actionBlue,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: BH.navy,
                lineHeight: 1,
              }}
            >
              Standard VPS
            </div>
          </div>

          {/* status row */}
          <div
            style={{
              position: "absolute",
              left: 32,
              right: 32,
              bottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: BH.green,
                transform: `scale(${ledScale})`,
                boxShadow: "0 0 10px rgba(15,157,88,0.75)",
              }}
            />
            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: 2.5,
                color: BH.green,
                lineHeight: 1,
              }}
            >
              RUNNING
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontFamily: monoFamily,
                fontSize: 22,
                fontWeight: 500,
                color: BH.textMuted,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {uptime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
