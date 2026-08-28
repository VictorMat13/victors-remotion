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
import { CLI, FONT_MONO, FONT_SANS, NOTION, PILL, SPRINGS } from "./theme";

export const DURATION_IN_FRAMES = 300;

/* ---------------------------------------------------------------- world --- */

const WORLD_W = 2100;
const WORLD_H = 3000;

// Beat zones (world coords)
const PAGE = { x: 580, y: 280, w: 940, h: 870 }; // ⚡ Workers page fragment
const NODE = { x: 60, y: 216, w: 820, h: 566 }; // worker node (local to PAGE)
const PORT = { x: 1050, y: 1150 }; // connection port on page bottom edge

const SLACK = { x: 590, y: 1400, w: 480, h: 150 };
const GMAIL = { x: 1130, y: 1640, w: 480, h: 150 };
const STRIPE = { x: 620, y: 1880, w: 480, h: 150 };

const ORB = { x: 1050, y: 2520, r: 160 };
const MINT = { x: 1050, y: 2320 }; // where action chips pop off the stream
const CHIP_R = 310; // orbit radius

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

// hold node | move | hold tools | move | hold orb | move | land hold
const KEY_T = [0, 78, 96, 170, 188, 256, 274, 299];
const KEY_FX = [1050, 1050, 1095, 1095, 1050, 1050, 1060, 1060];
const KEY_FY = [760, 760, 1560, 1560, 2500, 2500, 1620, 1620];
const KEY_Z = [1.0, 1.0, 0.92, 0.92, 1.0, 1.0, 0.55, 0.55];

/* ------------------------------------------------------------ connections --- */

type Pt = { x: number; y: number };

type Wire = {
  c1: Pt;
  c2: Pt;
  to: Pt; // attach point on the tool card
  t0: number; // line draw start
  t1: number; // line draw end
};

const WIRES: Wire[] = [
  // → Slack (top-mid)
  { c1: { x: 1020, y: 1240 }, c2: { x: 980, y: 1300 }, to: { x: 900, y: 1398 }, t0: 100, t1: 118 },
  // → Gmail (top-mid, swings right of Slack)
  { c1: { x: 1150, y: 1280 }, c2: { x: 1300, y: 1450 }, to: { x: 1345, y: 1638 }, t0: 116, t1: 134 },
  // → Stripe (down the corridor between Slack and Gmail, curls left)
  { c1: { x: 1120, y: 1350 }, c2: { x: 1110, y: 1660 }, to: { x: 985, y: 1878 }, t0: 132, t1: 150 },
];

const cubicPt = (p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};

/* ---------------------------------------------------------------- atoms --- */

const iv = (
  frame: number,
  range: [number, number],
  out: [number, number]
): number =>
  interpolate(frame, range, out, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const WhiteCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: "#FFFFFF",
      border: `1.5px solid ${NOTION.border}`,
      borderRadius: 14,
      boxShadow: "0 1px 2px rgba(15,15,15,0.03), 0 6px 22px rgba(15,15,15,0.06)",
      ...style,
    }}
  >
    {children}
  </div>
);

/* -------------------------------------------------------------- orb face --- */

// Notion's official aiFace geometry (extracted verbatim from the app —
// public/notion/ai-face.svg, viewBox 0 0 20 20). The paths are NEVER altered;
// the "expression brightens" beat is a subtle tilt + scale bounce of the whole
// face group instead.
const AI_FACE_EYES =
  "M12.758 9.976a1.178 1.178 0 1 0 .377-2.326 1.178 1.178 0 0 0-.377 2.326M6.547 8.97a1.178 1.178 0 1 0 .377-2.327 1.178 1.178 0 0 0-.377 2.326";
const AI_FACE_STROKES =
  "M10.573 5.554a3.917 3.917 0 0 1 6.743.035.625.625 0 1 1-1.08.63 2.667 2.667 0 0 0-4.591-.023l-5.398 9.015 4.192.68a.625.625 0 0 1-.2 1.233l-5.102-.827a.625.625 0 0 1-.436-.938zM4.36 3.517a3.92 3.92 0 0 1 5.572.356.625.625 0 1 1-.945.818 2.67 2.67 0 0 0-3.795-.243.625.625 0 1 1-.833-.931";

const OrbFace: React.FC<{ size: number; happyP: number }> = ({ size, happyP }) => {
  const INK = "#191919";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{
        position: "absolute",
        left: "54%",
        top: "50%",
        transform: `translate(-50%, -51%) rotate(${-2 + 6 * happyP}deg) scale(${
          1 + 0.06 * happyP
        })`,
      }}
    >
      <path d={AI_FACE_EYES} fill={INK} />
      <path d={AI_FACE_STROKES} fill={INK} />
    </svg>
  );
};

/* ---------------------------------------------------------- composition --- */

export const NotionP5Workers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const camOpt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const fx = interpolate(frame, KEY_T, KEY_FX, camOpt);
  const fy = interpolate(frame, KEY_T, KEY_FY, camOpt);
  const z = interpolate(frame, KEY_T, KEY_Z, camOpt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy
  ) =>
    frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: 34 });

  /* ---- beat 1: worker node assembles inside the Workers page ---- */
  // pre-rolled 4 frames so frame 0 already opens mid-motion
  const nodeP = spring({ frame: frame + 4, fps, config: SPRINGS.smooth, durationInFrames: 34 });
  const stepP = [spr(10), spr(18), spr(26)];
  const CMD = `$ ${CLI.workersDeploy}`;
  const typedChars = Math.floor(iv(frame, [30, 52], [0, CMD.length]));
  const typing = frame >= 30 && typedChars < CMD.length;
  const caretOn = typing && frame % 14 < 8;
  const deployedP = spr(56);
  const activeP = spr(64, SPRINGS.bouncy);
  const runsP = spr(70);
  const runCount = 128 + Math.max(0, Math.floor((frame - 70) / 34));
  const dotPulse = 0.55 + 0.45 * Math.sin(frame / 9);

  // pulse rings at the port (every 34 frames from 66)
  const rings: number[] = [];
  for (let t = 66; t <= frame; t += 34) {
    const age = frame - t;
    if (age <= 30) rings.push(age / 30);
  }

  /* ---- beat 2: wires draw to real tools, packets travel ---- */
  const cardPop = [spr(110, SPRINGS.bouncy), spr(126, SPRINGS.bouncy), spr(142, SPRINGS.bouncy)];
  const packetsOn = iv(frame, [150, 162], [0, 1]);

  /* ---- beat 3: agent orb flies in, action chips mint + dock ---- */
  const orbInP = iv(frame, [190, 214], [0, 1]);
  const orbX = ORB.x + (1 - orbInP) * 720;
  const orbY = ORB.y - Math.sin(orbInP * Math.PI) * 90 + 6 * Math.sin(frame / 13);
  const orbTilt = (1 - orbInP) * -10 + 2 * Math.sin(frame / 17);
  const orbScale = 0.92 + 0.08 * spr(192, SPRINGS.smooth);

  const streamDraw = iv(frame, [198, 210], [0, 1]);
  const streamFade = iv(frame, [244, 256], [1, 0]);

  const happyP = spr(246);
  const happyPop = 1 + 0.07 * Math.sin(Math.min(1, happyP) * Math.PI);

  const CHIPS = [
    // ctrl bends the glide path so chips swing AROUND the orb, never across it
    { icon: "🧾", label: "Send invoice", mint: 212, a0: -2.0, ctrl: { x: 930, y: 2240 } },
    { icon: "💬", label: "Post update", mint: 226, a0: -0.45, ctrl: { x: 1230, y: 2255 } },
    { icon: "💳", label: "Log payment", mint: 240, a0: 1.85, ctrl: { x: 640, y: 2470 } },
  ];
  const drift = 0.005 * Math.max(0, frame - 236);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: NOTION.bg,
        background:
          "radial-gradient(140% 110% at 50% 40%, #FFFFFF 0%, #FBFAF8 55%, #F4F3F0 100%)",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ============== wires + stream (behind cards) ============== */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <defs>
            <linearGradient id="p5stream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NOTION.blue} stopOpacity={0} />
              <stop offset="55%" stopColor={NOTION.blue} stopOpacity={0.55} />
              <stop offset="100%" stopColor={NOTION.blue} stopOpacity={0.7} />
            </linearGradient>
          </defs>

          {/* worker → tool wires */}
          {WIRES.map((w, i) => {
            const p = iv(frame, [w.t0, w.t1], [0, 1]);
            if (p <= 0) return null;
            return (
              <path
                key={i}
                d={`M ${PORT.x} ${PORT.y} C ${w.c1.x} ${w.c1.y}, ${w.c2.x} ${w.c2.y}, ${w.to.x} ${w.to.y}`}
                stroke={NOTION.blue}
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
                opacity={0.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
              />
            );
          })}

          {/* attach dots */}
          {WIRES.map((w, i) => {
            const pop = spr(w.t1, SPRINGS.bouncy);
            if (pop <= 0) return null;
            return (
              <circle
                key={`a${i}`}
                cx={w.to.x}
                cy={w.to.y}
                r={7 * pop}
                fill={NOTION.blue}
                opacity={0.85}
              />
            );
          })}

          {/* packets — both directions */}
          {packetsOn > 0 &&
            WIRES.map((w, i) => {
              const p0 = { x: PORT.x, y: PORT.y };
              const els: React.ReactNode[] = [];
              for (let k = 0; k < 2; k++) {
                const td = (frame * 0.011 + i * 0.37 + k * 0.5) % 1;
                const pd = cubicPt(p0, w.c1, w.c2, w.to, td);
                els.push(
                  <circle
                    key={`d${i}-${k}`}
                    cx={pd.x}
                    cy={pd.y}
                    r={6}
                    fill={NOTION.blue}
                    opacity={packetsOn * Math.sin(Math.PI * td)}
                  />
                );
                const tu = 1 - ((frame * 0.009 + i * 0.29 + k * 0.5 + 0.25) % 1);
                const pu = cubicPt(p0, w.c1, w.c2, w.to, tu);
                els.push(
                  <circle
                    key={`u${i}-${k}`}
                    cx={pu.x}
                    cy={pu.y}
                    r={5}
                    fill={NOTION.green}
                    opacity={packetsOn * 0.9 * Math.sin(Math.PI * tu)}
                  />
                );
              }
              return <g key={`pk${i}`}>{els}</g>;
            })}

          {/* port pulse rings */}
          {rings.map((p, i) => (
            <circle
              key={`r${i}`}
              cx={PORT.x}
              cy={PORT.y}
              r={10 + p * 34}
              stroke={NOTION.blue}
              strokeWidth={2.5}
              fill="none"
              opacity={0.5 * (1 - p)}
            />
          ))}
          {frame >= 64 && <circle cx={PORT.x} cy={PORT.y} r={8} fill={NOTION.blue} />}

          {/* delivery stream into the orb zone */}
          {streamDraw > 0 && streamFade > 0 && (
            <path
              d={`M 1050 2060 Q 1032 2200 ${MINT.x} ${MINT.y}`}
              stroke="url(#p5stream)"
              strokeWidth={3.5}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - streamDraw}
              opacity={streamFade}
            />
          )}
        </svg>

        {/* ==================== Workers page fragment ==================== */}
        <WhiteCard x={PAGE.x} y={PAGE.y} w={PAGE.w} h={PAGE.h}>
          {/* breadcrumb */}
          <div
            style={{
              position: "absolute",
              left: 42,
              top: 34,
              display: "flex",
              alignItems: "center",
              gap: 13,
            }}
          >
            <Img
              src={staticFile("notion/notion-logo.png")}
              style={{ width: 34, height: 34, borderRadius: 7 }}
            />
            <span style={{ fontSize: 27, color: NOTION.muted, fontWeight: 500 }}>
              Liam&apos;s Notion&nbsp;&nbsp;/&nbsp;&nbsp;Workers
            </span>
          </div>

          {/* title */}
          <div
            style={{
              position: "absolute",
              left: 42,
              top: 96,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <span style={{ fontSize: 52, lineHeight: 1 }}>⚡</span>
            <span style={{ fontSize: 54, fontWeight: 800, color: NOTION.text }}>
              Workers
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: 42,
              right: 42,
              top: 184,
              height: 1.5,
              backgroundColor: NOTION.border,
            }}
          />

          {/* -------------------- worker node card -------------------- */}
          <div
            style={{
              position: "absolute",
              left: NODE.x,
              top: NODE.y,
              width: NODE.w,
              height: NODE.h,
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${NOTION.border}`,
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(15,15,15,0.05)",
              transform: `scale(${0.86 + 0.14 * nodeP})`,
              transformOrigin: "50% 35%",
              opacity: Math.min(1, nodeP * 1.6),
            }}
          >
            {/* header */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 26,
                right: 30,
                height: 60,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 11,
                  backgroundColor: NOTION.hoverRow,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  flex: "none",
                }}
              >
                ⚙️
              </div>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 36,
                  fontWeight: 600,
                  color: NOTION.text,
                }}
              >
                invoice-sync
              </span>
              <div style={{ flex: 1 }} />
              {/* runs counter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  opacity: runsP,
                }}
              >
                <span style={{ fontSize: 26, color: NOTION.faint, fontWeight: 500 }}>
                  Runs
                </span>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: NOTION.textSoft,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {runCount}
                </span>
              </div>
              {/* Active pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: PILL.green.bg,
                  color: PILL.green.text,
                  borderRadius: 7,
                  padding: "6px 16px",
                  fontSize: 28,
                  fontWeight: 600,
                  transform: `scale(${activeP})`,
                  opacity: activeP,
                }}
              >
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    backgroundColor: NOTION.green,
                    opacity: frame >= 66 ? dotPulse : 1,
                  }}
                />
                Active
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 30,
                right: 30,
                top: 108,
                height: 1.5,
                backgroundColor: NOTION.border,
              }}
            />

            {/* steps */}
            {[
              { icon: "📥", text: "New page in Invoices" },
              { icon: "🧮", text: "Summarize amount + client" },
              { icon: "💬", text: "Message #finance" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 30,
                  top: 130 + i * 68,
                  right: 30,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  opacity: stepP[i],
                  transform: `translateY(${(1 - stepP[i]) * 16}px)`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    backgroundColor: NOTION.sidebar,
                    border: `1.5px solid ${NOTION.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    flex: "none",
                  }}
                >
                  {s.icon}
                </div>
                <span style={{ fontSize: 33, color: NOTION.textSoft, fontWeight: 500 }}>
                  {s.text}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 26, color: "#C9C7C3" }}>{i + 1}</span>
              </div>
            ))}

            <div
              style={{
                position: "absolute",
                left: 30,
                right: 30,
                top: 348,
                height: 1.5,
                backgroundColor: NOTION.border,
              }}
            />

            {/* CLI deploy chip */}
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 374,
                right: 30,
                height: 66,
                backgroundColor: NOTION.sidebar,
                border: `1.5px solid ${NOTION.border}`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                paddingLeft: 24,
                fontFamily: FONT_MONO,
                fontSize: 31,
                color: NOTION.textSoft,
                opacity: frame >= 28 ? 1 : 0,
              }}
            >
              {CMD.slice(0, typedChars)}
              {caretOn ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 36,
                    backgroundColor: NOTION.textSoft,
                    marginLeft: 4,
                  }}
                />
              ) : null}
            </div>

            {/* deploy result */}
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 462,
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: FONT_MONO,
                fontSize: 29,
                color: NOTION.green,
                opacity: deployedP,
                transform: `translateY(${(1 - deployedP) * 10}px)`,
              }}
            >
              <span style={{ fontWeight: 700 }}>✓</span> invoice-sync deployed
            </div>
          </div>
        </WhiteCard>

        {/* ==================== tool cards (rydnel-06 anatomy) ==================== */}

        {/* Slack */}
        <WhiteCard
          x={SLACK.x}
          y={SLACK.y}
          w={SLACK.w}
          h={SLACK.h}
          style={{
            transform: `scale(${0.85 + 0.15 * cardPop[0]})`,
            opacity: cardPop[0],
            transformOrigin: "50% 0%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              gap: 24,
              paddingLeft: 30,
            }}
          >
            <Img src={staticFile("slack/slack-icon.svg")} style={{ width: 58, height: 58 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: NOTION.text }}>Slack</span>
              <span style={{ fontSize: 28, color: NOTION.muted }}>
                #finance · New message
              </span>
            </div>
          </div>
        </WhiteCard>

        {/* Gmail */}
        <WhiteCard
          x={GMAIL.x}
          y={GMAIL.y}
          w={GMAIL.w}
          h={GMAIL.h}
          style={{
            transform: `scale(${0.85 + 0.15 * cardPop[1]})`,
            opacity: cardPop[1],
            transformOrigin: "50% 0%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              gap: 24,
              paddingLeft: 30,
            }}
          >
            <Img src={staticFile("tools/gmail.svg")} style={{ width: 62, height: 47 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: NOTION.text }}>Gmail</span>
              <span style={{ fontSize: 28, color: NOTION.muted }}>Invoice #1042 sent</span>
            </div>
          </div>
        </WhiteCard>

        {/* Stripe — blue wordmark on a white card */}
        <WhiteCard
          x={STRIPE.x}
          y={STRIPE.y}
          w={STRIPE.w}
          h={STRIPE.h}
          style={{
            transform: `scale(${0.85 + 0.15 * cardPop[2]})`,
            opacity: cardPop[2],
            transformOrigin: "50% 0%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              paddingLeft: 32,
            }}
          >
            <Img src={staticFile("tools/stripe.svg")} style={{ width: 101, height: 42 }} />
            <span style={{ fontSize: 28, color: NOTION.muted }}>
              Payment received · $250.00
            </span>
          </div>
        </WhiteCard>

        {/* ==================== agent orb + action chips ==================== */}

        {/* orb */}
        {orbInP > 0 && (
          <div
            style={{
              position: "absolute",
              left: orbX - ORB.r - 12,
              top: orbY - ORB.r - 12,
              width: (ORB.r + 12) * 2,
              height: (ORB.r + 12) * 2,
              transform: `rotate(${orbTilt}deg) scale(${orbScale * happyPop})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 36% 30%, #A8DBFF 0%, #5FB2F6 34%, #2F87EA 62%, #1D62CC 84%, rgba(29,98,204,0) 99%)",
                filter: "drop-shadow(0 0 46px rgba(64,144,240,0.45))",
              }}
            />
            <OrbFace size={268} happyP={happyP} />
          </div>
        )}

        {/* action chips minting + docking into orbit */}
        {CHIPS.map((c, i) => {
          const pop = spr(c.mint, SPRINGS.bouncy);
          if (pop <= 0) return null;
          const glide = iv(frame, [c.mint + 2, c.mint + 16], [0, 1]);
          const a = c.a0 + drift;
          const slot = {
            x: orbX + CHIP_R * Math.cos(a),
            y: orbY + CHIP_R * Math.sin(a),
          };
          const u = 1 - glide;
          const px =
            u * u * MINT.x + 2 * u * glide * c.ctrl.x + glide * glide * slot.x;
          const py =
            u * u * MINT.y +
            2 * u * glide * c.ctrl.y +
            glide * glide * slot.y +
            4 * Math.sin(frame / 12 + i * 2);
          return (
            <div
              key={c.label}
              style={{
                position: "absolute",
                left: px,
                top: py,
                transform: `translate(-50%, -50%) scale(${pop * (0.55 + 0.45 * glide)})`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                backgroundColor: "#FFFFFF",
                border: `1.5px solid ${NOTION.border}`,
                borderRadius: 999,
                padding: "14px 28px",
                boxShadow: "0 2px 6px rgba(15,15,15,0.05), 0 8px 26px rgba(15,15,15,0.08)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 36, fontWeight: 600, color: NOTION.text }}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
