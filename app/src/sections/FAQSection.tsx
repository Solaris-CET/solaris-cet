import { useState, useRef, useMemo } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { useLanguage } from '../hooks/useLanguage';
import type { FaqContent } from '../i18n/faqContent.types';

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

/** Canonical URLs — labels come from `t.faqContent`. */
const FAQ_HREF_WHITEPAPER =
  'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';
const FAQ_HREF_TELEGRAM = 'https://t.me/SolarisCET';
const FAQ_HREF_GITHUB = 'https://github.com/Solaris-CET/solaris-cet';
const FAQ_HREF_COMPARISON = '#competition';

function buildFaqs(f: FaqContent): FAQ[] {
  return [
    { question: f.q1, answer: f.a1 },
    { question: f.q2, answer: f.a2 },
    { question: f.q3, answer: f.a3 },
    { question: f.q4, answer: f.a4 },
    { question: f.q5, answer: f.a5 },
    { question: f.q6, answer: f.a6 },
    { question: f.q7, answer: f.a7 },
    { question: f.q8, answer: f.a8 },
    {
      question: f.q9,
      answer: f.a9,
      link: { label: f.linkWhitepaper, href: FAQ_HREF_WHITEPAPER },
    },
    {
      question: f.q10,
      answer: f.a10,
      links: [
        { label: f.linkTelegram, href: FAQ_HREF_TELEGRAM },
        { label: f.linkGithub, href: FAQ_HREF_GITHUB },
      ],
    },
    {
      question: f.q11,
      answer: f.a11,
      links: [{ label: f.linkComparison, href: FAQ_HREF_COMPARISON }],
    },
    { question: f.q12, answer: f.a12 },
    { question: f.q13, answer: f.a13 },
    { question: f.q14, answer: f.a14 },
  ];
}

const FAQSection = () => {
  const { t, lang } = useLanguage();
  /* FAQ copy is keyed only by `lang` via `translations[lang]` in useLanguageState — not `t.faqContent`
   * (object identity can change). eslint-disable: exhaustive-deps wants `t.faqContent` in the array.
   */
  /* eslint-disable react-hooks/exhaustive-deps */
  const faqs = useMemo(() => buildFaqs(t.faqContent), [lang]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
      aria-label={t.sectionAria.faq}
      className="relative section-glass py-20 lg:py-28 overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="cyan" />

      <div className="relative z-10 section-padding-x max-w-4xl mx-auto w-full">
        {/* Section heading */}
        <ScrollFadeUp className="max-w-2xl mb-16 max-md:mx-auto max-md:text-center">
          <div className="flex items-center gap-3 mb-4 max-md:justify-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="hud-label text-cyan-400">{t.faqContent.headingBadge}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {t.faqContent.titleBefore}{' '}
            <span className="text-gradient-gold">{t.faqContent.titleHighlight}</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {t.faqContent.subtitle}
          </p>
        </ScrollFadeUp>

        {/* FAQ accordion */}
        <div ref={listRef} role="list">
          <ScrollStaggerFadeUp className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item bento-card border border-white/8 overflow-hidden" role="listitem">
              <button
                id={`faq-btn-${i}`}
                className="faq-trigger w-full flex items-center justify-between p-5 sm:p-6 md:p-7 text-left group transition-all duration-300"
                aria-expanded={openIndex === i}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                type="button"
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
                      className="inline-flex items-center text-sm font-semibold text-solaris-gold hover:opacity-90 transition-opacity btn-quantum"
                    >
                      {faq.link.label}
                    </a>
                  )}
                  {faq.links && (
                    <div className="flex flex-wrap gap-4">
                      {faq.links.map((l) => {
                        const isInPage = l.href.startsWith('#');
                        return (
                          <a
                            key={l.href}
                            href={l.href}
                            {...(isInPage
                              ? {}
                              : { target: '_blank', rel: 'noopener noreferrer' })}
                            className="inline-flex items-center text-sm font-semibold text-solaris-cyan hover:opacity-80 transition-opacity"
                          >
                            {l.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </div>
            ))}
          </ScrollStaggerFadeUp>
        </div>

        <div className="mt-10 max-w-3xl mx-auto">
          <MeshSkillRibbon variant="compact" saltOffset={1920} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
