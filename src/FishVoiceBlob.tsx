import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  getAudioDurationInSeconds,
  useAudioData,
  visualizeAudio,
} from "@remotion/media-utils";

// -------------------------------------------------------------------------
// Standalone voice visualizer: the wireframe mesh blob (cyan→blue→violet→
// pink ombre on paper) driven by the real "good evening victor" audio.
// 1080x1080. Auto-sizes to the audio.
// -------------------------------------------------------------------------
const DEFAULT_SRC = "fish-audio/good-evening-victor.mp3";
const FPS = 30;
const LEAD_IN = 24; // calm blob before the voice starts
const TAIL_PAD = 30;
const PLACEHOLDER_AUDIO_SEC = 3.5;

type Props = { hasAudio: boolean; audioFrames: number; src: string };

export const DURATION_IN_FRAMES =
  LEAD_IN + Math.round(PLACEHOLDER_AUDIO_SEC * FPS) + TAIL_PAD;

export const calculateVoiceBlobMetadata = async ({
  props,
}: {
  props: Props;
}) => {
  let audioSec = PLACEHOLDER_AUDIO_SEC;
  let hasAudio = false;
  try {
    audioSec = await getAudioDurationInSeconds(staticFile(props.src));
    hasAudio = true;
  } catch {
    // keep placeholder timing
  }
  const audioFrames = Math.round(audioSec * FPS);
  return {
    durationInFrames: LEAD_IN + audioFrames + TAIL_PAD,
    fps: FPS,
    props: { ...props, hasAudio, audioFrames },
  };
};

const COLORS = {
  paper: "#fbfbf9",
  blue: "#2563EB",
  meshCyan: "#22D3EE",
  meshViolet: "#8B5CF6",
  meshPink: "#EC4899",
};

const HALF = 32;
const RINGS = 16;
const RING_SAMPLES = 84;
const MERIDIAN_SAMPLES = 48;
const R_MIN = 55;
const R_MAX = 185;
const MERIDIAN_LONGITUDES = [-1.25, -0.9, -0.58, -0.28, 0.28, 0.58, 0.9, 1.25];
const BLOB_BASE_SCALE = 1.32; // standalone hero size

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type RingSpec = {
  baseR: number;
  yOff: number;
  wobble: number;
  opacity: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};
type MeridianSpec = {
  phi: number;
  a1: number;
  a2: number;
  a3: number;
  p1: number;
  p2: number;
  p3: number;
};

const buildMesh = (): { rings: RingSpec[]; meridians: MeridianSpec[] } => {
  const rnd = mulberry32(52814);
  const rings: RingSpec[] = Array.from({ length: RINGS }).map((_, i) => {
    const t = i / (RINGS - 1);
    return {
      baseR: R_MIN + (R_MAX - R_MIN) * t,
      yOff: 14 * t,
      wobble: 0.6 + 0.7 * t,
      opacity: 0.4 + 0.45 * t,
      a1: 0.02 + rnd() * 0.07,
      a2: 0.02 + rnd() * 0.07,
      a3: 0.02 + rnd() * 0.07,
      p1: rnd() * Math.PI * 2,
      p2: rnd() * Math.PI * 2,
      p3: rnd() * Math.PI * 2,
    };
  });
  const meridians: MeridianSpec[] = MERIDIAN_LONGITUDES.map((phi) => ({
    phi,
    a1: 0.02 + rnd() * 0.05,
    a2: 0.02 + rnd() * 0.05,
    a3: 0.02 + rnd() * 0.05,
    p1: rnd() * Math.PI * 2,
    p2: rnd() * Math.PI * 2,
    p3: rnd() * Math.PI * 2,
  }));
  return { rings, meridians };
};

const Scene: React.FC<{ amp: number }> = ({ amp }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const BLOB_X = width / 2;
  const BLOB_Y = height / 2;
  const mesh = useMemo(buildMesh, []);

  const settle = 0.96 + 0.04 * spring({ frame, fps, config: { damping: 16, stiffness: 130 } });

  const ampScale = 0.4 + 0.9 * amp;
  const blobScale = BLOB_BASE_SCALE * settle * (1 + 0.08 * amp);
  const squashY = 0.94 + 0.02 * Math.sin(frame * 0.05);
  const rotRad = (frame * 0.25 * Math.PI) / 180;
  const blobOpacity = 0.85 + 0.15 * Math.min(1, amp * 3);

  const meshNoise = (
    s: { a1: number; a2: number; a3: number; p1: number; p2: number; p3: number },
    th: number,
  ) =>
    s.a1 * Math.sin(3 * th + s.p1 + frame * 0.03) +
    s.a2 * Math.sin(5 * th - s.p2 + frame * 0.021) +
    s.a3 * Math.sin(8 * th + s.p3 + frame * 0.045);

  const ringPath = (rg: RingSpec) => {
    let d = "";
    for (let k = 0; k < RING_SAMPLES; k++) {
      const th = (k / RING_SAMPLES) * Math.PI * 2;
      const r =
        rg.baseR * (1 + rg.wobble * ampScale * meshNoise(rg, th + rotRad));
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r + rg.yOff;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
  };

  const meridianPath = (m: MeridianSpec) => {
    const sinPhi = Math.sin(m.phi + rotRad);
    let d = "";
    for (let k = 0; k <= MERIDIAN_SAMPLES; k++) {
      const u = -Math.PI / 2 + (k / MERIDIAN_SAMPLES) * Math.PI;
      const R = (R_MAX - 3) * (1 + ampScale * meshNoise(m, u));
      const x = Math.cos(u) * R * sinPhi;
      const y = Math.sin(u) * R;
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* paper glow + masked grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1100px 1100px at 50% 50%, rgba(37,99,235,0.10), transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(32,21,21,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(32,21,21,0.026) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          WebkitMaskImage:
            "radial-gradient(980px 980px at 50% 50%, #000 40%, transparent 82%)",
          maskImage:
            "radial-gradient(980px 980px at 50% 50%, #000 40%, transparent 82%)",
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          inset: 0,
          width,
          height,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient
            id="fvbMesh"
            gradientUnits="userSpaceOnUse"
            x1={-R_MAX}
            y1={-R_MAX}
            x2={R_MAX}
            y2={R_MAX}
          >
            <stop offset="0%" stopColor={COLORS.meshCyan} />
            <stop offset="34%" stopColor={COLORS.blue} />
            <stop offset="67%" stopColor={COLORS.meshViolet} />
            <stop offset="100%" stopColor={COLORS.meshPink} />
          </linearGradient>
          <radialGradient id="fvbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.10" />
            <stop offset="60%" stopColor={COLORS.meshPink} stopOpacity="0.06" />
            <stop offset="100%" stopColor={COLORS.meshPink} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g
          opacity={blobOpacity}
          transform={`translate(${BLOB_X} ${BLOB_Y}) scale(${blobScale})`}
        >
          <circle cx={0} cy={0} r={230} fill="url(#fvbGlow)" />
          <g transform={`scale(1 ${squashY})`} fill="none">
            {mesh.meridians.map((m, i) => (
              <path
                key={`md${i}`}
                d={meridianPath(m)}
                stroke="url(#fvbMesh)"
                strokeWidth={1.4}
                strokeOpacity={0.3}
                strokeLinecap="round"
              />
            ))}
            {mesh.rings.map((rg, i) => (
              <path
                key={`rg${i}`}
                d={ringPath(rg)}
                stroke="url(#fvbMesh)"
                strokeWidth={1.4}
                strokeOpacity={rg.opacity}
                strokeLinejoin="round"
              />
            ))}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const WithAudio: React.FC<{ audioFrames: number; src: string }> = ({
  audioFrames,
  src,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(src));
  void audioFrames;

  let amp = 0;
  if (audioData && frame >= LEAD_IN) {
    const raw = visualizeAudio({
      fps,
      frame: frame - LEAD_IN,
      audioData,
      numberOfSamples: HALF,
    });
    const values = raw.map((v) => Math.min(1, Math.sqrt(v) * 2.4));
    amp = values.reduce((a, b) => a + b, 0) / HALF;
  }

  return (
    <>
      <Sequence from={LEAD_IN}>
        <Audio src={staticFile(src)} />
      </Sequence>
      <Scene amp={amp} />
    </>
  );
};

const Procedural: React.FC<{ audioFrames: number }> = ({ audioFrames }) => {
  const frame = useCurrentFrame();
  const active = frame >= LEAD_IN && frame < LEAD_IN + audioFrames;
  const amp = active
    ? 0.3 +
      0.3 * Math.abs(Math.sin(frame * 0.34)) +
      0.14 * Math.abs(Math.sin(frame * 0.9))
    : 0;
  return <Scene amp={amp} />;
};

export const FishVoiceBlob: React.FC<Props> = ({
  hasAudio,
  audioFrames,
  src,
}) => {
  return hasAudio ? (
    <WithAudio audioFrames={audioFrames} src={src ?? DEFAULT_SRC} />
  ) : (
    <Procedural audioFrames={audioFrames} />
  );
};
