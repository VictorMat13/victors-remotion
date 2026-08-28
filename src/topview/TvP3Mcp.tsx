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
import { FONT_MONO, FONT_SANS, SPRINGS, TOPVIEW, TV } from "./theme";

// ============================================================================
// TvP3Mcp — "This is the TopView MCP. One line in Claude Code and it's
// connected."  LIAM WHITE STYLE (matches approved NotionP3CliUnlock).
// Beat 1 (0–~100): tight on a dark terminal CARD ("claude" title) floating on
//   the warm white world with a soft drop shadow; the REAL one-liner types out
//   and lands a green ✓.
// Beat 2 (~100–164): camera pulls back, terminal recedes to a node; white
//   Claude chip docks left, white Topview chip docks right; a solid purple
//   line draws through the terminal node; soft violet wash when it lands.
// Hold (164–179): pulse drifting the line, cursor blinking in the node.
// ============================================================================

export const DURATION_IN_FRAMES = 180;

// ---------------------------------------------------------------------------
// World constants (final camera: fx=1080, fy=1080, z=1 → screen = world - 540)
// ---------------------------------------------------------------------------
const VIEW = 1080;
const WORLD = 2160;

const TERM = { x: 620, y: 850, w: 920, h: 460 }; // centered on (1080, 1080)
const NODE_SCALE = 0.36;

// Terminal script timing
const CMD = TOPVIEW.claudeCodeOneLiner; // 66 chars, real syntax + endpoint
const TYPE_START = 8;
const TYPE_RATE = 1.5; // chars per frame
const OK_AT = 62;
const PROMPT_AT = 74;

// Beat 2 timing
const RECEDE_START = 102;
const RECEDE_END = 134;
const CHIP_L_IN = 118;
const CHIP_R_IN = 124;
const LINE_START = 136;
const LINE_END = 156; // handshake lands here
const PULSE_FROM = 170; // hold pulse visible on the left segment at frame 179

// Connection geometry
const CHIP_SIZE = 170;
const CHIP_L_CX = 700;
const CHIP_R_CX = 1460;
const CHIP_CY = 1080;
const LINE_Y = 1080;
const LINE_X0 = CHIP_L_CX + CHIP_SIZE / 2; // 785
const LINE_X1 = CHIP_R_CX - CHIP_SIZE / 2; // 1375

const TERMINAL_GREEN = "#4ADE80";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const Cursor: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: "inline-block",
      width: "0.58em",
      height: "1.02em",
      transform: "translateY(0.16em)",
      backgroundColor: "#F2F4F8",
      opacity: on ? 1 : 0,
      marginLeft: 2,
    }}
  />
);

const RingPulse: React.FC<{
  frame: number;
  at: number;
  radius: number;
  color: string;
}> = ({ frame, at, radius, color }) => {
  const p = interpolate(frame, [at, at + 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  if (p <= 0 || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: -6 - 20 * p,
        borderRadius: radius + 6 + 20 * p,
        border: `3px solid ${color}`,
        opacity: 0.8 * (1 - p),
        pointerEvents: "none",
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Terminal card — dark card on the white world (approved pattern), "claude"
// title, one real command
// ---------------------------------------------------------------------------
const TerminalCard: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;

  // Recede to node during the pull-back
  const s = interpolate(f, [RECEDE_START, RECEDE_END], [1, NODE_SCALE], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // Green success bloom when the ✓ lands
  const okGlow = interpolate(f, [OK_AT, OK_AT + 8, OK_AT + 34], [0, 1, 0], clamp);

  const typedCount = Math.max(
    0,
    Math.min(CMD.length, Math.floor((f - TYPE_START) * TYPE_RATE))
  );
  const typed = CMD.slice(0, typedCount);
  const typing = f >= TYPE_START && typedCount < CMD.length;
  const blinkOn = f % 26 < 15;
  const promptShown = f >= PROMPT_AT;

  const okAppear = interpolate(f, [OK_AT, OK_AT + 4], [0, 1], clamp);
  const promptAppear = interpolate(f, [PROMPT_AT, PROMPT_AT + 4], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: TERM.x,
        top: TERM.y,
        width: TERM.w,
        height: TERM.h,
        transform: `scale(${s})`,
        transformOrigin: "50% 50%",
        borderRadius: 20,
        backgroundColor: "#17171B",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: `0 0 0 ${
          6 * okGlow
        }px rgba(34,197,94,0.16), 0 18px 50px rgba(23,23,28,0.16), 0 5px 16px rgba(23,23,28,0.08)`,
        overflow: "hidden",
      }}
    >
      {/* title bar */}
      <div
        style={{
          height: 56,
          backgroundColor: "#1E1E26",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#FF5F57" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#FEBC2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#28C840" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 20,
            color: "#8B8B92",
          }}
        >
          claude
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "26px 40px", fontFamily: FONT_MONO, fontSize: 30 }}>
        {/* command — wraps like a real terminal */}
        <div
          style={{
            width: TERM.w - 80,
            lineHeight: "46px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <span style={{ color: "#6E7681" }}>{"~ $ "}</span>
          <span style={{ color: "#F2F4F8" }}>{typed}</span>
          {!promptShown ? <Cursor on={typing ? true : blinkOn} /> : null}
        </div>

        {/* success output */}
        {f >= OK_AT ? (
          <div
            style={{
              lineHeight: "46px",
              whiteSpace: "pre",
              opacity: okAppear,
              color: TERMINAL_GREEN,
            }}
          >
            {"✓ topview connected"}
          </div>
        ) : null}

        {/* fresh prompt */}
        {promptShown ? (
          <div style={{ lineHeight: "46px", whiteSpace: "pre", opacity: promptAppear }}>
            <span style={{ color: "#6E7681" }}>{"~ $ "}</span>
            <Cursor on={blinkOn} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Logo chip — white card tile (soft shadow, hairline border) that docks
// beside the node
// ---------------------------------------------------------------------------
const LogoChip: React.FC<{
  frame: number;
  fps: number;
  cx: number;
  enter: number;
  slideFrom: number; // px offset it slides in from (negative = from left)
  label: string;
  logoSrc: string;
  logoRadius?: number;
  ringAt?: number;
  bobPhase: number;
}> = ({ frame, fps, cx, enter, slideFrom, label, logoSrc, logoRadius, ringAt, bobPhase }) => {
  const sIn = spring({
    frame: frame - enter,
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 30,
  });
  const scale = 0.4 + 0.6 * sIn; // pop from 40%, never a dot artifact
  const opacity = interpolate(frame, [enter, enter + 8], [0, 1], clamp);
  const slide = slideFrom * (1 - sIn);
  const bob = frame > LINE_END ? 2 * Math.sin(frame / 37 + bobPhase) : 0;
  const connected = frame >= LINE_END + 2;
  const dotIn = spring({
    frame: frame - (LINE_END + 2),
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: cx - CHIP_SIZE / 2 + slide,
        top: CHIP_CY - CHIP_SIZE / 2 + bob,
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        transform: `scale(${scale})`,
        opacity,
        borderRadius: 30,
        backgroundColor: TV.panel,
        border: `1px solid ${TV.border}`,
        boxShadow: "0 20px 50px rgba(15,23,42,0.12), 0 3px 10px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {ringAt !== undefined ? (
        <RingPulse frame={frame} at={ringAt} radius={30} color="rgba(167,139,250,0.8)" />
      ) : null}
      <Img
        src={logoSrc}
        style={{ width: 84, height: 84, borderRadius: logoRadius ?? 0 }}
      />
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 24,
          fontWeight: 600,
          color: TV.text,
        }}
      >
        {label}
      </div>
      {connected ? (
        <div
          style={{
            position: "absolute",
            top: 13,
            right: 13,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: TV.green,
            transform: `scale(${dotIn})`,
            boxShadow: "0 0 0 3px rgba(34,197,94,0.20)",
          }}
        />
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const TvP3Mcp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.inOut(Easing.cubic);

  // Camera — one shared keyframe timeline
  const KEY_T = [0, 8, 36, 52, 102, 132, 156, 172, 179];
  const fx = interpolate(
    frame,
    KEY_T,
    [960, 968, 1074, 1074, 1074, 1080, 1080, 1080, 1080],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [1050, 1048, 1030, 1030, 1030, 1080, 1080, 1080, 1080],
    { easing: ease, extrapolateRight: "clamp" }
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.45, 1.42, 1.15, 1.15, 1.16, 1.0, 1.0, 1.003, 1.005],
    { easing: ease, extrapolateRight: "clamp" }
  );

  // Connection line draw
  const lineP = interpolate(frame, [LINE_START, LINE_END], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const tipX = LINE_X0 + (LINE_X1 - LINE_X0) * lineP;

  // Handshake bloom when the line lands
  const handshake = interpolate(
    frame,
    [LINE_END, LINE_END + 6, LINE_END + 18],
    [0, 1, 0],
    clamp
  );

  // Traveling pulse after the handshake
  const pulseT = ((frame - PULSE_FROM) / 48) % 1;
  const pulseX = LINE_X0 + (LINE_X1 - LINE_X0) * pulseT;
  const pulseFade =
    interpolate(pulseT, [0, 0.08], [0, 1], clamp) *
    interpolate(pulseT, [0.92, 1], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: TV.bg }}>
      {/* world + camera */}
      <div
        style={{
          position: "absolute",
          width: WORLD,
          height: WORLD,
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* connection line + pulse (behind the node and chips) */}
        <svg
          width={WORLD}
          height={WORLD}
          viewBox={`0 0 ${WORLD} ${WORLD}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {lineP > 0.005 ? (
            <>
              {/* soft violet wash under the line */}
              <line
                x1={LINE_X0}
                y1={LINE_Y}
                x2={LINE_X1}
                y2={LINE_Y}
                pathLength={1}
                stroke={TV.violet}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={1 - lineP}
                opacity={0.14 + 0.22 * handshake}
              />
              {/* core stroke — solid Topview purple */}
              <line
                x1={LINE_X0}
                y1={LINE_Y}
                x2={LINE_X1}
                y2={LINE_Y}
                pathLength={1}
                stroke={TV.purple}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={1 - lineP}
                opacity={0.95}
              />
            </>
          ) : null}

          {/* leading tip while drawing */}
          {lineP > 0.005 && lineP < 1 ? (
            <g>
              <circle cx={tipX} cy={LINE_Y} r={14} fill={TV.violet} opacity={0.3} />
              <circle cx={tipX} cy={LINE_Y} r={7} fill={TV.purple} />
            </g>
          ) : null}

          {/* handshake — soft violet wash at the landing point */}
          {handshake > 0 ? (
            <g>
              <circle
                cx={LINE_X1}
                cy={LINE_Y}
                r={10 + 26 * (1 - handshake)}
                fill="none"
                stroke={TV.violet}
                strokeWidth={3}
                opacity={0.7 * handshake}
              />
              <circle cx={LINE_X1} cy={LINE_Y} r={8} fill={TV.purple} opacity={0.9 * handshake} />
            </g>
          ) : null}

          {/* traveling pulse during the hold — soft violet halo, purple core */}
          {frame >= PULSE_FROM ? (
            <g opacity={pulseFade}>
              <circle cx={pulseX} cy={LINE_Y} r={14} fill={TV.violet} opacity={0.32} />
              <circle cx={pulseX} cy={LINE_Y} r={6.5} fill={TV.purple} />
            </g>
          ) : null}
        </svg>

        {/* terminal (full card → node) */}
        <TerminalCard frame={frame} />

        {/* Claude chip — docks left */}
        <LogoChip
          frame={frame}
          fps={fps}
          cx={CHIP_L_CX}
          enter={CHIP_L_IN}
          slideFrom={-40}
          label="Claude"
          logoSrc={staticFile("openseo/logos/claude-color.svg")}
          ringAt={LINE_START}
          bobPhase={0.6}
        />

        {/* Topview chip — docks right */}
        <LogoChip
          frame={frame}
          fps={fps}
          cx={CHIP_R_CX}
          enter={CHIP_R_IN}
          slideFrom={40}
          label="Topview"
          logoSrc={staticFile("topview/topview-icon.webp")}
          logoRadius={20}
          ringAt={LINE_END}
          bobPhase={2.4}
        />
      </div>
    </AbsoluteFill>
  );
};
