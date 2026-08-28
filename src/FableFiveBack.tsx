import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 390; // 13s @ 30fps

// Anthropic-coral-on-white Liam palette
const COLORS = {
  coral: "#D97757",
  coralDeep: "#C05F3F",
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  cardDark: "#1C1917",
  lineDark: "#33302C",
  textDark: "#F8FAFC",
  red: "#EF4444",
  green: "#22C55E",
};

const FONT = fontFamily;

// Phase boundaries (VO beats)
const T = {
  slam: 135, // "It got forced offline."
  relight: 195, // "It's back today,"
  lock: 225, // "locked down tighter"
  payoff: 285, // "still the most powerful AI..."
};

// ---------------------------------------------------------------------------
// Background — warm paper + coral glow + masked grid; dims during offline
// ---------------------------------------------------------------------------

const Background: React.FC<{
  dark: number;
  glowColor: string;
  glowStrength: number;
}> = ({ dark, glowColor, glowStrength }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(720px 720px at 50% 46%, ${glowColor}, rgba(0,0,0,0) 64%)`,
        opacity: glowStrength,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        WebkitMaskImage:
          "radial-gradient(760px 760px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(760px 760px at 50% 50%, #000 42%, transparent 84%)",
        opacity: 1 - dark * 0.85,
      }}
    />
    {/* Power-down veil — light grey dim only, never black */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#3B3733",
        opacity: dark * 0.14,
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Highlight-sweep word (Liam signature)
// ---------------------------------------------------------------------------

const Highlight: React.FC<{ children: React.ReactNode; progress: number }> = ({
  children,
  progress,
}) => (
  <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: COLORS.coral,
        opacity: 0.3,
        zIndex: -1,
        transform: `scaleX(${progress}) rotate(-1.5deg)`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 7,
      }}
    />
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Status chip — LIVE → OFFLINE → BACK ONLINE
// ---------------------------------------------------------------------------

type ChipState = { label: string; color: string; tint: string };

const CHIP_STATES: Record<"live" | "offline" | "back", ChipState> = {
  live: { label: "LIVE", color: COLORS.coral, tint: "rgba(217,119,87,0.13)" },
  offline: {
    label: "OFFLINE",
    color: COLORS.red,
    tint: "rgba(239,68,68,0.16)",
  },
  back: {
    label: "BACK ONLINE",
    color: COLORS.green,
    tint: "rgba(34,197,94,0.14)",
  },
};

const StatusChip: React.FC<{ state: ChipState; pop: number; dark: number }> = ({
  state,
  pop,
  dark,
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.55 + 0.45 * Math.sin(frame / 7);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 30px",
        borderRadius: 999,
        background: state.tint,
        border: `1.5px solid ${state.color}`,
        transform: `scale(${0.7 + 0.3 * pop})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: state.color,
          boxShadow: `0 0 ${10 + 8 * pulse}px ${state.color}`,
        }}
      />
      <span
        style={{
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 3,
          color: dark > 0.5 ? state.color : state.color,
        }}
      >
        {state.label}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Warning chips — "things it was never supposed to do"
// ---------------------------------------------------------------------------

const WARNINGS: {
  text: string;
  x: number;
  y: number;
  r: number;
  delay: number;
}[] = [
  { text: "guardrail bypassed", x: -252, y: -318, r: -4, delay: 34 },
  { text: "unexpected capability", x: 250, y: -282, r: 3.5, delay: 52 },
  { text: "restricted task done", x: -246, y: 268, r: 3, delay: 70 },
  { text: "policy override", x: 268, y: 276, r: -3.5, delay: 88 },
];

const WarningChip: React.FC<{
  text: string;
  x: number;
  y: number;
  r: number;
  delay: number;
  killAt: number;
}> = ({ text, x, y, r, delay, killAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const exit = interpolate(frame, [killAt - 10, killAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = Math.sin((frame + delay * 7) / 22) * 5;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${x}px, ${y + drift}px) rotate(${r}deg) scale(${0.6 + 0.4 * enter})`,
        opacity: enter * exit,
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 26px",
        borderRadius: 18,
        background: "rgba(239,68,68,0.09)",
        border: "1.5px solid rgba(239,68,68,0.45)",
        boxShadow: "0 14px 34px rgba(25,23,20,0.08)",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke={COLORS.red}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.3 3.9L1.8 18.1a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        <line x1="12" y1="9" x2="12" y2="13.5" />
        <circle cx="12" cy="17.2" r="0.4" fill={COLORS.red} />
      </svg>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 25,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lock badge — "locked down tighter"
// ---------------------------------------------------------------------------

const LockBadge: React.FC<{ pop: number }> = ({ pop }) => (
  <div
    style={{
      position: "absolute",
      top: -30,
      right: -30,
      width: 108,
      height: 108,
      borderRadius: 32,
      background: COLORS.ink,
      display: "grid",
      placeItems: "center",
      boxShadow: "0 18px 44px rgba(25,23,20,0.32)",
      transform: `scale(${pop}) rotate(${(1 - pop) * 20}deg)`,
      opacity: pop > 0.02 ? 1 : 0,
    }}
  >
    <svg
      width="52"
      height="52"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" />
      <circle cx="12" cy="15.5" r="1.3" fill="#FFFFFF" stroke="none" />
    </svg>
  </div>
);

// ---------------------------------------------------------------------------
// Bottom caption — crossfades per phase
// ---------------------------------------------------------------------------

const Caption: React.FC<{
  visible: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
}> = ({ visible, children, size = 44, color = COLORS.muted, weight = 600 }) => (
  <div
    style={{
      position: "absolute",
      left: 90,
      right: 90,
      bottom: 96,
      textAlign: "center",
      fontFamily: FONT,
      fontSize: size,
      lineHeight: 1.32,
      fontWeight: weight,
      color,
      opacity: visible,
      transform: `translateY(${(1 - visible) * 18}px)`,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const FableFiveBack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Global light state ---------------------------------------------------
  const darkIn = interpolate(frame, [T.slam - 4, T.slam + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const darkOut = interpolate(frame, [T.relight, T.relight + 16], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const dark = frame < T.relight ? darkIn : darkOut;

  // Glow: coral while live, dead while offline, green→coral on return
  const glowColor =
    frame < T.slam
      ? "rgba(217,119,87,0.14)"
      : frame < T.payoff
        ? "rgba(34,197,94,0.12)"
        : "rgba(217,119,87,0.14)";
  const glowStrength = 1 - dark;

  // --- Card entrance + slam shake + payoff lift ------------------------------
  const cardIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const shakeT = frame - T.slam;
  const shake =
    shakeT >= 0 && shakeT < 16
      ? Math.sin(shakeT * 2.1) * 9 * (1 - shakeT / 16)
      : 0;
  const lift = spring({
    frame: frame - T.payoff,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const cardY = (1 - cardIn) * 30 - lift * 54;
  const cardScale = 0.96 + 0.04 * cardIn + 0.02 * lift;

  // Card powers down via desaturation only — surface stays light
  const cardBg = COLORS.card;
  const cardLine = COLORS.line;
  const inkNow = dark > 0.5 ? COLORS.muted : COLORS.ink;
  const logoFilter =
    dark > 0.5 ? "grayscale(0.9) brightness(0.92) opacity(0.55)" : "none";

  // --- Status chip state ------------------------------------------------------
  const chipState =
    frame < T.slam
      ? CHIP_STATES.live
      : frame < T.relight
        ? CHIP_STATES.offline
        : CHIP_STATES.back;
  const liveIn = spring({
    frame: frame - 14,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const offlinePop = spring({
    frame: frame - T.slam,
    fps,
    config: { damping: 11, stiffness: 210 },
  });
  const backPop = spring({
    frame: frame - T.relight - 4,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const chipPop =
    frame < T.slam ? liveIn : frame < T.relight ? offlinePop : backPop;

  // --- Lock -------------------------------------------------------------------
  const lockPop = spring({
    frame: frame - T.lock,
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  // --- Captions ----------------------------------------------------------------
  const cap1In = spring({
    frame: frame - 26,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const cap1 = Math.min(
    cap1In,
    interpolate(frame, [T.slam - 10, T.slam - 2], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const cap2In = spring({
    frame: frame - T.slam - 3,
    fps,
    config: { damping: 13, stiffness: 190 },
  });
  const cap2 = Math.min(
    cap2In,
    interpolate(frame, [T.relight - 8, T.relight], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const cap3In = spring({
    frame: frame - T.relight - 10,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const cap3 = Math.min(
    cap3In,
    interpolate(frame, [T.payoff - 10, T.payoff - 2], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const cap4 = spring({
    frame: frame - T.payoff - 4,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const sweep = interpolate(frame, [T.payoff + 16, T.payoff + 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      {/* Background is always fully opaque — frame 0 must never be black */}
      <Background
        dark={dark}
        glowColor={glowColor}
        glowStrength={glowStrength}
      />

      {/* Warning chips (phase 1 only) */}
      {WARNINGS.map((w) => (
        <WarningChip key={w.text} {...w} killAt={T.slam} />
      ))}

      {/* Model card */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: 560,
            background: cardBg,
            border: `1px solid ${cardLine}`,
            borderRadius: 40,
            boxShadow: "0 26px 60px rgba(25,23,20,0.10)",
            padding: "60px 48px 52px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 34,
            transform: `translate(${shake}px, ${cardY}px) scale(${cardScale})`,
            opacity: cardIn,
          }}
        >
          <Img
            src={staticFile("fable5/claude-logo.png")}
            style={{ width: 150, height: 150, filter: logoFilter }}
          />
          <div
            style={{
              fontFamily: FONT,
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: -1.8,
              color: inkNow,
              lineHeight: 1,
            }}
          >
            Fable 5
          </div>
          <StatusChip state={chipState} pop={chipPop} dark={dark} />
          <LockBadge pop={lockPop} />
        </div>
      </AbsoluteFill>

      {/* Captions */}
      <Caption visible={cap1}>
        people made it do things it was{" "}
        <span style={{ color: COLORS.ink, fontWeight: 800 }}>
          never supposed to
        </span>
      </Caption>

      <Caption visible={cap2} size={78} color={COLORS.red} weight={900}>
        FORCED OFFLINE
      </Caption>

      <Caption visible={cap3}>
        back today —{" "}
        <span style={{ color: COLORS.ink, fontWeight: 800 }}>
          locked down tighter
        </span>
      </Caption>

      <Caption visible={cap4} size={50} color={COLORS.ink} weight={800}>
        still the <Highlight progress={sweep}>most powerful AI</Highlight>
        <br />
        you can put your hands on
      </Caption>
    </AbsoluteFill>
  );
};
