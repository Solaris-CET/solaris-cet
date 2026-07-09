import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';
import {
  bumpFieldClocks,
  createDraftVersionVector,
  draftFieldPaths,
  type DraftVersionVector,
} from '@/lib/surveyDraftConflict';
import { SURVEY_INDEXEDDB_NAME } from '@/lib/surveyOfflineManifest';

export const SURVEY_DRAFT_SCHEMA = 'solaris-survey-draft-v2';
export const SURVEY_DEVICE_ID_KEY = 'solaris_survey_device_id';
export const SURVEY_DB_NAME = SURVEY_INDEXEDDB_NAME;
export const SURVEY_DB_VERSION = 1;
export const SURVEY_DRAFT_KEY = 'current';
export const DRAFT_STORE = 'drafts';
export const QUEUE_STORE = 'queue';

export const DEFAULT_PHOTO_NAME = 'photo.jpg';
export const DEFAULT_PHOTO_TYPE = 'image/jpeg';

export const STORAGE_ERRORS = {
  openFailed: 'IndexedDB indisponibil',
  requestFailed: 'Citire stocare eșuată',
  txFailed: 'Tranzacție stocare eșuată',
} as const;

export const PENDING_REPORT_STATUSES = ['pending', 'syncing', 'failed'] as const;

export type StoredPhoto = {
  name: string;
  type: string;
  blob: Blob;
};

export type SurveyDraftRecord = {
  key: string;
  form: SurveyFormData;
  installer: InstallerProfile;
  photos: StoredPhoto[];
  updatedAt: string;
  version?: DraftVersionVector;
  draftId?: string;
};

export type PendingReportStatus = (typeof PENDING_REPORT_STATUSES)[number];

export type PendingReportRecord = {
  id: string;
  form: SurveyFormData;
  installer: InstallerProfile;
  photos: StoredPhoto[];
  createdAt: string;
  status?: PendingReportStatus;
  retryCount?: number;
  lastError?: string;
};

export function createPendingReportId(now = Date.now()): string {
  return `pending-${now}`;
}

export function isPendingReportStatus(value: string): value is PendingReportStatus {
  return (PENDING_REPORT_STATUSES as readonly string[]).includes(value);
}

export function queueStatusLabel(status: PendingReportStatus): string {
  const labels: Record<PendingReportStatus, string> = {
    pending: 'În așteptare',
    syncing: 'Se sincronizează',
    failed: 'Eșuat',
  };
  return labels[status];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SURVEY_DB_NAME, SURVEY_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error(STORAGE_ERRORS.openFailed));
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error(STORAGE_ERRORS.requestFailed));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error(STORAGE_ERRORS.txFailed));
      }),
  );
}

export function photosToStored(photos: File[]): StoredPhoto[] {
  return photos.map((file) => ({
    name: file.name || DEFAULT_PHOTO_NAME,
    type: file.type || DEFAULT_PHOTO_TYPE,
    blob: file,
  }));
}

export function storedToPhotos(stored: StoredPhoto[]): File[] {
  return stored.map((item) => new File([item.blob], item.name, { type: item.type }));
}

export function getOrCreateSurveyDeviceId(): string {
  try {
    const existing = localStorage.getItem(SURVEY_DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `dev-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(SURVEY_DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'dev-unknown';
  }
}

export function buildSurveyDraftId(form: SurveyFormData, installer: InstallerProfile): string {
  const base = `${installer.installerId || 'anon'}:${form.clientName}:${form.clientAddress}`.toLowerCase();
  return base.replace(/\s+/g, '-').slice(0, 120) || 'draft-anon';
}

export async function saveSurveyDraft(
  form: SurveyFormData,
  installer: InstallerProfile,
  photos: File[],
  prev?: SurveyDraftRecord | null,
): Promise<SurveyDraftRecord> {
  const deviceId = getOrCreateSurveyDeviceId();
  const paths = draftFieldPaths(form, installer);
  let version = createDraftVersionVector(deviceId, prev?.version);
  version = bumpFieldClocks(version, paths, version.clock);

  const record: SurveyDraftRecord = {
    key: SURVEY_DRAFT_KEY,
    form,
    installer,
    photos: photosToStored(photos),
    updatedAt: new Date().toISOString(),
    version,
    draftId: buildSurveyDraftId(form, installer),
  };
  await tx(DRAFT_STORE, 'readwrite', (store) => store.put(record));
  return record;
}

export async function loadSurveyDraft(): Promise<SurveyDraftRecord | null> {
  try {
    const record = await tx<SurveyDraftRecord | undefined>(DRAFT_STORE, 'readonly', (store) =>
      store.get(SURVEY_DRAFT_KEY),
    );
    return record ?? null;
  } catch {
    return null;
  }
}

export async function clearSurveyDraft(): Promise<void> {
  try {
    await tx(DRAFT_STORE, 'readwrite', (store) => store.delete(SURVEY_DRAFT_KEY));
  } catch {
    void 0;
  }
}

export async function enqueuePendingReport(
  form: SurveyFormData,
  installer: InstallerProfile,
  photos: File[],
  id = createPendingReportId(),
): Promise<string> {
  const record: PendingReportRecord = {
    id,
    form,
    installer,
    photos: photosToStored(photos),
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  await tx(QUEUE_STORE, 'readwrite', (store) => store.put(record));
  return id;
}

export async function updatePendingReport(
  id: string,
  patch: Partial<Pick<PendingReportRecord, 'status' | 'retryCount' | 'lastError'>>,
): Promise<void> {
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(QUEUE_STORE, 'readwrite');
        const store = transaction.objectStore(QUEUE_STORE);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result as PendingReportRecord | undefined;
          if (!existing) {
            resolve();
            return;
          }
          const putReq = store.put({ ...existing, ...patch });
          putReq.onerror = () => reject(putReq.error ?? new Error(STORAGE_ERRORS.requestFailed));
        };
        getReq.onerror = () => reject(getReq.error ?? new Error(STORAGE_ERRORS.requestFailed));
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error ?? new Error(STORAGE_ERRORS.txFailed));
      }),
  );
}

export async function listPendingReports(): Promise<PendingReportRecord[]> {
  try {
    return await tx<PendingReportRecord[]>(QUEUE_STORE, 'readonly', (store) => store.getAll());
  } catch {
    return [];
  }
}

export async function removePendingReport(id: string): Promise<void> {
  await tx(QUEUE_STORE, 'readwrite', (store) => store.delete(id));
}