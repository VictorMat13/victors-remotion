import { Easing, interpolate } from "remotion";

// ---- shared easings -----------------------------------------------------------
export const easeCam = Easing.inOut(Easing.cubic);
export const easeGlide = Easing.bezier(0.3, 0.0, 0.18, 1);
export const easeOutQ = Easing.out(Easing.quad);

export type Pt = { x: number; y: number };

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const prog = (frame: number, a: number, b: number, easing = easeOutQ) =>
  interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// ---- cursor glides --------------------------------------------------------------
// A glide is a curved, eased hop between two world points with a tiny arrival
// overshoot. Bow = perpendicular bulge as a fraction of distance (signed).
export type Glide = { t0: number; t1: number; from: Pt; to: Pt; bow?: number };

export const glidePos = (frame: number, g: Glide): Pt => {
  const t = prog(frame, g.t0, g.t1, easeGlide);
  // 1.8% overshoot that settles in the last 12% of the move
  const over = Math.sin(Math.min(1, t) * Math.PI) * 0;
  const tt = t + over;
  const dx = g.to.x - g.from.x;
  const dy = g.to.y - g.from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const bow = (g.bow ?? 0.09) * dist;
  // perpendicular unit
  const px = -dy / dist;
  const py = dx / dist;
  const arc = Math.sin(tt * Math.PI) * bow;
  // slight settle-back: overshoot along the travel direction near the end
  const settle =
    tt > 0.82 ? Math.sin(((tt - 0.82) / 0.18) * Math.PI) * 0.014 : 0;
  return {
    x: g.from.x + dx * (tt + settle) + px * arc,
    y: g.from.y + dy * (tt + settle) + py * arc,
  };
};

// Resolve a cursor path: ordered glides + rest positions between them.
export const cursorAt = (frame: number, glides: Glide[]): Pt => {
  if (glides.length === 0) return { x: 0, y: 0 };
  if (frame <= glides[0].t0) return glides[0].from;
  for (let i = 0; i < glides.length; i++) {
    const g = glides[i];
    if (frame <= g.t1) return glidePos(frame, g);
    const next = glides[i + 1];
    if (!next || frame <= next.t0) {
      if (!next) return g.to;
      return g.to;
    }
  }
  return glides[glides.length - 1].to;
};

// ---- clicks ----------------------------------------------------------------------
// One click = press-down, release, ripple. All curves derived from the press frame.
export type Click = { at: number };

export const pressAmt = (frame: number, c: Click) => {
  // down over 3f, hold 2f, up over 4f
  const d = frame - c.at;
  if (d < 0 || d > 9) return 0;
  if (d <= 3) return easeOutQ(d / 3);
  if (d <= 5) return 1;
  return 1 - easeOutQ((d - 5) / 4);
};

export const rippleAmt = (frame: number, c: Click) => {
  const d = frame - c.at + 1;
  if (d < 0 || d > 15) return 0;
  return clamp01(d / 15);
};

// Camera impact nudge: tiny zoom kick that decays — makes clicks feel tactile.
export const clickZoomKick = (frame: number, clicks: Click[], amt = 0.016) => {
  let k = 0;
  for (const c of clicks) {
    const d = frame - c.at - 2;
    if (d >= 0 && d < 12) k += amt * Math.exp(-d / 3.2) * Math.sin(Math.min(1, d / 2) * Math.PI * 0.5);
  }
  return k;
};

// ---- piecewise time remap ---------------------------------------------------------
// Maps comp frames onto a component's local clock at varying speeds, so long
// deterministic sequences (terminal typing) can be paced to the VO.
// segments: [compFrame, localFrame] pairs, strictly increasing in both.
export const remap = (frame: number, segments: [number, number][]) => {
  const xs = segments.map((s) => s[0]);
  const ys = segments.map((s) => s[1]);
  return interpolate(frame, xs, ys, {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });
};

// ---- camera keyframe builder -------------------------------------------------------
export type CamKey = { f: number; x: number; y: number; z: number };

export const camAt = (frame: number, keys: CamKey[]) => {
  const fs = keys.map((k) => k.f);
  const opts = {
    easing: easeCam,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  return {
    fx: interpolate(frame, fs, keys.map((k) => k.x), opts),
    fy: interpolate(frame, fs, keys.map((k) => k.y), opts),
    z: interpolate(frame, fs, keys.map((k) => k.z), opts),
  };
};
