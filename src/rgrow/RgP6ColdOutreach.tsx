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
import { COLDMAIL, FONT_SANS, GROW, LW, RN, SHOTS, SPRINGS, safePadX } from "./theme";

// ============================================================================
// RgP6ColdOutreach — 1080x1080 @ 30fps  (1:1 insert over the talking head)
// VO [0:32-0:38]: "Then it makes the cold emails too. So the content and the
//                  outreach and the ads all keep moving without you."
//
// SHOW HOW IT ACTUALLY WORKS. The middle of this clip is the REAL Cold Emailing
// modal, rebuilt as crisp vector/DOM UI from the live capture
// (public/rgrow/capture/grow-05-cold-emailing.png + grow-06-cold-emailing-2.png)
// — every string comes from COLDMAIL in theme.ts, nothing is paraphrased and
// nothing is invented.
//
// One continuous world, one keyframed camera, hold -> move -> hold:
//   0-28    HOLD   tight on the real Cold Outreach pair on the Grow page
//                  (grow-04 capture). Cold Calling is already live; Cold
//                  Emailing switches ITSELF on — amber dot ignites, go-live
//                  ring expands. There is no cursor anywhere in this world.
//   28-46   MOVE   (18f) travel down to the modal assembling itself: title,
//                  sub, "Who to contact", then the three data chips popping in
//                  staggered, then the grey research line.
//   46-104  HOLD   star beat. The modal finishes itself: Frequency/Time settle,
//                  "Draft and notify me" ticks itself, "Start emailing" goes
//                  from disabled grey to live black and presses itself.
//   104-128 MOVE   (24f) pull back — the modal docks down into ONE lane of a
//                  running system: content lane, outreach lane, ads lane.
//   128-154 HOLD   three lanes running in staggered rhythm, micro-motion only.
//   154-179 END    two nearly identical camera keys for a clean editor cut.
//
// AUTHENTICITY: the phone / envelope / Instagram / LinkedIn / X / Tiktok glyphs
// are live crops of the real Runable Grow screenshot; the ads lane uses the real
// public/logos/meta.svg and public/logos/google.svg. Email packets are abstract
// subject-line bars — no recipients, companies, or readable email copy, ever.
//
// SKIN: LIAM WHITE — LW.paper world, floating LW.card surfaces, Runable amber as
// the single accent, dark only inside the primary button.
// ============================================================================

export const DURATION_IN_FRAMES = 180;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 1900;
const WORLD_H = 1900;

// --- Station A: the real Cold Outreach section on the Grow page -------------
const SECT_X = 170;
const SECT_Y = 58;
const SECT_W = 880;
const SECT_H = 312;
const SECT_PAD = 36;
const TILE_W = Math.round((SECT_W - SECT_PAD * 2 - 24) / 2); // 392
const TILE_H = 160;
const TILE_Y = 116;

// neighbouring section strips, so the open reads as the real scrolling page
const NB_TOP_Y = -66;
const NB_BOT_Y = 400;
const NB_H = 90;

// --- Station B: the real Cold Emailing modal --------------------------------
const MODAL_X = 160;
const MODAL_Y = 440;
const MODAL_W = 900;
const MODAL_H = 900; // centre lands on 890 — the outreach lane's line
const MP = 46; // modal padding
const MI = MODAL_W - MP * 2; // 808 inner width
const COL_W = Math.round((MI - 24) / 2); // 392
const COL_X2 = MP + COL_W + 24; // 462

// --- Station C: the running system -----------------------------------------
const LANE_X = MODAL_X; // the docked modal keeps its left edge
const LANE_W = 500;
const LANE_H = 136;
const LANE_GAP = 330;

const Y_OUT = MODAL_Y + MODAL_H / 2; // 890
const Y_CONTENT = Y_OUT - LANE_GAP; // 560
const Y_ADS = Y_OUT + LANE_GAP; // 1220

const LANE_TOP = (cy: number) => cy - LANE_H / 2;

const RAIL_X0 = 690;
const RAIL_X1 = 1400;
const RAIL_LEN = RAIL_X1 - RAIL_X0;

/* --------------------------------------------------- real product icons --- */
// Source screenshot is 2400x1636. Centres measured off the live capture; a 50px
// source window lands each glyph clean, no card corner.

const SHOT_W = 2400;
const SHOT_H = 1636;
const ICON_BG = "#F9F6F4"; // sampled straight out of the screenshot

const ICON = {
  call: { cx: 885, cy: 914 },
  mail: { cx: 1508, cy: 914 },
  instagram: { cx: 884, cy: 611 },
  linkedin: { cx: 1195, cy: 611 },
  x: { cx: 1507, cy: 611 },
  tiktok: { cx: 1819, cy: 611 },
} as const;

type IconRef = { cx: number; cy: number };

const IconShot: React.FC<{ cx: number; cy: number; size: number }> = ({
  cx,
  cy,
  size,
}) => {
  const k = size / 50; // 50px source window
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: Math.round(size * 0.2),
        overflow: "hidden",
        backgroundColor: ICON_BG,
      }}
    >
      <Img
        src={staticFile(SHOTS.coldOutreach)}
        style={{
          position: "absolute",
          width: SHOT_W * k,
          height: SHOT_H * k,
          left: size / 2 - cx * k,
          top: size / 2 - cy * k,
          maxWidth: "none",
        }}
      />
    </div>
  );
};

/* ---------------------------------------------------------------- paint --- */

const AMBER = (a: number) => `rgba(222,155,74,${a})`;
const INK = (a: number) => `rgba(0,0,0,${a})`;

const opt = {
  easing: Easing.inOut(Easing.cubic),
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const lin = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// smooth 0 -> 1 -> 0 bell, for the self-press
const bell = (frame: number, a: number, b: number) =>
  Math.sin(interpolate(frame, [a, b], [0, 1], lin) * Math.PI);

// A skeleton block clears in the 5 frames BEFORE its real row starts, so a grey
// bar is never laid over the text that replaces it.
const skel = (frame: number, start: number) =>
  interpolate(frame, [start - 5, start], [1, 0], opt);

const Chevron: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M6 9 L12 15 L18 9"
      stroke={color}
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// the three "who to contact" source glyphs, drawn to match the real chips
const ChipGlyph: React.FC<{ kind: number }> = ({ kind }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" style={{ display: "block" }}>
    {kind === 0 ? (
      <>
        <circle
          cx={12}
          cy={8}
          r={3.4}
          fill="none"
          stroke={RN.textWarm}
          strokeWidth={1.7}
        />
        <path
          d="M5.6 19 C6.6 15.4 9 13.8 12 13.8 C15 13.8 17.4 15.4 18.4 19"
          fill="none"
          stroke={RN.textWarm}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
      </>
    ) : null}
    {kind === 1 ? (
      <>
        <rect
          x={4.5}
          y={5}
          width={9}
          height={14}
          rx={1.4}
          fill="none"
          stroke={RN.textWarm}
          strokeWidth={1.7}
        />
        <rect
          x={13.5}
          y={9.5}
          width={6}
          height={9.5}
          rx={1.4}
          fill="none"
          stroke={RN.textWarm}
          strokeWidth={1.7}
        />
        <path
          d="M7 9 h1.6 M10.4 9 h1.6 M7 12.6 h1.6 M10.4 12.6 h1.6"
          stroke={RN.textWarm}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </>
    ) : null}
    {kind === 2 ? (
      <>
        <rect
          x={4.5}
          y={6}
          width={15}
          height={12.5}
          rx={2.6}
          fill="none"
          stroke={RN.textWarm}
          strokeWidth={1.7}
        />
        <path
          d="M4.5 10.2 h15"
          stroke={RN.textWarm}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={9} cy={14.3} r={1.2} fill={RN.textWarm} />
        <circle cx={15} cy={14.3} r={1.2} fill={RN.textWarm} />
      </>
    ) : null}
  </svg>
);

/* -------------------------------------------------------------- streams --- */

type Stream = {
  t0: number; // frame of the first dispatch
  period: number; // frames between dispatches
  dur: number; // frames to cross the rail
};

type Live = { k: number; p: number };

// Every packet alive on a rail at this frame. Pure function of `frame`.
const alive = (frame: number, s: Stream): Live[] => {
  const out: Live[] = [];
  const kMax = Math.floor((frame - s.t0) / s.period);
  for (let k = Math.max(0, kMax - 8); k <= kMax; k++) {
    const local = frame - (s.t0 + k * s.period);
    if (local >= 0 && local <= s.dur) out.push({ k, p: local / s.dur });
  }
  return out;
};

// Periods are deliberately coprime-ish so the three lanes never beat in sync —
// the staggered rhythm is the point. Each lane is already mid-flight by the time
// its rail fades up, so nothing ever looks like it just started.
const EMAILS: Stream = { t0: 60, period: 18, dur: 76 };
const POSTS: Stream = { t0: 40, period: 21, dur: 84 };
const ADSTREAM: Stream = { t0: 22, period: 24, dur: 92 };

const spawnIn = (p: number) => interpolate(p, [0, 0.05], [0, 1], lin);
const spawnScale = (p: number) => interpolate(p, [0, 0.07], [0.72, 1], lin);

/* ================================================================= comp === */

export const RgP6ColdOutreach: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 22,
  ) =>
    frame < t0
      ? 0
      : spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  const PAD = safePadX(width); // 54 on 1080

  /* ---- camera: hold -> move(18f) -> hold -> move(24f) -> hold -> end ----- */
  const A_FX = SECT_X + SECT_W / 2; // 610
  const A_FY = SECT_Y + SECT_H / 2; // 214
  const M_FX = MODAL_X + MODAL_W / 2; // 610
  const M_FY = Y_OUT; // 890
  const W_FX = 660;

  const Z_TIGHT = 1.05; // section card 924px wide on screen, 78px margins
  const Z_MODAL = 1.0; // modal 900px wide on screen, 90px margins
  const Z_WIDE = 0.8; // lane cards 400px wide, rails run off into the fade

  const KEY_T = [0, 28, 46, 104, 128, 154, DURATION_IN_FRAMES - 1];
  const KEY_FX = [A_FX, A_FX, M_FX, M_FX, W_FX, W_FX, W_FX + 0.6];
  const KEY_FY = [A_FY - 2, A_FY + 2, M_FY, M_FY, M_FY, M_FY, M_FY];
  const KEY_Z = [
    Z_TIGHT,
    Z_TIGHT - 0.006,
    Z_MODAL,
    Z_MODAL,
    Z_WIDE,
    Z_WIDE,
    Z_WIDE - 0.0015,
  ];

  const fx = interpolate(frame, KEY_T, KEY_FX, opt);
  const fy = interpolate(frame, KEY_T, KEY_FY, opt);
  const z = interpolate(frame, KEY_T, KEY_Z, opt);

  /* ---- rails + packets dissolve before the safe edge, at any zoom --------- */
  const screenX = (worldX: number) => (worldX - fx) * z + width / 2;
  const worldAt = (sx: number) => (sx - width / 2) / z + fx;
  const FADE_A = width - PAD - 120; // 906
  const FADE_B = width - PAD - 18; // 1008
  const edgeFade = (worldX: number) =>
    interpolate(screenX(worldX), [FADE_A, FADE_B], [1, 0], lin);
  const railEnd = Math.min(RAIL_X1, worldAt(FADE_B));
  const railW = Math.max(0, railEnd - RAIL_X0);

  const breath = 0.5 + 0.5 * Math.sin(frame / 16);
  const floatA = 1.6 * Math.sin(frame / 21);

  /* ---- Station A: Cold Emailing switches itself on ----------------------- */
  const mailOn = spr(8, SPRINGS.snappy, 18);
  const mailRing = interpolate(frame, [8, 36], [0, 1], lin);
  const sectionOut = interpolate(frame, [32, 52], [1, 0], opt);

  /* ---- Station B: the real modal assembles itself ------------------------ */
  const modalIn = spr(26, SPRINGS.heavy, 28);
  const titleIn = spr(31, SPRINGS.snappy, 20);
  const subIn = spr(36, SPRINGS.snappy, 20);
  const whoLabelIn = spr(41, SPRINGS.snappy, 18);
  const whoBoxIn = spr(44, SPRINGS.snappy, 22);
  const chipIn = [spr(48, SPRINGS.bouncy, 20), spr(53, SPRINGS.bouncy, 20), spr(58, SPRINGS.bouncy, 20)];
  const whoCopyIn = interpolate(frame, [56, 68], [0, 1], opt);
  const researchIn = interpolate(frame, [64, 76], [0, 1], opt);
  const schedIn = spr(68, SPRINGS.snappy, 22);
  const freqVal = interpolate(frame, [72, 84], [0, 1], opt);
  const timeVal = interpolate(frame, [76, 88], [0, 1], opt);
  const beforeIn = spr(78, SPRINGS.snappy, 20);
  const optionsIn = spr(80, SPRINGS.snappy, 22);
  const tick = interpolate(frame, [84, 94], [0, 1], opt);
  const ctaLive = interpolate(frame, [88, 98], [0, 1], opt);
  const press = frame >= 96 && frame <= 106 ? bell(frame, 96, 106) : 0;
  const ripple = interpolate(frame, [98, 124], [0, 1], opt);
  const running = interpolate(frame, [102, 112], [0, 1], opt);
  const shuttle = 0.5 + 0.5 * Math.sin((frame - 102) * 0.13);

  /* ---- the modal docks into the outreach lane ---------------------------- */
  const dock = interpolate(frame, [106, 126], [0, 1], opt);
  const dockTop = interpolate(dock, [0, 1], [MODAL_Y, LANE_TOP(Y_OUT)], lin);
  const dockW = interpolate(dock, [0, 1], [MODAL_W, LANE_W], lin);
  const dockH = interpolate(dock, [0, 1], [MODAL_H, LANE_H], lin);
  const dockR = interpolate(dock, [0, 1], [28, 22], lin);
  // One handover value drives both halves of the dissolve, so body + lane always
  // sum to 1 — the card is never washed out and never an empty white rectangle.
  const handover = interpolate(frame, [108, 118], [0, 1], opt);
  const bodyOut = 1 - handover;
  const laneIn = handover;

  /* ---- the other two lanes materialise already running ------------------- */
  const contentIn = interpolate(frame, [118, 138], [0, 1], opt);
  const adsIn = interpolate(frame, [122, 142], [0, 1], opt);
  const contentDy = interpolate(frame, [118, 140], [26, 0], opt);
  const adsDy = interpolate(frame, [122, 144], [-26, 0], opt);
  const outRail = interpolate(frame, [124, 142], [0, 1], opt);

  /* ------------------------------------------------------------- atoms --- */

  const Rail: React.FC<{ y: number; opacity: number }> = ({ y, opacity }) => (
    <div
      style={{
        position: "absolute",
        left: RAIL_X0,
        top: y - 1,
        width: railW,
        height: 2,
        opacity,
        background: `linear-gradient(90deg, ${INK(0.13)} 0%, ${INK(0.11)} 52%, ${INK(0)} 100%)`,
      }}
    />
  );

  const StatusDot: React.FC<{ right: number; pop: number }> = ({ right, pop }) => (
    <div
      style={{
        position: "absolute",
        right,
        top: "50%",
        marginTop: -8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: RN.amber,
        opacity: (0.84 + 0.16 * breath) * Math.min(1, pop * 1.4),
        transform: `scale(${0.4 + 0.6 * pop})`,
        boxShadow: `0 0 ${8 + 10 * breath}px ${AMBER(0.42 * pop)}`,
      }}
    />
  );

  // one-shot "it went live" ring, fired by the card itself — nothing clicks it
  const GoLiveRing: React.FC<{ t: number; right: number; h: number }> = ({
    t,
    right,
    h,
  }) => {
    if (t <= 0 || t >= 1) return null;
    const r = 11 + 34 * t;
    return (
      <div
        style={{
          position: "absolute",
          right: right + 8 - r,
          top: h / 2 - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          border: `2px solid ${AMBER(0.5 * (1 - t))}`,
        }}
      />
    );
  };

  const SectionStrip: React.FC<{ top: number; label: string }> = ({
    top,
    label,
  }) => (
    <div
      style={{
        position: "absolute",
        left: SECT_X,
        top,
        width: SECT_W,
        height: NB_H,
        borderRadius: 24,
        backgroundColor: LW.cardSoft,
        border: `1px solid ${LW.hairlineSoft}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SECT_PAD}px`,
        boxSizing: "border-box",
        opacity: 0.62,
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 600, color: LW.muted, letterSpacing: -0.6 }}>
        {label}
      </span>
      <Chevron size={26} color={LW.muted} />
    </div>
  );

  const OutreachTile: React.FC<{
    left: number;
    icon: IconRef;
    label: string;
    on: number;
    dot: number;
    ring: number;
  }> = ({ left, icon, label, on, dot, ring }) => (
    <div
      style={{
        position: "absolute",
        left,
        top: TILE_Y,
        width: TILE_W,
        height: TILE_H,
        boxSizing: "border-box",
        borderRadius: 18,
        backgroundColor: LW.card,
        border: `1px solid ${on > 0.3 ? AMBER(0.16 + 0.3 * on) : RN.border}`,
        boxShadow:
          on > 0.3
            ? `0 ${5 + 9 * on}px ${14 + 20 * on}px ${AMBER(0.1 + 0.1 * on)}, 0 1px 3px rgba(23,20,14,0.05)`
            : "0 1px 3px rgba(23,20,14,0.04)",
        transform: `translateY(${-4 * on}px)`,
      }}
    >
      {on > 0.02 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            backgroundColor: RN.amberSoft,
            opacity: on,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: 26, top: 24 }}>
        <IconShot cx={icon.cx} cy={icon.cy} size={46} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 100,
          fontSize: 36,
          fontWeight: 500,
          color: RN.text,
          letterSpacing: -0.4,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <GoLiveRing t={ring} right={30} h={TILE_H} />
      <StatusDot right={30} pop={dot} />
    </div>
  );

  const Chip: React.FC<{ i: number; label: string }> = ({ i, label }) => {
    const p = chipIn[i];
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 38,
          padding: "0 14px",
          margin: "0 2px",
          borderRadius: 10,
          verticalAlign: "-11px",
          boxSizing: "border-box",
          backgroundColor: LW.card,
          border: `1px solid ${INK(0.09)}`,
          boxShadow: `0 1px 2px rgba(23,20,14,0.05), 0 0 0 ${(3 * Math.max(0, 1 - p)).toFixed(2)}px ${AMBER(0.22 * Math.max(0, 1 - p) * (p > 0.02 ? 1 : 0))}`,
          opacity: Math.min(1, p * 2.2),
          transform: `scale(${0.7 + 0.3 * p})`,
          transformOrigin: "center center",
          whiteSpace: "nowrap",
        }}
      >
        <ChipGlyph kind={i} />
        <span style={{ fontSize: 24, color: RN.text, letterSpacing: -0.2 }}>
          {label}
        </span>
      </span>
    );
  };

  const SelectBox: React.FC<{
    left: number;
    label: string;
    value: string;
    v: number;
  }> = ({ left, label, value, v }) => (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: 522,
          fontSize: 25,
          color: LW.ink,
          letterSpacing: -0.2,
          opacity: schedIn,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left,
          top: 562,
          width: COL_W,
          height: 68,
          boxSizing: "border-box",
          borderRadius: 12,
          backgroundColor: LW.card,
          border: `1px solid ${INK(0.09)}`,
          boxShadow: `0 0 0 ${(3 * Math.sin(Math.min(1, v) * Math.PI)).toFixed(2)}px ${AMBER(0.2)}`,
          overflow: "hidden",
          opacity: Math.min(1, schedIn * 2),
          transform: `translateY(${(1 - schedIn) * 12}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 18,
            fontSize: 30,
            color: RN.text,
            letterSpacing: -0.3,
            opacity: v,
            transform: `translateY(${(1 - v) * 22}px)`,
          }}
        >
          {value}
        </div>
        <div style={{ position: "absolute", right: 18, top: 24 }}>
          <Chevron size={22} color={LW.muted} />
        </div>
      </div>
    </>
  );

  const OptionBox: React.FC<{
    left: number;
    label: string;
    checked: number;
  }> = ({ left, label, checked }) => (
    <div
      style={{
        position: "absolute",
        left,
        top: 698,
        width: COL_W,
        height: 68,
        boxSizing: "border-box",
        borderRadius: 12,
        backgroundColor: checked > 0.5 ? "#F6F2ED" : LW.card,
        border: `1px solid ${checked > 0.5 ? AMBER(0.28) : INK(0.08)}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingLeft: 20,
        opacity: Math.min(1, optionsIn * 2),
        transform: `translateY(${(1 - optionsIn) * 12}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 30,
          height: 30,
          flex: "0 0 auto",
          borderRadius: 7,
          boxSizing: "border-box",
          border: `2px solid ${checked > 0.05 ? "rgba(0,0,0,0)" : INK(0.22)}`,
          backgroundColor: `rgba(17,17,17,${checked})`,
        }}
      >
        <svg
          width={30}
          height={30}
          viewBox="0 0 24 24"
          style={{
            display: "block",
            opacity: checked,
            transform: `scale(${0.5 + 0.5 * checked})`,
            transformOrigin: "center center",
          }}
        >
          <path
            d="M6.5 12.4 L10.2 16 L17.5 8.6"
            stroke="#FFFFFF"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <span style={{ fontSize: 27, color: RN.text, letterSpacing: -0.2, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );

  // Un-filled rows of the modal read as skeleton, never as dead white paper.
  // Each block dissolves exactly as its real row lands.
  const Skel: React.FC<{
    left: number;
    top: number;
    w: number;
    h: number;
    r: number;
    o: number;
  }> = ({ left, top, w, h, r, o }) =>
    o <= 0.01 ? null : (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: INK(0.05),
          opacity: o,
        }}
      />
    );

  const LaneCard: React.FC<{
    cy: number;
    dy: number;
    opacity: number;
    children: React.ReactNode;
  }> = ({ cy, dy, opacity, children }) => (
    <div
      style={{
        position: "absolute",
        left: LANE_X,
        top: LANE_TOP(cy),
        width: LANE_W,
        height: LANE_H,
        boxSizing: "border-box",
        borderRadius: 22,
        backgroundColor: LW.card,
        border: `1px solid ${LW.hairline}`,
        boxShadow: `${LW.shadow}, 0 0 0 1.8px ${AMBER(0.17)}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 28,
        opacity,
        transform: `translateY(${dy}px)`,
      }}
    >
      {children}
      <StatusDot right={30} pop={1} />
    </div>
  );

  /* ----------------------------------------------------------- packets --- */

  const chipBase: React.CSSProperties = {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: LW.card,
    border: `1px solid ${INK(0.09)}`,
    boxShadow: "0 6px 14px rgba(23,20,14,0.09)",
  };

  // abstract subject-line bars — never a readable sentence, never a recipient
  const MailPacket: React.FC<{ y: number; d: Live }> = ({ y, d }) => {
    const x = RAIL_X0 + d.p * RAIL_LEN;
    const op = spawnIn(d.p) * edgeFade(x);
    if (op <= 0.004) return null;
    const s = spawnScale(d.p);
    const sent = interpolate(d.p, [0.58, 0.7], [0, 1], lin);
    return (
      <div
        style={{
          ...chipBase,
          left: x - 27,
          top: y - 19,
          width: 54,
          height: 38,
          borderRadius: 10,
          opacity: op,
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 6,
            height: "100%",
            backgroundColor: RN.amber,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 6,
            height: "100%",
            backgroundColor: RN.green,
            opacity: sent,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 13,
            width: 27,
            height: 4,
            borderRadius: 2,
            backgroundColor: INK(0.2),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 22,
            width: 16,
            height: 4,
            borderRadius: 2,
            backgroundColor: INK(0.13),
          }}
        />
      </div>
    );
  };

  const PostPacket: React.FC<{ y: number; d: Live }> = ({ y, d }) => {
    const x = RAIL_X0 + d.p * RAIL_LEN;
    const op = spawnIn(d.p) * edgeFade(x);
    if (op <= 0.004) return null;
    const s = spawnScale(d.p);
    return (
      <div
        style={{
          ...chipBase,
          left: x - 23,
          top: y - 29,
          width: 46,
          height: 58,
          borderRadius: 10,
          opacity: op,
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            width: 30,
            height: 24,
            borderRadius: 5,
            backgroundColor: INK(0.09),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 38,
            width: 30,
            height: 4,
            borderRadius: 2,
            backgroundColor: INK(0.18),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 47,
            width: 18,
            height: 4,
            borderRadius: 2,
            backgroundColor: INK(0.12),
          }}
        />
      </div>
    );
  };

  const AdPacket: React.FC<{ y: number; d: Live }> = ({ y, d }) => {
    const x = RAIL_X0 + d.p * RAIL_LEN;
    const op = spawnIn(d.p) * edgeFade(x);
    if (op <= 0.004) return null;
    const s = spawnScale(d.p);
    return (
      <div
        style={{
          ...chipBase,
          left: x - 32,
          top: y - 20,
          width: 64,
          height: 40,
          borderRadius: 10,
          opacity: op,
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 11,
            width: 30,
            height: 4,
            borderRadius: 2,
            backgroundColor: INK(0.18),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 25,
            width: 42,
            height: 5,
            borderRadius: 3,
            backgroundColor: AMBER(0.95),
          }}
        />
      </div>
    );
  };

  const adPulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(frame * 0.16));

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* Opaque warm-white world, frame 0 -> last frame. Backgrounds bleed. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(126% 98% at 50% 2%, ${LW.paper} 0%, ${LW.paper} 44%, ${LW.paperDeep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(64% 44% at 50% 52%, rgba(222,155,74,0.075) 0%, rgba(222,155,74,0) 74%)",
          opacity: interpolate(frame, [86, 126], [0, 1], opt),
        }}
      />

      {/* ------------------------------- camera ------------------------------ */}
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---- Station A: the real Cold Outreach section ------------------- */}
        {sectionOut > 0.004 ? (
          <div style={{ opacity: sectionOut }}>
            <SectionStrip top={NB_TOP_Y} label={GROW.sections.social} />
            <SectionStrip top={NB_BOT_Y} label={GROW.sections.listening} />

            <div
              style={{
                position: "absolute",
                left: SECT_X,
                top: SECT_Y,
                width: SECT_W,
                height: SECT_H,
                boxSizing: "border-box",
                borderRadius: 26,
                backgroundColor: LW.cardSoft,
                border: `1px solid ${LW.hairline}`,
                boxShadow: LW.shadow,
                transform: `translateY(${floatA}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: SECT_PAD,
                  top: 28,
                  fontSize: 42,
                  fontWeight: 600,
                  color: LW.ink,
                  letterSpacing: -0.7,
                }}
              >
                {GROW.sections.outreach}
              </div>
              <div style={{ position: "absolute", right: SECT_PAD, top: 40 }}>
                <Chevron size={26} color={LW.muted} />
              </div>

              {/* Cold Calling was switched on before this beat — it sits at a
                  calm steady state so the ignition reads as Cold Emailing's. */}
              <OutreachTile
                left={SECT_PAD}
                icon={ICON.call}
                label={GROW.outreach[0]}
                on={0.42}
                dot={1}
                ring={1}
              />
              <OutreachTile
                left={SECT_PAD + TILE_W + 24}
                icon={ICON.mail}
                label={GROW.outreach[1]}
                on={mailOn}
                dot={mailOn}
                ring={mailRing}
              />
            </div>
          </div>
        ) : null}

        {/* ---- Station C rails + packets ----------------------------------- */}
        <div style={{ opacity: contentIn }}>
          <div style={{ transform: `translateY(${contentDy}px)` }}>
            <Rail y={Y_CONTENT} opacity={1} />
            {alive(frame, POSTS).map((d) => (
              <PostPacket key={`p${d.k}`} y={Y_CONTENT} d={d} />
            ))}
          </div>
        </div>

        <div style={{ opacity: outRail }}>
          <Rail y={Y_OUT} opacity={1} />
          {alive(frame, EMAILS).map((d) => (
            <MailPacket key={`m${d.k}`} y={Y_OUT} d={d} />
          ))}
        </div>

        <div style={{ opacity: adsIn }}>
          <div style={{ transform: `translateY(${adsDy}px)` }}>
            <Rail y={Y_ADS} opacity={1} />
            {alive(frame, ADSTREAM).map((d) => (
              <AdPacket key={`a${d.k}`} y={Y_ADS} d={d} />
            ))}
          </div>
        </div>

        {/* ---- Station C: content lane ------------------------------------- */}
        <div style={{ opacity: contentIn }}>
          <LaneCard cy={Y_CONTENT} dy={contentDy} opacity={1}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[ICON.instagram, ICON.linkedin, ICON.x, ICON.tiktok].map((ic) => (
                <IconShot key={`${ic.cx}`} cx={ic.cx} cy={ic.cy} size={46} />
              ))}
            </div>
          </LaneCard>
        </div>

        {/* ---- Station C: ads lane ----------------------------------------- */}
        <div style={{ opacity: adsIn }}>
          <LaneCard cy={Y_ADS} dy={adsDy} opacity={1}>
            <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
              <div
                style={{
                  opacity: 0.55 + 0.45 * adPulse,
                  filter: `drop-shadow(0 0 ${10 * adPulse}px ${AMBER(0.24)})`,
                }}
              >
                <Img
                  src={staticFile("logos/meta.svg")}
                  style={{ width: 66, height: 44, display: "block" }}
                />
              </div>
              <div
                style={{
                  opacity: 0.55 + 0.45 * (1 - adPulse),
                  filter: `drop-shadow(0 0 ${10 * (1 - adPulse)}px ${AMBER(0.24)})`,
                }}
              >
                <Img
                  src={staticFile("logos/google.svg")}
                  style={{ width: 46, height: 47, display: "block" }}
                />
              </div>
            </div>
          </LaneCard>
        </div>

        {/* ---- Station B: the REAL Cold Emailing modal --------------------- */}
        {modalIn > 0.002 ? (
          <div
            style={{
              position: "absolute",
              left: MODAL_X,
              top: dockTop,
              width: dockW,
              height: dockH,
              boxSizing: "border-box",
              borderRadius: dockR,
              backgroundColor: LW.card,
              border: `1px solid ${dock > 0.6 ? LW.hairline : LW.hairlineSoft}`,
              boxShadow:
                dock > 0.6
                  ? `${LW.shadow}, 0 0 0 1.8px ${AMBER(0.17 * dock)}`
                  : LW.shadowLift,
              overflow: "hidden",
              opacity: Math.min(1, modalIn * 2.4),
              transform: `translateY(${(1 - modalIn) * 30}px) scale(${0.955 + 0.045 * modalIn})`,
              transformOrigin: "center top",
            }}
          >
            {/* ---------------- the assembled modal body -------------------- */}
            <div style={{ opacity: bodyOut }}>
              {/* skeleton: the rows Runable has not written yet */}
              <div style={{ opacity: modalIn }}>
                <Skel left={MP} top={244} w={200} h={18} r={9} o={skel(frame, 41)} />
                <Skel left={MP} top={276} w={MI} h={176} r={16} o={skel(frame, 44)} />
                <Skel left={MP} top={472} w={640} h={18} r={9} o={skel(frame, 64)} />
                <Skel left={MP} top={530} w={170} h={18} r={9} o={skel(frame, 68)} />
                <Skel left={COL_X2} top={530} w={210} h={18} r={9} o={skel(frame, 68)} />
                <Skel left={MP} top={562} w={COL_W} h={68} r={12} o={skel(frame, 68)} />
                <Skel left={COL_X2} top={562} w={COL_W} h={68} r={12} o={skel(frame, 68)} />
                <Skel left={MP} top={666} w={220} h={18} r={9} o={skel(frame, 78)} />
                <Skel left={MP} top={698} w={COL_W} h={68} r={12} o={skel(frame, 80)} />
                <Skel left={COL_X2} top={698} w={COL_W} h={68} r={12} o={skel(frame, 80)} />
                <Skel left={MP} top={780} w={292} h={74} r={14} o={skel(frame, 80)} />
                <Skel
                  left={MP + 292 + 24}
                  top={780}
                  w={MI - 292 - 24}
                  h={74}
                  r={14}
                  o={skel(frame, 80)}
                />
              </div>

              <div style={{ position: "absolute", left: MP, top: 30 }}>
                <IconShot cx={ICON.mail.cx} cy={ICON.mail.cy} size={58} />
              </div>
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                style={{ position: "absolute", right: MP, top: 44 }}
              >
                <path
                  d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5"
                  stroke={LW.muted}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 104,
                  fontSize: 50,
                  fontWeight: 600,
                  color: RN.text,
                  letterSpacing: -0.9,
                  opacity: Math.min(1, titleIn * 2),
                  transform: `translateY(${(1 - titleIn) * 14}px)`,
                }}
              >
                {COLDMAIL.title}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 172,
                  width: MI,
                  fontSize: 27,
                  color: LW.body,
                  letterSpacing: -0.2,
                  opacity: Math.min(1, subIn * 2),
                  transform: `translateY(${(1 - subIn) * 12}px)`,
                }}
              >
                {COLDMAIL.sub}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 236,
                  fontSize: 26,
                  color: LW.ink,
                  letterSpacing: -0.2,
                  opacity: whoLabelIn,
                }}
              >
                {COLDMAIL.who}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 276,
                  width: MI,
                  height: 176,
                  boxSizing: "border-box",
                  borderRadius: 16,
                  backgroundColor: "#FAF8F6",
                  border: `1px solid ${INK(0.06)}`,
                  padding: 24,
                  opacity: Math.min(1, whoBoxIn * 2),
                  transform: `translateY(${(1 - whoBoxIn) * 14}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    lineHeight: 1.75,
                    color: RN.text,
                    letterSpacing: -0.2,
                  }}
                >
                  <span style={{ opacity: whoBoxIn }}>Use </span>
                  <Chip i={0} label={COLDMAIL.chips[0]} />
                  <span style={{ opacity: chipIn[0] }}>,</span>{" "}
                  <Chip i={1} label={COLDMAIL.chips[1]} />
                  <span style={{ opacity: chipIn[1] }}>,</span>{" "}
                  <Chip i={2} label={COLDMAIL.chips[2]} />{" "}
                  <span style={{ opacity: whoCopyIn }}>{COLDMAIL.whoCopy}</span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 466,
                  width: MI,
                  fontSize: 24,
                  color: LW.muted,
                  letterSpacing: -0.1,
                  opacity: researchIn,
                }}
              >
                {COLDMAIL.research}
              </div>

              <SelectBox
                left={MP}
                label={COLDMAIL.freqLabel}
                value={COLDMAIL.freq}
                v={freqVal}
              />
              <SelectBox
                left={COL_X2}
                label={COLDMAIL.timeLabel}
                value={COLDMAIL.time}
                v={timeVal}
              />

              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 658,
                  fontSize: 26,
                  color: LW.ink,
                  letterSpacing: -0.2,
                  opacity: beforeIn,
                }}
              >
                {COLDMAIL.beforeLabel}
              </div>
              <OptionBox left={MP} label={COLDMAIL.optDirect} checked={0} />
              <OptionBox left={COL_X2} label={COLDMAIL.optDraft} checked={tick} />

              {/* Cancel / Start emailing — grey and dead, then live, then it
                  presses itself. No cursor, no hand, nothing touches it. */}
              <div
                style={{
                  position: "absolute",
                  left: MP,
                  top: 780,
                  width: 292,
                  height: 74,
                  boxSizing: "border-box",
                  borderRadius: 14,
                  border: `1px solid ${INK(0.09)}`,
                  backgroundColor: LW.card,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 29,
                  color: RN.text,
                  opacity: Math.min(1, optionsIn * 2),
                }}
              >
                {COLDMAIL.cancel}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: MP + 292 + 24,
                  top: 780,
                  width: MI - 292 - 24,
                  height: 74,
                  boxSizing: "border-box",
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: `rgb(${Math.round(184 - 167 * ctaLive)}, ${Math.round(177 - 160 * ctaLive)}, ${Math.round(168 - 151 * ctaLive)})`,
                  boxShadow:
                    ctaLive > 0.1
                      ? `0 ${8 * ctaLive}px ${20 * ctaLive}px rgba(23,20,14,${0.16 * ctaLive})`
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 - 0.035 * press})`,
                  transformOrigin: "center center",
                  opacity: Math.min(1, optionsIn * 2),
                }}
              >
                {running > 0.01 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: (MI - 292 - 24) * shuttle - 90,
                      top: 0,
                      width: 180,
                      height: 74,
                      background: `linear-gradient(90deg, ${AMBER(0)} 0%, ${AMBER(0.5 * running)} 50%, ${AMBER(0)} 100%)`,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    position: "relative",
                    fontSize: 30,
                    fontWeight: 500,
                    color: `rgba(255,255,255,${0.72 + 0.28 * ctaLive})`,
                    letterSpacing: -0.2,
                  }}
                >
                  {COLDMAIL.start}
                </span>
              </div>

              {ripple > 0.001 && ripple < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: MP + 292 + 24 - 40 * ripple,
                    top: 780 - 40 * ripple,
                    width: MI - 292 - 24 + 80 * ripple,
                    height: 74 + 80 * ripple,
                    borderRadius: 14 + 30 * ripple,
                    border: `2px solid ${AMBER(0.45 * (1 - ripple))}`,
                  }}
                />
              ) : null}
            </div>

            {/* ------------- the same card, docked as one lane -------------- */}
            {laneIn > 0.004 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 28,
                  gap: 18,
                  opacity: laneIn,
                }}
              >
                <IconShot cx={ICON.mail.cx} cy={ICON.mail.cy} size={46} />
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 500,
                    color: RN.text,
                    letterSpacing: -0.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {COLDMAIL.title}
                </span>
                <StatusDot right={30} pop={1} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* whisper vignette so the white world has a floor, never a hard edge */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(78% 66% at 50% 46%, rgba(0,0,0,0) 62%, rgba(23,20,14,0.05) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
