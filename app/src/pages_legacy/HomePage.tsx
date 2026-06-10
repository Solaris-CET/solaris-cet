import { ArrowRight, BadgeCheck, Building2, Home, PlugZap } from 'lucide-react';

import AppImage from '@/components/AppImage';
import { SolarisFooter } from '@/components/company/SolarisFooter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { SolarisLogoMark } from '@/components/SolarisLogoMark';
import CompanyFaqSection from '@/sections/CompanyFaqSection';
import EquipmentPartnersSection from '@/sections/EquipmentPartnersSection';
import HeroSection from '@/sections/HeroSection';
import ProductsSection from '@/sections/ProductsSection';
import ServicesSection from '@/sections/ServicesSection';
import SolarCompetitionSection from '@/sections/SolarCompetitionSection';
import SolarIntelligenceSection from '@/sections/SolarIntelligenceSection';
import SolarSecuritySection from '@/sections/SolarSecuritySection';
import TrustProcessSection from '@/sections/TrustProcessSection';
import TrustSignalsStrip from '@/sections/TrustSignalsStrip';

const proofPillars = [
  {
    title: 'Mesaj clar pentru client',
    text: 'Spunem din primul ecran ce facem, unde lucrăm și care este următorul pas: evaluare, ofertă, execuție.',
  },
  {
    title: 'Ofertă pe situația reală',
    text: 'Consumul, acoperișul, umbririle și tipul proiectului dictează soluția. Nu vindem un pachet generic tuturor.',
  },
  {
    title: 'Execuție curată, fără improvizații',
    text: 'Montaj ordonat, detalii corecte și suport după lucrare, atât pentru fotovoltaice, cât și pentru acoperișuri.',
  },
] as const;

const projectCards = [
  {
    title: 'Fotovoltaice rezidențial',
    text: 'Sistem dimensionat pe consum, orientare și umbriri, cu monitorizare și punere în funcțiune.',
    icon: PlugZap,
    img: '/images/hero-solaris.svg',
    alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
  },
  {
    title: 'Acoperiș industrial TPO',
    text: 'Detalii corecte la atice și străpungeri, cu etanșare profesionistă și plan de intervenție clar.',
    icon: Building2,
    img: '/images/team-placeholder.svg',
    alt: 'Acoperiș industrial cu folie TPO, detalii de etanșare executate corect',
  },
  {
    title: 'Acoperiș tablă / țiglă metalică',
    text: 'Montaj curat, accesorii corecte și finisaje rezistente pentru proiecte rezidențiale sau comerciale.',
    icon: Home,
    img: '/og-image.png',
    alt: 'Acoperiș din tablă tip standing seam',
  },
] as const;

export default function HomePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-24 md:pb-0"
    >
      <section id="hero" className="relative z-10">
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>
      </section>

      <TrustSignalsStrip />

      <section className="relative z-20 bg-[#07101c] py-18 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <div data-reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/90 backdrop-blur">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                De ce Solaris CET
              </div>
              <h2 className="mt-5 text-3xl font-bold text-white md:text-5xl">Un homepage care inspiră încredere înainte să ceri oferta</h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
                Clientul vede rapid lucrările relevante, înțelege diferența dintre tipurile de servicii și ajunge imediat la contact. Exact asta
                trebuie să facă homepage-ul unei firme comerciale locale.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#proiecte" className="btn-outline-white inline-flex items-center gap-2">
                  Vezi lucrări
                  <span aria-hidden>→</span>
                </a>
                <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
                  Cere ofertă
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3" data-reveal-stagger>
              {proofPillars.map((item) => (
                <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                  <div className="text-sm font-black text-white">{item.title}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20">
        <ScrollFadeUp>
          <ServicesSection />
        </ScrollFadeUp>
      </section>

      <section id="proiecte" className="bg-slate-900/40 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 xl:px-12">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between" data-reveal-stagger>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white md:text-5xl">Lucrări reprezentative</h2>
              <p className="mt-4 text-lg text-slate-400">
                Exemple orientative de proiecte. Pentru oferta exactă, evaluăm consumul, acoperișul și condițiile reale din teren.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="/proiecte" className="flex items-center gap-2 font-bold text-amber-300 hover:underline">
                Vezi toate proiectele <ArrowRight size={16} />
              </a>
              <a href="/contact" className="flex items-center gap-2 font-bold text-amber-400 hover:underline">
                Cere ofertă <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3" data-reveal-stagger>
            {projectCards.map((project) => {
              const Icon = project.icon;
              return (
                <article key={project.title} className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <AppImage
                      src={project.img}
                      alt={project.alt}
                      className="h-full w-full object-cover"
                      width={1280}
                      height={800}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur">
                      Vizual orientativ
                    </div>
                    <div className="pointer-events-none absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur">
                      <SolarisLogoMark className="h-7 w-7 text-orange-300" aria-hidden />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Icon className="h-5 w-5 text-amber-400" aria-hidden />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-white">{project.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-400">{project.text}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-20">
        <ScrollFadeUp>
          <TrustProcessSection />
        </ScrollFadeUp>
      </section>

      <section className="relative z-20">
        <ScrollFadeUp>
          <ProductsSection />
        </ScrollFadeUp>
      </section>

      <section className="relative z-20">
        <ScrollFadeUp>
          <EquipmentPartnersSection />
        </ScrollFadeUp>
      </section>

      <section className="relative z-20">
        <ScrollFadeUp>
          <SolarIntelligenceSection />
        </ScrollFadeUp>
      </section>

      <SolarCompetitionSection />

      <SolarSecuritySection />

      <CompanyFaqSection />

      <section id="contact-promo" className="bg-amber-400 py-24">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8" data-reveal>
          <h2 className="mb-8 text-4xl font-black text-black md:text-6xl">Cere o ofertă</h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl font-bold text-black/80">
            Îți răspundem rapid cu pașii următori: evaluare, ofertă și planificare execuție.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-2xl bg-black px-12 py-5 text-xl font-bold text-white transition-transform hover:scale-105"
          >
            Contactează-ne
          </a>
        </div>
      </section>

      <div data-testid="footer-landmark-section" className="relative z-[113]">
        <SolarisFooter />
      </div>

      <div className="fixed inset-x-3 bottom-3 z-[140] md:hidden">
        <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-white/10 bg-[#050914]/90 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <a
            href="tel:+40769889721"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white/5 px-3 text-center text-xs font-black text-white"
            aria-label="Sună acum"
          >
            Sună acum
          </a>
          <a
            href="https://wa.me/40769889721?text=Bun%C4%83%20ziua%2C%20vreau%20o%20ofert%C4%83%20pentru%20fotovoltaice%20sau%20acoperi%C8%99.%20V%C4%83%20pot%20trimite%20poze."
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white/5 px-3 text-center text-xs font-black text-white"
            rel="noopener"
          >
            WhatsApp
          </a>
          <a
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-center text-xs font-black text-black"
          >
            Cere ofertă
          </a>
        </div>
      </div>
    </main>
  );
}
