import { getAllowedOrigin } from '../lib/cors';
import { corsJson, corsOptions } from '../lib/http';

export const config = { runtime: 'nodejs' };

type Testimonial = {
  name: string;
  location: string;
  service: string;
  rating: number;
  text: string;
  date: string;
};

const TESTIMONIALS: Testimonial[] = [
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return corsOptions(req, 'GET, HEAD, OPTIONS');
  }

  if (req.method === 'HEAD') {
    const origin = req.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (req.method !== 'GET') {
    return corsJson(req, 405, { error: 'Method not allowed' });
  }

  return corsJson(req, 200, {
    testimonials: TESTIMONIALS,
    total: TESTIMONIALS.length,
    source: 'static',
    updatedAt: new Date().toISOString(),
  });
}
