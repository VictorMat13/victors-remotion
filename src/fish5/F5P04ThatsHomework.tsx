// Fish Audio 5 — F5P04ThatsHomework (1080x1080, 195f)
// VO: The problem is I was reading three walls of text and calling it advice.
//     That's not a board meeting. That's homework.
//
// PAIN beat. Beat map (continues the fish4 Altari starfield/card system):
//   f0–36   tight on ONE tall chat-answer panel (operator) — greeked line bars
//           auto-scrolling upward relentlessly, PortraitOrb above the card.
//   f36–58  22f pull-back: THREE panels side by side (operator/editor/longgame),
//           each scrolling at its own speed, all taller than the frame.
//   f58–142 the grind: wide hold; thin scrollbar thumbs creep painfully slowly;
//           world desaturates subtly toward gray-purple via a saturation-blend
//           overlay (luminance untouched — grid + glow stay clearly visible).
//   f142–166 slow push-in toward the row while scrolling continues.
//   f166–194 unresolved end hold — two nearly identical final camera keys.
//
// COMPLIANCE: zero on-screen text. Greeked bars only — never readable words,
// no advisor names, no narration echo.

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ADVISORS, ALTARI } from "./theme";
import { AltariBackdrop, PortraitOrb, AdvisorKey } from "./board";

export const DURATION_IN_FRAMES = 195;

const W = 1080;
const H = 1080;

// ---------------------------------------------------------------------------
// Panel geometry — row spans world x 90 → 990 so the end push-in (z=1.07)
// still keeps every card inside the 5% side margins (x 54 → 1026 on screen).
// ---------------------------------------------------------------------------
const PANEL_W = 280;
const PANEL_GAP = 30;
const ROW_X = 90; // (1080 - (3*280 + 2*30)) / 2
const PANEL_TOP = 268;
const PANEL_H = 1132; // runs to world y 1400 — always taller than the frame
const PAD_X = 24;
const INNER_W = PANEL_W - PAD_X * 2;
const LINE_H = 13;
const LINE_PITCH = 25;
const PARA_GAP = 24;
const CONTENT_TOP = 30;
const ORB_Y = 215;
const ORB_SIZE = 92;

const PANELS: {
  advisor: AdvisorKey;
  x: number;
  seed: number;
  speed: number; // px scrolled per frame (upward)
  startOffset: number; // already mid-scroll at frame 0
}[] = [
  { advisor: "operator", x: ROW_X, seed: 3, speed: 1.55, startOffset: 132 },
  {
    advisor: "editor",
    x: ROW_X + PANEL_W + PANEL_GAP,
    seed: 7,
    speed: 1.12,
    startOffset: 74,
  },
  {
    advisor: "longgame",
    x: ROW_X + (PANEL_W + PANEL_GAP) * 2,
    seed: 11,
    speed: 1.34,
    startOffset: 101,
  },
];

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (pure function of seed — stable across frames).
// ---------------------------------------------------------------------------
const seededRand = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// Greeked text — abstract rounded line bars in paragraphs. Never readable.
// ---------------------------------------------------------------------------
type GreekLine = { y: number; w: number; alpha: number; accent: boolean };

const buildGreek = (seed: number) => {
  const lines: GreekLine[] = [];
  let y = 0;
  let i = 0;
  let para = 0;
  while (y < 3040) {
    const len = 3 + Math.floor(seededRand(seed * 91.7 + para * 17.3) * 5);
    for (let k = 0; k < len; k++) {
      const last = k === len - 1;
      const wr = seededRand(seed * 13.1 + i * 7.9);
      lines.push({
        y,
        w: last ? INNER_W * (0.3 + wr * 0.34) : INNER_W * (0.56 + wr * 0.44),
        alpha: 0.26 + seededRand(seed * 29.3 + i * 3.7) * 0.22,
        accent: seededRand(seed * 47.7 + i * 11.3) > 0.94,
      });
      y += LINE_PITCH;
      i++;
    }
    y += PARA_GAP;
    para++;
  }
  return { lines, height: y };
};

const GREEK = PANELS.map((p) => buildGreek(p.seed));

// ---------------------------------------------------------------------------
// Starfield dots (fish4 board-world continuity) — deterministic positions.
// ---------------------------------------------------------------------------
const STAR_COLORS = ["#8E90C8", "#D9D4C8", "#7B7DD6", "#F2C88F"];
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: 20 + seededRand(i * 12.9 + 1) * 1040,
  y: 50 + seededRand(i * 7.7 + 2) * 1310,
  r: 1.2 + seededRand(i * 3.3 + 3) * 2.2,
  c: STAR_COLORS[i % STAR_COLORS.length],
  base: 0.14 + seededRand(i * 5.1 + 4) * 0.26,
  sp: 0.05 + seededRand(i * 9.4 + 5) * 0.08,
  ph: seededRand(i * 4.2 + 6) * Math.PI * 2,
}));

const ease = Easing.inOut(Easing.cubic);

// ---------------------------------------------------------------------------
// One tall chat-answer panel: dark card, accent strip, greeked bars scrolling
// upward, thin scrollbar thumb creeping down (honest scroll fraction — slow).
// ---------------------------------------------------------------------------
const AnswerPanel: React.FC<{
  x: number;
  accent: string;
  offset: number;
  greek: { lines: GreekLine[]; height: number };
}> = ({ x, accent, offset, greek }) => {
  const scrollable = greek.height - (PANEL_H - CONTENT_TOP);
  const progress = Math.min(1, offset / scrollable);
  const trackTop = 64;
  const trackH = PANEL_H - 40 - trackTop;
  const thumbH = 120;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: PANEL_TOP,
        width: PANEL_W,
        height: PANEL_H,
        borderRadius: 24,
        backgroundColor: ALTARI.card,
        border: `1px solid ${ALTARI.border}`,
        boxShadow: "0 26px 70px rgba(0,0,0,0.38)",
        overflow: "hidden",
      }}
    >
      {/* greeked content column (culled to the visible window) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: CONTENT_TOP,
          width: PANEL_W,
          transform: `translateY(${-offset}px)`,
        }}
      >
        {greek.lines
          .filter((l) => l.y - offset > -60 && l.y - offset < PANEL_H)
          .map((l) => (
            <div
              key={l.y}
              style={{
                position: "absolute",
                left: PAD_X,
                top: l.y,
                width: l.w,
                height: LINE_H,
                borderRadius: LINE_H / 2,
                backgroundColor: l.accent
                  ? accent
                  : `rgba(165, 167, 217, ${l.alpha})`,
                opacity: l.accent ? 0.38 : 1,
              }}
            />
          ))}
      </div>

      {/* top fade — bars dissolve as they scroll out under the header */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 4,
          width: PANEL_W,
          height: 64,
          background: `linear-gradient(${ALTARI.card}, rgba(44,44,74,0))`,
        }}
      />

      {/* advisor accent strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PANEL_W,
          height: 4,
          backgroundColor: accent,
          opacity: 0.85,
        }}
      />

      {/* reading-progress scrollbar — creeps painfully slowly */}
      <div
        style={{
          position: "absolute",
          left: PANEL_W - 14,
          top: trackTop,
          width: 4,
          height: trackH,
          borderRadius: 2,
          backgroundColor: "rgba(110, 112, 168, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL_W - 14,
          top: trackTop + progress * (trackH - thumbH),
          width: 4,
          height: thumbH,
          borderRadius: 2,
          backgroundColor: "rgba(165, 167, 217, 0.5)",
        }}
      />
    </div>
  );
};

export const F5P04ThatsHomework: React.FC = () => {
  const frame = useCurrentFrame();

  // -------------------------------------------------------------------------
  // Camera — tight on panel 0 → 22f pull-back to the row → long grind hold →
  // 24f slow push-in → two nearly identical end keys.
  // -------------------------------------------------------------------------
  const KEY_T = [0, 36, 58, 142, 166, DURATION_IN_FRAMES - 1];
  const fx = interpolate(frame, KEY_T, [230, 230, 540, 540, 540, 540], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, [370, 370, 560, 560, 552, 550], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, [2.2, 2.2, 1, 1, 1.065, 1.07], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pain state — desaturate toward gray-purple during the grind. Saturation
  // blend leaves luminance untouched: grid + glow stay above black threshold.
  const desat = interpolate(frame, [70, 140], [0, 0.45], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Opaque Altari base + grid, full-frame f0 → last. Does not move. */}
      <AltariBackdrop width={W} height={H} />

      {/* Constant ambient glow — never dims, never moves. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          background:
            "radial-gradient(62% 58% at 50% 46%, rgba(91,94,194,0.16) 0%, rgba(91,94,194,0.05) 48%, rgba(26,26,46,0) 74%)",
        }}
      />

      {/* Camera world */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* starfield behind the panels */}
        <svg
          viewBox="0 0 1080 1400"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1400,
            overflow: "visible",
          }}
        >
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.c}
              opacity={s.base * (0.55 + 0.45 * Math.sin(frame * s.sp + s.ph))}
            />
          ))}
        </svg>

        {/* three walls of text */}
        {PANELS.map((p, i) => (
          <AnswerPanel
            key={p.advisor}
            x={p.x}
            accent={ADVISORS[p.advisor].accent}
            offset={p.startOffset + p.speed * frame}
            greek={GREEK[i]}
          />
        ))}

        {/* advisor orbs above their answers — faint breathing glow only */}
        {PANELS.map((p, i) => (
          <PortraitOrb
            key={`orb-${p.advisor}`}
            advisor={p.advisor}
            x={p.x + PANEL_W / 2}
            y={ORB_Y}
            size={ORB_SIZE}
            speak={0.1 + 0.08 * Math.sin(frame * 0.085 + i * 2.1)}
          />
        ))}
      </div>

      {/* pain state — gray-purple desaturation (luminance preserved) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          backgroundColor: "#9A9AB2",
          mixBlendMode: "saturation",
          opacity: desat,
        }}
      />
    </AbsoluteFill>
  );
};
