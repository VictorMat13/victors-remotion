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

const COLORS = {
  orange: "#ff4f01",
  ink: "#201515",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  chipText: "#3f3833",
  iconBg: "#f4f1ed",
  iconStroke: "#6f655e",
};

const CORE = { x: 720, y: 712 };

type IconType = "cc" | "film" | "cal" | "cut" | "img";

type Chip = {
  key: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  icon: IconType;
  start: number; // frame absorption begins
};

// resting positions = approved v3 still (15% safe zone + 2% nudge)
const CHIPS: Chip[] = [
  {
    key: "captions",
    label: "Captions",
    sub: "auto subtitles",
    x: 720,
    y: 524,
    icon: "cc",
    start: 60,
  },
  {
    key: "broll",
    label: "B-roll",
    sub: "stock + AI clips",
    x: 986,
    y: 622,
    icon: "film",
    start: 68,
  },
  {
    key: "sched",
    label: "Scheduling",
    sub: "post + repurpose",
    x: 454,
    y: 622,
    icon: "cal",
    start: 76,
  },
  {
    key: "editing",
    label: "Editing",
    sub: "cuts & timing",
    x: 900,
    y: 828,
    icon: "cut",
    start: 84,
  },
  {
    key: "thumbs",
    label: "Thumbnails",
    sub: "covers",
    x: 540,
    y: 828,
    icon: "img",
    start: 92,
  },
];

const ABSORB_DUR = 20; // frames per chip to reach the core
const FLARE_AT = 114;

// short decaying bump used for core pulses on each impact
const pulse = (t: number) => {
  if (t < 0 || t > 12) return 0;
  return 0.16 * Math.sin((Math.PI * t) / 12) * Math.exp(-t / 7);
};

const ChipIcon: React.FC<{ type: IconType }> = ({ type }) => {
  const s = COLORS.iconStroke;
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: s,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "cc":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M10 10.5c-1.2-1.1-3.2-.6-3.2 1.5s2 2.6 3.2 1.5" />
          <path d="M17 10.5c-1.2-1.1-3.2-.6-3.2 1.5s2 2.6 3.2 1.5" />
        </svg>
      );
    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5" />
        </svg>
      );
    case "cal":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
          <circle cx="8.5" cy="14" r="0.9" fill={s} stroke="none" />
          <circle cx="12" cy="14" r="0.9" fill={s} stroke="none" />
          <circle cx="15.5" cy="14" r="0.9" fill={s} stroke="none" />
        </svg>
      );
    case "cut":
      return (
        <svg {...common}>
          <circle cx="6.5" cy="7" r="2.4" />
          <circle cx="6.5" cy="17" r="2.4" />
          <path d="M8.6 8.4 20 17M8.6 15.6 20 7" />
        </svg>
      );
    case "img":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M5 18l4.5-4.5L13 17l3-3 3 3" />
        </svg>
      );
    default:
      return null;
  }
};

const Background: React.FC<{ glow: number }> = ({ glow }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(1200px 780px at 50% 70%, rgba(255,79,1,${(
            0.05 +
            glow * 0.18
          ).toFixed(3)}), rgba(255,79,1,0) 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          WebkitMaskImage:
            "radial-gradient(900px 720px at 50% 56%, #000 35%, transparent 80%)",
          maskImage:
            "radial-gradient(900px 720px at 50% 56%, #000 35%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  rot: number;
  clip: string;
}> = ({ children, progress, rot, clip }) => (
  <span
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      zIndex: 1,
      display: "inline-block",
    }}
  >
    <span
      style={{
        position: "absolute",
        left: -8,
        right: -8,
        top: "14%",
        bottom: "6%",
        background: COLORS.orange,
        opacity: 0.26,
        zIndex: -1,
        transform: `rotate(${rot}deg) scaleX(${progress})`,
        transformOrigin: "left center",
        clipPath: clip,
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

export const SubmagicAbsorption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- intro blur / fade for the whole composition ---
  const introBlur = interpolate(frame, [0, 22], [9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- kicker ---
  const kicker = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // --- headline lines ---
  const line1 = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const line2 = spring({
    frame: frame - 16,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  // --- highlighter draws ---
  const m1 = interpolate(frame, [30, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const m2 = interpolate(frame, [46, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- core entrance + pulses + flare ---
  const coreIn = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  let pulseSum = 0;
  for (const c of CHIPS) pulseSum += pulse(frame - (c.start + ABSORB_DUR));
  const flare = spring({
    frame: frame - FLARE_AT,
    fps,
    config: { damping: 11, stiffness: 130 },
  });
  const flareBump = interpolate(
    frame,
    [FLARE_AT, FLARE_AT + 8, FLARE_AT + 22],
    [0, 0.22, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const coreScale = (0.55 + 0.45 * coreIn) * (1 + pulseSum + flareBump);

  // absorption progress 0..1 across all chips, drives glow
  const absorbAll = interpolate(frame, [CHIPS[0].start, FLARE_AT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = Math.min(1, absorbAll + flareBump * 1.5);

  // streak opacity: fade in during absorption, out after flare
  const streakOp =
    interpolate(frame, [54, 66], [0, 0.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [FLARE_AT - 4, FLARE_AT + 8], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // flare ring expansion
  const ringScale = interpolate(flare, [0, 1], [0.5, 2.4]);
  const ringOp = interpolate(
    frame,
    [FLARE_AT, FLARE_AT + 6, FLARE_AT + 30],
    [0, 0.55, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // --- payoff line ---
  const pay = spring({
    frame: frame - 118,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background glow={glow} />

      <AbsoluteFill
        style={{ opacity: introOpacity, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 256,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orange,
              padding: "8px 15px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 18}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            The new content stack
          </div>

          <h1
            style={{
              margin: "20px 0 0",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: COLORS.ink,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - line1) * 22}px)`,
                opacity: line1,
              }}
            >
              Submagic just{" "}
              <Hl
                progress={m1}
                rot={-1.1}
                clip="polygon(0 10%,100% 0,99.5% 88%,1% 100%)"
              >
                replaced
              </Hl>
            </span>
            <br />
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - line2) * 22}px)`,
                opacity: line2,
              }}
            >
              your{" "}
              <Hl
                progress={m2}
                rot={0.8}
                clip="polygon(0 4%,100% 12%,99% 100%,1% 92%)"
              >
                entire content stack
              </Hl>
              .
            </span>
          </h1>
        </div>

        {/* ---------- STREAKS ---------- */}
        <svg
          width={1440}
          height={1080}
          viewBox="0 0 1440 1080"
          style={{ position: "absolute", inset: 0, opacity: streakOp }}
        >
          <defs>
            <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ff4f01" stopOpacity="0" />
              <stop offset="1" stopColor="#ff4f01" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <g
            stroke="url(#fade)"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          >
            <line x1="720" y1="570" x2="720" y2="622" />
            <line x1="930" y1="644" x2="836" y2="676" />
            <line x1="510" y1="644" x2="604" y2="676" />
            <line x1="852" y1="794" x2="772" y2="744" />
            <line x1="588" y1="794" x2="668" y2="744" />
          </g>
        </svg>

        {/* ---------- CHIPS ---------- */}
        {CHIPS.map((c, i) => {
          const enter = spring({
            frame: frame - (24 + i * 4),
            fps,
            config: { damping: 13, stiffness: 150 },
          });
          const a = interpolate(
            frame,
            [c.start, c.start + ABSORB_DUR],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.cubic),
            },
          );
          const x = interpolate(a, [0, 1], [c.x, CORE.x]);
          const y = interpolate(a, [0, 1], [c.y, CORE.y]);
          const enterScale = 0.82 + 0.18 * enter;
          const scale = enterScale * interpolate(a, [0, 1], [1, 0.12]);
          const enterY = (1 - enter) * -22;
          const opacity =
            enter *
            interpolate(a, [0.45, 1], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

          return (
            <div
              key={c.key}
              style={{
                position: "absolute",
                left: x,
                top: y + enterY,
                transform: `translate(-50%,-50%) scale(${scale})`,
                opacity,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#fff",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 18,
                padding: "14px 19px",
                boxShadow: "0 14px 30px rgba(32,21,21,0.10)",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: COLORS.iconBg,
                }}
              >
                <ChipIcon type={c.icon} />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.15,
                }}
              >
                <b
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: COLORS.chipText,
                    letterSpacing: -0.3,
                  }}
                >
                  {c.label}
                </b>
                <span
                  style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}
                >
                  {c.sub}
                </span>
              </div>
            </div>
          );
        })}

        {/* ---------- CORE: Submagic mark ---------- */}
        <div
          style={{
            position: "absolute",
            left: CORE.x,
            top: CORE.y,
            width: 200,
            height: 200,
            transform: `translate(-50%,-50%) scale(${coreScale})`,
          }}
        >
          {/* flare ring */}
          <div
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              border: "3px solid rgba(255,79,1,0.6)",
              transform: `scale(${ringScale})`,
              opacity: ringOp,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -80,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,79,1,${(
                0.22 +
                glow * 0.3
              ).toFixed(3)}), rgba(255,79,1,0) 62%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -58,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.16)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -26,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.30)",
            }}
          />
          <Img
            src={staticFile("submagic-icon.png")}
            style={{
              position: "relative",
              width: 200,
              height: 200,
              borderRadius: 46,
              display: "block",
              boxShadow:
                "0 28px 64px rgba(255,79,1,0.34), 0 8px 22px rgba(32,21,21,0.18)",
            }}
          />
        </div>

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 870,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: -0.5,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 16}px)`,
            opacity: pay,
          }}
        >
          One app. <span style={{ color: COLORS.orange }}>Submagic.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
