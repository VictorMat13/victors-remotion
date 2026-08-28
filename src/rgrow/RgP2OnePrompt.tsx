// RgP2OnePrompt — 1080x1920 @ 30fps (9:16), 180 frames (6.0s)
// VO [0:03-0:09]: "Runable's the AI agent that builds the landing page, writes
//                  the emails, and ships the posts for you. One prompt and it
//                  just goes."
//
// ONE prompt goes in at the top of the world; THREE REAL outputs bloom out of
// it below and keep producing. Everything downstream of the submit button is
// recreated from the launch plan Runable's own in-app agent published during
// the live run (theme.ts LAUNCH) and the seven images that same agent
// generated (public/rgrow/harbourlight/*.png, loaded via staticFile).
//
// The Runable composer stays vector/DOM UI (no screenshot inset) so every
// string is razor-crisp at 9:16: Build|Grow toggle, amber credit pill, "What
// needs to be done?", the real typed prompt (RUN.prompt), the Agent|Ask toggle
// with AGENT ACTIVE from frame 0 (sponsor requirement), Auto / Plan / the black
// circular submit, and the "Features in Agent mode" chip rack.
//
// SKIN — LIAM WHITE. The world is Liam's warm paper (LW.paper). Runable's app
// window keeps its authentic near-white surface (RN.bg) and its black submit
// button. The landing-page output renders in Harbourlight's OWN palette
// (LAUNCH.palette: cream / charcoal / amber) in Fraunces + Public Sans — the
// fonts the agent specified — benchmarked against Onyx Coffee Lab's grammar:
// full-bleed hero + oversized display headline, a letterspaced caps ticker, and
// product cards that carry NAME · PRICE / tasting notes / roast level.
//
// Camera (hold -> move -> hold, Easing.inOut(cubic), fx locked on the world
// axis so nothing ever crosses the 5% side margin):
//   0-46     HOLD  — the composer; the real prompt types itself, caret blinks
//   46-64    MOVE 18f — submit press, ripple, camera travels down as the world
//                       opens under it
//   64-150   HOLD  — the star beat. Three real outputs assemble in a staggered
//                    cascade: landing page (62-110), emails (96-140), posts
//                    (120-156). Camera is locked; the ACTION is the assembly.
//   150-180  END HOLD — all three settled, micro-motion only (the last email
//                       dot ticking green, ticker scrolling, image parallax);
//                       two near-identical keys for a clean editor cut.
//
// Hard rules honoured: opaque LW.paper on the OUTERMOST AbsoluteFill for frame
// 0 -> 179 (no whole-comp Sequence, no black frames); every card inside the 5%
// side margin at every zoom; all three payoff cards clear of the 9:16 top-10%
// and bottom-12% zones through the end hold; ZERO narration on screen — the
// only words are Runable's own UI strings, the user's real typed prompt, and
// the agent's own published plan strings.
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
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadPublicSans } from "@remotion/google-fonts/PublicSans";
import { FONT_SANS, GROW, LAUNCH, LW, RN, RUN, SPRINGS, safePadX } from "./theme";

export const DURATION_IN_FRAMES = 180;

// ---------------------------------------------------------------- typefaces
// Fraunces (display) + Public Sans (body) are the two faces the in-app agent
// specified for Harbourlight (LAUNCH.fonts). They are used ONLY inside the
// landing-page recreation; Runable's own UI chrome keeps FONT_SANS.
const { fontFamily: frauncesFamily } = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: publicSansFamily } = loadPublicSans("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const FONT_DISPLAY = `${frauncesFamily}, Fraunces, "Iowan Old Style", Georgia, "Times New Roman", serif`;
const FONT_BODY = `${publicSansFamily}, "Public Sans", ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;

// ------------------------------------------------------------------ easing
const ease = Easing.inOut(Easing.cubic);
const easeQ = Easing.inOut(Easing.quad);
const iv = (
  f: number,
  range: number[],
  out: number[],
  e: (t: number) => number = ease,
) =>
  interpolate(f, range, out, {
    easing: e,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ---------------------------------------------------------------- viewport
const VIEW_W = 1080;
const VIEW_H = 1920;

// The 5% side margin is the hard ceiling on how wide the app window may be at
// the closest zoom the camera ever reaches.
const Z_MAX = 1.06;
const APP_W = Math.min(880, Math.floor((VIEW_W - safePadX(VIEW_W) * 2) / Z_MAX));
const APP_X = (VIEW_W - APP_W) / 2; // 100
const APP_R = APP_X + APP_W; // 980
const APP_TOP = 600;
const APP_BOT = 1396;
const AXIS = VIEW_W / 2; // 540 — the world axis everything is centred on

// ------------------------------------------------- composer internal layout
const TOP_ROW_CY = APP_TOP + 62; // 662 — Build|Grow toggle + credit pill
const HEAD_CY = APP_TOP + 188; // 788 — "What needs to be done?"

const INPUT_X = 140;
const INPUT_W = 800;
const INPUT_TOP = 866;
const INPUT_H = 340;
const INPUT_BOT = INPUT_TOP + INPUT_H; // 1206

const TEXT_X = INPUT_X + 38; // 178
const TEXT_TOP = INPUT_TOP + 30; // 896
const TEXT_W = INPUT_W - 76; // 724
const TEXT_FS = 34;
const TEXT_LH = 46;

const ROW_H = 76;
const ROW_TOP = INPUT_BOT - 34 - ROW_H; // 1096
const ROW_CY = ROW_TOP + ROW_H / 2; // 1134
const ROW_L = INPUT_X + 38; // 178
const ROW_R = INPUT_X + INPUT_W - 38; // 902

const SUBMIT_D = 72;
const SUBMIT_X = ROW_R - SUBMIT_D; // 830
const SUBMIT_CX = SUBMIT_X + SUBMIT_D / 2; // 866

const FEAT_LABEL_CY = INPUT_BOT + 46; // 1252
const CHIPS_TOP = INPUT_BOT + 76; // 1282
const CHIP_H = 64;

// ------------------------------------------------------- output card layout
// One column down the world axis. At the payoff the camera sits at zoom 1.0,
// so world px == screen px there: 860 wide leaves 110px of margin per side
// (5% minimum is 54) and the 1434px stack lands in y 243..1677 on screen,
// clear of the 9:16 top-10% (192) and bottom-12% (1690) zones.
const OUT_W = 860;
const OUT_X = AXIS - OUT_W / 2; // 110
const OUT_R = OUT_X + OUT_W; // 970
const OUT_CX = AXIS; // 540

const A_TOP = 1680; // landing page — the star output
const A_H = 764;
const B_TOP = 2476; // the 5 welcome emails
const B_H = 240;
const C_TOP = 2748; // the week of social posts
const C_H = 366;

const A_IN = 60;
const B_IN = 96;
const C_IN = 120;

// ------------------------------------------------------------- camera keys
const KEY_T = [0, 22, 46, 64, 150, 176, 180];
const KEY_FY = [994, 1000, 1014, 2415, 2415, 2417, 2417];
const KEY_Z = [1.054, 1.052, 1.05, 1.0, 1.0, 0.999, 0.999];

// ------------------------------------------------------------------- beats
// The REAL prompt we typed into the live app (theme.ts RUN.prompt).
const PROMPT = RUN.prompt;
const TYPE_START = 2;
const TYPE_END = 38;
const SUBMIT_SWAP = 5; // mic -> black arrow, the moment the input is non-empty
const PRESS = 45;
const RUNNING = 49;

const typedCount = (f: number) =>
  Math.round(
    iv(
      f,
      [TYPE_START, 12, 22, 30, TYPE_END],
      [0, 18, 58, 98, PROMPT.length],
      Easing.linear,
    ),
  );

// cursor travels in during the type-out, lands on the black submit button
const CUR_F = [26, 36, 43, 47, 62];
const CUR_X = [604, 762, 852, 852, 852];
const CUR_Y = [1302, 1220, 1126, 1131, 1130];

// -------------------------------------------------- packets (one -> three)
// Amber packets fired out of the submit button, each landing on the top edge
// of the card it spawns. This is the causality: one prompt, three outputs.
type Packet = {
  from: number;
  to: number;
  ctrl: [number, number];
  land: [number, number];
};
const PACKETS: Packet[] = [
  { from: 47, to: A_IN, ctrl: [986, 1400], land: [OUT_CX, A_TOP] },
  { from: 84, to: B_IN, ctrl: [190, 2360], land: [OUT_CX, B_TOP] },
  { from: 108, to: C_IN, ctrl: [978, 2700], land: [OUT_CX, C_TOP] },
];

const bez = (
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number,
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
};

// ---------------------------------------------------------------- UI strings
// Verbatim Runable product copy, read straight off the light-mode reference
// captures in public/rgrow/ (build-01-composer-typed.png). Nothing invented.
const RN_UI = {
  heading: "What needs to be done?",
  placeholder: "Describe what you want Runable to build...",
  modeAgent: "Agent",
  modeAsk: "Ask",
  plan: "Plan",
  featuresLabel: "Features in Agent mode",
  features: ["Websites", "Slides", "Report", "Sheets"],
} as const;

// ------------------------------------------------- Harbourlight brand tokens
const CREAM = LAUNCH.palette.cream;
const CHAR = LAUNCH.palette.charcoal;
const AMBER = LAUNCH.palette.amber;

// Tasting notes + roast levels for the four beans the agent specified, in
// LAUNCH.products order (Ember / Lakeshore / Junction / Kensington).
const BEAN_DETAIL = [
  {
    notes: "DARK CHOCOLATE | TOFFEE | PLUM",
    roast: "ROAST LEVEL: MEDIUM DARK",
    tint: "rgba(200,118,31,0.10)",
  },
  {
    notes: "HONEY | ORANGE BLOSSOM | BLACK TEA",
    roast: "ROAST LEVEL: LIGHT",
    tint: "rgba(196,176,132,0.13)",
  },
  {
    notes: "COCOA | HAZELNUT | SOFT CARAMEL",
    roast: "ROAST LEVEL: MEDIUM",
    tint: "rgba(118,114,106,0.10)",
  },
  {
    notes: "MIXED BERRIES | JASMINE | RAW HONEY",
    roast: "ROAST LEVEL: LIGHT",
    tint: "rgba(198,110,64,0.11)",
  },
] as const;

// -------------------------------------------------------------------- icons
type IcoName =
  | "build"
  | "grow"
  | "coin"
  | "plus"
  | "agent"
  | "ask"
  | "chevron"
  | "doc"
  | "arrow"
  | "mic"
  | "websites"
  | "slides"
  | "report"
  | "sheets"
  | "mail"
  | "instagram";

const Ico: React.FC<{
  name: IcoName;
  size?: number;
  color?: string;
  sw?: number;
  style?: React.CSSProperties;
}> = ({ name, size = 26, color = RN.textWarm, sw = 1.7, style }) => {
  const c = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const body = (() => {
    switch (name) {
      case "build":
        return (
          <>
            <rect x={3.2} y={3.6} width={7.6} height={7.6} rx={2} {...c} />
            <rect x={13.2} y={3.6} width={7.6} height={5} rx={2} {...c} />
            <rect x={3.2} y={13.4} width={7.6} height={7} rx={2} {...c} />
            <rect x={13.2} y={10.8} width={7.6} height={9.6} rx={2} {...c} />
          </>
        );
      case "grow":
        return <path d="M4.5 20 V13 M11 20 V7.5 M17.5 20 V3.6" {...c} />;
      case "coin":
        return (
          <>
            <ellipse cx={12} cy={8.4} rx={8} ry={4.1} {...c} />
            <path d="M4 8.4 V14.2 A8 4.1 0 0 0 20 14.2 V8.4" {...c} />
          </>
        );
      case "plus":
        return <path d="M12 5 V19 M5 12 H19" {...c} />;
      case "agent":
        return (
          <>
            <path
              d="M6 4.5 H18 A3.5 3.5 0 0 1 21.5 8 V13.5 A3.5 3.5 0 0 1 18 17 H13.5 L9 20.5 V17 H6 A3.5 3.5 0 0 1 2.5 13.5 V8 A3.5 3.5 0 0 1 6 4.5 Z"
              {...c}
            />
            <circle cx={9} cy={10.8} r={1.35} fill={color} stroke="none" />
            <circle cx={15} cy={10.8} r={1.35} fill={color} stroke="none" />
          </>
        );
      case "ask":
        return (
          <>
            <rect x={2.8} y={4.5} width={18.4} height={12.5} rx={3} {...c} />
            <path d="M8 17 L8 20.5 L12.4 17" {...c} />
            <circle cx={8.4} cy={10.7} r={1.2} fill={color} stroke="none" />
            <circle cx={12} cy={10.7} r={1.2} fill={color} stroke="none" />
            <circle cx={15.6} cy={10.7} r={1.2} fill={color} stroke="none" />
          </>
        );
      case "chevron":
        return <path d="M6.5 9.5 L12 15 L17.5 9.5" {...c} />;
      case "doc":
        return (
          <>
            <rect x={4.5} y={3} width={13} height={18} rx={2.4} {...c} />
            <path d="M8 8 H14 M8 12 H14 M8 16 H11.5" {...c} />
            <path d="M17 16.5 L20.5 16.5 M18.8 14.8 L18.8 18.4" {...c} />
          </>
        );
      case "arrow":
        return <path d="M5.5 12 H18.5 M12.8 6.3 L18.5 12 L12.8 17.7" {...c} />;
      case "mic":
        return (
          <>
            <rect x={9} y={2.6} width={6} height={11.4} rx={3} {...c} />
            <path d="M5.2 11.6 A6.8 6.8 0 0 0 18.8 11.6 M12 18.4 V21.4" {...c} />
          </>
        );
      case "websites":
        return (
          <>
            <rect x={3} y={4.5} width={18} height={15} rx={2.5} {...c} />
            <path d="M3 9.5 H21" {...c} />
          </>
        );
      case "slides":
        return (
          <>
            <rect x={3} y={4} width={18} height={13} rx={2.5} {...c} />
            <path d="M12 17 V20.5 M8.5 20.5 H15.5" {...c} />
          </>
        );
      case "report":
        return (
          <>
            <rect x={4} y={3} width={16} height={18} rx={2.5} {...c} />
            <path d="M8 15.5 L11 12 L13.5 14.2 L16.5 9.5" {...c} />
          </>
        );
      case "sheets":
        return (
          <>
            <rect x={3.5} y={4.5} width={17} height={15} rx={2.5} {...c} />
            <path d="M3.5 9.5 H20.5 M3.5 14.5 H20.5 M9.5 9.5 V19.5" {...c} />
          </>
        );
      case "mail":
        return (
          <>
            <rect x={2.5} y={5} width={19} height={14} rx={2.6} {...c} />
            <path d="M3.4 6.6 L12 13 L20.6 6.6" {...c} />
          </>
        );
      case "instagram":
        return (
          <>
            <rect x={3.2} y={3.2} width={17.6} height={17.6} rx={5} {...c} />
            <circle cx={12} cy={12} r={4.3} {...c} />
            <circle cx={17.1} cy={6.9} r={1.15} fill={color} stroke="none" />
          </>
        );
      default:
        return null;
    }
  })();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {body}
    </svg>
  );
};

// ------------------------------------------------------------------- cursor
const Cursor: React.FC<{
  x: number;
  y: number;
  pressed: boolean;
  opacity: number;
}> = ({ x, y, pressed, opacity }) => (
  <svg
    width={44}
    height={62}
    viewBox="0 0 20 28"
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      transform: `scale(${pressed ? 0.87 : 1})`,
      transformOrigin: "4px 2px",
      filter: "drop-shadow(0 3px 7px rgba(23,20,14,0.26))",
    }}
  >
    <path
      d="M3 1 L3 22.5 L8.2 17.6 L11.6 25.5 L15 24 L11.6 16.2 L18.6 16.2 Z"
      fill="#1F1F1F"
      stroke="#FFFFFF"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

// ------------------------------------------------------------- tiny helpers
const Bar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  r?: number;
  op?: number;
}> = ({ x, y, w, h, color, r, op = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: Math.max(0, w),
      height: h,
      borderRadius: r ?? h / 2,
      background: color,
      opacity: op,
    }}
  />
);

// A live amber pulse — the "still producing" tell on the landing-page output.
const LiveDot: React.FC<{ cx: number; cy: number; frame: number; from: number }> = ({
  cx,
  cy,
  frame,
  from,
}) => {
  if (frame < from) return null;
  const t = (frame - from) % 34;
  const rad = 8 + (t / 34) * 16;
  const op = 0.5 * (1 - t / 34);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - rad,
          top: cy - rad,
          width: rad * 2,
          height: rad * 2,
          borderRadius: "50%",
          border: `2px solid rgba(222,155,74,${op})`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - 7,
          top: cy - 7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: RN.amber,
        }}
      />
    </>
  );
};

// ------------------------------------------------------- output card shell
const OutCard: React.FC<{
  top: number;
  height: number;
  enter: number;
  drift: number;
  frame: number;
  fps: number;
  children: React.ReactNode;
}> = ({ top, height, enter, drift, frame, fps, children }) => {
  const s =
    frame <= enter
      ? 0
      : spring({ frame: frame - enter, fps, config: SPRINGS.snappy });
  const op = iv(frame, [enter, enter + 7], [0, 1], easeQ);
  return (
    <div
      style={{
        position: "absolute",
        left: OUT_X,
        top,
        width: OUT_W,
        height,
        borderRadius: 26,
        background: LW.card,
        border: `1px solid ${LW.hairline}`,
        // a touch tighter than LW.shadow so the soft tail never reaches the
        // 9:16 bottom-12% zone under the last card
        boxShadow:
          "0 13px 32px rgba(23,20,14,0.09), 0 2px 5px rgba(23,20,14,0.05)",
        boxSizing: "border-box",
        overflow: "hidden",
        opacity: op,
        transform: `translate(${drift * (1 - s)}px, ${-30 * (1 - s)}px) scale(${
          0.8 + 0.2 * s
        })`,
        transformOrigin: "50% 0%",
      }}
    >
      {children}
    </div>
  );
};

// =========================================================================
// OUTPUT 1 — THE LANDING PAGE
// Onyx-grammar transferred onto Harbourlight's cream/amber world: browser
// chrome, a letterspaced caps marquee ticker, a full-bleed hero photo with a
// cream scrim rising from the bottom under an oversized Fraunces headline, and
// a product rail whose cards carry NAME · PRICE / tasting notes / roast level.
// Every string is the agent's own (LAUNCH); every image is one it generated.
// =========================================================================
const HERO_TOP = 84;
const HERO_H = 288; // hero band ends at world-card y 372
const CARD_W = 296;
const CARD_GAP = 18;
const CARD_X0 = 30;
const PANEL_H = 244;
const GRID_TOP = 388;

const TICKER_SEG_W = 470;

const LandingBody: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pop = (at: number) =>
    frame <= at ? 0 : spring({ frame: frame - at, fps, config: SPRINGS.snappy });
  const fade = (at: number) => iv(frame, [at, at + 8], [0, 1], easeQ);

  const heroWords = LAUNCH.heroTagline.split(" ");
  const tickerText = LAUNCH.shipStrip.toUpperCase();
  const tickerShift = -((frame * 1.5) % TICKER_SEG_W);
  // slow parallax on the hero photo — the page is alive through the end hold
  const heroPar = Math.sin(frame / 34) * 5;

  return (
    <>
      {/* ------------------------------------------------ browser chrome */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: OUT_W,
          height: 52,
          background: LW.cardSoft,
          borderBottom: `1px solid ${LW.hairlineSoft}`,
          opacity: fade(62),
        }}
      />
      <div style={{ opacity: fade(62) }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 28 + i * 22,
              top: 20,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: i === 0 ? "#E3DFD8" : i === 1 ? "#EAE6DF" : "#EFEBE4",
            }}
          />
        ))}
        <Bar x={108} y={14} w={420} h={24} color={LW.paperDeep} r={12} />
      </div>

      {/* ---------------------------------------- the cream page surface */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 52,
          width: OUT_W,
          height: 764 - 52,
          background: CREAM,
          opacity: fade(62),
        }}
      />

      {/* --------------------------- Onyx-style letterspaced caps ticker */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 52,
          width: OUT_W,
          height: 32,
          background: CHAR,
          overflow: "hidden",
          opacity: fade(64),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 32,
            display: "flex",
            transform: `translateX(${tickerShift}px)`,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: TICKER_SEG_W,
                height: 32,
                display: "flex",
                alignItems: "center",
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 3,
                color: "rgba(247,241,230,0.90)",
                whiteSpace: "nowrap",
              }}
            >
              <span>{tickerText}</span>
              <span style={{ margin: "0 20px", color: AMBER }}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------- full-bleed hero photo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: HERO_TOP,
          width: OUT_W,
          height: HERO_H,
          overflow: "hidden",
          opacity: fade(66),
        }}
      >
        <Img
          src={staticFile(LAUNCH.images.hero)}
          style={{
            width: OUT_W,
            height: HERO_H + 24,
            objectFit: "cover",
            objectPosition: "50% 52%",
            transform: `translateY(${-12 + heroPar}px) scale(${
              1 + 0.03 * (1 - pop(66))
            })`,
          }}
        />
        {/* cream scrim rising from the bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: OUT_W,
            height: HERO_H,
            backgroundImage: `linear-gradient(to top, ${CREAM} 0%, ${CREAM} 46%, rgba(247,241,230,0.86) 62%, rgba(247,241,230,0.40) 80%, rgba(247,241,230,0) 100%)`,
          }}
        />
        {/* a whisper of shade at the very top so the cream wordmark seats */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: OUT_W,
            height: 96,
            backgroundImage:
              "linear-gradient(to bottom, rgba(20,16,12,0.40) 0%, rgba(20,16,12,0.14) 46%, rgba(20,16,12,0) 100%)",
          }}
        />
      </div>

      {/* wordmark, cream over the photo */}
      <div
        style={{
          position: "absolute",
          left: 38,
          top: HERO_TOP + 22,
          fontFamily: FONT_DISPLAY,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.4,
          color: "rgba(250,246,238,0.96)",
          textShadow: "0 2px 14px rgba(20,16,12,0.45)",
          opacity: fade(70),
          transform: `translateY(${8 * (1 - pop(70))}px)`,
        }}
      >
        {RUN.brand.replace(" Coffee", "")}
      </div>

      {/* amber FIRSTPOUR banner pill */}
      <div
        style={{
          position: "absolute",
          right: 38,
          top: HERO_TOP + 20,
          height: 34,
          display: "inline-flex",
          alignItems: "center",
          padding: "0 18px",
          borderRadius: 17,
          background: AMBER,
          boxShadow: "0 6px 18px rgba(120,64,10,0.30)",
          fontFamily: FONT_BODY,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 2.4,
          color: "#FFF7EA",
          opacity: fade(72),
          transform: `scale(${0.7 + 0.3 * pop(72)})`,
          transformOrigin: "100% 50%",
        }}
      >
        {LAUNCH.heroBanner}
      </div>

      {/* letterspaced caps kicker */}
      <div
        style={{
          position: "absolute",
          left: 38,
          top: 228,
          fontFamily: FONT_BODY,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 3.4,
          color: AMBER,
          whiteSpace: "nowrap",
          opacity: fade(74),
          transform: `translateY(${10 * (1 - pop(74))}px)`,
        }}
      >
        {RUN.brand.toUpperCase()}
      </div>

      {/* oversized Fraunces display headline, word by word */}
      <div
        style={{
          position: "absolute",
          left: 38,
          top: 258,
          width: 660,
          display: "flex",
          flexWrap: "wrap",
          fontFamily: FONT_DISPLAY,
          fontSize: 46,
          lineHeight: "52px",
          fontWeight: 600,
          letterSpacing: -1.1,
          color: CHAR,
        }}
      >
        {heroWords.map((w, i) => {
          const at = 74 + i * 3;
          const p = pop(at);
          return (
            <span
              key={`${w}-${i}`}
              style={{
                display: "inline-block",
                marginRight: 13,
                opacity: iv(frame, [at, at + 7], [0, 1], easeQ),
                transform: `translateY(${16 * (1 - p)}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* --------------------------------------------- the product rail */}
      {LAUNCH.products.map((p, i) => {
        const at = 80 + i * 5;
        const s = pop(at);
        const op = iv(frame, [at, at + 8], [0, 1], easeQ);
        const x = CARD_X0 + i * (CARD_W + CARD_GAP);
        const d = BEAN_DETAIL[i];
        return (
          <div
            key={p.name}
            style={{
              position: "absolute",
              left: x,
              top: GRID_TOP,
              width: CARD_W,
              opacity: op,
              transform: `translateY(${26 * (1 - s)}px)`,
            }}
          >
            {/* tinted product panel + the bag the agent generated */}
            <div
              style={{
                position: "relative",
                width: CARD_W,
                height: PANEL_H,
                overflow: "hidden",
                borderRadius: 4,
                background: CREAM,
              }}
            >
              <Img
                src={staticFile(p.img)}
                style={{
                  width: CARD_W,
                  height: PANEL_H,
                  objectFit: "cover",
                  objectPosition: "50% 50%",
                  transform: `scale(${1.02 + 0.05 * (1 - s)})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: CARD_W,
                  height: PANEL_H,
                  background: d.tint,
                }}
              />
            </div>

            {/* NAME + PRICE row */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: PANEL_H + 16,
                width: CARD_W,
                height: 40,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 19,
                  lineHeight: "20px",
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  color: CHAR,
                  textTransform: "uppercase",
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 20,
                  lineHeight: "20px",
                  fontWeight: 700,
                  color: AMBER,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {p.price}
              </span>
            </div>

            {/* tasting notes */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: PANEL_H + 64,
                width: CARD_W,
                height: 34,
                fontFamily: FONT_BODY,
                fontSize: 14,
                lineHeight: "17px",
                fontWeight: 500,
                letterSpacing: 1,
                color: "rgba(34,32,29,0.52)",
                opacity: iv(frame, [at + 5, at + 13], [0, 1], easeQ),
              }}
            >
              {d.notes}
            </div>

            {/* roast level */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: PANEL_H + 104,
                width: CARD_W,
                fontFamily: FONT_BODY,
                fontSize: 13,
                lineHeight: "16px",
                fontWeight: 600,
                letterSpacing: 1.2,
                color: "rgba(34,32,29,0.40)",
                whiteSpace: "nowrap",
                opacity: iv(frame, [at + 8, at + 16], [0, 1], easeQ),
              }}
            >
              {d.roast}
            </div>
          </div>
        );
      })}
    </>
  );
};

// =========================================================================
// OUTPUT 2 — THE FIVE WELCOME EMAILS
// A mail list writing itself: envelope glyph, the agent's REAL subject line
// wiping in, an abstract body-preview bar, and a sent-dot ticking amber ->
// green. The fifth dot deliberately lands inside the end hold.
// =========================================================================
const MAIL_ROWS = [
  { at: 96, prev: 330, sent: 112 },
  { at: 103, prev: 268, sent: 119 },
  { at: 110, prev: 392, sent: 126 },
  { at: 117, prev: 296, sent: 133 },
  { at: 126, prev: 348, sent: 162 },
];

const EmailBody: React.FC<{ frame: number }> = ({ frame }) => {
  const L = 28;
  const TOP0 = 18;
  const PITCH = 41;
  return (
    <>
      {MAIL_ROWS.map((e, i) => {
        const y = TOP0 + i * PITCH;
        const rowOp = iv(frame, [e.at - 2, e.at + 5], [0, 1], easeQ);
        const wipe = iv(frame, [e.at + 1, e.at + 12], [0, 1], Easing.linear);
        const prevGrow = iv(frame, [e.at + 7, e.at + 17], [0, 1], Easing.linear);
        const sent = frame >= e.sent;
        const dotPop = iv(frame, [e.sent, e.sent + 5], [0.55, 1], easeQ);
        return (
          <div key={LAUNCH.emailSubjects[i]} style={{ opacity: rowOp }}>
            {i < 4 ? (
              <div
                style={{
                  position: "absolute",
                  left: L,
                  top: y + 38,
                  width: OUT_W - L * 2,
                  height: 1,
                  background: LW.hairlineSoft,
                }}
              />
            ) : null}
            <div style={{ position: "absolute", left: L, top: y + 4 }}>
              <Ico
                name="mail"
                size={22}
                color={sent ? RN.textWarm : RN.muted}
                sw={1.6}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: L + 38,
                top: y,
                width: 620,
                height: 24,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 20,
                  lineHeight: "24px",
                  fontWeight: 500,
                  letterSpacing: -0.1,
                  color: "#33302B",
                  whiteSpace: "nowrap",
                  clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
                }}
              >
                {LAUNCH.emailSubjects[i]}
              </div>
            </div>
            <Bar
              x={L + 38}
              y={y + 28}
              w={e.prev * prevGrow}
              h={8}
              color="#DAD7D0"
            />
            <div
              style={{
                position: "absolute",
                left: OUT_W - L - 13,
                top: y + 9,
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: sent ? RN.green : RN.amber,
                transform: `scale(${sent ? dotPop : 1})`,
              }}
            />
          </div>
        );
      })}
    </>
  );
};

// =========================================================================
// OUTPUT 3 — THE WEEK OF SOCIAL POSTS
// Instagram lead: a 2x2 grid of the agent's own photography under the real
// handle, with the drafted captions beside it as abstract bars.
// =========================================================================
const POST_TILES = [
  { img: LAUNCH.images.roastery, pos: "50% 56%", fit: "cover" as const, bg: CREAM },
  { img: LAUNCH.images.farm, pos: "50% 50%", fit: "cover" as const, bg: CREAM },
  {
    img: LAUNCH.products[0].img,
    pos: "50% 50%",
    fit: "cover" as const,
    bg: "#EFDFC7",
  },
  { img: LAUNCH.images.hero, pos: "42% 54%", fit: "cover" as const, bg: CREAM },
];

const CAP_BARS = [
  [352, 268],
  [408, 214],
  [320, 296],
  [376, 240],
];

const SocialBody: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pop = (at: number) =>
    frame <= at ? 0 : spring({ frame: frame - at, fps, config: SPRINGS.snappy });
  const fade = (at: number) => iv(frame, [at, at + 8], [0, 1], easeQ);
  const TILE = 140;
  const GAP = 12;
  const GX = 28;
  const GY = 62;
  const RX = 340;

  return (
    <>
      {/* handle header */}
      <div style={{ position: "absolute", left: 28, top: 20, opacity: fade(122) }}>
        <Ico name="instagram" size={30} color={LW.ink} sw={1.7} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 22,
          fontFamily: FONT_BODY,
          fontSize: 25,
          fontWeight: 600,
          letterSpacing: -0.3,
          color: LW.ink,
          opacity: fade(122),
        }}
      >
        {LAUNCH.handle}
      </div>

      {/* the 2x2 grid */}
      {POST_TILES.map((t, i) => {
        const at = 124 + i * 6;
        const s = pop(at);
        const op = iv(frame, [at, at + 7], [0, 1], easeQ);
        const x = GX + (i % 2) * (TILE + GAP);
        const y = GY + Math.floor(i / 2) * (TILE + GAP);
        const par = 1.03 + 0.02 * Math.sin((frame + i * 9) / 40);
        return (
          <div
            key={t.img}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: TILE,
              height: TILE,
              borderRadius: 8,
              overflow: "hidden",
              background: t.bg,
              opacity: op,
              transform: `scale(${0.84 + 0.16 * s})`,
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile(t.img)}
              style={{
                width: TILE,
                height: TILE,
                objectFit: t.fit,
                objectPosition: t.pos,
                transform: `scale(${par})`,
              }}
            />
          </div>
        );
      })}

      {/* the drafted captions, abstract */}
      {CAP_BARS.map((bars, i) => {
        const at = 128 + i * 6;
        const y = GY + i * (64 + 12);
        const g1 = iv(frame, [at, at + 12], [0, 1], Easing.linear);
        const g2 = iv(frame, [at + 6, at + 20], [0, 1], Easing.linear);
        const op = iv(frame, [at, at + 7], [0, 1], easeQ);
        const done = frame >= at + 22;
        return (
          <div key={i} style={{ opacity: op }}>
            <div style={{ position: "absolute", left: RX, top: y + 2 }}>
              <Ico name="instagram" size={18} color={RN.muted} sw={1.8} />
            </div>
            <Bar x={RX + 28} y={y + 5} w={bars[0] * g1} h={10} color="#C9C5BD" />
            <Bar x={RX + 28} y={y + 25} w={bars[1] * g2} h={9} color="#DCD9D2" />
            <div
              style={{
                position: "absolute",
                left: OUT_W - 28 - 11,
                top: y + 6,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: done ? RN.green : RN.amber,
              }}
            />
            {i < 3 ? (
              <div
                style={{
                  position: "absolute",
                  left: RX,
                  top: y + 56,
                  width: OUT_W - 28 - RX,
                  height: 1,
                  background: LW.hairlineSoft,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// --------------------------------------------------------------------- main
export const RgP2OnePrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fy =
    interpolate(frame, KEY_T, KEY_FY, {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) + Math.sin(frame / 30) * 1.4;
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fx = AXIS;

  // ---- typing
  const n = typedCount(frame);
  const shown = PROMPT.slice(0, n);
  const typing = frame > TYPE_START && frame < TYPE_END + 2;
  const caretOn = typing ? 1 : Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  // ---- submit control
  const micOp = iv(frame, [SUBMIT_SWAP - 3, SUBMIT_SWAP + 3], [1, 0], easeQ);
  const swapS =
    frame <= SUBMIT_SWAP
      ? 0
      : spring({ frame: frame - SUBMIT_SWAP, fps, config: SPRINGS.snappy });
  const pressScale = iv(frame, [PRESS, PRESS + 4, PRESS + 12], [1, 0.88, 1], easeQ);
  const ripple = frame >= PRESS && frame <= PRESS + 16 ? frame - PRESS : -1;
  const arcOp = iv(frame, [RUNNING, RUNNING + 8], [0, 1], easeQ);
  const arcRot = (frame - RUNNING) * 6.4;

  // ---- the composer de-emphasises once the work is handed over
  const chipsOp = iv(frame, [PRESS + 6, PRESS + 20], [1, 0.42], easeQ);

  // ---- cursor
  const curX = iv(frame, CUR_F, CUR_X, easeQ);
  const curY = iv(frame, CUR_F, CUR_Y, easeQ);
  const curOp = iv(frame, [26, 36, 54, 62], [0, 1, 1, 0], easeQ);
  const curPressed = frame >= PRESS && frame <= PRESS + 7;

  return (
    // Opaque Liam paper on the OUTERMOST fill, frame 0 -> 179. No black.
    <AbsoluteFill style={{ backgroundColor: LW.paper, fontFamily: FONT_SANS }}>
      {/* warm floor gradient — background bleeds full-frame, content does not */}
      <AbsoluteFill
        style={{
          backgroundImage: [
            `radial-gradient(120% 52% at 50% 108%, ${LW.paperDeep} 0%, rgba(239,237,232,0) 68%)`,
            "radial-gradient(88% 44% at 50% -6%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 62%)",
          ].join(", "),
        }}
      />

      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ============================================================ */}
        {/* THE PRODUCT — Runable's composer, authentic near-white surface */}
        {/* ============================================================ */}
        <div
          style={{
            position: "absolute",
            left: APP_X,
            top: APP_TOP,
            width: APP_W,
            height: APP_BOT - APP_TOP,
            borderRadius: 42,
            background: RN.bg,
            border: `1px solid ${LW.hairline}`,
            boxShadow: LW.shadowLift,
            boxSizing: "border-box",
          }}
        />

        {/* Build | Grow toggle (real product strings) */}
        <div
          style={{
            position: "absolute",
            left: AXIS - 170,
            top: TOP_ROW_CY - 33,
            width: 340,
            height: 66,
            borderRadius: 33,
            background: RN.panel,
            display: "flex",
            alignItems: "center",
            padding: 5,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              width: 165,
              height: 56,
              borderRadius: 28,
              background: RN.card,
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
            }}
          >
            <Ico name="build" size={24} color={RN.textWarm} sw={1.6} />
            <span style={{ fontSize: 27, fontWeight: 500, color: RN.text }}>
              {GROW.toggle[0]}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              width: 165,
              height: 56,
            }}
          >
            <Ico name="grow" size={24} color={RN.muted} sw={1.9} />
            <span style={{ fontSize: 27, fontWeight: 500, color: RN.muted }}>
              {GROW.toggle[1]}
            </span>
          </div>
        </div>

        {/* amber credit pill */}
        <div
          style={{
            position: "absolute",
            left: APP_R - 44 - 148,
            top: TOP_ROW_CY - 31,
            width: 148,
            height: 62,
            borderRadius: 31,
            background: RN.amberSoft,
            border: "1px solid rgba(222,155,74,0.32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxSizing: "border-box",
          }}
        >
          <Ico name="coin" size={26} color={RN.amber} sw={1.8} />
          <span
            style={{
              fontSize: 29,
              fontWeight: 500,
              color: RN.amber,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {GROW.credits}
          </span>
        </div>

        {/* heading */}
        <div
          style={{
            position: "absolute",
            left: APP_X,
            top: HEAD_CY - 44,
            width: APP_W,
            textAlign: "center",
            fontSize: 68,
            fontWeight: 500,
            letterSpacing: -1.5,
            lineHeight: "82px",
            color: RN.textWarm,
            whiteSpace: "nowrap",
          }}
        >
          {RN_UI.heading}
        </div>

        {/* ------------------------------------------------ the input box */}
        <div
          style={{
            position: "absolute",
            left: INPUT_X,
            top: INPUT_TOP,
            width: INPUT_W,
            height: INPUT_H,
            borderRadius: 28,
            background: RN.hover,
            border: `1px solid ${RN.border}`,
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: TEXT_X,
            top: TEXT_TOP,
            width: TEXT_W,
            fontSize: TEXT_FS,
            lineHeight: `${TEXT_LH}px`,
            fontWeight: 400,
            color: RN.text,
            letterSpacing: -0.4,
            whiteSpace: "pre-wrap",
          }}
        >
          {n === 0 ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 38,
                  verticalAlign: "-7px",
                  background: RN.text,
                  opacity: caretOn,
                  marginRight: 3,
                }}
              />
              <span style={{ color: RN.muted }}>{RN_UI.placeholder}</span>
            </>
          ) : (
            <>
              {shown}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 38,
                  verticalAlign: "-7px",
                  background: RN.text,
                  opacity: caretOn,
                  marginLeft: 3,
                }}
              />
            </>
          )}
        </div>

        {/* --------------------------------------------- the control row */}
        <div style={{ position: "absolute", left: ROW_L, top: ROW_CY - 16 }}>
          <Ico name="plus" size={32} color={RN.muted} sw={1.9} />
        </div>

        {/* Agent | Ask — AGENT ACTIVE (sponsor requirement, on from frame 0) */}
        <div
          style={{
            position: "absolute",
            left: 224,
            top: ROW_CY - 35,
            width: 300,
            height: 70,
            borderRadius: 35,
            background: "rgba(0,0,0,0.035)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 229,
            top: ROW_CY - 30,
            width: 172,
            height: 60,
            borderRadius: 30,
            background: RN.card,
            boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 20,
            boxSizing: "border-box",
          }}
        >
          <Ico name="agent" size={26} color={RN.textWarm} />
          <span style={{ fontSize: 29, fontWeight: 500, color: RN.text }}>
            {RN_UI.modeAgent}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 418,
            top: ROW_CY - 15,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <Ico name="ask" size={25} color={RN.muted} style={{ marginTop: -1 }} />
          <span
            style={{
              fontSize: 29,
              fontWeight: 500,
              color: RN.muted,
              lineHeight: "30px",
            }}
          >
            {RN_UI.modeAsk}
          </span>
        </div>

        {/* Auto */}
        <div
          style={{
            position: "absolute",
            left: 562,
            top: ROW_CY - 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 29,
              fontWeight: 500,
              color: RN.textWarm,
              lineHeight: "32px",
            }}
          >
            {GROW.model}
          </span>
          <Ico name="chevron" size={21} color={RN.muted} sw={2} style={{ marginTop: 3 }} />
        </div>

        <div style={{ position: "absolute", left: 668, top: ROW_CY - 14 }}>
          <Ico name="doc" size={28} color={RN.muted} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 708,
            top: ROW_CY - 30,
            width: 106,
            height: 60,
            borderRadius: 30,
            background: "rgba(0,0,0,0.045)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 29, fontWeight: 500, color: RN.textWarm }}>
            {RN_UI.plan}
          </span>
        </div>

        {/* mic (empty) -> black circular submit (prompt present) */}
        {micOp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: SUBMIT_CX - 16,
              top: ROW_CY - 16,
              opacity: micOp,
            }}
          >
            <Ico name="mic" size={32} color={RN.muted} sw={1.8} />
          </div>
        ) : null}
        {ripple >= 0 ? (
          <div
            style={{
              position: "absolute",
              left: SUBMIT_CX - (40 + ripple * 3.6),
              top: ROW_CY - (40 + ripple * 3.6),
              width: (40 + ripple * 3.6) * 2,
              height: (40 + ripple * 3.6) * 2,
              borderRadius: "50%",
              border: `3px solid rgba(222,155,74,${0.42 * (1 - ripple / 16)})`,
              boxSizing: "border-box",
            }}
          />
        ) : null}
        {/* running arc — the micro-motion that carries every hold after 49 */}
        {arcOp > 0 ? (
          <svg
            width={112}
            height={112}
            viewBox="0 0 112 112"
            style={{
              position: "absolute",
              left: SUBMIT_CX - 56,
              top: ROW_CY - 56,
              opacity: arcOp,
              transform: `rotate(${arcRot}deg)`,
            }}
          >
            <circle
              cx={56}
              cy={56}
              r={47}
              fill="none"
              stroke={RN.amber}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="78 217"
            />
          </svg>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: SUBMIT_X,
            top: ROW_CY - SUBMIT_D / 2,
            width: SUBMIT_D,
            height: SUBMIT_D,
            borderRadius: "50%",
            background: RN.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: swapS,
            transform: `scale(${(0.45 + 0.55 * swapS) * pressScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <Ico name="arrow" size={32} color="#FFFFFF" sw={2.1} />
        </div>

        {/* ------------------------------------------- features in Agent mode */}
        <div style={{ opacity: chipsOp }}>
          <div
            style={{
              position: "absolute",
              left: INPUT_X + 6,
              top: FEAT_LABEL_CY - 19,
              width: INPUT_W,
              whiteSpace: "nowrap",
              fontSize: 28,
              fontWeight: 400,
              color: RN.muted,
              letterSpacing: -0.2,
            }}
          >
            {RN_UI.featuresLabel}
          </div>
          <div
            style={{
              position: "absolute",
              left: INPUT_X,
              top: CHIPS_TOP,
              width: INPUT_W,
              display: "flex",
              gap: 14,
            }}
          >
            {RN_UI.features.map((f) => (
              <div
                key={f}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  height: CHIP_H,
                  padding: "0 24px",
                  borderRadius: CHIP_H / 2,
                  background: RN.card,
                  border: `1px solid ${RN.borderStrong}`,
                  boxSizing: "border-box",
                }}
              >
                <Ico
                  name={f.toLowerCase() as IcoName}
                  size={24}
                  color={RN.textWarm}
                />
                <span
                  style={{
                    fontSize: 27,
                    fontWeight: 500,
                    color: RN.text,
                    whiteSpace: "nowrap",
                    letterSpacing: -0.2,
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------- OUTPUT 1 — landing page */}
        <OutCard
          top={A_TOP}
          height={A_H}
          enter={A_IN}
          drift={-40}
          frame={frame}
          fps={fps}
        >
          <LandingBody frame={frame} fps={fps} />
        </OutCard>
        {/* the job is still running — a beacon in the paper beside the landing
            page, never inside the browser chrome and clear of every safe zone */}
        <LiveDot cx={OUT_R + 18} cy={A_TOP + 110} frame={frame} from={A_IN + 12} />

        {/* --------------------------------------- OUTPUT 2 — welcome emails */}
        <OutCard
          top={B_TOP}
          height={B_H}
          enter={B_IN}
          drift={40}
          frame={frame}
          fps={fps}
        >
          <EmailBody frame={frame} />
        </OutCard>

        {/* ---------------------------------------- OUTPUT 3 — social posts */}
        <OutCard
          top={C_TOP}
          height={C_H}
          enter={C_IN}
          drift={-40}
          frame={frame}
          fps={fps}
        >
          <SocialBody frame={frame} fps={fps} />
        </OutCard>

        {/* ============================================================ */}
        {/* ONE PROMPT -> THREE OUTPUTS: amber packets leave the submit    */}
        {/* button and each one lands where its card is about to bloom.   */}
        {/* ============================================================ */}
        {PACKETS.map((pk) => {
          if (frame < pk.from || frame > pk.to + 8) return null;
          const t = iv(frame, [pk.from, pk.to], [0, 1], easeQ);
          const burst = frame - pk.to;
          return (
            <div key={pk.from}>
              {frame <= pk.to
                ? [0, 1, 2, 3, 4].map((k) => {
                    const tt = Math.max(0, t - k * 0.055);
                    const [px, py] = bez([SUBMIT_CX, ROW_CY], pk.ctrl, pk.land, tt);
                    const r = 9 - k * 1.4;
                    const op = (1 - k * 0.18) * (1 - Math.max(0, t - 0.86) / 0.14);
                    return (
                      <div
                        key={k}
                        style={{
                          position: "absolute",
                          left: px - r,
                          top: py - r,
                          width: r * 2,
                          height: r * 2,
                          borderRadius: "50%",
                          background: RN.amber,
                          opacity: Math.max(0, op),
                        }}
                      />
                    );
                  })
                : null}
              {burst >= 0 && burst <= 8 ? (
                <div
                  style={{
                    position: "absolute",
                    left: pk.land[0] - (16 + burst * 7),
                    top: pk.land[1] - (16 + burst * 7),
                    width: (16 + burst * 7) * 2,
                    height: (16 + burst * 7) * 2,
                    borderRadius: "50%",
                    border: `3px solid rgba(222,155,74,${0.5 * (1 - burst / 8)})`,
                    boxSizing: "border-box",
                  }}
                />
              ) : null}
            </div>
          );
        })}

        <Cursor x={curX} y={curY} pressed={curPressed} opacity={curOp} />
      </div>
    </AbsoluteFill>
  );
};
