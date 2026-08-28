/**
 * GtP5Antigravity — beat 5 of the Google Tools series (PAPER + GOOGLE BLUE).
 *
 * VO (never on screen): "Fourth, Antigravity. A full coding editor like
 * Cursor, and the free version runs Gemini 3 Pro and even Claude."
 *
 * One continuous world, one camera:
 *   1. The real "Google Antigravity" lockup drops onto a centered white card;
 *      the Cursor chip pops beside it and the cluster re-flows to stay
 *      centered (identity only).
 *   2. An editor window (single chrome level: distinct titlebar + hairline,
 *      16:10 body) opens below, cover-cropping the REAL new-chat screenshot
 *      to the inside of its gray card. The shot's own open worktree menu is
 *      patched out with the shot's sampled gray. Camera pushes in tight on
 *      the composer so the host UI reads big.
 *   3. Payoff: a model-picker dropdown in the shot's own light language —
 *      Gemini 3 Pro / Gemini 3.5 Flash / Claude Sonnet 4.5 / GPT-OSS 120B.
 *      Selection lands on Gemini 3 Pro, snaps to Claude Sonnet 4.5, and the
 *      composer chip itself updates to "Claude Sonnet 4.5" so the end state
 *      is consistent. Long settled hold, camera static from the push-in.
 *
 * On-screen text = model names + UI strings baked into the real screenshot
 * + the product URL. No narration echo. No glow.
 */
import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  DISPLAY,
  EASE,
  FONT,
  GOOGLE,
  GT,
  LogoImg,
  MONO,
  PaperWorld,
  SPRINGS,
  useCam,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], CLAMP);

/** Local spring-entrance helper (kit's useEnter is typed to SPRINGS.pop). */
const useSpringAt = (
  at: number,
  config: { damping: number; stiffness: number; mass?: number },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

// ---------------------------------------------------------------------------
// World geometry — 1080×1920 viewport.
//
// Top cluster: lockup card (110…810) + Cursor chip (830…970), y 260…490.
// The lone card opens centered (shifted +80) and re-flows left as the chip
// pops so the cluster is centered in both states.
//
// Editor window: x 80…1000, y 560…1191 — 56px titlebar + 575px body (16:10).
// The 1500² screenshot is cropped to the INSIDE of its gray card (source
// x 124…1376 → scale S = 920/1252) with the vertical window starting at
// source y 460, so exactly one level of chrome remains (our titlebar).
// ---------------------------------------------------------------------------

const LOCK = { x: 110, y: 260, w: 700, h: 230 };
const CHIP = { x: 830, y: 305, s: 140 };
/** Horizontal shift that centers the lone lockup card before the chip pops. */
const LONE_SHIFT = (1080 - LOCK.w) / 2 - LOCK.x; // 80

const ED = { x: 80, y: 560, w: 920, chrome: 56, bodyH: 575 }; // body 16:10
const SRC = { x: 124, y: 460 }; // crop origin, inside the shot's gray card
const S = ED.w / 1252; // 0.7348 — gray-card interior width → body width
const sx = (v: number) => ED.x + (v - SRC.x) * S; // source px → world x
const sy = (v: number) => ED.y + ED.chrome + (v - SRC.y) * S; // → world y
const lx = (v: number) => (v - SRC.x) * S; // source px → body-local x
const ly = (v: number) => (v - SRC.y) * S; // → body-local y

// Colors sampled from the screenshot (2026-08-09 audit pass).
const SHOT = {
  cardGray: "#EEEEEE", // the shot's page/card gray (patch fill)
  composerGray: "#F3F3F3", // composer input surface
  text: "#484848", // "Gemini 3.5 Flash" chip text
  chevron: "#5F6368",
} as const;

// The "Gemini 3.5 Flash ⌄" selector inside the real screenshot (text+chevron
// source px 349…611 × 804…825; the "+" button at 280…301 stays excluded).
const PILL = {
  x: sx(349) - 8,
  y: sy(796) - 5,
  w: (611 - 349) * S + 16,
  h: (834 - 796) * S + 10,
};
const CHEV = { x: sx(604), y: sy(814) }; // chevron center (click target)

// Model-picker dropdown, anchored under the selector, inside the window.
const PANEL = { x: 245, y: 906, w: 390, padY: 8, rowH: 64 };
const MODELS: { name: string; icon: string | null; iconSize: number }[] = [
  { name: "Gemini 3 Pro", icon: GT.logos.gemini, iconSize: 24 },
  { name: "Gemini 3.5 Flash", icon: GT.logos.gemini, iconSize: 24 },
  // Claude mark renders ~20% larger than Gemini at equal box — normalize
  // optical size (~22px) on a common center.
  { name: "Claude Sonnet 4.5", icon: GT.logos.claude, iconSize: 20 },
  { name: "GPT-OSS 120B", icon: null, iconSize: 0 },
];
const PANEL_H = PANEL.padY * 2 + PANEL.rowH * MODELS.length; // 272 → fits
// inside the window body (panel bottom 1178 < window bottom 1191).

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  lockCard: -6, // pre-rolls so frame 0 opens mid-drop
  lockup: -4, // rides the drop — the card is never a hollow box
  chip: 16, // Cursor chip pops; cluster re-flows to stay centered
  editor: 50,
  url: 84, // mono URL caption under the window (action during hold)
  ring: 128, // hover pill on the selector
  ripple: 132, // click pulse on the chevron
  panel: 136,
  rows: [140, 146, 152, 158],
  hiIn: 165, // selection lands on "Gemini 3 Pro"
  check: 171,
  hiMove: [186, 189] as const, // snaps to "Claude Sonnet 4.5" (3 frames)
  claudePop: 189,
  chipSwap: 198, // composer chip updates to the selected model
} as const;

// ---------------------------------------------------------------------------
// Top cluster — real Antigravity lockup on white + Cursor mark chip
// ---------------------------------------------------------------------------

const TopCluster: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = useSpringAt(T.lockCard, { damping: 16, stiffness: 150 });
  const chipIn = useEnter(T.chip, SPRINGS.pop);
  const shift = interpolate(frame, [T.chip - 2, T.chip + 12], [LONE_SHIFT, 0], {
    easing: EASE,
    ...CLAMP,
  });
  const lockO = interpolate(frame, [T.lockup, T.lockup + 12], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const lockW = 620;
  const lockH = (lockW * 117) / 869; // matches the fixed 869×117 viewBox
  return (
    <>
      <Card
        x={LOCK.x}
        y={LOCK.y}
        w={LOCK.w}
        h={LOCK.h}
        r={26}
        enter={cardIn}
        style={{
          transform: `translate(${shift}px, ${(1 - cardIn) * 26}px)`,
        }}
      >
        <Img
          src={staticFile(GT.logos.antigravityLockup)}
          style={{
            position: "absolute",
            // −6px optical shift: the SVG carries lead-in bearing on the left.
            left: (LOCK.w - lockW) / 2 - 6,
            top: (LOCK.h - lockH) / 2,
            width: lockW,
            height: lockH,
            opacity: lockO,
            transform: `translateY(${(1 - lockO) * 14}px)`,
          }}
        />
      </Card>
      <Card
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.s}
        h={CHIP.s}
        r={30}
        enter={chipIn}
        style={{ display: "grid", placeItems: "center" }}
      >
        {/* the Cursor mark is itself a dark tile — let it fill ~70% */}
        <LogoImg src={GT.logos.cursor} size={98} />
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
// Editor window — one chrome level: distinct titlebar + 16:10 shot body
// ---------------------------------------------------------------------------

const EditorCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.editor, { damping: 16, stiffness: 140 });
  const swapT = interpolate(frame, [T.chipSwap, T.chipSwap + 6], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  return (
    <Card
      x={ED.x}
      y={ED.y}
      w={ED.w}
      h={ED.chrome + ED.bodyH}
      r={24}
      enter={enter}
      style={{ overflow: "hidden" }}
    >
      {/* titlebar — distinct fill + hairline so the dots don't float */}
      <div
        style={{
          height: ED.chrome,
          background: "#EAE4DA",
          borderBottom: "1px solid #D9D1C2",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 26px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              background: "#C4BAA9",
            }}
          />
        ))}
      </div>
      {/* the REAL new-chat screenshot — cover-cropped inside its gray card */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: ED.chrome,
          width: ED.w,
          height: ED.bodyH,
          overflow: "hidden",
          background: SHOT.cardGray,
        }}
      >
        <Img
          src={staticFile(GT.shots.antigravityChat)}
          style={{
            position: "absolute",
            left: -SRC.x * S,
            top: -SRC.y * S,
            width: 1500 * S,
            height: 1500 * S,
            display: "block",
          }}
        />
        {/* patch over the shot's own open "Local / New Worktree" menu —
            covered from the first frame with the shot's sampled gray, our
            dropdown replaces it */}
        <div
          style={{
            position: "absolute",
            left: lx(214),
            top: ly(952),
            width: (644 - 214) * S,
            height: (1192 - 952) * S,
            background: SHOT.cardGray,
          }}
        />
        {/* composer chip updates after the selection lands on Claude */}
        {swapT > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: lx(336),
                top: ly(790),
                width: (630 - 336) * S,
                height: (840 - 790) * S,
                background: SHOT.composerGray,
                opacity: swapT,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: lx(349),
                top: ly(814.5) - 15,
                height: 30,
                display: "flex",
                alignItems: "center",
                gap: 9,
                opacity: swapT,
              }}
            >
              <LogoImg src={GT.logos.claude} size={21} />
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 500,
                  fontSize: 23,
                  color: SHOT.text,
                  whiteSpace: "nowrap",
                }}
              >
                Claude Sonnet 4.5
              </div>
              <svg width={14} height={9} viewBox="0 0 14 9">
                <path
                  d="M 1.5 1.5 L 7 7 L 12.5 1.5"
                  fill="none"
                  stroke={SHOT.chevron}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Click cue — hover pill on the selector only, then a short expanding pulse
// ---------------------------------------------------------------------------

const ControlCue: React.FC = () => {
  const frame = useCurrentFrame();
  const pillIn = interpolate(frame, [T.ring, T.ring + 6], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  // The pill hands off to the dropdown — fades once the panel owns the beat.
  const pillOut = interpolate(frame, [T.panel + 2, T.panel + 10], [1, 0], {
    easing: EASE,
    ...CLAMP,
  });
  const press = tri(frame, T.ripple, 3, 6); // quick press dip
  const pulseT = interpolate(frame, [T.ripple, T.ripple + 8], [0, 1], CLAMP);
  const pillO = pillIn * pillOut;
  if (pillO <= 0 && (pulseT <= 0 || pulseT >= 1)) return null;
  return (
    <>
      {pillO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: PILL.x,
            top: PILL.y,
            width: PILL.w,
            height: PILL.h,
            borderRadius: 10,
            background: "rgba(25,23,20,0.035)",
            border: "1px solid rgba(25,23,20,0.08)",
            opacity: pillO,
            transform: `scale(${1 - 0.02 * press})`,
          }}
        />
      ) : null}
      {pulseT > 0 && pulseT < 1 ? (
        <svg
          width={80}
          height={80}
          style={{
            position: "absolute",
            left: CHEV.x - 40,
            top: CHEV.y - 40,
          }}
        >
          <circle
            cx={40}
            cy={40}
            r={8 + 20 * pulseT}
            fill="none"
            stroke="rgba(25,23,20,0.4)"
            strokeWidth={2.5}
            opacity={0.4 * (1 - pulseT)}
          />
        </svg>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Model-picker dropdown — matched to the host UI's scale and language
// ---------------------------------------------------------------------------

const ModelDropdown: React.FC = () => {
  const frame = useCurrentFrame();
  const panelIn = useSpringAt(T.panel, { damping: 15, stiffness: 150 });
  const hiIn = useEnter(T.hiIn, SPRINGS.pop);
  const rowIdx = interpolate(frame, [T.hiMove[0], T.hiMove[1]], [0, 2], {
    easing: EASE,
    ...CLAMP,
  });
  const checkT = interpolate(frame, [T.check, T.check + 9], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const claudePop = tri(frame, T.claudePop, 5, 12);
  const rowIns = [
    useEnter(T.rows[0], SPRINGS.pop),
    useEnter(T.rows[1], SPRINGS.pop),
    useEnter(T.rows[2], SPRINGS.pop),
    useEnter(T.rows[3], SPRINGS.pop),
  ];
  if (panelIn <= 0.001) return null;

  // The panel GROWS one row slot ahead of each row sliding in — it expands
  // out of the control and is never a hollow box waiting for content.
  const grown = T.rows.reduce(
    (acc, at) =>
      acc +
      interpolate(frame, [at - 6, at + 4], [0, 1], { easing: EASE, ...CLAMP }),
    0,
  );
  const h = Math.min(PANEL_H, PANEL.padY * 2 + PANEL.rowH * grown);

  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: h,
        borderRadius: 16,
        background: "#FFFFFF",
        border: "1.5px solid rgba(25,23,20,0.10)",
        boxShadow: "0 14px 36px rgba(25,23,20,0.16)",
        opacity: Math.min(1, panelIn * 1.6),
        overflow: "hidden",
      }}
    >
      {/* selection highlight — lands on Gemini 3 Pro, snaps to Claude */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: PANEL.padY + rowIdx * PANEL.rowH + 4,
          width: PANEL.w - 16,
          height: PANEL.rowH - 8,
          borderRadius: 12,
          background: GOOGLE.blueSoft,
          border: `1.5px solid ${GOOGLE.blueLine}`,
          opacity: Math.min(1, hiIn),
          transform: `scale(${0.96 + 0.04 * Math.min(1, hiIn)})`,
        }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 28 28"
          style={{
            position: "absolute",
            right: 14,
            top: (PANEL.rowH - 8) / 2 - 14,
          }}
        >
          <path
            d="M 5 15 L 11.5 21 L 23 7.5"
            fill="none"
            stroke={GOOGLE.blue}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - checkT}
          />
        </svg>
      </div>

      {/* rows — shared gutter so every label's left edge aligns */}
      {MODELS.map((m, i) => {
        const e = rowIns[i];
        const pop = m.name === "Claude Sonnet 4.5" ? 1 + 0.12 * claudePop : 1;
        return (
          <div
            key={m.name}
            style={{
              position: "absolute",
              left: 0,
              top: PANEL.padY + i * PANEL.rowH,
              width: PANEL.w,
              height: PANEL.rowH,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 20px",
              opacity: Math.min(1, e * 1.4),
              transform: `translateY(${(1 - e) * 8}px)`,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                display: "grid",
                placeItems: "center",
              }}
            >
              {m.icon ? (
                <LogoImg
                  src={m.icon}
                  size={m.iconSize}
                  style={{ transform: `scale(${pop})` }}
                />
              ) : (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    border: "2.5px solid #9AA0A6",
                  }}
                />
              )}
            </div>
            {m.icon ? (
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  fontSize: 26,
                  color: "#1F2023",
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 23,
                  color: "#3C4043",
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// URL caption under the window (allowed string; fills the lower paper band)
// ---------------------------------------------------------------------------

const UrlCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [T.url, T.url + 12], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 1240,
        width: 1080,
        textAlign: "center",
        fontFamily: MONO,
        fontSize: 31,
        letterSpacing: 0.5,
        color: C.muted,
        opacity: o,
        transform: `translateY(${(1 - o) * 8}px)`,
      }}
    >
      antigravity.google
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP5Antigravity: React.FC = () => {
  // Hold on the centered lockup → 24f travel down as the editor window opens
  // → hold (URL caption lands) → 24f push in tight on the composer (host UI
  // reads big, symmetric L/R crop, composer+dropdown mass at frame center)
  // → camera fully static through the dropdown payoff and the end hold
  // (identical keys from the push-in to the last frame — zero drift).
  const cam = useCam({
    keys: [0, 46, 70, 102, 126, 234, 260],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [380, 380, 875, 875, 972, 972, 972],
    z: [1.06, 1.06, 0.98, 0.98, 1.55, 1.55, 1.55],
  });

  return (
    <PaperWorld cam={cam}>
      <TopCluster />
      <EditorCard />
      <UrlCaption />
      <ControlCue />
      <ModelDropdown />
    </PaperWorld>
  );
};
