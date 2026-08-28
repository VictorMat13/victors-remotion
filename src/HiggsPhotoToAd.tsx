import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

// 92-frame Claude-interface intro + UGC footage (450f source, first 8 trimmed)
export const DURATION_IN_FRAMES = 512;

const COLORS = {
  ink: "#191714",
  muted: "#6B7280",
  paper: "#FBFAF8",
  line: "#ECE8E2",
  card: "#FFFFFF",
  coral: "#D97757",
  coralDeep: "#C05F3F",
  bubble: "#F0EEE9",
  skeleton: "#EFECE6",
};

const FONT = fontFamily;

const PROMPT = "Make a UGC ad for this product with Higgsfield";

// Beat timeline
const T = {
  attach: 8, // photo chip pops into the composer
  typeStart: 18,
  typeEnd: 42,
  send: 46, // send button press
  bubble: 50, // user message lands in the chat
  reply: 62, // Claude reply card (generating)
  videoIn: 70, // footage starts inside the card
  expand: 78, // card grows to full frame
  expandEnd: 96,
};

// Reply card rect (portrait 9:16 preview) → full frame
const CARD = { x: 150, y: 730, w: 390, h: 580 };

export const HiggsPhotoToAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Composer content ---------------------------------------------------------
  const attachPop = spring({
    frame: frame - T.attach,
    fps,
    config: { damping: 13, stiffness: 190 },
  });
  const typedCount = Math.round(
    interpolate(frame, [T.typeStart, T.typeEnd], [0, PROMPT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = PROMPT.slice(0, typedCount);
  const caretOn =
    frame >= T.typeStart - 6 && frame < T.send && frame % 20 < 12;
  const sent = frame >= T.bubble;

  // Send button press
  const sendPress = interpolate(frame, [T.send - 2, T.send, T.send + 5], [1, 0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- User bubble ----------------------------------------------------------------
  const bubbleIn = spring({
    frame: frame - T.bubble,
    fps,
    config: { damping: 17, stiffness: 150 },
  });

  // --- Claude reply ------------------------------------------------------------------
  const replyIn = spring({
    frame: frame - T.reply,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const shimmer = 0.75 + 0.25 * Math.sin(frame / 2.6);

  // --- Card expansion -------------------------------------------------------------------
  const grow = spring({
    frame: frame - T.expand,
    fps,
    config: { damping: 26, stiffness: 110 },
  });
  const cardX = interpolate(grow, [0, 1], [CARD.x, 0]);
  const cardY = interpolate(grow, [0, 1], [CARD.y, 0]);
  const cardW = interpolate(grow, [0, 1], [CARD.w, 1080]);
  const cardH = interpolate(grow, [0, 1], [CARD.h, 1920]);
  const cardR = interpolate(grow, [0, 1], [22, 0]);

  // Interface fades away as the ad takes over
  const uiFade = interpolate(frame, [T.expand + 2, T.expandEnd - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const gone = grow > 0.995;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* Grid + soft coral glow — Liam paper system */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,23,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          WebkitMaskImage:
            "radial-gradient(900px 1200px at 50% 45%, #000 40%, transparent 85%)",
          maskImage:
            "radial-gradient(900px 1200px at 50% 45%, #000 40%, transparent 85%)",
          opacity: uiFade,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 700,
          top: 800 - 700,
          width: 1400,
          height: 1400,
          background:
            "radial-gradient(circle at 50% 50%, rgba(217,119,87,0.08), rgba(0,0,0,0) 62%)",
          opacity: uiFade,
        }}
      />

      {/* Header — Claude */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 210,
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: uiFade,
        }}
      >
        <Img
          src={staticFile("fable5/claude-logo.png")}
          style={{ width: 52, height: 52 }}
        />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: -1,
            color: COLORS.ink,
          }}
        >
          Claude
        </span>
      </div>

      {/* User message bubble (after send) */}
      <div
        style={{
          position: "absolute",
          right: 90,
          top: 330,
          width: 560,
          borderRadius: 26,
          background: COLORS.bubble,
          border: `1px solid ${COLORS.line}`,
          padding: 20,
          opacity: Math.min(bubbleIn, uiFade),
          transform: `translateY(${(1 - bubbleIn) * 46}px)`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 260,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <Img
            src={staticFile("higgs3/product-photo.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 33,
            fontWeight: 600,
            lineHeight: 1.35,
            color: COLORS.ink,
          }}
        >
          {PROMPT}
        </div>
      </div>

      {/* Claude reply — spark + generating card that becomes the ad */}
      <div
        style={{
          position: "absolute",
          left: 92,
          top: CARD.y + 4,
          opacity: Math.min(replyIn, uiFade),
        }}
      >
        <Img
          src={staticFile("fable5/claude-logo.png")}
          style={{ width: 42, height: 42 }}
        />
      </div>

      {/* The card itself (skeleton → video → full frame). Always above the UI. */}
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: cardW,
          height: cardH,
          borderRadius: cardR,
          overflow: "hidden",
          zIndex: 10,
          background: gone ? COLORS.paper : COLORS.skeleton,
          border: gone ? "none" : `1px solid ${COLORS.line}`,
          boxShadow: gone
            ? "none"
            : `0 18px 44px rgba(25,23,20,${0.1 * (1 - grow)})`,
          opacity: replyIn,
        }}
      >
        {/* Generating shimmer + pulsing spark before the footage arrives */}
        {frame < T.videoIn + 4 && (
          <AbsoluteFill
            style={{
              background: COLORS.skeleton,
              opacity: shimmer,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Img
              src={staticFile("fable5/claude-logo.png")}
              style={{
                width: 64,
                height: 64,
                opacity: 0.5 + 0.5 * Math.sin(frame / 4),
              }}
            />
          </AbsoluteFill>
        )}
        {/* The generated ad */}
        <Sequence from={T.videoIn} layout="none">
          <OffthreadVideo
            src={staticFile("higgs3/ugc-source.mp4")}
            trimBefore={8}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      </div>

      {/* Composer */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1440,
          width: 900,
          minHeight: 200,
          borderRadius: 30,
          background: COLORS.card,
          border: `1.5px solid ${COLORS.line}`,
          boxShadow: "0 18px 44px rgba(25,23,20,0.07)",
          padding: "24px 28px",
          opacity: uiFade,
        }}
      >
        {!sent && (
          <>
            {/* attachment chip */}
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${COLORS.line}`,
                transform: `scale(${0.5 + 0.5 * attachPop}) rotate(${(1 - attachPop) * -6}deg)`,
                opacity: attachPop,
                marginBottom: 18,
              }}
            >
              <Img
                src={staticFile("higgs3/product-photo.png")}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 34,
                fontWeight: 500,
                color: COLORS.ink,
                minHeight: 46,
                paddingRight: 110,
              }}
            >
              {typed}
              {caretOn && (
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 38,
                    background: COLORS.ink,
                    verticalAlign: "-6px",
                    marginLeft: 3,
                  }}
                />
              )}
            </div>
          </>
        )}
        {sent && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 500,
              color: "#B8B2A8",
              minHeight: 46,
              display: "flex",
              alignItems: "center",
            }}
          >
            Reply to Claude…
          </div>
        )}
        {/* send button */}
        <div
          style={{
            position: "absolute",
            right: 26,
            bottom: 26,
            width: 74,
            height: 74,
            borderRadius: 999,
            background: COLORS.coral,
            display: "grid",
            placeItems: "center",
            transform: `scale(${sendPress})`,
            boxShadow: "0 10px 24px rgba(217,119,87,0.35)",
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V6" />
            <path d="M6 12l6-6 6 6" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
