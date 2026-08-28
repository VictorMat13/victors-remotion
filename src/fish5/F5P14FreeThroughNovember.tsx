// Fish Audio 5 — F5P14FreeThroughNovember (1080x1080)
// VO: And the API is free for developers through November.
// Beat map: open on the cream curl card (fish4 curl-card language: header,
// dashed divider, the REAL curl from theme API.curl, orange string accents) →
// camera pushes to the `-H "model: s2.1-pro-free"` line, purple highlight
// draws behind it → pull out; the real model-picker "Free" pill + a NOV
// calendar chip land beside the highlighted line, FishChip lands
// bottom-center → settle on two nearly-identical camera keys.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ALTARI, API, FISH, FISH_UI, SPRINGS } from "./theme";
import { AltariBackdrop, CreamCard, FishChip } from "./board";

const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
});

export const DURATION_IN_FRAMES = 135;

const W = 1080;
const H = 1080;

const sansFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Syntax accents sampled from the approved fish4 curl-card reference
const CODE_ORANGE = "#C5812F";
const INK = ALTARI.creamInk;

// "Free" pill colors sampled from the real model picker
// (public/fish5/site/app-tts-emotion-tag.png)
const PILL_BG = "#E9E8FC";
const PILL_TEXT = "#5560DD";

// ---------------------------------------------------------------------------
// Card geometry (world coords). Card spans the safe width: x 60 → 1020.
// ---------------------------------------------------------------------------
const CARD_X = 60;
const CARD_Y = 140;
const CARD_W = 960;
const PAD_X = 54;
const PAD_TOP = 46;
const HEADER_H = 48;
const DIV_TOP = PAD_TOP + HEADER_H + 30; // 124
const CODE_TOP = DIV_TOP + 2 + 34; // 160
const CODE_FS = 28; // ≥26 readable mono
const LINE_H = 46;
const CH = CODE_FS * 0.6; // JetBrains Mono advance = 0.6em
const CARD_H = CODE_TOP + API.curl.length * LINE_H + 44; // 526

// Highlight box behind `-H "model: s2.1-pro-free"` (card-local coords).
const MODEL_LINE_I = 4;
const MODEL_CORE = API.curl[MODEL_LINE_I].trim().replace(/ \\$/, ""); // -H "model: s2.1-pro-free"
const HL_X = PAD_X + 2 * CH - 12;
const HL_Y = CODE_TOP + MODEL_LINE_I * LINE_H - 4;
const HL_W = MODEL_CORE.length * CH + 24;
const HL_H = LINE_H + 8;
// World-space camera target on the highlighted line
const HL_WCX = CARD_X + HL_X + HL_W / 2; // ≈ 358
const HL_WCY = CARD_Y + HL_Y + HL_H / 2; // ≈ 507

// Landing spots beside the highlighted line (card-local centers)
const LINE_CY = HL_Y + HL_H / 2;
const FREE_CX = 608;
const NOV_CX = 762;
const NOV_SIZE = 96;
// NOV chip rides 26px high so its resting box clears every curl glyph
// (model line text ends at x≈541 local; Content-Type at 709; -d starts y 390).
const NOV_CY = LINE_CY - 26;

// FishChip landing spot (world)
const CHIP_X = 540;
const CHIP_Y = 860;

// ---------------------------------------------------------------------------
// Split a curl line into quoted (orange) / plain (ink) segments — verbatim.
// ---------------------------------------------------------------------------
type Seg = { t: string; q: boolean };
const splitQuotes = (line: string): Seg[] => {
  const re = /("[^"]*"|'[^']*')/g;
  const out: Seg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), q: false });
    out.push({ t: m[0], q: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ t: line.slice(last), q: false });
  return out;
};
const CURL_SEGS = API.curl.map(splitQuotes);

// Deterministic star field (world coords, behind the card)
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const buildStars = () => {
  const rnd = mulberry32(51425);
  return Array.from({ length: 26 }).map(() => ({
    x: 30 + rnd() * 1020,
    y: 20 + rnd() * 1030,
    r: 0.9 + rnd() * 1.6,
    o: 0.1 + rnd() * 0.24,
    ph: rnd() * Math.PI * 2,
  }));
};

export const F5P14FreeThroughNovember: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // -------------------------------------------------------------------------
  // Camera — hold → 16f push to the model line → hold → 14f pull-out →
  // hold → two nearly-identical final keys.
  // -------------------------------------------------------------------------
  const KEY_T = [0, 12, 35, 51, 70, 84, 108, 121, 134];
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = interpolate(
    frame,
    KEY_T,
    [540, 540, 540, HL_WCX, HL_WCX, 540, 540, 540, 540],
    camOpts,
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [400, 400, 400, HL_WCY, HL_WCY, 540, 540, 540, 541],
    camOpts,
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.22, 1.22, 1.22, 2.0, 2.0, 1.0, 1.0, 1.0, 1.006],
    camOpts,
  );

  const stars = React.useMemo(buildStars, []);

  // Micro-motion: gentle float on the card group and the chip
  const cardFloat = 4 * Math.sin(frame * 0.045);
  const chipFloat = 3 * Math.sin(frame * 0.05 + 2.1);

  // Opening light sweep across the code block (micro-motion during the hold)
  const sweepX = interpolate(frame, [4, 28], [-240, CARD_W + 60], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepO = interpolate(frame, [4, 10, 24, 30], [0, 0.09, 0.09, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight draw (f53–65, during the tight hold on the model line)
  const hlDraw = interpolate(frame, [53, 65], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hlPulse = 0.82 + 0.18 * Math.sin((frame - 65) * 0.16);
  const hlOpacity = frame < 53 ? 0 : hlDraw < 1 ? 1 : Math.max(0.85, hlPulse);

  // Landings: Free pill f84 → NOV chip f91 → FishChip f99
  const LAND = { damping: 15, stiffness: 190 };
  const landIn = (start: number) =>
    spring({ frame: frame - start, fps, config: LAND, durationInFrames: 24 });
  const freeIn = landIn(84);
  const novIn = landIn(91);
  const chipIn = spring({
    frame: frame - 99,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 26,
  });

  const landGlow = (start: number) =>
    interpolate(frame, [start + 3, start + 22], [0.5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const freeGlow = frame >= 84 ? landGlow(84) : 0;
  const novGlow = frame >= 91 ? landGlow(91) : 0;

  // Post-landing bobs (only once settled)
  const settledBob = (inV: number, ph: number) =>
    inV >= 0.98 ? 2 * Math.sin(frame * 0.07 + ph) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      {/* Fixed full-frame backdrop — does NOT move with the camera */}
      <AltariBackdrop width={W} height={H} />

      {/* ------------------------- WORLD (camera rig) ---------------------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${W / 2 - fx}px, ${H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* parallax stars */}
        <svg
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          width={1}
          height={1}
        >
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={ALTARI.primaryLight}
              opacity={s.o * (0.65 + 0.35 * Math.sin(frame * 0.04 + s.ph))}
            />
          ))}
        </svg>

        {/* ---------------- cream curl card (floats as one group) --------- */}
        <div style={{ position: "absolute", left: 0, top: cardFloat }}>
          <CreamCard x={CARD_X} y={CARD_Y} w={CARD_W} h={CARD_H}>
            {/* header — fish4 curl-card language */}
            <div
              style={{
                position: "absolute",
                left: PAD_X,
                top: PAD_TOP,
                fontFamily: monoFamily,
                fontWeight: 500,
                fontSize: 40,
                lineHeight: `${HEADER_H}px`,
                letterSpacing: 9,
                color: INK,
                whiteSpace: "nowrap",
              }}
            >
              CURL · TEXT TO SPEECH
            </div>

            {/* dashed divider */}
            <div
              style={{
                position: "absolute",
                left: PAD_X,
                right: PAD_X,
                top: DIV_TOP,
                borderTop: "2px dashed rgba(31, 31, 51, 0.25)",
              }}
            />

            {/* the REAL curl — theme API.curl verbatim */}
            {CURL_SEGS.map((segs, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: PAD_X,
                  top: CODE_TOP + i * LINE_H,
                  fontFamily: monoFamily,
                  fontWeight: 400,
                  fontSize: CODE_FS,
                  lineHeight: `${LINE_H}px`,
                  whiteSpace: "pre",
                }}
              >
                {segs.map((s, j) => (
                  <span key={j} style={{ color: s.q ? CODE_ORANGE : INK }}>
                    {s.t}
                  </span>
                ))}
              </div>
            ))}

            {/* light sweep over the code (opening micro-motion) */}
            <div
              style={{
                position: "absolute",
                left: sweepX,
                top: CODE_TOP - 12,
                width: 210,
                height: API.curl.length * LINE_H + 24,
                background:
                  "linear-gradient(100deg, rgba(91,94,194,0) 0%, rgba(91,94,194,0.9) 50%, rgba(91,94,194,0) 100%)",
                opacity: sweepO,
              }}
            />

            {/* purple highlight drawn behind/around the model line */}
            <svg
              style={{ position: "absolute", left: 0, top: 0 }}
              width={CARD_W}
              height={CARD_H}
            >
              <rect
                x={HL_X}
                y={HL_Y}
                width={HL_W}
                height={HL_H}
                rx={10}
                fill="rgba(123, 125, 214, 0.12)"
                opacity={hlDraw}
              />
              <rect
                x={HL_X}
                y={HL_Y}
                width={HL_W}
                height={HL_H}
                rx={10}
                fill="none"
                stroke={ALTARI.primaryLight}
                strokeWidth={2.4}
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 * (1 - hlDraw)}
                opacity={hlOpacity}
                style={{
                  filter: `drop-shadow(0 0 6px ${ALTARI.primaryLight})`,
                }}
              />
            </svg>

            {/* landing glows */}
            {freeGlow > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: FREE_CX - 90,
                  top: LINE_CY - 90,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(123,125,214,0.55) 0%, rgba(123,125,214,0) 70%)",
                  opacity: freeGlow,
                }}
              />
            )}
            {novGlow > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: NOV_CX - 95,
                  top: NOV_CY - 95,
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255,79,0,0.35) 0%, rgba(255,79,0,0) 70%)",
                  opacity: novGlow,
                }}
              />
            )}

            {/* "Free" pill — styled like the real model-picker pill */}
            <div
              style={{
                position: "absolute",
                left: FREE_CX,
                top: LINE_CY + settledBob(freeIn, 0.4),
                transform: `translate(-50%, -50%) scale(${1.45 - 0.45 * freeIn})`,
                opacity: Math.min(1, freeIn * 2.2),
                padding: "9px 24px",
                borderRadius: 999,
                backgroundColor: PILL_BG,
                boxShadow: "0 12px 26px rgba(0, 0, 0, 0.22)",
                fontFamily: sansFamily,
                fontWeight: 600,
                fontSize: 27,
                color: PILL_TEXT,
                whiteSpace: "nowrap",
              }}
            >
              {FISH_UI.modelFreePill}
            </div>

            {/* NOV mini-calendar chip */}
            <div
              style={{
                position: "absolute",
                left: NOV_CX - NOV_SIZE / 2,
                top: NOV_CY - NOV_SIZE / 2 + settledBob(novIn, 1.7),
                width: NOV_SIZE,
                height: NOV_SIZE,
                borderRadius: 18,
                backgroundColor: "#FDFBF7",
                border: "1px solid rgba(31, 31, 51, 0.12)",
                boxShadow: "0 14px 30px rgba(0, 0, 0, 0.26)",
                overflow: "hidden",
                transform: `scale(${1.45 - 0.45 * novIn}) rotate(${
                  (1 - novIn) * -8 - 3
                }deg)`,
                opacity: Math.min(1, novIn * 2.2),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: 30,
                  backgroundColor: FISH.orange,
                }}
              />
              {/* binder rings */}
              {[28, NOV_SIZE - 28].map((rx) => (
                <div
                  key={rx}
                  style={{
                    position: "absolute",
                    left: rx - 4,
                    top: 8,
                    width: 8,
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 30,
                  width: "100%",
                  height: NOV_SIZE - 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: sansFamily,
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: 2,
                  color: INK,
                }}
              >
                NOV
              </div>
            </div>
          </CreamCard>
        </div>

        {/* FishChip lands bottom-center */}
        <FishChip
          x={CHIP_X}
          y={CHIP_Y + (1 - chipIn) * 36 + chipFloat}
          enter={Math.min(1, chipIn * 1.6)}
          scale={1.12}
        />
      </div>
    </AbsoluteFill>
  );
};
