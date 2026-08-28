// RnP2AgentMode — 1080x1920 @ 30fps (9:16), 170 frames (~5.7s)
// VO [0:06]: "Here's how to make one. Step one: give Runable your idea in
//            Agent mode. One sentence is enough."
//
// The product's first appearance. One continuous world holding Runable's real
// composer, rebuilt as vector/DOM UI so every string stays crisp at 9:16:
// credit pill · Free plan pill · "What needs to be done?" · the input ·
// the Agent|Ask toggle (AGENT active) · Auto / Plan / black circular submit ·
// "Features in Agent mode" chips with Carousels lighting cyan.
//
// SKIN — Ahmed (@alassafi.ai) ALTARI purple world. The ground, the ambient
// glow, the 64px backdrop grid and the 24px stage-plate grid are Altari.
// The composer itself is deliberately LEFT ALONE: it renders on Runable's real
// warm near-white (RN.bg) as one light product panel FLOATING on the purple,
// keeping IDGrotesk, the amber credit pill, the cyan Carousels chip, the black
// submit arrow and every verbatim string. Repainting a sponsor's UI purple
// would misrepresent the product — only the world around it is Ahmed's.
//
// Camera (hold → move → hold, Easing.inOut(cubic)):
//   0–20    hold, tight on the composer, caret blinking, mic on the right
//   20–96   hold (micro-drift) — the one sentence TYPES IN (string slicing)
//   96–114  MOVE (18f) — pull back, the app chrome + full chip rack reveal
//   114–128 hold — the Agent pill and the Carousels chip register
//   128–148 MOVE (20f) — ease down onto the submit arrow
//   148–170 hold — the arrow presses at 152, then a clean end hold
//
// Hard rules: opaque ALTARI.bg on the outermost AbsoluteFill for every frame;
// all content inside the 5% side margin (safePadX) and clear of the 9:16
// top-10% / bottom-12% Reels zones; no narration restated on screen — the
// only words are the product's own UI strings from theme.ts.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  FONT_SANS,
  RN,
  SPRINGS,
  UI,
  safePadX,
} from "./theme";

export const DURATION_IN_FRAMES = 170;

// ------------------------------------------------------------------ easing
const ease = Easing.inOut(Easing.cubic);
const easeQ = Easing.inOut(Easing.quad);
const easeOut = Easing.out(Easing.quad);
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

// ------------------------------------------------------------- world layout
const VIEW_W = 1080;
const VIEW_H = 1920;

// 5% side safe margin is the hard ceiling on how big the card may ever get.
const SAFE_PAD_X = safePadX(VIEW_W); // 54
const SAFE_W = VIEW_W - SAFE_PAD_X * 2; // 972
const Z_TIGHT = 1.07; // the closest the camera ever gets
const Z_WIDE = 0.9;

// Card width chosen so CARD_W * Z_TIGHT stays comfortably inside SAFE_W.
const CARD_W = 880; // 880 * 1.07 = 942 < 972
const CARD_X = (VIEW_W - CARD_W) / 2; // 100
const CARD_R = CARD_X + CARD_W; // 980
const PAD = 42;

const CREDIT_CY = 380;
const PLAN_CY = 760;
const HEAD_CY = 960;

const CARD_TOP = 1170;
const CARD_H = 400;
const CARD_BOT = CARD_TOP + CARD_H; // 1570

const TEXT_X = CARD_X + PAD; // 142
const TEXT_TOP = CARD_TOP + PAD; // 1212
const TEXT_W = CARD_W - PAD * 2; // 796
const TEXT_FS = 42;
const TEXT_LH = 58;

const ROW_H = 84;
const ROW_TOP = CARD_BOT - PAD - ROW_H; // 1444
const ROW_CY = ROW_TOP + ROW_H / 2; // 1486

const SUBMIT_D = 76;
const SUBMIT_X = CARD_R - PAD - SUBMIT_D; // 862
const SUBMIT_CX = SUBMIT_X + SUBMIT_D / 2; // 900

// Heading is centred on the world axis and can never grow past the 5% margin
// at the closest zoom the camera reaches.
const HEAD_W = Math.min(CARD_W + 80, Math.floor(SAFE_W / Z_TIGHT)); // 908

const LABEL_CY = 1630;
const CHIPS_TOP = 1675;
const CHIP_H = 70;
const CHIP_FS = 30;

// ------------------------------------------------- the light product panel
// Runable's real surface, sized so PANEL_W * Z_TIGHT === SAFE_W: the cream
// panel never crosses the 5% side margin even at the closest zoom, so purple
// ground is visible on every single frame. Vertical bounds wrap the existing
// UI (credit pill top 346 → chip rack bottom ~1915) without moving any of it.
const PANEL_W = HEAD_W; // 908
const PANEL_X = (VIEW_W - PANEL_W) / 2; // 86
const PANEL_TOP = 316;
const PANEL_BOT = 1975;
const PANEL_H = PANEL_BOT - PANEL_TOP; // 1659

// Altari stage plate the panel sits on — the 24x24 grid surface.
const PLATE_X = PANEL_X - 26; // 60
const PLATE_TOP = PANEL_TOP - 30; // 286
const PLATE_W = PANEL_W + 52; // 960
const PLATE_H = PANEL_H + 74; // 1733

// ------------------------------------------------------------- camera keys
// hold · typing hold · reveal move · register hold · descend move · end hold
const KEY_T = [0, 20, 96, 114, 128, 148, 166, 170];
const KEY_FX = [540, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [1330, 1328, 1322, 1130, 1130, 1432, 1434, 1434];
const KEY_Z = [Z_TIGHT, 1.068, 1.06, Z_WIDE, Z_WIDE, Z_TIGHT, 1.068, 1.068];

// ------------------------------------------------------------------- beats
const IDEA =
  "Make me an Instagram carousel about the 5 Claude Code features that turn it into a team.";
const TYPE_START = 20;
const TYPE_END = 92;
const SUBMIT_SWAP = 21; // mic -> black arrow, the moment the input is non-empty
const AGENT_PULSE = 116;
const CAROUSELS_LIT = 122;
const PRESS = 152;

// Human-ish cadence: four segments, each a slightly different chars/frame.
const typedCount = (f: number) =>
  Math.round(
    iv(
      f,
      [TYPE_START, 34, 58, 76, TYPE_END],
      [0, 17, 47, 71, IDEA.length],
      Easing.linear,
    ),
  );

// Cursor travels in during the descend move and lands on the arrow — the tip
// sits left-of-centre so the white arrow glyph stays readable underneath.
const CUR_F = [124, 136, 148, 152, 170];
const CUR_X = [604, 780, 877, 877, 877];
const CUR_Y = [1800, 1652, 1494, 1499, 1498];

// ------------------------------------------------------------------- icons
type IcoName =
  | "websites"
  | "slides"
  | "report"
  | "sheets"
  | "workflows"
  | "apps"
  | "video"
  | "image"
  | "audio"
  | "carousels"
  | "agent"
  | "ask"
  | "plus"
  | "mic"
  | "arrow"
  | "chevron"
  | "doc"
  | "close"
  | "coin"
  | "spark";

const Ico: React.FC<{
  name: IcoName;
  size?: number;
  color?: string;
  sw?: number;
  style?: React.CSSProperties;
}> = ({ name, size = 26, color = RN.textWarm, sw = 1.7, style }) => {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const body = (() => {
    switch (name) {
      case "websites":
        return (
          <>
            <rect x={3} y={4.5} width={18} height={15} rx={2.5} {...common} />
            <path d="M3 9.5 H21" {...common} />
          </>
        );
      case "slides":
        return (
          <>
            <rect x={3} y={4} width={18} height={13} rx={2.5} {...common} />
            <path d="M12 17 V20.5 M8.5 20.5 H15.5" {...common} />
          </>
        );
      case "report":
        return (
          <>
            <rect x={4} y={3} width={16} height={18} rx={2.5} {...common} />
            <path d="M8 15.5 L11 12 L13.5 14.2 L16.5 9.5" {...common} />
          </>
        );
      case "sheets":
        return (
          <>
            <rect x={3.5} y={4.5} width={17} height={15} rx={2.5} {...common} />
            <path d="M3.5 9.5 H20.5 M3.5 14.5 H20.5 M9.5 9.5 V19.5" {...common} />
          </>
        );
      case "workflows":
        return (
          <>
            <circle cx={6} cy={6} r={2.4} {...common} />
            <circle cx={6} cy={18} r={2.4} {...common} />
            <circle cx={18.2} cy={12} r={2.4} {...common} />
            <path d="M8.4 6.6 L15.9 11 M8.4 17.4 L15.9 13" {...common} />
          </>
        );
      case "apps":
        return (
          <>
            <rect x={7} y={2.5} width={10} height={19} rx={2.6} {...common} />
            <path d="M10.6 18.8 H13.4" {...common} />
          </>
        );
      case "video":
        return (
          <>
            <rect x={3} y={5} width={18} height={14} rx={3} {...common} />
            <path d="M10.4 9.2 L15.4 12 L10.4 14.8 Z" {...common} />
          </>
        );
      case "image":
        return (
          <>
            <rect x={3} y={5} width={18} height={14} rx={2.6} {...common} />
            <circle cx={8.6} cy={10} r={1.5} {...common} />
            <path d="M4.2 17.6 L9.6 12.6 L13 15.6 L16 13.4 L20 17.2" {...common} />
          </>
        );
      case "audio":
        return (
          <path
            d="M4 10.5 V13.5 M8 7.5 V16.5 M12 5 V19 M16 8.5 V15.5 M20 11 V13"
            {...common}
          />
        );
      case "carousels":
        return (
          <>
            <rect x={7.5} y={4} width={9} height={16} rx={2.2} {...common} />
            <path d="M4 7 V17 M20 7 V17" {...common} />
          </>
        );
      case "agent":
        return (
          <>
            <path
              d="M6 4.5 H18 A3.5 3.5 0 0 1 21.5 8 V13.5 A3.5 3.5 0 0 1 18 17 H13.5 L9 20.5 V17 H6 A3.5 3.5 0 0 1 2.5 13.5 V8 A3.5 3.5 0 0 1 6 4.5 Z"
              {...common}
            />
            <circle cx={9} cy={10.8} r={1.35} fill={color} stroke="none" />
            <circle cx={15} cy={10.8} r={1.35} fill={color} stroke="none" />
          </>
        );
      case "ask":
        return (
          <>
            <rect x={2.8} y={4.5} width={18.4} height={12.5} rx={3} {...common} />
            <path d="M8 17 L8 20.5 L12.4 17" {...common} />
            <circle cx={8.4} cy={10.7} r={1.2} fill={color} stroke="none" />
            <circle cx={12} cy={10.7} r={1.2} fill={color} stroke="none" />
            <circle cx={15.6} cy={10.7} r={1.2} fill={color} stroke="none" />
          </>
        );
      case "plus":
        return <path d="M12 5 V19 M5 12 H19" {...common} />;
      case "mic":
        return (
          <>
            <rect x={9} y={2.6} width={6} height={11.4} rx={3} {...common} />
            <path d="M5.2 11.6 A6.8 6.8 0 0 0 18.8 11.6 M12 18.4 V21.4" {...common} />
          </>
        );
      case "arrow":
        return <path d="M5.5 12 H18.5 M12.8 6.3 L18.5 12 L12.8 17.7" {...common} />;
      case "chevron":
        return <path d="M6.5 9.5 L12 15 L17.5 9.5" {...common} />;
      case "doc":
        return (
          <>
            <rect x={4.5} y={3} width={13} height={18} rx={2.4} {...common} />
            <path d="M8 8 H14 M8 12 H14 M8 16 H11.5" {...common} />
            <path d="M17 16.5 L20.5 16.5 M18.8 14.8 L18.8 18.4" {...common} />
          </>
        );
      case "close":
        return <path d="M6.4 6.4 L17.6 17.6 M17.6 6.4 L6.4 17.6" {...common} />;
      case "coin":
        return (
          <>
            <ellipse cx={12} cy={8.4} rx={8} ry={4.1} {...common} />
            <path d="M4 8.4 V14.2 A8 4.1 0 0 0 20 14.2 V8.4" {...common} />
          </>
        );
      case "spark":
        return (
          <path
            d="M12 3.5 L13.7 9.6 L19.8 11.3 L13.7 13 L12 19.1 L10.3 13 L4.2 11.3 L10.3 9.6 Z"
            fill={color}
            stroke="none"
          />
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

// ------------------------------------------------------------------ cursor
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
      filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))",
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

// ------------------------------------------------------------------- chips
const CHIP_ICONS: Record<string, IcoName> = {
  Websites: "websites",
  Slides: "slides",
  Report: "report",
  Sheets: "sheets",
  Workflows: "workflows",
  Apps: "apps",
  Video: "video",
  Image: "image",
  Audio: "audio",
  Carousels: "carousels",
};

const Chip: React.FC<{
  label: string;
  lit?: number;
  ring?: number;
  scale?: number;
}> = ({ label, lit = 0, ring = 0, scale = 1 }) => {
  const inner: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "0 26px",
    height: CHIP_H,
    boxSizing: "border-box",
  };
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        height: CHIP_H,
        borderRadius: CHIP_H / 2,
        background: RN.card,
        border: `1px solid ${RN.borderStrong}`,
        boxSizing: "border-box",
        transform: `scale(${scale})`,
      }}
    >
      <div style={inner}>
        <Ico name={CHIP_ICONS[label] ?? "slides"} size={26} color={RN.textWarm} />
        <span
          style={{
            fontSize: CHIP_FS,
            fontWeight: 500,
            color: RN.text,
            whiteSpace: "nowrap",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </span>
      </div>

      {lit > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: CHIP_H / 2,
            backgroundColor: RN.card,
            backgroundImage: `linear-gradient(${RN.cyanSoft}, ${RN.cyanSoft})`,
            border: "1.8px solid rgba(0,183,202,0.45)",
            opacity: lit,
            ...inner,
          }}
        >
          <Ico name="close" size={25} color={RN.cyan} sw={2} />
          <span
            style={{
              fontSize: CHIP_FS,
              fontWeight: 500,
              color: RN.cyan,
              whiteSpace: "nowrap",
              letterSpacing: -0.2,
            }}
          >
            {label}
          </span>
        </div>
      ) : null}

      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -14 * ring,
            top: -14 * ring,
            right: -14 * ring,
            bottom: -14 * ring,
            borderRadius: CHIP_H,
            border: `2.4px solid rgba(0,183,202,${0.55 * (1 - ring)})`,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

// -------------------------------------------------------------------- main
export const RnP2AgentMode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- typing
  const n = typedCount(frame);
  const shown = IDEA.slice(0, n);
  const typing = frame > TYPE_START && frame < TYPE_END + 2;
  const caretOn = typing ? 1 : Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  // ---- submit control: mic while empty, black arrow once there is an idea
  const micOp = iv(frame, [SUBMIT_SWAP - 3, SUBMIT_SWAP + 3], [1, 0], easeQ);
  const swapS =
    frame <= SUBMIT_SWAP
      ? 0
      : spring({ frame: frame - SUBMIT_SWAP, fps, config: SPRINGS.snappy });
  const pressScale = iv(frame, [PRESS, PRESS + 4, PRESS + 11], [1, 0.9, 1], easeQ);
  // Ripple resolves well before the end hold so the last frames are static.
  const ripple = frame >= PRESS && frame <= PRESS + 14 ? frame - PRESS : -1;

  // ---- Agent pill registers
  const agentScale = iv(
    frame,
    [AGENT_PULSE, AGENT_PULSE + 5, AGENT_PULSE + 13],
    [1, 1.05, 1],
    easeQ,
  );
  const agentRing = iv(frame, [AGENT_PULSE, AGENT_PULSE + 16], [0, 1], easeOut);
  const agentRingOn = frame >= AGENT_PULSE && frame <= AGENT_PULSE + 16;

  // ---- Carousels chip lights cyan (the sentence said "carousel")
  const lit = iv(frame, [CAROUSELS_LIT, CAROUSELS_LIT + 6], [0, 1], easeQ);
  const litScale = iv(
    frame,
    [CAROUSELS_LIT, CAROUSELS_LIT + 5, CAROUSELS_LIT + 14],
    [1, 1.06, 1],
    easeQ,
  );
  const litRing = iv(frame, [CAROUSELS_LIT, CAROUSELS_LIT + 18], [0, 1], easeOut);
  const litRingOn = frame >= CAROUSELS_LIT && frame <= CAROUSELS_LIT + 18;

  // ---- cursor
  const curX = iv(frame, CUR_F, CUR_X, easeQ);
  const curY = iv(frame, CUR_F, CUR_Y, easeQ);
  const curOp = iv(frame, [124, 134], [0, 1], easeQ);
  const curPressed = frame >= PRESS && frame <= PRESS + 6;

  const rowTextColor = RN.muted;

  // The credit pill is the only element that ever travels past the top of the
  // frame. Fade it against its own SCREEN position so it is never painted
  // inside the 9:16 top-10% Reels zone while it slides in / out.
  const creditScreenTop = VIEW_H / 2 + (CREDIT_CY - 34 - fy) * z;
  const creditOp = iv(creditScreenTop, [188, 250], [0, 1], easeQ);

  // The backdrop grid drifts at a fraction of the camera so the purple ground
  // reads as real space behind the panel rather than a flat sticker.
  const gridX = (VIEW_W / 2 - fx) * 0.16;
  const gridY = (VIEW_H / 2 - fy) * 0.16;

  return (
    // Opaque root, frame 0 -> last frame. No whole-comp Sequence, no black.
    <AbsoluteFill
      style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}
    >
      {/* ------------------------------------ Ahmed's purple world (backdrop) */}
      <AbsoluteFill
        style={{
          backgroundImage: [
            "radial-gradient(118% 60% at 50% 24%, rgba(91,94,194,0.34) 0%, rgba(91,94,194,0.11) 46%, rgba(26,26,46,0) 74%)",
            "radial-gradient(90% 46% at 50% 106%, rgba(61,44,141,0.62) 0%, rgba(26,26,46,0) 72%)",
            "radial-gradient(48% 26% at 10% 76%, rgba(123,125,214,0.16) 0%, rgba(26,26,46,0) 100%)",
            "radial-gradient(44% 24% at 92% 18%, rgba(123,125,214,0.14) 0%, rgba(26,26,46,0) 100%)",
          ].join(", "),
        }}
      />
      {/* 64x64 grid — always present, low contrast */}
      <AbsoluteFill
        style={{
          backgroundImage: [
            "linear-gradient(rgba(165,167,217,0.062) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(165,167,217,0.062) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: `${ALTARI_GRID.backdrop}px ${ALTARI_GRID.backdrop}px`,
          backgroundPosition: `${gridX}px ${gridY}px`,
        }}
      />

      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW_W / 2 - fx}px, ${VIEW_H / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
          // The product panel and everything in it keeps Runable's own grotesk.
          fontFamily: FONT_SANS,
        }}
      >
        {/* ----------------------- ambient glow the panel casts on the ground */}
        <div
          style={{
            position: "absolute",
            left: PANEL_X - 300,
            top: PANEL_TOP - 250,
            width: PANEL_W + 600,
            height: PANEL_H + 500,
            background:
              "radial-gradient(closest-side, rgba(123,125,214,0.34) 0%, rgba(91,94,194,0.15) 52%, rgba(26,26,46,0) 100%)",
          }}
        />

        {/* ------------------------------- Altari stage plate (24x24 grid) */}
        <div
          style={{
            position: "absolute",
            left: PLATE_X,
            top: PLATE_TOP,
            width: PLATE_W,
            height: PLATE_H,
            borderRadius: 68,
            background: ALTARI.card,
            border: `1px solid ${ALTARI.border}`,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: [
                "linear-gradient(rgba(165,167,217,0.055) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(165,167,217,0.055) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: `${ALTARI_GRID.card}px ${ALTARI_GRID.card}px`,
            }}
          />
        </div>

        {/* ----------------------------------------------------------------
            THE PRODUCT. Runable's authentic warm near-white surface — the
            real app, floating as a light panel on Ahmed's purple ground.
            Shadow retuned for a dark ground: a light rim + deep ambient
            occlusion + a soft primary bloom instead of the warm cream drop.
        ---------------------------------------------------------------- */}
        <div
          style={{
            position: "absolute",
            left: PANEL_X,
            top: PANEL_TOP,
            width: PANEL_W,
            height: PANEL_H,
            borderRadius: 44,
            background: RN.bg,
            boxSizing: "border-box",
            boxShadow: [
              "0 0 0 1px rgba(255,255,255,0.10)",
              "0 44px 104px rgba(8,8,18,0.58)",
              "0 12px 34px rgba(8,8,18,0.44)",
              "0 0 120px rgba(91,94,194,0.26)",
            ].join(", "),
          }}
        />
        {/* ---------------------------------------------------- credit pill */}
        <div
          style={{
            position: "absolute",
            left: CARD_R - 156,
            top: CREDIT_CY - 34,
            width: 156,
            height: 68,
            borderRadius: 34,
            background: RN.amberSoft,
            border: "1px solid rgba(222,155,74,0.32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 11,
            boxSizing: "border-box",
            opacity: creditOp,
          }}
        >
          <Ico name="coin" size={28} color={RN.amber} sw={1.8} />
          <span
            style={{
              fontSize: 31,
              fontWeight: 500,
              color: RN.amber,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {UI.credits}
          </span>
        </div>

        {/* ------------------------------------------------- free plan pill */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: PLAN_CY - 33,
            width: CARD_W,
            height: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              height: 66,
              padding: "0 30px",
              borderRadius: 33,
              background: RN.hover,
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 500, color: RN.textWarm }}>
              {UI.plan_free}
            </span>
            <Ico name="spark" size={22} color={RN.amber} />
          </div>
        </div>

        {/* ----------------------------------------------------- the heading */}
        <div
          style={{
            position: "absolute",
            left: 540 - HEAD_W / 2,
            top: HEAD_CY - 55,
            width: HEAD_W,
            textAlign: "center",
            fontSize: 78,
            fontWeight: 500,
            letterSpacing: -1.6,
            lineHeight: "92px",
            color: RN.textWarm,
            whiteSpace: "nowrap",
          }}
        >
          {UI.heading}
        </div>

        {/* ------------------------------------------------- composer card */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_TOP,
            width: CARD_W,
            height: CARD_H,
            borderRadius: 30,
            background: RN.hover,
            border: `1px solid ${RN.border}`,
            boxSizing: "border-box",
          }}
        />

        {/* the idea, typed in by string slicing */}
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
                  height: 44,
                  verticalAlign: "-9px",
                  background: RN.text,
                  opacity: caretOn,
                  marginRight: 3,
                }}
              />
              <span style={{ color: RN.muted }}>{UI.placeholder}</span>
            </>
          ) : (
            <>
              {shown}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 44,
                  verticalAlign: "-9px",
                  background: RN.text,
                  opacity: caretOn,
                  marginLeft: 3,
                }}
              />
            </>
          )}
        </div>

        {/* --------------------------------------------------- control row */}
        {/* + */}
        <div style={{ position: "absolute", left: 160 - 16, top: ROW_CY - 16 }}>
          <Ico name="plus" size={32} color={rowTextColor} sw={1.9} />
        </div>

        {/* Agent | Ask */}
        <div
          style={{
            position: "absolute",
            left: 206,
            top: ROW_CY - 38,
            width: 316,
            height: 76,
            borderRadius: 38,
            background: "rgba(0,0,0,0.035)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 212,
            top: ROW_CY - 32,
            width: 184,
            height: 64,
            borderRadius: 32,
            background: RN.card,
            boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 20,
            boxSizing: "border-box",
            transform: `scale(${agentScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <Ico name="agent" size={27} color={RN.textWarm} />
          <span style={{ fontSize: 31, fontWeight: 500, color: RN.text }}>
            {UI.modeAgent}
          </span>
        </div>
        {agentRingOn ? (
          <div
            style={{
              position: "absolute",
              left: 212 - 16 * agentRing,
              top: ROW_CY - 32 - 16 * agentRing,
              width: 184 + 32 * agentRing,
              height: 64 + 32 * agentRing,
              borderRadius: 48,
              border: `2.6px solid rgba(61,46,36,${0.36 * (1 - agentRing)})`,
              boxSizing: "border-box",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 414,
            top: ROW_CY - 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ico name="ask" size={26} color={RN.muted} style={{ marginTop: -1 }} />
          <span
            style={{
              fontSize: 31,
              fontWeight: 500,
              color: RN.muted,
              lineHeight: "32px",
            }}
          >
            {UI.modeAsk}
          </span>
        </div>

        {/* Auto */}
        <div
          style={{
            position: "absolute",
            left: 556,
            top: ROW_CY - 17,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 31,
              fontWeight: 500,
              color: RN.textWarm,
              lineHeight: "34px",
            }}
          >
            {UI.model}
          </span>
          <Ico name="chevron" size={22} color={RN.muted} sw={2} style={{ marginTop: 3 }} />
        </div>

        {/* attach-a-doc glyph + Plan */}
        <div style={{ position: "absolute", left: 682, top: ROW_CY - 15 }}>
          <Ico name="doc" size={30} color={rowTextColor} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 726,
            top: ROW_CY - 32,
            width: 114,
            height: 64,
            borderRadius: 32,
            background: "rgba(0,0,0,0.045)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 31, fontWeight: 500, color: RN.textWarm }}>
            {UI.plan}
          </span>
        </div>

        {/* mic (empty state) -> black circular submit (idea present) */}
        {micOp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: SUBMIT_CX - 17,
              top: ROW_CY - 17,
              opacity: micOp,
            }}
          >
            <Ico name="mic" size={34} color={rowTextColor} sw={1.8} />
          </div>
        ) : null}
        {ripple >= 0 ? (
          <div
            style={{
              position: "absolute",
              left: SUBMIT_CX - (42 + ripple * 3.4),
              top: ROW_CY - (42 + ripple * 3.4),
              width: (42 + ripple * 3.4) * 2,
              height: (42 + ripple * 3.4) * 2,
              borderRadius: "50%",
              border: `3px solid rgba(0,0,0,${0.32 * (1 - ripple / 14)})`,
              boxSizing: "border-box",
            }}
          />
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
          <Ico name="arrow" size={34} color="#FFFFFF" sw={2.1} />
        </div>

        {/* ------------------------------------------------- features label */}
        <div
          style={{
            position: "absolute",
            left: CARD_X + 6,
            top: LABEL_CY - 20,
            width: CARD_W,
            whiteSpace: "nowrap",
            fontSize: 30,
            fontWeight: 400,
            color: RN.muted,
            letterSpacing: -0.2,
          }}
        >
          {UI.featuresLabel}
        </div>

        {/* -------------------------------------------------------- chips */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CHIPS_TOP,
            width: CARD_W,
            display: "flex",
            flexWrap: "wrap",
            columnGap: 15,
            rowGap: 15,
          }}
        >
          {UI.features.map((f) => {
            const isCarousels = f === "Carousels";
            return (
              <Chip
                key={f}
                label={f}
                lit={isCarousels ? lit : 0}
                ring={isCarousels && litRingOn ? litRing : 0}
                scale={isCarousels ? litScale : 1}
              />
            );
          })}
        </div>

        <Cursor x={curX} y={curY} pressed={curPressed} opacity={curOp} />
      </div>
    </AbsoluteFill>
  );
};
