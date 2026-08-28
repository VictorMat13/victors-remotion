import React from "react";
import {
  AbsoluteFill,
  Easing,
  Solid,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise } from "@remotion/effects/noise";
import { vignette } from "@remotion/effects/vignette";
import { Trail } from "@remotion/motion-blur";
import { noise3D } from "@remotion/noise";
import { FONT_DISPLAY, FONT_SANS, LW, OFFER, RN, SPRINGS, safePadX } from "./theme";

// ============================================================================
// RgP8SpotsGone — 1080x1080 @ 30fps  (1:1)
// VO [0:47-0:49]: "Once those ten thousand spots are gone they're gone."
//
// ONE action, two seconds. A full-bleed field of amber-lit spots owns the
// frame. A diagonal front races across it once; behind the front every spot
// deflates into an empty socket. The counter drains in lockstep. One spot in
// the lower third survives, pulses twice, pops — then the field is hollow and
// the frame goes absolutely still so the editor can cut to the CTA.
//
// Every figure on screen is routed through OFFER (theme.ts). No digit is
// hardcoded. The only text is the number itself and the SPOTS kicker — the
// narration is never echoed.
//
// The field is 400 dots standing for OFFER.spots, so one dot = 25 spots. The
// counter is COMPUTED from the live dot states (not a separate animation), so
// the number and the picture can never disagree: when one dot is left it reads
// 25, and it only reaches 0 when that last dot pops.
// ============================================================================

export const DURATION_IN_FRAMES = 60;

// ------------------------------------------------------------------ geometry
const WORLD = 1080; // the comp is registered 1080x1080; the world is scaled to fit
const COLS = 20;
const ROWS = 20;
const DOTS = COLS * ROWS; // 400 → one dot = 25 spots
const PITCH = 57;
const DOT = 24;
const ORIGIN = (WORLD - COLS * PITCH) / 2 + PITCH / 2; // -1.5 → the field bleeds

// the one spot that outlives the front — lower third, inside the side margins
const LAST_COL = 6;
const LAST_ROW = 14;
const LAST_INDEX = LAST_ROW * COLS + LAST_COL;
const LAST_X = ORIGIN + LAST_COL * PITCH; // 340.5
const LAST_Y = ORIGIN + LAST_ROW * PITCH; // 796.5

// the diagonal front: unit normal of the sweep line
const THETA_DEG = 38;
const NX = Math.cos((THETA_DEG * Math.PI) / 180);
const NY = Math.sin((THETA_DEG * Math.PI) / 180);

const dotX = (i: number) => ORIGIN + (i % COLS) * PITCH;
const dotY = (i: number) => ORIGIN + Math.floor(i / COLS) * PITCH;

// each dot's position along the front's travel, normalised to 0..1
const PROJ: number[] = [];
for (let i = 0; i < DOTS; i++) {
  PROJ.push(dotX(i) * NX + dotY(i) * NY);
}
const P_MIN = Math.min(...PROJ);
const P_MAX = Math.max(...PROJ);
const P_SPAN = P_MAX - P_MIN;
const PN = PROJ.map((p) => (p - P_MIN) / P_SPAN);

// -------------------------------------------------------------------- timing
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SWEEP_START = 10;
const SWEEP_END = 40;
const BAND = 0.13; // how much of the travel a single dot takes to die
const PRE = 0.09; // how far ahead of the front a dot starts to feel the heat
// The front: a hard attack out of frame 10, a steady middle, then a decelerating
// landing as it runs out of field. Keyed rather than eased end-to-end so the
// travel keeps reading all the way to frame 41 instead of finishing early.
const FRONT_T = [SWEEP_START, 15, 23, 32, SWEEP_END];
const FRONT_V = [-BAND - 0.02, 0.17, 0.58, 0.94, 1 + BAND + 0.02];
const FRONT_EASE = [
  Easing.out(Easing.quad),
  Easing.linear,
  Easing.linear,
  Easing.out(Easing.cubic),
];

const PULSE_1 = [42, 43.6, 45.2];
const PULSE_2 = [45.7, 47.3, 48.9];
const POP_START = 49;
const POP_END = 51.6;
const HOLD_START = 52;

// ---------------------------------------------------------------- the figure
const TOTAL_SPOTS = Number(OFFER.spots.replace(/[^0-9]/g, ""));

const withCommas = (n: number) => {
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) {
      out += ",";
    }
    out += s[i];
  }
  return out;
};

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ------------------------------------------------------------- the mechanism
const frontAt = (frame: number) =>
  interpolate(frame, FRONT_T, FRONT_V, { easing: FRONT_EASE, ...CLAMP });

// the survivor dies on its own clock, after the front has already gone past
const lastDotHit = (frame: number) =>
  interpolate(frame, [POP_START, POP_END], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });

const hitAt = (i: number, frame: number, f: number) =>
  i === LAST_INDEX
    ? lastDotHit(frame)
    : interpolate(f, [PN[i], PN[i] + BAND], [0, 1], CLAMP);

// the counter reads the field, it is not animated separately
const spotsAtFrame = (frame: number) => {
  const f = frontAt(frame);
  let alive = 0;
  for (let i = 0; i < DOTS; i++) {
    alive += 1 - hitAt(i, frame, f);
  }
  return Math.round((alive / DOTS) * TOTAL_SPOTS);
};

// ---------------------------------------------------------------- typography
const NUM_SIZE = 168;
const NUM_H = Math.round(NUM_SIZE * 1.06);
const RULE_W = 96;
const KICKER_H = 30;
const BLOCK_CY = 486; // centre of the counter block in world coordinates
const BLOCK_H = NUM_H + 22 + 3 + 18 + KICKER_H;

// Rendered inside <Trail>, so it must read the frame itself — the ghost layers
// are frozen at earlier frames and have to resolve their own digits.
const CounterDigits: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_DISPLAY,
        fontSize: NUM_SIZE,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.035em",
        color: LW.ink,
        fontVariantNumeric: "tabular-nums lining-nums",
        fontFeatureSettings: '"tnum" 1, "lnum" 1',
        whiteSpace: "nowrap",
      }}
    >
      {withCommas(spotsAtFrame(frame))}
    </div>
  );
};

export const RgP8SpotsGone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const padX = safePadX(width); // 54 on 1080
  const innerW = width - padX * 2;
  const worldScale = width / WORLD;

  // --- camera: a slow settle out of a light push, then two identical keys so
  // the last eight frames are frozen dead still.
  const camKeys = [0, 12, SWEEP_END, HOLD_START, DURATION_IN_FRAMES - 1];
  const zoom = interpolate(
    frame,
    camKeys,
    [1.026, 1.02, 1.004, 0.998, 0.998],
    { easing: Easing.inOut(Easing.cubic), ...CLAMP },
  );
  const focalY = interpolate(frame, camKeys, [550, 548, 534, 528, 528], {
    easing: Easing.inOut(Easing.cubic),
    ...CLAMP,
  });
  const focalX = WORLD / 2;

  // --- the front, and where its light sits in world space
  const f = frontAt(frame);
  const frontDist = P_MIN + f * P_SPAN - (WORLD / 2) * (NX + NY);
  const waveOpacity = interpolate(frame, [8, 14, 33, 42], [0, 1, 1, 0], CLAMP);

  // --- the amber the field is lit with leaves as the field empties
  const bloom = interpolate(frame, [0, 10, 30, 46, 52], [0.86, 1, 0.66, 0.1, 0.05], {
    easing: Easing.inOut(Easing.cubic),
    ...CLAMP,
  });

  // --- shimmer dies before the hold: the stillness is the message
  const shimmerGate = interpolate(frame, [34, 42], [1, 0], CLAMP);

  // --- the survivor's two pulses
  const pulse =
    interpolate(frame, PULSE_1, [0, 1, 0], {
      easing: Easing.inOut(Easing.quad),
      ...CLAMP,
    }) +
    interpolate(frame, PULSE_2, [0, 1, 0], {
      easing: Easing.inOut(Easing.quad),
      ...CLAMP,
    });

  // --- the pop: one small burst, three frames, then an empty socket
  const burst = interpolate(frame, [POP_START, POP_START + 3], [0, 1], CLAMP);
  const burstAlive = frame >= POP_START && frame < POP_START + 3.2;

  const counterSettle = spring({
    frame,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 16,
  });
  const spinning = frame >= SWEEP_START && frame < SWEEP_END + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: LW.paper }}>
      {/* GROUND — WebGL paper: fine grain plus a whisper of warm falloff.
          Full-bleed, opaque, present frame 0 → last. */}
      <Solid
        width={width}
        height={height}
        color={LW.paper}
        effects={[
          noise({ amount: 0.11, seed: 11 }),
          vignette({
            amount: 0.1,
            radius: 0.74,
            feather: 0.6,
            roundness: 0.85,
            color: "#4A3A26",
          }),
        ]}
        style={{ position: "absolute", left: 0, top: 0 }}
      />

      {/* the world the camera moves through */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WORLD,
          height: WORLD,
          transform: `scale(${worldScale}) translate(${WORLD / 2 - focalX}px, ${
            WORLD / 2 - focalY
          }px) scale(${zoom})`,
          transformOrigin: `${focalX}px ${focalY}px`,
        }}
      >
        {/* the amber the field is lit with — a WebGL bloom that fades to
            nothing at the edges, and drains away with the allocation */}
        <Solid
          width={WORLD}
          height={WORLD}
          color={rgba(RN.amber, 0.19)}
          effects={[
            vignette({
              mode: "alpha",
              amount: 1,
              radius: 0.06,
              feather: 0.95,
              roundness: 1,
              center: [0.5, 0.46],
            }),
          ]}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: bloom,
            mixBlendMode: "multiply",
          }}
        />

        {/* WAVE — broad heat halo behind the field */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2600,
            height: 300,
            opacity: waveOpacity,
            mixBlendMode: "multiply",
            filter: "blur(42px)",
            background: `linear-gradient(to bottom, ${rgba(
              RN.amber,
              0,
            )} 0%, ${rgba(RN.amber, 0.34)} 50%, ${rgba(RN.amber, 0)} 100%)`,
            transform: `translate(-50%, -50%) translate(${frontDist * NX}px, ${
              frontDist * NY
            }px) rotate(${THETA_DEG + 90}deg)`,
          }}
        />

        {/* THE FIELD — full bleed, edge to edge */}
        {new Array(DOTS).fill(0).map((_unused, i) => {
          const isLast = i === LAST_INDEX;
          const hit = hitAt(i, frame, f);
          const alive = 1 - hit;

          // heat arriving just ahead of the front
          const pre =
            interpolate(f, [PN[i] - PRE, PN[i]], [0, 1], CLAMP) * alive;

          // each dot breathes slightly out of phase with its neighbours, on
          // top of a fixed per-dot bias so the field has depth, not wallpaper
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const bias = noise3D("rgp8-bias", col * 0.62, row * 0.62, 0);
          const shimmer =
            noise3D("rgp8", col * 0.33, row * 0.33, frame * 0.05) *
            shimmerGate *
            alive;

          const popScale = interpolate(
            hit,
            [0, 0.3, 0.62, 1],
            [1, 1.42, 1.04, 0.86],
            { easing: Easing.out(Easing.quad), ...CLAMP },
          );
          const popGlow = interpolate(
            hit,
            [0, 0.3, 0.7, 1],
            [0, 1, 0.24, 0],
            CLAMP,
          );
          const fillOpacity = interpolate(
            hit,
            [0, 0.34, 0.7, 1],
            [1, 0.97, 0.4, 0],
            CLAMP,
          );
          const ringOpacity = interpolate(hit, [0, 0.4, 1], [0, 0.22, 1], CLAMP);

          const lastPulse = isLast ? pulse * alive : 0;
          const scale =
            popScale *
            (1 + 0.04 * bias + 0.05 * shimmer + 0.12 * pre + 0.26 * lastPulse);
          const glowR = 5 + 20 * pre + 26 * popGlow + 46 * lastPulse;
          const glowA =
            0.14 + 0.06 * shimmer + 0.34 * pre + 0.5 * popGlow + 0.6 * lastPulse;
          const smear = popGlow > 0.12 && hit < 1 ? 3.2 * popGlow : 0;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: dotX(i) - DOT / 2,
                top: dotY(i) - DOT / 2,
                width: DOT,
                height: DOT,
              }}
            >
              {ringOpacity > 0.004 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: DOT,
                    border: `2px solid rgba(88, 68, 44, 0.26)`,
                    backgroundColor: "rgba(120, 96, 64, 0.035)",
                    boxSizing: "border-box",
                    opacity: ringOpacity,
                  }}
                />
              ) : null}
              {fillOpacity > 0.004 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: DOT,
                    background: `radial-gradient(circle at 50% 32%, #EAB776 0%, ${RN.amber} 58%, #C4823A 100%)`,
                    boxShadow: `0 0 ${glowR}px ${rgba(
                      RN.amber,
                      glowA,
                    )}, 0 2px 5px rgba(150, 104, 44, 0.16)`,
                    opacity:
                    fillOpacity *
                    (0.84 + 0.1 * (shimmer * 0.5 + 0.5) + 0.06 * (bias * 0.5 + 0.5)),
                    transform: `scale(${scale})`,
                    filter: smear > 0.06 ? `blur(${smear}px)` : undefined,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* WAVE — the bright core, riding over the field */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2600,
            height: 78,
            opacity: waveOpacity * 0.9,
            mixBlendMode: "multiply",
            filter: "blur(14px)",
            background: `linear-gradient(to bottom, ${rgba(
              RN.amber,
              0,
            )} 0%, ${rgba(RN.amber, 0.52)} 50%, ${rgba(RN.amber, 0)} 100%)`,
            transform: `translate(-50%, -50%) translate(${frontDist * NX}px, ${
              frontDist * NY
            }px) rotate(${THETA_DEG + 90}deg)`,
          }}
        />

        {/* the survivor announces itself twice before it goes */}
        {pulse > 0.01 ? (
          <div
            style={{
              position: "absolute",
              left: LAST_X - 80,
              top: LAST_Y - 80,
              width: 160,
              height: 160,
              borderRadius: 160,
              mixBlendMode: "multiply",
              background: `radial-gradient(closest-side, ${rgba(
                RN.amber,
                0.34,
              )} 0%, ${rgba(RN.amber, 0.12)} 46%, ${rgba(RN.amber, 0)} 100%)`,
              opacity: pulse,
              transform: `scale(${interpolate(pulse, [0, 1], [0.5, 1])})`,
            }}
          />
        ) : null}

        {/* THE POP — one small burst on the survivor, three frames */}
        {burstAlive ? (
          <div
            style={{
              position: "absolute",
              left: LAST_X,
              top: LAST_Y,
              width: 0,
              height: 0,
              filter: "blur(1.6px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -70,
                top: -70,
                width: 140,
                height: 140,
                borderRadius: 140,
                border: `1.5px solid ${rgba(RN.amber, 0.6)}`,
                boxSizing: "border-box",
                opacity: interpolate(burst, [0, 0.5, 1], [0.85, 0.3, 0], CLAMP),
                transform: `scale(${interpolate(
                  burst,
                  [0, 1],
                  [0.16, 1.02],
                  CLAMP,
                )})`,
              }}
            />
            {new Array(8).fill(0).map((_unused, k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: interpolate(burst, [0, 1], [10, 46], CLAMP),
                  height: 1.6,
                  borderRadius: 2,
                  background: `linear-gradient(to right, ${rgba(
                    RN.amber,
                    0.75,
                  )} 0%, ${rgba(RN.amber, 0)} 100%)`,
                  opacity: interpolate(burst, [0, 0.35, 1], [0.62, 0.3, 0], CLAMP),
                  transform: `rotate(${k * 45 + 22}deg) translateX(${interpolate(
                    burst,
                    [0, 1],
                    [14, 44],
                    CLAMP,
                  )}px)`,
                  transformOrigin: "0px 0.8px",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: -30,
                top: -30,
                width: 60,
                height: 60,
                borderRadius: 60,
                background: `radial-gradient(circle, ${rgba(
                  "#F6C489",
                  0.9,
                )} 0%, ${rgba(RN.amber, 0.42)} 38%, ${rgba(RN.amber, 0)} 70%)`,
                opacity: interpolate(burst, [0, 0.38, 1], [1, 0.3, 0], CLAMP),
                transform: `scale(${interpolate(burst, [0, 1], [0.55, 1.7], CLAMP)})`,
              }}
            />
          </div>
        ) : null}

        {/* a soft paper wash so the numerals sit clean on the field —
            no border, no shadow, no card */}
        <div
          style={{
            position: "absolute",
            left: WORLD / 2 - 440,
            top: BLOCK_CY - 200,
            width: 880,
            height: 400,
            background: `radial-gradient(closest-side, ${rgba(
              LW.paper,
              0.86,
            )} 0%, ${rgba(LW.paper, 0.66)} 46%, ${rgba(LW.paper, 0)} 100%)`,
          }}
        />

        {/* THE COUNTER — the only figure on screen */}
        <div
          style={{
            position: "absolute",
            left: padX / worldScale,
            top: BLOCK_CY - BLOCK_H / 2,
            width: innerW / worldScale,
            maxWidth: innerW / worldScale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `scale(${interpolate(counterSettle, [0, 1], [0.986, 1])})`,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: NUM_H }}>
            {spinning ? (
              <Trail layers={3} lagInFrames={1} trailOpacity={0.42}>
                <CounterDigits />
              </Trail>
            ) : (
              <CounterDigits />
            )}
          </div>

          <div
            style={{
              marginTop: 22,
              width: RULE_W,
              height: 3,
              borderRadius: 3,
              backgroundColor: RN.amber,
              opacity: 0.92,
            }}
          />

          <div
            style={{
              marginTop: 18,
              height: KICKER_H,
              display: "flex",
              alignItems: "center",
              paddingLeft: "0.34em",
              fontFamily: FONT_SANS,
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: LW.muted,
            }}
          >
            spots
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
