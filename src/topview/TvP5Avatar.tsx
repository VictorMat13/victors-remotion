import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_MONO, FONT_SANS, SPRINGS, TV } from "./theme";

/**
 * TvP5Avatar — "one photo → avatar on camera → make 10 more" (WOW beat).
 * LIAM WHITE STYLE: warm white world, floating white cards with soft
 * shadows, Topview purple as the only accent. One continuous vertical
 * world, keyframed camera:
 *   A (0–90)    single product photo card + purple analysis scan
 *   B (90–230)  card flips into a phone playing the real avatar take
 *   C (230–420) typed "make 10 more" chip → 5x2 grid of 10 DIFFERENT
 *               actors (actor01–10 stills) spawns; hero crossfades into
 *               tile 01 at flight end
 *   D (420–480) pull back: docked source photo + full 10-grid humming
 */
export const DURATION_IN_FRAMES = 480;

/* ------------------------------------------------------------- world ---- */

const WORLD_W = 2400;
const WORLD_H = 3600;
const CX = 1200;

const PHOTO = { cx: CX, cy: 950, w: 620, h: 880 };
const PHONE = { cx: CX, cy: 950, w: 660, h: 1180 };
const CHIP = { cx: CX, cy: 1680, w: 660, h: 116 };

const TILE_W = 400;
const TILE_H = 640;
const GAP = 24;
const GRID_W = 5 * TILE_W + 4 * GAP; // 2096
const GRID_X0 = CX - GRID_W / 2; // 152
const GRID_Y0 = 1948;
const GRID_CY = GRID_Y0 + TILE_H + GAP / 2; // 2600

const DOCK = { cx: CX, cy: 1780, w: 210, h: 300 };

const slotCx = (i: number) => GRID_X0 + (i % 5) * (TILE_W + GAP) + TILE_W / 2;
const slotCy = (i: number) =>
  GRID_Y0 + Math.floor(i / 5) * (TILE_H + GAP) + TILE_H / 2;

/* ------------------------------------------------------------ timing ---- */

const FLIP_START = 92; // photo card folds away
const REVEAL = 104; // phone unfolds + flare
const TYPE_TEXT = "make 10 more";
const TYPE_START = 246;
const TYPE_END = 276;
const ENTER = 280;
const FLIGHT: [number, number] = [294, 320]; // hero phone → grid slot 01
// spawn frame per grid slot (slot 0 = hero arrival → crossfade to actor01)
const SPAWN = [320, 308, 317, 326, 336, 346, 356, 366, 376, 386];
const DOCK_IN = 426;

/* ------------------------------------------------------------ camera ---- */

const ease = Easing.inOut(Easing.cubic);
// photo | push (flip) | hold avatar | down to chip | hold typing |
// pull to grid | hold spawn | pull out | land hold
const KEY_T = [0, 88, 106, 218, 246, 290, 318, 372, 424, 479];
const KEY_FX = [1200, 1200, 1200, 1200, 1200, 1200, 800, 800, 1200, 1200];
const KEY_FY = [950, 950, 950, 950, 1100, 1100, 2350, 2350, 2350, 2350];
const KEY_Z = [1.1, 1.02, 1.08, 1.08, 1.02, 1.02, 0.66, 0.66, 0.45, 0.45];

/* ------------------------------------------------------- tile content ---- */

// 10 different generated actors, all holding the same Fizzi can.
const pad2 = (n: number) => String(n + 1).padStart(2, "0");
const actorSrc = (i: number) => `topview/actors/actor${pad2(i)}.png`;

/* -------------------------------------------------------------- atoms ---- */

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Badge: React.FC<{ label: string; opacity: number }> = ({
  label,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      top: 16,
      left: 16,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 18px",
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.92)",
      border: "1.5px solid rgba(23,23,28,0.08)",
      fontFamily: FONT_MONO,
      fontSize: 40,
      fontVariantNumeric: "tabular-nums",
      color: "#5B21B6",
      letterSpacing: 1,
      opacity,
    }}
  >
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: TV.purple,
      }}
    />
    {label}
  </div>
);

const Bracket: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  opacity: number;
}> = ({ corner, opacity }) => {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 46,
    height: 46,
    opacity,
    borderColor: TV.violet,
    borderStyle: "solid",
    borderWidth: 0,
  };
  if (corner === "tl") {
    Object.assign(s, { top: 14, left: 14, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 });
  } else if (corner === "tr") {
    Object.assign(s, { top: 14, right: 14, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 });
  } else if (corner === "bl") {
    Object.assign(s, { bottom: 14, left: 14, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 });
  } else {
    Object.assign(s, { bottom: 14, right: 14, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 });
  }
  return <div style={s} />;
};

/* --------------------------------------------------------- composition ---- */

export const TvP5Avatar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const ivE = (range: [number, number], out: [number, number]) =>
    interpolate(frame, range, out, { easing: ease, ...clampOpt });
  const lin = (range: number[], out: number[]) =>
    interpolate(frame, range, out, clampOpt);

  const camOpt = { easing: ease, ...clampOpt };
  const fx = interpolate(frame, KEY_T, KEY_FX, camOpt);
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpt);
  const z = interpolate(frame, KEY_T, KEY_Z, camOpt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = {
      damping: 14,
      stiffness: 150,
    }
  ) =>
    frame < t0
      ? 0
      : spring({ frame: frame - t0, fps, config, durationInFrames: 36 });

  /* ---- act A: photo card + scan ---- */
  const cardIn = spring({
    frame: frame + 8,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 40,
  });
  const cardScale = 0.96 + 0.04 * cardIn;
  const cardBob = 6 * Math.sin(frame / 18);
  const cardRotY = ivE([FLIP_START, REVEAL], [0, 92]);
  const scanY = ivE([6, 62], [-70, 800]);
  const scanOn = frame < FLIP_START;
  const lockP = ivE([62, 72], [0, 1]);
  const bracketA = 0.45 + 0.55 * lockP * (0.65 + 0.35 * Math.sin(frame / 5));

  /* ---- act B: hero phone (unfold → play → flight into grid) ---- */
  const flightP = ivE(FLIGHT, [0, 1]);
  const unfoldW = ivE([REVEAL, REVEAL + 22], [PHOTO.w, PHONE.w]);
  const unfoldH = ivE([REVEAL, REVEAL + 22], [PHOTO.h, PHONE.h]);
  const hw = unfoldW + (TILE_W - PHONE.w) * flightP;
  const hh = unfoldH + (TILE_H - PHONE.h) * flightP;
  const hcx = PHONE.cx + (slotCx(0) - PHONE.cx) * flightP;
  const hcy = PHONE.cy + (slotCy(0) - PHONE.cy) * flightP;
  const heroRotY = ivE([REVEAL, REVEAL + 18], [-75, 0]);
  const heroBob = (1 - flightP) * 5 * Math.sin(frame / 16);
  const heroScale = 1 + 0.05 * Math.sin(flightP * Math.PI);
  const heroPad = 12 - 4 * flightP;
  const heroRadius = 40 - 16 * flightP;
  const heroInnerR = 30 - 13 * flightP;
  const heroGlow =
    lin([REVEAL, REVEAL + 20, 200], [0, 0.6, 0.3]) * (1 - 0.55 * flightP);
  // hero lands pixel-identical to a grid tile at slot 01, then crossfades
  // out while the actor01 tile fades in over it — no pop, no dead frames.
  const heroFade = lin([FLIGHT[1], FLIGHT[1] + 10], [1, 0]);
  const flareA = lin([98, 112, 150], [0, 0.9, 0]);
  const flareS = lin([98, 150], [0.55, 1.7]);
  const chromeA =
    lin([REVEAL + 4, REVEAL + 16], [0, 1]) * (1 - flightP);
  const recSecs = Math.max(0, Math.min(9, Math.floor((frame - REVEAL) / 30)));
  const recDot = 0.45 + 0.55 * (frame % 22 < 12 ? 1 : 0);
  const progW = lin([REVEAL + 2, 218], [6, 94]);

  /* ---- act C: prompt chip + typing ---- */
  const chipPop = spr(238, SPRINGS.bouncy);
  const chipExit = lin([382, 406], [1, 0]);
  const chipA = lin([238, 244], [0, 1]) * chipExit;
  const typed = TYPE_TEXT.slice(
    0,
    Math.floor(lin([TYPE_START, TYPE_END], [0, TYPE_TEXT.length]))
  );
  const caretOn =
    frame >= 240 && frame <= ENTER && frame % 16 < 9 ? 1 : 0;
  const sendP = lin([ENTER - 2, ENTER + 10], [0, 1]);
  const sendScale = 1 + 0.22 * Math.sin(sendP * Math.PI);
  const ringP = lin([ENTER + 2, ENTER + 30], [0, 1]);

  /* ---- accents ---- */
  const gridGlowIn = lin([300, 344], [0, 1]);
  const gridGlow = gridGlowIn * (0.75 + 0.25 * Math.sin(frame / 26));

  /* ---- act D: dock ---- */
  const dockS = spr(DOCK_IN, SPRINGS.bouncy);
  const dockA = lin([DOCK_IN, DOCK_IN + 8], [0, 1]);
  const dockBob = 4 * Math.sin(frame / 22);

  const wrapLeft = CX - 500;
  const wrapTop = 200;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: TV.bg,
        background:
          "radial-gradient(140% 110% at 50% 40%, #FFFFFF 0%, #FBFAF8 55%, #F2F1ED 100%)",
        fontFamily: FONT_SANS,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---- soft lavender wash behind the grid (accent, not glow) ---- */}
        <div
          style={{
            position: "absolute",
            left: CX - 1200,
            top: GRID_CY - 880,
            width: 2400,
            height: 1760,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0) 60%)",
            opacity: gridGlow,
          }}
        />

        {/* ---- reveal bloom (purple on white) ---- */}
        {flareA > 0.001 && (
          <div
            style={{
              position: "absolute",
              left: CX - 750,
              top: 960 - 750,
              width: 1500,
              height: 1500,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.34) 0%, rgba(167,139,250,0.18) 38%, rgba(124,58,237,0) 68%)",
              opacity: flareA * 0.85,
              transform: `scale(${flareS})`,
            }}
          />
        )}

        {/* ================= act A + B: photo card ⇄ hero phone ============ */}
        <div
          style={{
            position: "absolute",
            left: wrapLeft,
            top: wrapTop,
            width: 1000,
            height: 1500,
            perspective: 1500,
          }}
        >
          {/* photo card */}
          {frame < REVEAL + 2 && (
            <div
              style={{
                position: "absolute",
                left: 500 - PHOTO.w / 2,
                top: 750 - PHOTO.h / 2,
                width: PHOTO.w,
                height: PHOTO.h,
                transform: `translateY(${cardBob}px) rotateY(${cardRotY}deg) scale(${cardScale})`,
                backfaceVisibility: "hidden",
                backgroundColor: TV.panel,
                border: `1.5px solid ${TV.border}`,
                borderRadius: 22,
                padding: 16,
                boxShadow:
                  "0 1px 2px rgba(15,15,15,0.04), 0 22px 60px rgba(23,23,28,0.13)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: PHOTO.h - 32 - 64,
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: TV.panel2,
                }}
              >
                <Img
                  src={staticFile("topview/can-1.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "50% 40%",
                  }}
                />
                {/* scan sweep */}
                {scanOn && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: scanY - 140,
                        width: "100%",
                        height: 140,
                        background:
                          "linear-gradient(to top, rgba(167,139,250,0.30), rgba(167,139,250,0))",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: scanY,
                        width: "100%",
                        height: 4,
                        backgroundColor: TV.purple,
                        boxShadow: "0 0 18px rgba(124,58,237,0.5)",
                      }}
                    />
                  </>
                )}
                <Bracket corner="tl" opacity={bracketA} />
                <Bracket corner="tr" opacity={bracketA} />
                <Bracket corner="bl" opacity={bracketA} />
                <Bracket corner="br" opacity={bracketA} />
                {/* lock pulse border */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 16,
                    border: `2.5px solid ${TV.violet}`,
                    opacity: lockP * 0.55,
                  }}
                />
              </div>
              {/* file chip */}
              <div
                style={{
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontFamily: FONT_MONO,
                    fontSize: 30,
                    color: TV.muted,
                    letterSpacing: 0.5,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: TV.fizziCoral,
                    }}
                  />
                  can-1.png · 2.1 MB
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 24,
                    color: TV.faint,
                    border: `1px solid ${TV.border}`,
                    borderRadius: 8,
                    padding: "4px 12px",
                  }}
                >
                  PNG
                </div>
              </div>
            </div>
          )}

          {/* hero phone (crossfades into grid tile 01 at flight end) */}
          {frame >= REVEAL && frame < FLIGHT[1] + 12 && (
            <div
              style={{
                position: "absolute",
                left: hcx - wrapLeft - hw / 2,
                top: hcy - wrapTop - hh / 2,
                width: hw,
                height: hh,
                opacity: heroFade,
                transform: `translateY(${heroBob}px) rotateY(${heroRotY}deg) scale(${heroScale})`,
                backgroundColor: TV.panel,
                border: "1.5px solid rgba(23,23,28,0.10)",
                borderRadius: heroRadius,
                padding: heroPad,
                boxShadow: `0 2px 6px rgba(23,23,28,0.05), 0 28px 80px rgba(23,23,28,0.16), 0 0 60px rgba(124,58,237,${0.35 * heroGlow})`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: heroInnerR,
                  overflow: "hidden",
                  backgroundColor: "#17171C",
                }}
              >
                <Sequence from={REVEAL}>
                  <Loop durationInFrames={76}>
                    <OffthreadVideo
                      muted
                      src={staticFile("topview/beat1-hook.mp4")}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Loop>
                </Sequence>
                {/* REC chip */}
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 18px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.92)",
                    border: `1px solid ${TV.border}`,
                    fontFamily: FONT_MONO,
                    fontSize: 27,
                    color: TV.text,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: 1,
                    opacity: chromeA,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: TV.red,
                      opacity: recDot,
                    }}
                  />
                  REC 0:0{recSecs}
                </div>
                {/* progress */}
                <div
                  style={{
                    position: "absolute",
                    left: 22,
                    right: 22,
                    bottom: 20,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.45)",
                    opacity: chromeA,
                  }}
                >
                  <div
                    style={{
                      width: `${progW}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${TV.purple}, ${TV.violet})`,
                      boxShadow: `0 0 12px ${TV.purple}`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= act C: prompt chip ============================ */}
        {frame >= 238 && chipA > 0.001 && (
          <>
            {ringP > 0 && ringP < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: CHIP.cx - (110 + 380 * ringP),
                  top: CHIP.cy - (110 + 380 * ringP),
                  width: 2 * (110 + 380 * ringP),
                  height: 2 * (110 + 380 * ringP),
                  borderRadius: "50%",
                  border: `3px solid ${TV.violet}`,
                  opacity: 0.5 * (1 - ringP),
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: CHIP.cx - CHIP.w / 2,
                top: CHIP.cy - CHIP.h / 2,
                width: CHIP.w,
                height: CHIP.h,
                transform: `translateY(${26 * (1 - chipPop)}px) scale(${0.85 + 0.15 * chipPop})`,
                opacity: chipA,
                backgroundColor: "#EDE9FE",
                border: `1.5px solid rgba(124,58,237,${0.22 + 0.55 * lin([ENTER - 2, ENTER + 6, ENTER + 26], [0, 1, 0.15])})`,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                padding: "0 18px 0 26px",
                boxShadow:
                  "0 2px 6px rgba(23,23,28,0.05), 0 16px 44px rgba(23,23,28,0.12)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  border: "1.5px solid rgba(91,33,182,0.30)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#5B21B6",
                  fontSize: 30,
                  fontFamily: FONT_SANS,
                  flexShrink: 0,
                }}
              >
                +
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  marginLeft: 22,
                  fontFamily: FONT_MONO,
                  fontSize: 42,
                  color: "#5B21B6",
                  letterSpacing: 0.5,
                  whiteSpace: "pre",
                }}
              >
                {typed}
                <div
                  style={{
                    width: 5,
                    height: 46,
                    marginLeft: 6,
                    backgroundColor: TV.purple,
                    opacity: caretOn,
                  }}
                />
              </div>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: TV.purple,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontSize: 34,
                  transform: `scale(${sendScale})`,
                  boxShadow: "0 6px 18px rgba(124,58,237,0.35)",
                  flexShrink: 0,
                }}
              >
                ↑
              </div>
            </div>
          </>
        )}

        {/* ================= act C/D: the 10-grid ========================== */}
        {Array.from({ length: 10 }).map((_, i) => {
          const t0 = SPAWN[i];
          if (frame < t0) return null;
          // slot 0: the hero phone lands here with identical geometry, so
          // this tile skips the spawn pop and simply crossfades in over it.
          const handoff = i === 0;
          const s = handoff ? 1 : spr(t0);
          const a = lin([t0, t0 + (handoff ? 9 : 7)], [0, 1]);
          const popGlow = lin([t0, t0 + 18], [0.7, 0.2]);
          const kb = 1.07 + 0.03 * Math.sin((frame + i * 41) / 50);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: slotCx(i) - TILE_W / 2,
                top: slotCy(i) - TILE_H / 2,
                width: TILE_W,
                height: TILE_H,
                transform: `translateY(${46 * (1 - s)}px) scale(${0.62 + 0.38 * s})`,
                opacity: a,
                backgroundColor: TV.panel,
                border: "1.5px solid rgba(23,23,28,0.10)",
                borderRadius: 24,
                padding: 8,
                boxShadow: `0 2px 5px rgba(23,23,28,0.05), 0 16px 44px rgba(23,23,28,0.13), 0 0 0 3px rgba(124,58,237,${popGlow * 0.5})`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: 17,
                  overflow: "hidden",
                  backgroundColor: "#17171C",
                }}
              >
                <Img
                  src={staticFile(actorSrc(i))}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "50% 30%",
                    transform: `scale(${kb})`,
                  }}
                />
                <Badge label={pad2(i)} opacity={lin([t0 + 6, t0 + 14], [0, 1])} />
              </div>
            </div>
          );
        })}

        {/* ================= act D: docked source photo ==================== */}
        {frame >= DOCK_IN && (
          <div
            style={{
              position: "absolute",
              left: DOCK.cx - DOCK.w / 2,
              top: DOCK.cy - DOCK.h / 2,
              width: DOCK.w,
              height: DOCK.h,
              transform: `translateY(${dockBob}px) scale(${0.6 + 0.4 * dockS})`,
              opacity: dockA,
              backgroundColor: TV.panel,
              border: `1.5px solid ${TV.border}`,
              borderRadius: 18,
              padding: 10,
              boxShadow:
                "0 1px 3px rgba(23,23,28,0.05), 0 16px 44px rgba(23,23,28,0.13)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: DOCK.h - 20 - 44,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: TV.panel2,
              }}
            >
              <Img
                src={staticFile("topview/can-1.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 42%",
                }}
              />
            </div>
            <div
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_MONO,
                fontSize: 24,
                color: TV.muted,
              }}
            >
              can-1.png
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
