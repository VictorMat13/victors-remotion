import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 200;

// Promptible white / paper style — Liam orange accent, hand-drawn icon pass
const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  green: "#16A34A",
};

type Pt = { x: number; y: number };

const smoothPath = (pts: Pt[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
};

const polylineLength = (pts: Pt[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return l * 1.08;
};

const pointAt = (pts: Pt[], t: number): Pt => {
  if (t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  let target = total * t;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (target <= seg) {
      const f = seg === 0 ? 0 : target / seg;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
      };
    }
    target -= seg;
  }
  return pts[pts.length - 1];
};

const jitter = (seed: string, amt: number) => (random(seed) - 0.5) * 2 * amt;

const roughLinePts = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: string,
  amt = 2.4,
): Pt[] => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.round(len / 42));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const edge = i === 0 || i === n ? 0.45 : 1;
    pts.push({
      x: x1 + (x2 - x1) * t + jitter(`${seed}-x${i}`, amt * edge),
      y: y1 + (y2 - y1) * t + jitter(`${seed}-y${i}`, amt * edge),
    });
  }
  return pts;
};

const roughRectPts = (
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  amt = 2.4,
): Pt[] => {
  const corners: Pt[] = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ].map((c, i) => ({
    x: c.x + jitter(`${seed}-c${i}x`, amt),
    y: c.y + jitter(`${seed}-c${i}y`, amt),
  }));
  let pts: Pt[] = [];
  for (let s = 0; s < 4; s++) {
    const a = corners[s];
    const b = corners[(s + 1) % 4];
    const side = roughLinePts(a.x, a.y, b.x, b.y, `${seed}-s${s}`, amt);
    pts = pts.concat(s === 0 ? side : side.slice(1));
  }
  pts.push({ x: corners[0].x + 12, y: corners[0].y + jitter(`${seed}-ov`, 2) });
  return pts;
};

const sharpPath = (pts: Pt[]) =>
  pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    )
    .join(" ");

const RoughStroke: React.FC<{
  pts: Pt[];
  progress: number;
  stroke: string;
  sw: number;
  opacity?: number;
  fill?: string;
  sharp?: boolean;
}> = ({ pts, progress, stroke, sw, opacity = 1, fill = "none", sharp }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const d = sharp ? sharpPath(pts) : smoothPath(pts);
  const len = polylineLength(pts);
  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={sw}
      fill={fill}
      opacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={progress >= 1 ? undefined : len}
      strokeDashoffset={progress >= 1 ? undefined : len * (1 - progress)}
    />
  );
};

// ---- layout — 1080x1080, 5% side safe (x 54..1026) -------------------------
const CARD = { x: 110, y: 340, w: 410, h: 400 };
const BASE_Y = 540; // signal baseline
const GLITCH_X0 = CARD.x + CARD.w; // 520
const GLITCH_X1 = 748;
const HB_X1 = 1000;
const BEAT_1 = 800;
const BEAT_2 = 920;

// jagged "slop" signal — chaotic spikes, boiling
const glitchPts = (boil: string): Pt[] => {
  const pts: Pt[] = [{ x: GLITCH_X0, y: BASE_Y }];
  const n = Math.round((GLITCH_X1 - GLITCH_X0) / 9);
  for (let i = 1; i <= n; i++) {
    const x =
      GLITCH_X0 +
      ((GLITCH_X1 - GLITCH_X0) * i) / n +
      jitter(`gx${i}-${boil}`, 3);
    const spike = i % 3 === 1 ? jitter(`gsp${i}-${boil}`, 84) : 0;
    pts.push({ x, y: BASE_Y + jitter(`g${i}-${boil}`, 30) + spike });
  }
  return pts;
};

// same span, resolved calm — what the glitch relaxes into
const calmPts = (boil: string): Pt[] => {
  const pts: Pt[] = [{ x: GLITCH_X0, y: BASE_Y }];
  const n = Math.round((GLITCH_X1 - GLITCH_X0) / 24);
  for (let i = 1; i <= n; i++) {
    const x = GLITCH_X0 + ((GLITCH_X1 - GLITCH_X0) * i) / n;
    pts.push({ x, y: BASE_Y + jitter(`c${i}-${boil}`, 3) });
  }
  return pts;
};

// clean ECG beat centred on xc
const beatPts = (xc: number, seed: string): Pt[] => [
  { x: xc - 44, y: BASE_Y + jitter(`${seed}-a`, 1.4) },
  { x: xc - 20, y: BASE_Y - 8 },
  { x: xc - 10, y: BASE_Y + 8 },
  { x: xc, y: BASE_Y - 96 },
  { x: xc + 10, y: BASE_Y + 34 },
  { x: xc + 18, y: BASE_Y - 4 },
  { x: xc + 34, y: BASE_Y - 14 },
  { x: xc + 46, y: BASE_Y + jitter(`${seed}-b`, 1.4) },
];

const heartbeatPts = (boil: string): Pt[] => {
  const pts: Pt[] = [{ x: GLITCH_X1, y: BASE_Y }];
  pts.push(...beatPts(BEAT_1, `b1-${boil}`));
  pts.push(...beatPts(BEAT_2, `b2-${boil}`));
  pts.push({ x: HB_X1, y: BASE_Y + jitter(`hbend-${boil}`, 1.4) });
  return pts;
};

// ---- camera — open tight on the photo, reveal, punch into the snap, settle -
const KEY_T = [0, 44, 66, 104, 120, 160, 180, 199];
const ZOOMS = [1.75, 1.75, 1, 1, 1.32, 1.32, 1, 1];
const FXS = [310, 310, 540, 540, 760, 760, 540, 540];
const FYS = [540, 540, 540, 540, 520, 520, 540, 540];

export const PolloHeartbeatVerdict: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boil = `b${Math.floor(frame / 5) % 3}`;

  const ease = Easing.bezier(0.33, 1, 0.68, 1);
  const prog = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  const camEase = Easing.inOut(Easing.cubic);
  const camOpts = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  } as const;
  const zoom = interpolate(frame, KEY_T, ZOOMS, camOpts);
  const fx = interpolate(frame, KEY_T, FXS, camOpts);
  const fy = interpolate(frame, KEY_T, FYS, camOpts);

  // ---- beat 1: the single photo --------------------------------------------
  const cardBorder = prog(2, 22);
  const photoS = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const chipS = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 12, stiffness: 190 },
  });

  // ---- beat 2: scan read ---------------------------------------------------
  const scanProg = prog(24, 44);
  const scanX = interpolate(scanProg, [0, 1], [CARD.x + 26, CARD.x + CARD.w - 26]);
  const scanFade = 1 - prog(44, 52);

  // ---- beat 3: glitchy slop signal -----------------------------------------
  const glitchProg = prog(52, 112);
  const snap = prog(120, 134);

  // ---- beat 4: clean heartbeat ---------------------------------------------
  const hbProg = prog(122, 158);
  const heartS = spring({
    frame: Math.max(0, frame - 150),
    fps,
    config: { damping: 13, stiffness: 160 },
  });

  const settled = frame > 158;
  const glowPulse = settled ? 0.05 + Math.sin((frame - 158) * 0.14) * 0.022 : 0;
  const dotPulse = settled ? 1 + Math.sin((frame - 158) * 0.2) * 0.12 : 1;

  const gPts = glitchPts(boil);
  const cPts = calmPts(boil);
  const hPts = heartbeatPts(boil);

  // tip dot follows whichever segment is drawing
  const tip =
    hbProg > 0
      ? pointAt(hPts, hbProg)
      : glitchProg > 0
        ? pointAt(gPts, glitchProg)
        : null;
  const tipColor = hbProg > 0 ? COLORS.green : COLORS.orangeDeep;

  const glow = 0.05 + Math.sin(frame * 0.05) * 0.012;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily: inter }}>
      {/* camera world — backgrounds overdrawn so the camera can roam */}
      <AbsoluteFill
        style={{
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${zoom})`,
        }}
      >
        {/* paper grid — full bleed with overdraw */}
        <svg
          width={1520}
          height={1520}
          viewBox="-220 -220 1520 1520"
          style={{ position: "absolute", left: -220, top: -220 }}
        >
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 120 - 240}
              y1={-220}
              x2={i * 120 - 240}
              y2={1300}
              stroke={COLORS.line}
              strokeWidth={1.4}
              opacity={0.6}
            />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={-220}
              y1={i * 120 - 240}
              x2={1300}
              y2={i * 120 - 240}
              stroke={COLORS.line}
              strokeWidth={1.4}
              opacity={0.6}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: -220,
            top: -220,
            width: 1520,
            height: 1520,
            background: `radial-gradient(560px 560px at ${fx + 220}px ${fy + 220}px, rgba(255,79,1,${glow.toFixed(3)}), rgba(255,79,1,0) 68%)`,
          }}
        />

        <svg
          width={1080}
          height={1080}
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* ---- photo card ---- */}
          <rect
            x={CARD.x + 5}
            y={CARD.y + 5}
            width={CARD.w - 10}
            height={CARD.h - 10}
            rx={14}
            fill={COLORS.card}
            opacity={interpolate(cardBorder, [0, 1], [0, 0.92])}
          />
          <RoughStroke
            pts={roughRectPts(CARD.x, CARD.y, CARD.w, CARD.h, `card-${boil}`, 2.6)}
            progress={cardBorder}
            stroke={COLORS.ink}
            sw={4}
          />
        </svg>

        {/* product photo */}
        {photoS > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: CARD.x + CARD.w / 2 - 165,
              top: CARD.y + CARD.h / 2 - 166,
              width: 330,
              transform: `scale(${photoS}) rotate(${interpolate(photoS, [0, 1], [-6, 0])}deg)`,
              transformOrigin: "center",
            }}
          >
            <Img
              src={staticFile("pollo/controller.jpg")}
              style={{
                width: "100%",
                display: "block",
                borderRadius: 10,
                filter: "drop-shadow(0 10px 22px rgba(27,23,32,0.14))",
              }}
            />
          </div>
        ) : null}

        {/* overlay pass — scan, signal, hearts */}
        <svg
          width={1080}
          height={1080}
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* scan sweep over the photo */}
          {scanProg > 0 && scanFade > 0 ? (
            <g opacity={scanFade}>
              <rect
                x={CARD.x + 26}
                y={CARD.y + 24}
                width={Math.max(0, scanX - CARD.x - 26)}
                height={CARD.h - 48}
                fill={COLORS.orange}
                opacity={0.06}
              />
              <RoughStroke
                pts={roughLinePts(
                  scanX,
                  CARD.y + 24,
                  scanX,
                  CARD.y + CARD.h - 24,
                  `scan-${boil}`,
                  1.6,
                )}
                progress={1}
                stroke={COLORS.orange}
                sw={5}
                opacity={0.9}
              />
            </g>
          ) : null}

          {/* jagged slop signal — relaxes into calm on the snap */}
          <RoughStroke
            pts={gPts}
            progress={glitchProg}
            stroke={COLORS.orangeDeep}
            sw={5}
            opacity={0.92 * (1 - snap)}
            sharp
          />
          <RoughStroke
            pts={cPts}
            progress={1}
            stroke={COLORS.green}
            sw={5.5}
            opacity={0.9 * snap}
          />

          {/* clean heartbeat */}
          <RoughStroke
            pts={hPts}
            progress={hbProg}
            stroke={COLORS.green}
            sw={6}
            opacity={0.95}
          />

          {/* soft green pulse once the signal settles */}
          {glowPulse > 0 ? (
            <ellipse
              cx={870}
              cy={BASE_Y}
              rx={240}
              ry={145}
              fill={COLORS.green}
              opacity={glowPulse * 0.8}
            />
          ) : null}

          {/* tip dot */}
          {tip ? (
            <circle
              cx={tip.x}
              cy={tip.y}
              r={9 * dotPulse}
              fill={tipColor}
              opacity={0.95}
            />
          ) : null}

          {/* heart pops above the second beat */}
          {heartS > 0.001 ? (
            <g
              opacity={
                Math.min(1, heartS * 1.5) *
                interpolate(heartS, [0.75, 1], [1, 0.88], {
                  extrapolateLeft: "clamp",
                })
              }
              transform={`translate(${BEAT_2 + 4} ${BASE_Y - 148 + interpolate(heartS, [0, 1], [0, -42])}) scale(${0.5 + 0.5 * heartS})`}
            >
              <path
                d="M0 8 C -9 -2, -22 2, -12 14 L 0 26 L 12 14 C 22 2, 9 -2, 0 8 Z"
                fill="none"
                stroke={COLORS.orangeDeep}
                strokeWidth={4.4}
                strokeLinejoin="round"
              />
            </g>
          ) : null}
        </svg>

        {/* file chip */}
        {chipS > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: CARD.x + 24,
              top: CARD.y - 33,
              transform: `rotate(-2deg) scale(${Math.min(1, chipS)}) translateY(${(1 - Math.min(1, chipS)) * 20}px)`,
              transformOrigin: "left center",
              backgroundColor: COLORS.card,
              color: COLORS.ink,
              border: `2.6px solid ${COLORS.ink}`,
              fontFamily: inter,
              fontWeight: 700,
              fontSize: 26,
              padding: "8px 22px",
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(27,23,32,0.10)",
              whiteSpace: "nowrap",
            }}
          >
            controller.jpg
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
