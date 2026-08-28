import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadMonoFont } from "@remotion/google-fonts/IBMPlexMono";
import { FONT_MONO, FONT_SERIF, POLSIA, SPRINGS, WORLD } from "./theme";

loadSerif("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
loadMonoFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 140;

// ---------------------------------------------------------------------------
// World layout (world coordinates; camera travels through this)
// ---------------------------------------------------------------------------
const CARD_W = 520;
const CARD_H = 600;
const MONTH_CX = 760;
const CARD_CY = 640;
const HOUR_START_X = 760; // fully hidden behind the /MONTH card
const HOUR_END_X = 1360;
const BTN_CY = 1012;

const ease = Easing.inOut(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// Price card — serif $49, hairline editorial rule, mono sublabel
// ---------------------------------------------------------------------------
const PriceCard: React.FC<{
  bg: string;
  sub: string;
  subColor: string;
  shadow: string;
  numScale: number;
  numOpacity: number;
  ruleW: number;
  subOpacity: number;
  subShift: number;
}> = ({ bg, sub, subColor, shadow, numScale, numOpacity, ruleW, subOpacity, subShift }) => {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        backgroundColor: bg,
        border: `1px solid ${WORLD.border}`,
        borderRadius: WORLD.radius,
        boxShadow: shadow,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontSize: 210,
          fontWeight: 500,
          color: POLSIA.ink,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          transform: `scale(${numScale})`,
          opacity: numOpacity,
          fontVariantNumeric: "tabular-nums lining-nums",
        }}
      >
        <span style={{ fontSize: "0.52em", verticalAlign: "0.5em", marginRight: 6 }}>$</span>
        49
      </div>
      <div
        style={{
          width: ruleW,
          height: 2,
          backgroundColor: POLSIA.rule,
          marginTop: 36,
          marginBottom: 28,
        }}
      />
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "0.22em",
          paddingLeft: "0.22em",
          color: subColor,
          opacity: subOpacity,
          transform: `translateY(${subShift}px)`,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const PoP7FortyNine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Camera: hold tight → pull out to two cards → hold (contrast plays) →
  // drift to the winner lockup → hold. Two near-identical end keys.
  const KEY_T = [0, 34, 52, 88, 106, 122, 139];
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = interpolate(frame, KEY_T, [760, 760, 1060, 1060, 960, 960, 960], camOpts);
  const fy = interpolate(frame, KEY_T, [620, 620, 640, 640, 695, 695, 695], camOpts);
  const z = interpolate(frame, KEY_T, [1.25, 1.25, 0.82, 0.82, 0.9, 0.9, 0.9], camOpts);

  // --- Open: $49 already scaling in at f0 (spring pre-rolled 4 frames) ----
  const numIn = spring({ frame: frame + 4, fps, config: { damping: 14, stiffness: 120 } });
  const numScale = 0.82 + 0.18 * numIn;
  const numOpacity = interpolate(frame, [0, 6], [0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleW = interpolate(frame, [6, 18], [0, 120], {
    easing: easeOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subShift = interpolate(frame, [10, 22], [10, 0], {
    easing: easeOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Contrast: /HOUR card slides out from behind the winner ------------
  const slide = spring({
    frame: Math.max(0, frame - 46),
    fps,
    config: { damping: 16, stiffness: 130 },
  });
  const hourX = HOUR_START_X + (HOUR_END_X - HOUR_START_X) * slide;
  const hourOpacity = interpolate(frame, [40, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideP = interpolate(hourX, [HOUR_START_X, HOUR_END_X], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- The loss: tilt back, recede, dim (f76–f92) ------------------------
  const lose = interpolate(frame, [76, 92], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hourTx = -85 * lose;
  const hourScale = 1 - 0.18 * lose;
  const hourRotY = -8 * lose;
  const hourRotX = 4 * lose;
  const hourVeil = 0.55 * lose;
  const hourShadowA = 0.1 * slideP * (1 - lose);
  const hourShadow = `0 18px 50px rgba(20, 18, 12, ${hourShadowA}), 0 2px 8px rgba(20, 18, 12, ${
    hourShadowA * 0.5
  })`;

  // --- The win: pop forward with shadow lift ------------------------------
  const pop = spring({ frame: Math.max(0, frame - 76), fps, config: SPRINGS.snappy });
  const monthScale = 1 + 0.06 * pop;
  const monthShadow = `0 ${18 + 10 * pop}px ${50 + 22 * pop}px rgba(20, 18, 12, ${
    0.1 + 0.05 * pop
  }), 0 2px 8px rgba(20, 18, 12, 0.05)`;

  // --- Lockup: GET STARTED chip + breathing orange dot --------------------
  const btnOpacity = interpolate(frame, [104, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnY = interpolate(frame, [104, 116], [16, 0], {
    easing: easeOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const press = interpolate(frame, [118, 123, 129], [1, 0.965, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = Math.sin((frame - 104) / 8);
  const dotOpacity = 0.85 + 0.15 * breathe;
  const dotScale = 1 + 0.12 * breathe;

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 2200,
          height: 1400,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Losing card — /HOUR (behind, slides out, then tilts back) */}
        <div
          style={{
            position: "absolute",
            left: hourX - CARD_W / 2,
            top: CARD_CY - CARD_H / 2,
            zIndex: 1,
            opacity: hourOpacity,
            transform: `perspective(1200px) translateX(${hourTx}px) scale(${hourScale}) rotateY(${hourRotY}deg) rotateX(${hourRotX}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          <div style={{ position: "relative" }}>
            <PriceCard
              bg={POLSIA.cardGray}
              sub="/ HOUR"
              subColor={POLSIA.grayText}
              shadow={hourShadow}
              numScale={1}
              numOpacity={1}
              ruleW={120}
              subOpacity={1}
              subShift={0}
            />
            {/* wash toward the paper as it loses */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: WORLD.radius,
                backgroundColor: `rgba(247, 246, 243, ${hourVeil})`,
              }}
            />
          </div>
        </div>

        {/* Winning card — /MONTH */}
        <div
          style={{
            position: "absolute",
            left: MONTH_CX - CARD_W / 2,
            top: CARD_CY - CARD_H / 2,
            zIndex: 2,
            transform: `scale(${monthScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <PriceCard
            bg={WORLD.card}
            sub="/ MONTH"
            subColor={POLSIA.ink}
            shadow={monthShadow}
            numScale={numScale}
            numOpacity={numOpacity}
            ruleW={ruleW}
            subOpacity={subOpacity}
            subShift={subShift}
          />
        </div>

        {/* GET STARTED chip — the real mono button, dark gradient */}
        <div
          style={{
            position: "absolute",
            left: MONTH_CX,
            top: BTN_CY,
            zIndex: 2,
            opacity: btnOpacity,
            transform: `translate(-50%, -50%) translateY(${btnY}px) scale(${press})`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: POLSIA.btnBg,
              border: `1px solid ${POLSIA.ink}`,
              borderRadius: 6,
              padding: "20px 40px",
              boxShadow: "0 10px 24px rgba(20, 18, 12, 0.18)",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: POLSIA.orange,
                opacity: dotOpacity,
                transform: `scale(${dotScale})`,
              }}
            />
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "0.18em",
                color: POLSIA.btnText,
              }}
            >
              GET STARTED
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
