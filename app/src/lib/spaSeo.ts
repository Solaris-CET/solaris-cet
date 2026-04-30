import { localizePathname, shouldLocalePrefixPathname,URL_LOCALES, type UrlLocale } from '@/i18n/urlRouting'

export type SpaSeoConfig = {
  origin: string
  pathnameNoLocale: string
  locale: UrlLocale
  title: string
  description: string
  keywords?: string
  ogType?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: unknown
}

function normalizePath(pathname: string): string {
  const raw = pathname.replace(/\/$/, '') || '/'
  return raw === '/index.html' ? '/' : raw
}

function setMeta(selector: string, content: string) {
  const el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) return
  el.setAttribute('content', content)
}

function setLink(selector: string, href: string) {
  const el = document.querySelector(selector) as HTMLLinkElement | null
  if (!el) return
  el.setAttribute('href', href)
}

function upsertMetaRobots(noindex: boolean) {
  const selector = 'meta[name="robots"]'
  const el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) return
  el.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow')
}

function upsertJsonLd(id: string, payload: unknown) {
  const existing = document.getElementById(id)
  if (payload == null) {
    if (existing) existing.remove()
    return
  }
  const script = existing ?? document.createElement('script')
  script.id = id
  script.setAttribute('type', 'application/ld+json')
  const nonce = document.querySelector('script[nonce]')?.getAttribute('nonce')
  if (nonce) script.setAttribute('nonce', nonce)
  script.textContent = JSON.stringify(payload)
  if (!existing) document.head.appendChild(script)
}

export function applySpaSeo(config: SpaSeoConfig) {
  const pathnameNoLocale = normalizePath(config.pathnameNoLocale)
  const prefix = shouldLocalePrefixPathname(pathnameNoLocale)
  const canonicalPath = prefix ? localizePathname(pathnameNoLocale, config.locale) : pathnameNoLocale
  const absoluteUrl = `${config.origin}${canonicalPath === '/' ? '' : canonicalPath}`
  const ogType = config.ogType ?? 'website'

  document.title = config.title
  setMeta('meta[name="title"]', config.title)
  setMeta('meta[name="description"]', config.description)
  if (typeof config.keywords === 'string' && config.keywords.trim()) {
    setMeta('meta[name="keywords"]', config.keywords.trim())
  }
  setMeta('meta[property="og:url"]', absoluteUrl)
  setMeta('meta[property="og:type"]', ogType)
  setMeta('meta[property="og:title"]', config.title)
  setMeta('meta[property="og:description"]', config.description)
  const ogLocale =
    config.locale === 'ro'
      ? 'ro_RO'
      : config.locale === 'es'
        ? 'es_ES'
        : 'en_US'
  setMeta('meta[property="og:locale"]', ogLocale)
  setMeta('meta[name="twitter:url"]', absoluteUrl)
  setMeta('meta[name="twitter:title"]', config.title)
  setMeta('meta[name="twitter:description"]', config.description)
  setLink('link[rel="canonical"]', absoluteUrl)
  upsertMetaRobots(Boolean(config.noindex))

  for (const l of URL_LOCALES) {
    const localized = prefix ? localizePathname(pathnameNoLocale, l) : pathnameNoLocale
    setLink(`#hreflang-${l}`, `${config.origin}${localized === '/' ? '' : localized}`)
  }
  const xDefault = prefix ? localizePathname(pathnameNoLocale, 'en') : pathnameNoLocale
  setLink('#hreflang-x-default', `${config.origin}${xDefault === '/' ? '' : xDefault}`)

  upsertJsonLd('spa-jsonld', config.jsonLd ?? null)
}
