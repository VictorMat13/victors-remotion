import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  Chip,
  DISPLAY,
  FACTS,
  FONT,
  LogoImg,
  MONO,
  PaperWorld,
  S2C,
  S2cMark,
  SPRINGS,
  TerminalPanel,
  tabular,
  useCam,
  useEnter,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 230;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical world (1080×1920 viewport).
//
//   browser card (localhost:5173 — the app, alive)      y  440…1060
//   metadata chip row (github repo · MIT)               y  1120…1194
//   terminal (~/screenshot-to-code, docker boot)        y  1250…1950
//
// Camera: open close on the terminal → travel up to the browser when the
// containers are running → pull out to hold both. The terminal mono body is
// 32px world so it reads ≥30px on screen at every framing (0.94 ≤ z ≤ 1.15).
// ---------------------------------------------------------------------------

const TERM = { x: 120, y: 1250, w: 840, h: 700 };
const BROWSER = { x: 54, y: 440, w: 972, h: 620, bar: 76 };
const CHIPS_Y = 1120;

// Terminal internals — 32px JetBrains Mono, 44px line height.
const FS = 32;
const LH = 44;
const GUTTER = 40; // marker column width
const CH = FS * 0.6; // mono advance ≈ 19.2px
const STARTED_COL = GUTTER + Math.round(24 * CH); // aligned "Started" column

const TROW = {
  prompt: 0,
  build: 78,
  pullB: 138,
  pullF: 198,
  run: 276,
  okB: 336,
  okF: 396,
  idle: 480,
};

// Docker's own success green, lifted for the dark panel (kit green is tuned
// for paper and goes muddy on C.term).
const TERM_GREEN = "#3FB950";

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  type: 30, // typing 30 → ~49 (28 chars @ 1.5 c/f)
  enter: 52, // caret disappears — command submitted
  build: 56, // [+] Building line, seconds tick 56 → 84
  pullB: 62,
  pullF: 68,
  tickEnd: 84, // FINISHED lands
  run: 86,
  okB: 90,
  okF: 94,
  camUp: 95, // camera travels up 95 → 117
  idle: 100, // fresh detached prompt (-d) — pops while offscreen
  browser: 106, // browser card lands as the camera arrives
  bHeader: 110, // contents chase the card tightly — no empty-card beat
  bDrop: 114,
  bBtn: 120,
  chipGh: 136,
  chipMit: 148,
  camOut: 175, // pull out 175 → 197
};

// The one-liner — exactly the README command, split for emphasis.
const CMD = FACTS.dockerCmd; // "docker-compose up -d --build"
const CMD_SPLIT = 14; // "docker-compose".length

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Row: React.FC<{
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
      fontSize: FS,
      lineHeight: `${LH}px`,
      whiteSpace: "nowrap",
      opacity: enter,
      transform: `translateX(${(1 - enter) * -16}px)`,
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
    style={{ position: "absolute", left: 0, top: 0, color, fontWeight: 700 }}
  >
    {glyph}
  </span>
);

const Caret: React.FC<{ on: boolean; color?: string }> = ({
  on,
  color = C.termText,
}) => (
  <span
    style={{
      display: "inline-block",
      width: 16,
      height: 30,
      marginLeft: 4,
      verticalAlign: "-3px",
      background: color,
      opacity: on ? 0.9 : 0.15,
    }}
  />
);

// ---------------------------------------------------------------------------

export const S2cOneLineSetup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: terminal → browser → both -----------------------------------
  const cam = useCam({
    keys: [0, T.camUp, T.camUp + 22, T.camOut, T.camOut + 22, 228, 230],
    fx: [540, 540, 540, 540, 540, 540, 540],
    fy: [1600, 1600, 815, 815, 1195, 1195, 1195],
    z: [1.15, 1.15, 1.0, 1.0, 0.94, 0.94, 0.94],
  });

  // --- Terminal ------------------------------------------------------------
  const typed = useTypewriter(CMD, T.type, 1.5);
  const caretOn = frame % 20 < 12;
  const promptCaret = frame < T.enter;

  const buildIn = useEnter(T.build, SPRINGS.pop);
  const pullBIn = useEnter(T.pullB, SPRINGS.pop);
  const pullFIn = useEnter(T.pullF, SPRINGS.pop);
  const runIn = useEnter(T.run, SPRINGS.pop);
  const okBIn = useEnter(T.okB, SPRINGS.pop);
  const okFIn = useEnter(T.okF, SPRINGS.pop);
  const idleIn = spring({
    frame: frame - T.idle,
    fps,
    config: SPRINGS.smooth,
  });

  // Docker build timer ticks up while layers stream (linear, like the CLI).
  const buildS = interpolate(frame, [T.build, T.tickEnd], [0.4, 12.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buildN = Math.round(
    interpolate(frame, [T.build, T.tickEnd], [2, 16], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const finished = frame >= T.tickEnd;

  // --- Browser -------------------------------------------------------------
  const bIn = useEnter(T.browser, SPRINGS.pop);
  const bHeaderIn = useEnter(T.bHeader, SPRINGS.pop);
  const bDropIn = useEnter(T.bDrop, SPRINGS.pop);
  const bBtnIn = useEnter(T.bBtn, SPRINGS.pop);
  const arrowBob = frame > T.bDrop ? Math.sin((frame - T.bDrop) / 8) * 4 : 0;

  // --- Metadata chips ------------------------------------------------------
  const ghIn = spring({
    frame: frame - T.chipGh,
    fps,
    config: SPRINGS.bouncy,
  });
  const mitIn = spring({
    frame: frame - T.chipMit,
    fps,
    config: SPRINGS.bouncy,
  });

  const appW = BROWSER.w; // 972
  const dropW = appW - 80; // 40px inner padding each side

  return (
    <PaperWorld cam={cam}>
      {/* ------------------------------------------------------- browser */}
      <Card
        x={BROWSER.x}
        y={BROWSER.y}
        w={BROWSER.w}
        h={BROWSER.h}
        enter={bIn}
      >
        {/* chrome bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: BROWSER.bar,
            borderBottom: `1.5px solid ${C.lineSoft}`,
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#DDD6C9",
                }}
              />
            ))}
          </div>
          {/* address pill — centered on the card, not the leftover space */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: (BROWSER.bar - 48) / 2,
              transform: "translateX(-50%)",
              height: 48,
              padding: "0 30px",
              borderRadius: 999,
              background: "#F3F0EA",
              border: `1.5px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              fontFamily: MONO,
              fontSize: 30,
              color: C.ink,
              boxSizing: "border-box",
            }}
          >
            localhost:5173
          </div>
        </div>

        {/* app header — the real lockup */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: BROWSER.bar + 30,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: bHeaderIn,
            transform: `translateY(${(1 - bHeaderIn) * 14}px)`,
          }}
        >
          <S2cMark size={46} />
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 30,
              color: C.ink,
              letterSpacing: -0.4,
            }}
          >
            Screenshot to Code
          </div>
        </div>

        {/* upload dropzone — marching dashes, the app is listening */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: BROWSER.bar + 116,
            width: dropW,
            height: 252,
            opacity: bDropIn,
            transform: `translateY(${(1 - bDropIn) * 18}px)`,
          }}
        >
          <svg
            width={dropW}
            height={252}
            viewBox={`0 0 ${dropW} 252`}
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <rect
              x={2}
              y={2}
              width={dropW - 4}
              height={248}
              rx={20}
              fill="rgba(25,23,20,0.015)"
              stroke="rgba(25,23,20,0.28)"
              strokeWidth={3}
              strokeDasharray="16 12"
              strokeDashoffset={-frame * 0.55}
            />
          </svg>
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
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: 999,
                background: C.orangeSoft,
                border: `1.5px solid ${C.orangeLine}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateY(${arrowBob}px)`,
                boxSizing: "border-box",
              }}
            >
              <svg width={34} height={38} viewBox="0 0 34 38">
                <path
                  d="M17 34 L17 6 M6 16 L17 5 L28 16"
                  fill="none"
                  stroke={C.orange}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 30,
                color: C.muted,
              }}
            >
              Drag &amp; drop a screenshot
            </div>
          </div>
        </div>

        {/* primary action */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: BROWSER.bar + 404,
            transform: `translateX(-50%) translateY(${(1 - bBtnIn) * 16}px) scale(${
              0.94 + 0.06 * bBtnIn
            })`,
            height: 66,
            padding: "0 44px",
            borderRadius: 15,
            background: C.orange,
            display: "flex",
            alignItems: "center",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 30,
            color: "#FFFFFF",
            letterSpacing: 0.2,
            opacity: bBtnIn,
            boxSizing: "border-box",
          }}
        >
          Generate code
        </div>
      </Card>

      {/* --------------------------------------------------- metadata chips */}
      <div
        style={{
          position: "absolute",
          left: 54,
          top: CHIPS_Y,
          width: 972,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: 74,
            padding: "0 30px",
            borderRadius: 999,
            background: C.card,
            border: `1.5px solid ${C.line}`,
            boxShadow: "0 10px 24px rgba(25,23,20,0.06)",
            opacity: ghIn,
            transform: `translateY(${(1 - ghIn) * 20}px) scale(${
              0.9 + 0.1 * ghIn
            })`,
            boxSizing: "border-box",
          }}
        >
          <LogoImg src={S2C.logos.github} size={38} />
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.4,
            }}
          >
            abi/screenshot-to-code
          </div>
        </div>
        <Chip
          label={FACTS.license}
          tone="neutral"
          size={30}
          style={{
            opacity: mitIn,
            transform: `translateY(${(1 - mitIn) * 20}px) scale(${
              0.9 + 0.1 * mitIn
            })`,
          }}
        />
      </div>

      {/* ------------------------------------------------------- terminal */}
      <TerminalPanel
        x={TERM.x}
        y={TERM.y}
        w={TERM.w}
        h={TERM.h}
        title="~/screenshot-to-code"
      >
        <div style={{ position: "relative", height: TERM.h - 62 - 52 }}>
          {/* prompt + the one command */}
          <Row top={TROW.prompt} enter={1}>
            <Marker glyph="›" color={C.orange} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termText,
              }}
            >
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
                {typed.slice(0, CMD_SPLIT)}
              </span>
              {typed.slice(CMD_SPLIT)}
            </span>
            {promptCaret ? <Caret on={caretOn} /> : null}
          </Row>

          {/* build stream */}
          <Row top={TROW.build} enter={buildIn}>
            <span style={{ color: C.termText }}>
              [+] Building{" "}
              <span style={tabular}>{buildS.toFixed(1)}s</span>{" "}
              <span style={{ color: C.termMuted, ...tabular }}>
                ({buildN}/16)
              </span>
              {finished ? (
                <span style={{ color: TERM_GREEN, fontWeight: 700 }}>
                  {" "}
                  FINISHED
                </span>
              ) : null}
            </span>
          </Row>

          <Row top={TROW.pullB} enter={pullBIn}>
            <span style={{ color: C.termMuted }}>{"=> pulling backend"}</span>
          </Row>
          <Row top={TROW.pullF} enter={pullFIn}>
            <span style={{ color: C.termMuted }}>{"=> pulling frontend"}</span>
          </Row>

          <Row top={TROW.run} enter={runIn}>
            <span style={{ color: C.termText, ...tabular }}>
              [+] Running 2/2
            </span>
          </Row>

          <Row top={TROW.okB} enter={okBIn}>
            <Marker glyph="✔" color={TERM_GREEN} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termText,
              }}
            >
              Container s2c-backend
            </span>
            <span
              style={{
                position: "absolute",
                left: STARTED_COL,
                top: 0,
                color: TERM_GREEN,
              }}
            >
              Started
            </span>
          </Row>
          <Row top={TROW.okF} enter={okFIn}>
            <Marker glyph="✔" color={TERM_GREEN} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUTTER,
                color: C.termText,
              }}
            >
              Container s2c-frontend
            </span>
            <span
              style={{
                position: "absolute",
                left: STARTED_COL,
                top: 0,
                color: TERM_GREEN,
              }}
            >
              Started
            </span>
          </Row>

          {/* detached — a fresh prompt comes back (that's what -d means) */}
          <Row top={TROW.idle} enter={idleIn}>
            <Marker glyph="›" color={C.orange} />
            <span style={{ display: "inline-block", marginLeft: GUTTER }}>
              <Caret on={caretOn} color={C.termMuted} />
            </span>
          </Row>
        </div>
      </TerminalPanel>
    </PaperWorld>
  );
};
