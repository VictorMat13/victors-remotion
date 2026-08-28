import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { FONT_MONO, FONT_SANS, LW, RN, SHOTS, safePadX } from "./theme";

// ===========================================================================
// P6 — VO.p6a "Found the most viral moments." + VO.p6b "Cut every clip
// vertical."  (STEPS 3 and 4 of the six-step spine.)
//
// Beat 1 (f0-41)   a wide editor track: the retention curve draws left to
//                  right, the four highest crests take amber markers, and
//                  brackets snap around the matching 16:9 frames on the
//                  filmstrip. Timestamps land under each pick.
// Move  (f41-59)   18f, Easing.inOut(Easing.cubic), push in to selection #2.
//                  Nothing happens during the move.
// Beat 2 (f59-110) THE RESHAPE, held on a static camera: the selected frame's
//                  crop rails slide inward until the frame IS 9:16. The
//                  picture inside is genuinely cropped, never squashed — the
//                  inner still is always rendered 16:9 at the frame's height
//                  and centre-anchored, so the sides really are thrown away.
//                  Then the camera pulls back while that frame grows into the
//                  hero vertical and the other three follow in a staggered
//                  row. Settles f95-110.
//
// Clip geometry is interpolated in SCREEN space so the on-screen size grows
// monotonically while the camera pulls out — no bulge, no rubber-banding.
//
// No word on screen restates the VO. Everything textual is real-shaped editor
// data: a source duration, four timestamps, per-clip durations, axis labels.
// ===========================================================================

export const DURATION_IN_FRAMES = 110;

/* ----------------------------------------------------------- world layout */

const VW = 1080;
const PAD = safePadX(VW); // 54 — the 5% side safe margin

const CARD = { x: PAD, y: 296, w: VW - PAD * 2, h: 488 };
const CARD_R = 26;
const CARD_PAD = 32;
const INNER_L = CARD.x + CARD_PAD; // 86
const INNER_R = CARD.x + CARD.w - CARD_PAD; // 994

const TRACK_X = 154;
const TRACK_W = 840;

const CHART_TOP = 392;
const CHART_BOT = 604;
const CHART_H = CHART_BOT - CHART_TOP;

const CELL_COUNT = 10;
const CELL_GAP = 4;
const CELL_W = (TRACK_W - CELL_GAP * (CELL_COUNT - 1)) / CELL_COUNT; // 80.4
const CELL_H = (CELL_W * 9) / 16; // 45.22 — every filmstrip cell is a 16:9 frame
const CELL_R = 5;
const CELL_Y = 632;
const CELL_CY = CELL_Y + CELL_H / 2;
const GATE_W = (CELL_H * 9) / 16; // 25.44 — the same frame cropped to 9:16

const cellX = (i: number) => TRACK_X + i * (CELL_W + CELL_GAP);
const cellCX = (i: number) => cellX(i) + CELL_W / 2;

const BRACKET_INSET = 7;
const TRACK_TOP = CELL_Y - 10;
const TRACK_BOT = CELL_Y + CELL_H + 10;

// The four crests the agent picked. Timestamps are real-shaped editor data.
const SELECT = [
  { cell: 1, time: "03:12", dur: "0:28", peak: 0.7, spread: 0.052 },
  { cell: 3, time: "08:47", dur: "0:34", peak: 0.95, spread: 0.05 },
  { cell: 6, time: "15:26", dur: "0:31", peak: 0.82, spread: 0.055 },
  { cell: 8, time: "20:09", dur: "0:31", peak: 0.74, spread: 0.048 },
];
const HERO = 1; // index into SELECT — the tallest crest becomes the hero clip
const HERO_CELL = SELECT[HERO].cell;
const SOURCE_DURATION = "24:38";
const RUNNING = ["0:28", "1:02", "1:33", "2:04"]; // selected time, ticking up

/* ------------------------------------------- the retention curve, sampled */

const BASE = 0.26;
const retention = (t: number) => {
  let v =
    BASE +
    0.045 * Math.sin(t * 15.7 + 1.1) +
    0.026 * Math.sin(t * 29.3 + 3.7) +
    0.016 * Math.sin(t * 47.1 + 0.4);
  for (let i = 0; i < SELECT.length; i++) {
    const s = SELECT[i];
    const f = (cellCX(s.cell) - TRACK_X) / TRACK_W;
    const d = (t - f) / s.spread;
    v += (s.peak - BASE) * Math.exp(-d * d);
  }
  return Math.max(0.05, Math.min(1, v));
};

const curveY = (t: number) => CHART_BOT - retention(t) * CHART_H;

const SAMPLES = 88;
const PTS: [number, number][] = [];
for (let i = 0; i <= SAMPLES; i++) {
  const t = i / SAMPLES;
  PTS.push([TRACK_X + t * TRACK_W, curveY(t)]);
}

const smooth = (p: [number, number][]) => {
  let d = `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = i === 0 ? p[0] : p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = i + 2 < p.length ? p[i + 2] : p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(
      2,
    )}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
};

const CURVE_D = smooth(PTS);
const CURVE_AREA_D = `${CURVE_D} L ${(TRACK_X + TRACK_W).toFixed(2)} ${CHART_BOT} L ${TRACK_X} ${CHART_BOT} Z`;
const CURVE_LEN = getLength(CURVE_D);

/* ------------------------------------------------------------ frame tones */
// Warm graphite video stills. Dark lives only INSIDE frames, never on the
// world. Each still gets its own tone, gradient angle and key-light position
// so the strip reads as ten different moments, not one texture repeated.
type Still = { a: string; b: string; ang: number; key: string; keyI: number };
const STILLS: Still[] = [
  { a: "#57483C", b: "#221B16", ang: 152, key: "64% 30%", keyI: 0.4 },
  { a: "#2F3338", b: "#12161A", ang: 174, key: "31% 22%", keyI: 0.5 }, // pick 1 — cool
  { a: "#4C4239", b: "#1F1A16", ang: 144, key: "56% 42%", keyI: 0.3 },
  { a: "#6B5140", b: "#281C14", ang: 156, key: "58% 26%", keyI: 0.58 }, // hero — warm, bright
  { a: "#3D3A35", b: "#1A1815", ang: 172, key: "42% 36%", keyI: 0.28 },
  { a: "#4A4038", b: "#1D1815", ang: 148, key: "58% 24%", keyI: 0.36 },
  { a: "#6A4B33", b: "#26170E", ang: 138, key: "44% 62%", keyI: 0.42 }, // pick 3 — low key light
  { a: "#413A33", b: "#1B1714", ang: 154, key: "60% 40%", keyI: 0.26 },
  { a: "#3E4A46", b: "#141B19", ang: 164, key: "66% 34%", keyI: 0.46 }, // pick 4 — green-grey
  { a: "#37332E", b: "#161311", ang: 150, key: "54% 38%", keyI: 0.3 },
];

const stillBg = (s: Still) =>
  `linear-gradient(${s.ang}deg, ${s.a} 0%, ${s.b} 100%)`;
// ---------------------------------------------------------------------------
// REAL FOOTAGE. The clips in this part are the same Shorts that Part 7 captions
// and schedules, so they must be the same real pictures — not abstract shapes.
// Cropped out of the live capture of youtube.com/@Koen-ai via <Img>, using the
// same shelf geometry as P7. <Img> is waited on by Remotion; a CSS
// backgroundImage is not, and would commit undecoded frames.
const THUMB_Y = 177; // featured row: shorts 7-12. The first six are scrolled fully offscreen in the capture (Victor: skip the first 5).
const THUMB_SW = 207;
const THUMB_SH = 325;
const thumbX = (n: number) => 265 + n * 218; // n = position on the real shelf

// Which real Short backs each of the ten filmstrip cells. Hand-mapped, not
// `cell % 6`: the four SELECTED crests (cells 1/3/6/8) must land on frames that
// read cleanly when cropped to 9:16. Shelf 3 ("Posting to 6 platforms") is a
// text-heavy montage — cropping it slices captions mid-word — so it is kept off
// every selected cell and the hero (cell 3) takes shelf 0, the brightest
// face-and-dog frame. Shelf 5 ("Bigfoot drives #n8n") is off the selected cells
// for the same reason — its burned caption crops mid-word in the follower row.
// Selected cells resolve to: 1 -> 1 (car), 3 -> 0 (hero), 6 -> 4, 8 -> 2.
const SHELF_FOR_CELL = [5, 1, 3, 0, 2, 5, 4, 3, 2, 1];

// Fills a box with the real thumbnail, centre-anchored. Because the box is 16:9
// at the frame's height, the picture is scaled to cover it and we read a wide
// band of the source; as the frame narrows to 9:16 the sides are cropped away
// and it lands on the thumbnail's own framing.
const RealStill: React.FC<{ shelf: number; boxW: number; boxH: number }> = ({
  shelf,
  boxW,
  boxH,
}) => {
  const scale = Math.max(boxW / THUMB_SW, boxH / THUMB_SH);
  return (
    <Img
      src={staticFile(SHOTS.ytShorts)}
      style={{
        position: "absolute",
        left: -thumbX(shelf) * scale + (boxW - THUMB_SW * scale) / 2,
        top: -THUMB_Y * scale + (boxH - THUMB_SH * scale) / 2,
        width: 1600 * scale,
        height: 1000 * scale,
        maxWidth: "none",
      }}
    />
  );
};

const stillKey = (s: Still) =>
  `radial-gradient(54% 76% at ${s.key}, rgba(255,236,205,${s.keyI}) 0%, rgba(255,236,205,${(
    s.keyI * 0.3
  ).toFixed(3)}) 44%, rgba(255,236,205,0) 74%)`;

/* --------------------------------------------------------------- timings */

const EASE = Easing.inOut(Easing.cubic);

const Z_TIGHT = 3.9;
const KEY_T = [0, 41, 59, 72, 92, DURATION_IN_FRAMES];
const KEY_FX = [540, 540, cellCX(HERO_CELL), cellCX(HERO_CELL), 540, 540];
const KEY_FY = [540, 540, 643, 643, 540, 540];
const KEY_Z = [1, 1, Z_TIGHT, Z_TIGHT, 1, 1];

const CURVE_FROM = 4;
const CURVE_TO = 22;
const MARK_AT = [21, 24, 27, 30];
const BRACKET_AT = [24, 27, 30, 33];

const CROP_FROM = 59;
const CROP_TO = 72;
const CARD_FADE = [76, 90];

// Clip choreography. `crop` is the 16:9 → 9:16 reshape, `travel` the flight
// out to the settled row. The hero is listed LAST so it paints on top of the
// others while their flight paths cross.
const CLIPS = [
  { sel: 0, cropFrom: 68, travel: 74, dur: 13, slot: { cx: 512, cy: 540, w: 178, h: 316 } },
  { sel: 2, cropFrom: 71, travel: 77, dur: 13, slot: { cx: 710, cy: 540, w: 178, h: 316 } },
  { sel: 3, cropFrom: 74, travel: 80, dur: 13, slot: { cx: 908, cy: 540, w: 178, h: 316 } },
  { sel: 1, cropFrom: CROP_FROM, travel: 72, dur: 20, slot: { cx: 233, cy: 540, w: 300, h: 533 } },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ font */

const idGroteskFaces = (sf: (p: string) => string) => `
@font-face { font-family: 'IDGrotesk'; font-weight: 400; font-style: normal;
  src: url('${sf("bgrow/fonts/IDGrotesk-Regular.ttf")}') format('truetype'); }
@font-face { font-family: 'IDGrotesk'; font-weight: 500; font-style: normal;
  src: url('${sf("bgrow/fonts/IDGrotesk-Medium.ttf")}') format('truetype'); }
@font-face { font-family: 'IDGrotesk'; font-weight: 600; font-style: normal;
  src: url('${sf("bgrow/fonts/IDGrotesk-Bold.ttf")}') format('truetype'); }
`;

/* ------------------------------------------------------------- one frame */
// The still inside is always rendered 16:9 at the frame's height and
// centre-anchored, so narrowing the frame CROPS the picture — it never
// squashes it. That is the whole mechanism of beat 2.

const VideoFrame: React.FC<{
  cell: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  radius: number;
  opacity: number;
  chip: number;
  label: string;
  play: number;
  pulse: number;
  hero: boolean;
}> = ({ cell, cx, cy, w, h, radius, opacity, chip, label, play, pulse, hero }) => {
  const imgW = (h * 16) / 9;
  const still = STILLS[cell];
  const chipFont = Math.max(9, Math.min(23, w * 0.077));

  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        opacity,
        boxShadow: chip > 0.02 ? (hero ? LW.shadowLift : LW.shadow) : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (w - imgW) / 2,
          top: 0,
          width: imgW,
          height: h,
          overflow: "hidden",
          background: stillBg(still),
        }}
      >
        <RealStill shelf={SHELF_FOR_CELL[cell % SHELF_FOR_CELL.length]} boxW={imgW} boxH={h} />
        <div style={{ position: "absolute", inset: 0, background: stillKey(still), opacity: 0.35 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(74% 62% at 14% 92%, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 68%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0) 40%)",
          opacity: chip,
        }}
      />

      {chip > 0.01 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: w * 0.055,
              bottom: h * 0.075,
              opacity: chip,
              display: "flex",
              alignItems: "center",
              gap: chipFont * 0.42,
            }}
          >
            <div
              style={{
                width: chipFont * 0.44,
                height: chipFont * 0.44,
                borderRadius: 999,
                backgroundColor: RN.amber,
                opacity: pulse,
              }}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: chipFont,
                letterSpacing: 0.4,
                color: "rgba(255,255,255,0.95)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {label}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: w * 0.055,
              right: w * 0.055,
              bottom: h * 0.034,
              height: Math.max(2, h * 0.0085),
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.24)",
              opacity: chip,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(1, play) * 100}%`,
                height: "100%",
                borderRadius: 999,
                backgroundColor: RN.amber,
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ comp */

export const KsP6FoundTheViralMoments: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Runable's real typeface.
  const [fontHandle] = useState(() => delayRender("KsP6 IDGrotesk"));
  useEffect(() => {
    const ID = "ksp6-idgrotesk-faces";
    if (!document.getElementById(ID)) {
      const el = document.createElement("style");
      el.id = ID;
      el.textContent = idGroteskFaces(staticFile);
      document.head.appendChild(el);
    }
    const done = () => continueRender(fontHandle);
    Promise.all([
      document.fonts.load('400 40px "IDGrotesk"'),
      document.fonts.load('500 40px "IDGrotesk"'),
      document.fonts.load('600 40px "IDGrotesk"'),
    ])
      .then(done)
      .catch(done);
  }, [fontHandle]);

  /* ---- camera: hold → push in → hold → pull out → hold ------------------ */
  const cam = (vals: number[]) =>
    interpolate(frame, KEY_T, vals, {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const fx = cam(KEY_FX);
  const fy = cam(KEY_FY);
  const z = cam(KEY_Z);

  const toScreenX = (wx: number) => (wx - fx) * z + width / 2;
  const toScreenY = (wy: number) => (wy - fy) * z + height / 2;

  /* ---- beat 1 ----------------------------------------------------------- */
  // The card is fully painted at frame 0 — the editor can cut straight in and
  // the ACTION (frames streaming into the track, the curve drawing) is the
  // entrance. Nothing fades up from an empty frame.
  const cellEnter = (i: number) =>
    spring({
      frame: frame - (3 + i * 1.3),
      fps,
      config: { damping: 26, stiffness: 200 },
      durationInFrames: 12,
    });

  const draw = interpolate(frame, [CURVE_FROM, CURVE_TO], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const evolved = evolvePath(Math.max(0.0001, draw), CURVE_D);
  const head = getPointAtLength(CURVE_D, Math.max(0.5, draw * CURVE_LEN));
  const headFade = interpolate(frame, [CURVE_TO, CURVE_TO + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // unselected frames wash out once the picks land
  const dim = interpolate(frame, [MARK_AT[0], BRACKET_AT[3] + 8], [1, 0.42], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const landed = BRACKET_AT.filter((f) => frame >= f + 4).length;
  const runningLabel = landed === 0 ? "0:00" : RUNNING[landed - 1];
  const tickPop =
    landed === 0 ? 0 : Math.max(0, 1 - (frame - (BRACKET_AT[landed - 1] + 4)) / 7);

  /* ---- beat 2 ----------------------------------------------------------- */
  const ramp = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const heroCrop = ramp(CROP_FROM, CROP_TO);
  const heroCropW = lerp(CELL_W, GATE_W, heroCrop);

  const railIn = interpolate(frame, [CROP_FROM - 5, CROP_FROM], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const railOut = interpolate(frame, [CROP_TO + 1, CROP_TO + 7], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rail = railIn * railOut;

  const cardOpacity = interpolate(frame, CARD_FADE, [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardExit = 1 - cardOpacity;

  const dotPulse = 0.55 + 0.45 * Math.sin(frame * 0.24);

  // The screen-pinned six-dot step HUD was removed: no other part in the series
  // carries one, so it would blink in and out across the cut. P4 already carries
  // the step spine as a full list, which is where that job belongs.

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* the warm white world — opaque, full bleed, frame 0 → last frame */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(126% 92% at 50% 8%, ${LW.card} 0%, ${LW.paper} 44%, ${LW.paperDeep} 100%)`,
        }}
      />

      {/* ------------------------------------------------- the editor card */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: VW,
            height: VW,
            transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: VW,
              height: VW,
              opacity: cardOpacity,
              transform: `translateY(${cardExit * 26}px) scale(${1 - cardExit * 0.03})`,
              transformOrigin: "540px 540px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: CARD.x,
                top: CARD.y,
                width: CARD.w,
                height: CARD.h,
                borderRadius: CARD_R,
                backgroundColor: LW.card,
                border: `1px solid ${LW.hairline}`,
                boxShadow: LW.shadow,
              }}
            />

            {/* header — source duration, and the running selected time */}
            <div
              style={{
                position: "absolute",
                left: INNER_L,
                top: 328,
                height: 34,
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 14,
                paddingRight: 16,
                borderRadius: 10,
                backgroundColor: RN.panel,
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: `9px solid ${RN.muted}`,
                }}
              />
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 21,
                  color: RN.textWarm,
                  letterSpacing: 0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {SOURCE_DURATION}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                right: VW - INNER_R,
                top: 328,
                height: 34,
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingLeft: 15,
                paddingRight: 15,
                borderRadius: 10,
                backgroundColor: RN.amberSoft,
                transform: `scale(${1 + tickPop * 0.06})`,
                transformOrigin: "100% 50%",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: RN.amber,
                  opacity: dotPulse,
                }}
              />
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 21,
                  color: RN.amber,
                  letterSpacing: 0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {runningLabel}
              </div>
            </div>

            {/* ---------------------------------------------- curve + markers */}
            <svg
              width={VW}
              height={VW}
              viewBox={`0 0 ${VW} ${VW}`}
              style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
            >
              <defs>
                <clipPath id="ksp6-area">
                  <rect
                    x={TRACK_X}
                    y={CHART_TOP - 40}
                    width={Math.max(0.01, draw * TRACK_W)}
                    height={CHART_H + 60}
                  />
                </clipPath>
                <linearGradient id="ksp6-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RN.amber} stopOpacity={0.19} />
                  <stop offset="100%" stopColor={RN.amber} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <line
                x1={TRACK_X}
                y1={CHART_TOP}
                x2={TRACK_X + TRACK_W}
                y2={CHART_TOP}
                stroke="rgba(0,0,0,0.07)"
                strokeWidth={1}
              />
              <line
                x1={TRACK_X}
                y1={CHART_BOT}
                x2={TRACK_X + TRACK_W}
                y2={CHART_BOT}
                stroke="rgba(0,0,0,0.10)"
                strokeWidth={1}
              />
              <text
                x={INNER_L + 56}
                y={CHART_TOP + 6}
                textAnchor="end"
                fontFamily={FONT_SANS}
                fontSize={16}
                fill={LW.muted}
              >
                100%
              </text>
              <text
                x={INNER_L + 56}
                y={CHART_BOT + 6}
                textAnchor="end"
                fontFamily={FONT_SANS}
                fontSize={16}
                fill={LW.muted}
              >
                0%
              </text>

              <g clipPath="url(#ksp6-area)">
                <path d={CURVE_AREA_D} fill="url(#ksp6-fill)" />
              </g>

              <path
                d={CURVE_D}
                fill="none"
                stroke={RN.textWarm}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />

              {/* the drawing head — a live scrub while the curve renders */}
              {headFade > 0.01 ? (
                <g opacity={headFade}>
                  <line
                    x1={head.x}
                    y1={CHART_TOP - 6}
                    x2={head.x}
                    y2={TRACK_BOT}
                    stroke={RN.amber}
                    strokeWidth={1.6}
                    opacity={0.5}
                  />
                  <circle cx={head.x} cy={head.y} r={5.5} fill={RN.amber} />
                </g>
              ) : null}

              {/* markers on the crests + drop lines into the selections */}
              {SELECT.map((s, i) => {
                const at = MARK_AT[i];
                const pop = spring({
                  frame: frame - at,
                  fps,
                  config: { damping: 11, stiffness: 170 },
                  durationInFrames: 12,
                });
                if (pop <= 0.001) return null;
                const px = cellCX(s.cell);
                const py = curveY((px - TRACK_X) / TRACK_W);
                const ring = interpolate(frame, [at, at + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const drop = interpolate(frame, [at + 2, at + 11], [0, 1], {
                  easing: EASE,
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <g key={s.cell}>
                    <line
                      x1={px}
                      y1={py + 10}
                      x2={px}
                      y2={py + 10 + (TRACK_TOP - BRACKET_INSET - py - 10) * drop}
                      stroke={RN.amber}
                      strokeWidth={1.6}
                      strokeDasharray="4 5"
                      opacity={0.55 * pop}
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r={7 + 24 * ring}
                      fill="none"
                      stroke={RN.amber}
                      strokeWidth={2}
                      opacity={0.42 * (1 - ring)}
                    />
                    <circle cx={px} cy={py} r={9.5 * pop} fill={LW.card} />
                    <circle cx={px} cy={py} r={6.4 * pop} fill={RN.amber} />
                  </g>
                );
              })}
            </svg>

            {/* ----------------------------------------------- the film track */}
            <div
              style={{
                position: "absolute",
                left: TRACK_X - 8,
                top: TRACK_TOP - 4,
                width: TRACK_W + 16,
                height: TRACK_BOT - TRACK_TOP + 8,
                borderRadius: 14,
                backgroundColor: RN.panel,
                border: `1px solid ${LW.hairlineSoft}`,
              }}
            />

            {new Array(CELL_COUNT).fill(0).map((_, i) => {
              const e = cellEnter(i);
              const selected = SELECT.some((s) => s.cell === i);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: cellX(i),
                    top: CELL_Y + (1 - e) * 8,
                    width: CELL_W,
                    height: CELL_H,
                    borderRadius: CELL_R,
                    overflow: "hidden",
                    opacity: e * (selected ? 1 : dim),
                    background: stillBg(STILLS[i]),
                  }}
                >
                  <RealStill shelf={SHELF_FOR_CELL[i % SHELF_FOR_CELL.length]} boxW={CELL_W} boxH={CELL_H} />
                  <div
                    style={{ position: "absolute", inset: 0, background: stillKey(STILLS[i]), opacity: 0.35 }}
                  />
                </div>
              );
            })}

            {/* the crop rails eat the sides of the selected frame away */}
            {rail > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: cellX(HERO_CELL),
                  top: CELL_Y,
                  width: CELL_W,
                  height: CELL_H,
                  borderRadius: CELL_R,
                  overflow: "hidden",
                  opacity: rail,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: (CELL_W - heroCropW) / 2 + 0.5,
                    backgroundColor: "rgba(247,246,243,0.88)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100%",
                    width: (CELL_W - heroCropW) / 2 + 0.5,
                    backgroundColor: "rgba(247,246,243,0.88)",
                  }}
                />
              </div>
            ) : null}

            {/* ------------------------------------- brackets + timestamps */}
            {SELECT.map((s, i) => {
              const at = BRACKET_AT[i];
              const g = spring({
                frame: frame - at,
                fps,
                config: { damping: 22, stiffness: 190 },
                durationInFrames: 10,
              });
              if (g <= 0.001) return null;
              const bx = cellX(s.cell) - BRACKET_INSET;
              const by = CELL_Y - BRACKET_INSET;
              const bw = CELL_W + BRACKET_INSET * 2;
              const bh = CELL_H + BRACKET_INSET * 2;
              const isHero = i === HERO;
              const halo = isHero ? 0.1 + 0.07 * Math.sin((frame - at) * 0.25) : 0;
              return (
                <div key={s.cell}>
                  <div
                    style={{
                      position: "absolute",
                      left: bx,
                      top: by,
                      width: bw,
                      height: bh,
                      borderRadius: 11,
                      border: `2.2px solid ${RN.amber}`,
                      opacity: Math.min(1, g * 1.6),
                      transform: `scaleX(${0.24 + 0.76 * g})`,
                      transformOrigin: "50% 50%",
                      boxShadow: isHero
                        ? `0 0 0 7px rgba(222,155,74,${halo.toFixed(3)})`
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: -3.2,
                        top: bh / 2 - 11,
                        width: 5,
                        height: 22,
                        borderRadius: 3,
                        backgroundColor: RN.amber,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: -3.2,
                        top: bh / 2 - 11,
                        width: 5,
                        height: 22,
                        borderRadius: 3,
                        backgroundColor: RN.amber,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: cellCX(s.cell) - 70,
                      top: 700,
                      width: 140,
                      textAlign: "center",
                      fontFamily: FONT_MONO,
                      fontSize: 21,
                      letterSpacing: 0.8,
                      color: RN.amber,
                      fontVariantNumeric: "tabular-nums",
                      opacity: Math.min(1, Math.max(0, (g - 0.35) / 0.5)),
                      transform: `translateY(${(1 - g) * 7}px)`,
                    }}
                  >
                    {s.time}
                  </div>
                </div>
              );
            })}
          </div>

          {/* the amber crop handles, riding the shrinking frame edges */}
          {rail > 0.01
            ? [-1, 1].map((side) => (
                <div
                  key={side}
                  style={{
                    position: "absolute",
                    left: cellCX(HERO_CELL) + (side * heroCropW) / 2 - 1.3,
                    top: CELL_Y - 7,
                    width: 2.6,
                    height: CELL_H + 14,
                    backgroundColor: RN.amber,
                    opacity: rail * cardOpacity,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -2.7,
                      top: (CELL_H + 14) / 2 - 9,
                      width: 8,
                      height: 18,
                      borderRadius: 3,
                      backgroundColor: RN.amber,
                    }}
                  />
                </div>
              ))
            : null}
        </div>
      </AbsoluteFill>

      {/* --------------------------------------------------------- the clips */}
      {/* Screen-space so the on-screen size grows monotonically while the
          camera pulls out. At travel 0 each clip sits exactly on its cell. */}
      <AbsoluteFill>
        {CLIPS.map((c) => {
          const s = SELECT[c.sel];
          const crop = ramp(c.cropFrom, c.travel);
          const t = spring({
            frame: frame - c.travel,
            fps,
            config: { damping: 24, stiffness: 105, mass: 0.9 },
            durationInFrames: c.dur,
          });
          const e = cellEnter(s.cell);
          const cropW = lerp(CELL_W, GATE_W, crop);

          const cx = lerp(toScreenX(cellCX(s.cell)), c.slot.cx, t);
          const cy = lerp(toScreenY(CELL_CY + (1 - e) * 8), c.slot.cy, t);
          const w = lerp(cropW * z, c.slot.w, t);
          const h = lerp(CELL_H * z, c.slot.h, t);
          const radius = lerp(CELL_R * z, 20, t);
          const chip = interpolate(t, [0.55, 0.92], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <VideoFrame
              key={s.cell}
              cell={s.cell}
              cx={cx}
              cy={cy}
              w={w}
              h={h}
              radius={radius}
              opacity={e}
              chip={chip}
              label={s.dur}
              play={0.07 + Math.max(0, frame - (c.travel + 12)) * 0.006}
              pulse={c.sel === HERO ? dotPulse : 0.9}
              hero={c.sel === HERO}
            />
          );
        })}
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
