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
import {
  CHANNEL,
  FONT_SANS,
  LW,
  PLATFORM,
  RN,
  SHORTS,
  SHOTS,
  SPRINGS,
  safePadX,
} from "./theme";
import { useKsFonts } from "./useKsFonts";

// ============================================================================
// KsP7PutTheCaptionsOn — 1080x1080 @ 30fps, 180 frames (6s)
//
// VO (spoken only, never on screen):
//   p7a "Put the captions right on."                                  (step 5)
//   p7b "Wrote the titles. And scheduled all of them straight to my
//        channel."                                                    (step 6)
//
// ONE WORLD, ONE CAMERA. The world is the finished Shorts shelf: three real
// 9:16 clips in a row, a title slot under each, a schedule chip under that, and
// Koen's real YouTube channel sitting below as the destination. The camera
// opens tight on the middle clip while its captions burn in, then pulls back
// once to reveal that the clip was one of three, and the row finishes itself.
//
//   0-60    HOLD (z 1.66) — the middle clip held large and centred. Burned-in
//           captions snap on one/two words at a time; a render rail fills in
//           lock-step and a live REC dot breathes. Micro-motion: slow push on
//           the clip frame the whole time (it reads as video, not a still).
//   60-80   MOVE (20f, Easing.inOut(Easing.cubic)) — the only camera move.
//           Pull back; the step spine, the channel card and the two
//           neighbouring clips resolve in a staggered wave behind it.
//   80-124  HOLD — the agent writes the TITLES: each types in under its clip
//           with a caret, staggered 6 frames apart.
//   124-156 HOLD — they SCHEDULE: a clock chip springs under each title, a
//           packet fires down the connector into the YouTube channel card and
//           the queue counter ticks 1 -> 2 -> 3. Step 6 of the spine fills.
//   156-180 SETTLE (24f) — every card in its scheduled state. Only micro-
//           motion: clock hands turn, the channel glow breathes, the clip
//           frames keep drifting.
//
// REAL ASSETS ONLY
//   * The three clip frames are cropped out of the REAL capture of
//     youtube.com/@Koen-ai (SHOTS.ytShorts) via <Img>, not a CSS background —
//     Remotion waits on <Img>, so no frame commits before the bitmap decodes.
//   * The three titles are verbatim SHORTS[0], SHORTS[1], SHORTS[2].
//   * The destination is CHANNEL.name / .handle / .subs with PLATFORM.youtube.
//   * No view counts: these clips have just been scheduled, so they have none.
//   * The burned caption is clip dialogue for the mock render — short, generic,
//     clearly part of the clip. It is NOT the VO line and NOT product copy.
// ============================================================================

export const DURATION_IN_FRAMES = 180;

const VIEW = 1080;
const PAD = safePadX(VIEW); // 54 — hard 5% side margin
const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const ramp = (frame: number, a: number, b: number, easing = EASE) =>
  interpolate(frame, [a, b], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const popAt = (frame: number, fps: number, start: number, dur = 18) =>
  frame < start
    ? 0
    : spring({
        frame: frame - start,
        fps,
        config: SPRINGS.snappy,
        durationInFrames: dur,
      });

// ---------------------------------------------------------------------------
// World layout. Everything is derived from the 5% pad; the row is exactly the
// safe width (972) so nothing can drift into the outer 5%.
// ---------------------------------------------------------------------------
const CARD_W = 296;
const CARD_H = Math.round((CARD_W * 16) / 9); // 526 — true 9:16
const GAP = 42; // 3*296 + 2*42 = 972 = VIEW - 2*PAD
const ROW_X = PAD;
const CARD_Y = 132;
const CARD_BOTTOM = CARD_Y + CARD_H; // 658
const cardX = (i: number) => ROW_X + i * (CARD_W + GAP);
const cardCx = (i: number) => cardX(i) + CARD_W / 2;

const SPINE_Y = 96;
const SPINE_TICK_W = 40;
const SPINE_TICK_H = 7;
const SPINE_GAP = 12;
const SPINE_W = 6 * SPINE_TICK_W + 5 * SPINE_GAP; // 300
const SPINE_X = Math.round((VIEW - SPINE_W) / 2); // 390

const TITLE_Y = CARD_BOTTOM + 24; // 682
const TITLE_SIZE = 25;
const TITLE_LH = 1.34;
const TITLE_H = Math.round(2 * TITLE_SIZE * TITLE_LH); // 67

const CHIP_Y = 762;
const CHIP_H = 44;
const CHIP_BOTTOM = CHIP_Y + CHIP_H; // 806

const DEST_W = 720;
const DEST_H = 132;
const DEST_X = Math.round((VIEW - DEST_W) / 2); // 180
const DEST_Y = 856;
const DROP_X = VIEW / 2;
const DROP_Y = DEST_Y + 6; // where the packets land

// ---------------------------------------------------------------------------
// Camera — hold -> one 20f move -> hold, ending on two near-identical keys.
// ---------------------------------------------------------------------------
const HERO = 1; // the middle card is the one we watch render
const KEY_T = [0, 28, 60, 80, 150, 180];
const KEY_FX = [540, 540, 540, 540, 540, 540];
const KEY_FY = [
  CARD_Y + CARD_H / 2,
  CARD_Y + CARD_H / 2,
  CARD_Y + CARD_H / 2,
  545,
  542,
  542,
];
const KEY_Z = [1.66, 1.665, 1.67, 0.965, 0.955, 0.9545];

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
const CAP_T = [4, 12.6, 21.2, 29.8, 38.4, 47];
const RAIL_END = 54;
const RENDER_FADE = [54, 66] as const;

// The neighbours resolve only once the camera has pulled back far enough that
// they sit INSIDE the 5% safe margin (z <= 1.0, which happens around f77), so
// nothing that reads as content ever crosses the crop line mid-move.
const REVEAL = [
  [77, 92], // card 0
  [0, 0], // hero — always present
  [80, 95], // card 2
] as const;
const SPINE_IN = [68, 88] as const;
const DEST_IN = [70, 92] as const;
const STEP5 = [77, 93] as const;
const STEP6 = [150, 166] as const;

const TITLE_T = [93, 99, 105] as const;
const TITLE_DUR = 16;
const CHIP_T = [124, 130, 136] as const;
const PACKET_T = [
  [126, 144],
  [132, 150],
  [138, 156],
] as const;

// ---------------------------------------------------------------------------
// The three finished clips. Frames are cropped straight out of the real
// @Koen-ai Shorts shelf capture (1600x1000). Titles are verbatim from SHORTS.
// ---------------------------------------------------------------------------
const SRC_W = 1600;
const SRC_H = 1000;
const THUMB_Y = 177; // featured row: shorts 7-12. The first six are scrolled fully offscreen in the capture (Victor: skip the first 5).
const THUMB_SW = 207;
const THUMB_SH = 325;
const thumbX = (n: number) => 265 + n * 218; // n = position on the real shelf

// The three newest Shorts on the real shelf, in shelf order. These three frames
// carry no burned caption of their own, so the caption we render in beat 1 is
// the only caption on screen and nothing competes with it.
const CLIPS = [
  { short: SHORTS[0], shelf: 0, when: "Aug 29 · 9:00 AM" },
  { short: SHORTS[1], shelf: 1, when: "Aug 30 · 1:00 PM" },
  { short: SHORTS[2], shelf: 2, when: "Aug 31 · 6:00 PM" },
] as const;

// Burned-in caption for the clip we watch render. Clip dialogue for the mock
// render: short, generic, obviously part of the clip. Never the narration.
const CAPTION = ["WAIT", "TILL YOU", "SEE", "WHAT HE", "DOES", "NEXT"] as const;

// Element-based crop, NOT a CSS background image: Remotion cannot treat a
// background-image as a loading asset, so a background would let a frame commit
// before the bitmap decodes. <Img> is waited on, so the frame is never blank.
const THUMB_SCALE = Math.max(CARD_W / THUMB_SW, CARD_H / THUMB_SH);

const ClipFrame: React.FC<{ shelf: number; zoom: number }> = ({
  shelf,
  zoom,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      transform: `scale(${zoom})`,
      transformOrigin: "50% 50%",
    }}
  >
    <Img
      src={staticFile(SHOTS.ytShorts)}
      style={{
        position: "absolute",
        left:
          -thumbX(shelf) * THUMB_SCALE +
          (CARD_W - THUMB_SW * THUMB_SCALE) / 2,
        top:
          -THUMB_Y * THUMB_SCALE + (CARD_H - THUMB_SH * THUMB_SCALE) / 2,
        width: SRC_W * THUMB_SCALE,
        height: SRC_H * THUMB_SCALE,
        maxWidth: "none",
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------
const cubic = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

// Scheduled glyph. The minute hand turns for the whole clip so the chips keep
// micro-moving through the end hold; the base angles keep the two hands from
// collapsing into a single horizontal stroke.
const Clock: React.FC<{ size: number; color: string; frame: number }> = ({
  size,
  color,
  frame,
}) => {
  const min = ((-52 + frame * 2.2) * Math.PI) / 180;
  const hour = ((124 + frame * 0.18) * Math.PI) / 180;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.9" />
      <line
        x1="12"
        y1="12"
        x2={12 + 4.7 * Math.sin(min)}
        y2={12 - 4.7 * Math.cos(min)}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="12"
        x2={12 + 2.9 * Math.sin(hour)}
        y2={12 - 2.9 * Math.cos(hour)}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const YouTubeMark: React.FC<{ w: number }> = ({ w }) => {
  const h = Math.round((w * 20) / 28);
  return (
    <svg width={w} height={h} viewBox="0 0 28 20" fill="none">
      <rect
        x="0"
        y="0"
        width="28"
        height="20"
        rx="5.6"
        fill={PLATFORM.youtube}
      />
      <path d="M11.3 5.9 L19 10 L11.3 14.1 Z" fill="#FFFFFF" />
    </svg>
  );
};

const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  lift?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, r = 26, lift, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r,
      background: LW.card,
      border: `1px solid ${LW.hairline}`,
      boxShadow: lift ? LW.shadowLift : LW.shadow,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
export const KsP7PutTheCaptionsOn: React.FC = () => {
  useKsFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: EASE,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fx = interpolate(frame, KEY_T, KEY_FX, camOpts);
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpts);
  const z = interpolate(frame, KEY_T, KEY_Z, camOpts);

  // ---- beat 1: captions burning in ----
  const activeCap = CAP_T.reduce((acc, t, i) => (frame >= t ? i : acc), -1);
  const capPop =
    activeCap < 0
      ? 0
      : spring({
          frame: frame - CAP_T[activeCap],
          fps,
          config: SPRINGS.bouncy,
          durationInFrames: 14,
        });
  const railP = interpolate(
    frame,
    [CAP_T[0], CAP_T[1], CAP_T[2], CAP_T[3], CAP_T[4], CAP_T[5], RAIL_END],
    [0.07, 0.23, 0.39, 0.56, 0.73, 0.89, 1],
    { easing: OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const renderOp = 1 - ramp(frame, RENDER_FADE[0], RENDER_FADE[1], OUT);
  const recPhase = (frame % 26) / 26;

  // ---- slow push on every clip frame so they read as video, not stills ----
  const kb = 1 + 0.03 * (frame / DURATION_IN_FRAMES);

  // ---- the row + system resolving as the camera pulls back ----
  const spineIn = ramp(frame, SPINE_IN[0], SPINE_IN[1], OUT);
  const step5 = ramp(frame, STEP5[0], STEP5[1], OUT);
  const step6 = ramp(frame, STEP6[0], STEP6[1], OUT);
  const destIn = ramp(frame, DEST_IN[0], DEST_IN[1], OUT);
  const destPop = Math.min(1, popAt(frame, fps, DEST_IN[0], 22));

  // ---- packets landing -> queue counter ----
  const landed = PACKET_T.filter((p) => frame >= p[1]).length;
  const lastLand = landed > 0 ? PACKET_T[landed - 1][1] : -999;
  const landPulse = interpolate(
    frame - lastLand,
    [0, 5, 16],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const breathe = 0.24 + 0.11 * Math.sin(frame / 11);

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* screen-fixed floor gradient — opaque paper is painted above it */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${alpha(
            LW.card,
            0.9,
          )} 0%, ${alpha(LW.paper, 0)} 38%, ${alpha(LW.paperDeep, 0.85)} 100%)`,
        }}
      />

      {/* ============================== the world ======================== */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW,
          height: VIEW,
          transform: `translate(${VIEW / 2 - fx}px, ${
            VIEW / 2 - fy
          }px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* warm glow behind the destination */}
        <div
          style={{
            position: "absolute",
            left: DROP_X - 460,
            top: DEST_Y + DEST_H / 2 - 460,
            width: 920,
            height: 920,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(
              RN.amber,
              0.13,
            )} 0%, ${alpha(RN.amber, 0)} 62%)`,
            opacity: destIn * (0.72 + breathe + landPulse * 0.35),
          }}
        />

        {/* ---------------------- six-step spine (no text) --------------- */}
        <div style={{ opacity: spineIn }}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const fill =
              i < 4 ? 1 : i === 4 ? step5 : step6;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: SPINE_X + i * (SPINE_TICK_W + SPINE_GAP),
                  top: SPINE_Y,
                  width: SPINE_TICK_W,
                  height: SPINE_TICK_H,
                  borderRadius: SPINE_TICK_H / 2,
                  background: alpha("#000000", 0.075),
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: "100%",
                    borderRadius: SPINE_TICK_H / 2,
                    background:
                      i < 4 ? alpha(RN.amber, 0.4) : RN.amber,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ---------------------- connectors + packets ------------------- */}
        <svg
          width={VIEW}
          height={VIEW}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {CLIPS.map((_, i) => {
            const [a, b] = PACKET_T[i];
            const t = ramp(frame, a, b, Easing.inOut(Easing.quad));
            if (t <= 0) return null;
            const x0 = cardCx(i);
            const d = `M ${x0} ${CHIP_BOTTOM} C ${x0} ${CHIP_BOTTOM + 26} ${DROP_X} ${
              DROP_Y - 26
            } ${DROP_X} ${DROP_Y}`;
            const len = 320;
            return (
              <path
                key={i}
                d={d}
                stroke={alpha(RN.amber, frame >= b ? 0.22 : 0.5)}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - t)}
              />
            );
          })}
        </svg>

        {CLIPS.map((_, i) => {
          const [a, b] = PACKET_T[i];
          if (frame < a || frame > b + 1) return null;
          const t = ramp(frame, a, b, Easing.inOut(Easing.quad));
          const x0 = cardCx(i);
          const px = cubic(t, x0, x0, DROP_X, DROP_X);
          const py = cubic(
            t,
            CHIP_BOTTOM,
            CHIP_BOTTOM + 26,
            DROP_Y - 26,
            DROP_Y,
          );
          const s = interpolate(t, [0, 0.14, 0.86, 1], [0.4, 1, 1, 0.42], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const op = interpolate(t, [0, 0.1, 0.88, 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={`pk${i}`}
              style={{
                position: "absolute",
                left: px - 11,
                top: py - 19,
                width: 22,
                height: 38,
                borderRadius: 6,
                background: RN.amber,
                boxShadow: `0 0 18px ${alpha(RN.amber, 0.55)}`,
                transform: `scale(${s})`,
                opacity: op,
              }}
            />
          );
        })}

        {/* -------------------------- the three clips -------------------- */}
        {CLIPS.map((clip, i) => {
          const isHero = i === HERO;
          const rev = isHero
            ? 1
            : ramp(frame, REVEAL[i][0], REVEAL[i][1], OUT);
          const rise = (1 - rev) * 26;

          // title typing
          const title = clip.short.title;
          const tp = ramp(frame, TITLE_T[i], TITLE_T[i] + TITLE_DUR, OUT);
          const shown = title.slice(0, Math.round(tp * title.length));
          const typing = frame >= TITLE_T[i] && tp < 1;
          const caretOn =
            (frame >= TITLE_T[i] && tp < 1) ||
            (tp >= 1 && frame < TITLE_T[i] + TITLE_DUR + 8);
          const caretBlink = typing ? 1 : Math.floor(frame / 6) % 2 === 0 ? 1 : 0;

          // schedule chip
          const chipPop = Math.min(1, popAt(frame, fps, CHIP_T[i], 20));

          return (
            <div key={clip.short.title} style={{ opacity: rev }}>
              {/* clip frame */}
              <div
                style={{
                  position: "absolute",
                  left: cardX(i),
                  top: CARD_Y + rise,
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#0B0B0C",
                  border: `1px solid ${LW.hairline}`,
                  boxShadow: isHero ? LW.shadowLift : LW.shadow,
                }}
              >
                <ClipFrame shelf={clip.shelf} zoom={kb} />
                {/* soft grade so the burned caption always separates */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, ${alpha(
                      "#000000",
                      0.1,
                    )} 0%, ${alpha("#000000", 0)} 26%, ${alpha(
                      "#000000",
                      0,
                    )} 62%, ${alpha("#000000", 0.16)} 100%)`,
                  }}
                />

                {/* --- hero only: the caption render in progress --- */}
                {isHero ? (
                  <>
                    {/* live REC dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: 20,
                        top: 20,
                        width: 16,
                        height: 16,
                        opacity: renderOp,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -8,
                          top: -8,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: `2px solid ${RN.amber}`,
                          transform: `scale(${0.6 + recPhase * 0.9})`,
                          opacity: (1 - recPhase) * 0.8,
                        }}
                      />
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: RN.amber,
                          boxShadow: `0 0 14px ${alpha(RN.amber, 0.8)}`,
                        }}
                      />
                    </div>

                    {/* burned-in caption, one or two words at a time */}
                    {activeCap >= 0 ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: CARD_H * 0.72,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${
                              0.82 + 0.18 * Math.min(1, capPop)
                            })`,
                            opacity: Math.min(1, capPop * 2.4),
                            padding: "11px 20px",
                            borderRadius: 14,
                            background:
                              activeCap === CAPTION.length - 1
                                ? RN.amber
                                : alpha("#FFFFFF", 0.97),
                            boxShadow: `0 8px 24px ${alpha("#000000", 0.3)}`,
                            fontFamily: FONT_SANS,
                            fontWeight: 800,
                            fontSize: 30,
                            lineHeight: 1,
                            letterSpacing: "-0.005em",
                            color:
                              activeCap === CAPTION.length - 1
                                ? "#FFFFFF"
                                : LW.ink,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {CAPTION[activeCap]}
                        </div>
                      </div>
                    ) : null}

                    {/* render rail */}
                    <div
                      style={{
                        position: "absolute",
                        left: 20,
                        right: 20,
                        bottom: 20,
                        height: 7,
                        borderRadius: 4,
                        background: alpha("#FFFFFF", 0.3),
                        overflow: "hidden",
                        opacity: renderOp,
                      }}
                    >
                      <div
                        style={{
                          width: `${railP * 100}%`,
                          height: "100%",
                          borderRadius: 4,
                          background: RN.amber,
                          boxShadow: `0 0 12px ${alpha(RN.amber, 0.9)}`,
                        }}
                      />
                    </div>
                  </>
                ) : null}

                {/* --- hero after the render: the caption stays burned on --- */}
                {isHero && frame >= RENDER_FADE[1] ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: CARD_H * 0.72,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        padding: "11px 20px",
                        borderRadius: 14,
                        background: RN.amber,
                        boxShadow: `0 8px 24px ${alpha("#000000", 0.3)}`,
                        fontFamily: FONT_SANS,
                        fontWeight: 800,
                        fontSize: 30,
                        lineHeight: 1,
                        color: "#FFFFFF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {CAPTION[CAPTION.length - 1]}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* title, typed by the agent */}
              <div
                style={{
                  position: "absolute",
                  left: cardX(i),
                  top: TITLE_Y + rise,
                  width: CARD_W,
                  height: TITLE_H,
                  overflow: "hidden",
                  fontFamily: FONT_SANS,
                  fontWeight: 640,
                  fontSize: TITLE_SIZE,
                  lineHeight: TITLE_LH,
                  letterSpacing: "-0.012em",
                  color: LW.ink,
                }}
              >
                {shown}
                {caretOn ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: TITLE_SIZE * 0.95,
                      marginLeft: 3,
                      verticalAlign: "-14%",
                      background: RN.amber,
                      opacity: caretBlink,
                    }}
                  />
                ) : null}
              </div>

              {/* scheduled chip */}
              <div
                style={{
                  position: "absolute",
                  left: cardX(i),
                  top: CHIP_Y,
                  height: CHIP_H,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "0 16px",
                  borderRadius: CHIP_H / 2,
                  background: RN.amberSoft,
                  border: `1px solid ${alpha(RN.amber, 0.3)}`,
                  transform: `scale(${0.86 + 0.14 * chipPop})`,
                  transformOrigin: "0% 50%",
                  opacity: Math.min(1, chipPop * 1.8),
                }}
              >
                <Clock size={20} color={RN.amber} frame={frame} />
                <span
                  style={{
                    fontFamily: FONT_SANS,
                    fontWeight: 600,
                    fontSize: 22,
                    letterSpacing: "-0.005em",
                    color: RN.textWarm,
                    fontVariantNumeric: "tabular-nums lining-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {clip.when}
                </span>
              </div>
            </div>
          );
        })}

        {/* ----------------------- YouTube destination -------------------- */}
        <div style={{ opacity: destIn }}>
          <Card
            x={DEST_X}
            y={DEST_Y + (1 - destPop) * 20}
            w={DEST_W}
            h={DEST_H}
            r={28}
            lift
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 34px",
              transform: `scale(${1 + landPulse * 0.012})`,
              transformOrigin: "50% 50%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 74,
                height: 74,
                borderRadius: 20,
                background: LW.cardSoft,
                border: `1px solid ${LW.hairlineSoft}`,
                flexShrink: 0,
              }}
            >
              <YouTubeMark w={44} />
            </div>

            <div style={{ marginLeft: 22, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 700,
                  fontSize: 29,
                  letterSpacing: "-0.02em",
                  color: LW.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {CHANNEL.name}
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontFamily: FONT_SANS,
                  fontWeight: 500,
                  fontSize: 23,
                  letterSpacing: "-0.005em",
                  color: LW.muted,
                }}
              >
                {CHANNEL.handle} · {CHANNEL.subs}
              </div>
            </div>

            {/* queue counter — ticks once per landed packet */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 16px",
                borderRadius: 24,
                background: RN.amberSoft,
                border: `1px solid ${alpha(RN.amber, 0.28 + landPulse * 0.4)}`,
                boxShadow:
                  landPulse > 0
                    ? `0 0 ${18 * landPulse}px ${alpha(
                        RN.amber,
                        0.45 * landPulse,
                      )}`
                    : "none",
                opacity: landed > 0 ? 1 : 0,
                flexShrink: 0,
              }}
            >
              <Clock size={21} color={RN.amber} frame={frame} />
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontWeight: 700,
                  fontSize: 26,
                  color: RN.textWarm,
                  fontVariantNumeric: "tabular-nums lining-nums",
                }}
              >
                {landed}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};
