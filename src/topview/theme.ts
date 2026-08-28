// Shared Topview DNA for the topview series (Aug 2026, DARK).
// Source of truth: public/topview/reference/*.png (real topview.ai captures).
// READ-ONLY for builder agents: import tokens, build layout in your own comp file.

export const TV = {
  // Surfaces — LIAM WHITE STYLE (Victor's directive): warm white world,
  // white floating cards with soft shadows. Dark lives only INSIDE cards
  // (terminal panels, phone-frame videos), like the approved Notion series.
  bg: "#F7F6F3",
  panel: "#FFFFFF",
  panel2: "#FBFAF8",
  border: "rgba(23, 23, 28, 0.08)",

  // Text (dark on white)
  text: "#17171C",
  muted: "#6B7280",
  faint: "#9CA3AF",

  // Accents (Topview purple/violet glow + Liam blues)
  purple: "#7C3AED",
  violet: "#A78BFA",
  blue: "#3B82F6",
  cyan: "#22D3EE",
  green: "#22C55E",
  red: "#EF4444",

  // Fizzi brand (our product, appears in P1/P2)
  fizziCoral: "#F5A182",
  fizziCream: "#FBF3E4",
} as const;

export const FONT_SANS =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
export const FONT_MONO =
  '"SFMono-Regular", ui-monospace, "Cascadia Mono", "Roboto Mono", Menlo, Consolas, monospace';

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200 },
  smooth: { damping: 200, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 140 },
  heavy: { damping: 16, stiffness: 80, mass: 1.6 },
} as const;

export const safePadX = (width: number) => Math.round(width * 0.05);

// REAL Topview strings (captured from topview.ai — do not invent).
export const TOPVIEW = {
  mcpEndpoint: "https://mcp.topview.ai/mcp",
  claudeConnectorUrl: "https://mcp.topview.ai/claude",
  // The one-line Claude Code install (real CLI syntax + their real endpoint):
  claudeCodeOneLiner:
    "claude mcp add --transport http topview https://mcp.topview.ai/mcp",
  productTabs: ["Video Agent", "Drama Studio", "AI Video", "AI Image"],
  promptPlaceholder: "Ask Topview to make a 30-second launch video",
  platforms: ["Amazon", "TikTok Shop", "YouTube"],
  models: ["Veo", "Sora", "Seedance"],
} as const;

// Real assets in public/ (paths for staticFile):
//   topview/topview-logo-dark.webp  — Topview wordmark (inspect before use)
//   topview/topview-icon.webp       — Topview icon mark
//   topview/fizzi-ad.mp4            — OUR finished Fizzi UGC ad (10.3s, 9:16)
//   topview/beat1-hook.mp4 / beat2-tab.mp4 / beat3-sip.mp4 — its three beats
//   topview/beat1-hook-a.png        — Fizzi ad hook still
//   topview/can-1.png               — Fizzi product can render
//   topview/allipop-ref-frame.png   — the "winning ad" reference frame (blur/soften its brand name when shown)
//   openseo/logos/claude-color.svg  — Claude logo
//   slack/slack-icon.svg, tools/gmail.svg, tools/stripe.svg
//   tools/amazon.svg, tools/youtube.svg, tools/openai.svg — platform/model logos
//   logos/tiktok.svg, logos/google.svg
