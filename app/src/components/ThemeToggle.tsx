import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-solaris-text transition-colors',
        'hover:bg-solaris-gold/10 hover:border-solaris-gold/25',
        className,
      )}
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
    >
      {mounted && theme === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
