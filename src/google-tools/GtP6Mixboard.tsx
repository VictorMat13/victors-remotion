/**
 * GtP6Mixboard — beat 6 of the Google Tools series (PAPER + GOOGLE BLUE, 1080×1920).
 *
 * VO: "Fifth, Mixboard. Think Canva mixed with Pinterest. You generate images
 * and remix them on one board until it looks right." — the words stay in the
 * VO; on screen it is identity → the real board coming alive → a real remix
 * swap → the settled page-like board + the real "Get started" CTA.
 *
 *   f0–44    the real Canva tile (the PNG IS the tile) + the Pinterest circle
 *            (+6% optical) side by side, camera tight; both drift off as the
 *            camera departs
 *   f44–64   camera travels down; the big lavender dot-field board card lands
 *            and the REAL ink wordmark fades up DIRECTLY on the lavender —
 *            no chip, exactly like the product page
 *   f64–96   three alpha cutouts (pants, banana, cake) pop in scattered,
 *            floating straight on the wash with soft drop shadows — no white
 *            cards, each ≤1.0× its native pixels at every camera key
 *   f96–148  camera pushes to the cake; REMIX: purple selection ring (7px,
 *            white inner gap) + a 120px regenerate disc spinning once while a
 *            scan band sweeps and the cake CROSSFADES INTO THE PLATE — a
 *            genuinely different real shot, the honest remix
 *   f148–172 camera eases back over 24 frames; cutouts glide to the neat
 *            page-like layout (two up top, remixed plate bottom-center)
 *   f182     "Get started" pops in its own clear band (real button purple
 *            #8C76D9, absolutely positioned — mounting cannot reflow anything)
 *   f172–229 clean end hold; final camera keys identical
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
  BRAND,
  C,
  DISPLAY,
  EASE,
  GT,
  PaperWorld,
  SPRINGS,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 230;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The real "Get started" button purple, sampled from the live page. */
const MIX_PURPLE = "#8C76D9";
/** Real page glyphs with the lavender knocked out — plain ink, 480×110. */
const WORDMARK_ALPHA = "google-tools/logos/mixboard-wordmark-alpha.png";
/** Neutral-cool shadow for chrome (disc) sitting on the lavender. */
const BOARD_SHADOW = "0 14px 30px rgba(45,48,110,0.13)";
/** Soft drop shadow that hugs the cutouts' alpha, like the real page. */
const CUT_SHADOW = "drop-shadow(0 10px 14px rgba(45,48,110,0.28))";

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

const T = {
  canva: 2,
  pinterest: 7,
  chipsOut: 42, // identity marks drift off as the camera departs
  board: 52, // lavender board lands mid-travel
  wordmark: 60, // ink wordmark fades up on the lavender
  ringA: 112, // selection ring in
  disc: 114, // regenerate disc pops
  spinA: 118, // …spins once 118 → 138
  spinB: 138,
  scanA: 120, // scan band sweeps 120 → 136 (linear scanner)
  scanB: 136,
  swapA: 126, // crossfade cake → plate 126 → 138
  swapB: 138,
  discOut: 140,
  ringOutA: 144,
  ringOutB: 152,
  pill: 182, // real CTA string pops in its own band
};

// ---------------------------------------------------------------------------
// World geometry. Final camera is fx 540 / fy 950 / z 1, so world coords read
// as end-frame screen coords. Board content is in BOARD-LOCAL coords.
// ---------------------------------------------------------------------------

const BOARD = { x: 110, y: 470, w: 860, h: 1120 };

// Shared cutout system: every shot renders at 0.9× native, centered on its
// anchor, no cards, no clipping. 0.9 × the remix camera's z 1.10 = 0.99, so
// nothing EVER displays above 1.0× native pixels. Natives: banana 252×252,
// cake 238×219, pants 143×253, plate 162×162.
const CUT_SCALE = 0.9;

type CutDef = {
  w: number;
  h: number;
  scatter: { x: number; y: number; rot: number };
  end: { x: number; y: number };
  popAt: number;
  settleAt: number;
  phase: number;
};

const CUTS: Record<"pants" | "banana" | "cake" | "plate", CutDef> = {
  pants: {
    w: Math.round(143 * CUT_SCALE), // 129
    h: Math.round(253 * CUT_SCALE), // 228
    scatter: { x: 170, y: 175, rot: 6 },
    end: { x: 190, y: 190 },
    popAt: 68,
    settleAt: 152,
    phase: 3,
  },
  banana: {
    w: Math.round(252 * CUT_SCALE), // 227
    h: Math.round(252 * CUT_SCALE), // 227
    scatter: { x: 685, y: 175, rot: -7 },
    end: { x: 670, y: 190 },
    popAt: 75,
    settleAt: 155,
    phase: 9,
  },
  cake: {
    w: Math.round(238 * CUT_SCALE), // 214
    h: Math.round(219 * CUT_SCALE), // 197
    scatter: { x: 400, y: 840, rot: -5 },
    end: { x: 430, y: 780 },
    popAt: 82,
    settleAt: 158,
    phase: 15,
  },
  // The plate arrives as the REMIX RESULT of the cake (sizes only used).
  plate: {
    w: Math.round(162 * CUT_SCALE), // 146
    h: Math.round(162 * CUT_SCALE), // 146
    scatter: { x: 0, y: 0, rot: 0 },
    end: { x: 0, y: 0 },
    popAt: 0,
    settleAt: 0,
    phase: 0,
  },
};

const SETTLE_LEN = 20;
/** Selection-ring padding around the remixed cutout's bounding box. */
const RING_PAD = 22;

// ---------------------------------------------------------------------------
// Identity marks — Canva tile + Pinterest circle (marks only, no words)
// ---------------------------------------------------------------------------

const IdMark: React.FC<{
  enterAt: number;
  fromX: number;
  x: number;
  phase: number;
  children: React.ReactNode;
}> = ({ enterAt, fromX, x, phase, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const out = interpolate(frame, [T.chipsOut, T.chipsOut + 14], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  if (frame < enterAt || out >= 0.995) return null;
  const bobY = Math.sin((frame + phase) / 11) * 2.2 * (1 - out) * e;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 285 + bobY,
        transform: `translate(-50%, -50%) translateX(${fromX * (1 - e)}px) translateY(${
          -30 * out
        }px) scale(${(0.9 + 0.1 * Math.min(1, e)) * (1 - 0.12 * out)})`,
        opacity: Math.min(1, e * 2.2) * (1 - out),
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// The lavender board card — fine 12px dot field like the real page
// ---------------------------------------------------------------------------

const Board: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.board) return null;
  const e = spring({
    frame: frame - T.board,
    fps,
    config: { damping: 17, stiffness: 120, mass: 1.1 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: BOARD.x,
        top: BOARD.y,
        width: BOARD.w,
        height: BOARD.h,
        borderRadius: 40,
        background: `linear-gradient(115deg, #E9E1FC 0%, ${BRAND.mixboard.lavender} 55%, #DEE7FE 100%)`,
        border: `1.5px solid ${BRAND.mixboard.lavenderDeep}`,
        boxShadow: "0 20px 46px rgba(25,23,20,0.08)",
        overflow: "hidden",
        opacity: Math.min(1, e * 1.9),
        transform: `translateY(${46 * (1 - e)}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(99,104,150,0.13) 1px, transparent 1.5px)",
          backgroundSize: "12px 12px",
          backgroundPosition: "5px 6px",
        }}
      />
      {children}
    </div>
  );
};

/** The real Mixboard glyphs as plain ink, straight on the lavender wash. */
const BoardWordmark: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.wordmark) return null;
  const t = interpolate(frame, [T.wordmark, T.wordmark + 16], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  // 432 = 0.9× the 480px native crop → stays ≤1.0× under the z 1.10 push-in.
  // The knockout crop carries a ~5% ink wash + the page's own dot grid at
  // ~15–25% alpha across the full rectangle; the feFuncA curve zeroes all
  // alpha below ~1/3 so ONLY the solid ink glyphs survive on the lavender.
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="wm-alpha-clean">
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 1 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Img
        src={staticFile(WORDMARK_ALPHA)}
        style={{
          position: "absolute",
          left: 430 - 216,
          top: 330 + 18 * (1 - t),
          width: 432,
          display: "block",
          opacity: t,
          filter: "url(#wm-alpha-clean)",
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Floating alpha cutouts — no cards, soft shadows, shared spacing system
// ---------------------------------------------------------------------------

const Cutout: React.FC<{ def: CutDef; children: React.ReactNode }> = ({
  def,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < def.popAt) return null;
  const pop = spring({ frame: frame - def.popAt, fps, config: SPRINGS.pop });
  const sp = interpolate(
    frame,
    [def.settleAt, def.settleAt + SETTLE_LEN],
    [0, 1],
    { easing: EASE, ...CLAMP },
  );
  const bob = 1 - sp;
  const y =
    lerp(def.scatter.y, def.end.y, sp) +
    Math.sin((frame + def.phase) / 11) * 2.4 * bob;
  const rot =
    def.scatter.rot * (1 - sp) + Math.sin((frame + def.phase) / 14) * 0.7 * bob;
  return (
    <div
      style={{
        position: "absolute",
        left: lerp(def.scatter.x, def.end.x, sp),
        top: y,
        width: def.w,
        height: def.h,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${
          0.6 + 0.4 * Math.min(1, pop)
        })`,
        opacity: Math.min(1, pop * 2.4),
      }}
    >
      {children}
    </div>
  );
};

const CutImg: React.FC<{ src: string; w: number; h: number }> = ({
  src,
  w,
  h,
}) => (
  <Img
    src={staticFile(src)}
    style={{ width: w, height: h, display: "block", filter: CUT_SHADOW }}
  />
);

/**
 * The remix spot: cake crossfades into the PLATE (a genuinely different real
 * shot) under the scan band, inside a 7px #8C76D9 selection ring with a white
 * inner gap. Fills the cake-sized Cutout wrapper.
 */
const RemixContent: React.FC = () => {
  const frame = useCurrentFrame();
  const w = CUTS.cake.w;
  const h = CUTS.cake.h;
  const swap = interpolate(frame, [T.swapA, T.swapB], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const dip = interpolate(frame, [118, 128, 136, 144], [1, 0.96, 0.96, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const ringO = interpolate(
    frame,
    [T.ringA, T.ringA + 6, T.ringOutA, T.ringOutB],
    [0, 1, 1, 0],
    CLAMP,
  );
  const scanT = interpolate(frame, [T.scanA, T.scanB], [0, 1], CLAMP);
  const scanO = interpolate(
    frame,
    [T.scanA, T.scanA + 4, T.scanB - 4, T.scanB],
    [0, 1, 1, 0],
    CLAMP,
  );
  const rectW = w + RING_PAD * 2;
  const rectH = h + RING_PAD * 2;
  const bandY = -110 + scanT * (rectH + 220);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${dip})` }}>
        <Img
          src={staticFile(GT.shots.mixCake)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: w,
            height: h,
            opacity: 1 - swap,
            filter: CUT_SHADOW,
          }}
        />
        {swap > 0.001 ? (
          <Img
            src={staticFile(GT.shots.mixPlate)}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: CUTS.plate.w,
              height: CUTS.plate.h,
              transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * swap})`,
              opacity: swap,
              filter: CUT_SHADOW,
            }}
          />
        ) : null}
      </div>
      {scanO > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: -RING_PAD,
            top: -RING_PAD,
            width: rectW,
            height: rectH,
            borderRadius: 24,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: bandY - 96,
              width: "100%",
              height: 96,
              background:
                "linear-gradient(180deg, rgba(140,118,217,0) 0%, rgba(140,118,217,0.26) 78%, rgba(140,118,217,0.07) 100%)",
              opacity: scanO,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: bandY,
              width: "100%",
              height: 3.5,
              background: MIX_PURPLE,
              opacity: scanO,
            }}
          />
        </div>
      ) : null}
      {ringO > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: -RING_PAD,
            top: -RING_PAD,
            width: rectW,
            height: rectH,
            borderRadius: 24,
            // 4px white inner gap, then the 7px brand-purple selection ring.
            boxShadow: `0 0 0 4px #FFFFFF, 0 0 0 11px ${MIX_PURPLE}`,
            opacity: ringO,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Regenerate disc — 120px, 56px glyph, spins once above the remix spot
// ---------------------------------------------------------------------------

const RegenDisc: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.disc) return null;
  const pop = spring({ frame: frame - T.disc, fps, config: SPRINGS.bouncy });
  const out = interpolate(frame, [T.discOut, T.discOut + 8], [1, 0], CLAMP);
  if (out <= 0.01) return null;
  const rot = interpolate(frame, [T.spinA, T.spinB], [0, 360], {
    easing: EASE,
    ...CLAMP,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 400 - 60,
        top: 632 - 60,
        width: 120,
        height: 120,
        borderRadius: 999,
        background: C.card,
        border: `1.5px solid ${BRAND.mixboard.lavenderDeep}`,
        boxShadow: BOARD_SHADOW,
        display: "grid",
        placeItems: "center",
        transform: `scale(${(0.5 + 0.5 * pop) * (0.6 + 0.4 * out)})`,
        opacity: Math.min(1, pop * 2) * out,
      }}
    >
      <svg
        width={56}
        height={56}
        viewBox="0 0 48 48"
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <circle
          cx={24}
          cy={24}
          r={16}
          fill="none"
          stroke={MIX_PURPLE}
          strokeWidth={4.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.82 1"
          transform="rotate(-90 24 24)"
        />
        <path
          d="M 0 -6.5 L 10.5 0 L 0 6.5 Z"
          fill={MIX_PURPLE}
          transform="translate(9.52 17.19) rotate(-64.8)"
        />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The real CTA — "Get started" (real UI string), its own absolute layer in
// WORLD coords over the board, so mounting can never reflow the cutouts.
// Real button purple #8C76D9, ~20px cap height, real-button proportions.
// ---------------------------------------------------------------------------

const GetStartedPill: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.pill) return null;
  const pop = spring({ frame: frame - T.pill, fps, config: SPRINGS.bouncy });
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 1030,
        height: 84,
        borderRadius: 999,
        background: MIX_PURPLE,
        boxShadow: "0 12px 26px rgba(45,48,110,0.20)",
        display: "flex",
        alignItems: "center",
        padding: "0 80px",
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * pop})`,
        opacity: Math.min(1, pop * 2),
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: 28,
        color: "#FFFFFF",
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      Get started
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP6Mixboard: React.FC = () => {
  // Tight on the identity marks → travel down to the board → push in for the
  // remix → 24-frame ease back out to the settled board; the final camera
  // keys are identical. z never exceeds 1.10, so 0.9×-native art stays ≤1.0×.
  const cam = useCam({
    keys: [0, 44, 64, 96, 112, 148, 172, 204, 229],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [295, 295, 950, 950, 1120, 1120, 950, 950, 950],
    z: [1.45, 1.45, 1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 1.0],
  });

  return (
    <PaperWorld cam={cam}>
      {/* Canva's PNG is the tile itself — own radius, series shadow. 122px
          world × the z 1.45 intro camera = 177px ≤ the 180px native. */}
      <IdMark enterAt={T.canva} fromX={-140} x={430} phase={2}>
        <Img
          src={staticFile(GT.logos.canva)}
          style={{
            width: 122,
            height: 122,
            borderRadius: 27,
            display: "block",
            boxShadow: "0 16px 38px rgba(25,23,20,0.10)",
          }}
        />
      </IdMark>
      {/* Pinterest circle at +6% of the Canva square for equal optical weight. */}
      <IdMark enterAt={T.pinterest} fromX={140} x={650} phase={8}>
        <div
          style={{
            width: 129,
            height: 129,
            borderRadius: 999,
            background: C.card,
            border: `1.5px solid ${C.line}`,
            boxShadow: "0 16px 38px rgba(25,23,20,0.10)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Img
            src={staticFile(GT.logos.pinterest)}
            style={{ width: 78, height: 78, display: "block" }}
          />
        </div>
      </IdMark>

      <Board>
        <BoardWordmark />
        <Cutout def={CUTS.pants}>
          <CutImg src={GT.shots.mixPants} w={CUTS.pants.w} h={CUTS.pants.h} />
        </Cutout>
        <Cutout def={CUTS.banana}>
          <CutImg src={GT.shots.mixBanana} w={CUTS.banana.w} h={CUTS.banana.h} />
        </Cutout>
        <Cutout def={CUTS.cake}>
          <RemixContent />
        </Cutout>
        <RegenDisc />
      </Board>

      <GetStartedPill />
    </PaperWorld>
  );
};
