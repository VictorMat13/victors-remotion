import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringConfig } from "remotion";
import {
  AG,
  AgentAvatar,
  AgentMsg,
  AppWindow,
  AvatarStack,
  ChatHeader,
  ChatRow,
  Composer,
  FONT,
  GreenHalo,
  HumanAvatar,
  MeMsg,
  PaperWorld,
  R,
  SHADOW,
  SPRINGS,
  SystemLine,
  T,
  TeamilyMark,
  useCam,
} from "./kit";
import type { Agent } from "./kit";

// ============================================================================
// TmP3InsideMessenger — 1080×1920, 30fps
// VO: "They live inside a messenger, sitting in your group chats like real
//      people, all sharing one memory."
//
// ONE continuous paper world, one keyframed camera travelling down it:
//   0–50    OPEN TIGHT  — the real Teamily list column, rail at the edge.
//                          Rows stagger in, unread badge ticks, a preview
//                          line updates.
//   50–72   MOVE        — pan right into the group thread.
//   72–108  HOLD        — 2×2 header, the members strip where human discs and
//                          real agent avatars sit interleaved at one size,
//                          then human → agent → human → agent messages land.
//   108–156 PULL BACK   — the camera falls down the world column; the threads
//                          reappear as four floating chat cards.
//   156–200 LAND        — one shared memory core below them; thin green
//                          threads draw from every card into it, packets
//                          travel inward, the core pulses on each arrival.
//   200–225 HOLD        — near-still, packets drifting.
// ============================================================================

export const DURATION_IN_FRAMES = 226;

// ---------------------------------------------------------------------------
// World geometry
// ---------------------------------------------------------------------------

const WIN = { x: 60, y: 260, w: 1420, h: 1400 };
const RAIL_W = 150;
const LIST_W = 470;
const PANE_X = RAIL_W + LIST_W; // 620, window-local
const PANE_W = WIN.w - PANE_X; // 800

// list column
const ROW_X = 166;
const ROW_W = 438;
const ROW_H = 112;
const ROW_Y0 = 140;
const ROW_PITCH = 126;

// floating chat cards (beat 3/4) — two columns with a corridor at x≈810 so
// the top row's threads run past the bottom row instead of through it.
const CARD_W = 480;
const CARD_H = 260;
const CARD_POS = [
  { x: 305, y: 2020 },
  { x: 835, y: 2020 },
  { x: 305, y: 2400 },
  { x: 835, y: 2400 },
];

// memory core
const CORE = { x: 575, y: 3110, w: 470, h: 400 };
const CORE_CX = CORE.x + CORE.w / 2; // 810
const NODE_CY = 3210;

// thread timing
const LINE_STARTS = [154, 160, 166, 172];
const LINE_DRAW = 20;
const LINE_DONE = [174, 180, 186, 192];
const PACKET_PERIOD = 34;
const PACKET_PHASES = [0, 0.34, 0.67];

// ---------------------------------------------------------------------------
// Path sampling (same technique as the approved NotionP3 comp)
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };

const cubicAt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

type PathTable = { d: string; pts: Pt[]; cum: number[]; total: number };
type Seg = [Pt, Pt, Pt, Pt];

const buildPath = (segs: Seg[]): PathTable => {
  const pts: Pt[] = [segs[0][0]];
  let d = `M ${segs[0][0].x} ${segs[0][0].y}`;
  for (let s = 0; s < segs.length; s++) {
    const g = segs[s];
    d += ` C ${g[1].x} ${g[1].y}, ${g[2].x} ${g[2].y}, ${g[3].x} ${g[3].y}`;
    for (let i = 1; i <= 90; i++) pts.push(cubicAt(g[0], g[1], g[2], g[3], i / 90));
  }
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { d, pts, cum, total: cum[cum.length - 1] };
};

const P = (x: number, y: number): Pt => ({ x, y });

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

const CORE_TOP = CORE.y + 4;

const THREADS: PathTable[] = [
  // top-left: slide into the central corridor, then run down past the row below
  buildPath([
    [P(745, 2280), P(745, 2330), P(800, 2330), P(800, 2385)],
    [P(800, 2385), P(800, 2700), P(775, 2900), P(760, CORE_TOP)],
  ]),
  // top-right
  buildPath([
    [P(875, 2280), P(875, 2330), P(820, 2330), P(820, 2385)],
    [P(820, 2385), P(820, 2700), P(850, 2900), P(862, CORE_TOP)],
  ]),
  // bottom-left
  buildPath([[P(545, 2660), P(545, 2880), P(700, 2900), P(700, CORE_TOP)]]),
  // bottom-right
  buildPath([[P(1075, 2660), P(1075, 2880), P(920, 2900), P(920, CORE_TOP)]]),
];

// ---------------------------------------------------------------------------
// Real content — real rooms, real agents, real product copy
// ---------------------------------------------------------------------------

const GUILD: Agent[] = [
  AG.codeReviewer,
  AG.seniorDeveloper,
  AG.gitWorkflowMaster,
  AG.rapidPrototyper,
];
const DEVOPS: Agent[] = [
  AG.incidentCommander,
  AG.devopsAutomator,
  AG.backendArchitect,
  AG.databaseOptimizer,
];

type ListRow = {
  title: string;
  time?: string;
  preview: string;
  agent?: Agent;
  stack?: Agent[];
  mark?: boolean;
  active?: boolean;
};

const LIST_ROWS: ListRow[] = [
  {
    title: "victormat123's Personal AI",
    preview: "Your Cross-context Super AI Agent.",
    mark: true,
    active: true,
  },
  {
    title: "Code Review Guild",
    time: "13:35",
    preview: "Reality Checker, Code Reviewer,…",
    stack: GUILD,
  },
  {
    title: "Reliability & DevOps Room",
    time: "13:35",
    preview: "Incident Response Commander,…",
    stack: DEVOPS,
  },
  {
    title: "Trend Researcher",
    time: "13:32",
    preview: "12 sources on the launch, sorted.",
    agent: AG.trendResearcher,
  },
  {
    title: "Growth Hacker",
    time: "13:28",
    preview: "Where's the drop-off in the funnel?",
    agent: AG.growthHacker,
  },
  {
    title: "Data Engineer",
    time: "13:21",
    preview: "Backfill finished — 4.1M rows.",
    agent: AG.dataEngineer,
  },
];

const PREVIEW_UPDATED = "Step 3 — 41% leave at the plan picker.";

// members of the Code Review Guild: humans and agents, one row, one size
const MEMBERS: Array<{ agent?: Agent; initial?: string; tint?: string }> = [
  { initial: "M", tint: "#D7E3F4" },
  { agent: AG.codeReviewer },
  { initial: "J", tint: "#F2E2D6" },
  { agent: AG.seniorDeveloper },
  { initial: "A", tint: "#DCE7DC" },
  { agent: AG.gitWorkflowMaster },
];

type CardSpec = {
  title: string;
  last: string;
  stack?: Agent[];
  agent?: Agent;
  mark?: boolean;
  members: Array<{ agent?: Agent; initial?: string; tint?: string }>;
};

const CARDS: CardSpec[] = [
  {
    title: "Code Review Guild",
    last: "Patch is up. Tests are green on staging.",
    stack: GUILD,
    members: [{ initial: "M", tint: "#D7E3F4" }, { agent: AG.codeReviewer }, { agent: AG.seniorDeveloper }],
  },
  {
    title: "Reliability & DevOps Room",
    last: "Error budget back above 99.9%.",
    stack: DEVOPS,
    members: [{ initial: "J", tint: "#F2E2D6" }, { agent: AG.incidentCommander }, { agent: AG.devopsAutomator }],
  },
  {
    title: "victormat123's Personal AI",
    last: "Your Cross-context Super AI Agent.",
    mark: true,
    members: [{ initial: "V", tint: "#E3DCF4" }, { agent: AG.chiefOfStaff }, { agent: AG.projectShepherd }],
  },
  {
    title: "Trend Researcher",
    last: "12 sources on the launch, sorted.",
    agent: AG.trendResearcher,
    members: [{ initial: "V", tint: "#E3DCF4" }, { agent: AG.trendResearcher }],
  },
];

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

/** A person's message — deliberately the SAME layout the app gives an agent. */
const HumanMsg: React.FC<{
  x: number;
  y: number;
  w: number;
  initial: string;
  name: string;
  tint?: string;
  enter?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, initial, name, tint, enter = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 16}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
      <HumanAvatar initial={initial} size={48} tint={tint} />
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: T.ink }}>{name}</div>
    </div>
    <div
      style={{
        marginLeft: 62,
        background: T.card,
        borderRadius: R.xl,
        boxShadow: SHADOW.bubble,
        padding: 26,
        fontFamily: FONT,
        fontSize: 27,
        lineHeight: 1.45,
        color: T.ink,
      }}
    >
      {children}
    </div>
  </div>
);

const SearchField: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: 172,
        top: 26,
        width: 366,
        height: 72,
        borderRadius: R.full,
        background: T.bgSubtle,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 24px",
        boxSizing: "border-box",
      }}
    >
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={2.2}>
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5 L21 21" strokeLinecap="round" />
      </svg>
      <div style={{ fontFamily: FONT, fontSize: 24, color: T.muted }}>Search</div>
    </div>
    <div
      style={{
        position: "absolute",
        left: 562,
        top: 44,
        width: 36,
        height: 36,
        fontFamily: FONT,
        fontSize: 40,
        fontWeight: 400,
        lineHeight: "34px",
        color: T.slate,
        textAlign: "center",
      }}
    >
      +
    </div>
  </>
);

/** Circular unread count — real messenger chrome, brand green. */
const UnreadBadge: React.FC<{ x: number; y: number; count: number; pop: number; enter: number }> = ({
  x,
  y,
  count,
  pop,
  enter,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 40,
      height: 40,
      borderRadius: R.full,
      background: T.brand400,
      border: `3px solid ${T.card}`,
      boxSizing: "border-box",
      color: "#FFFFFF",
      fontFamily: FONT,
      fontSize: 22,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: enter,
      transform: `scale(${enter * (1 + 0.22 * pop)})`,
      boxShadow: "0 4px 12px rgba(0,201,81,0.30)",
    }}
  >
    {count}
  </div>
);

const MemberDisc: React.FC<{ m: { agent?: Agent; initial?: string; tint?: string }; size: number }> = ({
  m,
  size,
}) =>
  m.agent ? (
    <AgentAvatar agent={m.agent} size={size} />
  ) : (
    <HumanAvatar initial={m.initial ?? "?"} size={size} tint={m.tint} />
  );

/** A thread lifted out of the app and floating on paper. */
const ChatCard: React.FC<{ spec: CardSpec; x: number; y: number; enter: number; linked: number }> = ({
  spec,
  x,
  y,
  enter,
  linked,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: CARD_W,
      height: CARD_H,
      borderRadius: R.xl,
      background: T.card,
      border: `1.5px solid ${linked > 0.5 ? T.greenLine : T.line}`,
      boxShadow: SHADOW.lg,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 34}px)`,
      boxSizing: "border-box",
    }}
  >
    <div style={{ position: "absolute", left: 26, top: 24 }}>
      {spec.stack ? (
        <AvatarStack agents={spec.stack} size={78} />
      ) : spec.mark ? (
        <TeamilyMark size={78} />
      ) : spec.agent ? (
        <AgentAvatar agent={spec.agent} size={78} />
      ) : null}
    </div>
    <div
      style={{
        position: "absolute",
        left: 122,
        top: 34,
        width: 306,
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 600,
        color: T.ink,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {spec.title}
    </div>
    <div
      style={{
        position: "absolute",
        left: 122,
        top: 84,
        width: 332,
        fontFamily: FONT,
        fontSize: 26,
        color: T.muted,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {spec.last}
    </div>
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 146,
        width: CARD_W - 52,
        height: 1.5,
        background: T.lineSoft,
      }}
    />
    <div style={{ position: "absolute", left: 26, top: 176, display: "flex", gap: 14 }}>
      {spec.members.map((m, i) => (
        <MemberDisc key={i} m={m} size={52} />
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        right: 24,
        top: 30,
        width: 16,
        height: 16,
        borderRadius: R.full,
        background: T.brand400,
        opacity: linked,
        transform: `scale(${0.5 + 0.5 * linked})`,
        boxShadow: "0 0 0 5px rgba(0,201,81,0.16)",
      }}
    />
  </div>
);

/** The shared memory core — built off the real Memory section. */
const MemoryCore: React.FC<{ enter: number; pulse: number }> = ({ enter, pulse }) => (
  <>
    <GreenHalo cx={CORE_CX} cy={NODE_CY} r={330} strength={(0.55 + 1.5 * pulse) * enter} />
    <div
      style={{
        position: "absolute",
        left: CORE.x,
        top: CORE.y,
        width: CORE.w,
        height: CORE.h,
        borderRadius: 52,
        background: T.card,
        border: `2px solid ${T.greenLine}`,
        boxShadow: SHADOW.xl,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px) scale(${1 + 0.012 * pulse})`,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* knowledge-map node — the real Memory Overview glyph */}
      <svg
        width={CORE.w}
        height={230}
        viewBox={`0 0 ${CORE.w} 230`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <path
          d="M113 50 L215 100"
          stroke={T.line}
          strokeWidth={2}
          strokeDasharray="6 8"
          fill="none"
        />
        <path
          d="M255 130 L363 152"
          stroke={T.line}
          strokeWidth={2}
          strokeDasharray="6 8"
          fill="none"
        />
        <circle cx={113} cy={50} r={10} fill={T.brand400} />
        <circle cx={363} cy={152} r={10} fill="#38BDF8" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: CORE.w / 2 - 68,
          top: 34,
          width: 136,
          height: 136,
          borderRadius: 30,
          background: T.brand50,
          border: `2.5px solid ${T.brand300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 ${8 * pulse}px rgba(0,201,81,0.14)`,
        }}
      >
        <svg
          width={74}
          height={74}
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.brand600}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="6" rx="1.5" />
          <rect x="2.5" y="15" width="6" height="6" rx="1.5" />
          <rect x="15.5" y="15" width="6" height="6" rx="1.5" />
          <path d="M12 9v3" />
          <path d="M5.5 15v-3h13v3" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 222,
          width: CORE.w - 80,
          height: 1.5,
          background: T.lineSoft,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 258,
          width: 62,
          height: 62,
          borderRadius: R.full,
          background: "#A855F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.9} strokeLinejoin="round">
          <path d="M12 2.6 20.4 7v10L12 21.4 3.6 17V7z" />
          <path d="M3.6 7 12 11.5 20.4 7" />
          <path d="M12 11.5V21.4" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 122,
          top: 256,
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 700,
          color: T.ink,
        }}
      >
        My Artifacts
      </div>
      <div
        style={{
          position: "absolute",
          left: 122,
          top: 296,
          fontFamily: FONT,
          fontSize: 24,
          color: T.muted,
        }}
      >
        All deliverables agents made
      </div>
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const TmP3InsideMessenger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = (at: number, config: Partial<SpringConfig> = SPRINGS.pop, dur = 26) =>
    spring({ frame: frame - at, fps, config, durationInFrames: dur });

  // ---- camera: hold → move → hold → move → hold → move → long hold --------
  const cam = useCam({
    keys: [0, 50, 72, 108, 130, 138, 156, 200, 214, 225],
    fx: [370, 370, 1080, 1080, 950, 950, 810, 810, 810, 810],
    fy: [763, 763, 880, 880, 2280, 2280, 2786, 2786, 2784, 2783],
    z: [1.54, 1.54, 1.2, 1.2, 0.94, 0.94, 0.9, 0.9, 0.8995, 0.899],
  });

  // ---- beat 1 micro-motion ------------------------------------------------
  const badgeEnter = interpolate(frame, [30, 37], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeCount = frame >= 42 ? 2 : 1;
  const badgePop = interpolate(frame, [42, 46, 54], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const previewSwap = interpolate(frame, [44, 49], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- core pulse: one decaying spike per packet arrival -------------------
  let pulse = 0;
  for (let i = 0; i < THREADS.length; i++) {
    for (let p = 0; p < PACKET_PHASES.length; p++) {
      for (let n = 0; n < 8; n++) {
        const arrive = LINE_DONE[i] + PACKET_PERIOD * (n + 1 - PACKET_PHASES[p]);
        if (arrive > frame) break;
        pulse += interpolate(frame - arrive, [0, 3, 22], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
      }
    }
  }
  pulse = Math.min(1, pulse * 0.75);

  const coreEnter = sp(138, SPRINGS.snappy, 30);

  return (
    <PaperWorld
      cam={cam}
      grid={{ left: -1200, top: -1200, width: 4200, height: 6400 }}
    >
      {/* =================== the real Teamily messenger =================== */}
      <AppWindow
        x={WIN.x}
        y={WIN.y}
        w={WIN.w}
        h={WIN.h}
        railW={RAIL_W}
        listW={LIST_W}
        active="Chat"
        railScale={1.35}
      >
        <SearchField />

        {LIST_ROWS.map((row, i) => {
          // the list is already building when the clip opens
          const enter = sp(-10 + i * 5, SPRINGS.pop, 24);
          const y = ROW_Y0 + i * ROW_PITCH;
          if (i === 4) {
            // the preview line updates mid-hold: the old line dissolves off
            // the row and the new one is underneath
            return (
              <React.Fragment key={row.title}>
                <ChatRow
                  x={ROW_X}
                  y={y}
                  w={ROW_W}
                  h={ROW_H}
                  title={row.title}
                  time={row.time}
                  preview={PREVIEW_UPDATED}
                  agent={row.agent}
                  enter={enter}
                />
                <div
                  style={{
                    position: "absolute",
                    left: ROW_X + 104,
                    top: y + 58,
                    width: ROW_W - 126,
                    height: 34,
                    background: T.card,
                    opacity: enter * (1 - previewSwap),
                    fontFamily: FONT,
                    fontSize: 22,
                    lineHeight: "34px",
                    color: T.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.preview}
                </div>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={row.title}>
              <ChatRow
                x={ROW_X}
                y={y}
                w={ROW_W}
                h={ROW_H}
                title={row.title}
                time={row.time}
                preview={row.preview}
                agent={row.agent}
                stack={row.stack}
                active={row.active}
                enter={enter}
              />
              {row.mark ? (
                <TeamilyMark
                  size={64}
                  style={{
                    position: "absolute",
                    left: ROW_X + 22,
                    top: y + (ROW_H - 64) / 2,
                    opacity: enter,
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}

        <UnreadBadge
          x={ROW_X + 52}
          y={ROW_Y0 + 3 * ROW_PITCH + 16}
          count={badgeCount}
          pop={badgePop}
          enter={badgeEnter}
        />

        {/* --------------------------- the thread -------------------------- */}
        <ChatHeader
          x={PANE_X}
          y={0}
          w={PANE_W}
          h={116}
          title="Code Review Guild"
          badge="Members Pay"
          sub="6 members"
          stack={GUILD}
        />

        {/* members strip: people and agents, one row, one size */}
        <div
          style={{
            position: "absolute",
            left: PANE_X + 40,
            top: 140,
            width: PANE_W - 80,
            height: 100,
            borderRadius: R.full,
            background: T.card,
            border: `1.5px solid ${T.lineSoft}`,
            boxShadow: SHADOW.bubble,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            opacity: sp(44, SPRINGS.smooth, 20),
            boxSizing: "border-box",
          }}
        >
          {MEMBERS.map((m, i) => {
            const e = sp(46 + i * 3, SPRINGS.pop, 22);
            return (
              <div key={i} style={{ opacity: e, transform: `scale(${0.6 + 0.4 * e})` }}>
                <MemberDisc m={m} size={68} />
              </div>
            );
          })}
        </div>

        <SystemLine x={PANE_X + 40} y={390} w={PANE_W - 80} names="You" enter={sp(48, SPRINGS.smooth, 20)}>
          created the group
        </SystemLine>

        <MeMsg right={40} y={444} maxW={520} enter={sp(52)}>
          Checkout drops 1 in 5 sessions since Friday.
        </MeMsg>

        <AgentMsg x={PANE_X + 40} y={586} w={580} agent={AG.codeReviewer} enter={sp(60)}>
          Found it — line 212 drops the promise on retry.
        </AgentMsg>

        <HumanMsg
          x={PANE_X + 40}
          y={800}
          w={580}
          initial="M"
          name="Marta"
          tint="#D7E3F4"
          enter={sp(70)}
        >
          I can ship the fix after standup.
        </HumanMsg>

        <AgentMsg x={PANE_X + 40} y={975} w={580} agent={AG.seniorDeveloper} enter={sp(80)}>
          Patch is up. Tests are green on staging.
        </AgentMsg>

        <Composer x={PANE_X + 40} y={1200} w={PANE_W - 80} h={150} enter={sp(42, SPRINGS.smooth, 20)} />
      </AppWindow>

      {/* ==================== threads into the memory core ================== */}
      <svg
        width={2000}
        height={1600}
        viewBox="0 0 2000 1600"
        style={{ position: "absolute", left: 0, top: 2000, overflow: "visible" }}
      >
        <g transform="translate(0,-2000)">
          {THREADS.map((tab, i) => {
            const p = interpolate(
              frame,
              [LINE_STARTS[i], LINE_STARTS[i] + LINE_DRAW],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.cubic),
              },
            );
            if (p <= 0.004) return null;
            const head = p < 0.999 ? pointAt(tab, p) : null;
            return (
              <g key={`ln-${i}`}>
                <path
                  d={tab.d}
                  pathLength={1}
                  fill="none"
                  stroke={T.brand400}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - p}
                  opacity={0.62}
                />
                {head ? (
                  <>
                    <circle cx={head.x} cy={head.y} r={14} fill={T.brand400} opacity={0.18} />
                    <circle cx={head.x} cy={head.y} r={7} fill={T.brand500} />
                  </>
                ) : null}
              </g>
            );
          })}

          {THREADS.map((tab, i) => {
            const born = LINE_DONE[i];
            if (frame < born) return null;
            return PACKET_PHASES.map((phase, k) => {
              const t = ((frame - born) / PACKET_PERIOD + phase) % 1;
              const pt = pointAt(tab, t);
              const fade =
                interpolate(t, [0, 0.08], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) *
                interpolate(t, [0.9, 0.99], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
              return (
                <g key={`pk-${i}-${k}`} opacity={fade}>
                  <circle cx={pt.x} cy={pt.y} r={16} fill={T.brand400} opacity={0.16} />
                  <circle cx={pt.x} cy={pt.y} r={8} fill={T.brand500} />
                </g>
              );
            });
          })}
        </g>
      </svg>

      {/* ========================= floating chat cards ====================== */}
      {CARDS.map((spec, i) => {
        const linked = interpolate(frame, [LINE_DONE[i], LINE_DONE[i] + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const drift = frame > 160 ? 2.5 * Math.sin(frame / 43 + i * 1.9) : 0;
        return (
          <ChatCard
            key={spec.title}
            spec={spec}
            x={CARD_POS[i].x}
            y={CARD_POS[i].y + drift}
            enter={sp(116 + i * 6, SPRINGS.pop, 28)}
            linked={linked}
          />
        );
      })}

      {/* ========================== shared memory core ====================== */}
      <MemoryCore enter={coreEnter} pulse={pulse} />
    </PaperWorld>
  );
};
