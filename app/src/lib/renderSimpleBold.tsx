import { Fragment, type ReactNode } from 'react';

export { hasBalancedSimpleBoldMarkers } from './simpleBoldMarkers';

/**
 * Renders `**bold**` segments from i18n-safe plain text (no HTML injection).
 * Each split segment is wrapped in a keyed `Fragment` so list children are
 * consistently keyed and duplicate bold text does not produce key collisions.
 */
export function renderSimpleBold(
  text: string,
  strongClassName = 'text-solaris-text font-semibold',
): ReactNode {
  const parts = text.split(/\*\*/);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i % 2 === 1 ? <strong className={strongClassName}>{part}</strong> : part}
    </Fragment>
  ));
}
