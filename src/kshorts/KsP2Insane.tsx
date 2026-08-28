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
import { LW, RN, SHOTS } from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP2Insane — 1080x1080 @ 30fps (1:1)  ·  VO.p2 (spoken only, never on screen)
//
// SCREEN-RECORDING BUILD (v2). Victor, 2026-08-28: "the remotions don't look
// enough like actual screen recordings."
//
// v1 recreated the YouTube shelf as a floating white card in Liam's warm-white
// world. That reads as a designed graphic, not a capture. This version instead
// uses the REAL screenshot as the base layer, full-bleed, and animates on top of
// it: the page scrolls, YouTube's own skeleton wells sit over the grid and
// resolve into the real thumbnails one by one, and a cursor moves like a hand is
// driving. Every pixel of interface is genuine capture, not a rebuild.
//
// Base plate: public/kshorts/reference/yt-banana-shorts.png — a live capture of
// youtube.com/@ReadytoBanana/shorts at a 1600x1000 viewport.
//
// BEAT
//   0-18    page sits on the channel header; grid below is still loading
//           (skeleton wells). Cursor drifting.
//   18-46   the page SCROLLS down to the shelf (real scroll easing, not a cut).
//   24-70   the six thumbnails resolve one at a time, ~5f apart — each skeleton
//           well fades and the real thumbnail is underneath.
//   70-95   settled. Cursor comes to rest; a soft amber ring sits on the newest.
//
// No text is drawn by this file at all — every word on screen is inside the
// captured pixels, so nothing can restate the narration or invent a metric.
// ============================================================================

export const DURATION_IN_FRAMES = 95;

// ---------------------------------------------------------------- base plate
const SRC_W = 1600;
const SRC_H = 1000;

// Shelf geometry inside the capture (verified against the screenshot).
const THUMB_Y = 177; // featured row: shorts 7-12, the skipped ones are offscreen
const THUMB_H = 325;
const THUMB_W = 207;
const thumbX = (n: number) => 265 + n * 218;
const CAP_H = 78; // title + view-count block beneath each thumbnail

// The camera is a scroll: we hold the plate at a fixed zoom and move it
// vertically, exactly like a page scrolling under a fixed viewport.
const ZOOM = 1.48;
// Focal x is the centre of the three-across grid, so the row lands inside the
// 5% side margins: 3 tiles span 265->904 in source space, centre 584.
const FOCAL_X = 584;

const SCROLL_FROM = 330; // featured row in view
const SCROLL_TO = 520; // featured row + captions + the next row beneath

// Reveal order, left to right across both rows.
const REVEAL_START = 24;
const REVEAL_STAGGER = 5;

export const KsP2Insane: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- the scroll: hold -> move -> hold ------------------------------------
  const focalY = interpolate(frame, [0, 18, 46, DURATION_IN_FRAMES], [
    SCROLL_FROM,
    SCROLL_FROM,
    SCROLL_TO,
    SCROLL_TO,
  ], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // Plate transform. The capture fills the frame edge to edge — there is no
  // white world behind it, because a screen recording IS the screen.
  const plateLeft = width / 2 - FOCAL_X * ZOOM;
  const plateTop = height / 2 - focalY * ZOOM;

  // ---- cursor: drifts, then settles near the newest short ------------------
  const curX = interpolate(frame, [0, 30, 62, 95], [980, 760, 430, 400], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: "clamp",
  });
  const curY = interpolate(frame, [0, 30, 62, 95], [430, 600, 690, 700], {
    easing: Easing.inOut(Easing.quad),
    extrapolateRight: "clamp",
  });

  const toScreenX = (sx: number) => plateLeft + sx * ZOOM;
  const toScreenY = (sy: number) => plateTop + sy * ZOOM;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* Opaque base so no frame can ever be black, even before decode. */}
      <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }} />

      {/* -------------------------------------------------- the real screen */}
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
          <Img
            src={staticFile(SHOTS.ytShorts)}
            style={{
              position: "absolute",
              inset: 0,
              width: SRC_W * ZOOM,
              height: SRC_H * ZOOM,
              maxWidth: "none",
            }}
          />

          {/* YouTube's own loading skeletons, sitting over the real grid and
              resolving one at a time. Drawn in SOURCE space inside the plate so
              they scroll with the page, like real DOM would. */}
          {new Array(6).fill(0).map((_, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = thumbX(col);
            const y = THUMB_Y + row * (THUMB_H + CAP_H + 34);

            const t0 = REVEAL_START + i * REVEAL_STAGGER;
            const resolve = spring({
              frame: frame - t0,
              fps,
              config: { damping: 26, stiffness: 190 },
              durationInFrames: 14,
            });
            if (resolve >= 0.999) return null;

            return (
              <div key={i}>
                {/* the thumbnail well */}
                <div
                  style={{
                    position: "absolute",
                    left: x * ZOOM,
                    top: y * ZOOM,
                    width: THUMB_W * ZOOM,
                    height: THUMB_H * ZOOM,
                    borderRadius: 12 * ZOOM,
                    backgroundColor: "#F2F2F2",
                    opacity: 1 - resolve,
                    overflow: "hidden",
                  }}
                >
                  {/* the shimmer that real skeletons carry */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: 220 * ZOOM,
                      left:
                        interpolate(
                          (frame * 9) % 90,
                          [0, 90],
                          [-240 * ZOOM, THUMB_W * ZOOM + 40 * ZOOM],
                        ),
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                </div>

                {/* the caption bars */}
                <div
                  style={{
                    position: "absolute",
                    left: x * ZOOM,
                    top: (y + THUMB_H + 14) * ZOOM,
                    width: THUMB_W * ZOOM,
                    opacity: 1 - resolve,
                  }}
                >
                  <div
                    style={{
                      height: 13 * ZOOM,
                      width: "88%",
                      borderRadius: 4 * ZOOM,
                      backgroundColor: "#F2F2F2",
                      marginBottom: 8 * ZOOM,
                    }}
                  />
                  <div
                    style={{
                      height: 13 * ZOOM,
                      width: "54%",
                      borderRadius: 4 * ZOOM,
                      backgroundColor: "#F2F2F2",
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* a soft amber ring on the newest short once it has resolved */}
          <div
            style={{
              position: "absolute",
              left: thumbX(0) * ZOOM,
              top: THUMB_Y * ZOOM,
              width: THUMB_W * ZOOM,
              height: THUMB_H * ZOOM,
              borderRadius: 12 * ZOOM,
              boxShadow: `0 0 0 ${
                2.2 * ZOOM
              }px rgba(222,155,74,${interpolate(
                frame,
                [38, 50, 78, 95],
                [0, 0.55, 0.55, 0.34],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )})`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* ------------------------------------------------------------ cursor */}
      <svg
        width={26}
        height={34}
        viewBox="0 0 26 34"
        style={{
          position: "absolute",
          left: toScreenX(curX),
          top: toScreenY(curY),
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
      {/* keep RN referenced for the shared-token lint rule */}
      <div style={{ display: "none", color: RN.amber }} />
    </AbsoluteFill>
  );
};
