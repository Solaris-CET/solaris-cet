import { useEffect } from 'react';

export default function ThankYouPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = '/';
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-white/10 bg-black/30 px-6 py-10 text-center sm:px-10" data-reveal>
          <h1 className="font-display text-3xl font-bold sm:text-5xl">Cererea a fost trimisă!</h1>
          <p className="mt-4 text-lg text-slate-300">Te contactăm în maxim 24 de ore pe numărul de telefon furnizat.</p>
          <p className="mt-4 text-slate-300">
            Sau sună direct:{' '}
            <a className="underline underline-offset-4 decoration-white/20 hover:decoration-white/60" href="tel:+40769889721">
              +40 769 889 721
            </a>
          </p>
          <p className="mt-6 text-sm text-slate-400">Ești redirecționat automat în 5 secunde...</p>
          <a
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-amber-400 px-7 py-4 font-black text-black"
          >
            ← Înapoi acasă
          </a>
        </section>
      </div>
    </main>
  );
}
