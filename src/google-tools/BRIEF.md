# Google Tools series — shared brief (Aug 2026, PAPER + GOOGLE BLUE)

Seven silent B-roll clips for Victor's "5 Free Google AI Tools" reel (Pomelli,
Stitch, Opal, Antigravity, Mixboard). Paper Liam system with Google blue
`#4285F4` as the series accent (import `GOOGLE`/`BRAND`/`GT`/`FACTS` from
`src/google-tools/kit.tsx` — do NOT use `C.orange` in this series). **Style
bar:** the just-shipped Scrapy set (`src/scrapy/`) and screenshot-to-code set
(`src/s2c/`).

## VO script + comps

| # | Comp | Canvas | Frames | VO line (do NOT put on screen) |
|---|------|--------|--------|--------------------------------|
| 1 | `GtP1Hook` | 1080×1080 | 230 | "Google quietly dropped fifteen free AI tools. Most people are still paying for the stuff these replace. Here are the five worth your time." |
| 2 | `GtP2Pomelli` | 1080×1920 | 290 | "First, Pomelli. You paste your website link and it learns your brand: your colors, your fonts, your tone. Then it makes social posts and campaign images that actually look like yours." |
| 3 | `GtP3Stitch` | 1080×1920 | 260 | "Second, Stitch. Describe an app screen in plain English and it designs it, then hands you the code and a Figma file. Around 350 designs a month, free." |
| 4 | `GtP4Opal` | 1080×1920 | 260 | "Third, Opal. It builds automations the way n8n does, except you just describe the workflow and it wires itself together. No code." |
| 5 | `GtP5Antigravity` | 1080×1920 | 260 | "Fourth, Antigravity. A full coding editor like Cursor, and the free version runs Gemini 3 Pro and even Claude." |
| 6 | `GtP6Mixboard` | 1080×1920 | 230 | "Fifth, Mixboard. Think Canva mixed with Pinterest. You generate images and remix them on one board until it looks right." |
| 7 | `GtP7FiveFree` | 1080×1080 | 200 | "All five are free right now. Most are in beta, so the free part won't last forever. And there are ten more where these came from." |

CTA ("Comment GOOGLE…") gets **no video**. Frame counts include editor handles.

Victor burns his own overlays (0:00 "Google quietly dropped 15 free AI tools",
0:07 "1 Pomelli · 2 Stitch", 0:24 "3 Opal · 4 Antigravity", 0:40 "5 Mixboard:
Canva × Pinterest", 0:53 CTA). Nothing on screen may restate the VO or those
overlays — no words like "free", "beta", "no code", "in plain English", no
"Canva × Pinterest" equation text (the marks may appear, the words may not).

## Verified facts (2026-08-09 — never invent or round up)

- **Pomelli** (labs.google.com/pomelli): paste site URL → "Business DNA" (colors,
  fonts, tone) → on-brand campaign content. Real UI strings from their page:
  font specimen "Ivypresto Headline", palette hexes `#34534d` `#80979a`, tone
  pills "Confident" / "Authentic" / "Inspiring". Dark-olive brand `#181D00`,
  cream serif wordmark.
- **Stitch** (stitch.withgoogle.com): prompt → app screen design → export code
  or paste to Figma. **350** standard-mode generations per month on the free
  tier ("350" and "Figma"/"Code" are legit UI data; "free" is not).
- **Opal** (opal.google): describe an app/workflow → visual node graph wires
  itself (editable steps). Real badge: EXPERIMENT. Periwinkle `#665EF6`.
- **Antigravity** (antigravity.google): agent-first coding editor (VS Code
  fork lineage), free "at no charge" (that literal string is on the site
  today). Model picker at launch: **Gemini 3 Pro · Claude Sonnet 4.5 ·
  GPT-OSS 120B** — matches the VO. Real editor screenshot in `GT.shots`.
- **Mixboard** (labs.google.com/mixboard): AI concepting board, generate +
  remix images on a canvas. Real hero sub: "Explore, expand, and refine your
  ideas". Real CTA: "Get started". Lavender board `#E3E6FD`, purple `#8B7CF6`.
- **The count:** 15 free Google AI tools total, 5 featured. Counters ticking
  to 15 or 5 are allowed (data the graphic is about).

## Assets — in `public/google-tools/` (paths via `GT` in kit)

- Real marks: `stitch.png` (512), `antigravity-lockup.svg` + `-mark.svg`
  (vector), `opal-wordmark.png`, `pomelli-wordmark.png` (cream-on-olive — keep
  on olive), `mixboard-wordmark.png` (ink-on-lavender — keep on light),
  shared `logos/google.svg`, `graphify/logos/gemini.svg`,
  `openseo/logos/claude-color.svg`.
- Comparison marks (editorial identity only, never invent their UI): `n8n.svg`,
  `cursor.svg`, `figma-color.svg`, `pinterest.svg`, `canva.png`.
- Real product imagery: Antigravity editor + CLI shots, 3 Pomelli campaign
  heroes, 4 Mixboard board images, Opal share card — all in `GT.shots`.
- Reference page captures for style: `public/google-tools/reference/
  pomelli-page.png`, `mixboard-page.png`.
- **Never scale the 32–48px favicons** (not exported in the kit for a reason).
  Pomelli/Mixboard/Opal identity on screen = their wordmark crops.

## Type system

- Headlines / product names: `DISPLAY` (Figtree 600/700) — Google-Sans-alike
- Code / commands / numbers: `MONO` (JetBrains Mono) with `tabular`
- Supporting UI text: `FONT` (Inter). Max two weights per comp.
- Numbers ≥64px on 9:16, supporting ≥38px, mono ≥30px on screen.

## Rules (a render is rejected on any of these)

1. **No redundant on-screen text** — nothing restates VO/overlays. Allowed:
   real numbers, real UI strings listed above, URLs, file names, model names.
2. **No black frames** — PaperWorld/PaperBase opaque from frame 0→last.
   `npm run check:black -- out/<Comp>.mp4` must print ✅.
3. **5% side margins** — content x = 54…1026. On 9:16 keep critical content
   clear of top ~10% / bottom ~12%.
4. **Frame-driven motion only** — useCurrentFrame/spring/interpolate, inputs
   strictly increasing. No CSS transitions/keyframes.
5. **Cinematic camera** — PaperWorld + useCam, hold → move (14–24f, EASE) →
   hold, action during holds, end on two near-identical keys (~25f hold).
6. **No glow.** Accent through borders, fills, chips. Neutral kit shadows only.
7. **Authenticity** — real marks and real strings only. Dark surfaces (Pomelli
   olive, Stitch tile, editor chrome) live INSIDE cards on the paper base —
   the world itself stays Liam white.

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
tracks reading as data; upscaled-blurry favicons.

## Delivery

Orchestrator copies finished MP4s to `.../reels/repos/google tools/` named by
the first 4–5 script words. Builders leave mp4s in `out/`.
