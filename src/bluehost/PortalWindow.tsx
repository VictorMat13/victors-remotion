import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { BH, PORTAL, WORLD } from "./constants";

const { fontFamily: inter } = loadInter();

// Window-local top-left of the content area (right of sidebar, below header).
export const CONTENT_ORIGIN = { x: PORTAL.sidebarW, y: PORTAL.headerH } as const;

const hexA = (hex: string, a: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ---- generic 22px line icons ---------------------------------------------------
const ICON_SHAPES: Record<string, React.ReactNode> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z" />
    </>
  ),
  sparkle: <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" />,
  store: (
    <>
      <path d="M4.5 9.5L6 5h12l1.5 4.5" />
      <path d="M5 9.5h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4l8 4.5-8 4.5-8-4.5z" />
      <path d="M4 13l8 4.5 8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4.5 7.5L12 13l7.5-5.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.6 2.3 2.6 14.7 0 17-2.6-2.3-2.6-14.7 0-17z" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="5" width="16" height="6" rx="1.5" />
      <rect x="4" y="13" width="16" height="6" rx="1.5" />
      <circle cx="7.5" cy="8" r="0.9" fill="currentColor" />
      <circle cx="7.5" cy="16" r="0.9" fill="currentColor" />
    </>
  ),
  shield: <path d="M12 4l7 2.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5z" />,
  heart: (
    <>
      <path d="M12 8.6c1-2.2 4.4-2.3 5.4-.2 1 2.1-1.2 4.6-5.4 7.4-4.2-2.8-6.4-5.3-5.4-7.4 1-2.1 4.4-2 5.4.2z" />
      <path d="M5 19.5h14" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10.5h17" />
    </>
  ),
  bag: (
    <>
      <path d="M6.5 8.5h11l-.8 10a1.6 1.6 0 0 1-1.6 1.5H8.9a1.6 1.6 0 0 1-1.6-1.5z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </>
  ),
};

const NavIcon: React.FC<{ name: string }> = ({ name }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {ICON_SHAPES[name]}
  </svg>
);

// ---- sidebar rows ---------------------------------------------------------------
type NavRow =
  | { kind: "item"; label: string; icon?: string; chip?: string; indent?: boolean }
  | { kind: "divider" }
  | { kind: "label"; label: string };

const NAV_ROWS: NavRow[] = [
  { kind: "item", label: "Dashboard", icon: "compass" },
  { kind: "divider" },
  { kind: "label", label: "BLUEHOST AI" },
  { kind: "item", label: "AI Sites", icon: "sparkle" },
  { kind: "item", label: "AI Store", icon: "store", chip: "NEW" },
  { kind: "item", label: "AI Agents", icon: "layers" },
  { kind: "item", label: "AI All Access Pack", indent: true },
  { kind: "divider" },
  { kind: "item", label: "Email", icon: "mail" },
  { kind: "item", label: "Domains", icon: "globe" },
  { kind: "item", label: "Hosting", icon: "server" },
  { kind: "item", label: "Security", icon: "shield" },
  { kind: "item", label: "Services", icon: "heart" },
  { kind: "item", label: "Billing", icon: "card" },
  { kind: "item", label: "Marketplace", icon: "bag" },
];

export const PortalWindow: React.FC<{
  activeNav?: string;
  children?: React.ReactNode;
}> = ({ activeNav = "Hosting", children }) => {
  return (
    <div
      style={{
        width: WORLD.portal.w,
        height: WORLD.portal.h,
        borderRadius: PORTAL.radius,
        background: BH.card,
        boxShadow: `0 48px 130px ${hexA(BH.navy, 0.3)}`,
        position: "relative",
        overflow: "hidden",
        fontFamily: inter,
        boxSizing: "border-box",
      }}
    >
      {/* ---- header ---- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: PORTAL.headerH,
          background: BH.card,
          borderBottom: `1px solid ${BH.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          boxSizing: "border-box",
        }}
      >
        <Img
          src={staticFile("bluehost/bluehost-logo-header.png")}
          style={{ width: 180, height: "auto", display: "block" }}
        />
        {/* search pill */}
        <div
          style={{
            marginLeft: 44,
            width: 580,
            height: 54,
            borderRadius: 999,
            border: `1.5px solid ${BH.line}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={BH.textMuted}
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5L20 20" />
          </svg>
          <span
            style={{
              fontSize: 22,
              color: BH.textMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            Ask blue e.g. How do I add a new website
          </span>
        </div>
        {/* right cluster */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div style={{ position: "relative", width: 28, height: 28 }}>
            <svg
              width={28}
              height={28}
              viewBox="0 0 24 24"
              fill="none"
              stroke={BH.textBody}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5z" />
              <path d="M10.2 18.5a2 2 0 0 0 3.6 0" />
            </svg>
            <div
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: BH.red,
                border: `2px solid ${BH.card}`,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: BH.actionBlue,
              color: BH.card,
              fontSize: 20,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            VM
          </div>
        </div>
      </div>

      {/* ---- sidebar ---- */}
      <div
        style={{
          position: "absolute",
          top: PORTAL.headerH,
          left: 0,
          width: PORTAL.sidebarW,
          bottom: 0,
          background: BH.card,
          borderRight: `1px solid ${BH.line}`,
          boxSizing: "border-box",
          paddingTop: 18,
        }}
      >
        {NAV_ROWS.map((row, i) => {
          if (row.kind === "divider") {
            return (
              <div
                key={i}
                style={{ height: 1, background: BH.line, margin: "10px 24px" }}
              />
            );
          }
          if (row.kind === "label") {
            return (
              <div
                key={i}
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: 1.6,
                  color: BH.textMuted,
                  padding: "12px 28px 6px",
                }}
              >
                {row.label}
              </div>
            );
          }
          const active = row.label === activeNav;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: row.indent ? "13px 14px 13px 24px" : "13px 20px 13px 28px",
                fontSize: row.indent ? 21 : 24,
                fontWeight: active ? 700 : 500,
                color: active ? BH.actionBlue : BH.textBody,
                background: active ? BH.sidebarActive : "transparent",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                borderLeft: row.indent ? `2px solid ${BH.line}` : "none",
                marginLeft: row.indent ? 38 : 0,
              }}
            >
              {active ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 7,
                    bottom: 7,
                    width: 4,
                    borderRadius: "0 4px 4px 0",
                    background: BH.actionBlue,
                  }}
                />
              ) : null}
              {row.icon ? <NavIcon name={row.icon} /> : null}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {row.label}
              </span>
              {row.chip ? (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    color: BH.navy,
                    background: BH.termYellow,
                    borderRadius: 5,
                    padding: "3px 8px",
                    flexShrink: 0,
                  }}
                >
                  {row.chip}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ---- content area ---- */}
      <div
        style={{
          position: "absolute",
          top: PORTAL.headerH,
          left: PORTAL.sidebarW,
          right: 0,
          bottom: 0,
          background: BH.pageBg,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};
