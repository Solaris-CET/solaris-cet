import { Copy, Share2, Wand2 } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

export default function ShareTargetPage() {
  const payload = useMemo(() => {
    const url = new URL(window.location.href)
    const title = url.searchParams.get('title') ?? ''
    const text = url.searchParams.get('text') ?? ''
    const sharedUrl = url.searchParams.get('url') ?? ''
    const combined = [title, text, sharedUrl].filter(Boolean).join('\n').trim()
    return { title, text, url: sharedUrl, combined }
  }, [])

  const openCetAi = () => {
    const q = payload.combined ? `Summarize and extract action items:\n\n${payload.combined}` : ''
    const target = q ? `/cet-ai?share=${encodeURIComponent(q)}` : '/cet-ai'
    window.location.assign(target)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload.combined || payload.url || payload.text || payload.title)
      toast.success('Copied')
    } catch {
      void 0
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-solaris-cyan" aria-hidden />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Share</h1>
        </div>
        <p className="mt-2 text-white/70 text-sm">Received content from another app.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/60 font-mono">Payload</div>
          <pre className="mt-2 whitespace-pre-wrap break-words text-white/85 text-sm">
            {payload.combined || '—'}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCetAi}
              className="h-10 px-4 rounded-xl bg-solaris-gold text-solaris-dark font-semibold inline-flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" aria-hidden /> Send to CET AI
            </button>
            <button
              type="button"
              onClick={() => void copy()}
              className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 inline-flex items-center gap-2"
            >
              <Copy className="w-4 h-4" aria-hidden /> Copy
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

