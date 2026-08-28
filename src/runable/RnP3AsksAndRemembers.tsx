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
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  CAROUSEL_SLIDES,
  FONT_SANS,
  RN,
  SPRINGS,
  UI,
  safePadX,
} from "./theme";

// ============================================================================
// RnP3AsksAndRemembers — 1080x1920 @ 30fps  (9:16)
// VO [0:11]: "Step two: it asks who it's for, what style. Upload a few
// carousels you love as references, and it designs in that exact style. And it
// has memory, so it saves your brand defaults forever."
//
// One continuous world, one keyframed camera. Two ideas, in order:
//   (a) IT ASKS       — the real 5-question flow (Q2 -> Q3 -> Q4), answers
//                       landing, references dropping into the Q4 card.
//   (b) IT REMEMBERS  — the answers condense into a saved Design System card,
//                       then the camera pulls out and that card is sitting
//                       inside Runable's Personalization surface.
//
// Camera stations (hold -> move -> hold):
//   A  f0-24    z1.22  tight on the question card, "10" being typed
//   B  f42-134  z1.06  whole card; Q2 -> Q3 -> Q4 advance with the counter
//   C  f152-190 z1.18  push in on the reference thumbnails dropping into Q4
//   ~  f197-202 z0.76  wide beat mid-travel: source above, destination below
//   D  f214-252 z1.28  saved Design System card filling in
//   E  f272-289 z1.10  Personalization panel with that card docked inside
//
// Every on-screen string is real product text (theme UI.* + verbatim option /
// answer text transcribed from public/runable/reference/q-2, qa-3, qa-4).
// Nothing on screen restates the narration.
//
// SKIN: Ahmed's Altari purple world (ALTARI.* in theme.ts) is the GROUND —
// #1A1A2E, always-on 64px backdrop grid, ambient primary glow. Runable's real
// product UI (question card, Design System card, Personalization panel) keeps
// its AUTHENTIC cream/white surfaces, black Next button, cyan check and
// IDGrotesk type — it floats as a lit light-panel ON that purple ground, with
// shadows retuned from warm-on-cream to dark-drop + purple ambient.
// ============================================================================

export const DURATION_IN_FRAMES = 290;

// ---------------------------------------------------------------------------
// World + safe-area derived geometry
// ---------------------------------------------------------------------------
const VIEW_W = 1080;
const VIEW_H = 1920;
const SAFE_PAD_X = safePadX(VIEW_W); // 54px on a 1080 canvas
const Z_MAX = 1.22; // tightest camera zoom in the whole clip

const WORLD_W = 1700;
const WORLD_H = 3400;

// Card is capped so it never reaches the outer 5% even at the tightest zoom.
const CARD_W = Math.min(780, Math.floor((VIEW_W - SAFE_PAD_X * 2) / Z_MAX));
const CARD_X = Math.round((WORLD_W - CARD_W) / 2); // 460
const CARD_Y = 370;
const CARD_H = 960;
const CARD_PAD = 40;
const INNER_W = CARD_W - CARD_PAD * 2; // 700
const FOOTER_H = 60;

const PANEL_W = 820;
const PANEL_X = Math.round((WORLD_W - PANEL_W) / 2); // 440
const PANEL_Y = 1620;
const PANEL_H = 1310;
const PANEL_PAD = 44;
const PANEL_INNER_W = PANEL_W - PANEL_PAD * 2; // 732

const BRAND_X = PANEL_X + PANEL_PAD; // 484
const BRAND_Y = 2134;
const BRAND_W = PANEL_INNER_W; // 732
const BRAND_H = 660;
const ADD_TOP = BRAND_Y - PANEL_Y + BRAND_H + 32;

// ---------------------------------------------------------------------------
// Altari material helpers. Every color comes from the ALTARI tokens — the only
// literals here are neutral black alphas used for depth, exactly the way
// Runable's own hairlines are authored.
// ---------------------------------------------------------------------------
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// A light product panel sitting on the dark purple ground: a real drop shadow
// to seat it plus an ambient primary halo. g = how much "floating on purple"
// it is (1 = alone on the ground, 0 = docked inside another light panel, where
// the shadow falls back to the warm-on-cream weight it always had).
const floatShadow = (g: number) =>
  [
    `0 0 ${Math.round(44 + 52 * g)}px ${rgba(ALTARI.primary, 0.34 * g)}`,
    `0 ${Math.round(10 + 22 * g)}px ${Math.round(30 + 44 * g)}px rgba(0,0,0,${(
      0.09 +
      0.35 * g
    ).toFixed(3)})`,
    `0 3px 10px rgba(0,0,0,${(0.05 + 0.15 * g).toFixed(3)})`,
  ].join(", ");

const SHADOW_SOFT = floatShadow(1);
// In-panel elements (reference thumbnails) still sit on Runable's cream, so
// they keep Runable's own warm shadow.
const SHADOW_TIGHT =
  "0 14px 36px rgba(61,46,36,0.09), 0 2px 8px rgba(61,46,36,0.05)";
// Altari-material chips travelling through the purple world.
const SHADOW_CHIP = `0 0 34px ${rgba(ALTARI.primaryLight, 0.3)}, 0 12px 30px rgba(0,0,0,${0.42})`;

// Grid overlay — always present. 64x64 on the backdrop, 24x24 on Altari cards.
const GridLayer: React.FC<{
  size: number;
  color: string;
  inset?: number;
}> = ({ size, color, inset = 0 }) => (
  <div
    style={{
      position: "absolute",
      inset,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      pointerEvents: "none",
    }}
  />
);

// The purple dock a Runable panel is set into. Extends vertically only, so the
// 5% side margins stay exactly where the panel put them.
const PLATE_V = 14;
const DockPlate: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  opacity: number;
}> = ({ x, y, w, h, radius, opacity }) => {
  if (opacity <= 0.002) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - PLATE_V,
        width: w,
        height: h + PLATE_V * 2,
        borderRadius: radius + 12,
        backgroundColor: rgba(ALTARI.card, 0.66),
        border: `1px solid ${rgba(ALTARI.border, 0.9)}`,
        boxShadow: `0 0 70px ${rgba(ALTARI.primary, 0.22)}`,
        opacity,
        overflow: "hidden",
      }}
    >
      <GridLayer size={ALTARI_GRID.card} color={rgba(ALTARI.border, 0.75)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// The real question flow. Titles come verbatim from theme UI.questions;
// options + typed answers are transcribed verbatim from the real screenshots.
// ---------------------------------------------------------------------------
type Step = {
  n: number;
  title: string;
  options: string[];
  answer: string;
  typeStart: number;
  cps: number; // characters per frame
  enableAt: number;
  pressAt: number | null;
};

const STEPS: Step[] = [
  {
    // public/runable/reference/q-2.png
    n: 2,
    title: UI.questions[1],
    options: [
      "5 (hook + wrap into slides)",
      "7 (hook + 5 agents + CTA)",
      "8 (hook + 5 agents + recap + CTA)",
    ],
    answer: "10",
    typeStart: 3,
    cps: 1 / 5,
    enableAt: 17,
    pressAt: 46,
  },
  {
    // public/runable/reference/qa-3.png
    n: 3,
    title: UI.questions[2],
    options: [
      "Punchy operator, bold and direct",
      "Clean and premium, minimal",
      "Techy dark mode with neon accents",
      "Friendly and approachable",
    ],
    answer:
      "Direct and confident. Short declarative lines, real specifics, no fluff.",
    typeStart: 72,
    cps: 3,
    enableAt: 98,
    pressAt: 106,
  },
  {
    // public/runable/reference/qa-4.png — no preset options, attach + hexes
    n: 4,
    title: UI.questions[3],
    options: [],
    answer: "",
    typeStart: 126,
    cps: 1,
    enableAt: 138,
    pressAt: null,
  },
];

const STEP_START = [0, 52, 110]; // cross-fade start of each step
const STEP_XFADE = 14;

// Saved brand defaults — the real answers from the captured run
// (RUNABLE-UI-NOTES.md: 4:5 portrait, 10 pages, direct/confident tone,
//  #0A0A0A + #C6F24E, CTA "Comment CAROUSEL").
const BRAND_ROWS: {
  label: string;
  value: string;
  swatches?: [string, string];
}[] = [
  { label: "Format / aspect ratio", value: "4:5 portrait" },
  { label: "Pages", value: "10" },
  { label: "Tone / vibe", value: "Direct and confident" },
  { label: "Brand colors", value: "", swatches: ["#0A0A0A", "#C6F24E"] },
  { label: "CTA", value: "Comment CAROUSEL" },
];
const BRAND_IN = 188;
const ROW_AT = [200, 208, 216, 224, 232];
const LOCK_AT = 242;

// Reference carousels dropped into Q4 (real exported slides).
const REFS = [CAROUSEL_SLIDES[0], CAROUSEL_SLIDES[2], CAROUSEL_SLIDES[5]];
const REF_AT = [154, 163, 172];
const THUMB_W = 200;
const THUMB_H = 250;
const THUMB_GAP = 30;

// ---------------------------------------------------------------------------
// Icons (thin monoline, matching Runable's line weight)
// ---------------------------------------------------------------------------
const IconClose: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

const IconPen: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20 L4.8 16.2 L15.4 5.6 A2.1 2.1 0 0 1 18.4 8.6 L7.8 19.2 Z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

const IconPlus: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5 V19 M5 12 H19"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

const IconChevron: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M14.5 5.5 L8.5 12 L14.5 18.5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5.5 12.5 L10 17 L18.5 7"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconBrain: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5.6 a2.9 2.9 0 0 0-5.5 1.1 a2.5 2.5 0 0 0-1.1 4.3 a2.7 2.7 0 0 0 1.3 4.5 a2.9 2.9 0 0 0 5.3 1.3 Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <path
      d="M12 5.6 a2.9 2.9 0 0 1 5.5 1.1 a2.5 2.5 0 0 1 1.1 4.3 a2.7 2.7 0 0 1-1.3 4.5 a2.9 2.9 0 0 1-5.3 1.3 Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Landing pulse
// ---------------------------------------------------------------------------
const RingPulse: React.FC<{
  frame: number;
  at: number;
  radius: number;
  color: string;
}> = ({ frame, at, radius, color }) => {
  const p = interpolate(frame, [at, at + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: -4 - 18 * p,
        borderRadius: radius + 4 + 18 * p,
        border: `3px solid ${color}`,
        opacity: 0.7 * (1 - p),
        pointerEvents: "none",
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Question card
// ---------------------------------------------------------------------------
const QuestionCard: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const f = frame;
  const active = f < STEP_START[1] ? 0 : f < STEP_START[2] ? 1 : 2;
  const step = STEPS[active];

  // Next button state — grey until the current question has an answer
  const enabled = interpolate(f, [step.enableAt, step.enableAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const press =
    step.pressAt === null
      ? 0
      : interpolate(
          f,
          [step.pressAt, step.pressAt + 3, step.pressAt + 10],
          [0, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  // progress dots slide 2 -> 3 -> 4 (0-based 1 -> 2 -> 3)
  const dotAt = interpolate(
    f,
    [
      STEP_START[1],
      STEP_START[1] + STEP_XFADE,
      STEP_START[2],
      STEP_START[2] + STEP_XFADE,
    ],
    [1, 2, 2, 3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const blinkOn = f % 26 < 15;

  return (
    <>
      <DockPlate
        x={CARD_X}
        y={CARD_Y}
        w={CARD_W}
        h={CARD_H}
        radius={30}
        opacity={1}
      />
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 30,
          backgroundColor: RN.panel,
          border: `1px solid ${RN.border}`,
          boxShadow: SHADOW_SOFT,
          overflow: "hidden",
        }}
      >
        {/* close glyph — shell chrome, stays put while questions advance */}
        <div
          style={{ position: "absolute", right: CARD_PAD, top: CARD_PAD + 2 }}
        >
          <IconClose size={30} color={RN.muted} />
        </div>

        {/* cross-fading question bodies */}
        {STEPS.map((s, i) => {
          const inP =
            i === 0
              ? 1
              : interpolate(
                  f,
                  [STEP_START[i], STEP_START[i] + STEP_XFADE],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.inOut(Easing.cubic),
                  },
                );
          const outP =
            i === STEPS.length - 1
              ? 0
              : interpolate(
                  f,
                  [STEP_START[i + 1], STEP_START[i + 1] + STEP_XFADE],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.inOut(Easing.cubic),
                  },
                );
          const opacity = inP * (1 - outP);
          if (opacity <= 0.002) return null;
          const dx = 46 * (1 - inP) - 46 * outP;

          const typed = s.answer.slice(
            0,
            Math.max(0, Math.floor((f - s.typeStart) * s.cps)),
          );
          const typing =
            f >= s.typeStart &&
            typed.length < s.answer.length &&
            s.answer !== "";

          return (
            <div
              key={`step-${i}`}
              style={{
                position: "absolute",
                left: CARD_PAD,
                top: CARD_PAD,
                width: INNER_W,
                height: CARD_H - CARD_PAD * 2 - FOOTER_H - 24,
                opacity,
                transform: `translateX(${dx}px)`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Question N of 5 */}
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 28,
                  color: RN.muted,
                  height: 34,
                  lineHeight: "34px",
                }}
              >
                {UI.qCounter(s.n)}
              </div>

              {/* question title — verbatim UI.questions */}
              <div
                style={{
                  marginTop: 26,
                  fontFamily: FONT_SANS,
                  fontSize: 48,
                  fontWeight: 600,
                  lineHeight: 1.22,
                  color: RN.text,
                  letterSpacing: -0.4,
                }}
              >
                {s.title}
              </div>

              {/* numbered options */}
              {s.options.length > 0 ? (
                <div style={{ marginTop: 34 }}>
                  {s.options.map((opt, oi) => (
                    <div
                      key={`opt-${oi}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 22,
                        height: 84,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 15,
                          backgroundColor: "rgba(0,0,0,0.045)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: FONT_SANS,
                          fontSize: 26,
                          color: RN.muted,
                          flexShrink: 0,
                        }}
                      >
                        {oi + 1}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_SANS,
                          fontSize: 38,
                          color: RN.text,
                          lineHeight: 1.2,
                        }}
                      >
                        {opt}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* reference carousels attached to the brand question */}
              {i === 2 ? (
                <div
                  style={{
                    marginTop: 66,
                    display: "flex",
                    gap: THUMB_GAP,
                    justifyContent: "center",
                  }}
                >
                  {REFS.map((src, ri) => {
                    const at = REF_AT[ri];
                    const sIn = spring({
                      frame: f - at,
                      fps,
                      config: SPRINGS.snappy,
                      durationInFrames: 20,
                    });
                    const o = interpolate(f, [at, at + 6], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    const rot = (ri - 1) * 2.4 * (1 - sIn);
                    return (
                      <div
                        key={`ref-${ri}`}
                        style={{
                          position: "relative",
                          width: THUMB_W,
                          height: THUMB_H,
                          opacity: o,
                          transform: `translateY(${-190 * (1 - sIn)}px) rotate(${rot}deg) scale(${0.9 + 0.1 * sIn})`,
                          borderRadius: 16,
                          overflow: "visible",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 16,
                            overflow: "hidden",
                            border: `1px solid ${RN.borderStrong}`,
                            boxShadow: SHADOW_TIGHT,
                            backgroundColor: RN.card,
                          }}
                        >
                          <Img
                            src={staticFile(src)}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                        <RingPulse
                          frame={f}
                          at={at + 10}
                          radius={16}
                          color="rgba(0,183,202,0.85)"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* answer row — pinned just above the footer on every question */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  minHeight: 96,
                }}
              >
                <div style={{ paddingTop: 4, flexShrink: 0 }}>
                  {i === 2 ? (
                    <IconPlus size={34} color={RN.muted} />
                  ) : (
                    <IconPen size={34} color={RN.muted} />
                  )}
                </div>
                {i === 2 ? (
                  <div style={{ display: "flex", gap: 26, paddingTop: 2 }}>
                    {(["#0A0A0A", "#C6F24E"] as const).map((hex, hi) => {
                      const at = 126 + hi * 8;
                      const sIn = spring({
                        frame: f - at,
                        fps,
                        config: SPRINGS.snappy,
                        durationInFrames: 20,
                      });
                      return (
                        <div
                          key={hex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "10px 20px 10px 12px",
                            borderRadius: 999,
                            backgroundColor: RN.card,
                            border: `1px solid ${RN.border}`,
                            opacity: sIn,
                            transform: `scale(${0.86 + 0.14 * sIn})`,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              backgroundColor: hex,
                              border: `1px solid ${RN.borderStrong}`,
                            }}
                          />
                          <div
                            style={{
                              fontFamily: FONT_SANS,
                              fontVariantNumeric: "tabular-nums",
                              fontSize: 28,
                              color: RN.text,
                            }}
                          >
                            {hex}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 32,
                      lineHeight: 1.4,
                      color: typed.length > 0 ? RN.text : RN.muted,
                    }}
                  >
                    {typed.length === 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: 3,
                          height: "1.05em",
                          transform: "translateY(0.22em)",
                          marginRight: 10,
                          backgroundColor: RN.text,
                          opacity: blinkOn ? 0.85 : 0,
                        }}
                      />
                    ) : null}
                    {typed.length > 0 ? typed : UI.answerPlaceholder}
                    {typed.length > 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: 3,
                          height: "1.05em",
                          transform: "translateY(0.22em)",
                          marginLeft: 4,
                          backgroundColor: RN.text,
                          opacity: typing || blinkOn ? 0.85 : 0,
                        }}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* divider + footer — shell chrome */}
        <div
          style={{
            position: "absolute",
            left: CARD_PAD,
            right: CARD_PAD,
            bottom: CARD_PAD + FOOTER_H + 20,
            height: 1,
            backgroundColor: RN.borderStrong,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: CARD_PAD,
            right: CARD_PAD,
            bottom: CARD_PAD,
            height: FOOTER_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconChevron size={28} color={RN.muted} />
            <div
              style={{ fontFamily: FONT_SANS, fontSize: 30, color: RN.muted }}
            >
              Previous
            </div>
          </div>

          {/* progress dots */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 16,
              pointerEvents: "none",
            }}
          >
            {[0, 1, 2, 3, 4].map((d) => {
              const t = Math.max(0, 1 - Math.abs(d - dotAt));
              return (
                <div
                  key={`dot-${d}`}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: RN.text,
                    opacity: 0.16 + 0.74 * t,
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div
              style={{ fontFamily: FONT_SANS, fontSize: 30, color: RN.muted }}
            >
              Skip
            </div>
            <div
              style={{
                padding: "16px 40px",
                borderRadius: 999,
                backgroundColor: enabled > 0.5 ? RN.ink : "rgba(0,0,0,0.055)",
                transform: `scale(${1 - 0.06 * press})`,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 30,
                  fontWeight: 500,
                  color: enabled > 0.5 ? "#FFFFFF" : "#B4A99F",
                }}
              >
                Next
              </div>
              {step.pressAt !== null ? (
                <RingPulse
                  frame={f}
                  at={step.pressAt}
                  radius={999}
                  color="rgba(0,0,0,0.28)"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Saved brand defaults card ("Design System")
// ---------------------------------------------------------------------------
const BrandCard: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const f = frame;
  const cardIn = spring({
    frame: f - BRAND_IN,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 26,
  });
  const cardO = interpolate(f, [BRAND_IN, BRAND_IN + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lockIn = spring({
    frame: f - LOCK_AT,
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 26,
  });
  const float = f > 258 ? 2.5 * Math.sin((f - 258) / 34) : 0;
  // While the card flies solo it sits on the purple ground; once the
  // Personalization panel closes around it, it is a card inside a light panel
  // again — so the purple ambient has to leave with it.
  const dock = interpolate(f, [250, 264], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <>
      <DockPlate
        x={BRAND_X}
        y={BRAND_Y + float}
        w={BRAND_W}
        h={BRAND_H}
        radius={26}
        opacity={cardO * (1 - dock)}
      />
      <div
        style={{
          position: "absolute",
          left: BRAND_X,
          top: BRAND_Y + float,
          width: BRAND_W,
          height: BRAND_H,
          opacity: cardO,
          transform: `scale(${0.94 + 0.06 * cardIn})`,
          borderRadius: 26,
          backgroundColor: RN.panel,
          border: `1px solid ${f >= LOCK_AT ? "rgba(0,183,202,0.35)" : RN.border}`,
          boxShadow: floatShadow(1 - dock),
          overflow: "hidden",
        }}
      >
        {/* header: Design System + saved marker */}
        <div
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            top: 34,
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: RN.amber,
              }}
            />
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 38,
                fontWeight: 600,
                color: RN.text,
                letterSpacing: -0.2,
              }}
            >
              {UI.memory.sections[2]}
            </div>
          </div>
          <div
            style={{
              position: "relative",
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: RN.cyan,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${lockIn})`,
            }}
          >
            <IconCheck size={30} color="#FFFFFF" />
            <RingPulse
              frame={f}
              at={LOCK_AT}
              radius={26}
              color="rgba(0,183,202,0.8)"
            />
          </div>
        </div>

        {/* saved values */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 110 }}>
          {BRAND_ROWS.map((row, i) => {
            const at = ROW_AT[i];
            const sIn = spring({
              frame: f - at,
              fps,
              config: SPRINGS.snappy,
              durationInFrames: 18,
            });
            const o = interpolate(f, [at, at + 7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={row.label}
                style={{
                  height: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: i === 0 ? "none" : `1px solid ${RN.border}`,
                  opacity: o,
                  transform: `translateY(${-38 * (1 - sIn)}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 28,
                    color: RN.muted,
                  }}
                >
                  {row.label}
                </div>
                {row.swatches ? (
                  <div style={{ display: "flex", gap: 20 }}>
                    {row.swatches.map((hex) => (
                      <div
                        key={hex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: hex,
                            border: `1px solid ${RN.borderStrong}`,
                          }}
                        />
                        <div
                          style={{
                            fontFamily: FONT_SANS,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: 26,
                            color: RN.text,
                          }}
                        >
                          {hex}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 32,
                      fontWeight: 500,
                      color: RN.text,
                    }}
                  >
                    {row.value}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// The answers travelling out of the question card into the saved card.
// Launches during the wide beat so the camera follows them down.
// ---------------------------------------------------------------------------
const FlyingValues: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const startX = 850;
  const startY = 1250;
  const endX = 1010;

  return (
    <>
      {BRAND_ROWS.map((row, i) => {
        const land = ROW_AT[i] + 2;
        const launch = land - 24;
        if (f < launch || f > land + 4) return null;
        const t = interpolate(f, [launch, land], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });
        const endY = BRAND_Y + 110 + i * 100 + 50;
        const x =
          startX + (endX - startX) * t + 46 * Math.sin(t * Math.PI) * (i - 2);
        const y = startY + (endY - startY) * t;
        const o =
          interpolate(f, [launch, launch + 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) *
          interpolate(f, [land - 5, land + 3], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        return (
          <div
            key={`fly-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              opacity: o,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 22px",
              borderRadius: 999,
              backgroundColor: ALTARI.card,
              backgroundImage: `linear-gradient(${rgba(ALTARI.border, 0.85)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(ALTARI.border, 0.85)} 1px, transparent 1px)`,
              backgroundSize: `${ALTARI_GRID.card}px ${ALTARI_GRID.card}px`,
              border: `1px solid ${ALTARI.primaryLight}`,
              boxShadow: SHADOW_CHIP,
              whiteSpace: "nowrap",
            }}
          >
            {row.swatches ? (
              row.swatches.map((hex) => (
                <div
                  key={hex}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    backgroundColor: hex,
                    border: `1px solid ${rgba(ALTARI.border, 0.9)}`,
                  }}
                />
              ))
            ) : (
              <div
                style={{
                  fontFamily: ALTARI_FONT.body,
                  fontSize: 26,
                  fontWeight: 600,
                  color: ALTARI.heading,
                }}
              >
                {row.value}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Personalization panel (memory surface) — appears around the saved card
// ---------------------------------------------------------------------------
const MemoryPanel: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const f = frame;
  const o = interpolate(f, [254, 272], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  if (o <= 0.002) return null;
  const sIn = spring({
    frame: f - 254,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 30,
  });
  const glow = f > 274 ? 0.5 + 0.5 * Math.sin((f - 274) / 9) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_X,
        top: PANEL_Y,
        width: PANEL_W,
        height: PANEL_H,
        opacity: o,
        transform: `scale(${0.985 + 0.015 * sIn})`,
        transformOrigin: `${PANEL_W / 2}px ${BRAND_Y - PANEL_Y + BRAND_H / 2}px`,
        borderRadius: 34,
        backgroundColor: RN.card,
        border: `1px solid ${RN.border}`,
        boxShadow: SHADOW_SOFT,
      }}
    >
      {/* header */}
      <div
        style={{
          position: "absolute",
          left: PANEL_PAD,
          top: PANEL_PAD,
          width: PANEL_INNER_W,
          height: 68,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: RN.hover,
            border: `1px solid ${RN.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconBrain size={36} color={RN.textWarm} />
        </div>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 46,
            fontWeight: 600,
            color: RN.text,
            letterSpacing: -0.4,
          }}
        >
          {UI.memory.title}
        </div>
      </div>

      {/* supporting line */}
      <div
        style={{
          position: "absolute",
          left: PANEL_PAD,
          top: 136,
          width: PANEL_INNER_W,
          fontFamily: FONT_SANS,
          fontSize: 30,
          lineHeight: 1.4,
          color: RN.muted,
        }}
      >
        {UI.memory.line}
      </div>

      {/* section list — Design System active */}
      <div
        style={{
          position: "absolute",
          left: PANEL_PAD,
          top: 250,
          width: PANEL_INNER_W,
        }}
      >
        {UI.memory.sections.map((sec, i) => {
          const isActive = i === 2;
          const at = 258 + i * 4;
          const rowO = interpolate(f, [at, at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={sec}
              style={{
                height: 52,
                marginBottom: i === UI.memory.sections.length - 1 ? 0 : 8,
                borderRadius: 14,
                paddingLeft: 20,
                paddingRight: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isActive ? RN.cyanSoft : "transparent",
                opacity: rowO,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 32,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? RN.cyan : RN.muted,
                }}
              >
                {sec}
              </div>
              {isActive ? (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: RN.cyan,
                    opacity: 0.35 + 0.65 * glow,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* add a memory */}
      <div
        style={{
          position: "absolute",
          left: PANEL_PAD,
          top: ADD_TOP,
          height: 60,
          paddingLeft: 26,
          paddingRight: 32,
          borderRadius: 999,
          backgroundColor: RN.ink,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: interpolate(f, [266, 278], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <IconPlus size={26} color="#FFFFFF" />
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 30,
            fontWeight: 500,
            color: "#FFFFFF",
          }}
        >
          {UI.memory.add}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const RnP3AsksAndRemembers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // One shared camera timeline: hold -> move -> hold
  const KEY_T = [0, 24, 42, 134, 152, 190, 197, 202, 214, 252, 272, 289];
  const fx = interpolate(
    frame,
    KEY_T,
    [852, 852, 850, 850, 850, 850, 850, 850, 850, 850, 850, 850],
    { easing: ease, extrapolateRight: "clamp" },
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [950, 950, 850, 850, 760, 760, 1580, 1580, 2464, 2464, 2275, 2272],
    { easing: ease, extrapolateRight: "clamp" },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.22, 1.22, 1.06, 1.06, 1.18, 1.18, 0.76, 0.76, 1.28, 1.28, 1.1, 1.105],
    { easing: ease, extrapolateRight: "clamp" },
  );

  // Ambient purple light on the dark ground — breathes, never fades out.
  const breathe = 0.92 + 0.08 * Math.sin(frame / 45);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AbsoluteFill
        style={{
          opacity: breathe,
          backgroundImage: [
            `radial-gradient(58% 32% at 50% 42%, ${rgba(ALTARI.primary, 0.32)} 0%, ${rgba(ALTARI.primary, 0.11)} 46%, ${rgba(ALTARI.primary, 0)} 78%)`,
            `radial-gradient(78% 42% at 50% 104%, ${rgba(ALTARI.primaryDeep, 0.5)} 0%, ${rgba(ALTARI.primaryDeep, 0)} 72%)`,
          ].join(", "),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* 64x64 backdrop grid, parented to the world so the camera moves
            through it. Over-sized so it covers the frame at every station. */}
        <GridLayer
          size={ALTARI_GRID.backdrop}
          color={rgba(ALTARI.border, 0.5)}
          inset={-1216}
        />
        <QuestionCard frame={frame} fps={fps} />
        <MemoryPanel frame={frame} fps={fps} />
        <BrandCard frame={frame} fps={fps} />
        <FlyingValues frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
