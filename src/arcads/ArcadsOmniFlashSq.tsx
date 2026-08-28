import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AR, FONT_SANS, SPRINGS } from "./theme";

// ArcadsOmniFlashSq — 1:1 insert for the VO beat:
//   "This is Omni Flash, Google's new video model, running inside Arcads."
// Zone A: the real Google G + an "Omni Flash" model chip assembling.
// Zone B: the chip flies into an Arcads model-picker (their real product
// pattern) under the real white arcads wordmark; a preview generates.
// Real logos only: logos/google.svg + arcads/wordmark-white.png.
export const ARCADS_OMNI_DURATION = 195;

const W = 1080;
const H = 1080;

const EASE = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- camera rig
// prettier-ignore
const KEY_T = [0, 30, 52, 76, 148, 168, 182, 195];
// prettier-ignore
const FXV = [540, 540, 540, 1840, 1840, 1780, 1780, 1780];
// prettier-ignore
const ZV = [1.15, 1.15, 1.15, 0.98, 1.03, 0.92, 0.925, 0.925];

// beats
const CHIP_IN = 12; // chip pops next to the G
const FLY_START = 60; // chip leaves zone A
const DOCK = 82; // chip lands in the model picker
const GEN_START = 96; // preview starts generating
const VIDEO_IN = 116; // footage arrives

const CARD_SHADOW = "0 24px 60px rgba(8,8,16,0.55)";

// panel geometry (zone B, world coords)
const PANEL = { x: 1460, y: 130, w: 760, h: 820 };
const PICKER = { x: 1500, y: 250, w: 680, h: 84 };
const SLOT = { cx: 1960, cy: PICKER.y + 42 };
const PREVIEW = { x: 1500, y: 372, w: 680, h: 470 };

// ------------------------------------------------------------- omni flash chip
const OmniChip: React.FC<{ scale: number; docked: boolean }> = ({ scale, docked }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      height: 68,
      padding: "0 24px 0 16px",
      borderRadius: 18,
      background: docked ? AR.bgAlt : AR.card,
      border: `1.5px solid ${docked ? `${AR.primaryLight}88` : AR.border}`,
      boxShadow: docked
        ? `0 10px 30px rgba(8,8,16,0.5), 0 0 26px ${AR.primary}44`
        : CARD_SHADOW,
      transform: `scale(${scale})`,
      whiteSpace: "nowrap",
    }}
  >
    <Img src={staticFile("logos/google.svg")} style={{ width: 38, height: 38 }} />
    <span
      style={{
        fontFamily: FONT_SANS,
        fontSize: 36,
        fontWeight: 700,
        letterSpacing: -0.4,
        color: AR.heading,
      }}
    >
      Omni Flash
    </span>
  </div>
);

// ------------------------------------------------------------------- Zone A
const ZoneAGoogle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gIn = spring({ frame, fps, config: SPRINGS.snappy });
  const float = 3 * Math.sin(frame * 0.06);

  // pulse rings around the G
  const ring = (start: number) => {
    const cycle = (frame - start) % 64;
    const s = interpolate(cycle, [0, 44], [1, 1.9], { ...clamp, easing: Easing.out(Easing.cubic) });
    const o = interpolate(cycle, [0, 8, 44], [0, 0.45, 0], clamp);
    return { s, o };
  };
  const r1 = ring(6);
  const r2 = ring(38);

  return (
    <>
      {/* glow */}
      <div
        style={{
          position: "absolute",
          left: 540 - 620,
          top: 470 - 620,
          width: 1240,
          height: 1240,
          background: `radial-gradient(circle at 50% 50%, ${AR.primaryDeep}66, rgba(0,0,0,0) 62%)`,
        }}
      />
      {/* pulse rings */}
      {[r1, r2].map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - 150,
            top: 430 - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: `2.5px solid ${AR.primaryLight}`,
            transform: `scale(${r.s})`,
            opacity: r.o,
          }}
        />
      ))}
      {/* the real G */}
      <div
        style={{
          position: "absolute",
          left: 540 - 120,
          top: 430 - 120 + float,
          width: 240,
          height: 240,
          transform: `scale(${0.4 + 0.6 * gIn})`,
          opacity: gIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -30,
            borderRadius: "50%",
            background: AR.card,
            border: `1.5px solid ${AR.border}`,
            boxShadow: CARD_SHADOW,
          }}
        />
        <Img
          src={staticFile("logos/google.svg")}
          style={{ position: "absolute", inset: 24, width: 192, height: 192 }}
        />
      </div>
    </>
  );
};

// ------------------------------------------------------- the flying chip layer
const FlyingChip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chipIn = spring({ frame: frame - CHIP_IN, fps, config: SPRINGS.bouncy });

  const t = interpolate(frame, [FLY_START, DOCK], [0, 1], { ...clamp, easing: EASE });
  const x = interpolate(t, [0, 1], [540, SLOT.cx]);
  // slight arc on the way over
  const y = interpolate(t, [0, 1], [726, SLOT.cy]) - 90 * Math.sin(Math.PI * t);
  const scale = interpolate(t, [0, 1], [1.25, 1]) * chipIn;

  const docked = frame >= DOCK;

  // dock snap ring
  const ringS = interpolate(frame, [DOCK, DOCK + 12], [0.95, 1.5], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringO = interpolate(frame, [DOCK - 1, DOCK, DOCK + 12], [0, 0.8, 0], clamp);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
      >
        <OmniChip scale={scale} docked={docked} />
      </div>
      {/* snap ring at the slot */}
      <div
        style={{
          position: "absolute",
          left: SLOT.cx - 160,
          top: SLOT.cy - 54,
          width: 320,
          height: 108,
          borderRadius: 26,
          border: `3px solid ${AR.primaryLight}`,
          transform: `scale(${ringS})`,
          opacity: ringO,
          zIndex: 19,
        }}
      />
    </>
  );
};

// ------------------------------------------------------------------- Zone B
const ZoneBArcads: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 56, fps, config: SPRINGS.smooth });

  const docked = frame >= DOCK;
  const bloom = interpolate(frame, [DOCK, DOCK + 10, DOCK + 40], [0, 0.55, 0.22], clamp);

  // generating shimmer → footage
  const shimmer = 0.7 + 0.3 * Math.sin(frame / 2.8);
  const genOn = frame >= GEN_START && frame < VIDEO_IN + 4;
  const vidOpacity = interpolate(frame, [VIDEO_IN, VIDEO_IN + 6], [0, 1], clamp);
  const vidScale = interpolate(
    spring({ frame: frame - VIDEO_IN, fps, config: SPRINGS.snappy }),
    [0, 1],
    [1.12, 1],
  );

  // generation progress under the preview
  const prog = interpolate(frame, [VIDEO_IN, 188], [0, 0.86], { ...clamp, easing: Easing.out(Easing.quad) });

  // chevron press on dock
  const chev = interpolate(frame, [DOCK, DOCK + 3, DOCK + 9], [0, 5, 0], clamp);

  return (
    <>
      {/* glow behind the panel */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x + PANEL.w / 2 - 720,
          top: PANEL.y + PANEL.h / 2 - 720,
          width: 1440,
          height: 1440,
          background: `radial-gradient(circle at 50% 50%, ${AR.primary}33, rgba(0,0,0,0) 62%)`,
          opacity: 0.5 + bloom,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 30,
          background: AR.card,
          border: `1.5px solid ${docked ? `${AR.primaryLight}55` : AR.border}`,
          boxShadow: docked ? `0 24px 60px rgba(8,8,16,0.55), 0 0 52px ${AR.primary}33` : CARD_SHADOW,
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 60}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(165,167,217,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,0.04) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* header — real arcads wordmark, white */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 40,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Img
            src={staticFile("arcads/wordmark-white.png")}
            style={{ height: 44, width: "auto", display: "block" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 44,
            top: 56,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: AR.onlineGreen,
            boxShadow: `0 0 12px ${AR.onlineGreen}`,
          }}
        />

        {/* model picker row (their real product pattern) */}
        <div
          style={{
            position: "absolute",
            left: PICKER.x - PANEL.x,
            top: PICKER.y - PANEL.y,
            width: PICKER.w,
            height: PICKER.h,
            borderRadius: 20,
            background: AR.deep,
            border: `1.5px solid ${docked ? `${AR.primaryLight}66` : AR.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 26px",
          }}
        >
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 30,
              fontWeight: 600,
              color: AR.body,
            }}
          >
            Model
          </span>
          {/* empty slot outline until the chip docks */}
          {!docked && (
            <div
              style={{
                position: "absolute",
                right: 70,
                top: 12,
                width: 300,
                height: 60,
                borderRadius: 16,
                border: `2px dashed ${AR.primaryLight}44`,
              }}
            />
          )}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke={AR.body}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", right: 24, top: 29, transform: `translateY(${chev}px)` }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* preview — generates after the model docks */}
        <div
          style={{
            position: "absolute",
            left: PREVIEW.x - PANEL.x,
            top: PREVIEW.y - PANEL.y,
            width: PREVIEW.w,
            height: PREVIEW.h,
            borderRadius: 22,
            background: "#0C0C16",
            border: `1px solid ${AR.border}`,
            overflow: "hidden",
          }}
        >
          {genOn && (
            <AbsoluteFill style={{ display: "grid", placeItems: "center", opacity: shimmer }}>
              <Img
                src={staticFile("logos/google.svg")}
                style={{ width: 74, height: 74, opacity: 0.55 + 0.45 * Math.sin(frame / 3.4) }}
              />
            </AbsoluteFill>
          )}
          {frame >= VIDEO_IN && (
            <Sequence from={VIDEO_IN} layout="none">
              <div style={{ position: "absolute", inset: 0, transform: `scale(${vidScale})`, opacity: vidOpacity }}>
                <OffthreadVideo
                  muted
                  src={staticFile("arcads/demo.mp4")}
                  trimBefore={210}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 40%",
                  }}
                />
              </div>
            </Sequence>
          )}
        </div>

        {/* generation progress */}
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 42,
            width: PANEL.w - 80,
            height: 6,
            borderRadius: 3,
            background: `${AR.border}`,
            opacity: interpolate(frame, [VIDEO_IN, VIDEO_IN + 8], [0.35, 1], clamp),
          }}
        >
          <div
            style={{
              width: `${prog * 100}%`,
              height: "100%",
              borderRadius: 3,
              background: AR.gradCTA,
              boxShadow: `0 0 12px ${AR.primary}AA`,
            }}
          />
        </div>
      </div>
    </>
  );
};

// --------------------------------------------------------------------- root
export const ArcadsOmniFlashSq: React.FC = () => {
  const frame = useCurrentFrame();

  const fx = interpolate(frame, KEY_T, FXV, { easing: EASE, ...clamp });
  const fy = 540;
  let z = interpolate(frame, KEY_T, ZV, { easing: EASE, ...clamp });
  z += interpolate(frame, [DOCK, DOCK + 2, DOCK + 11], [0, 0.014, 0], clamp);
  z += interpolate(frame, [VIDEO_IN, VIDEO_IN + 2, VIDEO_IN + 10], [0, 0.01, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: AR.bg, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Altari 64px grid across the world */}
        <div
          style={{
            position: "absolute",
            left: -700,
            top: -600,
            width: 3800,
            height: 2280,
            backgroundImage: `linear-gradient(rgba(165,167,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,0.045) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        <ZoneAGoogle />
        <ZoneBArcads />
        <FlyingChip />
      </div>
    </AbsoluteFill>
  );
};
