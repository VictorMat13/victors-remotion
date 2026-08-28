// Shared DNA for the Liam x Runable GROW reel (Aug 2026) — LIAM WHITE STYLE.
// The world is Liam's warm white; Runable's real product UI renders in its own
// authentic cream/near-white and floats as cards on that world. Runable's amber
// is the accent. Dark lives ONLY inside cards (e.g. the black submit button).
//
// Runable values were sampled from the LIVE app via getComputedStyle while
// logged in. Screenshots backing every claim: public/rgrow/reference/.
// READ-ONLY for builder agents: import tokens, build in your own comp file.

// ---------------------------------------------------------------- Liam world
export const LW = {
  paper: "#F7F6F3", // the warm white world (Liam default)
  paperDeep: "#EFEDE8", // subtle floor gradient / inset
  card: "#FFFFFF", // floating white card
  cardSoft: "#FBFAF8",
  hairline: "rgba(0,0,0,0.07)", // card border
  hairlineSoft: "rgba(0,0,0,0.04)",
  ink: "#141414", // headings
  body: "#4A4A48", // body copy
  muted: "#8A8A85", // labels, captions
  shadow: "0 18px 44px rgba(23,20,14,0.10), 0 2px 6px rgba(23,20,14,0.05)",
  shadowLift: "0 34px 80px rgba(23,20,14,0.14), 0 4px 10px rgba(23,20,14,0.06)",
} as const;

// ------------------------------------------------------- Runable product UI
export const RN = {
  bg: "#FEFDFB", // app background
  panel: "#F4F1EE",
  hover: "#F3EFEB",
  card: "#FFFFFF",
  ink: "#111111", // black submit / primary button
  text: "#060606",
  textWarm: "#3D2E24",
  muted: "#6B5A50",
  border: "rgba(0,0,0,0.05)",
  borderStrong: "rgba(0,0,0,0.10)",
  amber: "#DE9B4A", // THE accent for this series
  amberSoft: "rgba(222,155,74,0.12)",
  cyan: "#00B7CA",
  green: "#1DA25A",
} as const;

// Platform brand colors — only for the real ad-platform marks that exist in Grow.
export const PLATFORM = {
  meta: "#0081FB",
  googleBlue: "#4285F4",
  googleRed: "#EA4335",
  googleYellow: "#FBBC04",
  googleGreen: "#34A853",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  openai: "#000000",
} as const;

export const FONT_SANS =
  'IDGrotesk, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
export const FONT_DISPLAY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif';

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200 },
  smooth: { damping: 200, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 140 },
  heavy: { damping: 16, stiffness: 80, mass: 1.6 },
} as const;

export const safePadX = (width: number) => Math.round(width * 0.05);

// REAL strings from Runable Grow. Do not invent product copy.
export const GROW = {
  heading: "Let's grow your business",
  toggle: ["Build", "Grow"],
  credits: "869",
  sections: {
    ads: "Running Ads",
    social: "Social Media",
    outreach: "Cold Outreach",
    listening: "Social Listening",
    organic: "Organic Growth",
  },
  ads: ["ChatGPT Ads", "Meta Ads", "Google Ads", "LinkedIn Ads", "Tiktok Ads"],
  adsBadge: "Runable Managed", // sits on the ChatGPT Ads card
  social: ["Instagram", "LinkedIn", "X / Twitter", "Tiktok"],
  outreach: ["Cold Calling", "Cold Emailing"],
  listening: ["Competitors", "Leads", "Your Company"],
  organic: ["SEO Audit", "AI Visibility - AEO", "Support Mail"],
  website: "Pick a default website and it will show up here.",
  setWebsite: "Set default website",
  contact: ["Set up email", "Get phone number"],
  model: "Auto",
} as const;

// Confirmed facts (brief section 03). $21M Series A is the ONLY funding figure
// Runable has published. Do not add pricing or performance numbers.
export const FACTS = {
  raise: "$21M",
  raiseLong: "$21M Series A",
  founders: "Umesh and Saksham",
  pronounce: "RUN-uh-bul",
} as const;

// UNVERIFIED — the $100 / $1M / 10,000-spots offer in the script could not be
// found in the brief, in the live product, or publicly (see
// CREATORS/promptible/reels/brand deals/Runable/SCRIPT-REVIEW-liam-grow.md).
// Victor authorised building it anyway. Keep every use of these values routed
// through this object so a single edit can change or remove them if Runable
// does not confirm.
export const OFFER = {
  perUser: "$100",
  total: "$1,000,000",
  totalShort: "$1M",
  spots: "10,000",
} as const;

export const SHOTS = {
  growHome: "rgrow/reference/grow-01-home.png",
  coldOutreach: "rgrow/reference/grow-02-cold-outreach.png",
  organic: "rgrow/reference/grow-03-organic.png",
  buildComposer: "rgrow/reference/build-composer.png",
  buildHome: "rgrow/reference/build-home.png",
} as const;

// ===========================================================================
// LIVE-RUN CAPTURE (2026-08-27). Every string below was read off the REAL app
// while running the actual workflow logged in — screenshots in
// public/rgrow/capture/ (canonical copies in
// CREATORS/promptible/reels/runable/references/capture/). Do not paraphrase.
// ===========================================================================

// The real "Run Ads" modal (opens from Grow → Running Ads → Meta Ads / Google
// Ads). Same layout for both platforms; only the logo + one word change.
// Captures: grow-01-meta-ads-open.png ($10), grow-02-meta-100day.png ($100),
// grow-03-google-ads.png (Google, $100).
export const RUNADS = {
  title: "Run Ads",
  subMeta: "Runable creates and manages Meta Ads for you.",
  subGoogle: "Runable creates and manages Google Ads for you.",
  sendTo: "Send visitors to",
  site: "Your website created on Runable",
  setDefault: "Set default website",
  budgetLabel: "Daily budget",
  budgetMin: "$10",
  budgetMax: "$1000",
  fee: (n: number) => `$${n} to ads · $0 platform fee`,
  cta: (n: number) => `Run Ads ($${n}/day)`,
  footnote:
    "The first day comes from your ads balance. You approve that charge before anything runs.",
} as const;

// The real "Cold Emailing" modal (Grow → Cold Outreach → Cold Emailing).
// Captures: grow-05-cold-emailing.png, grow-06-cold-emailing-2.png.
export const COLDMAIL = {
  title: "Cold Emailing",
  sub: "Leads researched and emailed from an address of your own.",
  domainNote:
    "None of your domains send email yet. Connect one, and replies come back to you.",
  connectCta: "Connect a new domain",
  who: "Who to contact",
  chips: ["People Data", "Company Data", "SMB Data"],
  whoCopy:
    "and web search to get me customers for my business. No need to double-check every contact or overthink it.",
  research: "Runable researches this and builds the list before the first send.",
  pitchLabel: "What to pitch",
  freqLabel: "Frequency",
  freq: "Daily",
  timeLabel: "Time (GMT+2)",
  time: "1:00 PM",
  limitLabel: "Limit per run",
  limitVal: 10,
  limitMin: 1,
  limitMax: 20,
  beforeLabel: "Before sending",
  optDirect: "Send directly",
  optDraft: "Draft and notify me", // checked by default in the real app
  cancel: "Cancel",
  start: "Start emailing",
} as const;

// The Grow composer, verbatim.
export const GROW_COMPOSER = {
  heading: "Let's grow your business",
  placeholder: "Increase my customer reach...",
} as const;

// The real coffee run used across this series (the business we actually
// launched in-app; task "Toronto Coffee Launch").
export const RUN = {
  prompt:
    "We roast coffee in Toronto and sell it online. Launch it: build the landing page, write the 5 welcome emails, and draft a week of social posts.",
  brand: "Harbourlight Coffee",
  tagline: "small-batch roasts from Toronto's east end",
  ig: "@harbourlightcoffee",
  offerCode: "FIRSTPOUR",
} as const;

// The launch plan the in-app agent PUBLISHED during the live run (verbatim
// from the "Plan — Harbourlight Coffee launch" message, screenshot
// build-05-working.png). The credit limit stalled the site build, so Part 2
// recreates the outputs from THIS plan + the agent's own generated images —
// nothing invented beyond what the agent itself specified.
export const LAUNCH = {
  planTitle: "Plan — Harbourlight Coffee launch",
  palette: { cream: "#F7F1E6", charcoal: "#22201D", amber: "#C8761F" },
  fonts: { display: "Fraunces", body: "Public Sans" },
  heroTagline: "Small-batch roasts from Toronto's east end",
  heroBanner: "FIRSTPOUR",
  products: [
    { name: "Ember espresso blend", price: "$22", img: "rgrow/harbourlight/bag-ember.png" },
    { name: "Lakeshore light roast", price: "$21", img: "rgrow/harbourlight/bag-lakeshore.png" },
    { name: "Junction decaf", price: "$20", img: "rgrow/harbourlight/bag-junction.png" },
    { name: "Kensington single-origin", price: "$26", img: "rgrow/harbourlight/bag-kensington.png" },
  ],
  shipStrip: "Roasted Monday, shipped in 48 hours",
  subscription: "15% off, monthly",
  farms: "direct-trade, three farms",
  handle: "@harbourlightcoffee",
  emailSubjects: [
    "Welcome: your FIRSTPOUR code",
    "How we roast: the 48-hour promise",
    "The three farms",
    "Which bean is for you",
    "Subscription: 15% off, always fresh",
  ],
  social: { igPosts: 7, xPosts: 7, lead: "Instagram" },
  images: {
    hero: "rgrow/harbourlight/hero-pour.png",
    roastery: "rgrow/harbourlight/roastery.png",
    farm: "rgrow/harbourlight/farm.png",
  },
} as const;

// Real press coverage of the raise (published 2026-08-26, verified via fetch).
// Use verbatim; this is a real-world artifact, not invented copy.
export const PRESS = {
  outlet: "TechCrunch",
  headline:
    "Runable hits $21M to bet AI agents can go from building businesses to growing them",
  date: "August 26, 2026",
} as const;

// The in-product ledger surface for the giveaway beat (P3 blend direction).
// Stylized product UI in Runable's cream language; keep strings minimal.
export const LEDGER = {
  balanceLabel: "Ads balance",
  zero: "$0.00",
  credited: "$100.00",
  creditLine: "Growth launch credit",
  creditAmount: "+$100.00",
  totalLabel: "Credited to users",
  total: "$1,000,000",
} as const;

// Live-run screenshots for fragment insets (public/rgrow/capture/).
export const CAPS = {
  buildHome: "rgrow/capture/build-00-home.png",
  composerTyped: "rgrow/capture/build-01-composer-typed.png",
  taskStarted: "rgrow/capture/build-02-task-started.png",
  questionBrand: "rgrow/capture/build-03-progress.png",
  afterQuestions: "rgrow/capture/build-04-after-questions.png",
  growHome: "rgrow/capture/grow-00-home.png",
  metaAds10: "rgrow/capture/grow-01-meta-ads-open.png",
  metaAds100: "rgrow/capture/grow-02-meta-100day.png",
  googleAds100: "rgrow/capture/grow-03-google-ads.png",
  growSections: "rgrow/capture/grow-04-sections-scroll.png",
  coldEmailTop: "rgrow/capture/grow-05-cold-emailing.png",
  coldEmailBottom: "rgrow/capture/grow-06-cold-emailing-2.png",
} as const;
