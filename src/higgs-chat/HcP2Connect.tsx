/**
 * HcP2Connect — beat 2 of the Higgs-Chat series (PAPER + LIME, 9:16).
 *
 * VO (never on screen): "Connect Higgsfield, and it can turn a single
 * product photo into a full UGC video without leaving the chat."
 *
 * One continuous vertical world, one camera:
 *   1. 0–40   Connection lockup: the real OpenAI mark and the real Higgsfield
 *             lime tile slide together on white chips, a lime wire draws
 *             between them, pulse + contact nudge, then a dot crosses the
 *             live wire (micro-motion during the hold).
 *   2. 44–98  Camera eases down to the REAL Allipop can product card (the
 *             transparent cutout at 280×571 — well under its 1106×2257
 *             native — anchored on a soft floor shadow inside a white card).
 *             A lime scan band sweeps it, the border turns lime, and a mini
 *             can-chip packet pops out of the card bottom and travels down,
 *             drawing the flow line behind it. The camera rides down WITH
 *             the packet.
 *   3. 98–162 The packet lands; a phone-proportioned card springs in, a
 *             short Higgsfield-generating skeleton beats, then the REAL UGC
 *             result video (muted, from ~5.5s in — pull-tab open into the
 *             opened-can point, can big in frame) plays through the hold.
 *   4. 162–200 Settle wide: photo card → lime line → playing video card read
 *             as one system. 24f end hold on identical camera keys; the
 *             lockup fades while far off-screen so nothing is edge-sliced.
 *
 * No on-screen text at all. Real assets only. No glow — lime via borders,
 * fills and the wire. Paper visible at every frame.
 */
import React from "react";
import {
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, EASE, HC, HIGGS, HiggsIcon, PaperWorld, useCam } from "./kit";

export const DURATION_IN_FRAMES = 200;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], CLAMP);

const useSpringAt = (
  at: number,
  config: { damping: number; stiffness: number },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

// ---------------------------------------------------------------------------
// World geometry — 1080-wide column, camera travels down a ~2200-tall world.
// All content lives in x 322…758 so every zoom keeps the 5% side margins.
// ---------------------------------------------------------------------------

const CHIP = 170; // lockup chip square
const OAI = { cx: 390, cy: 360 }; // OpenAI chip center
const HGF = { cx: 690, cy: 360 }; // Higgsfield chip center
const WIRE = { x1: OAI.cx + CHIP / 2, x2: HGF.cx - CHIP / 2, y: 360 }; // 475→605

// Product card — transparent can cutout shown 280×571 (native 1106×2257,
// never above 1×). The card hugs the narrow can; a soft floor shadow under
// the base keeps the cutout anchored instead of floating.
const PHOTO = { w: 280, h: 571 };
const PC = { x: 344, y: 660, w: 392, h: 665 }; // can at (56,42) inside
const CAN = { x: (PC.w - PHOTO.w) / 2, y: 42 };

// Flow line the packet draws between the two cards.
const FLOW = { x: 540, y1: PC.y + PC.h, y2: 1530 }; // 1325 → 1530

// Result card — phone-proportioned, 9:16 inner video 402×715 (native 1080×1920).
const VIDEO = { w: 402, h: 715 };
const VC = { x: 329, y: FLOW.y2, w: VIDEO.w + 20, h: VIDEO.h + 20 }; // 422×735

const SHADOW = "0 22px 50px rgba(25,23,20,0.10)";

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  chips: -6, // pre-rolled — frame 0 opens with both chips mid-slide
  wire: 14, // lime wire draws 14→26
  contact: 26, // pulse ring + dock nudge on the Higgsfield chip
  dot: 32, // a dot crosses the live wire 32→44 (hold micro-motion)
  photoCard: 46, // Allipop can card springs in as the camera arrives
  scan: 60, // lime scan band sweeps the photo 60→76
  packet: 74, // mini photo chip pops out of the card bottom…
  travel: 78, // …and travels down 78→98, drawing the line behind it
  videoCard: 92, // phone card springs in ahead — a generating slot, waiting
  arrive: 98, // packet lands on the card's top edge, pulse
  videoIn: 112, // real UGC footage fades in over the generating skeleton
  lockupFade: 124, // lockup fades 124→144 — far off-screen by then
} as const;

// ---------------------------------------------------------------------------
// Shared pulse ring — expanding border circle, no glow.
// ---------------------------------------------------------------------------

const Ring: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 13;
  if (t <= 0 || t >= 1) return null;
  const r = 18 + t * 44;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 999,
        border: `3px solid ${HIGGS.lime}`,
        opacity: 0.55 * (1 - t),
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// 1 — Connection lockup: OpenAI chip ⟷ Higgsfield chip
// ---------------------------------------------------------------------------

const Lockup: React.FC = () => {
  const frame = useCurrentFrame();
  const oaiIn = useSpringAt(T.chips, { damping: 15, stiffness: 130 });
  const hgfIn = useSpringAt(T.chips + 2, { damping: 15, stiffness: 130 });
  const nudge = tri(frame, T.contact, 3, 8) * 5; // dock kiss on contact
  const bump = 1 + 0.04 * tri(frame, T.contact, 3, 7);

  const wireW = interpolate(frame, [T.wire, T.contact], [0, WIRE.x2 - WIRE.x1], {
    easing: EASE,
    ...CLAMP,
  });
  const dotT = interpolate(frame, [T.dot, T.dot + 12], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const dotO =
    interpolate(frame, [T.dot, T.dot + 2], [0, 1], CLAMP) *
    interpolate(frame, [T.dot + 10, T.dot + 13], [1, 0], CLAMP);

  const fade = interpolate(frame, [T.lockupFade, T.lockupFade + 20], [1, 0], {
    easing: EASE,
    ...CLAMP,
  });

  const chip = (
    cx: number,
    enter: number,
    fromX: number,
    dock: number,
    child: React.ReactNode,
  ) => (
    <div
      style={{
        position: "absolute",
        left: cx - CHIP / 2 + fromX * (1 - enter) + dock,
        top: OAI.cy - CHIP / 2,
        width: CHIP,
        height: CHIP,
        borderRadius: 40,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: SHADOW,
        display: "grid",
        placeItems: "center",
        opacity: Math.min(1, enter * 2),
        transform: `scale(${(0.82 + 0.18 * enter) * bump})`,
      }}
    >
      {child}
    </div>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
      {/* lime wire — draws from the OpenAI chip to the Higgsfield chip */}
      <div
        style={{
          position: "absolute",
          left: WIRE.x1,
          top: WIRE.y - 2.5,
          width: wireW,
          height: 5,
          borderRadius: 999,
          background: HIGGS.lime,
        }}
      />
      {/* dot crossing the live wire after contact */}
      {dotO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: WIRE.x1 + (WIRE.x2 - WIRE.x1) * dotT - 6,
            top: WIRE.y - 6,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: HIGGS.limeDeep,
            opacity: dotO,
          }}
        />
      ) : null}
      {chip(
        OAI.cx,
        oaiIn,
        -90,
        nudge,
        <Img
          src={staticFile(HC.logos.openai)}
          style={{ width: 96, height: 98, display: "block" }}
        />,
      )}
      {chip(HGF.cx, hgfIn, 90, -nudge, <HiggsIcon size={106} />)}
      <Ring at={T.contact} x={WIRE.x2} y={WIRE.y} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2 — Product photo card + scan band
// ---------------------------------------------------------------------------

const PhotoCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.photoCard, { damping: 16, stiffness: 140 });
  const scanT = interpolate(frame, [T.scan, T.scan + 16], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const scanO =
    interpolate(frame, [T.scan - 2, T.scan + 2], [0, 1], CLAMP) *
    interpolate(frame, [T.scan + 13, T.scan + 17], [1, 0], CLAMP);
  const limed = interpolate(frame, [T.scan + 12, T.scan + 18], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const bandY = -140 + scanT * (PC.h + 160);

  return (
    <div
      style={{
        position: "absolute",
        left: PC.x,
        top: PC.y,
        width: PC.w,
        height: PC.h,
        borderRadius: 26,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: SHADOW,
        opacity: Math.min(1, enter * 1.5),
        transform: `translateY(${(1 - enter) * 40}px)`,
      }}
    >
      {/* soft floor shadow — anchors the transparent cutout to the card */}
      <div
        style={{
          position: "absolute",
          left: PC.w / 2 - 110,
          top: CAN.y + PHOTO.h - 16,
          width: 220,
          height: 36,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(25,23,20,0.16), rgba(25,23,20,0) 70%)",
        }}
      />
      <Img
        src={staticFile(HC.productPhoto)}
        style={{
          position: "absolute",
          left: CAN.x,
          top: CAN.y,
          width: PHOTO.w,
          height: PHOTO.h,
          display: "block",
        }}
      />
      {/* lime border takes over once the scan has passed */}
      <div
        style={{
          position: "absolute",
          inset: -1.5,
          borderRadius: 26,
          border: `1.5px solid ${HIGGS.limeLine}`,
          opacity: limed,
        }}
      />
      {/* scan band — clipped to the card */}
      {scanO > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 26,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: bandY,
              width: "100%",
              height: 120,
              background: `linear-gradient(rgba(132,204,22,0), ${HIGGS.limeSoft})`,
              opacity: scanO,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: bandY + 120,
              width: "100%",
              height: 3,
              background: HIGGS.lime,
              opacity: scanO,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3 — Packet (mini photo chip) travelling down, drawing the flow line
// ---------------------------------------------------------------------------

const FlowPacket: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = useSpringAt(T.packet, { damping: 13, stiffness: 190 });
  const t = interpolate(frame, [T.travel, T.arrive], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const y = FLOW.y1 + t * (FLOW.y2 - FLOW.y1);
  const gone = interpolate(frame, [T.arrive, T.arrive + 5], [1, 0], CLAMP);
  const lineIn = interpolate(frame, [T.travel - 2, T.travel + 2], [0, 1], CLAMP);

  return (
    <>
      {/* the line trails the packet and stays — photo → video, connected */}
      <div
        style={{
          position: "absolute",
          left: FLOW.x - 2.5,
          top: FLOW.y1,
          width: 5,
          height: Math.max(0, y - FLOW.y1),
          borderRadius: 999,
          background: HIGGS.lime,
          opacity: lineIn,
        }}
      />
      {gone > 0 && pop > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: FLOW.x - 36,
            top: y - 36,
            width: 72,
            height: 72,
            borderRadius: 18,
            overflow: "hidden",
            border: `2.5px solid ${HIGGS.lime}`,
            boxShadow: SHADOW,
            background: C.card,
            opacity: Math.min(1, pop * 2) * gone,
            transform: `scale(${(0.4 + 0.6 * pop) * (0.7 + 0.3 * gone)})`,
          }}
        >
          <Img
            src={staticFile(HC.productPhoto)}
            style={{
              position: "absolute",
              inset: 7,
              width: 58,
              height: 58,
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      ) : null}
      <Ring at={T.arrive + 1} x={FLOW.x} y={FLOW.y2} />
    </>
  );
};

// ---------------------------------------------------------------------------
// 4 — Result card: phone-proportioned, real UGC footage playing
// ---------------------------------------------------------------------------

const ResultCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.videoCard, { damping: 16, stiffness: 140 });
  const videoO = interpolate(frame, [T.videoIn, T.videoIn + 5], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const iconPulse = 0.4 + 0.3 * Math.sin(frame / 3.2);
  if (enter < 0.005) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: VC.x,
        top: VC.y,
        width: VC.w,
        height: VC.h,
        borderRadius: 30,
        background: C.card,
        border: `1.5px solid ${HIGGS.limeLine}`,
        boxShadow: SHADOW,
        opacity: Math.min(1, enter * 1.5),
        transform: `translateY(${(1 - enter) * 36}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 10,
          width: VIDEO.w,
          height: VIDEO.h,
          borderRadius: 22,
          overflow: "hidden",
          background: "#EFECE6",
        }}
      >
        {/* generating skeleton — Higgsfield tile pulsing until footage lands */}
        {videoO < 1 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            <HiggsIcon size={64} style={{ opacity: iconPulse }} />
          </div>
        ) : null}
        {/* the REAL UGC result — muted, from ~5.5s in (pull-tab open →
            opened-can point, the Allipop can big in frame the whole window),
            1080×1920 shown at 0.37× */}
        <Sequence from={T.videoIn} layout="none">
          <OffthreadVideo
            src={staticFile(HC.ugcVideo)}
            muted
            trimBefore={165}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: videoO,
            }}
          />
        </Sequence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP2Connect: React.FC = () => {
  // Hold tight on the lockup → 14f ease down to the photo card (lockup stays
  // in shot above it: cause over effect) → hold for the scan → 16f ride down
  // WITH the packet → hold while the result card lands and the UGC footage
  // plays → 14f settle wide on photo → line → video → 24f end hold on
  // identical keys.
  const cam = useCam({
    keys: [0, 44, 58, 80, 96, 162, 176, 200],
    fx: [540, 540, 540, 540, 540, 540, 540, 540],
    fy: [400, 400, 990, 990, 1850, 1850, 1462, 1462],
    z: [1.6, 1.6, 1.12, 1.12, 1.15, 1.15, 0.9, 0.9],
  });

  return (
    <PaperWorld cam={cam}>
      <Lockup />
      <PhotoCard />
      <FlowPacket />
      <ResultCard />
    </PaperWorld>
  );
};
