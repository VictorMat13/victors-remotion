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
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 220;

// "One Claude prompt can turn the same product video into ten voiceover ads
//  in minutes, and you never record a word."
// Fish 3 series look: warm peach paper, white cards, ink details, coral Claude.
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  border: "#F0E4DC",
  coral: "#D97757",
  green: "#16A34A",
};

// ---- layout -------------------------------------------------------------------
const HERO0 = { x: 540, y: 450, w: 360, h: 640 }; // beat-1 hero video card
const HERO1 = { x: 540, y: 250, s: 0.4 }; // after the flip
const FLIP = 72;

const GRID = { cols: 5, cw: 150, ch: 252, gx: 20, gy: 24, cy: 700 };
const slot = (i: number) => {
  const col = i % GRID.cols;
  const row = Math.floor(i / GRID.cols);
  const totalW = GRID.cols * GRID.cw + (GRID.cols - 1) * GRID.gx;
  return {
    x: 540 - totalW / 2 + col * (GRID.cw + GRID.gx) + GRID.cw / 2,
    y: GRID.cy - (GRID.ch + GRID.gy) / 2 + row * (GRID.ch + GRID.gy),
  };
};
const CARD_AT = (i: number) => 88 + i * 5;

const PROMPT_TEXT = "10 ads. 10 voices. go.";

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

// deterministic per-card waveform bar height
const barH = (card: number, bar: number, f: number) => {
  const ph = card * 1.7 + bar * 0.9;
  const sp = 0.16 + (card % 4) * 0.02;
  return 8 + (Math.sin(f * sp + ph) * 0.5 + 0.5) * 18;
};

// ---- vector "product video" thumb — no real footage, all ours ------------------
// Dark player area, flat generic product bottle, play affordance. Hero gets a
// live scrubber + light sweep; minis get a small corner play dot.
const ProductThumb: React.FC<{
  w: number;
  h: number;
  t: number;
  hero?: boolean;
  radius?: number;
}> = ({ w, h, t, hero = false, radius = 16 }) => {
  const bw = w * (hero ? 0.34 : 0.4); // bottle body width
  const bh = h * (hero ? 0.42 : 0.44);
  const bx = w / 2 - bw / 2;
  const by = h * 0.5 - bh / 2 + h * 0.04;
  // light sweep across the "video" every ~75 frames
  const sweepX = ((t % 75) / 75) * (w + 260) - 130;
  const playProg = (t % 150) / 150; // hero scrubber loop
  const playPulse = 1 + Math.sin(t * 0.09) * 0.025;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(155deg, #33241F 0%, #201515 68%)",
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {/* soft stage glow behind the product */}
        <ellipse
          cx={w / 2}
          cy={by + bh * 0.92}
          rx={bw * 1.15}
          ry={bh * 0.16}
          fill="rgba(232,169,143,0.20)"
        />
        {/* generic product bottle — flat, ours */}
        <rect
          x={w / 2 - bw * 0.16}
          y={by - bh * 0.2}
          width={bw * 0.32}
          height={bh * 0.22}
          rx={bw * 0.05}
          fill="#E8A98F"
        />
        <rect
          x={w / 2 - bw * 0.22}
          y={by - bh * 0.06}
          width={bw * 0.44}
          height={bh * 0.1}
          rx={bw * 0.04}
          fill="#8B6F63"
        />
        <rect x={bx} y={by} width={bw} height={bh} rx={bw * 0.16} fill="#E8A98F" />
        <rect
          x={bx}
          y={by + bh * 0.34}
          width={bw}
          height={bh * 0.34}
          fill="#FBEFE6"
        />
        {/* label lines */}
        <rect
          x={w / 2 - bw * 0.26}
          y={by + bh * 0.45}
          width={bw * 0.52}
          height={Math.max(2, bh * 0.045)}
          rx={2}
          fill="#C89B87"
        />
        <rect
          x={w / 2 - bw * 0.18}
          y={by + bh * 0.56}
          width={bw * 0.36}
          height={Math.max(2, bh * 0.035)}
          rx={2}
          fill="#DEC0B1"
        />
        {/* sheen on the bottle */}
        <rect
          x={bx + bw * 0.12}
          y={by + bh * 0.06}
          width={bw * 0.08}
          height={bh * 0.22}
          rx={bw * 0.04}
          fill="rgba(255,255,255,0.35)"
        />
        {/* light sweep */}
        <rect
          x={sweepX}
          y={-h * 0.2}
          width={hero ? 90 : 46}
          height={h * 1.4}
          fill="rgba(255,255,255,0.05)"
          transform={`rotate(18 ${sweepX} ${h / 2})`}
        />
      </svg>
      {hero ? (
        <>
          {/* center play button, gently pulsing */}
          <div
            style={{
              position: "absolute",
              left: w / 2 - 44,
              top: h / 2 - 44 - h * 0.02,
              width: 88,
              height: 88,
              borderRadius: "50%",
              backgroundColor: "rgba(253,246,240,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${playPulse})`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <svg width={30} height={34} viewBox="0 0 30 34">
              <path d="M4 2 L28 17 L4 32 Z" fill="#201515" />
            </svg>
          </div>
          {/* scrubber */}
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 16,
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.22)",
            }}
          >
            <div
              style={{
                width: `${playProg * 100}%`,
                height: "100%",
                borderRadius: 3,
                backgroundColor: "#E8A98F",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${playProg * 100}%`,
                top: -5,
                width: 16,
                height: 16,
                marginLeft: -8,
                borderRadius: "50%",
                backgroundColor: "#FDF6F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        </>
      ) : (
        /* mini corner play dot */
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: "rgba(253,246,240,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={10} height={12} viewBox="0 0 10 12">
            <path d="M1.5 1 L9 6 L1.5 11 Z" fill="#201515" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const FishTenAds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 14, 30, 66, 84, 106, 219];
  let z = interpolate(frame, KEY, [1.3, 1.3, 1.16, 1.16, 1.05, 1.02, 1.02], camOpts);
  const fx = interpolate(frame, KEY, [540, 540, 540, 540, 540, 540, 540], camOpts);
  const fy = interpolate(frame, KEY, [460, 460, 545, 545, 560, 566, 566], camOpts);
  // impact kicks: first card landing + mic pop
  for (const at of [104, 160]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.014 * Math.exp(-d / 3);
  }

  // ---- beat states ----
  const heroIn = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const flip = p(frame, FLIP, FLIP + 20, ease);
  const heroX = interpolate(flip, [0, 1], [HERO0.x, HERO1.x]);
  const heroY = interpolate(flip, [0, 1], [HERO0.y, HERO1.y]);
  const heroS = interpolate(flip, [0, 1], [1, HERO1.s]);

  const pillIn = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const typed = Math.min(
    PROMPT_TEXT.length,
    Math.floor(Math.max(0, frame - 28) * 0.55),
  );
  const pillOut = p(frame, FLIP - 2, FLIP + 12);

  const landed = Array.from({ length: 10 }, (_, i) =>
    frame >= CARD_AT(i) + 14 ? 1 : 0,
  ).reduce((a: number, b) => a + b, 0);

  const micS = spring({
    frame: Math.max(0, frame - 156),
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const slash = p(frame, 162, 174, Easing.out(Easing.cubic));

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
        {/* fish audio chip — top left, present throughout */}
        <div
          style={{
            position: "absolute",
            left: 84,
            top: 96,
            backgroundColor: C.card,
            borderRadius: 999,
            padding: "12px 22px",
            boxShadow: "0 8px 24px rgba(32,21,21,0.10)",
            opacity: p(frame, 8, 20),
            display: "flex",
            alignItems: "center",
          }}
        >
          <Img
            src={staticFile("fish-audio/logo-light.png")}
            style={{ height: 30, width: "auto", display: "block" }}
          />
        </div>

        {/* ---- ten ad cards ---- */}
        {Array.from({ length: 10 }, (_, i) => {
          const at = CARD_AT(i);
          if (frame < at) return null;
          const s = spring({
            frame: frame - at,
            fps,
            config: { damping: 15, stiffness: 120, mass: 0.9 },
          });
          const sl = slot(i);
          const x = interpolate(s, [0, 1], [HERO1.x, sl.x]);
          const y =
            interpolate(s, [0, 1], [HERO1.y, sl.y]) -
            Math.sin(s * Math.PI) * 60;
          const sc = interpolate(s, [0, 1], [0.3, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - GRID.cw / 2,
                top: y - GRID.ch / 2,
                width: GRID.cw,
                height: GRID.ch,
                borderRadius: 16,
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                boxShadow: "0 14px 34px rgba(32,21,21,0.13)",
                transform: `scale(${sc}) rotate(${(1 - s) * (i % 2 ? 6 : -6)}deg)`,
                overflow: "hidden",
              }}
            >
              <div style={{ margin: 6 }}>
                <ProductThumb
                  w={GRID.cw - 12}
                  h={GRID.ch - 58}
                  t={frame - at + i * 17}
                  radius={11}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 6,
                  right: 6,
                  bottom: 6,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: C.coral,
                    marginRight: 5,
                  }}
                />
                {Array.from({ length: 11 }, (_, b) => (
                  <div
                    key={b}
                    style={{
                      width: 5,
                      borderRadius: 3,
                      height:
                        frame >= at + 14 ? barH(i, b, frame - at) : 8,
                      backgroundColor: C.ink,
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* ---- hero product video ---- */}
        {heroIn > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: heroX - HERO0.w / 2,
              top: heroY - HERO0.h / 2,
              width: HERO0.w,
              height: HERO0.h,
              borderRadius: 24,
              backgroundColor: C.card,
              boxShadow: "0 26px 60px rgba(32,21,21,0.20)",
              padding: 10,
              transform: `scale(${heroIn * heroS})`,
              transformOrigin: "center center",
            }}
          >
            <ProductThumb
              w={HERO0.w - 20}
              h={HERO0.h - 20}
              t={frame}
              hero
            />
            {/* ×N counter — ticks as ads land */}
            {landed > 0 ? (
              <div
                style={{
                  position: "absolute",
                  right: -30,
                  top: -22,
                  backgroundColor: C.coral,
                  color: "#fff",
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 44,
                  padding: "10px 24px",
                  borderRadius: 999,
                  boxShadow: "0 12px 28px rgba(217,119,87,0.45)",
                  fontVariantNumeric: "tabular-nums",
                  transform: `scale(${1 + (frame < CARD_AT(9) + 20 && frame % 5 < 2 ? 0.06 : 0)})`,
                }}
              >
                ×{landed}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ---- claude prompt pill ---- */}
        {pillIn > 0.001 && pillOut < 0.999 ? (
          <div
            style={{
              position: "absolute",
              left: 540 - 310,
              top: 810,
              width: 620,
              height: 84,
              borderRadius: 999,
              backgroundColor: C.card,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(32,21,21,0.14)",
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 30px",
              opacity: Math.min(1, pillIn) * (1 - pillOut),
              transform: `translateY(${(1 - pillIn) * 40 - pillOut * 24}px)`,
            }}
          >
            <Img
              src={staticFile("bluehost/claudecode-logo.svg")}
              style={{ width: 42, height: 42 }}
            />
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: C.ink,
                whiteSpace: "nowrap",
              }}
            >
              {PROMPT_TEXT.slice(0, typed)}
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 32,
                  marginLeft: 4,
                  verticalAlign: "middle",
                  backgroundColor: C.coral,
                  opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* ---- never record a word: mic + slash ---- */}
        {micS > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: 756,
              top: 178,
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: C.card,
              boxShadow: "0 16px 40px rgba(32,21,21,0.16)",
              transform: `scale(${micS}) rotate(${(1 - micS) * 10}deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={64} height={64} viewBox="0 0 64 64">
              <rect x={24} y={10} width={16} height={28} rx={8} fill={C.ink} />
              <path
                d="M16 32c0 9 7 15 16 15s16-6 16-15"
                fill="none"
                stroke={C.ink}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <line
                x1={32}
                y1={47}
                x2={32}
                y2={56}
                stroke={C.ink}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <line
                x1={10}
                y1={10}
                x2={10 + 44 * slash}
                y2={10 + 44 * slash}
                stroke={C.coral}
                strokeWidth={7}
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
