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
  chip: "#3f3833",
};

const CX = 720;
const CY = 600;
const R = 240;
const GAP = 22; // deg gap near each node
const ARC_SPAN = 90 - 2 * GAP; // 46deg
const ARC_LEN = (R * (ARC_SPAN * Math.PI)) / 180;

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (a: number): [number, number] => [
  CX + R * Math.cos(rad(a)),
  CY + R * Math.sin(rad(a)),
];

type NodeT = {
  label: string;
  angle: number;
  icon: "make" | "post" | "read" | "run";
};
const NODES: NodeT[] = [
  { label: "Make it", angle: -90, icon: "make" },
  { label: "Post it", angle: 0, icon: "post" },
  { label: "Read it", angle: 90, icon: "read" },
  { label: "Run it back", angle: 180, icon: "run" },
];

// arc i goes from node i to node i+1, clockwise
const ARCS = NODES.map((n, i) => {
  const a0 = n.angle + GAP;
  const a1 = NODES[(i + 1) % 4].angle + (i === 3 ? 360 : 0) - GAP;
  return { a0, a1 };
});

const NODE_APPEAR = [30, 44, 58, 72];
const ARC_START = [38, 52, 66, 80];
const ARC_DUR = 12;
const HUB_APPEAR = 18;
const LOOP_CLOSE = 92;
const PACKET_START = 96;

const NodeIcon: React.FC<{ type: NodeT["icon"] }> = ({ type }) => {
  const p = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "make": // sparkle / wand
      return (
        <svg {...p}>
          <path d="M5 19l8.5-8.5M11 7l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" />
        </svg>
      );
    case "post": // upload
      return (
        <svg {...p}>
          <path d="M12 16V4M12 4l-5 5M12 4l5 5M5 19h14" />
        </svg>
      );
    case "read": // bar chart
      return (
        <svg {...p}>
          <path d="M5 20V11M12 20V5M19 20v-6M3 20h18" />
        </svg>
      );
    case "run": // refresh loop
      return (
        <svg {...p}>
          <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 4v4h-4" />
          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 20v-4h4" />
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
          "radial-gradient(1100px 820px at 50% 58%, rgba(255,79,1,0.07), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        WebkitMaskImage:
          "radial-gradient(900px 760px at 50% 56%, #000 38%, transparent 82%)",
        maskImage:
          "radial-gradient(900px 760px at 50% 56%, #000 38%, transparent 82%)",
      }}
    />
  </AbsoluteFill>
);

export const PipelineLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const headline = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl = interpolate(frame, [24, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const hub = spring({
    frame: frame - HUB_APPEAR,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const hubPulse = interpolate(
    frame,
    [LOOP_CLOSE, LOOP_CLOSE + 7, LOOP_CLOSE + 22],
    [0, 0.16, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const hubGlow = interpolate(
    frame,
    [HUB_APPEAR, 40, LOOP_CLOSE],
    [0, 0.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // packet position after loop closes
  const packetLap = interpolate(frame, [PACKET_START, 168], [0, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const packetAngle = -90 + 360 * packetLap;
  const [pkx, pky] = pt(packetAngle);
  const packetOp = interpolate(
    frame,
    [PACKET_START, PACKET_START + 8],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <AbsoluteFill
        style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            top: 178,
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
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.92 + 0.08 * kicker})`,
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
            Not just an editing tool
          </div>
          <h1
            style={{
              margin: "18px 0 0",
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: -1.4,
              color: COLORS.ink,
              transform: `translateY(${(1 - headline) * 20}px)`,
              opacity: headline,
            }}
          >
            That's the{" "}
            <span
              style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}
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
              whole pipeline
            </span>
            .
          </h1>
        </div>

        {/* wires */}
        <svg
          width={1440}
          height={1080}
          viewBox="0 0 1440 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff4f01" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ff4f01" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {ARCS.map((arc, i) => {
            const prog = interpolate(
              frame,
              [ARC_START[i], ARC_START[i] + ARC_DUR],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              },
            );
            const [sx, sy] = pt(arc.a0);
            const [ex, ey] = pt(arc.a1);
            const d = `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
            const tipA = arc.a0 + (arc.a1 - arc.a0) * prog;
            const [tx, ty] = pt(tipA);
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke="url(#wire)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={ARC_LEN}
                  strokeDashoffset={ARC_LEN * (1 - prog)}
                />
                {prog > 0.02 && (
                  <path
                    d="M -7 -6 L 7 0 L -7 6 Z"
                    fill="#ff7a3c"
                    transform={`translate(${tx} ${ty}) rotate(${tipA + 90})`}
                    opacity={interpolate(prog, [0.02, 0.12], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })}
                  />
                )}
              </g>
            );
          })}
          {/* traveling packet */}
          <circle
            cx={pkx}
            cy={pky}
            r={16}
            fill="#ff4f01"
            opacity={0.18 * packetOp}
          />
          <circle cx={pkx} cy={pky} r={8} fill="#ff4f01" opacity={packetOp} />
        </svg>

        {/* nodes */}
        {NODES.map((n, i) => {
          const s = spring({
            frame: frame - NODE_APPEAR[i],
            fps,
            config: { damping: 13, stiffness: 160 },
          });
          const [nx, ny] = pt(n.angle);
          return (
            <div
              key={n.label}
              style={{
                position: "absolute",
                left: nx,
                top: ny,
                transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * s})`,
                opacity: s,
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#fff",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 18,
                padding: "16px 22px",
                boxShadow: "0 16px 34px rgba(32,21,21,0.10)",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: -12,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: COLORS.ink,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  flex: "none",
                  background: "rgba(255,79,1,0.12)",
                  color: COLORS.orange,
                }}
              >
                <NodeIcon type={n.icon} />
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: COLORS.chip,
                  letterSpacing: -0.4,
                }}
              >
                {n.label}
              </div>
            </div>
          );
        })}

        {/* center hub: Submagic logo + One place */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: CY,
            transform: `translate(-50%,-50%) scale(${(0.5 + 0.5 * hub) * (1 + hubPulse)})`,
            opacity: hub,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ position: "relative", width: 138, height: 138 }}>
            <div
              style={{
                position: "absolute",
                inset: -46,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(255,79,1,${(0.22 + 0.34 * hubGlow).toFixed(3)}), rgba(255,79,1,0) 64%)`,
              }}
            />
            <Img
              src={staticFile("submagic-icon.png")}
              style={{
                position: "relative",
                width: 138,
                height: 138,
                borderRadius: 34,
                display: "block",
                boxShadow:
                  "0 22px 50px rgba(255,79,1,0.40), 0 6px 16px rgba(32,21,21,0.16)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: COLORS.ink,
            }}
          >
            One place
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
