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
import { FONT_SANS, SPRINGS, TV } from "./theme";

export const DURATION_IN_FRAMES = 270;

/* ---------------------------------------------------------------- world --- */
/* Final framing = full 1350x1350 world at z 0.8 → exactly the 1080 canvas.  */

const WORLD_W = 1350;
const WORLD_H = 1350;

const CARD_W = 300;
const CARD_H = 180;

// Junction node (real Topview icon) + Claude endpoint, world coords.
const NODE = { x: 675, y: 758, size: 148 };
const CLAUDE = { x: 675, y: 1040, size: 132 };

/* --------------------------------------------------------------- camera --- */

const ease = Easing.inOut(Easing.cubic);

// tight on Veo (tag swinging) | reveal all three | hold | pull to full system | hold
const KEY_T = [0, 34, 56, 100, 134, 268, 269];
const KEY_FX = [372, 384, 675, 675, 675, 675, 675];
const KEY_FY = [396, 402, 430, 430, 675, 675, 675];
const KEY_Z = [1.52, 1.47, 0.95, 0.95, 0.84, 0.84, 0.84];

/* ------------------------------------------------------------- timings --- */

const MERGE = { t0: 102, t1: 150 }; // cables bend into the node
const NODE_T = 112; // Topview node scales in
const RING_TS = [150, 160] as const; // merge-complete pulse rings
const GLIDE = { t0: 138, t1: 186 }; // cards settle into the neat row
const DRAW = { t0: 156, t1: 182 }; // node → Claude cable draws on
const CLAUDE_T = 172; // Claude chip pops
const PKT_IN_T = 164; // colored packets card → node
const PKT_OUT_T = 186; // packets node → Claude
const CARD_PULSE_TS = [196, 204, 212] as const; // "connected" edge pulses

/* ----------------------------------------------------------------- data --- */

type Pt = { x: number; y: number };

const MODELS = [
  {
    id: "veo",
    sep: { x: 360, y: 350, r: -3.5 },
    fin: { x: 345, y: 300 },
    price: "$249/mo",
    slant: -34,
    detach: 142,
    phase: 0.0,
  },
  {
    id: "sora",
    sep: { x: 990, y: 310, r: 3 },
    fin: { x: 1005, y: 300 },
    price: "$200/mo",
    slant: 42,
    detach: 150,
    phase: 2.1,
  },
  {
    id: "seedance",
    sep: { x: 780, y: 580, r: -2 },
    fin: { x: 675, y: 300 },
    price: "$99/mo",
    slant: 12,
    detach: 158,
    phase: 4.2,
  },
] as const;

/* ---------------------------------------------------------------- geom --- */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const qBezier = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};

/* ---------------------------------------------------------- composition --- */

export const TvP6Models: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const opt = {
    easing: ease,
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };
  const lin = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  };

  const fx = interpolate(frame, KEY_T, KEY_FX, opt);
  const fy = interpolate(frame, KEY_T, KEY_FY, opt);
  const z = interpolate(frame, KEY_T, KEY_Z, opt);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 30
  ) =>
    frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  /* ---- story progress ---- */
  const mergeP = interpolate(frame, [MERGE.t0, MERGE.t1], [0, 1], opt);
  const nodeIn = spr(NODE_T, SPRINGS.bouncy, 26);
  const claudeIn = spr(CLAUDE_T, SPRINGS.bouncy, 24);
  const drawP = interpolate(frame, [DRAW.t0, DRAW.t1], [0, 1], opt);
  const breath = frame < MERGE.t1 ? 0 : 0.5 + 0.5 * Math.sin(frame / 9);

  /* ---- card positions: scattered drift → neat row ---- */
  const cardPos = (i: number, f: number) => {
    const m = MODELS[i];
    const g = interpolate(f, [GLIDE.t0, GLIDE.t1], [0, 1], opt);
    const wob = 1 - g;
    return {
      x: lerp(m.sep.x, m.fin.x, g) + 8 * Math.sin(f / 17 + m.phase) * wob,
      y: lerp(m.sep.y, m.fin.y, g) + 6 * Math.sin(f / 13 + m.phase * 1.7) * wob,
      r: m.sep.r * wob + 1.2 * Math.sin(f / 21 + m.phase) * wob,
    };
  };
  const positions = MODELS.map((_, i) => cardPos(i, frame));

  /* ---- cables: three separate drops → one junction ---- */
  const cables = MODELS.map((m, i) => {
    const p = positions[i];
    const from: Pt = { x: p.x, y: p.y + CARD_H / 2 - 6 };
    const sepCtrl: Pt = { x: p.x + m.slant * 0.4, y: p.y + 430 };
    const sepTo: Pt = { x: p.x + m.slant, y: 1360 };
    const mCtrl: Pt = { x: (p.x + NODE.x) / 2, y: 630 };
    const mTo: Pt = { x: NODE.x, y: NODE.y - 6 };
    return {
      from,
      ctrl: { x: lerp(sepCtrl.x, mCtrl.x, mergeP), y: lerp(sepCtrl.y, mCtrl.y, mergeP) },
      to: { x: lerp(sepTo.x, mTo.x, mergeP), y: lerp(sepTo.y, mTo.y, mergeP) },
    };
  });

  /* ---- dangling price tags: swing → detach → fall + dissolve ---- */
  const tagPose = (i: number) => {
    const m = MODELS[i];
    const attachAt = (f: number) => {
      const p = cardPos(i, f);
      return { x: p.x + 62, y: p.y + CARD_H / 2 - 10 };
    };
    if (frame < m.detach) {
      return {
        a: attachAt(frame),
        rot: 8 * Math.sin(frame / 10 + m.phase),
        opacity: 1,
      };
    }
    const a0 = attachAt(m.detach);
    const t = frame - m.detach;
    return {
      a: {
        x: a0.x + Math.sign(m.slant) * 0.5 * t,
        y: a0.y + 0.22 * t * t,
      },
      rot: 8 * Math.sin(m.detach / 10 + m.phase) + Math.sign(m.slant) * 2.2 * t,
      opacity: 1 - interpolate(t, [4, 28], [0, 1], lin),
    };
  };

  /* ---- packet fields ---- */
  // Dim, slow "drain" packets while the lines are still separate.
  const dimPackets = MODELS.flatMap((m, i) => {
    const alpha = (1 - mergeP) * 0.55;
    if (alpha <= 0.01) return [];
    const u = ((frame * 0.006 + i / 3) % 1 + 1) % 1;
    const pos = qBezier(cables[i].from, cables[i].ctrl, cables[i].to, u);
    const endFade = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
    return [{ pos, col: "rgba(23,23,28,0.45)", size: 8, opacity: alpha * endFade, glow: "rgba(23,23,28,0.10)" }];
  });

  // Live packets: every model card → Topview node.
  const inPackets =
    frame < PKT_IN_T
      ? []
      : MODELS.flatMap((_m, i) => {
          const born = interpolate(frame, [PKT_IN_T, PKT_IN_T + 14], [0, 1], opt);
          return [0, 1].map((k) => {
            const u = (((frame - PKT_IN_T) * 0.013 + k / 2 + i * 0.17) % 1 + 1) % 1;
            const pos = qBezier(cables[i].from, cables[i].ctrl, cables[i].to, u);
            const endFade = u < 0.12 ? u / 0.12 : u > 0.88 ? (1 - u) / 0.12 : 1;
            return {
              pos,
              col: TV.purple,
              size: 11,
              opacity: 0.9 * born * endFade * mergeP,
              glow: "rgba(124,58,237,0.25)",
            };
          });
        });

  // Packets: Topview node → Claude.
  const outPackets =
    frame < PKT_OUT_T
      ? []
      : [0, 1].map((k) => {
          const born = interpolate(frame, [PKT_OUT_T, PKT_OUT_T + 14], [0, 1], opt);
          const u = (((frame - PKT_OUT_T) * 0.016 + k / 2) % 1 + 1) % 1;
          const pos = {
            x: NODE.x,
            y: lerp(NODE.y + 30, CLAUDE.y - 30, u),
          };
          const endFade = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
          return {
            pos,
            col: TV.purple,
            size: 13,
            opacity: 0.9 * born * endFade,
            glow: "rgba(124,58,237,0.25)",
          };
        });

  const packets = [...dimPackets, ...inPackets, ...outPackets];

  /* ---- card "connected" pulse during the settle ---- */
  const cardPulse = (i: number) => {
    const t0 = CARD_PULSE_TS[i];
    const p = interpolate(frame, [t0, t0 + 22], [0, 1], opt);
    return Math.sin(Math.PI * p);
  };

  /* ---- white card chrome (rydnel card language) ---- */
  const cardShell = (i: number): React.CSSProperties => {
    const pulse = cardPulse(i);
    return {
      position: "absolute",
      width: CARD_W,
      height: CARD_H,
      borderRadius: 22,
      backgroundColor: TV.panel,
      border:
        pulse > 0.02
          ? `1.5px solid rgba(124,58,237,${0.15 + 0.4 * pulse})`
          : `1.5px solid ${TV.border}`,
      boxShadow: `0 1px 2px rgba(15,15,15,0.04), 0 10px 28px rgba(15,15,15,0.07), 0 0 ${
        18 * pulse
      }px rgba(124,58,237,${0.18 * pulse})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
    };
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 46,
    fontWeight: 600,
    color: TV.text,
    letterSpacing: 0.3,
    lineHeight: 1,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: TV.bg, fontFamily: FONT_SANS }}>
      {/* ---------- world ---------- */}
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* soft violet bloom behind the node (subtle on white) */}
        {nodeIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: NODE.x - 240,
              top: NODE.y - 240,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: `radial-gradient(circle at center, rgba(124,58,237,${
                (0.07 + 0.03 * breath) * nodeIn
              }) 0%, rgba(124,58,237,0) 62%)`,
            }}
          />
        ) : null}

        {/* ---------- cables ---------- */}
        <svg
          width={WORLD_W}
          height={WORLD_H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {cables.map((c, i) => {
            const d = `M ${c.from.x} ${c.from.y} Q ${c.ctrl.x} ${c.ctrl.y} ${c.to.x} ${c.to.y}`;
            return (
              <React.Fragment key={i}>
                {/* dim separate line (dead gray wire) */}
                <path
                  d={d}
                  stroke="rgba(23,23,28,0.22)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  opacity={1 - 0.9 * mergeP}
                />
                {/* solid Topview purple once merged */}
                <path
                  d={d}
                  stroke={TV.purple}
                  strokeWidth={3.5}
                  fill="none"
                  strokeLinecap="round"
                  opacity={mergeP}
                />
              </React.Fragment>
            );
          })}

          {/* single output cable: node → Claude */}
          {drawP > 0 ? (
            <path
              d={`M ${NODE.x} ${NODE.y + 20} L ${NODE.x} ${CLAUDE.y - 10}`}
              stroke={TV.purple}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - drawP}
            />
          ) : null}
        </svg>

        {/* ---------- packets ---------- */}
        {packets.map((p, i) =>
          p.opacity > 0.01 ? (
            <div
              key={`pkt-${i}`}
              style={{
                position: "absolute",
                left: p.pos.x - p.size / 2,
                top: p.pos.y - p.size / 2,
                width: p.size,
                height: p.size,
                borderRadius: p.size,
                backgroundColor: p.col,
                opacity: p.opacity,
                boxShadow: `0 0 12px ${p.glow}`,
              }}
            />
          ) : null
        )}

        {/* ---------- price tags (under the cards) ---------- */}
        {MODELS.map((m, i) => {
          const t = tagPose(i);
          if (t.opacity <= 0.01) return null;
          return (
            <div
              key={`tag-${i}`}
              style={{
                position: "absolute",
                left: t.a.x,
                top: t.a.y,
                transform: `rotate(${t.rot}deg)`,
                transformOrigin: "0px 0px",
                opacity: t.opacity,
              }}
            >
              {/* string */}
              <div
                style={{
                  position: "absolute",
                  left: -1,
                  top: 0,
                  width: 2,
                  height: 32,
                  backgroundColor: "rgba(23,23,28,0.25)",
                }}
              />
              {/* tag chip — soft violet tint */}
              <div
                style={{
                  position: "absolute",
                  left: -88,
                  top: 32,
                  width: 176,
                  height: 54,
                  borderRadius: 13,
                  backgroundColor: "#EDE9FE",
                  border: "1.5px solid rgba(91,33,182,0.16)",
                  boxShadow: "0 6px 18px rgba(15,15,15,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    border: "2px solid rgba(91,33,182,0.35)",
                    flex: "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: "#5B21B6",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {m.price}
                </span>
              </div>
            </div>
          );
        })}

        {/* ---------- model cards ---------- */}
        {/* Veo */}
        <div
          style={{
            ...cardShell(0),
            left: positions[0].x - CARD_W / 2,
            top: positions[0].y - CARD_H / 2,
            transform: `rotate(${positions[0].r}deg)`,
          }}
        >
          <Img src={staticFile("logos/google.svg")} style={{ width: 46, height: 47 }} />
          <span style={nameStyle}>Veo</span>
        </div>

        {/* Sora */}
        <div
          style={{
            ...cardShell(1),
            left: positions[1].x - CARD_W / 2,
            top: positions[1].y - CARD_H / 2,
            transform: `rotate(${positions[1].r}deg)`,
          }}
        >
          {/* real OpenAI lockup cropped to its mark (leftmost square of the SVG) */}
          <Img
            src={staticFile("tools/openai.svg")}
            style={{
              width: 44,
              height: 44,
              objectFit: "cover",
              objectPosition: "left center",
              flex: "none",
            }}
          />
          <span style={nameStyle}>Sora</span>
        </div>

        {/* Seedance — text wordmark only */}
        <div
          style={{
            ...cardShell(2),
            left: positions[2].x - CARD_W / 2,
            top: positions[2].y - CARD_H / 2,
            transform: `rotate(${positions[2].r}deg)`,
          }}
        >
          <span style={{ ...nameStyle, fontSize: 42, letterSpacing: 0.8 }}>Seedance</span>
        </div>

        {/* ---------- merge pulse rings ---------- */}
        {RING_TS.map((t, i) => {
          const p = interpolate(frame, [t, t + 24], [0, 1], opt);
          if (p <= 0 || p >= 1) return null;
          const size = NODE.size * (0.9 + 1.6 * p);
          return (
            <div
              key={`ring-${i}`}
              style={{
                position: "absolute",
                left: NODE.x - size / 2,
                top: NODE.y - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                border: `3px solid rgba(124,58,237,${0.38 * (1 - p)})`,
              }}
            />
          );
        })}

        {/* ---------- Topview junction node (real icon) ---------- */}
        {nodeIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: NODE.x - NODE.size / 2,
              top: NODE.y - NODE.size / 2,
              width: NODE.size,
              height: NODE.size,
              borderRadius: 34,
              opacity: Math.min(1, nodeIn * 1.4),
              transform: `scale(${0.7 + 0.3 * nodeIn})`,
              boxShadow: `0 0 ${18 + 14 * breath}px rgba(124,58,237,${
                0.18 + 0.14 * breath
              }), 0 12px 30px rgba(15,15,15,0.14)`,
            }}
          >
            <Img
              src={staticFile("topview/topview-icon.webp")}
              style={{ width: "100%", height: "100%", borderRadius: 34, display: "block" }}
            />
          </div>
        ) : null}

        {/* ---------- Claude endpoint (real logo) ---------- */}
        {claudeIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: CLAUDE.x - CLAUDE.size / 2,
              top: CLAUDE.y - CLAUDE.size / 2,
              width: CLAUDE.size,
              height: CLAUDE.size,
              borderRadius: 30,
              backgroundColor: TV.panel,
              border: `1.5px solid ${TV.border}`,
              opacity: Math.min(1, claudeIn * 1.4),
              transform: `scale(${0.7 + 0.3 * claudeIn})`,
              boxShadow:
                "0 1px 2px rgba(15,15,15,0.04), 0 10px 28px rgba(15,15,15,0.09), 0 0 22px rgba(217,119,87,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img
              src={staticFile("openseo/logos/claude-color.svg")}
              style={{ width: 78, height: 78 }}
            />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
