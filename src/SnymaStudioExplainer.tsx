import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

// Snyma Studio explainer — 30s, 16:9, dark style.
// One wide world, six stations: intro → setup → idea → AI script → breakdown → outro.
export const DURATION_IN_FRAMES = 900;

// Background sits just above the black-frame detector's luma floor (>25.5 YAVG)
const COLORS = {
  bg: "#1a1926",
  text: "#F5F4FA",
  muted: "#9A94AC",
  violet: "#8B7CF0",
  violetDeep: "#6D5BD8",
  violetChipBg: "rgba(139,124,240,0.13)",
  violetChipEdge: "rgba(139,124,240,0.38)",
  chipText: "#C9C2F5",
  cardEdge: "rgba(255,255,255,0.10)",
  cardBg: "#0a0a10",
};

const IMG_W = 1974;
const IMG_H = 1724;

// Station centers along the world x axis (world fy = 540)
const SX = [960, 2960, 4960, 6960, 9060, 11160];

// Arrival frames per station (camera lands here)
const ARRIVE = [0, 112, 254, 400, 582, 768];

const ease = Easing.inOut(Easing.cubic);
const KEY_T = [0, 90, 112, 232, 254, 378, 400, 560, 582, 742, 768, 886, 899];
const KEY_FX = [
  SX[0],
  SX[0],
  SX[1],
  SX[1],
  SX[2],
  SX[2],
  SX[3],
  SX[3],
  SX[4],
  SX[4],
  SX[5],
  SX[5],
  SX[5],
];
const KEY_Z = [1, 1, 1, 1, 1.06, 1.06, 1, 1, 0.94, 0.94, 1, 1, 1];

// Real Snyma S-mark (from snyma.com)
const S_PATH =
  "M483.87,88.3c-2.1-11.36-10.45-21.54-22.47-24.99L257.56,4.88c-34.34-9.85-71.26-4.57-100.92,13.93l-87.13,54.34c-25.27,15.76-38.44,43.82-38.12,72.74.32,28.59,15.38,55.29,40.19,70.87,9.44,5.92,18.64,9.86,29.69,13.02l233.38,66.66c.95.27,2.67,2.59,2.79,3.53.09.71-1.01,2.86-1.73,3.31l-64.28,39.64c-7.58,4.67-17.47,1.15-25.28-1.09l-157.53-45.32c-12.5-3.6-24.62-1.71-35.26,5.01l-39.21,24.76c-10.5,6.63-16.21,17.8-13.47,30.16,3.44,15.57,15,24.95,30,29.23l197.68,56.34c33.48,9.54,70.86,9.58,101.15-9.22l93.47-57.98c35.85-22.24,51.24-67.41,34.68-106.43-10.32-24.32-31.77-41.45-57.43-48.78l-244.09-69.68c-2.75-.78.09-5.98,1.63-6.94l61.08-37.92c4.68-2.91,12.27-4.5,18.08-2.83l158.16,45.55c10.7,3.08,22.38,1.67,31.55-4.01l44.14-27.34c9.73-6.02,15.28-16.23,13.08-28.1ZM383.47,232.39c4.14.81,5.34,6.15,1.95,8.66l-24.43,18.1c-1.1.81-2.49,1.13-3.83.86l-256.3-50.41c-4.12-.81-5.34-6.13-1.97-8.65l24.15-18.09c1.1-.82,2.5-1.14,3.85-.88l256.58,50.4Z";

const SMark: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 484.35 448.28" style={{ width: size, display: "block" }}>
    <path d={S_PATH} fill={color} />
  </svg>
);

// -------------------------------------------------------------------------
// Reusable pieces
// -------------------------------------------------------------------------
const useRise = (frame: number, fps: number, t0: number) => {
  const s = spring({
    frame: frame - t0,
    fps,
    config: { damping: 22, stiffness: 120 },
  });
  return {
    transform: `translateY(${34 * (1 - s)}px)`,
    opacity: interpolate(frame, [t0, t0 + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};

const Headline: React.FC<{
  words: string;
  frame: number;
  t0: number;
  size?: number;
}> = ({ words, frame, t0, size = 64 }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0 18px" }}>
    {words.split(" ").map((w, i) => {
      const wt = t0 + i * 4;
      const o = interpolate(frame, [wt, wt + 9], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const y = interpolate(frame, [wt, wt + 12], [26, 0], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <span
          key={i}
          style={{
            fontSize: size,
            fontWeight: 700,
            color: COLORS.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.16,
            opacity: o,
            transform: `translateY(${y}px)`,
            display: "inline-block",
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

const Chip: React.FC<{
  label: string;
  frame: number;
  fps: number;
  t0: number;
}> = ({ label, frame, fps, t0 }) => {
  const s = spring({
    frame: frame - t0,
    fps,
    config: { damping: 16, stiffness: 170 },
  });
  return (
    <div
      style={{
        padding: "12px 22px",
        borderRadius: 999,
        background: COLORS.violetChipBg,
        border: `1.5px solid ${COLORS.violetChipEdge}`,
        color: COLORS.chipText,
        fontSize: 25,
        fontWeight: 600,
        whiteSpace: "nowrap",
        transform: `scale(${0.7 + 0.3 * s})`,
        opacity: interpolate(frame, [t0, t0 + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {label}
    </div>
  );
};

const StepNo: React.FC<{ n: string; frame: number; t0: number }> = ({
  n,
  frame,
  t0,
}) => (
  <div
    style={{
      fontSize: 120,
      fontWeight: 800,
      color: COLORS.violet,
      opacity:
        0.34 *
        interpolate(frame, [t0, t0 + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      lineHeight: 1,
      letterSpacing: "-0.02em",
    }}
  >
    {n}
  </div>
);

type Crop = { src: string; sx: number; sy: number; sw: number; sh: number };

const ShotCard: React.FC<{
  crop: Crop;
  x: number;
  y: number;
  w: number;
  frame: number;
  fps: number;
  t0: number;
  scrollShift?: number;
  glow?: boolean;
}> = ({ crop, x, y, w, frame, fps, t0, scrollShift = 0, glow = false }) => {
  const scale = w / crop.sw;
  const h = crop.sh * scale;
  const s = spring({
    frame: frame - t0,
    fps,
    config: { damping: 24, stiffness: 120 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardEdge}`,
        boxShadow: glow
          ? "0 34px 90px rgba(0,0,0,0.55), 0 0 90px rgba(109,91,216,0.22)"
          : "0 34px 90px rgba(0,0,0,0.55), 0 0 60px rgba(109,91,216,0.10)",
        transform: `translateY(${52 * (1 - s)}px) scale(${0.96 + 0.04 * s})`,
        opacity: interpolate(frame, [t0, t0 + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <Img
        src={staticFile(crop.src)}
        style={{
          position: "absolute",
          width: IMG_W * scale,
          height: IMG_H * scale,
          left: -crop.sx * scale,
          top: -(crop.sy + scrollShift) * scale,
        }}
      />
    </div>
  );
};

// -------------------------------------------------------------------------
// Crops (all source images are 1974x1724)
// -------------------------------------------------------------------------
const CROPS: Record<string, Crop> = {
  setup: {
    src: "snyma/snyma-03-studio-form-top.png",
    sx: 540,
    sy: 155,
    sw: 1360,
    sh: 1055,
  },
  idea: {
    src: "snyma/snyma-04-your-idea-filled.png",
    sx: 545,
    sy: 110,
    sw: 1355,
    sh: 980,
  },
  gen: {
    src: "snyma/snyma-07-ai-generating.png",
    sx: 610,
    sy: 745,
    sw: 1270,
    sh: 430,
  },
  script: {
    src: "snyma/snyma-10-script-blocks.png",
    sx: 700,
    sy: 250,
    sw: 1090,
    sh: 900,
  },
  scenes: {
    src: "snyma/snyma-13-scenes.png",
    sx: 590,
    sy: 505,
    sw: 1320,
    sh: 760,
  },
  shots: {
    src: "snyma/snyma-14-shots.png",
    sx: 590,
    sy: 165,
    sw: 1320,
    sh: 950,
  },
};

const PIPELINE = [
  "Script",
  "Scenes",
  "Shots",
  "Storyboard",
  "Timeline",
  "Export",
];

// =========================================================================
// Main
// =========================================================================
export const SnymaStudioExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = 540;

  // Idea text sweep during station 3 hold
  const sweepT0 = ARRIVE[2] + 18;
  const sweepY = interpolate(frame, [sweepT0, sweepT0 + 30], [0.36, 0.82], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOpacity = interpolate(
    frame,
    [sweepT0, sweepT0 + 6, sweepT0 + 26, sweepT0 + 34],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Script page scroll during station 4 hold
  const scriptShift = interpolate(frame, [440, 545], [0, 430], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow-breathing background glows
  const breathe = 0.85 + 0.15 * Math.sin((frame / fps) * 1.1);

  const s1 = useRise(frame, fps, 6);
  const s1b = useRise(frame, fps, 16);
  const s1c = useRise(frame, fps, 26);
  const s6 = useRise(frame, fps, ARRIVE[5] - 8);
  const s6url = useRise(frame, fps, ARRIVE[5] + 40);

  const ideaCardX = SX[2] - 260;
  const ideaCardW = 940;
  const ideaCardScale = ideaCardW / CROPS.idea.sw;
  const ideaCardH = CROPS.idea.sh * ideaCardScale;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* World base: faint dot grid so no frame is ever near-black */}
        <div
          style={{
            position: "absolute",
            left: -1200,
            top: -900,
            width: 14400,
            height: 2900,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.07) 1.4px, transparent 1.4px)",
            backgroundSize: "58px 58px",
          }}
        />
        {/* Soft violet glows anchored near key stations */}
        {[SX[0], SX[2], SX[3], SX[5]].map((gx, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gx - 900,
              top: -260,
              width: 1800,
              height: 1600,
              background:
                "radial-gradient(circle, rgba(109,91,216,0.17) 0%, rgba(109,91,216,0) 62%)",
              opacity: breathe,
            }}
          />
        ))}

        {/* ---------------- S1 · Intro ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[0] - 700,
            top: 260,
            width: 1400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 30,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 40, ...s1 }}
          >
            <SMark size={150} color={COLORS.text} />
            <div
              style={{
                fontSize: 150,
                fontWeight: 800,
                letterSpacing: "0.13em",
                color: COLORS.text,
              }}
            >
              SNYMA
            </div>
          </div>
          <div
            style={{
              padding: "12px 34px",
              borderRadius: 999,
              background: COLORS.violetChipBg,
              border: `1.5px solid ${COLORS.violetChipEdge}`,
              color: COLORS.chipText,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.22em",
              ...s1b,
            }}
          >
            STUDIO
          </div>
          <div style={{ fontSize: 36, color: COLORS.muted, ...s1c }}>
            From script to production-ready plan.
          </div>
        </div>

        {/* ---------------- S2 · Set up the project ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[1] - 860,
            top: 300,
            width: 540,
          }}
        >
          <StepNo n="01" frame={frame} t0={ARRIVE[1] - 14} />
          <div style={{ marginTop: 16 }}>
            <Headline
              words="Set up the project"
              frame={frame}
              t0={ARRIVE[1] - 22}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 36,
              width: 500,
            }}
          >
            {["AI Production", "Music Video", "Solo", "2–3 min", "16:9"].map(
              (c, i) => (
                <Chip
                  key={c}
                  label={c}
                  frame={frame}
                  fps={fps}
                  t0={ARRIVE[1] + 22 + i * 5}
                />
              ),
            )}
          </div>
        </div>
        <ShotCard
          crop={CROPS.setup}
          x={SX[1] - 260}
          y={160}
          w={940}
          frame={frame}
          fps={fps}
          t0={ARRIVE[1] - 22}
        />

        {/* ---------------- S3 · Describe the idea ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[2] - 830,
            top: 320,
            width: 520,
          }}
        >
          <StepNo n="02" frame={frame} t0={ARRIVE[2] - 14} />
          <div style={{ marginTop: 16 }}>
            <Headline
              words="Describe the idea"
              frame={frame}
              t0={ARRIVE[2] - 22}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 36,
            }}
          >
            {["Literal", "Normal", "Creative"].map((c, i) => (
              <Chip
                key={c}
                label={c}
                frame={frame}
                fps={fps}
                t0={ARRIVE[2] + 22 + i * 5}
              />
            ))}
          </div>
        </div>
        <ShotCard
          crop={CROPS.idea}
          x={ideaCardX}
          y={200}
          w={ideaCardW}
          frame={frame}
          fps={fps}
          t0={ARRIVE[2] - 22}
        />
        {/* violet sweep over the idea text */}
        <div
          style={{
            position: "absolute",
            left: ideaCardX + ideaCardW * 0.06,
            top: 200 + ideaCardH * sweepY,
            width: ideaCardW * 0.88,
            height: 56,
            borderRadius: 12,
            background:
              "linear-gradient(90deg, rgba(139,124,240,0) 0%, rgba(139,124,240,0.30) 30%, rgba(139,124,240,0.30) 70%, rgba(139,124,240,0) 100%)",
            opacity: sweepOpacity,
          }}
        />

        {/* ---------------- S4 · AI writes the script ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[3] - 860,
            top: 300,
            width: 520,
          }}
        >
          <StepNo n="03" frame={frame} t0={ARRIVE[3] - 14} />
          <div style={{ marginTop: 16 }}>
            <Headline
              words="AI writes the script"
              frame={frame}
              t0={ARRIVE[3] - 22}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 36,
              width: 480,
            }}
          >
            {["574 words", "3 pages", "20 credits"].map((c, i) => (
              <Chip
                key={c}
                label={c}
                frame={frame}
                fps={fps}
                t0={ARRIVE[3] + 26 + i * 5}
              />
            ))}
          </div>
        </div>
        <ShotCard
          crop={CROPS.script}
          x={SX[3] - 240}
          y={190}
          w={820}
          frame={frame}
          fps={fps}
          t0={ARRIVE[3] - 12}
          scrollShift={scriptShift}
        />
        <ShotCard
          crop={CROPS.gen}
          x={SX[3] - 360}
          y={110}
          w={560}
          frame={frame}
          fps={fps}
          t0={ARRIVE[3] - 22}
          glow
        />

        {/* ---------------- S5 · Broken down for production ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[4] - 900,
            top: 280,
            width: 540,
          }}
        >
          <StepNo n="04" frame={frame} t0={ARRIVE[4] - 14} />
          <div style={{ marginTop: 16 }}>
            <Headline
              words="Broken down for production"
              frame={frame}
              t0={ARRIVE[4] - 22}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 36,
              width: 520,
            }}
          >
            {["8 scenes", "39 shots", "Est. 2m 17s"].map((c, i) => (
              <Chip
                key={c}
                label={c}
                frame={frame}
                fps={fps}
                t0={ARRIVE[4] + 26 + i * 5}
              />
            ))}
          </div>
        </div>
        <ShotCard
          crop={CROPS.scenes}
          x={SX[4] - 320}
          y={120}
          w={760}
          frame={frame}
          fps={fps}
          t0={ARRIVE[4] - 22}
        />
        <ShotCard
          crop={CROPS.shots}
          x={SX[4] - 180}
          y={500}
          w={760}
          frame={frame}
          fps={fps}
          t0={ARRIVE[4] - 22}
        />

        {/* ---------------- S6 · Outro ---------------- */}
        <div
          style={{
            position: "absolute",
            left: SX[5] - 800,
            top: 300,
            width: 1600,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 44,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 34, ...s6 }}
          >
            <SMark size={110} color={COLORS.text} />
            <div
              style={{
                fontSize: 110,
                fontWeight: 800,
                letterSpacing: "0.13em",
                color: COLORS.text,
              }}
            >
              SNYMA
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "nowrap",
            }}
          >
            {PIPELINE.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && (
                  <div
                    style={{
                      color: COLORS.violet,
                      fontSize: 26,
                      fontWeight: 700,
                      opacity: interpolate(
                        frame,
                        [ARRIVE[5] + 18 + i * 5, ARRIVE[5] + 26 + i * 5],
                        [0, 0.8],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                      ),
                    }}
                  >
                    →
                  </div>
                )}
                <Chip
                  label={p}
                  frame={frame}
                  fps={fps}
                  t0={ARRIVE[5] + 16 + i * 5}
                />
              </React.Fragment>
            ))}
          </div>
          <div style={{ fontSize: 32, color: COLORS.muted, ...s6url }}>
            snyma.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
