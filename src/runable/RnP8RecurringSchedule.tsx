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
import {
  ALTARI,
  ALTARI_FONT,
  ALTARI_GRID,
  CAROUSEL_SLIDES,
  FONT_SANS,
  RN,
  SPRINGS,
  UI,
} from "./theme";

// ============================================================================
// RnP8RecurringSchedule — 1080x1920 @ 30fps  (9:16)
// VO [0:36]: "But here's the real unlock. Put Runable on a recurring schedule,
// and it does this without you. Mine runs every morning: it designs the next
// carousel on its own, then reports back with the finished slides."
//
// One continuous world on Ahmed's ALTARI purple ground, camera travels down:
//   (1) the schedule gets SET   — the real Schedule Task dialog
//   (2) it RUNS on its own      — successive mornings fire in Scheduled Tasks
//   (3) it REPORTS BACK         — Ahmed's real carousel exports land
//
// The Schedule Task dialog is the SPONSOR'S REAL PRODUCT: it keeps Runable's
// authentic cream surfaces, black Save button, green notify state and verbatim
// strings from theme.ts UI.schedule. Geometry + colors for it were sampled from
// public/runable/reference/schedule-0{2,4,5}*.png. Everything AROUND it is
// Altari purple.
// ============================================================================

export const DURATION_IN_FRAMES = 290;

/* ------------------------------------------------------------- constants -- */

const ease = Easing.inOut(Easing.cubic);
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const eased = { easing: ease, ...clamp };

// --- Runable's real dialog palette (sampled from schedule-05-daily-final.png)
const CARD = "#F9F6F4"; // dialog / popover surface  rgb(249,246,244)
const INK_TEXT = RN.textWarm; // rgb(59,47,37) — dialog body text is warm, not black
const HAIR = "rgba(0,0,0,0.10)";
const HAIR_SOFT = "rgba(0,0,0,0.06)";
// light panel floating on a dark ground — ambient depth, not a warm drop shadow
const CARD_SHADOW =
  "0 30px 90px rgba(0,0,0,0.55), 0 0 150px rgba(91,94,194,0.30)";
const POP_SHADOW = "0 20px 54px rgba(0,0,0,0.50)";

// --- Altari surfaces
const ROW_BG = "rgba(20,20,38,0.62)";
const GRID_LINE = "rgba(165,167,217,0.055)";
const CARD_GRID_LINE = "rgba(165,167,217,0.045)";

const INSTRUCTION =
  "Design tomorrow's Instagram carousel for @alassafi.ai in my saved brand style, then send me the finished slides.";

/* ------------------------------------------------------------- the world -- */

const WORLD_W = 1080;
const WORLD_H = 5100;

// --- Region A: the Schedule Task dialog (Runable's real UI) -----------------
// x = 54 = safePadX(1080): the dialog is exactly the 5%-safe content column,
// which is why the camera never pushes past z = 1.05 while it is on screen.
const D = { x: 54, y: 400, w: 972, h: 1046 };
const DPAD = 34;
const CX0 = D.x + DPAD; //  88  content left  (world)
const CX1 = D.x + D.w - DPAD; // 992 content right (world)

const dy = (v: number) => D.y + v; // dialog-local y → world y

const TA = { y0: dy(186), y1: dy(406) }; // textarea
const CTRL = { y0: dy(486), y1: dy(578) }; // schedule / date / time row
const NOTI = { y0: dy(660), y1: dy(752) }; // notify boxes
const BTN = { y0: dy(920), y1: dy(1012) }; // cancel / save

const SEL = { x0: 88, x1: 376 };
const DATE = { x0: 390, x1: 652 };
const TIME = { x0: 666, x1: 886 };
const GMT_X = 900;

const HALF_L = { x0: 88, x1: 532 }; // Email / Cancel
const HALF_R = { x0: 548, x1: 992 }; // Mobile App / Save

// recurrence popover — a floating menu, so it runs a little wider than its trigger
const DD = { x0: 88, x1: 470, y0: CTRL.y1 + 20, rowH: 82, pad: 14 };
const DD_Y1 = DD.y0 + DD.pad * 2 + UI.schedule.options.length * DD.rowH;
const ddRowY = (i: number) => DD.y0 + DD.pad + i * DD.rowH;

// --- Region B: Scheduled Tasks panel ---------------------------------------
const P = { x: 190, y: 1560, w: 700, h: 1070 };
const PPAD = 36;
const ENTRY = { x: P.x + PPAD, y: P.y + 128, w: P.w - PPAD * 2, h: 220 };
const RUN_H = 200;
const RUN_Y = [P.y + 380, P.y + 600, P.y + 820];
const THUMB_X = P.x + P.w - PPAD - 30 - 120;

const RUNS = [
  { date: "Wed, Aug 27", t: 179, slide: CAROUSEL_SLIDES[0] },
  { date: "Thu, Aug 28", t: 188, slide: CAROUSEL_SLIDES[3] },
  { date: "Fri, Aug 29", t: 197, slide: CAROUSEL_SLIDES[6] },
];

// --- Region C: it reports back with the finished slides ---------------------
const G = { x: 90, y: 3000, w: 900, h: 1624 };
const SL_W = 288;
const SL_H = 360; // 1080x1350 → 4:5, exact
const SL_GAP = 18;
const GRID_ROWS = [2, 3, 3, 2]; // ten real exports, symmetric block

const slideSlots = (() => {
  const out: { x: number; y: number }[] = [];
  GRID_ROWS.forEach((n, r) => {
    const rowW = n * SL_W + (n - 1) * SL_GAP;
    const x0 = G.x + (G.w - rowW) / 2;
    for (let c = 0; c < n; c++) {
      out.push({
        x: x0 + c * (SL_W + SL_GAP),
        y: G.y + 130 + r * (SL_H + SL_GAP),
      });
    }
  });
  return out;
})();

/* ---------------------------------------------------------------- camera -- */
// hold(typing) → pan → hold(recurrence) → pan → hold(notify) → pull → hold(save)
// → travel → hold(mornings) → travel → settle(delivered slides) → end hold.
// z is pinned to 1.00 while the dialog is on screen: the dialog is exactly the
// 972px safe column, so at 1.00 the card itself lands on x = 54 → 1026 and
// every label sits well inside. Any push past that would breach the margin.
// The last travel pulls the zoom out FIRST (216→226) and only then covers the
// distance (226→240), so the delivered slides are never wider than the frame
// while they are entering it.
const KEY_T = [0, 26, 42, 92, 108, 124, 138, 156, 176, 216, 226, 240, 278, 289];
const KEY_FX = [
  540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540,
];
const KEY_FY = [
  900, 900, 1020, 1020, 1165, 1165, 1320, 1320, 2095, 2095, 2900, 3812, 3812,
  3812,
];
const KEY_Z = [
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.72, 0.72, 1.389, 1.389, 0.9, 0.88, 0.85, 0.85,
];

/* ---------------------------------------------------------------- cursor -- */

type Pt = { x: number; y: number };

const CURSOR_KEYS: { t: number; p: Pt }[] = [
  { t: 0, p: { x: 860, y: 748 } },
  { t: 42, p: { x: 860, y: 748 } },
  { t: 48, p: { x: 240, y: 940 } }, // Schedule select
  { t: 52, p: { x: 240, y: 940 } },
  { t: 58, p: { x: 210, y: ddRowY(0) + 41 } }, // "Once"
  { t: 60, p: { x: 210, y: ddRowY(0) + 41 } },
  { t: 67, p: { x: 210, y: ddRowY(1) + 41 } }, // "Daily"
  { t: 86, p: { x: 210, y: ddRowY(1) + 41 } },
  { t: 100, p: { x: 240, y: 1210 } },
  { t: 110, p: { x: 154, y: 1118 } }, // Email checkbox
  { t: 128, p: { x: 154, y: 1118 } },
  { t: 142, p: { x: 770, y: 1372 } }, // Save
];

const cursorAt = (frame: number): Pt => {
  if (frame <= CURSOR_KEYS[0].t) return CURSOR_KEYS[0].p;
  for (let i = CURSOR_KEYS.length - 1; i >= 0; i--) {
    if (frame >= CURSOR_KEYS[i].t) {
      if (i === CURSOR_KEYS.length - 1) return CURSOR_KEYS[i].p;
      const a = CURSOR_KEYS[i];
      const b = CURSOR_KEYS[i + 1];
      const p = interpolate(frame, [a.t, b.t], [0, 1], eased);
      return { x: a.p.x + (b.p.x - a.p.x) * p, y: a.p.y + (b.p.y - a.p.y) * p };
    }
  }
  return CURSOR_KEYS[0].p;
};

const CLICKS = [48, 68, 112, 146];

/* ----------------------------------------------------------------- atoms -- */

const GridOverlay: React.FC<{
  size: number;
  line: string;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ size, line, radius = 0, style }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      ...style,
    }}
  />
);

const Chevron: React.FC<{ size?: number; color?: string; rot?: number }> = ({
  size = 26,
  color = RN.muted,
  rot = 0,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ transform: `rotate(${rot}deg)`, flex: "none" }}
  >
    <path
      d="M6 9.5 L12 15.5 L18 9.5"
      stroke={color}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <rect
      x={3}
      y={4.5}
      width={18}
      height={16}
      rx={4}
      stroke={INK_TEXT}
      strokeWidth={1.8}
      fill="none"
    />
    <path d="M3 9.5 H21" stroke={INK_TEXT} strokeWidth={1.8} strokeLinecap="round" />
    <path d="M8 2.8 V6.2 M16 2.8 V6.2" stroke={INK_TEXT} strokeWidth={1.8} strokeLinecap="round" />
    <rect x={7} y={12.5} width={3.2} height={3.2} rx={1} fill={RN.amber} />
  </svg>
);

const DownloadIcon: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <rect x={3} y={3} width={18} height={18} rx={5} stroke={RN.muted} strokeWidth={1.6} fill="none" />
    <path
      d="M12 7.5 V15 M8.5 11.8 L12 15.3 L15.5 11.8"
      stroke={RN.muted}
      strokeWidth={1.7}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TickPath: React.FC<{ p: number; size: number; color: string }> = ({ p, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <path
      d="M4.5 12.6 L9.7 17.8 L19.5 6.6"
      stroke={color}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - Math.min(1, Math.max(0, p))}
    />
  </svg>
);

// square checkbox — black fill + white tick when on (matches the real dialog)
const CheckBox: React.FC<{ p: number; size?: number }> = ({ p, size = 38 }) => {
  const on = p > 0.02;
  const pop = 1 + 0.18 * Math.sin(Math.min(1, p) * Math.PI);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: on ? "none" : "2.4px solid rgba(0,0,0,0.28)",
        backgroundColor: on ? RN.ink : "transparent",
        transform: `scale(${on ? pop : 1})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      {on ? <TickPath p={p} size={size * 0.72} color="#FFFFFF" /> : null}
    </div>
  );
};

const Field: React.FC<{
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x0, x1, y0, y1, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x0,
      top: y0,
      width: x1 - x0,
      height: y1 - y0,
      borderRadius: 18,
      border: `2px solid ${HAIR}`,
      display: "flex",
      alignItems: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{
  x: number;
  cy: number;
  size?: number;
  color?: string;
  weight?: number;
  font?: string;
  children: React.ReactNode;
}> = ({ x, cy, size = 34, color = INK_TEXT, weight = 400, font, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: cy - size,
      height: size * 2,
      display: "flex",
      alignItems: "center",
      fontSize: size,
      fontWeight: weight,
      color,
      fontFamily: font,
      whiteSpace: "nowrap",
      letterSpacing: -0.2,
    }}
  >
    {children}
  </div>
);

/* ----------------------------------------------------------- composition -- */

export const RnP8RecurringSchedule: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fx = interpolate(frame, KEY_T, KEY_FX, eased);
  const fy = interpolate(frame, KEY_T, KEY_FY, eased);
  const z = interpolate(frame, KEY_T, KEY_Z, eased);

  const spr = (
    t0: number,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.snappy,
    dur = 26,
  ) => (frame < t0 ? 0 : spring({ frame: frame - t0, fps, config, durationInFrames: dur }));

  /* ---- movement 1: the schedule gets set ---- */

  // opens partly typed, finishes on camera
  const typed = Math.round(interpolate(frame, [0, 22], [76, INSTRUCTION.length], clamp));
  const typingNow = frame < 22;
  const caretOn = frame < 44 && (typingNow ? frame % 12 < 7 : frame % 30 < 16);

  // recurrence popover
  const ddOpen = spr(48, SPRINGS.snappy, 14);
  const ddClose = interpolate(frame, [72, 80], [0, 1], eased);
  const ddShow = Math.min(1, ddOpen) * (1 - ddClose);
  const ddChevron =
    interpolate(frame, [48, 51], [0, 1], clamp) * interpolate(frame, [73, 76], [1, 0], clamp);
  const hoverY = interpolate(frame, [58, 66], [ddRowY(0), ddRowY(1)], eased);
  const hoverOn = interpolate(frame, [52, 56], [0, 1], clamp) * (1 - ddClose);
  const pickedOnce = interpolate(frame, [68, 72], [1, 0], eased);
  const pickedDaily = spr(68, SPRINGS.snappy, 16);
  // sequenced, not crossfaded: the old value is gone before the new one arrives,
  // so the field never double-exposes on the frame the selection lands
  const fieldOnce = interpolate(frame, [68, 71], [1, 0], eased);
  const fieldDaily = interpolate(frame, [71, 76], [0, 1], eased);

  // notify
  const emailOn = spr(112, SPRINGS.bouncy, 22);
  const dotP = spr(116, SPRINGS.bouncy, 24);

  // save + dismiss
  const pressP = spr(146, SPRINGS.snappy, 16);
  const press = Math.sin(Math.min(1, pressP) * Math.PI);
  const dismiss = interpolate(frame, [150, 166], [0, 1], eased);
  const dialogAlive = frame < 170;

  // the app behind the modal comes back up as the dialog resolves
  const behind = interpolate(frame, [148, 174], [0.34, 1], eased);

  /* ---- movement 2: it runs on its own ---- */
  const fly = interpolate(frame, [156, 176], [0, 1], eased);

  /* ---- movement 3: it reports back ---- */
  // the slides are already rising as the camera arrives, so the travel between
  // the panel and the payoff never lands on an empty frame
  const regionC = interpolate(frame, [220, 232], [0, 1], clamp);

  /* ---- cursor ---- */
  const cur = cursorAt(frame);
  const curAlive = frame < 162;
  const curFade =
    interpolate(frame, [0, 6], [0, 1], clamp) * interpolate(frame, [150, 162], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: ALTARI.bg, fontFamily: ALTARI_FONT.body }}>
      {/* opaque Altari ground, full-bleed, frame 0 → last */}
      <AbsoluteFill style={{ backgroundColor: ALTARI.bg }} />

      <div
        style={{
          position: "absolute",
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* ---------- backdrop: brand wash + 64px grid, oversized so it covers
             every framing the camera reaches. The wash also keeps the ground
             clear of the near-black luma threshold at every camera position. */}
        <div
          style={{
            position: "absolute",
            left: -420,
            top: -320,
            width: WORLD_W + 840,
            height: WORLD_H + 640,
            backgroundImage:
              "linear-gradient(168deg, rgba(91,94,194,0.16) 0%, rgba(61,44,141,0.10) 34%, rgba(91,94,194,0.15) 62%, rgba(61,44,141,0.13) 100%)",
          }}
        >
          <GridOverlay size={ALTARI_GRID.backdrop} line={GRID_LINE} />
        </div>

        {/* ---------- ambient glows anchoring each movement ---------- */}
        <div
          style={{
            position: "absolute",
            left: D.x + D.w / 2 - 900,
            top: D.y + D.h / 2 - 900,
            width: 1800,
            height: 1800,
            background:
              "radial-gradient(circle, rgba(91,94,194,0.30) 0%, rgba(91,94,194,0.10) 42%, rgba(91,94,194,0) 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: P.x + P.w / 2 - 820,
            top: P.y + P.h / 2 - 820,
            width: 1640,
            height: 1640,
            background:
              "radial-gradient(circle, rgba(91,94,194,0.22) 0%, rgba(61,44,141,0.10) 45%, rgba(91,94,194,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: G.x + G.w / 2 - 1000,
            top: G.y + G.h / 2 - 1000,
            width: 2000,
            height: 2000,
            background:
              "radial-gradient(circle, rgba(91,94,194,0.24) 0%, rgba(61,44,141,0.10) 46%, rgba(91,94,194,0) 70%)",
            opacity: regionC,
          }}
        />

        {/* ================= Scheduled Tasks panel (behind the modal) ===== */}
        <div style={{ opacity: behind }}>
          <div
            style={{
              position: "absolute",
              left: P.x,
              top: P.y,
              width: P.w,
              height: P.h,
              backgroundColor: ALTARI.card,
              borderRadius: 26,
              border: `2px solid ${ALTARI.border}`,
              overflow: "hidden",
            }}
          >
            <GridOverlay size={ALTARI_GRID.card} line={CARD_GRID_LINE} />
          </div>
          <Label
            x={P.x + PPAD}
            cy={P.y + 56}
            size={32}
            weight={600}
            color={ALTARI.heading}
            font={ALTARI_FONT.heading}
          >
            Scheduled Tasks
          </Label>
          <div
            style={{
              position: "absolute",
              left: P.x + P.w - PPAD - 44,
              top: P.y + 34,
              width: 44,
              height: 44,
              borderRadius: 22,
              border: `2px solid ${ALTARI.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              color: ALTARI.body,
            }}
          >
            +
          </div>
          <div
            style={{
              position: "absolute",
              left: P.x + PPAD,
              top: P.y + 100,
              width: P.w - PPAD * 2,
              height: 2,
              backgroundColor: ALTARI.border,
            }}
          />

          {/* ---------- successive mornings, firing with no cursor ---------- */}
          {RUNS.map((r, i) => {
            const inP = spr(r.t, SPRINGS.snappy, 22);
            if (inP <= 0.001) return null;
            const prog = interpolate(frame, [r.t + 2, r.t + 10], [0, 1], eased);
            const thumbP = spr(r.t + 9, SPRINGS.bouncy, 22);
            const tickP = interpolate(frame, [r.t + 11, r.t + 19], [0, 1], eased);
            const ring = interpolate(frame, [r.t, r.t + 20], [0, 1], clamp);
            const barFade = 1 - Math.max(0, Math.min(1, (thumbP - 0.45) * 2.4));
            const y = RUN_Y[i];
            const lift = 26 * (1 - inP);
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: P.x + PPAD,
                    top: y,
                    width: P.w - PPAD * 2,
                    height: RUN_H,
                    backgroundColor: ROW_BG,
                    border: `1.5px solid ${ALTARI.border}`,
                    borderRadius: 18,
                    opacity: inP,
                    transform: `translateY(${lift}px)`,
                  }}
                />
                {/* morning marker + date */}
                <div
                  style={{
                    position: "absolute",
                    left: P.x + PPAD + 30,
                    top: y + 34,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    opacity: inP,
                    transform: `translateY(${lift}px)`,
                  }}
                >
                  <div style={{ position: "relative", width: 22, height: 22, flex: "none" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: -15,
                        top: -15,
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        background:
                          "radial-gradient(circle, rgba(123,125,214,0.45) 0%, rgba(123,125,214,0) 70%)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 11,
                        backgroundColor: ALTARI.primaryLight,
                      }}
                    />
                    {ring > 0 && ring < 1 ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 11 - 11 * (1 + ring * 2.4),
                          top: 11 - 11 * (1 + ring * 2.4),
                          width: 22 * (1 + ring * 2.4),
                          height: 22 * (1 + ring * 2.4),
                          borderRadius: "50%",
                          border: `2.5px solid rgba(123,125,214,${0.6 * (1 - ring)})`,
                        }}
                      />
                    ) : null}
                  </div>
                  <span
                    style={{
                      fontSize: 32,
                      color: ALTARI.heading,
                      fontWeight: 600,
                      fontFamily: ALTARI_FONT.heading,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.date}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: P.x + PPAD + 68,
                    top: y + 86,
                    fontSize: 26,
                    color: ALTARI.body,
                    opacity: inP,
                    fontVariantNumeric: "tabular-nums",
                    transform: `translateY(${lift}px)`,
                  }}
                >
                  7:00 AM
                </div>
                {/* build progress → finished artifact */}
                <div
                  style={{
                    position: "absolute",
                    left: P.x + PPAD + 68,
                    top: y + 140,
                    width: 250,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    opacity: inP * barFade,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: P.x + PPAD + 68,
                    top: y + 140,
                    width: 250 * prog,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: ALTARI.primaryLight,
                    boxShadow: `0 0 16px rgba(123,125,214,${0.55 * barFade})`,
                    opacity: inP * barFade,
                  }}
                />
                {/* the slide it produced */}
                <div
                  style={{
                    position: "absolute",
                    left: THUMB_X,
                    top: y + 25,
                    width: 120,
                    height: 150,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#0A0A0A",
                    border: "1.5px solid rgba(165,167,217,0.20)",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
                    opacity: Math.min(1, thumbP * 1.6),
                    transform: `scale(${0.7 + 0.3 * Math.min(1, thumbP)})`,
                  }}
                >
                  <Img
                    src={staticFile(r.slide)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: THUMB_X + 120 - 30,
                    top: y + 25 - 14,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: ALTARI.stampGreen,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 22px rgba(16,185,129,0.45)",
                    opacity: Math.min(1, tickP * 2),
                    transform: `scale(${0.6 + 0.4 * Math.min(1, tickP * 2)})`,
                  }}
                >
                  <TickPath p={tickP} size={26} color="#FFFFFF" />
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* ================= region C — it reports back =================== */}
        {regionC > 0 ? (
          <div style={{ opacity: regionC }}>
            {/* the channel it reported on + the run it came from */}
            <div
              style={{
                position: "absolute",
                left: G.x,
                top: G.y,
                width: G.w,
                height: 96,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  backgroundColor: ALTARI.card,
                  border: `2px solid ${ALTARI.border}`,
                  borderRadius: 999,
                  padding: "14px 30px",
                  fontSize: 32,
                  color: ALTARI.heading,
                  fontFamily: ALTARI_FONT.heading,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: ALTARI.onlineGreen,
                    boxShadow: "0 0 18px rgba(74,222,128,0.6)",
                  }}
                />
                {UI.schedule.notify[0]}
              </div>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  fontSize: 30,
                  color: ALTARI.body,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                Fri, Aug 29 · 7:00 AM
              </div>
            </div>

            {/* Ahmed's real exports landing */}
            {CAROUSEL_SLIDES.map((s, i) => {
              const p = spr(230 + i * 2, SPRINGS.snappy, 24);
              if (p <= 0.001) return null;
              const slot = slideSlots[i];
              const tilt = (i % 2 === 0 ? -1 : 1) * 2.4 * (1 - p);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: slot.x,
                    top: slot.y,
                    width: SL_W,
                    height: SL_H,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: "#0A0A0A",
                    border: "1.5px solid rgba(165,167,217,0.18)",
                    boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
                    opacity: Math.min(1, p * 1.8),
                    transform: `translateY(${68 * (1 - p)}px) scale(${
                      0.9 + 0.1 * Math.min(1, p)
                    }) rotate(${tilt}deg)`,
                  }}
                >
                  <Img
                    src={staticFile(s)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {/* ================= region A — Runable's real Schedule Task dialog */}
        {dialogAlive ? (
          <div
            style={{
              opacity: 1 - dismiss,
              transform: `scale(${1 - 0.06 * dismiss})`,
              transformOrigin: `${D.x + D.w / 2}px ${D.y + D.h * 0.62}px`,
              fontFamily: FONT_SANS,
            }}
          >
            {/* card */}
            <div
              style={{
                position: "absolute",
                left: D.x,
                top: D.y,
                width: D.w,
                height: D.h,
                backgroundColor: CARD,
                borderRadius: 28,
                boxShadow: CARD_SHADOW,
              }}
            />

            {/* title + close */}
            <Label x={CX0} cy={dy(62)} size={46} weight={500}>
              {UI.schedule.title}
            </Label>
            <div
              style={{
                position: "absolute",
                left: CX1 - 60,
                top: dy(32),
                width: 60,
                height: 60,
                borderRadius: 30,
                border: `2px solid ${HAIR}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24">
                <path d="M6 6 L18 18 M18 6 L6 18" stroke={INK_TEXT} strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>

            {/* Instructions */}
            <Label x={CX0} cy={dy(152)}>
              {UI.schedule.instructionsLabel}
            </Label>
            <Field x0={CX0} x1={CX1} y0={TA.y0} y1={TA.y1} style={{ alignItems: "flex-start" }}>
              <div
                style={{
                  padding: "28px 30px",
                  fontSize: 36,
                  lineHeight: "50px",
                  color: INK_TEXT,
                  letterSpacing: -0.2,
                }}
              >
                {INSTRUCTION.slice(0, typed)}
                {caretOn ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: 3,
                      height: 38,
                      verticalAlign: "-6px",
                      marginLeft: 2,
                      backgroundColor: INK_TEXT,
                    }}
                  />
                ) : null}
              </div>
            </Field>
            {/* resize grip, as in the real textarea */}
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              style={{ position: "absolute", left: CX1 - 28, top: TA.y1 - 28 }}
            >
              <path
                d="M18 8 L8 18 M18 14 L14 18"
                stroke="rgba(0,0,0,0.22)"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </svg>

            {/* Schedule / Time */}
            <Label x={CX0} cy={dy(452)}>
              {UI.schedule.scheduleLabel}
            </Label>
            <Label x={TIME.x0} cy={dy(452)}>
              {UI.schedule.timeLabel}
            </Label>

            {/* recurrence select */}
            <Field
              x0={SEL.x0}
              x1={SEL.x1}
              y0={CTRL.y0}
              y1={CTRL.y1}
              style={{
                justifyContent: "space-between",
                padding: "0 24px",
                borderColor: ddShow > 0.05 ? "rgba(0,0,0,0.24)" : HAIR,
              }}
            >
              <div style={{ position: "relative", height: 44, display: "flex", alignItems: "center", flex: 1 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    fontSize: 32,
                    color: INK_TEXT,
                    opacity: fieldOnce,
                    transform: `translateY(${-10 * (1 - fieldOnce)}px)`,
                  }}
                >
                  {UI.schedule.options[0]}
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    fontSize: 32,
                    color: INK_TEXT,
                    fontWeight: 500,
                    opacity: fieldDaily,
                    transform: `translateY(${12 * (1 - fieldDaily)}px)`,
                  }}
                >
                  {UI.schedule.options[1]}
                </span>
              </div>
              <Chevron size={28} color={INK_TEXT} rot={180 * ddChevron} />
            </Field>

            {/* date */}
            <Field x0={DATE.x0} x1={DATE.x1} y0={CTRL.y0} y1={CTRL.y1} style={{ padding: "0 22px" }}>
              <CalendarIcon size={30} />
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 28,
                  color: INK_TEXT,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                08/27/2026
              </span>
            </Field>

            {/* time */}
            <Field
              x0={TIME.x0}
              x1={TIME.x1}
              y0={CTRL.y0}
              y1={CTRL.y1}
              style={{ padding: "0 22px", justifyContent: "space-between" }}
            >
              <span
                style={{
                  fontSize: 30,
                  color: INK_TEXT,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                7:00 AM
              </span>
              <Chevron size={26} color={INK_TEXT} />
            </Field>

            <Label x={GMT_X} cy={dy(532)} size={28} color={RN.muted}>
              {UI.schedule.tz}
            </Label>

            {/* Notify me on */}
            <Label x={CX0} cy={dy(626)}>
              {UI.schedule.notifyLabel}
            </Label>
            <Field
              x0={HALF_L.x0}
              x1={HALF_L.x1}
              y0={NOTI.y0}
              y1={NOTI.y1}
              style={{
                padding: "0 26px",
                backgroundColor: emailOn > 0.05 ? RN.hover : "transparent",
                borderColor:
                  emailOn > 0.05 ? `rgba(29,162,90,${0.32 * Math.min(1, emailOn)})` : HAIR,
              }}
            >
              <CheckBox p={emailOn} />
              <span style={{ marginLeft: 22, fontSize: 32, color: INK_TEXT }}>
                {UI.schedule.notify[0]}
              </span>
              <div style={{ flex: 1 }} />
              <div style={{ position: "relative", width: 18, height: 18 }}>
                {dotP > 0 && dotP < 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 9 - 9 * (1 + dotP * 2.6),
                      top: 9 - 9 * (1 + dotP * 2.6),
                      width: 18 * (1 + dotP * 2.6),
                      height: 18 * (1 + dotP * 2.6),
                      borderRadius: "50%",
                      border: `2.5px solid rgba(29,162,90,${0.6 * (1 - dotP)})`,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 9,
                    backgroundColor: RN.green,
                    transform: `scale(${Math.min(1, dotP * 1.4)})`,
                  }}
                />
              </div>
            </Field>
            <Field x0={HALF_R.x0} x1={HALF_R.x1} y0={NOTI.y0} y1={NOTI.y1} style={{ padding: "0 26px" }}>
              <CheckBox p={0} />
              <span style={{ marginLeft: 22, fontSize: 32, color: INK_TEXT }}>
                {UI.schedule.notify[1]}
              </span>
              <div style={{ flex: 1 }} />
              <DownloadIcon size={30} />
            </Field>

            {/* show more / more settings */}
            <div
              style={{
                position: "absolute",
                left: CX0,
                top: dy(778),
                height: 44,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 30,
                color: RN.muted,
              }}
            >
              Show more
              <Chevron size={24} />
            </div>
            <Label x={CX0} cy={dy(876)} size={32}>
              More Settings
            </Label>
            <div style={{ position: "absolute", left: CX1 - 26, top: dy(862) }}>
              <Chevron size={28} color={RN.muted} rot={-90} />
            </div>

            {/* cancel / save */}
            <Field x0={HALF_L.x0} x1={HALF_L.x1} y0={BTN.y0} y1={BTN.y1} style={{ justifyContent: "center" }}>
              <span style={{ fontSize: 34, color: INK_TEXT }}>{UI.schedule.cancel}</span>
            </Field>
            <div
              style={{
                position: "absolute",
                left: HALF_R.x0,
                top: BTN.y0,
                width: HALF_R.x1 - HALF_R.x0,
                height: BTN.y1 - BTN.y0,
                borderRadius: 18,
                backgroundColor: RN.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${1 - 0.03 * press})`,
                boxShadow: `0 0 ${40 * press}px rgba(123,125,214,0.55)`,
              }}
            >
              <span style={{ fontSize: 34, color: "#FFFFFF", fontWeight: 500 }}>
                {UI.schedule.save}
              </span>
            </div>

            {/* ---------- recurrence popover ---------- */}
            {ddShow > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: DD.x0,
                  top: DD.y0,
                  width: DD.x1 - DD.x0,
                  height: (DD_Y1 - DD.y0) * ddShow,
                  backgroundColor: "#FCFAF8",
                  borderRadius: 20,
                  border: `2px solid ${HAIR_SOFT}`,
                  boxShadow: POP_SHADOW,
                  overflow: "hidden",
                  opacity: Math.min(1, ddShow * 6),
                  transform: `translateY(${-10 * (1 - ddShow)}px)`,
                  transformOrigin: "top center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    top: hoverY - DD.y0,
                    width: DD.x1 - DD.x0 - 16,
                    height: DD.rowH,
                    borderRadius: 14,
                    backgroundColor: RN.hover,
                    opacity: hoverOn,
                  }}
                />
                {UI.schedule.options.map((opt, i) => {
                  const sel = i === 0 ? pickedOnce : i === 1 ? pickedDaily : 0;
                  return (
                    <div
                      key={opt}
                      style={{
                        position: "absolute",
                        left: 24,
                        top: ddRowY(i) - DD.y0,
                        width: DD.x1 - DD.x0 - 48,
                        height: DD.rowH,
                        display: "flex",
                        alignItems: "center",
                        fontSize: 38,
                        color: INK_TEXT,
                        fontWeight: i === 1 && pickedDaily > 0.3 ? 600 : 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt}
                      <div style={{ flex: 1 }} />
                      <div
                        style={{
                          opacity: Math.min(1, sel * 1.6),
                          transform: `scale(${0.7 + 0.3 * Math.min(1, sel * 1.6)})`,
                        }}
                      >
                        <TickPath p={Math.min(1, sel * 1.4)} size={34} color={INK_TEXT} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ---- the saved entry, dropping out of the dialog into the panel --- */}
        {fly > 0 ? (
          <div
            style={{
              position: "absolute",
              left: ENTRY.x,
              top: ENTRY.y,
              width: ENTRY.w,
              height: ENTRY.h,
              backgroundColor: ALTARI.bgAlt,
              borderRadius: 20,
              border: "2px solid rgba(123,125,214,0.55)",
              boxShadow: `0 ${14 + 30 * (1 - fly)}px ${
                30 + 50 * (1 - fly)
              }px rgba(0,0,0,0.5), 0 0 ${34 + 40 * (1 - fly)}px rgba(91,94,194,0.35)`,
              opacity: Math.min(1, fly * 3),
              transform: `translateY(${-(ENTRY.y + ENTRY.h / 2 - 1330) * (1 - fly)}px) scale(${
                0.66 + 0.34 * fly
              })`,
              transformOrigin: "center center",
              padding: "26px 30px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <GridOverlay size={ALTARI_GRID.card} line={CARD_GRID_LINE} />
            <div
              style={{
                position: "relative",
                fontSize: 26,
                lineHeight: "36px",
                color: ALTARI.body,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxHeight: 72,
              }}
            >
              {INSTRUCTION}
            </div>
            <div
              style={{
                position: "relative",
                marginTop: 26,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 24,
                color: ALTARI.body,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span
                style={{
                  backgroundColor: "rgba(91,94,194,0.28)",
                  color: ALTARI.primaryLight,
                  borderRadius: 999,
                  padding: "7px 20px",
                  fontWeight: 700,
                }}
              >
                {UI.schedule.options[1]}
              </span>
              <span>7:00 AM</span>
              <span>{UI.schedule.tz}</span>
            </div>
            <div
              style={{
                position: "absolute",
                right: 26,
                top: 26,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: ALTARI.onlineGreen,
                boxShadow: "0 0 16px rgba(74,222,128,0.6)",
                opacity: Math.min(1, fly * 2),
              }}
            />
          </div>
        ) : null}

        {/* ================= cursor (only while a human is driving) ======= */}
        {curAlive && curFade > 0.01 ? (
          <>
            {CLICKS.map((t) => {
              const p = interpolate(frame, [t, t + 14], [0, 1], clamp);
              if (p <= 0 || p >= 1) return null;
              const s = 76 * (0.15 + 1.15 * p);
              const c = cursorAt(t);
              return (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    left: c.x - s / 2 + 4,
                    top: c.y - s / 2 + 6,
                    width: s,
                    height: s,
                    borderRadius: "50%",
                    border: `3px solid rgba(60,45,35,${0.3 * (1 - p) * (1 - p)})`,
                  }}
                />
              );
            })}
            <svg
              width={44}
              height={54}
              viewBox="0 0 24 30"
              style={{
                position: "absolute",
                left: cur.x,
                top: cur.y,
                opacity: curFade,
                filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.4))",
              }}
            >
              <path
                d="M3 2 L3 22.5 L8.2 17.8 L11.6 25.6 L15.2 24 L11.9 16.4 L18.6 16 Z"
                fill={RN.ink}
                stroke="#FFFFFF"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
