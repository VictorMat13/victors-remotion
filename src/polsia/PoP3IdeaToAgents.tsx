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
import { loadFont as loadMonoFont } from "@remotion/google-fonts/IBMPlexMono";
import {
  WORLD,
  POLSIA,
  STRINGS,
  FACES,
  FONT_SERIF,
  FONT_MONO,
} from "./theme";

loadSerif();
loadMonoFont();

export const DURATION_IN_FRAMES = 310;

// ---------------------------------------------------------------------------
// PoP3 — "Idea in → the company materializes" (1080x1920, 30fps)
// One continuous vertical world; the camera travels down as agents spawn.
// ---------------------------------------------------------------------------

const VW = 1080;
const VH = 1920;
const SAFE = 54; // 5% side margin
const CW = VW - SAFE * 2; // 972

const EASE = Easing.inOut(Easing.cubic);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// --- World layout (y coordinates) ------------------------------------------
const TERM_Y = 0;
const TERM_H = 240;
const TODAY_Y = 330;
const BUBBLE_TOP = 392;
const INPUT_Y = 630;
const INPUT_H = 140;
const MASCOT_Y = 850;
const MASCOT_H = 300;
const RESEARCH_Y = 1230;
const RESEARCH_H = 420;
const SITE_Y = 1730;
const SITE_H = 560;
const EMAIL_Y = 2370;
const EMAIL_H = 330;

// --- Timing -----------------------------------------------------------------
const SEND_F = 33; // SEND chip press
const BUBBLE_F = 38; // idea becomes a bubble
const TERM_IN = 55; // terminal band slides in
const TERM_TYPE = 58; // first terminal line starts typing
const TERM_STRIDE = 27; // frames between terminal lines
const MASCOT_F = 56; // mascot card pops
const RESEARCH_F = 110;
const SITE_F = 156;
const EMAIL_F = 212;
const LAUNCH_F = 238; // email send arrow launches
const TICK_F = 242; // 0 SENT -> 1 SENT

// --- The typed idea (genuine UI content, not narration) ---------------------
const IDEA = "an AI agent that handles invoices for small teams";

// Fast, bursty typing: chunks of chars land together, tiny pauses between.
const IDEA_STARTS: number[] = (() => {
  const bursts = [4, 6, 3, 7, 5, 4, 6, 5, 8]; // sums to 48 = IDEA.length
  const starts: number[] = [];
  let f = 3;
  let i = 0;
  for (let b = 0; b < bursts.length && i < IDEA.length; b++) {
    for (let k = 0; k < bursts[b] && i < IDEA.length; k++, i++) {
      starts.push(f + k * 0.45);
    }
    f += 2 + (b % 3);
  }
  return starts;
})();

const ideaChars = (frame: number): number => {
  if (frame >= SEND_F) return IDEA.length;
  let n = 0;
  for (const s of IDEA_STARTS) if (frame >= s) n++;
  return n;
};

// --- Mascot face (from the real DOM string; box drawn as a crisp rect) ------
const FACE_ROWS = FACES.brainstorming
  .split("\n")
  .slice(1, 4)
  .map((r) => r.replace(/^│/, "").replace(/│.*$/, ""));

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const enterFall = (
  frame: number,
  fps: number,
  at: number
): React.CSSProperties => {
  const s = spring({
    frame: Math.max(0, frame - at),
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const o = interpolate(frame, [at, at + 9], [0, 1], CLAMP);
  return {
    opacity: o,
    transform: `translateY(${(1 - s) * -58}px) scale(${0.975 + 0.025 * s})`,
  };
};

const wipe = (frame: number, at: number, dur = 10): number =>
  interpolate(frame, [at, at + dur], [0, 1], { ...CLAMP, easing: EASE });

const fadeUp = (frame: number, at: number, dur = 8): React.CSSProperties => ({
  opacity: interpolate(frame, [at, at + dur], [0, 1], CLAMP),
  transform: `translateY(${interpolate(frame, [at, at + dur], [14, 0], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

const cardShell: React.CSSProperties = {
  position: "absolute",
  left: SAFE,
  width: CW,
  backgroundColor: WORLD.card,
  border: `1.5px solid ${WORLD.border}`,
  borderRadius: WORLD.radius,
  boxShadow: WORLD.shadowSoft,
  padding: 42,
  boxSizing: "border-box",
};

const SectionHeading: React.FC<{
  label: string;
  frame: number;
  at: number;
}> = ({ label, frame, at }) => (
  <div style={{ marginBottom: 26 }}>
    <div
      style={{
        fontFamily: FONT_SERIF,
        fontSize: 34,
        fontWeight: 600,
        color: POLSIA.ink,
        ...fadeUp(frame, at),
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 12,
        height: 2,
        backgroundColor: POLSIA.rule,
        transform: `scaleX(${wipe(frame, at + 3, 12)})`,
        transformOrigin: "left center",
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Icons (monochrome, hand-rolled)
// ---------------------------------------------------------------------------
const PaperclipIcon: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 11.5 12.5 19a5 5 0 0 1-7-7l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.8 1.8 0 0 1-2.5-2.5l7-7"
      stroke={POLSIA.grayText}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MicIcon: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect
      x="9"
      y="3"
      width="6"
      height="11"
      rx="3"
      stroke={POLSIA.grayText}
      strokeWidth="1.8"
    />
    <path
      d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"
      stroke={POLSIA.grayText}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const SentArrowIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <path d="M7 4h16" stroke={POLSIA.ink} strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M15 26V10M9 15.5 15 9.5l6 6"
      stroke={POLSIA.ink}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DocAsciiIcon: React.FC = () => (
  <pre
    style={{
      margin: 0,
      fontFamily: FONT_MONO,
      fontSize: 13,
      lineHeight: 1.08,
      color: POLSIA.ink,
      opacity: 0.8,
    }}
  >
    {"▛▀▀▜\n▌▒▒▐\n▌▒▒▐\n▙▄▄▟"}
  </pre>
);

// ---------------------------------------------------------------------------
// Terminal band — black strip streaming real log lines
// ---------------------------------------------------------------------------
const TerminalBand: React.FC<{ frame: number }> = ({ frame }) => {
  const slideY = interpolate(frame, [TERM_IN, TERM_IN + 16], [-620, 0], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const lines = STRINGS.terminal as readonly string[];
  const LINE_H = 42;
  const MAXV = 4;
  const starts = lines.map((_, i) => TERM_TYPE + i * TERM_STRIDE);

  let scroll = 0;
  starts.forEach((s, i) => {
    if (i >= MAXV) {
      scroll += interpolate(frame, [s, s + 6], [0, LINE_H], {
        ...CLAMP,
        easing: EASE,
      });
    }
  });

  const blink = Math.floor(frame / 8) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: TERM_Y,
        width: VW,
        height: TERM_H,
        backgroundColor: POLSIA.termBg,
        overflow: "hidden",
        transform: `translateY(${slideY}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 28,
          transform: `translateY(${-scroll}px)`,
        }}
      >
        {lines.map((line, i) => {
          const chars = Math.max(
            0,
            Math.min(line.length, Math.floor((frame - starts[i]) * 2.6))
          );
          if (chars <= 0) return null;
          const typing = chars < line.length;
          const isLast = i === lines.length - 1;
          const showCursor =
            typing || (isLast && chars >= line.length && blink);
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 24,
                lineHeight: `${LINE_H}px`,
                color: POLSIA.termText,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {line.slice(0, chars)}
              {showCursor ? (
                <span style={{ opacity: typing ? 1 : 0.9 }}>▌</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chat: idea bubble + input card (faithful to the real chat panel)
// ---------------------------------------------------------------------------
const ChatArea: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const chars = ideaChars(frame);
  const typed = IDEA.slice(0, chars);
  const typingDone = chars >= IDEA.length;
  const sent = frame >= BUBBLE_F;

  const caretOn = Math.floor(frame / 8) % 2 === 0;

  // SEND press
  const pressScale = interpolate(frame, [SEND_F - 1, SEND_F + 1, SEND_F + 5], [1, 0.9, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const rippleP = interpolate(frame, [SEND_F + 1, SEND_F + 12], [0, 1], CLAMP);

  // Bubble entrance
  const bubbleS = spring({
    frame: Math.max(0, frame - BUBBLE_F),
    fps,
    config: { damping: 14, stiffness: 190 },
  });
  const bubbleO = interpolate(frame, [BUBBLE_F, BUBBLE_F + 6], [0, 1], CLAMP);

  const todayO = interpolate(frame, [BUBBLE_F + 2, BUBBLE_F + 10], [0, 1], CLAMP);

  // placeholder returns after send
  const placeholderO = sent
    ? interpolate(frame, [BUBBLE_F + 2, BUBBLE_F + 10], [0, 1], CLAMP)
    : chars > 0
      ? 0
      : 1;

  return (
    <>
      {/* TODAY divider */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          width: CW,
          top: TODAY_Y,
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: todayO,
        }}
      >
        <div style={{ flex: 1, height: 1, backgroundColor: WORLD.border }} />
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 20,
            letterSpacing: 4,
            color: WORLD.faint,
          }}
        >
          TODAY
        </div>
        <div style={{ flex: 1, height: 1, backgroundColor: WORLD.border }} />
      </div>

      {/* the idea, as a right-aligned gray bubble */}
      <div
        style={{
          position: "absolute",
          right: SAFE,
          top: BUBBLE_TOP,
          width: CW,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          opacity: bubbleO,
          transform: `translateY(${(1 - bubbleS) * 26}px) scale(${
            0.92 + 0.08 * bubbleS
          })`,
          transformOrigin: "bottom right",
        }}
      >
        <div
          style={{
            maxWidth: 640,
            backgroundColor: "#EBE9E4",
            border: `1px solid ${WORLD.borderSoft}`,
            borderRadius: 14,
            padding: "24px 32px",
            fontFamily: FONT_SERIF,
            fontSize: 38,
            lineHeight: 1.35,
            color: POLSIA.ink,
          }}
        >
          {IDEA}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: FONT_MONO,
            fontSize: 21,
            letterSpacing: 2,
            color: WORLD.faint,
            opacity: interpolate(frame, [BUBBLE_F + 6, BUBBLE_F + 14], [0, 1], CLAMP),
          }}
        >
          11:44 AM
        </div>
      </div>

      {/* input card */}
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: INPUT_Y,
          width: CW,
          height: INPUT_H,
          backgroundColor: WORLD.card,
          border: `1.5px solid ${WORLD.border}`,
          borderRadius: 18,
          boxShadow: WORLD.shadowSoft,
          display: "flex",
          alignItems: "center",
          padding: "0 30px",
          boxSizing: "border-box",
          gap: 20,
        }}
      >
        <PaperclipIcon />
        <MicIcon />
        <div
          style={{
            flex: 1,
            position: "relative",
            height: 48,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* placeholder */}
          <div
            style={{
              position: "absolute",
              left: 0,
              fontFamily: FONT_SERIF,
              fontSize: 30,
              color: POLSIA.grayText,
              opacity: placeholderO,
              whiteSpace: "nowrap",
            }}
          >
            Ask Polsia anything...
          </div>
          {/* typed idea */}
          {!sent && chars > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                fontFamily: FONT_SERIF,
                fontSize: 28,
                color: POLSIA.ink,
                whiteSpace: "nowrap",
              }}
            >
              {typed}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 32,
                  marginLeft: 4,
                  verticalAlign: "-6px",
                  backgroundColor: POLSIA.ink,
                  opacity: typingDone ? (caretOn ? 1 : 0) : 1,
                }}
              />
            </div>
          ) : null}
        </div>
        {/* SEND chip + press ripple */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              backgroundColor: "#C9C6C0",
              color: "#FFFFFF",
              fontFamily: FONT_MONO,
              fontSize: 24,
              letterSpacing: 4,
              padding: "13px 24px",
              borderRadius: 8,
              transform: `scale(${pressScale})`,
            }}
          >
            SEND
          </div>
          {rippleP > 0 && rippleP < 1 ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 110,
                height: 110,
                marginLeft: -55,
                marginTop: -55,
                borderRadius: "50%",
                border: `2px solid ${POLSIA.ink}`,
                opacity: 0.45 * (1 - rippleP),
                transform: `scale(${0.55 + rippleP * 1.15})`,
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Mascot mood card — Brainstorming
// ---------------------------------------------------------------------------
const MascotCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const bob = Math.sin(frame / 9) * 2.5;
  const tw = Math.abs(Math.sin(frame / 7));
  return (
    <div
      style={{
        ...cardShell,
        top: MASCOT_Y,
        height: MASCOT_H,
        padding: 40,
        display: "flex",
        alignItems: "center",
        gap: 44,
        ...enterFall(frame, fps, MASCOT_F),
      }}
    >
      <div style={{ position: "relative", transform: `translateY(${bob}px)` }}>
        <div
          style={{
            width: 196,
            height: 156,
            border: `2px solid ${POLSIA.ink}`,
            backgroundColor: WORLD.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: FONT_MONO,
              fontSize: 27,
              lineHeight: 1.3,
              color: POLSIA.ink,
              whiteSpace: "pre",
            }}
          >
            {FACE_ROWS.join("\n")}
          </pre>
        </div>
        {/* the ✧ from the brainstorming face, twinkling beside the box */}
        <div
          style={{
            position: "absolute",
            right: -34,
            top: -24,
            fontFamily: FONT_MONO,
            fontSize: 34,
            color: POLSIA.ink,
            opacity: 0.35 + 0.65 * tw,
            transform: `scale(${0.85 + 0.25 * tw}) rotate(${tw * 20 - 10}deg)`,
          }}
        >
          ✧
        </div>
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            ...fadeUp(frame, MASCOT_F + 7),
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              backgroundColor: POLSIA.orange,
              opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 11)),
            }}
          />
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 48,
              fontWeight: 500,
              color: POLSIA.ink,
            }}
          >
            {STRINGS.moods.brainstorming.label}
          </div>
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT_SERIF,
            fontSize: 30,
            color: POLSIA.grayText,
            ...fadeUp(frame, MASCOT_F + 13),
          }}
        >
          {STRINGS.moods.brainstorming.sub}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Artifact 1 — RESEARCH document card
// ---------------------------------------------------------------------------
const ResearchCard: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const barWidths = [88, 96, 80, 92, 58];
  return (
    <div
      style={{
        ...cardShell,
        top: RESEARCH_Y,
        height: RESEARCH_H,
        ...enterFall(frame, fps, RESEARCH_F),
      }}
    >
      <SectionHeading label="Documents" frame={frame} at={RESEARCH_F + 6} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          ...fadeUp(frame, RESEARCH_F + 12),
        }}
      >
        <DocAsciiIcon />
        <div
          style={{
            flex: 1,
            fontFamily: FONT_SERIF,
            fontSize: 38,
            fontWeight: 500,
            color: POLSIA.ink,
          }}
        >
          Market Research
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 21,
            letterSpacing: 2,
            color: WORLD.faint,
          }}
        >
          5M AGO
        </div>
      </div>
      <div style={{ marginTop: 20, ...fadeUp(frame, RESEARCH_F + 17) }}>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 19,
            letterSpacing: 3,
            color: POLSIA.ink,
            backgroundColor: POLSIA.cardGray,
            padding: "8px 15px",
            borderRadius: 6,
          }}
        >
          RESEARCH
        </span>
      </div>
      <div style={{ marginTop: 28 }}>
        {barWidths.map((w, i) => (
          <div
            key={i}
            style={{
              height: 14,
              borderRadius: 7,
              backgroundColor: "#E6E3DD",
              width: `${w}%`,
              marginBottom: 16,
              transform: `scaleX(${wipe(frame, RESEARCH_F + 18 + i * 4, 8)})`,
              transformOrigin: "left center",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Artifact 2 — LANDING PAGE mini-browser card
// ---------------------------------------------------------------------------
const SiteCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const URL = "tactra-3.polsia.io";
  const urlChars = Math.max(
    0,
    Math.min(URL.length, Math.floor((frame - (SITE_F + 14)) * 1.9))
  );
  const shimmerX = interpolate(frame, [SITE_F + 34, SITE_F + 50], [-420, 1200], {
    ...CLAMP,
    easing: EASE,
  });
  const shimmerO =
    frame > SITE_F + 34 && frame < SITE_F + 50
      ? interpolate(frame, [SITE_F + 34, SITE_F + 38, SITE_F + 46, SITE_F + 50], [0, 0.8, 0.8, 0], CLAMP)
      : 0;
  // Real Tactra hero (public/polsia/reference/tactra-01-hero.png) revealed
  // top-to-bottom inside the mini browser once the URL has typed.
  const reveal = wipe(frame, SITE_F + 16, 16);
  const settle = interpolate(frame, [SITE_F + 16, SITE_F + 40], [1.03, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        ...cardShell,
        top: SITE_Y,
        height: SITE_H,
        ...enterFall(frame, fps, SITE_F),
      }}
    >
      <SectionHeading label="Website" frame={frame} at={SITE_F + 6} />
      <div
        style={{
          border: "1.5px solid #E2DFD9",
          borderRadius: 14,
          overflow: "hidden",
          ...fadeUp(frame, SITE_F + 10),
        }}
      >
        {/* browser chrome */}
        <div
          style={{
            height: 58,
            backgroundColor: "#F4F2EE",
            borderBottom: "1px solid #E7E4DE",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#D8D5CE",
              }}
            />
          ))}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: `1px solid ${WORLD.border}`,
                borderRadius: 6,
                padding: "6px 18px",
                fontFamily: FONT_MONO,
                fontSize: 22,
                letterSpacing: 1,
                color: POLSIA.grayText,
                minWidth: 220,
                textAlign: "center",
              }}
            >
              {URL.slice(0, urlChars)}
              {urlChars > 0 && urlChars < URL.length ? "▌" : ""}
            </div>
          </div>
          <div style={{ width: 56 }} />
        </div>
        {/* the real Tactra landing page, revealed inside the browser */}
        <div
          style={{
            position: "relative",
            height: 352,
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`,
              opacity: Math.min(1, reveal * 2),
            }}
          >
            <Img
              src={staticFile("polsia/reference/tactra-01-hero.png")}
              style={{
                display: "block",
                width: "100%",
                transform: `translateY(-40px) scale(${settle})`,
                transformOrigin: "center top",
              }}
            />
          </div>
          {/* shimmer sweep */}
          <div
            style={{
              position: "absolute",
              top: -80,
              left: 0,
              width: 260,
              height: 560,
              background:
                "linear-gradient(105deg, rgba(255,255,255,0) 15%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 85%)",
              transform: `translateX(${shimmerX}px) rotate(6deg)`,
              opacity: shimmerO,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Artifact 3 — OUTREACH email card
// ---------------------------------------------------------------------------
const RollingDigit: React.FC<{ frame: number }> = ({ frame }) => {
  const p = interpolate(frame, [TICK_F, TICK_F + 8], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  return (
    <span
      style={{
        display: "inline-block",
        height: 26,
        overflow: "hidden",
        verticalAlign: "bottom",
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(${-26 * p}px)`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ display: "block", height: 26, lineHeight: "26px" }}>0</span>
        <span style={{ display: "block", height: 26, lineHeight: "26px" }}>1</span>
      </span>
    </span>
  );
};

const EmailCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const launchP = interpolate(frame, [LAUNCH_F, LAUNCH_F + 13], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        ...cardShell,
        top: EMAIL_Y,
        height: EMAIL_H,
        ...enterFall(frame, fps, EMAIL_F),
      }}
    >
      <SectionHeading label="Email" frame={frame} at={EMAIL_F + 6} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          ...fadeUp(frame, EMAIL_F + 12),
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            // send hop: the arrow itself jumps up and settles as the mail goes out
            transform: `translateY(${-Math.sin(launchP * Math.PI) * 16}px) rotate(${
              -Math.sin(launchP * Math.PI) * 10
            }deg)`,
          }}
        >
          <SentArrowIcon />
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: FONT_SERIF,
            fontSize: 38,
            fontWeight: 500,
            color: POLSIA.ink,
          }}
        >
          Welcome to Tactra!
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          marginLeft: 52,
          fontFamily: FONT_MONO,
          fontSize: 22,
          letterSpacing: 1,
          color: POLSIA.grayText,
          ...fadeUp(frame, EMAIL_F + 17),
        }}
      >
        liam@gmail.com
      </div>
      <div
        style={{
          marginTop: 24,
          height: 1,
          backgroundColor: WORLD.border,
          transform: `scaleX(${wipe(frame, EMAIL_F + 18, 10)})`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: FONT_MONO,
          fontSize: 21,
          letterSpacing: 2,
          ...fadeUp(frame, EMAIL_F + 20),
        }}
      >
        <div style={{ color: POLSIA.grayText, fontVariantNumeric: "tabular-nums" }}>
          <RollingDigit frame={frame} /> SENT · 0 RECEIVED
        </div>
        <div style={{ color: POLSIA.ink }}>VIEW ALL</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root composition — camera rig over the continuous world
// ---------------------------------------------------------------------------
export const PoP3IdeaToAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const KEY_T = [0, 44, 62, 100, 118, 148, 164, 202, 218, 252, 278, 300, 309];
  const fy = interpolate(
    frame,
    KEY_T,
    [640, 640, 700, 700, 1440, 1440, 2010, 2010, 2535, 2535, 1350, 1350, 1350],
    { easing: EASE, ...CLAMP }
  );
  const z = interpolate(
    frame,
    KEY_T,
    [0.99, 0.99, 0.95, 0.95, 0.97, 0.97, 0.97, 0.97, 0.98, 0.98, 0.54, 0.54, 0.54],
    { easing: EASE, ...CLAMP }
  );
  const fx = VW / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: WORLD.bg }}>
      <div
        style={{
          position: "absolute",
          width: VW,
          transform: `translate(${VW / 2 - fx}px, ${VH / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        <TerminalBand frame={frame} />
        <ChatArea frame={frame} fps={fps} />
        <MascotCard frame={frame} fps={fps} />
        <ResearchCard frame={frame} fps={fps} />
        <SiteCard frame={frame} fps={fps} />
        <EmailCard frame={frame} fps={fps} />
      </div>
    </AbsoluteFill>
  );
};
