import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 150;

const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  idleBg: "#F4F1ED",
  idleStroke: "#B4ADA6",
  idleText: "#9A938C",
};

type StepIcon = "brief" | "script" | "edit" | "upload" | "schedule";

type Step = { label: string; sub: string; icon: StepIcon };

const STEPS: Step[] = [
  { label: "Brief", sub: "align on the idea", icon: "brief" },
  { label: "Script", sub: "write the words", icon: "script" },
  { label: "Edit", sub: "cut the footage", icon: "edit" },
  { label: "Upload", sub: "post to platforms", icon: "upload" },
  { label: "Schedule", sub: "pick the times", icon: "schedule" },
];

const RAIL_X = 200;
const CARD_L = 262;
const CARD_R = 940;
const stepY = (i: number) => 648 + i * 160; // badge / card center
const B_TOP = stepY(0);
const B_BOT = stepY(STEPS.length - 1);

// packet travel + per-step activation frames
const PKT_START = 42;
const PKT_END = 112;
const ACT = STEPS.map((_, i) =>
  Math.round(interpolate(stepY(i), [B_TOP, B_BOT], [PKT_START, PKT_END])),
);

const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const StepGlyph: React.FC<{ type: StepIcon; color: string }> = ({
  type,
  color,
}) => {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "brief":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
          <path d="M9 3.5v2.2h6V3.5M8.5 10h7M8.5 13.5h7M8.5 17h4" />
        </svg>
      );
    case "script":
      return (
        <svg {...common}>
          <path d="M16.5 4.5l3 3L8 19l-4 1 1-4 11.5-11.5Z" />
          <path d="M14.5 6.5l3 3" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <circle cx="6.5" cy="7" r="2.4" />
          <circle cx="6.5" cy="17" r="2.4" />
          <path d="M8.6 8.4 20 17M8.6 15.6 20 7" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 15V4M12 4 8 8M12 4l4 4" />
          <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
          <circle cx="8.5" cy="14" r="0.9" fill={color} stroke="none" />
          <circle cx="12" cy="14" r="0.9" fill={color} stroke="none" />
          <circle cx="15.5" cy="14" r="0.9" fill={color} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
};

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 1200px at 50% 46%, rgba(255,79,1,0.08), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(760px 1120px at 50% 50%, #000 45%, transparent 85%)",
        maskImage:
          "radial-gradient(760px 1120px at 50% 50%, #000 45%, transparent 85%)",
      }}
    />
  </AbsoluteFill>
);

export const AgencyStepsPipeline: React.FC = () => {
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
  const head1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const head2 = spring({
    frame: frame - 11,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  // packet position down the rail
  const packetY = interpolate(frame, [PKT_START, PKT_END], [B_TOP, B_BOT], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const packetOn = frame >= PKT_START - 3 && frame <= DURATION_IN_FRAMES;

  // climbing meters
  const cost = interpolate(frame, [PKT_START, PKT_END + 4], [0, 8400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const weeks = interpolate(frame, [PKT_START, PKT_END + 4], [0, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const meterIn = spring({
    frame: frame - 34,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background />

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
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orangeDeep,
              padding: "9px 18px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.9 + 0.1 * kicker})`,
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
            The agency way
          </div>
        </div>

        {/* ---------- HEADER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 372,
            left: 60,
            right: 60,
            textAlign: "center",
            fontSize: 62,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - head1) * 18}px)`,
              opacity: head1,
            }}
          >
            Instead of paying
          </div>
          <div
            style={{
              transform: `translateY(${(1 - head2) * 18}px)`,
              opacity: head2,
            }}
          >
            an agency to<span style={{ color: COLORS.orange }}>…</span>
          </div>
        </div>

        {/* ---------- RAIL ---------- */}
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* base rail */}
          <line
            x1={RAIL_X}
            y1={B_TOP}
            x2={RAIL_X}
            y2={B_BOT}
            stroke={COLORS.line}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {/* filled progress */}
          <line
            x1={RAIL_X}
            y1={B_TOP}
            x2={RAIL_X}
            y2={Math.min(Math.max(packetY, B_TOP), B_BOT)}
            stroke={COLORS.orange}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* packet dot */}
          {packetOn && (
            <>
              <circle
                cx={RAIL_X}
                cy={packetY}
                r={16}
                fill={COLORS.orange}
                opacity={0.18}
              />
              <circle cx={RAIL_X} cy={packetY} r={7} fill={COLORS.orange} />
            </>
          )}
        </svg>

        {/* ---------- STEP BADGES + CARDS ---------- */}
        {STEPS.map((s, i) => {
          const y = stepY(i);
          const enter = spring({
            frame: frame - (14 + i * 6),
            fps,
            config: { damping: 14, stiffness: 150 },
          });
          const act = spring({
            frame: frame - ACT[i],
            fps,
            config: { damping: 12, stiffness: 180 },
          });
          const isOn = frame >= ACT[i] - 1;
          const badgeBg = interpolateColor(act, "#ffffff", COLORS.orange);
          const numColor = isOn ? "#ffffff" : COLORS.idleText;
          const iconColor = isOn ? COLORS.orange : COLORS.idleStroke;
          const iconBg = isOn ? "#FFF1EA" : COLORS.idleBg;

          return (
            <React.Fragment key={s.label}>
              {/* number badge on the rail */}
              <div
                style={{
                  position: "absolute",
                  left: RAIL_X,
                  top: y,
                  width: 52,
                  height: 52,
                  transform: `translate(-50%,-50%) scale(${(0.8 + 0.2 * enter) * (1 + 0.12 * act)})`,
                  borderRadius: "50%",
                  background: badgeBg,
                  border: `2px solid ${isOn ? COLORS.orange : COLORS.line}`,
                  boxShadow: isOn
                    ? "0 8px 20px rgba(255,79,1,0.30)"
                    : "0 4px 12px rgba(32,21,21,0.08)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  color: numColor,
                  opacity: enter,
                  zIndex: 2,
                }}
              >
                {i + 1}
              </div>

              {/* content card */}
              <div
                style={{
                  position: "absolute",
                  left: CARD_L,
                  top: y,
                  width: CARD_R - CARD_L,
                  transform: `translateY(-50%) translateX(${(1 - enter) * 26}px)`,
                  opacity: enter,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: COLORS.card,
                  border: `1.5px solid ${isOn ? "rgba(255,79,1,0.5)" : COLORS.line}`,
                  borderRadius: 22,
                  padding: "20px 26px",
                  boxShadow: isOn
                    ? "0 18px 40px rgba(255,79,1,0.16)"
                    : "0 14px 30px rgba(32,21,21,0.07)",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 15,
                    display: "grid",
                    placeItems: "center",
                    background: iconBg,
                  }}
                >
                  <StepGlyph type={s.icon} color={iconColor} />
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
                      fontSize: 34,
                      fontWeight: 800,
                      color: COLORS.ink,
                      letterSpacing: -0.5,
                    }}
                  >
                    {s.label}
                  </b>
                  <span
                    style={{
                      fontSize: 19,
                      color: COLORS.muted,
                      fontWeight: 600,
                    }}
                  >
                    {s.sub}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* ---------- COST / TIME METER ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1470,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${(1 - meterIn) * 18}px)`,
            opacity: meterIn,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 30,
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 999,
              padding: "18px 34px",
              boxShadow: "0 16px 34px rgba(32,21,21,0.10)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                stroke={COLORS.orange}
                strokeWidth={1.9}
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: COLORS.ink,
                  letterSpacing: -0.5,
                }}
              >
                {Math.round(weeks)} weeks
              </span>
            </div>
            <div style={{ width: 2, height: 34, background: COLORS.line }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: COLORS.orange,
                  letterSpacing: -0.5,
                }}
              >
                ${fmt(cost)}
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// tiny hex-lerp for badge fill (white -> orange)
function interpolateColor(t: number, from: string, to: string) {
  const c = Math.min(Math.max(t, 0), 1);
  const f = hex(from);
  const g = hex(to);
  const r = Math.round(f[0] + (g[0] - f[0]) * c);
  const gr = Math.round(f[1] + (g[1] - f[1]) * c);
  const b = Math.round(f[2] + (g[2] - f[2]) * c);
  return `rgb(${r},${gr},${b})`;
}
function hex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}
