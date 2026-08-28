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
  A,
  C,
  Chip,
  FONT,
  LogoImg,
  OpenSeoMark,
  PaperWorld,
  fmt,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 190;

// --- Accent tints -----------------------------------------------------------
// Derived from the kit's accent so this clip follows a palette change instead
// of carrying a second, stale copy of the colour.
const [AR, AG, AB] = (C.orange.match(/\w\w/g) ?? ["00", "00", "00"]).map((h) =>
  parseInt(h, 16),
);
/** Accent at a given alpha. */
const accentA = (a: number) => `rgba(${AR},${AG},${AB},${a})`;
/** Accent mixed over the white card — an opaque wash. */
const accentWash = (a: number) => {
  const mix = (c: number) => Math.round(255 - a * (255 - c));
  return `rgb(${mix(AR)},${mix(AG)},${mix(AB)})`;
};

/* ---------------------------------------------------------------------------
 * SeoRepoStars — [0:08-0:14] REPO INTRO + PROOF
 *
 * One continuous world, one camera:
 *   f0-42    macro on the real OpenSEO app tile, settling from a spring
 *   f42-64   camera pulls back; the tile unfolds into the GitHub repo card
 *   f64-96   card assembles (name / description / star stat / secondary stats)
 *   f96-114  camera pushes in on the star stat
 *   f114-150 counter climbs and lands on 10k — burst + accent
 *   f150-172 pull back; Semrush + Ahrefs marks dim and drop
 *   f172-190 clean hold on the settled card
 * ------------------------------------------------------------------------- */

// --- Timeline ---------------------------------------------------------------
const T = {
  growStart: 44,
  growEnd: 54,
  nameIn: 50,
  descIn: 52,
  divIn: 56,
  starIn: 58,
  countStart: 62,
  statsIn: 64,
  incIn: 70,
  land: 140,
  dimStart: 148,
  dimEnd: 170,
} as const;

// --- World geometry ---------------------------------------------------------
const CARD = { x: 120, y: 380, w: 840, h: 878 };
const PAD = 56;
const IN_L = CARD.x + PAD; // 176
const IN_R = CARD.x + CARD.w - PAD; // 904
const IN_W = IN_R - IN_L; // 728

const AVA = { x: IN_L, y: 436, s: 168 };
const STAR = { x: IN_L, y: 826, w: IN_W, h: 200 };
const STAR_CX = STAR.x + STAR.w / 2; // 540
const STAR_CY = STAR.y + STAR.h / 2; // 926

const ROW_Y = 1080; // secondary stat row (icon + number line)
const LABEL_Y = 1148;

const INC_S = 160;
const INCUMBENTS = [
  { key: "semrush", src: A.logo.semrushMuted, x: 620, tilt: 2.6 },
  { key: "ahrefs", src: A.logo.ahrefsMuted, x: 800, tilt: -2.6 },
];
const INC_Y = 1308;

const STARS_TARGET = 10000;

// --- Burst geometry ---------------------------------------------------------
// Half-extents of the "10k" lockup (star glyph + digits) measured in world
// coordinates around (STAR_CX, STAR_CY), including the 1.11x landing pop.
// Every burst star begins its travel just OUTSIDE this box so no glyph is ever
// drawn over the digits.
const NUM_HX = 222;
const NUM_HY = 68;
const BURST_CLEAR = 8; // extra px between the box and a star's nearest edge
const BURST_FLAT = 0.5; // vertical flattening — keeps the burst hugging the chip
// The stat row ("Forks" / "Contributors") starts at y=1080 and the description
// ink ends near y=750, so the burst's vertical spread is soft-capped to stay in
// the chip's own band.
const BURST_Y_KNEE = 110;
const BURST_Y_CAP = 121;

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
        top: LABEL_Y - ROW_Y,
        fontFamily: FONT,
        fontSize: 46,
        fontWeight: 500,
        color: C.muted,
        whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  </div>
);

// ---------------------------------------------------------------------------

export const SeoRepoStars: React.FC = () => {
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
  const cam = useCam({
    keys: [0, 20, 36, 58, 96, 114, 150, 172, 190],
    fx: [250, 250, 250, 540, 540, 540, 540, 540, 540],
    fy: [505, 505, 505, 924, 924, 980, 980, 924, 922],
    z: [3.02, 2.92, 2.9, 0.86, 0.87, 1.1, 1.1, 0.862, 0.858],
  });

  // --- The tile settles from a spring ---------------------------------------
  const tileIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 1.1 },
  });
  const tileRot = (1 - tileIn) * -13;
  const tileScale = 0.84 + 0.16 * tileIn;

  // --- The tile unfolds into the repo card ----------------------------------
  // Interpolated (not sprung) so the card's on-screen width stays provably
  // inside the 54px side margins while the camera is still pulled in tight.
  const grow = interpolate(frame, [T.growStart, T.growEnd], [0, 1], ease);
  const cardX = interpolate(grow, [0, 1], [AVA.x, CARD.x]);
  const cardY = interpolate(grow, [0, 1], [AVA.y, CARD.y]);
  const cardW = interpolate(grow, [0, 1], [AVA.s, CARD.w]);
  const cardH = interpolate(grow, [0, 1], [AVA.s, CARD.h]);
  const cardR = interpolate(grow, [0, 1], [AVA.s * 0.22, 26]);

  const enter = (at: number, damping = 13, stiffness = 190) =>
    spring({ frame: frame - at, fps, config: { damping, stiffness } });

  const nameE = enter(T.nameIn);
  const descE = enter(T.descIn);
  const divE = enter(T.divIn, 20, 150);
  const starE = enter(T.starIn, 14, 170);
  const statsE = enter(T.statsIn);
  const incE = enter(T.incIn, 15, 150);

  // --- The star counter -----------------------------------------------------
  const rawCount = interpolate(
    frame,
    [T.countStart, T.land],
    [0, STARS_TARGET],
    { easing: Easing.inOut(Easing.quad), ...clamp },
  );
  const landed = frame >= T.land;
  // GitHub renders this exact string on the repo's social card.
  const starText = landed ? "10k" : fmt(rawCount);

  const popScale = interpolate(
    frame,
    [T.land - 1, T.land + 5, T.land + 20],
    [1, 1.11, 1],
    { easing: Easing.out(Easing.cubic), ...clamp },
  );
  // starts two frames early so the number is already warm on the landing frame
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
  const chipBg = interpolateColors(accentP, [0, 1], ["#FBF9F5", accentWash(0.08)]);
  const chipBorder = interpolateColors(accentP, [0, 1], [C.line, C.orange]);

  // --- Frame-driven star burst ----------------------------------------------
  const burstP = interpolate(frame, [T.land, T.land + 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const burstOn = frame >= T.land && burstP < 1;
  // 4-frame ramp so the stars fade up while they are still close to the digits
  // instead of popping in at full strength.
  const burstFade = interpolate(frame, [T.land, T.land + 4], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });

  // --- Incumbents dim + drop as the count lands -----------------------------
  const dim = interpolate(frame, [T.dimStart, T.dimEnd], [0, 1], ease);


  return (
    <PaperWorld cam={cam}>
      {/* warm halo behind the tile at the open */}
      <div
        style={{
          position: "absolute",
          left: AVA.x + AVA.s / 2 - 460,
          top: AVA.y + AVA.s / 2 - 460,
          width: 920,
          height: 920,
          background: "transparent",
          opacity: 0,
        }}
      />

      {/* halo that blooms behind the card when the star count lands */}
      <div
        style={{
          position: "absolute",
          left: STAR_CX - 780,
          top: STAR_CY - 780,
          width: 1560,
          height: 1560,
          background: "transparent",
          opacity: 0,
        }}
      />

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
          boxShadow: `0 ${16 * grow}px ${40 * grow}px rgba(25,23,20,${0.08 * grow})`,
        }}
      />

      {/* repo name — every-app / open-seo */}
      <div
        style={{
          position: "absolute",
          left: AVA.x + AVA.s + 34,
          top: 452,
          opacity: nameE,
          transform: `translateY(${(1 - nameE) * 16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 500,
            color: C.muted,
            lineHeight: 1.1,
            letterSpacing: -0.4,
          }}
        >
          every-app /
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 76,
            fontWeight: 800,
            color: C.ink,
            lineHeight: 1.06,
            letterSpacing: -2.2,
          }}
        >
          open-seo
        </div>
      </div>

      {/* GitHub mark, card corner */}
      <div
        style={{
          position: "absolute",
          left: IN_R - 60,
          top: 450,
          opacity: nameE * 0.9,
          transform: `scale(${0.7 + 0.3 * nameE})`,
        }}
      >
        <LogoImg src={A.logo.github} size={60} />
      </div>

      {/* the repo's own description line */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: 640,
          width: IN_W,
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 500,
          color: C.muted,
          lineHeight: 1.34,
          letterSpacing: -0.5,
          opacity: descE,
          transform: `translateY(${(1 - descE) * 14}px)`,
        }}
      >
        Open source alternative to Semrush and Ahrefs
      </div>

      {/* divider */}
      <div
        style={{
          position: "absolute",
          left: IN_L,
          top: 790,
          width: IN_W * divE,
          height: 1.5,
          background: C.lineSoft,
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
          borderRadius: 26,
          background: chipBg,
          border: `${1.5 + 1.6 * accentP}px solid ${chipBorder}`,
          boxShadow:
            accentP > 0.01
              ? `0 18px 44px ${accentA(0.16 * accentP)}`
              : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          opacity: starE,
          transform: `translateY(${(1 - starE) * 20}px)`,
        }}
      >
        <StarGlyph size={104} color={numberColor} />
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
        icon={<ForkGlyph size={46} color={C.ink} />}
        value="1k"
        label="Forks"
        enter={statsE}
      />
      <StatBlock
        x={IN_L + 204}
        icon={<PeopleGlyph size={46} color={C.ink} />}
        value="19"
        label="Contributors"
        enter={statsE}
      />
      <Chip
        label="MIT"
        size={46}
        style={{
          position: "absolute",
          left: IN_R - 164,
          top: 1088,
          opacity: statsE,
          transform: `translateY(${(1 - statsE) * 18}px)`,
        }}
      />

      {/* ------------------------------------------------------ the app tile */}
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
        <OpenSeoMark
          size={AVA.s}
          style={{ boxShadow: "0 14px 34px rgba(25,23,20,0.22)" }}
        />
      </div>

      {/* ------------------------------------------------------ incumbent marks */}
      {INCUMBENTS.map((it) => (
        <div
          key={it.key}
          style={{
            position: "absolute",
            left: it.x,
            top: INC_Y,
            width: INC_S,
            height: INC_S,
            borderRadius: 26,
            background: C.card,
            border: `1.5px solid ${C.line}`,
            boxShadow: `0 ${12 * (1 - dim)}px ${28 * (1 - dim)}px rgba(25,23,20,0.06)`,
            display: "grid",
            placeItems: "center",
            opacity: incE * (1 - 0.5 * dim),
            transform: `translateY(${(1 - incE) * 22 + dim * 26}px) scale(${
              (0.88 + 0.12 * incE) * (1 - 0.07 * dim)
            }) rotate(${dim * it.tilt}deg)`,
            transformOrigin: "50% 0%",
          }}
        >
          <LogoImg src={it.src} size={88} style={{ opacity: 1 - 0.3 * dim }} />
        </div>
      ))}

      {/* ------------------------------------------------------ star burst */}
      {burstOn &&
        Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2 + (i % 2 === 0 ? 0.16 : -0.16);
          const ca = Math.cos(angle);
          const sa = Math.sin(angle);
          const reach = 260 + (i % 3) * 46;
          const size = (30 + (i % 3) * 11) * (1.2 - 0.62 * burstP);
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
            burstFade * interpolate(burstP, [0, 0.6, 1], [1, 0.78, 0], clamp);
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
              <StarGlyph size={size} color={C.orange} opacity={o} />
            </div>
          );
        })}
    </PaperWorld>
  );
};
