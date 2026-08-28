import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
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
// BgP3RunableGrow — 1080x1920 @ 30fps — 330 frames
// 0:09 REVEAL  [9:16]
// VO: "Here's how to do it by yourself easily. This is Runable, an AI agent
//      that builds almost anything. They just launched Runable Grow, and it
//      runs ads now. Even inside ChatGPT."
//
// WORLD: Merydian dark (MRD.bg + MRD_GRADIENT.ground + green streaks + the
// faint vertical rule grid). Runable's real interface keeps its own warm
// near-white and floats as LIGHT fragments on that ground. Nothing Runable is
// recoloured green — the green is world lighting only.
//
// ONE continuous world, one keyframed camera travelling DOWN through it:
//   world y  118 –  262  the official Runable light lockup (runable-light.svg)
//   world y 1180 – 1490  a cropped fragment of the Build composer chip rack
//   world y 2080 – 3436  the app top bar, which GROWS into the Grow surface
//
// CAMERA (hold -> move -> hold, Easing.inOut(cubic)):
//   0–52     HOLD  the lockup is ALREADY arriving at frame 0, bloom breathing
//   52–70    MOVE  (18f) travel down off the lockup
//   70–124   HOLD  the six real Build capability chips land in staggered waves
//   124–142  MOVE  (18f) travel down onto the Build|Grow control
//   142–172  HOLD  cursor presses Grow at 152, the pill SLIDES, green ripple
//   172–192  MOVE  (20f) pull back while the top bar EXPANDS into the whole
//                  Grow surface — one surface growing, not a scene change.
//                  The surface is its own clip mask, so it UNCOVERS the page.
//   192–236  HOLD  heading / composer / Running Ads cards / the five real Grow
//                  sections finish in staggered waves
//   236–258  MOVE  (22f) push in onto the ChatGPT Ads card (track leads dolly)
//   258–306  HOLD  the "Runable Managed" badge registers
//   306–330  SETTLE (24f micro pull-back, two near-identical keys)
//
// 5% SIDE MARGIN: every zoom is clamped by safePadX(width); the chip fragment
// carries a fitGate so it is only lit while its full width fits inside
// x = 54..1026; and the final track leads the dolly so the surface's left edge
// never crosses 54. Verified frame-by-frame on the render: zero bright pixels
// in either 54px strip for frames 0–239. From 240 the surface deliberately
// bleeds off the RIGHT edge for the push-in — every label, icon and the badge
// still sit inside 54..1026, and the frame edges land in the gutters BETWEEN
// real cards so nothing is ever cropped mid-word.
//
// No on-screen text restates the narration; every string is verbatim Runable UI
// from theme `UI` or from public/bgrow/capture/01-build-home.png +
// 02-grow-home.png. "Free plan / Upgrade" and "Get the App" (DO_NOT_RENDER) are
// never drawn. Runable's UI keeps its own RN tokens — the green is world light
// on the ground behind and beside the surface, never on the product.
// ===========================================================================

export const DURATION_IN_FRAMES = 330;

// ------------------------------------------------------------ world geometry
const WX = 540; // world centre line

// -- station A : the official light lockup (runable-light.svg is 3534x818)
const LOGO_W = 620;
const LOGO_H = Math.round((LOGO_W * 818) / 3534); // 144
const LOGO_CY = 190;
const LOGO_X = WX - LOGO_W / 2; // 230
const LOGO_Y = LOGO_CY - LOGO_H / 2; // 118

// -- station B : cropped fragment of the Build composer chip rack
const PLATE_W = 900;
const PLATE_H = 310;
const PLATE_X = WX - PLATE_W / 2; // 90
const PLATE_Y = 1180;
const PLATE_CY = PLATE_Y + PLATE_H / 2; // 1335
const CHIP_H = 80;
const ROW1_Y = PLATE_Y + 88; // 1268
const ROW2_Y = PLATE_Y + 188; // 1368

// -- station C/D/E : the app surface. Starts as the top-bar fragment (SEED),
//    then GROWS into the full Grow window. Same element, one continuous move.
const WIN_W = 940;
const WIN_H = 1356;
const WIN_X = WX - WIN_W / 2; // 70
const WIN_Y = 2080;

const SEED_W = 420;
const SEED_H = 142;
const SEED_X = WX - SEED_W / 2; // 330

// toggle (world coords, always on top of the surface)
const TG_W = 300;
const TG_H = 64;
const TG_X = WX - TG_W / 2; // 390
const TG_Y = WIN_Y + 39; // 2119
const TG_CY = TG_Y + TG_H / 2; // 2151
const KNOB_W = 146;
const KNOB_H = 54;
const KNOB_PAD = 5;

// window-local content coords (children of the clip layer at WIN_X/WIN_Y)
const L_HEAD_CY = 230;
const L_COMP_X = 40;
const L_COMP_Y = 300;
const L_COMP_W = 860;
const L_COMP_H = 160;
const L_SEC_X = 40;
const L_SEC_Y = 520;
const L_SEC_W = 860;
const L_SEC_H = 372;

// Running Ads is the open section; the other four real Grow sections sit under
// it as collapsed accordion rows (the live UI gives every section a chevron).
const SEC_COLLAPSED_H = 88;
const SECTIONS: { title: string; y: number; h: number; open: boolean }[] = [
  { title: UI.sections[0], y: L_SEC_Y, h: L_SEC_H, open: true },
  { title: UI.sections[1], y: 910, h: SEC_COLLAPSED_H, open: false },
  { title: UI.sections[2], y: 1016, h: SEC_COLLAPSED_H, open: false },
  { title: UI.sections[3], y: 1122, h: SEC_COLLAPSED_H, open: false },
  { title: UI.sections[4], y: 1228, h: SEC_COLLAPSED_H, open: false },
];

const SEC_PAD = 20;
const CARD_W = 264;
const CARD_H = 130;
const CARD_GAP = 14;
const L_COL_X = [
  L_SEC_X + SEC_PAD, // 60
  L_SEC_X + SEC_PAD + CARD_W + CARD_GAP, // 338
  L_SEC_X + SEC_PAD + (CARD_W + CARD_GAP) * 2, // 616
];
const L_ROW_Y = [L_SEC_Y + 78, L_SEC_Y + 78 + CARD_H + CARD_GAP]; // 598, 742

// the hero: ChatGPT Ads card centre line, in WORLD coords
const HERO_CY = WIN_Y + L_ROW_Y[0] + CARD_H / 2; // 2743

// ------------------------------------------------------------- brand colours
// Authentic marks only. These are the platforms' own colours as they render on
// the real Running Ads cards in public/bgrow/capture/02-grow-home.png.
const PLATFORM = {
  openai: "#202020",
  meta: "#0082FB",
  googleBlue: "#4285F4",
  googleYellow: "#FBBC04",
  googleGreen: "#34A853",
  linkedin: "#0A66C2",
  tiktok: "#010101",
  ttCyan: "#25F4EE",
  ttRed: "#FE2C55",
} as const;

const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

// ------------------------------------------------------------------- icons
const Line: React.FC<{
  size: number;
  color?: string;
  w?: number;
  children: React.ReactNode;
}> = ({ size, color = RN.textWarm, w = 1.7, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

// Build-tab capability chips — the six real ones on 01-build-home.png.
type ChipKey =
  | "websites"
  | "slides"
  | "report"
  | "sheets"
  | "workflows"
  | "apps";

const ChipIcon: React.FC<{ name: ChipKey; active: boolean }> = ({
  name,
  active,
}) => {
  const c = active ? RN.cyan : RN.textWarm;
  switch (name) {
    case "websites":
      // the selected chip carries a dismiss glyph in the live UI
      return (
        <Line size={24} color={c} w={2}>
          <path d="M6 6l12 12M18 6L6 18" />
        </Line>
      );
    case "slides":
      return (
        <Line size={26} color={c}>
          <rect x="2.6" y="4.2" width="18.8" height="13" rx="2.2" />
          <path d="M12 17.2v2.6M8.6 19.8h6.8" />
        </Line>
      );
    case "report":
      return (
        <Line size={26} color={c}>
          <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3" />
          <path d="M8.2 15.6v-3.2M12 15.6V8.6M15.8 15.6v-5" />
        </Line>
      );
    case "sheets":
      return (
        <Line size={26} color={c}>
          <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3" />
          <path d="M3.4 9.4h17.2M9.6 9.4v11.2" />
        </Line>
      );
    case "workflows":
      return (
        <Line size={26} color={c}>
          <circle cx="5.6" cy="6" r="2.4" />
          <circle cx="5.6" cy="18" r="2.4" />
          <circle cx="18.4" cy="12" r="2.4" />
          <path d="M8 6.9c4 1.2 4.6 2.6 8 4.4M8 17.1c4-1.2 4.6-2.6 8-4.4" />
        </Line>
      );
    case "apps":
      return (
        <Line size={26} color={c}>
          <rect x="6.6" y="2.6" width="10.8" height="18.8" rx="2.6" />
          <path d="M11 5.4h2" />
        </Line>
      );
  }
};

const TikTokMark: React.FC<{ size: number }> = ({ size }) => {
  const note =
    "M13.7 3.1v10.5a2.85 2.85 0 1 1-2.5-2.83v2.35a.62.62 0 1 0 .62.62V3.1zM13.7 3.1c.35 2.4 1.9 3.9 4.4 4.15v2.5c-1.7-.05-3.2-.6-4.4-1.55z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
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
};

type AdKey = "openai" | "meta" | "google" | "linkedin" | "tiktok";

const AdIcon: React.FC<{ name: AdKey; size: number }> = ({ name, size }) => {
  switch (name) {
    case "openai":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d={OPENAI_PATH} fill={PLATFORM.openai} />
        </svg>
      );
    case "meta":
      // Meta's mark is genuinely wide-and-short; drawn a touch larger so it
      // reads at the same optical weight as the other platform marks.
      return (
        <svg width={size * 1.34} height={size * 1.34} viewBox="0 0 24 24">
          <path
            d="M12 12.2C10.1 8.6 8.5 6.7 6.4 6.7 4.1 6.7 2.6 9 2.6 12s1.5 5.3 3.8 5.3c2.3 0 3.9-2.3 5.6-5.1 1.7-2.8 3.3-5.1 5.6-5.1 2.3 0 3.8 2.3 3.8 5.3s-1.5 5.3-3.8 5.3c-2.1 0-3.7-1.9-5.6-5.5Z"
            fill="none"
            stroke={PLATFORM.meta}
            strokeWidth={2.1}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "google":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
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
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="4.6"
            fill={PLATFORM.linkedin}
          />
          <rect x="6.1" y="9.7" width="2.7" height="8.3" fill="#FFFFFF" />
          <circle cx="7.45" cy="6.9" r="1.62" fill="#FFFFFF" />
          <path
            d="M11.1 18V9.7h2.55v1.15c.5-.85 1.5-1.4 2.75-1.4 2 0 3.2 1.3 3.2 3.6V18h-2.65v-4.4c0-1.2-.5-1.9-1.6-1.9s-1.75.8-1.75 2V18z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case "tiktok":
      return <TikTokMark size={size} />;
  }
};

const Chevron: React.FC = () => (
  <Line size={26} color={RN.muted} w={1.9}>
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </Line>
);

// -------------------------------------------------------------------- data
// Chip labels + order are verbatim from public/bgrow/capture/01-build-home.png
// (the "Features in Agent mode" rack under the Build composer).
const CHIPS: { label: string; icon: ChipKey; active: boolean }[] = [
  { label: "Websites", icon: "websites", active: true },
  { label: "Slides", icon: "slides", active: false },
  { label: "Report", icon: "report", active: false },
  { label: "Sheets", icon: "sheets", active: false },
  { label: "Workflows", icon: "workflows", active: false },
  { label: "Apps", icon: "apps", active: false },
];
const CHIP_RACK_LABEL = "Features in Agent mode"; // verbatim, same screenshot

// Running Ads cards, verbatim from UI.runningAds + 02-grow-home.png.
const AD_CARDS: { label: string; icon: AdKey; badge?: string }[] = [
  { label: UI.runningAds[0], icon: "openai", badge: UI.managedBadge },
  { label: UI.runningAds[1], icon: "meta" },
  { label: UI.runningAds[2], icon: "google" },
  { label: UI.runningAds[3], icon: "linkedin" },
  { label: UI.runningAds[4], icon: "tiktok" },
];

// ------------------------------------------------------------------ the comp
export const BgP3RunableGrow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ---- ID Grotesk (Runable's real typeface) ------------------------------
  const [fontHandle] = useState(() => delayRender("BgP3 IDGrotesk"));
  useEffect(() => {
    const ID = "bgp3-idgrotesk-faces";
    if (!document.getElementById(ID)) {
      const el = document.createElement("style");
      el.id = ID;
      el.textContent = idGroteskFaces(staticFile);
      document.head.appendChild(el);
    }
    const done = () => continueRender(fontHandle);
    Promise.all([
      document.fonts.load('350 40px "IDGrotesk"'),
      document.fonts.load('400 40px "IDGrotesk"'),
      document.fonts.load('500 40px "IDGrotesk"'),
    ])
      .then(done)
      .catch(done);
  }, [fontHandle]);

  // ---- 5% side safe margin drives every zoom -----------------------------
  const SAFE = safePadX(width); // 54 on 1080
  const innerW = width - SAFE * 2; // 972
  const fit = (objectWidth: number, want: number) =>
    Math.min(want, innerW / objectWidth);

  const Z_LOGO = fit(LOGO_W, 1.3);
  const Z_CHIPS = fit(PLATE_W, 1.0);
  const Z_SEED = fit(SEED_W, 1.95);
  const Z_WIN = fit(WIN_W, 1.0);
  const Z_HERO = fit(CARD_W, 1.62);

  // The push-in is framed so the frame edges land in the gutters BETWEEN real
  // cards — nothing is ever cropped mid-word. Right edge sits in the gap after
  // Meta Ads; top edge sits on blank surface just under the heading.
  const E_RIGHT_EDGE = WIN_X + L_COL_X[2] - CARD_GAP / 2; // world x 679
  const E_FX = E_RIGHT_EDGE - width / (2 * Z_HERO);
  const E_FY = 2950;

  // ---- camera ------------------------------------------------------------
  const ease = Easing.inOut(Easing.cubic);
  const KEY_T = [0, 52, 70, 124, 142, 172, 192, 236, 258, 306, 330];
  const cam = (vals: number[]) =>
    interpolate(frame, KEY_T, vals, {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const D_FY = WIN_Y + WIN_H / 2; // 2758 — the whole Grow surface

  // The track LEADS the dolly by 6 frames: if the zoom ran ahead of the pan the
  // surface's left edge would clip the 5% margin mid-move. Nothing else moves
  // horizontally, so fx is flat at the world centre until the push-in.
  const fx = interpolate(
    frame,
    [0, 236, 252, DURATION_IN_FRAMES],
    [WX, WX, E_FX, E_FX],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const fy = cam([
    LOGO_CY,
    LOGO_CY,
    PLATE_CY,
    PLATE_CY,
    TG_CY,
    TG_CY,
    D_FY,
    D_FY,
    E_FY,
    E_FY,
    E_FY - 2,
  ]);
  const z = cam([
    Z_LOGO,
    Z_LOGO,
    Z_CHIPS,
    Z_CHIPS,
    Z_SEED,
    Z_SEED,
    Z_WIN,
    Z_WIN,
    Z_HERO,
    Z_HERO,
    Z_HERO * 0.983,
  ]);

  // ---- a) logo arrival ---------------------------------------------------
  // Opens ALREADY MOVING (spring pre-rolled 9 frames) so frame 0 is never a
  // bare #0A0A0A ground — the lockup and its bloom are lit from the first frame.
  const logoIn = spring({
    frame: frame + 9,
    fps,
    config: SPRINGS.heavy,
    durationInFrames: 30,
  });
  const logoOut = interpolate(frame, [52, 74], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * 1.35 * Math.PI);
  const logoGlow = logoIn * logoOut * (0.55 + 0.45 * breathe);

  // ---- b) chip rack ------------------------------------------------------
  // 5% safe-margin gate (same pattern as RgP4RunableGrow): the chip fragment is
  // only lit while its full width fits inside x = SAFE..width-SAFE. It rises as
  // the camera settles onto it and falls away as the camera pushes past — so no
  // frame ever shows it touching the outer 5%.
  const marginLimit = width / 2 - SAFE; // 486 on 1080
  const chipFit = interpolate(
    (PLATE_W / 2) * z,
    [marginLimit * 0.95, marginLimit * 0.995],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const plateIn =
    chipFit *
    spring({
      frame: frame - 54,
      fps,
      config: SPRINGS.smooth,
      durationInFrames: 20,
    });
  const rackLabelIn =
    chipFit *
    spring({
      frame: frame - 62,
      fps,
      config: SPRINGS.smooth,
      durationInFrames: 16,
    });

  // ---- c) the flip -------------------------------------------------------
  const seedIn = spring({
    frame: frame - 124,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 20,
  });
  const FLIP = 152;
  const knob = spring({ frame: frame - FLIP, fps, config: SPRINGS.snappy });
  const knobX = interpolate(knob, [0, 1], [KNOB_PAD, TG_W - KNOB_W - KNOB_PAD]);
  const buildDim = interpolate(knob, [0, 1], [1, 0.42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const growDim = interpolate(knob, [0, 1], [0.42, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // cursor travels in, presses at FLIP, lifts away
  const cursorIn = interpolate(frame, [138, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorOut = interpolate(frame, [FLIP + 6, FLIP + 22], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const press = interpolate(frame, [FLIP - 3, FLIP, FLIP + 5], [0, 7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY =
    TG_CY + 34 + (1 - cursorIn) * 70 + press - (1 - cursorOut) * 26;

  // green impact ripple on the dark ground, behind the surface
  const ring = interpolate(frame, [FLIP, FLIP + 30], [0.28, 1.7], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOp = interpolate(frame, [FLIP, FLIP + 7, FLIP + 32], [0, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- c->d) the top bar GROWS into the Grow surface ---------------------
  // The surface itself is the clip mask, so the page is UNCOVERED by the plate
  // growing — never a blank white slab waiting for content.
  const grow = spring({
    frame: frame - 176,
    fps,
    config: { damping: 24, stiffness: 96 },
    durationInFrames: 30,
  });
  const plateX = interpolate(grow, [0, 1], [SEED_X, WIN_X]);
  const plateW = interpolate(grow, [0, 1], [SEED_W, WIN_W]);
  const plateH = interpolate(grow, [0, 1], [SEED_H, WIN_H]);

  const headIn = spring({
    frame: frame - 178,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 16,
  });
  const compIn = spring({
    frame: frame - 181,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 16,
  });

  // ---- e) payoff ---------------------------------------------------------
  const badgeIn = spring({
    frame: frame - 262,
    fps,
    config: SPRINGS.bouncy,
    durationInFrames: 22,
  });
  const heroLift = interpolate(frame, [240, 268], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rimGlow =
    interpolate(frame, [236, 266], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    (0.6 + 0.4 * breathe);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: MRD.bg,
        fontFamily: FONT_RUNABLE,
      }}
    >
      {/* ---- opaque Merydian ground, full bleed, every frame ------------- */}
      <AbsoluteFill style={{ backgroundImage: MRD_GRADIENT.ground }} />

      {/* Merydian's top light bleed. Also keeps the ground clear of the
          blackdetect floor — #0A0A0A on its own reads as a black frame. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.030) 38%, rgba(255,255,255,0.014) 70%, rgba(255,255,255,0.008) 100%)",
        }}
      />

      {/* ---- Merydian light streaks bleeding from the top --------------- */}
      {[
        { x: 0.13, w: 150, o: 0.55 },
        { x: 0.36, w: 96, o: 0.34 },
        { x: 0.62, w: 190, o: 0.5 },
        { x: 0.86, w: 110, o: 0.3 },
      ].map((s, i) => (
        <div
          key={`streak-${i}`}
          style={{
            position: "absolute",
            left: s.x * width - s.w / 2,
            top: -120,
            width: s.w,
            height: height * 0.72,
            backgroundImage: MRD_GRADIENT.streak,
            opacity:
              s.o *
              (0.72 +
                0.28 * Math.sin((frame / fps) * 0.55 * Math.PI + i * 1.7)),
            filter: "blur(26px)",
          }}
        />
      ))}

      {/* ---- camera ----------------------------------------------------- */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            transform: `translate(${width / 2 - fx}px, ${
              height / 2 - fy
            }px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          {/* faint vertical rule grid, parallaxing with the camera */}
          <div
            style={{
              position: "absolute",
              left: -1400,
              top: -900,
              width: 3900,
              height: 5400,
              backgroundImage: `repeating-linear-gradient(90deg, ${MRD_GRID.color} 0px, ${MRD_GRID.color} 1px, transparent 1px, transparent ${MRD_GRID.spacing}px)`,
            }}
          />

          {/* ================================================ a) the lockup */}
          <div
            style={{
              position: "absolute",
              left: WX - 480,
              top: LOGO_CY - 380,
              width: 960,
              height: 760,
              borderRadius: 480,
              background: `radial-gradient(closest-side, ${MRD.greenGlow} 0%, rgba(0,255,171,0.07) 45%, rgba(0,255,171,0) 72%)`,
              opacity: logoGlow * 0.9,
              transform: `scale(${0.86 + 0.14 * logoIn})`,
            }}
          />
          <Img
            src={staticFile(BRAND.runableLight)}
            style={{
              position: "absolute",
              left: LOGO_X,
              top: LOGO_Y,
              width: LOGO_W,
              height: LOGO_H,
              opacity: interpolate(logoIn, [0, 0.35], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }) * logoOut,
              transform: `translateY(${(1 - logoIn) * 26}px) scale(${
                0.94 + 0.06 * logoIn
              })`,
              transformOrigin: "center center",
            }}
          />

          {/* ========================================== b) Build chip rack */}
          <div
            style={{
              position: "absolute",
              left: PLATE_X,
              top: PLATE_Y,
              width: PLATE_W,
              height: PLATE_H,
              borderRadius: 30,
              backgroundColor: RN.bg,
              border: `1px solid ${RN.border}`,
              boxShadow: MRD.panelShadow,
              opacity: plateIn,
              transform: `translateY(${(1 - plateIn) * 26}px) scale(${
                0.975 + 0.025 * plateIn
              })`,
              transformOrigin: `${PLATE_W / 2}px ${PLATE_H / 2}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: PLATE_X + 46,
              top: PLATE_Y + 34,
              width: PLATE_W - 92,
              whiteSpace: "nowrap",
              fontSize: 26,
              fontWeight: 400,
              color: RN.muted,
              letterSpacing: "-0.1px",
              opacity: rackLabelIn,
              transform: `translateY(${(1 - rackLabelIn) * 10}px)`,
            }}
          >
            {CHIP_RACK_LABEL}
          </div>
          {[0, 1].map((rowIdx) => (
            <div
              key={`chiprow-${rowIdx}`}
              style={{
                position: "absolute",
                left: PLATE_X,
                top: rowIdx === 0 ? ROW1_Y : ROW2_Y,
                width: PLATE_W,
                height: CHIP_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
              }}
            >
              {CHIPS.slice(rowIdx * 3, rowIdx * 3 + 3).map((c, i) => {
                const order = rowIdx * 3 + i;
                const t = spring({
                  frame: frame - (66 + order * 5),
                  fps,
                  config: { damping: 19, stiffness: 190 },
                  durationInFrames: 22,
                });
                return (
                  <div
                    key={c.label}
                    style={{
                      height: CHIP_H,
                      borderRadius: CHIP_H / 2,
                      padding: "0 30px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: c.active ? RN.cyanSoft : RN.card,
                      border: `1px solid ${
                        c.active ? "rgba(0,185,204,0.26)" : RN.borderStrong
                      }`,
                      color: c.active ? RN.cyan : RN.text,
                      fontSize: 32,
                      fontWeight: 400,
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                      opacity:
                        chipFit *
                        interpolate(t, [0, 0.4], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                      transform: `translateY(${(1 - t) * 22}px) scale(${
                        0.9 + 0.1 * t
                      })`,
                    }}
                  >
                    <ChipIcon name={c.icon} active={c.active} />
                    <span>{c.label}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* ============================== c/d/e) the Runable app surface */}

          {/* green world light behind the surface — never ON the UI */}
          <div
            style={{
              position: "absolute",
              left: WX - 620,
              top: TG_CY - 460,
              width: 1240,
              height: 920,
              borderRadius: 620,
              background: `radial-gradient(closest-side, rgba(0,255,171,0.26) 0%, rgba(0,255,171,0.06) 48%, rgba(0,255,171,0) 74%)`,
              opacity:
                seedIn *
                interpolate(frame, [FLIP, FLIP + 14, 240], [0.35, 1, 0.18], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
            }}
          />

          {/* impact ring from the flip */}
          <div
            style={{
              position: "absolute",
              left: WX - 300,
              top: TG_CY - 300,
              width: 600,
              height: 600,
              borderRadius: 300,
              border: `3px solid ${MRD.green}`,
              opacity: ringOp,
              transform: `scale(${ring})`,
            }}
          />

          {/* payoff rim light on the dark ground beside the hero card */}
          <div
            style={{
              position: "absolute",
              left: WIN_X - 363,
              top: HERO_CY - 330,
              width: 660,
              height: 660,
              borderRadius: 330,
              background: `radial-gradient(closest-side, rgba(0,255,171,0.30) 0%, rgba(0,255,171,0.07) 50%, rgba(0,255,171,0) 76%)`,
              opacity: rimGlow,
            }}
          />

          {/* the surface: top-bar fragment that GROWS into the whole window.
              It is also the clip mask, so the Grow page is revealed by the
              surface expanding over it. */}
          <div
            style={{
              position: "absolute",
              left: plateX,
              top: WIN_Y,
              width: plateW,
              height: plateH,
              borderRadius: 34,
              backgroundColor: RN.bg,
              border: `1px solid ${RN.border}`,
              boxShadow: MRD.panelShadow,
              overflow: "hidden",
              opacity: seedIn,
              transform: `translateY(${(1 - seedIn) * 30}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: WIN_X - plateX,
                top: 0,
                width: WIN_W,
                height: WIN_H,
              }}
            >
            {/* heading */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: L_HEAD_CY - 40,
                width: WIN_W,
                textAlign: "center",
                fontSize: 58,
                lineHeight: "72px",
                fontWeight: 400,
                letterSpacing: "-0.8px",
                color: RN.textWarm,
                opacity: headIn,
                transform: `translateY(${(1 - headIn) * 22}px)`,
              }}
            >
              {UI.growHeading}
            </div>

            {/* composer */}
            <div
              style={{
                position: "absolute",
                left: L_COMP_X,
                top: L_COMP_Y,
                width: L_COMP_W,
                height: L_COMP_H,
                borderRadius: 26,
                backgroundColor: RN.panel,
                border: `1px solid ${RN.border}`,
                opacity: compIn,
                transform: `translateY(${(1 - compIn) * 18}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: 26,
                  fontSize: 32,
                  fontWeight: 400,
                  color: RN.muted,
                  letterSpacing: "-0.3px",
                }}
              >
                {UI.growPlaceholder}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 26,
                  bottom: 22,
                  width: L_COMP_W - 52,
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Line size={30} color={RN.muted} w={1.9}>
                  <path d="M12 5.4v13.2M5.4 12h13.2" />
                </Line>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 27,
                      color: RN.textWarm,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    Auto
                  </span>
                  <Line size={22} color={RN.muted} w={1.9}>
                    <path d="M6.5 9.5 12 15l5.5-5.5" />
                  </Line>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: RN.card,
                      border: `1px solid ${RN.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Line size={24} color={RN.text} w={1.8}>
                      <rect x="9" y="2.8" width="6" height="11.4" rx="3" />
                      <path d="M5.4 11.6a6.6 6.6 0 0 0 13.2 0M12 18.2v3" />
                    </Line>
                  </div>
                </div>
              </div>
            </div>

            {/* the five real Grow sections; Running Ads is the open one */}
            {SECTIONS.map((s, i) => {
              const t = spring({
                frame: frame - (180 + i * 3),
                fps,
                config: SPRINGS.smooth,
                durationInFrames: 16,
              });
              return (
                <div
                  key={s.title}
                  style={{
                    position: "absolute",
                    left: L_SEC_X,
                    top: s.y,
                    width: L_SEC_W,
                    height: s.h,
                    borderRadius: 26,
                    backgroundColor: RN.panel,
                    border: `1px solid ${RN.border}`,
                    opacity: t,
                    transform: `translateY(${(1 - t) * 20}px)`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: SEC_PAD,
                      top: SEC_PAD,
                      width: L_SEC_W - SEC_PAD * 2,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 34,
                        fontWeight: 400,
                        color: s.open ? RN.textWarm : RN.muted,
                        letterSpacing: "-0.4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.title}
                    </span>
                    <Chevron />
                  </div>
                </div>
              );
            })}

            {/* the five real Running Ads cards */}
            {AD_CARDS.map((c, i) => {
              const col = i % 3;
              const row = i < 3 ? 0 : 1;
              const t = spring({
                frame: frame - (185 + i * 3),
                fps,
                config: { damping: 20, stiffness: 185 },
                durationInFrames: 20,
              });
              const hero = i === 0;
              return (
                <div
                  key={c.label}
                  style={{
                    position: "absolute",
                    left: L_COL_X[col],
                    top: L_ROW_Y[row],
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 18,
                    backgroundColor: RN.card,
                    border: `1px solid ${
                      hero
                        ? `rgba(0,0,0,${0.05 + 0.07 * heroLift})`
                        : RN.border
                    }`,
                    boxShadow: hero
                      ? `0 ${2 + 10 * heroLift}px ${
                          6 + 26 * heroLift
                        }px rgba(23,20,14,${0.04 + 0.09 * heroLift})`
                      : "0 1px 2px rgba(23,20,14,0.04)",
                    opacity: interpolate(t, [0, 0.4], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    transform: `translateY(${(1 - t) * 20}px) scale(${
                      (0.92 + 0.08 * t) * (hero ? 1 + 0.018 * heroLift : 1)
                    })`,
                    transformOrigin: "center center",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <AdIcon name={c.icon} size={34} />
                    {c.badge ? (
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 400,
                          color: RN.muted,
                          backgroundColor: RN.hover,
                          border: `1px solid ${RN.border}`,
                          borderRadius: 9,
                          padding: "4px 9px",
                          whiteSpace: "nowrap",
                          opacity: badgeIn,
                          transform: `scale(${0.82 + 0.18 * badgeIn})`,
                          transformOrigin: "100% 50%",
                        }}
                      >
                        {c.badge}
                      </span>
                    ) : null}
                  </div>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 400,
                      color: RN.text,
                      letterSpacing: "-0.3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              );
            })}
            </div>
          </div>

          {/* ------------------------------- the real Build | Grow control */}
          <div
            style={{
              position: "absolute",
              left: TG_X,
              top: TG_Y,
              width: TG_W,
              height: TG_H,
              borderRadius: TG_H / 2,
              backgroundColor: RN.panel,
              border: `1px solid ${RN.border}`,
              opacity: seedIn,
              transform: `translateY(${(1 - seedIn) * 30}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: knobX,
                top: (TG_H - KNOB_H) / 2,
                width: KNOB_W,
                height: KNOB_H,
                borderRadius: KNOB_H / 2,
                backgroundColor: RN.card,
                boxShadow: "0 2px 8px rgba(23,20,14,0.14)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: KNOB_PAD,
                top: 0,
                width: KNOB_W,
                height: TG_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                opacity: buildDim,
                color: RN.text,
              }}
            >
              <Line size={22} color={RN.text} w={1.8}>
                <rect x="3.4" y="3.4" width="7.6" height="7.6" rx="2" />
                <rect x="13" y="3.4" width="7.6" height="7.6" rx="2" />
                <rect x="3.4" y="13" width="7.6" height="7.6" rx="2" />
                <rect x="13" y="13" width="7.6" height="7.6" rx="2" />
              </Line>
              <span style={{ fontSize: 26, fontWeight: 400 }}>
                {UI.toggle[0]}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: TG_W - KNOB_W - KNOB_PAD,
                top: 0,
                width: KNOB_W,
                height: TG_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                opacity: growDim,
                color: RN.text,
              }}
            >
              <Line size={22} color={RN.text} w={2}>
                <path d="M4.6 19.4V13" />
                <path d="M11.6 19.4V8.4" />
                <path d="M18.6 19.4V4.6" />
              </Line>
              <span style={{ fontSize: 26, fontWeight: 400 }}>
                {UI.toggle[1]}
              </span>
            </div>
          </div>

          {/* cursor pressing Grow */}
          <svg
            width={42}
            height={50}
            viewBox="0 0 24 28"
            style={{
              position: "absolute",
              left: TG_X + TG_W - KNOB_W / 2 - KNOB_PAD + 8,
              top: cursorY,
              opacity: cursorIn * cursorOut,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))",
            }}
          >
            <path
              d="M3 2.2 3 20.4l4.6-4.4 3.1 7.1 3.6-1.6-3.1-7 6.2-.4z"
              fill={RN.ink}
              stroke="#FFFFFF"
              strokeWidth={1.7}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
