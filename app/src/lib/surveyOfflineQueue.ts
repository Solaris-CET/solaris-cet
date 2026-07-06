import {
  listPendingReports,
  removePendingReport,
  type PendingReportRecord,
} from './surveyDraftStorage';

export type QueueItemStatus = 'pending' | 'syncing' | 'failed';

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

export async function getSurveyQueueStats(): Promise<SurveyQueueStats> {
  const items = await listPendingReports();
  const failed = items.filter((i) => queueItemStatus(i) === 'failed').length;
  const pending = items.length - failed;
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    total: items.length,
    pending,
    failed,
    oldestAt: sorted[0]?.createdAt ?? null,
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