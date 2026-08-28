import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BRAND,
  C,
  Card,
  DISPLAY,
  EASE,
  FACTS,
  fmt,
  FONT,
  GOOGLE,
  GT,
  LogoImg,
  MONO,
  PaperWorld,
  SPRINGS,
  StitchTile,
  tabular,
  useCam,
  useCountUp,
  useEnter,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical/horizontal world (1080×1920 view).
//
//   prompt cluster: tile + input card          y   -12…610   (x 140…940)
//   phone mock (assembles during the hold)     y  1430…2450  (x 290…790)
//   outputs: code panel / Figma / 350 chips    y  1700…2280  (x 1000…1784)
//   attribution: Stitch tile + URL pill        y ~2385…2495  (centered x 1392)
//
// Camera: hold on the prompt while it types → send click → whip down to the
// phone (z 1.2) while the UI assembles → pan right/down to the outputs
// (z 0.95, phone fully off-frame) → pull out to hold phone + outputs together
// (z 0.73 — code panel mono still ≥30px on screen; the phone shrinks and
// slides right during the pull-out to make room). Margins checked per hold.
// ---------------------------------------------------------------------------

const TILE = { size: 216, x: 540 - 108, y: 70 };
const URL_Y = 10; // pill center
const IN = { x: 140, y: 360, w: 800, h: 250, r: 30, pad: 34 };

const PH = { x: 290, y: 1430, w: 500, h: 1020, r: 64 };
const SCR = { x: PH.x + 12, y: PH.y + 12, w: 476, h: 996, r: 54 };
const RING = { cx: 238, cy: 430, r: 118, stroke: 20 }; // screen-relative
const CIRC = 2 * Math.PI * RING.r;

// Code panel + chips sized so mono renders ≥30px on screen even in the final
// pulled-out framing (42px world × z0.73 ≈ 31px). The chip row is exactly the
// panel width (380 + 24 + 380 = 784) so the group reads as one aligned stack.
const CODE = { x: 1000, y: 1700, w: 784, h: 364, bar: 78 };
const CHIP = { y: 2100, w: 380, h: 180, gap: 24 };
const FIG = { x: CODE.x, y: CHIP.y, w: CHIP.w, h: CHIP.h };
const CNT = { x: CODE.x + CHIP.w + CHIP.gap, y: CHIP.y, w: CHIP.w, h: CHIP.h };
const ATTR = { cx: CODE.x + CODE.w / 2, cy: 2440 };

// Typed prompt — pre-split at a word boundary so the wrap point never moves
// while characters append (no mid-word wrap, no reflow jump).
const PROMPT_L1 = "Meditation app home screen with a";
const PROMPT_L2 = "daily streak ring";
const PROMPT = `${PROMPT_L1} ${PROMPT_L2}`;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// Dark-panel code tints (Google dark-theme blue for tags, warm strings).
const TAG = "#8AB4F8";
const STR = "#E0A458";

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  tile: -4, // pre-rolls so frame 0 opens mid-pop
  url: 6,
  card: 14,
  type: 36, // 51 chars @ 1 c/f → done 87
  btnOn: 90, // send button activates (gray → blue)
  press: 95, // down 95–98, back up 98–108, ripple 98–114
  bezel: 106, // phone shell springs up mid-travel
  status: 116,
  header: 122,
  avatar: 126, // disc + glyph on ONE spring
  ringTrack: 126, // camera lands 120 — ring starts immediately (was 140)
  ringDraw: 130, // → 158 (stroke-dash draw)
  count: 132, // streak number 0 → 12, lands 154
  card1: 136, // first session card right behind the ring (was 158)
  ringLabel: 140,
  card2: 144,
  codeChip: 206,
  attrib: 210, // Stitch tile + URL pill — anchored through the payoff
  figma: 212,
  codeLines: [212, 216, 220],
  counter: 215,
  tick: 217, // 0 → 350 over 14f, lands 231 = 15f before the 246 end hold
} as const;

// ---------------------------------------------------------------------------
// Section 1 — Stitch identity + prompt input
// ---------------------------------------------------------------------------

const TileIntro: React.FC = () => {
  const s = useEnter(T.tile, SPRINGS.pop);
  return (
    <div
      style={{
        position: "absolute",
        left: TILE.x,
        top: TILE.y,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 30}px) scale(${0.86 + 0.14 * s})`,
      }}
    >
      <StitchTile
        size={TILE.size}
        style={{ boxShadow: "0 16px 38px rgba(25,23,20,0.14)" }}
      />
    </div>
  );
};

const UrlChip: React.FC = () => {
  const s = useEnter(T.url, SPRINGS.pop);
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: URL_Y - 27,
        transform: `translateX(-50%) translateY(${(1 - s) * 14}px)`,
        opacity: Math.min(1, s),
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 999,
        padding: "10px 26px",
        fontFamily: MONO,
        fontSize: 30,
        color: C.muted,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {FACTS.stitch.url}
    </div>
  );
};

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: "inline-block",
      width: 15,
      height: 34,
      marginLeft: 4,
      verticalAlign: "-4px",
      background: GOOGLE.blue,
      opacity: on ? 0.9 : 0.15,
    }}
  />
);

const PromptCard: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = useEnter(T.card, SPRINGS.pop);
  const typed = useTypewriter(PROMPT, T.type, 1);
  const n = typed.length;
  const typing = frame >= T.type && n < PROMPT.length;
  const caretOn = typing || frame % 20 < 12;
  // Fixed word-boundary split: line 1 fills to its full word, line 2 takes
  // over only after the joining space is consumed. Both line boxes are always
  // rendered so nothing ever reflows.
  const line1 = PROMPT.slice(0, Math.min(n, PROMPT_L1.length));
  const line2 = n > PROMPT_L1.length + 1 ? PROMPT.slice(PROMPT_L1.length + 1, n) : "";
  const caretOnLine2 = n >= PROMPT_L1.length;

  // Send button: disabled gray → active blue once the prompt is complete,
  // then a real click: press dip, release overshoot, expanding ripple.
  const activeT = interpolate(frame, [T.btnOn, T.btnOn + 6], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const pressScale = interpolate(
    frame,
    [T.press, T.press + 3, T.press + 8, T.press + 13],
    [1, 0.88, 1.06, 1],
    { ...CLAMP, easing: EASE },
  );
  const rippleT = interpolate(frame, [T.press + 3, T.press + 19], [0, 1], CLAMP);

  const BTN = 56;
  const btnLeft = IN.w - IN.pad - BTN;
  const btnTop = IN.h - IN.pad - BTN;

  return (
    <Card x={IN.x} y={IN.y} w={IN.w} h={IN.h} r={IN.r} enter={cardIn}>
      {/* typed user prompt — pre-broken at a word boundary, zero reflow */}
      <div
        style={{
          position: "absolute",
          left: IN.pad,
          top: 30,
          width: IN.w - IN.pad * 2,
          fontFamily: MONO,
          fontSize: 32,
          lineHeight: "48px",
          color: C.ink,
        }}
      >
        <div style={{ height: 48, whiteSpace: "pre" }}>
          {line1}
          {!caretOnLine2 ? <Caret on={caretOn} /> : null}
        </div>
        <div style={{ height: 48, whiteSpace: "pre" }}>
          {line2}
          {caretOnLine2 ? <Caret on={caretOn} /> : null}
        </div>
      </div>

      {/* attachment affordance (icon only) */}
      <div
        style={{
          position: "absolute",
          left: IN.pad,
          top: btnTop + 5,
          width: 46,
          height: 46,
          borderRadius: 999,
          border: `2px solid ${C.line}`,
          background: "#FCFBF9",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={20} height={20} viewBox="0 0 20 20">
          <path
            d="M10 3 V17 M3 10 H17"
            stroke={C.mutedSoft}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ripple on click */}
      {rippleT > 0 && rippleT < 1 ? (
        <div
          style={{
            position: "absolute",
            left: btnLeft,
            top: btnTop,
            width: BTN,
            height: BTN,
            borderRadius: 999,
            border: `2.5px solid ${GOOGLE.blue}`,
            opacity: 0.55 * (1 - rippleT),
            transform: `scale(${1 + rippleT * 1.5})`,
          }}
        />
      ) : null}

      {/* send button — gray idle, blue armed */}
      <div
        style={{
          position: "absolute",
          left: btnLeft,
          top: btnTop,
          width: BTN,
          height: BTN,
          borderRadius: 999,
          background: "#ECE7DE",
          display: "grid",
          placeItems: "center",
          transform: `scale(${pressScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background: GOOGLE.blue,
            opacity: activeT,
          }}
        />
        <svg width={26} height={26} viewBox="0 0 24 24" style={{ position: "relative" }}>
          <path
            d="M12 19 V5 M5.5 11.5 L12 5 L18.5 11.5"
            stroke={activeT > 0.5 ? "#FFFFFF" : "#B4ACA0"}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Section 2 — phone mock, assembled piece by piece during the hold
// ---------------------------------------------------------------------------

const StatusGlyphs: React.FC = () => (
  <svg width={110} height={24} viewBox="0 0 110 24" style={{ opacity: 0.82 }}>
    {/* signal */}
    <rect x={0} y={14} width={4.5} height={8} rx={1.5} fill={C.ink} />
    <rect x={7} y={10} width={4.5} height={12} rx={1.5} fill={C.ink} />
    <rect x={14} y={6} width={4.5} height={16} rx={1.5} fill={C.ink} />
    <rect x={21} y={2} width={4.5} height={20} rx={1.5} fill={C.ink} />
    {/* wifi */}
    <path
      d="M39.1 12.1 A14 14 0 0 1 58.9 12.1"
      stroke={C.ink}
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M42.6 15.6 A9 9 0 0 1 55.4 15.6"
      stroke={C.ink}
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
    <circle cx={49} cy={20} r={2.4} fill={C.ink} />
    {/* battery */}
    <rect
      x={72}
      y={4}
      width={30}
      height={16}
      rx={4}
      stroke={C.ink}
      strokeWidth={2}
      fill="none"
    />
    <rect x={75.5} y={7.5} width={19} height={9} rx={2} fill={C.ink} />
    <rect x={105} y={9} width={3} height={6} rx={1.5} fill={C.ink} />
  </svg>
);

const SunGlyph: React.FC = () => (
  <svg width={34} height={34} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={4.6} fill={GOOGLE.blue} />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        <line
          key={a}
          x1={12 + Math.cos(rad) * 7.4}
          y1={12 + Math.sin(rad) * 7.4}
          x2={12 + Math.cos(rad) * 10.4}
          y2={12 + Math.sin(rad) * 10.4}
          stroke={GOOGLE.blue}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

const MoonGlyph: React.FC = () => (
  <svg width={34} height={34} viewBox="0 0 24 24">
    <path
      d="M16.8 3.6 A9.3 9.3 0 1 0 21.4 15.2 A7.6 7.6 0 0 1 16.8 3.6 Z"
      fill={GOOGLE.blue}
    />
  </svg>
);

const SessionCard: React.FC<{
  top: number;
  enter: number;
  glyph: React.ReactNode;
  title: string;
  mins: string;
}> = ({ top, enter, glyph, title, mins }) => (
  <div
    style={{
      position: "absolute",
      left: 28,
      top,
      width: SCR.w - 56,
      height: 126,
      borderRadius: 24,
      background: "#FAF8F4",
      border: `1.5px solid ${C.lineSoft}`,
      opacity: Math.min(1, enter),
      transform: `translateY(${(1 - enter) * 22}px)`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 27,
        width: 70,
        height: 70,
        borderRadius: 20,
        background: GOOGLE.blueSoft,
        display: "grid",
        placeItems: "center",
      }}
    >
      {glyph}
    </div>
    <div
      style={{
        position: "absolute",
        left: 114,
        top: 26,
        fontFamily: FONT,
        fontSize: 30,
        fontWeight: 600,
        color: C.ink,
        letterSpacing: -0.3,
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </div>
    <div
      style={{
        position: "absolute",
        left: 114,
        top: 68,
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 500,
        color: C.muted,
        whiteSpace: "nowrap",
      }}
    >
      {mins}
    </div>
    <div
      style={{
        position: "absolute",
        right: 24,
        top: 40,
        width: 46,
        height: 46,
        borderRadius: 999,
        background: GOOGLE.blue,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={15} height={18} viewBox="0 0 15 18" style={{ marginLeft: 3 }}>
        <path d="M1.5 1.5 L13.5 9 L1.5 16.5 Z" fill="#FFFFFF" />
      </svg>
    </div>
  </div>
);

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bezelIn = spring({
    frame: frame - T.bezel,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const statusIn = useEnter(T.status, SPRINGS.pop);
  const headerIn = useEnter(T.header, SPRINGS.pop);
  // Defect fix: the avatar disc + "M" glyph pop on ONE shared spring so the
  // letter never floats without its circle mid-entrance.
  const avatarIn = useEnter(T.avatar, SPRINGS.pop);
  const trackIn = useEnter(T.ringTrack, SPRINGS.pop);
  const labelIn = useEnter(T.ringLabel, SPRINGS.pop);
  const c1In = useEnter(T.card1, SPRINGS.pop);
  const c2In = useEnter(T.card2, SPRINGS.pop);

  const progress = interpolate(frame, [T.ringDraw, T.ringDraw + 28], [0, 0.78], {
    ...CLAMP,
    easing: EASE,
  });
  const streak = Math.round(useCountUp({ to: 12, start: T.count, duration: 22 }));

  // End-framing compensation: as the camera pulls out to the payoff, the
  // phone shrinks and slides right so the enlarged code stack fits alongside.
  const endT = interpolate(frame, [228, 246], [0, 1], { ...CLAMP, easing: EASE });
  const endScale = 1 - endT * 0.25;
  const endShift = endT * 120;

  if (bezelIn <= 0.001) return null;

  const avatarS = Math.min(1, avatarIn);

  return (
    <div
      style={{
        position: "absolute",
        left: PH.x,
        top: PH.y,
        width: PH.w,
        height: PH.h,
        borderRadius: PH.r,
        background: BRAND.stitch.tile,
        boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
        opacity: Math.min(1, bezelIn * 1.4),
        transform: `translateY(${(1 - bezelIn) * 70}px) translateX(${endShift}px) scale(${endScale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          width: SCR.w,
          height: SCR.h,
          borderRadius: SCR.r,
          background: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* dynamic island — hardware, appears with the bezel */}
        <div
          style={{
            position: "absolute",
            left: SCR.w / 2 - 60,
            top: 22,
            width: 120,
            height: 36,
            borderRadius: 999,
            background: BRAND.stitch.tile,
            opacity: Math.min(1, bezelIn),
          }}
        />

        {/* status bar */}
        <div
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            top: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: Math.min(1, statusIn),
            transform: `translateY(${(1 - statusIn) * -14}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 27,
              fontWeight: 600,
              color: C.ink,
            }}
          >
            9:41
          </div>
          <StatusGlyphs />
        </div>

        {/* greeting header */}
        <div
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            top: 96,
            opacity: Math.min(1, headerIn),
            transform: `translateY(${(1 - headerIn) * 20}px)`,
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.muted }}>
            Good morning
          </div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 44,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.8,
              marginTop: 4,
            }}
          >
            Maya
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 6,
              width: 60,
              height: 60,
              borderRadius: 999,
              background: "#E8F0FE",
              border: `2px solid ${GOOGLE.blueLine}`,
              boxSizing: "border-box",
              display: "grid",
              placeItems: "center",
              fontFamily: DISPLAY,
              fontSize: 28,
              fontWeight: 700,
              color: GOOGLE.blue,
              opacity: avatarS,
              transform: `scale(${0.6 + 0.4 * avatarS})`,
            }}
          >
            M
          </div>
        </div>

        {/* streak ring — draws itself */}
        <svg
          width={SCR.w}
          height={SCR.h}
          viewBox={`0 0 ${SCR.w} ${SCR.h}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: Math.min(1, trackIn),
            transform: `scale(${0.92 + 0.08 * Math.min(1, trackIn)})`,
            transformOrigin: `${RING.cx}px ${RING.cy}px`,
          }}
        >
          <circle
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            stroke="rgba(66,133,244,0.14)"
            strokeWidth={RING.stroke}
            fill="none"
          />
          {progress > 0 ? (
            <circle
              cx={RING.cx}
              cy={RING.cy}
              r={RING.r}
              stroke={GOOGLE.blue}
              strokeWidth={RING.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              transform={`rotate(-90 ${RING.cx} ${RING.cy})`}
            />
          ) : null}
        </svg>
        <div
          style={{
            position: "absolute",
            left: RING.cx - 120,
            top: RING.cy - 78,
            width: 240,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: 96,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: -2,
            opacity: Math.min(1, trackIn),
            ...tabular,
          }}
        >
          {streak}
        </div>
        <div
          style={{
            position: "absolute",
            left: RING.cx - 120,
            top: RING.cy + 46,
            width: 240,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: 21,
            fontWeight: 600,
            color: C.muted,
            letterSpacing: 2.2,
            opacity: Math.min(1, labelIn),
          }}
        >
          DAY STREAK
        </div>

        {/* session cards — real labels, Inter */}
        <SessionCard
          top={660}
          enter={c1In}
          glyph={<SunGlyph />}
          title="Morning Calm"
          mins="10 min"
        />
        <SessionCard
          top={806}
          enter={c2In}
          glyph={<MoonGlyph />}
          title="Deep Sleep"
          mins="20 min"
        />

        {/* home indicator */}
        <div
          style={{
            position: "absolute",
            left: SCR.w / 2 - 65,
            bottom: 12,
            width: 130,
            height: 5,
            borderRadius: 3,
            background: "rgba(10,10,10,0.18)",
            opacity: Math.min(1, statusIn),
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section 3 — outputs: code panel, Figma chip, monthly-quota chip, attribution
// ---------------------------------------------------------------------------

type Seg = { t: string; c: string };

const CODE_LINES: Seg[][] = [
  [
    { t: "<", c: C.termText },
    { t: "Header", c: TAG },
    { t: " name=", c: C.termText },
    { t: '"Maya"', c: STR },
    { t: " />", c: C.termText },
  ],
  [
    { t: "<", c: C.termText },
    { t: "StreakRing", c: TAG },
    { t: " value=", c: C.termText },
    { t: "{12}", c: "#FFFFFF" },
    { t: " />", c: C.termText },
  ],
  [
    { t: "<", c: C.termText },
    { t: "SessionList", c: TAG },
    { t: " items=", c: C.termText },
    { t: "{2}", c: "#FFFFFF" },
    { t: " />", c: C.termText },
  ],
];

const CodeChip: React.FC = () => {
  const frame = useCurrentFrame();
  const chipIn = useEnter(T.codeChip, SPRINGS.pop);
  const lineIn = [
    useEnter(T.codeLines[0], SPRINGS.pop),
    useEnter(T.codeLines[1], SPRINGS.pop),
    useEnter(T.codeLines[2], SPRINGS.pop),
  ];
  const caretOn = frame % 20 < 12;
  if (chipIn <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: CODE.x,
        top: CODE.y,
        width: CODE.w,
        height: CODE.h,
        borderRadius: 26,
        background: C.term,
        boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
        overflow: "hidden",
        opacity: Math.min(1, chipIn),
        transform: `translateX(${(1 - chipIn) * 70}px)`,
      }}
    >
      {/* titlebar — centered filename, no traffic dots (one metaphor) */}
      <div
        style={{
          height: CODE.bar,
          background: C.termBar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            color: C.termMuted,
            letterSpacing: 0.2,
          }}
        >
          HomeScreen.tsx
        </div>
      </div>
      <div style={{ padding: "30px 44px" }}>
        {CODE_LINES.map((segs, i) => (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontSize: 42,
              lineHeight: "68px",
              whiteSpace: "pre",
              opacity: Math.min(1, lineIn[i]),
              transform: `translateX(${(1 - lineIn[i]) * -18}px)`,
            }}
          >
            {segs.map((s, j) => (
              <span key={j} style={{ color: s.c }}>
                {s.t}
              </span>
            ))}
            {i === CODE_LINES.length - 1 ? (
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 40,
                  marginLeft: 8,
                  verticalAlign: "-5px",
                  background: C.termText,
                  opacity: caretOn ? 0.85 : 0.12,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

const FigmaChip: React.FC = () => {
  const s = useEnter(T.figma, SPRINGS.pop);
  if (s <= 0.001) return null;
  return (
    <Card x={FIG.x} y={FIG.y} w={FIG.w} h={FIG.h} r={28} enter={Math.min(1, s)}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
        }}
      >
        <LogoImg src={GT.logos.figma} size={80} />
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 54,
            fontWeight: 600,
            color: C.ink,
            letterSpacing: -0.8,
          }}
        >
          Figma
        </div>
      </div>
    </Card>
  );
};

const CounterChip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - T.counter, fps, config: SPRINGS.bouncy });
  const v = useCountUp({
    to: FACTS.stitch.monthlyDesigns,
    start: T.tick,
    duration: 14,
  });
  if (s <= 0.001) return null;
  return (
    <Card x={CNT.x} y={CNT.y} w={CNT.w} h={CNT.h} r={28} enter={Math.min(1, s)}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 72,
            fontWeight: 700,
            color: C.ink,
            lineHeight: "78px",
            ...tabular,
          }}
        >
          {fmt(v)}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 700,
            color: C.muted,
            lineHeight: "40px",
          }}
        >
          designs / mo
        </div>
      </div>
    </Card>
  );
};

/** Small Stitch tile + URL pill — attribution anchored through the payoff. */
const Attribution: React.FC = () => {
  const s = useEnter(T.attrib, SPRINGS.pop);
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: ATTR.cx,
        top: ATTR.cy,
        transform: `translate(-50%, -50%) translateY(${(1 - s) * 26}px)`,
        opacity: Math.min(1, s),
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <StitchTile
        size={104}
        style={{ boxShadow: "0 12px 30px rgba(25,23,20,0.14)" }}
      />
      <div
        style={{
          background: C.card,
          border: `1.5px solid ${C.line}`,
          borderRadius: 999,
          padding: "12px 32px",
          fontFamily: MONO,
          fontSize: 42,
          color: C.muted,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}
      >
        {FACTS.stitch.url}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP3Stitch: React.FC = () => {
  // hold prompt (types + click) → whip down to phone (assembles during hold)
  // → pan right/down to outputs (phone fully off-frame at z 0.95) → pull out
  // to phone + outputs + attribution. Last two keys near-identical for a
  // clean end hold; the payoff z 0.73 keeps code-panel mono ≥30px on screen.
  const cam = useCam({
    keys: [0, 100, 120, 190, 208, 230, 246, 253, 260],
    fx: [540, 540, 540, 540, 1392, 1392, 1128, 1128, 1128],
    fy: [300, 300, 1940, 1940, 2080, 2080, 2000, 2000, 2000],
    z: [1.12, 1.12, 1.2, 1.2, 0.95, 0.95, 0.73, 0.7312, 0.7325],
  });

  return (
    <PaperWorld cam={cam}>
      <TileIntro />
      <UrlChip />
      <PromptCard />
      <Phone />
      <CodeChip />
      <FigmaChip />
      <CounterChip />
      <Attribution />
    </PaperWorld>
  );
};
