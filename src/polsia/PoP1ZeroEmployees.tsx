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
import { loadFont as loadSerif } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import {
  WORLD,
  POLSIA,
  STRINGS,
  LIVE,
  FACES,
  FONT_SERIF,
  FONT_MONO,
  SPRINGS,
} from "./theme";

loadSerif();
loadMono();

export const DURATION_IN_FRAMES = 280;

// ---------------------------------------------------------------------------
// World geometry — one continuous scene, camera travels left → right.
//   ACT 1  the experience card      x ≈ -1500 … -880
//   ACT 2  the jump (icon → Polsia) x ≈  -600 …   330
//   ACT 3  the payoff panel         x ≈   505 …  1495   (geometry unchanged)
// ---------------------------------------------------------------------------
const VIEW = 1080;
const WORLD_W = 2000;
const WORLD_H = 1700;

// --- ACT 3 (approved payoff geometry — do not move) ---
const CARD_X = 690;
const CARD_W = 620;
const CARD_Y = 458;
const STRIP_H = 46;
const STRIP_Y = CARD_Y - STRIP_H - 12; // 400

// --- ACT 1: the experience card ---
const EXP_X = -1500;
const EXP_Y = 300;
const EXP_W = 620;
const EXP_H = 390;
const EXP_PAD = 46;
const AV_D = 168; // circular photo avatar diameter
const AV_X = EXP_X + EXP_PAD; // -1454
const AV_Y = EXP_Y + 38; // 338
const AV_CY = AV_Y + AV_D / 2; // 422
const LEAD_X0 = AV_X + AV_D + 22; // -1264
const UCHIP_W = 214;
const UCHIP_H = 76;
const UCHIP_X = EXP_X + EXP_W - EXP_PAD - UCHIP_W; // -1140
const UCHIP_Y = AV_CY - UCHIP_H / 2; // 384
const RULE_Y = EXP_Y + 38 + AV_D + 36; // 542
const PIP_Y = RULE_Y + 64; // 606
const PIP_X0 = EXP_X + 60; // -1440
const PIP_X1 = EXP_X + EXP_W - 60; // -940
const PIP_GAP = (PIP_X1 - PIP_X0) / 4; // 125
const PIP_R = 17;

// --- ACT 2: the jump ---
const MYS_CX = -360;
const MYS_CY = 640;
const MYS_R = 106;
// Connector 1: a leader from the direction of the experience card into the
// mystery icon. Both ends sit inside the 5% safe band at the ACT 2 framing.
const C1_A = { x: -610, y: 428 };
const C1_B = { x: -443, y: 573 };
const C1_LEN = Math.hypot(C1_B.x - C1_A.x, C1_B.y - C1_A.y);
const C2_P0 = { x: MYS_CX, y: MYS_CY + MYS_R + 6 }; // -440, 752
const C2_P1 = { x: MYS_CX, y: 1080 };
const C2_P2 = { x: -172, y: 1080 };
const C2_SEG1 = C2_P1.y - C2_P0.y; // 328
const C2_SEG2 = C2_P2.x - C2_P1.x; // 328
const C2_TOTAL = C2_SEG1 + C2_SEG2;
const PCHIP_X = -160;
const PCHIP_Y = 1018;
const PCHIP_W = 280;
const PCHIP_H = 124;
const MASCOT_X = 152;
const MASCOT_Y = 1026;

const ease = Easing.inOut(Easing.cubic);

// Camera: ACT 1 tight hold (drift) → travel 24f → ACT 2 hold (drift) →
// travel 24f → ACT 3 reveal hold → push into the 0 → 26f end hold.
const KEY_T = [0, 72, 96, 176, 200, 236, 254, 280];
const KEY_FX = [-1190, -1183, -174, -171, 1000, 1000, 1042, 1043];
const KEY_FY = [495, 499, 786, 788, 745, 745, 787, 788];
const KEY_Z = [1.3, 1.315, 1.02, 1.022, 0.95, 0.95, 1.105, 1.11];

// ---------------------------------------------------------------------------
// Sparkline geometry (deterministic polyline + manual dash-draw)
// ---------------------------------------------------------------------------
const SPARK_W = 540;
const SPARK_H = 62;
const SPARK_VALS = [
  0.1, 0.17, 0.13, 0.25, 0.31, 0.26, 0.39, 0.46, 0.42, 0.56, 0.63, 0.58, 0.73,
  0.84, 0.96,
];
const SPARK_PTS = SPARK_VALS.map((v, i) => ({
  x: (i * SPARK_W) / (SPARK_VALS.length - 1),
  y: SPARK_H - 5 - v * (SPARK_H - 12),
}));
const SPARK_D = SPARK_PTS.map(
  (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
).join(" ");
const SPARK_SEGS = SPARK_PTS.slice(1).map((p, i) =>
  Math.hypot(p.x - SPARK_PTS[i].x, p.y - SPARK_PTS[i].y),
);
const SPARK_LEN = SPARK_SEGS.reduce((a, b) => a + b, 0);

const sparkPointAt = (len: number) => {
  let remaining = Math.max(0, Math.min(len, SPARK_LEN));
  for (let i = 0; i < SPARK_SEGS.length; i++) {
    if (remaining <= SPARK_SEGS[i]) {
      const t = SPARK_SEGS[i] === 0 ? 0 : remaining / SPARK_SEGS[i];
      return {
        x: SPARK_PTS[i].x + (SPARK_PTS[i + 1].x - SPARK_PTS[i].x) * t,
        y: SPARK_PTS[i].y + (SPARK_PTS[i + 1].y - SPARK_PTS[i].y) * t,
      };
    }
    remaining -= SPARK_SEGS[i];
  }
  return SPARK_PTS[SPARK_PTS.length - 1];
};

// ---------------------------------------------------------------------------
// Fixed-width digit rendering — stable ticking regardless of serif metrics.
// ---------------------------------------------------------------------------
const TickerDigits: React.FC<{ text: string; fontSize: number }> = ({
  text,
  fontSize,
}) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: FONT_SERIF,
        fontSize,
        lineHeight: 1,
        color: POLSIA.ink,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {text.split("").map((ch, i) => {
        const isDigit = ch >= "0" && ch <= "9";
        const w = isDigit ? 0.56 : ch === "," ? 0.26 : 0.6;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: `${w}em`,
              textAlign: "center",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Empty-seat line icon (thin office chair, side profile)
// ---------------------------------------------------------------------------
const ChairIcon: React.FC<{ stroke: string }> = ({ stroke }) => (
  <svg width={58} height={52} viewBox="0 0 58 52" fill="none">
    <path
      d="M18 5 L18 25 M13 25 L43 25 M28 25 L28 39 M28 39 L17 46 M28 39 L39 46"
      stroke={stroke}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx={17} cy={47.5} r={2.4} stroke={stroke} strokeWidth={2} />
    <circle cx={39} cy={47.5} r={2.4} stroke={stroke} strokeWidth={2} />
  </svg>
);

// ---------------------------------------------------------------------------
// Ghost org-chart card: dashed empty avatar, placeholder bars, empty seat
// ---------------------------------------------------------------------------
const GhostCard: React.FC<{
  x: number;
  y: number;
  rot: number;
  opacity: number;
  drift: number;
  driftDir: { x: number; y: number };
}> = ({ x, y, rot, opacity, drift, driftDir }) => {
  const dx = (1 - drift) * driftDir.x;
  const dy = (1 - drift) * driftDir.y;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 280,
        height: 186,
        background: POLSIA.cardGray,
        border: `1px solid ${WORLD.border}`,
        borderRadius: 16,
        boxShadow: WORLD.shadowSoft,
        padding: "20px 22px",
        opacity,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px dashed #C6C2BA",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            marginLeft: 15,
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          <div
            style={{
              width: 118,
              height: 11,
              borderRadius: 6,
              background: "#E0DDD6",
            }}
          />
          <div
            style={{
              width: 74,
              height: 11,
              borderRadius: 6,
              background: "#E7E4DE",
            }}
          />
        </div>
      </div>
      <div style={{ height: 1, background: "#E0DDD6", marginTop: 18 }} />
      <div style={{ marginTop: 13, display: "flex", justifyContent: "center" }}>
        <ChairIcon stroke="#BEB9B0" />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const PoP1ZeroEmployees: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Camera ----
  const fx = interpolate(frame, KEY_T, KEY_FX, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const fy = interpolate(frame, KEY_T, KEY_FY, {
    easing: ease,
    extrapolateRight: "clamp",
  });
  const z = interpolate(frame, KEY_T, KEY_Z, {
    easing: ease,
    extrapolateRight: "clamp",
  });

  // =========================== ACT 1 ===========================
  // Card is already easing at f0 (spring pre-rolled by 7 frames).
  const expSpr = spring({ frame: frame + 7, fps, config: SPRINGS.smooth });
  const expY = interpolate(expSpr, [0, 1], [26, 0]);
  const expScale = interpolate(expSpr, [0, 1], [0.965, 1]);
  const expOpacity = interpolate(frame, [0, 8], [0.86, 1], {
    extrapolateRight: "clamp",
  });

  // Halftone band: slow parallax drift behind the card.
  const bandDx = Math.sin(frame / 46) * 5;
  const bandDy = Math.cos(frame / 58) * 4;
  const band1Opacity = interpolate(frame, [0, 14], [0.14, 0.5], {
    extrapolateRight: "clamp",
  });

  // Avatar breathes 1.00 → 1.02
  const avBreath = 1.01 + 0.01 * Math.sin(frame / 21);
  const avSpr = spring({ frame: frame + 2, fps, config: SPRINGS.smooth });
  const avScaleIn = interpolate(avSpr, [0, 1], [0.88, 1]);

  // Dot leader + Uber chip land on the right of the header row
  const leadT = interpolate(frame, [6, 20], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const uSpr = spring({ frame: frame - 14, fps, config: SPRINGS.heavy });
  const uScale = interpolate(uSpr, [0, 1], [0.5, 1]);
  const uOpacity = interpolate(frame, [14, 21], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress line draws left → right, five pips fill in sequence behind it
  const lineT = interpolate(frame, [16, 48], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const PIP_STARTS = [18, 26, 34, 42, 50];

  // =========================== ACT 2 ===========================
  const band2Opacity = interpolate(frame, [82, 102], [0, 0.42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Mystery icon slides in from the left as the camera lands
  const mysSpr = spring({ frame: frame - 92, fps, config: SPRINGS.heavy });
  const mysX = interpolate(mysSpr, [0, 1], [-70, 0]);
  const mysScale = interpolate(mysSpr, [0, 1], [0.8, 1]);
  const mysOpacity = interpolate(frame, [92, 104], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mysRingSpin = (frame - 92) * 0.3;

  // Dashed slot where the Polsia chip will land (anticipation)
  const slotOpacity =
    interpolate(frame, [96, 108], [0, 0.4], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [134, 142], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // Connector 1 (experience card → mystery icon) with a traveling pulse dot
  const c1T = interpolate(frame, [84, 104], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse1T = interpolate(frame, [92, 114], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse1On = frame >= 92 && frame <= 116;
  const pulse1Pos = {
    x: C1_A.x + (C1_B.x - C1_A.x) * pulse1T,
    y: C1_A.y + (C1_B.y - C1_A.y) * pulse1T,
  };

  // Connector 2 (mystery icon → Polsia), elbow: down then right
  const c2T = interpolate(frame, [116, 136], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const c2Draw = c2T * C2_TOTAL;
  const c2Seg1 = Math.min(C2_SEG1, c2Draw);
  const c2Seg2 = Math.max(0, Math.min(C2_SEG2, c2Draw - C2_SEG1));
  const pulse2T = interpolate(frame, [120, 144], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse2On = frame >= 120 && frame <= 146;
  const pulse2D = pulse2T * C2_TOTAL;
  const pulse2Pos =
    pulse2D <= C2_SEG1
      ? { x: C2_P0.x, y: C2_P0.y + pulse2D }
      : { x: C2_P1.x + (pulse2D - C2_SEG1), y: C2_P1.y };

  // Polsia wordmark chip snaps in
  const pSpr = spring({ frame: frame - 138, fps, config: SPRINGS.heavy });
  const pScale = interpolate(pSpr, [0, 1], [0.42, 1]);
  const pOpacity = interpolate(frame, [138, 146], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ASCII mascot pops beside the wordmark, then blinks once
  const mSpr = spring({ frame: frame - 148, fps, config: SPRINGS.bouncy });
  const mScale = interpolate(mSpr, [0, 1], [0.4, 1]);
  const mOpacity = interpolate(frame, [148, 156], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mBob = Math.sin(frame / 12) * 2.5;
  const blinking = frame >= 162 && frame < 166;
  // "人" renders double-width in the mono fallback — trim one cell so the box lines up.
  const baseFace = FACES.curious.replace("│    人    │", "│    人   │");
  const mascotFace = blinking
    ? baseFace.replace("⌒   ⌒", "─   ─")
    : baseFace;

  // Act-2 group clears once the camera has left for the payoff
  const act2Out = interpolate(frame, [186, 200], [1, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // =========================== ACT 3 ===========================
  // Revenue ticker: fast, uneven climb; still visibly ticking on arrival
  const revClimb = interpolate(
    frame,
    [0, 60, 120, 180, 204, 236, 258, 280],
    [0, 700, 1400, 2100, 2420, 2790, 3030, 3140],
    { extrapolateRight: "clamp" },
  );
  const revenue = 2847193 + Math.floor(revClimb);
  const revenueText = `$${revenue.toLocaleString("en-US")}`;

  // Terminal strip: line 1 finishes on arrival, line 2 types on the push
  const line1 = STRINGS.terminal[7]; // "> Processing autonomous tasks..."
  const line2 = STRINGS.terminal[6]; // "> Deploying marketing campaign..."
  const onLine2 = frame >= 230;
  const chars = onLine2
    ? Math.floor(
        interpolate(frame, [230, 272], [1, line2.length], {
          extrapolateRight: "clamp",
        }),
      )
    : Math.floor(
        interpolate(frame, [180, 218], [9, line1.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      );
  const termText = (onLine2 ? line2 : line1).slice(0, chars);
  const typing = onLine2 ? frame < 272 : frame >= 180 && frame < 218;
  const cursorOn = typing || frame % 30 < 16;

  // Employees "0": heavy spring landing as the camera arrives
  const empSpr = spring({ frame: frame - 194, fps, config: SPRINGS.heavy });
  const zeroScale = interpolate(empSpr, [0, 1], [1.55, 1]);
  const zeroY = interpolate(empSpr, [0, 1], [-48, 0]);
  const zeroOpacity = interpolate(frame, [192, 201], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const empLabelOpacity = interpolate(frame, [186, 196], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deltaOpacity = interpolate(frame, [188, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipOpacity = interpolate(frame, [180, 194], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const microOpacity = interpolate(frame, [190, 204], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const empLabelY = interpolate(frame, [186, 196], [10, 0], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sparkline draws itself under the revenue number while it ticks
  const sparkT = interpolate(frame, [202, 252], [0, 1], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sparkOpacity = interpolate(frame, [198, 208], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sparkHead = sparkPointAt(SPARK_LEN * sparkT);

  // Ghost cards drift in behind during the reveal hold, dim on the push
  const dim = interpolate(frame, [240, 268], [1, 0.42], {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ghost = (start: number) => {
    const t = interpolate(frame, [start, start + 22], [0, 1], {
      easing: ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { drift: t, opacity: t * 0.82 * dim };
  };
  const gA = ghost(206);
  const gB = ghost(214);
  const gC = ghost(222);

  // Live dot pulse (orange accent)
  const dotPulse = 0.7 + 0.3 * Math.sin(frame / 7);

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      {/* Camera-transformed world */}
      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${VIEW / 2 - fx}px, ${VIEW / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* =================== ACT 1 — THE EXPERIENCE CARD =================== */}

        {/* Halftone dot band, offset behind the card */}
        <div
          style={{
            position: "absolute",
            left: EXP_X + 62 + bandDx,
            top: EXP_Y + 48 + bandDy,
            width: EXP_W,
            height: EXP_H,
            backgroundImage:
              "radial-gradient(circle, rgba(26,26,26,0.34) 1.5px, transparent 1.6px)",
            backgroundSize: "14px 14px",
            opacity: band1Opacity,
            WebkitMaskImage:
              "linear-gradient(115deg, transparent, black 22%, black 72%, transparent)",
            maskImage:
              "linear-gradient(115deg, transparent, black 22%, black 72%, transparent)",
          }}
        />

        {/* The editorial card */}
        <div
          style={{
            position: "absolute",
            left: EXP_X,
            top: EXP_Y,
            width: EXP_W,
            height: EXP_H,
            background: POLSIA.paper,
            border: `1px solid ${WORLD.border}`,
            borderRadius: 22,
            boxShadow: WORLD.shadow,
            opacity: expOpacity,
            transform: `translateY(${expY}px) scale(${expScale})`,
            transformOrigin: "50% 60%",
          }}
        />

        {/* Circular photo avatar — grayscale + blur(9px) at 2× render scale,
            so the silhouette reads as a person you cannot quite identify. */}
        <div
          style={{
            position: "absolute",
            left: AV_X,
            top: AV_Y,
            width: AV_D,
            height: AV_D,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid rgba(17,17,17,0.85)`,
            background: POLSIA.cardGray,
            opacity: expOpacity,
            transform: `translateY(${expY}px) scale(${avScaleIn * avBreath})`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -AV_D / 2,
              top: -AV_D / 2,
              width: AV_D * 2,
              height: AV_D * 2,
              transform: "scale(0.5)",
              transformOrigin: "50% 50%",
            }}
          >
            <Img
              src={staticFile("polsia/uber-founder.jpg")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "51% 31%",
                transform: "scale(1.02)",
                filter: "grayscale(1) blur(9px) contrast(1.08)",
              }}
            />
          </div>
        </div>

        {/* Outer hairline ring around the avatar */}
        <div
          style={{
            position: "absolute",
            left: AV_X - 11,
            top: AV_Y - 11,
            width: AV_D + 22,
            height: AV_D + 22,
            borderRadius: "50%",
            border: "1px solid rgba(17,17,17,0.22)",
            opacity: expOpacity,
            transform: `translateY(${expY}px) scale(${avBreath})`,
          }}
        />

        {/* Dot leader from the avatar across to the Uber chip */}
        <div
          style={{
            position: "absolute",
            left: LEAD_X0,
            top: AV_CY - 2,
            width: (UCHIP_X - 18 - LEAD_X0) * leadT,
            height: 4,
            backgroundImage:
              "radial-gradient(circle, rgba(17,17,17,0.55) 2px, transparent 2.1px)",
            backgroundSize: "16px 4px",
          }}
        />

        {/* Uber wordmark on a small white chip */}
        <div
          style={{
            position: "absolute",
            left: UCHIP_X,
            top: UCHIP_Y,
            width: UCHIP_W,
            height: UCHIP_H,
            background: POLSIA.paper,
            border: `1px solid ${WORLD.border}`,
            borderRadius: 14,
            boxShadow: WORLD.shadowSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: uOpacity,
            transform: `scale(${uScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <Img
            src={staticFile("polsia/uber-logo.svg")}
            style={{ display: "block", height: 32, width: 92 }}
          />
        </div>

        {/* Editorial rule under the header row */}
        <div
          style={{
            position: "absolute",
            left: EXP_X + EXP_PAD,
            top: RULE_Y,
            width: EXP_W - EXP_PAD * 2,
            height: 2,
            background: POLSIA.rule,
            opacity: expOpacity,
            transform: `scaleX(${interpolate(frame, [8, 28], [0, 1], {
              easing: ease,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
            transformOrigin: "0% 50%",
          }}
        />

        {/* Progress track + drawn progress line */}
        <div
          style={{
            position: "absolute",
            left: PIP_X0,
            top: PIP_Y - 1.5,
            width: PIP_X1 - PIP_X0,
            height: 3,
            background: "#E4E1DA",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PIP_X0,
            top: PIP_Y - 1.5,
            width: (PIP_X1 - PIP_X0) * lineT,
            height: 3,
            background: POLSIA.ink,
            borderRadius: 2,
          }}
        />

        {/* Five year-pips filling in sequence, with hairline ticks below */}
        {PIP_STARTS.map((start, i) => {
          const sp = spring({
            frame: frame - start,
            fps,
            config: SPRINGS.bouncy,
          });
          const fill = interpolate(sp, [0, 1], [0, 1]);
          const pulseT = interpolate(frame, [start, start + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isAccent = i === PIP_STARTS.length - 1;
          const accent = isAccent ? POLSIA.orange : POLSIA.ink;
          const cx = PIP_X0 + PIP_GAP * i;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: cx - PIP_R,
                  top: PIP_Y - PIP_R,
                  width: PIP_R * 2,
                  height: PIP_R * 2,
                  borderRadius: "50%",
                  border: `2px solid ${accent}`,
                  opacity: (1 - pulseT) * 0.6,
                  transform: `scale(${1 + pulseT * 1.15})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: cx - PIP_R,
                  top: PIP_Y - PIP_R,
                  width: PIP_R * 2,
                  height: PIP_R * 2,
                  borderRadius: "50%",
                  background: POLSIA.paper,
                  border: `2px solid ${fill > 0.4 ? accent : "#D6D2CA"}`,
                  transform: `scale(${
                    1 + (1 - Math.min(1, pulseT * 2.2)) * 0.12 * fill
                  })`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: cx - PIP_R + 5,
                  top: PIP_Y - PIP_R + 5,
                  width: PIP_R * 2 - 10,
                  height: PIP_R * 2 - 10,
                  borderRadius: "50%",
                  background: accent,
                  transform: `scale(${fill})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: cx - 0.75,
                  top: PIP_Y + PIP_R + 10,
                  width: 1.5,
                  height: 14 * fill,
                  background: isAccent ? POLSIA.orange : "#B7B3AA",
                }}
              />
            </React.Fragment>
          );
        })}

        {/* =================== ACT 2 — THE JUMP =================== */}
        <div style={{ opacity: act2Out }}>
          {/* Halftone band behind the chain */}
          <div
            style={{
              position: "absolute",
              left: -640 + bandDx,
              top: 400 + bandDy,
              width: 1080,
              height: 800,
              backgroundImage:
                "radial-gradient(circle, rgba(26,26,26,0.3) 1.5px, transparent 1.6px)",
              backgroundSize: "16px 16px",
              opacity: band2Opacity,
              WebkitMaskImage:
                "radial-gradient(70% 70% at 40% 55%, black 20%, transparent 78%)",
              maskImage:
                "radial-gradient(70% 70% at 40% 55%, black 20%, transparent 78%)",
            }}
          />

          {/* Connector 1: leader into the mystery icon, with an origin node */}
          <svg
            style={{
              position: "absolute",
              left: -800,
              top: 350,
              overflow: "visible",
            }}
            width={500}
            height={350}
            viewBox="0 0 500 350"
            fill="none"
          >
            <line
              x1={C1_A.x + 800 - 19}
              y1={C1_A.y - 350 - 16}
              x2={C1_A.x + 800}
              y2={C1_A.y - 350}
              stroke={POLSIA.ink}
              strokeWidth={2}
              opacity={c1T * 0.28}
            />
            <line
              x1={C1_A.x + 800}
              y1={C1_A.y - 350}
              x2={C1_B.x + 800}
              y2={C1_B.y - 350}
              stroke={POLSIA.ink}
              strokeWidth={2.4}
              strokeDasharray={C1_LEN}
              strokeDashoffset={C1_LEN * (1 - c1T)}
            />
            <circle
              cx={C1_A.x + 800}
              cy={C1_A.y - 350}
              r={5}
              fill={POLSIA.ink}
              opacity={c1T}
            />
          </svg>

          {/* Pulse dot traveling along connector 1 */}
          {pulse1On ? (
            <div
              style={{
                position: "absolute",
                left: pulse1Pos.x - 7,
                top: pulse1Pos.y - 7,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: POLSIA.orange,
                boxShadow: "0 0 0 6px rgba(230,81,0,0.15)",
              }}
            />
          ) : null}

          {/* Mystery icon — line-art head and shoulders, no photo */}
          <div
            style={{
              position: "absolute",
              left: MYS_CX - MYS_R - 12,
              top: MYS_CY - MYS_R - 12,
              width: (MYS_R + 12) * 2,
              height: (MYS_R + 12) * 2,
              borderRadius: "50%",
              border: "1.5px dashed rgba(17,17,17,0.2)",
              opacity: mysOpacity * 0.9,
              transform: `translateX(${mysX}px) rotate(${mysRingSpin}deg)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: MYS_CX - MYS_R,
              top: MYS_CY - MYS_R,
              width: MYS_R * 2,
              height: MYS_R * 2,
              borderRadius: "50%",
              background: POLSIA.paper,
              border: "2px solid rgba(17,17,17,0.88)",
              boxShadow: WORLD.shadowSoft,
              opacity: mysOpacity,
              transform: `translateX(${mysX}px) scale(${mysScale})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={MYS_R * 2} height={MYS_R * 2} viewBox="0 0 100 100">
              <circle
                cx={50}
                cy={39}
                r={15}
                stroke={POLSIA.ink}
                strokeWidth={3.4}
                fill="none"
              />
              <path
                d="M22 80 C 22 60, 78 60, 78 80"
                stroke={POLSIA.ink}
                strokeWidth={3.4}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Connector 2: mystery icon → Polsia (elbow, down then right) */}
          <div
            style={{
              position: "absolute",
              left: C2_P0.x - 1.2,
              top: C2_P0.y,
              width: 2.4,
              height: c2Seg1,
              background: POLSIA.ink,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: C2_P1.x,
              top: C2_P1.y - 1.2,
              width: c2Seg2,
              height: 2.4,
              background: POLSIA.ink,
            }}
          />
          {pulse2On ? (
            <div
              style={{
                position: "absolute",
                left: pulse2Pos.x - 7,
                top: pulse2Pos.y - 7,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: POLSIA.orange,
                boxShadow: "0 0 0 6px rgba(230,81,0,0.15)",
              }}
            />
          ) : null}

          {/* Dashed slot the Polsia chip snaps into */}
          <div
            style={{
              position: "absolute",
              left: PCHIP_X,
              top: PCHIP_Y,
              width: PCHIP_W,
              height: PCHIP_H,
              borderRadius: 18,
              border: "2px dashed rgba(17,17,17,0.45)",
              opacity: slotOpacity,
            }}
          />

          {/* Polsia serif wordmark on a white chip */}
          <div
            style={{
              position: "absolute",
              left: PCHIP_X,
              top: PCHIP_Y,
              width: PCHIP_W,
              height: PCHIP_H,
              background: POLSIA.paper,
              border: `1px solid ${WORLD.border}`,
              borderRadius: 18,
              boxShadow: WORLD.shadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: pOpacity,
              transform: `scale(${pScale})`,
              transformOrigin: "0% 50%",
            }}
          >
            <Img
              src={staticFile("polsia/polsia-logonoir.webp")}
              style={{ display: "block", height: 62, width: 159 }}
            />
          </div>

          {/* Tiny ASCII mascot beside the wordmark */}
          <div
            style={{
              position: "absolute",
              left: MASCOT_X,
              top: MASCOT_Y,
              opacity: mOpacity,
              transform: `translateY(${mBob}px) scale(${mScale})`,
              transformOrigin: "0% 50%",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: FONT_MONO,
                fontSize: 18,
                lineHeight: 1.2,
                color: POLSIA.ink,
                whiteSpace: "pre",
              }}
            >
              {mascotFace}
            </pre>
          </div>
        </div>

        {/* =================== ACT 3 — THE PAYOFF (approved) =================== */}

        {/* Ghost org-chart cards (behind the panel) */}
        <GhostCard
          x={505}
          y={560}
          rot={-3.2}
          opacity={gA.opacity}
          drift={gA.drift}
          driftDir={{ x: -46, y: -10 }}
        />
        <GhostCard
          x={1215}
          y={618}
          rot={2.4}
          opacity={gB.opacity}
          drift={gB.drift}
          driftDir={{ x: 46, y: -8 }}
        />
        <GhostCard
          x={520}
          y={936}
          rot={1.8}
          opacity={gC.opacity}
          drift={gC.drift}
          driftDir={{ x: -30, y: 38 }}
        />

        {/* Terminal strip */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: STRIP_Y,
            width: CARD_W,
            height: STRIP_H,
            background: POLSIA.termBg,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            boxShadow: WORLD.shadowSoft,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 17,
              color: POLSIA.termText,
              letterSpacing: 0.5,
              whiteSpace: "pre",
            }}
          >
            {termText}
          </span>
          <span
            style={{
              display: "inline-block",
              width: 9,
              height: 19,
              marginLeft: 5,
              background: POLSIA.termText,
              opacity: cursorOn ? 1 : 0,
            }}
          />
        </div>

        {/* The editorial stats panel */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: CARD_Y,
            width: CARD_W,
            background: POLSIA.paper,
            border: `1px solid ${WORLD.border}`,
            borderRadius: 22,
            boxShadow: WORLD.shadow,
            padding: "36px 40px 34px",
          }}
        >
          {/* Heading + LIVE chip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 36,
                fontWeight: 500,
                color: POLSIA.ink,
                lineHeight: 1.1,
              }}
            >
              Business
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: chipOpacity,
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: POLSIA.orange,
                  opacity: dotPulse,
                }}
              />
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  letterSpacing: 2.5,
                  color: POLSIA.ink,
                }}
              >
                LIVE
              </span>
            </div>
          </div>

          {/* Thin black editorial rule */}
          <div style={{ height: 2, background: POLSIA.rule, marginTop: 15 }} />

          {/* Revenue — ticking the whole time */}
          <div
            style={{
              marginTop: 26,
              fontFamily: FONT_SERIF,
              fontSize: 25,
              color: POLSIA.ink,
            }}
          >
            Revenue:
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline" }}>
            <TickerDigits text={revenueText} fontSize={84} />
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 15,
                letterSpacing: 0.5,
                color: POLSIA.grayText,
                marginLeft: 12,
                whiteSpace: "nowrap",
                opacity: deltaOpacity,
              }}
            >
              (+31% WOW)
            </span>
          </div>

          {/* Sparkline drawing itself under the ticking number */}
          <div
            style={{ marginTop: 12, height: SPARK_H, opacity: sparkOpacity }}
          >
            <svg
              width={SPARK_W}
              height={SPARK_H}
              viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
              fill="none"
            >
              <path
                d={SPARK_D}
                stroke="#E4E1DA"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={SPARK_D}
                stroke="#A9A49A"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={SPARK_LEN}
                strokeDashoffset={SPARK_LEN * (1 - sparkT)}
              />
              <circle
                cx={sparkHead.x}
                cy={sparkHead.y}
                r={4}
                fill={POLSIA.ink}
                opacity={0.85}
              />
            </svg>
          </div>

          <div style={{ height: 1, background: WORLD.border, marginTop: 14 }} />

          {/* Employees — the 0 lands with a heavy spring */}
          <div
            style={{
              height: 168,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 27,
                color: POLSIA.ink,
                paddingBottom: 30,
                opacity: empLabelOpacity,
                transform: `translateY(${empLabelY}px)`,
              }}
            >
              Employees:
            </div>
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 152,
                lineHeight: 1,
                color: POLSIA.ink,
                paddingBottom: 6,
                opacity: zeroOpacity,
                transform: `translateY(${zeroY}px) scale(${zeroScale})`,
                transformOrigin: "center 70%",
              }}
            >
              0
            </div>
          </div>

          <div style={{ height: 1, background: WORLD.border }} />

          {/* Real product microcopy (from /live) */}
          <div
            style={{
              marginTop: 17,
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: 19,
              color: WORLD.muted,
              opacity: microOpacity,
            }}
          >
            {LIVE.tasksPerDay}
          </div>
        </div>
      </div>

      {/* Soft screen-space vignette for depth (background, may bleed) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,18,12,0.055) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
