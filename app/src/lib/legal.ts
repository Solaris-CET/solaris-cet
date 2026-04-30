import matter from 'gray-matter'
import { marked } from 'marked'

import auditsEn from '../content/legal/en/audits.md?raw'
import cookiesEn from '../content/legal/en/cookies.md?raw'
import privacyEn from '../content/legal/en/privacy.md?raw'
import riskEn from '../content/legal/en/risk.md?raw'
import termsEn from '../content/legal/en/terms.md?raw'
import transparencyEn from '../content/legal/en/transparency.md?raw'
import auditsEs from '../content/legal/es/audits.md?raw'
import cookiesEs from '../content/legal/es/cookies.md?raw'
import privacyEs from '../content/legal/es/privacy.md?raw'
import riskEs from '../content/legal/es/risk.md?raw'
import termsEs from '../content/legal/es/terms.md?raw'
import transparencyEs from '../content/legal/es/transparency.md?raw'
import auditsRo from '../content/legal/ro/audits.md?raw'
import cookiesRo from '../content/legal/ro/cookies.md?raw'
import privacyRo from '../content/legal/ro/privacy.md?raw'
import riskRo from '../content/legal/ro/risk.md?raw'
import termsRo from '../content/legal/ro/terms.md?raw'
import transparencyRo from '../content/legal/ro/transparency.md?raw'

export type LegalLocale = 'en' | 'ro' | 'es'
export type LegalDocKey = 'privacy' | 'terms' | 'cookies' | 'risk' | 'transparency' | 'audits'

export type LegalFrontmatter = {
  title: string
  description: string
  lastUpdated: string
}

export type LegalDoc = {
  key: LegalDocKey
  locale: LegalLocale
  frontmatter: LegalFrontmatter
  html: string
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

function isLegalLocale(v: string): v is LegalLocale {
  return v === 'en' || v === 'ro' || v === 'es'
}

function isLegalDocKey(v: string): v is LegalDocKey {
  return v === 'privacy' || v === 'terms' || v === 'cookies' || v === 'risk' || v === 'transparency' || v === 'audits'
}

function parseFrontmatter(input: unknown): LegalFrontmatter {
  const data = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const title = typeof data.title === 'string' ? data.title : ''
  const description = typeof data.description === 'string' ? data.description : ''
  const lastUpdated = typeof data.lastUpdated === 'string' ? data.lastUpdated : ''
  return { title, description, lastUpdated }
}

const rawByLocaleKey: Record<`${LegalLocale}/${LegalDocKey}`, string> = {
  'en/privacy': privacyEn,
  'en/terms': termsEn,
  'en/cookies': cookiesEn,
  'en/risk': riskEn,
  'en/transparency': transparencyEn,
  'en/audits': auditsEn,
  'ro/privacy': privacyRo,
  'ro/terms': termsRo,
  'ro/cookies': cookiesRo,
  'ro/risk': riskRo,
  'ro/transparency': transparencyRo,
  'ro/audits': auditsRo,
  'es/privacy': privacyEs,
  'es/terms': termsEs,
  'es/cookies': cookiesEs,
  'es/risk': riskEs,
  'es/transparency': transparencyEs,
  'es/audits': auditsEs,
}

export function getLegalDoc(locale: LegalLocale, key: LegalDocKey): LegalDoc {
  const raw = rawByLocaleKey[`${locale}/${key}`] ?? rawByLocaleKey[`en/${key}`]
  const parsed = matter(raw)
  const frontmatter = parseFrontmatter(parsed.data)
  return {
    key,
    locale: isLegalLocale(locale) ? locale : 'en',
    frontmatter,
    html: marked.parse(parsed.content) as string,
  }
}

export function safeLegalLocale(input: string, fallback: LegalLocale = 'en'): LegalLocale {
  const v = input.trim().toLowerCase()
  return isLegalLocale(v) ? v : fallback
}

export function safeLegalDocKey(input: string, fallback: LegalDocKey = 'privacy'): LegalDocKey {
  const v = input.trim().toLowerCase()
  return isLegalDocKey(v) ? v : fallback
}
