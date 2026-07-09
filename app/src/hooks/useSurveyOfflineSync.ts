import { useCallback, useEffect, useRef, useState } from 'react';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import { generateSurveyReport } from '@/lib/surveyApi';
import {
  buildDraftPayload,
  mergeStoredPhotos,
  mergeSurveyDrafts,
  resolveConflictChoice,
  type DraftConflictField,
  type DraftMergeResult,
} from '@/lib/surveyDraftConflict';
import {
  buildSurveyDraftId,
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
import {
  fetchServerSurveyDraft,
  pushSurveyDraftSync,
} from '@/lib/surveyDraftSyncClient';
import { getSurveyQueueStats, type SurveyQueueStats } from '@/lib/surveyOfflineQueue';
import { prefetchSurveyOfflineAssets } from '@/lib/surveyOfflinePrefetch';

const SYNC_MESSAGES = {
  syncFailed: 'Sincronizare eșuată',
  itemSyncFailed: 'Sync failed',
} as const;

const DRAFT_AUTOSAVE_MS = 600;

export type UseSurveyOfflineSyncOptions = {
  form: SurveyFormData;
  installer: InstallerProfile;
  photos: File[];
  onSynced?: (count: number) => void;
  onSyncError?: (message: string) => void;
  onDraftLoaded?: (draft: SurveyDraftRecord) => void;
};

export type UseSurveyOfflineSyncResult = {
  online: boolean;
  draftSavedAt: string | null;
  draftReady: boolean;
  stats: SurveyQueueStats;
  syncing: boolean;
  draftConflicts: DraftConflictField[];
  draftMergeResolution: DraftMergeResult['resolution'] | null;
  enqueueOffline: () => Promise<void>;
  syncPending: () => Promise<void>;
  refreshStats: () => Promise<void>;
  resolveDraftConflict: (path: string, choice: 'local' | 'remote') => Promise<void>;
};

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useSurveyOfflineSync({
  form,
  installer,
  photos,
  onSynced,
  onSyncError,
  onDraftLoaded,
}: UseSurveyOfflineSyncOptions): UseSurveyOfflineSyncResult {
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
  const [draftConflicts, setDraftConflicts] = useState<DraftConflictField[]>([]);
  const [draftMergeResolution, setDraftMergeResolution] = useState<DraftMergeResult['resolution'] | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);
  const autoSyncStartedRef = useRef(false);
  const localDraftRef = useRef<SurveyDraftRecord | null>(null);
  const remoteDraftRef = useRef<ReturnType<typeof buildDraftPayload> | null>(null);
  const mergeBaseRef = useRef<DraftMergeResult | null>(null);

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
            lastError: toErrorMessage(err, SYNC_MESSAGES.itemSyncFailed),
          });
        }
      }
      if (synced > 0) {
        await clearSurveyDraft();
        onSynced?.(synced);
      }
    } catch (err) {
      onSyncError?.(toErrorMessage(err, SYNC_MESSAGES.syncFailed));
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

  const pullRemoteDraft = useCallback(async (local: SurveyDraftRecord | null) => {
    if (!online || !local?.draftId) return;
    try {
      const { draft: remote } = await fetchServerSurveyDraft(local.draftId, local.installer.installerId);
      if (!remote?.version) return;
      const localPayload = buildDraftPayload(
        local.form,
        local.installer,
        local.photos,
        local.version ?? { deviceId: 'local', clock: 1, fieldClocks: {} },
        local.updatedAt,
      );
      const remotePayload = buildDraftPayload(
        remote.form,
        remote.installer,
        remote.photoNames.map((name) => ({ name, type: 'image/jpeg', blob: new Blob() })),
        remote.version,
        remote.updatedAt,
      );
      remoteDraftRef.current = remotePayload;
      const merge = mergeSurveyDrafts(localPayload, remotePayload);
      mergeBaseRef.current = merge;
      setDraftConflicts(merge.conflicts);
      setDraftMergeResolution(merge.resolution);
      if (merge.resolution !== 'conflict') {
        const mergedRecord: SurveyDraftRecord = {
          ...local,
          form: merge.form,
          installer: merge.installer,
          photos: mergeStoredPhotos(local.photos, local.photos),
          version: merge.version,
          updatedAt: new Date().toISOString(),
        };
        localDraftRef.current = mergedRecord;
        await saveSurveyDraft(mergedRecord.form, mergedRecord.installer, storedToPhotos(mergedRecord.photos), local);
        onDraftLoaded?.(mergedRecord);
      }
    } catch {
      void 0;
    }
  }, [online, onDraftLoaded]);

  const resolveDraftConflict = useCallback(
    async (path: string, choice: 'local' | 'remote') => {
      const base = mergeBaseRef.current;
      const localPayload = localDraftRef.current
        ? buildDraftPayload(
            localDraftRef.current.form,
            localDraftRef.current.installer,
            localDraftRef.current.photos,
            localDraftRef.current.version ?? { deviceId: 'local', clock: 1, fieldClocks: {} },
            localDraftRef.current.updatedAt,
          )
        : null;
      const remotePayload = remoteDraftRef.current;
      if (!base || !localPayload || !remotePayload) return;
      const resolved = resolveConflictChoice(base, path, choice, localPayload, remotePayload);
      mergeBaseRef.current = resolved;
      setDraftConflicts(resolved.conflicts);
      setDraftMergeResolution(resolved.resolution);
      if (resolved.conflicts.length === 0 && localDraftRef.current) {
        const mergedRecord: SurveyDraftRecord = {
          ...localDraftRef.current,
          form: resolved.form,
          installer: resolved.installer,
          version: resolved.version,
          updatedAt: new Date().toISOString(),
        };
        localDraftRef.current = mergedRecord;
        await saveSurveyDraft(
          mergedRecord.form,
          mergedRecord.installer,
          storedToPhotos(mergedRecord.photos),
          localDraftRef.current,
        );
        onDraftLoaded?.(mergedRecord);
        if (online && mergedRecord.draftId && mergedRecord.version) {
          await pushSurveyDraftSync({
            draftId: mergedRecord.draftId,
            form: mergedRecord.form,
            installer: mergedRecord.installer,
            photoNames: mergedRecord.photos.map((p) => p.name),
            updatedAt: mergedRecord.updatedAt,
            version: mergedRecord.version,
          });
        }
      }
    },
    [online, onDraftLoaded],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await loadSurveyDraft();
      if (cancelled) return;
      localDraftRef.current = draft;
      if (draft) {
        setDraftSavedAt(draft.updatedAt);
        onDraftLoaded?.(draft);
        await pullRemoteDraft(draft);
      }
      setDraftReady(true);
    })();
    void refreshStats();
    return () => {
      cancelled = true;
    };
  }, [refreshStats, onDraftLoaded, pullRemoteDraft]);

  useEffect(() => {
    if (!draftReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const prev = localDraftRef.current;
          const nextRecord = await saveSurveyDraft(form, installer, photos, prev);
          setDraftSavedAt(nextRecord.updatedAt);
          localDraftRef.current = nextRecord;
          if (online && nextRecord.version && nextRecord.draftId) {
            const syncRes = await pushSurveyDraftSync({
              draftId: nextRecord.draftId,
              form: nextRecord.form,
              installer: nextRecord.installer,
              photoNames: photos.map((p) => p.name || 'photo.jpg'),
              updatedAt: nextRecord.updatedAt,
              version: nextRecord.version,
            });
            setDraftConflicts(syncRes.merge?.conflicts ?? []);
            setDraftMergeResolution(syncRes.merge?.resolution ?? (syncRes.status === 'accepted' ? 'clean' : null));
          }
        } catch {
          void 0;
        }
      })();
    }, DRAFT_AUTOSAVE_MS);
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
    draftConflicts,
    draftMergeResolution,
    enqueueOffline,
    syncPending: handleSyncPending,
    refreshStats,
    resolveDraftConflict,
  };
}