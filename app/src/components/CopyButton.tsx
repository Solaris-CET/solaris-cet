import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

function hapticConfirm() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(18);
  } catch {
    void 0;
  }
}

export function CopyButton({
  text,
  ariaLabel = 'Copiază',
  className,
  onCopied,
}: {
  text: string;
  ariaLabel?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const canCopy = useMemo(() => text.trim().length > 0, [text]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(id);
  }, [copied]);

  const doCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(text);
      hapticConfirm();
      setCopied(true);
      onCopied?.();
      toast.success('Copiat în clipboard.');
    } catch {
      toast.error('Nu pot copia în clipboard.');
    }
  };

  return (
    <button
      type="button"
      onClick={() => void doCopy()}
      disabled={!canCopy}
      className={cn(
        'relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50',
        !prefersReducedMotion && (copied ? 'scale-[1.03]' : ''),
        className,
      )}
      aria-label={ariaLabel}
    >
      <span
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 pointer-events-none',
          copied ? 'opacity-100' : '',
        )}
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(34,197,94,0.18), transparent 55%), radial-gradient(circle at 80% 70%, rgba(242,201,76,0.12), transparent 55%)',
          transition: 'opacity 200ms ease',
        }}
        aria-hidden
      />
      {copied ? <Check className="w-4 h-4 text-emerald-300" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
    </button>
  );
}

