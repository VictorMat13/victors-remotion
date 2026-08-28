import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

export const DURATION_IN_FRAMES = 270;

// ---------------------------------------------------------------------------
// World layout — flat 1080x1080 world; the camera zooms in and travels.
// Everything fits inside the 5% safe margin (54px) at z=1 for the end pull-out.
// ---------------------------------------------------------------------------
const PILL = { x: 540, y: 468, w: 300, h: 84 };
const KEY = { x: 540, y: 646, s: 120 };

const CARD_W = 320;
const CARD_H = 280;
// pop = frame the card lands (camera arrives on the same frame)
const CARDS = [
  { cx: 292, cy: 278, pop: 46 }, // 1 — personas (top-left)
  { cx: 788, cy: 278, pop: 108 }, // 2 — page skeleton (top-right)
  { cx: 292, cy: 802, pop: 164 }, // 3 — animation (bottom-left)
  { cx: 788, cy: 802, pop: 214 }, // 4 — click (bottom-right)
] as const;

// Camera: hold -> move (14-24f) -> hold; two identical end keys.
const EASE = Easing.inOut(Easing.cubic);
const KEY_T = [0, 28, 46, 92, 108, 146, 164, 200, 214, 240, 262, 270];
const KEY_FX = [540, 540, 430, 430, 650, 650, 430, 430, 650, 650, 540, 540];
const KEY_FY = [552, 552, 415, 415, 415, 415, 672, 672, 672, 672, 540, 540];
const KEY_Z = [1.9, 1.9, 1.55, 1.55, 1.55, 1.55, 1.55, 1.55, 1.55, 1.55, 1.0, 1.0];

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---------------------------------------------------------------------------
// Wispr dictation pill — dark bar, cream ticks dancing like live speech
// ---------------------------------------------------------------------------
const N_BARS = 19;

const DictationPill: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = 4 * Math.sin(frame * 0.05);

  // amplitude spike as each card lands — the voice produces the card
  let boost = 0;
  for (const c of CARDS) {
    const dt = frame - (c.pop - 6);
    if (dt >= 0 && dt <= 20) boost = Math.max(boost, Math.sin((Math.PI * dt) / 20));
  }

  const bars = Array.from({ length: N_BARS }, (_, i) => {
    const centerEnv = 0.5 + 0.5 * (1 - Math.pow((i - (N_BARS - 1) / 2) / ((N_BARS - 1) / 2), 2));
    const fast = Math.abs(Math.sin(0.55 * i + frame * 0.3));
    const slow = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.047 + i * 0.23));
    const h = 8 + 36 * fast * slow * centerEnv * (1 + 0.55 * boost);
    return Math.min(h, 54);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: PILL.x - PILL.w / 2,
        top: PILL.y - PILL.h / 2,
        width: PILL.w,
        height: PILL.h,
        transform: `translateY(${bob}px)`,
        borderRadius: PILL.h / 2,
        backgroundColor: WISPR.barBg,
        border: `1.5px solid ${WISPR.barStroke}`,
        boxShadow: "0 16px 36px rgba(20, 18, 12, 0.20)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 24,
      }}
    >
      {/* gray dismiss circle from the real Flowbar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#71716E",
          flexShrink: 0,
          marginRight: 14,
          position: "relative",
        }}
      >
        <svg width={32} height={32} viewBox="0 0 32 32" style={{ position: "absolute", inset: 0 }}>
          <path
            d="M12 12 L20 20 M20 12 L12 20"
            stroke="#FCFCFB"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: h,
              borderRadius: 3,
              backgroundColor: "#FFFFEB",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// fn keycap — already mid-press at f0, lavender held-glow pulsing
// ---------------------------------------------------------------------------
const FnKey: React.FC = () => {
  const frame = useCurrentFrame();
  const glowOp = 0.42 + 0.16 * Math.sin(frame * 0.11);
  const ringScale = 1 + 0.018 * Math.sin(frame * 0.11);

  return (
    <>
      {/* soft lavender halo */}
      <div
        style={{
          position: "absolute",
          left: KEY.x - 150,
          top: KEY.y - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
          background: `radial-gradient(circle, ${WISPR.lavender} 0%, rgba(239,225,253,0) 65%)`,
          opacity: glowOp,
        }}
      />
      {/* held ring */}
      <div
        style={{
          position: "absolute",
          left: KEY.x - KEY.s / 2 - 11,
          top: KEY.y - KEY.s / 2 - 11,
          width: KEY.s + 22,
          height: KEY.s + 22,
          borderRadius: 36,
          border: `2px solid ${WISPR.lavenderBorder}`,
          opacity: 0.55,
          transform: `scale(${ringScale})`,
        }}
      />
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: KEY.x - 54,
          top: KEY.y + KEY.s / 2 - 4,
          width: 108,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "rgba(20, 18, 12, 0.10)",
          filter: "blur(6px)",
        }}
      />
      {/* the key, held down */}
      <div
        style={{
          position: "absolute",
          left: KEY.x - KEY.s / 2,
          top: KEY.y - KEY.s / 2,
          width: KEY.s,
          height: KEY.s,
          transform: "scale(0.965)",
          borderRadius: 28,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F3F1EC 100%)",
          border: "1.5px solid #E0DDD5",
          boxShadow:
            "inset 0 3px 7px rgba(20, 18, 12, 0.10), 0 4px 12px rgba(20, 18, 12, 0.08)",
        }}
      >
        {/* globe glyph, top-left (real fn key) */}
        <svg
          width={22}
          height={22}
          viewBox="0 0 22 22"
          style={{ position: "absolute", left: 14, top: 14 }}
        >
          <circle cx={11} cy={11} r={8} stroke="#8A867E" strokeWidth={1.6} fill="none" />
          <ellipse cx={11} cy={11} rx={3.6} ry={8} stroke="#8A867E" strokeWidth={1.4} fill="none" />
          <path d="M3 11 H19" stroke="#8A867E" strokeWidth={1.4} />
        </svg>
        <div
          style={{
            position: "absolute",
            right: 15,
            bottom: 10,
            fontFamily: FONT_SANS,
            fontSize: 27,
            fontWeight: 500,
            color: "#6B675F",
            lineHeight: 1,
          }}
        >
          fn
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Accent ring pulse from the pill each time a card lands (voice -> card)
// ---------------------------------------------------------------------------
const PulseRings: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {CARDS.map((c, i) => {
        const t0 = c.pop - 8;
        if (frame < t0 || frame > t0 + 24) return null;
        const p = interpolate(frame, [t0, t0 + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const r = 55 + 130 * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PILL.x - r,
              top: PILL.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              border: `2px solid rgba(37, 99, 235, ${0.38 * (1 - p)})`,
            }}
          />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Floating fragment card shell (approved NP3 language)
// ---------------------------------------------------------------------------
const Card: React.FC<{
  cx: number;
  cy: number;
  pop: number;
  floatPhase: number;
  children: React.ReactNode;
}> = ({ cx, cy, pop, floatPhase, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < pop) return null;
  const s = spring({ frame: frame - pop, fps, config: SPRINGS.snappy, durationInFrames: 26 });
  const scale = interpolate(s, [0, 1], [0.74, 1]);
  const rise = interpolate(s, [0, 1], [30, 0]);
  const op = interpolate(frame, [pop, pop + 8], [0, 1], clamp);
  // slow orbital drift around the center piece
  const t = (frame / 240) * Math.PI * 2 + floatPhase;
  const dx = 5 * Math.cos(t);
  const dy = 5 * Math.sin(t);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - CARD_W / 2,
        top: cy - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `translate(${dx}px, ${rise + dy}px) scale(${scale})`,
        opacity: op,
        backgroundColor: WORLD.card,
        border: `1px solid ${WORLD.border}`,
        borderRadius: 20,
        boxShadow: WORLD.shadow,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 1 — three abstract persona avatars, highlight ring lands on one
// ---------------------------------------------------------------------------
const PersonaContent: React.FC<{ pop: number }> = ({ pop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ringS =
    frame < pop + 18
      ? 0
      : spring({ frame: frame - (pop + 18), fps, config: SPRINGS.snappy, durationInFrames: 22 });
  const ringScale = interpolate(ringS, [0, 1], [1.8, 1]);
  const ringOp = interpolate(ringS, [0, 0.35], [0, 1], clamp);
  const barsOp = interpolate(frame, [pop + 14, pop + 22], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
        {[0, 1, 2].map((i) => {
          const aS =
            frame < pop + 4 + i * 5
              ? 0
              : spring({
                  frame: frame - (pop + 4 + i * 5),
                  fps,
                  config: SPRINGS.snappy,
                  durationInFrames: 20,
                });
          const picked = i === 1;
          return (
            <div key={i} style={{ position: "relative", transform: `scale(${aS})` }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: picked && ringS > 0.3 ? "#EAF0FD" : "#F3F1EC",
                  border: `1.5px solid ${picked && ringS > 0.3 ? "#C6D5F5" : "#E2DFD8"}`,
                  position: "relative",
                }}
              >
                <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
                  <circle cx={23} cy={27} r={3.4} fill="#7A766D" />
                  <circle cx={41} cy={27} r={3.4} fill="#7A766D" />
                  <path
                    d="M23 41 Q32 48 41 41"
                    stroke="#7A766D"
                    strokeWidth={3}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              {picked && (
                <div
                  style={{
                    position: "absolute",
                    left: -9,
                    top: -9,
                    width: 82,
                    height: 82,
                    borderRadius: 41,
                    border: `3px solid ${LOVABLE.accent}`,
                    boxShadow: "0 0 0 5px rgba(37, 99, 235, 0.12)",
                    transform: `scale(${ringScale})`,
                    opacity: ringOp,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", opacity: barsOp }}>
        <div style={{ width: 152, height: 10, borderRadius: 5, backgroundColor: "#ECE9E2" }} />
        <div style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: "#F0EDE7" }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 2 — mini page skeleton drawing in top-to-bottom
// ---------------------------------------------------------------------------
const SectionsContent: React.FC<{ pop: number }> = ({ pop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heroW = interpolate(frame, [pop + 2, pop + 11], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const barW = (d: number) =>
    interpolate(frame, [pop + d, pop + d + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const boxS = (d: number) =>
    frame < pop + d
      ? 0
      : spring({ frame: frame - (pop + d), fps, config: SPRINGS.snappy, durationInFrames: 18 });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 236,
          height: 212,
          backgroundColor: "#FBFAF7",
          border: "1px solid #ECEAE6",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        {/* hero block — soft Lovable gradient */}
        <div
          style={{
            height: 58,
            width: `${heroW * 100}%`,
            borderRadius: 8,
            background:
              "linear-gradient(120deg, #DCE5FA 0%, #E9D8F0 55%, #F7DAE0 100%)",
            opacity: heroW > 0 ? 1 : 0,
          }}
        />
        {/* three gray bars */}
        <div style={{ height: 10, width: `${barW(8) * 100}%`, borderRadius: 5, backgroundColor: "#E5E2DA" }} />
        <div style={{ height: 10, width: `${barW(12) * 78}%`, borderRadius: 5, backgroundColor: "#E8E5DE" }} />
        <div style={{ height: 10, width: `${barW(16) * 56}%`, borderRadius: 5, backgroundColor: "#ECE9E2" }} />
        {/* card row */}
        <div style={{ display: "flex", gap: 9, flex: 1, alignItems: "stretch" }}>
          {[18, 22, 26].map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 6,
                backgroundColor: "#F0EDE7",
                border: "1px solid #E5E2DA",
                transform: `scale(${boxS(d)})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 3 — wireframe cube rotating on a dashed orbit + easing curve drawing
// ---------------------------------------------------------------------------
const CUBE_VERTS: ReadonlyArray<readonly [number, number, number]> = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const CUBE_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const MotionContent: React.FC<{ pop: number }> = ({ pop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cubeS = spring({ frame: Math.max(0, frame - pop - 2), fps, config: SPRINGS.snappy, durationInFrames: 22 });
  const orbitOp = interpolate(frame, [pop + 6, pop + 16], [0, 1], clamp);
  const curveP = interpolate(frame, [pop + 12, pop + 32], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  const CX = 148;
  const CY = 122;
  const theta = frame * 0.045 + 0.6;
  const tilt = 0.45;
  const size = 30 * cubeS;
  const pts = CUBE_VERTS.map(([x, y, z]) => {
    const x1 = x * Math.cos(theta) - z * Math.sin(theta);
    const z1 = x * Math.sin(theta) + z * Math.cos(theta);
    const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
    return [CX + x1 * size, CY + y1 * size] as const;
  });

  // orbit dot on the rotated ellipse
  const RX = 98;
  const RY = 36;
  const rot = (-14 * Math.PI) / 180;
  const ot = frame * 0.055;
  const ox = RX * Math.cos(ot);
  const oy = RY * Math.sin(ot);
  const dotX = CX + ox * Math.cos(rot) - oy * Math.sin(rot);
  const dotY = CY + ox * Math.sin(rot) + oy * Math.cos(rot);
  const dotBehind = Math.sin(ot) < 0;

  const dot = <circle cx={dotX} cy={dotY} r={5} fill={LOVABLE.accent} opacity={orbitOp} />;
  const cube = (
    <g stroke={WORLD.text} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
      {CUBE_EDGES.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
      ))}
    </g>
  );

  return (
    <svg width={CARD_W} height={CARD_H} viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={{ position: "absolute", inset: 0 }}>
      <ellipse
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
        transform={`rotate(-14 ${CX} ${CY})`}
        fill="none"
        stroke="#B9B4AA"
        strokeWidth={2}
        strokeDasharray="5 9"
        opacity={orbitOp}
      />
      {dotBehind && dot}
      {cube}
      {!dotBehind && dot}
      {/* easing curve mini-panel */}
      <rect x={216} y={186} width={82} height={72} rx={10} fill="#F6F4EF" stroke="#E8E5DE" />
      <path
        d="M 228 246 C 254 246, 260 198, 286 198"
        fill="none"
        stroke={LOVABLE.accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - curveP}
      />
      <circle cx={228} cy={246} r={3} fill={LOVABLE.accent} opacity={curveP > 0.02 ? 1 : 0} />
      <circle cx={286} cy={198} r={3} fill={LOVABLE.accent} opacity={curveP >= 1 ? 1 : 0} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Card 4 — pill button pressed by a cursor: press-scale + ripple + fill
// ---------------------------------------------------------------------------
const ClickContent: React.FC<{ pop: number }> = ({ pop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btnS = spring({ frame: Math.max(0, frame - pop - 2), fps, config: SPRINGS.snappy, durationInFrames: 20 });

  const press = pop + 16; // press-down frame
  const cursorX = interpolate(frame, [pop + 4, press - 2], [262, 176], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cursorY = interpolate(frame, [pop + 4, press - 2], [242, 134], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pressScale = interpolate(frame, [press - 1, press + 2, press + 6], [1, 0.93, 1], clamp);
  const cursorScale = interpolate(frame, [press - 1, press + 2, press + 6], [1, 0.9, 1], clamp);
  const fillP = interpolate(frame, [press + 2, press + 8], [0, 1], clamp);
  const rippleP = interpolate(frame, [press + 2, press + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rippleR = 30 + 58 * rippleP;

  const BTN_W = 156;
  const BTN_H = 56;
  const BX = 160;
  const BY = 128;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* ripple */}
      {frame >= press + 2 && rippleP < 1 && (
        <div
          style={{
            position: "absolute",
            left: BX - rippleR,
            top: BY - rippleR,
            width: rippleR * 2,
            height: rippleR * 2,
            borderRadius: rippleR,
            border: `2.5px solid rgba(37, 99, 235, ${0.45 * (1 - rippleP)})`,
          }}
        />
      )}
      {/* pill button: outline -> filled */}
      <div
        style={{
          position: "absolute",
          left: BX - BTN_W / 2,
          top: BY - BTN_H / 2,
          width: BTN_W,
          height: BTN_H,
          transform: `scale(${btnS * pressScale})`,
          borderRadius: BTN_H / 2,
          backgroundColor: "#FFFFFF",
          border: `2px solid ${LOVABLE.black}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: LOVABLE.black,
            opacity: fillP,
          }}
        />
        {/* up arrow (Lovable send language) — crossfades dark -> light */}
        <svg width={BTN_W} height={BTN_H} viewBox={`0 0 ${BTN_W} ${BTN_H}`} style={{ position: "absolute", inset: 0 }}>
          <g strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M78 38 V18 M69 27 L78 18 L87 27" stroke={LOVABLE.black} opacity={1 - fillP} />
            <path d="M78 38 V18 M69 27 L78 18 L87 27" stroke="#FFFFFF" opacity={fillP} />
          </g>
        </svg>
      </div>
      {/* skeleton caption under the button */}
      <div
        style={{
          position: "absolute",
          left: BX - 56,
          top: BY + 52,
          width: 112,
          height: 9,
          borderRadius: 5,
          backgroundColor: "#EDEAE3",
          opacity: interpolate(frame, [pop + 8, pop + 16], [0, 1], clamp),
        }}
      />
      {/* cursor */}
      {frame >= pop + 4 && (
        <svg
          width={30}
          height={32}
          viewBox="0 0 15 16"
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorScale})`,
            transformOrigin: "2px 2px",
            filter: "drop-shadow(0 2px 4px rgba(20,18,12,0.25))",
          }}
        >
          <path
            d="M1.5 1 L1.5 12.6 L4.4 10 L6.3 14.4 L8.4 13.5 L6.5 9.2 L10.4 9.2 Z"
            fill="#111111"
            stroke="#FFFFFF"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const LwP4FourThings: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, { easing: EASE, ...clamp });
  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: EASE, ...clamp });
  const z = interpolate(frame, KEY_T, KEY_Z, { easing: EASE, ...clamp });

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <PulseRings />
        <Card cx={CARDS[0].cx} cy={CARDS[0].cy} pop={CARDS[0].pop} floatPhase={0.4}>
          <PersonaContent pop={CARDS[0].pop} />
        </Card>
        <Card cx={CARDS[1].cx} cy={CARDS[1].cy} pop={CARDS[1].pop} floatPhase={2.1}>
          <SectionsContent pop={CARDS[1].pop} />
        </Card>
        <Card cx={CARDS[2].cx} cy={CARDS[2].cy} pop={CARDS[2].pop} floatPhase={3.9}>
          <MotionContent pop={CARDS[2].pop} />
        </Card>
        <Card cx={CARDS[3].cx} cy={CARDS[3].cy} pop={CARDS[3].pop} floatPhase={5.5}>
          <ClickContent pop={CARDS[3].pop} />
        </Card>
        <FnKey />
        <DictationPill />
      </div>
    </AbsoluteFill>
  );
};
