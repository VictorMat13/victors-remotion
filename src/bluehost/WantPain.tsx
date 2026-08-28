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
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { BH } from "./constants";
import { camAt, CamKey } from "./choreo";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const DURATION_IN_FRAMES = 210;

// =============================================================================
// "Everyone wants to run OpenClaw, Hermes, and n8n…
//  but nobody wants to deal with Docker, server setup, and configuration."
// Beat 1: three bright app chips pop in on the Bluehost blue field.
// Beat 2: a wall of dark pain-cards crashes down in front; the apps dim behind.
// Same world/camera system as BluehostHermesV/H.
// =============================================================================

// ---- world layout ------------------------------------------------------------
const APPS = [
  { name: "OpenClaw", logo: "bluehost/open-claw.svg", cc: false, at: 6 },
  { name: "Hermes Agent", logo: "bluehost/hermesagent-logo.svg", cc: true, at: 15 },
  { name: "n8n", logo: "bluehost/n8n-logo.svg", cc: false, at: 24 },
];
const CHIP_W = 300;
const CHIP_H = 340;
const CHIP_GAP = 40;
const ROW_CX = 1100;
const ROW_CY = 560;
const chipX = (i: number) =>
  ROW_CX - (3 * CHIP_W + 2 * CHIP_GAP) / 2 + i * (CHIP_W + CHIP_GAP);

// pain wall — overlapping cluster in front of / below the chips
const PAIN_DROP = 84; // first card release
const PAIN_STAGGER = 13;
const PAIN = [
  { kind: "docker", x: 700, y: 900, w: 360, h: 250, rot: -5 },
  { kind: "compose", x: 1010, y: 950, w: 360, h: 250, rot: 3 },
  { kind: "gears", x: 1330, y: 895, w: 330, h: 250, rot: -3 },
  { kind: "term", x: 860, y: 1130, w: 420, h: 240, rot: 2 },
  { kind: "term2", x: 1290, y: 1140, w: 380, h: 235, rot: -2 },
] as const;

const kickAt = (frame: number, at: number, amt: number) => {
  const d = frame - at;
  if (d < 0 || d > 12) return 0;
  return amt * Math.exp(-d / 3) * Math.sin((Math.min(1, d / 2) * Math.PI) / 2);
};

// ---- pain card bodies ---------------------------------------------------------
const PainBody: React.FC<{ kind: (typeof PAIN)[number]["kind"]; t: number }> = ({
  kind,
  t,
}) => {
  if (kind === "docker") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          height: "100%",
        }}
      >
        <Img
          src={staticFile("bluehost/docker-logo.svg")}
          style={{ width: 110, height: 110 }}
        />
        <div style={{ fontSize: 27, fontWeight: 700, color: BH.termText }}>
          Docker
        </div>
      </div>
    );
  }
  if (kind === "compose") {
    return (
      <div style={{ padding: "22px 28px", height: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <svg width={22} height={26} viewBox="0 0 22 26">
            <path
              d="M2 1h12l6 6v18H2z"
              fill="none"
              stroke={BH.termDim}
              strokeWidth={2}
            />
            <path d="M14 1v6h6" fill="none" stroke={BH.termDim} strokeWidth={2} />
          </svg>
          <span
            style={{
              fontFamily: mono,
              fontSize: 22,
              fontWeight: 700,
              color: BH.termText,
            }}
          >
            docker-compose.yml
          </span>
        </div>
        {[210, 260, 160, 240, 120, 200].map((w, i) => (
          <div
            key={i}
            style={{
              height: 11,
              width: w,
              marginLeft: i % 2 === 1 ? 30 : 0,
              marginBottom: 10,
              borderRadius: 6,
              backgroundColor:
                i === 2 ? "rgba(248,113,113,0.55)" : "rgba(110,139,166,0.4)",
            }}
          />
        ))}
      </div>
    );
  }
  if (kind === "gears") {
    const rot = t * 0.35;
    const Gear: React.FC<{ cx: number; cy: number; r: number; a: number }> = ({
      cx,
      cy,
      r,
      a,
    }) => (
      <g transform={`translate(${cx} ${cy}) rotate(${a})`}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x={-7}
            y={-r - 9}
            width={14}
            height={16}
            rx={3}
            fill={BH.termDim}
            transform={`rotate(${i * 45})`}
          />
        ))}
        <circle r={r} fill={BH.termDim} />
        <circle r={r * 0.42} fill={BH.termPanel} />
      </g>
    );
    return (
      <svg width="100%" height="100%" viewBox="0 0 330 250">
        <Gear cx={125} cy={112} r={52} a={rot} />
        <Gear cx={228} cy={158} r={38} a={-rot * (52 / 38) + 12} />
      </svg>
    );
  }
  const lines =
    kind === "term"
      ? [
          { s: "$ docker compose up -d", c: BH.termText },
          { s: "Error: port 5678 already in use", c: BH.termRed },
          { s: "exited with code 1", c: BH.termRed },
          { s: "$ nano docker-compose.yml", c: BH.termText },
        ]
      : [
          { s: "$ sudo apt install nginx", c: BH.termText },
          { s: "E: Unable to locate package", c: BH.termRed },
          { s: "certbot: challenge failed", c: BH.termRed },
          { s: "$ systemctl status --failed", c: BH.termText },
        ];
  const blink = Math.floor(t / 11) % 2 === 0;
  return (
    <div style={{ padding: "18px 24px" }}>
      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div
            key={c}
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: c,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: mono,
            fontSize: 20,
            lineHeight: 1.55,
            color: l.c,
            whiteSpace: "nowrap",
          }}
        >
          {l.s}
          {i === lines.length - 1 && blink ? (
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 20,
                marginLeft: 6,
                verticalAlign: "middle",
                backgroundColor: BH.termText,
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};

// ---- shared world -------------------------------------------------------------
const WantPainWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // dim of the desire row once the wall arrives
  const dim = interpolate(frame, [PAIN_DROP + 4, PAIN_DROP + 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <div style={{ fontFamily: inter }}>
      {/* faint grid-mark texture, matching the walkthrough's BlueField */}
      <svg
        width={3000}
        height={2200}
        style={{ position: "absolute", left: -400, top: -400, opacity: 0.032 }}
      >
        <defs>
          <pattern
            id="wp-tiles"
            width={420}
            height={420}
            patternUnits="userSpaceOnUse"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={i}
                x={40 + (i % 3) * 56}
                y={40 + Math.floor(i / 3) * 56}
                width={44}
                height={44}
                rx={5}
                fill="#FFFFFF"
              />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wp-tiles)" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: -100,
          width: 2000,
          height: 1600,
          background:
            "radial-gradient(1100px 800px at 50% 42%, rgba(255,255,255,0.10), rgba(255,255,255,0) 65%)",
        }}
      />

      {/* ---- beat 1: the apps everyone wants ---- */}
      {APPS.map((app, i) => {
        const s = spring({
          frame: Math.max(0, frame - app.at),
          fps,
          config: { damping: 12, stiffness: 150 },
        });
        if (s < 0.001) return null;
        const float = Math.sin((frame + i * 40) * 0.045) * 4 * (1 - dim);
        return (
          <div
            key={app.name}
            style={{
              position: "absolute",
              left: chipX(i),
              top: ROW_CY - CHIP_H / 2 + float,
              width: CHIP_W,
              height: CHIP_H,
              borderRadius: 26,
              backgroundColor: BH.card,
              boxShadow: `0 ${24 - dim * 10}px ${60 - dim * 24}px rgba(4,29,51,${0.4 - dim * 0.15})`,
              transform: `scale(${s * (1 - dim * 0.05)}) rotate(${(1 - s) * (i % 2 === 0 ? -7 : 7)}deg)`,
              transformOrigin: "center bottom",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: app.cc ? "#0A0A0A" : undefined,
              }}
            >
              <Img
                src={staticFile(app.logo)}
                style={{ width: 150, height: 150, objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: BH.navy }}>
              {app.name}
            </div>
            {/* dim veil once the pain wall lands */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                backgroundColor: BH.brandBlueDeep,
                opacity: dim * 0.55,
              }}
            />
          </div>
        );
      })}

      {/* ---- beat 2: the pain wall ---- */}
      {PAIN.map((p, i) => {
        const at = PAIN_DROP + i * PAIN_STAGGER;
        const s = spring({
          frame: Math.max(0, frame - at),
          fps,
          config: { damping: 14, stiffness: 110, mass: 1.25 },
        });
        if (frame < at) return null;
        const drop = interpolate(s, [0, 1], [-720, 0]);
        const wobble =
          Math.sin((frame - at) * 0.05 + i * 1.7) * 2.5 * (s > 0.9 ? 1 : 0);
        return (
          <div
            key={p.kind}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + drop + wobble,
              width: p.w,
              height: p.h,
              borderRadius: 20,
              backgroundColor: BH.termPanel,
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 30px 70px rgba(4,29,51,0.55)",
              transform: `rotate(${p.rot}deg) scale(${0.9 + 0.1 * Math.min(1, s * 1.1)})`,
              overflow: "hidden",
            }}
          >
            <PainBody kind={p.kind} t={Math.max(0, frame - at)} />
          </div>
        );
      })}
    </div>
  );
};

// ---- comps ---------------------------------------------------------------------
const kicks = (frame: number) =>
  PAIN.reduce(
    (k, _, i) => k + kickAt(frame, PAIN_DROP + i * PAIN_STAGGER + 15, 0.014),
    0,
  );

const CAM_SQ: CamKey[] = [
  { f: 0, x: 830, y: 585, z: 1.5 },
  { f: 16, x: 830, y: 585, z: 1.5 },
  { f: 34, x: 1100, y: 570, z: 0.98 },
  { f: 76, x: 1100, y: 570, z: 0.98 },
  { f: 104, x: 1100, y: 810, z: 0.86 },
  { f: 150, x: 1108, y: 822, z: 0.84 },
  { f: 209, x: 1108, y: 822, z: 0.84 },
];

const CAM_WIDE: CamKey[] = [
  { f: 0, x: 850, y: 575, z: 1.7 },
  { f: 16, x: 850, y: 575, z: 1.7 },
  { f: 34, x: 1100, y: 565, z: 1.24 },
  { f: 76, x: 1100, y: 565, z: 1.24 },
  { f: 104, x: 1100, y: 790, z: 0.96 },
  { f: 150, x: 1108, y: 798, z: 0.93 },
  { f: 209, x: 1108, y: 798, z: 0.93 },
];

const WantPainComp: React.FC<{ cam: CamKey[]; vw: number; vh: number }> = ({
  cam,
  vw,
  vh,
}) => {
  const frame = useCurrentFrame();
  const { fx, fy, z } = camAt(frame, cam);
  const zoom = z * (1 + kicks(frame));
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BH.brandBlue,
        backgroundImage: `linear-gradient(180deg, ${BH.brandBlue} 0%, ${BH.brandBlueDeep} 150%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${vw / 2 - fx}px, ${vh / 2 - fy}px) scale(${zoom})`,
        }}
      >
        <WantPainWorld />
      </div>
    </AbsoluteFill>
  );
};

// 1080x1080
export const BluehostWantPainSq: React.FC = () => (
  <WantPainComp cam={CAM_SQ} vw={1080} vh={1080} />
);

// 1920x1080
export const BluehostWantPainH: React.FC = () => (
  <WantPainComp cam={CAM_WIDE} vw={1920} vh={1080} />
);
