// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { TwinFeed } from '@/lib/twinFeed';

describe('twinFeed types', () => {
  it('schema constant shape', () => {
    const feed: TwinFeed = {
      schema: 'solaris-twin-feed-v1',
      feed_version: 1,
      generated_at: '2026-07-06T00:00:00Z',
      report_id: 'SOL-1',
      site: { client_name: 'A', city: 'Cluj', latitude: 46.7, longitude: 23.5 },
      system: { capacity_kwp: 6, annual_kwh: 7200, suitability_score: 80, premium_tier: false },
      low_confidence_count: 0,
      corrections_count: 0,
      corrections_recent: [],
    };
    expect(feed.schema).toBe('solaris-twin-feed-v1');
  });
});