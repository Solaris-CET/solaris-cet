// @vitest-environment node
import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  enqueuePendingReport,
  listPendingReports,
  SURVEY_DB_NAME,
  updatePendingReport,
  type PendingReportRecord,
} from '@/lib/surveyDraftStorage';
import {
  clearFailedQueueItems,
  countQueueByStatus,
  getSurveyQueueStats,
  oldestQueueTimestamp,
  queueItemStatus,
} from '@/lib/surveyOfflineQueue';

const base: PendingReportRecord = {
  id: 'p1',
  form: {} as PendingReportRecord['form'],
  installer: {} as PendingReportRecord['installer'],
  photos: [],
  createdAt: '2026-01-01T00:00:00Z',
};

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(SURVEY_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

describe('surveyOfflineQueue', () => {
  it('queueItemStatus defaults to pending', () => {
    expect(queueItemStatus(base)).toBe('pending');
  });

  it('queueItemStatus reads failed and syncing', () => {
    expect(queueItemStatus({ ...base, status: 'failed' })).toBe('failed');
    expect(queueItemStatus({ ...base, status: 'syncing' })).toBe('syncing');
  });

  it('countQueueByStatus and oldestQueueTimestamp aggregate in memory', () => {
    const items: PendingReportRecord[] = [
      { ...base, id: 'a', createdAt: '2026-01-02T00:00:00Z' },
      { ...base, id: 'b', status: 'failed', createdAt: '2026-01-01T00:00:00Z' },
    ];
    expect(countQueueByStatus(items)).toEqual({ pending: 1, failed: 1 });
    expect(oldestQueueTimestamp(items)).toBe('2026-01-01T00:00:00Z');
    expect(oldestQueueTimestamp([])).toBeNull();
  });
});

describe('surveyOfflineQueue IndexedDB', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('getSurveyQueueStats reads queue from IndexedDB', async () => {
    await enqueuePendingReport(
      {} as PendingReportRecord['form'],
      {} as PendingReportRecord['installer'],
      [],
      'q-pending',
    );
    await enqueuePendingReport(
      {} as PendingReportRecord['form'],
      {} as PendingReportRecord['installer'],
      [],
      'q-failed',
    );
    await updatePendingReport('q-failed', { status: 'failed' });
    expect((await listPendingReports()).find((i) => i.id === 'q-failed')?.status).toBe('failed');

    const stats = await getSurveyQueueStats();
    expect(stats.total).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.oldestAt).toMatch(/^2026-/);
  });

  it('clearFailedQueueItems removes only failed entries', async () => {
    await enqueuePendingReport(
      {} as PendingReportRecord['form'],
      {} as PendingReportRecord['installer'],
      [],
      'keep',
    );
    await enqueuePendingReport(
      {} as PendingReportRecord['form'],
      {} as PendingReportRecord['installer'],
      [],
      'drop',
    );
    await updatePendingReport('drop', { status: 'failed' });

    const removed = await clearFailedQueueItems();
    expect(removed).toBe(1);

    const stats = await getSurveyQueueStats();
    expect(stats.total).toBe(1);
    expect(stats.pending).toBe(1);
  });
});