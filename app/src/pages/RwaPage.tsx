import { lazy } from 'react';

import { useLanguage } from '@/hooks/useLanguage';

const RwaSection = lazy(() => import('@/sections/RwaSection'));
const FooterSection = lazy(() => import('@/sections/FooterSection'));

export default function RwaPage() {
  const { t } = useLanguage();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <h1 className="sr-only">{t.nav.rwa}</h1>
      <section id="rwa" aria-label={t.landmarks.rwa} className="relative z-[55] scroll-mt-24">
        <RwaSection />
      </section>
      <FooterSection />
    </main>
  );
}
