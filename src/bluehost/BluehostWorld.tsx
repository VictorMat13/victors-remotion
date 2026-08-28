import React from "react";
import { WORLD } from "./constants";
import { BlueField } from "./BlueField";
import { BluehostMark } from "./BluehostMark";
import { Cursor } from "./Cursor";
import { PortalWindow } from "./PortalWindow";
import { OverviewPage } from "./pages/OverviewPage";
import { ReimagePage } from "./pages/ReimagePage";
import { ReimageModal } from "./pages/ReimageModal";
import { InstallProgress } from "./pages/InstallProgress";
import { TerminalPanel } from "./TerminalPanel";
import { PayoffScene } from "./PayoffScene";
import { WorldState } from "./timeline";

// The entire scene in world coordinates. Cameras (per-aspect) live in the
// comps; this renders identically for both.
export const BluehostWorld: React.FC<{ s: WorldState }> = ({ s }) => {
  const P = WORLD.portal;
  return (
    <>
      <BlueField />

      {/* intro logo — floats above the portal, fades once we land on it */}
      {s.introOpacity > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: WORLD.logo.cx - 110,
            top: WORLD.logo.cy - 110,
            opacity: s.introOpacity,
          }}
        >
          <BluehostMark
            assemble={s.markAssemble}
            wordmark={s.wordmark}
            size={220}
          />
        </div>
      ) : null}

      {/* portal window — arrives as the camera travels down from the logo */}
      <div
        style={{
          position: "absolute",
          left: P.x,
          top: P.y,
          opacity: s.portalIn,
          transform: `translateY(${(1 - s.portalIn) * 46}px)`,
        }}
      >
        <PortalWindow activeNav="Hosting">
          {s.showOverview && s.pageSwitch < 0.48 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: Math.max(0, 1 - s.pageSwitch * 2.2),
                transform: `translateX(${-60 * s.pageSwitch}px)`,
              }}
            >
              <OverviewPage
                reimageHover={s.reimageHover}
                reimagePress={s.reimagePress}
              />
            </div>
          ) : null}
          {s.showReimage && !s.showInstall ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: Math.min(1, Math.max(0, (s.pageSwitch - 0.42) * 2.2)),
                transform: `translateX(${80 * (1 - s.pageSwitch)}px)`,
              }}
            >
              <ReimagePage
                tabSwitch={s.tabSwitch}
                scrollY={s.scrollY}
                lifts={s.lifts}
                selectPress={s.selectPress}
              />
            </div>
          ) : null}
          {s.showInstall ? <InstallProgress progress={s.installProgress} /> : null}
          {s.modalMounted ? (
            <ReimageModal
              backdrop={s.backdrop}
              pop={s.pop}
              typed={s.typed}
              caretOn={s.caretOn}
              proceedEnabled={s.proceedEnabled}
              proceedPress={s.proceedPress}
            />
          ) : null}
        </PortalWindow>
      </div>

      {/* terminal — collapses into the server card during the payoff morph */}
      {s.termMounted && s.morphFade > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: WORLD.term.x,
            top: WORLD.term.y,
            width: WORLD.term.w,
            height: WORLD.term.h,
            transform: `scale(${s.morphScale})`,
            transformOrigin: "center center",
            opacity: s.morphFade,
          }}
        >
          <TerminalPanel t={s.termT} />
        </div>
      ) : null}

      {/* payoff */}
      {s.payoffMounted ? (
        <div
          style={{
            position: "absolute",
            left: WORLD.server.cx,
            top: WORLD.server.cy,
          }}
        >
          <PayoffScene reveal={s.reveal} t={s.payoffT} />
        </div>
      ) : null}

      {/* cursor — world space, above everything */}
      <Cursor
        x={s.cursor.x}
        y={s.cursor.y}
        press={s.press}
        ripple={s.ripple}
        opacity={s.cursorOpacity}
        scale={1.15}
      />
    </>
  );
};
