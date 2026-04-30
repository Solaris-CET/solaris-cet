import { Home, List,MessageCircle, Settings, Wallet } from 'lucide-react'
import { type ComponentType,useEffect, useMemo } from 'react'

import { useDataSaver } from '@/hooks/useDataSaver'
import { useLanguage } from '@/hooks/useLanguage'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting'
import { cn } from '@/lib/utils'

type Item = {
  key: string
  href: string
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

export function MobileAppNav({ routePath }: { routePath: string }) {
  const { t, lang } = useLanguage()
  const online = useOnlineStatus()
  const { enabled: dataSaver } = useDataSaver()

  const isRouteMode = useMemo(() => {
    if (typeof window === 'undefined') return false
    return parseUrlLocaleFromPathname(window.location.pathname).pathnameNoLocale !== '/'
  }, [])

  const show = isRouteMode && routePath !== '/'

  useEffect(() => {
    if (!show) return
    const root = document.documentElement
    const prev = root.style.getPropertyValue('--mobile-conversion-dock-reserve')
    root.style.setProperty('--mobile-conversion-dock-reserve', '5.5rem')
    return () => {
      if (prev) root.style.setProperty('--mobile-conversion-dock-reserve', prev)
      else root.style.removeProperty('--mobile-conversion-dock-reserve')
    }
  }, [show])

  const items = useMemo(() => {
    const locale = urlLocaleFromLang(lang)
    const withLocale = (p: string) => (p.startsWith('/') ? localizePathname(p, locale) : p)
    const withQs = (p: string) =>
      typeof window !== 'undefined' && p.startsWith('/') ? `${p}${window.location.search}` : p

    const base: Item[] = [
      { key: 'home', href: withQs(withLocale('/')), label: t.mobileAppNav.home, icon: Home },
      { key: 'wallet', href: withQs(withLocale('/wallet')), label: t.mobileAppNav.wallet, icon: Wallet },
      { key: 'chat', href: withQs(withLocale('/chat')), label: t.mobileAppNav.chat, icon: MessageCircle },
      { key: 'tx', href: withQs(withLocale('/tx-history')), label: t.mobileAppNav.transactions, icon: List },
      { key: 'settings', href: withQs(withLocale('/settings')), label: t.mobileAppNav.settings, icon: Settings },
    ]
    return base
  }, [lang, t.mobileAppNav.chat, t.mobileAppNav.home, t.mobileAppNav.settings, t.mobileAppNav.transactions, t.mobileAppNav.wallet])

  const active = useMemo(() => routePath.replace(/\/$/, '') || '/', [routePath])

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[905] lg:hidden">
      <div className="mx-auto max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <nav
          className={cn(
            'rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-2xl',
            'shadow-[0_-8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
            'px-1 py-1.5',
          )}
          aria-label="Mobile navigation"
        >
          <div className="flex items-stretch justify-between gap-1">
            {items.map((it) => {
              const isActive = it.href.split('?')[0]?.replace(/\/$/, '') === active
              const Icon = it.icon
              return (
                <a
                  key={it.key}
                  href={it.href}
                  aria-label={it.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1',
                    'text-[10px] sm:text-[11px] font-semibold tracking-tight text-center',
                    'text-solaris-muted hover:text-solaris-text active:scale-[0.98] transition-colors',
                    isActive ? 'bg-white/8 text-solaris-text border border-white/10' : 'border border-transparent',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span className="leading-tight line-clamp-1">{it.label}</span>
                </a>
              )
            })}
          </div>
          <div className="mt-1 flex items-center justify-between px-2 pb-0.5">
            <div className="text-[10px] font-mono text-white/45">
              {online ? t.mobileAppNav.online : t.mobileAppNav.offline}
            </div>
            {dataSaver ? <div className="text-[10px] font-mono text-white/45">{t.mobileAppNav.dataSaver}</div> : null}
          </div>
        </nav>
      </div>
    </div>
  )
}
