import React from 'react';

import { CetAiHero } from '@/components/cetAi/CetAiHero';
import { CetAiModal } from '@/components/cetAi/CetAiModal';
import { useCetAiSearch } from '@/hooks/useCetAiSearch';

export default function CetAiSearch(props: { initialPrompt?: string } = {}) {
  const controller = useCetAiSearch(props);

  return (
    <>
      <CetAiHero controller={controller} />
      <CetAiModal controller={controller} />
    </>
  );
}
