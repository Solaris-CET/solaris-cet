// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { hasBalancedSimpleBoldMarkers } from '@/lib/simpleBoldMarkers';
import { renderSimpleBold } from '@/lib/renderSimpleBold';

afterEach(() => {
  cleanup();
});

describe('hasBalancedSimpleBoldMarkers', () => {
  it('accepts empty, plain text, and paired ** segments', () => {
    expect(hasBalancedSimpleBoldMarkers('')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('plain')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('**x**')).toBe(true);
    expect(hasBalancedSimpleBoldMarkers('**same** and **same** end')).toBe(true);
  });

  it('rejects a single stray **', () => {
    expect(hasBalancedSimpleBoldMarkers('**unclosed')).toBe(false);
    expect(hasBalancedSimpleBoldMarkers('unclosed**')).toBe(false);
  });
});

describe('renderSimpleBold', () => {
  it('renders plain text without strong elements', () => {
    const { container } = render(<p>{renderSimpleBold('no bold here')}</p>);
    expect(container.textContent).toBe('no bold here');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('wraps odd segments in strong after ** split', () => {
    const { container } = render(<p>{renderSimpleBold('a **inner** tail')}</p>);
    expect(container.textContent).toBe('a inner tail');
    expect(container.querySelector('strong')?.textContent).toBe('inner');
  });

  it('handles identical bold segments (two strong nodes, distinct Fragment keys)', () => {
    const { container } = render(<p>{renderSimpleBold('**same** and **same** end')}</p>);
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBe(2);
    strongs.forEach((el) => {
      expect(el.textContent).toBe('same');
    });
    expect(container.textContent).toBe('same and same end');
  });

  it('applies custom strong className', () => {
    const { container } = render(
      <span>{renderSimpleBold('**x**', 'font-bold text-red-500')}</span>,
    );
    const s = container.querySelector('strong');
    expect(s?.className).toContain('font-bold');
    expect(s?.className).toContain('text-red-500');
    expect(s?.textContent).toBe('x');
  });
});
