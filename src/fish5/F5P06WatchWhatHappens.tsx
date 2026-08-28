// Fish Audio 5 — F5P06WatchWhatHappens (1080x1080)
// VO: Watch what happens when I ask them something they disagree on.
// Beat: the board assembles around a table ring → an amber question orb
// descends and lands at center with a ripple through the starfield → the
// three accent rings pulse out of phase and thin arcs reach toward center
// but stop short, flickering → hold on the loaded room.
// Pure visual — no on-screen text (compliance + no narration echo).
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ADVISORS, AHMED_ORB, ALTARI } from "./theme";
import { AltariBackdrop, PortraitOrb, type AdvisorKey } from "./board";

export const DURATION_IN_FRAMES = 120;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// World geometry (1080x1080 world, camera pushes 1.0 → 1.10)
// ---------------------------------------------------------------------------
const CX = 540;
const CY = 562; // table center
const SEAT_R = 272; // advisor orbit radius around the table
const ORB_SIZE = 176; // portrait diameter
const TABLE_R = 225; // visible table ring radius
const LAND = 52; // frame the question orb touches down

const deg = (a: number) => (a * Math.PI) / 180;

// Deterministic pseudo-random (pure function of index → stable per frame)
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// -- Starfield ---------------------------------------------------------------
const STAR_HUES = [
  "#F4EDDC",
  "#F4EDDC",
  "#F4EDDC",
  "#FFFFFF",
  "#7B7DD6",
  "#7B7DD6",
  "#E8A25B",
];
const STARS = Array.from({ length: 116 }, (_, i) => ({
  x: -80 + rnd(i * 6 + 1) * 1240,
  y: -80 + rnd(i * 6 + 2) * 1240,
  r: 1.2 + rnd(i * 6 + 3) * 2.4,
  hue: STAR_HUES[Math.floor(rnd(i * 6 + 4) * STAR_HUES.length)],
  base: 0.16 + rnd(i * 6 + 5) * 0.42,
  amp: 0.14 + rnd(i * 6 + 6) * 0.26,
  spd: 0.055 + rnd(i * 6 + 7) * 0.09,
  ph: rnd(i * 6 + 8) * Math.PI * 2,
}));

// Small hollow ring-stars (fish4 board-world language)
const HOLLOWS = Array.from({ length: 7 }, (_, i) => ({
  x: -40 + rnd(i * 9 + 401) * 1160,
  y: -40 + rnd(i * 9 + 402) * 1160,
  r: 5 + rnd(i * 9 + 403) * 7,
  o: 0.2 + rnd(i * 9 + 404) * 0.3,
}));

// Faint constellation clusters away from the table (fish4 reference look)
const CONSTS: { pts: [number, number][] }[] = [
  { pts: [[118, 152], [192, 206], [158, 268], [242, 304]] },
  { pts: [[928, 118], [872, 176], [948, 232], [900, 292]] },
  { pts: [[142, 872], [214, 918], [186, 986], [264, 1006]] },
  { pts: [[938, 842], [886, 902], [956, 948]] },
];

// -- Seats -------------------------------------------------------------------
const SEATS: {
  key: AdvisorKey;
  angle: number; // degrees from table center (y-down)
  from: { x: number; y: number }; // off-frame start
  delay: number;
}[] = [
  { key: "operator", angle: -135, from: { x: -170, y: 370 }, delay: 0 },
  { key: "editor", angle: -45, from: { x: 1250, y: 370 }, delay: 6 },
  { key: "longgame", angle: 90, from: { x: 540, y: 1300 }, delay: 12 },
];

const seatPos = (angle: number) => ({
  x: CX + Math.cos(deg(angle)) * SEAT_R,
  y: CY + Math.sin(deg(angle)) * SEAT_R,
});

const SLIDE_SPRING = { damping: 17, stiffness: 130, mass: 1 };

export const F5P06WatchWhatHappens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // -- Camera: one continuous slow push, two nearly-identical final keys ----
  const KEY_T = [0, 30, 65, 105, 118, 120];
  const fx = 540;
  const fy = interpolate(frame, KEY_T, [556, 558, 560, 562, 562, 562], {
    easing: ease,
    ...clamp,
  });
  const z = interpolate(frame, KEY_T, [1.0, 1.022, 1.05, 1.092, 1.1, 1.1], {
    easing: ease,
    ...clamp,
  });

  // -- Star shimmer quickens during the tension beat ------------------------
  const shimmerExtra = interpolate(frame, [62, 120], [0, 70], {
    easing: Easing.inOut(Easing.quad),
    ...clamp,
  });
  const starPhase = frame + shimmerExtra;

  // -- Landing ripple through the starfield ---------------------------------
  const rippleR = frame >= LAND ? (frame - LAND) * 15 : -1;
  const rippleFade = interpolate(frame, [LAND, 96], [1, 0], clamp);

  // -- Table ring draw-in ---------------------------------------------------
  const ringIn = interpolate(frame, [6, 26], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const ringCirc = 2 * Math.PI * TABLE_R;

  // -- Tension envelope -----------------------------------------------------
  const tension = interpolate(frame, [65, 78], [0, 1], {
    easing: ease,
    ...clamp,
  });

  // -- Question orb descent -------------------------------------------------
  const orbY = interpolate(
    frame,
    [32, LAND, 58, 63],
    [-150, CY + 14, CY - 4, CY],
    { easing: ease, ...clamp },
  );
  const orbIn = interpolate(frame, [32, 40], [0, 1], clamp);
  const squashY = interpolate(frame, [48, 53, 60], [1, 0.88, 1], {
    easing: ease,
    ...clamp,
  });
  const squashX = interpolate(frame, [48, 53, 60], [1, 1.1, 1], {
    easing: ease,
    ...clamp,
  });
  const settled = frame >= LAND;
  const haloO =
    interpolate(frame, [32, 44, 50, 54, 64], [0, 0.3, 0.35, 0.72, 0.45], clamp) +
    (settled ? 0.05 * Math.sin((frame - LAND) * 0.17) : 0);
  const streakO = interpolate(frame, [34, 38, 48, 55], [0, 0.5, 0.5, 0], clamp);
  const flashO = interpolate(frame, [50, 54, 68], [0, 0.5, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

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
        {/* Layer 1 — starfield, constellations, table ring, ripples */}
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
            <radialGradient id="f5p6table" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5B5EC2" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#5B5EC2" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#5B5EC2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="f5p6flash" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={AHMED_ORB.orbLite} stopOpacity="0.6" />
              <stop offset="45%" stopColor={AHMED_ORB.orb} stopOpacity="0.24" />
              <stop offset="100%" stopColor={AHMED_ORB.orb} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* stars — twinkle quickens with shimmerExtra; ripple brightens them */}
          {STARS.map((s, i) => {
            const d = Math.hypot(s.x - CX, s.y - CY);
            const g =
              rippleR >= 0
                ? Math.exp(-((d - rippleR) ** 2) / (2 * 55 * 55)) * rippleFade
                : 0;
            const tw = s.amp * Math.sin(starPhase * s.spd + s.ph);
            const o = Math.max(0, Math.min(1, s.base + tw + g * 0.7));
            const push = g * 7;
            const ux = d > 1 ? (s.x - CX) / d : 0;
            const uy = d > 1 ? (s.y - CY) / d : 0;
            return (
              <circle
                key={`s${i}`}
                cx={s.x + ux * push}
                cy={s.y + uy * push}
                r={s.r * (1 + g * 0.5)}
                fill={s.hue}
                opacity={o}
              />
            );
          })}

          {/* hollow ring-stars */}
          {HOLLOWS.map((h, i) => (
            <circle
              key={`h${i}`}
              cx={h.x}
              cy={h.y}
              r={h.r}
              fill="none"
              stroke="#F4EDDC"
              strokeWidth={1.2}
              opacity={h.o * (0.7 + 0.3 * Math.sin(starPhase * 0.07 + i * 1.9))}
            />
          ))}

          {/* constellation clusters */}
          {CONSTS.map((c, ci) => (
            <g key={`c${ci}`} opacity={0.8}>
              {c.pts.slice(1).map((p, i) => (
                <line
                  key={`cl${i}`}
                  x1={c.pts[i][0]}
                  y1={c.pts[i][1]}
                  x2={p[0]}
                  y2={p[1]}
                  stroke="#F4EDDC"
                  strokeWidth={1}
                  opacity={0.14}
                />
              ))}
              {c.pts.map((p, i) => (
                <circle
                  key={`cd${i}`}
                  cx={p[0]}
                  cy={p[1]}
                  r={2 + rnd(ci * 17 + i * 5 + 601) * 1.8}
                  fill={i % 3 === 0 ? "#7B7DD6" : "#F4EDDC"}
                  opacity={
                    0.35 +
                    0.3 * Math.sin(starPhase * 0.08 + ci * 2.2 + i * 1.4)
                  }
                />
              ))}
            </g>
          ))}

          {/* table — soft glow disc + thin ring drawing in around */}
          <circle
            cx={CX}
            cy={CY}
            r={TABLE_R * 1.5}
            fill="url(#f5p6table)"
            opacity={ringIn}
          />
          <g transform={`rotate(-90 ${CX} ${CY})`}>
            <circle
              cx={CX}
              cy={CY}
              r={TABLE_R}
              fill="none"
              stroke="#7B7DD6"
              strokeWidth={2}
              strokeDasharray={ringCirc}
              strokeDashoffset={(1 - ringIn) * ringCirc}
              strokeLinecap="round"
              opacity={0.28}
            />
          </g>
          <circle
            cx={CX}
            cy={CY}
            r={TABLE_R - 18}
            fill="none"
            stroke="#7B7DD6"
            strokeWidth={1.2}
            strokeDasharray="3 12"
            opacity={0.12 * ringIn}
          />

          {/* landing flash + ripple rings */}
          {flashO > 0.01 && (
            <circle cx={CX} cy={CY} r={160} fill="url(#f5p6flash)" opacity={flashO} />
          )}
          {[LAND, LAND + 7].map((s, i) => {
            const u = interpolate(frame, [s, s + 30], [0, 1], {
              easing: Easing.out(Easing.quad),
              ...clamp,
            });
            if (frame < s || u >= 1) return null;
            return (
              <circle
                key={`rip${i}`}
                cx={CX}
                cy={CY}
                r={40 + u * 400}
                fill="none"
                stroke={AHMED_ORB.orb}
                strokeWidth={2 - u}
                opacity={(1 - u) * 0.4}
              />
            );
          })}
        </svg>

        {/* Layer 2 — the three advisors slide in to their seats */}
        {SEATS.map((seat, i) => {
          const target = seatPos(seat.angle);
          const prog = spring({
            frame: frame - seat.delay,
            fps,
            config: SLIDE_SPRING,
          });
          const x = seat.from.x + (target.x - seat.from.x) * prog;
          const y = seat.from.y + (target.y - seat.from.y) * prog;
          const enter = interpolate(prog, [0, 0.6], [0, 1], clamp);
          const speak =
            tension * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(frame * 0.24 + i * 2.3)));
          return (
            <PortraitOrb
              key={seat.key}
              advisor={seat.key}
              x={x}
              y={y}
              size={ORB_SIZE}
              enter={enter}
              speak={speak}
            />
          );
        })}

        {/* Layer 3 — tension: out-of-phase ring pulses + arcs that stop short */}
        {tension > 0.01 && (
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
            {SEATS.map((seat, i) => {
              const target = seatPos(seat.angle);
              const accent = ADVISORS[seat.key].accent;

              // out-of-phase pulse ring emanating from the seat
              const P = 30;
              const tLocal = frame - 66 - i * 10;
              const u = tLocal >= 0 ? (tLocal % P) / P : -1;
              const pulse =
                u >= 0 ? (
                  <circle
                    cx={target.x}
                    cy={target.y}
                    r={ORB_SIZE * 0.55 + u * 74}
                    fill="none"
                    stroke={accent}
                    strokeWidth={1.8}
                    opacity={(1 - u) * (1 - u) * 0.55 * tension}
                  />
                ) : null;

              // thin arc reaching toward center, stopping short + flickering
              const reach = interpolate(
                frame,
                [66 + i * 5, 82 + i * 5],
                [0, 1],
                { easing: ease, ...clamp },
              );
              const tremble = 5 * Math.sin(frame * 0.55 + i * 1.7) * reach;
              const endR = 178 - reach * (178 - 96) + tremble;
              const th = deg(seat.angle);
              const sx = CX + Math.cos(th) * 178;
              const sy = CY + Math.sin(th) * 178;
              const ex = CX + Math.cos(th) * endR;
              const ey = CY + Math.sin(th) * endR;
              const midR = (178 + endR) / 2;
              const bow = deg(seat.angle + 7);
              const mx = CX + Math.cos(bow) * midR;
              const my = CY + Math.sin(bow) * midR;
              const flick = Math.max(
                0.12,
                0.45 +
                  0.55 *
                    Math.sin(frame * 1.9 + i * 2.1) *
                    Math.sin(frame * 0.83 + i * 5.7),
              );
              const arcO = reach * flick * tension;
              return (
                <g key={`t${i}`}>
                  {pulse}
                  {arcO > 0.02 && (
                    <>
                      <path
                        d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                        fill="none"
                        stroke={accent}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={arcO * 0.9}
                      />
                      <circle cx={ex} cy={ey} r={7} fill={accent} opacity={arcO * 0.25} />
                      <circle cx={ex} cy={ey} r={3.5} fill={accent} opacity={arcO} />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Layer 4 — the amber question orb descends and lands */}
        {orbIn > 0.01 && (
          <>
            {/* descent streak */}
            {streakO > 0.01 && (
              <div
                style={{
                  position: "absolute",
                  left: CX - 4,
                  top: orbY - 170,
                  width: 8,
                  height: 150,
                  borderRadius: 4,
                  background: `linear-gradient(180deg, rgba(232,162,91,0) 0%, rgba(242,200,143,0.55) 100%)`,
                  opacity: streakO,
                }}
              />
            )}
            {/* halo */}
            <div
              style={{
                position: "absolute",
                left: CX - 110,
                top: orbY - 110,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(232,162,91,0.5) 0%, rgba(232,162,91,0.16) 45%, rgba(232,162,91,0) 70%)`,
                opacity: haloO,
              }}
            />
            {/* sphere (~70px) */}
            <div
              style={{
                position: "absolute",
                left: CX - 35,
                top: orbY - 35,
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: `radial-gradient(circle at 38% 32%, ${AHMED_ORB.orbLite} 0%, ${AHMED_ORB.orb} 58%, #B96F35 100%)`,
                boxShadow: `0 0 ${26 + haloO * 26}px rgba(232, 162, 91, 0.55)`,
                transform: `scale(${squashX}, ${squashY})`,
                opacity: orbIn,
              }}
            />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
