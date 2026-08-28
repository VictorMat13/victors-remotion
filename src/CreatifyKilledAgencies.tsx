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
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";

const { fontFamily: inter } = loadInter();
const { fontFamily: cinzel } = loadCinzel();

export const DURATION_IN_FRAMES = 105;

// Promptible "white / paper" style — accent recolored to Creatify purple
const COLORS = {
  accent: "#ff4f01",
  accentDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8B8594",
  paper: "#fbfbf9",
  line: "#ece8e3",
  stoneTop: "#EEEFF2",
  stoneMid: "#DFE1E7",
  stoneBot: "#C6C9D2",
  engrave: "#7D8290",
};

const CX = 720;
const F_LAND = 30; // stone hits the ground

// short decaying impact shake
const shakeY = (frame: number) => {
  const t = frame - F_LAND;
  if (t < 0 || t > 14) return 0;
  return 4 * Math.exp(-t / 4) * Math.sin(t * 1.9);
};

// -------------------------------------------------------------------------
// Paper background — soft purple glow + masked grid (Promptible signature)
// -------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(1150px 800px at 50% 60%, rgba(255,79,1,0.10), rgba(255,79,1,0) 60%)",
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
          "radial-gradient(920px 760px at 50% 56%, #000 35%, transparent 82%)",
        maskImage:
          "radial-gradient(920px 760px at 50% 56%, #000 35%, transparent 82%)",
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
  rot: number;
}> = ({ children, progress, rot }) => (
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
        background: COLORS.accent,
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
// Engraved text — carved into light granite (dark fill + white bottom bevel)
// -------------------------------------------------------------------------
const Engrave: React.FC<{
  children: React.ReactNode;
  y: number;
  size: number;
  weight?: number;
  spacing?: number;
  opacity: number;
  ty: number;
}> = ({ children, y, size, weight = 700, spacing = 2, opacity, ty }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: y,
      textAlign: "center",
      fontFamily: cinzel,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: spacing,
      color: COLORS.engrave,
      textShadow:
        "0 1px 0 rgba(255,255,255,0.9), 0 -1px 1px rgba(70,74,88,0.28)",
      opacity,
      transform: `translateY(${ty}px)`,
    }}
  >
    {children}
  </div>
);

export const CreatifyKilledAgencies: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // intro
  const introBlur = interpolate(frame, [0, 12], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker + headline
  const kicker = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const line1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const line2 = spring({
    frame: frame - 11,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const hl = interpolate(frame, [22, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // logo pop (Submagic-style core)
  const logoIn = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const logoFloat = frame > 40 ? Math.sin((frame - 40) / 15) * 2.5 : 0;

  // stone drop
  const drop = spring({
    frame: frame - 12,
    fps,
    config: { damping: 15, stiffness: 120, mass: 1 },
  });
  const stoneY = (1 - drop) * -560;
  const sy = shakeY(frame);

  // dust
  const dust = interpolate(
    frame,
    [F_LAND, F_LAND + 6, F_LAND + 22],
    [0, 0.7, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const dustScale = interpolate(frame, [F_LAND, F_LAND + 22], [0.4, 1.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // engraving reveal
  const eng = (delay: number) =>
    interpolate(frame, [F_LAND + delay, F_LAND + delay + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

  // payoff
  const pay = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background />

      {/* content mapped into a top-safe band (15% top padding, ~4% bottom) */}
      <AbsoluteFill
        style={{
          opacity: introOpacity,
          filter: `blur(${introBlur}px)`,
          transform: "translateY(33px) scale(0.978)",
          transformOrigin: "50% 0%",
        }}
      >
        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 132,
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
              color: COLORS.accentDeep,
              padding: "8px 16px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.accent,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            The ad agency is dead
          </div>
        </div>

        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 194,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 64,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: -1.5,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - line1) * 20}px)`,
              opacity: line1,
            }}
          >
            Creatify just{" "}
            <Hl progress={hl} rot={-1.2}>
              killed
            </Hl>
          </div>
          <div
            style={{
              transform: `translateY(${(1 - line2) * 20}px)`,
              opacity: line2,
            }}
          >
            ad agencies.
          </div>
        </div>

        {/* ---------- CREATIFY LOGO (killer, floating over the grave) ---------- */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: 424 + logoFloat,
            width: 116,
            height: 116,
            transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * logoIn})`,
            opacity: logoIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -64,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,79,1,0.22), rgba(255,79,1,0) 62%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -40,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.16)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              border: "2px solid rgba(255,79,1,0.28)",
            }}
          />
          <Img
            src={staticFile("creatify-logo.png")}
            style={{
              width: 116,
              height: 116,
              borderRadius: 26,
              display: "block",
              border: "1px solid #ece8e3",
              boxShadow:
                "0 20px 44px rgba(255,79,1,0.28), 0 6px 16px rgba(27,23,32,0.12)",
            }}
          />
        </div>

        {/* ---------- CONTACT SHADOW ---------- */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: 936,
            width: 460,
            height: 40,
            transform: `translate(-50%,-50%) scaleY(${0.4 + 0.6 * drop})`,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(27,23,32,0.16), rgba(27,23,32,0) 78%)",
            opacity: drop,
          }}
        />

        {/* ---------- TOMBSTONE (with impact shake) ---------- */}
        <div style={{ transform: `translateY(${stoneY + sy}px)` }}>
          <svg
            width={1440}
            height={1080}
            viewBox="0 0 1440 1080"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              <linearGradient id="stoneFill" x1="0" y1="0" x2="0.1" y2="1">
                <stop offset="0" stopColor={COLORS.stoneTop} />
                <stop offset="0.55" stopColor={COLORS.stoneMid} />
                <stop offset="1" stopColor={COLORS.stoneBot} />
              </linearGradient>
              <linearGradient id="plinthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#D3D6DE" />
                <stop offset="1" stopColor="#B7BBC6" />
              </linearGradient>
            </defs>

            {/* plinth */}
            <rect
              x="512"
              y="888"
              width="416"
              height="54"
              rx="8"
              fill="url(#plinthFill)"
            />
            <rect
              x="512"
              y="888"
              width="416"
              height="5"
              rx="2.5"
              fill="rgba(255,255,255,0.6)"
            />

            {/* headstone */}
            <path
              d="M544,890 L544,640 C544,505 896,505 896,640 L896,890 Z"
              fill="url(#stoneFill)"
              stroke="rgba(27,23,32,0.10)"
              strokeWidth="1.5"
            />
            {/* top rim light */}
            <path
              d="M558,640 C558,516 882,516 882,640"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="2.5"
            />
            {/* inner groove */}
            <path
              d="M582,876 L582,650 C582,538 858,538 858,650 L858,876 Z"
              fill="none"
              stroke="rgba(27,23,32,0.08)"
              strokeWidth="2"
            />
          </svg>

          {/* engraved cross */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 556,
              textAlign: "center",
              fontFamily: cinzel,
              fontSize: 36,
              color: COLORS.engrave,
              textShadow:
                "0 1px 0 rgba(255,255,255,0.9), 0 -1px 1px rgba(70,74,88,0.25)",
              opacity: eng(6),
            }}
          >
            †
          </div>

          <Engrave
            y={604}
            size={58}
            spacing={6}
            opacity={eng(9)}
            ty={(1 - eng(9)) * 8}
          >
            R.I.P.
          </Engrave>

          {/* engraved divider */}
          <div
            style={{
              position: "absolute",
              left: CX - 140,
              top: 682,
              width: 280,
              height: 2,
              background: "rgba(27,23,32,0.14)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8)",
              opacity: eng(12),
              transform: `scaleX(${eng(12)})`,
            }}
          />

          <Engrave
            y={706}
            size={38}
            spacing={4}
            opacity={eng(15)}
            ty={(1 - eng(15)) * 8}
          >
            AD AGENCIES
          </Engrave>

          <Engrave
            y={770}
            size={25}
            weight={400}
            spacing={3}
            opacity={eng(20)}
            ty={(1 - eng(20)) * 8}
          >
            1841 &nbsp;–&nbsp; 2026
          </Engrave>

          <Engrave
            y={836}
            size={18}
            weight={400}
            spacing={1}
            opacity={eng(26) * 0.92}
            ty={(1 - eng(26)) * 8}
          >
            billed by the hour
          </Engrave>

          {/* dust puffs */}
          {[-140, -55, 40, 140].map((dx, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: CX + dx,
                top: 905,
                width: 140,
                height: 84,
                transform: `translate(-50%,-50%) scale(${dustScale * (0.8 + i * 0.12)})`,
                borderRadius: "50%",
                background:
                  "radial-gradient(closest-side, rgba(150,154,166,0.45), rgba(150,154,166,0) 72%)",
                opacity: dust * (i % 2 === 0 ? 1 : 0.75),
              }}
            />
          ))}
        </div>

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 992,
            textAlign: "center",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -0.4,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 14}px)`,
            opacity: pay,
          }}
        >
          Cause of death:{" "}
          <span style={{ color: COLORS.accent }}>Creatify.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
