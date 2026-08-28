import React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { BH, WORLD } from "./constants";

const { fontFamily: MONO } = loadMono();

// ---------------------------------------------------------------------------
// TerminalPanel — the pain→calm beat of the Bluehost × Hermes walkthrough.
// Pure renderer: every pixel is a deterministic function of the `t` prop
// (local frame number @ 30fps). No useCurrentFrame, no CSS animation.
// ---------------------------------------------------------------------------

// Phase boundaries + camera-sync beats. "Done" keys mark the frame the
// step's final output line lands (the sigh-of-relief moment):
//   sshDone    → "Welcome to Ubuntu…" appears (connection established)
//   updateDone → "✓ Update complete" appears
//   setupDone  → "✓ Setup complete" appears
//   tuiDrawn   → last TUI element (status bar) fully settled
export const TERM_PHASES = {
  chaosStart: 0,
  wipeStart: 110,
  cleanStart: 126,
  sshTypeStart: 138,
  sshDone: 190,
  updateTypeStart: 205,
  updateDone: 258,
  setupTypeStart: 273,
  wizardSelect: 303,
  setupDone: 382,
  tuiTypeStart: 397,
  tuiStart: 405,
  tuiDrawn: 453,
} as const;

// Fine-grained internal beats (derived from TERM_PHASES; commands reveal at
// 1.1 chars/frame, outputs land 2f after a command completes, successive
// output lines +3f, realistic execution waits in between).
const B = {
  // phase 3 — ssh
  prompt1: 112, // "$ " prompt fades in during the wipe
  sshTyped: 160, // 138 + ceil(24 / 1.1)
  sshWelcome: 190, // 30f connect wait → = TERM_PHASES.sshDone
  prompt2: 193,
  // phase 3 — hermes update
  updTyped: 217, // 205 + ceil(13 / 1.1)
  updOut1: 219, // ✓ Release channel: stable
  updOut2: 222, // ✓ Downloading hermes v2.4.1
  updOut3: 258, // ✓ Update complete (36f download) → = updateDone
  prompt3: 261,
  // phase 3 — hermes setup
  setTyped: 284, // 273 + ceil(12 / 1.1)
  wizHead: 286, // ? Choose setup mode
  wizOpts: 289, // option rows (❯ starts on "Full Setup")
  wizSelect: 303, // ❯ hops up to "Quick Setup (recommended)"
  browser: 313, // → Opening browser login via Nous Portal…
  authed: 379, // ✓ Authenticated (66f browser round-trip)
  setDone: 382, // ✓ Setup complete → = setupDone
  prompt4: 385,
  // phase 3→4 — hermes
  tuiTyped: 403, // 397 + ceil(6 / 1.1)
  tui: 405, // = tuiStart; border begins drawing
  tuiBorderDone: 417,
  tuiHeader: 415,
  tuiTabs: 419,
  tuiRow0: 423, // rows stagger +4f each → 423/427/431/435/439
  tuiStatus: 443,
  tuiDrawn: 453,
} as const;

// ---- shared metrics ---------------------------------------------------------
const TERM_W = WORLD.term.w; // 1340
const TERM_H = WORLD.term.h; // 960
const BAR_H = 46;
const PAD = 36;
const FS = 23;
const LINE = FS * 1.5; // 34.5px
const CPF = 1.1; // typewriter chars per frame

const typedChars = (t: number, start: number, len: number) =>
  Math.min(len, Math.max(0, Math.floor((t - start) * CPF)));
const caretOn = (t: number) => Math.floor(t / 9) % 2 === 0;

// ---- phase 1 content: package-manager hell -----------------------------------
type ChaosKind = "cmd" | "out" | "err" | "warn";
const CHAOS: Array<[ChaosKind, string]> = [
  ["cmd", "$ sudo apt-get install python3.11-venv"],
  ["out", "Reading package lists... Done"],
  ["out", "Building dependency tree... Done"],
  ["err", "E: Unable to locate package python3.11-venv"],
  ["cmd", "$ sudo add-apt-repository ppa:deadsnakes/ppa"],
  ["out", "gpg: keyserver receive failed: Connection timed out"],
  ["warn", "W: GPG error: https://ppa.launchpadcontent.net jammy InRelease: NO_PUBKEY 6A755776"],
  ["err", "E: The repository 'https://ppa.launchpadcontent.net jammy InRelease' is not signed."],
  ["cmd", "$ pip install -r requirements.txt"],
  ["out", "Collecting torch==2.4.0 (from -r requirements.txt (line 1))"],
  ["err", "ERROR: Could not find a version that satisfies the requirement torch==2.4.0"],
  ["err", "ERROR: No matching distribution found for torch==2.4.0"],
  ["warn", "WARNING: You are using pip 22.0.2; however, version 24.2 is available."],
  ["cmd", "$ python3 -m venv .venv"],
  ["err", "The virtual environment was not created: ensurepip is not available"],
  ["out", "On Debian/Ubuntu systems, you need to install the python3-venv package."],
  ["cmd", "$ npm install"],
  ["warn", "npm WARN old lockfile This package-lock.json was created with an old npm"],
  ["err", "npm ERR! code ERESOLVE"],
  ["err", "npm ERR! ERESOLVE unable to resolve dependency tree"],
  ["err", 'npm ERR! peer react@"^18.0.0" from react-dom@18.3.1'],
  ["err", "npm ERR! Fix the upstream dependency conflict, or retry with --force"],
  ["cmd", "$ npm install --legacy-peer-deps"],
  ["err", "gyp ERR! stack Error: not found: make"],
  ["err", "gyp ERR! not ok"],
  ["err", "npm ERR! command sh -c node-gyp rebuild"],
  ["cmd", "$ pip install torch --no-cache-dir"],
  ["out", "Collecting torch"],
  ["out", "Downloading torch-2.4.0-cp310-manylinux1_x86_64.whl (797.1 MB)"],
  ["err", "Killed"],
  ["cmd", "$ dmesg | tail -n 2"],
  ["err", "Out of memory: Killed process 21437 (pip) total-vm:3182644kB"],
  ["cmd", "$ make build"],
  ["out", "gcc -O2 -pthread -o bin/server src/main.c"],
  ["err", "gcc: fatal error: Killed signal terminated program cc1plus"],
  ["err", "compilation terminated."],
  ["err", "make: *** [Makefile:142: build] Error 4"],
  ["cmd", "$ sudo apt-get -f install"],
  ["err", "E: dpkg was interrupted, you must manually run 'sudo dpkg --configure -a'"],
  ["cmd", "$ sudo dpkg --configure -a"],
  ["err", "dpkg: dependency problems prevent configuration of libssl-dev:amd64"],
  ["warn", "dpkg: error processing package libssl-dev (--configure):"],
  ["cmd", "$ sudo systemctl restart nginx"],
  ["err", "Failed to restart nginx.service: Unit nginx.service not found."],
  ["cmd", "$ curl -fsSL https://get.docker.com | sh"],
  ["err", "sh: 143: cannot create /etc/apt/sources.list.d/docker.list: Permission denied"],
  ["cmd", "$ sudo docker compose up -d"],
  ["err", "docker: 'compose' is not a docker command."],
  ["out", "See 'docker --help'"],
  ["cmd", "$ pip3 install -U openai"],
  ["err", "error: externally-managed-environment"],
  ["err", "× This environment is externally managed"],
  ["out", "hint: See PEP 668 for the detailed specification."],
  ["cmd", "$ node server.js"],
  ["err", "node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.28' not found"],
  ["cmd", "$ nvm use 20"],
  ["err", "nvm: command not found"],
  ["cmd", "$ sudo reboot"],
];

const CHAOS_COLOR: Record<ChaosKind, string> = {
  cmd: BH.termText,
  out: BH.termDim,
  err: BH.termRed,
  warn: BH.termYellow,
};

const CHAOS_H = CHAOS.length * LINE; // ~2001px

// ---- small render helpers -----------------------------------------------------
const Caret: React.FC<{ t: number }> = ({ t }) => (
  <span
    style={{
      display: "inline-block",
      width: 12,
      height: 26,
      marginLeft: 2,
      verticalAlign: "-5px",
      background: BH.termText,
      opacity: caretOn(t) ? 1 : 0,
    }}
  />
);

// A prompt + typewriter command line. Caret sits after the last typed char
// while this line owns the cursor (from its appearance until its command's
// first output lands).
const Cmd: React.FC<{
  t: number;
  at: number;
  typeStart: number;
  prompt: string;
  text: string;
  caretUntil: number;
}> = ({ t, at, typeStart, prompt, text, caretUntil }) => {
  if (t < at) return null;
  const n = typedChars(t, typeStart, text.length);
  return (
    <div style={{ whiteSpace: "pre", height: LINE }}>
      <span style={{ color: BH.termDim }}>{prompt}</span>
      <span style={{ color: BH.termText }}>{text.slice(0, n)}</span>
      {t < caretUntil ? <Caret t={t} /> : null}
    </div>
  );
};

// Output line — appears instantly on its frame.
const Out: React.FC<{
  t: number;
  at: number;
  children: React.ReactNode;
}> = ({ t, at, children }) => {
  if (t < at) return null;
  return <div style={{ whiteSpace: "pre", height: LINE }}>{children}</div>;
};

const Check: React.FC<{ text: string; allGreen?: boolean }> = ({
  text,
  allGreen,
}) => (
  <>
    <span style={{ color: BH.termGreen }}>✓ </span>
    <span style={{ color: allGreen ? BH.termGreen : BH.termText }}>{text}</span>
  </>
);

// TUI stagger: fade + 10px slide over 10 frames.
const enterStyle = (t: number, start: number): React.CSSProperties => {
  const p = interpolate(t, [start, start + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
};

// ---- TUI pieces -----------------------------------------------------------------
const TUI_ROWS = [
  "web-research",
  "code-runner",
  "browser-use",
  "scheduler",
  "memory",
] as const;
const TUI_TABS = ["Skills", "Models", "Messages", "Settings"] as const;

const TuiBox: React.FC<{ t: number }> = ({ t }) => {
  const boxW = TERM_W - 20; // body area minus 10px each side
  const boxH = TERM_H - BAR_H - 20;
  const rectW = boxW - 2;
  const rectH = boxH - 2;
  const perim = 2 * (rectW + rectH);
  const drawP = interpolate(t, [B.tui, B.tuiBorderDone], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // connected-dot pulse + active-tab underline shimmer (hold forever)
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.16);
  const dotOpacity = 0.62 + 0.38 * pulse;
  const underlineOpacity = 0.86 + 0.04 * Math.sin(t * 0.33);

  return (
    <div
      style={{
        position: "absolute",
        left: 10,
        top: BAR_H + 10,
        width: boxW,
        height: boxH,
      }}
    >
      {/* border draws itself in over 12 frames */}
      <svg
        width={boxW}
        height={boxH}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <rect
          x={1}
          y={1}
          width={rectW}
          height={rectH}
          rx={10}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={2}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - drawP)}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          top: 30,
          bottom: 24,
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            ...enterStyle(t, B.tuiHeader),
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: BH.termText,
            }}
          >
            HERMES AGENT
          </span>
          <span style={{ fontSize: 20, color: BH.termDim, marginLeft: 18 }}>
            v2.4.1
          </span>
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: BH.termGreen,
                opacity: dotOpacity,
                boxShadow: `0 0 ${8 + 6 * pulse}px rgba(74,222,128,${
                  0.45 * dotOpacity
                })`,
              }}
            />
            <span style={{ fontSize: 20, color: BH.termText }}>connected</span>
          </span>
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 30,
            ...enterStyle(t, B.tuiTabs),
          }}
        >
          {TUI_TABS.map((tab, i) => {
            const active = i === 0;
            return (
              <span
                key={tab}
                style={{
                  position: "relative",
                  fontSize: 22,
                  padding: "8px 20px",
                  borderRadius: 8,
                  color: active ? BH.termBlue : BH.termDim,
                  background: active ? "rgba(96,165,250,0.18)" : "transparent",
                }}
              >
                {`[ ${tab} ]`}
                {active ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 2,
                      height: 3,
                      borderRadius: 2,
                      background: BH.termBlue,
                      opacity: underlineOpacity,
                    }}
                  />
                ) : null}
              </span>
            );
          })}
        </div>

        {/* skills list */}
        <div style={{ marginTop: 34 }}>
          {TUI_ROWS.map((name, i) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                height: 58,
                borderBottom:
                  i < TUI_ROWS.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
                ...enterStyle(t, B.tuiRow0 + i * 4),
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: BH.termGreen,
                  marginRight: 16,
                }}
              />
              <span style={{ fontSize: FS, color: BH.termText }}>{name}</span>
              <span
                style={{ marginLeft: "auto", fontSize: 21, color: BH.termDim }}
              >
                enabled
              </span>
            </div>
          ))}
        </div>

        {/* status bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 21,
            color: BH.termDim,
            ...enterStyle(t, B.tuiStatus),
          }}
        >
          {"model: Hermes-4 · tools: 12 · "}
          <span style={{ color: BH.termGreen }}>ready</span>
        </div>
      </div>
    </div>
  );
};

// ---- main component ---------------------------------------------------------------
export const TerminalPanel: React.FC<{ t: number }> = ({ t }) => {
  // ----- phase 1+2 motion: scroll, jitter, wipe -----
  const chaosScroll = interpolate(t, [0, 16, TERM_PHASES.wipeStart], [0, 55, 545], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wipeExtra = interpolate(
    t,
    [TERM_PHASES.wipeStart, TERM_PHASES.cleanStart],
    [0, 1600],
    {
      easing: Easing.in(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const jitterAmp = interpolate(t, [106, 118], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const jx =
    jitterAmp * (0.9 * Math.sin(t * 0.93) + 0.6 * Math.sin(t * 2.31 + 1.7));
  const chaosGone = chaosScroll + wipeExtra >= CHAOS_H;
  const showChaos = t < TERM_PHASES.cleanStart + 4 && !chaosGone;

  // ----- phase 3 visibility: fade in during wipe, fade out under the TUI -----
  const cleanOpacity =
    interpolate(t, [B.prompt1, TERM_PHASES.cleanStart], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [TERM_PHASES.tuiStart, TERM_PHASES.tuiStart + 14], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const showClean = t >= B.prompt1 && cleanOpacity > 0.001;

  const wizSelected = t >= B.wizSelect ? 0 : 1; // 0 = Quick, 1 = Full

  return (
    <div
      style={{
        width: TERM_W,
        height: TERM_H,
        boxSizing: "border-box",
        position: "relative",
        borderRadius: 18,
        background: BH.termBg,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        overflow: "hidden",
        fontFamily: MONO,
      }}
    >
      {/* title bar */}
      <div
        style={{
          position: "relative",
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          paddingLeft: 20,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 9 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: BH.termDim,
          }}
        >
          root@vps — ssh
        </div>
      </div>

      {/* body */}
      <div
        style={{
          position: "absolute",
          top: BAR_H,
          left: 0,
          right: 0,
          bottom: 0,
          padding: PAD,
          overflow: "hidden",
          fontSize: FS,
          lineHeight: `${LINE}px`,
        }}
      >
        {/* PHASE 1+2 — chaos wall */}
        {showChaos ? (
          <div
            style={{
              transform: `translate(${jx.toFixed(
                2
              )}px, ${(-(chaosScroll + wipeExtra)).toFixed(2)}px)`,
            }}
          >
            {CHAOS.map(([kind, text], i) => (
              <div
                key={i}
                style={{
                  whiteSpace: "pre",
                  height: LINE,
                  color: CHAOS_COLOR[kind],
                }}
              >
                {text}
              </div>
            ))}
          </div>
        ) : null}

        {/* PHASE 3 — clean flow scrollback */}
        {showClean ? (
          <div style={{ opacity: cleanOpacity }}>
            <Cmd
              t={t}
              at={B.prompt1}
              typeStart={TERM_PHASES.sshTypeStart}
              prompt="$ "
              text="ssh root@129.121.113.125"
              caretUntil={B.sshWelcome}
            />
            <Out t={t} at={B.sshWelcome}>
              <span style={{ color: BH.termDim }}>
                Welcome to Ubuntu 24.04 LTS (Hermes Agent image)
              </span>
            </Out>
            {t >= B.prompt2 ? <div style={{ height: LINE }} /> : null}
            <Cmd
              t={t}
              at={B.prompt2}
              typeStart={TERM_PHASES.updateTypeStart}
              prompt="root@vps:~# "
              text="hermes update"
              caretUntil={B.updOut1}
            />
            <Out t={t} at={B.updOut1}>
              <Check text="Release channel: stable" />
            </Out>
            <Out t={t} at={B.updOut2}>
              <Check text="Downloading hermes v2.4.1" />
            </Out>
            <Out t={t} at={B.updOut3}>
              <Check text="Update complete" />
            </Out>
            {t >= B.prompt3 ? <div style={{ height: LINE }} /> : null}
            <Cmd
              t={t}
              at={B.prompt3}
              typeStart={TERM_PHASES.setupTypeStart}
              prompt="root@vps:~# "
              text="hermes setup"
              caretUntil={B.wizHead}
            />
            {/* wizard block */}
            {t >= B.wizHead ? (
              <div
                style={{
                  paddingLeft: 22,
                  borderLeft: `3px solid ${BH.termBlue}`,
                  margin: "6px 0 6px 28px",
                }}
              >
                <div
                  style={{ whiteSpace: "pre", height: LINE, color: BH.termBlue }}
                >
                  ? Choose setup mode
                </div>
                {t >= B.wizOpts ? (
                  <>
                    <div
                      style={{
                        whiteSpace: "pre",
                        height: LINE,
                        color: wizSelected === 0 ? BH.termGreen : BH.termDim,
                      }}
                    >
                      {wizSelected === 0
                        ? "  ❯ Quick Setup (recommended)"
                        : "    Quick Setup (recommended)"}
                    </div>
                    <div
                      style={{
                        whiteSpace: "pre",
                        height: LINE,
                        color: wizSelected === 1 ? BH.termGreen : BH.termDim,
                      }}
                    >
                      {wizSelected === 1 ? "  ❯ Full Setup" : "    Full Setup"}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            <Out t={t} at={B.browser}>
              <span style={{ color: BH.termDim }}>
                → Opening browser login via Nous Portal…
              </span>
            </Out>
            <Out t={t} at={B.authed}>
              <Check text="Authenticated" allGreen />
            </Out>
            <Out t={t} at={B.setDone}>
              <Check text="Setup complete" allGreen />
            </Out>
            {t >= B.prompt4 ? <div style={{ height: LINE }} /> : null}
            <Cmd
              t={t}
              at={B.prompt4}
              typeStart={TERM_PHASES.tuiTypeStart}
              prompt="root@vps:~# "
              text="hermes"
              caretUntil={TERM_PHASES.tuiStart}
            />
          </div>
        ) : null}
      </div>

      {/* PHASE 4 — Hermes TUI */}
      {t >= TERM_PHASES.tuiStart ? <TuiBox t={t} /> : null}

      {/* inner vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 100% at 50% 38%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.30) 100%)",
        }}
      />
    </div>
  );
};
