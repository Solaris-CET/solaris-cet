import { Building2, CalendarClock, Home, PlugZap, Settings } from 'lucide-react';

export type CompanyDepartmentId =
  | 'fotovoltaice'
  | 'constructii'
  | 'acoperisuri'
  | 'tpo-industrial'
  | 'atice-fatade'
  | 'reparatii'
  | 'ofertare';

export type CompanyDepartment = {
  id: CompanyDepartmentId;
  name: string;
  icon: typeof PlugZap;
  description: string;
  capabilities: string[];
  quickPrompts: string[];
};

export const companyDepartments: CompanyDepartment[] = [
  {
    id: 'fotovoltaice',
    name: 'Instalații fotovoltaice',
    icon: PlugZap,
    description: 'Sisteme rezidențiale și industriale, proiectare, montaj, punere în funcțiune și mentenanță.',
    capabilities: [
      'Evaluare tehnică + dimensionare corectă (consum, orientare, umbriri)',
      'Dosar prosumator și punere în funcțiune (unde este cazul)',
      'Sisteme on-grid / hibride / cu baterii',
      'Monitorizare, mentenanță, intervenții și optimizări',
    ],
    quickPrompts: [
      'Vreau o ofertă pentru un sistem fotovoltaic la casă.',
      'Ce putere îmi recomanzi pentru consumul meu lunar?',
      'Aveți mentenanță și curățare panouri?',
    ],
  },
  {
    id: 'constructii',
    name: 'Lucrări de construcții',
    icon: Building2,
    description: 'Lucrări rezidențiale și industriale, structură, reparații și finisaje, după necesități.',
    capabilities: [
      'Execuție lucrări construcții și reparații',
      'Coordonare șantier și planificare',
      'Lucrări la anvelopă și elemente conexe',
    ],
    quickPrompts: ['Am nevoie de o echipă pentru o lucrare de construcții.', 'Cât durează o lucrare tipică?', 'Puteți veni la o evaluare?'],
  },
  {
    id: 'acoperisuri',
    name: 'Acoperișuri (tablă / țiglă)',
    icon: Home,
    description: 'Montaj, reparații și înlocuiri: tablă, țiglă metalică și accesorii pentru etanșeitate.',
    capabilities: [
      'Montaj tablă click/fălțuită și țiglă metalică',
      'Sisteme pluviale și detalii de etanșare',
      'Reparații: infiltrații, prinderi, coame, dolii',
    ],
    quickPrompts: ['Am infiltrații la acoperiș. Puteți interveni?', 'Vreau să schimb acoperișul cu tablă click.', 'Faceți și reparații urgente?'],
  },
  {
    id: 'tpo-industrial',
    name: 'Acoperișuri industriale (folie TPO)',
    icon: Building2,
    description: 'Membrane TPO pentru hale/centre comerciale, detalii la atice, scurgeri și zone critice.',
    capabilities: [
      'Montaj și reparații membrane TPO',
      'Detalii profesionale la atice, scafe, străpungeri',
      'Plan de întreținere preventivă pentru acoperișuri industriale',
    ],
    quickPrompts: ['Avem un acoperiș tip supermarket cu folie TPO.', 'Aveți soluții pentru infiltrații la terase industriale?', 'Puteți face o inspecție și raport?'],
  },
  {
    id: 'atice-fatade',
    name: 'Atice și fațade tablă',
    icon: Building2,
    description: 'Montaje atice și fațade din tablă, finisaje curate și detalii rezistente.',
    capabilities: ['Montaj atice tablă', 'Placări fațade tablă', 'Reparații și înlocuiri elemente deteriorate'],
    quickPrompts: ['Aveți montaj atice tablă?', 'Vreau placare fațadă cu tablă.', 'Se pot repara elemente existente?'],
  },
  {
    id: 'reparatii',
    name: 'Reparații și mentenanță',
    icon: Settings,
    description: 'Intervenții rapide și mentenanță pentru fotovoltaice și acoperișuri.',
    capabilities: ['Identificare cauză + remediere', 'Înlocuiri locale (tablă/membrană)', 'Verificări periodice și plan de mentenanță'],
    quickPrompts: ['Am o problemă și vreau o intervenție rapidă.', 'Aveți abonament de mentenanță?', 'Faceți și verificări periodice?'],
  },
  {
    id: 'ofertare',
    name: 'Ofertare & programări',
    icon: CalendarClock,
    description: 'Stabilim detaliile și îți pregătim oferta potrivită, cu pași clari și termene.',
    capabilities: ['Colectare cerințe și buget', 'Programare evaluare la locație', 'Ofertă pe etape (materiale + manoperă)'],
    quickPrompts: ['Vreau o ofertă. Ce informații vă trebuie?', 'Cum programez o vizită la locație?', 'Cât durează până primesc oferta?'],
  },
];
