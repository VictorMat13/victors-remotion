import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

// NVIDIA-green-on-white Liam palette
const COLORS = {
  green: "#76B900",
  greenDeep: "#5C9100",
  ink: "#14180F",
  muted: "#6B7280",
  faint: "#AEB4A6",
  paper: "#FBFCFA",
  line: "#E9ECE3",
  card: "#FFFFFF",
};

const FONT = fontFamily;

// ---------------------------------------------------------------------------
// Shared background — paper + soft green glow + masked grid
// ---------------------------------------------------------------------------

const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(900px 940px at 50% 42%, rgba(118,185,0,0.10), rgba(118,185,0,0) 62%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(20,24,15,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(20,24,15,0.028) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        WebkitMaskImage:
          "radial-gradient(820px 1040px at 50% 50%, #000 42%, transparent 84%)",
        maskImage:
          "radial-gradient(820px 1040px at 50% 50%, #000 42%, transparent 84%)",
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const Kicker: React.FC<{ label: string; delay?: number }> = ({
  label,
  delay = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  return (
    <div
      style={{
        alignSelf: "center",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: COLORS.greenDeep,
        padding: "11px 22px",
        border: "1.5px solid rgba(118,185,0,0.30)",
        borderRadius: 999,
        background: "rgba(118,185,0,0.06)",
        transform: `translateY(${(1 - k) * 16}px) scale(${0.92 + 0.08 * k})`,
        opacity: k,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: COLORS.green,
          boxShadow: "0 0 0 4px rgba(118,185,0,0.18)",
        }}
      />
      {label}
    </div>
  );
};

const NvidiaMark: React.FC<{ size?: number; withWordmark?: boolean }> = ({
  size = 64,
  withWordmark = true,
}) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
    <Img
      src={staticFile("nvidia-reel/logos/nvidia.svg")}
      style={{ width: size, height: size }}
    />
    {withWordmark && (
      <span
        style={{
          fontFamily: FONT,
          fontSize: size * 0.62,
          fontWeight: 800,
          letterSpacing: 1,
          color: COLORS.ink,
        }}
      >
        NVIDIA
      </span>
    )}
  </div>
);

// Highlight-sweep word (Liam signature)
const Highlight: React.FC<{ children: React.ReactNode; progress: number }> = ({
  children,
  progress,
}) => (
  <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
    <span
      style={{
        position: "absolute",
        left: -10,
        right: -10,
        top: "12%",
        bottom: "8%",
        background: COLORS.green,
        opacity: 0.28,
        zIndex: -1,
        transform: `scaleX(${progress}) rotate(-1.5deg)`,
        transformOrigin: "left center",
        clipPath: "polygon(0 8%,100% 0,99.5% 90%,1% 100%)",
        borderRadius: 7,
      }}
    />
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Scene 1 — Hook
// ---------------------------------------------------------------------------

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const introBlur = interpolate(frame, [0, 16], [8, 0], {
    extrapolateRight: "clamp",
  });

  const brand = spring({
    frame: frame - 2,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const l1 = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const l2 = spring({
    frame: frame - 16,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const hl = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const sub = spring({
    frame: frame - 26,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  return (
    <AbsoluteFill style={{ opacity: introOp, filter: `blur(${introBlur}px)` }}>
      <div
        style={{
          position: "absolute",
          left: 130,
          right: 130,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - brand) * 14}px)`,
            opacity: brand,
          }}
        >
          <NvidiaMark size={72} />
        </div>

        <h1
          style={{
            fontFamily: FONT,
            fontSize: 92,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: -2,
            color: COLORS.ink,
            textAlign: "center",
            margin: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - l1) * 22}px)`,
              opacity: l1,
            }}
          >
            is giving away
          </span>
          <br />
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - l2) * 22}px)`,
              opacity: l2,
            }}
          >
            <Highlight progress={hl}>free AI</Highlight>
          </span>
        </h1>

        <p
          style={{
            fontFamily: FONT,
            fontSize: 40,
            lineHeight: 1.4,
            fontWeight: 600,
            color: COLORS.muted,
            textAlign: "center",
            margin: 0,
            maxWidth: 760,
            transform: `translateY(${(1 - sub) * 16}px)`,
            opacity: sub,
          }}
        >
          API keys for{" "}
          <span style={{ color: COLORS.ink, fontWeight: 800 }}>
            80+ top models
          </span>
          . No credit card.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — The catch
// ---------------------------------------------------------------------------

const SceneCatch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const card = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const check = spring({
    frame: frame - 22,
    fps,
    config: { damping: 11, stiffness: 170 },
  });
  const body = spring({
    frame: frame - 18,
    fps,
    config: { damping: 18, stiffness: 130 },
  });

  return (
    <AbsoluteFill style={{ opacity: introOp }}>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <div style={{ alignSelf: "center" }}>
          <Kicker label="The catch?" delay={2} />
        </div>

        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 34,
            boxShadow: "0 26px 60px rgba(20,24,15,0.10)",
            padding: "56px 52px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            transform: `translateY(${(1 - card) * 26}px) scale(${0.96 + 0.04 * card})`,
            opacity: card,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 22,
                flex: "none",
                background: "rgba(118,185,0,0.12)",
                display: "grid",
                placeItems: "center",
                transform: `scale(${0.3 + 0.7 * check})`,
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke={COLORS.green}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4 4 10-10" />
              </svg>
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: -1.4,
                color: COLORS.ink,
              }}
            >
              There isn&rsquo;t one.
            </div>
          </div>

          <div
            style={{
              fontFamily: FONT,
              fontSize: 40,
              lineHeight: 1.45,
              fontWeight: 600,
              color: COLORS.muted,
              transform: `translateY(${(1 - body) * 14}px)`,
              opacity: body,
            }}
          >
            NVIDIA runs the compute so you can test{" "}
            <span style={{ color: COLORS.ink, fontWeight: 800 }}>
              80+ models
            </span>{" "}
            for free.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Logo wall
// ---------------------------------------------------------------------------

const MODELS: { name: string; file: string }[] = [
  { name: "DeepSeek", file: "deepseek" },
  { name: "Kimi", file: "kimi" },
  { name: "GLM", file: "glm" },
  { name: "MiniMax", file: "minimax" },
  { name: "OpenAI", file: "openai" },
  { name: "Qwen", file: "qwen" },
];

const LogoChip: React.FC<{ name: string; file: string; index: number }> = ({
  name,
  file,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 30 + index * 7;
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        height: 130,
        padding: "0 30px",
        borderRadius: 26,
        background: COLORS.card,
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 16px 36px rgba(20,24,15,0.08)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px) scale(${0.92 + 0.08 * enter})`,
      }}
    >
      <div
        style={{
          width: 74,
          height: 74,
          borderRadius: 18,
          flex: "none",
          background: COLORS.paper,
          border: `1px solid ${COLORS.line}`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Img
          src={staticFile(`nvidia-reel/logos/${file}.svg`)}
          style={{ width: 46, height: 46 }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: -0.6,
          color: COLORS.ink,
        }}
      >
        {name}
      </span>
    </div>
  );
};

const SceneLogos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const head = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const badge = spring({
    frame: frame - 14,
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  return (
    <AbsoluteFill style={{ opacity: introOp }}>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 46,
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${(1 - head) * 18}px)`,
            opacity: head,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.muted,
              marginBottom: 16,
            }}
          >
            One key unlocks
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 128,
                fontWeight: 800,
                letterSpacing: -3,
                color: COLORS.green,
                transform: `scale(${0.6 + 0.4 * badge})`,
                display: "inline-block",
              }}
            >
              80+
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: -1,
                color: COLORS.ink,
              }}
            >
              models
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 22,
          }}
        >
          {MODELS.map((m, i) => (
            <LogoChip key={m.file} name={m.name} file={m.file} index={i} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Setup (3 steps + code card)
// ---------------------------------------------------------------------------

const Step: React.FC<{ n: number; text: React.ReactNode; index: number }> = ({
  n,
  text,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 14 + index * 12;
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: enter,
        transform: `translateX(${(1 - enter) * -24}px)`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          flex: "none",
          borderRadius: "50%",
          background: COLORS.green,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 800,
          boxShadow: "0 8px 20px rgba(118,185,0,0.35)",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: -0.6,
          color: COLORS.ink,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SceneSetup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const head = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 150 },
  });

  const codeCard = spring({
    frame: frame - 60,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  // typewriter for the export line
  const CMD = "export NVIDIA_API_KEY=nvapi-••••••••";
  const typed = Math.floor(
    interpolate(frame, [72, 110], [0, CMD.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const ok = spring({
    frame: frame - 124,
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  return (
    <AbsoluteFill style={{ opacity: introOp }}>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 44,
        }}
      >
        <div
          style={{
            alignSelf: "center",
            transform: `translateY(${(1 - head) * 16}px)`,
            opacity: head,
          }}
        >
          <Kicker label="30-second setup" delay={2} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <Step
            n={1}
            index={0}
            text={
              <>
                Go to{" "}
                <span style={{ color: COLORS.greenDeep, fontWeight: 800 }}>
                  build.nvidia.com
                </span>
              </>
            }
          />
          <Step
            n={2}
            index={1}
            text={
              <>
                Pick a model &rarr;{" "}
                <span style={{ fontWeight: 800 }}>Get API Key</span>
              </>
            }
          />
          <Step n={3} index={2} text={<>Paste it into your app</>} />
        </div>

        {/* code card */}
        <div
          style={{
            background: "#0E1408",
            borderRadius: 26,
            boxShadow: "0 26px 60px rgba(20,24,15,0.22)",
            padding: "30px 34px",
            transform: `translateY(${(1 - codeCard) * 26}px)`,
            opacity: codeCard,
          }}
        >
          <div style={{ display: "flex", gap: 9, marginBottom: 22 }}>
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#FF5F57",
              }}
            />
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#FEBC2E",
              }}
            />
            <span
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: COLORS.green,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 34,
              fontWeight: 600,
              color: "#E7F2D8",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              minHeight: 48,
            }}
          >
            <span style={{ color: COLORS.green }}>$ </span>
            {CMD.slice(0, typed)}
            <span
              style={{
                opacity: typed < CMD.length ? 1 : 0,
                color: COLORS.green,
              }}
            >
              ▋
            </span>
          </div>
          <div
            style={{
              marginTop: 22,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(118,185,0,0.16)",
              border: "1px solid rgba(118,185,0,0.5)",
              opacity: ok,
              transform: `scale(${0.7 + 0.3 * ok})`,
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: COLORS.green,
              }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 28,
                fontWeight: 700,
                color: "#E7F2D8",
              }}
            >
              200 OK &middot; OpenAI-compatible &middot; $0
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Payoff ($0)
// ---------------------------------------------------------------------------

const ScenePayoff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const big = spring({
    frame: frame - 6,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const sub = spring({
    frame: frame - 22,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const rowEnter = spring({
    frame: frame - 34,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  return (
    <AbsoluteFill style={{ opacity: introOp }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 34,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 300,
            fontWeight: 800,
            letterSpacing: -10,
            color: COLORS.green,
            lineHeight: 1,
            transform: `scale(${0.55 + 0.45 * big})`,
            opacity: big,
          }}
        >
          $0
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 700,
            color: COLORS.ink,
            textAlign: "center",
            maxWidth: 800,
            transform: `translateY(${(1 - sub) * 16}px)`,
            opacity: sub,
          }}
        >
          to run{" "}
          <span style={{ color: COLORS.greenDeep, fontWeight: 800 }}>
            80+ models
          </span>{" "}
          in your own apps
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            opacity: rowEnter,
            transform: `translateY(${(1 - rowEnter) * 14}px)`,
          }}
        >
          {MODELS.map((m) => (
            <div
              key={m.file}
              style={{
                width: 86,
                height: 86,
                borderRadius: 20,
                background: COLORS.card,
                border: `1px solid ${COLORS.line}`,
                boxShadow: "0 12px 26px rgba(20,24,15,0.08)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Img
                src={staticFile(`nvidia-reel/logos/${m.file}.svg`)}
                style={{ width: 48, height: 48 }}
              />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — CTA (ends on the CTA)
// ---------------------------------------------------------------------------

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const head = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 150 },
  });
  const pill = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, stiffness: 160 },
  });
  const pulse = 1 + 0.03 * Math.sin((frame - 30) / 6);

  return (
    <AbsoluteFill style={{ opacity: introOp }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 46,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - head) * 16}px)`,
            opacity: head,
          }}
        >
          <NvidiaMark size={58} />
        </div>

        <h1
          style={{
            fontFamily: FONT,
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: -1.6,
            color: COLORS.ink,
            textAlign: "center",
            margin: 0,
            transform: `translateY(${(1 - head) * 18}px)`,
            opacity: head,
          }}
        >
          Want the setup?
        </h1>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "30px 52px",
            borderRadius: 999,
            background: COLORS.green,
            boxShadow: "0 22px 50px rgba(118,185,0,0.4)",
            transform: `scale(${(0.7 + 0.3 * pill) * (frame > 30 ? pulse : 1)})`,
            opacity: pill,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: -1,
              color: "#fff",
            }}
          >
            Comment &ldquo;API&rdquo;
          </span>
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 600,
            color: COLORS.muted,
            textAlign: "center",
            transform: `translateY(${(1 - pill) * 14}px)`,
            opacity: pill,
          }}
        >
          and I&rsquo;ll send you the free step-by-step guide.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Root composition — sequences the beats
// ---------------------------------------------------------------------------

export const DURATION_IN_FRAMES = 930; // 31s @ 30fps

export const NvidiaFreeApi: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: COLORS.paper }}>
      <Background />
      <Sequence durationInFrames={115}>
        <SceneHook />
      </Sequence>
      <Sequence from={115} durationInFrames={140}>
        <SceneCatch />
      </Sequence>
      <Sequence from={255} durationInFrames={185}>
        <SceneLogos />
      </Sequence>
      <Sequence from={440} durationInFrames={210}>
        <SceneSetup />
      </Sequence>
      <Sequence from={650} durationInFrames={145}>
        <ScenePayoff />
      </Sequence>
      <Sequence from={795} durationInFrames={135}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
