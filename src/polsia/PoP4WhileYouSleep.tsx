import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { FACES, FONT_MONO, FONT_SERIF, POLSIA, SPRINGS, STRINGS, WORLD } from "./theme";

loadSerif();
loadPlexMono();

export const DURATION_IN_FRAMES = 430;

// ---------------------------------------------------------------------------
// PoP4 — "While You Sleep": close the laptop → Polsia wakes at 2AM → works a
// task queue through the night → the Day 33 CEO Report is waiting by 7:04 AM.
// One continuous vertical world (1080 x ~4600), camera descends through it.
// ---------------------------------------------------------------------------

const VIEW_W = 1080;
const VIEW_H = 1920;
const ease = Easing.inOut(Easing.cubic);
const clampOpt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Camera keyframes (hold → move → hold; ends on two near-identical keys)
const KEY_T = [0, 70, 92, 148, 166, 278, 302, 368, 382, 410, 430];
const KEY_FY = [980, 980, 2470, 2470, 2500, 2500, 3620, 3620, 3620, 3620, 3620];
const KEY_Z = [1.16, 1.12, 1, 1, 1.03, 1.03, 1, 1, 1.05, 1.05, 1.05];
const FX = 540;

// ASCII faces (sleeping variant drawn to match the real box-drawn mascot)
const FACE_SLEEP = "┌─────────┐\n│  ─   ─  │\n│    ▽    │\n│   ◡◡◡   │\n└─────────┘";
const FACE_BLINK = "┌─────────┐\n│  •   •  │\n│    ▽    │\n│   ◡◡◡   │\n└─────────┘";
const FACE_AWAKE = FACES.investigating
  .split("\n")
  .slice(0, 5)
  .map((l) => l.slice(2))
  .join("\n");
const FACE_CURIOUS = FACES.curious;

// Night terminal stream — real product strings only
const TERM_LINES = [
  STRINGS.terminal[7], // > Processing autonomous tasks...
  STRINGS.terminal[3], // > Studying your market — ...
  STRINGS.terminal[4], // > Deep searching web for: ...
  STRINGS.terminal[6], // > Deploying marketing campaign...
  STRINGS.terminal[8], // > Waiting for live data...
];
const LINE_STARTS = [112, 142, 172, 208, 240];

type TaskDef = {
  title: string;
  tag?: string;
  icon: "doc" | "wire" | "send";
  waitFrom: number;
  enter: number;
  tick: number;
  fileStart: number;
  fileEnd: number;
  chipCx: number;
};

const TASKS: TaskDef[] = [
  { title: "Market research", tag: "RESEARCH", icon: "doc", waitFrom: 140, enter: 150, tick: 184, fileStart: 190, fileEnd: 202, chipCx: 265 },
  { title: "Pricing page copy", icon: "wire", waitFrom: 152, enter: 196, tick: 230, fileStart: 236, fileEnd: 248, chipCx: 540 },
  { title: "Welcome emails", icon: "send", waitFrom: 200, enter: 242, tick: 272, fileStart: 277, fileEnd: 289, chipCx: 815 },
];

const SLOT_TOP = 2640; // task card top when in the working slot
const WAIT_TOP = 3000; // queued card top
const CHIP_Y = 2380; // done-chip row center

// ---------------------------------------------------------------------------

const DocIcon: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size * 1.18} viewBox="0 0 30 36">
    <rect x="1.5" y="1.5" width="27" height="33" rx="3" fill="#FFFFFF" stroke={WORLD.text} strokeWidth="2.4" />
    <line x1="7" y1="11" x2="23" y2="11" stroke={WORLD.text} strokeWidth="1.8" opacity="0.55" />
    <line x1="7" y1="17" x2="23" y2="17" stroke={WORLD.text} strokeWidth="1.8" opacity="0.4" />
    <line x1="7" y1="23" x2="18" y2="23" stroke={WORLD.text} strokeWidth="1.8" opacity="0.3" />
  </svg>
);

const WireIcon: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 36 36">
    <rect x="2" y="3" width="32" height="30" rx="3" fill="#FFFFFF" stroke={WORLD.text} strokeWidth="2.4" />
    <line x1="2" y1="11" x2="34" y2="11" stroke={WORLD.text} strokeWidth="2" />
    <rect x="7" y="16" width="14" height="4" rx="1.5" fill={WORLD.text} opacity="0.5" />
    <rect x="7" y="24" width="22" height="4" rx="1.5" fill={WORLD.text} opacity="0.28" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="14.5" fill="#FFFFFF" stroke={WORLD.text} strokeWidth="2.4" />
    <path d="M17 24 L17 11 M11.5 16.5 L17 11 L22.5 16.5" stroke={WORLD.text} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const halftone: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(17,17,17,0.5) 1.5px, transparent 1.8px)",
  backgroundSize: "9px 9px",
};

// ---------------------------------------------------------------------------

const Laptop: React.FC<{ frame: number }> = ({ frame }) => {
  const lid =
    frame < 38
      ? interpolate(frame, [6, 38], [100, 2], { easing: Easing.in(Easing.cubic), ...clampOpt })
      : interpolate(frame, [38, 46], [2, 0], { easing: Easing.out(Easing.cubic), ...clampOpt });
  const glowOp = interpolate(lid, [0, 15, 100], [0, 0.3, 0.7]);
  const powerOp =
    interpolate(frame, [36, 50], [1, 0], clampOpt) * (0.6 + 0.4 * Math.sin(frame * 0.4));
  const dip = interpolate(frame, [38, 42, 52], [0, 4, 0], clampOpt);
  const ringOn = frame >= 38 && frame <= 56;
  const ringR = interpolate(frame, [38, 56], [8, 54], clampOpt);
  const ringOp = interpolate(frame, [38, 56], [0.5, 0], clampOpt);

  return (
    <div style={{ position: "absolute", left: 190, top: 700, width: 700, height: 520 }}>
      <svg width="700" height="520" viewBox="0 0 700 520">
        {/* desk rule */}
        <line x1="10" y1="470" x2="690" y2="470" stroke={WORLD.text} strokeWidth="2.5" />
        <line x1="10" y1="478" x2="690" y2="478" stroke={WORLD.text} strokeWidth="1" opacity="0.14" />
        {/* halftone shadow under the machine */}
        <g opacity="0.16">
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 24 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={140 + c * 9} cy={484 + r * 7} r={1.3} fill={WORLD.text} />
            ))
          )}
        </g>
        <g transform={`translate(0, ${dip})`}>
          {/* warm screen glow, dies as the lid closes */}
          <ellipse cx="350" cy="438" rx="205" ry="46" fill="rgba(255,175,90,0.3)" opacity={glowOp} />
          {/* lid */}
          <g transform={`rotate(${lid}, 578, 452)`}>
            <rect x="118" y="436" width="460" height="16" rx="8" fill="#FFFFFF" stroke={WORLD.text} strokeWidth="3" />
            <line x1="150" y1="444" x2="546" y2="444" stroke={WORLD.text} strokeWidth="1.4" opacity="0.22" />
          </g>
          {/* base */}
          <rect x="110" y="452" width="480" height="16" rx="8" fill="#FFFFFF" stroke={WORLD.text} strokeWidth="3" />
          <circle cx="562" cy="460" r="3.4" fill={POLSIA.orange} opacity={Math.max(0, powerOp)} />
        </g>
        {ringOn ? (
          <circle cx="578" cy="452" r={ringR} fill="none" stroke={WORLD.text} strokeWidth="2" opacity={ringOp} />
        ) : null}
      </svg>
    </div>
  );
};

const Dusk: React.FC<{ frame: number }> = ({ frame }) => {
  const moonOp = interpolate(frame, [42, 62], [0, 1], clampOpt);
  const stars: Array<[number, number]> = [
    [310, 560],
    [726, 416],
    [560, 620],
  ];
  return (
    <>
      {/* crescent moon dot */}
      <div style={{ position: "absolute", left: 806, top: 486, width: 28, height: 28, opacity: moonOp }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#39415E" }} />
        <div style={{ position: "absolute", left: 8, top: -4, width: 24, height: 24, borderRadius: "50%", background: WORLD.bg }} />
      </div>
      {stars.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            fontFamily: FONT_MONO,
            fontSize: 24,
            color: WORLD.text,
            opacity: moonOp * (0.1 + 0.1 * Math.sin(frame * 0.22 + i * 2.1)),
          }}
        >
          +
        </div>
      ))}
    </>
  );
};

const MascotCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const inOp = interpolate(frame, [84, 94], [0, 1], clampOpt);
  const inY = interpolate(frame, [84, 96], [22, 0], { easing: ease, ...clampOpt });
  const face = frame < 98 ? FACE_SLEEP : frame < 103 ? FACE_BLINK : FACE_AWAKE;
  const wakePop = 1 + spring({ frame: frame - 103, fps, config: SPRINGS.snappy, durationInFrames: 18 }) * 0.04 - (frame >= 103 ? 0.04 : 0);
  const bob = Math.sin(frame * 0.09) * 2.5;
  const zOp = interpolate(frame, [86, 92, 94, 100], [0, 1, 1, 0], clampOpt);
  const zRise = (frame % 44) / 44;
  const dotsOp = interpolate(frame, [106, 114, 200, 210], [0, 1, 1, 0], clampOpt);

  // Mood label: two-layer crossfade Investigating -> Locked in
  const l1Op = interpolate(frame, [103, 112, 206, 216], [0, 1, 1, 0], clampOpt);
  const l1Y = interpolate(frame, [103, 114], [14, 0], { easing: ease, ...clampOpt }) + interpolate(frame, [206, 216], [0, -10], { easing: ease, ...clampOpt });
  const l2Op = interpolate(frame, [210, 220], [0, 1], clampOpt);
  const l2Y = interpolate(frame, [210, 222], [12, 0], { easing: ease, ...clampOpt });

  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: inOp }}>
      {/* halftone shadow block, bottom-left of the card like the real app */}
      <div style={{ position: "absolute", left: 128, top: 2036 + inY, width: 176, height: 66, ...halftone, opacity: 0.85 }} />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 1850 + inY + bob,
          width: 270,
          height: 205,
          background: POLSIA.paper,
          border: `2.5px solid ${WORLD.text}`,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${wakePop})`,
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: FONT_MONO,
            fontSize: 26,
            lineHeight: 1.0,
            color: WORLD.text,
            whiteSpace: "pre",
          }}
        >
          {face}
        </pre>
      </div>
      {/* sleeping z z */}
      <div
        style={{
          position: "absolute",
          left: 436,
          top: 1836 - zRise * 26,
          fontFamily: FONT_MONO,
          fontSize: 26,
          color: WORLD.muted,
          opacity: zOp * (1 - zRise),
        }}
      >
        z
      </div>
      <div
        style={{
          position: "absolute",
          left: 462,
          top: 1808 - zRise * 20,
          fontFamily: FONT_MONO,
          fontSize: 19,
          color: WORLD.muted,
          opacity: zOp * (1 - zRise) * 0.8,
        }}
      >
        z
      </div>
      {/* thought dots while investigating */}
      <div style={{ position: "absolute", left: 300, top: 2072 + bob, width: 11, height: 11, borderRadius: "50%", border: `2px solid ${WORLD.text}`, opacity: dotsOp * (0.55 + 0.45 * Math.sin(frame * 0.18)) }} />
      <div style={{ position: "absolute", left: 282, top: 2094 + bob, width: 8, height: 8, borderRadius: "50%", border: `2px solid ${WORLD.text}`, opacity: dotsOp * (0.55 + 0.45 * Math.sin(frame * 0.18 + 1.4)) }} />
      {/* mood label */}
      <div style={{ position: "absolute", left: 470, top: 1878, width: 520 }}>
        <div style={{ position: "absolute", left: 0, top: 0, opacity: l1Op, transform: `translateY(${l1Y}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 13, height: 13, background: POLSIA.orange }} />
            <div style={{ fontFamily: FONT_SERIF, fontSize: 47, fontWeight: 700, color: WORLD.text }}>
              {STRINGS.moods.investigating.label}
            </div>
          </div>
          <div style={{ marginTop: 12, marginLeft: 29, fontFamily: FONT_SERIF, fontSize: 27, color: POLSIA.grayText }}>
            {STRINGS.moods.investigating.sub}
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, opacity: l2Op, transform: `translateY(${l2Y}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 13, height: 13, background: POLSIA.orange }} />
            <div style={{ fontFamily: FONT_SERIF, fontSize: 47, fontWeight: 700, color: WORLD.text }}>
              Locked in
            </div>
          </div>
          <div style={{ marginTop: 12, marginLeft: 29, fontFamily: FONT_SERIF, fontSize: 27, color: POLSIA.grayText }}>
            Crafting your landing page...
          </div>
        </div>
      </div>
    </div>
  );
};

const Terminal: React.FC<{ frame: number }> = ({ frame }) => {
  const inOp = interpolate(frame, [106, 116], [0, 1], clampOpt);
  const inY = interpolate(frame, [106, 120], [36, 0], { easing: ease, ...clampOpt });
  let lastVisible = -1;
  for (let i = 0; i < LINE_STARTS.length; i++) {
    if (frame >= LINE_STARTS[i]) lastVisible = i;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 54,
        top: 2085 + inY,
        width: 972,
        height: 208,
        background: POLSIA.termBg,
        borderRadius: 10,
        padding: "20px 26px",
        boxSizing: "border-box",
        opacity: inOp,
        overflow: "hidden",
      }}
    >
      {TERM_LINES.map((line, i) => {
        if (frame < LINE_STARTS[i]) return null;
        const chars = Math.max(0, Math.floor((frame - LINE_STARTS[i]) * 2.6));
        const text = line.slice(0, chars);
        const isLast = i === lastVisible;
        const cursorOn = isLast && frame % 16 < 9;
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 20,
              lineHeight: "32px",
              color: POLSIA.termText,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {text}
            {isLast ? (
              <span style={{ color: POLSIA.orange, opacity: cursorOn ? 1 : 0.15 }}>▮</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const TaskCard: React.FC<{ frame: number; fps: number; task: TaskDef; index: number }> = ({
  frame,
  fps,
  task,
  index,
}) => {
  const { waitFrom, enter, tick, fileStart, fileEnd, chipCx } = task;
  const op = interpolate(
    frame,
    [waitFrom, waitFrom + 8, enter, enter + 10, fileStart, fileEnd],
    [0, 0.55, 0.55, 1, 1, 0],
    clampOpt
  );
  const yTop = interpolate(frame, [enter, enter + 12], [WAIT_TOP, SLOT_TOP], { easing: ease, ...clampOpt });
  const baseScale = interpolate(frame, [enter, enter + 12], [0.94, 1], { easing: ease, ...clampOpt });
  const pFile = interpolate(frame, [fileStart, fileEnd], [0, 1], { easing: ease, ...clampOpt });
  const dx = (chipCx - 540) * pFile;
  const dy = (CHIP_Y - (SLOT_TOP + 95)) * pFile;
  const scale = baseScale * (1 - 0.72 * pFile);
  const waitBob = frame < enter ? Math.sin(frame * 0.12 + index * 2) * 3 : 0;
  const spinning = frame >= enter + 13 && frame < tick;
  const ticked = frame >= tick;
  const tickPop = spring({ frame: frame - tick, fps, config: SPRINGS.snappy, durationInFrames: 16 });
  if (op <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 190,
        top: yTop + waitBob,
        width: 700,
        height: 190,
        background: POLSIA.paper,
        border: `2.5px solid ${WORLD.text}`,
        borderRadius: 8,
        boxShadow: WORLD.shadowSoft,
        opacity: op,
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 34px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 66,
          height: 66,
          border: `2px solid ${WORLD.text}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {task.icon === "doc" ? <DocIcon /> : task.icon === "wire" ? <WireIcon /> : <SendIcon />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_SERIF, fontSize: 35, fontWeight: 700, color: WORLD.text }}>
          {task.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 23, color: POLSIA.grayText }}>[description]</div>
          {task.tag ? (
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 16,
                letterSpacing: 2,
                color: WORLD.text,
                border: `1.5px solid ${WORLD.border}`,
                background: POLSIA.cardGray,
                padding: "4px 10px",
                borderRadius: 4,
              }}
            >
              {task.tag}
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ width: 56, display: "flex", justifyContent: "center", flexShrink: 0 }}>
        {spinning ? (
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: `rotate(${frame * 22}deg)` }}>
            <circle cx="22" cy="22" r="17" fill="none" stroke={WORLD.border} strokeWidth="4" />
            <path d="M 22 5 A 17 17 0 0 1 39 22" fill="none" stroke={WORLD.text} strokeWidth="4" strokeLinecap="round" />
          </svg>
        ) : ticked ? (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              border: `2.5px solid ${WORLD.text}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${tickPop})`,
              fontFamily: FONT_MONO,
              fontSize: 24,
              fontWeight: 700,
              color: WORLD.text,
            }}
          >
            ✓
          </div>
        ) : null}
      </div>
    </div>
  );
};

const DoneChip: React.FC<{ frame: number; fps: number; task: TaskDef }> = ({ frame, fps, task }) => {
  const s = spring({ frame: frame - (task.fileEnd - 3), fps, config: SPRINGS.snappy, durationInFrames: 20 });
  const departFade = interpolate(frame, [280, 292], [1, 0], clampOpt);
  if (frame < task.fileEnd - 3 || departFade <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: task.chipCx - 122,
        top: CHIP_Y - 24,
        width: 244,
        height: 48,
        background: POLSIA.paper,
        border: `1.5px solid #C9C5BD`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: Math.min(1, s * 1.2) * departFade,
        transform: `scale(${0.6 + 0.4 * s})`,
      }}
    >
      <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: WORLD.text }}>✓</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 16, letterSpacing: 1, color: POLSIA.grayText }}>
        {task.title.toUpperCase()}
      </span>
    </div>
  );
};

const MorningEmail: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const rise = spring({ frame: frame - 302, fps, config: SPRINGS.smooth, durationInFrames: 26 });
  const op = interpolate(frame, [302, 314], [0, 1], clampOpt);
  const y = (1 - rise) * 64;
  const dotPop = spring({ frame: frame - 318, fps, config: SPRINGS.bouncy, durationInFrames: 22 });
  const ringOn = frame >= 318 && frame <= 340;
  const ringP = interpolate(frame, [318, 340], [0, 1], clampOpt);
  const fromOp = interpolate(frame, [316, 324], [0, 1], clampOpt);
  const fromX = interpolate(frame, [316, 326], [14, 0], { easing: ease, ...clampOpt });
  const toOp = interpolate(frame, [320, 328], [0, 1], clampOpt);
  const toX = interpolate(frame, [320, 330], [14, 0], { easing: ease, ...clampOpt });
  const subjP = interpolate(frame, [324, 342], [0, 100], { easing: ease, ...clampOpt });
  const peekY = interpolate(frame, [368, 386], [104, 0], { easing: ease, ...clampOpt });
  const peekOp = interpolate(frame, [368, 375], [0, 1], clampOpt);
  const peekBob = frame > 386 ? Math.sin((frame - 386) * 0.1) * 3 : 0;

  const skels: Array<[number, number]> = [
    [340, 92],
    [346, 78],
    [352, 85],
  ];
  const rows: Array<[number, string]> = [
    [358, TASKS[0].title],
    [364, TASKS[1].title],
    [370, TASKS[2].title],
  ];

  return (
    <div style={{ position: "absolute", left: 140, top: 3400, width: 800, opacity: op, transform: `translateY(${y}px)` }}>
      {/* curious mascot peeking over the top edge (behind the card) */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: -104 + peekY + peekBob,
          opacity: peekOp,
          width: 178,
          height: 138,
          background: POLSIA.paper,
          border: `2.5px solid ${WORLD.text}`,
          borderRadius: 4,
          transform: "rotate(6deg)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 10,
          boxSizing: "border-box",
        }}
      >
        <pre style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 17, lineHeight: 1.0, color: WORLD.text, whiteSpace: "pre" }}>
          {FACE_CURIOUS}
        </pre>
      </div>
      {/* the email card */}
      <div
        style={{
          position: "relative",
          background: POLSIA.paper,
          border: `2.5px solid ${WORLD.text}`,
          borderRadius: 10,
          boxShadow: WORLD.shadow,
          padding: "36px 40px 32px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 36, fontWeight: 700, color: WORLD.text }}>Email</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 21, color: POLSIA.grayText, fontVariantNumeric: "tabular-nums" }}>
            7:04 AM
          </div>
        </div>
        <div style={{ height: 2.5, background: WORLD.text, margin: "12px 0 22px" }} />
        <div style={{ fontFamily: FONT_MONO, fontSize: 20, letterSpacing: 0.5, color: POLSIA.grayText, opacity: fromOp, transform: `translateX(${fromX}px)` }}>
          FROM: TACTRA-3@POLSIA.APP
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 20, letterSpacing: 0.5, color: POLSIA.grayText, marginTop: 8, opacity: toOp, transform: `translateX(${toX}px)` }}>
          TO: LIAM@GMAIL.COM
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 22,
            clipPath: `inset(0 ${100 - subjP}% 0 0)`,
          }}
        >
          <DocIcon size={30} />
          <div style={{ fontFamily: FONT_SERIF, fontSize: 44, fontWeight: 700, color: WORLD.text, whiteSpace: "nowrap" }}>
            {STRINGS.ceoReport}
          </div>
        </div>
        <div style={{ height: 1.5, background: WORLD.border, margin: "22px 0" }} />
        {skels.map(([start, w], i) => {
          const p = interpolate(frame, [start, start + 10], [0, 1], { easing: ease, ...clampOpt });
          return (
            <div
              key={i}
              style={{
                height: 13,
                width: `${w * p}%`,
                borderRadius: 7,
                background: "#E3E0D9",
                marginTop: i === 0 ? 0 : 14,
              }}
            />
          );
        })}
        <div style={{ marginTop: 26 }}>
          {rows.map(([start, title], i) => {
            const rp = spring({ frame: frame - start, fps, config: SPRINGS.snappy, durationInFrames: 20 });
            if (frame < start) return <div key={i} style={{ height: 40 }} />;
            return (
              <div
                key={i}
                style={{
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: Math.min(1, rp * 1.3),
                  transform: `translateX(${(1 - rp) * -14}px)`,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    border: `2px solid ${WORLD.text}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_MONO,
                    fontSize: 14,
                    fontWeight: 700,
                    color: WORLD.text,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 21, color: WORLD.text }}>{title}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: WORLD.text, borderBottom: `2px solid ${WORLD.text}`, paddingBottom: 2 }}>
            VIEW ALL
          </div>
        </div>
        {/* notification dot */}
        <div
          style={{
            position: "absolute",
            top: -13,
            right: -13,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: POLSIA.orange,
            border: `3px solid ${WORLD.bg}`,
            transform: `scale(${dotPop})`,
          }}
        />
        {ringOn ? (
          <div
            style={{
              position: "absolute",
              top: -13 - ringP * 22,
              right: -13 - ringP * 22,
              width: 26 + ringP * 44,
              height: 26 + ringP * 44,
              borderRadius: "50%",
              border: `2px solid ${POLSIA.orange}`,
              opacity: 0.6 * (1 - ringP),
              boxSizing: "border-box",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

const ClockHUD: React.FC<{ frame: number }> = ({ frame }) => {
  const inOp = interpolate(frame, [74, 84], [0, 1], clampOpt);
  const inY = interpolate(frame, [74, 86], [-14, 0], { easing: ease, ...clampOpt });
  const nightMin = Math.round(
    interpolate(frame, [88, 130, 175, 220, 258, 285, 308], [0, 34, 92, 156, 214, 268, 304], clampOpt)
  );
  const totalM = 120 + nightMin;
  const hh = Math.floor(totalM / 60);
  const mm = String(totalM % 60).padStart(2, "0");
  const sunP = interpolate(frame, [294, 304], [0, 1], clampOpt);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 214,
        transform: `translateX(-50%) translateY(${inY}px)`,
        opacity: inOp,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: POLSIA.paper,
        border: `2px solid ${WORLD.text}`,
        borderRadius: 10,
        padding: "10px 22px",
      }}
    >
      <div style={{ position: "relative", width: 16, height: 16 }}>
        {/* moon -> sun crossfade */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - sunP }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#39415E" }} />
          <div style={{ position: "absolute", left: 5, top: -2, width: 13, height: 13, borderRadius: "50%", background: POLSIA.paper }} />
        </div>
        <div style={{ position: "absolute", inset: 1, borderRadius: "50%", background: POLSIA.orange, opacity: sunP }} />
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: WORLD.text, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
        {`${hh}:${mm} AM`}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

export const PoP4WhileYouSleep: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: ease, extrapolateRight: "clamp" });
  const z =
    interpolate(frame, KEY_T, KEY_Z, { easing: ease, extrapolateRight: "clamp" }) *
    (1 + Math.sin(frame * 0.05) * 0.0012);

  const coolOp = interpolate(frame, [36, 66, 278, 308], [0, 0.13, 0.13, 0], clampOpt);
  const warmOp = interpolate(frame, [286, 312, 356], [0, 0.1, 0.045], clampOpt);
  const nightStars = interpolate(frame, [82, 102, 268, 296], [0, 1, 1, 0], clampOpt);

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, overflow: "hidden" }}>
      {/* ------- world ------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - FX}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${FX}px ${fy}px`,
        }}
      >
        {/* zone divider hairlines */}
        <div style={{ position: "absolute", left: 54, top: 1560, width: 972, height: 1, background: WORLD.border }} />
        <div style={{ position: "absolute", left: 54, top: 3290, width: 972, height: 1, background: WORLD.border }} />

        {/* Zone A — the desk at dusk */}
        <Laptop frame={frame} />
        <Dusk frame={frame} />

        {/* Zone B — the night shift */}
        {[
          [300, 1636],
          [742, 1602],
          [552, 1688],
        ].map(([x, y], i) => (
          <div
            key={`ns-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: FONT_MONO,
              fontSize: 22,
              color: WORLD.text,
              opacity: nightStars * (0.09 + 0.09 * Math.sin(frame * 0.2 + i * 1.9)),
            }}
          >
            +
          </div>
        ))}
        <MascotCard frame={frame} fps={fps} />
        <Terminal frame={frame} />
        {TASKS.map((t, i) => (
          <DoneChip key={`c-${i}`} frame={frame} fps={fps} task={t} />
        ))}
        {TASKS.map((t, i) => (
          <TaskCard key={`t-${i}`} frame={frame} fps={fps} task={t} index={i} />
        ))}

        {/* Zone C — by morning */}
        <div
          style={{
            position: "absolute",
            left: 258,
            top: 3238 + interpolate(frame, [288, 312], [26, 0], { easing: ease, ...clampOpt }),
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: POLSIA.orange,
            opacity: interpolate(frame, [288, 306], [0, 1], clampOpt),
          }}
        />
        <MorningEmail frame={frame} fps={fps} />
      </div>

      {/* ------- HUD clock (tinted by the washes above it) ------- */}
      <ClockHUD frame={frame} />

      {/* ------- day/night washes (light — never dark) ------- */}
      <AbsoluteFill style={{ backgroundColor: "#46578C", opacity: coolOp, pointerEvents: "none" }} />
      <AbsoluteFill style={{ backgroundColor: "#FFAE70", opacity: warmOp, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
