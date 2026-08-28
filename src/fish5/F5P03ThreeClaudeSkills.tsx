// Fish Audio 5 — F5P03ThreeClaudeSkills (1080x1920 @ 30fps, 315 frames)
// VO: "Here's what this was before. Three Claude skills, each one trained on
// decades of one guy's work. Every book, every podcast, every interview. And
// they read my knowledge base, so they know my numbers."
//
// One continuous vertical world (1080x2600); the camera travels DOWN.
//   f0-45    tight on the operator skill card — source rows tally in
//            (book spines / mic waveform / film frames), "SKILL.md" chip.
//   f45-68   pull out + travel: THREE skill cards stacked (operator /
//            editor / longgame), staggered entrances f54 / f68.
//   f110-132 travel down; cream knowledge-base card slides in below
//            ("Meridian & Co", $15,000 · proposal, MRR bar fragment).
//   f158-206 accent lines draw from the KB card UP the left rail into each
//            skill card's accent edge (staggered, card 3 first).
//   f200-224 pull out to the full system.
//   f224-286 pulses travel KB -> each card; accent edges glow on arrival.
//   f270-315 settle + hold (two nearly identical final keys, micro push-in).
//
// COMPLIANCE: portraits only — no advisor names anywhere. No narration echo:
// on-screen text is UI only ("SKILL.md", "KNOWLEDGE BASE", "MRR"), the theme
// number $15,000, and the invented client "Meridian & Co". No invented counts.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ADVISORS, ALTARI, NUMBERS } from "./theme";
import { AltariBackdrop, CreamCard, PortraitOrb } from "./board";
import type { AdvisorKey } from "./board";

const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["500", "600", "700"],
});
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"] });

export const DURATION_IN_FRAMES = 315;

const VIEW_W = 1080;
const VIEW_H = 1920;
const WORLD_H = 2600;

// ---- World geometry --------------------------------------------------------
const CARD_W = 780;
const CARD_H = 460;
const CARD_X = 150; // 150..930 — inside 5% margins at every hold zoom
const CARD_YS = [300, 830, 1360] as const; // operator / editor / longgame

const KB_X = 180;
const KB_Y = 1980;
const KB_W = 720;
const KB_H = 360;

const ease = Easing.inOut(Easing.cubic);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number, seed: number) => {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---- Connector paths (KB -> each skill card, up the left rail) ------------
// Sampled polylines: gives draw-on (dash) + point-at-length (pulses) without
// extra packages. Geometry is static — computed once at module scope.
type Pt = { x: number; y: number };
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

const buildConnector = (exitY: number, entryY: number, rail: number) => {
  const pts: Pt[] = [];
  const a0 = { x: KB_X, y: exitY };
  const a1 = { x: rail + 16, y: exitY };
  const a2 = { x: rail, y: exitY - 44 };
  const a3 = { x: rail, y: exitY - 112 };
  for (let i = 0; i <= 16; i++) pts.push(cubic(a0, a1, a2, a3, i / 16));
  const c0 = { x: rail, y: entryY + 112 };
  const c1 = { x: rail, y: entryY + 44 };
  const c2 = { x: rail + 16, y: entryY };
  const c3 = { x: CARD_X, y: entryY };
  pts.push(c0);
  for (let i = 1; i <= 16; i++) pts.push(cubic(c0, c1, c2, c3, i / 16));
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
    );
  }
  const d =
    "M " + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
  return { pts, cum, total: cum[cum.length - 1], d };
};

const pointAt = (c: ReturnType<typeof buildConnector>, dist: number): Pt => {
  const target = Math.max(0, Math.min(c.total, dist));
  for (let i = 1; i < c.cum.length; i++) {
    if (c.cum[i] >= target) {
      const seg = c.cum[i] - c.cum[i - 1];
      const t = seg === 0 ? 0 : (target - c.cum[i - 1]) / seg;
      return {
        x: c.pts[i - 1].x + (c.pts[i].x - c.pts[i - 1].x) * t,
        y: c.pts[i - 1].y + (c.pts[i].y - c.pts[i - 1].y) * t,
      };
    }
  }
  return c.pts[c.pts.length - 1];
};

// cardIdx maps to CARD_YS order (0 operator, 1 editor, 2 longgame).
const RAILS = [
  {
    advisor: "longgame" as AdvisorKey,
    cardIdx: 2,
    rail: 118,
    exitY: KB_Y + 66,
    drawAt: 158,
    pulseAt: 224,
    pulseDur: 20,
  },
  {
    advisor: "editor" as AdvisorKey,
    cardIdx: 1,
    rail: 95,
    exitY: KB_Y + 102,
    drawAt: 170,
    pulseAt: 234,
    pulseDur: 26,
  },
  {
    advisor: "operator" as AdvisorKey,
    cardIdx: 0,
    rail: 72,
    exitY: KB_Y + 138,
    drawAt: 182,
    pulseAt: 244,
    pulseDur: 32,
  },
].map((r) => ({
  ...r,
  path: buildConnector(r.exitY, CARD_YS[r.cardIdx] + 230, r.rail),
}));

// ---- Background star specks (world space, behind the cards) ---------------
const Stars: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {Array.from({ length: 26 }, (_, i) => {
      const x = 60 + rnd(i, 1) * 960;
      const y = 120 + rnd(i, 2) * 2320;
      const r = 1.6 + rnd(i, 3) * 2.6;
      const tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + i * 2.3);
      const cream = rnd(i, 4) > 0.5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            backgroundColor: cream ? ALTARI.cream : ALTARI.primaryLight,
            opacity: 0.1 + 0.24 * tw,
          }}
        />
      );
    })}
  </>
);

// ---- Source-row leading icons (pure geometry) ------------------------------
type RowKind = "books" | "mic" | "film";

const RowIcon: React.FC<{ kind: RowKind; color: string }> = ({
  kind,
  color,
}) => (
  <svg
    width={30}
    height={30}
    viewBox="0 0 30 30"
    style={{ position: "absolute", left: 34, top: 15 }}
  >
    {kind === "books" ? (
      <>
        <path
          d="M15 7 C12 4.5 7 4 4.5 5 L4.5 23.5 C7 22.5 12 23 15 25.5 C18 23 23 22.5 25.5 23.5 L25.5 5 C23 4 18 4.5 15 7 Z"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <line x1={15} y1={7} x2={15} y2={25.5} stroke={color} strokeWidth={2} />
      </>
    ) : kind === "mic" ? (
      <>
        <rect
          x={11.5}
          y={3.5}
          width={7}
          height={13}
          rx={3.5}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <path
          d="M7.5 12.5 v2 a7.5 7.5 0 0 0 15 0 v-2"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line x1={15} y1={22} x2={15} y2={26.5} stroke={color} strokeWidth={2} />
        <line
          x1={10.5}
          y1={26.5}
          x2={19.5}
          y2={26.5}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <rect
          x={3.5}
          y={6.5}
          width={23}
          height={17}
          rx={2}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <line x1={9} y1={6.5} x2={9} y2={23.5} stroke={color} strokeWidth={1.5} />
        <line
          x1={21}
          y1={6.5}
          x2={21}
          y2={23.5}
          stroke={color}
          strokeWidth={1.5}
        />
        {[10.5, 15, 19.5].map((yy) => (
          <React.Fragment key={yy}>
            <line x1={5} y1={yy} x2={7.5} y2={yy} stroke={color} strokeWidth={1.5} />
            <line
              x1={22.5}
              y1={yy}
              x2={25}
              y2={yy}
              stroke={color}
              strokeWidth={1.5}
            />
          </React.Fragment>
        ))}
      </>
    )}
  </svg>
);

// ---- A row of MANY tally-like source marks (no counts, no numbers) ---------
const MARKS_L = 96;
const MARKS_R = 744;

const SourceRow: React.FC<{
  kind: RowKind;
  rowY: number; // card-local center of the 60px row band
  frame: number;
  fillAt: number;
  accent: string;
  seed: number;
}> = ({ kind, rowY, frame, fillAt, accent, seed }) => {
  const span = MARKS_R - MARKS_L;
  const marks: React.ReactNode[] = [];

  if (kind === "books") {
    const n = 34;
    const pitch = span / n;
    for (let i = 0; i < n; i++) {
      const p = clamp01((frame - (fillAt + i * 0.55)) / 6);
      if (p <= 0) continue;
      const h = 26 + rnd(i, seed) * 18;
      const w = 8 + rnd(i, seed + 9) * 5;
      const isAccent = i % 7 === 2;
      marks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: MARKS_L + i * pitch,
            top: 52 - h,
            width: w,
            height: h,
            borderRadius: 2,
            backgroundColor: isAccent ? accent : ALTARI.body,
            opacity:
              p * (isAccent ? 0.85 : 0.34 + rnd(i, seed + 4) * 0.26),
            transform: `scaleY(${0.35 + 0.65 * p})`,
            transformOrigin: "50% 100%",
          }}
        />,
      );
    }
  } else if (kind === "mic") {
    const n = 46;
    const pitch = span / n;
    for (let i = 0; i < n; i++) {
      const p = clamp01((frame - (fillAt + i * 0.35)) / 5);
      if (p <= 0) continue;
      const wob = 1 + 0.07 * Math.sin(frame * 0.16 + i * 0.9) * p;
      const h =
        (9 +
          27 * Math.abs(Math.sin(i * 0.53 + seed * 2.1)) +
          rnd(i, seed + 2) * 7) *
        wob;
      const isAccent = i % 9 === 4;
      marks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: MARKS_L + i * pitch,
            top: 30 - h / 2,
            width: 5,
            height: h,
            borderRadius: 3,
            backgroundColor: isAccent ? accent : ALTARI.body,
            opacity: p * (isAccent ? 0.85 : 0.42 + rnd(i, seed + 5) * 0.2),
            transform: `scaleY(${0.3 + 0.7 * p})`,
          }}
        />,
      );
    }
  } else {
    const n = 19;
    const pitch = span / n;
    for (let i = 0; i < n; i++) {
      const p = clamp01((frame - (fillAt + i * 0.9)) / 6);
      if (p <= 0) continue;
      const isAccent = i % 6 === 3;
      const line = isAccent ? accent : ALTARI.body;
      marks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: MARKS_L + i * pitch,
            top: 21,
            width: 26,
            height: 18,
            borderRadius: 3,
            border: `1.5px solid ${line}`,
            opacity: p * (isAccent ? 0.8 : 0.38 + rnd(i, seed + 6) * 0.2),
            transform: `scale(${0.6 + 0.4 * p})`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 3,
              borderRadius: 1,
              backgroundColor: line,
              opacity: 0.22,
            }}
          />
        </div>,
      );
    }
  }

  const iconIn = clamp01((frame - (fillAt - 4)) / 7);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: rowY - 30,
        width: CARD_W,
        height: 60,
        opacity: 1,
      }}
    >
      <div style={{ opacity: iconIn * 0.75 }}>
        <RowIcon kind={kind} color={ALTARI.body} />
      </div>
      {marks}
    </div>
  );
};

// ---- One dark skill card ---------------------------------------------------
const SkillCard: React.FC<{
  advisor: AdvisorKey;
  top: number;
  enterAt: number; // <=0 means present at frame 0
  fillAt: number;
  frame: number;
  fps: number;
  glow: number; // 0..1 accent-edge glow (pulse arrival)
}> = ({ advisor, top, enterAt, fillAt, frame, fps, glow }) => {
  const a = ADVISORS[advisor];
  const enter =
    enterAt <= 0
      ? 1
      : spring({
          frame: frame - enterAt,
          fps,
          config: { damping: 16, stiffness: 130 },
        });
  if (enter < 0.005) return null;
  const chipIn = clamp01((frame - (enterAt <= 0 ? 4 : enterAt + 8)) / 8);
  const seed = enterAt <= 0 ? 3 : enterAt;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD_X,
        top,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 26,
        backgroundColor: ALTARI.card,
        border: `1px solid ${ALTARI.border}`,
        boxShadow: "0 24px 64px rgba(10,10,24,0.45)",
        opacity: Math.min(1, enter * 1.5),
        transform: `translateY(${(1 - enter) * 46}px)`,
      }}
    >
      {/* interior accent wash when the pulse lands */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          background: `linear-gradient(90deg, ${a.accentSoft} 0%, rgba(0,0,0,0) 44%)`,
          opacity: glow * 0.55,
        }}
      />
      {/* accent edge (glows on pulse arrival) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 22,
          width: 6,
          height: CARD_H - 44,
          borderRadius: 3,
          backgroundColor: a.accent,
          opacity: 0.55 + 0.45 * glow,
          boxShadow: `0 0 ${8 + 40 * glow}px ${a.accentSoft}, 0 0 ${18 * glow}px ${a.accent}`,
        }}
      />
      <PortraitOrb
        advisor={advisor}
        x={104}
        y={100}
        size={118}
        enter={1}
        speak={glow * 0.7}
      />
      {/* SKILL.md filename chip (UI text — allowed) */}
      <div
        style={{
          position: "absolute",
          right: 36,
          top: 62,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 16px",
          borderRadius: 10,
          backgroundColor: "rgba(20, 20, 42, 0.55)",
          border: `1px solid ${ALTARI.border}`,
          opacity: chipIn,
          transform: `translateY(${(1 - chipIn) * -8}px)`,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: a.accent,
          }}
        />
        <span
          style={{
            fontFamily: mono,
            fontWeight: 500,
            fontSize: 23,
            letterSpacing: 0.5,
            color: ALTARI.body,
          }}
        >
          SKILL.md
        </span>
      </div>
      {/* header divider */}
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 176,
          width: CARD_W - 72,
          height: 1,
          backgroundColor: "rgba(61, 61, 96, 0.6)",
        }}
      />
      {/* source rows — many small tally marks, no counts */}
      <SourceRow
        kind="books"
        rowY={232}
        frame={frame}
        fillAt={fillAt}
        accent={a.accent}
        seed={seed}
      />
      <SourceRow
        kind="mic"
        rowY={306}
        frame={frame}
        fillAt={fillAt + 10}
        accent={a.accent}
        seed={seed + 1}
      />
      <SourceRow
        kind="film"
        rowY={380}
        frame={frame}
        fillAt={fillAt + 18}
        accent={a.accent}
        seed={seed + 2}
      />
    </div>
  );
};

// ---- Composition -----------------------------------------------------------
export const F5P03ThreeClaudeSkills: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera — one shared keyframe timeline, hold -> move -> hold.
  const KEY_T = [0, 45, 68, 110, 132, 200, 224, 270, 315];
  const camOpt = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = 540;
  const fy = interpolate(
    frame,
    KEY_T,
    [500, 520, 1060, 1060, 1720, 1720, 1320, 1320, 1316],
    camOpt,
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.22, 1.22, 0.95, 0.95, 0.88, 0.88, 0.715, 0.715, 0.72],
    camOpt,
  );

  // Knowledge-base card entrance
  const kbIn = spring({
    frame: frame - 126,
    fps,
    config: { damping: 17, stiffness: 90 },
  });
  const kbStep = (at: number) => clamp01((frame - at) / 10);

  // Per-card glow from pulse arrivals
  const glows: number[] = [0, 0, 0];
  for (const r of RAILS) {
    const arrive = r.pulseAt + r.pulseDur;
    const g = clamp01((frame - arrive) / 10);
    glows[r.cardIdx] =
      g * (0.8 + 0.2 * Math.sin((frame - arrive) * 0.11));
  }

  const dotPulse = 0.65 + 0.35 * Math.sin(frame * 0.26);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Static full-frame backdrop — does NOT move with the camera */}
      <AltariBackdrop width={VIEW_W} height={VIEW_H} />

      {/* ---- Camera world ---- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: WORLD_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <Stars frame={frame} />

        <SkillCard
          advisor="operator"
          top={CARD_YS[0]}
          enterAt={0}
          fillAt={4}
          frame={frame}
          fps={fps}
          glow={glows[0]}
        />
        <SkillCard
          advisor="editor"
          top={CARD_YS[1]}
          enterAt={54}
          fillAt={64}
          frame={frame}
          fps={fps}
          glow={glows[1]}
        />
        <SkillCard
          advisor="longgame"
          top={CARD_YS[2]}
          enterAt={68}
          fillAt={78}
          frame={frame}
          fps={fps}
          glow={glows[2]}
        />

        {/* ---- Knowledge-base card (cream, fish4 editorial language) ---- */}
        <CreamCard
          x={KB_X}
          y={KB_Y + (1 - kbIn) * 70}
          w={KB_W}
          h={KB_H}
          enter={kbIn}
        >
          {/* UI label */}
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 34,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: kbStep(146),
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: ALTARI.primaryDeep,
                opacity: 0.7,
              }}
            />
            <span
              style={{
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 21,
                letterSpacing: 3,
                color: "rgba(31, 31, 51, 0.55)",
              }}
            >
              KNOWLEDGE BASE
            </span>
          </div>
          {/* client + proposal (real theme number, invented client) */}
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 92,
              fontFamily: manrope,
              fontWeight: 700,
              fontSize: 40,
              color: ALTARI.creamInk,
              opacity: kbStep(152),
              transform: `translateY(${(1 - kbStep(152)) * 10}px)`,
            }}
          >
            Meridian &amp; Co
          </div>
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 156,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid rgba(31, 31, 51, 0.18)",
              opacity: kbStep(158),
              transform: `translateY(${(1 - kbStep(158)) * 10}px)`,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                backgroundColor: ALTARI.red,
                opacity: 0.55 + 0.45 * dotPulse,
                boxShadow: `0 0 ${6 + dotPulse * 6}px rgba(232,93,93,0.5)`,
              }}
            />
            <span
              style={{
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 27,
                color: "rgba(31, 31, 51, 0.82)",
              }}
            >
              {NUMBERS.proposal} · proposal
            </span>
          </div>
          {/* MRR-style bar fragment */}
          {[44, 58, 52, 74, 90, 116].map((h, i) => {
            const p0 = kbStep(152 + i * 4);
            const p = p0 * (2 - p0);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 420 + i * 48,
                  top: 254 - h,
                  width: 34,
                  height: h,
                  borderRadius: 5,
                  backgroundColor:
                    i === 5 ? ALTARI.primaryDeep : "rgba(61, 44, 141, 0.4)",
                  opacity: p,
                  transform: `scaleY(${p})`,
                  transformOrigin: "50% 100%",
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 420,
              top: 254,
              width: 274,
              height: 2,
              backgroundColor: "rgba(31, 31, 51, 0.22)",
              opacity: kbStep(150),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 420,
              top: 266,
              fontFamily: mono,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: 2,
              color: "rgba(31, 31, 51, 0.5)",
              opacity: kbStep(160),
            }}
          >
            MRR
          </div>
        </CreamCard>

        {/* ---- Connectors: KB -> skill cards (draw up, then pulses) ---- */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${WORLD_H}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: VIEW_W,
            height: WORLD_H,
            overflow: "visible",
          }}
        >
          {RAILS.map((r) => {
            const a = ADVISORS[r.advisor];
            const draw = interpolate(
              frame,
              [r.drawAt, r.drawAt + 24],
              [0, 1],
              {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            if (draw <= 0) return null;
            const glow = glows[r.cardIdx];
            const entry = { x: CARD_X, y: CARD_YS[r.cardIdx] + 230 };

            // pulse traveling KB -> card
            const q = interpolate(
              frame,
              [r.pulseAt, r.pulseAt + r.pulseDur],
              [0, 1],
              {
                easing: Easing.inOut(Easing.quad),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            const pulseActive = frame >= r.pulseAt && q < 1;
            const pt = pulseActive ? pointAt(r.path, r.path.total * q) : null;

            // arrival ping ring at the card edge
            const arrive = r.pulseAt + r.pulseDur;
            const ringT = (frame - arrive) / 20;
            const ring = ringT >= 0 && ringT <= 1 ? ringT : null;

            return (
              <g key={r.advisor}>
                <path
                  d={r.path.d}
                  fill="none"
                  stroke={a.accent}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray={r.path.total}
                  strokeDashoffset={r.path.total * (1 - draw)}
                  opacity={0.55 + 0.3 * glow}
                />
                {/* KB exit node */}
                <circle
                  cx={KB_X}
                  cy={r.exitY}
                  r={5}
                  fill={a.accent}
                  opacity={0.85 * clamp01((frame - r.drawAt) / 6)}
                />
                {/* card entry node (lights on arrival) */}
                <circle
                  cx={entry.x}
                  cy={entry.y}
                  r={5.5}
                  fill={a.accent}
                  opacity={0.25 + 0.75 * glow}
                />
                {pt && (
                  <>
                    <circle cx={pt.x} cy={pt.y} r={14} fill={a.accent} opacity={0.28} />
                    <circle cx={pt.x} cy={pt.y} r={6.5} fill={a.accent} opacity={0.95} />
                  </>
                )}
                {ring !== null && (
                  <circle
                    cx={entry.x}
                    cy={entry.y}
                    r={10 + ring * 30}
                    fill="none"
                    stroke={a.accent}
                    strokeWidth={2.4}
                    opacity={0.8 * (1 - ring)}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Vignette (screen space — matches the fish4 grade) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(140% 130% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,10,24,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
