// Fish Audio 5 — F5P05BuiltThreeVoices (1080x1080, 135f @ 30fps)
// VO: I built three custom voices for them using fish audio.
//
// Beat: open tight on a floating cream Voice Design method card (modeled on
// the REAL card in public/fish5/site/app-create-voice.png, FISH_UI strings
// verbatim) → three voice chips (portrait orbs, NO name text) pop in below,
// each with a live WaveBars burst in its accent → FishChip lands bottom-center
// as the camera settles → living hold.
//
// Compliance: no advisor names anywhere; only FISH_UI card strings + S2.1 PRO.

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ADVISORS, ALTARI, FISH_UI } from "./theme";
import {
  AltariBackdrop,
  CreamCard,
  FishChip,
  PortraitOrb,
  WaveBars,
} from "./board";
import type { AdvisorKey } from "./board";

export const DURATION_IN_FRAMES = 135;

const W = 1080;
const H = 1080;

// World layout (world coords; final settle is 1:1 with the viewport)
const CARD_X = 180;
const CARD_W = 720;
const CARD_BASE_Y = 130;
const CARD_H = 330;

const CHIP_Y = 640;
const CHIP_SIZE = 120;
const WAVE_Y = 742;
const CHIP_XS = [300, 540, 780];
const CHIP_T = [46, 63, 80]; // landing frames (pop-pop-pop)
const CHIP_ADVISORS: AdvisorKey[] = ["operator", "editor", "longgame"];

const FISHCHIP_T = 96;
const FISHCHIP_Y = 900;

const INK = ALTARI.creamInk;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const F5P05BuiltThreeVoices: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // ---------------------------------------------------------------- camera
  // hold → move → hold; two nearly identical final keys for the end hold.
  const KEY_T = [0, 28, 44, 86, 102, 122, DURATION_IN_FRAMES];
  const fx = 540;
  const fy = interpolate(frame, KEY_T, [305, 305, 500, 500, 552, 552, 555], {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, [1.26, 1.34, 1.1, 1.1, 1.0, 1.0, 1.004], {
    easing: ease,
    extrapolateRight: "clamp",
  });

  // ------------------------------------------------------- card float + life
  const cardY = CARD_BASE_Y + Math.sin(frame * 0.05) * 7;
  const ringPulse = 0.55 + 0.35 * Math.sin(frame * 0.12);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg, overflow: "hidden" }}>
      {/* Opaque base, full frame, frame 0 → last (no black frames) */}
      <AltariBackdrop width={W} height={H} />

      {/* Camera world */}
      <div
        style={{
          position: "absolute",
          width: W,
          height: H,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Oversized backdrop inside the world so the grid travels with the
            camera and always covers the viewport (root base behind it is the
            same opaque ALTARI.bg either way). */}
        <div style={{ position: "absolute", left: -200, top: -200 }}>
          <AltariBackdrop width={W + 400} height={H + 400} />
        </div>

        {/* ------------------------------------------------ Voice Design card */}
        <CreamCard x={CARD_X} y={cardY} w={CARD_W} h={CARD_H} enter={1}>
          {/* wand icon badge with faint concentric rings (real-card DNA) */}
          <div
            style={{
              position: "absolute",
              left: 48,
              top: 40,
              width: 86,
              height: 86,
              borderRadius: "50%",
              backgroundColor: "rgba(31,31,51,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -11,
                borderRadius: "50%",
                border: "1.5px solid rgba(31,31,51,0.12)",
                opacity: ringPulse,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -22,
                borderRadius: "50%",
                border: "1.5px solid rgba(31,31,51,0.07)",
                opacity: 1 - ringPulse * 0.5,
              }}
            />
            <svg width="42" height="42" viewBox="0 0 40 40" fill="none">
              <line
                x1="7"
                y1="33"
                x2="24"
                y2="16"
                stroke={INK}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="26.5"
                y1="13.5"
                x2="31"
                y2="9"
                stroke={INK}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M32 20 l1.5 3.2 3.2 1.5 -3.2 1.5 -1.5 3.2 -1.5 -3.2 -3.2 -1.5 3.2 -1.5 z"
                fill={INK}
                opacity="0.85"
              />
              <path
                d="M13.5 6.5 l1.1 2.4 2.4 1.1 -2.4 1.1 -1.1 2.4 -1.1 -2.4 -2.4 -1.1 2.4 -1.1 z"
                fill={INK}
                opacity="0.5"
              />
            </svg>
          </div>

          <div
            style={{
              position: "absolute",
              left: 48,
              top: 146,
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: INK,
            }}
          >
            {FISH_UI.voiceDesignTitle}
          </div>

          <div
            style={{
              position: "absolute",
              left: 48,
              top: 205,
              fontFamily: FONT,
              fontSize: 27,
              fontWeight: 500,
              color: "rgba(31,31,51,0.62)",
            }}
          >
            {FISH_UI.voiceDesignDesc}
          </div>

          <div
            style={{
              position: "absolute",
              left: 48,
              top: 254,
              display: "flex",
              gap: 14,
            }}
          >
            {[FISH_UI.voiceDesignTime, FISH_UI.voiceDesignBest].map((pill) => (
              <div
                key={pill}
                style={{
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(31,31,51,0.16)",
                  backgroundColor: "rgba(31,31,51,0.035)",
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "rgba(31,31,51,0.66)",
                  whiteSpace: "nowrap",
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        </CreamCard>

        {/* -------------------------------------- creation sparks + voice chips */}
        {CHIP_XS.map((cx, i) => {
          const t = CHIP_T[i];
          const advisor = CHIP_ADVISORS[i];
          const accent = ADVISORS[advisor].accent;

          // spark dot: travels from the card's bottom edge to the chip spot
          const sparkP = interpolate(frame, [t - 12, t - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.quad),
          });
          const sparkOp = interpolate(
            frame,
            [t - 12, t - 9, t - 4, t - 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const sx = 540 + (cx - 540) * sparkP;
          const sy = 468 + (CHIP_Y - 84 - 468) * sparkP;

          // pop entrance
          const pop =
            frame < t
              ? 0
              : spring({
                  frame: frame - t,
                  fps,
                  config: { damping: 12, stiffness: 190, mass: 0.9 },
                });
          const popScale = 0.5 + 0.5 * pop;

          // voice-burst envelope: hard burst on land, settles to a living idle
          const since = frame - t;
          const burst =
            since < 0
              ? 0
              : interpolate(since, [0, 5, 16, 34], [0, 1, 0.78, 0.3], {
                  extrapolateRight: "clamp",
                });
          const level = burst * (0.92 + 0.08 * Math.sin(frame * 0.21 + i * 2.1));
          const waveOp =
            since < 0
              ? 0
              : interpolate(since, [0, 5], [0, 1], {
                  extrapolateRight: "clamp",
                });

          return (
            <React.Fragment key={advisor}>
              {sparkOp > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: sx - 6,
                    top: sy - 6,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: accent,
                    boxShadow: `0 0 18px ${accent}`,
                    opacity: sparkOp,
                  }}
                />
              ) : null}

              {pop > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: cx - 95,
                    top: CHIP_Y - 95,
                    width: 190,
                    height: 190,
                    transform: `scale(${popScale})`,
                    transformOrigin: "center",
                    opacity: Math.min(1, pop * 1.5),
                  }}
                >
                  <PortraitOrb
                    advisor={advisor}
                    x={95}
                    y={95}
                    size={CHIP_SIZE}
                    enter={1}
                    speak={Math.min(1, level)}
                  />
                </div>
              ) : null}

              <div style={{ opacity: waveOp }}>
                <WaveBars
                  frame={frame}
                  x={cx}
                  y={WAVE_Y}
                  w={168}
                  h={62}
                  bars={13}
                  color={accent}
                  level={level}
                  seed={i + 1}
                />
              </div>
            </React.Fragment>
          );
        })}

        {/* ------------------------------------------------------- brand chip */}
        {(() => {
          const fcE =
            frame < FISHCHIP_T
              ? 0
              : spring({
                  frame: frame - FISHCHIP_T,
                  fps,
                  config: { damping: 20, stiffness: 200 },
                });
          return fcE > 0 ? (
            <FishChip
              x={540}
              y={FISHCHIP_Y}
              enter={fcE}
              scale={0.82 + 0.18 * fcE}
            />
          ) : null;
        })()}
      </div>
    </AbsoluteFill>
  );
};
