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

// Inter + broad script fallbacks so multilingual greeting chips don't tofu
const TEXT_FONT = `${fontFamily}, "PingFang SC", "Hiragino Sans", "Apple SD Gothic Neo", "Geeza Pro", "Kohinoor Devanagari", "Noto Sans", sans-serif`;

export const DURATION_IN_FRAMES = 200;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#181528",
  muted: "#8B8594",
  line: "#ece8e3",
  purple: "#9b90e8",
  purpleDeep: "#6b5fd0",
  purpleInk: "#4b3fb0",
  softBg: "rgba(155,144,232,0.10)",
};

// ---- fish mark (whale = stacked audio bars), tight viewBox, single fill ----
const FISH_BARS = [
  "m277.1 198c4.42 0 8 3.58 8 8v3.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-3.4c0-4.42 3.58-8 8-8z",
  "m310 200.7c4.42 0 8 3.58 8 8v14.7c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-14.7c0-4.42 3.58-8 8-8z",
  "m342.9 196.4c4.42 0 8 3.58 8 8v61.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-61.4c0-4.42 3.58-8 8-8z",
  "m375.9 190c4.42 0 8 3.58 8 8v4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-4c0-4.42 3.58-8 8-8z",
  "m375.9 243.4c4.42 0 8 3.58 8 8v42.3c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-42.3c0-4.42 3.58-8 8-8z",
  "m663.7 183.2c4.42 0 8 3.58 8 8v44.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-44.2c0-4.42 3.58-8 8-8z",
  "m631.9 176.1c4.42 0 8 3.58 8 8v59.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-59.4c0-4.42 3.58-8 8-8z",
  "m599.9 173c4.42 0 8 3.58 8 8v70.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-70.6c0-4.42 3.58-8 8-8z",
  "m567.9 175c4.42 0 8 3.58 8 8v71.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-71.8c0-4.42 3.58-8 8-8z",
  "m536.1 179.9c4.42 0 8 3.58 8 8v91.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-91.1c0-4.42 3.58-8 8-8z",
  "m503.5 188.2c4.42 0 8 3.58 8 8v104.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-104.1c0-4.42 3.58-8 8-8z",
  "m471.6 202.1c4.42 0 8 3.58 8 8v99.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-99.8c0-4.42 3.58-8 8-8z",
  "m439.6 220.4c4.42 0 8 3.58 8 8v86.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-86.2c0-4.42 3.58-8 8-8z",
  "m695.7 202.1c4.42 0 8 3.58 8 8v22c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-22c0-4.42 3.58-8 8-8z",
  "m407.6 233.1c4.42 0 8 3.58 8 8v84.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-84.8c0-4.42 3.58-8 8-8z",
  "m695.7 247.9c4.42 0 8 3.58 8 8v11.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-11.1c0-4.42 3.58-8 8-8z",
  "m663.7 254.6c4.42 0 8 3.58 8 8v31.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-31.4c0-4.42 3.58-8 8-8z",
  "m631.9 262.3c4.42 0 8 3.58 8 8v36.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-36.1c0-4.42 3.58-8 8-8z",
  "m599.9 268.7c4.42 0 8 3.58 8 8v35.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-35.6c0-4.42 3.58-8 8-8z",
  "m567.9 274.4c4.42 0 8 3.58 8 8v30c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-30c0-4.42 3.58-8 8-8z",
  "m536.1 297.3c4.42 0 8 3.58 8 8v5.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-5.4c0-4.42 3.58-8 8-8z",
];

const FishMark: React.FC<{ color: string; style?: React.CSSProperties }> = ({
  color,
  style,
}) => (
  <svg
    viewBox="269.1 173 434.6 160.9"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <g fill={color}>
      {FISH_BARS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </svg>
);

// ---------------------------------------------------------------- icons
type IconProps = { size: number; color: string };
const svgBase = (
  size: number,
  color: string,
): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const FunnelIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg {...svgBase(size, color)}>
    <path d="M3.6 5.5h16.8l-6.6 7.6v5.4l-3.6 1.9v-7.3z" />
  </svg>
);
const CalendarIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg {...svgBase(size, color)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.6h17" />
    <path d="M8 3.2v3.3" />
    <path d="M16 3.2v3.3" />
    <path d="M8.6 14.6l2.2 2.2 4.3-4.3" />
  </svg>
);
const HeadsetIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg {...svgBase(size, color)}>
    <path d="M4.6 14.4v-2.4a7.4 7.4 0 0 1 14.8 0v2.4" />
    <rect x="2.8" y="13.4" width="3.7" height="6.3" rx="1.85" />
    <rect x="17.5" y="13.4" width="3.7" height="6.3" rx="1.85" />
    <path d="M19.35 19.7v.5a2.8 2.8 0 0 1-2.8 2.8H13.2" />
  </svg>
);
const GlobeIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg {...svgBase(size, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c3.4 2.4 3.4 15.6 0 18c-3.4-2.4-3.4-15.6 0-18z" />
    <path d="M4.6 7.6c4.6 2.1 10.2 2.1 14.8 0" />
    <path d="M4.6 16.4c4.6-2.1 10.2-2.1 14.8 0" />
  </svg>
);

// ---------------------------------------------------------------- background
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 1150px at 50% 40%, rgba(155,144,232,0.15), rgba(155,144,232,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(24,21,40,0.030) 1px, transparent 1px), linear-gradient(90deg, rgba(24,21,40,0.030) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(860px 1200px at 50% 46%, #000 46%, transparent 82%)",
        maskImage:
          "radial-gradient(860px 1200px at 50% 46%, #000 46%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- use-case card
const USE_CASES = [
  { Icon: FunnelIcon, lines: ["Lead", "qualification"] },
  { Icon: CalendarIcon, lines: ["Booking"] },
  { Icon: HeadsetIcon, lines: ["Support"] },
];

const UseCard: React.FC<{
  item: (typeof USE_CASES)[number];
  pop: number;
  left: number;
}> = ({ item, pop, left }) => {
  const { Icon, lines } = item;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 470,
        width: 300,
        height: 356,
        borderRadius: 36,
        background: "#ffffff",
        border: `1.5px solid ${COLORS.line}`,
        boxShadow: "0 22px 50px rgba(75,63,176,0.10)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        transform: `translateY(${(1 - pop) * 34}px) scale(${0.9 + 0.1 * pop})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: "50%",
          background: COLORS.softBg,
          border: "1.5px solid rgba(107,95,208,0.24)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon size={62} color={COLORS.purpleDeep} />
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 33,
          lineHeight: 1.12,
          fontWeight: 700,
          letterSpacing: -0.4,
          color: COLORS.ink,
        }}
      >
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- greetings
const GREETINGS = [
  "Hola",
  "Bonjour",
  "你好",
  "こんにちは",
  "مرحبا",
  "नमस्ते",
  "Olá",
  "Привет",
  "Hallo",
  "안녕",
];

export const FishAudioUseCases: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 14], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chip = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const kicker = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 170 },
  });

  // globe + 83 payoff
  const globe = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const numPop = spring({
    frame: frame - 66,
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const langCount = Math.round(
    interpolate(frame, [70, 108], [0, 83], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const langLabel = spring({
    frame: frame - 96,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  // Cards laid out inside a 5% left/right safe margin (never let them reach
  // the frame edge — platform crops clip flush content).
  const SAFE_PAD_X = Math.round(1080 * 0.05); // 54px = 5%
  const CARD_W = 300;
  const CARD_COUNT = 3;
  const innerW = 1080 - SAFE_PAD_X * 2;
  const cardGap = (innerW - CARD_W * CARD_COUNT) / (CARD_COUNT - 1);
  const cardLefts = Array.from(
    { length: CARD_COUNT },
    (_, i) => SAFE_PAD_X + i * (CARD_W + cardGap),
  );

  return (
    <AbsoluteFill style={{ fontFamily: TEXT_FONT }}>
      <Background />

      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- FISH AUDIO CHIP ---------- */}
        <div
          style={{
            position: "absolute",
            top: 168,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 32px 16px 26px",
              borderRadius: 999,
              background: "#ffffff",
              border: `1.5px solid ${COLORS.line}`,
              boxShadow: "0 16px 38px rgba(75,63,176,0.09)",
              transform: `translateY(${(1 - chip) * 14}px) scale(${0.9 + 0.1 * chip})`,
              opacity: chip,
            }}
          >
            <FishMark
              color={COLORS.ink}
              style={{ width: 86, height: "auto", display: "block" }}
            />
            <span
              style={{
                fontSize: 35,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: COLORS.ink,
              }}
            >
              Fish Audio
            </span>
          </div>
        </div>

        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 350,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 11,
              fontSize: 23,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: COLORS.purpleInk,
              padding: "12px 24px",
              border: "1.5px solid rgba(107,95,208,0.28)",
              borderRadius: 999,
              background: "rgba(155,144,232,0.07)",
              transform: `translateY(${(1 - kicker) * 12}px) scale(${0.92 + 0.08 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.purple,
                boxShadow: "0 0 0 5px rgba(155,144,232,0.18)",
              }}
            />
            Use it for
          </div>
        </div>

        {/* ---------- THREE USE-CASE CARDS ---------- */}
        {USE_CASES.map((item, i) => {
          const pop = spring({
            frame: frame - (18 + i * 9),
            fps,
            config: { damping: 16, stiffness: 150 },
          });
          return <UseCard key={i} item={item} pop={pop} left={cardLefts[i]} />;
        })}

        {/* ---------- "ACROSS" DIVIDER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 916,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 22,
            opacity: globe,
          }}
        >
          <div style={{ width: 120, height: 1.5, background: COLORS.line }} />
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: COLORS.muted,
            }}
          >
            across
          </span>
          <div style={{ width: 120, height: 1.5, background: COLORS.line }} />
        </div>

        {/* ---------- 83 LANGUAGES HERO ---------- */}
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: 980,
            left: 0,
            right: 0,
            height: 520,
            background:
              "radial-gradient(460px 380px at 50% 46%, rgba(155,144,232,0.20), rgba(155,144,232,0) 66%)",
            opacity: numPop,
          }}
        />
        {/* globe */}
        <div
          style={{
            position: "absolute",
            top: 1002,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${(1 - globe) * 20}px) scale(${0.7 + 0.3 * globe})`,
            opacity: globe,
          }}
        >
          <GlobeIcon size={150} color={COLORS.purpleDeep} />
        </div>
        {/* big 83 */}
        <div
          style={{
            position: "absolute",
            top: 1150,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 320,
            fontWeight: 800,
            letterSpacing: -8,
            lineHeight: 1,
            color: COLORS.ink,
            transform: `scale(${0.72 + 0.28 * numPop})`,
            opacity: numPop,
          }}
        >
          {langCount}
        </div>
        {/* languages label */}
        <div
          style={{
            position: "absolute",
            top: 1480,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 66,
            fontWeight: 800,
            letterSpacing: -1,
            color: COLORS.purpleInk,
            transform: `translateY(${(1 - langLabel) * 14}px)`,
            opacity: langLabel,
          }}
        >
          languages
        </div>

        {/* ---------- GREETING CHIPS ---------- */}
        <div
          style={{
            position: "absolute",
            top: 1590,
            left: 90,
            right: 90,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {GREETINGS.map((g, i) => {
            const gp = spring({
              frame: frame - (104 + i * 5),
              fps,
              config: { damping: 14, stiffness: 180 },
            });
            return (
              <span
                key={i}
                style={{
                  padding: "13px 24px",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: `1.5px solid ${COLORS.line}`,
                  boxShadow: "0 8px 20px rgba(24,21,40,0.05)",
                  fontSize: 33,
                  fontWeight: 600,
                  color: COLORS.ink,
                  transform: `translateY(${(1 - gp) * 14}px) scale(${0.7 + 0.3 * gp})`,
                  opacity: gp,
                }}
              >
                {g}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
