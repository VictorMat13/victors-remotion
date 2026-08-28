// Fish Audio 4 — F4P03ProblemReadOnly (1080x1080 @ 30fps)
// VO: "Here's the problem with all of them. They're read-only. This is my
// entire business as a map. Seven departments, hundreds of jobs, every
// process I run. And I'd go a week without opening it."
//
// Beats:
//   f0–45    real product screenshot as floating browser-fragment card, slow push-in
//   f45–115  two Ken Burns zooms INSIDE the card: DEALS (left) → OPERATIONS/INTELLIGENCE (right)
//   f115–150 morph: card recenters + scales/fades out, live SkillTreeWorld crossfades in
//   f150–215 orbit the live tree (twinkle, charge dots, routing pulses)
//   f215–270 the fall-off: world dims to 0.42, labels dim, "Last opened" chip fades in
//   f270–315 still dim hold (final 25 frames clean)
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
import { ALTARI, SPRINGS } from "./theme";
import { AltariBackdrop, DEPT, SkillTreeWorld, manropeFamily } from "./tree";

export const DURATION_IN_FRAMES = 315;

const W = 1080;
const H = 1080;

// Real screenshot: public/fish4/skilltree/skilltree-map-crop.png (1188x900, 2x density)
const IMG_W = 1188;
const IMG_H = 900;
// Card sized so it stays inside the 5% side margins even at max world zoom (1.06):
// left edge at zoom 1.06 = 540 - 450*1.06 = 63px > 54px safe pad.
const CARD_W = 900;
const CARD_H = Math.round((CARD_W / IMG_W) * IMG_H); // 682
const CARD_L = (W - CARD_W) / 2; // 90
const CARD_T = (H - CARD_H) / 2; // 199
const FIT = CARD_W / IMG_W; // 0.7576 — image scale at "fit" zoom 1

const ease = Easing.inOut(Easing.cubic);
const CLAMP = {
  easing: ease,
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const F4P03ProblemReadOnly: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------------------------------------------------------------- camera
  // One world div, shared keyframe timeline. Moves take 24–26 frames,
  // action happens during the holds. Last two keys identical = clean hold.
  const KEY_T = [0, 45, 152, 176, 215, 241, 280, 315];
  const fx = interpolate(frame, KEY_T, [540, 540, 540, 564, 564, 540, 540, 540], CLAMP);
  const fy = interpolate(frame, KEY_T, [540, 540, 540, 516, 516, 546, 546, 546], CLAMP);
  const z = interpolate(
    frame,
    KEY_T,
    [1.0, 1.06, 1.06, 1.16, 1.16, 1.02, 1.02, 1.02],
    CLAMP,
  );

  // ------------------------------------------------- Ken Burns inside card
  // hold → 18-frame move → hold → 18-frame move → hold → recenter for morph.
  // Image-space focal targets: DEALS constellation (left), then across to
  // OPERATIONS/INTELLIGENCE (upper right), then back to the map center.
  // z starts at 1.06 so the screenshot's dark outer strips stay cropped.
  const KB_T = [52, 70, 84, 102, 114, 132];
  const kcx = interpolate(frame, KB_T, [594, 400, 400, 770, 770, 586], CLAMP);
  const kcy = interpolate(frame, KB_T, [450, 445, 445, 350, 350, 465], CLAMP);
  const kz = interpolate(frame, KB_T, [1.06, 1.75, 1.75, 1.7, 1.7, 1.3], CLAMP);
  const d = FIT * kz; // displayed image scale
  const imgX = CARD_W / 2 - kcx * d;
  const imgY = CARD_H / 2 - kcy * d;

  // ---------------------------------------------------------------- morph
  // Card grows toward camera + fades; live tree crossfades in underneath at
  // rising scale. Both layers overlap ~f118–146 — never a gap.
  const cardS = interpolate(frame, [118, 150], [1, 2.15], CLAMP);
  const cardOp = interpolate(frame, [122, 146], [1, 0], CLAMP);
  const treeS = interpolate(frame, [118, 150], [0.62, 1], CLAMP);
  const treeIn = interpolate(frame, [118, 146], [0, 1], CLAMP);

  // -------------------------------------------------------------- fall-off
  // Dims to 0.42 — never near-black; the Altari grid + purple glow stay full.
  const dim = interpolate(frame, [215, 252], [1, 0.42], CLAMP);
  const labelDim = interpolate(frame, [215, 252], [0, 0.65], CLAMP);
  const treeOp = treeIn * dim;

  // "Last opened" UI chip (screen space, allowed UI metadata)
  const chipRise = spring({
    frame: frame - 238,
    fps,
    config: SPRINGS.smooth,
  });
  const chipOp = interpolate(frame, [238, 258], [0, 1], CLAMP);

  // soft breathing glow behind the card / world (background — may bleed)
  const breathe = 0.55 + 0.45 * Math.sin(frame * 0.045);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* opaque Altari base + grid + vignette, full frame 0 → last */}
      <AltariBackdrop width={W} height={H} />

      {/* world camera */}
      <div
        style={{
          position: "absolute",
          width: W,
          height: H,
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* breathing purple glow around the card (backdrop, not content) */}
        <div
          style={{
            position: "absolute",
            left: 540 - 640,
            top: 540 - 600,
            width: 1280,
            height: 1200,
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(91,94,194,0.20) 0%, rgba(91,94,194,0.0) 68%)",
            opacity: 0.45 + 0.35 * breathe,
          }}
        />

        {/* live recreated tree (crossfades in during the morph) */}
        {frame >= 116 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              opacity: treeOp,
              transform: `scale(${treeS})`,
              transformOrigin: "540px 540px",
            }}
          >
            <SkillTreeWorld
              frame={frame}
              revealAt={-120}
              labelDim={labelDim}
              pulses={[
                { dept: DEPT.Deals, start: 158 },
                { dept: DEPT.Operations, start: 174 },
                { dept: DEPT.Intelligence, start: 190 },
                { dept: DEPT.Sales, start: 200 },
              ]}
            />
          </div>
        )}

        {/* REAL product screenshot as a floating browser-fragment card */}
        {frame < 152 && (
          <div
            style={{
              position: "absolute",
              left: CARD_L,
              top: CARD_T,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 20,
              border: `1px solid ${ALTARI.border}`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
              overflow: "hidden",
              backgroundColor: ALTARI.bgDeep,
              opacity: cardOp,
              transform: `scale(${cardS})`,
              transformOrigin: "center center",
            }}
          >
            <Img
              src={staticFile("fish4/skilltree/skilltree-map-crop.png")}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: IMG_W,
                height: IMG_H,
                transform: `translate(${imgX}px, ${imgY}px) scale(${d})`,
                transformOrigin: "0 0",
              }}
            />
          </div>
        )}
      </div>

      {/* "Last opened" UI chip — screen space, near center */}
      {frame >= 232 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 514,
            display: "flex",
            justifyContent: "center",
            opacity: chipOp,
            transform: `translateY(${(1 - chipRise) * 18}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "15px 28px",
              borderRadius: 999,
              backgroundColor: ALTARI.card,
              border: `1px solid ${ALTARI.border}`,
              boxShadow: "0 16px 50px rgba(0,0,0,0.38)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke={ALTARI.body}
                strokeWidth="2"
              />
              <path
                d="M12 7 v5 l3.4 2.2"
                fill="none"
                stroke={ALTARI.body}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontFamily: manropeFamily,
                fontWeight: 600,
                fontSize: 25,
                letterSpacing: 0.4,
                color: ALTARI.body,
                whiteSpace: "nowrap",
              }}
            >
              Last opened · 7 days ago
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
