import { ArrowLeft, Calendar, MessageCircle, Share2, Tag } from 'lucide-react'
import { useMemo } from 'react'

import AppImage from '@/components/AppImage'
import { SolarisFooter } from '@/components/company/SolarisFooter'
import { CopyButton } from '@/components/CopyButton'
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
import { type BlogLocale, getBlogPost, listBlogPosts, normalizeTag } from '@/lib/blog'
import { cn } from '@/lib/utils'

function asBlogLocale(locale: UrlLocale): BlogLocale {
  return locale === 'ro' || locale === 'es' ? locale : 'en'
}

function activeLocaleFromUrl(fallback: UrlLocale): BlogLocale {
  if (typeof window === 'undefined') return asBlogLocale(fallback)
  const parsed = parseUrlLocaleFromPathname(window.location.pathname)
  if (parsed.locale) return asBlogLocale(parsed.locale)
  return window.location.pathname.startsWith('/blog') ? 'ro' : asBlogLocale(fallback)
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
  const otherPosts = useMemo(() => {
    return listBlogPosts(locale)
      .filter((p) => p.slug !== slug)
      .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
      .slice(0, 3)
  }, [locale, slug])

  if (!post) {
    return (
      <>
        <main id="main-content" className="relative z-10 w-full px-5 sm:px-8 xl:px-12 pt-28 pb-20">
          <div className="max-w-4xl mx-auto bento-card p-8 border border-white/10" data-reveal-stagger>
            <div className="text-solaris-text font-semibold">{t.blog.notFoundTitle}</div>
            <div className="text-solaris-muted text-sm mt-1">{t.blog.notFoundBody}</div>
            <a href={blogHref} className="btn-filled-gold mt-4 inline-flex">
              {t.blog.backToBlog}
            </a>
          </div>
        </main>
        <SolarisFooter />
      </>
    )
  }

  const coverIsIllustration = Boolean(post.frontmatter.coverImageUrl?.includes('text_to_image'))

  return (
    <>
    <main id="main-content" className="relative z-10 w-full px-5 sm:px-8 xl:px-12 pt-28 pb-20">
      {post && (
        <>
          <script type="application/ld+json">
            {JSON.stringify(post.schema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Acasă', item: 'https://solaris-cet.com/' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://solaris-cet.com/blog/' },
                { '@type': 'ListItem', position: 3, name: post.frontmatter.title, item: `https://solaris-cet.com/blog/${post.slug}` },
              ],
            })}
          </script>
        </>
      )}
      <div className="max-w-7xl mx-auto">
      <div className="mb-6" data-reveal>
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
        data-reveal
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {t.blog.backToBlog}
      </a>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <article className="lg:col-span-8">
          <header data-reveal-stagger>
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-solaris-muted">
                <li><a href="/" className="hover:text-solar-yellow">Acasă</a></li>
                <li aria-hidden="true">/</li>
                <li><a href="/blog" className="hover:text-solar-yellow">Blog</a></li>
                <li aria-hidden="true">/</li>
                <li className="text-white/80" aria-current="page">{post.frontmatter.title}</li>
              </ol>
            </nav>
            <h1 className="font-display text-4xl md:text-5xl text-solaris-text tracking-tight">{post.frontmatter.title}</h1>
            <p className="mt-3 text-solaris-muted">{post.frontmatter.description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted">
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                <span>{post.frontmatter.date}</span>
              </div>
              {post.frontmatter.category ? <Badge variant="secondary">{post.frontmatter.category}</Badge> : null}
              {post.readingTime ? (
                <span className="text-[11px] font-mono text-solaris-muted">⏱️ {post.readingTime} min citit</span>
              ) : null}
              {post.frontmatter.author ? (
                <span className="text-[11px] font-mono text-solaris-muted">• {post.frontmatter.author}</span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {typeof window !== 'undefined' ? (
                <>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${post.frontmatter.title} — ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-colors"
                    aria-label="Share pe WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-colors"
                    aria-label="Share pe Facebook"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    Facebook
                  </a>
                  <CopyButton text={window.location.href} ariaLabel="Copiază link" />
                </>
              ) : null}
            </div>

            {post.frontmatter.coverImageUrl ? (
              <div className="mt-8 rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative">
                <AppImage
                  src={post.frontmatter.coverImageUrl}
                  alt={post.frontmatter.title}
                  width={1600}
                  height={1200}
                  loading="lazy"
                  className="w-full h-auto"
                />
                {coverIsIllustration ? (
                  <span className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-bold tracking-wide text-white/80 backdrop-blur">
                    Ilustrație reprezentativă
                  </span>
                ) : null}
              </div>
            ) : null}

            {(post.frontmatter.tags?.length ?? 0) > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
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

            {/* Share buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.frontmatter.title} — ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-colors"
                aria-label="Share pe WhatsApp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:border-white/20 transition-colors"
                aria-label="Share pe Facebook"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Facebook
              </a>
              <CopyButton text={window.location.href} ariaLabel="Copiază link" />
            </div>
          </header>

          <div className="mt-10" data-reveal>
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
          </div>
        </article>

        {/* Related articles */}
        {otherPosts.length > 0 && (
          <div className="mt-12" data-reveal>
            <h2 className="text-2xl font-bold text-white mb-6">Articole similare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPosts.map((p) => (
                <a
                  key={`${p.locale}:${p.slug}`}
                  href={localizePathname(`/blog/${p.slug}`, locale)}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-solaris-gold/30 transition-colors"
                >
                  <div className="text-[11px] font-mono text-solaris-muted">{p.frontmatter.date}</div>
                  <div className="mt-2 text-sm font-semibold text-solaris-text leading-snug">{p.frontmatter.title}</div>
                  <p className="mt-2 text-xs text-solaris-muted line-clamp-2">{p.excerpt}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-4" data-reveal-stagger>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="text-solaris-text font-semibold">Solicită ofertă gratuită</div>
              <div className="mt-1 text-solaris-muted text-sm">Vă contactăm în 24 de ore cu pașii următori.</div>
              <a href={localizePathname('/contact', locale)} className="btn-filled-gold mt-4 inline-flex w-full justify-center">
                {t.nav.requestOffer}
              </a>
              <a href={localizePathname('/calculator', locale)} className="btn-outline-white mt-3 inline-flex w-full justify-center">
                Deschide calculatorul
              </a>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-solaris-text font-semibold">Alte articole</div>
              <div className="mt-4 grid gap-3" data-reveal-stagger>
                {otherPosts.map((p) => (
                  <a
                    key={`${p.locale}:${p.slug}`}
                    href={localizePathname(`/blog/${p.slug}`, locale)}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-solaris-gold/30 transition-colors"
                  >
                    <div className="text-[11px] font-mono text-solaris-muted">{p.frontmatter.date}</div>
                    <div className="mt-1 text-sm font-semibold text-solaris-text leading-snug">{p.frontmatter.title}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </main>
    <SolarisFooter />
    </>
  )
}
