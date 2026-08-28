import React from "react";
import { Img, staticFile } from "remotion";

// The Bluehost 3x3 grid mark — exact brand geometry, rebuilt as vector so the
// camera can open tight on it without pixelation. `assemble` 0..1 staggers the
// nine tiles in; `wordmark` 0..1 reveals the raster lockup (real white logo
// pulled from Bluehost's own ad) sliding out to the right of the mark.
export const BluehostMark: React.FC<{
  assemble: number;
  wordmark?: number;
  size?: number; // edge length of the grid mark
  color?: string;
}> = ({ assemble, wordmark = 0, size = 180, color = "#FFFFFF" }) => {
  const tile = size * 0.29;
  const gap = size * 0.065;
  const order = [4, 0, 8, 2, 6, 1, 7, 3, 5]; // center first, corners, edges
  // wordmark png is 460x110; the grid mark inside it is ~the first 110px.
  // We show only the "bluehost" text portion, scaled to match our mark size.
  const wmH = size * 1.02;
  const wmW = wmH * (460 / 110);
  const wmReveal = Math.max(0, Math.min(1, wordmark));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {Array.from({ length: 9 }, (_, i) => {
        const slot = order.indexOf(i);
        const local = Math.max(
          0,
          Math.min(1, assemble * 9.5 - slot * 0.82),
        );
        // soft overshoot pop
        const s =
          local <= 0
            ? 0
            : local >= 1
              ? 1
              : 1.12 - 0.12 * Math.cos(local * Math.PI) - 0.12 * (1 - local) * 2 +
                local * 0.12;
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: col * (tile + gap),
              top: row * (tile + gap),
              width: tile,
              height: tile,
              borderRadius: size * 0.02,
              backgroundColor: color,
              opacity: Math.min(1, local * 1.6),
              transform: `scale(${Math.max(0, Math.min(1.06, s))})`,
            }}
          />
        );
      })}
      {wmReveal > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: size * 1.28,
            top: size / 2 - wmH / 2,
            width: wmW * 0.78, // trim the grid-mark portion of the png lockup
            height: wmH,
            overflow: "hidden",
            opacity: wmReveal,
          }}
        >
          <Img
            src={staticFile("bluehost/bluehost-logo-white.png")}
            style={{
              position: "absolute",
              // shift left so the png's own grid mark is cropped out
              left: -wmW * 0.22 + (1 - wmReveal) * 26,
              top: 0,
              height: wmH,
              width: wmW,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
