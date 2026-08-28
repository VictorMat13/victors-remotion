/**
 * HcP3Plugins — beat 3 of the Higgs-Chat series (PAPER + LIME, REAL SHOTS).
 *
 * VO (never on screen): "Inside ChatGPT, click Plugins, hit Search plugins,
 * type Higgsfield, click Add, and sign in."
 *
 * REBUILT on the four pixel-aligned 2582×1724 walkthrough captures
 * (public/higgs-chat/shots/walkthrough/step1..step4), displayed at exactly
 * 0.5× (1291×862 body px — under native, retina-crisp). Because the captures
 * share one static viewport, straight crossfades between them read as the
 * real UI changing state. Timeline (185f ≈ 6.2s, matches the spoken line):
 *
 *   WIDE  0–24    real dark home (step1) inside the window card on paper.
 *   HIT 1 24–50   ramp to the sidebar → cursor clicks "Plugins" →
 *                 step1→step2 crossfade (the real page transition).
 *   HIT 2 50–85   ramp to the search box → click → step2→step3 (real focus
 *                 state) → the REAL typed "Higgsfield" pixels of step4
 *                 revealed glyph-by-glyph with a caret while the directory
 *                 filters down to the real result row (step4 base fade).
 *   HIT 3 85–130  ramp to the real result row → cursor clicks the real + →
 *   HIT 4 112–147 compact "Connect" popup in ChatGPT's UI language
 *                 (GPT.panel, r16, real Higgsfield icon, ONE white pill).
 *                 Cursor clicks Connect at 130.
 *   END  140–185  popup collapses toward the row; a lime check + ring pulse
 *                 lands on the + position; pull back to the full page —
 *                 row visibly added — 15f end hold on identical keys.
 *
 * On-screen text = real capture pixels + "Higgsfield" / "Connect" /
 * "chatgpt.com" only. No narration echo (no sign-in wording anywhere).
 * No glow. Paper visible at every zoom level.
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
  Cursor,
  EASE,
  FACTS,
  FONT,
  GPT,
  HIGGS,
  HiggsIcon,
  MONO,
  PaperWorld,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 185;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const tri = (frame: number, at: number, up: number, down: number) =>
  interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], CLAMP);

const useSpringAt = (
  at: number,
  config: { damping: number; stiffness: number; mass?: number },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};

// ---------------------------------------------------------------------------
// World geometry — the window card sits at world (0,0). The 2582×1724
// captures render at EXACTLY 0.5× (1291×862 body px, ≤ native), so every
// measured native coordinate below is halved once and used directly.
// Composites inherit the host's own scale by construction.
// ---------------------------------------------------------------------------

const SHOTS = {
  s1: "higgs-chat/shots/walkthrough/step1-inside-chatgpt.png",
  s2: "higgs-chat/shots/walkthrough/step2-clicked-plugins.png",
  s3: "higgs-chat/shots/walkthrough/step3-search-focused.png",
  s4: "higgs-chat/shots/walkthrough/step4-typed-higgsfield.png",
} as const;

const SHOT_W = 1291; // 2582 / 2
const SHOT_H = 862; // 1724 / 2
const WIN = { w: SHOT_W, title: 52, bodyH: SHOT_H } as const; // total h = 914

// Measured capture geometry (native px halved → body-local px):
const SIDE_ROW = { x: 6, y: 132, w: 246, h: 34, r: 8 }; // raised "Plugins" row
// "Higgsfield" glyph right-edges in step4 (H i g g s f i e l d), measured
// from the column ink profile of the capture. Index 0 = nothing revealed.
const CHAR_X = [954, 966.5, 970.5, 978.5, 986.5, 993.5, 999, 1002, 1010, 1014, 1022];
const REVEAL = { x: 954, y: 172, h: 29 }; // typed-pixels clip band
const TEXT_COVER = { x: 954, y: 172, w: 174, h: 27 }; // hides placeholder/word
const XCOVER = { x: 1132, y: 173.5, w: 24, h: 25 }; // hides the clear-× early
const PLUS = { cx: 743.25, cy: 323.75 }; // real + button on the result row
// Connect popup (ChatGPT UI language, host scale ≈ the row's proportions):
const PANEL = { x: 480, y: 356, w: 288, h: 144, r: 16 };
const BTN = { x: 24, y: 76, w: 240, h: 44, r: 22 }; // panel-local

// Logged-out artifacts — same patch works on all four aligned captures.
const PATCH_PILLS = { x: 1064, y: 0, w: SHOT_W - 1064, h: 50 };
const PATCH_FOOTER = { x: 0, y: 648, w: 258, h: SHOT_H - 648 };

// ---------------------------------------------------------------------------
// Beats (185f)
// ---------------------------------------------------------------------------

const T = {
  win: -6, // window opens mid-drop at frame 0
  caption: 10,
  click1: 39, // sidebar "Plugins" row
  swap12: 41, // step1 -> step2 (real page transition), 8f
  click2: 64, // search box
  swap23: 65, // step2 -> step3 (real focus state), 4f
  type: 70, // typed pixels reveal, 1.2 f/glyph → done at 82
  base4: 71, // step4 base fades in (directory filters to the result), 8f
  clearX: 83, // the capture's own clear-× appears once the word is typed
  click3: 108, // the real + on the result row
  popup: 112, // Connect popup springs in
  click4: 130, // Connect
  popupOut: 140, // popup collapses toward the row, 7f
  check: 145, // lime check lands on the + position
  ring: 150, // ring pulse on the check
  cursorOut: 148,
} as const;

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const Ripple: React.FC<{ cx: number; cy: number; at: number; color: string }> = ({
  cx,
  cy,
  at,
  color,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 10], [0, 1], CLAMP);
  if (t <= 0 || t >= 1) return null;
  return (
    <svg
      width={72}
      height={72}
      style={{ position: "absolute", left: cx - 36, top: cy - 36 }}
    >
      <circle
        cx={36}
        cy={36}
        r={8 + 20 * t}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        opacity={0.55 * (1 - t)}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The ChatGPT window — four real captures + host-scale composites
// ---------------------------------------------------------------------------

const ChatWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.win, { damping: 16, stiffness: 140 });

  // Base crossfades between the pixel-aligned captures.
  const s2O = interpolate(frame, [T.swap12, T.swap12 + 8], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const s3O = interpolate(frame, [T.swap23, T.swap23 + 4], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const s4O = interpolate(frame, [T.base4, T.base4 + 8], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });

  // Typed-pixels reveal — steps through the capture's own glyph boundaries.
  const charIdx = Math.min(
    CHAR_X.length - 1,
    Math.max(0, Math.floor((frame - T.type) / 1.2) + 1),
  );
  const edge = frame < T.type ? CHAR_X[0] : CHAR_X[charIdx];
  const typing = frame >= T.type && charIdx < CHAR_X.length - 1;
  // Placeholder/word cover: from the first keystroke the box text area is
  // painted with the pill's interior fill; the reveal clip draws the real
  // typed pixels back on top glyph by glyph.
  const coverOn = frame >= T.type;
  const xCoverO = interpolate(frame, [T.clearX, T.clearX + 4], [1, 0], {
    easing: EASE,
    ...CLAMP,
  });
  const caretOn = frame >= T.click2 + 1 && frame < 92;
  const caretO = caretOn && (typing || frame % 16 < 9) ? 1 : 0;

  // Click cues.
  const flash1 = tri(frame, T.click1, 3, 9); // sidebar row
  const press4 = tri(frame, T.click4, 2, 6); // Connect button

  // Connect popup.
  const popIn = useSpringAt(T.popup, { damping: 14, stiffness: 170 });
  const collapseT = interpolate(frame, [T.popupOut, T.popupOut + 7], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const popO = Math.min(1, popIn * 1.6) * (1 - collapseT);
  const popScale = (0.88 + 0.12 * Math.min(1, popIn)) * (1 - 0.18 * collapseT);

  // Lime check on the + position (composited over the real row).
  const checkIn = interpolate(frame, [T.check, T.check + 5], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const chipPop = useSpringAt(T.check, { damping: 13, stiffness: 190 });
  const drawT = interpolate(frame, [T.check + 3, T.check + 13], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  const ringT = interpolate(frame, [T.ring, T.ring + 12], [0, 1], CLAMP);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: WIN.w,
        height: WIN.title + WIN.bodyH,
        borderRadius: 24,
        background: GPT.bg,
        boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
        overflow: "hidden",
        opacity: Math.min(1, enter * 1.4),
        transform: `translateY(${(1 - enter) * 30}px)`,
      }}
    >
      {/* titlebar */}
      <div
        style={{
          height: WIN.title,
          background: GPT.panel,
          borderBottom: `1px solid ${GPT.line}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 24px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ width: 13, height: 13, borderRadius: 999, background: "#3A3A3A" }}
          />
        ))}
      </div>

      {/* body — capture coordinates at 0.5× */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: WIN.title,
          width: WIN.w,
          height: WIN.bodyH,
          overflow: "hidden",
          background: GPT.bg,
        }}
      >
        {s2O < 1 ? (
          <Img
            src={staticFile(SHOTS.s1)}
            style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, height: SHOT_H }}
          />
        ) : null}
        {s2O > 0 && s3O < 1 ? (
          <Img
            src={staticFile(SHOTS.s2)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SHOT_W,
              height: SHOT_H,
              opacity: s2O,
            }}
          />
        ) : null}
        {s3O > 0 && s4O < 1 ? (
          <Img
            src={staticFile(SHOTS.s3)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SHOT_W,
              height: SHOT_H,
              opacity: s3O,
            }}
          />
        ) : null}
        {s4O > 0 ? (
          <Img
            src={staticFile(SHOTS.s4)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SHOT_W,
              height: SHOT_H,
              opacity: s4O,
            }}
          />
        ) : null}

        {/* patches: logged-out artifacts (same regions on all four captures) */}
        <div
          style={{
            position: "absolute",
            left: PATCH_PILLS.x,
            top: PATCH_PILLS.y,
            width: PATCH_PILLS.w,
            height: PATCH_PILLS.h,
            background: GPT.bg,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PATCH_FOOTER.x,
            top: PATCH_FOOTER.y,
            width: PATCH_FOOTER.w,
            height: PATCH_FOOTER.h,
            background: GPT.bg,
          }}
        />

        {/* HIT 1 — click flash on the real raised sidebar row */}
        {flash1 > 0 ? (
          <div
            style={{
              position: "absolute",
              left: SIDE_ROW.x,
              top: SIDE_ROW.y,
              width: SIDE_ROW.w,
              height: SIDE_ROW.h,
              borderRadius: SIDE_ROW.r,
              background: "#FFFFFF",
              opacity: 0.12 * flash1,
            }}
          />
        ) : null}

        {/* HIT 2 — placeholder/word cover + glyph-wise reveal of the real
            typed pixels + caret. The clear-× stays hidden until typed. */}
        {coverOn ? (
          <div
            style={{
              position: "absolute",
              left: TEXT_COVER.x,
              top: TEXT_COVER.y,
              width: TEXT_COVER.w,
              height: TEXT_COVER.h,
              background: GPT.composer,
            }}
          />
        ) : null}
        {s2O > 0 && xCoverO > 0 ? (
          <div
            style={{
              position: "absolute",
              left: XCOVER.x,
              top: XCOVER.y,
              width: XCOVER.w,
              height: XCOVER.h,
              borderRadius: 999,
              background: GPT.composer,
              opacity: s2O * xCoverO,
            }}
          />
        ) : null}
        {coverOn && edge > REVEAL.x ? (
          <div
            style={{
              position: "absolute",
              left: REVEAL.x,
              top: REVEAL.y,
              width: edge - REVEAL.x,
              height: REVEAL.h,
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile(SHOTS.s4)}
              style={{
                position: "absolute",
                left: -REVEAL.x,
                top: -REVEAL.y,
                width: SHOT_W,
                height: SHOT_H,
              }}
            />
          </div>
        ) : null}
        {caretO > 0 ? (
          <div
            style={{
              position: "absolute",
              left: edge + 2.5,
              top: 175,
              width: 2,
              height: 22,
              background: GPT.text,
              opacity: caretO,
            }}
          />
        ) : null}

        {/* END — lime check lands where the real + was */}
        {checkIn > 0 ? (
          <>
            <div
              style={{
                position: "absolute",
                left: PLUS.cx - 15.5,
                top: PLUS.cy - 15.5,
                width: 31,
                height: 31,
                background: GPT.bg,
                opacity: checkIn,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: PLUS.cx - 16,
                top: PLUS.cy - 16,
                width: 32,
                height: 32,
                borderRadius: 999,
                background: HIGGS.limeSoft,
                border: `1.5px solid ${HIGGS.limeLine}`,
                opacity: checkIn,
                transform: `scale(${0.7 + 0.3 * Math.min(1, chipPop)})`,
              }}
            >
              <svg width={29} height={29} viewBox="0 0 29 29" style={{ display: "block" }}>
                <path
                  d="M 8 15 L 12.5 19.5 L 21 9.5"
                  fill="none"
                  stroke={HIGGS.lime}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - drawT}
                />
              </svg>
            </div>
            {ringT > 0 && ringT < 1 ? (
              <svg
                width={90}
                height={90}
                style={{
                  position: "absolute",
                  left: PLUS.cx - 45,
                  top: PLUS.cy - 45,
                }}
              >
                <circle
                  cx={45}
                  cy={45}
                  r={17 + 20 * ringT}
                  fill="none"
                  stroke={HIGGS.lime}
                  strokeWidth={2.2}
                  opacity={0.55 * (1 - ringT)}
                />
              </svg>
            ) : null}
          </>
        ) : null}

        {/* click ripples (body-local) */}
        <Ripple cx={80} cy={149} at={T.click1} color="rgba(255,255,255,0.9)" />
        <Ripple cx={1039} cy={186} at={T.click2} color="rgba(255,255,255,0.9)" />
        <Ripple cx={PLUS.cx} cy={PLUS.cy} at={T.click3} color="rgba(255,255,255,0.9)" />

        {/* HIT 4 — Connect popup in ChatGPT's UI language, near the row */}
        {popO > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: PANEL.x,
              top: PANEL.y,
              width: PANEL.w,
              height: PANEL.h,
              transformOrigin: "90% 0%",
              transform: `scale(${popScale})`,
              opacity: popO,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: PANEL.r,
                background: GPT.panel,
                border: `1px solid ${GPT.line}`,
                boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
              }}
            />
            <div style={{ position: "absolute", left: 24, top: 20 }}>
              <HiggsIcon size={40} radius={10} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 76,
                top: 29,
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 17,
                lineHeight: "22px",
                letterSpacing: -0.2,
                color: GPT.text,
                whiteSpace: "nowrap",
              }}
            >
              {FACTS.higgsRowName}
            </div>
            <div
              style={{
                position: "absolute",
                left: BTN.x,
                top: BTN.y,
                width: BTN.w,
                height: BTN.h,
                borderRadius: BTN.r,
                background: GPT.white,
                display: "grid",
                placeItems: "center",
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: -0.1,
                color: C.ink,
                transform: `scale(${1 - 0.04 * press4})`,
              }}
            >
              Connect
            </div>
          </div>
        ) : null}
        {/* Connect click ripple above the popup */}
        <Ripple cx={624} cy={454} at={T.click4} color={HIGGS.lime} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// URL caption on the paper below the window (allowed real string)
// ---------------------------------------------------------------------------

const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [T.caption, T.caption + 12], [0, 1], {
    easing: EASE,
    ...CLAMP,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 940,
        width: WIN.w,
        textAlign: "center",
        fontFamily: MONO,
        fontSize: 30,
        letterSpacing: 0.5,
        color: C.muted,
        opacity: o,
        transform: `translateY(${(1 - o) * 8}px)`,
      }}
    >
      {FACTS.url}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cursor — one continuous world path, press dips at each click
// ---------------------------------------------------------------------------

const CursorLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const keys = [0, 34, 52, 62, 92, 106, 114, 126, DURATION_IN_FRAMES];
  const x = interpolate(
    frame,
    keys,
    [860, 80, 80, 1039, 1039, PLUS.cx, PLUS.cx, 624, 624],
    { easing: EASE, ...CLAMP },
  );
  const y = interpolate(
    frame,
    keys,
    [660, 201, 201, 238, 238, PLUS.cy + 52, PLUS.cy + 52, 506, 506],
    { easing: EASE, ...CLAMP },
  );
  const press =
    tri(frame, T.click1, 2, 5) +
    tri(frame, T.click2, 2, 5) +
    tri(frame, T.click3, 2, 5) +
    tri(frame, T.click4, 2, 5);
  const o = interpolate(frame, [T.cursorOut, T.cursorOut + 8], [1, 0], {
    easing: EASE,
    ...CLAMP,
  });
  if (o <= 0) return null;
  return <Cursor x={x} y={y} scale={0.62 * (1 - 0.1 * press)} opacity={o} />;
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP3Plugins: React.FC = () => {
  // hold → move → hold, 12–15f ramps, four hits; fy stays shallow through
  // the hits so a paper strip rides the top of frame at every zoom; the
  // last two keys are identical for the 15f end hold.
  const cam = useCam({
    keys: [0, 24, 36, 50, 62, 85, 97, 158, 170, 185],
    fx: [645, 645, 240, 240, 1040, 1040, 560, 560, 645, 645],
    fy: [460, 460, 210, 210, 240, 240, 270, 270, 460, 460],
    z: [0.71, 0.71, 1.9, 1.9, 1.8, 1.8, 1.7, 1.7, 0.71, 0.71],
  });

  return (
    <PaperWorld cam={cam}>
      <ChatWindow />
      <Caption />
      <CursorLayer />
    </PaperWorld>
  );
};
