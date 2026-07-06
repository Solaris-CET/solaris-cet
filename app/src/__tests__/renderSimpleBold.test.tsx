// @vitest-environment jsdom
import { cleanup,render } from '@testing-library/react';
import { afterEach,describe, expect, it } from 'vitest';

import { renderSimpleBold } from '@/lib/renderSimpleBold';
import { hasBalancedSimpleBoldMarkers } from '@/lib/simpleBoldMarkers';

afterEach(() => {
  cleanup();
});

describe('simpleBold markers + renderSimpleBold', () => {
  it('hasBalanced + render (plain, strong, dup segments, className)', () => {
    expect(hasBalancedSimpleBoldMarkers('')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('plain')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('**x**')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('**same** and **same** end')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('**unclosed')).toBe(false);
    expect(hasBalancedSimpleBoldMarkers('unclosed**')).toBe(false);

    const plain = render(<p>{renderSimpleBold('no bold here')}</p>);
    expect(plain.container.textContent).toBe('no bold here');
    expect(plain.container.querySelector('strong')).toBeNull();

    const one = render(<p>{renderSimpleBold('a **inner** tail')}</p>);
    expect(one.container.textContent).toBe('a inner tail');
    expect(one.container.querySelector('strong')?.textContent).toBe('inner');

    const dup = render(<p>{renderSimpleBold('**same** and **same** end')}</p>);
    const strongs = dup.container.querySelectorAll('strong');
    expect(strongs.length).toBe(2);
    strongs.forEach((el) => {
      expect(el.textContent).toBe('same');
    });
    expect(dup.container.textContent).toBe('same and same end');

    const cls = render(
      <span>{renderSimpleBold('**x**', 'font-bold text-red-500')}</span>,
    );
    const s = cls.container.querySelector('strong');
    expect(s?.className).toContain('font-bold');
    expect(s?.className).toContain('text-red-500');
    expect(s?.textContent).toBe('x');
  });
});
