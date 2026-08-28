import React from "react";
import {
  AbsoluteFill,
  Easing,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: mono } = loadMono();

export const DURATION_IN_FRAMES = 216;

const COLORS = {
  bg: "#FFFFFF",
  border: "#E7E9EF",
  ink: "#14161C",
  body: "#4A5160",
  muted: "#9AA1AE",
  blue: "#2563EB",
  chipBg: "#EEF3FE",
  chipBorder: "#BFDBFE",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  green: "#16A34A",
  replitOrange: "#F26207",
};

// ---------- geometry (12% safe padding top/left/right) ----------
const W = 1440;
const SAFE_X = Math.round(W * 0.12); // 173
const SAFE_TOP = Math.round(1080 * 0.12); // 130

const PANEL_W = 880;
const PANEL_X = Math.max(SAFE_X, (W - PANEL_W) / 2);
const PANEL_Y = 572;

const VIDEO_DROP_W = 760;
const VIDEO_DOCK_W = 600;
const VIDEO_DROP_Y = 240;
const VIDEO_DOCK_Y = Math.max(SAFE_TOP + 68, 198); // 198 >= safe top

const TYPED = '"make it dark, cinematic, modern, premium..."';

// ---------- timeline ----------
const TYPE_START = 8;
const TYPE_END = 52;
const STRIKE_START = 56;
const STRIKE_END = 66;
const CHIP_VAGUE = 62;
const DESCRIBE_EXIT = 78;
const VIDEO_IN = 84;
const DOCK_START = 116;
const DOCK_END = 136;
const PANEL_IN = 112;
const CHIP_REF = 140;
const STATUS = [152, 166, 180];

const REF_VIDEO_FRAMES = 121; // 4.04s @ 30fps

const ReplitMark: React.FC<{ height: number }> = ({ height }) => (
  <svg viewBox="0 0 24 36" style={{ height, display: "block" }}>
    <g fill={COLORS.replitOrange}>
      <rect x={0} y={0} width={11} height={11} rx={2.5} />
      <rect x={12.5} y={12.5} width={11} height={11} rx={2.5} />
      <rect x={0} y={25} width={11} height={11} rx={2.5} />
    </g>
  </svg>
);

// ---------- beat 1: the vague prompt ----------
const DescribeCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  const enterOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chars = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, TYPED.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = TYPED.slice(0, chars);
  const typing = frame >= TYPE_START && frame < STRIKE_START;
  const caretVisible = typing && frame % 16 < 9;

  const strike = interpolate(frame, [STRIKE_START, STRIKE_END], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const dimmed = frame >= STRIKE_START + 4;

  const chipPop = spring({
    frame: frame - CHIP_VAGUE,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  const exitY = interpolate(
    frame,
    [DESCRIBE_EXIT, DESCRIBE_EXIT + 12],
    [0, -110],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  const exitOpacity = interpolate(
    frame,
    [DESCRIBE_EXIT, DESCRIBE_EXIT + 11],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: (W - 900) / 2,
        top: 452,
        width: 900,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        border: `1.5px solid ${COLORS.border}`,
        boxShadow:
          "0 24px 60px rgba(18, 24, 40, 0.10), 0 2px 6px rgba(18, 24, 40, 0.04)",
        padding: "42px 48px",
        opacity: enterOpacity * exitOpacity,
        transform: `translateY(${interpolate(enter, [0, 1], [26, 0]) + exitY}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          fontSize: 28,
          lineHeight: 1.5,
          whiteSpace: "nowrap",
          color: dimmed ? COLORS.muted : COLORS.body,
          display: "inline-block",
        }}
      >
        {typed}
        {caretVisible ? <span style={{ color: COLORS.blue }}>▊</span> : null}
        {/* strikethrough sweep */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: `${strike}%`,
            height: 3,
            backgroundColor: COLORS.red,
            borderRadius: 2,
          }}
        />
      </div>

      {/* too vague chip */}
      {frame >= CHIP_VAGUE ? (
        <div
          style={{
            position: "absolute",
            top: -22,
            right: 34,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 20px",
            borderRadius: 999,
            backgroundColor: COLORS.redBg,
            border: `1.5px solid ${COLORS.redBorder}`,
            color: COLORS.red,
            fontSize: 23,
            fontWeight: 700,
            transform: `scale(${chipPop}) rotate(-3deg)`,
          }}
        >
          ✗ too vague
        </div>
      ) : null}
    </div>
  );
};

// ---------- beat 2: the reference video drops in ----------
const ReferenceVideo: React.FC = () => {
  const frame = useCurrentFrame(); // local to Sequence (0 at VIDEO_IN)
  const { fps } = useVideoConfig();
  const global = frame + VIDEO_IN;

  const drop = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 90, mass: 1.1 },
  });
  const dropY = interpolate(drop, [0, 1], [-560, VIDEO_DROP_Y]);

  const dock = interpolate(global, [DOCK_START, DOCK_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const width = interpolate(dock, [0, 1], [VIDEO_DROP_W, VIDEO_DOCK_W]);
  const y = dropY + dock * (VIDEO_DOCK_Y - VIDEO_DROP_Y);
  const height = width * (9 / 16);

  return (
    <div
      style={{
        position: "absolute",
        left: (W - width) / 2,
        top: y,
        width,
        height,
        borderRadius: 20,
        overflow: "hidden",
        border: `1.5px solid ${COLORS.border}`,
        boxShadow:
          "0 30px 70px rgba(18, 24, 40, 0.16), 0 4px 12px rgba(18, 24, 40, 0.06)",
        backgroundColor: "#0B0D12",
      }}
    >
      <Loop durationInFrames={REF_VIDEO_FRAMES}>
        <OffthreadVideo
          muted
          src={staticFile("synapsex-reference.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Loop>
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 18px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.92)",
          color: COLORS.ink,
          fontSize: 21,
          fontWeight: 700,
        }}
      >
        ▶ reference.mp4
      </div>
    </div>
  );
};

// ---------- beat 3: Replit agent panel ----------
const AgentPanel: React.FC = () => {
  const frame = useCurrentFrame(); // local to Sequence (0 at PANEL_IN)
  const { fps } = useVideoConfig();
  const global = frame + PANEL_IN;

  const slide = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110, mass: 1.05 },
  });
  const y = interpolate(slide, [0, 1], [1120, PANEL_Y]);

  const chipPop = spring({
    frame: global - CHIP_REF,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  const statusLines = [
    { label: "analyzing reference", done: true },
    { label: "matching motion, type & mood", done: true },
    { label: "building around it", done: false },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_X,
        top: 0,
        width: PANEL_W,
        transform: `translateY(${y}px)`,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        border: `1.5px solid ${COLORS.border}`,
        boxShadow:
          "0 24px 60px rgba(18, 24, 40, 0.10), 0 2px 6px rgba(18, 24, 40, 0.04)",
        padding: "26px 34px 28px",
      }}
    >
      {/* input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          height: 78,
          borderRadius: 16,
          border: `1.5px solid ${COLORS.border}`,
          backgroundColor: "#FAFBFC",
          padding: "0 24px",
        }}
      >
        <ReplitMark height={36} />
        <div style={{ fontSize: 25, color: COLORS.muted }}>
          Ask Replit Agent...
        </div>
        {global >= CHIP_REF ? (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderRadius: 12,
              backgroundColor: COLORS.chipBg,
              border: `1.5px solid ${COLORS.chipBorder}`,
              color: COLORS.blue,
              fontSize: 23,
              fontWeight: 700,
              transform: `scale(${chipPop})`,
            }}
          >
            ▶ reference.mp4
            <span style={{ color: COLORS.green }}>✓</span>
          </div>
        ) : null}
      </div>

      {/* status lines */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {statusLines.map((line, i) => {
          const start = STATUS[i];
          const opacity = interpolate(global, [start, start + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = interpolate(global, [start, start + 8], [14, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const checkOpacity = interpolate(
            global,
            [start + 10, start + 16],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const cursorOn = global % 16 < 9;
          return (
            <div
              key={line.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 25,
                color: COLORS.body,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <span style={{ color: COLORS.blue }}>◇</span>
              <span>{line.label}</span>
              {line.done ? (
                <span style={{ color: COLORS.green, opacity: checkOpacity }}>
                  ✓
                </span>
              ) : (
                <span style={{ color: COLORS.blue, opacity: cursorOn ? 1 : 0 }}>
                  ▊
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ShowDontDescribe: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: mono }}>
      {/* faint dot grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(#14161C 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          opacity: 0.045,
        }}
      />

      <Sequence durationInFrames={DESCRIBE_EXIT + 14}>
        <DescribeCard />
      </Sequence>

      <Sequence from={PANEL_IN}>
        <AgentPanel />
      </Sequence>

      <Sequence from={VIDEO_IN}>
        <ReferenceVideo />
      </Sequence>
    </AbsoluteFill>
  );
};
