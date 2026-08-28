// Fish Audio 5 — F5P07ProposalFifteenK (1080x1080 @ 30fps, 135 frames)
// VO: "I'm about to send this proposal at fifteen thousand. Thoughts?"
//
// Beat map (continues the fish4 Altari starfield + cream curl-card system):
//   f0-30   open tight on a cream proposal doc floating on the starfield:
//           "Meridian & Co" header, PROPOSAL chip, greeked bars, fee ticking
//           up to $15,000 in tabular numerals. Camera settles (z1.62→1.5).
//   f30-60  cursor dot glides in from below and presses the dark
//           "Ask the board" affordance — press dip, ripple, button flips to
//           Altari purple with a glow (visible state change).
//   f60-100 the question fires: amber burst at the button splits into THREE
//           accent threads (operator red / editor cream / longgame purple)
//           drawing outward to small PortraitOrbs (110px) at three edges;
//           each orb glows up as its thread arrives. Camera pulls back
//           f62-84 (22f) to reveal the room.
//   f100-135 hold: threads pulse, packets travel doc→orbs, orbs breathe.
//           Final two camera keys identical for a clean editor hold.
//
// On-screen text is ONLY: "Meridian & Co", "PROPOSAL", "$15,000",
// "Ask the board". No advisor names (compliance), no narration echo.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ADVISORS, AHMED_ORB, ALTARI, SPRINGS, safePadX } from "./theme";
import { AltariBackdrop, CreamCard, PortraitOrb } from "./board";

const { fontFamily: manropeFamily } = loadManrope("normal", {
  weights: ["500", "700", "800"],
});
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400"] });

export const DURATION_IN_FRAMES = 135;

const VIEW_W = 1080;
const VIEW_H = 1080;
const SAFE = safePadX(VIEW_W); // 54 — 5% side margin (world == screen at z=1)

const ease = Easing.inOut(Easing.cubic);

// ---- World layout (world == screen coordinates at the final z=1 hold) ------
const CARD = { x: 290, y: 190, w: 500, h: 560 };
const BTN = { cx: 540, cy: 690, w: 300, h: 64 };
const ORB_SIZE = 110;

// Edge orbs — centers derived from the safe pad so the 110px orbs never
// cross the 5% margins (edge = center ± 55; 54+55=109 min / 1026-55=971 max).
const ORB = {
  operator: { x: SAFE + 86, y: 540 }, // (140, 540) left edge
  editor: { x: VIEW_W - SAFE - 136, y: 190 }, // (890, 190) top-right
  longgame: { x: 540, y: 960 }, // bottom edge
} as const;

// ---- Threads (quadratic Béziers from the button out to each orb) -----------
type Pt = { x: number; y: number };
const qPoint = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};
const qLength = (p0: Pt, c: Pt, p1: Pt): number => {
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 48; i++) {
    const p = qPoint(p0, c, p1, i / 48);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
};

const ORIGIN: Pt = { x: BTN.cx, y: BTN.cy };
// Where the cursor actually presses (right end of the pill, clear of the label)
const PRESS: Pt = { x: 660, y: 700 };
const THREADS = [
  {
    advisor: "operator" as const,
    ctrl: { x: 300, y: 880 },
    end: ORB.operator,
    drawStart: 60,
    drawEnd: 78,
    phase: 0.4,
  },
  {
    advisor: "editor" as const,
    ctrl: { x: 980, y: 700 },
    end: ORB.editor,
    drawStart: 64,
    drawEnd: 82,
    phase: 2.3,
  },
  {
    advisor: "longgame" as const,
    ctrl: { x: 560, y: 830 },
    end: ORB.longgame,
    drawStart: 68,
    drawEnd: 86,
    phase: 4.1,
  },
].map((t) => ({ ...t, len: qLength(ORIGIN, t.ctrl, t.end) }));

// ---- Deterministic starfield (world space, under the card) -----------------
const hash = (n: number) => {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
};
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: hash(i * 12.9898 + 1) * VIEW_W,
  y: hash(i * 78.233 + 7) * VIEW_H,
  r: 1.3 + hash(i * 3.7 + 13) * 2.6,
  tint: hash(i * 9.1 + 3),
  ph: hash(i * 5.3 + 29) * Math.PI * 2,
  sp: 0.035 + hash(i * 2.9 + 41) * 0.055,
}));
const starColor = (tint: number) => {
  if (tint < 0.62) return "#EDE6D2";
  if (tint < 0.78) return ALTARI.primaryLight;
  if (tint < 0.9) return ALTARI.red;
  return AHMED_ORB.orb;
};

// Greeked body bars (fraction of inner width)
const BARS = [0.92, 0.74, 0.85, 0.58, 0.4];

export const F5P07ProposalFifteenK: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Camera: settle-in → hold → 22f pull-back as threads fire → hold ----
  const KEY_T = [0, 26, 62, 84, 116, DURATION_IN_FRAMES];
  const fx = interpolate(frame, KEY_T, [540, 540, 540, 540, 540, 540], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, [412, 436, 436, 540, 540, 540], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, [1.62, 1.5, 1.5, 1, 1, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Proposal card (present at f0; contents caught mid-entrance) --------
  const headerIn = interpolate(frame, [-6, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const feeIn = spring({ frame: frame + 2, fps, config: SPRINGS.snappy });
  const fee = Math.round(
    interpolate(frame, [0, 22], [0, 15000], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const feeText = `$${fee.toLocaleString("en-US")}`;
  const btnIn = interpolate(frame, [-2, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Cursor + press -----------------------------------------------------
  const curX = interpolate(frame, [30, 46], [802, PRESS.x], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curY = interpolate(frame, [30, 46], [808, PRESS.y], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curScale = interpolate(frame, [46, 49, 54], [1, 0.78, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const curOpacity =
    interpolate(frame, [30, 36], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [57, 66], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const btnPress = interpolate(frame, [47, 50, 57], [1, 0.955, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pressT = interpolate(frame, [49, 57], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnBg = interpolateColors(pressT, [0, 1], ["#1F1F33", ALTARI.primary]);
  const ripple1 = interpolate(frame, [49, 67], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ripple2 = interpolate(frame, [53, 69], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Question fires: amber burst + threads ------------------------------
  const burst = interpolate(frame, [56, 63, 86], [0, 0.85, 0], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Opaque backdrop, screen space, frame 0 → last (no black frames) */}
      <AltariBackdrop width={VIEW_W} height={VIEW_H} />

      {/* ---- Camera world (1080x1080; world == screen at final z=1) ---- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: VIEW_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* Starfield */}
        {STARS.map((s, i) => {
          const tw = 0.32 + 0.24 * Math.sin(frame * s.sp + s.ph);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x - s.r,
                top: s.y - s.r,
                width: s.r * 2,
                height: s.r * 2,
                borderRadius: "50%",
                backgroundColor: starColor(s.tint),
                opacity: tw,
              }}
            />
          );
        })}

        {/* ---- Proposal document card (cream, editorial) ---- */}
        <CreamCard x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h}>
          <div style={{ padding: "40px 40px 0" }}>
            {/* Header row: client name + doc-type chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: headerIn,
                transform: `translateY(${(1 - headerIn) * 10}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: manropeFamily,
                  fontWeight: 800,
                  fontSize: 40,
                  lineHeight: "48px",
                  letterSpacing: -0.5,
                  color: ALTARI.creamInk,
                }}
              >
                Meridian &amp; Co
              </div>
              <div
                style={{
                  fontFamily: monoFamily,
                  fontWeight: 400,
                  fontSize: 15,
                  letterSpacing: 3,
                  color: ALTARI.creamInk,
                  border: "1.5px solid rgba(31,31,51,0.4)",
                  borderRadius: 8,
                  padding: "7px 12px 6px 15px",
                }}
              >
                PROPOSAL
              </div>
            </div>

            {/* Dashed divider (curl-card language) */}
            <div
              style={{
                marginTop: 22,
                borderTop: "2px dashed rgba(31,31,51,0.22)",
                opacity: headerIn,
              }}
            />

            {/* Greeked body bars */}
            <div style={{ marginTop: 24 }}>
              {BARS.map((w, i) => {
                const rowIn = interpolate(
                  frame,
                  [-4 + i * 3, 8 + i * 3],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                return (
                  <div
                    key={i}
                    style={{
                      width: `${w * 100}%`,
                      height: 14,
                      borderRadius: 7,
                      marginTop: i === 0 ? 0 : 13,
                      backgroundColor: "rgba(31,31,51,0.13)",
                      opacity: rowIn,
                      transform: `translateY(${(1 - rowIn) * 8}px)`,
                    }}
                  />
                );
              })}
            </div>

            {/* Dashed divider */}
            <div
              style={{
                marginTop: 24,
                borderTop: "2px dashed rgba(31,31,51,0.22)",
                opacity: headerIn,
              }}
            />

            {/* Fee — big, tabular numerals, ticks up to $15,000 */}
            <div
              style={{
                marginTop: 18,
                fontFamily: manropeFamily,
                fontWeight: 800,
                fontSize: 96,
                lineHeight: "104px",
                letterSpacing: -2,
                fontVariantNumeric: "tabular-nums",
                color: ALTARI.creamInk,
                opacity: feeIn,
                transform: `translateY(${(1 - feeIn) * 14}px)`,
              }}
            >
              {feeText}
            </div>
          </div>

          {/* "Ask the board" affordance — dark on cream, flips purple on press */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 28,
              transform: `translateX(-50%) scale(${btnPress})`,
              width: BTN.w,
              height: BTN.h,
              borderRadius: 999,
              backgroundColor: btnBg,
              boxShadow: `0 0 ${34 * pressT}px rgba(91,94,194,${0.55 * pressT}), 0 10px 26px rgba(31,31,51,0.28)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              opacity: btnIn,
            }}
          >
            <div style={{ display: "flex", gap: 5 }}>
              {(["operator", "editor", "longgame"] as const).map((k) => (
                <div
                  key={k}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: ADVISORS[k].accent,
                    opacity: 0.55 + 0.45 * pressT,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: manropeFamily,
                fontWeight: 700,
                fontSize: 24,
                color: ALTARI.cream,
              }}
            >
              Ask the board
            </span>
          </div>
        </CreamCard>

        {/* Press ripples (world space, above the card) */}
        {[ripple1, ripple2].map((rp, i) =>
          rp > 0 && rp < 1 ? (
            <div
              key={i}
              style={{
                position: "absolute",
                left: PRESS.x - (16 + rp * 84),
                top: PRESS.y - (16 + rp * 84),
                width: (16 + rp * 84) * 2,
                height: (16 + rp * 84) * 2,
                borderRadius: "50%",
                border: `2px solid ${ALTARI.primaryLight}`,
                opacity: 0.7 * (1 - rp),
              }}
            />
          ) : null,
        )}

        {/* Amber burst — Ahmed's question leaving the doc */}
        {burst > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: ORIGIN.x - 90,
              top: ORIGIN.y - 90,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(232,162,91,${burst * 0.75}) 0%, rgba(242,200,143,${burst * 0.28}) 38%, rgba(0,0,0,0) 70%)`,
            }}
          />
        )}

        {/* ---- Accent threads: doc → three orbs ---- */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: VIEW_W,
            height: VIEW_H,
            overflow: "visible",
          }}
        >
          {THREADS.map((t) => {
            const accent = ADVISORS[t.advisor].accent;
            const draw = interpolate(frame, [t.drawStart, t.drawEnd], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            if (draw <= 0.001) return null;
            const pulse =
              frame >= t.drawEnd
                ? 0.62 + 0.22 * Math.sin(frame * 0.17 + t.phase)
                : 0.85;
            const d = `M ${ORIGIN.x} ${ORIGIN.y} Q ${t.ctrl.x} ${t.ctrl.y} ${t.end.x} ${t.end.y}`;
            // Traveling packets once the thread is connected
            const packets =
              frame >= t.drawEnd
                ? [0, 0.5].map((off) => {
                    const tt = ((frame - t.drawEnd) * 0.014 + off) % 1;
                    return { p: qPoint(ORIGIN, t.ctrl, t.end, tt), tt };
                  })
                : [];
            return (
              <g key={t.advisor}>
                <path
                  d={d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={t.len}
                  strokeDashoffset={t.len * (1 - draw)}
                  opacity={0.16 * pulse}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={t.len}
                  strokeDashoffset={t.len * (1 - draw)}
                  opacity={pulse}
                />
                {packets.map((pk, i) => (
                  <circle
                    key={i}
                    cx={pk.p.x}
                    cy={pk.p.y}
                    r={5}
                    fill={accent}
                    opacity={Math.sin(Math.PI * pk.tt) * 0.9}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* ---- Advisor orbs at three edges (portraits only) ---- */}
        {THREADS.map((t) => {
          const enter = spring({
            frame: frame - (t.drawStart + 8),
            fps,
            config: SPRINGS.snappy,
          });
          const arrive = interpolate(
            frame,
            [t.drawEnd - 2, t.drawEnd + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const speak = arrive * (0.72 + 0.28 * Math.sin(frame * 0.2 + t.phase));
          return (
            <PortraitOrb
              key={t.advisor}
              advisor={t.advisor}
              x={ORB[t.advisor].x}
              y={ORB[t.advisor].y}
              size={ORB_SIZE}
              enter={enter}
              speak={speak}
            />
          );
        })}
      </div>

      {/* Vignette (screen space, Altari grade) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(140% 130% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,10,24,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Cursor dot — screen-space overlay would drift; keep it in the world */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: VIEW_W,
          height: VIEW_H,
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
          pointerEvents: "none",
        }}
      >
        {curOpacity > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: curX - 11,
              top: curY - 11,
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              border: "2px solid rgba(31,31,51,0.35)",
              boxShadow: "0 4px 14px rgba(10,10,24,0.45)",
              opacity: curOpacity,
              transform: `scale(${curScale})`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
