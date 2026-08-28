// TmP2AlreadyKnow — 1080×1920, 30fps.
// VO: "Every time you open a normal AI, you re-explain your whole project from
//      scratch. Teamily's agents already know it."
//
// ONE tall world column, one keyframed camera travelling down it.
//   world y  220…1550  — a plain, non-Teamily chat (neutral greys, no green).
//                        A long project brief types into the composer and sends.
//                        A "New chat" wipe clears it, the SAME brief types again,
//                        and a third ghosted copy stacks behind → three
//                        near-identical grey walls of text.
//   world y 1970…3390  — Teamily. The real Memory pane (knowledge-map node +
//                        four attached pages with #tags) sits above a real
//                        Teamily thread. The human sends ONE short green line,
//                        the memory lights up, the agent answers immediately.
//
// The punchline is scale: three long grey paragraphs vs one short green line
// that gets a better answer, because the context already exists.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AG,
  AgentMsg,
  ChatHeader,
  ChatWallpaper,
  Composer,
  Cursor,
  FONT,
  GreenHalo,
  MeMsg,
  PaperWorld,
  R,
  SHADOW,
  SPRINGS,
  T,
  Typing,
  safePadX,
  useCam,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 240;

// ---------------------------------------------------------------------------
// World geometry — derived from the 5% safe pad, never hardcoded to the edge
// ---------------------------------------------------------------------------

const VIEW_W = 1080;
const PAD = safePadX(VIEW_W); // 54
const CX = VIEW_W / 2; // camera fx for the whole clip

/** Zooms used here: 1.132 up top, 1.08 down in Teamily. */
const Z_A = 1.132;
const Z_B = 1.08;
const halfAt = (z: number) => Math.floor((VIEW_W / 2 - PAD) / z);

// -- region A: the plain, non-Teamily chat -----------------------------------
const A_W = Math.min(840, halfAt(Z_A) * 2); // 840 — half 420 < 429 ✓
const A_X = CX - A_W / 2; // 120
const A_Y = 220;
const A_H = 990;

const A_HEAD_H = 96;
const A_MSG_TOP = A_HEAD_H;
const A_MSG_BOT = 640;
const A_COMP = { x: 28, y: 664, w: A_W - 56, h: 300 };

const WALL_W = 720;
const WALL_X = A_W - 28 - WALL_W; // right aligned inside the panel
/** Bottom-anchored stack. The oldest wall clips on the pane edge — the pile
 *  visibly runs off the top, which is the whole feeling of the beat. */
const SLOT_0 = A_MSG_BOT - 16 - 194; // 462
const SLOT_1 = SLOT_0 - 204; // 258
const SLOT_2 = SLOT_1 - 204; // 54

// -- region B: Teamily -------------------------------------------------------
const B_W = Math.min(860, halfAt(Z_B) * 2); // 860 — half 430 < 450 ✓
const B_X = CX - B_W / 2; // 110

const MEM = { x: B_X, y: 1700, w: B_W, h: 590 };
const CHAT = { x: B_X, y: 2380, w: B_W, h: 640 };

const NODE = { x: 158, y: 327, s: 124 }; // memory-card local
/** Two unlabelled satellites so the knowledge map reads as a map, not a stub. */
const SATS = [
  { x: 60, y: 196, r: 9 },
  { x: 76, y: 470, r: 7 },
];
const PAGE_X = 262;
const PAGE_W = 572;
const PAGE_H = 100;
const PAGE_Y = [100, 218, 336, 454];

const A_FOCUS = A_Y + A_H / 2; // 755
const B_FOCUS = (MEM.y + CHAT.y + CHAT.h) / 2; // 2360

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const F = {
  typeA: 2,
  sendA: 36,
  wallA: 36,
  newChat: 66,
  wipe: 66,
  shiftA: 68,
  typeB: 72,
  sendB: 94,
  wallB: 94,
  ghost: 98,
  travel: 114,
  land: 150,
  typeC: 152,
  sendC: 168,
  memHi: 172,
  pulse: 178,
  dots: 180,
  reply: 196,
};

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const iv = (f: number, range: number[], out: number[]) =>
  interpolate(f, range, out, CLAMP);

// ---------------------------------------------------------------------------
// Copy — all of it is real message / page content, never narration
// ---------------------------------------------------------------------------

const BRIEF =
  "We're building a B2B analytics tool for ops teams. Next.js + Postgres, ICP is 50–200 seat SaaS, main competitor prices per seat, and we're rewriting the pricing page this week. Tone is plain, no hype.";

const ASK = "ok what's next on the pricing page?";

const REPLY =
  "Per-seat is their move, not ours — the 50–200 seat tier is where you win. I'll redo the middle plan and the compare table.";

const PAGES: { title: string; tags: string }[] = [
  { title: "Pricing & packaging", tags: "#pricing  #gtm" },
  { title: "ICP — 50–200 seat SaaS", tags: "#icp  #research" },
  { title: "Stack: Next.js + Postgres", tags: "#stack  #engineering" },
  { title: "Competitor teardown", tags: "#competitors  #pricing" },
];

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Bar: React.FC<{ x: number; y: number; w: number; h: number; c: string }> = ({
  x,
  y,
  w,
  h,
  c,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: h / 2,
      background: c,
    }}
  />
);

/** One grey wall of re-explained project brief. */
const GreyWall: React.FC<{ y: number; opacity: number; enter: number }> = ({
  y,
  opacity,
  enter,
}) => (
  <div
    style={{
      position: "absolute",
      left: WALL_X,
      top: y,
      width: WALL_W,
      borderRadius: 22,
      background: T.greySoft,
      border: `1.5px solid #E3E7ED`,
      padding: "24px 24px 26px",
      boxSizing: "border-box",
      fontFamily: FONT,
      fontSize: 25,
      lineHeight: 1.44,
      color: "#5B6472",
      opacity: opacity * enter,
      transform: `translateY(${(1 - enter) * 18}px)`,
    }}
  >
    {BRIEF}
  </div>
);

/** The plain, non-Teamily chat. Neutral greys only — no brand anywhere. */
const PlainChat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed1 = useTypewriter(BRIEF, F.typeA, 5.9);
  const typed2 = useTypewriter(BRIEF, F.typeB, 9.6);
  const composing =
    frame < F.sendA ? typed1 : frame >= F.typeB && frame < F.sendB ? typed2 : "";
  const caret =
    (frame >= F.typeA && frame < F.sendA) || (frame >= F.typeB && frame < F.sendB);
  const blink = Math.floor(frame / 6) % 2 === 0;
  const armed = composing.length > 0;

  const wallAIn = spring({ frame: frame - F.wallA, fps, config: SPRINGS.pop });
  const wallBIn = spring({ frame: frame - F.wallB, fps, config: SPRINGS.pop });
  const ghostIn = iv(frame, [F.ghost, F.ghost + 12], [0, 1]);

  // wall A rides from the newest slot up into the pile as the chat is reset
  const aY = iv(frame, [F.shiftA, F.shiftA + 14], [SLOT_0, SLOT_1]);
  const aOp = iv(frame, [F.shiftA, F.shiftA + 14], [1, 0.62]);

  const wipeX = iv(frame, [F.wipe, F.wipe + 11], [-400, A_W + 40]);
  const press = iv(frame, [F.newChat - 3, F.newChat, F.newChat + 6], [0, 1, 0]);

  const sendPress = Math.max(
    iv(frame, [F.sendA - 3, F.sendA, F.sendA + 6], [0, 1, 0]),
    iv(frame, [F.sendB - 3, F.sendB, F.sendB + 6], [0, 1, 0]),
  );

  return (
    <div
      style={{
        position: "absolute",
        left: A_X,
        top: A_Y,
        width: A_W,
        height: A_H,
        borderRadius: 30,
        background: T.card,
        border: `1.5px solid ${T.line}`,
        boxShadow: SHADOW.window,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ---- message area (clips the wipe) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: A_MSG_TOP,
          width: A_W,
          height: A_MSG_BOT - A_MSG_TOP,
          background: T.bgSurface,
          overflow: "hidden",
        }}
      >
        {frame >= F.ghost ? (
          <GreyWall y={SLOT_2 - A_MSG_TOP} opacity={0.32} enter={ghostIn} />
        ) : null}
        {frame >= F.wallA ? (
          <GreyWall y={aY - A_MSG_TOP} opacity={aOp} enter={wallAIn} />
        ) : null}
        {frame >= F.wallB ? (
          <GreyWall y={SLOT_0 - A_MSG_TOP} opacity={1} enter={wallBIn} />
        ) : null}

        {frame >= F.wipe && frame <= F.wipe + 12 ? (
          <div
            style={{
              position: "absolute",
              left: wipeX,
              top: 0,
              width: 400,
              height: A_MSG_BOT - A_MSG_TOP,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 40%, #FFFFFF 62%, rgba(255,255,255,0) 100%)",
            }}
          />
        ) : null}
      </div>

      {/* ---- header: generic grey identity + a New chat button */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: A_W,
          height: A_HEAD_H,
          background: T.card,
          borderBottom: `1.5px solid ${T.lineSoft}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 25,
            width: 46,
            height: 46,
            borderRadius: R.full,
            background: "#DFE3E9",
          }}
        />
        <Bar x={94} y={32} w={206} h={14} c="#E4E8EE" />
        <Bar x={94} y={58} w={130} h={11} c="#EDF0F4" />
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 24,
            width: 172,
            height: 48,
            borderRadius: R.full,
            background: press > 0.4 ? "#E7EAEF" : "#F1F3F7",
            border: `1.5px solid #E2E6EC`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 600,
            color: T.slate,
            transform: `scale(${1 - press * 0.05})`,
            boxSizing: "border-box",
          }}
        >
          New chat
        </div>
      </div>

      {/* ---- composer (plain, grey, no brand) */}
      <div
        style={{
          position: "absolute",
          left: A_COMP.x,
          top: A_COMP.y,
          width: A_COMP.w,
          height: A_COMP.h,
          borderRadius: 28,
          background: T.card,
          border: `2px solid ${T.line}`,
          boxShadow: SHADOW.md,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "22px 26px 18px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            lineHeight: 1.42,
            color: T.ink2,
          }}
        >
          {composing}
          {caret ? (
            <span
              style={{
                display: "inline-block",
                width: 2.5,
                height: 30,
                background: T.slate,
                opacity: blink ? 0.9 : 0,
                marginLeft: 2,
                transform: "translateY(5px)",
              }}
            />
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: R.full,
                border: `2px solid #DCE1E8`,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: "auto",
              width: 54,
              height: 54,
              borderRadius: R.full,
              background: armed ? "#8A93A0" : "#D3D8DF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 - sendPress * 0.09})`,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19V5M12 5l-6 6M12 5l6 6"
                stroke="#FFFFFF"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/** The hand doing the work: type → send → New chat → type → send. */
const CursorRig: React.FC = () => {
  const frame = useCurrentFrame();
  const keys = [0, 24, 34, 44, 58, 68, 78, 88, 96];
  const xs = [530, 552, 872, 872, 838, 838, 320, 872, 872];
  const ys = [905, 925, 1120, 1120, 256, 256, 930, 1120, 1120];
  const x = interpolate(frame, keys, xs, CLAMP);
  const y = interpolate(frame, keys, ys, CLAMP);
  const fade = iv(frame, [F.wallB + 2, F.wallB + 14], [1, 0]);
  const clicks = [
    { at: F.sendA, x: 872, y: 1120 },
    { at: F.newChat, x: 838, y: 256 },
    { at: F.sendB, x: 872, y: 1120 },
  ];
  const pressed = clicks.some((c) => frame >= c.at - 2 && frame <= c.at + 4);
  if (fade <= 0.01) return null;

  return (
    <>
      {clicks.map((c, i) => {
        const t = iv(frame, [c.at, c.at + 14], [0, 1]);
        if (frame < c.at || t >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - 60,
              top: c.y - 60,
              width: 120,
              height: 120,
              borderRadius: 999,
              border: `3px solid ${T.grey}`,
              opacity: (1 - t) * 0.5,
              transform: `scale(${0.25 + t * 0.85})`,
            }}
          />
        );
      })}
      <Cursor x={x} y={y} scale={1.15 * (pressed ? 0.9 : 1)} opacity={fade} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Memory — the product's real Memory pane
// ---------------------------------------------------------------------------

const NodeGlyph: React.FC = () => (
  <svg width={68} height={68} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2.6" width="6" height="6" rx="1.7" stroke={T.green} strokeWidth={1.9} />
    <rect x="2.6" y="15.4" width="6" height="6" rx="1.7" stroke={T.green} strokeWidth={1.9} />
    <rect x="15.4" y="15.4" width="6" height="6" rx="1.7" stroke={T.green} strokeWidth={1.9} />
    <path
      d="M12 8.6v3.4M5.6 15.4V12M18.4 15.4V12M5.6 12h12.8"
      stroke={T.green}
      strokeWidth={1.9}
      strokeLinecap="round"
    />
  </svg>
);

const DocGlyph: React.FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <path
      d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"
      stroke={T.slate}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <path d="M14 3v5h5M9 13h6M9 17h4" stroke={T.slate} strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

const MemoryPane: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1.0 + 0.28 * Math.sin(frame / 17);

  return (
    <div
      style={{
        position: "absolute",
        left: MEM.x,
        top: MEM.y,
        width: MEM.w,
        height: MEM.h,
        borderRadius: R.xxl,
        background: T.card,
        border: `1.5px solid ${T.line}`,
        boxShadow: SHADOW.window,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 22,
          fontFamily: FONT,
          fontSize: 27,
          fontWeight: 700,
          color: T.ink,
        }}
      >
        Memory Overview
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 74,
          width: MEM.w,
          height: 1.5,
          background: T.lineSoft,
        }}
      />

      <GreenHalo cx={NODE.x} cy={NODE.y} r={215} strength={breathe} />

      {/* the knowledge map: node → pages, plus two unlabelled satellites */}
      <svg
        width={MEM.w}
        height={MEM.h}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {PAGE_Y.map((py, i) => (
          <path
            key={i}
            d={`M ${NODE.x + NODE.s / 2} ${NODE.y} C ${NODE.x + NODE.s / 2 + 44} ${NODE.y}, ${
              PAGE_X - 44
            } ${py + PAGE_H / 2}, ${PAGE_X} ${py + PAGE_H / 2}`}
            stroke={T.brand300}
            strokeWidth={2.6}
            fill="none"
            strokeDasharray="7 9"
          />
        ))}
        {SATS.map((s, i) => (
          <g key={i}>
            <path
              d={`M ${NODE.x - NODE.s / 2 + 6} ${NODE.y} L ${s.x + s.r} ${s.y}`}
              stroke={T.brand300}
              strokeWidth={2.2}
              fill="none"
              strokeDasharray="6 9"
              opacity={0.75}
            />
            <circle cx={s.x} cy={s.y} r={s.r} fill={T.brand300} />
          </g>
        ))}
      </svg>

      {/* the knowledge-map node */}
      <div
        style={{
          position: "absolute",
          left: NODE.x - NODE.s / 2,
          top: NODE.y - NODE.s / 2,
          width: NODE.s,
          height: NODE.s,
          borderRadius: 32,
          background: T.greenTint,
          border: `2.4px solid ${T.brand300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <NodeGlyph />
      </div>

      {PAGE_Y.map((py, i) => {
        const hi = interpolate(
          frame,
          [F.memHi + i * 4, F.memHi + 7 + i * 4, F.memHi + 30 + i * 4],
          [0, 1, 0.3],
          CLAMP,
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAGE_X,
              top: py,
              width: PAGE_W,
              height: PAGE_H,
              borderRadius: R.lg,
              background: hi > 0.02 ? T.greenTint : T.bgSurface,
              border: `1.5px solid ${hi > 0.02 ? T.greenLine : T.line}`,
              boxSizing: "border-box",
              transform: `translateX(${hi * 5}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 29,
                width: 42,
                height: 42,
                borderRadius: R.full,
                background: T.card,
                border: `1.5px solid ${T.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DocGlyph />
            </div>
            <div
              style={{
                position: "absolute",
                left: 72,
                top: 18,
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 700,
                color: T.ink,
                whiteSpace: "nowrap",
              }}
            >
              {PAGES[i].title}
            </div>
            <div
              style={{
                position: "absolute",
                left: 72,
                top: 54,
                fontFamily: FONT,
                fontSize: 20,
                color: T.muted,
              }}
            >
              {PAGES[i].tags}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// The Teamily thread
// ---------------------------------------------------------------------------

const TeamilyThread: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed = useTypewriter(ASK, F.typeC, 2.5);
  const composing = frame < F.sendC ? typed : "";
  const meIn = spring({ frame: frame - F.sendC, fps, config: SPRINGS.pop });
  const replyIn = spring({ frame: frame - F.reply, fps, config: SPRINGS.pop });
  const dots = frame >= F.dots && frame < F.reply;
  const press = iv(frame, [F.sendC - 3, F.sendC, F.sendC + 6], [0, 1, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: CHAT.x,
        top: CHAT.y,
        width: CHAT.w,
        height: CHAT.h,
        borderRadius: R.xxl,
        background: T.card,
        border: `1.5px solid ${T.line}`,
        boxShadow: SHADOW.window,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <ChatWallpaper x={0} y={0} w={CHAT.w} h={CHAT.h} />
      <ChatHeader
        x={0}
        y={0}
        w={CHAT.w}
        h={96}
        title={AG.growthHacker.name}
        agent={AG.growthHacker}
      />

      {frame >= F.sendC ? (
        <MeMsg right={28} y={128} maxW={580} size={26} enter={meIn}>
          {ASK}
        </MeMsg>
      ) : null}

      {dots ? <Typing x={90} y={244} /> : null}

      {frame >= F.reply ? (
        <AgentMsg
          x={28}
          y={238}
          w={680}
          agent={AG.growthHacker}
          size={25}
          pad={24}
          enter={replyIn}
        >
          {REPLY}
        </AgentMsg>
      ) : null}

      <Composer
        x={28}
        y={486}
        w={CHAT.w - 56}
        h={128}
        armed={composing.length > 0}
        caret={frame >= F.typeC && frame < F.sendC}
        focus={frame >= F.typeC && frame < F.sendC ? 1 : 0}
        press={press}
      >
        {composing}
      </Composer>
    </div>
  );
};

/** Memory → thread: the context flowing into the answer. */
const MemoryFeed: React.FC = () => {
  const frame = useCurrentFrame();
  const top = MEM.y + MEM.h;
  const h = CHAT.y - top;
  const draw = iv(frame, [F.pulse - 6, F.pulse + 6], [0, 1]);
  const dot = iv(frame, [F.pulse, F.pulse + 14], [0, 1]);
  if (frame < F.pulse - 6) return null;
  return (
    <svg
      width={80}
      height={h}
      style={{ position: "absolute", left: CX - 40, top }}
    >
      <line
        x1={40}
        y1={0}
        x2={40}
        y2={h * draw}
        stroke={T.greenLine}
        strokeWidth={3}
        strokeDasharray="6 8"
      />
      {frame >= F.pulse ? (
        <circle
          cx={40}
          cy={h * dot}
          r={9}
          fill={T.green}
          opacity={iv(frame, [F.pulse + 12, F.pulse + 18], [1, 0])}
        />
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const TmP2AlreadyKnow: React.FC = () => {
  // hold on the grey chat (0–114, micro-drift only) → travel down the column
  // (114–150) → land on Teamily and hold, ending on two near-identical keys.
  const cam = useCam({
    keys: [0, 60, F.travel, F.land, 214, DURATION_IN_FRAMES],
    fx: [CX, CX, CX, CX, CX, CX],
    fy: [A_FOCUS - 10, A_FOCUS - 4, A_FOCUS + 2, B_FOCUS, B_FOCUS, B_FOCUS + 2],
    z: [Z_A, Z_A - 0.002, Z_A - 0.004, Z_B, Z_B, Z_B],
  });

  return (
    <PaperWorld
      cam={cam}
      grid={{ left: -900, top: -900, width: 2900, height: 5400 }}
    >
      <PlainChat />
      <CursorRig />
      <MemoryPane />
      <MemoryFeed />
      <TeamilyThread />
    </PaperWorld>
  );
};
