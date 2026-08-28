import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BH } from "./bluehost/constants";
import { BluehostWorld } from "./bluehost/BluehostWorld";
import { CAM_H, CLICKS, TOTAL_FRAMES, worldState } from "./bluehost/timeline";
import { camAt, clickZoomKick } from "./bluehost/choreo";

export const DURATION_IN_FRAMES = TOTAL_FRAMES;

// 1920x1080 — Bluehost × Hermes SaaS walkthrough (horizontal)
export const BluehostHermesH: React.FC = () => {
  const frame = useCurrentFrame();
  const { fx, fy, z } = camAt(frame, CAM_H);
  const zoom = z * (1 + clickZoomKick(frame, CLICKS));
  const s = worldState(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: BH.brandBlue }}>
      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${960 - fx}px, ${540 - fy}px) scale(${zoom})`,
        }}
      >
        <BluehostWorld s={s} />
      </div>
    </AbsoluteFill>
  );
};
