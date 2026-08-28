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
import { FONT_MONO, FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

export const DURATION_IN_FRAMES = 280;

// ---------------------------------------------------------------------------
// Lovable x Wispr Flow — Part 8 "Typing vs Talking" (1080x1080 @ 30fps)
// Same prompt box, two input modes, one continuous warm-white world.
//   f0-95    SLOW : mid-typing at f0, char-by-char with mistakes + backspace
//                   flicker; mono stopwatch races 00:00 -> 04:31; gray cast.
//   f95-150  TURN : typing stops mid-word; draft wipes clear; fn keycap pops
//                   in and PRESSES-AND-HOLDS (lavender glow); Flowbar slides
//                   up beside it; gray lifts; stopwatch resets to 00:00.
//   f150-250 LOUD : dictation word-bursts stream the Dronea prompt fast; box
//                   grows; ticks spike per burst; stopwatch reads ~00:19.
//   f250-280 HOLD : caret blinks, fn still held, waveform breathing, settled.
// Camera: fx locked at 540 (LwP2 language), vertical travel + zoom only, so
// the 900-wide box stays inside the 54px side margins at every framing.
// ---------------------------------------------------------------------------

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---- world geometry (1080x1080 world coordinates) ----
const CARD_X = 90;
const CARD_W = 900;
const CARD_TOP = 220;
const SW_Y = 164; // stopwatch chip center y

// fn keycap + Flowbar sit side by side below the box (the LwP2 objects).
const KEY_CX = 294;
const KEY_S = 128;
const BAR_W = 456;
const BAR_H = 132;
const BAR_X = 394; // bar left edge -> bar center x = 622
const TICK_BASE = [15, 39, 29, 48, 39, 67, 48, 25, 29, 11];

// ---- Act 1: the slow way — keystroke schedule with mistakes ----
// Already mid-typing at f0. Types "ated lansd", stalls, backspace-flickers
// the "nsd", fixes to "landing page", then stops mid-word on " f".
const BASE_TYPED = "Build a 3D anim";
type Op = { f: number; ch?: string; bs?: true };
const OPS: Op[] = [
  { f: 4, ch: "a" }, { f: 8, ch: "t" }, { f: 12, ch: "e" }, { f: 16, ch: "d" },
  { f: 20, ch: " " },
  { f: 24, ch: "l" }, { f: 28, ch: "a" }, { f: 32, ch: "n" },
  { f: 35, ch: "s" }, { f: 38, ch: "d" }, // rushed -> typo "lansd"
  // hesitation f38-48, then backspace flicker x3
  { f: 49, bs: true }, { f: 52, bs: true }, { f: 55, bs: true },
  { f: 59, ch: "n" }, { f: 62, ch: "d" }, { f: 65, ch: "i" },
  { f: 68, ch: "n" }, { f: 71, ch: "g" },
  { f: 74, ch: " " }, { f: 76, ch: "p" }, { f: 78, ch: "a" },
  { f: 80, ch: "g" }, { f: 82, ch: "e" },
  // second stumble: " fro" for "for", notices, half-deletes, gives up
  { f: 85, ch: " " }, { f: 87, ch: "f" }, { f: 89, ch: "r" }, { f: 91, ch: "o" },
  { f: 96, bs: true }, { f: 99, bs: true }, // stops mid-correction, mid-word
];
const typedAt = (frame: number): string => {
  let s = BASE_TYPED;
  for (const op of OPS) {
    if (op.f > frame) break;
    s = op.bs ? s.slice(0, -1) : s + (op.ch ?? "");
  }
  return s;
};

// ---- Act 3: dictation — the real Dronea prompt (LwP2 text fragments) ----
const PROMPT_TEXT =
  "Build a 3D animated landing page for a stealth drone concept called Dronea. " +
  "It's for aerospace buyers and design-forward tech people. Hero: the drone " +
  "rotates slowly on a warm off-white background... three spec cards... a " +
  "model switcher...";
const WORDS = PROMPT_TEXT.split(" ");

// [burstStartFrame, wordCount] — fast 2-4 word bursts, short breath pauses.
const BURSTS: Array<[number, number]> = [
  [170, 3], [176, 3], [182, 2], [188, 4],
  [198, 3], [204, 2], [210, 3],
  [219, 3], [225, 2], [231, 3],
  [238, 3], [243, 3], [248, 3],
];
const APPEAR: number[] = [];
for (const [start, count] of BURSTS) {
  for (let j = 0; j < count; j += 1) APPEAR.push(start + j);
}

const mmss = (total: number) => {
  const t = Math.max(0, Math.floor(total));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const LwP8TypingVsTalking: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ---- camera: one shared keyframe timeline, hold -> move -> hold ----
  const ease = Easing.inOut(Easing.cubic);
  const KEY_T = [0, 40, 62, 96, 104, 126, 150, 168, 244, 264, 280];
  const fx = 540;
  const fy = interpolate(
    frame,
    KEY_T,
    [330, 330, 348, 348, 348, 540, 540, 526, 552, 548, 548],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const zoom = interpolate(
    frame,
    KEY_T,
    [1.075, 1.075, 1.075, 1.075, 1.075, 1.02, 1.02, 1.055, 1.07, 1.065, 1.065],
    { easing: ease, extrapolateRight: "clamp" }
  );

  // ---- act 1 typing state ----
  const typed = typedAt(frame);
  let lastOpFrame = -99;
  for (const op of OPS) {
    if (op.f <= frame) lastOpFrame = op.f;
    else break;
  }
  const typingActive = frame < 100 && frame - lastOpFrame < 10;

  // ---- turn: wipe the half-typed draft clear ----
  const wipe = interpolate(frame, [102, 117], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const draftGone = frame >= 118;

  // ---- act 3 dictation state ----
  let lastWordFrame = -1;
  let visibleWords = 0;
  for (const a of APPEAR) {
    if (a <= frame) {
      lastWordFrame = a;
      visibleWords += 1;
    } else break;
  }
  const streaming = lastWordFrame >= 0 && frame - lastWordFrame < 14;

  // caret: tired slow blink in act 1, off during the wipe, lively after.
  let caretOn = false;
  if (frame < 102) {
    caretOn = typingActive || frame % 44 < 26;
  } else if (draftGone) {
    caretOn = streaming || (frame - 118) % 32 < 20;
  }

  // waveform energy: hum while the bar lands, spikes with word bursts,
  // gentle breathing floor in the end hold.
  let energy = 0;
  if (frame >= 136) {
    energy =
      lastWordFrame < 0
        ? 0.62 + 0.24 * Math.sin(frame * 0.33)
        : Math.max(0.35, Math.exp(-(frame - lastWordFrame) / 13));
  }

  // ---- gray cast lifts to the full warm white at the turn ----
  const warm = interpolate(frame, [108, 142], [0, 1], { ...clamp, easing: ease });
  const saturation = 0.62 + 0.38 * warm;
  const veilOpacity = 0.12 * (1 - warm);

  // ---- stopwatch: minutes fast-forward -> freeze -> reset -> real seconds ----
  const RESET_F = 134;
  const minutesVal = interpolate(frame, [0, 96], [0, 271], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const secondsVal = Math.min(19, interpolate(frame, [RESET_F, 252], [0, 19.999], clamp));
  const swText = frame < RESET_F ? mmss(minutesVal) : mmss(secondsVal);
  const swPulse =
    frame >= RESET_F
      ? spring({ frame: frame - RESET_F, fps, config: SPRINGS.snappy, durationInFrames: 20 })
      : 0;
  const swScale = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, swPulse));

  // ---- fn keycap press-and-hold (LwP2 mechanics, lavender held-glow) ----
  const keycapIn = frame >= 118 ? spring({ frame: frame - 118, fps, config: SPRINGS.bouncy, durationInFrames: 34 }) : 0;
  const pressT = frame >= 132 ? spring({ frame: frame - 132, fps, config: SPRINGS.snappy }) : 0;
  const held = frame >= 134;
  const glow = held ? (0.5 + 0.5 * Math.sin(frame * 0.13)) * clamp01((frame - 134) / 12) : 0;
  const keyLift = 10 - 7 * pressT;
  const keycapShadow = `0 ${keyLift}px 0 #D9D5CC, 0 ${22 - 13 * pressT}px ${
    36 - 20 * pressT
  }px rgba(20, 18, 12, ${0.16 - 0.05 * pressT}), inset 0 2px 0 rgba(255, 255, 255, 0.9)`;

  // ---- Flowbar slide-up beside the keycap ----
  const barSlide = interpolate(frame, [134, 154], [240, 0], {
    ...clamp,
    easing: Easing.out(Easing.back(1.4)),
  });
  const barIn = interpolate(frame, [134, 144], [0, 1], clamp);
  const wordmarkIn = interpolate(frame, [150, 164], [0, 1], clamp);

  // keycap + bar group drifts down as the box grows toward it.
  const gy = interpolate(frame, [166, 250], [545, 816], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  // send button pops in with the first dictated words.
  const sendIn = frame >= 170 ? spring({ frame: frame - 170, fps, config: SPRINGS.snappy }) : 0;

  // box float: tired and flat in act 1, breathes after the turn.
  const floatAmp = interpolate(frame, [100, 140], [1, 3], clamp);
  const float = Math.sin(frame * 0.045) * floatAmp;

  // draft shrinks from two lines to the empty single line during the wipe.
  const textMinHeight = interpolate(frame, [110, 128], [116, 58], clamp);

  const caret = (
    <span
      style={{
        display: "inline-block",
        width: 4,
        height: 42,
        borderRadius: 2,
        background: LOVABLE.text,
        opacity: caretOn ? 1 : 0,
        verticalAlign: "-6px",
      }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1080,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${zoom})`,
          transformOrigin: `${fx}px ${fy}px`,
          filter: `saturate(${saturation})`,
        }}
      >
        {/* whisper of the Lovable gradient — arrives with the warm turn */}
        <div
          style={{
            position: "absolute",
            left: -300,
            top: -140,
            width: 1680,
            height: 1300,
            background:
              "radial-gradient(ellipse 46% 34% at 50% 38%, rgba(77, 126, 242, 0.13), rgba(77, 126, 242, 0.04) 58%, rgba(77, 126, 242, 0) 74%)",
            opacity: warm,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -300,
            top: 260,
            width: 1680,
            height: 1200,
            background:
              "radial-gradient(ellipse 40% 30% at 50% 60%, rgba(226, 79, 180, 0.065), rgba(226, 79, 180, 0) 70%)",
            opacity: warm,
          }}
        />

        {/* ------------------- stopwatch chip (time data, mm:ss) ------------------- */}
        <div
          style={{
            position: "absolute",
            left: 540,
            top: SW_Y,
            transform: `translate(-50%, -50%) scale(${swScale})`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px 12px 20px",
            background: WORLD.card,
            border: `1px solid ${WORLD.border}`,
            borderRadius: 999,
            boxShadow: WORLD.shadowSoft,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={WORLD.muted} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="13.5" r="8" />
            <path d="M12 13.5V9M10 2.5h4M12 2.5v3" />
          </svg>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
              fontSize: 30,
              fontWeight: 500,
              color: WORLD.muted,
              letterSpacing: "0.5px",
            }}
          >
            {swText}
          </span>
        </div>

        {/* ------------------- Lovable prompt box (real UI recreation) ------------------- */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_TOP,
            width: CARD_W,
            boxSizing: "border-box",
            background: LOVABLE.ui,
            borderRadius: 28,
            border: `1px solid ${LOVABLE.uiBorder}`,
            boxShadow: WORLD.shadow,
            padding: "34px 38px 26px",
            transform: `translateY(${float}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 40,
              lineHeight: "58px",
              letterSpacing: "-0.2px",
              color: LOVABLE.text,
              fontWeight: 450,
              minHeight: textMinHeight,
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {!draftGone ? (
              // THE SLOW WAY: half-typed draft, then the clean wipe
              <span
                style={{
                  display: "inline",
                  clipPath: `inset(0 0 0 ${wipe * 100}%)`,
                  opacity: interpolate(frame, [112, 118], [1, 0], clamp),
                }}
              >
                {typed}
                {caret}
              </span>
            ) : visibleWords === 0 ? (
              <>
                {caret}
                <span style={{ color: LOVABLE.muted, fontWeight: 400, marginLeft: 3 }}>
                  {LOVABLE.strings.placeholder}
                </span>
              </>
            ) : (
              <>
                {WORDS.map((w, i) => {
                  const af = APPEAR[i];
                  if (frame < af) return null;
                  const t = Math.min(1, (frame - af) / 5);
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        marginRight: "0.28em",
                        opacity: 0.2 + 0.8 * t,
                        transform: `translateY(${(1 - t) * 8}px)`,
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
                {caret}
              </>
            )}
          </div>

          {/* bottom row: + circle | Build v, mic, send */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 26,
              height: 64,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: "1.5px solid #E5E2DC",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={LOVABLE.muted} strokeWidth="1.7" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 31,
                  color: LOVABLE.muted,
                  fontWeight: 450,
                  marginRight: 8,
                }}
              >
                {LOVABLE.strings.build}
              </span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={LOVABLE.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke={LOVABLE.muted}
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{ marginLeft: 26 }}
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
              {frame >= 170 && (
                <div
                  style={{
                    width: 58 * Math.min(1, sendIn),
                    marginLeft: 20 * Math.min(1, sendIn),
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: LOVABLE.black,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${sendIn})`,
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------- fn keycap (pops in, pressed and HELD) ------------------- */}
        {frame >= 118 && (
          <div
            style={{
              position: "absolute",
              left: KEY_CX - KEY_S / 2,
              top: gy - KEY_S / 2,
              width: KEY_S,
              height: KEY_S,
            }}
          >
            {/* lavender held-glow halo */}
            <div
              style={{
                position: "absolute",
                left: KEY_S / 2 - 140,
                top: KEY_S / 2 - 140,
                width: 280,
                height: 280,
                borderRadius: 140,
                background: `radial-gradient(circle, ${WISPR.lavender} 0%, rgba(239, 225, 253, 0) 65%)`,
                opacity: glow * 0.9,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: 38,
                boxShadow: `0 0 46px ${WISPR.lavenderBorder}`,
                opacity: glow * 0.5,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                background: "linear-gradient(180deg, #FDFDFB 0%, #F1EFEA 100%)",
                border: "1px solid #DFDCD4",
                boxSizing: "border-box",
                boxShadow: keycapShadow,
                transform: `translateY(${pressT * 7}px) scale(${keycapIn})`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  right: 18,
                  fontFamily: FONT_SANS,
                  fontSize: 30,
                  fontWeight: 500,
                  color: "#6B6860",
                }}
              >
                fn
              </span>
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B6860"
                strokeWidth="1.5"
                style={{ position: "absolute", left: 16, bottom: 14 }}
              >
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="4.2" ry="9" />
                <path d="M3 12h18" />
              </svg>
            </div>
          </div>
        )}

        {/* ------------------- Wispr Flowbar (official colors, live ticks) ------------------- */}
        {frame >= 134 && (
          <>
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: gy + barSlide - BAR_H / 2,
                width: BAR_W,
                height: BAR_H,
                boxSizing: "border-box",
                borderRadius: BAR_H / 2,
                background: WISPR.barBg,
                border: `3px solid ${WISPR.barStroke}`,
                boxShadow: "0 26px 60px rgba(20, 18, 12, 0.28)",
                opacity: barIn,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 25,
                  top: (BAR_H - 6 - 84) / 2,
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: "#71716E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FCFCFB" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 7L7 17M7 7l10 10" />
                </svg>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 129,
                  top: 0,
                  height: BAR_H - 6,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {TICK_BASE.map((b, i) => {
                  const osc =
                    Math.abs(Math.sin(frame * 0.44 + i * 1.35)) * 0.68 +
                    Math.abs(Math.sin(frame * 0.19 + i * 2.63)) * 0.32;
                  const h = Math.min(92, Math.max(10, b * (0.38 + 1.15 * osc * (0.3 + 0.7 * energy))));
                  return (
                    <div
                      key={i}
                      style={{
                        width: 10.5,
                        height: h,
                        borderRadius: 5.25,
                        background: "#FFFFEB",
                        marginRight: i < TICK_BASE.length - 1 ? 9.5 : 0,
                      }}
                    />
                  );
                })}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 25,
                  top: (BAR_H - 6 - 84) / 2,
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: "#FCFCFB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 8l-8.5 8.5L6 12" />
                </svg>
              </div>
            </div>
            <Img
              src={staticFile(WISPR.logoSvg)}
              style={{
                position: "absolute",
                left: BAR_X + BAR_W / 2 - 54,
                top: gy + 90 + barSlide * 0.4,
                width: 108,
                opacity: wordmarkIn * 0.9,
              }}
            />
          </>
        )}
      </div>

      {/* act-1 gray cast: light desaturating veil, lifts at the turn */}
      {veilOpacity > 0.002 && (
        <AbsoluteFill
          style={{
            backgroundColor: "rgba(118, 120, 122, 1)",
            opacity: veilOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
