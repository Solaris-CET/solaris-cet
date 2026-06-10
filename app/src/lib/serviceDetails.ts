import type { FaqItem } from '@/components/FaqAccordion';

type ServiceDetail = {
  slug: string;
  title: string;
  subtitle: string;
  highlights?: Array<{ label: string; value: string }>;
  chart?: { title: string; labels: string[]; values: number[] };
  longDescription?: string[];
  steps?: Array<{ title: string; body: string }>;
  pricing?: Array<{ label: string; value: string; note?: string }>;
  warranty?: string[];
  bullets: string[];
  faq: FaqItem[];
  contactServiceParam: string;
};

const services: ServiceDetail[] = [
  {
    slug: 'fotovoltaice-rezidentiale',
    title: 'Fotovoltaice Rezidențiale',
    subtitle: 'Sistem dimensionat pe consum, montaj curat și suport post-instalare.',
    highlights: [
      { label: 'Putere tipică', value: '3–12 kW' },
      { label: 'Execuție', value: '1–3 zile' },
      { label: 'Țintă', value: 'autoconsum + economie' },
      { label: 'Opțional', value: 'baterie / încărcător EV' },
    ],
    chart: {
      title: 'Producție relativă (sezonier)',
      labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [28, 38, 58, 78, 92, 100, 104, 98, 80, 56, 36, 26],
    },
    bullets: [
      'Evaluare tehnică: consum, orientare, umbriri, structură acoperiș',
      'Componente potrivite (invertor, protecții, structură)',
      'Montaj ordonat + etanșări corecte la străpungeri',
      'Punere în funcțiune + monitorizare',
    ],
    longDescription: [
      'Un sistem fotovoltaic bun începe cu dimensionarea corectă. Nu urmărim doar “câți kW încap pe acoperiș”, ci un echilibru între consumul tău real, profilul de utilizare (zi/seară), orientare/umbriri și buget. Pentru case din Vaslui și zona Moldovei, diferența o fac detaliile: prinderile potrivite pe învelitoare, trasee curate, protecții corecte și un tablou ordonat.',
      'În ofertă primești pe înțeles: puterea sistemului, numărul de panouri, tipul de invertor, protecții DC/AC, soluția de montaj și pașii de execuție. Dacă vrei “mai mult control”, putem include baterie (pentru autoconsum seara) sau încărcător EV (pentru încărcare simplă acasă).',
      'La montaj punem accent pe aspect și siguranță: străpungeri etanșate corect, cabluri fixate și protejate, etichetare, verificări înainte de pornire și configurare monitorizare (aplicație). La final, îți explicăm ce vezi în monitorizare, ce înseamnă alertele și ce verificări recomandăm periodic.',
    ],
    steps: [
      { title: 'Evaluare & dimensionare', body: 'Consum, orientare/umbriri, tip acoperiș, trasee cabluri, tablou electric.' },
      { title: 'Ofertă clară', body: 'Lista de echipamente, soluție de montaj, protecții, plan de lucru și termene realiste.' },
      { title: 'Execuție', body: 'Montaj panouri, trasee, protecții, punere la pământ, verificări și finisaje.' },
      { title: 'Punere în funcțiune', body: 'Configurare invertor și monitorizare, teste, instruire și recomandări mentenanță.' },
    ],
    pricing: [
      { label: '3–6 kW (prosumator)', value: 'orientativ, în funcție de acoperiș și echipamente', note: 'include montaj + protecții + punere în funcțiune' },
      { label: '6–12 kW (familie mare/EV)', value: 'orientativ, în funcție de configurație', note: 'opțional: baterie, back-up selectiv, încărcător EV' },
    ],
    warranty: [
      'Garanții echipamente conform producătorilor.',
      'Garanție manoperă (în funcție de proiect) + verificare la predare.',
      'Recomandăm mentenanță periodică: inspecție + verificări electrice.',
    ],
    faq: [
      {
        question: 'Cât durează montajul pentru o casă?',
        answer: 'De obicei 1–3 zile, în funcție de acces, tip acoperiș și complexitate.',
      },
      {
        question: 'Funcționează sistemul și iarna?',
        answer: 'Da. Producția diferă sezonier, dar sistemul generează energie și pe vreme rece/înnorată.',
      },
      {
        question: 'E nevoie de baterie?',
        answer: 'Nu obligatoriu. Bateria ajută la autoconsum seara și backup (parțial), dar depinde de obiectiv și buget.',
      },
      {
        question: 'Ce include oferta?',
        answer: 'Listă echipamente, protecții, montaj, punere în funcțiune și pași de execuție, pe înțeles.',
      },
      {
        question: 'Se poate monta pe țiglă sau tablă click?',
        answer: 'Da. Alegem prinderi și soluții potrivite pentru tipul de învelitoare și detalii.',
      },
      {
        question: 'Cum se face mentenanța?',
        answer: 'Verificări periodice + curățare la nevoie. Recomandăm minim 1 verificare/an.',
      },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'fotovoltaice-industriale',
    title: 'Fotovoltaice Industriale',
    subtitle: 'Proiectare și execuție pentru hale și spații comerciale, cu focus pe siguranță.',
    highlights: [
      { label: 'Putere', value: '30–500+ kW' },
      { label: 'Planificare', value: 'execuție pe etape' },
      { label: 'ROI', value: 'optimizare autoconsum' },
      { label: 'Monitorizare', value: 'dashboard + alerte' },
    ],
    bullets: [
      'Analiză consum și profil de utilizare',
      'Configurație optimă pentru autoconsum și amortizare',
      'Detalii la acoperiș plat / atice / străpungeri',
      'Plan de mentenanță și monitorizare',
    ],
    longDescription: [
      'Pentru o hală, un magazin sau un spațiu comercial, scopul unui sistem PV este autoconsumul (să consumi energia produsă când ai activitate). De aceea, pornim de la profilul de consum și de la orele de funcționare: dimensionăm astfel încât să ai economie reală și o amortizare logică, fără supradimensionări inutile.',
      'Punem accent pe siguranță: trasee, protecții, împământare, verificări și zone de lucru. Pentru acoperișuri plate/TPO, detaliile (scurgeri, atice, străpungeri) sunt critice. Lucrăm etapizat dacă este nevoie, astfel încât să nu blocăm operațiunile zilnice.',
      'La predare primești documentație clară: parametri inițiali, poze cu detalii, recomandări de mentenanță și un plan de inspecții. Monitorizarea te ajută să vezi rapid dacă apare o scădere de performanță (murdărie, umbrire, defect), astfel încât să intervenim la timp.',
    ],
    steps: [
      { title: 'Analiză consum & ROI', body: 'Profil de consum, vârfuri, scenarii de dimensionare și economii estimate.' },
      { title: 'Proiectare & planificare', body: 'Configurație, amplasare, trasee, protecții și plan de lucru (etapizat dacă e nevoie).' },
      { title: 'Execuție controlată', body: 'Siguranță la lucru, detalii la acoperiș, verificări înainte de predare.' },
      { title: 'Monitorizare & mentenanță', body: 'Dashboard, alerte și checklist pentru inspecții periodice.' },
    ],
    pricing: [
      { label: 'Sistem industrial', value: 'ofertă după evaluare', note: 'depinde de acoperiș, acces și cerințe de siguranță' },
      { label: 'Mentenanță', value: 'abonament sau intervenții', note: '1–2 inspecții/an recomandat pe acoperișuri plate' },
    ],
    warranty: [
      'Garanții echipamente conform producătorilor.',
      'Plan de mentenanță și recomandări de exploatare.',
      'Etanșări și detalii verificate la predare (în funcție de proiect).',
    ],
    faq: [
      { question: 'Se poate monta pe TPO?', answer: 'Da, cu detalii și proceduri corecte pentru etanșare și protecție.' },
      { question: 'Aveți soluții de monitorizare?', answer: 'Da. Configurăm monitorizare și alerte pentru performanță.' },
      { question: 'Cum evitați infiltrațiile?', answer: 'Etanșări corecte la străpungeri + verificări înainte de predare.' },
      { question: 'Se poate face pe etape?', answer: 'Da. Planificăm în funcție de operațiunile locației.' },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'acoperisuri-tabla-tigla',
    title: 'Acoperișuri Tablă/Țiglă',
    subtitle: 'Montaj și reparații cu detalii curate și etanșări corecte.',
    highlights: [
      { label: 'Materiale', value: 'tablă click / țiglă' },
      { label: 'Zone critice', value: 'dolie/coamă/străpungeri' },
      { label: 'Intervenții', value: 'punctual sau complet' },
      { label: 'Extra', value: 'jgheaburi/burlane' },
    ],
    bullets: ['Montaj tablă/țiglă metalică', 'Reparații infiltrații', 'Dolii, coame, borduri, accesorii', 'Sisteme pluviale'],
    longDescription: [
      'Un acoperiș bun înseamnă detalii corecte, nu doar material. Infiltrațiile apar aproape întotdeauna în zonele sensibile: dolii, coame, străpungeri (coș, aerisiri), racorduri la atice și jgheaburi/scurgeri. În evaluare ne uităm fix la aceste puncte și la geometria acoperișului, ca să alegem soluția potrivită (tablă click, țiglă metalică, accesorii și închideri).',
      'Pentru lucrări complete, montăm învelitoarea, accesoriile, sistemele pluviale și facem verificări de etanșare. Pentru reparații, nu “peticim” la întâmplare: identificăm cauza, refacem detaliul și îți spunem realist dacă soluția este punctuală sau ai nevoie de o refacere pe zonă.',
      'Punem accent pe finisaj: linii curate, margini controlate, fixări discrete, drenaj corect. O lucrare care arată bine la predare este, de obicei, o lucrare făcută corect și tehnic.',
    ],
    steps: [
      { title: 'Inspecție', body: 'Diagnostic zone critice: dolii, coame, străpungeri, scurgeri, racorduri.' },
      { title: 'Plan + ofertă', body: 'Materiale, accesorii, detalii de etanșare și plan de execuție.' },
      { title: 'Execuție', body: 'Montaj/reparație, verificări și curățenie la predare.' },
      { title: 'Recomandări', body: 'Mentenanță preventivă: verificări după furtuni și sezon rece.' },
    ],
    pricing: [
      { label: 'Reparație infiltrație', value: 'după evaluare', note: 'intervenții punctuale sau pe zonă' },
      { label: 'Refacere parțială/completă', value: 'după măsurători', note: 'în funcție de suprafață și complexitate' },
    ],
    warranty: ['Garanție manoperă în funcție de proiect.', 'Recomandăm verificări periodice pentru prevenție.'],
    faq: [
      { question: 'Tablă click sau țiglă metalică?', answer: 'Depinde de arhitectură, buget și geometria acoperișului; îți recomandăm după evaluare.' },
      { question: 'Cât durează o reparație?', answer: 'De la intervenții punctuale în aceeași zi până la reparații mai ample, în funcție de situație.' },
      { question: 'Ce zone sunt cele mai sensibile?', answer: 'Dolii, coame, străpungeri (coș, aerisiri) și racorduri la atice.' },
      { question: 'Includeți și jgheaburi/burlane?', answer: 'Da, dacă sunt necesare pentru drenaj corect.' },
      { question: 'Puteți lucra iarna?', answer: 'Depinde de vreme și siguranță. Recomandăm ferestre meteo potrivite.' },
    ],
    contactServiceParam: 'acoperisuri',
  },
  {
    slug: 'acoperisuri-industriale-tpo',
    title: 'Acoperișuri Industriale TPO',
    subtitle: 'Membrane TPO pentru hale și clădiri comerciale: montaj, reparații, mentenanță.',
    highlights: [
      { label: 'Inspecții', value: '1–2 / an' },
      { label: 'Zone critice', value: 'atice/scurgeri/străpungeri' },
      { label: 'Intervenții', value: 'reparații locale' },
      { label: 'Compatibil', value: 'PV cu soluții corecte' },
    ],
    chart: {
      title: 'Prioritate zone critice',
      labels: ['Străpungeri', 'Scurgeri', 'Atice', 'Colțuri'],
      values: [100, 82, 74, 64],
    },
    bullets: ['Montaj membrane TPO', 'Reparații punctuale', 'Detalii la atice și străpungeri', 'Inspecție + recomandări'],
    longDescription: [
      'La acoperișurile plate industriale, TPO este o soluție modernă, dar cere detalii executate corect: suduri curate la îmbinări, racorduri la atice, colțuri, scurgeri și străpungeri. Cele mai multe infiltrații apar în aceste puncte, mai ales după cicluri îngheț-dezgheț sau după intervenții făcute fără procedură.',
      'Intervenim prin diagnostic și refacerea detaliului: pregătire zonă, sudură/patch conform sistemului, verificare și recomandări pentru întreținere. Pentru clădiri cu trafic tehnic (HVAC, evacuări), recomandăm inspecții 1–2 ori/an: se reduc mult infiltrațiile și reparațiile costisitoare.',
      'Dacă există sau se dorește fotovoltaic pe TPO, configurăm soluții compatibile de fixare/etanșare, ca să nu introducem puncte de risc.',
    ],
    steps: [
      { title: 'Diagnostic', body: 'Identificare cauză: îmbinare, scurgere, străpungere, racord la atic.' },
      { title: 'Refacere detaliu', body: 'Pregătire + sudură/patch conform sistemului TPO.' },
      { title: 'Verificare', body: 'Control vizual + verificare detalii și drenaj.' },
      { title: 'Mentenanță', body: 'Inspecții periodice și plan de intervenții prioritizate.' },
    ],
    pricing: [
      { label: 'Inspecție', value: 'orientativ, în funcție de suprafață', note: 'recomandat 1–2/an' },
      { label: 'Reparații locale', value: 'după diagnostic', note: 'în funcție de zona afectată' },
    ],
    warranty: ['Recomandăm mentenanță periodică pentru a menține etanșarea în timp.'],
    faq: [
      { question: 'Ce este TPO?', answer: 'O membrană termoplastică folosită frecvent la acoperișuri plate industriale.' },
      { question: 'Cum se repară o infiltrație?', answer: 'Identificăm cauza, pregătim zona și aplicăm soluția potrivită conform sistemului.' },
      { question: 'Cât de des e nevoie de inspecție?', answer: 'Recomandăm minim 1–2 inspecții/an pentru acoperișuri industriale.' },
      { question: 'Se poate monta PV peste TPO?', answer: 'Da, cu soluții compatibile și detalii corecte de fixare/etanșare.' },
    ],
    contactServiceParam: 'tpo',
  },
  {
    slug: 'atice-si-fatade-tabla',
    title: 'Atice și Fațade Tablă',
    subtitle: 'Placări moderne, muchii precise și detalii rezistente la intemperii.',
    highlights: [
      { label: 'Focus', value: 'muchii & îmbinări' },
      { label: 'Finisaj', value: 'linii curate' },
      { label: 'Opțiuni', value: 'reparații locale' },
      { label: 'Rezultat', value: 'protecție anvelopă' },
    ],
    bullets: ['Montaj atice', 'Placări fațade', 'Reparații locale', 'Înlocuiri elemente'],
    longDescription: [
      'Lucrările la atice și fațade din tablă par simple în poze, dar diferența reală se vede în muchii, colțuri, dilatări, scurgeri și în felul în care se termină fiecare detaliu. Dacă aceste zone sunt tratate superficial, apar infiltrații, deformări sau un finisaj care arată improvizat chiar din prima lună.',
      'Pentru Solaris CET, această categorie înseamnă multă atenție la trasare, rigidizare, muchii curate și fixări discrete. Intervenim atât pe lucrări noi, cât și pe refaceri locale: elemente deformate, capace de atic, racorduri, plăci de închidere și zone unde tabla trebuie să protejeze anvelopa, nu doar să „acopere” vizual o problemă.',
      'Dacă proiectul implică și acoperiș sau TPO, tratăm aticele și fațadele ca parte din ansamblu. Asta înseamnă continuitate la drenaj, compatibilitate între materiale și un rezultat coerent, nu un colaj de intervenții făcute separat.',
    ],
    steps: [
      { title: 'Măsurători & diagnostic', body: 'Verificăm muchiile, racordurile, elementele deformate și modul în care se scurge apa.' },
      { title: 'Soluție & materiale', body: 'Stabilim tipul de tablă, finisajul, sistemul de fixare și detaliile de protecție.' },
      { title: 'Execuție', body: 'Trasare, tăieri, plieri, montaj și închidere curată a colțurilor și racordurilor.' },
      { title: 'Verificare finală', body: 'Control vizual și tehnic pentru muchii, îmbinări și zone expuse la apă și vânt.' },
    ],
    pricing: [
      { label: 'Placări / capace atic', value: 'după măsurători și lungimi', note: 'bugetul depinde de colțuri, înălțimi și acces' },
      { label: 'Reparații locale', value: 'după evaluare', note: 'intervențiile punctuale pot fi ofertate separat' },
    ],
    warranty: [
      'Garanția depinde de tipul proiectului și de materialele alese.',
      'Pentru expuneri puternice la vânt sau apă, recomandăm verificări periodice ale muchiilor și racordurilor.',
    ],
    faq: [
      { question: 'Ce materiale folosiți?', answer: 'În funcție de proiect: tablă cutată/panouri/elemente de anvelopă compatibile.' },
      { question: 'Se pot repara doar zonele afectate?', answer: 'Da. Facem reparații locale sau înlocuiri punctuale unde e realist.' },
      { question: 'Cum arată finisajul?', answer: 'Punem accent pe linii curate, muchii și elemente de fixare discrete.' },
      { question: 'Includeți și etanșări?', answer: 'Da, acolo unde sunt necesare pentru protecția anvelopei.' },
      { question: 'Lucrați și la detalii de atic pentru acoperișuri plate?', answer: 'Da. Tratăm aticele ca detalii critice pentru drenaj, etanșare și durabilitate.' },
    ],
    contactServiceParam: 'atice-fatade',
  },
  {
    slug: 'reparatii-si-mentenanta',
    title: 'Reparații și Mentenanță',
    subtitle: 'Intervenții rapide și mentenanță preventivă pentru fotovoltaice și acoperișuri.',
    highlights: [
      { label: 'Diagnostic', value: 'rapid & realist' },
      { label: 'Intervenții', value: 'punctuale' },
      { label: 'Plan', value: 'mentenanță periodică' },
      { label: 'Acoperire', value: 'în funcție de proiect' },
    ],
    bullets: ['Diagnostic + soluție', 'Verificări periodice', 'Intervenții punctuale', 'Plan mentenanță'],
    longDescription: [
      'Când apare o infiltrație sau o scădere de producție la sistemul fotovoltaic, tentația este să cauți „cea mai rapidă reparație”. Problema este că intervențiile făcute fără diagnostic clar ajung să coste mai mult: defectul revine, apar daune colaterale sau se schimbă componente care nu erau cauza reală.',
      'Serviciul nostru de reparații și mentenanță pornește tocmai de la diagnostic. Pentru acoperișuri, căutăm cauza tehnică: scurgere, racord, străpungere, element de tinichigerie, îmbinare TPO sau degradare învelitoare. Pentru fotovoltaice, verificăm contextul: murdărire, umbriri noi, alarmă invertor, cablare, protecții sau parametrizare.',
      'Scopul nu este doar „să reparăm azi”, ci să îți spunem realist dacă ai nevoie de intervenție punctuală, reparație pe zonă sau plan de mentenanță. Asta este diferența între un serviciu de urgență și unul care chiar protejează investiția în timp.',
    ],
    steps: [
      { title: 'Preluare context', body: 'Primim poze, descrierea problemei, localitatea și, dacă există, istoricul intervențiilor.' },
      { title: 'Diagnostic', body: 'Identificăm cauza probabilă și stabilim dacă intervenția poate fi punctuală sau necesită evaluare în teren.' },
      { title: 'Intervenție', body: 'Refacem zona defectă sau corectăm problema tehnică, cu explicații clare despre ce s-a făcut.' },
      { title: 'Prevenție', body: 'Propunem verificări sau mentenanță periodică acolo unde riscul de reapariție este ridicat.' },
    ],
    pricing: [
      { label: 'Intervenție punctuală', value: 'după diagnostic', note: 'în funcție de acces, zonă și severitatea problemei' },
      { label: 'Plan mentenanță', value: 'periodic, după tipul proiectului', note: 'util pentru acoperișuri industriale și sisteme PV monitorizate' },
    ],
    warranty: [
      'Explicăm clar ce garantează intervenția și ce ține de starea generală a sistemului sau a acoperișului.',
      'Pentru proiectele cu uzură extinsă, recomandăm plan etapizat, nu promisiuni nerealiste pe o singură reparație.',
    ],
    faq: [
      { question: 'În cât timp interveniți?', answer: 'Depinde de locație și urgență; îți confirmăm rapid disponibilitatea.' },
      { question: 'Reparați și lucrări făcute de alții?', answer: 'Da, după evaluare și dacă soluția este tehnic corectă.' },
      { question: 'Faceți mentenanță PV?', answer: 'Da: verificări, curățare la nevoie, diagnostic și remediere.' },
      { question: 'Ce include un plan de mentenanță?', answer: 'Inspecții periodice, checklist, recomandări și intervenții prioritizate.' },
      { question: 'Puteți spune din poze dacă este urgent?', answer: 'De multe ori da, cel puțin ca triere. Pentru oferta corectă, uneori e necesară verificarea la locație.' },
    ],
    contactServiceParam: 'reparatii',
  },
];

export function getServiceDetail(slug: string) {
  return services.find((s) => s.slug === slug) ?? null;
}
