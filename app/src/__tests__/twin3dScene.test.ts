import { describe, expect, it } from 'vitest';

import { buildTwin3DPanels, panelCountFromKwp, roofSizeFromKwp } from '@/lib/twin3dScene';

describe('twin3dScene', () => {
  it('panelCountFromKwp scales with capacity', () => {
    expect(panelCountFromKwp(6)).toBeGreaterThanOrEqual(4);
    expect(panelCountFromKwp(12)).toBeGreaterThan(panelCountFromKwp(6));
  });

  it('buildTwin3DPanels matches count', () => {
    const panels = buildTwin3DPanels(8);
    expect(panels.length).toBe(panelCountFromKwp(8));
  });

  it('roofSizeFromKwp is positive', () => {
    const roof = roofSizeFromKwp(6);
    expect(roof.w).toBeGreaterThan(0);
    expect(roof.d).toBeGreaterThan(0);
  });
});