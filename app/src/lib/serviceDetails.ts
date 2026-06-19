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
  fitFor?: string[];
  faq: FaqItem[];
  contactServiceParam: string;
};

const services: ServiceDetail[] = [
  {
    slug: 'fotovoltaice-rezidentiale',
    title: 'Fotovoltaice Rezidențiale în Vaslui, Iași, Bacău și județele limitrofe',
    subtitle: 'Sisteme de 3-15 kWp pentru case, cu montaj curat, punere în funcțiune și suport pentru dosarul de prosumator.',
    highlights: [
      { label: 'Interval putere', value: '3-15 kWp' },
      { label: 'Montaj', value: '1-3 zile' },
      { label: 'Dosar prosumator', value: '4-8 săptămâni' },
      { label: 'Tipuri', value: 'on-grid / hibrid / baterie' },
    ],
    chart: {
      title: 'Producție relativă (sezonier)',
      labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [28, 38, 58, 78, 92, 100, 104, 98, 80, 56, 36, 26],
    },
    bullets: [
      'Dimensionare pe consumul real al casei și pe profilul de utilizare zi/seară.',
      'Panouri fotovoltaice, structură de montaj și invertor potrivit pentru acoperișul existent.',
      'Cablare DC/AC, protecții electrice, împământare și contorizare conform proiectului.',
      'Punere în funcțiune, configurare monitorizare și instruire clară pentru utilizator.',
      'Opțiuni on-grid pentru prosumator, sisteme hibride și pachete cu baterie de stocare.',
      'Pregătirea documentației tehnice necesare pentru dosarul de prosumator.',
      'Recomandări pentru eligibilitate Casa Verde AFM și proiecte cu finanțare prin PNRR, unde se aplică.',
      'Verificare finală la predare, cu explicații despre exploatare și mentenanță.',
    ],
    fitFor: [
      'Case și vile cu consum constant, unde proprietarul vrea să reducă factura și să folosească mai mult autoconsumul.',
      'Familii care vor să pornească de la un sistem on-grid și să păstreze opțiunea de baterie pentru o etapă ulterioară.',
      'Proprietari care urmăresc o investiție clară, cu montaj rapid, documentație ordonată și pași bine explicați.',
    ],
    longDescription: [
      'Un sistem fotovoltaic rezidențial bun nu începe cu numărul de panouri, ci cu analiza consumului real al casei. Pentru proiectele din Vaslui, Iași, Bacău și județele din jur evaluăm factura de energie, orientarea acoperișului, eventualele umbre și spațiul disponibil, astfel încât să propunem o putere potrivită, de regulă în intervalul 3-15 kWp. Asta înseamnă o soluție construită pentru economie reală, nu pentru o putere trecută bine pe hârtie.',
      'Putem configura sisteme on-grid pentru prosumator, variante hibride sau pachete cu baterie pentru autoconsum seara și pentru continuitate pe circuite selectate. Pachetul include panouri, structură, invertor, cablare DC/AC, protecții, contorizare, punere în funcțiune, instruire și sprijin pentru dosarul de prosumator. Dacă urmărești Casa Verde AFM sau o schemă de finanțare disponibilă prin PNRR, îți spunem de la început ce documente și ce condiții practice trebuie pregătite.',
      'La montaj ne interesează și partea tehnică, și aspectul final: trasee curate, etanșări corecte, tablou ordonat și monitorizare configurată înainte de predare. În mod obișnuit, montajul durează 1-3 zile, iar parcursul administrativ pentru dosarul de prosumator se întinde de regulă pe 4-8 săptămâni, în funcție de distribuitor și documente. Discutăm deschis și despre garanții: produs 10-15 ani, performanță panouri 25 ani și garanție de execuție 2 ani, conform contractului și echipamentelor selectate.',
    ],
    steps: [
      { title: 'Trimite consumul și pozele', body: 'Ne trimiți factura de curent, localitatea și câteva imagini cu acoperișul ca să validăm rapid intervalul de putere și condițiile de montaj.' },
      { title: 'Primești soluția și oferta', body: 'Îți prezentăm varianta recomandată, opțiunile cu baterie sau hibrid și lista completă de echipamente, termene și garanții.' },
      { title: 'Programăm montajul și dosarul', body: 'Stabilim data lucrării, executăm montajul, facem punerea în funcțiune și te ghidăm cu pașii pentru dosarul de prosumator.' },
    ],
    pricing: [
      { label: 'Sistem 3-6 kWp', value: 'ofertă după evaluarea consumului și a acoperișului', note: 'include de regulă montaj, protecții și punere în funcțiune' },
      { label: 'Sistem 6-15 kWp', value: 'ofertă configurată pe scenariul de autoconsum', note: 'opțional: baterie, back-up selectiv și integrare cu încărcător EV' },
    ],
    warranty: [
      'Garanție produs pentru echipamente, de regulă 10-15 ani, în funcție de producător și model.',
      'Garanție de performanță pentru panouri pe 25 de ani, conform fișelor tehnice ale fabricantului.',
      'Garanție de execuție 2 ani, specificată în contract și corelată cu soluția instalată.',
      'Recomandăm verificări periodice și curățare profesională atunci când producția sau mediul local o impun.',
    ],
    faq: [
      { question: 'Cât costă?', answer: 'Costul depinde de puterea aleasă, tipul invertorului, acoperiș și dacă dorești baterie. Îți dăm un buget realist după factura de consum, poze și evaluarea tehnică.' },
      { question: 'Cât durează racordul?', answer: 'Montajul propriu-zis durează de regulă 1-3 zile, iar partea de prosumator și racordare poate dura în medie 4-8 săptămâni, în funcție de distribuitor și de documentele disponibile.' },
      { question: 'Am nevoie de aprobare de la primărie?', answer: 'Depinde de particularitățile imobilului și de reglementările locale. În majoritatea cazurilor rezidențiale discutăm de la început ce acte sunt necesare, ca să nu apară blocaje târziu.' },
      { question: 'Ce se întâmplă când curentul se întrerupe?', answer: 'Un sistem on-grid standard se oprește pentru siguranța rețelei. Dacă vrei alimentare pe circuite selectate la pană de curent, discutăm o soluție hibridă sau cu baterie și back-up.' },
      { question: 'Pot adăuga baterie mai târziu?', answer: 'Da, de multe ori se poate, dacă alegem de la început o arhitectură compatibilă. De aceea discutăm din faza de ofertare dacă vrei doar pregătire sau instalare imediată.' },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'fotovoltaice-industriale',
    title: 'Fotovoltaice Industriale în Vaslui, Iași, Bacău și toată Moldova',
    subtitle: 'Sisteme de la 20+ kWp pentru hale, depozite și spații comerciale, proiectate pentru autoconsum, amortizare și execuție controlată.',
    highlights: [
      { label: 'Putere recomandată', value: '20+ kWp' },
      { label: 'Țintă', value: 'autoconsum + ROI' },
      { label: 'Execuție', value: 'etapizată' },
      { label: 'Monitorizare', value: 'live + alerte' },
    ],
    bullets: [
      'Analiză a profilului de consum și a facturilor de energie pentru alegerea scenariului corect.',
      'Evaluare a orientării acoperișului, a suprafeței utile și a tipului de rețea mono/trifazată.',
      'Proiectare pentru acoperișuri industriale clasice sau pentru acoperișuri plate cu membrană TPO.',
      'Dimensionare orientată pe autoconsum, nu pe putere instalată fără utilitate economică.',
      'Monitorizare a producției în timp real, alerte și rapoarte lunare pentru managementul consumului.',
      'Planificare de șantier etapizată, cu impact minim asupra activității curente a firmei.',
      'Recomandări privind extinderea ulterioară și integrarea cu alte investiții energetice.',
    ],
    fitFor: [
      'Companii cu consum diurn constant, unde energia produsă poate fi folosită direct în operațiuni.',
      'Hale, depozite, spații comerciale și unități de producție care urmăresc amortizare clară și vizibilitate asupra costurilor.',
      'Investitori care au nevoie de un proiect etapizat, cu documentație ordonată și risc redus pentru activitatea firmei.',
    ],
    longDescription: [
      'În zona industrială, un sistem fotovoltaic trebuie tratat ca investiție operațională, nu ca simplă lucrare de montaj. De aceea, pentru proiectele din Vaslui, Iași, Bacău și toată Moldova pornim de la profilul de consum, de la facturile de curent, de la orientarea acoperișului și de la tipul de rețea mono sau trifazată. Puterea minimă recomandată pentru această categorie este, în cele mai multe cazuri, de la 20 kWp în sus, dar dimensionarea finală depinde de obiectivul de autoconsum și de spațiul disponibil.',
      'În ofertare analizăm și partea practică: ce tip de acoperiș ai, dacă există membrane TPO, ce încărcări admise sunt pe structură, cum organizăm accesul și dacă lucrăm în etape pentru a nu bloca operațiunile firmei. Sistemul poate include monitorizare live a producției, alerte și rapoarte lunare, utile pentru departamentul tehnic sau pentru management. Când este relevant, discutăm și avantajul fiscal al amortizării accelerate, inclusiv deducerea de până la 50% din valoarea investiției în primul an, în condițiile cadrului aplicabil, cum este menționat de HG 704/2021 și normele conexe.',
      'Ne interesează să livrezi economie măsurabilă și exploatare ușoară. De aceea, la final nu primești doar un invertor pornit, ci și un plan de mentenanță, parametri de referință și recomandări pentru extindere ulterioară. Dacă apar opriri planificate de rețea sau vrei să adaugi putere după 12-24 luni, proiectăm de la început cu această perspectivă. Rezultatul este un sistem industrial care sprijină activitatea firmei, fără improvizații și fără promisiuni nerealiste de amortizare.',
    ],
    steps: [
      { title: 'Ne trimiți consumul și datele locației', body: 'Primim facturile, programul de funcționare, poze sau planuri de acoperiș și datele de rețea ca să validăm rapid fezabilitatea.' },
      { title: 'Primești scenariile tehnice și economice', body: 'Îți arătăm puterea recomandată, ipotezele de autoconsum, soluția de montaj, monitorizarea și eventualele etape de execuție.' },
      { title: 'Stabilim calendarul de execuție', body: 'Programăm lucrarea astfel încât să reducem impactul în activitatea firmei și definim pașii de punere în funcțiune și mentenanță.' },
    ],
    pricing: [
      { label: 'Sistem 20-100 kWp', value: 'ofertă după analiză consum + acoperiș', note: 'include scenarii de amortizare și organizare de șantier' },
      { label: 'Sistem 100+ kWp', value: 'ofertă personalizată', note: 'recomandăm vizită tehnică, verificare structură și plan de mentenanță dedicat' },
    ],
    warranty: [
      'Garanțiile echipamentelor sunt stabilite conform producătorilor selectați și clasei de utilizare.',
      'Monitorizarea și mentenanța recomandată sunt definite la predare, cu repere pentru producție și alerte.',
      'Detaliile de etanșare și fixare sunt verificate la recepție, mai ales pe acoperișuri plate sau cu membrane.',
    ],
    faq: [
      { question: 'Pot instala pe acoperiș TPO?', answer: 'Da, dar soluția trebuie proiectată corect pentru membrană, treceri și zonele cu trafic tehnic. Nu tratăm TPO ca pe un acoperiș industrial generic.' },
      { question: 'Cât durează amortizarea?', answer: 'Amortizarea depinde de autoconsum, prețul energiei, programul de lucru și configurația finală. Îți prezentăm scenarii prudente, nu doar cea mai optimistă variantă.' },
      { question: 'Afectează instalarea activitatea firmei?', answer: 'Planificăm execuția etapizat și stabilim zonele de lucru ca să reducem la minim impactul asupra operațiunilor curente.' },
      { question: 'Ce se întâmplă la oprire planificată de rețea?', answer: 'Monitorizarea și parametrizarea invertorului ne ajută să vedem clar evenimentele din rețea. Discutăm din faza de proiect și dacă sunt necesare măsuri suplimentare pentru continuitate sau reluare controlată.' },
      { question: 'Pot extinde sistemul ulterior?', answer: 'Da, în multe cazuri se poate, dacă proiectăm de la început cu spațiu, putere de invertor și trasee compatibile pentru o etapă următoare.' },
    ],
    contactServiceParam: 'fotovoltaice',
  },
  {
    slug: 'acoperisuri-tabla-tigla',
    title: 'Acoperișuri din Tablă și Țiglă Metalică în Vaslui și județele din jur',
    subtitle: 'Montaj complet și reparații pentru învelitori metalice, cu accent pe detalii curate, drenaj corect și etanșeitate pe termen lung.',
    highlights: [
      { label: 'Tipuri tablă', value: 'click / profilată / cutată' },
      { label: 'Grosimi', value: '0.45 / 0.5 / 0.6 mm' },
      { label: 'Acoperiri', value: 'polyester / PVDF' },
      { label: 'Garanție execuție', value: '5-10 ani' },
    ],
    bullets: [
      'Montaj pentru tablă click (falț dublu), tablă profilată, tablă cutată și tablă lisă, în funcție de geometria acoperișului.',
      'Recomandare de grosime 0.45 mm, 0.5 mm sau 0.6 mm în funcție de suprafață, expunere și cerințele proiectului.',
      'Sisteme de acoperire polyester 25 μm sau PVDF / Pural Matt 35 μm, cu diferențe explicate clar la ofertare.',
      'Sisteme pluviale din PVC, oțel vopsit sau aluminiu, configurate pentru drenaj corect.',
      'Accesorii complete: parazăpezi, aeratoare, ferestre de mansardă, coamă aerisită, dolii și borduri.',
      'Refacere zone critice la străpungeri, coame, dolii, racorduri și muchii expuse.',
      'Curățenie la predare și recomandări pentru întreținere sezonieră și verificări după furtuni.',
    ],
    fitFor: [
      'Case și anexe unde proprietarul vrea o învelitoare metalică rezistentă, cu detalii executate corect și aspect ordonat.',
      'Proiecte noi sau refaceri complete unde contează atât estetica, cât și compatibilitatea cu montajul ulterior de panouri fotovoltaice.',
      'Clienți care vor o alegere argumentată între tablă click, profilată sau cutată, nu doar o ofertă pe metru pătrat.',
    ],
    longDescription: [
      'La acoperișurile din tablă și țiglă metalică, problemele serioase nu apar de la suprafața mare, ci de la detaliile tratate superficial. Pentru lucrările din Vaslui și județele din jur analizăm panta, geometria, numărul de dolii, coamele, străpungerile, existența mansardei și tipul drenajului înainte să recomandăm materialul. Tablă click, profilată, cutată sau lisă înseamnă comportamente diferite la montaj, aspect și compatibilitate cu restul elementelor de pe casă.',
      'La ofertare discutăm și grosimea potrivită: 0.45 mm poate fi suficientă pentru unele lucrări rezidențiale standard, 0.5 mm rămâne o alegere echilibrată pentru cele mai multe case, iar 0.6 mm este preferată când vrei rigiditate mai mare, expunere mai dură sau o soluție premium. La fel de importantă este acoperirea: polyester 25 μm pentru bugete controlate și PVDF / Pural Matt 35 μm când urmărești rezistență superioară la UV, vopsire mai stabilă și durată de viață extinsă.',
      'Serviciul include și sisteme pluviale, accesorii și detalii de tinichigerie care fac diferența între o lucrare doar nouă și una corectă tehnic. Montăm parazăpezi, aeratoare, ferestre de mansardă, coamă aerisită, jgheaburi și burlane, iar în contract putem specifica o garanție de execuție pentru etanșeitate de 5-10 ani, în funcție de configurație. Dacă planifici panouri fotovoltaice pe tablă click, ținem cont de asta din proiectare, ca să eviți modificări costisitoare după montaj.',
    ],
    steps: [
      { title: 'Ne trimiți poze și dimensiuni orientative', body: 'Primim localitatea, suprafața aproximativă și imaginile cu acoperișul ca să înțelegem rapid tipul lucrării și nivelul de complexitate.' },
      { title: 'Alegi soluția și materialele potrivite', body: 'Îți explicăm diferențele dintre tipurile de tablă, grosimi, acoperiri, accesorii și sistemele pluviale recomandate pentru casa ta.' },
      { title: 'Programăm montajul sau refacerea', body: 'Stabilim calendarul de execuție, livrarea materialelor și pașii de recepție, inclusiv recomandările de mentenanță după predare.' },
    ],
    pricing: [
      { label: 'Montaj acoperiș complet', value: 'ofertă după măsurători și detalii', note: 'bugetul depinde de material, grosime, număr de accesorii și complexitatea acoperișului' },
      { label: 'Reparație sau refacere locală', value: 'după diagnostic', note: 'intervențiile punctuale sunt evaluate în funcție de zona afectată și de acces' },
    ],
    warranty: [
      'Garanția de execuție pentru etanșeitate este de regulă 5-10 ani, specificată clar în contract.',
      'Garanția materialului diferă în funcție de grosime, acoperire și producătorul selectat.',
      'Recomandăm inspecții după episoade meteo severe și verificări periodice pentru sistemul pluvial.',
    ],
    faq: [
      { question: 'Ce tablă rezistă mai bine la grindină?', answer: 'Rezistența este influențată de grosime, profilare și sistemul complet, nu doar de denumirea comercială. De regulă, o grosime mai mare și un profil corect ales oferă un comportament mai bun la solicitări mecanice.' },
      { question: 'Pot monta panouri fotovoltaice pe tablă click?', answer: 'Da. Tablă click este una dintre cele mai bune opțiuni pentru montaj fotovoltaic, dacă folosim prinderi și accesorii compatibile și pregătim corect traseele și zonele de etanșare.' },
      { question: 'Cât durează montajul pentru o casă obișnuită?', answer: 'Durata depinde de suprafață, geometrie, numărul de accesorii și starea suportului, dar îți comunicăm de la ofertare un calendar realist de execuție.' },
      { question: 'Pot schimba culoarea după 5 ani?', answer: 'Tehnic se poate interveni, dar cea mai bună soluție este alegerea corectă a culorii și a tipului de vopsire de la început. Recolorarea ulterioară trebuie evaluată separat, în funcție de starea învelitorii.' },
      { question: 'Ce se face cu tabla veche?', answer: 'Stabilim de la început dacă demontarea, evacuarea și valorificarea materialului vechi sunt incluse sau ofertate separat, ca să nu existe costuri neclare la final.' },
    ],
    contactServiceParam: 'acoperisuri',
  },
  {
    slug: 'acoperisuri-industriale-tpo',
    title: 'Acoperișuri Industriale TPO în Vaslui, Bacău, Iași și toată Moldova',
    subtitle: 'Montaj, reparații și mentenanță pentru membrane TPO pe hale și clădiri comerciale, cu atenție pe detaliile care provoacă infiltrații.',
    highlights: [
      { label: 'Membrană', value: '1.2 / 1.5 / 2.0 mm' },
      { label: 'Fixare', value: 'mecanică / adezivă / balastată' },
      { label: 'PV compatibil', value: 'da' },
      { label: 'Garanții', value: '15-20 ani fabricant' },
    ],
    chart: {
      title: 'Prioritate zone critice',
      labels: ['Străpungeri', 'Scurgeri', 'Atice', 'Colțuri'],
      values: [100, 82, 74, 64],
    },
    bullets: [
      'Montaj membrane TPO cu alegerea grosimii de 1.2 mm, 1.5 mm sau 2.0 mm în funcție de trafic și zonă climatică.',
      'Soluții de fixare mecanică, adezivă sau balastată, după încărcări, suport și tipul clădirii.',
      'Refacere detalii critice: colțuri, atice, străpungeri, treceri de cablu și guri de scurgere.',
      'Diagnostic pentru infiltrații recurente și refacere a zonei afectate după cauza reală, nu prin peticire la întâmplare.',
      'Compatibilizare cu proiecte fotovoltaice pe acoperiș plat și soluții corecte pentru suporturi și trasee.',
      'Plan de inspecții preventive pentru clădiri cu trafic tehnic, HVAC și intervenții repetate pe acoperiș.',
    ],
    fitFor: [
      'Hale, depozite și clădiri comerciale cu acoperiș plat unde infiltrațiile și detaliile la scurgeri sunt un risc operațional real.',
      'Investitori care vor să combine membrana TPO cu montaj fotovoltaic pe acoperiș plat, fără compromisuri la etanșare.',
      'Administratori de clădiri care preferă mentenanță predictibilă și remedieri documentate, nu intervenții reactive repetate.',
    ],
    longDescription: [
      'Membrana TPO este una dintre cele mai eficiente soluții pentru acoperișurile plate industriale, dar funcționează bine doar atunci când detaliile sunt executate impecabil. În proiectele din Vaslui, Bacău, Iași și Moldova verificăm suportul, pantele, zonele cu trafic pietonal și climatul local înainte să recomandăm grosimea: 1.2 mm pentru aplicații standard, 1.5 mm pentru un echilibru bun între durabilitate și cost, iar 2.0 mm pentru zone solicitate intens sau pentru condiții care cer rezervă suplimentară.',
      'La fel de importantă este metoda de fixare. În funcție de suport și de structura clădirii putem lucra mecanic, adeziv sau balastat cu pietriș ori dale. Cele mai multe probleme apar la colțuri, la străpungeri de instalații, la treceri de cablu și la gurile de scurgere, de aceea acolo punem accentul principal la diagnostic și execuție. Dacă pe acoperișul plat urmează sau există deja un sistem fotovoltaic, pregătim soluții compatibile pentru suporturi și trasee, fără să transformăm membrana într-un punct slab.',
      'Pe lângă montaj, oferim și reparații și mentenanță pentru situațiile în care infiltrația există deja. În loc să promitem un patch rapid fără explicații, identificăm cauza, refacem detaliul și recomandăm un plan de inspecții. Garanția fabricantului pentru membrană este de regulă 15-20 ani, iar garanția de execuție pentru lucrarea noastră este 5 ani, conform contractului și sistemului folosit. Asta înseamnă un acoperiș plat tratat ca infrastructură critică, nu ca o intervenție secundară.',
    ],
    steps: [
      { title: 'Trimite datele clădirii și simptomele', body: 'Ne ajuți cu suprafața, localitatea, tipul de activitate, poze și descrierea infiltrației sau a proiectului nou, ca să stabilim rapid dacă e nevoie de vizită.' },
      { title: 'Primești soluția tehnică și recomandarea de sistem', body: 'Îți spunem ce grosime de membrană și ce metodă de fixare au sens, plus ce detalii trebuie refăcute sau protejate.' },
      { title: 'Executăm și definim mentenanța', body: 'Programăm lucrarea, documentăm zonele critice și stabilim intervalul optim pentru inspecții și verificări preventive.' },
    ],
    pricing: [
      { label: 'Montaj membrană TPO', value: 'ofertă după suprafață, suport și detalii', note: 'costul diferă în funcție de grosime, fixare și numărul de străpungeri' },
      { label: 'Reparații și inspecții', value: 'după diagnostic', note: 'util pentru infiltrații locale, trafic tehnic sau verificări periodice' },
    ],
    warranty: [
      'Garanție fabricant pentru membrană, de regulă 15-20 ani, în funcție de sistemul ales.',
      'Garanție de execuție 5 ani, specificată în contract și condiționată de utilizare și mentenanță corectă.',
      'Pentru clădiri cu trafic tehnic recomandăm inspecții periodice documentate pentru a păstra etanșeitatea în timp.',
    ],
    faq: [
      { question: 'Pot monta panouri fotovoltaice pe membrană TPO?', answer: 'Da, dar sistemul trebuie gândit împreună cu soluția de acoperiș. Alegem suporturi, trasee și detalii care protejează membrana și permit mentenanța ulterioară.' },
      { question: 'Cum depistez o infiltrație pe acoperiș plat?', answer: 'De multe ori semnul vizibil apare departe de cauza reală. Analizăm scurgerile, străpungerile, aticele și zonele cu intervenții anterioare înainte să confirmăm punctul critic.' },
      { question: 'Pot aplica membrană TPO peste asfalt existent?', answer: 'Depinde de starea suportului și de soluția tehnică admisă de sistemul ales. În unele cazuri este posibil, în altele recomandăm decopertare sau strat intermediar.' },
      { question: 'Cât costă per mp orientativ?', answer: 'Prețul pe metru pătrat variază în funcție de grosimea membranei, metoda de fixare, numărul de detalii și condițiile de șantier. De aceea preferăm o ofertă completă, nu un tarif scos din context.' },
      { question: 'Câtă greutate adaugă membrana TPO?', answer: 'Membrana în sine este o soluție ușoară; greutatea totală depinde însă de stratificație și de modul de fixare, mai ales în variantele balastate. Validăm acest aspect în faza de evaluare.' },
    ],
    contactServiceParam: 'tpo',
  },
  {
    slug: 'atice-si-fatade-tabla',
    title: 'Atice și Fațade din Tablă în Vaslui, Iași, Bacău și proiecte selectate la nivel național',
    subtitle: 'Placări metalice pentru atice și fațade, cu muchii precise, culori RAL și soluții adaptate anvelopei clădirii.',
    highlights: [
      { label: 'Produse', value: 'cutată / nervurată / casete' },
      { label: 'Izolație', value: 'opțional sandwich' },
      { label: 'Culori', value: 'RAL standard / special' },
      { label: 'Vopsire', value: '10-30 ani' },
    ],
    bullets: [
      'Executăm tablă cutată, tablă nervurată, casete de fațadă și tablă lisă cu prindere ascunsă.',
      'Configurăm detalii pentru capace de atic, racorduri, colțuri și muchii expuse la apă și vânt.',
      'Putem include sau nu sisteme de termoizolație, inclusiv soluții tip sandwich cu vată minerală, în funcție de proiect.',
      'Oferim culori RAL standard și RAL speciale la comandă, în funcție de disponibilitate și termen.',
      'Explicăm diferențele dintre vopsire polyester și PVDF, inclusiv intervalele orientative de garanție.',
      'Intervenim și pentru reparații locale sau refaceri parțiale la elemente deformate sau corodate.',
    ],
    fitFor: [
      'Clădiri industriale, comerciale sau administrative care au nevoie de protecție a anvelopei și de un finisaj coerent vizual.',
      'Proiecte unde aticele trebuie integrate corect cu acoperișul, drenajul și eventualele instalații de pe terasă.',
      'Beneficiari care vor să aleagă informat între tablă simplă, casete de fațadă sau soluții cu termoizolație inclusă.',
    ],
    longDescription: [
      'Aticele și fațadele din tablă nu sunt doar elemente decorative; ele preiau apă, vânt, dilatări și multe dintre neconformitățile unei anvelope executate grăbit. Pentru proiectele din Vaslui, Iași, Bacău și din alte zone selectate lucrăm cu tablă cutată, tablă nervurată, casete de fațadă și tablă lisă cu prindere ascunsă, alegând produsul în funcție de imaginea dorită, expunere, structură și ritmul de montaj necesar pe șantier.',
      'La ofertare clarificăm dacă lucrarea include doar placarea metalică sau și termoizolația, de exemplu în configurații tip sandwich cu vată minerală. Discutăm și paleta de culori: RAL standard pentru termene mai scurte și RAL speciale la comandă atunci când arhitectura cere o nuanță exactă. Pentru vopsire explicăm diferența reală între polyester, cu o garanție tipică de 10-15 ani, și PVDF, unde intervalul poate urca la 20-30 ani în funcție de produs și de condițiile de exploatare.',
      'Execuția corectă se vede în muchii, în colțuri, în modul în care se termină fiecare racord și în felul în care apa este evacuată. De aceea tratăm aticul și fațada ca parte din ansamblul clădirii, nu ca o ultimă piesă montată superficial. Dacă lucrezi și la acoperiș, TPO sau reabilitare, coordonăm soluțiile astfel încât finisajul exterior să protejeze realmente clădirea și să rămână coerent vizual pe termen lung.',
    ],
    steps: [
      { title: 'Trimite planurile sau pozele clădirii', body: 'Avem nevoie de localitate, suprafață, imagini și, dacă există, detalii de arhitectură pentru a înțelege tipul de placare și nivelul de complexitate.' },
      { title: 'Definim produsul, culoarea și stratificația', body: 'Îți recomandăm tipul de tablă, finisajul, culorile RAL disponibile și dacă merită inclusă termoizolația sau o soluție tip sandwich.' },
      { title: 'Stabilim montajul și recepția', body: 'Programăm execuția, tratăm detaliile critice la colțuri și racorduri și verificăm la final liniile, îmbinările și zonele expuse.' },
    ],
    pricing: [
      { label: 'Placări atice / fațade', value: 'ofertă după suprafață și detalii', note: 'bugetul depinde de tipul produsului, numărul de colțuri, culoare și acces' },
      { label: 'Reparații locale', value: 'după evaluare', note: 'soluție utilă pentru elemente deformate, corodate sau slab fixate' },
    ],
    warranty: [
      'Garanția pentru vopsire diferă clar între PVDF, unde poate ajunge la 20-30 ani, și polyester, unde este de regulă 10-15 ani.',
      'Garanția de execuție este stabilită prin contract, în funcție de tipul placării, suport și expunerea clădirii.',
      'Recomandăm verificări periodice la muchii, capace de atic și zone cu expunere mare la apă sau vânt.',
    ],
    faq: [
      { question: 'Pot schimba fațada fără a afecta structura?', answer: 'În multe cazuri da, dacă sistemul ales este compatibil cu suportul existent. Validăm însă întotdeauna soluția de fixare și stratificația înainte de ofertă finală.' },
      { question: 'Ce culori RAL sunt disponibile stoc?', answer: 'Cele mai comune culori RAL standard sunt de obicei mai accesibile și cu termen mai scurt. Pentru nuanțe speciale verificăm disponibilitatea și termenul de comandă înainte de lansare.' },
      { question: 'Cât durează montajul pentru o fațadă de 200mp?', answer: 'Durata depinde de geometrie, înălțime, acces și de tipul produsului ales. Îți dăm un grafic realist de execuție după evaluarea suprafeței și a detaliilor.' },
      { question: 'Se poate aplica pe clădiri vechi?', answer: 'Da, în multe situații se poate, dar trebuie verificat suportul și modul în care noua placare se leagă de structura și detaliile existente.' },
      { question: 'Include și izolația termică?', answer: 'Poate include, dar nu presupunem automat acest lucru. În ofertă separăm clar varianta doar cu placare de varianta cu termoizolație sau panouri sandwich.' },
    ],
    contactServiceParam: 'atice-fatade',
  },
  {
    slug: 'reparatii-si-mentenanta',
    title: 'Reparații și Mentenanță în Vaslui și județele limitrofe',
    subtitle: 'Intervenții urgente și mentenanță planificată pentru acoperișuri, TPO și sisteme fotovoltaice, cu diagnostic clar și prioritizare corectă.',
    highlights: [
      { label: 'Intervenții', value: 'urgente / planificate' },
      { label: 'Răspuns', value: 'aceeași zi sau următoarea' },
      { label: 'Zone rapide', value: 'Vaslui + limitrofe' },
      { label: 'PV curățare', value: '+10-25% producție' },
    ],
    bullets: [
      'Intervenții urgente pentru infiltrații active, elemente desprinse, scurgeri blocate sau zone cu risc imediat.',
      'Mentenanță preventivă planificată pentru acoperișuri metalice, membrane TPO și detalii de tinichigerie.',
      'La inspecție verificăm starea membranei sau a tablei, etanșeitatea la coame, dolii și atice, starea jgheaburilor și fixărilor.',
      'Urmărim și prezența mușchiului, vegetației, resturilor și orice factor care poate accelera degradarea.',
      'Pentru fotovoltaice oferim curățare profesională, cu potențial de creștere a producției în intervalul 10-25%, în funcție de murdărire.',
      'Verificăm vizual modulele, conexiunile accesibile, invertorul, alertele și starea generală a sistemului.',
      'Acoperim rapid Vaslui și județele limitrofe, iar pentru alte zone confirmăm disponibilitatea după evaluarea cazului.',
    ],
    fitFor: [
      'Proprietari care au deja o infiltrație activă sau o problemă vizibilă și au nevoie de triere rapidă, nu de promisiuni vagi.',
      'Clienți care vor să prevină defecțiunile costisitoare prin inspecții periodice și mentenanță planificată.',
      'Beneficiari cu sisteme fotovoltaice unde producția a scăzut și este nevoie de curățare, verificări și recomandări concrete.',
    ],
    longDescription: [
      'Serviciul de reparații și mentenanță este gândit pentru situațiile în care timpul contează, dar și pentru cele în care prevenția reduce costurile pe termen lung. Facem diferența între intervenții urgente, cum sunt infiltrațiile active, desprinderile sau zonele în care apa intră deja în clădire, și intervenții planificate, unde scopul este să detectăm la timp punctele slabe înainte să producă pagube. Pentru Vaslui și județele limitrofe încercăm să răspundem în aceeași zi sau în următoarea zi lucrătoare, în funcție de localitate, vreme și gradul de risc.',
      'La inspecția unui acoperiș verificăm starea membranei sau a tablei, etanșeitatea la coame, dolii, atice și străpungeri, starea jgheaburilor, fixările, depunerile de mușchi sau vegetație și orice semn de drenaj deficitar. Pentru fotovoltaice nu ne oprim la o spălare superficială: facem curățare profesională când este cazul, inspecție vizuală a modulelor, verificarea conexiunilor accesibile și curățarea invertorului. În multe situații, un panou foarte murdar sau un traseu neglijat poate explica o scădere de producție de 10-25%.',
      'Scopul nostru este să îți spunem clar dacă problema se rezolvă punctual, dacă trebuie refăcută o zonă sau dacă merită introdus un plan de mentenanță. Intervenim și pe acoperișuri pe care nu le-am montat noi, cu condiția ca soluția propusă să fie tehnic corectă și realistă. Zonele de intervenție rapidă sunt Vaslui și județele limitrofe, iar pentru restul Moldovei confirmăm disponibilitatea în funcție de urgență și calendar. Asta înseamnă un serviciu practic, util și bine documentat, nu doar o deplasare de constatare fără concluzie.',
    ],
    steps: [
      { title: 'Ne trimiți problema și localitatea', body: 'Descrii urgența, trimiți poze și ne spui localitatea, ca să putem decide dacă este nevoie de intervenție imediată sau de evaluare programată.' },
      { title: 'Primești trierea și soluția recomandată', body: 'Îți spunem dacă discutăm despre urgență activă, reparație punctuală sau mentenanță preventivă și ce informații suplimentare sunt necesare.' },
      { title: 'Intervenim și stabilim prevenția', body: 'Refacem zona critică, curățăm sau verificăm sistemul și îți lăsăm pașii următori pentru a reduce riscul de reapariție.' },
    ],
    pricing: [
      { label: 'Intervenție punctuală', value: 'după diagnostic și localitate', note: 'costul depinde de acces, urgență, material și gravitatea problemei' },
      { label: 'Mentenanță periodică', value: 'plan personalizat', note: 'potrivit pentru acoperișuri industriale, TPO și sisteme PV care necesită urmărire recurentă' },
    ],
    warranty: [
      'Explicăm separat ce garantează intervenția punctuală și ce ține de starea generală a acoperișului sau a sistemului existent.',
      'Pentru lucrări cu uzură extinsă recomandăm etapizare și mentenanță, nu promisiuni nerealiste pe termen lung.',
      'După intervenție lăsăm recomandări clare pentru verificări ulterioare și pentru prioritizarea reparațiilor viitoare.',
    ],
    faq: [
      { question: 'Cum știu dacă am o infiltrație?', answer: 'Semnele cele mai comune sunt pete umede, miros persistent, apă care apare după ploaie sau condens neobișnuit în zonele critice. Uneori cauza reală este mai sus sau mai departe decât locul unde vezi efectul.' },
      { question: 'Cât costă o inspecție?', answer: 'Costul depinde de localitate, suprafață și complexitatea acoperișului sau a sistemului. Îți spunem de la început dacă vorbim despre o simplă triere, o inspecție dedicată sau o intervenție cu deplasare rapidă.' },
      { question: 'Cât de des trebuie curățate panourile fotovoltaice?', answer: 'Nu există un interval fix universal. Depinde de praf, polen, trafic, păsări și panta acoperișului, dar când murdărirea este serioasă, curățarea profesională poate recupera 10-25% din producția pierdută.' },
      { question: 'Interveniți și în weekend pentru urgențe?', answer: 'Pentru cazurile urgente încercăm să răspundem cât mai rapid, inclusiv în afara programului, dar confirmăm telefonic disponibilitatea în funcție de localitate, vreme și gradul de risc.' },
      { question: 'Faceți și reparații la acoperișuri pe care nu le-ați montat voi?', answer: 'Da, după evaluare. Intervenim și pe lucrări executate de alții dacă putem propune o soluție tehnic corectă și dacă problema este clar identificată.' },
    ],
    contactServiceParam: 'reparatii',
  },
];

const SLUG_ALIASES: Record<string, string> = {
  fotovoltaice: 'fotovoltaice-rezidentiale',
  'fotovoltaic-rezidential': 'fotovoltaice-rezidentiale',
  'fotovoltaice-residentiale': 'fotovoltaice-rezidentiale',
  'fotovoltaic-industrial': 'fotovoltaice-industriale',
  panouri: 'fotovoltaice-rezidentiale',
  'panouri-fotovoltaice': 'fotovoltaice-rezidentiale',
  acoperisuri: 'acoperisuri-tabla-tigla',
  'acoperisuri-tabla': 'acoperisuri-tabla-tigla',
  'tabla-tigla': 'acoperisuri-tabla-tigla',
  'tabla-click': 'acoperisuri-tabla-tigla',
  'tigla-metalica': 'acoperisuri-tabla-tigla',
  'acoperisuri-industriale': 'acoperisuri-industriale-tpo',
  tpo: 'acoperisuri-industriale-tpo',
  'acoperis-tpo': 'acoperisuri-industriale-tpo',
  atice: 'atice-si-fatade-tabla',
  fatade: 'atice-si-fatade-tabla',
  'atice-fatade': 'atice-si-fatade-tabla',
  'atice-fatade-tabla': 'atice-si-fatade-tabla',
  reparatii: 'reparatii-si-mentenanta',
  mentenanta: 'reparatii-si-mentenanta',
  'reparatii-mentenanta': 'reparatii-si-mentenanta',
};

export function getServiceDetail(slug: string) {
  const normalized = (slug || '').toLowerCase().trim().replace(/\/+$/, '');
  const target = SLUG_ALIASES[normalized] ?? normalized;
  return services.find((s) => s.slug === target) ?? null;
}

// Fallback exports pentru a trece de validarea build-ului static
export function generateServiceSchema(service: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service?.title || "Solaris Service",
    "description": service?.description || ""
  };
}

export function generateFAQSchema(faqs: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqs || []).map(faq => ({
      "@type": "Question",
      "name": faq.question || "",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer || ""
      }
    }))
  };
}
