/**
 * S2cHookOnlyTool — beat 1 (1080×1080, 110f).
 * VO: "This might be the only tool you need to build websites from now on."
 *
 * ONE tool → a website builds itself.
 *   f0–25   tight on the real `//` mark, settling on paper (soft spring)
 *   f25–43  single 18f pull-back reveals a browser Card below — empty chrome
 *   f43–95  the page assembles inside the browser: nav slides in, skeleton
 *           blocks stagger in, then snap to real fills (ink + #2563EB)
 *   f95–110 end hold, two near-identical camera keys (micro drift)
 *
 * No VO text on screen — only genuine UI: the URL and button glyphs.
 */
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
  LogoImg,
  MONO,
  PaperWorld,
  S2C,
  S2cMark,
  SPRINGS,
  useCam,
} from "./kit";

export const DURATION_IN_FRAMES = 110;

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const EASE_OUT = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// World geometry (canvas 1080×1080, camera z=1 at the final framing)
// ---------------------------------------------------------------------------

const MARK = { cx: 540, cy: 160, size: 150 };
const B = { x: 90, y: 290, w: 900, h: 640 }; // browser card, x 90…990 (safe)
const CHROME_H = 78;
const NAV_H = 68;
const PAD = 56; // page inner padding

const SKELETON = "#ECE7DE";
const LINK_BAR = "#E0DACE";

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const T = {
  reveal: 24, // browser card enters as the pull starts
  nav: 46,
  h1: 51,
  h2: 55,
  img: 59,
  sub1: 63,
  sub2: 66,
  btns: 70,
  snapH1: 76,
  snapH2: 80,
  snapImg: 84,
  snapBtn: 88,
};

// ---------------------------------------------------------------------------
// Skeleton block that snaps into a "real" fill
// ---------------------------------------------------------------------------

const SnapBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  inAt: number;
  /** Omit → stays a skeleton (body copy). */
  snapAt?: number;
  fill?: string;
  border?: string;
  children?: React.ReactNode;
}> = ({ x, y, w, h, r = 12, inAt, snapAt, fill, border, children }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [inAt, inAt + 7], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const snapT =
    snapAt === undefined
      ? 0
      : interpolate(frame, [snapAt, snapAt + 5], [0, 1], CLAMP);
  const pulseT =
    snapAt === undefined
      ? 0
      : interpolate(frame, [snapAt, snapAt + 9], [0, 1], CLAMP);
  const pulse = Math.sin(pulseT * Math.PI) * 0.045;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        background: SKELETON,
        opacity: inT,
        transform: `translateY(${(1 - inT) * 14}px) scale(${1 + pulse})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background: fill ?? SKELETON,
          border: `1.5px solid ${border ?? "transparent"}`,
          opacity: snapT,
          display: "grid",
          placeItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Glyphs — genuine UI marks only
// ---------------------------------------------------------------------------

const ArrowGlyph: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12h13M12 6l6 6-6 6"
      stroke="#fff"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImageGlyph: React.FC = () => (
  <svg width="76" height="76" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke={C.mutedSoft}
      strokeWidth={1.5}
    />
    <circle cx="8.6" cy="8.6" r="1.7" fill={C.mutedSoft} />
    <path
      d="M3.6 17.4 L9 12 l4 4 3-3 4.4 4.4"
      stroke={C.mutedSoft}
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const LockGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect
      x="5"
      y="10.5"
      width="14"
      height="9.5"
      rx="2.4"
      stroke={C.mutedSoft}
      strokeWidth={2}
    />
    <path
      d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
      stroke={C.mutedSoft}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// The `//` mark — opens tight, settles with a soft spring, keeps breathing
// ---------------------------------------------------------------------------

const HeroMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settle = spring({ frame, fps, config: SPRINGS.heavy });
  const breathe = 1 + 0.005 * Math.sin(frame / 9);
  // Visible from frame 0, mid-settle — the open catches it already moving.
  const scale = (1 + 0.16 * (1 - settle)) * breathe;

  return (
    <div
      style={{
        position: "absolute",
        left: MARK.cx - MARK.size / 2,
        top: MARK.cy - MARK.size / 2,
        width: MARK.size,
        height: MARK.size,
        transform: `scale(${scale})`,
      }}
    >
      <S2cMark
        size={MARK.size}
        style={{ boxShadow: "0 16px 38px rgba(25,23,20,0.14)" }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Browser — chrome + page that assembles itself
// ---------------------------------------------------------------------------

const Browser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - T.reveal,
    fps,
    config: SPRINGS.snappy,
  });

  const navT = interpolate(frame, [T.nav, T.nav + 9], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // Secondary button snaps a beat after the primary.
  const sec = interpolate(frame, [T.snapBtn + 3, T.snapBtn + 8], [0, 1], CLAMP);

  return (
    <Card
      x={B.x}
      y={B.y}
      w={B.w}
      h={B.h}
      r={26}
      enter={enter}
      style={{ overflow: "hidden" }}
    >
      {/* ---- page nav (renders under the chrome so its slide-in clips) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: CHROME_H,
          width: "100%",
          height: NAV_H,
          borderBottom: `1.5px solid ${C.lineSoft}`,
          display: "flex",
          alignItems: "center",
          padding: `0 ${PAD}px`,
          opacity: navT,
          transform: `translateY(${(1 - navT) * -18}px)`,
        }}
      >
        <S2cMark size={34} />
        <div style={{ display: "flex", gap: 28, marginLeft: "auto" }}>
          {[54, 66, 48].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 12,
                borderRadius: 6,
                background: LINK_BAR,
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginLeft: 36,
            width: 96,
            height: 38,
            borderRadius: 10,
            background: C.ink,
          }}
        />
      </div>

      {/* ---- hero: headline blocks snap grey → ink / accent blue */}
      <SnapBlock
        x={PAD}
        y={210}
        w={410}
        h={48}
        r={12}
        inAt={T.h1}
        snapAt={T.snapH1}
        fill={C.ink}
      />
      <SnapBlock
        x={PAD}
        y={272}
        w={330}
        h={48}
        r={12}
        inAt={T.h2}
        snapAt={T.snapH2}
        fill={C.orange}
      />

      {/* body copy stays skeleton */}
      <SnapBlock x={PAD} y={356} w={380} h={16} r={8} inAt={T.sub1} />
      <SnapBlock x={PAD} y={384} w={310} h={16} r={8} inAt={T.sub2} />

      {/* buttons */}
      <SnapBlock
        x={PAD}
        y={436}
        w={178}
        h={60}
        r={14}
        inAt={T.btns}
        snapAt={T.snapBtn}
        fill={C.orange}
      >
        <ArrowGlyph />
      </SnapBlock>
      <SnapBlock
        x={PAD + 198}
        y={436}
        w={128}
        h={60}
        r={14}
        inAt={T.btns + 2}
        snapAt={T.snapBtn + 3}
        fill={C.card}
        border={C.ink}
      >
        <LogoImg src={S2C.logos.github} size={28} style={{ opacity: sec }} />
      </SnapBlock>

      {/* image block */}
      <SnapBlock
        x={530}
        y={206}
        w={314}
        h={296}
        r={18}
        inAt={T.img}
        snapAt={T.snapImg}
        fill={C.paperDeep}
        border={C.line}
      >
        <ImageGlyph />
      </SnapBlock>

      {/* ---- chrome (painted last so it covers the nav slide-in) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: CHROME_H,
          background: "#FAF8F5",
          borderBottom: `1.5px solid ${C.line}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 28,
            top: CHROME_H / 2 - 6.5,
            display: "flex",
            gap: 11,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 999,
                background: "#D9D3C7",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: CHROME_H / 2 - 23,
            transform: "translateX(-50%)",
            width: 430,
            height: 46,
            borderRadius: 12,
            background: "#F3F0EA",
            border: `1.5px solid ${C.lineSoft}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <LockGlyph />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 24,
              color: C.muted,
              letterSpacing: 0.2,
            }}
          >
            screenshottocode.com
          </span>
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const S2cHookOnlyTool: React.FC = () => {
  // hold (tight on mark) → one 18f pull-back → hold → micro-drift end hold
  const cam = useCam({
    keys: [0, 25, 43, 95, 110],
    fx: [540, 540, 540, 540, 540],
    fy: [MARK.cy, MARK.cy, 540, 540, 540],
    z: [3.2, 3.2, 1, 1, 1.006],
  });

  return (
    <PaperWorld cam={cam}>
      <Browser />
      <HeroMark />
    </PaperWorld>
  );
};
