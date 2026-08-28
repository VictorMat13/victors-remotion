import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FONT_RUNABLE,
  MRD,
  MRD_GRADIENT,
  MRD_GRID,
  RN,
  SPRINGS,
  UI,
  idGroteskFaces,
  safePadX,
} from "./theme";

// ===========================================================================
// BgP4SiteAndBudget — 1080x1920 @ 30fps
// 0:19 DEMO  [9:16]
// VO: "I pick the client's site and a daily budget. The prompt writes itself,
//      I choose Runable managed, no ad account, and it's live. People ask
//      ChatGPT what to buy. My client shows up."
//
// ONE WORLD, ONE CAMERA. Merydian dark ground (#0A0A0A + streaks + rule grid)
// with the REAL Runable "Run Ads" modal floating on it as a warm near-white
// card, recreated from public/bgrow/capture/03-chatgpt-ads-modal.png. Every
// string comes from UI.runAds. Below the modal, a second region of the same
// world carries the abstract ask-and-appear payoff — the OpenAI mark that is
// already on the modal, questions converging into it, the client's site
// surfacing as the answer. No invented ChatGPT interface.
//
// Camera beats (hold -> move -> hold):
//   0-44    hold  site row lands + fills          fy 704   z 1.09
//   44-62   move
//   62-128  hold  daily budget drags $10 -> $100  fy 1012  z 1.09
//   128-146 move
//   146-214 hold  "Runable Managed" badge docks   fy 864   z 0.93
//   214-232 move
//   232-294 hold  CTA press, ripple, go live      fy 1064  z 1.03
//   294-318 travel down the world
//   318-352 hold  ask -> answer                   fy 2230  z 0.94
//   352-375 settle
// ===========================================================================

export const DURATION_IN_FRAMES = 375;

// --------------------------------------------------------------- world model
const MODAL_W = 880;
const MODAL_H = 1088;
const MODAL_PAD = 44;
const MODAL_X = 100; // world x of the card's left edge (centre = 540)
const MODAL_Y = 320; // world y of the card's top edge
const INNER = MODAL_W - MODAL_PAD * 2; // 792

// modal-local y offsets, mirroring the live capture's hierarchy
const CHIP_S = 76;
const CHIP_Y = 44;
const CLOSE_S = 40;
const TITLE_Y = 154;
const SUB_Y = 224;
const SEND_LABEL_Y = 308;
const INPUT_Y = 366;
const INPUT_H = 92;
const LINK_Y = 474;
const BUDGET_LABEL_Y = 554;
const BUBBLE_Y = 626;
const BUBBLE_H = 56;
const TRACK_Y = 704;
const MINMAX_Y = 726;
const FEE_Y = 780;
const CTA_Y = 850;
const CTA_H = 100;
const FOOT_Y = 972;

// payoff region, same world, further down
const MARK_C = { x: 540, y: 2080 };
const MARK_S = 220;
const ANSWER_C = { x: 540, y: 2400 };
const ANSWER_H = 120;

const OPENAI_PATH =
  "M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z";

const EASE = Easing.inOut(Easing.cubic);
const OUT = Easing.out(Easing.cubic);

const TAB: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1',
};

// ------------------------------------------------------------------- glyphs
const OpenAiMark: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 256 260">
    <path d={OPENAI_PATH} fill={color} />
  </svg>
);

const Globe: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.7 3.1 2.7 14.9 0 18" />
      <path d="M12 3c-2.7 3.1-2.7 14.9 0 18" />
    </g>
  </svg>
);

const Chevron: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9.5 5.5 16 12l-6.5 6.5"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseX: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.5 6.5l11 11M17.5 6.5l-11 11"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </svg>
);

const Cursor: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M5.4 2.6 5.4 20.6 10.1 16.1 13.3 22.7 16.4 21.1 13.3 14.8 19.4 14.8 Z"
      fill={RN.card}
      stroke={RN.ink}
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  </svg>
);

// ===========================================================================
export const BgP4SiteAndBudget: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 5% side safe margin — content must live inside x = 54 -> 1026 on 1080.
  const SAFE_X = safePadX(width);
  const MAX_CONTENT_W = width - SAFE_X * 2;
  const ANSWER_W = Math.min(800, Math.round(MAX_CONTENT_W / 0.94));

  const [fontHandle] = useState(() => delayRender("bgp4-idgrotesk"));
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await Promise.all([
          document.fonts.load('300 40px "IDGrotesk"'),
          document.fonts.load('350 40px "IDGrotesk"'),
          document.fonts.load('400 40px "IDGrotesk"'),
          document.fonts.load('500 40px "IDGrotesk"'),
        ]);
        await document.fonts.ready;
      } catch {
        // fall back to the stack in FONT_RUNABLE
      }
      if (!cancelled) continueRender(fontHandle);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fontHandle]);

  // ------------------------------------------------------------- the camera
  const KEY_T = [0, 44, 62, 128, 146, 214, 232, 294, 318, 352, 375];
  const KEY_FY = [704, 704, 1012, 1012, 864, 864, 1064, 1064, 2230, 2230, 2236];
  const KEY_Z = [
    1.09, 1.09, 1.09, 1.09, 0.93, 0.93, 1.03, 1.03, 0.94, 0.94, 0.945,
  ];

  const fx = 540;
  const fy =
    interpolate(frame, KEY_T, KEY_FY, {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) + Math.sin(frame / 34) * 3.5;
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --------------------------------------------------------- entrance timing
  const landT = spring({
    frame,
    fps,
    config: SPRINGS.heavy,
    durationInFrames: 26,
  });
  const cardScale = interpolate(landT, [0, 1], [0.965, 1]);
  const cardLift = interpolate(landT, [0, 1], [26, 0]);

  const row = (delay: number, dur = 16) =>
    interpolate(frame + 46, [delay, delay + dur], [0, 1], {
      easing: OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const siteRowT = spring({
    frame: frame - 2,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 24,
  });

  // (a) the site row fills
  const fillT = interpolate(frame, [32, 54], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const focusRing = interpolate(frame, [26, 36, 62, 78], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // (b) the daily budget drags up, real range $10 -> $1000, lands on $100
  const budgetRaw = interpolate(
    frame,
    [0, 66, 102, 114, 126],
    [10, 10, 118, 118, 100],
    {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const budget = Math.round(budgetRaw);
  const frac = (budgetRaw - 10) / 990;
  const thumbX = MODAL_PAD + frac * INNER;
  const dragging = frame >= 62 && frame <= 130;

  // (c) the real "Runable Managed" badge resolves onto the modal
  const badgeT = spring({
    frame: frame - 152,
    fps,
    config: { damping: 17, stiffness: 74, mass: 1.1 },
  });
  const badgeArc = Math.sin(Math.min(1, Math.max(0, badgeT)) * Math.PI);
  const badgeX = interpolate(badgeT, [0, 1], [612, 0]);
  const badgeY = interpolate(badgeT, [0, 1], [-268, 0]) - badgeArc * 34;
  const badgeScale = interpolate(badgeT, [0, 1], [1.22, 1]);
  const badgeOpacity = interpolate(frame, [150, 168], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeSettle = interpolate(frame, [198, 210, 224], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // (d) the press, the ripple, and the go-live state
  const pressT = interpolate(frame, [256, 262, 274], [0, 1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleP = interpolate(frame, [260, 294], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const liveT = spring({
    frame: frame - 266,
    fps,
    config: { damping: 18, stiffness: 88 },
  });
  const livePulse = liveT > 0.02 ? ((frame - 266) % 34) / 34 : 0;

  // (e) the ask and the answer, one region further down the same world
  const lineDraw = interpolate(frame, [286, 320], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseP = ((Math.max(0, frame - 290) % 46) / 46) * (frame > 290 ? 1 : 0);
  const payoffIn = interpolate(frame, [304, 324], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markPulse = interpolate(frame, [340, 352, 366], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const riseT = spring({
    frame: frame - 336,
    fps,
    config: SPRINGS.heavy,
    durationInFrames: 34,
  });
  const answerY = interpolate(riseT, [0, 1], [2236, ANSWER_C.y]);
  const answerOpacity = interpolate(frame, [336, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const answerGlow = interpolate(frame, [350, 368], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const answerRule = interpolate(frame, [356, 374], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // the modal recedes into bokeh as the camera travels to the payoff
  const modalOpacity = interpolate(frame, [292, 324], [1, 0.18], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const modalBlur = interpolate(frame, [292, 324], [0, 6], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // -------------------------------------------------------------- the cursor
  const dragCursor = interpolate(
    frame,
    [58, 68, 128, 140],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const dragPress = interpolate(frame, [62, 70, 126, 134], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clickCursor = interpolate(
    frame,
    [238, 250, 284, 296],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const clickApproach = interpolate(frame, [238, 256], [1, 0], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardSurface = `linear-gradient(180deg, ${RN.bg} 0%, ${RN.bg} 46%, ${RN.panel} 100%)`;
  const liveShadow =
    liveT > 0.01
      ? `${MRD.panelShadow}, 0 0 ${Math.round(78 * liveT)}px rgba(0,255,171,${(0.30 * liveT).toFixed(3)}), 0 0 0 ${(2.4 * liveT).toFixed(2)}px rgba(0,255,171,${(0.34 * liveT).toFixed(3)})`
      : MRD.panelShadow;

  // ------------------------------------------------------------------ render
  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        backgroundImage: MRD_GRADIENT.ground,
        fontFamily: FONT_RUNABLE,
        overflow: "hidden",
      }}
    >
      <style>{idGroteskFaces(staticFile)}</style>

      {/* --- Merydian ground: rule grid, parallax bands, top streaks ------- */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0px, ${MRD_GRID.color} 1px, transparent 1px, transparent ${MRD_GRID.spacing}px)`,
          backgroundSize: `${MRD_GRID.spacing * (0.55 + 0.45 * z)}px 100%`,
          backgroundPositionX: `${-(fx - 540) * 0.3}px`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.030) 0px, rgba(255,255,255,0.030) 1px, transparent 1px, transparent 300px)",
          backgroundPositionY: `${-fy * 0.16 * z}px`,
          opacity: 0.9,
        }}
      />
      <AbsoluteFill
        style={{
          left: "13%",
          width: "22%",
          height: "54%",
          backgroundImage: MRD_GRADIENT.streak,
          filter: "blur(54px)",
          opacity: 0.34,
        }}
      />
      <AbsoluteFill
        style={{
          left: "64%",
          width: "18%",
          height: "44%",
          backgroundImage: MRD_GRADIENT.streak,
          filter: "blur(60px)",
          opacity: 0.24,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(74% 34% at 50% 2%, ${MRD.tealSoft} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.5,
        }}
      />

      {/* --- the world ---------------------------------------------------- */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: width,
            height: height,
            transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          {/* ---- connector out of the modal, down into the payoff -------- */}
          <div
            style={{
              position: "absolute",
              left: 539,
              top: MODAL_Y + MODAL_H,
              width: 2,
              height: 562,
              background: `linear-gradient(180deg, ${MRD.hairline} 0%, ${MRD.hairlineSoft} 100%)`,
              transform: `scaleY(${lineDraw})`,
              transformOrigin: "top",
            }}
          />
          {frame > 292 ? (
            <div
              style={{
                position: "absolute",
                left: 534,
                top: MODAL_Y + MODAL_H + pulseP * 542,
                width: 12,
                height: 74,
                borderRadius: 6,
                background: `linear-gradient(180deg, rgba(0,255,171,0) 0%, ${MRD.green} 55%, rgba(0,255,171,0) 100%)`,
                opacity: 0.85 * Math.sin(pulseP * Math.PI),
                filter: "blur(2px)",
              }}
            />
          ) : null}

          {/* =========================== PAYOFF REGION ==================== */}
          <div style={{ opacity: payoffIn }}>
            {/* ambient bloom behind the mark */}
            <div
              style={{
                position: "absolute",
                left: MARK_C.x - 330,
                top: MARK_C.y - 330,
                width: 660,
                height: 660,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${MRD.greenSoft} 0%, rgba(0,0,0,0) 68%)`,
                opacity: 0.55,
              }}
            />

            {/* questions arriving */}
            {[
              { x: 140, y: 1930, t: 318 },
              { x: 950, y: 1958, t: 323 },
              { x: 112, y: 2212, t: 328 },
              { x: 966, y: 2176, t: 333 },
            ].map((d, i) => {
              const p = interpolate(frame, [d.t, d.t + 24], [0, 1], {
                easing: EASE,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const dx = MARK_C.x - d.x;
              const dy = MARK_C.y - d.y;
              const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
              const px = d.x + dx * p;
              const py = d.y + dy * p - Math.sin(p * Math.PI) * 44;
              const op = interpolate(p, [0, 0.14, 0.78, 1], [0, 1, 1, 0]);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: px,
                    top: py,
                    opacity: op,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -132,
                      top: -2.5,
                      width: 132,
                      height: 5,
                      borderRadius: 2,
                      transformOrigin: "100% 50%",
                      transform: `rotate(${ang}deg)`,
                      background: `linear-gradient(90deg, rgba(238,237,237,0) 0%, rgba(238,237,237,0.62) 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: -11,
                      top: -11,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: MRD.text,
                      boxShadow: "0 0 26px rgba(255,255,255,0.55)",
                    }}
                  />
                </div>
              );
            })}

            {/* the answer lands */}
            <div
              style={{
                position: "absolute",
                left: ANSWER_C.x - 470,
                top: answerY + ANSWER_H / 2 - 96,
                width: 940,
                height: 200,
                borderRadius: "50%",
                background: `radial-gradient(closest-side, ${MRD.greenGlow} 0%, rgba(0,0,0,0) 72%)`,
                opacity: 0.4 * answerGlow,
                filter: "blur(26px)",
              }}
            />

            {/* the answer: the client's site surfacing (rendered under the mark) */}
            <div
              style={{
                position: "absolute",
                left: ANSWER_C.x - ANSWER_W / 2,
                top: answerY - ANSWER_H / 2,
                width: ANSWER_W,
                height: ANSWER_H,
                borderRadius: 24,
                background: cardSurface,
                border: `1px solid ${RN.border}`,
                boxShadow: `${MRD.panelShadow}, 0 0 ${Math.round(64 * answerGlow)}px rgba(0,255,171,${(0.26 * answerGlow).toFixed(3)})`,
                opacity: answerOpacity,
                transform: `scale(${interpolate(riseT, [0, 1], [0.9, 1])})`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                paddingLeft: 34,
                paddingRight: 34,
                overflow: "hidden",
              }}
            >
              <Globe size={38} color={RN.muted} />
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 400,
                  color: RN.text,
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                }}
              >
                {UI.runAds.sendValue}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: "100%",
                  height: 5,
                  background: MRD_GRADIENT.cta,
                  transform: `scaleX(${answerRule})`,
                  transformOrigin: "left",
                }}
              />
            </div>

            {/* short link between the mark and the answer */}
            <div
              style={{
                position: "absolute",
                left: 539,
                top: MARK_C.y + MARK_S / 2,
                width: 3,
                height: 150,
                background: `linear-gradient(180deg, ${MRD.hairline} 0%, ${MRD.greenGlow} 100%)`,
                transform: `scaleY(${interpolate(frame, [330, 348], [0, 1], {
                  easing: OUT,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })})`,
                transformOrigin: "top",
              }}
            />

            {/* the OpenAI mark that is already on the real modal */}
            {[0, 1].map((i) => {
              const p = Math.max(0, Math.min(1, markPulse - i * 0.22)) / 0.78;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: MARK_C.x - MARK_S / 2 - 40 - p * 120,
                    top: MARK_C.y - MARK_S / 2 - 40 - p * 120,
                    width: MARK_S + 80 + p * 240,
                    height: MARK_S + 80 + p * 240,
                    borderRadius: 90 + p * 120,
                    border: `2px solid rgba(0,255,171,${(0.3 * (1 - p) * Math.min(1, markPulse * 2.6)).toFixed(3)})`,
                  }}
                />
              );
            })}
            <div
              style={{
                position: "absolute",
                left: MARK_C.x - MARK_S / 2,
                top: MARK_C.y - MARK_S / 2,
                width: MARK_S,
                height: MARK_S,
                borderRadius: 58,
                background: cardSurface,
                border: `1px solid ${RN.border}`,
                boxShadow: MRD.panelShadow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 + markPulse * 0.035})`,
              }}
            >
              <OpenAiMark size={124} color={RN.ink} />
            </div>
          </div>

          {/* =========================== THE MODAL ======================== */}
          <div
            style={{
              position: "absolute",
              left: MODAL_X,
              top: MODAL_Y,
              width: MODAL_W,
              height: MODAL_H,
              opacity: modalOpacity,
              filter: modalBlur > 0.05 ? `blur(${modalBlur}px)` : undefined,
              transform: `translateY(${cardLift}px) scale(${cardScale})`,
            }}
          >
            {/* go-live underglow on the dark ground */}
            <div
              style={{
                position: "absolute",
                left: MODAL_W / 2 - 400,
                top: MODAL_H - 30,
                width: 800,
                height: 190,
                borderRadius: "50%",
                background: `radial-gradient(closest-side, ${MRD.greenGlow} 0%, rgba(0,0,0,0) 72%)`,
                opacity: 0.55 * liveT,
                filter: "blur(18px)",
              }}
            />

            {/* the card */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 30,
                background: cardSurface,
                border: `1px solid ${RN.border}`,
                boxShadow: liveShadow,
                overflow: "hidden",
              }}
            >
              {/* live rail across the top edge */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: 5,
                  background: MRD_GRADIENT.cta,
                  transform: `scaleX(${liveT})`,
                  transformOrigin: "left",
                }}
              />

              {/* header: the OpenAI mark chip + close */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: CHIP_Y,
                  width: CHIP_S,
                  height: CHIP_S,
                  borderRadius: 22,
                  background: RN.card,
                  border: `1px solid ${RN.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: row(2, 14),
                }}
              >
                <OpenAiMark size={42} color={RN.ink} />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: MODAL_PAD,
                  top: CHIP_Y + (CHIP_S - CLOSE_S) / 2,
                  opacity: 0.85 * row(6, 14),
                }}
              >
                <CloseX size={CLOSE_S} color={RN.muted} />
              </div>

              {/* go-live status dot */}
              <div
                style={{
                  position: "absolute",
                  right: MODAL_PAD + CLOSE_S + 26,
                  top: CHIP_Y + CHIP_S / 2 - 9,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: MRD.green,
                  opacity: liveT,
                  boxShadow: MRD.glowSoft,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: MODAL_PAD + CLOSE_S + 26 - 13 - livePulse * 20,
                  top: CHIP_Y + CHIP_S / 2 - 22 - livePulse * 20,
                  width: 44 + livePulse * 40,
                  height: 44 + livePulse * 40,
                  borderRadius: "50%",
                  border: `2px solid rgba(0,255,171,${(0.34 * liveT * (1 - livePulse)).toFixed(3)})`,
                }}
              />

              {/* title + subtitle */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: TITLE_Y,
                  width: INNER,
                  fontSize: 56,
                  lineHeight: "66px",
                  fontWeight: 500,
                  color: RN.ink,
                  letterSpacing: -0.8,
                  opacity: row(4, 14),
                  transform: `translateY(${(1 - row(4, 14)) * 14}px)`,
                }}
              >
                {UI.runAds.title}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: SUB_Y,
                  width: INNER,
                  fontSize: 32,
                  lineHeight: "44px",
                  fontWeight: 350,
                  color: RN.muted,
                  letterSpacing: -0.35,
                  whiteSpace: "nowrap",
                  opacity: row(8, 14),
                  transform: `translateY(${(1 - row(8, 14)) * 12}px)`,
                }}
              >
                {UI.runAds.subtitle}
              </div>

              {/* Send visitors to */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: SEND_LABEL_Y,
                  fontSize: 34,
                  lineHeight: "44px",
                  fontWeight: 400,
                  color: RN.textWarm,
                  letterSpacing: -0.2,
                  opacity: 0.35 + 0.65 * siteRowT,
                  transform: `translateY(${((1 - siteRowT) * 16).toFixed(2)}px)`,
                }}
              >
                {UI.runAds.sendLabel}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: INPUT_Y,
                  width: INNER,
                  height: INPUT_H,
                  borderRadius: 16,
                  background: RN.card,
                  border: `1px solid ${RN.borderStrong}`,
                  boxShadow: `0 0 0 ${(4 * focusRing).toFixed(2)}px rgba(0,0,0,${(0.07 * focusRing).toFixed(3)})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  paddingLeft: 26,
                  paddingRight: 26,
                  opacity: 0.22 + 0.78 * siteRowT,
                  transform: `translateY(${((1 - siteRowT) * 30).toFixed(2)}px)`,
                  overflow: "hidden",
                }}
              >
                <div style={{ opacity: row(20, 12), flexShrink: 0 }}>
                  <Globe size={34} color={RN.muted} />
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 400,
                    color: RN.text,
                    letterSpacing: -0.2,
                    whiteSpace: "nowrap",
                    clipPath: `inset(0 ${((1 - fillT) * 100).toFixed(2)}% 0 0)`,
                  }}
                >
                  {UI.runAds.sendValue}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: LINK_Y,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 30,
                  lineHeight: "40px",
                  fontWeight: 400,
                  color: RN.muted,
                  letterSpacing: -0.2,
                  opacity: row(22, 14),
                }}
              >
                {UI.runAds.setDefault}
                <Chevron size={26} color={RN.muted} />
              </div>

              {/* Daily budget */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: BUDGET_LABEL_Y,
                  fontSize: 34,
                  lineHeight: "44px",
                  fontWeight: 400,
                  color: RN.textWarm,
                  letterSpacing: -0.2,
                  opacity: row(25, 14),
                }}
              >
                {UI.runAds.budgetLabel}
              </div>

              {/* value bubble */}
              <div
                style={{
                  position: "absolute",
                  left: thumbX,
                  top: BUBBLE_Y,
                  height: BUBBLE_H,
                  transform: `translateX(-50%) scale(${1 + (dragging ? 0.06 : 0)})`,
                  transformOrigin: "50% 100%",
                  opacity: row(28, 14),
                }}
              >
                <div
                  style={{
                    height: BUBBLE_H,
                    minWidth: 96,
                    borderRadius: 14,
                    background: RN.ink,
                    color: RN.bg,
                    fontSize: 38,
                    fontWeight: 500,
                    letterSpacing: -0.4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: 20,
                    paddingRight: 20,
                    ...TAB,
                  }}
                >
                  {"$" + budget}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: -6,
                    width: 16,
                    height: 16,
                    marginLeft: -8,
                    background: RN.ink,
                    transform: "rotate(45deg)",
                    borderRadius: 3,
                  }}
                />
              </div>

              {/* track */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: TRACK_Y - 4,
                  width: INNER,
                  height: 8,
                  borderRadius: 4,
                  background: RN.borderStrong,
                  opacity: row(28, 14),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: TRACK_Y - 4,
                  width: Math.max(0, thumbX - MODAL_PAD),
                  height: 8,
                  borderRadius: 4,
                  background: RN.ink,
                  opacity: row(28, 14),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: thumbX - 18,
                  top: TRACK_Y - 18,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: RN.ink,
                  boxShadow: dragging
                    ? "0 0 0 12px rgba(0,0,0,0.06)"
                    : "0 2px 6px rgba(0,0,0,0.18)",
                  opacity: row(28, 14),
                }}
              />

              {/* min / max */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: MINMAX_Y,
                  width: INNER,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 32,
                  lineHeight: "42px",
                  fontWeight: 400,
                  color: RN.muted,
                  letterSpacing: -0.2,
                  opacity: row(31, 14),
                  ...TAB,
                }}
              >
                <span>{UI.runAds.min}</span>
                <span>{UI.runAds.max}</span>
              </div>

              {/* fee line */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: FEE_Y,
                  fontSize: 32,
                  lineHeight: "42px",
                  fontWeight: 400,
                  color: RN.muted,
                  letterSpacing: -0.2,
                  opacity: row(33, 14),
                  ...TAB,
                }}
              >
                {UI.runAds.feeLine(budget)}
              </div>

              {/* the black pill CTA */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD,
                  top: CTA_Y,
                  width: INNER,
                  height: CTA_H,
                  borderRadius: 18,
                  background: RN.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  opacity: row(36, 14),
                  transform: `translateY(${(1 - row(36, 14)) * 16}px) scale(${1 - pressT * 0.018})`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: INNER / 2 - 480 * rippleP,
                    top: CTA_H / 2 - 480 * rippleP,
                    width: 960 * rippleP,
                    height: 960 * rippleP,
                    borderRadius: "50%",
                    background: `radial-gradient(closest-side, rgba(255,255,255,${(0.20 * (1 - rippleP)).toFixed(3)}) 0%, rgba(255,255,255,${(0.05 * (1 - rippleP)).toFixed(3)}) 72%, rgba(255,255,255,0) 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    fontSize: 42,
                    fontWeight: 500,
                    color: RN.bg,
                    letterSpacing: -0.4,
                    ...TAB,
                  }}
                >
                  {UI.runAds.cta(budget)}
                </div>
              </div>

              {/* footnote */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD + 34,
                  top: FOOT_Y,
                  width: INNER - 68,
                  fontSize: 26,
                  lineHeight: "36px",
                  fontWeight: 350,
                  color: RN.muted,
                  opacity: 0.45 * row(41, 14),
                  textAlign: "center",
                  letterSpacing: -0.1,
                }}
              >
                {UI.runAds.footnote}
              </div>

              {/* drag cursor */}
              <div
                style={{
                  position: "absolute",
                  left: thumbX + 14,
                  top: TRACK_Y + 2,
                  opacity: dragCursor,
                  transform: `scale(${1 - dragPress * 0.12})`,
                  transformOrigin: "0 0",
                }}
              >
                <Cursor size={46} />
              </div>

              {/* click cursor on the CTA */}
              <div
                style={{
                  position: "absolute",
                  left: MODAL_PAD + INNER / 2 + 96 + clickApproach * 130,
                  top: CTA_Y + CTA_H / 2 + 6 + clickApproach * 120,
                  opacity: clickCursor,
                  transform: `scale(${1 - pressT * 0.14})`,
                  transformOrigin: "0 0",
                }}
              >
                <Cursor size={46} />
              </div>
            </div>

            {/* the real "Runable Managed" badge, resolving onto the modal */}
            <div
              style={{
                position: "absolute",
                left: MODAL_PAD + CHIP_S + 22,
                top: CHIP_Y + (CHIP_S - 58) / 2,
                height: 58,
                borderRadius: 16,
                background: RN.hover,
                border: `1px solid ${RN.borderStrong}`,
                boxShadow: `0 ${(10 * (1 - badgeT)).toFixed(1)}px ${(26 * (1 - badgeT)).toFixed(1)}px rgba(0,0,0,${(0.3 * (1 - badgeT)).toFixed(3)})`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 24,
                paddingRight: 24,
                fontSize: 30,
                fontWeight: 400,
                color: RN.muted,
                letterSpacing: -0.2,
                whiteSpace: "nowrap",
                opacity: badgeOpacity,
                transform: `translate(${badgeX}px, ${badgeY}px) scale(${badgeScale * (1 + badgeSettle * 0.035)})`,
              }}
            >
              {UI.managedBadge}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* soft vignette, full bleed, never lets the frame read flat */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 78% at 50% 46%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
