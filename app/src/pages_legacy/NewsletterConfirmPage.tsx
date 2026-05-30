import { CheckCircle2, CircleX, Loader2, Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/hooks/useLanguage'
import {
  localizePathname,
  parseUrlLocaleFromPathname,
  type UrlLocale,
  urlLocaleFromLang,
} from '@/i18n/urlRouting'
import { cn } from '@/lib/utils'

type Status = 'loading' | 'confirmed' | 'already_confirmed' | 'expired' | 'invalid'

function activeLocaleFromUrl(fallback: UrlLocale): UrlLocale {
  if (typeof window === 'undefined') return fallback
  return parseUrlLocaleFromPathname(window.location.pathname).locale ?? fallback
}

function readToken(): string {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  return String(url.searchParams.get('token') ?? '').trim()
}

export default function NewsletterConfirmPage() {
  const { t, lang } = useLanguage()
  const fallbackLocale = urlLocaleFromLang(lang)
  const locale = activeLocaleFromUrl(fallbackLocale)
  const [status, setStatus] = useState<Status>('loading')

  const token = useMemo(() => readToken(), [])
  const blogHref = localizePathname('/blog', locale)
  const homeHref = localizePathname('/', locale)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetch(`${import.meta.env.BASE_URL}api/newsletter/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })
      .then(async (res) => {
        const payload = (await res.json().catch(() => null)) as { status?: unknown } | null
        const s = typeof payload?.status === 'string' ? payload.status : 'invalid'
        const next: Status =
          s === 'confirmed' || s === 'already_confirmed' || s === 'expired' || s === 'invalid' ? (s as Status) : 'invalid'
        if (!cancelled) setStatus(next)
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const ui =
    status === 'loading'
      ? {
          icon: <Loader2 className="w-5 h-5 animate-spin text-solaris-muted" aria-hidden />,
          title: t.newsletterConfirm.loadingTitle,
          body: t.newsletterConfirm.loadingBody,
          ctaHref: homeHref,
          ctaLabel: t.newsletterConfirm.ctaHome,
        }
      : status === 'confirmed'
        ? {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden />,
            title: t.newsletterConfirm.successTitle,
            body: t.newsletterConfirm.successBody,
            ctaHref: blogHref,
            ctaLabel: t.newsletterConfirm.ctaBlog,
          }
        : status === 'already_confirmed'
          ? {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden />,
              title: t.newsletterConfirm.alreadyTitle,
              body: t.newsletterConfirm.alreadyBody,
              ctaHref: blogHref,
              ctaLabel: t.newsletterConfirm.ctaBlog,
            }
          : status === 'expired'
            ? {
                icon: <CircleX className="w-5 h-5 text-amber-300" aria-hidden />,
                title: t.newsletterConfirm.expiredTitle,
                body: t.newsletterConfirm.expiredBody,
                ctaHref: homeHref + '#footer',
                ctaLabel: t.newsletterConfirm.ctaRetry,
              }
            : {
                icon: <CircleX className="w-5 h-5 text-rose-300" aria-hidden />,
                title: t.newsletterConfirm.invalidTitle,
                body: t.newsletterConfirm.invalidBody,
                ctaHref: homeHref,
                ctaLabel: t.newsletterConfirm.ctaHome,
              }

  return (
    <main id="main-content" className="relative z-10 w-full max-w-xl mx-auto px-6 pt-28 pb-20">
      <div className={cn('bento-card p-8 border border-white/10 text-center')}>
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
          <Mail className="w-5 h-5 text-solaris-cyan" aria-hidden />
        </div>
        <div className="flex items-center justify-center gap-2">
          {ui.icon}
          <div className="font-display text-xl text-solaris-text">{ui.title}</div>
        </div>
        <div className="mt-2 text-sm text-solaris-muted">{ui.body}</div>
        <a href={ui.ctaHref} className="btn-filled-gold mt-6 inline-flex justify-center w-full">
          {ui.ctaLabel}
        </a>
      </div>
    </main>
  )
}

