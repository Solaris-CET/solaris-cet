import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { gsapTo } = vi.hoisted(() => ({ gsapTo: vi.fn() }));

vi.mock('gsap', () => ({
  gsap: {
    to: gsapTo,
  },
}));

describe('AnimatedCounter', () => {
  it('renders final value immediately when prefers-reduced-motion is enabled', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { default: AnimatedCounter } = await import('./AnimatedCounter');

    render(<AnimatedCounter value={42} prefix="$" suffix=" CET" />);

    expect(await screen.findByText(/\$\s*42\s*CET/)).toBeInTheDocument();
    expect(gsapTo).not.toHaveBeenCalled();

    window.matchMedia = original;
  });
});
