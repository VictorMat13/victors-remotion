import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { DRONEA, FONT_SANS, WORLD } from "./theme";

// ============================================================================
// LwP1Hook — 1080x1080 @ 30fps
// Beat (VO, never on screen): "Everyone's making these insane 3D animated
// websites right now, but nobody actually shows you how they're doing it."
// One continuous white world, keyframed camera:
//   f0–70   OPEN TIGHT — full-bleed on the spinning drone (video already
//           moving at frame 0), slow drift.
//   f70–150 REVEAL — pull out to the floating white browser-chrome card,
//           slightly tilted; gray wireframe ghost cards drift in staggered.
//   f150–215 TURN — ghosts blur/fade away, card straightens, camera pushes
//           back into the live video — the one that's real.
//   f215–240 END HOLD — two nearly identical keys, clean cut point.
// ============================================================================

export const DURATION_IN_FRAMES = 240;

const VIEW = 1080;

// ---------------------------------------------------------------------------
// World layout — browser card centered in a world larger than the viewport
// ---------------------------------------------------------------------------
const CHROME_H = 64;
const VIDEO_W = 1440;
const VIDEO_H = Math.round((VIDEO_W * 1846) / 2936); // 906 — native 2936x1846
const CARD_W = VIDEO_W;
const CARD_H = CHROME_H + VIDEO_H; // 970
const CARD_X = 480; // left
const CARD_Y = 695; // top
// Card center: (1200, 1180). Video area top: 759.
// Drone center inside the recording (≈47% x, ≈45% y of the video area)
// lands at world ≈ (1157, 1167) — the KEY arrays below aim at these.

// ---------------------------------------------------------------------------
// Camera — one shared keyframe timeline, hold → move → hold
// ---------------------------------------------------------------------------
// Framing avoids the recording's own edge chrome (site nav ends ≈9% down,
// black footer starts ≈87% down, left copy ends ≈25% in, headline starts
// ≈78% in) so no site text is ever sliced at a frame edge during holds.
const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 70, 92, 150, 164, 188, 216, 236, 240];
const KEY_FX = [1200, 1193, 1200, 1195, 1195, 1197, 1197, 1199, 1199];
const KEY_FY = [1171, 1153, 1180, 1176, 1176, 1192, 1192, 1193, 1193];
const KEY_Z = [2.2, 2.05, 0.55, 0.558, 0.558, 1.552, 1.552, 1.558, 1.558];

// ---------------------------------------------------------------------------
// Ghost cards — abstract gray wireframe skeletons (no logos, no text)
// ---------------------------------------------------------------------------
type GhostSpec = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  enter: number; // drift-in start frame
  exit: number; // fade/blur-out start frame
  driftX: number; // entrance offset (drifts to 0)
  driftY: number;
  bobPhase: number;
};

const GHOSTS: GhostSpec[] = [
  // top-left, tucked behind the card corner
  { cx: 585, cy: 705, w: 460, h: 340, rot: -5, enter: 84, exit: 150, driftX: -40, driftY: -30, bobPhase: 0 },
  // top-right, floating clear of the card
  { cx: 1840, cy: 560, w: 380, h: 290, rot: 4, enter: 96, exit: 158, driftX: 30, driftY: -24, bobPhase: 2.1 },
  // bottom-left
  { cx: 700, cy: 1745, w: 430, h: 320, rot: 6, enter: 108, exit: 166, driftX: -30, driftY: 46, bobPhase: 4.2 },
];

const GHOST_INK = "#E7E4DD"; // wireframe block gray
const GHOST_INK_SOFT = "#EFEDE7";
const GHOST_DOT = "#DFDCD4";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const GhostCard: React.FC<{ spec: GhostSpec; frame: number }> = ({ spec, frame }) => {
  const enterP = interpolate(frame, [spec.enter, spec.enter + 28], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const exitP = interpolate(frame, [spec.exit, spec.exit + 26], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    ...clamp,
  });
  const opacity = enterP * 0.9 * (1 - exitP);
  if (opacity <= 0.004) return null;

  const bob = Math.sin((frame - spec.enter) / 34 + spec.bobPhase) * 5;
  const dx = spec.driftX * (1 - enterP) - spec.driftX * 0.28 * exitP;
  const dy = spec.driftY * (1 - enterP) + bob;
  const blur = 1.4 + exitP * 7;
  const scale = 1 - exitP * 0.05;
  const pad = Math.round(spec.w * 0.045);

  return (
    <div
      style={{
        position: "absolute",
        left: spec.cx - spec.w / 2 + dx,
        top: spec.cy - spec.h / 2 + dy,
        width: spec.w,
        height: spec.h,
        transform: `rotate(${spec.rot}deg) scale(${scale})`,
        transformOrigin: "center center",
        borderRadius: 20,
        background: "#FCFBF8",
        border: `1px solid ${WORLD.border}`,
        boxShadow: WORLD.shadowSoft,
        opacity,
        filter: `blur(${blur}px)`,
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap: Math.round(spec.h * 0.05),
      }}
    >
      {/* fake chrome strip — dots + empty address pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 5, background: GHOST_DOT }} />
        ))}
        <div
          style={{
            flex: 1,
            height: 16,
            borderRadius: 8,
            background: GHOST_INK_SOFT,
            marginLeft: 10,
            marginRight: Math.round(spec.w * 0.12),
          }}
        />
      </div>
      {/* hero block */}
      <div style={{ flex: 1, borderRadius: 12, background: GHOST_INK_SOFT }} />
      {/* text-skeleton lines */}
      <div style={{ width: "62%", height: 13, borderRadius: 7, background: GHOST_INK }} />
      <div style={{ width: "38%", height: 13, borderRadius: 7, background: GHOST_INK }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export const LwP1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const fx = interpolate(frame, KEY_T, KEY_FX, { easing: ease, ...clamp });
  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: ease, ...clamp });
  const z = interpolate(frame, KEY_T, KEY_Z, { easing: ease, ...clamp });

  // Card tilt: square during the tight open, floats to -2.2° for the wide
  // reveal, straightens again as the camera dives back in.
  const tilt =
    interpolate(frame, [62, 96], [0, -2.2], { easing: ease, ...clamp }) +
    interpolate(frame, [150, 184], [0, 2.2], { easing: ease, ...clamp });

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg, fontFamily: FONT_SANS }}>
      {/* full-bleed ambient light — background only, bleeds past safe margins */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1100px 860px at 50% 42%, rgba(255,255,255,0.65), rgba(255,255,255,0) 72%)",
        }}
      />

      {/* world */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ghost wireframes — behind the live card */}
        {GHOSTS.map((g, i) => (
          <GhostCard key={i} spec={g} frame={frame} />
        ))}

        {/* the real one — floating white browser card with the live recording */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            transform: `rotate(${tilt}deg)`,
            transformOrigin: "center center",
            borderRadius: WORLD.radius,
            background: WORLD.card,
            border: `1px solid ${WORLD.border}`,
            boxShadow: WORLD.shadow,
            overflow: "hidden",
          }}
        >
          {/* browser chrome */}
          <div
            style={{
              height: CHROME_H,
              display: "flex",
              alignItems: "center",
              paddingLeft: 26,
              paddingRight: 26,
              borderBottom: "1px solid #EEECE7",
              background: WORLD.card,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FF5F57" }} />
              <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FEBC2E" }} />
              <div style={{ width: 14, height: 14, borderRadius: 7, background: "#28C840" }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 430,
                height: 38,
                borderRadius: 19,
                background: "#F4F3EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" style={{ display: "block" }}>
                <rect x="1" y="6" width="10" height="7" rx="2" fill="none" stroke={WORLD.muted} strokeWidth="1.5" />
                <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke={WORLD.muted} strokeWidth="1.5" />
              </svg>
              <span style={{ fontSize: 19, color: WORLD.muted, letterSpacing: 0.2 }}>
                dronea.design
              </span>
            </div>
          </div>

          {/* the live Dronea recording — already spinning at frame 0 */}
          <OffthreadVideo
            muted
            src={staticFile(DRONEA.video)}
            style={{ width: VIDEO_W, height: VIDEO_H, objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
