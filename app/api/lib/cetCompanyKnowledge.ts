// Solaris CET — Romanian local knowledge base for the chat widget.
// Used as a deterministic fallback so the assistant always answers, even
// when external AI providers are unavailable.

const PHONE = '+40 769 889 721';
const WHATSAPP = 'https://wa.me/40769889721';
const EMAIL = 'contact@solaris-cet.com';
const SITE = 'https://solaris-cet.com';
const HQ = 'Vaslui, județul Vaslui';
const COVERAGE = 'Moldova (Vaslui, Iași, Bacău, Galați, Vrancea, Neamț, Botoșani, Suceava) și proiecte selectate la nivel național';

const CONTACT_BLOCK =
  `\n\n— Cum ne contactezi —\n` +
  `• Telefon: ${PHONE}\n` +
  `• WhatsApp: ${WHATSAPP}\n` +
  `• Email: ${EMAIL}\n` +
  `• Formular ofertă: ${SITE}/contact\n` +
  `• Calculator fotovoltaic: ${SITE}/calculator\n`;

type Intent = {
  id: string;
  patterns: RegExp[];
  reply: () => string;
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 .,?!\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const INTENTS: Intent[] = [
  {
    id: 'greeting',
    patterns: [/^(salut|buna|buna ziua|hei|hello|hi|hey)\b/, /\bnoroc\b/],
    reply: () =>
      `Salut! Eu sunt asistentul Solaris CET. Te pot ajuta cu informații despre fotovoltaice, acoperișuri (tablă click, țiglă metalică, membrană TPO), atice și fațade, reparații sau să-ți pregătesc o cerere de ofertă.\n\nSpune-mi pe scurt ce ai nevoie și unde te afli (oraș/județ), iar pentru cifre concrete revenim cu o ofertă în maxim 24 de ore.${CONTACT_BLOCK}`,
  },
  {
    id: 'about',
    patterns: [
      /\b(cine sunteti|cine esti|despre voi|despre solaris|despre cet|ce firma|prezentare|experienta|cati ani|de cand)\b/,
    ],
    reply: () =>
      `Solaris CET este o firmă românească din ${HQ} specializată pe trei direcții:\n\n` +
      `1) Fotovoltaice — sisteme rezidențiale (3–10 kWp) și industriale (peste 10 kWp), inclusiv prosumator.\n` +
      `2) Acoperișuri — tablă click / țiglă metalică pe case și hale, plus membrană TPO pe acoperișuri plate industriale.\n` +
      `3) Atice, fațade și reparații — refacerea detaliilor critice care opresc infiltrațiile.\n\n` +
      `Acoperire: ${COVERAGE}. Ofertăm pe situația reală — cerem consumul, pozele și localitatea înainte să dăm un preț, ca să nu împingem un pachet generic.${CONTACT_BLOCK}`,
  },
  {
    id: 'pv-residential',
    patterns: [
      /\b(fotovoltaic|panou|panouri|solar|kwp|prosumator|autoconsum)\b.*\b(casa|rezidential|familie|locuinta|apartament|vila)\b/,
      /\b(casa|rezidential|familie)\b.*\b(fotovoltaic|panou|solar)\b/,
      /\bsistem (de )?panouri (pentru )?casa\b/,
    ],
    reply: () =>
      `Fotovoltaic rezidențial — cum lucrăm:\n\n` +
      `• Dimensionăm pe consum real (kWh/lună din factură), nu pe metri pătrați.\n` +
      `• Configurări tipice case: 3 kWp, 5 kWp, 6.6 kWp, 8 kWp, 10 kWp — monofazat sau trifazat.\n` +
      `• Componente: panouri monocristaline N-type (Tier 1), invertor hibrid (Huawei / Solis / Deye / Growatt), structură pe tablă sau țiglă, monitorizare web/app.\n` +
      `• Documentație prosumator: ANRE + distribuitor (Delgaz / E-Distribuție), contract de compensare cantitativă.\n` +
      `• Termen orientativ montaj: 1–2 zile execuție; punere în funcțiune în 4–8 săptămâni după dosarul de racordare.\n\n` +
      `Pentru oferta exactă avem nevoie de: consum lunar mediu, tipul acoperișului (tablă/țiglă/membrană), orientare (S/SE/SV), localitate.${CONTACT_BLOCK}`,
  },
  {
    id: 'pv-industrial',
    patterns: [
      /\b(fotovoltaic|panou|panouri|solar)\b.*\b(industria|hala|fabrica|comercial|firma|business|companie)\b/,
      /\b(industria|hala|fabrica|comercial)\b.*\b(fotovoltaic|panou|solar)\b/,
      /\b(peste|mai mare|mai mult).*\b(10|20|30|50|100).*kwp\b/,
    ],
    reply: () =>
      `Fotovoltaic industrial — cum lucrăm:\n\n` +
      `• Audit energetic și profil orar de consum (din contoarele inteligente / factură detaliată).\n` +
      `• Sisteme 20 kWp – 1 MWp, pe hale (tablă, TPO) sau teren. Variante: prosumator, autoconsum total, hibrid cu storage.\n` +
      `• Structuri: balastate pentru TPO, prinse mecanic pentru tablă cutată, cu garanție de etanșare.\n` +
      `• Invertoare string sau centrale (Huawei SUN2000, Sungrow, SMA), monitorizare granulară pe stringuri.\n` +
      `• Documentație: aviz tehnic de racordare, autorizație ANRE, recepție DSO, integrare cu sistemul de facturare.\n\n` +
      `Pentru evaluare ne trimiți: consum anual (MWh), tip acoperiș, suprafață utilă, dacă ai aviz de racordare existent.${CONTACT_BLOCK}`,
  },
  {
    id: 'tpo',
    patterns: [
      /\btpo\b/,
      /\b(membrana|hidroizolatie|hidroizolare|infiltratie|infiltratii)\b/,
      /\b(acoperis|terasa) (plat|industria|hala)\b/,
    ],
    reply: () =>
      `Membrană TPO — acoperișuri plate / industriale:\n\n` +
      `• Refaceri complete și reparații punctuale pe hale existente.\n` +
      `• Sudură cu aer cald, suprapuneri standardizate, întăriri în jurul străpungerilor (coșuri, antene, AC).\n` +
      `• Detalii critice: atice (parapeți), scurgeri (sifoane), dolii, racorduri zid. Aici se pierd 80% din lucrările făcute prost.\n` +
      `• Membrane 1.2–1.5 mm de la furnizori europeni (Sika, Mapei, Bauder, Sarnafil) — garanție produs 10–15 ani.\n` +
      `• Refacere atice și parapeți cu tablă de Lindab / Ruukki / Wetterbest, cu drenaj corect.\n\n` +
      `Pentru ofertă trimite-ne poze ale acoperișului (zonele cu probleme), suprafața aproximativă și de când are scurgeri.${CONTACT_BLOCK}`,
  },
  {
    id: 'metal-roof',
    patterns: [
      /\b(tabla|tigla) (click|metalica|cutata|faltuita)\b/,
      /\b(tabla|tigla|sindrila)\b.*\b(montaj|acoperis|refacere|reparatie)\b/,
      /\bstanding seam\b/,
    ],
    reply: () =>
      `Tablă click / țiglă metalică:\n\n` +
      `• Montaj pe acoperișuri cu geometrie variată — case noi sau refaceri pe șarpantă existentă.\n` +
      `• Profile: țiglă modulară (Lindab Topline, Wetterbest, Bilka), faltuit standing seam (Lindab Seamline, Ruukki Classic), tablă cutată.\n` +
      `• Lucrăm cu accent pe detaliile care dau bătaie de cap: dolii, coame, racorduri coș, borduri, drenaj jgheaburi.\n` +
      `• Membrană difuziv-deschisă + șipci de contracaroiaj, ventilație coamă/streașină — obligatoriu pentru durabilitate.\n` +
      `• Garanție montaj 5 ani, garanție produs 30–50 ani de la producător.\n\n` +
      `Pentru ofertă: dimensiunile aproximative ale acoperișului (sau pozele), tipul actual (țiglă veche / azbociment / tablă) și județul.${CONTACT_BLOCK}`,
  },
  {
    id: 'facade',
    patterns: [/\b(atic|atice|fatada|fatade|parapet|parapeti|placari|placare)\b/],
    reply: () =>
      `Atice, fațade și parapeți din tablă:\n\n` +
      `• Refacerea aticelor pe hale: profilarea capacelor, etanșare cu membrană, prinderi mecanice.\n` +
      `• Placări fațade cu tablă plană (Lindab, PrefaLZ, Ruukki) — vertical, orizontal sau pe diagonală.\n` +
      `• Soluții de evacuare apă (jgheaburi încastrate, scupere, burlane). Detalii lipite + sudate.\n` +
      `• Compatibil cu izolații rigide PIR / vată de bazalt sub placare.\n\n` +
      `Aticele și parapeții sunt zona unde majoritatea acoperișurilor industriale curg. Le facem cu accent pe detaliile care opresc infiltrațiile recurente.${CONTACT_BLOCK}`,
  },
  {
    id: 'repairs',
    patterns: [
      /\b(reparatie|reparatii|mentenanta|interventie|urgent|urgenta|curge|infiltratie|scurgere)\b/,
    ],
    reply: () =>
      `Reparații și mentenanță:\n\n` +
      `• Intervenții pe TPO, tablă, țiglă — sudură membrană, înlocuit elemente, refacere etanșări.\n` +
      `• Audit acoperiș cu raport: ce are, cât rezistă, ce trebuie făcut acum vs anul viitor.\n` +
      `• Curățare panouri PV + verificare strângere conectori, scanare termografică.\n` +
      `• Răspundem în 24–48h pentru urgențe (scurgeri active) — sună-ne direct la ${PHONE}.${CONTACT_BLOCK}`,
  },
  {
    id: 'pricing',
    patterns: [
      /\b(pret|preturi|cost|costuri|tarif|tarife|cat costa|cat ma costa|cat e|cat ar|cat ar fi)\b/,
      /\b(oferta|estimare|estimatie|buget)\b/,
    ],
    reply: () =>
      `Preturi orientative (variază cu echipamentul și acoperișul concret):\n\n` +
      `• Fotovoltaic rezidențial 5 kWp on-grid: ~3.500–5.000 € (cu TVA, montaj inclus).\n` +
      `• Fotovoltaic rezidențial 8 kWp cu prosumator: ~5.500–7.500 €.\n` +
      `• Fotovoltaic + baterie 5–10 kWh: + 2.500–5.500 € peste sistemul on-grid.\n` +
      `• Fotovoltaic industrial 50 kWp: ~30.000–45.000 € (preț per kWp scade cu volumul).\n` +
      `• Acoperiș tablă click: 90–150 lei/mp doar materialul + 80–150 lei/mp manoperă, în funcție de complexitate.\n` +
      `• Acoperiș TPO industrial: 75–140 lei/mp manoperă; membrana 35–70 lei/mp.\n` +
      `• Reparație TPO punctuală: 600–2.500 lei intervenție, în funcție de suprafață.\n\n` +
      `Atenție: aceste intervale sunt informative. Oferta finală vine după ce vedem situația reală (consum, poze acoperiș, localitate). Pentru cifra ta exactă: completează formularul de la ${SITE}/contact sau folosește calculatorul ${SITE}/calculator pentru fotovoltaice.${CONTACT_BLOCK}`,
  },
  {
    id: 'casa-verde',
    patterns: [
      /\b(casa verde|programul casa verde|afm|finantare|finantam|subventie|subventii|credit|rate|rata)\b/,
    ],
    reply: () =>
      `Finanțare și Casa Verde Fotovoltaice:\n\n` +
      `• Casa Verde — subvenție AFM până la 20.000 lei pentru sisteme fotovoltaice rezidențiale. Sesiunile se deschid periodic (urmărim anunțurile AFM).\n` +
      `• Pregătim dosarul tehnic (devize, schiță, fișe tehnice) pentru depunere — clientul deschide cont AFM și depune.\n` +
      `• Plata: avans 30%, restul după montaj și înainte de PIF (punere în funcțiune).\n` +
      `• Rate / leasing: lucrăm cu BCR, Raiffeisen, BT și ProCredit pe credit verde / nevoie personală.\n\n` +
      `Pentru detalii actuale despre Casa Verde (ferestre deschise, plafon, condiții) verifică ${SITE}/finantare sau sună-ne — datele se schimbă cu fiecare sesiune.${CONTACT_BLOCK}`,
  },
  {
    id: 'timeline',
    patterns: [
      /\b(cand|cat dureaza|cat timp|durata|termen|livrare|montaj|instalare|cat ia|cat tine)\b/,
    ],
    reply: () =>
      `Termene orientative:\n\n` +
      `Fotovoltaic rezidențial:\n` +
      `• Ofertă fermă: 1–3 zile după ce primim datele.\n` +
      `• Comandă echipamente: 2–4 săptămâni (depinde de disponibilitate).\n` +
      `• Montaj fizic: 1–2 zile pentru sisteme 5–10 kWp.\n` +
      `• Punere în funcțiune (prosumator): 4–8 săptămâni după dosarul de racordare la DSO.\n\n` +
      `Acoperișuri:\n` +
      `• Tablă click / țiglă metalică: 3–10 zile lucru, în funcție de mărime.\n` +
      `• Refacere TPO industrial 500–1.500 mp: 5–14 zile.\n` +
      `• Reparație TPO punctuală: 1 zi.\n\n` +
      `În sezon plin (mai–octombrie) timpii se pot mări — planifică din timp.${CONTACT_BLOCK}`,
  },
  {
    id: 'sizing-pv',
    patterns: [
      /\b(cati|cate|ce|cat) (kwp|kw|panouri|panou|kilowati)\b/,
      /\b(consum|kwh)\b.*\b(panou|fotovoltaic|sistem)\b/,
      /\bcat.*sistem.*pentru\b/,
    ],
    reply: () =>
      `Dimensionare fotovoltaic — reguli simple:\n\n` +
      `• Sistem on-grid (compensare cantitativă, fără baterie): kWp ≈ consum anual (kWh) ÷ 1.100–1.300 (randament România).\n` +
      `   Exemplu: 5.000 kWh/an → ~4 kWp.\n` +
      `• Sistem cu prosumator: dimensiunea poate depăși consumul (până la 27 kW pentru rezidențial fără autorizație).\n` +
      `• Cu baterie pentru autoconsum nocturn: ~1 kWh baterie per kWp + minimum o curbă pe acoperire seara.\n\n` +
      `Pentru cifra ta exactă, folosește calculatorul de la ${SITE}/calculator — îți cere consumul lunar și-ți dă kWp, preț orientativ și payback.${CONTACT_BLOCK}`,
  },
  {
    id: 'inverter-battery',
    patterns: [/\b(invertor|invertoare|baterie|baterii|storage|backup|stocare)\b/],
    reply: () =>
      `Invertoare și baterii:\n\n` +
      `Invertoare hibride (cu input baterie):\n` +
      `• Huawei SUN2000 — top fiabilitate, monitorizare FusionSolar.\n` +
      `• Solis S6 / Deye SUN — raport preț/funcții foarte bun.\n` +
      `• Growatt MIN-TL3 / SPH — soluție economică solidă.\n\n` +
      `Baterii (LiFePO4, sigure, 6.000+ cicluri):\n` +
      `• Huawei LUNA 5–15 kWh — modulară, premium.\n` +
      `• Pylontech US3000C / US5000 — standard pentru sisteme medii.\n` +
      `• Dyness, BYD, GoodWe Lynx — alternative competitive.\n\n` +
      `Recomandarea concretă o facem după ce vedem consumul tău și ce vrei: ieftin/eficient (on-grid), siguranță la pene (cu baterie minimă) sau autonomie reală (baterie generos dimensionată).${CONTACT_BLOCK}`,
  },
  {
    id: 'roof-types',
    patterns: [
      /\b(ce fel|ce tip|ce alegere|diferenta|comparatie|comparativ)\b.*\b(acoperis|tabla|tigla|tpo)\b/,
      /\b(tabla|tigla)\b.*\b(vs|sau|in loc)\b.*\b(tabla|tigla|sindrila|onduline)\b/,
    ],
    reply: () =>
      `Ce alegi pentru acoperiș — pe scurt:\n\n` +
      `• Tablă click (standing seam) — aspect modern, etanșeitate excelentă, durabilitate 50+ ani. Mai scump la montaj, dar fără verigi slabe.\n` +
      `• Țiglă metalică modulară — aspect clasic, preț bun, montaj rapid. Standardul actual pentru case noi.\n` +
      `• Țiglă ceramică / beton — durabilitate maximă, greutate mai mare (verifică șarpanta), preț ridicat.\n` +
      `• Membrană TPO / PVC — exclusiv pentru acoperișuri plate / hale. Nu se folosește pe șarpante înclinate.\n` +
      `• Sindrilă bituminoasă — soluție ieftină, durată mai scurtă (15–20 ani), recomandată pentru forme complicate.\n\n` +
      `Pentru clădirea ta concretă, spune-ne forma acoperișului (înclinat / plat), bugetul orientativ și dacă e construcție nouă sau refacere — îți recomandăm soluția potrivită.${CONTACT_BLOCK}`,
  },
  {
    id: 'contact',
    patterns: [
      /\b(contact|telefon|email|adresa|locatie|locație|unde sunteti|cum va contactez|numar|whatsapp)\b/,
    ],
    reply: () =>
      `Datele de contact Solaris CET:\n\n` +
      `• Telefon: ${PHONE}\n` +
      `• WhatsApp: ${WHATSAPP}\n` +
      `• Email: ${EMAIL}\n` +
      `• Sediu: ${HQ}, România\n` +
      `• Acoperire: ${COVERAGE}\n\n` +
      `Răspundem rapid în interval 9:00–19:00 (luni–sâmbătă). Pentru urgențe (scurgeri active, pene majore) sună direct.\n\n` +
      `Pentru o cerere de ofertă structurată: ${SITE}/contact`,
  },
  {
    id: 'locations',
    patterns: [
      /\b(vaslui|iasi|bacau|galati|vrancea|neamt|botosani|suceava|moldova)\b/,
      /\b(zona|judet|judetul|oras|veniti|deplasare)\b/,
    ],
    reply: () =>
      `Acoperim în mod curent: ${COVERAGE}.\n\n` +
      `Pentru județele Moldovei (Vaslui, Iași, Bacău, Galați, Vrancea, Neamț, Botoșani, Suceava) deplasarea este inclusă în ofertă.\n\n` +
      `Pentru proiecte mai depărtate (Muntenia, Transilvania) lucrăm pentru clienți selectați — depinde de mărimea lucrării și disponibilitatea echipei. Sună-ne și discutăm: ${PHONE}.${CONTACT_BLOCK}`,
  },
  {
    id: 'calculator',
    patterns: [/\b(calculator|estimator|simulare|simulator|calcul|cat scot|cat economisesc)\b/],
    reply: () =>
      `Calculator fotovoltaic Solaris CET — îți estimează rapid sistemul potrivit:\n\n` +
      `${SITE}/calculator\n\n` +
      `Îți cere: consumul lunar mediu (kWh), tipul de client (casă/firmă), faza (mono/trifazat), județul și orientarea acoperișului. Îți întoarce:\n` +
      `• Putere recomandată (kWp)\n` +
      `• Interval de preț (EUR)\n` +
      `• Payback estimat (ani)\n` +
      `• Economie CO₂ anuală\n\n` +
      `După calcul, poți trimite datele direct ca cerere de ofertă.${CONTACT_BLOCK}`,
  },
  {
    id: 'warranty',
    patterns: [/\b(garantie|garantii|garantat|asigurare|service post)\b/],
    reply: () =>
      `Garanții oferite:\n\n` +
      `Fotovoltaic:\n` +
      `• Panouri: 25 ani garanție de produs, 30 ani de putere (la 87% din nominal).\n` +
      `• Invertor: 10–12 ani standard (extensibil la 20 la Huawei).\n` +
      `• Baterie: 10 ani sau 6.000 cicluri (LiFePO4).\n` +
      `• Montaj Solaris CET: 5 ani.\n\n` +
      `Acoperișuri:\n` +
      `• Tablă click / țiglă metalică: 30–50 ani produs (de la Lindab, Wetterbest, Bilka), 5 ani montaj.\n` +
      `• TPO: 10–15 ani membrana de la producător, 5 ani sudura noastră.\n\n` +
      `Toate garanțiile sunt scrise în contract, cu condițiile clare de menținere.${CONTACT_BLOCK}`,
  },
  {
    id: 'process',
    patterns: [
      /\b(cum proce|cum lucra|pasii|etapele|procesul|cum se desfasoara|cum incepem|de unde incep)\b/,
    ],
    reply: () =>
      `Procesul Solaris CET — de la primul mesaj la lucrare:\n\n` +
      `1. Primim cererea ta (formular, telefon sau WhatsApp).\n` +
      `2. Cerem datele cheie: consum, poze, localitate, tipul acoperișului.\n` +
      `3. Te sunăm pentru clarificări — 15–20 minute, fără insistență.\n` +
      `4. Trimitem oferta scrisă cu prețuri, echipamente, termen, condiții garanție.\n` +
      `5. Vizită tehnică la fața locului (la nevoie, pentru proiecte > 5.000 €).\n` +
      `6. Contract + avans 30% → comandă echipamente.\n` +
      `7. Montaj, recepție, documentație (inclusiv prosumator pentru PV).\n` +
      `8. Service post-montaj — răspundem la orice problemă în 48h.${CONTACT_BLOCK}`,
  },
  {
    id: 'thanks',
    patterns: [/\b(mersi|multumesc|merci|thanks|thx|salutare|la revedere|pa)\b/],
    reply: () =>
      `Cu plăcere! Dacă vrei să mergem mai departe, scrie-ne pe ${WHATSAPP} sau sună la ${PHONE}. Echipa Solaris CET îți răspunde repede.`,
  },
];

function detectIntent(query: string): Intent | null {
  const norm = normalize(query);
  if (!norm) return null;
  for (const intent of INTENTS) {
    if (intent.patterns.some((re) => re.test(norm))) {
      return intent;
    }
  }
  return null;
}

/**
 * Always returns a useful Romanian reply for any user query.
 * Used as deterministic fallback when AI providers are unavailable.
 */
export function answerFromKnowledgeBase(query: string): string {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return (
      `Salut! Eu sunt asistentul Solaris CET. Spune-mi pe scurt ce ai nevoie — fotovoltaice, acoperiș, atice/fațade, reparații — și județul în care te afli.${CONTACT_BLOCK}`
    );
  }
  const intent = detectIntent(trimmed);
  if (intent) return intent.reply();

  // Fallback "catch-all": acknowledges the question, redirects with options.
  return (
    `Mulțumesc pentru întrebare. Pentru a-ți da un răspuns precis am nevoie de mai multe detalii — în special:\n\n` +
    `• Tipul lucrării (fotovoltaice, acoperiș tablă / țiglă / TPO, atice/fațade, reparații)\n` +
    `• Localitatea / județul\n` +
    `• Dimensiunea aproximativă (kWp pentru PV, mp pentru acoperiș) sau consumul lunar (kWh)\n\n` +
    `Pentru oferta exactă completează formularul scurt la ${SITE}/contact sau sună-ne direct și ne ocupăm de tine în 15 minute.${CONTACT_BLOCK}`
  );
}

/**
 * Lightweight detection: is this query about the company's physical services
 * (so we can pick a Solaris-CET-flavoured reply even without LLMs)?
 */
export function isCompanyServiceQuery(query: string): boolean {
  return detectIntent(query) !== null;
}
