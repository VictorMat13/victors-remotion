import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  Card,
  EASE,
  LogoImg,
  MONO,
  PaperWorld,
  SCRAPY,
  SPRINGS,
  ScrapyMark,
  TEAL,
  TEAL_LINE,
  TEAL_SOFT,
  useCam,
  useEnter,
} from "./kit";

export const DURATION_IN_FRAMES = 260;

// ---------------------------------------------------------------------------
// World geometry — one continuous world.
//   MOVEMENT 1 (x≈540):  Scrapy head → vertical teal pipeline with three
//                        settings stations (cookies / retry / throttle gate).
//   MOVEMENT 2 (x≈1510): half-rendered browser card + scrapy-playwright plug.
// ---------------------------------------------------------------------------

const PIPE_X = 540;
const PIPE_TOP = 415;
const PIPE_END = 1560;

const HEAD = { x: 465, y: 255, size: 150 };
const CHIP1 = { x: 314, y: 606, w: 452, h: 68 }; // COOKIES_ENABLED
const CHIP2 = { x: 332, y: 916, w: 416, h: 68 }; // RETRY_ENABLED
const CHIP3 = { x: 269, y: 1209, w: 542, h: 122 }; // AUTOTHROTTLE + DELAY

const RNODE = { x: 540, y: 1085 }; // retry check node on the pipe
const LOOP = { cx: 505, cy: 1051, r: 48.8, a0: 44, a1: 316 }; // retry loop
const REJOIN_Y = LOOP.cy + LOOP.r * Math.sin((LOOP.a1 * Math.PI) / 180);

const GATE_Y = 1345; // packets re-emerge below the throttle chip here
const QUEUE_SLOTS = [1204, 1176, 1148, 1120]; // bunched stack above chip3
const RELEASES = Array.from({ length: 11 }, (_, i) => 124 + i * 13);
const RELEASE_SPEED = 7; // px/frame → even 91px spacing

const BURSTS = [
  [96, 98, 103, 105],
  [126, 129, 133, 136],
  [216, 219, 223, 226],
];

const BROWSER = { x: 1160, y: 330, w: 700, h: 960 };
const PLUG = { x: 1290, w: 440, h: 84, dockTop: 1312, drop: 210 };

const clampBoth = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// Paint-in blocks for the blank region (browser-card-local coords).
const BLOCKS: {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "hero" | "bar" | "card";
  at: number;
}[] = [
  { x: 80, y: 245, w: 540, h: 210, kind: "hero", at: 196 },
  { x: 80, y: 480, w: 540, h: 20, kind: "bar", at: 200 },
  { x: 80, y: 516, w: 460, h: 20, kind: "bar", at: 204 },
  { x: 80, y: 552, w: 500, h: 20, kind: "bar", at: 208 },
  { x: 80, y: 600, w: 255, h: 130, kind: "card", at: 212 },
  { x: 365, y: 600, w: 255, h: 130, kind: "card", at: 216 },
  { x: 80, y: 762, w: 500, h: 20, kind: "bar", at: 219 },
  { x: 80, y: 798, w: 430, h: 20, kind: "bar", at: 222 },
];

// Retry-loop trail polyline (svg-local: svg sits at world 440/985).
const LOOP_PTS = Array.from({ length: 25 }, (_, i) => {
  const a = ((LOOP.a0 + ((LOOP.a1 - LOOP.a0) * i) / 24) * Math.PI) / 180;
  const x = LOOP.cx + LOOP.r * Math.cos(a) - 440;
  const y = LOOP.cy + LOOP.r * Math.sin(a) - 985;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const Dot: React.FC<{ x: number; y: number; op: number; size?: number }> = ({
  x,
  y,
  op,
  size = 18,
}) => {
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        background: TEAL,
        opacity: op,
      }}
    />
  );
};

const RingPulse: React.FC<{
  x: number;
  y: number;
  at: number;
  color: string;
  size?: number;
}> = ({ x, y, at, color, size = 100 }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 14) return null;
  const p = interpolate(frame, [at, at + 14], [0, 1], {
    ...clampBoth,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        border: `4px solid ${color}`,
        opacity: 0.7 * (1 - p),
        transform: `scale(${0.35 + 0.85 * p})`,
        boxSizing: "border-box",
      }}
    />
  );
};

const Cookie: React.FC<{ x: number; y: number; scale: number; op: number }> = ({
  x,
  y,
  scale,
  op,
}) => {
  if (op <= 0.01) return null;
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      style={{
        position: "absolute",
        left: x - 14,
        top: y - 14,
        opacity: op,
        transform: `scale(${scale})`,
      }}
    >
      <circle
        cx={14}
        cy={14}
        r={12}
        fill="#E7B75F"
        stroke="#B07B2E"
        strokeWidth={2.2}
      />
      <circle cx={10} cy={10.5} r={2} fill="#7A5320" />
      <circle cx={17} cy={9} r={1.7} fill="#7A5320" />
      <circle cx={18} cy={16.5} r={2.1} fill="#7A5320" />
      <circle cx={10.5} cy={17.5} r={1.6} fill="#7A5320" />
    </svg>
  );
};

const SettingLine: React.FC<{ name: string; value: string }> = ({
  name,
  value,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 30,
      lineHeight: "38px",
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ color: C.termText }}>{name}</span>
    <span style={{ color: C.termMuted }}>{" = "}</span>
    <span style={{ color: TEAL, fontWeight: 700 }}>{value}</span>
  </div>
);

const SettingsChip: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  enter: number;
  from: 1 | -1;
  children: React.ReactNode;
}> = ({ x, y, w, h, enter, from, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 18,
      background: C.term,
      border: "1.5px solid rgba(232,228,222,0.14)",
      boxShadow: "0 16px 36px rgba(25,23,20,0.18)",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 6,
      padding: "0 28px",
      boxSizing: "border-box",
      opacity: Math.min(1, enter * 1.3),
      transform: `translateX(${(1 - enter) * from * 380}px)`,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------

export const ScrHandlesHardParts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Camera: head → full pipeline → throttle gate → browser → overview ---
  const cam = useCam({
    keys: [0, 20, 40, 100, 116, 150, 172, 235, 252, 260],
    fx: [540, 540, 540, 540, 540, 540, 1510, 1510, 1062, 1062],
    fy: [700, 700, 960, 960, 1150, 1150, 930, 930, 907, 907],
    z: [1.3, 1.3, 1.0, 1.0, 1.12, 1.12, 1.05, 1.05, 0.6, 0.6],
  });

  // --- Movement 1: pipeline -----------------------------------------------
  const headIn = useEnter(0, SPRINGS.pop);
  const pipeP = interpolate(frame, [2, 26], [0, 1], {
    ...clampBoth,
    easing: EASE,
  });

  const chip1In = useEnter(44, SPRINGS.pop);
  const chip2In = useEnter(62, SPRINGS.pop);
  const chip3In = useEnter(88, SPRINGS.pop);

  // Hero packet: head → cookie pickup → retry bounce/loop → pass.
  let heroX = PIPE_X;
  let heroY: number;
  if (frame < 76) {
    heroY = interpolate(frame, [34, 52, 72], [PIPE_TOP, 680, RNODE.y], clampBoth);
  } else if (frame < 92) {
    const a =
      (interpolate(frame, [76, 92], [LOOP.a0, LOOP.a1], {
        ...clampBoth,
        easing: EASE,
      }) *
        Math.PI) /
      180;
    heroX = LOOP.cx + LOOP.r * Math.cos(a);
    heroY = LOOP.cy + LOOP.r * Math.sin(a);
  } else {
    heroY = interpolate(
      frame,
      [92, 98, 124],
      [REJOIN_Y, RNODE.y, PIPE_END],
      clampBoth,
    );
  }
  const heroOp =
    frame < 34 || frame > 126
      ? 0
      : Math.min(
          interpolate(frame, [34, 37], [0, 1], clampBoth),
          interpolate(heroY, [1495, 1552], [1, 0], clampBoth),
        );
  const cookieIn = spring({ frame: frame - 52, fps, config: SPRINGS.pop });
  const loopP = interpolate(frame, [76, 92], [0, 1], {
    ...clampBoth,
    easing: EASE,
  });
  const loopTrailOp =
    frame < 74 ? 0 : interpolate(frame, [98, 110], [0.85, 0], clampBoth);

  // Retry node states: idle nub → red ✕ (bounce) → green ✓ (pass).
  const nodeIn = useEnter(64, SPRINGS.pop);
  const failPop = spring({ frame: frame - 72, fps, config: SPRINGS.pop });
  const okPop = spring({ frame: frame - 96, fps, config: SPRINGS.pop });
  const nodeState = frame < 72 ? "idle" : frame < 96 ? "fail" : "ok";
  const nodeSize = nodeState === "idle" ? 26 : 46;
  const nodeScale =
    nodeState === "idle"
      ? 0.5 + 0.5 * nodeIn
      : nodeState === "fail"
        ? interpolate(failPop, [0, 1], [1.45, 1])
        : interpolate(okPop, [0, 1], [1.45, 1]);
  const nodeBorder =
    nodeState === "idle" ? C.line : nodeState === "fail" ? C.red : C.green;

  // Throttle gate: last release drives the metronome pulse.
  const lastRel = RELEASES.filter((r) => r <= frame).pop();
  const gateOp =
    lastRel === undefined
      ? 0
      : interpolate(frame - lastRel, [0, 7], [0.9, 0], clampBoth);
  const tickOp = interpolate(frame, [124, 132], [0, 0.65], clampBoth);

  // --- Movement 2: browser + plug -----------------------------------------
  const browserIn = spring({
    frame: frame - 152,
    fps,
    config: SPRINGS.snappy,
  });
  const plugVis = interpolate(frame, [172, 177], [0, 1], clampBoth);
  const plugSnap = spring({ frame: frame - 178, fps, config: SPRINGS.snappy });
  const plugTop = PLUG.dockTop + (1 - plugSnap) * PLUG.drop;
  const connected = frame >= 190;
  const badgeOp = interpolate(frame, [194, 206], [1, 0], clampBoth);
  const dashOp = interpolate(frame, [196, 210], [1, 0], clampBoth);
  const okChip = spring({ frame: frame - 218, fps, config: SPRINGS.bouncy });

  return (
    <PaperWorld cam={cam} grid={{ left: -1200, top: -1200, width: 4400, height: 4400 }}>
      {/* ------------------------------------------------------------ pipe */}
      <svg
        width={60}
        height={1200}
        viewBox="0 0 60 1200"
        style={{ position: "absolute", left: PIPE_X - 30, top: PIPE_TOP - 10 }}
      >
        <path
          d={`M 30 10 L 30 ${PIPE_END - PIPE_TOP + 10}`}
          fill="none"
          stroke={TEAL_SOFT}
          strokeWidth={18}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - pipeP}
        />
        <path
          d={`M 30 10 L 30 ${PIPE_END - PIPE_TOP + 10}`}
          fill="none"
          stroke={TEAL_LINE}
          strokeWidth={7}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - pipeP}
        />
      </svg>

      {/* cadence ticks below the throttle gate */}
      <div
        style={{
          position: "absolute",
          left: 516,
          top: 1436,
          width: 48,
          height: 3,
          borderRadius: 2,
          background: TEAL_LINE,
          opacity: tickOp,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 516,
          top: 1527,
          width: 48,
          height: 3,
          borderRadius: 2,
          background: TEAL_LINE,
          opacity: tickOp * 0.55,
        }}
      />

      {/* gate release pulse under chip3 */}
      <div
        style={{
          position: "absolute",
          left: 510,
          top: 1336,
          width: 60,
          height: 5,
          borderRadius: 3,
          background: TEAL,
          opacity: gateOp,
        }}
      />

      {/* retry loop trail */}
      <svg
        width={130}
        height={130}
        viewBox="0 0 130 130"
        style={{ position: "absolute", left: 440, top: 985 }}
      >
        <polyline
          points={LOOP_PTS}
          fill="none"
          stroke={TEAL_LINE}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - loopP}
          opacity={loopTrailOp}
        />
      </svg>

      {/* ---------------------------------------------------------- packets */}
      {/* ambient early packets (pre-station flow) */}
      {[
        { s: 6, e: 46 },
        { s: 16, e: 56 },
      ].map(({ s, e }) => {
        if (frame < s || frame > e + 1) return null;
        const y = interpolate(frame, [s, e], [PIPE_TOP, PIPE_END], clampBoth);
        const op = Math.min(
          interpolate(frame, [s, s + 3], [0, 1], clampBoth),
          interpolate(y, [1495, 1552], [1, 0], clampBoth),
        );
        return <Dot key={`amb-${s}`} x={PIPE_X} y={y} op={op} />;
      })}

      {/* bunched bursts rushing down to the throttle queue */}
      {BURSTS.map((burst, bi) =>
        burst.map((s, i) => {
          if (frame < s || frame > s + 24) return null;
          const y = interpolate(
            frame,
            [s, s + 24],
            [PIPE_TOP, QUEUE_SLOTS[i]],
            { ...clampBoth, easing: Easing.out(Easing.quad) },
          );
          const op = Math.min(
            interpolate(frame, [s, s + 2], [0, 1], clampBoth),
            interpolate(frame, [s + 21, s + 24], [1, 0], clampBoth),
          );
          return <Dot key={`b${bi}-${i}`} x={PIPE_X} y={y} op={op} size={15} />;
        }),
      )}

      {/* standing bunched queue above the gate (breathing) */}
      {QUEUE_SLOTS.map((slot, i) => {
        const at = [120, 122, 127, 129][i];
        const qIn = interpolate(frame, [at, at + 4], [0, 1], clampBoth);
        const qy = slot + 2.5 * Math.sin(frame / 5 + i * 1.9);
        return <Dot key={`q-${i}`} x={PIPE_X} y={qy} op={qIn} size={15} />;
      })}

      {/* evenly released packets below the gate — the pacing payoff */}
      {RELEASES.map((r) => {
        const age = frame - r;
        if (age < 0 || age > 34) return null;
        const y = GATE_Y + age * RELEASE_SPEED;
        const op = Math.min(
          interpolate(age, [0, 2], [0, 1], clampBoth),
          interpolate(y, [1495, 1552], [1, 0], clampBoth),
        );
        return <Dot key={`rel-${r}`} x={PIPE_X} y={y} op={op} size={15} />;
      })}

      {/* hero packet + cookie badge */}
      <Dot x={heroX} y={heroY} op={heroOp} />
      <Cookie
        x={heroX + 19}
        y={heroY - 17}
        scale={0.3 + 0.7 * Math.min(1, cookieIn)}
        op={frame < 52 ? 0 : Math.min(1, cookieIn) * heroOp}
      />

      {/* retry check node */}
      <div
        style={{
          position: "absolute",
          left: RNODE.x - nodeSize / 2,
          top: RNODE.y - nodeSize / 2,
          width: nodeSize,
          height: nodeSize,
          borderRadius: 999,
          background: C.card,
          border: `${nodeState === "idle" ? 3 : 4}px solid ${nodeBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, nodeIn * 1.3),
          transform: `scale(${nodeScale})`,
          boxSizing: "border-box",
          zIndex: 5,
        }}
      >
        {nodeState === "idle" ? null : (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 24,
              fontWeight: 700,
              color: nodeState === "fail" ? C.red : C.green,
              lineHeight: 1,
            }}
          >
            {nodeState === "fail" ? "✕" : "✓"}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------ stations */}
      <SettingsChip
        x={CHIP1.x}
        y={CHIP1.y}
        w={CHIP1.w}
        h={CHIP1.h}
        enter={chip1In}
        from={-1}
      >
        <SettingLine name="COOKIES_ENABLED" value="True" />
      </SettingsChip>

      <SettingsChip
        x={CHIP2.x}
        y={CHIP2.y}
        w={CHIP2.w}
        h={CHIP2.h}
        enter={chip2In}
        from={1}
      >
        <SettingLine name="RETRY_ENABLED" value="True" />
      </SettingsChip>

      <SettingsChip
        x={CHIP3.x}
        y={CHIP3.y}
        w={CHIP3.w}
        h={CHIP3.h}
        enter={chip3In}
        from={-1}
      >
        <SettingLine name="AUTOTHROTTLE_ENABLED" value="True" />
        <SettingLine name="DOWNLOAD_DELAY" value="2" />
      </SettingsChip>

      {/* pipeline head — the real Scrapy mark */}
      <div
        style={{
          position: "absolute",
          left: HEAD.x,
          top: HEAD.y,
          width: HEAD.size,
          height: HEAD.size,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 16px 38px rgba(25,23,20,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, headIn * 1.4),
          transform: `scale(${0.6 + 0.4 * headIn})`,
        }}
      >
        <ScrapyMark size={92} />
      </div>

      {/* -------------------------------------------------------- browser */}
      <Card
        x={BROWSER.x}
        y={BROWSER.y}
        w={BROWSER.w}
        h={BROWSER.h}
        r={28}
        enter={browserIn}
        style={{
          border: `1.5px solid ${connected ? TEAL_LINE : C.line}`,
        }}
      >
        {/* chrome bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: 60,
            borderBottom: `1.5px solid ${C.lineSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                background: C.line,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 12,
              width: 300,
              height: 26,
              borderRadius: 999,
              background: C.lineSoft,
            }}
          />
        </div>

        {/* server-rendered part (already loaded) */}
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 95,
            width: 360,
            height: 26,
            borderRadius: 8,
            background: C.paperDeep,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 140,
            width: 560,
            height: 16,
            borderRadius: 8,
            background: C.lineSoft,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 166,
            width: 480,
            height: 16,
            borderRadius: 8,
            background: C.lineSoft,
          }}
        />

        {/* the JS-only blank region */}
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 215,
            width: 600,
            height: 685,
            borderRadius: 18,
            border: `2px dashed ${C.line}`,
            background: "rgba(25,23,20,0.02)",
            opacity: dashOp,
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 296,
            top: 522,
            width: 108,
            height: 70,
            borderRadius: 14,
            background: C.term,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: badgeOp,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 32,
              fontWeight: 700,
              color: "#F7DF1E",
            }}
          >
            {"</>"}
          </span>
        </div>

        {/* content paints in once the plug docks */}
        {BLOCKS.map((b, i) => {
          const e = spring({ frame: frame - b.at, fps, config: SPRINGS.pop });
          if (frame < b.at) return null;
          const look =
            b.kind === "hero"
              ? {
                  background: TEAL_SOFT,
                  border: `1.5px solid ${TEAL_LINE}`,
                  borderRadius: 14,
                }
              : b.kind === "card"
                ? {
                    background: C.paperWarm,
                    border: `1.5px solid ${C.line}`,
                    borderRadius: 12,
                  }
                : { background: C.paperDeep, borderRadius: 8 };
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                boxSizing: "border-box",
                opacity: Math.min(1, e * 1.3),
                transform: `translateY(${(1 - e) * 16}px)`,
                ...look,
              }}
            />
          );
        })}

        {/* port slot on the bottom edge */}
        <div
          style={{
            position: "absolute",
            left: 302,
            top: 951,
            width: 96,
            height: 18,
            borderRadius: 9,
            background: C.term,
          }}
        />
      </Card>

      {/* scrapy-playwright plug chip */}
      <div
        style={{
          position: "absolute",
          left: PLUG.x,
          top: plugTop,
          width: PLUG.w,
          height: PLUG.h,
          opacity: plugVis,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 196,
            top: -24,
            width: 48,
            height: 28,
            borderRadius: "6px 6px 0 0",
            background: C.termBar,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: C.term,
            border: "1.5px solid rgba(232,228,222,0.14)",
            boxShadow: "0 18px 40px rgba(25,23,20,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <LogoImg src={SCRAPY.logos.playwright} size={42} />
          <span style={{ fontFamily: MONO, fontSize: 30, color: C.termText }}>
            scrapy-playwright
          </span>
        </div>
      </div>

      {/* success chip on the browser card */}
      <div
        style={{
          position: "absolute",
          left: 1794,
          top: 308,
          width: 64,
          height: 64,
          borderRadius: 999,
          background: C.card,
          border: `3px solid ${C.green}`,
          boxShadow: "0 12px 26px rgba(25,23,20,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, okChip * 1.5),
          transform: `scale(${0.4 + 0.6 * okChip})`,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 700,
            color: C.green,
            lineHeight: 1,
          }}
        >
          ✓
        </span>
      </div>

      {/* ---------------------------------------------------- impact rings */}
      <RingPulse x={PIPE_X} y={678} at={50} color={TEAL} size={84} />
      <RingPulse x={RNODE.x} y={RNODE.y} at={72} color={C.red} size={110} />
      <RingPulse x={RNODE.x} y={RNODE.y} at={96} color={C.green} size={110} />
      <RingPulse x={1510} y={1300} at={190} color={TEAL} size={130} />
    </PaperWorld>
  );
};
