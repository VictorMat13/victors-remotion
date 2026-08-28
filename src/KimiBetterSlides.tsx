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

export const DURATION_IN_FRAMES = 175;

// Promptible "white / paper" style — blue accent for the mystery AI, green for FREE
const COLORS = {
  paper: "#fbfbf9",
  ink: "#1B1720",
  muted: "#8B8594",
  line: "#ece8e3",
  blue: "#3B82F6",
  blueDeep: "#2563EB",
  green: "#16A34A",
  greenLite: "#22C55E",
};

const CX = 540;

// -------------------------------------------------------------------------
// Paper background — soft blue glow + masked grid (Promptible signature)
// -------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(820px 780px at 50% 44%, rgba(59,130,246,0.09), rgba(59,130,246,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        WebkitMaskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// -------------------------------------------------------------------------
// Highlighter sweep behind a key word
// -------------------------------------------------------------------------
const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  color?: string;
  rot?: number;
}> = ({ children, progress, color = COLORS.blue, rot = -1.4 }) => (
  <span
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      display: "inline-block",
      zIndex: 1,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: color,
        opacity: 0.24,
        zIndex: -1,
        transform: `rotate(${rot}deg) scaleX(${progress})`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

// -------------------------------------------------------------------------
// App-icon card: white rounded tile holding a brand logo
// -------------------------------------------------------------------------
const LogoCard: React.FC<{
  src: string;
  size: number;
  pop: number;
  blur?: number;
  dim?: number; // 0 = full color, 1 = fully dimmed/grayscale
  glow?: number; // green winner glow 0..1
}> = ({ src, size, pop, blur = 0, dim = 0, glow = 0 }) => (
  <div
    style={{
      width: size,
      height: size,
      transform: `scale(${0.6 + 0.4 * pop})`,
      opacity: pop,
      borderRadius: size * 0.24,
      background: "#ffffff",
      border: `1.5px solid ${glow > 0.01 ? COLORS.greenLite : COLORS.line}`,
      boxShadow:
        glow > 0.01
          ? `0 0 0 ${2 + glow * 5}px rgba(34,197,94,${0.1 + glow * 0.14}), 0 22px 46px rgba(22,163,74,0.20)`
          : "0 18px 40px rgba(27,23,32,0.10)",
      display: "grid",
      placeItems: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Img
      src={src}
      style={{
        width: size * (blur > 0 ? 0.52 : 0.62),
        height: size * (blur > 0 ? 0.52 : 0.62),
        borderRadius: size * 0.13,
        filter: `blur(${blur}px) grayscale(${dim}) `,
        opacity: 1 - dim * 0.45,
        transform: blur > 0 ? "scale(1.1)" : undefined,
      }}
    />
  </div>
);

// content inset — 12% padding, background stays full-bleed (matches BrandsThatWin)
const PAD = 0.12 * 1080;
const CONTENT_SCALE = (1080 - 2 * PAD) / 1080;
const SHIFT_Y = 0.05 * 1080;

export const KimiBetterSlides: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // intro
  const introBlur = interpolate(frame, [0, 14], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker + headline
  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const line1 = spring({
    frame: frame - 9,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const line2 = spring({
    frame: frame - 13,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const hlSweep = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // mystery card + challengers
  const mysteryIn = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const qBadge = spring({
    frame: frame - 44,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const gammaIn = spring({
    frame: frame - 54,
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const canvaIn = spring({
    frame: frame - 62,
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  // gentle float on the mystery card
  const float = Math.sin(frame / 17) * 6;
  const qWiggle = Math.sin(frame / 9) * 6;

  // verdict: winner glow + challengers dim + paid chips
  const glow = interpolate(frame, [92, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dim = interpolate(frame, [98, 114], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const paidChip = spring({
    frame: frame - 100,
    fps,
    config: { damping: 13, stiffness: 170 },
  });

  // FREE stamp
  const stamp = spring({
    frame: frame - 114,
    fps,
    config: { damping: 11, stiffness: 160 },
  });
  const stampScale = interpolate(stamp, [0, 1], [1.9, 1]);
  const ring = interpolate(frame, [114, 134], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // payoff
  const pay = spring({
    frame: frame - 128,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const paySweep = interpolate(frame, [142, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const MYSTERY = 280;
  const CHALLENGER = 180;
  const mysteryTop = 320 + float;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{
          opacity: introOp,
          filter: `blur(${introBlur}px)`,
          transform: `translate(${PAD}px, ${PAD + SHIFT_Y}px) scale(${CONTENT_SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 84,
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
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.blueDeep,
              padding: "8px 16px",
              border: "1.5px solid rgba(59,130,246,0.28)",
              borderRadius: 999,
              background: "rgba(59,130,246,0.05)",
              transform: `translateY(${(1 - kicker) * 14}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.blue,
                boxShadow: "0 0 0 4px rgba(59,130,246,0.15)",
              }}
            />
            AI slides
          </div>
        </div>

        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 146,
            left: 80,
            right: 80,
            textAlign: "center",
            fontSize: 56,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - line1) * 18}px)`,
              opacity: line1,
            }}
          >
            This AI creates
          </div>
          <div
            style={{
              transform: `translateY(${(1 - line2) * 18}px)`,
              opacity: line2,
            }}
          >
            <Hl progress={hlSweep}>better slides</Hl>
          </div>
        </div>

        {/* ---------- MYSTERY CARD (blurred Kimi) ---------- */}
        <div
          style={{
            position: "absolute",
            left: CX - MYSTERY / 2,
            top: mysteryTop,
          }}
        >
          <LogoCard
            src={staticFile("kimi-slides/kimi.png")}
            size={MYSTERY}
            pop={mysteryIn}
            blur={14}
            glow={glow}
          />
          {/* ? badge */}
          <div
            style={{
              position: "absolute",
              top: -16,
              right: -16,
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: COLORS.blue,
              color: "#fff",
              fontSize: 34,
              fontWeight: 900,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 10px 24px rgba(37,99,235,0.35)",
              opacity: qBadge,
              transform: `scale(${0.5 + 0.5 * qBadge}) rotate(${qWiggle}deg)`,
            }}
          >
            ?
          </div>
          {/* FREE stamp */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -30,
              transform: `translateX(-50%) rotate(-6deg) scale(${stampScale})`,
              opacity: stamp,
              padding: "12px 30px",
              borderRadius: 999,
              background: COLORS.greenLite,
              color: "#fff",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 1,
              boxShadow: `0 0 0 ${ring * 10}px rgba(34,197,94,${0.22 * (1 - ring)}), 0 14px 30px rgba(22,163,74,0.35)`,
              whiteSpace: "nowrap",
            }}
          >
            100% FREE
          </div>
        </div>

        {/* ---------- CHALLENGERS ---------- */}
        {/* Gamma */}
        <div
          style={{ position: "absolute", left: 250 - CHALLENGER / 2, top: 682 }}
        >
          <LogoCard
            src={staticFile("kimi-slides/gamma.png")}
            size={CHALLENGER}
            pop={gammaIn}
            dim={dim}
          />
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 27,
              fontWeight: 700,
              color: COLORS.muted,
              opacity: gammaIn,
            }}
          >
            Gamma
          </div>
          <div
            style={{
              position: "absolute",
              top: -12,
              right: -22,
              padding: "5px 13px",
              borderRadius: 999,
              background: "#efece7",
              border: `1px solid ${COLORS.line}`,
              color: COLORS.muted,
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 0.5,
              opacity: paidChip,
              transform: `scale(${0.6 + 0.4 * paidChip})`,
            }}
          >
            $ Paid
          </div>
        </div>
        {/* Canva */}
        <div
          style={{ position: "absolute", left: 830 - CHALLENGER / 2, top: 682 }}
        >
          <LogoCard
            src={staticFile("kimi-slides/canva.png")}
            size={CHALLENGER}
            pop={canvaIn}
            dim={dim}
          />
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 27,
              fontWeight: 700,
              color: COLORS.muted,
              opacity: canvaIn,
            }}
          >
            Canva
          </div>
          <div
            style={{
              position: "absolute",
              top: -12,
              right: -22,
              padding: "5px 13px",
              borderRadius: 999,
              background: "#efece7",
              border: `1px solid ${COLORS.line}`,
              color: COLORS.muted,
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 0.5,
              opacity: paidChip,
              transform: `scale(${0.6 + 0.4 * paidChip})`,
            }}
          >
            $ Paid
          </div>
        </div>

        {/* ---------- "beats" connectors ---------- */}
        {[
          { x: 250, pop: gammaIn },
          { x: 830, pop: canvaIn },
        ].map(({ x, pop }, i) => {
          const draw = interpolate(pop, [0.2, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x1 = CX + (x < CX ? -90 : 90);
          const y1 = 620;
          const x2 = x;
          const y2 = 668;
          return (
            <svg
              key={i}
              width={1080}
              height={1080}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x1 + (x2 - x1) * draw}
                y2={y1 + (y2 - y1) * draw}
                stroke={COLORS.line}
                strokeWidth={3}
                strokeDasharray="7 8"
                strokeLinecap="round"
              />
            </svg>
          );
        })}

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 950,
            textAlign: "center",
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.12,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 14}px)`,
            opacity: pay,
          }}
        >
          …and it&rsquo;s{" "}
          <Hl progress={paySweep} color={COLORS.greenLite} rot={-1.1}>
            completely free
          </Hl>
          .
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
