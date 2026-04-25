import WalletConnect from '@/components/WalletConnect';

export default function LoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-3 text-white/70 text-sm">Connect your TON wallet to continue.</p>
        <div className="mt-6">
          <WalletConnect />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
