import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import {
  FACTS,
  FONT_RUNABLE,
  MRD,
  MRD_GRADIENT,
  MRD_GRID,
  RN,
  SPRINGS,
  UI,
  idGroteskFaces,
  safePadX,
} from "./theme";

// ===========================================================================
// BgP5CampaignsSideBySide — 1080x1920 @ 30fps
// 0:31 AGENCY KICKER  [9:16]
// VO: "Campaigns run side by side, that's your client list. Reports on demand,
//      changes in plain English. Five clients at two grand each is ten grand a
//      month. One person."
//
// AUTHENTICITY CONSTRAINT (the defining rule of this part):
// There is NO capture of a Runable ads-metrics dashboard — it only exists once
// a paid campaign is live and we have never launched one. So this comp invents
// NO dashboard, NO Spend / Impressions / Visits numerals, NO "Generate report"
// screen, NO "ask for changes" input that we have not seen.
//
// Everything on screen is built from what IS captured:
//   * public/bgrow/capture/02-grow-home.png — the real "Running Ads" section:
//     a warm section panel holding a 3 + 2 grid of white platform cards with a
//     mark top-left, a "Runable Managed" pill top-right and the label at the
//     bottom. That real card language is extended into five CLIENT campaign
//     cards (invented, generic small businesses — never a name from a capture).
//   * The real Grow composer, with its verbatim placeholder as the request.
// "Reports on demand, changes in plain English" is carried as a REQUEST GOING
// IN (the real composer, the real placeholder typed as a plain-English ask) and
// a DOCUMENT COMING BACK (a card of abstract ruled lines — a written report,
// deliberately with no numerals, no chart, no fabricated chrome). The green
// spine from the campaign panel down through the composer into the document is
// the whole causal chain, and it invents nothing.
//
// The ONLY numerals on screen are Bennett's own retainer arithmetic from
// theme.FACTS (5 x $2,000 = $10,000/mo). That block is deliberately rendered on
// a MERYDIAN-dark card with client monograms and a single operator node — his
// agency's books, visually separated from every Runable surface, so it can
// never be misread as advertising results.
//
// World: Merydian dark (#0A0A0A + ground gradient + the top green streak and
// the faint vertical rule grid from merydian.ai). Runable surfaces keep their
// real warm near-white and float as light fragments. Merydian spring green is
// the only saturated accent.
//
// One continuous world, one keyframed camera, hold -> move -> hold:
//     0-40   hold   TIGHT on the first client campaign card, already alive
//    40-58   move   pull back + drift right; the section panel blooms around it
//    58-76   hold   three campaigns side by side
//    76-94   move   pull back; the panel unfolds to the second row
//   94-142   hold   five clients, staggered waves, activity sweeps across them
//  142-162   move   travel down the green spine to the request
//  162-206   hold   the plain-English ask types and sends; the document returns
//  206-226   move   travel down to the arithmetic
//  226-300   hold   5 x $2,000 counts up, the total lands in Merydian green
//  300-330   settle one operator node fans out to all five clients
// ===========================================================================

export const DURATION_IN_FRAMES = 330;

const { fontFamily: INTER } = loadInter();

/* ------------------------------------------------------------------ frame -- */

const VIEW_W = 1080;
const SAFE = safePadX(VIEW_W); // 54 — the hard 5% side rule

const ease = Easing.inOut(Easing.cubic);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const eased = { easing: ease, ...clamp };

const popAt = (
  frame: number,
  fps: number,
  start: number,
  dur = 20,
  config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
) =>
  frame < start
    ? 0
    : spring({ frame: frame - start, fps, config, durationInFrames: dur });

const bell = (frame: number, a: number, b: number) =>
  Math.sin(interpolate(frame, [a, b], [0, 1], clamp) * Math.PI);

const enter = (p: number, dy = 14): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.9),
  transform: `translateY(${(1 - p) * dy}px)`,
});

const TAB: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1',
};

/* ------------------------------------- real ad-platform marks (brand colour)
 * These are the authentic marks and brand hexes of the platforms that actually
 * appear in the Running Ads section of 02-grow-home.png. Not palette values —
 * product identity, which the style guide requires be kept real.
 * -------------------------------------------------------------------------- */
const PLATFORM = {
  openai: "#000000",
  meta: "#0081FB",
  googleBlue: "#4285F4",
  googleYellow: "#FBBC04",
  googleGreen: "#34A853",
  tiktok: "#000000",
  ttCyan: "#25F4EE",
  ttRed: "#FE2C55",
} as const;

const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

type MarkKey = "openai" | "meta" | "googleAds" | "tiktok";

const Mark: React.FC<{ name: MarkKey; size: number }> = ({ name, size }) => {
  switch (name) {
    case "openai":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d={OPENAI_PATH} fill={PLATFORM.openai} />
        </svg>
      );
    case "meta":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path
            d="M12 12.2C10.1 8.6 8.5 6.7 6.4 6.7 4.1 6.7 2.6 9 2.6 12s1.5 5.3 3.8 5.3c2.3 0 3.9-2.3 5.6-5.1 1.7-2.8 3.3-5.1 5.6-5.1 2.3 0 3.8 2.3 3.8 5.3s-1.5 5.3-3.8 5.3c-2.1 0-3.7-1.9-5.6-5.5Z"
            fill="none"
            stroke={PLATFORM.meta}
            strokeWidth={2.1}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "googleAds":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path
            d="M11.3 3.6 6.3 14.4"
            stroke={PLATFORM.googleYellow}
            strokeWidth={5.2}
            strokeLinecap="round"
          />
          <path
            d="M12.9 3.6 18.5 15.2"
            stroke={PLATFORM.googleBlue}
            strokeWidth={5.2}
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="17.4" r="3.3" fill={PLATFORM.googleGreen} />
        </svg>
      );
    case "tiktok": {
      const note =
        "M13.7 3.1v10.5a2.85 2.85 0 1 1-2.5-2.83v2.35a.62.62 0 1 0 .62.62V3.1zM13.7 3.1c.35 2.4 1.9 3.9 4.4 4.15v2.5c-1.7-.05-3.2-.6-4.4-1.55z";
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
          <g transform="translate(-1.1,-1.0)">
            <path d={note} fill={PLATFORM.ttCyan} />
          </g>
          <g transform="translate(1.1,1.0)">
            <path d={note} fill={PLATFORM.ttRed} />
          </g>
          <path d={note} fill={PLATFORM.tiktok} />
          <path
            d="M11.2 10.75a5.55 5.55 0 1 0 5.05 5.5"
            fill="none"
            stroke={PLATFORM.tiktok}
            strokeWidth={2.4}
          />
        </svg>
      );
    }
    default:
      return null;
  }
};

const Chevron: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M6.5 9.5 12 15l5.5-5.5"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/* ================================= STATION A — the campaign rail ============ */

const PANEL_X = 60;
const PANEL_W = 960; // fits inside the 972px safe band at every zoom used
const PANEL_Y = 280;
const PANEL_PAD = 26;
const HEAD_H = 58;
const HEAD_GAP = 14;

const INNER_X = PANEL_X + PANEL_PAD; // 86
const INNER_W = PANEL_W - PANEL_PAD * 2; // 908
const CARD_GAP = 18;
// Two columns, exactly like the real Cold Outreach section in 02-grow-home.png.
const CARD_W = (INNER_W - CARD_GAP) / 2; // 445
const CARD_H = 246;
const ROW_GAP = 18;

const ROW0_Y = PANEL_Y + PANEL_PAD + HEAD_H + HEAD_GAP; // 378
const rowY = (r: number) => ROW0_Y + r * (CARD_H + ROW_GAP);
const colX = (c: number) => INNER_X + c * (CARD_W + CARD_GAP);

// The container unfolds to whatever has landed, so it is never an empty box.
const PANEL_H_ROW1 = PANEL_PAD + HEAD_H + HEAD_GAP + CARD_H + PANEL_PAD; // 370
const ROW_STEP = CARD_H + ROW_GAP; // 264
const PANEL_H_FULL = PANEL_H_ROW1 + ROW_STEP * 2; // 898
const PANEL_BOTTOM = PANEL_Y + PANEL_H_FULL; // 1178
const PANEL1_CY = PANEL_Y + PANEL_H_ROW1 / 2; // 465

// Invented-but-plausible generic local businesses. Never a name from a capture.
type Client = {
  name: string;
  mono: string;
  mark: MarkKey;
  col: number;
  row: number;
  badge?: string;
  start: number;
};

const CLIENTS: Client[] = [
  { name: "Northside Bakery", mono: "NB", mark: "openai", col: 0, row: 0, badge: UI.managedBadge, start: -10 },
  { name: "Harbour Dental", mono: "HD", mark: "meta", col: 1, row: 0, start: 56 },
  { name: "Iron Yard Gym", mono: "IY", mark: "googleAds", col: 0, row: 1, start: 82 },
  { name: "Bloom Florals", mono: "BF", mark: "tiktok", col: 1, row: 1, start: 88 },
  { name: "Cedar Auto Care", mono: "CA", mark: "meta", col: 0, row: 2, start: 94 },
];

const CARD1_CX = colX(0) + CARD_W / 2; // 308.5
const ROW0_CY = rowY(0) + CARD_H / 2; // 501
const PANEL_CY = PANEL_Y + PANEL_H_FULL / 2; // 729

/* ================================= STATION B — request in, document back ==== */

const COMP_W = 880;
const COMP_X = (VIEW_W - COMP_W) / 2; // 100
const COMP_Y = 2000;
const COMP_H = 240;

const DOC_W = 620;
const DOC_X = (VIEW_W - DOC_W) / 2; // 230
const DOC_Y = 2420;
const DOC_H = 440;

const STB_CY = (COMP_Y + DOC_Y + DOC_H) / 2; // 2430

const REQUEST = UI.growPlaceholder; // verbatim real product copy
const TYPE_A = 146;
const TYPE_B = 170;
const SEND = 174;
const DOC_IN = 184;

const DOC_LINES = [552, 512, 552, 468, 540, 372];

/* ================================= STATION C — the retainer arithmetic ====== */

const MC_X = 60;
const MC_W = 960;
const MC_Y = 3520;
const MC_H = 900;

const CHIP_D = 64;
const CHIP_GAP = 34;
const CHIP_ROW_W = CHIP_D * 5 + CHIP_GAP * 4; // 456
const CHIP_X0 = (VIEW_W - CHIP_ROW_W) / 2; // 312
const CHIP_CY = MC_Y + 112;
const chipCx = (i: number) => CHIP_X0 + CHIP_D / 2 + i * (CHIP_D + CHIP_GAP);

const NODE_D = 92;
const NODE_CY = MC_Y + 300;

const EQ_CY = MC_Y + 520;
const RULE_Y = MC_Y + 612;
const RULE_W = 440;
const TOT_CY = MC_Y + 742;

const STC_CY = MC_Y + MC_H / 2; // 3970

const CHIP_START = [220, 224, 228, 232, 236];
const RET_A = 238;
const RET_B = 256;
const RULE_A = 254;
const RULE_B = 264;
const TOT_A = 258;
const TOT_B = 280;
const NODE_START = 224;
const FAN_A = 282;

const RETAINER = Number(FACTS.retainer.replace(/[^0-9]/g, "")); // 2000
const MONTHLY = Number(FACTS.monthly.replace(/[^0-9]/g, "")); // 10000

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ------------------------------------------------------------------ camera -- */

// Screen x the hero card's left edge is pinned to during the opening pull-back.
const PIN_X = 95;
const PULLBACK_END = 58;

const KEY_T = [0, 40, 58, 76, 96, 142, 162, 206, 226, 300, 316, 330];
const KEY_FX = [CARD1_CX, CARD1_CX, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [
  ROW0_CY, ROW0_CY, PANEL1_CY, PANEL1_CY, PANEL_CY, PANEL_CY,
  STB_CY, STB_CY, STC_CY, STC_CY, STC_CY + 3, STC_CY + 3,
];
const KEY_Z = [2.0, 2.0, 0.98, 0.98, 0.93, 0.93, 0.97, 0.97, 0.94, 0.94, 0.938, 0.938];

/* -------------------------------------------------------------------- comp -- */

export const BgP5CampaignsSideBySide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fy = interpolate(frame, KEY_T, KEY_FY, eased);
  const z = interpolate(frame, KEY_T, KEY_Z, eased);
  // Opening pull-back: derive focal x FROM the zoom instead of easing it on its
  // own time curve. Panning and zooming on independent curves swings the hero
  // card's left edge out through the 5% band mid-move; deriving it pins that
  // edge to PIN_X for the whole gesture and lands on exactly the same key.
  const fx =
    frame <= PULLBACK_END
      ? colX(0) + (width / 2 - PIN_X) / z
      : interpolate(frame, KEY_T, KEY_FX, eased);

  // ---- 5% side-margin gate ------------------------------------------------
  // Nothing that carries meaning may touch the outer 5% at ANY camera zoom, and
  // a travelling rail is the classic offender. Every content element declares
  // its world span and is faded out before its screen edge can reach the safe
  // line, so the rule holds by construction rather than by inspection.
  const safeGate = (worldLeft: number, worldRight: number) => {
    const sl = width / 2 + (worldLeft - fx) * z;
    const sr = width / 2 + (worldRight - fx) * z;
    const slack = 4;
    const inside = Math.min(sl - (SAFE + slack), width - SAFE - slack - sr);
    return interpolate(inside, [-26, 5], [0, 1], clamp);
  };

  const panelGate = safeGate(PANEL_X, PANEL_X + PANEL_W);
  const compGate = safeGate(COMP_X, COMP_X + COMP_W);
  const docGate = safeGate(DOC_X, DOC_X + DOC_W);
  const mathGate = safeGate(MC_X, MC_X + MC_W);

  // ---- station A ----------------------------------------------------------
  // The section container only blooms once the camera is wide enough to hold
  // it inside the safe band; before that the first card floats alone.
  const panelShell = popAt(frame, fps, 44, 24, SPRINGS.smooth);
  const headIn = popAt(frame, fps, 50, 18, SPRINGS.smooth);
  const panelH =
    PANEL_H_ROW1 +
    ROW_STEP * popAt(frame, fps, 76, 24, SPRINGS.smooth) +
    ROW_STEP * popAt(frame, fps, 84, 24, SPRINGS.smooth);

  // ---- station B ----------------------------------------------------------
  const compIn = popAt(frame, fps, 140, 22, SPRINGS.smooth);
  const typed = Math.round(
    interpolate(frame, [TYPE_A, TYPE_B], [0, REQUEST.length], clamp),
  );
  const caretOn = frame < SEND && Math.floor(frame / 7) % 2 === 0;
  const sendFlash = bell(frame, SEND - 4, SEND + 10);

  const tokenT = interpolate(frame, [SEND, SEND + 14], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const tokenLive = frame >= SEND && frame <= SEND + 15;
  const tokenY = COMP_Y + COMP_H - 6 + tokenT * (DOC_Y + 18 - (COMP_Y + COMP_H - 6));

  const docShell = popAt(frame, fps, DOC_IN, 20, SPRINGS.smooth);
  const checkPop = popAt(frame, fps, 198, 18, SPRINGS.bouncy);

  // the green spine: campaigns -> request -> document
  const spineTop = PANEL_BOTTOM;
  const spineBottom = DOC_Y;
  const spineDraw = interpolate(frame, [138, 190], [0, 1], { ...clamp, easing: ease });

  // ---- station C ----------------------------------------------------------
  const chipsLanded = CHIP_START.filter((s) => popAt(frame, fps, s, 20, SPRINGS.bouncy) > 0.45).length;
  const retIn = popAt(frame, fps, RET_A, 14, SPRINGS.smooth);
  const retainer = Math.max(
    50,
    Math.round(interpolate(frame, [RET_A, RET_B], [0, RETAINER], { ...clamp, easing: ease }) / 50) * 50,
  );
  const ruleW = interpolate(frame, [RULE_A, RULE_B], [0, RULE_W], { ...clamp, easing: ease });
  const totIn = popAt(frame, fps, TOT_A, 14, SPRINGS.smooth);
  const total = Math.max(
    100,
    Math.round(interpolate(frame, [TOT_A, TOT_B], [0, MONTHLY], { ...clamp, easing: ease }) / 100) * 100,
  );
  const totalGlow = interpolate(frame, [TOT_B - 10, TOT_B + 6, TOT_B + 40], [0, 1, 0.55], clamp);
  const unitIn = popAt(frame, fps, 278, 16, SPRINGS.smooth);
  const nodeIn = popAt(frame, fps, NODE_START, 20, SPRINGS.bouncy);
  // the node is present but unlit until the five lines reach it
  const nodeLit = interpolate(frame, [FAN_A + 4, FAN_A + 26], [0, 1], { ...clamp, easing: ease });
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * 1.35 * Math.PI);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        backgroundImage: MRD_GRADIENT.ground,
        fontFamily: INTER,
      }}
    >
      <style>{idGroteskFaces(staticFile)}</style>

      {/* Merydian identity: the vertical light streaks bleeding from the top. */}
      <AbsoluteFill style={{ backgroundImage: MRD_GRADIENT.streak, opacity: 0.85 }} />

      {/* ------------------------------------------------------------ camera */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: VIEW_W,
            height: 4800,
            transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          {/* faint vertical rule grid — background, allowed to bleed */}
          <div
            style={{
              position: "absolute",
              left: -900,
              top: -600,
              width: 2900,
              height: 6000,
              backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${
                MRD_GRID.spacing - 1
              }px, ${MRD_GRID.color} ${MRD_GRID.spacing - 1}px, ${MRD_GRID.color} ${MRD_GRID.spacing}px)`,
            }}
          />

          {/* soft green ground glow under each station */}
          <div
            style={{
              position: "absolute",
              left: -180,
              top: PANEL_Y - 240,
              width: 1440,
              height: 1400,
              background: `radial-gradient(52% 46% at 50% 50%, ${MRD.greenSoft} 0%, rgba(0,255,171,0) 72%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -180,
              top: MC_Y - 200,
              width: 1440,
              height: 1300,
              background: `radial-gradient(52% 44% at 50% 52%, ${MRD.greenSoft} 0%, rgba(0,255,171,0) 74%)`,
            }}
          />

          {/* ------------------------------------------- the connecting spine */}
          <div
            style={{
              position: "absolute",
              left: 539,
              top: spineTop,
              width: 2,
              height: (spineBottom - spineTop) * spineDraw,
              background: `linear-gradient(180deg, rgba(0,255,171,0.05) 0%, rgba(0,255,171,0.40) 26%, rgba(0,255,171,0.40) 100%)`,
            }}
          />

          {/* =================================== STATION A — campaign rail ===
              The real Running Ads card language from 02-grow-home.png, extended
              into five client campaign cards. Panel + header carry their own
              margin gate; every card carries its own, so a card is never drawn
              once its own screen edge could reach the outer 5%. */}

          {/* section container — the real warm near-white section panel */}
          <div
            style={{
              position: "absolute",
              left: PANEL_X,
              top: PANEL_Y,
              width: PANEL_W,
              height: panelH,
              boxSizing: "border-box",
              borderRadius: 30,
              backgroundColor: RN.panel,
              border: `1px solid ${RN.border}`,
              boxShadow: MRD.panelShadow,
              opacity: panelGate * Math.min(1, panelShell * 1.8),
              transform: `scale(${0.975 + 0.025 * panelShell})`,
              transformOrigin: `${CARD1_CX - PANEL_X}px ${ROW0_CY - PANEL_Y}px`,
            }}
          />

          {/* section header — verbatim UI.sections[0] */}
          <div
            style={{
              position: "absolute",
              left: INNER_X,
              top: PANEL_Y + PANEL_PAD,
              width: INNER_W,
              height: HEAD_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: FONT_RUNABLE,
              opacity: panelGate * Math.min(1, headIn * 1.9),
              transform: `translateY(${(1 - headIn) * 10}px)`,
            }}
          >
            <span style={{ fontSize: 34, fontWeight: 500, color: RN.textWarm, letterSpacing: -0.4 }}>
              {UI.sections[0]}
            </span>
            <Chevron size={28} color={RN.muted} />
          </div>

          {/* the client campaign cards */}
          {CLIENTS.map((c, i) => {
            const p = popAt(frame, fps, c.start, 22);
            if (p <= 0.001) return null;
            const x = colX(c.col);
            const y = rowY(c.row);
            const gate = safeGate(x, x + CARD_W);
            // live pulse, out of phase per card
            const pulse = 0.5 + 0.5 * Math.sin(((frame - i * 5) / fps) * 2.1 * Math.PI);
            // an activity sweep walks the grid during the wide hold
            const sweep = Math.max(
              0,
              Math.sin(interpolate(frame, [100 + i * 7, 136 + i * 7], [0, 1], clamp) * Math.PI),
            );
            const bar = interpolate((frame - c.start) % 150, [0, 150], [0.2, 0.84], clamp);
            return (
              <div
                key={c.name}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: CARD_W,
                  height: CARD_H,
                  boxSizing: "border-box",
                  borderRadius: 20,
                  backgroundColor: RN.card,
                  border: `1px solid ${RN.border}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.34), 0 0 ${
                    14 + 18 * sweep
                  }px rgba(0,255,171,${0.05 + 0.16 * sweep})`,
                  fontFamily: FONT_RUNABLE,
                  opacity: gate * Math.min(1, p * 1.9),
                  transform: `translateY(${(1 - p) * 20}px) scale(${0.965 + 0.035 * p})`,
                }}
              >
                <div style={{ position: "absolute", left: 26, top: 24 }}>
                  <Mark name={c.mark} size={46} />
                </div>

                {c.badge ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 24,
                      top: 30,
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 10,
                      backgroundColor: RN.hover,
                      border: `1px solid ${RN.border}`,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 21,
                      fontWeight: 400,
                      color: RN.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.badge}
                  </div>
                ) : null}

                <div
                  style={{
                    position: "absolute",
                    left: 26,
                    top: 128,
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 38,
                    fontWeight: 500,
                    color: RN.text,
                    letterSpacing: -0.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </div>

                {/* live indicator */}
                <div
                  style={{
                    position: "absolute",
                    right: 26,
                    top: 141,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: MRD.green,
                    border: "1px solid rgba(0,150,100,0.35)",
                    boxShadow: `0 0 ${9 + 14 * pulse}px rgba(0,255,171,${0.45 + 0.35 * pulse})`,
                    opacity: 0.72 + 0.28 * pulse,
                  }}
                />

                {/* activity track */}
                <div
                  style={{
                    position: "absolute",
                    left: 26,
                    top: 202,
                    width: CARD_W - 52,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${bar * 100}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: `linear-gradient(90deg, rgba(0,213,199,0.55) 0%, ${MRD.green} 100%)`,
                      opacity: 0.55 + 0.45 * sweep,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* ================== STATION B — the ask in, the document back ==== */}
          {/* the real Grow composer; the request is the product's own verbatim
              placeholder typed out, so no product copy is invented here. */}
          <div
            style={{
              position: "absolute",
              left: COMP_X,
              top: COMP_Y,
              width: COMP_W,
              height: COMP_H,
              boxSizing: "border-box",
              borderRadius: 26,
              backgroundColor: RN.panel,
              border: `1px solid ${RN.border}`,
              boxShadow: `${MRD.panelShadow}, 0 0 ${20 + 40 * sendFlash}px rgba(0,255,171,${
                0.05 + 0.25 * sendFlash
              })`,
              fontFamily: FONT_RUNABLE,
              opacity: compGate * Math.min(1, compIn * 1.9),
              transform: `translateY(${(1 - compIn) * 22}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 40,
                right: 34,
                height: 46,
                display: "flex",
                alignItems: "center",
                fontSize: 36,
                color: RN.text,
                letterSpacing: -0.3,
                whiteSpace: "nowrap",
              }}
            >
              {REQUEST.slice(0, typed)}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 38,
                  marginLeft: 3,
                  backgroundColor: RN.text,
                  opacity: caretOn ? 0.85 : 0,
                }}
              />
            </div>

            {/* the composer's real bottom controls */}
            <div
              style={{
                position: "absolute",
                left: 34,
                bottom: 30,
                width: 46,
                height: 46,
                borderRadius: 23,
                border: `1px solid ${RN.borderStrong}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: RN.muted,
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              +
            </div>
            {/* right-hand composer control. No label: the only strings this
                comp renders come from UI in theme.ts. */}
            <div
              style={{
                position: "absolute",
                right: 34,
                bottom: 30,
                height: 46,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: RN.hover,
                  border: `1px solid ${RN.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24">
                  <rect x="9" y="3" width="6" height="11" rx="3" fill={RN.textWarm} />
                  <path
                    d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8V21"
                    stroke={RN.textWarm}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* the request travelling down the spine */}
          {tokenLive ? (
            <div
              style={{
                position: "absolute",
                left: 540 - 46,
                top: tokenY - 13,
                width: 92,
                height: 26,
                borderRadius: 13,
                backgroundColor: MRD.card,
                border: `1px solid rgba(0,255,171,0.45)`,
                boxShadow: MRD.glowSoft,
                opacity: compGate,
              }}
            />
          ) : null}

          {/* the document that comes back — ruled lines only. No numerals, no
              chart, no fabricated dashboard chrome. */}
          <div
            style={{
              position: "absolute",
              left: DOC_X,
              top: DOC_Y,
              width: DOC_W,
              height: DOC_H,
              boxSizing: "border-box",
              borderRadius: 22,
              backgroundColor: RN.card,
              border: `1px solid ${RN.border}`,
              boxShadow: `0 20px 48px rgba(0,0,0,0.45), 0 0 34px rgba(0,255,171,0.10)`,
              opacity: docGate * Math.min(1, docShell * 1.9),
              transform: `translateY(${(1 - docShell) * 30}px) scale(${0.97 + 0.03 * docShell})`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 34,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <svg width={34} height={34} viewBox="0 0 24 24">
                <path
                  d="M6 2.8h7.6L18.4 7.6V21.2H6z"
                  fill="none"
                  stroke={RN.muted}
                  strokeWidth={1.7}
                  strokeLinejoin="round"
                />
                <path d="M13.4 2.8v4.9h5" fill="none" stroke={RN.muted} strokeWidth={1.7} />
              </svg>
              <div
                style={{
                  width: interpolate(popAt(frame, fps, DOC_IN + 4, 16), [0, 1], [0, 236]),
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "rgba(0,0,0,0.72)",
                }}
              />
            </div>

            {DOC_LINES.map((w, i) => {
              const p = popAt(frame, fps, DOC_IN + 6 + i * 3, 16, SPRINGS.smooth);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 34,
                    top: 128 + i * 42,
                    width: w * p,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: i === 0 ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.09)",
                  }}
                />
              );
            })}

            <div
              style={{
                position: "absolute",
                right: 30,
                bottom: 28,
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: MRD.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 26px rgba(0,255,171,0.45)",
                transform: `scale(${checkPop})`,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24">
                <path
                  d="M5.5 12.6 10 17l8.4-9"
                  fill="none"
                  stroke={MRD.greenInk}
                  strokeWidth={2.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* ============ STATION C — Bennett's own retainer arithmetic ======
              Deliberately a MERYDIAN-dark card with client monograms and one
              operator: his agency's books, not advertising results. */}
          <div
            style={{
              position: "absolute",
              left: MC_X,
              top: MC_Y,
              width: MC_W,
              height: MC_H,
              boxSizing: "border-box",
              borderRadius: 34,
              backgroundColor: MRD.card,
              border: `1px solid ${MRD.hairline}`,
              boxShadow: `${MRD.panelShadow}, 0 0 ${60 + 60 * totalGlow}px rgba(0,255,171,${
                0.05 + 0.12 * totalGlow
              })`,
              opacity: mathGate,
            }}
          />

          {/* fan lines: one operator -> all five clients */}
          <svg
            width={MC_W}
            height={MC_H}
            viewBox={`0 0 ${MC_W} ${MC_H}`}
            style={{ position: "absolute", left: MC_X, top: MC_Y, opacity: mathGate }}
          >
            {CLIENTS.map((c, i) => {
              const p = interpolate(frame, [FAN_A + i * 4, FAN_A + 14 + i * 4], [0, 1], {
                ...clamp,
                easing: ease,
              });
              if (p <= 0.001) return null;
              const x1 = 540 - MC_X;
              const y1 = NODE_CY - MC_Y - NODE_D / 2;
              const x2 = chipCx(i) - MC_X;
              const y2 = CHIP_CY - MC_Y + CHIP_D / 2;
              return (
                <line
                  key={c.name}
                  x1={x1}
                  y1={y1}
                  x2={x1 + (x2 - x1) * p}
                  y2={y1 + (y2 - y1) * p}
                  stroke={MRD.green}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  opacity={0.42}
                />
              );
            })}
          </svg>

          {/* client monograms */}
          {CLIENTS.map((c, i) => {
            const p = popAt(frame, fps, CHIP_START[i], 20, SPRINGS.bouncy);
            const glow = interpolate(frame, [CHIP_START[i], CHIP_START[i] + 12], [1, 0.25], clamp);
            return (
              <div
                key={c.mono}
                style={{
                  position: "absolute",
                  left: chipCx(i) - CHIP_D / 2,
                  top: CHIP_CY - CHIP_D / 2,
                  width: CHIP_D,
                  height: CHIP_D,
                  borderRadius: CHIP_D / 2,
                  backgroundColor: "#202020",
                  border: `1px solid rgba(0,255,171,${0.18 + 0.4 * glow})`,
                  boxShadow: `0 0 ${10 + 24 * glow}px rgba(0,255,171,${0.08 + 0.28 * glow})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  color: MRD.text,
                  opacity: mathGate * Math.min(1, p * 1.9),
                  transform: `scale(${0.7 + 0.3 * p})`,
                }}
              >
                {c.mono}
              </div>
            );
          })}

          {/* the single operator */}
          <div
            style={{
              position: "absolute",
              left: 540 - NODE_D / 2,
              top: NODE_CY - NODE_D / 2,
              width: NODE_D,
              height: NODE_D,
              borderRadius: NODE_D / 2,
              backgroundColor: "#111111",
              border: `1.6px solid rgba(0,255,171,${0.22 + (0.28 + 0.3 * breathe) * nodeLit})`,
              boxShadow: `0 0 ${10 + (12 + 26 * breathe) * nodeLit}px rgba(0,255,171,${
                0.05 + (0.13 + 0.18 * breathe) * nodeLit
              })`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: mathGate * Math.min(1, nodeIn * 1.9),
              transform: `scale(${0.66 + 0.34 * nodeIn})`,
            }}
          >
            <svg width={46} height={46} viewBox="0 0 24 24">
              <circle cx="12" cy="8.2" r="3.5" fill={MRD.green} opacity={0.45 + 0.55 * nodeLit} />
              <path
                d="M4.8 20.2c0-3.9 3.2-6.4 7.2-6.4s7.2 2.5 7.2 6.4"
                fill="none"
                stroke={MRD.green}
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.45 + 0.55 * nodeLit}
              />
            </svg>
          </div>

          {/* 5 x $2,000 */}
          <div
            style={{
              position: "absolute",
              left: MC_X,
              top: EQ_CY - 62,
              width: MC_W,
              height: 124,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
              opacity: mathGate,
            }}
          >
            <span
              style={{
                ...TAB,
                fontSize: 96,
                fontWeight: 600,
                color: MRD.text,
                letterSpacing: -2,
                opacity: chipsLanded > 0 ? 1 : 0,
              }}
            >
              {chipsLanded}
            </span>
            <span
              style={{
                fontSize: 62,
                color: MRD.muted,
                fontWeight: 300,
                ...enter(retIn, 8),
              }}
            >
              &#215;
            </span>
            <span
              style={{
                ...TAB,
                fontSize: 96,
                fontWeight: 600,
                color: MRD.text,
                letterSpacing: -2,
                minWidth: 330,
                textAlign: "center",
                ...enter(retIn, 12),
              }}
            >
              {money(retainer)}
            </span>
          </div>

          {/* the sum bar */}
          <div
            style={{
              position: "absolute",
              left: 540 - ruleW / 2,
              top: RULE_Y,
              width: ruleW,
              height: 2,
              backgroundColor: "rgba(255,255,255,0.22)",
              opacity: mathGate,
            }}
          />

          {/* $10,000 /mo */}
          <div
            style={{
              position: "absolute",
              left: MC_X,
              top: TOT_CY - 96,
              width: MC_W,
              height: 192,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              opacity: mathGate,
            }}
          >
            <span
              style={{
                ...TAB,
                fontSize: 148,
                fontWeight: 700,
                color: MRD.green,
                letterSpacing: -4,
                textShadow: `0 0 ${26 + 44 * totalGlow}px rgba(0,255,171,${0.28 + 0.34 * totalGlow})`,
                minWidth: 590,
                textAlign: "center",
                ...enter(totIn, 16),
              }}
            >
              {money(total)}
            </span>
            <span
              style={{
                fontSize: 46,
                fontWeight: 400,
                color: MRD.muted,
                letterSpacing: -0.5,
                paddingBottom: 18,
                ...enter(unitIn, 10),
              }}
            >
              /mo
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
