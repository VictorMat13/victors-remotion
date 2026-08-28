import React from "react";
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  FACTS,
  MONO,
  PaperWorld,
  SCRAPY,
  SPRINGS,
  ScrapyMark,
  TEAL,
  TEAL_LINE,
  useCam,
  useTypewriter,
} from "./kit";

export const DURATION_IN_FRAMES = 290;

/* --------------------------------------------------------------------------
 * The serious beat — public data has rules. Three quiet artifacts, one
 * vertical camera descent:
 *   1. a robots.txt document types itself in; ROBOTSTXT_OBEY = True docks ✓
 *   2. a platform card's shield flicks away a too-fast packet stream
 *   3. a small site's load meter climbs into the red under bunched packets,
 *      then DOWNLOAD_DELAY = 2 docks, packets re-space wide (teal), the
 *      meter sinks back to green
 *   4. pull out — all three sit calm, slow packets still ticking past
 * No narration text anywhere; the file lines and settings carry it all.
 * ------------------------------------------------------------------------ */

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
    a[1] + (b[1] - a[1]) * t,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// local palette — no glow anywhere; borders + fills only
const AMBER = "#D97706";
const GREEN_RGB: RGB = [22, 163, 74];
const AMBER_RGB: RGB = [217, 119, 6];
const RED_RGB: RGB = [220, 38, 38];
const BAR_INK = "#221F1B";
const BAR_MUTED = "#CFC8BA";
const SKEL = "#EDE8E1";
const TILE_BG = "#F3F0EA";
const PKT = "#3E3A33"; // the too-fast scraper packets — dark, wrong
const TRACK_BG = "#F0EBE2";

// ---- world geometry (one column, camera descends) -------------------------
const RA = { x: 190, y: 100, w: 700, h: 360 }; // robots.txt document
const CHIP_A_Y = 508;

const PB = { x: 360, y: 1200, w: 560, h: 620 }; // platform card
const SHIELD = { cx: 360, cy: 1510, r: 62 }; // docked on the card's left edge

const SC = { x: 280, y: 2560, w: 520, h: 300 }; // the small, humbler site
const SITE_Y = 2706; // packet lane → card's left edge
const CHIP_C_Y = 2930;

// ---- beats ----------------------------------------------------------------
const T = {
  chipA: 28, // ROBOTSTXT_OBEY docks under the finished file
  camB: 36, // travel 36 → 58 down to the platform
  cardB: 44,
  shieldIn: 52,
  camC: 120, // travel 120 → 140 down to the small site
  cardC: 128,
  chipC: 176, // DOWNLOAD_DELAY docks — the cadence changes here
  camOut: 210, // pull out 210 → 234; settle on two near-identical keys
};

// beat B — seven rushed packets, each flicked away by the shield
const B_IMPACTS = [
  { at: 66, dy: -78, dir: -1, tone: "red" },
  { at: 74, dy: 26, dir: 1, tone: "amber" },
  { at: 82, dy: -30, dir: -1, tone: "red" },
  { at: 90, dy: 66, dir: 1, tone: "red" },
  { at: 98, dy: -60, dir: -1, tone: "amber" },
  { at: 106, dy: 10, dir: 1, tone: "red" },
  { at: 112, dy: 44, dir: 1, tone: "amber" },
] as const;
type Impact = (typeof B_IMPACTS)[number];

const impactPoint = (im: Impact) => ({
  ix: SHIELD.cx - SHIELD.r - 12 - Math.abs(im.dy) * 0.2,
  iy: SHIELD.cy + im.dy,
});

// beat C — ten bunched packets slam the small site…
const SLAM_JITTER = [-10, 6, -4, 10, 0, -8, 8, -2, 4, -6];
const SLAM = SLAM_JITTER.map((dy, i) => ({ at: 146 + i * 3, dy }));
// …then the re-spaced cadence: wide apart, slow, teal
const CALM = [198, 216, 234, 252, 270, 288].map((at, i) => ({
  at,
  dy: i % 2 ? 8 : -8,
}));

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

const TealCheck: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: TEAL,
      display: "grid",
      placeItems: "center",
      flex: "none",
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 30 30">
      <path
        d="M7 15.5 L12.5 21 L23 9.5"
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/** A genuine Scrapy setting, docked as a chip: mark · setting line · teal ✓ */
const SettingChip: React.FC<{ label: string; at: number; cx: number; y: number }> = ({
  label,
  at,
  cx,
  y,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const e = spring({ frame: frame - at, fps, config: SPRINGS.bouncy });
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: y,
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        padding: "18px 28px",
        borderRadius: 999,
        background: C.card,
        border: `1.5px solid ${TEAL_LINE}`,
        boxShadow: "0 12px 30px rgba(25,23,20,0.08)",
        opacity: Math.min(1, e * 1.8),
        transform: `translateX(-50%) translateY(${(1 - e) * 28}px) scale(${
          0.85 + 0.15 * e
        })`,
      }}
    >
      <ScrapyMark size={38} />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 34,
          fontWeight: 700,
          color: C.ink2,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <TealCheck size={40} />
    </div>
  );
};

const HBar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  r?: number;
}> = ({ x, y, w, h, color, r }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: r ?? h / 2,
      background: color,
    }}
  />
);

// ---------------------------------------------------------------------------
// Beat 1 — robots.txt document card
// ---------------------------------------------------------------------------

const R_LINES = [
  { text: "User-agent: *", at: 6 },
  { text: "Crawl-delay: 10", at: 13 },
  { text: "Disallow: /private/", at: 20 },
] as const;
const CPF = 2.6;

const TypedLine: React.FC<{ text: string; at: number; y: number }> = ({
  text,
  at,
  y,
}) => {
  const frame = useCurrentFrame();
  const typed = useTypewriter(text, at, CPF);
  const typing = frame >= at && frame < at + text.length / CPF + 2;
  const caretOn = frame % 14 < 9;
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: y,
        fontFamily: MONO,
        fontSize: 38,
        fontWeight: 500,
        color: C.ink2,
        letterSpacing: -0.5,
        whiteSpace: "nowrap",
      }}
    >
      {typed}
      {typing ? (
        <span
          style={{
            display: "inline-block",
            width: 15,
            height: 36,
            marginLeft: 4,
            verticalAlign: "-5px",
            background: C.ink,
            opacity: caretOn ? 0.8 : 0.12,
          }}
        />
      ) : null}
    </div>
  );
};

const DocGlyph: React.FC = () => (
  <svg width="34" height="42" viewBox="0 0 34 42">
    <path
      d="M4 3 H22 L30 11 V39 H4 Z"
      fill="#FFFFFF"
      stroke={C.ink2}
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M22 3 V11 H30" fill="none" stroke={C.ink2} strokeWidth="2.6" strokeLinejoin="round" />
    <rect x="9" y="19" width="16" height="2.6" rx="1.3" fill={C.mutedSoft} />
    <rect x="9" y="25" width="12" height="2.6" rx="1.3" fill={C.mutedSoft} />
    <rect x="9" y="31" width="14" height="2.6" rx="1.3" fill={C.mutedSoft} />
  </svg>
);

const RobotsBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: SPRINGS.snappy });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: RA.x,
          top: RA.y,
          width: RA.w,
          height: RA.h,
          borderRadius: 26,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 26}px)`,
        }}
      >
        {/* header — file glyph + real filename */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: 92,
            borderBottom: `1.5px solid ${C.lineSoft}`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ position: "absolute", left: 36, top: 25 }}>
            <DocGlyph />
          </div>
          <span
            style={{
              position: "absolute",
              left: 92,
              top: 28,
              fontFamily: MONO,
              fontSize: 34,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: -0.5,
            }}
          >
            robots.txt
          </span>
        </div>
        {/* the file's real-format lines, typed quickly */}
        {R_LINES.map((l, i) => (
          <TypedLine key={l.text} text={l.text} at={l.at} y={122 + i * 68} />
        ))}
      </div>
      {/* Scrapy respects the file */}
      <SettingChip label={FACTS.settings.robots} at={T.chipA} cx={540} y={CHIP_A_Y} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — platform card + shield, deflecting a too-fast stream
// ---------------------------------------------------------------------------

const PlatformBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.cardB, fps, config: SPRINGS.snappy });
  const shieldIn = spring({ frame: frame - T.shieldIn, fps, config: SPRINGS.pop });

  // the shield takes each hit with a small bump
  let bump = 0;
  for (const im of B_IMPACTS) {
    bump = Math.max(
      bump,
      interpolate(frame, [im.at, im.at + 3, im.at + 11], [0, 1, 0], CLAMP),
    );
  }

  const postYs = [140, 300, 460];

  return (
    <>
      {/* the platform — generic feed with the real X mark as its identity */}
      <div
        style={{
          position: "absolute",
          left: PB.x,
          top: PB.y,
          width: PB.w,
          height: PB.h,
          borderRadius: 26,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 16px 38px rgba(25,23,20,0.07)",
          overflow: "hidden",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 26}px)`,
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 24,
            width: 64,
            height: 64,
            borderRadius: 16,
            background: TILE_BG,
            border: `1.5px solid ${C.line}`,
            boxSizing: "border-box",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Img
            src={staticFile(SCRAPY.logos.x)}
            style={{ width: 34, height: 34, display: "block" }}
          />
        </div>
        <HBar x={120} y={34} w={150} h={16} color={BAR_INK} />
        <HBar x={120} y={62} w={100} h={13} color={BAR_MUTED} />
        <HBar x={0} y={110} w={PB.w} h={2} color={C.lineSoft} r={0} />
        {/* feed rows */}
        {postYs.map((py, i) => (
          <div key={py}>
            <div
              style={{
                position: "absolute",
                left: 36,
                top: py + 10,
                width: 54,
                height: 54,
                borderRadius: 999,
                background: SKEL,
              }}
            />
            <HBar x={110} y={py + 18} w={250} h={15} color={BAR_INK} />
            <HBar x={110} y={py + 48} w={380} h={13} color={BAR_MUTED} />
            <HBar x={110} y={py + 76} w={330} h={13} color={BAR_MUTED} />
            {i < 2 ? (
              <HBar x={36} y={py + 126} w={488} h={2} color={C.lineSoft} r={0} />
            ) : null}
          </div>
        ))}
      </div>

      {/* rushed packets + deflections */}
      {B_IMPACTS.map((im) => (
        <PacketB key={im.at} im={im} />
      ))}
      {B_IMPACTS.map((im) => (
        <ImpactFx key={im.at} im={im} />
      ))}

      {/* the bot blocker — shield docked on the card edge */}
      <div
        style={{
          position: "absolute",
          left: SHIELD.cx - SHIELD.r,
          top: SHIELD.cy - SHIELD.r,
          width: SHIELD.r * 2,
          height: SHIELD.r * 2,
          borderRadius: 999,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxSizing: "border-box",
          boxShadow: "0 12px 30px rgba(25,23,20,0.12)",
          display: "grid",
          placeItems: "center",
          opacity: Math.min(1, shieldIn * 2),
          transform: `translateX(${3 * bump}px) scale(${
            (0.6 + 0.4 * shieldIn) * (1 + 0.05 * bump)
          })`,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 64 64">
          <path
            d="M32 7 L53 15 V31 C53 45 44 54 32 59 C20 54 11 45 11 31 V15 Z"
            fill={C.ink2}
          />
          <path
            d="M32 13 V53 C41.5 48.6 47.5 41.2 47.5 31.5 V19.2 Z"
            fill="#3A362F"
          />
        </svg>
      </div>
    </>
  );
};

const PacketB: React.FC<{ im: Impact }> = ({ im }) => {
  const frame = useCurrentFrame();
  const { ix, iy } = impactPoint(im);
  const t0 = im.at - 16;
  if (frame < t0 || frame > im.at + 18) return null;
  let x: number;
  let y: number;
  let rot = 0;
  let op = 1;
  if (frame < im.at) {
    const u = frame - t0;
    x = ix - 416 + 26 * u;
    y = iy;
  } else {
    const v = frame - im.at;
    x = ix - 17 * v;
    y = iy + im.dir * (9 * v - 0.2 * v * v);
    rot = im.dir * 22 * v;
    op = interpolate(v, [6, 15], [1, 0], CLAMP);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - 8,
        width: 34,
        height: 16,
        borderRadius: 8,
        background: PKT,
        opacity: op,
        transform: `rotate(${rot}deg)`,
      }}
    />
  );
};

const ImpactFx: React.FC<{ im: Impact }> = ({ im }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < im.at || frame > im.at + 20) return null;
  const v = frame - im.at;
  const { ix, iy } = impactPoint(im);
  const color = im.tone === "red" ? C.red : AMBER;
  const ringO = interpolate(v, [0, 2, 9], [0, 0.9, 0], CLAMP);
  const ringS = interpolate(v, [0, 9], [0.5, 1.7], CLAMP);
  const pop = spring({ frame: v, fps, config: SPRINGS.pop });
  const tickO = interpolate(v, [0, 2, 12, 18], [0, 1, 1, 0], CLAMP);
  const tickY = im.dir < 0 ? iy + 32 : iy - 62;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: ix - 24,
          top: iy - 24,
          width: 48,
          height: 48,
          borderRadius: 999,
          border: `3px solid ${color}`,
          boxSizing: "border-box",
          opacity: ringO,
          transform: `scale(${ringS})`,
        }}
      />
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: ix - 34,
          top: tickY,
          opacity: tickO,
          transform: `scale(${0.5 + 0.5 * pop})`,
        }}
      >
        <path
          d="M5 5 L19 19 M19 5 L5 19"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — the small site: slam → red meter → DOWNLOAD_DELAY → green
// ---------------------------------------------------------------------------

const meterColor = (lv: number) => {
  const t2 = Math.min(1, Math.max(0, (lv - 0.7) / 0.18));
  if (t2 > 0) return mix(AMBER_RGB, RED_RGB, t2);
  const t1 = Math.min(1, Math.max(0, (lv - 0.45) / 0.2));
  return mix(GREEN_RGB, AMBER_RGB, t1);
};

const Heartbeat: React.FC<{ color: string }> = ({ color }) => (
  <svg width="34" height="30" viewBox="0 0 34 30">
    <polyline
      points="2,16 9,16 13,6 18,24 22,11 25,16 32,16"
      fill="none"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SiteBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - T.cardC, fps, config: SPRINGS.snappy });

  // load: climbs under the slam, holds, sinks once the cadence changes
  const breathe =
    interpolate(frame, [204, 216], [0, 1], CLAMP) * 0.015 * Math.sin(frame / 6);
  const level =
    interpolate(frame, [144, 174, 182, 206], [0.24, 0.95, 0.95, 0.26], {
      ...CLAMP,
      easing: Easing.inOut(Easing.quad),
    }) + breathe;
  const color = meterColor(level);

  // 1–2px tremble while the meter is deep in the red
  const amt = interpolate(frame, [156, 164, 176, 186], [0, 1, 1, 0], CLAMP);
  const tx = Math.sin(frame * 2.9) * 1.8 * amt;
  const ty = Math.cos(frame * 2.3) * 1.2 * amt;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: SC.x,
          top: SC.y,
          width: SC.w,
          height: SC.h,
          borderRadius: 22,
          background: C.card,
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 14px 32px rgba(25,23,20,0.06)",
          opacity: enter,
          transform: `translate(${tx}px, ${(1 - enter) * 26 + ty}px)`,
        }}
      >
        {/* humble header */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 28,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: SKEL,
          }}
        />
        <HBar x={86} y={39} w={130} h={14} color={BAR_INK} />
        <HBar x={0} y={84} w={SC.w} h={2} color={C.lineSoft} r={0} />
        {/* thin content */}
        <HBar x={36} y={112} w={320} h={14} color={BAR_MUTED} />
        <HBar x={36} y={142} w={240} h={14} color={BAR_MUTED} />
        {/* load meter */}
        <div style={{ position: "absolute", left: 36, top: 222 }}>
          <Heartbeat color={color} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 84,
            top: 226,
            width: 396,
            height: 24,
            borderRadius: 999,
            background: TRACK_BG,
            border: `1.5px solid ${C.line}`,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 3,
              top: 3,
              width: Math.max(10, 387 * Math.min(1, Math.max(0.06, level))),
              height: 15,
              borderRadius: 999,
              background: color,
            }}
          />
        </div>
      </div>

      {/* bunched packets slam in */}
      {SLAM.map((p) => (
        <SlamPacket key={p.at} at={p.at} dy={p.dy} />
      ))}
      {/* then the re-spaced cadence — wide apart, slow, teal, absorbed gently */}
      {CALM.map((p) => (
        <CalmPacket key={p.at} at={p.at} dy={p.dy} />
      ))}

      <SettingChip label={FACTS.settings.delay} at={T.chipC} cx={540} y={CHIP_C_Y} />
    </>
  );
};

const SlamPacket: React.FC<{ at: number; dy: number }> = ({ at, dy }) => {
  const frame = useCurrentFrame();
  const t0 = at - 14;
  const y = SITE_Y + dy;
  if (frame < t0 || frame > at + 9) return null;
  const flying = frame < at;
  const u = frame - t0;
  const x = SC.x - 364 + 26 * Math.min(u, 14);
  const v = Math.max(0, frame - at);
  const ringO = interpolate(v, [0, 2, 8], [0, 0.85, 0], CLAMP);
  const ringS = interpolate(v, [0, 8], [0.5, 1.5], CLAMP);
  return (
    <>
      {flying ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y - 7,
            width: 30,
            height: 14,
            borderRadius: 7,
            background: PKT,
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            left: SC.x - 18,
            top: y - 18,
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `3px solid ${C.red}`,
            boxSizing: "border-box",
            opacity: ringO,
            transform: `scale(${ringS})`,
          }}
        />
      )}
    </>
  );
};

const CalmPacket: React.FC<{ at: number; dy: number }> = ({ at, dy }) => {
  const frame = useCurrentFrame();
  const t0 = at - 36;
  const y = SITE_Y + dy;
  if (frame < t0 || frame > at + 10) return null;
  const u = frame - t0;
  const x = SC.x - 434 + 12 * Math.min(u, 36);
  const v = Math.max(0, frame - at);
  const op = frame < at ? 1 : interpolate(v, [0, 4], [1, 0], CLAMP);
  const ringO = interpolate(v, [0, 2, 10], [0, 0.8, 0], CLAMP);
  const ringS = interpolate(v, [0, 10], [0.5, 1.4], CLAMP);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y - 6,
          width: 26,
          height: 12,
          borderRadius: 6,
          background: TEAL,
          opacity: op,
        }}
      />
      {v > 0 ? (
        <div
          style={{
            position: "absolute",
            left: SC.x - 15,
            top: y - 15,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: `2.5px solid ${TEAL}`,
            boxSizing: "border-box",
            opacity: ringO,
            transform: `scale(${ringS})`,
          }}
        />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const ScrPublicDataRules: React.FC = () => {
  // hold (type + chip) → descend to the platform → hold (deflections) →
  // descend to the small site → hold (slam, chip, recovery) → pull out →
  // settle on two near-identical keys
  const cam = useCam({
    keys: [0, T.camB, 58, T.camC, 140, T.camOut, 234, 262, 290],
    fx: [540, 540, 540, 540, 540, 540, 540, 540, 540],
    fy: [350, 350, 1510, 1510, 2790, 2790, 1553, 1553, 1555],
    z: [1.25, 1.25, 1.05, 1.05, 1.05, 1.05, 0.49, 0.49, 0.493],
  });

  return (
    <PaperWorld cam={cam}>
      <RobotsBeat />
      <PlatformBeat />
      <SiteBeat />
    </PaperWorld>
  );
};
