import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, LOVABLE, WORLD } from "./theme";

export const DURATION_IN_FRAMES = 210;

// ---------------------------------------------------------------------------
// LwP3 — "Then open Lovable, upload that video, add a site for direction."
// One continuous white world, keyframed camera. 1080x1920 @30fps.
// Beat: OPEN (logo docks, box rises) -> UPLOAD (+ menu -> Attach -> video
// chip + progress ring) -> REFERENCE (lusion.co chip) -> END HOLD (pull-back).
// ---------------------------------------------------------------------------

const VIEW_W = 1080;
const VIEW_H = 1920;

// World layout (world coordinates)
const BOX = { x: 80, y: 730, w: 920, h: 340, r: 30 };
const LOGO = { x: 540, y: 480, size: 132 };
const PLUS = { x: 134, y: 1002 };
const SEND = { x: 930, y: 1002, r: 32 };
const MENU = { x: 100, y: 1044, w: 400 };
const CHIP_V = { x: 116, y: 766, w: 172, h: 128, r: 16 };
const CHIP_S = { x: 308, y: 766, w: 240, h: 128, r: 16 };

const ease = Easing.inOut(Easing.cubic);

// Camera keyframes — hold -> move -> hold, moves 14-24f, 2 near-identical end keys
const KEY_T = [0, 26, 32, 50, 96, 116, 152, 176, 196, 209];
const KEY_FX = [540, 540, 540, 360, 360, 355, 355, 540, 540, 540];
const KEY_FY = [560, 645, 645, 1165, 1165, 838, 838, 742, 741, 741];
const KEY_Z = [1.42, 1.28, 1.28, 1.55, 1.55, 1.65, 1.65, 1.02, 1.03, 1.032];

// ---- tiny SVG icon helpers (UI mock parts, not exported) ----
const PlusGlyph: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = "#171717",
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28">
    <line x1="14" y1="5" x2="14" y2="23" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <line x1="5" y1="14" x2="23" y2="14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const MicGlyph: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="3" width="6" height="11" rx="3" stroke="#171717" strokeWidth="1.9" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" stroke="#171717" strokeWidth="1.9" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="21.5" stroke="#171717" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const ChevronDown: React.FC = () => (
  <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
    <polyline points="1.5,1.5 7,7 12.5,1.5" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight: React.FC = () => (
  <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
    <polyline points="1.5,1.5 7,7 1.5,12.5" stroke="#9B978F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchGlyph: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="10.5" cy="10.5" r="6" stroke="#9B978F" strokeWidth="1.9" />
    <line x1="15" y1="15" x2="20" y2="20" stroke="#9B978F" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const PaperclipGlyph: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M8.6 12.4l6-6a2.7 2.7 0 0 1 3.8 3.8l-7 7a4.5 4.5 0 0 1-6.4-6.4l6.7-6.7"
      stroke="#171717"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConnectorsGlyph: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="17.5" cy="5.5" r="2.6" stroke="#171717" strokeWidth="1.8" />
    <circle cx="6" cy="12" r="2.6" stroke="#171717" strokeWidth="1.8" />
    <circle cx="17.5" cy="18.5" r="2.6" stroke="#171717" strokeWidth="1.8" />
    <line x1="8.4" y1="10.7" x2="15.2" y2="6.9" stroke="#171717" strokeWidth="1.8" />
    <line x1="8.4" y1="13.4" x2="15.2" y2="17.2" stroke="#171717" strokeWidth="1.8" />
  </svg>
);

const DatabaseGlyph: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="6" rx="7" ry="3" stroke="#171717" strokeWidth="1.8" />
    <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="#171717" strokeWidth="1.8" />
    <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" stroke="#171717" strokeWidth="1.8" />
  </svg>
);

const GlobeGlyph: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.6" stroke="#171717" strokeWidth="1.5" />
    <ellipse cx="9" cy="9" rx="2.8" ry="6.6" stroke="#171717" strokeWidth="1.3" />
    <line x1="2.4" y1="9" x2="15.6" y2="9" stroke="#171717" strokeWidth="1.3" />
  </svg>
);

const ArrowUpGlyph: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path d="M12 18.5V6M6.5 11.5L12 6l5.5 5.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Black stealth drone (top view, like the Dronea hook video / app-03 chip)
const DroneGlyph: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height={width} viewBox="0 0 100 100">
    <ellipse cx="50" cy="82" rx="27" ry="5" fill="rgba(0,0,0,0.10)" />
    <path
      d="M50 10 L94 72 L71 61 L58 74 L50 66 L42 74 L29 61 L6 72 Z"
      fill="#161616"
    />
    <line x1="50" y1="20" x2="50" y2="60" stroke="#2E2E2E" strokeWidth="3" />
  </svg>
);

const CursorGlyph: React.FC = () => (
  <svg width="30" height="34" viewBox="0 0 24 28">
    <path
      d="M5 2v19.5l4.6-4.1 3 7 3.5-1.5-3-6.9h6.4z"
      fill="#141414"
      stroke="#FFFFFF"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------

export const LwP3OpenLovable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = interpolate(frame, KEY_T, KEY_FX, camOpts);
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpts);
  const z = interpolate(frame, KEY_T, KEY_Z, camOpts);

  // ---- OPEN: logo card easing in at f0, box rising, heading fade ----
  const logoOp = interpolate(frame, [0, 14], [0.38, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 18], [0.9, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(frame, [0, 36], [436, LOGO.y], {
    easing: ease,
    extrapolateRight: "clamp",
  });

  const boxIn = spring({
    frame: frame - 8,
    fps,
    config: { damping: 24, stiffness: 80, mass: 1.15 },
  });
  const boxOff = 560 * (1 - boxIn);

  const headOp = interpolate(frame, [16, 32], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headDy = interpolate(frame, [16, 34], [26, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // logo fades out while the camera dives past it (beat 2), back for beat 3;
  // the heading only returns during the final pull-back (it would be cut at
  // the right edge in the tighter chip framing)
  const logoFade = interpolate(frame, [36, 50, 98, 112], [1, 0, 0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headFade = interpolate(frame, [36, 50, 158, 174], [1, 0, 0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- cursor ----
  const cursorT = [40, 56, 68, 78, 88, 106];
  const curX = interpolate(frame, cursorT, [1150, PLUS.x, PLUS.x, 300, 300, 898], camOpts);
  const curY = interpolate(frame, cursorT, [1560, PLUS.y, PLUS.y, 1150, 1150, 1022], camOpts);
  const curOp = interpolate(frame, [40, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pressAt = (start: number) =>
    interpolate(frame, [start, start + 2, start + 5], [1, 0.84, 1], {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const curScale = pressAt(57) * pressAt(79);

  // click ripples (world coords, at plus + at Attach row)
  const ripple = (start: number) => {
    const p = interpolate(frame, [start, start + 12], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { r: 12 + 36 * p, op: frame >= start && frame < start + 12 ? 0.45 * (1 - p) : 0 };
  };
  const rip1 = ripple(58);
  const rip2 = ripple(80);

  // ---- attach menu ----
  const menuIn = spring({
    frame: frame - 60,
    fps,
    config: { damping: 17, stiffness: 180 },
  });
  const menuOut = interpolate(frame, [82, 90], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const menuOp =
    interpolate(frame, [60, 65], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * menuOut;
  const menuScale = (0.88 + 0.12 * menuIn) * (0.94 + 0.06 * menuOut);
  const menuVisible = frame >= 60 && menuOp > 0.002;

  // plus -> x rotation while menu open (real app behavior in app-02)
  const plusOpenT = interpolate(frame, [58, 64, 82, 88], [0, 1, 1, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const attachHover = interpolate(frame, [72, 76], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const attachFlash = interpolate(frame, [79, 81, 86], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- video chip + upload progress ring ----
  const chipIn = spring({
    frame: frame - 86,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const chipOp = interpolate(frame, [86, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipScale = 0.55 + 0.45 * chipIn;

  const upl = interpolate(frame, [88, 102], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scrimOp = interpolate(frame, [86, 90, 106, 113], [0, 0.32, 0.32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOp = interpolate(frame, [86, 90, 106, 113], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const checkIn = spring({
    frame: frame - 102,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const RING_R = 22;
  const RING_C = 2 * Math.PI * RING_R;

  // placeholder slides down as the chip row appears (real app behavior)
  const phS = spring({
    frame: frame - 86,
    fps,
    config: { damping: 20, stiffness: 120 },
  });
  const phY = 788 + (934 - 788) * phS;

  // ---- reference site chip (lusion.co) ----
  const siteIn = spring({
    frame: frame - 124,
    fps,
    config: { damping: 17, stiffness: 110 },
  });
  const siteOp = interpolate(frame, [124, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const siteDx = 150 * (1 - siteIn);
  const pillIn = spring({
    frame: frame - 138,
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const pillOp = interpolate(frame, [138, 142], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- end hold: chips hover, send pulse ----
  const endRamp = interpolate(frame, [158, 176], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hoverA = endRamp * 3 * Math.sin((frame - 158) * 0.09);
  const hoverB = endRamp * 3 * Math.sin((frame - 158) * 0.11 + 1.7);
  const pulse = endRamp * (0.5 + 0.5 * Math.sin((frame - 176) * 0.16));
  const sendScale = 1 + 0.05 * pulse;

  const menuRowStyle: React.CSSProperties = {
    height: 68,
    margin: "0 8px",
    padding: "0 16px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 16,
    fontSize: 30,
    color: LOVABLE.text,
    fontWeight: 500,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, fontFamily: FONT_SANS }}>
      {/* ================= CAMERA WORLD ================= */}
      <div
        style={{
          position: "absolute",
          width: VIEW_W,
          height: VIEW_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* soft dashboard-gradient glows (background — may bleed) */}
        <div
          style={{
            position: "absolute",
            left: -220,
            top: 60,
            width: 1520,
            height: 1000,
            background:
              "radial-gradient(closest-side, rgba(77,126,242,0.20), rgba(77,126,242,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -160,
            top: 640,
            width: 1600,
            height: 1120,
            background:
              "radial-gradient(closest-side, rgba(226,79,180,0.13), rgba(226,79,180,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 1020,
            width: 1400,
            height: 940,
            background:
              "radial-gradient(closest-side, rgba(244,56,92,0.08), rgba(244,56,92,0) 72%)",
          }}
        />

        {/* heading — real dashboard string, Liam identity */}
        <div
          style={{
            position: "absolute",
            left: BOX.x,
            top: 605,
            width: BOX.w,
            textAlign: "center",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: LOVABLE.text,
            opacity: headOp * headFade,
            transform: `translateY(${headDy}px)`,
          }}
        >
          {LOVABLE.strings.ready}
        </div>

        {/* floating logo card (real Lovable heart) */}
        <div
          style={{
            position: "absolute",
            left: LOGO.x - LOGO.size / 2,
            top: logoY - LOGO.size / 2,
            width: LOGO.size,
            height: LOGO.size,
            borderRadius: 32,
            background: WORLD.card,
            border: `1px solid ${LOVABLE.uiBorder}`,
            boxShadow: WORLD.shadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: logoOp * logoFade,
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={staticFile(LOVABLE.logoSvg)}
            style={{ width: 74, height: 66 }}
          />
        </div>

        {/* ============ PROMPT BOX GROUP (rises from below) ============ */}
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${boxOff}px)` }}>
          {/* the box card */}
          <div
            style={{
              position: "absolute",
              left: BOX.x,
              top: BOX.y,
              width: BOX.w,
              height: BOX.h,
              borderRadius: BOX.r,
              background: LOVABLE.ui,
              border: `1px solid ${LOVABLE.uiBorder}`,
              boxShadow: WORLD.shadow,
            }}
          />

          {/* placeholder text (real app string) */}
          <div
            style={{
              position: "absolute",
              left: 116,
              top: phY - 20,
              fontSize: 34,
              color: LOVABLE.muted,
              fontWeight: 400,
            }}
          >
            {LOVABLE.strings.placeholder}
          </div>

          {/* ---- video chip (drone upload, like app-03) ---- */}
          {frame >= 86 ? (
            <div
              style={{
                position: "absolute",
                left: CHIP_V.x,
                top: CHIP_V.y + hoverA,
                width: CHIP_V.w,
                height: CHIP_V.h,
                borderRadius: CHIP_V.r,
                background: "#EDECE7",
                border: `1px solid ${LOVABLE.uiBorder}`,
                boxShadow: WORLD.shadowSoft,
                opacity: chipOp,
                transform: `scale(${chipScale})`,
                transformOrigin: "30% 70%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: (CHIP_V.w - 96) / 2,
                  top: (CHIP_V.h - 96) / 2 - 2,
                }}
              >
                <DroneGlyph width={96} />
              </div>
              {/* duration badge — real clip length */}
              <div
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  padding: "3px 9px",
                  borderRadius: 8,
                  background: "rgba(17,17,17,0.72)",
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                }}
              >
                0:27
              </div>
              {/* upload scrim + progress ring */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `rgba(17,17,17,${scrimOp})`,
                }}
              />
              <svg
                width={CHIP_V.w}
                height={CHIP_V.h}
                style={{ position: "absolute", inset: 0, opacity: ringOp }}
              >
                <circle
                  cx={CHIP_V.w / 2}
                  cy={CHIP_V.h / 2}
                  r={RING_R}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="4.5"
                  fill="none"
                />
                <circle
                  cx={CHIP_V.w / 2}
                  cy={CHIP_V.h / 2}
                  r={RING_R}
                  stroke="#FFFFFF"
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - upl)}
                  transform={`rotate(-90 ${CHIP_V.w / 2} ${CHIP_V.h / 2})`}
                />
                {frame >= 102 ? (
                  <path
                    d="M76 64l7 7 13-14"
                    stroke="#FFFFFF"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={Math.min(1, checkIn)}
                  />
                ) : null}
              </svg>
            </div>
          ) : null}

          {/* ---- reference site chip (lusion.co) ---- */}
          {frame >= 124 ? (
            <div
              style={{
                position: "absolute",
                left: CHIP_S.x + siteDx,
                top: CHIP_S.y + hoverB,
                width: CHIP_S.w,
                height: CHIP_S.h,
                borderRadius: CHIP_S.r,
                background: "#141318",
                border: `1px solid ${LOVABLE.uiBorder}`,
                boxShadow: WORLD.shadowSoft,
                opacity: siteOp,
                overflow: "hidden",
              }}
            >
              {/* abstract dark hero (lusion-style) */}
              <div
                style={{
                  position: "absolute",
                  right: -34,
                  top: -34,
                  width: 150,
                  height: 150,
                  background:
                    "radial-gradient(closest-side, rgba(124,77,255,0.75), rgba(124,77,255,0) 72%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 26,
                  bottom: -44,
                  width: 130,
                  height: 130,
                  background:
                    "radial-gradient(closest-side, rgba(56,189,248,0.5), rgba(56,189,248,0) 72%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  top: 18,
                  width: 92,
                  height: 7,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.8)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  top: 34,
                  width: 58,
                  height: 7,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.35)",
                }}
              />
              {/* URL pill */}
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  bottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 13px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.95)",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  opacity: pillOp,
                  transform: `scale(${0.7 + 0.3 * Math.min(1.15, pillIn)})`,
                  transformOrigin: "20% 80%",
                }}
              >
                <GlobeGlyph />
                lusion.co
              </div>
            </div>
          ) : null}

          {/* ---- bottom controls row ---- */}
          {/* plus button (turns into x while menu is open, like app-02) */}
          <div
            style={{
              position: "absolute",
              left: PLUS.x - 26,
              top: PLUS.y - 26,
              width: 52,
              height: 52,
              borderRadius: 26,
              background: `rgba(238,236,232,${plusOpenT})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${45 * plusOpenT}deg) scale(${pressAt(57) * 0.12 + 0.88})`,
            }}
          >
            <PlusGlyph />
          </div>

          {/* Build dropdown (real string) */}
          <div
            style={{
              position: "absolute",
              left: 716,
              top: PLUS.y - 22,
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 30,
              fontWeight: 500,
              color: LOVABLE.text,
            }}
          >
            {LOVABLE.strings.build}
            <ChevronDown />
          </div>

          {/* mic */}
          <div style={{ position: "absolute", left: 843, top: PLUS.y - 13 }}>
            <MicGlyph />
          </div>

          {/* black send arrow */}
          <div
            style={{
              position: "absolute",
              left: SEND.x - SEND.r,
              top: SEND.y - SEND.r,
              width: SEND.r * 2,
              height: SEND.r * 2,
              borderRadius: SEND.r,
              background: LOVABLE.black,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${sendScale})`,
              boxShadow: `0 0 0 ${10 * pulse}px rgba(17,17,17,0.05)`,
            }}
          >
            <ArrowUpGlyph />
          </div>

          {/* ---- attach menu (exactly app-02: Search / Attach / Connectors / Databases) ---- */}
          {menuVisible ? (
            <div
              style={{
                position: "absolute",
                left: MENU.x,
                top: MENU.y,
                width: MENU.w,
                borderRadius: 20,
                background: LOVABLE.ui,
                border: `1px solid ${LOVABLE.uiBorder}`,
                boxShadow: WORLD.shadow,
                paddingBottom: 8,
                opacity: menuOp,
                transform: `scale(${menuScale})`,
                transformOrigin: "44px 0px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 62,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 22px",
                  fontSize: 28,
                  color: LOVABLE.muted,
                  borderBottom: `1px solid ${WORLD.border}`,
                  marginBottom: 8,
                }}
              >
                <SearchGlyph />
                Search...
              </div>
              <div
                style={{
                  ...menuRowStyle,
                  background: `rgba(230,228,223,${0.55 * attachHover + 0.45 * attachFlash})`,
                }}
              >
                <PaperclipGlyph />
                {LOVABLE.strings.attachMenu[0]}
              </div>
              <div style={menuRowStyle}>
                <ConnectorsGlyph />
                {LOVABLE.strings.attachMenu[1]}
                <div style={{ marginLeft: "auto" }}>
                  <ChevronRight />
                </div>
              </div>
              <div style={menuRowStyle}>
                <DatabaseGlyph />
                {LOVABLE.strings.attachMenu[2]}
                <div style={{ marginLeft: "auto" }}>
                  <ChevronRight />
                </div>
              </div>
            </div>
          ) : null}

          {/* click ripples */}
          {rip1.op > 0 ? (
            <div
              style={{
                position: "absolute",
                left: PLUS.x - rip1.r,
                top: PLUS.y - rip1.r,
                width: rip1.r * 2,
                height: rip1.r * 2,
                borderRadius: rip1.r,
                border: "3px solid rgba(17,17,17,0.55)",
                opacity: rip1.op,
              }}
            />
          ) : null}
          {rip2.op > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 300 - rip2.r,
                top: 1150 - rip2.r,
                width: rip2.r * 2,
                height: rip2.r * 2,
                borderRadius: rip2.r,
                border: "3px solid rgba(17,17,17,0.55)",
                opacity: rip2.op,
              }}
            />
          ) : null}
        </div>

        {/* ---- cursor (topmost in world) ---- */}
        <div
          style={{
            position: "absolute",
            left: curX,
            top: curY,
            opacity: curOp,
            transform: `scale(${curScale})`,
            transformOrigin: "5px 2px",
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))",
          }}
        >
          <CursorGlyph />
        </div>
      </div>
    </AbsoluteFill>
  );
};
