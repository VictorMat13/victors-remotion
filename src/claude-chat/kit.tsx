/**
 * Claude-Chat kit — Paper Liam × the real Claude macOS app.
 *
 * Built on REAL captures of Victor's Claude desktop app, taken 2026-08-16 via
 * `screencapture -l <windowid>` at 2× (source PNGs are 1614×1450 for an
 * 807×725pt window). Every token and every rectangle below was measured out of
 * those captures — nothing here is guessed, so composited UI sits seamlessly on
 * top of the screenshot underneath.
 *
 * The capture set walks the exact beat order the graphic needs:
 *   01-home-sidebar  sidebar open, "Afternoon, Victor", empty composer
 *   02-attached      clipped.mp4 chip in the composer, coral send, placeholder
 *   03-listening     mic pressed — "Listening…", waveform starting, ✕ / ✓
 *   04-dictating     live italic transcript + full waveform
 *   05-transcript    transcript committed to solid text, coral send armed
 *   06-sent          posted — attachment card + prompt bubble in the thread
 */
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import { C } from "../openseo/kit";

/** Claude's greeting is set in Copernicus, its custom display serif. Newsreader
 *  is the closest transitional serif available here — same moderate contrast
 *  and classical proportions, so a re-lettered greeting sits convincingly. */
export const SERIF = loadSerif().fontFamily;

export * from "../openseo/kit";
export { FONT as DISPLAY } from "../openseo/kit";

// ---------------------------------------------------------------------------
// Tokens — pixel-sampled from the 2026-08-16 captures. Never guess these.
// ---------------------------------------------------------------------------

export const CL = {
  /** App/window background. NOTE: luminance 0.082 — below ffmpeg blackdetect's
   *  0.10 pix_th, so a framing filled edge-to-edge with ONLY this colour would
   *  register as a black frame. Keep composer/paper in shot at tight zooms. */
  bg: "#151515",
  /** Composer surface + the attachment chip fill (same value). */
  composer: "#20201F",
  chipLine: "rgba(255,255,255,0.13)",
  line: "rgba(255,255,255,0.09)",
  /** Committed composer text. */
  text: "#F0EFEC",
  /** Live dictation transcript + placeholder (italic, dimmer). */
  muted: "#898782",
  /** Audio-visualiser bars. */
  wave: "#C3C2B8",
  /** Send button fill (Claude coral). */
  coral: "#B96748",
  coralLift: "#C7856C",
  /** Dictation accept button. */
  blue: "#4177D0",
  /** Dictation cancel button. */
  dark: "#0B0B0B",
} as const;

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export const CC = {
  shots: {
    home: "claude-chat/shots/01-home-sidebar.png",
    attached: "claude-chat/shots/02-attached.png",
    listening: "claude-chat/shots/03-listening.png",
    dictating: "claude-chat/shots/04-dictating.png",
    transcript: "claude-chat/shots/05-transcript.png",
    sent: "claude-chat/shots/06-sent.png",
  },
  /** Claude's asterisk mark, cut straight out of the capture so the greeting
   *  lockup can be re-centred around a different name without redrawing it. */
  asterisk: "claude-chat/shots/claude-asterisk.png",
  /** Native size of every capture, in points (source PNGs are 2× this). */
  win: { w: 807, h: 725 },
} as const;

// ---------------------------------------------------------------------------
// Measured geometry — all in CAPTURE POINTS (the 807×725 space), so a single
// scale factor maps them into world coordinates.
// ---------------------------------------------------------------------------

/** Composer panel within the window. */
export const COMPOSER = { x: 67.5, y: 357.5, w: 672, h: 264, r: 16 } as const;

/** Everything below is COMPOSER-LOCAL (origin = composer top-left). */
export const CMP = {
  /** clipped.mp4 attachment chip. */
  chip: { x: 15, y: 15, w: 120, h: 119, r: 9 },
  /** Text line — placeholder / "Listening…" / transcript share this origin. */
  textX: 20,
  textTop: 152,
  textW: 632,
  fontSize: 17.5,
  lineHeight: 1.5,
  /** Bottom control row centre line. */
  rowY: 232.75,
  /** Waveform: right-anchored, grows leftward as the recording accumulates. */
  waveRight: 561.5,
  waveLeftLimit: 133.5,
  /** Send / accept button slot (coral send and blue ✓ occupy the same box). */
  send: { x: 625.5, y: 217.5, s: 31, r: 8 },
  /** Dictation cancel (✕) sits one slot to the left. */
  cancel: { x: 585, y: 217.5, s: 31, r: 8 },
} as const;

/** Waveform bar metrics, measured off 04-dictating (÷2 from source pixels). */
export const WAVE = {
  barW: 2,
  pitch: 7,
  /** Full height of the tallest bar, in points. */
  maxH: 20,
  /** Silence renders as a 2pt dot rather than a bar. */
  minH: 2,
  count: 62,
} as const;

/**
 * Real amplitude envelope lifted from the dictation capture — these are the
 * actual bar heights of Victor's voice, normalised 0→1. Replaying them keeps
 * the visualiser honest instead of inventing a sine wave.
 */
export const WAVE_DATA: number[] = [
  4, 4, 4, 4, 4, 4, 8, 28, 40, 32, 30, 40, 16, 40, 26, 40, 28, 32, 40, 40, 38,
  8, 40, 40, 24, 28, 40, 38, 40, 40, 40, 40, 36, 8, 32, 4, 22, 40, 36, 30, 20,
  16, 4, 32, 28, 4, 4, 20, 32, 10, 6, 26, 38, 40, 40, 26, 4, 9, 28, 4, 14, 8,
].map((h) => h / 40);

/** Prompt bubble in the posted state (06-sent), in capture points. */
export const SENT = {
  bubble: { x: 214, y: 216, w: 549, h: 44, r: 22 },
  card: { x: 641, y: 84, w: 120, h: 119, r: 9 },
} as const;

/**
 * Greeting lockup ("✳ Afternoon, <name>"), in capture points. The mark and the
 * name are centred together on the chat column, so a shorter name has to move
 * the mark too — hence the column box rather than fixed positions.
 */
export const GREET = {
  colX: COMPOSER.x,
  colW: COMPOSER.w,
  y: 291,
  h: 44,
  markSize: 39,
  gap: 8,
  fontSize: 37,
  /** Band to clear before re-lettering: the mark and text of the capture. */
  clear: { x: 232, y: 286, w: 344, h: 52 },
} as const;

/** Attachment filename label, offset from its chip/card origin. Identical in
 *  the composer chip and in the posted thread's card. */
export const LABEL = { dx: 11, dy: 13, fontSize: 14.5, w: 96, h: 20 } as const;

// ---------------------------------------------------------------------------
// Real strings. The typed/dictated prompt is chat INPUT — the graphic is
// literally about it — so it is allowed on screen. Nothing here restates VO.
// ---------------------------------------------------------------------------

export const SAY = {
  /** Victor's corrected line. The live capture mis-transcribed "Vox" as "box". */
  prompt:
    "Take this video and turn it into a finished Reel with a Vox-style background.",
  placeholder: "How can I help you today?",
  listening: "Listening…",
  /** The capture was taken on Victor's machine with his own clip; this graphic
   *  is Koen's, so both the greeting name and the filename get re-lettered. */
  name: "Koen",
  greeting: "Afternoon,",
  file: "video.mp4",
  fileKind: "MP4",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Short triangular pulse — press dips, ripples. */
export const useTri = (at: number, up: number, down: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], CLAMP);
};

/** Reveal a string word-by-word so the transcript lands like dictation. */
export const dictated = (text: string, t: number) => {
  const words = text.split(" ");
  const n = Math.round(t * words.length);
  return words.slice(0, Math.max(0, Math.min(n, words.length))).join(" ");
};

export const INK = C.ink;
