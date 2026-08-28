import React from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  G,
  GA,
  GChip,
  GLogo,
  GraphWorld,
  GraphifyMark,
  FONT,
  fmt,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 160;

/* ---------------------------------------------------------------------------
 * GfxRepoStars — [0:06-0:11] REPO INTRO + PROOF
 * "It's called Graphify, and it's almost at 100k GitHub stars."
 *
 * Dark sibling of the approved `src/openseo/SeoRepoStars.tsx`: same card
 * structure, same camera shape, same counter treatment — retimed to 160f and
 * recoloured onto the Graphify dark palette.
 *
 * One world, one camera:
 *   f0-40    macro on Graphify's real mark, settling from a spring
 *   f40-62   camera pulls back; the tile unfolds into the GitHub repo card
 *   f62-86   card assembles (name / description / star chip / stats / license)
 *   f86-104  camera pushes in on the star stat
 *   f104-132 the counter races and lands on 100k — accent green + pop
 *   f132-148 camera pulls back to the settled card
 *   f148-160 clean hold, two near-identical keys for the editor's cut
 * ------------------------------------------------------------------------- */

// --- Timeline ---------------------------------------------------------------
const T = {
  growStart: 48,
  growEnd: 60,
  nameIn: 54,
  descIn: 56,
  divIn: 58,
  starIn: 62,
  // Stats and the license chip arrive together with the rest of the card, so
  // the card's foot is never a blank band waiting for content.
  statsIn: 64,
  licenseIn: 66,
  countStart: 60,
  land: 122,
} as const;

// --- World geometry ---------------------------------------------------------
// Card is 820 wide so that even at the tightest camera key (z = 1.15) its
// on-screen width is 943px — 68.5 .. 1011.5 — inside the 54px side margins.
const CARD = { x: 130, y: 300, w: 820, h: 1070 };
const PAD = 54;
const IN_L = CARD.x + PAD; // 184
const IN_R = CARD.x + CARD.w - PAD; // 896
const IN_W = IN_R - IN_L; // 712

const AVA = { x: IN_L, y: 354, s: 168 };
const AVA_CX = AVA.x + AVA.s / 2; // 268
const AVA_CY = AVA.y + AVA.s / 2; // 438

const NAME_X = AVA.x + AVA.s + 34; // 386
const DESC_Y = 560;
// The description renders as three 54.4px lines, ending at y=723.
const DIV_Y = 772;

const STAR = { x: IN_L, y: 810, w: IN_W, h: 204 };
const STAR_CX = STAR.x + STAR.w / 2; // 540
const STAR_CY = STAR.y + STAR.h / 2; // 912

const ROW_Y = 1068; // stat row — icon + number
const LABEL_Y = 1140; // stat row — label under the number
const LICENSE_Y = 1234;

const CARD_CY = CARD.y + CARD.h / 2; // 835

const STARS_TARGET = 100000;

// --- Burst geometry ---------------------------------------------------------
// Half-extents of the landed "★ 100k" lockup in world coords around
// (STAR_CX, STAR_CY), including the 1.12x landing pop. Every burst star begins
// its travel just OUTSIDE this box, so no glyph is ever drawn over the digits.
const NUM_HX = 250;
const NUM_HY = 76;
const BURST_CLEAR = 10; // extra px between the box and a star's nearest edge
const BURST_FLAT = 0.5; // vertical flattening — keeps the burst hugging the chip
// The divider sits at y=772 and the stat row starts at y=1068, so the burst's
// vertical spread is soft-capped to stay inside the chip's own band.
const BURST_Y_KNEE = 96;
const BURST_Y_CAP = 108;

/** Identity up to `knee`, then eases asymptotically onto `cap`. */
const capSpread = (v: number) => {
  const m = Math.abs(v);
  if (m <= BURST_Y_KNEE) return v;
  const range = BURST_Y_CAP - BURST_Y_KNEE;
  return (
    Math.sign(v) *
    (BURST_Y_KNEE + range * (1 - Math.exp(-(m - BURST_Y_KNEE) / range)))
  );
};

// --- Glyphs -----------------------------------------------------------------

const StarGlyph: React.FC<{ size: number; color: string; opacity?: number }> = ({
  size,
  color,
  opacity = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block", opacity, overflow: "visible" }}
  >
    <path
      d="M12 1.7l3.09 6.26 6.91 1.0-5 4.87 1.18 6.88L12 17.46l-6.18 3.25L7 13.83l-5-4.87 6.91-1.0z"
      fill={color}
    />
  </svg>
);

const ForkGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.1}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <circle cx="6" cy="4.6" r="2.4" />
    <circle cx="18" cy="4.6" r="2.4" />
    <circle cx="12" cy="19.4" r="2.4" />
    <path d="M6 7v1.5a3.2 3.2 0 003.2 3.2h5.6A3.2 3.2 0 0018 8.5V7" />
    <path d="M12 11.7v5.3" />
  </svg>
);

const PeopleGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2.1}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <circle cx="9" cy="7.4" r="3.3" />
    <path d="M2.9 20c0-3.5 2.7-5.9 6.1-5.9S15.1 16.5 15.1 20" />
    <path d="M16.4 5.1a3.3 3.3 0 010 4.9" />
    <path d="M18.2 15c1.9.9 3 2.6 3 5" />
  </svg>
);

// --- Secondary stat (icon + number over a label) -----------------------------

const StatBlock: React.FC<{
  x: number;
  icon: React.ReactNode;
  value: string;
  label: string;
  enter: number;
}> = ({ x, icon, value, label, enter }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: ROW_Y,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 18}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 62 }}>
      {icon}
      <span
        style={{
          fontFamily: FONT,
          fontSize: 58,
          fontWeight: 800,
          color: G.text,
          letterSpacing: -1,
          lineHeight: 1,
          ...tabular,
        }}
      >
        {value}
      </span>
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: LABEL_Y - ROW_Y,
        fontFamily: FONT,
        fontSize: 42,
        fontWeight: 500,
        color: G.muted,
        whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  </div>
);

// ---------------------------------------------------------------------------

export const GfxRepoStars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ease = {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  // --- Camera: one continuous move through the world ------------------------
  // hold (0-40) -> pull back (40-62) -> hold (62-86) -> push in (86-104)
  // -> hold (104-132) -> pull back (132-148) -> hold (148-160)
  const cam = useCam({
    keys: [0, 24, 40, 62, 86, 104, 132, 148, 160],
    fx: [AVA_CX, AVA_CX, AVA_CX, 540, 540, 540, 540, 540, 540],
    fy: [
      AVA_CY,
      AVA_CY,
      AVA_CY,
      CARD_CY,
      CARD_CY,
      STAR_CY,
      STAR_CY,
      CARD_CY,
      CARD_CY,
    ],
    z: [3.3, 3.24, 3.2, 0.9, 0.9, 1.15, 1.15, 0.899, 0.897],
  });

  // --- The mark settles from a spring ---------------------------------------
  const tileIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 1.1 },
  });
  const tileRot = (1 - tileIn) * -12;
  const tileScale = 0.85 + 0.15 * tileIn;

  // --- The tile unfolds into the repo card ----------------------------------
  // Interpolated (not sprung) so the card's on-screen width stays provably
  // inside the 54px side margins while the camera is still pulled in tight.
  const grow = interpolate(frame, [T.growStart, T.growEnd], [0, 1], ease);
  const cardX = interpolate(grow, [0, 1], [AVA.x, CARD.x]);
  const cardY = interpolate(grow, [0, 1], [AVA.y, CARD.y]);
  const cardW = interpolate(grow, [0, 1], [AVA.s, CARD.w]);
  const cardH = interpolate(grow, [0, 1], [AVA.s, CARD.h]);
  const cardR = interpolate(grow, [0, 1], [AVA.s * 0.22, 30]);

  const enter = (at: number, damping = 13, stiffness = 190) =>
    spring({ frame: frame - at, fps, config: { damping, stiffness } });

  const nameE = enter(T.nameIn);
  const descE = enter(T.descIn);
  const divE = enter(T.divIn, 20, 150);
  const starE = enter(T.starIn, 14, 170);
  const statsE = enter(T.statsIn);
  const licenseE = enter(T.licenseIn, 15, 170);

  // --- The star counter -----------------------------------------------------
  // inOut cubic: peak velocity sits right under the camera push, so the RACE is
  // the hero motion, then it decelerates into 100k — "almost at 100k".
  const rawCount = interpolate(
    frame,
    [T.countStart, T.land],
    [0, STARS_TARGET],
    { easing: Easing.inOut(Easing.cubic), ...clamp },
  );
  const landed = frame >= T.land;
  // GitHub renders this exact string on the repo's own social card.
  const starText = landed ? "100k" : fmt(rawCount);

  const popScale = interpolate(
    frame,
    [T.land - 1, T.land + 5, T.land + 18],
    [1, 1.12, 1],
    { easing: Easing.out(Easing.cubic), ...clamp },
  );
  // starts two frames early so the chip is already warm on the landing frame
  const accentP = interpolate(frame, [T.land - 2, T.land + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  // snap the text->accent swap so the number never sits in a muddy mid-blend
  const textToAccent = interpolate(frame, [T.land - 2, T.land + 3], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });
  const numberColor = interpolateColors(textToAccent, [0, 1], [G.text, G.accent]);
  // Opaque accent wash over the card value — a fill, never a glow.
  const chipBg = interpolateColors(accentP, [0, 1], [G.cardHi, "#2D4436"]);
  const chipBorder = interpolateColors(accentP, [0, 1], ["#3A443C", G.accent]);

  // --- Frame-driven star burst ----------------------------------------------
  const burstP = interpolate(frame, [T.land, T.land + 26], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const burstOn = frame >= T.land && burstP < 1;
  // 4-frame ramp so the stars fade up while still close to the digits instead
  // of popping in at full strength.
  const burstFade = interpolate(frame, [T.land, T.land + 4], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });

  return (
    <GraphWorld cam={cam}>
      {/* ------------------------------------------------------ the repo card */}
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          borderRadius: cardR,
          background: G.card,
          border: `1.5px solid rgba(255,255,255,${0.09 * grow})`,
        }}
      />

      {/* repo name — Graphify-Labs / graphify */}
      <div
        style={{
          position: "absolute",
          left: NAME_X,
          top: 368,
          opacity: nameE,
          transform: `translateY(${(1 - nameE) * 16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 500,
            color: G.muted,
            lineHeight: 1.1,
            letterSpacing: -0.4,
          }}
        >
          Graphify-Labs /
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 78,
            fontWeight: 800,
            color: G.text,
            lineHeight: 1.06,
            letterSpacing: -2.2,
          }}
        >
          graphify
        </div>
      </div>

      {/* GitHub mark, card corner — light variant, correct for dark */}
      <div
        style={{
          position: "absolute",
          left: IN_R - 62,
          top: 366,
          opacity: nameE * 0.92,
          transform: `scale(${0.7 + 0.3 * nameE})`,
        }}
      >
        <GLogo src={GA.logo.github} size={62} />
      </div>

      {/* the repo's own description, exactly as GitHub renders it */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: DESC_Y,
          width: IN_W,
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 500,
          color: G.muted,
          lineHeight: 1.36,
          letterSpacing: -0.4,
          opacity: descE,
          transform: `translateY(${(1 - descE) * 14}px)`,
        }}
      >
        Turn any codebase, with its docs, SQL schemas, configs, and PDFs, into a
        queryable knowledge graph.
      </div>

      {/* divider */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: DIV_Y,
          width: IN_W * divE,
          height: 1.5,
          background: G.line,
        }}
      />

      {/* ------------------------------------------------------ star stat */}
      <div
        style={{
          position: "absolute",
          left: STAR.x,
          top: STAR.y,
          width: STAR.w,
          height: STAR.h,
          borderRadius: 28,
          background: chipBg,
          border: `${1.5 + 1.7 * accentP}px solid ${chipBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          opacity: starE,
          transform: `translateY(${(1 - starE) * 20}px)`,
        }}
      >
        <StarGlyph size={96} color={numberColor} />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 150,
            fontWeight: 800,
            color: numberColor,
            letterSpacing: -4,
            lineHeight: 1,
            transform: `scale(${popScale})`,
            transformOrigin: "50% 50%",
            ...tabular,
          }}
        >
          {starText}
        </span>
      </div>

      {/* ------------------------------------------------------ secondary stats */}
      <StatBlock
        x={IN_L}
        icon={<ForkGlyph size={46} color={G.text} />}
        value="10k"
        label="Forks"
        enter={statsE}
      />
      <StatBlock
        x={IN_L + 214}
        icon={<PeopleGlyph size={46} color={G.text} />}
        value="202"
        label="Contributors"
        enter={statsE}
      />
      <GChip
        label="Apache-2.0 · MIT"
        size={38}
        style={{
          position: "absolute",
          left: IN_L,
          top: LICENSE_Y,
          opacity: licenseE,
          transform: `translateY(${(1 - licenseE) * 18}px)`,
        }}
      />

      {/* --------------------------------------------- the real Graphify mark */}
      <div
        style={{
          position: "absolute",
          left: AVA.x,
          top: AVA.y,
          width: AVA.s,
          height: AVA.s,
          transform: `rotate(${tileRot}deg) scale(${tileScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <GraphifyMark size={AVA.s} />
      </div>

      {/* ------------------------------------------------------ star burst */}
      {burstOn &&
        Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2 + (i % 2 === 0 ? 0.16 : -0.16);
          const ca = Math.cos(angle);
          const sa = Math.sin(angle);
          // Capped so the outermost star (exitX 275 + reach) stays inside the
          // card's own half-width of 410 — nothing strays toward the margins.
          const reach = 84 + (i % 3) * 24;
          const size = (28 + (i % 3) * 10) * (1.2 - 0.62 * burstP);
          // Ray/box exit: the smallest radius at which this direction clears the
          // number's bounding box on either axis, with the glyph's own half-size
          // folded in so its EDGE — not just its centre — starts outside.
          const pad = BURST_CLEAR + size / 2;
          const exitX =
            Math.abs(ca) > 1e-3 ? (NUM_HX + pad) / Math.abs(ca) : Infinity;
          const exitY =
            Math.abs(sa) > 1e-3
              ? (NUM_HY + pad) / (BURST_FLAT * Math.abs(sa))
              : Infinity;
          const r = Math.min(exitX, exitY) + burstP * reach;
          const dx = ca * r;
          const dy = capSpread(sa * r * BURST_FLAT);
          const o =
            burstFade * interpolate(burstP, [0, 0.6, 1], [1, 0.72, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: STAR_CX + dx - size / 2,
                top: STAR_CY + dy - size / 2,
                transform: `rotate(${burstP * 90 * (i % 2 === 0 ? 1 : -1)}deg)`,
              }}
            >
              <StarGlyph size={size} color={G.accent} opacity={o} />
            </div>
          );
        })}
    </GraphWorld>
  );
};
