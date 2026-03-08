import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import {
  Brain,
  Code2,
  Cpu,
  FileText,
  Globe,
  Layers,
  Lock,
  RefreshCw,
  Rocket,
  Shield,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';

// ─── Static data ───────────────────────────────────────────────────────────────

const WHITEPAPER_URL =
  'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';

const REACT_PROTOCOL_STEPS = [
  {
    id: 'reason',
    label: 'Reason',
    icon: Brain,
    color: '#F2C94C',
    bg: 'bg-solaris-gold/10',
    border: 'border-solaris-gold/30',
    description:
      'The agent analyses the current context, goals, and available data before deciding on any action. All reasoning is logged on-chain for full auditability.',
  },
  {
    id: 'evaluate',
    label: 'Evaluate',
    icon: Cpu,
    color: '#2EE7FF',
    bg: 'bg-solaris-cyan/10',
    border: 'border-solaris-cyan/30',
    description:
      'Potential actions are ranked by expected outcome using BRAID logic graphs. Confidence scores above the threshold gate execution.',
  },
  {
    id: 'act',
    label: 'Act',
    icon: Zap,
    color: '#34D399',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    description:
      'The highest-confidence action is executed on-chain via the Solaris node network. Every call is signed, timestamped, and verifiable.',
  },
  {
    id: 'calibrate',
    label: 'Calibrate',
    icon: RefreshCw,
    color: '#A78BFA',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/30',
    description:
      'Outcomes feed back into the model. Self-actualization loops continuously improve decision accuracy without manual intervention.',
  },
];

const DEVELOPER_TOOLS = [
  {
    icon: Terminal,
    title: 'Solaris CLI',
    tag: 'v1.0',
    color: 'text-solaris-gold',
    bg: 'bg-solaris-gold/10',
    description:
      'Scaffold, deploy, and monitor AI agents directly from your terminal. Full TypeScript and Python SDK support.',
    badge: 'OPEN SOURCE',
    badgeColor: 'text-solaris-gold border-solaris-gold/40',
  },
  {
    icon: Code2,
    title: 'ReAct SDK',
    tag: 'REST · WS',
    color: 'text-solaris-cyan',
    bg: 'bg-solaris-cyan/10',
    description:
      'Plug the Reason-Evaluate-Act-Calibrate loop into any application. Zero-knowledge proofs ensure agent actions remain private yet auditable.',
    badge: 'PERMISSIONED',
    badgeColor: 'text-solaris-cyan border-solaris-cyan/40',
  },
  {
    icon: Layers,
    title: 'Intelligence Sandbox',
    tag: 'TESTNET',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    description:
      'Isolated compute environment for training high-intelligence models. Resources billed in CET — cheaper for long-term builders.',
    badge: 'BETA',
    badgeColor: 'text-violet-400 border-violet-400/40',
  },
  {
    icon: Globe,
    title: 'Agent Marketplace',
    tag: 'COMING SOON',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    description:
      'Publish, discover, and monetise AI agents. Revenue is auto-distributed in CET via smart contracts on the TON network.',
    badge: 'Q3 2025',
    badgeColor: 'text-emerald-400 border-emerald-400/40',
  },
];

const SELF_ACTUALIZATION_PROTOCOLS = [
  {
    icon: RefreshCw,
    title: 'Continuous Learning Loop',
    color: 'text-solaris-gold',
    bg: 'bg-solaris-gold/5',
    border: 'border-solaris-gold/20',
    text: 'Every agent action produces a feedback signal. BRAID compiles these signals into incremental model updates, enabling 24/7 unsupervised improvement.',
  },
  {
    icon: Shield,
    title: 'Safe-Update Protocol',
    color: 'text-solaris-cyan',
    bg: 'bg-solaris-cyan/5',
    border: 'border-solaris-cyan/20',
    text: 'All self-updates are sandboxed, diff-checked against a constitutional ruleset, and require a quorum of validator nodes before mainnet deployment.',
  },
  {
    icon: TrendingUp,
    title: 'Adaptive Capability Routing',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/5',
    border: 'border-emerald-400/20',
    text: 'Specialised sub-agents are spawned on demand. The orchestrator dynamically re-routes tasks to the highest-performing specialist, maximising throughput.',
  },
  {
    icon: Lock,
    title: 'Immutable Audit Trail',
    color: 'text-violet-400',
    bg: 'bg-violet-400/5',
    border: 'border-violet-400/20',
    text: 'Every learning iteration is hashed and anchored to the TON blockchain. Roll back, audit, or prove compliance at any point in the agent\'s lifecycle.',
  },
];

const BRIDGE_STATS = [
  { value: '9,000', label: 'CET Supply', sub: 'Hyper-scarce on TON', color: 'text-solaris-gold' },
  { value: '74x', label: 'Efficiency Gain', sub: 'vs baseline AI agents', color: 'text-solaris-cyan' },
  { value: '34%', label: 'Success Rate ↑', sub: 'ReAct vs vanilla LLM', color: 'text-emerald-400' },
  { value: '90yr', label: 'Mining Runway', sub: 'Durable token economy', color: 'text-violet-400' },
];

// ─── Component ──────────────────────────────────────────────────────────────

const WhitepaperSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);
  const devToolsRef = useRef<HTMLDivElement>(null);
  const selfActRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [activeReact, setActiveReact] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const fadeUp = (el: Element | null, delay = 0) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay,
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              end: 'top 60%',
              scrub: false,
              once: true,
            },
          }
        );
      };

      fadeUp(headerRef.current, 0);
      fadeUp(statsRef.current, 0.05);
      fadeUp(reactRef.current, 0.1);
      fadeUp(devToolsRef.current, 0.1);
      fadeUp(selfActRef.current, 0.1);
      fadeUp(ctaRef.current, 0.1);

      // Stagger children of devToolsRef grid
      const toolCards = devToolsRef.current?.querySelectorAll('.tool-card');
      if (toolCards) {
        gsap.fromTo(
          toolCards,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            scrollTrigger: {
              trigger: devToolsRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      const selfActCards = selfActRef.current?.querySelectorAll('.self-act-card');
      if (selfActCards) {
        gsap.fromTo(
          selfActCards,
          { x: -24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.5,
            scrollTrigger: {
              trigger: selfActRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="whitepaper"
      className="relative bg-solaris-dark py-24"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] grid-floor opacity-15" />
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-solaris-gold/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-solaris-cyan/20 to-transparent" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto space-y-20">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto">
          <div className="hud-label text-solaris-gold mb-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
            SOLARIS CET · WHITEPAPER
          </div>
          <h2 className="font-display font-bold text-[clamp(32px,4vw,56px)] text-solaris-text mb-6 leading-tight">
            The Bridge Between{' '}
            <span className="text-gradient-animated">AI and High Intelligence</span>
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            Solaris CET is not just a token — it is the economic foundation of a living developer
            ecosystem purpose-built for agents that <em className="text-solaris-text not-italic font-medium">reason, act, and evolve</em>.
            This whitepaper outlines the protocols, tools, and incentive structures that make the
            bridge durable, safe, and profitable for every participant.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-filled-gold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Read Full Whitepaper (IPFS)
            </a>
            <a
              href="#developer-tools"
              className="btn-gold flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                devToolsRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Rocket className="w-4 h-4" />
              Explore Dev Tools
            </a>
          </div>
        </div>

        {/* ── Bridge Stats ───────────────────────────────────────────────── */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {BRIDGE_STATS.map((stat) => (
            <div
              key={stat.label}
              className="glass-card p-5 text-center holo-card"
            >
              <div className={`font-display font-bold text-[clamp(24px,3vw,36px)] ${stat.color}`}>
                {stat.value}
              </div>
              <div className="font-medium text-solaris-text text-sm mt-1">{stat.label}</div>
              <div className="hud-label text-[10px] mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── ReAct Protocol ─────────────────────────────────────────────── */}
        <div ref={reactRef} className="glass-card-gold p-8 lg:p-12 holo-card relative overflow-hidden">
          <div className="absolute inset-0 rounded-[18px] shimmer-border pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center animate-gold-pulse">
                <Brain className="w-5 h-5 text-solaris-gold" />
              </div>
              <span className="hud-label text-solaris-gold">SOLARIS ReAct PROTOCOL</span>
            </div>
            <h3 className="font-display font-bold text-[clamp(22px,2.8vw,38px)] text-solaris-text mb-3">
              Reason · Evaluate · Act · Calibrate
            </h3>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed mb-8 max-w-2xl">
              Every Solaris AI agent follows the <span className="text-solaris-gold font-semibold">ReAct loop</span>:
              a four-phase protocol that interleaves structured reasoning with verifiable on-chain actions and
              continuous self-calibration. The result is a provably correct, continuously improving intelligence
              that never loses accountability.
            </p>

            {/* Step selector */}
            <div className="flex flex-wrap gap-2 mb-8">
              {REACT_PROTOCOL_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveReact(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      activeReact === i
                        ? `${step.bg} ${step.border} text-solaris-text`
                        : 'border-white/10 bg-white/5 text-solaris-muted hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: activeReact === i ? step.color : undefined }} />
                    {step.label}
                  </button>
                );
              })}
            </div>

            {/* Active step detail */}
            <div
              key={activeReact}
              className={`p-6 rounded-2xl border ${REACT_PROTOCOL_STEPS[activeReact].bg} ${REACT_PROTOCOL_STEPS[activeReact].border} transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                {(() => {
                  const step = REACT_PROTOCOL_STEPS[activeReact];
                  const Icon = step.icon;
                  return (
                    <>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${step.color}18` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <div>
                        <div className="font-display font-semibold text-lg text-solaris-text mb-2">
                          Phase {activeReact + 1}: {step.label}
                        </div>
                        <p className="text-solaris-muted leading-relaxed">{step.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Protocol loop diagram */}
            <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
              {REACT_PROTOCOL_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all duration-300 cursor-pointer ${
                        activeReact === i
                          ? `${step.bg} ${step.border}`
                          : 'bg-white/5 border-white/10'
                      }`}
                      style={{ color: activeReact === i ? step.color : undefined }}
                      onClick={() => setActiveReact(i)}
                    >
                      <Icon className="w-3 h-3" />
                      {step.label.toUpperCase()}
                    </div>
                    {i < REACT_PROTOCOL_STEPS.length - 1 && (
                      <span className="text-solaris-muted/40 text-lg select-none">→</span>
                    )}
                    {i === REACT_PROTOCOL_STEPS.length - 1 && (
                      <span className="text-solaris-muted/40 text-sm font-mono select-none">↩ loop</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Developer Platform ─────────────────────────────────────────── */}
        <div id="developer-tools">
          <div className="text-center mb-10">
            <div className="hud-label text-solaris-cyan mb-3 flex items-center justify-center gap-2">
              <Cpu className="w-3 h-3" />
              DEVELOPER PLATFORM
            </div>
            <h3 className="font-display font-bold text-[clamp(24px,3vw,40px)] text-solaris-text">
              Every Tool You Need to Build{' '}
              <span className="text-gradient-animated">High Intelligence</span>
            </h3>
            <p className="text-solaris-muted mt-4 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed">
              The Solaris developer platform removes friction between idea and deployment. Builders
              pay in CET, earn in CET, and contribute to a network that grows smarter with every
              agent deployed.
            </p>
          </div>

          <div ref={devToolsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEVELOPER_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.title} className="tool-card glass-card p-6 flex flex-col gap-4 holo-card">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <div>
                    <div className="font-display font-semibold text-solaris-text text-base mb-1">
                      {tool.title}
                    </div>
                    <div className="hud-label text-[10px] mb-3">{tool.tag}</div>
                    <p className="text-solaris-muted text-sm leading-relaxed">{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Self-Actualization Protocols ───────────────────────────────── */}
        <div>
          <div className="text-center mb-10">
            <div className="hud-label text-violet-400 mb-3 flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" />
              SELF-ACTUALIZATION ENGINE
            </div>
            <h3 className="font-display font-bold text-[clamp(24px,3vw,40px)] text-solaris-text">
              A Bridge That Gets{' '}
              <span className="text-gradient-animated">Stronger Over Time</span>
            </h3>
            <p className="text-solaris-muted mt-4 max-w-2xl mx-auto text-sm lg:text-base leading-relaxed">
              Solaris agents do not plateau. Four interlocking self-actualization protocols ensure
              the network continuously upgrades itself while remaining safe, auditable, and
              constitutionally aligned.
            </p>
          </div>

          <div ref={selfActRef} className="grid sm:grid-cols-2 gap-5">
            {SELF_ACTUALIZATION_PROTOCOLS.map((proto) => {
              const Icon = proto.icon;
              return (
                <div
                  key={proto.title}
                  className={`self-act-card p-6 rounded-2xl border ${proto.bg} ${proto.border} flex gap-4`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${proto.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${proto.color}`} />
                  </div>
                  <div>
                    <div className={`font-display font-semibold text-base mb-2 ${proto.color}`}>
                      {proto.title}
                    </div>
                    <p className="text-solaris-muted text-sm leading-relaxed">{proto.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Token Utility for Developers ──────────────────────────────── */}
        <div className="glass-card p-8 lg:p-12 relative overflow-hidden holo-card">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="hud-label text-solaris-gold mb-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                CET TOKEN UTILITY
              </div>
              <h3 className="font-display font-bold text-[clamp(22px,2.8vw,36px)] text-solaris-text mb-5 leading-tight">
                Profitable for Builders,{' '}
                <span className="text-gradient-animated">Durable by Design</span>
              </h3>
              <p className="text-solaris-muted text-sm lg:text-base leading-relaxed mb-6">
                CET is the native currency of the Solaris developer platform. Every API call,
                sandbox session, and agent deployment is priced in CET — creating constant
                buy-pressure from real usage, not speculation.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  ['Compute Credits', 'Pay for Intelligence Sandbox compute in CET at a 20% discount vs fiat'],
                  ['Revenue Share', 'Agent Marketplace payouts auto-streamed to your wallet in CET'],
                  ['Governance', 'Token holders vote on protocol upgrades and new tooling roadmap'],
                  ['Staking Yield', 'Stake CET to run a validator node and earn 66.66% of block rewards'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-solaris-gold mt-2 shrink-0 animate-pulse" />
                    <span>
                      <span className="text-solaris-text font-medium">{title}: </span>
                      <span className="text-solaris-muted">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {/* Token stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Supply', value: '9,000 CET', color: 'text-solaris-gold', sub: 'Hyper-scarce on TON' },
                  { label: 'Network', value: 'TON', color: 'text-solaris-cyan', sub: '2.0 s finality' },
                  { label: 'Fair Launch', value: '100%', color: 'text-emerald-400', sub: 'No pre-mine, no VC' },
                  { label: 'DCBM', value: '66% ↓', color: 'text-violet-400', sub: 'Volatility reduction' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-white/5 text-center">
                    <div className={`font-display font-bold text-xl ${item.color}`}>{item.value}</div>
                    <div className="font-medium text-solaris-text text-xs mt-1">{item.label}</div>
                    <div className="hud-label text-[10px] mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Security badges */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="hud-label text-[10px] mb-3 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-solaris-gold" />
                  SECURITY GUARANTEES
                </div>
                <div className="flex flex-wrap gap-2">
                  {['No Admin Minting', 'No Hidden Proxies', 'On-Chain Audit Trail', 'Open Source'].map((badge) => (
                    <span
                      key={badge}
                      className="text-[10px] font-mono px-2 py-1 rounded border border-solaris-gold/30 text-solaris-gold bg-solaris-gold/5"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <div ref={ctaRef} className="text-center">
          <div className="glass-card-gold p-8 lg:p-12 holo-card relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.06)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="hud-label text-solaris-gold mb-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
                START BUILDING
              </div>
              <h3 className="font-display font-bold text-[clamp(24px,3vw,42px)] text-solaris-text mb-4">
                Join the Intelligence{' '}
                <span className="text-gradient-animated">Revolution</span>
              </h3>
              <p className="text-solaris-muted text-base max-w-lg mx-auto mb-8">
                The bridge is live. Every tool is ready. Start deploying high-intelligence agents
                today and earn CET for every interaction your agents power.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={WHITEPAPER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-filled-gold flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Full Whitepaper
                </a>
                <a
                  href="https://dedust.io/swap/TON/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Buy CET on DeDust
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhitepaperSection;
