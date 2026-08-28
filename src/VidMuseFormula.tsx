import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 180;

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
};

const CX = 540;

// -------- timing (30fps · 180 frames) --------
const T_KICKER = 4;
const T_HEAD = 12;
const T_HEAD_SWEEP_A = 30;
const T_HEAD_SWEEP_B = 48;
const T_TECH1 = 26;
const T_TECH2 = 36;
const T_PLUS_PAIR = 48; // "+" between the two technique chips
const T_PLUS_TOOL = 58; // "+" between technique row and tool
const T_TOOL = 66;
const T_EQUALS = 96;
const T_PAYOFF = 104;
const T_PACKET_A = 100;
const T_PACKET_B = 128;
const T_SWEEP_A = 118; // stopwatch hand sweep
const T_SWEEP_B = 168;

// =========================================================================
// Background — warm paper, orange radial glow, masked grid
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(920px 1040px at 50% 44%, rgba(255,79,1,0.08), rgba(255,79,1,0) 60%)",
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
          "radial-gradient(780px 980px at 50% 48%, #000 45%, transparent 86%)",
        maskImage:
          "radial-gradient(780px 980px at 50% 48%, #000 45%, transparent 86%)",
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
// Small drawn glyphs (no emoji — guaranteed to render headless)
// =========================================================================
// Official VidMuse brandmark (twin-swirl "muse" mark, vidmuse.ai)
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

const RisingBars: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block" }}
  >
    <rect x="3" y="14" width="4" height="7" rx="1.2" fill={color} />
    <rect x="10" y="9" width="4" height="12" rx="1.2" fill={color} />
    <rect x="17" y="4" width="4" height="17" rx="1.2" fill={color} />
  </svg>
);

const Stopwatch: React.FC<{ size: number; color: string; hand: number }> = ({
  size,
  color,
  hand,
}) => {
  const cx = 12;
  const cy = 13.2;
  const r = 7.4;
  const ang = -90 + hand * 360;
  const rad = (ang * Math.PI) / 180;
  const hx = cx + Math.cos(rad) * (r - 2.4);
  const hy = cy + Math.sin(rad) * (r - 2.4);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block" }}
    >
      {/* top button */}
      <rect x="10" y="2" width="4" height="2.4" rx="1" fill={color} />
      <rect x="11.2" y="3.6" width="1.6" height="2" fill={color} />
      {/* dial */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
      />
      {/* hand */}
      <line
        x1={cx}
        y1={cy}
        x2={hx}
        y2={hy}
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="1.3" fill={color} />
    </svg>
  );
};

// =========================================================================
// Technique chip
// =========================================================================
const TechChip: React.FC<{ n: number; s: number }> = ({ n, s }) => (
  <div
    style={{
      width: 410,
      height: 168,
      transform: `translate(-50%,-50%) scale(${0.82 + 0.18 * s})`,
      opacity: s,
      background: COLORS.card,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 28,
      boxShadow: "0 18px 40px rgba(32,21,21,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 16,
        background: COLORS.orange,
        color: "#fff",
        fontSize: 34,
        fontWeight: 900,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 8px 18px rgba(255,79,1,0.30)",
      }}
    >
      {n}
    </div>
    <div
      style={{
        fontSize: 34,
        fontWeight: 800,
        color: COLORS.ink,
        letterSpacing: -0.4,
      }}
    >
      Technique {n}
    </div>
  </div>
);

// =========================================================================
// Operator glyph (+ / =)
// =========================================================================
const Operator: React.FC<{ ch: string; s: number; y: number }> = ({
  ch,
  s,
  y,
}) => (
  <div
    style={{
      position: "absolute",
      left: CX,
      top: y,
      transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * s})`,
      opacity: s,
      fontSize: 82,
      fontWeight: 800,
      color: COLORS.muted,
      lineHeight: 1,
    }}
  >
    {ch}
  </div>
);

// =========================================================================
// Root composition
// =========================================================================
export const VidMuseFormula: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Padding: fit the VISIBLE content bounding box (not the empty canvas) to
  // 5% left/right + 13% top. BBOX is the content extent in design coords,
  // symmetric about x=540: cards span x[94,986] (w=892), top at y=172.
  const BBOX_CX = 540;
  const BBOX_TOP = 172;
  const BBOX_W = 892;
  const padTop = height * 0.13; // 13% top gap above content
  const contentScale = (width * 0.84) / BBOX_W; // 8% gap each side
  const shiftY = padTop - BBOX_TOP;

  const sp = (delay: number, damping = 14, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness } });

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

  const tech1 = sp(T_TECH1, 13, 160);
  const tech2 = sp(T_TECH2, 13, 160);
  const plusPair = sp(T_PLUS_PAIR, 12, 170);
  const plusTool = sp(T_PLUS_TOOL, 12, 170);
  const tool = sp(T_TOOL, 14, 130);
  const equals = sp(T_EQUALS, 12, 170);
  const payoff = sp(T_PAYOFF, 16, 110);

  // traveling packet from tool card into payoff card
  const packetP = interpolate(frame, [T_PACKET_A, T_PACKET_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const packetY = interpolate(packetP, [0, 1], [975, 1145]);
  const packetVisible = frame >= T_PACKET_A && frame <= T_PACKET_B + 2;

  // stopwatch sweep + gentle end pulse on payoff
  const sweep = interpolate(frame, [T_SWEEP_A, T_SWEEP_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const badgeIn = interpolate(frame, [T_PAYOFF + 10, T_PAYOFF + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const endPulse = frame > 150 ? 1 + 0.02 * Math.sin((frame - 150) / 4) : 1;

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
            top: 172,
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
            The Formula
          </div>
        </div>

        {/* ============ HEADLINE ============ */}
        <div
          style={{
            position: "absolute",
            top: 232,
            left: 80,
            right: 80,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.6,
              color: COLORS.ink,
              opacity: headOp,
              transform: `translateY(${(1 - headRise) * 16}px)`,
            }}
          >
            The <Mark sweep={headSweep}>15-minute</Mark> ad video
          </h1>
        </div>

        {/* ============ TECHNIQUE ROW ============ */}
        <div style={{ position: "absolute", left: 300, top: 520 }}>
          <TechChip n={1} s={tech1} />
        </div>
        <div style={{ position: "absolute", left: 780, top: 520 }}>
          <TechChip n={2} s={tech2} />
        </div>
        <Operator ch="+" s={plusPair} y={520} />

        {/* + between technique row and tool */}
        <Operator ch="+" s={plusTool} y={678} />

        {/* ============ VIDMUSE TOOL CARD ============ */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: 852,
            width: 690,
            height: 250,
            transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * tool})`,
            opacity: tool,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 34,
            boxShadow: "0 24px 54px rgba(32,21,21,0.14)",
            display: "flex",
            alignItems: "center",
            gap: 34,
            padding: "0 46px",
          }}
        >
          {/* app icon */}
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 34,
              background: `linear-gradient(150deg, ${COLORS.orangeLite}, ${COLORS.orange})`,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 16px 34px rgba(255,79,1,0.34)",
              flexShrink: 0,
            }}
          >
            <VidMuseMark size={96} color="#fff" />
          </div>
          {/* wordmark */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 7,
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.orange,
                padding: "5px 12px",
                borderRadius: 999,
                background: COLORS.orangeBg,
                border: `1.5px solid ${COLORS.orangeBorder}`,
              }}
            >
              AI Tool
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: -1.6,
                color: COLORS.ink,
              }}
            >
              VidMuse
            </div>
          </div>
        </div>

        {/* ============ EQUALS ============ */}
        <Operator ch="=" s={equals} y={1035} />

        {/* traveling packet */}
        {packetVisible && (
          <>
            <div
              style={{
                position: "absolute",
                left: CX,
                top: packetY,
                width: 30,
                height: 30,
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                background: COLORS.orange,
                opacity: 0.2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: CX,
                top: packetY,
                width: 14,
                height: 14,
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 16px rgba(255,79,1,0.6)",
              }}
            />
          </>
        )}

        {/* ============ PAYOFF CARD ============ */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: 1372,
            width: 892,
            height: 468,
            transform: `translate(-50%,-50%) scale(${(0.86 + 0.14 * payoff) * endPulse})`,
            opacity: payoff,
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 36,
            boxShadow: "0 30px 70px rgba(32,21,21,0.16)",
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: "0 48px",
          }}
        >
          {/* mini UGC video frame */}
          <div
            style={{
              position: "relative",
              width: 232,
              height: 348,
              borderRadius: 26,
              overflow: "hidden",
              flexShrink: 0,
              background: "linear-gradient(165deg, #2a2430 0%, #171319 100%)",
              border: `1px solid ${COLORS.line}`,
              boxShadow: "0 18px 38px rgba(32,21,21,0.24)",
            }}
          >
            {/* real ad footage — starts when the payoff card lands */}
            <Sequence from={T_PAYOFF}>
              <OffthreadVideo
                src={staticFile("ads/ad-comp.mp4")}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Sequence>
            {/* UGC tag */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: "#fff",
                padding: "5px 10px",
                borderRadius: 8,
                background: "rgba(255,79,1,0.9)",
              }}
            >
              UGC
            </div>
            {/* timestamp */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
                padding: "4px 9px",
                borderRadius: 8,
                background: "rgba(10,10,12,0.55)",
              }}
            >
              0:15
            </div>
          </div>

          {/* right column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: COLORS.green,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: COLORS.ink,
                  letterSpacing: -0.8,
                }}
              >
                Ad video, done
              </span>
            </div>

            {/* high-earning badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                alignSelf: "flex-start",
                padding: "16px 22px",
                borderRadius: 18,
                background: COLORS.greenBg,
                border: `1.5px solid ${COLORS.greenBorder}`,
                opacity: badgeIn,
                transform: `translateX(${(1 - badgeIn) * 14}px)`,
              }}
            >
              <RisingBars size={34} color={COLORS.greenInk} />
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: COLORS.greenInk,
                }}
              >
                High-earning
              </span>
            </div>

            {/* time badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                alignSelf: "flex-start",
                padding: "16px 22px",
                borderRadius: 18,
                background: COLORS.orangeBg,
                border: `1.5px solid ${COLORS.orangeBorder}`,
                opacity: badgeIn,
                transform: `translateX(${(1 - badgeIn) * 14}px)`,
              }}
            >
              <Stopwatch size={36} color={COLORS.orange} hand={sweep} />
              <span
                style={{ fontSize: 34, fontWeight: 800, color: COLORS.ink }}
              >
                ~15 min
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
