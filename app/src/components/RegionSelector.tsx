import { Globe } from 'lucide-react';
import { useId } from 'react';

import { useLanguage } from '../hooks/useLanguage';
import { type RegionCode,useRegion } from '../hooks/useRegion';

export default function RegionSelector({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const { region, setRegion } = useRegion();
  const id = useId();

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <Globe className="w-4 h-4 text-white/70" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {t.region.ariaLabel}
      </label>
      <select
        id={id}
        value={region}
        onChange={(e) => setRegion(e.target.value as RegionCode)}
        className="bg-black/40 border border-white/10 text-white/85 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-solaris-gold/40"
        aria-label={t.region.ariaLabel}
      >
        <option value="eu">{t.region.eu}</option>
        <option value="asia">{t.region.asia}</option>
      </select>
    </div>
  );
}
