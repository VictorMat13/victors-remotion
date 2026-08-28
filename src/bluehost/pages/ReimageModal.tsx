import React from "react";
import { Img, staticFile } from "remotion";
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

export const MODAL_SIZE = { w: 640, h: 440 } as const;

// ---- dialog-local layout constants ----------------------------------------------
const M_PAD = 36;
const TITLE_Y = 26;
const DIVIDER_Y = 78;
const ROW_Y = 94;
const WARN_Y = 162;
const INPUT_Y = 266;
const INPUT_H = 66;
const INPUT_W = MODAL_SIZE.w - M_PAD * 2; // 568
const FOOTER_Y = 352;
const CANCEL_W = 150;
const PROCEED_W = 170;
const FOOTER_BTN_H = 56;
const FOOTER_GAP = 16;

// Centers in DIALOG-LOCAL coordinates (relative to dialog top-left).
export const MODAL_TARGETS = {
  input: { x: M_PAD + INPUT_W / 2, y: INPUT_Y + INPUT_H / 2 }, // (320, 299)
  proceed: {
    x: MODAL_SIZE.w - M_PAD - PROCEED_W / 2, // 519
    y: FOOTER_Y + FOOTER_BTN_H / 2, // 380
  },
} as const;

const FULL_WORD = "reimage";

export const ReimageModal: React.FC<{
  backdrop: number;
  pop: number;
  typed: number;
  caretOn: boolean;
  proceedEnabled: number;
  proceedPress: number;
}> = ({ backdrop, pop, typed, caretOn, proceedEnabled, proceedPress }) => {
  const chars = Math.max(0, Math.min(FULL_WORD.length, Math.round(typed)));
  const enabled = clamp01(proceedEnabled);
  const press = clamp01(proceedPress);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: inter }}>
      {/* backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hexA(BH.navy, 0.45),
          opacity: clamp01(backdrop),
        }}
      />

      {/* dialog */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: MODAL_SIZE.w,
            height: MODAL_SIZE.h,
            background: BH.card,
            borderRadius: 16,
            boxShadow: `0 30px 90px ${hexA(BH.navy, 0.35)}`,
            opacity: clamp01(pop),
            transform: `translateY(${26 * (1 - pop)}px) scale(${
              0.86 + 0.14 * pop
            })`,
            transformOrigin: "center",
            boxSizing: "border-box",
          }}
        >
          {/* title */}
          <div
            style={{
              position: "absolute",
              left: M_PAD,
              top: TITLE_Y,
              fontSize: 32,
              fontWeight: 700,
              color: BH.navy,
            }}
          >
            Reimage Server
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: DIVIDER_Y,
              height: 1,
              background: BH.line,
            }}
          />

          {/* image row */}
          <div
            style={{
              position: "absolute",
              left: M_PAD,
              top: ROW_Y,
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ color: "#0A0A0A", display: "flex", flexShrink: 0 }}>
              <Img
                src={staticFile("bluehost/hermesagent-logo.svg")}
                style={{ width: 52, height: 52, display: "block" }}
              />
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: BH.navy }}>
              Hermes Agent on Ubuntu
            </span>
          </div>

          {/* warning */}
          <div
            style={{
              position: "absolute",
              left: M_PAD,
              right: M_PAD,
              top: WARN_Y,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <svg
              width={26}
              height={26}
              viewBox="0 0 24 24"
              style={{ flexShrink: 0, marginTop: 3 }}
            >
              <path
                d="M12 3L22.5 21h-21z"
                fill={BH.warnRed}
                strokeLinejoin="round"
              />
              <rect x="11" y="9.5" width="2" height="6" rx="1" fill={BH.card} />
              <circle cx="12" cy="18" r="1.3" fill={BH.card} />
            </svg>
            <div style={{ fontSize: 22, lineHeight: 1.45, color: BH.navy }}>
              <span style={{ fontWeight: 700, color: BH.warnRed }}>
                Warning:{" "}
              </span>
              Changing the server image will permanently erase all data and
              settings on this VPS. This action cannot be undone.
            </div>
          </div>

          {/* input */}
          <div
            style={{
              position: "absolute",
              left: M_PAD,
              top: INPUT_Y,
              width: INPUT_W,
              height: INPUT_H,
              borderRadius: 8,
              border: `1.5px solid ${chars > 0 ? BH.actionBlue : BH.line}`,
              background: BH.card,
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              boxSizing: "border-box",
            }}
          >
            {chars === 0 ? (
              <span
                style={{
                  fontSize: 23,
                  fontStyle: "italic",
                  color: BH.textMuted,
                }}
              >
                Type "reimage" to proceed
              </span>
            ) : (
              <>
                <span style={{ fontSize: 24, color: BH.navy }}>
                  {FULL_WORD.slice(0, chars)}
                </span>
                <div
                  style={{
                    width: 2,
                    height: 30,
                    marginLeft: 3,
                    background: BH.navy,
                    opacity: caretOn ? 1 : 0,
                  }}
                />
              </>
            )}
          </div>

          {/* footer */}
          <div
            style={{
              position: "absolute",
              right: M_PAD,
              top: FOOTER_Y,
              display: "flex",
              gap: FOOTER_GAP,
            }}
          >
            <div
              style={{
                width: CANCEL_W,
                height: FOOTER_BTN_H,
                borderRadius: 8,
                border: `1.5px solid ${BH.actionBlue}`,
                color: BH.actionBlue,
                background: BH.card,
                fontSize: 22,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Cancel
            </div>
            <div
              style={{
                position: "relative",
                width: PROCEED_W,
                height: FOOTER_BTN_H,
                transform: `scale(${1 - 0.05 * press})`,
                transformOrigin: "center",
              }}
            >
              {/* disabled face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  background: BH.disabledBg,
                  color: BH.disabledText,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                PROCEED
              </div>
              {/* enabled face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  background: BH.actionBlue,
                  color: BH.card,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: enabled,
                }}
              >
                PROCEED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
