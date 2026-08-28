import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const DURATION_IN_FRAMES = 215;

// Promptible "white / paper" style — Creatify orange accent
const COLORS = {
  paper: "#fbfbf9",
  ink: "#1B1720",
  muted: "#8B8594",
  line: "#ece8e3",
  orange: "#ff4f01",
  orangeDeep: "#d64200",
  green: "#16A34A",
  greenLite: "#22C55E",
  redInk: "#b4453a",
};

const CX = 540;
const LX = 296; // left column center
const RX = 784; // right column center

// -------------------------------------------------------------------------
// Paper background — soft orange glow + masked grid (Promptible signature)
// -------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(820px 780px at 50% 44%, rgba(255,79,1,0.09), rgba(255,79,1,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(27,23,32,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,23,32,0.028) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        WebkitMaskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(720px 720px at 50% 50%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// -------------------------------------------------------------------------
// Highlighter sweep behind a key word
// -------------------------------------------------------------------------
const Hl: React.FC<{
  children: React.ReactNode;
  progress: number;
  rot?: number;
}> = ({ children, progress, rot = -1.4 }) => (
  <span
    style={{
      position: "relative",
      whiteSpace: "nowrap",
      display: "inline-block",
      zIndex: 1,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: COLORS.orange,
        opacity: 0.24,
        zIndex: -1,
        transform: `rotate(${rot}deg) scaleX(${progress})`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 6,
      }}
    />
    {children}
  </span>
);

// -------------------------------------------------------------------------
// A single "ad creative" tile (skeleton) used in the winners' grid
// -------------------------------------------------------------------------
const HEADER_HUES = [
  "#ff7a3c",
  "#ff4f01",
  "#f0a020",
  "#e0603a",
  "#ff8f5a",
  "#d64200",
];

const AdTile: React.FC<{
  pop: number;
  hue: string;
  winner: boolean;
  glow: number;
}> = ({ pop, hue, winner, glow }) => {
  const scale = 0.6 + 0.4 * pop + (winner ? glow * 0.06 : 0);
  return (
    <div
      style={{
        width: 104,
        height: 78,
        transform: `scale(${scale})`,
        opacity: pop,
        borderRadius: 12,
        background: "#ffffff",
        border: `1.5px solid ${winner ? COLORS.greenLite : COLORS.line}`,
        boxShadow: winner
          ? `0 0 0 ${2 + glow * 4}px rgba(34,197,94,${0.1 + glow * 0.14}), 0 14px 30px rgba(22,163,74,0.20)`
          : "0 8px 18px rgba(27,23,32,0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 30,
          background: winner ? COLORS.greenLite : hue,
          opacity: winner ? 1 : 0.9,
        }}
      />
      <div style={{ padding: "9px 10px" }}>
        <div
          style={{
            height: 6,
            width: "82%",
            borderRadius: 3,
            background: "#e9e5e0",
          }}
        />
        <div
          style={{
            height: 6,
            width: "56%",
            borderRadius: 3,
            background: "#efece7",
            marginTop: 6,
          }}
        />
      </div>
      {winner && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: COLORS.greenLite,
            color: "#fff",
            fontSize: 15,
            fontWeight: 900,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 10px rgba(22,163,74,0.4)",
            opacity: glow,
            transform: `scale(${0.6 + 0.4 * glow})`,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
};

// content inset — 12% padding on top / left / right (background stays full-bleed)
const PAD = 0.12 * 1080; // 129.6px
const CONTENT_SCALE = (1080 - 2 * PAD) / 1080; // 0.76
const SHIFT_Y = 0.05 * 1080; // shift content down 5% (54px)

export const BrandsThatWin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // intro
  const introBlur = interpolate(frame, [0, 14], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker + headline
  const kicker = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, stiffness: 170 },
  });
  const line1 = spring({
    frame: frame - 9,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const line2 = spring({
    frame: frame - 13,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const hlSweep = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // panels
  const leftIn = spring({
    frame: frame - 56,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const rightIn = spring({
    frame: frame - 66,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const vs = spring({
    frame: frame - 78,
    fps,
    config: { damping: 11, stiffness: 170 },
  });

  // left column: slow spinner + day counter 1 -> 7
  const spin = (frame * 5.2) % 360;
  const day = Math.round(
    interpolate(frame, [74, 156], [1, 7], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const dayBar = interpolate(frame, [74, 156], [0.14, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // right column: 50 counter + winner glow
  const adsCount = Math.round(
    interpolate(frame, [84, 150], [0, 50], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const glow = interpolate(frame, [132, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // metrics
  const leftMetric = spring({
    frame: frame - 150,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const rightMetric = spring({
    frame: frame - 142,
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  // payoff
  const pay = spring({
    frame: frame - 168,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const paySweep = interpolate(frame, [184, 202], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // grid geometry (right column)
  const tileW = 104;
  const tileH = 78;
  const gapX = 16;
  const gapY = 14;
  const gridW = 3 * tileW + 2 * gapX;
  const gridH = 3 * tileH + 2 * gapY;
  const gridLeft = RX - gridW / 2;
  const gridTop = 548 - gridH / 2;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />

      <AbsoluteFill
        style={{
          opacity: introOp,
          filter: `blur(${introBlur}px)`,
          transform: `translate(${PAD}px, ${PAD + SHIFT_Y}px) scale(${CONTENT_SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        {/* ---------- KICKER ---------- */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.orangeDeep,
              padding: "8px 16px",
              border: "1.5px solid rgba(255,79,1,0.28)",
              borderRadius: 999,
              background: "rgba(255,79,1,0.05)",
              transform: `translateY(${(1 - kicker) * 14}px) scale(${0.9 + 0.1 * kicker})`,
              opacity: kicker,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.orange,
                boxShadow: "0 0 0 4px rgba(255,79,1,0.15)",
              }}
            />
            The real advantage
          </div>
        </div>

        {/* ---------- HEADLINE ---------- */}
        <div
          style={{
            position: "absolute",
            top: 156,
            left: 90,
            right: 90,
            textAlign: "center",
            fontSize: 54,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: COLORS.ink,
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - line1) * 18}px)`,
              opacity: line1,
            }}
          >
            The brands that win won&rsquo;t
          </div>
          <div
            style={{
              transform: `translateY(${(1 - line2) * 18}px)`,
              opacity: line2,
            }}
          >
            just make ads <Hl progress={hlSweep}>faster</Hl>.
          </div>
        </div>

        {/* ================= COLUMN PANELS ================= */}
        {/* LEFT — the old way */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 352,
            width: 452,
            height: 512,
            borderRadius: 26,
            background: "#f5f3f0",
            border: `1px solid ${COLORS.line}`,
            boxShadow: "0 20px 44px rgba(27,23,32,0.06)",
            opacity: leftIn,
            transform: `translateY(${(1 - leftIn) * 26}px)`,
          }}
        />
        {/* RIGHT — the winners */}
        <div
          style={{
            position: "absolute",
            left: 568,
            top: 352,
            width: 452,
            height: 512,
            borderRadius: 26,
            background: "rgba(255,79,1,0.045)",
            border: "1px solid rgba(255,79,1,0.22)",
            boxShadow: "0 22px 48px rgba(255,79,1,0.10)",
            opacity: rightIn,
            transform: `translateY(${(1 - rightIn) * 26}px)`,
          }}
        />

        {/* ---- column headers ---- */}
        <div
          style={{
            position: "absolute",
            top: 384,
            left: 60,
            width: 452,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: COLORS.muted,
            opacity: leftIn,
          }}
        >
          The old way
        </div>
        <div
          style={{
            position: "absolute",
            top: 384,
            left: 568,
            width: 452,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: COLORS.orangeDeep,
            opacity: rightIn,
          }}
        >
          The winners
        </div>

        {/* ---- LEFT body: single ad card, slow ---- */}
        <div
          style={{
            position: "absolute",
            left: LX,
            top: 548,
            width: 190,
            height: 244,
            transform: `translate(-50%,-50%) scale(${0.86 + 0.14 * leftIn})`,
            opacity: leftIn,
            borderRadius: 18,
            background: "#1B1720",
            border: "1px solid rgba(27,23,32,0.25)",
            boxShadow: "0 18px 38px rgba(27,23,32,0.20)",
            overflow: "hidden",
          }}
        >
          {/* spinner */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg
              width={58}
              height={58}
              viewBox="0 0 58 58"
              style={{ transform: `rotate(${spin}deg)` }}
            >
              <circle
                cx="29"
                cy="29"
                r="22"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="5"
              />
              <circle
                cx="29"
                cy="29"
                r="22"
                fill="none"
                stroke={COLORS.orange}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={138}
                strokeDashoffset={100}
              />
            </svg>
          </div>
          {/* day chip */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "5px 11px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            Day {day}
          </div>
          {/* slow progress */}
          <div
            style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}
          >
            <div
              style={{
                height: 7,
                borderRadius: 4,
                background: "rgba(255,255,255,0.14)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${dayBar * 100}%`,
                  background: COLORS.orange,
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.66)",
                textAlign: "center",
              }}
            >
              testing 1 ad
            </div>
          </div>
        </div>

        {/* ---- RIGHT body: grid of ad creatives ---- */}
        {Array.from({ length: 9 }).map((_, i) => {
          const c = i % 3;
          const r = Math.floor(i / 3);
          const pop = spring({
            frame: frame - (80 + i * 5),
            fps,
            config: { damping: 13, stiffness: 170 },
          });
          const winner = i === 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: gridLeft + c * (tileW + gapX),
                top: gridTop + r * (tileH + gapY),
                width: tileW,
                height: tileH,
              }}
            >
              <AdTile
                pop={pop}
                hue={HEADER_HUES[i % HEADER_HUES.length]}
                winner={winner}
                glow={winner ? glow : 0}
              />
            </div>
          );
        })}

        {/* ---- VS badge ---- */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: 548,
            width: 62,
            height: 62,
            transform: `translate(-50%,-50%) scale(${0.5 + 0.5 * vs})`,
            opacity: vs,
            borderRadius: "50%",
            background: "#fff",
            border: `2px solid ${COLORS.line}`,
            boxShadow: "0 10px 24px rgba(27,23,32,0.14)",
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 0.5,
            color: COLORS.ink,
          }}
        >
          vs
        </div>

        {/* ---- metric lines ---- */}
        {/* left metric */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 748,
            width: 452,
            textAlign: "center",
            opacity: leftMetric,
            transform: `translateY(${(1 - leftMetric) * 12}px)`,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: -1.4,
              color: COLORS.redInk,
            }}
          >
            7 days
          </div>
          <div
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.muted,
              marginTop: 2,
            }}
          >
            to learn what works
          </div>
        </div>
        {/* right metric */}
        <div
          style={{
            position: "absolute",
            left: 568,
            top: 748,
            width: 452,
            textAlign: "center",
            opacity: rightMetric,
            transform: `translateY(${(1 - rightMetric) * 12}px)`,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: -1.4,
              color: COLORS.green,
            }}
          >
            {adsCount} ads
            <span style={{ color: COLORS.muted, fontWeight: 700 }}> · </span>1
            night
          </div>
          <div
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.orangeDeep,
              marginTop: 2,
            }}
          >
            one proven winner
          </div>
        </div>

        {/* ---------- PAYOFF ---------- */}
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 918,
            textAlign: "center",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.12,
            color: COLORS.ink,
            transform: `translateY(${(1 - pay) * 14}px)`,
            opacity: pay,
          }}
        >
          Not a faster factory. A faster{" "}
          <Hl progress={paySweep} rot={-1.1}>
            feedback loop
          </Hl>
          .
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
