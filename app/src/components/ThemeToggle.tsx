import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const active = resolvedTheme === 'light' ? 'light' : 'dark';
  const next = active === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-solaris-text transition-colors',
        'hover:bg-solaris-gold/10 hover:border-solaris-gold/25',
        className,
      )}
      onClick={() => {
        if (!prefersReducedMotion) {
          document.documentElement.classList.add('solaris-theme-transition');
          window.setTimeout(() => document.documentElement.classList.remove('solaris-theme-transition'), 260);
        }
        setTheme(next);
      }}
      aria-label="Toggle theme"
    >
      {mounted && active === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
