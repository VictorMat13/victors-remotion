import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter();

export const DURATION_IN_FRAMES = 200;

const COLORS = {
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  ink: "#1B1720",
  muted: "#8b8079",
  paper: "#fbfbf9",
  line: "#ece8e3",
  card: "#ffffff",
  idleBg: "#F4F1ED",
  idleText: "#9A938C",
};

// ---------- timeline ----------
const SCAN_START = 36;
const SCAN_END = 74;
const FLIP_START = 78;
const VIDEO_START = 86; // flip crosses 90° around here
const VIDEO_SECONDS = 4.04;

// ---------- card geometry ----------
const CARD_W = 660;
const CARD_H = 470;
const CARD_X = (1080 - CARD_W) / 2;
const CARD_Y = 428;
const BAR_H = 62; // player control bar

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(760px 760px at 50% 56%, rgba(255,79,1,0.08), rgba(255,79,1,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        WebkitMaskImage:
          "radial-gradient(700px 700px at 50% 50%, #000 45%, transparent 85%)",
        maskImage:
          "radial-gradient(700px 700px at 50% 50%, #000 45%, transparent 85%)",
      }}
    />
  </AbsoluteFill>
);

const BoltGlyph: React.FC<{ size?: number }> = ({ size = 54 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M13 2 4.5 13.5h6L11 22l8.5-11.5h-6L13 2Z"
      fill="#ffffff"
      stroke="#ffffff"
      strokeWidth={1}
      strokeLinejoin="round"
    />
  </svg>
);

// front face of the hero card — the "product"
const ProductFace: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 28,
      background: COLORS.card,
      border: `1.5px solid ${COLORS.line}`,
      padding: "44px 48px",
      display: "flex",
      flexDirection: "column",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      overflow: "hidden",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div
        style={{
          width: 112,
          height: 112,
          borderRadius: 26,
          background: "linear-gradient(135deg, #ff7a35, #ff4f01)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 14px 30px rgba(255,79,1,0.30)",
          flexShrink: 0,
        }}
      >
        <BoltGlyph />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1.2,
            color: COLORS.ink,
            lineHeight: 1,
          }}
        >
          AI Solutions
        </span>
        <span style={{ fontSize: 24, fontWeight: 600, color: COLORS.muted }}>
          Your product · app · offer
        </span>
      </div>
    </div>

    <div
      style={{ height: 1.5, background: COLORS.line, margin: "38px 0 30px" }}
    />

    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {["AI agents", "Automations", "Chatbots"].map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: COLORS.ink,
            background: COLORS.idleBg,
            border: `1.5px solid ${COLORS.line}`,
            borderRadius: 999,
            padding: "12px 24px",
          }}
        >
          {chip}
        </span>
      ))}
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginTop: 34,
      }}
    >
      <div
        style={{
          width: "82%",
          height: 16,
          borderRadius: 8,
          background: COLORS.idleBg,
        }}
      />
      <div
        style={{
          width: "58%",
          height: 16,
          borderRadius: 8,
          background: COLORS.idleBg,
        }}
      />
    </div>
  </div>
);

// back face of the hero card — the generated product video
const VideoFace: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const elapsed = Math.max(0, (frame - VIDEO_START) / fps);
  const progress = Math.min(elapsed / VIDEO_SECONDS, 1);
  const timecode = `0:${String(Math.min(Math.floor(elapsed), 9)).padStart(2, "0")}`;

  // play button pops right after the flip lands, then fades out
  const playPop = spring({
    frame: frame - (VIDEO_START + 4),
    fps,
    config: { damping: 12, stiffness: 190 },
  });
  const playFade = interpolate(
    frame,
    [VIDEO_START + 26, VIDEO_START + 40],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 28,
        background: COLORS.ink,
        border: `1.5px solid rgba(255,79,1,0.45)`,
        overflow: "hidden",
        transform: "rotateY(180deg)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* video area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: BAR_H,
          overflow: "hidden",
        }}
      >
        <Sequence from={VIDEO_START} layout="none">
          <OffthreadVideo
            src={staticFile("ai-solutions-demo.mp4")}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>

        {/* play button overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: playFade,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              display: "grid",
              placeItems: "center",
              transform: `scale(${0.6 + 0.4 * playPop})`,
              boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            }}
          >
            <svg
              width={38}
              height={38}
              viewBox="0 0 24 24"
              style={{ marginLeft: 5 }}
            >
              <path d="M7 4.5v15l13-7.5L7 4.5Z" fill={COLORS.orange} />
            </svg>
          </div>
        </div>
      </div>

      {/* control bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: BAR_H,
          background: "rgba(12,10,16,0.92)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 24px",
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24">
          <path d="M7 4.5v15l13-7.5L7 4.5Z" fill="#ffffff" />
        </svg>
        <div
          style={{
            flex: 1,
            height: 7,
            borderRadius: 4,
            background: "rgba(255,255,255,0.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 4,
              background: COLORS.orange,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: "#ffffff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timecode} / 0:04
        </span>
      </div>
    </div>
  );
};

export const AiVideoGenScan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------- intro ----------
  const introBlur = interpolate(frame, [0, 12], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kicker = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const head1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const head2 = spring({
    frame: frame - 11,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const cardIn = spring({
    frame: frame - 14,
    fps,
    config: { damping: 15, stiffness: 130 },
  });

  // ---------- scan ----------
  const scanY = interpolate(frame, [SCAN_START, SCAN_END], [0, CARD_H], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanOn = frame >= SCAN_START && frame <= SCAN_END + 2;
  const scanPct = Math.round(
    interpolate(frame, [SCAN_START, SCAN_END], [0, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const bracketsIn = spring({
    frame: frame - (SCAN_START - 8),
    fps,
    config: { damping: 14, stiffness: 170 },
  });
  const bracketsOut = interpolate(
    frame,
    [SCAN_END + 2, SCAN_END + 10],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const bracketOpacity = Math.min(bracketsIn, bracketsOut);

  // ---------- flip ----------
  const flip = spring({
    frame: frame - FLIP_START,
    fps,
    config: { damping: 17, stiffness: 90 },
  });
  const rotation = flip * 180;
  const flipped = rotation >= 90;

  // chip state: generator label during scan → ready after flip
  const chipIn = spring({
    frame: frame - (SCAN_START - 10),
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const readyIn = spring({
    frame: frame - (VIDEO_START + 6),
    fps,
    config: { damping: 13, stiffness: 170 },
  });

  const cardShadow = flipped
    ? "0 30px 70px rgba(255,79,1,0.22)"
    : "0 26px 60px rgba(32,21,21,0.12)";

  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <Background />

      <AbsoluteFill
        style={{ opacity: introOpacity, filter: `blur(${introBlur}px)` }}
      >
        {/* ---------- kicker ---------- */}
        <div
          style={{
            position: "absolute",
            top: 92,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orangeDeep,
              padding: "9px 18px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 16}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            Step 1
          </div>
        </div>

        {/* ---------- headline ---------- */}
        <div
          style={{
            position: "absolute",
            top: 160,
            left: 60,
            right: 60,
            textAlign: "center",
            fontSize: 64,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: -1.6,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - head1) * 18}px)`,
              opacity: head1,
            }}
          >
            Run your product through
          </div>
          <div
            style={{
              transform: `translateY(${(1 - head2) * 18}px)`,
              opacity: head2,
            }}
          >
            an <span style={{ color: COLORS.orange }}>AI video generator</span>
          </div>
        </div>

        {/* ---------- status chip ---------- */}
        <div
          style={{
            position: "absolute",
            top: CARD_Y - 74,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {!flipped ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.ink,
                background: COLORS.card,
                border: `1.5px solid ${COLORS.line}`,
                borderRadius: 999,
                padding: "12px 26px",
                boxShadow: "0 12px 28px rgba(32,21,21,0.08)",
                transform: `translateY(${(1 - chipIn) * 14}px)`,
                opacity: chipIn,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2 4.5 13.5h6L11 22l8.5-11.5h-6L13 2Z"
                  stroke={COLORS.orange}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                />
              </svg>
              Analyzing
              <span
                style={{
                  color: COLORS.orange,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {scanPct}%
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.orangeDeep,
                background: "rgba(255,79,1,0.06)",
                border: "1.5px solid rgba(255,79,1,0.35)",
                borderRadius: 999,
                padding: "12px 26px",
                transform: `translateY(${(1 - readyIn) * 14}px) scale(${0.92 + 0.08 * readyIn})`,
                opacity: readyIn,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  stroke={COLORS.orange}
                  strokeWidth={1.8}
                />
                <path
                  d="m8 12.2 2.7 2.7L16 9.6"
                  stroke={COLORS.orange}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Product video ready
            </div>
          )}
        </div>

        {/* ---------- hero card (flips) ---------- */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            height: CARD_H,
            perspective: 1400,
            transform: `translateY(${(1 - cardIn) * 40}px) scale(${0.92 + 0.08 * cardIn})`,
            opacity: cardIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transform: `rotateY(${rotation}deg)`,
              borderRadius: 28,
              boxShadow: cardShadow,
            }}
          >
            <ProductFace />
            <VideoFace frame={frame} fps={fps} />
          </div>

          {/* scan beam — clipped to the card, only over the front face */}
          {scanOn && !flipped && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 28,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              {/* swept tint above the beam */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: scanY,
                  background: "rgba(255,79,1,0.05)",
                }}
              />
              {/* the beam */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: scanY - 3,
                  height: 6,
                  background: COLORS.orange,
                  boxShadow: "0 0 24px 6px rgba(255,79,1,0.45)",
                  borderRadius: 3,
                }}
              />
            </div>
          )}

          {/* viewfinder corner brackets */}
          <svg
            width={CARD_W + 56}
            height={CARD_H + 56}
            style={{
              position: "absolute",
              left: -28,
              top: -28,
              opacity: bracketOpacity,
              pointerEvents: "none",
            }}
          >
            {(
              [
                [10, 10, 58, 10, 10, 58],
                [CARD_W + 46, 10, CARD_W - 2, 10, CARD_W + 46, 58],
                [10, CARD_H + 46, 10, CARD_H - 2, 58, CARD_H + 46],
                [
                  CARD_W + 46,
                  CARD_H + 46,
                  CARD_W - 2,
                  CARD_H + 46,
                  CARD_W + 46,
                  CARD_H - 2,
                ],
              ] as const
            ).map(([cx, cy, x1, y1, x2, y2], i) => (
              <path
                key={i}
                d={`M ${x1} ${y1} L ${cx} ${cy} L ${x2} ${y2}`}
                stroke={COLORS.orange}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
