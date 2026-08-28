import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["500", "700"],
});

// -------------------------------------------------------------------------
// Directing beat: the exact Fish Audio input line types itself out — emotion
// tags pop in as chips while the camera rides the typing — then the camera
// pulls back and the clone's wireframe mesh blob ignites and speaks the
// directed line. (The real demo audio is laid under this insert in the edit
// — the blob is procedural.)
// -------------------------------------------------------------------------

export const DURATION_IN_FRAMES = 270; // 9s @ 30fps

const COLORS = {
  paper: "#fbfbf9",
  ink: "#201515",
  muted: "#8b8079",
  card: "#ffffff",
  cardBorder: "#efefe9",
  blue: "#2563EB",
  blueLite: "#7DA9FB",
  purple: "#7C3AED",
  purpleLite: "#A78BFA",
  meshCyan: "#22D3EE",
  meshViolet: "#8B5CF6",
  meshPink: "#EC4899",
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ------------------------------ the line ---------------------------------
// Exact product input text, quirks preserved on purpose.
type TagColor = "blue" | "purple";
type Token =
  | { kind: "tag"; label: string; color: TagColor }
  | { kind: "text"; text: string };

const TOKENS: Token[] = [
  { kind: "tag", label: "[sigh]", color: "blue" },
  { kind: "tag", label: "[sassy]", color: "blue" },
  { kind: "text", text: " I set up that call with " },
  { kind: "tag", label: "[emphasis]", color: "purple" },
  { kind: "text", text: "Liam for tomorrow! " },
  { kind: "tag", label: "[sassy]", color: "blue" },
  { kind: "text", text: "ill set up a reminder so you dont forget again" },
];

// ---------------------------- typing schedule ----------------------------
const TYPE_START = 8;
const TAG_PAUSE = 12; // beat while a chip pops before typing resumes
const RUN_CHAR_DUR = [1.0, 1.0, 0.78]; // frames per char, per text run
const RUN_POST_PAUSE = [5, 9, 0]; // thinking beat after each text run

// ------------------------------- metrics ---------------------------------
const TEXT_SIZE = 34;
const CHIP_SIZE = 30;
const CHAR_W = TEXT_SIZE * 0.6; // JetBrains Mono advance = 0.6em
const CHIP_PAD_X = 14;
const CHIP_MARGIN = 5;
const chipWidth = (label: string) =>
  label.length * (CHIP_SIZE * 0.6) + CHIP_PAD_X * 2 + 2 + CHIP_MARGIN * 2;

const CARD_X = 100;
const CARD_W = 880; // inside x 100..980 (hard 5% rule: 54..1026)
const CARD_TOP = 150;
const CARD_PAD = 40;
const INNER_W = CARD_W - CARD_PAD * 2;
const LINE_H = 56;

type ChipItem = {
  kind: "chip";
  label: string;
  color: TagColor;
  frame: number;
  w: number;
};
type WordItem = { kind: "word"; text: string; frames: number[]; w: number };
type Item = ChipItem | WordItem;

const buildItems = (): { items: Item[]; tagFrames: number[] } => {
  const items: Item[] = [];
  const tagFrames: number[] = [];
  let t = TYPE_START;
  let run = 0;
  for (const tok of TOKENS) {
    if (tok.kind === "tag") {
      const f = Math.round(t);
      tagFrames.push(f);
      items.push({
        kind: "chip",
        label: tok.label,
        color: tok.color,
        frame: f,
        w: chipWidth(tok.label),
      });
      t += TAG_PAUSE;
    } else {
      const dur = RUN_CHAR_DUR[run];
      const words = tok.text.match(/[^ ]* +|[^ ]+/g) ?? [];
      for (const word of words) {
        const frames: number[] = [];
        for (let i = 0; i < word.length; i++) {
          frames.push(t);
          t += dur;
        }
        items.push({ kind: "word", text: word, frames, w: word.length * CHAR_W });
      }
      t += RUN_POST_PAUSE[run];
      run += 1;
    }
  }
  return { items, tagFrames };
};

const built = buildItems();
const TAG_FRAMES = built.tagFrames; // 8, 20, 62, 102

// Deterministic word wrap into flex rows (no browser wrapping surprises)
const wrapItems = (items: Item[]): Item[][] => {
  const lines: Item[][] = [[]];
  let x = 0;
  for (const it of items) {
    if (x > 0 && x + it.w > INNER_W - 10) {
      lines.push([]);
      x = 0;
    }
    lines[lines.length - 1].push(it);
    x += it.w;
  }
  return lines;
};
const LINES = wrapItems(built.items);

// ------------------------------- camera ----------------------------------
// One continuous camera: rides the typing (fx follows the cursor across each
// line, fy steps down on wraps, zoom ~1.45), then pulls back to 1.0 at 150.
const CAM_T = [0, 44, 54, 88, 96, 104, 128, 138, 150, 180, DURATION_IN_FRAMES];
const CAM_X = [400, 640, 420, 640, 640, 420, 620, 420, 420, 540, 540];
const CAM_Y = [258, 258, 314, 314, 314, 370, 370, 426, 426, 540, 540];
const CAM_Z = [1.47, 1.45, 1.45, 1.44, 1.44, 1.43, 1.43, 1.42, 1.42, 1.0, 1.0];

// ---------------------------- wireframe blob ------------------------------
// 3D-looking wavy wireframe sphere (pure SVG): concentric noisy rings plus
// wavy meridian arcs, one shared cyan→blue→violet→pink gradient stroke.
const ORB_X = 540;
const ORB_Y = 810;
const IGNITE = 156;
const SPEAK_START = 162;
const SPEAK_END = 250;
const HALF = 32;

const RINGS = 16;
const RING_SAMPLES = 84;
const MERIDIAN_SAMPLES = 48;
const R_MIN = 55;
const R_MAX = 185;
const MERIDIAN_LONGITUDES = [-1.25, -0.9, -0.58, -0.28, 0.28, 0.58, 0.9, 1.25];

type RingSpec = {
  baseR: number;
  yOff: number;
  wobble: number;
  opacity: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};
type MeridianSpec = {
  phi: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};

const buildMesh = (): { rings: RingSpec[]; meridians: MeridianSpec[] } => {
  const rnd = mulberry32(52814);
  const rings: RingSpec[] = Array.from({ length: RINGS }).map((_, i) => {
    const t = i / (RINGS - 1);
    return {
      baseR: R_MIN + (R_MAX - R_MIN) * t,
      yOff: 14 * t, // sphere profile: outer rings sit slightly lower
      wobble: 0.6 + 0.7 * t, // outer rings wobble harder
      opacity: 0.4 + 0.45 * t, // denser toward the rim
      a1: 0.02 + rnd() * 0.07,
      a2: 0.02 + rnd() * 0.07,
      a3: 0.02 + rnd() * 0.07,
      p1: rnd() * Math.PI * 2,
      p2: rnd() * Math.PI * 2,
      p3: rnd() * Math.PI * 2,
    };
  });
  const meridians: MeridianSpec[] = MERIDIAN_LONGITUDES.map((phi) => ({
    phi,
    a1: 0.02 + rnd() * 0.05,
    a2: 0.02 + rnd() * 0.05,
    a3: 0.02 + rnd() * 0.05,
    p1: rnd() * Math.PI * 2,
    p2: rnd() * Math.PI * 2,
    p3: rnd() * Math.PI * 2,
  }));
  return { rings, meridians };
};

export const FishSassyDirect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- camera ----
  const fx = interpolate(frame, CAM_T, CAM_X, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, CAM_T, CAM_Y, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let zoom = interpolate(frame, CAM_T, CAM_Z, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // extra punch pulse each time a tag chip pops
  for (const tf of TAG_FRAMES) {
    zoom += interpolate(frame, [tf, tf + 3, tf + 9], [0, 0.06, 0], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  const worldTransform = `translate(${540 - fx * zoom}px, ${
    540 - fy * zoom
  }px) scale(${zoom})`;

  // ---- card motion ----
  const settle = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const dimT = interpolate(frame, [150, 172], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = (0.96 + 0.04 * settle) * (1 - 0.03 * dimT);
  const cardOpacity = 1 - 0.15 * dimT;

  // ---- cursor ----
  const blink = frame % 32 < 20 ? 1 : 0;
  let cursorLine = 0;
  LINES.forEach((line, li) => {
    for (const it of line) {
      const f = it.kind === "chip" ? it.frame : it.frames[0];
      if (frame >= f) cursorLine = li;
    }
  });

  // ---- blob: procedural sine-envelope drive (same envelope timing the
  // radial-bar orb used) ----
  const mesh = useMemo(buildMesh, []);
  const speakRamp = interpolate(
    frame,
    [SPEAK_START, SPEAK_START + 6, SPEAK_END - 8, SPEAK_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const env =
    (0.4 +
      0.42 * Math.abs(Math.sin(frame * 0.34)) +
      0.18 * Math.abs(Math.sin(frame * 0.9))) *
    speakRamp;
  const barValues = Array.from({ length: HALF }).map((_, i) => {
    const v =
      0.25 +
      0.55 * Math.abs(Math.sin(i * 0.5 + frame * 0.28)) +
      0.3 * Math.abs(Math.sin(i * 1.4 - frame * 0.19));
    return Math.min(1, (v / 1.1) * env);
  });
  const amp = barValues.reduce((a, b) => a + b, 0) / HALF;

  const orbOpacity = interpolate(frame, [142, 154, IGNITE + 6], [0, 0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ig =
    frame < IGNITE
      ? 0
      : spring({
          frame: frame - IGNITE,
          fps,
          config: { damping: 11, stiffness: 150 },
        });
  const orbScale = 0.82 + 0.18 * ig;

  // envelope → mesh deformation
  const ampScale = 0.4 + 0.9 * amp; // scales the per-ring noise amplitudes
  const blobScale = orbScale * (1 + 0.08 * amp); // global pulse
  const squashY = 0.94 + 0.02 * Math.sin(frame * 0.05); // rotateX-ish squash
  const rotRad = (frame * 0.25 * Math.PI) / 180; // slow whole-blob rotation
  const blobOpacity =
    orbOpacity *
    interpolate(frame, [SPEAK_END - 4, SPEAK_END + 8], [1, 0.85], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const meshNoise = (
    s: { a1: number; a2: number; a3: number; p1: number; p2: number; p3: number },
    th: number,
  ) =>
    s.a1 * Math.sin(3 * th + s.p1 + frame * 0.03) +
    s.a2 * Math.sin(5 * th - s.p2 + frame * 0.021) +
    s.a3 * Math.sin(8 * th + s.p3 + frame * 0.045);

  const ringPath = (rg: RingSpec) => {
    let d = "";
    for (let k = 0; k < RING_SAMPLES; k++) {
      const th = (k / RING_SAMPLES) * Math.PI * 2;
      const r =
        rg.baseR * (1 + rg.wobble * ampScale * meshNoise(rg, th + rotRad));
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r + rg.yOff;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
  };

  const meridianPath = (m: MeridianSpec) => {
    const sinPhi = Math.sin(m.phi + rotRad); // longitude drifts as it spins
    let d = "";
    for (let k = 0; k <= MERIDIAN_SAMPLES; k++) {
      const u = -Math.PI / 2 + (k / MERIDIAN_SAMPLES) * Math.PI;
      const R = (R_MAX - 3) * (1 + ampScale * meshNoise(m, u));
      const x = Math.cos(u) * R * sinPhi;
      const y = Math.sin(u) * R;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* ------- paper background: glow biased toward the orb + masked grid ------- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1100px 1100px at 50% 62%, rgba(37,99,235,0.10), transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(32,21,21,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.026) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          WebkitMaskImage:
            "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
          maskImage:
            "radial-gradient(980px 1200px at 50% 44%, #000 40%, transparent 82%)",
        }}
      />

      {/* ------- camera world ------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          transform: worldTransform,
          transformOrigin: "0 0",
        }}
      >
        <svg
          viewBox="0 0 1080 1080"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1080,
            overflow: "visible",
          }}
        >
          {/* ------- the mesh blob (the clone speaking the directed line) ------- */}
          <defs>
            <linearGradient
              id="fsdMesh"
              gradientUnits="userSpaceOnUse"
              x1={-R_MAX}
              y1={-R_MAX}
              x2={R_MAX}
              y2={R_MAX}
            >
              <stop offset="0%" stopColor={COLORS.meshCyan} />
              <stop offset="34%" stopColor={COLORS.blue} />
              <stop offset="67%" stopColor={COLORS.meshViolet} />
              <stop offset="100%" stopColor={COLORS.meshPink} />
            </linearGradient>
            <radialGradient id="fsdBlobGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.10" />
              <stop offset="60%" stopColor={COLORS.meshPink} stopOpacity="0.06" />
              <stop offset="100%" stopColor={COLORS.meshPink} stopOpacity="0" />
            </radialGradient>
          </defs>

          <g
            opacity={blobOpacity}
            transform={`translate(${ORB_X} ${ORB_Y}) scale(${blobScale})`}
          >
            {/* soft glow seat so the blob sits on the page */}
            <circle cx={0} cy={0} r={210} fill="url(#fsdBlobGlow)" />

            <g transform={`scale(1 ${squashY})`} fill="none">
              {/* wavy meridian arcs — the mesh-grid feel */}
              {mesh.meridians.map((m, i) => (
                <path
                  key={`md${i}`}
                  d={meridianPath(m)}
                  stroke="url(#fsdMesh)"
                  strokeWidth={1.4}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                />
              ))}

              {/* concentric noisy rings — denser toward the rim */}
              {mesh.rings.map((rg, i) => (
                <path
                  key={`rg${i}`}
                  d={ringPath(rg)}
                  stroke="url(#fsdMesh)"
                  strokeWidth={1.4}
                  strokeOpacity={rg.opacity}
                  strokeLinejoin="round"
                />
              ))}
            </g>
          </g>
        </svg>

        {/* ------- input card (the hero) ------- */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_TOP,
            width: CARD_W,
            borderRadius: 24,
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow:
              "0 22px 54px rgba(18,24,40,0.10), 0 2px 6px rgba(18,24,40,0.05)",
            padding: `${CARD_PAD - 4}px ${CARD_PAD}px ${CARD_PAD}px`,
            transform: `scale(${cardScale})`,
            transformOrigin: "50% 30%",
            opacity: cardOpacity,
          }}
        >
          {/* product UI label */}
          <div
            style={{
              fontFamily: monoFamily,
              fontWeight: 500,
              fontSize: 20,
              color: COLORS.muted,
              letterSpacing: 1,
              height: 24,
              marginBottom: 16,
            }}
          >
            text · S2.1 Pro
          </div>

          {/* typed line — deterministic rows, chips + text on one baseline */}
          {LINES.map((line, li) => (
            <div
              key={`ln${li}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                height: LINE_H,
                paddingTop: 8,
                whiteSpace: "pre",
              }}
            >
              {line.map((it, j) => {
                if (it.kind === "chip") {
                  if (frame < it.frame) return null;
                  const pop = spring({
                    frame: frame - it.frame,
                    fps,
                    config: { damping: 12, stiffness: 210 },
                  });
                  const isBlue = it.color === "blue";
                  return (
                    <span
                      key={`c${li}-${j}`}
                      style={{
                        display: "inline-block",
                        fontFamily: monoFamily,
                        fontWeight: 500,
                        fontSize: CHIP_SIZE,
                        lineHeight: 1.1,
                        color: isBlue ? COLORS.blue : COLORS.purple,
                        background: isBlue
                          ? "rgba(37,99,235,0.08)"
                          : "rgba(124,58,237,0.08)",
                        border: `1px solid ${
                          isBlue
                            ? "rgba(37,99,235,0.30)"
                            : "rgba(124,58,237,0.30)"
                        }`,
                        borderRadius: 10,
                        padding: `4px ${CHIP_PAD_X}px`,
                        margin: `0 ${CHIP_MARGIN}px`,
                        transform: `scale(${0.7 + 0.3 * pop})`,
                        transformOrigin: "50% 80%",
                      }}
                    >
                      {it.label}
                    </span>
                  );
                }
                const n = it.frames.filter((f) => f <= frame).length;
                if (n === 0) return null;
                return (
                  <span
                    key={`w${li}-${j}`}
                    style={{
                      fontFamily: monoFamily,
                      fontWeight: 500,
                      fontSize: TEXT_SIZE,
                      color: COLORS.ink,
                    }}
                  >
                    {it.text.slice(0, n)}
                  </span>
                );
              })}
              {li === cursorLine && (
                <span
                  style={{
                    fontFamily: monoFamily,
                    fontWeight: 500,
                    fontSize: TEXT_SIZE,
                    color: COLORS.ink,
                    opacity: blink,
                    marginLeft: 2,
                  }}
                >
                  ▊
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
