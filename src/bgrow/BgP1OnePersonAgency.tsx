import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  MRD,
  MRD_GRADIENT,
  MRD_GRID,
  SHOTS,
  safePadX,
} from "./theme";

// ===========================================================================
// BgP1OnePersonAgency — 1080x1080 @ 30fps
// 0:00 HOOK  [1:1]
// VO: "One person can run an entire ad agency now. I'll show you how."
//
// THE IDEA (no on-screen text — VO + burned captions carry the line):
//   ONE pulsing Merydian node -> pull out -> the whole agency it is running.
//   The one-to-many reveal IS the hook.
//
// One continuous world (2400x2400) larger than the viewport, driven by a
// single keyframed camera. Merydian dark ground + spring green as the only
// designed accent. Every campaign card is a real crop of the live Runable
// Grow home (public/bgrow/capture/02-grow-home.png), pixel rects measured off
// the screenshot — never an invented Runable screen, never recolored green.
//
// Beat map (matches the camera keyframes below):
//   0-24   hold tight on the node, one pulse completes
//   24-44  move: pull out while the first ring spawns
//   44-74  hold: the 5 Running Ads campaigns land
//   74-95  move: final pull-out
//   95-120 settle: outer ring finishes in a staggered wave, clean end hold
// ===========================================================================

export const DURATION_IN_FRAMES = 120;

// --------------------------------------------------------------- world setup
const WORLD = 2400;
const NODE = WORLD / 2; // world centre — the single node lives here
const NODE_SIZE = 96;

// Source screenshot, and the world-px-per-screenshot-px factor for UI crops.
const SHOT_W = 3024;
const SHOT_H = 1900;
const CARD_SCALE = 0.7;

const RAD = Math.PI / 180;

type CardDef = {
  id: string;
  /** [x, y, w, h] in 02-grow-home.png pixels — measured, not guessed. */
  rect: [number, number, number, number];
  angle: number; // degrees, screen convention (y down), 0 = right
  radius: number; // world px, node centre -> card centre
  spawn: number;
  rot: number; // subtle resting tilt
  ring: 0 | 1;
};

// Ring A — the five real "Running Ads" cards, laid out as a pentagon so the
// node reads as the hub. Rects verified against the card borders in the PNG.
const RING_A_R = 330;
const RING_B_R = 540;

const CARDS: CardDef[] = [
  // ---- Ring A : Running Ads (395x143 source cards, uniform 100px world tall)
  {
    id: "chatgpt",
    rect: [843, 1138, 395, 143],
    angle: -90,
    radius: RING_A_R,
    spawn: 32,
    rot: -1.6,
    ring: 0,
  },
  {
    id: "meta",
    rect: [1258, 1138, 396, 143],
    angle: -18,
    radius: RING_A_R,
    spawn: 36,
    rot: 2.2,
    ring: 0,
  },
  {
    id: "tiktok-ads",
    rect: [1258, 1297, 396, 142],
    angle: 198,
    radius: RING_A_R,
    spawn: 39,
    rot: -2.2,
    ring: 0,
  },
  {
    id: "google",
    rect: [1674, 1138, 395, 143],
    angle: 54,
    radius: RING_A_R,
    spawn: 43,
    rot: 1.8,
    ring: 0,
  },
  {
    id: "linkedin-ads",
    rect: [843, 1297, 395, 142],
    angle: 126,
    radius: RING_A_R,
    spawn: 46,
    rot: -1.4,
    ring: 0,
  },
  // ---- Ring B : the real "Social Media" cards, further out in the same world
  {
    id: "linkedin",
    rect: [1155, 1601, 291, 143],
    angle: -56,
    radius: RING_B_R,
    spawn: 74,
    rot: 2.4,
    ring: 1,
  },
  {
    id: "instagram",
    rect: [843, 1601, 292, 143],
    angle: 236,
    radius: RING_B_R,
    spawn: 78,
    rot: -2.2,
    ring: 1,
  },
  {
    id: "tiktok",
    rect: [1778, 1601, 291, 143],
    angle: 16,
    radius: RING_B_R,
    spawn: 82,
    rot: 1.6,
    ring: 1,
  },
  {
    id: "x-twitter",
    rect: [1466, 1601, 292, 143],
    angle: 164,
    radius: RING_B_R,
    spawn: 86,
    rot: -1.7,
    ring: 1,
  },
];

type PlacedCard = CardDef & {
  w: number;
  h: number;
  ux: number;
  uy: number;
  /** distance from card centre to the point where the connector meets it */
  enter: number;
};

const place = (c: CardDef): PlacedCard => {
  const w = c.rect[2] * CARD_SCALE;
  const h = c.rect[3] * CARD_SCALE;
  const ux = Math.cos(c.angle * RAD);
  const uy = Math.sin(c.angle * RAD);
  // Where the node->card ray crosses the card's own rectangle.
  const tx = Math.abs(ux) < 1e-6 ? Infinity : w / 2 / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Infinity : h / 2 / Math.abs(uy);
  return { ...c, w, h, ux, uy, enter: Math.min(tx, ty) };
};

const PLACED: PlacedCard[] = CARDS.map(place);

// Half-extent (world px, from the node) of each ring, including tilt. The
// camera derives its zoom from these so nothing can ever break the 5% margin.
const halfExtentX = (ring: number) => {
  const set = PLACED.filter((c) => c.ring <= ring);
  return Math.max(
    ...set.map((c) => {
      const a = Math.abs(c.rot) * RAD;
      const half = (c.w / 2) * Math.cos(a) + (c.h / 2) * Math.sin(a);
      return Math.abs(c.radius * c.ux) + half;
    }),
  );
};
const boundsY = (ring: number) => {
  const set = PLACED.filter((c) => c.ring <= ring);
  const tops = set.map((c) => {
    const a = Math.abs(c.rot) * RAD;
    const half = (c.h / 2) * Math.cos(a) + (c.w / 2) * Math.sin(a);
    return [c.radius * c.uy - half, c.radius * c.uy + half] as const;
  });
  return {
    min: Math.min(...tops.map((t) => t[0])),
    max: Math.max(...tops.map((t) => t[1])),
  };
};

// --------------------------------------------------------------------- parts

/** A real Runable card, crop-mounted from the live screenshot. */
const UiCard: React.FC<{ card: PlacedCard; frame: number; fps: number }> = ({
  card,
  frame,
  fps,
}) => {
  const local = Math.max(0, frame - card.spawn);
  const started = frame >= card.spawn;
  const p = spring({
    frame: local,
    fps,
    config: { damping: 20, stiffness: 105, mass: 1 },
    durationInFrames: card.ring === 0 ? 26 : 20,
  });
  const op = started
    ? interpolate(local, [0, 9], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  if (op <= 0) return null;

  // Arrives from just inside its resting orbit, so the ring reads as thrown
  // outward by the node rather than fading in from nowhere.
  const r = card.radius * interpolate(p, [0, 1], [0.78, 1]);
  const sc = interpolate(p, [0, 1], [0.9, 1]);
  const cx = NODE + card.ux * r;
  const cy = NODE + card.uy * r;

  const depth = card.ring === 0 ? 1 : 0.9;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - card.w / 2,
        top: cy - card.h / 2,
        width: card.w,
        height: card.h,
        borderRadius: 20 * CARD_SCALE,
        overflow: "hidden",
        opacity: op * depth,
        transform: `rotate(${card.rot}deg) scale(${sc})`,
        boxShadow: `${MRD.panelShadow}, 0 0 ${44 * CARD_SCALE}px rgba(0,255,171,0.10), 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      <Img
        src={staticFile(SHOTS.growHome)}
        style={{
          position: "absolute",
          left: -card.rect[0] * CARD_SCALE,
          top: -card.rect[1] * CARD_SCALE,
          width: SHOT_W * CARD_SCALE,
          height: SHOT_H * CARD_SCALE,
          maxWidth: "none",
        }}
      />
    </div>
  );
};

/** One expanding pulse off the node. Period 24f, so a pulse completes on the
 *  opening hold exactly as the camera starts to move. */
const PulseRing: React.FC<{ frame: number; offset: number; master: number }> = ({
  frame,
  offset,
  master,
}) => {
  const t = (((frame + offset) % 24) + 24) / 24 - 1;
  const size = 132;
  const scale = 1 + t * 2.2;
  const opacity = (1 - t) * (1 - t) * 0.55 * master;
  return (
    <div
      style={{
        position: "absolute",
        left: NODE - size / 2,
        top: NODE - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${MRD.green}`,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ------------------------------------------------------------------- the comp

export const BgP1OnePersonAgency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 5% side safe margin is the source of truth for how far the camera pulls
  // out — never a hardcoded edge coordinate.
  const SAFE_HALF = width / 2 - safePadX(width); // 486 on 1080
  const FIT = 0.9; // breathing room inside the safe box

  const geo = useMemo(() => {
    const aX = halfExtentX(0);
    const bX = halfExtentX(1);
    const aY = boundsY(0);
    const bY = boundsY(1);
    return {
      zMid: (SAFE_HALF * FIT) / aX,
      zEnd: (SAFE_HALF * FIT) / bX,
      fyMid: NODE + (aY.min + aY.max) / 2,
      fyEnd: NODE + (bY.min + bY.max) / 2,
    };
  }, [SAFE_HALF]);

  const ease = Easing.inOut(Easing.cubic);
  const KEY_T = [0, 24, 44, 74, 95, DURATION_IN_FRAMES];

  const z = interpolate(
    frame,
    KEY_T,
    [2.42, 2.42, geo.zMid, geo.zMid, geo.zEnd, geo.zEnd * 0.985],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const fx = interpolate(frame, KEY_T, [NODE, NODE, NODE, NODE, NODE, NODE], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(
    frame,
    KEY_T,
    [NODE, NODE, geo.fyMid, geo.fyMid, geo.fyEnd, geo.fyEnd - 4],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // The closer the camera is, the more of a soft glow fills the frame — so
  // attenuate every glow by zoom and keep the ground reading as #0A0A0A.
  const glowAtten = interpolate(z, [0.6, 1.5, 2.42], [1, 0.44, 0.26], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Node micro-motion: it is already alive on frame 0.
  const breathe = 1 + Math.sin(frame / 8.2) * 0.028;
  const glowPulse = 0.55 + Math.sin(frame / 7.4) * 0.2;
  const pulseMaster = interpolate(frame, [58, 82], [1, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringAtten = interpolate(z, [0.7, 2.42], [1, 0.72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const orbitR = 168;
  const orbitAngle = frame * 1.6 - 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        backgroundImage: MRD_GRADIENT.ground,
      }}
    >
      {/* ------------------------------------------------ the continuous world */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* faint vertical rule grid, like merydian.ai */}
        <div
          style={{
            position: "absolute",
            left: -200,
            top: -200,
            width: WORLD + 400,
            height: WORLD + 400,
            backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0px, ${MRD_GRID.color} 1px, transparent 1px, transparent ${MRD_GRID.spacing}px)`,
          }}
        />

        {/* green ground glow under the node */}
        <div
          style={{
            position: "absolute",
            left: NODE - 900,
            top: NODE - 900,
            width: 1800,
            height: 1800,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,171,0.15) 0%, rgba(0,213,199,0.06) 34%, rgba(0,255,171,0) 66%)",
            opacity: glowAtten,
          }}
        />

        {/* hairline orbit — the system exists before the cards land */}
        <div
          style={{
            position: "absolute",
            left: NODE - orbitR,
            top: NODE - orbitR,
            width: orbitR * 2,
            height: orbitR * 2,
            borderRadius: "50%",
            border: "1px solid rgba(0,255,171,0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: NODE + Math.cos(orbitAngle * RAD) * orbitR - 5,
            top: NODE + Math.sin(orbitAngle * RAD) * orbitR - 5,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: MRD.green,
            boxShadow: `0 0 16px ${MRD.greenGlow}`,
          }}
        />

        {/* ------------------------------------------- node -> campaign wiring */}
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD,
            height: WORLD,
            overflow: "visible",
          }}
          viewBox={`0 0 ${WORLD} ${WORLD}`}
        >
          {PLACED.map((c) => {
            const draw = interpolate(
              frame,
              [c.spawn - 4, c.spawn + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            if (draw <= 0) return null;
            const from = 64;
            const to = c.radius - c.enter - 13;
            const len = to - from;
            const x1 = NODE + c.ux * from;
            const y1 = NODE + c.uy * from;
            const x2 = NODE + c.ux * to;
            const y2 = NODE + c.uy * to;

            // one packet travelling out to the campaign, forever
            const pkT = ((frame - (c.spawn + 10)) % 34) / 34;
            const pkOn = frame > c.spawn + 10 && pkT >= 0;
            const pkD = from + len * pkT;
            const pkOp = pkOn
              ? Math.sin(Math.PI * Math.min(1, Math.max(0, pkT))) * 0.95
              : 0;

            return (
              <g key={c.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={MRD.green}
                  strokeWidth={6}
                  strokeLinecap="round"
                  opacity={0.07}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - draw)}
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={MRD.green}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  opacity={c.ring === 0 ? 0.46 : 0.32}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - draw)}
                />
                {draw > 0.92 ? (
                  <circle
                    cx={x2}
                    cy={y2}
                    r={5}
                    fill={MRD.green}
                    opacity={c.ring === 0 ? 0.9 : 0.7}
                  />
                ) : null}
                {pkOp > 0.01 ? (
                  <circle
                    cx={NODE + c.ux * pkD}
                    cy={NODE + c.uy * pkD}
                    r={5.5}
                    fill={MRD.green}
                    opacity={pkOp * (c.ring === 0 ? 1 : 0.75)}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* ------------------------------------------------- the campaign cards */}
        {PLACED.map((c) => (
          <UiCard key={c.id} card={c} frame={frame} fps={fps} />
        ))}

        {/* ------------------------------------------------------------ the node */}
        <PulseRing frame={frame} offset={0} master={pulseMaster * ringAtten} />
        <PulseRing frame={frame} offset={8} master={pulseMaster * ringAtten} />
        <PulseRing frame={frame} offset={16} master={pulseMaster * ringAtten} />

        <div
          style={{
            position: "absolute",
            left: NODE - 210,
            top: NODE - 210,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,171,0.34) 0%, rgba(0,255,171,0.11) 40%, rgba(0,255,171,0) 70%)",
            opacity: glowPulse * glowAtten,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: NODE - NODE_SIZE / 2,
            top: NODE - NODE_SIZE / 2,
            width: NODE_SIZE,
            height: NODE_SIZE,
            transform: `scale(${breathe})`,
            filter: `drop-shadow(0 0 ${22 / Math.max(1, z)}px ${MRD.greenGlow})`,
          }}
        >
          <Img
            src={staticFile(BRAND.merydianMark)}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>

      {/* ------------------------------------ viewport lighting (bleeds to edge) */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {[
          { x: 0.14, w: 190 },
          { x: 0.37, w: 120 },
          { x: 0.63, w: 230 },
          { x: 0.85, w: 140 },
        ].map((s) => (
          <div
            key={s.x}
            style={{
              position: "absolute",
              left: width * s.x - s.w / 2,
              top: 0,
              width: s.w,
              height: height * 0.62,
              backgroundImage: MRD_GRADIENT.streak,
              filter: "blur(34px)",
              opacity: 0.5,
            }}
          />
        ))}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
