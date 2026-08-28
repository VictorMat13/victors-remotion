import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, GROW, LW, PLATFORM, RN, SPRINGS, safePadX } from "./theme";

// ============================================================================
// RgP4RunableGrow — 1080x1080 @ 30fps  (1:1)
// VO [0:20-0:23]: "Here's what launched. Runable Grow. Think one employee with
//                  the skills of twenty."
//
// BEAT
//   0-14   tight on the real Build|Grow control, already mid-flip -> Grow lands
//   14-34  ONE decisive camera move: pull back off the toggle onto the whole
//          Grow surface (Easing.inOut(Easing.cubic))
//   34-74  the 17 REAL capability cards bloom outward from one centre in a
//          staggered radial wave
//   74-90  clean end hold (micro drift only)
//
// Every string on screen is authentic Runable Grow UI copy from theme.GROW.
// Nothing restates the VO. Nothing invents a capability or a number.
// ============================================================================

export const DURATION_IN_FRAMES = 90;

// ------------------------------------------------------------ world geometry
const WIN_W = 1000;
const PAD = 26;
const INNER_W = WIN_W - PAD * 2; // 948

const TOPBAR_Y = PAD;
const TOPBAR_H = 60;

const HEAD_Y = 128;

const SEC_Y0 = 214;
const SEC_PAD = 16;
const SEC_HEAD_H = 34;
const SEC_INNER_GAP = 10;
const CARD_H = 78;
const CARD_GAP = 10;
const SEC_H = SEC_PAD * 2 + SEC_HEAD_H + SEC_INNER_GAP + CARD_H; // 154
const SEC_MARGIN = 12;
const WIN_H = SEC_Y0 + 5 * SEC_H + 4 * SEC_MARGIN + PAD; // 1058

const ROW_W = INNER_W - SEC_PAD * 2; // 916
const ROW_X = PAD + SEC_PAD; // 42

// bloom centre — the single unit everything radiates out of
const ORIGIN_X = WIN_W / 2;
const ORIGIN_Y = 236;

// toggle
const TG_W = 268;
const TG_H = 52;
const TG_X = WIN_W / 2 - TG_W / 2;
const TG_Y = TOPBAR_Y + (TOPBAR_H - TG_H) / 2;
const KNOB_W = 130;
const KNOB_H = 44;

// ------------------------------------------------------------------- icons
type IconKey =
  | "openai"
  | "meta"
  | "googleAds"
  | "linkedin"
  | "tiktok"
  | "instagram"
  | "x"
  | "phone"
  | "mail"
  | "swords"
  | "leads"
  | "building"
  | "seo"
  | "aeo"
  | "mailHeart";

// Real TikTok brand colours (the mark is genuinely two-tone + black).
const TT_CYAN = "#25F4EE";
const TT_RED = "#FE2C55";

// OpenAI's mark, as it appears on the real ChatGPT Ads card.
const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

const Mono: React.FC<{ size: number; children: React.ReactNode }> = ({
  size,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={RN.textWarm}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const TikTokMark: React.FC<{ size: number }> = ({ size }) => {
  const note =
    "M13.7 3.1v10.5a2.85 2.85 0 1 1-2.5-2.83v2.35a.62.62 0 1 0 .62.62V3.1zM13.7 3.1c.35 2.4 1.9 3.9 4.4 4.15v2.5c-1.7-.05-3.2-.6-4.4-1.55z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <g transform="translate(-1.1,-1.0)">
        <path d={note} fill={TT_CYAN} />
      </g>
      <g transform="translate(1.1,1.0)">
        <path d={note} fill={TT_RED} />
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

const LinkedInMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="4.6" fill={PLATFORM.linkedin} />
    <rect x="6.1" y="9.7" width="2.7" height="8.3" fill="#FFFFFF" />
    <circle cx="7.45" cy="6.9" r="1.62" fill="#FFFFFF" />
    <path
      d="M11.1 18V9.7h2.55v1.15c.5-.85 1.5-1.4 2.75-1.4 2 0 3.2 1.3 3.2 3.6V18h-2.65v-4.4c0-1.2-.5-1.9-1.6-1.9s-1.75.8-1.75 2V18z"
      fill="#FFFFFF"
    />
  </svg>
);

const Icon: React.FC<{ name: IconKey; size?: number }> = ({
  name,
  size = 26,
}) => {
  switch (name) {
    case "openai":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d={OPENAI_PATH} fill={PLATFORM.openai} />
        </svg>
      );
    case "meta":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
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
      return <LinkedInMark size={size} />;
    case "tiktok":
      return <TikTokMark size={size} />;
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="rgp4-ig" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#FEDA75" />
              <stop offset="25%" stopColor="#FA7E1E" />
              <stop offset="55%" stopColor="#D62976" />
              <stop offset="80%" stopColor="#962FBF" />
              <stop offset="100%" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.6" fill="url(#rgp4-ig)" />
          <rect
            x="6.1"
            y="6.1"
            width="11.8"
            height="11.8"
            rx="4"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.6}
          />
          <circle
            cx="12"
            cy="12"
            r="3.05"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.6}
          />
          <circle cx="16.7" cy="7.4" r="1.05" fill="#FFFFFF" />
        </svg>
      );
    case "x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="4.6" fill="#000000" />
          <path
            d="M6.6 6.3h3.5l2.6 3.6 3.2-3.6h1.8l-4.1 4.6 4.4 6.2h-3.5l-2.8-3.9-3.5 3.9H6.4l4.4-4.9z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case "phone":
      return (
        <Mono size={size}>
          <path d="M5 4.5h3l1.4 3.4-1.9 1.4a11 11 0 0 0 5.1 5.1l1.4-1.9 3.4 1.4v3a1.6 1.6 0 0 1-1.7 1.6A13.6 13.6 0 0 1 3.4 6.2 1.6 1.6 0 0 1 5 4.5Z" />
          <path d="M16.4 8.4V4.9h-3.5" />
          <path d="M20.2 4.9 16.6 8.5" />
        </Mono>
      );
    case "mail":
      return (
        <Mono size={size}>
          <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="3" />
          <path d="M3.6 7.4 12 13.1l8.4-5.7" />
        </Mono>
      );
    case "swords":
      return (
        <Mono size={size}>
          <path d="M4.2 3.4h3l9.1 9.1-3 3-9.1-9.1z" />
          <path d="M19.8 3.4h-3l-9.1 9.1 3 3 9.1-9.1z" />
          <path d="M6.1 17.2 3.6 19.7l1.2 1.2 2.5-2.5" />
          <path d="M17.9 17.2l2.5 2.5-1.2 1.2-2.5-2.5" />
        </Mono>
      );
    case "leads":
      return (
        <Mono size={size}>
          <path d="M6 2.8h7.6L19 8.4v12.8H6z" />
          <path d="M13.4 2.8v5.8H19" />
          <circle cx="9.6" cy="14" r="0.9" />
          <circle cx="9.6" cy="17.4" r="0.9" />
          <path d="M12.6 14h3.1M12.6 17.4h3.1" />
        </Mono>
      );
    case "building":
      return (
        <Mono size={size}>
          <path d="M4.4 21.2V4.4a1.6 1.6 0 0 1 1.6-1.6h7.4a1.6 1.6 0 0 1 1.6 1.6v16.8" />
          <path d="M15 9.6h3.2a1.6 1.6 0 0 1 1.6 1.6v10" />
          <path d="M7.8 6.8h3.6M7.8 10.6h3.6M7.8 14.4h3.6M2.8 21.2h18.4" />
        </Mono>
      );
    case "seo":
      return (
        <Mono size={size}>
          <circle cx="11.2" cy="11.2" r="7.4" />
          <path d="M8.4 11.2a2.8 2.8 0 1 1 2.8 2.8" />
          <path d="M16.6 16.6 20.6 20.6" />
        </Mono>
      );
    case "aeo":
      return (
        <Mono size={size}>
          <path d="M2.8 12.6s3.3-5.8 8.2-5.8 8.2 5.8 8.2 5.8-3.3 5.8-8.2 5.8-8.2-5.8-8.2-5.8Z" />
          <circle cx="11" cy="12.6" r="2.5" />
          <path d="M17.6 6.6h3.6M19.4 4.8v3.6" />
        </Mono>
      );
    case "mailHeart":
      return (
        <Mono size={size}>
          <path d="M2.8 8.4a3 3 0 0 1 3-3h12.4a3 3 0 0 1 3 3v7.2a3 3 0 0 1-3 3H5.8a3 3 0 0 1-3-3z" />
          <path d="M3.6 8.4 12 14.1l8.4-5.7" />
          <path d="M12 20.6c-1.9-1.3-3-2.3-3-3.4a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.1-1.1 2.1-3 3.4Z" />
        </Mono>
      );
    default:
      return null;
  }
};

// ------------------------------------------------------------- scene content
type CardDef = {
  label: string;
  icon: IconKey;
  x: number;
  y: number;
  w: number;
  badge?: string;
};

type SectionDef = {
  title: string;
  y: number;
  cards: CardDef[];
};

const buildSections = (): SectionDef[] => {
  const groups: {
    title: string;
    items: readonly string[];
    icons: IconKey[];
    badgeAt?: number;
  }[] = [
    {
      title: GROW.sections.ads,
      items: GROW.ads,
      icons: ["openai", "meta", "googleAds", "linkedin", "tiktok"],
      badgeAt: 0,
    },
    {
      title: GROW.sections.social,
      items: GROW.social,
      icons: ["instagram", "linkedin", "x", "tiktok"],
    },
    {
      title: GROW.sections.outreach,
      items: GROW.outreach,
      icons: ["phone", "mail"],
    },
    {
      title: GROW.sections.listening,
      items: GROW.listening,
      icons: ["swords", "leads", "building"],
    },
    {
      title: GROW.sections.organic,
      items: GROW.organic,
      icons: ["seo", "aeo", "mailHeart"],
    },
  ];

  return groups.map((g, i) => {
    const sy = SEC_Y0 + i * (SEC_H + SEC_MARGIN);
    const cols = g.items.length;
    const cw = (ROW_W - (cols - 1) * CARD_GAP) / cols;
    const cy = sy + SEC_PAD + SEC_HEAD_H + SEC_INNER_GAP;
    const cards: CardDef[] = g.items.map((label, j) => ({
      label,
      icon: g.icons[j],
      x: ROW_X + j * (cw + CARD_GAP),
      y: cy,
      w: cw,
      badge: g.badgeAt === j ? GROW.adsBadge : undefined,
    }));
    return { title: g.title, y: sy, cards };
  });
};

const SECTIONS = buildSections();

// flat card list ranked by distance from the bloom origin -> radial wave order
const FLAT: { card: CardDef; rank: number }[] = (() => {
  const all: { card: CardDef; d: number }[] = [];
  SECTIONS.forEach((s) => {
    s.cards.forEach((c) => {
      const cx = c.x + c.w / 2;
      const cy = c.y + CARD_H / 2;
      all.push({ card: c, d: Math.hypot(cx - ORIGIN_X, cy - ORIGIN_Y) });
    });
  });
  const sorted = all.slice().sort((a, b) => a.d - b.d);
  return all.map((entry) => ({
    card: entry.card,
    rank: sorted.indexOf(entry),
  }));
})();

// FLAT.length === 17 — every real capability card on the live Grow home.

const Chevron: React.FC = () => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke={RN.muted}
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </svg>
);

// ------------------------------------------------------------------ the comp
export const RgP4RunableGrow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const SAFE = safePadX(width); // 54 on 1080 — 5% side margin
  // final zoom can never let the 1000px-wide window breach the safe margin
  const fitZ = Math.min(
    0.9,
    (width - SAFE * 2) / WIN_W,
    (height - SAFE * 2) / WIN_H,
  );

  const ease = Easing.inOut(Easing.cubic);
  const KEY_T = [0, 14, 34, 74, DURATION_IN_FRAMES];

  const fx = interpolate(frame, KEY_T, [500, 500, 500, 500, 500], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, [120, 120, WIN_H / 2, WIN_H / 2, WIN_H / 2], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const z = interpolate(
    frame,
    KEY_T,
    [2.2, 2.2, fitZ, fitZ * 0.988, fitZ * 0.985],
    {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // ---- toggle: already mid-flip at frame 0, settles inside the opening hold
  const knob = spring({
    frame: frame + 4,
    fps,
    config: SPRINGS.snappy,
  });
  const knobX = interpolate(knob, [0, 1], [4, TG_W - KNOB_W - 4]);
  const buildDim = interpolate(knob, [0, 1], [1, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const growDim = interpolate(knob, [0, 1], [0.45, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // click residue: the press already happened, the ripple is dying out
  const ripple = interpolate(frame, [0, 13], [0.6, 1.6], {
    extrapolateRight: "clamp",
  });
  const rippleOp = interpolate(frame, [0, 13], [0.32, 0], {
    extrapolateRight: "clamp",
  });
  const cursorOp = interpolate(frame, [0, 5, 14], [0.92, 0.9, 0], {
    extrapolateRight: "clamp",
  });
  const cursorLift = interpolate(frame, [0, 14], [0, -16], {
    extrapolateRight: "clamp",
  });

  // ---- 5% safe-margin gate ------------------------------------------------
  // While the camera is still wide, the surface is bigger than the frame. No
  // element that carries meaning is allowed to show until IT fits inside the
  // 54px safe margin, so nothing is ever clipped by the frame edge.
  const marginLimit = width / 2 - SAFE; // 486 on 1080
  const fitGate = (halfWidthFromCentre: number) =>
    interpolate(
      halfWidthFromCentre * z,
      [marginLimit * 0.99, marginLimit * 1.06],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

  const headGate = fitGate(290); // half the rendered headline
  const surfaceGate = fitGate(INNER_W / 2); // panels, cards, credits pill

  // ---- headline lands as the camera settles
  const headIn = spring({
    frame: frame - 20,
    fps,
    config: SPRINGS.smooth,
    durationInFrames: 18,
  });

  // ---- gentle life during the end hold (active pill breathes)
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * 1.5 * Math.PI);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: LW.paper,
        fontFamily: FONT_SANS,
      }}
    >
      {/* warm floor gradient — backgrounds bleed full frame */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(128% 96% at 50% 4%, ${LW.paper} 0%, ${LW.paper} 44%, ${LW.paperDeep} 100%)`,
        }}
      />

      {/* ---------------------------------------------------------- camera */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WIN_W,
            height: WIN_H,
            transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
            transformOrigin: `${fx}px ${fy}px`,
          }}
        >
          {/* window card — the one unit */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: WIN_W,
              height: WIN_H,
              borderRadius: 34,
              backgroundColor: LW.card,
              border: `1px solid ${LW.hairline}`,
              boxShadow: LW.shadowLift,
            }}
          />

          {/* -------------------------------------------------- credits pill */}
          <div
            style={{
              position: "absolute",
              left: WIN_W - PAD - 122,
              top: TOPBAR_Y + (TOPBAR_H - 44) / 2,
              width: 122,
              height: 44,
              borderRadius: 22,
              backgroundColor: RN.amberSoft,
              border: `1px solid rgba(222,155,74,${0.24 + 0.14 * breathe})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              opacity: surfaceGate,
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <ellipse
                cx="12"
                cy="8.4"
                rx="7.4"
                ry="3.5"
                stroke={RN.amber}
                strokeWidth={1.7}
              />
              <path
                d="M4.6 8.4v6.6c0 1.95 3.3 3.5 7.4 3.5s7.4-1.55 7.4-3.5V8.4"
                stroke={RN.amber}
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: 21,
                fontWeight: 500,
                color: RN.amber,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {GROW.credits}
            </span>
          </div>

          {/* --------------------------------------------- Build | Grow control */}
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
            }}
          >
            {/* click ripple on the Grow half — sits under the control chrome */}
            <div
              style={{
                position: "absolute",
                left: TG_W - KNOB_W / 2 - 4 - 46,
                top: TG_H / 2 - 46,
                width: 92,
                height: 92,
                borderRadius: 46,
                border: `2px solid ${RN.amber}`,
                opacity: rippleOp,
                transform: `scale(${ripple})`,
              }}
            />

            {/* active knob */}
            <div
              style={{
                position: "absolute",
                left: knobX,
                top: (TG_H - KNOB_H) / 2,
                width: KNOB_W,
                height: KNOB_H,
                borderRadius: KNOB_H / 2,
                backgroundColor: RN.card,
                boxShadow: `0 2px 8px rgba(23,20,14,0.12), 0 0 0 ${
                  0.8 + 0.7 * breathe
                }px rgba(222,155,74,${0.05 + 0.05 * breathe})`,
              }}
            />
            {/* labels */}
            <div
              style={{
                position: "absolute",
                left: 4,
                top: 0,
                width: KNOB_W,
                height: TG_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: buildDim,
                color: RN.text,
              }}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke={RN.text}
                strokeWidth={1.8}
                strokeLinejoin="round"
              >
                <rect x="3.4" y="3.4" width="7.6" height="7.6" rx="2" />
                <rect x="13" y="3.4" width="7.6" height="7.6" rx="2" />
                <rect x="3.4" y="13" width="7.6" height="7.6" rx="2" />
                <rect x="13" y="13" width="7.6" height="7.6" rx="2" />
              </svg>
              <span style={{ fontSize: 23, fontWeight: 500 }}>
                {GROW.toggle[0]}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: TG_W - KNOB_W - 4,
                top: 0,
                width: KNOB_W,
                height: TG_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: growDim,
                color: RN.text,
              }}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke={RN.text}
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M4.6 19.4V13" />
                <path d="M11.6 19.4V8.4" />
                <path d="M18.6 19.4V4.6" />
              </svg>
              <span style={{ fontSize: 23, fontWeight: 500 }}>
                {GROW.toggle[1]}
              </span>
            </div>

          </div>

          {/* cursor lifting off the control */}
          <svg
            width={34}
            height={40}
            viewBox="0 0 24 28"
            style={{
              position: "absolute",
              left: TG_X + TG_W - KNOB_W / 2 - 4 + 6,
              top: TG_Y + TG_H / 2 + 6 + cursorLift,
              opacity: cursorOp,
              filter: "drop-shadow(0 3px 6px rgba(23,20,14,0.28))",
            }}
          >
            <path
              d="M3 2.2 3 20.4l4.6-4.4 3.1 7.1 3.6-1.6-3.1-7 6.2-.4z"
              fill={LW.ink}
              stroke="#FFFFFF"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>

          {/* ------------------------------------------------------- headline */}
          <div
            style={{
              position: "absolute",
              left: PAD,
              top: HEAD_Y,
              width: INNER_W,
              textAlign: "center",
              fontSize: 52,
              lineHeight: "64px",
              fontWeight: 400,
              letterSpacing: "-0.5px",
              color: RN.textWarm,
              opacity: headIn * headGate,
              transform: `translateY(${(1 - headIn) * 20}px)`,
            }}
          >
            {GROW.heading}
          </div>

          {/* ------------------------------------------------ section panels */}
          {SECTIONS.map((s, i) => {
            const t = spring({
              frame: frame - (26 + i * 2.5),
              fps,
              config: SPRINGS.smooth,
              durationInFrames: 18,
            });
            return (
              <div
                key={s.title}
                style={{
                  position: "absolute",
                  left: PAD,
                  top: s.y,
                  width: INNER_W,
                  height: SEC_H,
                  borderRadius: 22,
                  backgroundColor: RN.panel,
                  border: `1px solid ${RN.border}`,
                  opacity: t * surfaceGate,
                  transform: `translateY(${(1 - t) * 16}px) scale(${0.985 + 0.015 * t})`,
                  transformOrigin: `${INNER_W / 2}px 0px`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: SEC_PAD,
                    top: SEC_PAD,
                    width: ROW_W,
                    height: SEC_HEAD_H,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 27,
                      fontWeight: 500,
                      color: RN.textWarm,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {s.title}
                  </span>
                  <Chevron />
                </div>
              </div>
            );
          })}

          {/* ------------------------------- capability cards — radial bloom */}
          {FLAT.map(({ card, rank }) => {
            const delay = 33 + rank * 1.5;
            const t = spring({
              frame: frame - delay,
              fps,
              config: { damping: 20, stiffness: 190 },
            });
            const cx = card.x + card.w / 2;
            const cy = card.y + CARD_H / 2;
            const dx = (cx - ORIGIN_X) * (t - 1) * 0.18;
            const dy = (cy - ORIGIN_Y) * (t - 1) * 0.18;
            const s = 0.88 + 0.12 * t;
            const op = interpolate(t, [0.08, 0.55], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={`${card.label}-${card.x}-${card.y}`}
                style={{
                  position: "absolute",
                  left: card.x,
                  top: card.y,
                  width: card.w,
                  height: CARD_H,
                  borderRadius: 15,
                  backgroundColor: RN.card,
                  border: `1px solid ${RN.border}`,
                  boxShadow: "0 1px 2px rgba(23,20,14,0.04)",
                  opacity: op * surfaceGate,
                  transform: `translate(${dx}px, ${dy}px) scale(${s})`,
                  transformOrigin: "center center",
                  padding: "13px 15px",
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
                  }}
                >
                  <Icon name={card.icon} size={25} />
                  {card.badge ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: RN.amber,
                        backgroundColor: RN.amberSoft,
                        borderRadius: 8,
                        padding: "3px 7px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 500,
                    color: RN.text,
                    letterSpacing: "-0.2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
