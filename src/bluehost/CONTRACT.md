# Bluehost × Hermes walkthrough — component contract

One continuous world, one camera (owned by the integrator in
`BluehostHermesV.tsx` / `BluehostHermesH.tsx`). Components in this folder are
**pure renderers**: every visual state is a deterministic function of props.

## Hard rules (apply to every file)

- NO CSS transitions, CSS animations, or Tailwind animation classes.
- NO `useCurrentFrame()` inside components — motion comes in through props
  (`t` = local frame number, or explicit 0..1 progress values). This keeps all
  choreography in the integrator.
- Import shared values from `./constants` (`BH`, `WORLD`, `PORTAL`, `CATALOG`,
  `CAT_CARD`, `SPRINGS`). Do not restate hex colors or dimensions.
- Fonts: `loadFont as loadInter` from `@remotion/google-fonts/Inter`,
  `loadFont as loadMono` from `@remotion/google-fonts/JetBrainsMono`.
- Logos via `staticFile("bluehost/…")` with `<Img>` from remotion. Never draw
  placeholder marks. `hermesagent-logo.svg` + `openwebui-logo.svg` use
  `currentColor` → wrap in a div with `color: BH.navy` (or as specified).
- Reference screenshots of the real portal live at
  the local reference folder (`bh_01..07.png`, kept outside this repo)
  — match their layout hierarchy, spacing rhythm, and tone. Recreate the idea
  of the UI cleanly at our sizes; do not try to copy pixel-for-pixel.
- Text must stay inside the component's stated bounds — no overflow.
- `interpolate()` input ranges strictly increasing; clamp both sides.

## Files & prop signatures
(see the dispatch prompt for your assignment)
