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
  FONT,
  LogoImg,
  MONO,
  OpenSeoMark,
  PaperWorld,
  SPRINGS,
  fmt,
  tabular,
  useCam,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 240;

/** Claude's own brand accent — these panels are real Claude chat UI. */
const CLAUDE = "#D97757";
const CLAUDE_SOFT = "rgba(217,119,87,0.12)";

const PROMPT = `what's the monthly search volume for "best seo tools"?`;

// ---------------------------------------------------------------------------
// World geometry (one continuous vertical world)
// ---------------------------------------------------------------------------

const PANEL = { x: 190, w: 700, h: 760 };
const PANEL_A_Y = 0;
const PANEL_B_Y = 910;
/** Panel-relative vertical centre of the big answer number. */
const NUM_CY = 455;
const NUM_A = PANEL_A_Y + NUM_CY; // 455
const NUM_B = PANEL_B_Y + NUM_CY; // 1365
const SPINE_X = 168;

/** True vertical midpoint of the two-panel stack (0 -> PANEL_B_Y + PANEL.h). */
const PAIR_CY = (PANEL_B_Y + PANEL.h) / 2; // 835
/** Wide-beat zoom: 1670px of stack inside 1920px of frame with matched air. */
const PAIR_Z = 0.94;

const CARD = { x: 130, y: 2020, w: 820, h: 1090 };
const PAD = 44;
const INNER_W = CARD.w - PAD * 2; // 732

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  sendA: 24,
  dotsA: 26,
  numA: 40,
  camB: 52,
  dotsB: 68,
  numB: 80,
  camWide: 92,
  tickA: 108,
  spine: 114,
  tickB: 126,
  cross: 134,
  mute: 140,
  camPayoff: 168,
  rowIn: 186,
  count: 188,
  lock: 210,
};

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const EASE_OUT = Easing.out(Easing.cubic);

const ramp = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { ...CLAMP, easing: EASE_OUT });

const INK_RGB: [number, number, number] = [10, 10, 10];
const GRAY_RGB: [number, number, number] = [154, 160, 166];

const mixRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
    a[1] + (b[1] - a[1]) * t,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// ---------------------------------------------------------------------------
// Chat pieces
// ---------------------------------------------------------------------------

const ThinkingDots: React.FC<{ from: number; until: number }> = ({
  from,
  until,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= until) return null;
  const fade = interpolate(frame, [from, from + 5], [0, 1], CLAMP);
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", opacity: fade }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: CLAUDE,
            opacity: 0.32 + 0.68 * (0.5 + 0.5 * Math.sin((frame - i * 4) / 3.4)),
          }}
        />
      ))}
    </div>
  );
};

/** The guessed answer: `~8,100  /mo`, tabular, huge, mutes + slumps later. */
const BigAnswer: React.FC<{
  to: number;
  at: number;
  dur: number;
  boxW: number;
  muteFrom: number;
}> = ({ to, at, dur, boxW, muteFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;

  const pop = spring({ frame: frame - at, fps, config: SPRINGS.pop });
  const n = interpolate(frame, [at, at + dur], [0, to], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const m = interpolate(frame, [muteFrom, muteFrom + 18], [0, 1], CLAMP);

  const ink = mixRgb(INK_RGB, GRAY_RGB, m);
  const soft = mixRgb([139, 142, 146], GRAY_RGB, m);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        transform: `translateY(${(1 - pop) * 22 + m * 16}px) rotate(${
          m * -1.1
        }deg) scale(${(0.82 + 0.18 * pop) * (1 - m * 0.04)})`,
        transformOrigin: "0% 60%",
        opacity: pop,
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: 66,
          fontWeight: 700,
          color: soft,
          letterSpacing: -2,
        }}
      >
        ~
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 134,
          fontWeight: 800,
          letterSpacing: -5,
          lineHeight: 1.02,
          color: ink,
          width: boxW,
          display: "inline-block",
          ...tabular,
        }}
      >
        {fmt(n)}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 600,
          color: soft,
          letterSpacing: -0.6,
        }}
      >
        /mo
      </span>
    </div>
  );
};

const SkeletonBar: React.FC<{ w: number; at: number }> = ({ w, at }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 8], [0, 1], CLAMP);
  return (
    <div
      style={{
        width: w,
        height: 18,
        borderRadius: 9,
        background: "#EDE8E1",
        opacity: o,
      }}
    />
  );
};

const ChatPanel: React.FC<{
  y: number;
  label: string;
  /** null → the prompt is simply already there (chat B) */
  typeStart: number | null;
  sendAt: number;
  dotsFrom: number;
  numAt: number;
  numTo: number;
  numBoxW: number;
  muteFrom: number;
}> = ({ y, label, typeStart, sendAt, dotsFrom, numAt, numTo, numBoxW, muteFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed = useTypewriter(PROMPT, typeStart ?? -999, 1.7);
  const text = typeStart === null ? PROMPT : typed;
  const typing = typeStart !== null && frame < sendAt;
  const caretOn = Math.floor(frame / 5) % 2 === 0;

  const sendPop = spring({
    frame: frame - sendAt,
    fps,
    config: { damping: 12, stiffness: 240 },
  });
  const bubbleScale =
    typeStart === null ? 1 : 1 + 0.035 * Math.sin(sendPop * Math.PI);

  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: y,
        width: PANEL.w,
        height: PANEL.h,
        borderRadius: 30,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 24px 60px rgba(25,23,20,0.09)",
        overflow: "hidden",
      }}
    >
      {/* ---- title bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: 84,
          borderBottom: `1.5px solid ${C.lineSoft}`,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: CLAUDE_SOFT,
            display: "grid",
            placeItems: "center",
          }}
        >
          <LogoImg src={A.logo.claude} size={28} />
        </div>
        <span
          style={{
            marginLeft: 16,
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: -0.6,
          }}
        >
          Claude
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: MONO,
            fontSize: 26,
            fontWeight: 500,
            color: C.mutedSoft,
          }}
        >
          {label}
        </span>
      </div>

      {/* ---- user bubble (right aligned) */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 122,
          width: PANEL.w - 80,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            background: "#F3F0EA",
            border: `1.5px solid ${C.line}`,
            borderRadius: 26,
            borderBottomRightRadius: 10,
            padding: "22px 26px",
            fontFamily: FONT,
            fontSize: 33,
            fontWeight: 500,
            lineHeight: 1.34,
            letterSpacing: -0.5,
            color: C.ink,
            transform: `scale(${bubbleScale})`,
            transformOrigin: "100% 50%",
          }}
        >
          {text}
          {typing ? (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 30,
                marginLeft: 3,
                marginBottom: -4,
                background: C.ink,
                opacity: caretOn ? 0.85 : 0,
              }}
            />
          ) : null}
        </div>
      </div>

      {/* ---- assistant row header */}
      {frame >= dotsFrom - 4 ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 300,
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: interpolate(frame, [dotsFrom - 4, dotsFrom + 3], [0, 1], CLAMP),
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              background: CLAUDE_SOFT,
              display: "grid",
              placeItems: "center",
            }}
          >
            <LogoImg src={A.logo.claude} size={28} />
          </div>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: -0.4,
            }}
          >
            Claude
          </span>
        </div>
      ) : null}

      {/* ---- the answer: dots, then the number */}
      <div style={{ position: "absolute", left: 40, top: 385, height: 140 }}>
        <div style={{ position: "absolute", left: 6, top: 56 }}>
          <ThinkingDots from={dotsFrom} until={numAt} />
        </div>
        <BigAnswer
          to={numTo}
          at={numAt}
          dur={14}
          boxW={numBoxW}
          muteFrom={muteFrom}
        />
      </div>

      {/* ---- rest of the reply (abstracted, no invented prose) */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 552,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <SkeletonBar w={540} at={numAt + 5} />
        <SkeletonBar w={402} at={numAt + 10} />
      </div>

      {/* ---- composer */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 648,
          width: PANEL.w - 80,
          height: 84,
          borderRadius: 20,
          background: "#FAF9F6",
          border: `1.5px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px 0 24px",
        }}
      >
        <div
          style={{
            width: 3,
            height: 32,
            background: C.mutedSoft,
            opacity: caretOn ? 0.55 : 0.1,
          }}
        />
        <div
          style={{
            marginLeft: "auto",
            width: 54,
            height: 54,
            borderRadius: 999,
            background: CLAUDE,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19V5M12 5l-6 6M12 5l6 6"
              stroke="#fff"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Mismatch marker — pure graphic: bracket spine + ticks + ✗
// ---------------------------------------------------------------------------

const Mismatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tA = ramp(frame, T.tickA, T.tickA + 8);
  const tSpine = ramp(frame, T.spine, T.spine + 15);
  const tB = ramp(frame, T.tickB, T.tickB + 8);
  const cross = spring({
    frame: frame - T.cross,
    fps,
    config: { damping: 11, stiffness: 200 },
  });

  const tickW = 74; // from SPINE_X to the left edge of the numbers
  const red = C.red;

  if (frame < T.tickA) return null;

  return (
    <>
      {/* tick into number A */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X,
          top: NUM_A - 2,
          width: tickW * tA,
          height: 4,
          background: red,
          borderRadius: 2,
        }}
      />
      {/* spine */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X,
          top: NUM_A,
          width: 4,
          height: (NUM_B - NUM_A) * tSpine,
          background: red,
          borderRadius: 2,
        }}
      />
      {/* tick into number B */}
      <div
        style={{
          position: "absolute",
          left: SPINE_X,
          top: NUM_B - 2,
          width: tickW * tB,
          height: 4,
          background: red,
          borderRadius: 2,
        }}
      />
      {/* ✗ */}
      {cross > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: SPINE_X + 2 - 38,
            top: (NUM_A + NUM_B) / 2 - 38,
            width: 76,
            height: 76,
            borderRadius: 999,
            background: C.paper,
            display: "grid",
            placeItems: "center",
            transform: `scale(${0.4 + 0.6 * cross})`,
            opacity: cross,
          }}
        >
          <svg width="76" height="76" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="42" fill={C.paper} stroke={red} strokeWidth={4} />
            <path
              d="M31 31 L57 57 M57 31 L31 57"
              stroke={red}
              strokeWidth={7}
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Payoff — the real OpenSEO keyword result
// ---------------------------------------------------------------------------

const SearchGlyph: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke={C.mutedSoft} strokeWidth={2.2} />
    <path
      d="M16.5 16.5 L21 21"
      stroke={C.mutedSoft}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </svg>
);

const Rule: React.FC<{ top: number; soft?: boolean }> = ({ top, soft }) => (
  <div
    style={{
      position: "absolute",
      left: PAD,
      top,
      width: INNER_W,
      height: 1.5,
      background: soft ? C.lineSoft : C.line,
    }}
  />
);

const DimRow: React.FC<{ top: number; kw: string; vol: string; at: number }> = ({
  top,
  kw,
  vol,
  at,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 10], [0, 1], CLAMP) * 0.62;
  return (
    <div
      style={{
        position: "absolute",
        left: PAD,
        top,
        width: INNER_W,
        display: "flex",
        alignItems: "center",
        opacity: o,
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 500,
        color: C.muted,
        letterSpacing: -0.4,
      }}
    >
      <span>{kw}</span>
      <span style={{ marginLeft: "auto", ...tabular }}>{vol}</span>
    </div>
  );
};

const PayoffCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rowIn = spring({
    frame: frame - T.rowIn,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const vol = interpolate(frame, [T.count, T.lock], [0, 3600], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const heroIn = interpolate(frame, [T.rowIn, T.rowIn + 7], [0, 1], CLAMP);
  const lockPulse = interpolate(
    frame,
    [T.lock - 2, T.lock + 4, T.lock + 16],
    [0, 1, 0],
    CLAMP,
  );
  const glow = interpolate(frame, [T.lock - 2, T.lock + 10], [0, 1], CLAMP);

  const tabs: { label: string; active?: boolean }[] = [
    { label: "Keywords", active: true },
    { label: "Domain" },
    { label: "AI Visibility" },
  ];

  return (
    <>
      {/* accent bloom behind the card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x + CARD.w / 2 - 700,
          top: CARD.y + CARD.h / 2 - 700,
          width: 1400,
          height: 1400,
          background: "transparent",
          opacity: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 30,
          background: C.card,
          border: `1.5px solid ${glow > 0.02 ? C.orangeLine : C.line}`,
          boxShadow: "0 26px 64px rgba(25,23,20,0.09)",
          overflow: "hidden",
        }}
      >
        {/* app nav */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: 92,
            background: "#FAF8F5",
            borderBottom: `1.5px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 26,
          }}
        >
          <OpenSeoMark size={44} />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.8,
              marginLeft: -12,
            }}
          >
            OpenSEO
          </span>
          {tabs.map((t) => (
            <span
              key={t.label}
              style={{
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: t.active ? 700 : 500,
                color: t.active ? C.ink : C.mutedSoft,
                letterSpacing: -0.4,
                padding: t.active ? "8px 18px" : "8px 0",
                borderRadius: 999,
                background: t.active ? C.card : "transparent",
                border: t.active ? `1.5px solid ${C.line}` : "1.5px solid transparent",
              }}
            >
              {t.label}
            </span>
          ))}
        </div>

        {/* heading */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 136,
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: C.ink,
          }}
        >
          Keyword Research
        </div>

        {/* search field */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 214,
            width: INNER_W,
            height: 88,
            borderRadius: 16,
            background: "#FAFAF8",
            border: `1.5px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px 0 24px",
            gap: 16,
          }}
        >
          <SearchGlyph />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 500,
              color: C.ink,
              letterSpacing: -0.6,
            }}
          >
            best seo tools
          </span>
          <div
            style={{
              marginLeft: "auto",
              width: 152,
              height: 60,
              borderRadius: 12,
              background: C.orange,
              display: "grid",
              placeItems: "center",
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.3,
            }}
          >
            Search
          </div>
        </div>

        <Rule top={338} />

        {/* column headers */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 366,
            width: INNER_W,
            fontFamily: FONT,
            fontSize: 33,
            fontWeight: 700,
            letterSpacing: 2.2,
            color: C.mutedSoft,
          }}
        >
          <span>KEYWORD</span>
          <span style={{ position: "absolute", left: 512 }}>KD</span>
          <span style={{ position: "absolute", left: 616 }}>CPC</span>
        </div>

        {/* result row */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 414,
            width: INNER_W,
            height: 64,
            display: "flex",
            alignItems: "center",
            opacity: rowIn,
            transform: `translateY(${(1 - rowIn) * 18}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -1,
            }}
          >
            best seo tools
          </span>
          <span
            style={{
              position: "absolute",
              left: 500,
              padding: "6px 16px",
              borderRadius: 999,
              background: C.orangeSoft,
              border: `1.5px solid ${C.orangeLine}`,
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 800,
              color: C.orange,
              ...tabular,
            }}
          >
            42
          </span>
          <span
            style={{
              position: "absolute",
              left: 616,
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 600,
              color: C.ink,
              ...tabular,
            }}
          >
            $34.60
          </span>
        </div>

        <Rule top={512} soft />

        {/* hero volume — only exists once the search has resolved */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 542,
            fontFamily: FONT,
            fontSize: 33,
            fontWeight: 700,
            letterSpacing: 2.2,
            color: C.mutedSoft,
            opacity: heroIn,
          }}
        >
          SEARCH VOLUME
        </div>
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 588,
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            opacity: heroIn,
            transform: `translateY(${(1 - heroIn) * 20}px) scale(${
              1 + lockPulse * 0.045
            })`,
            transformOrigin: "0% 60%",
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 190,
              fontWeight: 800,
              letterSpacing: -8,
              lineHeight: 1.05,
              color: C.orange,
              ...tabular,
            }}
          >
            {fmt(vol)}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 54,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: -0.6,
            }}
          >
            /mo
          </span>
        </div>

        {heroIn > 0.01 ? (
          <>
            <Rule top={846} soft />
            <DimRow top={880} kw="semrush keyword research" vol="6,600" at={T.rowIn + 10} />
            <DimRow top={946} kw="ahrefs backlink checker" vol="6,600" at={T.rowIn + 17} />
          </>
        ) : null}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const SeoHookTwoAnswers: React.FC = () => {
  // The wide hold (112 - 168) sits on PAIR_CY with the zoom eased back far
  // enough that BOTH panel headers are fully in frame with matched air above
  // and below — the beat's argument is that the two chats are identical, so
  // the framing has to be symmetric.
  const cam = useCam({
    keys: [0, T.camB, 70, T.camWide, 112, T.camPayoff, 186, 222, 240],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [380, 380, 1290, 1290, PAIR_CY, PAIR_CY, 2565, 2565, 2572],
    z: [1.36, 1.36, 1.36, 1.36, PAIR_Z, PAIR_Z, 1.17, 1.17, 1.176],
  });

  return (
    <PaperWorld cam={cam}>
      <ChatPanel
        y={PANEL_A_Y}
        label="chat 1"
        typeStart={-10}
        sendAt={T.sendA}
        dotsFrom={T.dotsA}
        numAt={T.numA}
        numTo={8100}
        numBoxW={366}
        muteFrom={T.mute}
      />
      <ChatPanel
        y={PANEL_B_Y}
        label="chat 2"
        typeStart={null}
        sendAt={0}
        dotsFrom={T.dotsB}
        numAt={T.numB}
        numTo={22000}
        numBoxW={452}
        muteFrom={T.mute}
      />

      <Mismatch />
      <PayoffCard />
    </PaperWorld>
  );
};
