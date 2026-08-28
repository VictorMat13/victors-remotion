# Graphify series — build brief (DARK)

Five Remotion clips cut from one talking-head script about **Graphify**
(`github.com/Graphify-Labs/graphify`). All five must read as ONE visual system.

**Read the full handoff first — it has the script, every verified fact, the palette
reasoning and the beat maps:**
the local handoff doc (`graphify/HANDOFF.md`, kept outside this repo)

Project root: this repo

---

## 1. Your kit — import from here, do not fork

`src/graphify/kit.tsx` is done and **read-only for you**. It gives you:

- `G` — the dark palette. `G.bg` is `#1E241F`, deliberately chosen to clear the
  black-frame detector (see §3). Never darken it.
- `GraphWorld` — dark base + radial lift + light-on-dark grid + camera rig. Same
  signature as the paper set's `PaperWorld`.
- `GraphBase`, `GCard`, `GChip`, `GTerminal`, `GraphifyMark`, `GraphifyLockup`, `GLogo`
- `accentA(a)`, `amberA(a)` — accent/amber at an alpha
- Re-exported theme-agnostic helpers: `useCam`, `useCountUp`, `useTypewriter`,
  `tabular`, `fmt`, `safePadX`, `SPRINGS`, `EASE`, `useEnter`, `Cursor`
- `GA` — real assets (the Graphify mark, the GitHub OG card, Claude/Codex/Gemini/GitHub logos)
- **`GRAPH_NODES` / `GRAPH_EDGES`** — see §2, this is the important one

## 2. The shared graph — the spine of the whole set

Graphify's logo **is** a node-link graph. The kit exports one canonical layout
(`GRAPH_NODES`, `GRAPH_EDGES`) with **fixed world coordinates**, centred on (0,0).

Every clip that shows a graph MUST use those exact positions:

- §1 chaos resolves **into** this graph
- §3 this graph assembles and reads as the Graphify **G**
- §4 this same graph **grows** — the `doc` / `sql` / `config` / `pdf` nodes join
- §5 this same graph **feeds three tools**

A viewer should recognise it as the same object every time. Do not invent your own
layout, do not jitter the positions, do not re-order the nodes.

Node kinds: `code` nodes exist from §1 onward. `doc` / `sql` / `config` / `pdf` only
appear from §4. `KIND_COLOR` maps kind → colour.

Edges carry `rel: "EXTRACTED" | "INFERRED"` — Graphify's real mechanic. Render
`EXTRACTED` as **solid, accent green, confident** and `INFERRED` as **dashed, amber,
softer**. This only needs to be *explicit* in §4, but use the same colours wherever
edges appear so it is consistent.

## 3. Hard rules — a render is rejected on any of these

1. **No redundant on-screen text.** Victor burns his own captions over these (listed in
   the handoff §2). Never put the narrated sentence, a restatement, or an explanatory
   label on screen. Allowed: real file names, real numbers, counters, code, command
   strings, `EXTRACTED`/`INFERRED`, and genuine UI text.
2. **No black frames.** `GraphWorld` already paints an opaque base + lift + grid for the
   full duration — keep it that way, never wrap the comp in a delayed `<Sequence>`.
   Verified: a near-empty dark frame renders at YAVG 36 and passes. If you darken
   anything full-frame you will break this. Check with
   `npm run check:black -- out/<Comp>.mp4` — must print ✅.
3. **5% side safe margins** — 54px each side on 1080; content lives x = 54…1026. Derive
   from `safePadX(width)`. Backgrounds bleed, content does not. On 9:16 also keep
   critical content clear of the bottom ~12% and top ~10%.
4. **Frame-driven motion only** — `useCurrentFrame()` / `spring()` / `interpolate()`.
   No CSS transitions or keyframes. `interpolate()` inputs strictly increasing.
5. **Cinematic camera** — one continuous world, one keyframed camera. hold → move
   (14–24f) → hold. Action happens during holds, never during a move. End on two
   near-identical keys for a clean editor cut.
6. **Type floor** — headline numbers ≥64px on 1080×1920, supporting text ≥38px, max two
   weights, `tabular` on anything ticking.
7. **NO GLOW.** This is enforced across the whole project. No radial halos behind
   objects, no `0 0 Npx rgba(colour)` bleed, no coloured drop shadows. Dark themes
   normally lean on bloom — this one may not. Get contrast from stroke weight, fills,
   borders, and the value steps `G.bg` → `G.panel` → `G.card`. Flat rings (blur 0) are
   fine. The one permitted soft light is the base lift already inside `GraphWorld`.
8. **Authenticity** — real logos and real product output. Never fabricate a metric. The
   verified numbers are in handoff §3.

## 4. Your deliverable

- Implement exactly **one** file: `src/graphify/<YourComp>.tsx`. It exists as a stub —
  overwrite it. Keep the named export and `DURATION_IN_FRAMES` **unchanged**; it is
  already registered in `src/Root.tsx`.
- **Do not edit** `src/Root.tsx`, `src/graphify/kit.tsx`, or any other composition.
- `npx tsc --noEmit` must pass clean for your file.
- Render stills at your key beats:
  `npx remotion still <Comp> out/<slug>-<frame>.png --frame=<n>`
  **Read them back with the Read tool and actually look at them.** Fix framing,
  overflow, cropped assets, unreadable type, hollow cards, dead frames.
- Render: `npx remotion render <Comp> out/<Comp>.mp4`
- `npm run check:black -- out/<Comp>.mp4` — must print ✅.
- Re-read at least 4 stills across the timeline **after** the final render.

## 5. Known failure modes — check for these specifically

These all shipped as "done" on the previous set and had to be sent back:

- Effects drawn **over** the hero number at the exact landing frame
- An empty chart/track solid enough to read as a second bar
- Asymmetric crops undermining a beat that argues sameness
- A bare logo sitting next to a logo+wordmark lockup — they must match
- Cards landing before their contents, leaving a hollow band for ~30 frames
- Colour ramps passing through mud mid-transition

Do not report success on a clip you have not looked at.
