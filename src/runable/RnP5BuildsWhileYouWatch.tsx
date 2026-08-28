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
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  CAROUSEL_SLIDES,
  FONT_SANS,
  RN,
  SPRINGS,
  safePadX,
} from "./theme";

// ============================================================================
// RnP5BuildsWhileYouWatch — 1080x1920 @ 30fps  (9:16)
// VO [0:25]: "Step three: it builds while you watch. Research, copywriting,
//             design, every slide in your voice."
//
// One continuous Runable build surface in world coords, one keyframed camera.
//   run card   — streaming status ("Thinking..." → "Completed 3 steps"),
//                credits ticking, and three strand rows resolving in a wave.
//   canvas card— the 10-cell artifact grid Ahmed's REAL exported slides pour
//                into, one at a time, carried down by work packets.
// Ends on 8 of 10 landed + one in flight: deliberately NOT resolved.
//
// SKIN: Ahmed's Altari purple world. The ground, the 64px grid, the ambient
// glow and the work packets are ALTARI. The run card and the Canvas panel are
// REAL Runable product UI and stay in authentic cream/white + IDGrotesk —
// light panels floating on the purple. Only the success green crosses over
// (ALTARI.stampGreen), per the brand lock.
// ============================================================================

export const DURATION_IN_FRAMES = 140;

/* ----------------------------------------------------------------- skin --- */

// Alpha helper so every color still traces back to a theme token — no loose hex.
const withAlpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Deep purple ground with one high ambient bloom — the world the panels sit in.
const GROUND = `radial-gradient(128% 92% at 50% 30%, ${withAlpha(
  ALTARI.primary,
  0.34,
)} 0%, ${withAlpha(ALTARI.primaryDeep, 0.2)} 46%, ${withAlpha(
  ALTARI.bg,
  0,
)} 100%)`;

// 64x64 backdrop grid — always present, deliberately near the noise floor.
const GRID_LINE = withAlpha(ALTARI.primaryLight, 0.07);
const BACKDROP_GRID = `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`;

// 24x24 grid for Altari-owned cards (the work packets).
const PACKET_GRID_LINE = withAlpha(ALTARI.primaryLight, 0.16);
const PACKET_GRID = `linear-gradient(${PACKET_GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${PACKET_GRID_LINE} 1px, transparent 1px)`;

// Cream product panels on a dark ground: ambient purple bloom + rim light,
// replacing the warm drop shadow that only worked on the cream build.
const PANEL_GLOW = `0 34px 90px rgba(0, 0, 0, 0.42), 0 0 110px ${withAlpha(
  ALTARI.primary,
  0.3,
)}, 0 0 0 1px ${withAlpha(ALTARI.primaryLight, 0.2)}`;

const DONE = ALTARI.stampGreen;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 1600;
const WORLD_H = 2700;

// Everything shares ONE column width so no card can ever break the 5% margin,
// at any camera zoom.
const COL_X = 290;
const COL_W = 1020;

const RUN = { x: COL_X, y: 180, w: COL_W, h: 1292 }; // 180 → 1472
const PAD = 44;
const IN_X = RUN.x + PAD; // 334
const IN_W = RUN.w - PAD * 2; // 932

const BAR_X = IN_X + 228; // strand progress track
const BAR_W = IN_W - 228 - 28; // 676

const CANVAS = { x: COL_X, y: 1548, w: COL_W, h: 1065 }; // 1548 → 2613
const CPAD = 40;
const GRID_X = CANVAS.x + CPAD; // 330
const GRID_Y = 1708;
const CELL_W = 220;
const CELL_H = 275; // 4:5, matches the 1080x1350 exports
const CELL_G = 20;

// work packet chip that carries a strand's output down into a canvas cell
const PK_W = 96;
const PK_H = 120;

const CELLS = CAROUSEL_SLIDES.map((src, i) => ({
  src,
  x: GRID_X + (i % 4) * (CELL_W + CELL_G),
  y: GRID_Y + Math.floor(i / 4) * (CELL_H + CELL_G),
}));

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

// hold (streaming) | move | hold (strands resolve) | move | hold (slides pour)
// | move (pull back) | end hold
const KEY_T = [0, 20, 42, 68, 90, 106, 126, 139];
// Focal points are chosen so that at every HOLD the frame's top edge lands in a
// text-free gap of the surface — no UI text ever rests inside the top 10% band.
const KEY_FY = [950, 950, 1126, 1126, 1805, 1805, 1396, 1396];
const KEY_Z = [0.92, 0.92, 0.84, 0.84, 0.84, 0.84, 0.6, 0.6];
const FOCAL_X = COL_X + COL_W / 2; // 800

/* ------------------------------------------------------------- schedule --- */

const STRANDS = [
  { label: "Research", top: 528, p0: 0.58, done: 34 },
  { label: "Copywriting", top: 838, p0: 0.2, done: 58 },
  { label: "Design", top: 1148, p0: 0.04, done: 82 },
] as const;

const STATUS_SWAP = 84; // third strand finishes → "Completed 3 steps"

const FLIGHT = 16;
const LANDINGS = [58, 66, 74, 82, 92, 102, 112, 122];
const FLIGHTS: { cell: number; launch: number; land: number }[] = [
  ...LANDINGS.map((land, i) => ({ cell: i, launch: land - FLIGHT, land })),
  // ninth slide is still travelling when the clip ends — set stays unfinished
  { cell: 8, launch: 130, land: 146 },
];

/* ---------------------------------------------------------------- atoms --- */

const iv = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = ease,
): number =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: RN.card,
      border: `1.5px solid ${RN.border}`,
      borderRadius: 30,
      // Authentic Runable panel — keeps the product's own type stack.
      fontFamily: FONT_SANS,
      boxShadow: PANEL_GLOW,
    }}
  >
    {children}
  </div>
);

const Track: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  color: string;
  track?: string;
}> = ({ x, y, w, h, p, color, track = RN.hover }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: h / 2,
      backgroundColor: track,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${Math.max(0, Math.min(1, p)) * 100}%`,
        borderRadius: h / 2,
        backgroundColor: color,
      }}
    />
  </div>
);

const Spinner: React.FC<{ size: number; frame: number }> = ({ size, frame }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    style={{ transform: `rotate(${frame * 8}deg)` }}
  >
    <circle
      cx={28}
      cy={28}
      r={22}
      stroke={RN.amberSoft}
      strokeWidth={7}
      fill="none"
    />
    <circle
      cx={28}
      cy={28}
      r={22}
      stroke={RN.amber}
      strokeWidth={7}
      fill="none"
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="0.3 0.7"
    />
  </svg>
);

const CheckDisc: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 56 56">
    <circle cx={28} cy={28} r={27} fill={DONE} />
    <path
      d="M16 28.5 l8.5 8.5 L41 19"
      stroke="#FFFFFF"
      strokeWidth={5.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StrandGlyph: React.FC<{ kind: number; color: string }> = ({
  kind,
  color,
}) => {
  const common = {
    stroke: color,
    strokeWidth: 4,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={78} height={78} viewBox="0 0 48 48">
      {kind === 0 ? (
        <>
          <circle cx={20} cy={20} r={12} {...common} />
          <line x1={29} y1={29} x2={40} y2={40} {...common} />
        </>
      ) : null}
      {kind === 1 ? (
        <>
          <line x1={9} y1={14} x2={39} y2={14} {...common} />
          <line x1={9} y1={24} x2={33} y2={24} {...common} />
          <line x1={9} y1={34} x2={39} y2={34} {...common} />
        </>
      ) : null}
      {kind === 2 ? (
        <>
          <rect x={8} y={9} width={32} height={30} rx={5} {...common} />
          <line x1={8} y1={22} x2={40} y2={22} {...common} />
          <line x1={24} y1={22} x2={24} y2={39} {...common} />
        </>
      ) : null}
    </svg>
  );
};

/* ---------------------------------------------------------- composition --- */

export const RnP5BuildsWhileYouWatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  /* ---- camera (hard-clamped to the 5% side safe margin) ---- */
  const SAFE_X = safePadX(width); // 54 on 1080
  const Z_MAX = (width - SAFE_X * 2) / COL_W; // widest zoom that still fits

  const camOpt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpt);
  const z = Math.min(interpolate(frame, KEY_T, KEY_Z, camOpt), Z_MAX);
  const fx = FOCAL_X;

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS
      .snappy,
    dur = 26,
  ) =>
    frame < t0
      ? 0
      : spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  /* ---- run header ---- */
  const credits =
    46 + Math.floor(iv(frame, [0, 139], [0, 346], Easing.linear) / 4) * 4;
  const masterP = interpolate(
    frame,
    [0, 34, 58, 84, 139],
    [0.3, 0.44, 0.58, 0.74, 0.93],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const swapP = iv(frame, [STATUS_SWAP, STATUS_SWAP + 12], [0, 1]);
  const checkPop = spr(STATUS_SWAP, SPRINGS.bouncy, 22);

  /* ---- slides ---- */
  const landed = LANDINGS.filter((f) => frame >= f).length;
  const nextCell = landed; // the cell currently being filled

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ALTARI.bg,
        backgroundImage: GROUND,
        fontFamily: ALTARI_FONT.body,
      }}
    >
      {/* 64x64 world grid — always on, sits under every panel */}
      <AbsoluteFill
        style={{
          backgroundImage: BACKDROP_GRID,
          backgroundSize: `${ALTARI_GRID.backdrop}px ${ALTARI_GRID.backdrop}px`,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${
            height / 2 - fy
          }px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ======================= run card ======================= */}
        <Card x={RUN.x} y={RUN.y} w={RUN.w} h={RUN.h}>
          {/* --- model row + credits --- */}
          <div
            style={{
              position: "absolute",
              left: PAD,
              top: 44,
              width: IN_W,
              height: 64,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: 4,
                color: RN.muted,
              }}
            >
              AUTO
            </span>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                backgroundColor: RN.amberSoft,
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: RN.amber,
                  opacity: 0.55 + 0.45 * Math.sin(frame / 7),
                }}
              />
              <span style={{ fontSize: 34, fontWeight: 500, color: RN.muted }}>
                Credits used
              </span>
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  color: RN.textWarm,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {credits}
              </span>
            </div>
          </div>

          {/* --- streaming status (two-layer crossfade) --- */}
          <div
            style={{
              position: "absolute",
              left: PAD,
              top: 152,
              width: IN_W,
              height: 76,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                gap: 26,
                opacity: 1 - swapP,
              }}
            >
              <Spinner size={62} frame={frame} />
              <span style={{ fontSize: 58, fontWeight: 500, color: RN.muted }}>
                Thinking...
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                gap: 26,
                opacity: swapP,
              }}
            >
              <div style={{ transform: `scale(${0.5 + 0.5 * checkPop})` }}>
                <CheckDisc size={62} />
              </div>
              <span style={{ fontSize: 58, fontWeight: 700, color: RN.text }}>
                Completed 3 steps
              </span>
            </div>
          </div>

          {/* --- master progress --- */}
          <Track
            x={PAD}
            y={272}
            w={IN_W}
            h={16}
            p={masterP}
            color={RN.amber}
          />

          <div
            style={{
              position: "absolute",
              left: PAD,
              top: 320,
              width: IN_W,
              height: 1.5,
              backgroundColor: RN.border,
            }}
          />

          {/* --- three strands of labour --- */}
          {STRANDS.map((s, i) => {
            // linear: a real progress bar keeps moving instead of stalling at 99%
            const p = iv(frame, [0, s.done], [s.p0, 1], Easing.linear);
            const doneP = spr(s.done, SPRINGS.bouncy, 22);
            const isDone = frame >= s.done;
            const accent = isDone ? DONE : RN.amber;
            const top = s.top - RUN.y;
            const pulse = 0.5 + 0.5 * Math.sin(frame / 8 + i * 1.7);
            return (
              <div
                key={s.label}
                style={{
                  position: "absolute",
                  left: PAD,
                  top,
                  width: IN_W,
                  height: 280,
                  backgroundColor: RN.hover,
                  border: `1.5px solid ${
                    isDone ? withAlpha(DONE, 0.24) : RN.border
                  }`,
                  borderRadius: 22,
                }}
              >
                {/* icon tile */}
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    top: 60,
                    width: 160,
                    height: 160,
                    borderRadius: 26,
                    backgroundColor: isDone ? withAlpha(DONE, 0.1) : RN.card,
                    border: `1.5px solid ${
                      isDone ? withAlpha(DONE, 0.26) : RN.border
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <StrandGlyph kind={i} color={isDone ? DONE : RN.textWarm} />
                  {/* completion tick */}
                  {doneP > 0 ? (
                    <div
                      style={{
                        position: "absolute",
                        right: -18,
                        top: -18,
                        transform: `scale(${doneP})`,
                      }}
                    >
                      <CheckDisc size={58} />
                    </div>
                  ) : null}
                </div>

                {/* label */}
                <span
                  style={{
                    position: "absolute",
                    left: 228,
                    top: 62,
                    fontSize: 64,
                    fontWeight: 700,
                    color: RN.text,
                  }}
                >
                  {s.label}
                </span>

                {/* percent */}
                <span
                  style={{
                    position: "absolute",
                    right: 28,
                    top: 72,
                    fontSize: 52,
                    fontWeight: 600,
                    color: isDone ? DONE : RN.muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {isDone ? 100 : Math.min(99, Math.floor(p * 100))}%
                </span>

                {/* progress */}
                <Track
                  x={228}
                  y={188}
                  w={BAR_W}
                  h={16}
                  p={p}
                  color={accent}
                  track="rgba(0,0,0,0.07)"
                />

                {/* live head on the running bar */}
                {!isDone ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 228 + BAR_W * p - 20,
                      top: 188,
                      width: 40,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: RN.amber,
                      opacity: 0.25 + 0.5 * pulse,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </Card>

        {/* ======================= canvas card ======================= */}
        <Card x={CANVAS.x} y={CANVAS.y} w={CANVAS.w} h={CANVAS.h}>
          <div
            style={{
              position: "absolute",
              left: CPAD,
              top: 40,
              width: CANVAS.w - CPAD * 2,
              height: 92,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 58, fontWeight: 700, color: RN.text }}>
              Canvas
            </span>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                backgroundColor: RN.hover,
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: RN.amber,
                  opacity: 0.45 + 0.45 * Math.sin(frame / 6 + 1),
                }}
              />
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 600,
                  color: RN.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {landed} / 10
              </span>
            </div>
          </div>
        </Card>

        {/* ---- grid cells (drawn in world space, over the canvas card) ---- */}
        {CELLS.map((c, i) => {
          const land = LANDINGS[i];
          const has = land !== undefined && frame >= land;
          const pop = has ? spr(land, SPRINGS.bouncy, 22) : 0;
          const ring = has ? iv(frame, [land, land + 16], [1, 0]) : 0;
          const queued = i === nextCell;
          const qPulse = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame / 7));
          return (
            <div
              key={c.src}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                width: CELL_W,
                height: CELL_H,
              }}
            >
              {/* empty slot */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 14,
                  backgroundColor: RN.hover,
                  border: `2px solid ${
                    queued ? withAlpha(RN.amber, qPulse) : RN.border
                  }`,
                }}
              />
              {/* the real exported slide */}
              {pop > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `1.5px solid ${RN.borderStrong}`,
                    boxShadow: "0 4px 14px rgba(61,46,36,0.14)",
                    transform: `scale(${0.72 + 0.28 * pop})`,
                    opacity: Math.min(1, pop * 1.8),
                  }}
                >
                  <Img
                    src={staticFile(c.src)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : null}
              {/* landing ring */}
              {ring > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: -8,
                    top: -8,
                    right: -8,
                    bottom: -8,
                    borderRadius: 20,
                    border: `4px solid ${RN.amber}`,
                    opacity: ring * 0.85,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* ---- work packets: strand output → canvas cell ---- */}
        {FLIGHTS.map((f) => {
          if (frame < f.launch || frame >= f.land) return null;
          const t = iv(frame, [f.launch, f.launch + FLIGHT], [0, 1]);
          const s = STRANDS[f.cell % 3];
          const sx = BAR_X + BAR_W;
          const sy = s.top + 196;
          const cell = CELLS[f.cell];
          const tx = cell.x + CELL_W / 2;
          const ty = cell.y + CELL_H / 2;
          const cxp = Math.max(sx, tx) + 34;
          const cyp = (sy + ty) / 2 + 30;
          const u = 1 - t;
          const px = u * u * sx + 2 * u * t * cxp + t * t * tx;
          const py = u * u * sy + 2 * u * t * cyp + t * t * ty;
          const sc = 0.6 + 0.45 * t;
          const op = Math.min(1, t * 5) * (1 - Math.max(0, (t - 0.82) / 0.18));
          return (
            <div
              key={`f${f.cell}`}
              style={{
                position: "absolute",
                left: px,
                top: py,
                width: PK_W,
                height: PK_H,
                marginLeft: -PK_W / 2,
                marginTop: -PK_H / 2,
                transform: `scale(${sc})`,
                opacity: op,
                borderRadius: 10,
                backgroundColor: ALTARI.card,
                backgroundImage: PACKET_GRID,
                backgroundSize: `${ALTARI_GRID.card}px ${ALTARI_GRID.card}px`,
                border: `2.5px solid ${ALTARI.primaryLight}`,
                boxShadow: `0 8px 26px ${withAlpha(
                  ALTARI.primary,
                  0.55,
                )}, 0 0 0 7px ${withAlpha(ALTARI.primary, 0.12)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 16,
                  width: 60,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ALTARI.primaryLight,
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 32,
                  width: 40,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ALTARI.primaryLight,
                  opacity: 0.55,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  top: 52,
                  height: 50,
                  borderRadius: 6,
                  backgroundColor: withAlpha(ALTARI.primaryLight, 0.22),
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
