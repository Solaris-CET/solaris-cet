import { marked } from 'marked'

import launchEn from '../content/blog/en/launch.md?raw'
import launchEs from '../content/blog/es/launch.md?raw'
import pvCostRo from '../content/blog/ro/cat-costa-un-sistem-fotovoltaic-2026.md?raw'
import casaVerdeRo from '../content/blog/ro/cum-accesezi-programul-casa-verde.md?raw'
import hybridBatteryRo from '../content/blog/ro/invertor-hibrid-baterie-cand-merita.md?raw'
import launchRo from '../content/blog/ro/launch.md?raw'
import tpoMaintenanceRo from '../content/blog/ro/mentenanta-acoperis-tpo-checklist.md?raw'
import pvMaintenanceRo from '../content/blog/ro/mentenanta-panouri-fotovoltaice.md?raw'
import bifacialRo from '../content/blog/ro/panouri-bifaciale-vs-monocristaline.md?raw'
import roofCompareRo from '../content/blog/ro/tabla-click-vs-tigla-metalica.md?raw'
import beneficiiRo from '../content/blog/ro/beneficii-panouri-fotovoltaice-romania-2026.md?raw'
import ghidAcoperisRo from '../content/blog/ro/ghid-complet-instalare-acoperis-tabla.md?raw'
import tpoCompareRo from '../content/blog/ro/tpo-vs-membrana-clasica.md?raw'
import { extractFrontmatter } from './frontmatter'

export type BlogLocale = 'en' | 'ro' | 'es'

export type BlogFrontmatter = {
  title: string
  description: string
  date: string
  category?: string
  tags?: string[]
  coverImageUrl?: string
  author?: string
  readingTimeMinutes?: number
}

export type BlogPost = {
  slug: string
  locale: BlogLocale
  frontmatter: BlogFrontmatter
  html: string
  readingTime: number
  excerpt: string
  schema: Record<string, unknown>
}

type RawIndexItem = {
  slug: string
  locale: BlogLocale
  frontmatter: BlogFrontmatter
  markdown: string
}

const renderer = new marked.Renderer()
renderer.link = (href, title, text) => {
  const safeHref = (href ?? '').replace(/"/g, '&quot;')
  const safeTitle = title ? ` title="${String(title).replace(/"/g, '&quot;')}"` : ''
  const isExternal = /^https?:\/\//i.test(safeHref)
  const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a href="${safeHref}"${safeTitle}${attrs}>${text}</a>`
}

marked.setOptions({ renderer })

function isBlogLocale(v: string): v is BlogLocale {
  return v === 'en' || v === 'ro' || v === 'es'
}

function extractLocaleAndSlug(filePath: string): { locale: BlogLocale; slug: string } | null {
  const normalized = filePath.replace(/\\/g, '/')
  const m = /\/content\/blog\/([^/]+)\/([^/]+)\.md(?:\?.*)?$/i.exec(normalized)
  const locale = m?.[1] ? m[1].toLowerCase() : ''
  const slug = m?.[2] ? m[2] : ''
  if (!locale || !slug) return null
  if (!isBlogLocale(locale)) return null
  return { locale, slug }
}

function parseFrontmatter(input: unknown): BlogFrontmatter {
  const data = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const title = typeof data.title === 'string' ? data.title : ''
  const description =
    typeof data.description === 'string'
      ? data.description
      : typeof data.descriere === 'string'
        ? data.descriere
        : ''
  const date = typeof data.date === 'string' ? data.date : ''
  const category =
    typeof data.category === 'string'
      ? data.category
      : typeof data.categoria === 'string'
        ? data.categoria
        : undefined
  const tags = Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : undefined
  const coverImageUrl =
    typeof data.coverImageUrl === 'string'
      ? data.coverImageUrl
      : typeof data.imagine === 'string'
        ? data.imagine
        : undefined
  const author = typeof data.author === 'string' ? data.author : typeof data.autor === 'string' ? data.autor : undefined
  const readingTimeMinutes =
    typeof data.readingTimeMinutes === 'number'
      ? data.readingTimeMinutes
      : typeof data.timp_citire === 'number'
        ? data.timp_citire
        : undefined
  return { title, description, date, category, tags, coverImageUrl, author, readingTimeMinutes }
}

function safeDateMs(iso: string): number {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : 0
}

const rawModules: Record<string, string> = {
  '../content/blog/en/launch.md?raw': launchEn,
  '../content/blog/ro/launch.md?raw': launchRo,
  '../content/blog/es/launch.md?raw': launchEs,
  '../content/blog/ro/cat-costa-un-sistem-fotovoltaic-2026.md?raw': pvCostRo,
  '../content/blog/ro/cum-accesezi-programul-casa-verde.md?raw': casaVerdeRo,
  '../content/blog/ro/tabla-click-vs-tigla-metalica.md?raw': roofCompareRo,
  '../content/blog/ro/beneficii-panouri-fotovoltaice-romania-2026.md?raw': beneficiiRo,
  '../content/blog/ro/ghid-complet-instalare-acoperis-tabla.md?raw': ghidAcoperisRo,
  '../content/blog/ro/mentenanta-panouri-fotovoltaice.md?raw': pvMaintenanceRo,
  '../content/blog/ro/tpo-vs-membrana-clasica.md?raw': tpoCompareRo,
  '../content/blog/ro/panouri-bifaciale-vs-monocristaline.md?raw': bifacialRo,
  '../content/blog/ro/mentenanta-acoperis-tpo-checklist.md?raw': tpoMaintenanceRo,
  '../content/blog/ro/invertor-hibrid-baterie-cand-merita.md?raw': hybridBatteryRo,
}

const rawIndex: RawIndexItem[] = Object.entries(rawModules)
  .map(([path, markdown]) => {
    const meta = extractLocaleAndSlug(path)
    if (!meta) return null
    const parsed = extractFrontmatter(markdown)
    const frontmatter = parseFrontmatter(parsed.data)
    return {
      slug: meta.slug,
      locale: meta.locale,
      frontmatter,
      markdown: parsed.content,
    }
  })
  .filter(Boolean) as RawIndexItem[]

const byLocale = new Map<BlogLocale, BlogPost[]>()

for (const locale of ['en', 'ro', 'es'] as const) {
  const posts = rawIndex
    .filter((p) => p.locale === locale)
    .map((p) => {
      const html = marked.parse(p.markdown) as string
      const plainText = html.replace(/<[^>]*>/g, '')
      const wordCount = plainText.split(/\s+/).filter(Boolean).length
      const readingTime = Math.ceil(wordCount / 200)
      const excerpt = plainText.slice(0, 155).replace(/\s+\S*$/, '')
      const post: BlogPost = {
        slug: p.slug,
        locale: p.locale,
        frontmatter: p.frontmatter,
        html,
        readingTime,
        excerpt,
        schema: {} as Record<string, unknown>,
      }
      post.schema = generateArticleSchema(post)
      return post
    })
    .sort((a, b) => safeDateMs(b.frontmatter.date) - safeDateMs(a.frontmatter.date))
  byLocale.set(locale, posts)
}

export function listBlogPosts(locale: BlogLocale): BlogPost[] {
  return byLocale.get(locale) ?? []
}

export function getBlogPost(locale: BlogLocale, slug: string): BlogPost | null {
  const list = byLocale.get(locale)
  if (!list) return null
  return list.find((p) => p.slug === slug) ?? null
}

export function listBlogTags(locale: BlogLocale): string[] {
  const set = new Set<string>()
  for (const p of listBlogPosts(locale)) {
    for (const tag of p.frontmatter.tags ?? []) set.add(tag)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function listBlogCategories(locale: BlogLocale): string[] {
  const set = new Set<string>()
  for (const p of listBlogPosts(locale)) {
    if (p.frontmatter.category) set.add(p.frontmatter.category)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function normalizeTag(v: string): string {
  return v.trim().toLowerCase()
}

export function generateArticleSchema(post: BlogPost): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.excerpt,
    datePublished: post.frontmatter.date,
    author: {
      '@type': 'Organization',
      name: 'Solaris CET',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Solaris CET',
      logo: {
        '@type': 'ImageObject',
        url: 'https://solaris-cet.com/og-image.png',
      },
    },
    image: post.frontmatter.coverImageUrl || 'https://solaris-cet.com/og-image.png',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://solaris-cet.com/blog/${post.slug}`,
    },
  }
}
