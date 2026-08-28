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

// "Claude writes each script, adds the emotion tags, and sends everything
//  straight to Fish Audio's S2.1 Pro through the API."
// Fish 3 series look: warm peach paper, white cards, ink details, coral Claude.
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  border: "#F0E4DC",
  coral: "#D97757",
  coralBg: "rgba(217,119,87,0.10)",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

// ---- world layout -------------------------------------------------------------
// Vertical world, 1080 wide x ~2600 tall. Claude window on top, connector,
// Fish Audio S2.1 Pro card below.
const CLAUDE = { x: 110, y: 300, w: 860, h: 950 };
const FISH = { x: 150, y: 1810, w: 780, h: 510 };
const INNER_X = CLAUDE.x + 80; // script/text left edge inside the Claude card

// script rows: emotion tag chip on its own line, script text under it
const ROWS = [
  { tag: "(excited)", text: "Okay, this watch is unreal.", chipY: 300, textY: 352 },
  { tag: "(whispering)", text: "Three-day battery. Seriously.", chipY: 425, textY: 477 },
  { tag: "(warm)", text: "Go see it for yourself.", chipY: 550, textY: 602 },
];

// ---- timing -------------------------------------------------------------------
const TYPE = [
  { start: 8, rate: 1.0 },
  { start: 36, rate: 1.0 },
  { start: 64, rate: 1.0 },
];
const TAG_AT = [92, 102, 112];
const TOOL_AT = 120;
const DEPART = 134; // packet leaves the Claude card
const ARRIVE = 168; // packet lands on the Fish card
const OK_AT = 174;

// deterministic waveform bar height for the Fish card
const N_BARS = 32;
const CORAL_BARS = new Set([5, 6, 7, 14, 15, 16, 24, 25, 26]);
const barH = (i: number, f: number) => {
  const t = f * 0.28;
  let v =
    0.36 +
    0.38 * Math.abs(Math.sin(i * 0.52 + t)) +
    0.26 * Math.abs(Math.sin(i * 1.4 - t * 0.7));
  v *= 0.55 + 0.45 * Math.sin((i / (N_BARS - 1)) * Math.PI);
  return Math.max(0.1, Math.min(1, v));
};

const Starburst: React.FC<{ size: number }> = ({ size }) => (
  <Img
    src={staticFile("fable5/claude-logo.png")}
    style={{ width: size, height: size, display: "block" }}
  />
);

export const FishClaudeEmotionTags: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 56, 88, 116, 130, 138, 168, 204, 218, 231];
  const fy = interpolate(
    frame,
    KEY,
    [660, 700, 760, 780, 830, 830, 1990, 1990, 2010, 2012],
    camOpts,
  );
  let z = interpolate(
    frame,
    KEY,
    [1.32, 1.32, 1.3, 1.28, 1.12, 1.12, 1.16, 1.16, 1.11, 1.11],
    camOpts,
  );
  // impact kicks: each tag landing + packet landing
  for (const at of [...TAG_AT, ARRIVE]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.013 * Math.exp(-d / 3);
  }
  const fx = 540;

  // ---- typing state ----
  const typedChars = ROWS.map((r, i) =>
    Math.min(r.text.length, Math.floor(Math.max(0, frame - TYPE[i].start) * TYPE[i].rate)),
  );
  const typingRow = typedChars.findIndex(
    (n, i) => n < ROWS[i].text.length && frame >= TYPE[i].start,
  );
  const caretOn = Math.floor(frame / 8) % 2 === 0;

  // ---- packet ----
  const travel = p(frame, DEPART, ARRIVE, ease);
  const packetY = interpolate(travel, [0, 1], [CLAUDE.y + CLAUDE.h + 16, FISH.y - 14]);
  const packetVisible = frame >= DEPART && frame < ARRIVE + 2;

  // ---- fish card life ----
  const fishAlive = frame >= ARRIVE;
  const fishPulse = spring({
    frame: Math.max(0, frame - ARRIVE),
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const playProg = fishAlive ? ((frame - ARRIVE) % 90) / 90 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FDF6F0", fontFamily: inter }}>
      {/* warm peach field, matching the Fish 3 series */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(900px 700px at 82% 10%, rgba(247,205,188,0.85), rgba(247,205,188,0) 60%),
            radial-gradient(800px 900px at 12% 90%, rgba(250,227,211,0.9), rgba(250,227,211,0) 55%),
            radial-gradient(700px 600px at 8% 8%, rgba(244,214,199,0.5), rgba(244,214,199,0) 60%),
            linear-gradient(168deg, #FDF6F0 0%, #FAE9DE 100%)`,
        }}
      />
      {/* faint grid lines, series texture */}
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.16 }}>
        {[270, 540, 810].map((v) => (
          <line key={`v${v}`} x1={v} y1={0} x2={v} y2={1920} stroke="#E8CDBC" strokeWidth={1} />
        ))}
        {[384, 768, 1152, 1536].map((h) => (
          <line key={`h${h}`} x1={0} y1={h} x2={1080} y2={h} stroke="#E8CDBC" strokeWidth={1} />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${z})`,
        }}
      >
        {/* ================= Claude window ================= */}
        <div
          style={{
            position: "absolute",
            left: CLAUDE.x,
            top: CLAUDE.y,
            width: CLAUDE.w,
            height: CLAUDE.h,
            borderRadius: 30,
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: "0 26px 60px rgba(32,21,21,0.14)",
          }}
        >
          {/* window header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 84,
              display: "flex",
              alignItems: "center",
              padding: "0 36px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <Starburst size={40} />
            <div
              style={{
                marginLeft: 16,
                fontSize: 34,
                fontWeight: 700,
                color: C.ink,
                letterSpacing: -0.5,
              }}
            >
              Claude
            </div>
            <div style={{ flex: 1 }} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: C.muted,
                  opacity: 0.5,
                  marginLeft: 7,
                }}
              />
            ))}
          </div>

          {/* user prompt pill */}
          <div
            style={{
              position: "absolute",
              top: 120,
              right: 40,
              backgroundColor: "#F7E9DF",
              borderRadius: 22,
              padding: "16px 26px",
              fontSize: 28,
              fontWeight: 600,
              color: C.ink,
              opacity: p(frame, 2, 12),
            }}
          >
            voice the watch ad. make it human.
          </div>

          {/* claude avatar for the reply */}
          <div style={{ position: "absolute", top: 236, left: 40 }}>
            <Starburst size={32} />
          </div>

          {/* script rows: tag chip + typed line */}
          {ROWS.map((row, i) => {
            const tagS = spring({
              frame: Math.max(0, frame - TAG_AT[i]),
              fps,
              config: { damping: 12, stiffness: 170 },
            });
            const started = frame >= TYPE[i].start;
            return (
              <React.Fragment key={i}>
                {frame >= TAG_AT[i] ? (
                  <div
                    style={{
                      position: "absolute",
                      left: INNER_X - CLAUDE.x,
                      top: row.chipY,
                      backgroundColor: C.coralBg,
                      border: `1.5px solid ${C.coral}`,
                      borderRadius: 999,
                      padding: "7px 18px",
                      fontFamily: mono,
                      fontWeight: 700,
                      fontSize: 28,
                      color: C.coral,
                      transform: `scale(${tagS}) rotate(${(1 - tagS) * -4}deg)`,
                      transformOrigin: "left center",
                    }}
                  >
                    {row.tag}
                  </div>
                ) : null}
                {started ? (
                  <div
                    style={{
                      position: "absolute",
                      left: INNER_X - CLAUDE.x,
                      top: row.textY,
                      fontSize: 36,
                      fontWeight: 600,
                      color: C.ink,
                      whiteSpace: "nowrap",
                      letterSpacing: -0.3,
                    }}
                  >
                    {row.text.slice(0, typedChars[i])}
                    {typingRow === i ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: 4,
                          height: 36,
                          marginLeft: 3,
                          verticalAlign: "middle",
                          backgroundColor: C.coral,
                          opacity: caretOn ? 1 : 0,
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* tool call row — Claude sends it through the API itself */}
          {frame >= TOOL_AT ? (
            <div
              style={{
                position: "absolute",
                left: INNER_X - CLAUDE.x,
                top: 700,
                display: "flex",
                alignItems: "center",
                gap: 14,
                backgroundColor: "#FBF5F0",
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "14px 22px",
                opacity: p(frame, TOOL_AT, TOOL_AT + 8),
                transform: `translateY(${(1 - spring({
                  frame: Math.max(0, frame - TOOL_AT),
                  fps,
                  config: { damping: 15, stiffness: 160 },
                })) * 18}px)`,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: C.coral,
                  opacity:
                    frame < ARRIVE ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.5)) : 1,
                }}
              />
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: 30,
                  color: C.ink,
                }}
              >
                POST api.fish.audio/v1/tts
              </div>
            </div>
          ) : null}

          {/* composer chrome */}
          <div
            style={{
              position: "absolute",
              left: 36,
              right: 36,
              top: 830,
              height: 80,
              borderRadius: 999,
              border: `1.5px solid ${C.border}`,
              backgroundColor: "#FDFAF7",
              display: "flex",
              alignItems: "center",
              padding: "0 14px 0 30px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 500, color: C.muted }}>
              Reply to Claude…
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: C.coral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={24} height={26} viewBox="0 0 24 26">
                <path
                  d="M12 24 L12 4 M4 12 L12 3 L20 12"
                  stroke="#fff"
                  strokeWidth={3.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ================= connector + packet ================= */}
        {frame >= DEPART ? (
          <>
            <div
              style={{
                position: "absolute",
                left: 538,
                top: CLAUDE.y + CLAUDE.h + 10,
                width: 4,
                height: Math.max(0, packetY - (CLAUDE.y + CLAUDE.h + 10)),
                borderRadius: 2,
                backgroundColor: C.coral,
                opacity: 0.45,
              }}
            />
            {packetVisible ? (
              <div
                style={{
                  position: "absolute",
                  left: 540,
                  top: packetY,
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
          </>
        ) : null}

        {/* 200 OK — pops when the request lands */}
        {frame >= OK_AT ? (
          <div
            style={{
              position: "absolute",
              left: 596,
              top: FISH.y - 76,
              backgroundColor: C.greenBg,
              border: `1.5px solid ${C.greenBorder}`,
              borderRadius: 999,
              padding: "6px 16px",
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 24,
              color: C.green,
              whiteSpace: "nowrap",
              transform: `scale(${spring({
                frame: Math.max(0, frame - OK_AT),
                fps,
                config: { damping: 12, stiffness: 180 },
              })})`,
              transformOrigin: "left bottom",
            }}
          >
            200 OK
          </div>
        ) : null}

        {/* ================= Fish Audio S2.1 Pro card ================= */}
        <div
          style={{
            position: "absolute",
            left: FISH.x,
            top: FISH.y,
            width: FISH.w,
            height: FISH.h,
            borderRadius: 30,
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: "0 26px 60px rgba(32,21,21,0.14)",
            transform: `scale(${1 + 0.02 * Math.sin(Math.min(1, fishPulse) * Math.PI)})`,
          }}
        >
          {/* header */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 40,
              right: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Img
              src={staticFile("fish-audio/logo-light.png")}
              style={{ height: 40, width: "auto", display: "block" }}
            />
            <div style={{ flex: 1 }} />
            <div
              style={{
                border: `2px solid ${C.coral}`,
                borderRadius: 999,
                padding: "8px 20px",
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 26,
                color: C.coral,
                backgroundColor: fishAlive ? C.coralBg : "transparent",
              }}
            >
              S2.1 PRO
            </div>
          </div>

          {/* waveform */}
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              top: 140,
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {Array.from({ length: N_BARS }, (_, i) => {
              if (!fishAlive) {
                return (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: "#E9DED6",
                    }}
                  />
                );
              }
              const grow = p(frame, ARRIVE + i * 0.6, ARRIVE + 10 + i * 0.6);
              const coral = CORAL_BARS.has(i);
              const h = Math.max(8, barH(i, frame) * 190 * grow * (coral ? 1.12 : 1));
              return (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: h,
                    borderRadius: 5,
                    backgroundColor: coral ? C.coral : C.ink,
                    opacity: coral ? 1 : 0.85,
                  }}
                />
              );
            })}
          </div>

          {/* playback line */}
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              bottom: 62,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#EFE5DD",
            }}
          >
            <div
              style={{
                width: `${playProg * 100}%`,
                height: "100%",
                borderRadius: 3,
                backgroundColor: C.coral,
              }}
            />
            {fishAlive ? (
              <div
                style={{
                  position: "absolute",
                  left: `${playProg * 100}%`,
                  top: -6,
                  width: 18,
                  height: 18,
                  marginLeft: -9,
                  borderRadius: "50%",
                  backgroundColor: C.card,
                  border: `2px solid ${C.coral}`,
                  boxShadow: "0 2px 8px rgba(32,21,21,0.2)",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
