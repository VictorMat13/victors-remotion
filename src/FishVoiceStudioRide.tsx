import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

const VOICE_SRC = "fish-audio/we-thought-the-campaign.mp3";
const AUDIO_FRAMES = 199; // 6.609s @ 30fps
export const DURATION_IN_FRAMES = 212;

// -------------------------------------------------------------------------
// White-Liam palette — green "alive" accent (same family as FishSpeaksAsItWrites)
// -------------------------------------------------------------------------
const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  cardBorder: "#efefe9",
  slate: "#64748B",
  green: "#16A34A",
  greenBright: "#22C55E",
  greenLite: "#86EFAC",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

// -------------------------------------------------------------------------
// World layout (world coords; viewport is 1080x1080)
// -------------------------------------------------------------------------
const RING_CX = 700;
const RING_CY = 660;
const RING_R = 180; // bar inner radius
const N_BARS = 56;

const STRIP_X = 1080;
const STRIP_Y = 950;
const STRIP_W = 700;
const STRIP_H = 320;
const RIB_X0 = STRIP_X + 40;
const RIB_X1 = STRIP_X + STRIP_W - 40;
const RIB_BASE = STRIP_Y + 240;
const RIB_RISE = 170;

const STEP = 2;

// -------------------------------------------------------------------------
// Camera — hold → move → hold, arrivals timed to the clip's real peaks
// (opening phrase 0-34 · reveal 52-92 · mid emotional cluster ~112-148 ·
//  final biggest peak lands ~168-178 during the wide settle)
// -------------------------------------------------------------------------
const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 34, 52, 92, 112, 148, 168, 198, 211];
const KEY_FX = [700, 700, 880, 880, 1420, 1420, 1067, 1067, 1067];
const KEY_FY = [660, 660, 700, 700, 1110, 1110, 775, 775, 775];
const KEY_Z = [1.6, 1.6, 1.05, 1.05, 1.3, 1.3, 0.66, 0.66, 0.66];

// ---- fish mark (whale = stacked audio bars), from FishAudioRevived ----
const FISH_BARS = [
  "m277.1 198c4.42 0 8 3.58 8 8v3.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-3.4c0-4.42 3.58-8 8-8z",
  "m310 200.7c4.42 0 8 3.58 8 8v14.7c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-14.7c0-4.42 3.58-8 8-8z",
  "m342.9 196.4c4.42 0 8 3.58 8 8v61.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-61.4c0-4.42 3.58-8 8-8z",
  "m375.9 190c4.42 0 8 3.58 8 8v4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-4c0-4.42 3.58-8 8-8z",
  "m375.9 243.4c4.42 0 8 3.58 8 8v42.3c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-42.3c0-4.42 3.58-8 8-8z",
  "m663.7 183.2c4.42 0 8 3.58 8 8v44.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-44.2c0-4.42 3.58-8 8-8z",
  "m631.9 176.1c4.42 0 8 3.58 8 8v59.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-59.4c0-4.42 3.58-8 8-8z",
  "m599.9 173c4.42 0 8 3.58 8 8v70.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-70.6c0-4.42 3.58-8 8-8z",
  "m567.9 175c4.42 0 8 3.58 8 8v71.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-71.8c0-4.42 3.58-8 8-8z",
  "m536.1 179.9c4.42 0 8 3.58 8 8v91.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-91.1c0-4.42 3.58-8 8-8z",
  "m503.5 188.2c4.42 0 8 3.58 8 8v104.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-104.1c0-4.42 3.58-8 8-8z",
  "m471.6 202.1c4.42 0 8 3.58 8 8v99.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-99.8c0-4.42 3.58-8 8-8z",
  "m439.6 220.4c4.42 0 8 3.58 8 8v86.2c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-86.2c0-4.42 3.58-8 8-8z",
  "m695.7 202.1c4.42 0 8 3.58 8 8v22c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-22c0-4.42 3.58-8 8-8z",
  "m407.6 233.1c4.42 0 8 3.58 8 8v84.8c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-84.8c0-4.42 3.58-8 8-8z",
  "m695.7 247.9c4.42 0 8 3.58 8 8v11.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-11.1c0-4.42 3.58-8 8-8z",
  "m663.7 254.6c4.42 0 8 3.58 8 8v31.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-31.4c0-4.42 3.58-8 8-8z",
  "m631.9 262.3c4.42 0 8 3.58 8 8v36.1c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-36.1c0-4.42 3.58-8 8-8z",
  "m599.9 268.7c4.42 0 8 3.58 8 8v35.6c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-35.6c0-4.42 3.58-8 8-8z",
  "m567.9 274.4c4.42 0 8 3.58 8 8v30c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-30c0-4.42 3.58-8 8-8z",
  "m536.1 297.3c4.42 0 8 3.58 8 8v5.4c0 4.42-3.58 8-8 8-4.42 0-8-3.58-8-8v-5.4c0-4.42 3.58-8 8-8z",
];

const FishMark: React.FC<{ color: string; width: number }> = ({
  color,
  width,
}) => (
  <svg
    viewBox="269.1 173 434.6 160.9"
    style={{ width, display: "block" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill={color}>
      {FISH_BARS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </svg>
);

const PitchIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    viewBox="0 0 40 40"
    style={{ width: 36, height: 36 }}
    fill="none"
    stroke={color}
    strokeWidth={3.2}
    strokeLinecap="round"
  >
    <path d="M5 24 Q 10 8 15 22 T 25 20 Q 30 10 35 18" />
  </svg>
);

// =========================================================================
// Main
// =========================================================================
export const FishVoiceStudioRide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: VIEW_W, height: VIEW_H } = useVideoConfig();
  const audioData = useAudioData(staticFile(VOICE_SRC));

  if (!audioData) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }

  // ---- camera ----
  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });

  // ---- audio: current-frame spectrum for the ring ----
  const clampedFrame = Math.min(frame, AUDIO_FRAMES - 1);
  const fftNow = visualizeAudio({
    audioData,
    frame: clampedFrame,
    fps,
    numberOfSamples: 32,
  });

  // ---- audio: whole-clip loudness contour, normalized to its own peak ----
  const rawAll: number[] = [];
  for (let k = 0; k < AUDIO_FRAMES; k += STEP) {
    const fft = visualizeAudio({
      audioData,
      frame: k,
      fps,
      numberOfSamples: 32,
    });
    let s = 0;
    for (let b = 1; b <= 12; b++) s += fft[b];
    rawAll.push(s / 12);
  }
  const peakV = rawAll.reduce((m, v) => Math.max(m, v), 0.0001);
  const normAll = rawAll.map((v) => Math.pow(Math.min(1, v / peakV), 0.8));
  const smoothAll = normAll.map((v, i) => {
    const a = normAll[i - 1] ?? v;
    const b = normAll[i + 1] ?? v;
    return (a + v * 2 + b) / 4;
  });
  const amp = smoothAll.slice(0, Math.floor(clampedFrame / STEP) + 1);
  const nowA = amp[amp.length - 1] ?? 0;

  // detected peaks (local maxima, spaced, loud)
  const peaks: { i: number; a: number }[] = [];
  for (let i = 2; i < smoothAll.length - 2; i++) {
    if (
      smoothAll[i] > 0.55 &&
      smoothAll[i] >= smoothAll[i - 1] &&
      smoothAll[i] >= smoothAll[i + 1] &&
      smoothAll[i] > smoothAll[i - 2] &&
      smoothAll[i] > smoothAll[i + 2] &&
      (peaks.length === 0 || i - peaks[peaks.length - 1].i > 12)
    ) {
      peaks.push({ i, a: smoothAll[i] });
    }
  }
  const passedPeaks = peaks.filter((p) => p.i * STEP <= clampedFrame);

  // ring ripple flares on passed peaks
  const flares = passedPeaks.slice(-3);

  // ribbon paths
  const xOf = (i: number) =>
    interpolate(i * STEP, [0, AUDIO_FRAMES - 1], [RIB_X0, RIB_X1]);
  const topOf = (a: number) => RIB_BASE - a * RIB_RISE;
  let ribbon = "";
  if (amp.length > 1) {
    const tops = amp.map(
      (a, i) => `${xOf(i).toFixed(1)} ${topOf(a).toFixed(1)}`,
    );
    const bots = amp
      .map(
        (a, i) => `${xOf(i).toFixed(1)} ${(topOf(a) + 7 + 16 * a).toFixed(1)}`,
      )
      .reverse();
    ribbon = `M ${tops.join(" L ")} L ${bots.join(" L ")} Z`;
  }
  const headX = xOf(amp.length - 1);
  const headY = topOf(nowA);

  // running pitch-range readout
  const maxA = amp.reduce((m, v) => Math.max(m, v), 0);
  const hz = Math.round(maxA * 185);

  // entrances
  const discS = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 110 },
  });
  const stripS = spring({
    frame: frame - 40,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const pillS = spring({
    frame: frame - 152,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const livePulse = 0.5 + 0.5 * Math.sin(frame / 4);
  const eyebrow = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.paper }}>
      <Audio src={staticFile(VOICE_SRC)} />

      {/* fixed background — paper + green glow + masked grid (full-bleed) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(940px 760px at 50% 48%, rgba(22,163,74,0.07), rgba(22,163,74,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(32,21,21,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.028) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          WebkitMaskImage:
            "radial-gradient(860px 720px at 50% 50%, #000 42%, transparent 86%)",
          maskImage:
            "radial-gradient(860px 720px at 50% 50%, #000 42%, transparent 86%)",
        }}
      />

      {/* ================= WORLD (camera-transformed) ================= */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---- spectrum ring ---- */}
        <svg
          viewBox="0 0 2000 1400"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 2000,
            height: 1400,
          }}
        >
          {/* peak flares */}
          {flares.map((p) => {
            const born = p.i * STEP;
            const s = spring({
              frame: frame - born,
              fps,
              config: { damping: 15, stiffness: 90 },
            });
            return (
              <circle
                key={p.i}
                cx={RING_CX}
                cy={RING_CY}
                r={RING_R + 20 + 150 * s}
                fill="none"
                stroke={COLORS.greenLite}
                strokeWidth={4}
                opacity={0.8 * (1 - s)}
              />
            );
          })}
          {/* radial bars — mirrored FFT bands, live */}
          {Array.from({ length: N_BARS }).map((_, i) => {
            const angle = (i / N_BARS) * Math.PI * 2 - Math.PI / 2;
            const m = i <= N_BARS / 2 ? i : N_BARS - i;
            const bin = 1 + Math.round((m / (N_BARS / 2)) * 12);
            const v = Math.pow(Math.min(1, (fftNow[bin] / peakV) * 0.9), 0.8);
            const len = (26 + 140 * v) * discS;
            const x1 = RING_CX + Math.cos(angle) * RING_R;
            const y1 = RING_CY + Math.sin(angle) * RING_R;
            const x2 = RING_CX + Math.cos(angle) * (RING_R + len);
            const y2 = RING_CY + Math.sin(angle) * (RING_R + len);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={v > 0.55 ? COLORS.greenBright : COLORS.green}
                strokeOpacity={0.35 + 0.65 * v}
                strokeWidth={10}
                strokeLinecap="round"
              />
            );
          })}
          {/* ribbon (drawn under strip chrome) */}
          <line
            x1={RIB_X0}
            y1={RIB_BASE}
            x2={RIB_X1}
            y2={RIB_BASE}
            stroke={COLORS.slate}
            strokeOpacity={0.4 * stripS}
            strokeWidth={3}
            strokeDasharray="3 14"
            strokeLinecap="round"
          />
          {passedPeaks.map((p) => {
            const born = p.i * STEP;
            const s = spring({
              frame: frame - born,
              fps,
              config: { damping: 16, stiffness: 120 },
            });
            return (
              <circle
                key={`r${p.i}`}
                cx={xOf(p.i)}
                cy={topOf(p.a)}
                r={12 + 22 * s}
                fill="none"
                stroke={COLORS.greenLite}
                strokeWidth={3}
                opacity={0.85 * (1 - s * 0.75) * stripS}
              />
            );
          })}
          {ribbon ? (
            <path
              d={ribbon}
              fill={COLORS.green}
              opacity={stripS}
              style={{ filter: "drop-shadow(0 4px 14px rgba(34,197,94,0.45))" }}
            />
          ) : null}
          {frame >= 2 ? (
            <>
              <circle
                cx={headX}
                cy={headY}
                r={13 + 8 * nowA}
                fill="rgba(34,197,94,0.22)"
                opacity={stripS}
              />
              <circle
                cx={headX}
                cy={headY}
                r={8}
                fill={COLORS.greenBright}
                opacity={stripS}
                style={{ filter: "drop-shadow(0 0 9px rgba(34,197,94,0.8))" }}
              />
            </>
          ) : null}
        </svg>

        {/* ---- center disc + fish mark ---- */}
        <div
          style={{
            position: "absolute",
            left: RING_CX - 150,
            top: RING_CY - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: `0 24px 60px rgba(18,24,40,0.12), 0 0 ${30 + 60 * nowA}px rgba(34,197,94,${0.12 + 0.25 * nowA})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${discS * (1 + 0.035 * nowA)})`,
          }}
        >
          <FishMark color={COLORS.green} width={190} />
        </div>

        {/* ---- contour strip card (behind the svg ribbon area) ---- */}
        <div
          style={{
            position: "absolute",
            left: STRIP_X,
            top: STRIP_Y,
            width: STRIP_W,
            height: STRIP_H,
            borderRadius: 32,
            background: "#ffffff",
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow:
              "0 30px 70px rgba(18,24,40,0.10), 0 3px 8px rgba(18,24,40,0.05)",
            opacity: stripS,
            transform: `translateY(${(1 - stripS) * 26}px)`,
            zIndex: -1,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 34,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 3,
              color: COLORS.muted,
              textTransform: "uppercase",
            }}
          >
            Pitch
          </div>
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 28,
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 14px",
              borderRadius: 999,
              background: COLORS.greenBg,
              border: `1.5px solid ${COLORS.greenBorder}`,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS.greenBright,
                opacity: 0.55 + 0.45 * livePulse,
                boxShadow: `0 0 ${3 + 5 * livePulse}px ${COLORS.greenBright}`,
              }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: 21,
                color: COLORS.green,
                letterSpacing: 1,
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* ---- pitch-range pill (arrives on the wide pull-out) ---- */}
        <div
          style={{
            position: "absolute",
            left: 1290,
            top: 300,
            width: 470,
            height: 100,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 28px",
            borderRadius: 24,
            background: COLORS.greenBg,
            border: `2px solid ${COLORS.greenBorder}`,
            boxShadow:
              "0 18px 44px rgba(22,163,74,0.10), 0 2px 6px rgba(18,24,40,0.04)",
            opacity: interpolate(pillS, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(pillS, [0, 1], [22, 0])}px) scale(${interpolate(pillS, [0, 1], [0.9, 1])})`,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "#fff",
              border: `1.5px solid ${COLORS.greenBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PitchIcon color={COLORS.green} />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 34,
              color: COLORS.ink,
              letterSpacing: -0.5,
              flex: 1,
            }}
          >
            Pitch range
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 34,
              color: COLORS.green,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ±{hz} Hz
          </div>
        </div>
      </div>

      {/* fixed chrome — eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 62,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          opacity: eyebrow,
        }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            background: COLORS.green,
            transform: "rotate(45deg)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 6,
            color: COLORS.green,
            textTransform: "uppercase",
          }}
        >
          Fish Audio
        </div>
      </div>
    </AbsoluteFill>
  );
};
