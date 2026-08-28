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
import {
  FONT_SANS,
  GROW_COMPOSER,
  LW,
  PLATFORM,
  RN,
  RUN,
  RUNADS,
  SPRINGS,
  safePadX,
} from "./theme";

// ============================================================================
// RgP5MetaGoogleAds — 1080x1920 @ 30fps  (9:16 full frame)
// VO [0:23-0:32]: "And this is the first time you can run Meta ads and Google
// ads without knowing a thing. You describe the business. It runs the ads the
// way a senior marketer would."
//
// This is the REAL workflow, recreated as crisp vector/DOM UI (never a
// screenshot inset) from today's live captures:
//   public/rgrow/capture/grow-00-home.png          (Grow composer)
//   public/rgrow/capture/grow-01-meta-ads-open.png (Run Ads modal, $10)
//   public/rgrow/capture/grow-02-meta-100day.png   (same modal, $100)
//   public/rgrow/capture/grow-03-google-ads.png    (Google variant, $100)
// Every string comes from theme.ts (GROW_COMPOSER / RUNADS / RUN). Layout,
// casing, hairlines, radii, the black pill CTA and the grey footnote follow
// the captures; type is scaled up for 9:16 legibility.
//
// One continuous world, one keyframed camera, hold -> move -> hold:
//   0-38    hold   the Grow composer; the business sentence types itself
//   38-56   move   submit, then travel down to where the Run Ads modal builds
//   56-148  hold   THE STAR BEAT: the daily-budget slider walks $10 -> $100 on
//                  its own; bubble, fee line and CTA all update live
//  148-170  move   travel to the Google variant of the same modal (logo +
//                  the one word in the sub line crossfade, no layout jump)
//  170-188  move   settle back so BOTH platform chips read in one frame
//  188-240  hold   the CTA presses itself; the trust footnote stays legible
//  240-270  end    two nearly identical camera keys for a clean cut
// ============================================================================

export const DURATION_IN_FRAMES = 270;

/* ------------------------------------------------------------------ frame -- */

const VIEW_W = 1080;
const VIEW_H = 1920;

// Hard 5% side rule, derived from the token (54px on 1080). Nothing that
// carries meaning is allowed outside this, at any camera zoom.
const SAFE_PAD_X = safePadX(VIEW_W);
const MAX_CARD_W = VIEW_W - SAFE_PAD_X * 2; // 972

const ease = Easing.inOut(Easing.cubic);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const eased = { easing: ease, ...clamp };

const popAt = (
  frame: number,
  fps: number,
  start: number,
  dur = 20,
  config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
) =>
  frame < start
    ? 0
    : spring({ frame: frame - start, fps, config, durationInFrames: dur });

// Smooth 0 -> 1 -> 0 bell, for the self-press.
const bell = (frame: number, a: number, b: number) =>
  Math.sin(interpolate(frame, [a, b], [0, 1], clamp) * Math.PI);

/* ------------------------------------------------ station A: Grow composer -- */

const COMP_W = Math.min(900, MAX_CARD_W);
const COMP_H = 316;
const COMP_CX = 508;
const COMP_X = COMP_CX - COMP_W / 2; // 58
const COMP_Y = 400;

const HEAD_CY = 262;
const F_HEAD = 68;

// The user's own plain-language description of the business — the first
// sentence of the real coffee run we launched in-app. Not narration.
const TYPED = RUN.prompt.slice(0, RUN.prompt.indexOf(".") + 1);
const TYPE_A = 6;
const TYPE_B = 32;
const SEND = 36;

/* ---------------------------------------------- station B: the Run Ads modal */

const MW = Math.min(900, MAX_CARD_W);
const MX = Math.round((VIEW_W - MW) / 2); // 90
const PAD = 40;
const CONTENT_W = MW - PAD * 2; // 820
const LH = 50; // shared single-line box for body copy

// Vertical rhythm of the real modal, scaled for 9:16 type.
const CHIP = 86;
const CHIP_Y = 40;
const CLOSE_CY = CHIP_Y + CHIP / 2;
const TITLE_CY = 200;
const SUB_CY = 262;
const SENDTO_CY = 350;
const ROW_Y = 398;
const ROW_H = 78;
const SETDEF_CY = 526;
const BUDGET_CY = 634;
const BUBBLE_BOTTOM = 752;
const BUBBLE_H = 54;
const TRACK_CY = 778;
const TRACK_H = 9;
const ENDS_CY = 842;
const FEE_CY = 910;
const CTA_Y = 976;
const CTA_H = 98;
const FOOT_Y = 1108;
const MH = 1240;

const F_TITLE = 52;
const F_BODY = 36;
const F_ENDS = 34;
const F_BUBBLE = 34;
const F_CTA = 42;
const F_FOOT = 32;

// Meta card, then the Google card stacked below-right so the Meta chip, title
// and sub line stay visible behind it.
const TM = 1400;
const G_DX = 24;
const G_DY = 310;

// Deck bounds, for the record: x 80..1024 (inside the 54px safe pads at every
// camera zoom used below), y 1400..2950.

// Modal element entrance order (staggered 3f, springs of 20f). The modal
// starts building the moment the composer is submitted and finishes inside the
// hold, so the camera arrives on something already in motion.
const ITEM_START = [38, 41, 44, 47, 50, 52, 55, 58, 60, 63, 66, 69, 72];
// The card unfolds to the bottom of whatever has landed, so it is never an
// empty box waiting for its contents.
const ITEM_BOTTOM = [166, 166, 272, 332, 420, 520, 596, 704, 840, 912, 980, 1120, 1240];
const I_CHIP = 0;
const I_CLOSE = 1;
const I_TITLE = 2;
const I_SUB = 3;
const I_SENDTO = 4;
const I_ROW = 5;
const I_SETDEF = 6;
const I_BUDGET = 7;
const I_SLIDER = 8;
const I_ENDS = 9;
const I_FEE = 10;
const I_CTA = 11;
const I_FOOT = 12;

// Derived from the real endpoint strings so the numbers can never drift.
const BUDGET_MIN = Number(RUNADS.budgetMin.replace(/\D/g, "")); // 10
const TRACK_MAX = Number(RUNADS.budgetMax.replace(/\D/g, "")); // 1000
const BUDGET_MAX = 100;
const SLIDE_A = 88;
const SLIDE_B = 132;

const G_IN = 148;
const G_FLIP_A = 152;
const G_FLIP_B = 163;
const PRESS_A = 200;
const PRESS_B = 214;

/* ----------------------------------------------------------------- camera -- */

const KEY_T = [0, 38, 56, 148, 170, 188, 240, 258, 270];
const KEY_FX = [COMP_CX, COMP_CX, 540, 540, 552, 552, 552, 552, 552];
const KEY_FY = [464, 464, TM + MH / 2, TM + MH / 2, 2200, 2180, 2180, 2180, 2180];
const KEY_Z = [1, 1, 1, 1, 0.94, 0.905, 0.905, 0.903, 0.903];

/* ------------------------------------------------------------------ atoms -- */

const Chevron: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M9.5 5.5 L16 12 L9.5 18.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const Globe: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} fill="none" />
    <ellipse cx={12} cy={12} rx={4.1} ry={9} stroke={color} strokeWidth={1.6} fill="none" />
    <path
      d="M3.3 9.1 H20.7 M3.3 14.9 H20.7"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Close: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5"
      stroke={color}
      strokeWidth={2.1}
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Absolutely-positioned single line, vertically centred on `cy`.
const line = (cy: number, h: number): React.CSSProperties => ({
  position: "absolute",
  top: cy - h / 2,
  height: h,
  display: "flex",
  alignItems: "center",
});

const enter = (p: number, dy = 12): React.CSSProperties => ({
  opacity: Math.min(1, p * 2),
  transform: `translateY(${(1 - p) * dy}px)`,
});

/* ------------------------------------------------------------ the modal ---- */

type ModalProps = {
  left: number;
  top: number;
  height: number;
  shell: number;
  items: number[];
  budget: number;
  googleMix: number;
  press: number;
  ripple: number;
  recede: number;
};

const RunAdsModal: React.FC<ModalProps> = ({
  left,
  top,
  height,
  shell,
  items,
  budget,
  googleMix,
  press,
  ripple,
  recede,
}) => {
  const frac = (budget - BUDGET_MIN) / (TRACK_MAX - BUDGET_MIN);
  const handleX = PAD + frac * CONTENT_W;

  const bubbleText = `$${budget}`;
  const bubbleW = Math.round(44 + bubbleText.length * F_BUBBLE * 0.58);
  const bubbleCX = Math.max(
    PAD + bubbleW / 2 - 6,
    Math.min(MW - PAD - bubbleW / 2 + 6, handleX),
  );

  const chipHalo = googleMix < 0.5 ? PLATFORM.meta : PLATFORM.googleBlue;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: MW,
        height,
        boxSizing: "border-box",
        borderRadius: 30,
        overflow: "hidden",
        backgroundColor: RN.bg,
        border: `1px solid ${LW.hairline}`,
        boxShadow: LW.shadowLift,
        opacity: Math.min(1, shell * 2),
        transform: `translateY(${(1 - shell) * 26}px) scale(${0.985 + 0.015 * shell})`,
        transformOrigin: "center center",
      }}
    >
      {/* platform chip — real marks, crossfaded */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: CHIP_Y,
          width: CHIP,
          height: CHIP,
          borderRadius: 22,
          backgroundColor: LW.card,
          border: `1px solid ${RN.border}`,
          boxShadow: `0 0 0 5px ${chipHalo}0A, 0 2px 5px rgba(23,20,14,0.05)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...enter(items[I_CHIP], 8),
        }}
      >
        <div style={{ position: "relative", width: 50, height: 50 }}>
          <Img
            src={staticFile("logos/meta.svg")}
            style={{
              position: "absolute",
              left: 0,
              top: 8,
              width: 50,
              height: 33,
              opacity: Math.max(0, 1 - googleMix * 1.6),
              transform: `scale(${1 - 0.22 * googleMix})`,
            }}
          />
          <Img
            src={staticFile("logos/google.svg")}
            style={{
              position: "absolute",
              left: 2,
              top: 1,
              width: 46,
              height: 47,
              opacity: Math.max(0, googleMix * 1.6 - 0.6),
              transform: `scale(${0.78 + 0.22 * googleMix})`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: PAD,
          top: CLOSE_CY - 15,
          ...enter(items[I_CLOSE], 6),
        }}
      >
        <Close size={30} color={RN.muted} />
      </div>

      {/* title */}
      <div
        style={{
          ...line(TITLE_CY, F_TITLE * 1.25),
          left: PAD,
          fontSize: F_TITLE,
          fontWeight: 500,
          color: RN.text,
          letterSpacing: -0.9,
          ...enter(items[I_TITLE]),
        }}
      >
        {RUNADS.title}
      </div>

      {/* Sub line. Two layers stacked in a clipped box, rolled by exactly one
          line height: the shared prefix never moves, only the platform word
          flips, and there is no layout jump when Meta becomes Google. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: SUB_CY - LH / 2,
          width: CONTENT_W,
          height: LH,
          overflow: "hidden",
          ...enter(items[I_SUB]),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CONTENT_W,
            transform: `translateY(${-googleMix * LH}px)`,
          }}
        >
          {[
            { text: RUNADS.subMeta, o: Math.max(0, 1 - googleMix * 1.5) },
            { text: RUNADS.subGoogle, o: Math.min(1, googleMix * 1.5) },
          ].map((l) => (
            <div
              key={l.text}
              style={{
                height: LH,
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                fontSize: F_BODY,
                color: RN.textWarm,
                letterSpacing: -0.3,
                opacity: l.o,
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
      </div>

      {/* send visitors to */}
      <div
        style={{
          ...line(SENDTO_CY, F_BODY * 1.3),
          left: PAD,
          fontSize: F_BODY,
          color: RN.textWarm,
          letterSpacing: -0.3,
          ...enter(items[I_SENDTO]),
        }}
      >
        {RUNADS.sendTo}
      </div>

      <div
        style={{
          position: "absolute",
          left: PAD,
          top: ROW_Y,
          width: CONTENT_W,
          height: ROW_H,
          boxSizing: "border-box",
          borderRadius: 18,
          backgroundColor: LW.card,
          border: `1px solid ${LW.hairline}`,
          ...enter(items[I_ROW]),
        }}
      >
        <div style={{ position: "absolute", left: 28, top: ROW_H / 2 - 18 }}>
          <Globe size={36} color={RN.muted} />
        </div>
        <div
          style={{
            ...line(ROW_H / 2, F_BODY * 1.3),
            left: 98,
            fontSize: F_BODY,
            color: RN.text,
            letterSpacing: -0.3,
            whiteSpace: "nowrap",
          }}
        >
          {RUNADS.site}
        </div>
      </div>

      <div
        style={{
          ...line(SETDEF_CY, F_BODY * 1.3),
          left: PAD,
          gap: 12,
          fontSize: F_BODY,
          color: RN.muted,
          letterSpacing: -0.3,
          ...enter(items[I_SETDEF]),
        }}
      >
        {RUNADS.setDefault}
        <Chevron size={24} color={RN.muted} />
      </div>

      {/* daily budget */}
      <div
        style={{
          ...line(BUDGET_CY, F_BODY * 1.3),
          left: PAD,
          fontSize: F_BODY,
          color: RN.textWarm,
          letterSpacing: -0.3,
          ...enter(items[I_BUDGET]),
        }}
      >
        {RUNADS.budgetLabel}
      </div>

      <div style={{ opacity: Math.min(1, items[I_SLIDER] * 2) }}>
        {/* track */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: TRACK_CY - TRACK_H / 2,
            width: CONTENT_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            backgroundColor: RN.borderStrong,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: TRACK_CY - TRACK_H / 2,
            width: Math.max(TRACK_H, frac * CONTENT_W),
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            backgroundColor: RN.ink,
          }}
        />
        {/* handle */}
        <div
          style={{
            position: "absolute",
            left: handleX - 16,
            top: TRACK_CY - 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: RN.ink,
          }}
        />
        {/* value bubble */}
        <div
          style={{
            position: "absolute",
            left: bubbleCX - bubbleW / 2,
            top: BUBBLE_BOTTOM - BUBBLE_H,
            width: bubbleW,
            height: BUBBLE_H,
            borderRadius: 14,
            backgroundColor: RN.ink,
            color: LW.card,
            fontSize: F_BUBBLE,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {bubbleText}
        </div>
        {/* tail — always points at the handle, as it does in the product */}
        <div
          style={{
            position: "absolute",
            left:
              Math.max(
                bubbleCX - bubbleW / 2 + 16,
                Math.min(bubbleCX + bubbleW / 2 - 16, handleX),
              ) - 7,
            top: BUBBLE_BOTTOM - 9,
            width: 14,
            height: 14,
            backgroundColor: RN.ink,
            transform: "rotate(45deg)",
            borderRadius: 3,
          }}
        />
      </div>

      {/* track endpoints */}
      <div
        style={{
          ...line(ENDS_CY, F_ENDS * 1.3),
          left: PAD,
          fontSize: F_ENDS,
          color: RN.muted,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.2,
          ...enter(items[I_ENDS]),
        }}
      >
        {RUNADS.budgetMin}
      </div>
      <div
        style={{
          ...line(ENDS_CY, F_ENDS * 1.3),
          left: PAD,
          width: CONTENT_W,
          justifyContent: "flex-end",
          fontSize: F_ENDS,
          color: RN.muted,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.2,
          ...enter(items[I_ENDS]),
        }}
      >
        {RUNADS.budgetMax}
      </div>

      {/* fee line — live */}
      <div
        style={{
          ...line(FEE_CY, F_BODY * 1.3),
          left: PAD,
          fontSize: F_BODY,
          color: RN.textWarm,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.3,
          whiteSpace: "nowrap",
          ...enter(items[I_FEE]),
        }}
      >
        {RUNADS.fee(budget)}
      </div>

      {/* black pill CTA — presses itself */}
      <div style={{ ...enter(items[I_CTA]) }}>
        {ripple > 0 && ripple < 1 ? (
          <div
            style={{
              position: "absolute",
              left: PAD - 22 * ripple,
              top: CTA_Y - 22 * ripple,
              width: CONTENT_W + 44 * ripple,
              height: CTA_H + 44 * ripple,
              borderRadius: 20 + 12 * ripple,
              border: `2px solid rgba(17,17,17,${0.22 * (1 - ripple)})`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: CTA_Y,
            width: CONTENT_W,
            height: CTA_H,
            borderRadius: 20,
            backgroundColor: RN.ink,
            color: LW.card,
            fontSize: F_CTA,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 - 0.014 * press})`,
            transformOrigin: "center center",
            boxShadow: `0 ${10 - 6 * press}px ${24 - 12 * press}px rgba(23,20,14,${0.14 - 0.05 * press})`,
          }}
        >
          {RUNADS.cta(budget)}
        </div>
      </div>

      {/* grey trust footnote */}
      <div
        style={{
          position: "absolute",
          left: PAD + 40,
          top: FOOT_Y,
          width: CONTENT_W - 80,
          fontSize: F_FOOT,
          lineHeight: 1.34,
          textAlign: "center",
          color: LW.muted,
          letterSpacing: -0.2,
          ...enter(items[I_FOOT], 8),
        }}
      >
        {RUNADS.footnote}
      </div>

      {/* the card behind the deck settles back a touch */}
      {recede > 0.01 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: LW.paper,
            opacity: recede * 0.18,
          }}
        />
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------- comp -- */

export const RgP5MetaGoogleAds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, { ...eased });
  const fy = interpolate(frame, KEY_T, KEY_FY, { ...eased });
  const z = interpolate(frame, KEY_T, KEY_Z, { ...eased });

  /* --- composer ---------------------------------------------------------- */
  const nChars = Math.round(
    interpolate(frame, [TYPE_A, TYPE_B], [0, TYPED.length], {
      easing: Easing.out(Easing.quad),
      ...clamp,
    }),
  );
  const caretOn = frame < SEND && Math.floor(frame / 8) % 2 === 0;
  const phFade = interpolate(frame, [TYPE_A - 2, TYPE_A + 4], [1, 0], { ...clamp });
  const compPress = bell(frame, SEND, SEND + 12);
  const compRipple = interpolate(frame, [SEND, SEND + 24], [0, 1], { ...eased });

  /* --- Meta modal -------------------------------------------------------- */
  const shellA = popAt(frame, fps, ITEM_START[0], 22, SPRINGS.heavy);
  const itemsA = ITEM_START.map((s) => popAt(frame, fps, s, 20));
  const heightA = interpolate(frame, ITEM_START, ITEM_BOTTOM, { ...eased });

  // The handle walks up on its own — released, then easing into its target.
  const budget = Math.round(
    interpolate(frame, [SLIDE_A, SLIDE_B], [BUDGET_MIN, BUDGET_MAX], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    }),
  );

  /* --- Google modal ------------------------------------------------------ */
  const shellB = popAt(frame, fps, G_IN, 22, SPRINGS.heavy);
  const itemsB = ITEM_START.map(() => Math.min(1, shellB * 1.15));
  const googleMix = interpolate(frame, [G_FLIP_A, G_FLIP_B], [0, 1], { ...eased });

  const press = frame >= PRESS_A ? bell(frame, PRESS_A, PRESS_B) : 0;
  const ripple = interpolate(frame, [PRESS_A + 3, PRESS_A + 34], [0, 1], { ...eased });

  /* --- world air --------------------------------------------------------- */
  const amberAir = interpolate(frame, [150, 214], [0, 1], { ...eased });

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* Opaque warm-white world, frame 0 -> last frame. Backgrounds bleed. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${LW.cardSoft} 0%, ${LW.paper} 44%, ${LW.paperDeep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(64% 38% at 50% 78%, rgba(222,155,74,0.09) 0%, rgba(222,155,74,0) 72%)",
          opacity: amberAir,
        }}
      />

      {/* Camera */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---- Station A: the real Grow composer --------------------------- */}
        <div
          style={{
            position: "absolute",
            left: COMP_X,
            top: HEAD_CY - F_HEAD * 0.72,
            width: COMP_W,
            textAlign: "center",
            fontSize: F_HEAD,
            fontWeight: 400,
            color: RN.textWarm,
            letterSpacing: -1.6,
            whiteSpace: "nowrap",
          }}
        >
          {GROW_COMPOSER.heading}
        </div>

        <div
          style={{
            position: "absolute",
            left: COMP_X,
            top: COMP_Y,
            width: COMP_W,
            height: COMP_H,
            boxSizing: "border-box",
            borderRadius: 30,
            backgroundColor: RN.panel,
            border: `1px solid ${RN.border}`,
          }}
        >
          {phFade > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: 48,
                top: 44,
                width: COMP_W - 96,
                fontSize: 44,
                lineHeight: 1.36,
                color: RN.muted,
                letterSpacing: -0.5,
                opacity: phFade,
              }}
            >
              {GROW_COMPOSER.placeholder}
            </div>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: 48,
              top: 44,
              width: COMP_W - 96,
              fontSize: 44,
              lineHeight: 1.36,
              color: RN.text,
              letterSpacing: -0.5,
            }}
          >
            {TYPED.slice(0, nChars)}
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: 42,
                marginLeft: 4,
                verticalAlign: "-7px",
                backgroundColor: RN.amber,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </div>

          {/* composer chrome, as it really is */}
          <svg
            width={38}
            height={38}
            viewBox="0 0 24 24"
            style={{ position: "absolute", left: 48, top: COMP_H - 81 }}
          >
            <path
              d="M12 5.5 L12 18.5 M5.5 12 L18.5 12"
              stroke={RN.muted}
              strokeWidth={1.9}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              right: 152,
              top: COMP_H - 82,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 34,
              color: RN.muted,
              letterSpacing: -0.3,
            }}
          >
            Auto
            <svg width={22} height={22} viewBox="0 0 24 24">
              <path
                d="M6 9.5 L12 15.5 L18 9.5"
                stroke={RN.muted}
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              right: 48,
              top: COMP_H - 100,
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: RN.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 - 0.09 * compPress})`,
            }}
          >
            <svg width={30} height={30} viewBox="0 0 24 24">
              <path
                d="M5 12 L19 12 M13 6 L19 12 L13 18"
                stroke={LW.card}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          {compRipple > 0 && compRipple < 1 ? (
            <div
              style={{
                position: "absolute",
                right: 48 - 30 * compRipple,
                top: COMP_H - 100 - 30 * compRipple,
                width: 76 + 60 * compRipple,
                height: 76 + 60 * compRipple,
                borderRadius: 999,
                border: `2px solid rgba(222,155,74,${0.45 * (1 - compRipple)})`,
              }}
            />
          ) : null}
        </div>

        {/* ---- Station B: the real Run Ads modal, Meta ---------------------- */}
        {shellA > 0.002 ? (
          <RunAdsModal
            left={MX}
            top={TM}
            height={heightA}
            shell={shellA}
            items={itemsA}
            budget={budget}
            googleMix={0}
            press={0}
            ripple={0}
            recede={interpolate(frame, [150, 172], [0, 1], { ...eased })}
          />
        ) : null}

        {/* ---- Station C: the same modal, Google --------------------------- */}
        {shellB > 0.002 ? (
          <RunAdsModal
            left={MX + G_DX}
            top={TM + G_DY}
            height={MH}
            shell={shellB}
            items={itemsB}
            budget={BUDGET_MAX}
            googleMix={googleMix}
            press={press}
            ripple={ripple}
            recede={0}
          />
        ) : null}
      </div>

      {/* Whisper vignette so the white world has a floor, never a hard edge */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(78% 62% at 50% 46%, rgba(0,0,0,0) 60%, rgba(23,20,14,0.05) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
