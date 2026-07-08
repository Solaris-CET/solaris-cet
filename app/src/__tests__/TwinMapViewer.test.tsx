// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TwinMapViewer } from '@/components/survey/TwinMapViewer';

afterEach(() => {
  cleanup();
});

describe('TwinMapViewer', () => {
  it('shows placeholder when GPS coordinates are missing', () => {
    render(<TwinMapViewer latitude={null} longitude={23.59} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Hartă indisponibilă/);
    expect(screen.queryByTitle(/hartă/i)).toBeNull();
  });

  it('renders OSM embed iframe for valid coordinates', () => {
    render(<TwinMapViewer latitude={46.77} longitude={23.59} />);
    const iframe = screen.getByTitle('Hartă site twin');
    expect(iframe).toHaveAttribute('src', expect.stringContaining('openstreetmap.org/export/embed.html'));
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });
});