/**
 * CcVoxReel — 1:1 B-roll for Koen: dictating a prompt into the real Claude
 * desktop app over an attached video, then sending it.
 *
 * Victor's brief (dictated): a slow zoom in so you get to read what's being set
 * out, with the voice recording — the mic button's audio visualiser — running;
 * the video file attached to the chat; then press send, zooming in on the press.
 *
 * One continuous world, one camera:
 *   1.   0–30   Real Claude window on paper, clipped.mp4 already in the
 *               composer → 16f ramp down to the composer.
 *   2.  46–52   Mic pressed; the composer swaps to its dictation state
 *               (✕ / ✓ come from the real capture).
 *   3.  52–168  THE READ BEAT. The waveform grows leftward off its right
 *               anchor on Victor's real amplitude data while the transcript
 *               lands word by word — camera creeps 1.35 → 1.72 the whole way,
 *               so the line is still arriving as it becomes readable.
 *   4. 176–190  Transcript commits to solid text; coral send arms.
 *   5. 190–228  18f ramp to the send button, press with ripple.
 *   6. 228–285  Message posts; ease back out to a 31f end hold on twin keys.
 *
 * STRUCTURE: each real capture owns an opacity group, and every patch/overlay
 * that belongs to that capture lives inside its group. That matters — a patch
 * floating in world space stays put through a crossfade and lets the outgoing
 * screenshot's own text bleed out from under it.
 *
 * Everything dark on screen is a REAL screenshot; only the transcript line, the
 * waveform and the send button are composited, each matched to tokens sampled
 * from the captures. On-screen text is chat input and real UI strings only.
 */
import React from "react";
import {
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  CC,
  CL,
  CLAMP,
  CMP,
  COMPOSER,
  Cursor,
  EASE,
  FONT,
  GREET,
  LABEL,
  PaperWorld,
  SAY,
  SENT,
  WAVE,
  WAVE_DATA,
  dictated,
  useCam,
  useTri,
} from "./kit";

export const DURATION_IN_FRAMES = 285;

const EOPT = { easing: EASE, ...CLAMP };

// ---------------------------------------------------------------------------
// World layout. The window renders at 720 world px wide against its 807pt
// native size, so `p()` maps every measured capture point into window-local
// space. Source PNGs are 2× (1614px), giving headroom to ~2.2× camera zoom
// before the screenshot upscales at all.
// ---------------------------------------------------------------------------

const WIN = { x: 180, y: 216, w: 720 } as const;
const S = WIN.w / CC.win.w; // 0.8922
const p = (v: number) => v * S;
const WIN_H = p(CC.win.h); // 647

/** Composer origin, WINDOW-LOCAL. */
const LX = p(COMPOSER.x);
const LY = p(COMPOSER.y);
const LW = p(COMPOSER.w);

/** Send-button slot, window-local (coral send and blue ✓ share it). */
const LSEND = {
  x: LX + p(CMP.send.x),
  y: LY + p(CMP.send.y),
  s: p(CMP.send.s),
};
/** …and in world coords, for the cursor and ripple that ride above the window. */
const SEND_C = {
  x: WIN.x + LSEND.x + LSEND.s / 2,
  y: WIN.y + LSEND.y + LSEND.s / 2,
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  micPress: 46,
  listen: 52, // base swaps to the dictation capture
  speak: 56, // waveform + transcript start
  speakEnd: 168,
  commit: 176, // transcript goes solid, coral send arms
  rampSend: [190, 208] as const,
  press: 218,
  post: 226,
} as const;

const XF = 6; // crossfade length between real captures

/** Opacity ramp for a base capture that is on screen between `a` and `b`. */
const useBaseOpacity = (a: number, b: number) => {
  const frame = useCurrentFrame();
  const inT = a <= 0 ? 1 : interpolate(frame, [a, a + XF], [0, 1], EOPT);
  const outT =
    b >= DURATION_IN_FRAMES ? 1 : interpolate(frame, [b, b + XF], [1, 0], EOPT);
  return Math.min(inT, outT);
};

// ---------------------------------------------------------------------------
// Composited pieces — all window-local
// ---------------------------------------------------------------------------

/** Flat fill matching a surface — clears a band of the screenshot before live
 *  content is drawn in its place. Same colour on same colour, seam invisible. */
const Patch: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
}> = ({ x, y, w, h, fill = CL.composer }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: fill,
    }}
  />
);

/** Clears the composer's transcript band. */
const TextPatch: React.FC = () => (
  <Patch x={LX + p(12)} y={LY + p(142)} w={LW - p(24)} h={p(70)} />
);

/**
 * Clears the greeting entirely — no name on screen.
 *
 * The captures were taken on Victor's machine and say "Afternoon, Victor". That
 * was previously re-lettered to "Afternoon, Koen"; per Victor's note the name
 * should not be visible at all, so the band is simply covered in the tab colour
 * and nothing is drawn back. Leaves a clean empty chat area above the composer,
 * which is also how the beat already read at 7s once the camera was tight on
 * the send button.
 */
const Greeting: React.FC = () => (
  <Patch
    x={p(GREET.clear.x)}
    y={p(GREET.clear.y)}
    w={p(GREET.clear.w)}
    h={p(GREET.clear.h)}
    fill={CL.bg}
  />
);

/** Re-letters an attachment filename over its chip/card. */
const FileLabel: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <>
    <Patch
      x={x + p(LABEL.dx) - p(3)}
      y={y + p(LABEL.dy) - p(3)}
      w={p(LABEL.w)}
      h={p(LABEL.h)}
    />
    <div
      style={{
        position: "absolute",
        left: x + p(LABEL.dx),
        top: y + p(LABEL.dy),
        fontFamily: FONT,
        fontSize: p(LABEL.fontSize),
        color: "#E8E6E1",
        whiteSpace: "nowrap",
      }}
    >
      {SAY.file}
    </div>
  </>
);

/** The composer chip's filename — same in every pre-send capture. */
const ChipLabel: React.FC = () => (
  <FileLabel x={LX + p(CMP.chip.x)} y={LY + p(CMP.chip.y)} />
);

/**
 * The mic visualiser. Right-anchored and grows leftward as the recording
 * accumulates — exactly how the real one behaves — replaying the amplitude
 * envelope measured off the capture. Near-silence renders as a dot.
 */
const Waveform: React.FC<{ n: number }> = ({ n }) => {
  if (n <= 0) return null;
  const right = LX + p(CMP.waveRight);
  const cy = LY + p(CMP.rowY);
  const pitch = p(WAVE.pitch);
  const barW = p(WAVE.barW);

  return (
    <>
      {Array.from({ length: n }, (_, j) => {
        const amp = WAVE_DATA[j % WAVE_DATA.length];
        const h = p(WAVE.minH + (WAVE.maxH - WAVE.minH) * amp);
        // newest bar sits flush at the right anchor
        const x = right - (n - j) * pitch;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: x,
              top: cy - h / 2,
              width: barW,
              height: h,
              borderRadius: barW / 2,
              background: CL.wave,
            }}
          />
        );
      })}
    </>
  );
};

/** Coral send button, drawn as vector so it stays crisp at the tight zoom. */
const SendButton: React.FC<{ press: number }> = ({ press }) => {
  const s = LSEND.s;
  return (
    <div
      style={{
        position: "absolute",
        left: LSEND.x,
        top: LSEND.y,
        width: s,
        height: s,
        borderRadius: p(CMP.send.r),
        background: press > 0.01 ? CL.coralLift : CL.coral,
        transform: `scale(${1 - 0.09 * press})`,
      }}
    >
      <svg width={s} height={s} viewBox="0 0 31 31" style={{ display: "block" }}>
        <path
          d="M15.5 22.6 V9.2 M9.3 15.4 L15.5 9.2 L21.7 15.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

type Mode = "listening" | "live" | "committed";

/** The composer text line. */
const TextLine: React.FC<{ mode: Mode; t: number }> = ({ mode, t }) => {
  const body =
    mode === "listening"
      ? SAY.listening
      : mode === "live"
        ? dictated(SAY.prompt, t)
        : SAY.prompt;
  if (!body) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: LX + p(CMP.textX),
        top: LY + p(CMP.textTop),
        width: p(CMP.textW),
        fontFamily: FONT,
        fontSize: p(CMP.fontSize),
        lineHeight: CMP.lineHeight,
        fontStyle: mode === "live" ? "italic" : "normal",
        fontWeight: 400,
        color: mode === "committed" ? CL.text : CL.muted,
        letterSpacing: -0.1,
      }}
    >
      {body}
    </div>
  );
};

/**
 * Housekeeping on the posted capture. Victor's live session left two artefacts
 * that would read as mistakes in a finished graphic: Claude's reply had been
 * interrupted (an error row with Edit prompt / Try again), and the auto-named
 * chat title carries the dictation's "box" mishearing. Both get covered and,
 * for the title, redrawn to agree with the prompt actually on screen.
 */
const SentFixups: React.FC = () => (
  <>
    {/* the "Claude's response was interrupted." row */}
    <Patch x={p(45)} y={p(300)} w={p(720)} h={p(60)} fill={CL.bg} />
    {/* window title */}
    <Patch x={p(118)} y={p(13)} w={p(268)} h={p(26)} fill={CL.bg} />
    <div
      style={{
        position: "absolute",
        left: p(122),
        top: p(17),
        display: "flex",
        alignItems: "center",
        gap: p(8),
        fontFamily: FONT,
        fontSize: p(15),
        color: "#E6E4DF",
        whiteSpace: "nowrap",
      }}
    >
      Video to reel with Vox background
      <svg width={p(11)} height={p(7)} viewBox="0 0 11 7">
        <path
          d="M1 1.4 L5.5 5.6 L10 1.4"
          fill="none"
          stroke="#8E8C86"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </>
);

/** Prompt bubble redrawn over the posted capture, carrying the correct line. */
const SentBubble: React.FC<{ enter: number }> = ({ enter }) => {
  const b = SENT.bubble;
  return (
    <>
      <Patch
        x={p(b.x) - p(4)}
        y={p(b.y) - p(6)}
        w={p(b.w) + p(8)}
        h={p(b.h) + p(12)}
        fill={CL.bg}
      />
      <div
        style={{
          position: "absolute",
          left: p(b.x),
          top: p(b.y),
          width: p(b.w),
          minHeight: p(b.h),
          borderRadius: p(b.r),
          background: CL.composer,
          padding: `${p(11)}px ${p(20)}px`,
          boxSizing: "border-box",
          fontFamily: FONT,
          fontSize: p(CMP.fontSize),
          lineHeight: CMP.lineHeight,
          color: CL.text,
          opacity: enter,
          transform: `translateY(${(1 - enter) * p(8)}px)`,
        }}
      >
        {SAY.prompt}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// The window — one opacity group per real capture, overlays inside their group
// ---------------------------------------------------------------------------

const Layer: React.FC<{
  src: string;
  o: number;
  children?: React.ReactNode;
}> = ({ src, o, children }) =>
  o <= 0.001 ? null : (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WIN.w,
          height: WIN_H,
          display: "block",
        }}
      />
      {children}
    </div>
  );

const ChatWindow: React.FC = () => {
  const frame = useCurrentFrame();

  const oAttached = useBaseOpacity(0, T.listen);
  const oDictating = useBaseOpacity(T.listen, T.commit);
  const oTranscript = useBaseOpacity(T.commit, T.post);
  const oSent = useBaseOpacity(T.post, DURATION_IN_FRAMES);

  const speakT = interpolate(frame, [T.speak, T.speakEnd], [0, 1], CLAMP);
  const nBars = Math.floor(speakT * WAVE.count);
  const press = useTri(T.press, 2, 7);
  const bubbleIn = interpolate(frame, [T.post + 2, T.post + 12], [0, 1], EOPT);

  return (
    <div
      style={{
        position: "absolute",
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN_H,
        borderRadius: p(18),
        overflow: "hidden",
        background: CL.bg,
        // No drop shadow: the ground behind is the same colour as the tab, so a
        // shadow would read as a smudge rather than depth.
      }}
    >
      {/* 1 — chip attached, real placeholder and real coral send */}
      <Layer src={CC.shots.attached} o={oAttached}>
        <Greeting />
        <ChipLabel />
      </Layer>

      {/* 2 — dictation: real ✕ / ✓ kept, waveform band and text line ours */}
      <Layer src={CC.shots.dictating} o={oDictating}>
        <Greeting />
        <ChipLabel />
        <TextPatch />
        <TextLine mode={frame < T.speak ? "listening" : "live"} t={speakT} />
        <Patch x={LX + p(118)} y={LY + p(212)} w={p(458)} h={p(42)} />
        <Waveform n={nBars} />
      </Layer>

      {/* 3 — committed transcript; send drawn as vector so the press stays
              crisp at 2.6× (the capture's own coral sits underneath, identical) */}
      <Layer src={CC.shots.transcript} o={oTranscript}>
        <Greeting />
        <ChipLabel />
        <TextPatch />
        <TextLine mode="committed" t={1} />
        <Patch
          x={LSEND.x - p(4)}
          y={LSEND.y - p(4)}
          w={LSEND.s + p(8)}
          h={LSEND.s + p(8)}
        />
        <SendButton press={press} />
      </Layer>

      {/* 4 — posted */}
      <Layer src={CC.shots.sent} o={oSent}>
        <SentFixups />
        <FileLabel x={p(SENT.card.x)} y={p(SENT.card.y)} />
        <SentBubble enter={bubbleIn} />
      </Layer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overlays that ride above the window, in world coords
// ---------------------------------------------------------------------------

/** Expanding ring on the send press. */
const Ripple: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [T.press, T.press + 12], [0, 1], CLAMP);
  if (t <= 0 || t >= 1) return null;
  const r = LSEND.s * (0.45 + 0.85 * t);
  return (
    <svg
      width={r * 2 + 8}
      height={r * 2 + 8}
      style={{
        position: "absolute",
        left: SEND_C.x - r - 4,
        top: SEND_C.y - r - 4,
      }}
    >
      <circle
        cx={r + 4}
        cy={r + 4}
        r={r}
        fill="none"
        stroke={CL.coralLift}
        strokeWidth={2}
        opacity={0.7 * (1 - t)}
      />
    </svg>
  );
};

const CursorLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const keys = [
    T.commit,
    T.commit + 10,
    T.rampSend[1],
    T.press,
    DURATION_IN_FRAMES,
  ];
  const cx = interpolate(
    frame,
    keys,
    [SEND_C.x + 150, SEND_C.x + 150, SEND_C.x + 6, SEND_C.x + 6, SEND_C.x + 6],
    EOPT,
  );
  const cy = interpolate(
    frame,
    keys,
    [SEND_C.y + 120, SEND_C.y + 120, SEND_C.y + 8, SEND_C.y + 8, SEND_C.y + 8],
    EOPT,
  );
  const o =
    interpolate(frame, [T.commit + 2, T.commit + 10], [0, 1], CLAMP) *
    interpolate(frame, [T.post + 2, T.post + 10], [1, 0], CLAMP);
  const press = useTri(T.press, 2, 7);
  if (o <= 0.001) return null;
  return <Cursor x={cx} y={cy} scale={0.75 * (1 - 0.1 * press)} opacity={o} />;
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const CcVoxReel: React.FC = () => {
  // Camera: wide → down to the composer → a long slow creep across the read
  // beat → hard ramp onto the send button → ease back out to twin end keys.
  // Paper stays in shot at the open, at the send framing (the window's right
  // and bottom edges are in frame) and at the settle.
  //
  // The window sits LOW in frame throughout, leaving clear paper up top for a
  // hook or a talking head. DROP is a screen-space offset, so it has to be
  // divided by the zoom at each key — a fixed fy nudge would drop the tight
  // framings far less than the wide ones and the placement would drift.
  //
  // The settle now matches the open at 0.95 rather than 1.0: at this depth a
  // 1.0 settle would push the window's bottom 29px past the frame edge and
  // shear off its rounded corners.
  // NO creep across the dictation. The establishing push lands at frame 30
  // (1s) and the camera then holds dead still until the send ramp at 192
  // (6.4s) — the whole read beat plays on a locked frame.
  //
  // Fitted to WIDTH with a margin down each side rather than cropped to cover.
  // The window is 1.11:1 in a 1:1 frame, so side padding and a full-height
  // bleed are mutually exclusive: padding the sides necessarily letterboxes top
  // and bottom too. That ground is painted in the tab's OWN colour (CL.bg), so
  // the padding reads as one continuous dark surface with the UI inset in it —
  // the tab's edges simply dissolve into it.
  //
  // SIDE_PAD is the project's 5% safe margin. TOP_PAD is biased past centre so
  // the content still sits a little low, per the earlier headroom note.
  const SIDE_PAD = 54; // 5% of 1080
  const TOP_PAD = 130;
  const BASE_Z = (1080 - SIDE_PAD * 2) / WIN.w;
  const BASE = {
    fx: WIN.x + WIN.w / 2,
    fy: WIN.y - (TOP_PAD - 540) / BASE_Z,
    z: BASE_Z,
  };

  // The tab no longer has to cover the frame, so the press can sit square on
  // the button again instead of being held off-centre.
  const PRESS = { fx: SEND_C.x, fy: SEND_C.y, z: 2.6 };

  const cam = useCam({
    keys: [0, 192, 210, 228, 254, DURATION_IN_FRAMES],
    fx: [BASE.fx, BASE.fx, PRESS.fx, PRESS.fx, BASE.fx, BASE.fx],
    fy: [BASE.fy, BASE.fy, PRESS.fy, PRESS.fy, BASE.fy, BASE.fy],
    z: [BASE.z, BASE.z, PRESS.z, PRESS.z, BASE.z, BASE.z],
  });

  return (
    <PaperWorld cam={cam} bg={CL.bg}>
      <ChatWindow />
      <Ripple />
      <CursorLayer />
    </PaperWorld>
  );
};
