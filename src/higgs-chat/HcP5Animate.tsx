/**
 * HcP5Animate — beat 5 of the Higgs-Chat series (PAPER + LIME, REAL SHOTS).
 *
 * VO (never on screen): "Ask it to animate that, and the finished video
 * appears underneath."
 *
 * Continues the P4 scene — same chat, same window. One continuous world:
 *   1. 0–25   Opening = P4 aftermath: the real chatgpt.com window (home
 *              capture cropped to a narrow 1024px browser, logged-out
 *              artifacts patched with GPT.bg) shows the posted user message:
 *              Allipop can packshot attachment (white-bg "uploaded product
 *              photo") + "Turn this into a UGC video" bubble, bottom-anchored
 *              above a conversation-state composer. Caret blinks in the
 *              focused composer.
 *   2. 25–55  Camera pushes to the composer framing; "Animate that" types
 *              (FACTS.promptAnimate), the voice circle swaps to a send
 *              arrow, presses, and the message posts as a user bubble —
 *              older messages autoscroll up (bottom-anchored flex column).
 *   3. 55–95  A Higgsfield tool chip + skeleton video card (GPT.tile,
 *              hairline border, shimmer sweep, flat lime progress arc — no
 *              glow) grows underneath during the camera hold.
 *   4. 95–135 Slight push-in (z 1.06 → 1.125, window lands exactly on the
 *              5% margin line); the skeleton crossfades into the REAL UGC
 *              video (OffthreadVideo, muted, from ~2s in) playing in a
 *              phone-aspect card — 280 world px wide, far below native 1080.
 *   5. 135–150 End hold, camera static since f102 (identical keys).
 *
 * On-screen text = real capture strings + allowed typed prompts + the
 * Higgsfield mark. No narration echo. Paper visible on all four sides at
 * every frame (min ~50px side bands at the tightest key).
 */
import React from "react";
import {
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Card,
  EASE,
  FACTS,
  GPT,
  HC,
  HIGGS,
  HiggsIcon,
  PaperWorld,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 150;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const EOPT = { easing: EASE, ...CLAMP };

// ---------------------------------------------------------------------------
// Window geometry — the capture (1600×880) cropped to source x 0…1024, i.e.
// a real narrow-browser ChatGPT window: full sidebar + a snug chat canvas.
// All composites are specified in SOURCE pixels via bl() so they sit at the
// host UI's scale (host body text ≈ 16 source px → 13.4 world px).
// ---------------------------------------------------------------------------

const WIN = { x: 110, y: 140, w: 860, chrome: 50 };
const CROP_W = 1024;
const S = WIN.w / CROP_W; // 0.8398
const bl = (v: number) => v * S; // source px → body-local world px
const BODY_H = bl(880); // 739

// Chat column inside the canvas (source x 292…992 — snug, authentic for a
// narrow window), composer in conversation position at the bottom.
const COL = { x: bl(292), w: bl(700) };
const CMP = { x: bl(292), y: bl(808), w: bl(700), h: bl(48) };
const ANCHOR = bl(780); // chat stack bottom (body-local y), above composer
const FS = bl(16); // host message/composer text size
const BUBBLE_R = bl(18);

const PHOTO_W = bl(240); // Allipop packshot attachment — native 1536×2752
const PHOTO_H = (PHOTO_W * 2752) / 1536; // 361.2 (1.79 tall)
const CARD_W = 280; // phone-aspect result card — native video is 1080 wide
const CARD_H = Math.round((CARD_W * 16) / 9); // 498

// The UGC source is full-frame 1080×1920 footage (no baked matte) — card
// aspect 280:498 ≈ 9:16, so a plain cover fill is edge-to-edge with no
// crop math. Displayed scale ≈ 0.26× native.

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  type: 36, // typewriter start (camera hold begins at 36)
  typeDone: 51,
  press: 51, // send circle press dip
  clear: 54, // input clears (real post behavior)
  post: 55, // "Animate that" bubble enters the stack
  chip: 59, // Higgsfield tool chip
  grow: [61, 87] as const, // skeleton card height 76 → 498
  arc: [64, 92] as const, // lime progress arc sweep
  skelFade: [94, 101] as const,
  videoSeq: 92,
  videoIn: [96, 108] as const,
} as const;

const TYPE_SPEED = 0.8; // chars/frame → 12 chars done at f51

// ---------------------------------------------------------------------------
// Small glyphs (host-scale, sampled colors)
// ---------------------------------------------------------------------------

const PlusGlyph: React.FC = () => (
  <svg width={15} height={15} viewBox="0 0 15 15">
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
// Composer — conversation state, rebuilt pixel-matched (#212121 pill)
// ---------------------------------------------------------------------------

const Composer: React.FC = () => {
  const frame = useCurrentFrame();
  const nChars = Math.max(0, Math.floor((frame - T.type) * TYPE_SPEED));
  const typed =
    frame >= T.clear ? "" : FACTS.promptAnimate.slice(0, Math.min(nChars, 12));
  const typing = frame >= T.type && frame < T.typeDone;
  const blink = typing ? 1 : frame % 24 < 13 ? 1 : 0;
  // voice bars ↔ send arrow crossfade while text is present
  const sendT =
    interpolate(frame, [T.type + 1, T.type + 6], [0, 1], EOPT) *
    interpolate(frame, [T.clear, T.clear + 4], [1, 0], EOPT);
  const press = interpolate(frame, [T.press, T.press + 2, T.press + 7], [0, 1, 0], CLAMP);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: CMP.x,
          top: CMP.y,
          width: CMP.w,
          height: CMP.h,
          borderRadius: CMP.h / 2,
          background: GPT.composer,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 6px 0 14px",
        }}
      >
        <PlusGlyph />
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
          {typed ? (
            <span style={{ color: GPT.text }}>{typed}</span>
          ) : null}
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
      {/* real disclaimer string from the capture, recomposited centered */}
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
    </>
  );
};

// ---------------------------------------------------------------------------
// Chat stack — bottom-anchored flex column: growth pushes older messages up
// (real autoscroll). Clipped by the window body.
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
  const postT = interpolate(frame, [T.post, T.post + 8], [0, 1], EOPT);
  const chipT = interpolate(frame, [T.chip, T.chip + 7], [0, 1], EOPT);
  const growH = interpolate(frame, [T.grow[0], T.grow[1]], [76, CARD_H], EOPT);
  const cardIn = interpolate(frame, [T.grow[0], T.grow[0] + 4], [0, 1], EOPT);
  const arcT = interpolate(frame, [T.arc[0], T.arc[1]], [0.02, 1], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });
  const arcIn = interpolate(frame, [T.arc[0] - 2, T.arc[0] + 4], [0, 1], EOPT);
  const skelO = interpolate(frame, [T.skelFade[0], T.skelFade[1]], [1, 0], EOPT);
  const videoT = interpolate(frame, [T.videoIn[0], T.videoIn[1]], [0, 1], EOPT);
  // shimmer band loops across the tile; fully exits before wrapping
  const shimmerX = -180 + 620 * (((frame - T.grow[0] + 34) % 34) / 34);

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
      {/* P4 aftermath — attachment + prompt, resting state */}
      <div
        style={{
          alignSelf: "flex-end",
          width: PHOTO_W,
          height: PHOTO_H,
          borderRadius: bl(14),
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Img
          src={staticFile(HC.productPackshot)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ ...bubbleStyle, alignSelf: "flex-end", marginTop: 8 }}>
        {FACTS.promptUgc}
      </div>

      {/* "Animate that" posts — height animates so the column slides up */}
      <div
        style={{
          alignSelf: "flex-end",
          height: postT * 50,
          opacity: postT,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            ...bubbleStyle,
            alignSelf: "flex-end",
            transform: `translateY(${(1 - postT) * 6}px)`,
          }}
        >
          {FACTS.promptAnimate}
        </div>
      </div>

      {/* Higgsfield tool chip */}
      <div
        style={{
          alignSelf: "flex-start",
          height: chipT * 30,
          opacity: chipT,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 22 }}>
          <HiggsIcon size={18} />
          <div
            style={{
              fontSize: bl(14),
              fontWeight: 600,
              color: GPT.muted,
              letterSpacing: 0.2,
            }}
          >
            {FACTS.higgsRowName}
          </div>
        </div>
      </div>

      {/* skeleton video card → real UGC video */}
      <div
        style={{
          alignSelf: "flex-start",
          marginTop: 6,
          width: CARD_W,
          height: growH,
          borderRadius: bl(16),
          border: "1px solid rgba(255,255,255,0.10)",
          background: GPT.tile,
          overflow: "hidden",
          position: "relative",
          opacity: cardIn,
        }}
      >
        {/* shimmer sweep */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: shimmerX,
            width: 130,
            height: growH + 160,
            transform: "rotate(16deg)",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
            opacity: skelO,
          }}
        />
        {/* flat lime progress arc — no glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: skelO * arcIn,
          }}
        >
          <svg width={64} height={64} viewBox="0 0 64 64">
            <circle
              cx={32}
              cy={32}
              r={24}
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={4}
            />
            <circle
              cx={32}
              cy={32}
              r={24}
              fill="none"
              stroke={HIGGS.lime}
              strokeWidth={4}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - arcT}
              transform="rotate(-90 32 32)"
            />
          </svg>
        </div>
        {/* the REAL UGC result — muted, from ~2s in, far below native size */}
        <Sequence from={T.videoSeq}>
          <OffthreadVideo
            src={staticFile(HC.ugcVideo)}
            muted
            startFrom={60}
            style={{
              position: "absolute",
              inset: 0,
              width: CARD_W,
              height: CARD_H,
              objectFit: "cover",
              opacity: videoT,
            }}
          />
        </Sequence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The window — titlebar chrome + real capture, patched, + composites
// ---------------------------------------------------------------------------

const ChatWindow: React.FC = () => (
  <Card
    x={WIN.x}
    y={WIN.y}
    w={WIN.w}
    h={WIN.chrome + BODY_H}
    r={20}
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
      {/* patches (GPT.bg over GPT.bg — hide logged-out + home-state text) */}
      {/* sidebar: "Get responses tailored to you" block + Log in button */}
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
      {/* "Ready when you are." greeting */}
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
      {/* home-state centered composer */}
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
      {/* bottom disclaimer (cut by the crop — recomposited on the column) */}
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

      <ChatStack />
      <Composer />
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const HcP5Animate: React.FC = () => {
  // hold (P4 aftermath) → 14f push to the composer framing → long hold
  // (typing, post, skeleton growth) → 14f push-in (video = hero; window
  // lands exactly on the 5% margin line) → static end hold, identical keys.
  const cam = useCam({
    keys: [0, 22, 36, 88, 102, 132, 150],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [535, 535, 560, 560, 560, 560, 560],
    z: [0.97, 0.97, 1.06, 1.06, 1.125, 1.125, 1.125],
  });

  return (
    <PaperWorld cam={cam}>
      <ChatWindow />
    </PaperWorld>
  );
};
