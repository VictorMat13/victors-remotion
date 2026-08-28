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
import { AR, ARCADS, FONT_SANS, SPRINGS } from "./theme";

// ArcadsDontTouchTimeline — covers VO 0:08–0:17 of the Arcads reel:
//   "You don't touch a timeline, you just tell Arcads how you want the video
//    to be edited. I took the video you're watching now, cut it down to
//    thirty seconds, and typed: 'animate the key words on screen as I say them.'"
// One continuous dark Altari-purple world, camera travels down through:
//   A (timeline, struck out)  B (real arcads.ai in a browser card)
//   C (the reel in a phone + 0:33→0:30 trim)  D (composer types the real prompt)
export const ARCADS_DTT_DURATION = 270;

const W = 1080;
const H = 1920;

const EASE = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- camera rig
// prettier-ignore
const KEY_T = [0, 26, 48, 88, 110, 152, 170, 238, 256, 270];
// prettier-ignore
const FYV = [700, 700, 2250, 2320, 3654, 3660, 4380, 4390, 4000, 3996];
// prettier-ignore
const ZV = [1.09, 1.09, 0.97, 1.04, 1.22, 1.26, 1.16, 1.18, 0.92, 0.925];

// beat frames
const LOCK = 16; // timeline strike
const TRIM_START = 118;
const TRIM_END = 142;
const TRIM_SNAP = 146;
const TYPE_START = 176;
const TYPE_END = 232;
const SEND = 238;

const CARD_SHADOW = "0 24px 60px rgba(8,8,16,0.55)";
const DEVICE_SHADOW = "0 34px 80px rgba(8,8,16,0.65)";

// ------------------------------------------------------------------- shared
const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  size?: number;
  pad?: string;
  style?: React.CSSProperties;
}> = ({ children, color, bg, border, size, pad, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      fontFamily: FONT_SANS,
      fontVariantNumeric: "tabular-nums",
      fontSize: size ?? 22,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: color ?? AR.heading,
      background: bg ?? AR.card,
      border: `1.5px solid ${border ?? AR.border}`,
      borderRadius: 12,
      padding: pad ?? "7px 14px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

// 24px grid that Altari puts on every card
const cardGrid = (opacity: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(rgba(165,167,217,${opacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,${opacity}) 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
});

// ------------------------------------------------------------------- Zone A
// The timeline you don't touch. Playhead scrubs from frame 0, then the whole
// panel takes a red strike and recedes.
const TL = { x: 100, y: 340, w: 880, h: 720 };

const VCLIPS = [
  { x: 36, w: 150 },
  { x: 196, w: 96 },
  { x: 302, w: 190 },
  { x: 502, w: 120 },
  { x: 632, w: 212 },
];
const WAVE = [14, 30, 22, 38, 18, 32, 26, 40, 16, 28, 34, 20, 36, 24, 30, 18, 38, 26, 22, 34, 16, 30, 40, 24, 28, 20, 34, 26, 18, 32, 24, 38, 16, 30, 22, 36, 18, 28, 40, 20, 32, 26, 14, 34, 24, 30, 18, 38, 22, 28, 16, 36, 26, 32, 20];

const ZoneATimeline: React.FC = () => {
  const frame = useCurrentFrame();

  const playX = interpolate(frame, [0, LOCK], [220, 560], {
    ...clamp,
    easing: Easing.linear,
  });

  // red fade + recede — the timeline deactivates instead of being struck out
  const redFade = interpolate(frame, [LOCK, LOCK + 12], [0, 1], { ...clamp, easing: EASE });
  const recede = interpolate(frame, [LOCK + 4, LOCK + 22], [0, 1], { ...clamp, easing: EASE });
  const dim = 1 - 0.55 * recede;

  return (
    <div
      style={{
        position: "absolute",
        left: TL.x,
        top: TL.y,
        width: TL.w,
        height: TL.h,
        opacity: dim,
        transform: `scale(${1 - 0.05 * recede})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 28,
          background: AR.card,
          border: `1.5px solid ${AR.border}`,
          boxShadow: CARD_SHADOW,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...cardGrid(0.05) }} />

        {/* ruler */}
        <div style={{ position: "absolute", left: 36, right: 36, top: 30, height: 40 }}>
          {[0, 10, 20, 30, 40].map((sec, i) => (
            <div
              key={sec}
              style={{
                position: "absolute",
                left: `${(i / 4) * 100}%`,
                transform: "translateX(-50%)",
                fontFamily: FONT_SANS,
                fontVariantNumeric: "tabular-nums",
                fontSize: 21,
                fontWeight: 600,
                color: AR.faint,
              }}
            >
              0:{String(sec).padStart(2, "0")}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 34,
              height: 1.5,
              background: AR.border,
            }}
          />
        </div>

        {/* V1 clips */}
        <div style={{ position: "absolute", left: 36, top: 100, width: 808, height: 150 }}>
          {VCLIPS.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x,
                top: 0,
                width: c.w,
                height: 150,
                borderRadius: 12,
                background:
                  i % 2 === 0
                    ? `linear-gradient(145deg, ${AR.primary}66, ${AR.primaryDeep}88)`
                    : `linear-gradient(145deg, ${AR.primaryLight}44, ${AR.primary}55)`,
                border: `1px solid ${AR.primaryLight}55`,
              }}
            />
          ))}
        </div>

        {/* A1 waveform */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 286,
            width: 808,
            height: 110,
            borderRadius: 12,
            background: `${AR.bgAlt}AA`,
            border: `1px solid ${AR.border}`,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 14px",
            overflow: "hidden",
          }}
        >
          {WAVE.map((h, i) => {
            const wob = frame < LOCK ? 1 + 0.3 * Math.sin(frame * 0.32 + i * 1.3) : 1;
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: Math.max(6, h * wob),
                  borderRadius: 4,
                  background: AR.primaryLight,
                  opacity: 0.75,
                }}
              />
            );
          })}
        </div>

        {/* A2 thin track */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 426,
            width: 808,
            height: 60,
            borderRadius: 10,
            background: `${AR.bgAlt}77`,
            border: `1px solid ${AR.border}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 13,
              width: 420,
              height: 34,
              borderRadius: 8,
              background: `${AR.primary}33`,
              border: `1px solid ${AR.primary}44`,
            }}
          />
        </div>

        {/* FX track */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 516,
            width: 808,
            height: 60,
            borderRadius: 10,
            background: `${AR.bgAlt}55`,
            border: `1px solid ${AR.border}`,
          }}
        >
          {[
            { x: 30, w: 170 },
            { x: 250, w: 110 },
            { x: 480, w: 200 },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x,
                top: 13,
                width: b.w,
                height: 34,
                borderRadius: 8,
                background: `${AR.primaryLight}22`,
                border: `1px dashed ${AR.primaryLight}44`,
              }}
            />
          ))}
        </div>

        {/* footer scrubber */}
        <div
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            bottom: 34,
            height: 6,
            borderRadius: 3,
            background: `${AR.border}`,
          }}
        >
          <div
            style={{
              width: `${((playX - 36) / 808) * 100}%`,
              height: "100%",
              borderRadius: 3,
              background: AR.gradCTA,
            }}
          />
        </div>

        {/* playhead */}
        <div
          style={{
            position: "absolute",
            left: playX,
            top: 76,
            width: 3,
            height: 520,
            background: AR.primaryLight,
            boxShadow: `0 0 16px ${AR.primaryLight}`,
            borderRadius: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -8,
              top: -14,
              width: 19,
              height: 16,
              borderRadius: "4px 4px 9px 9px",
              background: AR.primaryLight,
            }}
          />
        </div>
        {/* red wash — the whole timeline fades red as it deactivates */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(160deg, ${AR.red}2E, ${AR.red}55)`,
            opacity: redFade,
          }}
        />
      </div>

      {/* red edge glow while it recedes */}
      <div
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: 32,
          border: `2px solid ${AR.red}`,
          boxShadow: `0 0 44px ${AR.red}55`,
          opacity: redFade * 0.75,
        }}
      />
    </div>
  );
};

// ------------------------------------------------------------------- Zone B
// The real arcads.ai — Playwright capture scrolling inside a browser card.
const BR = { x: 80, y: 1660, w: 920, h: 1180, chrome: 96 };

const ZoneBBrowser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 30, fps, config: SPRINGS.smooth });
  const scroll = interpolate(frame, [50, 150], [0, 620], { ...clamp, easing: EASE });
  const imgH = (8000 / 2880) * BR.w; // site-scroll.png scaled to card width

  return (
    <>
      {/* glow behind the card */}
      <div
        style={{
          position: "absolute",
          left: 540 - 760,
          top: BR.y + BR.h / 2 - 760,
          width: 1520,
          height: 1520,
          background: `radial-gradient(circle at 50% 50%, ${AR.primary}2E, rgba(0,0,0,0) 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BR.x,
          top: BR.y,
          width: BR.w,
          height: BR.h,
          borderRadius: 26,
          background: AR.card,
          border: `1.5px solid ${AR.border}`,
          boxShadow: CARD_SHADOW,
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 70}px)`,
        }}
      >
        {/* chrome */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: BR.chrome,
            background: AR.bgAlt,
            borderBottom: `1.5px solid ${AR.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 30px",
            gap: 12,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: AR.border,
              }}
            />
          ))}
          <div
            style={{
              margin: "0 auto",
              width: 360,
              height: 52,
              borderRadius: 26,
              background: AR.bg,
              border: `1px solid ${AR.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={AR.body} strokeWidth={2.4}>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: 26,
                fontWeight: 600,
                color: AR.body,
              }}
            >
              {ARCADS.domain}
            </span>
          </div>
          <div style={{ width: 72 }} />
        </div>

        {/* the real site, drifting up */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: BR.chrome,
            width: "100%",
            height: BR.h - BR.chrome,
            overflow: "hidden",
            background: "#EFEDEA",
          }}
        >
          <Img
            src={staticFile("arcads/site-scroll.png")}
            style={{
              position: "absolute",
              left: 0,
              top: -scroll,
              width: BR.w,
              height: imgH,
            }}
          />
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------- Zone C
// The reel itself in a dark device + the 0:33 → 0:30 trim.
const PH = { x: 310, y: 3240, w: 460, h: 828 };

const ZoneCPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 84, fps, config: SPRINGS.heavy });
  const float = 2 * Math.sin(frame * 0.055);

  // trim: duration ticks 0:33 → 0:30, progress handle pulls back
  const trimSec = Math.round(interpolate(frame, [TRIM_START, TRIM_END], [33, 30], clamp));
  const handle = interpolate(frame, [TRIM_START, TRIM_END], [1, 30 / 33], { ...clamp, easing: EASE });
  const trimActive = frame >= TRIM_START - 6;

  // snap ring on trim
  const ringS = interpolate(frame, [TRIM_SNAP, TRIM_SNAP + 14], [0.99, 1.14], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringO = interpolate(frame, [TRIM_SNAP, TRIM_SNAP + 14], [0.8, 0], clamp);

  // send payoff ring + bloom
  const payRing = interpolate(frame, [SEND + 12, SEND + 30], [0.99, 1.16], { ...clamp, easing: Easing.out(Easing.cubic) });
  const payRingO = interpolate(frame, [SEND + 12, SEND + 30], [0.85, 0], clamp);
  const bloom = interpolate(frame, [SEND + 10, SEND + 18, SEND + 32], [0, 0.5, 0.18], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: PH.x,
        top: PH.y + (1 - enter) * 110 + float,
        width: PH.w,
        height: PH.h,
        opacity: enter,
      }}
    >
      {/* bloom halo on payoff */}
      <div
        style={{
          position: "absolute",
          left: -220,
          top: -180,
          width: PH.w + 440,
          height: PH.h + 380,
          background: `radial-gradient(50% 50% at 50% 50%, ${AR.primary}88 0%, rgba(0,0,0,0) 68%)`,
          opacity: bloom,
        }}
      />
      {/* device */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 46,
          background: "#12121E",
          border: `1.5px solid ${AR.border}`,
          boxShadow: DEVICE_SHADOW,
        }}
      />
      {/* trim snap ring */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: 52,
          border: `3px solid ${AR.primaryLight}`,
          transform: `scale(${ringS})`,
          opacity: ringO,
        }}
      />
      {/* payoff ring */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: 52,
          border: `3px solid ${AR.primaryLight}`,
          transform: `scale(${payRing})`,
          opacity: payRingO,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          width: PH.w - 20,
          height: PH.h - 20,
          borderRadius: 38,
          overflow: "hidden",
          background: "#0C0C16",
        }}
      >
        <Sequence from={56} layout="none">
          <OffthreadVideo
            muted
            src={staticFile("arcads/demo.mp4")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Sequence>

        {/* duration chip — ticks down during the cut */}
        <div style={{ position: "absolute", left: 16, top: 16 }}>
          <Chip
            size={21}
            pad="5px 12px"
            color={AR.heading}
            bg="rgba(13,13,20,0.72)"
            border={trimActive ? `${AR.primaryLight}88` : "rgba(255,255,255,0.16)"}
          >
            0:{String(trimSec).padStart(2, "0")}
          </Chip>
        </div>

        {/* trim bar — handle pulls back from 0:33 to 0:30 */}
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 16,
            width: PH.w - 56,
            height: 7,
            borderRadius: 4,
            background: "rgba(255,255,255,0.22)",
          }}
        >
          <div
            style={{
              width: `${handle * 100}%`,
              height: "100%",
              borderRadius: 4,
              background: `linear-gradient(90deg, ${AR.primaryLight}, ${AR.primary})`,
            }}
          />
          {/* the cut-off tail */}
          <div
            style={{
              position: "absolute",
              left: `${handle * 100}%`,
              right: 0,
              top: 0,
              height: "100%",
              borderRadius: 4,
              background: `rgba(255,107,138,${trimActive ? 0.4 : 0})`,
            }}
          />
          {/* handle knob */}
          <div
            style={{
              position: "absolute",
              left: `calc(${handle * 100}% - 8px)`,
              top: -6,
              width: 16,
              height: 19,
              borderRadius: 6,
              background: AR.heading,
              border: `2px solid ${AR.primaryLight}`,
              opacity: trimActive ? 1 : 0,
              boxShadow: `0 0 14px ${AR.primary}AA`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------- Zone D
// The composer — you just tell Arcads. Types the REAL prompt from the reel.
const CO = { x: 100, y: 4270, w: 880, h: 210 };

const ZoneDComposer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 150, fps, config: SPRINGS.smooth });

  const typedCount = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, ARCADS.typedPrompt.length], clamp),
  );
  const typed = ARCADS.typedPrompt.slice(0, typedCount);
  const caretOn = frame >= 158 && frame < SEND && frame % 18 < 11;
  const sent = frame >= SEND + 2;

  const press = interpolate(frame, [SEND - 2, SEND, SEND + 6], [1, 0.84, 1], { ...clamp, easing: EASE });
  const rippleS = interpolate(frame, [SEND, SEND + 16], [0.6, 2.2], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rippleO = interpolate(frame, [SEND, SEND + 16], [0.6, 0], clamp);

  // connector packet up to the phone
  const packetY = interpolate(frame, [SEND + 2, SEND + 12], [0, -210], { ...clamp, easing: EASE });
  const packetO = interpolate(frame, [SEND + 2, SEND + 4, SEND + 11, SEND + 13], [0, 1, 1, 0], clamp);

  // dashed connector, drawn as the composer arrives
  const connH = interpolate(frame, [156, 172], [0, 176], { ...clamp, easing: EASE });

  return (
    <>
      {/* connector phone → composer */}
      <div
        style={{
          position: "absolute",
          left: 537,
          top: 4082,
          width: 5,
          height: connH,
          opacity: 0.7 * enter,
          background: `repeating-linear-gradient(180deg, ${AR.primary}99 0px, ${AR.primary}99 13px, transparent 13px, transparent 26px)`,
          borderRadius: 3,
        }}
      />
      {/* packet */}
      <div
        style={{
          position: "absolute",
          left: 527,
          top: 4272 + packetY,
          width: 25,
          height: 25,
          borderRadius: "50%",
          background: AR.primaryLight,
          boxShadow: `0 0 26px ${AR.primaryLight}`,
          opacity: packetO,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: CO.x,
          top: CO.y,
          width: CO.w,
          minHeight: CO.h,
          borderRadius: 32,
          background: AR.card,
          border: `1.5px solid ${sent ? `${AR.primaryLight}66` : AR.border}`,
          boxShadow: sent ? `0 24px 60px rgba(8,8,16,0.55), 0 0 46px ${AR.primary}44` : CARD_SHADOW,
          padding: "26px 30px",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 80}px)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 32, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, ...cardGrid(0.04) }} />
        </div>

        {/* arcads chip — the real wordmark on its light ground */}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: 54,
            padding: "0 18px",
            borderRadius: 14,
            background: "#EFEDEA",
            border: `1px solid ${AR.border}`,
            marginBottom: 20,
          }}
        >
          <Img
            src={staticFile("arcads/wordmark-raw.png")}
            style={{ height: 34, width: "auto", display: "block" }}
          />
        </div>

        {/* input line */}
        <div
          style={{
            position: "relative",
            fontFamily: FONT_SANS,
            fontSize: 37,
            fontWeight: 600,
            lineHeight: 1.3,
            color: AR.heading,
            minHeight: 50,
            paddingRight: 110,
          }}
        >
          {typed}
          {caretOn && (
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: 40,
                background: AR.primaryLight,
                verticalAlign: "-7px",
                marginLeft: 4,
                borderRadius: 2,
              }}
            />
          )}
        </div>

        {/* send */}
        <div style={{ position: "absolute", right: 26, bottom: 26, width: 78, height: 78 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2.5px solid ${AR.primaryLight}`,
              transform: `scale(${rippleS})`,
              opacity: rippleO,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: AR.gradCTA,
              display: "grid",
              placeItems: "center",
              transform: `scale(${press})`,
              boxShadow: `0 12px 30px ${AR.primary}66`,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V6" />
              <path d="M6 12l6-6 6 6" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

// --------------------------------------------------------------------- root
export const ArcadsDontTouchTimeline: React.FC = () => {
  const frame = useCurrentFrame();

  const fy = interpolate(frame, KEY_T, FYV, { easing: EASE, ...clamp });
  let z = interpolate(frame, KEY_T, ZV, { easing: EASE, ...clamp });
  // impact bumps: trim snap + send
  z += interpolate(frame, [TRIM_SNAP, TRIM_SNAP + 2, TRIM_SNAP + 11], [0, 0.014, 0], clamp);
  z += interpolate(frame, [SEND, SEND + 2, SEND + 11], [0, 0.012, 0], clamp);

  const fx = 540;

  return (
    <AbsoluteFill style={{ backgroundColor: AR.bg, fontFamily: FONT_SANS }}>
      {/* world */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Altari 64px grid across the whole world */}
        <div
          style={{
            position: "absolute",
            left: -560,
            top: -400,
            width: 2200,
            height: 6200,
            backgroundImage: `linear-gradient(rgba(165,167,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(165,167,217,0.045) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        {/* zone glows */}
        <div
          style={{
            position: "absolute",
            left: 540 - 700,
            top: 640 - 700,
            width: 1400,
            height: 1400,
            background: `radial-gradient(circle at 50% 50%, ${AR.primaryDeep}55, rgba(0,0,0,0) 64%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 720,
            top: 3660 - 780,
            width: 1440,
            height: 1560,
            background: `radial-gradient(circle at 50% 50%, ${AR.primary}26, rgba(0,0,0,0) 62%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 640,
            top: 4380 - 560,
            width: 1280,
            height: 1120,
            background: `radial-gradient(circle at 50% 50%, ${AR.primaryDeep}44, rgba(0,0,0,0) 66%)`,
          }}
        />

        <ZoneATimeline />
        <ZoneBBrowser />
        <ZoneCPhone />
        <ZoneDComposer />
      </div>
    </AbsoluteFill>
  );
};
