// Shared DNA for the Ahmed × Arcads series (Aug 2026).
// Palette: Ahmed's Altari brand tokens (mirror of altari-remotion SKILL.md /
// altari-website-v2 globals) — locked, no off-brand purples.
// Motion system: Liam cinematic camera (continuous world, keyframed rig),
// baseline = approved Topview series (src/topview/*).

export const AR = {
  // Surfaces — dark Altari world
  bg: "#1A1A2E",
  bgAlt: "#242442",
  card: "#2C2C4A",
  border: "#3D3D60",

  // Text
  heading: "#FFFFFF",
  body: "#A5A7D9",
  faint: "#6E70A0",

  // Purples (the brand)
  primary: "#5B5EC2",
  primaryLight: "#7B7DD6",
  primaryDeep: "#3D2C8D",

  // Status
  green: "#10B981",
  onlineGreen: "#4ADE80",
  red: "#FF6B8A",

  // Gradients
  gradCTA: "linear-gradient(135deg, #3D2C8D 0%, #5B5EC2 100%)",
  gradProcess: "linear-gradient(145deg, #5C5EC3, #3D2C8D)",

  // Terminal-ish dark panel inside cards
  deep: "rgba(13,13,20,0.92)",
} as const;

export const FONT_SANS =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200 },
  smooth: { damping: 200, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 140 },
  heavy: { damping: 16, stiffness: 80, mass: 1.6 },
} as const;

export const safePadX = (width: number) => Math.round(width * 0.05);

// REAL strings for this build (from the reel + product — do not invent).
export const ARCADS = {
  // The actual instruction Ahmed typed into Arcads (quoted verbatim in the VO):
  typedPrompt: "animate the key words on screen as I say them",
  // Source video duration → target after the cut (Arcads.mp4 = 32.93s):
  srcDuration: "0:33",
  cutDuration: "0:30",
  domain: "arcads.ai",
} as const;

// Real assets in public/arcads/ (paths for staticFile):
//   arcads/demo.mp4            — the reel itself (1080×1920, 32.9s) = "the video you're watching now"
//   arcads/site-hero.png       — real arcads.ai homepage capture (Playwright, 1440×900 @2x)
//   arcads/site-full.png       — real arcads.ai full-page capture
//   arcads/site-info.json      — captured strings/links (reference only)
