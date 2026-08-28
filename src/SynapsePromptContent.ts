// Full SynapseX hero-section prompt, structured for the PromptScroll composition.
// Inline markers: **bold** and `code` are parsed by renderInline().

export type Block =
  | { t: "h1"; text: string }
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "li"; text: string }
  | { t: "num"; n: number; text: string }
  | { t: "code"; text: string }
  | { t: "hr" };

export const PROMPT_BLOCKS: Block[] = [
  { t: "h1", text: "Prompt:" },
  {
    t: "p",
    text: 'Build a single-page fullscreen hero section for a brand called "SynapseX" using React, Vite, Tailwind CSS v4, and Framer Motion (`motion/react`). Use the `lenis` library for smooth scrolling on desktop. The page is a dark, cinematic fullscreen video-backed landing with scroll-driven animations and text scramble effects.',
  },
  { t: "hr" },
  { t: "h2", text: "Tech stack:" },
  { t: "li", text: "React 19, Vite, TypeScript" },
  { t: "li", text: "Tailwind CSS v4 (via `@tailwindcss/vite` plugin)" },
  {
    t: "li",
    text: "`motion` (Framer Motion v12+, imported from `motion/react`)",
  },
  { t: "li", text: "`lenis` for smooth scroll on desktop only" },
  {
    t: "li",
    text: 'Font: "Space Mono" monospace from Google Fonts (used for ALL font families: sans, serif, mono)',
  },
  { t: "li", text: "Bootstrap Icons CDN for the Apple icon (`bi bi-apple`)" },
  { t: "hr" },
  { t: "h2", text: "Font / CSS setup (`index.css`):" },
  {
    t: "li",
    text: "Import Google Fonts: `Space Mono` (400, 700, italic variants)",
  },
  { t: "li", text: "Import Bootstrap Icons CSS from jsdelivr CDN" },
  { t: "li", text: "Import `tailwindcss`" },
  {
    t: "li",
    text: 'Override all Tailwind font theme vars (`--font-sans`, `--font-serif`, `--font-inter`, `--font-mono`) to `"Space Mono", monospace`',
  },
  {
    t: "li",
    text: "`html, body`: font-family var(--font-sans), bg black, color white, no margin/padding, overflow-x hidden, overflow-y auto",
  },
  {
    t: "li",
    text: "Lenis compatibility classes (`.lenis.lenis-smooth`, `.lenis.lenis-stopped`, `.lenis.lenis-scrolling iframe`)",
  },
  { t: "hr" },
  { t: "h2", text: "Background video (CRITICAL - read carefully):" },
  {
    t: "li",
    text: "URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260618_100841_e2e90f11-7266-46f0-9e36-00fe38315b91.mp4`",
  },
  {
    t: "li",
    text: 'Rendered in a `LiquidVideoCanvas` component: a fixed fullscreen `<video>` element (loop, muted, playsInline, preload="auto", object-cover)',
  },
  {
    t: "p",
    text: "**IMPORTANT - NO DARK OVERLAY:** The video container must have NO dark overlay, NO semi-transparent black layer, NO `bg-black/50`, NO `::after` pseudo-element with opacity, and NO gradient overlay on top of the video. The video should be fully visible at its natural brightness. The only container background should be `bg-black` on the wrapper div itself (visible only before the video loads). Do NOT add any darkening filter, overlay div, or tint on top of the video.",
  },
  { t: "p", text: "**IMPORTANT - Z-INDEX LAYERING (must follow exactly):**" },
  {
    t: "li",
    text: "Video container: `fixed inset-0 z-[1]` - this is the LOWEST layer",
  },
  { t: "li", text: "Progressive blur: `fixed bottom-0 z-30`" },
  {
    t: "li",
    text: "Main content (text, headings): `z-10` (above video, below header)",
  },
  { t: "li", text: "Header: `z-50` (topmost)" },
  {
    t: "li",
    text: "The root wrapper is `relative` with `overflow-x-hidden`. The main content area must NOT have a background color that would obscure the video. The video must always be VISIBLE through the content layers. Do NOT set `bg-black` on any element that sits above the video container.",
  },
  {
    t: "p",
    text: "**Video scroll-scrubbing (CRITICAL - frame seeking logic):**",
  },
  {
    t: "li",
    text: "The video is NOT autoplayed. Its `currentTime` is driven by scroll progress via requestAnimationFrame with LERP smoothing (factor 0.12).",
  },
  {
    t: "li",
    text: "**Frame-accurate seeking with `if (!video.seeking)` guard:** Only request a new video frame seek when the browser has completely finished rendering the previous frame. This prevents frame-skipping, jank, and black flashes. The pattern:",
  },
  {
    t: "code",
    text: `if (!isSeeking && !video.seeking) {
  isSeeking = true;
  video.currentTime = clampedTime;
} else {
  nextSeekTime = clampedTime; // queue for after current seek completes
}`,
  },
  {
    t: "p",
    text: 'We tell the browser: "Update the video frame ONLY when you have completely finished painting the previous one." This is essential for smooth, buttery playback on all devices. Without this guard, multiple overlapping seeks cause the video to show black frames or stutter.',
  },
  {
    t: "li",
    text: "Listen for `seeking` and `seeked` events on the video element. On `seeked`, check if there's a queued `nextSeekTime` and execute it.",
  },
  { t: "p", text: "**Entrance animation:**" },
  {
    t: "li",
    text: "Starts at scale 1.12, opacity 0. On video `readyState >= 3`, animates over 1.4s with cubic ease-out to scale 1.0, opacity 1. Has a 3.5s safety timeout fallback.",
  },
  {
    t: "p",
    text: "**Scroll-driven visual effects (applied directly to DOM via ref, NOT via React state):**",
  },
  {
    t: "li",
    text: "Progressive blur: 0-55px based on scroll (subtle base 0-5px in first half, then aggressive 5-55px in second half)",
  },
  { t: "li", text: "Scale: 1.03 to 1.11 based on scroll progress" },
  {
    t: "li",
    text: "Error handling with consecutive error tracking (max 3 retries)",
  },
  { t: "hr" },
  { t: "h2", text: "Progressive blur overlay:" },
  {
    t: "li",
    text: "A `ProgressiveBlur` component fixed to the bottom of the viewport (z-30)",
  },
  {
    t: "li",
    text: "Uses CSS gradient + backdrop-filter blur (4px), height 150px, fades from transparent to black",
  },
  {
    t: "li",
    text: "This is the ONLY element allowed to darken the bottom edge. It must NOT cover the full viewport.",
  },
  { t: "hr" },
  { t: "h2", text: "Header (fixed, z-50, h-20, transparent background):" },
  {
    t: "li",
    text: "Fades in (opacity 0 to 1, duration 0.8s) only after the video entrance animation completes",
  },
  {
    t: "li",
    text: "Desktop (sm+): flex row with logo pill on left, download button on right",
  },
  {
    t: "li",
    text: 'Logo pill: h-12, px-5, bg-white/15, backdrop-blur-md, rounded-[14px], contains a custom SVG logo (4 rotated leaf/petal shapes in a 100x100 viewBox) + "SynapseX" text (16px, font-medium, white). whileHover scales 1.02 with brighter bg. whileTap scales 0.98.',
  },
  {
    t: "li",
    text: 'Download button: h-12, px-6, bg-white, rounded-full, contains Bootstrap Icons apple icon + "Download" text with ScrambleText hover effect. whileHover scales 1.03, bg #e2e2e6. whileTap scales 0.97. No link/href.',
  },
  {
    t: "li",
    text: "Mobile (<sm): same layout but smaller (h-9, smaller text at 13px, smaller padding)",
  },
  { t: "hr" },
  { t: "h2", text: "SVG Logo (exact path data):" },
  {
    t: "code",
    text: `<svg viewBox="-50 -50 100 100">
  <g fill="currentColor">
    <path d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z" />
    <path ... transform="rotate(90)" />
    <path ... transform="rotate(180)" />
    <path ... transform="rotate(270)" />
  </g>
</svg>`,
  },
  { t: "hr" },
  {
    t: "h2",
    text: "Hero content (main section, h-screen, pt-20, pb-36, px-4 sm:px-8, z-10, NO background color):",
  },
  {
    t: "li",
    text: "Fades in (opacity 0 to 1, duration 1.0s) after video entrance completes",
  },
  {
    t: "li",
    text: "Subtle ambient dot grid overlay: `bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]` (pointer-events-none, does NOT block video visibility)",
  },
  {
    t: "li",
    text: "Content wrapper: max-w-7xl, mx-auto, min-h-[80vh], flex col, justify-between",
  },
  {
    t: "li",
    text: "Scroll-driven: heroOpacity fades from 1 to 0 over scrollYProgress [0, 0.26], heroScale from 1 to 0.96",
  },
  { t: "p", text: "**Layout (2x2 grid on md+):**" },
  {
    t: "li",
    text: '**Top-left:** Large heading "Brain" / "And Body" (each on its own line). Font: font-light, responsive sizing (50px / 70px / 85px / 100px), white, leading-[0.95], tracking-[-0.03em]. Each word uses a `ScrambleIn` component that scrambles in character-by-character from left to right when triggered.',
  },
  { t: "li", text: "**Top-right:** Empty spacer (hidden on mobile)" },
  {
    t: "li",
    text: "**Bottom-left:** Description paragraph (max-w-sm, 14-15px, text-white/60, leading-relaxed). Animates in with y:25->0, opacity 0->1 (duration 0.9s, cubic bezier [0.215, 0.610, 0.355, 1.000], delay 0.2s). Fades out on scroll (descOpacity [0,0.12]->[1,0], descY [0,0.12]->[0,-30]).",
  },
  {
    t: "li",
    text: 'Text: "Built at the intersection of neuroscience and artificial intelligence. SynapseX continuously maps neural pathways, cognitive load, and physiological states into a single adaptive intelligence layer."',
  },
  {
    t: "li",
    text: '**Bottom-right:** Large heading "One" / "Network" (same style as top-left but right-aligned, flex-col items-end). Uses ScrambleIn with different delays.',
  },
  { t: "hr" },
  { t: "h2", text: "ScrambleIn component:" },
  { t: "li", text: "Props: text, scrollProgress, delay, trigger (boolean)" },
  {
    t: "li",
    text: "Character set: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><`",
  },
  {
    t: "li",
    text: "When triggered and scroll is near top (scrollProgress < 0.015): scrambles in left-to-right over 900ms. Each character has a threshold based on its index. Characters transition from blank -> random glyph -> final character.",
  },
  {
    t: "li",
    text: "When scrolling down (scrollProgress > 0.015): scrambles out over 700ms with opacity fade to 0.",
  },
  {
    t: "li",
    text: "Initial state: non-breaking spaces (same width as final text to prevent layout shift)",
  },
  { t: "hr" },
  { t: "h2", text: "ScrambleText component (for hover):" },
  { t: "li", text: "Props: text, isHovered, className" },
  {
    t: "li",
    text: "On hover: starts progressive left-to-right decode animation at ~40FPS (25ms interval). Each character decodes at frame `index * 4`. Total frames: `length * 4 + 4`.",
  },
  { t: "li", text: "On unhover: immediately resets to original text." },
  { t: "hr" },
  { t: "h2", text: "Lenis smooth scroll (desktop only):" },
  { t: "li", text: "Duration: 1.2" },
  {
    t: "li",
    text: "Easing: `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))` (exponential deceleration)",
  },
  {
    t: "li",
    text: "smoothWheel: true, wheelMultiplier: 1.0, touchMultiplier: 1.5",
  },
  {
    t: "li",
    text: "Disabled on mobile (detected via UA string + screen width < 768)",
  },
  { t: "hr" },
  { t: "h2", text: "Key dependencies (package.json):" },
  { t: "li", text: "`motion` ^12.23.24" },
  { t: "li", text: "`lenis` ^1.3.23" },
  { t: "li", text: "`react` ^19.0.1" },
  { t: "li", text: "`tailwindcss` ^4.1.14" },
  { t: "li", text: "`@tailwindcss/vite` ^4.1.14" },
  { t: "hr" },
  { t: "h2", text: "Summary of common mistakes to AVOID:" },
  {
    t: "num",
    n: 1,
    text: "Do NOT add any dark overlay, tint, or semi-transparent black div on top of the video",
  },
  {
    t: "num",
    n: 2,
    text: "Do NOT set `bg-black` or any background on the main content area that sits above the video - video must be visible through content layers",
  },
  {
    t: "num",
    n: 3,
    text: "Do NOT seek video frames without the `if (!video.seeking)` guard - this causes black frames and stuttering",
  },
  {
    t: "num",
    n: 4,
    text: "Make sure z-index ordering is: video(z-1) < content(z-10) < blur(z-30) < header(z-50)",
  },
];
