import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  C,
  Card,
  FACTS,
  LogoImg,
  MONO,
  PaperWorld,
  SCRAPY,
  SPRINGS,
  TEAL,
  TEAL_LINE,
  TEAL_SOFT,
  TerminalPanel,
  tabular,
  useCam,
  useEnter,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical world (1080×1920 viewport).
//
//   terminal `~` (pip install scrapy)          y   320…780
//   editor quotes_spider.py (dark, mono)       y  1060…1650
//   terminal `~` (scrapy runspider … -O)       y  1780…2116
//   payoff: table (text|author) + quotes.json  y  2270…2624
//
// Camera: open tight on the install → travel to the editor while the spider
// types → down to the run command + logs → land on the data payoff → pull out
// to hold editor + table together. Terminal mono is ≥30px on screen at both
// terminal framings (32 @ z1.15, 30 @ z1.0); the editor's 60-char author line
// pins its body to 26px world — the widest that fits 972 inside margins.
// ---------------------------------------------------------------------------

const T1 = { x: 120, y: 320, w: 840, h: 460 };
const ED = { x: 54, y: 1060, w: 972, h: 590, bar: 62 };
const T2 = { x: 54, y: 1780, w: 972, h: 336 };
const TABLE = { x: 98, y: 2270, w: 560, header: 64, rowH: 58 };
const TABLE_H = TABLE.header + 5 * TABLE.rowH; // 354
const FCHIP = { x: 682, y: 2270 + (TABLE_H - 116) / 2, w: 300, h: 116 };

// Type metrics per surface (JetBrains Mono advance = 0.6em).
const FS1 = 32; // install terminal — matches the approved s2c opening
const LH1 = 44;
const GUT1 = 40;
const FS2 = 30; // run terminal — the 48-char command spans 864px + gutter
const LH2 = 42;
const GUT2 = 36;
const FSC = 26; // editor — 60-char line × 15.6px = 936px = body width exactly
const LHC = 40;

// Docker/GitHub-style success green, tuned for the dark panel (C.green muds).
const TERM_GREEN = "#3FB950";
// Warm string tint for the dark editor.
const STR_COLOR = "#E0A458";

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  // terminal 1 — pip install
  type1: 6, // 18 chars @ 1.6 c/f → done ~17
  enter1: 22,
  collect: 26,
  install: 34,
  ok: 44,
  idle1: 50,
  // camera → editor 55…75; card pops mid-travel
  edCard: 60,
  code: 78, // per-line schedule below, done 136
  // camera → run terminal 146…162
  t2card: 150,
  type2: 164, // 48 chars @ 3 c/f → done 180
  enter2: 182,
  log1: 185,
  log2: 190,
  idle2: 196,
  // camera → payoff 198…216
  table: 204,
  thead: 210,
  rows: 213, // +3f stagger per row
  chip: 220,
  // pull out 230…248, hold to 260
};

const CMD1 = FACTS.installCmd; // "pip install scrapy"
const CMD1_SPLIT = 3; // "pip"
const CMD2 = FACTS.runCmd; // "scrapy runspider quotes_spider.py -O quotes.json"
const CMD2_SPLIT = 6; // "scrapy"

// ---------------------------------------------------------------------------
// Editor code — FACTS.spiderCode with simple static syntax tinting.
// Lines 1–6 type at 4 c/f; later lines land nearly whole at 10 c/f.
// ---------------------------------------------------------------------------

type Seg = { t: string; c: string };

const tokenize = (line: string): Seg[] => {
  const out: Seg[] = [];
  const re = /"[^"]*"|\b(?:import|class|def|for|in|yield)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), c: C.termText });
    out.push({ t: m[0], c: m[0].startsWith('"') ? STR_COLOR : TEAL });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ t: line.slice(last), c: C.termText });
  return out;
};

const CODE_SEGS = FACTS.spiderCode.map(tokenize);

const LINE_META = (() => {
  let f = T.code;
  return FACTS.spiderCode.map((ln, i) => {
    const rate = i < 6 ? 4 : 10;
    const start = f;
    f += Math.max(2, Math.ceil(ln.length / rate));
    return { start, end: f, rate, len: ln.length };
  });
})();

const CODE_DONE = LINE_META[LINE_META.length - 1].end; // 136

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Row: React.FC<{
  top: number;
  fs: number;
  lh: number;
  enter?: number;
  children: React.ReactNode;
}> = ({ top, fs, lh, enter = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width: "100%",
      fontFamily: MONO,
      fontSize: fs,
      lineHeight: `${lh}px`,
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

const Caret: React.FC<{ on: boolean; fs: number; color?: string }> = ({
  on,
  fs,
  color = C.termText,
}) => (
  <span
    style={{
      display: "inline-block",
      width: fs * 0.5,
      height: fs * 0.94,
      marginLeft: 4,
      verticalAlign: `-${Math.round(fs * 0.1)}px`,
      background: color,
      opacity: on ? 0.9 : 0.15,
    }}
  />
);

/** Document glyph with a folded corner + teal data lines. */
const FileGlyph: React.FC = () => (
  <svg width={34} height={42} viewBox="0 0 34 42">
    <path
      d="M4 3 H20 L30 13 V39 H4 Z"
      fill="#FFFFFF"
      stroke={C.ink}
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
    <path
      d="M20 3 V13 H30"
      fill={TEAL_SOFT}
      stroke={C.ink}
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
    <path
      d="M10 23 H24 M10 29 H19"
      stroke={TEAL}
      strokeWidth={3}
      strokeLinecap="round"
    />
  </svg>
);

// Skeleton bar widths per row: [text column, author column].
const BAR_W: Array<[number, number]> = [
  [252, 130],
  [214, 158],
  [262, 112],
  [228, 144],
  [240, 126],
];

// ---------------------------------------------------------------------------

export const ScrOneFileData: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: install → editor → run → payoff → pull-out hold -------------
  const cam = useCam({
    keys: [0, 55, 75, 146, 162, 198, 216, 230, 248, 254, 260],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [550, 550, 1355, 1355, 1948, 1948, 2447, 2447, 1852, 1852, 1852],
    z: [1.15, 1.15, 1.0, 1.0, 1.0, 1.0, 1.08, 1.08, 0.9, 0.9, 0.9],
  });

  const caretOn = frame % 20 < 12;

  // --- Terminal 1 — pip install --------------------------------------------
  const typed1 = useTypewriter(CMD1, T.type1, 1.6);
  const collectIn = useEnter(T.collect, SPRINGS.pop);
  const installIn = useEnter(T.install, SPRINGS.pop);
  const okIn = useEnter(T.ok, SPRINGS.pop);
  const idle1In = spring({
    frame: frame - T.idle1,
    fps,
    config: SPRINGS.smooth,
  });

  // --- Editor ---------------------------------------------------------------
  const edIn = useEnter(T.edCard, SPRINGS.pop);
  const activeIdx = LINE_META.findIndex((m) => frame < m.end);
  const caretLine = activeIdx === -1 ? LINE_META.length - 1 : activeIdx;
  const edCaretOn = frame < CODE_DONE ? true : caretOn;

  // --- Terminal 2 — run -----------------------------------------------------
  const t2In = useEnter(T.t2card, SPRINGS.pop);
  const typed2 = useTypewriter(CMD2, T.type2, 3);
  const log1In = useEnter(T.log1, SPRINGS.pop);
  const log2In = useEnter(T.log2, SPRINGS.pop);
  const idle2In = spring({
    frame: frame - T.idle2,
    fps,
    config: SPRINGS.smooth,
  });

  // --- Payoff ---------------------------------------------------------------
  const tableIn = useEnter(T.table, SPRINGS.pop);
  const theadIn = useEnter(T.thead, SPRINGS.pop);
  // One useEnter per BAR_W row, called unconditionally at the top level —
  // hooks must never run inside a .map() callback.
  const rowIn0 = useEnter(T.rows, SPRINGS.pop);
  const rowIn1 = useEnter(T.rows + 3, SPRINGS.pop);
  const rowIn2 = useEnter(T.rows + 6, SPRINGS.pop);
  const rowIn3 = useEnter(T.rows + 9, SPRINGS.pop);
  const rowIn4 = useEnter(T.rows + 12, SPRINGS.pop);
  const rowIn = [rowIn0, rowIn1, rowIn2, rowIn3, rowIn4];
  const chipIn = spring({
    frame: frame - T.chip,
    fps,
    config: SPRINGS.bouncy,
  });

  return (
    <PaperWorld cam={cam}>
      {/* ------------------------------------------- terminal 1: install */}
      <TerminalPanel x={T1.x} y={T1.y} w={T1.w} h={T1.h} title="~">
        <div style={{ position: "relative", height: T1.h - 62 - 52 }}>
          <Row top={0} fs={FS1} lh={LH1}>
            <Marker glyph="›" color={TEAL} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUT1,
                color: C.termText,
              }}
            >
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
                {typed1.slice(0, CMD1_SPLIT)}
              </span>
              {typed1.slice(CMD1_SPLIT)}
            </span>
            {frame < T.enter1 ? <Caret on={caretOn} fs={FS1} /> : null}
          </Row>

          <Row top={76} fs={FS1} lh={LH1} enter={collectIn}>
            <span style={{ color: C.termMuted }}>Collecting scrapy</span>
          </Row>
          <Row top={130} fs={FS1} lh={LH1} enter={installIn}>
            <span style={{ color: C.termMuted }}>
              Installing collected packages: scrapy
            </span>
          </Row>

          <Row top={196} fs={FS1} lh={LH1} enter={okIn}>
            <Marker glyph="✔" color={TERM_GREEN} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUT1,
                color: C.termText,
              }}
            >
              Successfully installed scrapy
            </span>
          </Row>

          {/* fresh prompt — install really was one command */}
          <Row top={262} fs={FS1} lh={LH1} enter={idle1In}>
            <Marker glyph="›" color={TEAL} />
            <span style={{ display: "inline-block", marginLeft: GUT1 }}>
              <Caret on={caretOn} fs={FS1} color={C.termMuted} />
            </span>
          </Row>
        </div>
      </TerminalPanel>

      {/* ------------------------------------------------ editor: spider */}
      <div
        style={{
          position: "absolute",
          left: ED.x,
          top: ED.y,
          width: ED.w,
          height: ED.h,
          borderRadius: 22,
          background: C.term,
          boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
          overflow: "hidden",
          opacity: edIn,
          transform: `translateY(${(1 - edIn) * 24}px)`,
        }}
      >
        {/* header rail — filename + python mark */}
        <div
          style={{
            height: ED.bar,
            background: C.termBar,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 24px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                background: "#4A4741",
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 14,
              fontFamily: MONO,
              fontSize: 22,
              color: C.termMuted,
              letterSpacing: 0.2,
            }}
          >
            quotes_spider.py
          </div>
          <LogoImg
            src={SCRAPY.logos.python}
            size={30}
            style={{
              position: "absolute",
              right: 22,
              top: (ED.bar - 30) / 2,
              opacity: 0.92,
            }}
          />
        </div>

        {/* code body */}
        <div style={{ position: "relative", padding: "22px 18px" }}>
          {CODE_SEGS.map((segs, i) => {
            const meta = LINE_META[i];
            const chars = Math.max(
              0,
              Math.min(
                meta.len,
                Math.floor((frame - meta.start) * meta.rate),
              ),
            );
            let used = 0;
            return (
              <div
                key={i}
                style={{
                  fontFamily: MONO,
                  fontSize: FSC,
                  lineHeight: `${LHC}px`,
                  whiteSpace: "pre",
                  height: LHC,
                }}
              >
                {segs.map((seg, j) => {
                  const take = Math.max(
                    0,
                    Math.min(seg.t.length, chars - used),
                  );
                  used += seg.t.length;
                  return (
                    <span key={j} style={{ color: seg.c }}>
                      {seg.t.slice(0, take)}
                    </span>
                  );
                })}
                {i === caretLine && frame >= T.code ? (
                  <Caret on={edCaretOn} fs={FSC} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------- terminal 2: run */}
      <TerminalPanel x={T2.x} y={T2.y} w={T2.w} h={T2.h} title="~" enter={t2In}>
        <div style={{ position: "relative", height: T2.h - 62 - 52 }}>
          <Row top={0} fs={FS2} lh={LH2}>
            <Marker glyph="›" color={TEAL} />
            <span
              style={{
                display: "inline-block",
                marginLeft: GUT2,
                color: C.termText,
              }}
            >
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
                {typed2.slice(0, CMD2_SPLIT)}
              </span>
              {typed2.slice(CMD2_SPLIT)}
            </span>
            {frame >= T.t2card && frame < T.enter2 ? (
              <Caret on={caretOn} fs={FS2} />
            ) : null}
          </Row>

          <Row top={64} fs={FS2} lh={LH2} enter={log1In}>
            <span style={{ color: C.termMuted }}>INFO: Spider opened</span>
          </Row>
          {/* page 1 of quotes.toscrape.com yields exactly 10 items */}
          <Row top={118} fs={FS2} lh={LH2} enter={log2In}>
            <span style={{ color: C.termText }}>
              {"'item_scraped_count': "}
              <span style={{ color: TERM_GREEN, fontWeight: 700, ...tabular }}>
                10
              </span>
              ,
            </span>
          </Row>

          <Row top={180} fs={FS2} lh={LH2} enter={idle2In}>
            <Marker glyph="›" color={TEAL} />
            <span style={{ display: "inline-block", marginLeft: GUT2 }}>
              <Caret on={caretOn} fs={FS2} color={C.termMuted} />
            </span>
          </Row>
        </div>
      </TerminalPanel>

      {/* -------------------------------------------- payoff: clean data */}
      <Card
        x={TABLE.x}
        y={TABLE.y}
        w={TABLE.w}
        h={TABLE_H}
        r={22}
        enter={tableIn}
        style={{ overflow: "hidden" }}
      >
        {/* header cells — the spider's own field names */}
        <div
          style={{
            display: "flex",
            height: TABLE.header,
            background: "#F3F0EA",
            borderBottom: `2px solid ${TEAL_LINE}`,
            opacity: theadIn,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 320,
              display: "flex",
              alignItems: "center",
              paddingLeft: 24,
              fontFamily: MONO,
              fontSize: 30,
              fontWeight: 700,
              color: C.ink,
              boxSizing: "border-box",
            }}
          >
            text
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              paddingLeft: 24,
              fontFamily: MONO,
              fontSize: 30,
              fontWeight: 700,
              color: C.ink,
              boxSizing: "border-box",
            }}
          >
            author
          </div>
        </div>

        {/* column divider */}
        <div
          style={{
            position: "absolute",
            left: 320,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: C.lineSoft,
          }}
        />

        {/* skeleton rows */}
        {BAR_W.map(([tw, aw], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              height: TABLE.rowH,
              borderBottom:
                i < BAR_W.length - 1 ? `1.5px solid ${C.lineSoft}` : "none",
              boxSizing: "border-box",
            }}
          >
            {[tw, aw].map((w, col) => (
              <div
                key={col}
                style={{ width: col === 0 ? 320 : undefined, flex: col === 0 ? undefined : 1 }}
              >
                <div
                  style={{
                    marginLeft: 24,
                    marginTop: (TABLE.rowH - 16) / 2,
                    height: 16,
                    width: w,
                    borderRadius: 8,
                    background: "#E2DACB",
                    opacity: Math.min(1, rowIn[i] * 2),
                    transform: `scaleX(${rowIn[i]})`,
                    transformOrigin: "left center",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </Card>

      {/* the file the -O flag wrote */}
      <Card
        x={FCHIP.x}
        y={FCHIP.y}
        w={FCHIP.w}
        h={FCHIP.h}
        r={22}
        enter={chipIn}
        style={{
          transform: `translateY(${(1 - chipIn) * 20}px) scale(${
            0.9 + 0.1 * chipIn
          })`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <FileGlyph />
          <div
            style={{
              fontFamily: MONO,
              fontSize: 28,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.4,
            }}
          >
            quotes.json
          </div>
        </div>
      </Card>
    </PaperWorld>
  );
};
