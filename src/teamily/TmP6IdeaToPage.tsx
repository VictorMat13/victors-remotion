import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AG,
  AgentAvatar,
  AgentMsg,
  ChatHeader,
  ChatWallpaper,
  Cursor,
  DeliveryCard,
  EASE,
  FONT,
  MeMsg,
  PaperWorld,
  R,
  SPRINGS,
  SystemLine,
  T,
  Typing,
  tabular,
  useCam,
  useTypewriter,
} from "./kit";

// ============================================================================
// TmP6IdeaToPage — 1080x1920
// VO: "Drop in a product idea and they hand you back the research, the copy,
//      and a live web page you can actually open, right there in the chat."
//
// One continuous world: a tall Teamily thread on the real doodle wallpaper.
// The camera travels down it as each deliverable lands, then the web-page
// artifact expands into a live rendered landing page, still inside the chat.
// ============================================================================

export const DURATION_IN_FRAMES = 340;

/* ------------------------------------------------------------------ world -- */

// Content column (world coords). Frame is 1080 wide; max zoom 1.32 keeps
// 180..900 inside the 5% side-safe band (54..1026 on screen).
const CX = 180;
const CW = 720;

const BUB_X = CX + 62; // AgentMsg indents its bubble by 62
const BUB_W = CW - 62;
const BUB_PAD = 18;
const CARD_X = BUB_X + BUB_PAD; // 260
const CARD_W = BUB_W - BUB_PAD * 2; // 622

const HEADER_Y = 200;
const HEADER_H = 116;
const WALL_TOP = HEADER_Y + HEADER_H; // 316

const SYS_Y = 352;
const ME_Y = 448;
const TYPE_Y = 700;
const TYPE_PITCH = 168;

// Card chrome inside DeliveryCard: header row 70 + meta row 79.
const CARD_CHROME = 149;

const B1_NAME_Y = 1240;
const B1_TEXT_H = 76; // two 38px lines
const B1_BODY_H = 376;
const B1_CARD_Y = B1_NAME_Y + 60 + BUB_PAD + B1_TEXT_H + 14; // 1408

const B2_NAME_Y = 2080;
const B2_TEXT_H = 38;
const B2_BODY_H = 280;
const B2_CARD_Y = B2_NAME_Y + 60 + BUB_PAD + B2_TEXT_H + 14; // 2210

const B3_NAME_Y = 2830;
const B3_TEXT_H = 38;
const B3_BODY_MIN = 330;
const B3_BODY_MAX = 900;
const B3_CARD_Y = B3_NAME_Y + 60 + BUB_PAD + B3_TEXT_H + 14; // 2960

// Rendered landing page — authored at this design size, scaled into the card.
const PAGE_W = 560;
const PAGE_H = 1014;
const PAGE_SCALE = CARD_W / PAGE_W;

/* ----------------------------------------------------------------- camera -- */

const KEY_T = [0, 45, 66, 118, 138, 188, 208, 252, 266, 274, 296, 339];
const KEY_FX = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const KEY_FY = [
  776, 776, 1595, 1595, 2380, 2380, 3160, 3160, 3200, 3200, 3448, 3448,
];
const KEY_Z = [
  1.32, 1.32, 1.3, 1.3, 1.3, 1.3, 1.24, 1.24, 1.32, 1.32, 1.16, 1.16,
];

const clampOpt = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easedOpt = { easing: EASE, ...clampOpt };

/* ------------------------------------------------------------------ atoms -- */

const Paw: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <ellipse cx="12" cy="16.2" rx="6.2" ry="5" fill={color} />
    <circle cx="5.6" cy="9.8" r="2.5" fill={color} />
    <circle cx="10" cy="6.7" r="2.6" fill={color} />
    <circle cx="14.6" cy="6.7" r="2.6" fill={color} />
    <circle cx="18.6" cy="10" r="2.4" fill={color} />
  </svg>
);

const Bone: React.FC<{ w: number; color: string }> = ({ w, color }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 64 32">
    <rect x="12" y="10" width="40" height="12" rx="6" fill={color} />
    <circle cx="12" cy="10" r="8" fill={color} />
    <circle cx="12" cy="22" r="8" fill={color} />
    <circle cx="52" cy="10" r="8" fill={color} />
    <circle cx="52" cy="22" r="8" fill={color} />
  </svg>
);

/** Tiled doodle wallpaper — the real chat-bg asset, repeated down the world. */
const Wallpaper: React.FC = () => {
  const tw = 1600;
  const th = 840;
  const cols = 3;
  const rows = 7;
  const x0 = -1520;
  const y0 = WALL_TOP;
  const tiles: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <ChatWallpaper
          key={`${r}-${c}`}
          x={x0 + c * tw}
          y={y0 + r * th}
          w={tw + 1}
          h={th + 1}
        />,
      );
    }
  }
  return <>{tiles}</>;
};

/** One "X is typing" row: avatar + bold name, dots bubble beneath. */
const TypingRow: React.FC<{
  y: number;
  agent: { name: string; file: string };
  enter: number;
}> = ({ y, agent, enter }) => (
  <div
    style={{
      position: "absolute",
      left: CX,
      top: y,
      width: CW,
      opacity: enter,
      transform: `translateY(${(1 - enter) * 16}px)`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, height: 48 }}>
      <AgentAvatar agent={agent} size={48} />
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: T.ink }}>
        {agent.name}
      </div>
    </div>
    <Typing x={62} y={62} />
  </div>
);

const FindingRow: React.FC<{
  label: string;
  value: string;
  enter: number;
}> = ({ label, value, enter }) => (
  <div
    style={{
      height: 52,
      display: "flex",
      alignItems: "center",
      gap: 14,
      opacity: enter,
      transform: `translateX(${(1 - enter) * -14}px)`,
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: R.full,
        background: T.green,
        flexShrink: 0,
      }}
    />
    <span style={{ fontFamily: FONT, fontSize: 23, color: T.ink2 }}>{label}</span>
    <span
      style={{
        marginLeft: "auto",
        fontFamily: FONT,
        fontSize: 23,
        fontWeight: 800,
        color: T.greenText,
        ...tabular,
      }}
    >
      {value}
    </span>
  </div>
);

/* ------------------------------------------------------- the rendered page -- */

const PAGE_LINKS = ["Ingredients", "Pricing"];

const PRODUCT_TILES = [
  { name: "Allergy-safe treats", desc: "Filtered against their vet list." },
  { name: "One dental chew", desc: "Sized to their jaw, not a guess." },
  { name: "Right-size portions", desc: "Scaled to weight every month." },
];

const PRICE_TILES = [
  { size: "Small", price: "$24", a: "6 treats + 1 chew", b: "Free shipping" },
  { size: "Medium", price: "$29", a: "9 treats + 2 chews", b: "Free shipping" },
  { size: "Large", price: "$34", a: "12 treats + 2 chews", b: "Free shipping" },
];

const LandingPage: React.FC = () => (
  <div
    style={{
      position: "relative",
      width: PAGE_W,
      height: PAGE_H,
      background: T.card,
      fontFamily: FONT,
    }}
  >
    {/* hero wash */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 60,
        width: PAGE_W,
        height: 396,
        background: "linear-gradient(180deg,#F1FBF4 0%,#FFFFFF 100%)",
      }}
    />

    {/* ------------------------------------------------------------- nav -- */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PAGE_W,
        height: 60,
        background: T.card,
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: T.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paw size={15} color="#FFFFFF" />
      </div>
      <div
        style={{
          marginLeft: 10,
          fontSize: 18,
          fontWeight: 800,
          color: T.ink,
          letterSpacing: -0.3,
        }}
      >
        Snoutbox
      </div>
      <div
        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}
      >
        {PAGE_LINKS.map((l) => (
          <span key={l} style={{ fontSize: 13, color: T.slate }}>
            {l}
          </span>
        ))}
        <span
          style={{
            padding: "7px 15px",
            borderRadius: R.full,
            background: T.green,
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Start a box
        </span>
      </div>
    </div>

    {/* ------------------------------------------------------------ hero -- */}
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 86,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 2,
        color: T.greenText,
      }}
    >
      MONTHLY TREAT BOX
    </div>
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 106,
        width: 496,
        fontSize: 44,
        lineHeight: "48px",
        fontWeight: 800,
        color: T.ink,
        letterSpacing: -1,
      }}
    >
      Treats your dog
      <br />
      can actually eat.
    </div>
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 216,
        width: 470,
        fontSize: 16,
        lineHeight: "24px",
        color: T.slate,
      }}
    >
      Every box is filtered for their size, their allergies,
      <br />
      and nothing else.
    </div>
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 288,
        display: "flex",
        alignItems: "center",
        gap: 22,
      }}
    >
      <span
        style={{
          padding: "12px 24px",
          borderRadius: R.full,
          background: T.green,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        Build your box
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.greenText }}>
        See what&#8217;s inside &#8594;
      </span>
    </div>
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 348,
        width: 496,
        height: 86,
        borderRadius: 16,
        background: "linear-gradient(135deg,#EBFBF3 0%,#D2F7E4 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        overflow: "hidden",
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ transform: `rotate(${i % 2 ? 14 : -12}deg)` }}>
          <Bone w={58} color={i === 2 ? T.brand300 : "#FFFFFF"} />
        </div>
      ))}
    </div>

    {/* --------------------------------------------------------- product -- */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 456,
        width: PAGE_W,
        height: 264,
        background: T.bgSurface,
        borderTop: `1px solid ${T.line}`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 486,
        fontSize: 22,
        fontWeight: 800,
        color: T.ink,
        letterSpacing: -0.4,
      }}
    >
      What shows up each month
    </div>
    {PRODUCT_TILES.map((t, i) => (
      <div
        key={t.name}
        style={{
          position: "absolute",
          left: 32 + i * 172,
          top: 528,
          width: 152,
          height: 150,
          borderRadius: 14,
          background: T.card,
          border: `1px solid ${T.line}`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.greenTint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {i === 1 ? (
            <Bone w={26} color={T.brand400} />
          ) : (
            <Paw size={24} color={T.brand400} />
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 72,
            width: 124,
            fontSize: 14,
            fontWeight: 800,
            color: T.ink,
          }}
        >
          {t.name}
        </div>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 98,
            width: 124,
            fontSize: 11.5,
            lineHeight: "17px",
            color: T.muted,
          }}
        >
          {t.desc}
        </div>
      </div>
    ))}

    {/* --------------------------------------------------------- pricing -- */}
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 748,
        fontSize: 22,
        fontWeight: 800,
        color: T.ink,
        letterSpacing: -0.4,
      }}
    >
      Pick your dog&#8217;s size
    </div>
    {PRICE_TILES.map((p, i) => {
      const hot = i === 1;
      return (
        <div
          key={p.size}
          style={{
            position: "absolute",
            left: 32 + i * 172,
            top: 786,
            width: 152,
            height: 160,
            borderRadius: 14,
            background: hot ? T.greenTint : T.card,
            border: `${hot ? 2 : 1}px solid ${hot ? T.brand400 : T.line}`,
            boxSizing: "border-box",
          }}
        >
          {hot ? (
            <div
              style={{
                position: "absolute",
                right: 9,
                top: 9,
                padding: "3px 9px",
                borderRadius: R.full,
                background: T.brand400,
                color: "#FFFFFF",
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: 0.3,
              }}
            >
              MOST PICKED
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 34,
              fontSize: 13,
              fontWeight: 700,
              color: T.slate,
            }}
          >
            {p.size}
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 54,
              display: "flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            <span
              style={{ fontSize: 26, fontWeight: 800, color: T.ink, ...tabular }}
            >
              {p.price}
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>/mo</span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 92,
              width: 124,
              height: 1,
              background: hot ? T.greenLine : T.line,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 100,
              fontSize: 11,
              color: T.slate,
            }}
          >
            {p.a}
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 117,
              fontSize: 11,
              color: T.slate,
            }}
          >
            {p.b}
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 134,
              width: 124,
              height: 22,
              borderRadius: R.full,
              background: hot ? T.brand400 : T.bgSubtle,
              color: hot ? "#FFFFFF" : T.ink2,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Choose {p.size}
          </div>
        </div>
      );
    })}

    {/* ---------------------------------------------------------- footer -- */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 954,
        width: PAGE_W,
        height: 60,
        background: T.bgSubtle,
        borderTop: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          background: T.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paw size={11} color="#FFFFFF" />
      </div>
      <span
        style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: T.ink2 }}
      >
        Snoutbox
      </span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted }}>
        Privacy &#183; Terms
      </span>
    </div>
  </div>
);

/* ------------------------------------------------------------ composition -- */

export const TmP6IdeaToPage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spr = (
    t0: number,
    dur = 26,
    config: { damping: number; stiffness: number; mass?: number } = SPRINGS.pop,
  ) => spring({ frame: frame - t0, fps, config, durationInFrames: dur });

  const cam = useCam({ keys: KEY_T, fx: KEY_FX, fy: KEY_FY, z: KEY_Z });

  /* ---- beat 1 — the idea lands, three agents start working ---- */
  const meIn = spr(-12, 24);
  const typeIn = [spr(8, 22), spr(15, 22), spr(22, 22)];
  const typeOut = interpolate(frame, [50, 64], [1, 0], easedOpt);

  /* ---- beat 2 — RESEARCH ---- */
  const b1In = spr(56, 26);
  const b1Find = [spr(74, 20), spr(80, 20), spr(86, 20)];
  const b1Bars = [spr(84, 16), spr(88, 16), spr(92, 16), spr(96, 16)];

  /* ---- beat 3 — COPY ---- */
  const b2In = spr(128, 26);
  const COPY_HEAD = "Treats your dog\ncan actually eat.";
  const typed = useTypewriter(COPY_HEAD, 140, 2.05);
  const caretOn = frame >= 140 && typed.length < COPY_HEAD.length && frame % 16 < 9;
  const b2Sub = interpolate(frame, [158, 170], [0, 1], easedOpt);
  const b2Bul = [
    interpolate(frame, [170, 180], [0, 1], easedOpt),
    interpolate(frame, [176, 186], [0, 1], easedOpt),
  ];

  /* ---- beat 4 — WEB PAGE ---- */
  const b3In = spr(198, 26);
  const thumbIn = interpolate(frame, [210, 226], [0, 1], easedOpt);

  const curP = interpolate(frame, [218, 244], [0, 1], easedOpt);
  const curX = 560 + (774 - 560) * curP;
  const curY = 3210 + (3394 - 3210) * curP;
  const curOp =
    interpolate(frame, [212, 220], [0, 1], clampOpt) *
    interpolate(frame, [276, 288], [1, 0], clampOpt);
  const pressP = interpolate(frame, [266, 271, 278], [0, 1, 0], clampOpt);
  const rippleP = interpolate(frame, [270, 292], [0, 1], clampOpt);

  /* ---- beat 5 — the page opens ---- */
  const expandP = interpolate(frame, [272, 296], [0, 1], easedOpt);
  const scroll = interpolate(frame, [298, 322], [0, 204], {
    easing: Easing.out(Easing.cubic),
    ...clampOpt,
  });

  const b3BodyH = B3_BODY_MIN + (B3_BODY_MAX - B3_BODY_MIN) * expandP;
  const b1CardH = CARD_CHROME + B1_BODY_H;
  const b2CardH = CARD_CHROME + B2_BODY_H;
  const b3CardH = CARD_CHROME + b3BodyH;

  const BARS = [
    { label: "Allergy fit", v: 68 },
    { label: "Size fit", v: 51 },
    { label: "Price", v: 44 },
    { label: "Vet-picked", v: 29 },
  ];
  const BAR_W = 96;
  const BAR_GAP = 30;
  const BAR_MAX_H = 112;
  const BAR_X0 = (CARD_W - 52 - (BARS.length * BAR_W + (BARS.length - 1) * BAR_GAP)) / 2;

  return (
    <PaperWorld
      cam={cam}
      grid={{ left: -1600, top: -1600, width: 5000, height: 7400 }}
    >
      {/* -------- opaque chat surfaces (background layers, full bleed) ----- */}
      <Wallpaper />
      <div
        style={{
          position: "absolute",
          left: -1520,
          top: -1400,
          width: 4320,
          height: 1400 + WALL_TOP,
          background: T.card,
        }}
      />

      {/* ------------------------------- thread ------------------------- */}
      <ChatHeader
        x={CX - 28}
        y={HEADER_Y}
        w={CW + 56}
        h={HEADER_H}
        title="New product idea"
        sub="4 members"
        stack={[AG.trendResearcher, AG.contentCreator, AG.frontendDev]}
      />

      <SystemLine
        x={CX}
        y={SYS_Y}
        w={CW}
        names="Trend Researcher, Content Creator, Frontend Developer"
      >
        were invited to the group
      </SystemLine>

      <MeMsg right={1080 - (CX + CW)} y={ME_Y} maxW={560} enter={meIn}>
        idea: a monthly dog treat subscription &#8212; box picked for your
        dog&#8217;s size and allergies
      </MeMsg>

      {/* three agents working in parallel */}
      <div style={{ opacity: typeOut }}>
        <TypingRow
          y={TYPE_Y}
          agent={AG.trendResearcher}
          enter={typeIn[0]}
        />
        <TypingRow
          y={TYPE_Y + TYPE_PITCH}
          agent={AG.contentCreator}
          enter={typeIn[1]}
        />
        <TypingRow
          y={TYPE_Y + TYPE_PITCH * 2}
          agent={AG.frontendDev}
          enter={typeIn[2]}
        />
      </div>

      {/* =================== 1 — RESEARCH =============================== */}
      <AgentMsg
        x={CX}
        y={B1_NAME_Y}
        w={CW}
        agent={AG.trendResearcher}
        enter={b1In}
        size={26}
        pad={BUB_PAD}
      >
        <div style={{ height: 38 }}>Pulled 214 posts and 6 rival boxes.</div>
        <div style={{ height: 38 }}>Allergy fit is the thing people ask for.</div>
        <div style={{ height: b1CardH, marginTop: 14 }} />
      </AgentMsg>
      <DeliveryCard
        x={CARD_X}
        y={B1_CARD_Y}
        w={CARD_W}
        h={b1CardH}
        title="Dog treat box — demand scan"
        badge="RESEARCH"
        meta="1 delivery · v1 · Thought for 9s"
        enter={b1In}
      >
        <div style={{ height: B1_BODY_H, padding: "6px 26px 0", boxSizing: "border-box" }}>
          <FindingRow label="Search volume, 12 mo" value="+41%" enter={b1Find[0]} />
          <FindingRow label="Rival boxes filtering allergies" value="1 of 6" enter={b1Find[1]} />
          <FindingRow label="Would pay $30+ / mo" value="54%" enter={b1Find[2]} />
          <div
            style={{
              height: 1.5,
              background: T.lineSoft,
              margin: "12px 0 0",
            }}
          />
          {/* bar chart */}
          <div style={{ position: "relative", height: 190, marginTop: 10 }}>
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                fontFamily: FONT,
                fontSize: 18,
                color: T.muted,
              }}
            >
              share of asks · n=214
            </div>
            {BARS.map((b, i) => {
              const p = b1Bars[i];
              const h = BAR_MAX_H * (b.v / 70) * p;
              const x = BAR_X0 + i * (BAR_W + BAR_GAP);
              const base = 150;
              return (
                <React.Fragment key={b.label}>
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: base - h,
                      width: BAR_W,
                      height: h,
                      borderRadius: 8,
                      background:
                        i === 0
                          ? T.brand400
                          : `rgba(0,201,81,${0.5 - i * 0.09})`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: x - 12,
                      top: base - h - 30,
                      width: BAR_W + 24,
                      textAlign: "center",
                      fontFamily: FONT,
                      fontSize: 20,
                      fontWeight: 800,
                      color: T.ink,
                      opacity: p,
                      ...tabular,
                    }}
                  >
                    {Math.round(b.v * Math.min(1, p))}%
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: x - 14,
                      top: base + 12,
                      width: BAR_W + 28,
                      textAlign: "center",
                      fontFamily: FONT,
                      fontSize: 18,
                      color: T.slate,
                    }}
                  >
                    {b.label}
                  </div>
                </React.Fragment>
              );
            })}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 150,
                width: CARD_W - 52,
                height: 1.5,
                background: T.line,
              }}
            />
          </div>
        </div>
      </DeliveryCard>

      {/* =================== 2 — COPY ================================== */}
      <AgentMsg
        x={CX}
        y={B2_NAME_Y}
        w={CW}
        agent={AG.contentCreator}
        enter={b2In}
        size={26}
        pad={BUB_PAD}
      >
        <div style={{ height: 38 }}>Landing copy, v1 &#8212; allergy fit up front.</div>
        <div style={{ height: b2CardH, marginTop: 14 }} />
      </AgentMsg>
      <DeliveryCard
        x={CARD_X}
        y={B2_CARD_Y}
        w={CARD_W}
        h={b2CardH}
        title="Landing copy — hero + proof"
        badge="COPY"
        meta="1 delivery · v1 · Thought for 7s"
        enter={b2In}
      >
        <div style={{ height: B2_BODY_H, padding: "4px 26px 0", boxSizing: "border-box" }}>
          <div
            style={{
              height: 78,
              fontFamily: FONT,
              fontSize: 34,
              lineHeight: "39px",
              fontWeight: 800,
              color: T.ink,
              letterSpacing: -0.8,
              whiteSpace: "pre-line",
            }}
          >
            {typed}
            {caretOn ? (
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 30,
                  background: T.ink,
                  transform: "translateY(4px)",
                }}
              />
            ) : null}
          </div>
          <div
            style={{
              marginTop: 18,
              height: 61,
              fontFamily: FONT,
              fontSize: 21,
              lineHeight: "30px",
              color: T.slate,
              opacity: b2Sub,
              transform: `translateY(${(1 - b2Sub) * 8}px)`,
            }}
          >
            Every box is filtered for their size, their
            <br />
            allergies, and nothing else.
          </div>
          <div style={{ marginTop: 18 }}>
            {[
              "Vet-reviewed ingredient list on every box",
              "Skip, swap or cancel any month",
            ].map((b, i) => (
              <div
                key={b}
                style={{
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: FONT,
                  fontSize: 20,
                  color: T.ink2,
                  opacity: b2Bul[i],
                  transform: `translateX(${(1 - b2Bul[i]) * -10}px)`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: R.full,
                    background: T.brand300,
                  }}
                />
                {b}
              </div>
            ))}
          </div>
        </div>
      </DeliveryCard>

      {/* =================== 3 — WEB PAGE + payoff ===================== */}
      <AgentMsg
        x={CX}
        y={B3_NAME_Y}
        w={CW}
        agent={AG.frontendDev}
        enter={b3In}
        size={26}
        pad={BUB_PAD}
      >
        <div style={{ height: 38 }}>Page is up &#8212; hero, product, pricing.</div>
        <div style={{ height: b3CardH, marginTop: 14 }} />
      </AgentMsg>
      <DeliveryCard
        x={CARD_X}
        y={B3_CARD_Y}
        w={CARD_W}
        h={b3CardH}
        title="Snoutbox landing page"
        badge="WEB PAGE"
        meta="1 delivery · v1 · Thought for 14s"
        enter={b3In}
        press={pressP}
      >
        <div
          style={{
            position: "relative",
            width: CARD_W,
            height: b3BodyH,
            overflow: "hidden",
            background: T.card,
            boxShadow: `inset 0 1.5px 0 ${T.lineSoft}, inset 0 -1.5px 0 ${T.lineSoft}`,
            opacity: thumbIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: PAGE_W,
              transform: `scale(${PAGE_SCALE})`,
              transformOrigin: "0 0",
            }}
          >
            <div style={{ transform: `translateY(${-scroll}px)` }}>
              <LandingPage />
            </div>
          </div>

        </div>
      </DeliveryCard>

      {/* click ripple, in world coords over the expand control */}
      {rippleP > 0 && rippleP < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 777 - 34 - 60 * rippleP,
            top: 3397 - 34 - 60 * rippleP,
            width: 68 + 120 * rippleP,
            height: 68 + 120 * rippleP,
            borderRadius: R.full,
            border: `3px solid rgba(0,201,81,${0.55 * (1 - rippleP)})`,
          }}
        />
      ) : null}

      {curOp > 0.01 ? (
        <Cursor x={curX} y={curY} scale={1.5} opacity={curOp} />
      ) : null}
    </PaperWorld>
  );
};
