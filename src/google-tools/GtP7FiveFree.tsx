/**
 * GtP7FiveFree — beat 7 of the Google Tools series (PAPER + GOOGLE BLUE,
 * 1080×1080). VO: "All five are free right now. Most are in beta… ten more
 * where these came from." Nothing on screen restates it — the five REAL
 * identities line up on one rail, the REAL Google Labs EXPERIMENT badge
 * flips onto the four Labs tools (Antigravity honestly gets none), and a
 * G-mark counter ticks 5 → 15 driven by the ACTUAL number of mounted
 * placeholder tiles — the digit is honest at every frame.
 *
 *   f0–14    tight open (z 1.7) on Pomelli + Stitch landing
 *   f14–34   camera pulls to the full row (20f EASE); Opal / Antigravity /
 *            Mixboard pop as the frame arrives at each slot
 *   f34–118  hold — EXPERIMENT pills flip down staggered (f60/71/82/93),
 *            all four on ONE bottom rail, each inside its own column
 *   f118–142 pull back to z 0.78; ten neutral skeleton tiles fan outward
 *            (f126…f158) and the counter ticks +1 as each one mounts,
 *            landing on 15 at f160 with a settle pop + blue border snap
 *   f160–174 settle pop decays; f174–200 static end hold (26f, camera
 *            keys near-identical)
 *
 * Tile system (audited): ONE height (124), ONE centerline (y 540, no
 * per-tile offsets), ONE gap token (20). Two aspect classes: 124-square
 * icon tiles (Stitch, Antigravity) and ~2:1 wordmark tiles (Pomelli, Opal
 * at 248; Mixboard widened to 330 so its very wide mark — ink 435×76 in
 * the source — holds the shared ~44% ink height). Row spans world
 * x −37…1117; at the z 0.83 row hold that maps to screen 61…1019, inside
 * the 54…1026 safe band. Ring extremes at z 0.78 map to screen 134…946.
 */
import React from "react";
import {
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  BRAND,
  C,
  ExperimentPill,
  GOOGLE,
  GT,
  GoogleMark,
  MONO,
  PaperWorld,
  SPRINGS,
  StitchTile,
  tabular,
  useCam,
  useEnter,
} from "./kit";

// New transparent-ink wordmark crops (2026-08-10 central asset drop) — not
// yet in GT; the kit entries still point at the old opaque crops.
const OPAL_ALPHA = "google-tools/logos/opal-wordmark-alpha.png"; // 293×136
const MIXBOARD_ALPHA = "google-tools/logos/mixboard-wordmark-alpha.png"; // 480×110

export const DURATION_IN_FRAMES = 200;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** 0→1→0 triangle pulse. */
const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], clamp);

const SHADOW = "0 16px 38px rgba(25,23,20,0.07)";

// ---------------------------------------------------------------------------
// Row system — ONE tile height, ONE centerline, ONE gap token. Two aspect
// classes: 124-square (icon tiles) and wordmark tiles (248 ≈ 2:1; Mixboard
// widened to 330 for its 5.7:1 mark at the shared ink height).
// ---------------------------------------------------------------------------

const ROW_CY = 540;
const TILE_H = 124;
const RADIUS = 26;
const GAP = 20;

type TileKey = "pomelli" | "stitch" | "opal" | "antigravity" | "mixboard";

const TILE_DEFS: { key: TileKey; w: number; at: number; pillAt: number | null }[] = [
  { key: "pomelli", w: 248, at: 3, pillAt: 60 },
  { key: "stitch", w: 124, at: 12, pillAt: 71 },
  { key: "opal", w: 248, at: 24, pillAt: 82 },
  { key: "antigravity", w: 124, at: 31, pillAt: null },
  { key: "mixboard", w: 330, at: 38, pillAt: 93 },
];

const ROW_W =
  TILE_DEFS.reduce((a, t) => a + t.w, 0) + GAP * (TILE_DEFS.length - 1);

const TILES = (() => {
  let x = 540 - ROW_W / 2; // −37 … 1117, centred on the world
  return TILE_DEFS.map((t) => {
    const placed = { ...t, x };
    x += t.w + GAP;
    return placed;
  });
})();

// Ten neutral skeleton tiles fanning into a ring around (540, 540) — ONE
// locked size, ordered so the fan grows outward. Their mount times drive
// the counter (5 + mounted), so the digit is honest at every frame.
const RING_S = 100;
const RING: { x: number; y: number; at: number }[] = [
  { x: 100, y: 334, at: 126 },
  { x: 980, y: 334, at: 129 },
  { x: 100, y: 746, at: 133 },
  { x: 980, y: 746, at: 136 },
  { x: 291, y: 141, at: 140 },
  { x: 789, y: 141, at: 143 },
  { x: 291, y: 939, at: 147 },
  { x: 789, y: 939, at: 150 },
  { x: 540, y: 70, at: 154 },
  { x: 540, y: 1010, at: 158 },
];

/** A ring tile counts once it has visibly mounted (2f into its spring). */
const COUNT_TICK = 2;

const T = {
  counterIn: 116,
  countLand: RING[RING.length - 1].at + COUNT_TICK, // 160 — 10th tile mounts
} as const;

// ---------------------------------------------------------------------------
// Tile faces — every identity is the REAL asset. The wordmarks share one
// optical system: ink height ≈ 53–54px (~44% of the 124 tile), ink centred
// (image offsets compensate for uneven source bearings, measured px-exact).
// ---------------------------------------------------------------------------

const cardBase = (w: number): React.CSSProperties => ({
  width: w,
  height: TILE_H,
  borderRadius: RADIUS,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: SHADOW,
});

const whiteCard = (w: number): React.CSSProperties => ({
  ...cardBase(w),
  background: C.card,
  border: `1.5px solid ${C.line}`,
});

const TileFace: React.FC<{ id: TileKey; w: number }> = ({ id, w }) => {
  switch (id) {
    case "pomelli":
      // Real cream-serif wordmark (542×190, pure-olive bg — the old pink
      // wedge and its local mask patch are gone). Image drawn at 0.48×
      // native inside an olive tile; +12.8px x-offset centres the INK
      // (source bearings are L21/R73), giving 15.5px symmetric bearings.
      return (
        <div
          style={{
            ...cardBase(w),
            background: BRAND.pomelli.bg,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Img
            src={staticFile(GT.logos.pomelliWordmark)}
            style={{
              position: "absolute",
              width: 262.4,
              height: 92,
              left: (w - 262.4) / 2 + 12.8,
              top: (TILE_H - 92) / 2,
            }}
          />
        </div>
      );
    case "stitch":
      // Real 512px Stitch app tile, downscaled to the square class.
      return (
        <StitchTile size={TILE_H} radius={RADIUS} style={{ boxShadow: SHADOW }} />
      );
    case "opal":
      // Real Opal wordmark, transparent-ink crop (293×136), ink ≈ 54px.
      return (
        <div style={whiteCard(w)}>
          <Img
            src={staticFile(OPAL_ALPHA)}
            style={{
              height: 61,
              display: "block",
              transform: "translateY(-1px)",
            }}
          />
        </div>
      );
    case "antigravity":
      // Real Antigravity arc mark (vector), on white — deliberately the
      // only tile without an EXPERIMENT badge (it is not a Labs app).
      return (
        <div style={whiteCard(w)}>
          <Img
            src={staticFile(GT.logos.antigravityMark)}
            style={{ width: 84, display: "block" }}
          />
        </div>
      );
    case "mixboard":
      // Real Mixboard wordmark on a FLAT lavender chip — no baked
      // screenshot, no gradient seam. The alpha crop carries a faint
      // (α 4–8%) dark wash + dot-grid residue across its rectangle, so an
      // SVG alpha gate (zero out α < ⅓) flattens everything but the ink.
      // Text ink bbox 405×72 @ (18…422, 14…85); scale 0.736 → ink 53px
      // (43% of tile), offsets centre it with ~16px symmetric bearings.
      return (
        <div
          style={{
            ...cardBase(w),
            background: BRAND.mixboard.lavender,
            border: `1.5px solid ${BRAND.mixboard.lavenderDeep}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <defs>
              <filter id="mixAlphaGate">
                <feComponentTransfer>
                  <feFuncA type="table" tableValues="0 0 1 1" />
                </feComponentTransfer>
              </filter>
            </defs>
          </svg>
          <Img
            src={staticFile(MIXBOARD_ALPHA)}
            style={{
              position: "absolute",
              width: 353.5,
              height: 81,
              left: (w - 353.5) / 2 + 14.7,
              top: (TILE_H - 81) / 2 + 4,
              filter: "url(#mixAlphaGate)",
            }}
          />
        </div>
      );
  }
};

// ---------------------------------------------------------------------------
// EXPERIMENT pill — the real Google Labs badge. ONE attachment rule for all
// four: centred on its tile, overlapping the tile's bottom edge by 6px, on
// one shared rail. Sized (h36 / 16px caps) so even the narrowest column
// (Stitch, 124 + gap) fully contains it — no neighbour collisions.
// ---------------------------------------------------------------------------

const PILL_H = 36;
const PILL_OVERLAP = 6;
const PILL_RAIL_Y = ROW_CY + TILE_H / 2 - PILL_OVERLAP;

const FlipPill: React.FC<{ cx: number; at: number }> = ({ cx, at }) => {
  const e = useEnter(at, SPRINGS.pop);
  if (e <= 0.001) return null;
  const rot = (1 - e) * -88;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: PILL_RAIL_Y,
        opacity: Math.min(1, 0.75 + 0.4 * e),
        transform: `translateX(-50%) perspective(700px) rotateX(${rot}deg)`,
        transformOrigin: "50% 0%",
      }}
    >
      <ExperimentPill
        height={PILL_H}
        style={{
          background: C.card,
          boxShadow: "0 10px 24px rgba(25,23,20,0.10)",
          fontSize: 16,
          letterSpacing: 0.8,
          padding: "0 12px",
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hero tile — spring drop-in. Cuts in at ≥75% opacity (no half-faded tiles
// next to settled siblings) and the entrance scale is capped at 1.0.
// ---------------------------------------------------------------------------

const HeroTile: React.FC<{ tile: (typeof TILES)[number] }> = ({ tile }) => {
  const e = useEnter(tile.at, SPRINGS.pop);
  const top = ROW_CY - TILE_H / 2; // one shared centerline, no offsets
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: tile.x,
          top,
          opacity: e <= 0.001 ? 0 : Math.min(1, 0.75 + 0.4 * e),
          transform: `translateY(${(1 - e) * 26}px) scale(${Math.min(
            1,
            0.9 + 0.1 * e,
          )})`,
          transformOrigin: "50% 100%",
        }}
      >
        <TileFace id={tile.key} w={tile.w} />
      </div>
      {tile.pillAt !== null ? (
        <FlipPill cx={tile.x + tile.w / 2} at={tile.pillAt} />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Ring tile — skeleton placeholder, deliberately NOT a real-tile lookalike:
// warm cream fill at 0.72 opacity, dashed ink outline, no card shadow, one
// locked size. Reads as "and ten more", not as broken images.
// ---------------------------------------------------------------------------

const RingTile: React.FC<{ spot: (typeof RING)[number]; phase: number }> = ({
  spot,
  phase,
}) => {
  const frame = useCurrentFrame();
  const e = useEnter(spot.at, SPRINGS.pop);
  if (e <= 0.001) return null;
  const f = 0.74 + 0.26 * e; // fan outward from 74% radius
  const x = 540 + (spot.x - 540) * f;
  const y =
    540 + (spot.y - 540) * f + Math.sin((frame - spot.at) / 13 + phase) * 1.5;
  return (
    <div
      style={{
        position: "absolute",
        left: x - RING_S / 2,
        top: y - RING_S / 2,
        width: RING_S,
        height: RING_S,
        borderRadius: 22,
        background: C.paperWarm,
        border: "1.6px dashed rgba(25,23,20,0.30)",
        opacity: 0.72,
        transform: `scale(${Math.min(1, 0.85 + 0.15 * e)})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: C.ink,
          opacity: 0.3,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Counter chip — G mark + mono digits, ONE resting style (white pill, thin
// line border, neutral shadow). The count is 5 + actually-mounted ring
// tiles, so it can never read ahead of the screen. Landing on 15: brief
// fill snap + Google-blue border/digit snap + small settle pop. NO glow.
// ---------------------------------------------------------------------------

const CounterChip: React.FC = () => {
  const frame = useCurrentFrame();
  const e = useEnter(T.counterIn, SPRINGS.pop);
  const mounted = RING.filter((s) => frame >= s.at + COUNT_TICK).length;
  const count = TILE_DEFS.length + mounted; // 5 → 15, honest by construction
  const accentP = interpolate(
    frame,
    [T.countLand - 1, T.countLand + 2],
    [0, 1],
    clamp,
  );
  const pulse = tri(frame, T.countLand, 4, 10); // settle pop, decays by f174
  const bg = interpolateColors(pulse, [0, 1], [C.card, "#ECF3FE"]);
  const border = interpolateColors(accentP, [0, 1], [C.line, GOOGLE.blue]);
  const num = interpolateColors(accentP, [0, 1], [C.ink, GOOGLE.blue]);
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 210,
        opacity: e <= 0.001 ? 0 : Math.min(1, 0.75 + 0.4 * e),
        transform: `translate(-50%, -50%) translateY(${(1 - e) * 24}px) scale(${
          1 + pulse * 0.06
        })`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 28px",
          borderRadius: 999,
          background: bg,
          border: `2px solid ${border}`,
          boxShadow: SHADOW,
        }}
      >
        <GoogleMark size={38} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 48,
            fontWeight: 700,
            color: num,
            letterSpacing: -1,
            lineHeight: 1,
            minWidth: 60,
            textAlign: "center",
            ...tabular,
          }}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP7FiveFree: React.FC = () => {
  // Tight on the first two landings → pull to the full row → long hold while
  // the badges flip → pull back for the ring + counter → settled end hold
  // (last two keys near-identical, 26f).
  const cam = useCam({
    keys: [0, 14, 34, 118, 142, 174, 200],
    fx: [165, 165, 540, 540, 540, 540, 540],
    fy: [540, 540, 540, 540, 540, 540, 540],
    z: [1.7, 1.7, 0.83, 0.83, 0.78, 0.78, 0.782],
  });

  return (
    <PaperWorld cam={cam}>
      {RING.map((spot, i) => (
        <RingTile key={i} spot={spot} phase={i * 1.7} />
      ))}
      {TILES.map((tile) => (
        <HeroTile key={tile.key} tile={tile} />
      ))}
      <CounterChip />
    </PaperWorld>
  );
};
