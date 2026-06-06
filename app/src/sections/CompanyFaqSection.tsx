import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';

const items: FaqItem[] = [
  {
    question: 'Cât durează instalarea unui sistem fotovoltaic?',
    answer:
      'În funcție de complexitate și acces, montajul poate dura de la 1–3 zile pentru rezidențial. Pentru industrial, durata se stabilește după evaluare și planificare.',
  },
  {
    question: 'Cât durează până se amortizează investiția în fotovoltaic?',
    answer:
      'Depinde de consum, prețul energiei, autoconsum și configurație (cu/ fără baterie). Îți estimăm realist scenariile după consumul tău și condițiile locației.',
  },
  {
    question: 'Ce acte/informații vă trebuie pentru ofertă?',
    answer:
      'Locația, consumul (facturi), tipul acoperișului/structurii, orientarea și eventualele umbre, plus obiectivul (autoconsum, baterie, EV).',
  },
  {
    question: 'Ce garanție oferă Solaris CET?',
    answer:
      'Garanțiile depind de echipamente (producător) și de condițiile de montaj. Îți trecem clar în ofertă garanția echipamentelor și garanția de manoperă.',
  },
  {
    question: 'Ce garanție au panourile și invertoarele?',
    answer:
      'Garanția diferă în funcție de producător și model (produs + performanță). În ofertă includem condițiile de garanție și recomandările de exploatare.',
  },
  {
    question: 'Pot adăuga baterie mai târziu?',
    answer:
      'Da, în multe cazuri. Recomandăm să alegem o arhitectură compatibilă (hibrid sau soluție ulterioară) și să pregătim spațiul și protecțiile necesare.',
  },
  {
    question: 'Se poate monta încărcător EV împreună cu fotovoltaicele?',
    answer:
      'Da. Putem configura încărcarea în funcție de surplusul de producție și de consumul casei, pentru a crește autoconsumul.',
  },
  {
    question: 'Pot beneficia de programul Casa Verde?',
    answer:
      'Eligibilitatea depinde de ghidul oficial AFM și de ediția curentă. Te ajutăm să înțelegi criteriile și să pregătești pașii necesari.',
  },
  {
    question: 'Cum decurge procesul de lucru?',
    answer:
      'Evaluare (telefon + poze, apoi vizită după caz) → ofertă clară → execuție → punere în funcțiune + instruire.',
  },
  {
    question: 'Funcționează panourile și pe vreme înnorată?',
    answer:
      'Da. Producția scade față de zilele însorite, dar sistemul continuă să genereze energie din lumina difuză.',
  },
  {
    question: 'Ce se întâmplă la o pană de curent?',
    answer:
      'În mod normal, sistemul se oprește pentru siguranța rețelei. Cu soluții de backup (în funcție de echipamente), se pot alimenta circuite selectate.',
  },
  {
    question: 'Aveți montaj iarna?',
    answer:
      'Da, când condițiile meteo și siguranța permit. La acoperiș și TPO, alegem ferestre meteo potrivite pentru un rezultat corect.',
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
    question: 'Se poate monta pe țiglă, tablă click sau acoperiș plat?',
    answer:
      'Da. Alegem prinderi și soluții compatibile cu învelitoarea și detaliile existente, cu atenție pe etanșări și siguranță.',
  },
  {
    question: 'Ce mentenanță recomandăm?',
    answer:
      'Pentru PV: verificări periodice + curățare la nevoie. Pentru acoperiș/TPO: inspecții 1–2 ori/an, curățare scurgeri și verificarea zonelor critice.',
  },
  {
    question: 'Cât costă repararea unui acoperiș?',
    answer:
      'Costul depinde de suprafață, material, acces și zonele afectate (dolie, coamă, străpungeri). Îți oferim o estimare după o evaluare rapidă.',
  },
  {
    question: 'Ce este TPO și când are sens?',
    answer:
      'TPO este o membrană termoplastică folosită frecvent la acoperișuri industriale plate. Are sens la hale/depozite, cu detalii corecte la atice, scurgeri și străpungeri.',
  },
  {
    question: 'Faceți intervenții la infiltrații?',
    answer:
      'Da. Diagnosticăm cauza și propunem soluția potrivită: reparații locale, refacere detalii sau mentenanță preventivă.',
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
