import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_MONO, FONT_SANS, SPRINGS, TV } from "./theme";

// TvP2PasteAd — "paste a working ad → dissect it → rebuild with your product"
// LIAM WHITE STYLE: warm white world, floating white cards with soft shadows,
// Topview purple as the accent. Dark lives only INSIDE cards (phone footage).
// One continuous vertical world, camera travels down through three zones:
//   A (paste, y~0-1900)  B (dissect, y~2000-3450)  C (rebuild, y~3850-5000)
export const DURATION_IN_FRAMES = 360;

const W = 1080;
const H = 1920;

// White-style shared surfaces
const CARD_SHADOW = "0 14px 40px rgba(23,23,28,0.12)";
const DEVICE_SHADOW = "0 30px 70px rgba(23,23,28,0.2)";
const VIOLET_TINT_BG = "#EDE9FE";
const VIOLET_TINT_TEXT = "#5B21B6";
const CYAN_TINT_BG = "#CFFAFE";
const CYAN_TINT_TEXT = "#155E75";

// ---------------------------------------------------------------- camera rig
const EASE = Easing.inOut(Easing.cubic);
// prettier-ignore
const KEY_T = [0, 16, 40, 70, 90, 134, 150, 168, 184, 202, 224, 240, 252, 266, 278, 292, 312, 330, 348, 360];
// prettier-ignore
const FXV = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 430, 430, 430, 430, 430, 430, 620, 755, 755, 755];
// prettier-ignore
const FYV = [640, 640, 1080, 1080, 2620, 2620, 2300, 2300, 3140, 3140, 4080, 4080, 4440, 4440, 4800, 4800, 4480, 4474, 4468, 4468];
// prettier-ignore
const ZV = [1.20, 1.20, 0.98, 0.98, 0.90, 0.90, 1.12, 1.12, 1.12, 1.12, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 0.80, 1.005, 1.015, 1.015];

// Snap frames for the three rebuild beats
const S1 = 228;
const S2 = 256;
const S3 = 282;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- tiny atoms
const MonoChip: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  size?: number;
  pad?: string;
  shadow?: string;
  style?: React.CSSProperties;
}> = ({ children, color, bg, border, size, pad, shadow, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: FONT_MONO,
      fontVariantNumeric: "tabular-nums",
      fontSize: size ?? 20,
      fontWeight: 700,
      letterSpacing: 1,
      color: color ?? TV.text,
      background: bg ?? TV.panel,
      border: `1.5px solid ${border ?? TV.border}`,
      borderRadius: 10,
      padding: pad ?? "6px 12px",
      boxShadow: shadow ?? "0 6px 18px rgba(23,23,28,0.08)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

const PacingBars: React.FC<{ frame: number; seed: number; color: string }> = ({
  frame,
  seed,
  color,
}) => {
  const base = [14, 26, 10, 30, 18, 24, 12, 20];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 32 }}>
      {base.map((h, i) => {
        const wob = 1 + 0.35 * Math.sin(frame * 0.28 + seed * 2.1 + i * 1.25);
        return (
          <div
            key={i}
            style={{
              width: 6,
              height: Math.max(6, h * wob),
              borderRadius: 3,
              background: color,
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------- Zone A
const ZoneAPaste: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // URL bar present from frame 0, settling
  const barIn = spring({ frame, fps, config: SPRINGS.smooth });
  const barScale = 0.965 + 0.035 * barIn;
  const barOpacity = interpolate(frame, [0, 4], [0.75, 1], clamp);

  // paste beat
  const urlOpacity = interpolate(frame, [6, 9], [0, 1], clamp);
  const urlSlide = interpolate(frame, [6, 12], [-14, 0], { ...clamp, easing: EASE });
  const highlight = interpolate(frame, [6, 10, 26], [0, 0.16, 0], clamp);
  const cmdPop = spring({ frame: frame - 4, fps, config: SPRINGS.snappy });
  const cmdFade = interpolate(frame, [18, 27], [1, 0], clamp);

  // submit press at 16
  const press = interpolate(frame, [15, 18, 24], [1, 0.84, 1], { ...clamp, easing: EASE });
  const rippleScale = interpolate(frame, [16, 32], [0.6, 2.1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rippleOpacity = interpolate(frame, [16, 32], [0.6, 0], clamp);

  // meta chip after ingest
  const metaIn = spring({ frame: frame - 22, fps, config: SPRINGS.snappy });

  // phone drop at 18
  const drop = spring({ frame: frame - 18, fps, config: SPRINGS.heavy });
  const phoneY = interpolate(drop, [0, 1], [-640, 0]);
  const phoneRot = interpolate(drop, [0, 1], [-4, 0]);
  const phoneOpacity = interpolate(frame, [16, 23], [0, 1], clamp);
  const phoneFloat = 2 * Math.sin(frame * 0.06);

  // scan beam over the ad while camera holds
  const beamY = interpolate(frame, [46, 68], [-30, 838], { ...clamp, easing: EASE });
  const beamOpacity = interpolate(frame, [44, 48, 64, 69], [0, 1, 1, 0], clamp);

  // playback state (video mounts at frame 10)
  const played = Math.max(0, (frame - 10) / fps);
  const progress = Math.min(1, played / 15);
  const tickSec = Math.min(15, Math.floor(played));

  // guide line down toward the dissect zone
  const guideH = interpolate(frame, [64, 88], [0, 400], { ...clamp, easing: EASE });
  const guideOpacity = interpolate(frame, [64, 70, 124, 138], [0, 0.7, 0.7, 0], clamp);

  const SCREEN_W = 440;
  const SCREEN_H = 808;

  return (
    <>
      {/* URL / paste bar — floating white pill */}
      <div
        style={{
          position: "absolute",
          left: 540 - 380,
          top: 470 - 46,
          width: 760,
          height: 92,
          borderRadius: 26,
          background: TV.panel,
          border: `1.5px solid ${TV.border}`,
          boxShadow: CARD_SHADOW,
          display: "flex",
          alignItems: "center",
          padding: "0 16px 0 18px",
          gap: 14,
          transform: `scale(${barScale})`,
          opacity: barOpacity,
        }}
      >
        <Img
          src={staticFile("topview/topview-icon.webp")}
          style={{ width: 42, height: 42, borderRadius: 11 }}
        />
        <div style={{ position: "relative", flex: 1, height: 48, display: "flex", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              left: -8,
              top: 2,
              width: 600,
              height: 44,
              borderRadius: 8,
              background: `rgba(124,58,237,${highlight})`,
            }}
          />
          <div
            style={{
              position: "relative",
              fontFamily: FONT_MONO,
              fontSize: 24,
              color: TV.text,
              letterSpacing: 0,
              opacity: urlOpacity,
              transform: `translateX(${urlSlide}px)`,
              whiteSpace: "nowrap",
            }}
          >
            facebook.com/ads/library?id=8123094471
          </div>
        </div>
        {/* submit */}
        <div style={{ position: "relative", width: 56, height: 56 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${TV.purple}`,
              transform: `scale(${rippleScale})`,
              opacity: rippleOpacity,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${TV.purple}, #5B21B6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${press})`,
              boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V6M12 6L6 12M12 6L18 12" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ⌘V chip */}
      <div
        style={{
          position: "absolute",
          left: 806,
          top: 386,
          transform: `scale(${0.5 + 0.5 * cmdPop}) rotate(${-6 + 6 * cmdPop}deg)`,
          opacity: Math.min(cmdPop, cmdFade),
        }}
      >
        <MonoChip size={24} color={VIOLET_TINT_TEXT} border="rgba(124,58,237,0.25)" bg={VIOLET_TINT_BG}>
          ⌘V
        </MonoChip>
      </div>

      {/* ingest meta chip */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 556,
          transform: `translate(-50%, ${(1 - metaIn) * 16}px)`,
          opacity: metaIn,
        }}
      >
        <MonoChip size={19} color={TV.muted}>
          0:15&nbsp;&nbsp;·&nbsp;&nbsp;1080×1920&nbsp;&nbsp;·&nbsp;&nbsp;MP4
        </MonoChip>
      </div>

      {/* guide line toward dissect zone */}
      <div
        style={{
          position: "absolute",
          left: 538,
          top: 1652,
          width: 4,
          height: guideH,
          opacity: guideOpacity,
          background:
            "repeating-linear-gradient(180deg, rgba(124,58,237,0.55) 0px, rgba(124,58,237,0.55) 14px, rgba(124,58,237,0) 14px, rgba(124,58,237,0) 28px)",
          borderRadius: 2,
        }}
      />

      {/* phone card playing the source ad — dark device on white world */}
      <Sequence from={10} durationInFrames={190} layout="none">
        <div
          style={{
            position: "absolute",
            left: 540 - 230,
            top: 1180 - 414 + phoneY + phoneFloat,
            width: 460,
            height: 828,
            transform: `rotate(${phoneRot}deg)`,
            opacity: phoneOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 46,
              background: "#17171E",
              border: "1.5px solid rgba(23,23,28,0.16)",
              boxShadow: DEVICE_SHADOW,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              width: 440,
              height: 808,
              borderRadius: 38,
              overflow: "hidden",
              background: "#101014",
            }}
          >
            <OffthreadVideo
              muted
              src={staticFile("topview/winning-ad.mp4")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* frosted patch over the source-ad wordmark */}
            <div
              style={{
                position: "absolute",
                left: SCREEN_W * 0.11,
                top: SCREEN_H * 0.5,
                width: SCREEN_W * 0.38,
                height: SCREEN_H * 0.27,
                borderRadius: 22,
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                background: "rgba(167,139,250,0.16)",
              }}
            />
            {/* scan beam */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: beamY - 120,
                width: "100%",
                height: 120,
                opacity: beamOpacity,
                background: "linear-gradient(180deg, rgba(34,211,238,0) 0%, rgba(34,211,238,0.18) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: beamY,
                width: "100%",
                height: 3,
                opacity: beamOpacity,
                background: "linear-gradient(90deg, rgba(34,211,238,0) 0%, #22D3EE 30%, #A78BFA 70%, rgba(167,139,250,0) 100%)",
                boxShadow: "0 0 18px rgba(34,211,238,0.8)",
              }}
            />
            {/* time chip — over footage, inside the card */}
            <div style={{ position: "absolute", left: 14, top: 14 }}>
              <MonoChip size={18} pad="4px 10px" color="#FFFFFF" bg="rgba(10,10,14,0.65)" border="rgba(255,255,255,0.14)" shadow="none">
                0:{String(tickSec).padStart(2, "0")}
              </MonoChip>
            </div>
            {/* progress bar */}
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 14,
                width: SCREEN_W - 32,
                height: 5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.3)",
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${TV.violet}, ${TV.purple})`,
                }}
              />
            </div>
          </div>
        </div>
      </Sequence>
    </>
  );
};

// ------------------------------------------------------------------- Zone B
const RULER_X = 210;
const RULER_TOP = 2080;
const RULER_BOTTOM = 3400;
const RULER_LEN = RULER_BOTTOM - RULER_TOP; // 15s of ad
const yForSec = (s: number) => RULER_TOP + (s / 15) * RULER_LEN;

type ShotSpec = {
  img: string;
  sec: number;
  cx: number;
  cy: number;
  rot: number;
};
const SHOTS: ShotSpec[] = [
  { img: "topview/shots/shot1.png", sec: 1, cx: 560, cy: 2260, rot: -3.5 },
  { img: "topview/shots/shot2.png", sec: 5, cx: 660, cy: 2560, rot: 2.5 },
  { img: "topview/shots/shot3.png", sec: 8, cx: 560, cy: 2860, rot: -2 },
  { img: "topview/shots/shot4.png", sec: 12, cx: 660, cy: 3160, rot: 3 },
];

const ShotCard: React.FC<{ spec: ShotSpec; index: number }> = ({ spec, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 94 + index * 6;
  const s = spring({ frame: frame - start, fps, config: SPRINGS.snappy });
  const opacity = interpolate(frame, [start, start + 5], [0, 1], clamp);
  const y = interpolate(s, [0, 1], [-380, 0]);
  const rot = interpolate(s, [0, 1], [spec.rot - 10, spec.rot]);
  const float = 3 * Math.sin(frame * 0.05 + index * 1.7);

  const CARD_W = 300;
  const CARD_H = 424;

  return (
    <div
      style={{
        position: "absolute",
        left: spec.cx - CARD_W / 2,
        top: spec.cy - CARD_H / 2 + y + float,
        width: CARD_W,
        height: CARD_H,
        zIndex: 10 - index,
        transform: `rotate(${rot}deg) scale(${0.85 + 0.15 * s})`,
        opacity,
        borderRadius: 20,
        background: TV.panel,
        border: `1.5px solid ${TV.border}`,
        boxShadow: "0 18px 44px rgba(23,23,28,0.15)",
        padding: 10,
      }}
    >
      <Img
        src={staticFile(spec.img)}
        style={{
          width: CARD_W - 20,
          height: 330,
          objectFit: "cover",
          objectPosition: "center 35%",
          borderRadius: 12,
        }}
      />
      <div
        style={{
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
        }}
      >
        <MonoChip size={19} pad="4px 10px" color={VIOLET_TINT_TEXT} border="rgba(124,58,237,0.2)" bg={VIOLET_TINT_BG} shadow="none">
          0:{String(spec.sec).padStart(2, "0")}
        </MonoChip>
        <PacingBars frame={frame} seed={index} color={index === 0 ? "rgba(124,58,237,0.75)" : "rgba(107,114,128,0.45)"} />
      </div>
    </div>
  );
};

const ZoneBDissect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rulerGrow = interpolate(frame, [86, 116], [0, 1], { ...clamp, easing: EASE });

  // HOOK zone (0:00-0:03) + chip
  const hookGlow = interpolate(frame, [146, 158], [0, 1], clamp);
  const hookPulse = 0.85 + 0.15 * Math.sin(frame * 0.12);
  const hookChip = spring({ frame: frame - 152, fps, config: SPRINGS.snappy });

  // CTA zone (0:13-0:15) + chip
  const ctaGlow = interpolate(frame, [182, 194], [0, 1], clamp);
  const ctaChip = spring({ frame: frame - 188, fps, config: SPRINGS.snappy });

  return (
    <>
      {/* whisper of violet behind the filmstrip */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 2020,
          width: 900,
          height: 1460,
          background: "radial-gradient(50% 50% at 40% 35%, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0) 70%)",
          opacity: rulerGrow,
        }}
      />

      {/* ruler line */}
      <div
        style={{
          position: "absolute",
          left: RULER_X - 2,
          top: RULER_TOP,
          width: 4,
          height: RULER_LEN,
          borderRadius: 2,
          background: "linear-gradient(180deg, rgba(124,58,237,0.75), rgba(124,58,237,0.2))",
          transform: `scaleY(${rulerGrow})`,
          transformOrigin: "top",
        }}
      />

      {/* ticks + timestamps */}
      {[0, 3, 6, 9, 12, 15].map((sec, i) => {
        const o = interpolate(frame, [100 + i * 4, 108 + i * 4], [0, 1], clamp);
        const y = yForSec(sec);
        return (
          <React.Fragment key={sec}>
            <div
              style={{
                position: "absolute",
                left: RULER_X - 16,
                top: y - 1.5,
                width: 32,
                height: 3,
                borderRadius: 2,
                background: "rgba(124,58,237,0.55)",
                opacity: o,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 96,
                top: y - 14,
                width: 92,
                textAlign: "right",
                fontFamily: FONT_MONO,
                fontVariantNumeric: "tabular-nums",
                fontSize: 22,
                fontWeight: 700,
                color: sec <= 3 ? VIOLET_TINT_TEXT : TV.muted,
                opacity: o,
              }}
            >
              0:{String(sec).padStart(2, "0")}
            </div>
          </React.Fragment>
        );
      })}

      {/* connector nodes + lines to cards */}
      {SHOTS.map((spec, i) => {
        const nodeY = yForSec(spec.sec);
        const draw = interpolate(frame, [122 + i * 4, 132 + i * 4], [0, 1], { ...clamp, easing: EASE });
        const lineW = spec.cx - 150 - RULER_X - 8;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: RULER_X + 8,
                top: nodeY - 1,
                width: lineW * draw,
                height: 2,
                background: "linear-gradient(90deg, rgba(124,58,237,0.5), rgba(124,58,237,0.1))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: RULER_X - 7,
                top: nodeY - 7,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: TV.panel,
                border: `2.5px solid ${TV.purple}`,
                boxShadow: "0 4px 10px rgba(23,23,28,0.12)",
                opacity: draw,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* HOOK zone bracket (0:00 - 0:03) */}
      <div
        style={{
          position: "absolute",
          left: RULER_X - 18,
          top: RULER_TOP,
          width: 36,
          height: yForSec(3) - RULER_TOP,
          borderRadius: 10,
          background: `rgba(124,58,237,${0.14 * hookGlow * hookPulse})`,
          border: `1.5px solid rgba(124,58,237,${0.45 * hookGlow})`,
          boxShadow: `0 6px 24px rgba(124,58,237,${0.22 * hookGlow * hookPulse})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 252,
          top: 2072,
          transform: `translateX(${(1 - hookChip) * -46}px) scale(${0.7 + 0.3 * hookChip})`,
          opacity: hookChip,
        }}
      >
        <MonoChip
          size={21}
          color={VIOLET_TINT_TEXT}
          bg={VIOLET_TINT_BG}
          border="rgba(124,58,237,0.3)"
          shadow="0 8px 22px rgba(124,58,237,0.22)"
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: TV.purple, display: "inline-block" }} />
          HOOK
        </MonoChip>
      </div>

      {/* CTA zone bracket (0:13 - 0:15) */}
      <div
        style={{
          position: "absolute",
          left: RULER_X - 18,
          top: yForSec(13),
          width: 36,
          height: yForSec(15) - yForSec(13),
          borderRadius: 10,
          background: `rgba(34,211,238,${0.12 * ctaGlow})`,
          border: `1.5px solid rgba(14,116,144,${0.4 * ctaGlow})`,
          boxShadow: `0 6px 24px rgba(34,211,238,${0.2 * ctaGlow})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 252,
          top: 3268,
          transform: `translateX(${(1 - ctaChip) * -46}px) scale(${0.7 + 0.3 * ctaChip})`,
          opacity: ctaChip,
        }}
      >
        <MonoChip
          size={21}
          color={CYAN_TINT_TEXT}
          bg={CYAN_TINT_BG}
          border="rgba(14,116,144,0.3)"
          shadow="0 8px 22px rgba(34,211,238,0.25)"
        >
          CTA
        </MonoChip>
      </div>

      {/* shot cards */}
      {SHOTS.map((spec, i) => (
        <ShotCard key={i} spec={spec} index={i} />
      ))}
    </>
  );
};

// ------------------------------------------------------------------- Zone C
const SLOT_X = 405;
const SLOT_W = 250;
const SLOT_H = 330;
const SLOT_YS = [4080, 4440, 4800];
const SNAPS = [S1, S2, S3];
const BEATS = [
  { src: "topview/beat1-hook.mp4", loop: 76, label: "01 · 0:00" },
  { src: "topview/beat2-tab.mp4", loop: 110, label: "02 · 0:03" },
  { src: "topview/beat3-sip.mp4", loop: 118, label: "03 · 0:06" },
];

const RebuildSlot: React.FC<{ index: number; ghost: number }> = ({ index, ghost }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cy = SLOT_YS[index];
  const snap = SNAPS[index];
  const beat = BEATS[index];

  // skeleton slide-in during the travel toward zone C
  const enter = spring({ frame: frame - (206 + index * 6), fps, config: SPRINGS.smooth });
  const enterX = interpolate(enter, [0, 1], [-240, 0]);

  // beat snap
  const snapS = spring({ frame: frame - snap, fps, config: SPRINGS.snappy });
  const vidScale = interpolate(snapS, [0, 1], [1.18, 1]);
  const vidOpacity = interpolate(frame, [snap, snap + 4], [0, 1], clamp);
  const flash = interpolate(frame, [snap, snap + 3, snap + 16], [0, 0.5, 0], clamp);
  const ring = interpolate(frame, [snap, snap + 12], [0.98, 1.22], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringO = interpolate(frame, [snap, snap + 12], [0.7, 0], clamp);
  const filled = frame >= snap;

  return (
    <div
      style={{
        position: "absolute",
        left: SLOT_X - SLOT_W / 2 + enterX,
        top: cy - SLOT_H / 2,
        width: SLOT_W,
        height: SLOT_H,
        opacity: enter * (filled ? 0.2 + 0.8 * ghost : ghost),
      }}
    >
      {/* snap bloom */}
      <div
        style={{
          position: "absolute",
          left: -110,
          top: -110,
          width: SLOT_W + 220,
          height: SLOT_H + 220,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0) 70%)",
          opacity: flash,
        }}
      />
      {/* snap ring */}
      <div
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: 24,
          border: `2.5px solid ${TV.purple}`,
          transform: `scale(${ring})`,
          opacity: ringO,
        }}
      />
      {/* slot shell */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: filled ? "#101014" : "rgba(255,255,255,0.65)",
          border: filled
            ? `1.5px solid rgba(124,58,237,0.45)`
            : `2px dashed rgba(124,58,237,0.35)`,
          boxShadow: filled ? "0 18px 44px rgba(23,23,28,0.18)" : "0 8px 24px rgba(23,23,28,0.06)",
          overflow: "hidden",
        }}
      >
        {filled ? (
          <Sequence from={snap} layout="none">
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${vidScale})`,
                opacity: vidOpacity,
              }}
            >
              <Loop durationInFrames={beat.loop}>
                <OffthreadVideo
                  muted
                  src={staticFile(beat.src)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Loop>
            </div>
          </Sequence>
        ) : null}
      </div>
      {/* slot chip */}
      <div style={{ position: "absolute", left: 12, bottom: 12 }}>
        {filled ? (
          <MonoChip size={17} pad="4px 10px" color="#FFFFFF" bg="rgba(10,10,14,0.7)" border="rgba(255,255,255,0.2)" shadow="none">
            {beat.label}
          </MonoChip>
        ) : (
          <MonoChip size={17} pad="4px 10px" color={TV.muted} bg={TV.panel} border={TV.border} shadow="none">
            {beat.label}
          </MonoChip>
        )}
      </div>
    </div>
  );
};

const ZoneCRebuild: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // skeleton ghosting for the end hold
  const ghost = interpolate(frame, [318, 338], [1, 0.38], clamp);
  const railGhost = interpolate(frame, [318, 338], [1, 0.3], clamp);

  const railIn = spring({ frame: frame - 204, fps, config: SPRINGS.smooth });
  const railGrow = interpolate(frame, [204, 230], [0, 1], { ...clamp, easing: EASE });

  const hookGhost = spring({ frame: frame - 216, fps, config: SPRINGS.snappy });
  const ctaGhost = spring({ frame: frame - 222, fps, config: SPRINGS.snappy });

  // result phone
  const phoneIn = spring({ frame: frame - 296, fps, config: SPRINGS.snappy });
  const phoneOpacity = interpolate(frame, [296, 302], [0, 1], clamp);
  const phoneFlash = interpolate(frame, [298, 302, 318], [0, 0.4, 0], clamp);
  const haloPulse = 0.16 + 0.05 * Math.sin(frame * 0.09);
  const headerIn = spring({ frame: frame - 306, fps, config: SPRINGS.snappy });

  const played = Math.max(0, frame - 300);
  const resProgress = Math.min(1, played / 309);

  // flow lines
  const flowDraw = (i: number) =>
    interpolate(frame, [300 + i * 4, 318 + i * 4], [1, 0], { ...clamp, easing: EASE });
  const flowOpacity = interpolate(frame, [300, 308], [0, 1], clamp) * railGhost;

  const PHONE_W = 400;
  const PHONE_H = 726;

  return (
    <>
      {/* skeleton mini-ruler carrying the same structure */}
      <div style={{ opacity: railIn * railGhost }}>
        <div
          style={{
            position: "absolute",
            left: 248,
            top: 3890,
            width: 3,
            height: 1140,
            borderRadius: 2,
            background: "linear-gradient(180deg, rgba(124,58,237,0.55), rgba(124,58,237,0.12))",
            transform: `scaleY(${railGrow})`,
            transformOrigin: "top",
          }}
        />
        {/* ghost HOOK / CTA chips — same structure, new column */}
        <div
          style={{
            position: "absolute",
            left: 270,
            top: 3852,
            opacity: hookGhost * 0.9,
            transform: `translateX(${(1 - hookGhost) * -30}px)`,
          }}
        >
          <MonoChip size={16} pad="3px 9px" color={VIOLET_TINT_TEXT} bg={VIOLET_TINT_BG} border="rgba(124,58,237,0.25)" shadow="none">
            HOOK
          </MonoChip>
        </div>
        <div
          style={{
            position: "absolute",
            left: 270,
            top: 4994,
            opacity: ctaGhost * 0.9,
            transform: `translateX(${(1 - ctaGhost) * -30}px)`,
          }}
        >
          <MonoChip size={16} pad="3px 9px" color={CYAN_TINT_TEXT} bg={CYAN_TINT_BG} border="rgba(14,116,144,0.25)" shadow="none">
            CTA
          </MonoChip>
        </div>
      </div>

      {/* slots */}
      {[0, 1, 2].map((i) => (
        <RebuildSlot key={i} index={i} ghost={ghost} />
      ))}

      {/* flow lines slots → result phone */}
      <svg
        style={{ position: "absolute", left: 520, top: 4020, width: 90, height: 880, opacity: flowOpacity }}
        viewBox="0 0 90 880"
        fill="none"
      >
        {[
          { from: 60, to: 360 },
          { from: 420, to: 450 },
          { from: 780, to: 540 },
        ].map((l, i) => (
          <path
            key={i}
            d={`M 12 ${l.from} C 52 ${l.from}, 52 ${l.to}, 84 ${l.to}`}
            stroke="rgba(124,58,237,0.45)"
            strokeWidth="2.5"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={flowDraw(i)}
          />
        ))}
      </svg>

      {/* soft violet halo behind the result phone */}
      <div
        style={{
          position: "absolute",
          left: 790 - 360,
          top: 4470 - 520,
          width: 720,
          height: 1040,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(124,58,237,0.5) 0%, rgba(124,58,237,0) 68%)",
          opacity: phoneOpacity * haloPulse,
        }}
      />

      {/* result phone header */}
      <div
        style={{
          position: "absolute",
          left: 790,
          top: 4056,
          transform: `translate(-50%, ${(1 - headerIn) * 18}px)`,
          opacity: headerIn,
        }}
      >
        <MonoChip size={19} pad="7px 14px" bg={TV.panel} border="rgba(124,58,237,0.2)">
          <Img
            src={staticFile("topview/topview-icon.webp")}
            style={{ width: 28, height: 28, borderRadius: 8 }}
          />
          fizzi-launch-v1.mp4
        </MonoChip>
      </div>

      {/* result phone */}
      <div
        style={{
          position: "absolute",
          left: 790 - PHONE_W / 2,
          top: 4470 - PHONE_H / 2 + (1 - phoneIn) * 46,
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${0.88 + 0.12 * phoneIn})`,
          opacity: phoneOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 42,
            background: "#17171E",
            border: "1.5px solid rgba(124,58,237,0.3)",
            boxShadow: DEVICE_SHADOW,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            width: PHONE_W - 20,
            height: PHONE_H - 20,
            borderRadius: 34,
            overflow: "hidden",
            background: "#101014",
          }}
        >
          <Sequence from={300} layout="none">
            <OffthreadVideo
              muted
              src={staticFile("topview/fizzi-ad.mp4")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Sequence>
          {/* landing flash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(196,181,253,1)",
              opacity: phoneFlash,
            }}
          />
          {/* progress bar */}
          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 12,
              width: PHONE_W - 48,
              height: 5,
              borderRadius: 3,
              background: "rgba(255,255,255,0.3)",
              opacity: interpolate(frame, [302, 310], [0, 1], clamp),
            }}
          >
            <div
              style={{
                width: `${resProgress * 100}%`,
                height: "100%",
                borderRadius: 3,
                background: `linear-gradient(90deg, ${TV.violet}, ${TV.cyan})`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// --------------------------------------------------------------------- root
export const TvP2PasteAd: React.FC = () => {
  const frame = useCurrentFrame();

  const fx = interpolate(frame, KEY_T, FXV, { easing: EASE, ...clamp });
  const fy = interpolate(frame, KEY_T, FYV, { easing: EASE, ...clamp });
  let z = interpolate(frame, KEY_T, ZV, { easing: EASE, ...clamp });

  // tiny impact bump on each rebuild snap
  for (const s of SNAPS) {
    z += interpolate(frame, [s, s + 2, s + 10], [0, 0.012, 0], clamp);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: TV.bg, fontFamily: FONT_SANS }}>
      {/* world */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* faint dot grid across the world for travel parallax */}
        <div
          style={{
            position: "absolute",
            left: -520,
            top: -320,
            width: 2120,
            height: 6200,
            backgroundImage: "radial-gradient(circle, rgba(23,23,28,0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "72px 72px",
          }}
        />

        <ZoneAPaste />
        <ZoneBDissect />
        <ZoneCRebuild />
      </div>
    </AbsoluteFill>
  );
};
