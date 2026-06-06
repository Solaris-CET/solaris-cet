import './App.css';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import CookieConsentBanner from '@/components/CookieConsentBanner';
import { Toaster } from '@/components/ui/sonner';
import { companyProfile } from '@/data/companyProfile';
import { parseUrlLocaleFromPathname, type UrlLocale,urlLocaleFromLang } from '@/i18n/urlRouting';
import { refreshScrollReveal } from '@/js/reveal';
import { getServiceDetail } from '@/lib/serviceDetails';
import { applySpaSeo } from '@/lib/spaSeo';
import { companyFaqItems } from '@/sections/CompanyFaqSection';

import Navigation from './components/Navigation';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { useTelegram } from './hooks/useTelegram';
import { NotFoundPage } from './pages_legacy/NotFoundPage';

const HomePage = lazy(() => import('./pages_legacy/HomePage'));
const ServicesPage = lazy(() => import('./pages_legacy/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages_legacy/ServiceDetailPage'));
const ContactPage = lazy(() => import('./pages_legacy/ContactPage'));
const TokenCetPage = lazy(() => import('./pages_legacy/TokenCetPage'));
const AboutPage = lazy(() => import('./pages_legacy/AboutPage'));
const FaqPage = lazy(() => import('./pages_legacy/FaqPage'));
const ArticlesPage = lazy(() => import('./pages_legacy/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages_legacy/ArticlePage'));
const FinancingHubPage = lazy(() => import('./pages_legacy/FinancingHubPage'));
const FinancingCasaVerde2025Page = lazy(() => import('./pages_legacy/FinancingCasaVerde2025Page'));
const FinancingCasaVerdeBaterii2026Page = lazy(() => import('./pages_legacy/FinancingCasaVerdeBaterii2026Page'));
const FinancingRePowerEuPage = lazy(() => import('./pages_legacy/FinancingRePowerEuPage'));
const ProjectsPage = lazy(() => import('./pages_legacy/ProjectsPage'));
const ThankYouPage = lazy(() => import('./pages_legacy/ThankYouPage'));
const LegalDocPage = lazy(() => import('./pages_legacy/LegalDocPage'));
const CookieSettingsPage = lazy(() => import('./pages_legacy/CookieSettingsPage'));
const LocationPage = lazy(() => import('./pages_legacy/LocationPage'));
const SolarisChatWidget = lazy(() =>
  import('@/components/company/SolarisChatWidget').then((m) => ({ default: m.SolarisChatWidget })),
);

function normalizePathname(pathname: string): string {
  const clean = (pathname || '/').replace(/\/$/, '') || '/';
  if (clean === '/index.html') return '/';
  const m = clean.match(/^\/(en|ro|es|de|pt|ru|zh)(\/|$)/);
  if (!m) return clean || '/';
  const rest = clean.slice(3);
  return (rest || '/').replace(/\/$/, '') || '/';
}

function isInternalLink(a: HTMLAnchorElement): boolean {
  const href = a.getAttribute('href') ?? '';
  if (!href || href === '#' || href.startsWith('#')) return false;
  if (a.hasAttribute('download')) return false;
  const target = (a.getAttribute('target') ?? '').toLowerCase();
  if (target && target !== '_self') return false;
  if (a.getAttribute('rel')?.includes('external')) return false;
  if (a.getAttribute('data-no-spa') === '1') return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname.startsWith('/api/')) return false;
    return true;
  } catch {
    return false;
  }
}

type RouteSeo = {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: unknown;
};

function buildBreadcrumbJsonLd(origin: string, urlLocale: UrlLocale, pathnameNoLocale: string) {
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

function getRouteSeo(origin: string, urlLocale: UrlLocale, pathnameNoLocale: string): RouteSeo {
  const path = (pathnameNoLocale || '/').replace(/\/$/, '') || '/';

  const base: Record<string, RouteSeo> = {
    '/': {
      title: 'Solaris CET — Fotovoltaice, Acoperișuri, Construcții',
      description:
        'Servicii complete: instalații fotovoltaice, construcții, acoperișuri tablă/țiglă/TPO, atice și fațade tablă, reparații.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'LocalBusiness',
            name: companyProfile.name,
            url: `${origin}/${urlLocale}/`,
            telephone: companyProfile.phoneDisplay,
            email: companyProfile.email,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Vaslui',
              addressCountry: 'RO',
            },
            areaServed: 'RO',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: companyProfile.reviews.ratingValue,
              reviewCount: companyProfile.reviews.ratingCount,
            },
          },
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
    },
    '/contact': {
      title: 'Contact — Solaris CET',
      description: 'Cere ofertă sau contactează Solaris CET: +40 769 889 721 · solaris-cet@protonmail.com.',
      keywords: 'contact solaris cet, oferta fotovoltaice, vaslui, cetatuia, telefon, email',
      ogType: 'website',
    },
    '/cere-oferta': {
      title: 'Cere ofertă — Solaris CET',
      description: 'Cere ofertă pentru fotovoltaice, acoperișuri sau mentenanță. Revenim rapid cu pașii următori.',
      ogType: 'website',
    },
    '/proiecte': {
      title: 'Proiecte — Solaris CET',
      description: 'Galerie proiecte: fotovoltaice, acoperișuri și atice/fațade tablă. Vezi lucrări orientative și cere ofertă.',
      keywords: 'proiecte fotovoltaice, portofoliu, lucrari acoperisuri, tpo, atice, fatade tabla, vaslui',
      ogType: 'website',
    },
    '/portofoliu': {
      title: 'Portofoliu — Solaris CET',
      description: 'Galerie proiecte: fotovoltaice, acoperișuri și atice/fațade tablă. Vezi lucrări orientative și cere ofertă.',
      keywords: 'portofoliu, proiecte fotovoltaice, lucrari acoperisuri, tpo, atice, fatade tabla, vaslui',
      ogType: 'website',
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
    const faqs =
      urlLocale === 'ro'
        ? [
            {
              q: 'Cât durează o instalare fotovoltaică?',
              a: 'Depinde de complexitate și de condițiile din teren. După evaluare, îți spunem pașii și termenele realiste (montaj + punere în funcțiune).',
            },
            {
              q: 'Ce informații vă trebuie pentru ofertă?',
              a: 'Locația, consumul (facturi), tipul acoperișului/structurii, orientare/umbriri și ce obiectiv ai (autoconsum, baterie, EV, industrial).',
            },
            {
              q: 'Faceți reparații la acoperiș și infiltrații?',
              a: 'Da. Facem diagnostic și intervenții punctuale (tablă/țiglă/TPO) și putem propune un plan de mentenanță preventivă.',
            },
            {
              q: 'Lucrați și la acoperișuri industriale tip supermarket (folie TPO)?',
              a: 'Da. Montăm și reparăm membrane TPO și acordăm atenție zonelor critice: atice, scurgeri, străpungeri și îmbinări.',
            },
            {
              q: 'Oferiți mentenanță pentru fotovoltaice?',
              a: 'Da. Putem face verificări periodice, monitorizare și intervenții atunci când apar probleme (în funcție de proiect).',
            },
            {
              q: 'Acoperiți toată România?',
              a: 'Da. Suntem în Cetatuia, Vaslui, dar putem lucra în toate județele, în funcție de proiect.',
            },
          ]
        : [
            {
              q: 'How long does a PV installation take?',
              a: 'It depends on complexity and site conditions. After a survey, we provide clear steps and realistic timelines (installation + commissioning).',
            },
            {
              q: 'What do you need for an offer?',
              a: 'Location, consumption (bills), roof/structure type, orientation/shading, and your goal (self-consumption, battery, EV, industrial).',
            },
            {
              q: 'Do you handle roof repairs and leaks?',
              a: 'Yes. We diagnose and fix targeted issues (metal/tiles/TPO) and can propose a preventive maintenance plan.',
            },
            {
              q: 'Do you work on industrial roofs (TPO membrane)?',
              a: 'Yes. We install and repair TPO membranes and focus on critical details: parapets, drains, penetrations, and seams.',
            },
            {
              q: 'Do you provide PV maintenance?',
              a: 'Yes. We can do periodic checks, monitoring, and interventions when issues occur (depending on the project).',
            },
            {
              q: 'Do you work nationwide in Romania?',
              a: 'Yes. We are based in Cetatuia, Vaslui, and we can work nationwide depending on the project.',
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
            '@type': 'LocalBusiness',
            name: 'Solaris CET',
            url: `${origin}/${urlLocale}/contact`,
            telephone: '+40 769 889 721',
            email: 'solaris-cet@protonmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Cetatuia',
              addressLocality: 'Vaslui',
              postalCode: '737429',
              addressCountry: 'RO',
            },
            areaServed: 'RO',
          },
          breadcrumb,
        ],
      },
    };
  }

  return { ...found, jsonLd: { '@context': 'https://schema.org', '@graph': [breadcrumb] } };
}

function App() {
  const [locationKey, setLocationKey] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const langState = useLanguageState();
  useTelegram();

  const routePath = useMemo(() => {
    void locationKey;
    if (typeof window === 'undefined') return '/';
    return normalizePathname(window.location.pathname || '/');
  }, [locationKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => refreshScrollReveal());
  }, [routePath]);

  useEffect(() => {
    const origin = typeof window === 'undefined' ? 'https://solaris-cet.com' : window.location.origin;
    const urlLocale =
      typeof window === 'undefined'
        ? urlLocaleFromLang(langState.lang)
        : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(langState.lang);

    const seo = getRouteSeo(origin, urlLocale, routePath);
    applySpaSeo({
      origin,
      pathnameNoLocale: routePath,
      locale: urlLocale,
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      ogType: seo.ogType,
      noindex: seo.noindex,
      jsonLd: seo.jsonLd,
    });
  }, [langState.lang, routePath]);

  useEffect(() => {
    const bump = () => setLocationKey((k) => k + 1);
    window.addEventListener('popstate', bump);
    window.addEventListener('hashchange', bump);
    return () => {
      window.removeEventListener('popstate', bump);
      window.removeEventListener('hashchange', bump);
    };
  }, []);

  useEffect(() => {
    const delay = import.meta.env.MODE === 'test' ? 0 : 1200;
    if (delay === 0) {
      setShowChat(true);
      return;
    }
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setShowChat(true), { timeout: delay });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setShowChat(true), delay);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const a = (t.tagName.toLowerCase() === 'a' ? (t as HTMLAnchorElement) : t.closest('a')) as HTMLAnchorElement | null;
      if (!a) return;
      if (!isInternalLink(a)) return;

      const href = a.getAttribute('href') ?? '';
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      e.preventDefault();
      window.history.pushState(null, '', url.pathname + url.search + url.hash);
      setLocationKey((k) => k + 1);

      if (url.hash) {
        const el = document.querySelector(url.hash);
        if (el) {
          requestAnimationFrame(() => {
            const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 88;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          });
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <LanguageContext.Provider value={langState}>
      <Navigation />
      <Toaster />
      <Suspense fallback={null}>
        {routePath === '/' ? (
          <HomePage />
        ) : routePath === '/servicii' ? (
          <ServicesPage />
        ) : routePath === '/servicii/atice-fatade-tabla' ? (
          <ServiceDetailPage slug="atice-si-fatade-tabla" />
        ) : routePath.startsWith('/servicii/') ? (
          <ServiceDetailPage slug={routePath.replace(/^\/servicii\//, '')} />
        ) : routePath === '/contact' ? (
          <ContactPage />
        ) : routePath === '/cere-oferta' ? (
          <ContactPage />
        ) : routePath === '/proiecte' || routePath === '/portofoliu' ? (
          <ProjectsPage />
        ) : routePath === '/galerie' ? (
          <ProjectsPage />
        ) : routePath === '/vaslui' ? (
          <LocationPage city="Vaslui" slug="vaslui" />
        ) : routePath === '/bacau' ? (
          <LocationPage city="Bacău" slug="bacau" />
        ) : routePath === '/iasi' ? (
          <LocationPage city="Iași" slug="iasi" />
        ) : routePath === '/galati' ? (
          <LocationPage city="Galați" slug="galati" />
        ) : routePath === '/token-cet' ? (
          <TokenCetPage />
        ) : routePath === '/despre' || routePath === '/about' || routePath === '/despre-noi' ? (
          <AboutPage />
        ) : routePath === '/finantare' ? (
          <FinancingHubPage />
        ) : routePath === '/finantare/casa-verde-2025' ? (
          <FinancingCasaVerde2025Page />
        ) : routePath === '/finantare/casa-verde-baterii-2026' ? (
          <FinancingCasaVerdeBaterii2026Page />
        ) : routePath === '/finantare/repowereu' ? (
          <FinancingRePowerEuPage />
        ) : routePath === '/blog' ? (
          <ArticlesPage />
        ) : routePath.startsWith('/blog/') ? (
          <ArticlePage slug={routePath.replace(/^\/blog\//, '')} />
        ) : routePath === '/multumim' ? (
          <ThankYouPage />
        ) : routePath === '/faq' ? (
          <FaqPage />
        ) : routePath === '/privacy' ? (
          <LegalDocPage doc="privacy" />
        ) : routePath === '/terms' ? (
          <LegalDocPage doc="terms" />
        ) : routePath === '/cookies' ? (
          <LegalDocPage doc="cookies" />
        ) : routePath === '/politica-confidentialitate' ? (
          <LegalDocPage doc="privacy" />
        ) : routePath === '/politica-cookies' ? (
          <LegalDocPage doc="cookies" />
        ) : routePath === '/termeni-si-conditii' ? (
          <LegalDocPage doc="terms" />
        ) : routePath === '/privacy-settings' ? (
          <CookieSettingsPage />
        ) : (
          <NotFoundPage attemptedPath={routePath} />
        )}
      </Suspense>
      <Suspense fallback={null}>{showChat ? <SolarisChatWidget /> : null}</Suspense>
      <CookieConsentBanner />
    </LanguageContext.Provider>
  );
}

export default App;
