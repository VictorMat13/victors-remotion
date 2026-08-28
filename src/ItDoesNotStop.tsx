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

export const DURATION_IN_FRAMES = 220;

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  line: "#ece8e3",
  chip: "#3f3833",
  orange: "#ff4f01", // Liam accent orange
  orangeLite: "#ff7a3c",
  greenInk: "#16A34A",
  green: "#22C55E",
};

// -------- layout ----------
const RAIL_Y = 612;
const VIDEO_START_X = 720; // centered (section 1)
const VIDEO_END_X = 252; // parked left (section 2)
const RAIL_START_X = 396;
const RAIL_END_X = 1288;

type Platform = { key: "meta" | "tiktok" | "google"; name: string; x: number };
const PLATFORMS: Platform[] = [
  { key: "meta", name: "Meta", x: 648 },
  { key: "tiktok", name: "TikTok", x: 918 },
  { key: "google", name: "Google", x: 1188 },
];

// -------- timing ----------
const VIDEO_APPEAR = 16;
const RENDER_A = 26;
const RENDER_B = 58;
const SLIDE_A = 84; // card starts moving left
const RAIL_A = 104;
const RAIL_B = 128;
const PKT_A = 122;
const PKT_B = 190;
const PAY_A = 192;

// -------- safe-area padding (foreground inset; bg stays full-bleed) --------
const PAD = 0.1; // 10% padding on left / right / top
const SAFE_S = 1 - 2 * PAD; // scale content into the inner box -> 0.8
const SAFE_X = 1440 * PAD; // 144px
const SAFE_Y = 1080 * PAD; // 108px

// =========================================================================
// Background — paper + purple radial glow + masked graph grid
// =========================================================================
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(1120px 820px at 50% 56%, rgba(255,79,1,0.08), rgba(255,79,1,0) 60%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(32,21,21,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.025) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        WebkitMaskImage:
          "radial-gradient(960px 780px at 50% 56%, #000 40%, transparent 84%)",
        maskImage:
          "radial-gradient(960px 780px at 50% 56%, #000 40%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// =========================================================================
// Highlight-swept keyword (Liam marker underline behind a word)
// =========================================================================
const Mark: React.FC<{
  children: React.ReactNode;
  sweep: number;
  color: string;
}> = ({ children, sweep, color }) => (
  <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: -8,
        right: -8,
        top: "16%",
        bottom: "8%",
        background: color,
        opacity: 0.24,
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

export const ItDoesNotStop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- kicker ----
  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  // ---- headlines (crossfade) ----
  const hl1Op = interpolate(frame, [8, 22, 86, 98], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hl1Rise = spring({
    frame: frame - 8,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl1Sweep = interpolate(frame, [26, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const hl2Op = interpolate(frame, [96, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hl2Rise = spring({
    frame: frame - 96,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl2Sweep = interpolate(frame, [116, 134], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ---- video card: appear, render, slide left ----
  const appear = spring({
    frame: frame - VIDEO_APPEAR,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const render = interpolate(frame, [RENDER_A, RENDER_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rendered = frame >= RENDER_B;
  const checkPop = spring({
    frame: frame - RENDER_B,
    fps,
    config: { damping: 11, stiffness: 200 },
  });

  const slide = spring({
    frame: frame - SLIDE_A,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const videoX = interpolate(slide, [0, 1], [VIDEO_START_X, VIDEO_END_X]);
  const videoScale = interpolate(slide, [0, 1], [1, 0.78]);

  // ---- rail draw ----
  const railProg = interpolate(frame, [RAIL_A, RAIL_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const RAIL_LEN = RAIL_END_X - RAIL_START_X;

  // ---- packet along the rail ----
  const pktT = interpolate(frame, [PKT_A, PKT_B], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const pkx = interpolate(pktT, [0, 1], [RAIL_START_X, PLATFORMS[2].x]);
  const pktOp = interpolate(
    frame,
    [PKT_A, PKT_A + 6, PKT_B - 4, PKT_B],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // ---- payoff line ----
  const pay = spring({
    frame: frame - PAY_A,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <AbsoluteFill
        style={{
          opacity: introOp,
          filter: `blur(${introBlur}px)`,
          transform: `translate(${SAFE_X}px, ${SAFE_Y}px) scale(${SAFE_S})`,
          transformOrigin: "0 0",
        }}
      >
        {/* ============ KICKER ============ */}
        <div
          style={{
            position: "absolute",
            top: 150,
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
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orange,
              padding: "8px 16px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.06)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.92 + 0.08 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            Made with Creatify
          </div>
        </div>

        {/* ============ HEADLINES (crossfade) ============ */}
        <div
          style={{
            position: "absolute",
            top: 214,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          {/* HL1 */}
          <h1
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              margin: 0,
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: -1.6,
              color: COLORS.ink,
              opacity: hl1Op,
              transform: `translateY(${(1 - hl1Rise) * 18}px)`,
            }}
          >
            It doesn&rsquo;t{" "}
            <Mark sweep={hl1Sweep} color={COLORS.orange}>
              stop
            </Mark>{" "}
            at the video.
          </h1>
          {/* HL2 */}
          <h1
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              margin: 0,
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: -1.6,
              color: COLORS.ink,
              opacity: hl2Op,
              transform: `translateY(${(1 - hl2Rise) * 18}px)`,
            }}
          >
            It{" "}
            <Mark sweep={hl2Sweep} color={COLORS.orange}>
              connects
            </Mark>{" "}
            everywhere.
          </h1>
        </div>

        {/* ============ RAIL (behind chips) ============ */}
        <svg
          width={1440}
          height={1080}
          viewBox="0 0 1440 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient
              id="rail"
              gradientUnits="userSpaceOnUse"
              x1={RAIL_START_X}
              y1={RAIL_Y}
              x2={RAIL_END_X}
              y2={RAIL_Y}
            >
              <stop offset="0" stopColor={COLORS.orange} stopOpacity="0.9" />
              <stop
                offset="1"
                stopColor={COLORS.orangeLite}
                stopOpacity="0.55"
              />
            </linearGradient>
          </defs>
          <path
            d={`M ${RAIL_START_X} ${RAIL_Y} L ${RAIL_END_X} ${RAIL_Y}`}
            fill="none"
            stroke="url(#rail)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={RAIL_LEN}
            strokeDashoffset={RAIL_LEN * (1 - railProg)}
          />
          {/* traveling packet (the video being delivered) */}
          <circle
            cx={pkx}
            cy={RAIL_Y}
            r={17}
            fill={COLORS.orange}
            opacity={0.16 * pktOp}
          />
          <circle
            cx={pkx}
            cy={RAIL_Y}
            r={8}
            fill={COLORS.orange}
            opacity={pktOp}
          />
        </svg>

        {/* ============ VIDEO CARD (hero -> left node) ============ */}
        <div
          style={{
            position: "absolute",
            left: videoX,
            top: RAIL_Y,
            width: 340,
            transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * appear) * videoScale})`,
            opacity: appear,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${COLORS.line}`,
              borderRadius: 22,
              padding: 16,
              boxShadow: "0 22px 48px rgba(32,21,21,0.12)",
            }}
          >
            {/* poster / preview */}
            <div
              style={{
                position: "relative",
                height: 176,
                borderRadius: 14,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, #ff4f01 0%, #ff7a3c 52%, #ffb27a 100%)",
              }}
            >
              {/* soft light sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(120% 90% at 20% 12%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)",
                }}
              />
              {/* play button */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 62,
                  height: 62,
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.92)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    marginLeft: 5,
                    borderTop: "13px solid transparent",
                    borderBottom: "13px solid transparent",
                    borderLeft: `20px solid ${COLORS.ink}`,
                  }}
                />
              </div>
              {/* filename chip */}
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  padding: "5px 10px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.28)",
                  backdropFilter: "blur(4px)",
                }}
              >
                ugc_ad_final.mp4
              </div>
            </div>

            {/* render status row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 14,
              }}
            >
              {/* progress track */}
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 999,
                  background: "#f1eef6",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${render * 100}%`,
                    borderRadius: 999,
                    background: rendered ? COLORS.green : COLORS.orange,
                  }}
                />
              </div>
              {/* label */}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  color: rendered ? COLORS.greenInk : COLORS.muted,
                  transform: `scale(${rendered ? 1 + 0.08 * Math.max(0, 1 - checkPop) : 1})`,
                }}
              >
                {rendered ? "✓ Rendered" : `${Math.round(render * 100)}%`}
              </div>
            </div>
          </div>
          {/* Creatify tag under the card */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              opacity: 0.85,
            }}
          >
            <Img
              src={staticFile("creatify-fav.png")}
              style={{ width: 22, height: 22, borderRadius: 6 }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: COLORS.ink,
                letterSpacing: -0.3,
              }}
            >
              Creatify
            </span>
          </div>
        </div>

        {/* ============ PLATFORM CHIPS ============ */}
        {PLATFORMS.map((p, i) => {
          const appearFrame = 106 + i * 16;
          const s = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 13, stiffness: 160 },
          });
          // activation as packet passes chip center
          const act = interpolate(pkx, [p.x - 46, p.x + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const pulse = interpolate(act, [0.75, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const lift = -6 * act;
          const ICON = 138;
          return (
            <div
              key={p.key}
              style={{
                position: "absolute",
                left: p.x,
                top: RAIL_Y + lift,
                transform: `translate(-50%,-50%) scale(${0.72 + 0.28 * s})`,
                opacity: s,
              }}
            >
              {/* app-icon tile */}
              <div
                style={{
                  position: "relative",
                  width: ICON,
                  height: ICON,
                  borderRadius: 34,
                  background: "#fff",
                  border: `1px solid ${act > 0.5 ? "rgba(255,79,1,0.45)" : COLORS.line}`,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 22px 46px rgba(32,21,21,0.13)${
                    act > 0.5
                      ? `, 0 0 0 ${(5 * act).toFixed(1)}px rgba(255,79,1,0.10)`
                      : ""
                  }`,
                }}
              >
                <Img
                  src={staticFile(`logos/${p.key}.svg`)}
                  style={{
                    width: p.key === "tiktok" ? ICON * 0.5 : ICON * 0.58,
                    height: p.key === "tiktok" ? ICON * 0.5 : ICON * 0.58,
                    objectFit: "contain",
                  }}
                />
                {/* status dot */}
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: -12,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: act > 0.5 ? COLORS.green : "#e7e2dc",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 900,
                    display: "grid",
                    placeItems: "center",
                    boxShadow:
                      act > 0.5
                        ? `0 0 0 ${(3 + 7 * pulse).toFixed(1)}px rgba(34,197,94,${(0.22 * (1 - pulse)).toFixed(3)})`
                        : "none",
                    transform: `scale(${0.6 + 0.4 * Math.min(1, act * 1.4)})`,
                  }}
                >
                  {act > 0.5 ? "✓" : ""}
                </div>
                {/* name underneath */}
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: 18,
                    fontSize: 33,
                    fontWeight: 800,
                    color: COLORS.ink,
                    letterSpacing: -0.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* ============ PAYOFF LINE ============ */}
        <div
          style={{
            position: "absolute",
            top: 828,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: pay,
            transform: `translateY(${(1 - pay) * 14}px)`,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -0.4,
              color: COLORS.ink,
              padding: "12px 22px",
              borderRadius: 16,
              background: "#fff",
              border: `1px solid ${COLORS.line}`,
              boxShadow: "0 14px 30px rgba(32,21,21,0.08)",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: COLORS.green,
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                display: "grid",
                placeItems: "center",
              }}
            >
              ✓
            </span>
            Published everywhere &mdash; automatically.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
