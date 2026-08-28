/**
 * HcP4Upload — beat 4 of the Higgs-Chat series (PAPER + LIME, REAL SHOTS).
 *
 * VO (never on screen): "Upload one product photo and say, 'Turn this into a
 * UGC video.' The image lands directly in the chat."
 *
 * CONTINUITY CONTRACT: this clip ENDS on exactly the state HcP5Animate OPENS
 * on — same window card (x110 y140 860×789 r20), same 1024px narrow-browser
 * crop of the real home capture (S = 0.8398), same patches, same
 * bottom-anchored chat stack (Allipop packshot attachment above the prompt
 * bubble),
 * same conversation composer at bl(808) with idle caret, and the same
 * camera key (540, 535, 0.97). Cut P4 → P5 is seamless.
 *
 * One continuous world, one camera:
 *   1. 0–24    Real home state on paper (recomposited greeting + composer,
 *              centered like the capture) → 14f ramp to the composer.
 *   2. 24–84   Hold: cursor clicks the + → the composer grows and a rounded
 *              attachment thumb of the REAL product photo pops in → the
 *              prompt types at host scale → cursor presses send.
 *   3. 84–100  Ease down/in while the message posts: the composer docks to
 *              the conversation position, then the user bubble enters and
 *              THE IMAGE LANDS as the chat attachment card above it.
 *   4. 100–134 Hero hold on the landed card; a flat lime upload arc
 *              completes around it (no glow), then fades.
 *   5. 134–170 Settle back to P5's exact opening framing; 20f end hold on
 *              identical keys.
 *
 * On-screen text = real capture strings + the typed user prompt. No
 * narration echo. Paper visible around the window at every framing.
 */
import React from "react";
import {
  Easing,
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
  Cursor,
  EASE,
  FACTS,
  GPT,
  HC,
  HIGGS,
  MONO,
  PaperWorld,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 170;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const EOPT = { easing: EASE, ...CLAMP };

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
// Window geometry — IDENTICAL to HcP5Animate: the capture (1600×880) cropped
// to source x 0…1024 (real narrow-browser window: full sidebar + snug chat
// canvas). bl() maps source px → body-local world px at the host UI's scale.
// ---------------------------------------------------------------------------

const WIN = { x: 110, y: 140, w: 860, chrome: 50 };
const CROP_W = 1024;
const S = WIN.w / CROP_W; // 0.8398
const bl = (v: number) => v * S;
const BODY_H = bl(880); // 739

const COL = { x: bl(292), w: bl(700) };
const CMP = { x: bl(292), w: bl(700), h: bl(48) };
const CMP_HOME_Y = bl(424); // home-state (centered) composer position
const CMP_CONV_Y = bl(808); // conversation position — P5's opening state
const ANCHOR = bl(780); // chat stack bottom, above the docked composer
const FS = bl(16); // host message/composer text size
const BUBBLE_R = bl(18);

const PHOTO_W = bl(240); // Allipop packshot attachment — native 1536×2752
const PHOTO_H = (PHOTO_W * 2752) / 1536; // 361.2 — portrait product photo
const EXT_H = bl(76); // grown attachment row height inside the composer

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  win: -6, // window pre-rolls so frame 0 opens mid-settle
  caption: [6, 16, 26, 36] as const, // url fades in, then out on the push
  cursorIn: 18,
  plusPress: 32,
  grow: 40, // composer grows the attachment row
  thumb: 44, // photo thumb pops in
  type: 50, // 26 chars at 1.4/frame → done ~68.6
  sendPress: 80,
  clear: 84, // input clears + greeting vanishes (real post behavior)
  dock: [84, 94] as const, // composer travels to the conversation position
  reset: 96, // placeholder + idle caret + voice bars return
  bubble: 96, // prompt bubble enters the stack
  photo: 98, // THE IMAGE LANDS (settles ~112, inside the hero hold)
  arc: [110, 134] as const, // lime upload arc completes around the card
  arcFade: [136, 146] as const,
  cursorOut: [88, 96] as const,
} as const;

const TYPE_SPEED = 1.4;

// ---------------------------------------------------------------------------
// Small glyphs — copied verbatim from HcP5Animate (shared visual language)
// ---------------------------------------------------------------------------

const PlusGlyph: React.FC<{ dip?: number }> = ({ dip = 1 }) => (
  <svg width={15} height={15} viewBox="0 0 15 15" style={{ transform: `scale(${dip})` }}>
    <path
      d="M7.5 1.8 V13.2 M1.8 7.5 H13.2"
      stroke="#CFCFCF"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const MicGlyph: React.FC = () => (
  <svg width={16} height={19} viewBox="0 0 16 19">
    <rect
      x={5}
      y={1.2}
      width={6}
      height={10.2}
      rx={3}
      fill="none"
      stroke={GPT.muted}
      strokeWidth={1.5}
    />
    <path
      d="M2.6 8.8 a5.4 5.4 0 0 0 10.8 0 M8 14.4 V17.2"
      fill="none"
      stroke={GPT.muted}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Composer — P5's conversation composer, extended with the P4-only states:
// home position → attachment row growth → typing → send → dock → idle reset.
// ---------------------------------------------------------------------------

const Composer: React.FC = () => {
  const frame = useCurrentFrame();
  const nChars = Math.max(0, Math.floor((frame - T.type) * TYPE_SPEED));
  const typed =
    frame >= T.clear
      ? ""
      : FACTS.promptUgc.slice(0, Math.min(nChars, FACTS.promptUgc.length));
  const typing = frame >= T.type && frame < T.type + FACTS.promptUgc.length / TYPE_SPEED;
  const blink = typing ? 1 : frame % 24 < 13 ? 1 : 0;

  // voice bars ↔ send arrow crossfade while text is present (P5 pattern)
  const sendT =
    interpolate(frame, [T.type + 1, T.type + 6], [0, 1], EOPT) *
    interpolate(frame, [T.reset, T.reset + 5], [1, 0], EOPT);
  const press = interpolate(
    frame,
    [T.sendPress, T.sendPress + 2, T.sendPress + 7],
    [0, 1, 0],
    CLAMP,
  );
  const plusDip = 1 - 0.14 * tri(frame, T.plusPress, 3, 6);

  const dockT = interpolate(frame, [T.dock[0], T.dock[1]], [0, 1], EOPT);
  const top = CMP_HOME_Y + (CMP_CONV_Y - CMP_HOME_Y) * dockT;

  const growT = useSpringAt(T.grow, { damping: 15, stiffness: 130 });
  const collapse = interpolate(frame, [T.clear, T.clear + 8], [1, 0], EOPT);
  const extH = EXT_H * growT * collapse;
  const thumbIn = useSpringAt(T.thumb, { damping: 13, stiffness: 190 });

  return (
    <div style={{ position: "absolute", left: CMP.x, top, width: CMP.w, height: CMP.h }}>
      {/* pill surface — grows upward while the attachment row is present */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -extH,
          width: CMP.w,
          height: CMP.h + extH,
          borderRadius: Math.min(CMP.h / 2, CMP.h / 2),
          background: GPT.composer,
        }}
      />
      {/* attachment thumb — the REAL packshot (white bg) as a rounded chip */}
      {thumbIn > 0.001 && collapse > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: bl(14),
            top: -extH + bl(10),
            width: bl(56),
            height: bl(56),
            borderRadius: bl(12),
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.16)",
            opacity: Math.min(1, thumbIn * 1.5) * collapse,
            transform: `scale(${0.7 + 0.3 * Math.min(1.04, thumbIn)})`,
          }}
        >
          <Img
            src={staticFile(HC.productPackshot)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : null}
      {/* content row — P5's exact flex construction */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CMP.w,
          height: CMP.h,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 6px 0 14px",
        }}
      >
        <PlusGlyph dip={plusDip} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            fontSize: FS,
            whiteSpace: "nowrap",
          }}
        >
          {typed ? <span style={{ color: GPT.text }}>{typed}</span> : null}
          <div
            style={{
              width: 1.6,
              height: FS * 1.25,
              background: GPT.text,
              opacity: blink,
              marginLeft: typed ? 1.5 : 0,
            }}
          />
          {typed ? null : (
            <span style={{ color: GPT.faint, marginLeft: 3 }}>
              {FACTS.composerPlaceholder}
            </span>
          )}
        </div>
        <MicGlyph />
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: GPT.white,
            position: "relative",
            transform: `scale(${1 - 0.1 * press})`,
            flexShrink: 0,
          }}
        >
          {/* voice bars (empty state) */}
          <svg
            width={30}
            height={30}
            viewBox="0 0 30 30"
            style={{ position: "absolute", inset: 0, opacity: 1 - sendT }}
          >
            {[
              [10.4, 12, 18],
              [14.2, 8.5, 21.5],
              [18, 11, 19],
            ].map(([x, y1, y2], i) => (
              <path
                key={i}
                d={`M${x} ${y1} V${y2}`}
                stroke="#0A0A0A"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            ))}
          </svg>
          {/* send arrow (text present) */}
          <svg
            width={30}
            height={30}
            viewBox="0 0 30 30"
            style={{ position: "absolute", inset: 0, opacity: sendT }}
          >
            <path
              d="M15 21.5 V9 M9.8 14 L15 8.8 L20.2 14"
              fill="none"
              stroke="#0A0A0A"
              strokeWidth={2.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chat stack — P5's bottom-anchored column; here the message POSTS into it:
// bubble enters, then the attachment card lands above it with a lime arc.
// ---------------------------------------------------------------------------

const bubbleStyle: React.CSSProperties = {
  background: GPT.composer,
  borderRadius: BUBBLE_R,
  padding: "9px 16px",
  fontSize: FS,
  lineHeight: 1.4,
  color: GPT.text,
  width: "fit-content",
};

const ChatStack: React.FC = () => {
  const frame = useCurrentFrame();
  const bubbleT = interpolate(frame, [T.bubble, T.bubble + 8], [0, 1], EOPT);
  const photoIn = useSpringAt(T.photo, { damping: 14, stiffness: 110 });
  const arcT = interpolate(frame, [T.arc[0], T.arc[1]], [0.02, 1], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });
  const arcO =
    interpolate(frame, [T.arc[0] - 4, T.arc[0] + 2], [0, 1], EOPT) *
    interpolate(frame, [T.arcFade[0], T.arcFade[1]], [1, 0], EOPT);

  if (frame < T.bubble - 2) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: COL.x,
        bottom: BODY_H - ANCHOR,
        width: COL.w,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {/* THE IMAGE LANDS — attachment card above the prompt (P5's resting stack) */}
      <div style={{ alignSelf: "flex-end", position: "relative" }}>
        <div
          style={{
            width: PHOTO_W,
            height: PHOTO_H,
            borderRadius: bl(14),
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: Math.min(1, photoIn * 1.5),
            transform: `translateY(${(1 - photoIn) * -16}px) scale(${0.94 + 0.06 * Math.min(1, photoIn)})`,
            transformOrigin: "50% 100%",
          }}
        >
          <Img
            src={staticFile(HC.productPackshot)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        {/* flat lime upload arc completing around the landed card — no glow */}
        {arcO > 0.001 ? (
          <svg
            width={PHOTO_W + 20}
            height={PHOTO_H + 20}
            style={{ position: "absolute", left: -10, top: -10, opacity: arcO }}
          >
            <rect
              x={5}
              y={5}
              width={PHOTO_W + 10}
              height={PHOTO_H + 10}
              rx={bl(14) + 5}
              fill="none"
              stroke={HIGGS.lime}
              strokeWidth={2.4}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arcT}
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </div>
      <div
        style={{
          ...bubbleStyle,
          alignSelf: "flex-end",
          marginTop: 8,
          opacity: bubbleT,
          transform: `translateY(${(1 - bubbleT) * 6}px)`,
        }}
      >
        {FACTS.promptUgc}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The window — P5's exact card: titlebar chrome + real capture + patches
// ---------------------------------------------------------------------------

const ChatWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useSpringAt(T.win, { damping: 16, stiffness: 140 });
  // Greeting clears on the send press — fully gone before the attachment
  // row collapses, so it can never flash back out from behind the pill.
  const greetO = interpolate(frame, [T.sendPress + 1, T.clear], [1, 0], CLAMP);

  return (
    <Card
      x={WIN.x}
      y={WIN.y}
      w={WIN.w}
      h={WIN.chrome + BODY_H}
      r={20}
      enter={enter}
      style={{ overflow: "hidden", background: GPT.bg }}
    >
      {/* dark titlebar — single chrome level over the browser capture */}
      <div
        style={{
          height: WIN.chrome,
          background: GPT.panel,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "0 22px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ width: 12, height: 12, borderRadius: 999, background: "#3A3A3A" }}
          />
        ))}
      </div>

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
        {/* real chatgpt.com home capture — right side clipped by the crop */}
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
        {/* patches (GPT.bg over GPT.bg) — IDENTICAL to HcP5Animate */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: bl(676),
            width: bl(258),
            height: BODY_H - bl(676),
            background: GPT.bg,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: bl(620),
            top: bl(335),
            width: bl(CROP_W - 620),
            height: bl(75),
            background: GPT.bg,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: bl(500),
            top: bl(400),
            width: bl(CROP_W - 500),
            height: bl(90),
            background: GPT.bg,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: bl(620),
            top: bl(828),
            width: bl(CROP_W - 620),
            height: bl(52),
            background: GPT.bg,
          }}
        />

        {/* recomposited home greeting — real string, centered on the column
            like the capture's own reflow; vanishes when the message posts */}
        {greetO > 0 ? (
          <div
            style={{
              position: "absolute",
              left: COL.x,
              top: bl(348),
              width: COL.w,
              textAlign: "center",
              fontSize: bl(24),
              fontWeight: 600,
              color: GPT.text,
              letterSpacing: 0.2,
              opacity: greetO,
            }}
          >
            {FACTS.homeGreeting}
          </div>
        ) : null}

        {/* real disclaimer string, recomposited centered (as in P5) */}
        <div
          style={{
            position: "absolute",
            left: CMP.x,
            top: bl(858),
            width: CMP.w,
            textAlign: "center",
            fontSize: bl(12.5),
            color: "#7A7A7A",
          }}
        >
          ChatGPT is AI. By using it, you agree to our <u>Terms</u> &{" "}
          <u>Privacy Policy</u>.
        </div>

        <ChatStack />
        <Composer />
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Cursor + click pulses (world coordinates)
// ---------------------------------------------------------------------------

const PLUS_W = { x: WIN.x + CMP.x + 14 + 7.5, y: WIN.y + WIN.chrome + CMP_HOME_Y + CMP.h / 2 };
const SEND_W = { x: WIN.x + CMP.x + CMP.w - 6 - 15, y: PLUS_W.y };

const Pulse: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 9], [0, 1], CLAMP);
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={60} height={60} style={{ position: "absolute", left: x - 30, top: y - 30 }}>
      <circle
        cx={30}
        cy={30}
        r={4 + 15 * t}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1.5}
        opacity={0.65 * (1 - t)}
      />
    </svg>
  );
};

const CursorLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const cx = interpolate(
    frame,
    [T.cursorIn, 22, 30, 38, 46, 64, 76, DURATION_IN_FRAMES],
    [760, 760, PLUS_W.x, PLUS_W.x, 500, 500, SEND_W.x, SEND_W.x],
    EOPT,
  );
  const cy = interpolate(
    frame,
    [T.cursorIn, 22, 30, 38, 46, 64, 76, DURATION_IN_FRAMES],
    [700, 700, PLUS_W.y, PLUS_W.y, 680, 680, SEND_W.y, SEND_W.y],
    EOPT,
  );
  const o =
    interpolate(frame, [T.cursorIn, T.cursorIn + 6], [0, 1], CLAMP) *
    interpolate(frame, [T.cursorOut[0], T.cursorOut[1]], [1, 0], CLAMP);
  const press = tri(frame, T.plusPress, 3, 6) + tri(frame, T.sendPress, 3, 6);
  if (o <= 0) return null;
  return (
    <>
      <Pulse at={T.plusPress + 1} x={PLUS_W.x} y={PLUS_W.y} />
      <Pulse at={T.sendPress + 1} x={SEND_W.x} y={SEND_W.y} />
      <Cursor x={cx - 1} y={cy - 1} scale={0.6 * (1 - 0.08 * press)} opacity={o} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP4Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const captionO =
    interpolate(frame, [T.caption[0], T.caption[1]], [0, 1], EOPT) *
    interpolate(frame, [T.caption[2], T.caption[3]], [1, 0], EOPT);

  // Open on P5's framing family → 14f ramp to the composer → long action
  // hold (+, thumb, typing, send) → 16f ease down/in while the message
  // posts (the landed card is the hero) → hold with the lime arc → 16f
  // settle to HcP5Animate's EXACT opening key → 20f end hold, identical
  // keys. Paper stays in frame at every framing (right + bottom bands at
  // the tightest keys) — the window never fills the frame.
  const cam = useCam({
    keys: [0, 10, 24, 84, 100, 134, 150, 170],
    fx: [540, 540, 645, 645, 800, 800, 540, 540],
    fy: [535, 535, 570, 570, 600, 600, 535, 535],
    z: [0.97, 0.97, 1.35, 1.35, 1.5, 1.5, 0.97, 0.97],
  });

  return (
    <PaperWorld cam={cam}>
      <ChatWindow />
      {/* mono URL on the paper below the window — opening wide only */}
      {captionO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 962,
            width: 1080,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 0.5,
            color: C.muted,
            opacity: captionO,
          }}
        >
          {FACTS.url}
        </div>
      ) : null}
      <CursorLayer />
    </PaperWorld>
  );
};
