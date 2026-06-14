import { Search, ChevronDown, ChevronRight, MessageCircle, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { SolarisFooter } from '@/components/company/SolarisFooter';

// ── FAQ Data ────────────────────────────────────────────────────────────────
type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const FAQ_DATA: FaqItem[] = [
  // ── Panouri Fotovoltaice ──────────────────────────────────────────────────
  {
    category: 'Panouri Fotovoltaice',
    question: 'Cât costă un sistem fotovoltaic pentru o casă?',
    answer: `**Prețuri orientative** (fără TVA, include montaj):
- Sistem **3 kW**: ~15.000 – 25.000 RON
- Sistem **5 kW**: ~20.000 – 35.000 RON
- Sistem **10 kW**: ~35.000 – 60.000 RON

Prețul final depinde de tipul acoperișului, distanța de cablare, acces și configurația aleasă (cu/fără baterie). Pentru o ofertă personalizată, contactați-ne.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Câți ani durează să îmi recuperez investiția?',
    answer: `În condiții normale, amortizarea unui sistem fotovoltaic se realizează în **5–8 ani**, în funcție de consum, tarifele locale și gradul de autoconsum. După această perioadă, energia produsă este practic gratuită pentru următorii 15–20 de ani.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Ce se întâmplă pe timp de noapte sau în zile înnorate?',
    answer: `Noaptea, sistemul nu produce energie, iar consumul este acoperit din rețea. În zilele înnorate, producția scade la 10–30% din capacitatea maximă, dar sistemul continuă să genereze energie. Dacă ai baterie, poți folosi energia stocată seara sau în perioadele cu cer acoperit.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Am nevoie de aprobare de la primărie?',
    answer: `În majoritatea cazurilor rezidențiale, nu este necesară autorizație de construire pentru sisteme fotovoltaice montate pe acoperiș. Totuși, pentru anumite imobile (monumente istorice, zone protejate) pot fi necesare avize suplimentare. Noi te informăm de la început ce documente sunt necesare.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Pot stoca energia în baterii?',
    answer: `Da, poți adăuga o baterie pentru a stoca energia produsă în timpul zilei și a o folosi seara sau în perioadele cu consum ridicat. Costul suplimentar al unei baterii este de aproximativ **8.000–18.000 RON**, în funcție de capacitate și tehnologie.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Ce garanție oferă Solaris CET?',
    answer: `**Garanții oferite:**
- **Panouri fotovoltaice**: 10 ani garanție de produs, 25 ani garanție de performanță
- **Invertor**: 5 ani
- **Montaj**: 2 ani

Toate echipamentele respectă standardele europene de calitate.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Cum funcționează programul Casa Verde?',
    answer: `**Casa Verde** este un program finanțat de AFM care oferă o sumă nerambursabilă de până la **20.000 RON** pentru instalarea de panouri fotovoltaice. Pașii principali:
1. Înscrierea în program (perioadă anunțată de AFM)
2. Alegerea unui instalator autorizat (Solaris CET)
3. Depunerea dosarului
4. Montajul sistemului
5. Decontarea sumei

Noi te ajutăm cu întocmirea dosarului și toată documentația tehnică.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Pot rămâne conectat la rețea și cu panouri fotovoltaice?',
    answer: `Da, sistemul funcționează în sistem **on-grid** (conectat la rețea). Energia produsă în plus față de consum este injectată în rețea, iar noaptea sau când producția este insuficientă, consumi din rețea. Poți deveni **prosumator** și beneficiezi de compensare cantitativă (legea 184/2024).`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Ce putere am nevoie pentru casa mea?',
    answer: `Pentru o casă cu un consum mediu de **350 kWh/lună**, un sistem de **5 kW** este de obicei suficient. Pentru un consum mai mare (pompă de căldură, aer condiționat, mașină electrică), poate fi necesar un sistem de **8–10 kW**. Folosește **calculatorul nostru solar** pentru o estimare rapidă.`,
  },
  {
    category: 'Panouri Fotovoltaice',
    question: 'Cât timp durează montajul?',
    answer: `**Durata montajului:**
- **Rezidențial**: 1–3 zile
- **Industrial**: 3–7 zile (în funcție de complexitate)

După montaj, urmează punerea în funcțiune și configurarea aplicației de monitorizare.`,
  },
  // ── Acoperișuri ───────────────────────────────────────────────────────────
  {
    category: 'Acoperișuri',
    question: 'Ce tipuri de acoperiș puteți monta?',
    answer: `**Servicii de acoperișuri:**
- **Tablă zincată** – soluție economică, 30–50 RON/mp
- **Tablă galvanizată** – rezistență sporită, 40–60 RON/mp
- **Țiglă metalică** – aspect premium, 50–80 RON/mp
- **Membrane TPO** – pentru acoperișuri plate industriale, 60–100 RON/mp
- **Sisteme pluviale** – jgheaburi, burlane, accesorii

Toate lucrările includ garanție de execuție.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Cât costă un acoperiș nou pe mp?',
    answer: `**Prețuri orientative** (inclusiv manoperă):
- **Tablă zincată**: 80–130 RON/mp
- **Tablă galvanizată**: 90–140 RON/mp
- **Țiglă metalică**: 100–160 RON/mp
- **Membrană TPO**: 120–180 RON/mp

Prețul final depinde de suprafață, geometria acoperișului, numărul de dolii și accesorii.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Cât durează montajul unui acoperiș?',
    answer: `**Durata montajului:**
- **Casă obișnuită** (100–200 mp): 3–7 zile
- **Hală industrială** (500–1000 mp): 7–14 zile
- **Intervenții rapide** (reparații): 1–2 zile

Termenul exact este stabilit după evaluarea la fața locului.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Garantați împotriva infiltrațiilor?',
    answer: `Da, oferim **garanție de execuție pentru etanșeitate** de **5–10 ani**, în funcție de tipul lucrării și materialele folosite. Garanția acoperă manopera și detaliile executate de noi (coame, dolii, racorduri, atice).`,
  },
  {
    category: 'Acoperișuri',
    question: 'Puteți monta panouri fotovoltaice pe un acoperiș nou?',
    answer: `Da, recomandăm să planificăm montajul panourilor fotovoltaice încă din faza de proiectare a acoperișului. Astfel, putem pregăti traseele de cabluri, prinderile și zonele de etanșare, evitând intervenții costisitoare ulterioare.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Ce diferență este între tabla zincată și cea vopsită?',
    answer: `**Tablă zincată** are un strat de zinc care o protejează împotriva coroziunii, dar aspectul este mat și mai puțin estetic. **Tablă vopsită în câmp electrostatic (PVDF)** are un strat suplimentar de vopsea, oferind o gamă largă de culori RAL și o garanție de 20–30 de ani. Prețul este mai mare, dar durabilitatea și aspectul sunt superioare.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Pot aplica membrana TPO peste un acoperiș existent?',
    answer: `În unele cazuri, da, dacă suportul existent este în stare bună și compatibil cu sistemul TPO. În alte situații, este necesară decopertarea stratului vechi. Evaluăm la fața locului și îți recomandăm soluția optimă.`,
  },
  {
    category: 'Acoperișuri',
    question: 'Ce include un sistem pluvial complet?',
    answer: `Un sistem pluvial complet include:
- **Jgheaburi** (PVC, oțel vopsit sau aluminiu)
- **Burlane** (cu coturi și racorduri)
- **Colțare** și **cleme de fixare**
- **Pâlnii** și **prelungitoare**
- Opțional: **parazăpezi**, **aeratoare**, **ferestre de mansardă**`,
  },
  {
    category: 'Acoperișuri',
    question: 'Cum pot preveni infiltrațiile la acoperiș?',
    answer: `**Mentenanță preventivă:**
- Verifică anual starea tablei, coamelor și dolilor
- Curăță jgheaburile și burlanele de frunze și resturi
- Verifică etanșeitatea la străpungeri (coșuri, ventilații)
- În caz de infiltrație, nu aștepta – o reparație rapidă costă mult mai puțin decât o refacere completă`,
  },
  {
    category: 'Acoperișuri',
    question: 'Lucrați și în afara județului Vaslui?',
    answer: `Da, acoperim toată **Moldova** (Vaslui, Iași, Bacău, Galați, Neamț, Suceava, Botoșani, Vrancea) și proiecte selectate la nivel național. Costul deplasării este inclus în ofertă pentru distanțe rezonabile.`,
  },
  // ── Finanțare ─────────────────────────────────────────────────────────────
  {
    category: 'Finanțare',
    question: 'Cum funcționează programul Casa Verde 2024-2025?',
    answer: `**Casa Verde** este un program finanțat de AFM care oferă o sumă nerambursabilă de până la **20.000 RON** pentru instalarea de panouri fotovoltaice. Pașii principali:
1. Înscrierea în program (perioadă anunțată de AFM)
2. Alegerea unui instalator autorizat (Solaris CET)
3. Depunerea dosarului
4. Montajul sistemului
5. Decontarea sumei

Noi te ajutăm cu întocmirea dosarului și toată documentația tehnică.`,
  },
  {
    category: 'Finanțare',
    question: 'Pot cumula finanțarea AFM cu alte credite?',
    answer: `Da, poți cumula **Casa Verde** cu un credit verde de la bănci partenere (BCR, Raiffeisen, BT, ProCredit). De asemenea, poți accesa **RePowerEU** – fonduri europene care acoperă până la **60%** din costurile eligibile.`,
  },
  {
    category: 'Finanțare',
    question: 'Ce documente sunt necesare pentru Casa Verde?',
    answer: `**Documente necesare:**
- Act de identitate
- Certificat de atestare fiscală
- Actul de proprietate al imobilului
- Ofertă tehnică de la instalator (Solaris CET)
- Factură de energie electrică (pentru dimensionare)
- Declarație pe propria răspundere

Noi pregătim dosarul tehnic complet.`,
  },
  {
    category: 'Finanțare',
    question: 'Cât timp durează aprobarea finanțării?',
    answer: `**Termene orientative:**
- **Casa Verde**: 30–60 de zile de la depunere
- **RePowerEU**: 60–90 de zile
- **Credite verzi**: 5–10 zile lucrătoare

Termenele pot varia în funcție de sesiunea AFM și de complexitatea dosarului.`,
  },
  {
    category: 'Finanțare',
    question: 'Pot accesa finanțare și pentru acoperiș?',
    answer: `În prezent, programele de finanțare (Casa Verde, RePowerEU) sunt destinate exclusiv **sistemelor fotovoltaice** și **bateriilor de stocare**. Pentru acoperișuri, nu există subvenții directe, dar putem include costul acoperișului în oferta generală dacă este necesar pentru montajul panourilor.`,
  },
  // ── General ───────────────────────────────────────────────────────────────
  {
    category: 'General',
    question: 'În ce zone din România activați?',
    answer: `Activăm în principal în **Moldova** (Vaslui, Iași, Bacău, Galați, Neamț, Suceava, Botoșani, Vrancea) și în proiecte selectate la nivel național. Pentru localități mai îndepărtate, evaluăm costul deplasării și îl includem în ofertă.`,
  },
  {
    category: 'General',
    question: 'Cum pot obține o ofertă?',
    answer: `**Modalități de a cere ofertă:**
1. **Formular online** – completează formularul de pe site și te contactăm în 24h
2. **Telefon** – sună la **+40 769 889 721** (L-V 08:00-18:00, S 09:00-14:00)
3. **WhatsApp** – trimite un mesaj la același număr
4. **Email** – scrie la **solaris-cet@protonmail.com**

Pentru o ofertă cât mai exactă, te rugăm să ai la îndemână:
- Localitatea și tipul proprietății
- Consumul lunar (factura de curent)
- Câteva poze cu acoperișul sau zona afectată`,
  },
  {
    category: 'General',
    question: 'Cât de repede primesc răspuns după cererea de ofertă?',
    answer: `**Răspuns comercial:** de regulă în **aceeași zi lucrătoare** sau în maximum **24 de ore**. Pentru urgențe (infiltrații, avarii), încercăm să răspundem în câteva ore.`,
  },
  {
    category: 'General',
    question: 'Ce informații trebuie să vă trimit pentru o ofertă corectă?',
    answer: `**Pentru o ofertă cât mai exactă, te rugăm să trimiți:**
- **Localitatea** și tipul proprietății (casă, hală, spațiu comercial)
- **Consumul lunar** (factura de curent) – pentru fotovoltaice
- **Suprafața** și **problema principală** – pentru acoperișuri
- **2–5 poze relevante** cu acoperișul sau zona afectată
- **Termenul dorit** și dacă există urgență`,
  },
  {
    category: 'General',
    question: 'Acceptați plata în rate?',
    answer: `Da, oferim posibilitatea de plată în **rate fără dobândă** prin parteneri bancari. De asemenea, poți accesa **Casa Verde** (finanțare nerambursabilă) sau **RePowerEU** (fonduri europene). Detalii complete la cererea de ofertă.`,
  },
  {
    category: 'General',
    question: 'Cum pot contacta serviciul clienți?',
    answer: `**Date de contact:**
- **Telefon:** +40 769 889 721
- **Email:** solaris-cet@protonmail.com
- **WhatsApp:** +40 769 889 721
- **Program:** L-V 08:00-18:00, S 09:00-14:00
- **Adresă:** Cetățuia, Vaslui, România`,
  },
];

// ── Helper functions ─────────────────────────────────────────────────────────
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-amber-400/30 text-amber-200">$1</mark>');
}

function renderAnswer(answer: string): string {
  // Simple markdown-like rendering: bold, lists
  let html = answer
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br />');
  return html;
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Panouri Fotovoltaice', 'Acoperișuri', 'Finanțare', 'General'];

// ── Component ────────────────────────────────────────────────────────────────
export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CATEGORIES.forEach((cat) => { initial[cat] = false; });
    initial['Panouri Fotovoltaice'] = true; // First category open by default
    return initial;
  });
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter questions based on search
  const filteredQuestions = useMemo(() => {
    if (!debouncedQuery.trim()) return FAQ_DATA;
    const q = debouncedQuery.toLowerCase();
    return FAQ_DATA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [debouncedQuery]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, FaqItem[]> = {};
    CATEGORIES.forEach((cat) => { groups[cat] = []; });
    for (const item of filteredQuestions) {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    }
    return groups;
  }, [filteredQuestions]);

  const hasResults = filteredQuestions.length > 0;

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const toggleQuestion = useCallback((question: string) => {
    setOpenQuestions((prev) => ({ ...prev, [question]: !prev[question] }));
  }, []);

  const handleAiFallback = useCallback(async () => {
    if (!debouncedQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Întrebare din FAQ: "${debouncedQuery}". Răspunde în română, concis (max 150 cuvinte), ca un consultant Solaris CET.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content || 'Ne pare rău, nu am putut genera un răspuns.');
    } catch {
      setAiResponse('Momentan serviciul AI nu e disponibil. Încearcă mai târziu.');
    } finally {
      setAiLoading(false);
    }
  }, [debouncedQuery]);

  // Schema.org JSON-LD (first 15 questions)
  const schemaJsonLd = useMemo(() => {
    const first15 = FAQ_DATA.slice(0, 15);
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: first15.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^- /gm, '').replace(/\n/g, ' '),
        },
      })),
    };
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
      <Helmet>
        <title>Întrebări frecvente — Solaris CET</title>
        <meta name="description" content="Întrebări frecvente despre panouri fotovoltaice, acoperișuri, finanțare și servicii Solaris CET." />
        <script type="application/ld+json">{JSON.stringify(schemaJsonLd)}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10" data-reveal>
          <h1 className="font-display font-bold bg-gradient-to-r from-solar-yellow to-amber-500 bg-clip-text text-transparent text-[length:var(--text-h1)] leading-[var(--lh-display)]">
            Întrebări frecvente
          </h1>
          <p className="mt-4 text-lg text-solaris-muted max-w-2xl mx-auto">
            Găsește rapid răspunsuri la cele mai comune întrebări despre serviciile noastre.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8" data-reveal-stagger>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" aria-hidden />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Caută în întrebări..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white outline-none transition-colors placeholder:text-white/35 focus:border-amber-400"
            aria-label="Caută în întrebări"
          />
        </div>

        {/* AI Fallback */}
        {!hasResults && debouncedQuery.trim() && (
          <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5" data-reveal>
            <p className="text-sm text-amber-200 mb-3">
              Nu am găsit rezultate pentru "{debouncedQuery}". Întreabă asistentul AI:
            </p>
            {aiResponse ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80 leading-relaxed mb-3">
                <p className="text-xs text-amber-400 mb-2">Răspuns Solarix:</p>
                {aiResponse}
              </div>
            ) : null}
            <button
              type="button"
              disabled={aiLoading}
              onClick={handleAiFallback}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {aiLoading ? 'Se caută...' : 'Întreabă Solarix 🤖'}
            </button>
            <a
              href="/contact"
              className="ml-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Cere ofertă dacă nu am răspuns
            </a>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="space-y-6" data-reveal-stagger>
          {CATEGORIES.map((category) => {
            const items = groupedByCategory[category] || [];
            if (items.length === 0 && !debouncedQuery.trim()) return null;
            if (items.length === 0) return null;
            const isCategoryOpen = openCategories[category] ?? false;

            return (
              <div key={category} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-lg font-bold text-white hover:bg-white/5 transition-colors"
                  aria-expanded={isCategoryOpen}
                >
                  <span>{category}</span>
                  {isCategoryOpen ? (
                    <ChevronDown className="h-5 w-5 text-amber-400" aria-hidden />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-amber-400" aria-hidden />
                  )}
                </button>
                {isCategoryOpen && (
                  <div className="px-6 pb-4 space-y-2">
                    {items.map((item) => {
                      const isOpen = openQuestions[item.question] ?? false;
                      const highlightedQuestion = debouncedQuery.trim()
                        ? highlightText(item.question, debouncedQuery)
                        : item.question;
                      return (
                        <div key={item.question} className="rounded-2xl border border-white/10 bg-black/20">
                          <button
                            type="button"
                            onClick={() => toggleQuestion(item.question)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/90 hover:bg-white/5 transition-colors"
                            aria-expanded={isOpen}
                          >
                            <span dangerouslySetInnerHTML={{ __html: highlightedQuestion }} />
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-amber-400 shrink-0 ml-2" aria-hidden />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-amber-400 shrink-0 ml-2" aria-hidden />
                            )}
                          </button>
                          {isOpen && (
                            <div
                              className="px-4 pb-4 text-sm text-white/70 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: renderAnswer(item.answer) }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8 text-center" data-reveal>
          <h2 className="text-2xl font-bold text-white mb-3">Mai ai întrebări?</h2>
          <p className="text-solaris-muted mb-6">
            Contactează-ne direct și îți răspundem în maxim 24 de ore.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-black text-black"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Cere ofertă
            </a>
            <a
              href="tel:+40769889721"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sună: +40 769 889 721
            </a>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <SolarisFooter />
      </div>
    </main>
  );
}
