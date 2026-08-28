// Fish Audio 4 — F4P09EveryBranchVoice (1080x1920 @ 30fps)
// VO: "And every branch has its own voice. The center node is mine, cloned off
//      a ten second clip. The other seven I built in Voice Design, so they all
//      sound different."
// Beat map:
//   f0–40    tight on the amber center orb speaking (slow push 1.88→1.96);
//            "0:10" reference-clip chip pops below the orb at f8 (world space)
//   f40–60   one 20-frame pull-back → full tree framed in the upper half
//   f62–90   seven voice chips pop onto the hubs (4f stagger, bouncy spring) —
//            each carries a DISTINCT static waveform silhouette in its color
//   f95–170  REAL PRODUCT: app-create-voice.png slides in as a fragment card
//            over the lower half; inner camera hold → move (f128–148) → hold,
//            landing with the Voice Design method card filling the width
//   f170–235 Voice Design in action: ALTARI.card2 panel slides over — the
//            `instruction` input types, Generate press ripple (~f205), result
//            row springs in with an animated Deals-red waveform (f212)
//   f235–255 pull back to the map, all 8 voices breathing / glinting
//   f255–280 clean end hold
// Logo chip (logo-light + "VOICE DESIGN") top area f95–235. Compliance pill
// bottom-center during speaking (f6–68) and generation (f196→end) beats.
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
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { ALTARI, API, AUDIO_LABEL, SPRINGS, TREE } from "./theme";
import {
  AltariBackdrop,
  CX,
  CY,
  DEPARTMENTS,
  SkillTreeWorld,
  deg,
  hubPos,
  manropeFamily,
  proceduralBars,
} from "./tree";

export const DURATION_IN_FRAMES = 280;

const { fontFamily: instrumentFamily } = loadInstrument("italic", {
  weights: ["400"],
});

const W = 1080;
const H = 1920;
const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// Static mini-waveform on the "0:10" reference-clip chip (UI data)
const REF_WAVE = [0.35, 0.6, 0.85, 0.5, 0.95, 0.7, 1, 0.55, 0.8, 0.45, 0.9, 0.6, 0.4, 0.3];

// Seven DISTINCT waveform silhouettes — one per department (shown, not written)
const DEPT_WAVES: number[][] = [
  [0.25, 0.5, 0.8, 1, 0.8, 0.5, 0.25, 0.18, 0.14], // Marketing — center peak
  [0.9, 0.45, 0.85, 0.4, 0.8, 0.38, 0.75, 0.35, 0.7], // Operations — alternating
  [0.15, 0.28, 0.42, 0.58, 0.74, 0.9, 1, 0.82, 0.6], // Intelligence — ascending
  [1, 0.78, 0.55, 0.4, 0.3, 0.4, 0.55, 0.78, 1], // Customer — valley
  [0.5, 1, 0.35, 0.9, 0.3, 0.85, 0.28, 0.8, 0.5], // Back Office — spiky
  [1, 0.85, 0.7, 0.56, 0.44, 0.34, 0.27, 0.22, 0.18], // Sales — descending
  [0.4, 0.9, 0.62, 1, 0.5, 0.95, 0.66, 0.88, 0.44], // Deals — dense tall
];

const INSTRUCTION = "Calm, measured, has done this a thousand times";

// Screenshot logical size (asset is 2880x1800 = 2x density)
const SHOT_W = 1440;
const SHOT_H = 900;
// Fragment card viewport (screen space)
const CARD_X = 56;
const CARD_Y = 900;
const CARD_W = 968;
const CARD_H = 620;

export const F4P09EveryBranchVoice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- World camera: hold → move → hold, shared KEY_T --------------------
  const KEY_T = [0, 40, 60, 235, 255, 279];
  const camOpts = {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = 540;
  const fy = interpolate(frame, KEY_T, [540, 540, 866, 866, 622, 622], camOpts);
  const zoom = interpolate(
    frame,
    KEY_T,
    [1.88, 1.96, 0.92, 0.92, 0.98, 0.98],
    camOpts,
  );
  const worldTransform = `translate(${W / 2 - fx * zoom}px, ${
    H / 2 - fy * zoom
  }px) scale(${zoom})`;

  // ---- Center orb speaking: active f0–60, ease to idle, breathe at end ---
  const ampScale = interpolate(
    frame,
    [0, 50, 72, 232, 250],
    [1, 1, 0.3, 0.3, 0.55],
    camOpts,
  );
  const barValues = proceduralBars(frame, true).map((v) => v * ampScale);

  // Labels slightly dimmed while the camera is tight, restore on pull-back
  const labelDim = interpolate(frame, [40, 60], [0.4, 0], camOpts);

  // ---- "0:10" reference-clip chip (world space, below the orb) -----------
  const refIn = spring({ frame: frame - 8, fps, config: SPRINGS.snappy });
  const refOut = interpolate(frame, [42, 56], [1, 0], camOpts);

  // ---- Voice chips on the seven hubs -------------------------------------
  const glint = interpolate(frame, [238, 252], [0, 1], camOpts);

  // ---- Screenshot fragment card ------------------------------------------
  const cardSlide = interpolate(frame, [95, 113], [1080, 0], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [235, 250], [0, 190], camOpts);
  const exitO = interpolate(frame, [235, 246], [1, 0], camOpts);

  // Inner image camera: hold → move (f128–148) → hold on the Voice Design card
  const IKEY = [96, 128, 148, 234];
  const ix = interpolate(frame, IKEY, [826, 826, 1028, 1028], camOpts);
  const iy = interpolate(frame, IKEY, [450, 450, 384, 384], camOpts);
  const iz = interpolate(frame, IKEY, [1.15, 1.15, 2.26, 2.26], camOpts);

  // ---- Voice Design mini-UI panel ----------------------------------------
  const panelSlide = interpolate(frame, [170, 186], [660, 0], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelO =
    interpolate(frame, [170, 179], [0, 1], camOpts) *
    interpolate(frame, [235, 244], [1, 0], camOpts);

  // Typing (string slicing)
  const typedChars = Math.max(0, Math.min(INSTRUCTION.length, Math.floor((frame - 176) * 1.8)));
  const typed = INSTRUCTION.slice(0, typedChars);
  const cursorOn = frame < 204 && frame % 22 < 13;

  // Generate press (~f205)
  const press = interpolate(frame, [203, 206, 211], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleT = interpolate(frame, [204, 218], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [204, 207, 216], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Result row (f212)
  const resultIn = spring({ frame: frame - 212, fps, config: SPRINGS.snappy });

  // ---- Logo chip (top area, product beats) -------------------------------
  const logoInRaw = interpolate(frame, [96, 108], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoO = logoInRaw * interpolate(frame, [236, 246], [1, 0], camOpts);

  // ---- Compliance pill (speaking + generation beats) ---------------------
  const compO = Math.max(
    interpolate(frame, [6, 18, 56, 68], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [196, 208], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Opaque Altari base — full frame, frame 0 → last */}
      <AltariBackdrop width={W} height={H} />

      {/* ------------------- One world, one camera ------------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: worldTransform,
          transformOrigin: "0 0",
        }}
      >
        <SkillTreeWorld
          frame={frame}
          revealAt={-120}
          labelDim={labelDim}
          speaker="center"
          barValues={barValues}
          brainOpacity={0.45}
          orbIn={1}
        />

        {/* "0:10" reference clip chip — mini static waveform + numeral */}
        {refOut > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: CX,
              top: CY + 203,
              transform: `translate(-50%, -50%) scale(${refIn}) translateY(${
                (1 - refOut) * 16
              }px)`,
              opacity: refOut,
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: ALTARI.card,
              border: `1px solid ${ALTARI.border}`,
              borderRadius: 999,
              padding: "12px 22px",
              boxShadow: "0 12px 34px rgba(8,8,20,0.45)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 3.5 }}>
              {REF_WAVE.map((v, k) => (
                <div
                  key={k}
                  style={{
                    width: 3.5,
                    height: 5 + v * 22,
                    borderRadius: 2,
                    backgroundColor: TREE.orb,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: instrumentFamily,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 34,
                letterSpacing: 1,
                color: TREE.cream,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              0:10
            </div>
          </div>
        )}

        {/* Seven voice chips — one per hub, each waveform distinct */}
        {DEPARTMENTS.map((dept, i) => {
          const pos = hubPos(i);
          const outY = Math.sin(deg(dept.angle));
          const dy = outY >= 0.4 ? -62 : 62;
          const s = spring({
            frame: frame - (62 + i * 4),
            fps,
            config: SPRINGS.bouncy,
          });
          if (s < 0.001) return null;
          const glow = 0.28 + glint * (0.3 + 0.22 * Math.sin(frame * 0.18 + i * 1.7));
          return (
            <div
              key={dept.name}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y + dy,
                transform: `translate(-50%, -50%) scale(${s})`,
                display: "flex",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(26,26,46,0.92)",
                border: `1.5px solid ${rgba(dept.color, 0.85)}`,
                borderRadius: 999,
                padding: "9px 14px",
                boxShadow: `0 0 ${10 + glint * 16}px ${rgba(dept.color, glow)}`,
              }}
            >
              {DEPT_WAVES[i].map((v, k) => {
                const breathe =
                  1 +
                  (0.05 + glint * 0.22) *
                    Math.sin(frame * 0.17 + i * 1.9 + k * 0.8);
                return (
                  <div
                    key={k}
                    style={{
                      width: 4,
                      height: 5 + v * 20,
                      borderRadius: 2,
                      backgroundColor: dept.color,
                      transform: `scaleY(${breathe})`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ------------- REAL PRODUCT: Create Voice screenshot ------------- */}
      {frame >= 94 && exitO > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 20,
            border: `1px solid ${ALTARI.border}`,
            overflow: "hidden",
            backgroundColor: "#F7F5F1",
            boxShadow: "0 42px 110px rgba(8,8,20,0.6)",
            transform: `translateY(${cardSlide + exitY}px)`,
            opacity: exitO,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${CARD_W / 2 - ix * iz}px, ${
                CARD_H / 2 - iy * iz
              }px) scale(${iz})`,
              transformOrigin: "0 0",
            }}
          >
            <Img
              src={staticFile("fish4/site/app-create-voice.png")}
              style={{ width: SHOT_W, height: SHOT_H, display: "block" }}
            />
          </div>
        </div>
      )}

      {/* ------------- Voice Design in action (mini-UI panel) ------------- */}
      {frame >= 168 && panelO > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: 985,
            width: CARD_W,
            height: 530,
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 36px 90px rgba(8,8,20,0.5)",
            transform: `translateY(${panelSlide + exitY}px)`,
            opacity: panelO,
            padding: "32px 38px",
            boxSizing: "border-box",
            fontFamily: manropeFamily,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 34,
                color: "#171717",
                letterSpacing: 0.2,
              }}
            >
              Voice Design
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: 1.5,
                color: "#55534E",
                backgroundColor: "#F4F3F1",
                border: "1px solid #E5E4E1",
                borderRadius: 8,
                padding: "7px 12px",
              }}
            >
              {API.voiceDesignModel}
            </div>
          </div>

          {/* Instruction field (mirrors the real API `instruction` input) */}
          <div
            style={{
              marginTop: 24,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: "#8A8884",
            }}
          >
            Instruction
          </div>
          <div
            style={{
              marginTop: 10,
              minHeight: 122,
              backgroundColor: "#F6F5F3",
              border: "1px solid #E5E4E1",
              borderRadius: 14,
              padding: "20px 24px",
              boxSizing: "border-box",
              fontWeight: 500,
              fontSize: 30,
              lineHeight: 1.45,
              color: "#171717",
            }}
          >
            {typed}
            {cursorOn && (
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 30,
                  marginLeft: 3,
                  verticalAlign: "-4px",
                  backgroundColor: "#171717",
                }}
              />
            )}
          </div>

          {/* Generate */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ position: "relative" }}>
              {rippleT > 0 && rippleT < 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 30 + rippleT * 190,
                    height: 30 + rippleT * 190,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.4)",
                    opacity: 0.5 * (1 - rippleT),
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  backgroundColor: "#141414",
                  borderRadius: 12,
                  padding: "15px 34px",
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#FFFFFF",
                  letterSpacing: 0.3,
                  transform: `scale(${1 - press * 0.06})`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#3A3A3A",
                    opacity: flash,
                  }}
                />
                <span style={{ position: "relative" }}>Generate</span>
              </div>
            </div>
          </div>

          {/* Result row — generated voice, Deals red */}
          {resultIn > 0.001 && (
            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 20,
                backgroundColor: "#FDF4F3",
                border: `1px solid ${rgba(ALTARI.red, 0.45)}`,
                borderRadius: 14,
                padding: "16px 22px",
                opacity: Math.min(1, resultIn * 1.3),
                transform: `translateY(${(1 - resultIn) * 20}px) scale(${
                  0.94 + resultIn * 0.06
                })`,
                transformOrigin: "center top",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  backgroundColor: rgba(ALTARI.red, 0.16),
                  border: `1.5px solid ${ALTARI.red}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="18" viewBox="0 0 16 18">
                  <polygon points="2,1 15,9 2,17" fill={ALTARI.red} />
                </svg>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flex: 1,
                }}
              >
                {Array.from({ length: 26 }).map((_, k) => {
                  const pop = spring({
                    frame: frame - (212 + k * 0.55),
                    fps,
                    config: SPRINGS.bouncy,
                  });
                  const base = 0.35 + 0.65 * Math.abs(Math.sin(k * 0.9 + 2.1));
                  const anim =
                    0.55 + 0.45 * Math.abs(Math.sin(frame * 0.3 + k * 0.85));
                  return (
                    <div
                      key={k}
                      style={{
                        width: 5,
                        height: Math.max(4, (7 + base * 26 * anim) * pop),
                        borderRadius: 3,
                        backgroundColor: ALTARI.red,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- Fish Audio logo chip (top) -------------------- */}
      {logoO > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 212,
            display: "flex",
            justifyContent: "center",
            opacity: logoO,
            transform: `translateY(${(1 - logoInRaw) * -10}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              backgroundColor: ALTARI.card,
              border: `1px solid ${ALTARI.border}`,
              borderRadius: 999,
              padding: "13px 26px",
              boxShadow: "0 10px 30px rgba(8,8,20,0.4)",
            }}
          >
            {/* NOTE: filenames are inverted in public/fish-audio/ —
                logo-dark.png is the WHITE wordmark (correct for dark bg) */}
            <Img
              src={staticFile("fish-audio/logo-dark.png")}
              style={{ height: 26, display: "block" }}
            />
            <div
              style={{
                width: 1,
                height: 22,
                backgroundColor: ALTARI.border,
              }}
            />
            <div
              style={{
                fontFamily: manropeFamily,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 3.5,
                color: ALTARI.body,
              }}
            >
              VOICE DESIGN
            </div>
          </div>
        </div>
      )}

      {/* --------------- Compliance pill (bottom-center) --------------- */}
      {compO > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 258,
            display: "flex",
            justifyContent: "center",
            opacity: compO,
            transform: `translateY(${(1 - compO) * 10}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: ALTARI.card,
              border: `1px solid ${ALTARI.border}`,
              borderRadius: 999,
              padding: "10px 20px",
              fontFamily: manropeFamily,
              fontWeight: 500,
              fontSize: 19,
              letterSpacing: 0.4,
              color: ALTARI.body,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: ALTARI.amber,
                opacity: 0.72 + 0.28 * Math.sin(frame * 0.28),
              }}
            />
            {AUDIO_LABEL}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
