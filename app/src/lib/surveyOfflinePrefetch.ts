import { SURVEY_OFFLINE_PREFETCH_URLS } from './surveyOfflineManifest';

/** Ask active service worker to precache survey shell assets. */
export async function prefetchSurveyOfflineAssets(extraUrls: string[] = []): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg?.active) return;
  const urls = [...SURVEY_OFFLINE_PREFETCH_URLS, ...extraUrls].slice(0, 60);
  reg.active.postMessage({ type: 'PREFETCH_URLS', urls });
}

/** Probe whether survey shell is available via service worker (online warmup). */
export async function probeSurveyShellOffline(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const controller = navigator.serviceWorker.controller;
  if (!controller) return false;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 4000);

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; ok?: boolean } | null;
      if (!data || data.type !== 'PROBE_SURVEY_SHELL_RESULT') return;
      cleanup();
      resolve(Boolean(data.ok));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    controller.postMessage({ type: 'PROBE_SURVEY_SHELL' });
  });
}