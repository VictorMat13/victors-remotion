// Fish Audio 4 — F4P05WiredS21Pro (1080x1920)
// VO: I wired Fish Audio's S2.1 Pro straight into it. One endpoint, one model
//     string. That's the whole integration.
// Beat map: open tight INSIDE the real fish.audio/developers curl capture →
// zoom out to reveal the floating fragment card → zoom back into the
// `-H "model: s2.1-pro-free"` line and draw a purple highlight on the real
// pixels → recreated code card types the endpoint + model strings → a glowing
// wire draws down into the mini Skilltree; amber glint on contact → settle.
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
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ALTARI, API, TREE, SPRINGS } from "./theme";
import {
  AltariBackdrop,
  SkillTreeWorld,
  manropeFamily,
  mulberry32,
  proceduralBars,
} from "./tree";

const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
});

export const DURATION_IN_FRAMES = 180;

const W = 1080;
const H = 1920;

// ---------------------------------------------------------------------------
// Screenshot fragment card — crop of the REAL 2880x1800 capture.
// Crop bounds (original px) hug the site's "CURL · TEXT TO SPEECH" card.
// ---------------------------------------------------------------------------
const CROP_X = 258;
const CROP_Y = 552;
const CROP_W = 1142;
const CROP_H = 575;
const SHOT_W = 950;
const SC = SHOT_W / CROP_W; // original-px -> card-px
const SHOT_H = Math.round(CROP_H * SC); // ~478
const SHOT_X = 65;
const SHOT_Y = 230;

// Highlight box around the `-H "model: s2.1-pro-free" \` line (original px).
// Verified against stills — the model line is the 5th code line of the card.
const HL_X1 = 300;
const HL_Y1 = 916;
const HL_X2 = 796;
const HL_Y2 = 968;
const hlL = (HL_X1 - CROP_X) * SC;
const hlT = (HL_Y1 - CROP_Y) * SC;
const hlW = (HL_X2 - HL_X1) * SC;
const hlH = (HL_Y2 - HL_Y1) * SC;
// World-space center of the highlight (camera target for beat 2)
const HL_CX = SHOT_X + hlL + hlW / 2;
const HL_CY = SHOT_Y + hlT + hlH / 2;

// ---------------------------------------------------------------------------
// Recreated code card
// ---------------------------------------------------------------------------
const CODE_X = 150;
const CODE_Y = 745;
const CODE_W = 780;
const CODE_H = 330;

// ---------------------------------------------------------------------------
// Mini Skilltree placement
// ---------------------------------------------------------------------------
const TREE_SCALE = 0.38;
const TREE_CX = 540;
const TREE_CY = 1410;

// Wire from code card bottom into the tree center
const WIRE_D = `M 540 ${CODE_Y + CODE_H - 4} C 505 1160, 578 1250, ${TREE_CX} ${
  TREE_CY - 26
}`;
const WIRE_LEN = 400; // safely >= real path length for dash draw
const CONTACT_F = 158;

// Parallax stars in world space (backdrop stays fixed; these ride the camera)
const buildWorldStars = () => {
  const rnd = mulberry32(50820);
  return Array.from({ length: 30 }).map(() => ({
    x: 30 + rnd() * 1020,
    y: 20 + rnd() * 1140, // upper world only; the tree brings its own stars
    r: 0.9 + rnd() * 1.7,
    o: 0.1 + rnd() * 0.24,
    ph: rnd() * Math.PI * 2,
  }));
};

// Typing schedule
const LINE1 = API.endpoint; // https://api.fish.audio/v1/tts
const LINE2A = "model: ";
const LINE2B = API.model; // s2.1-pro-free
const T_LABEL1 = 96;
const T_LINE1 = 98;
const T_LINE1_END = 118;
const T_LABEL2 = 118;
const T_LINE2 = 120;
const T_LINE2_END = 136;

export const F4P05WiredS21Pro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // -------------------------------------------------------------------------
  // Camera — one shared keyframe timeline (hold → move → hold)
  // -------------------------------------------------------------------------
  const KEY_T = [0, 10, 28, 38, 56, 85, 100, 130, 148, 172, 179];
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = interpolate(
    frame,
    KEY_T,
    [335, 335, 540, 540, HL_CX, HL_CX, 540, 540, 540, 540, 540],
    camOpts,
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [520, 520, 515, 515, HL_CY, HL_CY, 915, 915, 960, 960, 960],
    camOpts,
  );
  const z = interpolate(
    frame,
    KEY_T,
    [2.4, 2.4, 1.0, 1.0, 2.3, 2.3, 1.1, 1.1, 1.0, 1.0, 1.0],
    camOpts,
  );

  const worldStars = React.useMemo(buildWorldStars, []);

  // Gentle float on the fragment card (highlight rides along — same container)
  const shotFloat = 4 * Math.sin(frame * 0.045);
  const codeFloat = 3 * Math.sin(frame * 0.05 + 1.9);

  // Opening light sweep across the code area (micro-motion during the hold)
  const sweepX = interpolate(frame, [2, 30], [-260, SHOT_W + 60], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepO = interpolate(frame, [2, 8, 24, 32], [0, 0.09, 0.09, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight box draw (f58–74, during the tight hold on the model line)
  const hlDraw = interpolate(frame, [58, 70], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hlPulse = 0.82 + 0.18 * Math.sin((frame - 74) * 0.18);
  const hlOpacity = frame < 58 ? 0 : hlDraw < 1 ? 1 : Math.max(0.85, hlPulse);

  // Code card entrance (slides up as the camera travels to it)
  const codeIn = spring({
    frame: frame - 86,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 26,
  });
  const codeY = (1 - codeIn) * 90;

  // Typing via string slicing
  const typed = (text: string, start: number, end: number) => {
    const n = Math.round(
      interpolate(frame, [start, end], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
    return text.slice(0, n);
  };
  const line1 = typed(LINE1, T_LINE1, T_LINE1_END);
  const line2Full = LINE2A + LINE2B;
  const line2Typed = typed(line2Full, T_LINE2, T_LINE2_END);
  const line2a = line2Typed.slice(0, Math.min(line2Typed.length, LINE2A.length));
  const line2b = line2Typed.slice(LINE2A.length);
  const label1O = interpolate(frame, [T_LABEL1, T_LABEL1 + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const label2O = interpolate(frame, [T_LABEL2, T_LABEL2 + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const cursor1 = frame >= T_LINE1 - 4 && frame < T_LINE1_END + 2;
  const cursor2 = frame >= T_LINE2 && frame < T_LINE2_END + 10;

  // Wire draw f136 → CONTACT_F
  const wireT = interpolate(frame, [136, CONTACT_F], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Contact glint + orb wake-up at the tree center
  const glint = spring({
    frame: frame - CONTACT_F,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 24,
  });
  const glintFade = interpolate(frame, [CONTACT_F, CONTACT_F + 26], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orbIn = spring({
    frame: frame - CONTACT_F,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 30,
  });
  const speaking = frame >= CONTACT_F + 2;
  const bars = proceduralBars(frame, speaking, 5);

  // Packet dots running down the wire after contact
  const wirePoint = (t: number) => {
    // cubic bezier of WIRE_D
    const p0 = { x: 540, y: CODE_Y + CODE_H - 4 };
    const p1 = { x: 505, y: 1160 };
    const p2 = { x: 578, y: 1250 };
    const p3 = { x: TREE_CX, y: TREE_CY - 26 };
    const u = 1 - t;
    return {
      x:
        u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y:
        u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };
  const packets = [CONTACT_F + 6, CONTACT_F + 21].map((start) => {
    const t = (frame - start) / 26;
    return t >= 0 && t <= 1 ? wirePoint(Math.min(1, t)) : null;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Fixed full-frame backdrop — does NOT move with the camera */}
      <AltariBackdrop width={W} height={H} />

      {/* ------------------------- WORLD (camera rig) ---------------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* parallax stars */}
        <svg
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          width={1}
          height={1}
        >
          {worldStars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={TREE.node}
              opacity={s.o * (0.65 + 0.35 * Math.sin(frame * 0.04 + s.ph))}
            />
          ))}
        </svg>

        {/* wire (under the cards so its start tucks beneath the code card) */}
        <svg
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          width={1}
          height={1}
        >
          <path
            d={WIRE_D}
            fill="none"
            stroke={ALTARI.primaryLight}
            strokeWidth={11}
            strokeLinecap="round"
            opacity={0.28 * (wireT > 0 ? 1 : 0)}
            strokeDasharray={WIRE_LEN}
            strokeDashoffset={WIRE_LEN * (1 - wireT)}
            style={{ filter: "blur(7px)" }}
          />
          <path
            d={WIRE_D}
            fill="none"
            stroke={ALTARI.primaryLight}
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={wireT > 0 ? 0.95 : 0}
            strokeDasharray={WIRE_LEN}
            strokeDashoffset={WIRE_LEN * (1 - wireT)}
          />
          {/* draw-front spark */}
          {wireT > 0 && wireT < 1 && (
            <circle
              cx={wirePoint(wireT).x}
              cy={wirePoint(wireT).y}
              r={7}
              fill={TREE.cream}
              opacity={0.95}
            />
          )}
          {/* packets after contact */}
          {packets.map(
            (p, i) =>
              p && (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4.5}
                  fill={ALTARI.primaryLight}
                  opacity={0.9}
                />
              ),
          )}
        </svg>

        {/* mini Skilltree — established (revealAt=-120), wakes on contact */}
        <div
          style={{
            position: "absolute",
            left: TREE_CX - 540 * TREE_SCALE,
            top: TREE_CY - 540 * TREE_SCALE,
            transform: `scale(${TREE_SCALE})`,
            transformOrigin: "0 0",
          }}
        >
          <SkillTreeWorld
            frame={frame}
            revealAt={-120}
            orbIn={orbIn}
            speaker="center"
            barValues={bars}
            brainOpacity={0.92 - 0.4 * orbIn}
            labelDim={0.25}
          />
        </div>

        {/* amber contact glint at the tree center */}
        {frame >= CONTACT_F && (
          <div
            style={{
              position: "absolute",
              left: TREE_CX - 130,
              top: TREE_CY - 130,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${TREE.orbLite} 0%, rgba(232,162,91,0.35) 38%, rgba(232,162,91,0) 70%)`,
              transform: `scale(${0.3 + glint * 1.1})`,
              opacity: 0.85 * glintFade,
            }}
          />
        )}

        {/* --------------- REAL screenshot fragment card --------------- */}
        <div
          style={{
            position: "absolute",
            left: SHOT_X,
            top: SHOT_Y + shotFloat,
            width: SHOT_W,
            height: SHOT_H,
            borderRadius: 20,
            border: `1px solid ${ALTARI.border}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            overflow: "hidden",
            backgroundColor: "#F5F1EA",
          }}
        >
          <Img
            src={staticFile("fish4/site/site-developers-curl.png")}
            style={{
              position: "absolute",
              left: -CROP_X * SC,
              top: -CROP_Y * SC,
              width: 2880 * SC,
              height: 1800 * SC,
            }}
          />
          {/* opening light sweep over the code */}
          <div
            style={{
              position: "absolute",
              left: sweepX,
              top: 0,
              width: 220,
              height: SHOT_H,
              background:
                "linear-gradient(100deg, rgba(91,94,194,0) 0%, rgba(91,94,194,0.9) 50%, rgba(91,94,194,0) 100%)",
              opacity: sweepO,
            }}
          />
          {/* purple highlight drawn on the real model line */}
          <svg
            style={{ position: "absolute", left: 0, top: 0 }}
            width={SHOT_W}
            height={SHOT_H}
          >
            <rect
              x={hlL}
              y={hlT}
              width={hlW}
              height={hlH}
              rx={9}
              fill="rgba(123,125,214,0.10)"
              opacity={hlDraw}
            />
            <rect
              x={hlL}
              y={hlT}
              width={hlW}
              height={hlH}
              rx={9}
              fill="none"
              stroke={ALTARI.primaryLight}
              strokeWidth={2.2}
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 * (1 - hlDraw)}
              opacity={hlOpacity}
              style={{
                filter: `drop-shadow(0 0 6px ${ALTARI.primaryLight})`,
              }}
            />
          </svg>
        </div>

        {/* ------------------- recreated code card ------------------- */}
        <div
          style={{
            position: "absolute",
            left: CODE_X,
            top: CODE_Y + codeY + codeFloat,
            width: CODE_W,
            height: CODE_H,
            borderRadius: 20,
            border: `1px solid ${ALTARI.border}`,
            backgroundColor: ALTARI.card2,
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            opacity: Math.min(1, codeIn * 1.4),
            padding: "26px 36px",
            boxSizing: "border-box",
          }}
        >
          {/* S2.1 PRO chip — approved fish 3 styling */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 13,
              padding: "10px 20px",
              borderRadius: 999,
              backgroundColor: ALTARI.bgDeep,
              border: `1px solid ${ALTARI.border}`,
            }}
          >
            {/* logo-dark.png is the WHITE wordmark (for dark surfaces) —
                matches the approved fish 3 chip */}
            <Img
              src={staticFile("fish-audio/logo-dark.png")}
              style={{ height: 21, width: 21 * (1370 / 224) }}
            />
            <span
              style={{
                fontFamily: manropeFamily,
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: 2.5,
                color: ALTARI.amber,
              }}
            >
              S2.1 PRO
            </span>
          </div>

          {/* endpoint */}
          <div
            style={{
              marginTop: 24,
              fontFamily: manropeFamily,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: 3.5,
              textTransform: "uppercase",
              color: ALTARI.faint,
              opacity: label1O,
            }}
          >
            endpoint
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: monoFamily,
              fontWeight: 500,
              fontSize: 32,
              color: TREE.cream,
              whiteSpace: "nowrap",
            }}
          >
            {line1}
            {cursor1 && cursorOn && (
              <span style={{ color: ALTARI.primaryLight }}>▌</span>
            )}
          </div>

          {/* model */}
          <div
            style={{
              marginTop: 22,
              fontFamily: manropeFamily,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: 3.5,
              textTransform: "uppercase",
              color: ALTARI.faint,
              opacity: label2O,
            }}
          >
            model
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: monoFamily,
              fontWeight: 500,
              fontSize: 32,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: TREE.cream }}>{line2a}</span>
            <span style={{ color: ALTARI.amber }}>{line2b}</span>
            {cursor2 && cursorOn && (
              <span style={{ color: ALTARI.primaryLight }}>▌</span>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
