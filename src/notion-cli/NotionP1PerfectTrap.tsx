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
import { NOTION, PILL, FONT_SANS, SPRINGS } from "./theme";

// ============================================================================
// NotionP1PerfectTrap — 1080x1080 @ 30fps
// Beat: "Most people build a perfect Notion workspace... then accidentally
// become the person who has to update it forever."
// Style: rydnel floating-fragment Notion — tinted kanban column cards on
// clean off-white, generous whitespace, bold playful title. One continuous
// world, keyframed camera: assemble -> manual grind -> pull-out to the
// "In progress 99" overload.
// ============================================================================

export const DURATION_IN_FRAMES = 300;

const VIEW = 1080;
const PAPER = "#F6F5F1"; // rydnel off-white world tint (over opaque NOTION.bg root)

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const COL_W = 480;
const CARD_W = COL_W - 44;
const COL_TOP = 380;
const HEADER_H = 96; // container padding-top + header row
const CARD_GAP = 16;
const COL_X = [600, 1180, 1760, 2400]; // Not started / In progress / Done / Waiting on client

type PillColor = keyof typeof PILL;
const TINT: Record<string, string> = {
  blue: "#E4EEF8",
  red: "#FBE7E3",
  green: "#E5F2E5",
  pink: "#F7E7EF",
};

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------
type CardSpec = {
  id: string;
  title: string;
  date?: string;
  overdueAt?: number; // frame when date crossfades to red Overdue pill (-1 = from entry)
  todo?: { label: string; tickAt?: number; done?: boolean };
  pill?: { t: string; c: PillColor }; // small property pill (e.g. priority)
  flipFrom?: { t: string; c: PillColor }; // pill crossfades from this at flipAt
  flipAt?: number;
  enter: number;
  pulsePhase?: number; // end-hold pulse on overdue pill
};

type Member = { spec: CardSpec; drag?: 1 | 2; leaveAt?: number };

const cardH = (c: CardSpec): number => {
  let h = 44 + 44; // padding + title line
  if (c.pill || c.flipFrom) h += 54;
  if (c.date || c.overdueAt !== undefined) h += 46;
  if (c.todo) h += 50;
  return h;
};

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
// Not started (pristine 4)
const a0: CardSpec = { id: "a0", title: "Studio tour vlog", date: "15/08/2026", enter: 24 };
const a1: CardSpec = { id: "a1", title: "August newsletter", todo: { label: "Attach media kit", tickAt: 176 }, enter: 30 };
const d1spec: CardSpec = { id: "d1", title: "Nimbus Labs — deck", date: "06/08/2026", overdueAt: 206, enter: 36, pulsePhase: 2 };
const d2spec: CardSpec = { id: "d2", title: "Website refresh copy", date: "10/08/2026", enter: 42 };

// In progress (pristine 2)
const i0: CardSpec = { id: "i0", title: "Podcast ep. 42", pill: { t: "High", c: "red" }, flipFrom: { t: "Low", c: "blue" }, flipAt: 145, date: "08/08/2026", enter: 28 };
const i1: CardSpec = { id: "i1", title: "UGC ad — Fernwood", date: "07/08/2026", overdueAt: 186, enter: 34, pulsePhase: 0 };

// Done (pristine 3 — stays 3, the punchline contrast)
const g0: CardSpec = { id: "g0", title: "Morning routine reel", todo: { label: "Posted", done: true }, enter: 32 };
const g1: CardSpec = { id: "g1", title: "July newsletter", date: "28/07/2026", enter: 38 };
const g2: CardSpec = { id: "g2", title: "Ep. 40 — full cut", date: "25/07/2026", enter: 44 };

// Phase-2 spawns (work outpacing the cursor)
const s0a: CardSpec = { id: "s0a", title: "Reel cover pack 🎨", date: "08/08/2026", enter: 182 };
const s0b: CardSpec = { id: "s0b", title: "Sept content map", enter: 186 };
const s1a: CardSpec = { id: "s1a", title: "Sponsor cut v2", date: "05/08/2026", overdueAt: -1, enter: 196 };
const s1b: CardSpec = { id: "s1b", title: "Media kit update", date: "06/08/2026", overdueAt: 212, enter: 210, pulsePhase: 4 };

// End-hold micro pop (queue still growing)
const late0: CardSpec = { id: "late0", title: "Pitch — Solstice Skin", date: "02/09/2026", enter: 284 };

// ---------------------------------------------------------------------------
// Backlog generation (the endless queue, staggered in during the pull-out)
// ---------------------------------------------------------------------------
const BACKLOG: Array<[string, boolean, boolean]> = [
  // [title, overdue, todo]
  ["Podcast ep. 43", true, false],
  ["Reshoot — kitchen b-roll", false, true],
  ["Invoice — Harbor & Fog", true, false],
  ["Comments roundup", false, false],
  ["Q3 analytics recap", true, false],
  ["Press kit refresh", false, true],
  ["Rate card update", true, false],
  ["Affiliate links audit", false, false],
  ["Testimonial highlights", true, false],
  ["Podcast ep. 44", false, true],
  ["Client onboarding doc", true, false],
  ["Sept giveaway plan", false, false],
  ["Newsletter archive tidy", true, false],
  ["Shorts batch #7", false, false],
  ["UGC brief — Aveline", true, false],
  ["Moodboard — winter", false, true],
  ["Site links check", true, false],
  ["Podcast ep. 45", false, false],
];
const TODO_LABELS = ["Send final files", "Add captions", "Log payment", "Reply to notes"];
const STALE_DATES = ["28/07/2026", "30/07/2026", "01/08/2026", "02/08/2026", "03/08/2026"];

const makeExtras = (tag: string, count: number, offset: number, enterBase: number, enterStep: number): Member[] => {
  const out: Member[] = [];
  for (let i = 0; i < count; i++) {
    const [title, overdue, todo] = BACKLOG[(offset + i * 2) % BACKLOG.length];
    const spec: CardSpec = {
      id: `${tag}${i}`,
      title,
      enter: Math.round(enterBase + i * enterStep),
    };
    if (overdue) {
      spec.date = STALE_DATES[(offset + i) % STALE_DATES.length];
      spec.overdueAt = -1;
    } else {
      spec.date = STALE_DATES[(offset + i * 3) % STALE_DATES.length];
    }
    if (todo) spec.todo = { label: TODO_LABELS[(offset + i) % TODO_LABELS.length] };
    out.push({ spec });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Columns (members in stacking order; drag cards keep a slot in both columns)
// ---------------------------------------------------------------------------
const DRAG1_T = { grab: 116, drop: 138 };
const DRAG2_T = { grab: 188, drop: 204 };

type ColDef = { name: string; chip: PillColor; x: number; members: Member[]; newPage?: boolean };

const COLS: ColDef[] = [
  {
    name: "Not started",
    chip: "blue",
    x: COL_X[0],
    members: [
      { spec: a0 },
      { spec: a1 },
      { spec: d1spec, drag: 1, leaveAt: DRAG1_T.grab },
      { spec: d2spec, drag: 2, leaveAt: DRAG2_T.grab },
      { spec: s0a },
      { spec: s0b },
      ...makeExtras("x0", 7, 1, 218, 4),
    ],
  },
  {
    name: "In progress",
    chip: "red",
    x: COL_X[1],
    members: [
      { spec: i0 },
      { spec: i1 },
      { spec: d1spec, drag: 1 }, // joins at drop
      { spec: s1a },
      { spec: d2spec, drag: 2 },
      { spec: s1b },
      ...makeExtras("x1", 12, 0, 212, 3.5),
    ],
  },
  {
    name: "Done",
    chip: "green",
    x: COL_X[2],
    members: [{ spec: g0 }, { spec: g1 }, { spec: g2 }],
    newPage: true,
  },
  {
    name: "Waiting on client",
    chip: "pink",
    x: COL_X[3],
    members: [...makeExtras("x3", 6, 4, 216, 5), { spec: late0 }],
  },
];

// Membership enter frame inside a column (drag cards join dest at drop)
const memberEnter = (colIdx: number, m: Member): number => {
  if (m.drag === 1) return colIdx === 1 ? DRAG1_T.drop : m.spec.enter;
  if (m.drag === 2) return colIdx === 1 ? DRAG2_T.drop : m.spec.enter;
  return m.spec.enter;
};

// Static Y of a member's slot assuming all prior enters complete / leaves applied
const staticSlotY = (colIdx: number, memberIdx: number, atFrame: number): number => {
  const col = COLS[colIdx];
  let y = COL_TOP + HEADER_H;
  for (let j = 0; j < memberIdx; j++) {
    const m = col.members[j];
    if (m.leaveAt !== undefined && atFrame >= m.leaveAt) continue;
    if (memberEnter(colIdx, m) <= atFrame) y += cardH(m.spec) + CARD_GAP;
  }
  return y;
};

// Drag geometry (start = source slot after any earlier departures settle)
const DRAG1_START = { x: COL_X[0] + 22, y: staticSlotY(0, 2, DRAG1_T.grab) };
const DRAG2_START = { x: COL_X[0] + 22, y: staticSlotY(0, 3, DRAG2_T.grab) };
const DRAG1_END = { x: COL_X[1] + 22, y: staticSlotY(1, 2, DRAG1_T.drop) };
const DRAG2_END = { x: COL_X[1] + 22, y: staticSlotY(1, 4, DRAG2_T.drop) };
const DRAG_H1 = cardH(d1spec);
const DRAG_H2 = cardH(d2spec);

// ---------------------------------------------------------------------------
// Camera — hold(assemble) -> move -> hold(drag/flip) -> drift -> hold(chaos)
// -> pull-out -> settle (last two keys identical)
// ---------------------------------------------------------------------------
const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 88, 106, 150, 166, 214, 236, 274, 300];
const KEY_FX = [1420, 1420, 1130, 1130, 1180, 1180, 1560, 1560, 1560];
const KEY_FY = [620, 620, 700, 700, 745, 745, 1080, 1080, 1080];
const KEY_Z = [0.56, 0.585, 0.78, 0.78, 0.8, 0.8, 0.5, 0.5, 0.5];

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------
const popAt = (frame: number, fps: number, start: number) =>
  frame < start ? 0 : spring({ frame: frame - start, fps, config: SPRINGS.snappy, durationInFrames: 26 });

const dragCenter = (
  frame: number,
  t: { grab: number; drop: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
  h: number
): { x: number; y: number; p: number } => {
  const sx = start.x + CARD_W / 2;
  const sy = start.y + h / 2;
  const ex = end.x + CARD_W / 2;
  const ey = end.y + h / 2;
  if (frame <= t.grab) return { x: sx, y: sy, p: 0 };
  if (frame >= t.drop) return { x: ex, y: ey, p: 1 };
  const mid = (t.grab + t.drop) / 2;
  const x = interpolate(frame, [t.grab, t.drop], [sx, ex], { easing: ease });
  const y = interpolate(frame, [t.grab, mid, t.drop], [sy, Math.min(sy, ey) - 40, ey], {
    easing: Easing.inOut(Easing.quad),
  });
  return { x, y, p: (frame - t.grab) / (t.drop - t.grab) };
};

// Cursor path targets
const CUR_OFF = { x: 52, y: 12 };
const d1sC = { x: DRAG1_START.x + CARD_W / 2 + CUR_OFF.x, y: DRAG1_START.y + DRAG_H1 / 2 + CUR_OFF.y };
const d1eC = { x: DRAG1_END.x + CARD_W / 2 + CUR_OFF.x, y: DRAG1_END.y + DRAG_H1 / 2 + CUR_OFF.y };
const d2sC = { x: DRAG2_START.x + CARD_W / 2 + CUR_OFF.x, y: DRAG2_START.y + DRAG_H2 / 2 + CUR_OFF.y };
const d2eC = { x: DRAG2_END.x + CARD_W / 2 + CUR_OFF.x, y: DRAG2_END.y + DRAG_H2 / 2 + CUR_OFF.y };
const PILL_POS = { x: COL_X[1] + 22 + 84, y: COL_TOP + HEADER_H + 44 + 22 + 26 }; // i0 priority pill
const TODO_POS = { x: COL_X[0] + 22 + 38, y: staticSlotY(0, 1, 0) + 22 + 44 + 14 + 16 }; // a1 checkbox
const HOVER_POS = { x: COL_X[1] + 22 + 240, y: staticSlotY(1, 1, 0) + cardH(i1) - 40 }; // i1 overdue

const CUR_T = [104, 115, 138, 145, 152, 168, 176, 187, 204, 211, 222, 300];
const CUR_X = [1560, d1sC.x, d1eC.x, PILL_POS.x, PILL_POS.x + 16, TODO_POS.x, TODO_POS.x, d2sC.x, d2eC.x, HOVER_POS.x, HOVER_POS.x + 10, HOVER_POS.x + 10];
const CUR_Y = [1280, d1sC.y, d1eC.y, PILL_POS.y, PILL_POS.y + 12, TODO_POS.y, TODO_POS.y, d2sC.y, d2eC.y, HOVER_POS.y, HOVER_POS.y + 8, HOVER_POS.y + 8];

const RIPPLES: Array<{ at: number; x: number; y: number }> = [
  { at: DRAG1_T.grab, x: d1sC.x, y: d1sC.y },
  { at: 145, x: PILL_POS.x, y: PILL_POS.y },
  { at: 176, x: TODO_POS.x, y: TODO_POS.y },
  { at: DRAG2_T.grab, x: d2sC.x, y: d2sC.y },
  { at: DRAG2_T.drop, x: d2eC.x, y: d2eC.y },
];

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------
const SmallPill: React.FC<{ t: string; c: PillColor; style?: React.CSSProperties }> = ({ t, c, style }) => (
  <span
    style={{
      display: "inline-block",
      background: PILL[c].bg,
      color: PILL[c].text,
      fontSize: 27,
      fontWeight: 600,
      lineHeight: 1,
      padding: "9px 16px",
      borderRadius: 7,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {t}
  </span>
);

const OverduePill: React.FC<{ scale?: number; opacity?: number }> = ({ scale = 1, opacity = 1 }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      background: PILL.red.bg,
      color: PILL.red.text,
      fontSize: 26,
      fontWeight: 600,
      lineHeight: 1,
      padding: "8px 15px",
      borderRadius: 7,
      transform: `scale(${scale})`,
      transformOrigin: "left center",
      opacity,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 11, height: 11, borderRadius: 6, background: NOTION.red, display: "inline-block" }} />
    Overdue
  </span>
);

const Checkbox: React.FC<{ checked: number; label: string }> = ({ checked, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 5,
        border: `2.5px solid ${checked > 0.5 ? NOTION.blue : "#C6C5C1"}`,
        background: checked > 0.5 ? NOTION.blue : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {checked > 0.01 ? (
        <svg width="19" height="19" viewBox="0 0 20 20" style={{ transform: `scale(${Math.min(1, checked)})` }}>
          <path d="M4 10.5 L8.2 14.5 L16 5.5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
    <span
      style={{
        fontSize: 27,
        color: checked > 0.5 ? NOTION.faint : NOTION.textSoft,
        textDecoration: checked > 0.5 ? "line-through" : "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  </div>
);

const Card: React.FC<{
  spec: CardSpec;
  x: number;
  y: number;
  frame: number;
  fps: number;
  enterAt?: number;
  elevated?: boolean;
  rotate?: number;
}> = ({ spec, x, y, frame, fps, enterAt, elevated, rotate = 0 }) => {
  const p = popAt(frame, fps, enterAt ?? spec.enter);
  if (p <= 0.001) return null;

  const od = spec.overdueAt;
  const isOverdue = od !== undefined && (od === -1 || frame >= od);
  const odPop = od === undefined ? 0 : od === -1 ? 1 : popAt(frame, fps, od);
  const flipP = spec.flipAt !== undefined ? popAt(frame, fps, spec.flipAt) : 1;
  const tickP = spec.todo ? (spec.todo.done ? 1 : spec.todo.tickAt !== undefined ? popAt(frame, fps, spec.todo.tickAt) : 0) : 0;
  const pulse =
    spec.pulsePhase !== undefined && frame > 256 && isOverdue
      ? 1 + 0.04 * Math.sin((frame - 256) * 0.3 + spec.pulsePhase)
      : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_W,
        height: cardH(spec),
        background: "#FFFFFF",
        borderRadius: 10,
        boxShadow: elevated
          ? "0 20px 44px rgba(0,0,0,0.20), 0 5px 12px rgba(0,0,0,0.10)"
          : "0 2px 6px rgba(0,0,0,0.06)",
        padding: "22px 22px",
        boxSizing: "border-box",
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px) scale(${0.96 + 0.04 * p + (elevated ? 0.035 : 0)}) rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex: elevated ? 50 : 1,
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 600,
          color: NOTION.text,
          lineHeight: "44px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {spec.title}
      </div>
      {spec.pill || spec.flipFrom ? (
        <div style={{ marginTop: 10, height: 44, position: "relative" }}>
          {spec.flipFrom ? (
            <SmallPill
              t={spec.flipFrom.t}
              c={spec.flipFrom.c}
              style={{ position: "absolute", left: 0, top: 0, opacity: 1 - flipP, transform: `scale(${1 - 0.12 * flipP})` }}
            />
          ) : null}
          {spec.pill ? (
            <SmallPill
              t={spec.pill.t}
              c={spec.pill.c}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: spec.flipFrom ? flipP : 1,
                transform: `scale(${spec.flipFrom ? 0.85 + 0.15 * flipP : 1})`,
                transformOrigin: "left center",
              }}
            />
          ) : null}
        </div>
      ) : null}
      {spec.date || od !== undefined ? (
        <div style={{ marginTop: 10, height: 40, position: "relative" }}>
          <span
            style={{
              fontSize: 26,
              color: NOTION.faint,
              position: "absolute",
              left: 0,
              top: 5,
              whiteSpace: "nowrap",
              opacity: isOverdue ? 1 - odPop : 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {spec.date}
          </span>
          {isOverdue ? (
            <span style={{ position: "absolute", left: 0, top: 0 }}>
              <OverduePill scale={(0.9 + 0.1 * odPop) * pulse} opacity={odPop} />
            </span>
          ) : null}
        </div>
      ) : null}
      {spec.todo ? <Checkbox checked={tickP} label={spec.todo.label} /> : null}
    </div>
  );
};

const Cursor: React.FC<{ x: number; y: number; opacity: number; press: number }> = ({ x, y, opacity, press }) => (
  <div
    style={{
      position: "absolute",
      left: x - 5,
      top: y - 3,
      opacity,
      transform: `scale(${1 - 0.1 * press})`,
      transformOrigin: "5px 3px",
      zIndex: 100,
    }}
  >
    <svg width="52" height="56" viewBox="0 0 24 26">
      <path
        d="M3 1 L3 19.8 L7.6 15.6 L10.5 22.6 L14.1 21.1 L11.2 14.2 L17.6 14.2 Z"
        fill="#1F1F1F"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const Ripple: React.FC<{ frame: number; at: number; x: number; y: number }> = ({ frame, at, x, y }) => {
  if (frame < at || frame > at + 14) return null;
  const t = (frame - at) / 14;
  const r = 18 + t * 48;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        border: `3px solid ${NOTION.blue}`,
        opacity: 0.5 * (1 - t),
        zIndex: 99,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const NotionP1PerfectTrap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const z = interpolate(frame, KEY_T, KEY_Z, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // member contribution (height it occupies in the stack right now)
  const contribution = (colIdx: number, m: Member): number => {
    const enterP = popAt(frame, fps, memberEnter(colIdx, m));
    const leaveP = m.leaveAt !== undefined ? popAt(frame, fps, m.leaveAt + 2) : 0;
    return (cardH(m.spec) + CARD_GAP) * enterP * (1 - leaveP);
  };

  // drag cards
  const d1 = dragCenter(frame, DRAG1_T, DRAG1_START, DRAG1_END, DRAG_H1);
  const d2 = dragCenter(frame, DRAG2_T, DRAG2_START, DRAG2_END, DRAG_H2);
  const d1Active = frame > DRAG1_T.grab && frame < DRAG1_T.drop + 6;
  const d2Active = frame > DRAG2_T.grab && frame < DRAG2_T.drop + 6;
  const d1Rot = frame <= DRAG1_T.grab ? 0 : frame >= DRAG1_T.drop ? 2.5 * (1 - popAt(frame, fps, DRAG1_T.drop)) : 2.5 * Math.min(1, d1.p * 3);
  const d2Rot = frame <= DRAG2_T.grab ? 0 : frame >= DRAG2_T.drop ? -2 * (1 - popAt(frame, fps, DRAG2_T.drop)) : -2 * Math.min(1, d2.p * 3);

  // cursor
  let curX = interpolate(frame, CUR_T, CUR_X, { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let curY = interpolate(frame, CUR_T, CUR_Y, { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame > DRAG1_T.grab && frame < DRAG1_T.drop) {
    curX = d1.x + CUR_OFF.x;
    curY = d1.y + CUR_OFF.y;
  } else if (frame > DRAG2_T.grab && frame < DRAG2_T.drop) {
    curX = d2.x + CUR_OFF.x;
    curY = d2.y + CUR_OFF.y;
  }
  if (frame > 240) {
    curX += Math.sin((frame - 240) * 0.11) * 4;
    curY += Math.cos((frame - 240) * 0.09) * 3;
  }
  const curOpacity = interpolate(frame, [102, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let press = 0;
  for (const pa of [DRAG1_T.grab, 145, 176, DRAG2_T.grab, DRAG2_T.drop]) {
    if (frame >= pa && frame <= pa + 6) press = Math.max(press, 1 - Math.abs(frame - pa - 3) / 3);
  }

  // title / chip entrances
  const chipIn = popAt(frame, fps, -10);
  const titleIn = popAt(frame, fps, -4);

  // In-progress count: real membership early, then balloons to 99
  const realCount = (colIdx: number): number => {
    let n = 0;
    for (const m of COLS[colIdx].members) {
      if (m.leaveAt !== undefined && frame >= m.leaveAt) continue;
      if (memberEnter(colIdx, m) <= frame) n++;
    }
    return n;
  };
  const balloon =
    frame < 190
      ? 0
      : Math.floor(
          interpolate(frame, [190, 278], [3, 99], {
            easing: Easing.in(Easing.quad),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        );
  const countFor = (colIdx: number): number => (colIdx === 1 ? Math.max(realCount(1), balloon) : realCount(colIdx));

  return (
    <AbsoluteFill style={{ backgroundColor: NOTION.bg, fontFamily: FONT_SANS }}>
      {/* rydnel off-white paper, opaque from frame 0 (over opaque white root) */}
      <AbsoluteFill style={{ backgroundColor: PAPER }} />
      {/* camera */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* workspace chip — small authenticity marker */}
        <div
          style={{
            position: "absolute",
            left: 622,
            top: 108,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: chipIn,
            transform: `translateY(${(1 - chipIn) * 14}px)`,
          }}
        >
          <Img src={staticFile("notion/notion-logo.png")} style={{ width: 42, height: 42, borderRadius: 8 }} />
          <span style={{ fontSize: 28, fontWeight: 500, color: NOTION.muted, whiteSpace: "nowrap" }}>Liam&#39;s Notion</span>
        </div>

        {/* page title */}
        <div
          style={{
            position: "absolute",
            left: 618,
            top: 186,
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 20}px)`,
          }}
        >
          <span style={{ fontSize: 78, fontWeight: 700, color: NOTION.text, letterSpacing: -1, whiteSpace: "nowrap" }}>Content Pipeline</span>
          <span style={{ fontSize: 70 }}>🎬</span>
        </div>

        {/* columns */}
        {COLS.map((col, ci) => {
          const headIn = popAt(frame, fps, 4 + ci * 5);
          if (headIn <= 0.001) return null;

          // running-sum member positions
          let acc = COL_TOP + HEADER_H;
          const ys: number[] = [];
          for (const m of col.members) {
            ys.push(acc);
            acc += contribution(ci, m);
          }
          const bodyH = acc - (COL_TOP + HEADER_H);
          const containerH = HEADER_H + bodyH + (col.newPage ? 76 : 0) + 8;
          const count = countFor(ci);
          const isOverload = ci === 1 && count >= 20;

          return (
            <React.Fragment key={col.name}>
              {/* tinted container */}
              <div
                style={{
                  position: "absolute",
                  left: col.x,
                  top: COL_TOP,
                  width: COL_W,
                  height: containerH,
                  background: TINT[col.chip] ?? "#EDECEA",
                  borderRadius: 20,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  opacity: headIn,
                  transform: `translateY(${(1 - headIn) * 20}px)`,
                }}
              />
              {/* header: status pill + count */}
              <div
                style={{
                  position: "absolute",
                  left: col.x + 22,
                  top: COL_TOP + 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: headIn,
                  transform: `translateY(${(1 - headIn) * 20}px)`,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 11,
                    background: PILL[col.chip].bg,
                    color: PILL[col.chip].text,
                    fontSize: 29,
                    fontWeight: 600,
                    padding: "9px 18px",
                    borderRadius: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ width: 13, height: 13, borderRadius: 7, background: PILL[col.chip].text, opacity: 0.6, display: "inline-block" }} />
                  {col.name}
                </span>
                <span
                  style={{
                    fontSize: isOverload ? 44 : 30,
                    fontWeight: isOverload ? 700 : 500,
                    color: isOverload ? PILL.red.text : NOTION.muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count}
                </span>
              </div>
              {/* cards */}
              {col.members.map((m, mi) => {
                if (m.drag !== undefined) return null; // rendered standalone
                return <Card key={m.spec.id} spec={m.spec} x={col.x + 22} y={ys[mi]} frame={frame} fps={fps} />;
              })}
              {/* + New page ghost row (Done) */}
              {col.newPage ? (
                <div
                  style={{
                    position: "absolute",
                    left: col.x + 22,
                    top: COL_TOP + HEADER_H + bodyH + 4,
                    width: CARD_W,
                    height: 62,
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 22px",
                    boxSizing: "border-box",
                    opacity: headIn * popAt(frame, fps, 52),
                  }}
                >
                  <span style={{ fontSize: 28, color: NOTION.faint }}>+ New page</span>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}

        {/* dragged cards (standalone so they can travel between columns) */}
        <Card
          spec={d1spec}
          x={d1.x - CARD_W / 2}
          y={d1.y - DRAG_H1 / 2}
          frame={frame}
          fps={fps}
          enterAt={d1spec.enter}
          elevated={d1Active}
          rotate={d1Rot}
        />
        <Card
          spec={d2spec}
          x={d2.x - CARD_W / 2}
          y={d2.y - DRAG_H2 / 2}
          frame={frame}
          fps={fps}
          enterAt={d2spec.enter}
          elevated={d2Active}
          rotate={d2Rot}
        />

        {/* ripples + cursor */}
        {RIPPLES.map((r) => (
          <Ripple key={r.at} frame={frame} at={r.at} x={r.x} y={r.y} />
        ))}
        <Cursor x={curX} y={curY} opacity={curOpacity} press={press} />
      </div>
    </AbsoluteFill>
  );
};
