import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 232;

// "When one flops, change the angle in Claude and S2.1 Pro generates another
//  voiceover immediately."
// Fish 3 series look: warm peach paper, white cards, ink details, coral Claude.
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  border: "#F0E4DC",
  coral: "#D97757",
  coralBg: "rgba(217,119,87,0.10)",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
};

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fmt = (n: number) => n.toLocaleString("en-US");

// ---- world layout -------------------------------------------------------------
const CARD = { x: 380, y: 160, w: 320, h: 620 }; // the variant card (series anatomy)
const VID = { x: CARD.x + 12, y: CARD.y + 12, w: 296, h: 470 };
const PILL = { x: 200, y: 798, w: 680, h: 84 }; // claude prompt pill

// ---- timing -------------------------------------------------------------------
const FLOP_AT = 12; // red down-trend pops
const PILL_AT = 44;
const TYPE_START = 52;
const PROMPT = "scrap it. lead with the health tracker.";
const DEPART = 100; // request chip leaves the pill
const LAND = 130; // lands on the card
const CLIMB_START = 140;
const CLIMB_END = 204;

const FLOP_VIEWS = 4218;
const NEW_VIEWS = 9862;

const MiniBars: React.FC<{ f: number; color: string }> = ({ f, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
    {Array.from({ length: 5 }, (_, b) => (
      <div
        key={b}
        style={{
          width: 4,
          height: 8 + (Math.sin(f * 0.2 + b * 1.1) * 0.5 + 0.5) * 14,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    ))}
  </div>
);

export const FishFlopNewAngle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 20, 40, 52, 96, 104, 128, 148, 204, 218, 231];
  const fy = interpolate(
    frame,
    KEY,
    [690, 690, 470, 760, 760, 600, 600, 470, 470, 480, 480],
    camOpts,
  );
  let z = interpolate(
    frame,
    KEY,
    [1.5, 1.5, 1.15, 1.32, 1.32, 1.12, 1.12, 1.24, 1.24, 1.18, 1.18],
    camOpts,
  );
  for (const at of [FLOP_AT, LAND]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.014 * Math.exp(-d / 3);
  }
  const fx = 540;

  // ---- flop / revive state ----
  const flopChip = spring({
    frame: Math.max(0, frame - FLOP_AT),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const revive = p(frame, LAND, LAND + 14, ease);
  const reviveS = spring({
    frame: Math.max(0, frame - LAND),
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const grade = 0.55 * (1 - revive); // grayscale amount while flopped

  // ---- claude pill ----
  const pillIn = spring({
    frame: Math.max(0, frame - PILL_AT),
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const typed = Math.min(
    PROMPT.length,
    Math.floor(Math.max(0, frame - TYPE_START) * 0.9),
  );
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const emit = p(frame, DEPART - 2, DEPART + 8);

  // ---- request chip flight: pill → card, arcing left ----
  const t = p(frame, DEPART, LAND, ease);
  const flightX = lerp(320, 470, t) - Math.sin(t * Math.PI) * 220;
  const flightY = lerp(820, 215, t);
  const inFlight = frame >= DEPART && frame < LAND;

  // ---- counter ----
  const climb = interpolate(frame, [CLIMB_START, CLIMB_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const newCount = Math.floor(NEW_VIEWS * climb);
  const counterSwap = p(frame, LAND + 4, LAND + 14);

  // strikethrough on the dead hook label
  const strike = p(frame, LAND + 6, LAND + 16, Easing.out(Easing.cubic));

  return (
    <AbsoluteFill style={{ backgroundColor: "#FDF6F0", fontFamily: inter }}>
      {/* warm peach field, matching the Fish 3 series */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(900px 700px at 82% 12%, rgba(247,205,188,0.85), rgba(247,205,188,0) 60%),
            radial-gradient(800px 800px at 12% 88%, rgba(250,227,211,0.9), rgba(250,227,211,0) 55%),
            radial-gradient(700px 600px at 8% 8%, rgba(244,214,199,0.5), rgba(244,214,199,0) 60%),
            linear-gradient(160deg, #FDF6F0 0%, #FAE9DE 100%)`,
        }}
      />
      {/* faint grid lines, series texture */}
      <svg width={1080} height={1080} style={{ position: "absolute", opacity: 0.16 }}>
        {[270, 540, 810].map((v) => (
          <React.Fragment key={v}>
            <line x1={v} y1={0} x2={v} y2={1080} stroke="#E8CDBC" strokeWidth={1} />
            <line x1={0} y1={v} x2={1080} y2={v} stroke="#E8CDBC" strokeWidth={1} />
          </React.Fragment>
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
        }}
      >
        {/* ================= the ad variant card ================= */}
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            borderRadius: 22,
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 48px rgba(32,21,21,0.14)",
            transform: `scale(${1 + 0.035 * Math.min(1, reviveS)})`,
            opacity: p(frame, 0, 8),
          }}
        >
          {/* coral ring on revive */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              border: `3px solid ${C.coral}`,
              opacity: Math.min(1, reviveS),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* footage: flopped take, crossfades to the new one */}
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              width: VID.w,
              height: VID.h,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#2A1E19",
            }}
          >
            <OffthreadVideo
              muted
              src={staticFile("fish-audio/watch-ad-1.mp4")}
              startFrom={4}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: `grayscale(${grade}) saturate(${1 - grade * 0.5})`,
              }}
            />
            {frame >= LAND - 6 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: revive,
                }}
              >
                <Sequence from={LAND - 6} layout="none">
                  <OffthreadVideo
                    muted
                    src={staticFile("fish-audio/watch-ad-2.mp4")}
                    startFrom={20}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Sequence>
              </div>
            ) : null}
            {/* new voiceover badge, stamped by the landing request */}
            {frame >= LAND ? (
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1.5px solid ${C.border}`,
                  boxShadow: "0 10px 24px rgba(32,21,21,0.2)",
                  padding: "10px 14px",
                  transform: `scale(${reviveS})`,
                  transformOrigin: "top left",
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    backgroundColor: C.coral,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: 20,
                    color: C.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  hook-11.mp3
                </div>
                <MiniBars f={frame - LAND} color={C.coral} />
              </div>
            ) : null}
          </div>

          {/* hook label — struck through once the new take lands */}
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 1 - strike * 0.55,
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                backgroundColor: strike > 0 ? C.muted : C.coral,
              }}
            />
            <div
              style={{
                position: "relative",
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 21,
                color: C.ink,
                whiteSpace: "nowrap",
              }}
            >
              hook-01.mp3
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "52%",
                  width: `${strike * 100}%`,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: C.coral,
                }}
              />
            </div>
          </div>

          {/* counter: stalled + red trend, swaps to climbing coral */}
          <div style={{ position: "absolute", left: 12, top: 540 }}>
            {/* flopped state */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: 1 - counterSwap,
                transform: `translateY(${counterSwap * 16}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 42,
                  color: C.ink,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(FLOP_VIEWS)}
              </div>
              <div
                style={{
                  fontFamily: inter,
                  fontWeight: 600,
                  fontSize: 20,
                  color: C.muted,
                }}
              >
                views
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: C.redBg,
                  border: `1.5px solid ${C.redBorder}`,
                  borderRadius: 999,
                  padding: "4px 12px",
                  transform: `scale(${flopChip})`,
                }}
              >
                <svg width={16} height={16} viewBox="0 0 16 16">
                  <path
                    d="M2 5 L8 12 L14 5"
                    stroke={C.red}
                    strokeWidth={2.6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  style={{
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: 20,
                    color: C.red,
                  }}
                >
                  0.4%
                </div>
              </div>
            </div>
            {/* revived state */}
            {frame >= LAND + 4 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: counterSwap,
                  transform: `translateY(${(1 - counterSwap) * -16}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: 42,
                    color: C.coral,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmt(newCount)}
                </div>
                <div
                  style={{
                    fontFamily: inter,
                    fontWeight: 600,
                    fontSize: 20,
                    color: C.muted,
                  }}
                >
                  views
                </div>
                <svg width={20} height={20} viewBox="0 0 16 16">
                  <path
                    d="M2 11 L8 4 L14 11"
                    stroke={C.coral}
                    strokeWidth={2.6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : null}
          </div>
        </div>

        {/* ================= claude prompt pill ================= */}
        {pillIn > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: PILL.x,
              top: PILL.y,
              width: PILL.w,
              height: PILL.h,
              borderRadius: 999,
              backgroundColor: C.card,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(32,21,21,0.14)",
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 30px",
              opacity: Math.min(1, pillIn),
              transform: `translateY(${(1 - pillIn) * 40}px) scale(${1 - 0.04 * Math.sin(emit * Math.PI)})`,
            }}
          >
            <Img
              src={staticFile("fable5/claude-logo.png")}
              style={{ width: 42, height: 42, flexShrink: 0 }}
            />
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: C.ink,
                whiteSpace: "nowrap",
              }}
            >
              {PROMPT.slice(0, typed)}
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 32,
                  marginLeft: 4,
                  verticalAlign: "middle",
                  backgroundColor: C.coral,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* ================= s2.1-pro request in flight ================= */}
        {inFlight ? (
          <div
            style={{
              position: "absolute",
              left: flightX,
              top: flightY,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 999,
              padding: "12px 24px",
              boxShadow: "0 14px 34px rgba(32,21,21,0.16)",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: C.coral,
              }}
            />
            <div
              style={{
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 28,
                color: C.ink,
                whiteSpace: "nowrap",
              }}
            >
              s2.1-pro
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
