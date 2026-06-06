import { ArrowRight, Building2, Home, PlugZap } from 'lucide-react';

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
import SolarAiAssistantSection from '@/sections/SolarAiAssistantSection';
import SolarCompetitionSection from '@/sections/SolarCompetitionSection';
import SolarIntelligenceSection from '@/sections/SolarIntelligenceSection';
import SolarSecuritySection from '@/sections/SolarSecuritySection';
import TrustProcessSection from '@/sections/TrustProcessSection';
import TrustSignalsStrip from '@/sections/TrustSignalsStrip';

export default function HomePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip"
    >
      <section id="hero" className="relative z-10">
        <ErrorBoundary>
          <HeroSection />
        </ErrorBoundary>
      </section>

      <TrustSignalsStrip />

      <section className="relative z-20">
        <ScrollFadeUp>
          <ServicesSection />
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

      <SolarAiAssistantSection />

      <SolarIntelligenceSection />

      <SolarCompetitionSection />

      <SolarSecuritySection />

      <CompanyFaqSection />

      <section id="proiecte" className="py-24 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Lucrări reprezentative</h2>
              <p className="text-slate-400 text-lg">Exemple orientative de proiecte. Pentru ofertă exactă, evaluăm la locație.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="/proiecte" className="text-amber-300 font-bold flex items-center gap-2 hover:underline">
                Vezi toate proiectele <ArrowRight size={16} />
              </a>
              <a href="/contact" className="text-amber-400 font-bold flex items-center gap-2 hover:underline">
                Cere ofertă <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Fotovoltaice rezidențial',
                text: 'Sistem dimensionat pe consum, orientare și umbriri, cu monitorizare.',
                icon: PlugZap,
                img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20of%20a%20modern%20Romanian%20house%20roof%20with%20black%20solar%20panels%20installed%2C%20clean%20cabling%2C%20golden%20hour%20light%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
                alt: 'Panouri fotovoltaice montate pe acoperiș rezidențial',
              },
              {
                title: 'Acoperiș industrial TPO',
                text: 'Detalii corecte la atice/străpungeri și etanșare profesionistă.',
                icon: Building2,
                img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20of%20an%20industrial%20flat%20roof%20with%20white%20TPO%20membrane%20installation%2C%20clean%20details%20around%20parapets%20and%20penetrations%2C%20modern%20warehouse%20background%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
                alt: 'Acoperiș industrial cu folie TPO, detalii de etanșare executate corect',
              },
              {
                title: 'Acoperiș tablă / țiglă metalică',
                text: 'Montaj curat, finisaje moderne și detalii rezistente.',
                icon: Home,
                img: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20professional%20photo%20close-up%20of%20a%20standing%20seam%20metal%20roof%20on%20a%20modern%20house%2C%20clean%20lines%2C%20premium%20finish%2C%20high%20detail%2C%20no%20people%2C%20no%20logos%2C%20no%20text&image_size=landscape_16_9',
                alt: 'Acoperiș din tablă tip standing seam',
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <AppImage
                      src={p.img}
                      alt={p.alt}
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
                    <div className="mt-4 text-lg font-semibold text-white">{p.title}</div>
                    <div className="mt-2 text-sm text-slate-400 leading-relaxed">{p.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact-promo" className="py-24 bg-amber-400">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">
           <h2 className="text-4xl md:text-6xl font-black text-black mb-8">Cere o ofertă</h2>
           <p className="text-black/80 text-xl font-bold mb-12 max-w-2xl mx-auto">
             Îți răspundem rapid cu pașii următori: evaluare, ofertă și planificare execuție.
           </p>
           <a 
             href="/contact" 
             className="inline-block bg-black text-white text-xl font-bold py-5 px-12 rounded-2xl hover:scale-105 transition-transform"
           >
             Contactează-ne
           </a>
        </div>
      </section>

      <div data-testid="footer-landmark-section" className="relative z-[113]">
        <SolarisFooter />
      </div>
    </main>
  );
}
