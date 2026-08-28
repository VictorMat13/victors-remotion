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
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRADIENT,
  ALTARI_GRID,
  CAROUSEL_SLIDES,
  RN,
  SPRINGS,
  safePadX,
} from "./theme";

loadManrope();

// ============================================================================
// RnP9OneAgent — 1080x1080 @ 30fps  (1:1)
// VO [0:45]: "So it's not just a design tool. We're talking the entire process,
//             research to finished design, in one agent."
//
// Idea, carried visually (nothing on screen restates the VO):
//   four separate stage surfaces sit apart, each already working on its own
//   → they travel in a staggered wave and stack into a single deck
//   → the deck compresses into ONE surface and an agent node resolves above it
//   → that same surface unfurls downward and becomes Ahmed's real finished slide
//   → calm end hold on one artefact (the editor cuts to the CTA out of this)
//
// One continuous world, one keyframed camera, no scene replacement anywhere:
// the surviving card is literally the same element from frame 26 to frame 139.
// Its TOP edge is pinned at ART_TOP from the moment it lands, so it grows
// downward and the agent node above it is never overlapped.
//
// SKIN: Ahmed's locked Altari language — deep purple ground (#1A1A2E), 64px
// backdrop grid / 24px card grid always present, ALTARI.card surfaces with
// ALTARI.border hairlines, lavender body type in Manrope, ambient purple glow
// instead of warm shadows. The ONE exception is Runable's submit node: it is
// genuine product UI and stays authentic black with its amber hairline ring.
// Timing, choreography, camera and duration are untouched.
// ============================================================================

export const DURATION_IN_FRAMES = 140;

/* ---------------------------------------------------------------- world --- */

const WORLD = 1600;

const CARD_W = 380;
const CARD_H = 280;
const DECK_S = 0.72;
const DECK_W = Math.round(CARD_W * DECK_S); // 274
const DECK_H = Math.round(CARD_H * DECK_S); // 202

const ART_W = 500; // 4:5 — same ratio as the real 1080x1350 slides
const ART_H = 625;
const FAN_DX = 46;

const ART_TOP = 568; // pinned top edge of the deck / artefact
const HUB = { x: 800, y: ART_TOP }; // top-centre anchor everything converges on
const NODE_Y = 462;
const NODE_R = 48;

/* --------------------------------------------------------- altari paint --- */
/* Alphas are derived from the locked tokens — no loose hex in this file. */

const rgba = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const LAV = (a: number) => rgba(ALTARI.body, a); // lavender ink
const PRI = (a: number) => rgba(ALTARI.primary, a); // accent / glow
const PRIL = (a: number) => rgba(ALTARI.primaryLight, a);

// Grid overlay is always on: 64px on the backdrop, 24px on card surfaces.
const gridPaint = (px: number, a: number) => ({
  backgroundImage: `linear-gradient(${LAV(a)} 1px, transparent 1px), linear-gradient(90deg, ${LAV(
    a,
  )} 1px, transparent 1px)`,
  backgroundSize: `${px}px ${px}px`,
});

// Soft ambient lift for a dark ground: a deep drop plus a purple bloom.
const ambient = (lift: number) =>
  `0 ${2 + 9 * lift}px ${12 + 26 * lift}px rgba(0,0,0,${0.26 + 0.16 * lift}), 0 0 ${
    26 + 34 * lift
  }px ${PRI(0.09 + 0.15 * lift)}`;

type Stage = {
  key: "research" | "copy" | "design" | "export";
  label: string;
  x: number; // card left
  y: number; // card top
  rot: number;
  t0: number;
  ox: number; // deck offset
  oy: number;
  drot: number; // deck rotation
  bow: number; // travel arc bulge
  phase: number; // idle float phase
};

const STAGES: Stage[] = [
  { key: "research", label: "Research", x: 268, y: 202, rot: -1.4, t0: 20, ox: -21, oy: -15, drot: -3.2, bow: 88, phase: 0.3 },
  { key: "copy", label: "Copy", x: 950, y: 172, rot: 1.2, t0: 27, ox: -7, oy: -5, drot: 1.8, bow: -80, phase: 1.9 },
  { key: "design", label: "Design", x: 248, y: 882, rot: 1.0, t0: 34, ox: 7, oy: 5, drot: -1.2, bow: -74, phase: 3.4 },
  { key: "export", label: "Export", x: 968, y: 862, rot: -1.1, t0: 41, ox: 21, oy: 15, drot: 2.6, bow: 92, phase: 5.0 },
];

/* -------------------------------------------------------------- timings --- */

const TRAVEL = 24;
const COMPRESS: [number, number] = [66, 80];
const UI_FADE: [number, number] = [68, 82]; // stage UI dissolves as four become one
const NODE_POP = 82;
const GROW_T0 = 98;
const GROW_DUR = 24;
const IMG_FADE: [number, number] = [92, 106];
const FAN_T0 = [102, 107];
const LINK_FADE: [number, number] = [106, 118];

/* ----------------------------------------------------------------- geom --- */

type Pt = { x: number; y: number };

const qBezier = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

const bowCtrl = (a: Pt, b: Pt, bow: number): Pt => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return {
    x: (a.x + b.x) / 2 + (-dy / len) * bow,
    y: (a.y + b.y) / 2 + (dx / len) * bow,
  };
};

/* ---------------------------------------------------------------- atoms --- */

const Bar: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  color?: string;
  radius?: number;
}> = ({ x, y, w, h = 9, color = LAV(0.17), radius = 5 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: Math.max(0, w),
      height: h,
      borderRadius: radius,
      backgroundColor: color,
    }}
  />
);

const IconChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 26,
      top: 24,
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: ALTARI.bgAlt,
      border: `1px solid ${ALTARI.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

const stroke = {
  stroke: ALTARI.body,
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const GLYPH: Record<Stage["key"], React.ReactNode> = {
  research: (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <circle cx={8.6} cy={8.6} r={5.4} {...stroke} />
      <path d="M12.7 12.7 L16.6 16.6" {...stroke} />
    </svg>
  ),
  copy: (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <path d="M4 5.5 H16 M4 10 H16 M4 14.5 H11" {...stroke} />
    </svg>
  ),
  design: (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <rect x={3.2} y={3.2} width={13.6} height={13.6} rx={3.2} {...stroke} />
      <path d="M3.2 12.4 L7.6 8.4 L12 12.4" {...stroke} />
      <circle cx={12.9} cy={7.1} r={1.5} {...stroke} />
    </svg>
  ),
  export: (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <path d="M10 12.6 V3.6 M6.6 7 L10 3.6 L13.4 7" {...stroke} />
      <path d="M3.6 12.8 V15.2 A1.2 1.2 0 0 0 4.8 16.4 H15.2 A1.2 1.2 0 0 0 16.4 15.2 V12.8" {...stroke} />
    </svg>
  ),
};

/* --------------------------------------------------- stage card interiors -- */
/* Each surface is quietly working from frame 0 — micro-motion, no narration. */

const StageInner: React.FC<{ kind: Stage["key"]; frame: number }> = ({ kind, frame }) => {
  if (kind === "research") {
    const scanY = 96 + 92 * (0.5 + 0.5 * Math.sin(frame / 17));
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: 22,
            top: scanY,
            width: 336,
            height: 46,
            borderRadius: 11,
            backgroundColor: PRI(0.24),
            border: `1px solid ${PRIL(0.5)}`,
            boxShadow: `0 0 22px ${PRI(0.2)}`,
          }}
        />
        {[0, 1, 2].map((i) => {
          const y = 100 + i * 46;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  top: y + 9,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  border: `1.6px solid ${LAV(0.3)}`,
                }}
              />
              <Bar x={58} y={y + 4} w={[214, 178, 232][i]} h={9} />
              <Bar x={58} y={y + 20} w={[126, 152, 108][i]} h={7} color={LAV(0.1)} />
            </React.Fragment>
          );
        })}
      </>
    );
  }

  if (kind === "copy") {
    const bases = [292, 246, 274, 168];
    const caretOn = Math.sin(frame / 4.6) > -0.2;
    const lastW = bases[3] * (0.34 + 0.66 * (0.5 + 0.5 * Math.sin(frame / 21)));
    return (
      <>
        {bases.map((b, i) => {
          const w = i === 3 ? lastW : b * (0.9 + 0.1 * (0.5 + 0.5 * Math.sin(frame / 25 + i)));
          return (
            <Bar
              key={i}
              x={30}
              y={100 + i * 34}
              w={w}
              h={11}
              color={i === 3 ? LAV(0.26) : LAV(0.17)}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 30 + lastW + 8,
            top: 198,
            width: 3,
            height: 22,
            borderRadius: 2,
            backgroundColor: ALTARI.primaryLight,
            opacity: caretOn ? 0.95 : 0.12,
          }}
        />
      </>
    );
  }

  if (kind === "design") {
    const swatch = [
      ALTARI.primary,
      ALTARI.primaryLight,
      ALTARI.primaryDeep,
      ALTARI.body,
      ALTARI.bgAlt,
    ];
    const sel = 0.5 + 0.5 * Math.sin(frame / 19);
    const selX = 168 + sel * 4 * 42;
    return (
      <>
        {/* mini 4:5 artboard — the shape the whole clip lands on */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 96,
            width: 96,
            height: 120,
            borderRadius: 10,
            backgroundColor: ALTARI.bgAlt,
            border: `1px solid ${ALTARI.border}`,
          }}
        />
        <Bar x={44} y={116} w={68} h={8} color={LAV(0.26)} />
        <Bar x={44} y={132} w={48} h={7} />
        <Bar x={44} y={186} w={58} h={7} color={LAV(0.11)} />
        {swatch.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 168 + i * 42,
              top: 122,
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: c,
              border: `1px solid ${ALTARI.border}`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: selX - 5,
            top: 117,
            width: 40,
            height: 40,
            borderRadius: 13,
            border: `2px solid ${ALTARI.primaryLight}`,
            boxShadow: `0 0 16px ${PRI(0.28)}`,
          }}
        />
        <Bar x={168} y={182} w={162} h={8} />
        <Bar x={168} y={200} w={112} h={8} color={LAV(0.1)} />
      </>
    );
  }

  // export
  const prog = 0.22 + 0.73 * (0.5 + 0.5 * Math.sin(frame / 18));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: 96,
          width: 88,
          height: 110,
          borderRadius: 10,
          backgroundColor: ALTARI.bgAlt,
          border: `1px solid ${ALTARI.border}`,
          boxShadow: `0 3px 12px rgba(0,0,0,0.3)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 108,
          width: 88,
          height: 110,
          borderRadius: 10,
          backgroundColor: ALTARI.bgAlt,
          border: `1px solid ${ALTARI.border}`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.34), 0 0 20px ${PRI(0.12)}`,
        }}
      />
      <Bar x={58} y={126} w={58} h={8} color={LAV(0.26)} />
      <Bar x={58} y={142} w={40} h={7} />
      <Bar x={160} y={128} w={172} h={10} />
      <Bar x={160} y={148} w={122} h={8} color={LAV(0.1)} />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 190,
          width: 176,
          height: 6,
          borderRadius: 3,
          backgroundColor: LAV(0.12),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 190,
          width: 176 * prog,
          height: 6,
          borderRadius: 3,
          backgroundColor: ALTARI.primaryLight,
          boxShadow: `0 0 14px ${PRI(0.36)}`,
        }}
      />
    </>
  );
};

/* ---------------------------------------------------------- composition --- */

export const RnP9OneAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const ease = Easing.inOut(Easing.cubic);
  const opt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const lin = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  /* ---- the 5% side safe margin sets the zoom, rather than magic numbers --- */
  const PAD = safePadX(width); // 54 on 1080
  const HALF_INNER = (width - PAD * 2) / 2; // 486
  const OPEN_HALF = 552; // widest half-extent of the four parked cards
  const END_HALF = ART_W / 2 + FAN_DX + 24; // fanned artefact half-extent
  const Z_OPEN = Math.min(0.84, HALF_INNER / OPEN_HALF);
  const Z_END = Math.min(1.06, HALF_INNER / END_HALF);

  /* ---- camera: drift → hold → move → hold → move → end hold -------------- */
  const KEY_T = [0, 30, 46, 66, 82, 92, 116, DURATION_IN_FRAMES - 1];
  const KEY_FX = [788, 794, 800, 800, 800, 800, 800, 800];
  const KEY_FY = [667, 672, 678, 678, 584, 584, 796, 796];
  const KEY_Z = [
    Z_OPEN,
    Z_OPEN + 0.004,
    Z_OPEN + 0.008,
    Z_OPEN + 0.008,
    1.45,
    1.45,
    Z_END,
    Z_END,
  ];

  const fx = interpolate(frame, KEY_T, KEY_FX, opt);
  const fy = interpolate(frame, KEY_T, KEY_FY, opt);
  const z = interpolate(frame, KEY_T, KEY_Z, opt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 26,
  ) => (frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur }));

  /* ------------------------------- deck compression ----------------------- */
  const comp = interpolate(frame, COMPRESS, [0, 1], opt);

  // The stage UI stays live through the whole travel — the surfaces are still
  // working while they converge — and only dissolves once they are one.
  const uiFade = interpolate(frame, UI_FADE, [1, 0], opt);

  /* ------------------------------ stage card poses ------------------------ */
  const poses = STAGES.map((s) => {
    const start: Pt = { x: s.x + CARD_W / 2, y: s.y }; // top-centre anchor
    const landed: Pt = { x: HUB.x + s.ox, y: HUB.y + s.oy };
    const target: Pt = { x: HUB.x + s.ox * (1 - comp), y: HUB.y + s.oy * (1 - comp) };
    const p = interpolate(frame, [s.t0, s.t0 + TRAVEL], [0, 1], opt);
    const ctrl = bowCtrl(start, landed, s.bow);
    const pos = qBezier(start, ctrl, target, p);
    const idle = 3.4 * Math.sin(frame / 19 + s.phase) * (1 - p);
    const w = interpolate(p, [0, 1], [CARD_W, DECK_W], lin);
    const h = interpolate(p, [0, 1], [CARD_H, DECK_H], lin);
    const rot = interpolate(p, [0, 1], [s.rot, s.drot], lin) * (1 - comp);
    const lift = Math.sin(Math.PI * p);
    return { pos: { x: pos.x, y: pos.y + idle }, start, ctrl, p, w, h, rot, lift };
  });

  /* ------------- the surviving surface unfurls into the artefact ---------- */
  const grow = spr(GROW_T0, SPRINGS.smooth, GROW_DUR);
  const artW = interpolate(grow, [0, 1], [DECK_W, ART_W], lin);
  const artH = interpolate(grow, [0, 1], [DECK_H, ART_H], lin);
  const imgOp = interpolate(frame, IMG_FADE, [0, 1], opt);
  const deckFade = interpolate(frame, [80, 92], [1, 0], opt); // bottom three retire

  // The beat where the four have become one and the slide has not arrived yet:
  // on the purple world that surface must never read white. It holds a soft
  // Altari CTA wash instead, then hands off under the real slide.
  const collapseWash = interpolate(frame, [78, 86, 100, 112], [0, 1, 1, 0], opt);

  /* --------------------------------- agent node --------------------------- */
  const pop = spr(NODE_POP, SPRINGS.bouncy, 18);
  const ringBreath = 0.5 + 0.5 * Math.sin(frame / 22);
  const settled = interpolate(frame, [110, 126], [0, 1], opt);

  /* ------------------------------ fanned siblings ------------------------- */
  const fan = FAN_T0.map((t) => spr(t, SPRINGS.smooth, 16));
  const linkOp = interpolate(frame, LINK_FADE, [0, 1], opt);

  const slideCard = (
    src: string,
    dx: number,
    rot: number,
    p: number,
    key: string,
  ): React.ReactNode => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: HUB.x - ART_W / 2 + dx * p,
        top: ART_TOP,
        width: ART_W,
        height: ART_H,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: ALTARI.card,
        border: `1px solid ${ALTARI.border}`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.34), 0 0 40px ${PRI(0.14)}`,
        transform: `rotate(${rot * p}deg) scale(${0.86 + 0.05 * p})`,
        transformOrigin: "50% 20%",
        opacity: p,
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* deep purple ambient wash — background only; the opaque base is painted */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(118% 92% at 50% 44%, ${rgba(
            ALTARI.primaryDeep,
            0.42,
          )} 0%, ${rgba(ALTARI.bg, 0)} 66%)`,
        }}
      />

      {/* 64x64 backdrop grid — always present, low contrast */}
      <AbsoluteFill style={gridPaint(ALTARI_GRID.backdrop, 0.05)} />

      <div
        style={{
          position: "absolute",
          width: WORLD,
          height: WORLD,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------- travel trails: visible only while a card is moving ---------- */}
        <svg
          width={WORLD}
          height={WORLD}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {poses.map((pz, i) => {
            const a = Math.sin(Math.PI * pz.p);
            if (a <= 0.01) return null;
            return (
              <path
                key={i}
                d={`M ${pz.start.x} ${pz.start.y} Q ${pz.ctrl.x} ${pz.ctrl.y} ${HUB.x} ${HUB.y}`}
                stroke={LAV(0.34)}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="2 13"
                fill="none"
                opacity={0.6 * a}
              />
            );
          })}
        </svg>

        {/* ---------- convergence bloom ---------- */}
        <div
          style={{
            position: "absolute",
            left: HUB.x - 380,
            top: HUB.y + 100 - 380,
            width: 760,
            height: 760,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${PRI(
              0.2 * interpolate(frame, [34, 70, 104, 120], [0, 1, 1, 0.26], opt),
            )} 0%, ${PRI(0)} 66%)`,
          }}
        />

        {/* ---------- the finished carousel, fanned behind the hero ---------- */}
        {slideCard(CAROUSEL_SLIDES[2], FAN_DX, 2.4, fan[1], "fan-b")}
        {slideCard(CAROUSEL_SLIDES[1], -FAN_DX, -2.1, fan[0], "fan-a")}

        {/* ---------- four stage surfaces → one deck → the artefact ---------- */}
        {STAGES.map((s, i) => {
          const pz = poses[i];
          const isHero = i === STAGES.length - 1;
          const w = isHero ? Math.max(pz.w, artW) : pz.w;
          const h = isHero ? Math.max(pz.h, artH) : pz.h;
          const op = isHero ? 1 : deckFade;
          if (op <= 0.001) return null;
          const sc = pz.w / CARD_W;
          return (
            <div
              key={s.key}
              style={{
                position: "absolute",
                left: pz.pos.x - w / 2,
                top: pz.pos.y,
                width: w,
                height: h,
                borderRadius: interpolate(grow, [0, 1], [18, 20], lin),
                backgroundColor: ALTARI.card,
                border: `1px solid ${ALTARI.border}`,
                boxShadow: ambient(pz.lift),
                transform: `rotate(${pz.rot}deg)`,
                transformOrigin: "50% 30%",
                opacity: op,
                overflow: "hidden",
              }}
            >
              {/* 24x24 card grid — always present on an Altari surface */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  ...gridPaint(ALTARI_GRID.card, 0.045),
                }}
              />

              {/* the collapse beat: an Altari surface, never a white flash */}
              {isHero && collapseWash > 0.002 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: ALTARI_GRADIENT.cta,
                    opacity: 0.5 * collapseWash,
                  }}
                />
              ) : null}

              {/* the real finished slide, revealed inside the surviving surface */}
              {isHero && imgOp > 0.001 ? (
                <Img
                  src={staticFile(CAROUSEL_SLIDES[0])}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: imgOp,
                  }}
                />
              ) : null}

              {/* stage UI, laid out at full card size then scaled with the card */}
              {uiFade > 0.004 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: CARD_W,
                    height: CARD_H,
                    transform: `scale(${sc})`,
                    transformOrigin: "0 0",
                    opacity: uiFade,
                  }}
                >
                  <IconChip>{GLYPH[s.key]}</IconChip>
                  <div
                    style={{
                      position: "absolute",
                      left: 76,
                      top: 30,
                      fontFamily: ALTARI_FONT.body,
                      fontSize: 27,
                      fontWeight: 600,
                      color: ALTARI.body,
                      letterSpacing: 0.1,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 26,
                      top: 78,
                      width: CARD_W - 52,
                      height: 1,
                      backgroundColor: ALTARI.border,
                    }}
                  />
                  <StageInner kind={s.key} frame={frame} />
                </div>
              ) : null}
            </div>
          );
        })}

        {/* ---------- hairline link: agent → artefact ---------- */}
        {linkOp > 0.004 ? (
          <svg
            width={WORLD}
            height={WORLD}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <path
              d={`M ${HUB.x} ${NODE_Y + NODE_R + 14} L ${HUB.x} ${ART_TOP - 12}`}
              stroke={LAV(0.3)}
              strokeWidth={2}
              strokeDasharray="2 9"
              strokeLinecap="round"
              fill="none"
              opacity={linkOp}
            />
          </svg>
        ) : null}

        {/* ---------- the one agent (Runable's own submit node) ----------
            PRODUCT UI — deliberately NOT re-skinned. This is the genuine
            Runable black submit node with its amber hairline ring, floating
            on the Altari world. Keep it authentic. */}
        {pop > 0.001 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: HUB.x - (NODE_R + 15),
                top: NODE_Y - (NODE_R + 15),
                width: (NODE_R + 15) * 2,
                height: (NODE_R + 15) * 2,
                borderRadius: "50%",
                border: `1.5px solid ${rgba(
                  RN.amber,
                  0.3 + 0.34 * pop * (0.55 + 0.45 * ringBreath * settled),
                )}`,
                opacity: pop,
                transform: `scale(${0.84 + 0.16 * pop})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: HUB.x - NODE_R,
                top: NODE_Y - NODE_R,
                width: NODE_R * 2,
                height: NODE_R * 2,
                borderRadius: "50%",
                backgroundColor: RN.ink,
                boxShadow: `0 8px 26px rgba(0,0,0,0.45), 0 0 ${
                  18 + 12 * ringBreath * settled
                }px ${rgba(RN.amber, 0.16 + 0.16 * settled)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: pop,
                transform: `scale(${0.7 + 0.3 * pop})`,
              }}
            >
              <svg width={40} height={40} viewBox="0 0 32 32">
                <path
                  d="M7 16 H24 M17.5 9.5 L24 16 L17.5 22.5"
                  stroke="#FFFFFF"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
