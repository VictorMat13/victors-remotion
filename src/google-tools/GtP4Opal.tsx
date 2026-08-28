import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  C,
  Card,
  DISPLAY,
  EASE,
  FACTS,
  GT,
  MONO,
  PaperWorld,
  SPRINGS,
  useCam,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

// ---------------------------------------------------------------------------
// World geometry — one vertical column, camera dollies down it.
//   identity lockup (real wordmark + EXPERIMENT)  y 220..370
//   opal.google URL                               y ~404
//   n8n comparison chip (apart from the lockup)   y 435..605
//   prompt input card                             y 780..980
//   4-node workflow graph                         y 1060..1870
// ---------------------------------------------------------------------------

const CX = 540;

const IDENT = { x: 264, y: 220, w: 552, h: 150 };

// Real share-card proportions (opal-share-card.png, ink bbox 272×121 in a
// 300×140 crop): pill height = wordmark ink height, pill width = 1.65 ×
// wordmark ink width, stroke = 0.042 × pill height, regular/medium text.
const WM_H = 80; // full PNG box height on screen
const PILL_H = 69; // = 121 × (80/140) — wordmark ink height
const PILL_W = 256; // = 1.65 × 272 × (80/140) — 1.65 × ink width
const PILL_STROKE = 2.9; // 0.042 × PILL_H

const URL_Y = 404;

// Quiet comparison identity — its own spot below-right, clearly apart from
// the brand card. Flat (no shadow, no filter), mark ≥ 90px at the widest z.
const N8N = { cx: 800, cy: 520, size: 170, mark: 110 };

const PROMPT = { x: 180, y: 780, w: 720, h: 200 };
const PROMPT_BOTTOM = PROMPT.y + PROMPT.h; // 980

const NODE_W = 560;
const NODE_H = 120;
const NODE_X = CX - NODE_W / 2;
const NODE_CY = [1120, 1350, 1580, 1810];
const NODE_POP = [140, 158, 174, 190];

const NODES: { label: string; icon: "search" | "text" | "mail" | "clock" }[] = [
  { label: "Trending Search", icon: "search" },
  { label: "Summarize", icon: "text" },
  { label: "Draft Email", icon: "mail" },
  { label: "Schedule", icon: "clock" },
];

/** Connector segments (world y), each drawing over 12 frames. */
const SEGS = [
  { y1: PROMPT_BOTTOM, y2: NODE_CY[0] - NODE_H / 2, at: 132 }, // prompt → n1
  { y1: NODE_CY[0] + NODE_H / 2, y2: NODE_CY[1] - NODE_H / 2, at: 150 },
  { y1: NODE_CY[1] + NODE_H / 2, y2: NODE_CY[2] - NODE_H / 2, at: 166 },
  { y1: NODE_CY[2] + NODE_H / 2, y2: NODE_CY[3] - NODE_H / 2, at: 182 },
];
const SEG_SPAN = 12;

/** Run packet passes each node — subtle confirmation ticks. */
const TICKS = [225, 232, 240, 248];

const PERI = BRAND.opal.periwinkle;
const PERI_LINE = "rgba(102,94,246,0.45)";
const PERI_BORDER = "rgba(102,94,246,0.55)";
const PERI_TILE_LINE = "rgba(102,94,246,0.26)";

const PROMPT_TEXT =
  "Find trending topics, write a summary, email it to me every morning";

const clampBoth = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

/**
 * EXPERIMENT capsule matched to the real share card: height = wordmark ink
 * height, width = 1.65 × wordmark width, thin stroke, medium-weight text
 * with generous horizontal padding (fixed width, centered).
 */
const ExperimentCapsule: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      width: PILL_W,
      height: PILL_H,
      borderRadius: PILL_H / 2,
      border: `${PILL_STROKE}px solid ${C.ink}`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: DISPLAY,
      fontWeight: 500,
      fontSize: 38,
      letterSpacing: 1.2,
      color: C.ink,
      opacity,
      // sits on the wordmark's cap band, like the real card
      transform: "translateY(-6px)",
    }}
  >
    EXPERIMENT
  </div>
);

const NodeIcon: React.FC<{ kind: (typeof NODES)[number]["icon"] }> = ({
  kind,
}) => (
  <svg
    width={34}
    height={34}
    viewBox="0 0 34 34"
    fill="none"
    stroke={PERI}
    strokeWidth={2.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {kind === "search" ? (
      <>
        <circle cx={14} cy={14} r={8} />
        <path d="M 20 20 L 27 27" />
      </>
    ) : kind === "text" ? (
      <>
        <path d="M 7 10 L 27 10" />
        <path d="M 7 17 L 23 17" />
        <path d="M 7 24 L 17 24" />
      </>
    ) : kind === "mail" ? (
      <>
        <rect x={6} y={9} width={22} height={16} rx={3} />
        <path d="M 7 11 L 17 19 L 27 11" />
      </>
    ) : (
      <>
        <circle cx={17} cy={17} r={10} />
        <path d="M 17 11 L 17 17 L 22 20" />
      </>
    )}
  </svg>
);

// ---------------------------------------------------------------------------

export const GtP4Opal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = (at: number) =>
    spring({ frame: frame - at, fps, config: SPRINGS.pop });

  // --- Camera: identity → prompt → graph-build hold → wide settle ----------
  // Holds are tuned so every element is FULLY in frame or FULLY out:
  //   hold A (0–40)    fy 430  z 1.30 — identity + URL + n8n chip, all in
  //   hold B (58–120)  fy 880  z 1.12 — identity block + prompt, all in
  //   hold C (136–202) fy 1354 z 1.32 — prompt + 4 nodes in; identity block
  //                    fully above frame (visible top y≈627 > chip bottom 605)
  //   hold E (220–260) fy 1067 z 0.88 — whole world, mass centered in the
  //                    10%/12% safe band (content spans screen y 215..1667)
  const cam = useCam({
    keys: [0, 40, 58, 120, 136, 202, 220, 236, 260],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [430, 430, 880, 880, 1354, 1354, 1067, 1067, 1067],
    z: [1.3, 1.3, 1.12, 1.12, 1.32, 1.32, 0.88, 0.88, 0.88],
  });

  // --- Beat 1: identity ------------------------------------------------------
  const identIn = pop(2);
  const pillOp = interpolate(frame, [12, 20], [0, 1], clampBoth); // fade only
  const urlOp = interpolate(frame, [18, 28], [0, 1], clampBoth);
  const n8nIn = pop(26);
  const n8nOp = interpolate(frame, [26, 34], [0, 1], clampBoth);

  // --- Beat 2: prompt types in ----------------------------------------------
  const promptIn = pop(56);
  const typed = useTypewriter(PROMPT_TEXT, 62, 1.55);
  const typingDone = typed.length >= PROMPT_TEXT.length; // ~frame 105
  const caretOp = frame >= 107 ? 0 : frame % 22 < 13 ? 0.9 : 0.12;
  const submitFill = interpolate(frame, [105, 111], [0, 1], clampBoth);
  const press = interpolate(frame, [112, 116, 122], [0, 1, 0], clampBoth);
  const promptActive = interpolate(frame, [105, 113], [0, 1], clampBoth);

  // --- Beat 3: the graph wires itself ---------------------------------------
  const segP = SEGS.map((s) =>
    interpolate(frame, [s.at, s.at + SEG_SPAN], [0, 1], {
      ...clampBoth,
      easing: EASE,
    }),
  );

  // --- Beat 4: run packet travels prompt → last node, ends there ------------
  const packetY = interpolate(frame, [220, 248], [980, 1810], clampBoth);
  const packetOp =
    frame < 220
      ? 0
      : Math.min(
          interpolate(frame, [220, 223], [0, 1], clampBoth),
          interpolate(packetY, [1730, 1790], [1, 0], clampBoth),
        );

  // Port on a card edge — appears WITH its wire (never an orphan dot), lit
  // periwinkle from the first frame it exists. Flat fill, no glow.
  const port = (key: string, left: number, top: number, litAt: number) => {
    if (frame < litAt) return null;
    const p = Math.min(1, pop(litAt));
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left,
          top,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: PERI,
          opacity: Math.min(1, p * 2),
          transform: `scale(${0.4 + 0.6 * p})`,
        }}
      />
    );
  };

  return (
    <PaperWorld cam={cam}>
      {/* ------------------------------------------------ connector wires */}
      <svg
        width={100}
        height={860}
        viewBox="0 0 100 860"
        style={{ position: "absolute", left: CX - 50, top: 940 }}
      >
        {SEGS.map((s, i) => {
          if (segP[i] <= 0) return null;
          const len = s.y2 - s.y1;
          return (
            <line
              key={i}
              x1={50}
              y1={s.y1 - 940}
              x2={50}
              y2={s.y2 - 940}
              stroke={PERI_LINE}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - segP[i])}
            />
          );
        })}
      </svg>

      {/* ----------------------------------------------------- run packet */}
      {packetOp > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: CX - 11,
            top: packetY - 11,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: PERI,
            opacity: packetOp,
          }}
        />
      ) : null}

      {/* -------------------------------------------------- identity card */}
      <Card x={IDENT.x} y={IDENT.y} w={IDENT.w} h={IDENT.h} enter={identIn}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <Img
            src={staticFile(GT.logos.opalWordmark)}
            style={{ height: WM_H, display: "block" }}
          />
          <ExperimentCapsule opacity={pillOp} />
        </div>
      </Card>

      {/* real product URL — allowed data */}
      <div
        style={{
          position: "absolute",
          left: CX - 200,
          top: URL_Y,
          width: 400,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 26,
          color: C.muted,
          letterSpacing: 0.4,
          opacity: urlOp,
        }}
      >
        {FACTS.opal.url}
      </div>

      {/* ------------------- n8n comparison mark — its own spot, flat ----- */}
      <div
        style={{
          position: "absolute",
          left: N8N.cx - N8N.size / 2,
          top: N8N.cy - N8N.size / 2,
          width: N8N.size,
          height: N8N.size,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: n8nOp,
          transform: `translateX(${(1 - Math.min(1, n8nIn)) * 40}px)`,
        }}
      >
        <Img
          src={staticFile(GT.logos.n8n)}
          style={{ width: N8N.mark, height: N8N.mark, display: "block" }}
        />
      </div>

      {/* -------------------------------------------------- prompt input */}
      <Card
        x={PROMPT.x}
        y={PROMPT.y}
        w={PROMPT.w}
        h={PROMPT.h}
        enter={promptIn}
      >
        {/* active-state border once the prompt is submitted */}
        <div
          style={{
            position: "absolute",
            inset: -1.5,
            borderRadius: 26,
            border: `2px solid ${PERI_BORDER}`,
            opacity: promptActive,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 32,
            top: 30,
            width: 656,
            fontSize: 36,
            lineHeight: "48px",
            fontWeight: 500,
            color: C.ink,
            letterSpacing: -0.2,
          }}
        >
          {typed}
          <span
            style={{
              display: "inline-block",
              width: 3.5,
              height: 38,
              marginLeft: 5,
              verticalAlign: -6,
              background: C.ink,
              opacity: caretOp,
            }}
          />
        </div>

        {/* send affordance — soft until the prompt is complete, then presses */}
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 52,
            height: 52,
            borderRadius: 999,
            background: C.lineSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 - 0.14 * press})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: PERI,
              opacity: submitFill,
            }}
          />
          <svg
            width={22}
            height={24}
            viewBox="0 0 22 24"
            style={{ position: "relative" }}
            fill="none"
            stroke={typingDone ? "#FFFFFF" : C.mutedSoft}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 11 21 L 11 4" />
            <path d="M 4 11 L 11 4 L 18 11" />
          </svg>
        </div>

        {/* bottom port — appears together with the first wire */}
        {port("p-out", PROMPT.w / 2 - 8, PROMPT.h - 8, SEGS[0].at)}
      </Card>

      {/* ------------------------------------------------- workflow nodes */}
      {NODES.map((n, i) => {
        const e = pop(NODE_POP[i]);
        if (e <= 0.001) return null;
        const confirmed = frame >= TICKS[i];
        const check = Math.min(1, pop(TICKS[i]));
        const topLit = SEGS[i].at + SEG_SPAN; // wire lands on the top port
        return (
          <div
            key={n.label}
            style={{
              position: "absolute",
              left: NODE_X,
              top: NODE_CY[i] - NODE_H / 2,
              width: NODE_W,
              height: NODE_H,
              borderRadius: 24,
              background: C.card,
              border: `1.5px solid ${confirmed ? PERI_BORDER : C.line}`,
              boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 28px",
              opacity: Math.min(1, e * 1.3),
              transform: `translateY(${(1 - e) * 18}px) scale(${0.7 + 0.3 * Math.min(1, e)})`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: BRAND.opal.soft,
                border: `1.5px solid ${PERI_TILE_LINE}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <NodeIcon kind={n.icon} />
            </div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 37,
                color: C.ink,
                letterSpacing: -0.5,
                whiteSpace: "nowrap",
              }}
            >
              {n.label}
            </div>

            {/* run confirmation tick as the packet passes */}
            {check > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  right: 28,
                  top: NODE_H / 2 - 16,
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: PERI,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: check,
                  transform: `scale(${0.4 + 0.6 * check})`,
                }}
              >
                <svg
                  width={16}
                  height={13}
                  viewBox="0 0 16 13"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 1.5 6.5 L 6 11 L 14.5 1.5" />
                </svg>
              </div>
            ) : null}

            {/* ports — each appears together with its wire; the terminal
                node has NO bottom port (the workflow ends here) */}
            {port(`t${i}`, NODE_W / 2 - 8, -8, topLit)}
            {i < 3 ? port(`b${i}`, NODE_W / 2 - 8, NODE_H - 8, SEGS[i + 1].at) : null}
          </div>
        );
      })}
    </PaperWorld>
  );
};
