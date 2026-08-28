import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 210;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  card: "#ffffff",
  orange: "#ff4f01",
  orangeLite: "#ff7a3c",
  greenInk: "#16A34A",
  green: "#22C55E",
  greenBg: "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  orangeBg: "rgba(255,79,1,0.07)",
  orangeBorder: "rgba(255,79,1,0.28)",
  grayCard: "#eeece8",
  grayLine: "#cfc9c1",
  grayInk: "#a49d95",
};

// content bounding box (design coords), symmetric about x=540 → 5%/13% padding
const BBOX_CX = 540;
const BBOX_TOP = 172;
const BBOX_W = 892;

const CARD_W = 892;
const CARD_LEFT = BBOX_CX - CARD_W / 2; // 94
const RAIL_X = CARD_LEFT + 36 + 32; // badge center = 162

const CARDS_Y = [540, 812, 1084];

// -------- timing (30fps · 210 frames) --------
const T_KICKER = 4;
const T_HEAD = 12;
const T_HEAD_SWEEP_A = 30;
const T_HEAD_SWEEP_B = 50;
const STEP_BASE = 42;
const STEP_STAGGER = 26;
const VIS_OFFSET = 14;
const T_PAYOFF = 138;

// =========================================================================
// Background
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(920px 1040px at 50% 46%, rgba(255,79,1,0.08), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(800px 1000px at 50% 50%, #000 45%, transparent 86%)",
        maskImage:
          "radial-gradient(800px 1000px at 50% 50%, #000 45%, transparent 86%)",
      }}
    />
  </AbsoluteFill>
);

// =========================================================================
// Highlight-swept keyword
// =========================================================================
const Mark: React.FC<{ children: React.ReactNode; sweep: number }> = ({
  children,
  sweep,
}) => (
  <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: -8,
        right: -8,
        top: "14%",
        bottom: "8%",
        background: COLORS.orange,
        opacity: 0.22,
        zIndex: -1,
        transform: `scaleX(${sweep}) rotate(-1.5deg)`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 92%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

// =========================================================================
// Glyphs
// =========================================================================
const PlayTriangle: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <path d="M8 5.5 L18.5 12 L8 18.5 Z" fill={color} />
  </svg>
);

const SendPlane: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <path
      d="M21.4 2.6 2.9 10.3c-.9.37-.86 1.66.06 1.98l7.05 2.46 2.46 7.05c.32.92 1.6.96 1.98.06L22.2 3.4a.6.6 0 0 0-.8-.8Z"
      fill={color}
    />
    <path
      d="M9.9 14 21.4 2.6"
      stroke={COLORS.paper}
      strokeWidth="1.2"
      opacity="0.5"
    />
  </svg>
);

// Official VidMuse brandmark (vidmuse.ai)
const VidMuseMark: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    style={{ display: "block" }}
  >
    <path
      fill={color}
      d="M28.358 5.313c.325-.302.815.103.58.478l-2.527 4.044c2.725 4.401 2.179 10.254-1.64 14.073-4.241 4.24-10.988 4.447-15.473.62l-.05-.042v.002c-.194-.179-.606-.567-.698-.687.085-.113.402-.442.638-.682l.015-.015.014-.014-.002-.001.04-.037.089-.09v.007l2.27-2.108.002.003q.31.308.645.572a7.111 7.111 0 0 0 11.467-4.995l.002-.04a7.16 7.16 0 0 0-.678-3.648l-.082-.165a7 7 0 0 0-.944-1.396zM8.23 7.342c4.241-4.24 10.988-4.446 15.472-.62a1 1 0 0 1 .081.07l.001-.002c.187.187.582.592.67.716-.113.136-.6.593-.829.805l-2.237 2.078-.003-.003a7.111 7.111 0 0 0-12.082 4.136 7.1 7.1 0 0 0 1.67 5.536l-6.331 5.88c-.325.3-.814-.105-.58-.48l2.527-4.043C3.863 17.014 4.41 11.162 8.229 7.343"
    />
  </svg>
);

// =========================================================================
// Step visuals (right side of each card)
// =========================================================================
// 1 — a "boring" ad: gray card, flatline, dull bars
const BoringAd: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      width: 176,
      height: 148,
      borderRadius: 18,
      background: COLORS.grayCard,
      border: `1.5px solid ${COLORS.grayLine}`,
      position: "relative",
      overflow: "hidden",
      opacity: t,
      transform: `scale(${0.9 + 0.1 * t})`,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width: 64,
        height: 9,
        borderRadius: 5,
        background: COLORS.grayLine,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 34,
        left: 16,
        width: 40,
        height: 9,
        borderRadius: 5,
        background: COLORS.grayLine,
        opacity: 0.7,
      }}
    />
    {/* flatline = dead engagement */}
    <svg
      width="176"
      height="60"
      viewBox="0 0 176 60"
      style={{ position: "absolute", bottom: 14, left: 0 }}
    >
      <line
        x1="14"
        y1="40"
        x2="162"
        y2="40"
        stroke={COLORS.grayInk}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{
        position: "absolute",
        bottom: 10,
        right: 14,
        fontSize: 20,
        fontWeight: 800,
        color: COLORS.grayInk,
        letterSpacing: 1,
      }}
    >
      zzz
    </div>
  </div>
);

// mini UGC video thumbnail
const UGCThumb: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
      background: "linear-gradient(165deg, #2a2430 0%, #171319 100%)",
      border: `1px solid ${COLORS.line}`,
      boxShadow: "0 10px 22px rgba(32,21,21,0.22)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(120px 120px at 50% 42%, rgba(255,79,1,0.30), rgba(255,79,1,0) 70%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        transform: "translate(-50%,-50%)",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.92)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ marginLeft: 3 }}>
        <PlayTriangle size={20} color={COLORS.ink} />
      </div>
    </div>
  </div>
);

// 2 — VidMuse produces a couple of UGC ads
const MakeCouple: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      opacity: t,
      transform: `scale(${0.9 + 0.1 * t})`,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 74,
        height: 74,
        borderRadius: 18,
        background: `linear-gradient(150deg, ${COLORS.orangeLite}, ${COLORS.orange})`,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 10px 22px rgba(255,79,1,0.32)",
      }}
    >
      <VidMuseMark size={46} color="#fff" />
    </div>
    <span style={{ fontSize: 34, fontWeight: 800, color: COLORS.muted }}>
      →
    </span>
    <div style={{ display: "flex", gap: 10 }}>
      <UGCThumb w={92} h={126} />
      <UGCThumb w={92} h={126} />
    </div>
  </div>
);

// 3 — send it
const SendVisual: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      opacity: t,
      transform: `translateX(${(1 - t) * 20}px)`,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: 22,
        background: COLORS.orangeBg,
        border: `1.5px solid ${COLORS.orangeBorder}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <SendPlane size={46} color={COLORS.orange} />
    </div>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 14,
        background: COLORS.greenBg,
        border: `1.5px solid ${COLORS.greenBorder}`,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: COLORS.green,
          color: "#fff",
          fontSize: 18,
          fontWeight: 900,
          display: "grid",
          placeItems: "center",
        }}
      >
        ✓
      </span>
      <span style={{ fontSize: 30, fontWeight: 800, color: COLORS.greenInk }}>
        Sent
      </span>
    </div>
  </div>
);

type Step = {
  n: number;
  title: string;
  sub: string;
  visual: (t: number) => React.ReactNode;
};
const STEPS: Step[] = [
  {
    n: 1,
    title: "Find boring ads",
    sub: "brands running dull creative",
    visual: (t) => <BoringAd t={t} />,
  },
  {
    n: 2,
    title: "Make a couple",
    sub: "fresh UGC ads with VidMuse",
    visual: (t) => <MakeCouple t={t} />,
  },
  {
    n: 3,
    title: "Send before you pitch",
    sub: "proof lands before the ask",
    visual: (t) => <SendVisual t={t} />,
  },
];

// =========================================================================
// Step card
// =========================================================================
const StepCard: React.FC<{
  step: Step;
  cy: number;
  s: number;
  vis: number;
}> = ({ step, cy, s, vis }) => (
  <div
    style={{
      position: "absolute",
      left: BBOX_CX,
      top: cy,
      width: CARD_W,
      height: 224,
      transform: `translate(-50%,-50%) scale(${0.86 + 0.14 * s})`,
      opacity: s,
      background: COLORS.card,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 30,
      boxShadow: "0 20px 46px rgba(32,21,21,0.11)",
      display: "flex",
      alignItems: "center",
      gap: 30,
      padding: "0 40px",
    }}
  >
    {/* number badge */}
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        background: COLORS.orange,
        color: "#fff",
        fontSize: 36,
        fontWeight: 900,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 8px 18px rgba(255,79,1,0.30)",
        flexShrink: 0,
      }}
    >
      {step.n}
    </div>
    {/* text */}
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <span
        style={{
          fontSize: 42,
          fontWeight: 800,
          color: COLORS.ink,
          letterSpacing: -0.8,
        }}
      >
        {step.title}
      </span>
      <span style={{ fontSize: 26, fontWeight: 600, color: COLORS.muted }}>
        {step.sub}
      </span>
    </div>
    {/* visual */}
    {step.visual(vis)}
  </div>
);

// =========================================================================
// Root
// =========================================================================
export const LandTheClient: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const sp = (delay: number, damping = 14, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness } });

  // padding transform: fit content bbox → 5% sides / 13% top
  const padTop = height * 0.13;
  const contentScale = (width * 0.84) / BBOX_W; // 8% gap each side
  const shiftY = padTop - BBOX_TOP;

  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = sp(T_KICKER, 15, 160);
  const headRise = sp(T_HEAD, 16, 140);
  const headOp = interpolate(frame, [T_HEAD, T_HEAD + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headSweep = interpolate(
    frame,
    [T_HEAD_SWEEP_A, T_HEAD_SWEEP_B],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  // rail grows with steps
  const railGrow = interpolate(
    frame,
    [STEP_BASE, STEP_BASE + STEP_STAGGER * 2 + 16],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  const railTop = CARDS_Y[0];
  const railBottom = CARDS_Y[2];
  const railH = (railBottom - railTop) * railGrow;

  // stamp slam-in
  // proof-first payoff reveal (clean highlighted text, no stamp)
  const payoffT = sp(T_PAYOFF, 15, 130);
  const payoffOp = interpolate(frame, [T_PAYOFF, T_PAYOFF + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const payoffSweep = interpolate(
    frame,
    [T_PAYOFF + 8, T_PAYOFF + 28],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Background />
      <AbsoluteFill
        style={{
          opacity: introOp,
          filter: `blur(${introBlur}px)`,
          transform: `translateY(${shiftY}px) scale(${contentScale})`,
          transformOrigin: `${BBOX_CX}px ${BBOX_TOP}px`,
        }}
      >
        {/* ============ KICKER ============ */}
        <div
          style={{
            position: "absolute",
            top: BBOX_TOP,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orange,
              padding: "10px 18px",
              border: `1.5px solid ${COLORS.orangeBorder}`,
              borderRadius: 999,
              background: COLORS.orangeBg,
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.92 + 0.08 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            The Play
          </div>
        </div>

        {/* ============ HEADLINE ============ */}
        <div
          style={{
            position: "absolute",
            top: 252,
            left: BBOX_CX - BBOX_W / 2,
            width: BBOX_W,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              color: COLORS.ink,
              opacity: headOp,
              transform: `translateY(${(1 - headRise) * 16}px)`,
            }}
          >
            How you <Mark sweep={headSweep}>land the client</Mark>
          </h1>
        </div>

        {/* ============ STEP RAIL ============ */}
        <div
          style={{
            position: "absolute",
            left: RAIL_X,
            top: railTop,
            width: 4,
            height: railH,
            transform: "translateX(-50%)",
            background: `linear-gradient(${COLORS.orange}, ${COLORS.orangeLite})`,
            borderRadius: 4,
            opacity: 0.5,
          }}
        />

        {/* ============ STEP CARDS ============ */}
        {STEPS.map((step, i) => {
          const s = sp(STEP_BASE + i * STEP_STAGGER, 14, 150);
          const vis = interpolate(
            frame,
            [
              STEP_BASE + i * STEP_STAGGER + VIS_OFFSET,
              STEP_BASE + i * STEP_STAGGER + VIS_OFFSET + 14,
            ],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <StepCard
              key={step.n}
              step={step}
              cy={CARDS_Y[i]}
              s={s}
              vis={vis}
            />
          );
        })}

        {/* ============ PROOF-FIRST PAYOFF ============ */}
        <div
          style={{
            position: "absolute",
            left: BBOX_CX,
            top: 1400,
            width: BBOX_W,
            transform: `translate(-50%,-50%) translateY(${(1 - payoffT) * 22}px)`,
            opacity: payoffOp,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: COLORS.orange,
            }}
          >
            The rule
          </span>
          <span
            style={{
              fontSize: 100,
              fontWeight: 900,
              letterSpacing: -2,
              color: COLORS.ink,
              lineHeight: 0.98,
            }}
          >
            Proof <Mark sweep={payoffSweep}>first</Mark>.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
