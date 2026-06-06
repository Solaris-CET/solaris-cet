import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

const items: FaqItem[] = [
  {
    question: 'Cât durează instalarea unui sistem fotovoltaic?',
    answer:
      'În funcție de complexitate și acces, montajul poate dura de la 1–3 zile pentru rezidențial. Pentru industrial, durata se stabilește după evaluare și planificare.',
  },
  {
    question: 'Ce garanție oferă Solaris CET?',
    answer:
      'Garanțiile depind de echipamente (producător) și de condițiile de montaj. Îți trecem clar în ofertă garanția echipamentelor și garanția de manoperă.',
  },
  {
    question: 'Pot beneficia de programul Casa Verde?',
    answer:
      'Eligibilitatea depinde de ghidul oficial AFM și de ediția curentă. Te ajutăm să înțelegi criteriile și să pregătești pașii necesari.',
  },
  {
    question: 'Funcționează panourile și pe vreme înnorată?',
    answer:
      'Da. Producția scade față de zilele însorite, dar sistemul continuă să genereze energie din lumina difuză.',
  },
  {
    question: 'Care este durata de viață a panourilor fotovoltaice?',
    answer:
      'Durata de viață este de obicei de ordinul zecilor de ani. Producătorii oferă garanții de performanță pe termen lung; detaliile depind de model.',
  },
  {
    question: 'Aveți nevoie de autorizație pentru montaj fotovoltaic?',
    answer:
      'Depinde de tipul proiectului și de cerințele locale/distribuitor. Îți explicăm ce e necesar pentru cazul tău înainte de începerea lucrării.',
  },
  {
    question: 'Cât costă repararea unui acoperiș?',
    answer:
      'Costul depinde de suprafață, material, acces și zonele afectate (dolie, coamă, străpungeri). Îți oferim o estimare după o evaluare rapidă.',
  },
  {
    question: 'În ce județe lucrați?',
    answer:
      'Suntem bazați în Vaslui și lucrăm frecvent în județele din Moldova (Vaslui, Iași, Bacău, Galați, Vrancea, Botoșani), dar putem prelua proiecte și în alte zone.',
  },
];

export default function CompanyFaqSection() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12">
        <div className="max-w-2xl" data-reveal>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Întrebări frecvente</h2>
          <p className="mt-4 text-slate-400 text-lg">Răspunsuri scurte la întrebările cele mai comune înainte de ofertare.</p>
        </div>

        <div className="mt-10" data-reveal>
          <FaqAccordion items={items} />
        </div>
      </div>
    </section>
  );
}

export const companyFaqItems = items;
