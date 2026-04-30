import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { useMemo } from 'react'

import { SafeHtml } from '@/components/SafeHtml'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useLanguage } from '@/hooks/useLanguage'
import {
  localizePathname,
  parseUrlLocaleFromPathname,
  type UrlLocale,
  urlLocaleFromLang,
} from '@/i18n/urlRouting'
import { type BlogLocale,getBlogPost, normalizeTag } from '@/lib/blog'
import { cn } from '@/lib/utils'

function asBlogLocale(locale: UrlLocale): BlogLocale {
  return locale === 'ro' || locale === 'es' ? locale : 'en'
}

function activeLocaleFromUrl(fallback: UrlLocale): BlogLocale {
  if (typeof window === 'undefined') return asBlogLocale(fallback)
  const parsed = parseUrlLocaleFromPathname(window.location.pathname)
  return asBlogLocale(parsed.locale ?? fallback)
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

export default function ArticlePage({ slug }: { slug: string }) {
  const { t, lang } = useLanguage()
  const fallbackLocale = urlLocaleFromLang(lang)
  const locale = activeLocaleFromUrl(fallbackLocale)

  const post = useMemo(() => getBlogPost(locale, slug), [locale, slug])
  const blogHref = localizePathname('/blog', locale)
  const homeHref = localizePathname('/', locale)

  if (!post) {
    return (
      <main id="main-content" className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="bento-card p-8 border border-white/10">
          <div className="text-solaris-text font-semibold">{t.blog.notFoundTitle}</div>
          <div className="text-solaris-muted text-sm mt-1">{t.blog.notFoundBody}</div>
          <a href={blogHref} className="btn-filled-gold mt-4 inline-flex">
            {t.blog.backToBlog}
          </a>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-28 pb-20">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={homeHref}>{t.nav.home}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={blogHref}>{t.blog.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{post.frontmatter.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <a
        href={blogHref}
        className="inline-flex items-center gap-2 text-sm text-solaris-muted hover:text-solaris-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t.blog.backToBlog}
      </a>

      <header className="mt-6">
        <h1 className="font-display text-4xl text-solaris-text tracking-tight">{post.frontmatter.title}</h1>
        <p className="mt-3 text-solaris-muted">{post.frontmatter.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            <span>{post.frontmatter.date}</span>
          </div>
          {post.frontmatter.category ? <Badge variant="secondary">{post.frontmatter.category}</Badge> : null}
        </div>

        {(post.frontmatter.tags?.length ?? 0) > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted mr-1">
              <Tag className="w-3.5 h-3.5" aria-hidden />
              <span>{t.blog.tagsLabel}</span>
            </div>
            {(post.frontmatter.tags ?? []).map((tag) => {
              const url = new URL(window.location.origin + blogHref)
              url.searchParams.set('tag', normalizeTag(tag))
              return (
                <a
                  key={tag}
                  href={url.toString().replace(window.location.origin, '')}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs transition-colors',
                    'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                  )}
                >
                  #{tag}
                </a>
              )
            })}
          </div>
        ) : null}
      </header>

      <article className="mt-10">
        <SafeHtml
          html={post.html}
          config={MARKDOWN_HTML_CONFIG}
          className={cn(
            'prose prose-invert max-w-none',
            'prose-p:text-solaris-muted prose-a:text-solaris-cyan prose-strong:text-solaris-text',
            'prose-code:text-solaris-text prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10',
            'prose-blockquote:border-l-solaris-gold/40',
          )}
        />
      </article>

      <div className="mt-12 bento-card p-6 border border-white/10">
        <div className="text-solaris-text font-semibold">{t.blog.newsletterCtaTitle}</div>
        <div className="mt-1 text-solaris-muted text-sm">{t.blog.newsletterCtaBody}</div>
        <a href={homeHref + '#footer'} className="btn-gold mt-4 inline-flex">
          {t.blog.newsletterCtaButton}
        </a>
      </div>
    </main>
  )
}
