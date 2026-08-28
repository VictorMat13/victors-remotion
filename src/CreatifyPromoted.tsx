import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 140;

const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  idleBg: "#F1EEEA",
  idleStroke: "#CBC4BC",
  idleText: "#A79F97",
};

const CX = 720;

// tier track
const NODES = [
  { key: "tool", label: "TOOL", x: 430, lit: 26 },
  { key: "agent", label: "AGENT", x: 720, lit: 40 },
  { key: "operator", label: "OPERATOR", x: 1010, lit: 74 },
];
const RAIL_Y = 404;
const PROMO = 68; // badge burst frame

const Background: React.FC<{ glow: number }> = ({ glow }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(1150px 820px at 50% 58%, rgba(255,79,1,${(0.05 + glow * 0.16).toFixed(3)}), rgba(255,79,1,0) 62%)`,
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
          "radial-gradient(940px 760px at 50% 56%, #000 35%, transparent 82%)",
        maskImage:
          "radial-gradient(940px 760px at 50% 56%, #000 35%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

const Rays: React.FC<{
  cx: number;
  cy: number;
  intensity: number;
  frame: number;
}> = ({ cx, cy, intensity, frame }) => (
  <svg
    width={1440}
    height={1080}
    viewBox="0 0 1440 1080"
    style={{ position: "absolute", inset: 0, opacity: 0.4 * intensity }}
  >
    <defs>
      <radialGradient id="rmaskP" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="rmP">
        <rect x="0" y="0" width="1440" height="1080" fill="url(#rmaskP)" />
      </mask>
    </defs>
    <g mask="url(#rmP)" transform={`rotate(${frame * 0.2} ${cx} ${cy})`}>
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const w = 0.05;
        const R = 620;
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${cx + Math.cos(a - w) * R},${cy + Math.sin(a - w) * R} L${cx + Math.cos(a + w) * R},${cy + Math.sin(a + w) * R} Z`}
            fill={COLORS.orange}
            opacity={i % 2 === 0 ? 0.55 : 0.3}
          />
        );
      })}
    </g>
  </svg>
);

export const CreatifyPromoted: React.FC = () => {
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

  const header = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // rail fill: 430 -> AGENT(720) early, then AGENT -> OPERATOR(1010) on promotion
  const railX = interpolate(frame, [24, 40, 58, 74], [430, 720, 720, 1010], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markerOn = frame >= 22;

  // badge
  const badgeIn = spring({
    frame: frame - PROMO,
    fps,
    config: { damping: 11, stiffness: 140 },
  });
  const burst = interpolate(
    frame,
    [PROMO, PROMO + 6, PROMO + 26],
    [0, 0.55, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const burstScale = interpolate(frame, [PROMO, PROMO + 26], [0.4, 2.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = interpolate(frame, [40, PROMO + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeFloat =
    frame > PROMO + 14 ? Math.sin((frame - PROMO - 14) / 15) * 2.5 : 0;

  // caption
  const cap1 = spring({
    frame: frame - 34,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const cap2 = spring({
    frame: frame - 76,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const BADGE = { x: CX, y: 636 };

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background glow={glow} />

      <AbsoluteFill
        style={{ opacity: introOpacity, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- HEADER: logo + name ---------- */}
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 22,
            transform: `translateY(${(1 - header) * 16}px)`,
            opacity: header,
          }}
        >
          <Img
            src={staticFile("creatify-logo.png")}
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              border: "1px solid #ece8e3",
              boxShadow: "0 12px 28px rgba(32,21,21,0.12)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <b
              style={{
                fontSize: 46,
                fontWeight: 800,
                color: COLORS.ink,
                letterSpacing: -1,
              }}
            >
              Creatify Agent
            </b>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: COLORS.muted,
                textTransform: "uppercase",
              }}
            >
              autonomous ad engine
            </span>
          </div>
        </div>

        {/* ---------- TIER TRACK ---------- */}
        <svg
          width={1440}
          height={1080}
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={430}
            y1={RAIL_Y}
            x2={1010}
            y2={RAIL_Y}
            stroke={COLORS.line}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <line
            x1={430}
            y1={RAIL_Y}
            x2={railX}
            y2={RAIL_Y}
            stroke={COLORS.orange}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.9}
          />
          {markerOn && (
            <>
              <circle
                cx={railX}
                cy={RAIL_Y}
                r={14}
                fill={COLORS.orange}
                opacity={0.2}
              />
              <circle cx={railX} cy={RAIL_Y} r={6.5} fill={COLORS.orange} />
            </>
          )}
        </svg>

        {NODES.map((n) => {
          const on = frame >= n.lit;
          const pop = spring({
            frame: frame - n.lit,
            fps,
            config: { damping: 12, stiffness: 190 },
          });
          const scale = on ? 1 + 0.14 * pop : 1;
          return (
            <React.Fragment key={n.key}>
              <div
                style={{
                  position: "absolute",
                  left: n.x,
                  top: RAIL_Y,
                  width: 60,
                  height: 60,
                  transform: `translate(-50%,-50%) scale(${scale})`,
                  borderRadius: "50%",
                  background: on ? COLORS.orange : COLORS.card,
                  border: `2.5px solid ${on ? COLORS.orange : COLORS.line}`,
                  boxShadow: on
                    ? "0 8px 22px rgba(255,79,1,0.34)"
                    : "0 4px 12px rgba(32,21,21,0.08)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 2,
                }}
              >
                <svg
                  width={26}
                  height={26}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={on ? "#fff" : COLORS.idleStroke}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {n.key === "operator" ? (
                    <path d="M6 13l4 4 8-9" />
                  ) : (
                    <path
                      d="M12 5l5 6-3 0 0 8-4 0 0-8-3 0z"
                      fill={on ? "#fff" : "none"}
                      stroke="none"
                    />
                  )}
                </svg>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: n.x - 90,
                  top: RAIL_Y + 42,
                  width: 180,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: on ? COLORS.orangeDeep : COLORS.idleText,
                }}
              >
                {n.label}
              </div>
            </React.Fragment>
          );
        })}

        {/* ---------- PROMOTED BADGE ---------- */}
        <Rays cx={BADGE.x} cy={BADGE.y} intensity={glow} frame={frame} />
        {/* burst ring */}
        <div
          style={{
            position: "absolute",
            left: BADGE.x,
            top: BADGE.y,
            width: 200,
            height: 200,
            transform: `translate(-50%,-50%) scale(${burstScale})`,
            borderRadius: "50%",
            border: "3px solid rgba(255,79,1,0.6)",
            opacity: burst,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: BADGE.x,
            top: BADGE.y + badgeFloat,
            width: 190,
            height: 190,
            transform: `translate(-50%,-50%) scale(${0.5 + 0.5 * badgeIn})`,
            opacity: badgeIn,
          }}
        >
          {/* ribbon tails */}
          <svg
            width={190}
            height={190}
            viewBox="0 0 190 190"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <path
              d="M72 150 L58 205 L95 182 L132 205 L118 150 Z"
              fill={COLORS.orangeDeep}
            />
            {/* seal */}
            <circle cx="95" cy="95" r="86" fill="url(#seal)" />
            <defs>
              <linearGradient id="seal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff6a2b" />
                <stop offset="1" stopColor="#f04600" />
              </linearGradient>
            </defs>
            <circle
              cx="95"
              cy="95"
              r="86"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeDasharray="3 7"
            />
            <circle
              cx="95"
              cy="95"
              r="72"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.6"
              strokeWidth="2.5"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <svg
              width={30}
              height={30}
              viewBox="0 0 24 24"
              fill="#fff"
              style={{ marginBottom: 2 }}
            >
              <path d="M12 3l6 8h-4v8h-4v-8H6z" />
            </svg>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              PROMOTED
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#fff",
                opacity: 0.9,
                letterSpacing: 2,
              }}
            >
              RANK +1
            </div>
          </div>
        </div>

        {/* sparkles */}
        {[
          [BADGE.x - 150, BADGE.y - 70],
          [BADGE.x + 150, BADGE.y - 50],
          [BADGE.x + 130, BADGE.y + 90],
          [BADGE.x - 140, BADGE.y + 80],
        ].map(([sx, sy], i) => {
          const tw = Math.max(0, Math.sin((frame - PROMO - i * 4) / 6));
          const s = (frame > PROMO ? tw : 0) * (0.7 + 0.5 * Math.sin(i));
          return (
            <svg
              key={i}
              width={30}
              height={30}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: sx,
                top: sy,
                transform: `translate(-50%,-50%) scale(${s})`,
                opacity: s,
              }}
              fill={COLORS.orange}
            >
              <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z" />
            </svg>
          );
        })}

        {/* ---------- CAPTION ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 830,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 700,
            color: COLORS.muted,
            transform: `translateY(${(1 - cap1) * 12}px)`,
            opacity: cap1,
          }}
        >
          Creatify Agent didn't get{" "}
          <span
            style={{
              textDecoration: "line-through",
              textDecorationColor: "rgba(139,128,121,0.7)",
            }}
          >
            updated
          </span>
          .
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 884,
            textAlign: "center",
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: -1,
            color: COLORS.ink,
            transform: `translateY(${(1 - cap2) * 16}px) scale(${0.96 + 0.04 * cap2})`,
            opacity: cap2,
          }}
        >
          It got <span style={{ color: COLORS.orange }}>promoted.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
