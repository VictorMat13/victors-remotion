import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  A,
  C,
  Card,
  FONT,
  LogoImg,
  MONO,
  OpenSeoMark,
  PaperWorld,
  SPRINGS,
  TerminalPanel,
  tabular,
  useCam,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 250;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical world.
//   connection cluster (two cards + cable + endpoint chip)
//     ↓ connector spine
//   live Claude Code session (terminal)
//
// The terminal is designed 1:1 for a camera zoom of 1.0, so its mono body is
// exactly 30px on the 1080-wide canvas.
// ---------------------------------------------------------------------------

const CARD = { w: 250, h: 260, y: 300 };
const CARD_L_X = 200; // OpenSEO  (the data)
const CARD_R_X = 630; // Claude Code (the AI)
const CABLE = { y: 430, x0: 450, x1: 630, cx: 540 };
const CHIP = { x: 230, y: 612, w: 620, h: 88 };
const SPINE = { x: 540, y0: 430, y1: 880 };
const TERM = { x: 54, y: 880, w: 972, h: 804 };

// Terminal internals (world px == screen px at the terminal camera key)
const GUTTER = 36; // marker column
const CH = 18; // JetBrains Mono advance at 30px
const COL_VOL = GUTTER + 29 * CH; // matches the real openseo.so table
const COL_KD = GUTTER + 40 * CH;

const ROW_Y = {
  prompt: 0,
  call: 96,
  head: 162,
  r0: 228,
  r1: 292,
  r2: 356,
  ok: 452,
  link: 516,
  input: 590,
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  cableSnap: 18,
  chipIn: 20,
  spine: 20, // connector spine draws down, 20 → 38
  pkt1: 24, // packet runs the cable, OpenSEO → Claude Code
  camDown: 36, // 36 → 58
  pkt2: 40, // packet runs down the spine
  termIn: 55,
  type: 64, // prompt types 64 → 86
  call: 92, // tool-call line + spinner
  resolve: 110,
  head: 112,
  rows: [118, 128, 138],
  ok: 154,
  link: 164,
  camBack: 192, // 192 → 214
  pkt3: 212, // closing packet on the cable
  pkt4: 222, // and down the spine
};

const PROMPT = "find and cluster keywords for openseo.so";
const PROMPT_SPLIT = 30; // "find and cluster keywords for ".length
const CALL_NAME = "openseo.keyword_research";
const CALL_ARGS = '(seed: "open source seo")';
const DATA = [
  { kw: "open source seo", vol: "1,300", kd: "12" },
  { kw: "open source seo tools", vol: "720", kd: "9" },
  { kw: "self-hosted seo platform", vol: "210", kd: "4" },
];
const ENDPOINT = "https://app.openseo.so/mcp";

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Packet: React.FC<{ x: number; y: number; op: number; size?: number }> = ({
  x,
  y,
  op,
  size = 18,
}) => {
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        background: C.orange,
        opacity: op,
        zIndex: 30,
      }}
    />
  );
};

const TermRow: React.FC<{
  top: number;
  enter: number;
  children: React.ReactNode;
}> = ({ top, enter, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width: "100%",
      fontFamily: MONO,
      fontSize: 30,
      lineHeight: "40px",
      whiteSpace: "nowrap",
      opacity: enter,
      transform: `translateX(${(1 - enter) * -18}px)`,
    }}
  >
    {children}
  </div>
);

const Marker: React.FC<{ glyph: string; color: string }> = ({
  glyph,
  color,
}) => (
  <span
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      color,
      fontWeight: 700,
    }}
  >
    {glyph}
  </span>
);

// ---------------------------------------------------------------------------

export const SeoMcpPlug: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: tight on the link → down to the terminal → ease back ---------
  const cam = useCam({
    keys: [0, T.camDown, T.camDown + 22, T.camBack, T.camBack + 22, 232, 250],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [555, 555, 1030, 1030, 993, 991, 991],
    z: [1.38, 1.38, 1.0, 1.0, 0.84, 0.838, 0.838],
  });

  // --- Cable ---------------------------------------------------------------
  const cableP = interpolate(frame, [0, T.cableSnap], [0.42, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const snap = spring({
    frame: frame - T.cableSnap,
    fps,
    config: SPRINGS.bouncy,
  });
  const sag = interpolate(snap, [0, 1], [34, 5]);
  const connected = frame >= T.cableSnap;

  const cablePoint = (t: number) => {
    const mt = 1 - t;
    return {
      x: mt * mt * CABLE.x0 + 2 * mt * t * CABLE.cx + t * t * CABLE.x1,
      y: mt * mt * CABLE.y + 2 * mt * t * (CABLE.y + sag) + t * t * CABLE.y,
    };
  };

  // --- Spine ---------------------------------------------------------------
  const spineP = interpolate(frame, [T.spine, T.spine + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // --- Packets -------------------------------------------------------------
  const p1 = interpolate(frame, [T.pkt1, T.pkt1 + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const p1Op = frame >= T.pkt1 && frame <= T.pkt1 + 19 ? 1 : 0;
  const p1Pt = cablePoint(p1);

  const p2 = interpolate(frame, [T.pkt2, T.pkt2 + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const p2Op = frame >= T.pkt2 && frame <= T.pkt2 + 17 ? 1 : 0;

  const p3 = interpolate(frame, [T.pkt3, T.pkt3 + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const p3Op = frame >= T.pkt3 && frame <= T.pkt3 + 21 ? 1 : 0;
  const p3Pt = cablePoint(p3);

  const p4 = interpolate(frame, [T.pkt4, T.pkt4 + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const p4Op = frame >= T.pkt4 && frame <= T.pkt4 + 23 ? 1 : 0;

  // --- Endpoint chip -------------------------------------------------------
  const chipIn = spring({ frame: frame - T.chipIn, fps, config: SPRINGS.pop });
  const nodeIn = spring({
    frame: frame - (T.spine + 16),
    fps,
    config: SPRINGS.pop,
  });

  // --- Terminal ------------------------------------------------------------
  const termIn = spring({
    frame: frame - T.termIn,
    fps,
    config: SPRINGS.snappy,
  });

  const typed = useTypewriter(PROMPT, T.type, 1.8);
  const typing = frame >= T.type && frame < T.call - 4;
  const caretOn = frame % 20 < 12;

  const callIn = spring({ frame: frame - T.call, fps, config: SPRINGS.pop });
  const resolved = frame >= T.resolve;
  const resolvePop = spring({
    frame: frame - T.resolve,
    fps,
    config: SPRINGS.bouncy,
  });
  const headIn = spring({ frame: frame - T.head, fps, config: SPRINGS.pop });
  const rowIn = T.rows.map((at) =>
    spring({ frame: frame - at, fps, config: SPRINGS.pop }),
  );
  const okIn = spring({ frame: frame - T.ok, fps, config: SPRINGS.pop });
  const linkIn = spring({ frame: frame - T.link, fps, config: SPRINGS.pop });
  const inputIn = spring({
    frame: frame - T.termIn - 8,
    fps,
    config: SPRINGS.smooth,
  });


  return (
    <PaperWorld cam={cam}>
      {/* warm glow behind the link */}
      <div
        style={{
          position: "absolute",
          left: CABLE.cx - 540,
          top: CABLE.y - 470,
          width: 1080,
          height: 940,
          background: "transparent",
          opacity: 0,
        }}
      />
      {/* glow behind the terminal once real data lands */}
      <div
        style={{
          position: "absolute",
          left: TERM.x - 120,
          top: TERM.y - 120,
          width: TERM.w + 240,
          height: TERM.h + 240,
          background: "transparent",
          opacity: 0,
        }}
      />

      {/* ---------------------------------------------------------- spine */}
      <svg
        width={40}
        height={480}
        viewBox="0 0 40 480"
        style={{ position: "absolute", left: SPINE.x - 20, top: SPINE.y0 - 10 }}
      >
        <path
          d="M 20 10 L 20 460"
          fill="none"
          stroke={C.orangeLine}
          strokeWidth={5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - spineP}
        />
      </svg>

      {/* ---------------------------------------------------------- cable */}
      <svg
        width={280}
        height={160}
        viewBox="0 0 280 160"
        style={{ position: "absolute", left: CABLE.x0 - 50, top: CABLE.y - 70 }}
      >
        <path
          d={`M 50 70 Q 140 ${70 + sag} 230 70`}
          fill="none"
          stroke={C.orange}
          strokeWidth={5.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - cableP}
        />
      </svg>

      {/* plug nubs */}
      {[CABLE.x0, CABLE.x1].map((px) => {
        const pop = connected ? 0.85 + 0.15 * snap : 0.85;
        return (
          <div
            key={px}
            style={{
              position: "absolute",
              left: px - 11,
              top: CABLE.y - 11,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: C.card,
              border: `4px solid ${C.orange}`,
              transform: `scale(${pop})`,
              boxSizing: "border-box",
            }}
          />
        );
      })}

      {/* ---------------------------------------------------------- cards */}
      <Card x={CARD_L_X} y={CARD.y} w={CARD.w} h={CARD.h} accent={connected}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <OpenSeoMark size={112} />
          <div
            style={{
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.4,
            }}
          >
            OpenSEO
          </div>
        </div>
      </Card>

      <Card x={CARD_R_X} y={CARD.y} w={CARD.w} h={CARD.h} accent={connected}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <LogoImg src={A.logo.claudeCode} size={112} />
          <div
            style={{
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.4,
            }}
          >
            Claude Code
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------- endpoint chip */}
      <div
        style={{
          position: "absolute",
          left: CHIP.x,
          top: CHIP.y,
          width: CHIP.w,
          height: CHIP.h,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.orangeLine}`,
          boxShadow:
            "0 18px 40px rgba(37,99,235,0.10), 0 8px 18px rgba(25,23,20,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          opacity: chipIn,
          transform: `translateY(${(1 - chipIn) * 22}px) scale(${
            0.92 + 0.08 * chipIn
          })`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: C.orange,
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 600,
            color: C.ink,
            letterSpacing: -0.6,
          }}
        >
          {ENDPOINT}
        </div>
      </div>

      {/* ---------------------------------------------------------- terminal */}
      <TerminalPanel
        x={TERM.x}
        y={TERM.y}
        w={TERM.w}
        h={TERM.h}
        title="claude · openseo mcp"
        enter={termIn}
      >
        <div
          style={{
            position: "relative",
            marginLeft: -10,
            marginRight: -10,
            height: 690,
          }}
        >
          {/* prompt */}
          <TermRow top={ROW_Y.prompt} enter={frame >= T.type ? 1 : 0}>
            <Marker glyph="›" color={C.orange} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termText,
              }}
            >
              {typed.slice(0, PROMPT_SPLIT)}
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
                {typed.slice(PROMPT_SPLIT)}
              </span>
            </span>
            {typing ? (
              <span
                style={{
                  display: "inline-block",
                  width: 15,
                  height: 28,
                  marginLeft: 3,
                  verticalAlign: "-3px",
                  background: C.termText,
                  opacity: caretOn ? 0.9 : 0.15,
                }}
              />
            ) : null}
          </TermRow>

          {/* tool call */}
          <TermRow top={ROW_Y.call} enter={callIn}>
            {resolved ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: C.orange,
                  fontWeight: 700,
                  display: "inline-block",
                  transform: `scale(${0.7 + 0.3 * resolvePop})`,
                }}
              >
                ●
              </span>
            ) : (
              <span
                style={{
                  position: "absolute",
                  left: 1,
                  top: 8,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: "3.5px solid rgba(37,99,235,0.22)",
                  borderTopColor: C.orange,
                  transform: `rotate(${frame * 15}deg)`,
                  boxSizing: "border-box",
                }}
              />
            )}
            <span style={{ display: "inline-block", marginLeft: GUTTER }}>
              <span style={{ color: C.orange, fontWeight: 700 }}>
                {CALL_NAME}
              </span>
              <span style={{ color: C.termMuted }}>{CALL_ARGS}</span>
            </span>
          </TermRow>

          {/* table header */}
          <TermRow top={ROW_Y.head} enter={headIn}>
            <span
              style={{
                position: "absolute",
                left: GUTTER,
                top: 0,
                color: C.termMuted,
              }}
            >
              keyword
            </span>
            <span
              style={{
                position: "absolute",
                left: COL_VOL,
                top: 0,
                color: C.termMuted,
              }}
            >
              volume
            </span>
            <span
              style={{
                position: "absolute",
                left: COL_KD,
                top: 0,
                color: C.termMuted,
              }}
            >
              kd
            </span>
          </TermRow>

          {/* data rows */}
          {DATA.map((d, i) => (
            <TermRow
              key={d.kw}
              top={[ROW_Y.r0, ROW_Y.r1, ROW_Y.r2][i]}
              enter={rowIn[i]}
            >
              <span
                style={{
                  position: "absolute",
                  left: GUTTER,
                  top: 0,
                  color: C.termText,
                }}
              >
                {d.kw}
              </span>
              <span
                style={{
                  position: "absolute",
                  left: COL_VOL,
                  top: 0,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  ...tabular,
                }}
              >
                {d.vol}
              </span>
              <span
                style={{
                  position: "absolute",
                  left: COL_KD,
                  top: 0,
                  color: C.termMuted,
                  ...tabular,
                }}
              >
                {d.kd}
              </span>
            </TermRow>
          ))}

          {/* success */}
          <TermRow top={ROW_Y.ok} enter={okIn}>
            <Marker glyph="✓" color={C.orange} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termMuted,
              }}
            >
              Saved 3 keywords to your workspace.
            </span>
          </TermRow>

          {/* app link */}
          <TermRow top={ROW_Y.link} enter={linkIn}>
            <Marker glyph="↳" color={C.orange} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termMuted,
              }}
            >
              View data in app:{" "}
              <span style={{ color: C.termText, fontWeight: 700 }}>
                app.openseo.so/keywords
              </span>
            </span>
          </TermRow>

          {/* input bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: ROW_Y.input,
              width: "100%",
              height: 100,
              borderRadius: 16,
              border: "1.5px solid rgba(232,228,222,0.14)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 26,
              boxSizing: "border-box",
              opacity: inputIn * 0.95,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 30, color: C.orange }}>
              ›
            </span>
            <span
              style={{
                display: "inline-block",
                width: 15,
                height: 28,
                background: C.termMuted,
                opacity: caretOn ? 0.85 : 0.18,
              }}
            />
          </div>
        </div>
      </TerminalPanel>

      {/* spine landing node — plugs into the terminal's top rim */}
      <div
        style={{
          position: "absolute",
          left: SPINE.x - 14,
          top: SPINE.y1 - 14,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: C.paper,
          border: `5px solid ${C.orange}`,
          boxSizing: "border-box",
          opacity: nodeIn,
          transform: `scale(${0.4 + 0.6 * nodeIn})`,
          zIndex: 20,
        }}
      />

      {/* ---------------------------------------------------------- packets */}
      <Packet x={p1Pt.x} y={p1Pt.y} op={p1Op} />
      <Packet
        x={SPINE.x}
        y={SPINE.y0 + (SPINE.y1 - SPINE.y0) * p2}
        op={p2Op}
        size={16}
      />
      <Packet x={p3Pt.x} y={p3Pt.y} op={p3Op} />
      <Packet
        x={SPINE.x}
        y={SPINE.y0 + (SPINE.y1 - SPINE.y0) * p4}
        op={p4Op}
        size={16}
      />
    </PaperWorld>
  );
};
