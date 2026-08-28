import { Easing, interpolate } from "remotion";
import { WORLD } from "./constants";
import { CONTENT_ORIGIN } from "./PortalWindow";
import { OVERVIEW_TARGETS } from "./pages/OverviewPage";
import { REIMAGE_LAYOUT } from "./pages/ReimagePage";
import { MODAL_SIZE, MODAL_TARGETS } from "./pages/ReimageModal";
import { TERM_PHASES } from "./TerminalPanel";
import {
  CamKey,
  Click,
  Glide,
  clamp01,
  cursorAt,
  prog,
  pressAmt,
  remap,
  rippleAmt,
} from "./choreo";

// =============================================================================
// Master timeline — single source of truth for both aspect ratios.
// 1050 frames @ 30fps ≈ 35s. Beat boundaries are camera holds so the editor
// can trim beats cleanly.
// =============================================================================

export const TOTAL_FRAMES = 1050;

// ---- world-space anchors (derived from component exports) --------------------
const P = WORLD.portal;
const CONTENT_W = P.w - CONTENT_ORIGIN.x; // 1300
const CONTENT_H = P.h - CONTENT_ORIGIN.y; // 1024
const contentWorld = (x: number, y: number) => ({
  x: P.x + CONTENT_ORIGIN.x + x,
  y: P.y + CONTENT_ORIGIN.y + y,
});

export const ANCHOR = {
  portalCenter: { x: P.x + P.w / 2, y: P.y + P.h / 2 }, // (1000, 1180)
  contentCenter: contentWorld(CONTENT_W / 2, CONTENT_H / 2),
  reimageBtn: contentWorld(OVERVIEW_TARGETS.reimage.x, OVERVIEW_TARGETS.reimage.y),
  appsTab: contentWorld(REIMAGE_LAYOUT.appsTab.x, REIMAGE_LAYOUT.appsTab.y),
  modalTopLeft: contentWorld(
    (CONTENT_W - MODAL_SIZE.w) / 2,
    (CONTENT_H - MODAL_SIZE.h) / 2,
  ),
  termCenter: {
    x: WORLD.term.x + WORLD.term.w / 2,
    y: WORLD.term.y + WORLD.term.h / 2,
  }, // (3120, 1180)
  server: { x: WORLD.server.cx, y: WORLD.server.cy },
};

export const MODAL_INPUT = {
  x: ANCHOR.modalTopLeft.x + MODAL_TARGETS.input.x,
  y: ANCHOR.modalTopLeft.y + MODAL_TARGETS.input.y,
};
export const MODAL_PROCEED = {
  x: ANCHOR.modalTopLeft.x + MODAL_TARGETS.proceed.x,
  y: ANCHOR.modalTopLeft.y + MODAL_TARGETS.proceed.y,
};

// scroll distance that centers the Hermes card (index 5) in the content area
const HERMES_CARD_CENTER_LOCAL =
  REIMAGE_LAYOUT.listTop + 5 * REIMAGE_LAYOUT.cardStride + 90;
export const SCROLL_END = HERMES_CARD_CENTER_LOCAL - CONTENT_H / 2; // ≈852

export const HERMES_SELECT = contentWorld(
  REIMAGE_LAYOUT.selectCenter.x,
  REIMAGE_LAYOUT.listTop +
    5 * REIMAGE_LAYOUT.cardStride +
    REIMAGE_LAYOUT.selectCenter.y -
    SCROLL_END,
);

// ---- beats -------------------------------------------------------------------
export const T = {
  // intro
  markAssemble: [4, 40],
  wordmark: [30, 46],
  // overview
  cursorIn: [88, 96],
  glideReimage: [96, 126],
  reimageHover: [126, 136],
  clickReimage: 138,
  pageSwitch: [142, 164],
  // applications tab
  glideTab: [150, 178],
  clickTab: 184,
  tabSwitch: [186, 202],
  // catalog
  glideRest: [210, 238],
  scroll: [222, 294],
  glideSelect: [292, 318],
  clickSelect: 326,
  // modal
  modalIn: [332, 352],
  glideInput: [344, 366],
  clickInput: 370,
  typing: [380, 424],
  proceedEnable: [426, 436],
  glideProceed: [430, 452],
  clickProceed: 462,
  modalOut: [468, 480],
  cursorFade: [470, 486],
  // install
  install: [494, 564],
  // whip + terminal
  whip: [582, 606],
  // payoff
  morph: [880, 916],
  reveal: [884, 966],
  end: [1020, 1050],
} as const;

export const CLICKS: Click[] = [
  { at: T.clickReimage },
  { at: T.clickTab },
  { at: T.clickSelect },
  { at: T.clickInput },
  { at: T.clickProceed },
];

// ---- cursor -------------------------------------------------------------------
const REST = { x: 1610, y: 1330 };
const GLIDES: Glide[] = [
  {
    t0: T.glideReimage[0],
    t1: T.glideReimage[1],
    from: { x: 1930, y: 1290 },
    to: ANCHOR.reimageBtn,
    bow: 0.08,
  },
  {
    t0: T.glideTab[0],
    t1: T.glideTab[1],
    from: ANCHOR.reimageBtn,
    to: ANCHOR.appsTab,
    bow: -0.1,
  },
  {
    t0: T.glideRest[0],
    t1: T.glideRest[1],
    from: ANCHOR.appsTab,
    to: REST,
    bow: 0.07,
  },
  {
    t0: T.glideSelect[0],
    t1: T.glideSelect[1],
    from: REST,
    to: HERMES_SELECT,
    bow: 0.18,
  },
  {
    t0: T.glideInput[0],
    t1: T.glideInput[1],
    from: HERMES_SELECT,
    to: MODAL_INPUT,
    bow: -0.08,
  },
  {
    t0: T.glideProceed[0],
    t1: T.glideProceed[1],
    from: MODAL_INPUT,
    to: MODAL_PROCEED,
    bow: 0.09,
  },
];

// ---- terminal time remap --------------------------------------------------------
// Pins comp frames to TerminalPanel's local clock so the deterministic typing
// sequence is paced to the VO. Chaos is already rolling when the whip lands.
const TERM_SEGMENTS: [number, number][] = [
  [570, 30],
  [606, 88],
  [630, TERM_PHASES.wipeStart],
  [648, TERM_PHASES.cleanStart],
  [700, TERM_PHASES.sshDone],
  [730, TERM_PHASES.updateDone],
  [764, TERM_PHASES.wizardSelect],
  [806, TERM_PHASES.setupDone],
  [818, TERM_PHASES.tuiStart],
  [846, TERM_PHASES.tuiDrawn],
];

// ---- full world state for a frame ------------------------------------------------
export type WorldState = ReturnType<typeof worldState>;

const easeInOut = Easing.inOut(Easing.cubic);
const backOut = Easing.out(Easing.back(1.4));

export const worldState = (frame: number) => {
  const scrollY =
    prog(frame, T.scroll[0], T.scroll[1], easeInOut) * SCROLL_END;

  // per-card lift: bell curve on distance from the content-area center while
  // the list travels; the Hermes card keeps its lift through the click.
  const scrollActive = frame > 208 && frame < 348;
  const lifts = Array.from({ length: 7 }, (_, i) => {
    if (!scrollActive) return 0;
    const cardCenterWorldY =
      P.y +
      CONTENT_ORIGIN.y +
      REIMAGE_LAYOUT.listTop +
      i * REIMAGE_LAYOUT.cardStride +
      90 -
      scrollY;
    const d = Math.abs(cardCenterWorldY - ANCHOR.contentCenter.y);
    let lift = clamp01(1 - d / 300);
    if (i === 5) {
      // hermes card: hold the highlight once centered
      lift = Math.max(lift, prog(frame, 290, 300));
    } else if (frame > 300) {
      lift *= 1 - prog(frame, 300, 316);
    }
    return lift;
  });

  const modalLife = 1 - prog(frame, T.modalOut[0], T.modalOut[1]);
  const typedRaw = interpolate(frame, [T.typing[0], T.typing[1]], [0, 7.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const termT = remap(frame, TERM_SEGMENTS);

  return {
    // intro
    markAssemble: prog(frame, T.markAssemble[0], T.markAssemble[1]),
    wordmark: prog(frame, T.wordmark[0], T.wordmark[1]),
    introOpacity: 1 - prog(frame, 100, 118),
    portalIn: prog(frame, 50, 74),
    // page states
    showOverview: frame < 170,
    showReimage: frame >= T.pageSwitch[0] - 2 && frame < 620,
    showInstall: frame >= 468 && frame < 620,
    pageSwitch: prog(frame, T.pageSwitch[0], T.pageSwitch[1], easeInOut),
    reimageHover: prog(frame, T.reimageHover[0], T.reimageHover[1]),
    reimagePress: pressAmt(frame, { at: T.clickReimage }),
    tabSwitch: prog(frame, T.tabSwitch[0], T.tabSwitch[1], easeInOut),
    scrollY,
    lifts,
    selectPress: pressAmt(frame, { at: T.clickSelect }),
    // modal
    modalMounted: frame >= T.modalIn[0] - 2 && frame <= T.modalOut[1] + 4,
    backdrop: prog(frame, T.modalIn[0], T.modalIn[0] + 12) * modalLife,
    pop: prog(frame, T.modalIn[0] + 2, T.modalIn[1], backOut) * modalLife,
    typed: Math.min(7, Math.floor(typedRaw)),
    caretOn:
      frame >= T.clickInput &&
      frame <= T.modalOut[0] &&
      Math.floor(frame / 9) % 2 === 0,
    proceedEnabled: prog(frame, T.proceedEnable[0], T.proceedEnable[1]),
    proceedPress: pressAmt(frame, { at: T.clickProceed }),
    // install
    installProgress: prog(frame, T.install[0], T.install[1], easeInOut),
    // terminal
    termMounted: frame >= 540 && frame <= T.morph[1] + 2,
    termT,
    morphScale: interpolate(frame, [T.morph[0], T.morph[1]], [1, 0.34], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    }),
    morphFade: 1 - prog(frame, 896, 914),
    // payoff
    payoffMounted: frame >= 878,
    reveal: prog(frame, T.reveal[0], T.reveal[1], easeInOut),
    payoffT: Math.max(0, frame - T.reveal[0]),
    // cursor
    cursor: cursorAt(frame, GLIDES),
    cursorOpacity:
      prog(frame, T.cursorIn[0], T.cursorIn[1]) *
      (1 - prog(frame, T.cursorFade[0], T.cursorFade[1])),
    press: CLICKS.reduce((m, c) => Math.max(m, pressAmt(frame, c)), 0),
    ripple: CLICKS.reduce((m, c) => Math.max(m, rippleAmt(frame, c)), 0),
  };
};

// ---- cameras ----------------------------------------------------------------------
const A = ANCHOR;

export const CAM_V: CamKey[] = [
  { f: 0, x: 1005, y: 400, z: 2.05 },
  { f: 34, x: 1005, y: 400, z: 2.05 },
  { f: 52, x: 1396, y: 360, z: 0.85 },
  { f: 66, x: 1396, y: 360, z: 0.85 },
  { f: 88, x: A.portalCenter.x, y: A.portalCenter.y, z: 0.6 },
  { f: 108, x: A.portalCenter.x, y: A.portalCenter.y, z: 0.6 },
  { f: 126, x: A.reimageBtn.x - 77, y: A.reimageBtn.y + 3, z: 1.3 },
  { f: 150, x: A.reimageBtn.x - 77, y: A.reimageBtn.y + 3, z: 1.3 },
  { f: 170, x: 1000, y: 1150, z: 0.72 },
  { f: 178, x: 850, y: 950, z: 1.12 },
  { f: 196, x: 850, y: 950, z: 1.12 },
  { f: 218, x: 1000, y: 1226, z: 0.62 },
  { f: 298, x: 1000, y: 1238, z: 0.635 },
  { f: 318, x: 1182, y: HERMES_SELECT.y, z: 0.92 },
  { f: 336, x: 1182, y: HERMES_SELECT.y, z: 0.92 },
  { f: 354, x: 1150, y: 1235, z: 1.28 },
  { f: 430, x: 1150, y: 1235, z: 1.28 },
  { f: 448, x: 1215, y: 1350, z: 1.38 },
  { f: 468, x: 1215, y: 1350, z: 1.38 },
  { f: 490, x: 1150, y: 1228, z: 0.76 },
  { f: 566, x: 1150, y: 1228, z: 0.82 },
  { f: 582, x: 1150, y: 1228, z: 0.82 },
  { f: 594, x: 2135, y: 1178, z: 0.56 },
  { f: 606, x: A.termCenter.x, y: 1175, z: 0.74 },
  { f: 746, x: A.termCenter.x, y: 1175, z: 0.74 },
  { f: 760, x: 2850, y: 1265, z: 1.02 },
  { f: 788, x: 2850, y: 1265, z: 1.02 },
  { f: 806, x: A.termCenter.x, y: 1000, z: 0.84 },
  { f: 880, x: A.termCenter.x, y: 1000, z: 0.84 },
  { f: 940, x: A.server.x, y: A.server.y, z: 0.7 },
  { f: 1020, x: A.server.x, y: A.server.y, z: 0.7 },
  { f: 1050, x: A.server.x, y: A.server.y, z: 0.7 },
];

export const CAM_H: CamKey[] = [
  { f: 0, x: 1005, y: 395, z: 2.2 },
  { f: 34, x: 1005, y: 395, z: 2.2 },
  { f: 52, x: 1396, y: 350, z: 1.3 },
  { f: 66, x: 1396, y: 350, z: 1.3 },
  { f: 88, x: A.portalCenter.x, y: A.portalCenter.y, z: 0.85 },
  { f: 108, x: A.portalCenter.x, y: A.portalCenter.y, z: 0.85 },
  { f: 126, x: A.reimageBtn.x - 60, y: A.reimageBtn.y + 3, z: 1.5 },
  { f: 150, x: A.reimageBtn.x - 60, y: A.reimageBtn.y + 3, z: 1.5 },
  { f: 170, x: 1000, y: 1165, z: 0.92 },
  { f: 178, x: 880, y: 970, z: 1.28 },
  { f: 196, x: 880, y: 970, z: 1.28 },
  { f: 218, x: 1000, y: 1226, z: 0.85 },
  { f: 298, x: 1000, y: 1234, z: 0.87 },
  { f: 318, x: 1182, y: HERMES_SELECT.y, z: 1.3 },
  { f: 336, x: 1182, y: HERMES_SELECT.y, z: 1.3 },
  { f: 354, x: 1150, y: 1232, z: 1.45 },
  { f: 430, x: 1150, y: 1232, z: 1.45 },
  { f: 448, x: 1245, y: 1345, z: 1.6 },
  { f: 468, x: 1245, y: 1345, z: 1.6 },
  { f: 490, x: 1150, y: 1228, z: 0.98 },
  { f: 566, x: 1150, y: 1228, z: 1.04 },
  { f: 582, x: 1150, y: 1228, z: 1.04 },
  { f: 594, x: 2135, y: 1178, z: 0.7 },
  { f: 606, x: A.termCenter.x, y: 1175, z: 0.95 },
  { f: 746, x: A.termCenter.x, y: 1175, z: 0.95 },
  { f: 760, x: 2860, y: 1268, z: 1.25 },
  { f: 788, x: 2860, y: 1268, z: 1.25 },
  { f: 806, x: A.termCenter.x, y: 1120, z: 1.0 },
  { f: 880, x: A.termCenter.x, y: 1120, z: 1.0 },
  { f: 940, x: A.server.x, y: A.server.y, z: 0.72 },
  { f: 1020, x: A.server.x, y: A.server.y, z: 0.72 },
  { f: 1050, x: A.server.x, y: A.server.y, z: 0.72 },
];
