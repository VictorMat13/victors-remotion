/**
 * Scrapy shared kit — Paper Liam × Scrapy brand.
 *
 * Re-exports the approved OpenSEO paper kit (palette, camera rig, Card, Chip,
 * TerminalPanel, counters) and layers the Scrapy brand on top. Brand values
 * sampled directly from scrapy.org (2026-08-08):
 *
 *   brand teal    #15B8A6  (favicon + wordmark + "open source" highlight)
 *   font          Manrope (site body + headings)
 *   site          clean white, dark ink, dark code panels
 *
 * Every Scr* composition imports from HERE so the six clips read as one
 * system. Paper base stays; teal is the series accent.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { C } from "../openseo/kit";

export * from "../openseo/kit";

const { fontFamily: manropeFamily } = loadManrope();

/** Display face for headline-scale type — Scrapy's brand voice. */
export const DISPLAY = manropeFamily;

// ---------------------------------------------------------------------------
// Series accent — Scrapy teal. Use these instead of C.orange for accents.
// ---------------------------------------------------------------------------

export const TEAL = "#15B8A6";
export const TEAL_SOFT = "rgba(21,184,166,0.10)";
export const TEAL_LINE = "rgba(21,184,166,0.34)";

// ---------------------------------------------------------------------------
// Assets (real — downloaded from scrapy.org / GitHub 2026-08-08)
// ---------------------------------------------------------------------------

export const SCRAPY = {
  /** Real scrapy.org favicon — teal circle with white nib mark. */
  mark: "scrapy/logos/scrapy-favicon.svg",
  /** Real GitHub OG card for scrapy/scrapy, 1200×600. */
  ghSocial: "scrapy/gh-social.png",
  shots: {
    hero: "scrapy/shots/site-hero.png",
    full: "scrapy/shots/site-full.png",
  },
  logos: {
    playwright: "scrapy/logos/playwright.svg", // real multicolour mark
    python: "scrapy/logos/python.svg",
    x: "scrapy/logos/x.svg", // black X mark
    reddit: "scrapy/logos/reddit.svg",
    github: "openseo/logos/github-ink.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Verified facts (checked against live repo + scrapy.org 2026-08-08 —
// do not invent others, do not round up)
// ---------------------------------------------------------------------------

export const FACTS = {
  repo: "scrapy / scrapy",
  owner: "scrapy",
  name: "scrapy",
  stars: 63707,
  forksLabel: "11,870", // scrapy.org shows the exact figure — match it
  contributors: "500+", // "Maintained by Zyte with over 500 other contributors"
  license: "BSD-3-Clause",
  description:
    "Scrapy, a fast high-level web crawling & scraping framework for Python.",
  installCmd: "pip install scrapy",
  installCmdAlt: "uv add scrapy", // what the scrapy.org hero shows today
  runCmd: "scrapy runspider quotes_spider.py -O quotes.json",
  /** Canonical spider from the official docs (quotes.toscrape.com is Scrapy's own demo site). */
  spiderCode: [
    "import scrapy",
    "",
    "class QuotesSpider(scrapy.Spider):",
    '    name = "quotes"',
    '    start_urls = ["https://quotes.toscrape.com"]',
    "",
    "    def parse(self, response):",
    '        for q in response.css("div.quote"):',
    "            yield {",
    '                "text": q.css("span.text::text").get(),',
    '                "author": q.css("small.author::text").get(),',
    "            }",
  ],
  /** All genuine Scrapy settings names — safe UI text. */
  settings: {
    robots: "ROBOTSTXT_OBEY = True",
    delay: "DOWNLOAD_DELAY = 2",
    throttle: "AUTOTHROTTLE_ENABLED = True",
    retry: "RETRY_ENABLED = True",
    cookies: "COOKIES_ENABLED = True",
  },
  playwrightPlugin: "scrapy-playwright",
} as const;

// ---------------------------------------------------------------------------
// Brand components
// ---------------------------------------------------------------------------

/** The real teal circle mark from scrapy.org. */
export const ScrapyMark: React.FC<{
  size: number;
  style?: React.CSSProperties;
}> = ({ size, style }) => (
  <Img
    src={staticFile(SCRAPY.mark)}
    style={{ width: size, height: size, display: "block", ...style }}
  />
);

/** Mark + wordmark, matching the scrapy.org header lockup (Manrope 800, teal). */
export const ScrapyLockup: React.FC<{
  size?: number;
  color?: string;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ size = 84, color = TEAL, gap = 16, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
    <ScrapyMark size={size} />
    <div
      style={{
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size * 0.78,
        color,
        letterSpacing: -1,
        whiteSpace: "nowrap",
      }}
    >
      Scrapy
    </div>
  </div>
);

// Re-export ink for convenience in sibling comps that want C.ink defaults.
export const INK = C.ink;
