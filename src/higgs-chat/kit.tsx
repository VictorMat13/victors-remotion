/**
 * Higgs-Chat shared kit — Paper Liam × ChatGPT (real UI) × Higgsfield.
 *
 * Series: "ChatGPT × Higgsfield UGC" (6 parts, Aug 2026). The chat beats are
 * built ON TOP of real chatgpt.com screenshots captured 2026-08-11 (logged
 * out, true-black 2026 UI, sidebar shows the real "Plugins" item and the
 * real Plugins directory page). UI tokens below are pixel-sampled from those
 * captures — any composited panel/row/bubble must use THESE values so it is
 * indistinguishable from the screenshot underneath.
 *
 * Higgsfield accent: lime — approved in the prior Higgsfield series
 * (src/HiggsConnectorSwitch.tsx et al).
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { C } from "../openseo/kit";

export * from "../openseo/kit";

/** Display face = Inter (kit FONT). ChatGPT's UI face is closest to Inter. */
export { FONT as DISPLAY } from "../openseo/kit";

// ---------------------------------------------------------------------------
// Brand accents
// ---------------------------------------------------------------------------

export const HIGGS = {
  lime: "#84CC16",
  limeDeep: "#65A30D",
  limeSoft: "rgba(132,204,22,0.12)",
  limeLine: "rgba(132,204,22,0.35)",
} as const;

/** ChatGPT UI tokens — pixel-sampled from the 2026-08-11 captures. */
export const GPT = {
  bg: "#000000", // main + sidebar background (true black)
  raised: "#1A1A1A", // selected sidebar row
  composer: "#212121", // "Ask anything" pill
  tile: "#1F1F1F", // plugin icon tile backdrop
  panel: "#161616", // dropdown/modal surface (between bg and raised)
  text: "#FFFFFF",
  muted: "#A9A9A9",
  faint: "#696969", // search placeholder
  line: "rgba(255,255,255,0.10)",
  white: "#FFFFFF", // Log in pill, + buttons at full strength
} as const;

// ---------------------------------------------------------------------------
// Assets (real — captures 2026-08-11 + prior approved Higgsfield series)
// ---------------------------------------------------------------------------

export const HC = {
  shots: {
    /** Real chatgpt.com home, 1600×1000, cookie banner cropped (1600×880). */
    home: "higgs-chat/shots/chatgpt-home-clean.png",
    /** Real chatgpt.com home, full 1600×1000 (has cookie banner at bottom). */
    homeFull: "higgs-chat/shots/chatgpt-home.png",
    /** Real chatgpt.com/plugins directory, 1600×1000 — "Plugins" header,
     * "Search plugins" box, Featured rows (Gmail/Drive/Outlook/GitHub/
     * SharePoint/Slack) each with a + add button. THE walkthrough base. */
    plugins: "higgs-chat/shots/chatgpt-plugins.png",
    /** One frame of the Allipop UGC result video (1080×1920, t≈6s). */
    ugcFrame: "higgs-chat/shots/allipop-ugc-frame.png",
  },
  /** Product cutout — Allipop Blueberry Lavender can, transparent (1106×2257). */
  productPhoto: "higgs-chat/allipop-can.png",
  /** Same can as a white-background packshot (1536×2752) — reads as an
   * uploaded "product photo" inside chat image cards. */
  productPackshot: "higgs-chat/allipop-packshot.png",
  /** Real UGC result video — 1080×1920, 15s @24fps, girl-in-kitchen with the
   * Allipop can (no baked matte — full-frame footage). */
  ugcVideo: "higgs-chat/allipop-ugc.mp4",
  logos: {
    higgsfield: "higgs3/logos/higgsfield.svg",
    higgsfieldWhite: "higgs3/logos/higgsfield-white.svg",
    higgsfieldIcon: "higgs3/logos/higgsfield-icon.png",
    openai: "higgs3/logos/openai.svg",
    openaiWhite: "higgs3/logos/openai-white.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Verified real UI strings (visible in the captures — safe on screen)
// ---------------------------------------------------------------------------

export const FACTS = {
  sidebar: ["New chat", "Images", "Plugins", "Deep research", "Maps"],
  pluginsTitle: "Plugins",
  pluginsSub: "Work with ChatGPT across your favorite tools.",
  searchPlaceholder: "Search plugins",
  composerPlaceholder: "Ask anything",
  homeGreeting: "Ready when you are.",
  /** User prompts from the script — typed user text, not narration echo. */
  promptUgc: "Turn this into a UGC video",
  promptAnimate: "Animate that",
  /** Higgsfield plugin row copy — name + plausible directory description. */
  higgsRowName: "Higgsfield",
  higgsRowDesc: "Generate images, video, and UGC ads",
  url: "chatgpt.com",
} as const;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Higgsfield app icon (real PNG tile) at any size ≤ ~200px. */
export const HiggsIcon: React.FC<{
  size: number;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ size, radius = size * 0.22, style }) => (
  <Img
    src={staticFile(HC.logos.higgsfieldIcon)}
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      display: "block",
      ...style,
    }}
  />
);

// Re-export ink for convenience.
export const INK = C.ink;
