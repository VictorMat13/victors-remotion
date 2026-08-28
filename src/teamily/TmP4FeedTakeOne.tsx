import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AG,
  AGENT_CATEGORIES,
  AgentAvatar,
  ChatRow,
  Cursor,
  EASE,
  FONT,
  GreenHalo,
  PaperWorld,
  R,
  SHADOW,
  SPRINGS,
  T,
  TButton,
  TChip,
  TeamilyMark,
  tabular,
  useCam,
  useTypewriter,
} from "./kit";
import type { Agent } from "./kit";

// ============================================================================
// TmP4FeedTakeOne — 9:16 (1080×1920, 30fps)
// VO: "And the part that makes zero sense, you don't even build them.
//      (blank) There's a feed of agents other people already made,
//      and you just take one."
//
// Beats
//   0–70    OPEN     — the laborious "Create My Own Agent" config panel
//   70–100  DISMISS  — the whole panel lifts, collapses, slides out of frame
//   100–126 (blank)  — the scripted pause. Empty warm PAPER. Never dark.
//   126–208 FEED     — the real Agents marketplace floods in and scrolls
//   208–270 PUSH+CLICK — camera onto ONE real card, cursor presses "Chat"
//   270–322 TAKE     — the card flies across the world into the messenger
//   322–350 HOLD
// ============================================================================

export const DURATION_IN_FRAMES = 350;

/* ------------------------------------------------------------------ world */

// --- the builder panel (beat 1) -------------------------------------------
const PANEL = { x: 195, y: 375, w: 900, h: 1210 };
const PANEL_PAD = 44;
const PANEL_INNER = PANEL.w - PANEL_PAD * 2; // 812

// --- the Agents marketplace page (beat 4/5) -------------------------------
const PAGE = { x: 60, y: 180, w: 1170, h: 1740 };
const GRID_Y = 336; // page-local y where the card area starts
const GRID_PAD_TOP = 36;
const COL_W = 519;
const COL_X = [36, 615]; // page-local
const CARD_H = 150;
const PITCH = 174; // CARD_H + 24 row gap
const ROW0_Y = GRID_Y + GRID_PAD_TOP; // 372, page-local, unscrolled
const SCROLL_MAX = 939;

const HERO_I = 16; // row 8, col 0 — Trend Researcher
const HERO_ROW = Math.floor(HERO_I / 2);
const HERO_LOCAL_Y = ROW0_Y + HERO_ROW * PITCH - SCROLL_MAX; // 825
const HERO = {
  x: PAGE.x + COL_X[0], // 96
  y: PAGE.y + HERO_LOCAL_Y, // 1005
};
const HERO_CX = HERO.x + COL_W / 2; // 355.5
const HERO_CY = HERO.y + CARD_H / 2; // 1080

// --- the messenger conversation list (beat 6) -----------------------------
const MSG = { x: 1580, y: 620, w: 700, h: 860 };
const MSG_ROW = { x: 24, w: 652, h: 112, y0: 140, pitch: 120 };
const MSG_CX = MSG.x + MSG.w / 2; // 1930
const MSG_CY = MSG.y + MSG.h / 2; // 1050

// --- inside a feed card ---------------------------------------------------
const CARD_AV = 84;
const CARD_TXT_X = 114;
const CARD_TXT_W = 293;
const CARD_BTN_X = 417;
const CHAT_BTN_CX = HERO.x + CARD_BTN_X + 43; // world x of the hero "Chat" pill
const CHAT_BTN_CY = HERO.y + CARD_H / 2; // world y

/* ----------------------------------------------------------------- camera */
//        hold(builder) | mv | hold | drift(blank) | mv | hold(feed) | mv | hold(click) | travel | hold
const KEY_T = [0, 64, 86, 100, 126, 148, 208, 230, 270, 302, 322, 349];
const KEY_FX = [645, 645, 650, 650, 664, 645, 645, HERO_CX, HERO_CX, MSG_CX, MSG_CX, MSG_CX];
const KEY_FY = [980, 980, 1010, 1010, 1000, 1050, 1050, HERO_CY, HERO_CY, MSG_CY, MSG_CY, MSG_CY];
const KEY_Z = [1.06, 1.06, 0.99, 0.99, 0.972, 0.83, 0.83, 1.85, 1.85, 1.38, 1.38, 1.38];

/* ------------------------------------------------------------------- data */

type FeedAgent = Agent & { desc: string };

/** Real agents — real names, real avatars, real descriptions (manifest.json). */
const FEED: FeedAgent[] = [
  { name: "Historian", file: "academic-historian.png", desc: "Expert in historical analysis, periodization, material culture, and historiography — validates historical coherence and enriches settings with authentic period detail grounded in primary and secondary sources" },
  { name: "Psychologist", file: "academic-psychologist.png", desc: "Expert in human behavior, personality theory, motivation, and cognitive patterns — builds psychologically credible characters and interactions grounded in clinical and research frameworks" },
  { name: "Brand Guardian", file: "design-brand-guardian.png", desc: "Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic brand positioning" },
  { name: "UI Designer", file: "design-ui-designer.png", desc: "Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation. Creates beautiful, consistent, accessible user interfaces that enhance UX and reflect brand identity" },
  { name: "UX Researcher", file: "design-ux-researcher.png", desc: "Expert user experience researcher specializing in user behavior analysis, usability testing, and data-driven design insights. Provides actionable research findings that improve product usability and user satisfaction" },
  { name: "Visual Storyteller", file: "design-visual-storyteller.png", desc: "Expert visual communication specialist focused on creating compelling visual narratives, multimedia content, and brand storytelling through design. Specializes in transforming complex information into engaging visual stories." },
  { name: "Backend Architect", file: "engineering-backend-architect.png", desc: "Senior backend architect specializing in scalable system design, database architecture, API development, and cloud infrastructure. Builds robust, secure, performant server-side applications and microservices" },
  { name: "Code Reviewer", file: "engineering-code-reviewer.png", desc: "Expert code reviewer who provides constructive, actionable feedback focused on correctness, maintainability, security, and performance — not style preferences." },
  { name: "Frontend Developer", file: "engineering-frontend-developer.png", desc: "Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks, UI implementation, and performance optimization" },
  { name: "Senior Developer", file: "engineering-senior-developer.png", desc: "Premium implementation specialist - Masters Laravel/Livewire/FluxUI, advanced CSS, Three.js integration" },
  { name: "Data Engineer", file: "engineering-data-engineer.png", desc: "Expert data engineer specializing in building reliable data pipelines, lakehouse architectures, and scalable data infrastructure. Masters ETL/ELT, Apache Spark, dbt, streaming systems, and cloud data platforms." },
  { name: "Database Optimizer", file: "engineering-database-optimizer.png", desc: "Expert database specialist focusing on schema design, query optimization, indexing strategies, and performance tuning for PostgreSQL, MySQL, and modern databases like Supabase and PlanetScale." },
  { name: "DevOps Automator", file: "engineering-devops-automator.png", desc: "Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development, and cloud operations" },
  { name: "Rapid Prototyper", file: "engineering-rapid-prototyper.png", desc: "Specialized in ultra-fast proof-of-concept development and MVP creation using efficient tools and frameworks" },
  { name: "Git Workflow Master", file: "engineering-git-workflow-master.png", desc: "Expert in Git workflows, branching strategies, and version control best practices including conventional commits, rebasing, worktrees, and CI-friendly branch management." },
  { name: "Technical Writer", file: "engineering-technical-writer.png", desc: "Expert technical writer specializing in developer documentation, API references, README files, and tutorials. Transforms complex engineering concepts into clear, accurate, and engaging docs." },
  { name: "Trend Researcher", file: "product-trend-researcher.png", desc: "Expert market intelligence analyst specializing in identifying emerging trends, competitive analysis, and opportunity assessment. Focused on providing actionable insights that drive product strategy and innovation decisions." },
  { name: "Product Manager", file: "product-manager.png", desc: "Holistic product leader who owns the full product lifecycle — from discovery and strategy through roadmap, stakeholder alignment, go-to-market, and outcome measurement." },
  { name: "Growth Hacker", file: "marketing-growth-hacker.png", desc: "Expert growth strategist specializing in rapid user acquisition through data-driven experimentation. Develops viral loops, optimizes conversion funnels, and finds scalable growth channels." },
  { name: "SEO Specialist", file: "marketing-seo-specialist.png", desc: "Expert search engine optimization strategist specializing in technical SEO, content optimization, link authority building, and organic search growth." },
  { name: "Content Creator", file: "marketing-content-creator.png", desc: "Expert content strategist and creator for multi-platform campaigns. Develops editorial calendars, creates compelling copy, manages brand storytelling, and optimizes content for engagement." },
  { name: "Social Media Strategist", file: "marketing-social-media-strategist.png", desc: "Expert social media strategist for LinkedIn, Twitter, and professional platforms. Creates cross-platform campaigns, builds communities, and manages real-time engagement." },
  { name: "Financial Analyst", file: "finance-financial-analyst.png", desc: "Expert financial analyst specializing in financial modeling, forecasting, scenario analysis, and data-driven decision support. Transforms raw financial data into actionable business intelligence." },
  { name: "Pipeline Analyst", file: "sales-pipeline-analyst.png", desc: "Revenue operations analyst specializing in pipeline health diagnostics, deal velocity analysis, forecast accuracy, and data-driven sales coaching." },
  { name: "Business Strategist", file: "business-strategist.png", desc: "Senior management consulting specialist for competitive analysis, market entry strategy, business model design, growth planning, organizational strategy, and strategic decision-making." },
  { name: "Chief of Staff", file: "specialized-chief-of-staff.png", desc: "Master coordinator for founders and executives — filters noise, owns processes, enforces consistency, routes decisions, and positions outputs for impact so the boss can think clearly." },
  { name: "Project Shepherd", file: "project-management-project-shepherd.png", desc: "Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder alignment. Focused on shepherding projects from conception to completion." },
  { name: "MCP Builder", file: "specialized-mcp-builder.png", desc: "Expert Model Context Protocol developer who designs, builds, and tests MCP servers that extend AI agent capabilities with custom tools, resources, and prompts." },
];

const HERO_AGENT = FEED[HERO_I];

/** The system prompt the "hard way" makes you write — the real description. */
const SYSTEM_PROMPT = HERO_AGENT.desc;

const TOOLS = ["Web search", "File upload", "Code execution", "Memory"] as const;

/* ------------------------------------------------------------------ atoms */

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easedOpt = { easing: EASE, ...clampOpt };

const Label: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({ x, y, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 600,
      color: T.muted,
      letterSpacing: 0.3,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const Field: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  focus?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, focus = 0, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: R.md,
      background: T.bgSurface,
      border: `2px solid ${focus > 0.5 ? T.greenLine : T.line}`,
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const Toggle: React.FC<{ x: number; y: number; on: number }> = ({ x, y, on }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 78,
      height: 42,
      borderRadius: R.full,
      background: T.greySoft,
      border: `1.5px solid ${T.line}`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: -1.5,
        borderRadius: R.full,
        background: T.green,
        opacity: Math.min(1, Math.max(0, on)),
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 4 + 34 * Math.min(1, Math.max(0, on)),
        top: 4,
        width: 32,
        height: 32,
        borderRadius: R.full,
        background: "#FFFFFF",
        boxShadow: "0 2px 6px rgba(16,24,40,0.20)",
      }}
    />
  </div>
);

/** A real marketplace card: avatar · name · 2-line grey description · Chat. */
const FeedCard: React.FC<{
  x: number;
  y: number;
  agent: FeedAgent;
  enter?: number;
  press?: number;
  ring?: number;
  lift?: number;
}> = ({ x, y, agent, enter = 1, press = 0, ring = 0, lift = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: COL_W,
      height: CARD_H,
      borderRadius: R.xl,
      background: T.card,
      border: `2px solid ${ring > 0.02 ? T.green : "rgba(226,232,240,0)"}`,
      boxShadow:
        lift > 0.02
          ? `0 ${18 + 26 * lift}px ${34 + 42 * lift}px rgba(16,24,40,${0.10 + 0.10 * lift})`
          : SHADOW.bubble,
      opacity: Math.min(1, enter),
      transform: `translateY(${(1 - Math.min(1, enter)) * 26}px)`,
      boxSizing: "border-box",
    }}
  >
    <AgentAvatar
      agent={agent}
      size={CARD_AV}
      style={{ position: "absolute", left: 16, top: (CARD_H - CARD_AV) / 2 }}
    />
    <div style={{ position: "absolute", left: CARD_TXT_X, top: 31, width: CARD_TXT_W }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 27,
          fontWeight: 700,
          color: T.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {agent.name}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: FONT,
          fontSize: 18,
          lineHeight: 1.36,
          color: T.muted,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {agent.desc}
      </div>
    </div>
    <div style={{ position: "absolute", left: CARD_BTN_X, top: 53 }}>
      <TButton label="Chat" size={20} press={press} />
    </div>
  </div>
);

/* ------------------------------------------------------------ composition */

export const TmP4FeedTakeOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cam = useCam({ keys: KEY_T, fx: KEY_FX, fy: KEY_FY, z: KEY_Z });

  const spr = (t0: number, config = SPRINGS.pop, durationInFrames = 30) =>
    frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames });

  /* ---- beat 1 (0–70): the builder panel does its laborious work ---- */
  const nameTyped = useTypewriter("Trend Researcher", 4, 0.9);
  const promptTyped = useTypewriter(SYSTEM_PROMPT, 20, 4.8);
  const nameFocus = interpolate(frame, [3, 6, 20, 23], [0, 1, 1, 0], clampOpt);
  const promptFocus = interpolate(frame, [19, 22, 66, 70], [0, 1, 1, 0], clampOpt);
  const caretOn = frame > 3 && frame < 68 && frame % 16 < 9;
  const modeFocus = interpolate(frame, [26, 30, 40, 44], [0, 1, 1, 0], clampOpt);
  const toolOn = [spr(32), spr(40), spr(48), spr(56)];
  const tempP = interpolate(frame, [44, 66], [0.18, 0.72], easedOpt);
  const submitPress = interpolate(frame, [62, 66, 69], [0, 1, 0], clampOpt);

  /* ---- beat 2 (70–100): the whole thing lifts and leaves ---- */
  const pickP = interpolate(frame, [66, 74], [0, 1], easedOpt);
  const exitP = interpolate(frame, [74, 98], [0, 1], {
    easing: Easing.in(Easing.cubic),
    ...clampOpt,
  });
  const panelOpacity = interpolate(frame, [86, 97], [1, 0], clampOpt);

  /* ---- beat 3 (100–126): the scripted (blank). Paper only. ---- */

  /* ---- beat 4 (126–208): the marketplace floods in and scrolls ---- */
  const pageRise = interpolate(frame, [126, 150], [0, 1], easedOpt);
  const pageOpacity = interpolate(frame, [126, 136], [0, 1], clampOpt);
  const scroll = interpolate(frame, [150, 208], [0, SCROLL_MAX], easedOpt);

  /* ---- beat 5 (208–270): push in, cursor, press ---- */
  const veil =
    interpolate(frame, [208, 226], [0, 0.5], clampOpt) *
    interpolate(frame, [274, 296], [1, 0], clampOpt);
  const heroOnTop = frame >= 196;
  const cursorIn = interpolate(frame, [230, 234], [0, 1], clampOpt);
  const cursorTravel = interpolate(frame, [230, 250], [0, 1], easedOpt);
  const cursorOut = interpolate(frame, [264, 274], [1, 0], clampOpt);
  const pressP = interpolate(frame, [250, 254, 259, 263], [0, 1, 1, 0], clampOpt);
  const ringP = interpolate(frame, [254, 262], [0, 1], easedOpt);
  const rippleP = interpolate(frame, [253, 272], [0, 1], clampOpt);

  /* ---- beat 6 (270–322): the take ---- */
  const liftP = interpolate(frame, [263, 272], [0, 1], easedOpt);
  const flyP = interpolate(frame, [272, 300], [0, 1], easedOpt);
  const flyOpacity = interpolate(frame, [297, 300], [1, 0], clampOpt);
  const rowSlide = interpolate(frame, [284, 300], [0, 1], easedOpt);
  const newRowP = spr(299, SPRINGS.pop, 26);
  const haloP = interpolate(frame, [304, 326], [0, 1], easedOpt);

  // flight path — feed card centre → the new conversation row
  const flyFrom = { x: HERO_CX, y: HERO_CY };
  const flyTo = {
    x: MSG.x + MSG_ROW.x + MSG_ROW.w / 2,
    y: MSG.y + MSG_ROW.y0 + MSG_ROW.h / 2,
  };
  const flyCtrl = { x: (flyFrom.x + flyTo.x) / 2, y: Math.min(flyFrom.y, flyTo.y) - 430 };
  const u = 1 - flyP;
  const flyPos = {
    x: u * u * flyFrom.x + 2 * u * flyP * flyCtrl.x + flyP * flyP * flyTo.x,
    y: u * u * flyFrom.y + 2 * u * flyP * flyCtrl.y + flyP * flyP * flyTo.y,
  };
  const flyScale = 1 + 0.06 * liftP - 0.26 * flyP;
  const flyRot = -7 * Math.sin(flyP * Math.PI);

  // start point is chosen so the cursor never enters the 5% side margin
  const cursorX = interpolate(cursorTravel, [0, 1], [474, CHAT_BTN_CX - 2], clampOpt);
  const cursorY = interpolate(cursorTravel, [0, 1], [1404, CHAT_BTN_CY - 2], clampOpt);

  const existingRows: { title: string; time: string; preview: string; agent?: Agent; stack?: Agent[] }[] = [
    {
      title: "Code Review Guild",
      time: "13:35",
      preview: "Code Reviewer, Senior Developer, Git Workflow Master",
      stack: [AG.codeReviewer, AG.seniorDeveloper, AG.gitWorkflowMaster, AG.technicalWriter],
    },
    {
      title: "Reliability & DevOps",
      time: "13:35",
      preview: "Incident Response Commander, DevOps Automator",
      stack: [AG.incidentCommander, AG.devopsAutomator, AG.databaseOptimizer, AG.backendArchitect],
    },
    {
      title: "Product Manager",
      time: "12:58",
      preview: "Holistic product leader who owns the full product lifecycle",
      agent: AG.productManager,
    },
    {
      title: "UX Researcher",
      time: "11:20",
      preview: "Expert user experience researcher specializing in user behavior",
      agent: AG.uxResearcher,
    },
  ];

  return (
    <PaperWorld cam={cam} bg={T.paper}>
      {/* ================= 1 · the agent builder — the laborious way ====== */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: R.xxl,
          background: T.card,
          border: `1.5px solid ${T.paperLine}`,
          boxShadow: SHADOW.window,
          opacity: panelOpacity,
          transform: `translateY(${-2050 * exitP}px) scale(${1 + 0.03 * pickP - 0.2 * exitP}) scaleY(${1 - 0.42 * exitP})`,
          transformOrigin: "center 40%",
          boxSizing: "border-box",
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: PANEL_PAD,
            top: 40,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <TeamilyMark size={52} />
          <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: T.ink }}>
            Create My Own Agent
          </div>
        </div>

        {/* agent name */}
        <Label x={PANEL_PAD} y={130}>
          Agent name
        </Label>
        <Field x={PANEL_PAD} y={166} w={PANEL_INNER} h={70} focus={nameFocus}>
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 0,
              height: 70,
              display: "flex",
              alignItems: "center",
              fontFamily: FONT,
              fontSize: 30,
              color: T.ink,
              whiteSpace: "nowrap",
            }}
          >
            {nameTyped}
            {caretOn && frame < 22 ? (
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 32,
                  background: T.ink,
                  marginLeft: 3,
                }}
              />
            ) : null}
          </div>
        </Field>

        {/* system prompt */}
        <Label x={PANEL_PAD} y={266}>
          System prompt
        </Label>
        <Field x={PANEL_PAD} y={302} w={PANEL_INNER} h={286} focus={promptFocus}>
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 22,
              width: PANEL_INNER - 48,
              fontFamily: FONT,
              fontSize: 26,
              lineHeight: 1.55,
              color: T.ink2,
            }}
          >
            {promptTyped}
            {caretOn && frame >= 22 ? (
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 28,
                  background: T.ink,
                  marginLeft: 3,
                  transform: "translateY(4px)",
                }}
              />
            ) : null}
          </div>
        </Field>

        {/* mode select */}
        <Label x={PANEL_PAD} y={618}>
          Mode
        </Label>
        <Field x={PANEL_PAD} y={654} w={372} h={66} focus={modeFocus}>
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              top: 0,
              height: 66,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: FONT,
              fontSize: 28,
              color: T.ink,
            }}
          >
            <span>Instant</span>
            <span style={{ color: T.muted, fontSize: 22 }}>⌄</span>
          </div>
        </Field>

        {/* temperature */}
        <Label x={PANEL_PAD + 440} y={618}>
          Temperature
        </Label>
        <div
          style={{
            position: "absolute",
            left: PANEL_PAD + 440,
            top: 652,
            width: 372,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 700,
            color: T.ink,
            textAlign: "right",
            ...tabular,
          }}
        >
          {tempP.toFixed(2)}
        </div>
        <div
          style={{
            position: "absolute",
            left: PANEL_PAD + 440,
            top: 706,
            width: 372,
            height: 10,
            borderRadius: 5,
            background: T.greySoft,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PANEL_PAD + 440,
            top: 706,
            width: 372 * tempP,
            height: 10,
            borderRadius: 5,
            background: T.green,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PANEL_PAD + 440 + 372 * tempP - 17,
            top: 694,
            width: 34,
            height: 34,
            borderRadius: R.full,
            background: T.card,
            border: `3px solid ${T.green}`,
            boxSizing: "border-box",
            boxShadow: "0 2px 8px rgba(16,24,40,0.18)",
          }}
        />

        {/* tools */}
        <Label x={PANEL_PAD} y={786}>
          Tools
        </Label>
        {TOOLS.map((t, i) => (
          <React.Fragment key={t}>
            <div
              style={{
                position: "absolute",
                left: PANEL_PAD,
                top: 830 + i * 62,
                height: 42,
                display: "flex",
                alignItems: "center",
                fontFamily: FONT,
                fontSize: 28,
                color: T.ink2,
              }}
            >
              {t}
            </div>
            <Toggle x={PANEL_PAD + PANEL_INNER - 78} y={830 + i * 62} on={toolOn[i]} />
            {i < TOOLS.length - 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: PANEL_PAD,
                  top: 830 + i * 62 + 52,
                  width: PANEL_INNER,
                  height: 1.5,
                  background: T.lineSoft,
                }}
              />
            ) : null}
          </React.Fragment>
        ))}

        {/* submit */}
        <div style={{ position: "absolute", right: PANEL_PAD, bottom: 42 }}>
          <TButton label="Create Agent" size={28} press={submitPress} />
        </div>
      </div>

      {/* ================= 2 · the real Agents marketplace ================ */}
      <div
        style={{
          position: "absolute",
          left: PAGE.x,
          top: PAGE.y,
          width: PAGE.w,
          height: PAGE.h,
          borderRadius: R.xxl,
          background: T.card,
          border: `1.5px solid ${T.paperLine}`,
          boxShadow: SHADOW.window,
          overflow: "hidden",
          opacity: pageOpacity,
          transform: `translateY(${(1 - pageRise) * 780}px)`,
          boxSizing: "border-box",
        }}
      >
        {/* search + create */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 30,
            width: 660,
            height: 92,
            borderRadius: R.full,
            background: T.bgSubtle,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 32px",
            boxSizing: "border-box",
          }}
        >
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <circle cx={10.5} cy={10.5} r={6.6} stroke={T.muted} strokeWidth={2.2} />
            <path d="M15.6 15.6 L20.5 20.5" stroke={T.muted} strokeWidth={2.2} strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: FONT, fontSize: 30, color: T.muted }}>Search agents…</span>
        </div>
        <div style={{ position: "absolute", right: 30, top: 45 }}>
          <TButton
            label="Create My Own Agent"
            size={28}
            icon={<span style={{ fontSize: 32, fontWeight: 400, lineHeight: 1 }}>+</span>}
          />
        </div>

        {/* scope toggle + tabs */}
        <TChip
          label="By Teamily AI"
          tone="solid"
          size={24}
          style={{ position: "absolute", left: 30, top: 158 }}
        />
        <TChip
          label="Created by Me"
          tone="neutral"
          size={24}
          style={{
            position: "absolute",
            left: 250,
            top: 158,
            background: T.bgSubtle,
            borderColor: T.bgSubtle,
            color: T.slate,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 152,
            display: "flex",
            alignItems: "center",
            gap: 36,
          }}
        >
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: T.ink }}>Agents</div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -12,
                height: 4,
                borderRadius: 2,
                background: T.green,
              }}
            />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 600, color: T.muted }}>
            Agent Teams
          </div>
        </div>

        {/* category chips — overflow to the right exactly like the app */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 248,
            width: PAGE.w,
            display: "flex",
            gap: 16,
            flexWrap: "nowrap",
          }}
        >
          {AGENT_CATEGORIES.slice(0, 8).map((c, i) => (
            <TChip
              key={c}
              label={c}
              tone={i === 0 ? "solid" : "neutral"}
              size={25}
              style={
                i === 0
                  ? undefined
                  : { background: T.bgSubtle, borderColor: T.bgSubtle, color: T.slate }
              }
            />
          ))}
        </div>

        {/* the grid — clipped, scrolls continuously upward */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: GRID_Y,
            width: PAGE.w,
            height: PAGE.h - GRID_Y,
            background: T.bgSurface,
            borderTop: `1.5px solid ${T.lineSoft}`,
            overflow: "hidden",
          }}
        >
          {FEED.map((a, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const top = GRID_PAD_TOP + row * PITCH - scroll;
            if (top > PAGE.h - GRID_Y + 60 || top < -CARD_H - 60) return null;
            if (i === HERO_I && heroOnTop) return null;
            return (
              <FeedCard
                key={a.file}
                x={COL_X[col]}
                y={top}
                agent={a}
                enter={spr(136 + row * 3 + col * 2)}
              />
            );
          })}
        </div>
      </div>

      {/* ================= 3 · focus veil (warm paper — never dark) ======= */}
      <div
        style={{
          position: "absolute",
          left: -1600,
          top: -1600,
          width: 5600,
          height: 5800,
          background: T.paper,
          opacity: veil,
          pointerEvents: "none",
        }}
      />

      {/* ================= 4 · the messenger conversation list =========== */}
      <div
        style={{
          position: "absolute",
          left: MSG.x,
          top: MSG.y,
          width: MSG.w,
          height: MSG.h,
          borderRadius: R.xxl,
          background: T.card,
          border: `1.5px solid ${T.paperLine}`,
          boxShadow: SHADOW.window,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <TeamilyMark size={48} style={{ position: "absolute", left: 24, top: 38 }} />
        <div
          style={{
            position: "absolute",
            left: 88,
            top: 24,
            width: 520,
            height: 76,
            borderRadius: R.full,
            background: T.bgSubtle,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 26px",
            boxSizing: "border-box",
          }}
        >
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <circle cx={10.5} cy={10.5} r={6.6} stroke={T.muted} strokeWidth={2.2} />
            <path d="M15.6 15.6 L20.5 20.5" stroke={T.muted} strokeWidth={2.2} strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: FONT, fontSize: 26, color: T.muted }}>Search</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 630,
            top: 24,
            width: 46,
            height: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: 40,
            color: T.slate,
          }}
        >
          +
        </div>

        {/* the conversations you already have — they slide down on insert */}
        {existingRows.map((r, i) => (
          <ChatRow
            key={r.title}
            x={MSG_ROW.x}
            y={MSG_ROW.y0 + i * MSG_ROW.pitch + rowSlide * MSG_ROW.pitch}
            w={MSG_ROW.w}
            h={MSG_ROW.h}
            agent={r.agent}
            stack={r.stack}
            title={r.title}
            time={r.time}
            preview={r.preview}
          />
        ))}

        {/* the agent you just took — pops in as the green active pill */}
        <div
          style={{
            position: "absolute",
            left: MSG_ROW.x,
            top: MSG_ROW.y0,
            width: MSG_ROW.w,
            height: MSG_ROW.h,
            transform: `scale(${0.86 + 0.14 * Math.min(1, newRowP)})`,
            transformOrigin: "center",
            opacity: Math.min(1, newRowP * 1.4),
          }}
        >
          <GreenHalo cx={MSG_ROW.w * 0.085} cy={MSG_ROW.h / 2} r={90} strength={haloP * 0.8} />
          <ChatRow
            x={0}
            y={0}
            w={MSG_ROW.w}
            h={MSG_ROW.h}
            agent={HERO_AGENT}
            title={HERO_AGENT.name}
            time="13:41"
            preview="Expert market intelligence analyst — trends, competitors, opportunities"
            active
          />
        </div>
      </div>

      {/* ================= 5 · the hero card (crisp above the veil) ======= */}
      {heroOnTop ? (
        <div
          style={{
            position: "absolute",
            left: flyPos.x - COL_W / 2,
            top: flyPos.y - CARD_H / 2,
            width: COL_W,
            height: CARD_H,
            transform: `scale(${flyScale}) rotate(${flyRot}deg)`,
            transformOrigin: "center",
            opacity: flyOpacity,
          }}
        >
          <FeedCard
            x={0}
            y={0}
            agent={HERO_AGENT}
            press={pressP}
            ring={ringP}
            lift={Math.min(1, liftP + flyP * 0.35)}
          />
        </div>
      ) : null}

      {/* click ripple on the Chat pill */}
      {rippleP > 0 && rippleP < 1
        ? (() => {
            // capped so the ring can never reach the 5% side margin
            const rr = 34 + 24 * rippleP;
            return (
              <div
                style={{
                  position: "absolute",
                  left: CHAT_BTN_CX - rr,
                  top: CHAT_BTN_CY - rr,
                  width: rr * 2,
                  height: rr * 2,
                  borderRadius: R.full,
                  border: `3px solid rgba(0,201,81,${0.6 * (1 - rippleP)})`,
                  pointerEvents: "none",
                }}
              />
            );
          })()
        : null}

      {/* the cursor that takes it */}
      <Cursor
        x={cursorX}
        y={cursorY}
        scale={1 - 0.06 * pressP}
        opacity={cursorIn * cursorOut}
      />
    </PaperWorld>
  );
};
