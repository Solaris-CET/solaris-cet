import { useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, HelpCircle } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';

interface FAQ {
  question: string;
  answer: string;
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
      '66.66% of the BTC-S supply (the broader ecosystem token) enters circulation via Proof-of-Work mining over a 90-year schedule with a decaying reward curve — similar to Bitcoin\'s halving model. The Zero-Battery constraint ensures mining approaches 0% battery drain on participating devices.',
  },
  {
    question: 'What is the DCBM mechanism?',
    answer:
      'DCBM (Dynamic-Control Buyback Mechanism) uses PID controllers to autonomously manage buy-back operations when price deviates from the target band. It reduces token price volatility by up to 66%, providing scientific price stability without manual intervention.',
  },
  {
    question: 'What blockchain does CET run on?',
    answer:
      'CET is deployed on the TON (The Open Network) mainnet — one of the fastest L1 blockchains, with ~100,000 TPS throughput and 2-second transaction finality. TON\'s sharded architecture provides virtually unlimited scalability.',
  },
  {
    question: 'What is the ReAct Protocol?',
    answer:
      'ReAct (Reasoning + Acting) is Solaris CET\'s on-chain AI reasoning standard. Every AI agent action goes through a 5-phase loop: Observe → Think → Plan → Act → Verify. All reasoning traces are anchored on-chain, making every AI decision transparent, auditable, and hallucination-resistant.',
  },
  {
    question: 'Where can I find the whitepaper?',
    answer:
      'The whitepaper is permanently published on IPFS (CID: bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a) and accessible at https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a — immutable and censorship-resistant.',
  },
  {
    question: 'How do I join the Solaris CET community?',
    answer:
      'Join the official Telegram community at https://t.me/SolarisCET for news, updates, and direct communication with the team. The full source code is also open on GitHub: https://github.com/Solaris-CET/solaris-cet',
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

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
    >
      <GlowOrbs variant="cyan" />

      <div className="relative z-10 px-6 lg:px-12 max-w-4xl mx-auto">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="hud-label text-cyan-400">FAQ</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Common Questions{' '}
            <span className="text-solaris-gold">Answered</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            Everything you need to know about Solaris CET, from token economics to technical architecture.
          </p>
        </div>

        {/* FAQ accordion */}
        <div ref={listRef} className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item glass-card border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left group"
                aria-expanded={openIndex === i}
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
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-solaris-muted text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
