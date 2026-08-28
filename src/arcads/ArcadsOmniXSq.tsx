import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AR, FONT_SANS, SPRINGS } from "./theme";

// ArcadsOmniXSq — the simple version of the Omni Flash beat:
//   a stacked collab lockup —  [G] Omni Flash  ×  arcads  —
//   then the camera pushes down into the Arcads video-editing screen
//   (real button labels from their site: Edit / Captions / Upscale / Extend).
// Real marks: logos/google.svg + arcads/wordmark-white.png.
export const ARCADS_OMNIX_DURATION = 180;

const W = 1080;
const H = 1080;

const EASE = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- camera rig
// prettier-ignore
const KEY_T = [0, 92, 118, 164, 180];
// prettier-ignore
const FYV = [540, 540, 1700, 1700, 1698];
// prettier-ignore
const ZV = [1.0, 1.07, 1.0, 1.05, 1.05];

// beats
const X_IN = 10;
const WM_IN = 18;
const ARRIVE = 118;
const CLICK = 146;

const CARD_SHADOW = "0 24px 60px rgba(8,8,16,0.55)";

// ------------------------------------------------------------------- lockup
const Lockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rowIn = spring({ frame, fps, config: SPRINGS.snappy });
  const xIn = spring({ frame: frame - X_IN, fps, config: SPRINGS.bouncy });
  const wmIn = spring({ frame: frame - WM_IN, fps, config: SPRINGS.snappy });
  const float = 4 * Math.sin(frame * 0.05);

  // periodic pulse ring behind the lockup
  const cycle = (frame - 26) % 72;
  const ringS = interpolate(cycle, [0, 50], [1, 1.75], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringO = frame < 26 ? 0 : interpolate(cycle, [0, 8, 50], [0, 0.35, 0], clamp);

  // fade the lockup as the camera dives past it
  const leave = interpolate(frame, [96, 116], [1, 0], { ...clamp, easing: EASE });

  return (
    <div style={{ opacity: leave }}>
      {/* glow */}
      <div
        style={{
          position: "absolute",
          left: 540 - 660,
          top: 540 - 660,
          width: 1320,
          height: 1320,
          background: `radial-gradient(circle at 50% 50%, ${AR.primaryDeep}5C, rgba(0,0,0,0) 62%)`,
        }}
      />
      {/* pulse ring */}
      <div
        style={{
          position: "absolute",
          left: 540 - 330,
          top: 540 - 330,
          width: 660,
          height: 660,
          borderRadius: "50%",
          border: `2px solid ${AR.primaryLight}`,
          transform: `scale(${ringS})`,
          opacity: ringO,
        }}
      />

      <div style={{ position: "absolute", left: 0, top: float, width: 1080 }}>
        {/* row 1 — [G] Omni Flash */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 350,
            width: 1080,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
            opacity: rowIn,
            transform: `translateY(${(1 - rowIn) * 46}px)`,
          }}
        >
          <Img src={staticFile("logos/google.svg")} style={{ width: 84, height: 84 }} />
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: -2.5,
              color: AR.heading,
              whiteSpace: "nowrap",
            }}
          >
            Omni Flash
          </span>
        </div>

        {/* the × */}
        <div
          style={{
            position: "absolute",
            left: 540 - 44,
            top: 530,
            width: 88,
            height: 88,
            display: "grid",
            placeItems: "center",
            opacity: xIn,
            transform: `scale(${0.3 + 0.7 * xIn}) rotate(${(1 - xIn) * -110}deg)`,
          }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <path
              d="M16 16L56 56M56 16L16 56"
              stroke={AR.primaryLight}
              strokeWidth={11}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* row 3 — real arcads wordmark */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 656,
            width: 1080,
            display: "flex",
            justifyContent: "center",
            opacity: wmIn,
            transform: `translateY(${(1 - wmIn) * 40}px)`,
          }}
        >
          <Img
            src={staticFile("arcads/wordmark-white.png")}
            style={{ height: 92, width: "auto", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------ editing screen
const PANEL = { x: 100, y: 1270, w: 880, h: 866 };
const BTNS = ["Edit", "Captions", "Upscale", "Extend"];
const BTN_W = 190;
const BTN_GAP = 13;
const BTN_Y = PANEL.y + 726; // world y of the button row
const btnX = (i: number) => PANEL.x + 40 + i * (BTN_W + BTN_GAP);
const TARGET = 1; // Captions — the reel's whole point

const BtnIcon: React.FC<{ i: number; active: boolean }> = ({ i, active }) => {
  const stroke = active ? "#FFFFFF" : AR.body;
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (i === 0)
    return (
      <svg {...common}>
        <path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" />
      </svg>
    );
  if (i === 1)
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M10 11h-3v3h3M17 11h-3v3h3" />
      </svg>
    );
  if (i === 2)
    return (
      <svg {...common}>
        <path d="M9 21H3v-6M15 3h6v6M3 21l7-7M21 3l-7 7" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
};

const EditorScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 100, fps, config: SPRINGS.smooth });

  // cursor path: rises from below the buttons onto the Captions pill
  const t = interpolate(frame, [ARRIVE + 6, CLICK - 4], [0, 1], { ...clamp, easing: EASE });
  const curX = interpolate(t, [0, 1], [PANEL.x + 700, btnX(TARGET) + BTN_W / 2 + 22]);
  const curY = interpolate(t, [0, 1], [PANEL.y + 880, BTN_Y + 40]);
  const curO = interpolate(frame, [ARRIVE + 4, ARRIVE + 10], [0, 1], clamp);

  // click
  const press = interpolate(frame, [CLICK - 2, CLICK, CLICK + 6], [1, 0.9, 1], { ...clamp, easing: EASE });
  const rippleS = interpolate(frame, [CLICK, CLICK + 14], [0.7, 1.9], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rippleO = interpolate(frame, [CLICK - 1, CLICK, CLICK + 14], [0, 0.55, 0], clamp);
  const active = frame >= CLICK;
  const bloom = interpolate(frame, [CLICK, CLICK + 8, CLICK + 34], [0, 0.5, 0.2], clamp);

  return (
    <>
      {/* glow behind the editor */}
      <div
        style={{
          position: "absolute",
          left: 540 - 740,
          top: PANEL.y + PANEL.h / 2 - 740,
          width: 1480,
          height: 1480,
          background: `radial-gradient(circle at 50% 50%, ${AR.primary}30, rgba(0,0,0,0) 62%)`,
          opacity: 0.6 + bloom,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 30,
          background: AR.card,
          border: `1.5px solid ${active ? `${AR.primaryLight}55` : AR.border}`,
          boxShadow: active
            ? `0 24px 60px rgba(8,8,16,0.55), 0 0 52px ${AR.primary}33`
            : CARD_SHADOW,
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 70}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(165,167,217,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,0.04) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* header — real arcads wordmark */}
        <div style={{ position: "absolute", left: 40, top: 36 }}>
          <Img
            src={staticFile("arcads/wordmark-white.png")}
            style={{ height: 36, width: "auto", display: "block" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 44,
            top: 48,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: AR.onlineGreen,
            boxShadow: `0 0 12px ${AR.onlineGreen}`,
          }}
        />

        {/* the video being edited */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 104,
            width: PANEL.w - 80,
            height: 580,
            borderRadius: 22,
            overflow: "hidden",
            background: "#0C0C16",
            border: `1px solid ${AR.border}`,
          }}
        >
          <Sequence from={100} layout="none">
            <OffthreadVideo
              muted
              src={staticFile("arcads/demo.mp4")}
              trimBefore={330}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 40%",
              }}
            />
          </Sequence>
        </div>

        {/* real Arcads editing actions */}
        {BTNS.map((label, i) => {
          const isTarget = i === TARGET;
          const on = isTarget && active;
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: btnX(i) - PANEL.x,
                top: BTN_Y - PANEL.y,
                width: BTN_W,
                height: 80,
                borderRadius: 18,
                background: on ? AR.gradCTA : AR.deep,
                border: `1.5px solid ${on ? `${AR.primaryLight}AA` : AR.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transform: isTarget ? `scale(${press})` : undefined,
                boxShadow: on ? `0 10px 28px ${AR.primary}66` : "none",
              }}
            >
              <BtnIcon i={i} active={on} />
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 30,
                  fontWeight: 600,
                  color: on ? "#FFFFFF" : AR.body,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* click ripple over the Captions pill */}
      <div
        style={{
          position: "absolute",
          left: btnX(TARGET) - 20,
          top: BTN_Y - 20,
          width: BTN_W + 40,
          height: 120,
          borderRadius: 26,
          border: `3px solid ${AR.primaryLight}`,
          transform: `scale(${rippleS})`,
          opacity: rippleO,
        }}
      />

      {/* cursor */}
      <div
        style={{
          position: "absolute",
          left: curX,
          top: curY,
          opacity: curO,
          transform: `scale(${press})`,
          zIndex: 30,
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24">
          <path
            d="M5 3l14 8-6.5 1.5L9 19 5 3z"
            fill="#FFFFFF"
            stroke="#12121E"
            strokeWidth={1.4}
          />
        </svg>
      </div>
    </>
  );
};

// --------------------------------------------------------------------- root
export const ArcadsOmniXSq: React.FC = () => {
  const frame = useCurrentFrame();

  const fx = 540;
  const fy = interpolate(frame, KEY_T, FYV, { easing: EASE, ...clamp });
  let z = interpolate(frame, KEY_T, ZV, { easing: EASE, ...clamp });
  z += interpolate(frame, [CLICK, CLICK + 2, CLICK + 10], [0, 0.012, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: AR.bg, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Altari 64px grid across the world */}
        <div
          style={{
            position: "absolute",
            left: -700,
            top: -600,
            width: 2480,
            height: 3600,
            backgroundImage: `linear-gradient(rgba(165,167,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,0.045) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        <Lockup />
        <EditorScreen />
      </div>
    </AbsoluteFill>
  );
};
