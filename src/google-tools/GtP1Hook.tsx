/**
 * GtP1Hook — beat 1 (1080×1080, 230f).
 * VO: "Google quietly dropped fifteen free AI tools. Most people are still
 *      paying for the stuff these replace. Here are the five worth your time."
 *
 * One continuous paper world, one camera:
 *   f0–22    tight on the real Google "G" popping in; four-color dots tick
 *            in underneath as one tight group (2f stagger)
 *   f22–40   18f pull-back reveals a 5×3 wall of white tool tiles cascading
 *            in (staggered springs, 3–5f apart, spiral from center); a mono
 *            counter chip ticks 1→15 as tiles land
 *   f96–116  20f push toward the wall; the five REAL identities (Pomelli,
 *            Stitch, Opal, Antigravity, Mixboard) pop forward — scale up,
 *            4px blue ring, deeper neutral shadow — while the ten neutral
 *            tiles recede gently (content dims to ~0.75, borders stay at
 *            full alpha so the 15-tile wall never dissolves into the paper)
 *   f170–188 settle back to full framing
 *   f205–230 clean end hold, two near-identical camera keys
 *
 * The five featured marks are normalized to one optical weight: every mark
 * is centered in its tile, and the brand-background wordmarks (Pomelli
 * olive, Mixboard lavender) ship as inset rounded chips of consistent
 * ~112–118px width — never near-full-bleed bars.
 *
 * No VO text on screen — only the ticking count (real data) and real marks.
 */
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  C,
  GOOGLE,
  GOOGLE_FOUR,
  GT,
  GoogleMark,
  MONO,
  PaperWorld,
  SPRINGS,
  StitchTile,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 230;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const EASE_OUT = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// World geometry (canvas 1080×1080, camera z = 1 at the final framing).
// Grid spans x 84…996 / y 380…918 so a 1.06 featured pop plus the 1.04 camera
// push still keeps every card edge inside the 54px side margins.
// ---------------------------------------------------------------------------

const G_MARK = { cx: 540, cy: 200, size: 120 };
const DOTS = { y: 286, size: 12, gap: 14 };
const CHIP = { right: 996, cy: 200 };

const GRID = { x: 84, y: 380, tile: 164, pitch: 187 }; // gap 23

// ---------------------------------------------------------------------------
// The 15-tile wall — cascade order spirals out from the center tile.
// Featured tiles are scattered: Pomelli (0,1) · Opal (0,4) · Stitch (1,2) ·
// Antigravity (2,0) · Mixboard (2,3). Emphasis staggers in tool order 1→5.
// ---------------------------------------------------------------------------

type Kind = "neutral" | "pomelli" | "stitch" | "opal" | "antigravity" | "mixboard";
type TileSpec = { row: number; col: number; kind: Kind; at: number; emphAt: number };

const EMPH = { pomelli: 116, stitch: 119, opal: 122, antigravity: 125, mixboard: 128 };
const RECEDE: [number, number] = [116, 134];

const TILES: TileSpec[] = [
  { row: 1, col: 2, kind: "stitch", at: 28, emphAt: EMPH.stitch },
  { row: 0, col: 2, kind: "neutral", at: 32, emphAt: 0 },
  { row: 1, col: 1, kind: "neutral", at: 35, emphAt: 0 },
  { row: 1, col: 3, kind: "neutral", at: 40, emphAt: 0 },
  { row: 2, col: 2, kind: "neutral", at: 43, emphAt: 0 },
  { row: 0, col: 1, kind: "pomelli", at: 47, emphAt: EMPH.pomelli },
  { row: 0, col: 3, kind: "neutral", at: 52, emphAt: 0 },
  { row: 2, col: 1, kind: "neutral", at: 55, emphAt: 0 },
  { row: 2, col: 3, kind: "mixboard", at: 59, emphAt: EMPH.mixboard },
  { row: 1, col: 0, kind: "neutral", at: 64, emphAt: 0 },
  { row: 1, col: 4, kind: "neutral", at: 67, emphAt: 0 },
  { row: 0, col: 0, kind: "neutral", at: 71, emphAt: 0 },
  { row: 0, col: 4, kind: "opal", at: 76, emphAt: EMPH.opal },
  { row: 2, col: 0, kind: "antigravity", at: 79, emphAt: EMPH.antigravity },
  { row: 2, col: 4, kind: "neutral", at: 83, emphAt: 0 },
];

// ---------------------------------------------------------------------------
// Neutral tile mark — faint Labs-flask outline (no invented product logos).
// Stroke darkened (#7A8085) so the wall stays readable while receded.
// ---------------------------------------------------------------------------

const FlaskGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "block", opacity: 0.85 }}
  >
    <path
      d="M9 3h6M10.3 3v5.4L5.7 17.6a2.8 2.8 0 0 0 2.6 3.9h7.4a2.8 2.8 0 0 0 2.6-3.9L13.7 8.4V3"
      stroke="#7A8085"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Featured marks — normalized to one optical weight on the 164px tile.
// Brand-background wordmarks become inset rounded chips (~112–118px wide),
// transparent-ink wordmarks sit directly on the white card.
// ---------------------------------------------------------------------------

const TileContent: React.FC<{ kind: Kind }> = ({ kind }) => {
  switch (kind) {
    case "stitch":
      // Real app icon as an inset rounded chip, radius matching the tile.
      return <StitchTile size={112} radius={24} />;
    case "pomelli":
      // The 542×190 crop is a ready-made olive chip (cream serif wordmark,
      // generous even bearings baked in) — round its corners and ship it.
      return (
        <Img
          src={staticFile(GT.logos.pomelliWordmark)}
          style={{ width: 118, borderRadius: 13, display: "block" }}
        />
      );
    case "opal":
      // Transparent-ink wordmark straight on the white card.
      return (
        <Img
          src={staticFile("google-tools/logos/opal-wordmark-alpha.png")}
          style={{ width: 112, height: 54, objectFit: "contain", display: "block" }}
        />
      );
    case "antigravity":
      // 120×117 viewBox with ~75% ink coverage → 140px box ≈ 105px ink,
      // matching the siblings' optical weight.
      return (
        <Img
          src={staticFile(GT.logos.antigravityMark)}
          style={{ width: 140, height: 136, objectFit: "contain", display: "block" }}
        />
      );
    case "mixboard":
      // Lavender brand chip + transparent-ink wordmark (same construction
      // idea as the Pomelli chip — a logo chip, not a screenshot fragment).
      return (
        <div
          style={{
            width: 118,
            height: 44,
            background: BRAND.mixboard.lavender,
            borderRadius: 13,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Img
            src={staticFile("google-tools/logos/mixboard-wordmark-alpha.png")}
            style={{ width: 96, display: "block" }}
          />
        </div>
      );
    default:
      return <FlaskGlyph size={46} />;
  }
};

// ---------------------------------------------------------------------------
// One tile of the wall.
// Fill and content fade; the hairline border pops at FULL alpha the moment
// the tile exists (entrance floor ~0.25 fill) and never fades — receded
// neutrals dim their content to ~0.75 instead of vanishing into the paper.
// ---------------------------------------------------------------------------

const Tile: React.FC<{ spec: TileSpec; index: number }> = ({ spec, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const featured = spec.kind !== "neutral";

  const x = GRID.x + spec.col * GRID.pitch;
  const y = GRID.y + spec.row * GRID.pitch;

  const enter = spring({ frame: frame - spec.at, fps, config: SPRINGS.pop });

  // Featured pop-forward / neutral recede
  const emph = featured
    ? interpolate(frame, [spec.emphAt, spec.emphAt + 14], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : 0;
  const recede = featured
    ? 0
    : interpolate(frame, RECEDE, [0, 1], { ...CLAMP, easing: EASE_OUT });

  const scale = (0.82 + 0.18 * enter) * (1 + 0.06 * emph - 0.05 * recede);
  // Card fill: 0.25 at entry → 1. Receded content dims to a 0.75 floor.
  const fill = 0.25 + 0.75 * enter;
  const contentDim = 1 - 0.25 * recede;
  // Micro-float during the hold, featured tiles only, staggered phase
  const float = emph * 2.2 * Math.sin((frame - spec.emphAt) / 12 + index * 1.7);
  const ty = (1 - enter) * 30 - float;

  // Emphasis ring: hairline → 4px blue-tinted so it survives downscale.
  const border = featured
    ? interpolateColors(emph, [0, 1], [C.line, "#5E97F6"])
    : C.line;
  const shadow = featured
    ? `0 ${16 + 8 * emph}px ${38 + 14 * emph}px rgba(25,23,20,${(0.07 + 0.06 * emph) * enter})`
    : `0 ${16 - 5 * recede}px ${38 - 10 * recede}px rgba(25,23,20,${(0.07 - 0.03 * recede) * enter})`;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: GRID.tile,
        height: GRID.tile,
        boxSizing: "border-box",
        borderRadius: 24,
        background: `rgba(255,255,255,${fill})`,
        border: `${1.5 + 2.5 * emph}px solid ${border}`,
        boxShadow: shadow,
        opacity: frame >= spec.at ? 1 : 0,
        transform: `translateY(${ty}px) scale(${scale})`,
        transformOrigin: "50% 50%",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ opacity: enter * contentDim, display: "grid", placeItems: "center" }}>
        <TileContent kind={spec.kind} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header — the real Google "G" + four-color underline dots (tight 2f stagger
// so no lone dot sits orphaned while the rest arrive)
// ---------------------------------------------------------------------------

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: SPRINGS.bouncy });
  const breathe = 1 + 0.005 * Math.sin(frame / 9);
  const gScale = pop * breathe;

  const dotsW = 4 * DOTS.size + 3 * DOTS.gap;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: G_MARK.cx - G_MARK.size / 2,
          top: G_MARK.cy - G_MARK.size / 2,
          width: G_MARK.size,
          height: G_MARK.size,
          transform: `scale(${gScale})`,
          transformOrigin: "50% 50%",
          opacity: Math.min(1, pop * 2),
        }}
      >
        <GoogleMark size={G_MARK.size} />
      </div>
      {GOOGLE_FOUR.map((color, i) => {
        const e = spring({ frame: frame - (10 + i * 2), fps, config: SPRINGS.pop });
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: 540 - dotsW / 2 + i * (DOTS.size + DOTS.gap),
              top: DOTS.y,
              width: DOTS.size,
              height: DOTS.size,
              borderRadius: 999,
              background: color,
              opacity: e,
              transform: `scale(${e}) translateY(${(1 - e) * 10}px)`,
            }}
          />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Counter chip — mono digits ticking 1 → 15 as the wall lands (real data)
// ---------------------------------------------------------------------------

const CounterChip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 34, fps, config: SPRINGS.snappy });
  // The count IS the cascade: one tick per tile, counted as each one lands
  // (4f into its entrance spring), so the digits never run ahead of the wall.
  const n = Math.max(
    1,
    TILES.reduce((acc, t) => acc + (frame >= t.at + 4 ? 1 : 0), 0),
  );

  const popScale = interpolate(frame, [87, 93, 106], [1, 1.1, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: CHIP.right - 220,
        top: CHIP.cy - 34,
        width: 220,
        display: "flex",
        justifyContent: "flex-end",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
      }}
    >
      <div
        style={{
          height: 68,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${GOOGLE.blueLine}`,
          boxShadow: "0 10px 26px rgba(25,23,20,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          transform: `scale(${popScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 40,
            fontWeight: 700,
            color: GOOGLE.blue,
            letterSpacing: -0.5,
            lineHeight: 1,
            ...tabular,
          }}
        >
          {n}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP1Hook: React.FC = () => {
  // tight on G → pull back → hold (cascade) → push (featured pop) → settle →
  // end hold on two near-identical keys
  const cam = useCam({
    keys: [0, 22, 40, 96, 116, 170, 188, 205, 230],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [G_MARK.cy, G_MARK.cy, 540, 540, 582, 582, 540, 540, 540],
    z: [3.0, 3.0, 1, 1, 1.04, 1.04, 1, 1, 0.998],
  });

  return (
    <PaperWorld cam={cam}>
      {TILES.map((spec, i) => (
        <Tile key={`${spec.row}-${spec.col}`} spec={spec} index={i} />
      ))}
      <Header />
      <CounterChip />
    </PaperWorld>
  );
};
