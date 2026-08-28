import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BH } from "./bluehost/constants";
import { BluehostWorld } from "./bluehost/BluehostWorld";
import { CAM_V, CLICKS, TOTAL_FRAMES, worldState } from "./bluehost/timeline";
import { camAt, clickZoomKick } from "./bluehost/choreo";

export const DURATION_IN_FRAMES = TOTAL_FRAMES;

// 1080x1920 — Bluehost × Hermes SaaS walkthrough (vertical)
export const BluehostHermesV: React.FC = () => {
  const frame = useCurrentFrame();
  const { fx, fy, z } = camAt(frame, CAM_V);
  const zoom = z * (1 + clickZoomKick(frame, CLICKS));
  const s = worldState(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: BH.brandBlue }}>
      <div
        style={{
          position: "absolute",
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${540 - fx}px, ${960 - fy}px) scale(${zoom})`,
        }}
      >
        <BluehostWorld s={s} />
      </div>
    </AbsoluteFill>
  );
};
