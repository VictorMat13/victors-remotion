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
import { FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

export const DURATION_IN_FRAMES = 300;

// ---------------------------------------------------------------------------
// Lovable x Wispr Flow — Part 2 "Voice Dump" (1080x1920 @ 30fps)
// One continuous warm-white world, gentle push-ins, hold → move → hold.
//   f0-60    OPEN: floating Lovable prompt box; cursor glides in + clicks.
//   f60-110  KEY : "fn" keycap pops in, is pressed AND HELD; Flowbar rises.
//   f110-255 DUMP: prompt streams in fast word bursts; box grows; ticks dance.
//   f255-300 HOLD: settle, caret blinks, waveform stays gently alive.
// ---------------------------------------------------------------------------

// Real product UI text — the prompt being dictated into Lovable.
const PROMPT_TEXT =
  "Build a 3D animated landing page for a stealth drone concept called Dronea. " +
  "It's for aerospace buyers and design-forward tech people. Hero: the drone " +
  "rotates slowly on a warm off-white background... three spec cards... a model " +
  "switcher... black pill button that says Explore the Design.";
const WORDS = PROMPT_TEXT.split(" ");

// Dictation schedule: [burstStartFrame, wordCount]. Fast 2-4 word bursts with
// short pauses after sentence ends — cleaned-up dictation at speed.
const BURSTS: Array<[number, number]> = [
  [132, 3], [138, 3], [144, 4], [151, 3],
  [164, 3], [170, 2], [176, 3],
  [189, 3], [195, 2], [201, 3], [207, 2],
  [218, 3], [225, 3],
  [234, 3], [240, 2], [245, 3],
];
const APPEAR: number[] = [];
for (const [start, count] of BURSTS) {
  for (let j = 0; j < count; j += 1) APPEAR.push(start + j);
}

// World geometry (1080x1920 world coordinates).
const CARD_X = 90;
const CARD_W = 900;
const CARD_TOP = 560;
const CLICK = { x: 380, y: 664 };

// Flowbar recreated from the official wispr-flowbar.svg at ~4.7x scale —
// exact colors: pill #1A1A1A, stroke #4D4A42, ticks #FFFFEB.
const BAR_W = 456;
const BAR_H = 132;
const TICK_BASE = [15, 39, 29, 48, 39, 67, 48, 25, 29, 11];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const LwP2VoiceDump: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ---- camera: one shared keyframe timeline ----
  const ease = Easing.inOut(Easing.cubic);
  const KEY_T = [0, 16, 34, 60, 80, 110, 130, 250, 268, 300];
  const fx = 540;
  const fy = interpolate(
    frame,
    KEY_T,
    [850, 850, 805, 805, 1035, 1035, 930, 975, 978, 980],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const zoom = interpolate(
    frame,
    KEY_T,
    [1.0, 1.0, 1.05, 1.05, 1.07, 1.07, 1.03, 1.065, 1.06, 1.061],
    { easing: ease, extrapolateRight: "clamp" }
  );

  // ---- dictation state ----
  let lastWordFrame = -1;
  let visibleWords = 0;
  for (const a of APPEAR) {
    if (a <= frame) {
      lastWordFrame = a;
      visibleWords += 1;
    } else break;
  }
  const streaming = lastWordFrame >= 0 && frame - lastWordFrame < 14;
  const caretOn = frame >= 50 && (streaming || (frame - 50) % 32 < 20);

  // Waveform energy: mid while "talking" pre-text, spikes with word bursts,
  // gentle floor in the end hold.
  let energy = 0;
  if (frame >= 92) {
    energy =
      lastWordFrame < 0
        ? 0.62 + 0.24 * Math.sin(frame * 0.33)
        : Math.max(0.35, Math.exp(-(frame - lastWordFrame) / 13));
  }

  // ---- cursor glide + click ----
  const curX = interpolate(frame, [8, 44, 58, 82], [1040, CLICK.x, CLICK.x, 880], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curY = interpolate(frame, [8, 44, 58, 82], [1430, CLICK.y, CLICK.y, 1030], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curOpacity = interpolate(frame, [8, 16, 64, 82], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curScale = interpolate(frame, [44, 47, 52], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleT = interpolate(frame, [47, 66], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- keycap press-and-hold ----
  const keycapIn = spring({ frame: frame - 70, fps, config: SPRINGS.bouncy, durationInFrames: 34 });
  const pressT = spring({ frame: frame - 86, fps, config: SPRINGS.snappy });
  const held = frame >= 88;
  const glow = held ? (0.5 + 0.5 * Math.sin(frame * 0.16)) * clamp01((frame - 88) / 12) : 0;
  const keyLift = 10 - 7 * pressT;
  const keycapShadow = `0 ${keyLift}px 0 #D9D5CC, 0 ${22 - 13 * pressT}px ${
    36 - 20 * pressT
  }px rgba(20, 18, 12, ${0.16 - 0.05 * pressT}), inset 0 2px 0 rgba(255, 255, 255, 0.9)`;

  // ---- flowbar slide-up ----
  const barSlide = interpolate(frame, [88, 108], [530, 0], {
    easing: Easing.out(Easing.back(1.4)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barIn = interpolate(frame, [88, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordmarkIn = interpolate(frame, [102, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Keycap group drifts down during the dump as the box grows toward it.
  const gy = interpolate(frame, [130, 240], [1080, 1290], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Send button pops in with the first words.
  const sendIn = frame >= 132 ? spring({ frame: frame - 132, fps, config: SPRINGS.snappy }) : 0;

  const float = Math.sin(frame * 0.045) * 3;

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
          height: 1920,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${zoom})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* whisper of the Lovable gradient behind the card (background bleed OK) */}
        <div
          style={{
            position: "absolute",
            left: -260,
            top: 160,
            width: 1600,
            height: 1500,
            background:
              "radial-gradient(ellipse 46% 34% at 50% 38%, rgba(77, 126, 242, 0.13), rgba(77, 126, 242, 0.04) 58%, rgba(77, 126, 242, 0) 74%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -260,
            top: 520,
            width: 1600,
            height: 1400,
            background:
              "radial-gradient(ellipse 40% 30% at 50% 60%, rgba(226, 79, 180, 0.065), rgba(226, 79, 180, 0) 70%)",
          }}
        />

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
              minHeight: 58,
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {visibleWords === 0 ? (
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

          {/* bottom row: + circle | Build ▾, mic, send */}
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
              {frame >= 132 && (
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

          {/* click ripple (card-local coordinates) */}
          {frame >= 47 && frame <= 66 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: CLICK.x - CARD_X - (12 + rippleT * 64),
                  top: CLICK.y - CARD_TOP - (12 + rippleT * 64),
                  width: (12 + rippleT * 64) * 2,
                  height: (12 + rippleT * 64) * 2,
                  borderRadius: "50%",
                  border: "2.5px solid rgba(23, 23, 23, 0.30)",
                  opacity: 1 - rippleT,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: CLICK.x - CARD_X - (8 + rippleT * 36),
                  top: CLICK.y - CARD_TOP - (8 + rippleT * 36),
                  width: (8 + rippleT * 36) * 2,
                  height: (8 + rippleT * 36) * 2,
                  borderRadius: "50%",
                  background: "rgba(23, 23, 23, 0.06)",
                  opacity: 1 - rippleT,
                }}
              />
            </>
          )}
        </div>

        {/* ------------------- fn keycap (pressed and held) ------------------- */}
        {frame >= 68 && (
          <div style={{ position: "absolute", left: 540 - 64, top: gy - 64, width: 128, height: 128 }}>
            <div
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: 38,
                boxShadow: "0 0 46px rgba(146, 126, 84, 0.55)",
                opacity: glow * 0.55,
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
        {frame >= 86 && (
          <>
            <div
              style={{
                position: "absolute",
                left: 540 - BAR_W / 2,
                top: gy + 170 + barSlide - BAR_H / 2,
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
                left: 540 - 54,
                top: gy + 280 + barSlide * 0.4 - 15,
                width: 108,
                opacity: wordmarkIn * 0.9,
              }}
            />
          </>
        )}

        {/* ------------------- cursor ------------------- */}
        {curOpacity > 0 && (
          <div
            style={{
              position: "absolute",
              left: curX,
              top: curY,
              opacity: curOpacity,
              transform: `scale(${curScale})`,
              transformOrigin: "6px 4px",
            }}
          >
            <svg width="34" height="54" viewBox="0 0 320 512">
              <path
                d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"
                fill="#1A1A1A"
                stroke="#FFFFFF"
                strokeWidth="26"
                paintOrder="stroke"
              />
            </svg>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
