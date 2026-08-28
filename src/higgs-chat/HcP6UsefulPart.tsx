/**
 * HcP6UsefulPart — Higgs-Chat part 6 (1080×1920, 260f).
 *
 * VO (never on screen): one product → many consistent UGC pieces.
 * Visual argument: Allipop can card up top → three connector lines →
 * three phone cards playing the REAL UGC footage at different offsets
 * (same character), a lime ring landing on the face in each (consistency
 * cue), pull-back to the full tree + a fourth empty dashed slot.
 *
 * Camera: PaperWorld + useCam, hold→move→hold, 14–20f ramps, 25f end hold.
 */
import React from "react";
import {
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {
  C,
  FONT,
  HIGGS,
  HC,
  SPRINGS,
  PaperWorld,
  useCam,
  HiggsIcon,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

// ---------------------------------------------------------------------------
// World layout (world coords = 1080×1920 viewport space, wider to the right)
// ---------------------------------------------------------------------------

// Product card — transparent can cutout (1106×2257 native, aspect ≈ 0.49).
// Inner area 272×452; contain → can reads 221×452. Max cam zoom on it is
// 1.5 → ~332px on screen, far below native.
const PROD = { w: 320, h: 500, x: 540 - 160, y: 195, pad: 24 };
const PROD_BOTTOM = { x: 540, y: PROD.y + PROD.h };

// Phone cards — video box 268×476 (native 1080×1920; at hero zoom 2.85 the
// box reads 764px on screen, well below native even with crop zoom ≤ 1.3).
const VW = 268;
const VH = 476;
const CARD_PAD = 10;
const CARD_W = VW + CARD_PAD * 2;
const CARD_H = VH + CARD_PAD * 2;
const ROW_Y = 880;
const CARD_X = [200, 540, 880]; // centers — edges 56..1024, inside 5% margins
const SLOT_X = 1240; // 4th dashed slot, off-frame until the pull-back

// Beat timeline
const T = {
  chip: 14,
  lines: [46, 53, 60], // connector draw starts (14f each)
  pops: [58, 68, 78], // phone cards pop as each line arrives
  rings: [112, 140, 168], // lime ring lands during each hero hold
  slot: 204, // dashed slot pops during the pull-back
  slotLine: 198,
};

// Three different actions from the SAME 15.04s clip (1080×1920 @24fps), trim
// offsets in timeline frames (30fps). Source time at each hero hold:
//   card 0 → ~3.8–4.2s   holding the can up, talking to camera
//   card 1 → ~6.0–6.4s   fingers on the tab, cracking the can open
//   card 2 → ~10.2–10.7s drinking from the can
// Deepest read: card 2 ends at (260−78+219)/30 ≈ 13.4s < 15.04s — no freezes.
const TRIMS = [61, 109, 219];

// Distinct framings per card (crop zoom ≤ 1.3 keeps footage under native).
// ox/oy = transform origin %, tuned so face + can stay in frame per action.
const CROPS = [
  { cz: 1.0, ox: 50, oy: 30 },
  { cz: 1.12, ox: 35, oy: 25 },
  { cz: 1.25, ox: 50, oy: 15 },
];

// Ring center/diameter inside the 268×476 video box, per card — measured on
// rendered hold stills of the Allipop footage (face upper-middle; cards 1–2
// have the face peeking above/behind the raised can).
const RINGS = [
  { cx: 141, cy: 192, d: 124 },
  { cx: 93, cy: 206, d: 96 },
  { cx: 112, cy: 192, d: 104 },
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const ProductCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(2, SPRINGS.pop);
  const chip = useEnter(T.chip, SPRINGS.pop);
  const float = Math.sin(frame / 26) * 3;

  return (
    <div
      style={{
        position: "absolute",
        left: PROD.x,
        top: PROD.y,
        width: PROD.w,
        height: PROD.h,
        borderRadius: 24,
        background: C.card,
        border: `2px solid ${HIGGS.limeLine}`,
        boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
        padding: PROD.pad,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26 + float}px)`,
      }}
    >
      {/* ground plate — soft ellipse the cutout stands on (no float) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: PROD.pad - 20,
          width: 208,
          height: 34,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(25,23,20,0.20) 0%, rgba(25,23,20,0.09) 46%, rgba(25,23,20,0) 72%)",
          transform: "translateX(-50%)",
          filter: "blur(2px)",
        }}
      />
      <Img
        src={staticFile(HC.productPhoto)}
        style={{
          width: PROD.w - PROD.pad * 2,
          height: PROD.h - PROD.pad * 2,
          objectFit: "contain",
          display: "block",
          filter: "drop-shadow(0 14px 16px rgba(25,23,20,0.18))",
        }}
      />
      {/* Higgsfield icon chip, quietly attached to the corner */}
      <div
        style={{
          position: "absolute",
          right: -46,
          bottom: -26,
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px 10px 12px",
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 10px 26px rgba(25,23,20,0.10)",
          opacity: chip,
          transform: `scale(${0.8 + 0.2 * chip})`,
          transformOrigin: "left center",
        }}
      >
        <HiggsIcon size={40} radius={10} />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: C.ink,
          }}
        >
          Higgsfield
        </span>
      </div>
    </div>
  );
};

/** Connector lines product → three cards; drawn with pathLength tricks. */
const Connectors: React.FC = () => {
  const frame = useCurrentFrame();
  const targets = CARD_X.map((x) => ({ x, y: ROW_Y - 4 }));

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={1}
      height={1}
      viewBox="0 0 1 1"
    >
      {targets.map((t, i) => {
        const p = interpolate(
          frame,
          [T.lines[i], T.lines[i] + 14],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const midY = (PROD_BOTTOM.y + t.y) / 2;
        return (
          <path
            key={i}
            d={`M ${PROD_BOTTOM.x} ${PROD_BOTTOM.y + 6} C ${PROD_BOTTOM.x} ${midY}, ${t.x} ${midY}, ${t.x} ${t.y}`}
            fill="none"
            stroke={HIGGS.lime}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
            opacity={p > 0 ? 0.9 : 0}
          />
        );
      })}
      {/* dashed hint line to the empty 4th slot */}
      <path
        d={`M ${PROD_BOTTOM.x} ${PROD_BOTTOM.y + 6} C ${PROD_BOTTOM.x} ${(PROD_BOTTOM.y + ROW_Y) / 2}, ${SLOT_X} ${(PROD_BOTTOM.y + ROW_Y) / 2}, ${SLOT_X} ${ROW_Y - 4}`}
        fill="none"
        stroke={HIGGS.lime}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="14 16"
        opacity={interpolate(frame, [T.slotLine, T.slotLine + 14], [0, 0.55], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
      {/* origin dot on the product card */}
      <circle
        cx={PROD_BOTTOM.x}
        cy={PROD_BOTTOM.y + 6}
        r={9}
        fill={HIGGS.lime}
        opacity={interpolate(frame, [T.lines[0] - 4, T.lines[0] + 4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
    </svg>
  );
};

const PhoneCard: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const pop = useEnter(T.pops[index], SPRINGS.pop);
  const { cz, ox, oy } = CROPS[index];
  const ring = RINGS[index];
  const ringAt = T.rings[index];

  const land = useEnter(ringAt);
  const settle = interpolate(frame, [ringAt + 18, ringAt + 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringScale =
    (1.5 - 0.5 * land) * (1 + 0.02 * Math.sin((frame - ringAt) / 5));

  return (
    <div
      style={{
        position: "absolute",
        left: CARD_X[index] - CARD_W / 2,
        top: ROW_Y,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 26,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 22px 50px rgba(25,23,20,0.12)",
        padding: CARD_PAD,
        opacity: pop,
        transform: `translateY(${(1 - pop) * 34}px) scale(${0.86 + 0.14 * pop})`,
        transformOrigin: "center top",
      }}
    >
      <div
        style={{
          position: "relative",
          width: VW,
          height: VH,
          borderRadius: 18,
          overflow: "hidden",
          background: C.paperWarm,
        }}
      >
        <Sequence from={T.pops[index]} layout="none">
          <OffthreadVideo
            src={staticFile(HC.ugcVideo)}
            muted
            trimBefore={TRIMS[index]}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${cz})`,
              transformOrigin: `${ox}% ${oy}%`,
            }}
          />
        </Sequence>
        {/* consistency cue — lime ring lands on the face */}
        <div
          style={{
            position: "absolute",
            left: ring.cx - ring.d / 2,
            top: ring.cy - ring.d / 2,
            width: ring.d,
            height: ring.d,
            borderRadius: 999,
            border: `4px solid ${HIGGS.lime}`,
            opacity: land * (0.92 - 0.4 * settle),
            transform: `scale(${ringScale})`,
          }}
        />
      </div>
    </div>
  );
};

/** Empty dashed 4th slot — “room for more”, host-style plus affordance. */
const SlotCard: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = useEnter(T.slot, SPRINGS.pop);
  const pulse = 1 + 0.035 * Math.sin((frame - T.slot) / 9);

  return (
    <div
      style={{
        position: "absolute",
        left: SLOT_X - CARD_W / 2,
        top: ROW_Y,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 26,
        background: "rgba(255,255,255,0.55)",
        border: `2.5px dashed ${HIGGS.limeLine}`,
        opacity: pop,
        transform: `translateY(${(1 - pop) * 34}px) scale(${0.86 + 0.14 * pop})`,
        transformOrigin: "center top",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 999,
          background: HIGGS.limeSoft,
          border: `2px solid ${HIGGS.limeLine}`,
          display: "grid",
          placeItems: "center",
          transform: `scale(${pulse})`,
        }}
      >
        <svg width={40} height={40} viewBox="0 0 40 40">
          <path
            d="M20 7 V33 M7 20 H33"
            stroke={HIGGS.limeDeep}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP6UsefulPart: React.FC = () => {
  // hold on product → wide reveal → hero travel across the three cards →
  // pull back to the whole system (+ empty slot) → 25f end hold.
  const cam = useCam({
    keys: [0, 30, 46, 96, 110, 124, 138, 152, 166, 180, 200, 235, 259],
    fx: [540, 540, 540, 540, 200, 200, 540, 540, 880, 880, 720, 720, 720],
    fy: [445, 445, 793, 793, 1085, 1085, 1085, 1085, 1085, 1085, 793, 793, 793],
    z: [1.5, 1.5, 1.0, 1.0, 2.85, 2.85, 2.85, 2.85, 2.85, 2.85, 0.71, 0.71, 0.71],
  });

  return (
    <PaperWorld cam={cam}>
      <Connectors />
      <ProductCard />
      {[0, 1, 2].map((i) => (
        <PhoneCard key={i} index={i} />
      ))}
      <SlotCard />
    </PaperWorld>
  );
};
