import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_MONO, FONT_SANS, LW, RN, SHORTS, SPRINGS, safePadX } from "./theme";

// ============================================================================
// KsP3UsuallyIdHave — 1080x1080 @ 30fps · 275 frames (9.2s)
// VO (spoken, NEVER on screen): "Usually, I'd have to watch the whole video,
// find the best moments, cut them, caption them, write titles, and upload
// everything myself."
//
// THE PAIN BEAT. A video editing timeline, worked by hand, one slow step at a
// time. Nothing on screen names the six actions — the MECHANISM carries them:
//   watching   -> a playhead crawling across raw footage
//   finding    -> a scrub that hunts forward, back, forward, and settles on a
//                 waveform peak
//   cutting    -> the cursor dragging an out-handle for 24 slow frames, a blade
//                 flash, and a segment detaching into the lane below
//   captioning -> burned caption words popping onto the selected clip
//   titling    -> a focused field typed character by character, caret blinking
//   uploading  -> a bar that starts fast and then crawls to a dead stop at 62%,
//                 with three more files that have not even begun
//
// ONE CONTINUOUS WORLD (2560 x 1080), wider than the viewport, with a single
// keyframed camera travelling LEFT -> RIGHT along the timeline as the work
// accumulates (cinematic-camera doc). hold -> move -> hold, moves of 15-23f,
// Easing.inOut(Easing.cubic), and a settled 20-frame end hold.
//
// Deliberately SLOWER than the other parts: heavy springs on the cut segments,
// a 34-frame drag, long holds, and a viewport-fixed elapsed pill (styled after
// the amber credit pill in the approved Runable renders) climbing toward a full
// working day.
//
// REAL DATA ONLY: source timecodes, clip durations, an upload percentage, the
// elapsed clock, and the real Koen Short "Dog drives Lamborghini" (SHORTS[1] in
// theme.ts) as the burned caption, the typed title and the derived filename.
// Nothing invented; nothing restates the narration.
//
// SKIN: LIAM WHITE — LW.paper world, one floating LW.card editing surface with
// warm lane wells and white chips (the approved ref-01 / c-01 pattern), RN.amber
// as the only saturated accent, dark ONLY inside video frames and the single
// primary button.
// ============================================================================

export const DURATION_IN_FRAMES = 275;

/* ------------------------------------------------------------------ world */

const WORLD_W = 2560;
const WORLD_H = 1080;

// The editing surface — one long floating white card.
const P_X = 130;
const P_Y = 250;
const P_W = 2270;
const P_H = 660;

const IN_X0 = 160;
const IN_X1 = 2370;

// Ruler
const RUL_Y = 280;
const RUL_BASE = 330;
const TICK_X0 = 176;
const TICK_PITCH = 84;
const TICK_N = 25;
const STOPS = [
  { x: 176, t: "00:00" },
  { x: 596, t: "05:00" },
  { x: 1016, t: "10:00" },
  { x: 1436, t: "15:00" },
  { x: 1856, t: "20:00" },
];

// Lane A — the source footage strip
const A_Y = 344;
const A_H = 160;
const FR_Y = 358;
const FR_H = 78;
const FR_X0 = 176;
const FR_W = 138;
const FR_PITCH = 148;
const FR_N = 14;
const FR_X1 = FR_X0 + (FR_N - 1) * FR_PITCH + FR_W; // 2238
const WAVE_Y = 446;
const WAVE_H = 48;
const WAVE_MID = WAVE_Y + WAVE_H / 2;

// Lane B — the work that piles up
const B_Y = 520;
const B_H = 336;

// The four hand-made cuts. x0/x1 is the source range on the strip; the chip
// drops into lane B at exactly that x, so cause and artifact line up.
const CUTS = [
  { at: 78, x0: 530, x1: 690, dur: "0:14" },
  { at: 90, x0: 702, x1: 878, dur: "0:22" },
  { at: 102, x0: 896, x1: 1044, dur: "0:11" },
  { at: 114, x0: 1058, x1: 1210, dur: "0:19" },
];
const CHIP_Y = 546;
const CHIP_H = 158;
const THUMB_H = 100;

// Station: the clip being captioned
const CAP_X = 1280;
const CAP_Y = 540;
const CAP_W = 360;
const CAP_H = 216;

// Station: the title field
const TF_X = 1280;
const TF_Y = 772;
const TF_W = 440;
const TF_H = 70;

// Station: the upload
const UP_X = 1820;
const UP_Y = 546;
const UP_W = 380;
const UP_H = 154;
const BTN_W = 96;
const BTN_H = 44;
const QUEUE_Y = [714, 746, 778];
const QUEUE_H = 24;

// Real Short from the featured row — caption, title and filename all come from
// here. Channel switched to @BEHINDTHEACTION-2 (Victor, 2026-08-28); these titles
// are much longer than the previous channel's, so the title field now clips and
// scrolls like a real text input instead of letting the text escape its box.
const TITLE = SHORTS[1].title; // "How We Destroyed a Giant Castle with Pirate Cannons | Ai VFX"
const CAP_WORDS: { w: string; line: 0 | 1; at: number }[] = [
  { w: "GIANT", line: 0, at: 132 },
  { w: "CASTLE", line: 0, at: 139 },
  { w: "PIRATE CANNONS", line: 1, at: 147 },
];
const FILE_NAME = "giant-castle.mp4";

const AMBER_INK = "#B07430"; // deeper amber, legible at pill size

/* ------------------------------------------------------------------ maths */

const EASE = Easing.inOut(Easing.cubic);

const key = (
  frame: number,
  ts: number[],
  vs: number[],
  easing: (n: number) => number = EASE,
) =>
  interpolate(frame, ts, vs, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const ramp = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const hash = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Waveform envelope. The peaks sit exactly where the cuts land, so "finding the
// best moments" reads as scrubbing to the loud parts.
const PEAKS = [560, 790, 970, 1134, 1420, 1660, 1900, 2120];
const amp = (x: number) => {
  let v =
    0.2 +
    0.13 * Math.sin(x * 0.031) +
    0.09 * Math.sin(x * 0.017 + 1.3) +
    0.07 * Math.sin(x * 0.083 + 2.1);
  for (const p of PEAKS) {
    const d = (x - p) / 52;
    v += 0.74 * Math.exp(-d * d);
  }
  return Math.max(0.06, Math.min(1, v));
};

const clock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(
    s % 60,
  )}`;
};

/* ------------------------------------------------------------- primitives */

// Dark video frames — the only dark surfaces in this world, and only ever
// inside a card.
const filmFrame = (i: number): React.CSSProperties => {
  const l1 = 12 + Math.round(hash(i) * 16);
  const l2 = 26 + Math.round(hash(i + 31) * 22);
  const ang = Math.round(100 + hash(i + 77) * 120);
  return {
    background: `linear-gradient(${ang}deg, rgb(${l1},${l1 - 1},${Math.max(
      0,
      l1 - 3,
    )}) 0%, rgb(${l2},${l2 - 3},${l2 - 8}) 54%, rgb(${l1 + 8},${l1 + 5},${
      l1 + 1
    }) 100%)`,
  };
};

const Cursor: React.FC<{ x: number; y: number; opacity: number }> = ({
  x,
  y,
  opacity,
}) => (
  <svg
    width={21}
    height={33}
    viewBox="0 0 12 19"
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      filter: "drop-shadow(0 3px 5px rgba(23,20,14,0.3))",
    }}
  >
    <path
      d="M1 1 L1 16.6 L4.7 13.2 L7.1 18.5 L9.7 17.3 L7.3 12.1 L11.7 12.1 Z"
      fill="#FFFFFF"
      stroke="#141414"
      strokeWidth={1.15}
      strokeLinejoin="round"
    />
  </svg>
);

/* ------------------------------------------------------------------- comp */

export const KsP3UsuallyIdHave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ID Grotesk — Runable's real typeface, shared across this series.
  const [fontHandle] = useState(() => delayRender("KsP3 IDGrotesk"));
  useEffect(() => {
    const ID = "ksp3-idgrotesk-faces";
    if (!document.getElementById(ID)) {
      const el = document.createElement("style");
      el.id = ID;
      el.textContent = (
        [
          [300, "Light"],
          [350, "Book"],
          [400, "Regular"],
          [500, "Medium"],
          [700, "Bold"],
        ] as const
      )
        .map(
          ([w, f]) =>
            `@font-face{font-family:'IDGrotesk';font-weight:${w};font-style:normal;src:url('${staticFile(
              `bgrow/fonts/IDGrotesk-${f}.ttf`,
            )}') format('truetype');}`,
        )
        .join("\n");
      document.head.appendChild(el);
    }
    const done = () => continueRender(fontHandle);
    Promise.all([
      document.fonts.load('400 40px "IDGrotesk"'),
      document.fonts.load('500 40px "IDGrotesk"'),
      document.fonts.load('700 40px "IDGrotesk"'),
    ])
      .then(done)
      .catch(done);
  }, [fontHandle]);

  const SAFE = safePadX(width); // 54

  /* ------------------------------------------------------------- camera --
     hold -> move -> hold. Moves are 23/22/23/15f, every action lands inside a
     hold, and the last 20 frames are a dead-still editor hold. */
  // Final key is z0.66, not the 0.42 of the first pass. At 0.42 the whole
  // timeline collapsed into a band around y=430..710 and left ~430px of dead
  // paper above and ~370px below — an under-filled frame on a 1:1 canvas rather
  // than a deliberate wide. 0.66 fills the frame; the card is allowed to bleed
  // past the left/right edges, which reads as a timeline continuing offscreen.
  // Pull starts at f236 (was f250) so the end hold is ~25f for the editor.
  const KEY_T = [0, 45, 68, 120, 142, 195, 218, 236, 251, 275];
  const FX = [560, 560, 870, 870, 1500, 1500, 2010, 2010, 1265, 1265];
  const FY = [430, 430, 520, 520, 660, 660, 674, 674, 560, 560];
  const FZ = [2.4, 2.4, 1.32, 1.32, 1.8, 1.8, 1.4, 1.4, 0.66, 0.66];

  const fx = key(frame, KEY_T, FX);
  const fy = key(frame, KEY_T, FY);
  const fz = key(frame, KEY_T, FZ);

  /* ----------------------------------------------------------- playhead --
     Crawls. Hunts (f26-45: forward, back, forward) and settles on the peak at
     560, which becomes the in-point. Then it rides every cut handle. */
  const playX = key(
    frame,
    [
      0, 16, 26, 32, 38, 45, 48, 52, 76, 84, 90, 96, 102, 108, 114, 126, 142,
      158, 178, 195, 214, 230, 248, 275,
    ],
    [
      400, 452, 520, 494, 578, 560, 530, 590, 690, 730, 878, 920, 1044, 1090,
      1210, 1250, 1310, 1350, 1390, 1430, 1520, 1620, 1700, 1760,
    ],
  );

  /* ------------------------------------------------------------- cursor -- */
  const CU_T = [
    46, 52, 76, 82, 88, 94, 100, 106, 112, 122, 136, 154, 162, 190, 206, 220,
    236, 275,
  ];
  const easeCu = Easing.inOut(Easing.quad);
  const curX = key(
    frame,
    CU_T,
    [
      482, 590, 690, 730, 878, 920, 1044, 1090, 1210, 1280, 1500, 1400, 1570,
      1590, 1780, 2046, 2010, 2016,
    ],
    easeCu,
  );
  const curY = key(
    frame,
    CU_T,
    [
      440, 396, 396, 440, 396, 440, 396, 440, 396, 500, 660, 812, 868, 872, 780,
      578, 626, 620,
    ],
    easeCu,
  );
  const curOp = ramp(frame, 44, 54);

  /* -------------------------------------------------------- selection ----
     The in/out region on the strip. Cut 1 is dragged by hand for 24 slow
     frames (the out-handle IS the cursor). Cuts 2-4 snap in, faster and more
     mechanical — the grind setting in. */
  let sel: { x0: number; x1: number } | null = null;
  if (frame >= 48 && frame < 78) {
    sel = { x0: 530, x1: frame < 52 ? 590 : Math.min(690, Math.max(590, curX)) };
  } else if (frame >= 84 && frame < 90) sel = { x0: 702, x1: 878 };
  else if (frame >= 96 && frame < 102) sel = { x0: 896, x1: 1044 };
  else if (frame >= 108 && frame < 114) sel = { x0: 1058, x1: 1210 };

  /* --------------------------------------------------------- the upload -- */
  const pressed = frame >= 220 && frame < 229;
  const started = frame >= 222;
  const progress = started
    ? interpolate(frame, [222, 234, 248, 262, 275], [0, 0.34, 0.47, 0.56, 0.62], {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  /* ------------------------------------------------------------ elapsed -- */
  const elapsed = interpolate(frame, [0, DURATION_IN_FRAMES - 1], [640, 28140], {
    extrapolateRight: "clamp",
  });

  /* ------------------------------------------------------------- typing -- */
  const typed = TITLE.slice(
    0,
    Math.floor(
      interpolate(frame, [158, 192], [0, TITLE.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );
  const focused = frame >= 150 && frame < 202;
  const caretOn = frame < 192 ? true : frame % 30 < 17;

  /* -------------------------------------------------- how spent each cut -- */
  const spent = (x: number) => {
    let v = 0;
    for (const c of CUTS) {
      if (x >= c.x0 && x <= c.x1) v = Math.max(v, ramp(frame, c.at, c.at + 12));
    }
    return v;
  };

  /* -------------------------------------------------------------- strip -- */
  const frames: React.ReactNode[] = [];
  for (let i = 0; i < FR_N; i++) {
    const x = FR_X0 + i * FR_PITCH;
    frames.push(
      <div
        key={`f${i}`}
        style={{
          position: "absolute",
          left: x,
          top: FR_Y,
          width: FR_W,
          height: FR_H,
          borderRadius: 6,
          opacity: 1 - spent(x + FR_W / 2) * 0.22,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          ...filmFrame(i),
        }}
      />,
    );
  }

  const bars: React.ReactNode[] = [];
  for (let x = FR_X0; x <= FR_X1 - 3; x += 7) {
    const near = Math.abs(x - playX) < 26;
    const h = 4 + amp(x) * 42;
    bars.push(
      <div
        key={`w${x}`}
        style={{
          position: "absolute",
          left: x,
          top: WAVE_MID - h / 2,
          width: 3,
          height: h,
          borderRadius: 2,
          background: near ? RN.amber : "rgba(20,16,10,0.24)",
          opacity: near ? 1 : 1 - spent(x) * 0.6,
        }}
      />,
    );
  }

  /* --------------------------------------------------------------- world */
  return (
    <AbsoluteFill
      style={{
        backgroundColor: LW.paper,
        fontFamily: FONT_SANS,
        overflow: "hidden",
      }}
    >
      {/* soft ground light — viewport-fixed, opaque, never fades in */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(122% 92% at 50% 36%, #FFFFFF 0%, ${LW.paper} 54%, ${LW.paperDeep} 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${
            height / 2 - fy
          }px) scale(${fz})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ------------------------------------------- the editing surface */}
        <div
          style={{
            position: "absolute",
            left: P_X,
            top: P_Y,
            width: P_W,
            height: P_H,
            borderRadius: 26,
            background: LW.card,
            boxShadow: LW.shadowLift,
            border: `1px solid ${LW.hairline}`,
          }}
        />

        {/* ------------------------------------------------------- ruler */}
        <div
          style={{
            position: "absolute",
            left: IN_X0,
            top: RUL_BASE,
            width: IN_X1 - IN_X0,
            height: 1,
            background: LW.hairline,
          }}
        />
        {Array.from({ length: TICK_N }).map((_, i) => {
          const major = i % 5 === 0;
          return (
            <div
              key={`t${i}`}
              style={{
                position: "absolute",
                left: TICK_X0 + i * TICK_PITCH,
                top: RUL_BASE - (major ? 15 : 8),
                width: 1,
                height: major ? 15 : 8,
                background: major
                  ? "rgba(20,16,10,0.22)"
                  : "rgba(20,16,10,0.11)",
              }}
            />
          );
        })}
        {STOPS.map((s) => (
          <div
            key={s.t}
            style={{
              position: "absolute",
              left: s.x + 10,
              top: RUL_Y,
              fontFamily: FONT_MONO,
              fontSize: 18,
              letterSpacing: 0.4,
              color: LW.muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.t}
          </div>
        ))}
        {/* cut markers accumulate on the ruler */}
        {CUTS.map((c, i) => {
          const o = ramp(frame, c.at, c.at + 8);
          if (o <= 0) return null;
          return (
            <div
              key={`m${i}`}
              style={{
                position: "absolute",
                left: (c.x0 + c.x1) / 2 - 6,
                top: RUL_BASE - 9,
                width: 0,
                height: 0,
                opacity: o,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `9px solid ${RN.amber}`,
              }}
            />
          );
        })}

        {/* ------------------------------------------------ lane A: source */}
        <div
          style={{
            position: "absolute",
            left: IN_X0,
            top: A_Y,
            width: IN_X1 - IN_X0,
            height: A_H,
            borderRadius: 14,
            background: RN.panel,
            border: `1px solid ${LW.hairlineSoft}`,
          }}
        />
        {frames}
        {bars}

        {/* ranges already taken out of the source, bracketed for good */}
        {CUTS.map((c, i) => {
          const o = ramp(frame, c.at, c.at + 10);
          if (o <= 0) return null;
          return (
            <React.Fragment key={`n${i}`}>
              {[c.x0, c.x1].map((nx, j) => (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    left: nx - 1,
                    top: FR_Y - 7,
                    width: 2,
                    height: FR_H + 14,
                    background: RN.amber,
                    opacity: o * 0.85,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: c.x0,
                  top: FR_Y + FR_H + 5,
                  width: c.x1 - c.x0,
                  height: 3,
                  borderRadius: 2,
                  background: RN.amber,
                  opacity: o * 0.85,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* ------------------------------------------------ in/out selection */}
        {sel ? (
          <>
            <div
              style={{
                position: "absolute",
                left: sel.x0,
                top: FR_Y - 7,
                width: Math.max(2, sel.x1 - sel.x0),
                height: FR_H + 14,
                borderRadius: 6,
                background: "rgba(222,155,74,0.18)",
                border: `2px solid ${RN.amber}`,
              }}
            />
            {[sel.x0, sel.x1].map((hx, i) => (
              <div
                key={`h${i}`}
                style={{
                  position: "absolute",
                  left: hx - 5,
                  top: FR_Y + FR_H / 2 - 24,
                  width: 10,
                  height: 48,
                  borderRadius: 5,
                  background: RN.amber,
                  boxShadow: "0 2px 6px rgba(23,20,14,0.22)",
                }}
              />
            ))}
          </>
        ) : null}

        {/* the blade */}
        {CUTS.map((c, i) => {
          const o = key(
            frame,
            [c.at - 2, c.at, c.at + 7],
            [0, 1, 0],
            Easing.linear,
          );
          if (o <= 0.001) return null;
          return (
            <div
              key={`b${i}`}
              style={{
                position: "absolute",
                left: c.x1 - 2,
                top: FR_Y - 18,
                width: 4,
                height: FR_H + 36,
                background: "#FFFFFF",
                opacity: o,
                boxShadow: `0 0 24px 7px rgba(222,155,74,${0.8 * o})`,
              }}
            />
          );
        })}

        {/* ---------------------------------------------------- playhead */}
        <div
          style={{
            position: "absolute",
            left: playX - 1.5,
            top: RUL_BASE - 52,
            width: 3,
            height: 52 + (A_Y + A_H - RUL_BASE) + 4,
            background: RN.amber,
            boxShadow: "0 0 18px 3px rgba(222,155,74,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: playX - 9,
            top: RUL_BASE - 60,
            width: 18,
            height: 20,
            borderRadius: 5,
            background: RN.amber,
            boxShadow: "0 2px 6px rgba(23,20,14,0.25)",
          }}
        />

        {/* ------------------------------------------------- lane B: work */}
        <div
          style={{
            position: "absolute",
            left: IN_X0,
            top: B_Y,
            width: IN_X1 - IN_X0,
            height: B_H,
            borderRadius: 14,
            background: "rgba(20,16,10,0.026)",
            border: `1px solid ${LW.hairlineSoft}`,
          }}
        />

        {/* the cut segments, stacking below the track */}
        {CUTS.map((c, i) => {
          if (frame < c.at) return null;
          const s = spring({
            frame: frame - c.at,
            fps,
            config: SPRINGS.heavy,
            durationInFrames: 36,
          });
          const w = c.x1 - c.x0;
          const capOn = ramp(frame, 150 + i * 9, 160 + i * 9);
          return (
            <div
              key={`c${i}`}
              style={{
                position: "absolute",
                left: c.x0,
                top: CHIP_Y,
                width: w,
                height: CHIP_H,
                borderRadius: 12,
                background: LW.card,
                border: `1px solid ${LW.hairline}`,
                boxShadow: LW.shadow,
                opacity: ramp(frame, c.at, c.at + 6),
                transform: `translateY(${(1 - s) * -36}px) scale(${
                  0.94 + s * 0.06
                })`,
                transformOrigin: `${w / 2}px 0px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  width: w - 20,
                  height: THUMB_H,
                  borderRadius: 8,
                  overflow: "hidden",
                  ...filmFrame(i * 3 + 5),
                }}
              >
                {/* the captions, burned on, as solid word bars */}
                <div
                  style={{
                    position: "absolute",
                    left: (w - 20) * 0.2,
                    top: THUMB_H - 32,
                    width: (w - 20) * 0.6,
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.9)",
                    opacity: capOn,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: (w - 20) * 0.32,
                    top: THUMB_H - 18,
                    width: (w - 20) * 0.36,
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.9)",
                    opacity: capOn,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 120,
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  color: LW.body,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {c.dur}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: 128,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: RN.amber,
                }}
              />
            </div>
          );
        })}

        {/* ------------------------------------------- the captioned clip */}
        <div
          style={{
            position: "absolute",
            left: CAP_X,
            top: CAP_Y,
            width: CAP_W,
            height: CAP_H,
            borderRadius: 14,
            background: LW.card,
            border: `1px solid ${LW.hairline}`,
            boxShadow: LW.shadow,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              width: CAP_W - 32,
              height: 156,
              borderRadius: 8,
              overflow: "hidden",
              ...filmFrame(9),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.58) 100%)",
              }}
            />
            {([0, 1] as const).map((line) => (
              <div
                key={`cl${line}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: line === 0 ? 76 : 108,
                  display: "flex",
                  justifyContent: "center",
                  gap: 9,
                }}
              >
                {CAP_WORDS.filter((w) => w.line === line).map((w) => {
                  if (frame < w.at) return null;
                  const s = spring({
                    frame: frame - w.at,
                    fps,
                    config: SPRINGS.snappy,
                    durationInFrames: 14,
                  });
                  return (
                    <span
                      key={w.w}
                      style={{
                        fontFamily: FONT_SANS,
                        fontWeight: 700,
                        fontSize: 25,
                        letterSpacing: 0.6,
                        color: "#FFFFFF",
                        textShadow: "0 2px 7px rgba(0,0,0,0.6)",
                        opacity: s,
                        transform: `scale(${0.82 + s * 0.18})`,
                      }}
                    >
                      {w.w}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 184,
              fontFamily: FONT_MONO,
              fontSize: 20,
              color: LW.body,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {CUTS[2].dur}
          </div>
          <div
            style={{
              position: "absolute",
              right: 18,
              top: 192,
              width: 9,
              height: 9,
              borderRadius: 5,
              background: RN.amber,
            }}
          />
        </div>

        {/* ------------------------------------------------- title field */}
        <div
          style={{
            position: "absolute",
            left: TF_X,
            top: TF_Y,
            width: TF_W,
            height: TF_H,
            borderRadius: 12,
            background: LW.card,
            border: `1px solid ${focused ? RN.amber : LW.hairline}`,
            boxShadow: focused
              ? `0 0 0 4px rgba(222,155,74,0.18), ${LW.shadow}`
              : LW.shadow,
            display: "flex",
            alignItems: "center",
            paddingLeft: 18,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 500,
              fontSize: 25,
              color: LW.ink,
              whiteSpace: "pre",
              // A real input scrolls its content once the caret passes the right
              // edge. Approximate the run width and shift left by the overflow so
              // the newest characters stay visible instead of escaping the box.
              transform: `translateX(${-Math.max(
                0,
                typed.length * 12.6 - (TF_W - 40),
              )}px)`,
            }}
          >
            {typed}
          </span>
          <span
            style={{
              width: 2,
              height: 30,
              marginLeft: 3,
              background: LW.ink,
              opacity: focused && caretOn ? 1 : 0,
            }}
          />
        </div>

        {/* ----------------------------------------------------- upload */}
        <div
          style={{
            position: "absolute",
            left: UP_X,
            top: UP_Y,
            width: UP_W,
            height: UP_H,
            borderRadius: 14,
            background: LW.card,
            border: `1px solid ${LW.hairline}`,
            boxShadow: LW.shadow,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              width: 44,
              height: 44,
              borderRadius: 8,
              ...filmFrame(9),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 74,
              top: 22,
              fontFamily: FONT_MONO,
              fontSize: 19,
              color: LW.body,
            }}
          >
            {FILE_NAME}
          </div>
          {/* the one primary button — dark lives only inside cards */}
          <div
            style={{
              position: "absolute",
              left: UP_W - 18 - BTN_W,
              top: 18,
              width: BTN_W,
              height: BTN_H,
              borderRadius: 10,
              background: RN.ink,
              opacity: started ? 0.5 : 1,
              transform: `scale(${pressed ? 0.955 : 1})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {started ? (
              <svg width={20} height={20} viewBox="0 0 20 20">
                <circle
                  cx={10}
                  cy={10}
                  r={7}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={2.4}
                />
                <circle
                  cx={10}
                  cy={10}
                  r={7}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray="12 32"
                  transform={`rotate(${(frame * 9) % 360} 10 10)`}
                />
              </svg>
            ) : (
              <svg width={20} height={20} viewBox="0 0 20 20">
                <path
                  d="M10 14 L10 3 M5.4 7.6 L10 3 L14.6 7.6 M4 16.6 L16 16.6"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 88,
              width: UP_W - 36,
              height: 12,
              borderRadius: 6,
              background: "rgba(20,16,10,0.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${progress * 100}%`,
                borderRadius: 6,
                background: RN.amber,
                boxShadow: `0 0 14px 2px rgba(222,155,74,${
                  0.28 + 0.16 * Math.sin(frame / 5)
                })`,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 110,
              fontFamily: FONT_MONO,
              fontSize: 23,
              fontWeight: 500,
              color: AMBER_INK,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {`${Math.round(progress * 100)}%`}
          </div>
        </div>

        {/* the three files that have not even started */}
        {QUEUE_Y.map((qy, i) => (
          <div
            key={`q${i}`}
            style={{
              position: "absolute",
              left: UP_X,
              top: qy,
              width: UP_W,
              height: QUEUE_H,
              borderRadius: 8,
              background: "rgba(20,16,10,0.05)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 6,
                top: 4,
                width: 16,
                height: 16,
                borderRadius: 4,
                opacity: 0.5,
                ...filmFrame(i * 5 + 2),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 32,
                top: 9,
                width: 166 - i * 26,
                height: 6,
                borderRadius: 3,
                background: "rgba(20,16,10,0.13)",
              }}
            />
          </div>
        ))}

        {/* click ripple on the upload button */}
        {frame >= 220 && frame < 232
          ? (() => {
              const r = key(frame, [220, 231], [12, 50], Easing.out(Easing.quad));
              return (
                <div
                  style={{
                    position: "absolute",
                    left: UP_X + UP_W - 18 - BTN_W / 2 - r,
                    top: UP_Y + 18 + BTN_H / 2 - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: 999,
                    border: `1.5px solid ${RN.amber}`,
                    opacity: key(frame, [220, 231], [0.4, 0], Easing.linear),
                  }}
                />
              );
            })()
          : null}

        {/* ------------------------------------------------------ cursor */}
        <Cursor x={curX} y={curY} opacity={curOp} />
      </div>

      {/* --------------------------------------------- elapsed, screen HUD
          Styled after the amber credit pill in the approved Runable renders.
          Real data: a clock climbing toward a full working day. */}
      <div
        style={{
          position: "absolute",
          right: SAFE,
          top: 110,
          height: 54,
          paddingLeft: 20,
          paddingRight: 22,
          borderRadius: 27,
          background: "#FDF4E7",
          border: "1px solid rgba(222,155,74,0.3)",
          boxShadow: "0 6px 20px rgba(23,20,14,0.10)",
          display: "flex",
          alignItems: "center",
          gap: 11,
          opacity: ramp(frame, 8, 22),
        }}
      >
        <svg width={19} height={19} viewBox="0 0 20 20">
          <circle
            cx={10}
            cy={10}
            r={7.6}
            fill="none"
            stroke={AMBER_INK}
            strokeWidth={1.7}
          />
          <path
            d="M10 5.4 L10 10.2 L13.2 12"
            fill="none"
            stroke={AMBER_INK}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: 0.6,
            color: AMBER_INK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock(elapsed)}
        </span>
      </div>
    </AbsoluteFill>
  );
};
