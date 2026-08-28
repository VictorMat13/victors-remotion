import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_MONO, FONT_SANS, LW, RN, SKILL_FILE, UI, safePadX } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP5WroteItsOwnInstructions — 1080x1080 @ 30fps (1:1)
//
// VO p5a: "First, it wrote its own instructions."
// VO p5b: "Then it transcribed my video."
// Neither line is drawn. Nothing on screen restates the narration.
//
// SCREEN-RECORDING BUILD (v2). Victor, 2026-08-28: "the remotions don't look
// enough like actual screen recordings." v1 rebuilt the Skills page as floating
// white cards. This version composites onto the REAL page instead.
//
// ---------------------------------------------------------------------------
// BASE PLATE — public/kshorts/reference/06-skills-clean.png
//
// The briefed plate (06-skills.png) could not be used: in that capture the whole
// Runable page sits behind the first-run onboarding modal, so every pixel of the
// Skills page is backdrop-BLURRED and a "Got it" dialog covers the middle of the
// frame. Unusable as a base layer.
//
// So the same real page was re-captured from the same live logged-in account on
// 2026-08-28 over CDP: runable.com/skills, 1600x1200 viewport at DPR 2 (asset is
// 3200x2400 so 14px UI type stays crisp under the camera zoom). Onboarding
// already dismissed. Same sidebar, same Customize sub-nav, same banner, same
// search + "Create a Skill", same Active Skills grid — just sharp, and tall
// enough to give the camera vertical room to scroll.
//
// GEOMETRY BELOW WAS MEASURED OFF THAT CAPTURE, not guessed:
//   grid columns  x = 482 and 936, card 441.5 x 150, row pitch 162.5
//   card chrome   radius 12, 1px rgba(0,0,0,0.05), fill = page bg (#FEFDFB)
//   title         14px / 500 / #060606 / lh 20.3, inset 16
//   description   12px / 400 / #6B5A50 / lh 16.2, clamped to 2 lines
//   divider       410px gradient hairline, peak rgba(0,0,0,0.09)
//   toggle        32 x 18.4 pill, 16px white knob, ON fill sampled at #3D8997
//
// The "Official" seal + label and the "On" caption on the new row are not
// redrawn at all — they are the REAL pixels, borrowed out of the plate through a
// clipped window at the identical offset, so that half of the footer cannot
// drift from its neighbours.
//
// TOGGLE COLOUR: the brief asked for RN.cyan on the new row. #3D8997 IS what
// RN.cyan renders as on this page (sampled straight out of the capture) — using
// the token value #00B7CA would have made the new row's toggle visibly brighter
// than the eight real toggles beside it and betrayed the composite. RN.cyan is
// used for the snap-on glow ring, which is drawn, not captured.
//
// ---------------------------------------------------------------------------
// BEAT
//   0-12    HOLD. Cursor drifts up to "Create a Skill", pauses, presses.
//   14      The grid REFLOWS, on one frame, the way a real re-render does.
//           Nine real cards are sprites cut from the plate; each jumps from cell
//           p to cell p+1 (one column right, wrapping to the next row) exactly as
//           a two-column CSS grid relays out when a node is inserted at the head.
//           This is deliberately NOT tweened: cell p -> p+1 sends the left column
//           right and the right column left, so tweened cards fly through each
//           other. Browsers do not do that, and neither does this.
//   14-24   The new row springs into the cell the list opened up.
//   22-44   SKILL_FILE.name types itself, caret blinking.
//   44-58   SKILL_FILE.desc fills in beneath and clamps to two lines like the
//           real rows do.
//   58-66   The toggle flips: knob slides, fill lerps grey -> the page's cyan,
//           a soft RN.cyan ring snaps and decays, "On" fades in beside it.
//   66-74   Settled hold.
//   74-88   TRANSITION, not a cut: the page scrolls down under the camera while
//           a sheet rises from the bottom edge — same surface, same hairlines,
//           same type as the app around it.
//   86-112  Timestamped lines stream into the sheet, the list auto-scrolls and
//           the scrollbar thumb rides down.
//   112-120 Settled. Caret blinks, the header timecode keeps ticking.
//
// DO_NOT_RENDER: "Victor Matevski" in the sidebar footer is (a) far outside the
// camera window for the whole comp and (b) covered in plate space regardless.
// ============================================================================

export const DURATION_IN_FRAMES = 120;

const PLATE = "kshorts/reference/06-skills-clean.png";

// ------------------------------------------------------------- base plate
const SRC_W = 1600;
const SRC_H = 1200;

// Fixed zoom, no cut: the capture fills the frame and the camera only scrolls.
// 1.16 is the largest zoom that still keeps the whole skill row (482 -> 923.5)
// inside the 5% safe margins while leaving the "Create a Skill" click target on
// screen. Plate px -> screen px.
const ZOOM = 1.16;
const P = (v: number) => v * ZOOM;

const FOCAL_X = 901;
const FOCAL_Y_A = 465.6; // top of the page in view
const FOCAL_Y_B = 545; // after the beat-2 scroll

// ------------------------------------------------- Active Skills grid, measured
const CELL_X = [482, 936] as const;
const CELL_Y0 = 394;
const CELL_PITCH = 162.5;
const CARD_W = 441.5;
const CARD_H = 150;
const REAL_CARDS = 9; // remotion-best-practices ... motion-video

const cellX = (i: number) => CELL_X[i % 2];
const cellY = (i: number) => CELL_Y0 + Math.floor(i / 2) * CELL_PITCH;

// --------------------------------------------------------- card internals
const PAD_X = 16;
const TITLE_TOP = 17.7; // calibrated against the real row's rendered ink
const DESC_TOP = 50.0;
const DIV_TOP = 100.5; // where the hairline lands under a two-line description
const CONTENT_W = CARD_W - PAD_X * 2;

// The new row sits in cell 0, which is where the plate's first real card was —
// so every borrowed footer fragment lands at its own original coordinates.
const NX = CELL_X[0];
const NY = CELL_Y0;

// Real pixels borrowed out of the plate for the footer.
const SEAL_SRC = { x: 494, y: 503.5, w: 80, h: 29 }; // seal glyph + "Official"
const ON_SRC = { x: 843, y: 503.5, w: 30, h: 29 }; // the "On" caption

// Toggle, sampled off the eight real ones.
const TOG = { x: 875.5, y: 508.3, w: 32, h: 18.4 };
const KNOB = 16;
const KNOB_OFF = 1.2;
const KNOB_ON = TOG.w - KNOB - 1.2;
const TOG_OFF_FILL = "#BFBEBC"; // rgba(0,0,0,0.25) resolved over the page bg
const TOG_ON_FILL = "#3D8997"; // RN.cyan as this page actually paints it

// "Create a Skill", measured off the banner.
const BTN = { x: 1217.9, y: 262.7, w: 135.1, h: 34.3 };

// ------------------------------------------------------------------ timing
const CLICK_F = 12;
const REFLOW_F = 14;
const CARD_IN_F = 14;
const TYPE_F = 22;
const TYPE_END = 44;
const DESC_F = 44;
const DESC_END = 58;
const TOGGLE_F = 58;
const TOGGLE_END = 66;
const SHEET_F = 74;
const SHEET_END = 88;
const STREAM_F = 86;
const STREAM_END = 112;

// ============================================================== beat 2 panel
// There is no real transcript capture, so this sheet is drawn — but drawn in the
// app's own language: same near-white surface, same hairline, same IDGrotesk,
// with the timecodes in FONT_MONO. The speech itself is deliberately NOT written
// out: inventing dialogue would put words on screen that were never said, and
// paraphrasing the VO is banned. Instead every row carries word-shaped bars
// beside a real-shaped timecode, so the panel reads as a dense wall of talk.

const SHEET_X = safePadX(1080); // 54
const SHEET_W = 1080 - SHEET_X * 2; // 972
const SHEET_TOP = 300;
const SHEET_PAD = 32;
const TC_X = SHEET_X + SHEET_PAD; // timecode column
const BAR_X = TC_X + 100; // where speech starts
const BAR_MAX = SHEET_X + SHEET_W - SHEET_PAD - 22; // leaves the scrollbar room
const ROW_PITCH = 52;
const LIST_TOP = SHEET_TOP + 92;
const LIST_H = 1080 - LIST_TOP;
const TOTAL_ROWS = 24;

// Deterministic layout — mulberry32, seeded once at module scope so the panel is
// byte-identical on every render and never shimmers between frames.
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const timecode = (sec: number) =>
  `00:${pad2(Math.floor(sec / 60))}:${pad2(Math.floor(sec % 60))}`;

type Row = { tc: string; lines: number[][] };

const ROWS: Row[] = (() => {
  const rnd = mulberry32(0x5f2a91);
  const out: Row[] = [];
  let t = 4;
  const width = BAR_MAX - BAR_X;
  for (let i = 0; i < TOTAL_ROWS; i++) {
    const lineCount = rnd() < 0.62 ? 2 : 1;
    const lines: number[][] = [];
    for (let l = 0; l < lineCount; l++) {
      const words: number[] = [];
      // A short trailing line reads like the end of a sentence.
      const budget = l === lineCount - 1 && lineCount === 2 ? width * (0.32 + rnd() * 0.45) : width;
      let used = 0;
      for (;;) {
        const w = 26 + Math.round(rnd() * 68);
        if (used + w > budget) break;
        words.push(w);
        used += w + 11;
      }
      if (words.length === 0) words.push(34);
      lines.push(words);
    }
    out.push({ tc: timecode(t), lines });
    t += 4 + Math.round(rnd() * 6);
  }
  return out;
})();

// ============================================================================

export const KsP5WroteItsOwnInstructions: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- camera: one fixed zoom, one scroll. Hold -> move -> hold. ----------
  const focalY = interpolate(
    frame,
    [0, SHEET_F, SHEET_END, DURATION_IN_FRAMES],
    [FOCAL_Y_A, FOCAL_Y_A, FOCAL_Y_B, FOCAL_Y_B],
    { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" },
  );

  const plateLeft = width / 2 - FOCAL_X * ZOOM;
  const plateTop = height / 2 - focalY * ZOOM;

  // Station-A mapping, used to place the pointer. A real pointer lives in screen
  // space and does not travel with the page when it scrolls.
  const aLeft = width / 2 - FOCAL_X * ZOOM;
  const aTop = height / 2 - FOCAL_Y_A * ZOOM;
  const sx = (px: number) => aLeft + px * ZOOM;
  const sy = (py: number) => aTop + py * ZOOM;

  // ---- pointer -----------------------------------------------------------
  const curX = interpolate(
    frame,
    [0, 9, 30, 46, SHEET_F, SHEET_END, DURATION_IN_FRAMES],
    [sx(1130), sx(1285.5), sx(1285.5), sx(700), sx(700), 1000, 1000],
    { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" },
  );
  const curY = interpolate(
    frame,
    [0, 9, 30, 46, SHEET_F, SHEET_END, DURATION_IN_FRAMES],
    [sy(470), sy(280), sy(280), sy(560), sy(560), 690, 690],
    { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" },
  );

  // ---- "Create a Skill": hover, then the :active flash -------------------
  const btnWash = interpolate(
    frame,
    [8, 10, CLICK_F, CLICK_F + 1, CLICK_F + 5, CLICK_F + 12],
    [0, 0.05, 0.05, 0.17, 0.06, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ---- the new row -------------------------------------------------------
  const cardIn = spring({
    frame: frame - CARD_IN_F,
    fps,
    config: { damping: 200, stiffness: 120 },
    durationInFrames: 10,
  });

  const nameChars = Math.round(
    interpolate(frame, [TYPE_F, TYPE_END], [0, SKILL_FILE.name.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedName = SKILL_FILE.name.slice(0, nameChars);

  const descChars = Math.round(
    interpolate(frame, [DESC_F, DESC_END], [0, SKILL_FILE.desc.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedDesc = SKILL_FILE.desc.slice(0, descChars);

  const caretOn = Math.floor(frame / 8) % 2 === 0 ? 1 : 0;
  const nameCaret = frame >= TYPE_F && frame < DESC_F ? caretOn : 0;
  const descCaret = frame >= DESC_F && frame < DESC_END ? caretOn : 0;

  const flip = spring({
    frame: frame - TOGGLE_F,
    fps,
    config: { damping: 18, stiffness: 220 },
    durationInFrames: 8,
  });
  const togFill = interpolateColors(flip, [0, 1], [TOG_OFF_FILL, TOG_ON_FILL]);
  const knobLeft = KNOB_OFF + (KNOB_ON - KNOB_OFF) * flip;
  const snapRing = interpolate(
    frame,
    [TOGGLE_F + 2, TOGGLE_F + 5, TOGGLE_F + 9],
    [0, 0.42, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const onLabel = interpolate(frame, [TOGGLE_F + 3, TOGGLE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- beat 2 ------------------------------------------------------------
  const sheetY = interpolate(frame, [SHEET_F, SHEET_END], [1140, SHEET_TOP], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scrim = interpolate(frame, [SHEET_F, SHEET_END], [0, 0.26], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rowsFloat = interpolate(frame, [STREAM_F, STREAM_END], [14, TOTAL_ROWS], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rowsIn = Math.min(TOTAL_ROWS, Math.ceil(rowsFloat));
  const perView = LIST_H / ROW_PITCH;
  const contentH = TOTAL_ROWS * ROW_PITCH;
  const scrollMax = Math.max(1, contentH - LIST_H);
  const scrollY = Math.max(0, (rowsFloat - perView + 0.6) * ROW_PITCH);
  const thumbTrack = LIST_H - 24;
  const thumbH = Math.max(56, thumbTrack * (LIST_H / contentH));
  const thumbY =
    LIST_TOP + 12 + (thumbTrack - thumbH) * Math.min(1, scrollY / scrollMax);

  const headTc = ROWS[Math.max(0, rowsIn - 1)].tc;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* Opaque floor: no frame can be black, even before the plate decodes. */}
      <AbsoluteFill style={{ backgroundColor: RN.bg }} />

      {/* ============================================== the real screen ==== */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: plateLeft,
            top: plateTop,
            width: P(SRC_W),
            height: P(SRC_H),
          }}
        >
          <Img
            src={staticFile(PLATE)}
            style={{
              position: "absolute",
              inset: 0,
              width: P(SRC_W),
              height: P(SRC_H),
              maxWidth: "none",
            }}
          />

          {/* DO_NOT_RENDER — the signed-in name in the sidebar footer. Far off
              camera for the whole comp; covered here as well so no reframe can
              ever surface it. Avatar and the two footer icons stay. */}
          <div
            style={{
              position: "absolute",
              left: P(44),
              top: P(1150),
              width: P(128),
              height: P(44),
              backgroundColor: "#F4F1EF",
            }}
          />

          {/* ---- the Active Skills grid, re-laid so a row can be inserted ----
              Everything below the heading is repainted in page background and
              then rebuilt out of the plate's own pixels: card p is a clipped
              window on the capture, translated from cell p to cell p+1. Before
              REFLOW_F every sprite sits on its own source pixels, so this layer
              is identical to the untouched plate. */}
          <div
            style={{
              position: "absolute",
              left: P(468),
              top: P(386),
              width: P(SRC_W - 468),
              height: P(SRC_H - 386),
              backgroundColor: RN.bg,
            }}
          />

          {new Array(REAL_CARDS).fill(0).map((_, i) => {
            const j = i + (frame >= REFLOW_F ? 1 : 0);
            const x = cellX(j);
            const y = cellY(j);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: P(x - 1),
                  top: P(y - 1),
                  width: P(CARD_W + 2),
                  height: P(CARD_H + 2),
                  overflow: "hidden",
                }}
              >
                <Img
                  src={staticFile(PLATE)}
                  style={{
                    position: "absolute",
                    left: P(-(cellX(i) - 1)),
                    top: P(-(cellY(i) - 1)),
                    width: P(SRC_W),
                    height: P(SRC_H),
                    maxWidth: "none",
                  }}
                />
              </div>
            );
          })}

          {/* ------------------------------- the row the agent writes itself */}
          <div
            style={{
              position: "absolute",
              left: P(NX),
              top: P(NY),
              width: P(CARD_W),
              height: P(CARD_H),
              borderRadius: P(12),
              border: `${P(1)}px solid rgba(0,0,0,0.05)`,
              boxSizing: "border-box",
              opacity: cardIn,
              transform: `scale(${0.985 + 0.015 * cardIn})`,
              transformOrigin: "50% 0%",
            }}
          >
            {/* name */}
            <div
              style={{
                position: "absolute",
                left: P(PAD_X),
                top: P(TITLE_TOP),
                width: P(CONTENT_W),
                fontFamily: FONT_SANS,
                fontSize: P(14),
                fontWeight: 500,
                lineHeight: `${P(20.3)}px`,
                color: "#060606",
                whiteSpace: "nowrap",
              }}
            >
              {typedName}
              <span
                style={{
                  display: "inline-block",
                  width: P(1.4),
                  height: P(13),
                  marginLeft: P(1.5),
                  verticalAlign: P(-1.5),
                  backgroundColor: "#060606",
                  opacity: nameCaret,
                }}
              />
            </div>

            {/* description — clamps to two lines exactly like the real rows */}
            <div
              style={{
                position: "absolute",
                left: P(PAD_X),
                top: P(DESC_TOP),
                width: P(CONTENT_W),
                fontFamily: FONT_SANS,
                fontSize: P(12),
                fontWeight: 400,
                lineHeight: `${P(16.2)}px`,
                color: RN.muted,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {typedDesc}
              <span
                style={{
                  display: "inline-block",
                  width: P(1.4),
                  height: P(11),
                  marginLeft: P(1.5),
                  verticalAlign: P(-1),
                  backgroundColor: RN.muted,
                  opacity: descCaret,
                }}
              />
            </div>

            {/* the faded hairline the real cards carry above their footer */}
            <div
              style={{
                position: "absolute",
                left: P(PAD_X),
                top: P(DIV_TOP),
                width: P(CONTENT_W),
                height: P(1),
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0) 100%)",
              }}
            />
          </div>

          {/* Footer of the new row. The seal glyph and both captions are the
              plate's own pixels, clipped out at the identical offset — the only
              part of this row that is drawn is the toggle, because it moves. */}
          <div style={{ opacity: cardIn }}>
            <div
              style={{
                position: "absolute",
                left: P(SEAL_SRC.x),
                top: P(SEAL_SRC.y),
                width: P(SEAL_SRC.w),
                height: P(SEAL_SRC.h),
                overflow: "hidden",
              }}
            >
              <Img
                src={staticFile(PLATE)}
                style={{
                  position: "absolute",
                  left: P(-SEAL_SRC.x),
                  top: P(-SEAL_SRC.y),
                  width: P(SRC_W),
                  height: P(SRC_H),
                  maxWidth: "none",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: P(ON_SRC.x),
                top: P(ON_SRC.y),
                width: P(ON_SRC.w),
                height: P(ON_SRC.h),
                overflow: "hidden",
                opacity: onLabel,
              }}
            >
              <Img
                src={staticFile(PLATE)}
                style={{
                  position: "absolute",
                  left: P(-ON_SRC.x),
                  top: P(-ON_SRC.y),
                  width: P(SRC_W),
                  height: P(SRC_H),
                  maxWidth: "none",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: P(TOG.x),
                top: P(TOG.y),
                width: P(TOG.w),
                height: P(TOG.h),
                borderRadius: P(TOG.h / 2),
                boxSizing: "border-box",
                border: `${P(0.5)}px solid rgba(0,0,0,0.06)`,
                backgroundColor: togFill,
                boxShadow: `0 0 0 ${P(3.4)}px rgba(0,183,202,${snapRing})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: P(knobLeft),
                  top: P((TOG.h - KNOB) / 2),
                  width: P(KNOB),
                  height: P(KNOB),
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>
          </div>

          {/* ---------------------------- "Create a Skill" hover / :active --- */}
          <div
            style={{
              position: "absolute",
              left: P(BTN.x),
              top: P(BTN.y),
              width: P(BTN.w),
              height: P(BTN.h),
              borderRadius: P(BTN.h),
              backgroundColor: `rgba(255,255,255,${btnWash})`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* ================================================= beat 2: the sheet */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(23,20,14,${scrim})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: SHEET_X,
          top: sheetY,
          width: SHEET_W,
          height: 1080 - SHEET_TOP + 60,
          backgroundColor: RN.card,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          border: "1px solid rgba(0,0,0,0.06)",
          borderBottom: "none",
          boxSizing: "border-box",
          boxShadow: "0 -18px 48px rgba(23,20,14,0.12)",
          overflow: "hidden",
        }}
      >
        {/* header — a real task name and a real-shaped timecode, nothing else */}
        <div
          style={{
            position: "absolute",
            left: SHEET_PAD,
            top: 34,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: RN.amber,
            }}
          />
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 17,
              fontWeight: 500,
              color: RN.text,
            }}
          >
            {UI.taskName}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: SHEET_PAD,
            top: 36,
            fontFamily: FONT_MONO,
            fontSize: 15,
            color: "rgba(107,90,80,0.62)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {headTc}
        </div>
        <div
          style={{
            position: "absolute",
            left: SHEET_PAD - 8,
            right: SHEET_PAD - 8,
            top: 76,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.06)",
          }}
        />

        {/* the stream */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: LIST_TOP - SHEET_TOP,
            height: LIST_H,
            overflow: "hidden",
          }}
        >
          {ROWS.slice(0, rowsIn).map((row, i) => {
            const top = i * ROW_PITCH - scrollY;
            if (top < -ROW_PITCH || top > LIST_H) return null;
            const age = rowsFloat - i;
            const fade = interpolate(age, [0, 0.9], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isNewest = i === rowsIn - 1;
            return (
              <div key={i} style={{ position: "absolute", left: 0, top, opacity: fade }}>
                <div
                  style={{
                    position: "absolute",
                    left: TC_X - SHEET_X,
                    top: 7,
                    fontFamily: FONT_MONO,
                    fontSize: 15,
                    color: "rgba(107,90,80,0.55)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.tc}
                </div>
                {row.lines.map((words, li) => {
                  let x = BAR_X - SHEET_X;
                  return words.map((w, wi) => {
                    const left = x;
                    x += w + 11;
                    const last =
                      isNewest && li === row.lines.length - 1 && wi === words.length - 1;
                    const grow = last
                      ? interpolate(age, [0, 0.85], [0.15, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        })
                      : 1;
                    return (
                      <div
                        key={`${li}-${wi}`}
                        style={{
                          position: "absolute",
                          left,
                          top: 11 + li * 20,
                          width: w * grow,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: `rgba(12,9,6,${(
                            0.15 + ((w * 7 + wi * 13 + li * 5) % 9) * 0.011
                          ).toFixed(3)})`,
                        }}
                      />
                    );
                  });
                })}
                {isNewest ? (
                  <div
                    style={{
                      position: "absolute",
                      left:
                        BAR_X -
                        SHEET_X +
                        row.lines[row.lines.length - 1].reduce((a, b) => a + b + 11, 0) -
                        5,
                      top: 9 + (row.lines.length - 1) * 20,
                      width: 2,
                      height: 14,
                      backgroundColor: "rgba(6,6,6,0.45)",
                      opacity: caretOn,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* scrollbar — the thumb rides down as the list follows the newest line */}
        <div
          style={{
            position: "absolute",
            left: SHEET_W - SHEET_PAD + 6,
            top: thumbY - SHEET_TOP,
            width: 5,
            height: thumbH,
            borderRadius: 3,
            backgroundColor: "rgba(0,0,0,0.16)",
          }}
        />
      </div>

      {/* ============================================================ pointer */}
      <svg
        width={26}
        height={34}
        viewBox="0 0 26 34"
        style={{
          position: "absolute",
          left: curX - 2,
          top: curY - 1.5,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        }}
      >
        <path
          d="M2 1.5 L2 25.5 L8.2 19.8 L12.3 28.8 L16.4 26.9 L12.3 18.2 L20.6 18.2 Z"
          fill="#FFFFFF"
          stroke="#1A1A1A"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>

      {/* A whisper of vignette so the composite reads as footage, never dark
          enough to threaten the black-frame gate. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, rgba(0,0,0,0) 62%, rgba(23,20,14,0.07) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
