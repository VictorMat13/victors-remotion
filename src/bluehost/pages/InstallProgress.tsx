import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { BH } from "../constants";

const { fontFamily: inter } = loadInter();

const hexA = (hex: string, a: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const STEPS = [
  { label: "Provisioning image", at: 0.22 },
  { label: "Installing Hermes Agent", at: 0.52 },
  { label: "Configuring services", at: 0.8 },
  { label: "Server ready", at: 0.98 },
];

const CARD_W = 760;
const CARD_H = 560;

export const InstallProgress: React.FC<{ progress: number }> = ({
  progress,
}) => {
  const p = clamp01(progress);
  const done = p >= 1;
  // first step whose threshold has not been passed yet
  const activeIdx = STEPS.findIndex((s) => p < s.at);
  const checkPop = interpolate(progress, [0.97, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: BH.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: inter,
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: BH.card,
          borderRadius: 16,
          border: `1px solid ${BH.line}`,
          boxShadow: `0 24px 70px ${hexA(BH.navy, 0.12)}`,
          padding: "48px 56px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* logo + completion badge */}
        <div style={{ position: "relative", width: 84, height: 84 }}>
          <div style={{ color: "#0A0A0A", display: "flex" }}>
            <Img
              src={staticFile("bluehost/hermesagent-logo.svg")}
              style={{ width: 84, height: 84, display: "block" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: -26,
              bottom: -8,
              width: 64,
              height: 64,
              transform: `scale(${checkPop})`,
              transformOrigin: "center",
            }}
          >
            <svg width={64} height={64} viewBox="0 0 64 64">
              <circle
                cx={32}
                cy={32}
                r={29}
                fill={BH.green}
                stroke={BH.card}
                strokeWidth={5}
              />
              <path
                d="M20 33l8.5 8.5L44 25"
                fill="none"
                stroke={BH.card}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: BH.navy,
            marginTop: 22,
          }}
        >
          Reimaging server
        </div>
        <div style={{ fontSize: 22, color: BH.textMuted, marginTop: 8 }}>
          Standard VPS - NVMe 4 · Ashburn, US
        </div>

        {/* progress bar */}
        <div
          style={{
            width: "100%",
            height: 14,
            borderRadius: 999,
            background: BH.line,
            marginTop: 36,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${p * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: done ? BH.green : BH.actionBlue,
            }}
          />
        </div>

        {/* steps */}
        <div
          style={{
            alignSelf: "stretch",
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {STEPS.map((s, i) => {
            const stepDone = p >= s.at;
            const isActive = i === activeIdx && !done;
            return (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 16 }}
              >
                <div style={{ width: 30, height: 30, flexShrink: 0 }}>
                  {stepDone ? (
                    <svg width={30} height={30} viewBox="0 0 30 30">
                      <circle cx={15} cy={15} r={14} fill={BH.green} />
                      <path
                        d="M9 15.5l4 4L21 11.5"
                        fill="none"
                        stroke={BH.card}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `2px solid ${BH.line}`,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isActive ? (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: BH.actionBlue,
                          }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: stepDone ? 600 : 500,
                    color: stepDone ? BH.navy : BH.textMuted,
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
