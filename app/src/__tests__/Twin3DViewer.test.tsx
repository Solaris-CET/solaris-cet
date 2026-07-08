// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { emissiveFromScore, Twin3DViewer } from '@/components/survey/Twin3DViewer';
import { panelCountFromKwp } from '@/lib/twin3dScene';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="twin-3d-canvas">{children}</div>
  ),
  useFrame: () => {},
}));

describe('Twin3DViewer', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows placeholder when capacity is zero or negative', () => {
    render(<Twin3DViewer capacityKwp={0} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Model 3D indisponibil/);
    expect(screen.queryByTestId('twin-3d-canvas')).toBeNull();
  });

  it('renders Canvas for positive capacity with accessible figure label', () => {
    render(<Twin3DViewer capacityKwp={8} suitabilityScore={85} />);
    expect(screen.getByTestId('twin-3d-canvas')).toBeTruthy();
    expect(screen.getByLabelText(/Model 3D site fotovoltaic 8 kWp/)).toBeTruthy();
    expect(screen.queryByText(/Model 3D indisponibil/)).toBeNull();
  });

  it('maps suitability score to emissive color tiers', () => {
    expect(emissiveFromScore(90)).toBe('#1a3d5c');
    expect(emissiveFromScore(70)).toBe('#2a3550');
    expect(emissiveFromScore(40)).toBe('#3a2a40');
  });

  it('mounts one mesh per panel from twin3dScene layout', () => {
    const { container } = render(<Twin3DViewer capacityKwp={6} />);
    const meshes = container.querySelectorAll('mesh');
    // SiteModel: roof + panels + house base
    expect(meshes.length).toBe(panelCountFromKwp(6) + 2);
  });
});