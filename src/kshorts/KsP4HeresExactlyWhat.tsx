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
import { FONT_SANS, LW, SHOTS, STEPS, UI } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP4HeresExactlyWhat — 1080x1080 @ 30fps (1:1) · VO.p4 (spoken, never drawn)
// "So here's exactly what Runable did, start to finish."
//
// SCREEN-RECORDING BUILD (v2). Victor, 2026-08-28: "the remotions don't look
// enough like actual screen recordings." v1 rebuilt the run panel as a floating
// white card in a warm-white world — a designed graphic. This version uses the
// REAL capture as the base plate, full-bleed, and animates on top of it:
//   public/kshorts/reference/12-q1.png — the live Runable chat view mid-run,
//   1600x1000 viewport (shipped at 2x, so the plate has spare resolution).
//
// The one thing that cannot come from the capture is the disclosure OPENING,
// because the capture is a single collapsed frame. So the page is composited
// the way the real DOM is laid out and the opening is done for real:
//
//   fixed chrome   the sidebar, the top bar, the pinned notify bar + question
//                  card at the bottom of the window — straight from the plate,
//                  never moved.
//   scroll view    doc y 50..578 between them. Its content is two slices of the
//                  SAME capture: everything down to the "Completed 1 step" row,
//                  and everything below it. Opening the disclosure translates
//                  the lower slice down by exactly the height of the step list,
//                  so the thumbs-up / thumbs-down / copy row is PUSHED, like
//                  real DOM. The page then scrolls a little to follow.
//
// Only three things are drawn by hand, each over a patch of flat #FEFDFB page
// background sampled off the capture, so there is no seam to find:
//   1. the "Completed N steps" counter (UI.stepsDone) — it has to tick 1 -> 2
//   2. its disclosure chevron — it has to rotate
//   3. the step list itself, in Runable's own numbered-row language sampled
//      from the question card in this very capture (23.5px chip, radius ~7,
//      #F5F1EF fill, #685B52 numeral, 14px label 12.5px to its right).
//
// Every geometry constant below was measured off 12-q1.png with a pixel scan,
// not eyeballed. Colours likewise: page #FEFDFB, sidebar #F4F1EF, muted text
// #685B52, ink #170F09, the run's amber #D49E59.
//
// BEAT
//   0-10   HOLD. The capture, exactly as shot. Cursor idling in the chat body.
//  10-26   the cursor travels to the "Completed 1 step" row.
//  26-31   it settles, the row takes a hover fill, and CLICKS.
//  32-46   the chevron rotates and the list EXPANDS, pushing the row below it
//          down; 34-52 the page scrolls a little to follow the growth.
//  34-56   the six step rows resolve in, 2.5f apart. 1 lands lit, 2 is running.
//  58-64   step 2 lands; the counter ticks "Completed 1 step" -> "2 steps".
//  64-95   settled hold. Steps 1-2 lit, 3-6 pending — the spine P5 picks up.
//
// No text on screen restates the narration: the counter and the step labels are
// real product strings from theme.ts (UI.stepsDone, STEPS[].label), everything
// else is captured pixels. DO_NOT_RENDER: "Victor Matevski" is painted out of
// the sidebar, and no Free-plan pill exists in this capture.
// ============================================================================

export const DURATION_IN_FRAMES = 95;

/* ---------------------------------------------------------- the base plate */

const SRC_W = 1600;
const SRC_H = 1000;

// Fixed crop. A screen recording does not pan: the frame IS the screen, so the
// camera never moves. The "move" in hold -> move -> hold is the page scroll.
const ZOOM = 1.9;
const FOCAL_X = 470;
const FOCAL_Y = 360;

/* --------------------------------------------- document geometry (measured) */

// Sidebar ends at x=259 (1px edge), chat column starts at 260. The right rail
// begins at 1280. Both bands verified pure #FEFDFB between the content rows.
const CHAT_X0 = 261;
const CHAT_X1 = 1280;

// The scroll viewport: below the top bar (which ends at y=43.5) and above the
// pinned notify bar (which starts at y=588.5).
const VIEW_TOP = 50;
const VIEW_BOT = 578;

// Where the disclosure inserts its content: under the "Completed 1 step" row
// (ink 232.5..244.5) and above the feedback row (ink 280..295).
const SPLIT = 252;

// The counter row, measured: text ink x 388..487, y 232.5..244.5; chevron ink
// x 497..501, y 233.75..240.75.
const CNT_X = 388;
const CNT_FS = 12.67;
const CNT_TOP = 228.2; // calibrated so the drawn ink top lands on 232.5
const CHEV_CX = 499;
const CHEV_CY = 237.45;
// "Completed 2 steps" is one glyph wider than "Completed 1 step", so the
// chevron has to move with it, exactly as the real row would reflow.
const CHEV_TICK_DX = 7.4;

// The step list, in the capture's own numbered-row language.
const LIST_TOP = 266;
const ROW_PITCH = 44;
const ROW_H = 28;
const CHIP = 25;
const CHIP_R = 7;
const LABEL_DX = CHIP + 13;
const LIST_PAD_BOTTOM = 14;

const rowTop = (i: number) => LIST_TOP + i * ROW_PITCH;
// Total height the disclosure inserts into the flow.
const EXPAND_H =
  rowTop(STEPS.length - 1) + ROW_H + LIST_PAD_BOTTOM - SPLIT; // 276

// Page scroll once the content has grown.
const SCROLL_MAX = 38;

/* ------------------------------------------------- colours sampled off 12-q1 */

const PAGE = "#FEFDFB";
const SIDEBAR = "#F4F1EF";
const MUTED = "#685B52";
const PENDING = "#8C8078";
const PENDING_NUM = "#9C918A";
const INK = "#170F09";
const CHIP_BG = "#F5F1EF";
const AMBER = "#D49E59";
const amberA = (a: number) => `rgba(212,158,89,${a})`;

/* -------------------------------------------------------------- timing ---- */

const T_TRAVEL_IN = 10;
const T_TRAVEL_OUT = 26;
const T_CLICK = 31;
const T_OPEN_IN = 32;
const T_OPEN_OUT = 46;
const T_SCROLL_IN = 34;
const T_SCROLL_OUT = 52;
const T_ROW_IN = 34;
const T_ROW_STAGGER = 2.5;
const T_TICK_IN = 58;
const T_TICK_OUT = 61;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easeInOut = { ...clamp, easing: Easing.inOut(Easing.cubic) };
const easeOut = { ...clamp, easing: Easing.out(Easing.cubic) };

// smooth 0 -> 1 -> 0, for the pointer press
const bell = (frame: number, a: number, b: number) =>
  Math.sin(interpolate(frame, [a, b], [0, 1], clamp) * Math.PI);

/* ------------------------------------------------------------- fragments -- */

// A clipped slice of the real capture, positioned in document space and
// optionally translated (dx, dy) — that translation is what makes the DOM push
// and the page scroll. ox/oy is the origin of the container it sits in.
const Shot: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  ox?: number;
  oy?: number;
  dx?: number;
  dy?: number;
}> = ({ x0, y0, x1, y1, ox = 0, oy = 0, dx = 0, dy = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: (x0 + dx - ox) * ZOOM,
      top: (y0 + dy - oy) * ZOOM,
      width: (x1 - x0) * ZOOM,
      height: (y1 - y0) * ZOOM,
      overflow: "hidden",
    }}
  >
    <Img
      src={staticFile(SHOTS.questionCard)}
      style={{
        position: "absolute",
        left: -x0 * ZOOM,
        top: -y0 * ZOOM,
        width: SRC_W * ZOOM,
        height: SRC_H * ZOOM,
        maxWidth: "none",
      }}
    />
  </div>
);

// The disclosure chevron. Matches the captured glyph: 3.5 x 7 document px,
// 1.2px stroke, MUTED — it just has to rotate, which a bitmap cannot.
const Chevron: React.FC<{ rot: number; dx: number }> = ({ rot, dx }) => (
  <svg
    width={12 * ZOOM}
    height={12 * ZOOM}
    viewBox="0 0 12 12"
    style={{
      position: "absolute",
      left: (CHEV_CX - 6 + dx) * ZOOM,
      top: (CHEV_CY - 6) * ZOOM,
      transform: `rotate(${rot}deg)`,
      display: "block",
    }}
  >
    <path
      d="M4.5 2.5 L8 6 L4.5 9.5"
      stroke={MUTED}
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// The step-2 spinner while that step is still running.
const Spinner: React.FC<{ turn: number; color: string }> = ({ turn, color }) => (
  <svg
    width={CHIP * ZOOM}
    height={CHIP * ZOOM}
    viewBox="0 0 25 25"
    style={{ display: "block", transform: `rotate(${turn}deg)` }}
  >
    <circle
      cx={12.5}
      cy={12.5}
      r={7}
      fill="none"
      stroke="rgba(0,0,0,0.08)"
      strokeWidth={2}
    />
    <circle
      cx={12.5}
      cy={12.5}
      r={7}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="13 31"
    />
  </svg>
);

/* ------------------------------------------------------------------ comp -- */

export const KsP4HeresExactlyWhat: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const plateLeft = width / 2 - FOCAL_X * ZOOM;
  const plateTop = height / 2 - FOCAL_Y * ZOOM;
  const sx = (x: number) => plateLeft + x * ZOOM;
  const sy = (y: number) => plateTop + y * ZOOM;

  // ---- the disclosure ----------------------------------------------------
  const openP = interpolate(frame, [T_OPEN_IN, T_OPEN_OUT], [0, 1], easeOut);
  const expand = openP * EXPAND_H;
  const chevRot = interpolate(frame, [T_OPEN_IN, T_OPEN_IN + 11], [0, 90], easeOut);

  // ---- the page scroll: the only camera move in the part ------------------
  const scroll = interpolate(
    frame,
    [T_SCROLL_IN, T_SCROLL_OUT],
    [0, SCROLL_MAX],
    easeInOut,
  );

  // ---- the counter ticks 1 -> 2 ------------------------------------------
  const tick = interpolate(frame, [T_TICK_IN, T_TICK_OUT], [0, 1], easeInOut);

  // ---- hover + press on the disclosure row --------------------------------
  const hover =
    interpolate(frame, [23, 29], [0, 1], clamp) *
    interpolate(frame, [40, 50], [1, 0], clamp);
  const press = bell(frame, T_CLICK - 2, T_CLICK + 3);

  // ---- pointer -----------------------------------------------------------
  const idle = Math.sin(frame * 0.07) * 0.6;
  const curKeys = [0, T_TRAVEL_IN, T_TRAVEL_OUT, 38, 56, DURATION_IN_FRAMES];
  const curX = interpolate(frame, curKeys, [613, 611, 455, 455, 668, 668], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const curY = interpolate(
    frame,
    curKeys,
    [321, 323, 241, 241, 292, 292 + idle],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );

  // ---- per-row state ------------------------------------------------------
  const rowIn = (i: number) =>
    interpolate(
      frame,
      [T_ROW_IN + i * T_ROW_STAGGER, T_ROW_IN + i * T_ROW_STAGGER + 9],
      [0, 1],
      easeOut,
    );
  // step 2 pops as it lands — the one spring entrance in the part
  const landP = spring({
    frame: frame - T_TICK_IN,
    fps,
    config: { damping: 16, stiffness: 190 },
    durationInFrames: 14,
  });

  const counterY = CNT_TOP - scroll;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* Opaque from frame 0 to the last frame — the plate can never flash. */}
      <AbsoluteFill style={{ backgroundColor: PAGE }} />

      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: plateLeft,
            top: plateTop,
            width: SRC_W * ZOOM,
            height: SRC_H * ZOOM,
          }}
        >
          {/* ---- the real screen, whole: sidebar, top bar, right rail, and
                  the pinned notify bar + question card at the window floor. */}
          <Img
            src={staticFile(SHOTS.questionCard)}
            style={{
              position: "absolute",
              inset: 0,
              width: SRC_W * ZOOM,
              height: SRC_H * ZOOM,
              maxWidth: "none",
            }}
          />

          {/* ---- DO_NOT_RENDER: "Victor Matevski" out of the sidebar ------ */}
          <div
            style={{
              position: "absolute",
              left: 4 * ZOOM,
              top: 945 * ZOOM,
              width: 175 * ZOOM,
              height: 54 * ZOOM,
              backgroundColor: SIDEBAR,
            }}
          />

          {/* ---- the chat scroll viewport -------------------------------- */}
          <div
            style={{
              position: "absolute",
              left: CHAT_X0 * ZOOM,
              top: VIEW_TOP * ZOOM,
              width: (CHAT_X1 - CHAT_X0) * ZOOM,
              height: (VIEW_BOT - VIEW_TOP) * ZOOM,
              overflow: "hidden",
              backgroundColor: PAGE,
            }}
          >
            {/* everything down to the disclosure row, scrolled */}
            <Shot
              x0={CHAT_X0}
              y0={VIEW_TOP}
              x1={CHAT_X1}
              y1={SPLIT}
              ox={CHAT_X0}
              oy={VIEW_TOP}
              dy={-scroll}
            />

            {/* everything below it — PUSHED by the opening list, then scrolled */}
            <Shot
              x0={CHAT_X0}
              y0={SPLIT}
              x1={CHAT_X1}
              y1={VIEW_BOT}
              ox={CHAT_X0}
              oy={VIEW_TOP}
              dy={expand - scroll}
            />

            {/* ---- the disclosure row, redrawn so it can tick and rotate --
                 Painted over its own patch of captured page background. */}
            <div
              style={{
                position: "absolute",
                left: (380 - CHAT_X0) * ZOOM,
                top: (226 - scroll - VIEW_TOP) * ZOOM,
                width: 134 * ZOOM,
                height: 24 * ZOOM,
                backgroundColor: PAGE,
              }}
            />
            {/* the row's hover fill, and its press */}
            <div
              style={{
                position: "absolute",
                left: (381 - CHAT_X0) * ZOOM,
                top: (227.5 - scroll - VIEW_TOP) * ZOOM,
                width: 132 * ZOOM,
                height: 21.5 * ZOOM,
                borderRadius: 6 * ZOOM,
                backgroundColor: `rgba(23,15,9,${0.035 * hover + 0.03 * press})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (CNT_X - CHAT_X0) * ZOOM,
                top: (counterY - VIEW_TOP) * ZOOM,
                width: 220 * ZOOM,
                height: 18 * ZOOM,
                fontSize: CNT_FS * ZOOM,
                lineHeight: `${18 * ZOOM}px`,
                letterSpacing: -0.05 * ZOOM,
                color: MUTED,
                fontWeight: 400,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ position: "absolute", opacity: 1 - tick }}>
                {UI.stepsDone(1)}
              </span>
              <span style={{ position: "absolute", opacity: tick }}>
                {UI.stepsDone(2)}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: -CHAT_X0 * ZOOM,
                top: (-scroll - VIEW_TOP) * ZOOM,
              }}
            >
              <Chevron rot={chevRot} dx={tick * CHEV_TICK_DX} />
            </div>

            {/* ---- the step list, opening into the flow ------------------- */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: (SPLIT - scroll - VIEW_TOP) * ZOOM,
                width: (CHAT_X1 - CHAT_X0) * ZOOM,
                height: expand * ZOOM,
                overflow: "hidden",
              }}
            >
              {STEPS.map((s, i) => {
                const p = rowIn(i);
                if (p <= 0.001) return null;
                // step 2 spins until it lands; the run then moves on to step
                // 3, which keeps the settled hold alive without lighting it.
                const runP =
                  i === 1
                    ? interpolate(frame, [T_TICK_IN, T_TICK_IN + 5], [1, 0], clamp)
                    : i === 2
                      ? interpolate(
                          frame,
                          [T_TICK_OUT + 3, T_TICK_OUT + 11],
                          [0, 1],
                          clamp,
                        )
                      : 0;
                const done = i === 0 || (i === 1 && tick >= 0.5);
                const top = rowTop(i) - SPLIT;

                return (
                  <div
                    key={s.n}
                    style={{
                      position: "absolute",
                      left: (CNT_X - CHAT_X0) * ZOOM,
                      top: (top + (1 - p) * 5) * ZOOM,
                      height: ROW_H * ZOOM,
                      display: "flex",
                      alignItems: "center",
                      opacity: p,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* the number chip — Runable's own, sampled off the
                        question card in this same capture */}
                    <div
                      style={{
                        position: "relative",
                        width: CHIP * ZOOM,
                        height: CHIP * ZOOM,
                        borderRadius: CHIP_R * ZOOM,
                        backgroundColor: done ? amberA(0.16) : CHIP_BG,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13 * ZOOM,
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                        color: done ? "#9A6A22" : PENDING_NUM,
                        transform:
                          i === 1 && done
                            ? `scale(${1 + 0.07 * Math.sin(Math.min(1, landP) * Math.PI)})`
                            : "none",
                      }}
                    >
                      <span style={{ opacity: 1 - runP }}>{s.n}</span>
                      {runP > 0.01 ? (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            opacity: runP * (i === 1 ? 1 : 0.72),
                          }}
                        >
                          <Spinner
                            turn={frame * 11}
                            color={i === 1 ? AMBER : amberA(0.75)}
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* the mechanism label — STEPS[], never the narration */}
                    <div
                      style={{
                        marginLeft: (LABEL_DX - CHIP) * ZOOM,
                        fontSize: 15 * ZOOM,
                        letterSpacing: -0.1 * ZOOM,
                        fontWeight: done ? 500 : 400,
                        color: done ? INK : PENDING,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* ---------------------------------------------------------- pointer */}
      <svg
        width={26}
        height={34}
        viewBox="0 0 26 34"
        style={{
          position: "absolute",
          left: sx(curX) - 2,
          top: sy(curY) - 1.5,
          transform: `scale(${1 - 0.1 * press})`,
          transformOrigin: "2px 1.5px",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.32))",
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

      {/* A whisper of vignette so the capture reads as footage, not an asset. */}
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
