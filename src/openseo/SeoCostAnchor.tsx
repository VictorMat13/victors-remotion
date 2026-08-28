import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  A,
  C,
  Card,
  Chip,
  FONT,
  LogoImg,
  MONO,
  OpenSeoMark,
  PaperWorld,
  SPRINGS,
  tabular,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 220;

// ---------------------------------------------------------------------------
// Verified facts (see BRIEF.md §3) — nothing here is invented.
//   Semrush Pro          $139.95 / month, fixed
//   OpenSEO rate         $0.05 per keyword search
//   OpenSEO sample bill  100 searches -> $5.00
// ---------------------------------------------------------------------------

const SEM_AMOUNT = 139.95;
const OSE_RATE = 0.05;
const OSE_SEARCHES = 100;
const OSE_TOTAL = OSE_SEARCHES * OSE_RATE; // 5.00
const RATIO = OSE_TOTAL / SEM_AMOUNT; // 0.03573 -> 1 : 28

// ---------------------------------------------------------------------------
// World geometry (one continuous world, camera travels down through it)
// ---------------------------------------------------------------------------

const COL_X = 130;
const COL_W = 820;
const PAD = 44;
const INNER = COL_W - PAD * 2; // 732

const SEM = { x: COL_X, y: 60, w: COL_W, h: 500 };
const OSE = { x: COL_X, y: 740, w: COL_W, h: 540 };

const BASE_Y = 2050; // shared bar baseline
const TRACK_H = 560;
const TRACK_W = 250;
const TRACK_TOP = BASE_Y - TRACK_H; // 1490
const SEM_CX = 318;
const OSE_CX = 762;
const SEM_LABEL_Y = 1352;
/** Sits just above the ~20px orange sliver with the same air the Semrush
 *  label has above its bar — never inside the (now hairline) track. */
const OSE_LABEL_Y = 1880;
const MARK_Y = 2064;
const MARK_SIZE = 52;
const GHOST_STEP = 28;
const GHOST_INSET = 16;

// ---------------------------------------------------------------------------
// Beat timeline
// ---------------------------------------------------------------------------

const T = {
  /** monthly charge stamps — three in the open, a fourth after the meter idles */
  stamps: [8, 24, 40, 182],
  oseIn: 40,
  meterFrom: 72,
  meterTo: 166,
  panelIn: 112,
  semBar: 128,
  oseBarFrom: 126,
  oseBarTo: 166,
  idle: 172,
};

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const GHOST_ROT = [-0.8, 0.6, -0.5, 0.8];
const GHOST_OP = [0.95, 0.78, 0.6, 0.44];

const money = (n: number) =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ---------------------------------------------------------------------------

export const SeoCostAnchor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: tight on the invoice -> down to the meter -> out to both ------
  const cam = useCam({
    keys: [0, 50, 68, 105, 124, 168, 184, 206, 220],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [380, 394, 1010, 1022, 1114, 1114, 1110, 1109, 1109],
    z: [1.165, 1.135, 1.06, 1.045, 0.723, 0.719, 0.7225, 0.7225, 0.7228],
  });

  // --- Semrush invoice ------------------------------------------------------
  // Starts mid-flight so the clip opens on something already moving.
  const semSpring = spring({ frame: frame + 12, fps, config: SPRINGS.heavy });
  const semOpacity = Math.min(1, semSpring * 1.45);

  // Every stamp presses the card down a touch — the charge lands with weight.
  const stampDip = T.stamps.reduce(
    (acc, at) =>
      acc +
      interpolate(frame, [at - 1, at + 2, at + 11], [0, 1, 0], CLAMP),
    0,
  );
  const semTransform = `translateY(${(1 - semSpring) * 74 + stampDip * 8}px) scale(${
    0.945 + 0.055 * semSpring - stampDip * 0.014
  })`;

  const stampsDone = T.stamps.filter((s) => frame >= s).length;

  // --- OpenSEO usage meter --------------------------------------------------
  const oseEnter = spring({
    frame: frame - T.oseIn,
    fps,
    config: SPRINGS.pop,
  });
  const meterP = interpolate(frame, [T.meterFrom, T.meterTo], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...CLAMP,
  });
  const searches = Math.round(meterP * OSE_SEARCHES);
  const runningTotal = searches * OSE_RATE;

  const idle = interpolate(frame, [T.idle, T.idle + 12], [0, 1], CLAMP);
  const ringT = (frame % 26) / 26;
  const capGlow = (1 - idle) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / 4)));

  // --- Comparison bars ------------------------------------------------------
  const panelIn = interpolate(frame, [T.panelIn, T.panelIn + 16], [0, 1], CLAMP);
  const semBar = Math.min(
    1,
    spring({ frame: frame - T.semBar, fps, config: SPRINGS.snappy }),
  );
  const oseBar = interpolate(frame, [T.oseBarFrom, T.oseBarTo], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...CLAMP,
  });
  const semBarH = TRACK_H * semBar;
  const oseBarH = TRACK_H * RATIO * oseBar; // honest 1:28, ~20px at full
  const semLabel = interpolate(frame, [T.semBar + 10, T.semBar + 24], [0, 1], CLAMP);
  const oseLabel = interpolate(frame, [T.oseBarFrom + 2, T.oseBarFrom + 16], [0, 1], CLAMP);

  const spineTop = interpolate(frame, [24, 40], [0, 1], CLAMP);

  return (
    <PaperWorld cam={cam}>
      {/* ------------------------------------------------ ghost charge stack */}
      {[3, 2, 1, 0].map((i) => {
        const s = spring({
          frame: frame - T.stamps[i],
          fps,
          config: SPRINGS.pop,
        });
        if (s < 0.004) return null;
        return (
          <div
            key={`ghost-${i}`}
            style={{
              position: "absolute",
              left: SEM.x + GHOST_INSET * (i + 1),
              top: SEM.y,
              width: SEM.w - GHOST_INSET * 2 * (i + 1),
              height: SEM.h,
              borderRadius: 26,
              background: C.paperDeep,
              border: `1.5px solid ${C.line}`,
              boxShadow: "0 10px 22px rgba(25,23,20,0.06)",
              opacity: GHOST_OP[i] * s * semOpacity,
              transform: `translateY(${-GHOST_STEP * (i + 1) * s}px) rotate(${GHOST_ROT[i] * s}deg)`,
              transformOrigin: "50% 100%",
            }}
          />
        );
      })}

      {/* ------------------------------------------------ Semrush invoice card */}
      <Card
        x={SEM.x}
        y={SEM.y}
        w={SEM.w}
        h={SEM.h}
        enter={semOpacity}
        style={{ transform: semTransform }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 40,
            width: INNER,
            height: 76,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <LogoImg src={A.logo.semrushInk} size={72} />
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: -1.4,
              color: C.ink,
            }}
          >
            Semrush
          </div>
          <div style={{ flex: 1 }} />
          <Chip label="Pro" size={38} />
        </div>

        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 158,
            width: INNER,
            height: 1.5,
            background: C.lineSoft,
          }}
        />

        {/* the fixed monthly charge */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 196,
            display: "flex",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <span
            style={{
              ...tabular,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 132,
              lineHeight: 1.06,
              letterSpacing: -4.5,
              color: C.ink,
            }}
          >
            {money(SEM_AMOUNT)}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 46,
              letterSpacing: -0.8,
              color: C.muted,
            }}
          >
            /mo
          </span>
        </div>

        {/* recurrence ticks — one filled square per charge that has landed */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 406,
            display: "flex",
            gap: 22,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`tick-${i}`}
              style={{
                width: 28,
                height: 22,
                borderRadius: 6,
                background: i < stampsDone ? C.ink : C.lineSoft,
                border: `1.5px solid ${i < stampsDone ? C.ink : C.line}`,
              }}
            />
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------ connector spine */}
      <div
        style={{
          position: "absolute",
          left: 538,
          top: SEM.y + SEM.h,
          width: 4,
          height: OSE.y - (SEM.y + SEM.h),
          borderRadius: 2,
          background: C.line,
          opacity: spineTop,
        }}
      />
      {/* ------------------------------------------------ OpenSEO usage meter */}
      <Card
        x={OSE.x}
        y={OSE.y}
        w={OSE.w}
        h={OSE.h}
        accent
        enter={oseEnter}
        style={{
          transform: `translateY(${(1 - oseEnter) * 34}px) scale(${0.965 + 0.035 * oseEnter})`,
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 36,
            width: INNER,
            height: 76,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <OpenSeoMark size={72} />
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: -1.4,
              color: C.ink,
            }}
          >
            OpenSEO
          </div>
          <div style={{ flex: 1 }} />
          {/* live / idle pulse */}
          <div style={{ position: "relative", width: 34, height: 34 }}>
            {/* expanding ring — present only while the meter is live */}
            <div
              style={{
                position: "absolute",
                left: 17 - 17 - 22 * ringT,
                top: 17 - 17 - 22 * ringT,
                width: 34 + 44 * ringT,
                height: 34 + 44 * ringT,
                borderRadius: 999,
                border: `3px solid ${C.orange}`,
                opacity: (1 - idle) * (1 - ringT) * 0.55,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: C.orange,
                opacity: 1 - idle,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `5px solid ${C.mutedSoft}`,
                opacity: idle,
              }}
            />
          </div>
        </div>

        {/* the genuine rate string — static configuration, so it is part of the
            card from the moment it lands; the card never reads as hollow */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 140,
            height: 66,
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "0 26px",
            borderRadius: 16,
            background: C.orangeSoft,
            border: `1.5px solid ${C.orangeLine}`,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: C.orange,
            }}
          />
          <span
            style={{
              ...tabular,
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: 42,
              letterSpacing: -0.6,
              color: C.ink,
            }}
          >
            {money(OSE_RATE)} / search
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 240,
            width: INNER,
            height: 1.5,
            background: C.lineSoft,
          }}
        />

        {/* counter + running total */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 268,
            width: INNER,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                ...tabular,
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 100,
                lineHeight: 1.06,
                letterSpacing: -3,
                color: C.ink,
              }}
            >
              {searches}
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 40,
                letterSpacing: -0.4,
                color: C.muted,
                marginTop: 6,
              }}
            >
              searches
            </span>
          </div>
          <span
            style={{
              ...tabular,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 132,
              lineHeight: 1.06,
              letterSpacing: -4.5,
              color: C.orange,
              marginTop: -8,
            }}
          >
            {money(runningTotal)}
          </span>
        </div>

        {/* the meter itself */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 462,
            width: INNER,
            height: 24,
            borderRadius: 999,
            background: C.lineSoft,
            border: `1.5px solid ${C.line}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${meterP * 100}%`,
              borderRadius: 999,
              background: C.orange,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${meterP * 100}%`,
              width: 10,
              marginLeft: -10,
              background: "#FFFFFF",
              opacity: 0.34 * capGlow,
            }}
          />
        </div>
      </Card>

      {/* ------------------------------------------------ shared-baseline bars */}
      <div style={{ opacity: panelIn }}>
        {/* tracks — unfilled hairline outlines. A filled track would read as a
            second full-height bar and destroy the 1:28 ratio at a glance, so
            the empty column is a faint dashed guide only, never a shape. */}
        {[
          { cx: SEM_CX, key: "sem" },
          { cx: OSE_CX, key: "ose" },
        ].map((col) => (
          <div
            key={`track-${col.key}`}
            style={{
              position: "absolute",
              left: col.cx - TRACK_W / 2,
              top: TRACK_TOP,
              width: TRACK_W,
              height: TRACK_H,
              borderRadius: 16,
              background: "transparent",
              border: "1.5px dashed rgba(25,23,20,0.09)",
            }}
          />
        ))}

        {/* Semrush fill — muted gray, shoots to full height */}
        <div
          style={{
            position: "absolute",
            left: SEM_CX - TRACK_W / 2,
            top: BASE_Y - semBarH,
            width: TRACK_W,
            height: semBarH,
            borderRadius: 14,
            background: C.muted,
            boxShadow: "0 10px 24px rgba(25,23,20,0.14)",
          }}
        />

        {/* OpenSEO fill — accent orange, honest 1/28th of the gray bar */}
        <div
          style={{
            position: "absolute",
            left: OSE_CX - TRACK_W / 2,
            top: BASE_Y - oseBarH,
            width: TRACK_W,
            height: oseBarH,
            borderRadius: 8,
            background: C.orange,
          }}
        />

        {/* shared baseline */}
        <div
          style={{
            position: "absolute",
            left: COL_X,
            top: BASE_Y,
            width: COL_W,
            height: 5,
            borderRadius: 3,
            background: C.ink,
            opacity: 0.88,
          }}
        />

        {/* amounts only — no prose */}
        <div
          style={{
            ...tabular,
            position: "absolute",
            left: SEM_CX - 300,
            top: SEM_LABEL_Y,
            width: 600,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 100,
            lineHeight: 1.1,
            letterSpacing: -3.4,
            color: C.ink,
            opacity: semLabel,
            transform: `translateY(${(1 - semLabel) * 14}px)`,
          }}
        >
          {money(SEM_AMOUNT)}
        </div>
        <div
          style={{
            ...tabular,
            position: "absolute",
            left: OSE_CX - 300,
            top: OSE_LABEL_Y,
            width: 600,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 100,
            lineHeight: 1.1,
            letterSpacing: -3.4,
            color: C.orange,
            opacity: oseLabel,
            transform: `translateY(${(1 - oseLabel) * 14}px)`,
          }}
        >
          {money(runningTotal)}
        </div>

        {/* who each column is */}
        <div
          style={{
            position: "absolute",
            left: SEM_CX - MARK_SIZE / 2,
            top: MARK_Y,
          }}
        >
          <LogoImg src={A.logo.semrushMuted} size={MARK_SIZE} />
        </div>
        <div
          style={{
            position: "absolute",
            left: OSE_CX - MARK_SIZE / 2,
            top: MARK_Y,
          }}
        >
          <OpenSeoMark size={MARK_SIZE} />
        </div>
      </div>
    </PaperWorld>
  );
};
