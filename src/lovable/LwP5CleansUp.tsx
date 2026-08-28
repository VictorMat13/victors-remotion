import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DRONEA, FONT_MONO, FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

// ============================================================================
// LwP5CleansUp — 1080x1080 @ 30fps
// Beat (VO, never on screen): "Wispr Flow cleans up everything I said and
// creates one detailed prompt. Lovable takes the video, the reference, and
// those instructions and builds the full website."
// One continuous left->right transformation pipeline, keyframed camera:
//   f0–70    MESSY SPEECH — scattered gray filler words already drifting at
//            f0, pulled rightward into the real Flowbar pill (waveform boosts
//            as each word is consumed).
//   f70–140  CLEAN PROMPT — out the pill's right side a white document card
//            assembles; real build-prompt fragments wipe in top-to-bottom.
//   f140–215 INTO LOVABLE — the doc shrinks to a chip and funnels, with a
//            video-thumb chip + lusion.co chip, along connector lanes into a
//            node carrying the real Lovable heart; node pulses per arrival.
//   f215–290 THE BUILD — a spark jumps right; a browser-chrome card assembles
//            with a shimmer wipe and plays the REAL built site (site-live.mp4).
//   f290–320 END HOLD — camera settled on the live site card, drone rotating.
// ============================================================================

export const DURATION_IN_FRAMES = 320;

const VIEW = 1080;

// ---------------------------------------------------------------------------
// World layout (flat world, everything on the y=540 band)
// ---------------------------------------------------------------------------
const PILL = { x: 800, y: 540, w: 320, h: 84 };
const DOC = { x: 1250, y: 540, w: 460, h: 540 };
const NODE = { x: 1800, y: 540, s: 210 };
const SITE_W = 1130;
const SITE_CHROME = 64;
const SITE_VIDEO_H = 706; // 1130 * 900/1440
const SITE = { x: 2560, y: 540, w: SITE_W, h: SITE_CHROME + SITE_VIDEO_H };

// Beat anchors
const DOC_POP = 72;
const DOC_SHRINK = 158; // -> f174
const DOC_TRAVEL = 174; // -> f188, absorbed f188
const NODE_POP = 144;
const PULSES = [188, 198, 208] as const;
const SPARK = [210, 226] as const;
const SITE_POP = 226;
const VIDEO_START = 226; // site-live.mp4 t=0 at this frame
const WIPE = [236, 258] as const;

// ---------------------------------------------------------------------------
// Camera — hold -> move (14-24f) -> hold; two identical end keys
// ---------------------------------------------------------------------------
const EASE = Easing.inOut(Easing.cubic);
const KEY_T = [0, 24, 64, 80, 140, 158, 215, 236, 296, 314, 320];
const KEY_FX = [540, 544, 566, 1060, 1060, 1470, 1470, 2560, 2560, 2562, 2562];
const KEY_FY = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const KEY_Z = [1.08, 1.08, 1.1, 1.12, 1.12, 1.05, 1.05, 0.83, 0.842, 0.845, 0.845];

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const qbez = (
  p0: readonly [number, number],
  c: readonly [number, number],
  p1: readonly [number, number],
  t: number
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
};

// ---------------------------------------------------------------------------
// Messy speech — lowercase filler words drifting right, sucked into the pill
// ---------------------------------------------------------------------------
type ChipSpec = {
  word: string;
  x: number;
  y: number;
  size: number;
  rot: number;
  speed: number;
  consume: number; // frame the pill swallows it
  phase: number;
  tone: string;
};

const CHIPS: ChipSpec[] = [
  { word: "um", x: 190, y: 330, size: 30, rot: -7, speed: 0.55, consume: 40, phase: 0.3, tone: "#8A867E" },
  { word: "so like", x: 316, y: 302, size: 36, rot: 4, speed: 0.42, consume: 22, phase: 1.4, tone: "#7E7A72" },
  { word: "the drone thing", x: 322, y: 462, size: 40, rot: -3, speed: 0.5, consume: 58, phase: 2.2, tone: "#726E66" },
  { word: "make it uh", x: 448, y: 384, size: 32, rot: 6, speed: 0.45, consume: 34, phase: 3.1, tone: "#8A867E" },
  { word: "you know", x: 220, y: 558, size: 28, rot: -5, speed: 0.6, consume: 16, phase: 4.0, tone: "#9B978F" },
  { word: "spinny", x: 470, y: 520, size: 34, rot: 8, speed: 0.4, consume: 66, phase: 4.8, tone: "#7E7A72" },
  { word: "kinda floaty", x: 268, y: 642, size: 30, rot: -6, speed: 0.5, consume: 46, phase: 5.5, tone: "#8A867E" },
  { word: "wait no", x: 480, y: 636, size: 26, rot: 5, speed: 0.55, consume: 78, phase: 0.9, tone: "#9B978F" },
  { word: "like lusion", x: 196, y: 736, size: 34, rot: 3, speed: 0.45, consume: 84, phase: 1.9, tone: "#726E66" },
  { word: "3d-ish", x: 442, y: 742, size: 28, rot: -8, speed: 0.5, consume: 72, phase: 2.7, tone: "#9B978F" },
  { word: "uh the hero", x: 330, y: 800, size: 30, rot: 4, speed: 0.42, consume: 90, phase: 3.6, tone: "#8A867E" },
];

const MOUTH: readonly [number, number] = [PILL.x - PILL.w / 2 + 28, PILL.y];

const MessyChips: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {CHIPS.map((c, i) => {
        const tPull = c.consume - 22;
        const p = interpolate(frame, [tPull, c.consume], [0, 1], {
          ...clamp,
          easing: Easing.in(Easing.cubic),
        });
        if (p >= 1) return null;
        const driftFrame = Math.min(frame, tPull);
        const bx = c.x + Math.max(0, driftFrame) * c.speed;
        const by = c.y + 5 * Math.sin(frame * 0.05 + c.phase);
        const x = bx + (MOUTH[0] - bx) * p;
        const y = by + (MOUTH[1] - by) * p;
        const scale = 1 - 0.6 * p;
        const op = interpolate(p, [0, 0.72, 1], [1, 1, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${c.rot * (1 - p)}deg) scale(${scale})`,
              fontFamily: FONT_SANS,
              fontSize: c.size,
              fontWeight: 500,
              color: c.tone,
              opacity: op,
              whiteSpace: "nowrap",
              letterSpacing: 0.2,
            }}
          >
            {c.word}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Wispr dictation pill — dark bar, cream ticks; amplitude spikes per swallow
// (same Flowbar language as the approved LwP4 pill)
// ---------------------------------------------------------------------------
const N_BARS = 19;

const DictationPill: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = 4 * Math.sin(frame * 0.05);
  const retire = interpolate(frame, [146, 158], [1, 0], clamp);
  if (retire <= 0) return null;

  let boost = 0;
  for (const c of CHIPS) {
    const dt = frame - (c.consume - 5);
    if (dt >= 0 && dt <= 18) boost = Math.max(boost, Math.sin((Math.PI * dt) / 18));
  }

  const bars = Array.from({ length: N_BARS }, (_, i) => {
    const centerEnv =
      0.5 + 0.5 * (1 - Math.pow((i - (N_BARS - 1) / 2) / ((N_BARS - 1) / 2), 2));
    const fast = Math.abs(Math.sin(0.55 * i + frame * 0.3));
    const slow = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.047 + i * 0.23));
    const h = 8 + 36 * fast * slow * centerEnv * (1 + 0.55 * boost);
    return Math.min(h, 54);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: PILL.x - PILL.w / 2,
        top: PILL.y - PILL.h / 2,
        width: PILL.w,
        height: PILL.h,
        transform: `translateY(${bob}px)`,
        borderRadius: PILL.h / 2,
        backgroundColor: WISPR.barBg,
        border: `1.5px solid ${WISPR.barStroke}`,
        boxShadow: "0 16px 36px rgba(20, 18, 12, 0.20)",
        opacity: retire,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 24,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#71716E",
          flexShrink: 0,
          marginRight: 14,
          position: "relative",
        }}
      >
        <svg width={32} height={32} viewBox="0 0 32 32" style={{ position: "absolute", inset: 0 }}>
          <path
            d="M12 12 L20 20 M20 12 L12 20"
            stroke="#FCFCFB"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{ width: 6, height: h, borderRadius: 3, backgroundColor: "#FFFFEB" }}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pill -> doc connector: short line + looping flow dots (micro-motion)
// ---------------------------------------------------------------------------
const PillToDoc: React.FC = () => {
  const frame = useCurrentFrame();
  const lineP = interpolate(frame, [66, 78], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (lineP <= 0) return null;
  const fade = interpolate(frame, [DOC_SHRINK, DOC_SHRINK + 10], [1, 0], clamp);
  if (fade <= 0) return null;
  const x0 = PILL.x + PILL.w / 2;
  const x1 = DOC.x - DOC.w / 2;
  return (
    <div style={{ position: "absolute", opacity: fade }}>
      <div
        style={{
          position: "absolute",
          left: x0,
          top: PILL.y - 1,
          width: (x1 - x0) * lineP,
          height: 2,
          borderRadius: 1,
          backgroundColor: "#DCD9D1",
        }}
      />
      {frame >= 80 &&
        [0, 1, 2].map((i) => {
          const p = ((frame - 80) * 0.045 + i / 3) % 1;
          const op = Math.sin(Math.PI * p) * 0.8;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x0 + (x1 - x0) * p - 3,
                top: PILL.y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: LOVABLE.accent,
                opacity: op * fade,
              }}
            />
          );
        })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Clean prompt document — real build-prompt fragments, lines wipe in
// top-to-bottom; later shrinks to a chip and travels into the Lovable node
// ---------------------------------------------------------------------------
type DocRow =
  | { kind: "text"; t: string; at: number }
  | { kind: "bar"; w: number; at: number }
  | { kind: "chip"; t: string; at: number }
  | { kind: "gap"; h: number };

const DOC_ROWS: DocRow[] = [
  { kind: "text", t: "Build a 3D animated landing", at: 84 },
  { kind: "text", t: "page for a stealth drone", at: 89 },
  { kind: "text", t: "concept called Dronea.", at: 94 },
  { kind: "gap", h: 12 },
  { kind: "text", t: "Use the attached video as the", at: 101 },
  { kind: "text", t: "hero reference, and lusion.co", at: 106 },
  { kind: "text", t: "for visual direction.", at: 111 },
  { kind: "gap", h: 14 },
  { kind: "bar", w: 1, at: 117 },
  { kind: "bar", w: 0.78, at: 121 },
  { kind: "bar", w: 0.56, at: 125 },
  { kind: "gap", h: 12 },
  { kind: "chip", t: "three spec cards", at: 130 },
  { kind: "chip", t: "Explore the Design button", at: 134 },
  { kind: "gap", h: 12 },
  { kind: "bar", w: 0.64, at: 138 },
];

const DocCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < DOC_POP || frame > 194) return null;

  const s = spring({ frame: frame - DOC_POP, fps, config: SPRINGS.snappy, durationInFrames: 26 });
  const entScale = interpolate(s, [0, 1], [0.86, 1]);
  const rise = interpolate(s, [0, 1], [26, 0]);
  const entOp = interpolate(frame, [DOC_POP, DOC_POP + 8], [0, 1], clamp);

  const shrinkP = interpolate(frame, [DOC_SHRINK, DOC_TRAVEL], [0, 1], { ...clamp, easing: EASE });
  const travelP = interpolate(frame, [DOC_TRAVEL, PULSES[0]], [0, 1], { ...clamp, easing: EASE });
  const cx = DOC.x + (NODE.x - DOC.x) * travelP;
  const scale = entScale * (1 - 0.76 * shrinkP);
  const op = entOp * interpolate(frame, [PULSES[0] - 4, PULSES[0] + 2], [1, 0], clamp);
  if (op <= 0) return null;

  // caret sits at the end of the most recently revealed text line
  const lastTextAt = DOC_ROWS.reduce(
    (acc, r) => ("at" in r && r.kind === "text" && r.at <= frame ? Math.max(acc, r.at) : acc),
    -1
  );

  return (
    <div
      style={{
        position: "absolute",
        left: cx - DOC.w / 2,
        top: DOC.y - DOC.h / 2 + rise,
        width: DOC.w,
        height: DOC.h,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        opacity: op,
        backgroundColor: WORLD.card,
        border: `1px solid ${WORLD.border}`,
        borderRadius: 22,
        boxShadow: WORLD.shadow,
        padding: 32,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header: real Wispr Flow wordmark — the doc came out of Flow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 16,
          marginBottom: 18,
          borderBottom: `1px solid ${WORLD.border}`,
          opacity: interpolate(frame, [DOC_POP + 4, DOC_POP + 12], [0, 1], clamp),
        }}
      >
        <Img src={staticFile(WISPR.logoSvg)} style={{ height: 22, display: "block" }} />
      </div>
      {DOC_ROWS.map((row, i) => {
        if (row.kind === "gap") return <div key={i} style={{ height: row.h }} />;
        const revealed = frame >= row.at;
        const wp = interpolate(frame, [row.at, row.at + 9], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        if (row.kind === "bar") {
          return (
            <div key={i} style={{ height: 24, display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: `${row.w * 100 * wp}%`,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#ECE9E2",
                  opacity: revealed ? 1 : 0,
                }}
              />
            </div>
          );
        }
        if (row.kind === "chip") {
          return (
            <div key={i} style={{ height: 44, display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 16px",
                  borderRadius: 18,
                  backgroundColor: "#F6F4EF",
                  border: `1px solid ${WORLD.border}`,
                  fontFamily: FONT_SANS,
                  fontSize: 19,
                  fontWeight: 500,
                  color: "#5C5952",
                  opacity: revealed ? wp : 0,
                  transform: `translateY(${(1 - wp) * 8}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: LOVABLE.accent,
                    flexShrink: 0,
                  }}
                />
                {row.t}
              </div>
            </div>
          );
        }
        // text line — width wipe reveal, caret on the newest line
        const isCaretLine = row.at === lastTextAt && frame < 140;
        return (
          <div key={i} style={{ height: 33, display: "flex", alignItems: "center" }}>
            <div
              style={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                width: `${wp * 100}%`,
                opacity: revealed ? 1 : 0,
                fontFamily: FONT_SANS,
                fontSize: 21,
                fontWeight: 500,
                color: WORLD.text,
                letterSpacing: 0.1,
              }}
            >
              {row.t}
            </div>
            {isCaretLine && wp >= 1 && (
              <div
                style={{
                  width: 2.5,
                  height: 22,
                  marginLeft: 5,
                  backgroundColor: WORLD.text,
                  opacity: Math.sin(frame * 0.35) > 0 ? 0.85 : 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Funnel lanes into the Lovable node
// ---------------------------------------------------------------------------
type Lane = {
  p0: readonly [number, number];
  c: readonly [number, number];
  p1: readonly [number, number];
};
const LANE_UP: Lane = { p0: [1520, 400], c: [1670, 420], p1: [1694, 508] };
const LANE_DN: Lane = { p0: [1520, 688], c: [1670, 662], p1: [1694, 574] };

const Lanes: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 148) return null;
  const fade = interpolate(frame, [PULSES[2] + 2, PULSES[2] + 16], [1, 0], clamp);
  if (fade <= 0) return null;
  const draw = (t0: number) =>
    interpolate(frame, [t0, t0 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const OX = 1440;
  const OY = 320;
  const d = (l: Lane) =>
    `M ${l.p0[0] - OX} ${l.p0[1] - OY} Q ${l.c[0] - OX} ${l.c[1] - OY} ${l.p1[0] - OX} ${l.p1[1] - OY}`;
  return (
    <svg
      width={480}
      height={440}
      viewBox="0 0 480 440"
      style={{ position: "absolute", left: OX, top: OY, opacity: fade }}
    >
      <g fill="none" stroke="#DCD9D1" strokeWidth={2} strokeLinecap="round">
        <path d={d(LANE_UP)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw(150)} />
        <path
          d={`M ${1480 - OX} ${540 - OY} L ${1694 - OX} ${540 - OY}`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw(154)}
        />
        <path d={d(LANE_DN)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw(158)} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payload chips — real video-thumb crop (from the actual Lovable chat
// capture) + lusion.co link chip, traveling along the lanes
// ---------------------------------------------------------------------------
const THUMB_CROP = { x: 1294, y: 114, s: 100 }; // drone attachment thumb (video frame)
const THUMB_SIZE = 88;
const TS = THUMB_SIZE / THUMB_CROP.s;

const PayloadChip: React.FC<{
  lane: Lane;
  pop: number;
  t0: number;
  t1: number;
  bobPhase: number;
  children: React.ReactNode;
  w: number;
  h: number;
}> = ({ lane, pop, t0, t1, bobPhase, children, w, h }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < pop) return null;
  const p = interpolate(frame, [t0, t1], [0, 1], { ...clamp, easing: EASE });
  if (p >= 1) return null;
  const s = spring({ frame: frame - pop, fps, config: SPRINGS.snappy, durationInFrames: 24 });
  const [x, y] = qbez(lane.p0, lane.c, lane.p1, p);
  const bob = p === 0 ? 4 * Math.sin(frame * 0.06 + bobPhase) : 0;
  const scale = interpolate(s, [0, 1], [0.6, 1]) * (1 - 0.62 * interpolate(p, [0.7, 1], [0, 1], clamp));
  const op =
    interpolate(frame, [pop, pop + 7], [0, 1], clamp) * interpolate(p, [0.82, 1], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2 + bob,
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        opacity: op,
      }}
    >
      {children}
    </div>
  );
};

const ThumbChip: React.FC = () => (
  <PayloadChip lane={LANE_UP} pop={150} t0={176} t1={PULSES[1]} bobPhase={1.2} w={THUMB_SIZE} h={THUMB_SIZE}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.18)",
        boxShadow: WORLD.shadowSoft,
        backgroundColor: "#111111",
      }}
    >
      <Img
        src={staticFile("lovable/reference/app-10-mid-build.png")}
        style={{
          position: "absolute",
          width: 2880 * TS,
          height: 1800 * TS,
          left: -THUMB_CROP.x * TS,
          top: -THUMB_CROP.y * TS,
        }}
      />
      {/* small play badge -> reads as the attached video */}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "rgba(255,255,255,0.92)",
        }}
      >
        <svg width={22} height={22} viewBox="0 0 22 22" style={{ position: "absolute", inset: 0 }}>
          <path d="M9 7 L15 11 L9 15 Z" fill="#111111" />
        </svg>
      </div>
    </div>
  </PayloadChip>
);

const LinkChip: React.FC = () => (
  <PayloadChip lane={LANE_DN} pop={156} t0={184} t1={PULSES[2]} bobPhase={3.4} w={172} h={48}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 24,
        backgroundColor: WORLD.card,
        border: `1px solid ${WORLD.border}`,
        boxShadow: WORLD.shadowSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <svg width={17} height={17} viewBox="0 0 17 17">
        <g fill="none" stroke="#8A867E" strokeWidth={1.6}>
          <circle cx={8.5} cy={8.5} r={6.6} />
          <ellipse cx={8.5} cy={8.5} rx={3} ry={6.6} />
          <path d="M2 8.5 H15" />
        </g>
      </svg>
      <span
        style={{ fontFamily: FONT_MONO, fontSize: 20, color: "#5C5952", letterSpacing: 0.2 }}
      >
        lusion.co
      </span>
    </div>
  </PayloadChip>
);

// ---------------------------------------------------------------------------
// Lovable node — real heart logo; pulses as each payload lands
// ---------------------------------------------------------------------------
const LovableNode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < NODE_POP) return null;
  const s = spring({ frame: frame - NODE_POP, fps, config: SPRINGS.snappy, durationInFrames: 26 });

  let pulse = 0;
  for (const t0 of PULSES) {
    const dt = frame - t0;
    if (dt >= 0 && dt <= 14) pulse = Math.max(pulse, Math.sin((Math.PI * dt) / 14));
  }
  const scale = interpolate(s, [0, 1], [0.7, 1]) * (1 + 0.09 * pulse);
  const op =
    interpolate(frame, [NODE_POP, NODE_POP + 8], [0, 1], clamp) *
    interpolate(frame, [220, 234], [1, 0], clamp);
  if (op <= 0) return null;

  return (
    <>
      {/* accent rings expanding per arrival */}
      {PULSES.map((t0, i) => {
        if (frame < t0 || frame > t0 + 22) return null;
        const rp = interpolate(frame, [t0, t0 + 22], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        const r = 112 + 130 * rp;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: NODE.x - r,
              top: NODE.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              border: `2px solid rgba(37, 99, 235, ${0.38 * (1 - rp)})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: NODE.x - NODE.s / 2,
          top: NODE.y - NODE.s / 2,
          width: NODE.s,
          height: NODE.s,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          opacity: op,
          backgroundColor: WORLD.card,
          border: `1px solid ${WORLD.border}`,
          borderRadius: 46,
          boxShadow: WORLD.shadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img src={staticFile(LOVABLE.logoSvg)} style={{ width: 104, display: "block" }} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Spark — the node fires the build toward the site card
// ---------------------------------------------------------------------------
const Spark: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SPARK[0] || frame > SPARK[1] + 2) return null;
  const p = interpolate(frame, [SPARK[0], SPARK[1]], [0, 1], { ...clamp, easing: EASE });
  const x0 = NODE.x + NODE.s / 2;
  const x1 = SITE.x - SITE.w / 2 + 8;
  const op =
    interpolate(frame, [SPARK[0], SPARK[0] + 3], [0, 1], clamp) *
    interpolate(p, [0.85, 1], [1, 0], clamp);
  return (
    <>
      {[0, 0.09, 0.18].map((lag, i) => {
        const pp = Math.max(0, p - lag);
        const r = 7 - i * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + (x1 - x0) * pp - r,
              top: NODE.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              backgroundColor: LOVABLE.accent,
              opacity: op * (1 - i * 0.32),
            }}
          />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// The built site — browser-chrome card playing the REAL site capture
// ---------------------------------------------------------------------------
const SiteCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < SITE_POP - 2) return null;
  const s = spring({
    frame: Math.max(0, frame - SITE_POP),
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 26,
  });
  const scale = interpolate(s, [0, 1], [0.93, 1]);
  const rise = interpolate(s, [0, 1], [24, 0]);
  const op = interpolate(frame, [SITE_POP, SITE_POP + 7], [0, 1], clamp);

  const wipeP = interpolate(frame, [WIPE[0], WIPE[1]], [0, 1], { ...clamp, easing: EASE });
  const sheenX = wipeP * SITE.w;
  const sheenOp = wipeP > 0 && wipeP < 1 ? Math.sin(Math.PI * wipeP) * 0.85 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: SITE.x - SITE.w / 2,
        top: SITE.y - SITE.h / 2 + rise,
        width: SITE.w,
        height: SITE.h,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        opacity: op,
        borderRadius: WORLD.radius,
        background: WORLD.card,
        border: `1px solid ${WORLD.border}`,
        boxShadow: WORLD.shadow,
        overflow: "hidden",
      }}
    >
      {/* browser chrome — same language as the approved LwP1 card */}
      <div
        style={{
          height: SITE_CHROME,
          display: "flex",
          alignItems: "center",
          paddingLeft: 26,
          paddingRight: 26,
          borderBottom: "1px solid #EEECE7",
          background: WORLD.card,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FEBC2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#28C840" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 430,
            height: 38,
            borderRadius: 19,
            background: "#F4F3EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="12" height="14" viewBox="0 0 12 14" style={{ display: "block" }}>
            <rect x="1" y="6" width="10" height="7" rx="2" fill="none" stroke={WORLD.muted} strokeWidth="1.5" />
            <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke={WORLD.muted} strokeWidth="1.5" />
          </svg>
          <span style={{ fontFamily: FONT_SANS, fontSize: 19, color: WORLD.muted, letterSpacing: 0.2 }}>
            dronea.design
          </span>
        </div>
      </div>

      {/* viewport: loading heart -> wipe reveals the real live capture */}
      <div
        style={{
          position: "relative",
          width: SITE.w,
          height: SITE_VIDEO_H,
          overflow: "hidden",
          backgroundColor: DRONEA.paper,
        }}
      >
        {wipeP < 1 && (
          <Img
            src={staticFile(LOVABLE.logoSvg)}
            style={{
              position: "absolute",
              left: SITE.w / 2 - 33,
              top: SITE_VIDEO_H / 2 - 30,
              width: 66,
              display: "block",
              filter: "grayscale(1) brightness(0.72)",
              opacity: 0.5 + 0.14 * Math.sin(frame * 0.24),
            }}
          />
        )}
        <Sequence from={VIDEO_START} layout="none">
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${(1 - wipeP) * 100}% 0 0)`,
            }}
          >
            <OffthreadVideo
              muted
              src={staticFile("lovable/site-live.mp4")}
              style={{
                width: SITE.w,
                height: SITE_VIDEO_H,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        </Sequence>
        {/* shimmer band riding the wipe edge */}
        {sheenOp > 0 && (
          <div
            style={{
              position: "absolute",
              top: -40,
              bottom: -40,
              left: sheenX - 55,
              width: 110,
              transform: "skewX(-12deg)",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
              opacity: sheenOp,
            }}
          />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const LwP5CleansUp: React.FC = () => {
  const frame = useCurrentFrame();

  const fx = interpolate(frame, KEY_T, KEY_FX, { easing: EASE, ...clamp });
  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: EASE, ...clamp });
  const z = interpolate(frame, KEY_T, KEY_Z, { easing: EASE, ...clamp });

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, fontFamily: FONT_SANS }}>
      {/* full-bleed ambient light — background only */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1100px 860px at 50% 44%, rgba(255,255,255,0.65), rgba(255,255,255,0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <PillToDoc />
        <Lanes />
        <MessyChips />
        <DictationPill />
        <DocCard />
        <ThumbChip />
        <LinkChip />
        <LovableNode />
        <Spark />
        <SiteCard />
      </div>
    </AbsoluteFill>
  );
};
