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
import { WORLD, POLSIA, FONT_SERIF, FONT_MONO, SPRINGS } from "./theme";

loadSerif();
loadMono();

export const DURATION_IN_FRAMES = 340;

// ---------------------------------------------------------------------------
// VO beat: "a button that just says run ads → set a budget → writes copy,
// generates a UGC video with Sora, pushes it live on Meta."
// One vertical world: mono chip button → budget card → 3-stage pipeline
// cascading downward along an editorial hairline spine. Camera travels down,
// then pulls back to reveal the whole one-button machine.
// ---------------------------------------------------------------------------

const CX = 540;

// World geometry (world coords; camera travels through)
const BTN_W = 460;
const BTN_H = 104;
const BTN_TOP = 508; // center y = 560

const BUD_W = 640;
const BUD_H = 250;
const BUD_TOP = 700;

const C1_W = 760;
const C1_H = 380;
const C1_TOP = 1030;

const C2_W = 760;
const C2_H = 560;
const C2_TOP = 1490;

const C3_W = 760;
const C3_H = 300;
const C3_TOP = 2130;

const ease = Easing.inOut(Easing.cubic);

// Camera: HOLD on breathing button (press) → drop to budget (stepper ticks)
// → travel down card 1 (copy types) → card 2 (Sora render) → card 3 (Meta
// live) → pull back to the full stack → end hold (two near-identical keys).
const KEY_T = [0, 44, 60, 108, 126, 166, 184, 234, 252, 286, 308, 339];
const KEY_FY = [560, 562, 802, 804, 1218, 1220, 1762, 1764, 2262, 2264, 1478, 1480];
const KEY_Z = [1.72, 1.68, 1.16, 1.16, 1.1, 1.1, 0.98, 0.98, 1.16, 1.16, 0.72, 0.72];

// Beat frames
const PRESS_BTN = 32;
const BUD_IN = 54;
const PRESS_PLUS_1 = 70;
const PRESS_PLUS_2 = 84;
const RULE_ARM = [92, 108] as const;
const C1_IN = 112;
const C1_DONE = 163;
const C2_IN = 174;
const RENDER = [184, 228] as const;
const C2_DONE = 232;
const C3_IN = 242;
const TOGGLE_F = 258;
const LIVE_ON = 264;
const COUNT_START = 266;
const C3_DONE = 272;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Impulse: 0 → 1 fast → decays. For press dips and value pops.
const impulse = (frame: number, f0: number) => {
  const t = frame - f0;
  if (t < 0) return 0;
  return Math.exp(-t / 6) * Math.min(1, t / 2);
};

const typeSlice = (frame: number, text: string, f0: number, f1: number) =>
  text.slice(
    0,
    Math.round(
      interpolate(frame, [f0, f1], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

// Fixed-width serif digits — stable width when the budget value ticks.
const SerifDigits: React.FC<{ text: string; fontSize: number }> = ({
  text,
  fontSize,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "baseline",
      fontFamily: FONT_SERIF,
      fontSize,
      lineHeight: 1,
      color: POLSIA.ink,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {text.split("").map((ch, i) => {
      const isDigit = ch >= "0" && ch <= "9";
      const w = isDigit ? 0.56 : ch === "$" ? 0.52 : 0.3;
      return (
        <span
          key={i}
          style={{ display: "inline-block", width: `${w}em`, textAlign: "center" }}
        >
          {ch}
        </span>
      );
    })}
  </span>
);

// The papp-02 mono chip: dark vertical gradient, hairline black edge, top
// inner highlight, uppercase letterspaced mono.
const chipStyle = (fontSize: number): React.CSSProperties => ({
  background: POLSIA.btnBg,
  border: "1px solid #000",
  borderRadius: 6,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 6px rgba(0,0,0,0.28)",
  color: POLSIA.btnText,
  fontFamily: FONT_MONO,
  fontSize,
  letterSpacing: "0.28em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// Working spinner → black ✓ dot, crossfading at doneFrame.
const StatusGlyph: React.FC<{ frame: number; fps: number; doneFrame: number }> = ({
  frame,
  fps,
  doneFrame,
}) => {
  const done = frame >= doneFrame;
  const pop = spring({
    frame: frame - doneFrame,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 18,
  });
  return (
    <div style={{ position: "relative", width: 40, height: 40 }}>
      {!done && (
        <svg
          width={40}
          height={40}
          viewBox="0 0 40 40"
          style={{ transform: `rotate(${frame * 9}deg)` }}
        >
          <circle
            cx={20}
            cy={20}
            r={14}
            fill="none"
            stroke="#B7B3AA"
            strokeWidth={3}
            strokeDasharray="20 9"
            strokeLinecap="round"
          />
        </svg>
      )}
      {done && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${0.6 + 0.4 * pop})`,
            opacity: pop,
          }}
        >
          <svg width={40} height={40} viewBox="0 0 40 40">
            <circle cx={20} cy={20} r={17} fill={POLSIA.ink} />
            <path
              d="M12.5 20.5 L17.5 25.5 L27.5 14.5"
              stroke="#FFFFFF"
              strokeWidth={3.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Expanding press ripple (world coords, centered on press point).
const Ripple: React.FC<{ frame: number; f0: number; x: number; y: number }> = ({
  frame,
  f0,
  x,
  y,
}) => {
  const t = frame - f0;
  if (t < 0 || t > 18) return null;
  const r = interpolate(t, [0, 18], [10, 72], { easing: Easing.out(Easing.cubic) });
  const o = interpolate(t, [0, 18], [0.55, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `2.5px solid ${POLSIA.ink}`,
        opacity: o,
      }}
    />
  );
};

// Classic black cursor arrow with white outline.
const CursorArrow: React.FC<{ scale: number }> = ({ scale }) => (
  <svg
    width={30 * scale}
    height={42 * scale}
    viewBox="0 0 15 21"
    style={{ display: "block" }}
  >
    <path
      d="M1 1 L1 16.2 L5.1 12.6 L7.6 18.6 L10.1 17.5 L7.6 11.7 L13 11.7 Z"
      fill="#111111"
      stroke="#FFFFFF"
      strokeWidth={1.1}
      strokeLinejoin="round"
    />
  </svg>
);

// Thin-line document icon.
const DocIcon: React.FC = () => (
  <svg width={30} height={38} viewBox="0 0 30 38">
    <path
      d="M2 2 H20 L28 10 V36 H2 Z M20 2 V10 H28"
      fill="#FFFFFF"
      stroke={POLSIA.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path
      d="M7 17 H23 M7 23 H23 M7 29 H17"
      stroke="#8A867E"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

// Thin-line eye icon (impressions).
const EyeIcon: React.FC = () => (
  <svg width={40} height={26} viewBox="0 0 40 26">
    <path
      d="M2 13 C9 3.5, 31 3.5, 38 13 C31 22.5, 9 22.5, 2 13 Z"
      fill="none"
      stroke={POLSIA.ink}
      strokeWidth={2.2}
    />
    <circle cx={20} cy={13} r={5.4} fill={POLSIA.ink} />
  </svg>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const PoP5RunAds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera
  const fx = CX + 2.5 * Math.sin(frame * 0.045);
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });

  // ---- Button state ----
  const breath = 1 + 0.012 * Math.sin(frame / 8.5);
  const btnScale = breath - 0.07 * impulse(frame, PRESS_BTN);

  // ---- Cursor path (world coords; tip = element position) ----
  const curX = interpolate(
    frame,
    [8, 28, 50, 66, 92, 104],
    [960, 600, 618, 781, 781, 905],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const curY = interpolate(
    frame,
    [8, 28, 50, 66, 92, 104],
    [830, 578, 596, 842, 842, 960],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const curScale =
    1 -
    0.16 *
      (impulse(frame, PRESS_BTN) +
        impulse(frame, PRESS_PLUS_1) +
        impulse(frame, PRESS_PLUS_2));
  const curOpacity = interpolate(frame, [8, 14, 96, 106], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Budget card ----
  const budS = spring({
    frame: frame - BUD_IN,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 26,
  });
  const budRotX = (1 - budS) * -58;
  const budgetValue = frame < PRESS_PLUS_1 ? 10 : frame < PRESS_PLUS_2 ? 15 : 20;
  const budgetPop =
    1 + 0.14 * (impulse(frame, PRESS_PLUS_1) + impulse(frame, PRESS_PLUS_2));
  const plusDip =
    1 - 0.1 * (impulse(frame, PRESS_PLUS_1) + impulse(frame, PRESS_PLUS_2));
  const ruleW = interpolate(frame, [RULE_ARM[0], RULE_ARM[1]], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Pipeline spine (draws down as the machine runs) ----
  const spineH = interpolate(
    frame,
    [50, 56, 100, 116, 165, 178, 232, 246],
    [0, 88, 130, 418, 560, 878, 1000, 1518],
    { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ---- Card entrances ----
  const cardIn = (f0: number) =>
    spring({ frame: frame - f0, fps, config: SPRINGS.snappy, durationInFrames: 22 });
  const c1S = cardIn(C1_IN);
  const c2S = cardIn(C2_IN);
  const c3S = cardIn(C3_IN);

  // ---- Card 1: copy typing ----
  const line1 = typeSlice(frame, "Meet Hostwarden.", 128, 141);
  const line2 = typeSlice(frame, "Your 11pm manager.", 143, 153);
  const line3 = typeSlice(frame, "Book more nights.", 154, 162);
  const typingLine =
    frame < 143 ? 1 : frame < 154 ? 2 : frame < C1_DONE ? 3 : 0;
  const caretOn = Math.floor(frame / 4) % 2 === 0;
  const caret = (line: number) =>
    typingLine === line && caretOn ? (
      <span
        style={{
          display: "inline-block",
          width: line === 1 ? 5 : 4,
          height: line === 1 ? 40 : 26,
          background: POLSIA.ink,
          marginLeft: 4,
          transform: "translateY(3px)",
        }}
      />
    ) : null;

  // ---- Card 2: Sora render ----
  const pct = Math.round(
    interpolate(frame, [RENDER[0], RENDER[1]], [0, 100], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const shimmerY = ((frame * 16) % 640) - 120;
  const shimmerOpacity = pct >= 100 ? 0 : 0.9;
  const buildIn = (threshold: number) =>
    pct >= threshold
      ? spring({
          frame:
            frame -
            (RENDER[0] +
              Math.ceil(
                // approximate the frame the eased pct crossed the threshold
                (RENDER[1] - RENDER[0]) * (1 - Math.sqrt(1 - threshold / 100))
              )),
          fps,
          config: SPRINGS.snappy,
          durationInFrames: 18,
        })
      : 0;
  const prodIn = buildIn(28);
  const textIn = buildIn(55);
  const playIn = buildIn(82);

  // ---- Card 3: Meta live ----
  const toggleS = spring({
    frame: frame - TOGGLE_F,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 16,
  });
  const liveS = spring({
    frame: frame - LIVE_ON,
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 20,
  });
  const livePulse = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(frame * 0.32));
  const impressions = Math.floor(
    interpolate(frame, [COUNT_START, 300, 339], [0, 662, 1421], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const impText = impressions.toLocaleString("en-US");

  const cardBase: React.CSSProperties = {
    position: "absolute",
    background: POLSIA.paper,
    border: `1.5px solid ${POLSIA.ink}`,
    borderRadius: 10,
    boxShadow: WORLD.shadowSoft,
  };

  const monoLabel: React.CSSProperties = {
    fontFamily: FONT_MONO,
    fontSize: 24,
    letterSpacing: "0.22em",
    color: POLSIA.grayText,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ------- Pipeline spine (behind cards) ------- */}
        <div
          style={{
            position: "absolute",
            left: CX - 1.25,
            top: BTN_TOP + BTN_H,
            width: 2.5,
            height: spineH,
            background: "rgba(17,17,17,0.35)",
          }}
        />

        {/* ------- THE BUTTON ------- */}
        <div
          style={{
            ...chipStyle(42),
            position: "absolute",
            left: CX - BTN_W / 2,
            top: BTN_TOP,
            width: BTN_W,
            height: BTN_H,
            transform: `scale(${btnScale})`,
            paddingLeft: "0.28em", // recenters letterspaced text
          }}
        >
          RUN ADS
        </div>

        {/* ------- BUDGET CARD (flips up) ------- */}
        <div
          style={{
            position: "absolute",
            left: CX - BUD_W / 2,
            top: BUD_TOP,
            width: BUD_W,
            height: BUD_H,
            perspective: 1200,
            opacity: Math.min(1, budS * 1.6),
          }}
        >
          <div
            style={{
              ...cardBase,
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `rotateX(${budRotX}deg)`,
              transformOrigin: "top center",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: 36, top: 34, ...monoLabel }}>
              DAILY BUDGET
            </div>
            <div
              style={{
                position: "absolute",
                left: 36,
                top: 92,
                transform: `scale(${budgetPop})`,
                transformOrigin: "left center",
              }}
            >
              <SerifDigits text={`$${budgetValue}`} fontSize={96} />
            </div>
            {/* Stepper − / + */}
            {[
              { sym: "−", x: BUD_W - 217 },
              { sym: "+", x: BUD_W - 131 },
            ].map((s) => (
              <div
                key={s.sym}
                style={{
                  position: "absolute",
                  left: s.x,
                  top: 106,
                  width: 72,
                  height: 72,
                  border: `1.5px solid ${POLSIA.ink}`,
                  borderRadius: 6,
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_MONO,
                  fontSize: 40,
                  color: POLSIA.ink,
                  transform: `scale(${s.sym === "+" ? plusDip : 1})`,
                }}
              >
                {s.sym}
              </div>
            ))}
            {/* Arming rule */}
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 28,
                width: (BUD_W - 72) * ruleW,
                height: 3,
                background: POLSIA.ink,
              }}
            />
          </div>
        </div>

        {/* ------- CARD 1 — COPY DOC ------- */}
        <div
          style={{
            ...cardBase,
            left: CX - C1_W / 2,
            top: C1_TOP,
            width: C1_W,
            height: C1_H,
            opacity: Math.min(1, c1S * 1.5),
            transform: `translateY(${(1 - c1S) * 28}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 36,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <DocIcon />
            <div
              style={{
                border: `1.5px solid ${POLSIA.ink}`,
                borderRadius: 3,
                padding: "8px 14px",
                fontFamily: FONT_MONO,
                fontSize: 22,
                letterSpacing: "0.12em",
                color: POLSIA.ink,
                background: "#FFFFFF",
              }}
            >
              META_ADS
            </div>
          </div>
          <div style={{ position: "absolute", right: 34, top: 32 }}>
            <StatusGlyph frame={frame} fps={fps} doneFrame={C1_DONE} />
          </div>
          {/* Typed ad copy — the artifact's content */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 112,
              fontFamily: FONT_SERIF,
              fontSize: 44,
              color: POLSIA.ink,
              whiteSpace: "pre",
            }}
          >
            {line1}
            {caret(1)}
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 186,
              fontFamily: FONT_MONO,
              fontSize: 27,
              color: POLSIA.grayText,
              whiteSpace: "pre",
            }}
          >
            {line2}
            {caret(2)}
          </div>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 232,
              fontFamily: FONT_MONO,
              fontSize: 27,
              color: POLSIA.grayText,
              whiteSpace: "pre",
            }}
          >
            {line3}
            {caret(3)}
          </div>
          {/* Skeleton body bars */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 300,
              width: 440,
              height: 12,
              background: "#E8E6E1",
              borderRadius: 6,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 326,
              width: 310,
              height: 12,
              background: "#E8E6E1",
              borderRadius: 6,
            }}
          />
        </div>

        {/* ------- CARD 2 — UGC VIDEO (Sora render) ------- */}
        <div
          style={{
            ...cardBase,
            left: CX - C2_W / 2,
            top: C2_TOP,
            width: C2_W,
            height: C2_H,
            opacity: Math.min(1, c2S * 1.5),
            transform: `translateY(${(1 - c2S) * 28}px)`,
          }}
        >
          <div style={{ position: "absolute", right: 34, top: 32 }}>
            <StatusGlyph frame={frame} fps={fps} doneFrame={C2_DONE} />
          </div>
          {/* Phone frame — 9:16 mini */}
          <div
            style={{
              position: "absolute",
              left: 42,
              top: 58,
              width: 250,
              height: 444,
              border: `10px solid ${POLSIA.ink}`,
              borderRadius: 34,
              background: "#FAFAFA",
              overflow: "hidden",
            }}
          >
            {/* Stylized ad frame building in */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 38,
                width: 170,
                height: 130,
                background: "#E8E6E1",
                borderRadius: 12,
                opacity: prodIn,
                transform: `translateY(${(1 - prodIn) * 16}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: 14,
                  width: 44,
                  height: 44,
                  background: "#B7B3AA",
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 16,
                  width: 118,
                  height: 10,
                  background: "#B7B3AA",
                  borderRadius: 5,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 198,
                width: 154,
                height: 17,
                background: POLSIA.ink,
                borderRadius: 4,
                opacity: textIn,
                transform: `translateY(${(1 - textIn) * 12}px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 226,
                width: 108,
                height: 17,
                background: POLSIA.ink,
                borderRadius: 4,
                opacity: textIn,
                transform: `translateY(${(1 - textIn) * 12}px)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 115 - 36,
                top: 296,
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: POLSIA.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: playIn,
                transform: `scale(${0.5 + 0.5 * playIn})`,
              }}
            >
              <svg width={26} height={30} viewBox="0 0 26 30">
                <path d="M2 2 L24 15 L2 28 Z" fill="#FFFFFF" />
              </svg>
            </div>
            {/* Render shimmer sweep — soft trail + scan line */}
            <div
              style={{
                position: "absolute",
                left: -40,
                top: shimmerY,
                width: 320,
                height: 130,
                background:
                  "linear-gradient(180deg, rgba(17,17,17,0) 0%, rgba(17,17,17,0.06) 78%, rgba(17,17,17,0.16) 99%, rgba(17,17,17,0) 100%)",
                transform: "rotate(-8deg)",
                opacity: shimmerOpacity,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -40,
                top: shimmerY + 126,
                width: 320,
                height: 2,
                background: POLSIA.ink,
                transform: "rotate(-8deg)",
                opacity: shimmerOpacity * 0.4,
              }}
            />
          </div>
          {/* Render percentage — ticking */}
          <div
            style={{
              position: "absolute",
              left: 340,
              top: 120,
              fontFamily: FONT_MONO,
              fontSize: 76,
              color: POLSIA.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              position: "absolute",
              left: 344,
              top: 224,
              width: 336,
              height: 3,
              background: "#E8E6E1",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 344,
              top: 224,
              width: 336 * (pct / 100),
              height: 3,
              background: POLSIA.ink,
            }}
          />
          {/* OpenAI wordmark + Sora product label */}
          <div
            style={{
              position: "absolute",
              right: 40,
              bottom: 40,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Img
              src={staticFile("polsia/openai-logo.svg")}
              style={{ height: 30, width: 30 * (269.6592 / 72.5157) }}
            />
            <div
              style={{
                width: 1.5,
                height: 30,
                background: "#B7B3AA",
              }}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 26,
                letterSpacing: "0.1em",
                color: POLSIA.grayText,
              }}
            >
              Sora
            </div>
          </div>
        </div>

        {/* ------- CARD 3 — LIVE ON META ------- */}
        <div
          style={{
            ...cardBase,
            left: CX - C3_W / 2,
            top: C3_TOP,
            width: C3_W,
            height: C3_H,
            opacity: Math.min(1, c3S * 1.5),
            transform: `translateY(${(1 - c3S) * 28}px)`,
          }}
        >
          <Img
            src={staticFile("polsia/meta-logo.svg")}
            style={{
              position: "absolute",
              left: 40,
              top: 44,
              height: 46,
              width: 46 * (948 / 191),
            }}
          />
          <div style={{ position: "absolute", right: 34, top: 32 }}>
            <StatusGlyph frame={frame} fps={fps} doneFrame={C3_DONE} />
          </div>
          {/* Editorial hairline */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 132,
              width: C3_W - 80,
              height: 1.5,
              background: POLSIA.ink,
            }}
          />
          {/* Toggle */}
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 176,
              width: 88,
              height: 46,
              borderRadius: 23,
              border: `1.5px solid ${POLSIA.ink}`,
              background: toggleS > 0.5 ? POLSIA.ink : "#E8E6E1",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 4,
                left: 4 + toggleS * 42,
                width: 35,
                height: 35,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </div>
          {/* ● LIVE */}
          <div
            style={{
              position: "absolute",
              left: 152,
              top: 182,
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: liveS,
              transform: `scale(${0.7 + 0.3 * liveS})`,
              transformOrigin: "left center",
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background: POLSIA.orange,
                opacity: livePulse,
                transform: `scale(${0.92 + 0.16 * livePulse})`,
              }}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 30,
                letterSpacing: "0.18em",
                color: POLSIA.ink,
              }}
            >
              LIVE
            </div>
          </div>
          {/* Impressions counter (eye + mono tabular) */}
          <div
            style={{
              position: "absolute",
              right: 40,
              top: 180,
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: interpolate(frame, [COUNT_START, COUNT_START + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <EyeIcon />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 42,
                color: POLSIA.ink,
                fontVariantNumeric: "tabular-nums",
                minWidth: 130,
                textAlign: "right",
              }}
            >
              {impText}
            </div>
          </div>
        </div>

        {/* ------- Press ripples ------- */}
        <Ripple frame={frame} f0={PRESS_BTN} x={604} y={582} />
        <Ripple frame={frame} f0={PRESS_PLUS_1} x={785} y={846} />
        <Ripple frame={frame} f0={PRESS_PLUS_2} x={785} y={846} />

        {/* ------- Cursor ------- */}
        <div
          style={{
            position: "absolute",
            left: curX,
            top: curY,
            opacity: curOpacity,
            transform: `scale(${curScale})`,
            transformOrigin: "top left",
          }}
        >
          <CursorArrow scale={1.15} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
