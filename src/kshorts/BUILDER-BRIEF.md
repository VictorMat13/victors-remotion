# Koen x Runable — shared builder brief (read this first, in full)

You are building ONE part of a 9-part sponsored Instagram Reel for **Koen**
(@koen.agi, YouTube @Koen-ai) promoting **Runable**. All 9 parts must read as one
visual system. Another agent is building each of the other parts **concurrently in
this same repo** — stay in your lane.

Project root: this repo

## Reading list — read ALL of these before writing code

1. the `liam-remotion-graphics` skill (`SKILL.md`, local)
2. its `reference/upstream/cinematic-camera.md` (local)
3. `src/kshorts/theme.ts` — the shared DNA. **READ-ONLY. Never edit it.**
4. The reference screenshots listed in your part brief — open them with Read and
   actually LOOK at them. Filenames are not enough.

## Approved visual references — this is the bar

These are Liam's **approved, delivered** Runable renders. Same product, same
style system, same white world. Extract frames and look at them:

```bash
ffmpeg -i "<local footage>/Then it makes the cold emails.mp4" \
  -vf "fps=1/2,scale=540:-1" /tmp/ref-%02d.png -y
```

Other approved renders in that same folder:
`Runables the AI agent.mp4`, `And heres the part.mp4`, `You can run Meta ads.mp4`,
`Heres what launched.mp4`, `Once those ten thousand spots.mp4`.

What they establish: a warm white world (`LW.paper`), **floating white cards with
soft shadows and hairline borders**, real Runable UI recreated faithfully inside
those cards, amber (`RN.amber`) as the only saturated accent, generous whitespace,
few large elements rather than many small ones.

## Victor's direction for THIS series

> "Liam's style promotion graphics. I want it to look like almost like a screen
> recording. They're all going to be one to one aspect ratio."

**"Almost like a screen recording" is the governing note.** These graphics are
recreations of real product UI in motion — a cursor moving, text typing, a button
pressing, a list streaming in, a panel scrolling — not abstract diagrams. Build
the real interface and let it *behave*. Micro-motion during holds is mandatory:
carets blink, counters tick, rows stream, thumbnails load.

Aspect ratio: **1080x1080 (1:1)** for every part. Your comp is already registered.

## Ownership contract

- Your file is named in your part brief. It is **already registered in
  `src/Root.tsx`** — do NOT touch `Root.tsx`.
- Keep BOTH exports exactly as scaffolded: the named component and
  `DURATION_IN_FRAMES`. You may change the duration *value* if your beat needs it.
- **Edit no file other than your own comp file.** Other agents are working here.
- Never edit `src/kshorts/theme.ts`. If you need a token that isn't there,
  define it locally in your own file.

## Hard rules — non-negotiable, verbatim from the skill

1. **No black frames.** The root `<AbsoluteFill>` must paint an opaque
   `backgroundColor` (`LW.paper`) for the FULL duration, frame 0 through the last
   frame. Never wrap the whole comp in a `<Sequence>` that starts after frame 0.
   Entrance animations apply to foreground only; the background never fades in.
2. **5% side safe margins.** Content lives in x = 54 → 1026 on a 1080 canvas. Use
   `safePadX(width)` from the theme; derive positions from it. Backgrounds may
   bleed full-frame; *content* may not.
3. **No redundant on-screen text.** The reel has spoken VO + burned captions over
   the top. **Never put the narrated line on screen.** No headline restatements,
   no explanatory captions, no pill/badge phrases echoing the narration. Allowed:
   real UI strings from `theme.ts`, real data (view counts, timestamps, durations),
   code/terminal text, axis labels. If a beat feels empty without a phrase, the
   fix is a better graphic, not added text.
4. **Real assets only.** Every Runable UI string comes from `UI` in `theme.ts`.
   Every YouTube title/view-count comes from `SHORTS`/`CHANNEL`. Do not invent
   product copy, Shorts titles, or metrics.
5. **Check `DO_NOT_RENDER` in `theme.ts`** and obey every entry. In particular:
   no "Free plan / Upgrade" pill, and this is **Koen's** account, never Victor's.
6. All motion from `useCurrentFrame()` / `useVideoConfig()`. `spring()` for
   entrances, `interpolate()` for fades and progress (input ranges strictly
   increasing). No CSS transitions/keyframes.
7. Camera grammar: **hold → move → hold**, moves of 14–24 frames,
   `Easing.inOut(Easing.cubic)`. The action happens during the hold, never during
   a move. End on a settled hold of ~25 frames so the editor can cut clean.

## Build-verify loop — do all of it, do not skip to the end

```bash
cd "<project root>"

# 1. typecheck (must be clean before you render)
npx tsc --noEmit

# 2. stills at each beat — then READ them and compare to the references
npx remotion still src/index.ts <CompId> out/<CompId>-f30.png --frame=30
npx remotion still src/index.ts <CompId> out/<CompId>-f90.png --frame=90

# 3. full render
npx remotion render src/index.ts <CompId> out/<CompId>.mp4

# 4. black-frame gate — MUST print no black frames
npm run check:black -- out/<CompId>.mp4
```

**Actually Read the stills you render.** Compare them against the approved
reference frames for framing, density, type scale, and polish. Iterate until your
part looks like it belongs in the same series. A part that typechecks but looks
wrong is not done.

## Return format — raw data, not prose

```
PART: <id>
DURATION: <frames> (<seconds>s)
MP4: <absolute path>
GATES: tsc PASS|FAIL · black-frames PASS|FAIL · margins PASS|FAIL · no-VO-text PASS|FAIL
BEATS: <one line per beat with frame range>
FLAGS: <anything the checker should look at, or NONE>
```

---

# v2 DIRECTION — MAKE IT AN ACTUAL SCREEN RECORDING (2026-08-28)

Victor, after seeing v1: **"the remotions don't look enough like actual screen
recordings."** This supersedes the floating-card approach for every part that has
a real capture behind it.

## What was wrong with v1

v1 *recreated* product UI as tidy white cards floating in a warm-white world with
generous whitespace. That reads as a designed motion graphic. A screen recording
is the opposite: the real interface fills the frame, it is dense, it scrolls, and
a cursor drives it.

## The v2 method — composite onto the real capture

**Do not rebuild the interface out of divs. Use the real screenshot as the base
layer and animate on top of it.** Every pixel of chrome is then genuine.

Reference implementation to copy the pattern from: **`src/kshorts/KsP2Insane.tsx`**.
Read it before you start. It:

1. Puts the capture full-bleed as the base plate via `<Img>` at a fixed `ZOOM`,
   positioned by a focal point — no white world visible, because a screen
   recording IS the screen.
2. Animates the focal point to **scroll** the page (hold → scroll → hold), rather
   than cutting between framings.
3. Draws the app's OWN loading skeletons over regions that should not exist yet,
   and resolves them one at a time so content appears to load in.
4. Moves a **cursor** with eased, human-looking drift, and clicks where a person
   would click.
5. Adds a whisper of vignette so it reads as footage rather than a flat asset.

## Rules that change

- **The capture fills the frame.** No card floating in whitespace. Bleed the real
  UI to all four edges.
- **Partial elements at the frame edge are CORRECT** — a real recording shows the
  page continuing offscreen. The 5% margin rule now applies only to the elements
  the beat is *about*; incidental chrome may bleed.
- **Density is good.** Sidebars, top bars, right rails, adjacent rows — leave them
  in. v1 stripped them and that is what made it look designed.
- **Motion is interaction, not choreography.** Scroll, type, click, hover, load.
  Avoid springy cards flying in from nowhere.
- Cursor: 26x34 arrow, white fill, dark stroke, soft drop-shadow. Ease with
  `Easing.inOut(Easing.quad)`. It should pause before it clicks.

## Rules that stay

Everything under "Hard rules" above still applies: opaque background frame 0 to
last, no narration-echo text, real assets only, all motion from
`useCurrentFrame`/`interpolate`/`spring`, `<Img>` never CSS `backgroundImage`,
`useKsFonts()` for typography, and the full build-verify loop including
`npm run lint` and `npm run check:black`.

`DO_NOT_RENDER` still binds — in particular the "Free plan / Upgrade" pill must be
covered over if it is visible in your base capture.

## Available captures (public/kshorts/reference/)

| File | Shows |
|---|---|
| `10-composer-typed.png` | Runable Build tab, full app chrome, prompt in composer |
| `12-q1.png` | Runable chat mid-run: AUTO, Completed 1 step, 6-question card |
| `06-skills.png` | Runable Skills page, Active Skills list |
| `03-plugins.png` | Runable Plugins page |
| `00-probe.png` | Runable Grow tab + right rail "Your handles" |
| `yt-banana-shorts.png` | youtube.com/@ReadytoBanana/shorts, full page |

The channel changed to **@ReadytoBanana** (1.54M subscribers, 257 videos). All
channel and Shorts strings come from `CHANNEL` / `SHORTS` in `theme.ts`.
