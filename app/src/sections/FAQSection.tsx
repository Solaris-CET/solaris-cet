import { useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, HelpCircle } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';

interface FAQLink {
  label: string;
  href: string;
}

interface FAQ {
  question: string;
  answer: string;
  link?: FAQLink;
  links?: FAQLink[];
}

const faqs: FAQ[] = [
  {
    question: 'What is Solaris CET?',
    answer:
      'Solaris CET (CET) is a hyper-scarce Real-World Asset token on the TON blockchain with a fixed supply of 9,000 CET. It bridges AI agents to on-chain execution through the BRAID Framework and the RAV Protocol, anchored in the agricultural and AI infrastructure of Cetățuia, Romania.',
  },
  {
    question: 'What is the total supply of CET?',
    answer:
      'The total supply is fixed at 9,000 CET — permanently. No minting, no admin keys, no inflation. This makes each token represent 0.011% of the entire global supply.',
  },
  {
    question: 'How do I buy CET?',
    answer:
      'CET trades on DeDust DEX on the TON network. Connect a TON wallet (Tonkeeper recommended), fund it with TON, then swap TON → CET at the official DeDust pool. Always verify the contract address: EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
  },
  {
    question: 'Is the smart contract audited?',
    answer:
      'Yes. The CET smart contract was fully audited by Cyberscope with zero critical findings. The core team has also completed KYC verification and the project is listed on Freshcoins. The full audit report is linked in the whitepaper.',
  },
  {
    question: 'How does CET mining work?',
    answer:
      "66.66% of the BTC-S supply (the broader ecosystem token) enters circulation via Proof-of-Work mining over a 90-year schedule with a decaying reward curve — similar to Bitcoin's halving model. The Zero-Battery constraint ensures mining approaches 0% battery drain on participating devices.",
  },
  {
    question: 'What is the DCBM mechanism?',
    answer:
      'DCBM (Dynamic-Control Buyback Mechanism) uses PID controllers to autonomously manage buy-back operations when price deviates from the target band. It reduces token price volatility by up to 66%, providing scientific price stability without manual intervention.',
  },
  {
    question: 'What blockchain does CET run on?',
    answer:
      "CET is deployed on the TON (The Open Network) mainnet — one of the fastest L1 blockchains, with ~100,000 TPS throughput and 2-second transaction finality. TON's sharded architecture provides virtually unlimited scalability.",
  },
  {
    question: 'What is the ReAct Protocol?',
    answer:
      "ReAct (Reasoning + Acting) is Solaris CET's on-chain AI reasoning standard. Every AI agent action goes through a 5-phase loop: Observe → Think → Plan → Act → Verify. All reasoning traces are anchored on-chain, making every AI decision transparent, auditable, and hallucination-resistant.",
  },
  {
    question: 'Where can I find the whitepaper?',
    answer:
      'The whitepaper is permanently published on IPFS — immutable and censorship-resistant.',
    link: {
      label: 'Open Whitepaper on IPFS ↗',
      href: 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a',
    },
  },
  {
    question: 'How do I join the Solaris CET community?',
    answer:
      'Join the official Telegram community for news, updates, and direct communication with the team. The source code is also open on GitHub.',
    links: [
      { label: 'Join Telegram ↗', href: 'https://t.me/SolarisCET' },
      { label: 'View on GitHub ↗', href: 'https://github.com/Solaris-CET/solaris-cet' },
    ],
  },
  {
    question: 'How does Solaris CET compare to Fetch.ai, Bittensor and SingularityNET?',
    answer:
      'CET has 9,000 total supply vs billions for competitors. TON delivers 100,000 TPS vs under 1,000 for Fetch.ai and Bittensor. CET operates 200,000 deployed autonomous agents — not just a marketplace. Only CET uses Grok × Gemini dual-AI simultaneously. And only CET is backed by real-world agricultural assets in Romania.',
    links: [{ label: 'Full comparison ↗', href: '#competition' }],
  },
  {
    question: 'What is the BRAID Framework?',
    answer:
      'BRAID (Blockchain-Recursive AI Decision) serialises agent reasoning paths as Mermaid notation graphs, stores them on IPFS, and anchors them in every CET transaction. This means any decision made by any agent can be reconstructed and audited months or years later — with complete traceability and zero trust assumptions.',
    links: [],
  },
  {
    question: 'What are the RAV Protocol phases?',
    answer:
      'RAV = Reason · Act · Verify. Phase 1 (REASON): Google Gemini decomposes the goal into sub-objectives using a BRAID graph. Phase 2 (ACT): xAI Grok executes the optimised action plan and generates TON transactions. Phase 3 (VERIFY): An independent model reviews the action and its on-chain trace before finalisation. Every phase is timestamped and stored immutably on IPFS.',
    links: [],
  },
  {
    question: 'What is the Zero-Battery Constraint?',
    answer:
      'CET mining is engineered to approach zero battery drain on mobile devices. Unlike Bitcoin mining, CET\'s Zero-Battery Constraint limits CPU utilisation to background-idle levels, meaning mining can run passively without heating your device or reducing battery life measurably.',
    links: [],
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

      const items = listRef.current?.querySelectorAll('.faq-item');
      if (items) {
        gsap.fromTo(
          items,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.7,
            scrollTrigger: {
              trigger: listRef.current,
              start: 'top 80%',
              end: 'top 30%',
              scrub: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('.faq-trigger');
      triggers?.[Math.min(i + 1, faqs.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('.faq-trigger');
      triggers?.[Math.max(i - 1, 0)]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      listRef.current?.querySelectorAll<HTMLButtonElement>('.faq-trigger')[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('.faq-trigger');
      triggers?.[faqs.length - 1]?.focus();
    }
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      aria-label="Frequently Asked Questions"
      className="relative section-glass py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="cyan" />

      <div className="relative z-10 section-padding-x max-w-4xl mx-auto w-full">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-2xl mb-16 max-md:mx-auto max-md:text-center">
          <div className="flex items-center gap-3 mb-4 max-md:justify-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="hud-label text-cyan-400">FAQ</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Common Questions{' '}
            <span className="text-gradient-gold">Answered</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            Everything you need to know about Solaris CET, from token economics to technical architecture.
          </p>
        </div>

        {/* FAQ accordion */}
        <div ref={listRef} className="flex flex-col gap-3" role="list">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item bento-card border border-white/8 overflow-hidden" role="listitem">
              <button
                id={`faq-btn-${i}`}
                className="faq-trigger w-full flex items-center justify-between p-5 sm:p-6 md:p-7 text-left group transition-all duration-300"
                aria-expanded={openIndex === i}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
              >
                <span className="font-display font-semibold text-solaris-text text-base group-hover:text-solaris-gold transition-colors pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-solaris-gold shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-btn-${i}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-5 sm:px-6 md:px-7 pb-6 space-y-3">
                  <p className="text-solaris-muted text-sm leading-relaxed">{faq.answer}</p>
                  {faq.link && (
                    <a
                      href={faq.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-solaris-gold hover:opacity-80 transition-opacity"
                    >
                      {faq.link.label}
                    </a>
                  )}
                  {faq.links && (
                    <div className="flex flex-wrap gap-4">
                      {faq.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-semibold text-solaris-cyan hover:opacity-80 transition-opacity"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl mx-auto">
          <MeshSkillRibbon variant="compact" saltOffset={1920} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
