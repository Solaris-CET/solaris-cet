import { useMemo } from 'react'

import { SafeHtml } from '@/components/SafeHtml'
import { useLanguage } from '@/hooks/useLanguage'
import { localizePathname, parseUrlLocaleFromPathname, type UrlLocale, urlLocaleFromLang } from '@/i18n/urlRouting'
import { getLegalDoc, type LegalDocKey, type LegalLocale } from '@/lib/legal'
import { cn } from '@/lib/utils'

function activeLocaleFromUrl(fallback: UrlLocale): LegalLocale {
  if (typeof window === 'undefined') return fallback as LegalLocale
  const parsed = parseUrlLocaleFromPathname(window.location.pathname)
  return (parsed.locale ?? fallback) as LegalLocale
}

const MARKDOWN_HTML_CONFIG = {
  kind: 'limited' as const,
  allowedTags: [
    'p',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'a',
    'code',
    'pre',
    'blockquote',
    'hr',
    'br',
  ],
  allowedAttributes: ['href', 'target', 'rel'],
}

export default function LegalDocPage({ doc }: { doc: LegalDocKey }) {
  const { lang, t } = useLanguage()
  const fallbackLocale = urlLocaleFromLang(lang)
  const locale = activeLocaleFromUrl(fallbackLocale)

  const content = useMemo(() => getLegalDoc(locale, doc), [locale, doc])
  const homeHref = localizePathname('/', locale)

  return (
    <main id="main-content" className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-28 pb-20">
      <a href={homeHref} className="text-sm text-solaris-muted hover:text-solaris-text transition-colors">
        {t.nav.home}
      </a>
      <header className="mt-6">
        <h1 className="font-display text-3xl md:text-4xl text-solaris-text tracking-tight">{content.frontmatter.title}</h1>
        {content.frontmatter.description ? <p className="mt-3 text-solaris-muted">{content.frontmatter.description}</p> : null}
        {content.frontmatter.lastUpdated ? (
          <div className="mt-4 text-[11px] font-mono text-solaris-muted">Last updated: {content.frontmatter.lastUpdated}</div>
        ) : null}
      </header>

      <article className="mt-10">
        <SafeHtml
          html={content.html}
          config={MARKDOWN_HTML_CONFIG}
          className={cn(
            'prose prose-invert max-w-none',
            'prose-p:text-solaris-muted prose-a:text-solaris-cyan prose-strong:text-solaris-text',
            'prose-code:text-solaris-text prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10',
            'prose-blockquote:border-l-solaris-gold/40',
          )}
        />
      </article>
    </main>
  )
}
