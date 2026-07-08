import {
  listPendingReports,
  removePendingReport,
  type PendingReportRecord,
  type PendingReportStatus,
} from './surveyDraftStorage';

export type QueueItemStatus = PendingReportStatus;

export type SurveyQueueStats = {
  total: number;
  pending: number;
  failed: number;
  oldestAt: string | null;
};

export function queueItemStatus(item: PendingReportRecord): QueueItemStatus {
  if (item.status === 'failed') return 'failed';
  if (item.status === 'syncing') return 'syncing';
  return 'pending';
}

export function countQueueByStatus(items: PendingReportRecord[]): Pick<SurveyQueueStats, 'pending' | 'failed'> {
  let failed = 0;
  for (const item of items) {
    if (queueItemStatus(item) === 'failed') failed += 1;
  }
  return { pending: items.length - failed, failed };
}

export function oldestQueueTimestamp(items: PendingReportRecord[]): string | null {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return sorted[0]?.createdAt ?? null;
}

export async function getSurveyQueueStats(): Promise<SurveyQueueStats> {
  const items = await listPendingReports();
  const { pending, failed } = countQueueByStatus(items);
  return {
    total: items.length,
    pending,
    failed,
    oldestAt: oldestQueueTimestamp(items),
  };
}

export async function clearFailedQueueItems(): Promise<number> {
  const items = await listPendingReports();
  let removed = 0;
  for (const item of items) {
    if (queueItemStatus(item) === 'failed') {
      await removePendingReport(item.id);
      removed += 1;
    }
  }
  return removed;
}