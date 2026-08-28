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
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { POLSIA, WORLD } from "./theme";

const { fontFamily: serifFont } = loadSerif("normal", {
  weights: ["500"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: monoFont } = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 130;

// ---------------------------------------------------------------------------
// Layout — 1080x1080. Safe zone x = 54 → 1026 (5% margins).
// Row: 6 tiles x 140 + 5 gaps x 18 = 930, centered → x = 75 → 1005.
// ---------------------------------------------------------------------------
const W = 1080;
const CX = W / 2;
const TILE_W = 140;
const TILE_H = 150;
const GAP = 18;
const ROW_W = 6 * TILE_W + 5 * GAP; // 930
const ROW_LEFT = (W - ROW_W) / 2; // 75
const ROW_CY = 540;
const slotX = (j: number) => ROW_LEFT + j * (TILE_W + GAP);

// The word: a-i-s-l-o-p → reversed reads p-o-l-s-i-a. Each tile keeps its
// letter; only the ORDER flips (and the face flips mono → serif mid-arc).
const LETTERS = ["a", "i", "s", "l", "o", "p"] as const;

// Swap choreography: outer pair first, then middle, then inner.
// pairIdx = min(i, 5 - i): 0 → outer (a/p), 1 → middle (i/o), 2 → inner (s/l)
const SWAPS = [
  { start: 35, end: 57, arc: 190 },
  { start: 47, end: 69, arc: 140 },
  { start: 59, end: 79, arc: 92 },
] as const;

const easeIO = Easing.inOut(Easing.cubic);
const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Wordmark lockup: real asset 772x301 shown at 560 wide, orange dot period.
const WM_W = 560;
const WM_H = (301 / 772) * WM_W; // ~218
const DOT = 26;
const LOCKUP_W = WM_W + 20 + DOT; // 606
const LOCKUP_LEFT = (W - LOCKUP_W) / 2; // 237

export const PoP2NameReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera: gentle continuous push-in; last two keys identical (end hold).
  const zoom = interpolate(
    frame,
    [0, 85, 122, DURATION_IN_FRAMES],
    [1.0, 1.012, 1.035, 1.035],
    { easing: easeIO, ...clampOpts },
  );

  // ---- Strike line (thin gray): draws as an underline, rises to a strike,
  // then breaks off the moment the flip begins.
  const strikeDraw = interpolate(frame, [10, 24], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clampOpts,
  });
  const strikeRise = interpolate(frame, [27, 34], [0, 1], {
    easing: easeIO,
    ...clampOpts,
  });
  const strikeY = interpolate(
    strikeRise,
    [0, 1],
    [ROW_CY + TILE_H / 2 + 18, ROW_CY],
  );
  const strikeFade = interpolate(frame, [35, 43], [1, 0], clampOpts);

  // ---- Lockup phase factors
  const collapse = interpolate(frame, [84, 100], [0, 1], {
    easing: easeIO,
    ...clampOpts,
  });
  const chromeFade = interpolate(frame, [84, 94], [1, 0], clampOpts); // card faces
  const rowFade = interpolate(frame, [90, 100], [1, 0], clampOpts); // letters
  const rowBlur = interpolate(frame, [88, 100], [0, 10], clampOpts);
  const rowScale = interpolate(frame, [84, 104], [1, 0.78], {
    easing: easeIO,
    ...clampOpts,
  });
  const wmIn = interpolate(frame, [93, 107], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clampOpts,
  });
  const wmScale = interpolate(wmIn, [0, 1], [1.16, 1]);
  const wmBlur = (1 - wmIn) * 12;

  // Orange live-dot period (the ticker dot) pops after the wordmark lands.
  const dotSpring = spring({
    fps,
    frame: Math.max(0, frame - 107),
    config: { damping: 10, stiffness: 170 },
  });
  const dotPulse = 1 + 0.05 * Math.sin(Math.max(0, frame - 113) / 4.5);
  const dotScale = dotSpring * dotPulse;

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      {/* Camera rig — subtle push-in on the whole world */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "540px 540px",
        }}
      >
        {/* ---- Strike / underline (gray hairline) ---- */}
        {strikeFade > 0.001 && strikeDraw > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: ROW_LEFT,
              top: strikeY - 1.5,
              width: ROW_W,
              height: 3,
              backgroundColor: WORLD.faint,
              transform: `scaleX(${strikeDraw})`,
              transformOrigin: "left center",
              opacity: strikeFade,
              zIndex: 20,
            }}
          />
        )}

        {/* ---- Letter tile row ---- */}
        {rowFade > 0.001 && (
          <AbsoluteFill
            style={{
              transform: `scale(${rowScale})`,
              transformOrigin: "540px 540px",
              opacity: rowFade,
              filter: rowBlur > 0.2 ? `blur(${rowBlur}px)` : undefined,
              zIndex: 15,
            }}
          >
          {LETTERS.map((letter, i) => {
            const { start, end, arc } = SWAPS[Math.min(i, 5 - i)];
            const over = i <= 2; // left-half tiles arc over, right-half under

            // Opening settle: already dropping into place at f0, staggered.
            const settle = spring({
              fps,
              frame: Math.max(0, frame - i * 2),
              config: { damping: 13, stiffness: 130 },
            });
            const openY = interpolate(settle, [0, 1], [-(30 + i * 5), 0]);

            // Micro bob during holds.
            const bob = Math.sin((frame + i * 11) / 9) * 1.3;

            // The swap: slot i → slot 5-i with an over/under arc.
            const p = interpolate(frame, [start, end], [0, 1], {
              easing: easeIO,
              ...clampOpts,
            });
            const fromX = slotX(i);
            const toX = slotX(5 - i);
            let x = fromX + (toX - fromX) * p;
            const arcY = (over ? -1 : 1) * arc * Math.sin(Math.PI * p);
            const rot = (over ? 1 : -1) * 9 * Math.sin(Math.PI * p);

            // Landing impact: squash + springy recover.
            const landed = frame >= end;
            const land = landed
              ? spring({
                  fps,
                  frame: frame - end,
                  config: { damping: 11, stiffness: 190 },
                })
              : 1;
            const scaleY = landed ? 1 - 0.12 * (1 - land) : 1;
            const scaleX = landed ? 1 + 0.08 * (1 - land) : 1;

            // Mid-arc face flip: mono lowercase → serif.
            const cf = interpolate(p, [0.3, 0.7], [0, 1], clampOpts);
            const serifPop = 0.85 + 0.15 * cf;

            // Lockup: collapse slots toward center as the row hands off.
            const cxTile = x + TILE_W / 2;
            x = CX + (cxTile - CX) * (1 - 0.3 * collapse) - TILE_W / 2;

            return (
              <div
                key={letter}
                style={{
                  position: "absolute",
                  left: x,
                  top: ROW_CY - TILE_H / 2 + openY + bob + arcY,
                  width: TILE_W,
                  height: TILE_H,
                  transform: `rotate(${rot}deg) scale(${scaleX}, ${scaleY})`,
                  transformOrigin: "center center",
                  zIndex: over ? 30 : 10,
                }}
              >
                {/* Card face (fades out during the merge) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: WORLD.card,
                    border: `1px solid ${WORLD.border}`,
                    borderRadius: 20,
                    boxShadow: WORLD.shadowSoft,
                    opacity: chromeFade,
                  }}
                />
                {/* Mono face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: `"${monoFont}", "IBM Plex Mono", ui-monospace, monospace`,
                    fontWeight: 500,
                    fontSize: 74,
                    lineHeight: 1,
                    paddingBottom: 10,
                    color: POLSIA.ink,
                    opacity: 1 - cf,
                  }}
                >
                  {letter}
                </div>
                {/* Serif face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: `"${serifFont}", "Playfair Display", Georgia, serif`,
                    fontWeight: 500,
                    fontSize: 86,
                    lineHeight: 1,
                    paddingBottom: 8,
                    color: POLSIA.ink,
                    opacity: cf,
                    transform: `scale(${serifPop})`,
                  }}
                >
                  {letter}
                </div>
              </div>
            );
          })}
          </AbsoluteFill>
        )}

        {/* ---- Final lockup: the real wordmark + orange live-dot period ---- */}
        {wmIn > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: LOCKUP_LEFT,
              top: ROW_CY - WM_H / 2,
              width: LOCKUP_W,
              height: WM_H,
              transform: `scale(${wmScale})`,
              transformOrigin: "center center",
              opacity: wmIn,
              filter: wmBlur > 0.2 ? `blur(${wmBlur}px)` : undefined,
              zIndex: 40,
            }}
          >
            <Img
              src={staticFile("polsia/polsia-logonoir.webp")}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: WM_W,
                height: WM_H,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: WM_W + 20,
                top: WM_H - DOT - 8,
                width: DOT,
                height: DOT,
                borderRadius: "50%",
                backgroundColor: POLSIA.orange,
                transform: `scale(${dotScale})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
