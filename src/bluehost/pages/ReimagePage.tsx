import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { BH, CATALOG, CAT_CARD, HERMES_INDEX, PORTAL, WORLD } from "../constants";

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
const TAB_H = 48;
const TAB1_W = 128; // "Plain OS"
const TAB2_W = 172; // "Applications"
const TAB_GAP = 40;
const LIST_TOP = 244;

const CARD_PAD = 32;
const SELECT_W = 150;
const SELECT_H = 56;

// All in CONTENT-AREA-LOCAL coordinates (selectCenter is card-local).
export const REIMAGE_LAYOUT = {
  appsTab: {
    x: PAD + TAB1_W + TAB_GAP + TAB2_W / 2, // 298
    y: TABS_Y + (TAB_H - 3) / 2, // 190.5
  },
  listTop: LIST_TOP, // 244
  cardStride: CAT_CARD.h + CAT_CARD.gap, // 206
  selectCenter: {
    x: INNER_W - CARD_PAD - SELECT_W / 2, // 1105
    y: CAT_CARD.h / 2, // 90
  },
} as const;

// currentColor SVGs need a near-black wrapper (like the real card icons)
const needsInk = (logo: string) =>
  logo.includes("hermesagent") || logo.includes("openwebui");

const OS_LIST = [
  {
    name: "Alma",
    logo: "bluehost/os/alma.png",
    desc: "AlmaLinux is a stable, enterprise-grade Linux distribution built for production servers.",
  },
  {
    name: "CentOS",
    logo: "bluehost/os/centos.png",
    desc: "CentOS is a robust, enterprise-class Linux distribution for dependable server environments.",
  },
  {
    name: "Fedora",
    logo: "bluehost/os/fedora.png",
    desc: "Fedora is a modern Linux operating system with the latest open-source innovations.",
  },
  {
    name: "Rocky",
    logo: "bluehost/os/rocky.png",
    desc: "Rocky Linux is a secure, enterprise-grade Linux distribution built for stability.",
  },
];

const CatalogCard: React.FC<{
  name: string;
  desc: string;
  logo: string;
  logoSize: number;
  current?: boolean;
  lift?: number;
  selectPress?: number;
}> = ({ name, desc, logo, logoSize, current, lift = 0, selectPress = 0 }) => {
  const li = clamp01(lift);
  const press = clamp01(selectPress);
  const logoImg = (
    <Img
      src={staticFile(logo)}
      style={{ width: logoSize, height: logoSize, display: "block" }}
    />
  );
  return (
    <div
      style={{
        width: INNER_W,
        height: CAT_CARD.h,
        marginBottom: CAT_CARD.gap,
        background: BH.card,
        borderRadius: 14,
        border: `1px solid ${BH.line}`,
        boxShadow: `0 0 0 1.5px ${hexA(BH.actionBlue, 0.6 * li)}, 0 14px 34px ${hexA(
          BH.actionBlue,
          0.16 * li,
        )}`,
        transform: `scale(${1 + 0.02 * li})`,
        transformOrigin: "center",
        padding: CARD_PAD,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      {needsInk(logo) ? (
        <div style={{ color: "#0A0A0A", flexShrink: 0, display: "flex" }}>
          {logoImg}
        </div>
      ) : (
        <div style={{ flexShrink: 0, display: "flex" }}>{logoImg}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: BH.navy,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </span>
          {current ? (
            <span
              style={{
                fontSize: 18,
                color: BH.textMuted,
                border: `1px solid ${BH.line}`,
                borderRadius: 999,
                padding: "4px 14px",
                flexShrink: 0,
              }}
            >
              Current
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 21,
            color: BH.textMuted,
            marginTop: 8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {desc}
        </div>
        <div
          style={{
            fontSize: 21,
            fontWeight: 600,
            color: BH.actionBlue,
            marginTop: 8,
          }}
        >
          Learn More
        </div>
      </div>
      <div
        style={{
          width: SELECT_W,
          height: SELECT_H,
          borderRadius: 8,
          background: BH.actionBlue,
          color: BH.card,
          fontSize: 22,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxSizing: "border-box",
          transform: `scale(${1 - 0.05 * press})`,
          transformOrigin: "center",
        }}
      >
        Select
      </div>
    </div>
  );
};

const TabLabel: React.FC<{ w: number; text: string; active: number }> = ({
  w,
  text,
  active,
}) => (
  <div style={{ position: "relative", width: w, height: TAB_H - 3 }}>
    <span
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 500,
        color: BH.textMuted,
        opacity: 1 - active,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
    <span
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 600,
        color: BH.navy,
        opacity: active,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </div>
);

export const ReimagePage: React.FC<{
  tabSwitch: number;
  scrollY: number;
  lifts: number[];
  selectPress?: number;
}> = ({ tabSwitch, scrollY, lifts, selectPress = 0 }) => {
  const ts = clamp01(tabSwitch);
  const underlineX = interpolate(ts, [0, 1], [PAD, PAD + TAB1_W + TAB_GAP], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const underlineW = interpolate(ts, [0, 1], [TAB1_W, TAB2_W], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
        <span>Reimage Server</span>
      </div>

      {/* back chevron + H1 */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: H1_Y,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <svg
          width={30}
          height={30}
          viewBox="0 0 24 24"
          fill="none"
          stroke={BH.actionBlue}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <span style={{ fontSize: 42, fontWeight: 700, color: BH.navy }}>
          Reimage Server
        </span>
      </div>

      {/* tabs */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: TABS_Y,
          display: "flex",
          gap: TAB_GAP,
        }}
      >
        <TabLabel w={TAB1_W} text="Plain OS" active={1 - ts} />
        <TabLabel w={TAB2_W} text="Applications" active={ts} />
      </div>
      <div
        style={{
          position: "absolute",
          top: TABS_Y + TAB_H - 3,
          left: underlineX,
          width: underlineW,
          height: 3,
          borderRadius: 2,
          background: BH.actionBlue,
        }}
      />

      {/* list viewport */}
      <div
        style={{
          position: "absolute",
          top: LIST_TOP,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {/* Plain OS list — exits fast so the lists never double-expose */}
        {ts < 0.46 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: PAD,
              opacity: clamp01(1 - ts * 2.2),
              transform: `translateX(${-70 * ts}px)`,
            }}
          >
            {OS_LIST.map((os) => (
              <CatalogCard
                key={os.name}
                name={os.name}
                desc={os.desc}
                logo={os.logo}
                logoSize={56}
              />
            ))}
          </div>
        ) : null}

        {/* Applications list — enters after the OS list has cleared */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: PAD,
            opacity: clamp01((ts - 0.42) * 2.2),
            transform: `translate(${90 * (1 - ts)}px, ${-scrollY}px)`,
          }}
        >
          {CATALOG.map((app, i) => (
            <CatalogCard
              key={app.name}
              name={app.name}
              desc={app.desc}
              logo={app.logo}
              logoSize={CAT_CARD.logoSize}
              current={app.current}
              lift={lifts[i] ?? 0}
              selectPress={i === HERMES_INDEX ? selectPress : 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
