import React from "react";
import {
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AG,
  AgentAvatar,
  AgentMsg,
  ChatHeader,
  ChatWallpaper,
  Composer,
  EASE,
  FONT,
  PaperWorld,
  R,
  SHADOW,
  SPRINGS,
  SystemLine,
  T,
  TeamilyLockup,
  Typing,
  safePadX,
  useCam,
} from "./kit";

// ============================================================================
// TmP1KilledChatbot — 1080x1080 @ 30fps
// VO: "This startup just killed the AI chatbot."
//
// One continuous paper world, one keyframed camera.
//   0-32   HOLD tight on a lone, anonymous single-assistant chat window
//          (no colour, no identity, one grey reply, one empty composer)
//   32-54  MOVE — camera pulls back while that window desaturates, loses its
//          shadow, blurs and recedes in z to a small dead card up-left
//   54-104 HOLD — the real Teamily group chat scales up in front of it and
//          fills the frame: real header + 2x2 stack, real doodle wallpaper,
//          real named agents talking, a third already working
//   104-120 near-still end hold (typing dots + caret) for a clean cut
//
// Contrast is carried entirely by the picture: one dead grey assistant ->
// a live room full of named agents. No explanatory text anywhere.
// ============================================================================

export const DURATION_IN_FRAMES = 120;

// ---------------------------------------------------------------------------
// Layout. Final camera sits at z=1, so world = screen + (OX, OY): every number
// below is literally where the element lands on the 1080 canvas at the payoff.
// ---------------------------------------------------------------------------
const VIEW = 1080;
const PAD = safePadX(VIEW); // 54 — the hard 5% side margin
const WIN_L = PAD + 18; // 72 — app window left edge on screen
const WIN_W = VIEW - WIN_L * 2; // 936
const WIN_TOP = 250;
const WIN_H = 770;

const OX = 600;
const OY = 500;
const CAM_X = VIEW / 2 + OX; // 1140
const CAM_Y = VIEW / 2 + OY; // 1040

/** The real Teamily group-chat window, in world coords. */
const TWIN = { x: WIN_L + OX, y: WIN_TOP + OY, w: WIN_W, h: WIN_H };
const HEAD_H = 116;

/** The lone generic assistant window — big at the open, tiny once it recedes. */
const GW = { w: 418, h: 338 };
const GREY_END = 0.44; // recede scale
const GREY_CX = 215 + OX;
const GREY_CY = 142 + OY;

/** Brand bug, top-right, flush with the window's right edge. */
const LOCK_W = 180;
const LOCK_X = VIEW - WIN_L - LOCK_W + OX;
const LOCK_Y = 130 + OY;

// ---------------------------------------------------------------------------
// Camera — hold (slow push) -> 22f pull-back -> long hold with a whisper of
// drift -> two near-identical end keys.
// ---------------------------------------------------------------------------
const KEY_T = [0, 32, 50, 96, DURATION_IN_FRAMES];
const KEY_FX = [GREY_CX, GREY_CX, CAM_X, CAM_X, CAM_X];
const KEY_FY = [GREY_CY, GREY_CY, CAM_Y, CAM_Y, CAM_Y];
const KEY_Z = [2.18, 2.26, 1.0, 0.985, 0.983];

/** Real agents in the room — header stack matches the live app's 2x2 icon. */
const STACK = [
  AG.codeReviewer,
  AG.seniorDeveloper,
  AG.frontendDev,
  AG.backendArchitect,
];

const popAt = (frame: number, fps: number, start: number, dur = 18) =>
  frame < start
    ? 0
    : spring({ frame: frame - start, fps, config: SPRINGS.snappy, durationInFrames: dur });

// ---------------------------------------------------------------------------
// The lone "normal AI" window — deliberately anonymous and colourless.
// ---------------------------------------------------------------------------
const Bar: React.FC<{ x: number; y: number; w: number; h?: number; c: string }> = ({
  x,
  y,
  w,
  h = 6,
  c,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: h / 2,
      background: c,
    }}
  />
);

const GreyChat: React.FC<{ k: number; cx: number; cy: number }> = ({ k, cx, cy }) => {
  const frame = useCurrentFrame();
  const blink = interpolate(frame % 30, [0, 15, 16, 29], [1, 1, 0, 0]);

  const scale = 1 - (1 - GREY_END) * k;
  const body = interpolateColors(k, [0, 1], [T.bgSurface, T.greySoft]);
  const bar = interpolateColors(k, [0, 1], ["#C2C9D3", T.grey]);
  const bubble = interpolateColors(k, [0, 1], ["#E9ECF1", T.greySoft]);
  const disc = interpolateColors(k, [0, 1], ["#D6DBE3", T.greySoft]);

  return (
    <div
      style={{
        position: "absolute",
        left: cx - GW.w / 2,
        top: cy - GW.h / 2,
        width: GW.w,
        height: GW.h,
        borderRadius: 15,
        background: T.card,
        border: `0.9px solid ${T.line}`,
        boxShadow: `0 ${24 * (1 - k) + 2}px ${58 * (1 - k) + 8}px rgba(25,23,20,${
          0.13 * (1 - k) + 0.02
        })`,
        overflow: "hidden",
        boxSizing: "border-box",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        opacity: 1 - 0.4 * k,
        filter: `blur(${1.1 * k}px)`,
      }}
    >
      {/* pane */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 26,
          width: GW.w,
          height: GW.h - 26,
          background: body,
        }}
      />
      {/* plain window bar — no product, no name */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: GW.w,
          height: 26,
          background: "#FFFFFF",
          borderBottom: `0.8px solid ${T.lineSoft}`,
        }}
      />
      {[14, 26, 38].map((cx) => (
        <div
          key={cx}
          style={{
            position: "absolute",
            left: cx - 3.2,
            top: 9.8,
            width: 6.4,
            height: 6.4,
            borderRadius: R.full,
            background: "#D8DCE3",
          }}
        />
      ))}
      <Bar x={150} y={9.5} w={118} h={7} c="#DDE1E7" />

      {/* the one question */}
      <div
        style={{
          position: "absolute",
          left: 246,
          top: 44,
          width: 150,
          height: 44,
          borderRadius: 12,
          background: bubble,
        }}
      >
        <Bar x={12} y={13} w={126} c={bar} />
        <Bar x={12} y={25} w={86} c={bar} />
      </div>

      {/* one anonymous avatar, one grey reply */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 104,
          width: 23,
          height: 23,
          borderRadius: R.full,
          background: disc,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 53,
          top: 102,
          width: 268,
          height: 76,
          borderRadius: 14,
          background: bubble,
        }}
      >
        <Bar x={16} y={16} w={236} c={bar} />
        <Bar x={16} y={34} w={214} c={bar} />
        <Bar x={16} y={52} w={152} c={bar} />
      </div>

      {/* one empty composer, caret blinking into nothing */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 250,
          width: 374,
          height: 46,
          borderRadius: 23,
          background: "#FFFFFF",
          border: `0.8px solid ${T.line}`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 264,
          width: 1.8,
          height: 18,
          background: T.slate,
          opacity: blink,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 359,
          top: 259,
          width: 28,
          height: 28,
          borderRadius: R.full,
          background: "#DDE1E7",
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TmP1KilledChatbot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cam = useCam({ keys: KEY_T, fx: KEY_FX, fy: KEY_FY, z: KEY_Z });

  // the lone window recedes exactly across the camera move
  const recede = interpolate(frame, [32, 50], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // It settles from the camera's focal point into its corner as it shrinks, so
  // the card never swings through the 5% margin mid-move. Identical to a plain
  // world-static object at both ends of the move.
  const greyCx = cam.fx + (GREY_CX - cam.fx) * recede;
  const greyCy = cam.fy + (GREY_CY - cam.fy) * recede;

  // the real app arrives
  const winP = popAt(frame, fps, 44, 22);
  const winScale = 0.62 + 0.38 * Math.min(1, winP);
  const winOp = interpolate(frame, [44, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sysIn = Math.min(1, popAt(frame, fps, 50, 16));
  const m1 = popAt(frame, fps, 54, 18);
  const m2 = popAt(frame, fps, 64, 18);
  const typIn = Math.min(1, popAt(frame, fps, 76, 18));
  const lockIn = Math.min(1, popAt(frame, fps, 80, 20));

  return (
    <PaperWorld cam={cam} bg={T.paper}>
      {/* --- the lone generic assistant (behind, receding) --- */}
      <GreyChat k={recede} cx={greyCx} cy={greyCy} />

      {/* --- the real Teamily group chat --- */}
      <div
        style={{
          position: "absolute",
          left: TWIN.x,
          top: TWIN.y,
          width: TWIN.w,
          height: TWIN.h,
          borderRadius: R.xxl,
          background: T.card,
          boxShadow: SHADOW.window,
          border: `1.5px solid ${T.paperLine}`,
          overflow: "hidden",
          boxSizing: "border-box",
          opacity: winOp,
          transform: `translateY(${(1 - Math.min(1, winP)) * 30}px) scale(${winScale})`,
          transformOrigin: "center center",
        }}
      >
        <ChatWallpaper x={0} y={HEAD_H} w={TWIN.w} h={TWIN.h - HEAD_H} />
        <ChatHeader
          x={0}
          y={0}
          w={TWIN.w}
          h={HEAD_H}
          title="Code Review Guild"
          sub="6 members"
          badge="Members Pay"
          stack={STACK}
        />

        <SystemLine
          x={0}
          y={138}
          w={TWIN.w}
          enter={sysIn}
          names="Code Reviewer, Senior Developer"
        >
          and 3 others were invited to the group
        </SystemLine>

        <AgentMsg
          x={44}
          y={174}
          w={620}
          agent={AG.codeReviewer}
          enter={m1}
          size={26}
          pad={24}
        >
          Pulled the diff — 3 fixes before merge.
        </AgentMsg>

        <AgentMsg
          x={44}
          y={334}
          w={500}
          agent={AG.seniorDeveloper}
          enter={m2}
          size={26}
          pad={24}
        >
          On it. Pushing a branch now.
        </AgentMsg>

        {/* a third agent already working */}
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 494,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: typIn,
            transform: `translateY(${(1 - typIn) * 16}px)`,
          }}
        >
          <AgentAvatar agent={AG.frontendDev} size={48} />
          <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: T.ink }}>
            {AG.frontendDev.name}
          </div>
        </div>
        <Typing x={106} y={554} enter={typIn} />

        <Composer x={24} y={614} w={TWIN.w - 48} h={118} caret armed enter={1} />
      </div>

      {/* --- brand bug, inside the safe margins --- */}
      <TeamilyLockup
        width={LOCK_W}
        style={{
          position: "absolute",
          left: LOCK_X,
          top: LOCK_Y,
          opacity: lockIn,
          transform: `translateY(${(1 - lockIn) * 12}px)`,
        }}
      />
    </PaperWorld>
  );
};
