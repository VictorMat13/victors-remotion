import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: sansFamily } = loadSans("normal", {
  weights: ["400", "600", "700"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
});

// -------------------------------------------------------------------------
// "Here's the whole build." One continuous flow: the Fish Audio developer
// dashboard (grab the key) hands off to a Claude Code terminal (wire it up).
// No on-screen narration text — only recreated product UI / CLI text.
// 1080x1920, 380 frames.
// -------------------------------------------------------------------------
export const DURATION_IN_FRAMES = 380;

const DASH_SRC = "fish-audio/dev-01-dashboard.png";
const MODAL_SRC = "fish-audio/dev-03-createkey.png";
// logo-light.png is the DARK logo artwork — correct for light backgrounds.
const LOGO_SRC = "fish-audio/logo-light.png";

// Light paper palette (Liam's regular style)
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  blue: "#2563EB",
  blueLite: "#7DA9FB",
  green: "#16A34A",
};

// The terminal window stays dark — its palette is untouched.
const TERM_COLORS = {
  cream: "#F4EDDC",
  muted: "#8E96A8",
  green: "#4ade80",
};

const CARD_SHADOW =
  "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)";

// Screenshot card (screenshots are 2088x1562)
const CARD_X = 70;
const CARD_Y = 330;
const CARD_W = 940;
const CARD_H = Math.round((CARD_W * 1562) / 2088); // 703

// Click targets, measured as fractions of the screenshots.
// A = "Create API Key" button on dev-01. B = "Create" button in the modal.
const BTN_A = { fx: 0.902, fy: 0.264 };
const BTN_B = { fx: 0.6795, fy: 0.6544 };
// Zoom origin A sits right of the button so the button pulls fully inside
// the card at max zoom; its on-screen position at zoom 1.7 is derived
// below and used as the cursor/ripple target. Origin B is the modal's
// Create button itself, so that point is zoom-invariant.
const ORIGIN_A = { fx: 0.945, fy: 0.264 };
const ZOOM_A = 1.7;
const TARGET_A = {
  x: CARD_X + (ORIGIN_A.fx + (BTN_A.fx - ORIGIN_A.fx) * ZOOM_A) * CARD_W,
  y: CARD_Y + BTN_A.fy * CARD_H,
};
const TARGET_B = { x: CARD_X + BTN_B.fx * CARD_W, y: CARD_Y + BTN_B.fy * CARD_H };

const CLICK_A = 78;
const CLICK_B = 126;

// Terminal window
const TERM_X = 70;
const TERM_Y = 380;
const TERM_W = 940;
const TERM_H = 1150;
const TITLE_H = 56;

const PROMPT_LINE = "~ $ claude";
const USER_L1 = "> wire up fish audio S2.1 Pro so my"; // 35 chars
const USER_L2 = "second brain can talk"; // + separating space = 57 total
const USER_TOTAL = USER_L1.length + 1 + USER_L2.length;

const LOG_LINES = [
  { text: "┌ wiring voice into the brain...", check: false },
  { text: "◇ reading fish.audio API docs", check: true },
  { text: "◇ FISH_API_KEY added to .env", check: true },
  { text: "◇ voice.ts created — S2.1 Pro TTS", check: true },
  { text: "◇ replies routed through the clone", check: true },
];
const LOGS_START = 272;
const LOG_STAGGER = 9;
const SUCCESS_START = 330;
const WAVE_START = 336;

// Paper background — base, soft radial accent glow, masked grid
// (same pattern as FishVoiceCallOrb's Background).
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(1100px 1100px at 50% 40%, rgba(37,99,235,0.08), transparent 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.026) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
        maskImage:
          "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE = Easing.inOut(Easing.cubic);
const EASE_OUT = Easing.out(Easing.cubic);

type Pt = { x: number; y: number };
const qBezier = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};

const CURSOR_START: Pt = { x: 560, y: 820 };
const CURVE_1: Pt = { x: 830, y: 700 }; // control point, glide 1
const CURVE_2: Pt = { x: 870, y: 690 }; // control point, glide 2

// macOS-style arrow cursor; the polygon tip sits at the (x, y) point
const MacCursor: React.FC<{ x: number; y: number; scale: number; opacity: number }> = ({
  x,
  y,
  scale,
  opacity,
}) => (
  <svg
    width={28}
    height={32}
    viewBox="0 0 14 16"
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `scale(${scale})`,
      transformOrigin: "0 0",
      opacity,
      filter: "drop-shadow(0 2px 5px rgba(18,24,40,0.30))",
    }}
  >
    <polygon
      points="0.5,0.5 0.5,13.4 3.7,10.5 5.7,15.1 8.1,14.0 6.1,9.6 10.4,9.6"
      fill="#FFFFFF"
      stroke="#201515"
      strokeWidth={0.75}
      strokeLinejoin="round"
    />
  </svg>
);

export const FishWholeBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ----------------------------------------------------------------------
  // SCENE 1 — the developer dashboard card
  // ----------------------------------------------------------------------
  // Present from frame 0 (bright screenshot — never a dark first frame),
  // quick scale settle only.
  const cardIn =
    0.95 +
    0.05 *
      spring({
        frame,
        fps,
        config: { damping: 18, stiffness: 120 },
      });

  // Internal zoom rig: 1.0 hold -> punch to 1.7 on the Create API Key
  // button -> release to 1.0 during the crossfade -> punch to 1.6 on the
  // modal. The transformOrigin switches at frame 90, exactly when the zoom
  // passes through 1.0, so the swap is invisible.
  const innerZoom = interpolate(
    frame,
    [40, 70, CLICK_A, 90, 106],
    [1, ZOOM_A, ZOOM_A, 1, 1.6],
    { easing: EASE, ...CLAMP },
  );
  const zoomOrigin =
    frame < 90
      ? `${ORIGIN_A.fx * 100}% ${ORIGIN_A.fy * 100}%`
      : `${BTN_B.fx * 100}% ${BTN_B.fy * 100}%`;

  // Crossfade dashboard -> create-key modal right after click A
  const modalIn = interpolate(frame, [80, 96], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });

  // Cursor: two curved glides. Between/after glides it rests on the target.
  const glide1 = interpolate(frame, [46, 72], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const glide2 = interpolate(frame, [100, CLICK_B], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const cursorPos =
    glide2 > 0
      ? qBezier(TARGET_A, CURVE_2, TARGET_B, glide2)
      : qBezier(CURSOR_START, CURVE_1, TARGET_A, glide1);
  const dip = (click: number) =>
    interpolate(frame, [click - 3, click, click + 3, click + 6], [1, 0.85, 0.85, 1], CLAMP);
  const cursorScale = dip(CLICK_A) * dip(CLICK_B);
  const cursorOpacity = interpolate(frame, [134, 148], [1, 0], CLAMP);

  // Key-created pill
  const pillPop = spring({
    frame: frame - 130,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const copiedPop = spring({
    frame: frame - 136,
    fps,
    config: { damping: 12, stiffness: 190 },
  });

  // Scene 1 exit: everything slides up and out while the terminal enters
  const exitY = interpolate(frame, [152, 178], [0, -1150], {
    easing: EASE,
    ...CLAMP,
  });

  // ----------------------------------------------------------------------
  // SCENE 2 — the terminal
  // ----------------------------------------------------------------------
  const entryY = interpolate(frame, [158, 186], [1560, 0], {
    easing: EASE_OUT,
    ...CLAMP,
  });
  const rotX = interpolate(frame, [158, 200], [20, 0], {
    easing: EASE_OUT,
    ...CLAMP,
  });
  const entryScale = interpolate(frame, [158, 196], [0.96, 1], {
    easing: EASE_OUT,
    ...CLAMP,
  });
  // Zoom-on-typing punch. Outer stays subtle so the window never crosses
  // the 5% side margins; the content wrapper carries the rest of the push.
  const outerPunch = interpolate(frame, [220, 268, 290], [1, 1.03, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const contentPunch = interpolate(frame, [220, 268, 290], [1, 1.05, 1], {
    easing: EASE,
    ...CLAMP,
  });

  // Typing
  const charsA = Math.min(
    PROMPT_LINE.length,
    Math.max(0, Math.floor((frame - 196) * 0.55)),
  );
  const charsB = Math.min(USER_TOTAL, Math.max(0, Math.floor((frame - 220) * 1.2)));
  const aMuted = PROMPT_LINE.slice(0, Math.min(charsA, 4));
  const aCmd = charsA > 4 ? PROMPT_LINE.slice(4, charsA) : "";
  const b1 = USER_L1.slice(0, Math.min(charsB, USER_L1.length));
  const b2 = charsB > USER_L1.length + 1 ? USER_L2.slice(0, charsB - USER_L1.length - 1) : "";
  const typingA = frame >= 196 && frame < 219;
  const typingB = frame >= 219 && frame < 272;

  // Success line + blinking block cursor
  const successPop = spring({
    frame: frame - SUCCESS_START,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const blinkOn = Math.floor(frame / 16) % 2 === 0;

  // Waveform (the voice replying)
  const waveIn = interpolate(frame, [WAVE_START, WAVE_START + 10], [0, 1], {
    easing: EASE_OUT,
    ...CLAMP,
  });

  const monoLine: React.CSSProperties = {
    fontFamily: monoFamily,
    fontSize: 26,
    lineHeight: 1.6,
    height: 44,
    whiteSpace: "pre",
    color: TERM_COLORS.cream,
  };

  const ripple = (click: number, target: Pt, key: string) => {
    if (frame < click) return null;
    const t = (frame - click) / 14;
    if (t > 1) return null;
    const r = 10 + t * 36;
    return (
      <circle
        key={key}
        cx={target.x}
        cy={target.y}
        r={r}
        fill="none"
        stroke={COLORS.blue}
        strokeWidth={2}
        opacity={0.6 * (1 - t)}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* paper background: base + glow + masked grid */}
      <Background />

      {/* Fish Audio header chip — stays for the whole clip */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [0, 10], [0.6, 1], CLAMP),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 22px",
            borderRadius: 999,
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: CARD_SHADOW,
          }}
        >
          <Img src={staticFile(LOGO_SRC)} style={{ height: 34, display: "block" }} />
          <div
            style={{
              fontFamily: sansFamily,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 3,
              color: COLORS.blue,
              textTransform: "uppercase",
            }}
          >
            S2.1 Pro
          </div>
        </div>
      </div>

      {/* ------------------- SCENE 1 group (slides out) ------------------- */}
      {frame < 186 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${exitY}px)`,
          }}
        >
          {/* screenshot card */}
          <div
            style={{
              position: "absolute",
              left: CARD_X,
              top: CARD_Y,
              width: CARD_W,
              height: CARD_H,
              transform: `scale(${cardIn})`,
              borderRadius: 28,
              overflow: "hidden",
              border: `1px solid ${COLORS.cardBorder}`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${innerZoom})`,
                transformOrigin: zoomOrigin,
              }}
            >
              <Img
                src={staticFile(DASH_SRC)}
                style={{ position: "absolute", inset: 0, width: CARD_W, height: CARD_H }}
              />
              {modalIn > 0 && (
                <Img
                  src={staticFile(MODAL_SRC)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: CARD_W,
                    height: CARD_H,
                    opacity: modalIn,
                  }}
                />
              )}
            </div>
          </div>

          {/* click ripples */}
          <svg
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
          >
            {ripple(CLICK_A, TARGET_A, "rpA")}
            {ripple(CLICK_B, TARGET_B, "rpB")}
          </svg>

          {/* recreated "key created" row */}
          {frame >= 130 && (
            <div
              style={{
                position: "absolute",
                top: 962,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                transform: `scale(${0.75 + 0.25 * pillPop})`,
                opacity: Math.min(1, pillPop * 1.4),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 26px",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: `1px solid ${COLORS.cardBorder}`,
                  boxShadow: CARD_SHADOW,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: COLORS.blue,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: monoFamily,
                    fontSize: 26,
                    color: COLORS.ink,
                    whiteSpace: "pre",
                  }}
                >
                  fk-{"•".repeat(12)}3af2
                </div>
                {frame >= 136 && (
                  <div
                    style={{
                      fontFamily: sansFamily,
                      fontWeight: 600,
                      fontSize: 19,
                      color: "#ffffff",
                      background: COLORS.blue,
                      borderRadius: 999,
                      padding: "6px 16px",
                      transform: `scale(${0.6 + 0.4 * copiedPop})`,
                    }}
                  >
                    Copied
                  </div>
                )}
              </div>
            </div>
          )}

          {/* simulated cursor */}
          <MacCursor
            x={cursorPos.x}
            y={cursorPos.y}
            scale={cursorScale}
            opacity={cursorOpacity}
          />
        </div>
      )}

      {/* ------------------- SCENE 2: the terminal ------------------- */}
      {frame >= 152 && (
        <div
          style={{
            position: "absolute",
            left: TERM_X,
            top: TERM_Y,
            width: TERM_W,
            height: TERM_H,
            transform: `perspective(1400px) translateY(${entryY}px) rotateX(${rotX}deg) scale(${
              entryScale * outerPunch
            })`,
            transformOrigin: "50% 20%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0d0d0d",
              boxShadow: "0 30px 70px rgba(18,24,40,0.22)",
            }}
          >
            {/* title bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: TITLE_H,
                background: "#1f1f1f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  display: "flex",
                  gap: 9,
                }}
              >
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div
                    key={c}
                    style={{ width: 12, height: 12, borderRadius: 999, background: c }}
                  />
                ))}
              </div>
              <div style={{ fontFamily: monoFamily, fontSize: 22, color: TERM_COLORS.muted }}>
                victor@second-brain
              </div>
            </div>

            {/* content */}
            <div
              style={{
                position: "absolute",
                top: TITLE_H,
                left: 0,
                right: 0,
                bottom: 0,
                padding: "36px 40px 0 48px",
                transform: `scale(${contentPunch})`,
                transformOrigin: "30% 10%",
              }}
            >
              {/* ~ $ claude */}
              <div style={monoLine}>
                <span style={{ color: TERM_COLORS.muted }}>{aMuted}</span>
                <span style={{ color: TERM_COLORS.cream }}>{aCmd}</span>
                {typingA && <span style={{ color: TERM_COLORS.cream }}>{"▊"}</span>}
              </div>
              <div style={{ height: 8 }} />

              {/* user prompt, wrapped across two lines */}
              <div style={monoLine}>
                <span style={{ color: TERM_COLORS.cream }}>{b1}</span>
                {typingB && charsB <= USER_L1.length && (
                  <span style={{ color: TERM_COLORS.cream }}>{"▊"}</span>
                )}
              </div>
              <div style={monoLine}>
                <span style={{ color: TERM_COLORS.cream }}>{b2 ? `  ${b2}` : ""}</span>
                {typingB && charsB > USER_L1.length && (
                  <span style={{ color: TERM_COLORS.cream }}>{"▊"}</span>
                )}
              </div>
              <div style={{ height: 14 }} />

              {/* log lines */}
              {LOG_LINES.map((line, i) => {
                const start = LOGS_START + i * LOG_STAGGER;
                const lineIn = interpolate(frame, [start, start + 5], [0, 1], {
                  easing: EASE_OUT,
                  ...CLAMP,
                });
                const checkPop = spring({
                  frame: frame - (start + 5),
                  fps,
                  config: { damping: 12, stiffness: 200 },
                });
                const isHeader = !line.check;
                return (
                  <div
                    key={`log${i}`}
                    style={{
                      ...monoLine,
                      opacity: lineIn,
                      transform: `translateY(${(1 - lineIn) * 10}px)`,
                    }}
                  >
                    <span style={{ color: TERM_COLORS.muted }}>{line.text.slice(0, 2)}</span>
                    <span style={{ color: isHeader ? TERM_COLORS.muted : TERM_COLORS.green }}>
                      {line.text.slice(2)}
                    </span>
                    {line.check && frame >= start + 5 && (
                      <span
                        style={{
                          color: TERM_COLORS.green,
                          display: "inline-block",
                          transform: `scale(${0.5 + 0.5 * checkPop})`,
                        }}
                      >
                        {" ✓"}
                      </span>
                    )}
                  </div>
                );
              })}
              <div style={{ height: 14 }} />

              {/* success line */}
              <div
                style={{
                  fontFamily: monoFamily,
                  fontSize: 30,
                  lineHeight: 1.6,
                  height: 52,
                  whiteSpace: "pre",
                  color: TERM_COLORS.green,
                  opacity: interpolate(frame, [SUCCESS_START, SUCCESS_START + 6], [0, 1], CLAMP),
                  transform: `translateY(${(1 - successPop) * 12}px)`,
                }}
              >
                {"✓ your brain can talk now"}
                <span style={{ opacity: blinkOn ? 1 : 0 }}>{" ▊"}</span>
              </div>
              <div style={{ height: 22 }} />

              {/* ombre waveform — the voice replying (cyan → blue → violet → pink) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 40,
                  opacity: waveIn,
                }}
              >
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={`wb${i}`}
                    style={{
                      width: 10,
                      height: 21 + 13 * Math.sin(frame * 0.32 + i * 0.85),
                      borderRadius: 4,
                      background: interpolateColors(
                        i / 13,
                        [0, 1 / 3, 2 / 3, 1],
                        ["#22D3EE", "#2563EB", "#8B5CF6", "#EC4899"],
                      ),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
