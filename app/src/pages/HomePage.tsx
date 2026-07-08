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
import SocialProofSection from '@/sections/SocialProofSection';
import SolarCompetitionSection from '@/sections/SolarCompetitionSection';
import SolarIntelligenceSection from '@/sections/SolarIntelligenceSection';
import SolarSecuritySection from '@/sections/SolarSecuritySection';
import TrustProcessSection from '@/sections/TrustProcessSection';
import TrustSignalsStrip from '@/sections/TrustSignalsStrip';

const proofPillars = [
  {
    title: 'Ofertare bazată pe situația reală',
    text: 'Cerem consumul, pozele și localitatea ca să dimensionăm corect proiectul, nu să împingem un pachet generic tuturor.',
  },
  {
    title: 'Execuție curată și lizibilă',
    text: 'Punem accent pe trasee ordonate, detalii corecte, etanșări și o predare clară, atât la fotovoltaice, cât și la acoperișuri.',
  },
  {
    title: 'Canale rapide de decizie',
    text: 'Telefon, WhatsApp, formular fără JS și portofoliu orientativ, astfel încât clientul să știe rapid dacă suntem potriviți.',
  },
] as const;

const credibilityCards = [
  {
    title: 'Ce primești înainte de lucrare',
    bullets: ['evaluare inițială clară', 'explicații pe înțeles', 'pași de execuție și repere de buget'],
  },
  {
    title: 'Ce verificăm în teren',
    bullets: ['consum și profil de utilizare', 'orientare, umbriri și tip acoperiș', 'zone critice: dolii, atice, scurgeri, străpungeri'],
  },
  {
    title: 'Cum reducem riscul',
    bullets: ['nu promitem preț final fără context', 'marcăm imaginile orientative ca atare', 'păstrăm contactul direct și rapid'],
  },
] as const;

const projectCards = [
  {
    title: 'Fotovoltaic rezidențial 5–8 kWp',
    text: 'Pentru case cu autoconsum stabil: dimensionare pe consum, montaj pe tablă sau țiglă și configurare monitorizare.',
    icon: PlugZap,
    img: 'https://images.unsplash.com/photo-1545209463-e2825498edbf?w=1600&q=80&auto=format&fit=crop',
    alt: 'Sistem fotovoltaic rezidențial — panouri montate pe acoperiș de casă, montaj curat',
  },
  {
    title: 'Acoperiș industrial TPO',
    text: 'Reparații și refaceri pentru hale: atice, scurgeri, străpungeri și detalii care opresc infiltrațiile recurente.',
    icon: Building2,
    img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=1600&q=80&auto=format&fit=crop',
    alt: 'Acoperiș industrial cu membrană TPO și panouri fotovoltaice — hală comercială',
  },
  {
    title: 'Tablă click / țiglă metalică',
    text: 'Montaj și reparații pentru acoperișuri cu geometrie variată, cu accent pe dolii, coame, borduri și drenaj corect.',
    icon: Home,
    img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&q=80&auto=format&fit=crop',
    alt: 'Detaliu montaj acoperiș din tablă cu fălțuri și dolii — execuție profesională',
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

          <div className="mt-8 grid gap-4 lg:grid-cols-3" data-reveal-stagger>
            {credibilityCards.map((card) => (
              <article key={card.title} className="rounded-3xl border border-white/10 bg-black/25 p-6">
                <h3 className="text-base font-black text-white">{card.title}</h3>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-300">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
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
          <SocialProofSection />
        </ScrollFadeUp>
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
