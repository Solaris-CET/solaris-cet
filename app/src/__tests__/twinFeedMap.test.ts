// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { twinFeedMapLabel, twinFeedMapUrl } from '@/lib/twinFeedMap';

describe('twinFeedMap', () => {
  it('builds OSM URL for valid coordinates', () => {
    const url = twinFeedMapUrl(46.77, 23.59);
    expect(url).toContain('openstreetmap.org');
    expect(url).toContain('46.77');
    expect(url).toContain('23.59');
  });

  it('returns null when GPS missing', () => {
    expect(twinFeedMapUrl(null, 23.5)).toBeNull();
    expect(twinFeedMapLabel(null, null)).toBe('GPS indisponibil');
  });
});