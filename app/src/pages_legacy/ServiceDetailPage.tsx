import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardList, Clock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion } from '@/components/FaqAccordion';
import { getServiceDetail } from '@/lib/serviceDetails';

export default function ServiceDetailPage({ slug }: { slug: string }) {
  const service = useMemo(() => getServiceDetail(slug), [slug]);

  if (!service) {
    return (
      <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 xl:px-12">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
            <h1 className="text-3xl font-bold">Serviciu indisponibil</h1>
            <p className="mt-3 text-slate-300">Pagina nu există. Revino la lista de servicii.</p>
            <a href="/servicii" className="mt-6 inline-flex rounded-2xl bg-amber-400 px-7 py-4 text-black font-black">Vezi servicii</a>
          </div>
        </div>
        <div className="mt-16"><SolarisFooter /></div>
      </main>
    );
  }

  const contactHref = `/contact?service=${encodeURIComponent(service.contactServiceParam)}`;
  const trust = [
    {
      title: 'Evaluare + ofertă clară',
      body: 'Îți explicăm soluția tehnică și pașii de execuție, pe înțeles.',
      icon: ClipboardList,
    },
    {
      title: 'Execuție curată',
      body: 'Detalii corecte, protecții, etanșări și o lucrare care arată bine la predare.',
      icon: ShieldCheck,
    },
    {
      title: 'Răspuns rapid',
      body: 'Confirmăm rapid pașii următori și planificăm realist.',
      icon: Clock,
    },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="pt-24 pb-0 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-[11px] font-bold tracking-wider text-amber-300">
            <BadgeCheck className="h-4 w-4" aria-hidden />
            SERVICIU
          </div>
          <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold tracking-tight">{service.title}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-3xl">{service.subtitle}</p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {trust.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                      <Icon className="h-5 w-5 text-amber-300" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">{t.title}</div>
                      <div className="mt-1 text-sm text-slate-300 leading-relaxed">{t.body}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href={contactHref} className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-7 py-4 text-black font-black">
              Cere ofertă gratuită <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
            <a href="tel:+40769889721" className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-7 py-4 text-white font-semibold hover:bg-white/5">
              ☎ Sună acum
            </a>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-2xl font-bold">Ce include</h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.bullets.map((x) => (
                  <div key={x} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="h-5 w-5 text-amber-300 mt-0.5" aria-hidden />
                    <div className="text-sm text-slate-200 leading-relaxed">{x}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-2xl font-bold">FAQ</h2>
              <div className="mt-5">
                <FaqAccordion items={service.faq} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/30 p-7">
              <div className="text-sm font-semibold text-white">Vă contactăm în 24 de ore</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">Trimite cererea și revenim cu pașii următori.</div>
              <a href={contactHref} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-6 py-4 text-black font-black">
                Cere ofertă
              </a>
              <div className="mt-4 text-xs text-slate-400">Preferi să suni? +40 769 889 721</div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-white/60">Proces</div>
                <ol className="mt-3 space-y-2 text-sm text-slate-200">
                  {['Evaluare la locație', 'Ofertă & plan', 'Execuție', 'Punere în funcțiune'].map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
