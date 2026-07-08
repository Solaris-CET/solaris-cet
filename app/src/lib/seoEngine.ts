import { type UrlLocale } from '@/i18n/urlRouting';
import { type BlogLocale, getBlogPost } from '@/lib/blog';
import { getServiceDetail } from '@/lib/serviceDetails';
import { companyFaqItems } from '@/sections/CompanyFaqSection';

export type RouteSeo = {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: unknown;
};

export function asBlogLocale(locale: UrlLocale): BlogLocale {
  return locale === 'ro' || locale === 'es' ? locale : 'en';
}

type PortfolioSchemaItem = {
  name: string;
  location: string;
  description: string;
  image: string;
};

type JsonLdGraphNode = Record<string, unknown>;

export const portfolioSchemaItems: PortfolioSchemaItem[] = [
  {
    name: 'Sistem fotovoltaic 8 kWp - Casa familiala',
    location: 'Vaslui, jud. Vaslui',
    description: 'Sistem on-grid 8 kWp cu 16 panouri monocristaline 500W si productie estimata la 9.200 kWh/an.',
    image: 'https://solaris-cet.com/og-image.png',
  },
  {
    name: 'Sistem fotovoltaic 50 kWp - Hala productie',
    location: 'Barlad, jud. Vaslui',
    description: 'Sistem trifazat 50 kWp cu monitorizare online si executie in 5 zile fara oprirea productiei.',
    image: 'https://solaris-cet.com/og-image.png',
  },
  {
    name: 'Acoperis tabla click - Hala depozitare',
    location: 'Barlad, jud. Vaslui',
    description: 'Montaj acoperis tabla click 0.6mm, 800 mp, cu sistem complet de jgheaburi si burlane.',
    image: 'https://solaris-cet.com/og-image.png',
  },
  {
    name: 'Membrana TPO - Depozit logistic',
    location: 'Iasi, jud. Iasi',
    description: 'Hidroizolatie pentru acoperis plat cu membrana TPO 1.5mm si detalii complete la atice si scurgeri.',
    image: 'https://solaris-cet.com/og-image.png',
  },
  {
    name: 'Fatada tabla cutata - Cladire birouri',
    location: 'Vaslui, jud. Vaslui',
    description: 'Reabilitare fatada 300 mp cu tabla cutata RAL 7016 si termoizolatie inclusa.',
    image: 'https://solaris-cet.com/og-image.png',
  },
  {
    name: 'Mentenanta sistem fotovoltaic',
    location: 'Negresti, jud. Vaslui',
    description: 'Inspectie, curatare panouri si inlocuire module pentru recuperarea productiei.',
    image: 'https://solaris-cet.com/og-image.png',
  },
];

export function buildGlobalJsonLd(origin: string) {
  const businessId = `${origin}/#business`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': businessId,
        name: 'Solaris CET',
        url: origin,
        telephone: '+40769889721',
        email: 'solaris-cet@protonmail.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Vaslui',
          addressRegion: 'Vaslui',
          addressCountry: 'RO',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 46.6407,
          longitude: 27.7276,
        },
        areaServed: [
          { '@type': 'State', name: 'Vaslui' },
          { '@type': 'State', name: 'Iași' },
          { '@type': 'State', name: 'Bacău' },
          { '@type': 'State', name: 'Galați' },
          { '@type': 'Country', name: 'Romania' },
        ],
        priceRange: '$$',
        description:
          'Instalații fotovoltaice rezidențiale și industriale, acoperișuri tablă/TPO, atice, fațade și mentenanță în Vaslui și România.',
        sameAs: ['https://wa.me/40769889721'],
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'Solaris CET',
        inLanguage: 'ro-RO',
        publisher: { '@id': businessId },
      },
    ],
  };
}

export function buildServiceJsonLd(origin: string, name: string, url: string) {
  return {
    '@type': 'Service',
    name,
    provider: { '@id': `${origin}/#business` },
    areaServed: { '@type': 'Country', name: 'Romania' },
    url,
  };
}

export function graphNodesFromJsonLd(payload: unknown): JsonLdGraphNode[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const graph = record['@graph'];
  if (Array.isArray(graph)) {
    return graph.filter((item): item is JsonLdGraphNode => Boolean(item) && typeof item === 'object');
  }
  const { ['@context']: _context, ...node } = record;
  return Object.keys(node).length ? [node] : [];
}

export function mergeJsonLd(...payloads: Array<unknown>): RouteSeo['jsonLd'] {
  const graph = payloads.flatMap((payload) => graphNodesFromJsonLd(payload));
  if (!graph.length) return undefined;
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function buildBreadcrumbJsonLd(origin: string, urlLocale: UrlLocale, pathnameNoLocale: string) {
  const normalized = (pathnameNoLocale || '/').replace(/\/$/, '') || '/';
  const segments = normalized.split('/').filter(Boolean);
  const items: Array<{ name: string; item: string }> = [
    { name: 'Home', item: `${origin}/${urlLocale}/` },
  ];
  if (segments.length > 0) {
    const name =
      normalized === '/servicii'
        ? 'Servicii'
        : normalized === '/contact'
          ? 'Contact'
          : normalized === '/despre'
            ? 'Despre noi'
            : normalized === '/finantare'
              ? 'Finanțare'
              : normalized.startsWith('/finantare/')
                ? 'Finanțare'
                : normalized === '/blog'
                  ? 'Blog'
                  : normalized.startsWith('/blog/')
                    ? 'Blog'
                    : normalized === '/faq'
                      ? 'Întrebări frecvente'
                      : normalized.slice(1);
    items.push({ name, item: `${origin}/${urlLocale}${normalized}` });
  }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((x, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: x.name,
      item: x.item,
    })),
  };
}

export function buildProjectsJsonLd(origin: string, urlLocale: UrlLocale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Proiecte Solaris CET',
        url: `${origin}/${urlLocale}/proiecte`,
        description: 'Portofoliu orientativ cu proiecte de fotovoltaice, acoperișuri și intervenții TPO.',
      },
      {
        '@type': 'ItemList',
        itemListElement: portfolioSchemaItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: `${item.name} — ${item.location}`,
            description: item.description,
            image: item.image,
            url: `${origin}/${urlLocale}/proiecte`,
          },
        })),
      },
      ...portfolioSchemaItems.map((item) => ({
        '@type': 'ImageObject',
        contentUrl: item.image,
        url: item.image,
        name: `${item.name} — ${item.location}`,
        caption: item.description,
      })),
      buildBreadcrumbJsonLd(origin, urlLocale, '/proiecte'),
    ],
  };
}

export function getRouteSeo(origin: string, urlLocale: UrlLocale, pathnameNoLocale: string): RouteSeo {
  const path = (pathnameNoLocale || '/').replace(/\/$/, '') || '/';

  const base: Record<string, RouteSeo> = {
    '/': {
      title: 'Panouri Fotovoltaice și Acoperișuri în Vaslui | Ofertă Rapidă — Solaris CET',
      description:
        'Panouri fotovoltaice rezidențiale și industriale, acoperișuri tablă și TPO în Vaslui și Moldova. Evaluare inițială, ofertă clară și contact rapid.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: companyFaqItems.map((x) => ({
              '@type': 'Question',
              name: x.question,
              acceptedAnswer: { '@type': 'Answer', text: x.answer },
            })),
          },
        ],
      },
      keywords:
        'panouri fotovoltaice, instalatii fotovoltaice, acoperisuri, tabla, tigla metalica, tpo, constructii, mentenanta, vaslui, cetatuia',
      ogType: 'website',
    },
    '/servicii': {
      title: 'Servicii — Solaris CET',
      description:
        'Detalii servicii: fotovoltaice, construcții, acoperișuri tablă/țiglă/TPO, atice și fațade tablă, reparații și mentenanță.',
      keywords:
        'servicii fotovoltaice, montaj panouri fotovoltaice, acoperis tpo, acoperis tabla, reparatii acoperis, mentenanta fotovoltaice',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          buildServiceJsonLd(origin, 'Servicii Solaris CET', `${origin}/servicii/`),
          {
            '@type': 'ItemList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                item: { '@type': 'Service', name: 'Fotovoltaice Rezidențiale', url: `${origin}/${urlLocale}/servicii/fotovoltaice-rezidentiale` },
              },
              {
                '@type': 'ListItem',
                position: 2,
                item: { '@type': 'Service', name: 'Fotovoltaice Industriale', url: `${origin}/${urlLocale}/servicii/fotovoltaice-industriale` },
              },
              {
                '@type': 'ListItem',
                position: 3,
                item: { '@type': 'Service', name: 'Acoperișuri Tablă/Țiglă', url: `${origin}/${urlLocale}/servicii/acoperisuri-tabla-tigla` },
              },
              {
                '@type': 'ListItem',
                position: 4,
                item: { '@type': 'Service', name: 'Acoperișuri Industriale TPO', url: `${origin}/${urlLocale}/servicii/acoperisuri-industriale-tpo` },
              },
            ],
          },
          buildBreadcrumbJsonLd(origin, urlLocale, '/servicii'),
        ],
      },
    },
    '/contact': {
      title: 'Contact — Solaris CET',
      description: 'Cere ofertă sau contactează Solaris CET: +40 769 889 721 · solaris-cet@protonmail.com.',
      keywords: 'contact solaris cet, oferta fotovoltaice, vaslui, cetatuia, telefon, email',
      ogType: 'website',
    },
    '/calculator': {
      title: 'Calculator fotovoltaic — Solaris CET',
      description: 'Estimare orientativă: putere sistem, număr panouri, preț estimat, economii și amortizare. Cere ofertă personalizată.',
      keywords: 'calculator fotovoltaic, instalatii fotovoltaice pret, panouri solare vaslui, economii energie',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebApplication', name: 'Calculator fotovoltaic', applicationCategory: 'BusinessApplication', url: `${origin}/${urlLocale}/calculator` },
          buildBreadcrumbJsonLd(origin, urlLocale, '/calculator'),
        ],
      },
    },
    '/survey': {
      title: 'Survey șantier — Solaris CET',
      description: 'Aplicație tehnicieni: upload poze, checklist șantier, raport PDF permit-ready cu analiză AI.',
      keywords: 'survey fotovoltaic, raport santier, documentatie solar, tehnician instalator',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebApplication', name: 'SOLARIS CET Survey', applicationCategory: 'BusinessApplication', url: `${origin}/${urlLocale}/survey` },
          buildBreadcrumbJsonLd(origin, urlLocale, '/survey'),
        ],
      },
    },
    '/cere-oferta': {
      title: 'Cere ofertă — Solaris CET',
      description: 'Cere ofertă pentru fotovoltaice, acoperișuri sau mentenanță. Revenim rapid cu pașii următori.',
      ogType: 'website',
    },
    '/proiecte': {
      title: 'Proiecte realizate - Solaris CET | Fotovoltaice si Acoperisuri Vaslui',
      description: 'Portofoliu Solaris CET: proiecte fotovoltaice si acoperisuri executate in Vaslui si Moldova. Cere poze reale pe WhatsApp.',
      keywords: 'proiecte realizate, portofoliu solaris cet, fotovoltaice vaslui, acoperisuri vaslui, fatade tabla, mentenanta fotovoltaice',
      ogType: 'website',
      jsonLd: buildProjectsJsonLd(origin, urlLocale),
    },
    '/portofoliu': {
      title: 'Portofoliu — Solaris CET',
      description: 'Galerie proiecte: fotovoltaice, acoperișuri și atice/fațade tablă. Vezi lucrări orientative și cere ofertă.',
      keywords: 'portofoliu, proiecte fotovoltaice, lucrari acoperisuri, tpo, atice, fatade tabla, vaslui',
      ogType: 'website',
    },
    '/portfolio': {
      title: 'Portofoliu — Solaris CET',
      description: 'Portofoliu proiecte: fotovoltaice, acoperișuri și atice/fațade tablă.',
      ogType: 'website',
      noindex: true,
    },
    '/services': {
      title: 'Servicii — Solaris CET',
      description: 'Servicii Solaris CET: fotovoltaice, acoperișuri, atice/fațade tablă, reparații și mentenanță.',
      ogType: 'website',
      noindex: true,
    },
    '/multumim': {
      title: 'Mulțumim — Solaris CET',
      description: 'Am primit cererea ta. Revenim în cel mult 24 de ore.',
      ogType: 'website',
      noindex: true,
    },
    '/token-cet': {
      title: 'Token CET — Solaris CET',
      description: 'Informații despre tokenul CET și ecosistemul Solaris CET.',
      ogType: 'article',
      noindex: true,
    },
    '/despre': {
      title: 'Despre noi — Solaris CET',
      description: 'Despre Solaris CET: fotovoltaice, construcții, acoperișuri și mentenanță, cu acoperire în Moldova și național.',
      ogType: 'article',
    },
    '/finantare': {
      title: 'Finanțare — Solaris CET',
      description: 'Pagini orientative: Casa Verde 2025, Casa Verde Baterii 2026, REPowerEU. Consultanță și suport dosar.',
      keywords: 'casa verde 2025, casa verde baterii 2026, repowereu, afm, fonduri nerambursabile fotovoltaice',
      ogType: 'website',
    },
    '/finantare/casa-verde-2025': {
      title: 'Casa Verde 2025 — Solaris CET',
      description: 'Ghid orientativ: eligibilitate, pași și documente. Verifică ghidul oficial pe afm.ro.',
      ogType: 'article',
    },
    '/finantare/casa-verde-baterii-2026': {
      title: 'Casa Verde Baterii 2026 — Solaris CET',
      description: 'Ghid orientativ: până la 20.000 lei, eligibilitate, pași și documente. Verifică ghidul oficial pe afm.ro.',
      ogType: 'article',
    },
    '/finantare/repowereu': {
      title: 'REPowerEU — Solaris CET',
      description: 'Ghid orientativ și pași. Consultă sursele oficiale și cere consultanță gratuită.',
      ogType: 'article',
    },
    '/blog': {
      title: 'Blog — Solaris CET',
      description: 'Articole utile despre fotovoltaice, acoperișuri, mentenanță și finanțare.',
      ogType: 'website',
    },
    '/faq': {
      title: 'Întrebări frecvente — Solaris CET',
      description: 'Întrebări frecvente despre servicii, ofertare și execuție (fotovoltaice, acoperișuri, TPO).',
      ogType: 'article',
    },
    '/privacy': {
      title: 'Confidențialitate — Solaris CET',
      description: 'Politica de confidențialitate Solaris CET.',
      ogType: 'article',
    },
    '/terms': {
      title: 'Termeni — Solaris CET',
      description: 'Termeni și condiții Solaris CET.',
      ogType: 'article',
    },
    '/cookies': {
      title: 'Cookie-uri — Solaris CET',
      description: 'Politica de cookie-uri Solaris CET.',
      ogType: 'article',
    },
    '/politica-confidentialitate': {
      title: 'Confidențialitate — Solaris CET',
      description: 'Politica de confidențialitate Solaris CET.',
      ogType: 'article',
      noindex: true,
    },
    '/politica-cookies': {
      title: 'Cookie-uri — Solaris CET',
      description: 'Politica de cookie-uri Solaris CET.',
      ogType: 'article',
      noindex: true,
    },
    '/termeni-si-conditii': {
      title: 'Termeni — Solaris CET',
      description: 'Termeni și condiții Solaris CET.',
      ogType: 'article',
      noindex: true,
    },
    '/despre-noi': {
      title: 'Despre noi — Solaris CET',
      description: 'Despre Solaris CET: fotovoltaice, construcții, acoperișuri și mentenanță, cu acoperire în Moldova și național.',
      ogType: 'article',
      noindex: true,
    },
    '/galerie': {
      title: 'Portofoliu — Solaris CET',
      description: 'Galerie proiecte: fotovoltaice, acoperișuri și atice/fațade tablă.',
      ogType: 'website',
      noindex: true,
    },
    '/vaslui': {
      title: 'Vaslui — Solaris CET',
      description: 'Servicii Solaris CET în Vaslui: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță.',
      ogType: 'website',
    },
    '/bacau': {
      title: 'Bacău — Solaris CET',
      description: 'Servicii Solaris CET în Bacău: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță.',
      ogType: 'website',
    },
    '/iasi': {
      title: 'Iași — Solaris CET',
      description: 'Servicii Solaris CET în Iași: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță.',
      ogType: 'website',
    },
    '/galati': {
      title: 'Galați — Solaris CET',
      description: 'Servicii Solaris CET în Galați: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță.',
      ogType: 'website',
    },
    '/privacy-settings': {
      title: 'Setări cookie — Solaris CET',
      description: 'Preferințe cookie (analitice/marketing) pentru Solaris CET.',
      ogType: 'article',
      noindex: true,
    },
  };

  const found = base[path];
  if (!found) {
    if (path.startsWith('/servicii/')) {
      const slug = path.replace(/^\/servicii\//, '');
      const service = getServiceDetail(slug);
      if (!service) {
        return {
          title: 'Serviciu — Solaris CET',
          description: 'Detalii serviciu Solaris CET.',
          noindex: true,
          ogType: 'article',
        };
      }
      return {
        title: `${service.title} — Solaris CET`,
        description: service.subtitle,
        ogType: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@graph': [
            buildServiceJsonLd(origin, service.title, `${origin}${path}/`),
            {
              '@type': 'FAQPage',
              mainEntity: service.faq.map((x) => ({
                '@type': 'Question',
                name: x.question,
                acceptedAnswer: { '@type': 'Answer', text: x.answer },
              })),
            },
            buildBreadcrumbJsonLd(origin, urlLocale, path),
          ],
        },
      };
    }
    if (path.startsWith('/blog/')) {
      const slug = path.replace(/^\/blog\//, '').replace(/\/+$/, '');
      const post = getBlogPost(asBlogLocale(urlLocale), slug);
      if (post) {
        return {
          title: `${post.frontmatter.title} — Solaris CET`,
          description: post.frontmatter.description || post.excerpt,
          ogType: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@graph': [post.schema, buildBreadcrumbJsonLd(origin, urlLocale, path)],
          },
        };
      }
      return {
        title: 'Articol — Solaris CET',
        description: 'Articol din blogul Solaris CET.',
        ogType: 'article',
        jsonLd: { '@context': 'https://schema.org', '@graph': [buildBreadcrumbJsonLd(origin, urlLocale, '/blog')] },
      };
    }
    return {
      title: 'Pagină inexistentă — Solaris CET',
      description: 'Pagina cerută nu există.',
      noindex: true,
      ogType: 'website',
    };
  }

  const breadcrumb = buildBreadcrumbJsonLd(origin, urlLocale, path);

  if (path === '/faq') {
    const faqs = companyFaqItems.map((item) => ({
      q: item.question,
      a: item.answer,
    }));

    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((x) => ({
              '@type': 'Question',
              name: x.q,
              acceptedAnswer: { '@type': 'Answer', text: x.a },
            })),
          },
          breadcrumb,
        ],
      },
    };
  }

  if (path === '/finantare/casa-verde-baterii-2026') {
    const faqs = [
      {
        q: 'Cine poate beneficia de Casa Verde Baterii?',
        a: 'Eligibilitatea depinde de ghidul oficial AFM și de condițiile programului la momentul lansării. Consultă afm.ro pentru versiunea curentă.',
      },
      {
        q: 'Care este suma maximă acordată?',
        a: 'Suma maximă poate diferi între ediții. Verifică ghidul AFM pentru cifra exactă.',
      },
      {
        q: 'Ce documente sunt necesare?',
        a: 'Lista exactă este în ghidul oficial. În general, se cer acte de identitate, documente imobil și formulare/declaratii.',
      },
    ];
    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((x) => ({
              '@type': 'Question',
              name: x.q,
              acceptedAnswer: { '@type': 'Answer', text: x.a },
            })),
          },
          breadcrumb,
        ],
      },
    };
  }

  if (path === '/finantare/casa-verde-2025') {
    const faqs = [
      {
        q: 'Cine poate beneficia de Casa Verde 2025?',
        a: 'Eligibilitatea este definită în ghidul AFM pentru ediția curentă. Consultă afm.ro pentru condiții.',
      },
      {
        q: 'Ce pași sunt necesari?',
        a: 'Evaluare tehnică, pregătire documente, depunere în perioada oficială, implementare și punere în funcțiune.',
      },
      {
        q: 'Ce documente se cer?',
        a: 'Documentele diferă între ediții. Verifică lista oficială AFM pentru ediția curentă.',
      },
    ];
    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((x) => ({
              '@type': 'Question',
              name: x.q,
              acceptedAnswer: { '@type': 'Answer', text: x.a },
            })),
          },
          breadcrumb,
        ],
      },
    };
  }

  if (path === '/finantare/repowereu') {
    const faqs = [
      {
        q: 'Ce este REPowerEU?',
        a: 'Un cadru de măsuri care susține independența energetică și investițiile în eficiență/energie regenerabilă; implementarea concretă depinde de ghidurile curente.',
      },
      {
        q: 'Cum verific condițiile?',
        a: 'Consultă sursele oficiale și ghidurile publicate; noi putem oferi consultanță tehnică pentru cazul tău.',
      },
    ];
    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((x) => ({
              '@type': 'Question',
              name: x.q,
              acceptedAnswer: { '@type': 'Answer', text: x.a },
            })),
          },
          breadcrumb,
        ],
      },
    };
  }

  if (path === '/servicii') {
    const services = [
      { id: 'fotovoltaice', name: 'Instalații fotovoltaice' },
      { id: 'constructii', name: 'Lucrări de construcții' },
      { id: 'acoperisuri', name: 'Acoperișuri (tablă / țiglă)' },
      { id: 'tpo', name: 'Acoperișuri industriale (folie TPO)' },
      { id: 'atice-fatade', name: 'Atice și fațade tablă' },
      { id: 'reparatii', name: 'Reparații și mentenanță' },
    ];
    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ItemList',
            itemListElement: services.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Service',
                name: s.name,
                url: `${origin}/${urlLocale}/servicii#${s.id}`,
              },
            })),
          },
          breadcrumb,
        ],
      },
    };
  }

  if (path === '/contact') {
    return {
      ...found,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ContactPage',
            name: 'Contact Solaris CET',
            url: `${origin}/${urlLocale}/contact`,
          },
          breadcrumb,
        ],
      },
    };
  }

  return { ...found, jsonLd: { '@context': 'https://schema.org', '@graph': [breadcrumb] } };
}
