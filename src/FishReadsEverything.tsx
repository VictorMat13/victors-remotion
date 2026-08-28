import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 270;

// "What makes this different is what it's reading from. It answers out of my
//  entire knowledge base and knows everything about me and my business."
// Answer streams like any AI chat → camera pulls down → the brain core and a
// lattice of real business files light up in read-waves → rise back to the
// answer as its source citations glow.

const C = {
  bgEdge: "#0D1017",
  bgMid: "#1A1F2E",
  cream: "#EFE6D6",
  coreAmber: "#E8A15C",
  green: "#22C55E",
};

const DEPT = {
  marketing: "#A78BFA",
  operations: "#2DD4BF",
  intelligence: "#60A5FA",
  customer: "#F472B6",
  backoffice: "#FBBF24",
  sales: "#FB923C",
  deals: "#F87171",
};

const W = 1080;
const WORLD_H = 2600;

const CARD = { x: 120, y: 140, w: 840, h: 470 };
const CORE = { x: 540, y: 1060 };

const QUESTION = "what did we price the meridian retainer at?";
const ANSWER =
  "$4,500/mo. Locked on the Mar 12 call. Sarah approved the scope cut Mar 14.";
const CITES = ["calls/2026-03-12.md", "clients/meridian.md", "decisions.log"];

const TYPE_START = 8;
const TYPE_SPEED = 1.15;

type Chip = { label: string; color: string };
const CHIPS: Chip[] = [
  { label: "calls/2026-03-12.md", color: DEPT.deals },
  { label: "clients/meridian.md", color: DEPT.customer },
  { label: "decisions.log", color: DEPT.backoffice },
  { label: "proposals/meridian-v2.pdf", color: DEPT.sales },
  { label: "pricing-2026.xlsx", color: DEPT.backoffice },
  { label: "gmail/sarah-re-scope.eml", color: DEPT.deals },
  { label: "crm/pipeline.csv", color: DEPT.sales },
  { label: "reels/hooks-bank.md", color: DEPT.marketing },
  { label: "onboarding/flow-v3.md", color: DEPT.operations },
  { label: "competitors/q3-scan.md", color: DEPT.intelligence },
  { label: "briefs/lumen.md", color: DEPT.marketing },
  { label: "invoices/2026-06.pdf", color: DEPT.backoffice },
  { label: "notes/weekly-sync.md", color: DEPT.operations },
  { label: "metrics/mrr.csv", color: DEPT.backoffice },
  { label: "dms/ig-inbound.md", color: DEPT.marketing },
  { label: "team/roles.md", color: DEPT.operations },
  { label: "outreach/sequences.md", color: DEPT.sales },
  { label: "support/faq-v2.md", color: DEPT.customer },
  { label: "market/pricing-scan.md", color: DEPT.intelligence },
  { label: "retainers.md", color: DEPT.deals },
  { label: "content/calendar.md", color: DEPT.marketing },
  { label: "builds/client-ops.md", color: DEPT.operations },
  { label: "renewals/q3.md", color: DEPT.customer },
  { label: "books/2026-h1.xlsx", color: DEPT.backoffice },
  { label: "leads/warm-list.csv", color: DEPT.sales },
  { label: "people/champions.md", color: DEPT.intelligence },
];

const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rad = (deg: number) => (deg * Math.PI) / 180;
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// lattice layout: chips in loose rows below the core, connected to a center trunk
type PlacedChip = Chip & { x: number; y: number; w: number; row: number };
const placeChips = (): PlacedChip[] => {
  const out: PlacedChip[] = [];
  let y = 1310;
  let i = 0;
  let row = 0;
  while (i < CHIPS.length) {
    const perRow = 2 + (row % 2); // 2,3,2,3...
    const widths = CHIPS.slice(i, i + perRow).map(
      (c) => 46 + c.label.length * 12.6,
    );
    const gap = 28;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (perRow - 1);
    let x = 540 - total / 2 + (rnd(row * 7 + 3) - 0.5) * 50;
    x = Math.max(80, Math.min(x, 1000 - total));
    for (let k = 0; k < perRow && i < CHIPS.length; k++, i++) {
      out.push({
        ...CHIPS[i],
        x,
        y: y + (rnd(i * 13 + 5) - 0.5) * 18,
        w: widths[k],
        row,
      });
      x += widths[k] + gap;
    }
    y += 100;
    row++;
  }
  return out;
};

const PALETTE = [
  C.cream, C.cream, C.cream, C.cream,
  DEPT.marketing, DEPT.operations, DEPT.intelligence, DEPT.customer,
  DEPT.backoffice, DEPT.sales, DEPT.deals,
];

type Particle = { ang: number; r: number; size: number; color: string; speed: number; ph: number };
const buildParticles = (): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < 120; i++) {
    out.push({
      ang: rnd(i * 3 + 700) * 360,
      r: 10 + 130 * Math.pow(rnd(i * 5 + 701), 1.6),
      size: 2 + rnd(i * 7 + 702) * 4,
      color: PALETTE[Math.floor(rnd(i * 11 + 703) * PALETTE.length)],
      speed: 0.3 + rnd(i * 13 + 704) * 0.7,
      ph: rnd(i * 17 + 705) * Math.PI * 2,
    });
  }
  return out;
};

const STARS = Array.from({ length: 130 }, (_, i) => ({
  x: rnd(i * 3 + 400) * 1480 - 200, // bleed past world sides for sub-1 zoom framings
  y: rnd(i * 5 + 401) * WORLD_H,
  size: 1 + rnd(i * 7 + 402) * 1.6,
  ph: rnd(i * 11 + 403) * Math.PI * 2,
}));

const p = (f: number, a: number, b: number, e = Easing.out(Easing.quad)) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

export const FishReadsEverything: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = useMemo(buildParticles, []);
  const chips = useMemo(placeChips, []);
  const coreLinks = useMemo(
    () => particles.filter((pt, i) => pt.r > 40 && i % 4 === 0).slice(0, 24),
    [particles],
  );

  // ---- camera: single-segment moves, smootherstep, holds between ----
  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const camOpts = { easing: smoother, extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const T = [0, 48, 78, 108, 190, 218, 269];
  const fy = interpolate(frame, T, [375, 375, 1040, 1640, 1640, 480, 480], camOpts);
  const z = interpolate(frame, T, [1.1, 1.1, 1.0, 0.85, 0.85, 1.05, 1.05], camOpts);
  const fx = 540;

  // ---- answer typing ----
  const n = Math.min(ANSWER.length, Math.floor(Math.max(0, frame - TYPE_START) * TYPE_SPEED));
  const typed = ANSWER.slice(0, n);
  const typeDone = n >= ANSWER.length;

  // ---- read waves through the lattice ----
  const waveAt = (row: number) => 112 + row * 9;
  const chipLit = (c: PlacedChip, i: number) => {
    const at = waveAt(c.row) + rnd(i * 19 + 40) * 6;
    const pulse = p(frame, at, at + 8) * (1 - 0.55 * p(frame, at + 10, at + 26));
    const resurge = 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.09 + i * 1.9)) * p(frame, at + 20, at + 40);
    return Math.min(1, pulse + resurge);
  };

  // citations glow on the return beat
  const citeGlow = p(frame, 222, 240);
  const coreGlow = 0.4 + 0.35 * p(frame, 108, 150);
  const corePulse = 1 + 0.035 * Math.sin(frame * 0.16);

  // trunk from core down through the lattice
  const trunkTop = CORE.y + 140;
  const trunkBot = 2280;
  const trunkProg = p(frame, 84, 112, smoother);

  // thread from answer card down into the core
  const threadProg = p(frame, 52, 78, smoother);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgEdge, fontFamily: inter }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 1200px at 50% 42%, ${C.bgMid} 0%, ${C.bgEdge} 80%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 900px at 50% 42%, rgba(96,125,200,0.10), rgba(96,125,200,0) 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${540 - fy}px) scale(${z})`,
        }}
      >
        {STARS.map((st, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: st.x,
              top: st.y,
              width: st.size,
              height: st.size,
              borderRadius: "50%",
              backgroundColor: C.cream,
              opacity: 0.1 + 0.16 * (0.5 + 0.5 * Math.sin(frame * 0.06 + st.ph)),
            }}
          />
        ))}

        {/* ============ answer card ============ */}
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            borderRadius: 28,
            backgroundColor: "rgba(16,20,30,0.92)",
            border: "1.5px solid rgba(239,230,214,0.13)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            padding: "30px 36px 26px",
          }}
        >
          {/* question row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "rgba(239,230,214,0.08)",
                border: "1.5px solid rgba(239,230,214,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 700,
                color: hexA("#EFE6D6", 0.7),
                flexShrink: 0,
              }}
            >
              A
            </div>
            <span
              style={{
                fontFamily: mono,
                fontSize: 22,
                color: hexA("#EFE6D6", 0.6),
              }}
            >
              {QUESTION}
            </span>
          </div>

          {/* divider */}
          <div
            style={{
              height: 1.5,
              backgroundColor: "rgba(239,230,214,0.1)",
              margin: "22px 0",
            }}
          />

          {/* answer row */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: C.coreAmber,
                marginTop: 12,
                boxShadow: `0 0 ${9 + 5 * Math.sin(frame * 0.2)}px ${hexA(C.coreAmber, 0.7)}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 30,
                fontWeight: 600,
                lineHeight: 1.45,
                color: C.cream,
                minHeight: 132,
                display: "block",
              }}
            >
              {typed}
              <span
                style={{
                  opacity: typeDone ? (Math.floor(frame / 16) % 2 === 0 ? 0.9 : 0) : 0.9,
                  color: C.coreAmber,
                }}
              >
                ▍
              </span>
            </span>
          </div>

          {/* citation pills */}
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            {CITES.map((c1, i) => {
              const show = p(frame, 30 + i * 5, 42 + i * 5);
              const lit = citeGlow;
              return (
                <div
                  key={c1}
                  style={{
                    fontFamily: mono,
                    fontSize: 17,
                    padding: "7px 16px",
                    borderRadius: 999,
                    border: `1.5px solid ${lit > 0.2 ? hexA(C.coreAmber, 0.7) : "rgba(239,230,214,0.2)"}`,
                    color: lit > 0.2 ? C.cream : hexA("#EFE6D6", 0.55),
                    backgroundColor: lit > 0.2 ? hexA(C.coreAmber, 0.1) : "transparent",
                    boxShadow: lit > 0.2 ? `0 0 ${16 * lit}px ${hexA(C.coreAmber, 0.3)}` : "none",
                    opacity: show,
                    transform: `translateY(${(1 - show) * 8}px)`,
                  }}
                >
                  {c1}
                </div>
              );
            })}
          </div>
        </div>

        <svg
          width={W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        >
          {/* thread: answer card → core */}
          {threadProg > 0.001 ? (
            <>
              <line
                x1={540}
                y1={CARD.y + CARD.h}
                x2={540}
                y2={CARD.y + CARD.h + (CORE.y - 150 - CARD.y - CARD.h) * threadProg}
                stroke={hexA(C.coreAmber, 0.18)}
                strokeWidth={9}
                strokeLinecap="round"
              />
              <line
                x1={540}
                y1={CARD.y + CARD.h}
                x2={540}
                y2={CARD.y + CARD.h + (CORE.y - 150 - CARD.y - CARD.h) * threadProg}
                stroke={hexA(C.coreAmber, 0.8)}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </>
          ) : null}

          {/* packets: core → answer (the answer being fed) */}
          {frame >= 78
            ? [0, 1, 2].map((k) => {
                const period = 26;
                const t0 = 78 + k * 9;
                if (frame < t0) return null;
                const tt = ((frame - t0) % period) / period;
                const y = CORE.y - 150 - tt * (CORE.y - 150 - CARD.y - CARD.h + 40);
                const fade = Math.min(1, tt * 5, (1 - tt) * 3.5);
                return (
                  <g key={k} opacity={fade}>
                    <circle cx={540} cy={y} r={9} fill={hexA(C.coreAmber, 0.25)} />
                    <circle cx={540} cy={y} r={4} fill={C.coreAmber} />
                  </g>
                );
              })
            : null}

          {/* trunk: core → lattice */}
          {trunkProg > 0.001 ? (
            <line
              x1={540}
              y1={trunkTop}
              x2={540}
              y2={trunkTop + (trunkBot - trunkTop) * trunkProg}
              stroke={hexA("#EFE6D6", 0.16)}
              strokeWidth={1.6}
              strokeDasharray="2 8"
              strokeDashoffset={-frame * 0.5}
            />
          ) : null}

          {/* chip connectors + read packets */}
          {chips.map((c1, i) => {
            const lit = chipLit(c1, i);
            const cy = c1.y + 27;
            const cx = c1.x < 540 ? c1.x + c1.w : c1.x;
            const appear = p(frame, 88 + c1.row * 5, 102 + c1.row * 5);
            if (appear <= 0.001) return null;
            return (
              <g key={i} opacity={appear}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={540}
                  y2={cy}
                  stroke={lit > 0.1 ? hexA(c1.color, 0.25 + 0.35 * lit) : hexA("#EFE6D6", 0.12)}
                  strokeWidth={1.3}
                />
                {lit > 0.15 ? (
                  <circle
                    cx={cx + (540 - cx) * Math.min(1, (1 - lit) * 2.2)}
                    cy={cy}
                    r={3.5}
                    fill={c1.color}
                    opacity={Math.min(1, lit * 2)}
                  />
                ) : null}
              </g>
            );
          })}

          {/* trunk packets up to core during the read */}
          {frame >= 120
            ? [0, 1, 2, 3].map((k) => {
                const period = 30;
                const t0 = 120 + k * 8;
                if (frame < t0) return null;
                const tt = ((frame - t0) % period) / period;
                const y = trunkBot - tt * (trunkBot - trunkTop + 40);
                const fade = Math.min(1, tt * 5, (1 - tt) * 3.5);
                return (
                  <g key={k} opacity={fade * 0.9}>
                    <circle cx={540} cy={y} r={8} fill={hexA(C.coreAmber, 0.22)} />
                    <circle cx={540} cy={y} r={3.5} fill={C.coreAmber} />
                  </g>
                );
              })
            : null}

          {/* core spray lines */}
          {coreLinks.map((pt, i) => {
            const a = pt.ang + frame * 0.06 * pt.speed;
            const x = CORE.x + pt.r * Math.sin(rad(a));
            const y = CORE.y - pt.r * Math.cos(rad(a));
            return (
              <line
                key={i}
                x1={CORE.x + 4 * Math.sin(i)}
                y1={CORE.y + 4 * Math.cos(i)}
                x2={x}
                y2={y}
                stroke={hexA("#EFE6D6", 0.13)}
                strokeWidth={1}
              />
            );
          })}

          {/* core particles */}
          {particles.map((pt, i) => {
            const a = pt.ang + frame * 0.06 * pt.speed;
            const x = CORE.x + pt.r * Math.sin(rad(a));
            const y = CORE.y - pt.r * Math.cos(rad(a));
            const tw = 0.55 + 0.45 * Math.sin(frame * 0.13 + pt.ph);
            return (
              <circle key={i} cx={x} cy={y} r={pt.size} fill={hexA(pt.color, 0.85 * tw)} />
            );
          })}
          <circle cx={CORE.x} cy={CORE.y} r={7.5 * corePulse} fill={C.coreAmber} />
        </svg>

        {/* core glow */}
        <div
          style={{
            position: "absolute",
            left: CORE.x - 180,
            top: CORE.y - 180,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexA(C.coreAmber, 0.16)} 0%, rgba(96,125,200,0.08) 40%, rgba(0,0,0,0) 70%)`,
            opacity: coreGlow,
            transform: `scale(${corePulse})`,
          }}
        />

        {/* index stat under the core */}
        {(() => {
          const show = p(frame, 100, 116);
          return (
            <div
              style={{
                position: "absolute",
                left: 540 - 200,
                top: CORE.y + 175,
                width: 400,
                textAlign: "center",
                fontFamily: mono,
                fontSize: 19,
                letterSpacing: "0.08em",
                color: hexA("#EFE6D6", 0.5),
                opacity: show,
                transform: `translateY(${(1 - show) * 8}px)`,
              }}
            >
              1,284 files · 7 departments
            </div>
          );
        })()}

        {/* knowledge chips */}
        {chips.map((c1, i) => {
          const lit = chipLit(c1, i);
          const appear = spring({
            frame: Math.max(0, frame - 88 - c1.row * 5),
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          if (frame < 88 + c1.row * 5) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c1.x,
                top: c1.y,
                height: 54,
                padding: "0 22px",
                borderRadius: 27,
                border: `1.5px solid ${lit > 0.1 ? hexA(c1.color, 0.35 + 0.55 * lit) : "rgba(239,230,214,0.16)"}`,
                backgroundColor: lit > 0.1 ? hexA(c1.color, 0.06 + 0.06 * lit) : "rgba(16,20,30,0.85)",
                boxShadow: lit > 0.25 ? `0 0 ${22 * lit}px ${hexA(c1.color, 0.3 * lit)}` : "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: Math.min(1, appear * 1.3),
                transform: `scale(${0.85 + 0.15 * appear + 0.04 * lit})`,
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: lit > 0.1 ? c1.color : hexA(c1.color, 0.45),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 19,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  color: lit > 0.3 ? C.cream : hexA("#EFE6D6", 0.62),
                }}
              >
                {c1.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(760px 1200px at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,6,10,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
