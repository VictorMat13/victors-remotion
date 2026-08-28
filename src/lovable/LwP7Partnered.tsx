import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

// Part 7 — "That's why I partnered with Lovable and Wispr Flow." (1:1)
// Sponsor payoff: the two real logo cards lock together, a connector pulse
// links them, and the real wpm race (45 vs 220, wisprflow.ai product data)
// proves the speed claim. No narration echo on screen.
export const DURATION_IN_FRAMES = 290;

const VIEW = 1080;
const ease = Easing.inOut(Easing.cubic);

// ---------------------------------------------------------------- world layout
const PAIR_Y = 370; // vertical center of the logo pair
const CARD_W = 330;
const CARD_H = 300;
const L_CARD_X = 150; // Lovable card 150..480
const R_CARD_X = 600; // Wispr card 600..930
const CONNECT_X0 = L_CARD_X + CARD_W; // 480
const CONNECT_X1 = R_CARD_X; // 600
const CONTACT = 86; // frame the pair locks

const PANEL_X = 150;
const PANEL_W = 780; // matches pair width -> reads as one locked unit
const PANEL_Y = 560;
const PANEL_H = 290;
const LABEL_X = 170; // label column 170..330, right aligned
const LABEL_W = 160;
const BAR_X = 350; // bars grow from here
const FLOW_W = 380; // full-scale bar width == 220 wpm
const KEYBOARD_W = Math.round((FLOW_W * WISPR.data.keyboardWpm) / WISPR.data.flowWpm); // 78
const ROW1_Y = 635; // Keyboard row center
const ROW2_Y = 775; // Flow row center
const BAR_H = 36;

// ---------------------------------------------------------------- camera
const KEY_T = [0, 40, 58, 104, 124, 200, 222, 284, 290];
const KEY_FX = [430, 430, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [370, 370, 385, 385, 460, 460, 540, 540, 540];
const KEY_Z = [1.3, 1.3, 1.18, 1.18, 1.12, 1.12, 1.0, 1.0, 1.0];

const LogoCard: React.FC<{
  x: number;
  slideOffset: number;
  rotate: number;
  children: React.ReactNode;
}> = ({ x, slideOffset, rotate, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: PAIR_Y - CARD_H / 2,
      width: CARD_W,
      height: CARD_H,
      transform: `translateX(${slideOffset}px) rotate(${rotate}deg)`,
      backgroundColor: WORLD.card,
      border: `1px solid ${WORLD.border}`,
      borderRadius: 28,
      boxShadow: WORLD.shadowSoft,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

export const LwP7Partnered: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera
  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- OPEN: Lovable card slides in from the left, already moving at f0
  const lovableP = spring({ frame: frame + 8, fps, config: SPRINGS.heavy });
  const lovableOffset = interpolate(lovableP, [0, 1], [-820, 0]);
  const lovableRot = -5 * (1 - lovableP);

  // ---- PAIR: Wispr card slides in from the right, locks at CONTACT
  const wisprP = spring({ frame: frame - 55, fps, config: SPRINGS.heavy });
  const wisprOffset = frame < 55 ? 820 : interpolate(wisprP, [0, 1], [820, 0]);
  const wisprRot = frame < 55 ? 5 : 5 * (1 - wisprP);

  // Shared shadow under the locked pair
  const lockShadowIn = interpolate(frame, [CONTACT, CONTACT + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Connector line draws on contact
  const connectorDraw = interpolate(frame, [CONTACT, CONTACT + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Traveling pulse: loops L->R forever after the line is drawn (keeps
  // breathing through the end hold)
  const PULSE_START = CONTACT + 18;
  const PULSE_PERIOD = 56;
  const pulseT =
    frame >= PULSE_START ? ((frame - PULSE_START) % PULSE_PERIOD) / PULSE_PERIOD : 0;
  const pulseOn = frame >= PULSE_START;
  const pulseX = CONNECT_X0 + pulseT * (CONNECT_X1 - CONNECT_X0);
  const pulseOpacity = pulseOn ? Math.sin(pulseT * Math.PI) * 0.9 : 0;
  const pulseColor = interpolateColors(
    pulseT,
    [0, 1],
    [LOVABLE.gradient[3], WISPR.green]
  );

  // ---- SPEED PROOF: panel rises below the pair
  const panelP = spring({
    frame: frame - 110,
    fps,
    config: { damping: 24, stiffness: 130 },
  });
  const panelY = frame < 110 ? 70 : (1 - panelP) * 70;
  const panelOpacity = interpolate(frame, [110, 124], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Keyboard bar: plain ease, no overshoot (the slow old way)
  const keyboardP = interpolate(frame, [126, 160], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Flow bar: snappy spring with a small overshoot, ~4.9x longer
  const flowP =
    frame < 132
      ? 0
      : spring({ frame: frame - 132, fps, config: { damping: 14, stiffness: 110 } });
  const keyboardW = keyboardP * KEYBOARD_W;
  const flowW = flowP * FLOW_W;
  const keyboardN = Math.round(Math.min(keyboardP, 1) * WISPR.data.keyboardWpm);
  const flowN = Math.round(Math.min(flowP, 1) * WISPR.data.flowWpm);

  const camTransform = `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`;

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          transform: camTransform,
          transformOrigin: `${fx}px ${fy}px`,
          width: VIEW,
          height: VIEW,
        }}
      >
        {/* Shared shadow under the locked pair */}
        <div
          style={{
            position: "absolute",
            left: 165,
            top: 503,
            width: 750,
            height: 70,
            opacity: lockShadowIn,
            transform: `scale(${0.7 + 0.3 * lockShadowIn})`,
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(20,18,12,0.13), rgba(20,18,12,0) 70%)",
          }}
        />

        {/* Connector line + traveling pulse */}
        <div
          style={{
            position: "absolute",
            left: CONNECT_X0,
            top: PAIR_Y - 2,
            width: CONNECT_X1 - CONNECT_X0,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#DEDBD4",
            transform: `scaleX(${connectorDraw})`,
            transformOrigin: "left center",
          }}
        />
        {pulseOn && (
          <>
            <div
              style={{
                position: "absolute",
                left: pulseX - 18,
                top: PAIR_Y - 18,
                width: 36,
                height: 36,
                borderRadius: 18,
                opacity: pulseOpacity * 0.45,
                background: `radial-gradient(50% 50% at 50% 50%, ${pulseColor}, rgba(0,0,0,0) 70%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: pulseX - 6,
                top: PAIR_Y - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                opacity: pulseOpacity,
                backgroundColor: pulseColor,
              }}
            />
          </>
        )}

        {/* Lovable heart card (official SVG, 256x228) */}
        <LogoCard x={L_CARD_X} slideOffset={lovableOffset} rotate={lovableRot}>
          <Img
            src={staticFile(LOVABLE.logoSvg)}
            style={{ width: 150, height: (150 * 228) / 256 }}
          />
        </LogoCard>

        {/* Wispr Flow wordmark card (official SVG, 82x23) */}
        <LogoCard x={R_CARD_X} slideOffset={wisprOffset} rotate={wisprRot}>
          <Img
            src={staticFile(WISPR.logoSvg)}
            style={{ width: 230, height: (230 * 23) / 82 }}
          />
        </LogoCard>

        {/* Speed-proof panel: real wisprflow.ai data (45 vs 220 wpm) */}
        <div
          style={{
            position: "absolute",
            left: PANEL_X,
            top: PANEL_Y,
            width: PANEL_W,
            height: PANEL_H,
            transform: `translateY(${panelY}px)`,
            opacity: panelOpacity,
            backgroundColor: WORLD.card,
            border: `1px solid ${WORLD.border}`,
            borderRadius: WORLD.radius,
            boxShadow: WORLD.shadowSoft,
          }}
        >
          {/* faint scale gridlines behind the bars */}
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: BAR_X - PANEL_X + t * FLOW_W,
                top: 46,
                width: 1,
                height: PANEL_H - 92,
                backgroundColor: "rgba(20, 18, 12, 0.05)",
              }}
            />
          ))}

          {[
            {
              label: "Keyboard",
              rowY: ROW1_Y,
              barW: keyboardW,
              value: keyboardN,
              barBg: WORLD.faint,
              labelColor: WORLD.muted,
              valueColor: WORLD.muted,
            },
            {
              label: "Flow",
              rowY: ROW2_Y,
              barW: flowW,
              value: flowN,
              barBg: `linear-gradient(90deg, ${WISPR.green}, #14655A)`,
              labelColor: WORLD.text,
              valueColor: WISPR.green,
            },
          ].map((row) => (
            <React.Fragment key={row.label}>
              <div
                style={{
                  position: "absolute",
                  left: LABEL_X - PANEL_X,
                  top: row.rowY - PANEL_Y - 17,
                  width: LABEL_W,
                  textAlign: "right",
                  fontSize: 27,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  color: row.labelColor,
                  lineHeight: "34px",
                }}
              >
                {row.label}
              </div>
              {/* track (full 220-wpm scale for both rows) */}
              <div
                style={{
                  position: "absolute",
                  left: BAR_X - PANEL_X,
                  top: row.rowY - PANEL_Y - BAR_H / 2,
                  width: FLOW_W,
                  height: BAR_H,
                  borderRadius: BAR_H / 2,
                  backgroundColor: "#F1EFEA",
                }}
              />
              {/* bar */}
              <div
                style={{
                  position: "absolute",
                  left: BAR_X - PANEL_X,
                  top: row.rowY - PANEL_Y - BAR_H / 2,
                  width: Math.max(row.barW, 0),
                  height: BAR_H,
                  borderRadius: BAR_H / 2,
                  background: row.barBg,
                }}
              />
              {/* value rides the bar tip, tabular numerals */}
              <div
                style={{
                  position: "absolute",
                  left: BAR_X - PANEL_X + Math.max(row.barW, 0) + 16,
                  top: row.rowY - PANEL_Y - 17,
                  fontSize: 28,
                  fontWeight: 650,
                  letterSpacing: -0.2,
                  color: row.valueColor,
                  lineHeight: "34px",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {row.value} wpm
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
