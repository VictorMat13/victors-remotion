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
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont();
const { fontFamily: monoFamily } = loadMono();

export const DURATION_IN_FRAMES = 240; // 8s @ 30fps

// Paper Liam palette + Higgsfield lime + Anthropic coral
const COLORS = {
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  sidebar: "#F7F5F0",
  field: "#FAF9F6",
  skeleton: "#EDE8E1",
  skeletonBar: "#F0ECE6",
  toggleOff: "#E7E2DA",
  lime: "#84CC16",
  limeDeep: "#65A30D",
  coral: "#D97757",
  coralDeep: "#C05F3F",
};

const FONT = fontFamily;
const MONO = monoFamily;

const MCP_URL = "https://mcp.higgsfield.ai";

// Beat timeline
const T = {
  copyClick: 16, // cursor presses Copy on the link pill
  camToDialog: 30, // camera starts travelling down to the Claude window
  dialogOpen: 46, // Add custom connector dialog springs in
  flyStart: 52, // copied pill detaches and flies
  flyLand: 70, // pill lands in the URL field
  addClick: 94, // cursor presses Add
  dialogClose: 100, // dialog collapses toward the list
  rowIn: 110, // Higgsfield row springs into the connector list
  toggleClick: 136, // cursor flips the switch
  connected: 148, // Connected chip pops
  pullOut: 150, // camera starts the payoff pull-out
  chipsIn: 158, // model chips fan out
};

// World geometry -------------------------------------------------------------
const WIN = { x: 90, y: 380, w: 900, h: 860 }; // Claude window
const LINK_CARD = { cx: 540, cy: 150, w: 700, h: 112 }; // copy-link pill
const ROW_CY = 688; // world y of the Higgsfield row center
const TOGGLE_C = { x: 906, y: ROW_CY }; // toggle center (world)
const COPY_BTN = { x: 805, y: 150 }; // copy button center (world)
const ADD_BTN = { x: 770, y: 890 }; // dialog Add button center (world)

// Payoff chips — the actual models Higgsfield's MCP exposes to Claude
const CHIPS: {
  label: string;
  src: string;
  x: number;
  y: number;
  r: number;
  order: number;
}[] = [
  { label: "Sora 2", src: "higgs3/logos/openai.svg", x: 50, y: 520, r: -3, order: 0 },
  { label: "Veo 3.1", src: "higgs3/logos/gemini.svg", x: 1030, y: 520, r: 3, order: 1 },
  { label: "Kling 3.0", src: "higgs3/logos/kling-color.svg", x: 44, y: 790, r: 2.5, order: 2 },
  { label: "Hailuo", src: "higgs3/logos/hailuo-color.svg", x: 1036, y: 790, r: -2.5, order: 3 },
  { label: "Wan 2.6", src: "higgs3/logos/wan.png", x: 52, y: 1055, r: -2, order: 4 },
  { label: "Seedance 2.0", src: "higgs3/logos/bytedance-color.svg", x: 1028, y: 1055, r: 2, order: 5 },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const clickDip = (frame: number, at: number) =>
  interpolate(frame, [at - 2, at, at + 5], [0, 0.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Ripple: React.FC<{ at: number; x: number; y: number; color: string }> = ({
  at,
  x,
  y,
  color,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 14) return null;
  const r = 26 + t * 6.5;
  const o = 0.4 * (1 - t / 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 999,
        border: `3px solid ${color}`,
        opacity: o,
        zIndex: 60,
      }}
    />
  );
};

const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);
  const kf = [6, 14, 44, 84, 92, 112, 132, 150, 170];
  const x = interpolate(frame, kf, [760, 808, 808, 770, 770, 770, 908, 908, 990], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const y = interpolate(frame, kf, [300, 162, 162, 830, 878, 878, 692, 692, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const fadeIn = interpolate(frame, [6, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [154, 170], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dip =
    clickDip(frame, T.copyClick) +
    clickDip(frame, T.addClick) +
    clickDip(frame, T.toggleClick);
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: fadeIn * fadeOut,
        transform: `scale(${1 - dip})`,
        transformOrigin: "6px 3px",
        zIndex: 80,
        filter: "drop-shadow(0 3px 6px rgba(25,23,20,0.3))",
      }}
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
        fill={COLORS.ink}
        stroke="#FFFFFF"
        strokeWidth="1.4"
      />
    </svg>
  );
};

const CopyGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// Toggle switch — off gray → on lime
const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <div
    style={{
      width: 56,
      height: 32,
      borderRadius: 999,
      background: `rgba(132,204,22,${on})`,
      boxShadow: `inset 0 0 0 32px rgba(231,226,218,${1 - on})`,
      position: "relative",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 3,
        left: 3 + on * 24,
        width: 26,
        height: 26,
        borderRadius: 999,
        background: "#FFFFFF",
        boxShadow: "0 2px 5px rgba(25,23,20,0.25)",
      }}
    />
  </div>
);

const SkeletonRow: React.FC<{ y: number }> = ({ y }) => (
  <div
    style={{
      position: "absolute",
      left: 280,
      top: y - 48,
      width: 580,
      height: 96,
      display: "flex",
      alignItems: "center",
      gap: 22,
      borderBottom: `1px solid ${COLORS.line}`,
      opacity: 0.85,
    }}
  >
    <div style={{ width: 64, height: 64, borderRadius: 16, background: COLORS.skeleton }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
      <div style={{ width: 180, height: 16, borderRadius: 8, background: COLORS.skeletonBar }} />
      <div style={{ width: 120, height: 12, borderRadius: 6, background: COLORS.skeletonBar }} />
    </div>
    <Toggle on={0} />
  </div>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const HiggsConnectorSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera rig: focal (cx, cy) mapped to canvas center, zoom z ------------
  const camEase = Easing.inOut(Easing.cubic);
  const CAM_T = [0, 30, 58, 100, 126, 150, 186, 214, 240];
  const camCx = interpolate(frame, CAM_T, [540, 540, 540, 540, 655, 655, 540, 540, 540], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  });
  const camCy = interpolate(frame, CAM_T, [150, 150, 790, 790, 700, 700, 812, 812, 812], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  });
  const camZBase = interpolate(frame, CAM_T, [1.36, 1.36, 1.5, 1.5, 1.65, 1.65, 0.88, 0.885, 0.885], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: camEase,
  });
  // micro punches on the three clicks
  const punch =
    interpolate(frame, [T.copyClick - 2, T.copyClick + 1, T.copyClick + 9], [0, 0.03, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
    interpolate(frame, [T.addClick - 2, T.addClick + 1, T.addClick + 9], [0, 0.035, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
    interpolate(frame, [T.toggleClick - 2, T.toggleClick + 1, T.toggleClick + 9], [0, 0.03, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const camZ = camZBase + punch;

  // --- Link pill (copy state) -------------------------------------------------
  const linkIn = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
  const linkOut = interpolate(frame, [T.pullOut + 2, T.pullOut + 18], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const copied = frame >= T.copyClick + 2;
  const copiedPop = spring({
    frame: frame - T.copyClick - 2,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  // --- Dialog -------------------------------------------------------------------
  const dialogIn = spring({
    frame: frame - T.dialogOpen,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const dialogOut = interpolate(frame, [T.dialogClose, T.dialogClose + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const dialogScale = dialogIn * (0.9 + 0.1 * dialogIn) * (1 - 0.9 * dialogOut);
  const dialogOpacity = dialogIn * (1 - dialogOut);
  // collapse drifts toward the list row
  const dialogDx = dialogOut * (655 - 540);
  const dialogDy = dialogOut * (ROW_CY - 784);
  const scrim =
    interpolate(frame, [T.dialogOpen - 2, T.dialogOpen + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [T.dialogClose, T.dialogClose + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // field content + focus ring
  const landed = frame >= T.flyLand;
  const caretOn = Math.floor(frame / 14) % 2 === 0;
  const fieldFlash = interpolate(frame, [T.flyLand, T.flyLand + 3, T.flyLand + 18], [0, 1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Flying pill ----------------------------------------------------------------
  const flyT = interpolate(frame, [T.flyStart, T.flyLand], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const flyVisible = frame >= T.flyStart && frame < T.flyLand + 4;
  const flyFade = interpolate(frame, [T.flyLand, T.flyLand + 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // quadratic bezier from link pill → field
  const P0 = { x: 470, y: 150 };
  const P1 = { x: 330, y: 460 };
  const P2 = { x: 462, y: 762 };
  const flyX = (1 - flyT) * (1 - flyT) * P0.x + 2 * (1 - flyT) * flyT * P1.x + flyT * flyT * P2.x;
  const flyY = (1 - flyT) * (1 - flyT) * P0.y + 2 * (1 - flyT) * flyT * P1.y + flyT * flyT * P2.y;
  const flyRot = Math.sin(flyT * Math.PI) * -4;
  const flyScale = 1 - 0.05 * flyT;

  // --- Higgsfield row + list reflow ------------------------------------------------
  const rowIn = spring({
    frame: frame - T.rowIn,
    fps,
    config: { damping: 13, stiffness: 130 },
  });
  const slide = spring({
    frame: frame - T.rowIn,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const listShift = slide * 112; // skeleton rows make room
  const rowVisible = frame >= T.rowIn;

  // toggle state
  const knob = spring({
    frame: frame - T.toggleClick,
    fps,
    config: { damping: 15, stiffness: 220 },
  });
  const connectedPop = spring({
    frame: frame - T.connected,
    fps,
    config: { damping: 11, stiffness: 190 },
  });
  const dotPulse = 0.55 + 0.45 * Math.sin(frame / 7);

  // --- Payoff glow + chips -----------------------------------------------------------
  const glowStrength = interpolate(frame, [0, 140, 175], [0.45, 0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* Camera world */}
      <AbsoluteFill
        style={{
          transform: `translate(540px, 540px) scale(${camZ}) translate(${-camCx}px, ${-camCy}px)`,
          transformOrigin: "0 0",
        }}
      >
        {/* Grid — generous bleed so the camera never sees its edge */}
        <div
          style={{
            position: "absolute",
            left: -400,
            top: -600,
            width: 1880,
            height: 2500,
            backgroundImage:
              "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Lime glow anchored behind the window */}
        <div
          style={{
            position: "absolute",
            left: 540 - 700,
            top: 810 - 700,
            width: 1400,
            height: 1400,
            background: "radial-gradient(circle at 50% 50%, rgba(132,204,22,0.12), rgba(0,0,0,0) 62%)",
            opacity: glowStrength,
          }}
        />

        {/* ------------------------------------------------ Link pill (copy card) */}
        <div
          style={{
            position: "absolute",
            left: LINK_CARD.cx - LINK_CARD.w / 2,
            top: LINK_CARD.cy - LINK_CARD.h / 2,
            width: LINK_CARD.w,
            height: LINK_CARD.h,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 26,
            boxShadow: "0 22px 50px rgba(25,23,20,0.10)",
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 26px",
            transform: `translateY(${(1 - linkIn) * 26}px) scale(${0.96 + 0.04 * linkIn})`,
            opacity: linkIn * linkOut,
          }}
        >
          <Img
            src={staticFile("fable5/higgsfield-icon.png")}
            style={{ width: 64, height: 64, borderRadius: 16 }}
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: 26,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: -0.5,
              flex: 1,
              whiteSpace: "nowrap",
            }}
          >
            {MCP_URL}
          </div>
          {/* Copy button */}
          <div
            style={{
              width: 118,
              height: 64,
              borderRadius: 14,
              background: copied ? "rgba(132,204,22,0.16)" : "rgba(132,204,22,0.12)",
              border: `1.5px solid ${copied ? COLORS.limeDeep : "rgba(101,163,13,0.5)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transform: copied ? `scale(${0.85 + 0.15 * copiedPop})` : `scale(${1 - clickDip(frame, T.copyClick) * 0.8})`,
            }}
          >
            {copied ? <CheckGlyph color={COLORS.limeDeep} /> : <CopyGlyph color={COLORS.limeDeep} />}
            <span style={{ fontFamily: FONT, fontSize: 21, fontWeight: 800, color: COLORS.limeDeep }}>
              {copied ? "Copied" : "Copy"}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------ Claude window */}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 28,
            boxShadow: "0 30px 70px rgba(25,23,20,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: 60,
              borderBottom: `1px solid ${COLORS.line}`,
              display: "flex",
              alignItems: "center",
            }}
          >
            {[{ c: "#FF5F57" }, { c: "#FEBC2E" }, { c: "#28C840" }].map((l, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 26 + i * 26,
                  top: 23,
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: l.c,
                }}
              />
            ))}
            <div
              style={{
                width: "100%",
                textAlign: "center",
                fontFamily: FONT,
                fontSize: 21,
                fontWeight: 600,
                color: COLORS.muted,
              }}
            >
              Settings
            </div>
          </div>

          {/* Sidebar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 60,
              width: 240,
              bottom: 0,
              background: COLORS.sidebar,
              borderRight: `1px solid ${COLORS.line}`,
              padding: "26px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30, paddingLeft: 8 }}>
              <Img src={staticFile("fable5/claude-logo.png")} style={{ width: 32, height: 32 }} />
              <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>
                Claude
              </span>
            </div>
            {["General", "Appearance", "Privacy", "Connectors", "Extensions", "Developer"].map((item) => {
              const active = item === "Connectors";
              return (
                <div
                  key={item}
                  style={{
                    height: 52,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 16,
                    marginBottom: 2,
                    background: active ? "rgba(217,119,87,0.13)" : "transparent",
                    fontFamily: FONT,
                    fontSize: 22,
                    fontWeight: active ? 800 : 600,
                    color: active ? COLORS.coralDeep : COLORS.muted,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>

          {/* Main pane */}
          <div style={{ position: "absolute", left: 240, top: 60, right: 0, bottom: 0 }}>
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 44,
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: -1,
                color: COLORS.ink,
              }}
            >
              Connectors
            </div>
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 102,
                fontFamily: FONT,
                fontSize: 20,
                fontWeight: 500,
                color: COLORS.muted,
              }}
            >
              Connect Claude to your tools with MCP
            </div>
          </div>

          {/* List (window-local coordinates) */}
          {/* Higgsfield row */}
          {rowVisible && (
            <div
              style={{
                position: "absolute",
                left: 280,
                top: ROW_CY - WIN.y - 48,
                width: 580,
                height: 96,
                display: "flex",
                alignItems: "center",
                gap: 22,
                borderBottom: `1px solid ${COLORS.line}`,
                transform: `translateY(${(1 - rowIn) * -18}px) scale(${0.9 + 0.1 * rowIn})`,
                transformOrigin: "50% 50%",
                opacity: rowIn,
              }}
            >
              <Img
                src={staticFile("fable5/higgsfield-icon.png")}
                style={{ width: 64, height: 64, borderRadius: 16 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>
                    Higgsfield
                  </span>
                  {/* Connected chip */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 14px",
                      borderRadius: 999,
                      background: "rgba(132,204,22,0.14)",
                      border: `1.5px solid ${COLORS.limeDeep}`,
                      transform: `scale(${0.6 + 0.4 * connectedPop})`,
                      opacity: connectedPop,
                    }}
                  >
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: COLORS.limeDeep,
                        boxShadow: `0 0 ${5 + 5 * dotPulse}px ${COLORS.lime}`,
                      }}
                    />
                    <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, letterSpacing: 1, color: COLORS.limeDeep }}>
                      Connected
                    </span>
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, color: COLORS.muted }}>
                  mcp.higgsfield.ai
                </span>
              </div>
              <Toggle on={knob} />
            </div>
          )}

          {/* Skeleton rows reflow down when Higgsfield lands */}
          <SkeletonRow y={ROW_CY - WIN.y + listShift} />
          <SkeletonRow y={ROW_CY - WIN.y + 112 + listShift} />

          {/* Add custom connector button */}
          <div
            style={{
              position: "absolute",
              left: 280,
              top: ROW_CY - WIN.y + 194 + listShift,
              width: 330,
              height: 60,
              borderRadius: 14,
              border: `1.5px solid ${COLORS.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontFamily: FONT,
              fontSize: 21,
              fontWeight: 600,
              color: COLORS.muted,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 500, marginTop: -3 }}>+</span>
            Add custom connector
          </div>

          {/* Scrim while dialog is open */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(25,23,20,0.16)",
              opacity: scrim,
            }}
          />
        </div>

        {/* ------------------------------------------------ Dialog (world coords) */}
        {dialogOpacity > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 600,
              width: 640,
              height: 368,
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 24,
              boxShadow: "0 34px 80px rgba(25,23,20,0.22)",
              transform: `translate(${dialogDx}px, ${dialogDy}px) scale(${dialogScale})`,
              transformOrigin: "50% 50%",
              opacity: dialogOpacity,
              zIndex: 40,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 32,
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -0.8,
                color: COLORS.ink,
              }}
            >
              Add custom connector
            </div>
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 92,
                fontFamily: FONT,
                fontSize: 19,
                fontWeight: 600,
                color: COLORS.muted,
              }}
            >
              Remote MCP server URL
            </div>
            {/* URL field */}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 126,
                width: 560,
                height: 72,
                borderRadius: 14,
                background: COLORS.field,
                border: `1.5px solid ${landed ? COLORS.coral : COLORS.line}`,
                boxShadow: landed ? `0 0 0 ${4 * fieldFlash}px rgba(217,119,87,0.18)` : "none",
                display: "flex",
                alignItems: "center",
                paddingLeft: 24,
              }}
            >
              {landed ? (
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5 }}>
                  {MCP_URL}
                </span>
              ) : (
                <div
                  style={{
                    width: 2.5,
                    height: 34,
                    background: COLORS.ink,
                    opacity: caretOn ? 0.8 : 0,
                  }}
                />
              )}
            </div>
            {/* Buttons */}
            <div
              style={{
                position: "absolute",
                right: 172,
                top: 262,
                height: 56,
                display: "flex",
                alignItems: "center",
                fontFamily: FONT,
                fontSize: 21,
                fontWeight: 600,
                color: COLORS.muted,
              }}
            >
              Cancel
            </div>
            <div
              style={{
                position: "absolute",
                right: 40,
                top: 262,
                width: 110,
                height: 56,
                borderRadius: 12,
                background: frame >= T.addClick ? COLORS.coralDeep : COLORS.coral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 800,
                color: "#FFFFFF",
                boxShadow: "0 10px 24px rgba(217,119,87,0.35)",
                transform: `scale(${1 - clickDip(frame, T.addClick) * 0.8})`,
              }}
            >
              Add
            </div>
          </div>
        )}

        {/* ------------------------------------------------ Flying URL pill */}
        {flyVisible && (
          <div
            style={{
              position: "absolute",
              left: flyX,
              top: flyY,
              transform: `translate(-50%, -50%) rotate(${flyRot}deg) scale(${flyScale})`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px",
              borderRadius: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              boxShadow: "0 18px 44px rgba(25,23,20,0.20)",
              opacity: flyFade,
              zIndex: 50,
              whiteSpace: "nowrap",
            }}
          >
            <Img
              src={staticFile("fable5/higgsfield-icon.png")}
              style={{ width: 30, height: 30, borderRadius: 8 }}
            />
            <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5 }}>
              {MCP_URL}
            </span>
          </div>
        )}

        {/* ------------------------------------------------ Payoff model chips */}
        {CHIPS.map((chip) => {
          const enter = spring({
            frame: frame - T.chipsIn - chip.order * 7,
            fps,
            config: { damping: 11, stiffness: 150 },
          });
          if (enter < 0.01) return null;
          const drift = Math.sin((frame + chip.order * 31) / 24) * 4;
          const towardCenter = (540 - chip.x) * 0.12;
          return (
            <div
              key={chip.label}
              style={{
                position: "absolute",
                left: chip.x,
                top: chip.y + drift,
                transform: `translate(-50%, -50%) translateX(${(1 - enter) * towardCenter}px) rotate(${chip.r}deg) scale(${0.4 + 0.6 * enter})`,
                opacity: enter,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                zIndex: 70,
              }}
            >
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 28,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.line}`,
                  boxShadow: "0 18px 40px rgba(25,23,20,0.14)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Img src={staticFile(chip.src)} style={{ width: 56, height: 56, objectFit: "contain" }} />
              </div>
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {chip.label}
              </span>
            </div>
          );
        })}

        {/* ------------------------------------------------ Click ripples + cursor */}
        <Ripple at={T.copyClick} x={COPY_BTN.x} y={COPY_BTN.y} color={COLORS.limeDeep} />
        <Ripple at={T.addClick} x={ADD_BTN.x} y={ADD_BTN.y} color={COLORS.coral} />
        <Ripple at={T.toggleClick} x={TOGGLE_C.x} y={TOGGLE_C.y} color={COLORS.limeDeep} />
        <Cursor />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
