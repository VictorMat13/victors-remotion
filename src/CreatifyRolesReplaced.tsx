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
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 125;

// Promptible white / paper style — Liam orange accent
const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  iconBg: "#FFF1EA",
  iconStroke: "#C8623A",
  chipText: "#3f3833",
  chipSub: "#8b8079",
};

const CORE = { x: 720, y: 752 };
const ABSORB_DUR = 16;
const FLARE_AT = 100;

type IconType = "person" | "bulb" | "pen" | "layout" | "target";

type Chip = {
  key: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  icon: IconType;
  start: number;
};

// resting positions orbit the Creatify core
const CHIPS: Chip[] = [
  {
    key: "account",
    label: "Account Manager",
    sub: "client & brief",
    x: 720,
    y: 566,
    icon: "person",
    start: 56,
  },
  {
    key: "creative",
    label: "Creative Director",
    sub: "the big idea",
    x: 1006,
    y: 662,
    icon: "bulb",
    start: 62,
  },
  {
    key: "copy",
    label: "Copywriter",
    sub: "the words",
    x: 434,
    y: 662,
    icon: "pen",
    start: 68,
  },
  {
    key: "media",
    label: "Media Buyer",
    sub: "ad spend",
    x: 918,
    y: 872,
    icon: "target",
    start: 74,
  },
  {
    key: "design",
    label: "Designer",
    sub: "the visuals",
    x: 522,
    y: 872,
    icon: "layout",
    start: 80,
  },
];

// short decaying bump for core pulses on each impact
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
    case "person":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5.5 19c0-3.4 2.9-5.4 6.5-5.4s6.5 2 6.5 5.4" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M16.5 4.5l3 3L8 19l-4 1 1-4 11.5-11.5Z" />
          <path d="M14.5 6.5l3 3" />
        </svg>
      );
    case "layout":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M9 9.5v10" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.9" fill={s} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
};

// paper background — orange glow + masked grid
const Background: React.FC<{ glow: number }> = ({ glow }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(1100px 780px at 50% 70%, rgba(255,79,1,${(
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
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        WebkitMaskImage:
          "radial-gradient(920px 760px at 50% 60%, #000 35%, transparent 82%)",
        maskImage:
          "radial-gradient(920px 760px at 50% 60%, #000 35%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  rot: number;
}> = ({ children, progress, rot }) => (
  <span
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      display: "inline-block",
      zIndex: 1,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: COLORS.orange,
        opacity: 0.24,
        zIndex: -1,
        transform: `rotate(${rot}deg) scaleX(${progress})`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

export const CreatifyRolesReplaced: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 12], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const line1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const hl = interpolate(frame, [22, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // core entrance + pulses + flare
  const coreIn = spring({
    frame: frame - 30,
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
  const coreScale = (0.6 + 0.4 * coreIn) * (1 + pulseSum + flareBump);

  const absorbAll = interpolate(frame, [CHIPS[0].start, FLARE_AT], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = Math.min(1, absorbAll + flareBump * 1.5);

  const ringScale = interpolate(flare, [0, 1], [0.5, 2.4]);
  const ringOp = interpolate(
    frame,
    [FLARE_AT, FLARE_AT + 6, FLARE_AT + 30],
    [0, 0.5, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const pay = spring({
    frame: frame - 104,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background glow={glow} />

      <AbsoluteFill
        style={{ opacity: introOpacity, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 300,
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
              color: COLORS.orangeDeep,
              padding: "8px 16px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.9 + 0.1 * kicker})`,
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
            The whole agency, replaced
          </div>
        </div>

        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 356,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 60,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - line1) * 20}px)`,
              opacity: line1,
            }}
          >
            Creatify just{" "}
            <Hl progress={hl} rot={-1.2}>
              killed
            </Hl>{" "}
            ad agencies.
          </div>
        </div>

        {/* ---------- STREAKS (chip → core, during absorption) ---------- */}
        <svg
          width={1440}
          height={1080}
          viewBox="0 0 1440 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ff4f01" stopOpacity="0" />
              <stop offset="1" stopColor="#ff4f01" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {CHIPS.map((c) => {
            const op = interpolate(
              frame,
              [c.start + 2, c.start + 8, c.start + ABSORB_DUR],
              [0, 0.5, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const mx = interpolate(0.5, [0, 1], [c.x, CORE.x]);
            const my = interpolate(0.5, [0, 1], [c.y, CORE.y]);
            return (
              <line
                key={c.key}
                x1={mx}
                y1={my}
                x2={CORE.x}
                y2={CORE.y}
                stroke="url(#streak)"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={op}
              />
            );
          })}
        </svg>

        {/* ---------- ROLE CHIPS ---------- */}
        {CHIPS.map((c, i) => {
          const enter = spring({
            frame: frame - (24 + i * 5),
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
                background: COLORS.card,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 18,
                padding: "13px 18px",
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
                  style={{
                    fontSize: 12,
                    color: COLORS.chipSub,
                    fontWeight: 600,
                  }}
                >
                  {c.sub}
                </span>
              </div>
            </div>
          );
        })}

        {/* ---------- CORE: Creatify logo ---------- */}
        <div
          style={{
            position: "absolute",
            left: CORE.x,
            top: CORE.y,
            width: 176,
            height: 176,
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
              inset: -70,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,79,1,${(0.2 + glow * 0.3).toFixed(3)}), rgba(255,79,1,0) 62%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -52,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.16)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.30)",
            }}
          />
          <Img
            src={staticFile("creatify-logo.png")}
            style={{
              position: "relative",
              width: 176,
              height: 176,
              borderRadius: 40,
              display: "block",
              border: "1px solid #ece8e3",
              boxShadow:
                "0 26px 60px rgba(255,79,1,0.30), 0 8px 20px rgba(32,21,21,0.16)",
            }}
          />
        </div>

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 992,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: -0.4,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 14}px)`,
            opacity: pay,
          }}
        >
          Five roles. One tool.{" "}
          <span style={{ color: COLORS.orange }}>Creatify.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
