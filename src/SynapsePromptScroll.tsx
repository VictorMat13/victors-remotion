import React, { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { PROMPT_BLOCKS, Block } from "./SynapsePromptContent";

const { fontFamily: mono, waitUntilDone } = loadMono();

export const DURATION_IN_FRAMES = 405;

const COLORS = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E7E9EF",
  headerLine: "#EEF0F4",
  ink: "#14161C",
  body: "#4A5160",
  muted: "#9AA1AE",
  blue: "#2563EB",
  inlineCodeBg: "#EEF3FE",
  codeBg: "#F6F8FA",
  codeBorder: "#E7EAF0",
  codeText: "#3F4756",
  thumb: "rgba(20, 24, 36, 0.18)",
};

// ---------- geometry ----------
const FRAME = 1080;
const CARD_M = 60;
const CARD = FRAME - CARD_M * 2; // 960
const RADIUS = 24;
const HEADER_H = 64;
const VIEW_H = CARD - HEADER_H; // 896
const PAD_X = 52;

// ---------- scroll timeline: momentum flicks ----------
const SCROLL_START = 34;
const FLICK_EVERY = 44;
const FLICK_MOVE = 32;
const FLICKS = [0, 0.115, 0.245, 0.375, 0.505, 0.635, 0.765, 0.885, 1];
const FLICK_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const scrollFractionAt = (frame: number): number => {
  let frac = FLICKS[0];
  for (let i = 0; i < FLICKS.length - 1; i++) {
    const start = SCROLL_START + i * FLICK_EVERY;
    if (frame < start) {
      return frac;
    }
    const p = Math.min(1, (frame - start) / FLICK_MOVE);
    frac = FLICKS[i] + (FLICKS[i + 1] - FLICKS[i]) * FLICK_EASE(p);
  }
  return frac;
};

// ---------- inline markdown: **bold** and `code` ----------
const renderInline = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.+?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: COLORS.ink, fontWeight: 700 }}>
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          style={{
            backgroundColor: COLORS.inlineCodeBg,
            color: COLORS.blue,
            borderRadius: 6,
            padding: "1px 7px",
            fontSize: "0.93em",
            wordBreak: "break-all",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.t) {
    case "h1":
      return (
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: "-0.02em",
            margin: "6px 0 18px",
          }}
        >
          {block.text}
        </div>
      );
    case "h2":
      return (
        <div
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: "-0.01em",
            margin: "38px 0 16px",
          }}
        >
          {renderInline(block.text)}
        </div>
      );
    case "p":
      return (
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.62,
            color: COLORS.body,
            margin: "16px 0",
          }}
        >
          {renderInline(block.text)}
        </div>
      );
    case "li":
      return (
        <div
          style={{
            display: "flex",
            fontSize: 20,
            lineHeight: 1.62,
            color: COLORS.body,
            margin: "9px 0",
          }}
        >
          <span style={{ width: 28, flexShrink: 0, color: COLORS.muted }}>
            •
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {renderInline(block.text)}
          </span>
        </div>
      );
    case "num":
      return (
        <div
          style={{
            display: "flex",
            fontSize: 20,
            lineHeight: 1.62,
            color: COLORS.body,
            margin: "10px 0",
          }}
        >
          <span
            style={{
              width: 34,
              flexShrink: 0,
              color: COLORS.blue,
              fontWeight: 700,
            }}
          >
            {block.n}.
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            {renderInline(block.text)}
          </span>
        </div>
      );
    case "code":
      return (
        <pre
          style={{
            backgroundColor: COLORS.codeBg,
            border: `1px solid ${COLORS.codeBorder}`,
            borderRadius: 14,
            padding: "22px 26px",
            margin: "18px 0",
            fontSize: 17.5,
            lineHeight: 1.6,
            color: COLORS.codeText,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "inherit",
          }}
        >
          {block.text}
        </pre>
      );
    case "hr":
      return (
        <div
          style={{
            height: 1,
            backgroundColor: COLORS.headerLine,
            margin: "34px 0",
          }}
        />
      );
    default:
      return null;
  }
};

const TrafficLights: React.FC = () => (
  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <div
        key={c}
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          backgroundColor: c,
        }}
      />
    ))}
  </div>
);

export const SynapsePromptScroll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [handle] = useState(() => delayRender("measure prompt content"));

  useEffect(() => {
    let cancelled = false;
    waitUntilDone().then(() => {
      if (cancelled) {
        return;
      }
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const frac = scrollFractionAt(frame);
  const maxScroll = Math.max(0, (contentHeight ?? VIEW_H) - VIEW_H);
  const scrollY = frac * maxScroll;

  // card entrance
  const enter = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });
  const cardY = interpolate(enter, [0, 1], [36, 0]);
  const cardOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // scrollbar
  const TRACK_PAD = 10;
  const trackH = VIEW_H - TRACK_PAD * 2;
  const contentH = contentHeight ?? VIEW_H;
  const thumbH = Math.max(44, (VIEW_H / contentH) * trackH);
  const thumbY = frac * (trackH - thumbH);
  const thumbOpacity = interpolate(frame, [24, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const percent = Math.round(frac * 100);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: mono }}>
      {/* faint dot grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(#14161C 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          opacity: 0.045,
        }}
      />

      {/* document card */}
      <div
        style={{
          position: "absolute",
          left: CARD_M,
          top: CARD_M,
          width: CARD,
          height: CARD,
          borderRadius: RADIUS,
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          boxShadow:
            "0 30px 80px rgba(18, 24, 40, 0.12), 0 2px 8px rgba(18, 24, 40, 0.05)",
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_H,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            borderBottom: `1px solid ${COLORS.headerLine}`,
          }}
        >
          <TrafficLights />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 15,
              color: COLORS.muted,
              pointerEvents: "none",
            }}
          >
            synapsex-hero-prompt.md
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 14,
              color: COLORS.muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {percent}%
          </div>
        </div>

        {/* scroll viewport */}
        <div
          style={{
            position: "absolute",
            top: HEADER_H,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          }}
        >
          <div
            ref={contentRef}
            style={{
              padding: `40px ${PAD_X + 26}px 72px ${PAD_X}px`,
              transform: `translateY(${-scrollY}px)`,
            }}
          >
            {PROMPT_BLOCKS.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>

          {/* bottom fade hint */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 70,
              background:
                "linear-gradient(to top, #FFFFFF, rgba(255,255,255,0))",
              pointerEvents: "none",
            }}
          />

          {/* scrollbar thumb */}
          <div
            style={{
              position: "absolute",
              right: 8,
              top: TRACK_PAD + thumbY,
              width: 7,
              height: thumbH,
              borderRadius: 4,
              backgroundColor: COLORS.thumb,
              opacity: thumbOpacity,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
