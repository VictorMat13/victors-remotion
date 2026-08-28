import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 186; // 6.2s @ 30fps

// Anthropic-coral-on-white Liam palette (matches FableFiveBack)
const COLORS = {
  coral: "#D97757",
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  green: "#22C55E",
  greenDeep: "#16A34A",
};

const FONT = fontFamily;

// Scene split
const T = {
  toChart: 78, // week strip → bars
};

// ---------------------------------------------------------------------------
// Background — warm paper + soft glow + masked grid
// ---------------------------------------------------------------------------

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 720px at 50% 44%, rgba(217,119,87,0.11), rgba(0,0,0,0) 64%)",
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
          "radial-gradient(1000px 760px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(1000px 760px at 50% 50%, #000 42%, transparent 84%)",
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
// Scene 1 — the week strip, a few sends
// ---------------------------------------------------------------------------

const DAYS = ["M", "T", "W", "T", "F"];
const SEND_DAYS: Record<number, number> = { 0: 22, 2: 36, 4: 50 }; // dayIndex → pop frame

const PlanePop: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const ring = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{ position: "relative", display: "grid", placeItems: "center" }}
    >
      {/* pulse ring */}
      <div
        style={{
          position: "absolute",
          width: 92,
          height: 92,
          borderRadius: 999,
          border: `2.5px solid ${COLORS.coral}`,
          transform: `scale(${0.6 + ring * 0.9})`,
          opacity: (1 - ring) * 0.7,
        }}
      />
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: 999,
          background: "rgba(217,119,87,0.13)",
          border: `2px solid ${COLORS.coral}`,
          display: "grid",
          placeItems: "center",
          transform: `scale(${pop})`,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.coral}
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </svg>
      </div>
    </div>
  );
};

const SceneWeek: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const cap = spring({
    frame: frame - 14,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  // exit
  const out = interpolate(frame, [T.toChart - 12, T.toChart], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 56,
        flexDirection: "column",
        opacity: 1 - out,
        transform: `translateY(${out * -46}px) scale(${1 - out * 0.04})`,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 30,
          background: COLORS.card,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 40,
          boxShadow: "0 26px 60px rgba(25,23,20,0.10)",
          padding: "52px 56px",
          transform: `translateY(${(1 - cardIn) * 30}px) scale(${0.96 + 0.04 * cardIn})`,
          opacity: cardIn,
        }}
      >
        {DAYS.map((d, i) => {
          const cellIn = spring({
            frame: frame - 6 - i * 3,
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const sendAt = SEND_DAYS[i];
          return (
            <div
              key={i}
              style={{
                width: 176,
                height: 224,
                borderRadius: 30,
                border: `1.5px solid ${COLORS.line}`,
                background:
                  sendAt !== undefined ? "rgba(217,119,87,0.045)" : COLORS.card,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 26,
                gap: 22,
                transform: `translateY(${(1 - cellIn) * 20}px)`,
                opacity: cellIn,
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: COLORS.muted,
                }}
              >
                {d}
              </span>
              {sendAt !== undefined && <PlanePop delay={sendAt} />}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: FONT,
          fontSize: 58,
          fontWeight: 700,
          color: COLORS.muted,
          transform: `translateY(${(1 - cap) * 18}px)`,
          opacity: cap,
        }}
      >
        <span style={{ color: COLORS.ink, fontWeight: 800 }}>
          a few of those
        </span>{" "}
        a week
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — bars growing month over month
// ---------------------------------------------------------------------------

const BARS = [
  { label: "MONTH 1", value: 1500, height: 150, delay: 10 },
  { label: "MONTH 2", value: 3500, height: 300, delay: 24 },
  { label: "MONTH 3", value: 7000, height: 440, delay: 38 },
];

const fmt = (n: number) => `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;

const SceneBars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - T.toChart;

  const introOp = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chipIn = spring({
    frame: local - 4,
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const cap = spring({
    frame: local - 46,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const sweep = interpolate(local, [62, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        opacity: introOp,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
        }}
      >
        {/* recurring chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 28px",
            borderRadius: 999,
            background: "rgba(34,197,94,0.12)",
            border: `1.5px solid ${COLORS.green}`,
            transform: `scale(${0.7 + 0.3 * chipIn})`,
            opacity: chipIn,
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.greenDeep}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: 3,
              color: COLORS.greenDeep,
            }}
          >
            RECURRING
          </span>
        </div>

        {/* bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 88,
            height: 520,
          }}
        >
          {BARS.map((b) => {
            const grow = spring({
              frame: local - b.delay,
              fps,
              config: { damping: 15, stiffness: 90 },
            });
            const labelIn = spring({
              frame: local - b.delay - 10,
              fps,
              config: { damping: 14, stiffness: 150 },
            });
            const value = Math.round((b.value * Math.min(grow, 1)) / 100) * 100;
            return (
              <div
                key={b.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 54,
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: COLORS.ink,
                    opacity: labelIn,
                    transform: `translateY(${(1 - labelIn) * 14}px)`,
                  }}
                >
                  {fmt(value)}
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: COLORS.muted,
                    }}
                  >
                    /mo
                  </span>
                </div>
                <div
                  style={{
                    width: 190,
                    height: b.height * grow,
                    borderRadius: "22px 22px 10px 10px",
                    background: `linear-gradient(180deg, ${COLORS.green}, ${COLORS.greenDeep})`,
                    boxShadow: "0 18px 44px rgba(34,197,94,0.28)",
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: COLORS.muted,
                    opacity: labelIn,
                  }}
                >
                  {b.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* baseline */}
        <div
          style={{
            width: 820,
            height: 2,
            background: COLORS.line,
            marginTop: -40,
          }}
        />

        {/* caption */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 54,
            fontWeight: 800,
            color: COLORS.ink,
            transform: `translateY(${(1 - cap) * 18}px)`,
            opacity: cap,
          }}
        >
          brands paying you <Highlight progress={sweep}>every month</Highlight>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const BrandsPayingMonthly: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Background is always fully opaque — frame 0 must never be black */}
      <Background />
      {frame < T.toChart && <SceneWeek />}
      {frame >= T.toChart - 2 && <SceneBars />}
    </AbsoluteFill>
  );
};
