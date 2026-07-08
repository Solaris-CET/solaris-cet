export const TESTIMONIALS_PATH = '/api/testimonials';
export const TESTIMONIALS_METHODS = 'GET, HEAD, OPTIONS';

export const TESTIMONIALS_PROBE = {
  path: TESTIMONIALS_PATH,
  methods: ['GET', 'HEAD', 'OPTIONS'] as const,
  authRequired: false,
  source: 'static' as const,
  cacheControl: 'no-store' as const,
};

export type Testimonial = {
  name: string;
  location: string;
  service: string;
  rating: number;
  text: string;
  date: string;
};

export const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    name: 'M. Popa',
    location: 'Vaslui',
    service: 'Fotovoltaice rezidentiale',
    rating: 5,
    text: 'Lucrarea arata curat, ne-au explicat pasii si avem monitorizarea in aplicatie. Au fost punctuali si atenti la detalii.',
    date: '2026-04-18',
  },
  {
    name: 'A. Iacob',
    location: 'Bacau',
    service: 'Fotovoltaice industriale',
    rating: 5,
    text: 'Au venit cu un plan clar si au lucrat etapizat, fara sa blocheze activitatea. Comunicare buna si executie ordonata.',
    date: '2026-03-27',
  },
  {
    name: 'D. Rusu',
    location: 'Iasi',
    service: 'Reparatii si mentenanta',
    rating: 5,
    text: 'Au identificat rapid cauza si au refacut zona cu detalii foarte curate. Ne-au dat si un plan de verificare periodica.',
    date: '2026-02-11',
  },
  {
    name: 'C. Enache',
    location: 'Neamt',
    service: 'Acoperis tabla click',
    rating: 5,
    text: 'Au facut un finisaj foarte curat, iar detaliile la streasina si coama arata impecabil. Comunicare buna pe tot parcursul.',
    date: '2026-01-30',
  },
];

export function buildTestimonialsPayload(now = new Date()) {
  return {
    testimonials: STATIC_TESTIMONIALS,
    total: STATIC_TESTIMONIALS.length,
    source: TESTIMONIALS_PROBE.source,
    updatedAt: now.toISOString(),
  };
}