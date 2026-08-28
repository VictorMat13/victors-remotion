import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO, PaperWorld, SPRINGS, useCam, useTypewriter } from "./kit";

export const DURATION_IN_FRAMES = 290;

/* --------------------------------------------------------------------------
 * The self-check loop, dramatized:
 *   build   — a generated page paints itself inside a browser card
 *   look    — camera reveals the original screenshot card beside it
 *   compare — a scan band sweeps both panels in sync; ✓ ticks land on
 *             matching regions; the one mismatch (grey button vs the
 *             original's blue) gets flagged with a connector
 *   fix     — the flagged button morphs to match; the flag flips green
 *   show    — pull out: two identical panels, green check, agent log
 * ------------------------------------------------------------------------ */

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
    a[1] + (b[1] - a[1]) * t,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// ---- local palette (no glow anywhere — borders + fills only) --------------
const BLUE: RGB = [37, 99, 235];
const AMBER: RGB = [217, 119, 6];
const GREEN: RGB = [22, 163, 74];
const WHITE: RGB = [255, 255, 255];
const AMBER_SOFT = "rgba(217,119,6,0.10)";
const BAR_INK = "#221F1B";
const BAR_MUTED = "#CFC8BA";
const BAR_SOFT = "#E9E3D8";
const SKEL = "#EDE8E1";
const CHROME_BG = "#FAF8F5";
const BTN_GREY_BD: RGB = [201, 194, 188];
const BTN_GREY_LB: RGB = [185, 178, 164];

// ---- world geometry -------------------------------------------------------
const P = { w: 640, h: 880, chrome: 72 };
const GEN_X = 0; // generated page — left panel
const ORIG_X = 732; // original screenshot — right panel (92px gutter)
const GAP_CX = (GEN_X + P.w + ORIG_X) / 2; // 686 — centre of the gutter
const STRIP = { x: 0, y: 936, w: 1372, h: 220 };

// page layout (panel-local px — identical in both panels)
const PAD_X = 40;
const NAV = { y: 96, h: 60 };
const H1A = { y: 216, w: 400, h: 44 };
const H1B = { y: 272, w: 300, h: 44 };
const SUB = { y: 340, w: 420, h: 18 };
const BTN = { x: PAD_X, y: 392, w: 200, h: 64 };
const CARD_Y = 500;
const CARD_W = 170;
const CARD_H = 194;
const FOOT_Y = 744;
const PAGE_TOP = P.chrome;
const PAGE_BOTTOM = 830;

// the flagged element, in world coords
const FLAG = { x: GEN_X + BTN.x - 14, y: BTN.y - 14, w: BTN.w + 28, h: BTN.h + 28 };
const REF = { x: ORIG_X + BTN.x - 14, y: BTN.y - 14, w: BTN.w + 28, h: BTN.h + 28 };
const CONN_Y = BTN.y + BTN.h / 2; // 424

// ---- beats ----------------------------------------------------------------
const T = {
  addr: 4, // URL types into the address pill
  camPair: 46, // move 46 → 66: pull out to the symmetric pair
  stripIn: 68,
  log1: 72,
  scanA: 76, // scan band sweeps 76 → 128 (linear — it's a scanner)
  scanB: 128,
  log2: 82,
  flag: 136, // amber flag pops on the generated button
  connA: 138, // connector draws to the original 138 → 146
  connB: 146,
  ref: 146,
  camFix: 148, // move 148 → 164: push into the flag band
  ticksFade: 166,
  fix: 172, // button morphs grey → blue 172 → 184
  flip: 188, // flag box flips amber → green
  glyph: 190, // ! → ✓ on the flag badge
  refFade: 182, // connector + reference box fade out
  log3: 188,
  log3ok: 200,
  camOut: 205, // move 205 → 225: pull out to the settled pair
  annotFade: 226, // flag box hands off to the check badge
  chip: 238,
};

// scan crossing frames for the three matching regions (linear sweep)
const crossAt = (cy: number) =>
  T.scanA + ((cy - PAGE_TOP) / (PAGE_BOTTOM - PAGE_TOP)) * (T.scanB - T.scanA);
const TICKS = [
  { cy: NAV.y + NAV.h / 2 }, // nav — 126
  { cy: (H1A.y + SUB.y + SUB.h) / 2 }, // hero copy — 287
  { cy: CARD_Y + CARD_H / 2 }, // card row — 597
].map((r) => ({ ...r, at: crossAt(r.cy) + 2 }));

// build order for the generated page: skeleton in → real element fills
const B = {
  nav: [4, 16],
  h1a: [7, 19],
  h1b: [9, 22],
  sub: [11, 25],
  btn: [13, 28],
  c0: [15, 31],
  c1: [17, 34],
  c2: [19, 37],
  foot: [21, 40],
} as const;

// ---------------------------------------------------------------------------
// Page element with a skeleton → fill build phase
// ---------------------------------------------------------------------------

const PageEl: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  times: readonly [number, number];
  build: boolean;
  children: React.ReactNode;
}> = ({ x, y, w, h, r = 10, times, build, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [skelAt, fillAt] = times;
  const skelIn = interpolate(frame, [skelAt, skelAt + 4], [0, 1], CLAMP);
  const skelOut = interpolate(frame, [fillAt, fillAt + 5], [1, 0], CLAMP);
  const fillSpring = spring({ frame: frame - fillAt, fps, config: SPRINGS.snappy });
  const skel = build ? skelIn * skelOut : 0;
  const fill = build ? fillSpring : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background: SKEL,
          opacity: skel,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: fill,
          transform: `scale(${0.96 + 0.04 * fill})`,
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const HBar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  r?: number;
}> = ({ x, y, w, h, color, r }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r ?? h / 2,
      background: color,
    }}
  />
);

// ---------------------------------------------------------------------------
// One mock page panel — browser chrome (generated) or file chrome (original)
// ---------------------------------------------------------------------------

const MockPanel: React.FC<{
  x: number;
  header: "browser" | "file";
  build: boolean;
  btnT: number; // 0 = grey outline (the miss), 1 = the original's blue
  scanY: number;
  scanO: number;
}> = ({ x, header, build, btnT, scanY, scanO }) => {
  const frame = useCurrentFrame();
  const typedUrl = useTypewriter("localhost:5173", T.addr, 1.5);
  const typing = header === "browser" && frame >= T.addr && frame < T.addr + 12;
  const caretOn = frame % 18 < 11;

  const btnBg = mix(WHITE, BLUE, btnT);
  const btnBd = mix(BTN_GREY_BD, BLUE, btnT);
  const btnLb = mix(BTN_GREY_LB, WHITE, btnT);
  const btnScale = 1 + 0.05 * Math.sin(Math.PI * btnT);

  const cardXs = [PAD_X, 235, 430];
  const cardTimes = [B.c0, B.c1, B.c2] as const;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: P.w,
        height: P.h,
        borderRadius: 26,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
        overflow: "hidden",
      }}
    >
      {/* ---------------- page content ---------------- */}
      {/* nav */}
      <PageEl x={PAD_X} y={NAV.y} w={560} h={NAV.h} times={B.nav} build={build}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.orange,
          }}
        />
        <HBar x={54} y={21} w={96} h={18} color={BAR_INK} r={9} />
        <HBar x={252} y={23} w={50} h={14} color={BAR_MUTED} />
        <HBar x={322} y={23} w={50} h={14} color={BAR_MUTED} />
        <HBar x={392} y={23} w={50} h={14} color={BAR_MUTED} />
        <div
          style={{
            position: "absolute",
            left: 464,
            top: 10,
            width: 96,
            height: 40,
            borderRadius: 10,
            background: C.orangeSoft,
            border: `1.5px solid ${C.orangeLine}`,
            boxSizing: "border-box",
          }}
        >
          <HBar x={25} y={13} w={44} h={11} color="rgba(37,99,235,0.60)" />
        </div>
      </PageEl>

      {/* hero */}
      <PageEl x={PAD_X} y={H1A.y} w={H1A.w} h={H1A.h} times={B.h1a} build={build}>
        <HBar x={0} y={0} w={H1A.w} h={H1A.h} color={BAR_INK} r={10} />
      </PageEl>
      <PageEl x={PAD_X} y={H1B.y} w={H1B.w} h={H1B.h} times={B.h1b} build={build}>
        <HBar x={0} y={0} w={H1B.w} h={H1B.h} color={BAR_INK} r={10} />
      </PageEl>
      <PageEl x={PAD_X} y={SUB.y} w={SUB.w} h={SUB.h} times={B.sub} build={build}>
        <HBar x={0} y={0} w={SUB.w} h={SUB.h} color={BAR_MUTED} r={9} />
      </PageEl>

      {/* the primary button — the one deliberate difference */}
      <PageEl x={BTN.x} y={BTN.y} w={BTN.w} h={BTN.h} r={14} times={B.btn} build={build}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: btnBg,
            border: `2.5px solid ${btnBd}`,
            boxSizing: "border-box",
            transform: `scale(${btnScale})`,
          }}
        >
          <HBar x={49.5} y={21.5} w={96} h={16} color={btnLb} r={8} />
        </div>
      </PageEl>

      {/* card row */}
      {cardXs.map((cx, i) => (
        <PageEl
          key={i}
          x={cx}
          y={CARD_Y}
          w={CARD_W}
          h={CARD_H}
          r={14}
          times={cardTimes[i]}
          build={build}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              background: C.card,
              border: `1.5px solid ${C.line}`,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                width: 146,
                height: 84,
                borderRadius: 8,
                background: i === 0 ? C.orangeSoft : BAR_SOFT,
              }}
            />
            <HBar x={12} y={112} w={104} h={12} color="#A79F90" r={6} />
            <HBar x={12} y={134} w={72} h={12} color={BAR_MUTED} r={6} />
          </div>
        </PageEl>
      ))}

      {/* footer */}
      <PageEl x={PAD_X} y={FOOT_Y} w={560} h={86} r={8} times={B.foot} build={build}>
        <HBar x={0} y={0} w={560} h={2} color="#EFEAE2" r={1} />
        <HBar x={0} y={36} w={120} h={14} color={BAR_MUTED} />
        <HBar x={0} y={62} w={88} h={14} color={BAR_MUTED} />
        <HBar x={320} y={36} w={120} h={14} color={BAR_MUTED} />
        <HBar x={320} y={62} w={88} h={14} color={BAR_MUTED} />
      </PageEl>

      {/* ---------------- scan band (over content, under chrome) ---------- */}
      {scanO > 0.01 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: scanY - 110,
              width: P.w,
              height: 110,
              background: "rgba(37,99,235,0.06)",
              opacity: scanO,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: scanY - 3,
              width: P.w,
              height: 3,
              background: C.orange,
              opacity: scanO,
            }}
          />
        </>
      ) : null}

      {/* ---------------- chrome bar ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: P.w,
          height: P.chrome,
          background: CHROME_BG,
          borderBottom: "1.5px solid #EFEAE2",
          boxSizing: "border-box",
        }}
      >
        {header === "browser" ? (
          <>
            {[24, 48, 72].map((dx) => (
              <div
                key={dx}
                style={{
                  position: "absolute",
                  left: dx,
                  top: 29,
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  background: "#D6CFC3",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: 108,
                top: 14,
                width: 300,
                height: 44,
                borderRadius: 12,
                background: "#F3F0EA",
                border: `1.5px solid ${C.line}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                paddingLeft: 18,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 26,
                  color: C.ink,
                  letterSpacing: -0.4,
                }}
              >
                {typedUrl}
              </span>
              {typing ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 26,
                    marginLeft: 3,
                    background: C.ink,
                    opacity: caretOn ? 0.8 : 0.12,
                  }}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              style={{ position: "absolute", left: 26, top: 21 }}
            >
              <rect
                x="2.5"
                y="2.5"
                width="25"
                height="25"
                rx="6"
                fill="none"
                stroke={C.muted}
                strokeWidth="2.4"
              />
              <circle cx="11" cy="11" r="2.8" fill={C.muted} />
              <path d="M6 23 L13 14.5 L17 19 L21 13.5 L25 23 Z" fill={C.muted} />
            </svg>
            <span
              style={{
                position: "absolute",
                left: 68,
                top: 21,
                fontFamily: MONO,
                fontSize: 26,
                color: C.muted,
                letterSpacing: -0.4,
              }}
            >
              screenshot.png
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gap ticks — the matching regions bind across the gutter
// ---------------------------------------------------------------------------

const Tick: React.FC<{ cy: number; at: number }> = ({ cy, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - at, fps, config: SPRINGS.bouncy });
  const fade = interpolate(frame, [T.ticksFade, T.ticksFade + 10], [1, 0], CLAMP);
  if (frame < at || fade <= 0.01) return null;
  const o = Math.min(1, pop * 2) * fade;
  return (
    <>
      {/* stubs binding both panels */}
      <div
        style={{
          position: "absolute",
          left: GEN_X + P.w,
          top: cy - 2,
          width: 18 * pop,
          height: 4,
          borderRadius: 2,
          background: C.green,
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: ORIG_X - 18 * pop,
          top: cy - 2,
          width: 18 * pop,
          height: 4,
          borderRadius: 2,
          background: C.green,
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: GAP_CX - 28,
          top: cy - 28,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: C.card,
          border: `4px solid ${C.green}`,
          boxSizing: "border-box",
          transform: `scale(${0.5 + 0.5 * pop})`,
          opacity: o,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 30 30">
          <path
            d="M7 15.5 L12.5 21 L23 9.5"
            fill="none"
            stroke={C.green}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Flag box + connector + reference outline on the original
// ---------------------------------------------------------------------------

const FlagAnnotation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.flag) return null;

  const pop = spring({ frame: frame - T.flag, fps, config: SPRINGS.bouncy });
  const colorT = interpolate(frame, [T.flip, T.flip + 8], [0, 1], CLAMP);
  const fade = interpolate(frame, [T.annotFade, T.annotFade + 10], [1, 0], CLAMP);
  const refFade = interpolate(frame, [T.refFade, T.refFade + 10], [1, 0], CLAMP);
  const connW = interpolate(frame, [T.connA, T.connB], [0, 1], CLAMP);

  const border = mix(AMBER, GREEN, colorT);
  const glyphSwap = frame >= T.glyph;
  const gpop = spring({ frame: frame - T.glyph, fps, config: SPRINGS.pop });

  if (fade <= 0.01) return null;

  const connX0 = FLAG.x + FLAG.w; // 254
  const connX1 = REF.x; // 758

  return (
    <>
      {/* connector — draws toward the original's reference region */}
      {frame >= T.connA && refFade > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: connX0,
            top: CONN_Y - 2,
            width: (connX1 - connX0) * connW,
            height: 0,
            borderTop: `4px dashed ${mix(AMBER, GREEN, 0)}`,
            opacity: refFade * fade,
          }}
        />
      ) : null}

      {/* reference outline on the original's button */}
      {frame >= T.ref && refFade > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: REF.x,
            top: REF.y,
            width: REF.w,
            height: REF.h,
            borderRadius: 18,
            border: `3px solid rgba(217,119,6,0.55)`,
            boxSizing: "border-box",
            opacity: refFade * fade,
          }}
        />
      ) : null}

      {/* the flag box on the generated side */}
      <div
        style={{
          position: "absolute",
          left: FLAG.x,
          top: FLAG.y,
          width: FLAG.w,
          height: FLAG.h,
          borderRadius: 18,
          border: `4px solid ${border}`,
          boxSizing: "border-box",
          transform: `scale(${0.8 + 0.2 * pop})`,
          opacity: Math.min(1, pop * 2) * fade,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: AMBER_SOFT,
            opacity: 1 - colorT,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: C.greenSoft,
            opacity: colorT,
          }}
        />
        {/* corner badge: ! → ✓ */}
        <div
          style={{
            position: "absolute",
            right: -22,
            top: -22,
            width: 48,
            height: 48,
            borderRadius: 999,
            background: border,
            border: `4px solid ${C.card}`,
            boxSizing: "border-box",
            display: "grid",
            placeItems: "center",
            transform: `scale(${glyphSwap ? 0.7 + 0.3 * gpop : 0.6 + 0.4 * pop})`,
          }}
        >
          {glyphSwap ? (
            <svg width="24" height="24" viewBox="0 0 30 30">
              <path
                d="M7 15.5 L12.5 21 L23 9.5"
                fill="none"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              !
            </span>
          )}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Agent log strip — genuine tool-log lines, typed
// ---------------------------------------------------------------------------

const LOG1 = "rendered preview";
const LOG2 = "comparing…";
const LOG3 = "fixed 1 issue";

const AgentStrip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.stripIn, fps, config: SPRINGS.snappy });

  const t1 = useTypewriter(LOG1, T.log1, 2.2);
  const t2 = useTypewriter(LOG2, T.log2, 2.2);
  const t3 = useTypewriter(LOG3, T.log3, 2.2);
  const okPop = spring({ frame: frame - T.log3ok, fps, config: SPRINGS.pop });
  const flagPop = spring({ frame: frame - T.flag, fps, config: SPRINGS.pop });
  const caretOn = frame % 20 < 12;
  const l3Done = frame >= T.log3 + LOG3.length / 2.2;

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width: "100%",
    fontFamily: MONO,
    fontSize: 42,
    lineHeight: "48px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: STRIP.x,
        top: STRIP.y,
        width: STRIP.w,
        height: STRIP.h,
        borderRadius: 22,
        background: C.term,
        boxShadow: "0 24px 54px rgba(25,23,20,0.20)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 40, top: 26, right: 40, bottom: 24 }}>
        {/* line 1 — rendered preview */}
        {frame >= T.log1 ? (
          <div style={{ ...lineStyle, top: 0 }}>
            <span style={{ position: "absolute", left: 0, color: C.green, fontWeight: 700 }}>
              ✓
            </span>
            <span style={{ marginLeft: 64, color: C.termMuted }}>{t1}</span>
          </div>
        ) : null}

        {/* line 2 — comparing… (spinner → amber !) */}
        {frame >= T.log2 ? (
          <div style={{ ...lineStyle, top: 62 }}>
            {frame < T.flag ? (
              <span
                style={{
                  position: "absolute",
                  left: 2,
                  top: 10,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "4px solid rgba(37,99,235,0.25)",
                  borderTopColor: C.orange,
                  transform: `rotate(${frame * 14}deg)`,
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: mix(AMBER, AMBER, 1),
                  fontWeight: 700,
                  display: "inline-block",
                  transform: `scale(${0.6 + 0.4 * flagPop})`,
                }}
              >
                !
              </span>
            )}
            <span style={{ marginLeft: 64, color: C.termText }}>{t2}</span>
          </div>
        ) : null}

        {/* line 3 — fixed 1 issue */}
        {frame >= T.log3 ? (
          <div style={{ ...lineStyle, top: 124 }}>
            {frame >= T.log3ok ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: C.green,
                  fontWeight: 700,
                  display: "inline-block",
                  transform: `scale(${0.6 + 0.4 * okPop})`,
                }}
              >
                ✓
              </span>
            ) : (
              <span style={{ position: "absolute", left: 0, color: C.orange, fontWeight: 700 }}>
                ›
              </span>
            )}
            <span style={{ marginLeft: 64, color: "#FFFFFF", fontWeight: 700 }}>{t3}</span>
            {l3Done ? (
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 32,
                  marginLeft: 10,
                  verticalAlign: "-4px",
                  background: C.termText,
                  opacity: caretOn ? 0.8 : 0.12,
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Final check badge — settles on the generated panel
// ---------------------------------------------------------------------------

const CheckBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.chip) return null;
  const pop = spring({ frame: frame - T.chip, fps, config: SPRINGS.bouncy });
  return (
    <div
      style={{
        position: "absolute",
        left: GEN_X + P.w - 12 - 96,
        top: -40,
        width: 96,
        height: 96,
        borderRadius: 999,
        background: C.green,
        border: "6px solid #FFFFFF",
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        transform: `scale(${0.4 + 0.6 * pop})`,
        opacity: Math.min(1, pop * 2),
      }}
    >
      <svg width="46" height="46" viewBox="0 0 30 30">
        <path
          d="M7 15.5 L12.5 21 L23 9.5"
          fill="none"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const S2cSelfCheck: React.FC = () => {
  const frame = useCurrentFrame();

  // hold (paint) → pull out to the pair → hold (scan/flag) → push to the
  // flag band → hold (fix) → pull out → settle on two near-identical keys
  const cam = useCam({
    keys: [0, T.camPair, T.camPair + 20, T.camFix, T.camFix + 16, T.camOut, T.camOut + 20, 262, 290],
    fx: [320, 320, 686, 686, 686, 686, 686, 686, 686],
    fy: [420, 420, 635, 635, 570, 570, 638, 638, 636],
    z: [1.32, 1.32, 0.62, 0.62, 0.705, 0.705, 0.58, 0.58, 0.582],
  });

  // synced scan — a scanner moves linearly
  const scanP = interpolate(frame, [T.scanA, T.scanB], [0, 1], CLAMP);
  const scanY = PAGE_TOP + (PAGE_BOTTOM - PAGE_TOP) * scanP;
  const scanO = interpolate(
    frame,
    [T.scanA, T.scanA + 4, T.scanB - 6, T.scanB + 2],
    [0, 1, 1, 0],
    CLAMP,
  );

  // the fix — the generated button snaps to the original's blue
  const btnT = interpolate(frame, [T.fix, T.fix + 12], [0, 1], CLAMP);

  return (
    <PaperWorld cam={cam}>
      {/* generated page — painting itself in a real browser */}
      <MockPanel
        x={GEN_X}
        header="browser"
        build
        btnT={btnT}
        scanY={scanY}
        scanO={scanO}
      />
      {/* the original screenshot — it existed before we got here */}
      <MockPanel
        x={ORIG_X}
        header="file"
        build={false}
        btnT={1}
        scanY={scanY}
        scanO={scanO}
      />

      {TICKS.map((t) => (
        <Tick key={t.cy} cy={t.cy} at={t.at} />
      ))}

      <FlagAnnotation />
      <AgentStrip />
      <CheckBadge />
    </PaperWorld>
  );
};
