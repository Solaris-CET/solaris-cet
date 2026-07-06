import { describe, expect, it } from 'vitest';

import { queueItemStatus } from '@/lib/surveyOfflineQueue';
import type { PendingReportRecord } from '@/lib/surveyDraftStorage';

const base: PendingReportRecord = {
  id: 'p1',
  form: {} as PendingReportRecord['form'],
  installer: {} as PendingReportRecord['installer'],
  photos: [],
  createdAt: '2026-01-01T00:00:00Z',
};

describe('surveyOfflineQueue', () => {
  it('queueItemStatus defaults to pending', () => {
    expect(queueItemStatus(base)).toBe('pending');
  });

  it('queueItemStatus reads failed', () => {
    expect(queueItemStatus({ ...base, status: 'failed' })).toBe('failed');
  });
});