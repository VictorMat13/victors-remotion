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
import { FONT_SANS, LW, RN, SHOTS } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP9NotJustYouTube — 1080x1080 @ 30fps (1:1) · THE CLOSER · 420f (14s)
//
// VO.p9a "Runable can actually help you automate growing your channels, and it
//         doesnt just post to YouTube, it can post to Instagram and TikTok too."
// VO.p9b "One sentence in Runable built that whole agent flow. Comment RUN and
//         I'll send you the link to try it."
// Spoken only. This file draws NO narration text.
//
// SCREEN-RECORDING BUILD (v2). Victor, 2026-08-28: "the remotions don't look
// enough like actual screen recordings." v1 was a floating-card build and is
// gone. This version composites onto the REAL captures, the way KsP2Insane does:
// the capture is the base plate, full-bleed, and everything else is an
// interaction drawn on top of it in the capture's own source-pixel space.
//
// Two base plates, one continuous session:
//   public/kshorts/reference/00-probe.png       Runable Grow tab, "Your handles"
//   public/kshorts/reference/10-composer-typed.png  Runable Build tab, composer
// Both are 1600x1000 captures of the SAME viewport, so the sidebar, the top bar
// and the Build|Grow toggle sit at identical pixels in both. Swapping the plate
// on the click of the "Build" tab therefore reads as a genuine page navigation:
// the chrome stays nailed down and only the content column changes.
//
// Every string on screen lives inside the captured pixels — the handle names,
// "Connect", the composer sentence — so nothing here can invent product copy or
// restate the narration. The only glyphs this file draws are a spinner, a check
// mark, a caret, a send arrow and the comment keyword RUN.
//
// BEATS
//   0-32     hold  · the real Grow page, wide. Cursor drifting.
//   32-54    MOVE  · push in to the "Your handles" rail (22f, inOut cubic)
//   54-208   hold  · three Connect buttons are clicked, one at a time, with a
//                    real pause before each: YouTube (82), Instagram (127),
//                    Tiktok (172). Each presses, spins, then resolves to a
//                    connected pill. The other five rows are left alone.
//   208-228  MOVE  · pull back and up until the Build|Grow toggle is in frame
//   228-258  hold  · cursor walks to the "Build" tab and clicks it (256);
//                    the page navigates at 258
//   258-272  hold  · the Build page, composer empty
//   272-290  MOVE  · push in to the composer
//   290-346  hold  · click into the field (294) and type VO.p1 back in — the
//                    same sentence the reel opened on. Hook and payoff rhyme.
//   346-356  hold  · caret blinks, cursor walks to the submit arrow, press (354)
//   356-420  hold  · the comment field rises, the pointer moves into it (377)
//                    and RUN types in. Settled from 392 to 420 (28f) so the
//                    editor can sit on the end card.
// ============================================================================

export const DURATION_IN_FRAMES = 420;

// ------------------------------------------------------------- the base plate
const SRC_W = 1600;
const SRC_H = 1000;

// Colours sampled straight out of the captures, so anything painted over the
// plate melts into it instead of reading as a sticker.
const PAGE_BG = "#FEFDFB"; // main canvas
const CARD_BG = "#F9F6F4"; // right-rail card + composer well
const SIDEBAR_BG = "#F4F1EF"; // left nav

// ------------------------------------------- 00-probe.png · "Your handles" rail
// Measured off the capture: card x 1284-1583 / y 340-749, rows on a 44px pitch,
// Connect pill 75x24 at x 1492.
const PILL = { x: 1492, y: 401, w: 75, h: 24, r: 10 };
const PILL_CX = PILL.x + PILL.w / 2;
// Instagram, Facebook, X / Twitter, Tiktok, LinkedIn, YouTube, Reddit, LINE
const ROW_Y = [413, 457, 501, 545, 589, 633, 677, 721];

// The three the VO names, in the order it names them. Everything else is left
// untouched — a real recording does not tidy up the rows nobody mentioned.
const CONNECTS = [
  { row: 5, click: 82 }, // YouTube
  { row: 0, click: 127 }, // Instagram
  { row: 3, click: 172 }, // Tiktok
];
const PRESS_F = 5; // pressed state
const SPIN_F = 19; // spinner runs until here, then the check resolves

// ---------------------------------- 10-composer-typed.png · the Build composer
// Composer well: x 452-1091 / y 398-517 in the capture.
const SUBMIT = { cx: 1062.5, cy: 488.5, r: 16 };
// Text lines, measured: line 1 ink y 417-432, line 2 ink y 441-452.
const L1_BAND = { top: 408, bottom: 437 };
const L2_BAND = { top: 437, bottom: 462 };
const TEXT_RIGHT = 1089; // inside the composer's right border (1091)

// Typing is revealed by uncovering the REAL typed pixels rather than redrawing
// the sentence, so the glyphs are the product's own. These are the columns in
// the capture where no glyph ink crosses — the cover edge snaps to them so the
// reveal never slices a letter in half. Extracted from the PNG, not guessed.
const STOPS1 = [
  464, 483, 487, 491, 501, 518, 528, 541, 550, 563, 582, 591, 598, 608, 618,
  626, 633, 644, 653, 659, 668, 677, 690, 699, 708, 720, 723, 733, 752, 759,
  769, 785, 797, 801, 807, 815, 819, 832, 841, 851, 863, 872, 884, 894, 903,
  917, 927, 935, 942, 950, 960, 970, 979, 992, 1003, 1012, 1038,
];
const STOPS2 = [
  464, 482, 491, 509, 519, 529, 541, 551, 560, 569, 579, 589, 592, 596,
];

// --------------------------------------------------------- DO_NOT_RENDER cover
// theme.ts bans the "Free plan / Upgrade" pill and Victor's name in the sidebar.
// Both are painted out in source space, so they can never survive a reframe.
const FREE_PLAN = { x: 679, y: 257, w: 186, h: 38 }; // pill sits at 683-860 / 261-290
const SIDEBAR_USER = { x: 6, y: 948, w: 254, h: 48 }; // name + avatar at 16-239 / 961-985

// ------------------------------------------------------------------- the camera
type Cam = { z: number; x: number; y: number };
const CAM_GROW_WIDE: Cam = { z: 1.3, x: 1175, y: 505 };
const CAM_RAIL: Cam = { z: 1.88, x: 1310, y: 544.5 };
const CAM_TOPNAV: Cam = { z: 1.2, x: 900, y: 452 };
const CAM_COMPOSER: Cam = { z: 1.52, x: 771.7, y: 457 };

const CAM_F = [0, 32, 54, 208, 228, 272, 290, DURATION_IN_FRAMES];
const camTrack = (k: keyof Cam) => [
  CAM_GROW_WIDE[k],
  CAM_GROW_WIDE[k],
  CAM_RAIL[k],
  CAM_RAIL[k],
  CAM_TOPNAV[k],
  CAM_TOPNAV[k],
  CAM_COMPOSER[k],
  CAM_COMPOSER[k],
];

// ------------------------------------------------------------------ the cursor
// Kept in SOURCE space and transformed with the plate, because the pointer is
// part of the recording — when the framing moves, the pointer moves with it.
// The last stop is the comment field: the camera is parked from f290, so this
// source point maps to screen (330, 992) — inside the field, right of the R.
const COMMENT_HIT = { x: 633.5, y: 754.4 };
const CUR_F = [
  0, 32, 54, 76, 84, 103, 121, 130, 148, 166, 175, 191, 210, 230, 246, 262, 272,
  288, 292, 302, 344, 352, 366, 376, DURATION_IN_FRAMES,
];
const CUR_X = [
  1020, 1120, 1200, PILL_CX, PILL_CX, PILL_CX, PILL_CX, PILL_CX, PILL_CX,
  PILL_CX, PILL_CX, PILL_CX, 1500, 1150, 891, 891, 891, 830, 700, 700, 690,
  SUBMIT.cx, SUBMIT.cx, COMMENT_HIT.x, COMMENT_HIT.x,
];
const CUR_Y = [
  380, 430, 505, 633, 633, 633, 413, 413, 413, 545, 545, 545, 560, 400, 25, 25,
  25, 200, 425, 425, 452, SUBMIT.cy, SUBMIT.cy, COMMENT_HIT.y, COMMENT_HIT.y,
];
const CLICKS = [82, 127, 172, 256, 294, 354, 377];

const NAV_SWAP = 258;
const TYPE_START = 296;
const TYPE_END = 346;
const SUBMIT_PRESS = 354;
const BAR_RISE = 356;
const RUN_KEYS = [380, 386, 392];

// ---------------------------------------------------------------- comment field
const BAR_H = 176;

const EASE_CAM = Easing.inOut(Easing.cubic);
const EASE_CUR = Easing.inOut(Easing.quad);

// ============================================================================

const ConnectPill: React.FC<{
  top: number;
  click: number;
  frame: number;
  fps: number;
}> = ({ top, click, frame, fps }) => {
  const t = frame - click;
  if (t < 0) return null;

  const pressed = t < PRESS_F;
  const spinning = t >= PRESS_F && t < SPIN_F;
  const settle = spring({
    frame: t - SPIN_F,
    fps,
    config: { damping: 22, stiffness: 200 },
    durationInFrames: 10,
  });

  const fill = pressed
    ? "#EDE8E4"
    : spinning
      ? CARD_BG
      : `rgba(29,162,90,${0.1 * settle})`;
  const border = pressed
    ? "rgba(0,0,0,0.16)"
    : spinning
      ? "rgba(0,0,0,0.10)"
      : `rgba(29,162,90,${0.12 + 0.2 * settle})`;

  return (
    <>
      {/* erase the captured "Connect" button — the card fill is flat here, so a
          hard-edged rect of the sampled colour leaves no seam */}
      <div
        style={{
          position: "absolute",
          left: PILL.x - 3,
          top: top - 3,
          width: PILL.w + 6,
          height: PILL.h + 6,
          backgroundColor: CARD_BG,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PILL.x,
          top,
          width: PILL.w,
          height: PILL.h,
          borderRadius: PILL.r,
          backgroundColor: fill,
          border: `1px solid ${border}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${pressed ? 0.955 : 1})`,
        }}
      >
        {spinning ? (
          <svg
            width={15}
            height={15}
            viewBox="0 0 16 16"
            style={{ transform: `rotate(${(t - PRESS_F) * 22}deg)` }}
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="2"
            />
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke={RN.amber}
              strokeWidth="2"
              strokeDasharray="11 27"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
        {!pressed && !spinning ? (
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            style={{ transform: `scale(${0.6 + 0.4 * settle})`, opacity: settle }}
          >
            <path
              d="M3.6 8.5 L6.6 11.4 L12.5 4.9"
              fill="none"
              stroke={RN.green}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </>
  );
};

export const KsP9NotJustYouTube: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- camera: hold -> move -> hold, every move 18-22f on inOut cubic -------
  const z = interpolate(frame, CAM_F, camTrack("z"), {
    easing: EASE_CAM,
    extrapolateRight: "clamp",
  });
  const focalX = interpolate(frame, CAM_F, camTrack("x"), {
    easing: EASE_CAM,
    extrapolateRight: "clamp",
  });
  const focalY = interpolate(frame, CAM_F, camTrack("y"), {
    easing: EASE_CAM,
    extrapolateRight: "clamp",
  });

  const plateLeft = width / 2 - focalX * z;
  const plateTop = height / 2 - focalY * z;
  const toScreenX = (sx: number) => plateLeft + sx * z;
  const toScreenY = (sy: number) => plateTop + sy * z;

  // ---- cursor --------------------------------------------------------------
  const curX = interpolate(frame, CUR_F, CUR_X, {
    easing: EASE_CUR,
    extrapolateRight: "clamp",
  });
  const curY = interpolate(frame, CUR_F, CUR_Y, {
    easing: EASE_CUR,
    extrapolateRight: "clamp",
  });
  const pressT = CLICKS.reduce(
    (acc, c) => (frame >= c && frame < c + 4 ? frame - c : acc),
    -1,
  );
  const curScale = pressT >= 0 ? 0.9 : 1;

  // hover: real buttons light up under the pointer before they are pressed
  const hoveredRow = ROW_Y.findIndex(
    (ry) => Math.abs(curY - ry) < 15 && Math.abs(curX - PILL_CX) < 46,
  );

  // ---- typing: uncover the capture's own glyphs, snapped to glyph gaps ------
  const typeSteps = STOPS1.length - 1 + (STOPS2.length - 1);
  const typed = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, typeSteps], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const revealX1 = STOPS1[Math.min(typed, STOPS1.length - 1)];
  const revealX2 =
    STOPS2[Math.min(Math.max(typed - (STOPS1.length - 1), 0), STOPS2.length - 1)];
  const onLine1 = typed < STOPS1.length - 1;
  const caretX = (onLine1 ? revealX1 : revealX2) + 1.5;
  const caretTop = onLine1 ? 414 : 438;
  const caretVisible =
    frame < TYPE_END ? true : Math.floor((frame - TYPE_END) / 15) % 2 === 0;

  // ---- the comment field ---------------------------------------------------
  const rise = spring({
    frame: frame - BAR_RISE,
    fps,
    config: { damping: 26, stiffness: 130 },
    durationInFrames: 18,
  });
  const barTop = height - BAR_H * rise;
  const runChars = RUN_KEYS.filter((f) => frame >= f).length;
  const runCaret =
    frame < RUN_KEYS[2] ? true : Math.floor((frame - RUN_KEYS[2]) / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* Opaque floor for the full duration — frame 0 is never black. */}
      <AbsoluteFill style={{ backgroundColor: PAGE_BG }} />

      {/* ------------------------------------------------- the real screen */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SRC_W,
            height: SRC_H,
            transform: `translate(${plateLeft}px, ${plateTop}px) scale(${z})`,
            transformOrigin: "0 0",
          }}
        >
          {/* --- plate A: the Grow tab, right rail "Your handles" --------- */}
          <Img
            src={staticFile(SHOTS.growHandles)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SRC_W,
              height: SRC_H,
              maxWidth: "none",
            }}
          />

          {/* hover on the button the pointer is over */}
          {hoveredRow >= 0 && frame < 208 ? (
            <div
              style={{
                position: "absolute",
                left: PILL.x,
                top: PILL.y + (ROW_Y[hoveredRow] - ROW_Y[0]),
                width: PILL.w,
                height: PILL.h,
                borderRadius: PILL.r,
                backgroundColor: "rgba(0,0,0,0.045)",
              }}
            />
          ) : null}

          {/* the three that get connected */}
          {CONNECTS.map((c) => (
            <ConnectPill
              key={c.row}
              top={PILL.y + (ROW_Y[c.row] - ROW_Y[0])}
              click={c.click}
              frame={frame}
              fps={fps}
            />
          ))}

          {/* --- plate B: the Build tab. Same viewport, same chrome, so the
              swap on the toggle click reads as a route change, not a cut. --- */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SRC_W,
              height: SRC_H,
              // hard swap, not a dissolve: a tab toggle in a single-page app
              // repaints in one frame, and a cross-fade would read as an edit
              opacity: frame >= NAV_SWAP ? 1 : 0,
            }}
          >
            <Img
              src={staticFile(SHOTS.composerTyped)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: SRC_W,
                height: SRC_H,
                maxWidth: "none",
              }}
            />

            {/* the sentence types back in: cover from the caret rightwards in
                the composer's own well colour, so what shows is the capture */}
            <div
              style={{
                position: "absolute",
                left: revealX1,
                top: L1_BAND.top,
                width: TEXT_RIGHT - revealX1,
                height: L1_BAND.bottom - L1_BAND.top,
                backgroundColor: CARD_BG,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: revealX2,
                top: L2_BAND.top,
                width: TEXT_RIGHT - revealX2,
                height: L2_BAND.bottom - L2_BAND.top,
                backgroundColor: CARD_BG,
              }}
            />
            {frame >= 294 && caretVisible ? (
              <div
                style={{
                  position: "absolute",
                  left: caretX,
                  top: caretTop,
                  width: 1.6,
                  height: 20,
                  backgroundColor: RN.text,
                }}
              />
            ) : null}

            {/* pressing send on the one sentence */}
            {frame >= SUBMIT_PRESS && frame < SUBMIT_PRESS + 14 ? (
              <div
                style={{
                  position: "absolute",
                  left: SUBMIT.cx - SUBMIT.r - 5,
                  top: SUBMIT.cy - SUBMIT.r - 5,
                  width: (SUBMIT.r + 5) * 2,
                  height: (SUBMIT.r + 5) * 2,
                  borderRadius: "50%",
                  border: `2px solid rgba(17,17,17,${interpolate(
                    frame,
                    [SUBMIT_PRESS, SUBMIT_PRESS + 14],
                    [0.3, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )})`,
                  boxSizing: "border-box",
                }}
              />
            ) : null}
          </div>

          {/* --------------------------------------------- DO_NOT_RENDER --- */}
          <div
            style={{
              position: "absolute",
              left: FREE_PLAN.x,
              top: FREE_PLAN.y,
              width: FREE_PLAN.w,
              height: FREE_PLAN.h,
              backgroundColor: PAGE_BG,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: SIDEBAR_USER.x,
              top: SIDEBAR_USER.y,
              width: SIDEBAR_USER.w,
              height: SIDEBAR_USER.h,
              backgroundColor: SIDEBAR_BG,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* -------------------------------------------- the comment field · RUN */}
      {rise > 0.001 ? (
        <>
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, rgba(23,20,14,0) 58%, rgba(23,20,14,${
                0.05 * rise
              }) 100%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: barTop,
              width,
              height: BAR_H,
              backgroundColor: "#FFFFFF",
              borderTop: `1px solid ${LW.hairline}`,
              boxShadow: "0 -16px 44px rgba(23,20,14,0.10)",
            }}
          >
            {/* the commenter's avatar */}
            <div
              style={{
                position: "absolute",
                left: 54,
                top: (BAR_H - 64) / 2,
                width: 64,
                height: 64,
                borderRadius: 32,
                background: "linear-gradient(150deg, #EFEAE3 0%, #D8D0C6 100%)",
                border: `1px solid ${LW.hairline}`,
                boxSizing: "border-box",
              }}
            />
            {/* the field */}
            <div
              style={{
                position: "absolute",
                left: 138,
                top: (BAR_H - 84) / 2,
                width: 786,
                height: 84,
                borderRadius: 42,
                backgroundColor: RN.panel,
                border: `1px solid ${LW.hairline}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                paddingLeft: 34,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 42,
                  fontWeight: 600,
                  letterSpacing: 1.4,
                  color: RN.text,
                }}
              >
                {"RUN".slice(0, runChars)}
              </span>
              <span
                style={{
                  width: 2.4,
                  height: 40,
                  marginLeft: 5,
                  backgroundColor: RN.text,
                  opacity: runCaret ? 1 : 0,
                }}
              />
            </div>
            {/* send — the same black round arrow Runable puts on its composer */}
            <div
              style={{
                position: "absolute",
                left: 948,
                top: (BAR_H - 72) / 2,
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: RN.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: runChars > 0 ? 1 : 0.32,
              }}
            >
              <svg width={30} height={30} viewBox="0 0 24 24">
                <path
                  d="M4 12 H18 M12.5 6 L19 12 L12.5 18"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </>
      ) : null}

      {/* ------------------------------------------------------ click ripple */}
      {CLICKS.map((c) => {
        const t = frame - c;
        if (t < 0 || t > 15) return null;
        const s = interpolate(t, [0, 15], [0.3, 1]);
        const o = interpolate(t, [0, 15], [0.26, 0]);
        const d = 74;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: toScreenX(curX) - (d * s) / 2,
              top: toScreenY(curY) - (d * s) / 2,
              width: d * s,
              height: d * s,
              borderRadius: "50%",
              border: `2px solid rgba(23,20,14,${o})`,
              boxSizing: "border-box",
            }}
          />
        );
      })}

      {/* ------------------------------------------------------------ cursor */}
      <svg
        width={26}
        height={34}
        viewBox="0 0 26 34"
        style={{
          position: "absolute",
          left: toScreenX(curX) - 2,
          top: toScreenY(curY) - 2,
          transform: `scale(${curScale})`,
          transformOrigin: "2px 2px",
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

      {/* A whisper of vignette so the capture reads as footage rather than a
          flat asset. Never dark enough to threaten the black-frame gate. */}
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
