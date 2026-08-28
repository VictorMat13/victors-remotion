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

// "Drop each file over the video, export the variations, and see which hook wins."
// Fish 3 series look: warm peach paper, white cards, ink details, coral Claude.
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  border: "#F0E4DC",
  coral: "#D97757",
  coralBg: "rgba(217,119,87,0.10)",
};

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- world layout -------------------------------------------------------------
const E = { x: 160, y: 90, w: 760, h: 880 }; // editor card
const PV = { x: E.x + 248, y: E.y + 60, w: 264, h: 470 }; // editor preview (world)
const V1 = { x: 390, y: 240, w: 300, h: 620 }; // middle variant (world)
const VV = { x: V1.x + 12, y: V1.y + 12, w: 276, h: 470 }; // variant video (world)
const SIDE_X = [90, 690]; // left/right variant card x
const SLOTS = [40, 266, 492]; // audio slot x, card-local
const SLOT_Y = 674; // card-local
const CHIP_W = 208;
const CHIP_H = 64;

// ---- timing -------------------------------------------------------------------
const DROP_AT = [36, 56, 76];
const PRESS = 100;
const MORPH = 108;
const SIDE_AT = [112, 116];
const PROG_AT = [132, 140, 148];
const COUNT_AT = 158;
const COUNT_END = 208;
const WIN_AT = 184;

const HOOKS = ["hook-01.mp3", "hook-02.mp3", "hook-03.mp3"];
const FINALS = [4218, 12437, 6873];

const fmt = (n: number) => n.toLocaleString("en-US");

const Crown: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 64 50">
    <path
      d="M6 40 L2 12 L18 24 L32 4 L46 24 L62 12 L58 40 Z"
      fill={C.coral}
    />
    <rect x={6} y={42} width={52} height={7} rx={3.5} fill={C.coral} />
  </svg>
);

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

export const FishHookWins: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 18, 30, 92, 100, 106, 112, 130, 196, 214, 231];
  const fy = interpolate(
    frame,
    KEY,
    [470, 470, 690, 690, 660, 660, 610, 540, 540, 550, 550],
    camOpts,
  );
  let z = interpolate(
    frame,
    KEY,
    [1.3, 1.3, 1.3, 1.3, 1.26, 1.26, 1.18, 1.02, 1.02, 1.06, 1.06],
    camOpts,
  );
  for (const at of [DROP_AT[0] + 14, DROP_AT[1] + 14, DROP_AT[2] + 14, WIN_AT]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.013 * Math.exp(-d / 3);
  }
  const fx = 540;

  // ---- morph: editor card becomes the middle variant ----
  const m = spring({
    frame: Math.max(0, frame - MORPH),
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const card = {
    x: lerp(E.x, V1.x, m),
    y: lerp(E.y, V1.y, m),
    w: lerp(E.w, V1.w, m),
    h: lerp(E.h, V1.h, m),
    r: lerp(30, 22, m),
  };
  const vid = {
    x: lerp(PV.x, VV.x, m),
    y: lerp(PV.y, VV.y, m),
    w: lerp(PV.w, VV.w, m),
    h: lerp(PV.h, VV.h, m),
  };
  const editorFade = Math.max(0, 1 - m * 2.2);
  const variantFade = Math.max(0, (m - 0.55) / 0.45);

  // press ripple
  const press = p(frame, PRESS, PRESS + 6);
  const ripple = p(frame, PRESS, PRESS + 16, Easing.out(Easing.cubic));

  // winner
  const winS = spring({
    frame: Math.max(0, frame - WIN_AT),
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  // counters
  const countP = interpolate(frame, [COUNT_AT, COUNT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ---- variant card chrome (shared) ----
  const variantMeta = (i: number, alive: boolean) => {
    const isWin = i === 1;
    const prog = p(frame, PROG_AT[i], PROG_AT[i] + 20);
    const count = Math.floor(FINALS[i] * countP * (isWin ? 1 : 0.94 + 0.06 * countP));
    return (
      <>
        {/* export progress, fades once done */}
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 470 + 20,
            width: 276,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#F2E8E0",
            opacity: alive ? Math.min(1, p(frame, PROG_AT[i] - 4, PROG_AT[i])) * (1 - p(frame, COUNT_AT - 6, COUNT_AT)) : 0,
          }}
        >
          <div
            style={{
              width: `${prog * 100}%`,
              height: "100%",
              borderRadius: 4,
              backgroundColor: C.coral,
            }}
          />
        </div>
        {/* hook label */}
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: alive ? 1 : 0,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: C.coral,
            }}
          />
          <div
            style={{
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 21,
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {HOOKS[i]}
          </div>
        </div>
        {/* views counter */}
        {frame >= COUNT_AT ? (
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 540,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 42,
                color: isWin && frame >= WIN_AT ? C.coral : C.ink,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {fmt(count)}
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
          </div>
        ) : null}
      </>
    );
  };

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
        {/* ---- side variant cards (fan out from behind the center) ---- */}
        {frame >= MORPH
          ? [0, 1].map((s) => {
              const i = s === 0 ? 0 : 2; // left = hook-01, right = hook-03
              const slide = spring({
                frame: Math.max(0, frame - SIDE_AT[s]),
                fps,
                config: { damping: 16, stiffness: 110 },
              });
              const x = lerp(V1.x, SIDE_X[s], slide);
              const dim = frame >= WIN_AT ? 1 - 0.16 * Math.min(1, winS) : 1;
              return (
                <div
                  key={s}
                  style={{
                    position: "absolute",
                    left: x,
                    top: V1.y,
                    width: V1.w,
                    height: V1.h,
                    borderRadius: 22,
                    backgroundColor: C.card,
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 20px 48px rgba(32,21,21,0.14)",
                    transform: `scale(${lerp(0.92, 1, slide)})`,
                    opacity: Math.min(1, slide * 2) * dim,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      width: 276,
                      height: 470,
                      borderRadius: 14,
                      overflow: "hidden",
                      backgroundColor: "#2A1E19",
                    }}
                  >
                    <Sequence from={MORPH} layout="none">
                      <OffthreadVideo
                        muted
                        src={staticFile(`fish-audio/watch-ad-${i === 0 ? 2 : 3}.mp4`)}
                        startFrom={15}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Sequence>
                  </div>
                  {variantMeta(i, slide > 0.4)}
                </div>
              );
            })
          : null}

        {/* ---- crown over the winner ---- */}
        {frame >= WIN_AT ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 28,
              top: V1.y - 68,
              transform: `scale(${winS}) rotate(${(1 - winS) * -10}deg)`,
              transformOrigin: "center bottom",
            }}
          >
            <Crown size={56} />
          </div>
        ) : null}

        {/* ---- center card: editor that morphs into the winning variant ---- */}
        <div
          style={{
            position: "absolute",
            left: card.x,
            top: card.y,
            width: card.w,
            height: card.h,
            borderRadius: card.r,
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: "0 26px 60px rgba(32,21,21,0.16)",
            transform: `scale(${1 + 0.045 * Math.min(1, winS)})`,
            transformOrigin: "center center",
            opacity: p(frame, 0, 8),
            overflow: "hidden",
          }}
        >
          {/* winner ring, fades in with the win beat */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: card.r,
              border: `3px solid ${C.coral}`,
              opacity: Math.min(1, winS),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {/* ---- editor chrome (fades on morph) ---- */}
          <div style={{ opacity: editorFade }}>
            {/* window dots */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 26,
                display: "flex",
                gap: 10,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: C.border,
                  }}
                />
              ))}
            </div>

            {/* timeline: video lane */}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 570,
                width: 680,
                height: 84,
                borderRadius: 14,
                backgroundColor: C.coralBg,
                border: `1.5px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 10px",
              }}
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 60,
                    borderRadius: 8,
                    background:
                      "linear-gradient(155deg, #33241F 0%, #201515 70%)",
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>

            {/* timeline: audio lane with three slots */}
            {SLOTS.map((sx, i) => {
              const landed = frame >= DROP_AT[i];
              const drop = spring({
                frame: Math.max(0, frame - DROP_AT[i]),
                fps,
                config: { damping: 13, stiffness: 130 },
              });
              return (
                <React.Fragment key={i}>
                  <div
                    style={{
                      position: "absolute",
                      left: sx,
                      top: SLOT_Y,
                      width: CHIP_W,
                      height: CHIP_H + 20,
                      borderRadius: 14,
                      border: `2px dashed ${landed ? C.coral : "#E4D5C9"}`,
                      backgroundColor: landed ? C.coralBg : "transparent",
                    }}
                  />
                  {landed ? (
                    <div
                      style={{
                        position: "absolute",
                        left: sx + 4,
                        top: SLOT_Y + 10 - (1 - drop) * 170,
                        width: CHIP_W - 8,
                        height: CHIP_H,
                        borderRadius: 12,
                        backgroundColor: C.card,
                        border: `1.5px solid ${C.border}`,
                        boxShadow: "0 10px 24px rgba(32,21,21,0.14)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        transform: `scale(${lerp(0.8, 1, Math.min(1, drop))})`,
                        overflow: "hidden",
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
                        {HOOKS[i]}
                      </div>
                      <div style={{ flex: 1 }} />
                      <MiniBars f={frame - DROP_AT[i]} color={C.coral} />
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}

            {/* export button */}
            <div
              style={{
                position: "absolute",
                left: 560,
                top: 792,
                width: 160,
                height: 62,
                borderRadius: 999,
                backgroundColor: C.coral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: p(frame, DROP_AT[2] + 14, DROP_AT[2] + 22),
                transform: `scale(${1 - 0.07 * Math.sin(press * Math.PI)})`,
              }}
            >
              <div
                style={{
                  fontFamily: inter,
                  fontWeight: 700,
                  fontSize: 26,
                  color: "#fff",
                }}
              >
                Export
              </div>
              {/* click ripple */}
              {frame >= PRESS && ripple < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 80 - 60 * ripple,
                    top: 31 - 60 * ripple,
                    width: 120 * ripple,
                    height: 120 * ripple,
                    borderRadius: "50%",
                    border: `3px solid ${C.coral}`,
                    opacity: 1 - ripple,
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* ---- variant chrome (appears after morph) ---- */}
          <div style={{ opacity: variantFade }}>{variantMeta(1, m > 0.6)}</div>
        </div>

        {/* ---- the hero video: lives in world space, morphs with the card ---- */}
        <div
          style={{
            position: "absolute",
            left: vid.x,
            top: vid.y,
            width: vid.w,
            height: vid.h,
            borderRadius: 14,
            overflow: "hidden",
            backgroundColor: "#2A1E19",
            transform: `scale(${1 + 0.045 * Math.min(1, winS)})`,
            transformOrigin: `${card.x + card.w / 2 - vid.x}px ${card.y + card.h / 2 - vid.y}px`,
            opacity: p(frame, 0, 8),
          }}
        >
          <OffthreadVideo
            muted
            src={staticFile("fish-audio/watch-ad-1.mp4")}
            startFrom={4}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
