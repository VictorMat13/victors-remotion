import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AG,
  AUTOMATIONS,
  AgentAvatar,
  ChatWallpaper,
  DeliveryCard,
  EASE,
  FONT,
  GreenHalo,
  PaperWorld,
  R,
  SHADOW,
  SPRINGS,
  SystemLine,
  T,
  TButton,
  TCard,
  TChip,
  Typing,
  useCam,
} from "./kit";
import type { Agent } from "./kit";

// ============================================================================
// TmP7FeedFullOfThese — 1080×1920
// VO: "And the feed is full of these. (nothing) One that watches your market
//      and posts updates into the chat on its own. One that turns a whole
//      thread into a finished deck."
//
// One paper world, three zones stacked vertically, one keyframed camera:
//   ZONE 1  y  130..1570  the real Automations grid (Work tab) scrolling fast
//   ZONE 2  y 2140..3520  the REAL "Competitor / industry monitor" automation
//                         + a thread where Trend Researcher posts on its own
//   ZONE 3  y 4200..5608  the REAL "Make a deck / report" automation + a long
//                         thread collapsing into a SLIDES delivery
//
// Everything named on screen is real: the twelve AUTOMATIONS presets verbatim
// from the app, real agent names + real avatars + real (truncated) marketplace
// descriptions, real Slides artifact type.
// ============================================================================

export const DURATION_IN_FRAMES = 405;

/* ------------------------------------------------------------------ camera */

// hold (grid + the scripted pause) → whip → hold (auto-post) → travel → hold
const KEY_T = [0, 126, 148, 258, 280, 380, 404];
const KEY_FX = [540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [880, 880, 2830, 2830, 4624, 4624, 4624];
const KEY_Z = [1, 1, 1, 1, 1, 1, 1];

/* ------------------------------------------------------------------- world */

// Zone 1 — the Automations grid
const TABS_Y = 168;
const WIN = { x: 40, y: 268, w: 1000, h: 1302 };
const CARD_W = 462;
const CARD_H = 236;
const ROW_PITCH = 260;
const COL_X = [26, 512]; // local to WIN
const SCROLL_TO = 1560;
const SCROLL_END = 88;

// Zone 2 — market watcher
const MON = { x: 66, y: 2140, w: 948, h: 300 };
const CHAT = { x: 66, y: 2472, w: 948, h: 1048 };

// Zone 3 — thread → deck
const DECK = { x: 66, y: 3920, w: 948, h: 320 };
const THREAD = { x: 66, y: 4280, w: 948, h: 1048 };
const DELIV = { x: 66, y: 4280, w: 948, h: 540 };
const THUMB_W = 296;
const THUMB_H = 186;
const THUMB_SLOTS = [
  { x: 68, y: 4860, rot: -2.5 },
  { x: 392, y: 4860, rot: 0 },
  { x: 716, y: 4860, rot: 2.5 },
  { x: 230, y: 5074, rot: -1.6 },
  { x: 554, y: 5074, rot: 1.6 },
];

/* ------------------------------------------------------------------ glyphs */

type GlyphKey =
  | "bell"
  | "news"
  | "eye"
  | "search"
  | "chart"
  | "globe"
  | "clipboard"
  | "contrast"
  | "trending"
  | "target"
  | "inbox"
  | "clock"
  | "doc";

const GLYPH_D: Record<GlyphKey, string[]> = {
  bell: ["M12 3.2a5 5 0 0 0-5 5v3.3L5.4 15h13.2L17 11.5V8.2a5 5 0 0 0-5-5Z", "M9.9 18a2.2 2.2 0 0 0 4.2 0"],
  news: ["M4.2 5.2h12.6v13.6H6.2a2 2 0 0 1-2-2Z", "M16.8 9.2h3v7.6a2 2 0 0 1-2 2", "M7.2 8.6h6.6", "M7.2 12h6.6", "M7.2 15.4h4"],
  eye: ["M2.6 12S6.2 6.2 12 6.2 21.4 12 21.4 12 17.8 17.8 12 17.8 2.6 12 2.6 12Z", "M12 9.4A2.6 2.6 0 1 0 12 14.6a2.6 2.6 0 0 0 0-5.2Z"],
  search: ["M10.4 4.4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z", "M14.9 14.9 20 20"],
  chart: ["M4.2 19h15.6", "M7.4 16.2V10", "M12 16.2V5.6", "M16.6 16.2v-4.4"],
  globe: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M3.2 12h17.6", "M12 3c3 3.6 3 14.4 0 18", "M12 3c-3 3.6-3 14.4 0 18"],
  clipboard: ["M9.4 3.8h5.2v2.8H9.4z", "M7.6 5.4H5.4v14.2h13.2V5.4h-2.2", "M8.6 11h6.8", "M8.6 15h4.6"],
  contrast: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 3v18", "M15.4 5.2v13.6"],
  trending: ["M4 16.6 9.2 11.4l3.4 3.4L20 7.4", "M15.2 7.4H20v4.8"],
  target: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Z", "M12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"],
  inbox: ["M4 13.2h4.2l1.5 2.8h4.6l1.5-2.8H20", "M4 13.2 6.6 5h10.8L20 13.2v5.6H4Z"],
  clock: ["M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z", "M12 6.9v5.5l3.6 2.1"],
  doc: ["M7 3.4h6.8L18 7.6v13H7Z", "M13.6 3.4v4.4H18", "M9.6 12.4h5.8", "M9.6 15.8h4"],
};

const Glyph: React.FC<{ k: GlyphKey; size: number; color?: string; w?: number }> = ({
  k,
  size,
  color = T.greenDeep,
  w = 1.7,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    {GLYPH_D[k].map((d, i) => (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

/* ------------------------------------------------------------------- atoms */

const iv = (frame: number, range: number[], out: number[], ease = EASE) =>
  interpolate(frame, range, out, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const IconTile: React.FC<{ x: number; y: number; size: number; k: GlyphKey }> = ({
  x,
  y,
  size,
  k,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size * 0.29,
      background: T.greenTint,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Glyph k={k} size={size * 0.5} w={size > 70 ? 1.6 : 1.8} />
  </div>
);

const Lines: React.FC<{ text: string; size: number; width: number; top: number; left: number }> = ({
  text,
  size,
  width,
  top,
  left,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      fontFamily: FONT,
      fontSize: size,
      lineHeight: 1.34,
      color: T.muted,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }}
  >
    {text}
  </div>
);

/* ------------------------------------------------- zone 1 — grid card types */

const AUTO_ICONS: GlyphKey[] = [
  "bell",
  "news",
  "eye",
  "search",
  "chart",
  "globe",
  "clipboard",
  "contrast",
  "trending",
  "target",
  "inbox",
  "clock",
];

/** Real marketplace agents — names + avatars from the kit, descriptions
 *  verbatim (truncated, as the app truncates them) from avatars/manifest.json. */
const GRID_AGENTS: { agent: Agent; desc: string }[] = [
  { agent: AG.contentCreator, desc: "Expert content strategist and creator for multi-platform campaigns. Develops editorial calendars…" },
  { agent: AG.frontendDev, desc: "Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks…" },
  { agent: AG.uxResearcher, desc: "Expert user experience researcher specializing in user behavior analysis, usability testing…" },
  { agent: AG.productManager, desc: "Holistic product leader who owns the full product lifecycle — from discovery and strategy…" },
  { agent: AG.growthHacker, desc: "Expert growth strategist specializing in rapid user acquisition through data-driven experimentation…" },
  { agent: AG.uiDesigner, desc: "Expert UI designer specializing in visual design systems, component libraries…" },
  { agent: AG.seoSpecialist, desc: "Expert search engine optimization strategist specializing in technical SEO, content optimization…" },
  { agent: AG.codeReviewer, desc: "Expert code reviewer who provides constructive, actionable feedback focused on correctness…" },
  { agent: AG.financialAnalyst, desc: "Expert financial analyst specializing in financial modeling, forecasting, scenario analysis…" },
  { agent: AG.chiefOfStaff, desc: "Master coordinator for founders and executives — filters noise, owns processes, routes decisions…" },
  { agent: AG.technicalWriter, desc: "Expert technical writer specializing in developer documentation, API references, README files…" },
  { agent: AG.backendArchitect, desc: "Senior backend architect specializing in scalable system design, database architecture…" },
  { agent: AG.devopsAutomator, desc: "Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development…" },
  { agent: AG.dataEngineer, desc: "Expert data engineer specializing in building reliable data pipelines, lakehouse architectures…" },
];

const GRID_ROWS = 13;

const AutomationCard: React.FC<{ x: number; y: number; title: string; desc: string; k: GlyphKey }> = ({
  x,
  y,
  title,
  desc,
  k,
}) => (
  <TCard x={x} y={y} w={CARD_W} h={CARD_H} r={26} shadow={SHADOW.md}>
    <IconTile x={26} y={24} size={62} k={k} />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 104,
        width: 410,
        fontFamily: FONT,
        fontSize: 31,
        fontWeight: 700,
        color: T.ink,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {title}
    </div>
    <Lines text={desc} size={22} width={410} top={150} left={26} />
  </TCard>
);

const AgentCard: React.FC<{ x: number; y: number; agent: Agent; desc: string }> = ({
  x,
  y,
  agent,
  desc,
}) => (
  <TCard x={x} y={y} w={CARD_W} h={CARD_H} r={26} shadow={SHADOW.md}>
    <AgentAvatar agent={agent} size={62} style={{ position: "absolute", left: 26, top: 24 }} />
    <TButton label="Chat" size={17} style={{ position: "absolute", right: 26, top: 34 }} />
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 104,
        width: 410,
        fontFamily: FONT,
        fontSize: 31,
        fontWeight: 700,
        color: T.ink,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {agent.name}
    </div>
    <Lines text={desc} size={22} width={410} top={150} left={26} />
  </TCard>
);

/* ------------------------------------------------------- zone 2 — auto chip */

const AutoChip: React.FC<{ x: number; y: number; label: string; pulse: number }> = ({
  x,
  y,
  label,
  pulse,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 20px",
      borderRadius: R.full,
      background: T.greenTint,
      border: `1.5px solid ${T.greenLine}`,
      fontFamily: FONT,
      fontSize: 23,
      fontWeight: 700,
      color: T.greenText,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: R.full,
        background: T.green,
        opacity: pulse,
        display: "inline-block",
      }}
    />
    <Glyph k="clock" size={22} w={1.9} />
    {label}
  </div>
);

/** An unprompted agent post: avatar + name + AUTO chip + timestamp, then the
 *  white bubble. Same anatomy as the kit's AgentMsg, plus the automation tell. */
const AutoMsg: React.FC<{
  x: number;
  y: number;
  w: number;
  agent: Agent;
  time: string;
  enter: number;
  children: React.ReactNode;
}> = ({ x, y, w, agent, time, enter, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 18}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, height: 54 }}>
      <AgentAvatar agent={agent} size={54} />
      <div style={{ fontFamily: FONT, fontSize: 29, fontWeight: 700, color: T.ink }}>
        {agent.name}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 13px",
          borderRadius: R.full,
          background: T.greenTint,
          border: `1.5px solid ${T.greenLine}`,
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          color: T.greenText,
        }}
      >
        <Glyph k="clock" size={18} w={2} />
        Auto
      </div>
      <div style={{ marginLeft: "auto", fontFamily: FONT, fontSize: 22, color: T.muted }}>
        {time}
      </div>
    </div>
    <div
      style={{
        marginLeft: 68,
        width: w - 68,
        background: T.card,
        borderRadius: R.xl,
        boxShadow: SHADOW.bubble,
        padding: 24,
        boxSizing: "border-box",
        fontFamily: FONT,
        color: T.ink,
      }}
    >
      {children}
    </div>
  </div>
);

const Bullet: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginTop: 12 }}>
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: R.full,
        background: T.green,
        marginTop: 12,
        flexShrink: 0,
      }}
    />
    <span style={{ fontFamily: FONT, fontSize: 26, lineHeight: 1.35, color: T.slate }}>{text}</span>
  </div>
);

/* -------------------------------------------------- zone 3 — thread + deck */

type Bub = { side: "a" | "m"; h: number; w: number; agent?: Agent; lines: number[] };

const THREAD_BUBBLES: Bub[] = [
  { side: "a", h: 104, w: 620, agent: AG.trendResearcher, lines: [0.86, 0.52] },
  { side: "m", h: 84, w: 470, lines: [0.78] },
  { side: "a", h: 148, w: 700, agent: AG.docGenerator, lines: [0.92, 0.8, 0.44] },
  { side: "m", h: 84, w: 410, lines: [0.7] },
  { side: "a", h: 122, w: 660, agent: AG.uxResearcher, lines: [0.88, 0.6] },
  { side: "m", h: 84, w: 520, lines: [0.82] },
  { side: "a", h: 134, w: 680, agent: AG.visualStoryteller, lines: [0.9, 0.66] },
  { side: "m", h: 84, w: 450, lines: [0.74] },
];

const SLIDES: { title: string; chart?: boolean }[] = [
  { title: "Market overview" },
  { title: "Pricing changes", chart: true },
  { title: "Competitor moves" },
  { title: "What it means", chart: true },
  { title: "Next steps" },
];

const SlideThumb: React.FC<{ index: number; title: string; chart?: boolean }> = ({
  index,
  title,
  chart,
}) => (
  <div
    style={{
      width: THUMB_W,
      height: THUMB_H,
      borderRadius: 16,
      background: T.card,
      border: `1.5px solid ${T.line}`,
      boxShadow: SHADOW.md,
      position: "relative",
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 18,
        top: 16,
        width: 30,
        height: 30,
        borderRadius: 9,
        background: T.greenTint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: 17,
        fontWeight: 700,
        color: T.greenText,
      }}
    >
      {index + 1}
    </div>
    <div
      style={{
        position: "absolute",
        left: 18,
        top: 58,
        width: 258,
        fontFamily: FONT,
        fontSize: 24,
        fontWeight: 700,
        color: T.ink,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {title}
    </div>
    {chart ? (
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 20,
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          height: 62,
        }}
      >
        {[0.42, 0.72, 0.55, 1].map((v, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 62 * v,
              borderRadius: 5,
              background: i === 3 ? T.green : T.greenLine,
            }}
          />
        ))}
      </div>
    ) : (
      <div style={{ position: "absolute", left: 18, top: 100 }}>
        {[0.86, 0.72, 0.55].map((v, i) => (
          <div
            key={i}
            style={{
              width: 258 * v,
              height: 9,
              borderRadius: 5,
              background: "rgba(11,18,30,0.10)",
              marginBottom: 13,
            }}
          />
        ))}
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------- composition */

export const TmP7FeedFullOfThese: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cam = useCam({ keys: KEY_T, fx: KEY_FX, fy: KEY_FY, z: KEY_Z });

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.pop,
    dur = 30,
  ) =>
    frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  /* ---------------- ZONE 1 — the grid scrolls fast, then stops -------------- */

  const scrollAt = (f: number) =>
    interpolate(f, [0, SCROLL_END], [0, SCROLL_TO], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const offset = scrollAt(frame);
  const speed = offset - scrollAt(frame - 1);
  const blur = speed > 2 ? Math.min(2.4, speed * 0.05) : 0;

  const rows: React.ReactNode[] = [];
  for (let i = 0; i < GRID_ROWS; i++) {
    const ly = i * ROW_PITCH - offset;
    if (ly < -CARD_H - 60 || ly > WIN.h + 60) continue;
    for (let c = 0; c < 2; c++) {
      const idx = i * 2 + c;
      if (idx % 2 === 0) {
        const a = AUTOMATIONS[(idx / 2) % AUTOMATIONS.length];
        rows.push(
          <AutomationCard
            key={`a${idx}`}
            x={COL_X[c]}
            y={ly}
            title={a.title}
            desc={a.desc}
            k={AUTO_ICONS[(idx / 2) % AUTO_ICONS.length]}
          />,
        );
      } else {
        const g = GRID_AGENTS[((idx - 1) / 2) % GRID_AGENTS.length];
        rows.push(
          <AgentCard key={`g${idx}`} x={COL_X[c]} y={ly} agent={g.agent} desc={g.desc} />,
        );
      }
    }
  }

  /* ---------------- ZONE 2 — the watcher posts on its own ------------------ */

  const monPulse = 0.55 + 0.45 * Math.sin(frame / 8);

  // radar rings off the icon tile, every 34 frames, once the camera has landed
  const radar: number[] = [];
  for (let t = 152; t <= frame && t < 258; t += 34) {
    const age = frame - t;
    if (age >= 0 && age <= 30) radar.push(age / 30);
  }

  const H1 = 248;
  const H2 = 190;
  const GAP = 34;
  const PAD_B = 44;
  const shiftP = spr(202, SPRINGS.smooth, 26);
  const msg1Top = CHAT.h - PAD_B - H1 - shiftP * (H2 + GAP);
  const msg2Top = CHAT.h - PAD_B - H2;

  const msg1In = spr(166, SPRINGS.pop, 26);
  const msg2In = spr(218, SPRINGS.pop, 26);
  const halo1 = iv(frame, [166, 178, 208], [0, 1, 0]);
  const halo2 = iv(frame, [218, 230, 254], [0, 1, 0]);
  const typingIn = iv(frame, [206, 212, 216, 220], [0, 1, 1, 0], Easing.linear);

  /* ---------------- ZONE 3 — the thread collapses into a deck -------------- */

  const bubTops: number[] = [];
  {
    let y = 30;
    for (const b of THREAD_BUBBLES) {
      bubTops.push(y);
      y += b.h + 24;
    }
  }
  const paneFade = iv(frame, [312, 332], [1, 0]);
  const delivIn = spr(318, SPRINGS.pop, 30);

  return (
    <PaperWorld
      cam={cam}
      bg={T.paper}
      grid={{ left: -1200, top: -900, width: 3600, height: 7800 }}
    >
      {/* ==================== ZONE 1 — the Automations feed ==================== */}

      {/* real tab row: My Automations · Work (active) · Life */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: TABS_Y,
          width: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <TChip label="My Automations" tone="neutral" size={30} />
        <TChip label="Work" tone="solid" size={30} />
        <TChip label="Life" tone="neutral" size={30} />
      </div>

      <div
        style={{
          position: "absolute",
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.h,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, filter: blur > 0 ? `blur(${blur}px)` : "none" }}>
          {rows}
        </div>
        {/* paper feathering so the clip edge never reads as a hard cut */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WIN.w,
            height: 74,
            background: `linear-gradient(${T.paper} 12%, rgba(245,241,236,0) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: WIN.w,
            height: 92,
            background: `linear-gradient(rgba(245,241,236,0) 0%, ${T.paper} 82%)`,
          }}
        />
      </div>

      {/* ================= ZONE 2 — Competitor / industry monitor ============= */}

      <TCard x={MON.x} y={MON.y} w={MON.w} h={MON.h} r={30} accent shadow={SHADOW.lg}>
        {radar.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 92 - (50 + p * 34),
              top: 92 - (50 + p * 34),
              width: (50 + p * 34) * 2,
              height: (50 + p * 34) * 2,
              borderRadius: R.full,
              border: `2px solid ${T.green}`,
              opacity: 0.26 * (1 - p),
            }}
          />
        ))}
        <IconTile x={44} y={44} size={96} k="eye" />
        <AutoChip x={MON.w - 44 - 236} y={62} label="Every 2h" pulse={monPulse} />
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 172,
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 700,
            color: T.ink,
            whiteSpace: "nowrap",
          }}
        >
          {AUTOMATIONS[2].title}
        </div>
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 232,
            fontFamily: FONT,
            fontSize: 30,
            color: T.muted,
            whiteSpace: "nowrap",
          }}
        >
          {AUTOMATIONS[2].desc}
        </div>
      </TCard>

      <TCard x={CHAT.x} y={CHAT.y} w={CHAT.w} h={CHAT.h} r={30} style={{ overflow: "hidden" }}>
        <ChatWallpaper x={0} y={0} w={CHAT.w} h={CHAT.h} />
        <SystemLine x={0} y={38} w={CHAT.w} size={22}>
          Today
        </SystemLine>

        {halo1 > 0 ? (
          <GreenHalo cx={CHAT.w / 2} cy={msg1Top + H1 / 2 + 30} r={430} strength={halo1} />
        ) : null}
        {halo2 > 0 ? (
          <GreenHalo cx={CHAT.w / 2} cy={msg2Top + H2 / 2 + 30} r={380} strength={halo2} />
        ) : null}

        {msg1In > 0 ? (
          <AutoMsg
            x={64}
            y={msg1Top}
            w={820}
            agent={AG.trendResearcher}
            time="09:00"
            enter={msg1In}
          >
            <div style={{ fontSize: 30, fontWeight: 700, color: T.ink }}>3 changes since 07:00</div>
            <Bullet text="A competitor moved to usage-based pricing" />
            <Bullet text="Two rivals shipped agent marketplaces" />
          </AutoMsg>
        ) : null}

        {typingIn > 0 ? <Typing x={132} y={msg2Top + 66} enter={typingIn} /> : null}

        {msg2In > 0 ? (
          <AutoMsg
            x={64}
            y={msg2Top}
            w={820}
            agent={AG.trendResearcher}
            time="11:00"
            enter={msg2In}
          >
            <div style={{ fontSize: 27, lineHeight: 1.4, color: T.ink }}>
              2 more since 09:00 — the pricing page changed again, and a comparison page went live.
            </div>
          </AutoMsg>
        ) : null}
      </TCard>

      {/* =================== ZONE 3 — Make a deck / report ==================== */}

      <TCard x={DECK.x} y={DECK.y} w={DECK.w} h={DECK.h} r={30} accent shadow={SHADOW.lg}>
        <IconTile x={44} y={44} size={96} k="chart" />
        <TChip
          label="Slides"
          tone="green"
          size={23}
          style={{ position: "absolute", right: 44, top: 62 }}
        />
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 178,
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 700,
            color: T.ink,
            whiteSpace: "nowrap",
          }}
        >
          {AUTOMATIONS[4].title}
        </div>
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 238,
            fontFamily: FONT,
            fontSize: 30,
            color: T.muted,
            whiteSpace: "nowrap",
          }}
        >
          {AUTOMATIONS[4].desc}
        </div>
      </TCard>

      {/* the long thread — compresses and collapses upward */}
      {paneFade > 0 ? (
        <TCard
          x={THREAD.x}
          y={THREAD.y}
          w={THREAD.w}
          h={THREAD.h}
          r={30}
          style={{ overflow: "hidden", opacity: paneFade }}
        >
          <ChatWallpaper x={0} y={0} w={THREAD.w} h={THREAD.h} />
          {THREAD_BUBBLES.map((b, i) => {
            const p = iv(frame, [292 + i * 3, 314 + i * 3], [0, 1]);
            const base = bubTops[i];
            const ty = base + (60 - base) * p;
            const isA = b.side === "a";
            const left = isA ? 40 : THREAD.w - 40 - b.w;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left,
                  top: ty,
                  width: b.w,
                  height: b.h,
                  opacity: 1 - p,
                  transform: `scaleY(${1 - 0.86 * p}) scaleX(${1 - 0.12 * p})`,
                  transformOrigin: isA ? "0% 0%" : "100% 0%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                {isA && b.agent ? (
                  <AgentAvatar agent={b.agent} size={46} style={{ marginTop: 8, flexShrink: 0 }} />
                ) : null}
                <div
                  style={{
                    flex: 1,
                    height: b.h,
                    borderRadius: R.xl,
                    background: isA ? T.card : T.brand400,
                    boxShadow: isA ? SHADOW.bubble : "0 6px 18px rgba(0,201,81,0.20)",
                    padding: "24px 24px",
                    boxSizing: "border-box",
                  }}
                >
                  {b.lines.map((v, j) => (
                    <div
                      key={j}
                      style={{
                        width: `${v * 100}%`,
                        height: 11,
                        borderRadius: 6,
                        background: isA ? "rgba(11,18,30,0.11)" : "rgba(255,255,255,0.55)",
                        marginBottom: 16,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TCard>
      ) : null}

      {/* the finished deck */}
      {delivIn > 0 ? (
        <DeliveryCard
          x={DELIV.x}
          y={DELIV.y}
          w={DELIV.w}
          h={DELIV.h}
          title="Market review — Q3"
          badge="SLIDES"
          meta="5 slides · v1 · Thought for 12s"
          enter={Math.min(1, delivIn)}
          style={{ transform: `translateY(${(1 - delivIn) * 26}px) scale(${0.94 + 0.06 * delivIn})` }}
        >
          {/* blown-up preview of slide 1 */}
          <div
            style={{
              margin: "6px 26px 0",
              height: 356,
              borderRadius: R.lg,
              background: T.bgSurface,
              border: `1.5px solid ${T.line}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 38,
                width: 9,
                height: 54,
                borderRadius: 5,
                background: T.green,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 62,
                top: 38,
                fontFamily: FONT,
                fontSize: 36,
                fontWeight: 700,
                color: T.ink,
              }}
            >
              Market overview
            </div>
            <div
              style={{
                position: "absolute",
                left: 62,
                top: 88,
                fontFamily: FONT,
                fontSize: 23,
                color: T.muted,
              }}
            >
              Q3 · what moved and where
            </div>
            <div style={{ position: "absolute", left: 62, top: 156 }}>
              {[0.62, 0.5, 0.38].map((v, i) => (
                <div
                  key={i}
                  style={{
                    width: 400 * v,
                    height: 11,
                    borderRadius: 6,
                    background: "rgba(11,18,30,0.10)",
                    marginBottom: 22,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                right: 44,
                bottom: 44,
                display: "flex",
                alignItems: "flex-end",
                gap: 20,
                height: 178,
              }}
            >
              {[0.34, 0.6, 0.48, 0.82, 1].map((v, i) => {
                const g = iv(frame, [324 + i * 4, 348 + i * 4], [0, 1]);
                return (
                  <div
                    key={i}
                    style={{
                      width: 44,
                      height: Math.max(6, 178 * v * g),
                      borderRadius: 8,
                      background: i === 4 ? T.green : T.greenLine,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </DeliveryCard>
      ) : null}

      {/* slide thumbnails fanning out */}
      {SLIDES.map((s, i) => {
        const p = spr(326 + i * 6, SPRINGS.pop, 30);
        if (p <= 0) return null;
        const slot = THUMB_SLOTS[i];
        const fromX = DELIV.x + DELIV.w / 2 - THUMB_W / 2;
        const fromY = DELIV.y + DELIV.h - 130;
        const x = fromX + (slot.x - fromX) * p;
        const y = fromY + (slot.y - fromY) * p;
        const rot = (i - 2) * 9 * (1 - p) + slot.rot * p;
        return (
          <div
            key={s.title}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: THUMB_W,
              height: THUMB_H,
              opacity: Math.min(1, p * 1.8),
              transform: `rotate(${rot}deg) scale(${0.52 + 0.48 * p})`,
              transformOrigin: "50% 50%",
            }}
          >
            <SlideThumb index={i} title={s.title} chart={s.chart} />
          </div>
        );
      })}
    </PaperWorld>
  );
};
