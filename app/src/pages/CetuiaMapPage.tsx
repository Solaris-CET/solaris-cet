import { lazy } from 'react';

import { useLanguage } from '@/hooks/useLanguage';

const CetuiaMapSection = lazy(() => import('@/sections/CetuiaMapSection'));
const FooterSection = lazy(() => import('@/sections/FooterSection'));

export default function CetuiaMapPage() {
  const { t } = useLanguage();

  return (
    <main
      id="main-content"
      data-testid="cetuia-map-page"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <h1 className="sr-only">{t.nav.cetuia}</h1>
      <CetuiaMapSection />
      <FooterSection />
    </main>
  );
}
