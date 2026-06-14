import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import path from 'node:path'

const appRoot = process.cwd()
const publicDir = path.join(appRoot, 'public')

const origin = String(process.env.VITE_PUBLIC_SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '')
const businessId = `${origin}/#business`
const websiteId = `${origin}/#website`
const globalBusinessSchema = {
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
}
const globalWebsiteSchema = {
  '@type': 'WebSite',
  '@id': websiteId,
  url: origin,
  name: 'Solaris CET',
  inLanguage: 'ro-RO',
  publisher: { '@id': businessId },
}
const serviceProviderRef = { '@id': businessId }

function normalizePath(p) {
  if (!p) return '/'
  const withSlash = p.startsWith('/') ? p : `/${p}`
  const cleaned = withSlash.replace(/\/+/g, '/')
  if (cleaned === '/index.html') return '/'
  return cleaned
}

function yyyyMmDd(d) {
  const dt = d instanceof Date ? d : new Date(d)
  if (!Number.isFinite(dt.getTime())) return new Date().toISOString().slice(0, 10)
  return dt.toISOString().slice(0, 10)
}

function stableBuildDate() {
  const raw = String(
    process.env.BUILD_TIMESTAMP || process.env.VITE_BUILD_TIMESTAMP || process.env.SOURCE_DATE_EPOCH || '',
  ).trim()
  if (raw) {
    const epoch = Number.parseInt(raw, 10)
    if (Number.isFinite(epoch) && epoch > 0 && raw === String(epoch)) {
      return yyyyMmDd(new Date(epoch * 1000))
    }
    return yyyyMmDd(raw)
  }
  try {
    const iso = execSync('git log -1 --format=%cI', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (iso) return yyyyMmDd(iso)
  } catch {
    void 0
  }
  return yyyyMmDd(new Date())
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function safeJsonLd(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function wrapJsonLd(graph) {
  return { '@context': 'https://schema.org', '@graph': graph }
}

function buildServiceJsonLd(name, url) {
  return {
    '@type': 'Service',
    name,
    provider: serviceProviderRef,
    areaServed: { '@type': 'Country', name: 'Romania' },
    url,
  }
}

function buildServiceSchema(name, description, serviceType, image) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': ['RoofingContractor', 'ElectricalContractor'],
      name: 'Solaris CET',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Cetățuia',
        addressRegion: 'Vaslui',
        addressCountry: 'RO',
      },
      telephone: '+40769889721',
      email: 'solaris-cet@protonmail.com',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 46.7195,
        longitude: 27.7398,
      },
      openingHours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-14:00'],
      priceRange: 'RON',
      sameAs: ['https://wa.me/40769889721'],
    },
    areaServed: ['România', 'Moldova', 'Vaslui', 'Iași', 'Bacău', 'Galați'].map((a) => ({ '@type': 'State', name: a })),
    serviceType,
    image: image || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RON',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: '0',
        priceCurrency: 'RON',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 47,
    },
  }
}

function graphNodesFromJsonLd(payload) {
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload['@graph'])) return payload['@graph'].filter((item) => item && typeof item === 'object')
  const { ['@context']: _context, ...node } = payload
  return Object.keys(node).length ? [node] : []
}

function withGlobalJsonLd(pageJsonLd) {
  return wrapJsonLd([globalBusinessSchema, globalWebsiteSchema, ...graphNodesFromJsonLd(pageJsonLd)])
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((x, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: x.name,
      item: `${origin}${normalizePath(x.path)}`,
    })),
  }
}

function emailAnchorHtml(label = 'solaris-cet@protonmail.com', subject = '') {
  const href = subject ? `mailto:solaris-cet@protonmail.com?subject=${encodeURIComponent(subject)}` : 'mailto:solaris-cet@protonmail.com'
  return `<!--email_off--><a href="${escapeHtml(href)}">${escapeHtml(label)}</a><!--/email_off-->`
}

// ── SEO Config ──────────────────────────────────────────────────────────────
const SEO_PAGES = {
  '/': {
    title: 'Solaris CET — Panouri Fotovoltaice și Acoperișuri în Vaslui, Moldova',
    description: 'Instalare panouri fotovoltaice, acoperișuri tablă și TPO în Moldova. Experiență 8+ ani, garanție 10 ani, finanțare Casa Verde. Ofertă gratuită: +40 769 889 721',
    keywords: 'panouri fotovoltaice Vaslui, acoperiș tablă Moldova, instalare sisteme solare',
  },
  '/servicii': {
    title: 'Servicii — Solaris CET | Fotovoltaice, Acoperișuri, TPO, Mentenanță',
    description: 'Servicii complete Solaris CET: panouri fotovoltaice rezidențiale și industriale, acoperișuri tablă/țiglă/TPO, atice/fațade tablă, reparații și mentenanță.',
    keywords: 'servicii fotovoltaice, montaj acoperiș, reparații acoperiș, mentenanță panouri',
  },
  '/servicii/fotovoltaice-rezidentiale': {
    title: 'Panouri Fotovoltaice Rezidențiale — Prețuri și Ofertă | Solaris CET',
    description: 'Sisteme fotovoltaice rezidențiale 3-15kW. Preț 15.000-60.000 RON, include montaj. Casa Verde disponibil. Garanție 10 ani panouri.',
    keywords: 'panouri fotovoltaice rezidentiale pret, sisteme solare casa, fotovoltaice 5kw',
  },
  '/servicii/fotovoltaice-industriale': {
    title: 'Fotovoltaice Industriale — Sisteme 20+ kW pentru Hale | Solaris CET',
    description: 'Sisteme fotovoltaice industriale de la 20 kWp pentru hale și spații comerciale. Monitorizare, ROI calculat, execuție etapizată.',
    keywords: 'fotovoltaice industriale, panouri hale, energie solară firme',
  },
  '/servicii/acoperisuri-tabla-tigla': {
    title: 'Acoperișuri Tablă și Țiglă Metalică — Montaj Profesionist | Solaris CET',
    description: 'Montaj acoperișuri tablă click, țiglă metalică, tablă cutată. Garanție 10 ani. Prețuri orientative și ofertă gratuită.',
    keywords: 'acoperiș tablă, țiglă metalică, montaj acoperiș, preț acoperiș',
  },
  '/servicii/acoperisuri-industriale-tpo': {
    title: 'Acoperișuri Industriale TPO — Membrană și Hidroizolații | Solaris CET',
    description: 'Membrană TPO pentru acoperișuri plate industriale. Grosimi 1.2-2.0mm, garanție 15-20 ani. Compatibil cu sisteme fotovoltaice.',
    keywords: 'membrană TPO, acoperiș industrial, hidroizolație TPO',
  },
  '/servicii/atice-si-fatade-tabla': {
    title: 'Atice și Fațade Tablă — Placări Metalice Profesionale | Solaris CET',
    description: 'Placări metalice pentru atice și fațade. Culori RAL, termoizolație opțională, garanție 10-30 ani. Ofertă gratuită.',
    keywords: 'atice tablă, fațadă metalică, placări fațade',
  },
  '/servicii/reparatii-si-mentenanta': {
    title: 'Reparații și Mentenanță Acoperișuri și Panouri | Solaris CET',
    description: 'Intervenții rapide pentru infiltrații, reparații acoperiș, mentenanță panouri fotovoltaice. Răspuns în 24h în Moldova.',
    keywords: 'reparații acoperiș, mentenanță panouri, infiltrații acoperiș',
  },
  '/contact': {
    title: 'Contact — Solaris CET | Ofertă Gratuită pentru Fotovoltaice și Acoperișuri',
    description: 'Contactează Solaris CET pentru ofertă gratuită. Telefon: +40 769 889 721, Email: solaris-cet@protonmail.com. Răspundem în 24h.',
    keywords: 'contact solaris cet, ofertă fotovoltaice, telefon acoperiș',
  },
  '/despre': {
    title: 'Despre Solaris CET — Experiență în Fotovoltaice și Construcții',
    description: 'Echipă locală cu 8+ ani experiență în fotovoltaice, acoperișuri și construcții în Moldova. Garanție 10 ani, finanțare disponibilă.',
    keywords: 'despre solaris cet, echipă fotovoltaice, experiență construcții',
  },
  '/calculator': {
    title: 'Calculator Solar — Estimare Costuri și Economii | Solaris CET',
    description: 'Calculează rapid sistemul fotovoltaic potrivit pentru tine. Estimare putere, preț, economii și amortizare. Gratuit, fără obligații.',
    keywords: 'calculator solar, estimare fotovoltaice, cost panouri',
  },
  '/finantare': {
    title: 'Finanțare Fotovoltaice — Casa Verde, RePowerEU, Credite Verzi | Solaris CET',
    description: 'Programe de finanțare pentru sisteme fotovoltaice: Casa Verde până la 20.000 RON, RePowerEU până la 60%. Consultanță gratuită.',
    keywords: 'finanțare fotovoltaice, casa verde, repowereu, credite verzi',
  },
  '/proiecte': {
    title: 'Proiecte Realizate — Portofoliu Solaris CET | Fotovoltaice și Acoperișuri',
    description: 'Vezi proiectele noastre: sisteme fotovoltaice, acoperișuri tablă/TPO, atice și fațade. Peste 200 de proiecte finalizate în Moldova.',
    keywords: 'proiecte fotovoltaice, portofoliu acoperișuri, lucrări realizate',
  },
  '/blog': {
    title: 'Blog — Solaris CET | Ghiduri și Articole despre Fotovoltaice și Acoperișuri',
    description: 'Articole utile despre costuri, finanțare, mentenanță și alegerea sistemului potrivit. Ghiduri practice pentru proprietari și firme.',
    keywords: 'blog fotovoltaice, ghid acoperiș, articole energie solară',
  },
  '/faq': {
    title: 'Întrebări Frecvente — Solaris CET | Fotovoltaice, Acoperișuri, Finanțare',
    description: 'Răspunsuri la cele mai comune întrebări despre panouri fotovoltaice, acoperișuri, finanțare și servicii Solaris CET.',
    keywords: 'întrebări frecvente, faq fotovoltaice, întrebări acoperiș',
  },
  '/privacy': {
    title: 'Politica de Confidențialitate — Solaris CET',
    description: 'Politica de confidențialitate Solaris CET conform GDPR. Află cum prelucrăm datele tale personale.',
    keywords: 'politica confidențialitate, gdpr, date personale',
  },
  '/cookies': {
    title: 'Politica de Cookie-uri — Solaris CET',
    description: 'Politica de cookie-uri Solaris CET. Află ce cookie-uri folosim și cum poți controla preferințele.',
    keywords: 'politica cookie-uri, cookie-uri site',
  },
  '/terms': {
    title: 'Termeni și Condiții — Solaris CET',
    description: 'Termeni și condiții de utilizare a site-ului Solaris CET.',
    keywords: 'termeni și condiții, termeni site',
  },
  '/vaslui': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Vaslui — Solaris CET',
    description: 'Servicii Solaris CET în Vaslui: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Vaslui, acoperiș Vaslui, panouri solare Vaslui',
  },
  '/iasi': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Iași — Solaris CET',
    description: 'Servicii Solaris CET în Iași: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Iași, acoperiș Iași, panouri solare Iași',
  },
  '/bacau': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Bacău — Solaris CET',
    description: 'Servicii Solaris CET în Bacău: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Bacău, acoperiș Bacău, panouri solare Bacău',
  },
  '/galati': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Galați — Solaris CET',
    description: 'Servicii Solaris CET în Galați: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Galați, acoperiș Galați, panouri solare Galați',
  },
  '/neamt': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Neamț — Solaris CET',
    description: 'Servicii Solaris CET în Neamț: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Neamț, acoperiș Neamț, panouri solare Neamț',
  },
  '/suceava': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Suceava — Solaris CET',
    description: 'Servicii Solaris CET în Suceava: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Suceava, acoperiș Suceava, panouri solare Suceava',
  },
  '/botosani': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Botoșani — Solaris CET',
    description: 'Servicii Solaris CET în Botoșani: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Botoșani, acoperiș Botoșani, panouri solare Botoșani',
  },
  '/vrancea': {
    title: 'Panouri Fotovoltaice și Acoperișuri în Vrancea — Solaris CET',
    description: 'Servicii Solaris CET în Vrancea: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță. Ofertă gratuită.',
    keywords: 'fotovoltaice Vrancea, acoperiș Vrancea, panouri solare Vrancea',
  },
};

function getSeoConfig(pathname) {
  if (SEO_PAGES[pathname]) return SEO_PAGES[pathname];
  if (pathname.startsWith('/blog/')) {
    return {
      title: 'Articol — Blog Solaris CET | Fotovoltaice și Acoperișuri',
      description: 'Citește articole utile despre panouri fotovoltaice, acoperișuri, finanțare și mentenanță de la Solaris CET.',
      keywords: 'blog fotovoltaice, articole acoperiș, ghid energie solară',
    };
  }
  if (pathname.startsWith('/servicii/')) {
    return {
      title: 'Servicii — Solaris CET | Fotovoltaice, Acoperișuri, TPO',
      description: 'Detalii servicii Solaris CET: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, reparații și mentenanță.',
      keywords: 'servicii fotovoltaice, acoperișuri, TPO',
    };
  }
  if (pathname.startsWith('/finantare/')) {
    return {
      title: 'Finanțare — Solaris CET | Casa Verde, RePowerEU, Credite',
      description: 'Informații despre programele de finanțare pentru sisteme fotovoltaice: Casa Verde, RePowerEU, credite verzi.',
      keywords: 'finanțare fotovoltaice, casa verde, repowereu',
    };
  }
  return null;
}

function renderStaticPageHtml({
  title,
  description,
  canonicalPath,
  h1,
  bodyLines,
  jsonLd,
  noindex,
  redirectTo,
  redirectDelaySeconds,
  extraHtml,
  footerCtaHtml,
}) {
  const canonical = `${origin}${normalizePath(canonicalPath)}`
  const path = normalizePath(canonicalPath)
  const seoConfig = getSeoConfig(path)
  const metaTitle = escapeHtml(seoConfig?.title || title || 'Solaris CET — Energie Solară și Construcții | Vaslui, România')
  const metaDesc = escapeHtml(seoConfig?.description || description || 'Instalare panouri fotovoltaice, acoperișuri tablă și TPO în Moldova. Experiență 8+ ani, garanție 10 ani, finanțare Casa Verde. Ofertă gratuită: +40 769 889 721')
  const metaKeywords = seoConfig?.keywords ? escapeHtml(seoConfig.keywords) : ''
  const metaH1 = escapeHtml(h1)
  const body = bodyLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n')
  const extra = typeof extraHtml === 'string' && extraHtml.trim() ? `\n${extraHtml.trim()}\n` : '\n'
  const footerCta =
    typeof footerCtaHtml === 'string'
      ? footerCtaHtml
      : '<p><a href="/contact/">Solicită ofertă →</a></p>'
  const mergedJsonLd = withGlobalJsonLd(jsonLd)
  const jsonLdBlock = mergedJsonLd
    ? `\n    <script type="application/ld+json">${safeJsonLd(mergedJsonLd)}</script>\n`
    : '\n'
  const robotsMeta = noindex ? `    <meta name="robots" content="noindex,nofollow" />\n` : ''
  const redirectSeconds = Number.isFinite(redirectDelaySeconds) ? Math.max(0, redirectDelaySeconds) : 0
  const redirectMeta = redirectTo
    ? `    <meta http-equiv="refresh" content="${redirectSeconds};url=${escapeHtml(redirectTo)}" />\n`
    : ''
  const redirectBody = redirectTo
    ? redirectSeconds > 0
      ? `<p><strong>Redirecționare:</strong> vei fi trimis către <a href="${escapeHtml(redirectTo)}">${escapeHtml(
          redirectTo,
        )}</a> în ${redirectSeconds} secunde.</p>`
      : `<p><strong>Redirecționare:</strong> această pagină s-a mutat la <a href="${escapeHtml(redirectTo)}">${escapeHtml(
          redirectTo,
        )}</a>.</p>`
    : ''

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${metaTitle}</title>
    <meta name="description" content="${metaDesc}" />
    ${metaKeywords ? `    <meta name="keywords" content="${metaKeywords}" />\n` : ''}
    <link rel="canonical" href="${canonical}" />
${robotsMeta}${redirectMeta}    <meta property="og:type" content="website" />
    <meta property="og:title" content="${metaTitle}" />
    <meta property="og:description" content="${metaDesc}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metaTitle}" />
    <meta name="twitter:description" content="${metaDesc}" />
${jsonLdBlock}
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif; background: #05070a; color: #fff; }
      a { color: #f2c94c; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .wrap { max-width: 860px; margin: 0 auto; padding: 28px 18px; }
      .card { border: 1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.35); border-radius: 18px; padding: 18px; }
      h1 { font-size: 34px; line-height: 1.1; margin: 0 0 10px; }
      h2 { font-size: 18px; margin: 0 0 10px; }
      p { margin: 10px 0; color: rgba(255,255,255,.82); }
      .nav { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
      .nav a { border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); padding: 10px 12px; border-radius: 12px; font-weight: 700; }
      details { margin-top: 10px; border: 1px solid rgba(255,255,255,.12); border-radius: 14px; background: rgba(255,255,255,.04); overflow: hidden; }
      summary { cursor: pointer; list-style: none; padding: 14px 16px; font-weight: 700; }
      details p { margin: 0; padding: 0 16px 16px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <nav class="nav" aria-label="Navigație">
          <a href="/">Acasă</a>
          <a href="/servicii/">Servicii</a>
          <a href="/contact/">Contact</a>
        </nav>
      </header>
      <main id="main-content">
        <div class="card">
          <h1>${metaH1}</h1>
          ${redirectBody}
          ${body}
          ${extra}
          <p><strong>Telefon:</strong> <a href="tel:+40769889721">+40 769 889 721</a> · <strong>Email:</strong> ${emailAnchorHtml()}</p>
          ${footerCta}
        </div>
      </main>
    </div>
    <script defer src="/cookie-consent.js"></script>
  </body>
</html>
`
}

async function writeStaticPages() {
  const supportEndpoint = '/api/support/start'

  const contactFormHtml = (() => {
    return `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cere ofertă (formular)</h2>
            <p style="margin: 0 0 12px; color: rgba(255,255,255,.72);">Formular HTML nativ care funcționează și fără JavaScript.</p>
            <form action="${supportEndpoint}" method="POST" id="form-oferta">
              <input type="hidden" name="pageUrl" value="/contact" />
              <input type="hidden" name="utm" value="" />
              <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />
              <div style="display:grid; gap:10px;">
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Nume și prenume *</div>
                  <input name="name" required placeholder="Ion Popescu" autocomplete="name" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Telefon *</div>
                  <input name="phone" type="tel" required placeholder="07XX XXX XXX" pattern="[0-9+\\s\\-]{10,15}" autocomplete="tel" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Email</div>
                  <input name="email" type="email" placeholder="email@exemplu.ro" autocomplete="email" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Serviciu dorit *</div>
                  <select name="service" required style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;">
                    <option value="">— Alege —</option>
                    <option value="fotovoltaice">Fotovoltaice rezidențiale (casă)</option>
                    <option value="fotovoltaice">Fotovoltaice industriale/comerciale</option>
                    <option value="acoperisuri">Acoperiș tablă / țiglă metalică</option>
                    <option value="tpo">Acoperiș industrial folie TPO</option>
                    <option value="atice-fatade">Atice și fațade tablă</option>
                    <option value="reparatii">Reparații și mentenanță</option>
                  </select>
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Localitate / județ *</div>
                  <input name="location" required placeholder="Ex: Vaslui, jud. Vaslui" autocomplete="address-level2" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Descriere scurtă</div>
                  <textarea name="message" rows="4" placeholder="Ex: casă 150mp, consum 400 kWh/lună, acoperiș orientat sud..." style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;"></textarea>
                </label>
                <label style="display:flex; gap:10px; align-items:flex-start; color: rgba(255,255,255,.82); font-size:13px; line-height:1.45;">
                  <input name="consent" type="checkbox" value="yes" required style="margin-top:2px;" />
                  <span>Sunt de acord ca datele trimise să fie folosite pentru a primi răspuns la cererea mea de ofertă.</span>
                </label>
                <button type="submit" style="cursor:pointer; border-radius:12px; border:1px solid rgba(245,158,11,.45); background:rgba(245,158,11,.14); color:#fbbf24; font-weight:900; padding:12px 12px;">Trimite cererea →</button>
              </div>
              <div style="margin-top:10px; font-size:12px; color: rgba(255,255,255,.65);">
                După trimitere primești imediat confirmarea direct din sistemul nostru intern, fără dependență de JavaScript.
              </div>
            </form>
          </div>
          <div style="margin-top: 14px;">
            <h2 id="titlu-harta" style="font-size: 18px; margin: 0 0 10px;">Zona de activitate</h2>
            <div style="border-radius: 8px; overflow:hidden; border:1px solid #334155;">
              <iframe title="Localizare Solaris CET - Vaslui, Romania" src="https://www.openstreetmap.org/export/embed.html?bbox=27.6276%2C46.5407%2C27.8276%2C46.7407&amp;layer=mapnik&amp;marker=46.6407%2C27.7276" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%; height:300px; border:0; display:block;"></iframe>
            </div>
            <p style="font-size:.8rem; margin-top:.5rem;"><a href="https://www.openstreetmap.org/?mlat=46.6407&amp;mlon=27.7276#map=12/46.6407/27.7276" target="_blank" rel="noopener noreferrer">Deschide harta completă →</a></p>
          </div>
    `
  })()

  const contactDetailsHtml = `
          ${contactFormHtml}
          <div style="margin-top: 14px;">
            <address style="font-style:normal; color: rgba(255,255,255,.82);">
              <strong>Solaris CET</strong><br />
              Vaslui, județul Vaslui, România<br />
              <abbr title="Program de lucru">L-V:</abbr> 08:00 - 18:00<br />
              <a href="tel:+40769889721">+40 769 889 721</a><br />
              ${emailAnchorHtml()}
            </address>
            <p style="margin-top:10px; color: rgba(255,255,255,.72);">Acoperire: Vaslui, Moldova și proiecte selectate la nivel național.</p>
          </div>
  `

  const servicesOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Servicii disponibile</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><a href="/servicii/fotovoltaice-rezidentiale/">Fotovoltaice rezidențiale</a> — consum casă, orientare acoperiș, invertor, protecții, punere în funcțiune.</li>
              <li><a href="/servicii/fotovoltaice-industriale/">Fotovoltaice industriale</a> — hale, clădiri comerciale, execuție etapizată și ROI.</li>
              <li><a href="/servicii/acoperisuri-tabla-tigla/">Acoperișuri tablă / țiglă</a> — montaj, reparații, dolii, coame, sisteme pluviale.</li>
              <li><a href="/servicii/acoperisuri-industriale-tpo/">Acoperișuri industriale TPO</a> — membrane, atice, străpungeri, infiltrații.</li>
              <li><a href="/servicii/atice-si-fatade-tabla/">Atice și fațade tablă</a> — muchii, placări, finisaje metalice și protecție.</li>
              <li><a href="/servicii/reparatii-si-mentenanta/">Reparații și mentenanță</a> — intervenții rapide, diagnostic și plan preventiv.</li>
            </ul>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cum cerem corect o ofertă</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Localitatea proiectului și dacă este casă, hală sau clădire comercială.</li>
              <li>2–5 poze relevante cu acoperișul sau zona afectată.</li>
              <li>Consum estimat sau factură pentru fotovoltaice; suprafață și problemă principală pentru acoperișuri.</li>
              <li>Termenul dorit și dacă există urgență (infiltrație, acoperiș avariat, consum mare).</li>
            </ul>
          </div>
  `

  const projectsOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Repere de lucrări</h2>
            <div style="display:grid; gap:10px;">
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Prosumator 5.2 kW — Vaslui</strong>
                <p style="margin:8px 0 0;">Sistem rezidențial pentru autoconsum, montaj pe acoperiș înclinat, monitorizare și protecții AC/DC.</p>
                <ul style="margin:8px 0 0; padding-left:18px; color:rgba(255,255,255,.8);">
                  <li>Potrivit pentru case cu consum stabil și interes pentru amortizare clară.</li>
                  <li>Include dimensionare, structură, protecții, punere în funcțiune și explicații de utilizare.</li>
                </ul>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>PV industrial — Iași</strong>
                <p style="margin:8px 0 0;">Execuție etapizată pentru hală logistică, cu acces controlat și verificări finale înainte de predare.</p>
                <ul style="margin:8px 0 0; padding-left:18px; color:rgba(255,255,255,.8);">
                  <li>Focus pe autoconsum, monitorizare și compatibilitate cu activitatea zilnică a halei.</li>
                  <li>Planul de lucru urmărește să nu blocheze operațiunea și să păstreze accesul în zonele critice.</li>
                </ul>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Membrană TPO — Bacău</strong>
                <p style="margin:8px 0 0;">Reparație și refacere detalii la atice, scurgeri și străpungeri pentru eliminarea infiltrațiilor recurente.</p>
                <ul style="margin:8px 0 0; padding-left:18px; color:rgba(255,255,255,.8);">
                  <li>Intervenție pe zone critice unde apar cele mai multe infiltrații: atice, scurgeri și racorduri.</li>
                  <li>Predare cu recomandări de mentenanță și prioritizare a următoarelor verificări.</li>
                </ul>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Tablă click — Suceava</strong>
                <p style="margin:8px 0 0;">Acoperiș cu geometrie complexă, finisaje curate și drenaj corect la muchii și racorduri.</p>
                <ul style="margin:8px 0 0; padding-left:18px; color:rgba(255,255,255,.8);">
                  <li>Lucrare orientată pe aliniere, detalii curate și protejarea zonelor sensibile.</li>
                  <li>Potrivit pentru clienți care compară finisajul și durabilitatea, nu doar prețul pe metru pătrat.</li>
                </ul>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Atice tablă — Galați</strong>
                <p style="margin:8px 0 0;">Muchii, colțuri și închideri metalice pentru protecția anvelopei și un aspect coerent al clădirii.</p>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Diagnostic & mentenanță — Bârlad</strong>
                <p style="margin:8px 0 0;">Verificări, curățare, corectarea detaliilor și plan de mentenanță pentru sisteme existente.</p>
              </div>
            </div>
            <p style="margin-top:12px; font-size:13px; color:rgba(255,255,255,.68);">Portofoliul este orientativ și nu expune date personale sau adrese exacte. Pentru exemple similare cu proiectul tău, trimite-ne pe WhatsApp localitatea și tipul lucrării.</p>
          </div>
  `

  const servicePageBlocks = {
    'fotovoltaice-rezidentiale': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Potrivit pentru</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Case cu consum lunar stabil, familii care vor să reducă factura și proprietari care vor să înțeleagă clar raportul dintre buget, producție și amortizare.</p>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce includem</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Dimensionare pe consum, orientare, umbriri și tipul acoperișului.</li>
              <li>Structură de montaj, invertor, protecții DC/AC, tablou și trasee ordonate.</li>
              <li>Punere în funcțiune, configurare aplicație și recomandări de mentenanță.</li>
            </ul>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Repere utile înainte de ofertă</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Execuție frecventă: 1–3 zile, în funcție de acces și complexitate.</li>
              <li>Puteri frecvente: 3–12 kW pentru case și vile.</li>
              <li>Poți cere și opțiuni cu baterie sau încărcător EV, dacă urmărești autoconsum seara.</li>
            </ul>
          </div>
    `,
    'fotovoltaice-industriale': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Unde aduce valoare</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Hale, depozite, spații comerciale și producție unde consumul zilnic constant face ca autoconsumul să conteze mai mult decât o simplă “instalare de panouri”.</p>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce urmărim la ofertare</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Profilul de consum și intervalele orare în care se folosește energia.</li>
              <li>Tipul acoperișului și impactul asupra detaliilor tehnice de montaj.</li>
              <li>Execuție etapizată, astfel încât lucrarea să nu blocheze activitatea locației.</li>
            </ul>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Repere orientative</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Scenarii uzuale: 30–500+ kW, în funcție de suprafață și consum.</li>
              <li>ROI-ul real se judecă după autoconsum, nu după puterea “maximă” instalată.</li>
              <li>Livrăm monitorizare și recomandări de mentenanță după punerea în funcțiune.</li>
            </ul>
          </div>
    `,
    'acoperisuri-tabla-tigla': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce executăm</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Tablă click / standing seam, tablă cutată și țiglă metalică.</li>
              <li>Coame, dolii, borduri, sisteme pluviale și racorduri la elemente existente.</li>
              <li>Reparații pentru infiltrații, muchii slabe și zone afectate de drenaj greșit.</li>
            </ul>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce contează la evaluare</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Nu doar suprafața. Pentru un acoperiș contează panta, geometria, numărul de străpungeri, zonele cu dolii/coame și starea elementelor existente.</p>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Repere orientative</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Putem oferta rapid după poze, dimensiuni aproximative și localitate.</li>
              <li>Diferența reală o fac detaliile curate și etanșările corecte, nu doar învelitoarea.</li>
            </ul>
          </div>
    `,
    'acoperisuri-industriale-tpo': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Zonele critice la TPO</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Străpungeri, atice, scurgeri, colțuri și racorduri unde apar infiltrațiile recurente.</li>
              <li>Zone cu trafic tehnic, echipamente HVAC sau intervenții mai vechi executate prost.</li>
            </ul>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cum lucrăm</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Diagnostic al cauzei, nu doar “peticire” rapidă.</li>
              <li>Refacere detaliu, verificare drenaj și recomandări de mentenanță 1–2 ori/an.</li>
              <li>Compatibilitate cu proiecte fotovoltaice atunci când se montează pe acoperiș plat.</li>
            </ul>
          </div>
    `,
    'atice-si-fatade-tabla': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Unde se vede diferența</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">La atice și fațade, diferența se vede în muchii, colțuri, dilatări, racorduri și în cât de curat rămâne finisajul după ploaie și vânt.</p>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce putem livra</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Placări, capace de atic, închideri, elemente de tinichigerie și reparații locale.</li>
              <li>Fixări discrete, linii curate și protecție reală a anvelopei, nu doar “mascare” vizuală.</li>
            </ul>
          </div>
    `,
    'reparatii-si-mentenanta': `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Când ne chemi</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Infiltrații active, elemente desprinse, scurgeri blocate sau detalii slăbite la acoperiș.</li>
              <li>Scădere de producție, alarme invertor sau suspiciuni privind protecțiile și traseele PV.</li>
            </ul>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce facem diferit</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Nu schimbăm componente “după ureche”. Pornim de la diagnostic și îți spunem realist dacă problema cere o intervenție punctuală, o reparație pe zonă sau un plan de mentenanță.</p>
          </div>
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cum grăbești intervenția</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Trimite poze cu zona afectată, localitatea, gravitatea problemei și dacă există urgență.</li>
              <li>Spune dacă lucrarea a fost executată recent sau dacă au existat intervenții anterioare.</li>
            </ul>
          </div>
    `,
  }

  const privacyOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce date prelucrăm</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Date de contact: nume, email, telefon.</li>
              <li>Date din solicitare: tip lucrare, localitate, mesaj, urgență.</li>
              <li>Date tehnice minime: browser, pagini vizitate, evenimente tehnice și preferințe cookie.</li>
            </ul>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Temeiuri legale și retenție</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><strong>Art. 6(1)(b)</strong> — demersuri precontractuale și răspuns la cereri de ofertă.</li>
              <li><strong>Art. 6(1)(f)</strong> — securitate, prevenirea abuzului și continuitatea serviciului.</li>
              <li><strong>Art. 6(1)(a)</strong> — cookie-uri analitice și marketing, numai după consimțământ.</li>
              <li>Datele sunt păstrate atât cât este necesar pentru ofertare, conformitate și apărarea drepturilor.</li>
            </ul>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Drepturile tale</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Acces, rectificare, ștergere, restricționare, opoziție și portabilitate.</li>
              <li>Pentru cereri GDPR scrie la ${emailAnchorHtml()}.</li>
              <li>Poți depune plângere la <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener noreferrer">ANSPDCP</a>.</li>
            </ul>
          </div>
  `

  const cookieSettingsStaticHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Gestionează preferințele cookie</h2>
            <p style="margin:0 0 10px; color: rgba(255,255,255,.82);">Poți actualiza alegerile oricând din pagina dedicată pentru confidențialitate.</p>
            <p style="margin:0;">
              <a href="/privacy-settings/" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 14px;border-radius:12px;border:1px solid rgba(245,158,11,.45);background:rgba(245,158,11,.14);color:#fbbf24;font-weight:900;">
                Setări cookie
              </a>
            </p>
          </div>
  `

  const cookiesOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce cookie-uri folosim</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><strong>Strict necesare</strong> — <code>solaris_cookie_consent</code> reține alegerea ta privind cookie-urile timp de 1 an.</li>
              <li><strong>Analitice</strong> — folosim identificatori locali și, doar dacă sunt configurate, integrări precum Google Analytics, GTM, Mixpanel, Amplitude sau Hotjar.</li>
              <li><strong>Marketing</strong> — Meta Pixel sau LinkedIn Insight Tag pornesc doar cu consimțământ și numai dacă sunt activate în producție.</li>
            </ul>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Durată și control</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Consimțământul este reținut local în browser pentru a nu te întreba la fiecare vizită. Dacă integrările de marketing nu sunt configurate la momentul vizitei, nu setăm cookie-uri de marketing.</p>
          </div>
          ${cookieSettingsStaticHtml}
  `

  const termsOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Reguli principale</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Informațiile de pe site sunt informative; oferta finală se stabilește după evaluarea tehnică.</li>
              <li>Utilizatorul trebuie să furnizeze date corecte și să nu transmită conținut abuziv sau ilegal.</li>
              <li>Nu este permis accesul neautorizat, supraîncărcarea serviciului sau transmiterea de malware.</li>
              <li>Legea aplicabilă este cea din România, cu respectarea normelor de protecție a consumatorilor.</li>
            </ul>
          </div>
  `

  const privacySettingsOverviewHtml = `
          <div style="margin-top: 14px;">
            <p style="margin:0 0 10px; color: rgba(255,255,255,.82);">Alege ce cookie-uri accepți. Preferințele sunt salvate în browser-ul tău.</p>
          </div>
          <form id="sc-form" novalidate style="margin-top:14px;">
            <fieldset style="border:1px solid #334155;border-radius:8px;padding:1rem;margin-bottom:1rem">
              <legend><strong>Cookie-uri necesare</strong></legend>
              <p style="color:#94a3b8;font-size:.85rem;margin:.25rem 0 .5rem">Necesare pentru funcționarea site-ului. Nu pot fi dezactivate.</p>
              <input type="checkbox" checked disabled aria-label="Cookie-uri necesare - mereu active" />
              <label>Mereu active</label>
            </fieldset>

            <fieldset style="border:1px solid #334155;border-radius:8px;padding:1rem;margin-bottom:1rem">
              <legend><strong>Cookie-uri de analiză</strong></legend>
              <p style="color:#94a3b8;font-size:.85rem;margin:.25rem 0 .5rem">Ne ajută să înțelegem cum este folosit site-ul (vizite, pagini vizitate).</p>
              <input type="checkbox" id="sc-analytics" name="analytics" />
              <label for="sc-analytics">Accept cookie-uri de analiză</label>
            </fieldset>

            <fieldset style="border:1px solid #334155;border-radius:8px;padding:1rem;margin-bottom:1.5rem">
              <legend><strong>Cookie-uri de marketing</strong></legend>
              <p style="color:#94a3b8;font-size:.85rem;margin:.25rem 0 .5rem">Permit afișarea de reclame relevante pe alte platforme.</p>
              <input type="checkbox" id="sc-marketing" name="marketing" />
              <label for="sc-marketing">Accept cookie-uri de marketing</label>
            </fieldset>

            <button type="submit" style="padding:.75rem 1.5rem;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;font-weight:600">
              Salvează preferințele
            </button>
          </form>

          <p style="margin-top:1.5rem;font-size:.8rem;color:#94a3b8">
            <a href="/cookies/">Politica de cookie-uri</a> · <a href="/privacy/">Politica de confidențialitate</a>
          </p>

          <script>
            window.addEventListener('load', function () {
              var consent = window.SolarisCookieConsent && window.SolarisCookieConsent.get();
              if (consent) {
                var analytics = document.getElementById('sc-analytics');
                var marketing = document.getElementById('sc-marketing');
                if (analytics) analytics.checked = !!consent.analytics;
                if (marketing) marketing.checked = !!consent.marketing;
              }

              var form = document.getElementById('sc-form');
              if (!form || !window.SolarisCookieConsent) return;
              form.addEventListener('submit', function (event) {
                event.preventDefault();
                window.SolarisCookieConsent.save(
                  document.getElementById('sc-analytics').checked,
                  document.getElementById('sc-marketing').checked
                );
                window.location.href = '/';
              });
            });
          </script>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cereri GDPR</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Pentru acces, rectificare, ștergere sau portabilitate: ${emailAnchorHtml('trimite email', 'Cerere GDPR — Solaris CET')}.</li>
              <li>Poți menționa numele, emailul, telefonul și tipul cererii pentru identificare rapidă.</li>
              <li>Detaliile complete sunt în <a href="/privacy/">Politica de confidențialitate</a> și <a href="/cookies/">Politica de cookie-uri</a>.</li>
            </ul>
          </div>
  `

  const localBusiness = {
    '@type': 'LocalBusiness',
    name: 'Solaris CET',
    url: origin,
    telephone: '+40769889721',
    email: 'solaris-cet@protonmail.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cetățuia',
      addressRegion: 'Vaslui',
      addressCountry: 'RO',
    },
    areaServed: { '@type': 'Country', name: 'Romania' },
  }

  const locationData = {
    vaslui: { county: 'Vaslui', distanceKm: 0, travelTime: '0 ore (sediu)', mainLocalities: ['Vaslui', 'Bârlad', 'Huși', 'Negrești'], testimonial: { name: 'Ion Popescu', locality: 'Vaslui', text: 'Am apelat la Solaris CET pentru un sistem fotovoltaic de 5 kW. Montajul a durat doar 2 zile, iar acum factura la curent e cu 70% mai mică. Recomand cu încredere!' }, projectsCount: 18 },
    iasi: { county: 'Iași', distanceKm: 65, travelTime: '1 oră', mainLocalities: ['Iași', 'Pașcani', 'Târgu Frumos', 'Hârlău'], testimonial: { name: 'Maria Ionescu', locality: 'Iași', text: 'Echipa Solaris CET a venit la Iași și a montat panourile pe acoperișul casei noastre. Profesioniști, rapid și curat. Acum producem propria energie!' }, projectsCount: 12 },
    bacau: { county: 'Bacău', distanceKm: 90, travelTime: '1 oră 15 minute', mainLocalities: ['Bacău', 'Onești', 'Moinești', 'Comănești'], testimonial: { name: 'Gheorghe Radu', locality: 'Bacău', text: 'Am avut nevoie de reparații la acoperișul TPO al halei. Solaris CET a diagnosticat corect problema și a rezolvat-o în aceeași zi. Mulțumesc!' }, projectsCount: 8 },
    galati: { county: 'Galați', distanceKm: 110, travelTime: '1 oră 30 minute', mainLocalities: ['Galați', 'Tecuci', 'Târgu Bujor', 'Pechea'], testimonial: { name: 'Elena Dumitrescu', locality: 'Galați', text: 'Am ales Solaris CET pentru montajul unui sistem fotovoltaic de 10 kW pe acoperișul firmei. Proiectul a fost gândit eficient, iar amortizarea e mai rapidă decât estimam.' }, projectsCount: 6 },
    neamt: { county: 'Neamț', distanceKm: 120, travelTime: '1 oră 45 minute', mainLocalities: ['Piatra Neamț', 'Roman', 'Târgu Neamț', 'Bicaz'], testimonial: { name: 'Andrei Munteanu', locality: 'Piatra Neamț', text: 'Solaris CET a venit la Piatra Neamț pentru un acoperiș din tablă click. Lucrarea e impecabilă, iar garanția de 10 ani ne dă liniște.' }, projectsCount: 5 },
    suceava: { county: 'Suceava', distanceKm: 170, travelTime: '2 ore 30 minute', mainLocalities: ['Suceava', 'Fălticeni', 'Rădăuți', 'Câmpulung Moldovenesc'], testimonial: { name: 'Cristina Popa', locality: 'Suceava', text: 'Am apelat la Solaris CET pentru mentenanța panourilor fotovoltaice. Au venit la Suceava, au curățat și verificat tot sistemul. Producția a crescut cu 20%!' }, projectsCount: 4 },
    botosani: { county: 'Botoșani', distanceKm: 140, travelTime: '2 ore', mainLocalities: ['Botoșani', 'Dorohoi', 'Săveni', 'Darabani'], testimonial: { name: 'Vasile Apetrei', locality: 'Botoșani', text: 'Solaris CET a montat un sistem fotovoltaic de 3 kW la casa părintească din Botoșani. Profesioniști, preț corect și suport după montaj.' }, projectsCount: 3 },
    vrancea: { county: 'Vrancea', distanceKm: 130, travelTime: '1 oră 50 minute', mainLocalities: ['Focșani', 'Adjud', 'Panciu', 'Odobești'], testimonial: { name: 'Mihai Stan', locality: 'Focșani', text: 'Am chemat Solaris CET pentru reparații la acoperișul din țiglă metalică. Au venit rapid la Focșani, au identificat problema și au rezolvat-o în aceeași zi.' }, projectsCount: 4 },
  };

  const portfolioSchemaItems = [
    {
      name: 'Prosumator 5.2 kW pe acoperiș înclinat',
      location: 'Vaslui',
      description: 'Exemplu de sistem fotovoltaic rezidențial dimensionat pentru autoconsum și monitorizare.',
      image: `${origin}/images/hero-solaris.svg`,
    },
    {
      name: 'Acoperiș industrial cu membrană TPO',
      location: 'Bacău',
      description: 'Intervenție orientativă pentru refacerea zonelor critice: atice, scurgeri și străpungeri.',
      image: `${origin}/og-image.png`,
    },
    {
      name: 'Acoperiș tablă click cu finisaje curate',
      location: 'Suceava',
      description: 'Lucrare orientativă pentru acoperiș metalic cu detalii corecte la muchii și racorduri.',
      image: `${origin}/images/team-placeholder.svg`,
    },
  ]

  const serviceFaq = {
    'fotovoltaice-rezidentiale': [
      { q: 'Cât costă?', a: 'Costul depinde de puterea aleasă, tipul invertorului, acoperiș și dacă dorești baterie. Îți dăm un buget realist după factura de consum, poze și evaluarea tehnică.' },
      { q: 'Cât durează racordul?', a: 'Montajul propriu-zis durează de regulă 1-3 zile, iar partea de prosumator și racordare poate dura în medie 4-8 săptămâni, în funcție de distribuitor și de documentele disponibile.' },
      { q: 'Am nevoie de aprobare de la primărie?', a: 'Depinde de particularitățile imobilului și de reglementările locale. În majoritatea cazurilor rezidențiale discutăm de la început ce acte sunt necesare, ca să nu apară blocaje târziu.' },
      { q: 'Ce se întâmplă când curentul se întrerupe?', a: 'Un sistem on-grid standard se oprește pentru siguranța rețelei. Dacă vrei alimentare pe circuite selectate la pană de curent, discutăm o soluție hibridă sau cu baterie și back-up.' },
      { q: 'Pot adăuga baterie mai târziu?', a: 'Da, de multe ori se poate, dacă alegem de la început o arhitectură compatibilă. De aceea discutăm din faza de ofertare dacă vrei doar pregătire sau instalare imediată.' },
    ],
    'fotovoltaice-industriale': [
      { q: 'Pot instala pe acoperiș TPO?', a: 'Da, dar soluția trebuie proiectată corect pentru membrană, treceri și zonele cu trafic tehnic. Nu tratăm TPO ca pe un acoperiș industrial generic.' },
      { q: 'Cât durează amortizarea?', a: 'Amortizarea depinde de autoconsum, prețul energiei, programul de lucru și configurația finală. Îți prezentăm scenarii prudente, nu doar cea mai optimistă variantă.' },
      { q: 'Afectează instalarea activitatea firmei?', a: 'Planificăm execuția etapizat și stabilim zonele de lucru ca să reducem la minim impactul asupra operațiunilor curente.' },
      { q: 'Ce se întâmplă la oprire planificată de rețea?', a: 'Monitorizarea și parametrizarea invertorului ne ajută să vedem clar evenimentele din rețea. Discutăm din faza de proiect și dacă sunt necesare măsuri suplimentare pentru continuitate sau reluare controlată.' },
      { q: 'Pot extinde sistemul ulterior?', a: 'Da, în multe cazuri se poate, dacă proiectăm de la început cu spațiu, putere de invertor și trasee compatibile pentru o etapă următoare.' },
    ],
    'acoperisuri-tabla-tigla': [
      { q: 'Ce tablă rezistă mai bine la grindină?', a: 'Rezistența este influențată de grosime, profilare și sistemul complet, nu doar de denumirea comercială. De regulă, o grosime mai mare și un profil corect ales oferă un comportament mai bun la solicitări mecanice.' },
      { q: 'Pot monta panouri fotovoltaice pe tablă click?', a: 'Da. Tablă click este una dintre cele mai bune opțiuni pentru montaj fotovoltaic, dacă folosim prinderi și accesorii compatibile și pregătim corect traseele și zonele de etanșare.' },
      { q: 'Cât durează montajul pentru o casă obișnuită?', a: 'Durata depinde de suprafață, geometrie, numărul de accesorii și starea suportului, dar îți comunicăm de la ofertare un calendar realist de execuție.' },
      { q: 'Pot schimba culoarea după 5 ani?', a: 'Tehnic se poate interveni, dar cea mai bună soluție este alegerea corectă a culorii și a tipului de vopsire de la început. Recolorarea ulterioară trebuie evaluată separat, în funcție de starea învelitorii.' },
      { q: 'Ce se face cu tabla veche?', a: 'Stabilim de la început dacă demontarea, evacuarea și valorificarea materialului vechi sunt incluse sau ofertate separat, ca să nu existe costuri neclare la final.' },
    ],
    'acoperisuri-industriale-tpo': [
      { q: 'Pot monta panouri fotovoltaice pe membrană TPO?', a: 'Da, dar sistemul trebuie gândit împreună cu soluția de acoperiș. Alegem suporturi, trasee și detalii care protejează membrana și permit mentenanța ulterioară.' },
      { q: 'Cum depistez o infiltrație pe acoperiș plat?', a: 'De multe ori semnul vizibil apare departe de cauza reală. Analizăm scurgerile, străpungerile, aticele și zonele cu intervenții anterioare înainte să confirmăm punctul critic.' },
      { q: 'Pot aplica membrană TPO peste asfalt existent?', a: 'Depinde de starea suportului și de soluția tehnică admisă de sistemul ales. În unele cazuri este posibil, în altele recomandăm decopertare sau strat intermediar.' },
      { q: 'Cât costă per mp orientativ?', a: 'Prețul pe metru pătrat variază în funcție de grosimea membranei, metoda de fixare, numărul de detalii și condițiile de șantier. De aceea preferăm o ofertă completă, nu un tarif scos din context.' },
      { q: 'Câtă greutate adaugă membrana TPO?', a: 'Membrana în sine este o soluție ușoară; greutatea totală depinde însă de stratificație și de modul de fixare, mai ales în variantele balastate. Validăm acest aspect în faza de evaluare.' },
    ],
    'atice-si-fatade-tabla': [
      { q: 'Pot schimba fațada fără a afecta structura?', a: 'În multe cazuri da, dacă sistemul ales este compatibil cu suportul existent. Validăm însă întotdeauna soluția de fixare și stratificația înainte de ofertă finală.' },
      { q: 'Ce culori RAL sunt disponibile stoc?', a: 'Cele mai comune culori RAL standard sunt de obicei mai accesibile și cu termen mai scurt. Pentru nuanțe speciale verificăm disponibilitatea și termenul de comandă înainte de lansare.' },
      { q: 'Cât durează montajul pentru o fațadă de 200 mp?', a: 'Durata depinde de geometrie, înălțime, acces și de tipul produsului ales. Îți dăm un grafic realist de execuție după evaluarea suprafeței și a detaliilor.' },
      { q: 'Se poate aplica pe clădiri vechi?', a: 'Da, în multe situații se poate, dar trebuie verificat suportul și modul în care noua placare se leagă de structura și detaliile existente.' },
      { q: 'Include și izolația termică?', a: 'Poate include, dar nu presupunem automat acest lucru. În ofertă separăm clar varianta doar cu placare de varianta cu termoizolație sau panouri sandwich.' },
    ],
    'reparatii-si-mentenanta': [
      { q: 'Cum știu dacă am o infiltrație?', a: 'Semnele cele mai comune sunt pete umede, miros persistent, apă care apare după ploaie sau condens neobișnuit în zonele critice. Uneori cauza reală este mai sus sau mai departe decât locul unde vezi efectul.' },
      { q: 'Cât costă o inspecție?', a: 'Costul depinde de localitate, suprafață și complexitatea acoperișului sau a sistemului. Îți spunem de la început dacă vorbim despre o simplă triere, o inspecție dedicată sau o intervenție cu deplasare rapidă.' },
      { q: 'Cât de des trebuie curățate panourile fotovoltaice?', a: 'Nu există un interval fix universal. Depinde de praf, polen, trafic, păsări și panta acoperișului, dar când murdărirea este serioasă, curățarea profesională poate recupera 10-25% din producția pierdută.' },
      { q: 'Interveniți și în weekend pentru urgențe?', a: 'Pentru cazurile urgente încercăm să răspundem cât mai rapid, inclusiv în afara programului, dar confirmăm telefonic disponibilitatea în funcție de localitate, vreme și gradul de risc.' },
      { q: 'Faceți și reparații la acoperișuri pe care nu le-ați montat voi?', a: 'Da, după evaluare. Intervenim și pe lucrări executate de alții dacă putem propune o soluție tehnic corectă și dacă problema este clar identificată.' },
    ],
  }

  const pages = [
    {
      path: '/contact',
      title: 'Contact — Solaris CET',
      description: 'Contact Solaris CET pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Contact Solaris CET',
      bodyLines: ['Instalații fotovoltaice, acoperișuri (tablă/țiglă/TPO), reparații și mentenanță în Vaslui și în toată România.'],
      extraHtml: contactDetailsHtml,
      footerCtaHtml: '<p><a href="#form-oferta">Completează formularul ↓</a></p>',
      jsonLd: wrapJsonLd([
        {
          '@type': 'ContactPage',
          name: 'Contact Solaris CET',
          url: `${origin}/contact/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]),
        {
          '@type': ['RoofingContractor', 'ElectricalContractor'],
          name: 'Solaris CET',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Cetățuia',
            addressRegion: 'Vaslui',
            addressCountry: 'RO',
          },
          telephone: '+40769889721',
          email: 'solaris-cet@protonmail.com',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 46.7195,
            longitude: 27.7398,
          },
          openingHours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-14:00'],
          priceRange: 'RON',
          sameAs: ['https://wa.me/40769889721'],
        },
      ]),
    },
    {
      path: '/multumim',
      title: 'Cerere trimisă — Solaris CET',
      description: 'Cererea a fost trimisă. Revenim în maximum 24 de ore.',
      h1: 'Cererea a fost trimisă!',
      bodyLines: ['Te contactăm în maxim 24 de ore pe numărul de telefon furnizat.'],
      extraHtml: `
        <p>Sau sună direct: <a href="tel:+40769889721">+40 769 889 721</a></p>
        <p style="color:#94a3b8;font-size:.85rem">Ești redirecționat automat în 5 secunde...</p>
        <p><a href="/">← Înapoi acasă</a></p>
      `,
      footerCtaHtml: '',
      noindex: true,
      redirectTo: '/',
      redirectDelaySeconds: 5,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Cerere trimisă — Solaris CET', url: `${origin}/multumim/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Mulțumim', path: '/multumim' },
        ]),
      ]),
    },
    {
      path: '/calculator',
      title: 'Calculator fotovoltaic — Solaris CET',
      description: 'Calculator web pentru estimarea puterii sistemului, intervalului de cost, economiilor și amortizării.',
      h1: 'Calculator fotovoltaic cu estimare în browser',
      bodyLines: [
        'Introdu consumul lunar, tipul clientului, fazele, bateria și contextul proiectului.',
        'Pagina estimează direct în browser puterea sistemului, costul orientativ, economia anuală și amortizarea.',
      ],
      extraHtml: `
        <div style="margin-top: 12px;">
          <p><a href="/calculator">Folosește calculatorul web →</a></p>
        </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Calculator fotovoltaic', url: `${origin}/calculator/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Calculator', path: '/calculator' },
        ]),
      ]),
    },
    {
      path: '/servicii',
      title: 'Servicii — Solaris CET',
      description: 'Servicii complete Solaris CET: fotovoltaice, acoperișuri, TPO, atice/fațade și mentenanță, cu pași clari și CTA-uri utile.',
      h1: 'Servicii Solaris CET',
      bodyLines: [
        'Alege serviciul potrivit și vezi ce include, pentru cine este potrivit și care este pasul următor corect.',
        'Nu trimitem clientul într-un formular generic fără context: pentru fotovoltaice există calculator, iar pentru restul lucrărilor cerem datele minime utile.',
        'Pentru ofertă bună: localitate, poze, consum sau suprafață aproximativă și termenul dorit.',
      ],
      extraHtml: servicesOverviewHtml,
      jsonLd: wrapJsonLd([
        buildServiceJsonLd('Servicii Solaris CET', `${origin}/servicii/`),
        {
          '@type': 'ItemList',
          name: 'Servicii Solaris CET',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Fotovoltaice rezidențiale', url: `${origin}/servicii/fotovoltaice-rezidentiale/` },
            { '@type': 'ListItem', position: 2, name: 'Fotovoltaice industriale', url: `${origin}/servicii/fotovoltaice-industriale/` },
            { '@type': 'ListItem', position: 3, name: 'Acoperișuri tablă/țiglă', url: `${origin}/servicii/acoperisuri-tabla-tigla/` },
            { '@type': 'ListItem', position: 4, name: 'Acoperișuri industriale TPO', url: `${origin}/servicii/acoperisuri-industriale-tpo/` },
            { '@type': 'ListItem', position: 5, name: 'Atice și fațade tablă', url: `${origin}/servicii/atice-si-fatade-tabla/` },
            { '@type': 'ListItem', position: 6, name: 'Reparații și mentenanță', url: `${origin}/servicii/reparatii-si-mentenanta/` },
          ],
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
        ]),
      ]),
    },
    {
      path: '/servicii/fotovoltaice-rezidentiale',
      title: 'Fotovoltaice Rezidențiale în Vaslui, Iași și Bacău — Solaris CET',
      description: 'Sisteme fotovoltaice rezidențiale 3-15 kWp pentru case, cu dosar prosumator, baterii opționale și montaj curat.',
      h1: 'Fotovoltaice Rezidențiale în Vaslui, Iași, Bacău și județele limitrofe',
      bodyLines: [
        'Dimensionăm sisteme fotovoltaice rezidențiale în intervalul 3-15 kWp pentru case și vile, pornind de la consumul real, orientarea acoperișului, umbriri și obiectivul de autoconsum. Pachetul poate include soluții on-grid pentru prosumator, variante hibride sau configurații cu baterie, în funcție de cum folosești energia în cursul zilei și al serii.',
        'În ofertă clarificăm ce primești concret: panouri, structură, invertor, cablare DC/AC, protecții, contorizare, punere în funcțiune, instruire și suport pentru dosarul de prosumator. Dacă urmărești Casa Verde AFM sau o finanțare disponibilă prin PNRR, îți spunem din start ce documente și condiții practice trebuie pregătite.',
        'Montajul durează de regulă 1-3 zile, iar parcursul administrativ pentru dosarul de prosumator se întinde frecvent pe 4-8 săptămâni, în funcție de distribuitor. Discutăm transparent și despre garanții: produs 10-15 ani, performanță 25 ani și execuție 2 ani, conform contractului și echipamentelor alese.',
      ],
      extraHtml: servicePageBlocks['fotovoltaice-rezidentiale'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Instalații fotovoltaice rezidențiale',
          'Sisteme fotovoltaice rezidențiale 3-15 kWp pentru case, cu dosar prosumator, baterii opționale și montaj curat.',
          'fotovoltaic-rezidential',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['fotovoltaice-rezidentiale'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Fotovoltaice rezidențiale', path: '/servicii/fotovoltaice-rezidentiale' },
        ]),
      ]),
    },
    {
      path: '/servicii/fotovoltaice-industriale',
      title: 'Fotovoltaice Industriale în Vaslui și Moldova — Solaris CET',
      description: 'Sisteme fotovoltaice industriale de la 20+ kWp pentru hale și spații comerciale, cu monitorizare și scenarii de ROI.',
      h1: 'Fotovoltaice Industriale în Vaslui, Iași, Bacău și toată Moldova',
      bodyLines: [
        'Pentru hale, depozite și spații comerciale proiectăm sisteme fotovoltaice de la 20+ kWp, pornind de la profilul de consum, facturile de energie, orientarea acoperișului și tipul de rețea mono sau trifazată. Scopul este autoconsumul real și amortizarea calculată prudent, nu doar instalarea unei puteri mari care nu este folosită eficient.',
        'Analizăm și partea de execuție: tipul acoperișului, eventualele membrane TPO, încărcările admise, căile de acces și modul în care putem lucra etapizat fără să blocăm activitatea firmei. Putem integra monitorizare live, alerte și rapoarte lunare, utile pentru managementul energetic și pentru urmărirea performanței în exploatare.',
        'Când proiectul o permite, discutăm și avantajele fiscale, inclusiv amortizarea accelerată și posibilitatea deducerii de până la 50% din investiție în primul an, conform cadrului aplicabil. La predare primești parametri de referință, recomandări de mentenanță și scenarii pentru extindere ulterioară, dacă planul energetic al firmei evoluează.',
      ],
      extraHtml: servicePageBlocks['fotovoltaice-industriale'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Sisteme fotovoltaice industriale',
          'Sisteme fotovoltaice industriale de la 20+ kWp pentru hale și spații comerciale, cu monitorizare și scenarii de ROI.',
          'fotovoltaic-industrial',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['fotovoltaice-industriale'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Fotovoltaice industriale', path: '/servicii/fotovoltaice-industriale' },
        ]),
      ]),
    },
    {
      path: '/servicii/acoperisuri-tabla-tigla',
      title: 'Acoperișuri din Tablă și Țiglă Metalică în Vaslui — Solaris CET',
      description: 'Montaj și reparații pentru acoperișuri din tablă click, profilată sau țiglă metalică, cu accesorii și etanșări corecte.',
      h1: 'Acoperișuri din Tablă și Țiglă Metalică în Vaslui și județele din jur',
      bodyLines: [
        'Pentru case și anexe din Vaslui și județele limitrofe montăm și refacem acoperișuri din tablă click, tablă profilată, tablă cutată și țiglă metalică, alegând soluția după geometria acoperișului, expunere și obiectivul proiectului. În evaluare contează nu doar suprafața, ci și panta, numărul de dolii, străpungerile, mansarda și modul în care se evacuează apa.',
        'Îți explicăm clar diferențele dintre grosimi de 0.45 mm, 0.5 mm și 0.6 mm și dintre acoperirile polyester 25 μm și PVDF sau Pural Matt 35 μm, astfel încât să știi ce plătești și de ce. Pachetul poate include sisteme pluviale din PVC, oțel vopsit sau aluminiu, plus accesorii precum parazăpezi, aeratoare, ferestre de mansardă și coamă aerisită.',
        'Ne concentrăm pe detaliile care fac diferența în timp: coame, dolii, racorduri, borduri și etanșări curate. În contract putem specifica o garanție de execuție pentru etanșeitate de 5-10 ani, iar dacă vrei panouri fotovoltaice pe tablă click, pregătim montajul încă din această etapă ca să eviți intervenții costisitoare ulterior.',
      ],
      extraHtml: servicePageBlocks['acoperisuri-tabla-tigla'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Acoperișuri tablă / țiglă',
          'Montaj și reparații pentru acoperișuri din tablă click, profilată sau țiglă metalică, cu accesorii și etanșări corecte.',
          'acoperis-tabla',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['acoperisuri-tabla-tigla'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Acoperișuri tablă/țiglă', path: '/servicii/acoperisuri-tabla-tigla' },
        ]),
      ]),
    },
    {
      path: '/servicii/acoperisuri-industriale-tpo',
      title: 'Acoperișuri Industriale TPO în Vaslui și Moldova — Solaris CET',
      description: 'Membrană TPO pentru hale și depozite, cu grosimi 1.2-2.0 mm, fixare corectă și compatibilitate cu fotovoltaice pe acoperiș plat.',
      h1: 'Acoperișuri Industriale TPO în Vaslui, Bacău, Iași și toată Moldova',
      bodyLines: [
        'Membrana TPO este o soluție eficientă pentru acoperișuri plate industriale, dar performanța ei depinde de alegerea grosimii corecte și de execuția impecabilă a detaliilor. Recomandăm 1.2 mm, 1.5 mm sau 2.0 mm în funcție de trafic pietonal, climat, stratificație și nivelul de solicitare al clădirii.',
        'Stabilim metoda de fixare mecanică, adezivă sau balastată după suport, încărcări și modul de exploatare al clădirii. Zonele critice sunt colțurile, aticele, străpungerile, trecerile de cablu și gurile de scurgere, iar aici tratăm cauzele infiltrațiilor înainte de a propune reparația sau sistemul nou.',
        'Dacă pe acoperișul plat există sau urmează un sistem fotovoltaic, pregătim soluții compatibile pentru suporturi și trasee. Garanția fabricantului pentru membrană este, de regulă, 15-20 ani, iar garanția de execuție pentru lucrarea noastră este 5 ani, completată de recomandări clare pentru inspecții periodice și mentenanță preventivă.',
      ],
      extraHtml: servicePageBlocks['acoperisuri-industriale-tpo'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Acoperișuri industriale TPO',
          'Membrană TPO pentru hale și depozite, cu grosimi 1.2-2.0 mm, fixare corectă și compatibilitate cu fotovoltaice pe acoperiș plat.',
          'acoperis-tpo',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['acoperisuri-industriale-tpo'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Acoperișuri industriale TPO', path: '/servicii/acoperisuri-industriale-tpo' },
        ]),
      ]),
    },
    {
      path: '/servicii/atice-si-fatade-tabla',
      title: 'Atice și Fațade din Tablă în Vaslui și Moldova — Solaris CET',
      description: 'Placări metalice pentru atice și fațade, cu culori RAL, opțiuni de termoizolație și diferențe clare între polyester și PVDF.',
      h1: 'Atice și Fațade din Tablă în Vaslui, Iași, Bacău și proiecte selectate la nivel național',
      bodyLines: [
        'Aticele și fațadele din tablă trebuie gândite ca parte a anvelopei clădirii, nu doar ca elemente de aspect. Pentru proiectele din Vaslui, Iași, Bacău și alte zone selectate lucrăm cu tablă cutată, tablă nervurată, casete de fațadă și tablă lisă cu prindere ascunsă, în funcție de imaginea dorită, expunere și ritmul de execuție necesar pe șantier.',
        'La ofertare clarificăm dacă lucrarea include doar placarea metalică sau și un sistem de termoizolație, de exemplu panouri sandwich cu vată minerală. Discutăm și paleta de culori RAL standard sau speciale și diferențele reale dintre vopsirea polyester, unde garanția tipică este 10-15 ani, și PVDF, unde intervalul poate urca la 20-30 ani în funcție de produs.',
        'Execuția corectă se vede în muchii, în colțuri, în racorduri și în felul în care apa este evacuată. De aceea tratăm aticele și fațadele împreună cu acoperișul, drenajul și restul elementelor de anvelopă, astfel încât finisajul să fie coerent vizual și corect tehnic pe termen lung.',
      ],
      extraHtml: servicePageBlocks['atice-si-fatade-tabla'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Atice și fațade tablă',
          'Placări metalice pentru atice și fațade, cu culori RAL, opțiuni de termoizolație și diferențe clare între polyester și PVDF.',
          'atice-fatade',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['atice-si-fatade-tabla'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Atice și fațade tablă', path: '/servicii/atice-si-fatade-tabla' },
        ]),
      ]),
    },
    {
      path: '/servicii/atice-fatade-tabla',
      title: 'Atice și Fațade din Tablă — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru acest serviciu.'],
      canonicalPath: '/servicii/atice-si-fatade-tabla/',
      redirectTo: '/servicii/atice-si-fatade-tabla/',
      noindex: true,
      jsonLd: wrapJsonLd([
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Atice și fațade tablă', path: '/servicii/atice-si-fatade-tabla' },
        ]),
      ]),
    },
    {
      path: '/servicii/reparatii-si-mentenanta',
      title: 'Reparații și Mentenanță în Vaslui și Moldova — Solaris CET',
      description: 'Intervenții urgente și mentenanță preventivă pentru acoperișuri, TPO și sisteme fotovoltaice, cu răspuns rapid în Vaslui și județele limitrofe.',
      h1: 'Reparații și Mentenanță în Vaslui și județele limitrofe',
      bodyLines: [
        'Serviciul nostru de reparații și mentenanță acoperă atât urgențele reale, cum sunt infiltrațiile active și elementele desprinse, cât și intervențiile planificate menite să prevină costuri mai mari pe termen lung. Pentru Vaslui și județele limitrofe încercăm să răspundem în aceeași zi sau în următoarea zi lucrătoare, în funcție de localitate, vreme și gradul de risc.',
        'La inspecție verificăm starea membranei sau a tablei, etanșeitatea la coame, dolii, atice și străpungeri, starea jgheaburilor, fixările și prezența mușchiului sau a vegetației. Pentru fotovoltaice facem curățare profesională, inspecție vizuală a modulelor, verificarea conexiunilor accesibile și curățarea invertorului, iar în multe cazuri se poate recupera 10-25% din producția pierdută prin murdărire severă.',
        'Intervenim și pe acoperișuri sau sisteme pe care nu le-am montat noi, dacă soluția propusă este tehnic corectă. Scopul nu este doar să reparăm rapid, ci să îți spunem clar dacă merită o intervenție punctuală, o refacere pe zonă sau un plan de mentenanță preventivă pentru a reduce riscul de reapariție.',
      ],
      extraHtml: servicePageBlocks['reparatii-si-mentenanta'],
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          'Reparații și mentenanță',
          'Intervenții urgente și mentenanță preventivă pentru acoperișuri, TPO și sisteme fotovoltaice, cu răspuns rapid în Vaslui și județele limitrofe.',
          'reparatii',
          `${origin}/images/hero-solaris.svg`
        ),
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['reparatii-si-mentenanta'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Reparații și mentenanță', path: '/servicii/reparatii-si-mentenanta' },
        ]),
      ]),
    },
    {
      path: '/servicii/reparatii-mentenanta',
      title: 'Reparații și Mentenanță Acoperiș — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru acest serviciu.'],
      canonicalPath: '/servicii/reparatii-si-mentenanta/',
      redirectTo: '/servicii/reparatii-si-mentenanta/',
      noindex: true,
      jsonLd: wrapJsonLd([
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Reparații și mentenanță', path: '/servicii/reparatii-si-mentenanta' },
        ]),
      ]),
    },
    {
      path: '/finantare',
      title: 'Finanțare fotovoltaice — Casa Verde, RePowerEU și credite verzi — Solaris CET',
      description: 'Programe de finanțare pentru sisteme fotovoltaice: Casa Verde 2025, Casa Verde Baterii 2026, RePowerEU, plus credite verzi prin BCR, Raiffeisen, BT și ProCredit.',
      h1: 'Finanțare pentru sisteme fotovoltaice și baterii',
      bodyLines: [
        'Te ajutăm să găsești soluția de finanțare potrivită pentru sistemul tău fotovoltaic — fie că este vorba de subvenție prin Casa Verde, finanțare europeană RePowerEU sau credit verde clasic prin băncile partenere.',
        'Pregătim dosarul tehnic (devize, fișe tehnice, schiță), iar tu deschizi contul AFM și depui aplicația. Plata se face în avans (30%) și restul după montaj și punere în funcțiune.',
        'Pentru detalii despre fiecare program și plafoanele actuale, vezi paginile dedicate sau sună-ne direct la +40 769 889 721.',
      ],
      jsonLd: wrapJsonLd([
        {
          '@type': 'WebPage',
          name: 'Finanțare fotovoltaice Solaris CET',
          url: `${origin}/finantare/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Finanțare', path: '/finantare' },
        ]),
      ]),
    },
    {
      path: '/despre',
      title: 'Despre — Solaris CET',
      description: 'Echipă locală pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Despre Solaris CET',
      bodyLines: [
        'Suntem o echipă orientată pe execuție corectă: detalii, etanșări, siguranță electrică și lucrări curate la predare.',
        'Ne ocupăm de fotovoltaice, acoperișuri (tablă/țiglă/TPO), atice/fațade tablă și mentenanță.',
        'Suntem în Cetățuia (Vaslui) și ne deplasăm în funcție de proiect, inclusiv în județele limitrofe.',
      ],
      jsonLd: wrapJsonLd([
        {
          '@type': 'AboutPage',
          name: 'Despre Solaris CET',
          url: `${origin}/despre/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Despre', path: '/despre' },
        ]),
      ]),
    },
    {
      path: '/proiecte',
      title: 'Proiecte și portofoliu — Solaris CET',
      description: 'Repere de proiecte Solaris CET: fotovoltaice, acoperișuri și intervenții TPO, plus pași clari pentru ofertare.',
      h1: 'Proiecte Solaris CET',
      bodyLines: [
        'Portofoliul arată tipuri de lucrări, contexte reale și genul de execuție pe care îl livrăm: fotovoltaice, acoperișuri și intervenții industriale.',
        'Dacă vrei o ofertă, nu trimite doar “vreau preț”: spune localitatea, tipul proiectului și atașează câteva poze relevante.',
      ],
      extraHtml: projectsOverviewHtml,
      jsonLd: wrapJsonLd([
        {
          '@type': 'CollectionPage',
          name: 'Proiecte Solaris CET',
          url: `${origin}/proiecte/`,
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
              url: `${origin}/proiecte/`,
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
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Proiecte', path: '/proiecte' },
        ]),
      ]),
    },
    {
      path: '/portofoliu',
      title: 'Portofoliu — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Portofoliul principal este disponibil la /proiecte/.'],
      canonicalPath: '/proiecte/',
      redirectTo: '/proiecte/',
      noindex: true,
      jsonLd: wrapJsonLd([breadcrumb([{ name: 'Acasă', path: '/' }, { name: 'Portofoliu', path: '/proiecte' }])]),
    },
    {
      path: '/faq',
      title: 'Întrebări frecvente — Solaris CET',
      description: 'Întrebări frecvente despre fotovoltaice, acoperișuri, mentenanță și ofertare.',
      h1: 'Întrebări frecvente (FAQ)',
      bodyLines: [
        'Răspunsuri scurte și clare despre ofertare, execuție și mentenanță (fotovoltaice, acoperișuri, TPO).',
        'Dacă ai o întrebare specifică, scrie pe WhatsApp sau folosește formularul de ofertă.',
      ],
      extraHtml: `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">FAQ rapid</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><strong>Cât costă un sistem fotovoltaic pentru o casă?</strong> Orientativ, un sistem de 5 kWp costă între 4.500 și 6.500 EUR cu montaj inclus.</li>
              <li><strong>Cât durează o instalare fotovoltaică?</strong> Depinde de complexitate; după evaluare îți spunem pașii și termenele realiste.</li>
              <li><strong>Ce vă trebuie pentru ofertă?</strong> Locație, consum (facturi), tip acoperiș/structură, orientare/umbriri și obiectiv.</li>
              <li><strong>Faceți reparații la infiltrații?</strong> Da. Facem diagnostic și intervenții punctuale (tablă/țiglă/TPO).</li>
              <li><strong>Acoperiți toată România?</strong> Da, în funcție de proiect.</li>
            </ul>
          </div>
      `,
      jsonLd: wrapJsonLd([
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Cât costă un sistem fotovoltaic pentru o casă?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Prețul variază în funcție de puterea instalată și configurație. Orientativ, un sistem de 5 kWp costă între 4.500 și 6.500 EUR cu montaj inclus. Solaris CET oferă evaluare gratuită și ofertă personalizată.',
              },
            },
            {
              '@type': 'Question',
              name: 'Cât durează o instalare fotovoltaică?',
              acceptedAnswer: { '@type': 'Answer', text: 'Depinde de complexitate și de condițiile din teren. După evaluare, îți spunem pașii și termenele realiste.' },
            },
            {
              '@type': 'Question',
              name: 'Ce informații vă trebuie pentru ofertă?',
              acceptedAnswer: { '@type': 'Answer', text: 'Locația, consumul (facturi), tipul acoperișului/structurii, orientare/umbriri și obiectivul proiectului.' },
            },
          ],
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ]),
      ]),
    },
    {
      path: '/blog',
      title: 'Blog — Solaris CET',
      description: 'Articole reale și ghiduri practice despre costuri, finanțare, mentenanță și alegerea sistemului potrivit.',
      h1: 'Blog Solaris CET',
      bodyLines: [
        'Articole și ghiduri care ajută clientul să ia o decizie mai bună înainte de ofertare.',
        'Fiecare material trimite spre calculator, serviciul relevant sau contactul scurt, nu rămâne o simplă listă de subiecte.',
      ],
      extraHtml: `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Subiecte populare</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><a href="/blog/cat-costa-un-sistem-fotovoltaic-2026">Cât costă un sistem fotovoltaic în 2026</a></li>
              <li><a href="/blog/cum-accesezi-programul-casa-verde">Cum accesezi programul Casa Verde</a></li>
              <li><a href="/blog/tpo-vs-membrana-clasica">Avantaje acoperiș TPO vs membrană clasică</a></li>
              <li><a href="/blog/mentenanta-panouri-fotovoltaice">Mentenanța panourilor fotovoltaice</a></li>
            </ul>
          </div>
      `,
      jsonLd: wrapJsonLd([
        {
          '@type': 'Blog',
          name: 'Blog Solaris CET',
          url: `${origin}/blog/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]),
      ]),
    },
    {
      path: '/blog/cat-costa-un-sistem-fotovoltaic-2026',
      title: 'Cât costă un sistem fotovoltaic în 2026 — Solaris CET',
      description: 'Ghid orientativ: prețuri, ce influențează costul, diferențe 5 kW vs 10 kW și cum compari corect ofertele.',
      h1: 'Cât costă un sistem fotovoltaic în 2026?',
      bodyLines: ['Articol complet în secțiunea Blog.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/cat-costa-un-sistem-fotovoltaic-2026">Deschide articolul →</a></p>
          </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Cât costă un sistem fotovoltaic în 2026', url: `${origin}/blog/cat-costa-un-sistem-fotovoltaic-2026/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: 'Cât costă un sistem fotovoltaic în 2026', path: '/blog/cat-costa-un-sistem-fotovoltaic-2026' },
        ]),
      ]),
    },
    {
      path: '/blog/mentenanta-panouri-fotovoltaice',
      title: 'Mentenanța panourilor fotovoltaice — Solaris CET',
      description: 'Ghid practic: ce verifici periodic, curățare, semne de problemă și cum păstrezi randamentul în timp.',
      h1: 'Mentenanța panourilor fotovoltaice',
      bodyLines: ['Articol complet în secțiunea Blog.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/mentenanta-panouri-fotovoltaice">Deschide articolul →</a></p>
          </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Mentenanța panourilor fotovoltaice', url: `${origin}/blog/mentenanta-panouri-fotovoltaice/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: 'Mentenanța panourilor fotovoltaice', path: '/blog/mentenanta-panouri-fotovoltaice' },
        ]),
      ]),
    },
    {
      path: '/blog/tabla-click-vs-tigla-metalica',
      title: 'Tablă click vs Țiglă metalică — Solaris CET',
      description: 'Comparație practică: când e potrivită tabla click și când e potrivită țigla metalică, plus zone critice la montaj.',
      h1: 'Tablă click vs Țiglă metalică',
      bodyLines: ['Articol complet în secțiunea Blog.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/tabla-click-vs-tigla-metalica">Deschide articolul →</a></p>
          </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Tablă click vs Țiglă metalică', url: `${origin}/blog/tabla-click-vs-tigla-metalica/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: 'Tablă click vs Țiglă metalică', path: '/blog/tabla-click-vs-tigla-metalica' },
        ]),
      ]),
    },
    {
      path: '/blog/tpo-vs-membrana-clasica',
      title: 'TPO vs membrane clasice — Solaris CET',
      description: 'Comparație practică pentru acoperișuri industriale: detalii critice, mentenanță și greșeli frecvente.',
      h1: 'Acoperiș TPO vs membrane clasice',
      bodyLines: ['Articol complet în secțiunea Blog.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/tpo-vs-membrana-clasica">Deschide articolul →</a></p>
          </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'TPO vs membrane clasice', url: `${origin}/blog/tpo-vs-membrana-clasica/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: 'TPO vs membrane clasice', path: '/blog/tpo-vs-membrana-clasica' },
        ]),
      ]),
    },
    {
      path: '/blog/cum-accesezi-programul-casa-verde',
      title: 'Cum accesezi Casa Verde — Solaris CET',
      description: 'Pași orientativi și checklist pentru Casa Verde (AFM): cum pregătești documentele și cum alegi soluția tehnică potrivită.',
      h1: 'Cum accesezi programul Casa Verde',
      bodyLines: ['Articol complet în secțiunea Blog.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/cum-accesezi-programul-casa-verde">Deschide articolul →</a></p>
          </div>
      `,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Cum accesezi programul Casa Verde', url: `${origin}/blog/cum-accesezi-programul-casa-verde/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: 'Casa Verde', path: '/blog/cum-accesezi-programul-casa-verde' },
        ]),
      ]),
    },
    ...[
      {
        slug: 'panouri-bifaciale-vs-monocristaline',
        title: 'Panouri bifaciale vs monocristaline',
      },
      {
        slug: 'mentenanta-acoperis-tpo-checklist',
        title: 'Mentenanța acoperișului TPO',
      },
      {
        slug: 'invertor-hibrid-baterie-cand-merita',
        title: 'Invertor hibrid + baterie',
      },
    ].map((x) => ({
      path: `/blog/${x.slug}`,
      title: `${x.title} — Solaris CET`,
      description: 'Ghid orientativ publicat în regim de pre-lansare editorială.',
      h1: x.title,
      bodyLines: ['Acest articol este publicat ca ghid orientativ și se actualizează pe măsură ce adăugăm exemple și date din proiecte reale.'],
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/blog/${x.slug}">Deschide articolul →</a></p>
          </div>
      `,
      noindex: true,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: x.title, url: `${origin}/blog/${x.slug}/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: x.title, path: `/blog/${x.slug}` },
        ]),
      ]),
    })),
    {
      path: '/privacy',
      title: 'Politica de confidențialitate — Solaris CET',
      description: 'Politica de confidențialitate Solaris CET (GDPR).',
      h1: 'Politica de confidențialitate',
      bodyLines: [
        'Folosim datele de contact doar pentru a răspunde solicitărilor (ofertare / suport) și pentru a putea livra serviciile cerute.',
        'Nu vindem datele către terți. Pentru cereri GDPR (acces/ștergere), scrie-ne pe email.',
      ],
      extraHtml: privacyOverviewHtml,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Politica de confidențialitate', url: `${origin}/privacy/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Confidențialitate', path: '/privacy' },
        ]),
      ]),
    },
    {
      path: '/cookies',
      title: 'Politica de cookie-uri — Solaris CET',
      description: 'Politica de cookie-uri Solaris CET.',
      h1: 'Politica de cookie-uri',
      bodyLines: [
        'Cookie-urile ne ajută să îmbunătățim experiența și să înțelegem cum este folosit site-ul (după consimțământ).',
        'Poți schimba preferințele din Setări cookie.',
      ],
      extraHtml: cookiesOverviewHtml,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Politica de cookie-uri', url: `${origin}/cookies/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Cookie-uri', path: '/cookies' },
        ]),
      ]),
    },
    {
      path: '/terms',
      title: 'Termeni și condiții — Solaris CET',
      description: 'Termeni și condiții Solaris CET.',
      h1: 'Termeni și condiții',
      bodyLines: [
        'Conținutul site-ului are rol informativ. Oferta finală se face după evaluarea tehnică și confirmarea condițiilor proiectului.',
        'Pentru întrebări, contactează-ne.',
      ],
      extraHtml: termsOverviewHtml,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Termeni și condiții', url: `${origin}/terms/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Termeni', path: '/terms' },
        ]),
      ]),
    },
    {
      path: '/privacy-settings',
      title: 'Setări cookie-uri — Solaris CET',
      description: 'Controlează preferințele cookie și gestionează consimțământul direct din browser.',
      h1: 'Setări cookie-uri',
      noindex: true,
      bodyLines: [
        'Alege ce cookie-uri accepți și salvează preferințele direct în browser.',
        'Cookie-urile strict necesare rămân active pentru funcționarea de bază a site-ului.',
      ],
      extraHtml: privacySettingsOverviewHtml,
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Setări cookie și confidențialitate', url: `${origin}/privacy-settings/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Setări confidențialitate', path: '/privacy-settings' },
        ]),
      ]),
    },
    {
      path: '/politica-confidentialitate',
      title: 'Politica de confidențialitate — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru Politica de confidențialitate.'],
      canonicalPath: '/privacy/',
      redirectTo: '/privacy/',
      noindex: true,
      jsonLd: wrapJsonLd([breadcrumb([{ name: 'Acasă', path: '/' }, { name: 'Confidențialitate', path: '/privacy' }])]),
    },
    {
      path: '/politica-cookies',
      title: 'Politica de cookie-uri — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru Politica de cookie-uri.'],
      canonicalPath: '/cookies/',
      redirectTo: '/cookies/',
      noindex: true,
      jsonLd: wrapJsonLd([breadcrumb([{ name: 'Acasă', path: '/' }, { name: 'Cookie-uri', path: '/cookies' }])]),
    },
    {
      path: '/services',
      title: 'Servicii — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru Servicii.'],
      canonicalPath: '/servicii/',
      redirectTo: '/servicii/',
      noindex: true,
      jsonLd: wrapJsonLd([breadcrumb([{ name: 'Acasă', path: '/' }, { name: 'Servicii', path: '/servicii' }])]),
    },
    {
      path: '/portfolio',
      title: 'Portofoliu — Solaris CET',
      description: 'Pagina s-a mutat.',
      h1: 'Pagina s-a mutat',
      bodyLines: ['Folosește noua adresă pentru Portofoliu.'],
      canonicalPath: '/proiecte/',
      redirectTo: '/proiecte/',
      noindex: true,
      jsonLd: wrapJsonLd([breadcrumb([{ name: 'Acasă', path: '/' }, { name: 'Portofoliu', path: '/proiecte' }])]),
    },
    ...[
      { slug: 'vaslui', city: 'Vaslui' },
      { slug: 'bacau', city: 'Bacău' },
      { slug: 'iasi', city: 'Iași' },
      { slug: 'galati', city: 'Galați' },
    ].map((x) => ({
      path: `/${x.slug}`,
      title: `Fotovoltaice & Acoperișuri în ${x.city} — Solaris CET`,
      description: `Servicii Solaris CET în ${x.city}: fotovoltaice, acoperișuri, TPO, atice/fațade tablă, mentenanță.`,
      h1: `Servicii Solaris CET în ${x.city}`,
      bodyLines: [
        `Suntem bazați în Cetățuia (Vaslui) și ne deplasăm în ${x.city} și zonele apropiate, în funcție de proiect.`,
        'Oferim: fotovoltaice (rezidențial/industrial), acoperișuri tablă/țiglă, acoperișuri TPO, atice/fațade tablă, reparații și mentenanță.',
        'Trimite consumul și câteva poze cu locația, iar noi îți propunem pașii și o ofertă clară.',
      ],
      jsonLd: wrapJsonLd([
        localBusiness,
        {
          '@type': 'Service',
          name: 'Servicii Solaris CET',
          areaServed: { '@type': 'City', name: x.city, addressCountry: 'RO' },
          provider: serviceProviderRef,
          url: `${origin}/${x.slug}/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: x.city, path: `/${x.slug}` },
        ]),
      ]),
    })),
    ...Object.entries(locationData).map(([slug, loc]) => ({
      path: `/${slug}`,
      title: `Panouri Fotovoltaice și Acoperișuri în ${loc.county} — Solaris CET`,
      description: `Panouri fotovoltaice și acoperișuri în ${loc.county}. Solaris CET — experiență, garanție 10 ani, finanțare disponibilă. Ofertă gratuită: +40 769 889 721`,
      h1: `Panouri Fotovoltaice și Acoperișuri în ${loc.county} — Solaris CET`,
      bodyLines: [
        `Servim zona ${loc.county} cu instalări profesionale de sisteme fotovoltaice, acoperișuri (tablă, țiglă metalică, TPO), atice, fațade tablă și reparații.`,
        `Am realizat ${loc.projectsCount} proiecte în ${loc.county} în 2024, în localități precum ${loc.mainLocalities.join(', ')}.`,
        `Distanța de la sediul nostru din Cetățuia, Vaslui: ${loc.distanceKm} km. Ajungem în ${loc.travelTime}.`,
      ],
      extraHtml: `
        <div style="margin-top: 12px;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">Ce spun clienții noștri din ${loc.county}</h2>
          <blockquote style="border-left: 3px solid #f59e0b; padding-left: 12px; margin: 0; color: rgba(255,255,255,.82);">
            <p>"${loc.testimonial.text}"</p>
            <footer style="margin-top: 8px; font-size: 13px; color: rgba(255,255,255,.6);">— ${loc.testimonial.name}, ${loc.testimonial.locality}, ${loc.county}</footer>
          </blockquote>
        </div>
        <div style="margin-top: 12px;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">Localizare</h2>
          <div style="border-radius: 8px; overflow:hidden; border:1px solid #334155;">
            <iframe title="Hartă ${loc.county}" src="https://www.openstreetmap.org/export/embed.html?bbox=27.0%2C46.0%2C28.0%2C47.0&amp;layer=mapnik&amp;marker=46.6407%2C27.7276" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%; height:300px; border:0; display:block;"></iframe>
          </div>
          <p style="font-size:.8rem; margin-top:.5rem;"><a href="https://www.openstreetmap.org/?mlat=46.6407&amp;mlon=27.7276#map=12/46.6407/27.7276" target="_blank" rel="noopener noreferrer">Deschide harta completă →</a></p>
        </div>
      `,
      jsonLd: wrapJsonLd([
        buildServiceSchema(
          `Servicii Solaris CET în ${loc.county}`,
          `Panouri fotovoltaice și acoperișuri în ${loc.county}. Solaris CET — experiență, garanție 10 ani, finanțare disponibilă.`,
          'fotovoltaic-rezidential',
          `${origin}/images/hero-solaris.svg`
        ),
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: loc.county, path: `/${slug}` },
        ]),
      ]),
    })),
  ]

  for (const p of pages) {
    const outDir = path.join(publicDir, normalizePath(p.path).replace(/^\//, ''), 'index.html')
    await fs.mkdir(path.dirname(outDir), { recursive: true })
    const html = renderStaticPageHtml({
      title: p.title,
      description: p.description,
      canonicalPath: typeof p.canonicalPath === 'string' ? p.canonicalPath : `${p.path}/`,
      h1: p.h1,
      bodyLines: p.bodyLines,
      extraHtml: p.extraHtml,
      footerCtaHtml: p.footerCtaHtml,
      jsonLd: p.jsonLd,
      noindex: Boolean(p.noindex),
      redirectTo: p.redirectTo,
      redirectDelaySeconds: p.redirectDelaySeconds,
    })
    await fs.writeFile(outDir, html, 'utf8')
  }
}

async function writeSitemap() {
  const toAbsoluteUrl = (pathname) => {
    const normalized = normalizePath(pathname)
    if (normalized === '/') return `${origin}/`
    return `${origin}${normalized}/`
  }

  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: toAbsoluteUrl('/servicii'), priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/fotovoltaice-rezidentiale'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/fotovoltaice-industriale'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/acoperisuri-tabla-tigla'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/acoperisuri-industriale-tpo'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/atice-si-fatade-tabla'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/servicii/reparatii-si-mentenanta'), priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/despre'), priority: '0.7', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/contact'), priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/calculator'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/finantare'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/proiecte'), priority: '0.7', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/blog'), priority: '0.7', changefreq: 'weekly', lastmod: today },
    { loc: toAbsoluteUrl('/faq'), priority: '0.6', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/privacy'), priority: '0.3', changefreq: 'yearly', lastmod: today },
    { loc: toAbsoluteUrl('/cookies'), priority: '0.3', changefreq: 'yearly', lastmod: today },
    { loc: toAbsoluteUrl('/terms'), priority: '0.3', changefreq: 'yearly', lastmod: today },
    // County pages
    { loc: toAbsoluteUrl('/vaslui'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/iasi'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/bacau'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/galati'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/neamt'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/suceava'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/botosani'), priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: toAbsoluteUrl('/vrancea'), priority: '0.8', changefreq: 'monthly', lastmod: today },
  ]

  // Add blog article pages from locationData (simulated)
  const blogSlugs = [
    'cat-costa-un-sistem-fotovoltaic-2026',
    'cum-accesezi-programul-casa-verde',
    'tabla-click-vs-tigla-metalica',
    'tpo-vs-membrana-clasica',
    'mentenanta-panouri-fotovoltaice',
    'panouri-bifaciale-vs-monocristaline',
    'mentenanta-acoperis-tpo-checklist',
    'invertor-hibrid-baterie-cand-merita',
    'beneficii-panouri-fotovoltaice-romania-2026',
    'ghid-complet-instalare-acoperis-tabla',
  ]
  for (const slug of blogSlugs) {
    urls.push({
      loc: toAbsoluteUrl(`/blog/${slug}`),
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: today,
    })
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls
      .map((u) => {
        const extra = [
          u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '',
          u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '',
          u.priority ? `<priority>${u.priority}</priority>` : '',
          `<xhtml:link rel="alternate" hreflang="ro" href="${u.loc}"/>`,
        ].join('\n      ')
        return `  <url>\n      <loc>${u.loc}</loc>\n      ${extra}\n    </url>`
      })
      .join('\n') +
    `\n</urlset>\n`

  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8')
}

async function writeRobots() {
  const txt = [
    `User-agent: *`,
    `Allow: /`,
    `Disallow: /api/`,
    `Disallow: /admin/`,
    `Disallow: /.well-known/`,
    `Disallow: /push/`,
    ``,
    `User-agent: Googlebot`,
    `Allow: /api/openapi/`,
    `Crawl-delay: 1`,
    ``,
    `Sitemap: ${origin}/sitemap.xml`,
    ``,
    `Host: https://solaris-cet.com`,
    ``,
  ].join('\n')
  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'robots.txt'), txt, 'utf8')
}

async function pingSearchEngines() {
  const sitemapUrl = `${origin}/sitemap.xml`
  const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
  const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`

  try {
    const googleRes = await fetch(googleUrl, { method: 'GET' })
    console.log(`✅ Google ping: ${googleRes.status}`)
  } catch (err) {
    console.error('❌ Google ping failed:', err.message)
  }

  try {
    const bingRes = await fetch(bingUrl, { method: 'GET' })
    console.log(`✅ Bing ping: ${bingRes.status}`)
  } catch (err) {
    console.error('❌ Bing ping failed:', err.message)
  }

  console.log('✅ Sitemap submitted to Google and Bing')
}

await Promise.all([writeStaticPages(), writeSitemap(), writeRobots()])

// ── SEO Audit ───────────────────────────────────────────────────────────────
const allPages = pages.map((p) => ({
  path: normalizePath(p.path),
  title: p.title,
  description: p.description,
  hasDescription: Boolean(p.description && p.description.length > 0),
}))

const titles = allPages.map((p) => p.title)
const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i)
const pagesWithoutDescription = allPages.filter((p) => !p.hasDescription)

console.log('\n📊 SEO Audit Report')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`Total pages: ${allPages.length}`)
console.log(`Pages without description: ${pagesWithoutDescription.length}`)
if (pagesWithoutDescription.length > 0) {
  console.log('  Missing descriptions:')
  pagesWithoutDescription.forEach((p) => console.log(`  - ${p.path}`))
}
console.log(`Duplicate titles: ${duplicateTitles.length}`)
if (duplicateTitles.length > 0) {
  console.log('  Duplicate titles:')
  duplicateTitles.forEach((t) => console.log(`  - "${t}"`))
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

await pingSearchEngines()
