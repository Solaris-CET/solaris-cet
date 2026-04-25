import { useMemo } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/authContext';
import { truncateAddress } from '@/lib/utils';

export default function AccountPage() {
  const { state, logout } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  const display = useMemo(() => {
    if (!user) return null;
    const name = user.displayName?.trim();
    if (name) return name;
    if (user.walletAddress) return truncateAddress(user.walletAddress, 8);
    return truncateAddress(user.id, 8);
  }, [user]);

  if (state.status === 'loading') {
    return (
      <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="font-display text-2xl text-white">Cont</h1>
          <p className="mt-2 text-sm text-white/70">Trebuie să fii autentificat.</p>
          <a href="/login" className="mt-6 inline-flex rounded-xl bg-solaris-gold px-4 py-2 text-solaris-dark font-semibold">
            Mergi la Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight">Cont</h1>
            <div className="mt-2 text-sm text-white/70">
              {display} · rol: <span className="text-white/90">{user.role}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">Sesiune</div>
          <div className="mt-3 grid gap-2 text-sm text-white/80">
            <div>
              <span className="text-white/60">User ID:</span> <span className="font-mono">{user.id}</span>
            </div>
            {user.walletAddress ? (
              <div>
                <span className="text-white/60">Wallet:</span> <span className="font-mono">{user.walletAddress}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

