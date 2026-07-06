import type { InstallerProfile, SurveyFormData } from '@/lib/surveyApi';

const DB_NAME = 'solaris-survey-v1';
const DB_VERSION = 1;
const DRAFT_KEY = 'current';
const DRAFT_STORE = 'drafts';
const QUEUE_STORE = 'queue';

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
};

export type PendingReportStatus = 'pending' | 'syncing' | 'failed';

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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
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
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
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
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB tx failed'));
      }),
  );
}

export function photosToStored(photos: File[]): StoredPhoto[] {
  return photos.map((file) => ({
    name: file.name || 'photo.jpg',
    type: file.type || 'image/jpeg',
    blob: file,
  }));
}

export function storedToPhotos(stored: StoredPhoto[]): File[] {
  return stored.map((item) => new File([item.blob], item.name, { type: item.type }));
}

export async function saveSurveyDraft(
  form: SurveyFormData,
  installer: InstallerProfile,
  photos: File[],
): Promise<void> {
  const record: SurveyDraftRecord = {
    key: DRAFT_KEY,
    form,
    installer,
    photos: photosToStored(photos),
    updatedAt: new Date().toISOString(),
  };
  await tx(DRAFT_STORE, 'readwrite', (store) => store.put(record));
}

export async function loadSurveyDraft(): Promise<SurveyDraftRecord | null> {
  try {
    const record = await tx<SurveyDraftRecord | undefined>(DRAFT_STORE, 'readonly', (store) =>
      store.get(DRAFT_KEY),
    );
    return record ?? null;
  } catch {
    return null;
  }
}

export async function clearSurveyDraft(): Promise<void> {
  try {
    await tx(DRAFT_STORE, 'readwrite', (store) => store.delete(DRAFT_KEY));
  } catch {
    void 0;
  }
}

export async function enqueuePendingReport(
  form: SurveyFormData,
  installer: InstallerProfile,
  photos: File[],
): Promise<string> {
  const id = `pending-${Date.now()}`;
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
  const existing = await tx<PendingReportRecord | undefined>(QUEUE_STORE, 'readonly', (store) => store.get(id));
  if (!existing) return;
  await tx(QUEUE_STORE, 'readwrite', (store) =>
    store.put({ ...existing, ...patch }),
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