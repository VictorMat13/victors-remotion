/**
 * Google Tools shared kit — Paper Liam × Google.
 *
 * Series: "5 Free Google AI Tools" (Pomelli · Stitch · Opal · Antigravity ·
 * Mixboard). Re-exports the approved OpenSEO paper kit (palette, camera rig,
 * Card, Chip, TerminalPanel, counters) and layers the Google brand plus the
 * five per-tool identities on top. Brand values sampled directly from the
 * live product sites (2026-08-09):
 *
 *   Google blue    #4285F4   red #EA4335   yellow #FBBC05   green #34A853
 *   Pomelli        dark olive #181D00, cream #F2EFDF (labs.google.com/pomelli)
 *   Stitch         near-black icon tile #0A0A0C (gstatic favicon-512)
 *   Opal           periwinkle #665EF6 (opal.google favicon pentagon)
 *   Antigravity    ink wordmark + blue-gradient arc (antigravity.google)
 *   Mixboard       lavender board #E3E6FD (labs.google.com/mixboard)
 *
 * Every Gt* composition imports from HERE so the seven clips read as one
 * system. Paper base stays; Google blue is the series accent.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { C } from "../openseo/kit";

export * from "../openseo/kit";

const { fontFamily: figtreeFamily } = loadFigtree();

/**
 * Display face for headline-scale type. Figtree is the closest Google-Sans
 * lookalike on Google Fonts — geometric, slightly rounded. Use 600/700.
 */
export const DISPLAY = figtreeFamily;

// ---------------------------------------------------------------------------
// Series accent — Google. Use GOOGLE.blue instead of C.orange in this series.
// ---------------------------------------------------------------------------

export const GOOGLE = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
  blueSoft: "rgba(66,133,244,0.10)",
  blueLine: "rgba(66,133,244,0.34)",
} as const;

/** The canonical four-dot order for Google-flavored accents. */
export const GOOGLE_FOUR = [
  GOOGLE.blue,
  GOOGLE.red,
  GOOGLE.yellow,
  GOOGLE.green,
] as const;

// ---------------------------------------------------------------------------
// Per-tool brand values (sampled from live sites 2026-08-09)
// ---------------------------------------------------------------------------

export const BRAND = {
  pomelli: {
    bg: "#181D00", // dark olive page background
    cream: "#F2EFDF", // serif wordmark color
    sage: "#C9D2A3", // accent used on their "Aa" specimen
  },
  stitch: { tile: "#0A0A0C" },
  opal: { periwinkle: "#665EF6", soft: "rgba(102,94,246,0.12)" },
  antigravity: { ink: "#121317" },
  mixboard: {
    lavender: "#E3E6FD",
    lavenderDeep: "#C9CFF9",
    purple: "#8B7CF6", // "Get started" button
  },
} as const;

// ---------------------------------------------------------------------------
// Assets (real — pulled from official sites/CDNs 2026-08-09).
// Small favicons (32-48px) are NOT listed: never scale those up on screen.
// ---------------------------------------------------------------------------

export const GT = {
  logos: {
    /** Real Google "G" (existing shared asset). */
    google: "logos/google.svg",
    /** Real Stitch app icon, 512px (dark tile, white pill mark). */
    stitch: "google-tools/logos/stitch.png",
    /** Real "Google Antigravity" header lockup (vector, ink text + blue arc). */
    antigravityLockup: "google-tools/logos/antigravity-lockup.svg",
    /** Arc mark only, cropped from the lockup vector. */
    antigravityMark: "google-tools/logos/antigravity-mark.svg",
    /** Real "Opal" wordmark cropped from opal.google share card (ink on white). */
    opalWordmark: "google-tools/logos/opal-wordmark.png",
    /** Real serif "Pomelli" wordmark crop — cream on dark olive. Keep on olive. */
    pomelliWordmark: "google-tools/logos/pomelli-wordmark.png",
    /** Real "Mixboard" wordmark crop — ink on lavender. Keep on light. */
    mixboardWordmark: "google-tools/logos/mixboard-wordmark.png",
    // Comparison marks (fair use, editorial diagram identity only)
    n8n: "google-tools/logos/n8n.svg", // pink #EA4B71 nodes
    cursor: "google-tools/logos/cursor.svg", // black cube
    figma: "google-tools/logos/figma-color.svg", // real multicolor
    pinterest: "google-tools/logos/pinterest.svg", // red P
    canva: "google-tools/logos/canva.png", // 180px gradient tile
    gemini: "graphify/logos/gemini.svg", // existing shared spark
    claude: "openseo/logos/claude-color.svg", // existing shared mark
  },
  shots: {
    /** Real Antigravity editor UI (agent side panel, new chat). */
    antigravityChat: "google-tools/shots/antigravity-new-chat.png",
    /** Real Antigravity CLI feature image. */
    antigravityCli: "google-tools/shots/antigravity-cli.png",
    /** Real Pomelli campaign example images (their about-page hero). */
    pomelliHeroTop: "google-tools/shots/pomelli-hero-top.png",
    pomelliHeroLeft: "google-tools/shots/pomelli-hero-left.png",
    pomelliHeroRight: "google-tools/shots/pomelli-hero-right.png",
    /** Real Mixboard marketing board images. */
    mixBanana: "google-tools/shots/mixboard-banana.png",
    mixCake: "google-tools/shots/mixboard-cake.png",
    mixPants: "google-tools/shots/mixboard-pants.png",
    mixPlate: "google-tools/shots/mixboard-plate.png",
    /** Opal share card (wordmark + EXPERIMENT pill on white, 1440×810). */
    opalShareCard: "google-tools/shots/opal-share-card.png",
  },
} as const;

// ---------------------------------------------------------------------------
// Verified facts (checked against live sites 2026-08-09 — do not invent)
// ---------------------------------------------------------------------------

export const FACTS = {
  /** Real strings from the Pomelli about page (their own demo Business DNA). */
  pomelli: {
    url: "labs.google.com/pomelli",
    fontSpecimen: "Ivypresto Headline", // their "Aa" card
    swatches: ["#34534d", "#80979a", "#d3b79c"], // their palette card (verified on page)
    toneChips: ["Confident", "Authentic", "Inspiring"], // their tone pills
    tagline: "Easily generate on-brand content for your business",
  },
  stitch: {
    url: "stitch.withgoogle.com",
    monthlyDesigns: 350, // free standard-mode monthly generation quota
    outputs: ["Code", "Figma"],
  },
  opal: {
    url: "opal.google",
    experimentBadge: "EXPERIMENT", // real badge on the share card
  },
  antigravity: {
    url: "antigravity.google",
    /** Model picker lineup as documented at launch — matches the VO claim. */
    models: ["Gemini 3 Pro", "Claude Sonnet 4.5", "GPT-OSS 120B"],
    pricing: "at no charge", // literal string on antigravity.google today
  },
  mixboard: {
    url: "labs.google.com/mixboard",
    subtitle: "Explore, expand, and refine your ideas", // their hero sub
    cta: "Get started",
  },
  totalFreeTools: 15, // the hook's count (Victor's guide lists them)
  featuredCount: 5,
} as const;

// ---------------------------------------------------------------------------
// Brand components
// ---------------------------------------------------------------------------

/** Real Stitch icon tile at any size (512px source, keep ≤ 400px on screen). */
export const StitchTile: React.FC<{
  size: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ size, radius = size * 0.22, style }) => (
  <Img
    src={staticFile(GT.logos.stitch)}
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      display: "block",
      ...style,
    }}
  />
);

/**
 * Pomelli wordmark chip — the real cream-serif crop sits on its own dark
 * olive, so it ships inside an olive rounded tile by construction.
 */
export const PomelliChip: React.FC<{
  height: number;
  style?: React.CSSProperties;
}> = ({ height, style }) => (
  <div
    style={{
      background: BRAND.pomelli.bg,
      borderRadius: height * 0.24,
      padding: `${height * 0.18}px ${height * 0.34}px`,
      display: "inline-flex",
      alignItems: "center",
      ...style,
    }}
  >
    <Img
      src={staticFile(GT.logos.pomelliWordmark)}
      style={{ height: height * 0.64, display: "block" }}
    />
  </div>
);

/** Google "G" mark at any size (shared vector asset). */
export const GoogleMark: React.FC<{
  size: number;
  style?: React.CSSProperties;
}> = ({ size, style }) => (
  <Img
    src={staticFile(GT.logos.google)}
    style={{ width: size, height: size, display: "block", ...style }}
  />
);

/** The real Google Labs EXPERIMENT pill (outline capsule, ink text). */
export const ExperimentPill: React.FC<{
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ height = 34, color = C.ink, style }) => (
  <div
    style={{
      height,
      borderRadius: height / 2,
      border: `2px solid ${color}`,
      color,
      display: "inline-flex",
      alignItems: "center",
      padding: `0 ${height * 0.45}px`,
      fontFamily: DISPLAY,
      fontWeight: 600,
      fontSize: height * 0.5,
      letterSpacing: 1.2,
      ...style,
    }}
  >
    EXPERIMENT
  </div>
);

// Re-export ink for convenience.
export const INK = C.ink;
