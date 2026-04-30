import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { mktEvent } from '@/lib/marketing'

type Props = {
  enabled: boolean
  connectedCount?: number | null
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

export function SocialProofToasts({ enabled, connectedCount }: Props) {
  const messages = useMemo(() => {
    const countLine = typeof connectedCount === 'number' ? `${connectedCount} online acum` : null
    return [
      { title: 'CET AI', body: 'Un utilizator a rulat o analiză AI.' },
      { title: 'Wallet', body: 'Cineva s-a conectat cu TON wallet.' },
      { title: 'Airdrop', body: 'Un claim a fost inițiat.' },
      { title: 'Newsletter', body: 'Un nou abonat a cerut ghidul gratuit.' },
      ...(countLine ? [{ title: 'Live', body: countLine }] : []),
    ]
  }, [connectedCount])

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const fire = () => {
      const msg = pick(messages)
      toast(msg.title, { description: msg.body, duration: 5000 })
      mktEvent('social_proof_toast', { title: msg.title })
    }

    const initial = window.setTimeout(fire, 6500)
    const id = window.setInterval(() => {
      fire()
    }, 18_000 + Math.floor(Math.random() * 14_000))

    return () => {
      window.clearTimeout(initial)
      window.clearInterval(id)
    }
  }, [enabled, messages])

  return null
}

