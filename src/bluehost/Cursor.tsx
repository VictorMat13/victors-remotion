import React from "react";
import { BH } from "./constants";

// macOS-style cursor drawn in world coordinates. Position/press/ripple are
// driven entirely by the parent choreography — this file renders only.
export const Cursor: React.FC<{
  x: number;
  y: number;
  // 0..1 press amount (scales the cursor down slightly while the button is held)
  press?: number;
  // 0..1 ripple progress; 0/1 = hidden
  ripple?: number;
  scale?: number;
  opacity?: number;
}> = ({ x, y, press = 0, ripple = 0, scale = 1, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const s = scale * (1 - press * 0.14);
  const rippleVisible = ripple > 0.001 && ripple < 0.999;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      {rippleVisible ? (
        <div
          style={{
            position: "absolute",
            left: -46 * ripple,
            top: -46 * ripple,
            width: 92 * ripple,
            height: 92 * ripple,
            borderRadius: "50%",
            border: `${Math.max(1.5, 5 * (1 - ripple))}px solid ${BH.actionBlue}`,
            opacity: 0.75 * (1 - ripple),
          }}
        />
      ) : null}
      <svg
        width={34 * s}
        height={46 * s}
        viewBox="0 0 34 46"
        style={{
          position: "absolute",
          left: -3 * s,
          top: -2 * s,
          filter: "drop-shadow(0 3px 7px rgba(4,29,51,0.38))",
        }}
      >
        <path
          d="M4 2 L4 34 L12.2 26.6 L17.4 38.4 L23.6 35.6 L18.4 24.2 L29 23.4 Z"
          fill="#FFFFFF"
          stroke={BH.navy}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
