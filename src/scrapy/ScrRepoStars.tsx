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
  C,
  Chip,
  DISPLAY,
  FACTS,
  FONT,
  LogoImg,
  MONO,
  PaperWorld,
  SCRAPY,
  ScrapyMark,
  TEAL,
  fmt,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 200;

/* ---------------------------------------------------------------------------
 * ScrRepoStars — [0:05] REPO INTRO + PROOF (1080×1080)
 *
 * Same approved repo-card pattern as s2c/S2cRepoStars and openseo/SeoRepoStars,
 * re-skinned for scrapy/scrapy with the series TEAL accent. One continuous
 * world, one camera:
 *
 *   f0-24    macro on the real teal Scrapy mark, settling from a spring
 *   f24-46   camera pulls back (22f EASE); the mark becomes the avatar on a
 *            GitHub repo card that unfolds from the mark's own rect
 *   f46-64   hold — name / description / GitHub mark / star well assemble
 *   f54-118  the star counter races 0 → 63,707 (Easing.out landing);
 *            camera pushes onto the well f64-82 and holds through the land.
 *            NOTHING overlaps the number at its landing frame.
 *   f125-141 pull back to the full card; fork stat, contributors stat and
 *            the BSD-3-Clause chip pop staggered (f136 / f144 / f152)
 *   f165-200 clean hold, two near-identical camera keys
 * ------------------------------------------------------------------------- */

// --- Timeline ---------------------------------------------------------------
const T = {
  growStart: 30,
  growEnd: 46,
  nameIn: 38,
  ghIn: 41,
  descIn: 44,
  divIn: 47,
  wellIn: 47,
  countStart: 54,
  land: 118,
  forksIn: 136,
  contribIn: 144,
  chipIn: 152,
} as const;

// --- World geometry (camera z = 1 maps world 1:1 onto the 1080 canvas) ------
// Card is 880 wide (x 100..980) so the three-stat bottom row breathes; the
// push-in zoom is capped at 1.10 so the card edges stay inside the 54px
// side margins on every frame (540 - 440·z ≥ 54 ⇒ z ≤ 1.104).
const CARD = { x: 100, y: 140, w: 880, h: 800 };
const PAD = 54;
const IN_L = CARD.x + PAD; // 154
const IN_R = CARD.x + CARD.w - PAD; // 926
const IN_W = IN_R - IN_L; // 772

const AVA = { x: IN_L, y: 196, s: 150 };
const NAME_X = AVA.x + AVA.s + 28;
const DESC_Y = 380;
const DIV_Y = 506;
const WELL = { x: IN_L, y: 540, w: IN_W, h: 206 };
const ROW_Y = 782; // stat value line
const LABEL_DY = 58; // label offset under the value line
const CONTRIB_X = IN_L + 260; // second stat column

// --- Glyphs (same language as the approved repo-card comps) -----------------

const StarGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <path
      d="M12 1.7l3.09 6.26 6.91 1.0-5 4.87 1.18 6.88L12 17.46l-6.18 3.25L7 13.83l-5-4.87 6.91-1.0z"
      fill={color}
    />
  </svg>
);

const ForkGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
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

const PeopleGlyph: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
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
  enter: number;
  icon: React.ReactNode;
  value: string;
  label: string;
}> = ({ x, enter, icon, value, label }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: ROW_Y,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 18}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, height: 54 }}>
      {icon}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 48,
          fontWeight: 700,
          color: C.ink,
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
        top: LABEL_DY,
        fontFamily: FONT,
        fontSize: 36,
        fontWeight: 500,
        color: C.muted,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  </div>
);

// ---------------------------------------------------------------------------

export const ScrRepoStars: React.FC = () => {
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

  // --- Camera: hold → pull back → hold → push on well → hold → pull out ----
  const cam = useCam({
    keys: [0, 24, 46, 64, 82, 125, 141, 165, 200],
    fx: [229, 229, 540, 540, 540, 540, 540, 540, 540],
    fy: [271, 271, 540, 540, 584, 584, 540, 540, 540],
    z: [3.4, 3.28, 1, 1, 1.1, 1.1, 1, 1, 0.996],
  });

  // --- The teal mark settles from a spring ----------------------------------
  const markIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 1.1 },
  });
  const markRot = (1 - markIn) * -12;
  const markScale = 0.86 + 0.14 * markIn;

  // --- The mark's rect unfolds into the repo card ---------------------------
  // Interpolated (not sprung) and finishing as the camera settles, so the
  // card's on-screen width stays provably inside the 54px side margins for
  // every frame of the pull-back.
  const grow = interpolate(frame, [T.growStart, T.growEnd], [0, 1], ease);
  const cardX = interpolate(grow, [0, 1], [AVA.x, CARD.x]);
  const cardY = interpolate(grow, [0, 1], [AVA.y, CARD.y]);
  const cardW = interpolate(grow, [0, 1], [AVA.s, CARD.w]);
  const cardH = interpolate(grow, [0, 1], [AVA.s, CARD.h]);
  const cardR = interpolate(grow, [0, 1], [AVA.s * 0.5, 28]);

  const enter = (at: number, damping = 13, stiffness = 190) =>
    spring({ frame: frame - at, fps, config: { damping, stiffness } });

  const nameE = enter(T.nameIn);
  const ghE = enter(T.ghIn);
  const descE = enter(T.descIn);
  const divE = enter(T.divIn, 20, 150);
  const wellE = enter(T.wellIn, 14, 170);
  const forksE = enter(T.forksIn);
  const contribE = enter(T.contribIn);
  const chipE = enter(T.chipIn);

  // --- The star counter — races, then decelerates onto exactly 63,707 -------
  const rawCount = interpolate(
    frame,
    [T.countStart, T.land],
    [0, FACTS.stars],
    { easing: Easing.out(Easing.cubic), ...clamp },
  );
  const starText = fmt(rawCount); // lands on the exact "63,707"

  const popScale = interpolate(
    frame,
    [T.land - 1, T.land + 5, T.land + 20],
    [1, 1.09, 1],
    { easing: Easing.out(Easing.cubic), ...clamp },
  );
  const accentP = interpolate(frame, [T.land - 2, T.land + 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  // snap the ink→teal swap so the number never sits in a muddy mid-blend
  const inkToTeal = interpolate(frame, [T.land - 2, T.land + 3], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });
  const numberColor = interpolateColors(inkToTeal, [0, 1], [C.ink, TEAL]);
  // Opaque white-composites of TEAL_SOFT / TEAL_LINE so the ramp stays
  // monotonic (interpolating to the rgba values would animate alpha 1 → 0.1
  // and flash over-saturated mid-transition).
  const wellBg = interpolateColors(accentP, [0, 1], ["#FBF9F5", "#E8F8F6"]);
  const wellBorder = interpolateColors(accentP, [0, 1], [C.line, "#AFE7E1"]);

  return (
    <PaperWorld cam={cam}>
      {/* ------------------------------------------------------ the repo card */}
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          borderRadius: cardR,
          background: C.card,
          border: `1.5px solid rgba(229,222,211,${grow})`,
          boxShadow: `0 ${16 * grow}px ${38 * grow}px rgba(25,23,20,${0.07 * grow})`,
        }}
      />

      {/* repo name — scrapy / scrapy */}
      <div
        style={{
          position: "absolute",
          left: NAME_X,
          top: 221,
          opacity: nameE,
          transform: `translateY(${(1 - nameE) * 16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 38,
            fontWeight: 500,
            color: C.muted,
            lineHeight: 1.15,
            letterSpacing: -0.4,
          }}
        >
          {FACTS.owner} /
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 52,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            whiteSpace: "nowrap",
          }}
        >
          {FACTS.name}
        </div>
      </div>

      {/* GitHub ink mark, card corner */}
      <div
        style={{
          position: "absolute",
          left: IN_R - 58,
          top: 202,
          opacity: ghE * 0.9,
          transform: `scale(${0.7 + 0.3 * ghE})`,
        }}
      >
        <LogoImg src={SCRAPY.logos.github} size={58} />
      </div>

      {/* the repo's own description line */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: DESC_Y,
          width: IN_W,
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 500,
          color: C.muted,
          lineHeight: 1.35,
          letterSpacing: -0.3,
          opacity: descE,
          transform: `translateY(${(1 - descE) * 14}px)`,
        }}
      >
        {FACTS.description}
      </div>

      {/* divider */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: DIV_Y,
          width: IN_W * divE,
          height: 1.5,
          background: C.lineSoft,
        }}
      />

      {/* ------------------------------------------------------ star stat well */}
      <div
        style={{
          position: "absolute",
          left: WELL.x,
          top: WELL.y,
          width: WELL.w,
          height: WELL.h,
          boxSizing: "border-box",
          borderRadius: 26,
          background: wellBg,
          border: `${1.5 + 1.8 * accentP}px solid ${wellBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          opacity: wellE,
          transform: `translateY(${(1 - wellE) * 20}px)`,
        }}
      >
        <StarGlyph size={96} color={numberColor} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 140,
            fontWeight: 700,
            color: numberColor,
            letterSpacing: -2,
            lineHeight: 1,
            transform: `scale(${popScale})`,
            transformOrigin: "50% 50%",
            ...tabular,
          }}
        >
          {starText}
        </span>
      </div>

      {/* ------------------------------------------------------ stat row */}
      <StatBlock
        x={IN_L}
        enter={forksE}
        icon={<ForkGlyph size={44} color={C.ink} />}
        value={FACTS.forksLabel}
        label="Forks"
      />
      <StatBlock
        x={CONTRIB_X}
        enter={contribE}
        icon={<PeopleGlyph size={44} color={C.ink} />}
        value={FACTS.contributors}
        label="Contributors"
      />

      {/* BSD-3-Clause chip, right-anchored */}
      <div
        style={{
          position: "absolute",
          left: IN_R - 300,
          top: 800,
          width: 300,
          display: "flex",
          justifyContent: "flex-end",
          opacity: chipE,
          transform: `translateY(${(1 - chipE) * 18}px)`,
        }}
      >
        <Chip label={FACTS.license} size={30} />
      </div>

      {/* ------------------------------------------------------ the teal mark */}
      <div
        style={{
          position: "absolute",
          left: AVA.x,
          top: AVA.y,
          width: AVA.s,
          height: AVA.s,
          borderRadius: 999,
          transform: `rotate(${markRot}deg) scale(${markScale})`,
          transformOrigin: "50% 50%",
          boxShadow: "0 12px 30px rgba(25,23,20,0.16)",
        }}
      >
        <ScrapyMark size={AVA.s} />
      </div>
    </PaperWorld>
  );
};
