/**
 * screenshot-to-code shared kit — Paper Liam × Screenshot to Code brand.
 *
 * Re-exports the approved OpenSEO kit (palette, camera rig, Card, Chip,
 * TerminalPanel, counters) and layers the s2c brand on top. Brand values
 * sampled directly from screenshottocode.com (2026-08-08):
 *
 *   heading font   "Space Grotesk" 700          (site h1 / section titles)
 *   number font    "JetBrains Mono"             (star counts, metrics)
 *   ink            #0D0D0D
 *   accent         #2563EB — identical to the shared kit accent (C.orange)
 *   background     warm paper + faint grid — the site already looks like
 *                  the Liam paper system, so C.paper carries the brand.
 *
 * Every S2c composition imports from HERE so the six clips read as one
 * system. Do not fork the palette or re-implement the camera rig.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { C } from "../openseo/kit";

export * from "../openseo/kit";

const { fontFamily: groteskFamily } = loadGrotesk();

/** Display face for headline-scale type — Screenshot to Code's brand voice. */
export const DISPLAY = groteskFamily;

// ---------------------------------------------------------------------------
// Assets (all real — downloaded from screenshottocode.com / GitHub 2026-08-08)
// ---------------------------------------------------------------------------

export const S2C = {
  /** The real `//` app icon — black rounded square, 1000×1000. */
  logo: "s2c/logo.png",
  /** Real GitHub OG card for abi/screenshot-to-code, 1200×600. */
  ghSocial: "s2c/gh-social.png",
  /** Brand twitter card, 1200×628. */
  socialCard: "s2c/social-card.png",
  shots: {
    hero: "s2c/shots/site-hero.png",
    full: "s2c/shots/site-full.png",
    videoToCode: "s2c/shots/site-video-to-code.png",
    mid: "s2c/shots/site-mid.png",
    lower: "s2c/shots/site-lower.png",
    /** Official product demo pairs — original screenshot vs generated result. */
    nytBefore: "s2c/shots/nyt-lifestyle-before.webp",
    nytAfter: "s2c/shots/nyt-lifestyle-after.webp",
    yopeBefore: "s2c/shots/yope-invite-before.webp", // 520×1045, mobile UI
    yopeAfter: "s2c/shots/yope-invite-after.webp", // 520×1106
    pricingBefore: "s2c/shots/pricing-cards-before.webp",
    pricingAfter: "s2c/shots/pricing-cards-after.webp",
  },
  logos: {
    figma: "s2c/logos/figma.svg", // real multicolour Figma mark
    react: "s2c/logos/react.svg",
    vue: "s2c/logos/vue.svg",
    tailwind: "s2c/logos/tailwind.svg",
    html5: "s2c/logos/html5.svg",
    github: "openseo/logos/github-ink.svg",
    claude: "openseo/logos/claude-color.svg",
    gemini: "graphify/logos/gemini.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Verified facts (checked against the live repo/site 2026-08-08 — do not
// invent others, do not round up)
// ---------------------------------------------------------------------------

export const FACTS = {
  repo: "abi / screenshot-to-code",
  owner: "abi",
  name: "screenshot-to-code",
  stars: 73889,
  forksLabel: "9k",
  license: "MIT",
  description:
    "Drop in a screenshot and convert it to clean code (HTML/Tailwind/React/Vue)",
  /** The one-line Docker setup from the README. */
  dockerCmd: "docker-compose up -d --build",
  localUrl: "http://localhost:5173",
  stacks: ["HTML + Tailwind", "React + Tailwind", "Vue + Tailwind", "Bootstrap"],
} as const;

// ---------------------------------------------------------------------------
// Brand components
// ---------------------------------------------------------------------------

/** The real `//` tile. Its own art is black-on-white with a bold rounded
 *  border, so it reads as a crisp object on paper with no extra chrome. */
export const S2cMark: React.FC<{
  size: number;
  style?: React.CSSProperties;
}> = ({ size, style }) => (
  <Img
    src={staticFile(S2C.logo)}
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.18,
      display: "block",
      ...style,
    }}
  />
);

/** Mark + wordmark, matching the site header lockup (Space Grotesk 700). */
export const S2cLockup: React.FC<{
  size?: number;
  color?: string;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ size = 84, color = C.ink, gap = 20, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
    <S2cMark size={size} />
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size * 0.52,
        color,
        letterSpacing: -0.5,
        whiteSpace: "nowrap",
      }}
    >
      Screenshot to Code
    </div>
  </div>
);
