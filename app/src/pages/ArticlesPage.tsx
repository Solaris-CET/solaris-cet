import { Calendar, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import {
  type BlogLocale,
  listBlogCategories,
  listBlogPosts,
  listBlogTags,
  normalizeTag,
} from '@/lib/blog'
import { cn } from '@/lib/utils'

function asBlogLocale(locale: UrlLocale): BlogLocale {
  return locale === 'ro' || locale === 'es' ? locale : 'en'
}

function activeLocaleFromUrl(fallback: UrlLocale): BlogLocale {
  if (typeof window === 'undefined') return asBlogLocale(fallback)
  const parsed = parseUrlLocaleFromPathname(window.location.pathname)
  return asBlogLocale(parsed.locale ?? fallback)
}

function getInitialFilters(): { tag: string; category: string } {
  if (typeof window === 'undefined') return { tag: '', category: '' }
  const url = new URL(window.location.href)
  return {
    tag: normalizeTag(url.searchParams.get('tag') ?? ''),
    category: (url.searchParams.get('category') ?? '').trim(),
  }
}

export default function ArticlesPage() {
  const { t, lang } = useLanguage()
  const fallbackLocale = urlLocaleFromLang(lang)
  const locale = activeLocaleFromUrl(fallbackLocale)

  const [filters, setFilters] = useState(getInitialFilters)

  const allPosts = useMemo(() => listBlogPosts(locale), [locale])
  const tags = useMemo(() => listBlogTags(locale), [locale])
  const categories = useMemo(() => listBlogCategories(locale), [locale])

  const filtered = useMemo(() => {
    const tag = normalizeTag(filters.tag)
    const category = filters.category.trim()
    return allPosts.filter((p) => {
      const okTag = !tag || (p.frontmatter.tags ?? []).some((x) => normalizeTag(x) === tag)
      const okCategory = !category || (p.frontmatter.category ?? '') === category
      return okTag && okCategory
    })
  }, [allPosts, filters])

  const blogHref = localizePathname('/blog', locale)

  return (
    <main id="main-content" className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-28 pb-20">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={localizePathname('/', locale)}>{t.nav.home}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.blog.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div>
          <div className="mb-7">
            <h1 className="font-display text-4xl text-solaris-text tracking-tight">{t.blog.title}</h1>
            <p className="mt-2 text-solaris-muted max-w-2xl">{t.blog.subtitle}</p>
          </div>

          {filtered.length === 0 ? (
            <div className="bento-card p-8 border border-white/10">
              <div className="text-solaris-text font-semibold">{t.blog.emptyTitle}</div>
              <div className="text-solaris-muted text-sm mt-1">{t.blog.emptyBody}</div>
              <button
                type="button"
                className="btn-gold mt-4"
                onClick={() => {
                  setFilters({ tag: '', category: '' })
                  const url = new URL(window.location.href)
                  url.searchParams.delete('tag')
                  url.searchParams.delete('category')
                  window.history.replaceState({}, '', url.toString())
                }}
              >
                {t.blog.resetFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((p) => {
                const href = localizePathname(`/blog/${p.slug}`, locale)
                return (
                  <a
                    key={`${p.locale}:${p.slug}`}
                    href={href}
                    className={cn(
                      'bento-card p-6 border border-white/10 hover:border-solaris-gold/30 transition-colors',
                      'group block',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted">
                      <Calendar className="w-3.5 h-3.5" aria-hidden />
                      <span>{p.frontmatter.date}</span>
                      {p.frontmatter.category ? (
                        <span className="ml-auto">
                          <Badge variant="secondary">{p.frontmatter.category}</Badge>
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <div className="font-display text-lg text-solaris-text group-hover:text-solaris-gold transition-colors">
                        {p.frontmatter.title}
                      </div>
                      <div className="mt-2 text-sm text-solaris-muted line-clamp-3">{p.frontmatter.description}</div>
                    </div>
                    {(p.frontmatter.tags?.length ?? 0) > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(p.frontmatter.tags ?? []).slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="border-white/10 text-solaris-muted">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <aside className="lg:pt-2">
          <div className="bento-card p-6 border border-white/10 sticky top-24">
            <div className="text-solaris-text font-semibold">{t.blog.filtersTitle}</div>

            <div className="mt-4">
              <div className="hud-label text-[10px] mb-2">{t.blog.filterCategory}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs transition-colors',
                    !filters.category
                      ? 'border-solaris-gold/40 bg-solaris-gold/10 text-solaris-gold'
                      : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                  )}
                  onClick={() => {
                    setFilters((s) => ({ ...s, category: '' }))
                    const url = new URL(window.location.href)
                    url.searchParams.delete('category')
                    window.history.replaceState({}, '', url.toString())
                  }}
                >
                  {t.blog.all}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs transition-colors',
                      filters.category === c
                        ? 'border-solaris-gold/40 bg-solaris-gold/10 text-solaris-gold'
                        : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                    )}
                    onClick={() => {
                      setFilters((s) => ({ ...s, category: c }))
                      const url = new URL(window.location.href)
                      url.searchParams.set('category', c)
                      window.history.replaceState({}, '', url.toString())
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="hud-label text-[10px] mb-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" aria-hidden />
                <span>{t.blog.filterTags}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs transition-colors',
                    !filters.tag
                      ? 'border-solaris-cyan/40 bg-solaris-cyan/10 text-solaris-cyan'
                      : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                  )}
                  onClick={() => {
                    setFilters((s) => ({ ...s, tag: '' }))
                    const url = new URL(window.location.href)
                    url.searchParams.delete('tag')
                    window.history.replaceState({}, '', url.toString())
                  }}
                >
                  {t.blog.all}
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs transition-colors',
                      normalizeTag(filters.tag) === normalizeTag(tag)
                        ? 'border-solaris-cyan/40 bg-solaris-cyan/10 text-solaris-cyan'
                        : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                    )}
                    onClick={() => {
                      setFilters((s) => ({ ...s, tag }))
                      const url = new URL(window.location.href)
                      url.searchParams.set('tag', tag)
                      window.history.replaceState({}, '', url.toString())
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <a href={blogHref} className="btn-filled-gold w-full inline-flex justify-center">
                {t.blog.openBlog}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
