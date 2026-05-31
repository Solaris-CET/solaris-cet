import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[100svh] min-h-dvh bg-slate-950 overflow-hidden flex flex-col justify-center items-center"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,201,76,0.22)_0%,transparent_45%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.16)_0%,transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/20" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-8 shadow-[0_0_18px_rgba(251,191,36,0.15)]">
           <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
           SOLUȚII COMPLETE · EXECUȚIE PROFESIONISTĂ
        </div>

        <h1 className="font-display text-white leading-[1.02] tracking-[-0.04em] mb-6 text-4xl md:text-6xl lg:text-7xl font-bold max-w-5xl mx-auto">
          Solaris <span className="text-amber-400">CET</span> — fotovoltaice, construcții și acoperișuri
        </h1>
        
        <p className="text-lg md:text-xl text-slate-100/80 max-w-3xl mx-auto font-medium mb-10 text-balance">
          Instalații fotovoltaice • lucrări de construcții • acoperișuri tablă/țiglă • folie TPO (industrial) •
          montaje atice și fațade de tablă • reparații și mentenanță.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto px-4">
          <a
            href="/contact"
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-10 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
          >
            Cere ofertă
          </a>
          <a
            href="#servicii"
            className="w-full sm:w-auto border border-white/20 hover:border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold py-4 px-10 rounded-2xl transition-all"
          >
            Vezi servicii
          </a>
        </div>

        <div className="mt-6 text-sm text-white/70">
          <a className="hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/60" href="tel:+40769889721">
            +40 769 889 721
          </a>
          <span className="mx-2 text-white/35">•</span>
          <a className="hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/60" href="mailto:solaris-cet@protonmail.com">
            solaris-cet@protonmail.com
          </a>
          <span className="mx-2 text-white/35">•</span>
          <span className="text-white/60">Cetatuia, Vaslui 737429 · acoperire națională</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 animate-bounce pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest uppercase">Explorează</span>
        <ChevronDown size={20} />
      </div>
    </section>
  );
}
