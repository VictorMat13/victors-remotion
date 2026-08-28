# OpenSEO series — shared build brief

Six Remotion clips cut from one talking-head script about **OpenSEO**
(`github.com/every-app/open-seo`). Every clip must read as the SAME visual
system. Read this whole file before writing code.

Project root: this repo

---

## 1. Locked visual system — Paper Liam × OpenSEO brand

The approved reference renders are the July 2026 Higgsfield clips
(`out/hmf-90.png`, `out/hcs-144.png`, `out/hsd3-80.png`) and their sources
(`src/HiggsModelsFree.tsx`, `src/HiggsConnectorSwitch.tsx`). **Open at least
two of those stills and one source file before you start.** That look is:

- Warm paper background with a faint graph grid bleeding full-frame
- Ink-black Inter, bold, tight letter-spacing, large on mobile
- White cards, ~26px radius, 1.5px warm border, soft drop shadow
- One brand accent colour used sparingly, plus a thin connector spine
- Big readable objects, few of them, staggered spring entrances
- A camera that travels through one continuous world

OpenSEO's own site uses effectively the same palette — sampled live from
openseo.so on 2026-08-01: paper `#F5F1EC`, ink `#0A0A0A`, accent orange
`#FF5600`, Inter. So the brand and the house style converge. Use the accent
orange as the product colour throughout.

**Everything you need is already in `src/openseo/kit.tsx`.** Import the
palette (`C`), fonts (`FONT`, `MONO`), springs, `PaperWorld` (camera rig +
opaque paper base + grid), `PaperBase`, `Card`, `Chip`, `OpenSeoMark`,
`OpenSeoLockup`, `LogoImg`, `TerminalPanel`, `useCam`, `useEnter`,
`useCountUp`, `useTypewriter`, `Cursor`, `tabular`, `fmt`, `A` (assets),
`safePadX`. Do **not** fork the palette, re-declare colours, or hand-roll a
second camera rig. If you need a new shared primitive, still put it in your
own file — `kit.tsx` is read-only for you.

---

## 2. Real assets — use these, invent nothing

All downloaded from the real product/brand sources. Paths are `staticFile()`
keys, exposed on the `A` object in the kit.

| Key | What it is |
|---|---|
| `A.openseoTile` | OpenSEO's real app icon: dark rounded tile, silver pine tree |
| `A.githubCard` | Real GitHub OG card for `every-app/open-seo` — 19 contributors, 24 issues, **10k stars**, 1k forks |
| `A.shots.hero` | openseo.so hero screenshot |
| `A.shots.mcp` | openseo.so MCP section (dark terminal panel) |
| `A.shots.keywords` | Real OpenSEO Keyword Research app UI |
| `A.shots.features` | Real feature grid + keyword results table |
| `A.shots.pricing` | Real pricing estimator |
| `A.logo.semrush` / `semrushMuted` / `semrushInk` | Semrush mark |
| `A.logo.ahrefs` / `ahrefsMuted` / `ahrefsInk` | Ahrefs mark |
| `A.logo.github`, `A.logo.docker`, `A.logo.gsc` | GitHub / Docker / Google Search Console |
| `A.logo.claude`, `A.logo.claudePng`, `A.logo.claudeCode` | Claude, Claude Code |

Screenshots are browser captures — if you use one, **crop to the interesting
region** (position it inside a clipping container and offset it) rather than
squashing a whole 1440×900 page into a phone frame. Never stretch a logo:
use `objectFit: "contain"`.

---

## 3. Verified facts — these numbers are real, do not invent others

Checked against github.com/every-app/open-seo, openseo.so and openseo.so/pricing
on 2026-08-01:

- Repo: `every-app/open-seo` — "Open source alternative to Semrush and Ahrefs", MIT
- **10k GitHub stars** (site header shows `GitHub 9.4k`; OG card shows `10k`), 1k forks, 19 contributors
- Six workflows, exact names: **Keyword Research, Rank Tracking, Competitor
  Insights, Backlinks, Site Audits, AI Visibility**
- Pricing estimator verbatim strings:
  - Keyword searches — "About **$0.05 per search** at typical result limits."
  - Backlink checks — "About $0.08 for a domain overview with one year of history."
  - ChatGPT brand checks — "This is the expensive one, about $1.09 each."
  - Sample bill: **$10/mo** → Keyword research $5.00 (100 searches), Backlink
    checks $1.58 (20), ChatGPT brand checks $0.00, Rank tracking $0.54 (217)
  - "For comparison: Ahrefs' cheapest plan is **$129/mo**."
- **Semrush Pro is $139.95/mo** (independently verified)
- MCP install command (real, from openseo.so/docs/mcp):
  `claude mcp add --transport http --scope user openseo https://app.openseo.so/mcp`
- The real MCP terminal on openseo.so reads:
  ```
  claude · openseo mcp
  › find and cluster keywords for openseo.so
  ● openseo.keyword_research(seed: "open source seo")
    keyword                     volume   kd
    open source seo             1,300    12
    open source seo tools         720     9
    self-hosted seo platform      210     4
  ✓ Saved 3 keywords to your workspace.
  ↳ View data in app: app.openseo.so/keywords
  ```
- Real keyword rows visible in the app screenshot: `best seo tools 3,600`,
  `semrush keyword research 6,600`, `ahrefs backlink checker 6,600`,
  `ahrefs seo tool 5,400`, `seo tool for youtube 4,400`, `etsy seo 3,600`
- Self-host: Docker (personal) or Cloudflare Workers (team); bring your own
  DataForSEO API key. Google Search Console is a separate MCP; GSC data comes
  from Google, not DataForSEO, so it does not consume credits.

---

## 4. Hard rules — a render is rejected if any of these break

1. **No redundant on-screen text.** The video has spoken VO plus burned
   captions. Never put the narrated sentence, a restatement of it, or an
   explanatory label sentence on screen. Allowed: real numbers, counters,
   currency, units, code, product names, and text that genuinely belongs
   inside a UI mockup. If a beat feels empty without a phrase, build a
   clearer graphic — do not add the phrase.
2. **No black frames.** `PaperWorld`/`PaperBase` already paint an opaque
   background on the outermost `AbsoluteFill` — keep it that way. Never wrap
   the whole comp in a `<Sequence>` that starts after frame 0. Never leave a
   gap where nothing covers the frame. Verify with
   `npm run check:black -- out/<Comp>.mp4`; it must print ✅.
3. **5% side safe margins.** On 1080 wide that is 54px each side; content
   lives in x = 54…1026. Derive from `safePadX(width)`, never hardcode edges.
   Backgrounds may bleed; content may not. Also keep critical content clear of
   the bottom ~12% and top ~10% on 9:16 (Reels UI zones).
4. **Motion is frame-driven.** `useCurrentFrame()` / `spring()` /
   `interpolate()` only. No CSS transitions, keyframes, or Tailwind animation
   classes. `interpolate()` input ranges must be strictly increasing.
5. **Cinematic camera by default.** One continuous world larger than the
   viewport, one keyframed camera. Choreography: open tight on something
   already moving → hold while the action completes → reveal the larger
   system → travel to the contrast/payoff → settle. Camera moves take 14–24
   frames; the action happens during the *hold*, never during a move. End on
   two near-identical keys so the editor gets a clean hold.
6. **Typography floor.** Headline-scale numbers ≥ 64px on 1080×1920.
   Supporting text ≥ 38px. Max two font weights. Tabular numerals (`tabular`)
   for anything that ticks.
7. **Authenticity.** Real logos and real screenshots over invented marks or
   colored rectangles. Never fabricate a metric.

---

## 5. Your deliverable

- Implement exactly **one** file: `src/openseo/<YourComp>.tsx`. It already
  exists as a stub. Overwrite it. Keep the named export and the
  `DURATION_IN_FRAMES` export, and keep the duration value unchanged — it is
  already registered in `src/Root.tsx`.
- **Do not edit** `src/Root.tsx`, `src/openseo/kit.tsx`, or any other
  composition. Other agents own those. Editing them will collide.
- Validate: `npx tsc --noEmit` must pass clean.
- Render stills at your key beats:
  `npx remotion still <Comp> out/<slug>-<frame>.png --frame=<n>`
  Read them back with the Read tool and actually look at them. Fix framing,
  overflow, cropped assets, unreadable type.
- Render the clip: `npx remotion render <Comp> out/<Comp>.mp4`
- Run `npm run check:black -- out/<Comp>.mp4` — must print ✅.
- Re-read at least 4 stills across the timeline after the final render.
- Report back: what you built beat by beat, the stills you checked, the
  black-frame result, and anything you had to compromise on.

Do not report success on a clip you have not looked at.
