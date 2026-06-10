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

  const contactDetailsHtml = `
          ${contactFormHtml}
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Program și zonă de deplasare</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><strong>Program:</strong> Luni–Vineri 08:00–18:00 · Sâmbătă 09:00–14:00</li>
              <li><strong>Adresă operațională:</strong> Cetățuia, Vaslui, 737429, România</li>
              <li><strong>Acoperire:</strong> Vaslui, Moldova și proiecte selectate la nivel național</li>
              <li><strong>Canale rapide:</strong> telefon, WhatsApp și email direct, chiar dacă browserul blochează formularul</li>
            </ul>
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
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>PV industrial — Iași</strong>
                <p style="margin:8px 0 0;">Execuție etapizată pentru hală logistică, cu acces controlat și verificări finale înainte de predare.</p>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Membrană TPO — Bacău</strong>
                <p style="margin:8px 0 0;">Reparație și refacere detalii la atice, scurgeri și străpungeri pentru eliminarea infiltrațiilor recurente.</p>
              </div>
              <div style="border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:14px; background:rgba(255,255,255,.03);">
                <strong>Tablă click — Suceava</strong>
                <p style="margin:8px 0 0;">Acoperiș cu geometrie complexă, finisaje curate și drenaj corect la muchii și racorduri.</p>
              </div>
            </div>
            <p style="margin-top:12px; font-size:13px; color:rgba(255,255,255,.68);">Pentru portofoliul complet, varianta interactivă cu galerie și filtre rămâne disponibilă când JavaScript este activ.</p>
          </div>
  `

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
              <li>Pentru cereri GDPR scrie la <a href="mailto:solaris-cet@protonmail.com">solaris-cet@protonmail.com</a>.</li>
              <li>Poți depune plângere la <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener noreferrer">ANSPDCP</a>.</li>
            </ul>
          </div>
  `

  const cookieSettingsStaticHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Salvează preferințele cookie fără JavaScript</h2>
            <p style="margin:0 0 10px; color: rgba(255,255,255,.82);">Formularele de mai jos salvează preferințele în browser printr-un cookie de consimțământ.</p>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
              <form action="/privacy-settings/save" method="get" style="margin:0;">
                <input type="hidden" name="preset" value="accept_all" />
                <button type="submit" style="cursor:pointer; border-radius:12px; border:1px solid rgba(245,158,11,.45); background:rgba(245,158,11,.14); color:#fbbf24; font-weight:900; padding:12px 14px;">Acceptă tot</button>
              </form>
              <form action="/privacy-settings/save" method="get" style="margin:0;">
                <input type="hidden" name="preset" value="essential_only" />
                <button type="submit" style="cursor:pointer; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff; font-weight:800; padding:12px 14px;">Doar necesare</button>
              </form>
            </div>
            <form action="/privacy-settings/save" method="get" style="margin-top:12px; display:grid; gap:10px;">
              <label style="display:flex; gap:10px; align-items:flex-start;">
                <input type="checkbox" name="analytics" value="1" style="margin-top:4px;" />
                <span><strong>Cookie-uri analitice</strong><br /><span style="color:rgba(255,255,255,.7);">Măsoară vizite și comportament pentru îmbunătățirea site-ului.</span></span>
              </label>
              <label style="display:flex; gap:10px; align-items:flex-start;">
                <input type="checkbox" name="marketing" value="1" style="margin-top:4px;" />
                <span><strong>Cookie-uri marketing</strong><br /><span style="color:rgba(255,255,255,.7);">Folosite doar dacă decidem să măsurăm campanii sau surse comerciale.</span></span>
              </label>
              <button type="submit" style="cursor:pointer; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff; font-weight:800; padding:12px 14px;">Salvează selecția</button>
            </form>
          </div>
  `

  const cookiesOverviewHtml = `
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Categorii de cookie-uri</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li><strong>Strict necesare</strong> — țin site-ul funcțional și sigur; nu pot fi dezactivate din produs.</li>
              <li><strong>Analitice</strong> — active doar dacă îți dai acordul.</li>
              <li><strong>Marketing</strong> — active doar dacă îți dai acordul.</li>
            </ul>
          </div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Durată și control</h2>
            <p style="margin:0; color: rgba(255,255,255,.82);">Consimțământul este reținut local în browser pentru a nu te întreba la fiecare vizită. Îl poți modifica oricând din Setări cookie.</p>
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
            <p style="margin:0 0 10px; color: rgba(255,255,255,.82);">Această pagină oferă două lucruri: controlul consimțământului pentru cookie-uri și puncte clare pentru cereri GDPR.</p>
          </div>
          ${cookieSettingsStaticHtml}
          <div style="margin-top: 14px;">
            <h2 style="font-size: 18px; margin: 0 0 10px;">Cereri GDPR</h2>
            <ul style="margin: 0; padding-left: 18px; color: rgba(255,255,255,.82);">
              <li>Pentru acces, rectificare, ștergere sau portabilitate: <a href="mailto:solaris-cet@protonmail.com?subject=Cerere%20GDPR%20%E2%80%94%20Solaris%20CET">trimite email</a>.</li>
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
    'reparatii-si-mentenanta': [
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
      extraHtml: contactDetailsHtml,
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
      path: '/servicii/reparatii-si-mentenanta',
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
          url: `${origin}/servicii/reparatii-si-mentenanta/`,
        },
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
        },
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
      title: 'Setări cookie și cereri GDPR — Solaris CET',
      description: 'Controlează preferințele cookie și vezi pașii clari pentru cereri GDPR, inclusiv fără JavaScript.',
      h1: 'Setări cookie și confidențialitate',
      bodyLines: [
        'Poți salva preferințele pentru cookie-uri și poți găsi aici pașii pentru cereri GDPR chiar și în modul fără JavaScript.',
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
    '/proiecte',
    '/servicii/fotovoltaice-rezidentiale',
    '/servicii/fotovoltaice-industriale',
    '/servicii/acoperisuri-tabla-tigla',
    '/servicii/acoperisuri-industriale-tpo',
    '/servicii/atice-si-fatade-tabla',
    '/servicii/reparatii-si-mentenanta',
    '/contact',
    '/privacy-settings',
    '/calculator',
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
