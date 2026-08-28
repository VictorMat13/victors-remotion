import React from "react";
import {
  AbsoluteFill,
  Loop,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 210;

const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  idleBg: "#F4F1ED",
  idleText: "#9A938C",
  // inspiration-site palette (the "style" being transferred)
  navy: "#1E1B4B",
  violet: "#7C3AED",
  lavender: "#EDE9FE",
  softBg: "#FAF9FF",
};

// ---------- layout ----------
const INSP = { x: 150, y: 452, w: 780, h: 420 };
const PAGE = { x: 150, y: 1096, w: 780, h: 560 };
const PROMPT_Y = 946;
const STAMPS_Y = 1730;

// ---------- timeline ----------
const TOKEN_LAUNCH = [48, 58, 68, 78];
const FLIGHT = 22;
const LAND = TOKEN_LAUNCH.map((f) => f + FLIGHT);
const STAMP_1 = 118;
const STAMP_2 = 128;
const VIDEO_LOOP_FRAMES = 121; // 4.04s @ 30fps

type Token = {
  label: React.ReactNode;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

const lerpHex = (t: number, from: string, to: string) => {
  const c = Math.min(Math.max(t, 0), 1);
  const p = (h: string): [number, number, number] => {
    const s = h.replace("#", "");
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  };
  const f = p(from);
  const g = p(to);
  return `rgb(${Math.round(f[0] + (g[0] - f[0]) * c)},${Math.round(
    f[1] + (g[1] - f[1]) * c,
  )},${Math.round(f[2] + (g[2] - f[2]) * c)})`;
};

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 1200px at 50% 52%, rgba(255,79,1,0.07), rgba(255,79,1,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(760px 1120px at 50% 50%, #000 45%, transparent 85%)",
        maskImage:
          "radial-gradient(760px 1120px at 50% 50%, #000 45%, transparent 85%)",
      }}
    />
  </AbsoluteFill>
);

const BrowserBar: React.FC<{ url: string; accent?: string }> = ({
  url,
  accent,
}) => (
  <div
    style={{
      height: 54,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px",
      background: "#ffffff",
      borderBottom: `1.5px solid ${COLORS.line}`,
    }}
  >
    <div style={{ display: "flex", gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#FF5F57",
        }}
      />
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#FEBC2E",
        }}
      />
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#28C840",
        }}
      />
    </div>
    <div
      style={{
        flex: 1,
        height: 32,
        borderRadius: 999,
        background: COLORS.idleBg,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        fontSize: 19,
        fontWeight: 600,
        color: accent ?? COLORS.muted,
      }}
    >
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
      >
        <rect x="5" y="10" width="14" height="10" rx="2.5" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      </svg>
      {url}
    </div>
  </div>
);

const CardLabel: React.FC<{ text: string; dot: string; in_: number }> = ({
  text,
  dot,
  in_,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: 2.4,
      textTransform: "uppercase",
      color: COLORS.muted,
      transform: `translateY(${(1 - in_) * 12}px)`,
      opacity: in_,
    }}
  >
    <span
      style={{ width: 9, height: 9, borderRadius: "50%", background: dot }}
    />
    {text}
  </div>
);

// the inspiration site — its own distinctive style, split layout
const InspirationSite: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <BrowserBar url="lumenstudio.com" />
    <div
      style={{
        flex: 1,
        background: COLORS.softBg,
        padding: "22px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            background: COLORS.violet,
          }}
        />
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: COLORS.navy,
            letterSpacing: -0.4,
          }}
        >
          Lumen
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          {[44, 56, 38].map((w, i) => (
            <span
              key={i}
              style={{
                width: w,
                height: 10,
                borderRadius: 5,
                background: COLORS.lavender,
              }}
            />
          ))}
        </div>
      </div>
      {/* split hero */}
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        <div
          style={{
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: COLORS.navy,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Design that breathes
          </span>
          <span
            style={{
              width: "78%",
              height: 12,
              borderRadius: 6,
              background: COLORS.lavender,
            }}
          />
          <span
            style={{
              width: "56%",
              height: 12,
              borderRadius: 6,
              background: COLORS.lavender,
            }}
          />
          <span
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
              fontSize: 21,
              fontWeight: 700,
              color: "#ffffff",
              background: COLORS.violet,
              borderRadius: 999,
              padding: "12px 26px",
            }}
          >
            Explore
          </span>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 22,
            background: `linear-gradient(150deg, ${COLORS.violet}, ${COLORS.navy})`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <span style={{ fontSize: 46, color: "#ffffff" }}>✦</span>
        </div>
      </div>
      {/* card row */}
      <div style={{ display: "flex", gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 58,
              borderRadius: 16,
              background: "#ffffff",
              border: `1.5px solid ${COLORS.lavender}`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

// "your page" — different layout (centered stack), restyles as tokens land
const YourPage: React.FC<{
  sPalette: number;
  sType: number;
  sRadius: number;
  sGradient: number;
}> = ({ sPalette, sType, sRadius, sGradient }) => {
  const accent = lerpHex(sPalette, "#B4ADA6", COLORS.violet);
  const bodyBg = lerpHex(sPalette, "#ffffff", COLORS.softBg);
  const headColor = lerpHex(sType, "#9A938C", COLORS.navy);
  const radius = 8 + 12 * sRadius;
  const chipBorder = lerpHex(sPalette, COLORS.line, "#DDD3FA");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <BrowserBar url="aisolutions.app" />
      {/* hero video */}
      <div
        style={{
          position: "relative",
          height: 236,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Loop durationInFrames={VIDEO_LOOP_FRAMES} layout="none">
          <OffthreadVideo
            src={staticFile("ai-solutions-demo.mp4")}
            muted
            style={{ width: "100%", height: 236, objectFit: "cover" }}
          />
        </Loop>
        {/* violet gradient wash — arrives with the gradient token */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(124,58,237,0) 30%, rgba(124,58,237,0.55))`,
            opacity: sGradient,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -0.6,
              textShadow: "0 2px 12px rgba(0,0,0,0.45)",
            }}
          >
            AI Solutions
          </span>
        </div>
      </div>
      {/* body */}
      <div
        style={{
          flex: 1,
          background: bodyBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "18px 26px",
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: headColor,
            letterSpacing: -0.7,
            textAlign: "center",
          }}
        >
          Automation that sells for you
        </span>
        <span
          style={{
            width: "52%",
            height: 11,
            borderRadius: 6,
            background: lerpHex(sPalette, COLORS.idleBg, COLORS.lavender),
          }}
        />
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 999,
            marginTop: 4,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: 23,
              fontWeight: 700,
              color: "#ffffff",
              background: accent,
              padding: "14px 34px",
            }}
          >
            Get started
          </span>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.navy})`,
              opacity: sGradient,
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ fontSize: 23, fontWeight: 700, color: "#ffffff" }}>
              Get started
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          {["AI agents", "Automations", "Chatbots"].map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: lerpHex(sType, "#9A938C", COLORS.navy),
                background: "#ffffff",
                border: `1.5px solid ${chipBorder}`,
                borderRadius: radius,
                padding: "9px 18px",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StyleMatchTransfer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 12], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const head1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const head2 = spring({
    frame: frame - 11,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const inspIn = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 130 },
  });
  const pageIn = spring({
    frame: frame - 21,
    fps,
    config: { damping: 15, stiffness: 130 },
  });
  const promptIn = spring({
    frame: frame - 32,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // restyle progress per token
  const sPalette = spring({
    frame: frame - LAND[0],
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const sType = spring({
    frame: frame - LAND[1],
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const sRadius = spring({
    frame: frame - LAND[2],
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const sGradient = spring({
    frame: frame - LAND[3],
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const stamp1 = spring({
    frame: frame - STAMP_1,
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const stamp2 = spring({
    frame: frame - STAMP_2,
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  const TOKENS: Token[] = [
    {
      label: (
        <div style={{ display: "flex", gap: 7 }}>
          {[COLORS.violet, COLORS.navy, "#C4B5FD"].map((c) => (
            <span
              key={c}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
      ),
      start: { x: 300, y: 830 },
      end: { x: 540, y: 1520 },
    },
    {
      label: (
        <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy }}>
          Aa{" "}
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.muted }}>
            Type
          </span>
        </span>
      ),
      start: { x: 470, y: 830 },
      end: { x: 540, y: 1440 },
    },
    {
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth={2.6}
            strokeLinecap="round"
          >
            <path d="M4 20v-6a10 10 0 0 1 10-10h6" />
          </svg>
          <span style={{ fontSize: 19, fontWeight: 700, color: COLORS.navy }}>
            Corners
          </span>
        </span>
      ),
      start: { x: 640, y: 830 },
      end: { x: 380, y: 1590 },
    },
    {
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.navy})`,
            }}
          />
          <span style={{ fontSize: 19, fontWeight: 700, color: COLORS.navy }}>
            Gradient
          </span>
        </span>
      ),
      start: { x: 790, y: 830 },
      end: { x: 540, y: 1300 },
    },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background />

      <AbsoluteFill
        style={{ opacity: introOpacity, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- kicker ---------- */}
        <div
          style={{
            position: "absolute",
            top: 128,
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
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orangeDeep,
              padding: "9px 18px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.9 + 0.1 * kicker})`,
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
            Step 2
          </div>
        </div>

        {/* ---------- headline ---------- */}
        <div
          style={{
            position: "absolute",
            top: 204,
            left: 60,
            right: 60,
            textAlign: "center",
            fontSize: 66,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: -1.6,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - head1) * 18}px)`,
              opacity: head1,
            }}
          >
            Match the style
          </div>
          <div
            style={{
              transform: `translateY(${(1 - head2) * 18}px)`,
              opacity: head2,
            }}
          >
            <span style={{ color: COLORS.orange }}>without copying it</span>
          </div>
        </div>

        {/* ---------- inspiration card ---------- */}
        <div style={{ position: "absolute", left: INSP.x, top: INSP.y - 46 }}>
          <CardLabel text="A site you love" dot={COLORS.violet} in_={inspIn} />
        </div>
        <div
          style={{
            position: "absolute",
            left: INSP.x,
            top: INSP.y,
            width: INSP.w,
            height: INSP.h,
            borderRadius: 24,
            overflow: "hidden",
            background: "#ffffff",
            border: `1.5px solid ${COLORS.line}`,
            boxShadow: "0 24px 55px rgba(32,21,21,0.11)",
            transform: `translateY(${(1 - inspIn) * 36}px) scale(${0.94 + 0.06 * inspIn})`,
            opacity: inspIn,
          }}
        >
          <InspirationSite />
        </div>

        {/* ---------- prompt pill ---------- */}
        <div
          style={{
            position: "absolute",
            top: PROMPT_Y,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${(1 - promptIn) * 16}px)`,
            opacity: promptIn,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              fontSize: 25,
              fontWeight: 700,
              color: COLORS.ink,
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 999,
              padding: "14px 28px",
              boxShadow: "0 14px 32px rgba(32,21,21,0.10)",
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: COLORS.orange,
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              R
            </span>
            <span>
              Replit:{" "}
              <span style={{ color: COLORS.orangeDeep }}>
                match this style, don&apos;t copy it
              </span>
            </span>
          </div>
        </div>

        {/* ---------- your page card ---------- */}
        <div style={{ position: "absolute", left: PAGE.x, top: PAGE.y - 46 }}>
          <CardLabel text="Your page" dot={COLORS.orange} in_={pageIn} />
        </div>
        <div
          style={{
            position: "absolute",
            left: PAGE.x,
            top: PAGE.y,
            width: PAGE.w,
            height: PAGE.h,
            borderRadius: 24,
            overflow: "hidden",
            background: "#ffffff",
            border: `1.5px solid ${lerpHex(sPalette, COLORS.line, "#DDD3FA")}`,
            boxShadow:
              sGradient > 0.4
                ? "0 28px 62px rgba(124,58,237,0.20)"
                : "0 24px 55px rgba(32,21,21,0.11)",
            transform: `translateY(${(1 - pageIn) * 36}px) scale(${0.94 + 0.06 * pageIn})`,
            opacity: pageIn,
          }}
        >
          <YourPage
            sPalette={sPalette}
            sType={sType}
            sRadius={sRadius}
            sGradient={sGradient}
          />
        </div>

        {/* ---------- flying tokens ---------- */}
        {TOKENS.map((t, i) => {
          const flight = spring({
            frame: frame - TOKEN_LAUNCH[i],
            fps,
            config: { damping: 18, stiffness: 105 },
          });
          const visible = frame >= TOKEN_LAUNCH[i] - 2;
          const fadeOut = interpolate(
            frame,
            [LAND[i] + 2, LAND[i] + 10],
            [1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          if (!visible || fadeOut <= 0) return null;
          const x = t.start.x + (t.end.x - t.start.x) * flight;
          const y = t.start.y + (t.end.y - t.start.y) * flight;
          const arc = Math.sin(Math.PI * flight) * -46;
          const pop = interpolate(flight, [0, 0.15], [0.6, 1], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y + arc,
                transform: `translate(-50%,-50%) scale(${pop})`,
                opacity: Math.min(flight * 6, 1) * fadeOut,
                background: "#ffffff",
                border: `1.5px solid #DDD3FA`,
                borderRadius: 999,
                padding: "12px 22px",
                boxShadow: "0 14px 34px rgba(124,58,237,0.22)",
                display: "flex",
                alignItems: "center",
                zIndex: 5,
              }}
            >
              {t.label}
            </div>
          );
        })}

        {/* ---------- landing ripples ---------- */}
        {TOKENS.map((t, i) => {
          const p = interpolate(frame, [LAND[i], LAND[i] + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (p <= 0 || p >= 1) return null;
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                left: t.end.x,
                top: t.end.y,
                width: 90,
                height: 90,
                transform: `translate(-50%,-50%) scale(${0.4 + 1.3 * p})`,
                borderRadius: "50%",
                border: `3px solid rgba(124,58,237,${0.55 * (1 - p)})`,
                zIndex: 4,
              }}
            />
          );
        })}

        {/* ---------- payoff stamps ---------- */}
        <div
          style={{
            position: "absolute",
            top: STAMPS_Y,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 27,
              fontWeight: 700,
              color: COLORS.violet,
              background: "rgba(124,58,237,0.07)",
              border: "1.5px solid rgba(124,58,237,0.35)",
              borderRadius: 999,
              padding: "14px 28px",
              transform: `translateY(${(1 - stamp1) * 16}px) scale(${0.9 + 0.1 * stamp1})`,
              opacity: stamp1,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9.5"
                stroke={COLORS.violet}
                strokeWidth={1.8}
              />
              <path
                d="m8 12.2 2.7 2.7L16 9.6"
                stroke={COLORS.violet}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Style matched
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 27,
              fontWeight: 700,
              color: COLORS.orangeDeep,
              background: "rgba(255,79,1,0.06)",
              border: "1.5px solid rgba(255,79,1,0.32)",
              borderRadius: 999,
              padding: "14px 28px",
              transform: `translateY(${(1 - stamp2) * 16}px) scale(${0.9 + 0.1 * stamp2})`,
              opacity: stamp2,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9.5"
                stroke={COLORS.orange}
                strokeWidth={1.8}
              />
              <path
                d="m9 9 6 6M15 9l-6 6"
                stroke={COLORS.orange}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            Not a copy
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
