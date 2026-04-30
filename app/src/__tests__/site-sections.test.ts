import { describe, expect,it } from "vitest";

import { PRODUCTION_SITE_ORIGIN } from "@/lib/brandAssetFilenames";
import { CET_CONTRACT_ADDRESS as CET_CONTRACT } from "@/lib/cetContract";
import { DEDUST_POOL_ADDRESS, DEDUST_SWAP_URL } from "@/lib/dedustUrls";
import { NAV_PRIMARY_IN_PAGE } from "@/lib/navPrimaryHrefs";

import translations from "../i18n/translations";

const SITE_ROOT = `${PRODUCTION_SITE_ORIGIN}/`;

// ─── Navigation + section IDs ─────────────────────────────────────────────

const SECTION_IDS = [
  "main-content",
  "nova-app",
  "staking",
  "roadmap",
  "team",
  "competition",
  "network-pulse",
  "how-to-buy",
  "stats",
  "authority-trust",
  "ecosystem-index",
  "resources",
  "faq",
  "security",
  "rwa",
  "cet-ai",
  "whitepaper",
];

describe("Navigation + section IDs", () => {
  it("NAV_PRIMARY_IN_PAGE integrity and every hash href maps to a section id", () => {
    expect(NAV_PRIMARY_IN_PAGE).toHaveLength(7);
    const hrefs = NAV_PRIMARY_IN_PAGE.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(NAV_PRIMARY_IN_PAGE.find((i) => i.navKey === "howToBuy")?.href).toBe("#how-to-buy");
    expect(NAV_PRIMARY_IN_PAGE.find((i) => i.navKey === "rwa")?.href).toBe("/rwa");
    expect(NAV_PRIMARY_IN_PAGE.find((i) => i.navKey === "cetAi")?.href).toBe("/cet-ai");

    NAV_PRIMARY_IN_PAGE.forEach((item) => {
      if (!item.href.startsWith("#")) return;
      expect(item.href.slice(1)).toMatch(/^[a-z0-9-]+$/);
      expect(SECTION_IDS).toContain(item.href.slice(1));
    });

    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
  });
});

// ─── FAQSection ─────────────────────────────────────────────────────────────

const enFaq = translations.en.faqContent;

const QUESTION_KEYS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
] as const;

describe("FAQSection", () => {
  it("en content + accordion toggle", () => {
    expect(QUESTION_KEYS).toHaveLength(14);
    const texts = QUESTION_KEYS.map((qk) => enFaq[qk]);
    for (let i = 0; i < QUESTION_KEYS.length; i++) {
      const q = texts[i];
      const qk = QUESTION_KEYS[i];
      expect(typeof q, qk).toBe("string");
      expect(q.length, qk).toBeGreaterThan(10);
      expect(q.endsWith("?"), qk).toBe(true);
    }
    expect(new Set(texts).size).toBe(QUESTION_KEYS.length);
    expect(enFaq.q11.toLowerCase()).toMatch(/fetch|bittensor|singularity/);
    expect(enFaq.q12).toContain("BRAID");
    expect(enFaq.q13).toContain("RAV");
    expect(enFaq.q14).toContain("Zero-Battery");
    expect(enFaq.linkWhitepaper.length).toBeGreaterThan(3);
    expect(enFaq.linkTelegram.length).toBeGreaterThan(3);
    expect(enFaq.linkGithub.length).toBeGreaterThan(3);
    expect(enFaq.linkComparison.length).toBeGreaterThan(3);

    function toggleFaq(openIndex: number | null, i: number): number | null {
      return openIndex === i ? null : i;
    }
    expect(toggleFaq(null, 0)).toBe(0);
    expect(toggleFaq(2, 2)).toBeNull();
    expect(toggleFaq(1, 3)).toBe(3);
    expect(toggleFaq(null, 13)).toBe(13);
  });
});

// ─── RoadmapSection ─────────────────────────────────────────────────────────

type PhaseStatus = "done" | "active" | "upcoming";

interface Phase {
  id: string;
  quarter: string;
  title: string;
  status: PhaseStatus;
  milestones: { text: string }[];
}

const PHASES: Phase[] = [
  {
    id: "q1",
    quarter: "Q1 2025",
    title: "Foundation",
    status: "done",
    milestones: [
      { text: "Token contract deployed on TON mainnet" },
      { text: "Cyberscope smart contract audit completed" },
      { text: "Freshcoins project verification" },
      { text: "KYC process completed for core team" },
    ],
  },
  {
    id: "q2",
    quarter: "Q2 2025",
    title: "Launch",
    status: "done",
    milestones: [
      { text: "DeDust DEX liquidity pool live" },
      { text: "IPFS whitepaper publication" },
      { text: "Landing page and community channels live" },
      { text: "Initial token distribution completed" },
    ],
  },
  {
    id: "q3",
    quarter: "Q3 2025",
    title: "Growth",
    status: "done",
    milestones: [
      { text: "AI-driven precision farming pilot in Puiești" },
      { text: "Developer SDK and API beta release" },
      { text: "ReAct Protocol on-chain reasoning traces" },
      { text: "Governance voting module" },
    ],
  },
  {
    id: "q4",
    quarter: "Q4 2025",
    title: "Scale",
    status: "done",
    milestones: [
      { text: "Next-gen processing units deployment" },
      { text: "Self-Actualization Protocol mainnet" },
      { text: "Cross-chain bridge exploration" },
      { text: "Ecosystem grants program launch" },
    ],
  },
  {
    id: "q1-2026",
    quarter: "Q1 2026",
    title: "Expand",
    status: "done",
    milestones: [
      { text: "Multi-chain liquidity integration completed" },
      { text: "Community governance portal launched" },
      { text: "AI oracle public API v1 released" },
      { text: "Mobile wallet deep-link support deployed" },
    ],
  },
  {
    id: "q2-2026",
    quarter: "Q2 2026+",
    title: "Evolve",
    status: "active",
    milestones: [
      { text: "Decentralized autonomous organization (DAO)" },
      { text: "Cross-chain bridge mainnet launch" },
      { text: "Ecosystem grants program expansion" },
      { text: "Real-world asset (RWA) tokenisation pilot" },
    ],
  },
  {
    id: "q3-2026",
    quarter: "Q3 2026+",
    title: "Transcend",
    status: "upcoming",
    milestones: [
      { text: "AI-to-AI autonomous contract execution" },
      { text: "Solaris Prime mainnet neural mesh" },
      { text: "Global agricultural AI network" },
      { text: "Cross-chain hyper-intelligence protocol" },
    ],
  },
];

function calcProgress(phases: Phase[]): number {
  const done = phases.filter((p) => p.status === "done").length;
  const active = phases.filter((p) => p.status === "active").length;
  return Math.round(((done + active * 0.5) / phases.length) * 100);
}

describe("RoadmapSection", () => {
  it("phase data + progress formula", () => {
    expect(PHASES).toHaveLength(7);
    const ids = PHASES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = PHASES.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);

    const valid: PhaseStatus[] = ["done", "active", "upcoming"];
    PHASES.forEach((p) => {
      expect(p.milestones).toHaveLength(4);
      p.milestones.forEach((m) => expect(m.text.length).toBeGreaterThan(5));
      expect(valid).toContain(p.status);
    });

    const active = PHASES.filter((p) => p.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe("q2-2026");
    expect(PHASES.filter((p) => p.status === "upcoming")).toHaveLength(1);

    const statusOrder = PHASES.map((p) => p.status);
    expect(statusOrder.lastIndexOf("done")).toBeLessThan(statusOrder.indexOf("active"));
    expect(statusOrder.indexOf("active")).toBeLessThan(statusOrder.indexOf("upcoming"));

    const foundation = PHASES.find((p) => p.title === "Foundation")!;
    expect(foundation.milestones.some((m) => m.text.toLowerCase().includes("cyberscope"))).toBe(
      true,
    );
    const transcend = PHASES.find((p) => p.title === "Transcend")!;
    expect(transcend.milestones.some((m) => m.text.toLowerCase().includes("ai-to-ai"))).toBe(
      true,
    );

    const p = calcProgress(PHASES);
    expect(p).toBe(79);
    expect(p).toBeGreaterThan(70);
    expect(p).toBeLessThan(100);
  });
});

// ─── RwaSection ───────────────────────────────────────────────────────────

const RWA_STATS = [
  { label: "Location", value: "Cetățuia, Romania" },
  { label: "Asset Class", value: "Agricultural Land" },
  { label: "AI Integration", value: "Precision Farming" },
  { label: "On-Chain Proof", value: "IPFS + TON L1" },
  { label: "Yield Type", value: "Agricultural + Token" },
  { label: "Token Layer", value: "CET · 9,000 supply" },
];

const RWA_PILLARS = [
  { title: "Tangible Backing", border: "border-emerald-400/20" },
  { title: "On-Chain Transparency", border: "border-solaris-cyan/20" },
  { title: "AI-Optimised Yield", border: "border-solaris-gold/20" },
  { title: "Structural Scarcity", border: "border-purple-400/20" },
];

const IPFS_CID = "bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a";
const IPFS_URL = `https://scarlet-past-walrus-15.mypinata.cloud/ipfs/${IPFS_CID}`;

describe("RwaSection", () => {
  it("stats, pillars, IPFS proof", () => {
    expect(RWA_STATS).toHaveLength(6);
    const labels = RWA_STATS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
    RWA_STATS.forEach((s) => {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.value.length).toBeGreaterThan(0);
    });
    expect(RWA_STATS.find((s) => s.label === "Location")?.value).toBe("Cetățuia, Romania");
    expect(RWA_STATS.find((s) => s.label === "Token Layer")?.value).toContain("9,000");
    const proof = RWA_STATS.find((s) => s.label === "On-Chain Proof");
    expect(proof?.value).toContain("IPFS");
    expect(proof?.value).toContain("TON");

    expect(RWA_PILLARS).toHaveLength(4);
    const titles = RWA_PILLARS.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(RWA_PILLARS.some((p) => p.title === "Tangible Backing")).toBe(true);
    expect(RWA_PILLARS.some((p) => p.title === "AI-Optimised Yield")).toBe(true);
    expect(RWA_PILLARS.some((p) => p.title === "Structural Scarcity")).toBe(true);
    RWA_PILLARS.forEach((p) => expect(p.border).toMatch(/^border-/));

    expect(IPFS_CID).toBe("bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a");
    expect(IPFS_URL).toMatch(/^https:\/\//);
    expect(IPFS_URL).toContain(IPFS_CID);
    expect(IPFS_CID).toMatch(/^bafkrei/);
  });
});

// ─── HowToBuy + sitemap ─────────────────────────────────────────────────────

const HOW_TO_BUY_STEPS = [
  {
    step: "01",
    id: "wallet",
    title: "Get a TON Wallet",
    cta: { label: "Get Tonkeeper ↗", href: "https://tonkeeper.com" },
  },
  {
    step: "02",
    id: "ton",
    title: "Acquire TON",
    cta: { label: "Buy TON on Bybit ↗", href: "https://www.bybit.com" },
  },
  {
    step: "03",
    id: "swap",
    title: "Swap for CET on DeDust",
    cta: { label: "Open DeDust ↗", href: DEDUST_SWAP_URL },
  },
];

const SITEMAP_URLS = [
  SITE_ROOT,
  `${PRODUCTION_SITE_ORIGIN}/#nova-app`,
  `${PRODUCTION_SITE_ORIGIN}/#staking`,
  `${PRODUCTION_SITE_ORIGIN}/#roadmap`,
  `${PRODUCTION_SITE_ORIGIN}/#team`,
  `${PRODUCTION_SITE_ORIGIN}/#competition`,
  `${PRODUCTION_SITE_ORIGIN}/#network-pulse`,
  `${PRODUCTION_SITE_ORIGIN}/#how-to-buy`,
  `${PRODUCTION_SITE_ORIGIN}/#stats`,
  `${PRODUCTION_SITE_ORIGIN}/#authority-trust`,
  `${PRODUCTION_SITE_ORIGIN}/#ecosystem-index`,
  `${PRODUCTION_SITE_ORIGIN}/#security`,
  `${PRODUCTION_SITE_ORIGIN}/#whitepaper`,
  `${PRODUCTION_SITE_ORIGIN}/#resources`,
  `${PRODUCTION_SITE_ORIGIN}/#faq`,
];

describe("HowToBuy + sitemap", () => {
  it("steps, CET/pool addresses, canonical URLs", () => {
    expect(HOW_TO_BUY_STEPS).toHaveLength(3);
    expect(HOW_TO_BUY_STEPS.map((s) => s.step)).toEqual(["01", "02", "03"]);
    const ids = HOW_TO_BUY_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    HOW_TO_BUY_STEPS.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.cta.href).toMatch(/^https:\/\//);
    });
    const swap = HOW_TO_BUY_STEPS[2];
    expect(swap.cta.href).toBe(DEDUST_SWAP_URL);
    expect(swap.cta.href).toContain(CET_CONTRACT);
    expect(HOW_TO_BUY_STEPS[0].cta.href).toContain("tonkeeper.com");
    expect(HOW_TO_BUY_STEPS[0].id).toBe("wallet");
    expect(HOW_TO_BUY_STEPS[2].id).toBe("swap");

    expect(CET_CONTRACT).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(DEDUST_POOL_ADDRESS).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
    expect(CET_CONTRACT).not.toBe(DEDUST_POOL_ADDRESS);
    expect(CET_CONTRACT).toHaveLength(48);
    expect(DEDUST_POOL_ADDRESS).toHaveLength(48);

    expect(SITEMAP_URLS).toHaveLength(15);
    expect(new Set(SITEMAP_URLS).size).toBe(SITEMAP_URLS.length);
    SITEMAP_URLS.forEach((url) => expect(url).toMatch(/^https:\/\//));
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#competition`);
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#network-pulse`);
    expect(SITEMAP_URLS).toContain(`${PRODUCTION_SITE_ORIGIN}/#authority-trust`);
    expect(SITEMAP_URLS[0]).toBe(SITE_ROOT);
    expect(SITEMAP_URLS[0]).not.toContain("#");
  });
});
