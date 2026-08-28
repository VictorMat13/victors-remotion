import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_SANS, SPRINGS, TOPVIEW, TV } from "./theme";

export const DURATION_IN_FRAMES = 480;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 1080;
const WORLD_H = 4600;

// Station A — plug: Claude hub + three platform cards
const HUB = { x: 540, y: 900 };
const HUB_SIZE = 150;

// Station B — Topview-style prompt bar
const BAR = { x: 120, y: 1620, w: 840, h: 390 };

// Station C1 — product cards
const PC = { x: 130, w: 820, h: 150, ys: [2352, 2522, 2692] };

// Station C2 — hook cards
const HC = { x: 120, w: 840, h: 170, ys: [3040, 3230, 3420] };

// Station D — no-wiring flourish (key + tangled cable)
const FLO = { y: 3860, keyX: 410, cableX: 650 };

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

//            A hold      | mv | B hold     | mv | C1 hold    | drift | C2 hold  | mv  | D hold | pull | land
const KEY_T = [0, 100, 122, 224, 246, 316, 334, 400, 420, 448, 468, 479];
const KEY_FY = [900, 900, 1810, 1810, 2600, 2600, 3310, 3310, 3860, 3860, 2076, 2076];
const KEY_FZ = [1.18, 1.18, 1.12, 1.12, 1.1, 1.1, 1.1, 1.1, 1.3, 1.3, 0.475, 0.475];

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easedOpt = { easing: ease, ...clampOpt };

/* ----------------------------------------------------------------- data --- */

type Pt = { x: number; y: number };

const lerpPt = (a: Pt, b: Pt, p: number): Pt => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
});

// platform fly-ins
const PLATFORMS = [
  {
    id: "amazon" as const,
    from: { x: -320, y: 620 },
    to: { x: 300, y: 620 },
    t0: 6,
    line: { a: { x: 392, y: 690 }, b: { x: 484, y: 836 }, bend: 42 },
  },
  {
    id: "tiktok" as const,
    from: { x: 1400, y: 620 },
    to: { x: 780, y: 620 },
    t0: 18,
    line: { a: { x: 690, y: 690 }, b: { x: 598, y: 836 }, bend: -42 },
  },
  {
    id: "youtube" as const,
    from: { x: 540, y: 1720 },
    to: { x: 540, y: 1210 },
    t0: 30,
    line: { a: { x: 540, y: 1136 }, b: { x: 540, y: 984 }, bend: 26 },
  },
];

const qPt = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

const lineCtrl = (a: Pt, b: Pt, bend: number): Pt => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return { x: mx + (-dy / len) * bend, y: my + (dx / len) * bend };
};

const QUERY = "what's selling in home fitness right now";
const TYPE_T0 = 134;
const TYPE_T1 = 200;
const SEND_T = 210;

const PRODUCTS = [
  {
    name: "FlexRun Walking Pad",
    price: "$249.99",
    tag: "amazon" as const,
    rank: "2",
    spark: [0.35, 0.42, 0.38, 0.5, 0.58, 0.54, 0.7, 0.86],
    t0: 250,
  },
  {
    name: "GripCore Dumbbell Set",
    price: "$189.00",
    tag: "tiktok" as const,
    rank: "5",
    spark: [0.3, 0.45, 0.4, 0.52, 0.5, 0.62, 0.68, 0.8],
    t0: 262,
  },
  {
    name: "AeroBand Pro Kit",
    price: "$34.99",
    tag: "youtube" as const,
    rank: "1",
    spark: [0.45, 0.4, 0.5, 0.47, 0.58, 0.66, 0.63, 0.74],
    t0: 274,
  },
];

const HOOKS = [
  { quote: "“I tested the viral walking pad for 30 days”", ctr: "CTR 12.4%", t0: 340 },
  { quote: "“Stop buying dumbbells before you see this”", ctr: "CTR 9.8%", t0: 352 },
  { quote: "“This $35 kit replaced my gym membership”", ctr: "CTR 8.7%", t0: 364 },
];

/* ---------------------------------------------------------------- atoms --- */

// soft white-card shadow (Liam white style)
const SOFT_SHADOW = "0 12px 40px rgba(23,23,28,0.10)";

// small platform identity tag used inside product cards — dark-ink logos
// sit directly on the white card (no chip backers in the white style)
const MINI_TAG_BOX: React.CSSProperties = {
  width: 96,
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
};

const MiniTag: React.FC<{ kind: "amazon" | "tiktok" | "youtube" }> = ({ kind }) => {
  if (kind === "amazon") {
    return (
      <div style={MINI_TAG_BOX}>
        <Img
          src={staticFile("tools/amazon.svg")}
          style={{ width: 84, height: 25, marginTop: 5 }}
        />
      </div>
    );
  }
  if (kind === "tiktok") {
    return (
      <div style={MINI_TAG_BOX}>
        <Img src={staticFile("logos/tiktok.svg")} style={{ width: 30, height: 34 }} />
      </div>
    );
  }
  return (
    <div style={MINI_TAG_BOX}>
      <Img src={staticFile("tools/youtube.svg")} style={{ width: 44, height: 31 }} />
    </div>
  );
};

const Spark: React.FC<{
  drawP: number;
  frame: number;
  data: number[];
  seed: number;
}> = ({ drawP, frame, data, seed }) => {
  const w = 168;
  const h = 52;
  const n = data.length;
  const pts = data.map((v, i) => ({
    x: 4 + (i / (n - 1)) * (w - 8),
    y: h - 5 - v * (h - 12),
  }));
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[n - 1];
  const dotR = drawP >= 1 ? 4.5 + 1.6 * Math.sin(frame / 7 + seed) : 4.5 * drawP;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <path
        d={d}
        stroke={TV.purple}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.min(1, drawP)}
        opacity={0.95}
      />
      {drawP > 0.2 ? (
        <circle
          cx={last.x}
          cy={last.y}
          r={Math.max(0, dotR)}
          fill={TV.purple}
          opacity={Math.min(1, drawP)}
        />
      ) : null}
    </svg>
  );
};

const Ring: React.FC<{ p: number; x: number; y: number; base?: number; color?: string }> = ({
  p,
  x,
  y,
  base = 90,
  color = TV.violet,
}) => {
  if (p <= 0 || p >= 1) return null;
  const size = base * (0.5 + 1.4 * p);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        opacity: 0.7 * (1 - p),
      }}
    />
  );
};

/* ---------------------------------------------------------- composition --- */

export const TvP4Platforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fx = 540;
  const fy = interpolate(frame, KEY_T, KEY_FY, easedOpt);
  const z = interpolate(frame, KEY_T, KEY_FZ, easedOpt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy
  ) =>
    frame < t0
      ? 0
      : spring({ frame: frame - t0, fps, config, durationInFrames: 42 });

  /* ---- act 1: plug ---- */
  const introRingP = interpolate(frame, [-6, 18], [0, 1], clampOpt);

  /* ---- act 2: ask ---- */
  const barInP = spr(108, SPRINGS.smooth);
  const placeholderOp = interpolate(frame, [122, 132], [0.75, 0], clampOpt);
  const typedChars = Math.floor(
    interpolate(frame, [TYPE_T0, TYPE_T1], [0, QUERY.length], clampOpt)
  );
  const typing = frame >= TYPE_T0 && typedChars < QUERY.length;
  const caretOn = frame >= 126 && frame < SEND_T + 2 && frame % 16 < 9;
  const sendReadyP = spr(TYPE_T1 + 4, SPRINGS.smooth);
  const pressP = spr(SEND_T, SPRINGS.bouncy);
  const pressScale = 1 - 0.16 * Math.sin(Math.min(1, pressP) * Math.PI);
  const rippleP = interpolate(frame, [SEND_T + 2, SEND_T + 22], [0, 1], clampOpt);
  const barFlashP =
    interpolate(frame, [SEND_T + 1, SEND_T + 6], [0, 1], easedOpt) *
    interpolate(frame, [SEND_T + 10, SEND_T + 26], [1, 0], easedOpt);

  /* ---- spine: bar -> products ---- */
  const spine1P = interpolate(frame, [228, 248], [0, 1], easedOpt);
  const spine2P = interpolate(frame, [330, 346], [0, 1], easedOpt);

  /* ---- act 4: flourish sweep ---- */
  const sweepX = interpolate(frame, [424, 444], [270, 830], easedOpt);
  const sweepOp =
    interpolate(frame, [424, 428], [0, 1], clampOpt) *
    interpolate(frame, [440, 446], [1, 0], clampOpt);
  const dissolve = (gx: number) =>
    interpolate(sweepX, [gx - 80, gx + 80], [0, 1], clampOpt);
  const floInP = spr(404, SPRINGS.smooth);

  return (
    <AbsoluteFill style={{ backgroundColor: TV.bg, fontFamily: FONT_SANS }}>
      {/* warm white base painted on the root AbsoluteFill — frame 0 -> last */}
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ================= connection lines (act 1) ================= */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {PLATFORMS.map((pl, i) => {
            const t0 = pl.t0 + 20;
            const p = interpolate(frame, [t0, t0 + 14], [0, 1], easedOpt);
            if (p <= 0) return null;
            const c = lineCtrl(pl.line.a, pl.line.b, pl.line.bend);
            const flash =
              interpolate(frame, [t0 + 12, t0 + 16], [0, 1], clampOpt) *
              interpolate(frame, [t0 + 20, t0 + 34], [1, 0], clampOpt);
            return (
              <g key={i}>
                <path
                  d={`M ${pl.line.a.x} ${pl.line.a.y} Q ${c.x} ${c.y} ${pl.line.b.x} ${pl.line.b.y}`}
                  stroke={TV.purple}
                  strokeWidth={4 + 3.5 * flash}
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  opacity={0.8 + 0.2 * flash}
                />
                {/* packets flowing into the hub during holds */}
                {frame >= t0 + 26
                  ? [0, 1].map((k) => {
                      const u = ((frame - t0) * 0.022 + k * 0.5) % 1;
                      const pos = qPt(pl.line.a, c, pl.line.b, u);
                      return (
                        <circle
                          key={k}
                          cx={pos.x}
                          cy={pos.y}
                          r={5.5}
                          fill={TV.purple}
                          opacity={0.65 * Math.sin(u * Math.PI)}
                        />
                      );
                    })
                  : null}
              </g>
            );
          })}
          {/* spine: prompt bar -> product stack */}
          <path
            d={`M 540 2022 L 540 2340`}
            stroke={TV.purple}
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - spine1P}
            opacity={0.6}
          />
          {spine1P >= 1 ? (
            <circle
              cx={540}
              cy={2022 + (((frame * 0.016) % 1) * 318)}
              r={5.5}
              fill={TV.purple}
              opacity={0.6 * Math.sin(((frame * 0.016) % 1) * Math.PI)}
            />
          ) : null}
          {/* spine: products -> hooks */}
          <path
            d={`M 540 2872 L 540 3030`}
            stroke={TV.purple}
            strokeWidth={3.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - spine2P}
            opacity={0.5}
          />
        </svg>

        {/* ================= station A — platform cards ================= */}
        {PLATFORMS.map((pl, i) => {
          const p = spr(pl.t0, { damping: 17, stiffness: 130 });
          const pos = lerpPt(pl.from, pl.to, p);
          const rot = (1 - p) * (pl.id === "tiktok" ? 7 : -7);
          const dockP = interpolate(frame, [pl.t0 + 16, pl.t0 + 38], [0, 1], clampOpt);
          return (
            <React.Fragment key={i}>
              <Ring p={dockP} x={pl.to.x} y={pl.to.y} base={150} />
              <div
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%,-50%) rotate(${rot}deg)`,
                  opacity: Math.min(1, p * 2.5),
                  width: 324,
                  height: 116,
                  backgroundColor: TV.panel,
                  border: `1.5px solid ${TV.border}`,
                  borderRadius: 22,
                  boxShadow: SOFT_SHADOW,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                {pl.id === "amazon" ? (
                  <Img
                    src={staticFile("tools/amazon.svg")}
                    style={{ width: 196, height: 59, marginTop: 12 }}
                  />
                ) : null}
                {pl.id === "tiktok" ? (
                  <>
                    <Img
                      src={staticFile("logos/tiktok.svg")}
                      style={{ width: 46, height: 52 }}
                    />
                    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                      <span style={{ fontSize: 35, fontWeight: 700, color: TV.text }}>
                        TikTok
                      </span>
                      <span style={{ fontSize: 27, fontWeight: 600, color: TV.muted }}>
                        Shop
                      </span>
                    </div>
                  </>
                ) : null}
                {pl.id === "youtube" ? (
                  <>
                    <Img
                      src={staticFile("tools/youtube.svg")}
                      style={{ width: 74, height: 52 }}
                    />
                    <span style={{ fontSize: 35, fontWeight: 700, color: TV.text }}>
                      YouTube
                    </span>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          );
        })}

        {/* ================= station A — Claude hub ================= */}
        <Ring p={introRingP} x={HUB.x} y={HUB.y} base={220} />
        <div
          style={{
            position: "absolute",
            left: HUB.x,
            top: HUB.y,
            transform: "translate(-50%,-50%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -HUB_SIZE / 2,
              top: -HUB_SIZE / 2,
              width: HUB_SIZE,
              height: HUB_SIZE,
              borderRadius: 36,
              backgroundColor: TV.panel,
              border: `1.5px solid ${TV.border}`,
              boxShadow:
                "0 12px 40px rgba(23,23,28,0.12), 0 4px 18px rgba(124,58,237,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("openseo/logos/claude-color.svg")}
              style={{ width: 92, height: 92 }}
            />
          </div>
        </div>

        {/* ================= station B — Topview prompt bar ================= */}
        {/* light input card with a subtle violet border (white style) */}
        <div
          style={{
            position: "absolute",
            left: BAR.x,
            top: BAR.y,
            width: BAR.w,
            height: BAR.h,
            backgroundColor: TV.panel,
            borderRadius: 26,
            border: `1.5px solid rgba(124,58,237,${0.3 + 0.5 * barFlashP})`,
            boxShadow: `0 18px 50px rgba(23,23,28,0.12), 0 0 ${
              18 + 34 * barFlashP
            }px rgba(124,58,237,${0.1 + 0.26 * barFlashP})`,
            opacity: barInP,
            transform: `translateY(${28 * (1 - barInP)}px)`,
            overflow: "hidden",
          }}
        >
          {/* tab row (real Topview product tabs) */}
          <div
            style={{
              position: "absolute",
              left: 42,
              top: 0,
              height: 74,
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: TV.text,
                  whiteSpace: "nowrap",
                }}
              >
                {TOPVIEW.productTabs[0]}
              </span>
              <span
                style={{
                  fontSize: 19,
                  color: TV.muted,
                  border: `1px solid ${TV.border}`,
                  borderRadius: 999,
                  padding: "2px 12px",
                  whiteSpace: "nowrap",
                }}
              >
                Canvas ⌄
              </span>
            </div>
            {TOPVIEW.productTabs.slice(1).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  color: TV.faint,
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 74,
              width: BAR.w,
              height: 1.5,
              backgroundColor: TV.border,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 42,
              top: 71,
              width: 178,
              height: 3.5,
              borderRadius: 2,
              backgroundColor: TV.purple,
            }}
          />

          {/* input area: real placeholder, then the typed query */}
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 108,
              right: 44,
              fontSize: 33,
              color: TV.faint,
              opacity: placeholderOp,
              whiteSpace: "nowrap",
            }}
          >
            {TOPVIEW.promptPlaceholder}
          </div>
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 104,
              right: 44,
              fontSize: 38,
              fontWeight: 500,
              color: TV.text,
              lineHeight: 1.35,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>{QUERY.slice(0, typedChars)}</span>
            {caretOn || typing ? (
              <span
                style={{
                  display: "inline-block",
                  width: 3.5,
                  height: 42,
                  backgroundColor: TV.text,
                  marginLeft: 5,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            ) : null}
          </div>

          {/* bottom controls */}
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: 30,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                border: `1.5px solid ${TV.border}`,
                backgroundColor: TV.panel2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                color: TV.muted,
              }}
            >
              +
            </div>
            <div
              style={{
                height: 54,
                borderRadius: 27,
                border: `1.5px solid ${TV.border}`,
                backgroundColor: TV.panel2,
                display: "flex",
                alignItems: "center",
                padding: "0 22px",
                fontSize: 26,
                color: TV.muted,
                gap: 10,
              }}
            >
              {TOPVIEW.models[2]} 2.0 <span style={{ fontSize: 20 }}>⌄</span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 40,
              bottom: 30,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <span style={{ fontSize: 25, color: TV.faint }}>Agent</span>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor:
                  sendReadyP > 0.02
                    ? `rgba(124,58,237,${0.35 + 0.65 * sendReadyP})`
                    : TV.panel2,
                border: `1.5px solid ${
                  sendReadyP > 0.02 ? "rgba(124,58,237,0.55)" : TV.border
                }`,
                boxShadow:
                  sendReadyP > 0.02
                    ? `0 8px 22px rgba(124,58,237,${0.2 + 0.2 * sendReadyP})`
                    : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${pressScale})`,
              }}
            >
              <svg width={26} height={28} viewBox="0 0 26 28">
                <path
                  d="M13 25 L13 4 M13 4 L4 13 M13 4 L22 13"
                  stroke={sendReadyP > 0.02 ? "#FFFFFF" : TV.muted}
                  strokeWidth={3.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        {/* send ripple (over the bar, world coords) */}
        <Ring
          p={rippleP}
          x={BAR.x + BAR.w - 69}
          y={BAR.y + BAR.h - 59}
          base={120}
          color="rgba(167,139,250,0.9)"
        />

        {/* ================= station C1 — product cards ================= */}
        {PRODUCTS.map((pr, i) => {
          const p = spr(pr.t0, { damping: 18, stiffness: 150 });
          const sparkP = interpolate(frame, [pr.t0 + 10, pr.t0 + 34], [0, 1], easedOpt);
          const rankP = spr(pr.t0 + 16, SPRINGS.bouncy);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: PC.x,
                top: PC.ys[i],
                width: PC.w,
                height: PC.h,
                backgroundColor: TV.panel,
                border: `1.5px solid ${TV.border}`,
                borderRadius: 22,
                boxShadow: SOFT_SHADOW,
                opacity: Math.min(1, p * 2.2),
                transform: `translateY(${64 * (1 - p)}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: (PC.h - 48) / 2,
                }}
              >
                <MiniTag kind={pr.tag} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 150,
                  top: 30,
                  fontSize: 34,
                  fontWeight: 600,
                  color: TV.text,
                  whiteSpace: "nowrap",
                }}
              >
                {pr.name}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 150,
                  top: 84,
                  fontSize: 29,
                  fontWeight: 500,
                  color: "#5B21B6",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {pr.price}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 556,
                  top: 40,
                  fontSize: 27,
                  fontWeight: 700,
                  color: TV.green,
                  fontVariantNumeric: "tabular-nums",
                  opacity: rankP,
                  transform: `translateY(${8 * (1 - rankP)}px)`,
                }}
              >
                ▲ {pr.rank}
              </div>
              <div style={{ position: "absolute", left: 626, top: 50 }}>
                <Spark drawP={sparkP} frame={frame} data={pr.spark} seed={i * 2.1} />
              </div>
            </div>
          );
        })}

        {/* ================= station C2 — hook cards ================= */}
        {HOOKS.map((hk, i) => {
          const p = spr(hk.t0, { damping: 18, stiffness: 150 });
          const chipP = spr(hk.t0 + 14, SPRINGS.bouncy);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: HC.x,
                top: HC.ys[i],
                width: HC.w,
                height: HC.h,
                backgroundColor: TV.panel,
                border: `1.5px solid ${TV.border}`,
                borderRadius: 22,
                boxShadow: SOFT_SHADOW,
                opacity: Math.min(1, p * 2.2),
                transform: `translateY(${64 * (1 - p)}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 40,
                  top: 0,
                  bottom: 0,
                  width: 560,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 33,
                  fontWeight: 500,
                  color: TV.text,
                  lineHeight: 1.4,
                }}
              >
                {hk.quote}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 36,
                  top: (HC.h - 54) / 2,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: "#EDE9FE",
                  border: "1.5px solid rgba(124,58,237,0.16)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 22px",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#5B21B6",
                  fontVariantNumeric: "tabular-nums",
                  opacity: chipP,
                  transform: `scale(${0.6 + 0.4 * chipP})`,
                }}
              >
                {hk.ctr}
              </div>
            </div>
          );
        })}

        {/* ================= station D — no-wiring flourish ================= */}
        {/* key chip */}
        {(() => {
          const dp = dissolve(FLO.keyX);
          return (
            <div
              style={{
                position: "absolute",
                left: FLO.keyX - 65,
                top: FLO.y - 65,
                width: 130,
                height: 130,
                backgroundColor: TV.panel,
                border: `1.5px solid ${TV.border}`,
                borderRadius: 26,
                boxShadow: SOFT_SHADOW,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: floInP * (1 - dp),
                transform: `translateY(${14 * dp + 16 * (1 - floInP)}px) scale(${
                  1 - 0.1 * dp
                })`,
                filter: dp > 0 ? `blur(${9 * dp}px)` : undefined,
              }}
            >
              <svg width={92} height={64} viewBox="0 0 120 84">
                <circle
                  cx={26}
                  cy={42}
                  r={17}
                  stroke={TV.muted}
                  strokeWidth={6}
                  fill="none"
                />
                <path
                  d="M43 42 L108 42 M88 42 L88 62 M104 42 L104 66"
                  stroke={TV.muted}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          );
        })()}
        {/* tangled cable chip */}
        {(() => {
          const dp = dissolve(FLO.cableX);
          return (
            <div
              style={{
                position: "absolute",
                left: FLO.cableX - 95,
                top: FLO.y - 65,
                width: 190,
                height: 130,
                backgroundColor: TV.panel,
                border: `1.5px solid ${TV.border}`,
                borderRadius: 26,
                boxShadow: SOFT_SHADOW,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: floInP * (1 - dp),
                transform: `translateY(${14 * dp + 16 * (1 - floInP)}px) scale(${
                  1 - 0.1 * dp
                })`,
                filter: dp > 0 ? `blur(${9 * dp}px)` : undefined,
              }}
            >
              <svg width={150} height={92} viewBox="0 0 170 104">
                <rect x={4} y={72} width={17} height={22} rx={4} fill={TV.faint} />
                <path
                  d="M20 82 C 34 44 60 34 66 62 C 71 88 42 94 47 66 C 52 40 92 30 112 50 C 126 64 138 52 148 42"
                  stroke={TV.faint}
                  strokeWidth={5.5}
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x={144}
                  y={28}
                  width={17}
                  height={22}
                  rx={4}
                  fill={TV.faint}
                  transform="rotate(38 152 39)"
                />
              </svg>
            </div>
          );
        })()}
        {/* clean light sweep */}
        {sweepOp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: sweepX - 45,
              top: FLO.y - 210,
              width: 90,
              height: 420,
              background:
                "linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.32) 50%, rgba(124,58,237,0) 100%)",
              filter: "blur(6px)",
              transform: "rotate(-8deg)",
              opacity: sweepOp,
            }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
