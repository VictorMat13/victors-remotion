/**
 * OpenSEO shared style kit — Paper Liam × OpenSEO brand.
 *
 * Every OpenSEO composition imports from here so the six clips read as ONE
 * visual system. Do not fork the palette or re-implement the camera rig.
 *
 * Brand values below were sampled directly from openseo.so (2026-08-01):
 *   body background   rgb(245, 241, 236)  #F5F1EC
 *   body ink          rgb(10, 10, 10)     #0A0A0A
 *   accent (series)   rgb( 37, 99,235)     #2563EB  (app primary)
 *   warm band         rgb(238, 232, 222)  #EEE8DE
 *   deep band         rgb(227, 220, 205)  #E3DCCD
 *   font              Inter
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont();
const { fontFamily: monoFamily } = loadMono();

export const FONT = fontFamily;
export const MONO = monoFamily;

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const C = {
  paper: "#F5F1EC",
  paperWarm: "#EEE8DE",
  paperDeep: "#E3DCCD",
  card: "#FFFFFF",
  ink: "#0A0A0A",
  ink2: "#191714",
  muted: "#6B7280",
  mutedSoft: "#9AA0A6",
  line: "#E5DED3",
  lineSoft: "#EFEAE2",
  // Series accent. Sampled from OpenSEO's own app primary button (#2563EB).
  // `orange*` keys keep their names so every composition keeps compiling —
  // they are the ACCENT, and the accent is blue.
  orange: "#2563EB",
  orangeSoft: "rgba(37,99,235,0.10)",
  orangeLine: "rgba(37,99,235,0.32)",
  blue: "#2563EB",
  green: "#16A34A",
  greenSoft: "rgba(22,163,74,0.10)",
  red: "#DC2626",
  redSoft: "rgba(220,38,38,0.08)",
  term: "#1B1A18",
  termBar: "#252320",
  termText: "#E8E4DE",
  termMuted: "#8C877E",
} as const;

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200 },
  smooth: { damping: 200, stiffness: 100 },
  bouncy: { damping: 11, stiffness: 160 },
  pop: { damping: 13, stiffness: 190 },
  heavy: { damping: 16, stiffness: 80, mass: 1.6 },
} as const;

export const EASE = Easing.inOut(Easing.cubic);

// ---------------------------------------------------------------------------
// Assets (all real, downloaded from openseo.so / github / brand CDNs)
// ---------------------------------------------------------------------------

export const A = {
  /** Dark rounded tile with the silver pine mark — OpenSEO's real app icon. */
  openseoTile: "openseo/openseo-icon-256.png",
  openseoFavicon: "openseo/favicon.png",
  /** GitHub social card for every-app/open-seo (10k stars, real). */
  githubCard: "openseo/gh-social.png",
  socialCard: "openseo/social-card.png",
  shots: {
    hero: "openseo/shots/site-hero.png",
    mcp: "openseo/shots/site-mcp.png",
    openSource: "openseo/shots/site-opensource.png",
    keywords: "openseo/shots/app-keywords.png",
    features: "openseo/shots/site-features.png",
    pricing: "openseo/shots/site-pricing-estimator.png",
  },
  logo: {
    semrush: "openseo/logos/semrush-color.svg",
    semrushMuted: "openseo/logos/semrush-muted.svg",
    semrushInk: "openseo/logos/semrush-ink.svg",
    ahrefs: "openseo/logos/ahrefs.svg",
    ahrefsMuted: "openseo/logos/ahrefs-muted.svg",
    ahrefsInk: "openseo/logos/ahrefs-ink.svg",
    github: "openseo/logos/github-ink.svg",
    docker: "openseo/logos/docker-color.svg",
    gsc: "openseo/logos/gsc-color.svg",
    claude: "openseo/logos/claude-color.svg",
    claudePng: "fable5/claude-logo.png",
    claudeCode: "bluehost/claudecode-logo.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Safe margins — 5% left/right is a hard rule (54px on a 1080 canvas)
// ---------------------------------------------------------------------------

export const safePadX = (width: number) => Math.round(width * 0.05);
export const innerW = (width: number) => width - safePadX(width) * 2;

// ---------------------------------------------------------------------------
// Camera rig — one continuous world, one keyframed camera.
//
//   const cam = useCam({ keys: [0, 40, 60, ...], fx: [...], fy: [...], z: [...] });
//   <PaperWorld cam={cam}> ...world coords... </PaperWorld>
//
// fx/fy are focal points in WORLD coordinates; z is zoom (1 = 1:1).
// ---------------------------------------------------------------------------

export type Cam = { fx: number; fy: number; z: number };

export const useCam = ({
  keys,
  fx,
  fy,
  z,
}: {
  keys: number[];
  fx: number[];
  fy: number[];
  z: number[];
}): Cam => {
  const frame = useCurrentFrame();
  const opts = {
    easing: EASE,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  return {
    fx: interpolate(frame, keys, fx, opts),
    fy: interpolate(frame, keys, fy, opts),
    z: interpolate(frame, keys, z, opts),
  };
};

/**
 * Opaque paper base + bleeding graph grid + camera transform.
 *
 * The outermost AbsoluteFill paints C.paper for the FULL duration, which is
 * what guarantees no black frames. Children are laid out in world coordinates.
 */
export const PaperWorld: React.FC<{
  cam: Cam;
  children: React.ReactNode;
  /** World bounds for the grid bleed. Defaults comfortably oversize. */
  grid?: { left: number; top: number; width: number; height: number };
  gridSize?: number;
  bg?: string;
}> = ({ cam, children, grid, gridSize = 56, bg = C.paper }) => {
  const { width, height } = useVideoConfig();
  const g = grid ?? {
    left: -1400,
    top: -1400,
    width: 4600,
    height: 5200,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${cam.z}) translate(${-cam.fx}px, ${-cam.fy}px)`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: g.left,
            top: g.top,
            width: g.width,
            height: g.height,
            backgroundImage:
              "linear-gradient(rgba(25,23,20,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.035) 1px, transparent 1px)",
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Static paper base for compositions that genuinely want no camera move. */
export const PaperBase: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = C.paper,
}) => (
  <AbsoluteFill style={{ backgroundColor: bg, fontFamily: FONT }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(25,23,20,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(25,23,20,0.035) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    />
    {children}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  r?: number;
  /** 0 → hidden, 1 → fully settled. Drive with spring(). */
  enter?: number;
  accent?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, r = 26, enter = 1, accent = false, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r,
      background: C.card,
      border: `1.5px solid ${accent ? C.orangeLine : C.line}`,
      // No coloured glow anywhere in this series — accent reads through
      // borders, fills and chips only. Depth is a neutral shadow.
      boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
      opacity: enter,
      transform: `translateY(${(1 - enter) * 26}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{
  label: string;
  tone?: "neutral" | "orange" | "green" | "red";
  size?: number;
  style?: React.CSSProperties;
}> = ({ label, tone = "neutral", size = 26, style }) => {
  const tones = {
    neutral: { bg: "#F3F0EA", fg: C.muted, bd: C.line },
    orange: { bg: C.orangeSoft, fg: C.orange, bd: C.orangeLine },
    green: { bg: C.greenSoft, fg: C.green, bd: "rgba(22,163,74,0.30)" },
    red: { bg: C.redSoft, fg: C.red, bd: "rgba(220,38,38,0.28)" },
  }[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: `${Math.round(size * 0.42)}px ${Math.round(size * 0.78)}px`,
        borderRadius: 999,
        background: tones.bg,
        border: `1.5px solid ${tones.bd}`,
        color: tones.fg,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 0.6,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </div>
  );
};

/** OpenSEO's real app tile (dark square, silver pine). */
export const OpenSeoMark: React.FC<{
  size: number;
  style?: React.CSSProperties;
}> = ({ size, style }) => (
  <Img
    src={staticFile(A.openseoTile)}
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      display: "block",
      ...style,
    }}
  />
);

/** OpenSEO tile + wordmark, matching the site header lockup. */
export const OpenSeoLockup: React.FC<{
  size?: number;
  color?: string;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ size = 84, color = C.ink, gap = 22, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
    <OpenSeoMark size={size} />
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size * 0.72,
        color,
        letterSpacing: -1.2,
      }}
    >
      OpenSEO
    </div>
  </div>
);

export const LogoImg: React.FC<{
  src: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ src, size, style }) => (
  <Img
    src={staticFile(src)}
    style={{ width: size, height: size, objectFit: "contain", display: "block", ...style }}
  />
);

// ---------------------------------------------------------------------------
// Terminal — mirrors the dark MCP panel on openseo.so
// ---------------------------------------------------------------------------

export const TerminalPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  enter?: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, enter = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 22,
      background: C.term,
      boxShadow: "0 30px 70px rgba(25,23,20,0.22)",
      overflow: "hidden",
      opacity: enter,
      transform: `translateY(${(1 - enter) * 24}px)`,
    }}
  >
    <div
      style={{
        height: 62,
        background: C.termBar,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 24px",
      }}
    >
      {["#4A4741", "#4A4741", "#4A4741"].map((c, i) => (
        <div
          key={i}
          style={{ width: 13, height: 13, borderRadius: 999, background: c }}
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
        {title}
      </div>
    </div>
    <div style={{ padding: "26px 30px", fontFamily: MONO }}>{children}</div>
  </div>
);

/** Typewriter that reveals a string by slicing (never per-char spans). */
export const useTypewriter = (
  text: string,
  startFrame: number,
  charsPerFrame = 1.6,
) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor((frame - startFrame) * charsPerFrame));
  return text.slice(0, Math.min(n, text.length));
};

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export const tabular: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum"',
};

export const useCountUp = ({
  to,
  start,
  duration,
  from = 0,
}: {
  to: number;
  start: number;
  duration: number;
  from?: number;
}) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + duration], [from, to], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Cursor — matches the arrow used in prior approved renders
// ---------------------------------------------------------------------------

export const Cursor: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 1,
}) => (
  <svg
    width={40 * scale}
    height={52 * scale}
    viewBox="0 0 20 26"
    style={{ position: "absolute", left: x, top: y, opacity, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}
  >
    <path d="M1 1 L1 20 L6 15.5 L9.5 23.5 L13 22 L9.5 14 L16 13.5 Z" fill="#fff" stroke="#0A0A0A" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Entrance helper — staggered spring in one line
// ---------------------------------------------------------------------------

export const useEnter = (at: number, config = SPRINGS.pop) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config });
};
