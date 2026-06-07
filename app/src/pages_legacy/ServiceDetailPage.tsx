import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardList, Clock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { FaqAccordion } from '@/components/FaqAccordion';
import { getServiceDetail } from '@/lib/serviceDetails';

function MiniBarChart({ title, labels, values }: { title: string; labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">{title}</div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${labels.length * 18} 56`} className="w-full h-14" role="img" aria-label={title} preserveAspectRatio="none">
          {values.map((v, i) => {
            const h = Math.max(2, Math.round((v / max) * 50));
            const x = i * 18 + 4;
            const y = 54 - h;
            return <rect key={`${labels[i]}-${i}`} x={x} y={y} width={10} height={h} rx={3} fill="rgba(245,158,11,0.65)" />;
          })}
        </svg>
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 text-[10px] text-white/55 font-mono">
          {labels.map((l) => (
            <div key={l} className="text-center truncate">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-10" data-reveal-stagger>
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
            {service.highlights?.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
                <h2 className="text-2xl font-bold">Estimare orientativă</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Repere rapide (orientative). Oferta finală depinde de evaluare, condițiile locației și obiectiv (autoconsum, baterie, intervenție locală etc.).
                </p>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {service.highlights.map((x) => (
                    <div key={x.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">{x.label}</div>
                      <div className="mt-1 text-sm text-white/85 font-semibold">{x.value}</div>
                    </div>
                  ))}
                </div>
                {service.chart ? (
                  <div className="mt-5">
                    <MiniBarChart title={service.chart.title} labels={service.chart.labels} values={service.chart.values} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {service.longDescription?.length ? (
              <div className={service.highlights?.length ? 'mt-8 rounded-3xl border border-white/10 bg-white/5 p-7' : 'rounded-3xl border border-white/10 bg-white/5 p-7'} data-reveal>
                <h2 className="text-2xl font-bold">Descriere</h2>
                <div className="mt-4 space-y-4 text-sm text-slate-200/90 leading-relaxed">
                  {service.longDescription.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {service.steps?.length ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
                <h2 className="text-2xl font-bold">Pași de lucru</h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.steps.map((s) => (
                    <div key={s.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-sm font-bold text-white">{s.title}</div>
                      <div className="mt-1 text-sm text-slate-300 leading-relaxed">{s.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={service.highlights?.length ? 'mt-8 rounded-3xl border border-white/10 bg-white/5 p-7' : 'rounded-3xl border border-white/10 bg-white/5 p-7'} data-reveal>
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

            {service.pricing?.length ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal-stagger>
                <h2 className="text-2xl font-bold">Preț orientativ</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Repere orientative. Oferta finală depinde de evaluare, acces, detalii și configurație.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.pricing.map((p) => (
                    <div key={p.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">{p.label}</div>
                      <div className="mt-1 text-sm font-semibold text-white/85">{p.value}</div>
                      {p.note ? <div className="mt-2 text-xs text-slate-400 leading-relaxed">{p.note}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {service.warranty?.length ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal>
                <h2 className="text-2xl font-bold">Garanții & mentenanță</h2>
                <div className="mt-5 space-y-3">
                  {service.warranty.map((x) => (
                    <div key={x} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <CheckCircle2 className="h-5 w-5 text-amber-300 mt-0.5" aria-hidden />
                      <div className="text-sm text-slate-200 leading-relaxed">{x}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7" data-reveal>
              <h2 className="text-2xl font-bold">FAQ</h2>
              <div className="mt-5">
                <FaqAccordion items={service.faq} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/30 p-7" data-reveal-stagger>
              <div className="text-sm font-semibold text-white">Vă contactăm în 24 de ore</div>
              <div className="mt-2 text-sm text-slate-300 leading-relaxed">Trimite cererea și revenim cu pașii următori.</div>
              <a href={contactHref} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-6 py-4 text-black font-black">
                Cere ofertă
              </a>
              <a
                href="/calculator"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-bold hover:bg-white/10"
              >
                Calculează economiile <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
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
