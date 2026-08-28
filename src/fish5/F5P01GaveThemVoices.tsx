// Fish Audio 5 — F5P01GaveThemVoices (1080x1080, 195f) — series HOOK
// VO: I've had [the three advisors] as a board of advisors on my computer for
// months. Last week I gave them voices.
//
// One continuous Altari starfield world (fish4 board-world language). Camera
// opens tight on the operator orb already breathing, pulls back to reveal the
// three-seat board around a circular table ring (amber glint = Ahmed's
// presence, fish4 convention), then travels seat→seat as each voice ignites:
// speak-glow + accent flare + WaveBars bloom. Pull out, all three live, hold.
//
// ⚠️ Compliance: portraits only — no advisor names, no role labels, no
// narration text. Only on-screen string is the series-mandated VoicePill.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ADVISORS, AHMED_ORB, ALTARI } from "./theme";
import type { AdvisorKey } from "./board";
import { AltariBackdrop, PortraitOrb, VoicePill, WaveBars } from "./board";

export const DURATION_IN_FRAMES = 195;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// World layout (1080x1080 viewport; starfield bleeds ~90px past every edge)
// ---------------------------------------------------------------------------
const ORB_SIZE = 200;
const RING_CX = 540;
const RING_CY = 577;
const RING_R = 245; // orbs sit ON the ring — seats at the round table

const POS: Record<AdvisorKey, { x: number; y: number }> = {
  operator: { x: 540, y: 330 },
  editor: { x: 330, y: 700 },
  longgame: { x: 750, y: 700 },
};
// voice signature below each seat
const BAR_POS: Record<AdvisorKey, { x: number; y: number }> = {
  operator: { x: 540, y: 474 },
  editor: { x: 330, y: 844 },
  longgame: { x: 750, y: 844 },
};
const IGNITE: Record<AdvisorKey, number> = {
  operator: 72,
  editor: 102,
  longgame: 132,
};
const ORDER: AdvisorKey[] = ["operator", "editor", "longgame"];

// ---------------------------------------------------------------------------
// Deterministic starfield (sparse elegant constellation, fish4 reference)
// ---------------------------------------------------------------------------
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

type Star = {
  x: number;
  y: number;
  r: number;
  color: string;
  base: number;
  spd: number;
  ph: number;
  ringed: boolean;
};

const STARS: Star[] = (() => {
  const out: Star[] = [];
  for (let i = 0; i < 84; i++) {
    const c = rnd(i * 4 + 3);
    out.push({
      x: -90 + rnd(i * 4 + 1) * 1260,
      y: -90 + rnd(i * 4 + 2) * 1260,
      r: 1.6 + rnd(i * 4 + 4) * 2.8,
      color:
        c < 0.5
          ? "#EDE6D2"
          : c < 0.75
            ? "#FFFFFF"
            : c < 0.9
              ? ALTARI.body
              : ALTARI.primaryLight,
      base: 0.2 + rnd(i * 7 + 5) * 0.5,
      spd: 0.05 + rnd(i * 9 + 6) * 0.08,
      ph: rnd(i * 11 + 7) * Math.PI * 2,
      ringed: rnd(i * 13 + 8) > 0.9,
    });
  }
  return out;
})();

// faint constellation links between close star pairs
const LINKS: Array<[Star, Star]> = (() => {
  const out: Array<[Star, Star]> = [];
  for (let i = 0; i < STARS.length && out.length < 14; i++) {
    for (let j = i + 1; j < STARS.length; j++) {
      const a = STARS[i];
      const b = STARS[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 40 && d < 165 && rnd(i * 31 + j) > 0.55) {
        out.push([a, b]);
        break;
      }
    }
  }
  return out;
})();

// small accent-dot cluster scattered around each advisor's seat
type ClusterDot = { x: number; y: number; r: number };
const CLUSTERS: Record<AdvisorKey, ClusterDot[]> = (() => {
  const mk = (k: AdvisorKey, seed: number): ClusterDot[] => {
    const dots: ClusterDot[] = [];
    for (let i = 0; i < 9; i++) {
      const ang = rnd(seed + i * 5) * Math.PI * 2;
      const rad = 118 + rnd(seed + i * 5 + 1) * 78;
      dots.push({
        x: POS[k].x + Math.cos(ang) * rad,
        y: POS[k].y + Math.sin(ang) * rad,
        r: 1.8 + rnd(seed + i * 5 + 2) * 2.4,
      });
    }
    return dots;
  };
  return {
    operator: mk("operator", 601),
    editor: mk("editor", 907),
    longgame: mk("longgame", 1213),
  };
})();

const RING_CIRC = 2 * Math.PI * RING_R;

// ---------------------------------------------------------------------------
// Timeline
//   f0–28    tight on operator orb, breathing; slow zoom drift (2.12 → 2.03)
//   f28–52   pull back to the full board; seats 2+3 bloom in as revealed
//   f34–58   table ring draws in; amber center glint wakes (f42–58)
//   f58–72   camera pushes to operator      → f72  voice ignites (hold to 88)
//   f88–102  travel to editor seat          → f102 voice ignites (hold to 118)
//   f118–132 travel to longgame seat        → f132 voice ignites (hold to 150)
//   f150–168 pull out — all three live
//   f168–195 settle + hold (two near-identical final keys)
// ---------------------------------------------------------------------------
export const F5P01GaveThemVoices: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);
  const easeOut = Easing.out(Easing.cubic);

  // -- Camera rig (hold → move → hold) --------------------------------------
  const KEY_T = [0, 28, 52, 58, 72, 88, 102, 118, 132, 150, 168, 192, 195];
  const fx = interpolate(
    frame,
    KEY_T,
    [540, 540, 540, 540, 540, 540, 382, 382, 706, 706, 540, 540, 540],
    { easing: ease, ...clamp },
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [336, 336, 560, 560, 462, 462, 724, 724, 724, 724, 560, 560, 560],
    { easing: ease, ...clamp },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [2.12, 2.03, 1.04, 1.04, 1.21, 1.21, 1.23, 1.23, 1.23, 1.23, 1.06, 1.064, 1.064],
    { easing: ease, ...clamp },
  );

  // -- Per-advisor state ----------------------------------------------------
  const igniteOn = (t0: number) =>
    interpolate(frame, [t0, t0 + 12], [0, 1], { easing: easeOut, ...clamp });

  const enterFor = (k: AdvisorKey) =>
    k === "operator"
      ? 1
      : k === "editor"
        ? interpolate(frame, [30, 44], [0, 1], { easing: easeOut, ...clamp })
        : interpolate(frame, [36, 50], [0, 1], { easing: easeOut, ...clamp });

  // idle breathing before ignition; live wobble after
  const speakFor = (k: AdvisorKey, i: number) => {
    const t0 = IGNITE[k];
    const idle = 0.15 + 0.07 * Math.sin(frame * 0.1 + i * 2.3);
    const on = igniteOn(t0);
    const live = 0.76 + 0.16 * Math.sin((frame - t0) * 0.24 + i * 1.4);
    return Math.min(1, idle * (1 - on) + live * on);
  };

  // wave bloom: fast rise, then settle to a living simmer (stays on)
  const levelFor = (t0: number) =>
    interpolate(frame, [t0, t0 + 9, t0 + 30, t0 + 42], [0, 1, 0.98, 0.62], clamp);
  const barsOpacityFor = (t0: number) =>
    interpolate(frame, [t0 - 2, t0 + 6], [0, 1], clamp);

  // -- Table ring + amber center (Ahmed's presence) -------------------------
  const ringDraw = interpolate(frame, [34, 58], [0, 1], { easing: ease, ...clamp });
  const amberIn = interpolate(frame, [42, 58], [0, 1], { easing: easeOut, ...clamp });
  const amberPulse = 0.55 + 0.18 * Math.sin(frame * 0.09);

  // -- VoicePill (series-mandated attribution; screen space) ----------------
  // Enters as the camera lands on the second seat — the bottom band is clear
  // of orbs from here to the end (it collides during the operator push-in).
  const pillIn = interpolate(frame, [96, 110], [0, 1], { easing: easeOut, ...clamp });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={1080} height={1080} />

      {/* ------------------------- WORLD (camera) ------------------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <svg
          viewBox="0 0 1080 1080"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1080,
            overflow: "visible",
          }}
        >
          <defs>
            <radialGradient id="f5p1amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={AHMED_ORB.orbLite} stopOpacity="0.5" />
              <stop offset="45%" stopColor={AHMED_ORB.orb} stopOpacity="0.2" />
              <stop offset="100%" stopColor={AHMED_ORB.orb} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* constellation links */}
          {LINKS.map(([a, b], i) => (
            <line
              key={`l${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={ALTARI.body}
              strokeWidth={1}
              opacity={0.09 + 0.05 * Math.sin(frame * 0.06 + i * 1.9)}
            />
          ))}

          {/* twinkling stars */}
          {STARS.map((s, i) => {
            const o = s.base * (0.55 + 0.45 * Math.sin(frame * s.spd + s.ph));
            return (
              <g key={`s${i}`}>
                <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} opacity={o} />
                {s.ringed && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r + 7}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1}
                    opacity={o * 0.5}
                  />
                )}
              </g>
            );
          })}

          {/* accent clusters around each seat — brighten when the voice lands */}
          {ORDER.map((k, i) => {
            const on = igniteOn(IGNITE[k]);
            const entered = enterFor(k);
            return CLUSTERS[k].map((d, j) => {
              const tw =
                0.5 +
                0.5 * Math.sin(frame * (0.07 + (j % 4) * 0.03) + j * 1.7 + i * 3);
              return (
                <circle
                  key={`c-${k}-${j}`}
                  cx={d.x}
                  cy={d.y}
                  r={d.r}
                  fill={ADVISORS[k].accent}
                  opacity={entered * (0.2 + 0.35 * tw) * (0.55 + 0.45 * on)}
                />
              );
            });
          })}

          {/* table — soft disc, drawn ring, faint inner dashed ring */}
          <circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_R}
            fill="rgba(91,94,194,0.05)"
            opacity={ringDraw}
          />
          <circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_R}
            fill="none"
            stroke={ALTARI.primaryLight}
            strokeWidth={1.6}
            strokeDasharray={RING_CIRC}
            strokeDashoffset={RING_CIRC * (1 - ringDraw)}
            opacity={0.3}
            transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
          />
          <circle
            cx={RING_CX}
            cy={RING_CY}
            r={162}
            fill="none"
            stroke={ALTARI.primaryLight}
            strokeWidth={1}
            strokeDasharray="2 10"
            opacity={0.1 * ringDraw}
          />

          {/* amber glint at the table center — the room's host, resting */}
          <circle
            cx={RING_CX}
            cy={RING_CY}
            r={80}
            fill="url(#f5p1amber)"
            opacity={amberIn * amberPulse * 0.7}
          />
          <circle
            cx={RING_CX}
            cy={RING_CY}
            r={8}
            fill={AHMED_ORB.orbLite}
            opacity={amberIn * (0.6 + 0.2 * Math.sin(frame * 0.13))}
          />

          {/* breath ring around each not-yet-ignited seat */}
          {ORDER.map((k, i) => {
            const o = (1 - igniteOn(IGNITE[k])) * 0.22 * enterFor(k);
            if (o <= 0.01) return null;
            return (
              <circle
                key={`breath-${k}`}
                cx={POS[k].x}
                cy={POS[k].y}
                r={104 + 3 * Math.sin(frame * 0.11 + i * 2.1)}
                fill="none"
                stroke={ADVISORS[k].accent}
                strokeWidth={1.5}
                opacity={o}
              />
            );
          })}

          {/* ignition flare — one expanding accent ring per voice */}
          {ORDER.map((k) => {
            const t0 = IGNITE[k];
            if (frame < t0) return null;
            const u = interpolate(frame, [t0, t0 + 24], [0, 1], {
              easing: Easing.out(Easing.quad),
              ...clamp,
            });
            if (u >= 1) return null;
            return (
              <circle
                key={`flare-${k}`}
                cx={POS[k].x}
                cy={POS[k].y}
                r={104 + u * 72}
                fill="none"
                stroke={ADVISORS[k].accent}
                strokeWidth={2.2}
                opacity={(1 - u) * 0.6}
              />
            );
          })}
        </svg>

        {/* the board — portraits only (compliance) */}
        {ORDER.map((k, i) => (
          <PortraitOrb
            key={`orb-${k}`}
            advisor={k}
            x={POS[k].x}
            y={POS[k].y}
            size={ORB_SIZE}
            enter={enterFor(k)}
            speak={speakFor(k, i)}
          />
        ))}

        {/* voice signatures — WaveBars bloom under each seat at ignition */}
        {ORDER.map((k, i) => (
          <div
            key={`bars-${k}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              opacity: barsOpacityFor(IGNITE[k]),
            }}
          >
            <WaveBars
              frame={frame}
              x={BAR_POS[k].x}
              y={BAR_POS[k].y}
              w={190}
              h={64}
              bars={18}
              color={ADVISORS[k].accent}
              level={levelFor(IGNITE[k])}
              seed={i + 1}
            />
          </div>
        ))}
      </div>

      {/* --------------- SCREEN OVERLAY (mandated attribution) ------------ */}
      {pillIn > 0.01 && <VoicePill x={540} y={918} enter={pillIn} scale={0.92} />}
    </AbsoluteFill>
  );
};
