// Shared typography loader for the Koen x Runable series.
//
// WHY THIS EXISTS: FONT_SANS in theme.ts names 'IDGrotesk' first (Runable's real
// typeface, TTFs already shipped in public/bgrow/fonts), but naming a family does
// not register it. Without a matching @font-face the stack silently falls through
// to system sans. During the first build pass some parts registered the face
// locally and others did not, so the series rendered in TWO different typefaces —
// obvious once the parts are cut together.
//
// Every kshorts comp calls useKsFonts() so all nine parts share one face.
// Registration is idempotent and scoped to this series' style element id.

import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

const STYLE_ID = "kshorts-idgrotesk-faces";

const FACES = [
  { weight: 300, file: "IDGrotesk-Light.ttf" },
  { weight: 400, file: "IDGrotesk-Regular.ttf" },
  { weight: 500, file: "IDGrotesk-Medium.ttf" },
  { weight: 600, file: "IDGrotesk-Bold.ttf" },
  { weight: 700, file: "IDGrotesk-Bold.ttf" },
] as const;

const css = () =>
  FACES.map(
    (f) => `@font-face {
  font-family: 'IDGrotesk';
  font-weight: ${f.weight};
  font-style: normal;
  font-display: block;
  src: url('${staticFile(`bgrow/fonts/${f.file}`)}') format('truetype');
}`,
  ).join("\n");

/**
 * Registers Runable's ID Grotesk and holds the render until the faces are ready.
 * Safe to call from every composition — the style tag is only injected once.
 */
export const useKsFonts = (): void => {
  const [handle] = useState(() => delayRender("kshorts IDGrotesk"));

  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = css();
      document.head.appendChild(el);
    }

    // Never let a font failure hang the render — continue either way.
    const done = () => continueRender(handle);
    Promise.all(
      FACES.map((f) => document.fonts.load(`${f.weight} 40px "IDGrotesk"`)),
    )
      .then(done)
      .catch(done);
  }, [handle]);
};
