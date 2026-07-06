import { useCallback, useEffect, useRef, useState } from 'react';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import { generateSurveyReport } from '@/lib/surveyApi';
import {
  clearSurveyDraft,
  enqueuePendingReport,
  listPendingReports,
  loadSurveyDraft,
  removePendingReport,
  saveSurveyDraft,
  storedToPhotos,
  updatePendingReport,
  type SurveyDraftRecord,
} from '@/lib/surveyDraftStorage';
import { getSurveyQueueStats, type SurveyQueueStats } from '@/lib/surveyOfflineQueue';
import { prefetchSurveyOfflineAssets } from '@/lib/surveyOfflinePrefetch';

type Options = {
  form: SurveyFormData;
  installer: InstallerProfile;
  photos: File[];
  onSynced?: (count: number) => void;
  onSyncError?: (message: string) => void;
  onDraftLoaded?: (draft: SurveyDraftRecord) => void;
};

export function useSurveyOfflineSync({
  form,
  installer,
  photos,
  onSynced,
  onSyncError,
  onDraftLoaded,
}: Options) {
  const online = useOnlineStatus();
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [stats, setStats] = useState<SurveyQueueStats>({
    total: 0,
    pending: 0,
    failed: 0,
    oldestAt: null,
  });
  const [syncing, setSyncing] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);
  const autoSyncStartedRef = useRef(false);

  const refreshStats = useCallback(async () => {
    const s = await getSurveyQueueStats();
    setStats(s);
  }, []);

  const handleSyncPending = useCallback(async () => {
    if (!online || syncing) return;
    setSyncing(true);
    let synced = 0;
    try {
      const pending = await listPendingReports();
      if (!pending.length) {
        await refreshStats();
        return;
      }
      for (const item of pending) {
        if (item.status === 'failed' && (item.retryCount ?? 0) >= 3) continue;
        await updatePendingReport(item.id, { status: 'syncing' });
        try {
          await generateSurveyReport(storedToPhotos(item.photos), item.form, item.installer);
          await removePendingReport(item.id);
          synced += 1;
        } catch (err) {
          const retry = (item.retryCount ?? 0) + 1;
          await updatePendingReport(item.id, {
            status: retry >= 3 ? 'failed' : 'pending',
            retryCount: retry,
            lastError: err instanceof Error ? err.message : 'Sync failed',
          });
        }
      }
      if (synced > 0) {
        await clearSurveyDraft();
        onSynced?.(synced);
      }
    } catch (err) {
      onSyncError?.(err instanceof Error ? err.message : 'Sincronizare eșuată');
    } finally {
      setSyncing(false);
      await refreshStats();
    }
  }, [online, syncing, refreshStats, onSynced, onSyncError]);

  const enqueueOffline = useCallback(async () => {
    await enqueuePendingReport(form, installer, photos);
    await refreshStats();
  }, [form, installer, photos, refreshStats]);

  useEffect(() => {
    void prefetchSurveyOfflineAssets();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await loadSurveyDraft();
      if (cancelled) return;
      if (draft) {
        setDraftSavedAt(draft.updatedAt);
        onDraftLoaded?.(draft);
      }
      setDraftReady(true);
    })();
    void refreshStats();
    return () => {
      cancelled = true;
    };
  }, [refreshStats]);

  useEffect(() => {
    if (!draftReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveSurveyDraft(form, installer, photos)
        .then(() => setDraftSavedAt(new Date().toISOString()))
        .catch(() => void 0);
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draftReady, form, installer, photos]);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    void refreshStats();
    if (wasOfflineRef.current && stats.total > 0 && !autoSyncStartedRef.current) {
      autoSyncStartedRef.current = true;
      void handleSyncPending().finally(() => {
        autoSyncStartedRef.current = false;
        wasOfflineRef.current = false;
      });
    } else if (online) {
      wasOfflineRef.current = false;
    }
  }, [online, stats.total, refreshStats, handleSyncPending]);

  return {
    online,
    draftSavedAt,
    draftReady,
    stats,
    syncing,
    enqueueOffline,
    syncPending: handleSyncPending,
    refreshStats,
  };
}