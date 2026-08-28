import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 235;

// "You give Claude the product, audience, and offer, then ask for ten
//  different hooks." — drop the product into Claude, type, send.
const C = {
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  cream: "#FDF9F5",
  border: "#F0E4DC",
  coral: "#D97757",
  bubble: "#F7E4D8",
};

const ease = Easing.inOut(Easing.cubic);
const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

// ---- layout -------------------------------------------------------------------
const CARD = { x: 100, y: 170, w: 880, h: 780 };
const FIELD = { x: 140, y: 780, w: 800, h: 130, r: 30 };
const SLOT = { x: 250, y: 845 }; // attachment lands here
const SEND = { x: 878, y: 845, r: 36 };
const TEXT_X = 320;

const PROMPT = "for runners, $50 off — 10 hooks";

// drag: off-canvas top-left → arc → slot
const DRAG_END = 38;
const chipPos = (f: number) => {
  const t = p(f, 0, DRAG_END, Easing.bezier(0.3, 0, 0.2, 1));
  const x = interpolate(t, [0, 1], [150, SLOT.x]);
  const y = interpolate(t, [0, 1], [40, SLOT.y]);
  // perpendicular bow to the right of travel
  const bow = Math.sin(t * Math.PI) * 210;
  return { x: x + bow, y, t };
};

const TYPE_START = 58;
const SEND_AT = 128;

export const FishHooksDrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const KEY = [0, 16, 32, 44, 58, 100, 124, 140, 162, 234];
  let z = interpolate(
    frame,
    KEY,
    [1.5, 1.5, 1.42, 1.42, 1.5, 1.5, 1.55, 1.55, 1.03, 1.03],
    camOpts,
  );
  const fx = interpolate(
    frame,
    KEY,
    [300, 470, 340, 330, 430, 590, SEND.x, SEND.x, 540, 540],
    camOpts,
  );
  const fy = interpolate(
    frame,
    KEY,
    [240, 480, 770, 835, 845, 845, SEND.y, SEND.y, 555, 557],
    camOpts,
  );
  for (const at of [DRAG_END + 2, SEND_AT]) {
    const d = frame - at;
    if (d >= 0 && d < 12) z *= 1 + 0.015 * Math.exp(-d / 3);
  }

  // ---- state ----
  const chip = chipPos(frame);
  const dropped = frame >= DRAG_END;
  const dropS = spring({
    frame: Math.max(0, frame - DRAG_END),
    fps,
    config: { damping: 13, stiffness: 170 },
  });
  const typed = Math.min(
    PROMPT.length,
    Math.floor(Math.max(0, frame - TYPE_START) * 1.0),
  );
  const press = (() => {
    const d = frame - SEND_AT;
    if (d < 0 || d > 9) return 0;
    if (d <= 3) return d / 3;
    if (d <= 5) return 1;
    return 1 - (d - 5) / 4;
  })();
  const ripple = p(frame, SEND_AT, SEND_AT + 14);
  const sent = frame >= SEND_AT + 4;
  const flyS = spring({
    frame: Math.max(0, frame - (SEND_AT + 4)),
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const clearP = p(frame, SEND_AT + 4, SEND_AT + 16);
  const dotsIn = spring({
    frame: Math.max(0, frame - 166),
    fps,
    config: { damping: 13, stiffness: 140 },
  });

  // cursor: rides the chip while dragging, then glides to text start, then send
  const cursorPos = (() => {
    if (frame <= DRAG_END) return { x: chip.x + 60, y: chip.y + 66 };
    const g1 = p(frame, DRAG_END + 4, TYPE_START - 2, ease); // to text line
    const g2 = p(frame, 106, 124, ease); // to send
    const x1 = interpolate(g1, [0, 1], [chipPos(DRAG_END).x + 60, TEXT_X + 250]);
    const y1 = interpolate(g1, [0, 1], [chipPos(DRAG_END).y + 66, SLOT.y + 30]);
    const x = interpolate(g2, [0, 1], [x1, SEND.x + 4]);
    const y =
      interpolate(g2, [0, 1], [y1, SEND.y + 6]) -
      Math.sin(g2 * Math.PI) * 46;
    return { x, y };
  })();
  const cursorFade = 1 - p(frame, SEND_AT + 18, SEND_AT + 32);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FDF6F0", fontFamily: inter }}>
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(900px 700px at 82% 12%, rgba(247,205,188,0.85), rgba(247,205,188,0) 60%),
            radial-gradient(800px 800px at 12% 88%, rgba(250,227,211,0.9), rgba(250,227,211,0) 55%),
            linear-gradient(160deg, #FDF6F0 0%, #FAE9DE 100%)`,
        }}
      />
      <svg width={1080} height={1080} style={{ position: "absolute", opacity: 0.16 }}>
        {[270, 540, 810].map((v) => (
          <React.Fragment key={v}>
            <line x1={v} y1={0} x2={v} y2={1080} stroke="#E8CDBC" strokeWidth={1} />
            <line x1={0} y1={v} x2={1080} y2={v} stroke="#E8CDBC" strokeWidth={1} />
          </React.Fragment>
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
        }}
      >
        {/* ---- Claude card ---- */}
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            borderRadius: 28,
            backgroundColor: C.card,
            boxShadow: "0 30px 80px rgba(32,21,21,0.16)",
            overflow: "hidden",
          }}
        >
          {/* header */}
          <div
            style={{
              height: 74,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 30px",
              borderBottom: `1.5px solid ${C.border}`,
            }}
          >
            <Img
              src={staticFile("bluehost/claudecode-logo.svg")}
              style={{ width: 34, height: 34 }}
            />
            <span style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>
              Claude
            </span>
          </div>

          {/* chat body */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 74,
              bottom: CARD.y + CARD.h - FIELD.y + 20,
              backgroundColor: C.cream,
            }}
          >
            {/* sent bubble flies up here */}
            {sent ? (
              <div
                style={{
                  position: "absolute",
                  right: 34,
                  top: interpolate(flyS, [0, 1], [520, 120]),
                  maxWidth: 560,
                  backgroundColor: C.bubble,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 22,
                  borderBottomRightRadius: 8,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: Math.min(1, flyS * 2),
                  transform: `scale(${0.72 + 0.28 * flyS})`,
                  transformOrigin: "bottom right",
                  boxShadow: "0 10px 26px rgba(32,21,21,0.10)",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: C.card,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Img
                    src={staticFile("fish-audio/watch7-green.png")}
                    style={{ width: 56, height: 44, objectFit: "contain" }}
                  />
                </div>
                <span style={{ fontSize: 22, fontWeight: 500, color: C.ink }}>
                  {PROMPT}
                </span>
              </div>
            ) : null}

            {/* claude thinking dots */}
            {dotsIn > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 300,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transform: `scale(${dotsIn}) `,
                  transformOrigin: "bottom left",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    backgroundColor: C.card,
                    border: `1.5px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Img
                    src={staticFile("bluehost/claudecode-logo.svg")}
                    style={{ width: 26, height: 26 }}
                  />
                </div>
                <div
                  style={{
                    backgroundColor: C.card,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 22,
                    borderBottomLeftRadius: 8,
                    padding: "18px 24px",
                    display: "flex",
                    gap: 9,
                    boxShadow: "0 10px 26px rgba(32,21,21,0.08)",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: C.coral,
                        opacity: 0.5 + 0.5 * Math.max(0, Math.sin((frame - 166) * 0.28 - i * 0.9)),
                        transform: `translateY(${-Math.max(0, Math.sin((frame - 166) * 0.28 - i * 0.9)) * 8}px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* composer field */}
          <div
            style={{
              position: "absolute",
              left: FIELD.x - CARD.x,
              top: FIELD.y - CARD.y,
              width: FIELD.w,
              height: FIELD.h,
              borderRadius: FIELD.r,
              backgroundColor: C.card,
              border: `2px solid ${dropped && clearP < 1 ? C.coral : C.border}`,
              boxShadow: dropped && clearP < 1
                ? "0 0 0 6px rgba(217,119,87,0.10)"
                : "none",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 18,
            }}
          >
            {/* attachment thumb (after drop, before clear) */}
            {dropped && clearP < 0.999 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: 1 - clearP,
                  transform: `scale(${0.7 + 0.3 * Math.min(1, dropS)})`,
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 14,
                    backgroundColor: C.cream,
                    border: `1.5px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Img
                    src={staticFile("fish-audio/watch7-green.png")}
                    style={{ width: 74, height: 58, objectFit: "contain" }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 17,
                    fontWeight: 500,
                    color: C.muted,
                  }}
                >
                  watch7-green.png
                </span>
              </div>
            ) : null}
            {/* typed prompt */}
            {clearP < 0.999 ? (
              <div
                style={{
                  fontSize: 25,
                  fontWeight: 500,
                  color: C.ink,
                  whiteSpace: "nowrap",
                  opacity: 1 - clearP,
                }}
              >
                {PROMPT.slice(0, typed)}
                {frame >= TYPE_START - 6 && frame < SEND_AT + 4 ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: 3.5,
                      height: 28,
                      marginLeft: 3,
                      verticalAlign: "middle",
                      backgroundColor: C.coral,
                      opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {/* placeholder returns after send */}
            {clearP >= 0.999 ? (
              <span style={{ fontSize: 24, color: C.muted, fontStyle: "italic" }}>
                Message Claude
              </span>
            ) : null}
          </div>

          {/* send button */}
          <div
            style={{
              position: "absolute",
              left: SEND.x - CARD.x - SEND.r,
              top: SEND.y - CARD.y - SEND.r,
              width: SEND.r * 2,
              height: SEND.r * 2,
              borderRadius: "50%",
              backgroundColor: C.coral,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${1 - press * 0.12})`,
              boxShadow: "0 10px 26px rgba(217,119,87,0.4)",
            }}
          >
            <svg width={30} height={30} viewBox="0 0 30 30">
              <path
                d="M15 24 L15 7 M15 7 L7.5 14.5 M15 7 L22.5 14.5"
                fill="none"
                stroke="#fff"
                strokeWidth={3.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* send ripple */}
          {ripple > 0.001 && ripple < 0.999 ? (
            <div
              style={{
                position: "absolute",
                left: SEND.x - CARD.x - 52 * ripple,
                top: SEND.y - CARD.y - 52 * ripple,
                width: 104 * ripple,
                height: 104 * ripple,
                borderRadius: "50%",
                border: `${Math.max(1.5, 5 * (1 - ripple))}px solid ${C.coral}`,
                opacity: 0.7 * (1 - ripple),
              }}
            />
          ) : null}
        </div>

        {/* ---- dragged product chip ---- */}
        {!dropped ? (
          <div
            style={{
              position: "absolute",
              left: chip.x - 100,
              top: chip.y - 100,
              width: 200,
              height: 200,
              borderRadius: 24,
              backgroundColor: C.card,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 26px 60px rgba(32,21,21,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${Math.sin(chip.t * Math.PI) * -7}deg) scale(${0.94 + chip.t * 0.06})`,
            }}
          >
            <Img
              src={staticFile("fish-audio/watch7-green.png")}
              style={{ width: 176, height: 136, objectFit: "contain" }}
            />
          </div>
        ) : null}

        {/* ---- cursor ---- */}
        {cursorFade > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: cursorPos.x,
              top: cursorPos.y,
              opacity: cursorFade,
            }}
          >
            <svg
              width={34}
              height={46}
              viewBox="0 0 34 46"
              style={{
                transform: `scale(${1 - press * 0.14 - (frame <= DRAG_END ? 0.1 : 0)})`,
                filter: "drop-shadow(0 3px 7px rgba(32,21,21,0.35))",
              }}
            >
              <path
                d="M4 2 L4 34 L12.2 26.6 L17.4 38.4 L23.6 35.6 L18.4 24.2 L29 23.4 Z"
                fill="#FFFFFF"
                stroke={C.ink}
                strokeWidth={2.4}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
