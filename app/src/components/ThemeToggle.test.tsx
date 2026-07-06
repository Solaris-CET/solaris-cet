import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ThemeToggle from './ThemeToggle';

const setTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme,
  }),
}));

describe('ThemeToggle', () => {
  it('toggles from light to dark', async () => {
    vi.useFakeTimers();
    render(<ThemeToggle />);

    vi.runAllTimers();

    screen.getByRole('button', { name: 'Toggle theme' }).click();
    expect(setTheme).toHaveBeenCalledWith('dark');
    vi.useRealTimers();
  });
});
