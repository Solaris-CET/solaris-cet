import { Fragment, type ReactNode } from 'react';

/**
 * True when every `**` has a matching pair (odd-length split). Empty string is valid.
 * Use in tests / CI for copy that flows through {@link renderSimpleBold}.
 */
export function hasBalancedSimpleBoldMarkers(text: string): boolean {
  return text.split(/\*\*/).length % 2 === 1;
}

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
