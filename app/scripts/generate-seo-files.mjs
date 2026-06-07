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

function renderStaticPageHtml({ title, description, canonicalPath, h1, bodyLines, jsonLd, noindex, redirectTo, extraHtml }) {
  const canonical = `${origin}${normalizePath(canonicalPath)}`
  const metaDesc = escapeHtml(description)
  const metaTitle = escapeHtml(title)
  const metaH1 = escapeHtml(h1)
  const body = bodyLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n')
  const extra = typeof extraHtml === 'string' && extraHtml.trim() ? `\n${extraHtml.trim()}\n` : '\n'
  const jsonLdBlock = jsonLd
    ? `\n    <script type="application/ld+json">${safeJsonLd(jsonLd)}</script>\n`
    : '\n'
  const robotsMeta = noindex ? `    <meta name="robots" content="noindex,follow" />\n` : ''
  const redirectMeta = redirectTo ? `    <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectTo)}" />\n` : ''
  const redirectBody = redirectTo
    ? `<p><strong>Redirecționare:</strong> această pagină s-a mutat la <a href="${escapeHtml(redirectTo)}">${escapeHtml(
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
          ${redirectBody}
          ${body}
          ${extra}
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
  const formspreeEndpoint = String(process.env.VITE_FORMSPREE_ENDPOINT || '').trim()

  const contactFormHtml = (() => {
    const action = formspreeEndpoint || 'mailto:solaris-cet@protonmail.com'
    const enctype = formspreeEndpoint ? 'application/x-www-form-urlencoded' : 'text/plain'
    const method = formspreeEndpoint ? 'POST' : 'POST'
    const hidden = formspreeEndpoint
      ? `<input type="hidden" name="_subject" value="Solicitare ofertă — Solaris CET" />`
      : `<input type="hidden" name="subject" value="Solicitare ofertă — Solaris CET" />`

    return `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cere ofertă (formular)</h2>
            <form action="${escapeHtml(action)}" method="${method}" enctype="${enctype}">
              ${hidden}
              <div style="display:grid; gap:10px;">
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Nume</div>
                  <input name="name" required style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Telefon</div>
                  <input name="phone" inputmode="tel" required style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Email (opțional)</div>
                  <input name="email" inputmode="email" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;" />
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Serviciu</div>
                  <select name="service" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;">
                    <option value="fotovoltaice">Fotovoltaice</option>
                    <option value="acoperisuri">Acoperișuri tablă/țiglă</option>
                    <option value="tpo">Acoperișuri industriale TPO</option>
                    <option value="atice-fatade">Atice & fațade tablă</option>
                    <option value="reparatii">Reparații & mentenanță</option>
                  </select>
                </label>
                <label>
                  <div style="font-size:12px; color: rgba(255,255,255,.72); font-weight:700; margin-bottom:6px;">Detalii</div>
                  <textarea name="message" rows="5" required style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; padding:12px 12px;"></textarea>
                </label>
                <button type="submit" style="cursor:pointer; border-radius:12px; border:1px solid rgba(245,158,11,.45); background:rgba(245,158,11,.14); color:#fbbf24; font-weight:900; padding:12px 12px;">Trimite</button>
              </div>
              <div style="margin-top:10px; font-size:12px; color: rgba(255,255,255,.65);">
                Dacă trimiterea nu funcționează, folosește <a href="mailto:solaris-cet@protonmail.com">email</a> sau <a href="tel:+40769889721">telefon</a>.
              </div>
            </form>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Hartă</h2>
            <div style="border-radius: 14px; overflow:hidden; border:1px solid rgba(255,255,255,.12);">
              <iframe title="Hartă Vaslui, România" src="https://www.google.com/maps?q=Vaslui%2C%20Romania&output=embed" loading="lazy" referrerpolicy="no-referrer" style="width:100%; height:260px; border:0;"></iframe>
            </div>
          </div>
    `
  })()

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
    'atice-si-fatade-tabla': [
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
      title: 'Contact — Solaris CET',
      description: 'Contact Solaris CET pentru fotovoltaice, acoperișuri, reparații și mentenanță.',
      h1: 'Contact Solaris CET',
      bodyLines: ['Instalații fotovoltaice, acoperișuri (tablă/țiglă/TPO), reparații și mentenanță în Vaslui și în toată România.'],
      extraHtml: contactFormHtml,
      jsonLd: wrapJsonLd([
        localBusiness,
        {
          '@type': 'ContactPage',
          name: 'Contact Solaris CET',
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
      title: 'Servicii — Solaris CET',
      description: 'Servicii Solaris CET: fotovoltaice, acoperișuri, atice/fațade tablă, reparații și mentenanță.',
      h1: 'Servicii Solaris CET',
      bodyLines: [
        'Alege serviciul potrivit: fotovoltaice rezidențiale/industriale, acoperișuri, atice/fațade, reparații și mentenanță.',
        'Lucrăm pe baza unei evaluări tehnice (telefon + poze, apoi vizită după caz), ofertă clară și execuție cu detalii curate.',
        'Pentru ofertă: locație, tip acoperiș/structură, consum (facturi) și termenul dorit.',
      ],
      jsonLd: wrapJsonLd([
        {
          '@type': 'ItemList',
          name: 'Servicii Solaris CET',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Fotovoltaice rezidențiale', url: `${origin}/servicii/fotovoltaice-rezidentiale/` },
            { '@type': 'ListItem', position: 2, name: 'Fotovoltaice industriale', url: `${origin}/servicii/fotovoltaice-industriale/` },
            { '@type': 'ListItem', position: 3, name: 'Acoperișuri tablă/țiglă', url: `${origin}/servicii/acoperisuri-tabla-tigla/` },
            { '@type': 'ListItem', position: 4, name: 'Acoperișuri industriale TPO', url: `${origin}/servicii/acoperisuri-industriale-tpo/` },
            { '@type': 'ListItem', position: 5, name: 'Atice și fațade tablă', url: `${origin}/servicii/atice-si-fatade-tabla/` },
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
      bodyLines: [
        'Instalăm sisteme fotovoltaice pentru case (3–12 kW și peste), optimizate pentru autoconsum și economie pe termen lung.',
        'Folosim proiectare orientată pe siguranță: protecții DC/AC, împământare, trasee corecte și etanșări curate pe acoperiș.',
        'Opțional: baterii de stocare, încărcător EV, monitorizare și optimizare consum.',
        'Pentru o ofertă rapidă: trimite consumul (factură), locația și câteva poze cu acoperișul.',
      ],
      extraHtml: `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Ce includem</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Dimensionare orientată pe consum + opțiuni (autoconsum vs baterie).</li>
              <li>Montaj structură + cablare + protecții + etanșări.</li>
              <li>Testare, punere în funcțiune și instruire utilizare.</li>
            </ul>
          </div>
      `,
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
      bodyLines: [
        'Sisteme fotovoltaice pentru hale și clădiri comerciale: proiectare, montaj, punere în funcțiune și monitorizare.',
        'Planificăm execuția ca să nu afecteze operațiunile: lucrări pe etape, programare, zone de siguranță și documentație.',
        'Optimizăm ROI: profil de consum, orientare, limitări de rețea și scenarii de extindere.',
        'Lucrăm și pe acoperișuri industriale cu membrană TPO, cu detalii corecte pentru durabilitate.',
      ],
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
      bodyLines: [
        'Montaj și reparații acoperișuri din tablă click/falțuită și țiglă metalică, cu detalii de finisaj curate.',
        'Rezolvăm zone critice: coame, dolii, străpungeri, atice, jgheaburi/burlane și etanșări.',
        'Lucrăm pe evaluare la fața locului (după caz) și îți recomandăm varianta potrivită pentru geometria acoperișului.',
      ],
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
      bodyLines: [
        'Montaj și reparații pentru membrane TPO la hale, depozite și clădiri comerciale.',
        'Atenție la detalii: îmbinări, colțuri, atice, scurgeri, străpungeri și treceri de instalații.',
        'Oferim inspecții periodice și intervenții rapide pentru infiltrații.',
      ],
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
      path: '/servicii/atice-si-fatade-tabla',
      title: 'Atice și Fațade din Tablă — Solaris CET',
      description: 'Atice și fațade din tablă: finisaje moderne, culori RAL, execuție curată.',
      h1: 'Atice și Fațade din Tablă — Finisaje moderne',
      bodyLines: [
        'Executăm atice și fațade din tablă pentru un aspect modern și protecție durabilă a anvelopei.',
        'Ne concentrăm pe muchii, îmbinări și fixări discrete, cu finisaje curate.',
        'Reparații punctuale sau refacere completă, în funcție de starea existentă.',
      ],
      jsonLd: wrapJsonLd([
        {
          '@type': 'Service',
          name: 'Atice și fațade tablă',
          provider: localBusiness,
          areaServed: 'RO',
          url: `${origin}/servicii/atice-si-fatade-tabla/`,
        },
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
      path: '/servicii/reparatii-mentenanta',
      title: 'Reparații și Mentenanță Acoperiș — Solaris CET',
      description: 'Reparații acoperiș: infiltrații, jgheaburi, curățare și inspecție anuală.',
      h1: 'Reparații și Mentenanță Acoperiș — Intervenții rapide',
      bodyLines: [
        'Intervenții pentru infiltrații, reparații la acoperiș, jgheaburi/burlane și mentenanță preventivă.',
        'Facem diagnostic, identificăm cauza și propunem soluții realiste (local sau etapizat).',
        'Recomandăm inspecții periodice pentru acoperișuri industriale și zonele critice (atice, scurgeri, străpungeri).',
      ],
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
      bodyLines: [
        'Selecție orientativă de lucrări reprezentative: fotovoltaice, acoperișuri și detalii de anvelopă.',
        'La cerere, îți trimitem poze reale din proiecte similare (WhatsApp) și te ajutăm să alegi soluția potrivită pentru casa/afacerea ta.',
      ],
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
      description: 'Articole utile despre fotovoltaice, acoperișuri, mentenanță și finanțare.',
      h1: 'Blog Solaris CET',
      bodyLines: [
        'Articole utile pentru clienți (fotovoltaice, acoperișuri, mentenanță și finanțare).',
        'Dacă vrei o recomandare pentru cazul tău, cere ofertă și îți răspundem cu pașii următori.',
      ],
      extraHtml: `
          <div style="margin-top: 12px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Subiecte populare</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Cum alegi puterea unui sistem (3–6 kW, 6–12 kW, hibrid).</li>
              <li>Diferența dintre autoconsum și baterie.</li>
              <li>Mentenanță: ce verifici anual la un acoperiș (tablă/țiglă/TPO).</li>
              <li>Finanțare: pași orientativi pentru programe populare.</li>
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
        title: 'DRAFT: Panouri bifaciale vs monocristaline',
      },
      {
        slug: 'mentenanta-acoperis-tpo-checklist',
        title: 'DRAFT: Mentenanța acoperișului TPO',
      },
      {
        slug: 'invertor-hibrid-baterie-cand-merita',
        title: 'DRAFT: Invertor hibrid + baterie',
      },
    ].map((x) => ({
      path: `/blog/${x.slug}`,
      title: `${x.title} — Solaris CET`,
      description: 'Articol în lucru.',
      h1: x.title,
      bodyLines: ['Acest articol este în lucru.'],
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
      extraHtml: `
          <div style="margin-top: 12px;">
            <p><a href="/privacy-settings/">Setări cookie →</a></p>
          </div>
      `,
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
      jsonLd: wrapJsonLd([
        { '@type': 'WebPage', name: 'Termeni și condiții', url: `${origin}/terms/` },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: 'Termeni', path: '/terms' },
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
          provider: localBusiness,
          url: `${origin}/${x.slug}/`,
        },
        breadcrumb([
          { name: 'Acasă', path: '/' },
          { name: x.city, path: `/${x.slug}` },
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
      jsonLd: p.jsonLd,
      noindex: Boolean(p.noindex),
      redirectTo: p.redirectTo,
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
    '/servicii/atice-si-fatade-tabla',
    '/servicii/reparatii-mentenanta',
    '/contact',
    '/despre',
    '/portofoliu',
    '/faq',
    '/blog',
    '/blog/cat-costa-un-sistem-fotovoltaic-2026',
    '/blog/mentenanta-panouri-fotovoltaice',
    '/blog/tabla-click-vs-tigla-metalica',
    '/blog/tpo-vs-membrana-clasica',
    '/blog/cum-accesezi-programul-casa-verde',
    '/privacy',
    '/terms',
    '/cookies',
    '/vaslui',
    '/bacau',
    '/iasi',
    '/galati',
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
