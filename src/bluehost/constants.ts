// Bluehost × Hermes walkthrough — shared contract.
// Every color/dimension here is sampled from the real portal screenshots
// (reels/bluehost/bh_01..07.png) or Bluehost's own ad. Do not invent new ones.

export const BH = {
  // brand / ad
  brandBlue: "#206BD9", // ad background blue (world backdrop)
  brandBlueDeep: "#17509E", // darker vignette edge of the blue field
  // portal UI (sampled)
  actionBlue: "#196CDF", // solid buttons, links, active nav
  actionBlueHover: "#1560C8",
  pageBg: "#F6FAFD", // portal content background tint
  card: "#FFFFFF",
  navy: "#041D33", // headings + terminal background
  textBody: "#334155",
  textMuted: "#64748B",
  line: "#E2E8F0", // card borders / dividers
  sidebarActive: "#EDF3FD",
  green: "#0F9D58",
  red: "#C62828",
  warnRed: "#D32F2F",
  disabledBg: "#E8EDF3",
  disabledText: "#9AA7B5",
  // terminal
  termBg: "#041D33",
  termPanel: "#0A2A47",
  termText: "#D7E5F4",
  termDim: "#6E8BA6",
  termGreen: "#4ADE80",
  termRed: "#F87171",
  termYellow: "#FBBF24",
  termBlue: "#60A5FA",
} as const;

// ---- world ------------------------------------------------------------------
// One continuous world shared by both comps. All components are laid out in
// these coordinates; the camera travels through them.
export const WORLD = {
  w: 4600,
  h: 2400,
  // intro logo (vector 3x3 grid mark assembles here)
  logo: { cx: 1000, cy: 330 },
  // the portal window (browser-app card)
  portal: { x: 200, y: 620, w: 1600, h: 1120 },
  // terminal panel
  term: { x: 2450, y: 700, w: 1340, h: 960 },
  // payoff: server card ends centered where the terminal collapses to
  server: { cx: 3120, cy: 1180 },
} as const;

// ---- portal window inner layout ----------------------------------------------
export const PORTAL = {
  headerH: 96,
  sidebarW: 300,
  contentPad: 44,
  radius: 18,
} as const;

// fonts: import in each file:
//   import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
//   import {loadFont as loadMono} from "@remotion/google-fonts/JetBrainsMono";

// ---- app catalog (order curated from the real Applications tab) ---------------
export type CatalogApp = {
  name: string;
  desc: string;
  logo: string; // staticFile path
  current?: boolean;
  logoPad?: boolean;
};

export const CATALOG: CatalogApp[] = [
  {
    name: "n8n",
    desc: "n8n is an extensible workflow automation platform that connects various apps and services through visual nodes.",
    logo: "bluehost/n8n-logo.svg",
  },
  {
    name: "Claude Code",
    desc: "Claude Code is an agentic coding tool by Anthropic that runs in your terminal.",
    logo: "bluehost/claudecode-logo.svg",
  },
  {
    name: "Ollama",
    desc: "Ollama is a platform that lets you run and manage AI models locally on your server with full control and privacy.",
    logo: "bluehost/ollama-logo.svg",
  },
  {
    name: "OpenClaw",
    desc: "OpenClaw is an open-source AI gateway that routes requests to multiple LLM providers through a single WebSocket endpoint.",
    logo: "bluehost/open-claw.svg",
    current: true,
  },
  {
    name: "Hermes Agent + Open WebUI",
    desc: "Hermes Agent is Nous Research's autonomous AI agent that exposes an OpenAI-compatible API.",
    logo: "bluehost/openwebui-logo.svg",
  },
  {
    name: "Hermes Agent",
    desc: "The self-improving AI agent built by Nous Research.",
    logo: "bluehost/hermesagent-logo.svg",
  },
  {
    name: "Langflow",
    desc: "Langflow is an open-source low-code platform for building and deploying AI-powered applications.",
    logo: "bluehost/langflow-logo.svg",
  },
];

// index of the Hermes Agent card in CATALOG (click target)
export const HERMES_INDEX = 5;

// catalog card geometry (inside portal content area)
export const CAT_CARD = {
  h: 180,
  gap: 26,
  logoSize: 68,
} as const;

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200 },
  smooth: { damping: 200, stiffness: 100 },
  bouncy: { damping: 12, stiffness: 150 },
  heavy: { damping: 16, stiffness: 80, mass: 1.6 },
} as const;
