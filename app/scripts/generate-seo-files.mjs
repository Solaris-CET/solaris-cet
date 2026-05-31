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

function renderStaticPageHtml({ title, description, canonicalPath, h1, bodyLines }) {
  const canonical = `${origin}${normalizePath(canonicalPath)}`
  const metaDesc = escapeHtml(description)
  const metaTitle = escapeHtml(title)
  const metaH1 = escapeHtml(h1)
  const body = bodyLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n')

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
          <p><a href="/contact/#oferta">Solicită ofertă →</a></p>
        </div>
      </main>
    </div>
  </body>
</html>
`
}

async function writeStaticPages() {
  const pages = [
    {
      path: '/contact',
      title: 'Contact — Solaris CET',
      description: 'Contact Solaris CET pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Contactați Solaris CET',
      bodyLines: ['Instalații fotovoltaice, acoperișuri (tablă/țiglă/TPO), reparații și mentenanță în Vaslui și în toată România.'],
    },
    {
      path: '/servicii',
      title: 'Servicii — Solaris CET',
      description: 'Servicii Solaris CET: fotovoltaice, acoperișuri, atice/fațade tablă, reparații și mentenanță.',
      h1: 'Servicii Solaris CET',
      bodyLines: ['Alege serviciul potrivit: fotovoltaice rezidențiale/industriale, acoperișuri, atice/fațade, reparații și mentenanță.'],
    },
    {
      path: '/servicii/fotovoltaice-rezidentiale',
      title: 'Instalații Fotovoltaice Rezidențiale — Solaris CET',
      description: 'Instalații fotovoltaice pentru case: panouri, invertor, baterii, monitorizare.',
      h1: 'Instalații Fotovoltaice Rezidențiale — Vaslui și împrejurimi',
      bodyLines: ['Panouri mono/poli/bifacial, invertoare, baterii de stocare și monitorizare producție/consum.'],
    },
    {
      path: '/servicii/fotovoltaice-industriale',
      title: 'Sisteme Fotovoltaice Industriale — Solaris CET',
      description: 'Sisteme fotovoltaice pentru hale și clădiri comerciale: proiectare, montaj, optimizare ROI.',
      h1: 'Sisteme Fotovoltaice Industriale — Hale și clădiri comerciale',
      bodyLines: ['Sisteme peste 100 kW, soluții pentru consum mare, optimizare și planificare ROI.'],
    },
    {
      path: '/servicii/acoperisuri-tabla-tigla',
      title: 'Montaj Acoperișuri Tablă și Țiglă Metalică — Solaris CET',
      description: 'Montaj acoperișuri tablă/țiglă metalică: sisteme pluviale, parazăpezi, etanșări.',
      h1: 'Montaj Acoperișuri Tablă și Țiglă Metalică — Vaslui, Bacău, Iași',
      bodyLines: ['Tablă click/falțuită, țiglă metalică, sisteme pluviale și parazăpezi.'],
    },
    {
      path: '/servicii/acoperisuri-industriale-tpo',
      title: 'Acoperișuri Industriale Folie TPO — Solaris CET',
      description: 'Membrană TPO pentru hale și depozite: detalii tehnice, durabilitate, execuție.',
      h1: 'Acoperișuri Industriale Folie TPO — Hale și Depozite',
      bodyLines: ['Specificații TPO, avantaje și detalii de execuție pentru durabilitate 20+ ani.'],
    },
    {
      path: '/servicii/atice-fatade-tabla',
      title: 'Atice și Fațade din Tablă — Solaris CET',
      description: 'Atice și fațade din tablă: finisaje moderne, culori RAL, execuție curată.',
      h1: 'Atice și Fațade din Tablă — Finisaje moderne',
      bodyLines: ['Tipuri tablă fațadă, culori RAL disponibile și execuție cu detalii curate.'],
    },
    {
      path: '/servicii/reparatii-mentenanta',
      title: 'Reparații și Mentenanță Acoperiș — Solaris CET',
      description: 'Reparații acoperiș: infiltrații, jgheaburi, curățare și inspecție anuală.',
      h1: 'Reparații și Mentenanță Acoperiș — Intervenții rapide',
      bodyLines: ['Hidroizolații, înlocuire jgheaburi, curățare, inspecție anuală și intervenții rapide.'],
    },
    {
      path: '/despre',
      title: 'Despre — Solaris CET',
      description: 'Echipă locală pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Despre Solaris CET',
      bodyLines: ['Lucrări complete pentru fotovoltaice și acoperișuri, cu acoperire în mai multe județe.'],
    },
    {
      path: '/portofoliu',
      title: 'Portofoliu — Solaris CET',
      description: 'Portofoliu proiecte: fotovoltaice, acoperișuri, fațade și lucrări diverse.',
      h1: 'Portofoliu Solaris CET',
      bodyLines: ['Exemple de lucrări (placeholder) până la încărcarea pozelor reale din proiecte.'],
    },
    {
      path: '/token-cet',
      title: 'Token CET — Solaris CET (BETA)',
      description: 'Informații despre tokenul utilitar CET și integrarea acestuia în ecosistemul Solaris.',
      h1: 'Token CET (BETA)',
      bodyLines: ['Tokenul CET este un activ digital experimental utilizat pentru stimularea performanței și transparenței în proiectele Solaris.'],
    },
    {
      path: '/finantare',
      title: 'Finanțare Fotovoltaice — Solaris CET',
      description: 'Ghiduri de finanțare pentru sisteme fotovoltaice: Casa Verde 2025, REPowerEU și soluții de creditare.',
      h1: 'Finanțare Sisteme Fotovoltaice',
      bodyLines: ['Oferim consultanță pentru accesarea fondurilor nerambursabile și soluții de finanțare personalizate pentru persoane fizice și companii.'],
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
    '/finantare',
    '/finantare/casa-verde-2025',
    '/finantare/repowereu',
    '/token-cet',
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
