/**
 * HcP1Hook — beat 1 of the Higgs-Chat series (PAPER + LIME, REAL SHOTS).
 *
 * VO (never on screen): "Your ChatGPT is missing a five-minute upgrade that
 * makes it feel like a completely different tool."
 *
 * One continuous world, one camera (1080×1080):
 *   1. The REAL chatgpt.com home (HC.shots.home, 1600×880) lives inside a
 *      dark rounded window card with thin chrome on the paper world. It
 *      settles from a gentle push-in (0.94 → 1.0). Logged-out artifacts
 *      (Log in / Sign up pills, sidebar footer block + Log in button) are
 *      patched with GPT.bg rects. Caret blinks in the composer; the mono
 *      URL caption lands under the window.
 *   2. Dynamic zoom ramp (14f, EASE) into the sidebar — a soft lime ring
 *      lands on the REAL "Plugins" row; the cursor drifts toward it.
 *   3. The Higgsfield icon chip springs in on the paper beside the window
 *      and docks against the sidebar edge at the Plugins row — slide +
 *      settle, lime border switch + squash + expanding lime ripple on
 *      contact. The row ring hands off to the docked chip.
 *   4. Small pull-back to a clean composed hold (window + docked chip),
 *      two identical end keys (22f).
 *
 * On-screen text = real UI strings baked into the screenshot + chatgpt.com
 * (FACTS.url). No narration echo. No glow — lime via borders/fills only.
 */
import React from "react";
import {
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Cursor,
  EASE,
  GPT,
  HC,
  HIGGS,
  HiggsIcon,
  MONO,
  PaperWorld,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 170;

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
// World geometry — 1080×1080 viewport.
//
// Window card: x 80…1000, y 265…815 — 44px chrome + 506px body holding the
// full 1600×880 home capture at S = 920/1600 = 0.575. Sidebar reads at the
// window's left edge, so tight zooms keep paper visible left + top (the
// black UI never fills the frame).
// ---------------------------------------------------------------------------

const WIN = { x: 80, y: 265, w: 920, chrome: 44 };
const S = WIN.w / 1600; // 0.575 — source px → world px
const BODY_H = 880 * S; // 506
const WIN_H = WIN.chrome + BODY_H; // 550
const l = (v: number) => v * S; // source px → body-local px
const wx = (v: number) => WIN.x + v * S; // source px → world x
const wy = (v: number) => WIN.y + WIN.chrome + v * S; // source px → world y

// The real "Plugins" sidebar row (source x 8…252, y 132…168 — verified by
// crop). Ring rect padded a touch beyond the row band.
const RING = {
  x: wx(4),
  y: wy(128),
  w: (256 - 4) * S,
  h: (172 - 128) * S,
};
const ROW_CY = RING.y + RING.h / 2; // ≈ 395 — dock height for the chip

// Higgsfield chip — docks on the paper, right edge kissing the window's
// left edge at row height (never covers the sidebar rows themselves).
const CHIP = { size: 94, popX: -60, dockX: WIN.x - 47, cy: ROW_CY };

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  win: -6, // pre-rolls so frame 0 opens mid-drop
  url: 26, // caption lands during the wide hold
  ring: 56, // lime ring lands on the Plugins row
  cursor: 58, // cursor starts drifting from the composer
  cursorEnd: 84,
  cursorFade: 96,
  chipPop: 106, // chip springs in on the paper band
  chipSlide: 114, // plug-in slide toward the sidebar
  contact: 123, // dock contact — lime switch + squash + ripple
  ringFade: 126, // row ring hands off to the docked chip
} as const;

// ---------------------------------------------------------------------------
// ChatGPT window — dark card, thin chrome, real screenshot, GPT.bg patches
// ---------------------------------------------------------------------------

const ChatWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.win, { damping: 16, stiffness: 140 });
  // Composer caret — blinks on a 32f cycle once the window has settled.
  const caretOn = frame > 14 && frame % 32 < 18;
  return (
    <div
      style={{
        position: "absolute",
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN_H,
        borderRadius: 24,
        background: GPT.bg,
        boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
        overflow: "hidden",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px)`,
      }}
    >
      {/* thin chrome — distinct raised bar + hairline */}
      <div
        style={{
          height: WIN.chrome,
          background: GPT.panel,
          borderBottom: `1px solid ${GPT.line}`,
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "0 22px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#3F3F3F",
            }}
          />
        ))}
      </div>
      {/* the REAL chatgpt.com home capture (1600×880), full-bleed */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: WIN.chrome,
          width: WIN.w,
          height: BODY_H,
          overflow: "hidden",
          background: GPT.bg,
        }}
      >
        <Img
          src={staticFile(HC.shots.home)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1600 * S,
            height: 880 * S,
            display: "block",
          }}
        />
        {/* patch: logged-out "Log in / Sign up for free" pills (top-right) */}
        <div
          style={{
            position: "absolute",
            left: l(1366),
            top: 0,
            width: l(1600 - 1366),
            height: l(58),
            background: GPT.bg,
          }}
        />
        {/* patch: "Get responses tailored to you" block + sidebar Log in
            button (source y 678…880) — keeps the sidebar/main hairline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: l(676),
            width: l(258),
            height: l(880 - 676),
            background: GPT.bg,
          }}
        />
        {/* blinking caret before the "Ask anything" placeholder */}
        {caretOn ? (
          <div
            style={{
              position: "absolute",
              left: l(593),
              top: l(431),
              width: 1.6,
              height: l(460 - 431),
              background: GPT.text,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lime highlight ring — lands on the real Plugins row, hands off to the chip
// ---------------------------------------------------------------------------

const PluginsRing: React.FC = () => {
  const frame = useCurrentFrame();
  const land = useSpringAt(T.ring, { damping: 13, stiffness: 170 });
  const fade = interpolate(frame, [T.ringFade, T.ringFade + 12], [1, 0], {
    easing: EASE,
    ...CLAMP,
  });
  const o = Math.min(1, land * 1.5) * fade;
  if (o <= 0.002) return null;
  const scale = 1.18 - 0.18 * Math.min(1, land);
  return (
    <div
      style={{
        position: "absolute",
        left: RING.x,
        top: RING.y,
        width: RING.w,
        height: RING.h,
        borderRadius: 8,
        border: `2.5px solid ${HIGGS.lime}`,
        background: HIGGS.limeSoft,
        opacity: o,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Cursor — drifts from the composer toward the Plugins row during the hold
// ---------------------------------------------------------------------------

const DriftCursor: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [T.cursor, T.cursorEnd], [409, 218], {
    easing: EASE,
    ...CLAMP,
  });
  const y = interpolate(frame, [T.cursor, T.cursorEnd - 4], [560, 402], {
    easing: EASE,
    ...CLAMP,
  });
  const o =
    interpolate(frame, [T.cursor, T.cursor + 6], [0, 1], CLAMP) *
    interpolate(frame, [T.cursorFade, T.cursorFade + 10], [1, 0], CLAMP);
  if (o <= 0.002) return null;
  return <Cursor x={x} y={y} scale={0.45} opacity={o} />;
};

// ---------------------------------------------------------------------------
// Higgsfield chip — springs in beside the window, plugs into the sidebar
// ---------------------------------------------------------------------------

const HiggsChip: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = useSpringAt(T.chipPop, { damping: 13, stiffness: 190 });
  // Plug-in slide — light damping gives a small overshoot, then settle.
  const slide = useSpringAt(T.chipSlide, { damping: 14, stiffness: 120 });
  const press = tri(frame, T.contact, 3, 8); // squash against the window edge
  const rippleT = interpolate(
    frame,
    [T.contact, T.contact + 13],
    [0, 1],
    CLAMP,
  );
  const border = interpolateColors(
    frame,
    [T.contact - 2, T.contact + 4],
    [C.line, HIGGS.lime],
  );
  if (pop <= 0.002) return null;
  const cx = CHIP.popX + (CHIP.dockX - CHIP.popX) * slide;
  const s = CHIP.size;
  return (
    <>
      {/* expanding lime ripple on contact — stroke only, no glow */}
      {rippleT > 0 && rippleT < 1 ? (
        <div
          style={{
            position: "absolute",
            left: CHIP.dockX - s / 2,
            top: CHIP.cy - s / 2,
            width: s,
            height: s,
            borderRadius: 26,
            border: `2.5px solid ${HIGGS.lime}`,
            opacity: 0.65 * (1 - rippleT),
            transform: `scale(${1 + 0.3 * rippleT})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: cx - s / 2,
          top: CHIP.cy - s / 2,
          width: s,
          height: s,
          borderRadius: 24,
          background: C.card,
          border: `2.5px solid ${border}`,
          boxShadow: "0 16px 38px rgba(25,23,20,0.14)",
          display: "grid",
          placeItems: "center",
          opacity: Math.min(1, pop * 1.5),
          transform: `translateY(${(1 - pop) * 18}px) scale(${
            0.7 + 0.3 * Math.min(1, pop)
          }) scaleX(${1 - 0.06 * press})`,
          transformOrigin: "100% 50%",
        }}
      >
        <HiggsIcon size={64} />
      </div>
    </>
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
        top: 851,
        width: 1080,
        textAlign: "center",
        fontFamily: MONO,
        fontSize: 30,
        letterSpacing: 0.5,
        color: C.muted,
        opacity: o,
        transform: `translateY(${(1 - o) * 8}px)`,
      }}
    >
      chatgpt.com
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP1Hook: React.FC = () => {
  // Gentle push-in settle → wide hold → 14f zoom ramp into the sidebar
  // (Plugins row) → hold with ring + cursor drift → 12f ease out/left to
  // open paper for the chip → hold through the dock → 14f pull-back →
  // composed end hold on two identical keys (22f), centered on the
  // window + docked-chip cluster (world x −14…1000 → center 493).
  const cam = useCam({
    keys: [0, 24, 38, 52, 92, 104, 134, 148, 170],
    fx: [540, 540, 540, 236, 236, 170, 170, 493, 493],
    fy: [540, 540, 540, 396, 396, 398, 398, 540, 540],
    z: [0.94, 1.0, 1.0, 2.5, 2.5, 1.7, 1.7, 0.945, 0.945],
  });

  return (
    <PaperWorld cam={cam}>
      <ChatWindow />
      <UrlCaption />
      <PluginsRing />
      <HiggsChip />
      <DriftCursor />
    </PaperWorld>
  );
};
