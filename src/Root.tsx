import "./index.css";
import { Composition } from "remotion";
// --- Claude-Chat (Aug 2026, PAPER + real Claude macOS app captures) --------
import {
  TmP1KilledChatbot,
  DURATION_IN_FRAMES as TM_P1_DURATION,
} from "./teamily/TmP1KilledChatbot";
import {
  TmP2AlreadyKnow,
  DURATION_IN_FRAMES as TM_P2_DURATION,
} from "./teamily/TmP2AlreadyKnow";
import {
  TmP3InsideMessenger,
  DURATION_IN_FRAMES as TM_P3_DURATION,
} from "./teamily/TmP3InsideMessenger";
import {
  TmP4FeedTakeOne,
  DURATION_IN_FRAMES as TM_P4_DURATION,
} from "./teamily/TmP4FeedTakeOne";
import {
  TmP5TagAndType,
  DURATION_IN_FRAMES as TM_P5_DURATION,
} from "./teamily/TmP5TagAndType";
import {
  TmP6IdeaToPage,
  DURATION_IN_FRAMES as TM_P6_DURATION,
} from "./teamily/TmP6IdeaToPage";
import {
  TmP7FeedFullOfThese,
  DURATION_IN_FRAMES as TM_P7_DURATION,
} from "./teamily/TmP7FeedFullOfThese";
import {
  CcVoxReel,
  DURATION_IN_FRAMES as CC_VOX_DURATION,
} from "./claude-chat/CcVoxReel";
// --- Higgs-Chat series (Aug 2026, PAPER + LIME, real ChatGPT shots) --------
import {
  HcP1Hook,
  DURATION_IN_FRAMES as HC_P1_DURATION,
} from "./higgs-chat/HcP1Hook";
import {
  HcP2Connect,
  DURATION_IN_FRAMES as HC_P2_DURATION,
} from "./higgs-chat/HcP2Connect";
import {
  HcP3Plugins,
  DURATION_IN_FRAMES as HC_P3_DURATION,
} from "./higgs-chat/HcP3Plugins";
import {
  HcP4Upload,
  DURATION_IN_FRAMES as HC_P4_DURATION,
} from "./higgs-chat/HcP4Upload";
import {
  HcP5Animate,
  DURATION_IN_FRAMES as HC_P5_DURATION,
} from "./higgs-chat/HcP5Animate";
import {
  HcP6UsefulPart,
  DURATION_IN_FRAMES as HC_P6_DURATION,
} from "./higgs-chat/HcP6UsefulPart";
// --- Google Tools series (Aug 2026, PAPER + GOOGLE BLUE) --------------------
import {
  GtP1Hook,
  DURATION_IN_FRAMES as GT_P1_DURATION,
} from "./google-tools/GtP1Hook";
import {
  GtP2Pomelli,
  DURATION_IN_FRAMES as GT_P2_DURATION,
} from "./google-tools/GtP2Pomelli";
import {
  GtP3Stitch,
  DURATION_IN_FRAMES as GT_P3_DURATION,
} from "./google-tools/GtP3Stitch";
import {
  GtP4Opal,
  DURATION_IN_FRAMES as GT_P4_DURATION,
} from "./google-tools/GtP4Opal";
import {
  GtP5Antigravity,
  DURATION_IN_FRAMES as GT_P5_DURATION,
} from "./google-tools/GtP5Antigravity";
import {
  GtP6Mixboard,
  DURATION_IN_FRAMES as GT_P6_DURATION,
} from "./google-tools/GtP6Mixboard";
import {
  GtP7FiveFree,
  DURATION_IN_FRAMES as GT_P7_DURATION,
} from "./google-tools/GtP7FiveFree";
// --- Scrapy series (Aug 2026, PAPER + TEAL) --------------------------------
import {
  ScrHookNoApi,
  DURATION_IN_FRAMES as SCR_HOOK_DURATION,
} from "./scrapy/ScrHookNoApi";
import {
  ScrRepoStars,
  DURATION_IN_FRAMES as SCR_STARS_DURATION,
} from "./scrapy/ScrRepoStars";
import {
  ScrOneFileData,
  DURATION_IN_FRAMES as SCR_ONEFILE_DURATION,
} from "./scrapy/ScrOneFileData";
import {
  ScrHandlesHardParts,
  DURATION_IN_FRAMES as SCR_HARD_DURATION,
} from "./scrapy/ScrHandlesHardParts";
import {
  ScrPublicDataRules,
  DURATION_IN_FRAMES as SCR_RULES_DURATION,
} from "./scrapy/ScrPublicDataRules";
import {
  ScrUseCases,
  DURATION_IN_FRAMES as SCR_USES_DURATION,
} from "./scrapy/ScrUseCases";
// --- screenshot-to-code series (Aug 2026, PAPER) --------------------------
import {
  S2cHookOnlyTool,
  DURATION_IN_FRAMES as S2C_HOOK_A_DURATION,
} from "./s2c/S2cHookOnlyTool";
import {
  S2cHookThreeInputs,
  DURATION_IN_FRAMES as S2C_HOOK_B_DURATION,
} from "./s2c/S2cHookThreeInputs";
import {
  S2cRepoStars,
  DURATION_IN_FRAMES as S2C_STARS_DURATION,
} from "./s2c/S2cRepoStars";
import {
  S2cSelfCheck,
  DURATION_IN_FRAMES as S2C_CHECK_DURATION,
} from "./s2c/S2cSelfCheck";
import {
  S2cCapabilities,
  DURATION_IN_FRAMES as S2C_CAP_DURATION,
} from "./s2c/S2cCapabilities";
import {
  S2cOneLineSetup,
  DURATION_IN_FRAMES as S2C_SETUP_DURATION,
} from "./s2c/S2cOneLineSetup";
// --- Graphify series (Aug 2026, DARK) ------------------------------------
import {
  GfxGrepToGraph,
  DURATION_IN_FRAMES as GFX_GREP_DURATION,
} from "./graphify/GfxGrepToGraph";
import {
  GfxRepoStars,
  DURATION_IN_FRAMES as GFX_STARS_DURATION,
} from "./graphify/GfxRepoStars";
import {
  GfxMapNotReread,
  DURATION_IN_FRAMES as GFX_MAP_DURATION,
} from "./graphify/GfxMapNotReread";
import {
  GfxEveryFileType,
  DURATION_IN_FRAMES as GFX_TYPES_DURATION,
} from "./graphify/GfxEveryFileType";
import {
  GfxLocalSharedMap,
  DURATION_IN_FRAMES as GFX_LOCAL_DURATION,
} from "./graphify/GfxLocalSharedMap";
// --- OpenSEO series (Aug 2026) ------------------------------------------
import {
  SeoDeptClaude,
  DURATION_IN_FRAMES as SEO_DEPT_DURATION,
} from "./openseo/SeoDeptClaude";
import {
  SeoHookTwoAnswers,
  DURATION_IN_FRAMES as SEO_HOOK_DURATION,
} from "./openseo/SeoHookTwoAnswers";
import {
  SeoRepoStars,
  DURATION_IN_FRAMES as SEO_STARS_DURATION,
} from "./openseo/SeoRepoStars";
import {
  SeoCostAnchor,
  DURATION_IN_FRAMES as SEO_COST_DURATION,
} from "./openseo/SeoCostAnchor";
import {
  SeoMcpPlug,
  DURATION_IN_FRAMES as SEO_MCP_DURATION,
} from "./openseo/SeoMcpPlug";
import {
  SeoSixWorkflows,
  DURATION_IN_FRAMES as SEO_SIX_DURATION,
} from "./openseo/SeoSixWorkflows";
import { SubmagicAbsorption } from "./SubmagicAbsorption";
import { SignalVsVanity } from "./SignalVsVanity";
import { PipelineLoop } from "./PipelineLoop";
import {
  NvidiaFreeApi,
  DURATION_IN_FRAMES as NVIDIA_DURATION,
} from "./NvidiaFreeApi";
import {
  CreatifyKilledAgencies,
  DURATION_IN_FRAMES as CREATIFY_DURATION,
} from "./CreatifyKilledAgencies";
import {
  CreatifyRolesReplaced,
  DURATION_IN_FRAMES as ROLES_DURATION,
} from "./CreatifyRolesReplaced";
import {
  PullsOutProblems,
  DURATION_IN_FRAMES as PULLSOUT_DURATION,
} from "./PullsOutProblems";
import {
  VidmuseWhiteFrame,
  DURATION_IN_FRAMES as VIDMUSEFRAME_DURATION,
} from "./VidmuseWhiteFrame";
import {
  FishTensionSwitch,
  DURATION_IN_FRAMES as FISHTENSION_DURATION,
} from "./FishTensionSwitch";
import {
  FishEmpathyUseCases,
  DURATION_IN_FRAMES as FISHEMPATHY_DURATION,
} from "./FishEmpathyUseCases";
import {
  FishUnlimitedDirections,
  DURATION_IN_FRAMES as FISHUNLIMITED_DURATION,
} from "./FishUnlimitedDirections";
import {
  FishFreeApiAccess,
  DURATION_IN_FRAMES as FISHFREEAPI_DURATION,
} from "./FishFreeApiAccess";
import {
  FishDetectorFooled,
  DURATION_IN_FRAMES as FISHDETECTOR_DURATION,
} from "./FishDetectorFooled";
import {
  ProjectorV2WhiteFrame,
  DURATION_IN_FRAMES as PROJECTORV2_DURATION,
} from "./ProjectorV2WhiteFrame";
import {
  ItDoesNotStop,
  DURATION_IN_FRAMES as ITDOESNOTSTOP_DURATION,
} from "./ItDoesNotStop";
import {
  RunTheCampaign,
  DURATION_IN_FRAMES as CAMPAIGN_DURATION,
} from "./RunTheCampaign";
import {
  AgencyStepsPipeline,
  DURATION_IN_FRAMES as AGENCYSTEPS_DURATION,
} from "./AgencyStepsPipeline";
import {
  BrandsThatWin,
  DURATION_IN_FRAMES as BRANDSWIN_DURATION,
} from "./BrandsThatWin";
import {
  CreatifyPromoted,
  DURATION_IN_FRAMES as PROMOTED_DURATION,
} from "./CreatifyPromoted";
import {
  FableFiveBack,
  DURATION_IN_FRAMES as FABLEFIVE_DURATION,
} from "./FableFiveBack";
import {
  HiggsSelfDestruct,
  DURATION_IN_FRAMES as HIGGSDESTRUCT_DURATION,
} from "./HiggsSelfDestruct";
import {
  HiggsModelsFree,
  DURATION_IN_FRAMES as HIGGSFREE_DURATION,
} from "./HiggsModelsFree";
import {
  HiggsPhotoToAd,
  DURATION_IN_FRAMES as HIGGSPHOTOAD_DURATION,
} from "./HiggsPhotoToAd";
import {
  HiggsConnectorSwitch,
  DURATION_IN_FRAMES as HIGGSCONNECT_DURATION,
} from "./HiggsConnectorSwitch";
import {
  BrandsPayingMonthly,
  DURATION_IN_FRAMES as PAYINGMONTHLY_DURATION,
} from "./BrandsPayingMonthly";
import {
  HiggsfieldAdsSwipe,
  DURATION_IN_FRAMES as HIGGSADS_DURATION,
} from "./HiggsfieldAdsSwipe";
import {
  HiggsfieldThreeAds,
  DURATION_IN_FRAMES as HIGGSTHREE_DURATION,
} from "./HiggsfieldThreeAds";
import {
  AiVideoGenScan,
  DURATION_IN_FRAMES as AIVIDEOGEN_DURATION,
} from "./AiVideoGenScan";
import {
  SynapsePromptScroll,
  DURATION_IN_FRAMES as SYNAPSE_PROMPT_DURATION,
} from "./SynapsePromptScroll";
import {
  StyleMatchTransfer,
  DURATION_IN_FRAMES as STYLEMATCH_DURATION,
} from "./StyleMatchTransfer";
import {
  ShowDontDescribe,
  DURATION_IN_FRAMES as SHOWDONT_DURATION,
} from "./ShowDontDescribe";
import {
  KimiBetterSlides,
  DURATION_IN_FRAMES as KIMISLIDES_DURATION,
} from "./KimiBetterSlides";
import {
  KimiTraceableSources,
  DURATION_IN_FRAMES as KIMISOURCES_DURATION,
} from "./KimiTraceableSources";
import {
  VidMuseFormula,
  DURATION_IN_FRAMES as VIDMUSE_DURATION,
} from "./VidMuseFormula";
import {
  LandTheClient,
  DURATION_IN_FRAMES as LANDCLIENT_DURATION,
} from "./LandTheClient";
import { ClipCard, DURATION_IN_FRAMES as CLIPCARD_DURATION } from "./ClipCard";
import {
  NeverPromptThis,
  DURATION_IN_FRAMES as NEVERPROMPT_DURATION,
} from "./NeverPromptThis";
import {
  RunSideBySide,
  DURATION_IN_FRAMES as RUNSIDEBYSIDE_DURATION,
} from "./RunSideBySide";
import {
  FishAudioSavedAgents,
  DURATION_IN_FRAMES as FISHAUDIO_DURATION,
} from "./FishAudioSavedAgents";
import {
  SnymaScriptStudio,
  DURATION_IN_FRAMES as SNYMA_STUDIO_DURATION,
} from "./SnymaScriptStudio";
import {
  FishVoiceStudioRide,
  DURATION_IN_FRAMES as FISHVOICERIDE_DURATION,
} from "./FishVoiceStudioRide";
import {
  SnymaStudioExplainer,
  DURATION_IN_FRAMES as SNYMA_EXPLAINER_DURATION,
} from "./SnymaStudioExplainer";
import {
  FishAudioRevived,
  DURATION_IN_FRAMES as FISHREVIVED_DURATION,
} from "./FishAudioRevived";
import {
  FishAudioUseCases,
  DURATION_IN_FRAMES as FISHUSECASES_DURATION,
} from "./FishAudioUseCases";
import {
  FishVoiceBreaks,
  DURATION_IN_FRAMES as FISHVOICEBREAKS_DURATION,
} from "./FishVoiceBreaks";
import {
  FishFlatDelivery,
  DURATION_IN_FRAMES as FISHFLATDELIVERY_DURATION,
} from "./FishFlatDelivery";
import {
  FishPitchRibbon,
  DURATION_IN_FRAMES as FISHPITCHRIBBON_DURATION,
} from "./FishPitchRibbon";
import {
  FishSpeaksAsItWrites,
  DURATION_IN_FRAMES as FISHSPEAKS_DURATION,
} from "./FishSpeaksAsItWrites";
import {
  FishVoiceCallOrb,
  DURATION_IN_FRAMES as FISHORB_DURATION,
  calculateFishOrbMetadata,
} from "./FishVoiceCallOrb";
import {
  FishCampaignOrb,
  FISHCAMPAIGN_DURATION,
  calculateFishCampaignMetadata,
} from "./FishCampaignOrb";
import {
  StopFixingWrongPart,
  DURATION_IN_FRAMES as WRONGPART_DURATION,
} from "./StopFixingWrongPart";
import {
  ThreeWrongFixes,
  DURATION_IN_FRAMES as THREEFIXES_DURATION,
} from "./ThreeWrongFixes";
import {
  FindProblemFirst,
  DURATION_IN_FRAMES as FINDPROBLEM_DURATION,
} from "./FindProblemFirst";
import {
  OneClearAngle,
  DURATION_IN_FRAMES as ONECLEAR_DURATION,
} from "./OneClearAngle";
import {
  PolloHeartbeatVerdict,
  DURATION_IN_FRAMES as POLLOHEARTBEAT_DURATION,
} from "./PolloHeartbeatVerdict";

import {
  BluehostHermesV,
  DURATION_IN_FRAMES as BLUEHOST_V_DURATION,
} from "./BluehostHermesV";
import {
  BluehostHermesH,
  DURATION_IN_FRAMES as BLUEHOST_H_DURATION,
} from "./BluehostHermesH";

import {
  BluehostWantPainSq,
  BluehostWantPainH,
  DURATION_IN_FRAMES as WANTPAIN_DURATION,
} from "./bluehost/WantPain";

import {
  FishTenAds,
  DURATION_IN_FRAMES as FISHTENADS_DURATION,
} from "./FishTenAds";

import {
  FishClaudeEmotionTags,
  DURATION_IN_FRAMES as FISHEMOTIONTAGS_DURATION,
} from "./FishClaudeEmotionTags";

import {
  FishHookWins,
  DURATION_IN_FRAMES as FISHHOOKWINS_DURATION,
} from "./FishHookWins";

import {
  FishHooksDrop,
  DURATION_IN_FRAMES as FISHHOOKS_DURATION,
} from "./FishHooksDrop";

import {
  FishSameFolder,
  DURATION_IN_FRAMES as FISHSAMEFOLDER_DURATION,
} from "./FishSameFolder";

import {
  FishFlopNewAngle,
  DURATION_IN_FRAMES as FISHFLOPANGLE_DURATION,
} from "./FishFlopNewAngle";

import {
  FishWatchAdWhiteFrame,
  DURATION_IN_FRAMES as FISHWATCHAD_DURATION,
} from "./FishWatchAdWhiteFrame";

import {
  FishFramedAd,
  DURATION_IN_FRAMES as FISHFRAMEDAD_DURATION,
} from "./FishFramedAd";

import {
  FishSecondBrainTree,
  DURATION_IN_FRAMES as FISHBRAINTREE_DURATION,
} from "./FishSecondBrainTree";

import {
  FishBrainTalksBack,
  DURATION_IN_FRAMES as FISHTALKSBACK_DURATION,
  calculateBrainTalksBackMetadata,
} from "./FishBrainTalksBack";

import {
  FishAskTheBrain,
  DURATION_IN_FRAMES as FISHASKBRAIN_DURATION,
  calculateAskTheBrainMetadata,
} from "./FishAskTheBrain";

import {
  FishCloneWiredIn,
  DURATION_IN_FRAMES as FISHCLONEWIRED_DURATION,
} from "./FishCloneWiredIn";

import {
  FishCloneConnects,
  DURATION_IN_FRAMES as FISHCLONECONNECTS_DURATION,
} from "./FishCloneConnects";

import {
  FishEmotionAnswer,
  DURATION_IN_FRAMES as FISHEMOTIONANSWER_DURATION,
  calculateEmotionAnswerMetadata,
} from "./FishEmotionAnswer";

import {
  FishWholeBuild,
  DURATION_IN_FRAMES as FISHWHOLEBUILD_DURATION,
} from "./FishWholeBuild";

import {
  FishSassyDirect,
  DURATION_IN_FRAMES as FISHSASSY_DURATION,
} from "./FishSassyDirect";

import {
  FishVoiceBlob,
  DURATION_IN_FRAMES as FISHVOICEBLOB_DURATION,
  calculateVoiceBlobMetadata,
} from "./FishVoiceBlob";

import {
  FishAgentInFive,
  DURATION_IN_FRAMES as FISHAGENTFIVE_DURATION,
} from "./FishAgentInFive";

import {
  FishSecondBrain,
  DURATION_IN_FRAMES as FISHSECONDBRAIN_DURATION,
} from "./FishSecondBrain";

import {
  FishCloneToBrain,
  DURATION_IN_FRAMES as FISHCLONETOBRAIN_DURATION,
} from "./FishCloneToBrain";

import {
  FishReadsEverything,
  DURATION_IN_FRAMES as FISHREADSEVERYTHING_DURATION,
} from "./FishReadsEverything";

import {
  F4P01EveryonesBuilding,
  DURATION_IN_FRAMES as F4P01EVERYONESBUILDING_DURATION,
} from "./fish4/F4P01EveryonesBuilding";
import {
  F4P02TwoProposals,
  DURATION_IN_FRAMES as F4P02TWOPROPOSALS_DURATION,
} from "./fish4/F4P02TwoProposals";
import {
  F4P03ProblemReadOnly,
  DURATION_IN_FRAMES as F4P03PROBLEMREADONLY_DURATION,
} from "./fish4/F4P03ProblemReadOnly";
import {
  F4P04DashboardWorthNothing,
  DURATION_IN_FRAMES as F4P04DASHBOARDWORTHNOTHING_DURATION,
} from "./fish4/F4P04DashboardWorthNothing";
import {
  F4P05WiredS21Pro,
  DURATION_IN_FRAMES as F4P05WIREDS21PRO_DURATION,
} from "./fish4/F4P05WiredS21Pro";
import {
  F4P06NowWatch,
  DURATION_IN_FRAMES as F4P06NOWWATCH_DURATION,
} from "./fish4/F4P06NowWatch";
import {
  F4P07HarveyOpenSince,
  DURATION_IN_FRAMES as F4P07HARVEYOPENSINCE_DURATION,
} from "./fish4/F4P07HarveyOpenSince";
import {
  F4P08NotARobot,
  DURATION_IN_FRAMES as F4P08NOTAROBOT_DURATION,
} from "./fish4/F4P08NotARobot";
import {
  F4P09EveryBranchVoice,
  DURATION_IN_FRAMES as F4P09EVERYBRANCHVOICE_DURATION,
} from "./fish4/F4P09EveryBranchVoice";
import {
  F4P10OpsWhatMissed,
  DURATION_IN_FRAMES as F4P10OPSWHATMISSED_DURATION,
} from "./fish4/F4P10OpsWhatMissed";
import {
  F4P11OnboardingFine,
  DURATION_IN_FRAMES as F4P11ONBOARDINGFINE_DURATION,
} from "./fish4/F4P11OnboardingFine";
import {
  F4P12HeresTheUnlock,
  DURATION_IN_FRAMES as F4P12HERESTHEUNLOCK_DURATION,
} from "./fish4/F4P12HeresTheUnlock";

import {
  F5P01GaveThemVoices,
  DURATION_IN_FRAMES as F5P01_DURATION,
} from "./fish5/F5P01GaveThemVoices";
import {
  F5P02YourPricingIsWrong,
  DURATION_IN_FRAMES as F5P02_DURATION,
} from "./fish5/F5P02YourPricingIsWrong";
import {
  F5P03ThreeClaudeSkills,
  DURATION_IN_FRAMES as F5P03_DURATION,
} from "./fish5/F5P03ThreeClaudeSkills";
import {
  F5P04ThatsHomework,
  DURATION_IN_FRAMES as F5P04_DURATION,
} from "./fish5/F5P04ThatsHomework";
import {
  F5P05BuiltThreeVoices,
  DURATION_IN_FRAMES as F5P05_DURATION,
} from "./fish5/F5P05BuiltThreeVoices";
import {
  F5P06WatchWhatHappens,
  DURATION_IN_FRAMES as F5P06_DURATION,
} from "./fish5/F5P06WatchWhatHappens";
import {
  F5P07ProposalFifteenK,
  DURATION_IN_FRAMES as F5P07_DURATION,
} from "./fish5/F5P07ProposalFifteenK";
import {
  F5P08DontRaiseTheRetainer,
  DURATION_IN_FRAMES as F5P08_DURATION,
} from "./fish5/F5P08DontRaiseTheRetainer";
import {
  F5P09CutTheDeckInHalf,
  DURATION_IN_FRAMES as F5P09_DURATION,
} from "./fish5/F5P09CutTheDeckInHalf";
import {
  F5P10AskABetterQuestion,
  DURATION_IN_FRAMES as F5P10_DURATION,
} from "./fish5/F5P10AskABetterQuestion";
import {
  F5P11ElevenSeconds,
  DURATION_IN_FRAMES as F5P11_DURATION,
} from "./fish5/F5P11ElevenSeconds";
import {
  F5P12ARoomNotATool,
  DURATION_IN_FRAMES as F5P12_DURATION,
} from "./fish5/F5P12ARoomNotATool";
import {
  F5P13NumberOneBlindTests,
  DURATION_IN_FRAMES as F5P13_DURATION,
} from "./fish5/F5P13NumberOneBlindTests";
import {
  F5P14FreeThroughNovember,
  DURATION_IN_FRAMES as F5P14_DURATION,
} from "./fish5/F5P14FreeThroughNovember";

import {
  NotionP1PerfectTrap,
  DURATION_IN_FRAMES as NOTION_P1_DURATION,
} from "./notion-cli/NotionP1PerfectTrap";
import {
  NotionP2BusinessOs,
  DURATION_IN_FRAMES as NOTION_P2_DURATION,
} from "./notion-cli/NotionP2BusinessOs";
import {
  NotionP3CliUnlock,
  DURATION_IN_FRAMES as NOTION_P3_DURATION,
} from "./notion-cli/NotionP3CliUnlock";
import {
  NotionP4AgentRuns,
  DURATION_IN_FRAMES as NOTION_P4_DURATION,
} from "./notion-cli/NotionP4AgentRuns";
import {
  NotionP5Workers,
  DURATION_IN_FRAMES as NOTION_P5_DURATION,
} from "./notion-cli/NotionP5Workers";
import {
  NotionP6RunBusiness,
  DURATION_IN_FRAMES as NOTION_P6_DURATION,
} from "./notion-cli/NotionP6RunBusiness";

import {
  ArcadsDontTouchTimeline,
  ARCADS_DTT_DURATION,
} from "./arcads/ArcadsDontTouchTimeline";
import {
  ArcadsOmniFlashSq,
  ARCADS_OMNI_DURATION,
} from "./arcads/ArcadsOmniFlashSq";
import {
  ArcadsOmniXSq,
  ARCADS_OMNIX_DURATION,
} from "./arcads/ArcadsOmniXSq";
import {
  TvP1RebuildAd,
  DURATION_IN_FRAMES as TV_P1_DURATION,
} from "./topview/TvP1RebuildAd";
import {
  TvP2PasteAd,
  DURATION_IN_FRAMES as TV_P2_DURATION,
} from "./topview/TvP2PasteAd";
import {
  TvP3Mcp,
  DURATION_IN_FRAMES as TV_P3_DURATION,
} from "./topview/TvP3Mcp";
import {
  TvP4Platforms,
  DURATION_IN_FRAMES as TV_P4_DURATION,
} from "./topview/TvP4Platforms";
import {
  TvP5Avatar,
  DURATION_IN_FRAMES as TV_P5_DURATION,
} from "./topview/TvP5Avatar";
import {
  TvP6Models,
  DURATION_IN_FRAMES as TV_P6_DURATION,
} from "./topview/TvP6Models";
// --- Lovable x Wispr Flow series (Aug 2026, LIAM WHITE, real app captures) --
import {
  LwP1Hook,
  DURATION_IN_FRAMES as LW_P1_DURATION,
} from "./lovable/LwP1Hook";
import {
  LwP2VoiceDump,
  DURATION_IN_FRAMES as LW_P2_DURATION,
} from "./lovable/LwP2VoiceDump";
import {
  LwP3OpenLovable,
  DURATION_IN_FRAMES as LW_P3_DURATION,
} from "./lovable/LwP3OpenLovable";
import {
  LwP4FourThings,
  DURATION_IN_FRAMES as LW_P4_DURATION,
} from "./lovable/LwP4FourThings";
import {
  LwP5CleansUp,
  DURATION_IN_FRAMES as LW_P5_DURATION,
} from "./lovable/LwP5CleansUp";
import {
  LwP6FeelsOff,
  DURATION_IN_FRAMES as LW_P6_DURATION,
} from "./lovable/LwP6FeelsOff";
import {
  LwP7Partnered,
  DURATION_IN_FRAMES as LW_P7_DURATION,
} from "./lovable/LwP7Partnered";
import {
  LwP8TypingVsTalking,
  DURATION_IN_FRAMES as LW_P8_DURATION,
} from "./lovable/LwP8TypingVsTalking";

import {
  PoP1ZeroEmployees,
  DURATION_IN_FRAMES as PO_P1_DURATION,
} from "./polsia/PoP1ZeroEmployees";
import {
  PoP2NameReveal,
  DURATION_IN_FRAMES as PO_P2_DURATION,
} from "./polsia/PoP2NameReveal";
import {
  PoP3IdeaToAgents,
  DURATION_IN_FRAMES as PO_P3_DURATION,
} from "./polsia/PoP3IdeaToAgents";
import {
  PoP4WhileYouSleep,
  DURATION_IN_FRAMES as PO_P4_DURATION,
} from "./polsia/PoP4WhileYouSleep";
import {
  PoP5RunAds,
  DURATION_IN_FRAMES as PO_P5_DURATION,
} from "./polsia/PoP5RunAds";
import {
  PoP6WatchLive,
  DURATION_IN_FRAMES as PO_P6_DURATION,
} from "./polsia/PoP6WatchLive";
import {
  PoP7FortyNine,
  DURATION_IN_FRAMES as PO_P7_DURATION,
} from "./polsia/PoP7FortyNine";
// --- Runable x Ahmed carousel reel (Aug 2026, real Runable UI) ------------
import {
  RnP1MonthInADay,
  DURATION_IN_FRAMES as RNP1MONTHINADAY_DURATION,
} from "./runable/RnP1MonthInADay";
import {
  RnP2AgentMode,
  DURATION_IN_FRAMES as RNP2AGENTMODE_DURATION,
} from "./runable/RnP2AgentMode";
import {
  RnP3AsksAndRemembers,
  DURATION_IN_FRAMES as RNP3ASKSANDREMEMBERS_DURATION,
} from "./runable/RnP3AsksAndRemembers";
import {
  RnP4AsksBeforeBuilds,
  DURATION_IN_FRAMES as RNP4ASKSBEFOREBUILDS_DURATION,
} from "./runable/RnP4AsksBeforeBuilds";
import {
  RnP5BuildsWhileYouWatch,
  DURATION_IN_FRAMES as RNP5BUILDSWHILEYOUWATCH_DURATION,
} from "./runable/RnP5BuildsWhileYouWatch";
import {
  RnP6TenSlides,
  DURATION_IN_FRAMES as RNP6TENSLIDES_DURATION,
} from "./runable/RnP6TenSlides";
import {
  RnP7StackedThirty,
  DURATION_IN_FRAMES as RNP7STACKEDTHIRTY_DURATION,
} from "./runable/RnP7StackedThirty";
import {
  RnP8RecurringSchedule,
  DURATION_IN_FRAMES as RNP8RECURRINGSCHEDULE_DURATION,
} from "./runable/RnP8RecurringSchedule";
import {
  RnP9OneAgent,
  DURATION_IN_FRAMES as RNP9ONEAGENT_DURATION,
} from "./runable/RnP9OneAgent";
// --- Liam x Runable GROW reel (Aug 2026, LIAM WHITE + real Grow UI) --------
import {
  RgP1HundredBucks,
  DURATION_IN_FRAMES as RGP1HUNDREDBUCKS_DURATION,
} from "./rgrow/RgP1HundredBucks";
import {
  RgP2OnePrompt,
  DURATION_IN_FRAMES as RGP2ONEPROMPT_DURATION,
} from "./rgrow/RgP2OnePrompt";
import {
  RgP3MillionDollars,
  DURATION_IN_FRAMES as RGP3MILLIONDOLLARS_DURATION,
} from "./rgrow/RgP3MillionDollars";
import {
  RgP4RunableGrow,
  DURATION_IN_FRAMES as RGP4RUNABLEGROW_DURATION,
} from "./rgrow/RgP4RunableGrow";
import {
  RgP5MetaGoogleAds,
  DURATION_IN_FRAMES as RGP5METAGOOGLEADS_DURATION,
} from "./rgrow/RgP5MetaGoogleAds";
import {
  RgP6ColdOutreach,
  DURATION_IN_FRAMES as RGP6COLDOUTREACH_DURATION,
} from "./rgrow/RgP6ColdOutreach";
import {
  RgP7HundredFree,
  DURATION_IN_FRAMES as RGP7HUNDREDFREE_DURATION,
} from "./rgrow/RgP7HundredFree";
import {
  RgP8SpotsGone,
  DURATION_IN_FRAMES as RGP8SPOTSGONE_DURATION,
} from "./rgrow/RgP8SpotsGone";

// --- Bennett x Runable GROW reel (Aug 2026, Merydian dark) ---------------
import {
  BgP1OnePersonAgency,
  DURATION_IN_FRAMES as BGP1ONEPERSONAGENCY_DURATION,
} from "./bgrow/BgP1OnePersonAgency";
import {
  BgP2WholeTeam,
  DURATION_IN_FRAMES as BGP2WHOLETEAM_DURATION,
} from "./bgrow/BgP2WholeTeam";
import {
  BgP3RunableGrow,
  DURATION_IN_FRAMES as BGP3RUNABLEGROW_DURATION,
} from "./bgrow/BgP3RunableGrow";
import {
  BgP4SiteAndBudget,
  DURATION_IN_FRAMES as BGP4SITEANDBUDGET_DURATION,
} from "./bgrow/BgP4SiteAndBudget";
import {
  BgP5CampaignsSideBySide,
  DURATION_IN_FRAMES as BGP5CAMPAIGNSSIDEBYSIDE_DURATION,
} from "./bgrow/BgP5CampaignsSideBySide";
import {
  BgP6MillionGiveaway,
  DURATION_IN_FRAMES as BGP6MILLIONGIVEAWAY_DURATION,
} from "./bgrow/BgP6MillionGiveaway";
import {
  BgP7SpotsGone,
  DURATION_IN_FRAMES as BGP7SPOTSGONE_DURATION,
} from "./bgrow/BgP7SpotsGone";
import {
  KsP1BuildMeAnAgent,
  DURATION_IN_FRAMES as KSP1_DURATION,
} from "./kshorts/KsP1BuildMeAnAgent";
import {
  KsP2Insane,
  DURATION_IN_FRAMES as KSP2_DURATION,
} from "./kshorts/KsP2Insane";
import {
  KsP3UsuallyIdHave,
  DURATION_IN_FRAMES as KSP3_DURATION,
} from "./kshorts/KsP3UsuallyIdHave";
import {
  KsP4HeresExactlyWhat,
  DURATION_IN_FRAMES as KSP4_DURATION,
} from "./kshorts/KsP4HeresExactlyWhat";
import {
  KsP5WroteItsOwnInstructions,
  DURATION_IN_FRAMES as KSP5_DURATION,
} from "./kshorts/KsP5WroteItsOwnInstructions";
import {
  KsP6FoundTheViralMoments,
  DURATION_IN_FRAMES as KSP6_DURATION,
} from "./kshorts/KsP6FoundTheViralMoments";
import {
  KsP7PutTheCaptionsOn,
  DURATION_IN_FRAMES as KSP7_DURATION,
} from "./kshorts/KsP7PutTheCaptionsOn";
import {
  KsP8AFullDayOfEditing,
  DURATION_IN_FRAMES as KSP8_DURATION,
} from "./kshorts/KsP8AFullDayOfEditing";
import {
  KsP9NotJustYouTube,
  DURATION_IN_FRAMES as KSP9_DURATION,
} from "./kshorts/KsP9NotJustYouTube";


export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ---------- Polsia series (Aug 2026, LIAM WHITE editorial) ---------- */}
      <Composition
        id="PoP1ZeroEmployees"
        component={PoP1ZeroEmployees}
        durationInFrames={PO_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="PoP2NameReveal"
        component={PoP2NameReveal}
        durationInFrames={PO_P2_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="PoP3IdeaToAgents"
        component={PoP3IdeaToAgents}
        durationInFrames={PO_P3_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PoP4WhileYouSleep"
        component={PoP4WhileYouSleep}
        durationInFrames={PO_P4_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PoP5RunAds"
        component={PoP5RunAds}
        durationInFrames={PO_P5_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PoP6WatchLive"
        component={PoP6WatchLive}
        durationInFrames={PO_P6_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PoP7FortyNine"
        component={PoP7FortyNine}
        durationInFrames={PO_P7_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ------- Lovable x Wispr Flow series (Aug 2026, LIAM WHITE) ------- */}
      <Composition
        id="LwP1Hook"
        component={LwP1Hook}
        durationInFrames={LW_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="LwP2VoiceDump"
        component={LwP2VoiceDump}
        durationInFrames={LW_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LwP3OpenLovable"
        component={LwP3OpenLovable}
        durationInFrames={LW_P3_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LwP4FourThings"
        component={LwP4FourThings}
        durationInFrames={LW_P4_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="LwP5CleansUp"
        component={LwP5CleansUp}
        durationInFrames={LW_P5_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="LwP6FeelsOff"
        component={LwP6FeelsOff}
        durationInFrames={LW_P6_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LwP7Partnered"
        component={LwP7Partnered}
        durationInFrames={LW_P7_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="LwP8TypingVsTalking"
        component={LwP8TypingVsTalking}
        durationInFrames={LW_P8_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ---------------- Topview series (Aug 2026, DARK) ---------------- */}
      <Composition
        id="TvP1RebuildAd"
        component={TvP1RebuildAd}
        durationInFrames={TV_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TvP2PasteAd"
        component={TvP2PasteAd}
        durationInFrames={TV_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TvP3Mcp"
        component={TvP3Mcp}
        durationInFrames={TV_P3_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TvP4Platforms"
        component={TvP4Platforms}
        durationInFrames={TV_P4_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TvP5Avatar"
        component={TvP5Avatar}
        durationInFrames={TV_P5_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TvP6Models"
        component={TvP6Models}
        durationInFrames={TV_P6_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ---------------- Notion CLI series (Aug 2026, WHITE) ---------------- */}
      <Composition
        id="NotionP1PerfectTrap"
        component={NotionP1PerfectTrap}
        durationInFrames={NOTION_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="NotionP2BusinessOs"
        component={NotionP2BusinessOs}
        durationInFrames={NOTION_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NotionP3CliUnlock"
        component={NotionP3CliUnlock}
        durationInFrames={NOTION_P3_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="NotionP4AgentRuns"
        component={NotionP4AgentRuns}
        durationInFrames={NOTION_P4_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NotionP5Workers"
        component={NotionP5Workers}
        durationInFrames={NOTION_P5_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NotionP6RunBusiness"
        component={NotionP6RunBusiness}
        durationInFrames={NOTION_P6_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ------ Claude-Chat (Aug 2026, PAPER + real Claude app) ------ */}
      <Composition
        id="CcVoxReel"
        component={CcVoxReel}
        durationInFrames={CC_VOX_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ------ Higgs-Chat series (Aug 2026, PAPER + LIME) ------ */}
      <Composition
        id="HcP1Hook"
        component={HcP1Hook}
        durationInFrames={HC_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HcP2Connect"
        component={HcP2Connect}
        durationInFrames={HC_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HcP3Plugins"
        component={HcP3Plugins}
        durationInFrames={HC_P3_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HcP4Upload"
        component={HcP4Upload}
        durationInFrames={HC_P4_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HcP5Animate"
        component={HcP5Animate}
        durationInFrames={HC_P5_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HcP6UsefulPart"
        component={HcP6UsefulPart}
        durationInFrames={HC_P6_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ------ Google Tools series (Aug 2026, PAPER + GOOGLE BLUE) ------ */}
      <Composition
        id="GtP1Hook"
        component={GtP1Hook}
        durationInFrames={GT_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="GtP2Pomelli"
        component={GtP2Pomelli}
        durationInFrames={GT_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GtP3Stitch"
        component={GtP3Stitch}
        durationInFrames={GT_P3_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GtP4Opal"
        component={GtP4Opal}
        durationInFrames={GT_P4_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GtP5Antigravity"
        component={GtP5Antigravity}
        durationInFrames={GT_P5_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GtP6Mixboard"
        component={GtP6Mixboard}
        durationInFrames={GT_P6_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GtP7FiveFree"
        component={GtP7FiveFree}
        durationInFrames={GT_P7_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ------------ Scrapy series (Aug 2026, PAPER + TEAL) ------------ */}
      <Composition
        id="ScrHookNoApi"
        component={ScrHookNoApi}
        durationInFrames={SCR_HOOK_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScrRepoStars"
        component={ScrRepoStars}
        durationInFrames={SCR_STARS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ScrOneFileData"
        component={ScrOneFileData}
        durationInFrames={SCR_ONEFILE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScrHandlesHardParts"
        component={ScrHandlesHardParts}
        durationInFrames={SCR_HARD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScrPublicDataRules"
        component={ScrPublicDataRules}
        durationInFrames={SCR_RULES_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ScrUseCases"
        component={ScrUseCases}
        durationInFrames={SCR_USES_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ------------ screenshot-to-code series (Aug 2026, PAPER) ------------ */}
      <Composition
        id="S2cHookOnlyTool"
        component={S2cHookOnlyTool}
        durationInFrames={S2C_HOOK_A_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="S2cHookThreeInputs"
        component={S2cHookThreeInputs}
        durationInFrames={S2C_HOOK_B_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="S2cRepoStars"
        component={S2cRepoStars}
        durationInFrames={S2C_STARS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="S2cSelfCheck"
        component={S2cSelfCheck}
        durationInFrames={S2C_CHECK_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="S2cCapabilities"
        component={S2cCapabilities}
        durationInFrames={S2C_CAP_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="S2cOneLineSetup"
        component={S2cOneLineSetup}
        durationInFrames={S2C_SETUP_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ---------------- Graphify series (Aug 2026, DARK) ---------------- */}
      <Composition
        id="GfxGrepToGraph"
        component={GfxGrepToGraph}
        durationInFrames={GFX_GREP_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="GfxRepoStars"
        component={GfxRepoStars}
        durationInFrames={GFX_STARS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GfxMapNotReread"
        component={GfxMapNotReread}
        durationInFrames={GFX_MAP_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GfxEveryFileType"
        component={GfxEveryFileType}
        durationInFrames={GFX_TYPES_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GfxLocalSharedMap"
        component={GfxLocalSharedMap}
        durationInFrames={GFX_LOCAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ---------------- OpenSEO series (Aug 2026) ---------------- */}
      <Composition
        id="SeoDeptClaude"
        component={SeoDeptClaude}
        durationInFrames={SEO_DEPT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SeoHookTwoAnswers"
        component={SeoHookTwoAnswers}
        durationInFrames={SEO_HOOK_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SeoRepoStars"
        component={SeoRepoStars}
        durationInFrames={SEO_STARS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SeoCostAnchor"
        component={SeoCostAnchor}
        durationInFrames={SEO_COST_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SeoMcpPlug"
        component={SeoMcpPlug}
        durationInFrames={SEO_MCP_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SeoSixWorkflows"
        component={SeoSixWorkflows}
        durationInFrames={SEO_SIX_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="OneClearAngle"
        component={OneClearAngle}
        durationInFrames={ONECLEAR_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PolloHeartbeatVerdict"
        component={PolloHeartbeatVerdict}
        durationInFrames={POLLOHEARTBEAT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FindProblemFirst"
        component={FindProblemFirst}
        durationInFrames={FINDPROBLEM_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ThreeWrongFixes"
        component={ThreeWrongFixes}
        durationInFrames={THREEFIXES_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="StopFixingWrongPart"
        component={StopFixingWrongPart}
        durationInFrames={WRONGPART_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishVoiceCallOrb"
        component={FishVoiceCallOrb}
        durationInFrames={FISHORB_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ hasAudio: false, handoffFrame: 128 }}
        calculateMetadata={calculateFishOrbMetadata}
      />
      <Composition
        id="FishCampaignOrb"
        component={FishCampaignOrb}
        durationInFrames={FISHCAMPAIGN_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ audioFrames: 152 }}
        calculateMetadata={calculateFishCampaignMetadata}
      />
      <Composition
        id="FishSpeaksAsItWrites"
        component={FishSpeaksAsItWrites}
        durationInFrames={FISHSPEAKS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishVoiceBreaks"
        component={FishVoiceBreaks}
        durationInFrames={FISHVOICEBREAKS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishFlatDelivery"
        component={FishFlatDelivery}
        durationInFrames={FISHFLATDELIVERY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishPitchRibbon"
        component={FishPitchRibbon}
        durationInFrames={FISHPITCHRIBBON_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RunSideBySide"
        component={RunSideBySide}
        durationInFrames={RUNSIDEBYSIDE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="NeverPromptThis"
        component={NeverPromptThis}
        durationInFrames={NEVERPROMPT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ClipCard"
        component={ClipCard}
        durationInFrames={CLIPCARD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ResultCard"
        component={ClipCard}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ src: "result-fce5fc3d.mp4" }}
      />
      <Composition
        id="LandTheClient"
        component={LandTheClient}
        durationInFrames={LANDCLIENT_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="VidMuseFormula"
        component={VidMuseFormula}
        durationInFrames={VIDMUSE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="KimiTraceableSources"
        component={KimiTraceableSources}
        durationInFrames={KIMISOURCES_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="KimiBetterSlides"
        component={KimiBetterSlides}
        durationInFrames={KIMISLIDES_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ShowDontDescribe"
        component={ShowDontDescribe}
        durationInFrames={SHOWDONT_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="StyleMatchTransfer"
        component={StyleMatchTransfer}
        durationInFrames={STYLEMATCH_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AiVideoGenScan"
        component={AiVideoGenScan}
        durationInFrames={AIVIDEOGEN_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SynapsePromptScroll"
        component={SynapsePromptScroll}
        durationInFrames={SYNAPSE_PROMPT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HiggsfieldThreeAds"
        component={HiggsfieldThreeAds}
        durationInFrames={HIGGSTHREE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HiggsfieldAdsSwipe"
        component={HiggsfieldAdsSwipe}
        durationInFrames={HIGGSADS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BrandsPayingMonthly"
        component={BrandsPayingMonthly}
        durationInFrames={PAYINGMONTHLY_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="FableFiveBack"
        component={FableFiveBack}
        durationInFrames={FABLEFIVE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HiggsSelfDestruct"
        component={HiggsSelfDestruct}
        durationInFrames={HIGGSDESTRUCT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HiggsConnectorSwitch"
        component={HiggsConnectorSwitch}
        durationInFrames={HIGGSCONNECT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HiggsModelsFree"
        component={HiggsModelsFree}
        durationInFrames={HIGGSFREE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HiggsPhotoToAd"
        component={HiggsPhotoToAd}
        durationInFrames={HIGGSPHOTOAD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CreatifyPromoted"
        component={CreatifyPromoted}
        durationInFrames={PROMOTED_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="BrandsThatWin"
        component={BrandsThatWin}
        durationInFrames={BRANDSWIN_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="AgencyStepsPipeline"
        component={AgencyStepsPipeline}
        durationInFrames={AGENCYSTEPS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RunTheCampaign"
        component={RunTheCampaign}
        durationInFrames={CAMPAIGN_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RunTheCampaignNoText"
        component={RunTheCampaign}
        durationInFrames={CAMPAIGN_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ showHeader: false }}
      />
      <Composition
        id="ItDoesNotStop"
        component={ItDoesNotStop}
        durationInFrames={ITDOESNOTSTOP_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="CreatifyKilledAgencies"
        component={CreatifyKilledAgencies}
        durationInFrames={CREATIFY_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="CreatifyRolesReplaced"
        component={CreatifyRolesReplaced}
        durationInFrames={ROLES_DURATION}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="SubmagicAbsorption"
        component={SubmagicAbsorption}
        durationInFrames={168}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="SignalVsVanity"
        component={SignalVsVanity}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PipelineLoop"
        component={PipelineLoop}
        durationInFrames={180}
        fps={30}
        width={1440}
        height={1080}
      />
      <Composition
        id="NvidiaFreeApi"
        component={NvidiaFreeApi}
        durationInFrames={NVIDIA_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishAudioSavedAgents"
        component={FishAudioSavedAgents}
        durationInFrames={FISHAUDIO_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishAudioRevived"
        component={FishAudioRevived}
        durationInFrames={FISHREVIVED_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishAudioUseCases"
        component={FishAudioUseCases}
        durationInFrames={FISHUSECASES_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PullsOutProblems"
        component={PullsOutProblems}
        durationInFrames={PULLSOUT_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="VidmuseWhiteFrame"
        component={VidmuseWhiteFrame}
        durationInFrames={VIDMUSEFRAME_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishDetectorFooled"
        component={FishDetectorFooled}
        durationInFrames={FISHDETECTOR_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ProjectorV2WhiteFrame"
        component={ProjectorV2WhiteFrame}
        durationInFrames={PROJECTORV2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishTensionSwitch"
        component={FishTensionSwitch}
        durationInFrames={FISHTENSION_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishEmpathyUseCases"
        component={FishEmpathyUseCases}
        durationInFrames={FISHEMPATHY_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishUnlimitedDirections"
        component={FishUnlimitedDirections}
        durationInFrames={FISHUNLIMITED_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishFreeApiAccess"
        component={FishFreeApiAccess}
        durationInFrames={FISHFREEAPI_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SnymaScriptStudio"
        component={SnymaScriptStudio}
        durationInFrames={SNYMA_STUDIO_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishVoiceStudioRide"
        component={FishVoiceStudioRide}
        durationInFrames={FISHVOICERIDE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="SnymaStudioExplainer"
        component={SnymaStudioExplainer}
        durationInFrames={SNYMA_EXPLAINER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BluehostHermesV"
        component={BluehostHermesV}
        durationInFrames={BLUEHOST_V_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BluehostHermesH"
        component={BluehostHermesH}
        durationInFrames={BLUEHOST_H_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FishAgentInFive"
        component={FishAgentInFive}
        durationInFrames={FISHAGENTFIVE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishVoiceBlob"
        component={FishVoiceBlob}
        durationInFrames={FISHVOICEBLOB_DURATION}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          hasAudio: false,
          audioFrames: 104,
          src: "fish-audio/good-evening-victor.mp3",
        }}
        calculateMetadata={calculateVoiceBlobMetadata}
      />
      <Composition
        id="FishVoiceBlobAfterHook"
        component={FishVoiceBlob}
        durationInFrames={FISHVOICEBLOB_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          hasAudio: false,
          audioFrames: 244,
          src: "fish-audio/ill-set-up-a-call.mp3",
        }}
        calculateMetadata={calculateVoiceBlobMetadata}
      />
      <Composition
        id="FishWholeBuild"
        component={FishWholeBuild}
        durationInFrames={FISHWHOLEBUILD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishSassyDirect"
        component={FishSassyDirect}
        durationInFrames={FISHSASSY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishEmotionAnswer"
        component={FishEmotionAnswer}
        durationInFrames={FISHEMOTIONANSWER_DURATION}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ hasAudio: false, audioFrames: 96 }}
        calculateMetadata={calculateEmotionAnswerMetadata}
      />
      <Composition
        id="FishCloneConnects"
        component={FishCloneConnects}
        durationInFrames={FISHCLONECONNECTS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishCloneWiredIn"
        component={FishCloneWiredIn}
        durationInFrames={FISHCLONEWIRED_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishAskTheBrain"
        component={FishAskTheBrain}
        durationInFrames={FISHASKBRAIN_DURATION}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ hasAudio: false, audioFrames: 123 }}
        calculateMetadata={calculateAskTheBrainMetadata}
      />
      <Composition
        id="FishBrainTalksBack"
        component={FishBrainTalksBack}
        durationInFrames={FISHTALKSBACK_DURATION}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ hasAudio: false, audioFrames: 165 }}
        calculateMetadata={calculateBrainTalksBackMetadata}
      />
      <Composition
        id="FishSecondBrainTree"
        component={FishSecondBrainTree}
        durationInFrames={FISHBRAINTREE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishSecondBrain"
        component={FishSecondBrain}
        durationInFrames={FISHSECONDBRAIN_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishCloneToBrain"
        component={FishCloneToBrain}
        durationInFrames={FISHCLONETOBRAIN_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishReadsEverything"
        component={FishReadsEverything}
        durationInFrames={FISHREADSEVERYTHING_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishFramedAd"
        component={FishFramedAd}
        durationInFrames={FISHFRAMEDAD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishSameFolder"
        component={FishSameFolder}
        durationInFrames={FISHSAMEFOLDER_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishHooksDrop"
        component={FishHooksDrop}
        durationInFrames={FISHHOOKS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishTenAds"
        component={FishTenAds}
        durationInFrames={FISHTENADS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishClaudeEmotionTags"
        component={FishClaudeEmotionTags}
        durationInFrames={FISHEMOTIONTAGS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FishHookWins"
        component={FishHookWins}
        durationInFrames={FISHHOOKWINS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishFlopNewAngle"
        component={FishFlopNewAngle}
        durationInFrames={FISHFLOPANGLE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FishWatchAdWhiteFrame"
        component={FishWatchAdWhiteFrame}
        durationInFrames={FISHWATCHAD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BluehostWantPainSq"
        component={BluehostWantPainSq}
        durationInFrames={WANTPAIN_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="BluehostWantPainH"
        component={BluehostWantPainH}
        durationInFrames={WANTPAIN_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ArcadsDontTouchTimeline"
        component={ArcadsDontTouchTimeline}
        durationInFrames={ARCADS_DTT_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ArcadsOmniFlashSq"
        component={ArcadsOmniFlashSq}
        durationInFrames={ARCADS_OMNI_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="ArcadsOmniXSq"
        component={ArcadsOmniXSq}
        durationInFrames={ARCADS_OMNIX_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ---------------- Teamily series (Aug 2026, PAPER + real Teamily app) ---------------- */}
      <Composition
        id="TmP1KilledChatbot"
        component={TmP1KilledChatbot}
        durationInFrames={TM_P1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TmP2AlreadyKnow"
        component={TmP2AlreadyKnow}
        durationInFrames={TM_P2_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TmP3InsideMessenger"
        component={TmP3InsideMessenger}
        durationInFrames={TM_P3_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TmP4FeedTakeOne"
        component={TmP4FeedTakeOne}
        durationInFrames={TM_P4_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TmP5TagAndType"
        component={TmP5TagAndType}
        durationInFrames={TM_P5_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TmP6IdeaToPage"
        component={TmP6IdeaToPage}
        durationInFrames={TM_P6_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TmP7FeedFullOfThese"
        component={TmP7FeedFullOfThese}
        durationInFrames={TM_P7_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F4P01EveryonesBuilding"
        component={F4P01EveryonesBuilding}
        durationInFrames={F4P01EVERYONESBUILDING_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P02TwoProposals"
        component={F4P02TwoProposals}
        durationInFrames={F4P02TWOPROPOSALS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F4P03ProblemReadOnly"
        component={F4P03ProblemReadOnly}
        durationInFrames={F4P03PROBLEMREADONLY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P04DashboardWorthNothing"
        component={F4P04DashboardWorthNothing}
        durationInFrames={F4P04DASHBOARDWORTHNOTHING_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P05WiredS21Pro"
        component={F4P05WiredS21Pro}
        durationInFrames={F4P05WIREDS21PRO_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F4P06NowWatch"
        component={F4P06NowWatch}
        durationInFrames={F4P06NOWWATCH_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P07HarveyOpenSince"
        component={F4P07HarveyOpenSince}
        durationInFrames={F4P07HARVEYOPENSINCE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F4P08NotARobot"
        component={F4P08NotARobot}
        durationInFrames={F4P08NOTAROBOT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P09EveryBranchVoice"
        component={F4P09EveryBranchVoice}
        durationInFrames={F4P09EVERYBRANCHVOICE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F4P10OpsWhatMissed"
        component={F4P10OpsWhatMissed}
        durationInFrames={F4P10OPSWHATMISSED_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P11OnboardingFine"
        component={F4P11OnboardingFine}
        durationInFrames={F4P11ONBOARDINGFINE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F4P12HeresTheUnlock"
        component={F4P12HeresTheUnlock}
        durationInFrames={F4P12HERESTHEUNLOCK_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P01GaveThemVoices"
        component={F5P01GaveThemVoices}
        durationInFrames={F5P01_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P02YourPricingIsWrong"
        component={F5P02YourPricingIsWrong}
        durationInFrames={F5P02_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P03ThreeClaudeSkills"
        component={F5P03ThreeClaudeSkills}
        durationInFrames={F5P03_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P04ThatsHomework"
        component={F5P04ThatsHomework}
        durationInFrames={F5P04_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P05BuiltThreeVoices"
        component={F5P05BuiltThreeVoices}
        durationInFrames={F5P05_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P06WatchWhatHappens"
        component={F5P06WatchWhatHappens}
        durationInFrames={F5P06_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P07ProposalFifteenK"
        component={F5P07ProposalFifteenK}
        durationInFrames={F5P07_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P08DontRaiseTheRetainer"
        component={F5P08DontRaiseTheRetainer}
        durationInFrames={F5P08_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P09CutTheDeckInHalf"
        component={F5P09CutTheDeckInHalf}
        durationInFrames={F5P09_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P10AskABetterQuestion"
        component={F5P10AskABetterQuestion}
        durationInFrames={F5P10_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P11ElevenSeconds"
        component={F5P11ElevenSeconds}
        durationInFrames={F5P11_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P12ARoomNotATool"
        component={F5P12ARoomNotATool}
        durationInFrames={F5P12_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="F5P13NumberOneBlindTests"
        component={F5P13NumberOneBlindTests}
        durationInFrames={F5P13_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="F5P14FreeThroughNovember"
        component={F5P14FreeThroughNovember}
        durationInFrames={F5P14_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RnP1MonthInADay"
        component={RnP1MonthInADay}
        durationInFrames={RNP1MONTHINADAY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RnP2AgentMode"
        component={RnP2AgentMode}
        durationInFrames={RNP2AGENTMODE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RnP3AsksAndRemembers"
        component={RnP3AsksAndRemembers}
        durationInFrames={RNP3ASKSANDREMEMBERS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RnP4AsksBeforeBuilds"
        component={RnP4AsksBeforeBuilds}
        durationInFrames={RNP4ASKSBEFOREBUILDS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RnP5BuildsWhileYouWatch"
        component={RnP5BuildsWhileYouWatch}
        durationInFrames={RNP5BUILDSWHILEYOUWATCH_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RnP6TenSlides"
        component={RnP6TenSlides}
        durationInFrames={RNP6TENSLIDES_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RnP7StackedThirty"
        component={RnP7StackedThirty}
        durationInFrames={RNP7STACKEDTHIRTY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RnP8RecurringSchedule"
        component={RnP8RecurringSchedule}
        durationInFrames={RNP8RECURRINGSCHEDULE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RnP9OneAgent"
        component={RnP9OneAgent}
        durationInFrames={RNP9ONEAGENT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RgP1HundredBucks"
        component={RgP1HundredBucks}
        durationInFrames={RGP1HUNDREDBUCKS_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RgP2OnePrompt"
        component={RgP2OnePrompt}
        durationInFrames={RGP2ONEPROMPT_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RgP3MillionDollars"
        component={RgP3MillionDollars}
        durationInFrames={RGP3MILLIONDOLLARS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RgP4RunableGrow"
        component={RgP4RunableGrow}
        durationInFrames={RGP4RUNABLEGROW_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RgP5MetaGoogleAds"
        component={RgP5MetaGoogleAds}
        durationInFrames={RGP5METAGOOGLEADS_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RgP6ColdOutreach"
        component={RgP6ColdOutreach}
        durationInFrames={RGP6COLDOUTREACH_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="RgP7HundredFree"
        component={RgP7HundredFree}
        durationInFrames={RGP7HUNDREDFREE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RgP8SpotsGone"
        component={RgP8SpotsGone}
        durationInFrames={RGP8SPOTSGONE_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="BgP1OnePersonAgency"
        component={BgP1OnePersonAgency}
        durationInFrames={BGP1ONEPERSONAGENCY_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="BgP2WholeTeam"
        component={BgP2WholeTeam}
        durationInFrames={BGP2WHOLETEAM_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BgP3RunableGrow"
        component={BgP3RunableGrow}
        durationInFrames={BGP3RUNABLEGROW_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BgP4SiteAndBudget"
        component={BgP4SiteAndBudget}
        durationInFrames={BGP4SITEANDBUDGET_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BgP5CampaignsSideBySide"
        component={BgP5CampaignsSideBySide}
        durationInFrames={BGP5CAMPAIGNSSIDEBYSIDE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BgP6MillionGiveaway"
        component={BgP6MillionGiveaway}
        durationInFrames={BGP6MILLIONGIVEAWAY_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BgP7SpotsGone"
        component={BgP7SpotsGone}
        durationInFrames={BGP7SPOTSGONE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
          <Composition
        id="KsP1BuildMeAnAgent"
        component={KsP1BuildMeAnAgent}
        durationInFrames={KSP1_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP2Insane"
        component={KsP2Insane}
        durationInFrames={KSP2_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP3UsuallyIdHave"
        component={KsP3UsuallyIdHave}
        durationInFrames={KSP3_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP4HeresExactlyWhat"
        component={KsP4HeresExactlyWhat}
        durationInFrames={KSP4_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP5WroteItsOwnInstructions"
        component={KsP5WroteItsOwnInstructions}
        durationInFrames={KSP5_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP6FoundTheViralMoments"
        component={KsP6FoundTheViralMoments}
        durationInFrames={KSP6_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP7PutTheCaptionsOn"
        component={KsP7PutTheCaptionsOn}
        durationInFrames={KSP7_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP8AFullDayOfEditing"
        component={KsP8AFullDayOfEditing}
        durationInFrames={KSP8_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KsP9NotJustYouTube"
        component={KsP9NotJustYouTube}
        durationInFrames={KSP9_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
</>

  );
};
