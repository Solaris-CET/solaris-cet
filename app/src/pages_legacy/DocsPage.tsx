import 'swagger-ui-react/swagger-ui.css';

import { useMemo } from 'react';
import SwaggerUI from 'swagger-ui-react';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import FooterSection from '@/sections/FooterSection';

type ApiVersion = 'v1' | 'v2';
type SwaggerRequest = { headers?: Record<string, string> } & Record<string, unknown>;

export default function DocsPage() {
  const [apiVersion, setApiVersion] = useLocalStorage<ApiVersion>('solaris_api_docs_version', 'v1');
  const [apiKey, setApiKey] = useLocalStorage<string>('solaris_api_key', '');

  const specUrl = apiVersion === 'v2' ? '/api/openapi/v2' : '/api/openapi/v1';

  const requestInterceptor = useMemo(() => {
    return (req: SwaggerRequest) => {
      const headers = { ...(req?.headers ?? {}) };
      if (apiKey.trim()) headers['X-API-Key'] = apiKey.trim();
      return { ...req, headers };
    };
  }, [apiKey]);

  return (
    <main id="main-content" tabIndex={-1} className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 pb-10">
        <div className="mb-6">
          <p className="hud-label text-[10px]">Developers</p>
          <h1 className="font-display text-3xl md:text-4xl text-white mt-2">API Docs</h1>
          <p className="text-slate-200/80 mt-3 max-w-3xl leading-relaxed">
            OpenAPI 3.0 + explorare interactivă. Setează API key și folosește butonul “Try it out”.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4 rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5">
            <div className="hud-label text-[10px]">Setări</div>
            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="text-xs text-white/70">Versiune</div>
                <select
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value === 'v2' ? 'v2' : 'v1')}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="v1">v1</option>
                  <option value="v2">v2</option>
                </select>
              </label>

              <label className="block">
                <div className="text-xs text-white/70">API key</div>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="cet_sk_..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20 font-mono"
                />
                <div className="mt-2 text-xs text-white/60 leading-relaxed">
                  Header folosit: <span className="font-mono">X-API-Key</span>. Răspunsurile includ rate-limit headers.
                </div>
              </label>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="text-xs text-white/70">Exemple rapide</div>
                <pre className="mt-2 text-[12px] leading-relaxed text-slate-200/80 overflow-auto">
{`curl -H "X-API-Key: ${apiKey ? apiKey : 'YOUR_KEY'}" \\
  ${apiVersion === 'v2' ? '/api/v2/price' : '/api/v1/price'}`}
                </pre>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="h-[72vh] overflow-auto">
              <SwaggerUI
                url={specUrl}
                docExpansion="list"
                deepLinking
                displayRequestDuration
                requestInterceptor={requestInterceptor}
              />
            </div>
          </div>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
