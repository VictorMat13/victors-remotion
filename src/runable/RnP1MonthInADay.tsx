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
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import {
  ALTARI,
  ALTARI_GRID,
  ALTARI_FONT,
  SLIDE,
  SPRINGS,
  safePadX,
  CAROUSEL_SLIDES,
} from "./theme";

loadSerif();
loadManrope();
loadPoppins();

// ============================================================================
// RnP1MonthInADay — 1080x1080 @ 30fps  (1:1 insert over talking head)
// VO [0:00]: "AI can now design perfect Instagram carousels without touching a
// design tool. And people are generating a month's worth in one day."
//
// The hook lands the OUTCOME: finished carousel covers existing in volume.
// One continuous world = a 6x5 wall of DISTINCT covers (10 real slide exports
// interleaved with 20 synthesized covers in the same slide language) mounted
// on Altari surface cards over the deep purple ground.
// The camera opens tight on the hero cover, rides outward while the wall
// blooms in radial waves with landing flashes, tilts back as it goes wide,
// then the hook copy stamps over the lit wall:
// "A MONTH OF CAROUSELS." / "One day."
//
// No numeric counter here — the 01→30 climbing counter is RnP7's signature
// move ([0:32] "I stacked thirty"); this beat's proof is variety + the stamp.
//
// Beats
//   0-22    hold   tight on the hero cover, settling + sheen
//   22-42   move   ease out, ring 1 blooms
//   42-72   hold   the 3x3 neighbourhood lands
//   72-92   move   pull back
//   92-128  hold   rings 2-3 fill fast
//   128-150 move   final pull-out; the wall tilts back, light sweep begins
//   150-216 hold   headline stamps over the full month, end hold
// ============================================================================

export const DURATION_IN_FRAMES = 216;

const VIEW = 1080;

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ---------------------------------------------------------------------------
// Grid geometry (world coordinates)
// ---------------------------------------------------------------------------
const COLS = 6;
const ROWS = 5; // 30 tiles = a month of posts

const IMG_W = 280;
const IMG_H = 350; // 4:5 — matches the real 1080x1350 slide exports
const PAD = 12; // Altari surface mount around each slide
const CW = IMG_W + PAD * 2; // 304
const CH = IMG_H + PAD * 2; // 374
const GAP = 32;

const ORIGIN_X = 400;
const ORIGIN_Y = 400;
const GRID_W = COLS * CW + (COLS - 1) * GAP; // 1984
const GRID_H = ROWS * CH + (ROWS - 1) * GAP; // 1998
const GRID_CX = ORIGIN_X + GRID_W / 2;
const GRID_CY = ORIGIN_Y + GRID_H / 2;

const cellX = (c: number) => ORIGIN_X + c * (CW + GAP);
const cellY = (r: number) => ORIGIN_Y + r * (CH + GAP);

// The slide the clip opens on — off-centre vertically so the pull-out travels.
const HERO_C = 2;
const HERO_R = 1;
const HERO_X = cellX(HERO_C);
const HERO_Y = cellY(HERO_R);
const HERO_CX = HERO_X + CW / 2;
const HERO_CY = HERO_Y + CH / 2;

// Final zoom derived from the hard 5% side rule (54px on 1080) plus breathing
// room, so the whole wall provably sits inside the safe area.
const SAFE = safePadX(VIEW); // 54
const BREATH = 34;
const Z_WIDE = (VIEW - 2 * (SAFE + BREATH)) / Math.max(GRID_W, GRID_H); // ~0.4525

// ---------------------------------------------------------------------------
// Cover content — every one of the 30 cells is DISTINCT.
// 10 real slide exports sit at (c + 2r) % 3 === 1 (never adjacent, hero
// included); the other 20 cells get synthesized covers in the slide language.
// ---------------------------------------------------------------------------
type Glyph = "nodes" | "squares" | "clock" | "doc" | "layers" | "bars";

type MiniSpec = {
  v: "cover" | "list" | "stat" | "keyword";
  accent: "coral" | "red";
  kicker?: string;
  t1?: string;
  t2?: string; // accent line
  t3?: string;
  glyph?: Glyph;
  items?: string[];
  stat?: string;
  cap?: string;
  word?: string;
};

const MINI_SPECS: MiniSpec[] = [
  { v: "cover", accent: "coral", t1: "Stop Using AI Like", t2: "A To-Do App", t3: "Run It Like Staff.", glyph: "nodes", cap: "The operator setup." },
  { v: "list", accent: "coral", t1: "5 MCP Servers", t2: "That Do Real Work", items: ["Gmail + calendar", "Your database", "The browser"] },
  { v: "cover", accent: "red", t1: "Your Second Brain", t2: "Lives In Claude", t3: "Not In Your Head.", glyph: "doc", cap: "Set up once. Compounds." },
  { v: "stat", accent: "coral", kicker: "ONE AUTOMATION", stat: "30x", cap: "ROI before anything else ships" },
  { v: "cover", accent: "red", t1: "You're In", t2: "Doomprompting Jail", t3: "Here's The Way Out.", glyph: "bars", cap: "Measure. Then build." },
  { v: "cover", accent: "coral", t1: "CLAUDE.md", t2: "Teaches The Skills", t3: "Every Session.", glyph: "doc", cap: "A teaching document." },
  { v: "cover", accent: "coral", t1: "Subagents", t2: "Many Specialists", t3: "One Prompt.", glyph: "nodes", cap: "Stop working in series." },
  { v: "cover", accent: "red", t1: "Hooks", t2: "Fire Without You", t3: "Every Single Time.", glyph: "clock", cap: "No prompt required." },
  { v: "stat", accent: "coral", kicker: "LEAD FULFILLMENT", stat: "$18K", cap: "saved per year, difficulty low" },
  { v: "cover", accent: "coral", t1: "Agents That Talk", t2: "To Each Other", t3: "Context Flows.", glyph: "nodes", cap: "Not random chatbots." },
  { v: "cover", accent: "red", t1: "The AI Workforce", t2: "Org Chart", t3: "Chief To Specialist.", glyph: "layers", cap: "A team, not a tool." },
  { v: "list", accent: "red", t1: "Automate The $200K", t2: "Not The 15 Minutes", items: ["Map every process", "Rank by real ROI", "Build the top one"] },
  { v: "cover", accent: "coral", t1: "Memory Systems", t2: "That Compound", t3: "Layer By Layer.", glyph: "layers", cap: "Skip one, all degrade." },
  { v: "cover", accent: "coral", t1: "One Sentence In", t2: "Ten Slides Out", t3: "Minutes Later.", glyph: "squares", cap: "The whole deck." },
  { v: "cover", accent: "red", t1: "Skills", t2: "Package Your Process", t3: "Invoke With A Slash.", glyph: "squares", cap: "Expertise, executable." },
  { v: "stat", accent: "red", kicker: "ONE SYSTEM", stat: "42", cap: "specialist agents, connected" },
  { v: "cover", accent: "coral", t1: "Research To Design", t2: "In One Agent", t3: "Start To Finish.", glyph: "bars", cap: "The entire process." },
  { v: "cover", accent: "coral", t1: "Your Content Engine", t2: "Runs Every Morning", t3: "Reports Back Done.", glyph: "clock", cap: "On a schedule." },
  { v: "keyword", accent: "coral", kicker: "COMMENT ↓", word: "SYSTEM", cap: "Full setup guide in the DM" },
  { v: "list", accent: "coral", t1: "What Changes In", t2: "Week One", items: ["You stop repeating", "Work runs parallel", "It ships without you"] },
];

const isRealCell = (c: number, r: number) => (c + 2 * r) % 3 === 1;

// Deterministic content map: hero gets the real cover (01.png), the other
// real cells take 02..10 in reading order, minis fill the rest in order.
type TileContent = { kind: "img"; src: string } | { kind: "mini"; spec: MiniSpec };

const CONTENT: Record<string, TileContent> = (() => {
  const map: Record<string, TileContent> = {};
  let real = 1; // 01.png reserved for the hero
  let mini = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = `t${c}-${r}`;
      if (c === HERO_C && r === HERO_R) {
        map[id] = { kind: "img", src: CAROUSEL_SLIDES[0] };
      } else if (isRealCell(c, r)) {
        map[id] = { kind: "img", src: CAROUSEL_SLIDES[real] };
        real += 1;
      } else {
        map[id] = { kind: "mini", spec: MINI_SPECS[mini % MINI_SPECS.length] };
        mini += 1;
      }
    }
  }
  return map;
})();

// ---------------------------------------------------------------------------
// Tiles — radial ring order so the wall multiplies outward from the hero
// ---------------------------------------------------------------------------
type Tile = {
  id: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  ring: number;
  content: TileContent;
  enter: number;
  phase: number;
};

// Angle from the hero, 0 at the top and increasing clockwise.
const angleFromHero = (cx: number, cy: number) => {
  const a = Math.atan2(cx - HERO_CX, -(cy - HERO_CY));
  return a < 0 ? a + Math.PI * 2 : a;
};

// Each ring blooms outward from the direction the camera is travelling
// (down and slightly right), so tiles land ahead of the move instead of
// behind it, and both sides fill symmetrically.
const TRAVEL_A = Math.atan2(1392 - HERO_CX, -(1399 - HERO_CY)) + Math.PI * 2;
const bloomKey = (cx: number, cy: number) => {
  const d = Math.abs(angleFromHero(cx, cy) - (TRAVEL_A % (Math.PI * 2)));
  return Math.min(d, Math.PI * 2 - d);
};

const RING_ENTER = [-20, 20, 52, 92];
const RING_STEP = [0, 2.2, 2.6, 3.0];

const TILES: Tile[] = (() => {
  const raw: Omit<Tile, "enter">[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = cellX(c);
      const y = cellY(r);
      raw.push({
        id: `t${c}-${r}`,
        x,
        y,
        cx: x + CW / 2,
        cy: y + CH / 2,
        ring: Math.max(Math.abs(c - HERO_C), Math.abs(r - HERO_R)),
        content: CONTENT[`t${c}-${r}`],
        phase: c * 1.7 + r * 2.3,
      });
    }
  }
  const out: Tile[] = [];
  const maxRing = raw.reduce((m, t) => Math.max(m, t.ring), 0);
  for (let ring = 0; ring <= maxRing; ring++) {
    const base = RING_ENTER[Math.min(ring, RING_ENTER.length - 1)];
    const step = RING_STEP[Math.min(ring, RING_STEP.length - 1)];
    raw
      .filter((t) => t.ring === ring)
      .sort(
        (a, b) =>
          bloomKey(a.cx, a.cy) - bloomKey(b.cx, b.cy) ||
          angleFromHero(a.cx, a.cy) - angleFromHero(b.cx, b.cy),
      )
      .forEach((t, i) => out.push({ ...t, enter: base + i * step }));
  }
  // Paint outer rings first so the hero sits on top during the tight open.
  return out.sort((a, b) => b.ring - a.ring);
})();

// ---------------------------------------------------------------------------
// Camera — hold -> move -> hold -> move -> hold -> move -> hold (+stamp)
// ---------------------------------------------------------------------------
const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 22, 42, 72, 92, 128, 150, 216];
const KEY_FX = [HERO_CX, HERO_CX, 1290, 1290, 1340, 1340, GRID_CX, GRID_CX];
const KEY_FY = [HERO_CY, HERO_CY + 3, 1090, 1090, 1250, 1250, GRID_CY, GRID_CY];
const KEY_Z = [2.0, 1.93, 1.22, 1.22, 0.75, 0.75, Z_WIDE, Z_WIDE - 0.004];

// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const popAt = (frame: number, fps: number, start: number, dur = 24) =>
  frame < start
    ? 0
    : spring({
        frame: frame - start,
        fps,
        config: SPRINGS.snappy,
        durationInFrames: dur,
      });

// ---------------------------------------------------------------------------
// Altari materials
// ---------------------------------------------------------------------------
// The grid is always present: 64px on the backdrop, 24px on cards. Both are
// drawn in lavender at very low alpha so they read as texture, never as lines.
const gridLayer = (size: number, alphaV: number) => ({
  backgroundImage: `linear-gradient(rgba(165,167,217,${alphaV}) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,${alphaV}) 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});

// ---------------------------------------------------------------------------
// Synthesized covers — the slide language of the real exports, in miniature
// ---------------------------------------------------------------------------
const MINI_FONT =
  'Poppins, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

const GlyphSvg: React.FC<{ glyph: Glyph; accent: string }> = ({
  glyph,
  accent,
}) => {
  const s = 96;
  const common = { stroke: accent, fill: "none", strokeWidth: 2.4 };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 96 96"
      style={{ filter: `drop-shadow(0 0 10px ${SLIDE.coralGlow})` }}
    >
      {glyph === "nodes" ? (
        <>
          <circle cx={48} cy={48} r={13} fill={accent} opacity={0.9} />
          <circle cx={48} cy={48} r={22} {...common} opacity={0.5} />
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const rad = (a * Math.PI) / 180;
            const x2 = 48 + Math.cos(rad) * 40;
            const y2 = 48 + Math.sin(rad) * 40;
            return (
              <g key={a}>
                <line x1={48 + Math.cos(rad) * 24} y1={48 + Math.sin(rad) * 24} x2={x2} y2={y2} {...common} opacity={0.7} />
                <circle cx={x2} cy={y2} r={4.5} fill={accent} />
              </g>
            );
          })}
        </>
      ) : null}
      {glyph === "squares" ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={18 + (i % 2) * 34}
              y={18 + Math.floor(i / 2) * 34}
              width={26}
              height={26}
              rx={7}
              {...common}
              fill={i === 0 ? accent : "none"}
              opacity={i === 0 ? 0.9 : 0.75}
            />
          ))}
        </>
      ) : null}
      {glyph === "clock" ? (
        <>
          <circle cx={48} cy={48} r={30} {...common} />
          <line x1={48} y1={48} x2={48} y2={28} {...common} strokeLinecap="round" />
          <line x1={48} y1={48} x2={62} y2={54} {...common} strokeLinecap="round" />
          <circle cx={48} cy={48} r={4} fill={accent} />
        </>
      ) : null}
      {glyph === "doc" ? (
        <>
          <rect x={26} y={16} width={44} height={64} rx={8} {...common} />
          {[32, 44, 56].map((y) => (
            <line key={y} x1={36} y1={y} x2={60} y2={y} {...common} opacity={0.7} strokeLinecap="round" />
          ))}
          <line x1={36} y1={68} x2={50} y2={68} stroke={accent} strokeWidth={3.2} strokeLinecap="round" />
        </>
      ) : null}
      {glyph === "layers" ? (
        <>
          <polygon points="48,16 82,34 48,52 14,34" {...common} fill={alpha(accent.startsWith("#") ? accent : SLIDE.coral, 0.25)} />
          <polyline points="14,50 48,68 82,50" {...common} opacity={0.75} />
          <polyline points="14,64 48,82 82,64" {...common} opacity={0.45} />
        </>
      ) : null}
      {glyph === "bars" ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={20 + i * 16}
              y={72 - (18 + i * 14)}
              width={10}
              height={18 + i * 14}
              rx={4}
              fill={i === 3 ? accent : alpha(SLIDE.heading, 0.28)}
            />
          ))}
        </>
      ) : null}
    </svg>
  );
};

const MiniCover: React.FC<{ spec: MiniSpec }> = ({ spec }) => {
  const accent = spec.accent === "red" ? SLIDE.red : SLIDE.coral;
  const panel: React.CSSProperties = {
    border: `1px solid ${SLIDE.border}`,
    borderRadius: 12,
    backgroundColor: alpha("#FFFFFF", 0.015),
  };
  return (
    <div
      style={{
        width: IMG_W,
        height: IMG_H,
        position: "relative",
        backgroundColor: SLIDE.bg,
        backgroundImage: `radial-gradient(${SLIDE.dot} 1px, transparent 1px)`,
        backgroundSize: "14px 14px",
        fontFamily: MINI_FONT,
        overflow: "hidden",
      }}
    >
      {/* footer accent bar — every real slide carries it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 64,
          height: 7,
          backgroundColor: accent,
        }}
      />

      {spec.v === "cover" ? (
        <>
          <div
            style={{
              ...panel,
              position: "absolute",
              top: 18,
              left: 16,
              right: 16,
              padding: "14px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ color: SLIDE.heading, fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{spec.t1}</div>
            <div style={{ color: accent, fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{spec.t2}</div>
            <div style={{ color: SLIDE.heading, fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{spec.t3}</div>
          </div>
          <div
            style={{
              position: "absolute",
              top: 138,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {spec.glyph ? <GlyphSvg glyph={spec.glyph} accent={accent} /> : null}
          </div>
          <div
            style={{
              ...panel,
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 22,
              padding: "10px 8px",
              textAlign: "center",
              color: accent,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {spec.cap}
          </div>
        </>
      ) : null}

      {spec.v === "list" ? (
        <>
          <div style={{ position: "absolute", top: 22, left: 18, right: 18, textAlign: "center" }}>
            <div style={{ color: SLIDE.heading, fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{spec.t1}</div>
            <div style={{ color: accent, fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{spec.t2}</div>
          </div>
          <div style={{ position: "absolute", top: 106, left: 18, right: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {(spec.items ?? []).map((it, i) => (
              <div key={it} style={{ ...panel, display: "flex", alignItems: "center", gap: 10, padding: "12px 12px" }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    border: `1.5px solid ${accent}`,
                    color: accent,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ color: SLIDE.heading, fontSize: 12.5, fontWeight: 600 }}>{it}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {spec.v === "stat" ? (
        <>
          <div
            style={{
              position: "absolute",
              top: 34,
              left: 0,
              right: 0,
              textAlign: "center",
              color: SLIDE.mutedText,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 3,
            }}
          >
            {spec.kicker}
          </div>
          <div
            style={{
              position: "absolute",
              top: 96,
              left: 0,
              right: 0,
              textAlign: "center",
              color: accent,
              fontSize: 86,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: `0 0 26px ${SLIDE.coralGlow}`,
            }}
          >
            {spec.stat}
          </div>
          <div
            style={{
              ...panel,
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 34,
              padding: "12px 10px",
              textAlign: "center",
              color: SLIDE.heading,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            {spec.cap}
          </div>
        </>
      ) : null}

      {spec.v === "keyword" ? (
        <>
          <div
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                border: `1.5px solid ${accent}`,
                borderRadius: 999,
                color: accent,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: 2,
                padding: "6px 16px",
              }}
            >
              {spec.kicker}
            </div>
          </div>
          <div
            style={{
              ...panel,
              position: "absolute",
              left: 18,
              right: 18,
              top: 118,
              padding: "26px 8px",
              textAlign: "center",
              color: SLIDE.heading,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 4,
              boxShadow: `inset 0 0 34px ${alpha("#000000", 0.4)}`,
            }}
          >
            {spec.word}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 40,
              textAlign: "center",
              color: SLIDE.mutedText,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {spec.cap}
          </div>
        </>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// One finished slide on its Altari surface mount
// ---------------------------------------------------------------------------
const SlideCard: React.FC<{
  tile: Tile;
  frame: number;
  fps: number;
  isHero: boolean;
  heroLift: number;
}> = ({ tile, frame, fps, isHero, heroLift }) => {
  const p = isHero
    ? spring({
        frame: frame - tile.enter,
        fps,
        config: SPRINGS.smooth,
        durationInFrames: 52,
      })
    : popAt(frame, fps, tile.enter);

  if (p <= 0.001) return null;

  // Non-hero tiles slide outward from the hero as they materialise.
  const dx = tile.cx - HERO_CX;
  const dy = tile.cy - HERO_CY;
  const len = Math.hypot(dx, dy) || 1;
  const off = isHero ? 0 : 24 * (1 - p);
  const ox = (-dx / len) * off;
  const oy = (-dy / len) * off;

  // Barely-there settle breath so the wall never reads as a frozen still.
  const bob = 1 + 0.004 * Math.sin(frame * 0.055 + tile.phase);
  const scale = (isHero ? 0.945 + 0.055 * p : 0.9 + 0.1 * p) * bob;

  // Landing flash — a brief lavender rim right as each tile touches down,
  // so the bloom reads as energy instead of tiles quietly appearing.
  const flash = isHero
    ? 0
    : clamp01(1 - Math.abs(frame - (tile.enter + 10)) / 12);

  // Ken-Burns settle inside the hero image: it is already mid-motion at frame 0.
  const imgScale = isHero
    ? interpolate(frame, [0, 78], [1.05, 1.0], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  // Specular sheen crossing the hero during the opening hold.
  const sheen = isHero
    ? interpolate(frame, [2, 38], [0, 1], {
        easing: Easing.inOut(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const lift = isHero ? heroLift : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: tile.x,
        top: tile.y,
        width: CW,
        height: CH,
        boxSizing: "border-box",
        padding: PAD,
        backgroundColor: ALTARI.card,
        ...gridLayer(ALTARI_GRID.card, 0.05),
        // Offset so a grid line falls inside the 12px mount instead of under
        // the border, where it would never be seen.
        backgroundPosition: `${PAD / 2}px ${PAD / 2}px`,
        borderRadius: 16,
        border: `1px solid ${
          flash > 0.05 ? alpha(ALTARI.primaryLight, 0.35 + 0.45 * flash) : ALTARI.border
        }`,
        // Dark ground wants ambient depth + a soft primary halo, not a warm
        // drop shadow.
        boxShadow: `0 ${10 + 16 * lift}px ${26 + 30 * lift}px rgba(9,9,20,${
          0.42 + 0.16 * lift
        }), 0 2px 6px rgba(9,9,20,0.34), 0 0 ${
          22 + 38 * lift + 34 * flash
        }px rgba(91,94,194,${0.16 + 0.18 * lift + 0.3 * flash})`,
        opacity: isHero ? 1 : clamp01(p * 2.8),
        transform: `translate(${ox}px, ${oy}px) scale(${scale})`,
        transformOrigin: "center center",
        zIndex: isHero ? 40 : 10 - tile.ring,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 8,
          overflow: "hidden",
          background: ALTARI.bgAlt,
        }}
      >
        {tile.content.kind === "img" ? (
          <Img
            src={staticFile(tile.content.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: `scale(${imgScale})`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <MiniCover spec={tile.content.spec} />
        )}
        {sheen > 0 && sheen < 1 ? (
          <div
            style={{
              position: "absolute",
              top: -CH * 0.3,
              left: -CW * 0.9 + sheen * CW * 2.2,
              width: CW * 0.55,
              height: CH * 1.6,
              background:
                "linear-gradient(90deg, rgba(165,167,217,0) 0%, rgba(196,198,240,0.15) 50%, rgba(165,167,217,0) 100%)",
              transform: "rotate(14deg)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RnP1MonthInADay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Hero keeps a little extra elevation while it is alone, then settles to a
  // faint permanent halo so it stays the anchor of the finished wall.
  const heroLift = interpolate(frame, [38, 100], [1, 0.16], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Primary-purple ambience grows as the wall fills — the only accent in frame.
  const glow = interpolate(frame, [30, 150], [0.35, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The wall lays back as the camera goes wide — a lit surface, not a flat map.
  const tilt = interpolate(frame, [126, 162], [0, 8], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Light sweep across the finished wall during the end hold.
  const sweep = interpolate(frame, [152, 194], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vignette deepens once the stamp lands so the copy owns the frame.
  const vig = interpolate(frame, [140, 162], [0.24, 0.44], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- headline stamp -----------------------------------------------------
  const STAMP_AT = 152;
  const stampP = spring({
    frame: frame - STAMP_AT,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 26,
  });
  const stamp2P = spring({
    frame: frame - (STAMP_AT + 8),
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 30,
  });
  const showStamp = frame >= STAMP_AT;

  return (
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* Opaque deep-purple Altari ground — full-bleed, frame 0 to last frame */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${ALTARI.bg} 0%, ${ALTARI.bgAlt} 54%, ${ALTARI.bg} 100%)`,
        }}
      />
      {/* Always-on 64px backdrop grid, low contrast */}
      <AbsoluteFill style={gridLayer(ALTARI_GRID.backdrop, 0.045)} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(58% 52% at 50% 46%, rgba(91,94,194,0.42) 0%, rgba(91,94,194,0.16) 42%, rgba(91,94,194,0) 74%)",
          opacity: glow,
        }}
      />

      {/* Camera, inside a perspective stage so the wide wall can lay back */}
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 42%" }}>
        <AbsoluteFill
          style={{
            transform: `rotateX(${tilt}deg)`,
            transformOrigin: "50% 62%",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              position: "absolute",
              transform: `translate(${VIEW / 2 - fx}px, ${
                VIEW / 2 - fy
              }px) scale(${z})`,
              transformOrigin: `${fx}px ${fy}px`,
            }}
          >
            {TILES.map((t) => (
              <SlideCard
                key={t.id}
                tile={t}
                frame={frame}
                fps={fps}
                isHero={t.ring === 0}
                heroLift={heroLift}
              />
            ))}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Light sweep — screen space, under the stamp */}
      {sweep > 0 && sweep < 1 ? (
        <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: -VIEW * 0.35,
              left: -VIEW * 0.75 + sweep * VIEW * 2.1,
              width: VIEW * 0.5,
              height: VIEW * 1.7,
              background:
                "linear-gradient(90deg, rgba(165,167,217,0) 0%, rgba(196,198,240,0.10) 50%, rgba(165,167,217,0) 100%)",
              transform: "rotate(16deg)",
            }}
          />
        </AbsoluteFill>
      ) : null}

      {/* Vignette to seat the wall on the purple ground */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(74% 70% at 50% 50%, rgba(0,0,0,0) 56%, rgba(12,12,26,${vig}) 100%)`,
        }}
      />

      {/* Headline stamp — the hook copy, over the finished month */}
      {showStamp ? (
        <>
          <AbsoluteFill
            style={{
              background: `radial-gradient(56% 44% at 50% 50%, ${alpha(
                ALTARI.bg,
                0.62 * clamp01(stampP * 1.4),
              )} 0%, ${alpha(ALTARI.bg, 0.3 * clamp01(stampP * 1.4))} 52%, rgba(26,26,46,0) 78%)`,
            }}
          />
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                transform: `scale(${0.92 + 0.08 * stampP}) translateY(${
                  (1 - stampP) * 26
                }px)`,
                opacity: clamp01(stampP * 1.6),
              }}
            >
              <div
                style={{
                  fontFamily: ALTARI_FONT.body,
                  fontWeight: 800,
                  fontSize: 66,
                  letterSpacing: interpolate(stampP, [0, 1], [7, 1.5]),
                  color: ALTARI.heading,
                  textShadow: "0 4px 30px rgba(9,9,20,0.65)",
                }}
              >
                A MONTH OF CAROUSELS.
              </div>
              <div
                style={{
                  fontFamily: ALTARI_FONT.accent,
                  fontStyle: "italic",
                  fontSize: 128,
                  lineHeight: 1.05,
                  marginTop: 6,
                  color: ALTARI.heading,
                  textShadow: `0 0 44px ${alpha(ALTARI.primaryLight, 0.55)}, 0 4px 30px rgba(9,9,20,0.6)`,
                  transform: `scale(${0.9 + 0.1 * stamp2P})`,
                  opacity: clamp01(stamp2P * 1.6),
                }}
              >
                One day.
              </div>
            </div>
          </AbsoluteFill>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
