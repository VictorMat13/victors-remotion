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
import { FONT_SANS, LW, RN, SHOTS, SPRINGS, UI, VO } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP1BuildMeAnAgent — 1080x1080 @ 30fps (1:1) · VO.p1 (spoken; the same words
// also stand on screen because they are the user's own input inside the
// product, typed into Runable's composer).
//
// SCREEN-RECORDING BUILD (v2). Victor, 2026-08-28: "the remotions don't look
// enough like actual screen recordings."
//
// v1 rebuilt Runable's composer as a floating white card in a warm-white world.
// That reads as a designed graphic. This version uses the REAL capture as the
// base plate — public/kshorts/reference/10-composer-typed.png, the live Build
// tab at a 1600x1000 viewport — bled to all four edges, and animates on top of
// it. Every pixel of chrome (sidebar, top bar, heading, Agent|Ask, Auto, Plan,
// the feature rack) is genuine capture, never a rebuild.
//
// Three things are painted over the plate, all sampled from the plate itself so
// the composite is seamless:
//   1. the typed prompt          -> covered with the field fill (#F9F6F4) and
//                                   re-typed live in matching type
//   2. the "Free plan / Upgrade" pill -> covered with the page fill (#FEFDFB).
//                                   DO_NOT_RENDER entry 1.
//   3. the "Victor Matevski" account row -> covered with the sidebar fill
//                                   (#F4F1EF). DO_NOT_RENDER entry 2: this is
//                                   Koen's world, never Victor's.
// The submit button is covered too, so the mic -> black-arrow swap and the
// press can actually animate instead of sitting frozen in the pixels.
//
// Every colour above was read off the PNG with a pixel probe, not eyeballed:
//   page #FEFDFB · sidebar #F4F1EF · sidebar edge #F1F0EE · field #F9F6F4
//   field border #E9E2DD · prompt ink #060606 · submit #170F09 · muted #685B52
//
// CAMERA — a 1:1 reframe of a 16:10 recording, which is what an editor actually
// does to a capture. Anchored so the app's top-left corner is the frame's
// top-left corner at the wide end; the window never leaves the plate, so no
// synthetic page is ever invented.
//   0-22    HOLD  z1.10, window src(0,0)-(982,982) — whole sidebar, top bar,
//                 heading, composer running off the right edge. Empty field,
//                 caret blinking, mic in the submit slot.
//   22-46   MOVE 24f, Easing.inOut(cubic) — push in and pan right onto the
//                 composer. 46-58 settles out of the move.
//   50-116  HOLD  z1.40, window src(386,0)-(1157,771). The sentence types
//                 itself into the real field; the black submit arrow springs in
//                 on the first keystroke.
//   108-130 the cursor comes up from off-frame and lands on the arrow.
//   130-136 hover (button lifts). 136 press. 140 release.
//   140-165 settled hold, 25f — ripple out, submit spinner turning, caret
//                 still blinking. Clean cut point for the editor.
// ============================================================================

export const DURATION_IN_FRAMES = 165;

// ------------------------------------------------------------- the base plate
const SRC_W = 1600;
const SRC_H = 1000;

// Colours sampled off 10-composer-typed.png.
const PAGE = "#FEFDFB"; // main app background
const SIDEBAR = "#F4F1EF"; // left nav panel
const FIELD = "#F9F6F4"; // composer well fill
const SUBMIT_INK = "#170F09"; // the black submit disc

// Composer geometry in source pixels (borders at these exact rows/columns).
const BOX_L = 452;
const BOX_R = 1091;

// The prompt's own type block, measured glyph-by-glyph off the capture:
// line 1 cap-top y=416, baseline y=429; line 2 cap-top y=440, baseline y=453;
// both lines start at x=465.5; line 1 ends at x=1038.
const TEXT_X = 465.5;
const TEXT_TOP = 411.1; // line-box top so the cap-top lands on 416
const LINE_H = 24;
const FONT_PX = 17.05;
const TRACK = -0.525;
const CARET_W = 1.6;
const CARET_H = 16.6;

// The black submit disc: centre (1062.5, 488.5), diameter 32.
const SUB_CX = 1062.5;
const SUB_CY = 488.5;
const SUB_D = 32;

// ------------------------------------------------------------------- camera
const KEY_T = [0, 22, 46, 58, DURATION_IN_FRAMES];
const KEY_Z = [1.1, 1.1, 1.404, 1.4, 1.404];
const KEY_FX = [490.91, 490.91, 772.6, 771.5, 772.4];
const KEY_FY = [490.91, 490.91, 386.6, 385.71, 387.6];

// -------------------------------------------------------------- beat clock
const PROMPT = VO.p1;
const BREAK = PROMPT.indexOf("YouTube channel"); // the capture wraps here
const LINE1 = PROMPT.slice(0, BREAK - 1);
const TYPE_START = 50;
const TYPE_END = 116;
const SWAP = 52; // mic -> black arrow, first keystroke lands
const REACH = 108; // cursor starts coming up for the button
const LAND = 130;
const PRESS = 136;
const RELEASE = 140;

const ease = Easing.inOut(Easing.cubic);
const easeQ = Easing.inOut(Easing.quad);
const iv = (
  f: number,
  range: readonly number[],
  out: readonly number[],
  e: (t: number) => number = ease,
) =>
  interpolate(f, range as number[], out as number[], {
    easing: e,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const typedCount = (f: number) =>
  Math.round(
    iv(
      f,
      [TYPE_START, 62, 74, 82, 96, 108, TYPE_END],
      [0, 14, 24, 42, 60, 82, PROMPT.length],
      Easing.linear,
    ),
  );

// The cursor rests off the bottom-right of the frame until it is needed, which
// is what a real pointer does while someone is typing.
const CUR_T = [0, REACH, 118, LAND, PRESS, PRESS + 2, RELEASE, DURATION_IN_FRAMES];
const CUR_X = [1150, 1150, 1105, SUB_CX, SUB_CX, SUB_CX, SUB_CX, SUB_CX];
const CUR_Y = [800, 800, 640, SUB_CY, SUB_CY, SUB_CY + 1.2, SUB_CY, SUB_CY];

// ------------------------------------------------------------------- pieces
/** An opaque patch in SOURCE space, filled with a colour read off the plate. */
const Patch: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  z: number;
}> = ({ x, y, w, h, fill, z }) => (
  <div
    style={{
      position: "absolute",
      left: x * z,
      top: y * z,
      width: w * z,
      height: h * z,
      backgroundColor: fill,
    }}
  />
);

const Caret: React.FC<{ on: number; z: number }> = ({ on, z }) => (
  <span
    style={{
      display: "inline-block",
      width: CARET_W * z,
      height: CARET_H * z,
      verticalAlign: `${-3.2 * z}px`,
      backgroundColor: RN.text,
      opacity: on,
    }}
  />
);

const Cursor: React.FC<{ x: number; y: number; squeeze: number }> = ({
  x,
  y,
  squeeze,
}) => (
  <svg
    width={26}
    height={34}
    viewBox="0 0 26 34"
    style={{
      position: "absolute",
      left: x - 2,
      top: y - 1.5,
      transform: `scale(${1 - 0.11 * squeeze})`,
      transformOrigin: "2px 1.5px",
      filter: "drop-shadow(0 2px 5px rgba(23,20,14,0.34))",
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
);

// ============================================================== composition
export const KsP1BuildMeAnAgent: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- camera: one reframe, then a settle and an almost-still drift --------
  const z = iv(frame, KEY_T, KEY_Z);
  const fx = iv(frame, KEY_T, KEY_FX);
  const fy = iv(frame, KEY_T, KEY_FY);
  const plateLeft = width / 2 - fx * z;
  const plateTop = height / 2 - fy * z;
  const toScreenX = (sx: number) => plateLeft + sx * z;
  const toScreenY = (sy: number) => plateTop + sy * z;

  // ---- the sentence typing itself -----------------------------------------
  const n = typedCount(frame);
  const striking = frame > TYPE_START && frame < TYPE_END && n > 0;
  const line1 = PROMPT.slice(0, Math.min(n, LINE1.length));
  const line2 = n > BREAK ? PROMPT.slice(BREAK, n) : "";
  const onLine2 = n > BREAK;
  // solid while keys are landing, blinking either side of the burst
  const caretOn = striking ? 1 : Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  // ---- mic -> black submit arrow ------------------------------------------
  const micOp = iv(frame, [SWAP - 4, SWAP + 2], [1, 0], easeQ);
  const discIn =
    frame <= SWAP
      ? 0
      : spring({ frame: frame - SWAP, fps, config: SPRINGS.snappy });

  // ---- hover, press, release ----------------------------------------------
  const hover = iv(frame, [LAND - 5, LAND + 1], [0, 1], easeQ);
  const push =
    frame < PRESS || frame > RELEASE
      ? 0
      : iv(frame, [PRESS, PRESS + 2, RELEASE], [0, 1, 0], easeQ);
  const rebound =
    frame < RELEASE
      ? 0
      : spring({
          frame: frame - RELEASE,
          fps,
          config: { damping: 11, stiffness: 210 },
        });
  const discScale =
    discIn * (1 + 0.075 * hover - 0.16 * push + 0.05 * rebound * (1 - rebound));
  const discLift = -2.2 * hover;
  const ripple = frame < PRESS || frame > PRESS + 11 ? -1 : frame - PRESS;

  // ---- submitted: the arrow keeps a slow amber arc turning -----------------
  const arcOp = iv(frame, [RELEASE + 2, RELEASE + 12], [0, 1], easeQ);
  const arcSpin = (frame - RELEASE) * 5.6;

  // ---- cursor --------------------------------------------------------------
  const curX = toScreenX(iv(frame, CUR_T, CUR_X, easeQ));
  const curY = toScreenY(iv(frame, CUR_T, CUR_Y, easeQ));
  const squeeze = frame >= PRESS && frame < RELEASE ? 1 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* Opaque page colour under everything: frame 0 to last, never black. */}
      <AbsoluteFill style={{ backgroundColor: PAGE }} />

      {/* ---------------------------------------------------- the real screen */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: plateLeft,
            top: plateTop,
            width: SRC_W * z,
            height: SRC_H * z,
          }}
        >
          <Img
            src={staticFile(SHOTS.composerTyped)}
            style={{
              position: "absolute",
              inset: 0,
              width: SRC_W * z,
              height: SRC_H * z,
              maxWidth: "none",
            }}
          />

          {/* DO_NOT_RENDER 1 — the "Free plan / Upgrade" pill (src 684..859 x
              258..293) goes back to page colour. */}
          <Patch x={678} y={252} w={188} h={48} fill={PAGE} z={z} />

          {/* DO_NOT_RENDER 2 — the account row bottom-left. The sidebar's 1px
              right edge at x=259 is left untouched so the panel keeps its
              boundary. */}
          <Patch x={0} y={936} w={259} h={SRC_H - 936} fill={SIDEBAR} z={z} />

          {/* The prompt baked into the capture, back to field colour. Stops
              4px inside the well's rounded top and its side borders. */}
          <Patch
            x={BOX_L + 2}
            y={403}
            w={BOX_R - BOX_L - 4}
            h={60}
            fill={FIELD}
            z={z}
          />

          {/* The baked submit disc + its drop shadow, so the button can act. */}
          <Patch x={1044} y={464} w={40} h={48} fill={FIELD} z={z} />

          {/* ------------------------------------ placeholder (empty field) */}
          {n === 0 ? (
            <div
              style={{
                position: "absolute",
                left: TEXT_X * z,
                top: TEXT_TOP * z,
                whiteSpace: "pre",
                fontSize: FONT_PX * z,
                lineHeight: `${LINE_H * z}px`,
                letterSpacing: TRACK * z,
                fontWeight: 400,
                color: RN.muted,
              }}
            >
              {UI.placeholder}
            </div>
          ) : null}

          {/* ---------------------------------- the sentence being typed in */}
          <div
            style={{
              position: "absolute",
              left: TEXT_X * z,
              top: TEXT_TOP * z,
              whiteSpace: "pre",
              fontSize: FONT_PX * z,
              lineHeight: `${LINE_H * z}px`,
              letterSpacing: TRACK * z,
              fontWeight: 400,
              color: RN.text,
            }}
          >
            {line1}
            {onLine2 ? null : <Caret on={caretOn} z={z} />}
          </div>
          {onLine2 ? (
            <div
              style={{
                position: "absolute",
                left: TEXT_X * z,
                top: (TEXT_TOP + LINE_H) * z,
                whiteSpace: "pre",
                fontSize: FONT_PX * z,
                lineHeight: `${LINE_H * z}px`,
                letterSpacing: TRACK * z,
                fontWeight: 400,
                color: RN.text,
              }}
            >
              {line2}
              <Caret on={caretOn} z={z} />
            </div>
          ) : null}

          {/* --------------------------------------------- the submit slot */}
          {micOp > 0 ? (
            <svg
              width={22 * z}
              height={22 * z}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: (SUB_CX - 11) * z,
                top: (SUB_CY - 11) * z,
                opacity: micOp,
              }}
            >
              <g
                fill="none"
                stroke={RN.muted}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x={9} y={2.6} width={6} height={11.4} rx={3} />
                <path d="M5.2 11.6 A6.8 6.8 0 0 0 18.8 11.6 M12 18.4 V21.4" />
              </g>
            </svg>
          ) : null}

          {ripple >= 0 ? (
            <div
              style={{
                position: "absolute",
                left: (SUB_CX - (SUB_D / 2 + ripple * 0.85)) * z,
                top: (SUB_CY - (SUB_D / 2 + ripple * 0.85)) * z,
                width: (SUB_D + ripple * 1.7) * z,
                height: (SUB_D + ripple * 1.7) * z,
                borderRadius: "50%",
                border: `${1.5 * z}px solid rgba(222,155,74,${(
                  0.5 *
                  (1 - ripple / 11)
                ).toFixed(3)})`,
                boxSizing: "border-box",
              }}
            />
          ) : null}

          {arcOp > 0 ? (
            <svg
              width={48 * z}
              height={48 * z}
              viewBox="0 0 48 48"
              style={{
                position: "absolute",
                left: (SUB_CX - 24) * z,
                top: (SUB_CY - 24 + discLift) * z,
                opacity: arcOp,
                transform: `rotate(${arcSpin}deg)`,
              }}
            >
              <circle
                cx={24}
                cy={24}
                r={20.4}
                fill="none"
                stroke={RN.amber}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeDasharray="30 98"
              />
            </svg>
          ) : null}

          {discIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: (SUB_CX - SUB_D / 2) * z,
                top: (SUB_CY - SUB_D / 2 + discLift) * z,
                width: SUB_D * z,
                height: SUB_D * z,
                borderRadius: "50%",
                backgroundColor: SUBMIT_INK,
                boxShadow: `0 ${(1.4 + 2.6 * hover) * z}px ${
                  (3 + 6 * hover) * z
                }px rgba(23,20,14,${0.18 + 0.12 * hover})`,
                transform: `scale(${discScale})`,
                transformOrigin: "50% 50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width={19 * z}
                height={19 * z}
                viewBox="0 0 24 24"
                style={{ display: "block" }}
              >
                <path
                  d="M5.5 12 H18.5 M12.8 6.3 L18.5 12 L12.8 17.7"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      {/* ------------------------------------------------------------ cursor */}
      <Cursor x={curX} y={curY} squeeze={squeeze} />

      {/* A whisper of vignette so the plate reads as footage, not a flat asset.
          Far too light to threaten the black-frame gate. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(122% 100% at 50% 44%, rgba(0,0,0,0) 62%, rgba(23,20,14,0.065) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
