import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AG,
  AgentAvatar,
  ChatWallpaper,
  Composer,
  Cursor,
  EASE,
  FONT,
  MeMsg,
  Mention,
  MentionPicker,
  R,
  SHADOW,
  SPRINGS,
  SystemLine,
  T,
  TeamilyLockup,
  TeamilyMark,
  Typing,
  PaperWorld,
  safePadX,
  useCam,
  useTypewriter,
} from "./kit";
import type { Agent } from "./kit";

// ============================================================================
// TmP5TagAndType — 1080x1080 @ 30fps
// VO: "Open a chat, tag the agents you want, and type the job like you're
//      texting a friend."
//
// One continuous scene: a real Teamily chat pane on paper. The camera lives
// inside the composer interaction — click, @-tag three real agents through the
// real MentionPicker, type the job, hit the paper-plane, watch it post.
//
// Layout is PANE-LOCAL inside a clipped card; the camera works in world coords
// (world = PANE origin + local).
// ============================================================================

export const DURATION_IN_FRAMES = 244;

// ---------------------------------------------------------------------------
// World / pane geometry
// ---------------------------------------------------------------------------
const PANE = { x: 180, y: 300, w: 880, h: 1360 };
const COMPOSER_X = 40;
const COMPOSER_W = 800;
const COMPOSER_BOTTOM = 1320; // local
const PICKER_X = 70;
const PICKER_W = 500;

// Thread content (pane-local, before the send-scroll)
const SYS1_Y = 460;
const WELCOME_Y = 520;
const SYS2_Y = 930;

// After-send thread
const SCROLL_AT = 154;
const SCROLL_BY = 500;
const ME_Y = 600;
const TYPE_ROWS_Y = [830, 915, 1000];

// ---------------------------------------------------------------------------
// Cast — real agents only
// ---------------------------------------------------------------------------
const MEMBERS: Agent[] = [
  AG.contentCreator,
  AG.uiDesigner,
  AG.frontendDev,
  AG.brandGuardian,
  AG.seoSpecialist,
];

const matches = (a: Agent, q: string) => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return a.name
    .toLowerCase()
    .split(" ")
    .some((word) => word.startsWith(needle));
};

// ---------------------------------------------------------------------------
// Beat timing
// ---------------------------------------------------------------------------
const CLICK_IN = 16;

type Pick = {
  open: number;
  typeAt: number; // -1 = no filter letters
  query: string;
  hiAt: number;
  hiIndex: number;
  click: number;
  agent: Agent;
};

const PICKS: Pick[] = [
  { open: 38, typeAt: -1, query: "", hiAt: 46, hiIndex: 1, click: 52, agent: AG.uiDesigner },
  { open: 58, typeAt: 63, query: "fr", hiAt: 69, hiIndex: 0, click: 76, agent: AG.frontendDev },
  { open: 84, typeAt: 88, query: "co", hiAt: 93, hiIndex: 0, click: 96, agent: AG.contentCreator },
];

const PICKER_IN = 5;
const PICKER_EXIT = 8;

const MSG = "can you guys put together a landing page for a dog treat subscription?";
const TYPE_START = 120;
const TYPE_CPF = 3.2;

const SEND_AT = 150;
const CLEAR_AT = 154;

const ME_ENTER = 157;
const TYPING_ENTER = [176, 184, 192];

// ---------------------------------------------------------------------------
// Camera — hold → move → hold, tiny pushes inside one composer interaction
// ---------------------------------------------------------------------------
const KEY_T = [0, 22, 38, 100, 118, 162, 182, 214, 244];
const KEY_FX = [620, 620, 624, 624, 618, 618, 620, 620, 620];
const KEY_FY = [1268, 1268, 1186, 1186, 1272, 1272, 1128, 1128, 1128];
const KEY_Z = [1.07, 1.07, 1.05, 1.05, 1.08, 1.08, 0.96, 0.96, 0.96];

// Cursor path (world coords)
const CUR_T = [0, 14, 16, 36, 48, 56, 62, 70, 80, 88, 96, 108, 118, 140, 150, 244];
const CUR_X = [1250, 430, 430, 430, 402, 402, 430, 402, 430, 402, 402, 500, 860, 860, 958, 958];
const CUR_Y = [1830, 1556, 1556, 1556, 1188, 1188, 1330, 1396, 1430, 1396, 1396, 1480, 1612, 1612, 1566, 1566];

/** Click frames + the frozen point the ripple fires from. */
const CLICKS: Array<{ at: number; x: number; y: number }> = [
  { at: CLICK_IN, x: 430, y: 1556 },
  { at: PICKS[0].click, x: 402, y: 1188 },
  { at: PICKS[1].click, x: 402, y: 1396 },
  { at: PICKS[2].click, x: 402, y: 1396 },
  { at: SEND_AT, x: 958, y: 1566 },
];

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

/** The group's opening message from Teamily Agent (real mark = real avatar). */
const TeamilyWelcome: React.FC<{ x: number; y: number; w: number; enter: number }> = ({
  x,
  y,
  w,
  enter,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 14}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
      <TeamilyMark size={48} style={{ borderRadius: R.full }} />
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: T.ink }}>
        Teamily Agent
      </div>
    </div>
    <div
      style={{
        marginLeft: 62,
        background: T.card,
        borderRadius: R.xl,
        boxShadow: SHADOW.bubble,
        padding: 22,
        fontFamily: FONT,
        fontSize: 26,
        lineHeight: 1.45,
        color: T.ink,
      }}
    >
      Hi there! Welcome to the group.
      <div
        style={{
          marginTop: 16,
          borderRadius: R.lg,
          border: `1.5px solid ${T.lineSoft}`,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F3FBF6 100%)",
          padding: "20px 22px 22px",
        }}
      >
        <TeamilyLockup width={150} />
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 1.6,
            color: T.greenText,
          }}
        >
          THE HUMAN + AI SOCIAL PLATFORM
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.14,
            color: T.ink2,
          }}
        >
          Welcome to
          <br />
          <span style={{ color: T.green }}>Teamily Group</span>
        </div>
      </div>
    </div>
  </div>
);

/** Compact "agent is typing" row: avatar + name + the dots bubble. */
const TypingRow: React.FC<{ x: number; y: number; agent: Agent; enter: number }> = ({
  x,
  y,
  agent,
  enter,
}) => (
  <>
    <AgentAvatar
      agent={agent}
      size={44}
      style={{
        position: "absolute",
        left: x,
        top: y + 14,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 10}px)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: x + 58,
        top: y,
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 700,
        color: T.slate,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 10}px)`,
      }}
    >
      {agent.name}
    </div>
    <Typing x={x + 58} y={y + 30} enter={enter} />
  </>
);

/** Click ripple in world coordinates. */
const Ripple: React.FC<{ frame: number; at: number; x: number; y: number }> = ({
  frame,
  at,
  x,
  y,
}) => {
  if (frame < at || frame > at + 14) return null;
  const t = (frame - at) / 14;
  const r = 16 + t * 52;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: R.full,
        border: `3px solid ${T.green}`,
        opacity: 0.55 * (1 - t),
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const TmP5TagAndType: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Never let the pane push past the 5% side safe margins.
  const zCap = (width - safePadX(width) * 2) / PANE.w;
  const rawCam = useCam({ keys: KEY_T, fx: KEY_FX, fy: KEY_FY, z: KEY_Z });
  const cam = { ...rawCam, z: Math.min(rawCam.z, zCap) };

  const pop = (
    at: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.pop
  ) => (frame < at ? 0 : spring({ frame: frame - at, fps, config }));

  // --- composer state -------------------------------------------------------
  const cleared = frame >= CLEAR_AT;
  const active = PICKS.find((p) => frame >= p.open && frame < p.click) ?? null;
  const query = active
    ? active.typeAt < 0
      ? ""
      : active.query.slice(
          0,
          Math.max(0, Math.min(active.query.length, Math.floor((frame - active.typeAt) / 2.5)))
        )
    : "";

  const committed = cleared ? [] : PICKS.filter((p) => frame >= p.click);
  const typedRaw = useTypewriter(MSG, TYPE_START, TYPE_CPF);
  const typed = cleared ? "" : typedRaw;
  const hasContent = !cleared && (committed.length > 0 || active !== null);

  const composerH = interpolate(frame, [0, 116, 126, 140, 152, 158], [150, 150, 186, 222, 222, 150], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const composerTop = COMPOSER_BOTTOM - composerH;
  const pickerBottom = PANE.h - (composerTop - 14);

  const focus = interpolate(frame, [CLICK_IN - 2, CLICK_IN + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sendPress = interpolate(frame, [SEND_AT, SEND_AT + 3, SEND_AT + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- picker ---------------------------------------------------------------
  const shown = PICKS.find((p) => frame >= p.open && frame < p.click + PICKER_EXIT) ?? null;
  const pickerQuery = shown
    ? shown.typeAt < 0
      ? ""
      : shown.query.slice(
          0,
          Math.max(0, Math.min(shown.query.length, Math.floor((frame - shown.typeAt) / 2.5)))
        )
    : "";
  const pickerList = shown ? MEMBERS.filter((a) => matches(a, pickerQuery)) : [];
  // Opacity must reach a true 1 almost immediately and HOLD there: the panel
  // is an opaque surface in the real app, and any sustained sub-1 opacity lets
  // the welcome card behind it bleed through and read as a render glitch.
  // So the fade is 2 frames; the *slide* below carries the motion instead.
  const pickerEnter = shown
    ? interpolate(frame, [shown.open, shown.open + 2], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }) *
      interpolate(frame, [shown.click, shown.click + 3], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  // The visible pop: a short rise + settle at full opacity.
  const pickerRise = shown
    ? interpolate(frame, [shown.open, shown.open + PICKER_IN + 3], [16, 0], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const highlight = shown && frame >= shown.hiAt ? shown.hiIndex : -1;

  // --- thread ---------------------------------------------------------------
  const scroll = pop(SCROLL_AT, SPRINGS.snappy) * SCROLL_BY;
  const meEnter = pop(ME_ENTER);
  const sysEnter = pop(-20, SPRINGS.snappy);

  // --- cursor ---------------------------------------------------------------
  const opts = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: EASE };
  let curX = interpolate(frame, CUR_T, CUR_X, opts);
  let curY = interpolate(frame, CUR_T, CUR_Y, opts);
  if (frame > 156) {
    curX += Math.sin((frame - 156) * 0.1) * 4;
    curY += Math.cos((frame - 156) * 0.08) * 3;
  }
  const curOpacity = interpolate(frame, [0, 8, 156, 170], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let press = 0;
  for (const c of CLICKS) {
    if (frame >= c.at && frame <= c.at + 6)
      press = Math.max(press, 1 - Math.abs(frame - c.at - 3) / 3);
  }

  return (
    <PaperWorld cam={cam}>
      {/* ---- the chat pane (clips the thread as it scrolls) ---- */}
      <div
        style={{
          position: "absolute",
          left: PANE.x,
          top: PANE.y,
          width: PANE.w,
          height: PANE.h,
          borderRadius: R.xxl,
          background: T.card,
          border: `1.5px solid ${T.paperLine}`,
          boxShadow: SHADOW.window,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <ChatWallpaper x={0} y={0} w={PANE.w} h={PANE.h} />

        {/* pre-existing thread */}
        <SystemLine x={40} y={SYS1_Y - scroll} w={800} enter={sysEnter} names="You">
          created the group
        </SystemLine>
        <TeamilyWelcome x={40} y={WELCOME_Y - scroll} w={760} enter={sysEnter} />
        <SystemLine
          x={40}
          y={SYS2_Y - scroll}
          w={800}
          enter={sysEnter}
          names="Content Creator, UI Designer, Frontend Developer"
        >
          and 2 others were invited to the group
        </SystemLine>

        {/* the message, once sent */}
        {frame >= ME_ENTER ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: PANE.w, height: 0 }}>
            <MeMsg right={40} y={ME_Y} maxW={720} enter={meEnter} size={26}>
              {PICKS.map((p) => (
                <Mention key={p.agent.file} name={p.agent.name} size={25} onGreen />
              ))}
              {MSG}
            </MeMsg>
          </div>
        ) : null}

        {/* the tagged agents pick it up */}
        {PICKS.map((p, i) =>
          frame >= TYPING_ENTER[i] ? (
            <TypingRow
              key={p.agent.file}
              x={40}
              y={TYPE_ROWS_Y[i]}
              agent={p.agent}
              enter={pop(TYPING_ENTER[i])}
            />
          ) : null
        )}

        {/* composer */}
        <Composer
          x={COMPOSER_X}
          y={composerTop}
          w={COMPOSER_W}
          h={composerH}
          armed={hasContent}
          caret={frame >= CLICK_IN}
          focus={focus}
          press={sendPress}
        >
          {committed.map((p) => (
            <Mention key={p.agent.file} name={p.agent.name} />
          ))}
          {active ? <span>@{query}</span> : null}
          {typed ? <span>{typed}</span> : null}
        </Composer>

        {/* the @-picker floating above the composer */}
        {shown && pickerEnter > 0.005 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 30,
              transform: `translateY(${pickerRise}px)`,
            }}
          >
            <MentionPicker
              x={PICKER_X}
              bottom={pickerBottom}
              w={PICKER_W}
              agents={pickerList}
              highlight={highlight}
              enter={pickerEnter}
            />
          </div>
        ) : null}
      </div>

      {/* ---- pointer layer, in world coords over the app ---- */}
      {CLICKS.map((c) => (
        <Ripple key={c.at} frame={frame} at={c.at} x={c.x + 6} y={c.y + 6} />
      ))}
      <Cursor x={curX} y={curY} opacity={curOpacity} scale={1 - press * 0.14} />
    </PaperWorld>
  );
};
