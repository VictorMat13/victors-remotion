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
  S2C,
  S2cMark,
  fmt,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 170;

/* ---------------------------------------------------------------------------
 * S2cRepoStars — [0:06] REPO INTRO + PROOF (1080×1080)
 *
 * Same approved repo-card pattern as openseo/SeoRepoStars, re-skinned for
 * abi/screenshot-to-code. One continuous world, one camera:
 *
 *   f0-24    macro on the real `//` app tile, settling from a spring
 *   f24-42   camera pulls back (18f); the tile becomes the avatar on a
 *            GitHub repo card that unfolds from the tile's own rect
 *   f42-62   hold — name / description / GitHub mark / star well assemble
 *   f54-109  the star counter races 0 → 73,889 (Easing.out landing);
 *            camera pushes onto the well f62-80 and holds through the land.
 *            NOTHING overlaps the number at its landing frame.
 *   f116-132 pull back to the full card; fork stat + MIT chip pop staggered
 *   f148-170 clean hold, two near-identical camera keys
 * ------------------------------------------------------------------------- */

// --- Accent tint ------------------------------------------------------------
// Derived from the kit accent so the clip follows a palette change. Opaque
// wash only — this series allows no coloured shadows and no glow.
const [AR, AG, AB] = (C.orange.match(/\w\w/g) ?? ["00", "00", "00"]).map((h) =>
  parseInt(h, 16),
);
const accentWash = (a: number) => {
  const mix = (c: number) => Math.round(255 - a * (255 - c));
  return `rgb(${mix(AR)},${mix(AG)},${mix(AB)})`;
};

// --- Timeline ---------------------------------------------------------------
const T = {
  growStart: 30,
  growEnd: 44,
  nameIn: 37,
  ghIn: 39,
  descIn: 41,
  divIn: 45,
  wellIn: 45,
  countStart: 52,
  land: 109,
  forksIn: 132,
  mitIn: 139,
} as const;

// --- World geometry (camera z = 1 maps world 1:1 onto the 1080 canvas) ------
const CARD = { x: 120, y: 140, w: 840, h: 800 };
const PAD = 56;
const IN_L = CARD.x + PAD; // 176
const IN_R = CARD.x + CARD.w - PAD; // 904
const IN_W = IN_R - IN_L; // 728

const AVA = { x: IN_L, y: 196, s: 150 };
const NAME_X = AVA.x + AVA.s + 28;
const DESC_Y = 380;
const DIV_Y = 506;
const WELL = { x: IN_L, y: 540, w: IN_W, h: 206 };
const ROW_Y = 782; // fork stat value line
const LABEL_DY = 58; // label offset under the value line

// The repo description, with the stack parenthetical kept on one line so the
// paragraph wraps to a clean two lines instead of breaking at the slashes.
const [DESC_HEAD, DESC_PAREN] = FACTS.description.split(" (");

// --- Glyphs -----------------------------------------------------------------

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

// ---------------------------------------------------------------------------

export const S2cRepoStars: React.FC = () => {
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
    keys: [0, 24, 42, 62, 80, 116, 132, 148, 170],
    fx: [251, 251, 540, 540, 540, 540, 540, 540, 540],
    fy: [271, 271, 540, 540, 580, 580, 540, 540, 540],
    z: [3.38, 3.26, 1, 1, 1.14, 1.14, 1, 1, 0.996],
  });

  // --- The `//` tile settles from a spring ----------------------------------
  const markIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 1.1 },
  });
  const markRot = (1 - markIn) * -12;
  const markScale = 0.86 + 0.14 * markIn;

  // --- The tile unfolds into the repo card ----------------------------------
  // Interpolated (not sprung) and finishing after the camera settles, so the
  // card's on-screen width stays provably inside the 54px side margins for
  // every frame of the pull-back.
  const grow = interpolate(frame, [T.growStart, T.growEnd], [0, 1], ease);
  const cardX = interpolate(grow, [0, 1], [AVA.x, CARD.x]);
  const cardY = interpolate(grow, [0, 1], [AVA.y, CARD.y]);
  const cardW = interpolate(grow, [0, 1], [AVA.s, CARD.w]);
  const cardH = interpolate(grow, [0, 1], [AVA.s, CARD.h]);
  const cardR = interpolate(grow, [0, 1], [AVA.s * 0.18, 28]);

  const enter = (at: number, damping = 13, stiffness = 190) =>
    spring({ frame: frame - at, fps, config: { damping, stiffness } });

  const nameE = enter(T.nameIn);
  const ghE = enter(T.ghIn);
  const descE = enter(T.descIn);
  const divE = enter(T.divIn, 20, 150);
  const wellE = enter(T.wellIn, 14, 170);
  const forksE = enter(T.forksIn);
  const mitE = enter(T.mitIn);

  // --- The star counter — races, then decelerates onto exactly 73,889 -------
  const rawCount = interpolate(
    frame,
    [T.countStart, T.land],
    [0, FACTS.stars],
    { easing: Easing.out(Easing.cubic), ...clamp },
  );
  const starText = fmt(rawCount); // lands on the exact "73,889"

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
  // snap the ink→accent swap so the number never sits in a muddy mid-blend
  const inkToAccent = interpolate(frame, [T.land - 2, T.land + 3], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });
  const numberColor = interpolateColors(inkToAccent, [0, 1], [C.ink, C.orange]);
  const wellBg = interpolateColors(accentP, [0, 1], ["#FBF9F5", accentWash(0.08)]);
  const wellBorder = interpolateColors(accentP, [0, 1], [C.line, C.orange]);

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

      {/* repo name — abi / screenshot-to-code */}
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
        <LogoImg src={S2C.logos.github} size={58} />
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
        {DESC_HEAD} <span style={{ whiteSpace: "nowrap" }}>({DESC_PAREN}</span>
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
          border: `${1.5 + 1.6 * accentP}px solid ${wellBorder}`,
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

      {/* ------------------------------------------------------ fork stat */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: ROW_Y,
          opacity: forksE,
          transform: `translateY(${(1 - forksE) * 18}px)`,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, height: 54 }}
        >
          <ForkGlyph size={44} color={C.ink} />
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
            {FACTS.forksLabel}
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
          Forks
        </div>
      </div>

      {/* MIT license chip, right-anchored */}
      <div
        style={{
          position: "absolute",
          left: IN_R - 260,
          top: 798,
          width: 260,
          display: "flex",
          justifyContent: "flex-end",
          opacity: mitE,
          transform: `translateY(${(1 - mitE) * 18}px)`,
        }}
      >
        <Chip label={FACTS.license} size={34} />
      </div>

      {/* ------------------------------------------------------ the app tile */}
      <div
        style={{
          position: "absolute",
          left: AVA.x,
          top: AVA.y,
          width: AVA.s,
          height: AVA.s,
          transform: `rotate(${markRot}deg) scale(${markScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <S2cMark
          size={AVA.s}
          style={{ boxShadow: "0 12px 30px rgba(25,23,20,0.16)" }}
        />
      </div>
    </PaperWorld>
  );
};
