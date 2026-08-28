# Scrapy series — shared brief (Aug 2026, PAPER + TEAL)

Six silent B-roll clips for Victor's Scrapy reel. Paper Liam system with Scrapy's
teal `#15B8A6` as the series accent (import `TEAL`/`TEAL_SOFT`/`TEAL_LINE` from
`src/scrapy/kit.tsx` — do NOT use `C.orange` blue in this series). **Style bar:**
the just-shipped screenshot-to-code set (`src/s2c/`) and OpenSEO set (`src/openseo/`).

## VO script + comps

| # | Comp | Canvas | Frames | VO line (do NOT put on screen) |
|---|------|--------|--------|--------------------------------|
| 1 | `ScrHookNoApi` | 1080×1920 | 170 | "I just found a free tool that scrapes data from any platform without paying for APIs." |
| 2 | `ScrRepoStars` | 1080×1080 | 200 | "It's called Scrapy. Open source, completely free, and sitting at over 60,000 stars on GitHub." |
| 3 | `ScrOneFileData` | 1080×1920 | 260 | "Install is one command. You write one small Python file that points at the site you want, you run it, and it hands you clean data as a spreadsheet or JSON." |
| 4 | `ScrHandlesHardParts` | 1080×1920 | 260 | "It handles the annoying parts for you: cookies, sessions, retries, and pacing your requests so you don't hammer anyone's site. And for pages built with JavaScript, you plug in Playwright and it reads those too." |
| 5 | `ScrPublicDataRules` | 1080×1920 | 290 | "Now the part nobody tells you. Public data does not mean free-for-all. Scraping can break a site's terms, the big platforms run bot blockers built to stop it, and scraping too hard can take a small site down. Keep it slow and keep it legit." |
| 6 | `ScrUseCases` | 1080×1080 | 200 | "Used for research, lead gen, price tracking, and watching competitors. No API key, no monthly bill." |

CTA gets **no video**. Frame counts include editor handles.

Victor burns his own overlays (0:00 "$42,000/month… for data", 0:05 "Scrapy ·
63,000+ stars", 0:11 "one command · one Python file", 0:27 "public data ≠
free-for-all", 0:42 CTA). Nothing on screen may restate the VO or those overlays —
NO dollar figures anywhere in the graphics (his hook overlay owns "$42,000/month"),
no words like "free", "open source", "research", "lead gen".

## Verified facts (2026-08-08 — never invent or round up)

- Repo `scrapy/scrapy` · **63,707 stars** · **11,870 forks** (scrapy.org shows the
  exact figure) · **BSD-3-Clause** · maintained by Zyte with **500+ contributors**
- Description: "Scrapy, a fast high-level web crawling & scraping framework for Python."
- Install: `pip install scrapy` (site hero shows `uv add scrapy` — both real)
- Run: `scrapy runspider quotes_spider.py -O quotes.json`
- Canonical spider code: `FACTS.spiderCode` in the kit (official docs example,
  targets Scrapy's own demo site quotes.toscrape.com)
- Real settings (safe UI text): `ROBOTSTXT_OBEY = True`, `DOWNLOAD_DELAY = 2`,
  `AUTOTHROTTLE_ENABLED = True`, `RETRY_ENABLED = True`, `COOKIES_ENABLED = True`
- JS rendering: the `scrapy-playwright` plugin (real name)

## Assets — in `public/scrapy/` (paths via `SCRAPY` in kit)

- `logos/scrapy-favicon.svg` — the real teal circle mark (use `ScrapyMark`/`ScrapyLockup`)
- `gh-social.png` — real GitHub OG card
- `shots/site-hero.png`, `shots/site-full.png` — live scrapy.org captures
- `logos/playwright.svg` (real multicolour), `logos/python.svg`, `logos/x.svg`,
  `logos/reddit.svg`, plus shared `openseo/logos/github-ink.svg`

## Type system

- Headlines / product names: `DISPLAY` (Manrope 700/800) — the site's own face
- Code / commands / numbers: `MONO` (JetBrains Mono) with `tabular`
- Supporting UI text: `FONT` (Inter). Max two weights per comp.
- Numbers ≥64px on 9:16, supporting ≥38px, terminal mono ≥30px on screen.

## Rules (a render is rejected on any of these)

1. **No redundant on-screen text** — nothing restates VO/overlays. Allowed: real
   numbers, commands, code, settings lines, file names, genuine UI text. NO dollar
   amounts anywhere.
2. **No black frames** — PaperWorld/PaperBase opaque from frame 0→last.
   `npm run check:black -- out/<Comp>.mp4` must print ✅.
3. **5% side margins** — content x = 54…1026. On 9:16 keep critical content clear
   of top ~10% / bottom ~12%.
4. **Frame-driven motion only** — useCurrentFrame/spring/interpolate, inputs
   strictly increasing. No CSS transitions/keyframes.
5. **Cinematic camera** — PaperWorld + useCam, hold → move (14–24f, EASE) → hold,
   action during holds, end on two near-identical keys (~25f hold).
6. **No glow.** Accent through borders, fills, chips. Neutral kit shadows only.
7. **Authenticity** — real marks and real commands only. The X and Reddit marks may
   appear as platform identities (fair use in an editorial diagram); never invent
   their UI.

## QA loop (every builder, before reporting done)

```
npx tsc --noEmit
npx remotion still <Comp> out/<slug>-<frame>.png --frame=<n>   # each beat — LOOK at it
npx remotion render <Comp> out/<Comp>.mp4
npm run check:black -- out/<Comp>.mp4
```

Known defect patterns (from prior sets): effects over hero numbers at landing;
hollow cards waiting for content; asymmetric compare framing; logo-only vs
logo+wordmark mismatch in one diagram; colour ramps through mud; empty chart
tracks reading as data.

## Delivery

Orchestrator copies finished MP4s to `.../reels/repos/scrapy/broll/` named by the
first 4–5 script words. Builders leave mp4s in `out/`.
