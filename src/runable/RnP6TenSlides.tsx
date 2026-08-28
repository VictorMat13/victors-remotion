import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  CAROUSEL_SLIDES,
  safePadX,
} from "./theme";

// ============================================================================
// RnP6TenSlides — 1080x1920 @ 30fps  (9:16)
// VO [0:29]: "Now we've got ten slides, ready to post. You just review and post."
//
// The payoff shot. Ahmed's ten REAL finished slides (public/runable/carousel)
// live in one continuous world: a horizontal strip you thumb through, which
// then gathers into a 5x2 contact sheet so the whole deliverable reads at once.
//
// Camera: hold slide 01 -> swipe to 05 -> swipe to 08 -> pull back to the set
//         -> dead-stable end hold for the editor's cut into the talking head.
// No on-screen copy anywhere; the only UI is a carousel dot row (a count
// indicator), and every word on screen belongs to Ahmed's actual slides.
//
// SKIN: Altari (@alassafi.ai). Purple ground (ALTARI.bg) at frame 0 -> last,
// 64px backdrop grid + 24px card grid always on, the contact sheet lands on an
// ALTARI.card surface with an ALTARI.border hairline, and every warm cream
// shadow is now a cool ambient glow. Ahmed's slides are near-black, so each one
// carries a lavender hairline + soft purple lift to separate from both the
// purple ground and the card surface — no heavy white frames anywhere.
// ============================================================================

export const DURATION_IN_FRAMES = 110;

/* ---------------------------------------------------------------- world --- */

// World card = the slide at its close-up size. Source PNGs are 1080x1350 (4:5),
// so 900x1125 is the exact ratio — never cropped, never letterboxed.
const CARD_W = 900;
const CARD_H = 1125;
const STRIP_GAP = 90;
const STRIP_PITCH = CARD_W + STRIP_GAP;

const COLS = 4;
const ROWS = 3;

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

//             open  hold  swipe  hold  swipe  hold  pull  end
const KEY_T = [0, 16, 34, 44, 62, 70, 91, 109]; // zoom + vertical
const KEY_TX = [0, 16, 34, 44, 62, 77, 92, 109]; // horizontal (lags the zoom)
// which slide the camera is parked on at each key (index into the ten)
const KEY_I = [0, 0, 3, 3, 6, 6, 6, 6];

// The camera's last strip stop. Its x-morph shares the camera's window, so it
// glides rather than scrambles while the rest of the set folds in around it.
const ANCHOR = 6;

// The fold: each slide drops to its row FIRST, then slides left into column.
// Rows never pass through each other, so the gather stays legible.
const DROP_IN = 70;
const DROP_OUT = 83;
const SLIDE_IN = 77;
const SLIDE_OUT = 92;

/* ------------------------------------------------------- altari surfaces --- */

// Low-contrast grid, drawn as two hairline gradients. Backdrop = 64px, card = 24px.
const gridLines = (px: number, alpha: number) =>
  ({
    backgroundImage: `linear-gradient(to right, rgba(165,167,217,${alpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(165,167,217,${alpha}) 1px, transparent 1px)`,
    backgroundSize: `${px}px ${px}px`,
  }) as const;

/* ----------------------------------------------------------------- util --- */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------------------------------------------------------- composition --- */

export const RnP6TenSlides: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const opt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  /* ---- screen geometry (5% side safe margins drive everything) ---- */
  const PAD = safePadX(width); // 54 on 1080
  const BOARD_W = width - PAD * 2; // 972
  const BOARD_PAD = 30;
  const GRID_GAP = 18;

  const CELL_W = (BOARD_W - BOARD_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;
  const CELL_H = (CELL_W * CARD_H) / CARD_W;
  const Z_FAR = CELL_W / CARD_W; // zoom that makes a world card one grid cell

  const GRID_SCREEN_H = ROWS * CELL_H + (ROWS - 1) * GRID_GAP;
  const GRID_SCREEN_CY = 880; // sheet sits a touch above centre
  const gridTop = GRID_SCREEN_CY - GRID_SCREEN_H / 2;
  const boardTop = gridTop - BOARD_PAD;
  const dotGridY = gridTop + GRID_SCREEN_H + 48;
  const BOARD_H = GRID_SCREEN_H + BOARD_PAD + 92;

  /* ---- world layout: strip -> sheet ---- */
  const GAP_W = GRID_GAP / Z_FAR; // grid gap expressed in world units
  const PX = CARD_W + GAP_W;
  const PY = CARD_H + GAP_W;
  const SHEET_W = COLS * CARD_W + (COLS - 1) * GAP_W;
  const SHEET_H = ROWS * CARD_H + (ROWS - 1) * GAP_W;
  const GRID_CX = SHEET_W / 2;
  const GRID_CY = SHEET_H / 2;

  const total = CAROUSEL_SLIDES.length;
  const stripX = (i: number) => i * STRIP_PITCH;
  const gridY = (i: number) => Math.floor(i / COLS) * PY;
  const gridX = (i: number) => {
    const row = Math.floor(i / COLS);
    const inRow = Math.min(COLS, total - row * COLS); // last row is short
    const rowW = inRow * CARD_W + (inRow - 1) * GAP_W;
    return (SHEET_W - rowW) / 2 + (i % COLS) * PX; // short row centres
  };

  /* ---- camera keyframes ---- */
  const FY_STRIP = CARD_H / 2 + (height / 2 - 880); // card centre -> y 880
  const FY_GRID = GRID_CY + (height / 2 - GRID_SCREEN_CY) / Z_FAR;

  const KEY_FX = KEY_TX.map((_, k) =>
    k >= 6 ? GRID_CX : stripX(KEY_I[k]) + CARD_W / 2,
  );
  const KEY_FY = KEY_T.map((_, k) => (k >= 6 ? FY_GRID : FY_STRIP));
  const KEY_Z = [1.035, 1, 1, 1, 1, 1, Z_FAR, Z_FAR];

  const z = interpolate(frame, KEY_T, KEY_Z, opt);
  const fyBase = interpolate(frame, KEY_T, KEY_FY, opt);

  // settled = 0 while we are still thumbing, 1 once the sheet has landed
  const settled = interpolate(frame, [DROP_IN, SLIDE_OUT], [0, 1], opt);

  // a hair of breathing during the holds so nothing sits dead; zeroed by the
  // time the sheet lands so the end hold is rock stable for the cut.
  const drift = 7 * Math.sin(frame / 21) * (1 - settled);
  const fx = interpolate(frame, KEY_TX, KEY_FX, opt) + drift;
  const fy = fyBase + 4 * Math.sin(frame / 27) * (1 - settled);

  /* ---- board + dot row ---- */
  const boardP = interpolate(frame, [DROP_IN + 8, SLIDE_OUT + 1], [0, 1], opt);
  const dotY = lerp(1512, dotGridY, settled);
  const dotOp = interpolate(frame, [DROP_IN, 76, 88, 95], [1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idxF = interpolate(frame, KEY_TX, KEY_I, opt);

  return (
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* ambient purple lift — keeps the ground alive (and off pure black)
          behind Ahmed's near-black slides, in both the close-up and the wide */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(118% 60% at 50% 30%, rgba(91,94,194,0.20) 0%, rgba(91,94,194,0.06) 52%, rgba(91,94,194,0) 78%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(96% 44% at 50% 104%, rgba(61,44,141,0.34) 0%, rgba(61,44,141,0) 70%)",
        }}
      />

      {/* 64x64 backdrop grid — always present, low contrast */}
      <AbsoluteFill style={gridLines(ALTARI_GRID.backdrop, 0.05)} />

      {/* the finished sheet the ten slides settle onto — Altari card surface */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: boardTop,
          width: BOARD_W,
          height: BOARD_H,
          borderRadius: 34,
          backgroundColor: ALTARI.card,
          border: `1.5px solid ${ALTARI.border}`,
          boxShadow:
            "0 0 0 1px rgba(91,94,194,0.14), 0 26px 74px rgba(6,6,16,0.58), 0 0 96px rgba(91,94,194,0.20)",
          opacity: boardP,
          transform: `scale(${0.975 + 0.025 * boardP})`,
          transformOrigin: `${BOARD_W / 2}px ${BOARD_H / 2}px`,
          overflow: "hidden",
          ...gridLines(ALTARI_GRID.card, 0.07),
        }}
      />

      {/* ---------------- one world, one camera ---------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${
            height / 2 - fy
          }px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {CAROUSEL_SLIDES.map((src, i) => {
          // staggered fold: the anchor moves with the camera, the rest land in
          // a short wave behind it.
          const s = Math.abs(i - ANCHOR) * 0.5;
          const tY = interpolate(frame, [DROP_IN + s, DROP_OUT + s], [0, 1], opt);
          const tX = interpolate(
            frame,
            [SLIDE_IN + s, SLIDE_OUT + s],
            [0, 1],
            opt,
          );

          const sx = lerp(stripX(i), gridX(i), tX);
          const sy = lerp(0, gridY(i), tY);

          // carousel depth: off-centre slides ride slightly back, resolved to
          // flat equals once they are part of the sheet.
          const off = clamp01(
            Math.abs(stripX(i) + CARD_W / 2 - fx) / STRIP_PITCH,
          );
          const sc = lerp(1 - 0.05 * off, 1, tX);
          const op = lerp(1 - 0.2 * off, 1, tX);

          return (
            <div
              key={src}
              style={{
                position: "absolute",
                left: sx,
                top: sy,
                width: CARD_W,
                height: CARD_H,
                borderRadius: 26,
                overflow: "hidden",
                // hairline + ambient purple lift: separates a near-black slide
                // from the purple ground AND from the lighter card surface.
                border: "2px solid rgba(165,167,217,0.26)",
                boxShadow:
                  "0 22px 56px rgba(6,6,16,0.62), 0 0 44px rgba(91,94,194,0.30)",
                opacity: op,
                transform: `scale(${sc})`,
                transformOrigin: `${CARD_W / 2}px ${CARD_H / 2}px`,
              }}
            >
              <Img
                src={staticFile(src)}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ---------------- carousel dot row (count indicator) ---------------- */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: dotY - 9,
          width: BOARD_W,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          opacity: dotOp,
        }}
      >
        {CAROUSEL_SLIDES.map((src, i) => {
          const act = clamp01(1 - Math.abs(i - idxF));
          const fill = Math.max(act, settled);
          return (
            <div
              key={src}
              style={{
                position: "relative",
                width: 13 + 22 * act * (1 - settled),
                height: 13,
                borderRadius: 7,
                backgroundColor: "rgba(165,167,217,0.18)",
                overflow: "hidden",
                boxShadow: `0 0 ${10 + 12 * fill}px rgba(91,94,194,${0.18 + 0.34 * fill})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: ALTARI.primaryLight,
                  opacity: fill,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
