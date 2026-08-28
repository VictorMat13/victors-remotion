import React from "react";
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
import { FONT_SANS, NOTION, PILL, SPRINGS } from "./theme";

export const DURATION_IN_FRAMES = 300;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 1750;
const WORLD_H = 1750;

// Fragment frames (floating database slivers, world coords)
const KAN = { x: 170, y: 250, w: 640, h: 508 }; // 🎬 Content — kanban
const TL = { x: 980, y: 660, w: 620, h: 440 }; // ✅ Tasks — timeline
const TBL = { x: 280, y: 1010, w: 680, h: 430 }; // 🤝 Brand Deals — table
const CLI = { x: 1180, y: 270, w: 420, h: 310 }; // 👥 Clients — list

// Notion cube chip (thesis anchor, bottom-center of final framing)
const CHIP = { x: 885, y: 1502, size: 108 };

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

// drift | move | hold KAN | move | hold TL | move | hold TBL | pull | end hold
const KEY_T = [0, 76, 94, 138, 156, 198, 216, 252, 270, 299];
const KEY_FX = [868, 886, 505, 505, 1290, 1290, 620, 620, 885, 885];
const KEY_FY = [828, 848, 522, 522, 875, 875, 1225, 1225, 875, 875];
const KEY_Z = [0.615, 0.6, 1.28, 1.28, 1.28, 1.28, 1.28, 1.28, 0.585, 0.585];

/* ------------------------------------------------------------- timings --- */

const BLUE = { t0: 96, dur: 18, dock: 114 };
const YELLOW = { t0: 158, dur: 18, dock: 176 };
const RED = { t0: 218, dur: 16, dock: 234 };

const WAKE_KAN = 112;
const WAKE_TL = 174;
const WAKE_TBL = 232;
const WAKE_CLI = 258;
const WAKE_DUR = 26;

const CHIP_T = 258;

/* ---------------------------------------------------------------- geom --- */

type Pt = { x: number; y: number };

const qBezier = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

// Orb perches + flight paths
const PERCH_BLUE: Pt = { x: 800, y: 300 };
const PERCH_YELLOW: Pt = { x: 1290, y: 700 };
const PERCH_RED: Pt = { x: 935, y: 1032 };

const FLIGHTS = {
  blue: { from: { x: -90, y: 40 }, ctrl: { x: 340, y: -60 }, to: PERCH_BLUE },
  yellow: { from: { x: 1860, y: 240 }, ctrl: { x: 1520, y: 360 }, to: PERCH_YELLOW },
  red: { from: { x: 1900, y: 1620 }, ctrl: { x: 1320, y: 1240 }, to: PERCH_RED },
} as const;

// Connective lines between fragments (dim from frame 0, packets after wake)
const EDGES = [
  { from: { x: 812, y: 470 }, c: { x: 930, y: 590 }, to: { x: 978, y: 810 }, on: 140, col: "#2D9CEB" },
  { from: { x: 1230, y: 1102 }, c: { x: 1080, y: 1180 }, to: { x: 962, y: 1190 }, on: 200, col: "#DFA612" },
  { from: { x: 560, y: 1008 }, c: { x: 500, y: 895 }, to: { x: 492, y: 762 }, on: 252, col: "#E0455E" },
  { from: { x: 1330, y: 658 }, c: { x: 1345, y: 615 }, to: { x: 1380, y: 582 }, on: 256, col: NOTION.green },
  { from: { x: 812, y: 330 }, c: { x: 1000, y: 320 }, to: { x: 1178, y: 390 }, on: 260, col: NOTION.blue },
] as const;

/* ---------------------------------------------------------------- atoms --- */

const Pill: React.FC<{
  color: { bg: string; text: string };
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ color, children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: color.bg,
      color: color.text,
      borderRadius: 6,
      padding: "4px 13px",
      fontSize: 26,
      lineHeight: 1.25,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

// Notion-style checkbox that ticks green
const Check: React.FC<{ p: number; size?: number; glow?: number }> = ({
  p,
  size = 34,
  glow = 0,
}) => {
  const on = p > 0.03;
  const pop = 1 + 0.2 * Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: on ? "none" : "2.5px solid #C9C7C3",
        backgroundColor: on ? NOTION.green : "#FFFFFF",
        transform: `scale(${on ? pop : 1})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        boxShadow: on
          ? `0 0 ${12 + 7 * glow}px rgba(68,131,97,${0.22 + 0.16 * glow})`
          : "none",
      }}
    >
      {on ? (
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
          <path
            d="M4 12.5 L9.5 18 L20 6.5"
            stroke="#FFFFFF"
            strokeWidth={3.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - Math.min(1, p)}
          />
        </svg>
      ) : null}
    </div>
  );
};

const FragTitle: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div
    style={{
      position: "absolute",
      left: 30,
      top: 24,
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <span style={{ fontSize: 38, lineHeight: 1 }}>{icon}</span>
    <span style={{ fontSize: 40, fontWeight: 800, color: NOTION.text }}>{text}</span>
  </div>
);

const RowLine: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 1.5,
      backgroundColor: NOTION.border,
    }}
  />
);

/* ---------------------------------------------------- orb characters ----- */
/* Faithful to rydnel-04: gradient orbs, thin black line-art faces —
   two short brow strokes, dot or x-x eyes, long cursive-2 nose stroke. */

const INK = "#17150F";

// Orb graphic: 168x190 box, sphere center (84, 96), r 56.
const OrbBody: React.FC<{ grad: string; glow: string }> = ({ grad, glow }) => (
  <div
    style={{
      position: "absolute",
      left: 28,
      top: 40,
      width: 112,
      height: 112,
      borderRadius: "50%",
      background: grad,
      boxShadow: `0 10px 30px ${glow}, 0 0 26px ${glow}`,
    }}
  />
);

// Official Notion aiFace geometry, extracted from the app (viewBox 0 0 20 20).
// Filled outline paths — the ~1.25u line weight is baked into the shapes.
const FACE_EYES =
  "M12.758 9.976a1.178 1.178 0 1 0 .377-2.326 1.178 1.178 0 0 0-.377 2.326M6.547 8.97a1.178 1.178 0 1 0 .377-2.327 1.178 1.178 0 0 0-.377 2.326";
const FACE_LINES =
  "M10.573 5.554a3.917 3.917 0 0 1 6.743.035.625.625 0 1 1-1.08.63 2.667 2.667 0 0 0-4.591-.023l-5.398 9.015 4.192.68a.625.625 0 0 1-.2 1.233l-5.102-.827a.625.625 0 0 1-.436-.938zM4.36 3.517a3.92 3.92 0 0 1 5.572.356.625.625 0 1 1-.945.818 2.67 2.67 0 0 0-3.795-.243.625.625 0 1 1-.833-.931";

// Expression varies only by tiny tilt — the paths never change.
const NotionFace: React.FC<{ blink: number; tilt?: number }> = ({ blink, tilt = 0 }) => (
  <g transform={`translate(38 50) scale(3.8) rotate(${tilt} 10 10)`}>
    <path d={FACE_LINES} fill={INK} />
    <g style={{ transformOrigin: "9.9px 8.3px", transform: `scaleY(${blink})` }}>
      <path d={FACE_EYES} fill={INK} />
    </g>
  </g>
);

// blink: 1 → squash → 1 over 7 frames at the listed times
const blinkAt = (frame: number, times: readonly number[]): number => {
  for (const t of times) {
    if (frame >= t && frame <= t + 7) {
      return interpolate(frame, [t, t + 3, t + 4, t + 7], [1, 0.12, 0.12, 1]);
    }
  }
  return 1;
};

const BlueOrb: React.FC<{ blink: number }> = ({ blink }) => (
  <>
    <OrbBody
      grad="radial-gradient(circle at 38% 30%, #8ED4FF 0%, #38A1EC 52%, #1568C4 100%)"
      glow="rgba(45,156,235,0.30)"
    />
    <svg width={168} height={190} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* face: official Notion aiFace geometry */}
      <NotionFace blink={blink} tilt={-3} />
      {/* deerstalker cap (rydnel-08) */}
      <g transform="translate(0 6) rotate(-4 84 40)">
        <path
          d="M 30 52 Q 34 12 84 9 Q 134 12 138 52 Q 111 41 84 43 Q 57 41 30 52 Z"
          fill="#C9AC80"
          stroke="#6E5636"
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path d="M 84 10 Q 84 26 84 43" stroke="#6E5636" strokeWidth={2.6} fill="none" />
        <ellipse cx={30} cy={52} rx={17} ry={8} fill="#B69A6F" stroke="#6E5636" strokeWidth={3} />
        <ellipse cx={138} cy={52} rx={14} ry={7} fill="#B69A6F" stroke="#6E5636" strokeWidth={3} />
        <circle cx={84} cy={8} r={5} fill="#B69A6F" stroke="#6E5636" strokeWidth={2.6} />
      </g>
      {/* magnifying glass, held lower-left */}
      <g transform="rotate(8 34 150)">
        <circle cx={34} cy={148} r={19} fill="rgba(191,227,247,0.55)" stroke="#2F2B26" strokeWidth={5} />
        <path d="M 47 162 L 62 178" stroke="#2F2B26" strokeWidth={6.5} strokeLinecap="round" />
        <path d="M 26 141 Q 30 137 35 138" stroke="rgba(255,255,255,0.9)" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  </>
);

const YellowOrb: React.FC<{ blink: number }> = ({ blink }) => (
  <>
    <OrbBody
      grad="radial-gradient(circle at 40% 30%, #FFF3A6 0%, #FFD84D 52%, #EFB227 100%)"
      glow="rgba(240,180,41,0.32)"
    />
    <svg width={168} height={190} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* face: official Notion aiFace geometry */}
      <NotionFace blink={blink} />
      {/* headphones (rydnel-12) */}
      <path d="M 32 96 Q 34 30 84 28 Q 134 30 136 96" stroke="#23201B" strokeWidth={9} fill="none" strokeLinecap="round" />
      <rect x={18} y={84} width={24} height={38} rx={10} fill="#23201B" />
      <rect x={126} y={84} width={24} height={38} rx={10} fill="#23201B" />
      <rect x={22} y={90} width={5} height={26} rx={2.5} fill="#4A453D" />
      <rect x={141} y={90} width={5} height={26} rx={2.5} fill="#4A453D" />
    </svg>
  </>
);

const RedOrb: React.FC<{ blink: number }> = ({ blink }) => (
  <>
    <OrbBody
      grad="radial-gradient(circle at 40% 32%, #FF93A6 0%, #F04E64 52%, #D21F3C 100%)"
      glow="rgba(224,69,94,0.30)"
    />
    <svg width={168} height={190} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* face: official Notion aiFace geometry */}
      <NotionFace blink={blink} tilt={3} />
      {/* cowboy hat (NotionHQ-26) */}
      <g transform="rotate(-5 84 42)">
        <path
          d="M 60 20 Q 63 2 84 2 Q 105 2 108 20 L 110 40 Q 97 36 84 36 Q 71 36 58 40 Z"
          fill="#C4A484"
          stroke="#6E5636"
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 84 3 Q 84 18 84 35" stroke="#6E5636" strokeWidth={2.4} fill="none" />
        <path
          d="M 24 44 Q 30 36 58 38 Q 71 34 84 34 Q 97 34 110 38 Q 138 36 144 44 Q 132 56 84 55 Q 36 56 24 44 Z"
          fill="#B08F6B"
          stroke="#6E5636"
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 58 39 Q 84 46 110 39" stroke="#8F7350" strokeWidth={7} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  </>
);

/* ---------------------------------------------------------- composition --- */

export const NotionP6RunBusiness: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const opt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const lin = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  const fx = interpolate(frame, KEY_T, KEY_FX, opt);
  const fy = interpolate(frame, KEY_T, KEY_FY, opt);
  const z = interpolate(frame, KEY_T, KEY_Z, opt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 30
  ) =>
    frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  /* ---- per-zone wake (smooth per-fragment dim → color) ---- */
  const wake = (t0: number) => interpolate(frame, [t0, t0 + WAKE_DUR], [0, 1], opt);
  const wKan = wake(WAKE_KAN);
  const wTl = wake(WAKE_TL);
  const wTbl = wake(WAKE_TBL);
  const wCli = wake(WAKE_CLI);

  // dim → wake styling: desaturated + dimmed archive, saturates per zone
  const zoneStyle = (w: number): React.CSSProperties => ({
    filter: `grayscale(${(1 - w) * 0.95}) opacity(${0.66 + 0.34 * w})`,
  });
  const float = (w: number, phase: number) => 2.5 * Math.sin(frame / 16 + phase) * w;

  /* ---- kanban action: card moves to Done, counts tick ---- */
  const moveP = spr(120, SPRINGS.snappy, 26);
  const counted = moveP > 0.55;
  const countPop = 1 + 0.25 * Math.sin(Math.min(1, spr(131, SPRINGS.bouncy, 20)) * Math.PI);

  /* ---- timeline action: checks tick, today line pulses ---- */
  const tick1 = spr(184, SPRINGS.snappy, 24);
  const tick2 = spr(194, SPRINGS.snappy, 24);
  const todayPulse = wTl * (0.8 + 0.2 * Math.sin(frame / 10));

  /* ---- table action: row sweep + pill flips green ---- */
  const sweepP = interpolate(frame, [238, 252], [0, 1], opt);
  const flipOld = interpolate(frame, [242, 250], [1, 0], opt);
  const flipNew = spr(244, SPRINGS.bouncy, 24);

  /* ---- clients: green dots pop on system wake ---- */
  const dot1 = spr(262, SPRINGS.bouncy, 22);
  const dot2 = spr(268, SPRINGS.bouncy, 22);

  /* ---- end-hold green pulse ---- */
  const settled = interpolate(frame, [262, 278], [0, 1], opt);
  const pulse = (ph: number) => settled * (0.5 + 0.5 * Math.sin(frame / 9 + ph));

  /* ---- chip settle ---- */
  const chipP = spr(CHIP_T, SPRINGS.smooth, 34);

  /* ---- orb flight ---- */
  const orbPose = (
    f: { from: Pt; ctrl: Pt; to: Pt },
    t: { t0: number; dur: number; dock: number }
  ) => {
    const p = interpolate(frame, [t.t0, t.t0 + t.dur], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...lin,
    });
    const pos = qBezier(f.from, f.ctrl, f.to, p);
    const land = spr(t.dock, SPRINGS.bouncy, 22);
    const squash = frame < t.dock ? 1 : 1 - 0.13 * (1 - land);
    const bob = frame < t.dock ? 0 : 3 * Math.sin((frame - t.dock) / 13);
    const rot = (1 - p) * -12;
    const scale = 0.75 + 0.25 * p;
    const vis = frame >= t.t0 - 2;
    return { pos, squash, bob, rot, scale, vis };
  };
  const blue = orbPose(FLIGHTS.blue, BLUE);
  const yellow = orbPose(FLIGHTS.yellow, YELLOW);
  const red = orbPose(FLIGHTS.red, RED);

  const blinkBlue = blinkAt(frame, [186, 276]);
  const blinkYellow = blinkAt(frame, [214, 284]);
  const blinkRed = blinkAt(frame, [262, 291]);

  /* ---- dock rings ---- */
  const rings = [
    { t: BLUE.dock, p: PERCH_BLUE, col: "45,156,235" },
    { t: YELLOW.dock, p: PERCH_YELLOW, col: "240,180,41" },
    { t: RED.dock, p: PERCH_RED, col: "224,69,94" },
  ];

  /* ---- fragment bloom (soft color halo once its agent is on station) ---- */
  const blooms = [
    { f: KAN, w: wKan, col: "45,156,235" },
    { f: TL, w: wTl, col: "240,180,41" },
    { f: TBL, w: wTbl, col: "224,69,94" },
    { f: CLI, w: wCli, col: "68,131,97" },
  ];

  const orbWrap = (
    o: ReturnType<typeof orbPose>,
    node: React.ReactNode,
    key: string
  ): React.ReactNode =>
    o.vis ? (
      <div
        key={key}
        style={{
          position: "absolute",
          left: o.pos.x - 84,
          top: o.pos.y - 96 + o.bob,
          width: 168,
          height: 190,
          transform: `rotate(${o.rot}deg) scale(${o.scale}, ${o.scale * o.squash})`,
          transformOrigin: "84px 96px",
        }}
      >
        {node}
      </div>
    ) : null;

  const kanCard = (title: string, date: string): React.ReactNode => (
    <>
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 14,
          right: 14,
          fontSize: 26,
          fontWeight: 500,
          color: NOTION.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 56,
          fontSize: 21,
          color: NOTION.faint,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {date}
      </div>
    </>
  );

  const kanCardBox: React.CSSProperties = {
    position: "absolute",
    width: 280,
    height: 96,
    backgroundColor: "#FFFFFF",
    border: `1.5px solid ${NOTION.border}`,
    borderRadius: 10,
    boxShadow: "0 1px 2px rgba(15,15,15,0.04), 0 4px 12px rgba(15,15,15,0.05)",
  };

  // moving kanban card path (fragment-local): col1 slot1 → col2 slot0
  const mvFrom = { x: 36, y: 262 };
  const mvTo = { x: 340, y: 152 };
  const mvX = mvFrom.x + (mvTo.x - mvFrom.x) * moveP;
  const mvY = mvFrom.y + (mvTo.y - mvFrom.y) * moveP - 26 * Math.sin(Math.PI * moveP);
  const doneShift = interpolate(moveP, [0.35, 0.85], [0, 110], lin);

  return (
    <AbsoluteFill style={{ backgroundColor: NOTION.bg, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------- connective lines (dim, part of the archive) ---------- */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {EDGES.map((e, i) => {
            const active = interpolate(frame, [e.on, e.on + 16], [0, 1], opt);
            return (
              <path
                key={i}
                d={`M ${e.from.x} ${e.from.y} Q ${e.c.x} ${e.c.y} ${e.to.x} ${e.to.y}`}
                stroke={active > 0.5 ? "#C9C6BF" : "#DDDBD6"}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                opacity={0.55 + 0.35 * active}
                strokeDasharray="1 14"
              />
            );
          })}
        </svg>

        {/* ---------- wake blooms behind fragments ---------- */}
        {blooms.map((b, i) =>
          b.w > 0 ? (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.f.x - 110,
                top: b.f.y - 110,
                width: b.f.w + 220,
                height: b.f.h + 220,
                borderRadius: 60,
                background: `radial-gradient(ellipse at center, rgba(${b.col},${
                  0.1 * b.w
                }) 0%, rgba(${b.col},0) 70%)`,
              }}
            />
          ) : null
        )}

        {/* ================= KANBAN — 🎬 Content ================= */}
        <div
          style={{
            position: "absolute",
            left: KAN.x,
            top: KAN.y + float(wKan, 0.4),
            width: KAN.w,
            height: KAN.h,
            backgroundColor: "#FFFFFF",
            border: `1.5px solid ${NOTION.border}`,
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(15,15,15,0.03), 0 6px 22px rgba(15,15,15,0.06)",
            transform: "rotate(-0.6deg)",
            ...zoneStyle(wKan),
          }}
        >
          <FragTitle icon="🎬" text="Content" />
          {/* column headers */}
          <div style={{ position: "absolute", left: 36, top: 98, display: "flex", alignItems: "center", gap: 12 }}>
            <Pill color={PILL.red} style={{ fontSize: 23, padding: "3px 11px" }}>
              <span style={{ color: "#E0455E", marginRight: 8, fontSize: 17 }}>●</span>
              In progress
            </Pill>
            <span
              style={{
                fontSize: 24,
                color: NOTION.faint,
                fontVariantNumeric: "tabular-nums",
                display: "inline-block",
                transform: `scale(${counted ? countPop : 1})`,
              }}
            >
              {counted ? 1 : 2}
            </span>
          </div>
          <div style={{ position: "absolute", left: 340, top: 98, display: "flex", alignItems: "center", gap: 12 }}>
            <Pill
              color={PILL.green}
              style={{
                fontSize: 23,
                padding: "3px 11px",
                boxShadow: `0 0 ${14 + 6 * pulse(0)}px rgba(68,131,97,${0.22 * pulse(0)})`,
              }}
            >
              <span style={{ color: NOTION.green, marginRight: 8, fontSize: 17 }}>●</span>
              Done
            </Pill>
            <span
              style={{
                fontSize: 24,
                color: NOTION.faint,
                fontVariantNumeric: "tabular-nums",
                display: "inline-block",
                transform: `scale(${counted ? countPop : 1})`,
              }}
            >
              {counted ? 3 : 2}
            </span>
          </div>

          {/* In progress column */}
          <div style={{ ...kanCardBox, left: 36, top: 152 }}>{kanCard("Reel 12 — Workflow", "Aug 4")}</div>
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 384,
              fontSize: 24,
              color: NOTION.faint,
            }}
          >
            ＋ New page
          </div>

          {/* Done column (shifts down as the moved card arrives) */}
          <div style={{ ...kanCardBox, left: 340, top: 152 + doneShift }}>
            {kanCard("Reel 10 — Desk tour", "Jul 28")}
          </div>
          <div style={{ ...kanCardBox, left: 340, top: 262 + doneShift }}>
            {kanCard("Reel 09 — Setup", "Jul 21")}
          </div>

          {/* the moving card */}
          <div
            style={{
              ...kanCardBox,
              left: mvX,
              top: mvY,
              boxShadow: `0 ${2 + 10 * Math.sin(Math.PI * moveP)}px ${
                10 + 22 * Math.sin(Math.PI * moveP)
              }px rgba(15,15,15,${0.06 + 0.09 * Math.sin(Math.PI * moveP)})`,
              transform: `rotate(${2.5 * Math.sin(Math.PI * moveP)}deg)`,
              border: `1.5px solid ${
                moveP > 0.85 ? `rgba(68,131,97,${0.5 + 0.3 * pulse(1)})` : NOTION.border
              }`,
            }}
          >
            {kanCard("Reel 11 — CLI setup", "Aug 1")}
          </div>
        </div>

        {/* ================= TIMELINE — ✅ Tasks ================= */}
        <div
          style={{
            position: "absolute",
            left: TL.x,
            top: TL.y + float(wTl, 1.7),
            width: TL.w,
            height: TL.h,
            backgroundColor: "#FFFFFF",
            border: `1.5px solid ${NOTION.border}`,
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(15,15,15,0.03), 0 6px 22px rgba(15,15,15,0.06)",
            transform: "rotate(0.5deg)",
            ...zoneStyle(wTl),
          }}
        >
          <FragTitle icon="✅" text="Tasks" />
          <div
            style={{
              position: "absolute",
              right: 34,
              top: 38,
              fontSize: 24,
              color: NOTION.faint,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Aug 2026
          </div>

          {/* day strip */}
          {Array.from({ length: 13 }, (_, i) => {
            const day = i + 1;
            const x = 36 + i * 45;
            const today = day === 4;
            return (
              <React.Fragment key={i}>
                {today ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: x - 8,
                        top: 88,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: NOTION.red,
                        opacity: 0.55 + 0.45 * todayPulse,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: x + 6.5,
                        top: 122,
                        width: 3,
                        height: 296,
                        backgroundColor: NOTION.red,
                        opacity: 0.35 + 0.45 * todayPulse,
                      }}
                    />
                  </>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: x - 8,
                    top: 92,
                    width: 32,
                    textAlign: "center",
                    fontSize: 22,
                    color: today ? "#FFFFFF" : NOTION.faint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {day}
                </div>
              </React.Fragment>
            );
          })}

          {/* task pills */}
          {(
            [
              { x: 60, y: 164, icon: null, text: "Send invoice — Arc Labs", pri: PILL.red, priTx: "High", tick: tick1 },
              { x: 148, y: 228, icon: null, text: "Film Reel 12", pri: PILL.red, priTx: "High", tick: tick2 },
              { x: 300, y: 292, icon: "📅", text: "Planning sync", pri: PILL.yellow, priTx: "Med", tick: null },
              { x: 92, y: 356, icon: "💬", text: "Reply in #launch", pri: PILL.blue, priTx: "Low", tick: null },
            ] as const
          ).map((t, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: t.x,
                top: t.y,
                height: 54,
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#FFFFFF",
                border: `1.5px solid ${NOTION.border}`,
                borderRadius: 12,
                padding: "0 16px",
                boxShadow: "0 1px 2px rgba(15,15,15,0.04), 0 4px 12px rgba(15,15,15,0.05)",
              }}
            >
              {t.tick !== null ? (
                <Check p={t.tick} size={32} glow={pulse(2 + i)} />
              ) : (
                <span style={{ fontSize: 24 }}>{t.icon}</span>
              )}
              <span style={{ fontSize: 27, fontWeight: 500, color: NOTION.text, whiteSpace: "nowrap" }}>
                {t.text}
              </span>
              <Pill color={t.pri} style={{ fontSize: 21, padding: "2px 10px" }}>
                {t.priTx}
              </Pill>
            </div>
          ))}
        </div>

        {/* ================= TABLE — 🤝 Brand Deals ================= */}
        <div
          style={{
            position: "absolute",
            left: TBL.x,
            top: TBL.y + float(wTbl, 3.1),
            width: TBL.w,
            height: TBL.h,
            backgroundColor: "#FFFFFF",
            border: `1.5px solid ${NOTION.border}`,
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(15,15,15,0.03), 0 6px 22px rgba(15,15,15,0.06)",
            transform: "rotate(-0.4deg)",
            ...zoneStyle(wTbl),
          }}
        >
          <FragTitle icon="🤝" text="Brand Deals" />
          {(
            [
              { x: 30, tx: "Aa  Name" },
              { x: 372, tx: "⊙  Stage" },
              { x: 566, tx: "#  Rate" },
            ] as const
          ).map((h, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: h.x,
                top: 102,
                fontSize: 24,
                color: NOTION.faint,
                fontWeight: 500,
                whiteSpace: "pre",
              }}
            >
              {h.tx}
            </div>
          ))}
          <RowLine x={30} y={140} w={TBL.w - 60} />

          {/* acted-row sweep + ring (row 3) */}
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 284,
              width: (TBL.w - 44) * sweepP,
              height: 62,
              borderRadius: 8,
              background:
                "linear-gradient(90deg, rgba(68,131,97,0.04) 0%, rgba(68,131,97,0.11) 100%)",
              opacity: sweepP > 0 ? interpolate(frame, [252, 268], [1, 0.55], opt) : 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 284,
              width: TBL.w - 44,
              height: 62,
              borderRadius: 8,
              border: `2px solid rgba(68,131,97,${0.5 * Math.min(1, flipNew * 1.2)})`,
              boxShadow: `0 0 ${14 + 8 * pulse(3)}px rgba(68,131,97,${
                0.16 * Math.min(1, flipNew * 1.2) + 0.14 * pulse(3)
              })`,
              opacity: flipNew > 0 ? 1 : 0,
            }}
          />

          {(
            [
              { name: "Arc Labs — Aug reel", pill: PILL.blue, stage: "Drafting", rate: "$4,500" },
              { name: "Nomad Desk — Q3", pill: PILL.green, stage: "Live", rate: "$6,200" },
              { name: "Fluent — Sept push", pill: null, stage: "", rate: "$3,800" },
            ] as const
          ).map((r, i) => {
            const y = 140 + i * 70;
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    top: y,
                    height: 70,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 30,
                    color: NOTION.text,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 25 }}>📄</span>
                  {r.name}
                </div>
                {r.pill ? (
                  <div style={{ position: "absolute", left: 372, top: y + 16 }}>
                    <Pill
                      color={r.pill}
                      style={
                        i === 1
                          ? {
                              boxShadow: `0 0 ${12 + 6 * pulse(4)}px rgba(68,131,97,${
                                0.2 * pulse(4)
                              })`,
                            }
                          : undefined
                      }
                    >
                      {r.stage}
                    </Pill>
                  </div>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: 566,
                    top: y,
                    height: 70,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 28,
                    color: NOTION.muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.rate}
                </div>
                {i < 2 ? <RowLine x={30} y={y + 70} w={TBL.w - 60} /> : null}
              </React.Fragment>
            );
          })}

          {/* row-3 stage: Talks → Signed (green) */}
          <div style={{ position: "absolute", left: 372, top: 296 }}>
            <div
              style={{
                position: "absolute",
                opacity: flipOld,
                transform: `scaleY(${0.6 + 0.4 * flipOld})`,
              }}
            >
              <Pill color={PILL.orange}>Talks</Pill>
            </div>
            <div
              style={{
                position: "absolute",
                opacity: Math.min(1, flipNew * 1.5),
                transform: `scale(${0.4 + 0.6 * flipNew})`,
                transformOrigin: "left center",
              }}
            >
              <Pill
                color={PILL.green}
                style={{
                  boxShadow: `0 0 ${14 + 8 * pulse(5)}px rgba(68,131,97,${
                    0.3 * pulse(5)
                  })`,
                }}
              >
                Signed
              </Pill>
            </div>
          </div>

          <div style={{ position: "absolute", left: 30, top: 366, fontSize: 24, color: NOTION.faint }}>
            ＋ New page
          </div>
        </div>

        {/* ================= LIST — 👥 Clients ================= */}
        <div
          style={{
            position: "absolute",
            left: CLI.x,
            top: CLI.y + float(wCli, 4.6),
            width: CLI.w,
            height: CLI.h,
            backgroundColor: "#FFFFFF",
            border: `1.5px solid ${NOTION.border}`,
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(15,15,15,0.03), 0 6px 22px rgba(15,15,15,0.06)",
            transform: "rotate(0.7deg)",
            ...zoneStyle(wCli),
          }}
        >
          <FragTitle icon="👥" text="Clients" />
          {(
            [
              { init: "AL", bg: PILL.blue, name: "Arc Labs", dp: dot1 },
              { init: "ND", bg: PILL.purple, name: "Nomad Desk", dp: dot2 },
            ] as const
          ).map((c, i) => {
            const y = 100 + i * 74;
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    top: y,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: c.bg.bg,
                    color: c.bg.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 19,
                    fontWeight: 600,
                  }}
                >
                  {c.init}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 90,
                    top: y,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 29,
                    fontWeight: 500,
                    color: NOTION.text,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 296,
                    top: y + 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transform: `scale(${0.6 + 0.4 * c.dp})`,
                    transformOrigin: "left center",
                  }}
                >
                  <div
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 7,
                      backgroundColor: NOTION.green,
                      opacity: 0.35 + 0.65 * c.dp,
                      boxShadow: `0 0 ${10 * c.dp * (0.5 + 0.5 * pulse(6 + i))}px rgba(68,131,97,0.5)`,
                    }}
                  />
                  <span style={{ fontSize: 23, color: NOTION.green, fontWeight: 500 }}>Active</span>
                </div>
                {i === 0 ? <RowLine x={30} y={y + 60} w={CLI.w - 60} /> : null}
              </React.Fragment>
            );
          })}
          <div style={{ position: "absolute", left: 30, top: 254, fontSize: 23, color: NOTION.faint }}>
            ＋ New
          </div>
        </div>

        {/* ---------- packets flowing along awakened lines ---------- */}
        {EDGES.map((e, i) => {
          if (frame < e.on) return null;
          const born = interpolate(frame, [e.on, e.on + 14], [0, 1], opt);
          return [0, 1].map((k) => {
            const u = ((frame - e.on) * 0.011 + k / 2) % 1;
            const pos = qBezier(e.from, e.c, e.to, u);
            const endFade = u < 0.12 ? u / 0.12 : u > 0.88 ? (1 - u) / 0.12 : 1;
            return (
              <div
                key={`${i}-${k}`}
                style={{
                  position: "absolute",
                  left: pos.x - 5.5,
                  top: pos.y - 5.5,
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  backgroundColor: e.col,
                  opacity: 0.75 * born * endFade,
                  boxShadow: `0 0 10px ${e.col}55`,
                }}
              />
            );
          });
        })}

        {/* ---------- dock pulse rings ---------- */}
        {rings.map((r, i) => {
          const p = interpolate(frame, [r.t, r.t + 22], [0, 1], opt);
          if (p <= 0 || p >= 1) return null;
          const size = 120 * (0.6 + 1.2 * p);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: r.p.x - size / 2,
                top: r.p.y - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                border: `3px solid rgba(${r.col},${0.55 * (1 - p)})`,
              }}
            />
          );
        })}

        {/* ---------- the three agents ---------- */}
        {orbWrap(blue, <BlueOrb blink={blinkBlue} />, "blue")}
        {orbWrap(yellow, <YellowOrb blink={blinkYellow} />, "yellow")}
        {orbWrap(red, <RedOrb blink={blinkRed} />, "red")}

        {/* ---------- Notion cube chip — the place it all runs from ---------- */}
        <div
          style={{
            position: "absolute",
            left: CHIP.x - CHIP.size / 2,
            top: CHIP.y - CHIP.size / 2 + (1 - chipP) * -22,
            width: CHIP.size,
            height: CHIP.size,
            borderRadius: 24,
            backgroundColor: "#FFFFFF",
            border: `1.5px solid ${NOTION.border}`,
            boxShadow: "0 2px 6px rgba(15,15,15,0.08), 0 10px 30px rgba(15,15,15,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: chipP,
            transform: `scale(${0.88 + 0.12 * chipP})`,
          }}
        >
          <Img
            src={staticFile("notion/notion-logo.png")}
            style={{ width: 64, height: 64, borderRadius: 12 }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
