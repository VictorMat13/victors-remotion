import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { BH, PORTAL, WORLD } from "../constants";

const { fontFamily: inter } = loadInter();

const hexA = (hex: string, a: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---- content-area-local layout constants ---------------------------------------
const PAD = PORTAL.contentPad; // 44
const CONTENT_W = WORLD.portal.w - PORTAL.sidebarW; // 1300
const INNER_W = CONTENT_W - PAD * 2; // 1212

const CRUMB_Y = PAD; // 44
const H1_Y = 90;
const TABS_Y = 168;
const TAB_H = 46;
const SERVER_Y = 246;
const SERVER_H = 180;
const SERVER_PAD = 36;
const STATS_Y = 458;
const STATS_H = 200;
const STATS_GAP = 28;
const ACTIONS_Y = 690;
const ACTIONS_H = 84;
const ACTIONS_GAP = 28;

const BTN_W = 178;
const BTN_H = 58;
const BTN_GAP = 16;

// CENTER of the Reimage button in content-area-local coordinates.
export const OVERVIEW_TARGETS = {
  reimage: {
    x: PAD + INNER_W - SERVER_PAD - BTN_W - BTN_GAP - BTN_W / 2, // 937
    y: SERVER_Y + SERVER_H / 2, // 336
  },
} as const;

const Glyph: React.FC<{ shape: React.ReactNode; size?: number }> = ({
  shape,
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {shape}
  </svg>
);

const cardBase: React.CSSProperties = {
  background: BH.card,
  borderRadius: 14,
  border: `1px solid ${BH.line}`,
  boxSizing: "border-box",
};

export const OverviewPage: React.FC<{
  reimageHover?: number;
  reimagePress?: number;
}> = ({ reimageHover = 0, reimagePress = 0 }) => {
  const hover = clamp01(reimageHover);
  const press = clamp01(reimagePress);
  const statW = (INNER_W - STATS_GAP * 2) / 3;
  const actW = (INNER_W - ACTIONS_GAP * 3) / 4;

  // 2% progress ring
  const ringR = 40;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: inter }}>
      {/* breadcrumbs */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: CRUMB_Y,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 20,
          color: BH.textMuted,
        }}
      >
        <span>Hosting</span>
        <Glyph size={16} shape={<path d="M9 5l7 7-7 7" />} />
        <span>Overview</span>
      </div>

      {/* H1 */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: H1_Y,
          fontSize: 42,
          fontWeight: 700,
          color: BH.navy,
        }}
      >
        Standard VPS - NVMe 4
      </div>

      {/* tabs */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: TABS_Y,
          height: TAB_H,
          display: "flex",
          gap: 44,
          fontSize: 24,
        }}
      >
        <div
          style={{
            color: BH.actionBlue,
            fontWeight: 600,
            borderBottom: `3px solid ${BH.actionBlue}`,
            paddingBottom: 12,
            boxSizing: "border-box",
          }}
        >
          Overview
        </div>
        <div style={{ color: BH.textMuted, fontWeight: 500, paddingBottom: 12 }}>
          License
        </div>
      </div>

      {/* server image card */}
      <div
        style={{
          ...cardBase,
          position: "absolute",
          left: PAD,
          top: SERVER_Y,
          width: INNER_W,
          height: SERVER_H,
          padding: SERVER_PAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: BH.navy,
              marginBottom: 20,
            }}
          >
            Server Image
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Img
              src={staticFile("bluehost/open-claw.svg")}
              style={{ width: 60, height: 60, display: "block" }}
            />
            <span style={{ fontSize: 30, fontWeight: 700, color: BH.navy }}>
              OpenClaw
            </span>
            <span style={{ fontSize: 26, color: BH.textMuted }}>
              on Ubuntu 24.04
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: BTN_GAP }}>
          {/* Reimage — outline */}
          <div
            style={{
              width: BTN_W,
              height: BTN_H,
              borderRadius: 8,
              background: hexA(BH.actionBlue, 0.08 * hover),
              border: `${1.5 + hover}px solid ${BH.actionBlue}`,
              color: BH.actionBlue,
              fontSize: 24,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              transform: `scale(${1 - 0.05 * press})`,
              transformOrigin: "center",
            }}
          >
            Reimage
          </div>
          {/* Manage — solid */}
          <div
            style={{
              width: BTN_W,
              height: BTN_H,
              borderRadius: 8,
              background: BH.actionBlue,
              color: BH.card,
              fontSize: 24,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Manage
          </div>
        </div>
      </div>

      {/* stats row */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: STATS_Y,
          width: INNER_W,
          height: STATS_H,
          display: "flex",
          gap: STATS_GAP,
        }}
      >
        {/* disk storage */}
        <div
          style={{
            ...cardBase,
            width: statW,
            height: STATS_H,
            padding: 32,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 600, color: BH.navy }}>
              Disk Storage
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: BH.navy }}>
                2.47
              </span>
              <span style={{ fontSize: 22, color: BH.textMuted }}>
                {" "}
                of 100GB used
              </span>
            </div>
          </div>
          <div
            style={{
              position: "relative",
              width: 96,
              height: 96,
              alignSelf: "center",
              flexShrink: 0,
            }}
          >
            <svg width={96} height={96} viewBox="0 0 96 96">
              <circle
                cx={48}
                cy={48}
                r={ringR}
                fill="none"
                stroke={BH.line}
                strokeWidth={9}
              />
              <circle
                cx={48}
                cy={48}
                r={ringR}
                fill="none"
                stroke={BH.actionBlue}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={`${ringC * 0.02} ${ringC}`}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: BH.navy,
              }}
            >
              2%
            </div>
          </div>
        </div>

        {/* server status */}
        <div
          style={{
            ...cardBase,
            width: statW,
            height: STATS_H,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: BH.navy }}>
            Server Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: BH.green,
              }}
            />
            <span style={{ fontSize: 28, fontWeight: 600, color: BH.green }}>
              Online
            </span>
          </div>
        </div>

        {/* ip address */}
        <div
          style={{
            ...cardBase,
            width: statW,
            height: STATS_H,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, color: BH.navy }}>
            IP Address
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26, color: BH.navy }}>129.121.113.125</span>
            <span style={{ color: BH.textMuted, display: "flex" }}>
              <Glyph
                size={20}
                shape={
                  <>
                    <rect x="9" y="9" width="10" height="10" rx="2" />
                    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                  </>
                }
              />
            </span>
          </div>
        </div>
      </div>

      {/* action buttons row */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: ACTIONS_Y,
          width: INNER_W,
          height: ACTIONS_H,
          display: "flex",
          gap: ACTIONS_GAP,
        }}
      >
        {[
          {
            label: "Start Server",
            disabled: true,
            shape: <path d="M8 5.5v13l11-6.5z" />,
          },
          {
            label: "Reboot Server",
            disabled: false,
            shape: (
              <>
                <path d="M5.5 12a6.5 6.5 0 1 0 2-4.7" />
                <path d="M7.5 3.5v4h4" />
              </>
            ),
          },
          {
            label: "Power Off Server",
            disabled: false,
            shape: (
              <>
                <path d="M12 4v7" />
                <path d="M7.5 6.5a7 7 0 1 0 9 0" />
              </>
            ),
          },
          {
            label: "Launch Console",
            disabled: false,
            shape: (
              <>
                <rect x="3.5" y="5" width="17" height="12" rx="1.5" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </>
            ),
          },
        ].map((b) => (
          <div
            key={b.label}
            style={{
              width: actW,
              height: ACTIONS_H,
              borderRadius: 10,
              background: BH.card,
              border: `1.5px solid ${b.disabled ? BH.line : BH.actionBlue}`,
              color: b.disabled ? BH.disabledText : BH.actionBlue,
              fontSize: 24,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxSizing: "border-box",
              whiteSpace: "nowrap",
            }}
          >
            <Glyph shape={b.shape} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};
