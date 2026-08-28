# Higgs-Chat series — shared brief (Aug 2026, PAPER + LIME, REAL CHATGPT SHOTS)

Six silent B-roll clips for Victor's "ChatGPT × Higgsfield" reel. Paper Liam
world with Higgsfield lime `#84CC16` as the series accent (import `HIGGS`,
`GPT`, `HC`, `FACTS` from `src/higgs-chat/kit.tsx`). **Style bar:** the
just-shipped google-tools set (`src/google-tools/`, esp. `GtP5Antigravity` —
real screenshot inside a window card, dropdown matched to host UI) and the
prior approved Higgsfield comps (`src/HiggsConnectorSwitch.tsx`,
`src/HiggsPhotoToAd.tsx`, `src/HiggsfieldThreeAds.tsx`).

## THE SIGNATURE MOVE (Victor's directive)

The chat beats are built on REAL chatgpt.com screenshots (in `HC.shots`) and
driven with **dynamic zoom ramps**: fast push-ins (10–16f, `EASE`) from a
readable wide to a tight detail exactly when the VO names it, hold while the
action happens (click pulse, typing, row appearing), then ramp to the next
target. Camera = `PaperWorld` + `useCam`; the ChatGPT window is a world
object (dark UI lives INSIDE a card; paper stays the page).

Composited states that don't exist in the captures (search results row,
sign-in confirmation, chat messages/bubbles) are built pixel-matched to the
sampled `GPT` tokens ON TOP of the screenshot so they read as one UI. Copy
the construction of the real rows in the plugins capture (44px icon tile,
16px-ish name, muted description, round + button on the right).

## VO script + comps

| # | Comp | Canvas | Frames | VO line (do NOT put on screen) |
|---|------|--------|--------|--------------------------------|
| 1 | `HcP1Hook` | 1080×1080 | 170 | "Your ChatGPT is missing a five-minute upgrade that makes it feel like a completely different tool." |
| 2 | `HcP2Connect` | 1080×1920 | 200 | "Connect Higgsfield, and it can turn a single product photo into a full UGC video without leaving the chat." |
| 3 | `HcP3Plugins` | 1080×1080 | 200 | "Inside ChatGPT, click Plugins, hit Search plugins, type Higgsfield, click Add, and sign in." |
| 4 | `HcP4Upload` | 1080×1080 | 170 | "Upload one product photo and say, 'Turn this into a UGC video.' The image lands directly in the chat." |
| 5 | `HcP5Animate` | 1080×1080 | 150 | "Ask it to animate that, and the finished video appears underneath." |
| 6 | `HcP6UsefulPart` | 1080×1920 | 260 | "The useful part is getting better hooks, keeping the character consistent, and turning one product into content you can use for your brand or show a client." |

"That's the whole connection" / "That's the easy part" get NO b-roll (Victor
zoom-ramps his talking head). CTA-less script. Frame counts include handles.
P5's ratio was unspecified in the script — 1:1 as a continuation of the P4
chat scene (assumption approved by orchestrator).

Victor burns his own overlays. Nothing on screen may restate the VO —
no "five-minute upgrade", "without leaving the chat", "UGC video" as a
LABEL, "better hooks", "consistent", etc. Allowed: real UI strings in
`FACTS` (sidebar items, "Plugins", "Search plugins", "Ask anything", …),
typed USER prompts ("Turn this into a UGC video", "Animate that" — they are
chat input, the graphic is literally about typing them), file/product names,
the marks.

## Real assets (in `HC` — use these, never invent)

- `HC.shots.plugins` — real Plugins directory (header, search box, Featured
  rows with + buttons). Base for P3's walkthrough.
- `HC.shots.home` — real chat home (sidebar + "Ready when you are." +
  "Ask anything" composer), cookie banner already cropped. Base for P1/P4/P5.
- `HC.productPhoto` — real früns Superfood Heart Gummies pouch photo.
- `HC.ugcVideo` — real 15s 1080×1920 UGC result (use `<OffthreadVideo>`,
  `muted`, trim to the segment you need); `HC.shots.ugcFrame` for stills.
- `HC.logos.*` — real Higgsfield mark/icon (lime), OpenAI mark (black+white).
- The screenshots contain third-party marks (Gmail, Slack, GitHub…) — fine,
  it's the real directory (editorial use). Do NOT build fake rows for them.

## Sampled ChatGPT tokens (use `GPT.*`, never guess)

true-black bg #000000 · raised #1A1A1A · composer #212121 · icon tile
#1F1F1F · text #FFFFFF · muted #A9A9A9 · placeholder #696969 · hairline
rgba(255,255,255,0.10). The window card gets the kit's neutral shadow on the
paper world; radius family 16–24.

## Logged-out artifacts in the captures — patch, don't ship

The captures show "Log in / Sign up for free" (top-right), a "Get responses
tailored to you" sidebar footer block, and a "Log in" sidebar button. Either
keep zooms tight enough that they never enter frame, or patch them out with
`GPT.bg` rects before animating. The home capture's bottom cookie banner is
already cropped off `HC.shots.home`.

## Rules (a render is rejected on any of these)

1. **No redundant on-screen text** (see allowed list above).
2. **No black frames** — the PAPER is the page; the black ChatGPT window
   must never fill the entire frame edge-to-edge at any moment
   (`npm run check:black -- out/<Comp>.mp4` must print ✅ — keep visible
   paper/lime context around the window at all zoom levels, minimum a few
   hundred pixels of border glow-free paper).
3. **5% side margins** (54px) for content; 9:16 keeps top ~10% / bottom ~12%
   clear of critical content.
4. **Frame-driven motion only**; strictly increasing interpolate inputs.
5. **Camera** hold→move→hold, 10–16f ramps for the zoom hits (this series
   runs faster than usual — it's a walkthrough), end on two near-identical
   keys (~25f hold).
6. **No glow.** Lime accent via borders/fills/chips. Kit shadows only.
7. **Authenticity** — real screenshots + `GPT`-token-matched composites
   only; cursor clicks use the kit `Cursor` + press ripple; never scale the
   product photo or UGC frames past native (photo 426×620, video 1080×1920).

## QA loop (every builder, before reporting done)

```
npx tsc --noEmit
npx remotion still <Comp> out/<slug>-<frame>.png --frame=<n>   # each zoom target — LOOK at it
npx remotion render <Comp> out/<Comp>.mp4
npm run check:black -- out/<Comp>.mp4
```

Known defect patterns to avoid (from the google-tools audit): elements
sliced by frame edges during HOLDS (whip midpoints fine); composited UI at
2× the host's scale; mid-tween states parked for a full second; dead bottom
space on 9:16; counters/labels running ahead of the visuals; baked-in
screenshot fragments with visible seams; upscaled favicons.

## Delivery

Orchestrator copies finished MP4s to
the local reference folder (`higgs 1/`, kept outside this repo)
named by the first 4–5 script words. Builders leave mp4s in `out/`.
