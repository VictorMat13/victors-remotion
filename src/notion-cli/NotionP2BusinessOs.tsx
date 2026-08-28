// NotionP2BusinessOs — "the grind → the OS" continuous-world SaaS walkthrough.
// Style: floating Notion UI fragments on warm off-white (rydnel-02/12 refs) —
// bold playful titles with trailing emoji, tinted kanban columns as soft
// rounded cards, floating white task cards, generous whitespace.
// Act 1 (0–190): camera lives inside the "Content 🎬" kanban — a cursor drags
// a card between columns, checks due dates one by one (one flips overdue),
// then flips status pills by hand. Pivot (190–260): pure camera pull-out —
// the board shrinks into one cluster of a larger workspace. Act 2 (260–452):
// five more database clusters spring in, staggered to the VO list. Land
// (452–479): full business-OS overview, end hold with micro-motion.
// One world, one keyframed camera, Easing.inOut(cubic).
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
import { FONT_MONO, FONT_SANS, NOTION, PILL } from "./theme";

export const DURATION_IN_FRAMES = 480;

// ---------------------------------------------------------------- world layout
const VIEW_W = 1080;
const VIEW_H = 1920;
const WORLD_BG = "#F3F1EE"; // warm off-white from the rydnel references

const CLUSTER_W = 880;
const CLUSTER_GAP_X = 70;
const GRID_X = (2560 - (CLUSTER_W * 2 + CLUSTER_GAP_X)) / 2; // 365, grid center = 1280
const colX = (c: number) => GRID_X + c * (CLUSTER_W + CLUSTER_GAP_X);
const ROW_Y = [760, 1600, 2440];

const ease = Easing.inOut(Easing.cubic);
const easeQ = Easing.inOut(Easing.quad);
const iv = (
  f: number,
  range: number[],
  out: number[],
  e: (t: number) => number = ease
) =>
  interpolate(f, range, out, {
    easing: e,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ---------------------------------------------------------------- camera keys
// B1 drag (cols 1→2) · B2 date checks (col 2) · B3 pill flips (col 1) ·
// pivot pull-out · staggered OS assembly drift · final overview hold.
const KEY_T = [0, 16, 48, 66, 132, 150, 190, 226, 260, 300, 340, 386, 452, 479];
const KEY_FX = [550, 556, 760, 810, 818, 580, 586, 1280, 1280, 1280, 1280, 1280, 1280, 1280];
const KEY_FY = [1276, 1276, 1288, 1278, 1284, 1165, 1172, 1450, 1480, 1600, 1700, 1780, 1808, 1808];
const KEY_Z = [2.32, 2.3, 2.24, 2.3, 2.26, 2.4, 2.36, 0.53, 0.528, 0.526, 0.524, 0.52, 0.52, 0.52];

// ---------------------------------------------------------------- board geometry
const BOARD_X = GRID_X; // Content cluster = row 0, col 0
const BOARD_TITLE_Y = 760;
const COLS_TOP = 910;
const KCOL_X = [BOARD_X + 4, BOARD_X + 302, BOARD_X + 600];
const KCOL_W = 272;
const KCOL_DY = [0, -16, 12]; // organic float offsets
const CARD_W = 252;
const CARD_H = 86;
const PITCH = 98;
const slot0 = (col: number) => COLS_TOP + KCOL_DY[col] + 62;

type PillSpec = { label: string; c: keyof typeof PILL };
type CardSpec = { icon: string; title: string; date: string; status: PillSpec };

const CARD_DRAGGED: CardSpec = {
  icon: "🎙️",
  title: "Podcast trailer script",
  date: "Aug 9",
  status: { label: "Not started", c: "gray" },
};
const DRAG_FLIP = { at: 46, to: { label: "In progress", c: "blue" } as PillSpec };

const COL1_CARDS: CardSpec[] = [
  { icon: "📄", title: "Q3 rate card refresh", date: "Aug 14", status: { label: "Draft", c: "gray" } },
  { icon: "🎁", title: "Client welcome pack", date: "Aug 18", status: { label: "Waiting", c: "gray" } },
  { icon: "🖼️", title: "Moodboard — fall drop", date: "Aug 22", status: { label: "Draft", c: "gray" } },
  { icon: "🧵", title: "Hook variations", date: "Aug 25", status: { label: "Draft", c: "gray" } },
];
const COL1_FLIPS: ({ at: number; to: PillSpec } | undefined)[] = [
  { at: 157, to: { label: "Review", c: "yellow" } },
  { at: 171, to: { label: "Active", c: "blue" } },
  { at: 183, to: { label: "Scheduled", c: "purple" } },
  undefined,
];
const COL2_CARDS: CardSpec[] = [
  { icon: "🎬", title: "UGC ad cut — v2", date: "Aug 8", status: { label: "Sponsor", c: "yellow" } },
  { icon: "✉️", title: "Newsletter #42", date: "Aug 1", status: { label: "Email", c: "blue" } },
  { icon: "🎨", title: "Brand kit refresh", date: "Aug 12", status: { label: "Design", c: "orange" } },
];
const DATE_HOVERS: [number, number][] = [
  [82, 96],
  [100, 114],
  [120, 134],
];
const OVERDUE_AT = 112;
const COL3_CARDS: CardSpec[] = [
  { icon: "📹", title: "Reel — 5 AI tools", date: "Jul 28", status: { label: "Reel", c: "blue" } },
  { icon: "🧾", title: "Invoice — July", date: "Jul 30", status: { label: "Finance", c: "green" } },
  { icon: "📘", title: "Media kit 2026", date: "Jul 24", status: { label: "Biz", c: "brown" } },
  { icon: "📊", title: "Sponsor report", date: "Jul 21", status: { label: "Sponsor", c: "yellow" } },
  { icon: "🎧", title: "Audio cleanup — ep 3", date: "Jul 18", status: { label: "Podcast", c: "purple" } },
];

// rydnel-02 column tints
const KCOL_STYLE = [
  { bg: "#DFE9F3", dot: "#5B93C9", count: "#3F6E9E" },
  { bg: "#F9DFDC", dot: "#DE5550", count: "#C4453F" },
  { bg: "#DFEDDF", dot: "#5A9E68", count: "#47804F" },
];
const KCOL_LABELS = ["Not started", "In progress", "Done"];

// ---------------------------------------------------------------- cursor path
const CUR_F = [0, 13, 17, 32, 44, 52, 72, 82, 92, 100, 112, 120, 132, 146, 154, 162, 168, 176, 182, 189];
const CUR_X = [700, 484, 484, 633, 782, 800, 760, 713, 713, 713, 713, 713, 713, 640, 575, 575, 575, 575, 575, 580];
const CUR_Y = [1360, 1004, 1004, 980, 988, 1040, 1080, 1120, 1120, 1218, 1218, 1316, 1316, 1150, 1038, 1038, 1136, 1136, 1234, 1240];
const CLICKS = [
  { at: 157, x: 575, y: 1038 },
  { at: 171, x: 575, y: 1136 },
  { at: 183, x: 575, y: 1234 },
];
const cursorPressed = (f: number) =>
  (f >= 17 && f <= 46) ||
  (f >= 155 && f <= 159) ||
  (f >= 169 && f <= 173) ||
  (f >= 181 && f <= 185);

// ---------------------------------------------------------------- act 2 grid
const CLUSTER_DEFS = [
  { key: "clients", title: "Clients", emoji: "👥", col: 1, row: 0, enter: 262 },
  { key: "deals", title: "Brand Deals", emoji: "🤝", col: 0, row: 1, enter: 292 },
  { key: "tasks", title: "Tasks", emoji: "✅", col: 1, row: 1, enter: 322 },
  { key: "assets", title: "Assets", emoji: "🗂️", col: 0, row: 2, enter: 352 },
  { key: "reviews", title: "Reviews", emoji: "⭐", col: 1, row: 2, enter: 382 },
] as const;

// ---------------------------------------------------------------- tiny pieces
const Pill: React.FC<{
  spec: PillSpec;
  h?: number;
  fs?: number;
  style?: React.CSSProperties;
}> = ({ spec, h = 26, fs = 13.5, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: h,
      padding: `0 ${Math.round(fs * 0.65)}px`,
      borderRadius: Math.round(h * 0.22),
      background: PILL[spec.c].bg,
      color: PILL[spec.c].text,
      fontSize: fs,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {spec.label}
  </div>
);

const Cursor: React.FC<{ x: number; y: number; pressed: boolean; opacity: number }> = ({
  x,
  y,
  pressed,
  opacity,
}) => (
  <svg
    width={27}
    height={38}
    viewBox="0 0 20 28"
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      transform: `scale(${pressed ? 0.86 : 1})`,
      transformOrigin: "4px 2px",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
    }}
  >
    <path
      d="M3 1 L3 22.5 L8.2 17.6 L11.6 25.5 L15 24 L11.6 16.2 L18.6 16.2 Z"
      fill="#1F1F1F"
      stroke="#FFFFFF"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

const ClusterTitle: React.FC<{ text: string; emoji: string; scale?: number }> = ({
  text,
  emoji,
  scale = 1,
}) => (
  <div
    style={{
      fontSize: 96,
      fontWeight: 700,
      letterSpacing: -2,
      color: NOTION.text,
      whiteSpace: "nowrap",
      fontFamily: FONT_SANS,
      transform: `scale(${scale})`,
      transformOrigin: "0 60%",
    }}
  >
    {text} <span style={{ fontSize: 84 }}>{emoji}</span>
  </div>
);

// ------------------------------------------------------------------ the board
const KanbanCard: React.FC<{
  card: CardSpec;
  x: number;
  y: number;
  frame: number;
  fps: number;
  flip?: { at: number; to: PillSpec };
  hover?: [number, number];
  overdueAt?: number;
}> = ({ card, x, y, frame, fps, flip, hover, overdueAt }) => {
  const overdue = overdueAt !== undefined && frame >= overdueAt;
  const shake =
    overdueAt !== undefined && frame >= overdueAt && frame <= overdueAt + 9
      ? Math.sin((frame - overdueAt) * 1.9) * 3 * (1 - (frame - overdueAt) / 9)
      : 0;
  const hoverOn = hover
    ? iv(frame, [hover[0], hover[0] + 4, hover[1] - 3, hover[1] + 1], [0, 1, 1, 0], easeQ)
    : 0;
  const overduePop =
    overdueAt !== undefined && frame >= overdueAt
      ? spring({ frame: frame - overdueAt, fps, config: { damping: 12, stiffness: 200 } })
      : 0;
  const flipped = flip !== undefined && frame >= flip.at;
  const flipPop = flipped
    ? spring({ frame: frame - flip!.at, fps, config: { damping: 12, stiffness: 210 } })
    : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.04)",
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(15,15,15,0.07)",
        padding: "11px 14px",
        boxSizing: "border-box",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 20,
          fontWeight: 600,
          color: NOTION.text,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 17 }}>{card.icon}</span>
        {card.title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 12,
          top: 48,
          display: "flex",
          alignItems: "center",
          gap: 8,
          transform: `translateX(${shake}px)`,
        }}
      >
        <span
          style={{
            fontSize: 14.5,
            fontWeight: overdue ? 700 : 400,
            color: overdue ? NOTION.red : NOTION.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {card.date}
        </span>
        {overdue ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 24,
              padding: "0 9px",
              borderRadius: 6,
              background: PILL.red.bg,
              color: PILL.red.text,
              fontSize: 13,
              fontWeight: 600,
              transform: `scale(${0.6 + 0.4 * overduePop})`,
            }}
          >
            Overdue
          </span>
        ) : null}
        <div style={{ flex: 1 }} />
        {!flipped ? (
          <Pill spec={card.status} />
        ) : (
          <Pill spec={flip!.to} style={{ transform: `scale(${0.7 + 0.3 * flipPop})` }} />
        )}
      </div>
      {hover ? (
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 42,
            width: 128,
            height: 36,
            borderRadius: 8,
            border: `2.5px solid rgba(35,131,226,${0.75 * hoverOn})`,
            background: `rgba(35,131,226,${0.06 * hoverOn})`,
          }}
        />
      ) : null}
    </div>
  );
};

const KanbanColumn: React.FC<{ col: number; height: number; count: string }> = ({
  col,
  height,
  count,
}) => {
  const s = KCOL_STYLE[col];
  return (
    <div
      style={{
        position: "absolute",
        left: KCOL_X[col],
        top: COLS_TOP + KCOL_DY[col],
        width: KCOL_W,
        height,
        borderRadius: 18,
        background: s.bg,
        boxShadow: "0 10px 26px rgba(15,15,15,0.07)",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 30,
            padding: "0 12px",
            borderRadius: 15,
            background: "rgba(255,255,255,0.65)",
          }}
        >
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.dot }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#57534E" }}>
            {KCOL_LABELS[col]}
          </span>
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: s.count,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

const BoardCluster: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const liftP =
    frame <= 24 ? 0 : spring({ frame: frame - 24, fps, config: { damping: 22, stiffness: 120 } });
  const dropP =
    frame <= 36 ? 0 : spring({ frame: frame - 36, fps, config: { damping: 20, stiffness: 130 } });

  // Dragged card: col1 slot 0 -> col2 slot 0, slight lift arc.
  const dragX = iv(frame, [18, 32, 44], [KCOL_X[0] + 10, 528, KCOL_X[1] + 10], easeQ);
  const dragY = iv(frame, [18, 32, 44], [slot0(0), slot0(0) - 24, slot0(1)], easeQ);
  const dragRot = iv(frame, [16, 28, 40, 46], [0, 2.5, 1.6, 0], easeQ);
  const dragging = frame >= 14 && frame <= 50;
  const dragShadow = iv(frame, [14, 20, 44, 52], [0.07, 0.24, 0.24, 0.07], easeQ);
  const dragScale = iv(frame, [14, 19, 44, 50], [1, 1.05, 1.05, 1], easeQ);

  const col1H = 76 + (5 - liftP) * PITCH;
  const col2H = 76 + (3 + dropP) * PITCH;
  const col3H = 76 + 5 * PITCH + 40;

  const curX = iv(frame, CUR_F, CUR_X, easeQ);
  const curY = iv(frame, CUR_F, CUR_Y, easeQ);
  const curOpacity = iv(frame, [190, 204], [1, 0], easeQ);

  // VO sync: title pops when "Content." lands
  const titlePop = iv(frame, [256, 264, 276], [1, 1.06, 1], easeQ);

  return (
    <>
      <div style={{ position: "absolute", left: BOARD_X + 6, top: BOARD_TITLE_Y }}>
        <ClusterTitle text="Content" emoji="🎬" scale={titlePop} />
      </div>

      <KanbanColumn col={0} height={col1H} count={frame < 34 ? "5" : "4"} />
      <KanbanColumn col={1} height={col2H} count={frame < 42 ? "3" : "4"} />
      <KanbanColumn col={2} height={col3H} count="5" />

      {/* + New page ghost (Done column, rydnel-02 style) */}
      <div
        style={{
          position: "absolute",
          left: KCOL_X[2] + 10,
          top: slot0(2) + 5 * PITCH,
          width: CARD_W,
          height: 34,
          borderRadius: 9,
          background: "rgba(255,255,255,0.65)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontSize: 15,
          color: NOTION.faint,
          fontFamily: FONT_SANS,
        }}
      >
        ＋ New page
      </div>

      {/* column 1 cards (shift up once the dragged card leaves) */}
      {COL1_CARDS.map((c, i) => (
        <KanbanCard
          key={c.title}
          card={c}
          x={KCOL_X[0] + 10}
          y={slot0(0) + (i + 1) * PITCH - PITCH * liftP}
          frame={frame}
          fps={fps}
          flip={COL1_FLIPS[i]}
        />
      ))}

      {/* column 2 cards (shift down to make room) */}
      {COL2_CARDS.map((c, i) => (
        <KanbanCard
          key={c.title}
          card={c}
          x={KCOL_X[1] + 10}
          y={slot0(1) + i * PITCH + PITCH * dropP}
          frame={frame}
          fps={fps}
          hover={DATE_HOVERS[i]}
          overdueAt={i === 1 ? OVERDUE_AT : undefined}
        />
      ))}

      {/* column 3 cards */}
      {COL3_CARDS.map((c, i) => (
        <KanbanCard
          key={c.title}
          card={c}
          x={KCOL_X[2] + 10}
          y={slot0(2) + i * PITCH}
          frame={frame}
          fps={fps}
        />
      ))}

      {/* the dragged card, above everything */}
      <div
        style={{
          position: "absolute",
          left: dragX,
          top: dragY,
          transform: `rotate(${dragRot}deg) scale(${dragScale})`,
          transformOrigin: "50% 30%",
          filter: dragging
            ? `drop-shadow(0 12px 20px rgba(15,15,15,${dragShadow}))`
            : "none",
        }}
      >
        <KanbanCard card={CARD_DRAGGED} x={0} y={0} frame={frame} fps={fps} flip={DRAG_FLIP} />
      </div>

      {/* click ripples */}
      {CLICKS.map((r) => {
        if (frame < r.at || frame > r.at + 14) return null;
        const t = frame - r.at;
        const rad = iv(t, [0, 14], [10, 40], Easing.out(Easing.quad));
        const op = iv(t, [0, 14], [0.4, 0], Easing.out(Easing.quad));
        return (
          <div
            key={r.at}
            style={{
              position: "absolute",
              left: r.x - rad,
              top: r.y - rad,
              width: rad * 2,
              height: rad * 2,
              borderRadius: "50%",
              border: `3px solid rgba(35,131,226,${op})`,
            }}
          />
        );
      })}

      <Cursor x={curX} y={curY} pressed={cursorPressed(frame)} opacity={curOpacity} />
    </>
  );
};

// ---------------------------------------------------------------- mini bodies
const rowIn = (frame: number, enter: number, i: number) => {
  const d = enter + 8 + i * 4;
  return {
    opacity: iv(frame, [d, d + 9], [0, 1], easeQ),
    transform: `translateY(${iv(frame, [d, d + 12], [14, 0], easeQ)}px)`,
  };
};

const HeaderLabels: React.FC<{ left: string; right: string }> = ({ left, right }) => (
  <div
    style={{
      position: "absolute",
      left: 40,
      right: 40,
      top: 22,
      display: "flex",
      justifyContent: "space-between",
      fontSize: 24,
      color: NOTION.faint,
      borderBottom: `1.5px solid ${NOTION.border}`,
      paddingBottom: 10,
    }}
  >
    <span>{left}</span>
    <span>{right}</span>
  </div>
);

const AVATAR_BG = [PILL.blue.bg, PILL.orange.bg, PILL.purple.bg, PILL.green.bg];
const CLIENT_ROWS = [
  { init: "MC", name: "Maya Chen", org: "Northwind Co", pill: { label: "Active", c: "green" } as PillSpec },
  { init: "JP", name: "Jake Porter", org: "Bluepeak Media", pill: { label: "Onboarding", c: "blue" } as PillSpec },
  { init: "AR", name: "Ana Ruiz", org: "Fernline Studio", pill: { label: "Active", c: "green" } as PillSpec },
  { init: "TW", name: "Tom Weller", org: "Hartwood Labs", pill: { label: "Paused", c: "yellow" } as PillSpec },
];

const ClientsBody: React.FC<{ frame: number; enter: number }> = ({ frame, enter }) => {
  // LAND micro-motion: row highlight sweep
  const sweepY = iv(frame, [440, 470], [70, 400], easeQ);
  const sweepOp = iv(frame, [440, 448, 462, 472], [0, 1, 1, 0], easeQ);
  return (
    <>
      <HeaderLabels left="Name" right="Status" />
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: sweepY,
          height: 92,
          borderRadius: 12,
          background: `rgba(35,131,226,${0.07 * sweepOp})`,
        }}
      />
      {CLIENT_ROWS.map((r, i) => (
        <div
          key={r.name}
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 72 + i * 98,
            height: 92,
            display: "flex",
            alignItems: "center",
            gap: 22,
            borderBottom: i < 3 ? `1.5px solid ${NOTION.borderSoft}` : "none",
            ...rowIn(frame, enter, i),
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: AVATAR_BG[i],
              color: NOTION.textSoft,
              fontSize: 20,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {r.init}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 35, fontWeight: 600, color: NOTION.text }}>{r.name}</div>
            <div style={{ fontSize: 25, color: NOTION.muted, marginTop: 2 }}>{r.org}</div>
          </div>
          <Pill spec={r.pill} h={44} fs={25} />
        </div>
      ))}
    </>
  );
};

const DEAL_ROWS = [
  { name: "Glowbite", amount: "$4,500", pill: { label: "Negotiating", c: "yellow" } as PillSpec },
  { name: "Framewrk", amount: "$8,000", pill: { label: "Signed", c: "green" } as PillSpec, pulse: true },
  { name: "Loomly", amount: "$2,750", pill: { label: "Outreach", c: "gray" } as PillSpec },
  { name: "Vantapod", amount: "$6,200", pill: { label: "Sent", c: "blue" } as PillSpec },
];

const DealsBody: React.FC<{ frame: number; enter: number }> = ({ frame, enter }) => (
  <>
    <HeaderLabels left="Brand" right="Value" />
    {DEAL_ROWS.map((r, i) => {
      const pulse =
        r.pulse && frame >= 434 ? 1 + 0.06 * Math.sin(((frame - 434) * 2 * Math.PI) / 52) : 1;
      return (
        <div
          key={r.name}
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 72 + i * 98,
            height: 92,
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderBottom: i < 3 ? `1.5px solid ${NOTION.borderSoft}` : "none",
            ...rowIn(frame, enter, i),
          }}
        >
          <span style={{ flex: 1, fontSize: 35, fontWeight: 600, color: NOTION.text }}>
            {r.name}
          </span>
          <Pill
            spec={r.pill}
            h={44}
            fs={25}
            style={{ transform: `scale(${pulse})`, transformOrigin: "50% 50%" }}
          />
          <span
            style={{
              width: 130,
              textAlign: "right",
              fontSize: 35,
              fontWeight: 600,
              color: NOTION.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.amount}
          </span>
        </div>
      );
    })}
  </>
);

const TASK_ROWS = [
  { text: "Send July invoices", done: true },
  { text: "Reply to Glowbite thread", done: true },
  { text: "Script — CLI deep dive", done: false },
  { text: "Update media kit", done: false },
  { text: "Book studio — Thu", done: false },
];

const TasksBody: React.FC<{ frame: number; enter: number }> = ({ frame, enter }) => (
  <>
    {TASK_ROWS.map((r, i) => (
      <div
        key={r.text}
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 26 + i * 86,
          height: 80,
          display: "flex",
          alignItems: "center",
          gap: 22,
          borderBottom: i < 4 ? `1.5px solid ${NOTION.borderSoft}` : "none",
          ...rowIn(frame, enter, i),
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            flexShrink: 0,
            background: r.done ? NOTION.blue : "#FFFFFF",
            border: r.done ? "none" : "2.5px solid #C9C9C6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {r.done ? (
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path
                d="M5 12.5 L10 17.5 L19 7"
                stroke="#FFFFFF"
                strokeWidth={3.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </div>
        <span
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: r.done ? NOTION.faint : NOTION.text,
            textDecoration: r.done ? "line-through" : "none",
          }}
        >
          {r.text}
        </span>
      </div>
    ))}
  </>
);

const ASSET_ITEMS = [
  { emoji: "🎞️", label: "b-roll-desk.mp4", g: ["#D3E5EF", "#E8F3F8"] },
  { emoji: "🖼️", label: "thumb-v3.png", g: ["#FADEC9", "#FDECC8"] },
  { emoji: "🎨", label: "lut-warm.cube", g: ["#E8DEEE", "#F5E0E9"] },
  { emoji: "📦", label: "logo-pack.zip", g: ["#DBEDDB", "#E8F3E8"] },
];

const AssetsBody: React.FC<{ frame: number; enter: number }> = ({ frame, enter }) => (
  <>
    {ASSET_ITEMS.map((a, i) => {
      const c = i % 2;
      const r = Math.floor(i / 2);
      return (
        <div
          key={a.label}
          style={{
            position: "absolute",
            left: 40 + c * 415,
            top: 32 + r * 212,
            width: 385,
            ...rowIn(frame, enter, i),
          }}
        >
          <div
            style={{
              width: 385,
              height: 148,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.05)",
              background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 54,
            }}
          >
            {a.emoji}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 21,
              color: NOTION.muted,
              fontFamily: FONT_MONO,
              whiteSpace: "nowrap",
            }}
          >
            {a.label}
          </div>
        </div>
      );
    })}
  </>
);

const REVIEW_ROWS = [
  { title: "Sponsor cut v2", stars: 4, pill: { label: "Approved", c: "green" } as PillSpec },
  { title: "Thumb A/B test", stars: 3, pill: { label: "Notes", c: "yellow" } as PillSpec },
  { title: "Reel draft 07", stars: 5, pill: { label: "Approved", c: "green" } as PillSpec },
  { title: "Landing refresh", stars: 4, pill: { label: "Queued", c: "gray" } as PillSpec },
];

const ReviewsBody: React.FC<{ frame: number; enter: number }> = ({ frame, enter }) => (
  <>
    <HeaderLabels left="Deliverable" right="Status" />
    {REVIEW_ROWS.map((r, i) => (
      <div
        key={r.title}
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 72 + i * 98,
          height: 92,
          display: "flex",
          alignItems: "center",
          borderBottom: i < 3 ? `1.5px solid ${NOTION.borderSoft}` : "none",
          ...rowIn(frame, enter, i),
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 34, fontWeight: 600, color: NOTION.text }}>{r.title}</div>
          <div style={{ fontSize: 26, marginTop: 2, letterSpacing: 2 }}>
            {[0, 1, 2, 3, 4].map((s) => (
              <span key={s} style={{ color: s < r.stars ? "#E9A23B" : "#D9D9D6" }}>
                ★
              </span>
            ))}
          </div>
        </div>
        <Pill spec={r.pill} h={44} fs={25} />
      </div>
    ))}
  </>
);

// -------------------------------------------------------------- act 2 chrome
const Cluster: React.FC<{
  def: (typeof CLUSTER_DEFS)[number];
  frame: number;
  fps: number;
  cardH?: number;
  children: React.ReactNode;
}> = ({ def, frame, fps, cardH = 480, children }) => {
  const s =
    frame <= def.enter
      ? 0
      : spring({ frame: frame - def.enter, fps, config: { damping: 15, stiffness: 130 } });
  const op = iv(frame, [def.enter, def.enter + 8], [0, 1], easeQ);
  return (
    <div
      style={{
        position: "absolute",
        left: colX(def.col),
        top: ROW_Y[def.row],
        width: CLUSTER_W,
        opacity: op,
        transform: `translateY(${56 * (1 - s)}px) scale(${0.92 + 0.08 * s})`,
        transformOrigin: "50% 30%",
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{ marginLeft: 6 }}>
        <ClusterTitle text={def.title} emoji={def.emoji} />
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 40,
          width: CLUSTER_W,
          height: cardH,
          borderRadius: 20,
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 14px 36px rgba(15,15,15,0.09)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const WorkspaceHeader: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enter = 240;
  const s =
    frame <= enter
      ? 0
      : spring({ frame: frame - enter, fps, config: { damping: 16, stiffness: 130 } });
  const op = iv(frame, [enter, enter + 9], [0, 1], easeQ);
  return (
    <div
      style={{
        position: "absolute",
        left: GRID_X + 6,
        top: 560,
        display: "flex",
        alignItems: "center",
        gap: 26,
        opacity: op,
        transform: `translateY(${-26 * (1 - s)}px)`,
        fontFamily: FONT_SANS,
      }}
    >
      <Img
        src={staticFile("notion/notion-logo.png")}
        style={{ height: 76, width: "auto", display: "block" }}
      />
      <span
        style={{
          fontSize: 76,
          fontWeight: 600,
          letterSpacing: -1,
          color: NOTION.text,
          whiteSpace: "nowrap",
        }}
      >
        Liam&#8217;s Notion
      </span>
    </div>
  );
};

// -------------------------------------------------------------------- main
export const NotionP2BusinessOs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: NOTION.bg, fontFamily: FONT_SANS }}>
      {/* warm off-white stage from the approved floating-fragment references */}
      <AbsoluteFill style={{ backgroundColor: WORLD_BG }} />
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <WorkspaceHeader frame={frame} fps={fps} />
        <BoardCluster frame={frame} fps={fps} />
        {CLUSTER_DEFS.map((def) => (
          <Cluster key={def.key} def={def} frame={frame} fps={fps}>
            {def.key === "clients" ? (
              <ClientsBody frame={frame} enter={def.enter} />
            ) : def.key === "deals" ? (
              <DealsBody frame={frame} enter={def.enter} />
            ) : def.key === "tasks" ? (
              <TasksBody frame={frame} enter={def.enter} />
            ) : def.key === "assets" ? (
              <AssetsBody frame={frame} enter={def.enter} />
            ) : (
              <ReviewsBody frame={frame} enter={def.enter} />
            )}
          </Cluster>
        ))}
      </div>
    </AbsoluteFill>
  );
};
