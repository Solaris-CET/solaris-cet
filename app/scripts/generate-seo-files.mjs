import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import path from 'node:path'

const appRoot = process.cwd()
const publicDir = path.join(appRoot, 'public')

const origin = String(process.env.VITE_PUBLIC_SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '')

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

function renderStaticPageHtml({ title, description, canonicalPath, h1, bodyLines, jsonLd }) {
  const canonical = `${origin}${normalizePath(canonicalPath)}`
  const metaDesc = escapeHtml(description)
  const metaTitle = escapeHtml(title)
  const metaH1 = escapeHtml(h1)
  const body = bodyLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n')
  const jsonLdBlock = jsonLd
    ? `\n    <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>\n`
    : '\n'

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${metaTitle}</title>
    <meta name="description" content="${metaDesc}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
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
      p { margin: 10px 0; color: rgba(255,255,255,.82); }
      .nav { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
      .nav a { border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); padding: 10px 12px; border-radius: 12px; font-weight: 700; }
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
          ${body}
          <p><strong>Telefon:</strong> <a href="tel:+40769889721">+40 769 889 721</a> · <strong>Email:</strong> <a href="mailto:solaris-cet@protonmail.com">solaris-cet@protonmail.com</a></p>
          <p><a href="/contact/">Solicită ofertă →</a></p>
        </div>
      </main>
    </div>
  </body>
</html>
`
}

async function writeStaticPages() {
  const localBusiness = {
    '@type': 'LocalBusiness',
    name: 'Solaris Engineering',
    url: origin,
    telephone: '+40769889721',
    email: 'solaris-cet@protonmail.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cetățuia',
      addressRegion: 'Vaslui',
      addressCountry: 'RO',
    },
    areaServed: 'RO',
  }

  const serviceFaq = {
    'fotovoltaice-rezidentiale': [
      { q: 'Cât durează montajul pentru o casă?', a: 'De obicei 1–3 zile, în funcție de acces, tip acoperiș și complexitate.' },
      { q: 'Funcționează sistemul și iarna?', a: 'Da. Producția diferă sezonier, dar sistemul generează energie și pe vreme rece/înnorată.' },
      { q: 'E nevoie de baterie?', a: 'Nu obligatoriu. Bateria ajută la autoconsum seara și backup (parțial), dar depinde de obiectiv și buget.' },
    ],
    'fotovoltaice-industriale': [
      { q: 'Se poate monta pe TPO?', a: 'Da, cu detalii și proceduri corecte pentru etanșare și protecție.' },
      { q: 'Aveți soluții de monitorizare?', a: 'Da. Configurăm monitorizare și alerte pentru performanță.' },
      { q: 'Se poate face pe etape?', a: 'Da. Planificăm în funcție de operațiunile locației.' },
    ],
    'acoperisuri-tabla-tigla': [
      { q: 'Tablă click sau țiglă metalică?', a: 'Depinde de arhitectură, buget și geometria acoperișului; recomandăm după evaluare.' },
      { q: 'Includeți și jgheaburi/burlane?', a: 'Da, dacă sunt necesare pentru drenaj corect.' },
      { q: 'Cât durează o reparație?', a: 'De la intervenții punctuale până la reparații mai ample, în funcție de situație.' },
    ],
    'acoperisuri-industriale-tpo': [
      { q: 'Ce este TPO?', a: 'O membrană termoplastică folosită frecvent la acoperișuri plate industriale.' },
      { q: 'Cât de des e nevoie de inspecție?', a: 'Recomandăm minim 1–2 inspecții/an pentru acoperișuri industriale.' },
      { q: 'Se poate monta PV peste TPO?', a: 'Da, cu soluții compatibile și detalii corecte de fixare/etanșare.' },
    ],
    'atice-fatade-tabla': [
      { q: 'Se pot repara doar zonele afectate?', a: 'Da. Facem reparații locale sau înlocuiri punctuale unde este realist.' },
      { q: 'Includeți și etanșări?', a: 'Da, acolo unde sunt necesare pentru protecția anvelopei.' },
      { q: 'Cum arată finisajul?', a: 'Punem accent pe linii curate, muchii și elemente de fixare discrete.' },
    ],
    'reparatii-mentenanta': [
      { q: 'În cât timp interveniți?', a: 'Depinde de locație și urgență; confirmăm rapid disponibilitatea.' },
      { q: 'Reparați și lucrări făcute de alții?', a: 'Da, după evaluare și dacă soluția este tehnic corectă.' },
      { q: 'Ce include un plan de mentenanță?', a: 'Inspecții periodice, checklist, recomandări și intervenții prioritizate.' },
    ],
  }

  const pages = [
    {
      path: '/contact',
      title: 'Contact — Solaris Engineering',
      description: 'Contact Solaris Engineering pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Contact Solaris Engineering',
      bodyLines: ['Instalații fotovoltaice, acoperișuri (tablă/țiglă/TPO), reparații și mentenanță în Vaslui și în toată România.'],
      jsonLd: wrapJsonLd([
        localBusiness,
        {
          '@type': 'ContactPage',
          name: 'Contact Solaris Engineering',
          url: `${origin}/contact/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]),
      ]),
    },
    {
      path: '/servicii',
      title: 'Servicii — Solaris Engineering',
      description: 'Servicii Solaris Engineering: fotovoltaice, acoperișuri, atice/fațade tablă, reparații și mentenanță.',
      h1: 'Servicii Solaris Engineering',
      bodyLines: ['Alege serviciul potrivit: fotovoltaice rezidențiale/industriale, acoperișuri, atice/fațade, reparații și mentenanță.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'ItemList',
          name: 'Servicii Solaris Engineering',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Fotovoltaice rezidențiale', url: `${origin}/servicii/fotovoltaice-rezidentiale/` },
            { '@type': 'ListItem', position: 2, name: 'Fotovoltaice industriale', url: `${origin}/servicii/fotovoltaice-industriale/` },
            { '@type': 'ListItem', position: 3, name: 'Acoperișuri tablă/țiglă', url: `${origin}/servicii/acoperisuri-tabla-tigla/` },
            { '@type': 'ListItem', position: 4, name: 'Acoperișuri industriale TPO', url: `${origin}/servicii/acoperisuri-industriale-tpo/` },
            { '@type': 'ListItem', position: 5, name: 'Atice și fațade tablă', url: `${origin}/servicii/atice-fatade-tabla/` },
            { '@type': 'ListItem', position: 6, name: 'Reparații și mentenanță', url: `${origin}/servicii/reparatii-mentenanta/` },
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
      title: 'Instalații Fotovoltaice Rezidențiale — Solaris CET',
      description: 'Instalații fotovoltaice pentru case: panouri, invertor, baterii, monitorizare.',
      h1: 'Instalații Fotovoltaice Rezidențiale — Vaslui și împrejurimi',
      bodyLines: ['Panouri mono/poli/bifacial, invertoare, baterii de stocare și monitorizare producție/consum.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Instalații fotovoltaice rezidențiale',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/fotovoltaice-rezidentiale/`,
        },
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
      title: 'Sisteme Fotovoltaice Industriale — Solaris CET',
      description: 'Sisteme fotovoltaice pentru hale și clădiri comerciale: proiectare, montaj, optimizare ROI.',
      h1: 'Sisteme Fotovoltaice Industriale — Hale și clădiri comerciale',
      bodyLines: ['Sisteme peste 100 kW, soluții pentru consum mare, optimizare și planificare ROI.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Sisteme fotovoltaice industriale',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/fotovoltaice-industriale/`,
        },
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
      title: 'Montaj Acoperișuri Tablă și Țiglă Metalică — Solaris CET',
      description: 'Montaj acoperișuri tablă/țiglă metalică: sisteme pluviale, parazăpezi, etanșări.',
      h1: 'Montaj Acoperișuri Tablă și Țiglă Metalică — Vaslui, Bacău, Iași',
      bodyLines: ['Tablă click/falțuită, țiglă metalică, sisteme pluviale și parazăpezi.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Acoperișuri tablă / țiglă',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/acoperisuri-tabla-tigla/`,
        },
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
      title: 'Acoperișuri Industriale Folie TPO — Solaris CET',
      description: 'Membrană TPO pentru hale și depozite: detalii tehnice, durabilitate, execuție.',
      h1: 'Acoperișuri Industriale Folie TPO — Hale și Depozite',
      bodyLines: ['Specificații TPO, avantaje și detalii de execuție pentru durabilitate 20+ ani.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Acoperișuri industriale TPO',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/acoperisuri-industriale-tpo/`,
        },
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
      path: '/servicii/atice-fatade-tabla',
      title: 'Atice și Fațade din Tablă — Solaris CET',
      description: 'Atice și fațade din tablă: finisaje moderne, culori RAL, execuție curată.',
      h1: 'Atice și Fațade din Tablă — Finisaje moderne',
      bodyLines: ['Tipuri tablă fațadă, culori RAL disponibile și execuție cu detalii curate.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Atice și fațade tablă',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/atice-fatade-tabla/`,
        },
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['atice-fatade-tabla'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Atice și fațade tablă', path: '/servicii/atice-fatade-tabla' },
        ]),
      ]),
    },
    {
      path: '/servicii/reparatii-mentenanta',
      title: 'Reparații și Mentenanță Acoperiș — Solaris CET',
      description: 'Reparații acoperiș: infiltrații, jgheaburi, curățare și inspecție anuală.',
      h1: 'Reparații și Mentenanță Acoperiș — Intervenții rapide',
      bodyLines: ['Hidroizolații, înlocuire jgheaburi, curățare, inspecție anuală și intervenții rapide.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Reparații și mentenanță',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/reparatii-mentenanta/`,
        },
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaq['reparatii-mentenanta'].map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Servicii', path: '/servicii' },
          { name: 'Reparații și mentenanță', path: '/servicii/reparatii-mentenanta' },
        ]),
      ]),
    },
    {
      path: '/despre',
      title: 'Despre — Solaris CET',
      description: 'Echipă locală pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Despre Solaris CET',
      bodyLines: ['Lucrări complete pentru fotovoltaice și acoperișuri, cu acoperire în mai multe județe.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'AboutPage',
          name: 'Despre Solaris CET',
          url: `${origin}/despre/`,
        },
        localBusiness,
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Despre', path: '/despre' },
        ]),
      ]),
    },
    {
      path: '/portofoliu',
      title: 'Portofoliu — Solaris CET',
      description: 'Portofoliu proiecte: fotovoltaice, acoperișuri, fațade și lucrări diverse.',
      h1: 'Portofoliu Solaris CET',
      bodyLines: ['Exemple de lucrări (placeholder) până la încărcarea pozelor reale din proiecte.'],
      jsonLd: wrapJsonLd([
        {
          '@type': 'CollectionPage',
          name: 'Portofoliu Solaris CET',
          url: `${origin}/portofoliu/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Portofoliu', path: '/portofoliu' },
        ]),
      ]),
    },
  ]

  for (const p of pages) {
    const outDir = path.join(publicDir, normalizePath(p.path).replace(/^\//, ''), 'index.html')
    await fs.mkdir(path.dirname(outDir), { recursive: true })
    const html = renderStaticPageHtml({
      title: p.title,
      description: p.description,
      canonicalPath: `${p.path}/`,
      h1: p.h1,
      bodyLines: p.bodyLines,
      jsonLd: p.jsonLd,
    })
    await fs.writeFile(outDir, html, 'utf8')
  }
}

async function writeSitemap() {
  const today = stableBuildDate()
  const urls = []

  const staticPages = [
    '/',
    '/servicii',
    '/servicii/fotovoltaice-rezidentiale',
    '/servicii/fotovoltaice-industriale',
    '/servicii/acoperisuri-tabla-tigla',
    '/servicii/acoperisuri-industriale-tpo',
    '/servicii/atice-fatade-tabla',
    '/servicii/reparatii-mentenanta',
    '/contact',
    '/despre',
    '/portofoliu',
    '/vaslui',
    '/bacau',
    '/iasi',
    '/galati',
    '/politica-cookies',
    '/politica-confidentialitate',
  ]
  for (const p of staticPages) {
    urls.push({ loc: `${origin}${normalizePath(p)}`, lastmod: today })
  }

  const staticGlobal = [
    { path: '/llms.txt', lastmod: today },
    { path: '/humans.txt', lastmod: today },
    { path: '/.well-known/security.txt', lastmod: today },
  ]
  for (const u of staticGlobal) {
    urls.push({ loc: `${origin}${normalizePath(u.path)}`, lastmod: u.lastmod })
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
      .join('\n') +
    `\n</urlset>\n`

  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8')
}

async function writeRobots() {
  const disallowLines = [`Disallow: /api/`, `Disallow: /_next/`]

  const txt = [
    `User-agent: *`,
    `Allow: /`,
    ...disallowLines,
    ``,
    `# llms.txt: ${origin}/llms.txt`,
    `# humans.txt: ${origin}/humans.txt`,
    `# security.txt: ${origin}/.well-known/security.txt`,
    ``,
    `Sitemap: ${origin}/sitemap.xml`,
    ``,
  ].join('\n')
  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'robots.txt'), txt, 'utf8')
}

await Promise.all([writeStaticPages(), writeSitemap(), writeRobots()])
