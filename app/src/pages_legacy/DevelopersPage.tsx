import { useLocalStorage } from '@/hooks/useLocalStorage';
import FooterSection from '@/sections/FooterSection';

export default function DevelopersPage() {
  const [apiKey] = useLocalStorage<string>('solaris_api_key', '');

  return (
    <main id="main-content" tabIndex={-1} className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 pb-10">
        <div className="mb-10">
          <p className="hud-label text-[10px]">Developers</p>
          <h1 className="font-display text-3xl md:text-4xl text-white mt-2">Public API</h1>
          <p className="text-slate-200/80 mt-3 max-w-3xl leading-relaxed">
            API versionat cu autentificare prin API key, rate limiting și webhook-uri pentru tranzacții.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/docs" className="btn-gold">Vezi Docs</a>
            <a href="/console" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white hover:bg-white/[0.06] transition-colors">
              Deschide Console
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5 rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5">
            <div className="hud-label text-[10px]">Quickstart</div>
            <ol className="mt-3 space-y-3 text-sm text-slate-200/80">
              <li>
                <span className="text-white/90 font-semibold">1.</span> Autentifică-te prin wallet și generează o cheie în Console.
              </li>
              <li>
                <span className="text-white/90 font-semibold">2.</span> Apelează endpoint-uri pe versiune: <span className="font-mono">/api/v1/*</span> sau <span className="font-mono">/api/v2/*</span>.
              </li>
              <li>
                <span className="text-white/90 font-semibold">3.</span> Tratează <span className="font-mono">429</span> folosind backoff și antetele rate limit.
              </li>
            </ol>
          </div>

          <div className="md:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-5">
            <div className="hud-label text-[10px]">Exemple</div>

            <div className="mt-3 grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3">
                <div className="text-xs text-white/70">cURL</div>
                <pre className="mt-2 text-[12px] leading-relaxed text-slate-200/80 overflow-auto">{`curl -H "X-API-Key: ${apiKey || 'YOUR_KEY'}" \\
  /api/v1/price`}</pre>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3">
                <div className="text-xs text-white/70">JavaScript</div>
                <pre className="mt-2 text-[12px] leading-relaxed text-slate-200/80 overflow-auto">{`const res = await fetch('/api/v1/price', {
  headers: { 'X-API-Key': '${apiKey || 'YOUR_KEY'}' }
});
const json = await res.json();`}</pre>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3">
                <div className="text-xs text-white/70">Python</div>
                <pre className="mt-2 text-[12px] leading-relaxed text-slate-200/80 overflow-auto">{`import requests

r = requests.get('http://localhost:3000/api/v1/price', headers={
  'X-API-Key': '${apiKey || 'YOUR_KEY'}'
})
print(r.json())`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}

