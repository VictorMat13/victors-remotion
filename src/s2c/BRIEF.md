# screenshot-to-code series — shared brief (Aug 2026, PAPER)

Six silent B-roll clips for Victor's screenshot-to-code reel. Paper Liam system —
the product's own site is cream paper + faint grid + ink + `#2563EB` blue, so the
OpenSEO paper kit carries the brand natively. **Style bar:** the approved OpenSEO
set (`src/openseo/`, renders in `.../reels/repos/open seo/videos/`) and the
Graphify set structure (`src/graphify/`).

## VO script + comps

| # | Comp | Canvas | Frames | VO line (do NOT put on screen) |
|---|------|--------|--------|--------------------------------|
| 1 | `S2cHookOnlyTool` | 1080×1080 | 110 | "This might be the only tool you need to build websites from now on." |
| 2 | `S2cHookThreeInputs` | 1080×1920 | 120 | "You give it a screenshot, a Figma file, or a screen recording, and it gives you a working website" |
| 3 | `S2cRepoStars` | 1080×1080 | 170 | "It's a github repo called screenshot-to-code, and it is sitting at over 73,000 GitHub stars." |
| 4 | `S2cSelfCheck` | 1080×1920 | 290 | "it opens the page it just built in a real browser, looks at it, compares it to your screenshot, and fixes anything that seems off before showing you." |
| 5 | `S2cCapabilities` | 1080×1920 | 350 | "You can feed it a screenshot, a Figma design, or even a screen recording of a site, and it hands back clean code. It even pulls the real logos and images out of your screenshot and rebuilds the page around them." |
| 6 | `S2cOneLineSetup` | 1080×1920 | 230 | "the Setup is one line into your terminal. It's free, it is open source, and the code it writes isn't shit." |

CTA gets **no video**. Frame counts include editor handles (longer than VO).

Victor burns his own overlays on top (0:00 "Your AI has never seen the websites it
builds", 0:06 "screenshot-to-code · 73,000+ stars", 0:11 "It checks its own work",
0:20 "Screenshot / Figma / screen recording", 0:31 "Free · open source"). Anything
you write on screen competes with those in the same frame — so **no phrases**.

## Verified facts (2026-08-08 — never invent or round up)

- Repo `abi/screenshot-to-code` · **73,889 stars** · **9,074 forks** (`9k`) · **MIT**
- Description: "Drop in a screenshot and convert it to clean code (HTML/Tailwind/React/Vue)"
- Stacks: HTML+Tailwind, HTML+CSS, React+Tailwind, Vue+Tailwind, Bootstrap, Ionic+Tailwind
- Models: Gemini 3 Flash / 3.1 Pro, GPT-5.5, Claude Opus 4.6/4.8
- **Screenshot preview** (the differentiator): the agent renders its generated page
  in headless Chromium, looks at it, compares against the reference, fixes issues
  before presenting. Real feature, in README.
- **Asset extraction**: Gemini pulls the real logos/images out of the input
  screenshot and reuses them in the rebuilt page. Real feature, in README.
- Docker setup: `docker-compose up -d --build` → app at `http://localhost:5173`
- Hosted product: screenshottocode.com

## Assets — all real, in `public/s2c/` (import paths via `S2C` in kit)

- `logo.png` — the `//` mark, 1000×1000
- `gh-social.png` — real GitHub OG card
- `shots/site-hero.png` — the live site hero (shows "Build User Interfaces 10x Faster")
- `shots/nyt-lifestyle-before|after.webp` — official demo pair, 1400w desktop
- `shots/yope-invite-before|after.webp` — official demo pair, 520w **mobile** (great on 9:16)
- `shots/pricing-cards-before|after.webp` — official demo pair, 1100w
- `logos/figma.svg` (real multicolour), `logos/react.svg`, `logos/vue.svg`,
  `logos/tailwind.svg`, `logos/html5.svg`
- Shared: `openseo/logos/github-ink.svg`, `openseo/logos/claude-color.svg`,
  `graphify/logos/gemini.svg`

## Type system

- Headlines / product names: `DISPLAY` (Space Grotesk 700) — the site's own face
- Numbers / code / URLs: `MONO` (JetBrains Mono) with `tabular`
- Supporting UI text: `FONT` (Inter)
- Max two weights per comp. Numbers ≥64px on 9:16, supporting ≥38px.

## Rules (a render is rejected on any of these)

1. **No redundant on-screen text** — nothing may restate the VO. Allowed: real
   numbers, file names, product names, genuine UI/terminal text, code.
2. **No black frames** — `PaperWorld`/`PaperBase` paints opaque paper at the
   outermost AbsoluteFill for the full duration. Verify:
   `npm run check:black -- out/<Comp>.mp4` must print ✅.
3. **5% side margins** — content lives x = 54…1026 on 1080. Backgrounds bleed,
   content never. On 9:16 keep critical content clear of top ~10% / bottom ~12%.
4. **Frame-driven motion only** — `useCurrentFrame`/`spring`/`interpolate`, inputs
   strictly increasing. No CSS transitions/keyframes.
5. **Cinematic camera** — one continuous world (`PaperWorld` + `useCam`),
   hold → move (14–24f, `EASE`) → hold. Action during holds, never during moves.
   End on two near-identical keys (~25f clean hold).
6. **No glow.** No coloured shadows, no radial halos, no `0 0 Npx rgba(accent)`.
   Accent reads through borders, fills, chips. Depth = the kit Card's neutral shadow.
7. **Authenticity** — real assets from `public/s2c/` over invented pixels. Never
   fabricate a metric.

## QA loop (every builder, before reporting done)

```
npx tsc --noEmit
npx remotion still <Comp> out/<slug>-<frame>.png --frame=<n>   # each beat — then LOOK at it
npx remotion render <Comp> out/<Comp>.mp4
npm run check:black -- out/<Comp>.mp4
```

Known defect patterns from the OpenSEO set — check your stills for: effects drawn
over the hero number at its landing frame; empty chart tracks reading as data;
asymmetric crops on "these are identical" beats; logo-only vs logo+wordmark
mismatches in one diagram; cards landing before their contents; colour ramps
passing through mud.

## Delivery

Rendered MP4s stay in `out/` — the orchestrator copies them to
`.../reels/repos/screenshot to code/broll/` named by the first five script words.
