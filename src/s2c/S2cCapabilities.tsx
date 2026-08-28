/**
 * S2cCapabilities — beat 5 of the screenshot-to-code series (PAPER).
 *
 * Two movements in one continuous world, one camera:
 *   1. Three inputs (screenshot / Figma / recording) feed the `//` mark,
 *      which hands off into a dark editor panel typing real Tailwind/JSX.
 *   2. Gemini-powered asset extraction — image tiles lift OUT of the real
 *      NYT demo screenshot and fly into their slots on the rebuilt page.
 *
 * No words on screen beyond genuine UI text (filename, code). Victor burns
 * "Screenshot / Figma / screen recording" on top — top ~10% / bottom ~12%
 * stay clear of critical content.
 */
import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  EASE,
  LogoImg,
  MONO,
  PaperWorld,
  S2C,
  S2cMark,
  SPRINGS,
  useCam,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 350;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Local spring-entrance helper (kit's useEnter is typed to SPRINGS.pop only). */
const useSpringAt = (
  at: number,
  config: { damping: number; stiffness: number; mass?: number },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

// ---------------------------------------------------------------------------
// World geometry
// ---------------------------------------------------------------------------

// Movement 1 — input cluster
const SHOT_CARD = { x: 165, y: 120, w: 750, h: 310 };
const FIGMA_CARD = { x: 150, y: 500, w: 360, h: 290 };
const REC_CARD = { x: 570, y: 500, w: 360, h: 290 };
const MARK = { size: 180, x: 450, y: 985 }; // center (540, 1075)

// Code panel
const PANEL = { x: 100, y: 1660, w: 880, h: 720 };
const PANEL_HEADER = 62;

// Movement 2 — before / rebuilt pair (real NYT demo shots)
const B_SRC = { w: 1400, h: 790 }; // nyt-lifestyle-before.webp
const A_SRC = { w: 1400, h: 719 }; // nyt-lifestyle-after.webp
const BCARD = { x: 60, y: 2900, w: 960, h: 542 };
const ACARD = { x: 60, y: 3542, w: 960, h: 493 };
const S1 = BCARD.w / B_SRC.w; // 0.6857
const S2 = ACARD.w / A_SRC.w; // 0.6857

// Crop rects in SOURCE pixels (verified against the actual stills)
type Rect = { x: number; y: number; w: number; h: number };
const CROPS: { before: Rect; after: Rect }[] = [
  // wine glasses photo
  { before: { x: 37, y: 209, w: 672, h: 445 }, after: { x: 88, y: 198, w: 586, h: 388 } },
  // travel illustration
  { before: { x: 744, y: 209, w: 340, h: 445 }, after: { x: 710, y: 197, w: 279, h: 360 } },
  // NYT wordmark (the "real logo")
  { before: { x: 590, y: 2, w: 230, h: 40 }, after: { x: 540, y: 4, w: 310, h: 48 } },
];

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const T = {
  // movement 1
  card1: 2,
  card2: 26,
  card3: 32,
  mark: 44,
  lines: [46, 52, 58], // each draws 12f
  track: 62,
  pulse: [74, 92] as const,
  panel: 90,
  type: 98,
  chips: [102, 107, 112, 117],
  // movement 2
  bCard: 176,
  badge: 192,
  detect: [194, 208, 222],
  lift: [202, 216, 230],
  aCard: 240,
  fly: [260, 280, 300], // each flight = 20f
};

const CAM = {
  keys: [0, 22, 40, 72, 94, 165, 189, 236, 256, 318, 336, 350],
  fx: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540],
  fy: [420, 430, 700, 700, 2085, 2085, 3080, 3080, 3467, 3467, 3467, 3467],
  z: [1.11, 1.1, 1.0, 1.0, 1.06, 1.06, 1.0, 1.0, 0.9, 0.9, 0.91, 0.91],
};

// ---------------------------------------------------------------------------
// Movement 1 — the three input cards
// ---------------------------------------------------------------------------

/** Screenshot card — thumb of the real pricing screenshot + capture corners. */
const ScreenshotCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.card1, { damping: 16, stiffness: 150 });
  const pad = 22;
  const tw = SHOT_CARD.w - pad * 2; // 706
  const scale = tw / 1100;
  const th = SHOT_CARD.h - pad * 2; // 266
  const br = interpolate(frame, [12, 26], [0, 1], { easing: EASE, ...clamp });
  const L = 30; // bracket arm
  const inset = 10;
  const corners = [
    { cx: inset, cy: inset, sx: 1, sy: 1 },
    { cx: tw - inset, cy: inset, sx: -1, sy: 1 },
    { cx: inset, cy: th - inset, sx: 1, sy: -1 },
    { cx: tw - inset, cy: th - inset, sx: -1, sy: -1 },
  ];
  return (
    <Card x={SHOT_CARD.x} y={SHOT_CARD.y} w={SHOT_CARD.w} h={SHOT_CARD.h} enter={enter}>
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          width: tw,
          height: th,
          borderRadius: 14,
          border: `1.5px solid ${C.line}`,
          overflow: "hidden",
          background: "#FAFAF8",
        }}
      >
        <Img
          src={staticFile(S2C.shots.pricingBefore)}
          style={{
            position: "absolute",
            left: 0,
            top: -20,
            width: 1100 * scale,
            height: 938 * scale,
          }}
        />
        <svg width={tw} height={th} style={{ position: "absolute", left: 0, top: 0 }}>
          {corners.map((c, i) => (
            <path
              key={i}
              d={`M ${c.cx + c.sx * L * br} ${c.cy} L ${c.cx} ${c.cy} L ${c.cx} ${c.cy + c.sy * L * br}`}
              fill="none"
              stroke={C.orange}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={br}
            />
          ))}
        </svg>
      </div>
    </Card>
  );
};

/** Figma card — the real multicolour mark, nothing else. */
const FigmaCard: React.FC = () => {
  const enter = useSpringAt(T.card2, { damping: 16, stiffness: 150 });
  return (
    <Card
      x={FIGMA_CARD.x}
      y={FIGMA_CARD.y}
      w={FIGMA_CARD.w}
      h={FIGMA_CARD.h}
      enter={enter}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <LogoImg src={S2C.logos.figma} size={132} />
    </Card>
  );
};

/** Screen-recording card — dark mini frame, filmstrip edges, play glyph,
 *  live progress bar (micro-motion during the hold). Glyphs only. */
const RecordingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.card3, { damping: 16, stiffness: 150 });
  const fw = REC_CARD.w - 40; // 320
  const fh = REC_CARD.h - 40; // 250
  const prog = interpolate(frame, [T.card3 + 8, 160], [0.12, 0.86], clamp);
  const holes = [0, 1, 2, 3, 4, 5, 6, 7];
  const trackW = fw - 60;
  return (
    <Card x={REC_CARD.x} y={REC_CARD.y} w={REC_CARD.w} h={REC_CARD.h} enter={enter}>
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          width: fw,
          height: fh,
          borderRadius: 14,
          background: C.term,
          overflow: "hidden",
        }}
      >
        {/* filmstrip sprockets */}
        {[10, fh - 20].map((y) => (
          <div key={y} style={{ position: "absolute", left: 0, top: y, width: fw }}>
            {holes.map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 14 + i * ((fw - 28 - 16) / 7),
                  width: 16,
                  height: 10,
                  borderRadius: 3,
                  background: "#3A3733",
                }}
              />
            ))}
          </div>
        ))}
        {/* play glyph */}
        <svg
          width={92}
          height={92}
          style={{ position: "absolute", left: fw / 2 - 46, top: fh / 2 - 52 }}
        >
          <circle cx={46} cy={46} r={40} fill="none" stroke="rgba(232,228,222,0.35)" strokeWidth={3} />
          <path d="M 38 30 L 62 46 L 38 62 Z" fill={C.termText} />
        </svg>
        {/* progress */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: fh - 42,
            width: trackW,
            height: 6,
            borderRadius: 3,
            background: "#3A3733",
          }}
        >
          <div
            style={{
              width: prog * trackW,
              height: 6,
              borderRadius: 3,
              background: C.orange,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: prog * trackW - 5,
              top: -3,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: C.termText,
            }}
          />
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Connectors — three curves into the mark, then a track down to the panel
// ---------------------------------------------------------------------------

const LINE_D = [
  "M 540 434 L 540 981",
  "M 330 794 C 330 890, 400 947, 492 990",
  "M 750 794 C 750 890, 680 947, 588 990",
];

const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], clamp);

const Connectors: React.FC = () => {
  const frame = useCurrentFrame();
  const track = interpolate(frame, [T.track, T.track + 10], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const pulseY = interpolate(frame, [T.pulse[0], T.pulse[1]], [1169, 1652], {
    easing: EASE,
    ...clamp,
  });
  const pulseOn = frame >= T.pulse[0] && frame <= T.pulse[1] + 1;
  const energised = interpolate(frame, [T.pulse[0], T.pulse[1]], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  return (
    <svg
      width={1080}
      height={1720}
      viewBox="0 0 1080 1720"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {LINE_D.map((d, i) => {
        const draw = interpolate(frame, [T.lines[i], T.lines[i] + 12], [0, 1], {
          easing: EASE,
          ...clamp,
        });
        return draw > 0 ? (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={C.orange}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        ) : null;
      })}
      {track > 0 ? (
        <>
          <line
            x1={540}
            y1={1169}
            x2={540}
            y2={1169 + track * (1656 - 1169)}
            stroke="#D9D3CA"
            strokeWidth={5}
          />
          {energised > 0 ? (
            <line
              x1={540}
              y1={1169}
              x2={540}
              y2={1169 + energised * (1656 - 1169)}
              stroke="rgba(37,99,235,0.8)"
              strokeWidth={5}
            />
          ) : null}
        </>
      ) : null}
      {pulseOn ? (
        <>
          <circle cx={540} cy={pulseY} r={24} fill="rgba(37,99,235,0.16)" />
          <circle cx={540} cy={pulseY} r={10} fill={C.orange} />
        </>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Code panel — dark editor typing real Tailwind/JSX
// ---------------------------------------------------------------------------

type Seg = { t: string; c: "kw" | "txt" | "str" | "mut" };
const CODE: Seg[][] = [
  [
    { t: "export function ", c: "kw" },
    { t: "Pricing", c: "txt" },
    { t: "() {", c: "mut" },
  ],
  [
    { t: "  ", c: "mut" },
    { t: "return", c: "kw" },
    { t: " (", c: "mut" },
  ],
  [
    { t: "    <", c: "mut" },
    { t: "section", c: "kw" },
    { t: " ", c: "mut" },
    { t: "className", c: "txt" },
    { t: "=", c: "mut" },
    { t: '"grid grid-cols-3"', c: "str" },
    { t: ">", c: "mut" },
  ],
  [
    { t: "      {", c: "mut" },
    { t: "plans", c: "txt" },
    { t: ".", c: "mut" },
    { t: "map", c: "txt" },
    { t: "((", c: "mut" },
    { t: "plan", c: "txt" },
    { t: ") => (", c: "mut" },
  ],
  [
    { t: "        <", c: "mut" },
    { t: "PlanCard", c: "kw" },
  ],
  [
    { t: "          ", c: "mut" },
    { t: "key", c: "txt" },
    { t: "={", c: "mut" },
    { t: "plan.id", c: "txt" },
    { t: "}", c: "mut" },
  ],
  [
    { t: "          ", c: "mut" },
    { t: "name", c: "txt" },
    { t: "={", c: "mut" },
    { t: "plan.name", c: "txt" },
    { t: "}", c: "mut" },
  ],
  [
    { t: "          ", c: "mut" },
    { t: "price", c: "txt" },
    { t: "={", c: "mut" },
    { t: "plan.price", c: "txt" },
    { t: "}", c: "mut" },
  ],
  [
    { t: "          ", c: "mut" },
    { t: "cta", c: "txt" },
    { t: "=", c: "mut" },
    { t: '"Start free trial"', c: "str" },
  ],
  [{ t: "        />", c: "mut" }],
  [{ t: "      ))}", c: "mut" }],
  [
    { t: "    </", c: "mut" },
    { t: "section", c: "kw" },
    { t: ">", c: "mut" },
  ],
  [{ t: "  );", c: "mut" }],
  [{ t: "}", c: "mut" }],
];
const CODE_COLORS = {
  kw: "#8FB4F2",
  txt: "#E8E4DE",
  str: "#CBAA6E",
  mut: "#8C877E",
};
const LINE_LEN = CODE.map((l) => l.reduce((a, s) => a + s.t.length, 0));
const TOTAL_CHARS = LINE_LEN.reduce((a, b) => a + b + 1, 0);
const CPS = 6.0;

const STACK_CHIPS = [
  S2C.logos.react,
  S2C.logos.vue,
  S2C.logos.tailwind,
  S2C.logos.html5,
];

const CodePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.panel,
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const typed = Math.max(0, Math.floor((frame - T.type) * CPS));
  const done = typed >= TOTAL_CHARS;
  const blink = !done || Math.floor(frame / 16) % 2 === 0;

  // per-line visible chars
  let budget = typed;
  const visible: number[] = [];
  let active = 0;
  for (let i = 0; i < CODE.length; i++) {
    const take = Math.min(Math.max(budget, 0), LINE_LEN[i]);
    visible.push(take);
    if (take > 0) active = i;
    budget -= LINE_LEN[i] + 1; // newline
  }

  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        borderRadius: 22,
        background: C.term,
        boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
        overflow: "hidden",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26}px)`,
      }}
    >
      {/* header rail */}
      <div
        style={{
          height: PANEL_HEADER,
          background: C.termBar,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 24px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ width: 13, height: 13, borderRadius: 999, background: "#4A4741" }}
          />
        ))}
        <div
          style={{
            marginLeft: 14,
            fontFamily: MONO,
            fontSize: 24,
            color: C.termMuted,
            letterSpacing: 0.2,
          }}
        >
          pricing.tsx
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {STACK_CHIPS.map((src, i) => {
            const pop = spring({
              frame: frame - T.chips[i],
              fps,
              config: SPRINGS.pop,
            });
            return (
              <div
                key={src}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "#2E2B27",
                  display: "grid",
                  placeItems: "center",
                  opacity: pop,
                  transform: `scale(${0.7 + 0.3 * pop})`,
                }}
              >
                <LogoImg src={src} size={27} />
              </div>
            );
          })}
        </div>
      </div>
      {/* code body */}
      <div style={{ padding: "26px 34px 0", fontFamily: MONO, fontSize: 30 }}>
        {CODE.map((line, i) => {
          let left = visible[i];
          return (
            <div key={i} style={{ height: 44, whiteSpace: "pre", lineHeight: "44px" }}>
              {line.map((seg, j) => {
                if (left <= 0) return null;
                const t = seg.t.slice(0, left);
                left -= t.length;
                return (
                  <span key={j} style={{ color: CODE_COLORS[seg.c] }}>
                    {t}
                  </span>
                );
              })}
              {i === active && frame >= T.type && blink ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 15,
                    height: 32,
                    marginBottom: -5,
                    background: C.orange,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Movement 2 — asset extraction
// ---------------------------------------------------------------------------

/** A crop of the BEFORE screenshot, positioned in world coords, that lifts,
 *  hovers, then flies along an arc into its slot on the AFTER card. */
const Tile: React.FC<{ index: number; bow: number; hoverScale: number }> = ({
  index,
  bow,
  hoverScale,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const crop = CROPS[index].before;
  const slot = CROPS[index].after;

  const tw = crop.w * S1;
  const th = crop.h * S1;
  const restX = BCARD.x + crop.x * S1;
  const restY = BCARD.y + crop.y * S1;
  const cx0 = restX + tw / 2;
  const cy0 = restY + th / 2;
  const slotCx = ACARD.x + (slot.x + slot.w / 2) * S2;
  const slotCy = ACARD.y + (slot.y + slot.h / 2) * S2;
  const targetScale = (slot.w * S2) / tw;

  const lift = spring({
    frame: frame - T.lift[index],
    fps,
    config: { damping: 15, stiffness: 130 },
  });
  const fp = interpolate(frame, [T.fly[index], T.fly[index] + 20], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const fade = interpolate(frame, [T.fly[index] + 24, T.fly[index] + 34], [1, 0], clamp);
  if (frame < T.lift[index] || fade <= 0) return null;

  const bob = Math.sin((frame - T.lift[index]) / 9) * 3 * lift * (1 - fp);
  const hoverY = (-34 * lift - bob) * (1 - fp);
  const cx = cx0 + (slotCx - cx0) * fp + bow * Math.sin(Math.PI * fp);
  const cy = cy0 + (slotCy - cy0) * fp + hoverY;
  const s = (1 + (hoverScale - 1) * lift) * (1 - fp) + targetScale * fp;
  const shadowA = 0.24 * lift * (1 - fp * 0.8) * fade;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - tw / 2,
        top: cy - th / 2,
        width: tw,
        height: th,
        transform: `scale(${s})`,
        borderRadius: 8,
        overflow: "hidden",
        outline: "1px solid rgba(25,23,20,0.10)",
        boxShadow: `0 ${18 * lift}px ${44 * lift}px rgba(25,23,20,${shadowA})`,
        opacity: fade,
        background: "#fff",
      }}
    >
      <Img
        src={staticFile(S2C.shots.nytBefore)}
        style={{
          position: "absolute",
          left: -crop.x * S1,
          top: -crop.y * S1,
          width: B_SRC.w * S1,
          height: B_SRC.h * S1,
        }}
      />
    </div>
  );
};

/** Dashed detection box over a source region on the before card. */
const DetectBox: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const crop = CROPS[index].before;
  const on = interpolate(frame, [T.detect[index], T.detect[index] + 8], [0, 1], {
    easing: EASE,
    ...clamp,
  });
  const fp = interpolate(frame, [T.fly[index], T.fly[index] + 10], [0, 1], clamp);
  const o = on * (1 - fp);
  if (o <= 0) return null;
  const pad = 7;
  const x = BCARD.x + crop.x * S1 - pad;
  const y = BCARD.y + crop.y * S1 - pad;
  const w = crop.w * S1 + pad * 2;
  const h = crop.h * S1 + pad * 2;
  return (
    <svg
      width={w + 8}
      height={h + 8}
      style={{ position: "absolute", left: x - 4, top: y - 4, opacity: o }}
    >
      <rect
        x={4}
        y={4}
        width={w}
        height={h}
        rx={10}
        fill="none"
        stroke={C.orange}
        strokeWidth={4}
        strokeDasharray="14 10"
        strokeDashoffset={-frame * 0.8}
      />
    </svg>
  );
};

/** Placeholder cover over an empty slot on the rebuilt page. */
const SlotCover: React.FC<{ index: number; cardEnter: number }> = ({
  index,
  cardEnter,
}) => {
  const frame = useCurrentFrame();
  const slot = CROPS[index].after;
  const gone = interpolate(frame, [T.fly[index] + 12, T.fly[index] + 19], [1, 0], clamp);
  const o = cardEnter * gone;
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: slot.x * S2,
        top: slot.y * S2,
        width: slot.w * S2,
        height: slot.h * S2,
        borderRadius: 8,
        background: "#F1EDE5",
        border: `1.5px dashed ${"#D3CCC0"}`,
        opacity: o,
      }}
    />
  );
};

const BeforeCard: React.FC = () => {
  const enter = useSpringAt(T.bCard, { damping: 16, stiffness: 140 });
  return (
    <Card
      x={BCARD.x}
      y={BCARD.y}
      w={BCARD.w}
      h={BCARD.h}
      r={24}
      enter={enter}
      style={{ overflow: "hidden" }}
    >
      <Img
        src={staticFile(S2C.shots.nytBefore)}
        style={{ width: BCARD.w, height: BCARD.h, objectFit: "cover", display: "block" }}
      />
    </Card>
  );
};

const AfterCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.aCard, { damping: 16, stiffness: 140 });
  const thud =
    tri(frame, T.fly[0] + 16, 4, 12) * 0.012 +
    tri(frame, T.fly[1] + 16, 4, 12) * 0.012 +
    tri(frame, T.fly[2] + 16, 4, 12) * 0.01;
  return (
    <Card
      x={ACARD.x}
      y={ACARD.y}
      w={ACARD.w}
      h={ACARD.h}
      r={24}
      enter={enter}
      style={{
        overflow: "hidden",
        transform: `translateY(${(1 - enter) * 26}px) scale(${1 + thud})`,
      }}
    >
      <Img
        src={staticFile(S2C.shots.nytAfter)}
        style={{ width: ACARD.w, height: ACARD.h, objectFit: "cover", display: "block" }}
      />
      {CROPS.map((_, i) => (
        <SlotCover key={i} index={i} cardEnter={enter} />
      ))}
    </Card>
  );
};

/** Small Gemini badge — the real feature is Gemini-powered asset extraction. */
const GeminiBadge: React.FC = () => {
  const enter = useEnter(T.badge, SPRINGS.pop);
  return (
    <div
      style={{
        position: "absolute",
        left: 956,
        top: 2871,
        width: 68,
        height: 68,
        borderRadius: 999,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 12px 28px rgba(25,23,20,0.14)",
        display: "grid",
        placeItems: "center",
        opacity: enter,
        transform: `scale(${0.6 + 0.4 * enter})`,
      }}
    >
      <LogoImg src={S2C.logos.gemini} size={38} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const S2cCapabilities: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = useCam(CAM);
  const markIn = useEnter(T.mark, SPRINGS.pop);
  const markPulse =
    tri(frame, T.lines[0] + 12, 4, 10) * 0.05 +
    tri(frame, T.lines[1] + 12, 4, 10) * 0.05 +
    tri(frame, T.lines[2] + 12, 4, 10) * 0.05;

  return (
    <PaperWorld
      cam={cam}
      grid={{ left: -1400, top: -1600, width: 3900, height: 7400 }}
    >
      {/* ------- movement 1: three inputs → // → code ------- */}
      <Connectors />
      <ScreenshotCard />
      <FigmaCard />
      <RecordingCard />
      <div
        style={{
          position: "absolute",
          left: MARK.x,
          top: MARK.y,
          opacity: markIn,
          transform: `scale(${(0.84 + 0.16 * markIn) * (1 + markPulse)})`,
        }}
      >
        <S2cMark
          size={MARK.size}
          style={{ boxShadow: "0 20px 44px rgba(25,23,20,0.18)" }}
        />
      </div>
      <CodePanel />

      {/* ------- movement 2: asset extraction ------- */}
      <BeforeCard />
      <AfterCard />
      {CROPS.map((_, i) => (
        <DetectBox key={i} index={i} />
      ))}
      <Tile index={0} bow={-70} hoverScale={1.05} />
      <Tile index={1} bow={70} hoverScale={1.08} />
      <Tile index={2} bow={-50} hoverScale={1.9} />
      <GeminiBadge />
    </PaperWorld>
  );
};
