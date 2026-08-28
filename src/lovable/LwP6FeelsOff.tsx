import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DRONEA, FONT_SANS, LOVABLE, SPRINGS, WISPR, WORLD } from "./theme";

export const DURATION_IN_FRAMES = 330;

// ============================================================================
// LwP6FeelsOff — 1080x1920 @ 30fps
// Beat (VO, never on screen outside the chat UI): "And if something feels off,
// I hold the same key again and say, 'Slow the animation down, darken this
// section, and move the button above the fold.' Done."
// One continuous vertical world: Dronea site-preview card on top (recreation
// of site-01-hero), Lovable follow-up chat box below (app-11 layout), fn key
// + Wispr Flowbar at the bottom.
//   f0–62    OPEN — tight on the preview, drone spinning at normal speed.
//   f62–126  THE KEY — camera drops to the chat box; fn presses and holds,
//            Flowbar pops, the edit sentence streams in dictation bursts.
//   f126–150 SEND — send press + ripple, message becomes a sent bubble,
//            camera rides back up to the preview.
//   f150–296 THREE EDITS, each with a progress tick at the card corner:
//            rotation slows (f154–190); specs band darkens (f216–240);
//            button slides up past the dashed fold line (f250–284).
//   f296–330 END HOLD — pull back to z=1, everything settled.
// ============================================================================

const clampOpt = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE = Easing.inOut(Easing.cubic);

// ---------------------------------------------------------------------------
// Camera — one shared keyframe timeline, hold → move → hold
// ---------------------------------------------------------------------------
const KEY_T = [0, 44, 62, 126, 150, 194, 212, 244, 262, 296, 316, 326, 330];
const KEY_FX = [330, 360, 540, 540, 520, 520, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [490, 505, 1445, 1445, 640, 640, 770, 770, 790, 790, 830, 830, 831];
const KEY_Z = [1.75, 1.68, 1.32, 1.32, 1.22, 1.22, 1.18, 1.18, 1.2, 1.2, 1.0, 1.0, 1.001];

// ---------------------------------------------------------------------------
// Dictation — the edit sentence streams into the follow-up box in bursts.
// This text appears ONLY inside the chat-input UI mock (genuine UI text).
// ---------------------------------------------------------------------------
const CHUNKS = [
  { t: 74, s: "Slow the animation down," },
  { t: 88, s: " darken this section," },
  { t: 102, s: " and move the button" },
  { t: 112, s: " above the fold." },
] as const;
const SENTENCE = CHUNKS.map((c) => c.s).join("");

const dictatedText = (frame: number) => {
  let out = "";
  for (const c of CHUNKS) {
    if (frame < c.t) break;
    out += c.s.slice(0, Math.min(c.s.length, Math.floor((frame - c.t + 1) * 7)));
  }
  return out;
};

// ---------------------------------------------------------------------------
// Drone rotation — angular velocity ramps down during edit 1 (f154–190).
// Closed-form phase integral keeps motion continuous; constants chosen so the
// end hold sits near a wide (face-on) pose.
// ---------------------------------------------------------------------------
const W0 = 0.13; // normal spin, rad/frame
const W1 = 0.022; // slowed spin
const TH0 = -0.33;
const SLOW_T1 = 154;
const SLOW_T2 = 190;

const droneTheta = (f: number) => {
  if (f <= SLOW_T1) return TH0 + W0 * f;
  const base = TH0 + W0 * SLOW_T1;
  if (f <= SLOW_T2) {
    const u = f - SLOW_T1;
    return base + W0 * u - ((W0 - W1) * u * u) / (2 * (SLOW_T2 - SLOW_T1));
  }
  return base + ((W0 + W1) / 2) * (SLOW_T2 - SLOW_T1) + W1 * (f - SLOW_T2);
};

const Drone: React.FC = () => {
  const frame = useCurrentFrame();
  const th = droneTheta(frame);
  const c = Math.cos(th);
  const sx = (c >= 0 ? 1 : -1) * Math.max(0.1, Math.abs(c));
  const rz = 4 * Math.sin(th * 0.9 + 1);
  const bob = 6 * Math.sin(frame * 0.03);
  const shadowRx = 62 + 108 * Math.abs(sx);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 300 - shadowRx,
          top: 636,
          width: shadowRx * 2,
          height: 26,
          borderRadius: "50%",
          backgroundColor: "rgba(20, 18, 12, 0.13)",
          filter: "blur(7px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 405 + bob,
          width: 380,
          height: 190,
          transform: `rotate(${rz}deg) scaleX(${sx})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg width={380} height={190} viewBox="0 0 400 200">
          <path
            d="M200 52 L388 104 L382 126 L252 136 L228 152 L172 152 L148 136 L18 126 L12 104 Z"
            fill="#161616"
          />
          <path d="M200 52 L388 104 L200 120 L12 104 Z" fill="#262626" />
          <path d="M200 60 L254 112 L200 132 L146 112 Z" fill="#333333" />
          <path d="M52 72 L66 72 L61 114 L47 114 Z" fill="#0D0D0D" />
          <path d="M334 72 L348 72 L353 114 L339 114 Z" fill="#0D0D0D" />
        </svg>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Preview card — Dronea hero recreation (nav, eyebrow, headline, para bars)
// ---------------------------------------------------------------------------
const PreviewCard: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: 54,
        top: 200,
        width: 972,
        height: 920,
        backgroundColor: DRONEA.paper,
        borderRadius: 24,
        border: `1px solid ${WORLD.border}`,
        boxShadow: WORLD.shadow,
      }}
    />
    {/* nav — brand left, skeleton links right */}
    <div
      style={{
        position: "absolute",
        left: 94,
        top: 230,
        display: "flex",
        alignItems: "center",
        gap: 11,
        fontFamily: FONT_SANS,
        color: DRONEA.ink,
      }}
    >
      <svg width={18} height={18} viewBox="0 0 18 18">
        <path
          d="M2 2 L16 16 M16 2 L2 16"
          stroke="#111111"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>
        {DRONEA.brand}
      </span>
    </div>
    <div style={{ position: "absolute", left: 500, top: 242, display: "flex", gap: 18 }}>
      {[64, 64, 80, 52].map((w, i) => (
        <div
          key={i}
          style={{ width: w, height: 10, borderRadius: 5, backgroundColor: "#CFCBC1" }}
        />
      ))}
    </div>
    {/* eyebrow */}
    <div
      style={{
        position: "absolute",
        left: 560,
        top: 306,
        fontFamily: FONT_SANS,
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 3.2,
        color: DRONEA.gray,
      }}
    >
      RECONNAISSANCE AIRFRAME
    </div>
    {/* headline — real site strings, (ISR) in gray */}
    <div
      style={{
        position: "absolute",
        left: 560,
        top: 338,
        width: 440,
        fontFamily: FONT_SANS,
        fontSize: 64,
        fontWeight: 800,
        lineHeight: 1.06,
        letterSpacing: -1.5,
        color: DRONEA.ink,
      }}
    >
      {DRONEA.headlineA[0]}
      {DRONEA.headlineA[1]}
      <br />
      <span style={{ color: DRONEA.gray }}>(ISR)</span> Drone
      <br />
      Concept
    </div>
    {/* paragraph bars */}
    <div
      style={{
        position: "absolute",
        left: 560,
        top: 578,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {[
        [400, "#D6D3CA"],
        [356, "#DAD7CE"],
        [262, "#DEDBD2"],
      ].map(([w, col], i) => (
        <div
          key={i}
          style={{
            width: w as number,
            height: 12,
            borderRadius: 6,
            backgroundColor: col as string,
          }}
        />
      ))}
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Dashed fold line — flashes as the button crosses it (edit 3)
// ---------------------------------------------------------------------------
const FoldLine: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [262, 268, 278], [0, 1, 0], clampOpt);
  return (
    <div style={{ position: "absolute", left: 78, top: 758, width: 924, height: 2 }}>
      <div style={{ borderTop: "2px dashed #C7C3B9", opacity: 0.9 }} />
      {flash > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 924,
            borderTop: `2px dashed ${LOVABLE.accent}`,
            opacity: flash,
            filter: "drop-shadow(0 0 7px rgba(37, 99, 235, 0.9))",
          }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Specs band below the fold — darkens with a left→right sweep (edit 2)
// ---------------------------------------------------------------------------
const SPECS_LABELS = [
  "EXTENDED FLIGHT RANGE",
  "ADVANCED ISR CAMERA",
  "STEALTH AIRFRAME",
] as const;
const TILE_X = [120, 410, 700] as const;

const SpecsBand: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [216, 242], [0, 1], { ...clampOpt, easing: EASE });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 782,
          width: 924,
          height: 236,
          borderRadius: 18,
          backgroundColor: "#E7E5DE",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${sweep * 100}%`,
            backgroundColor: "#17181C",
          }}
        />
      </div>
      {SPECS_LABELS.map((label, i) => {
        const p = interpolate(frame, [218 + i * 7, 231 + i * 7], [0, 1], clampOpt);
        const tileBg = interpolateColors(p, [0, 1], ["#F2F0EA", "#22242B"]);
        const tileBorder = interpolateColors(p, [0, 1], ["#E1DED6", "#31343D"]);
        const labelCol = interpolateColors(p, [0, 1], ["#8F8C86", "#D3D7DF"]);
        const barCol = interpolateColors(p, [0, 1], ["#DEDBD2", "#8E95A3"]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: TILE_X[i],
              top: 810,
              width: 260,
              height: 180,
              borderRadius: 14,
              backgroundColor: tileBg,
              border: `1px solid ${tileBorder}`,
              padding: "22px 20px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 1.8,
                color: labelCol,
                lineHeight: 1.5,
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 18,
                width: 196,
                height: 9,
                borderRadius: 5,
                backgroundColor: barCol,
                opacity: 0.85,
              }}
            />
            <div
              style={{
                marginTop: 12,
                width: 148,
                height: 9,
                borderRadius: 5,
                backgroundColor: barCol,
                opacity: 0.6,
              }}
            />
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Black pill CTA — starts below the fold, slides up into the hero (edit 3)
// ---------------------------------------------------------------------------
const HeroButton: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [250, 278], [0, 1], { ...clampOpt, easing: EASE });
  const x = 120 + (560 - 120) * slide;
  const y = 1032 + (660 - 1032) * slide;
  const lift = Math.sin(Math.PI * slide);
  const settlePulse = interpolate(frame, [278, 284, 292], [1, 1.045, 1], clampOpt);
  const scale = (1 + 0.05 * lift) * settlePulse;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 320,
        height: 64,
        borderRadius: 32,
        backgroundColor: LOVABLE.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 26,
        paddingRight: 10,
        transform: `scale(${scale})`,
        boxShadow: `0 ${10 + 18 * lift}px ${24 + 26 * lift}px rgba(20, 18, 12, ${
          0.18 + 0.2 * lift
        }), 0 0 0 ${3 * lift}px rgba(247, 246, 243, 0.9)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: 22,
          fontWeight: 600,
          color: "#FFFFFF",
          whiteSpace: "nowrap",
        }}
      >
        {DRONEA.cta}
      </span>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 20 20">
          <path
            d="M3 10 H16 M11 4.5 L16.5 10 L11 15.5"
            stroke="#111111"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress tick — small chip at the card's top-right corner, one per edit
// ---------------------------------------------------------------------------
const EDITS = [
  { start: 154, end: 190 },
  { start: 216, end: 240 },
  { start: 250, end: 284 },
] as const;

const ProgressTick: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = EDITS.find((e) => frame >= e.start - 8 && frame < e.end + 14);
  if (!active) return null;
  const pop = spring({
    frame: frame - (active.start - 8),
    fps,
    config: SPRINGS.snappy,
    durationInFrames: 16,
  });
  const p = interpolate(frame, [active.start, active.end], [0, 1], {
    ...clampOpt,
    easing: Easing.inOut(Easing.quad),
  });
  const done = p >= 1;
  const checkS = done
    ? spring({ frame: frame - active.end, fps, config: SPRINGS.snappy, durationInFrames: 14 })
    : 0;
  const out = interpolate(frame, [active.end + 8, active.end + 14], [1, 0], clampOpt);
  const R = 17;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        position: "absolute",
        left: 880 - 26,
        top: 246 - 26,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFFFFF",
        border: `1px solid ${WORLD.border}`,
        boxShadow: WORLD.shadowSoft,
        transform: `scale(${pop})`,
        opacity: out,
      }}
    >
      <svg width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", inset: 0 }}>
        <circle cx={26} cy={26} r={R} stroke="#EAE8E2" strokeWidth={3.5} fill="none" />
        <circle
          cx={26}
          cy={26}
          r={R}
          stroke={done ? "#22C55E" : LOVABLE.accent}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 26 26)"
        />
        {done && (
          <g transform={`translate(26 26) scale(${checkS})`}>
            <path
              d="M-7 0.5 L-2 5.5 L7.5 -5"
              stroke="#22C55E"
              strokeWidth={3.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sent chat bubble — the message after send (chat UI, right-aligned)
// ---------------------------------------------------------------------------
const SentBubble: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 128) return null;
  const s = spring({ frame: frame - 128, fps, config: SPRINGS.snappy, durationInFrames: 20 });
  return (
    <div
      style={{
        position: "absolute",
        left: 292,
        top: 1130,
        width: 560,
        borderRadius: 20,
        borderBottomRightRadius: 8,
        backgroundColor: "#F3F1EB",
        border: `1px solid ${WORLD.border}`,
        padding: "20px 24px",
        opacity: Math.min(1, s * 1.4),
        transform: `translateY(${(1 - s) * 16}px) scale(${0.94 + 0.06 * s})`,
        fontFamily: FONT_SANS,
        fontSize: 23,
        lineHeight: 1.45,
        color: LOVABLE.text,
      }}
    >
      {SENTENCE}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Follow-up chat box — recreation of the real editor input (app-11)
// ---------------------------------------------------------------------------
const ChatBox: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = dictatedText(frame);
  const typedOp = interpolate(frame, [124, 130], [1, 0], clampOpt);
  const placeholderOp =
    frame < 74
      ? interpolate(frame, [68, 73], [1, 0], clampOpt)
      : interpolate(frame, [134, 142], [0, 1], clampOpt);
  const caretVisible = frame >= 66 && frame < 124 && Math.floor(frame / 10) % 2 === 0;
  const hasText = typed.length > 0 && frame < 126;
  const sendPress = interpolate(frame, [122, 125, 130], [1, 0.86, 1], clampOpt);
  const rippleP = interpolate(frame, [124, 142], [0, 1], {
    ...clampOpt,
    easing: Easing.out(Easing.cubic),
  });
  const rippleR = 28 + 42 * rippleP;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 1290,
          width: 720,
          height: 265,
          borderRadius: 28,
          backgroundColor: LOVABLE.ui,
          border: `1px solid ${LOVABLE.uiBorder}`,
          boxShadow: WORLD.shadowSoft,
        }}
      />
      {/* text area */}
      <div
        style={{
          position: "absolute",
          left: 228,
          top: 1324,
          width: 624,
          fontFamily: FONT_SANS,
          fontSize: 34,
          lineHeight: 1.42,
          color: LOVABLE.text,
        }}
      >
        <span style={{ position: "absolute", left: 0, top: 0, color: WORLD.faint, opacity: placeholderOp }}>
          {LOVABLE.strings.followUp}
        </span>
        <span style={{ opacity: typedOp }}>
          {typed}
          {caretVisible && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 34,
                transform: "translateY(5px)",
                backgroundColor: LOVABLE.text,
                marginLeft: 2,
              }}
            />
          )}
        </span>
      </div>
      {/* plus */}
      <div
        style={{
          position: "absolute",
          left: 228,
          top: 1483,
          width: 46,
          height: 46,
          borderRadius: 23,
          border: "1.5px solid #E3E0D8",
        }}
      >
        <svg width={46} height={46} viewBox="0 0 46 46" style={{ position: "absolute", inset: -1.5 }}>
          <path d="M23 14 V32 M14 23 H32" stroke="#6B675F" strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      </div>
      {/* Build + chevron */}
      <div
        style={{
          position: "absolute",
          left: 578,
          top: 1492,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT_SANS,
          fontSize: 26,
          fontWeight: 500,
          color: "#6B675F",
        }}
      >
        {LOVABLE.strings.build}
        <svg width={16} height={16} viewBox="0 0 16 16">
          <path
            d="M3 6 L8 11 L13 6"
            stroke="#6B675F"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* mic */}
      <svg width={30} height={30} viewBox="0 0 24 24" style={{ position: "absolute", left: 704, top: 1491 }}>
        <rect x={9} y={3} width={6} height={11} rx={3} stroke="#6B675F" strokeWidth={1.8} fill="none" />
        <path
          d="M5.5 11 A6.5 6.5 0 0 0 18.5 11 M12 17.5 V21 M8.5 21 H15.5"
          stroke="#6B675F"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {/* send */}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 1480,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: hasText ? LOVABLE.black : "#A6A39B",
          transform: `scale(${sendPress})`,
        }}
      >
        <svg width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", inset: 0 }}>
          <path
            d="M26 36 V17 M17.5 25.5 L26 17 L34.5 25.5"
            stroke="#FFFFFF"
            strokeWidth={3.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* send ripple */}
      {frame >= 124 && rippleP < 1 && (
        <div
          style={{
            position: "absolute",
            left: 826 - rippleR,
            top: 1506 - rippleR,
            width: rippleR * 2,
            height: rippleR * 2,
            borderRadius: "50%",
            border: `2.5px solid rgba(37, 99, 235, ${0.45 * (1 - rippleP)})`,
          }}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// fn keycap — presses at f64, holds through dictation, releases after send
// ---------------------------------------------------------------------------
const FnKey: React.FC = () => {
  const frame = useCurrentFrame();
  const groupOp = interpolate(frame, [138, 150], [1, 0], clampOpt);
  if (groupOp <= 0.004) return null;
  const pressP =
    interpolate(frame, [64, 67], [0, 1], clampOpt) *
    interpolate(frame, [124, 128], [1, 0], clampOpt);
  const glowP =
    interpolate(frame, [64, 72], [0, 1], clampOpt) *
    interpolate(frame, [124, 134], [1, 0], clampOpt);
  const glowOp = glowP * (0.42 + 0.16 * Math.sin(frame * 0.11));
  const ringScale = 1 + 0.018 * Math.sin(frame * 0.11);
  const KX = 230;
  const KY = 1700;
  const S = 104;
  return (
    <div style={{ opacity: groupOp }}>
      {/* soft lavender halo */}
      <div
        style={{
          position: "absolute",
          left: KX - 130,
          top: KY - 130,
          width: 260,
          height: 260,
          borderRadius: 130,
          background: `radial-gradient(circle, ${WISPR.lavender} 0%, rgba(239,225,253,0) 65%)`,
          opacity: glowOp,
        }}
      />
      {/* held ring */}
      {glowP > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: KX - S / 2 - 10,
            top: KY - S / 2 - 10,
            width: S + 20,
            height: S + 20,
            borderRadius: 32,
            border: `2px solid ${WISPR.lavenderBorder}`,
            opacity: 0.55 * glowP,
            transform: `scale(${ringScale})`,
          }}
        />
      )}
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: KX - 48,
          top: KY + S / 2 - 4,
          width: 96,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "rgba(20, 18, 12, 0.10)",
          filter: "blur(6px)",
        }}
      />
      {/* the key */}
      <div
        style={{
          position: "absolute",
          left: KX - S / 2,
          top: KY - S / 2,
          width: S,
          height: S,
          transform: `scale(${1 - 0.035 * pressP})`,
          borderRadius: 24,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F3F1EC 100%)",
          border: "1.5px solid #E0DDD5",
          boxShadow: `inset 0 ${2 + 2 * pressP}px ${5 + 3 * pressP}px rgba(20, 18, 12, ${
            0.06 + 0.05 * pressP
          }), 0 ${5 - 2 * pressP}px ${12 - 4 * pressP}px rgba(20, 18, 12, 0.08)`,
        }}
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 22 22"
          style={{ position: "absolute", left: 12, top: 12 }}
        >
          <circle cx={11} cy={11} r={8} stroke="#8A867E" strokeWidth={1.6} fill="none" />
          <ellipse cx={11} cy={11} rx={3.6} ry={8} stroke="#8A867E" strokeWidth={1.4} fill="none" />
          <path d="M3 11 H19" stroke="#8A867E" strokeWidth={1.4} />
        </svg>
        <div
          style={{
            position: "absolute",
            right: 13,
            bottom: 9,
            fontFamily: FONT_SANS,
            fontSize: 24,
            fontWeight: 500,
            color: "#6B675F",
            lineHeight: 1,
          }}
        >
          fn
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Wispr Flowbar — dark pill, cream ticks dancing while the sentence streams
// ---------------------------------------------------------------------------
const N_BARS = 15;

const DictationPill: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 68) return null;
  const outOp = interpolate(frame, [124, 136], [1, 0], clampOpt);
  if (outOp <= 0.004) return null;
  const pop = spring({ frame: frame - 68, fps, config: SPRINGS.snappy, durationInFrames: 18 });
  const outScale = interpolate(frame, [124, 136], [1, 0.9], clampOpt);
  const bob = 3 * Math.sin(frame * 0.05);

  const speech =
    frame < 74
      ? 0.3
      : frame <= 118
        ? 1
        : interpolate(frame, [118, 124], [1, 0.3], clampOpt);
  let boost = 0;
  for (const c of CHUNKS) {
    const dt = frame - (c.t - 3);
    if (dt >= 0 && dt <= 16) boost = Math.max(boost, Math.sin((Math.PI * dt) / 16));
  }

  const bars = Array.from({ length: N_BARS }, (_, i) => {
    const centerEnv =
      0.5 + 0.5 * (1 - Math.pow((i - (N_BARS - 1) / 2) / ((N_BARS - 1) / 2), 2));
    const fast = Math.abs(Math.sin(0.55 * i + frame * 0.3));
    const slow = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.047 + i * 0.23));
    const h = 7 + 34 * fast * slow * centerEnv * speech * (1 + 0.5 * boost);
    return Math.min(h, 50);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 300,
        top: 1660,
        width: 600,
        height: 80,
        transform: `translateY(${bob + (1 - pop) * 12}px) scale(${pop * outScale})`,
        opacity: Math.min(1, pop * 1.5) * outOp,
        borderRadius: 40,
        backgroundColor: WISPR.barBg,
        border: `1.5px solid ${WISPR.barStroke}`,
        boxShadow: "0 16px 36px rgba(20, 18, 12, 0.20)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 15,
        paddingRight: 24,
      }}
    >
      {/* gray dismiss circle from the real Flowbar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "#71716E",
          flexShrink: 0,
          marginRight: 14,
          position: "relative",
        }}
      >
        <svg width={30} height={30} viewBox="0 0 32 32" style={{ position: "absolute", inset: 0 }}>
          <path
            d="M12 12 L20 20 M20 12 L12 20"
            stroke="#FCFCFB"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{ width: 6, height: h, borderRadius: 3, backgroundColor: "#FFFFEB" }}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------
export const LwP6FeelsOff: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, { easing: EASE, ...clampOpt });
  const fy = interpolate(frame, KEY_T, KEY_FY, { easing: EASE, ...clampOpt });
  const z = interpolate(frame, KEY_T, KEY_Z, { easing: EASE, ...clampOpt });

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      <div
        style={{
          position: "absolute",
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <PreviewCard />
        <Drone />
        <SpecsBand />
        <FoldLine />
        <HeroButton />
        <ProgressTick />
        <SentBubble />
        <ChatBox />
        <FnKey />
        <DictationPill />
      </div>
    </AbsoluteFill>
  );
};
