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
import { CLI, FONT_MONO, FONT_SANS, NOTION, PILL, SPRINGS } from "./theme";

// ============================================================================
// NotionP3CliUnlock — "the real unlock is Notion's new CLI"
// Beat 1 (0–~108): tight on a dark terminal card on white; real install +
//   login commands type out and succeed.
// Beat 2 (~108–188): camera pulls back, terminal recedes to a node; Claude
//   chip (left) + floating Notion database cards (right); a blue line draws
//   Claude → CLI → databases, packets travel, green pulse on landing.
// Land (188–210): near-still hold, packets drifting.
// ============================================================================

export const DURATION_IN_FRAMES = 210;

// ---------------------------------------------------------------------------
// World constants (final camera: fx=1080, fy=1080, z=1 → screen = world - 540)
// ---------------------------------------------------------------------------
const VIEW = 1080;
const WORLD = 2160;

const TERM = { x: 520, y: 750, w: 940, h: 660 }; // full-size terminal card
const TERM_CX = TERM.x + TERM.w / 2; // 990
const TERM_CY = TERM.y + TERM.h / 2; // 1080
const NODE_SCALE = 0.3;

const CHIP = { cx: 690, cy: 1080, size: 170 };

const CARD_X = 1261; // left edge of db cards
const CARD_W = 290;
const CARD_H = 140;
const CARD_YS = [860, 1080, 1300]; // centers

// Connection path timing
const LINE_STARTS = [144, 150, 156];
const LINE_DRAW = 24;
const LAND_AT = LINE_STARTS.map((s) => s + LINE_DRAW); // 168, 174, 180

const TERMINAL_GREEN = "#4ADE80";

// ---------------------------------------------------------------------------
// Connection paths: chip edge → (under the node) → fan into each db card.
// Sampled at module level for packet positions (arc-length uniform).
// ---------------------------------------------------------------------------
type Pt = { x: number; y: number };

const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
};

const PATH_START: Pt = { x: 775, y: 1080 }; // right edge of Claude chip
const BRANCH_AT: Pt = { x: 1170, y: 1080 }; // just right of the node
const PATH_END_X = 1258; // just before card left edge

const pathD = (y: number) =>
  `M ${PATH_START.x} ${PATH_START.y} L ${BRANCH_AT.x} ${BRANCH_AT.y} C 1215 1080, 1220 ${y}, ${PATH_END_X} ${y}`;

type PathTable = { pts: Pt[]; cum: number[]; total: number };

const buildTable = (y: number): PathTable => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    pts.push({
      x: PATH_START.x + ((BRANCH_AT.x - PATH_START.x) * i) / 40,
      y: 1080,
    });
  }
  const p0 = BRANCH_AT;
  const p1 = { x: 1215, y: 1080 };
  const p2 = { x: 1220, y };
  const p3 = { x: PATH_END_X, y };
  for (let i = 1; i <= 100; i++) {
    pts.push(cubicAt(p0, p1, p2, p3, i / 100));
  }
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return { pts, cum, total: cum[cum.length - 1] };
};

const PATH_TABLES = CARD_YS.map((y) => buildTable(y));

const pointAt = (tab: PathTable, t: number): Pt => {
  const target = Math.max(0, Math.min(1, t)) * tab.total;
  for (let i = 1; i < tab.cum.length; i++) {
    if (tab.cum[i] >= target) {
      const seg = tab.cum[i] - tab.cum[i - 1];
      const f = seg === 0 ? 0 : (target - tab.cum[i - 1]) / seg;
      return {
        x: tab.pts[i - 1].x + (tab.pts[i].x - tab.pts[i - 1].x) * f,
        y: tab.pts[i - 1].y + (tab.pts[i].y - tab.pts[i - 1].y) * f,
      };
    }
  }
  return tab.pts[tab.pts.length - 1];
};

// ---------------------------------------------------------------------------
// Terminal script (REAL Notion CLI commands from theme — do not invent)
// ---------------------------------------------------------------------------
type Row =
  | { kind: "cmd"; show: number; typeStart: number; text: string }
  | { kind: "out"; show: number; text: string }
  | { kind: "bar"; show: number }
  | { kind: "ok"; show: number; text: string }
  | { kind: "prompt"; show: number };

const ROWS: Row[] = [
  { kind: "cmd", show: 0, typeStart: 6, text: CLI.install }, // 33 chars → f6..39
  { kind: "out", show: 43, text: "installing notion cli..." },
  { kind: "bar", show: 48 },
  { kind: "ok", show: 65, text: "ntn installed" },
  { kind: "cmd", show: 70, typeStart: 72, text: CLI.login }, // 9 chars → f72..81
  { kind: "out", show: 86, text: "opening browser..." },
  { kind: "ok", show: 92, text: "Connected to Liam's Notion" },
  { kind: "prompt", show: 98 },
];

// ---------------------------------------------------------------------------
// Database cards (floating-fragment style: tinted pill header + one row)
// ---------------------------------------------------------------------------
const DB_CARDS = [
  { pill: PILL.blue, title: "📊 Projects", row: "Q3 Roadmap" },
  { pill: PILL.orange, title: "🗓 Content Calendar", row: "Reel — Notion CLI" },
  { pill: PILL.green, title: "🤝 CRM", row: "Acme Corp" },
];

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const Cursor: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: "inline-block",
      width: "0.58em",
      height: "1.02em",
      transform: "translateY(0.15em)",
      backgroundColor: "#F2F4F8",
      opacity: on ? 1 : 0,
      marginLeft: 2,
    }}
  />
);

const RingPulse: React.FC<{
  frame: number;
  at: number;
  radius: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ frame, at, radius, color, style }) => {
  const p = interpolate(frame, [at, at + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: -6 - 16 * p,
        borderRadius: radius + 6 + 16 * p,
        border: `3px solid ${color}`,
        opacity: 0.75 * (1 - p),
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Terminal card
// ---------------------------------------------------------------------------
const TerminalCard: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;

  // Recede to node during the pull-back
  const s = interpolate(f, [108, 140], [1, NODE_SCALE], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Green success glow when login lands
  const glow = interpolate(f, [92, 98, 118], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Which row hosts the cursor
  const lastIdx = ROWS.reduce((acc, r, i) => (f >= r.show ? i : acc), 0);
  const blinkOn = f % 26 < 15;

  const barFill = Math.round(
    interpolate(f, [48, 62], [0, 14], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const barPct = Math.round(
    interpolate(f, [48, 62], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        position: "absolute",
        left: TERM.x,
        top: TERM.y,
        width: TERM.w,
        height: TERM.h,
        transform: `scale(${s})`,
        transformOrigin: "50% 50%",
        borderRadius: 18,
        backgroundColor: "#17171B",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: `0 0 0 ${6 * glow}px rgba(74,222,128,0.16), 0 34px 90px rgba(15,23,42,0.28), 0 6px 20px rgba(15,23,42,0.12)`,
        overflow: "hidden",
      }}
    >
      {/* title bar */}
      <div
        style={{
          height: 60,
          backgroundColor: "#232327",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 11 }}>
          <div style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: "#FF5F57" }} />
          <div style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: "#FEBC2E" }} />
          <div style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: "#28C840" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 21,
            color: "#8B8B90",
          }}
        >
          ntn — zsh
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "28px 40px", fontFamily: FONT_MONO, fontSize: 33 }}>
        {ROWS.map((row, i) => {
          if (f < row.show) return null;
          // cmd/prompt rows appear instantly (typing + cursor carry the motion)
          const appear =
            row.kind === "cmd" || row.kind === "prompt"
              ? 1
              : interpolate(f, [row.show, row.show + 4], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
          const hostsCursor = i === lastIdx;

          let content: React.ReactNode = null;
          if (row.kind === "cmd") {
            const typed = row.text.slice(
              0,
              Math.max(0, Math.min(row.text.length, f - row.typeStart))
            );
            const typing = f >= row.typeStart && f < row.typeStart + row.text.length;
            content = (
              <>
                <span style={{ color: "#6E7681" }}>~ $ </span>
                <span style={{ color: "#F2F4F8" }}>{typed}</span>
                {hostsCursor ? <Cursor on={typing ? true : blinkOn} /> : null}
              </>
            );
          } else if (row.kind === "out") {
            content = <span style={{ color: "#9AA4B2" }}>{"  " + row.text}</span>;
          } else if (row.kind === "bar") {
            content = (
              <>
                <span style={{ color: "#9AA4B2" }}>{"  "}</span>
                <span style={{ color: TERMINAL_GREEN }}>{"█".repeat(barFill)}</span>
                <span style={{ color: "#3A3F46" }}>{"░".repeat(14 - barFill)}</span>
                <span style={{ color: "#9AA4B2" }}>{` ${barPct}%`}</span>
              </>
            );
          } else if (row.kind === "ok") {
            content = <span style={{ color: TERMINAL_GREEN }}>{"✓ " + row.text}</span>;
          } else {
            content = (
              <>
                <span style={{ color: "#6E7681" }}>~ $ </span>
                {hostsCursor ? <Cursor on={blinkOn} /> : null}
              </>
            );
          }

          return (
            <div
              key={i}
              style={{
                height: 54,
                lineHeight: "54px",
                whiteSpace: "pre",
                opacity: appear,
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const NotionP3CliUnlock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // Camera — one shared keyframe timeline
  const KEY_T = [0, 14, 44, 96, 108, 134, 186, 200, 209];
  const fx = interpolate(
    frame,
    KEY_T,
    [790, 810, 940, 940, 940, 1080, 1080, 1080, 1080],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [940, 950, 990, 1040, 1040, 1080, 1080, 1080, 1080],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.5, 1.42, 1.24, 1.24, 1.24, 1.0, 1.0, 1.008, 1.01],
    { easing: ease, extrapolateRight: "clamp" }
  );

  // Claude chip entrance — after the receding terminal has cleared its spot
  const chipIn = spring({
    frame: frame - 130,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 30,
  });
  const chipOpacity = interpolate(frame, [130, 136], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Node label
  const nodeLabelIn = interpolate(frame, [140, 152], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: NOTION.bg }}>
      <div
        style={{
          position: "absolute",
          width: WORLD,
          height: WORLD,
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ------- connection lines + packets (behind node & cards) ------- */}
        <svg
          width={WORLD}
          height={WORLD}
          viewBox={`0 0 ${WORLD} ${WORLD}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {CARD_YS.map((y, i) => {
            const p = interpolate(
              frame,
              [LINE_STARTS[i], LINE_STARTS[i] + LINE_DRAW],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.cubic),
              }
            );
            if (p <= 0.005) return null;
            return (
              <path
                key={`line-${i}`}
                d={pathD(y)}
                pathLength={1}
                fill="none"
                stroke={NOTION.blue}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={1 - p}
                opacity={0.9}
              />
            );
          })}

          {/* packets travel after each path completes; keep drifting to end */}
          {PATH_TABLES.map((tab, i) => {
            const born = LAND_AT[i];
            if (frame < born) return null;
            return [0, 0.5].map((phase, k) => {
              const t = ((frame - born) / 56 + phase) % 1;
              const pt = pointAt(tab, t);
              const fade =
                interpolate(t, [0, 0.07], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) *
                interpolate(t, [0.9, 0.97], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
              return (
                <g key={`pk-${i}-${k}`} opacity={fade}>
                  <circle cx={pt.x} cy={pt.y} r={13} fill={NOTION.blue} opacity={0.18} />
                  <circle cx={pt.x} cy={pt.y} r={7} fill={NOTION.blue} />
                </g>
              );
            });
          })}
        </svg>

        {/* ------------------------- terminal ---------------------------- */}
        <TerminalCard frame={frame} />

        {/* node label appears once the terminal has become a node */}
        <div
          style={{
            position: "absolute",
            left: TERM_CX - 100,
            top: TERM_CY + (TERM.h * NODE_SCALE) / 2 + 18,
            width: 200,
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 22,
            color: NOTION.muted,
            opacity: nodeLabelIn,
          }}
        >
          ntn
        </div>

        {/* ------------------------ Claude chip --------------------------- */}
        <div
          style={{
            position: "absolute",
            left: CHIP.cx - CHIP.size / 2,
            top:
              CHIP.cy -
              CHIP.size / 2 +
              (frame > 150 ? 2 * Math.sin(frame / 37) : 0),
            width: CHIP.size,
            height: CHIP.size,
            transform: `scale(${chipIn})`,
            opacity: chipOpacity,
            borderRadius: 28,
            backgroundColor: "#FFFFFF",
            border: `1px solid ${NOTION.border}`,
            boxShadow: "0 20px 50px rgba(15,23,42,0.12), 0 3px 10px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <RingPulse frame={frame} at={142} radius={28} color="rgba(217,119,87,0.8)" />
          <Img
            src={staticFile("openseo/logos/claude-color.svg")}
            style={{ width: 84, height: 84 }}
          />
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 25,
              fontWeight: 600,
              color: NOTION.text,
            }}
          >
            Claude
          </div>
        </div>

        {/* ---------------------- database cards -------------------------- */}
        {DB_CARDS.map((card, i) => {
          const enter = 126 + i * 7;
          const sIn = spring({
            frame: frame - enter,
            fps,
            config: SPRINGS.snappy,
            durationInFrames: 30,
          });
          const opacity = interpolate(frame, [enter, enter + 7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const slide = 36 * (1 - sIn);

          // landing bump + green dot
          const land = LAND_AT[i];
          const bump = interpolate(frame, [land, land + 6, land + 16], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const dotIn = spring({
            frame: frame - land,
            fps,
            config: SPRINGS.bouncy,
            durationInFrames: 30,
          });
          const synced = frame >= land;
          const bob = frame > 160 ? 2 * Math.sin(frame / 41 + i * 2.1) : 0;

          return (
            <div
              key={`db-${i}`}
              style={{
                position: "absolute",
                left: CARD_X + slide,
                top: CARD_YS[i] - CARD_H / 2 + bob,
                width: CARD_W,
                height: CARD_H,
                transform: `scale(${1 + 0.04 * bump})`,
                opacity,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                border: `1px solid ${synced ? "rgba(68,131,97,0.45)" : NOTION.border}`,
                boxShadow: "0 16px 40px rgba(15,23,42,0.10), 0 3px 8px rgba(15,23,42,0.05)",
                padding: "18px 18px",
              }}
            >
              <RingPulse frame={frame} at={land} radius={16} color="rgba(68,131,97,0.8)" />
              {/* tinted pill header */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: card.pill.bg,
                  color: card.pill.text,
                  borderRadius: 999,
                  padding: "6px 15px",
                  fontFamily: FONT_SANS,
                  fontSize: 23,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {card.title}
              </div>
              {/* one entry row */}
              <div
                style={{
                  marginTop: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <Img
                  src={staticFile("notion/notion-logo.png")}
                  style={{ width: 21, height: 21 }}
                />
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 21,
                    fontWeight: 500,
                    color: NOTION.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.row}
                </div>
              </div>
              {/* green sync dot */}
              {synced ? (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    backgroundColor: NOTION.green,
                    transform: `scale(${dotIn})`,
                    boxShadow: "0 0 0 3px rgba(68,131,97,0.18)",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
