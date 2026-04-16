import { useRef, useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import {
  Brain,
  Code2,
  RefreshCw,
  Coins,
  ShieldCheck,
  Download,
  Cpu,
  Zap,
  Lock,
  FileText,
  ChevronDown,
  ChevronUp,
  Network,
  Atom,
} from 'lucide-react';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';

const WHITEPAPER_URL =
  'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';

// ─── Whitepaper sections data ─────────────────────────────────────────────────

interface WPSection {
  id: string;
  icon: typeof Brain;
  color: 'gold' | 'cyan' | 'purple' | 'emerald';
  number: string;
  title: string;
  subtitle: string;
  content: string[];
  chips?: string[];
  stats?: { label: string; value: string }[];
}

const wpSections: WPSection[] = [
  {
    id: 'abstract',
    icon: FileText,
    color: 'gold',
    number: '00',
    title: 'Executive Summary',
    subtitle: 'Sovereign Autonomous Infrastructure — 2026 Agentic Era',
    content: [
      'SOLARIS (CET) is a high-stakes Real-World Asset (RWA) token anchored in the agricultural and AI infrastructure of Cetățuia. Each unit provides access to the Solaris Prime Tactical Ecosystem, a reasoning hierarchy powered by Gemini 3 Pro Preview.',
      'With a hard-capped supply of 9,000 CET on the TON blockchain, each token represents fractional ownership in a scalable, cloud-agnostic industrial hub designed for the 2026 Agentic Era. The ecosystem automates precision agriculture, crop diagnostics, and market operations through on-chain verifiable intelligence.',
      'The operational framework is governed by the proprietary RAV (Reason-Act-Verify) Protocol, ensuring military-grade precision across market automation and crop diagnostics. Every decision is traceable on-chain, providing full auditability for all ecosystem participants.',
    ],
    stats: [
      { label: 'Total Supply', value: '9,000 CET' },
      { label: 'Blockchain', value: 'TON' },
      { label: 'Protocol', value: 'RAV' },
      { label: 'Target Era', value: '2026' },
    ],
  },
  {
    id: 'problem',
    icon: Brain,
    color: 'cyan',
    number: '01',
    title: 'The Problem',
    subtitle: 'Why Current AI Cannot Cross the Intelligence Threshold',
    content: [
      'Modern large language models (LLMs) are stochastic pattern matchers. They generate statistically probable outputs rather than reasoning from first principles. This architectural limitation means they hallucinate, fail on novel problems, and cannot improve themselves without retraining — an expensive, centralised process controlled by a handful of organisations.',
      'Blockchain networks, by contrast, provide perfect auditability and censorship resistance but lack the intelligence layer needed to make autonomous decisions in complex, dynamic environments. They execute deterministic logic well but cannot reason, adapt, or learn.',
      'The gap between these two domains is the core problem Solaris CET solves: creating a verifiable, decentralised intelligence layer that bridges the capabilities of current AI with the trust properties of blockchain — and extends both toward High Intelligence.',
      'Without such a bridge, AI agents operating on-chain are either too simple (pure smart contracts) or too opaque (LLM black boxes). Neither is suitable for the autonomous, high-stakes applications that the next decade demands.',
    ],
  },
  {
    id: 'architecture',
    icon: Cpu,
    color: 'gold',
    number: '02',
    title: 'Architecture',
    subtitle: 'Hybrid Dual-Layer Blockchain on TON',
    content: [
      'Solaris CET is built on the TON (The Open Network) blockchain, inheriting its sharded architecture, Proof-of-Stake consensus, and native smart contract capabilities. TON was selected for its high throughput design, short finality, and deep Telegram ecosystem integration.',
      'The dual-layer architecture separates concerns: Layer 1 handles consensus, token settlement, and immutable state storage. Layer 2 processes the AI reasoning workloads — high-frequency agent interactions, model inference requests, and IPFS content addressing — before anchoring verified results back to Layer 1.',
      'This design means users never wait for AI reasoning to block on-chain transactions. The two layers operate in parallel, converging on finality every 2 seconds. The cryptographic bridge between them uses Merkle proofs to guarantee that no Layer 2 result can be submitted to Layer 1 without a complete, verifiable reasoning trace.',
    ],
    chips: ['TON L1', 'AI L2', 'Merkle Bridge', 'IPFS Storage', 'PoS Consensus'],
    stats: [
      { label: 'L1', value: 'TON (sharded)' },
      { label: 'Finality', value: '~2s (typical)' },
      { label: 'Bridge', value: 'Merkle proofs' },
      { label: 'Storage', value: 'IPFS' },
    ],
  },
  {
    id: 'rav',
    icon: RefreshCw,
    color: 'purple',
    number: '03',
    title: 'RAV Protocol',
    subtitle: 'Reason → Act → Verify Loop',
    content: [
      'The RAV (Reason-Act-Verify) Protocol is an operational loop used to make agent actions auditable. The REASON phase decomposes goals into sub-objectives using structured reasoning graphs and indexes available on-chain and off-chain signals. Before any on-chain action is executed, the agent must produce a verifiable reasoning trace stored on IPFS and anchored to its Layer 1 transaction.',
      'The ACT phase executes the selected action sequence across market automation or crop diagnostics pipelines. Parameters are recorded and can be reviewed post-hoc. The VERIFY phase cross-checks outcomes against expectations and chain facts, then publishes a trace so the decision can be audited later.',
      'Quantitative benchmarking is treated as a publishable artifact: if/when performance metrics are claimed, they should be linked to reproducible methodology and datasets.',
    ],
    chips: ['Reason', 'Act', 'Verify', 'Multi-model', 'On-Chain Audit'],
  },
  {
    id: 'braid',
    icon: Network,
    color: 'cyan',
    number: '04',
    title: 'BRAID Framework',
    subtitle: 'Structural Reasoning with Logic Graphs',
    content: [
      'BRAID (Bidirectional Reasoning with AI-Directed graphs) replaces the linear token prediction of standard LLMs with a directed acyclic graph (DAG) of reasoning nodes. Each node represents a discrete cognitive operation: fact retrieval, hypothesis generation, logical inference, or outcome evaluation.',
      'The graph structure allows agents to perform parallel reasoning across independent branches, prune dead-end paths early, and reuse verified sub-conclusions without recomputation. This improves debuggability for multi-step reasoning tasks.',
      'BRAID graphs are serialised in Mermaid notation, stored on IPFS, and referenced in every CET transaction. This means developers and auditors can reconstruct the exact reasoning path that led to any agent action — months or years after the fact — without access to the original model.',
    ],
    stats: [
      { label: 'Reasoning', value: 'Graph-based' },
      { label: 'Graph Format', value: 'Mermaid DAG' },
      { label: 'Storage', value: 'IPFS' },
      { label: 'Audit Lag', value: '0' },
    ],
  },
  {
    id: 'quantum',
    icon: Atom,
    color: 'purple',
    number: '05',
    title: 'Quantum OS Intelligence',
    subtitle: 'True Entropy from Quantum Wavefunction Collapse',
    content: [
      'Classical pseudorandom number generators (PRNGs) are deterministic: given the same seed, they produce the same sequence. This is catastrophic for cryptographic key generation, agent decision diversity, and consensus fairness. Quantum OS solves this by sourcing entropy from physical quantum events — specifically, the collapse of photon polarisation states, which is fundamentally unpredictable by any classical or quantum computer.',
      'The Quantum OS layer integrates with hardware quantum random number generators (QRNGs) accessible via certified API endpoints. Each QRNG call produces a 256-bit entropy string derived from genuine quantum measurement, not algorithmic simulation. These strings seed CET\'s cryptographic primitives, agent exploration strategies, and validator selection.',
      'For users without direct QRNG access, Solaris CET implements a quantum-inspired entropy pool: a rolling XOR of on-chain state hashes, network timing jitter, and off-chain QRNG contributions. The pool is continuously auditable, and its entropy health score is published on-chain every block.',
    ],
    chips: ['QRNG API', '256-bit entropy', 'On-chain audit', 'Wavefunction collapse'],
  },
  {
    id: 'self-actualization',
    icon: Zap,
    color: 'emerald',
    number: '06',
    title: 'Self-Actualization Protocol',
    subtitle: 'Agents That Improve Without Human Intervention',
    content: [
      'Self-Actualization is the property that distinguishes High Intelligence from ordinary AI: the ability to identify gaps in one\'s own knowledge, formulate a plan to close them, execute that plan autonomously, and verify the improvement — all without external prompting.',
      'In Solaris CET, every agent maintains a self-model: a compact representation of its capabilities, known failure modes, and improvement objectives. After each task cycle, the agent compares its predicted performance with its actual performance, updates its self-model, and — if the delta exceeds a configurable threshold — initiates a knowledge update routine.',
      'Knowledge update routines can involve: retrieving new IPFS-hosted training data, fine-tuning a local adapter layer, updating BRAID graph weights, or requesting a specialist sub-agent from the CET network. All update steps are logged on-chain, creating a complete evolutionary history of every agent — enabling governance participants to evaluate, fork, or retire agents based on verifiable performance data.',
    ],
  },
  {
    id: 'tokenomics',
    icon: Coins,
    color: 'gold',
    number: '07',
    title: 'Tokenomics',
    subtitle: 'Capped Supply, On-Chain Governance, RWA Ownership',
    content: [
      'CET has a maximum supply of 9,000 tokens on the TON blockchain. Each unit represents fractional ownership in the Solaris Prime Tactical Ecosystem — a cloud-agnostic industrial hub encompassing agricultural automation, AI-driven crop diagnostics, and precision market operations designed for the 2026 Agentic Era.',
      'Token utility is threefold: (1) Access — holders unlock the Solaris Prime Tactical Ecosystem including high-throughput API tiers and Gemini 3 Pro Preview reasoning pipelines; (2) Ownership — CET represents fractional RWA ownership in the Cetățuia agricultural and AI infrastructure; (3) Governance — CET holders vote on protocol upgrades, RAV parameter changes, and treasury allocations.',
      'CET is listed and tradeable on DeDust, TON\'s leading decentralised exchange, in the CET/USDT pool. The pool address is permanently public and verifiable on-chain. Per the on-chain token metadata, the contract is flagged as mintable with the owner address as the sole authority, and the total supply is committed to the 9,000 CET ceiling.',
    ],
    stats: [
      { label: 'Total Supply', value: '9,000 CET' },
      { label: 'Mintable', value: 'True' },
      { label: 'Exchange', value: 'DeDust' },
      { label: 'Pair', value: 'CET/USDT' },
    ],
  },
  {
    id: 'security',
    icon: ShieldCheck,
    color: 'emerald',
    number: '08',
    title: 'Security & Durability',
    subtitle: 'Immutable, Audited, and Censorship-Resistant',
    content: [
      'The Solaris CET smart contract was audited by Cyberscope prior to deployment. The engagement validated integer safety, reentrancy-resilient interaction patterns, least-privilege access controls, and economics under adversarial scenarios. All critical and high-severity findings were closed before deployment—establishing a hardened baseline for mainnet operation.',
      'Data permanence is guaranteed through IPFS content addressing. Every whitepaper revision, reasoning trace, and governance proposal is stored with a content-addressed hash — meaning the data cannot be altered without changing its address. Users can verify any historical document by computing its hash locally.',
      'The architecture is designed to outlast any single organisation. As long as the TON network operates (currently 18,420+ validators across 6 continents), Solaris CET\'s contract state, token balances, and agent histories are preserved. There is no central server to shut down, no CEO to arrest, and no database to corrupt.',
    ],
    chips: ['Cyberscope Audit', 'IPFS Storage', 'Owner Controlled', 'TON L1 Anchored'],
  },
  {
    id: 'developer',
    icon: Code2,
    color: 'cyan',
    number: '09',
    title: 'Developer Platform',
    subtitle: 'SDK, API, and CLI for High-Intelligence Integration',
    content: [
      'Solaris CET ships with a first-class developer platform designed for the speed of the agentic era. The TypeScript/Python SDK provides type-safe clients for all protocol operations: staking, reasoning trace submission, BRAID graph construction, and quantum entropy requests.',
      'The REST and WebSocket APIs expose real-time network metrics, agent performance data, and governance proposals. Developers can subscribe to reasoning trace events, monitor their staked CET positions, and receive push notifications when their agents complete task cycles.',
      'A local sandbox environment mirrors the full protocol stack — including a mock TON node, simulated QRNG endpoint, and in-memory IPFS gateway — allowing developers to build and test AI agents without spending CET or waiting for mainnet finality. The sandbox can replay historical mainnet traces for regression testing.',
    ],
    chips: ['TypeScript SDK', 'Python SDK', 'REST API', 'WebSocket', 'CLI', 'Local Sandbox'],
  },
];

const wpSectionsRo: WPSection[] = [
  {
    id: 'abstract',
    icon: FileText,
    color: 'gold',
    number: '00',
    title: 'Rezumat executiv',
    subtitle: 'Infrastructură suverană autonomă — Era Agentică 2026',
    content: [
      'SOLARIS (CET) este un token RWA cu supply fix de 9.000 CET pe TON, ancorat în infrastructura agricolă și AI a Cetățuia.',
      'Protocolul folosește RAV (Reason–Act–Verify) pentru acțiuni auditabile: urme de raționament + execuție + verificare ancorate on-chain.',
      'Scopul: utilitate reală, execuție verificabilă și o bază tehnică orientată spre High Intelligence, fără a sacrifica transparența.',
    ],
    stats: [
      { label: 'Supply total', value: '9.000 CET' },
      { label: 'Blockchain', value: 'TON' },
      { label: 'Protocol', value: 'RAV' },
      { label: 'Țintă', value: '2026' },
    ],
  },
  {
    id: 'problem',
    icon: Brain,
    color: 'cyan',
    number: '01',
    title: 'Problema',
    subtitle: 'De ce AI-ul curent nu trece pragul de inteligență',
    content: [
      'LLM-urile sunt puternice, dar fără “strat de verificare” pot halucina și pot eșua pe probleme noi.',
      'Blockchain-ul e auditabil și rezistent la cenzură, dar nu are un strat nativ de raționament adaptiv.',
      'Solaris CET țintește puntea: inteligență verificabilă + execuție on-chain, cu urme reconstruibile.',
    ],
  },
  {
    id: 'architecture',
    icon: Cpu,
    color: 'gold',
    number: '02',
    title: 'Arhitectură',
    subtitle: 'L1 TON + L2 pentru workload AI (ancorare verificabilă)',
    content: [
      'CET rulează pe TON, moștenind throughput ridicat și finalitate rapidă.',
      'Workload-urile AI sunt procesate off-chain, iar rezultatele verificate sunt ancorate pe L1 împreună cu urme de raționament.',
      'Separarea reduce latența, fără a pierde auditabilitatea.',
    ],
    chips: ['TON L1', 'L2 AI', 'Ancorare', 'IPFS', 'Finalitate'],
    stats: [
      { label: 'L1', value: 'TON (sharded)' },
      { label: 'Finalitate', value: '~2s (tipic)' },
      { label: 'Stocare', value: 'IPFS' },
      { label: 'Audit', value: 'On-chain' },
    ],
  },
  {
    id: 'rav',
    icon: RefreshCw,
    color: 'purple',
    number: '03',
    title: 'Protocol RAV',
    subtitle: 'Reason → Act → Verify',
    content: [
      'REASON: descompune obiectivul și construiește urme de raționament structurat.',
      'ACT: execută acțiunea (ex: interacțiuni DEX / operațiuni) cu parametri înregistrați.',
      'VERIFY: verifică rezultatul și publică audit trail-ul pentru analiză ulterioară.',
    ],
    chips: ['Reason', 'Act', 'Verify', 'Audit', 'Trasabilitate'],
  },
  {
    id: 'braid',
    icon: Network,
    color: 'cyan',
    number: '04',
    title: 'BRAID',
    subtitle: 'Raționament structural cu grafuri logice',
    content: [
      'BRAID modelează raționamentul ca graf (DAG), nu ca șir liniar.',
      'Permite ramuri paralele, reutilizare și depanare mai bună pentru multi-step.',
      'Grafurile pot fi serializate (Mermaid) și referențiate în urme auditate.',
    ],
    stats: [
      { label: 'Stil raționament', value: 'Graph-based' },
      { label: 'Format', value: 'Mermaid' },
      { label: 'Stocare', value: 'IPFS' },
      { label: 'Audit lag', value: '0' },
    ],
  },
  {
    id: 'quantum',
    icon: Atom,
    color: 'purple',
    number: '05',
    title: 'Quantum OS',
    subtitle: 'Entropie din evenimente cuantice (model + audit)',
    content: [
      'Entropia bună este critică pentru securitate și aleatorizare (minare, scheduling, selecție).',
      'Quantum OS propune surse de entropie verificabile și auditabile, cu integrare QRNG când există.',
      'Pentru fallback, se folosește un pool auditat de semnale on-chain/off-chain.',
    ],
    chips: ['QRNG', 'Entropie', 'Audit', 'Securitate'],
  },
  {
    id: 'self-actualization',
    icon: Zap,
    color: 'emerald',
    number: '06',
    title: 'Self-Actualization',
    subtitle: 'Agenți care își îmbunătățesc performanța',
    content: [
      'High Intelligence cere feedback loops: identificare gap-uri → plan → execuție → verificare.',
      'Agenții pot menține un self-model și pot declanșa rutine de îmbunătățire pe baza diferențelor dintre așteptări și rezultate.',
      'Totul trebuie să rămână auditabil și guvernabil de către comunitate.',
    ],
  },
  {
    id: 'tokenomics',
    icon: Coins,
    color: 'gold',
    number: '07',
    title: 'Tokenomics',
    subtitle: 'Supply fix · utilitate · guvernanță',
    content: [
      'Supply maxim: 9.000 CET pe TON.',
      'Utilitate: acces la produse/servicii + staking/minare + guvernanță protocol.',
      'Listare/tranzacționare: DeDust (CET/USDT) cu verificare on-chain a contractului.',
    ],
    stats: [
      { label: 'Supply total', value: '9.000 CET' },
      { label: 'Exchange', value: 'DeDust' },
      { label: 'Pair', value: 'CET/USDT' },
      { label: 'Lanț', value: 'TON' },
    ],
  },
  {
    id: 'security',
    icon: ShieldCheck,
    color: 'emerald',
    number: '08',
    title: 'Securitate & durabilitate',
    subtitle: 'Auditabil · rezistent · verificabil',
    content: [
      'Securitatea trebuie să fie demonstrabilă: audit, controale de acces, modele de risc, trasabilitate.',
      'IPFS poate oferi permanență prin content-addressing (hash-uri verificabile).',
      'Designul urmărește reziliență: fără dependență de un singur server sau o singură organizație.',
    ],
    chips: ['Audit', 'IPFS', 'Access control', 'TON anchored'],
  },
  {
    id: 'developer',
    icon: Code2,
    color: 'cyan',
    number: '09',
    title: 'Platformă pentru dezvoltatori',
    subtitle: 'SDK · API · instrumente',
    content: [
      'Un SDK TypeScript/Python poate standardiza operațiuni: staking, trimitere trace-uri, grafuri BRAID, entropie.',
      'API-uri (REST/WebSocket) pentru metrici, evenimente și integrare în timp real.',
      'Sandbox local pentru testare, fără costuri și fără dependență de mainnet în faza de dezvoltare.',
    ],
    chips: ['TypeScript', 'Python', 'REST', 'WebSocket', 'Sandbox'],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  gold: {
    bg: 'bg-solaris-gold/10',
    text: 'text-solaris-gold',
    border: 'border-solaris-gold/30',
    badge: 'bg-solaris-gold/15 text-solaris-gold border-solaris-gold/30',
  },
  cyan: {
    bg: 'bg-solaris-cyan/10',
    text: 'text-solaris-cyan',
    border: 'border-solaris-cyan/30',
    badge: 'bg-solaris-cyan/15 text-solaris-cyan border-solaris-cyan/30',
  },
  purple: {
    bg: 'bg-purple-400/10',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
    badge: 'bg-purple-400/15 text-purple-400 border-purple-400/30',
  },
  emerald: {
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
    badge: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  },
};

// ─── Collapsible WP Section ───────────────────────────────────────────────────

const WPSectionCard = ({ section }: { section: WPSection }) => {
  const [open, setOpen] = useState(section.id === 'abstract');
  const Icon = section.icon;
  const c = colorMap[section.color];

  return (
    <div id={`wp-card-${section.id}`} className={`rounded-2xl border ${c.border} bg-white/[0.02] overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.03] transition-all duration-200"
        aria-expanded={open}
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`font-mono text-[10px] font-bold ${c.text} opacity-60`}>{section.number}</span>
            <span className={`hud-label text-[10px] ${c.text}`}>{section.subtitle}</span>
          </div>
          <h3 className="font-display font-bold text-solaris-text text-lg leading-tight">
            {section.title}
          </h3>
        </div>
        <div className={`shrink-0 w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
          {open
            ? <ChevronUp className={`w-4 h-4 ${c.text}`} />
            : <ChevronDown className={`w-4 h-4 ${c.text}`} />
          }
        </div>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-4">
          <div className={`h-px ${c.bg}`} />

          {/* Paragraphs */}
          {section.content.map((para, i) => (
            <p key={i} className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              {para}
            </p>
          ))}

          {/* Stats grid */}
          {section.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {section.stats.map(stat => (
                <div key={stat.label} className="p-3 rounded-xl bg-white/5 text-center">
                  <div className={`font-mono font-bold text-base ${c.text}`}>{stat.value}</div>
                  <div className="hud-label text-[9px] text-solaris-muted mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Chips */}
          {section.chips && (
            <div className="flex flex-wrap gap-2 mt-2">
              {section.chips.map(chip => (
                <span
                  key={chip}
                  className={`px-3 py-1 rounded-full border text-xs font-mono ${c.badge}`}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const WhitepaperSection = () => {
  const { t, lang } = useLanguage();
  const tx = t.whitepaperUi;
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const sections = useMemo(
    () => (({ ro: wpSectionsRo } as Partial<Record<string, typeof wpSections>>)[lang] ?? wpSections),
    [lang],
  );

  const readMinutes = useMemo(() => {
    const words = sections
      .flatMap((s) => s.content)
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }, [sections]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 82%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        contentRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        ctaRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 88%',
            end: 'top 65%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const cta = ctaRef.current;
    if (!section || !content || !cta) return;

    const update = () => {
      rafRef.current = null;
      const start = content.getBoundingClientRect().top + window.scrollY;
      const end = cta.getBoundingClientRect().bottom + window.scrollY;
      const span = Math.max(1, end - start);
      const y = window.scrollY + 120;
      const raw = (y - start) / span;
      const next = Math.max(0, Math.min(1, raw));
      setProgress(next);
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="whitepaper"
      aria-label={t.sectionAria.whitepaperSection}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
    >
      <div className="sticky top-0 z-30 h-1 w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-solaris-gold/0 via-solaris-gold to-solaris-cyan/0"
          style={{ width: `${Math.round(progress * 100)}%` }}
          aria-hidden
        />
      </div>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-solaris-cyan/5 blur-[120px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-5xl mx-auto w-full">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">
              {tx.kicker}
            </span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Solaris CET —{' '}
            <span className="text-gradient-gold">{tx.headlineHighlight}</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed mb-4">
            {tx.intro}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-solaris-muted mb-5">
            <span>{tx.metaReadMinutes.replace('{minutes}', String(readMinutes))}</span>
            <span className="opacity-50">·</span>
            <span>{Math.round(progress * 100)}%</span>
            <span className="opacity-50">·</span>
            <span>v1.0</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {tx.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-solaris-gold/10 border border-solaris-gold/20 text-solaris-gold text-xs font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Table of Contents */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {sections.map(section => {
            const Icon = section.icon;
            const c = colorMap[section.color];
            return (
              <button
                key={section.id}
                onClick={() => {
                  document.getElementById(`wp-card-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`flex flex-col items-start gap-2 p-3 rounded-xl border ${c.border} bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200 text-left group`}
                type="button"
              >
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div>
                  <div className={`font-mono text-[9px] font-bold ${c.text} opacity-60 mb-0.5`}>{section.number}</div>
                  <div className="text-solaris-text text-xs font-semibold leading-tight group-hover:text-white transition-colors">
                    {section.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inline whitepaper sections */}
        <div ref={contentRef} className="space-y-3 mb-16">
          {sections.map(section => (
            <WPSectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* CTA — IPFS archive */}
        <div ref={ctaRef} className="bento-card p-6 lg:p-8 border border-solaris-gold/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-solaris-gold" />
                <span className="hud-label text-solaris-gold">
                  {tx.archiveKicker}
                </span>
              </div>
              <h3 className="font-display font-semibold text-solaris-text text-lg mb-1">
                {tx.archiveTitle}
              </h3>
              <p className="text-solaris-muted text-sm">
                {tx.archiveBody}
              </p>
              <span className="font-mono text-solaris-muted text-[10px] break-all block mt-2">
                ipfs://bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a
              </span>
            </div>
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-solaris-gold text-solaris-dark font-semibold text-sm hover:bg-solaris-gold/90 active:scale-95 transition-all duration-200 group btn-quantum"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              {tx.downloadLabel}
            </a>
          </div>
        </div>

        <div className="mt-10 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={2030} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default WhitepaperSection;
