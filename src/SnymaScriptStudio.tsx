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

// Snyma Creator Studio — idea → AI script → screenplay → production pipeline.
// One continuous world on white paper, dark UI cards, violet accent (Snyma's own).
export const DURATION_IN_FRAMES = 262;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#161226",
  muted: "#8B8594",
  violet: "#8B7CF0",
  violetDeep: "#6D5BD8",
  cardBg: "#0a0a10",
  cardEdge: "rgba(22,18,38,0.10)",
};

const IMG_W = 1974;
const IMG_H = 1724;

// -------------------------------------------------------------------------
// World layout (world coords; viewport 1080x1920)
// -------------------------------------------------------------------------
type CardDef = {
  src: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  x: number;
  y: number;
  w: number;
  enter: number | null; // frame the card springs in; null = present from 0
};

const CARDS: Record<string, CardDef> = {
  idea: {
    src: "snyma/snyma-04-your-idea-filled.png",
    sx: 545,
    sy: 110,
    sw: 1355,
    sh: 980,
    x: 240,
    y: 220,
    w: 1050,
    enter: null,
  },
  gen: {
    src: "snyma/snyma-07-ai-generating.png",
    sx: 610,
    sy: 745,
    sw: 1270,
    sh: 430,
    x: 1280,
    y: 1060,
    w: 900,
    enter: 44,
  },
  script: {
    src: "snyma/snyma-10-script-blocks.png",
    sx: 700,
    sy: 250, // animated: scrolls the screenplay page
    sw: 1090,
    sh: 900,
    x: 240,
    y: 1480,
    w: 1100,
    enter: 92,
  },
  scenes: {
    src: "snyma/snyma-13-scenes.png",
    sx: 590,
    sy: 505,
    sw: 1320,
    sh: 760,
    x: 1300,
    y: 1800,
    w: 920,
    enter: 150,
  },
  shots: {
    src: "snyma/snyma-14-shots.png",
    sx: 590,
    sy: 165,
    sw: 1320,
    sh: 950,
    x: 1300,
    y: 2440,
    w: 920,
    enter: 162,
  },
};

const cardH = (c: CardDef) => (c.w / c.sw) * c.sh;

// -------------------------------------------------------------------------
// Camera — hold → move → hold; dynamic punch-ins, wide settle
// -------------------------------------------------------------------------
const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 32, 50, 86, 104, 152, 178, 248, 261];
const KEY_FX = [765, 765, 1730, 1730, 775, 775, 1230, 1230, 1230];
const KEY_FY = [745, 760, 1195, 1195, 1900, 1900, 1672, 1672, 1672];
const KEY_Z = [1.06, 0.97, 1.12, 1.12, 1.02, 1.02, 0.48, 0.48, 0.48];

// Real Snyma S-mark (from snyma.com, recolored to ink)
const S_PATH =
  "M483.87,88.3c-2.1-11.36-10.45-21.54-22.47-24.99L257.56,4.88c-34.34-9.85-71.26-4.57-100.92,13.93l-87.13,54.34c-25.27,15.76-38.44,43.82-38.12,72.74.32,28.59,15.38,55.29,40.19,70.87,9.44,5.92,18.64,9.86,29.69,13.02l233.38,66.66c.95.27,2.67,2.59,2.79,3.53.09.71-1.01,2.86-1.73,3.31l-64.28,39.64c-7.58,4.67-17.47,1.15-25.28-1.09l-157.53-45.32c-12.5-3.6-24.62-1.71-35.26,5.01l-39.21,24.76c-10.5,6.63-16.21,17.8-13.47,30.16,3.44,15.57,15,24.95,30,29.23l197.68,56.34c33.48,9.54,70.86,9.58,101.15-9.22l93.47-57.98c35.85-22.24,51.24-67.41,34.68-106.43-10.32-24.32-31.77-41.45-57.43-48.78l-244.09-69.68c-2.75-.78.09-5.98,1.63-6.94l61.08-37.92c4.68-2.91,12.27-4.5,18.08-2.83l158.16,45.55c10.7,3.08,22.38,1.67,31.55-4.01l44.14-27.34c9.73-6.02,15.28-16.23,13.08-28.1ZM383.47,232.39c4.14.81,5.34,6.15,1.95,8.66l-24.43,18.1c-1.1.81-2.49,1.13-3.83.86l-256.3-50.41c-4.12-.81-5.34-6.13-1.97-8.65l24.15-18.09c1.1-.82,2.5-1.14,3.85-.88l256.58,50.4Z";

const SMark: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 484.35 448.28" style={{ width: size, display: "block" }}>
    <path d={S_PATH} fill={color} />
  </svg>
);

// -------------------------------------------------------------------------
// Cropped screenshot card
// -------------------------------------------------------------------------
const ShotCard: React.FC<{
  card: CardDef;
  frame: number;
  fps: number;
  scrollShift?: number; // extra source-y offset (script page scroll)
  children?: React.ReactNode;
}> = ({ card, frame, fps, scrollShift = 0, children }) => {
  const scale = card.w / card.sw;
  const h = cardH(card);

  let pop = 1;
  let rise = 0;
  let opacity = 1;
  if (card.enter !== null) {
    const s = spring({
      frame: frame - card.enter,
      fps,
      config: { damping: 24, stiffness: 130 },
    });
    pop = 0.94 + 0.06 * s;
    rise = 46 * (1 - s);
    opacity = interpolate(frame, [card.enter, card.enter + 9], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: card.x,
        top: card.y,
        width: card.w,
        height: h,
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardEdge}`,
        boxShadow:
          "0 34px 90px rgba(30,22,70,0.20), 0 8px 26px rgba(30,22,70,0.12)",
        transform: `translateY(${rise}px) scale(${pop})`,
        opacity,
      }}
    >
      <Img
        src={staticFile(card.src)}
        style={{
          position: "absolute",
          width: IMG_W * scale,
          height: IMG_H * scale,
          left: -card.sx * scale,
          top: -(card.sy + scrollShift) * scale,
        }}
      />
      {children}
    </div>
  );
};

// =========================================================================
// Main
// =========================================================================
export const SnymaScriptStudio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });

  // Idea card: violet sweep over the idea text during the opening hold
  const sweepY = interpolate(frame, [4, 30], [0.32, 0.86], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOpacity = interpolate(frame, [4, 10, 24, 32], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Generation card: pulsing violet ring during its hold
  const pulseT = ((frame - 52 + 24) % 24) / 24;
  const pulseActive = frame >= 52 && frame <= 90 ? 1 : 0;
  const pulseScale = 1 + pulseT * 0.09;
  const pulseOpacity = pulseActive * (1 - pulseT) * 0.45;

  // Script page scroll during its hold
  const scriptShift = interpolate(frame, [110, 148], [0, 440], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge entrance at the wide settle
  const badgeS = spring({
    frame: frame - 176,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  const gen = CARDS.gen;
  const genH = cardH(gen);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* IDEA — the script input */}
        <ShotCard card={CARDS.idea} frame={frame} fps={fps}>
          <div
            style={{
              position: "absolute",
              left: "6%",
              width: "88%",
              top: `${sweepY * 100}%`,
              height: 74,
              borderRadius: 14,
              background: `linear-gradient(90deg, rgba(139,124,240,0) 0%, rgba(139,124,240,0.26) 30%, rgba(139,124,240,0.26) 70%, rgba(139,124,240,0) 100%)`,
              opacity: sweepOpacity,
            }}
          />
        </ShotCard>

        {/* GENERATING — pulsing ring behind the progress card */}
        <div
          style={{
            position: "absolute",
            left: gen.x + gen.w / 2 - (gen.w * pulseScale) / 2,
            top: gen.y + genH / 2 - (genH * pulseScale) / 2,
            width: gen.w * pulseScale,
            height: genH * pulseScale,
            borderRadius: 34,
            border: `3px solid ${COLORS.violet}`,
            opacity: pulseOpacity,
          }}
        />
        <ShotCard card={CARDS.gen} frame={frame} fps={fps} />

        {/* SCRIPT — screenplay page scrolls during the hold */}
        <ShotCard
          card={CARDS.script}
          frame={frame}
          fps={fps}
          scrollShift={scriptShift}
        />

        {/* PIPELINE payoff */}
        <ShotCard card={CARDS.scenes} frame={frame} fps={fps} />
        <ShotCard card={CARDS.shots} frame={frame} fps={fps} />

        {/* SNYMA badge — top-right open paper */}
        <div
          style={{
            position: "absolute",
            left: 1420,
            top: 470,
            display: "flex",
            alignItems: "center",
            gap: 34,
            transform: `translateY(${30 * (1 - badgeS)}px) scale(${0.9 + 0.1 * badgeS})`,
            opacity: interpolate(frame, [176, 186], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <SMark size={120} color={COLORS.ink} />
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: COLORS.ink,
            }}
          >
            SNYMA
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
