import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { ASSETS, FONT_MONO, FONT_SERIF, LIVE, POLSIA, WORLD } from "./theme";

loadSerif();
loadMono();

// PoP6 — "grab this link": the hidden /live page revealed.
// f0-54 tight on the URL pill typing itself; f54-76 pull out to the browser
// card playing the REAL /live capture; f100-150 push in while it scrolls;
// f150-260 recreated feed fragments pop with parallax; f262-339 settle hold.
export const DURATION_IN_FRAMES = 340;

const W = 1080;
const H = 1920;
const ease = Easing.inOut(Easing.cubic);
const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// ---- world layout (world == 1080x1920, camera zooms within) ----
const PILL_CY = 382;
const CARD_X = 84;
const CARD_W = W - CARD_X * 2; // 912
const CARD_TOP = 486;
const CHROME_H = 84;
const BODY_H = 950;

const URL_TEXT = "polsia.com/live";
const CARD_IN = 56;
const VIDEO_TRIM = 60; // skip the capture's static first 2s

const FRAG_A_IN = 150;
const FRAG_B_IN = 168;
const FRAG_C_IN = 186;
const SETTLE_START = 258;
const SETTLE_END = 298;

const OrangeDot: React.FC<{ size: number; frame: number; phase?: number }> = ({
  size,
  frame,
  phase = 0,
}) => {
  const pulse = 1 + 0.14 * Math.sin(frame * 0.22 + phase);
  const t = ((frame + phase * 7) % 44) / 44;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${POLSIA.orange}`,
          transform: `scale(${1 + t * 1.7})`,
          opacity: (1 - t) * 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          backgroundColor: POLSIA.orange,
          transform: `scale(${pulse})`,
        }}
      />
    </div>
  );
};

export const PoP6WatchLive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera rig: hold -> pull out -> hold -> slow push -> hold -> settle ----
  const KEY_T = [0, 54, 76, 100, 150, 262, 300, 339];
  const fy = interpolate(
    frame,
    KEY_T,
    [PILL_CY, PILL_CY, 960, 960, 1002, 1002, 978, 978],
    { easing: ease, extrapolateRight: "clamp" },
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.55, 1.55, 1.0, 1.0, 1.058, 1.058, 1.04, 1.04],
    { easing: ease, extrapolateRight: "clamp" },
  );
  const fx = W / 2;

  // ---- URL pill typing (already animating at f0) ----
  const typedChars = Math.max(
    1,
    Math.floor(interpolate(frame, [0, 42], [1, URL_TEXT.length], clamp)),
  );
  const typed = URL_TEXT.slice(0, typedChars);
  const typing = frame < 46;
  const caretOn = typing || frame % 26 < 15;
  const ruleProgress = interpolate(frame, [6, 48], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  // ---- browser card assembly ----
  const cardS = spring({
    frame: frame - CARD_IN,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const cardOpacity = interpolate(frame, [CARD_IN, CARD_IN + 10], [0, 1], clamp);
  const videoOpacity = interpolate(
    frame,
    [CARD_IN + 4, CARD_IN + 18],
    [0, 1],
    clamp,
  );
  const trafficLight = (i: number) =>
    spring({
      frame: frame - (62 + i * 4),
      fps,
      config: { damping: 12, stiffness: 200 },
    });
  const chromeDetail = interpolate(frame, [70, 82], [0, 1], clamp);

  // ---- floating feed fragments ----
  const settle = interpolate(frame, [SETTLE_START, SETTLE_END], [1, 0], {
    easing: ease,
    ...clamp,
  });
  const fragPop = (at: number) => ({
    s: spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 170 } }),
    o: interpolate(frame, [at, at + 8], [0, 1], clamp),
  });
  const fragA = fragPop(FRAG_A_IN);
  const fragB = fragPop(FRAG_B_IN);
  const fragC = fragPop(FRAG_C_IN);
  const driftA = Math.sin(frame * 0.045) * 7 * settle;
  const driftB = Math.sin(frame * 0.038 + Math.PI / 2) * 8 * settle;
  const driftBx = Math.sin(frame * 0.03 + 1.1) * 4 * settle;
  const driftC = Math.sin(frame * 0.05 + Math.PI) * 6 * settle;

  const stat = LIVE.stats[0];
  const statValue = Math.round(
    interpolate(frame, [FRAG_C_IN, FRAG_C_IN + 58], [21412, stat.value], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    }),
  );

  const fragCardBase: React.CSSProperties = {
    position: "absolute",
    backgroundColor: WORLD.card,
    border: `1px solid ${WORLD.border}`,
    borderRadius: 18,
    boxShadow: "0 16px 44px rgba(20, 18, 12, 0.14), 0 3px 10px rgba(20, 18, 12, 0.06)",
    zIndex: 5,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      {/* soft paper highlight — decorative, full bleed */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 70% at 50% 38%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 62%)",
        }}
      />

      {/* camera world */}
      <div
        style={{
          position: "absolute",
          width: W,
          height: H,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---- URL pill ---- */}
        <div
          style={{
            position: "absolute",
            top: PILL_CY - 48,
            left: 0,
            width: W,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              backgroundColor: WORLD.card,
              border: `2px solid ${POLSIA.ink}`,
              borderRadius: 999,
              padding: "24px 42px",
              boxShadow: WORLD.shadowSoft,
            }}
          >
            <OrangeDot size={20} frame={frame} />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 44,
                letterSpacing: 1,
                color: POLSIA.ink,
                whiteSpace: "pre",
                display: "flex",
                alignItems: "center",
              }}
            >
              {typed}
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 46,
                  marginLeft: 6,
                  backgroundColor: POLSIA.ink,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>
        {/* editorial rule drawing under the pill */}
        <div
          style={{
            position: "absolute",
            top: PILL_CY + 76,
            left: W / 2 - 210,
            width: 420,
            height: 3,
            backgroundColor: POLSIA.rule,
            transform: `scaleX(${ruleProgress})`,
          }}
        />

        {/* ---- browser-chrome card with the REAL /live capture ---- */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_TOP,
            width: CARD_W,
            height: CHROME_H + BODY_H,
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: POLSIA.paper,
            border: `1px solid ${WORLD.border}`,
            boxShadow: WORLD.shadow,
            opacity: cardOpacity,
            transform: `translateY(${(1 - cardS) * 30}px) scale(${0.955 + 0.045 * cardS})`,
            transformOrigin: "50% 30%",
          }}
        >
          {/* chrome bar */}
          <div
            style={{
              height: CHROME_H,
              backgroundColor: "#FCFBF9",
              borderBottom: `1px solid #ECEAE5`,
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              gap: 12,
            }}
          >
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => (
              <div
                key={c}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: c,
                  transform: `scale(${trafficLight(i)})`,
                }}
              />
            ))}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                opacity: chromeDetail,
                transform: `translateY(${(1 - chromeDetail) * 6}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: "#F1EFEA",
                  borderRadius: 12,
                  padding: "10px 34px",
                  fontFamily: FONT_MONO,
                  fontSize: 26,
                  letterSpacing: 1,
                  color: "#3D3B37",
                }}
              >
                {URL_TEXT}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: chromeDetail,
              }}
            >
              <OrangeDot size={11} frame={frame} phase={2} />
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  letterSpacing: 3,
                  color: POLSIA.ink,
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          {/* real capture, portrait crop on the face/Business/Tasks columns */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: BODY_H,
              backgroundColor: POLSIA.paper,
            }}
          >
            <Sequence from={CARD_IN} layout="none">
              <OffthreadVideo
                muted
                src={staticFile(ASSETS.liveCapture)}
                trimBefore={VIDEO_TRIM}
                playbackRate={1.5}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "left center",
                  opacity: videoOpacity,
                }}
              />
            </Sequence>
          </div>
        </div>

        {/* ---- fragment A: Companies row (real data) ---- */}
        <div
          style={{
            ...fragCardBase,
            left: 96,
            top: 600,
            width: 412,
            padding: "26px 32px 22px",
            opacity: fragA.o,
            transform: `translateY(${(1 - fragA.s) * 26 + driftA}px) scale(${0.86 + 0.14 * fragA.s})`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 30,
              fontWeight: 700,
              color: POLSIA.ink,
              paddingBottom: 10,
              borderBottom: `2px solid ${POLSIA.rule}`,
            }}
          >
            Companies
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingTop: 18,
            }}
          >
            <span
              style={{ fontFamily: FONT_SERIF, fontSize: 40, color: POLSIA.ink }}
            >
              {LIVE.companies[0]}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 22,
                letterSpacing: 1,
                color: POLSIA.grayText,
              }}
            >
              2M AGO
            </span>
          </div>
        </div>

        {/* ---- fragment B: task card with mono tag chip ---- */}
        <div
          style={{
            ...fragCardBase,
            left: 510,
            top: 1010,
            width: 480,
            borderRadius: 10,
            border: `2px solid ${POLSIA.ink}`,
            backgroundColor: POLSIA.cardGray,
            padding: "26px 30px",
            opacity: fragB.o,
            transform: `translate(${driftBx}px, ${(1 - fragB.s) * 26 + driftB}px) scale(${0.86 + 0.14 * fragB.s})`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 31,
              fontWeight: 700,
              lineHeight: 1.25,
              color: POLSIA.ink,
            }}
          >
            Identify early customer segments and key c…
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 20,
                letterSpacing: 2,
                color: POLSIA.ink,
                backgroundColor: POLSIA.paper,
                border: `1px solid #9B978F`,
                borderRadius: 4,
                padding: "7px 14px",
              }}
            >
              {LIVE.tags[0]}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 20,
                letterSpacing: 1,
                color: POLSIA.grayText,
              }}
            >
              35D AGO
            </span>
          </div>
        </div>

        {/* ---- fragment C: ticking Business stat (real data) ---- */}
        <div
          style={{
            ...fragCardBase,
            left: 104,
            top: 1392,
            width: 664,
            padding: "26px 32px",
            opacity: fragC.o,
            transform: `translateY(${(1 - fragC.s) * 26 + driftC}px) scale(${0.86 + 0.14 * fragC.s})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{ fontFamily: FONT_SERIF, fontSize: 32, color: POLSIA.ink }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 40,
                fontWeight: 700,
                color: POLSIA.ink,
                display: "inline-block",
                width: 150,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {statValue.toLocaleString("en-US")}
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 20,
                letterSpacing: 1,
                color: POLSIA.grayText,
              }}
            >
              (+19% WOW)
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
