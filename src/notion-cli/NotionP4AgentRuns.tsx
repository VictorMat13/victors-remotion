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

export const DURATION_IN_FRAMES = 420;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 1500;
const WORLD_H = 2900;
const PAGE_BG = "#F5F4F1"; // warm off-white, per approved rydnel references

// Station 1 — deadline/timeline strip (rydnel-12 language)
const ST1 = { x: 305, y: 240, w: 850, h: 360 };
const DAY_W = 70;
const DAY0_X = ST1.x + 40 + DAY_W / 2; // center of first day slot
const TODAY_I = 6; // "4" (Aug 4)
const TODAY_X = DAY0_X + TODAY_I * DAY_W; // world x of the red line

// Station 2 — new script page card
const ST2 = { x: 495, y: 800, w: 560, h: 420 };

// Station 3 — kanban (two columns)
const KB = { y: 1400, colW: 400, leftX: 310, rightX: 750, h: 304 };
const KB_SLOT0 = KB.y + 72;
const KB_SLOT1 = KB.y + 72 + 112;
const KB_CARD_W = KB.colW - 32;

// Station 4 — brand deals + page peek
const BD = { x: 330, y: 1930, w: 440, h: 280 };
const PEEK = { x: 730, y: 1900, w: 450, h: 470 };

// Station 5 — client tasks block
const TK = { x: 400, y: 2550, w: 700, h: 260 };
const TK_ROW = 72;

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

// hold1 | mv | hold2 | mv | hold3 | mv | hold4 | mv | hold5 | pull | payoff hold
const KEY_T = [0, 74, 96, 152, 176, 224, 246, 296, 316, 356, 388, 419];
const KEY_FX = [730, 730, 775, 775, 730, 730, 770, 770, 750, 750, 750, 750];
const KEY_FY = [470, 470, 1010, 1010, 1540, 1540, 2140, 2140, 2655, 2655, 1465, 1465];
const KEY_Z = [1.12, 1.12, 1.16, 1.16, 1.15, 1.15, 1.1, 1.1, 1.16, 1.16, 0.53, 0.53];

/* ------------------------------------------------------- agent chip path --- */

type Pt = { x: number; y: number };
const S1: Pt = { x: TODAY_X, y: 180 }; // above the today marker
const S2: Pt = { x: 1105, y: 950 }; // beside the new page card
const S3: Pt = { x: 730, y: 1332 }; // above the kanban gap
const S4: Pt = { x: 450, y: 1800 }; // left of the brand-deal peek (spotlight origin)
const S5: Pt = { x: 1000, y: 2468 }; // above the tasks block
const S6: Pt = { x: 750, y: 1290 }; // payoff settle (whitespace mid-world)
const ENTRY: Pt = { x: 640, y: 40 };

const LEGS = [
  { t0: 70, t1: 92, from: S1, to: S2, bend: 90 },
  { t0: 148, t1: 170, from: S2, to: S3, bend: -80 },
  { t0: 220, t1: 242, from: S3, to: S4, bend: 110 },
  { t0: 292, t1: 312, from: S4, to: S5, bend: -120 },
  { t0: 352, t1: 382, from: S5, to: S6, bend: 130 },
];

const qBezier = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

const legCtrl = (leg: { from: Pt; to: Pt; bend: number }): Pt => {
  const mx = (leg.from.x + leg.to.x) / 2;
  const my = (leg.from.y + leg.to.y) / 2;
  const dx = leg.to.x - leg.from.x;
  const dy = leg.to.y - leg.from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return { x: mx + (-dy / len) * leg.bend, y: my + (dx / len) * leg.bend };
};

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easedOpt = { easing: ease, ...clampOpt };

const chipPos = (frame: number): Pt => {
  if (frame < LEGS[0].t0) {
    const p = interpolate(frame, [0, 16], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clampOpt,
    });
    return {
      x: ENTRY.x + (S1.x - ENTRY.x) * p,
      y: ENTRY.y + (S1.y - ENTRY.y) * p,
    };
  }
  for (let i = LEGS.length - 1; i >= 0; i--) {
    const leg = LEGS[i];
    if (frame >= leg.t0) {
      const p = interpolate(frame, [leg.t0, leg.t1], [0, 1], easedOpt);
      if (p >= 1) return leg.to;
      return qBezier(leg.from, legCtrl(leg), leg.to, p);
    }
  }
  return S1;
};

const posAlong = (u: number): Pt => {
  const i = Math.min(LEGS.length - 1, Math.max(0, Math.floor(u)));
  const t = Math.min(1, Math.max(0, u - i));
  const leg = LEGS[i];
  return qBezier(leg.from, legCtrl(leg), leg.to, t);
};

/* ---------------------------------------------------------------- atoms --- */

const Pill: React.FC<{
  color: { bg: string; text: string };
  size?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ color, size = 26, children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: color.bg,
      color: color.text,
      borderRadius: 6,
      padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.5)}px`,
      fontSize: size,
      lineHeight: 1.25,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

const Check: React.FC<{ p: number; size?: number }> = ({ p, size = 36 }) => {
  const on = p > 0.03;
  const pop = 1 + 0.22 * Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        border: on ? "none" : "2.5px solid #C9C7C3",
        backgroundColor: on ? NOTION.blue : "#FFFFFF",
        transform: `scale(${on ? pop : 1})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
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

const Avatar: React.FC<{
  initials: string;
  bg: string;
  fg: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ initials, bg, fg, size = 42, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      color: fg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.42,
      fontWeight: 600,
      flex: "none",
      ...style,
    }}
  >
    {initials}
  </div>
);

const FRAG_SHADOW =
  "0 1px 2px rgba(15,15,15,0.04), 0 10px 30px rgba(15,15,15,0.07)";

const SectionTitle: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
}> = ({ x, y, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontSize: 40,
      fontWeight: 800,
      color: NOTION.text,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

// rydnel-02 style timeline/kanban task pill
const TaskPill: React.FC<{
  x: number;
  y: number;
  icon: string;
  title: string;
  pill: { bg: string; text: string };
  pillText: string;
  selectedP?: number;
  glowA?: number;
}> = ({ x, y, icon, title, pill, pillText, selectedP = 0, glowA = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      height: 56,
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#FFFFFF",
      border:
        selectedP > 0.01
          ? `2.5px solid rgba(35,131,226,${Math.min(1, selectedP)})`
          : `1.5px solid ${NOTION.border}`,
      borderRadius: 12,
      padding: "0 18px",
      boxShadow: `0 3px 10px rgba(15,15,15,0.06), 0 0 ${
        14 * selectedP + 22 * glowA
      }px rgba(35,131,226,${0.22 * selectedP + 0.3 * glowA})`,
      transform: `scale(${1 + 0.03 * Math.sin(Math.min(1, selectedP) * Math.PI)})`,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ fontSize: 27 }}>{icon}</span>
    <span style={{ fontSize: 31, fontWeight: 500, color: NOTION.text }}>
      {title}
    </span>
    <Pill color={pill} size={28}>
      {pillText}
    </Pill>
  </div>
);

// kanban static card (title + muted date, rydnel-02 style)
const KCard: React.FC<{
  x: number;
  y: number;
  title: string;
  date: string;
}> = ({ x, y, title, date }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: KB_CARD_W,
      height: 100,
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      border: `1px solid ${NOTION.borderSoft}`,
      boxShadow: "0 2px 8px rgba(15,15,15,0.05)",
      padding: "14px 18px",
    }}
  >
    <div style={{ fontSize: 30, fontWeight: 500, color: NOTION.text, whiteSpace: "nowrap" }}>
      {title}
    </div>
    <div
      style={{
        fontSize: 24,
        color: NOTION.faint,
        marginTop: 8,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {date}
    </div>
  </div>
);

const CountFlip: React.FC<{ from: string; to: string; p: number }> = ({
  from,
  to,
  p,
}) => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      width: 22,
      height: 30,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    <span
      style={{
        position: "absolute",
        left: 0,
        top: -8 * p,
        opacity: 1 - p,
      }}
    >
      {from}
    </span>
    <span
      style={{
        position: "absolute",
        left: 0,
        top: 8 * (1 - p),
        opacity: p,
      }}
    >
      {to}
    </span>
  </span>
);

/* ---------------------------------------------------------- composition --- */

export const NotionP4AgentRuns: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, easedOpt);
  const fy = interpolate(frame, KEY_T, KEY_FY, easedOpt);
  const z = interpolate(frame, KEY_T, KEY_Z, easedOpt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy
  ) =>
    spring({ frame: frame - t0, fps, config, durationInFrames: 34 });

  /* ---- beat 1 (hold 0–74): today marker + due pill selected ---- */
  const todayPopP = frame < 10 ? 0 : spr(10, SPRINGS.bouncy);
  const lineP = interpolate(frame, [14, 30], [0, 1], easedOpt);
  const dueSelP = frame < 36 ? 0 : spr(36, SPRINGS.smooth);

  /* ---- beat 2 (hold 96–152): page card + typewriter ---- */
  const cardInP = frame < 100 ? 0 : spr(100);
  const iconP = frame < 106 ? 0 : spr(106, SPRINGS.bouncy);
  const SCRIPT_TITLE = "Reel 12 — Script";
  const typedChars = Math.floor(
    interpolate(frame, [108, 136], [0, SCRIPT_TITLE.length], clampOpt)
  );
  const typing = frame >= 108 && typedChars < SCRIPT_TITLE.length;
  const caretOn = typing && frame % 16 < 9;

  /* ---- beat 3 (hold 176–224): kanban card flight + pill flip + tick ---- */
  const flightP = interpolate(frame, [186, 202], [0, 1], easedOpt);
  const landP = frame < 202 ? 0 : spr(202, SPRINGS.bouncy);
  const pillFlipP = interpolate(frame, [194, 201], [0, 1], easedOpt);
  const kTickP = frame < 210 ? 0 : spr(210);
  const leftCountP = interpolate(frame, [190, 198], [0, 1], easedOpt);
  const rightCountP = interpolate(frame, [198, 206], [0, 1], easedOpt);
  const rightSlideP = interpolate(frame, [188, 202], [0, 1], easedOpt);
  const leftSlideP = interpolate(frame, [190, 204], [0, 1], easedOpt);

  /* ---- beat 4 (hold 246–296): spotlight + peek + excerpt pull ---- */
  const darkP =
    interpolate(frame, [248, 258], [0, 1], easedOpt) *
    interpolate(frame, [286, 298], [1, 0], easedOpt);
  const peekP = interpolate(frame, [250, 266], [0, 1], easedOpt);
  const hl1P = interpolate(frame, [266, 276], [0, 1], easedOpt);
  const hl2P = interpolate(frame, [272, 282], [0, 1], easedOpt);
  const ghost1P = interpolate(frame, [278, 290], [0, 1], easedOpt);
  const ghost2P = interpolate(frame, [283, 295], [0, 1], easedOpt);

  /* ---- beat 5 (hold 316–356): ticks + avatar pulse ---- */
  const eTick = [
    frame < 322 ? 0 : spr(322),
    frame < 333 ? 0 : spr(333),
    frame < 344 ? 0 : spr(344),
  ];
  const avatarPulseP = interpolate(frame, [346, 366], [0, 1], clampOpt);

  /* ---- payoff glows ---- */
  const glow = (delay: number, phase: number) => {
    const g = interpolate(frame, [358 + delay, 378 + delay], [0, 1], clampOpt);
    return g * (0.72 + 0.28 * Math.sin((frame - 378) / 8 + phase));
  };

  /* ---- agent chip ---- */
  const chip = chipPos(frame);
  const chipBobY = 4 * Math.sin(frame / 11);
  const chipScale = interpolate(frame, [352, 386], [1, 1.8], easedOpt);
  const CHIP = 84;

  const rings = [
    { t: 56, p: S1 },
    { t: 146, p: S2 },
    { t: 216, p: S3 },
    { t: 290, p: S4 },
    { t: 348, p: S5 },
  ];

  // kanban mover position
  const moverStart: Pt = { x: KB.leftX + 16, y: KB_SLOT0 };
  const moverEnd: Pt = { x: KB.rightX + 16, y: KB_SLOT0 };
  const moverPos = qBezier(
    moverStart,
    { x: (moverStart.x + moverEnd.x) / 2, y: KB.y - 60 },
    moverEnd,
    flightP
  );
  const moverRot = -6 * Math.sin(flightP * Math.PI);
  const moverSquash = 1 - 0.07 * Math.sin(Math.min(1, landP) * Math.PI);

  const days = ["29", "30", "31", "1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <AbsoluteFill style={{ backgroundColor: NOTION.bg, fontFamily: FONT_SANS }}>
      {/* opaque warm off-white paper, full-bleed frame 0 → last */}
      <AbsoluteFill style={{ backgroundColor: PAGE_BG }} />

      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------- workspace identity chip ---------- */}
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 96,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Img
            src={staticFile("notion/notion-logo.png")}
            style={{ width: 42, height: 42, borderRadius: 9 }}
          />
          <span style={{ fontSize: 30, color: NOTION.textSoft, fontWeight: 600 }}>
            Liam&#8217;s Notion
          </span>
        </div>

        {/* ---------- agent trail (under fragments' shadows is fine) ---------- */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {LEGS.map((leg, i) => {
            const p = interpolate(frame, [leg.t0, leg.t1], [0, 1], easedOpt);
            if (p <= 0) return null;
            const c = legCtrl(leg);
            const op = interpolate(frame, [leg.t1, leg.t1 + 46], [0.4, 0.16], clampOpt);
            return (
              <path
                key={i}
                d={`M ${leg.from.x} ${leg.from.y} Q ${c.x} ${c.y} ${leg.to.x} ${leg.to.y}`}
                stroke="#D97757"
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={op}
              />
            );
          })}
        </svg>

        {/* ================= STATION 1 — deadline strip ================= */}
        <SectionTitle x={330} y={172}>
          Content&nbsp; 📌
        </SectionTitle>
        <div
          style={{
            position: "absolute",
            left: ST1.x,
            top: ST1.y,
            width: ST1.w,
            height: ST1.h,
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            border: `1.5px solid ${NOTION.border}`,
            boxShadow: FRAG_SHADOW,
            overflow: "hidden",
          }}
        >
          {/* weekend band (Aug 1–2) */}
          <div
            style={{
              position: "absolute",
              left: 40 + 3 * DAY_W,
              top: 66,
              width: DAY_W * 2,
              height: ST1.h - 66,
              backgroundColor: "rgba(235,87,87,0.05)",
            }}
          />
          {/* month header */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 24,
              fontSize: 27,
              fontWeight: 700,
              color: NOTION.textSoft,
            }}
          >
            ≫&nbsp; August 2026
          </div>
          {/* day numbers */}
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 40 + i * DAY_W,
                top: 78,
                width: DAY_W,
                textAlign: "center",
                fontSize: 24,
                color: NOTION.faint,
                fontVariantNumeric: "tabular-nums",
                opacity: i === TODAY_I ? 1 - Math.min(1, todayPopP * 1.6) : 1,
              }}
            >
              {d}
            </div>
          ))}
          {/* today circle */}
          <div
            style={{
              position: "absolute",
              left: 40 + TODAY_I * DAY_W + DAY_W / 2 - 23,
              top: 68,
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: NOTION.red,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 25,
              fontWeight: 700,
              transform: `scale(${todayPopP})`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            4
          </div>
          {/* red now-line */}
          <div
            style={{
              position: "absolute",
              left: 40 + TODAY_I * DAY_W + DAY_W / 2 - 1.5,
              top: 118,
              width: 3,
              height: (ST1.h - 140) * lineP,
              backgroundColor: NOTION.red,
              borderRadius: 2,
              opacity: 0.85,
            }}
          />
        </div>
        {/* task pills over the strip (world coords) */}
        <TaskPill
          x={ST1.x + 48}
          y={ST1.y + 148}
          icon="🎬"
          title="Reel 10 — Desk tour"
          pill={PILL.green}
          pillText="Done"
        />
        <TaskPill
          x={ST1.x + 96}
          y={ST1.y + 212}
          icon="✂️"
          title="Reel 11 — CLI setup"
          pill={PILL.yellow}
          pillText="Editing"
        />
        <TaskPill
          x={ST1.x + 122}
          y={ST1.y + 276}
          icon="📄"
          title="Reel 12 — Workflow"
          pill={PILL.gray}
          pillText="Not started"
          selectedP={dueSelP}
          glowA={glow(0, 0)}
        />
        {/* ================= STATION 2 — new script page ================= */}
        <div
          style={{
            position: "absolute",
            left: ST2.x,
            top: ST2.y,
            width: ST2.w,
            height: ST2.h,
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            border: `1.5px solid ${NOTION.border}`,
            boxShadow: `${FRAG_SHADOW}, 0 0 ${28 * glow(6, 1.2)}px rgba(68,131,97,${
              0.3 * glow(6, 1.2)
            })`,
            opacity: cardInP,
            transform: `scale(${0.86 + 0.14 * cardInP}) translateY(${
              24 * (1 - cardInP)
            }px)`,
            transformOrigin: "center 40%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 30,
              fontSize: 24,
              color: NOTION.faint,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>📝</span> Scripts&nbsp; /
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 82,
              fontSize: 52,
              transform: `scale(${iconP})`,
              transformOrigin: "left center",
            }}
          >
            📄
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 162,
              display: "flex",
              alignItems: "center",
              fontSize: 42,
              fontWeight: 800,
              color: NOTION.text,
              whiteSpace: "nowrap",
            }}
          >
            {SCRIPT_TITLE.slice(0, typedChars)}
            {caretOn ? (
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 44,
                  backgroundColor: NOTION.text,
                  marginLeft: 4,
                }}
              />
            ) : null}
          </div>
          {/* abstracted content lines */}
          {[
            { y: 252, w: 430, t: 136 },
            { y: 294, w: 470, t: 141 },
            { y: 336, w: 310, t: 146 },
          ].map((l, i) => {
            const p = interpolate(frame, [l.t, l.t + 9], [0, 1], easedOpt);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 40,
                  top: l.y,
                  width: l.w * p,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#ECEBE9",
                  opacity: p,
                }}
              />
            );
          })}
        </div>

        {/* ================= STATION 3 — kanban flip ================= */}
        <SectionTitle x={330} y={1330}>
          Production&nbsp; 🎬
        </SectionTitle>
        {/* left column — Not started */}
        <div
          style={{
            position: "absolute",
            left: KB.leftX,
            top: KB.y,
            width: KB.colW,
            height: KB.h,
            backgroundColor: "#ECECE9",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#E0E0DD",
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 27,
              fontWeight: 600,
              color: PILL.gray.text,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#9B9A97",
              }}
            />
            Not started&nbsp;
            <CountFlip from="2" to="1" p={leftCountP} />
          </div>
        </div>
        {/* right column — Filming */}
        <div
          style={{
            position: "absolute",
            left: KB.rightX,
            top: KB.y,
            width: KB.colW,
            height: KB.h,
            backgroundColor: "#E7EFF6",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: PILL.blue.bg,
              borderRadius: 8,
              padding: "6px 16px",
              fontSize: 27,
              fontWeight: 600,
              color: PILL.blue.text,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: NOTION.blue,
              }}
            />
            Filming&nbsp;
            <CountFlip from="1" to="2" p={rightCountP} />
          </div>
        </div>
        {/* static cards */}
        <KCard
          x={KB.leftX + 16}
          y={KB_SLOT1 - (KB_SLOT1 - KB_SLOT0) * leftSlideP}
          title="🎤 Reel 13 — Q&A"
          date="Aug 9"
        />
        <KCard
          x={KB.rightX + 16}
          y={KB_SLOT0 + (KB_SLOT1 - KB_SLOT0) * rightSlideP}
          title="✂️ Reel 11 — CLI setup"
          date="Aug 1"
        />
        {/* mover card */}
        <div
          style={{
            position: "absolute",
            left: moverPos.x,
            top: moverPos.y,
            width: KB_CARD_W,
            height: 100,
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            border: `1px solid ${NOTION.borderSoft}`,
            boxShadow: `0 ${4 + 14 * Math.sin(flightP * Math.PI)}px ${
              10 + 22 * Math.sin(flightP * Math.PI)
            }px rgba(15,15,15,${0.06 + 0.08 * Math.sin(flightP * Math.PI)}), 0 0 ${
              24 * glow(3, 2.1)
            }px rgba(35,131,226,${0.32 * glow(3, 2.1)})`,
            padding: "12px 18px",
            transform: `rotate(${moverRot}deg) scaleY(${moverSquash})`,
            transformOrigin: "center bottom",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: NOTION.text,
              whiteSpace: "nowrap",
            }}
          >
            📄 Reel 12 — Workflow
          </div>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 54,
              height: 36,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ position: "absolute", opacity: 1 - pillFlipP }}>
              <Pill color={PILL.gray} size={26}>
                Not started
              </Pill>
            </span>
            <span
              style={{
                position: "absolute",
                opacity: pillFlipP,
                transform: `scale(${0.5 + 0.5 * pillFlipP})`,
                transformOrigin: "left center",
              }}
            >
              <Pill color={PILL.blue} size={26}>
                Filming
              </Pill>
            </span>
          </div>
          <div style={{ position: "absolute", right: 16, top: 52 }}>
            <Check p={kTickP} size={34} />
          </div>
        </div>

        {/* ================= STATION 4 — brand deals + spotlight peek ===== */}
        <SectionTitle x={330} y={1862}>
          Brand Deals&nbsp; 🤝
        </SectionTitle>
        <div
          style={{
            position: "absolute",
            left: BD.x,
            top: BD.y,
            width: BD.w,
            height: BD.h,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: `1.5px solid ${NOTION.border}`,
            boxShadow: FRAG_SHADOW,
          }}
        >
          {(
            [
              { name: "Arc Labs — Aug reel", pill: PILL.blue, stage: "Drafting" },
              { name: "Nomad Desk — Q3", pill: PILL.green, stage: "Live" },
              { name: "Fluent — Sept push", pill: PILL.orange, stage: "Talks" },
            ] as const
          ).map((r, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: 26 + i * 78,
                  fontSize: 29,
                  fontWeight: 500,
                  color: NOTION.text,
                  whiteSpace: "nowrap",
                }}
              >
                📄 {r.name}
              </div>
              <div style={{ position: "absolute", left: 60, top: 62 + i * 78 }}>
                <Pill color={r.pill} size={23}>
                  {r.stage}
                </Pill>
              </div>
              {i < 2 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    top: 100 + i * 78,
                    width: BD.w - 56,
                    height: 1.5,
                    backgroundColor: NOTION.border,
                  }}
                />
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {/* dark navy spotlight moment (short, never near-black full-frame) */}
        <div
          style={{
            position: "absolute",
            left: -700,
            top: -700,
            width: WORLD_W + 1400,
            height: WORLD_H + 1400,
            backgroundColor: "#171D3E",
            opacity: 0.92 * darkP,
            pointerEvents: "none",
          }}
        />
        {/* spotlight cone from the chip to the peek */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <polygon
            points={`${S4.x + 20},${S4.y + 14} ${PEEK.x + 8},${PEEK.y + 40} ${
              PEEK.x + 8
            },${PEEK.y + PEEK.h - 30}`}
            fill="rgba(240,205,100,0.30)"
            opacity={darkP}
            style={{ filter: "blur(5px)" }}
          />
          <polygon
            points={`${S4.x + 20},${S4.y + 14} ${PEEK.x + 60},${PEEK.y - 60} ${
              PEEK.x + 60
            },${PEEK.y + PEEK.h + 60}`}
            fill="rgba(240,205,100,0.12)"
            opacity={darkP}
            style={{ filter: "blur(14px)" }}
          />
        </svg>

        {/* page peek — above the dark, lit by the spotlight */}
        <div
          style={{
            position: "absolute",
            left: PEEK.x,
            top: PEEK.y,
            width: PEEK.w,
            height: PEEK.h,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            border: `1.5px solid ${NOTION.border}`,
            boxShadow: `${FRAG_SHADOW}, 0 0 ${60 * darkP}px rgba(250,222,120,${
              0.4 * darkP
            })`,
            transform: `translateX(${(1 - peekP) * 380}px)`,
            opacity: Math.min(1, peekP * 2.2),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 32,
              top: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              color: NOTION.faint,
            }}
          >
            <span>⇤</span> Open as page
          </div>
          <div
            style={{
              position: "absolute",
              left: 32,
              top: 66,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 33,
              fontWeight: 700,
              color: NOTION.text,
              whiteSpace: "nowrap",
            }}
          >
            <span>🤝</span> Arc Labs — Aug reel
          </div>
          {(
            [
              { label: "Stage", pill: PILL.blue, value: "Drafting" },
              { label: "Rate", pill: null, value: "$4,500" },
              { label: "Usage", pill: null, value: "30 days" },
            ] as const
          ).map((p, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  top: 140 + i * 52,
                  fontSize: 25,
                  color: NOTION.faint,
                }}
              >
                {p.label}
              </div>
              {p.pill ? (
                <div style={{ position: "absolute", left: 172, top: 132 + i * 52 }}>
                  <Pill color={p.pill} size={25}>
                    {p.value}
                  </Pill>
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    left: 172,
                    top: 140 + i * 52,
                    fontSize: 30,
                    color: NOTION.textSoft,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {p.value}
                </div>
              )}
            </React.Fragment>
          ))}
          <div
            style={{
              position: "absolute",
              left: 32,
              top: 302,
              width: PEEK.w - 64,
              height: 1.5,
              backgroundColor: NOTION.border,
            }}
          />
          {(
            [
              { text: "Arc mention in first 5s", p: hl1P, y: 326 },
              { text: "Link in bio for 48h", p: hl2P, y: 382 },
            ] as const
          ).map((n, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 32,
                top: n.y,
                height: 44,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 31,
                color: NOTION.textSoft,
              }}
            >
              <span style={{ color: NOTION.faint, fontSize: 24 }}>•</span>
              <span style={{ position: "relative", whiteSpace: "nowrap" }}>
                <span
                  style={{
                    position: "absolute",
                    left: -8,
                    top: -4,
                    bottom: -4,
                    width: `calc(${n.p * 100}% + 16px)`,
                    backgroundColor: PILL.yellow.bg,
                    borderRadius: 6,
                  }}
                />
                <span style={{ position: "relative" }}>{n.text}</span>
              </span>
            </div>
          ))}
        </div>

        {/* excerpt ghosts flying to the chip */}
        {(
          [
            { p: ghost1P, from: { x: 900, y: 2248 }, text: "Arc mention in first 5s" },
            { p: ghost2P, from: { x: 880, y: 2304 }, text: "Link in bio for 48h" },
          ] as const
        ).map((g, i) => {
          if (g.p <= 0 || g.p >= 1) return null;
          const to = { x: S4.x + 14, y: S4.y + 12 };
          const c = { x: (g.from.x + to.x) / 2, y: Math.min(g.from.y, to.y) - 140 };
          const pos = qBezier(g.from, c, to, ease(g.p));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%,-50%) scale(${1 - 0.62 * g.p})`,
                opacity:
                  Math.min(1, g.p * 5) * (g.p < 0.72 ? 1 : (1 - g.p) / 0.28),
                backgroundColor: PILL.yellow.bg,
                color: PILL.yellow.text,
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 27,
                fontWeight: 500,
                whiteSpace: "nowrap",
                boxShadow: "0 6px 18px rgba(15,15,15,0.18)",
              }}
            >
              {g.text}
            </div>
          );
        })}

        {/* ================= STATION 5 — client tasks ================= */}
        {/* wrapper fades it into the navy during the spotlight beat */}
        <div style={{ opacity: 1 - 0.85 * darkP }}>
        <SectionTitle x={TK.x} y={2484}>
          Client Tasks&nbsp; 📌
        </SectionTitle>
        <div
          style={{
            position: "absolute",
            left: TK.x,
            top: TK.y,
            width: TK.w,
            height: TK.h,
            backgroundColor: "#FAF3DD",
            borderRadius: 16,
            border: "1.5px solid rgba(0,0,0,0.05)",
            boxShadow: FRAG_SHADOW,
          }}
        />
        {(
          [
            { text: "Send invoice — Arc Labs", initials: "AL", bg: PILL.blue.bg, fg: PILL.blue.text },
            { text: "Deliver raw files — Nomad", initials: "MK", bg: PILL.purple.bg, fg: PILL.purple.text },
            { text: "Review edit notes", initials: "JS", bg: PILL.orange.bg, fg: PILL.orange.text },
          ] as const
        ).map((r, i) => {
          const y = TK.y + 24 + i * TK_ROW;
          const p = eTick[i];
          const done = p > 0.4;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: TK.x + 30,
                  top: y + (TK_ROW - 36) / 2 - 6,
                }}
              >
                <div
                  style={{
                    borderRadius: 7,
                    boxShadow: `0 0 ${18 * glow(9 + i * 2, 3 + i)}px rgba(68,131,97,${
                      0.35 * glow(9 + i * 2, 3 + i)
                    })`,
                  }}
                >
                  <Check p={p} />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: TK.x + 86,
                  top: y - 6,
                  height: TK_ROW,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 31,
                  fontWeight: 500,
                  color: done ? NOTION.faint : NOTION.text,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ position: "relative" }}>
                  {r.text}
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      height: 2.5,
                      width: `${Math.min(1, p) * 100}%`,
                      backgroundColor: NOTION.faint,
                    }}
                  />
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: TK.x + TK.w - 74,
                  top: y + (TK_ROW - 42) / 2 - 6,
                }}
              >
                {i === 2 && avatarPulseP > 0 && avatarPulseP < 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 21 - 21 * (1 + avatarPulseP * 1.1),
                      top: 21 - 21 * (1 + avatarPulseP * 1.1),
                      width: 42 * (1 + avatarPulseP * 1.1),
                      height: 42 * (1 + avatarPulseP * 1.1),
                      borderRadius: "50%",
                      border: `3px solid rgba(35,131,226,${0.6 * (1 - avatarPulseP)})`,
                    }}
                  />
                ) : null}
                <Avatar
                  initials={r.initials}
                  bg={r.bg}
                  fg={r.fg}
                  style={{
                    transform:
                      i === 2
                        ? `scale(${1 + 0.14 * Math.sin(Math.min(1, avatarPulseP) * Math.PI)})`
                        : undefined,
                  }}
                />
              </div>
            </React.Fragment>
          );
        })}
        </div>

        {/* ---------- payoff packets drifting along the trail ---------- */}
        {frame >= 368
          ? [0, 1, 2].map((k) => {
              const u = (((frame - 368) * 0.009 + k / 3) % 1) * 5;
              const pos = posAlong(u);
              const op = interpolate(frame, [368, 382], [0, 0.55], clampOpt);
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: pos.x - 6,
                    top: pos.y - 6,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#D97757",
                    opacity: op,
                    boxShadow: "0 0 10px rgba(217,119,87,0.5)",
                  }}
                />
              );
            })
          : null}

        {/* ---------- action-complete pulse rings ---------- */}
        {rings.map((r, i) => {
          const p = interpolate(frame, [r.t, r.t + 22], [0, 1], clampOpt);
          if (p <= 0 || p >= 1) return null;
          const size = CHIP * (0.5 + 1.3 * p);
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
                border: `3px solid rgba(217,119,87,${0.65 * (1 - p)})`,
              }}
            />
          );
        })}

        {/* ---------- agent chip (topmost) ---------- */}
        <div
          style={{
            position: "absolute",
            left: chip.x,
            top: chip.y + chipBobY,
            transform: `translate(-50%,-50%) scale(${chipScale})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -CHIP / 2 - 48,
              top: -CHIP / 2 - 48,
              width: CHIP + 96,
              height: CHIP + 96,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(217,119,87,0.22) 0%, rgba(217,119,87,0.0) 68%)",
            }}
          />
          {frame >= 390
            ? (() => {
                const lp = ((frame - 390) % 56) / 56;
                const s = CHIP * (0.95 + 0.85 * lp);
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: -s / 2,
                      top: -s / 2,
                      width: s,
                      height: s,
                      borderRadius: "50%",
                      border: `2.5px solid rgba(217,119,87,${0.4 * (1 - lp)})`,
                    }}
                  />
                );
              })()
            : null}
          <div
            style={{
              position: "absolute",
              left: -CHIP / 2,
              top: -CHIP / 2,
              width: CHIP,
              height: CHIP,
              borderRadius: 22,
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${NOTION.border}`,
              boxShadow:
                "0 2px 6px rgba(15,15,15,0.10), 0 10px 28px rgba(217,119,87,0.30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("openseo/logos/claude-color.svg")}
              style={{ width: 50, height: 50 }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
