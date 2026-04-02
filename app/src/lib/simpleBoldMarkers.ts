/**
 * True when every `**` has a matching pair (odd-length split on `**`). Empty string is valid.
 * Shared by {@link renderSimpleBold} and i18n tests — no React dependency.
 */
export function hasBalancedSimpleBoldMarkers(text: string): boolean {
  return text.split(/\*\*/).length % 2 === 1;
}
