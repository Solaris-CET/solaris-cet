import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SafeHtml } from './SafeHtml';

describe('SafeHtml', () => {
  it('sanitizes unsafe html and keeps allowed tags/attributes', () => {
    render(
      <SafeHtml
        html={'<p>Hello</p><script>window.__x=1</script><a href="/x" onclick="alert(1)">Go</a>'}
        config={{
          kind: 'limited',
          allowedTags: ['p', 'a'],
          allowedAttributes: ['href'],
        }}
        dataTestId="safe"
      />,
    );

    const root = screen.getByTestId('safe');
    expect(root.querySelector('script')).toBeNull();
    const link = root.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/x');
    expect(link?.getAttribute('onclick')).toBeNull();
    expect(root).toHaveTextContent('Hello');
    expect(root).toHaveTextContent('Go');
  });

  it('supports svg mode without stripping svg elements', () => {
    render(
      <SafeHtml
        html={'<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg>'}
        config={{ kind: 'svg' }}
        dataTestId="svg"
      />,
    );

    const root = screen.getByTestId('svg');
    expect(root.querySelector('svg')).not.toBeNull();
    expect(root.querySelector('circle')).not.toBeNull();
  });
});
