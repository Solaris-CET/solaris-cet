import { HelpCircle } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/hooks/useLanguage';

type FaqItem = {
  q: string;
  a: string;
};

export default function FAQSection() {
  const { lang } = useLanguage();
  const isRo = lang === 'ro';

  const faqs: FaqItem[] = isRo
    ? [
        {
          q: 'Cât durează o instalare fotovoltaică?',
          a: 'Depinde de complexitate și de condițiile din teren. După evaluare, îți spunem pașii și termenele realiste (montaj + punere în funcțiune).',
        },
        {
          q: 'Ce informații vă trebuie pentru ofertă?',
          a: 'Locația, consumul (facturi), tipul acoperișului/structurii, orientare/umbriri și ce obiectiv ai (autoconsum, baterie, EV, industrial).',
        },
        {
          q: 'Faceți reparații la acoperiș și infiltrații?',
          a: 'Da. Facem diagnostic și intervenții punctuale (tablă/țiglă/TPO) și putem propune un plan de mentenanță preventivă.',
        },
        {
          q: 'Lucrați și la acoperișuri industriale tip supermarket (folie TPO)?',
          a: 'Da. Montăm și reparăm membrane TPO și acordăm atenție zonelor critice: atice, scurgeri, străpungeri și îmbinări.',
        },
        {
          q: 'Oferiți mentenanță pentru fotovoltaice?',
          a: 'Da. Putem face verificări periodice, monitorizare și intervenții atunci când apar probleme (în funcție de proiect).',
        },
        {
          q: 'Acoperiți toată România?',
          a: 'Da. Suntem în Cetatuia, Vaslui, dar putem lucra în toate județele, în funcție de proiect.',
        },
      ]
    : [
        {
          q: 'How long does a PV installation take?',
          a: 'It depends on complexity and site conditions. After a survey, we provide clear steps and realistic timelines (installation + commissioning).',
        },
        {
          q: 'What do you need for an offer?',
          a: 'Location, consumption (bills), roof/structure type, orientation/shading, and your goal (self-consumption, battery, EV, industrial).',
        },
        {
          q: 'Do you handle roof repairs and leaks?',
          a: 'Yes. We diagnose and fix targeted issues (metal/tiles/TPO) and can propose a preventive maintenance plan.',
        },
        {
          q: 'Do you work on industrial roofs (TPO membrane)?',
          a: 'Yes. We install and repair TPO membranes and focus on critical details: parapets, drains, penetrations, and seams.',
        },
        {
          q: 'Do you provide PV maintenance?',
          a: 'Yes. We can do periodic checks, monitoring, and interventions when issues occur (depending on the project).',
        },
        {
          q: 'Do you work nationwide in Romania?',
          a: 'Yes. We are based in Cetatuia, Vaslui, and we can work nationwide depending on the project.',
        },
      ];

  return (
    <section className="py-24 bg-slate-900/40">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <HelpCircle className="h-5 w-5 text-solaris-gold" aria-hidden />
          </span>
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">{isRo ? 'Întrebări frecvente' : 'FAQ'}</h2>
            <p className="mt-2 text-solaris-muted">
              {isRo
                ? 'Răspunsuri scurte și clare despre servicii, ofertare și execuție.'
                : 'Short, clear answers about services, offers, and delivery.'}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-4 sm:p-6">
          <Accordion type="single" collapsible>
            {faqs.map((x) => (
              <AccordionItem key={x.q} value={x.q} className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="text-left">{x.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-solaris-muted leading-relaxed">{x.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="/contact" className="btn-filled-gold inline-flex items-center gap-2">
            {isRo ? 'Cere ofertă' : 'Request an offer'}
          </a>
          <a href="tel:+40769889721" className="btn-outline-white inline-flex items-center gap-2">
            +40 769 889 721
          </a>
        </div>
      </div>
    </section>
  );
}
