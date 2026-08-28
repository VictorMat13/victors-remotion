import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, SPRINGS, TV } from "./theme";

export const DURATION_IN_FRAMES = 160;

// ---------------- world layout (1080x1080 viewport, world ~1900 wide) ----
const VIEW = 1080;
const CARD_W = 320;
const CARD_H = 568;
const CARD_R = 20;
const CARD_CY = 520;
const L_CX = 480;
const R_CX = 1420;
const CHIP_X = 950;
const CHIP_Y = 520;
const CHIP_SIZE = 150;

const L_LEFT = L_CX - CARD_W / 2; // 320
const R_LEFT = R_CX - CARD_W / 2; // 1260
const CARD_TOP = CARD_CY - CARD_H / 2; // 236

const ease = Easing.inOut(Easing.cubic);

// Skeleton regions as fractions of each card (match the footage)
const L_FACE = { l: 0.27, t: 0.14, w: 0.46, h: 0.34 };
const L_CAN = { l: 0.15, t: 0.47, w: 0.3, h: 0.28 };
const R_FACE = { l: 0.34, t: 0.16, w: 0.44, h: 0.32 };
const R_CAN = { l: 0.16, t: 0.4, w: 0.27, h: 0.27 };

type Pt = { x: number; y: number };
const cubicPt = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
};

// Structure lines: left card edge -> through the Claude node -> right card edge
const LINES: [Pt, Pt, Pt, Pt][] = [
  [
    { x: 644, y: 424 },
    { x: 820, y: 470 },
    { x: 1080, y: 500 },
    { x: 1256, y: 440 },
  ],
  [
    { x: 644, y: 520 },
    { x: 850, y: 508 },
    { x: 1060, y: 534 },
    { x: 1256, y: 526 },
  ],
  [
    { x: 644, y: 618 },
    { x: 820, y: 580 },
    { x: 1080, y: 550 },
    { x: 1256, y: 604 },
  ],
];
const lineD = ([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt]) =>
  `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

const VIOLET_SOFT = "rgba(124, 58, 237, 0.8)";
const VIOLET_FILL = "rgba(124, 58, 237, 0.05)";

const Ticks: React.FC<{
  x: number;
  y: number;
  w: number;
  startFrame: number;
  frame: number;
}> = ({ x, y, w, startFrame, frame }) => {
  const n = 13;
  const gap = w / (n - 1);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 18 }}>
      {Array.from({ length: n }).map((_, i) => {
        const o = interpolate(
          frame,
          [startFrame + i * 1.2, startFrame + 6 + i * 1.2],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const tall = i % 4 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * gap,
              top: 0,
              width: 2,
              height: tall ? 15 : 8,
              borderRadius: 1,
              backgroundColor: tall
                ? "rgba(124, 58, 237, 0.7)"
                : "rgba(124, 58, 237, 0.32)",
              opacity: o,
            }}
          />
        );
      })}
    </div>
  );
};

export const TvP1RebuildAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------------- camera ----------------
  const KEY_T = [0, 34, 52, 74, 92, 118, 140, 152, DURATION_IN_FRAMES - 1];
  const camOpts = {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const fx = interpolate(
    frame,
    KEY_T,
    [480, 480, 950, 950, 1420, 1420, 950, 950, 950],
    camOpts
  );
  const fy = interpolate(
    frame,
    KEY_T,
    [522, 522, 518, 518, 528, 528, 524, 524, 524],
    camOpts
  );
  const z = interpolate(
    frame,
    KEY_T,
    [1.7, 1.62, 1.3, 1.3, 1.55, 1.55, 0.76, 0.76, 0.76],
    camOpts
  );

  // ---------------- shared drivers ----------------
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;

  const chipSpr = spring({ frame: frame - 34, fps, config: SPRINGS.snappy });
  const chipO = interpolate(frame, [34, 41], [0, 1], clamp);
  const flashO = interpolate(frame, [92, 101, 122], [0, 1, 0], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const snapSpr = spring({ frame: frame - 96, fps, config: SPRINGS.snappy });
  const skelScale = 1.05 - 0.05 * snapSpr;
  const breathe = Math.sin(frame / 6.5);
  const glowBreathe = 0.45 + 0.16 * breathe + 0.3 * flashO;

  const statSpr = spring({ frame: frame - 12, fps, config: SPRINGS.snappy });
  const settle = interpolate(frame, [0, 12], [1.03, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const shimmerX = interpolate(frame, [6, 32], [-160, CARD_W + 160], clamp);

  const videoO = interpolate(frame, [86, 96], [0, 1], clamp);
  const rCardO = interpolate(frame, [56, 68], [0, 1], clamp);
  const skelIn = interpolate(frame, [68, 74], [0, 1], clamp);
  const skelOut = interpolate(frame, [104, 126], [1, 0], clamp);
  const rectDraw = interpolate(frame, [70, 84], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  const linesO =
    interpolate(frame, [40, 48], [0, 0.85], clamp) *
    interpolate(frame, [118, 140], [1, 0.62], clamp);

  const packets = [
    { line: 1, t0: 58 },
    { line: 0, t0: 66 },
    { line: 2, t0: 74 },
    { line: 1, t0: 124 },
  ];

  const ghosts = [
    { rect: L_FACE, t0: 52 },
    { rect: L_CAN, t0: 60 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: TV.bg, fontFamily: FONT_SANS }}>
      {/* ---------- ambient (screen space, frame 0 -> last) ---------- */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 44%, #FFFFFF 0%, ${TV.bg} 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-20%",
          right: "-20%",
          bottom: "-30%",
          height: "70%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(124, 58, 237, 0.10) 0%, rgba(124, 58, 237, 0.03) 45%, transparent 70%)",
          opacity: 0.78 + 0.14 * Math.sin(frame / 9),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "34%",
          background:
            "repeating-linear-gradient(90deg, rgba(124, 58, 237, 0.06) 0px, rgba(124, 58, 237, 0.06) 2px, transparent 2px, transparent 46px)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.9), transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.9), transparent 90%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-15%",
          top: "-20%",
          width: "55%",
          height: "55%",
          background:
            "radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 65%)",
        }}
      />

      {/* ---------- camera world ---------- */}
      <div
        style={{
          position: "absolute",
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* -------- structure lines (behind cards + chip) -------- */}
        <svg
          style={{
            position: "absolute",
            left: 600,
            top: 280,
            width: 700,
            height: 480,
            opacity: linesO,
            overflow: "visible",
          }}
          viewBox="600 280 700 480"
        >
          {LINES.map((pts, i) => {
            const draw = interpolate(
              frame,
              [40 + i * 6, 76 + i * 6],
              [0, 1],
              { ...clamp, easing: Easing.inOut(Easing.quad) }
            );
            return (
              <g key={i}>
                <path
                  d={lineD(pts)}
                  fill="none"
                  stroke="rgba(124, 58, 237, 0.14)"
                  strokeWidth={5}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={1 - draw}
                  strokeLinecap="round"
                />
                <path
                  d={lineD(pts)}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={1 - draw}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* packets travelling along the lines */}
        {packets.map(({ line, t0 }, i) => {
          const p = interpolate(frame, [t0, t0 + 30], [0, 1], {
            ...clamp,
            easing: Easing.inOut(Easing.quad),
          });
          if (p <= 0.001 || p >= 0.999) return null;
          const pos = cubicPt(...LINES[line], p);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x - 5,
                top: pos.y - 5,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#7C3AED",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.35)",
                opacity: Math.sin(p * Math.PI) * 0.95,
              }}
            />
          );
        })}

        {/* -------- ghost skeleton boxes drifting into Claude -------- */}
        {ghosts.map(({ rect, t0 }, i) => {
          const p = interpolate(frame, [t0, t0 + 26], [0, 1], {
            ...clamp,
            easing: Easing.inOut(Easing.cubic),
          });
          const o = interpolate(
            frame,
            [t0, t0 + 6, t0 + 20, t0 + 26],
            [0, 0.75, 0.55, 0],
            clamp
          );
          if (o <= 0.001) return null;
          const sx = L_LEFT + (rect.l + rect.w / 2) * CARD_W;
          const sy = CARD_TOP + (rect.t + rect.h / 2) * CARD_H;
          const cx = sx + (CHIP_X - sx) * p;
          const cy = sy + (CHIP_Y - sy) * p;
          const s = 1 - 0.78 * p;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                width: rect.w * CARD_W,
                height: rect.h * CARD_H,
                transform: `translate(-50%, -50%) scale(${s})`,
                border: `1.5px solid ${VIOLET_SOFT}`,
                borderRadius: 10,
                backgroundColor: VIOLET_FILL,
                opacity: o,
              }}
            />
          );
        })}

        {/* -------- LEFT: winning-ad phone card -------- */}
        <div
          style={{
            position: "absolute",
            left: L_LEFT,
            top: CARD_TOP,
            width: CARD_W,
            height: CARD_H,
            transform: `scale(${settle})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: CARD_R,
              overflow: "hidden",
              backgroundColor: TV.panel,
              border: `1px solid ${TV.border}`,
              boxShadow: "0 12px 40px rgba(23, 23, 28, 0.10)",
            }}
          >
            <Img
              src={staticFile("topview/allipop-ref-frame.png")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* soften the reference ad's brand wordmark + flavor text */}
            <div
              style={{
                position: "absolute",
                left: "16%",
                top: "50.6%",
                width: "31%",
                height: "8%",
                borderRadius: 12,
                backdropFilter: "blur(9px)",
                WebkitBackdropFilter: "blur(9px)",
                backgroundColor: "rgba(148, 142, 196, 0.34)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "21%",
                top: "66.5%",
                width: "24%",
                height: "6.6%",
                borderRadius: 10,
                backdropFilter: "blur(7px)",
                WebkitBackdropFilter: "blur(7px)",
                backgroundColor: "rgba(148, 142, 196, 0.30)",
              }}
            />
            {/* scan shimmer */}
            <div
              style={{
                position: "absolute",
                top: "-25%",
                left: shimmerX,
                width: 90,
                height: "150%",
                transform: "rotate(12deg)",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
                opacity: 0.13,
              }}
            />
            {/* view-count stat chip */}
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 476,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 999,
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: `1px solid ${TV.border}`,
                boxShadow: "0 4px 14px rgba(23, 23, 28, 0.12)",
                transform: `scale(${0.6 + 0.4 * statSpr})`,
                transformOrigin: "left center",
                opacity: interpolate(frame, [12, 18], [0, 1], clamp),
              }}
            >
              <span style={{ color: TV.purple, fontSize: 15 }}>▶</span>
              <span
                style={{
                  color: TV.text,
                  fontSize: 21,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                2.4M
              </span>
            </div>
            {/* playback progress line */}
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 12,
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.45)",
              }}
            >
              <div
                style={{
                  width: `${interpolate(frame, [0, 159], [16, 62])}%`,
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: TV.purple,
                }}
              />
            </div>
          </div>
          {/* skeleton boxes lifted from the winning ad */}
          {[L_FACE, L_CAN].map((r, i) => {
            const o =
              interpolate(frame, [36 + i * 6, 44 + i * 6], [0, 0.8], clamp) *
              interpolate(frame, [88, 112], [1, 0.4], clamp);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: r.l * CARD_W,
                  top: r.t * CARD_H,
                  width: r.w * CARD_W,
                  height: r.h * CARD_H,
                  border: `1.5px dashed ${VIOLET_SOFT}`,
                  borderRadius: 10,
                  backgroundColor: VIOLET_FILL,
                  opacity: o,
                }}
              />
            );
          })}
        </div>
        <Ticks
          x={L_LEFT}
          y={CARD_TOP + CARD_H + 18}
          w={CARD_W}
          startFrame={20}
          frame={frame}
        />

        {/* -------- CENTER: Claude node -------- */}
        <div
          style={{
            position: "absolute",
            left: CHIP_X - 170,
            top: CHIP_Y - 170,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.14) 0%, rgba(124, 58, 237, 0.05) 48%, transparent 72%)",
            opacity: chipO * glowBreathe,
          }}
        />
        {[58, 72, 108].map((t0, i) => {
          const p = interpolate(frame, [t0, t0 + 22], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.quad),
          });
          if (p <= 0.001 || p >= 0.999) return null;
          const size = CHIP_SIZE + 26;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: CHIP_X - size / 2,
                top: CHIP_Y - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                border: "1.5px solid rgba(124, 58, 237, 0.45)",
                transform: `scale(${0.95 + 1.35 * p})`,
                opacity: (1 - p) * 0.55,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: CHIP_X - CHIP_SIZE / 2,
            top: CHIP_Y - CHIP_SIZE / 2,
            width: CHIP_SIZE,
            height: CHIP_SIZE,
            borderRadius: 36,
            background: "linear-gradient(160deg, #FFFFFF 0%, #FBFAF8 100%)",
            border: `1px solid ${TV.border}`,
            boxShadow: "0 12px 40px rgba(23, 23, 28, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${(0.5 + 0.5 * chipSpr) * (1 + 0.02 * breathe)})`,
            opacity: chipO,
          }}
        >
          <Img
            src={staticFile("openseo/logos/claude-color.svg")}
            style={{ width: 84, height: 84 }}
          />
        </div>

        {/* -------- RIGHT: rebuilt-ad phone card -------- */}
        {/* purple materialization flash */}
        <div
          style={{
            position: "absolute",
            left: R_CX - 380,
            top: CARD_CY - 380,
            width: 760,
            height: 760,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, rgba(124, 58, 237, 0.05) 45%, transparent 70%)",
            opacity: flashO,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: R_LEFT,
            top: CARD_TOP,
            width: CARD_W,
            height: CARD_H,
            opacity: rCardO,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: CARD_R,
              overflow: "hidden",
              backgroundColor: TV.panel,
              border: `1px solid ${TV.border}`,
              boxShadow: "0 12px 40px rgba(23, 23, 28, 0.10)",
              transform: `scale(${0.985 + 0.015 * snapSpr})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 42%, rgba(124, 58, 237, 0.10) 0%, transparent 70%)",
              }}
            />
            <Sequence from={84} layout="none">
              <OffthreadVideo
                muted
                src={staticFile("topview/beat1-hook.mp4")}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: videoO,
                }}
              />
            </Sequence>
            {/* playback progress line */}
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 12,
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.45)",
                opacity: interpolate(frame, [98, 106], [0, 1], clamp),
              }}
            >
              <div
                style={{
                  width: `${interpolate(frame, [98, 159], [0, 38], clamp)}%`,
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: TV.purple,
                }}
              />
            </div>
          </div>
          {/* violet edge flash on snap */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: CARD_R,
              border: "1.5px solid rgba(124, 58, 237, 0.85)",
              opacity: flashO * 0.65,
            }}
          />
          {/* wireframe skeleton snapping onto the card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${skelScale})`,
              opacity: skelIn * skelOut,
            }}
          >
            <svg
              style={{
                position: "absolute",
                left: -14,
                top: -14,
                width: CARD_W + 28,
                height: CARD_H + 28,
                overflow: "visible",
              }}
              viewBox={`-14 -14 ${CARD_W + 28} ${CARD_H + 28}`}
            >
              <rect
                x={-6}
                y={-6}
                width={CARD_W + 12}
                height={CARD_H + 12}
                rx={CARD_R + 4}
                fill="none"
                stroke={VIOLET_SOFT}
                strokeWidth={2}
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - rectDraw}
              />
            </svg>
            {[R_FACE, R_CAN].map((r, i) => {
              const boxSpr = spring({
                frame: frame - (76 + i * 6),
                fps,
                config: SPRINGS.snappy,
              });
              const o = interpolate(
                frame,
                [76 + i * 6, 82 + i * 6],
                [0, 0.9],
                clamp
              );
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: r.l * CARD_W,
                    top: r.t * CARD_H,
                    width: r.w * CARD_W,
                    height: r.h * CARD_H,
                    border: `1.5px dashed ${VIOLET_SOFT}`,
                    borderRadius: 10,
                    backgroundColor: "rgba(124, 58, 237, 0.06)",
                    transform: `scale(${0.9 + 0.1 * boxSpr})`,
                    opacity: o,
                  }}
                />
              );
            })}
          </div>
        </div>
        <Ticks
          x={R_LEFT}
          y={CARD_TOP + CARD_H + 18}
          w={CARD_W}
          startFrame={104}
          frame={frame}
        />
      </div>
    </AbsoluteFill>
  );
};
