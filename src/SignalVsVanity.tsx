import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

const COLORS = {
  orange: "#ff4f01",
  ink: "#201515",
  muted: "#8b8079",
  faint: "#b9b1a9",
  paper: "#fbfbf9",
  line: "#ece8e3",
  chip: "#3f3833",
};

type IconType =
  | "heart"
  | "eye"
  | "play"
  | "activity"
  | "bookmark"
  | "personplus";
type Kind = "keep" | "drop";

type Row = {
  label: string;
  val: string;
  icon: IconType;
  kind: Kind;
};

const ROWS: Row[] = [
  { label: "Likes", val: "12.4k", icon: "heart", kind: "drop" },
  { label: "Watch-through", val: "68%", icon: "activity", kind: "keep" },
  { label: "Impressions", val: "240k", icon: "eye", kind: "drop" },
  { label: "Saves & shares", val: "1,203", icon: "bookmark", kind: "keep" },
  { label: "Raw views", val: "92k", icon: "play", kind: "drop" },
  { label: "Followers gained", val: "+540", icon: "personplus", kind: "keep" },
];

const ENTER_BASE = 28;
const ENTER_STEP = 6;
const FILTER_BASE = 88;
const FILTER_STEP = 8;
const FILTER_DUR = 14;

const MetricIcon: React.FC<{ type: IconType }> = ({ type }) => {
  const p = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "heart":
      return (
        <svg {...p}>
          <path d="M12 20s-7-4.4-9.3-8.3C1.1 8.7 3 5.5 6.2 5.5c2 0 3.3 1.2 4 2.1.7-.9 2-2.1 4-2.1 3.2 0 5.1 3.2 3.5 6.2C19 15.6 12 20 12 20z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...p}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "play":
      return (
        <svg {...p}>
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "activity":
      return (
        <svg {...p}>
          <path d="M3 13h4l3-8 4 16 3-8h4" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...p}>
          <path d="M6 4h12v16l-6-4-6 4z" />
        </svg>
      );
    case "personplus":
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M18 7v6M21 10h-6" />
        </svg>
      );
    default:
      return null;
  }
};

const Check: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ff4f01"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.5l4 4 10-10" />
  </svg>
);
const Cross: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#b9b1a9"
    strokeWidth={2.4}
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(880px 900px at 50% 60%, rgba(255,79,1,0.06), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(740px 980px at 50% 54%, #000 40%, transparent 82%)",
        maskImage:
          "radial-gradient(740px 980px at 50% 54%, #000 40%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

const RowItem: React.FC<{ row: Row; index: number }> = ({ row, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterDelay = ENTER_BASE + index * ENTER_STEP;
  const enter = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const enterY = (1 - enter) * 28;

  const filterDelay = FILTER_BASE + index * FILTER_STEP;
  const f = interpolate(
    frame,
    [filterDelay, filterDelay + FILTER_DUR],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  const end = spring({
    frame: frame - filterDelay,
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  const keep = row.kind === "keep";
  const cardAlpha = keep ? 1 : 1 - f;

  const iconColor = keep
    ? interpolateColors(f, [0, 1], ["#a59d95", "#ff4f01"])
    : "#a59d95";
  const labelColor = keep
    ? COLORS.chip
    : interpolateColors(f, [0, 1], ["#3f3833", "#b9b1a9"]);
  const valueColor = keep
    ? COLORS.ink
    : interpolateColors(f, [0, 1], ["#201515", "#b9b1a9"]);
  const iconBg = keep
    ? `rgba(255,79,1,${(0.04 + 0.08 * f).toFixed(3)})`
    : "#f1ede9";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        height: 104,
        padding: "0 28px",
        borderRadius: 20,
        background: `rgba(255,255,255,${cardAlpha.toFixed(3)})`,
        border: `1px solid rgba(236,232,227,${cardAlpha.toFixed(3)})`,
        boxShadow: `0 14px 30px rgba(32,21,21,${(0.08 * cardAlpha).toFixed(3)})`,
        opacity: enter,
        transform: `translateY(${enterY}px)`,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          flex: "none",
          background: iconBg,
          color: iconColor,
          opacity: keep ? 1 : 1 - 0.45 * f,
        }}
      >
        <MetricIcon type={row.icon} />
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 37,
            fontWeight: 700,
            letterSpacing: -0.4,
            color: labelColor,
          }}
        >
          {keep && (
            <span
              style={{
                position: "absolute",
                left: -7,
                right: -7,
                top: "16%",
                bottom: "10%",
                background: COLORS.orange,
                opacity: 0.24,
                zIndex: -1,
                transform: `scaleX(${f}) rotate(-1deg)`,
                transformOrigin: "left center",
                clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
                borderRadius: 5,
              }}
            />
          )}
          {row.label}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -0.5,
            color: valueColor,
          }}
        >
          {row.val}
        </span>
        {!keep && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 3,
              borderRadius: 2,
              background: COLORS.faint,
              transform: `scaleX(${f})`,
              transformOrigin: "left center",
            }}
          />
        )}
      </div>

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          flex: "none",
          display: "grid",
          placeItems: "center",
          background: keep ? "rgba(255,79,1,0.14)" : "#f1ede9",
          opacity: keep ? end : f,
          transform: keep ? `scale(${0.4 + 0.6 * end})` : "none",
        }}
      >
        {keep ? <Check /> : <Cross />}
      </div>
    </div>
  );
};

export const SignalVsVanity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 18], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const line1 = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const line2 = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl = interpolate(frame, [24, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        <div
          style={{
            position: "absolute",
            left: 162,
            right: 162,
            top: 288,
            bottom: 288,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 30,
          }}
        >
          {/* kicker */}
          <div
            style={{
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 23,
              fontWeight: 700,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: COLORS.orange,
              padding: "9px 18px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.92 + 0.08 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            Signal, not noise
          </div>

          {/* heading */}
          <h1
            style={{
              fontSize: 60,
              lineHeight: 1.18,
              fontWeight: 800,
              letterSpacing: -1.4,
              color: COLORS.ink,
              textAlign: "center",
              margin: 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - line1) * 20}px)`,
                opacity: line1,
              }}
            >
              Only the numbers that
            </span>
            <br />
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - line2) * 20}px)`,
                opacity: line2,
              }}
            >
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -8,
                    right: -8,
                    top: "14%",
                    bottom: "8%",
                    background: COLORS.orange,
                    opacity: 0.26,
                    zIndex: -1,
                    transform: `scaleX(${hl}) rotate(-1deg)`,
                    transformOrigin: "left center",
                    clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
                    borderRadius: 6,
                  }}
                />
                mean something
              </span>
              .
            </span>
          </h1>

          {/* list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ROWS.map((r, i) => (
              <RowItem key={r.label} row={r} index={i} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
