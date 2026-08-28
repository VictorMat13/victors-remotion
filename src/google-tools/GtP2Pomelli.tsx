import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  BRAND,
  C,
  Card,
  EASE,
  FACTS,
  FONT,
  GT,
  MONO,
  PaperWorld,
  PomelliChip,
  SPRINGS,
  tabular,
  useCam,
  useEnter,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 290;

// ---------------------------------------------------------------------------
// World geometry — one continuous vertical world (1080×1920 viewport).
//
//   Pomelli chip lockup                       y   272… 388
//   URL input card (victorstudio.com types)   y   470… 590
//   Business-DNA card (dark olive, cream)     y   680…1228
//   campaign post moodboard (real heroes)     y  1450…2440
//
// Camera: hold on chip+URL while the link types and enter lands → travel to
// the olive DNA card while swatches/specimen/pills assemble → travel to the
// moodboard (DNA card fully out of frame during that hold) while the three
// posts drop with swatch strips → pull back to the whole flow and hold.
// Every hold carries a slow micro-drift so the frame never freezes.
// ---------------------------------------------------------------------------

const CHIP = { y: 272, h: 116 };
const URLC = { x: 150, y: 470, w: 780, h: 120 };
const DNA = { x: 110, y: 680, w: 860, h: 548, r: 28, pad: 44 };
const STRIP_H = 46;
// Two-column moodboard — rotated bounding boxes verified non-overlapping,
// all inside x 54…1026 (5% margins).
const P1 = { x: 100, y: 1450, w: 430, h: 470, rot: -2.5 };
const P2 = { x: 570, y: 1650, w: 430, h: 610, rot: 2 };
const P3 = { x: 100, y: 1970, w: 430, h: 470, rot: -1.8 };

// Inside the DNA card (all relative to card origin, content width 772).
const CELL = (DNA.w - DNA.pad * 2) / 3; // 257.33
const SW_D = 96;
const HEX_TOP = DNA.pad + SW_D + 12; // 152
const SPEC_TOP = 200; // "Aa" serif specimen
const LABEL_TOP = 308; // "Ivypresto Headline" stacked BELOW the Aa
const PILL_ROWS_TOP = [372, 446];
const PILL_H = 58;

const OLIVE = BRAND.pomelli.bg;
const CREAM = BRAND.pomelli.cream;
const SAGE = BRAND.pomelli.sage;
/** Pomelli's real CTA pill color — "Let's get started" on labs.google.com/pomelli. */
const CTA_SAGE = "#C9DD8F";
const OLIVE_LINE = "rgba(24,29,0,0.32)";
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  chip: -8, // pre-rolls so frame 0 is already mid-drop
  url: 6,
  type: 18, // 16 chars @ 1.1 c/f → done ~33
  press: 38,
  line1: 44,
  packet1: 48,
  dna: 54, // pops during the 46→64 travel
  sw: [66, 72, 78],
  spec: 92,
  pills: [104, 110, 116, 122],
  line2: 128, // stem tip reaches P1's top exactly as the card pops
  packet2: 134,
  posts: [146, 158, 170],
  strips: [166, 180, 194], // 3 segments × 6f stagger inside each
} as const;

const SITE_URL = "victorstudio.com";

// ---------------------------------------------------------------------------
// URL input card — link glyph, blinking caret, typed URL, sage submit press.
// All accents are Pomelli sage/olive (no blue anywhere in this comp).
// ---------------------------------------------------------------------------

const UrlCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(T.url, SPRINGS.pop);
  const typed = useTypewriter(SITE_URL, T.type, 1.1);
  const typeEnd = T.type + SITE_URL.length / 1.1; // ≈ 32.5
  const typing = frame >= T.type && frame <= typeEnd + 1;
  // Blinks on the empty field from frame 0, holds solid while typing.
  const caretOn = frame < T.press + 2 && (typing || frame % 22 < 13);

  const btnScale = interpolate(
    frame,
    [T.press, T.press + 3, T.press + 9],
    [1, 0.86, 1],
    { ...CLAMP, easing: EASE },
  );
  const rippleT = interpolate(frame, [T.press + 2, T.press + 16], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const flash = interpolate(
    frame,
    [T.press, T.press + 4, T.press + 20],
    [0, 1, 0],
    CLAMP,
  );

  const btnD = 76;
  const btnCx = URLC.w - 22 - btnD / 2;

  return (
    <Card x={URLC.x} y={URLC.y} w={URLC.w} h={URLC.h} enter={enter}>
      {/* link glyph */}
      <svg
        width={34}
        height={34}
        viewBox="0 0 24 24"
        style={{ position: "absolute", left: 32, top: (URLC.h - 34) / 2 }}
      >
        <path
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          fill="none"
          stroke={C.mutedSoft}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* typed URL + caret */}
      <div
        style={{
          position: "absolute",
          left: 88,
          top: 0,
          height: URLC.h,
          display: "flex",
          alignItems: "center",
          fontFamily: MONO,
          fontSize: 36,
          color: C.ink,
          letterSpacing: -0.2,
        }}
      >
        {typed}
        <span
          style={{
            display: "inline-block",
            width: 3.5,
            height: 42,
            marginLeft: 5,
            background: OLIVE,
            opacity: caretOn ? 0.85 : 0,
          }}
        />
      </div>

      {/* submit button (arrow) — Pomelli sage pill color, olive icon */}
      <div
        style={{
          position: "absolute",
          left: btnCx - btnD / 2,
          top: (URLC.h - btnD) / 2,
          width: btnD,
          height: btnD,
          borderRadius: 999,
          background: CTA_SAGE,
          display: "grid",
          placeItems: "center",
          transform: `scale(${btnScale})`,
        }}
      >
        <svg width={34} height={34} viewBox="0 0 24 24">
          <path
            d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"
            fill="none"
            stroke={OLIVE}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* press ripple */}
      {rippleT > 0 && rippleT < 1 ? (
        <div
          style={{
            position: "absolute",
            left: btnCx - (btnD / 2 + rippleT * 34),
            top: URLC.h / 2 - (btnD / 2 + rippleT * 34),
            width: btnD + rippleT * 68,
            height: btnD + rippleT * 68,
            borderRadius: 999,
            border: `3px solid ${CTA_SAGE}`,
            opacity: (1 - rippleT) * 0.7,
          }}
        />
      ) : null}

      {/* field flash on submit */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          border: `2.5px solid ${CTA_SAGE}`,
          opacity: flash * 0.95,
          pointerEvents: "none",
        }}
      />
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Business-DNA card — Pomelli's real dark-olive surface, cream text.
// Palette hexes, "Aa" over "Ivypresto Headline", tone pills — all real
// strings from labs.google.com/pomelli (see reference/pomelli-page.png).
// ---------------------------------------------------------------------------

// Their four real tone pills. FACTS lists the first three; "Fashion-forward"
// is verified on the same page capture (reference/pomelli-page.png).
const TONE_ROWS: string[][] = [
  [FACTS.pomelli.toneChips[0], FACTS.pomelli.toneChips[1]],
  [FACTS.pomelli.toneChips[2], "Fashion-forward"],
];

const DnaCard: React.FC = () => {
  const enter = useEnter(T.dna, SPRINGS.pop);
  const swIn = [
    useEnter(T.sw[0], SPRINGS.pop),
    useEnter(T.sw[1], SPRINGS.pop),
    useEnter(T.sw[2], SPRINGS.pop),
  ];
  const specIn = useEnter(T.spec, SPRINGS.pop);
  const pillIn = [
    useEnter(T.pills[0], SPRINGS.pop),
    useEnter(T.pills[1], SPRINGS.pop),
    useEnter(T.pills[2], SPRINGS.pop),
    useEnter(T.pills[3], SPRINGS.pop),
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: DNA.x,
        top: DNA.y,
        width: DNA.w,
        height: DNA.h,
        borderRadius: DNA.r,
        background: OLIVE,
        boxShadow: "0 24px 50px rgba(25,23,20,0.20)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26}px)`,
      }}
    >
      {/* palette — swatch circles left-aligned with the Aa and tone pills,
          revealed by pure scale at FULL opacity (never a translucent fade
          that would pass through a muddy mix with the olive) */}
      {FACTS.pomelli.swatches.map((hex, i) => {
        const e = swIn[i];
        return (
          <React.Fragment key={hex}>
            <div
              style={{
                position: "absolute",
                left: DNA.pad + i * CELL,
                top: DNA.pad,
                width: SW_D,
                height: SW_D,
                borderRadius: 999,
                background: hex,
                border: "1.5px solid rgba(242,239,223,0.16)",
                transform: `scale(${Math.max(e, 0.0001)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: DNA.pad + i * CELL,
                top: HEX_TOP,
                width: CELL,
                textAlign: "left",
                fontFamily: MONO,
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(242,239,223,0.85)",
                letterSpacing: 0.4,
                opacity: Math.min(1, e * 1.5),
                transform: `translateY(${(1 - e) * 10}px)`,
                ...tabular,
              }}
            >
              {hex}
            </div>
          </React.Fragment>
        );
      })}

      {/* font specimen — "Aa" with "Ivypresto Headline" stacked below it,
          matching the real card */}
      <div
        style={{
          position: "absolute",
          left: DNA.pad,
          top: SPEC_TOP,
          opacity: specIn,
          transform: `translateY(${(1 - specIn) * 18}px)`,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 100,
            lineHeight: "96px",
            color: SAGE,
            letterSpacing: -2,
          }}
        >
          Aa
        </div>
        <div
          style={{
            marginTop: LABEL_TOP - SPEC_TOP - 96,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 500,
            color: "rgba(242,239,223,0.8)",
            letterSpacing: 0.2,
          }}
        >
          {FACTS.pomelli.fontSpecimen}
        </div>
      </div>

      {/* tone pills — thin-outlined capsules, regular weight, two rows like
          the real page (incl. its 4th pill "Fashion-forward") */}
      {TONE_ROWS.map((row, r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            left: DNA.pad,
            top: PILL_ROWS_TOP[r],
            display: "flex",
            gap: 16,
          }}
        >
          {row.map((tone, i) => {
            const e = pillIn[r * 2 + i];
            return (
              <div
                key={tone}
                style={{
                  height: PILL_H,
                  borderRadius: 999,
                  border: "1.5px solid rgba(242,239,223,0.5)",
                  color: CREAM,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 26px",
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: 0.2,
                  opacity: Math.min(1, e * 1.4),
                  transform: `scale(${0.82 + 0.18 * e})`,
                }}
              >
                {tone}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Campaign post cards — real Pomelli hero imagery. Two treatments, both with
// even white borders and a flush swatch strip:
//   sticker — the collage element (opaque circle/blob) sits WHOLE inside the
//             card with even padding; its alpha silhouette is the design.
//   framed  — a rounded-rect photo cropped from verified fully-opaque bounds
//             (used for the lipstick blob, which is cut at its source edge).
// ---------------------------------------------------------------------------

type Crop = {
  src: string;
  natW: number;
  cx: number;
  cy: number;
  scale: number;
};

const FRAME_INSET = 22;

const PostCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  at: number;
  stripAt: number;
  crop: Crop;
  framed?: boolean;
}> = ({ x, y, w, h, rot, at, stripAt, crop, framed = false }) => {
  const frame = useCurrentFrame();
  const e = useEnter(at, SPRINGS.pop);
  const photoH = h - STRIP_H;
  const zone = framed
    ? { x: FRAME_INSET, y: FRAME_INSET, w: w - FRAME_INSET * 2, h: photoH - FRAME_INSET * 2, r: 14 }
    : { x: 0, y: 0, w, h: photoH, r: 0 };

  return (
    <Card
      x={x}
      y={y}
      w={w}
      h={h}
      r={24}
      enter={e}
      style={{
        overflow: "hidden",
        transform: `translateY(${(1 - e) * 44}px) rotate(${
          rot + (1 - e) * 3.5
        }deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: zone.x,
          top: zone.y,
          width: zone.w,
          height: zone.h,
          borderRadius: zone.r,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(crop.src)}
          style={{
            position: "absolute",
            left: zone.w / 2 - crop.cx * crop.scale,
            top: zone.h / 2 - crop.cy * crop.scale,
            width: crop.natW * crop.scale,
            display: "block",
          }}
        />
      </div>
      {/* DNA swatch strip — same three brand colors in equal thirds, pinned
          flush to the card bottom (card overflow clips it to the radius) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: photoH,
          width: w,
          height: STRIP_H,
          display: "flex",
        }}
      >
        {FACTS.pomelli.swatches.map((hex, i) => {
          const t = interpolate(
            frame,
            [stripAt + i * 6, stripAt + i * 6 + 10],
            [0, 1],
            { ...CLAMP, easing: EASE },
          );
          return (
            <div
              key={hex}
              style={{
                flex: 1,
                background: hex,
                transform: `scaleX(${t})`,
                transformOrigin: "left center",
              }}
            />
          );
        })}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Flow connectors — olive stems + travelling sage packets (URL → DNA → posts)
// ---------------------------------------------------------------------------

const Stem: React.FC<{
  x: number;
  y1: number;
  y2: number;
  at: number;
  drawDur?: number;
  packetAt: number;
  packetDur: number;
}> = ({ x, y1, y2, at, drawDur = 12, packetAt, packetDur }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [at, at + drawDur], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const pT = interpolate(frame, [packetAt, packetAt + packetDur], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const pOpacity =
    interpolate(pT, [0, 0.15], [0, 1], CLAMP) *
    interpolate(pT, [0.82, 1], [1, 0], CLAMP);

  return (
    <>
      {draw > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - 1.5,
            top: y1,
            width: 3,
            height: (y2 - y1) * draw,
            background: OLIVE_LINE,
            borderRadius: 2,
          }}
        />
      ) : null}
      {pOpacity > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: x - 8,
            top: y1 + (y2 - y1) * pT - 8,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: CTA_SAGE,
            border: `2.5px solid ${OLIVE}`,
            opacity: pOpacity,
          }}
        />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const GtP2Pomelli: React.FC = () => {
  // Hold on chip + URL while the link types and enter lands → 18f travel to
  // the DNA card as it assembles → 22f travel to the moodboard (the DNA card
  // leaves the frame entirely for that hold) → pull back to the whole flow;
  // last two keys near-identical. Every hold drifts a few px so the camera
  // never fully freezes.
  const cam = useCam({
    keys: [0, 46, 64, 138, 160, 225, 248, 266, 290],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [756, 764, 910, 920, 2102, 2108, 1392, 1388.5, 1388],
    z: [1.225, 1.215, 1.125, 1.115, 1.145, 1.135, 0.683, 0.6805, 0.68],
  });

  const chipIn = useEnter(T.chip, SPRINGS.pop);

  return (
    <PaperWorld cam={cam}>
      {/* connectors live under the cards; the second stem lands on the first
          post card (its tip tucks under the card as it pops) */}
      <Stem
        x={540}
        y1={URLC.y + URLC.h - 4}
        y2={DNA.y + 6}
        at={T.line1}
        packetAt={T.packet1}
        packetDur={9}
      />
      <Stem
        x={P1.x + P1.w / 2}
        y1={DNA.y + DNA.h - 4}
        y2={P1.y + 16}
        at={T.line2}
        drawDur={18}
        packetAt={T.packet2}
        packetDur={12}
      />

      {/* Pomelli lockup — full cream serif wordmark on its own olive tile */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: CHIP.y,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          opacity: chipIn,
          transform: `translateY(${(1 - chipIn) * -28}px)`,
        }}
      >
        <PomelliChip height={CHIP.h} />
      </div>

      <UrlCard />
      <DnaCard />

      {/* moodboard — real Pomelli campaign heroes.
          Opaque bounds measured from the PNG alpha (2026-08-10):
          Banza circle   hero-top    288×288  @ (178.5, 636.5)
          lipstick blob  hero-right  cut at source edge → framed crop from
                         its largest fully-opaque rect (1207…1578, 1249…1749)
          skincare blob  hero-left   350×335  @ (384.5, 1791) */}
      <PostCard
        {...P1}
        at={T.posts[0]}
        stripAt={T.strips[0]}
        crop={{
          src: GT.shots.pomelliHeroTop,
          natW: 1100,
          cx: 178.5,
          cy: 636.5,
          scale: 1.236,
        }}
      />
      <PostCard
        {...P2}
        at={T.posts[1]}
        stripAt={T.strips[1]}
        framed
        crop={{
          src: GT.shots.pomelliHeroRight,
          natW: 1578,
          cx: 1392,
          cy: 1499,
          scale: 1.05,
        }}
      />
      <PostCard
        {...P3}
        at={T.posts[2]}
        stripAt={T.strips[2]}
        crop={{
          src: GT.shots.pomelliHeroLeft,
          natW: 1675,
          cx: 384.5,
          cy: 1791,
          scale: 1.023,
        }}
      />
    </PaperWorld>
  );
};
