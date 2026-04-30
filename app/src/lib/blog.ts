import matter from 'gray-matter'
import { marked } from 'marked'

import launchEn from '../content/blog/en/launch.md?raw'
import launchEs from '../content/blog/es/launch.md?raw'
import launchRo from '../content/blog/ro/launch.md?raw'

export type BlogLocale = 'en' | 'ro' | 'es'

export type BlogFrontmatter = {
  title: string
  description: string
  date: string
  category?: string
  tags?: string[]
  coverImageUrl?: string
}

export type BlogPost = {
  slug: string
  locale: BlogLocale
  frontmatter: BlogFrontmatter
  html: string
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
  const description = typeof data.description === 'string' ? data.description : ''
  const date = typeof data.date === 'string' ? data.date : ''
  const category = typeof data.category === 'string' ? data.category : undefined
  const tags = Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : undefined
  const coverImageUrl = typeof data.coverImageUrl === 'string' ? data.coverImageUrl : undefined
  return { title, description, date, category, tags, coverImageUrl }
}

function safeDateMs(iso: string): number {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : 0
}

const rawModules: Record<string, string> = {
  '../content/blog/en/launch.md?raw': launchEn,
  '../content/blog/ro/launch.md?raw': launchRo,
  '../content/blog/es/launch.md?raw': launchEs,
}

const rawIndex: RawIndexItem[] = Object.entries(rawModules)
  .map(([path, markdown]) => {
    const meta = extractLocaleAndSlug(path)
    if (!meta) return null
    const parsed = matter(markdown)
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
    .map((p) => ({
      slug: p.slug,
      locale: p.locale,
      frontmatter: p.frontmatter,
      html: marked.parse(p.markdown) as string,
    }))
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
