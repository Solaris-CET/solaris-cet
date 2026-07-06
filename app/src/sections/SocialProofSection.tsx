import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Quote, Star, Users, Award, ThumbsUp, Shield } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Testimonial = {
  name: string;
  location: string;
  service: string;
  rating: number;
  text: string;
  date: string;
};

function clampScore(v: number): number {
  return Math.max(1, Math.min(5, Math.round(v)));
}

function useCountUp(target: number, duration: number, triggerRef: React.RefObject<HTMLDivElement | null>): number {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef, started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return count;
}

export default function SocialProofSection() {
  const prefersReducedMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: prefersReducedMotion ? 0 : 25 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const yearsCount = useCountUp(8, 1500, statsRef);
  const projectsCount = useCountUp(200, 2000, statsRef);
  const ratingCount = useCountUp(49, 1200, statsRef);
  const warrantyCount = useCountUp(10, 1000, statsRef);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => setTestimonials(data.testimonials ?? []))
      .catch(() => {});
  }, []);

  const partnerQuotes = useMemo(() => {
    return [
      {
        quote: 'Oferta pornește din consum, acoperiș și condițiile reale din teren, nu dintr-un pachet generic aruncat pe site.',
        name: 'Ofertare clară',
        role: 'Proces comercial',
        score: 5,
      },
      {
        quote: 'Lucrările sunt prezentate cu tipul proiectului, provocarea rezolvată și pasul următor, astfel încât clientul înțelege rapid dacă suntem potriviți.',
        name: 'Dovezi utile',
        role: 'Portofoliu + studii de caz',
        score: 5,
      },
      {
        quote: 'Canalele rapide rămân vizibile pe tot parcursul paginii: telefon, WhatsApp și formularul de ofertă.',
        name: 'Conversie directă',
        role: 'Contact simplu',
        score: 5,
      },
    ];
  }, []);

  return (
    <section id="social-proof" aria-label="Testimoniale și semnale de încredere" className="relative section-glass section-padding-y overflow-hidden mesh-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-10" />
        <div className="absolute -top-24 left-1/2 h-72 w-[min(96vw,880px)] -translate-x-1/2 rounded-full bg-solaris-gold/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-12%] h-[420px] w-[420px] rounded-full bg-solaris-cyan/8 blur-[140px]" />
      </div>

      <div className="relative z-10 section-padding-x mx-auto w-full max-w-6xl">
        <ScrollFadeUp className="max-w-2xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Quote className="w-5 h-5 text-solaris-gold" aria-hidden />
            </div>
            <span className="hud-label text-solaris-gold">TESTIMONIALE</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(26px,3.2vw,44px)] text-solaris-text">
            Feedback pe care îl caută un client înainte să ceară oferta
          </h2>
          <p className="mt-3 text-solaris-muted text-sm leading-relaxed">
            Secțiunea combină feedback orientativ din lucrări similare cu semnale concrete de încredere: claritate în ofertare,
            execuție ordonată și contact rapid.
          </p>
        </ScrollFadeUp>

        {/* Trust statistics */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <Award className="h-8 w-8 text-amber-400 mx-auto mb-2" aria-hidden />
            <div className="text-3xl font-black text-white">{yearsCount}+</div>
            <div className="text-xs text-solaris-muted mt-1">ani experiență</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <Users className="h-8 w-8 text-amber-400 mx-auto mb-2" aria-hidden />
            <div className="text-3xl font-black text-white">{projectsCount}+</div>
            <div className="text-xs text-solaris-muted mt-1">proiecte finalizate</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <ThumbsUp className="h-8 w-8 text-amber-400 mx-auto mb-2" aria-hidden />
            <div className="text-3xl font-black text-white">{ratingCount / 10}.{ratingCount % 10}/5</div>
            <div className="text-xs text-solaris-muted mt-1">rating clienți</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <Shield className="h-8 w-8 text-amber-400 mx-auto mb-2" aria-hidden />
            <div className="text-3xl font-black text-white">{warrantyCount} ani</div>
            <div className="text-xs text-solaris-muted mt-1">garanție</div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-solaris-muted">
                Feedback clienți ({testimonials.length})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
                  aria-label="Următor"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>

            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {testimonials.map((t, idx) => {
                  const score = clampScore(t.rating);
                  const isExpanded = expandedIndex === idx;
                  const truncated = t.text.length > 120 && !isExpanded;
                  const displayText = truncated ? t.text.slice(0, 120) + '...' : t.text;
                  return (
                    <div
                      key={`${t.name}-${idx}`}
                      className="min-w-0 flex-[0_0_92%] sm:flex-[0_0_70%] lg:flex-[0_0_62%] pr-4"
                    >
                      <div className="bento-card p-6 border border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-solaris-muted">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < score ? 'text-solaris-gold' : 'text-white/15'}`}
                                aria-hidden
                              />
                            ))}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">Solaris CET</div>
                        </div>
                        <p className="mt-4 text-solaris-text leading-relaxed">
                          “{displayText}”
                        </p>
                        {t.text.length > 120 && (
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            {isExpanded ? 'Citește mai puțin' : 'Citește mai mult'}
                          </button>
                        )}
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-solaris-text truncate">{t.name}</div>
                            <div className="text-xs text-solaris-muted truncate">{t.location} · {t.service}</div>
                          </div>
                          <div className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-solaris-gold font-mono">
                            {t.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p.slice(0, 1).toUpperCase())
                              .join('')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-solaris-muted mb-3">
              Semnale de încredere
            </div>
            <div className="space-y-3">
              {partnerQuotes.map((q, idx) => (
                <div key={`${q.name}-${idx}`} className="bento-card p-5 border border-white/10">
                  <p className="text-solaris-text text-sm leading-relaxed">“{q.quote}”</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-solaris-text truncate">{q.name}</div>
                      <div className="text-xs text-solaris-muted truncate">{q.role}</div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-solaris-cyan/20 bg-solaris-cyan/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-solaris-cyan">
                      {clampScore(q.score)}/5
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Google Reviews badge */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-amber-400">G</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Google Reviews</div>
                  <div className="flex items-center gap-1 text-xs text-solaris-muted">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400" aria-hidden />
                    ))}
                    <span className="ml-1">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
