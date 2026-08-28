import React from "react";
import { BH, WORLD } from "./constants";

// Full-world Bluehost-blue backdrop. Bleeds well past the world bounds so the
// camera can never reveal an edge (no-black-frames rule: the comp root also
// paints brandBlue, this adds the lighting).
const PAD = 900;

export const BlueField: React.FC<{
  // world-space points that get a soft light lift (the camera destinations)
  glows?: { x: number; y: number; r: number; a: number }[];
}> = ({ glows = [] }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: -PAD,
        top: -PAD,
        width: WORLD.w + PAD * 2,
        height: WORLD.h + PAD * 2,
        backgroundColor: BH.brandBlue,
        backgroundImage: `
          radial-gradient(1600px 1200px at ${WORLD.portal.x + WORLD.portal.w / 2 + PAD}px ${WORLD.portal.y + WORLD.portal.h / 2 + PAD}px, rgba(255,255,255,0.10), rgba(255,255,255,0) 62%),
          radial-gradient(1500px 1150px at ${WORLD.server.cx + PAD}px ${WORLD.server.cy + PAD}px, rgba(255,255,255,0.09), rgba(255,255,255,0) 60%),
          radial-gradient(1200px 900px at ${WORLD.logo.cx + PAD}px ${WORLD.logo.cy + PAD}px, rgba(255,255,255,0.07), rgba(255,255,255,0) 58%),
          linear-gradient(180deg, ${BH.brandBlue} 0%, ${BH.brandBlueDeep} 140%)
        `,
      }}
    >
      {/* faint oversized grid-mark motif, barely-there brand texture */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.032 }}
      >
        <defs>
          <pattern
            id="bh-tiles"
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
        <rect width="100%" height="100%" fill="url(#bh-tiles)" />
      </svg>
      {glows.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: g.x + PAD - g.r,
            top: g.y + PAD - g.r,
            width: g.r * 2,
            height: g.r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,255,255,${g.a}) 0%, rgba(255,255,255,0) 65%)`,
          }}
        />
      ))}
    </div>
  );
};
