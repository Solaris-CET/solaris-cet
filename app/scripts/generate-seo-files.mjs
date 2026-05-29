import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import path from 'node:path'

const appRoot = process.cwd()
const publicDir = path.join(appRoot, 'public')

const origin = String(process.env.VITE_PUBLIC_SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '')
const locales = ['en', 'es', 'zh', 'ru', 'ro', 'pt', 'de']

function normalizePath(p) {
  if (!p) return '/'
  const withSlash = p.startsWith('/') ? p : `/${p}`
  const cleaned = withSlash.replace(/\/+/g, '/')
  if (cleaned === '/index.html') return '/'
  return cleaned
}

function localizePath(p, locale) {
  const pathname = normalizePath(p)
  if (pathname === '/') return `/${locale}/`
  return `/${locale}${pathname}`
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

async function writeSitemap() {
  const today = stableBuildDate()
  const staticLocalized = [
    { path: '/', lastmod: today },
    { path: '/about', lastmod: today },
    { path: '/faq', lastmod: today },
    { path: '/servicii', lastmod: today },
    { path: '/contact', lastmod: today },
    { path: '/token-cet', lastmod: today },
    { path: '/privacy', lastmod: today },
    { path: '/terms', lastmod: today },
    { path: '/cookies', lastmod: today },
  ]
  const urls = []

  for (const { path: p, lastmod } of staticLocalized) {
    for (const locale of locales) {
      urls.push({ loc: `${origin}${localizePath(p, locale)}`, lastmod })
    }
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
  const disallowGlobalPrefixes = ['/api/']

  const disallowLocalizedPrefixes = [
    '/admin',
    '/console',
    '/docs',
    '/developers',
    '/login',
    '/auth',
    '/app',
    '/wallet',
    '/nfts',
    '/airdrop',
    '/staking',
    '/tx-history',
    '/settings',
    '/privacy-settings',
    '/share',
    '/lp/',
    '/newsletter/confirm',
    '/newsletter/verify',
    '/newsletter/unsubscribe',
    '/prelaunch',
    '/thanks',
  ]

  const disallowLines = []

  for (const p of disallowGlobalPrefixes) {
    disallowLines.push(`Disallow: ${normalizePath(p)}`)
  }

  for (const locale of locales) {
    for (const p of disallowLocalizedPrefixes) {
      disallowLines.push(`Disallow: ${localizePath(p, locale)}`)
    }
  }

  const txt = [
    `User-agent: *`,
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

await Promise.all([writeSitemap(), writeRobots()])
