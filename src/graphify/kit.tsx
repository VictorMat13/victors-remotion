/**
 * Graphify shared kit — Liam system, DARK variant.
 *
 * Sibling of `src/openseo/kit.tsx`. Theme-agnostic primitives (camera rig,
 * counters, typewriter, springs, safe margins) are imported from there and
 * re-exported, so there is exactly one implementation of each. Only the
 * palette and the surfaces that paint it are overridden here.
 *
 * BLACK-FRAME SAFETY (hard rule):
 *   scripts/check-black-frames.sh runs blackdetect pic_th=0.98 pix_th=0.10.
 *   A pixel counts as black at normalised luma <= 0.10. Measured:
 *     #0B0F0D -> 0.053  FLAGS
 *     #131815 -> 0.087  FLAGS
 *     #1A211C -> 0.119  safe
 *     #1E241F -> 0.132  safe  <-- BG, chosen for margin
 *   GraphWorld also paints a radial lift and a visible grid, so the frame
 *   never reaches 98% uniformity either. Two independent guards.
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont();
const { fontFamily: monoFamily } = loadMono();

export const FONT = fontFamily;
export const MONO = monoFamily;

// Theme-agnostic machinery — one implementation, shared with the paper set.
export {
  useCam,
  useCountUp,
  useTypewriter,
  tabular,
  fmt,
  safePadX,
  innerW,
  SPRINGS,
  EASE,
  useEnter,
  Cursor,
} from "../openseo/kit";
export type { Cam } from "../openseo/kit";

// ---------------------------------------------------------------------------
// Palette — dark
// ---------------------------------------------------------------------------

export const G = {
  /** Green-undertone charcoal. Normalised luma 0.132 — clears the detector. */
  bg: "#1E241F",
  panel: "#232B25",
  card: "#262F28",
  cardHi: "#2C362E",
  /** Terminal sits a step BELOW the base so it reads as recessed. */
  term: "#171D19",
  termBar: "#1E251F",

  line: "rgba(255,255,255,0.09)",
  lineSoft: "rgba(255,255,255,0.05)",
  lineStrong: "rgba(255,255,255,0.16)",

  text: "#F2F5F3",
  muted: "#93A099",
  faint: "#5F6B64",

  /** Graphify green, brightened to hold on dark. */
  accent: "#5EE0A0",
  accentDim: "#3FA877",
  accentSoft: "rgba(94,224,160,0.12)",
  accentLine: "rgba(94,224,160,0.34)",

  amber: "#E0B45E",
  amberSoft: "rgba(224,180,94,0.12)",
  amberLine: "rgba(224,180,94,0.34)",

  red: "#E8705F",
} as const;

/** Accent at a given alpha. */
export const accentA = (a: number) => `rgba(94,224,160,${a})`;
/** Amber (INFERRED edges) at a given alpha. */
export const amberA = (a: number) => `rgba(224,180,94,${a})`;

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export const GA = {
  /** Graphify's real mark: black node-link graph forming a G, green gradient tile. */
  mark: "graphify/avatar.png",
  /** Real GitHub OG card — 100k stars / 10k forks / 202 contributors. */
  githubCard: "graphify/gh-social.png",
  logo: {
    claude: "graphify/logos/claude.svg",
    codex: "graphify/logos/codex.svg",
    gemini: "graphify/logos/gemini.svg",
    github: "graphify/logos/github-light.svg",
    python: "graphify/logos/python.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Surfaces — dark equivalents of PaperWorld / PaperBase / Card
// Same signatures as the paper kit so camera code and beat maps port over.
// ---------------------------------------------------------------------------

type Cam3 = { fx: number; fy: number; z: number };

/**
 * Opaque dark base + radial lift + light-on-dark grid + camera transform.
 *
 * The outermost AbsoluteFill paints G.bg for the FULL duration. Never wrap a
 * composition in a Sequence that starts after frame 0.
 */
export const GraphWorld: React.FC<{
  cam: Cam3;
  children: React.ReactNode;
  grid?: { left: number; top: number; width: number; height: number };
  gridSize?: number;
  bg?: string;
  /** Screen-space radial lift; keeps the frame off 98% uniformity. */
  lift?: number;
}> = ({ cam, children, grid, gridSize = 56, bg = G.bg, lift = 1 }) => {
  const { width, height } = useVideoConfig();
  const g = grid ?? { left: -1400, top: -1400, width: 4600, height: 5200 };

  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: FONT }}>
      {/* Screen-space lift — sits under the world so it never scales away. */}
      {lift > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(closest-side at 50% 44%, rgba(94,224,160,${0.055 * lift}), rgba(94,224,160,0) 72%)`,
          }}
        />
      ) : null}
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
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Static dark base for compositions that genuinely want no camera move. */
export const GraphBase: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = G.bg,
}) => (
  <AbsoluteFill style={{ backgroundColor: bg, fontFamily: FONT }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(closest-side at 50% 44%, rgba(94,224,160,0.055), rgba(94,224,160,0) 72%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    />
    {children}
  </AbsoluteFill>
);

/**
 * Dark card. Depth comes from the value step bg -> card plus a border.
 * No glow, no coloured shadow — see the series no-glow rule.
 */
export const GCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  r?: number;
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
      background: G.card,
      border: `1.5px solid ${accent ? G.accentLine : G.line}`,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 26}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const GChip: React.FC<{
  label: string;
  tone?: "neutral" | "accent" | "amber" | "red";
  size?: number;
  style?: React.CSSProperties;
}> = ({ label, tone = "neutral", size = 26, style }) => {
  const tones = {
    neutral: { bg: "rgba(255,255,255,0.05)", fg: G.muted, bd: G.line },
    accent: { bg: G.accentSoft, fg: G.accent, bd: G.accentLine },
    amber: { bg: G.amberSoft, fg: G.amber, bd: G.amberLine },
    red: { bg: "rgba(232,112,95,0.12)", fg: G.red, bd: "rgba(232,112,95,0.34)" },
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

/** Graphify's real tile. Its own green gradient reads as lit on the dark base. */
export const GraphifyMark: React.FC<{
  size: number;
  style?: React.CSSProperties;
}> = ({ size, style }) => (
  <Img
    src={staticFile(GA.mark)}
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      display: "block",
      ...style,
    }}
  />
);

export const GraphifyLockup: React.FC<{
  size?: number;
  gap?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 84, gap = 22, color = G.text, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
    <GraphifyMark size={size} />
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size * 0.72,
        color,
        letterSpacing: -1.2,
      }}
    >
      Graphify
    </div>
  </div>
);

export const GLogo: React.FC<{
  src: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ src, size, style }) => (
  <Img
    src={staticFile(src)}
    style={{ width: size, height: size, objectFit: "contain", display: "block", ...style }}
  />
);

/** Dark terminal panel. Recessed below the base rather than raised. */
export const GTerminal: React.FC<{
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
      background: G.term,
      border: `1.5px solid ${G.line}`,
      overflow: "hidden",
      opacity: enter,
      transform: `translateY(${(1 - enter) * 24}px)`,
    }}
  >
    <div
      style={{
        height: 62,
        background: G.termBar,
        borderBottom: `1.5px solid ${G.lineSoft}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 24px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{ width: 13, height: 13, borderRadius: 999, background: "#39443B" }}
        />
      ))}
      <div
        style={{
          marginLeft: 14,
          fontFamily: monoFamily,
          fontSize: 22,
          color: G.faint,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{ padding: "26px 30px", fontFamily: monoFamily }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// The shared knowledge graph — ONE object carried across four clips.
//
// Node positions are FIXED so §1's resolve, §3's assemble-into-the-G, §4's
// growth and §5's fan-out are all literally the same graph. That continuity is
// what makes the set read as authored rather than five separate clips.
// ---------------------------------------------------------------------------

export type GNode = {
  id: string;
  x: number;
  y: number;
  /** code nodes exist from §1; the rest join in §4 */
  kind: "code" | "doc" | "sql" | "config" | "pdf";
  label?: string;
  /** relative size 0.6..1.4 */
  r?: number;
};

export type GEdge = {
  a: string;
  b: string;
  /** Graphify labels every edge EXTRACTED (in source) or INFERRED (resolved). */
  rel: "EXTRACTED" | "INFERRED";
};

/**
 * Canonical layout, world coords, centred on (0,0).
 * Loosely echoes the mark: a dense hexagonal cluster with a small
 * satellite group to the right forming the notch of the "G".
 */
export const GRAPH_NODES: GNode[] = [
  { id: "app", x: 0, y: -170, kind: "code", label: "app.ts", r: 1.25 },
  { id: "auth", x: -190, y: -60, kind: "code", label: "auth.ts", r: 1.1 },
  { id: "session", x: 0, y: -30, kind: "code", label: "session.ts", r: 1.0 },
  { id: "router", x: 195, y: -70, kind: "code", label: "router.ts", r: 1.0 },
  { id: "mw", x: -105, y: 75, kind: "code", label: "middleware.ts", r: 0.95 },
  { id: "db", x: -190, y: 175, kind: "code", label: "db.ts", r: 1.05 },
  { id: "user", x: 25, y: 180, kind: "code", label: "user.ts", r: 0.95 },
  { id: "api", x: 0, y: 300, kind: "code", label: "api.ts", r: 0.9 },
  // satellite cluster — the notch of the G
  { id: "queue", x: 250, y: 95, kind: "code", label: "queue.ts", r: 0.85 },
  { id: "worker", x: 200, y: 190, kind: "code", label: "worker.ts", r: 0.8 },
  // joins in §4
  { id: "readme", x: -320, y: -180, kind: "doc", label: "README.md", r: 0.9 },
  { id: "schema", x: -330, y: 285, kind: "sql", label: "schema.sql", r: 0.95 },
  { id: "cfg", x: 330, y: -195, kind: "config", label: "config.yaml", r: 0.85 },
  { id: "spec", x: 345, y: 300, kind: "pdf", label: "spec.pdf", r: 0.85 },
];

export const GRAPH_EDGES: GEdge[] = [
  { a: "app", b: "auth", rel: "EXTRACTED" },
  { a: "app", b: "session", rel: "EXTRACTED" },
  { a: "app", b: "router", rel: "EXTRACTED" },
  { a: "auth", b: "session", rel: "EXTRACTED" },
  { a: "auth", b: "mw", rel: "INFERRED" },
  { a: "session", b: "mw", rel: "EXTRACTED" },
  { a: "mw", b: "db", rel: "INFERRED" },
  { a: "db", b: "user", rel: "EXTRACTED" },
  { a: "user", b: "api", rel: "EXTRACTED" },
  { a: "router", b: "queue", rel: "EXTRACTED" },
  { a: "queue", b: "worker", rel: "EXTRACTED" },
  { a: "session", b: "user", rel: "INFERRED" },
  { a: "readme", b: "app", rel: "INFERRED" },
  { a: "schema", b: "db", rel: "EXTRACTED" },
  { a: "cfg", b: "router", rel: "EXTRACTED" },
  { a: "spec", b: "api", rel: "INFERRED" },
];

export const nodeById = (id: string) =>
  GRAPH_NODES.find((n) => n.id === id) as GNode;

export const KIND_COLOR: Record<GNode["kind"], string> = {
  code: G.accent,
  doc: "#8FB4E0",
  sql: "#C79BE8",
  config: "#E0B45E",
  pdf: "#E8705F",
};
