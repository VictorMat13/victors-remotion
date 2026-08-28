// Fish Audio 5 — F5P09CutTheDeckInHalf (1080x1920 @ 30fps, 165 frames)
// VO (editor voice): "And cut the deck in half. The pitch is doing too much
// talking."
//
// Advisor-voice reply system (same grammar as P02/P08/P10):
//   f0-25    editor PortraitOrb enters top-center, breathing.
//   f18-74   cream TTS-editor fragment (app-tts-emotion-tag.png DNA);
//            VOICE_INPUTS.editor1 typewrites — bracketed tag renders as a
//            warm-tan pill (editor accent, darkened to read on cream).
//   f78      "Generate Speech ⌘↵" press: dip + ripple + orange playing dot.
//   f80-165  orb speak-glow ramps, WaveBars live in the editor cream accent.
//   f96-140  supporting fragment: 12 tiny blank slide thumbnails stagger in;
//            at f114 a slice line cuts the deck — the right 6 shear away and
//            the surviving 6 recenter. No text; the cut IS the point.
//   f30      VoicePill (screen space, y 1620) — series-mandated.
// Camera: slow push 1.0→1.06, micro settle at the Generate press, 25-frame
// end hold (two identical keys).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { envelope as voiceEnvelope } from "./envelopes/p09-editor-deck";
import {
  ADVISORS,
  ALTARI,
  FISH,
  FISH_UI,
  SPRINGS,
  VOICE_INPUTS,
} from "./theme";
import {
  AltariBackdrop,
  CreamCard,
  PortraitOrb,
  VoicePill,
  AudioWaveBars,
} from "./board";

const { fontFamily: manrope } = loadManrope("normal", {
  weights: ["500", "600", "700", "800"],
});

export const DURATION_IN_FRAMES = 261;

const VIEW_W = 1080;
const VIEW_H = 1920;

// ---- Part-specific knobs
const ADVISOR = "editor" as const;
const INPUT = VOICE_INPUTS.editor1;
const TAG_INK = "#7A6C48"; // editor cream accent, darkened to read on cream
const TAG_BG = "rgba(122, 108, 72, 0.12)";
const TAG_BORDER = "rgba(122, 108, 72, 0.30)";

// Timing
const CARD_AT = 18;
const TYPE_START = 26;
const TYPE_END = 70;
const GEN_AT = 78;

// Final Fish Audio line baked in (S2.1 Pro). The waveform below is driven
// by this file's real FFT data, so the bars match what is actually heard.
const VOICE_SRC = "fish5/voice/p09-editor-deck.mp3";
const AUDIO_AT = 82; // voice starts just after the Generate press
const PILL_AT = 30;
const THUMBS_AT = 88;
const CUT_AT = 118;

// Layout (world coords)
const ORB = { x: 540, y: 560, size: 360 };
const CARD = { x: 90, y: 770, w: 900, h: 525 };
const FIELD_H = 320;
const WAVE = { y: 1346, w: 560, h: 96 };

// Deck: 12 thumbs, 58x38, gap 10 → row 806 wide, centered.
const THUMB_W = 58;
const THUMB_H = 38;
const THUMB_GAP = 10;
const THUMB_N = 12;
const ROW_TOP = 1462;
const ROW_START =
  540 - (THUMB_N * THUMB_W + (THUMB_N - 1) * THUMB_GAP) / 2; // 137
const RECENTER =
  ROW_START - (540 - (6 * THUMB_W + 5 * THUMB_GAP) / 2); // -204 → shift +204

const ease = Easing.inOut(Easing.cubic);
const accent = ADVISORS[ADVISOR].accent;

const SEGS = INPUT.split(/(\[[^\]]*\])/)
  .filter(Boolean)
  .map((text) => ({ text, tag: text.startsWith("[") }));

export const F5P09CutTheDeckInHalf: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Real audio -> waveform ---------------------------------------------
  // Amplitude envelope baked from the rendered voice line, so every bar height
  // is the actual loudness at that moment of speech.
  const ENV = voiceEnvelope;
  const voiceT = frame >= AUDIO_AT ? (frame - AUDIO_AT) / fps : null;

  // ---- Camera ------------------------------------------------------------
  const KEY_T = [0, GEN_AT, GEN_AT + 18, 140, DURATION_IN_FRAMES];
  const fx = 540;
  const fy = interpolate(frame, KEY_T, [925, 955, 990, 990, 990], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, [1.0, 1.035, 1.06, 1.06, 1.06], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Orb ---------------------------------------------------------------
  const orbIn = spring({ frame, fps, config: SPRINGS.smooth });
  const breath = 1 + 0.012 * Math.sin(frame * 0.09);
  const speakRamp = interpolate(frame, [GEN_AT + 2, GEN_AT + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idleGlow = 0.12 + 0.06 * Math.sin(frame * 0.11);
  const speak =
    idleGlow * (1 - speakRamp) +
    speakRamp * (0.78 + 0.22 * Math.sin(frame * 0.52));

  // ---- Editor card + typewriter ------------------------------------------
  const cardIn = spring({ frame: frame - CARD_AT, fps, config: SPRINGS.smooth });
  const typedCount = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, INPUT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const caretOn = typedCount < INPUT.length ? true : frame % 16 < 8;

  // ---- Generate press ----------------------------------------------------
  const pressDip = interpolate(frame, [GEN_AT, GEN_AT + 3, GEN_AT + 9], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleT = (frame - GEN_AT) / 20;
  const playDot = spring({
    frame: frame - (GEN_AT + 4),
    fps,
    config: SPRINGS.snappy,
  });
  const dotPulse = 0.7 + 0.3 * Math.sin(frame * 0.5);

  // ---- Wave bars ---------------------------------------------------------
  const waveOpacity = interpolate(
    frame,
    [36, 48, GEN_AT + 2, GEN_AT + 12],
    [0, 0.45, 0.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const waveLevel = interpolate(frame, [GEN_AT + 4, GEN_AT + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Deck fragment -----------------------------------------------------
  const sliceDraw = interpolate(frame, [CUT_AT - 3, CUT_AT + 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sliceFade = interpolate(frame, [CUT_AT + 4, CUT_AT + 16], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shift =
    interpolate(frame, [CUT_AT + 6, CUT_AT + 22], [0, 1], {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * -RECENTER;

  // ---- VoicePill ---------------------------------------------------------
  const pillIn = interpolate(frame, [PILL_AT, PILL_AT + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let used = 0;
  const typedRuns = SEGS.map((seg, i) => {
    const start = used;
    used += seg.text.length;
    const visible = Math.max(0, Math.min(seg.text.length, typedCount - start));
    if (visible <= 0) return null;
    const t = seg.text.slice(0, visible);
    return seg.tag ? (
      <span
        key={i}
        style={{
          backgroundColor: TAG_BG,
          border: `1px solid ${TAG_BORDER}`,
          color: TAG_INK,
          fontWeight: 600,
          borderRadius: 10,
          padding: "2px 10px",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {t}
      </span>
    ) : (
      <span key={i} style={{ color: ALTARI.creamInk, fontWeight: 500 }}>
        {t}
      </span>
    );
  });

  // Thumbnails
  const thumbs = [...Array(THUMB_N)].map((_, i) => {
    const enter = spring({
      frame: frame - (THUMBS_AT + i * 1.6),
      fps,
      config: SPRINGS.snappy,
    });
    if (enter < 0.01) return null;
    const cut = i >= 6;
    const d = cut ? (i - 6) * 1.5 : 0;
    const cutP = cut
      ? interpolate(frame, [CUT_AT + d, CUT_AT + d + 10], [0, 1], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
    if (cutP >= 1) return null;
    const x = ROW_START + i * (THUMB_W + THUMB_GAP) + (cut ? 0 : shift);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: ROW_TOP,
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: 6,
          backgroundColor: ALTARI.card2,
          border: "1px solid #4A4A78",
          boxSizing: "border-box",
          padding: "6px 7px",
          opacity: Math.min(1, enter * 1.4) * (1 - cutP),
          transform: `scale(${0.6 + 0.4 * enter}) translate(${cutP * 30}px, ${cutP * 18}px) rotate(${cutP * 8}deg)`,
        }}
      >
        <div
          style={{
            width: "62%",
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(165,167,217,0.5)",
          }}
        />
        <div
          style={{
            marginTop: 5,
            width: "88%",
            height: 3,
            borderRadius: 2,
            backgroundColor: "rgba(165,167,217,0.28)",
          }}
        />
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg }}>
      <AltariBackdrop width={VIEW_W} height={VIEW_H} />

      {/* ---- Camera world ---- */}
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
        <PortraitOrb
          advisor={ADVISOR}
          x={ORB.x}
          y={ORB.y}
          size={ORB.size * breath}
          enter={orbIn}
          speak={speak}
        />

        {/* ---- Cream TTS editor fragment ---- */}
        {cardIn > 0.01 && (
          <CreamCard x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} enter={cardIn}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "26px 32px",
                boxSizing: "border-box",
                fontFamily: manrope,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", height: 50 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 5px)",
                    gap: 4,
                    marginRight: 18,
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: "rgba(31,31,51,0.22)",
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    overflow: "hidden",
                    border: `3px solid ${accent}`,
                    flexShrink: 0,
                  }}
                >
                  <Img
                    src={staticFile(ADVISORS[ADVISOR].portrait)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 26,
                    color: "rgba(31,31,51,0.45)",
                  }}
                >
                  ▾
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 600,
                    color: "rgba(31,31,51,0.72)",
                  }}
                >
                  {FISH_UI.modelPicker}
                </span>
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#4A4DB0",
                    backgroundColor: "rgba(91,94,194,0.14)",
                    borderRadius: 8,
                    padding: "3px 12px",
                  }}
                >
                  {FISH_UI.modelFreePill}
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  marginTop: 20,
                  height: FIELD_H,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(31,31,51,0.09)",
                  borderRadius: 20,
                  padding: "24px 26px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: 34, lineHeight: "50px" }}>
                  {typedRuns}
                  <span
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: 36,
                      marginLeft: 3,
                      verticalAlign: "-6px",
                      backgroundColor: ALTARI.creamInk,
                      opacity: caretOn ? 0.85 : 0,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 26,
                    bottom: 20,
                    display: "flex",
                    gap: 14,
                  }}
                >
                  {[`${FISH_UI.tagsBtn} ›`, `✦ ${FISH_UI.autoTag}`].map((b) => (
                    <div
                      key={b}
                      style={{
                        border: "1px solid rgba(31,31,51,0.14)",
                        backgroundColor: "#FFFFFF",
                        borderRadius: 12,
                        padding: "8px 20px",
                        fontSize: 30,
                        fontWeight: 600,
                        color: "rgba(31,31,51,0.68)",
                      }}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 600,
                    color: "rgba(31,31,51,0.42)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {typedCount} {FISH_UI.charCounter}
                </span>
                <div style={{ flex: 1 }} />
                <div style={{ position: "relative" }}>
                  {rippleT > 0 && rippleT < 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 60 + rippleT * 170,
                        height: 60 + rippleT * 170,
                        transform: "translate(-50%, -50%)",
                        borderRadius: 999,
                        border: `3px solid ${accent}`,
                        opacity: 0.7 * (1 - rippleT),
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: "#151527",
                      borderRadius: 14,
                      padding: "16px 28px",
                      transform: `scale(${1 - pressDip * 0.06})`,
                      boxShadow:
                        frame >= GEN_AT
                          ? `0 0 ${22 * playDot}px ${ADVISORS[ADVISOR].accentSoft}`
                          : "0 6px 18px rgba(31,31,51,0.18)",
                    }}
                  >
                    {playDot > 0.01 && (
                      <div
                        style={{
                          width: 16 * playDot,
                          height: 16 * playDot,
                          borderRadius: 999,
                          backgroundColor: FISH.orange,
                          opacity: dotPulse,
                        }}
                      />
                    )}
                    <span
                      style={{ fontSize: 32, fontWeight: 700, color: "#FFFFFF" }}
                    >
                      {FISH_UI.generateBtn}
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      ⌘↵
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CreamCard>
        )}

        {/* ---- Wave bars in the editor accent ---- */}
        {waveOpacity > 0.001 && (
          <div style={{ position: "absolute", inset: 0, opacity: waveOpacity }}>
            <AudioWaveBars
              envelope={ENV}
              tSec={voiceT}
              frame={frame}
              x={540}
              y={WAVE.y}
              w={WAVE.w}
              h={WAVE.h}
              bars={24}
              color={accent}
              level={waveLevel}
              seed={9}
            />
          </div>
        )}

        {/* ---- Supporting fragment: the deck, cut in half ---- */}
        {thumbs}
        {sliceDraw > 0 && sliceFade > 0 && (
          <div
            style={{
              position: "absolute",
              left: 538,
              top: ROW_TOP - 14,
              width: 3,
              height: (THUMB_H + 28) * sliceDraw,
              borderRadius: 2,
              backgroundColor: accent,
              opacity: sliceFade,
              boxShadow: `0 0 14px ${ADVISORS[ADVISOR].accentSoft}`,
            }}
          />
        )}
      </div>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(140% 130% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,10,24,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      <VoicePill x={540} y={1620} enter={pillIn} />

      {/* The advisor's Fish Audio line (drives the bars above) */}
      <Sequence from={AUDIO_AT}>
        <Audio src={staticFile(VOICE_SRC)} />
      </Sequence>
    </AbsoluteFill>
  );
};
